import { mergeTests } from '@playwright/test';
import { test as apiTest } from '@fixtures/api.fixtures';
import { test as uiTest } from '@fixtures/ui.fixtures';

/** Single entry point for specs: `import { test, expect } from '@fixtures'`. */
export const test = mergeTests(apiTest, uiTest);
export { expect } from '@playwright/test';
