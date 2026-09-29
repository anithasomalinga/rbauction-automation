import { mergeTests } from '@playwright/test';
import { test as apiTest } from '@fixtures/api.fixtures';

/**
 * Single entry point for specs: `import { test, expect } from '@fixtures'`.
 * UI fixtures (page objects) are merged in here as they are added.
 */
export const test = mergeTests(apiTest);
export { expect } from '@playwright/test';
