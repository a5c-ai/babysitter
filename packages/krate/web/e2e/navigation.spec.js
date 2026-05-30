import {
  attachBrowserErrorCapture,
  expect,
  expectNoBrowserErrors,
  expectNoRawServerErrors,
  hasUsableAuthFixture,
  test,
} from './fixtures/krate-fixtures.js';

const MAJOR_ROUTES = [
  { path: '/orgs/default', heading: /Home|Krate|Dashboard/i },
  { path: '/orgs/default/agents', heading: /Agents/i },
  { path: '/orgs/default/inference', heading: /Inference/i },
  { path: '/orgs/default/external', heading: /External backend providers/i },
  { path: '/orgs/default/repositories', heading: /Repositories|Code/i },
  { path: '/orgs/default/settings', heading: /Settings/i },
  { path: '/orgs/default/playground', heading: /Playground/i },
  { path: '/orgs/default/costs', heading: /Costs/i },
];

test.describe('Krate browser navigation', () => {
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
    test.skip(!hasUsableAuthFixture(), 'Requires KRATE_E2E_AUTH_STATE or unsigned local session cookies.');

    const errors = attachBrowserErrorCapture(authenticatedPage);
    await authenticatedPage.goto(`/orgs/${org}/agents`, { waitUntil: 'domcontentloaded' });

    await expect(authenticatedPage.getByRole('banner', { name: /Krate global navigation/i })).toBeVisible();
    await expect(authenticatedPage.getByRole('complementary', { name: /Krate sections/i })).toBeVisible();
    await expect(authenticatedPage.getByRole('link', { name: /^Stacks$/i })).toBeVisible();
    await expect(authenticatedPage.getByRole('link', { name: /^Trigger rules$/i })).toBeVisible();
    await expect(authenticatedPage.getByRole('link', { name: /^Playground$/i })).toBeVisible();
    await expectNoRawServerErrors(authenticatedPage);
    expectNoBrowserErrors(errors);
  });
});
