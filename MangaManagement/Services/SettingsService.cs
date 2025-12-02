using System.IO;
using System.Text.Json;

namespace MangaManagement.Services;

/// <summary>
/// 設定ファイル（ライブラリパスや最終ページ位置、ウィンドウ状態）の読み書きを担当する。
/// </summary>
public class SettingsService
{
    private readonly string _configPath;

    public SettingsService()
    {
        var folder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "MangaManagement");
        if (!Directory.Exists(folder))
        {
            Directory.CreateDirectory(folder);
        }
        _configPath = Path.Combine(folder, "settings.json");
    }

    public AppSettings Load()
    {
        try
        {
            if (!File.Exists(_configPath))
            {
                return new AppSettings();
            }

            var raw = File.ReadAllText(_configPath);
            var data = JsonSerializer.Deserialize<AppSettings>(raw);
            return data ?? new AppSettings();
        }
        catch
        {
            // 壊れた場合でも初期値で起動できるよう握りつぶす
            return new AppSettings();
        }
    }

    public void Save(AppSettings settings)
    {
        try
        {
            var json = JsonSerializer.Serialize(settings, new JsonSerializerOptions
            {
                WriteIndented = true
            });
            File.WriteAllText(_configPath, json);
        }
        catch
        {
            // 書き込み失敗時も動作を継続する
        }
    }
}

/// <summary>
/// 永続化対象の設定オブジェクト。
/// </summary>
public class AppSettings
{
    public string? LibraryPath { get; set; }

    /// <summary>最後に開いていた作品フォルダ。</summary>
    public string? LastOpenedFolder { get; set; }

    /// <summary>フォルダごとの最終ページ位置（0-based）。</summary>
    public Dictionary<string, int> LastPositions { get; set; } = new();

    /// <summary>ライブラリ一覧から除外するフォルダの集合（実ファイル削除は行わない）。</summary>
    public HashSet<string> ExcludedFolders { get; set; } = new();

    /// <summary>ウィンドウの位置とサイズ。</summary>
    public double? WindowTop { get; set; }
    public double? WindowLeft { get; set; }
    public double? WindowWidth { get; set; }
    public double? WindowHeight { get; set; }
    public WindowState? WindowState { get; set; }
}

/// <summary>
/// WindowState をシリアライズするためのシンプルな列挙型。
/// </summary>
public enum WindowState
{
    Normal,
    Minimized,
    Maximized
}
