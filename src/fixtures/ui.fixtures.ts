import { test as base } from '@playwright/test';
import { getEnvironment } from '@config/environments';
import { acceptCookieConsent, autoDismissCookieBanner } from '@pages/components/CookieBanner';
import { LocationsPage } from '@pages/LocationsPage';
import { SearchResultsPage } from '@pages/SearchResultsPage';
import { YardDetailPage } from '@pages/YardDetailPage';

export interface UiFixtures {
  locationsPage: LocationsPage;
  yardPage: YardDetailPage;
  searchPage: SearchResultsPage;
}

/**
 * Page objects. Every browser context starts with cookie consent given, and every page gets the
 * cookie banner handler as a fallback, before a test touches it.
 */
export const test = base.extend<UiFixtures>({
  context: async ({ context }, use) => {
    await acceptCookieConsent(context, getEnvironment().baseURL);
    await use(context);
  },
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
