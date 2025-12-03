import React from 'react';
import { Virtuoso } from 'react-virtuoso';

interface VirtualFileGridProps {
    files: string[];
}

const VirtualFileGrid: React.FC<VirtualFileGridProps> = ({ files }) => {
    const renderItem = (index: number) => (
        <div className="px-4 py-2 border-b border-gray-700 truncate hover:bg-gray-800 text-sm">
            {files[index].replace(/\.[^/.]+$/, "")}
        </div>
    );

    return (
        <div className="flex-1 h-full w-full">
            <Virtuoso
                totalCount={files.length}
                itemContent={renderItem}
                style={{ height: '100%' }}
            />
        </div>
    );
};

export default VirtualFileGrid;
