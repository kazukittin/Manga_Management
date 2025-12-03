import React from 'react';
import { Virtuoso } from 'react-virtuoso';

interface CoverGridProps {
    files: string[];
    covers: Record<string, string>;
    onItemClick?: (filePath: string) => void;
}

const ITEMS_PER_ROW = 5;

const CoverGrid: React.FC<CoverGridProps> = ({ files, covers, onItemClick }) => {
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
                                <div className="p-2 h-[60px]">
                                    <p className="text-xs text-gray-300 truncate group-hover:text-blue-400 transition-colors" title={fileName}>
                                        {fileName}
                                    </p>
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
