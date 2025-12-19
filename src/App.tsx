import { useEffect, useMemo, useState, useRef } from 'react';
import CoverGrid from './components/CoverGrid';
import LibraryControls from './components/LibraryControls';
import Reader from './components/Reader';
import PdfReader from './components/PdfReader';
import EpubReader from './components/EpubReader';
import { getFileType } from './utils/fileTypeUtils';
import MetadataModal from './components/MetadataModal';
import ConfirmationModal from './components/ConfirmationModal';
import { ToastProvider, useToast } from './components/Toast';
import { useLibraryStore } from './store/libraryStore';
import { useReaderStore } from './store/readerStore';
import { sortFiles } from './utils/naturalSort';
import { BookItem, BookMetadata, BookCategory, filterBooksByCriteria } from './types/book';
import { getDefaultReadingDirection } from './utils/contentDefaults';

import Layout from './components/Layout';
import { ViewMode } from './components/Sidebar';
import HistoryView from './components/HistoryView';

function AppContent() {
  const {
    files,
    covers,
    libraryPaths,
    metadata,
    sortOrder,
    searchCriteria,
    setSearchCriteria,
    loading,
    setFiles,
    setCovers,
    setLibraryPaths,
    addLibraryPath,
    removeLibraryPath,
    setMetadata,
    updateMetadata,
    setLoading,
    selectedCard,
    setSelectedCard,
    addToHistory,
    readingHistory,
  } = useLibraryStore();

  const { loadPreferences } = useReaderStore();
  const { showToast } = useToast();

  const [currentReader, setCurrentReader] = useState<string | null>(null);
  const [metadataTarget, setMetadataTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>('library');
  const [batchFetching, setBatchFetching] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; currentFile: string } | null>(null);
  const batchCancelRef = useRef(false);

  const handleOpenReader = async (filePath: string) => {
    try {
      const totalPages = await window.api.getImageCount(filePath);
      const currentPage = await window.api.loadProgress(filePath);

      addToHistory({
        filePath,
        lastRead: Date.now(),
        currentPage,
        totalPages
      });

      setCurrentReader(filePath);
    } catch (error) {
      console.error('Error opening reader:', error);
      // Still open reader even if history fails
      setCurrentReader(filePath);
    }
  };

  const fileNameFromPath = (filePath: string) => {
    const name = filePath.split(/[\\/]/).pop() || filePath;
    return name.replace(/\.[^/.]+$/, "");
  };

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Load all library paths
  const loadAllLibraries = async (paths: string[]) => {
    if (paths.length === 0) return;

    setLoading(true);
    try {
      const storedMetadata = await window.api.loadMetadata() as Record<string, BookMetadata>;

      // Scan all paths in parallel
      const scanResults = await Promise.all(
        paths.map(path => window.api.scanLibrary(path))
      );

      // Flatten all files
      const allFiles = scanResults.flat();
      setFiles(allFiles);

      // Filter metadata
      const filteredMetadata: Record<string, BookMetadata> = {};
      allFiles.forEach((filePath) => {
        const fileNameWithExt = filePath.split(/[\\/]/).pop() || filePath;
        const fileName = fileNameWithExt.replace(/\.[^/.]+$/, "");
        const entry = storedMetadata[filePath];
        filteredMetadata[filePath] = {
          title: entry?.title ?? fileName,
          author: entry?.author,
          publisher: entry?.publisher,
          category: entry?.category,
          tags: entry?.tags ?? [],
        };
      });
      setMetadata(filteredMetadata);

      // Load initial covers
      const INITIAL_BATCH_SIZE = 30;
      const initialBatch = allFiles.slice(0, INITIAL_BATCH_SIZE);
      const coverData = await window.api.getCovers(initialBatch);
      setCovers(coverData);
    } catch (error) {
      console.error('Error loading libraries:', error);
      showToast('ライブラリの読み込みに失敗しました', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFolder = async () => {
    const path = await window.api.selectDirectory();
    if (path && !libraryPaths.includes(path)) {
      const newPaths = [...libraryPaths, path];
      addLibraryPath(path);
      await window.api.setRoot(newPaths);
      await loadAllLibraries(newPaths);
    }
  };

  const handleRemoveFolder = async (path: string) => {
    const newPaths = libraryPaths.filter(p => p !== path);
    removeLibraryPath(path);
    await window.api.setRoot(newPaths);
    await loadAllLibraries(newPaths);
  };

  useEffect(() => {
    const loadSavedLibraries = async () => {
      try {
        const savedPaths = await window.api.getSavedRoot();
        if (savedPaths) {
          const paths = Array.isArray(savedPaths) ? savedPaths : [savedPaths];
          setLibraryPaths(paths);
          await loadAllLibraries(paths);
        }
      } catch (error) {
        console.error('Failed to load saved library paths:', error);
      }
    };

    loadSavedLibraries();
  }, []);

  const handleSaveMetadata = async (filePath: string, data: Partial<BookMetadata>, cover?: string) => {
    try {
      if (cover) {
        try {
          await window.api.saveCover(filePath, cover);
        } catch (error) {
          console.error('Failed to save cover:', error);
          showToast('表紙画像の保存に失敗しました', 'error');
        }
      }

      const title = data.title?.trim() || metadata[filePath]?.title || fileNameFromPath(filePath);
      const payload: BookMetadata = {
        ...data,
        title,
        tags: data.tags ?? [],
      };

      updateMetadata(filePath, payload);
      await window.api.saveMetadata(filePath, payload);
      showToast('情報を保存しました', 'success');
    } catch (error) {
      console.error('Failed to save metadata', error);
      showToast('保存に失敗しました', 'error');
    } finally {
      setMetadataTarget(null);
    }
  };

  const confirmDelete = (filePath: string) => {
    setDeleteTarget(filePath);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;

    try {
      const result = await window.api.deleteManga(deleteTarget);
      if (result.success) {
        // Remove from local state
        setFiles(files.filter(f => f !== deleteTarget));

        // Close modal if open
        setMetadataTarget(null);

        // Clear selection if deleted file was selected
        if (selectedCard === deleteTarget) {
          setSelectedCard(null);
        }

        showToast('削除しました', 'success');

        // Re-scan library to ensure consistency
        if (libraryPaths.length > 0) {
          loadAllLibraries(libraryPaths);
        }

      } else {
        showToast(`削除に失敗しました: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting manga:', error);
      showToast('削除中にエラーが発生しました', 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  // Batch fetch metadata for all files
  const handleBatchFetch = async () => {
    if (libraryPaths.length === 0 || files.length === 0) return;

    // Filter files that need fetching
    const filesToFetch = files.filter(fp => !metadata[fp]?.author);
    if (filesToFetch.length === 0) {
      showToast('すべてのファイルにメタデータが設定されています', 'info');
      return;
    }

    setBatchFetching(true);
    setBatchProgress({ current: 0, total: filesToFetch.length, currentFile: '' });
    batchCancelRef.current = false;
    let fetchedCount = 0;

    try {
      for (let i = 0; i < filesToFetch.length; i++) {
        const filePath = filesToFetch[i];
        const fileName = fileNameFromPath(filePath);

        setBatchProgress({ current: i + 1, total: filesToFetch.length, currentFile: fileName });

        // Check for cancellation
        if (batchCancelRef.current) {
          showToast('一括取得をキャンセルしました', 'info');
          break;
        }

        try {
          const result = await window.api.fetchMetadataByTitle(fileName);
          if (result) {
            const payload: BookMetadata = {
              title: result.title ?? fileName,
              author: result.author,
              publisher: result.publisher,
              category: result.category,
              tags: result.tags ?? [],
            };

            await window.api.saveMetadata(filePath, payload);

            // Save cover if available
            if (result.cover) {
              try {
                await window.api.saveCover(filePath, result.cover);
              } catch (e) {
                console.error('Failed to save cover for', filePath, e);
              }
            }

            fetchedCount++;
          }
        } catch (e) {
          console.error('Failed to fetch metadata for', filePath, e);
        }
      }

      showToast(`${fetchedCount}件の情報を取得しました`, 'success');

      // Reload library
      await loadAllLibraries(libraryPaths);

    } catch (error) {
      console.error('Batch fetch error:', error);
      showToast('一括取得中にエラーが発生しました', 'error');
    } finally {
      setBatchFetching(false);
      setBatchProgress(null);
    }
  };


  const bookItems: BookItem[] = useMemo(
    () =>
      files.map((path: string) => {
        const existing = metadata[path];
        const title = existing?.title || fileNameFromPath(path);
        return {
          path,
          metadata: {
            title,
            author: existing?.author,
            publisher: existing?.publisher,
            category: existing?.category,
            tags: existing?.tags ?? [],
          },
        };
      }),
    [files, metadata]
  );

  // Compute category statistics
  const categoryStats = useMemo(() => {
    const stats = { manga: 0, novel: 0, reference: 0, other: 0, uncategorized: 0 };
    Object.values(metadata).forEach((m) => {
      if (m.category && m.category !== 'uncategorized') {
        stats[m.category]++;
      } else {
        stats.uncategorized++;
      }
    });
    return stats;
  }, [metadata]);

  // Handle category selection from sidebar
  const handleCategorySelect = (category: BookCategory | undefined) => {
    setSearchCriteria({ ...searchCriteria, category });
  };

  // Apply sorting and filtering
  const displayedFiles = useMemo(() => {
    const filteredItems = filterBooksByCriteria(bookItems, searchCriteria);
    const filteredPaths = filteredItems.map((item) => item.path);

    // Sort
    return sortFiles(filteredPaths, sortOrder, metadata, readingHistory);
  }, [bookItems, searchCriteria, sortOrder, metadata, readingHistory]);

  // Fix: Load covers when displayedFiles changes (e.g. filtering)
  useEffect(() => {
    if (displayedFiles.length > 0) {
      const INITIAL_BATCH_SIZE = 30;
      const initialBatch = displayedFiles.slice(0, INITIAL_BATCH_SIZE);
      // Check which ones are missing covers
      const missingCovers = initialBatch.filter((path: string) => !covers[path]);

      if (missingCovers.length > 0) {
        window.api.getCovers(missingCovers).then((newCovers: Record<string, string>) => {
          setCovers((prev: Record<string, string>) => ({ ...prev, ...newCovers }));
        }).catch(console.error);
      }
    }
  }, [displayedFiles, covers, setCovers]);

  return (
    <>
      {/* Batch Fetch Progress Modal */}
      {batchProgress && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100]">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-8 max-w-lg w-full mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 text-center">メタデータ一括取得中</h3>

            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-4 mb-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              />
            </div>

            {/* Progress Text */}
            <p className="text-center text-gray-300 text-lg mb-2">
              {batchProgress.current} / {batchProgress.total}
            </p>

            {/* Current File */}
            <p className="text-center text-gray-500 text-sm truncate" title={batchProgress.currentFile}>
              処理中: {batchProgress.currentFile}
            </p>

            {/* Spinner and Cancel */}
            <div className="flex flex-col items-center gap-4 mt-6">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
              <button
                onClick={() => { batchCancelRef.current = true; }}
                className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {currentReader && (() => {
        const fileType = getFileType(currentReader);
        const bookCategory = metadata[currentReader]?.category;
        const defaultDirection = getDefaultReadingDirection(bookCategory);
        switch (fileType) {
          case 'pdf':
            return <PdfReader filePath={currentReader} onClose={() => setCurrentReader(null)} defaultDirection={defaultDirection} />;
          case 'epub':
            return <EpubReader filePath={currentReader} onClose={() => setCurrentReader(null)} defaultDirection={defaultDirection} />;
          default:
            return <Reader archivePath={currentReader} onClose={() => setCurrentReader(null)} defaultDirection={defaultDirection} />;
        }
      })()}

      {metadataTarget && (
        <MetadataModal
          filePath={metadataTarget}
          metadata={metadata[metadataTarget]}
          onSave={(data, cover) => handleSaveMetadata(metadataTarget, data, cover)}
          onClose={() => setMetadataTarget(null)}
          onDelete={() => confirmDelete(metadataTarget)}
        />
      )}

      <ConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={executeDelete}
        title="作品を削除"
        message="本当にこの作品を削除しますか？&#10;この操作は取り消せませんが、ファイルはゴミ箱に移動されます。"
        confirmText="削除する"
        isDangerous={true}
      />

      <Layout
        currentView={currentView}
        onViewChange={setCurrentView}
        selectedCategory={searchCriteria.category}
        onCategorySelect={handleCategorySelect}
        libraryPaths={libraryPaths}
        onAddFolder={handleAddFolder}
        onRemoveFolder={handleRemoveFolder}
        stats={{
          totalFiles: files.length,
          readingCount: readingHistory.length,
          categoryStats
        }}
      >
        {currentView === 'library' && (
          <div className="flex flex-col h-full">
            <LibraryControls
              onBatchFetch={handleBatchFetch}
              loading={loading}
              batchFetching={batchFetching}
              hasFolder={libraryPaths.length > 0}
            />

            <main className="flex-1 overflow-hidden relative p-4">
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
                    handleOpenReader(filePath);
                  }}
                  onEditMetadata={(filePath) => setMetadataTarget(filePath)}
                  selectedCard={selectedCard}
                  onCardSelect={(filePath) => setSelectedCard(filePath)}
                  onRangeChanged={async (startIndex: number, endIndex: number) => {
                    // Load covers for the visible range
                    const visibleFiles = displayedFiles.slice(startIndex, endIndex);
                    const missingCovers = visibleFiles.filter((filePath: string) => !covers[filePath]);

                    if (missingCovers.length > 0) {
                      try {
                        const newCovers = await window.api.getCovers(missingCovers);
                        setCovers((prev: Record<string, string>) => ({ ...prev, ...newCovers }));
                      } catch (error) {
                        console.error('Error loading covers:', error);
                      }
                    }
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-4">
                  <div className="flex flex-col items-center">
                    <svg className="w-24 h-24 mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p className="text-lg mb-2">ファイルが読み込まれていません</p>
                    <p className="text-sm">「フォルダーを開く」をクリックして作品を読み込みます。</p>
                  </div>
                  <button
                    onClick={handleAddFolder}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                  >
                    {loading ? '読み込み中...' : 'フォルダーを追加'}
                  </button>
                </div>
              )}
            </main>
            {/* Small Footer for Path Info */}
            <div className="px-6 py-2 text-[10px] text-gray-500 border-t border-white/5 truncate">
              {libraryPaths.length > 0 ? `${libraryPaths.length}個のフォルダー` : ''}
            </div>
          </div>
        )}

        {currentView === 'history' && (
          <HistoryView onItemClick={handleOpenReader} />
        )}
      </Layout>
    </>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

export default App;
