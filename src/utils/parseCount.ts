const SUFFIX_MULTIPLIERS: Record<string, number> = { k: 1_000, m: 1_000_000 };

/**
 * Parses a displayed count such as "2136", "2,136", "2.1k" or "1.2M" into a number.
 * Abbreviated values are approximate by nature ("2.1k" → 2100).
 */
export function parseDisplayedCount(text: string): number {
  const match = /(\d[\d,]*(?:\.\d+)?)\s*([km])?/i.exec(text);
  if (!match?.[1]) throw new Error(`No count found in "${text}"`);
  const value = Number(match[1].replace(/,/g, ''));
  const multiplier = match[2] ? (SUFFIX_MULTIPLIERS[match[2].toLowerCase()] ?? 1) : 1;
  return Math.round(value * multiplier);
}
