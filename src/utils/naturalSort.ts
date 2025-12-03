import { MangaMetadata } from '../types/manga';

export function naturalSort(a: string, b: string): number {
    return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: 'base'
    });
}

export function sortFiles(
    files: string[],
    order: 'name' | 'natural' | 'date' | 'author' | 'publisher',
    metadata?: Record<string, MangaMetadata>
): string[] {
    const sorted = [...files];

    switch (order) {
        case 'natural':
            return sorted.sort(naturalSort);
        case 'name':
            return sorted.sort((a, b) => a.localeCompare(b));
        case 'date':
            // Date sorting would require file stats, which we don't have yet
            // For now, just return natural sort
            return sorted.sort(naturalSort);
        case 'author':
            return sorted.sort((a, b) => {
                const authorA = metadata?.[a]?.author || '';
                const authorB = metadata?.[b]?.author || '';
                // Sort by author, then by natural sort for files with same author
                return authorA.localeCompare(authorB, 'ja') || naturalSort(a, b);
            });
        case 'publisher':
            return sorted.sort((a, b) => {
                const publisherA = metadata?.[a]?.publisher || '';
                const publisherB = metadata?.[b]?.publisher || '';
                // Sort by publisher, then by natural sort
                return publisherA.localeCompare(publisherB, 'ja') || naturalSort(a, b);
            });
        default:
            return sorted;
    }
}
