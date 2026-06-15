import {
  attachBrowserErrorCapture,
  expect,
  expectNoBrowserErrors,
  expectNoRawServerErrors,
  hasUsableAuthFixture,
  test,
} from './fixtures/kradle-fixtures.js';

const MAJOR_ROUTES = [
  { path: '/orgs/default', heading: /Home|Kradle|Dashboard/i },
  { path: '/orgs/default/agents', heading: /Agents/i },
  { path: '/orgs/default/inference', heading: /Inference/i },
  { path: '/orgs/default/external', heading: /External backend providers/i },
  { path: '/orgs/default/repositories', heading: /Repositories|Code/i },
  { path: '/orgs/default/settings', heading: /Settings/i },
  { path: '/orgs/default/playground', heading: /Playground/i },
  { path: '/orgs/default/costs', heading: /Costs/i },
];

test.describe('Kradle browser navigation', () => {
  for (const route of MAJOR_ROUTES) {
    test(`${route.path} renders an HTML page or auth redirect without raw errors`, async ({ page }) => {
      const errors = attachBrowserErrorCapture(page);
      await page.goto(route.path, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
      await expectNoRawServerErrors(page);
      if (page.url().includes('/login')) {
        await expect(page.locator('h1')).toContainText('Sign in');
      } else {
        await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible();
      }
      expectNoBrowserErrors(errors);
    });
  }

  test('authenticated org shell exposes primary navigation landmarks', async ({ authenticatedPage, org }) => {
    test.skip(!hasUsableAuthFixture(), 'Requires KRADLE_E2E_AUTH_STATE or unsigned local session cookies.');

    const errors = attachBrowserErrorCapture(authenticatedPage);
    await authenticatedPage.goto(`/orgs/${org}/agents`, { waitUntil: 'domcontentloaded' });

    await expect(authenticatedPage.getByRole('banner', { name: /Kradle global navigation/i })).toBeVisible();
    await expect(authenticatedPage.getByRole('complementary', { name: /Kradle sections/i })).toBeVisible();
    await expect(authenticatedPage.getByRole('link', { name: /^Stacks$/i })).toBeVisible();
    await expect(authenticatedPage.getByRole('link', { name: /^Trigger rules$/i })).toBeVisible();
    await expect(authenticatedPage.getByRole('link', { name: /^Playground$/i })).toBeVisible();
    await expectNoRawServerErrors(authenticatedPage);
    expectNoBrowserErrors(errors);
  });
});

// ---------------------------------------------------------------------------
// Sidebar click navigation — click each sidebar link, verify page loads
// ---------------------------------------------------------------------------
test.describe('Sidebar click navigation', () => {
  // These are sidebar links that should be clickable and navigate correctly.
  // We test a representative sample from each navigation group.
  const SIDEBAR_LINKS = [
    { label: /^Code$/i, expectedUrl: '/repositories' },
    { label: /^Agents$/i, expectedUrl: '/agents' },
    { label: /^Stacks$/i, expectedUrl: '/agents/stacks' },
    { label: /^Trigger rules$/i, expectedUrl: '/agents/rules' },
    { label: /^People$/i, expectedUrl: '/people' },
    { label: /^Settings$/i, expectedUrl: '/settings' },
    { label: /^Evaluations$/i, expectedUrl: '/evals' },
    { label: /^Datasets$/i, expectedUrl: '/datasets' },
    { label: /^Guardrails$/i, expectedUrl: '/guardrails' },
    { label: /^Inference$/i, expectedUrl: '/inference' },
    { label: /^Insights$/i, expectedUrl: '/insights' },
    { label: /^Costs$/i, expectedUrl: '/costs' },
    { label: /^Providers$/i, expectedUrl: '/external' },
  ];

  for (const { label, expectedUrl } of SIDEBAR_LINKS) {
    test(`clicking sidebar "${label.source}" navigates to ${expectedUrl}`, async ({ authenticatedPage, org }) => {
      const errors = attachBrowserErrorCapture(authenticatedPage);

      // Start from the home page so the sidebar is loaded
      await authenticatedPage.goto(`/orgs/${org}`, { waitUntil: 'domcontentloaded' });

      // If redirected to login, skip this test
      if (authenticatedPage.url().includes('/login')) {
        test.skip(true, 'Auth redirect — delegated identity not active on this target.');
        return;
      }

      // Find the sidebar link and click it
      const sidebar = authenticatedPage.locator('.appSidebar');
      const link = sidebar.getByRole('link', { name: label });
      await expect(link).toBeVisible({ timeout: 10_000 });
      await link.click();

      // Verify URL changed to expected path
      await authenticatedPage.waitForURL(new RegExp(expectedUrl.replace(/\//g, '\\/')), { timeout: 15_000 });
      expect(authenticatedPage.url()).toContain(expectedUrl);

      await expectNoRawServerErrors(authenticatedPage);
      expectNoBrowserErrors(errors);
    });
  }
});

// ---------------------------------------------------------------------------
// Breadcrumbs — verify breadcrumb trail on nested pages
// ---------------------------------------------------------------------------
test.describe('Breadcrumb navigation', () => {
  const BREADCRUMB_PAGES = [
    { path: '/orgs/default/agents/stacks', breadcrumbs: ['Kradle', 'Stacks'] },
    { path: '/orgs/default/settings', breadcrumbs: ['Kradle', 'Settings'] },
    { path: '/orgs/default/evals', breadcrumbs: ['Kradle'] },
    { path: '/orgs/default/insights', breadcrumbs: ['Kradle', 'Insights'] },
  ];

  for (const { path, breadcrumbs } of BREADCRUMB_PAGES) {
    test(`${path} shows breadcrumb trail`, async ({ page }) => {
      const errors = attachBrowserErrorCapture(page);
      await page.goto(path, { waitUntil: 'domcontentloaded' });

      if (page.url().includes('/login')) {
        test.skip(true, 'Auth redirect — breadcrumbs test needs authenticated access.');
        return;
      }

      const breadcrumbNav = page.locator('nav.breadcrumbs, [aria-label="Breadcrumbs"]');
      if (await breadcrumbNav.count() > 0) {
        for (const crumb of breadcrumbs) {
          await expect(breadcrumbNav.getByText(crumb, { exact: false })).toBeVisible();
        }
      }

      await expectNoRawServerErrors(page);
      expectNoBrowserErrors(errors);
    });
  }
});

// ---------------------------------------------------------------------------
// Back navigation — navigate forward then back
// ---------------------------------------------------------------------------
test.describe('Back navigation', () => {
  test('browser back button returns to previous page', async ({ page }) => {
    const errors = attachBrowserErrorCapture(page);

    await page.goto('/orgs/default', { waitUntil: 'domcontentloaded' });
    if (page.url().includes('/login')) {
      test.skip(true, 'Auth redirect — back navigation test needs authenticated access.');
      return;
    }

    const firstUrl = page.url();
    await page.goto('/orgs/default/agents', { waitUntil: 'domcontentloaded' });
    expect(page.url()).toContain('/agents');

    await page.goBack({ waitUntil: 'domcontentloaded' });
    // Should return to the dashboard page
    expect(page.url()).not.toContain('/agents');

    await expectNoRawServerErrors(page);
    expectNoBrowserErrors(errors);
  });
});
