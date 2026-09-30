import type { Locator, Page } from '@playwright/test';
import { BasePage } from '@pages/BasePage';
import { parseDisplayedCount } from '@utils/parseCount';

export const SEARCH_PATH = '/search';

export interface ResultCard {
  title: string;
  /** undefined when the card shows no location / closing date */
  location?: string;
  closing?: string;
}

export interface DisplayedTotal {
  /** Abbreviated total from the header, e.g. "2.1k results for "Edmonton"" → 2100 */
  header: number;
  /** Exact total from the pagination summary, e.g. "1-60 of 2136" → 2136 */
  exact?: number;
  /** The most precise total shown */
  total: number;
}

/** Inventory search results: /search?freeText=... */
export class SearchResultsPage extends BasePage {
  readonly searchInput: Locator;
  readonly resultCountHeader: Locator;
  /** e.g. "1-60 of 2136" below the first page of results */
  readonly paginationSummary: Locator;
  readonly resultCards: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByTestId('search input');
    this.resultCountHeader = page.getByTestId('search-count-header');
    this.paginationSummary = page.getByText(/^\s*\d[\d,]*\s*-\s*\d[\d,]*\s+of\s+\d[\d,]*\s*$/);
    this.resultCards = page.getByTestId(/^searchResultItemCard-/);
  }

  async open(freeText: string): Promise<void> {
    await this.goto(`${SEARCH_PATH}?${new URLSearchParams({ freeText }).toString()}`);
  }

  /** Reads the result total as displayed; never counts cards. */
  async getDisplayedTotal(): Promise<DisplayedTotal> {
    await this.resultCountHeader.waitFor();
    const header = parseDisplayedCount(await this.resultCountHeader.innerText());
    const summary = (await this.paginationSummary.count())
      ? await this.paginationSummary.first().innerText()
      : undefined;
    const exact = summary ? parseDisplayedCount(summary.split(/\bof\b/)[1] ?? '') : undefined;
    return { header, exact, total: exact ?? header };
  }

  async getResultCards(): Promise<ResultCard[]> {
    await this.resultCards.first().waitFor();
    return this.resultCards.evaluateAll((cards) =>
      cards.map((card) => {
        const text = (selector: string) => card.querySelector(selector)?.textContent?.trim();
        return {
          title: text('[data-testid="item-card-title-link"]') ?? '',
          location: text('p[title]'),
          closing: text('[data-testid="end-date-section"]'),
        };
      }),
    );
  }
}
