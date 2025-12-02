using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Windows.Input;
using MangaManagement.Models;
using MangaManagement.Services;
using MangaManagement.Utilities;

namespace MangaManagement.ViewModels;

/// <summary>
/// 本棚画面の状態と操作をまとめた ViewModel。
/// </summary>
public class MainViewModel : INotifyPropertyChanged
{
    private readonly SettingsService _settingsService;
    private readonly LibraryScanner _scanner;
    private readonly Dictionary<string, int> _lastPositions;
    private readonly HashSet<string> _excludedFolders;
    private string _libraryPath = string.Empty;
    private double _itemWidth = 160;
    private double _itemHeight = 210;
    private bool _isLoading;
    private CancellationTokenSource? _scanCts;

    public ObservableCollection<MangaEntry> MangaList { get; } = new();

    /// <summary>最終ページ保存の読み出し用スナップショット。</summary>
    public IReadOnlyDictionary<string, int> LastPositions => _lastPositions;

    /// <summary>除外対象フォルダ一覧（実ファイル削除は行わず一覧から除外するためのメモリ管理用）。</summary>
    public IReadOnlyCollection<string> ExcludedFolders => _excludedFolders;

    /// <summary>ライブラリフォルダの現在パス。</summary>
    public string LibraryPath
    {
        get => _libraryPath;
        set { _libraryPath = value; OnPropertyChanged(); }
    }

    /// <summary>グリッドの各タイル幅（ウィンドウサイズに合わせて変動）。</summary>
    public double ItemWidth
    {
        get => _itemWidth;
        set { _itemWidth = value; OnPropertyChanged(); }
    }

    /// <summary>グリッドの各タイル高さ（ウィンドウサイズに合わせて変動）。</summary>
    public double ItemHeight
    {
        get => _itemHeight;
        set { _itemHeight = value; OnPropertyChanged(); }
    }

    /// <summary>ライブラリを読み込み中かどうか。</summary>
    public bool IsLoading
    {
        get => _isLoading;
        set { _isLoading = value; OnPropertyChanged(); }
    }

    public ICommand BrowseLibraryCommand { get; }
    public ICommand RefreshLibraryCommand { get; }
    public ICommand RemoveFromLibraryCommand { get; }
    public ICommand OpenFolderCommand { get; }

    /// <summary>ビューワを開く要求イベント（View がハンドルする）。</summary>
    public event Action<MangaEntry>? OpenViewerRequested;

    public MainViewModel(SettingsService settingsService, LibraryScanner scanner)
    {
        _settingsService = settingsService;
        _scanner = scanner;

        var loaded = _settingsService.Load();
        _libraryPath = loaded.LibraryPath ?? string.Empty;
        _lastPositions = loaded.LastPositions;
        _excludedFolders = loaded.ExcludedFolders;

        BrowseLibraryCommand = new RelayCommand(_ => BrowseLibrary());
        RefreshLibraryCommand = new RelayCommand(async _ => await ReloadLibraryAsync());
        RemoveFromLibraryCommand = new RelayCommand(param => RemoveFromLibrary(param as MangaEntry));
        OpenFolderCommand = new RelayCommand(param => OpenFolder(param as MangaEntry));

        // 起動時に前回のライブラリを自動復元
        if (!string.IsNullOrWhiteSpace(_libraryPath) && Directory.Exists(_libraryPath))
        {
            _ = ReloadLibraryAsync();
        }
    }

    /// <summary>
    /// フォルダ選択ダイアログでライブラリを変更する。
    /// </summary>
    private void BrowseLibrary()
    {
        using var dialog = new FolderBrowserDialog
        {
            Description = "漫画のライブラリフォルダを選択してください"
        };

        if (Directory.Exists(LibraryPath))
        {
            dialog.SelectedPath = LibraryPath;
        }

        if (dialog.ShowDialog() == DialogResult.OK)
        {
            LibraryPath = dialog.SelectedPath;
            _excludedFolders.Clear(); // ライブラリ切り替え時は除外リストをリセット
            _ = ReloadLibraryAsync();
            PersistSettings();
        }
    }

    /// <summary>
    /// ライブラリパスを元に漫画リストを再構築する（非同期で走査）。
    /// </summary>
    public async Task ReloadLibraryAsync()
    {
        if (!Directory.Exists(LibraryPath))
        {
            MangaList.Clear();
            return;
        }

        _scanCts?.Cancel();
        _scanCts = new CancellationTokenSource();
        var token = _scanCts.Token;

        IsLoading = true;
        try
        {
            var items = await _scanner.ScanAsync(LibraryPath, _excludedFolders, token);
            MangaList.Clear();
            foreach (var item in items)
            {
                MangaList.Add(item);
            }
        }
        finally
        {
            IsLoading = false;
            PersistSettings();
        }
    }

    /// <summary>
    /// 特定作品の最終ページを保存する。
    /// </summary>
    public void SaveLastPosition(string folderPath, int pageIndex)
    {
        _lastPositions[folderPath] = pageIndex;
        PersistSettings();
    }

    /// <summary>
    /// 保存済みのページ位置を返す（未登録なら 0）。
    /// </summary>
    public int GetLastPosition(string folderPath)
    {
        return _lastPositions.TryGetValue(folderPath, out var index) ? index : 0;
    }

    /// <summary>
    /// サムネイルクリックからビューワを開く。
    /// </summary>
    public void OpenManga(MangaEntry entry)
    {
        OpenViewerRequested?.Invoke(entry);
        // 最後に開いた作品を覚えておく
        _settingsService.Save(new AppSettings
        {
            LibraryPath = LibraryPath,
            LastPositions = new Dictionary<string, int>(_lastPositions),
            ExcludedFolders = new HashSet<string>(_excludedFolders),
            LastOpenedFolder = entry.FolderPath
        });
    }

    private void RemoveFromLibrary(MangaEntry? entry)
    {
        if (entry == null)
        {
            return;
        }
        // 実ファイルは削除せず、除外リストに追加して一覧から非表示にする
        _excludedFolders.Add(entry.FolderPath);
        MangaList.Remove(entry);
        PersistSettings();
    }

    private void OpenFolder(MangaEntry? entry)
    {
        if (entry == null)
        {
            return;
        }

        try
        {
            System.Diagnostics.Process.Start(new System.Diagnostics.ProcessStartInfo
            {
                FileName = entry.FolderPath,
                UseShellExecute = true
            });
        }
        catch
        {
            // Explorer 起動失敗時もアプリが落ちないよう握りつぶす
        }
    }

    private void PersistSettings()
    {
        _settingsService.Save(new AppSettings
        {
            LibraryPath = LibraryPath,
            LastPositions = new Dictionary<string, int>(_lastPositions),
            ExcludedFolders = new HashSet<string>(_excludedFolders)
        });
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}
