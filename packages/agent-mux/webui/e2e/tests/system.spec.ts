import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test, type APIRequestContext, type Page, type TestInfo } from "@playwright/test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testPort = Number.parseInt(process.env.AMUX_WEBUI_E2E_PORT ?? "4175", 10);
const stateFile = path.resolve(__dirname, `../../.tmp/amux-webui-e2e-state-${testPort}.json`);

type FixtureState = {
  baseUrl: string;
  adminUsername: string;
  adminPassword: string;
  sessionId: string;
  codexSessionId: string;
  issueId: string;
  issueKey: string;
  workspacePath: string;
  transcriptText: string;
  codexTranscriptText: string;
};

let cachedState: FixtureState | null = null;

async function readFixtureState(): Promise<FixtureState> {
  if (cachedState) {
    return cachedState;
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < 30_000) {
    try {
      const raw = await fs.readFile(stateFile, "utf8");
      cachedState = JSON.parse(raw) as FixtureState;
      return cachedState;
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code !== "ENOENT") {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  throw new Error(`Timed out waiting for fixture state at ${stateFile}.`);
}

async function authenticatePage(page: Page, request: APIRequestContext, testInfo: TestInfo) {
  const state = await readFixtureState();
  const response = await request.post(`${state.baseUrl}/api/v1/bootstrap/login`, {
    data: {
      username: state.adminUsername,
      password: state.adminPassword,
      clientName: `playwright-webui-e2e-${testInfo.workerIndex}-${testInfo.retry}-${testInfo.testId}`,
    },
  });
  expect(response.ok()).toBeTruthy();

  const payload = (await response.json()) as {
    issuedToken: {
      plaintext: string;
    };
  };
  const auth = {
    gatewayUrl: state.baseUrl,
    token: payload.issuedToken.plaintext,
  };

  await page.addInitScript((input) => {
    window.localStorage.setItem("amux.webui.auth", JSON.stringify(input));
  }, auth);
}

test.describe("agent-mux webui e2e", () => {
  test("workspaces keeps its shell stable before an authenticated session is established", async ({ page }) => {
    await page.goto("/workspaces", { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(/\/workspaces$/);
    await expect(page.getByTestId("workspace-sidebar-surface")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Find the right workspace and jump back into the session" })).toBeVisible();
    await expect(page.getByLabel("Workspace search")).toBeVisible();
    await expect(page.getByTestId("workspace-review-queue-details")).not.toHaveAttribute("open", "");
  });

  test("focused workspace stays compact before any linked session is available", async ({ page }) => {
    const state = await readFixtureState();
    await page.goto(`/workspaces?workspace=${encodeURIComponent(state.workspacePath)}`, { waitUntil: "domcontentloaded" });

    await expect(page).toHaveURL(new RegExp(`/workspaces\\?workspace=${encodeURIComponent(state.workspacePath)}`));
    await expect(page.getByTestId("workspace-shell")).toBeVisible();
    await expect(page.getByText("No linked session yet")).toBeVisible();
    await expect(page.getByText("No sessions attached")).toBeVisible();
    await expect(page.getByTestId("panel-toggle-sidebar")).toBeVisible();
    await expect(page.getByTestId("panel-toggle-conversation")).toHaveCount(0);
    await expect(page.getByTestId("workspace-context-bar")).toContainText("Issue and repo stay visible here until a session attaches");

    const titleFontSize = await page.locator("h1").evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
    expect(titleFontSize).toBeLessThan(40);
  });

  test.describe("authenticated surfaces", () => {
    test.beforeEach(async ({ page, request }, testInfo) => {
      await authenticatePage(page, request, testInfo);
    });

    test("board uses the available width and keeps heavy details collapsed until requested", async ({ page }) => {
      const state = await readFixtureState();
      await page.goto("/projects/kanban-app/board", { waitUntil: "domcontentloaded" });

      const board = page.getByTestId("kanban-board");
      await expect(board).toBeVisible();

      const viewport = page.viewportSize();
      const appContent = page.locator(".app-content");
      const appContentBox = await appContent.boundingBox();
      const boardBox = await board.boundingBox();
      expect(appContentBox).not.toBeNull();
      expect(boardBox).not.toBeNull();
      expect(viewport).not.toBeNull();
      expect(appContentBox!.width / viewport!.width).toBeGreaterThan(0.68);
      expect(boardBox!.width / viewport!.width).toBeGreaterThan(0.58);
      expect(boardBox!.width / appContentBox!.width).toBeGreaterThan(0.85);

      const swimlane = page.locator('[data-testid^="kanban-swimlane-"]').first();
      await expect(swimlane).toBeVisible();
      const swimlaneBox = await swimlane.boundingBox();
      expect(swimlaneBox).not.toBeNull();
      expect(swimlaneBox!.y).toBeLessThan(viewport!.height * 0.95);
      const columns = swimlane.locator('[data-testid^="kanban-column-"]');
      await expect(columns).toHaveCount(4);
      const firstFourBoxes = await Promise.all(
        [0, 1, 2, 3].map(async (index) => await columns.nth(index).boundingBox()),
      );
      for (const box of firstFourBoxes) {
        expect(box).not.toBeNull();
      }
      expect(firstFourBoxes[1]!.x).toBeGreaterThan(firstFourBoxes[0]!.x);
      expect(firstFourBoxes[2]!.x).toBeGreaterThan(firstFourBoxes[1]!.x);
      expect(firstFourBoxes[3]!.x).toBeGreaterThan(firstFourBoxes[2]!.x);

      await expect(page.getByTestId("board-controls-details")).toBeVisible();
      await expect(page.getByTestId("board-controls-details")).not.toHaveAttribute("open", "");
      await expect(page.getByTestId("board-review-details")).not.toHaveAttribute("open", "");
      await expect(page.getByLabel("Workflow filter")).not.toBeVisible();

      const linkedCard = page.getByTestId(`kanban-card-${state.issueKey}`);
      await expect(linkedCard).toBeVisible();
      await expect(linkedCard.getByText("Repository lifecycle")).not.toBeVisible();
      await expect(linkedCard.getByText("Workspace options")).not.toBeVisible();
      await linkedCard.locator("details summary").click();
      await expect(linkedCard.getByText("Workspace options")).toBeVisible();
      await expect(linkedCard.getByText("Repository lifecycle")).toBeVisible();
      await expect(page.getByRole("button", { name: "Open workspace", exact: true }).first()).toBeVisible();
    });

    test("board workspace links keep issue association visible and hand off cleanly into the linked session chat", async ({ page }) => {
      const state = await readFixtureState();
      await page.goto("/projects/kanban-app/board", { waitUntil: "domcontentloaded" });

      const linkedCard = page.getByTestId(`kanban-card-${state.issueKey}`);
      await expect(linkedCard).toBeVisible();
      await linkedCard.getByTestId(`open-linked-workspace-${state.issueKey}`).click();

      await expect(page).toHaveURL(new RegExp(`/workspaces\\?workspace=${encodeURIComponent(state.workspacePath)}`));
      await expect(page.getByTestId("workspace-shell")).toBeVisible();
      await expect(page.getByTestId(`workspace-primary-issue-link-${state.issueKey}`)).toBeVisible();
      await expect(page.getByTestId("workspace-session-select")).toBeVisible();
      await expect(page.getByTestId("panel-toggle-conversation")).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByTestId("workspace-panel-conversation")).toBeVisible();
      await expect(page.getByText(state.transcriptText)).toBeVisible();
      const viewSessionButton = page.getByRole("button", { name: "View session", exact: true }).first();
      await expect(viewSessionButton).toBeVisible();
      await expect(page.getByTestId("workspace-context-bar")).toContainText(state.issueKey);

      await viewSessionButton.click();

      await expect(page).toHaveURL(new RegExp(`/sessions/${state.sessionId}$`));
      await expect(page.getByTestId("workspace-panel-conversation")).toBeVisible();
      await expect(page.getByText(state.transcriptText)).toBeVisible();
    });

    test("session detail stays chat-first and keeps workspace context beside the transcript", async ({ page }) => {
      const state = await readFixtureState();
      await page.goto(`/sessions/${state.sessionId}`, { waitUntil: "domcontentloaded" });

      await expect(page.getByTestId("workspace-shell")).toBeVisible();
      await expect(page.getByTestId("workspace-desktop-panels")).toBeVisible();
      await expect(page.getByTestId("workspace-panel-conversation")).toBeVisible();
      await expect(page.getByText(state.transcriptText)).toBeVisible();
      await expect(page.getByText("Keep the transcript open, continue the session from here, and pull in runtime or execution detail only when you need it.")).toBeVisible();
      await expect(page.getByTestId("workspace-panel-sidebar")).toContainText("Session context and quick links");
      await expect(page.getByTestId("conversation-stats-details")).not.toHaveAttribute("open", "");
      await expect(page.getByTestId("composer-options-details")).not.toHaveAttribute("open", "");
      await expect(page.getByPlaceholder("Continue the session...")).toBeEnabled();
      await expect(page.getByTestId("panel-toggle-sidebar")).toHaveAttribute("aria-pressed", "true");
      await expect(page.getByTestId("panel-toggle-conversation")).toHaveAttribute("aria-pressed", "true");

      const shellBox = await page.getByTestId("workspace-shell").boundingBox();
      const desktopPanelsBox = await page.getByTestId("workspace-desktop-panels").boundingBox();
      const viewport = page.viewportSize();
      expect(shellBox).not.toBeNull();
      expect(desktopPanelsBox).not.toBeNull();
      expect(viewport).not.toBeNull();
      expect(shellBox!.width / viewport!.width).toBeGreaterThan(0.65);
      expect(desktopPanelsBox!.width / shellBox!.width).toBeGreaterThan(0.9);
    });

    test("codex follow-up resumes the same session instead of drifting into a new one", async ({ page }) => {
      const state = await readFixtureState();
      const followUpPrompt = "Resume this codex session in place.";
      const expectedReply = `Codex resumed the existing session: ${followUpPrompt}`;

      await page.goto("/sessions", { waitUntil: "domcontentloaded" });
      const codexCard = page.getByTestId(`session-card-${state.codexSessionId}`);
      await expect(codexCard).toBeVisible();
      await expect(codexCard).toContainText("codex");
      await codexCard.getByRole("link", { name: "Resume chat" }).click();

      await expect(page.getByTestId("workspace-shell")).toBeVisible();
      await expect(page.getByTestId("workspace-panel-conversation")).toBeVisible();
      await expect(page.getByTestId("workspace-panel-sidebar")).toContainText("codex");
      await expect(page.getByPlaceholder("Continue the session...")).toBeEnabled();

      await page.getByPlaceholder("Continue the session...").fill(followUpPrompt);
      await page.getByRole("button", { name: "Continue session" }).click();

      await expect(page).toHaveURL(new RegExp(`/sessions/${state.codexSessionId}$`));
      await expect(page.getByText(expectedReply)).toBeVisible();
      await expect(page.getByText("codex-session-unexpected-new-id")).toHaveCount(0);
    });

    test("sessions directory stays compact and keeps utility chrome collapsed until requested", async ({ page }) => {
      const state = await readFixtureState();
      await page.goto("/sessions", { waitUntil: "domcontentloaded" });

      await expect(page.getByRole("heading", { name: "Jump back into the right chat." })).toBeVisible();
      await expect(page.getByLabel("Search sessions")).toBeVisible();
      await expect(page.getByTestId("topbar-tools-details")).not.toHaveAttribute("open", "");
      await expect(page.getByTestId(`session-card-${state.sessionId}`)).toBeVisible();

      const viewport = page.viewportSize();
      const topbarBox = await page.locator(".app-topbar").boundingBox();
      const searchBox = await page.getByLabel("Search sessions").boundingBox();
      const liveCardBox = await page.getByTestId(`session-card-${state.sessionId}`).boundingBox();
      expect(viewport).not.toBeNull();
      expect(topbarBox).not.toBeNull();
      expect(searchBox).not.toBeNull();
      expect(liveCardBox).not.toBeNull();
      expect(topbarBox!.height / viewport!.height).toBeLessThan(0.22);
      expect(searchBox!.y).toBeLessThan(viewport!.height * 0.55);
      expect(liveCardBox!.y).toBeLessThan(viewport!.height * 0.95);
    });

    test("dispatches route keeps triage controls in view without a doc-heavy hero", async ({ page }) => {
      await page.goto("/runs", { waitUntil: "domcontentloaded" });

      await expect(page.getByRole("heading", { name: "Dispatch queue and approvals" })).toBeVisible();
      await expect(page.getByTestId("global-search-input")).toBeVisible();
      await expect(page.getByTestId("topbar-tools-details")).not.toHaveAttribute("open", "");

      const viewport = page.viewportSize();
      const searchBox = await page.getByTestId("global-search-input").boundingBox();
      expect(viewport).not.toBeNull();
      expect(searchBox).not.toBeNull();
      expect(searchBox!.y).toBeLessThan(viewport!.height * 0.78);
    });
  });
});
