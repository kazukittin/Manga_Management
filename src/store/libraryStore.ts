import { create } from 'zustand';

export type SortOrder = 'name' | 'natural' | 'date';

interface LibraryState {
    files: string[];
    covers: Record<string, string>;
    currentPath: string;
    sortOrder: SortOrder;
    filterText: string;
    loading: boolean;

    setFiles: (files: string[]) => void;
    setCovers: (covers: Record<string, string>) => void;
    setCurrentPath: (path: string) => void;
    setSortOrder: (order: SortOrder) => void;
    setFilterText: (text: string) => void;
    setLoading: (loading: boolean) => void;
    reset: () => void;
}

export const useLibraryStore = create<LibraryState>((set) => ({
    files: [],
    covers: {},
    currentPath: '',
    sortOrder: 'natural',
    filterText: '',
    loading: false,

    setFiles: (files) => set({ files }),
    setCovers: (covers) => set({ covers }),
    setCurrentPath: (currentPath) => set({ currentPath }),
    setSortOrder: (sortOrder) => set({ sortOrder }),
    setFilterText: (filterText) => set({ filterText }),
    setLoading: (loading) => set({ loading }),
    reset: () => set({
        files: [],
        covers: {},
        currentPath: '',
        sortOrder: 'natural',
        filterText: '',
        loading: false,
    }),
}));
