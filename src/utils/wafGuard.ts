/**
 * rbauction.com is fronted by Akamai, which answers blocked clients with HTTP 403 and an
 * "Access Denied" / "Access Forbidden!" page instead of the real content. Without this guard
 * such a block surfaces as a confusing locator timeout or schema error.
 */

/** Minimal response shape shared by Playwright's APIResponse (API tests) and Response (page.goto). */
export interface HttpResponseLike {
  url(): string;
  status(): number;
  text(): Promise<string>;
}

// Signatures observed on the two Akamai block pages (edge "Access Denied" and "Site Maintenance")
const BLOCK_SIGNATURES = [
  /<title>\s*Access Denied\s*<\/title>/i,
  /Access Forbidden!/i,
  /errors\.edgesuite\.net/i,
];
const REFERENCE_PATTERN = /Reference (?:#|ID:)\s*([\w.]+)/i;

export class WafBlockedError extends Error {
  constructor(
    readonly url: string,
    readonly status: number,
    readonly reference?: string,
  ) {
    super(
      [
        `Request blocked by the site's bot protection (Akamai): ${url} returned HTTP ${status}` +
          (reference ? `, reference ${reference}` : '') +
          '.',
        'This is an environment issue, not a product defect.',
        'Likely causes: headless browser (keep HEADLESS unset/false) or a CI/runner IP that is not allowlisted.',
      ].join('\n'),
    );
    this.name = 'WafBlockedError';
  }
}

export function isWafBlockPage(status: number, body: string): boolean {
  const text = decodeNumericEntities(body);
  return status === 403 && BLOCK_SIGNATURES.some((signature) => signature.test(text));
}

/** Throws WafBlockedError when the response is an Akamai block page; otherwise does nothing. */
export async function assertNotWafBlocked(response: HttpResponseLike): Promise<void> {
  // Only 403s can be block pages, so successful responses never pay for reading the body
  if (response.status() !== 403) return;

  const body = decodeNumericEntities(await response.text());
  if (isWafBlockPage(response.status(), body)) {
    throw new WafBlockedError(response.url(), response.status(), REFERENCE_PATTERN.exec(body)?.[1]);
  }
}

// The edge block page encodes punctuation, e.g. "Reference&#32;&#35;18&#46;ca37cb17"
function decodeNumericEntities(html: string): string {
  return html.replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)));
}
