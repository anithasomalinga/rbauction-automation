import { test, expect } from '@fixtures';
import { yardPath } from '@api/clients/LocationsClient';
import { SPARSE_YARDS } from '@data/yardPage';
import type { YardDetailPage } from '@pages/YardDetailPage';

/** Opens the candidates in turn and stops at the first whose embedded data still has a count of 0. */
async function openFirstWithNone(
  yardPage: YardDetailPage,
  slugs: readonly string[],
  count: (page: YardDetailPage) => Promise<number>,
): Promise<string | undefined> {
  for (const slug of slugs) {
    await yardPage.open(slug);
    if ((await count(yardPage)) === 0) {
      // Shown under the test in the HTML report
      test.info().annotations.push({ type: 'yard', description: slug });
      return slug;
    }
  }
  return undefined;
}

/** Scenario 5: yard page with missing data (not in the brief) */
test.describe('Scenario 5: yard page with missing data', { tag: ['@S5', '@negative'] }, () => {
  test('5.1 a yard with no inventory has no Items in yard section', async ({ yardPage }) => {
    const slug = await openFirstWithNone(yardPage, SPARSE_YARDS.noInventory, (page) =>
      page.getInventoryGroupCount(),
    );
    test.skip(!slug, `all of ${SPARSE_YARDS.noInventory.join(', ')} have inventory right now`);

    await expect(yardPage.page).toHaveURL(new RegExp(`${yardPath(slug!)}$`));
    await expect(yardPage.yardName).toBeVisible();
    await expect(yardPage.address).toBeVisible();
    // The sections that follow Items in yard are rendered, so its absence is not a loading state
    await expect(yardPage.additionalInfoHeading).toBeVisible();
    await expect(yardPage.sellerForm).toBeVisible();

    await expect(yardPage.itemsInYardHeading).toHaveCount(0);
    await expect(yardPage.categoryCards).toHaveCount(0);
  });

  test('5.2 a yard with no upcoming events says so', async ({ yardPage }) => {
    const slug = await openFirstWithNone(yardPage, SPARSE_YARDS.noEvents, (page) =>
      page.getUpcomingEventCount(),
    );
    test.skip(!slug, `all of ${SPARSE_YARDS.noEvents.join(', ')} have upcoming events right now`);

    await expect(yardPage.page).toHaveURL(new RegExp(`${yardPath(slug!)}$`));
    await expect(yardPage.yardName).toBeVisible();
    await expect(yardPage.auctionEventsHeading).toBeVisible();
    await expect(yardPage.noEventsMessage).toBeVisible();
    await expect(yardPage.auctionCalendarLink).toBeVisible();
    await expect(yardPage.eventCards).toHaveCount(0);
  });
});
