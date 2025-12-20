@echo off
chcp 65001 >nul
echo ================================================
echo   Book Library - ビルドスクリプト
echo ================================================
echo.

cd /d "%~dp0"

echo [1/4] 依存関係の確認...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo エラー: npm install に失敗しました
    pause
    exit /b 1
)

echo.
echo [2/4] TypeScriptのコンパイル...
call npx tsc
if %ERRORLEVEL% NEQ 0 (
    echo エラー: TypeScriptのコンパイルに失敗しました
    pause
    exit /b 1
)

echo.
echo [3/4] Viteビルド...
call npx vite build
if %ERRORLEVEL% NEQ 0 (
    echo エラー: Viteビルドに失敗しました
    pause
    exit /b 1
)

echo.
echo [4/4] Electronパッケージング...
call npx electron-builder --win
if %ERRORLEVEL% NEQ 0 (
    echo エラー: Electronパッケージングに失敗しました
    pause
    exit /b 1
)

echo.
echo ================================================
echo   ビルド完了！
echo   出力先: release\1.0.0\
echo ================================================
echo.

:: 出力フォルダを開く
explorer "release\1.0.0"

pause
