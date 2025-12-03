export type ViewMode = 'single' | 'double';

export function isCoverPage(pageIndex: number): boolean {
    return pageIndex === 0;
}

export function getDisplayPages(
    currentPage: number,
    viewMode: ViewMode,
    totalPages: number,
    rtl: boolean
): number[] {
    if (currentPage < 0 || currentPage >= totalPages) {
        return [];
    }

    if (viewMode === 'single') {
        return [currentPage];
    }

    // Double page mode
    if (isCoverPage(currentPage)) {
        // Cover page always displays alone
        return [0];
    }

    // For manga offset: pages 1-2, 3-4, 5-6, etc.
    // Determine if current page is odd or even (after cover)
    const isOddPage = currentPage % 2 === 1;

    if (isOddPage) {
        // Odd page (1, 3, 5...) - pair with next page
        const nextPage = currentPage + 1;
        if (nextPage < totalPages) {
            return rtl ? [nextPage, currentPage] : [currentPage, nextPage];
        } else {
            // Last page is odd, display alone
            return [currentPage];
        }
    } else {
        // Even page (2, 4, 6...) - pair with previous page
        const prevPage = currentPage - 1;
        return rtl ? [currentPage, prevPage] : [prevPage, currentPage];
    }
}

export function getNextPage(
    currentPage: number,
    viewMode: ViewMode,
    totalPages: number,
    _rtl: boolean
): number {
    if (totalPages === 0) {
        return 0;
    }

    if (currentPage >= totalPages - 1) {
        return 0; // Wrap around to the first page
    }

    if (viewMode === 'single') {
        return currentPage + 1;
    }

    // Double page mode
    if (isCoverPage(currentPage)) {
        // From cover, go to page 1
        return 1;
    }

    const isOddPage = currentPage % 2 === 1;

    if (isOddPage) {
        // From odd page, jump 2 pages (to next spread)
        const next = currentPage + 2;
        return Math.min(next, totalPages - 1);
    } else {
        // From even page, jump 1 page (to next spread)
        const next = currentPage + 1;
        return Math.min(next, totalPages - 1);
    }
}

export function getPrevPage(
    currentPage: number,
    viewMode: ViewMode,
    _totalPages: number,
    _rtl: boolean
): number {
    if (currentPage <= 0) {
        return 0; // Already at first page
    }

    if (viewMode === 'single') {
        return currentPage - 1;
    }

    // Double page mode
    if (currentPage === 1) {
        // From page 1, go back to cover
        return 0;
    }

    const isOddPage = currentPage % 2 === 1;

    if (isOddPage) {
        // From odd page, jump 2 pages back
        const prev = currentPage - 2;
        return Math.max(prev, 0);
    } else {
        // From even page, jump 1 page back
        const prev = currentPage - 1;
        return Math.max(prev, 0);
    }
}
