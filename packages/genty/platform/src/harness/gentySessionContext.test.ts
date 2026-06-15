import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

vi.mock('node:os', async () => {
  const actual = await vi.importActual<typeof import('node:os')>('node:os');
  return { ...actual, homedir: () => tempHome };
});

let tempHome: string;

beforeEach(() => {
  tempHome = mkdtempSync(join(tmpdir(), 'genty-ctx-test-'));
});

afterEach(() => {
  rmSync(tempHome, { recursive: true, force: true });
});

describe('GentySessionContext', () => {
  it('creates a session context with all subsystems initialized', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'genty-ws-'));

    try {
      const { createGentySessionContext, destroyGentySessionContext } = await import('./gentySessionContext.js');
      const ctx = await createGentySessionContext({
        workspace,
        sessionId: 'test-session-1',
        model: 'claude-sonnet-4-6',
        provider: 'anthropic',
      });

      expect(ctx.sessionId).toBe('test-session-1');
      expect(ctx.keyPair.publicKey).toContain('BEGIN PUBLIC KEY');
      expect(ctx.extensionRegistry.getExtensionNames()).toHaveLength(0);
      expect(ctx.dynamicContext.providers).toHaveLength(0);
      expect(ctx.steeringQueue.pending).toBe(0);
      expect(ctx.modelSwitch.currentModel).toBe('claude-sonnet-4-6');
      expect(ctx.instructions.agentInstructions).toEqual([]);
      expect(ctx.extensionLoadResult.activated).toEqual([]);

      await destroyGentySessionContext(ctx);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('loads AGENTS.md from workspace', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'genty-ws-'));
    writeFileSync(join(workspace, 'AGENTS.md'), '# Agent Rules\nBe helpful.');

    try {
      const { createGentySessionContext } = await import('./gentySessionContext.js');
      const ctx = await createGentySessionContext({
        workspace,
        sessionId: 'test-session-2',
      });

      expect(ctx.instructions.agentInstructions.length).toBeGreaterThan(0);
      expect(ctx.instructions.agentInstructions.some(i => i.includes('Be helpful'))).toBe(true);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('persists key across multiple context creations', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'genty-ws-'));

    try {
      const { createGentySessionContext } = await import('./gentySessionContext.js');

      const ctx1 = await createGentySessionContext({
        workspace,
        sessionId: 'persist-test',
        agentId: 'reusable-agent',
      });

      const ctx2 = await createGentySessionContext({
        workspace,
        sessionId: 'persist-test-2',
        agentId: 'reusable-agent',
      });

      expect(ctx2.keyPair.fingerprint).toBe(ctx1.keyPair.fingerprint);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });

  it('skips extension loading in isolated mode', async () => {
    const workspace = mkdtempSync(join(tmpdir(), 'genty-ws-'));

    // Create a fake extension
    const extDir = join(tempHome, '.genty', 'extensions', 'test-ext');
    mkdirSync(extDir, { recursive: true });
    writeFileSync(join(extDir, 'package.json'), JSON.stringify({
      name: 'test-ext', version: '1.0.0', main: 'index.js',
    }));
    writeFileSync(join(extDir, 'index.js'), 'module.exports = { name: "test-ext", activate() {} }');

    try {
      const { createGentySessionContext } = await import('./gentySessionContext.js');

      const ctx = await createGentySessionContext({
        workspace,
        sessionId: 'isolated-test',
        isolated: true,
      });

      expect(ctx.extensionLoadResult.activated).toEqual([]);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
  });
});
