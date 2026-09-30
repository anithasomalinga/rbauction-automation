import type { Page } from '@playwright/test';
import { assertNotWafBlocked } from '@utils/wafGuard';

/** Base for all page objects: navigation guarded against the Akamai block page. */
export abstract class BasePage {
  constructor(readonly page: Page) {}

  protected async goto(path: string): Promise<void> {
    // Pages are server-rendered; waiting for 'load' would also wait for maps, analytics and ad
    // scripts. Web-first assertions wait for the elements each test needs.
    const response = await this.page.goto(path, { waitUntil: 'domcontentloaded' });
    if (response) await assertNotWafBlocked(response);
  }
}
