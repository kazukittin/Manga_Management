export interface MangaMetadata {
    author?: string;
    publisher?: string;
    tags: string[];
}

export interface MangaItem extends MangaMetadata {
    path: string;
    title: string;
}
