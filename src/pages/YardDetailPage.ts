import type { Locator, Page } from '@playwright/test';
import { yardPath } from '@api/clients/LocationsClient';
import { BasePage } from '@pages/BasePage';
import { extractNextData } from '@utils/nextData';

export interface EventCard {
  dateRange: string;
  title: string;
}

export interface CategoryCard {
  name: string;
  /** Quantity label as shown, e.g. "78 items" */
  quantity: string;
}

export interface RepresentativeCard {
  name: string;
  region: string;
  /** Phone, mobile and email links (tel:/mailto:) shown on the card */
  contacts: string[];
}

/** Yard (auction site) page: /lp/{slug}, with Details and Representatives tabs. */
export class YardDetailPage extends BasePage {
  /** The yard name is the page's first h3 (the footer has further h3 headings) */
  readonly yardName: Locator;
  readonly address: Locator;
  readonly officeHours: Locator;
  readonly phone: Locator;
  readonly auctionEventsHeading: Locator;
  readonly eventCards: Locator;
  /** Shown in place of event cards when the yard has no upcoming events */
  readonly noEventsMessage: Locator;
  readonly auctionCalendarLink: Locator;
  readonly aboutHeading: Locator;
  readonly aboutSection: Locator;
  /** Category cards of the "Items in yard" carousel, including off-screen slides */
  readonly categoryCards: Locator;
  /** Absent when the yard has no inventory */
  readonly itemsInYardHeading: Locator;
  readonly additionalInfoHeading: Locator;
  readonly sellerForm: Locator;
  readonly sellerPhone: Locator;
  readonly representativesTab: Locator;
  readonly representativeNames: Locator;

  constructor(page: Page) {
    super(page);
    this.yardName = page.getByRole('heading', { level: 3 }).first();

    this.address = this.detailValue('Address');
    this.officeHours = this.detailValue('Office hours');
    this.phone = page.getByTestId('contact-phone-link');

    this.auctionEventsHeading = this.sectionHeading('Auction events');
    const eventCard = page.getByTestId(/^auction-card-\d+$/);
    this.eventCards = this.section('Auction events', eventCard).locator(eventCard);

    this.noEventsMessage = page.getByText('There are currently no events at this location');
    this.auctionCalendarLink = page.getByRole('link', { name: 'See full auction calendar' });

    this.aboutHeading = this.sectionHeading('About this yard');
    this.aboutSection = this.section('About this yard', page.locator('p'));

    // Category cards are links with a name heading; "See all" has none
    const categoryCard = page.getByRole('link').filter({ has: page.getByRole('heading', { level: 6 }) });
    this.categoryCards = this.section('Items in yard', categoryCard).locator(categoryCard);

    this.itemsInYardHeading = this.sectionHeading('Items in yard');
    this.additionalInfoHeading = this.sectionHeading('Additional information');

    this.sellerForm = page
      .locator('div', { has: page.getByRole('heading', { name: 'Become a seller', exact: true }) })
      .filter({ has: page.locator('form') })
      .last();
    this.sellerPhone = this.sellerForm.locator('a[href^="tel:"]');

    this.representativesTab = page.getByRole('tab', { name: 'Representatives' });
    // Hidden tab panels are excluded, so this only matches once the tab is open
    this.representativeNames = page.getByRole('tabpanel').getByRole('heading', { level: 4 });
  }

  async open(slug: string): Promise<void> {
    await this.goto(yardPath(slug));
  }

  /** Section titles (h4) of the open tab, in reading order. */
  async getSectionTitles(): Promise<string[]> {
    const titles = this.page.getByRole('tabpanel').getByRole('heading', { level: 4 });
    await titles.first().waitFor();
    return (await titles.allInnerTexts()).map((title) => title.trim());
  }

  /** Number of upcoming events in the page's own embedded data (__NEXT_DATA__), not the rendered cards. */
  async getUpcomingEventCount(): Promise<number> {
    return (await this.getEmbeddedPageProps()).upcomingEvents?.length ?? 0;
  }

  /** Number of inventory groups in the page's own embedded data; 0 when the yard has no inventory. */
  async getInventoryGroupCount(): Promise<number> {
    return (await this.getEmbeddedPageProps()).itemsInYard?.length ?? 0;
  }

  async getEventCards(): Promise<EventCard[]> {
    await this.eventCards.first().waitFor();
    const cards = await this.eventCards.all();
    return Promise.all(
      cards.map(async (card) => ({
        dateRange: (await card.getByTestId(/^auction-card-date-range-/).innerText()).trim(),
        title: (await card.getByRole('heading', { level: 5 }).innerText()).trim(),
      })),
    );
  }

  async getCategoryCards(): Promise<CategoryCard[]> {
    await this.categoryCards.first().waitFor({ state: 'attached' });
    // textContent (not innerText) so that off-screen slides are read too
    return this.categoryCards.evaluateAll((links) =>
      links.map((link) => ({
        name: link.querySelector('h6')?.textContent?.trim() ?? '',
        quantity: link.querySelector('p')?.textContent?.trim() ?? '',
      })),
    );
  }

  async showRepresentatives(): Promise<void> {
    await this.representativesTab.click();
  }

  async getRepresentativeCards(): Promise<RepresentativeCard[]> {
    await this.representativeNames.first().waitFor();
    const names = await this.representativeNames.all();
    return Promise.all(
      names.map(async (name) => {
        // A card is the heading's parent: name, then region/role headings, then contact links
        const card = name.locator('..');
        return {
          name: (await name.innerText()).trim(),
          region: (await card.getByRole('heading', { level: 6 }).first().innerText()).trim(),
          contacts: await card
            .locator('a[href^="tel:"], a[href^="mailto:"]')
            .evaluateAll((links) => links.map((link) => link.getAttribute('href') ?? '')),
        };
      }),
    );
  }

  private async getEmbeddedPageProps(): Promise<{ upcomingEvents?: unknown[]; itemsInYard?: unknown[] | null }> {
    const html = await this.page.content();
    return extractNextData(html, this.page.url()).props.pageProps as {
      upcomingEvents?: unknown[];
      itemsInYard?: unknown[] | null;
    };
  }

  private sectionHeading(title: string): Locator {
    return this.page.getByRole('heading', { level: 4, name: title, exact: true });
  }

  /**
   * A page section: the innermost element containing both the section heading and its content.
   * Ancestors match as well and come first in document order, so the innermost match is last.
   */
  private section(title: string, content: Locator): Locator {
    return this.page
      .locator('div', { has: this.sectionHeading(title) })
      .filter({ has: content })
      .last();
  }

  /** Value paragraph under a Details label such as "Address" */
  private detailValue(label: string): Locator {
    return this.page
      .locator('div', { has: this.page.getByRole('heading', { level: 6, name: label, exact: true }) })
      .last()
      .locator('p')
      .first();
  }
}
