import { z } from 'zod';
import {
  clockTime,
  count,
  countryCode,
  isoDateTime,
  latitude,
  longitude,
} from '@api/schemas/common.schema';

/*
 * Contracts for yard (auction site) data in the /lp and /lp/{slug} page JSON.
 * Only fields the tests rely on are declared; unknown fields are stripped, so unrelated
 * CMS changes don't break tests. Nullability reflects the live data, where these values
 * are null for some yards.
 */

export const AddressSchema = z.object({
  addressLine1: z.string().min(1),
  city: z.string().min(1),
  // Only set for countries with states/provinces (USA, CAN)
  provinceState: z.string().nullable(),
  provinceStateCode: z.string().nullable(),
  zipPostalCode: z.string(),
  country: z.string().min(1),
  countryCode,
  latitude,
  longitude,
});

export const YardTypeSchema = z.enum(['Permanent', 'Satellite']);

export const YardSchema = z.object({
  name: z.string().min(1),
  type: YardTypeSchema,
  status: z.string().min(1),
  address: AddressSchema,
  contactPhone: z.string().min(1),
  pickupHoursFrom: clockTime.nullable(),
  pickupHoursTo: clockTime.nullable(),
  oracleSiteId: z.string().min(1).nullable(),
  marketplaceAdvertisedName: z.string().nullish(),
});

/** pageProps of /lp (API 1) */
export const LocationsPageSchema = z.object({
  yards: z.array(YardSchema).min(1),
});

export const AuctionEventSchema = z.object({
  sale_event_id: z.string().min(1),
  sale_number: z.string().min(1),
  event_advertised_name: z.string().min(1),
  event_start_date_time: isoDateTime,
  event_end_date_time: isoDateTime,
  auction_total_item_count: count,
  auction_total_days: z.string().regex(/^\d+$/),
  event_locality: z.string(),
  // Missing for countries without regions (e.g. Mexico)
  event_region: z.string().optional(),
  event_country: z.string(),
  event_time_zone: z.string().min(1),
  type: z.string(),
});

export const AssetTypeCountSchema = z.object({
  assetType: z.string().min(1),
  assetTypeLocalized: z.string().min(1),
  assetTypeSeoValue: z.string().min(1),
  totalAssets: count,
});

export const CategoryCountSchema = z.object({
  category: z.string().min(1),
  categoryLocalized: z.string().min(1),
  categorySeoValue: z.string().min(1),
  // Always present in current data; the requirement (A2.4) only asks for a valid number when present
  totalAssets: count.optional(),
  assetTypes: z.array(AssetTypeCountSchema),
});

/** Inventory in the yard, grouped per sale event; the UI merges the groups into one category list */
export const YardInventoryGroupSchema = z.object({
  sale_event_id: z.string().nullable(),
  categories: z.array(CategoryCountSchema),
});

export const RepresentativeSchema = z.object({
  name: z.string().min(1),
  role: z.string(),
  auctionSiteId: z.string().min(1),
  region: z.array(z.string()),
  contacts: z.object({
    phone: z.string().nullable(),
    mobile: z.string().nullable(),
    fax: z.string().nullable(),
    email: z.string().nullable(),
  }),
});

/** pageProps of /lp/{slug} (API 2): details, events and inventory share one payload */
export const YardPageSchema = z.object({
  yardDetails: YardSchema,
  upcomingEvents: z.array(AuctionEventSchema),
  // null for yards with no inventory; normalised to []
  itemsInYard: z
    .array(YardInventoryGroupSchema)
    .nullable()
    .transform((groups) => groups ?? []),
  localRepresentative: z.array(RepresentativeSchema),
});

export type Address = z.output<typeof AddressSchema>;
export type YardType = z.output<typeof YardTypeSchema>;
export type Yard = z.output<typeof YardSchema>;
export type LocationsPage = z.output<typeof LocationsPageSchema>;
export type AuctionEvent = z.output<typeof AuctionEventSchema>;
export type CategoryCount = z.output<typeof CategoryCountSchema>;
export type YardInventoryGroup = z.output<typeof YardInventoryGroupSchema>;
export type Representative = z.output<typeof RepresentativeSchema>;
export type YardPage = z.output<typeof YardPageSchema>;
