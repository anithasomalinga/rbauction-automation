import { test } from '@playwright/test';

/** Records a measured count on the current test, shown under the test in the HTML report. */
export function recordCount(label: string, value: number | string): void {
  test.info().annotations.push({ type: 'count', description: `${label}: ${value}` });
}

/** Logs a search total and the first result titles, e.g. for A3.4 and Scenario 4.2. */
export function logTotalAndTitles(searchText: string, total: number | string, titles: string[]): void {
  console.log(
    [
      `Search "${searchText}": ${total} total results`,
      `First ${titles.length} titles:`,
      ...titles.map((title, index) => `  ${index + 1}. ${title}`),
    ].join('\n'),
  );
}
