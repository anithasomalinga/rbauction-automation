import { test as base } from '@playwright/test';
import { LocationsClient } from '@api/clients/LocationsClient';
import { NextDataClient } from '@api/clients/NextDataClient';
import { SearchApiClient } from '@api/clients/SearchApiClient';
import { getEnvironment } from '@config/environments';

export interface ApiFixtures {
  nextData: NextDataClient;
  locations: LocationsClient;
  searchApi: SearchApiClient;
}

/**
 * API clients, built on the test-scoped `request` context so every call is isolated per test
 * and recorded in the test's trace. Clients are created lazily: a test only pays for what it uses.
 */
export const test = base.extend<ApiFixtures>({
  nextData: async ({ request }, use) => {
    await use(new NextDataClient(request, getEnvironment().locale));
  },
  locations: async ({ nextData }, use) => {
    await use(new LocationsClient(nextData));
  },
  searchApi: async ({ request }, use) => {
    await use(new SearchApiClient(request));
  },
});
