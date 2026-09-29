import type { YardType } from '@api/schemas/yard.schema';

/**
 * Stable reference data for known yards. Everything else is read from the live payload at
 * runtime, so tests don't break when yards, events or inventory change.
 */
export interface ReferenceYard {
  name: string;
  slug: string;
  type: YardType;
  addressLine1: string;
  city: string;
  provinceStateCode: string;
  zipPostalCode: string;
  country: string;
  countryCode: string;
}

export const EDMONTON: ReferenceYard = {
  name: 'Edmonton',
  slug: 'edmonton-ab',
  type: 'Permanent',
  addressLine1: '1500 Sparrow Drive',
  // The Edmonton yard is physically in Nisku, AB
  city: 'Nisku',
  provinceStateCode: 'AB',
  zipPostalCode: 'T9E 8H6',
  country: 'Canada',
  countryCode: 'CAN',
};

export const PHOENIX: ReferenceYard = {
  name: 'Phoenix',
  slug: 'phoenix-az',
  type: 'Permanent',
  addressLine1: '5410 W Lower Buckeye Rd',
  city: 'Phoenix',
  provinceStateCode: 'AZ',
  zipPostalCode: '85043-7909',
  country: 'United States',
  countryCode: 'USA',
};

/** Expectations for the Edmonton yard page (A2.3, A2.4). */
export const EDMONTON_YARD_PAGE = {
  /** At least one upcoming event must refer to the yard by one of these names */
  eventPlaceNames: ['Edmonton', 'Nisku'],
  /** Distinct equipment categories in the yard: greater than */
  minCategories: 5,
  expectedCategory: 'Excavators',
} as const;

export const CANADA = { name: 'Canada', code: 'CAN' } as const;
export const UNITED_STATES = { name: 'United States', code: 'USA' } as const;

/** Minimum counts from the requirements (A1.2, A1.5, A1.6); all are "greater than". */
export const LOCATION_THRESHOLDS = {
  locations: 60,
  satelliteLocations: 15,
  permanentLocations: 25,
  countries: 8,
} as const;
