using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Media.Imaging;
using MangaManagement.Models;

namespace MangaManagement.Services;

/// <summary>
/// ライブラリフォルダから作品リストを読み込むヘルパー。
/// </summary>
public class LibraryScanner
{
    private static readonly string[] ImageExtensions = new[] { ".jpg", ".jpeg", ".png", ".bmp", ".webp" };

    /// <summary>サムネイルのメモリキャッシュ。</summary>
    private static readonly ConcurrentDictionary<string, BitmapImage?> ThumbnailCache = new();

    /// <summary>
    /// 指定フォルダ配下を再帰的に走査し、画像を含む最下層フォルダを 1 作品として返す。
    /// </summary>
    public Task<List<MangaEntry>> ScanAsync(string libraryPath, HashSet<string>? excluded = null, CancellationToken cancellationToken = default)
    {
        return Task.Run(() => ScanInternal(libraryPath, excluded ?? new HashSet<string>(StringComparer.OrdinalIgnoreCase), cancellationToken), cancellationToken);
    }

    private List<MangaEntry> ScanInternal(string libraryPath, HashSet<string> excluded, CancellationToken cancellationToken)
    {
        var results = new List<MangaEntry>();
        if (!Directory.Exists(libraryPath))
        {
            return results;
        }

        foreach (var folder in FindLeafMangaFolders(libraryPath, cancellationToken))
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (excluded.Contains(folder))
            {
                continue; // 除外リストに登録された作品は表示しない（実ファイル削除は行わない）
            }

            var title = Path.GetFileName(folder);
            var thumbnailPath = GetFirstImage(folder);
            results.Add(new MangaEntry(title, folder, thumbnailPath, LoadThumbnail(thumbnailPath)));
        }

        return results.OrderBy(x => x.Title, StringComparer.OrdinalIgnoreCase).ToList();
    }

    /// <summary>
    /// 作品フォルダ内の画像ファイルをページ順に返す。
    /// </summary>
    public List<string> GetPages(string folderPath)
    {
        if (!Directory.Exists(folderPath))
        {
            return new List<string>();
        }

        var files = Directory.GetFiles(folderPath)
            .Where(f => ImageExtensions.Contains(Path.GetExtension(f), StringComparer.OrdinalIgnoreCase))
            .OrderBy(f => f, StringComparer.OrdinalIgnoreCase)
            .ToList();

        return files;
    }

    /// <summary>
    /// ライブラリ配下の「最下層かつ画像を含む」フォルダを列挙する。
    /// </summary>
    private IEnumerable<string> FindLeafMangaFolders(string root, CancellationToken cancellationToken)
    {
        foreach (var dir in Directory.GetDirectories(root))
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (TryCollectLeaf(dir, cancellationToken, out var leaf))
            {
                foreach (var folder in leaf)
                {
                    yield return folder;
                }
            }
        }
    }

    private bool TryCollectLeaf(string dir, CancellationToken cancellationToken, out List<string> leaves)
    {
        leaves = new List<string>();
        cancellationToken.ThrowIfCancellationRequested();

        var childDirs = Directory.GetDirectories(dir);
        var hasImageHere = Directory.GetFiles(dir)
            .Any(f => ImageExtensions.Contains(Path.GetExtension(f), StringComparer.OrdinalIgnoreCase));

        var childHasLeaf = false;
        foreach (var child in childDirs)
        {
            if (TryCollectLeaf(child, cancellationToken, out var childLeaves))
            {
                childHasLeaf = true;
                leaves.AddRange(childLeaves);
            }
        }

        // 「最下層フォルダ」= 自身に画像があり、子からは収穫が無い場合のみ採用する
        if (hasImageHere && !childHasLeaf)
        {
            leaves.Add(dir);
            return true;
        }

        return leaves.Count > 0;
    }

    private string? GetFirstImage(string folderPath)
    {
        return Directory.GetFiles(folderPath)
            .Where(f => ImageExtensions.Contains(Path.GetExtension(f), StringComparer.OrdinalIgnoreCase))
            .OrderBy(f => f, StringComparer.OrdinalIgnoreCase)
            .FirstOrDefault();
    }

    private BitmapImage? LoadThumbnail(string? path)
    {
        if (string.IsNullOrWhiteSpace(path) || !File.Exists(path))
        {
            return null;
        }

        return ThumbnailCache.GetOrAdd(path, p =>
        {
            try
            {
                // 遅延読み込みで軽量なサムネイルを生成する
                var image = new BitmapImage();
                image.BeginInit();
                image.CacheOption = BitmapCacheOption.OnLoad;
                image.UriSource = new Uri(p);
                image.DecodePixelWidth = 320;
                image.EndInit();
                image.Freeze();
                return image;
            }
            catch
            {
                return null;
            }
        });
    }
}
