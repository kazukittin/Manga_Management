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

const ITEMS_PER_ROW = 8;

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
            className="w-full cursor-pointer group"
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
        >
            <div className={`h-full bg-slate-900/40 backdrop-blur-sm rounded-xl overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 ${isSelected
                ? 'border-blue-500 ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-950'
                : 'border-white/5 hover:border-blue-400/50'
                }`}>
                <div className="aspect-[2/3] bg-slate-800/50 flex items-center justify-center overflow-hidden relative">
                    {coverUrl ? (
                        <>
                            <img
                                src={coverUrl}
                                alt={fileName}
                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                                loading="lazy"
                                decoding="async"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 gap-2">
                            <svg className="w-10 h-10 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs opacity-50">No Cover</span>
                        </div>
                    )}
                </div>
                <div className="p-3 space-y-1">
                    <p className="text-sm font-medium text-slate-200 truncate group-hover:text-blue-400 transition-colors" title={fileNameWithExt}>
                        {fileName}
                    </p>
                    {metadata?.author && (
                        <p className="text-xs text-slate-400 truncate">
                            <span className="opacity-50 mr-1">著者:</span>
                            {metadata.author}
                        </p>
                    )}
                    {metadata?.publisher && (
                        <p className="text-xs text-slate-400 truncate">
                            <span className="opacity-50 mr-1">サークル:</span>
                            {metadata.publisher}
                        </p>
                    )}
                </div>
                {/* Tags */}
                {metadata?.tags?.length ? (
                    <div className="px-3 pb-3 flex flex-wrap gap-1">
                        {metadata.tags.slice(0, 3).map((tag) => (
                            <span
                                key={tag}
                                className="text-[10px] bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded-full border border-blue-500/10"
                            >
                                #{tag}
                            </span>
                        ))}
                        {metadata.tags.length > 3 && (
                            <span className="text-[10px] text-slate-500 px-1">+{metadata.tags.length - 3}</span>
                        )}
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
            <div className="grid grid-cols-8 gap-6 px-6 mb-6">
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

