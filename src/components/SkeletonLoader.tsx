import React from 'react';

const SkeletonLoader: React.FC = () => {
    return (
        <div className="max-w-[180px]">
            <div className="h-full bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                <div className="h-[220px] bg-gray-700 animate-pulse" />
                <div className="p-2 space-y-2">
                    <div className="h-3 bg-gray-700 rounded animate-pulse w-3/4" />
                    <div className="h-2 bg-gray-700 rounded animate-pulse w-1/2" />
                </div>
            </div>
        </div>
    );
};

export default SkeletonLoader;
