import type { APIRequestContext } from '@playwright/test';
import { z } from 'zod';
import { BaseApiClient, type ApiResponse } from '@api/clients/BaseApiClient';
import { extractNextData, type NextData } from '@utils/nextData';
import { validate } from '@utils/validate';

/**
 * Where page data is read from:
 * - 'html':      the __NEXT_DATA__ script embedded in the server-rendered page (default; no buildId needed)
 * - 'dataRoute': /_next/data/{buildId}/{locale}{path}.json, the route Next.js uses on client-side navigation
 */
export type PageDataSource = 'html' | 'dataRoute';

const DataRouteSchema = z.object({ pageProps: z.unknown() });

/**
 * Reads server-side page data from any Next.js page on the site. rbauction.com has no public REST
 * API for content such as locations, so this page JSON is the API under test.
 */
export class NextDataClient extends BaseApiClient {
  private buildId: string | undefined;

  constructor(
    request: APIRequestContext,
    private readonly locale: string,
  ) {
    super(request);
  }

  /** Full __NEXT_DATA__ envelope (buildId, page route, query, props) of a server-rendered page. */
  async getNextData(path: string): Promise<NextData> {
    const response = await this.send('GET', path);
    await response.assertOk();
    return extractNextData(await response.text(), response.url);
  }

  /** pageProps of the page at `path`, validated against `schema`. */
  async getPageProps<S extends z.ZodType>(
    path: string,
    schema: S,
    source: PageDataSource = 'html',
  ): Promise<z.output<S>> {
    const pageProps =
      source === 'html'
        ? (await this.getNextData(path)).props.pageProps
        : (await this.getDataRoute(path)).pageProps;
    return validate(schema, pageProps, `${source} pageProps of ${path}`);
  }

  /** Current deployment's buildId, fetched once and cached for this client. */
  async getBuildId(): Promise<string> {
    this.buildId ??= (await this.getNextData('/')).buildId;
    return this.buildId;
  }

  /**
   * Raw data-route response of the page at `path`, whatever its status (status and header checks).
   * With a `buildId`, that exact deployment is requested and the response returned as is (negative tests).
   */
  async getDataRouteRaw(path: string, buildId?: string): Promise<ApiResponse> {
    if (buildId) return this.send('GET', this.dataRoutePath(buildId, path));

    let response = await this.send('GET', this.dataRoutePath(await this.getBuildId(), path));

    // A deployment during the run invalidates the cached buildId (404): refresh it and retry once
    if (response.status === 404) {
      this.buildId = undefined;
      response = await this.send('GET', this.dataRoutePath(await this.getBuildId(), path));
    }
    return response;
  }

  private async getDataRoute(path: string): Promise<{ pageProps: unknown }> {
    const response = await this.getDataRouteRaw(path);
    await response.assertOk();
    return response.json(DataRouteSchema);
  }

  private dataRoutePath(buildId: string, path: string): string {
    const route = path === '/' ? '/index' : path.replace(/\/$/, '');
    return `/_next/data/${buildId}/${this.locale}${route}.json`;
  }
}
