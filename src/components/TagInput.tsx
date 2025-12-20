import React, { useState, useRef, useEffect } from 'react';

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
    const [isOpen, setIsOpen] = useState(false);
    const [filteredTags, setFilteredTags] = useState<string[]>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Filter available tags based on input
    useEffect(() => {
        if (tagInput) {
            const filtered = availableTags.filter(tag =>
                tag.toLowerCase().includes(tagInput.toLowerCase()) && !tags.includes(tag)
            );
            setFilteredTags(filtered.slice(0, 30));
        } else {
            const filtered = availableTags.filter(tag => !tags.includes(tag));
            setFilteredTags(filtered.slice(0, 30));
        }
    }, [tagInput, availableTags, tags]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const addTag = (value?: string) => {
        const tagToAdd = (value || tagInput).trim();
        if (!tagToAdd || tags.includes(tagToAdd)) return;
        onChange([...tags, tagToAdd]);
        setTagInput('');
        setIsOpen(false);
    };

    const removeTag = (tag: string) => {
        onChange(tags.filter((t) => t !== tag));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
        } else if (e.key === 'Escape') {
            setIsOpen(false);
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
                <div ref={wrapperRef} className="relative flex-1">
                    <input
                        id={`tag-input-${label}`}
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onFocus={() => setIsOpen(true)}
                        onKeyDown={handleKeyDown}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={placeholder}
                        autoComplete="off"
                    />

                    {/* Custom dropdown like ComboBox */}
                    {isOpen && filteredTags.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                            {filteredTags.map((tag, index) => (
                                <button
                                    key={`${tag}-${index}`}
                                    type="button"
                                    onClick={() => addTag(tag)}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
                                >
                                    <span className="opacity-50 mr-1">#</span>{tag}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => addTag()}
                    className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {addLabel}
                </button>
            </div>
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                    {tags.map((tag, index) => (
                        <span
                            key={tag}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm transition-all duration-200 hover:scale-105 ${index % 3 === 0
                                ? 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border border-violet-500/30 hover:border-violet-400/50'
                                : index % 3 === 1
                                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400/50'
                                    : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/50'
                                }`}
                        >
                            <span className="opacity-60">#</span>{tag}
                            <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="text-current opacity-50 hover:opacity-100 transition-opacity"
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
