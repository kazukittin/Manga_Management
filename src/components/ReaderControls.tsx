import React from 'react';
import { ViewMode } from '../utils/pageCalculations';

interface ReaderControlsProps {
    currentPage: number;
    totalPages: number;
    viewMode: ViewMode;
    readingDirection: 'ltr' | 'rtl';
    onViewModeChange: (mode: ViewMode) => void;
    onReadingDirectionChange: (direction: 'ltr' | 'rtl') => void;
    onClose: () => void;
    visible: boolean;
}

const ReaderControls: React.FC<ReaderControlsProps> = ({
    currentPage,
    totalPages,
    viewMode,
    readingDirection,
    onViewModeChange,
    onReadingDirectionChange,
    onClose,
    visible,
}) => {
    return (
        <div
            className={`absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
        >
            <div className="flex items-center justify-between">
                <button
                    onClick={onClose}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm font-medium transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    ライブラリに戻る
                </button>

                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                        {currentPage + 1} / {totalPages}
                    </span>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onViewModeChange(viewMode === 'single' ? 'double' : 'single')}
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === 'single'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            単ページ
                        </button>
                        <button
                            onClick={() => onViewModeChange(viewMode === 'double' ? 'single' : 'double')}
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${viewMode === 'double'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            見開き
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onReadingDirectionChange(readingDirection === 'ltr' ? 'rtl' : 'ltr')}
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${readingDirection === 'ltr'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            左→右
                        </button>
                        <button
                            onClick={() => onReadingDirectionChange(readingDirection === 'rtl' ? 'ltr' : 'rtl')}
                            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${readingDirection === 'rtl'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            右→左
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReaderControls;
