import { BookCategory } from '../types/book';

/**
 * Get the default reading direction based on content category.
 * Manga reads right-to-left, others (novels, reference, etc.) read left-to-right.
 */
export function getDefaultReadingDirection(category?: BookCategory): 'ltr' | 'rtl' {
  return category === 'manga' ? 'rtl' : 'ltr';
}
