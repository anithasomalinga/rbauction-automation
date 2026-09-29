import { z } from 'zod';
import { validate } from '@utils/validate';

/**
 * Next.js pages embed their server-side data as JSON in <script id="__NEXT_DATA__">.
 * Only the envelope is validated here; pageProps are validated by the caller's schema.
 */
const NextDataSchema = z.object({
  buildId: z.string().min(1),
  page: z.string(),
  query: z.record(z.string(), z.unknown()),
  props: z.object({ pageProps: z.unknown() }),
});

export type NextData = z.output<typeof NextDataSchema>;

const NEXT_DATA_SCRIPT = /<script[^>]*\bid="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/;

export function extractNextData(html: string, url: string): NextData {
  const json = NEXT_DATA_SCRIPT.exec(html)?.[1];
  if (!json) {
    throw new Error(`No __NEXT_DATA__ script found in ${url}; the page may not be a Next.js page`);
  }
  return validate(NextDataSchema, JSON.parse(json), `__NEXT_DATA__ of ${url}`);
}
