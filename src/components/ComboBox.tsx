import React, { useState, useRef, useEffect } from 'react';

interface ComboBoxProps {
    id: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
}

const ComboBox: React.FC<ComboBoxProps> = ({ id, value, onChange, options, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filteredOptions, setFilteredOptions] = useState<string[]>([]);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (value) {
            const filtered = options.filter(opt =>
                opt.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredOptions(filtered.slice(0, 50)); // Limit to 50 items
        } else {
            setFilteredOptions(options.slice(0, 50));
        }
    }, [value, options]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={wrapperRef} className="relative">
            <input
                id={id}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsOpen(true)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={placeholder}
                autoComplete="off"
            />

            {isOpen && filteredOptions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {filteredOptions.map((opt, index) => (
                        <button
                            key={`${opt}-${index}`}
                            type="button"
                            onClick={() => {
                                onChange(opt);
                                setIsOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors first:rounded-t-lg last:rounded-b-lg"
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ComboBox;
