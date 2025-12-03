import React, { useEffect, useState } from 'react';
import TagInput from './TagInput';
import { useLibraryStore, SortOrder } from '../store/libraryStore';
import { MangaSearchCriteria, defaultSearchCriteria } from '../types/manga';
import './LibraryControls.css';

interface LibraryControlsProps {
    onOpenFolder: () => void;
    loading: boolean;
    hasFolder: boolean;
}

const LibraryControls: React.FC<LibraryControlsProps> = ({ onOpenFolder, loading, hasFolder }) => {
    const { sortOrder, searchCriteria, setSortOrder, setSearchCriteria } = useLibraryStore();
    const [form, setForm] = useState<MangaSearchCriteria>(searchCriteria);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        setForm(searchCriteria);
    }, [searchCriteria]);

    const handleInputChange = (key: keyof MangaSearchCriteria, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleModeChange = (mode: MangaSearchCriteria['mode']) => {
        setForm((prev) => ({ ...prev, mode }));
    };

    const handleApply = () => {
        setSearchCriteria({ ...form, tags: [...form.tags] });
    };

    const handleReset = () => {
        const reset = { ...defaultSearchCriteria, tags: [] };
        setForm(reset);
        setSearchCriteria(reset);
    };

    return (
        <div className="flex flex-col gap-4 p-4 bg-gray-800 border-b border-gray-700">
            <div className="controls-bar">
                <div className="flex items-center gap-2">
                    <label htmlFor="sort" className="text-sm font-medium text-gray-300">
                        並び替え:
                    </label>
                    <select
                        id="sort"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                        className="bg-gray-700 text-white px-3 py-1.5 rounded text-sm border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="natural">自然順</option>
                        <option value="name">名前 (A-Z)</option>
                        <option value="date">更新日</option>
                    </select>
                </div>

                <button
                    type="button"
                    className="toggle-button"
                    onClick={() => setIsExpanded((prev) => !prev)}
                    aria-expanded={isExpanded}
                    aria-controls="search-details"
                >
                    <span className="mr-2 text-sm text-gray-100">検索条件を{isExpanded ? '隠す' : '表示'}</span>
                    <span className={`chevron ${isExpanded ? 'open' : ''}`}>{isExpanded ? '▲' : '▼'}</span>
                </button>
            </div>

            <div
                id="search-details"
                className={`collapse-panel ${isExpanded ? 'open' : ''}`}
                aria-hidden={!isExpanded}
            >
                <div className="search-container">
                    <div className="search-left">
                        <h2 className="text-sm font-semibold text-gray-200">検索条件</h2>
                        <div className="search-fields">
                            <input
                                type="text"
                                placeholder="タイトルで検索"
                                value={form.title ?? ''}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                className="search-input"
                            />
                            <input
                                type="text"
                                placeholder="作者で検索"
                                value={form.author ?? ''}
                                onChange={(e) => handleInputChange('author', e.target.value)}
                                className="search-input"
                            />
                            <input
                                type="text"
                                placeholder="出版社で検索"
                                value={form.publisher ?? ''}
                                onChange={(e) => handleInputChange('publisher', e.target.value)}
                                className="search-input"
                            />
                        </div>
                        <div className="tag-row">
                            <TagInput label="タグ" placeholder="タグで検索" tags={form.tags} onChange={(tags) => setForm((prev) => ({ ...prev, tags }))} />
                        </div>
                    </div>

                    <div className="mode-box">
                        <button
                            type="button"
                            onClick={onOpenFolder}
                            disabled={loading}
                            className="folder-button"
                        >
                            {loading ? '読み込み中...' : hasFolder ? 'フォルダーを変更' : 'フォルダーを開く'}
                        </button>
                        <h2 className="text-sm font-semibold text-gray-200">検索モード</h2>
                        <div className="mode-options">
                            <label className="flex items-center gap-2 text-sm text-gray-200">
                                <input
                                    type="radio"
                                    name="search-mode"
                                    value="AND"
                                    checked={form.mode === 'AND'}
                                    onChange={() => handleModeChange('AND')}
                                    className="text-blue-500 focus:ring-blue-500"
                                />
                                <span>すべての条件に一致 (AND検索)</span>
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-200">
                                <input
                                    type="radio"
                                    name="search-mode"
                                    value="OR"
                                    checked={form.mode === 'OR'}
                                    onChange={() => handleModeChange('OR')}
                                    className="text-blue-500 focus:ring-blue-500"
                                />
                                <span>いずれかの条件に一致 (OR検索)</span>
                            </label>
                        </div>

                        <div className="mode-buttons">
                            <button
                                type="button"
                                onClick={handleApply}
                                className="action-button primary"
                            >
                                検索
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="action-button secondary"
                            >
                                条件をクリア
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LibraryControls;
