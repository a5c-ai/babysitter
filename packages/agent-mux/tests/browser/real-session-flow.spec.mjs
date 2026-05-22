import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { test, expect } from '@playwright/test';

import { createGateway, MemoryTokenStore } from '../../gateway/dist/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const webuiRoot = path.join(repoRoot, 'webui', 'dist');
const enabled = process.env['AGENT_MUX_REAL_BROWSER_E2E'] === '1';
const agents = (
  process.env['AGENT_MUX_REAL_BROWSER_E2E_AGENTS']
  ?? process.env['AGENT_MUX_REAL_BROWSER_E2E_AGENT']
  ?? 'claude-agent-sdk'
)
  .split(',')
  .map((value) => value.trim())
  .filter(Boolean);
for (const agent of agents) {
  test(`real browser session flow: ${agent}`, async ({ page }) => {
    test.skip(!enabled, 'Set AGENT_MUX_REAL_BROWSER_E2E=1 to run against installed real harnesses.');

    const tokenStore = new MemoryTokenStore();
    const gateway = createGateway({
      host: '127.0.0.1',
      port: 0,
      tokenStore,
      tokenStoreKind: 'memory',
      enableWebui: true,
      webuiRoot,
      shutdownGraceMs: 1000,
    });

    await gateway.start();
    const token = await tokenStore.create({ name: `browser-e2e-${agent}` });
    const baseUrl = `http://127.0.0.1:${gateway.server.address.port}`;

    try {
      const agentsResponse = await fetch(`${baseUrl}/api/v1/agents`, {
        headers: {
          authorization: `Bearer ${token.plaintext}`,
        },
      });
      expect(agentsResponse.ok).toBeTruthy();
      const agentsBody = await agentsResponse.json();
      const availableAgents = Array.isArray(agentsBody.agents) ? agentsBody.agents.map(String) : [];
      const agentDescriptor = Array.isArray(agentsBody.agentDescriptors)
        ? agentsBody.agentDescriptors.find((entry) => String(entry.agent ?? '') === agent)
        : null;
      test.skip(!availableAgents.includes(agent), `${agent} is not available from this gateway instance.`);

      const expectedReply = `BROWSER_E2E_OK_${agent.replace(/[^a-z0-9]+/gi, '_').toUpperCase()}`;
      const expectedFollowup = `BROWSER_E2E_FOLLOWUP_${agent.replace(/[^a-z0-9]+/gi, '_').toUpperCase()}`;
      const sessionTransport = String(agentDescriptor?.structuredSessionTransport ?? 'none');
      const supportsInteractiveMode = agentDescriptor?.supportsInteractiveMode === true;

      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await page.getByLabel('Gateway URL').fill(baseUrl);
      await page.getByLabel('Bearer token').fill(token.plaintext);
      await page.getByRole('button', { name: 'Connect' }).click();

      await expect(page.getByRole('heading', { name: 'Sessions are the product. Live processes are just the current execution state.' })).toBeVisible();
      await page.goto(`${baseUrl}/sessions/new`, { waitUntil: 'domcontentloaded' });

      await page.locator('select').selectOption(agent);
      await page.getByLabel('Prompt').fill(`Reply with the exact text ${expectedReply} and nothing else.`);
      await page.getByRole('button', { name: 'Start session' }).click();

      await page.waitForURL(/\/sessions\/(pending\/[^/]+|[^/]+)$/, { timeout: 30_000 });
      if (/\/sessions\/pending\//.test(page.url())) {
        await page.waitForURL(/\/sessions\/[^/]+$/, { timeout: 30_000 });
      }

      await expect(page.getByText('Reply with the exact text', { exact: false })).toBeVisible();
      await expect(page.getByText('Session Chat')).toBeVisible();
      await expect(page.getByText('thinking')).toBeVisible();
      await expect(page.getByText(expectedReply, { exact: true }).first()).toBeVisible({ timeout: 60_000 });
      await expect(page.getByText(/\$\d/)).toBeVisible({ timeout: 60_000 });

      const sessionId = page.url().split('/').at(-1);
      expect(sessionId).toBeTruthy();

      const composer = page.locator('.composer textarea');
      await expect(composer).toBeEnabled({ timeout: sessionTransport === 'persistent' || supportsInteractiveMode ? 90_000 : 30_000 });
      await composer.fill(`Reply with the exact text ${expectedFollowup} and nothing else.`);
      await page.getByRole('button', { name: 'Continue session' }).click();
      await expect(page.getByText(expectedFollowup, { exact: true }).first()).toBeVisible({ timeout: 90_000 });

      const sessionResponse = await fetch(`${baseUrl}/api/v1/sessions/${encodeURIComponent(sessionId)}`, {
        headers: {
          authorization: `Bearer ${token.plaintext}`,
        },
        signal: AbortSignal.timeout(10_000),
      });
      expect(sessionResponse.ok).toBeTruthy();
      const sessionBody = await sessionResponse.json();
      const activeRunId = sessionBody && typeof sessionBody.activeRunId === 'string'
        ? sessionBody.activeRunId
        : null;
      if (activeRunId) {
        const stopResponse = await fetch(`${baseUrl}/api/v1/runs/${encodeURIComponent(activeRunId)}/stop`, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${token.plaintext}`,
          },
          signal: AbortSignal.timeout(10_000),
        });
        expect(stopResponse.ok).toBeTruthy();
      }
    } finally {
      await Promise.race([
        gateway.stop(),
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);
    }
  });
}
