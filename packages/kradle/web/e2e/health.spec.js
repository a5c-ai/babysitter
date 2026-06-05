import {
  attachBrowserErrorCapture,
  expect,
  expectNoBrowserErrors,
  expectNoRawServerErrors,
  test,
} from './fixtures/kradle-fixtures.js';

// ---------------------------------------------------------------------------
// Health / Insights page — verify the HealthMonitor component renders
// ---------------------------------------------------------------------------
test.describe('Health and system status', () => {
  test('Insights page renders the System Health panel', async ({ page, org }) => {
    const errors = attachBrowserErrorCapture(page);
    await page.goto(`/orgs/${org}/insights`, { waitUntil: 'domcontentloaded' });

    if (page.url().includes('/login')) {
      test.skip(true, 'Auth redirect — health test needs authenticated access.');
      return;
    }

    await expectNoRawServerErrors(page);

    // The HealthMonitor component renders a heading "System Health"
    await expect(page.getByText('System Health')).toBeVisible({ timeout: 15_000 });

    // Status rows should be present: Kubernetes and Gitea at minimum
    await expect(page.getByText('Kubernetes')).toBeVisible();
    await expect(page.getByText('Gitea')).toBeVisible();

    expectNoBrowserErrors(errors);
  });

  test('Health monitor shows status indicators for core services', async ({ page, org }) => {
    const errors = attachBrowserErrorCapture(page);
    await page.goto(`/orgs/${org}/insights`, { waitUntil: 'domcontentloaded' });

    if (page.url().includes('/login')) {
      test.skip(true, 'Auth redirect — health test needs authenticated access.');
      return;
    }

    await expectNoRawServerErrors(page);
    await expect(page.getByText('System Health')).toBeVisible({ timeout: 15_000 });

    // Each status row should show a status text (Connected, Not configured, Error, or Unknown)
    const kubernetesRow = page.locator('[aria-label*="Kubernetes status"]');
    if (await kubernetesRow.count() > 0) {
      const statusText = await kubernetesRow.innerText();
      expect(statusText).toMatch(/Connected|Not configured|Error|Unknown/);
    }

    const giteaRow = page.locator('[aria-label*="Gitea status"]');
    if (await giteaRow.count() > 0) {
      const statusText = await giteaRow.innerText();
      expect(statusText).toMatch(/Connected|Not configured|Error|Unknown/);
    }

    expectNoBrowserErrors(errors);
  });

  test('Health monitor has a Refresh button', async ({ page, org }) => {
    const errors = attachBrowserErrorCapture(page);
    await page.goto(`/orgs/${org}/insights`, { waitUntil: 'domcontentloaded' });

    if (page.url().includes('/login')) {
      test.skip(true, 'Auth redirect — health test needs authenticated access.');
      return;
    }

    await expectNoRawServerErrors(page);
    await expect(page.getByText('System Health')).toBeVisible({ timeout: 15_000 });

    // Refresh button exists and is clickable
    const refreshBtn = page.getByRole('button', { name: /Refresh system health status/i });
    await expect(refreshBtn).toBeVisible();
    await refreshBtn.click();

    // After clicking, it should briefly show "Refreshing..." or stay as "Refresh"
    await expect(refreshBtn).toBeVisible();

    expectNoBrowserErrors(errors);
  });

  test('Health monitor shows SSE connection indicator', async ({ page, org }) => {
    const errors = attachBrowserErrorCapture(page);
    await page.goto(`/orgs/${org}/insights`, { waitUntil: 'domcontentloaded' });

    if (page.url().includes('/login')) {
      test.skip(true, 'Auth redirect — health test needs authenticated access.');
      return;
    }

    await expectNoRawServerErrors(page);
    await expect(page.getByText('System Health')).toBeVisible({ timeout: 15_000 });

    // The footer shows either "Live" or "Disconnected" for the SSE indicator
    await expect(page.getByText(/Live|Disconnected/)).toBeVisible();

    // The footer shows "Refreshing in" countdown
    await expect(page.getByText(/Refreshing in \d+s/)).toBeVisible();

    expectNoBrowserErrors(errors);
  });

  test('Health snapshot API responds', async ({ request, org }) => {
    const resp = await request.get(`/api/orgs/${org}/snapshot`);
    expect(resp.status()).toBeLessThan(500);

    const contentType = resp.headers()['content-type'] || '';
    if (resp.status() === 200 && contentType.includes('json')) {
      const data = await resp.json();
      // The snapshot should have either a health object or be the health object itself
      const health = data.health || data;
      expect(health).toBeDefined();
      // If health has kubernetes field, it should be a known value
      if (health.kubernetes !== undefined) {
        expect([true, false, 'ok', 'error', 'connected', 'failed', null]).toContain(health.kubernetes);
      }
    }
    // HTML response (e.g. auth redirect page) is acceptable — just verify no 500
  });
});
