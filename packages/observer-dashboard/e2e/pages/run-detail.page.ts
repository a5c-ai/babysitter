import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page Object for the Run Detail page (/runs/[runId]).
 *
 * Encapsulates selectors and actions for inspecting a single run,
 * including the pipeline step list, event stream, task detail panel,
 * outcome banner, and metrics row.
 */
export class RunDetailPage {
  readonly page: Page;

  /* ---- Top-level locators ---- */

  /** Outcome banner at the top (shown for completed/failed runs). */
  readonly outcomeBanner: Locator;

  /** Metrics row displaying duration, tasks, success rate, iterations. */
  readonly metricsRow: Locator;

  /** Pipeline view container (left panel with step cards). */
  readonly pipelinePanel: Locator;

  /** Task Detail panel header. */
  readonly taskDetailHeader: Locator;

  /** Event Stream panel. */
  readonly eventStreamPanel: Locator;

  /** Loading spinner shown while run data loads. */
  readonly loadingSpinner: Locator;

  /** Error message shown when the run cannot be loaded. */
  readonly errorMessage: Locator;

  /** Breadcrumb navigation within the pipeline header. */
  readonly breadcrumb: Locator;

  /** Back link to the Projects list in the breadcrumb. */
  readonly backToProjects: Locator;

  /** Close button for the task detail panel. */
  readonly closeDetailBtn: Locator;

  /** "Show all tasks" button when pipeline is truncated. */
  readonly showAllTasksBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    // OutcomeBanner via data-testid
    this.outcomeBanner = page.locator("[data-testid='outcome-banner']");

    // MetricsRow via data-testid
    this.metricsRow = page.locator("[data-testid='metrics-row']");

    // PipelineView via data-testid
    this.pipelinePanel = page.locator("[data-testid='pipeline-view']");

    // Task Detail header via data-testid
    this.taskDetailHeader = page.locator("[data-testid='task-detail-header']");

    // Event Stream panel via data-testid
    this.eventStreamPanel = page.locator("[data-testid='event-stream']");

    // Loading spinner
    this.loadingSpinner = page.locator(".animate-spin");

    // Error banner
    this.errorMessage = page.getByTestId("run-error-message");

    // Breadcrumb nav via data-testid
    this.breadcrumb = page.locator("[data-testid='pipeline-breadcrumb']");

    // Projects link in breadcrumb
    this.backToProjects = page.getByRole("link", { name: "Projects" });

    // Close detail button via data-testid
    this.closeDetailBtn = page.locator("[data-testid='close-detail-btn']");

    // Show all tasks button via data-testid
    this.showAllTasksBtn = page.locator("[data-testid='show-all-tasks-btn']");
  }

  /* ---- Navigation ---- */

  /** Navigate directly to a run detail page. */
  async goto(runId: string) {
    // Use domcontentloaded because SSE keeps the "load" event open
    await this.page.goto(`/runs/${runId}`, { waitUntil: "domcontentloaded" });
  }

  /* ---- Queries ---- */

  /**
   * Return all pipeline step card elements via data-testid prefix.
   */
  getPipelineSteps(): Locator {
    return this.page.locator("[data-testid^='step-card-']");
  }

  /**
   * Click a specific step/task in the pipeline by its effect ID
   * using the data-testid attribute.
   */
  async clickStep(effectId: string) {
    await this.page
      .locator(`[data-testid='step-card-${effectId}']`)
      .locator("button")
      .first()
      .click();
  }

  /**
   * Click a pipeline step by its visible title text.
   * @param title - The task title displayed in the step card.
   */
  async clickStepByTitle(title: string) {
    await this.page
      .locator("[data-testid^='step-card-']")
      .filter({ hasText: title })
      .locator("button")
      .first()
      .click();
  }

  /**
   * Click the Nth step card (0-indexed) in the pipeline.
   */
  async clickStepByIndex(index: number) {
    await this.getPipelineSteps()
      .nth(index)
      .locator("button")
      .first()
      .click();
  }

  /**
   * Return the step card locator for a given effect ID.
   */
  getStepCard(effectId: string): Locator {
    return this.page.locator(`[data-testid='step-card-${effectId}']`);
  }

  /**
   * Return the Task Detail panel content area (tabs).
   * Visible only after a step is selected.
   */
  getTaskDetailTabs(): Locator {
    return this.page.locator("[data-testid='task-detail-tabs']");
  }

  /**
   * Return the tab triggers inside the task detail panel.
   */
  getTabTrigger(tabName: string): Locator {
    return this.page.locator("[role='tablist']").getByRole("tab", { name: tabName });
  }

  /**
   * Return the Event Stream container with all event items.
   */
  getEventStream(): Locator {
    return this.eventStreamPanel;
  }

  /**
   * Return all individual event items in the event stream.
   */
  getEventItems(): Locator {
    return this.page.locator("[data-testid^='event-item-']");
  }

  /**
   * Return the OutcomeBanner element.
   * Only present for completed or failed runs.
   */
  getOutcomeBanner(): Locator {
    return this.outcomeBanner;
  }

  /**
   * Return the MetricsRow container holding duration, tasks, success rate,
   * and iteration metrics.
   */
  getMetricsRow(): Locator {
    return this.metricsRow;
  }

  /**
   * Return a specific metric card by label slug.
   * E.g., "total-duration", "tasks", "success-rate", "iterations".
   */
  getMetricCard(labelSlug: string): Locator {
    return this.page.locator(`[data-testid='metric-${labelSlug}']`);
  }

  /**
   * Return individual metric card elements inside the metrics row.
   */
  getMetricCards(): Locator {
    return this.metricsRow.locator("[data-testid^='metric-']");
  }

  /**
   * Return status badges visible in the pipeline breadcrumb area.
   */
  getRunStatusBadge(): Locator {
    return this.breadcrumb.locator("[data-testid^='status-badge-']");
  }

  /* ---- Waiters ---- */

  /**
   * Wait for the run data to finish loading.
   * Resolves once the loading spinner disappears and the pipeline or
   * error message becomes visible.
   */
  async waitForData() {
    // Wait for the spinner to disappear
    await this.loadingSpinner
      .first()
      .waitFor({ state: "hidden", timeout: 60_000 })
      .catch(() => {
        // Spinner may never appear if data loads immediately
      });

    // Expect either the breadcrumb nav (pipeline loaded) or an error
    await expect(
      this.breadcrumb.or(this.errorMessage)
    ).toBeVisible({ timeout: 60_000 });
  }
}
