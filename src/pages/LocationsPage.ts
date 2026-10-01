import type { Locator, Page } from '@playwright/test';
import { LOCATIONS_PATH } from '@api/clients/LocationsClient';
import { LocationsPageSchema, type Yard } from '@api/schemas/yard.schema';
import { BasePage } from '@pages/BasePage';
import { extractNextData } from '@utils/nextData';
import { validate } from '@utils/validate';

/** A site link in the directory; satellite sites are marked with a trailing asterisk. */
export interface DirectorySite {
  name: string;
  satellite: boolean;
  href: string;
}

export interface CountryGroup {
  country: string;
  sites: DirectorySite[];
}

const SATELLITE_MARKER = '*';

export function parseSiteLabel(label: string): Pick<DirectorySite, 'name' | 'satellite'> {
  const text = label.trim();
  const satellite = text.endsWith(SATELLITE_MARKER);
  return { name: satellite ? text.slice(0, -SATELLITE_MARKER.length).trim() : text, satellite };
}

/** Locations directory (/lp): intro, map, and site lists grouped by country. */
export class LocationsPage extends BasePage {
  readonly heading: Locator;
  readonly introText: Locator;
  readonly satelliteNote: Locator;
  /** Country names are h4 headings, each followed by a list labelled with the same country */
  readonly countryHeadings: Locator;
  readonly auctionSitesTab: Locator;
  readonly localRepresentativesTab: Locator;
  readonly representativesSearchPrompt: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { level: 1 });
    this.introText = page.getByText('Ritchie Bros. currently offers');
    this.satelliteNote = page.getByText('Satellite sites are represented by an asterisk');
    this.countryHeadings = page.getByRole('heading', { level: 4 });
    this.auctionSitesTab = page.getByRole('tab', { name: 'Auction sites' });
    this.localRepresentativesTab = page.getByRole('tab', { name: 'Local representatives' });
    this.representativesSearchPrompt = page.getByText('Search for representatives');
  }

  async open(): Promise<void> {
    await this.goto(LOCATIONS_PATH);
  }

  siteLinks(country: string): Locator {
    return this.page.getByRole('list', { name: country, exact: true }).getByRole('link');
  }

  /** Link to one site in a country's list; matches the name with or without the satellite marker. */
  siteLink(country: string, name: string): Locator {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return this.siteLinks(country).filter({ hasText: new RegExp(`^\\s*${escaped}\\s*\\*?\\s*$`) });
  }

  async openSite(country: string, name: string): Promise<void> {
    await this.siteLink(country, name).click();
  }

  /** Country headings in page order, after scrolling the lists (below the map) into view. */
  async getCountryNames(): Promise<string[]> {
    await this.countryHeadings.first().scrollIntoViewIfNeeded();
    return (await this.countryHeadings.allInnerTexts()).map((name) => name.trim());
  }

  async getSites(country: string): Promise<DirectorySite[]> {
    const links = this.siteLinks(country);
    await links.first().waitFor();
    const entries = await links.evaluateAll((anchors) =>
      anchors.map((a) => ({ label: a.textContent ?? '', href: a.getAttribute('href') ?? '' })),
    );
    return entries.map(({ label, href }) => ({ ...parseSiteLabel(label), href }));
  }

  /** The full directory: every country heading with the sites listed under it. */
  async getDirectory(): Promise<CountryGroup[]> {
    const countries = await this.getCountryNames();
    return Promise.all(
      countries.map(async (country) => ({ country, sites: await this.getSites(country) })),
    );
  }

  /** Yards from the data embedded in this page (__NEXT_DATA__), i.e. the data the list was rendered from. */
  async getYardData(): Promise<Yard[]> {
    const url = this.page.url();
    const { props } = extractNextData(await this.page.content(), url);
    return validate(LocationsPageSchema, props.pageProps, `pageProps of ${url}`).yards;
  }

  async showLocalRepresentatives(): Promise<void> {
    await this.localRepresentativesTab.click();
  }
}
