import React, { useMemo, useState } from 'react';
import { MangaMetadata } from '../types/manga';

interface MetadataModalProps {
    filePath: string;
    metadata?: MangaMetadata;
    onSave: (metadata: MangaMetadata) => void;
    onClose: () => void;
}

const normalizeTags = (value: string): string[] =>
    value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

const MetadataModal: React.FC<MetadataModalProps> = ({ filePath, metadata, onSave, onClose }) => {
    const [author, setAuthor] = useState<string>(metadata?.author ?? '');
    const [publisher, setPublisher] = useState<string>(metadata?.publisher ?? '');
    const [tagsInput, setTagsInput] = useState<string>(metadata?.tags?.join(', ') ?? '');

    const fileName = useMemo(() => filePath.split(/[/\\]/).pop() || filePath, [filePath]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const tags = normalizeTags(tagsInput);
        onSave({
            author: author.trim() || undefined,
            publisher: publisher.trim() || undefined,
            tags,
        });
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-full max-w-lg">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                    <div>
                        <p className="text-xs text-gray-400">Editing metadata for</p>
                        <h2 className="text-lg font-semibold text-white truncate" title={filePath}>{fileName}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white focus:outline-none"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm text-gray-300 mb-1" htmlFor="author">
                            Author
                        </label>
                        <input
                            id="author"
                            type="text"
                            value={author}
                            onChange={(e) => setAuthor(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. 尾田 栄一郎"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1" htmlFor="publisher">
                            Publisher
                        </label>
                        <input
                            id="publisher"
                            type="text"
                            value={publisher}
                            onChange={(e) => setPublisher(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="e.g. 集英社"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1" htmlFor="tags">
                            Tags (comma separated)
                        </label>
                        <input
                            id="tags"
                            type="text"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="バトル, 完結, 推し"
                        />
                        <p className="text-xs text-gray-500 mt-1">Tags will be split by commas and trimmed.</p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-gray-800 border border-gray-700 text-sm text-gray-300 hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MetadataModal;
