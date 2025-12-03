import React, { useMemo, useState } from 'react';
import { MangaMetadata } from '../types/manga';

interface MetadataModalProps {
    filePath: string;
    metadata?: MangaMetadata;
    onSave: (metadata: MangaMetadata) => void;
    onClose: () => void;
}

const MetadataModal: React.FC<MetadataModalProps> = ({ filePath, metadata, onSave, onClose }) => {
    const [author, setAuthor] = useState<string>(metadata?.author ?? '');
    const [publisher, setPublisher] = useState<string>(metadata?.publisher ?? '');
    const [tags, setTags] = useState<string[]>(metadata?.tags ?? []);
    const [tagInput, setTagInput] = useState('');

    const fileName = useMemo(() => filePath.split(/[\\/]/).pop() || filePath, [filePath]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            author: author.trim() || undefined,
            publisher: publisher.trim() || undefined,
            tags,
        });
    };

    const addTag = () => {
        const value = tagInput.trim();
        if (!value || tags.includes(value)) return;
        setTags((prev) => [...prev, value]);
        setTagInput('');
    };

    const removeTag = (tag: string) => {
        setTags((prev) => prev.filter((t) => t !== tag));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                    <div>
                        <p className="text-xs text-gray-400">メタデータ編集</p>
                        <h2 className="text-lg font-semibold text-white truncate" title={filePath}>{fileName}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white focus:outline-none"
                        aria-label="閉じる"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm text-gray-300 mb-1" htmlFor="author">
                            作者
                        </label>
                        <input
                            id="author"
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="例: 尾田 栄一郎"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1" htmlFor="publisher">
                            出版社
                        </label>
                        <input
                            id="publisher"
                            type="text"
                            value={publisher}
                            onChange={(e) => setPublisher(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="例: 集英社"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1" htmlFor="tagInput">
                            タグ
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                id="tagInput"
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleTagKeyDown}
                                className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="タグを入力"
                            />
                            <button
                                type="button"
                                onClick={addTag}
                                className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                追加
                            </button>
                        </div>
                        {tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 px-2 py-1 rounded-full text-xs text-gray-100"
                                    >
                                        #{tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="text-gray-400 hover:text-white"
                                            aria-label={`${tag} を削除`}
                                        >
                                            ✕
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-gray-800 border border-gray-700 text-sm text-gray-300 hover:bg-gray-700"
                        >
                            キャンセル
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            保存
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MetadataModal;
