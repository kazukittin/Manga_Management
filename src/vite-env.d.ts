/// <reference types="vite/client" />

interface Window {
    api: {
        selectDirectory: () => Promise<string | null>;
        scanLibrary: (path: string) => Promise<string[]>;
        getCovers: (filePaths: string[]) => Promise<Record<string, string>>;
        getCoversBatch: (filePaths: string[], startIndex: number, count: number) => Promise<Record<string, string>>;
        getSavedRoot: () => Promise<string | null>;
        setRoot: (path: string) => Promise<string>;
        getImageCount: (archivePath: string) => Promise<number>;
        saveProgress: (filePath: string, page: number) => Promise<void>;
        loadProgress: (filePath: string) => Promise<number>;
        savePreferences: (prefs: { viewMode: 'single' | 'double'; readingDirection: 'ltr' | 'rtl' }) => Promise<void>;
        loadPreferences: () => Promise<{ viewMode: 'single' | 'double'; readingDirection: 'ltr' | 'rtl' }>;
        loadMetadata: () => Promise<Record<string, { title?: string; author?: string; publisher?: string; tags: string[] }>>;
        saveMetadata: (filePath: string, metadata: { title?: string; author?: string; publisher?: string; tags: string[] }) => Promise<{ title?: string; author?: string; publisher?: string; tags: string[] }>;
        deleteManga: (filePath: string) => Promise<{ success: boolean; error?: string }>;
    }
}
