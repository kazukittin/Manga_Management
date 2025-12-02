using System.Windows.Media.Imaging;

namespace MangaManagement.Models;

/// <summary>
/// 漫画フォルダ（1作品）を表すモデル。
/// </summary>
public class MangaEntry
{
    /// <summary>作品タイトル（フォルダ名を想定）。</summary>
    public string Title { get; }

    /// <summary>フォルダの絶対パス。</summary>
    public string FolderPath { get; }

    /// <summary>先頭ページとして表示するサムネイルのパス。</summary>
    public string? ThumbnailPath { get; }

    /// <summary>WPF の Image で使える形にしたサムネイル。</summary>
    public BitmapImage? ThumbnailImage { get; }

    public MangaEntry(string title, string folderPath, string? thumbnailPath, BitmapImage? thumbnailImage)
    {
        Title = title;
        FolderPath = folderPath;
        ThumbnailPath = thumbnailPath;
        ThumbnailImage = thumbnailImage;
    }
}
