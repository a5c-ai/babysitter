import {
  attachBrowserErrorCapture,
  expect,
  expectNoBrowserErrors,
  expectNoRawServerErrors,
  hasUsableAuthFixture,
  serviceFlowsEnabled,
  test,
} from './fixtures/kradle-fixtures.js';

test.describe('Issue #608 service-backed Kradle flows', () => {
  test.skip(
    !serviceFlowsEnabled(),
    'Requires #608 staging services and KRADLE_E2E_ENABLE_SERVICE_FLOWS=1 for real assistant, playground, and agent dispatch/session flows.',
  );

  test('assistant chat sends a real message when #608 services are enabled', async ({ authenticatedPage, org }) => {
    test.skip(!hasUsableAuthFixture(), 'Requires authenticated browser state for assistant chat.');
    const errors = attachBrowserErrorCapture(authenticatedPage);

    await authenticatedPage.goto(`/orgs/${org}/assistant`, { waitUntil: 'domcontentloaded' });
    await authenticatedPage.getByLabel('Chat message input').fill('Reply with the word ready.');
    await authenticatedPage.getByRole('button', { name: /Send/i }).click();
    await expect(authenticatedPage.getByLabel('Chat messages')).toContainText(/ready/i, { timeout: 30_000 });
    await expectNoRawServerErrors(authenticatedPage);
    expectNoBrowserErrors(errors);
  });

  test('playground can compare model responses when #608 services are enabled', async ({ authenticatedPage, org }) => {
    test.skip(!hasUsableAuthFixture(), 'Requires authenticated browser state for playground model calls.');
    const errors = attachBrowserErrorCapture(authenticatedPage);

    await authenticatedPage.goto(`/orgs/${org}/playground`, { waitUntil: 'domcontentloaded' });
    await expect(authenticatedPage.getByRole('heading', { name: /Playground/i })).toBeVisible();
    await expect(authenticatedPage.locator('textarea, [contenteditable="true"]').first()).toBeVisible();
    await expectNoRawServerErrors(authenticatedPage);
    expectNoBrowserErrors(errors);
  });

  test('agent dispatch produces run/session/transcript evidence when #608 services are enabled', async ({ authenticatedPage, org }) => {
    test.skip(!hasUsableAuthFixture(), 'Requires authenticated browser state for agent dispatch.');
    const errors = attachBrowserErrorCapture(authenticatedPage);

    await authenticatedPage.goto(`/orgs/${org}/agents/stacks`, { waitUntil: 'domcontentloaded' });
    await authenticatedPage.getByRole('button', { name: /Dispatch stack/i }).first().click();
    await expect(authenticatedPage.getByText(/Dispatched|Dispatch failed/)).toBeVisible({ timeout: 15_000 });
    await authenticatedPage.goto(`/orgs/${org}/agents/runs`, { waitUntil: 'domcontentloaded' });
    await expect(authenticatedPage.getByRole('heading', { name: /Dispatch runs/i })).toBeVisible();
    await authenticatedPage.goto(`/orgs/${org}/agents/sessions`, { waitUntil: 'domcontentloaded' });
    await expect(authenticatedPage.getByRole('heading', { name: /Agent chat sessions/i })).toBeVisible();
    await expectNoRawServerErrors(authenticatedPage);
    expectNoBrowserErrors(errors);
  });

});

test('documents the default #608 skip mode for service tests', async () => {
  test.skip(serviceFlowsEnabled(), 'Service flows are enabled; real service-backed tests run instead.');
  expect(serviceFlowsEnabled()).toBe(false);
});
