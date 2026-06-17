import { describe, expect, it } from 'vitest';

import {
  DOCUMENTED_PLUGIN_ID,
  assertInstalledVersion,
  buildDocumentedInstallCommands,
  expectedVersionManifestUrl,
  findInstalledBabysitterPlugin,
  parseManifestPluginVersion,
  resolveChannelRef,
  runDocumentedInstallVerification,
  type DocumentedInstallHarness,
} from './documented-install-runner';

const CHANNEL_MANIFEST = JSON.stringify({
  name: 'a5c.ai',
  plugins: [
    {
      name: 'babysitter',
      source: './',
      version: '5.1.1-staging.4839ab47c625',
    },
  ],
});

function listJson(version: string | undefined, opts: { errors?: string[] } = {}): string {
  const entry: Record<string, unknown> = {
    id: DOCUMENTED_PLUGIN_ID,
    scope: 'user',
    enabled: true,
  };
  if (version !== undefined) entry['version'] = version;
  if (opts.errors) entry['errors'] = opts.errors;
  return JSON.stringify([
    { id: 'atlas@a5c.ai', version: '5.1.1-staging.44749aef05dc', scope: 'user', enabled: true },
    entry,
  ]);
}

describe('documented published install — command building (no execution)', () => {
  it('emits the README claude marketplace add + scope-user install + machine-readable list', () => {
    const commands = buildDocumentedInstallCommands('claude-code', 'staging', { cwd: '/repo' });

    expect(commands).toHaveLength(3);
    expect(commands[0]).toMatchObject({
      command: 'claude',
      args: ['plugin', 'marketplace', 'add', 'a5c-ai/babysitter-claude'],
    });
    expect(commands[1]).toMatchObject({
      command: 'claude',
      args: ['plugin', 'install', '--scope', 'user', DOCUMENTED_PLUGIN_ID],
    });
    expect(commands[2]).toMatchObject({
      command: 'claude',
      args: ['plugin', 'list', '--json'],
    });
    // Must NOT install from local source — that is the BP lane's false-confidence path.
    const flat = commands.flatMap((c) => [c.command, ...c.args]).join(' ');
    expect(flat).not.toContain('./packages/babysitter-sdk');
    expect(flat).not.toContain('adapters install');
    expect(flat).not.toContain('harness:install-plugin');
  });

  it('emits the README codex marketplace add at the channel ref + install + machine-readable list', () => {
    const commands = buildDocumentedInstallCommands('codex', 'staging', { cwd: '/repo' });

    expect(commands).toHaveLength(3);
    expect(commands[0]).toMatchObject({
      command: 'codex',
      args: ['plugin', 'marketplace', 'add', 'a5c-ai/babysitter', '--ref', 'staging', '--sparse', '.agents/plugins'],
    });
    expect(commands[1]).toMatchObject({
      command: 'codex',
      args: ['plugin', 'install', 'babysitter', '--source', 'babysitter'],
    });
    expect(commands[2]).toMatchObject({
      command: 'codex',
      args: ['plugin', 'list', '--json'],
    });
    const flat = commands.flatMap((c) => [c.command, ...c.args]).join(' ');
    expect(flat).not.toContain('./packages/babysitter-sdk');
  });

  it('threads the resolved channel into the codex --ref', () => {
    const commands = buildDocumentedInstallCommands('codex', 'develop', { cwd: '/repo' });
    expect(commands[0]?.args).toContain('--ref');
    expect(commands[0]?.args[commands[0]!.args.indexOf('--ref') + 1]).toBe('develop');
  });
});

describe('documented published install — channel resolution', () => {
  it('maps npm dist-tags to external-repo branches', () => {
    expect(resolveChannelRef({ NPM_TAG: 'staging' })).toBe('staging');
    expect(resolveChannelRef({ NPM_TAG: 'develop' })).toBe('develop');
    expect(resolveChannelRef({ NPM_TAG: 'latest' })).toBe('main');
  });

  it('falls back to the git branch when no tag is provided', () => {
    expect(resolveChannelRef({ GITHUB_REF_NAME: 'staging' })).toBe('staging');
    expect(resolveChannelRef({ GITHUB_REF_NAME: 'main' })).toBe('main');
    expect(resolveChannelRef({ GITHUB_REF_NAME: 'some-feature' })).toBe('staging');
  });

  it('builds the expected-version manifest URL from the channel branch of the external repo', () => {
    expect(expectedVersionManifestUrl('claude-code', 'staging')).toBe(
      'https://raw.githubusercontent.com/a5c-ai/babysitter-claude/staging/.claude-plugin/marketplace.json',
    );
    expect(expectedVersionManifestUrl('codex', 'develop')).toBe(
      'https://raw.githubusercontent.com/a5c-ai/babysitter-codex/develop/.claude-plugin/marketplace.json',
    );
  });
});

describe('documented published install — version assertion', () => {
  it('parses the channel published version from a marketplace manifest', () => {
    expect(parseManifestPluginVersion(CHANNEL_MANIFEST)).toBe('5.1.1-staging.4839ab47c625');
  });

  it('finds the babysitter plugin by id or name in plugin list --json', () => {
    expect(findInstalledBabysitterPlugin(listJson('5.1.1-staging.4839ab47c625'))?.version).toBe('5.1.1-staging.4839ab47c625');
    const byName = JSON.stringify([{ name: 'babysitter', version: '5.1.1-staging.4839ab47c625' }]);
    expect(findInstalledBabysitterPlugin(byName)?.version).toBe('5.1.1-staging.4839ab47c625');
  });

  it('passes when the installed version matches the channel published version', () => {
    const result = assertInstalledVersion(listJson('5.1.1-staging.4839ab47c625'), '5.1.1-staging.4839ab47c625');
    expect(result.ok).toBe(true);
    expect(result.installedVersion).toBe('5.1.1-staging.4839ab47c625');
  });

  it('FAILS when the documented install resolved a stale version (the #960 bug)', () => {
    const result = assertInstalledVersion(listJson('5.0.0'), '5.1.1-staging.4839ab47c625');
    expect(result.ok).toBe(false);
    expect(result.detail).toContain('STALE');
    expect(result.detail).toContain('5.0.0');
    expect(result.detail).toContain('5.1.1-staging.4839ab47c625');
  });

  it('FAILS when the install exited 0 but left the plugin with marketplace errors', () => {
    const result = assertInstalledVersion(
      listJson('5.0.0', { errors: ['Plugin babysitter not found in marketplace a5c.ai'] }),
      '5.1.1-staging.4839ab47c625',
    );
    expect(result.ok).toBe(false);
    expect(result.detail).toContain('marketplace errors');
  });

  it('FAILS when no babysitter plugin is present after install', () => {
    const result = assertInstalledVersion(JSON.stringify([{ id: 'atlas@a5c.ai', version: '1.0.0' }]), '5.1.1-staging.4839ab47c625');
    expect(result.ok).toBe(false);
    expect(result.detail).toContain('no babysitter@a5c.ai plugin');
  });
});

describe('documented published install — gated runner (no execution)', () => {
  const baseOptions = {
    env: { NPM_TAG: 'staging' } as Record<string, string | undefined>,
    cwd: '/repo',
    executeCommand: async () => {
      throw new Error('must not execute commands when live execution is not requested');
    },
    fetchManifest: async () => {
      throw new Error('must not fetch when live execution is not requested');
    },
  };

  for (const harness of ['claude-code', 'codex'] as const) {
    it(`stays a cheap no-op contract check for ${harness} unless live evidence is requested`, async () => {
      const result = await runDocumentedInstallVerification({ harness, ...baseOptions });
      expect(result.status).toBe('failed');
      expect(result.failure).toContain('LIVE_STACK_RUN_MODEL_TESTS=1 is required');
      expect(result.commands.length).toBe(3);
      expect(result.channel).toBe('staging');
    });
  }

  it('executes the documented flow and FAILS on a stale published install when live evidence is requested', async () => {
    const result = await runDocumentedInstallVerification({
      harness: 'claude-code',
      env: { NPM_TAG: 'staging' },
      cwd: '/repo',
      executeLiveProvider: true,
      fetchManifest: async (url) => {
        expect(url).toContain('a5c-ai/babysitter-claude/staging');
        return CHANNEL_MANIFEST; // channel publishes 5.1.1
      },
      executeCommand: async (command) => {
        if (command.args.includes('list')) {
          // documented install resolved the STALE default-branch version
          return { status: 0, stdout: listJson('5.0.0'), stderr: '' };
        }
        return { status: 0, stdout: 'ok', stderr: '' };
      },
    });

    expect(result.status).toBe('failed');
    expect(result.expectedVersion).toBe('5.1.1-staging.4839ab47c625');
    expect(result.installedVersion).toBe('5.0.0');
    expect(result.failure).toContain('STALE');
  });

  it('executes the documented flow and PASSES when the installed version matches the channel', async () => {
    const result = await runDocumentedInstallVerification({
      harness: 'claude-code',
      env: { NPM_TAG: 'staging' },
      cwd: '/repo',
      executeLiveProvider: true,
      fetchManifest: async () => CHANNEL_MANIFEST,
      executeCommand: async (command) => {
        if (command.args.includes('list')) {
          return { status: 0, stdout: listJson('5.1.1-staging.4839ab47c625'), stderr: '' };
        }
        return { status: 0, stdout: 'ok', stderr: '' };
      },
    });

    expect(result.status).toBe('passed');
    expect(result.installedVersion).toBe('5.1.1-staging.4839ab47c625');
    expect(result.failure).toBeUndefined();
  });

  it('FAILS when a documented install command exits non-zero', async () => {
    const result = await runDocumentedInstallVerification({
      harness: 'codex',
      env: { NPM_TAG: 'staging' },
      cwd: '/repo',
      executeLiveProvider: true,
      fetchManifest: async () => CHANNEL_MANIFEST,
      executeCommand: async (command) => {
        if (command.args.includes('add')) return { status: 1, stdout: '', stderr: 'marketplace add failed' };
        return { status: 0, stdout: listJson('5.1.1-staging.4839ab47c625'), stderr: '' };
      },
    });

    expect(result.status).toBe('failed');
    expect(result.failure).toContain('marketplace add failed');
  });
});

/**
 * Live execution: only runs when the published workflow requests live evidence.
 * Mirrors primary-live-runner.test.ts's `executes the primary live provider
 * scenario when explicitly enabled` guard.
 */
describe('documented published install — live execution', () => {
  const harnesses = (process.env['LIVE_STACK_DOCUMENTED_INSTALL_HARNESS']?.split(',').map((h) => h.trim()).filter(Boolean) ??
    ['claude-code', 'codex']) as DocumentedInstallHarness[];

  for (const harness of harnesses) {
    it(`installs the published ${harness} plugin via the documented commands and matches the channel version`, async () => {
      if (process.env['LIVE_STACK_RUN_MODEL_TESTS'] !== '1' || process.env['LIVE_STACK_REQUIRE_EVIDENCE'] !== '1') return;

      const { executeChildProcessCommand } = await import('./primary-live-runner');

      const result = await runDocumentedInstallVerification({
        harness,
        env: process.env,
        cwd: process.cwd(),
        executeLiveProvider: true,
        executeCommand: executeChildProcessCommand,
        fetchManifest: async (url) => {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`fetch ${url} -> HTTP ${response.status}`);
          return await response.text();
        },
        timeoutMs: Number(process.env['LIVE_STACK_COMMAND_TIMEOUT_MS'] ?? 5 * 60 * 1000),
      });

      console.log(`\n[documented-install:${harness}] channel=${result.channel} expected=${result.expectedVersion} installed=${result.installedVersion} status=${result.status}`);
      expect(result.status, result.failure).toBe('passed');
    }, Number(process.env['LIVE_STACK_TEST_TIMEOUT_MS'] ?? 11 * 60 * 1000));
  }
});
