/// <reference types="vite/client" />

interface Window {
    api: {
        selectDirectory: () => Promise<string | null>;
        scanLibrary: (path: string) => Promise<string[]>;
        getCovers: (filePaths: string[]) => Promise<Record<string, string>>;
        getImageCount: (archivePath: string) => Promise<number>;
        saveProgress: (filePath: string, page: number) => Promise<void>;
        loadProgress: (filePath: string) => Promise<number>;
        savePreferences: (prefs: { viewMode: 'single' | 'double'; readingDirection: 'ltr' | 'rtl' }) => Promise<void>;
        loadPreferences: () => Promise<{ viewMode: 'single' | 'double'; readingDirection: 'ltr' | 'rtl' }>;
    }
}
