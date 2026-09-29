import { z } from 'zod';

/** Decimal number sent as a string, within [min, max] (the site sends coordinates as strings). */
export const numericString = (min: number, max: number) =>
  z
    .string()
    .refine((value) => value.trim() !== '' && Number(value) >= min && Number(value) <= max, {
      message: `Expected a numeric string between ${min} and ${max}`,
    });

export const latitude = numericString(-90, 90);
export const longitude = numericString(-180, 180);

/** 24h clock time, e.g. "08:00" */
export const clockTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

/** ISO 8601 date-time in UTC, e.g. "2026-11-03T15:00:00Z" */
export const isoDateTime = z.iso.datetime();

export const count = z.number().int().nonnegative();
