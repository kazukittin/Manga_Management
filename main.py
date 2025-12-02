import sys
from pathlib import Path
import zipfile

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
)
from PySide6.QtCore import Qt, QSize
from PySide6.QtGui import QPixmap, QIcon

# 画像として扱う拡張子
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"}


class ImageViewerWindow(QWidget):
    """選んだ本の1ページ目を表示する簡単ビューア"""

    def __init__(self, title: str, image_data: bytes, parent=None):
        super().__init__(parent)
        self.setWindowTitle(title)
        self.resize(800, 600)

        # スクロールできるようにする（大きい画像対策）
        scroll_area = QScrollArea()
        scroll_area.setWidgetResizable(True)

        self.image_label = QLabel()
        self.image_label.setAlignment(Qt.AlignCenter)

        # bytes から QPixmap に読み込み
        pixmap = QPixmap()
        if not pixmap.loadFromData(image_data):
            self.image_label.setText("画像の読み込みに失敗しちゃった…😢")
        else:
            self.image_label.setPixmap(pixmap)

        scroll_area.setWidget(self.image_label)

        layout = QVBoxLayout()
        layout.addWidget(scroll_area)

        self.setLayout(layout)


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()

        # --- ウィンドウの基本設定 ---
        self.setWindowTitle("Manga Bookshelf（仮）")
        self.resize(900, 600)

        # 選んだ漫画ファイルのパス一覧
        self.book_paths = []

        # --- 本棚ビューを作成（中央ウィジェットにする） ---
        self._create_bookshelf_view()

        # --- メニューバーを作成 ---
        self._create_menu_bar()

    def _create_bookshelf_view(self):
        # 本棚っぽく本を並べるための QListWidget
        self.books_view = QListWidget()

        # グリッド状（アイコンモード）で並べる
        self.books_view.setViewMode(QListView.IconMode)
        self.books_view.setResizeMode(QListView.Adjust)
        self.books_view.setWrapping(True)
        self.books_view.setMovement(QListView.Static)

        # 本のサイズ感（仮）
        self.books_view.setIconSize(QSize(96, 128))
        self.books_view.setGridSize(QSize(120, 160))
        self.books_view.setSpacing(10)

        # アイテムをダブルクリックしたときの処理をつなぐ
        self.books_view.itemDoubleClicked.connect(self.open_book_first_page)

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

        manga_files = []
        for entry in folder_path.iterdir():
            if entry.is_file() and entry.suffix.lower() in target_exts:
                manga_files.append(entry)

        if not manga_files:
            QMessageBox.information(
                self,
                "漫画ファイルが見つかりません",
                "このフォルダには .zip / .cbz / .7z の漫画ファイルがなかったよ〜🥲",
            )
            return

        # 見つかった漫画ファイルで本棚ビューを更新
        self.update_bookshelf(manga_files)

    def update_bookshelf(self, manga_files):
        # いったん本棚をクリア
        self.books_view.clear()
        self.book_paths = manga_files

        for path in manga_files:
            title = path.stem  # 拡張子抜きのファイル名
            item = QListWidgetItem(title)

            # 1枚目の画像をサムネイルとして使う
            image_data = self._get_first_image_bytes(path)
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

    # ==============================
    # 本を開く処理（ダブルクリック時）
    # ==============================

    def open_book_first_page(self, item: QListWidgetItem):
        path_str = item.data(Qt.UserRole)
        if not path_str:
            return

        path = Path(path_str)

        try:
            image_data = self._get_first_image_bytes(path)
            if image_data is None:
                QMessageBox.warning(
                    self,
                    "画像が見つからない",
                    "このアーカイブの中に画像ファイルが見つからなかったよ😢",
                )
                return

            # ビューアウィンドウを開く
            viewer = ImageViewerWindow(path.name, image_data, self)
            viewer.show()

        except Exception as e:
            QMessageBox.critical(
                self,
                "エラー",
                f"ファイルを開くときにエラーが起きちゃった…\n{e}",
            )

    # ==============================
    # アーカイブから1枚目の画像を取り出す共通関数
    # ==============================

    def _get_first_image_bytes(self, path: Path):
        """zip / cbz / 7z の中から最初の画像ファイルを bytes で返す"""
        suffix = path.suffix.lower()
        if suffix in {".zip", ".cbz"}:
            return self._get_first_image_from_zip(path)
        elif suffix == ".7z":
            return self._get_first_image_from_7z(path)
        else:
            return None

    def _get_first_image_from_zip(self, path: Path):
        """zip/cbz から最初の画像ファイルを取り出す"""
        with zipfile.ZipFile(path, "r") as zf:
            # 画像ファイルだけに絞る
            image_names = [
                name
                for name in zf.namelist()
                if Path(name).suffix.lower() in IMAGE_EXTS
            ]

            if not image_names:
                return None

            # 名前順にソートして一番先頭を使う
            image_names.sort()
            first_name = image_names[0]

            with zf.open(first_name, "r") as img_file:
                return img_file.read()

    def _get_first_image_from_7z(self, path: Path):
        """7z から最初の画像ファイルを取り出す（py7zr使用）"""
        with py7zr.SevenZipFile(path, "r") as archive:
            all_names = archive.getnames()

            image_names = [
                name
                for name in all_names
                if Path(name).suffix.lower() in IMAGE_EXTS
            ]

            if not image_names:
                return None

            image_names.sort()
            first_name = image_names[0]

            # read は {ファイル名: BytesIO} の dict を返す
            data_dict = archive.read([first_name])
            file_obj = data_dict.get(first_name)
            if file_obj is None:
                return None

            return file_obj.read()

    # ==============================
    # その他
    # ==============================

    def show_about_dialog(self):
        QMessageBox.information(
            self,
            "このアプリについて",
            "Manga Bookshelf（仮）\n\nぽんち専用・ローカル漫画本棚アプリだよ〜♡",
        )


def main():
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
