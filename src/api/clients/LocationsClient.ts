import type { NextDataClient, PageDataSource } from '@api/clients/NextDataClient';
import {
  LocationsPageSchema,
  YardPageSchema,
  type CategoryCount,
  type Yard,
  type YardInventoryGroup,
  type YardPage,
} from '@api/schemas/yard.schema';

export const LOCATIONS_PATH = '/lp';
export const yardPath = (slug: string): string => `${LOCATIONS_PATH}/${slug}`;

/** Flattens itemsInYard (grouped per sale event) into one list; a category can occur in several groups. */
export const flattenCategories = (groups: YardInventoryGroup[]): CategoryCount[] =>
  groups.flatMap((group) => group.categories);

/**
 * Locations (auction sites / yards). There is no REST endpoint for this data: it is read from the
 * Next.js page JSON of /lp (API 1) and /lp/{slug} (API 2).
 */
export class LocationsClient {
  constructor(private readonly nextData: NextDataClient) {}

  /** All yards listed on the locations directory (API 1). */
  async getYards(source?: PageDataSource): Promise<Yard[]> {
    const { yards } = await this.nextData.getPageProps(LOCATIONS_PATH, LocationsPageSchema, source);
    return yards;
  }

  /** Yard details, upcoming events, items in yard and representatives, from one payload (API 2). */
  getYardPage(slug: string, source?: PageDataSource): Promise<YardPage> {
    return this.nextData.getPageProps(yardPath(slug), YardPageSchema, source);
  }
}
