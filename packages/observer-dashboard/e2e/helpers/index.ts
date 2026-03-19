/**
 * Shared helper utilities for Observer E2E tests.
 */

/**
 * Generate a fake run ID for test fixtures.
 */
export function fakeRunId(index = 0): string {
  return `test-run-${String(index).padStart(4, "0")}`;
}

/**
 * Wait for a specific number of milliseconds.
 * Prefer Playwright's built-in waiters when possible.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build the API URL for a given run ID.
 */
export function runApiUrl(runId: string): string {
  return `/api/runs/${runId}`;
}

/**
 * Build the API URL for run events.
 */
export function eventsApiUrl(runId: string): string {
  return `/api/runs/${runId}/events`;
}

/**
 * Build the API URL for a specific task detail.
 */
export function taskApiUrl(runId: string, effectId: string): string {
  return `/api/runs/${runId}/tasks/${effectId}`;
}
