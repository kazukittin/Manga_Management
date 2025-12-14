import { BookMetadata } from '../types/book';
import { ReadingHistory } from '../store/libraryStore';

export function naturalSort(a: string, b: string): number {
    return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: 'base'
    });
}

export function sortFiles(
    files: string[],
    order: 'name' | 'natural' | 'date' | 'author' | 'publisher' | 'recent',
    metadata?: Record<string, BookMetadata>,
    readingHistory?: ReadingHistory[]
): string[] {
    const sorted = [...files];

    switch (order) {
        case 'recent':
            // Sort by last read time, most recent first
            return sorted.sort((a, b) => {
                const historyA = readingHistory?.find(h => h.filePath === a);
                const historyB = readingHistory?.find(h => h.filePath === b);

                if (!historyA && !historyB) return naturalSort(a, b);
                if (!historyA) return 1; // b comes first
                if (!historyB) return -1; // a comes first

                return historyB.lastRead - historyA.lastRead; // Most recent first
            });
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
