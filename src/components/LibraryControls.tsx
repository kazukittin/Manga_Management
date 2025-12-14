import React, { useEffect, useState } from 'react';
import TagInput from './TagInput';
import { useLibraryStore, SortOrder } from '../store/libraryStore';
import { BookSearchCriteria, BookCategory, CATEGORY_OPTIONS, defaultSearchCriteria } from '../types/book';
import { useMetadataOptions } from '../hooks/useMetadataOptions';
import './LibraryControls.css';

interface LibraryControlsProps {
    onOpenFolder: () => void;
    loading: boolean;
    hasFolder: boolean;
}

const LibraryControls: React.FC<LibraryControlsProps> = ({ onOpenFolder, loading, hasFolder }) => {
    const { sortOrder, searchCriteria, setSortOrder, setSearchCriteria } = useLibraryStore();
    const { authors, publishers, tags } = useMetadataOptions();
    const [form, setForm] = useState<BookSearchCriteria>(searchCriteria);
    const [isExpanded, setIsExpanded] = useState(false);

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

    const handleCategoryChange = (category: BookCategory | undefined) => {
        updateCriteria((prev) => ({ ...prev, category }));
    };

    const handleModeChange = (mode: BookSearchCriteria['mode']) => {
        updateCriteria((prev) => ({ ...prev, mode }));
    };

    const handleReset = () => {
        const reset = { ...defaultSearchCriteria, tags: [] };
        setForm(reset);
        setSearchCriteria(reset);
    };

    return (
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
                        <button
                            type="button"
                            onClick={onOpenFolder}
                            disabled={loading}
                            className={`flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                                </svg>
                            )}
                            {hasFolder ? 'フォルダー変更' : '開く'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setIsExpanded((prev) => !prev)}
                            className={`p-2 rounded-xl border border-white/5 transition-colors ${isExpanded ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <svg className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Expanded Filters */}
                <div
                    className={`grid transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4 pt-4 border-t border-white/5' : 'grid-rows-[0fr] opacity-0'
                        }`}
                >
                    <div className="min-h-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Category Filter */}
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">カテゴリ</label>
                                <select
                                    value={form.category ?? ''}
                                    onChange={(e) => handleCategoryChange(e.target.value as BookCategory || undefined)}
                                    className="block w-full px-3 py-2 bg-slate-800 border border-white/5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [&>option]:bg-slate-800 [&>option]:text-white"
                                >
                                    <option value="">全てのカテゴリ</option>
                                    {CATEGORY_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Metadata Filters */}
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">フィルター</label>
                                <div className="space-y-2">
                                    <select
                                        value={form.author ?? ''}
                                        onChange={(e) => handleInputChange('author', e.target.value)}
                                        className="block w-full px-3 py-2 bg-slate-800 border border-white/5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [&>option]:bg-slate-800 [&>option]:text-white"
                                    >
                                        <option value="">全ての作者</option>
                                        {authors.map((author) => (
                                            <option key={author} value={author}>{author}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={form.publisher ?? ''}
                                        onChange={(e) => handleInputChange('publisher', e.target.value)}
                                        className="block w-full px-3 py-2 bg-slate-800 border border-white/5 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 [&>option]:bg-slate-800 [&>option]:text-white"
                                    >
                                        <option value="">全ての出版社</option>
                                        {publishers.map((publisher) => (
                                            <option key={publisher} value={publisher}>{publisher}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">タグ</label>
                                <TagInput
                                    label=""
                                    placeholder="タグで検索..."
                                    tags={form.tags}
                                    onChange={(tags) => updateCriteria((prev) => ({ ...prev, tags }))}
                                    availableTags={tags}
                                />
                            </div>

                            {/* Logic Mode */}
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">検索モード</label>
                                <div className="space-y-2 bg-white/5 p-2 rounded-lg border border-white/5">
                                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-white">
                                        <input
                                            type="radio"
                                            name="search-mode"
                                            value="AND"
                                            checked={form.mode === 'AND'}
                                            onChange={() => handleModeChange('AND')}
                                            className="text-blue-500 focus:ring-blue-500 bg-gray-700 border-gray-600"
                                        />
                                        <span>すべての条件に一致 (AND)</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer hover:text-white">
                                        <input
                                            type="radio"
                                            name="search-mode"
                                            value="OR"
                                            checked={form.mode === 'OR'}
                                            onChange={() => handleModeChange('OR')}
                                            className="text-blue-500 focus:ring-blue-500 bg-gray-700 border-gray-600"
                                        />
                                        <span>いずれかの条件に一致 (OR)</span>
                                    </label>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="text-xs text-red-400 hover:text-red-300 underline"
                                >
                                    すべての条件をクリア
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LibraryControls;
