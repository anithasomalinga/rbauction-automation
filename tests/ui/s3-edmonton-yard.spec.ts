import { test, expect } from '@fixtures';
import { EDMONTON_YARD_PAGE_UI as EXPECTED } from '@data/yardPage';
import { EDMONTON } from '@data/yards';
import { recordCount } from '@utils/report';

/** Scenario 3: Edmonton yard page (/lp/edmonton-ab), happy path. */
test.describe('Scenario 3: Edmonton yard page (/lp/edmonton-ab)', { tag: '@S3' }, () => {
  test.beforeEach(async ({ yardPage }) => {
    await yardPage.open(EDMONTON.slug);
  });

  test('3.1 details show the address, office hours and a phone number', { tag: '@smoke' }, async ({
    yardPage,
  }) => {
    for (const part of EXPECTED.addressParts) {
      await expect.soft(yardPage.address, `address includes "${part}"`).toContainText(part);
    }
    await expect(yardPage.officeHours).toContainText(EXPECTED.officeDays);
    await expect(yardPage.officeHours).toContainText(EXPECTED.timeRange);
    await expect(yardPage.phone).toBeVisible();
    await expect(yardPage.phone).toContainText(EXPECTED.phoneNumber);
  });

  test('3.2 auction events are listed below Details, each with a date range and a title', async ({
    yardPage,
  }) => {
    await expect(yardPage.auctionEventsHeading).toBeVisible();
    // "Below Details" in reading order: on desktop the two sections are side by side
    const sections = await yardPage.getSectionTitles();
    expect(sections.indexOf('Auction events'), 'Auction events comes after Details').toBeGreaterThan(
      sections.indexOf('Details'),
    );

    const cards = await yardPage.getEventCards();
    recordCount('event cards', cards.length);
    expect(cards.length, 'event cards').toBeGreaterThanOrEqual(1);
    for (const [index, card] of cards.entries()) {
      expect.soft(card.dateRange, `card ${index + 1} date range`).toMatch(EXPECTED.eventDateRange);
      expect.soft(card.title, `card ${index + 1} title`).not.toBe('');
    }
  });

  test('3.3 About this yard mentions weekday drop-off, inspection and pick-up', async ({
    yardPage,
  }) => {
    await expect(yardPage.aboutHeading).toBeVisible();
    await expect(yardPage.aboutSection).toContainText(EXPECTED.aboutYard);
  });

  test('3.4 Items in yard carousel: more than 5 named categories with quantities', async ({
    yardPage,
  }) => {
    const cards = await yardPage.getCategoryCards();
    recordCount('category cards (all slides)', cards.length);

    expect(cards.length, 'category cards').toBeGreaterThan(EXPECTED.minCategories);
    const invalid = cards.filter((card) => !card.name || !EXPECTED.quantity.test(card.quantity));
    expect(invalid, 'cards without a name or "N items" quantity').toEqual([]);

    const names = cards.map((card) => card.name);
    expect(names).toContain(EXPECTED.requiredCategory);
    expect(
      EXPECTED.anyOfCategories.filter((name) => names.includes(name)),
      `at least one of ${EXPECTED.anyOfCategories.join(', ')}`,
    ).not.toEqual([]);
  });

  test('3.5 Become a seller form is visible with a phone number (not submitted)', async ({
    yardPage,
  }) => {
    await expect(yardPage.sellerForm).toBeVisible();
    await expect(yardPage.sellerPhone).toBeVisible();
    await expect(yardPage.sellerPhone).toContainText(EXPECTED.phoneNumber);
  });

  test('3.6 Representatives tab shows cards with a region and contact details', async ({
    yardPage,
  }) => {
    await yardPage.showRepresentatives();

    const cards = await yardPage.getRepresentativeCards();
    recordCount('representative cards', cards.length);
    expect(cards.length, 'representative cards').toBeGreaterThanOrEqual(1);
    const incomplete = cards.filter((card) => !card.region || card.contacts.length === 0);
    expect(incomplete, 'cards without a region or any phone/mobile/email').toEqual([]);
  });
});
