import { test, expect } from '@fixtures';
import { yardPath } from '@api/clients/LocationsClient';
import { CANADA, EDMONTON, UNKNOWN_YARD_SLUG } from '@data/yards';

/** Scenario 2: open a yard from the directory */
test.describe('Scenario 2: open a yard from the directory', { tag: '@S2' }, () => {
  test.beforeEach(async ({ locationsPage }) => {
    await locationsPage.open();
  });

  test('2.1 Find Edmonton under Canada and is not a satellite', async ({ locationsPage }) => {
    const edmonton = (await locationsPage.getSites(CANADA.name)).find(
      (site) => site.name === EDMONTON.name,
    );

    expect(edmonton, 'Edmonton under Canada').toBeDefined();
    expect(edmonton?.satellite, 'Edmonton is a satellite').toBe(false);
  });

  test('2.2 clicking Edmonton opens the Edmonton yard page', { tag: '@smoke' }, async ({ locationsPage, yardPage }) => {
    await locationsPage.openSite(CANADA.name, EDMONTON.name);

    await expect(yardPage.page).toHaveURL(new RegExp(`${yardPath(EDMONTON.slug)}$`));
    await expect(yardPage.yardName).toHaveText(EDMONTON.name);
  });

  test('2.3 an unknown yard slug lands on the not-found page', { tag: '@negative' }, async ({ yardPage }) => {
    await yardPage.open(UNKNOWN_YARD_SLUG);

    // A soft 404: the server redirects (307) to /not-found, which answers HTTP 200, not 404
    await expect(yardPage.page).toHaveURL(/\/not-found/);
    await expect(yardPage.page).toHaveTitle(/404 page not found/i);
  });
});
