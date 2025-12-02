"""メインのエントリポイント（単一ファイル構成）

PySide6 で作る簡易マンガ本棚アプリ。コード全体を一つのファイルにまとめ、
Python 初心者でも流れを追いやすいようにコメントを多めに入れています。
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
import zipfile
from typing import Dict, List, Optional

import py7zr

from PySide6.QtWidgets import (
    QApplication,
    QMainWindow,
    QFileDialog,
    QMessageBox,
    QListWidget,
    QListWidgetItem,
    QListView,
    QLabel,
    QVBoxLayout,
    QWidget,
    QScrollArea,
    QPushButton,
    QHBoxLayout,
    QCheckBox,
)
from PySide6.QtCore import Qt, QSize, Signal
from PySide6.QtGui import QPixmap, QIcon, QKeyEvent

# 画像として扱う拡張子
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}

# 本棚データの保存先（ユーザーホーム直下にシンプルな JSON を置く）
CONFIG_FILE = Path.home() / ".manga_bookshelf.json"


# ==============================
# アーカイブ操作のヘルパー
# ==============================

def get_image_entries(path: Path) -> List[str]:
    """アーカイブ内の画像ファイル名をソートして返す"""

    suffix = path.suffix.lower()
    if suffix in {".zip", ".cbz"}:
        return _get_zip_image_entries(path)
    if suffix == ".7z":
        return _get_7z_image_entries(path)
    return []


def read_image_bytes_from_archive(path: Path, entry_name: str) -> Optional[bytes]:
    """指定されたエントリを bytes で取り出す共通関数"""

    suffix = path.suffix.lower()
    if suffix in {".zip", ".cbz"}:
        return _read_zip_entry(path, entry_name)
    if suffix == ".7z":
        return _read_7z_entry(path, entry_name)
    return None


def get_first_image_bytes(path: Path) -> Optional[bytes]:
    """最初の画像だけ欲しい場合のショートカット"""

    entries = get_image_entries(path)
    if not entries:
        return None
    return read_image_bytes_from_archive(path, entries[0])


def _get_zip_image_entries(path: Path) -> List[str]:
    """zip/cbz 内の画像ファイル名をソートして返す"""

    with zipfile.ZipFile(path, "r") as zf:
        image_names = [
            name
            for name in zf.namelist()
            if Path(name).suffix.lower() in IMAGE_EXTS
        ]

    image_names.sort()
    return image_names


def _get_7z_image_entries(path: Path) -> List[str]:
    """7z 内の画像ファイル名をソートして返す（py7zr使用）"""

    with py7zr.SevenZipFile(path, "r") as archive:
        all_names = archive.getnames()

    image_names = [
        name
        for name in all_names
        if Path(name).suffix.lower() in IMAGE_EXTS
    ]

    image_names.sort()
    return image_names


def _read_zip_entry(path: Path, entry_name: str) -> Optional[bytes]:
    """zip/cbz から特定のファイルを取り出す"""

    try:
        with zipfile.ZipFile(path, "r") as zf:
            with zf.open(entry_name, "r") as img_file:
                return img_file.read()
    except Exception:
        return None


def _read_7z_entry(path: Path, entry_name: str) -> Optional[bytes]:
    """7z から特定のファイルを取り出す（py7zr使用）"""

    try:
        with py7zr.SevenZipFile(path, "r") as archive:
            data_dict = archive.read([entry_name])  # {ファイル名: BytesIO}
            file_obj = data_dict.get(entry_name)
            if file_obj is None:
                return None
            return file_obj.read()
    except Exception:
        return None


# ==============================
# マンガビューア（ページ送り対応）
# ==============================


class MangaViewerWindow(QWidget):
    """マンガのページを前後に送って読めるビューアウィンドウ"""

    # 読んだページ番号を親に知らせるシグナル（0 始まり）
    page_changed = Signal(int)

    def __init__(
        self,
        archive_path: Path,
        image_entries: List[str],
        start_index: int = 0,
        parent=None,
    ):
        super().__init__(parent)
        self.archive_path = archive_path
        self.image_entries = image_entries
        self.current_index = max(0, min(start_index, len(image_entries) - 1))

        self.setWindowTitle(f"{archive_path.name} - ページビューア")
        self.resize(900, 700)

        # スクロール可能にして大きいページも読めるようにする
        self.scroll_area = QScrollArea()
        self.scroll_area.setWidgetResizable(True)

        self.image_label = QLabel()
        self.image_label.setAlignment(Qt.AlignCenter)
        # スクロール領域自体も中央寄せにして、余白ができても真ん中に表示されるようにする
        self.scroll_area.setAlignment(Qt.AlignCenter)
        self.scroll_area.setWidget(self.image_label)

        # --- 操作用のボタンと状態表示 ---
        self.prev_button = QPushButton("◀ 前のページ")
        self.prev_button.clicked.connect(self.show_prev)

        self.next_button = QPushButton("次のページ ▶")
        self.next_button.clicked.connect(self.show_next)

        # 現在のページ / 総ページ数を表示するラベル
        self.page_label = QLabel()

        # ウィンドウに合わせて縮小表示するオプション（オリジナルより大きくはしない）
        self.fit_checkbox = QCheckBox("ウィンドウに合わせて縮小")
        self.fit_checkbox.stateChanged.connect(self._update_displayed_pixmap)

        controls = QHBoxLayout()
        controls.addWidget(self.prev_button)
        controls.addWidget(self.next_button)
        controls.addSpacing(12)
        controls.addWidget(self.fit_checkbox)
        controls.addStretch(1)
        controls.addWidget(self.page_label)

        layout = QVBoxLayout()
        layout.addWidget(self.scroll_area)
        layout.addLayout(controls)
        self.setLayout(layout)

        # キー操作（矢印キー）を受け取れるようにフォーカスを許可
        self.setFocusPolicy(Qt.StrongFocus)

        # 最初のページを読み込む
        self._load_current_page()

    # ------------------------------
    # ページ読み込み関連
    # ------------------------------

    def _load_current_page(self) -> None:
        """現在のインデックスのページを読み込んで表示"""

        if not self.image_entries:
            self.image_label.setText("画像ファイルが見つかりませんでした…😢")
            return

        entry = self.image_entries[self.current_index]
        image_data = read_image_bytes_from_archive(self.archive_path, entry)

        if not image_data:
            self.image_label.setText("このページの読み込みに失敗しました…")
            return

        pixmap = QPixmap()
        if not pixmap.loadFromData(image_data):
            self.image_label.setText("画像データの読み込みに失敗しました…")
            return

        self._current_pixmap = pixmap
        self._update_displayed_pixmap()

        # ページ数表示とタイトルを更新
        self.page_label.setText(
            f"{self.current_index + 1} / {len(self.image_entries)} ページ"
        )
        self.setWindowTitle(
            f"{self.archive_path.name} - {self.current_index + 1}/{len(self.image_entries)}"
        )

        # 親（本棚）に現在ページを知らせて記憶してもらう
        self.page_changed.emit(self.current_index)

        # ボタンの有効 / 無効も更新
        self.prev_button.setEnabled(self.current_index > 0)
        self.next_button.setEnabled(self.current_index < len(self.image_entries) - 1)

    def _update_displayed_pixmap(self) -> None:
        """フィットオプションに応じてラベルへ画像をセット"""

        pixmap = getattr(self, "_current_pixmap", None)
        if pixmap is None:
            return

        if self.fit_checkbox.isChecked():
            # スクロールエリアの内側サイズに収まるよう縮小（拡大はしない）
            viewport_size = self.scroll_area.viewport().size()
            if pixmap.width() > viewport_size.width() or pixmap.height() > viewport_size.height():
                scaled = pixmap.scaled(
                    viewport_size,
                    Qt.KeepAspectRatio,
                    Qt.SmoothTransformation,
                )
                self.image_label.setPixmap(scaled)
            else:
                self.image_label.setPixmap(pixmap)
        else:
            self.image_label.setPixmap(pixmap)

    # ------------------------------
    # ページ送り（ボタン・ショートカット）
    # ------------------------------

    def show_next(self):
        if self.current_index < len(self.image_entries) - 1:
            self.current_index += 1
            self._load_current_page()

    def show_prev(self):
        if self.current_index > 0:
            self.current_index -= 1
            self._load_current_page()

    def keyPressEvent(self, event: QKeyEvent):
        """キーボードの左右キーでページ送り"""

        if event.key() == Qt.Key_Right:
            self.show_next()
            event.accept()
            return
        if event.key() == Qt.Key_Left:
            self.show_prev()
            event.accept()
            return

        super().keyPressEvent(event)

    def resizeEvent(self, event):
        """ウィンドウサイズが変わったら縮小表示を再計算"""

        super().resizeEvent(event)
        self._update_displayed_pixmap()


# ==============================
# メインウィンドウ（本棚）
# ==============================


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()

        # --- ウィンドウの基本設定 ---
        self.setWindowTitle("Manga Bookshelf（仮）")
        self.resize(900, 600)

        # 選んだ漫画ファイルのパス一覧
        self.book_paths: List[Path] = []

        # ビューアウィンドウの参照を保持しておく（ガベージコレクション対策）
        self.open_viewers: List[MangaViewerWindow] = []

        # 読みかけのページを覚えておく簡易メモ（アプリ終了で消える）
        self.last_positions: Dict[str, int] = {}

        # --- 本棚ビューを作成（中央ウィジェットにする） ---
        self._create_bookshelf_view()

        # 初期レイアウトを反映（表示前でもおおよそ狙いのサイズ感に）
        self._adjust_bookshelf_layout()

        # --- メニューバーを作成 ---
        self._create_menu_bar()

        # --- 保存された本棚を自動復元（前回の状態を即座に表示） ---
        self._restore_bookshelf()

    def _create_bookshelf_view(self):
        # 本棚っぽく本を並べるための QListWidget
        self.books_view = QListWidget()

        # グリッド状（アイコンモード）で並べる
        self.books_view.setViewMode(QListView.IconMode)
        self.books_view.setResizeMode(QListView.Adjust)
        self.books_view.setWrapping(True)
        self.books_view.setMovement(QListView.Static)

        # spacing / iconSize / gridSize はウィンドウ幅に応じて後で調整する
        # （ここではデフォルトのみ入れておく）
        self.books_view.setIconSize(QSize(96, 128))
        self.books_view.setGridSize(QSize(120, 160))
        self.books_view.setSpacing(12)

        # アイテムをダブルクリックしたときの処理をつなぐ
        self.books_view.itemDoubleClicked.connect(self.open_book)

        self.setCentralWidget(self.books_view)

    def _create_menu_bar(self):
        menu_bar = self.menuBar()

        # --- 「ファイル(F)」メニュー ---
        file_menu = menu_bar.addMenu("ファイル(&F)")

        add_folder_action = file_menu.addAction("漫画フォルダを追加")
        add_folder_action.triggered.connect(self.add_manga_folder)

        file_menu.addSeparator()

        exit_action = file_menu.addAction("終了")
        exit_action.triggered.connect(self.close)

        # --- 「ヘルプ(H)」メニュー ---
        help_menu = menu_bar.addMenu("ヘルプ(&H)")

        about_action = help_menu.addAction("このアプリについて")
        about_action.triggered.connect(self.show_about_dialog)

    # ==============================
    # メニューの中身
    # ==============================

    def add_manga_folder(self):
        # フォルダ選択ダイアログ
        directory = QFileDialog.getExistingDirectory(
            self,
            "漫画フォルダを選択してください",
            "",
        )

        if not directory:
            return  # キャンセル

        folder_path = Path(directory)

        # 対象とする拡張子
        target_exts = {".zip", ".cbz", ".7z"}

        manga_files = [
            entry
            for entry in folder_path.iterdir()
            if entry.is_file() and entry.suffix.lower() in target_exts
        ]

        # 表示順がバラバラにならないよう、名前順でソート
        manga_files.sort(key=lambda p: p.name.lower())

        if not manga_files:
            QMessageBox.information(
                self,
                "漫画ファイルが見つかりません",
                "このフォルダには .zip / .cbz / .7z の漫画ファイルがなかったよ〜🥲",
            )
            return

        # 既存の本棚に新しい本をマージ（複数フォルダ対応）
        merged: Dict[str, Path] = {str(p): p for p in self.book_paths}
        for p in manga_files:
            merged[str(p)] = p

        combined_list = sorted(merged.values(), key=lambda p: p.name.lower())

        # 見つかった漫画ファイルで本棚ビューを更新し、保存も行う
        self.update_bookshelf(combined_list, save=True)

    def update_bookshelf(self, manga_files: List[Path], save: bool = True):
        """本棚を与えられたファイル一覧で更新（必要なら保存もする）"""

        # 存在しないファイルを除外しつつ内部状態を更新
        valid_files = [p for p in manga_files if p.is_file()]
        self.book_paths = valid_files

        # いったん本棚をクリアしてから再描画
        self.books_view.clear()

        for path in valid_files:
            title = path.stem  # 拡張子抜きのファイル名
            item = QListWidgetItem(title)

            # 1枚目の画像をサムネイルとして使う
            image_data = get_first_image_bytes(path)
            if image_data is not None:
                pixmap = QPixmap()
                if pixmap.loadFromData(image_data):
                    # アイコンサイズに合わせて縮小（アスペクト比維持）
                    thumb = pixmap.scaled(
                        self.books_view.iconSize(),
                        Qt.KeepAspectRatio,
                        Qt.SmoothTransformation,
                    )
                    item.setIcon(QIcon(thumb))

            # どのアイテムがどのパスか分かるようにデータを入れておく
            item.setData(Qt.UserRole, str(path))
            self.books_view.addItem(item)

        # 任意指定があれば、本棚リストを JSON に保存
        if save:
            self._save_bookshelf_to_disk()

    # ==============================
    # 本を開く処理（ダブルクリック時）
    # ==============================

    def open_book(self, item: QListWidgetItem):
        path_str = item.data(Qt.UserRole)
        if not path_str:
            return

        path = Path(path_str)

        try:
            entries = get_image_entries(path)
            if not entries:
                QMessageBox.warning(
                    self,
                    "画像が見つからない",
                    "このアーカイブの中に画像ファイルが見つからなかったよ😢",
                )
                return

            # 前回読んだページがあればそこから再開
            start_index = self.last_positions.get(str(path), 0)
            start_index = min(max(0, start_index), len(entries) - 1)

            # ビューアウィンドウを開く
            viewer = MangaViewerWindow(path, entries, start_index=start_index, parent=self)
            viewer.page_changed.connect(lambda idx, p=path: self._remember_page(p, idx))
            viewer.show()
            self.open_viewers.append(viewer)

            # 閉じられたらリストから自動で消す
            viewer.destroyed.connect(lambda _=None, v=viewer: self._forget_viewer(v))

        except Exception as e:
            QMessageBox.critical(
                self,
                "エラー",
                f"ファイルを開くときにエラーが起きちゃった…\n{e}",
            )

    # ==============================
    # その他
    # ==============================

    def _forget_viewer(self, viewer: MangaViewerWindow) -> None:
        """閉じたビューアをリストから除去"""

        if viewer in self.open_viewers:
            self.open_viewers.remove(viewer)

    def _remember_page(self, path: Path, index: int) -> None:
        """どの本を何ページ目まで読んだかの簡易メモ"""

        self.last_positions[str(path)] = index

    def show_about_dialog(self):
        QMessageBox.information(
            self,
            "このアプリについて",
            "Manga Bookshelf（仮）\n\nぽんち専用・ローカル漫画本棚アプリだよ〜♡",
        )

    # ==============================
    # 本棚データの保存・復元
    # ==============================

    def _save_bookshelf_to_disk(self) -> None:
        """現在の本棚リストを JSON に保存（失敗してもアプリは止めない）"""

        data = {"books": [str(p) for p in self.book_paths]}
        try:
            CONFIG_FILE.write_text(
                json.dumps(data, ensure_ascii=False, indent=2),
                encoding="utf-8",
            )
        except Exception:
            # 保存に失敗してもユーザー操作は続けられるよう握りつぶす
            pass

    def _load_bookshelf_from_disk(self) -> List[Path]:
        """保存された本棚リストを読み込んで Path のリストで返す"""

        if not CONFIG_FILE.exists():
            return []

        try:
            raw = CONFIG_FILE.read_text(encoding="utf-8")
            data = json.loads(raw)
            if not isinstance(data, dict):
                return []
            books = data.get("books", [])
            if not isinstance(books, list):
                return []
            return [Path(x) for x in books if isinstance(x, str)]
        except Exception:
            return []

    def _restore_bookshelf(self) -> None:
        """起動時に前回の本棚を読み込み、存在するものだけ並べ直す"""

        saved_paths = self._load_bookshelf_from_disk()
        if not saved_paths:
            return

        # 失われたファイルはスキップ（クラッシュ回避）
        valid_paths = [p for p in saved_paths if p.is_file()]

        if not valid_paths:
            return

        # 表示順を揃えてから再描画（保存されたリストは信頼するが、順序も整える）
        valid_paths.sort(key=lambda p: p.name.lower())
        self.update_bookshelf(valid_paths, save=False)

    # ==============================
    # レイアウト調整（5列×4行を目安に）
    # ==============================

    def resizeEvent(self, event):
        """ウィンドウサイズ変更時に本棚のグリッドを再計算"""

        super().resizeEvent(event)
        self._adjust_bookshelf_layout()

    def _adjust_bookshelf_layout(self):
        """ウィンドウ幅に応じて gridSize / iconSize / spacing を調整"""

        if not hasattr(self, "books_view"):
            return

        # 目標値（最大化時に 5 列 × 4 行で 20 冊見える想定）
        base_icon = QSize(96, 128)  # 目安のサムネサイズ
        base_grid = QSize(120, 160)  # 1 冊分の枠の目安
        spacing = 12  # 行間・列間（おおむね 10〜15px）

        # ビューポート幅を基準に、何列入るかを決める
        available_width = self.books_view.viewport().width()
        if available_width <= 0:
            available_width = self.books_view.width()

        # 最大化時は画面幅（タイトルバー等を除く）も参照して、5 列狙いの計算を安定させる
        if self.isMaximized() and self.screen():
            available_width = max(available_width, self.screen().availableGeometry().width())

        min_slot = base_grid.width() + spacing  # 最低限 1 枠に必要な幅

        # 通常時は入るだけ詰め、最大化時は 5 列を優先（無理なら入る数に落とす）
        if self.isMaximized():
            # 5 列置ける幅があれば積極的に 5 列に寄せる
            if available_width >= min_slot * 5:
                columns = 5
            else:
                columns = max(1, available_width // min_slot)
        else:
            columns = max(1, min(5, available_width // min_slot))

        # 決まった列数で幅を割り、目安サイズを上限にして密度を保つ
        total_spacing = spacing * (columns + 1)
        available_per_column = max(72, (available_width - total_spacing) // max(1, columns))
        grid_width = min(base_grid.width(), available_per_column)

        # 高さも 3:4 の比率に合わせ、最低値を確保
        grid_height = max(96, int(grid_width * (base_grid.height() / base_grid.width())))

        # アイコンは枠より一回り小さくし、アスペクト比を維持（上限は目安サイズ）
        scale = grid_width / base_grid.width()
        icon_width = max(64, int(base_icon.width() * scale))
        icon_height = max(84, int(base_icon.height() * scale))

        self.books_view.setSpacing(spacing)
        self.books_view.setGridSize(QSize(grid_width, grid_height))
        self.books_view.setIconSize(QSize(icon_width, icon_height))

    def closeEvent(self, event):
        """終了時に本棚リストを保存してから閉じる"""

        self._save_bookshelf_to_disk()
        super().closeEvent(event)


def main():
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
