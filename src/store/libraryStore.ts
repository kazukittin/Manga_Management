import { create } from 'zustand';
import { MangaMetadata, MangaSearchCriteria, defaultSearchCriteria } from '../types/manga';

export type SortOrder = 'name' | 'natural' | 'date' | 'author' | 'publisher';

interface LibraryState {
    files: string[];
    covers: Record<string, string>;
    currentPath: string;
    metadata: Record<string, MangaMetadata>;
    sortOrder: SortOrder;
    searchCriteria: MangaSearchCriteria;
    loading: boolean;

    setFiles: (files: string[]) => void;
    setCovers: (covers: Record<string, string>) => void;
    setCurrentPath: (path: string) => void;
    setMetadata: (metadata: Record<string, MangaMetadata>) => void;
    updateMetadata: (path: string, metadata: MangaMetadata) => void;
    setSortOrder: (order: SortOrder) => void;
    setSearchCriteria: (criteria: MangaSearchCriteria) => void;
    setLoading: (loading: boolean) => void;
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
    setSearchCriteria: (searchCriteria) => set({ searchCriteria: { ...searchCriteria, tags: [...searchCriteria.tags] } }),
    setLoading: (loading) => set({ loading }),
    reset: () => set({
        files: [],
        covers: {},
        currentPath: '',
        metadata: {},
        sortOrder: 'natural',
        searchCriteria: freshCriteria(),
        loading: false,
    }),
}));
