import { test, expect } from '@fixtures';
import { CANADA, EDMONTON, LOCATION_THRESHOLDS, PHOENIX, UNITED_STATES } from '@data/yards';
import { duplicates } from '@utils/duplicates';
import { recordCount } from '@utils/report';

const UNKNOWN_BUILD_ID = 'not-a-real-build';

/**
 * API 1: auction sites list, read from the /lp page JSON (props.pageProps.yards).
 * The payload is schema-validated by the client, so each test asserts one requirement.
 */
test.describe('API 1: auction sites list (/lp page JSON)', { tag: '@API1' }, () => {
  test('A1.1 payload is JSON and includes a list of yards', { tag: '@smoke' }, async ({ locations }) => {
    const response = await locations.getYardsRaw();

    expect(response.status).toBe(200);
    expect(response.header('content-type')).toContain('application/json');
    await expect(response.json()).resolves.toBeDefined();

    const [embedded, dataRoute] = await Promise.all([
      locations.getYards('html'),
      locations.getYards('dataRoute'),
    ]);

    expect(Array.isArray(embedded)).toBe(true);
    expect(embedded.length).toBeGreaterThan(0);
    // The JSON embedded in the page and the Next.js data route carry the same yards
    expect(dataRoute).toEqual(embedded);
  });

  test('A1.2 count of locations is greater than 60', { tag: '@smoke' }, async ({ locations }) => {
    const yards = await locations.getYards();
    recordCount('locations', yards.length);

    expect(yards.length, 'number of locations').toBeGreaterThan(LOCATION_THRESHOLDS.locations);
  });

  test('A1.3 each location has a name and a country', async ({ locations }) => {
    const yards = await locations.getYards();

    const incomplete = yards.filter(
      (yard) => !yard.name.trim() || !(yard.address.country.trim() || yard.address.countryCode.trim()),
    );
    expect(incomplete, 'locations missing a name or country').toEqual([]);
  });

  test('A1.4 list includes Edmonton (Canada) and Phoenix (United States)', { tag: '@smoke' }, async ({ locations }) => {
    const yards = await locations.getYards();

    for (const ref of [EDMONTON, PHOENIX]) {
      const yard = yards.find((candidate) => candidate.name === ref.name);
      expect.soft(yard, `${ref.name} is in the locations list`).toBeDefined();
      expect
        .soft(yard?.address, `${ref.name} country`)
        .toMatchObject({ country: ref.country, countryCode: ref.countryCode });
    }
  });

  test('A1.5 each location has a site type; satellite > 15 and permanent > 25', async ({ locations }) => {
    const yards = await locations.getYards();

    const untyped = yards.filter((yard) => yard.type !== 'Satellite' && yard.type !== 'Permanent');
    expect(untyped, 'locations without a Satellite/Permanent type').toEqual([]);

    const satellite = yards.filter((yard) => yard.type === 'Satellite').length;
    const permanent = yards.filter((yard) => yard.type === 'Permanent').length;
    recordCount('satellite locations', satellite);
    recordCount('permanent locations', permanent);
    expect(satellite, 'satellite locations').toBeGreaterThan(LOCATION_THRESHOLDS.satelliteLocations);
    expect(permanent, 'permanent locations').toBeGreaterThan(LOCATION_THRESHOLDS.permanentLocations);
  });

  test('A1.6 more than 8 distinct countries, including United States and Canada', async ({ locations }) => {
    const yards = await locations.getYards();

    const countries = new Map(yards.map((yard) => [yard.address.countryCode, yard.address.country]));
    recordCount('distinct countries', countries.size);
    expect(countries.size, 'distinct countries').toBeGreaterThan(LOCATION_THRESHOLDS.countries);
    expect(countries.get(UNITED_STATES.code)).toBe(UNITED_STATES.name);
    expect(countries.get(CANADA.code)).toBe(CANADA.name);
  });

  test('A1.7 no location is listed twice', { tag: '@negative' }, async ({ locations }) => {
    const yards = await locations.getYards();

    expect(duplicates(yards.map((yard) => yard.name)), 'yard names listed twice').toEqual([]);

    // Yards without a site id are left out: several have none, and Midland's is the string "null"
    const siteIds = yards
      .map((yard) => yard.oracleSiteId)
      .filter((id) => id !== null && id !== 'null');
    expect(duplicates(siteIds), 'oracleSiteId used by more than one yard').toEqual([]);
  });

  test('A1.8 data route with an unknown buildId returns 404 and no yards', { tag: '@negative' }, async ({ locations }) => {
    const response = await locations.getYardsRaw(UNKNOWN_BUILD_ID);

    expect(response.status).toBe(404);
    expect(response.header('content-type')).not.toContain('application/json');
    expect(await response.text()).not.toContain('"yards"');
  });
});
