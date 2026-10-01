# Ritchie Bros. Auction Sites Test Automation

E2E and API test automation framework for [rbauction.com](https://www.rbauction.com), built with
**Playwright** and **TypeScript**. The features covered are the locations directory, yard pages and inventory search.


## What the project automates

Automated checks for three features of [rbauction.com](https://www.rbauction.com), at two levels:
the data the site serves (API tests) and what a user sees in the browser (E2E tests).

| Feature | API tests | E2E tests (browser) |
|---|---|---|
| Locations directory (`/lp`) | The list of auction sites: counts, countries, site types | Country groups, satellite and permanent sites, tabs |
| Yard page (`/lp/edmonton-ab`) | Yard details, upcoming events, items in yard | Details, auction events, items carousel, representatives |
| Inventory search (`/search`) | `POST /api/search` for "Edmonton": totals and records | Result count and result cards |

## Framework setup

| Tool | What it is used for |
|---|---|
| [Playwright Test](https://playwright.dev) | Runs both the API and the browser tests, and produces the report |
| TypeScript (strict) | Type safety across the framework and the tests |
| [Zod](https://zod.dev) | Checks that API responses have the expected shape |
| ESLint | Code-quality rules, including Playwright-specific ones |
| dotenv | Optional local settings in a `.env` file |

The main settings are in [`playwright.config.ts`](playwright.config.ts):

- **Two test projects:** `api` (no browser) and `chromium` (browser tests).
- **Browsers open visibly:** the site blocks headless browsers, so a Chromium window appears
  while the E2E tests run.
- **Target site:** `https://www.rbauction.com` by default, defined in
  [`config/environments.ts`](config/environments.ts). Other environments are added there.
- **On failure:** a trace, a screenshot and a video are saved for the failed test.

Optional settings can be placed in a `.env` file (see [`.env.example`](.env.example)):

| Variable | Default | Effect |
|---|---|---|
| `ENV` | `prod` | Which environment to test |
| `BASE_URL` | from `ENV` | Use a different site address for one run |
| `HEADLESS` | `false` | Run browsers without a window, where the site allows it |
| `ALL_BROWSERS` | `false` | Also run the E2E tests on Firefox, WebKit and mobile Chrome |

## Test architecture

Tests describe what is being checked. Everything else (addresses, selectors, requests) lives in
the layers underneath, and each layer only uses the ones below it.

```
tests        what is checked: steps and assertions only
  │
fixtures     create the page objects and API clients and hand them to the tests
  │
pages · api  pages: selectors and actions for each page
  │          api: clients that fetch data, and schemas that validate it
  │
data · utils · config    test data, helpers, environments
```

```
├── config/            environments (site address per environment)
├── src/
│   ├── api/
│   │   ├── clients/   one client per data source (locations, search)
│   │   └── schemas/   expected shape of each response
│   ├── pages/         one page object per page (locations, yard, search results)
│   ├── fixtures/      what tests import: `import { test, expect } from '@fixtures'`
│   ├── data/          reference data such as the Edmonton yard and thresholds
│   └── utils/         small helpers
└── tests/
    ├── api/           API 1–3
    └── e2e/           Scenarios 1–5
```

- **Test IDs:** each test title starts with its requirement ID, such as `A1.2` (API) or `3.4` (E2E).
- **Tags:** `@API1`–`@API3` and `@S1`–`@S5` select one group, `@smoke` selects the fast critical
  subset, and `@negative` selects the negative cases.
- **Live data:** counts, events and inventory change daily, so tests read expected values from the
  site's own data and use fixed values only where they are stable.

## Dependencies to install

### 1. Node.js

You need **Node.js 20 or newer**. npm is included with Node.js.

Use **one** of these options; they all install the same thing:

- **Installer (Windows or macOS):** download the LTS installer from [nodejs.org](https://nodejs.org) and run it.
- **Windows, from a terminal:**

  ```powershell
  winget install OpenJS.NodeJS.LTS
  ```

- **macOS, from a terminal** (needs [Homebrew](https://brew.sh)):

  ```bash
  brew install node
  ```

Whichever option you used, open a new terminal afterwards and check that both are available:

```bash
node -v    # should print v20 or higher
npm -v
```

### 2. Get the project

Clone the repository from GitHub. This needs [Git](https://git-scm.com/downloads).

1. Open the repository page on GitHub.
2. Click the green **Code** button.
3. On the **HTTPS** tab, copy the URL (it ends in `.git`).
4. Open a terminal (macOS) or Command Prompt (Windows) in the folder where you keep your projects.
5. Clone the repository, pasting the URL you copied, and go into the project folder:

   ```bash
   git clone <repository-url>
   cd rbauction-automation
   ```

Without Git, use **Code → Download ZIP** on the same page instead, unzip the file, and open a
terminal in the unzipped folder.

### 3. Project packages and browser

In the same terminal (macOS) or Command Prompt (Windows), now in the project folder, run:

```bash
npm ci                             # installs the packages listed below
npm run install:browsers           # downloads the browser the E2E tests use
cp .env.example .env               # optional: only if you want to change settings
```

In Command Prompt, use `copy` in place of `cp` for the last command.

`npm ci` installs:

- **Runtime:** `zod`
- **Development:** `@playwright/test`, `typescript`, `dotenv`, `eslint`, `typescript-eslint`,
  `eslint-plugin-playwright`, `@eslint/js`, `@types/node`

## How to run the tests and view the reports

```bash
npm test                      # all 43 tests
npm run test:api              # API tests only (no browser)
npm run test:e2e              # E2E tests only (opens Chromium)
npm run test:smoke            # the @smoke subset
npm run test:negative         # the negative cases
npm test -- --grep @API1      # one group: @API1–@API3, @S1–@S5
```

Results are printed in the terminal as the tests run. To open the full report in a browser:

```bash
npm run report
```

The report lists every test with its result and duration. It also shows the counts the tests
measured (for example, the number of locations), and for the negative yard tests, which yard was used.

For a failed test, the report includes the screenshot, the video and a trace. The trace replays
the test step by step; open it from the report, or with:

```bash
npm run trace -- test-results/<test-folder>/trace.zip
```
