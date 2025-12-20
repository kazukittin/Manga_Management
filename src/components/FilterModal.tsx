import React from 'react';
import TagInput from './TagInput';
import { BookSearchCriteria, BookCategory, CATEGORY_OPTIONS } from '../types/book';

interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    form: BookSearchCriteria;
    onUpdate: (updater: (prev: BookSearchCriteria) => BookSearchCriteria) => void;
    onReset: () => void;
    authors: string[];
    publishers: string[];
    tags: string[];
}

const FilterModal: React.FC<FilterModalProps> = ({
    isOpen,
    onClose,
    form,
    onUpdate,
    onReset,
    authors,
    publishers,
    tags
}) => {
    if (!isOpen) return null;

    const handleInputChange = (key: keyof BookSearchCriteria, value: string) => {
        onUpdate((prev) => ({ ...prev, [key]: value }));
    };

    const handleCategoryChange = (category: BookCategory | undefined) => {
        onUpdate((prev) => ({ ...prev, category }));
    };

    const handleModeChange = (mode: BookSearchCriteria['mode']) => {
        onUpdate((prev) => ({ ...prev, mode }));
    };

    // Count active filters
    const activeFilters = [
        form.category,
        form.author,
        form.publisher,
        form.tags.length > 0
    ].filter(Boolean).length;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div
                className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">絞り込み</h2>
                            {activeFilters > 0 && (
                                <p className="text-xs text-gray-400">{activeFilters}件のフィルターが適用中</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-6">
                    {/* Row 1: Category and Search Mode */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Category Filter */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                                <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                カテゴリ
                            </label>
                            <select
                                value={form.category ?? ''}
                                onChange={(e) => handleCategoryChange(e.target.value as BookCategory || undefined)}
                                className="block w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all [&>option]:bg-slate-800 [&>option]:text-white"
                            >
                                <option value="">全てのカテゴリ</option>
                                {CATEGORY_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Search Mode */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                                <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                検索モード
                            </label>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleModeChange('AND')}
                                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${form.mode === 'AND'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                                            : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700 border border-white/5'
                                        }`}
                                >
                                    すべて一致 (AND)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleModeChange('OR')}
                                    className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all ${form.mode === 'OR'
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                                            : 'bg-slate-800 text-gray-400 hover:text-white hover:bg-slate-700 border border-white/5'
                                        }`}
                                >
                                    いずれか一致 (OR)
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: Author and Publisher */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Author Filter */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                                <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                作者
                            </label>
                            <select
                                value={form.author ?? ''}
                                onChange={(e) => handleInputChange('author', e.target.value)}
                                className="block w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all [&>option]:bg-slate-800 [&>option]:text-white"
                            >
                                <option value="">全ての作者</option>
                                {authors.map((author) => (
                                    <option key={author} value={author}>{author}</option>
                                ))}
                            </select>
                        </div>

                        {/* Publisher Filter */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                                <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                出版社 / サークル
                            </label>
                            <select
                                value={form.publisher ?? ''}
                                onChange={(e) => handleInputChange('publisher', e.target.value)}
                                className="block w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all [&>option]:bg-slate-800 [&>option]:text-white"
                            >
                                <option value="">全ての出版社</option>
                                {publishers.map((publisher) => (
                                    <option key={publisher} value={publisher}>{publisher}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Row 3: Tags */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                            <svg className="w-4 h-4 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            タグ
                        </label>
                        <TagInput
                            placeholder="タグで絞り込み..."
                            tags={form.tags}
                            onChange={(newTags) => onUpdate((prev) => ({ ...prev, tags: newTags }))}
                            availableTags={tags}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-5 border-t border-white/5 bg-slate-800/30">
                    <button
                        type="button"
                        onClick={onReset}
                        className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        フィルターをクリア
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl shadow-lg shadow-blue-900/30 transition-all"
                    >
                        適用して閉じる
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FilterModal;
