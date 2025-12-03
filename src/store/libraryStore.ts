import { create } from 'zustand';
import { MangaMetadata } from '../types/manga';

export type SortOrder = 'name' | 'natural' | 'date';

interface LibraryState {
    files: string[];
    covers: Record<string, string>;
    currentPath: string;
    metadata: Record<string, MangaMetadata>;
    sortOrder: SortOrder;
    filterText: string;
    loading: boolean;

    setFiles: (files: string[]) => void;
    setCovers: (covers: Record<string, string>) => void;
    setCurrentPath: (path: string) => void;
    setMetadata: (metadata: Record<string, MangaMetadata>) => void;
    updateMetadata: (path: string, metadata: MangaMetadata) => void;
    setSortOrder: (order: SortOrder) => void;
    setFilterText: (text: string) => void;
    setLoading: (loading: boolean) => void;
    reset: () => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
    files: [],
    covers: {},
    currentPath: '',
    metadata: {},
    sortOrder: 'natural',
    filterText: '',
    loading: false,

    setFiles: (files) => set({ files }),
    setCovers: (covers) => set({ covers }),
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
    setFilterText: (filterText) => set({ filterText }),
    setLoading: (loading) => set({ loading }),
    reset: () => set({
        files: [],
        covers: {},
        currentPath: '',
        metadata: {},
        sortOrder: 'natural',
        filterText: '',
        loading: false,
    }),
}));
