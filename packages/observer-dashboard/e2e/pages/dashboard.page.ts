import { type Page, type Locator, expect } from "@playwright/test";

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
    this.settingsButton = page.getByRole("button", { name: "Settings" });
    this.themeToggle = page.locator("button").filter({ hasText: /Switch to/ });
    this.connectionDot = page.locator("[title*='Live updates']");
  }

  /* ---- Navigation ---- */

  /** Navigate to the dashboard root. */
  async goto() {
    // Use domcontentloaded because SSE keeps the "load" event open
    await this.page.goto("/", { waitUntil: "domcontentloaded" });
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
   * @param projectName - The project name, e.g. "podcast-intel".
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
   * @param value - One of "all", "waiting", "completed", "failed".
   */
  getFilterPill(value: string): Locator {
    return this.page.getByTestId(`filter-pill-${value}`);
  }

  /**
   * Click a status filter pill by its label text.
   * @param status - One of "All", "Running", "Completed", "Failed".
   */
  async clickFilter(status: string) {
    await this.filterBar
      .locator("button")
      .filter({ hasText: status })
      .click();
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
    // - One of the project grids (active or filtered)
    // - The recent history section (when no active runs exist)
    // - The error banner or empty state
    const projectContent = this.projectGrid
      .or(this.page.getByTestId("recent-history-section"))
      .or(this.page.getByTestId("idle-empty-state"))
      .or(this.page.getByTestId("idle-with-history-banner"));
    await expect(
      projectContent.or(this.errorBanner).or(this.emptyState)
    ).toBeVisible({ timeout: 60_000 });
  }
}
