import { test } from '@playwright/test';

/** Records a measured count on the current test, shown under the test in the HTML report. */
export function recordCount(label: string, value: number): void {
  test.info().annotations.push({ type: 'count', description: `${label}: ${value}` });
}
