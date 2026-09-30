import { EDMONTON } from '@data/yards';

/** Expected content of the Edmonton yard page (/lp/edmonton-ab), Scenario 3. */
export const EDMONTON_YARD_PAGE_UI = {
  addressParts: [EDMONTON.addressLine1, EDMONTON.city, EDMONTON.provinceStateCode, EDMONTON.zipPostalCode],
  officeDays: 'Mon - Fri',
  /** e.g. "08:00 AM - 05:00 PM" */
  timeRange: /\d{1,2}:\d{2}\s?[AP]M\s?-\s?\d{1,2}:\d{2}\s?[AP]M/,
  /** e.g. "Sep 22 - Sep 25", or a single day "Sep 22" */
  eventDateRange: /^[A-Z][a-z]{2} \d{1,2}( - ([A-Z][a-z]{2} )?\d{1,2})?$/,
  aboutYard: /open weekdays for equipment drop-off, inspection and pick-up/i,
  /** e.g. "78 items" or "1 items" (as the site renders it) */
  quantity: /^\d+ items?$/,
  minCategories: 5,
  requiredCategory: 'Excavators',
  /** At least one of these must be in the carousel as well */
  anyOfCategories: ['Harvesting Equipment', 'Agricultural Tractors', 'Sprayers', 'Excavator Attachments'],
  phoneNumber: /\d{3}\D?\d{3}\D?\d{4}/,
} as const;
