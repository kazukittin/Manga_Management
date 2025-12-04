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
    selectedCard?: string | null;
    onCardSelect?: (filePath: string) => void;
}

const ITEMS_PER_ROW = 10;

// Memoized individual cover item to prevent unnecessary re-renders
const CoverItem = memo<{
    filePath: string;
    coverUrl: string | undefined;
    metadata: MangaMetadata | undefined;
    onItemClick?: (filePath: string) => void;
    onEditMetadata?: (filePath: string) => void;
    isSelected?: boolean;
    onSelect?: (filePath: string) => void;
}>(({ filePath, coverUrl, metadata, onItemClick, onEditMetadata, isSelected, onSelect }) => {
    const fileNameWithExt = filePath.split(/[/\\]/).pop() || filePath;
    const fileName = fileNameWithExt.replace(/\.[^/.]+$/, "");

    const handleClick = useCallback(() => {
        onSelect?.(filePath);
    }, [filePath, onSelect]);

    const handleDoubleClick = useCallback(() => {
        onItemClick?.(filePath);
    }, [filePath, onItemClick]);

    const handleContextMenu = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        onEditMetadata?.(filePath);
    }, [filePath, onEditMetadata]);

    return (
        <div
            className="max-w-[180px] cursor-pointer group"
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
        >
            <div className={`h-full bg-gray-800 rounded-lg overflow-hidden border transition-all hover:shadow-lg hover:shadow-blue-500/20 ${isSelected
                ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900'
                : 'border-gray-700 hover:border-blue-500'
                }`}>
                <div className="h-[220px] bg-gray-900 flex items-center justify-center overflow-hidden">
                    {coverUrl ? (
                        <img
                            src={coverUrl}
                            alt={fileName}
                            className="max-w-full max-h-full object-contain"
                            loading="lazy"
                            decoding="async"
                        />
                    ) : (
                        <div className="w-full h-full bg-gray-700 animate-pulse" />
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
                </div>
                {/* Tags moved to bottom */}
                {metadata?.tags?.length ? (
                    <div className="px-2 pb-2 flex flex-wrap gap-1">
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
            </div>
        </div>
    );
});

CoverItem.displayName = 'CoverItem';

const CoverGrid: React.FC<CoverGridProps> = ({
    files,
    covers,
    onItemClick,
    metadata = {},
    onEditMetadata,
    onRangeChanged,
    selectedCard,
    onCardSelect
}) => {
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
                        isSelected={selectedCard === filePath}
                        onSelect={onCardSelect}
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
                style={{ height: '100%' }}
                totalCount={rows.length}
                itemContent={renderRow}
                overscan={50}
                increaseViewportBy={{ top: 200, bottom: 200 }}
                rangeChanged={handleRangeChanged}
            />
        </div>
    );
};

export default memo(CoverGrid);

