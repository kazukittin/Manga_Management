import { useMemo } from 'react';
import { useLibraryStore } from '../store/libraryStore';

export const useMetadataOptions = () => {
    const { metadata } = useLibraryStore();

    const options = useMemo(() => {
        const authors = new Set<string>();
        const publishers = new Set<string>();

        Object.values(metadata).forEach((meta) => {
            if (meta.author?.trim()) {
                authors.add(meta.author.trim());
            }
            if (meta.publisher?.trim()) {
                publishers.add(meta.publisher.trim());
            }
        });

        return {
            authors: Array.from(authors).sort((a, b) => a.localeCompare(b, 'ja')),
            publishers: Array.from(publishers).sort((a, b) => a.localeCompare(b, 'ja')),
        };
    }, [metadata]);

    return options;
};
