# rbauction.com Test Automation

UI and API test automation framework for [rbauction.com](https://www.rbauction.com), built with
**Playwright** and **TypeScript**. The first features covered are the locations directory
(`/lp`), yard pages (`/lp/{slug}`) and inventory search (`/search`, `POST /api/search`).

The framework is designed for **simplicity, reusability, extensibility and maintainability**:
one runner for UI and API tests, a strict layered structure, and schema-validated, data-driven
tests that stay stable against a live production site.

> **Status:** framework (phases 1–2) and all API tests (API 1–3) are complete. UI scenarios S1–S4
> are in progress; see [Requirement coverage](#requirement-coverage) and [Roadmap](#roadmap).

---

## Contents

- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Running tests](#running-tests)
- [Configuration](#configuration)
- [Project structure](#project-structure)
- [Architecture and design decisions](#architecture-and-design-decisions)
- [Requirement coverage](#requirement-coverage)
- [Observations about the site under test](#observations-about-the-site-under-test)
- [Conventions](#conventions)
- [Extensibility](#extensibility)
- [Roadmap](#roadmap)

---

## Tech stack

| Tool | Purpose |
|---|---|
| [Playwright Test](https://playwright.dev) 1.63 | Runner for both UI (browser) and API (`request`) tests, reporting, tracing |
| TypeScript 6.0 (strict) | Type safety across page objects, clients and test data |
| [Zod](https://zod.dev) 4 | Runtime schema validation of API payloads; TypeScript types are inferred from the schemas |
| dotenv | Optional local `.env` overrides |
| ESLint + typescript-eslint + eslint-plugin-playwright | Correctness rules (missing `await`, `test.only`, `waitForTimeout`, …) |

TypeScript is pinned to `~6.0`: TypeScript 7 is released, but `typescript-eslint` supports only
`< 6.1` so far.

## Getting started

Prerequisites: **Node.js 20+** and npm.

```bash
npm ci                              # install exact versions from package-lock.json
npx playwright install chromium     # browser binary (add firefox/webkit if needed)
cp .env.example .env                # optional: local overrides
```

## Running tests

```bash
npm test                  # everything
npm run test:api          # API project only (no browser)
npm run test:ui           # UI project only (Chromium)
npm run test:smoke        # tests tagged @smoke
npx playwright test --grep @API1    # one requirement group (@API1, @API2, @API3, @S1 … @S4)
npm run report            # open the last HTML report
```

Quality checks:

```bash
npm run typecheck         # tsc --noEmit
npm run lint              # ESLint
```

On failure the HTML report contains a **trace, screenshot and video**. Open a trace with
`npx playwright show-trace test-results/<test>/trace.zip`.

> **Browsers run headed by default.** rbauction.com is behind Akamai bot protection, which
> blocks headless browsers with HTTP 403. See [Observations](#observations-about-the-site-under-test).

## Configuration

All settings are optional environment variables (see [`.env.example`](.env.example)):

| Variable | Default | Effect |
|---|---|---|
| `ENV` | `prod` | Target environment from [`config/environments.ts`](config/environments.ts) |
| `BASE_URL` | from `ENV` | Override the base URL for an ad-hoc run |
| `HEADLESS` | `false` | Run browsers headless (only where the WAF allows it) |
| `ALL_BROWSERS` | `false` | Also run UI tests on Firefox, WebKit and mobile Chrome (Pixel 7) |
| `CI` | unset | Set by CI: enables retries (1), `forbidOnly`, the GitHub reporter and 2 workers |

Adding an environment (e.g. staging) is one entry in `config/environments.ts`.

## Project structure

```
├── config/
│   └── environments.ts          # environments: baseURL + Next.js locale, selected by ENV
├── src/
│   ├── api/
│   │   ├── clients/
│   │   │   ├── BaseApiClient.ts     # typed get/post, status checks, timing, schema validation
│   │   │   ├── NextDataClient.ts    # generic reader for Next.js page JSON (any page)
│   │   │   ├── LocationsClient.ts   # yards list (API 1) and yard page (API 2)
│   │   │   └── SearchApiClient.ts   # POST /api/search (API 3)
│   │   └── schemas/                 # Zod contracts; types are inferred from them
│   ├── pages/                       # page objects and components (UI; in progress)
│   ├── fixtures/                    # Playwright fixtures; `@fixtures` is the single import for specs
│   ├── data/                        # reference data, thresholds, payload builders
│   └── utils/                       # WAF guard, __NEXT_DATA__ parser, schema validation, report counts
├── tests/
│   ├── api/                         # API 1–3 specs
│   └── ui/                          # Scenario 1–4 specs
├── playwright.config.ts
├── eslint.config.mjs
└── tsconfig.json                    # strict; path aliases @api @pages @fixtures @data @utils @config
```

## Architecture and design decisions

```
tests            intent and assertions only: no selectors, URLs or raw HTTP
  │
fixtures         build and inject clients / page objects
  │
pages · api      UI: locators + actions          API: clients (transport) + schemas (contracts)
  │
data · utils · config
```

A layer only depends on the layers below it.

1. **Page JSON is the API under test.** The site has no public locations API. Yard data comes from
   the Next.js payload, either embedded in the HTML (`<script id="__NEXT_DATA__">`) or served by
   `/_next/data/{buildId}/{locale}/lp/{slug}.json`. `NextDataClient` reads either source for
   **any** page; `LocationsClient` adds the domain methods on top. The embedded HTML source is the
   default because it needs no `buildId`, which changes with every deployment (it changed during
   development of this project). When the data route is used and a deploy invalidates the cached
   `buildId`, the client refreshes it and retries once.
2. **Loose, evidence-based schemas.** A schema declares only the fields the tests rely on, and
   drops unknown fields, so unrelated CMS changes don't break tests. Nullability comes from live
   data: all 74 yard pages and all 2,136 Edmonton search records were validated during development.
   Schemas check shape; business rules ("count > 60") are asserted in tests.
3. **Data-driven, not hard-coded.** On a live site, counts, events and inventory change daily.
   Tests take expected values from the payload itself, and use fixed reference data only where
   it is stable (`src/data/yards.ts`: Edmonton, Phoenix) and thresholds from the requirements.
4. **Fail with a clear cause.** Every request passes through a WAF guard: an Akamai block becomes
   `WafBlockedError` ("environment issue, not a product defect", with the Akamai reference ID)
   instead of a confusing timeout. Schema errors name the exact field path
   (`→ at yards[26].oracleSiteId`), and HTTP errors include the method, URL, status and body.
5. **One runner.** Playwright runs both UI and API tests, so there is one config, one report and
   one set of fixtures. API clients use the test-scoped `request` context, so every call is
   isolated per test and recorded in that test's trace.
6. **Polite to production.** Tests are read-only (no form submissions), with limited workers and
   one retry on CI.

## Requirement coverage

Test titles start with the requirement ID, and specs are tagged per requirement group. Measured
counts (locations, event counts, categories, …) are attached to each test as `count` annotations
and appear under the test in the HTML report.

### API 1: auction sites list (`/lp` page JSON): ✅ done

Spec: [`tests/api/api1-auction-sites.spec.ts`](tests/api/api1-auction-sites.spec.ts) · tag `@API1`

| ID | Requirement | How it is verified | Live value (2026-09-29) |
|---|---|---|---|
| A1.1 | Payload is JSON and includes a list of yards | Schema-validated `yards` array is non-empty; embedded JSON equals the `/_next/data` route | 74 yards |
| A1.2 | More than 60 locations | `yards.length > 60` | 74 |
| A1.3 | Each location has a name and a country | Lists any location without a name or country name/code | none missing |
| A1.4 | Includes Edmonton (Canada / CAN) and Phoenix (United States / USA) | Each is found by name and its country checked | ✅ |
| A1.5 | Each has type Satellite or Permanent; satellite > 15, permanent > 25 | Lists untyped locations; counts per type | 31 / 43 |
| A1.6 | More than 8 distinct countries, including United States and Canada | Distinct country codes; USA and CAN mapped to their names | 16 |

### API 2: Edmonton yard page JSON (`/lp/edmonton-ab`): ✅ done

Spec: [`tests/api/api2-edmonton-yard.spec.ts`](tests/api/api2-edmonton-yard.spec.ts) · tag `@API2`

| ID | Requirement | How it is verified | Live value (2026-09-29) |
|---|---|---|---|
| A2.1 | Payload is JSON | Schema-validated payload contains yard details, events and inventory; embedded JSON equals the `/_next/data` route | ✅ |
| A2.2 | Yard is Edmonton; address includes 1500 Sparrow Drive, Nisku, T9E 8H6; phone and hours present | Name and address fields against reference data; phone has 7+ digits; pickup hours from/to are set | +17809552486, 08:00–17:00 |
| A2.3 | Count upcoming events; each has a date range and a name; at least one refers to Edmonton or Nisku | Count recorded in the report; each event has a name and ends after it starts; the "Edmonton or Nisku" check is **skipped with a reason** if the yard has no upcoming events | 2 events |
| A2.4 | Count categories in `itemsInYard` (flattened) > 5; each has a name; `totalAssets` ≥ 0 when present; includes Excavators | Flattens the per-sale-event groups; asserts on **distinct** category names (see note); lists unnamed categories and invalid quantities | 54 entries, 41 distinct |

**Note on A2.4:** `itemsInYard` is grouped per sale event, so the same category (e.g. Excavators)
appears in several groups. The test counts **distinct** categories (41), which matches the 41
categories the yard page shows, and records the flattened entry count (54) as well. Both are well
above the threshold of 5.

### API 3: Edmonton inventory search (`POST /api/search`): ✅ done

Spec: [`tests/api/api3-edmonton-search.spec.ts`](tests/api/api3-edmonton-search.spec.ts) · tag `@API3`

Request body `{ "freeText": "Edmonton" }` (query `?source=search_page`, as sent by the search
page). Each test makes one request for the first page only; the suite never pages through all lots.

| ID | Requirement | How it is verified | Live value (2026-09-29) |
|---|---|---|---|
| A3.1 | Response is HTTP 200 and JSON | Status 200, `content-type: application/json`, body matches the search schema | ✅ |
| A3.2 | `results.totalAmount` > 0 | Full hit count read from the first response and recorded in the report | 2,136 |
| A3.3 | First page is non-empty; each record has an `assetDescription` | Lists the item numbers of any record without one | 60 records, none missing |
| A3.4 | Log the total count and the first 5 titles | Printed to the console (also kept in the HTML report's stdout); asserts that 5 titles were logged | see below |

Example A3.4 output:

```
Search "Edmonton": 2136 total results
First 5 titles:
  1. 2007 Kenworth C500B 8x6 Winch Truck
  2. Mundare, AB 6 Whitetail Crescent Residential Property
  3. Mundare, AB 17 Whitetail Way Residential Property
  4. Mundare, AB 13 Whitetail Close Residential Acreage
  5. 2025 John Deere 9RX710 Signature Edition Track Tractor
```

The order of results varies between requests (see observation 2), so the titles differ from run to run.

### UI scenarios S1–S4: planned

| Scenario | Spec |
|---|---|
| S1: Locations directory (`/lp`) | `tests/ui/s1-locations-directory.spec.ts` |
| S2: Open a yard from the directory | `tests/ui/s2-open-yard.spec.ts` |
| S3: Edmonton yard page | `tests/ui/s3-edmonton-yard.spec.ts` |
| S4: Edmonton inventory search | `tests/ui/s4-edmonton-search.spec.ts` |

## Observations about the site under test

Found while building and validating the framework (production, 2026-09-29). These are reported
for triage; the tests are written so that they don't hide or trip over them.

### Test environment

| Observation | Impact / handling |
|---|---|
| Akamai returns HTTP 403 to headless browsers and to curl; headed Chromium and Playwright's API client are allowed | Browsers run headed (CI will provide a virtual display via `xvfb-run`); `WafBlockedError` makes any block obvious. For CI, the proper fix is allowlisting the runner IPs, not bypassing bot protection |

### `/api/search` (inventory search)

| # | Observation | Suggested severity |
|---|---|---|
| 1 | `from: -1` returns **HTTP 503** with an empty body, every time (backend, not the WAF). Invalid input should return 400 | Medium |
| 2 | **Result order isn't stable**: the same page fetched twice differs, and 43 of 2,136 Edmonton listings appear on two adjacent pages. Paging users see duplicates and miss other listings | Medium–High |
| 3 | `from: 1000000` returns 60 records, while every offset past the end up to 10,000 correctly returns 0 | Low |
| 4 | `from: "abc"` is silently treated as 0 instead of being rejected | Low |
| 5 | A zero-result search omits `records` entirely instead of returning `[]` | Low (inconsistent contract) |

### Page data (locations)

| # | Observation | Suggested severity |
|---|---|---|
| 6 | Midland's `oracleSiteId` is the **string `"null"`**, not a null value | Low (data quality) |
| 7 | 8 yards have no `oracleSiteId`, 12 have no pickup hours, and Leipzig has no `marketplaceAdvertisedName` | Low (data completeness) |
| 8 | `itemsInYard` is `null` (not `[]`) for 6 yards with no inventory | Low (inconsistent contract) |
| 9 | An unknown yard slug (`/lp/does-not-exist`) returns **HTTP 200** and then redirects to `/not-found` on the client: a "soft 404", which search engines may index | Low (SEO) |

## Conventions

- **Imports:** specs import `test` and `expect` from `@fixtures`, never directly from `@playwright/test`.
- **Naming:** specs are `api{n}-*.spec.ts` / `s{n}-*.spec.ts`; test titles start with the requirement ID (`A1.4 …`).
- **Tags:** `@API1`–`@API3`, `@S1`–`@S4` per requirement group; `@smoke` for the fast critical subset.
- **Data-dependent skips:** when a requirement is conditional ("if the yard has events"), use `test.skip(condition, reason)` so the report shows why, instead of passing silently.
- **Assertions:** give counts a message (`expect(n, 'satellite locations')`), use `expect.soft` when checking several independent items, and list offenders instead of asserting a boolean.
- **No hard waits:** `waitForTimeout`, `networkidle` and `force: true` are lint errors; use web-first assertions.
- **Formatting:** no formatter is enforced; follow the existing style (single quotes, semicolons, 2-space indent).

## Extensibility

- **New feature or page:** add a page object in `src/pages/`, a client and schema in `src/api/`,
  and specs in `tests/`. Other Next.js pages can reuse `NextDataClient` directly.
- **New environment or locale:** one entry in `config/environments.ts`.
- **More browsers / mobile:** `ALL_BROWSERS=true` enables Firefox, WebKit and mobile Chrome,
  which are already defined in `playwright.config.ts`.
- **A second API runner:** clients, schemas and payload builders don't depend on Playwright's test
  runner, only on a request context. A Vitest + `fetch` or PactumJS suite could reuse the schemas
  and builders if the team wanted API tests outside Playwright.
- **Further quality checks (not in scope yet):** accessibility (axe-core), visual regression and
  performance budgets.

## Roadmap

| Phase | Content | Status |
|---|---|---|
| 1 | Scaffold: Playwright, TypeScript, config, ESLint | ✅ |
| 2 | API layer: WAF guard, clients, schemas, fixtures | ✅ |
| 3 | API tests: API 1, API 2, API 3 | ✅ |
| 4 | UI layer: page objects, components, UI fixtures | Planned |
| 5 | UI tests: S1–S4 | Planned |
| 6 | CI (GitHub Actions) and final documentation | Planned |
