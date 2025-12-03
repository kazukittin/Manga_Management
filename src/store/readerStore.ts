import { create } from 'zustand';
import { ViewMode } from '../utils/pageCalculations';

interface ReaderState {
    viewMode: ViewMode;
    readingDirection: 'ltr' | 'rtl';
    currentPage: number;

    setViewMode: (mode: ViewMode) => void;
    setReadingDirection: (direction: 'ltr' | 'rtl') => void;
    setCurrentPage: (page: number) => void;
    loadPreferences: () => Promise<void>;
    savePreferences: () => Promise<void>;
    reset: () => void;
}

export const useReaderStore = create<ReaderState>((set, get) => ({
    viewMode: 'single',
    readingDirection: 'rtl', // Default to RTL for manga
    currentPage: 0,

    setViewMode: (viewMode) => {
        set({ viewMode });
        get().savePreferences();
    },
    setReadingDirection: (readingDirection) => {
        set({ readingDirection });
        get().savePreferences();
    },
    setCurrentPage: (currentPage) => set({ currentPage }),

    loadPreferences: async () => {
        try {
            const prefs = await window.api.loadPreferences();
            if (!prefs) return;

            set({ viewMode: prefs.viewMode, readingDirection: prefs.readingDirection });
        } catch (error) {
            console.error('Failed to load preferences:', error);
        }
    },

    savePreferences: async () => {
        try {
            const { viewMode, readingDirection } = get();
            await window.api.savePreferences({ viewMode, readingDirection });
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    },

    reset: () => set({
        currentPage: 0,
    }),
}));

