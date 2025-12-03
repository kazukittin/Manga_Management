using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Input;
using MangaManagement.Models;
using MangaManagement.Services;
using MangaManagement.ViewModels;

namespace MangaManagement.Views;

/// <summary>
/// 本棚画面のコードビハインド。ビュー操作と ViewModel イベントの橋渡しを行う。
/// </summary>
public partial class MainWindow : Window
{
    private readonly MainViewModel _viewModel;
    private readonly LibraryScanner _scanner;
    private readonly SettingsService _settings;
    private readonly ICommand _itemClickCommand;

    public MainWindow()
    {
        InitializeComponent();
        _scanner = new LibraryScanner();
        _settings = new SettingsService();
        _viewModel = new MainViewModel(_settings, _scanner);
        _viewModel.OpenViewerRequested += OnOpenViewerRequested;
        DataContext = _viewModel;

        _itemClickCommand = new Utilities.RelayCommand(param =>
        {
            if (param is MangaEntry entry)
            {
                _viewModel.OpenManga(entry);
            }
        });
    }

    private void OnOpenViewerRequested(MangaEntry entry)
    {
        var pages = _scanner.GetPages(entry.FolderPath);
        var startIndex = _viewModel.GetLastPosition(entry.FolderPath);
        var viewer = new ViewerWindow(entry.Title, pages, startIndex, index =>
        {
            _viewModel.SaveLastPosition(entry.FolderPath, index);
        });

        viewer.Owner = this;
        viewer.ShowDialog();
    }

    /// <summary>
    /// ウィンドウサイズ変更でアイテム幅を再計算し、最大化時に 5 列を維持する。
    /// </summary>
    private void Window_SizeChanged(object sender, SizeChangedEventArgs e)
    {
        var columns = 5; // 最大化時の目標列数
        var horizontalPadding = 80; // スクロールバーや左右余白の分
        var availableWidth = Math.Max(ActualWidth - horizontalPadding, 400);
        var itemWidth = (availableWidth / columns) - 16; // マージン分を考慮
        _viewModel.ItemWidth = Math.Max(160, itemWidth);
        _viewModel.ItemHeight = _viewModel.ItemWidth * 1.35;
    }

    /// <summary>
    /// サムネイルクリック時に ViewModel から呼ばれるコマンドを提供する。
    /// </summary>
    public ICommand ItemClickCommand => _itemClickCommand;

    private async void Window_Loaded(object sender, RoutedEventArgs e)
    {
        RestoreWindowPlacement();
        // ロード完了後に最後に開いた作品があれば自動で選択する
        await RestoreLibraryAsync();
    }

    private async Task RestoreLibraryAsync()
    {
        await _viewModel.ReloadLibraryAsync();

        var settings = _settings.Load();
        if (!string.IsNullOrWhiteSpace(settings.LastOpenedFolder))
        {
            var entry = _viewModel.MangaList.FirstOrDefault(x => x.FolderPath == settings.LastOpenedFolder);
            if (entry != null)
            {
                _viewModel.OpenManga(entry);
            }
        }
    }

    private void RestoreWindowPlacement()
    {
        var settings = _settings.Load();
        if (settings.WindowTop.HasValue && settings.WindowLeft.HasValue)
        {
            Top = settings.WindowTop.Value;
            Left = settings.WindowLeft.Value;
        }
        if (settings.WindowWidth.HasValue && settings.WindowHeight.HasValue)
        {
            Width = settings.WindowWidth.Value;
            Height = settings.WindowHeight.Value;
        }
        if (settings.WindowState.HasValue)
        {
            WindowState = settings.WindowState.Value switch
            {
                Services.WindowState.Maximized => System.Windows.WindowState.Maximized,
                Services.WindowState.Minimized => System.Windows.WindowState.Minimized,
                _ => System.Windows.WindowState.Normal
            };
        }
    }

    private void SaveWindowPlacement()
    {
        var state = WindowState == System.Windows.WindowState.Maximized ? Services.WindowState.Maximized
            : WindowState == System.Windows.WindowState.Minimized ? Services.WindowState.Minimized
            : Services.WindowState.Normal;

        var settings = _settings.Load();
        settings.WindowTop = Top;
        settings.WindowLeft = Left;
        settings.WindowWidth = Width;
        settings.WindowHeight = Height;
        settings.WindowState = state;
        settings.LibraryPath = _viewModel.LibraryPath;
        settings.LastPositions = new Dictionary<string, int>(_viewModel.LastPositions);
        settings.ExcludedFolders = new HashSet<string>(_viewModel.ExcludedFolders);
        _settings.Save(settings);
    }

    private void Window_Closing(object sender, CancelEventArgs e)
    {
        SaveWindowPlacement();
    }
}
