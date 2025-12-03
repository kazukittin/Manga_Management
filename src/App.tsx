import { useEffect, useMemo, useState } from 'react';
import CoverGrid from './components/CoverGrid';
import LibraryControls from './components/LibraryControls';
import Reader from './components/Reader';
import MetadataModal from './components/MetadataModal';
import { useLibraryStore } from './store/libraryStore';
import { useReaderStore } from './store/readerStore';
import { sortFiles } from './utils/naturalSort';
import { MangaItem, MangaMetadata, filterMangaByCriteria } from './types/manga';

function App() {
  const {
    files,
    covers,
    currentPath,
    metadata,
    sortOrder,
    searchCriteria,
    loading,
    setFiles,
    setCovers,
    setCurrentPath,
    setMetadata,
    updateMetadata,
    setLoading,
  } = useLibraryStore();

  const { loadPreferences } = useReaderStore();

  const [currentReader, setCurrentReader] = useState<string | null>(null);
  const [metadataTarget, setMetadataTarget] = useState<string | null>(null);

  const fileNameFromPath = (filePath: string) => {
    const name = filePath.split(/[\\/]/).pop() || filePath;
    return name.replace(/\.[^/.]+$/, "");
  };

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const loadLibrary = async (path: string, persistSelection = false) => {
    setCurrentPath(path);
    setLoading(true);

    try {
      if (persistSelection) {
        await window.api.setRoot(path);
      }

      const [fileList, storedMetadata] = await Promise.all([
        window.api.scanLibrary(path),
        window.api.loadMetadata(),
      ]);

      setFiles(fileList);

      // Filter metadata to the files that exist in the current library and ensure defaults
      const filteredMetadata: Record<string, MangaMetadata> = {};
      fileList.forEach((filePath) => {
        const fileNameWithExt = filePath.split(/[\\/]/).pop() || filePath;
        const fileName = fileNameWithExt.replace(/\.[^/.]+$/, "");
        const entry = storedMetadata[filePath];
        filteredMetadata[filePath] = {
          title: entry?.title ?? fileName,
          author: entry?.author,
          publisher: entry?.publisher,
          tags: entry?.tags ?? [],
        };
      });
      setMetadata(filteredMetadata);

      const coverData = await window.api.getCovers(fileList);
      setCovers(coverData);
    } catch (error) {
      console.error('Error loading library:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFolder = async () => {
    const path = await window.api.selectDirectory();
    if (path) {
      await loadLibrary(path, true);
    }
  };

  useEffect(() => {
    const loadSavedLibrary = async () => {
      try {
        const savedPath = await window.api.getSavedRoot();
        if (savedPath) {
          await loadLibrary(savedPath, false);
        }
      } catch (error) {
        console.error('Failed to load saved library path:', error);
      }
    };

    loadSavedLibrary();
  }, []);

  const handleSaveMetadata = async (filePath: string, data: Partial<MangaMetadata>) => {
    try {
      const title = data.title?.trim() || metadata[filePath]?.title || fileNameFromPath(filePath);
      const payload: MangaMetadata = {
        ...data,
        title,
        tags: data.tags ?? [],
      };

      updateMetadata(filePath, payload);
      await window.api.saveMetadata(filePath, payload);
    } catch (error) {
      console.error('Failed to save metadata', error);
    } finally {
      setMetadataTarget(null);
    }
  };

  const mangaItems: MangaItem[] = useMemo(
    () =>
      files.map((path) => {
        const existing = metadata[path];
        const title = existing?.title || fileNameFromPath(path);
        return {
          path,
          metadata: {
            title,
            author: existing?.author,
            publisher: existing?.publisher,
            tags: existing?.tags ?? [],
          },
        };
      }),
    [files, metadata]
  );

  // Apply sorting and filtering
  const displayedFiles = useMemo(() => {
    const filteredItems = filterMangaByCriteria(mangaItems, searchCriteria);
    const filteredPaths = filteredItems.map((item) => item.path);

    // Sort
    return sortFiles(filteredPaths, sortOrder, metadata);
  }, [mangaItems, searchCriteria, sortOrder]);

  return (
    <>
      {currentReader && (
        <Reader
          archivePath={currentReader}
          onClose={() => setCurrentReader(null)}
        />
      )}

      {metadataTarget && (
        <MetadataModal
          filePath={metadataTarget}
          metadata={metadata[metadataTarget]}
          onSave={(data) => handleSaveMetadata(metadataTarget, data)}
          onClose={() => setMetadataTarget(null)}
        />
      )}

      <div className="h-screen flex flex-col bg-gray-900 text-white font-sans">
        <LibraryControls
          onOpenFolder={handleOpenFolder}
          loading={loading}
          hasFolder={Boolean(currentPath)}
        />

        <main className="flex-1 overflow-hidden relative">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <span className="text-lg text-blue-400">ライブラリをスキャン中...</span>
            </div>
          ) : files.length > 0 ? (
            <CoverGrid
              files={displayedFiles}
              covers={covers}
              metadata={metadata}
              onItemClick={(filePath: string) => {
                setCurrentReader(filePath);
              }}
              onEditMetadata={(filePath) => setMetadataTarget(filePath)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
              <div className="flex flex-col items-center">
                <svg className="w-24 h-24 mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="text-lg mb-2">ファイルが読み込まれていません</p>
                <p className="text-sm">「フォルダーを開く」をクリックしてマンガを読み込みます。</p>
              </div>
              <button
                onClick={handleOpenFolder}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              >
                {loading ? '読み込み中...' : 'フォルダーを開く'}
              </button>
            </div>
          )}
        </main>

        <footer className="px-4 py-2 bg-gray-800 text-xs text-gray-400 border-t border-gray-700 flex justify-between">
          <span>
            {displayedFiles.length} {displayedFiles.length !== files.length ? ` / ${files.length}` : ''} ファイル
          </span>
          <span className="truncate max-w-md" title={currentPath}>{currentPath}</span>
        </footer>
      </div>
    </>
  );
}

export default App;
