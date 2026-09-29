import { test, expect } from '@fixtures';
import { flattenCategories } from '@api/clients/LocationsClient';
import { EDMONTON, EDMONTON_YARD_PAGE } from '@data/yards';
import { recordCount } from '@utils/report';

/**
 * API 2: Edmonton yard page JSON (/lp/edmonton-ab). Yard details, upcoming events and items in
 * yard come from one payload, schema-validated by the client.
 */
test.describe('API 2: Edmonton yard page JSON (/lp/edmonton-ab)', { tag: '@API2' }, () => {
  test('A2.1 payload is JSON', { tag: '@smoke' }, async ({ locations }) => {
    const page = await locations.getYardPage(EDMONTON.slug);

    expect(page.yardDetails).toBeDefined();
    expect(Array.isArray(page.upcomingEvents)).toBe(true);
    expect(Array.isArray(page.itemsInYard)).toBe(true);
  });

  test('A2.1 embedded page JSON matches the Next.js data route', async ({ locations }) => {
    const [embedded, dataRoute] = await Promise.all([
      locations.getYardPage(EDMONTON.slug, 'html'),
      locations.getYardPage(EDMONTON.slug, 'dataRoute'),
    ]);

    expect(dataRoute.yardDetails).toEqual(embedded.yardDetails);
  });

  test('A2.2 yard is Edmonton with the expected address, a phone number and hours', {
    tag: '@smoke',
  }, async ({ locations }) => {
    const { yardDetails } = await locations.getYardPage(EDMONTON.slug);

    expect(yardDetails.name).toBe(EDMONTON.name);
    expect(yardDetails.address).toMatchObject({
      addressLine1: EDMONTON.addressLine1,
      city: EDMONTON.city,
      zipPostalCode: EDMONTON.zipPostalCode,
    });
    expect(yardDetails.contactPhone, 'phone number').toMatch(/\d{7,}/);
    expect(yardDetails.pickupHoursFrom, 'hours from').not.toBeNull();
    expect(yardDetails.pickupHoursTo, 'hours to').not.toBeNull();
  });

  test('A2.3 upcoming events are counted and each has a name and a date range', async ({
    locations,
  }) => {
    const { upcomingEvents } = await locations.getYardPage(EDMONTON.slug);
    recordCount('upcoming events', upcomingEvents.length);

    for (const event of upcomingEvents) {
      const label = `event ${event.sale_number}`;
      expect.soft(event.event_advertised_name.trim(), `${label} name`).not.toBe('');
      expect
        .soft(Date.parse(event.event_end_date_time), `${label} ends after it starts`)
        .toBeGreaterThanOrEqual(Date.parse(event.event_start_date_time));
    }
  });

  test('A2.3 at least one upcoming event refers to Edmonton or Nisku', async ({ locations }) => {
    const { upcomingEvents } = await locations.getYardPage(EDMONTON.slug);
    test.skip(upcomingEvents.length === 0, 'Edmonton has no upcoming events right now');

    const place = new RegExp(EDMONTON_YARD_PAGE.eventPlaceNames.join('|'), 'i');
    const matching = upcomingEvents.filter(
      (event) => place.test(event.event_advertised_name) || place.test(event.event_locality),
    );
    expect(matching.length, 'events referring to Edmonton or Nisku').toBeGreaterThanOrEqual(1);
  });

  test('A2.4 items in yard: more than 5 named categories with valid quantities, including Excavators', async ({
    locations,
  }) => {
    const { itemsInYard } = await locations.getYardPage(EDMONTON.slug);
    const categories = flattenCategories(itemsInYard);
    // The same category appears once per sale event, so count distinct names
    const distinctNames = new Set(categories.map((category) => category.categoryLocalized));
    recordCount('category entries (flattened)', categories.length);
    recordCount('distinct categories', distinctNames.size);

    expect(distinctNames.size, 'distinct categories').toBeGreaterThan(EDMONTON_YARD_PAGE.minCategories);

    const unnamed = categories.filter((category) => !category.categoryLocalized.trim());
    expect(unnamed, 'categories without a name').toEqual([]);

    const invalidQuantity = categories.filter(
      ({ totalAssets }) => totalAssets !== undefined && !(Number.isInteger(totalAssets) && totalAssets >= 0),
    );
    expect(invalidQuantity, 'categories with an invalid totalAssets').toEqual([]);

    expect([...distinctNames]).toContain(EDMONTON_YARD_PAGE.expectedCategory);
  });
});
