import React, { useState } from 'react';

interface TagInputProps {
    label?: string;
    placeholder?: string;
    addLabel?: string;
    tags: string[];
    onChange: (tags: string[]) => void;
    availableTags?: string[];
}

const TagInput: React.FC<TagInputProps> = ({ label, placeholder = 'タグを入力', addLabel = '追加', tags, onChange, availableTags = [] }) => {
    const [tagInput, setTagInput] = useState('');

    const addTag = () => {
        const value = tagInput.trim();
        if (!value || tags.includes(value)) return;
        onChange([...tags, value]);
        setTagInput('');
    };

    const removeTag = (tag: string) => {
        onChange(tags.filter((t) => t !== tag));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        }
    };

    return (
        <div>
            {label && (
                <label className="block text-sm text-gray-300 mb-1" htmlFor={`tag-input-${label}`}>
                    {label}
                </label>
            )}
            <div className="flex items-center gap-2">
                <input
                    id={`tag-input-${label}`}
                    type="text"
                    list={`tag-datalist-${label}`}
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={placeholder}
                />
                <datalist id={`tag-datalist-${label}`}>
                    {availableTags.map((tag) => (
                        <option key={tag} value={tag} />
                    ))}
                </datalist>
                <button
                    type="button"
                    onClick={addTag}
                    className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {addLabel}
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
    );
};

export default TagInput;
