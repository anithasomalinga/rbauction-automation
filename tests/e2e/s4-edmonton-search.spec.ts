import { test, expect } from '@fixtures';
import { SEARCH_PATH } from '@pages/SearchResultsPage';
import { NO_MATCH_SEARCH_TEXT } from '@data/searchPayloads';
import { EDMONTON } from '@data/yards';
import { logTotalAndTitles, recordCount } from '@utils/report';

/** Scenario 4: Edmonton inventory search */
const SEARCH_TEXT = EDMONTON.name;
const TITLES_TO_LOG = 5;

test.describe('Scenario 4: Edmonton inventory search', { tag: '@S4' }, () => {
  test('4.1 open the Edmonton search', { tag: '@smoke' }, async ({ searchPage }) => {
    await searchPage.open(SEARCH_TEXT);

    await expect(searchPage.page).toHaveURL(new RegExp(`${SEARCH_PATH}\\?freeText=${SEARCH_TEXT}`));
    await expect(searchPage.searchInput).toHaveValue(SEARCH_TEXT);
    await expect(searchPage.resultCountHeader).toContainText(`"${SEARCH_TEXT}"`);
    await expect(searchPage.resultCards.first()).toBeVisible();
  });

  test('4.2 Results', async ({ searchPage }) => {
    await searchPage.open(SEARCH_TEXT);

    const displayed = await searchPage.getDisplayedTotal();
    recordCount('displayed total', displayed.total);
    recordCount('header total (abbreviated)', displayed.header);
    recordCount('pagination total (exact)', displayed.exact ?? 'not shown');
    expect(displayed.total, 'displayed result total').toBeGreaterThan(0);

    const cards = await searchPage.getResultCards();
    const untitled = cards.filter((card) => !card.title);
    expect(untitled, 'lots without a title').toEqual([]);
    // Location and closing date are optional on a card, but must not be empty when shown
    const emptyDetails = cards.filter((card) => card.location === '' || card.closing === '');
    expect(emptyDetails, 'lots with an empty location or closing date').toEqual([]);

    logTotalAndTitles(
      SEARCH_TEXT,
      displayed.total,
      cards.slice(0, TITLES_TO_LOG).map((card) => card.title),
    );
  });

  test('4.3 a search with no matches says so', { tag: '@negative' }, async ({ searchPage }) => {
    await searchPage.open(NO_MATCH_SEARCH_TEXT);

    await expect(searchPage.searchInput).toHaveValue(NO_MATCH_SEARCH_TEXT);
    await expect(searchPage.noMatchesTitle).toHaveText(
      `No exact matches found for "${NO_MATCH_SEARCH_TEXT}"`,
    );
    await expect(searchPage.resultCountHeader).toHaveCount(0);
    await expect(searchPage.resultCards).toHaveCount(0);
  });
});
