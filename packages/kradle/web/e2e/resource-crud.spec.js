import {
  E2E_PREFIX,
  attachBrowserErrorCapture,
  expect,
  expectNoBrowserErrors,
  expectNoRawServerErrors,
  mutatingStagingEnabled,
  test,
} from './fixtures/kradle-fixtures.js';

function resource(kind, name, spec = {}) {
  return {
    apiVersion: 'kradle.a5c.ai/v1alpha1',
    kind,
    metadata: {
      name,
      labels: { 'kradle.a5c.ai/e2e': E2E_PREFIX },
    },
    spec,
  };
}

async function expectCreateResponse(response, kind, name) {
  expect(response.status(), `${kind}/${name} create status`).toBeLessThan(500);
  expect(response.ok(), `${kind}/${name} create response`).toBe(true);
}

test.describe('Kradle resource CRUD browser flows', () => {
  test.skip(
    !mutatingStagingEnabled(),
    'Set KRADLE_E2E_ENABLE_MUTATING_STAGING=1 with KRADLE_E2E_AUTH_STATE for shared staging CRUD tests, or KRADLE_E2E_ENABLE_MUTATING_LOCAL=1 for local CRUD tests.',
  );

  test('creates, edits, and deletes an agent stack through browser controls', async ({ authenticatedPage, createdResources, org, uniqueName }) => {
    const name = uniqueName('stack');
    const errors = attachBrowserErrorCapture(authenticatedPage);

    await authenticatedPage.goto(`/orgs/${org}/agents/stacks/new`, { waitUntil: 'domcontentloaded' });
    await authenticatedPage.locator('input[placeholder="my-agent-stack"]').fill(name);
    await authenticatedPage.locator('input[placeholder="My Agent Stack"]').fill('Issue 609 E2E Stack');
    await authenticatedPage.locator('textarea[placeholder="Optional task prompt template..."]').fill('Run issue 609 E2E diagnostics.');
    await authenticatedPage.getByRole('button', { name: `Create stack ${name}` }).click();
    await expect(authenticatedPage.getByText(`Stack "${name}" created successfully.`)).toBeVisible();
    createdResources.push({ kind: 'AgentStack', name });

    await authenticatedPage.goto(`/orgs/${org}/agents/stacks/${name}`, { waitUntil: 'domcontentloaded' });
    await authenticatedPage.getByRole('button', { name: `Edit configuration for stack ${name}` }).click();
    await authenticatedPage.getByLabel('Description').fill('Edited by issue 609 Playwright E2E.');
    await authenticatedPage.getByRole('button', { name: `Save changes to stack ${name}` }).click();
    await expect(authenticatedPage.getByText('Saved')).toBeVisible();

    await authenticatedPage.goto(`/orgs/${org}/agents/stacks`, { waitUntil: 'domcontentloaded' });
    await authenticatedPage.getByRole('button', { name: `Delete stack ${name}` }).click();
    await authenticatedPage.getByRole('button', { name: `Confirm delete stack ${name}` }).click();
    await expectNoRawServerErrors(authenticatedPage);
    expectNoBrowserErrors(errors);
  });

  test('creates a trigger rule, toggles it, and deletes it', async ({ authenticatedPage, createResource, createdResources, org, uniqueName }) => {
    const stackName = uniqueName('rule-stack');
    const ruleName = uniqueName('rule');
    const errors = attachBrowserErrorCapture(authenticatedPage);

    await expectCreateResponse(await createResource(resource('AgentStack', stackName, {
      baseAgent: 'codex',
      taskPrompt: 'Issue 609 rule target',
    })), 'AgentStack', stackName);

    await authenticatedPage.goto(`/orgs/${org}/agents/rules/new`, { waitUntil: 'domcontentloaded' });
    await authenticatedPage.getByLabel(/Name/).fill(ruleName);
    await authenticatedPage.getByLabel('manual').check();
    await authenticatedPage.getByLabel(/Target stack/).selectOption(stackName);
    await authenticatedPage.getByLabel(/Repository filter/).fill('issue-609/e2e');
    await authenticatedPage.getByRole('button', { name: 'Create Rule' }).click();
    await expect(authenticatedPage.getByText(`Trigger rule "${ruleName}" created successfully.`)).toBeVisible();
    createdResources.push({ kind: 'AgentTriggerRule', name: ruleName });

    await authenticatedPage.goto(`/orgs/${org}/agents/rules`, { waitUntil: 'domcontentloaded' });
    await authenticatedPage.getByRole('switch', { name: /Disable rule|Enable rule/ }).first().click();
    await authenticatedPage.getByRole('button', { name: 'Delete' }).first().click();
    await authenticatedPage.getByRole('button', { name: 'Confirm delete' }).click();
    await expect(authenticatedPage.getByText('Deleted')).toBeVisible();
    await expectNoRawServerErrors(authenticatedPage);
    expectNoBrowserErrors(errors);
  });

  test('creates a project and opens its kanban board', async ({ authenticatedPage, createdResources, org, uniqueName }) => {
    const projectName = uniqueName('project');
    const errors = attachBrowserErrorCapture(authenticatedPage);

    await authenticatedPage.goto(`/orgs/${org}/agents/projects`, { waitUntil: 'domcontentloaded' });
    const form = authenticatedPage.locator('.managementCard').filter({ hasText: 'Create project' });
    await form.locator('input[name="name"]').fill(projectName);
    await form.locator('input[name="displayName"]').fill('Issue 609 E2E Project');
    await form.locator('input[name="description"]').fill('Browser-created project for issue 609.');
    await form.locator('input[name="workflow"]').fill('todo,in-progress,review,done');
    await form.getByRole('button', { name: 'Create KradleProject' }).click();
    await expect(form.getByRole('status')).toContainText('Project created');
    createdResources.push({ kind: 'KradleProject', name: projectName });

    await authenticatedPage.goto(`/orgs/${org}/agents/projects/${projectName}`, { waitUntil: 'domcontentloaded' });
    await expect(authenticatedPage.getByRole('heading', { name: 'Board' })).toBeVisible();
    await expect(authenticatedPage.getByText(/todo/i)).toBeVisible();
    await expectNoRawServerErrors(authenticatedPage);
    expectNoBrowserErrors(errors);
  });

  test('creates, edits, and deletes a memory repository', async ({ authenticatedPage, createdResources, org, uniqueName }) => {
    const repoName = uniqueName('memory');
    const errors = attachBrowserErrorCapture(authenticatedPage);

    await authenticatedPage.goto(`/orgs/${org}/agents/memory`, { waitUntil: 'domcontentloaded' });
    const form = authenticatedPage.locator('.managementCard').filter({ hasText: 'Add repository' });
    await form.locator('input[name="name"]').fill(repoName);
    await form.locator('input[name="repoUrl"]').fill(`https://github.com/a5c-ai/${repoName}`);
    await form.locator('input[name="description"]').fill('Issue 609 E2E memory repository.');
    await form.getByRole('button', { name: 'Create AgentMemoryRepository' }).click();
    await expect(form.getByRole('status')).toContainText(/Repository added|Added repository/);
    createdResources.push({ kind: 'AgentMemoryRepository', name: repoName });

    await authenticatedPage.goto(`/orgs/${org}/agents/memory`, { waitUntil: 'domcontentloaded' });
    await expect(authenticatedPage.getByText(repoName)).toBeVisible();
    await authenticatedPage.getByRole('button', { name: `Edit memory repository ${repoName}` }).click();
    await authenticatedPage.getByLabel('Description').fill('Edited issue 609 memory repository.');
    await authenticatedPage.getByRole('button', { name: `Save changes to repository ${repoName}` }).click();
    await expect(authenticatedPage.getByText('Saved')).toBeVisible();

    const repoRow = authenticatedPage.locator('.resourceRow').filter({ hasText: repoName });
    await repoRow.getByRole('button', { name: 'Delete' }).click();
    await authenticatedPage.getByRole('dialog', { name: 'Delete resource' }).getByRole('button', { name: 'Delete' }).click();
    await expect(repoRow).not.toBeVisible();
    await expectNoRawServerErrors(authenticatedPage);
    expectNoBrowserErrors(errors);
  });
});
