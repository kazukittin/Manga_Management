import Store from 'electron-store';

interface StoreSchema {
    progress: Record<string, number>; // filePath -> lastPage
    preferences: {
        viewMode: 'single' | 'double';
        readingDirection: 'ltr' | 'rtl';
    };
}

const store = new Store<StoreSchema>({
    defaults: {
        progress: {},
        preferences: {
            viewMode: 'single',
            readingDirection: 'rtl',
        },
    },
});

export default store;
