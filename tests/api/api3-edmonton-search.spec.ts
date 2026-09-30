import { test, expect } from '@fixtures';
import { SearchResponseSchema } from '@api/schemas/search.schema';
import { buildSearch } from '@data/searchPayloads';
import { EDMONTON } from '@data/yards';
import { logTotalAndTitles, recordCount } from '@utils/report';

/**
 * API 3: Edmonton inventory search, POST /api/search with freeText "Edmonton"; the API behind
 * /search?freeText=Edmonton. Only the first page is requested: totalAmount is the full hit count.
 */
const SEARCH_TEXT = EDMONTON.name;
const TITLES_TO_LOG = 5;

test.describe('API 3: Edmonton inventory search (POST /api/search)', { tag: '@API3' }, () => {
  test('A3.1 response is HTTP 200 and JSON', { tag: '@smoke' }, async ({ searchApi }) => {
    const response = await searchApi.searchRaw(buildSearch(SEARCH_TEXT));

    expect(response.status).toBe(200);
    expect(response.header('content-type')).toContain('application/json');
    await expect(response.json(SearchResponseSchema)).resolves.toBeDefined();
  });

  test('A3.2 total hit count (results.totalAmount) is greater than 0', { tag: '@smoke' }, async ({
    searchApi,
  }) => {
    const { results } = await searchApi.search(buildSearch(SEARCH_TEXT));
    recordCount('total results', results.totalAmount);

    expect(results.totalAmount, 'results.totalAmount').toBeGreaterThan(0);
  });

  test('A3.3 first page of records is non-empty and each record has an assetDescription', async ({
    searchApi,
  }) => {
    const { results } = await searchApi.search(buildSearch(SEARCH_TEXT));
    recordCount('records on first page', results.records.length);

    expect(results.records.length, 'records on the first page').toBeGreaterThan(0);
    const untitled = results.records.filter((record) => !record.assetDescription.trim());
    expect(
      untitled.map((record) => record.itemNumber),
      'records without an assetDescription',
    ).toEqual([]);
  });

  test('A3.4 log the total count and the first 5 titles', async ({ searchApi }) => {
    const { results } = await searchApi.search(buildSearch(SEARCH_TEXT));
    const titles = results.records.slice(0, TITLES_TO_LOG).map((record) => record.assetDescription);

    logTotalAndTitles(SEARCH_TEXT, results.totalAmount, titles);

    expect(titles, 'titles logged').toHaveLength(TITLES_TO_LOG);
  });
});
