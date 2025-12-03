import React from 'react';
import { useLibraryStore, SortOrder } from '../store/libraryStore';

const LibraryControls: React.FC = () => {
    const { sortOrder, filterText, setSortOrder, setFilterText } = useLibraryStore();

    return (
        <div className="flex items-center gap-4 p-4 bg-gray-800 border-b border-gray-700">
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

            <div className="flex-1 max-w-md">
                <input
                    type="text"
                    placeholder="名前・作者・出版社・タグで検索"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="w-full bg-gray-700 text-white px-3 py-1.5 rounded text-sm border border-gray-600 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
        </div>
    );
};

export default LibraryControls;
