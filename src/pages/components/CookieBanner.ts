import type { Page } from '@playwright/test';

/**
 * TrustArc cookie consent banner. It appears asynchronously and can cover controls, so instead of
 * dismissing it at a fixed point, Playwright clicks it away whenever it blocks an action.
 */
export async function autoDismissCookieBanner(page: Page): Promise<void> {
  const acceptButton = page.getByRole('button', { name: 'I understand' });
  await page.addLocatorHandler(acceptButton, () => acceptButton.click());
}
