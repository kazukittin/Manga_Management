using System.Windows;
using System.Windows.Threading;

namespace MangaManagement;

/// <summary>
/// アプリケーションのエントリポイント。StartupUri で本棚画面を開く。
/// グローバル例外を捕捉して即時終了を防止し、ユーザーへ内容を通知する。
/// </summary>
public partial class App : System.Windows.Application
{
    private bool _hasShownUnhandledError;

    protected override void OnStartup(StartupEventArgs e)
    {
        // 予期せぬ例外でプロセスが即時終了しないようにメッセージを表示する
        DispatcherUnhandledException += OnDispatcherUnhandledException;
        AppDomain.CurrentDomain.UnhandledException += OnUnhandledException;
        ShutdownMode = ShutdownMode.OnMainWindowClose;
        base.OnStartup(e);
    }

    private void OnDispatcherUnhandledException(object sender, DispatcherUnhandledExceptionEventArgs e)
    {
        ShowFatalError(e.Exception);
        e.Handled = true; // アプリの即時終了を抑止
    }

    private void OnUnhandledException(object? sender, UnhandledExceptionEventArgs e)
    {
        if (e.ExceptionObject is Exception ex)
        {
            ShowFatalError(ex);
        }
    }

    /// <summary>
    /// 例外を 1 回だけユーザーへ通知し、連続メッセージボックスの連鎖を防ぐ。
    /// </summary>
    private void ShowFatalError(Exception ex)
    {
        if (_hasShownUnhandledError)
        {
            return;
        }

        _hasShownUnhandledError = true;
        System.Windows.MessageBox.Show($"予期せぬエラーが発生しました。\n{ex.Message}", "エラー", MessageBoxButton.OK, MessageBoxImage.Error);
        // 致命的な状態が続くのを防ぐため、ダイアログ後に終了させる
        Shutdown();
    }
}
