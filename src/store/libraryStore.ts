import { create } from 'zustand';
import { BookMetadata, BookSearchCriteria, defaultSearchCriteria } from '../types/book';

export type SortOrder = 'natural' | 'name' | 'date' | 'author' | 'publisher' | 'recent';

export interface ReadingHistory {
    filePath: string;
    lastRead: number;
    currentPage: number;
    totalPages: number;
}

interface LibraryState {
    files: string[];
    covers: Record<string, string>;
    currentPath: string;
    metadata: Record<string, BookMetadata>;
    sortOrder: SortOrder;
    searchCriteria: BookSearchCriteria;
    loading: boolean;
    selectedCard: string | null;
    readingHistory: ReadingHistory[];

    setFiles: (files: string[]) => void;
    setCovers: (covers: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
    addCovers: (newCovers: Record<string, string>) => void;
    setCurrentPath: (path: string) => void;
    setMetadata: (metadata: Record<string, BookMetadata>) => void;
    updateMetadata: (path: string, metadata: BookMetadata) => void;
    setSortOrder: (order: SortOrder) => void;
    setSearchCriteria: (criteria: BookSearchCriteria) => void;
    setLoading: (loading: boolean) => void;
    setSelectedCard: (path: string | null) => void;
    addToHistory: (item: ReadingHistory) => void;
    reset: () => void;
}

const freshCriteria = () => ({ ...defaultSearchCriteria, tags: [...defaultSearchCriteria.tags] });

export const useLibraryStore = create<LibraryState>((set) => ({
    files: [],
    covers: {},
    currentPath: '',
    metadata: {},
    sortOrder: 'natural',
    searchCriteria: freshCriteria(),
    loading: false,
    selectedCard: null,
    readingHistory: [],

    setFiles: (files) => set({ files }),
    setCovers: (covers) => set((state) => ({
        covers: typeof covers === 'function' ? covers(state.covers) : covers
    })),
    addCovers: (newCovers) => set((state) => ({ covers: { ...state.covers, ...newCovers } })),
    setCurrentPath: (currentPath) => set({ currentPath }),
    setMetadata: (metadata) => set({ metadata }),
    updateMetadata: (path, metadata) => set((state) => ({
        metadata: {
            ...state.metadata,
            [path]: {
                ...metadata,
                tags: metadata.tags || [],
            },
        },
    })),
    setSortOrder: (sortOrder) => set({ sortOrder }),
    setSearchCriteria: (searchCriteria) => set({ searchCriteria: { ...searchCriteria, tags: [...searchCriteria.tags] } }),
    setLoading: (loading) => set({ loading }),
    setSelectedCard: (selectedCard) => set({ selectedCard }),
    addToHistory: (item) => set((state) => {
        // Remove existing entry for this file
        const filtered = state.readingHistory.filter(h => h.filePath !== item.filePath);
        // Add new entry at the beginning
        return { readingHistory: [item, ...filtered].slice(0, 50) }; // Keep last 50
    }),
    reset: () => set({
        files: [],
        covers: {},
        currentPath: '',
        metadata: {},
        sortOrder: 'natural',
        searchCriteria: freshCriteria(),
        loading: false,
        selectedCard: null,
        readingHistory: [],
    }),
}));
