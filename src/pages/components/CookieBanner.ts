import type { BrowserContext, Page } from '@playwright/test';

/** What clicking "I understand" stores: the cookies TrustArc reads to decide whether to show the banner */
const CONSENT_COOKIES = [
  { name: 'notice_preferences', value: '2:' },
  { name: 'notice_gdpr_prefs', value: '0,1,2:' },
  { name: 'cmapi_cookie_privacy', value: 'permit 1,2,3' },
];

/**
 * Starts the browser with cookie consent already given, as for a returning visitor, so the TrustArc
 * banner does not appear. Clicking it away mid-test is slow on small machines and held up
 * assertions past their timeout.
 */
export async function acceptCookieConsent(context: BrowserContext, baseURL: string): Promise<void> {
  // The site sets these on the parent domain, e.g. ".rbauction.com" for www.rbauction.com
  const domain = `.${new URL(baseURL).hostname.replace(/^www\./, '')}`;
  await context.addCookies(CONSENT_COOKIES.map((cookie) => ({ ...cookie, domain, path: '/' })));
}

/**
 * Fallback for when the banner appears anyway (e.g. the consent cookies change): it shows up
 * asynchronously and can cover controls, so Playwright clicks it away whenever it blocks an action.
 */
export async function autoDismissCookieBanner(page: Page): Promise<void> {
  const acceptButton = page.getByRole('button', { name: 'I understand' });
  await page.addLocatorHandler(acceptButton, () => acceptButton.click());
}
