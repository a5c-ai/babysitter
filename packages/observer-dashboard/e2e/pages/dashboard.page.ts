import { type Page, type Locator, expect } from "@playwright/test";
import { seedListView } from "../helpers";

/**
 * Page Object for the Observer Dashboard (/).
 *
 * Encapsulates selectors and actions for the main dashboard view
 * including project health cards, KPI metric tiles, filter pills,
 * and run cards.
 */
export class DashboardPage {
  readonly page: Page;

  /* ---- Top-level locators ---- */

  /** The page header containing the title and controls. */
  readonly header: Locator;

  /** The "Babysitter Observer" heading text. */
  readonly heading: Locator;

  /** The grid of KPI metric tiles (Total Runs, Active, Completed, Failed). */
  readonly kpiGrid: Locator;

  /** The row of status filter pill buttons. */
  readonly filterBar: Locator;

  /** The grid container holding ProjectHealthCard components. */
  readonly projectGrid: Locator;

  /** The project count label (e.g. "4 projects"). */
  readonly projectCount: Locator;

  /** Loading skeleton placeholders shown while data loads. */
  readonly loadingSkeletons: Locator;

  /** Error banner shown when project loading fails. */
  readonly errorBanner: Locator;

  /** Empty state shown when no projects match. */
  readonly emptyState: Locator;

  /** Settings button in the top bar. */
  readonly settingsButton: Locator;

  /** Theme toggle button in the top bar. */
  readonly themeToggle: Locator;

  /** SSE connection status indicator dot. */
  readonly connectionDot: Locator;

  /* ---- Flat run-list locators (e2e-no-flatlist-locator) ---- */

  /**
   * The flat, self-fetching run list rendered by <RunList> when the status
   * filter is anything other than "all". Replaces the project grid in that mode.
   */
  readonly runList: Locator;

  /**
   * Individual run rows within the flat list. Each row renders a stretched
   * overlay <a data-testid="run-row"> anchor (the row container is a
   * div[role="listitem"]); in real e2e we locate by testid, not by tag.
   */
  readonly runRows: Locator;

  /** Loading skeleton state of the flat run list. */
  readonly runListLoading: Locator;

  /** Error state of the flat run list. */
  readonly runListError: Locator;

  constructor(page: Page) {
    this.page = page;
    this.header = page.locator("header");
    this.heading = page.getByRole("heading", { name: "Babysitter Observer" });
    this.kpiGrid = page.getByTestId("kpi-grid");
    this.filterBar = page.getByTestId("filter-bar");
    this.projectGrid = page.getByTestId("project-grid-active").or(page.getByTestId("project-grid-filtered")).or(page.getByTestId("project-grid-history"));
    this.projectCount = page.getByTestId("project-count");
    this.loadingSkeletons = page.locator(".animate-pulse");
    this.errorBanner = page.getByTestId("error-banner");
    this.emptyState = page.getByTestId("empty-state");
    // Scoped to the header: the shared EmptyState renders its own "Settings"
    // button ("No runs found" → open Settings), and an unscoped role locator
    // becomes a strict-mode violation whenever that state flashes mid-test —
    // one of the settings-modal flake causes.
    this.settingsButton = page
      .locator("header")
      .getByRole("button", { name: "Settings" });
    this.themeToggle = page.locator("button").filter({ hasText: /Switch to/ });
    this.connectionDot = page.locator("[title*='Live updates']");
    // Flat run-list locators (e2e-no-flatlist-locator).
    this.runList = page.getByTestId("run-list");
    this.runRows = page.getByTestId("run-row");
    this.runListLoading = page.getByTestId("run-list-loading");
    this.runListError = page.getByTestId("run-list-error");
  }

  /* ---- Navigation ---- */

  /**
   * Navigate to the dashboard root in LIST view.
   *
   * The kanban board is the default view at "/" (SPEC-vibekanban §6.1), but
   * this page object models the legacy list-view surfaces (project grid,
   * flat run list). Seeding the persisted view before navigation keeps every
   * legacy spec on the view it was written against; board specs use their own
   * navigation helper in kanban-board.spec.ts and never go through here.
   */
  async goto() {
    await seedListView(this.page);
    // Use domcontentloaded because SSE keeps the "load" event open
    await this.page.goto("/", { waitUntil: "domcontentloaded" });
  }

  /* ---- Actions ---- */

  /**
   * Open the Settings modal DETERMINISTICALLY.
   *
   * A single blind `settingsButton.click()` is a known flake class under the
   * parallel dev-server suite: with 12 workers hammering cold Next.js
   * compiles, a click can land in the window where the header button is
   * painted but React has not (re)attached its onClick handler yet (hydration
   * / SSE-triggered re-render race) — the click "succeeds" and nothing opens,
   * and the follow-up toBeVisible burns its whole timeout. Instead of bumping
   * timeouts, re-click until the modal actually mounts: the loop converges on
   * the first attempt after handlers are live, and fails fast overall via
   * toPass's outer budget.
   */
  async openSettings() {
    const modal = this.page.getByTestId("settings-modal");
    await expect(this.settingsButton).toBeVisible({ timeout: 30_000 });
    await expect(async () => {
      // A previous attempt may have succeeded just after its 2s check ended —
      // never re-click through the open modal's overlay.
      if (await modal.isVisible()) return;
      await this.settingsButton.click({ timeout: 5_000 });
      await expect(modal).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
  }

  /* ---- Queries ---- */

  /**
   * Return all visible ProjectHealthCard elements.
   * Each card is a `<div>` rendered by the `Card` component inside
   * `ProjectHealthCard`. Cards may span multiple grid containers
   * (active runs, filtered results, recent history), so we locate
   * them by their data-testid prefix.
   */
  getProjectCards(): Locator {
    return this.page.locator("[data-testid^='project-card-']");
  }

  /**
   * Return all visible RunCard link elements.
   * RunCards are rendered as `<a>` tags wrapping a Card inside each
   * expanded ProjectHealthCard.
   */
  getRunCards(): Locator {
    return this.page.locator('[data-testid^="project-card-"] a[href^="/runs/"]');
  }

  /**
   * Click a specific run card to navigate to the run detail page.
   * @param runId - The run ID (or partial ID) to locate the card.
   */
  async clickRun(runId: string) {
    await this.page.locator(`a[href="/runs/${runId}"]`).click();
  }

  /**
   * Return KPI metric tile elements.
   * These are the 4-column grid items: Total Runs, Active, Completed, Failed.
   */
  getKPITiles(): Locator {
    return this.kpiGrid.locator("> *");
  }

  /**
   * Return a specific KPI metric tile by its label.
   * @param label - One of "total-runs", "active", "completed", "failed".
   */
  getMetricTile(label: string): Locator {
    return this.page.getByTestId(`metric-tile-${label}`);
  }

  /**
   * Return a specific project health card by project name.
   * @param projectName - The project name, e.g. "demo-project".
   */
  getProjectCard(projectName: string): Locator {
    return this.page.getByTestId(`project-card-${projectName}`);
  }

  /**
   * Return filter pill buttons (All, Running, Completed, Failed).
   */
  getFilterPills(): Locator {
    return this.filterBar.locator("button");
  }

  /**
   * Return a specific filter pill button by its data-testid value.
   * The current pill set (RunFilterBar) is:
   *   all | needsyou | waiting | orphaned | stale | completed | failed
   * The "orphaned" and "stale" pills are hidden when their count is 0, so
   * callers should guard on visibility before asserting against them
   * (e2e-no-flatlist-locator / e2e-pill-labels-missing-new-pills).
   * @param value - One of the pill values listed above.
   */
  getFilterPill(value: string): Locator {
    return this.page.getByTestId(`filter-pill-${value}`);
  }

  /**
   * Click a status filter pill by its (case-sensitive substring) label text.
   * Prefer clickFilterByValue() in new tests — it is robust to label changes
   * (the pill labels are: All, Needs you, Waiting, Orphaned, Stale, Completed,
   * Failed) and covers the triage pills.
   * @param status - A pill label substring, e.g. "Completed", "Failed", "All".
   */
  async clickFilter(status: string) {
    await this.filterBar
      .locator("button")
      .filter({ hasText: status })
      .click();
  }

  /**
   * Click a status filter pill by its data-testid value. Robust to label-text
   * changes (e.g. the "waiting" pill is labelled "Waiting", not "Running")
   * and works for the triage pills (needsyou/orphaned/stale).
   * @param value - One of the pill values, e.g. "completed", "waiting", "all".
   */
  async clickFilterByValue(value: string) {
    await this.getFilterPill(value).click();
  }

  /**
   * Type a search query into the project search/filter input.
   * Note: The dashboard page uses filter pills, not a search input.
   * If a ProjectSearchInput is embedded in a future version, this
   * targets `input[placeholder*="Filter"]` or the search input.
   */
  async searchProjects(query: string) {
    const searchInput = this.page.locator(
      'input[placeholder*="Filter"], input[placeholder*="Search"]'
    );
    await searchInput.fill(query);
  }

  /**
   * Expand collapsed run sub-sections (Failed Runs, Completed History)
   * within an already-expanded project card so that all run cards
   * become visible. This is needed because the ProjectHealthCard
   * collapses completed and failed runs by default.
   */
  async expandRunSubSections() {
    // Wait for the expanded card's run data to finish loading.
    // The ProjectHealthCard shows loading skeletons while fetching runs.
    // We wait for those to disappear (or for run links to appear) before
    // looking for the collapsible sub-section buttons.
    await this.page
      .locator("[data-testid^='project-card-'] .animate-pulse")
      .first()
      .waitFor({ state: "hidden", timeout: 15_000 })
      .catch(() => {
        // Skeletons may never appear if data loads fast enough
      });

    // Also wait for at least one run link OR a sub-section button to appear,
    // confirming that the run data has loaded and rendered.
    const runContent = this.page.locator('a[href^="/runs/"]')
      .or(this.page.locator("button").filter({ hasText: "Failed Runs" }))
      .or(this.page.locator("button").filter({ hasText: "Completed History" }));
    await runContent.first().waitFor({ state: "visible", timeout: 15_000 }).catch(() => {
      // No runs or sub-sections found — card may be empty
    });

    // Click "Failed Runs" section header if present
    const failedSection = this.page.locator("button").filter({ hasText: "Failed Runs" });
    if (await failedSection.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await failedSection.click();
    }

    // Click "Completed History" section header if present
    const completedSection = this.page.locator("button").filter({ hasText: "Completed History" });
    if (await completedSection.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await completedSection.click();
    }
  }

  /* ---- Waiters ---- */

  /**
   * Wait for initial data to finish loading.
   * Resolves once loading skeletons disappear and either project cards,
   * the error banner, or the empty state become visible.
   */
  async waitForData() {
    // Wait for skeletons to disappear (if they appeared)
    await this.loadingSkeletons.first().waitFor({ state: "hidden", timeout: 60_000 }).catch(() => {
      // Skeletons may never appear if data loads fast enough
    });

    // At least one of these states should be present:
    // - One of the project grids (active or filtered) — the "all" view
    // - The flat run list (loaded, loading, or error) — a status-filtered view
    //   (e2e-no-flatlist-locator: waitForData tolerates the flat-list mode too)
    // - The recent history section (when no active runs exist)
    // - The error banner or empty state
    const projectContent = this.projectGrid
      .or(this.runList)
      .or(this.runListLoading)
      .or(this.runListError)
      .or(this.page.getByTestId("recent-history-section"))
      .or(this.page.getByTestId("idle-empty-state"))
      .or(this.page.getByTestId("idle-with-history-banner"));
    // .first(): the intent is "at least ONE surface is visible". Several of
    // these can legitimately coexist (e.g. the active project grid + the
    // recent-history section), and React 19 commits them together, so a bare
    // toBeVisible on the or-chain trips Playwright's strict-mode violation.
    await expect(
      projectContent.or(this.errorBanner).or(this.emptyState).first()
    ).toBeVisible({ timeout: 60_000 });
  }

  /**
   * Wait for the flat run list to settle after selecting a status filter.
   * Resolves once the loaded list, its error state, or the shared empty state
   * ("No runs found", shown when a filter has zero runs) is visible. Use this
   * after clicking a non-"all" pill (e2e-no-flatlist-locator).
   */
  async waitForRunList() {
    // Let the loading skeleton clear if it appeared.
    await this.runListLoading
      .waitFor({ state: "hidden", timeout: 30_000 })
      .catch(() => {
        // Skeleton may never appear if the fetch resolves quickly.
      });

    const listContent = this.runList
      .or(this.runListError)
      // <RunList> renders the shared <EmptyState> (untestid'd) for a 0-run
      // bucket; match its heading text so empty filters don't hang the waiter.
      .or(this.page.getByText("No runs found"));
    // .first() for the same strict-mode reason as waitForData().
    await expect(listContent.first()).toBeVisible({ timeout: 30_000 });
  }
}
