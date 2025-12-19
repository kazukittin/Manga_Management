import React, { useMemo, useState } from 'react';
import TagInput from './TagInput';
import ComboBox from './ComboBox';
import { BookMetadata, BookCategory, CATEGORY_OPTIONS } from '../types/book';
import { useMetadataOptions } from '../hooks/useMetadataOptions';

type MetadataFormValue = Partial<BookMetadata>;

interface MetadataModalProps {
    filePath: string;
    metadata?: BookMetadata;
    onSave: (metadata: MetadataFormValue, cover?: string) => void;
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

    const [isFetching, setIsFetching] = useState(false);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            author: author.trim() || undefined,
            publisher: publisher.trim() || undefined,
            category,
            tags,
        }, coverPreview || undefined);
    };

    const handleFetchMetadata = async () => {
        setIsFetching(true);
        setCoverPreview(null);
        try {
            const result = await window.api.fetchMetadataByTitle(fileName);
            if (result) {
                if (result.author) setAuthor(result.author);
                if (result.publisher) setPublisher(result.publisher);
                if (result.category) setCategory(result.category);
                if (result.tags && result.tags.length > 0) {
                    const newTags = Array.from(new Set([...tags, ...result.tags]));
                    setTags(newTags);
                }
                if (result.cover) {
                    setCoverPreview(result.cover);
                }
            }
        } catch (error) {
            console.error('Failed to fetch metadata:', error);
        } finally {
            setIsFetching(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                    <div className="flex-1 min-w-0 mr-4">
                        <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-400">メタデータ編集</p>
                            <button
                                type="button"
                                onClick={handleFetchMetadata}
                                disabled={isFetching}
                                className="text-xs bg-blue-600 px-2 py-0.5 rounded text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
                            >
                                {isFetching ? '取得中...' : 'Webから取得'}
                            </button>
                        </div>
                        <h2 className="text-lg font-semibold text-white truncate" title={filePath}>{fileName}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white focus:outline-none flex-shrink-0"
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
                        <ComboBox
                            id="author"
                            value={author}
                            onChange={setAuthor}
                            options={authors}
                            placeholder="例: 尾田 栄一郎"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1" htmlFor="publisher">
                            出版社
                        </label>
                        <ComboBox
                            id="publisher"
                            value={publisher}
                            onChange={setPublisher}
                            options={publishers}
                            placeholder="例: 集英社"
                        />
                    </div>

                    <TagInput label="タグ" tags={tags} onChange={setTags} availableTags={availableTags} />



                    {coverPreview && (
                        <div className="mt-4">
                            <p className="text-sm text-gray-300 mb-1">取得した表紙画像</p>
                            <img src={coverPreview} alt="Fetched Cover" className="h-48 object-contain rounded border border-gray-700" />
                        </div>
                    )}

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
