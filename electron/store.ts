import Store from 'electron-store';

interface StoreSchema {
    progress: Record<string, number>; // filePath -> lastPage
    preferences: {
        viewMode: 'single' | 'double';
        readingDirection: 'ltr' | 'rtl';
    };
    mangaRootPath?: string;
    metadata: Record<string, {
        title?: string;
        author?: string;
        publisher?: string;
        tags: string[];
    }>;
}

const store = new Store<StoreSchema>({
    defaults: {
        progress: {},
        preferences: {
            viewMode: 'single',
            readingDirection: 'rtl',
        },
        mangaRootPath: undefined,
        metadata: {},
    },
});

export default store;
