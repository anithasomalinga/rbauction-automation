import { BaseApiClient, type ApiResponse } from '@api/clients/BaseApiClient';
import {
  SearchResponseSchema,
  type SearchRequest,
  type SearchResponse,
} from '@api/schemas/search.schema';

const SEARCH_PATH = '/api/search';
// Same query parameter the search page sends, so tests exercise the real traffic shape
const SEARCH_PARAMS = { source: 'search_page' };

/** Inventory search: POST /api/search, the API behind /search?freeText=... */
export class SearchApiClient extends BaseApiClient {
  /** Search that must succeed; returns the validated, typed response. */
  search(request: SearchRequest): Promise<SearchResponse> {
    return this.postJson(SEARCH_PATH, request, SearchResponseSchema, { params: SEARCH_PARAMS });
  }

  /** Raw search with any body and whatever status comes back (negative and timing tests). */
  searchRaw(body: unknown): Promise<ApiResponse> {
    return this.send('POST', SEARCH_PATH, { data: body, params: SEARCH_PARAMS });
  }
}
