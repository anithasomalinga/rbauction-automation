import { test, expect } from '@fixtures';
import { DIRECTORY_COPY, DIRECTORY_EXPECTATIONS } from '@data/locationsDirectory';
import { LOCATION_THRESHOLDS } from '@data/yards';
import { recordCount } from '@utils/report';

/** Scenario 1: locations directory (/lp), happy path. */
test.describe('Scenario 1: locations directory (/lp)', { tag: '@S1' }, () => {
  test.beforeEach(async ({ locationsPage }) => {
    await locationsPage.open();
  });

  test('1.1 page is the locations directory with the intro text', { tag: '@smoke' }, async ({
    locationsPage,
  }) => {
    await expect(locationsPage.page).toHaveTitle(DIRECTORY_COPY.title);
    await expect(locationsPage.heading).toHaveText(DIRECTORY_COPY.heading);
    await expect(locationsPage.introText).toBeVisible();
    await expect(locationsPage.introText).toContainText(DIRECTORY_COPY.intro);
  });

  test('1.2 satellite-site note explains the asterisk', async ({ locationsPage }) => {
    await expect(locationsPage.satelliteNote).toBeVisible();
    await expect(locationsPage.satelliteNote).toContainText(DIRECTORY_COPY.satelliteNote);
  });

  test('1.3 country groups are listed, starting with United States and Canada', async ({
    locationsPage,
  }) => {
    const countries = await locationsPage.getCountryNames();
    recordCount('country headings', countries.length);

    expect(countries.slice(0, 2)).toEqual(DIRECTORY_EXPECTATIONS.firstCountries);
    expect(countries).toEqual(expect.arrayContaining([...DIRECTORY_EXPECTATIONS.requiredCountries]));
  });

  for (const group of [DIRECTORY_EXPECTATIONS.unitedStates, DIRECTORY_EXPECTATIONS.canada]) {
    const id = group === DIRECTORY_EXPECTATIONS.unitedStates ? '1.4' : '1.5';

    test(`${id} sites under ${group.country}: more than ${group.minSites}, including known sites`, async ({
      locationsPage,
    }) => {
      const names = (await locationsPage.getSites(group.country)).map((site) => site.name);
      recordCount(`${group.country} sites`, names.length);

      expect(names.length, `${group.country} sites`).toBeGreaterThan(group.minSites);
      expect(names).toEqual(expect.arrayContaining([...group.requiredSites]));
    });
  }

  test('1.6 satellite (*) and permanent site counts across the directory', async ({
    locationsPage,
  }) => {
    const sites = (await locationsPage.getDirectory()).flatMap((group) => group.sites);
    const satellite = sites.filter((site) => site.satellite).length;
    const permanent = sites.length - satellite;
    recordCount('satellite sites (*)', satellite);
    recordCount('permanent sites', permanent);
    recordCount('total sites', sites.length);

    expect(satellite, 'satellite sites').toBeGreaterThan(LOCATION_THRESHOLDS.satelliteLocations);
    expect(permanent, 'permanent sites').toBeGreaterThan(LOCATION_THRESHOLDS.permanentLocations);
    expect(sites.length, 'total sites').toBeGreaterThan(LOCATION_THRESHOLDS.locations);
  });

  test('1.7 known satellite sites have an asterisk, known permanent sites do not', async ({
    locationsPage,
  }) => {
    const sites = (await locationsPage.getDirectory()).flatMap((group) => group.sites);
    const isSatellite = (name: string) => sites.find((site) => site.name === name)?.satellite;

    for (const name of DIRECTORY_EXPECTATIONS.knownSatelliteSites) {
      expect.soft(isSatellite(name), `${name} is marked with *`).toBe(true);
    }
    for (const name of DIRECTORY_EXPECTATIONS.knownPermanentSites) {
      expect.soft(isSatellite(name), `${name} is not marked with *`).toBe(false);
    }
  });

  test('1.9 switching to Local representatives changes the content', async ({ locationsPage }) => {
    await expect(locationsPage.auctionSitesTab).toBeVisible();
    await expect(locationsPage.localRepresentativesTab).toBeVisible();
    await expect(locationsPage.auctionSitesTab).toHaveAttribute('aria-selected', 'true');
    await expect(locationsPage.representativesSearchPrompt).toBeHidden();

    await locationsPage.showLocalRepresentatives();

    await expect(locationsPage.localRepresentativesTab).toHaveAttribute('aria-selected', 'true');
    await expect(locationsPage.representativesSearchPrompt).toBeVisible();
  });
});
