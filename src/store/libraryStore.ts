import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
    libraryPaths: string[];
    metadata: Record<string, BookMetadata>;
    sortOrder: SortOrder;
    searchCriteria: BookSearchCriteria;
    loading: boolean;
    selectedCard: string | null;
    readingHistory: ReadingHistory[];

    setFiles: (files: string[]) => void;
    setCovers: (covers: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
    addCovers: (newCovers: Record<string, string>) => void;
    setLibraryPaths: (paths: string[]) => void;
    addLibraryPath: (path: string) => void;
    removeLibraryPath: (path: string) => void;
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

export const useLibraryStore = create<LibraryState>()(
    persist(
        (set) => ({
            files: [],
            covers: {},
            libraryPaths: [],
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
            setLibraryPaths: (libraryPaths) => set({ libraryPaths }),
            addLibraryPath: (path) => set((state) => ({
                libraryPaths: state.libraryPaths.includes(path) ? state.libraryPaths : [...state.libraryPaths, path]
            })),
            removeLibraryPath: (path) => set((state) => ({
                libraryPaths: state.libraryPaths.filter(p => p !== path)
            })),
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
                libraryPaths: [],
                metadata: {},
                sortOrder: 'natural',
                searchCriteria: freshCriteria(),
                loading: false,
                selectedCard: null,
                readingHistory: [],
            }),
        }),
        {
            name: 'library-storage',
            partialize: (state) => ({ readingHistory: state.readingHistory }),
        }
    )
);
