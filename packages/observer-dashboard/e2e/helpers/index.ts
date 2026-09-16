/**
 * Shared helper utilities for Observer E2E tests.
 */

import type { Page } from "@playwright/test";

/**
 * Seed the persisted dashboard view to "list" BEFORE navigation.
 *
 * SPEC-vibekanban §6.1 made the kanban board the default view at "/", while
 * the legacy dashboard specs (grid, KPI flows, flat run list, etc.) were
 * written against the list view. Seeding the same localStorage key the
 * ViewToggle persists to ("observer:dashboard-view" via usePersistedState,
 * JSON-serialized) makes those specs open directly in list view without
 * clicking the toggle in every test.
 *
 * Board-behavior specs (e2e/tests/kanban-board.spec.ts) intentionally do NOT
 * use this helper — they need the fresh-profile board default (AC-11).
 */
export async function seedListView(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "observer:dashboard-view",
      JSON.stringify("list")
    );
  });
}

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
