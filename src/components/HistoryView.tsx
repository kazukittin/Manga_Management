import React from 'react';
import { useLibraryStore } from '../store/libraryStore';
import { Clock, BookOpen, ChevronRight } from 'lucide-react';

interface HistoryViewProps {
    onItemClick: (filePath: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ onItemClick }) => {
    const { readingHistory, covers, metadata } = useLibraryStore();

    const fileNameFromPath = (filePath: string) => {
        const name = filePath.split(/[\\/]/).pop() || filePath;
        return name.replace(/\.[^/.]+$/, "");
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('ja-JP', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getPercentage = (current: number, total: number) => {
        if (!total) return 0;
        return Math.min(100, Math.round((current / total) * 100));
    };

    if (readingHistory.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                <div className="w-20 h-20 rounded-full bg-slate-800/50 flex items-center justify-center">
                    <Clock size={40} className="text-slate-600" />
                </div>
                <div className="text-center">
                    <h3 className="text-lg font-medium text-slate-300">履歴がありません</h3>
                    <p className="text-sm">マンガを読むとここに表示されます。</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto px-6 py-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Clock className="text-blue-400" />
                <span>読書履歴</span>
            </h2>

            <div className="space-y-3 max-w-4xl mx-auto">
                {readingHistory.map((item) => {
                    const title = metadata[item.filePath]?.title || fileNameFromPath(item.filePath);
                    const cover = covers[item.filePath];
                    const progress = getPercentage(item.currentPage, item.totalPages);

                    return (
                        <div
                            key={item.filePath}
                            onClick={() => onItemClick(item.filePath)}
                            className="group relative flex items-center gap-4 p-4 rounded-2xl bg-slate-900/40 border border-white/5 hover:bg-slate-800/60 hover:border-blue-500/30 transition-all cursor-pointer overflow-hidden"
                        >
                            {/* Progress Bar Background */}
                            <div
                                className="absolute bottom-0 left-0 h-1 bg-blue-500/30 transition-all"
                                style={{ width: `${progress}%` }}
                            />

                            {/* Cover Thumbnail */}
                            <div className="relative w-16 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800 shadow-lg">
                                {cover ? (
                                    <img src={cover} alt={title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                                        <BookOpen size={20} />
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 py-1">
                                <h3 className="text-lg font-medium text-slate-200 group-hover:text-blue-400 transition-colors truncate">
                                    {title}
                                </h3>
                                <p className="text-sm text-slate-500 truncate mb-2">
                                    {item.filePath}
                                </p>

                                <div className="flex items-center gap-4 text-xs text-slate-400">
                                    <span className="flex items-center gap-1 bg-slate-800/50 px-2 py-1 rounded">
                                        <span>{item.currentPage + 1} / {item.totalPages} ページ</span>
                                        <span className="text-blue-400 font-bold ml-1">({progress}%)</span>
                                    </span>
                                    <span>最終閲覧: {formatDate(item.lastRead)}</span>
                                </div>
                            </div>

                            {/* Action Icon */}
                            <div className="px-2 text-slate-600 group-hover:text-blue-400 transition-colors">
                                <ChevronRight size={24} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HistoryView;
