import { test, expect } from '@fixtures';
import { DIRECTORY_COPY, DIRECTORY_EXPECTATIONS } from '@data/locationsDirectory';
import { LOCATION_THRESHOLDS } from '@data/yards';
import { recordCount } from '@utils/report';

/** Scenario 1: locations directory*/
test.describe('Scenario 1: Locations directory', { tag: '@S1' }, () => {
  test.beforeEach(async ({ locationsPage }) => {
    await locationsPage.open();
  });

  test('1.1 open the page', { tag: '@smoke' }, async ({ locationsPage }) => {
    await expect(locationsPage.page).toHaveTitle(DIRECTORY_COPY.title);
    await expect(locationsPage.heading).toHaveText(DIRECTORY_COPY.heading);
    await expect(locationsPage.introText).toBeVisible();
    await expect(locationsPage.introText).toContainText(DIRECTORY_COPY.intro);
  });

  test('1.2 read the satellite-site note', async ({ locationsPage }) => {
    await expect(locationsPage.satelliteNote).toBeVisible();
    await expect(locationsPage.satelliteNote).toContainText(DIRECTORY_COPY.satelliteNote);
  });

  test('1.3 list country groups', async ({ locationsPage }) => {
    const countries = await locationsPage.getCountryNames();
    recordCount('country headings', countries.length);

    expect(countries.slice(0, 2)).toEqual(DIRECTORY_EXPECTATIONS.firstCountries);
    expect(countries).toEqual(expect.arrayContaining([...DIRECTORY_EXPECTATIONS.requiredCountries]));
  });

  /** test 1.4 & 1.5 */
  for (const group of [DIRECTORY_EXPECTATIONS.unitedStates, DIRECTORY_EXPECTATIONS.canada]) {
    const id = group === DIRECTORY_EXPECTATIONS.unitedStates ? '1.4' : '1.5';

    test(`${id} list sites under ${group.country}`, async ({ locationsPage }) => {
      const names = (await locationsPage.getSites(group.country)).map((site) => site.name);
      recordCount(`${group.country} sites`, names.length);

      expect(names.length, `${group.country} sites`).toBeGreaterThan(group.minSites);
      expect(names).toEqual(expect.arrayContaining([...group.requiredSites]));
    });
  }

  test('1.6 identify satellite vs permanent sites', async ({ locationsPage }) => {
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

  test('1.7 check known satellite vs permanent sites', async ({ locationsPage }) => {
    const sites = (await locationsPage.getDirectory()).flatMap((group) => group.sites);
    const isSatellite = (name: string) => sites.find((site) => site.name === name)?.satellite;

    for (const name of DIRECTORY_EXPECTATIONS.knownSatelliteSites) {
      expect.soft(isSatellite(name), `${name} is marked with *`).toBe(true);
    }
    for (const name of DIRECTORY_EXPECTATIONS.knownPermanentSites) {
      expect.soft(isSatellite(name), `${name} is not marked with *`).toBe(false);
    }
  });

  test('1.9 switch auction sites /  local representatives tab', async ({ locationsPage }) => {
    await expect(locationsPage.auctionSitesTab).toBeVisible();
    await expect(locationsPage.localRepresentativesTab).toBeVisible();
    await expect(locationsPage.auctionSitesTab).toHaveAttribute('aria-selected', 'true');
    await expect(locationsPage.representativesSearchPrompt).toBeHidden();

    await locationsPage.showLocalRepresentatives();

    await expect(locationsPage.localRepresentativesTab).toHaveAttribute('aria-selected', 'true');
    await expect(locationsPage.representativesSearchPrompt).toBeVisible();
  });

  test('1.10 every site\'s * marker matches its type in the page data', { tag: '@negative' }, async ({ locationsPage }) => {
    const sites = (await locationsPage.getDirectory()).flatMap((group) => group.sites);
    const yards = await locationsPage.getYardData();
    const typeByName = new Map(yards.map((yard) => [yard.name, yard.type]));

    // Compared as whole lists, so a failure diff names exactly the sites that disagree
    const shown = sites.map(({ name, satellite }) => ({ name, type: satellite ? 'Satellite' : 'Permanent' }));
    const inData = sites.map(({ name }) => ({ name, type: typeByName.get(name) ?? 'not in page data' }));
    expect(shown, '* marker vs page data type').toEqual(inData);
    expect(sites, 'every yard in the page data is listed').toHaveLength(yards.length);
  });
});
