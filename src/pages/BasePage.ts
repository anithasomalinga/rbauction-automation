import type { Page } from '@playwright/test';
import { assertNotWafBlocked } from '@utils/wafGuard';

/** Base for all page objects: navigation guarded against the Akamai block page. */
export abstract class BasePage {
  constructor(readonly page: Page) {}

  protected async goto(path: string): Promise<void> {
    // Pages are server-rendered; waiting for 'load' would also wait for external images.
    // Tests don't need a full page load: their expect() assertions and waitFor() calls retry
    // until the elements they use appear.
    const response = await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    if (response) await assertNotWafBlocked(response);
  }
}
