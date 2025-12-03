import React, { memo, useCallback } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { MangaMetadata } from '../types/manga';

interface CoverGridProps {
    files: string[];
    covers: Record<string, string>;
    onItemClick?: (filePath: string) => void;
    metadata?: Record<string, MangaMetadata>;
    onEditMetadata?: (filePath: string) => void;
    onRangeChanged?: (startIndex: number, endIndex: number) => void;
}

const ITEMS_PER_ROW = 10;

// Memoized individual cover item to prevent unnecessary re-renders
const CoverItem = memo<{
    filePath: string;
    coverUrl: string | undefined;
    metadata: MangaMetadata | undefined;
    onItemClick?: (filePath: string) => void;
    onEditMetadata?: (filePath: string) => void;
}>(({ filePath, coverUrl, metadata, onItemClick, onEditMetadata }) => {
    const fileNameWithExt = filePath.split(/[/\\]/).pop() || filePath;
    const fileName = fileNameWithExt.replace(/\.[^/.]+$/, "");

    const handleClick = useCallback(() => {
        onItemClick?.(filePath);
    }, [filePath, onItemClick]);

    const handleEdit = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        onEditMetadata?.(filePath);
    }, [filePath, onEditMetadata]);

    return (
        <div
            className="max-w-[180px] cursor-pointer group"
            onClick={handleClick}
        >
            <div className="h-full bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20">
                <div className="h-[220px] bg-gray-900 flex items-center justify-center overflow-hidden">
                    {coverUrl ? (
                        <img
                            src={coverUrl}
                            alt={fileName}
                            className="max-w-full max-h-full object-contain"
                            loading="lazy"
                        />
                    ) : (
                        <div className="text-gray-600 text-sm">表紙なし</div>
                    )}
                </div>
                <div className="p-2 space-y-1">
                    <p className="text-xs text-gray-300 truncate group-hover:text-blue-400 transition-colors" title={fileNameWithExt}>
                        {fileName}
                    </p>
                    {metadata?.author && (
                        <p className="text-[11px] text-gray-400 truncate">作者: {metadata.author}</p>
                    )}
                    {metadata?.publisher && (
                        <p className="text-[11px] text-gray-400 truncate">出版社: {metadata.publisher}</p>
                    )}
                    {metadata?.tags?.length ? (
                        <div className="flex flex-wrap gap-1 pt-1">
                            {metadata.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="text-[10px] bg-gray-700 text-gray-200 px-2 py-0.5 rounded-full"
                                >
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    ) : null}
                    {onEditMetadata && (
                        <button
                            type="button"
                            className="mt-1 text-[11px] text-blue-400 hover:text-blue-300"
                            onClick={handleEdit}
                        >
                            情報を編集
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});

CoverItem.displayName = 'CoverItem';

const CoverGrid: React.FC<CoverGridProps> = ({ files, covers, onItemClick, metadata = {}, onEditMetadata, onRangeChanged }) => {
    // Group files into rows
    const rows: string[][] = [];
    for (let i = 0; i < files.length; i += ITEMS_PER_ROW) {
        rows.push(files.slice(i, i + ITEMS_PER_ROW));
    }

    const renderRow = useCallback((index: number) => {
        const items = rows[index];

        return (
            <div className="grid grid-cols-10 gap-4 px-4 mb-4">
                {items.map((filePath) => (
                    <CoverItem
                        key={filePath}
                        filePath={filePath}
                        coverUrl={covers[filePath]}
                        metadata={metadata[filePath]}
                        onItemClick={onItemClick}
                        onEditMetadata={onEditMetadata}
                    />
                ))}
            </div>
        );
    }, [rows, covers, metadata, onItemClick, onEditMetadata]);

    const handleRangeChanged = useCallback((range: { startIndex: number; endIndex: number }) => {
        if (onRangeChanged) {
            // Convert row indices to file indices
            const startFileIndex = range.startIndex * ITEMS_PER_ROW;
            const endFileIndex = Math.min((range.endIndex + 1) * ITEMS_PER_ROW, files.length);
            onRangeChanged(startFileIndex, endFileIndex);
        }
    }, [onRangeChanged, files.length]);

    if (files.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>表示するファイルがありません</p>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full w-full">
            <Virtuoso
                totalCount={rows.length}
                itemContent={renderRow}
                style={{ height: '100%' }}
                overscan={200}
                rangeChanged={handleRangeChanged}
            />
        </div>
    );
};

export default memo(CoverGrid);

