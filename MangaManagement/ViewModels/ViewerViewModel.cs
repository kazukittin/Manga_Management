using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Windows.Input;
using System.Windows.Media.Imaging;
using MangaManagement.Utilities;

namespace MangaManagement.ViewModels;

/// <summary>
/// ビューワ画面のページ遷移や表示画像を管理する ViewModel。
/// </summary>
public class ViewerViewModel : INotifyPropertyChanged
{
    private readonly Action<int> _onSavePosition;
    private int _currentIndex;
    private BitmapImage? _currentImage;
    private bool _isDualPage;

    public string Title { get; }
    public List<string> Pages { get; }

    /// <summary>将来的な見開き対応を想定し、2ページ表示するかどうか。</summary>
    public bool IsDualPage
    {
        get => _isDualPage;
        set { _isDualPage = value; OnPropertyChanged(); OnPropertyChanged(nameof(CurrentPageLabel)); LoadCurrentImage(); }
    }

    public int CurrentIndex
    {
        get => _currentIndex;
        private set
        {
            _currentIndex = value;
            OnPropertyChanged();
            OnPropertyChanged(nameof(CurrentPageLabel));
            LoadCurrentImage();
        }
    }

    public BitmapImage? CurrentImage
    {
        get => _currentImage;
        private set { _currentImage = value; OnPropertyChanged(); }
    }

    public string CurrentPageLabel => Pages.Count == 0 ? "0 / 0" : $"{CurrentIndex + 1} / {Pages.Count}";

    public ICommand NextPageCommand { get; }
    public ICommand PreviousPageCommand { get; }
    public ICommand ReturnCommand { get; }

    /// <summary>本棚に戻る要求（View がハンドルしウィンドウを閉じる）。</summary>
    public event Action? ReturnRequested;

    public ViewerViewModel(string title, List<string> pages, int startIndex, Action<int> onSavePosition)
    {
        Title = title;
        Pages = pages;
        _onSavePosition = onSavePosition;

        NextPageCommand = new RelayCommand(_ => NextPage());
        PreviousPageCommand = new RelayCommand(_ => PreviousPage());
        ReturnCommand = new RelayCommand(_ => ReturnToShelf());

        if (Pages.Count > 0)
        {
            CurrentIndex = Math.Clamp(startIndex, 0, Pages.Count - 1);
        }
    }

    public void NextPage()
    {
        if (IsDualPage)
        {
            var nextIndex = Math.Min(CurrentIndex + 2, Pages.Count - 1);
            if (nextIndex != CurrentIndex)
            {
                CurrentIndex = nextIndex;
            }
        }
        else if (CurrentIndex < Pages.Count - 1)
        {
            CurrentIndex++;
        }
    }

    public void PreviousPage()
    {
        if (IsDualPage)
        {
            var nextIndex = Math.Max(CurrentIndex - 2, 0);
            if (nextIndex != CurrentIndex)
            {
                CurrentIndex = nextIndex;
            }
        }
        else if (CurrentIndex > 0)
        {
            CurrentIndex--;
        }
    }

    public void ReturnToShelf()
    {
        SavePosition();
        ReturnRequested?.Invoke();
    }

    private void LoadCurrentImage()
    {
        if (Pages.Count == 0)
        {
            CurrentImage = null;
            return;
        }

        try
        {
            // 現状は単ページ表示。IsDualPage=true 時も先頭ページを代表で読み込む（将来の UI 拡張余地として設計）。
            var path = Pages[CurrentIndex];
            var image = new BitmapImage();
            image.BeginInit();
            image.CacheOption = BitmapCacheOption.OnLoad;
            image.UriSource = new Uri(path);
            image.EndInit();
            image.Freeze();
            CurrentImage = image;
        }
        catch
        {
            CurrentImage = null;
        }
    }

    public void SavePosition()
    {
        _onSavePosition?.Invoke(CurrentIndex);
    }

    public event PropertyChangedEventHandler? PropertyChanged;

    protected void OnPropertyChanged([CallerMemberName] string? propertyName = null)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}
