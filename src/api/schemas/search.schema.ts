import { z } from 'zod';
import { count } from '@api/schemas/common.schema';

/*
 * Contract for POST /api/search (inventory search, API 3). Only fields the tests rely on are
 * declared; the ~100 other record fields are stripped.
 */

/** Request body. The site sends more (filters, sort); only what the tests need is modelled. */
export interface SearchRequest {
  freeText?: string;
  /** Zero-based offset of the first record; results come in pages of 60 */
  from?: number;
}

export const SearchRecordSchema = z.object({
  itemNumber: z.string().min(1),
  listingId: z.string().min(1),
  assetDescription: z.string().min(1),
  categoryLocalized: z.string(),
  assetTypeLocalized: z.string(),
  // Not present on every record (e.g. off-site listings, items without photos or year)
  itemSiteName: z.string().optional(),
  manufactureYear: z.number().int().optional(),
  imageUrl: z.string().optional(),
  locationCity: z.string(),
  locationState: z.string(),
  locationCountry: z.string(),
  eventAdvertisedName: z.string(),
  // Missing on listings outside an auction event (Buy Now, Make Offer, some online listings)
  saleNumber: z.number().int().optional(),
  listingStatus: z.string(),
  inYard: z.boolean(),
  /** Concatenated searchable text (locality aliases, region names); what freeText matches against */
  freeTextExtraConcatValue: z.string(),
});

export const SearchResponseSchema = z.object({
  results: z.object({
    totalAmount: count,
    returnedAmount: count,
    // Omitted entirely when there are no results; normalised to []
    records: z.array(SearchRecordSchema).default([]),
    /** Whether the search engine fell back to a broadened query; relevance checks depend on it */
    fallbackApplied: z.boolean(),
  }),
});

export type SearchRecord = z.output<typeof SearchRecordSchema>;
export type SearchResponse = z.output<typeof SearchResponseSchema>;
