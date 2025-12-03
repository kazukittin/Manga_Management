import React from 'react';
import { Virtuoso } from 'react-virtuoso';
import { MangaMetadata } from '../types/manga';

interface CoverGridProps {
    files: string[];
    covers: Record<string, string>;
    onItemClick?: (filePath: string) => void;
    metadata?: Record<string, MangaMetadata>;
    onEditMetadata?: (filePath: string) => void;
}

const ITEMS_PER_ROW = 5;

const CoverGrid: React.FC<CoverGridProps> = ({ files, covers, onItemClick, metadata = {}, onEditMetadata }) => {
    // Group files into rows
    const rows: string[][] = [];
    for (let i = 0; i < files.length; i += ITEMS_PER_ROW) {
        rows.push(files.slice(i, i + ITEMS_PER_ROW));
    }

    const renderRow = (index: number) => {
        const items = rows[index];

        return (
            <div className="flex gap-4 px-4 mb-4">
                {items.map((filePath) => {
                    const coverUrl = covers[filePath];
                    const fileName = filePath.split(/[/\\]/).pop() || filePath;
                    const details = metadata[filePath];

                    return (
                        <div
                            key={filePath}
                            className="flex-1 max-w-[180px] cursor-pointer group"
                            onClick={() => onItemClick?.(filePath)}
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
                                        <div className="text-gray-600 text-sm">No Cover</div>
                                    )}
                                </div>
                                <div className="p-2 space-y-1">
                                    <p className="text-xs text-gray-300 truncate group-hover:text-blue-400 transition-colors" title={fileName}>
                                        {fileName}
                                    </p>
                                    {details?.author && (
                                        <p className="text-[11px] text-gray-400 truncate">Author: {details.author}</p>
                                    )}
                                    {details?.publisher && (
                                        <p className="text-[11px] text-gray-400 truncate">Publisher: {details.publisher}</p>
                                    )}
                                    {details?.tags?.length ? (
                                        <div className="flex flex-wrap gap-1 pt-1">
                                            {details.tags.map((tag) => (
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
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onEditMetadata(filePath);
                                            }}
                                        >
                                            Edit info
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    if (files.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>No files to display</p>
            </div>
        );
    }

    return (
        <div className="flex-1 h-full w-full">
            <Virtuoso
                totalCount={rows.length}
                itemContent={renderRow}
                style={{ height: '100%' }}
            />
        </div>
    );
};

export default CoverGrid;
