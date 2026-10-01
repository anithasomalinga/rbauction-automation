import type { SearchRequest } from '@api/schemas/search.schema';

export const SEARCH_PAGE_SIZE = 60;

/**
 * A search text that matches nothing (4.3, A3.5). Letters only: digits also match lot numbers,
 * which brings back "Results matching fewer words".
 */
export const NO_MATCH_SEARCH_TEXT = 'zzqxnoresultsqa';

/**
 * Builds a search request body. Pages are 1-based, as shown in the UI; the API expects
 * a record offset, which is omitted for page 1 just as the site does.
 */
export function buildSearch(freeText: string, page = 1): SearchRequest {
  if (!Number.isInteger(page) || page < 1) {
    throw new Error(`page must be a positive integer, got ${page}`);
  }
  return page === 1 ? { freeText } : { freeText, from: (page - 1) * SEARCH_PAGE_SIZE };
}
