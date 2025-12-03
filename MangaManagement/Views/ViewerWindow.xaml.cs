using System;
using System.Collections.Generic;
using System.Windows;
using KeyEventArgs = System.Windows.Input.KeyEventArgs;
using Key = System.Windows.Input.Key;
using MangaManagement.ViewModels;

namespace MangaManagement.Views;

/// <summary>
/// ビューワ画面。キー操作やボタン操作を ViewModel に橋渡しする。
/// </summary>
public partial class ViewerWindow : Window
{
    private readonly ViewerViewModel _viewModel;

    public ViewerWindow(string title, List<string> pages, int startIndex, Action<int> onSavePosition)
    {
        InitializeComponent();
        _viewModel = new ViewerViewModel(title, pages, startIndex, onSavePosition);
        _viewModel.ReturnRequested += () => Close();
        DataContext = _viewModel;
    }

    private void BackButton_Click(object sender, RoutedEventArgs e)
    {
        _viewModel.ReturnToShelf();
    }

    private void PrevButton_Click(object sender, RoutedEventArgs e)
    {
        _viewModel.PreviousPage();
    }

    private void NextButton_Click(object sender, RoutedEventArgs e)
    {
        _viewModel.NextPage();
    }

    /// <summary>
    /// ← → キーでページ遷移。Esc で本棚へ戻る。
    /// </summary>
    private void Window_KeyDown(object sender, KeyEventArgs e)
    {
        if (e.Key == Key.Right)
        {
            _viewModel.NextPage();
            e.Handled = true;
        }
        else if (e.Key == Key.Left)
        {
            _viewModel.PreviousPage();
            e.Handled = true;
        }
        else if (e.Key == Key.Escape)
        {
            _viewModel.ReturnToShelf();
            e.Handled = true;
        }
    }

    protected override void OnClosed(EventArgs e)
    {
        _viewModel.SavePosition();
        base.OnClosed(e);
    }
}
