import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { z } from 'zod';
import { validate } from '@utils/validate';
import { assertNotWafBlocked } from '@utils/wafGuard';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface RequestOptions {
  params?: Record<string, string | number | boolean>;
  headers?: Record<string, string>;
  /** JSON request body */
  data?: unknown;
}

/** Thrown when a request that must succeed returns a non-2xx status. */
export class ApiError extends Error {
  constructor(
    readonly method: HttpMethod,
    readonly url: string,
    readonly status: number,
    bodySnippet: string,
  ) {
    super(`${method} ${url} returned HTTP ${status}\n${bodySnippet}`);
    this.name = 'ApiError';
  }
}

/** Wraps Playwright's APIResponse with timing plus JSON parsing and optional schema validation. */
export class ApiResponse {
  constructor(
    readonly method: HttpMethod,
    readonly raw: APIResponse,
    readonly durationMs: number,
  ) {}

  get status(): number {
    return this.raw.status();
  }

  get ok(): boolean {
    return this.raw.ok();
  }

  get url(): string {
    return this.raw.url();
  }

  header(name: string): string | undefined {
    return this.raw.headers()[name.toLowerCase()];
  }

  text(): Promise<string> {
    return this.raw.text();
  }

  /** Parses the body as JSON; when a schema is given, validates it and returns the typed result. */
  async json(): Promise<unknown>;
  async json<S extends z.ZodType>(schema: S): Promise<z.output<S>>;
  async json(schema?: z.ZodType): Promise<unknown> {
    const text = await this.text();
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      throw new Error(
        `Expected JSON from ${this.method} ${this.url} but got "${this.header('content-type')}":\n` +
          snippet(text),
      );
    }
    return schema ? validate(schema, body, `Response from ${this.method} ${this.url}`) : body;
  }

  /** Throws ApiError unless the status is 2xx. */
  async assertOk(): Promise<this> {
    if (!this.ok) {
      throw new ApiError(this.method, this.url, this.status, snippet(await this.text()));
    }
    return this;
  }
}

/**
 * Base class for all API clients. Subclasses expose one method per endpoint and keep tests free
 * of URLs, headers and parsing. Relative paths resolve against the configured baseURL.
 */
export abstract class BaseApiClient {
  constructor(protected readonly request: APIRequestContext) {}

  /** Sends a request and returns the response whatever its status (use for negative tests). */
  protected async send(
    method: HttpMethod,
    path: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse> {
    const started = performance.now();
    const raw = await this.request.fetch(path, { method, ...options });
    const response = new ApiResponse(method, raw, Math.round(performance.now() - started));
    await assertNotWafBlocked(raw);
    return response;
  }

  /** GET that must succeed, parsed and validated against the schema. */
  protected async getJson<S extends z.ZodType>(
    path: string,
    schema: S,
    options?: Omit<RequestOptions, 'data'>,
  ): Promise<z.output<S>> {
    const response = await this.send('GET', path, options);
    await response.assertOk();
    return response.json(schema);
  }

  /** POST that must succeed, parsed and validated against the schema. */
  protected async postJson<S extends z.ZodType>(
    path: string,
    data: unknown,
    schema: S,
    options?: Omit<RequestOptions, 'data'>,
  ): Promise<z.output<S>> {
    const response = await this.send('POST', path, { ...options, data });
    await response.assertOk();
    return response.json(schema);
  }
}

function snippet(text: string, max = 500): string {
  return text.length > max ? `${text.slice(0, max)}… (${text.length} chars)` : text;
}
