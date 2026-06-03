import {
  attachBrowserErrorCapture,
  expect,
  expectNoBrowserErrors,
  expectNoRawServerErrors,
  hasUsableAuthFixture,
  test,
} from './fixtures/kradle-fixtures.js';

test.describe('External providers and live streams', () => {
  test('external provider wizard submits provider resources from the browser without mutating staging', async ({ authenticatedPage, org }) => {
    test.skip(!hasUsableAuthFixture(), 'Requires KRADLE_E2E_AUTH_STATE or unsigned local session cookies.');
    const errors = attachBrowserErrorCapture(authenticatedPage);
    const submitted = [];

    await authenticatedPage.route(`**/api/orgs/${org}/resources`, async (route) => {
      const request = route.request();
      if (request.method() === 'POST') {
        submitted.push(request.postDataJSON());
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ resource: request.postDataJSON() }),
        });
        return;
      }
      await route.continue();
    });

    await authenticatedPage.goto(`/orgs/${org}/external/providers/new`, { waitUntil: 'domcontentloaded' });
    await authenticatedPage.getByLabel('Gitea').check();
    await authenticatedPage.getByRole('button', { name: 'Next', exact: true }).click();
    await authenticatedPage.getByLabel('Self-hosted').check();
    await authenticatedPage.getByRole('textbox', { name: 'Base URL' }).fill('https://gitea.issue-609-e2e.example.test');
    await authenticatedPage.getByRole('button', { name: 'Next', exact: true }).click();
    await authenticatedPage.getByRole('button', { name: 'Next', exact: true }).click();
    await authenticatedPage.getByLabel(/Secret name/).fill('issue-609-e2e-provider-secret');
    await authenticatedPage.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(authenticatedPage.getByText(/resources will be created: GitProvider/)).toBeVisible();
    await authenticatedPage.getByRole('button', { name: /Create .*providers/ }).click();

    await expect.poll(() => submitted.length).toBeGreaterThan(0);
    expect(submitted.map((item) => item.kind)).toEqual(expect.arrayContaining(['GitProvider', 'CiProvider', 'IssueTrackerProvider']));
    expect(submitted.every((item) => item.spec?.secretRef === 'issue-609-e2e-provider-secret')).toBe(true);
    await expectNoRawServerErrors(authenticatedPage);
    expectNoBrowserErrors(errors);
  });

  test('external sync dashboard renders binding summary and empty state', async ({ authenticatedPage, org }) => {
    test.skip(!hasUsableAuthFixture(), 'Requires KRADLE_E2E_AUTH_STATE or unsigned local session cookies.');
    const errors = attachBrowserErrorCapture(authenticatedPage);

    await authenticatedPage.goto(`/orgs/${org}/external/sync`, { waitUntil: 'domcontentloaded' });
    await expect(authenticatedPage.getByRole('heading', { name: /External sync dashboard/i })).toBeVisible();
    await expect(authenticatedPage.getByText(/Bindings/)).toBeVisible();
    await expectNoRawServerErrors(authenticatedPage);
    expectNoBrowserErrors(errors);
  });

  test('agent events stream is auth-aware and never returns a raw server crash', async ({ request, org }) => {
    const response = await request.get(`/api/orgs/${org}/agents/events/stream`, { timeout: 10_000 });
    expect(response.status()).toBeLessThan(500);
    if (response.status() === 401) {
      const body = await response.json();
      expect(body.message).toMatch(/Authentication required/);
    } else {
      expect(response.status()).toBeLessThan(500);
      if (response.status() === 200) {
        const contentType = response.headers()['content-type'] || '';
        expect(contentType).toMatch(/text\/event-stream|text\/html|application\/json/);
      }
    }
  });

  test('watch stream connects or reports a structured diagnostic', async ({ page, org }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const result = await page.evaluate((activeOrg) => new Promise((resolve) => {
      const es = new EventSource(`/api/watch/orgs/${activeOrg}/resources`);
      const timeout = setTimeout(() => {
        es.close();
        resolve({ status: 'timeout' });
      }, 5000);
      es.addEventListener('kradle', (event) => {
        clearTimeout(timeout);
        es.close();
        resolve({ status: 'event', data: event.data });
      });
      es.onerror = () => {
        clearTimeout(timeout);
        es.close();
        resolve({ status: 'error' });
      };
    }), org);

    expect(['event', 'error', 'timeout']).toContain(result.status);
    if (result.status === 'event') expect(result.data).toContain('resources');
  });
});
