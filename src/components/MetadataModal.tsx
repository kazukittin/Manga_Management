import React, { useMemo, useState } from 'react';
import TagInput from './TagInput';
import { BookMetadata, BookCategory, CATEGORY_OPTIONS } from '../types/book';
import { useMetadataOptions } from '../hooks/useMetadataOptions';

type MetadataFormValue = Partial<BookMetadata>;

interface MetadataModalProps {
    filePath: string;
    metadata?: BookMetadata;
    onSave: (metadata: MetadataFormValue) => void;
    onClose: () => void;
    onDelete?: () => void;
}

const MetadataModal: React.FC<MetadataModalProps> = ({ filePath, metadata, onSave, onClose, onDelete }) => {
    const { authors, publishers, tags: availableTags } = useMetadataOptions();
    const [author, setAuthor] = useState<string>(metadata?.author ?? '');
    const [publisher, setPublisher] = useState<string>(metadata?.publisher ?? '');
    const [category, setCategory] = useState<BookCategory | undefined>(metadata?.category);
    const [tags, setTags] = useState<string[]>(metadata?.tags ?? []);

    const fileName = useMemo(() => {
        const name = filePath.split(/[\\/]/).pop() || filePath;
        return name.replace(/\.[^/.]+$/, "");
    }, [filePath]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            author: author.trim() || undefined,
            publisher: publisher.trim() || undefined,
            category,
            tags,
        });
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
                        <label className="block text-sm text-gray-300 mb-1" htmlFor="category">
                            カテゴリ
                        </label>
                        <select
                            id="category"
                            value={category ?? ''}
                            onChange={(e) => setCategory(e.target.value as BookCategory || undefined)}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">未分類</option>
                            {CATEGORY_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1" htmlFor="author">
                            作者
                        </label>
                        <input
                            id="author"
                            type="text"
                            list="author-list"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="例: 尾田 栄一郎"
                        />
                        <datalist id="author-list">
                            {authors.map((a) => (
                                <option key={a} value={a} />
                            ))}
                        </datalist>
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1" htmlFor="publisher">
                            出版社
                        </label>
                        <input
                            id="publisher"
                            type="text"
                            list="publisher-list"
                            value={publisher}
                            onChange={(e) => setPublisher(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="例: 集英社"
                        />
                        <datalist id="publisher-list">
                            {publishers.map((p) => (
                                <option key={p} value={p} />
                            ))}
                        </datalist>
                    </div>

                    <TagInput label="タグ" tags={tags} onChange={setTags} availableTags={availableTags} />

                    <div className="flex justify-between pt-4 border-t border-gray-700">
                        {onDelete && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm"
                            >
                                作品を削除
                            </button>
                        )}
                        <div className="flex gap-2 ml-auto">
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
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MetadataModal;
