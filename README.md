# Manga Management (WPF)

Windows 専用の漫画管理・ビューワーアプリです。ライブラリルート配下の最下層フォルダを 1 冊として検出し、サムネイル付き本棚とビューワーを提供します。

## 前提環境
- Windows 10/11
- .NET 8 SDK (Desktop) がインストール済みであること
- 対応画像形式: webp / png / jpg

## 実行手順
1. リポジトリ直下で依存関係を復元します。
   ```powershell
   dotnet restore
   ```
2. WPF プロジェクトをビルドします。
   ```powershell
   dotnet build MangaManagement\MangaManagement.csproj -c Release
   ```
3. アプリを起動します。初回はライブラリルートフォルダを指定してください。
   ```powershell
   dotnet run --project MangaManagement\MangaManagement.csproj -c Release
   ```

## アプリの挙動メモ
- エントリポイントは `App.xaml` で、起動時に本棚画面 (`Views/MainWindow.xaml`) が開きます。
- ライブラリルート配下を再帰的に走査し、画像を含む最下層フォルダを 1 冊として本棚に並べます。
- サムネイルクリックでビューワーを開き、左右キーでページ送り、Esc で本棚に戻れます。
- 設定（ライブラリパス、最後に開いた作品とページ、ウィンドウ位置/サイズ、除外リスト等）は `%AppData%/MangaManagement/settings.json` に保存され、次回起動時に復元されます。

## よくある操作
- 本棚の右クリックメニューから「フォルダを開く」でエクスプローラーを開けます。
- 「ライブラリから除外」は実ファイルを削除せず、一覧から非表示にするだけです（設定ファイルに記録）。

