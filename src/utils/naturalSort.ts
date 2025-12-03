export function naturalSort(a: string, b: string): number {
    return a.localeCompare(b, undefined, {
        numeric: true,
        sensitivity: 'base'
    });
}

export function sortFiles(files: string[], order: 'name' | 'natural' | 'date'): string[] {
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
        default:
            return sorted;
    }
}
