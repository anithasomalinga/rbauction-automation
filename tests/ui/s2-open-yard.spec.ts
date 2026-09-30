import { test, expect } from '@fixtures';
import { yardPath } from '@api/clients/LocationsClient';
import { CANADA, EDMONTON } from '@data/yards';

/** Scenario 2: open a yard from the directory, happy path. Starts on /lp. */
test.describe('Scenario 2: open a yard from the directory', { tag: '@S2' }, () => {
  test.beforeEach(async ({ locationsPage }) => {
    await locationsPage.open();
  });

  test('2.1 Edmonton is listed under Canada and is not a satellite', async ({ locationsPage }) => {
    const edmonton = (await locationsPage.getSites(CANADA.name)).find(
      (site) => site.name === EDMONTON.name,
    );

    expect(edmonton, 'Edmonton under Canada').toBeDefined();
    expect(edmonton?.satellite, 'Edmonton is a satellite').toBe(false);
  });

  test('2.2 clicking Edmonton opens the Edmonton yard page', { tag: '@smoke' }, async ({
    locationsPage,
    yardPage,
  }) => {
    await locationsPage.openSite(CANADA.name, EDMONTON.name);

    await expect(yardPage.page).toHaveURL(new RegExp(`${yardPath(EDMONTON.slug)}$`));
    await expect(yardPage.yardName).toHaveText(EDMONTON.name);
  });
});
