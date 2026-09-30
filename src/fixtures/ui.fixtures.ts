import { test as base } from '@playwright/test';
import { autoDismissCookieBanner } from '@pages/components/CookieBanner';
import { LocationsPage } from '@pages/LocationsPage';
import { SearchResultsPage } from '@pages/SearchResultsPage';
import { YardDetailPage } from '@pages/YardDetailPage';

export interface UiFixtures {
  locationsPage: LocationsPage;
  yardPage: YardDetailPage;
  searchPage: SearchResultsPage;
}

/** Page objects. Every page gets the cookie banner handler before a test touches it. */
export const test = base.extend<UiFixtures>({
  page: async ({ page }, use) => {
    await autoDismissCookieBanner(page);
    await use(page);
  },
  locationsPage: async ({ page }, use) => {
    await use(new LocationsPage(page));
  },
  yardPage: async ({ page }, use) => {
    await use(new YardDetailPage(page));
  },
  searchPage: async ({ page }, use) => {
    await use(new SearchResultsPage(page));
  },
});
