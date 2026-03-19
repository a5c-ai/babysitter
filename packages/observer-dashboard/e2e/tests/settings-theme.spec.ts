import { test, expect } from "../fixtures";

/**
 * E2E tests for the Settings Modal and Theme Toggle functionality.
 *
 * Tests cover:
 * - Settings modal open/close behavior
 * - Settings modal section visibility (Watch Sources, Poll Interval, Theme, Run Retention)
 * - Theme toggle button switches between dark and light modes
 * - Theme changes apply correct CSS class and data-theme attribute to <html>
 * - Theme preference persists across page reload via localStorage
 * - Settings modal theme picker displays dark/light options
 */

test.describe("Settings Modal", () => {
  test("opens when clicking Settings button and closes on X button", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    // Open settings
    await dashboardPage.settingsButton.click();
    const modal = page.getByTestId("settings-modal");
    await expect(modal).toBeVisible({ timeout: 30_000 });

    // Close via X button (the Dialog.Close button inside the modal header)
    const closeButton = modal.locator("button").filter({ has: page.locator("svg.lucide-x") });
    await closeButton.click();
    await expect(modal).toBeHidden({ timeout: 10_000 });
  });

  test("opens when clicking Settings button and closes on Escape key", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    // Open settings
    await dashboardPage.settingsButton.click();
    const modal = page.getByTestId("settings-modal");
    await expect(modal).toBeVisible({ timeout: 30_000 });

    // Close via Escape key
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden({ timeout: 10_000 });
  });

  test("displays all expected sections: Watch Sources, Poll Interval, Theme, Run Retention", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    await dashboardPage.settingsButton.click();
    const modal = page.getByTestId("settings-modal");
    await expect(modal).toBeVisible({ timeout: 30_000 });

    // Wait for config to load (loading spinner should disappear)
    await expect(modal.locator("text=Loading configuration...")).toBeHidden({ timeout: 30_000 });

    // Verify all section labels are present
    await expect(modal.locator("text=Watch Sources")).toBeVisible();
    await expect(modal.locator("text=Poll Interval")).toBeVisible();
    await expect(modal.locator("text=Theme")).toBeVisible();
    await expect(modal.locator("text=Run Retention")).toBeVisible();
  });

  test("settings modal theme picker shows dark and light options", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    await dashboardPage.settingsButton.click();
    const modal = page.getByTestId("settings-modal");
    await expect(modal).toBeVisible({ timeout: 30_000 });

    // Wait for config to load
    await expect(modal.locator("text=Loading configuration...")).toBeHidden({ timeout: 30_000 });

    // The theme picker has two buttons: "dark" and "light" (capitalized via CSS capitalize)
    const themeSection = modal.locator("section").filter({ hasText: "Theme" });
    await expect(themeSection).toBeVisible();

    const darkButton = themeSection.getByRole("button", { name: "dark" });
    const lightButton = themeSection.getByRole("button", { name: "light" });
    await expect(darkButton).toBeVisible();
    await expect(lightButton).toBeVisible();
  });
});

test.describe("Theme Toggle", () => {
  test("header theme toggle button switches between dark and light mode", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    const themeToggle = page.getByTestId("theme-toggle");
    await expect(themeToggle).toBeVisible();

    // Default theme is dark — button should say "Switch to light theme"
    await expect(themeToggle).toHaveAttribute("aria-label", "Switch to light theme");

    // Click to switch to light
    await themeToggle.click();
    await expect(themeToggle).toHaveAttribute("aria-label", "Switch to dark theme");

    // Click to switch back to dark
    await themeToggle.click();
    await expect(themeToggle).toHaveAttribute("aria-label", "Switch to light theme");
  });

  test("theme toggle applies correct CSS class and data-theme attribute to html element", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    const themeToggle = page.getByTestId("theme-toggle");
    const html = page.locator("html");

    // Default: dark theme
    await expect(html).toHaveClass(/dark/);
    await expect(html).toHaveAttribute("data-theme", "dark");

    // Switch to light
    await themeToggle.click();
    await expect(html).toHaveClass(/light/);
    await expect(html).toHaveAttribute("data-theme", "light");

    // Switch back to dark
    await themeToggle.click();
    await expect(html).toHaveClass(/dark/);
    await expect(html).toHaveAttribute("data-theme", "dark");
  });

  test("theme preference persists across page reload", async ({
    dashboardPage,
    page,
  }) => {
    await dashboardPage.goto();
    await dashboardPage.waitForData();

    const themeToggle = page.getByTestId("theme-toggle");
    const html = page.locator("html");

    // Start in dark mode
    await expect(html).toHaveAttribute("data-theme", "dark");

    // Switch to light mode
    await themeToggle.click();
    await expect(html).toHaveAttribute("data-theme", "light");
    await expect(html).toHaveClass(/light/);

    // Reload the page
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(dashboardPage.heading).toBeVisible({ timeout: 30_000 });

    // Verify the theme is still light after reload (persisted via localStorage)
    await expect(html).toHaveAttribute("data-theme", "light");
    await expect(html).toHaveClass(/light/);

    // Switch back to dark to leave clean state for other tests.
    // Wait for React to hydrate and sync theme state from DOM before clicking,
    // otherwise the toggle may fire before useEffect reads the persisted theme.
    const toggleAfterReload = page.getByTestId("theme-toggle");
    await expect(toggleAfterReload).toHaveAttribute("aria-label", "Switch to dark theme", { timeout: 10_000 });
    await toggleAfterReload.click();
    await expect(html).toHaveAttribute("data-theme", "dark", { timeout: 10_000 });
  });
});
