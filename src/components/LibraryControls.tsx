import React, { useEffect, useState } from 'react';
import FilterModal from './FilterModal';
import { useLibraryStore, SortOrder } from '../store/libraryStore';
import { BookSearchCriteria, defaultSearchCriteria } from '../types/book';
import { useMetadataOptions } from '../hooks/useMetadataOptions';
import './LibraryControls.css';

interface LibraryControlsProps {
    onBatchFetch?: () => void;
    loading: boolean;
    batchFetching?: boolean;
    hasFolder: boolean;
}

const LibraryControls: React.FC<LibraryControlsProps> = ({ onBatchFetch, loading, batchFetching, hasFolder }) => {
    const { sortOrder, searchCriteria, setSortOrder, setSearchCriteria } = useLibraryStore();
    const { authors, publishers, tags } = useMetadataOptions();
    const [form, setForm] = useState<BookSearchCriteria>(searchCriteria);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    useEffect(() => {
        setForm(searchCriteria);
    }, [searchCriteria]);

    const updateCriteria = (updater: (prev: BookSearchCriteria) => BookSearchCriteria) => {
        setForm((prev) => {
            const next = updater(prev);
            setSearchCriteria({ ...next, tags: [...next.tags] });
            return next;
        });
    };

    const handleInputChange = (key: keyof BookSearchCriteria, value: string) => {
        updateCriteria((prev) => ({ ...prev, [key]: value }));
    };

    const handleReset = () => {
        const reset = { ...defaultSearchCriteria, tags: [] };
        setForm(reset);
        setSearchCriteria(reset);
    };

    // Count active filters
    const activeFilters = [
        form.category,
        form.author,
        form.publisher,
        form.tags.length > 0
    ].filter(Boolean).length;

    return (
        <>
            <div className="z-20 sticky top-0 px-6 py-4 backdrop-blur-sm">
                <div className="glass-panel rounded-2xl p-4 transition-all duration-300">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1">
                            {/* Search Bar */}
                            <div className="relative flex-1 max-w-xl group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-500 group-focus-within:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-2 border border-white/5 rounded-xl leading-5 bg-white/5 text-gray-200 placeholder-gray-500 focus:outline-none focus:bg-white/10 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 sm:text-sm transition-all"
                                    placeholder="タイトルで検索..."
                                    value={form.title ?? ''}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                />
                            </div>

                            {/* Sort Dropdown */}
                            <div className="relative">
                                <select
                                    id="sort"
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                                    className="block w-full pl-3 pr-10 py-2 text-base border-white/5 bg-slate-800 text-white focus:outline-none focus:ring-blue-500/50 focus:border-blue-500/50 sm:text-sm rounded-xl cursor-pointer hover:bg-slate-700 transition-all [&>option]:bg-slate-800 [&>option]:text-white"
                                >
                                    <option value="recent">最近読んだ順</option>
                                    <option value="natural">自然順</option>
                                    <option value="name">名前 (A-Z)</option>
                                    <option value="date">更新日</option>
                                    <option value="author">作者順</option>
                                    <option value="publisher">出版社順</option>
                                </select>
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center gap-2">
                            {hasFolder && onBatchFetch && (
                                <button
                                    type="button"
                                    onClick={onBatchFetch}
                                    disabled={loading || batchFetching}
                                    className={`flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 transition-all ${(loading || batchFetching) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {batchFetching ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            取得中...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                            一括取得
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Filter Button */}
                            <button
                                type="button"
                                onClick={() => setIsFilterOpen(true)}
                                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${activeFilters > 0
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/30'
                                        : 'border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                <span className="text-sm font-medium">絞り込み</span>
                                {activeFilters > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg">
                                        {activeFilters}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Modal */}
            <FilterModal
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                form={form}
                onUpdate={updateCriteria}
                onReset={handleReset}
                authors={authors}
                publishers={publishers}
                tags={tags}
            />
        </>
    );
};

export default LibraryControls;
