export type SearchMode = 'AND' | 'OR';

export type BookCategory = 'manga' | 'novel' | 'reference' | 'other' | 'uncategorized';

export const CATEGORY_OPTIONS: { value: BookCategory; label: string }[] = [
    { value: 'manga', label: 'マンガ' },
    { value: 'novel', label: '小説' },
    { value: 'reference', label: '参考書' },
    { value: 'other', label: 'その他' },
    { value: 'uncategorized', label: '未分類' },
];

export interface BookMetadata {
    title: string;
    author?: string;
    publisher?: string;
    category?: BookCategory;
    tags: string[];
}

export interface BookItem {
    path: string;
    metadata: BookMetadata;
}

export interface BookSearchCriteria {
    title?: string;
    author?: string;
    publisher?: string;
    category?: BookCategory;
    tags: string[];
    mode: SearchMode;
}

const normalizeText = (value?: string) => value?.trim().toLowerCase() ?? '';

const normalizeTags = (tags: string[]) => tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);

export function filterBooksByCriteria(bookList: BookItem[], criteria: BookSearchCriteria): BookItem[] {
    const hasTitle = Boolean(criteria.title?.trim());
    const hasAuthor = Boolean(criteria.author?.trim());
    const hasPublisher = Boolean(criteria.publisher?.trim());
    const hasCategory = Boolean(criteria.category);
    const hasTags = criteria.tags.length > 0;

    const normalizedTitle = normalizeText(criteria.title);
    const normalizedAuthor = normalizeText(criteria.author);
    const normalizedPublisher = normalizeText(criteria.publisher);
    const normalizedSearchTags = normalizeTags(criteria.tags);

    const noCriteria = !hasTitle && !hasAuthor && !hasPublisher && !hasCategory && !hasTags;

    return bookList.filter(({ metadata }) => {
        const matchesTitle = hasTitle
            ? normalizeText(metadata.title).includes(normalizedTitle)
            : true;
        const matchesAuthor = hasAuthor
            ? normalizeText(metadata.author).includes(normalizedAuthor)
            : true;
        const matchesPublisher = hasPublisher
            ? normalizeText(metadata.publisher).includes(normalizedPublisher)
            : true;
        const matchesCategory = hasCategory
            ? (criteria.category === 'uncategorized'
                ? (!metadata.category || metadata.category === 'uncategorized')
                : metadata.category === criteria.category)
            : true;
        const matchesTags = hasTags
            ? normalizedSearchTags.every((tag) => normalizeTags(metadata.tags).includes(tag))
            : true;

        if (criteria.mode === 'AND') {
            return matchesTitle && matchesAuthor && matchesPublisher && matchesCategory && matchesTags;
        }

        // OR search
        if (noCriteria) return true;

        const tagAnyMatch = hasTags
            ? normalizeTags(metadata.tags).some((tag) => normalizedSearchTags.includes(tag))
            : false;

        return (
            (hasTitle && matchesTitle) ||
            (hasAuthor && matchesAuthor) ||
            (hasPublisher && matchesPublisher) ||
            (hasCategory && matchesCategory) ||
            (hasTags && tagAnyMatch)
        );
    });
}

export const defaultSearchCriteria: BookSearchCriteria = {
    title: '',
    author: '',
    publisher: '',
    category: undefined,
    tags: [],
    mode: 'AND',
};
