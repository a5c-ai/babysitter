/**
 * Tests for BaseAgentAdapter install/update/detectInstallation defaults
 * and per-adapter overrides (claude, gemini, cursor, agent-mux-remote).
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { Spawner } from '@a5c-ai/agent-mux-comm';

import {
  ClaudeAdapter,
  CodexAdapter,
  GeminiAdapter,
  CursorAdapter,
  AgentMuxRemoteAdapter,
} from '../src/index.js';

interface Call { cmd: string; args: string[] }

function spawnerFrom(
  fn: (cmd: string, args: string[]) => { code: number; stdout: string; stderr: string },
): { spawner: Spawner; calls: Call[] } {
  const calls: Call[] = [];
  const spawner: Spawner = async (cmd, args) => {
    calls.push({ cmd, args });
    return fn(cmd, args);
  };
  return { spawner, calls };
}

// ---------------------------------------------------------------------------
// detectInstallation (base default)
// ---------------------------------------------------------------------------

describe('BaseAgentAdapter.detectInstallation (default)', () => {
  it('returns installed=false when `which`/`where` fails', async () => {
    const adapter = new CodexAdapter();
    const { spawner } = spawnerFrom(() => ({ code: 1, stdout: '', stderr: 'not found' }));
    adapter.setSpawner(spawner);
    const res = await adapter.detectInstallation();
    expect(res.installed).toBe(false);
    expect(res.version).toBeUndefined();
  });

  it('returns installed=true + version when which + --version succeed', async () => {
    const adapter = new CodexAdapter();
    const { spawner } = spawnerFrom((cmd, args) => {
      if (cmd === 'which' || cmd === 'where') return { code: 0, stdout: '/usr/local/bin/codex\n', stderr: '' };
      if (args.includes('--version')) return { code: 0, stdout: 'codex 1.4.2', stderr: '' };
      return { code: 1, stdout: '', stderr: '' };
    });
    adapter.setSpawner(spawner);
    const res = await adapter.detectInstallation();
    expect(res.installed).toBe(true);
    expect(res.path).toContain('codex');
    expect(res.version).toBe('1.4.2');
  });

  it('still reports installed=true when --version output has no semver', async () => {
    const adapter = new CodexAdapter();
    const { spawner } = spawnerFrom((cmd) => {
      if (cmd === 'which' || cmd === 'where') return { code: 0, stdout: 'C:\\tools\\codex.exe\n', stderr: '' };
      return { code: 0, stdout: 'unknown', stderr: '' };
    });
    adapter.setSpawner(spawner);
    const res = await adapter.detectInstallation();
    expect(res.installed).toBe(true);
    expect(res.version).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// install (base default)
// ---------------------------------------------------------------------------

describe('BaseAgentAdapter.install (default)', () => {
  it('dry-run returns the planned command without executing', async () => {
    const adapter = new CodexAdapter();
    const { spawner, calls } = spawnerFrom(() => ({ code: 0, stdout: '', stderr: '' }));
    adapter.setSpawner(spawner);
    const res = await adapter.install({ dryRun: true });
    expect(res.ok).toBe(true);
    expect(res.command).toMatch(/npm install -g/);
    expect(calls.length).toBe(0);
  });

  it('already-installed short-circuits without spawning install', async () => {
    const adapter = new CodexAdapter();
    const { spawner, calls } = spawnerFrom((cmd, args) => {
      if (cmd === 'which' || cmd === 'where') return { code: 0, stdout: '/usr/bin/codex\n', stderr: '' };
      if (args.includes('--version')) return { code: 0, stdout: '1.0.0', stderr: '' };
      return { code: 0, stdout: '', stderr: '' };
    });
    adapter.setSpawner(spawner);
    const res = await adapter.install();
    expect(res.ok).toBe(true);
    expect(res.method).toBe('already-installed');
    expect(calls.find((c) => c.cmd === 'npm')).toBeUndefined();
  });

  it('success path: spawns npm install then re-detects', async () => {
    const adapter = new CodexAdapter();
    let installed = false;
    const { spawner, calls } = spawnerFrom((cmd, args) => {
      if (cmd === 'which' || cmd === 'where') {
        return installed
          ? { code: 0, stdout: '/usr/bin/codex\n', stderr: '' }
          : { code: 1, stdout: '', stderr: '' };
      }
      if (cmd === 'npm' && args[0] === 'install') {
        installed = true;
        return { code: 0, stdout: 'added 1 package', stderr: '' };
      }
      if (args.includes('--version')) return { code: 0, stdout: '2.0.0', stderr: '' };
      return { code: 0, stdout: '', stderr: '' };
    });
    adapter.setSpawner(spawner);
    const res = await adapter.install();
    expect(res.ok).toBe(true);
    expect(res.method).toBe('npm');
    expect(res.installedVersion).toBe('2.0.0');
    expect(calls.find((c) => c.cmd === 'npm')).toBeDefined();
  });

  it('propagates non-zero exit as ok=false', async () => {
    const adapter = new CodexAdapter();
    const { spawner } = spawnerFrom((cmd) => {
      if (cmd === 'which' || cmd === 'where') return { code: 1, stdout: '', stderr: '' };
      if (cmd === 'npm') return { code: 2, stdout: '', stderr: 'npm ERR!' };
      return { code: 0, stdout: '', stderr: '' };
    });
    adapter.setSpawner(spawner);
    const res = await adapter.install();
    expect(res.ok).toBe(false);
    expect(res.stderr).toContain('npm ERR!');
  });

  it('applies --version flag to npm package tail', async () => {
    const adapter = new CodexAdapter();
    const { spawner } = spawnerFrom(() => ({ code: 0, stdout: '', stderr: '' }));
    adapter.setSpawner(spawner);
    const res = await adapter.install({ dryRun: true, version: '3.1.0' });
    expect(res.command).toMatch(/@3\.1\.0$/);
  });

  it('installs Gemini CLI via npm without version pin by default', async () => {
    const adapter = new GeminiAdapter();
    const { spawner, calls } = spawnerFrom(() => ({ code: 0, stdout: '', stderr: '' }));
    adapter.setSpawner(spawner);

    const res = await adapter.install({ dryRun: true });

    expect(res.command).toContain('npm install -g @google/gemini-cli');
    expect(calls.length).toBe(0);
  });

  it('does not double-pin Gemini CLI when an explicit version is requested', async () => {
    const adapter = new GeminiAdapter();
    const { spawner } = spawnerFrom(() => ({ code: 0, stdout: '', stderr: '' }));
    adapter.setSpawner(spawner);

    const res = await adapter.install({ dryRun: true, version: '0.43.0' });

    expect(res.command).toContain('npm install -g @google/gemini-cli');
  });

  it('cursor install resolves curl install (not manual)', async () => {
    const adapter = new CursorAdapter();
    let installed = false;
    const { spawner, calls } = spawnerFrom((cmd, args) => {
      if (cmd === 'which' || cmd === 'where') {
        return installed
          ? { code: 0, stdout: '/usr/bin/cursor-agent\n', stderr: '' }
          : { code: 1, stdout: '', stderr: '' };
      }
      // The curl|bash command is wrapped as sh -c "..." (or cmd /c "..." on Windows)
      if (cmd === 'sh' || cmd === 'cmd') {
        installed = true;
        return { code: 0, stdout: 'installed cursor', stderr: '' };
      }
      if (args.includes('--version')) return { code: 0, stdout: '1.0.0', stderr: '' };
      return { code: 0, stdout: '', stderr: '' };
    });
    adapter.setSpawner(spawner);
    const res = await adapter.install({ force: true });
    expect(res.ok).toBe(true);
    expect(res.method).toBe('curl');
    // Piped commands (curl ... | bash) are wrapped in sh -c / cmd /c
    const shellCall = calls.find(c => c.cmd === 'sh' || c.cmd === 'cmd');
    expect(shellCall).toBeDefined();
    expect(shellCall!.args.join(' ')).toContain('curl');
  });
});

// ---------------------------------------------------------------------------
// update (base default)
// ---------------------------------------------------------------------------

describe('BaseAgentAdapter.update (default)', () => {
  it('derives `npm update -g <pkg>` from an npm install method', async () => {
    const adapter = new CodexAdapter();
    const { spawner, calls } = spawnerFrom((_cmd, _args) => ({ code: 0, stdout: '', stderr: '' }));
    adapter.setSpawner(spawner);
    const res = await adapter.update();
    expect(res.ok).toBe(true);
    expect(res.command).toMatch(/^npm update -g /);
    const call = calls.find((c) => c.cmd === 'npm' && c.args[0] === 'update');
    expect(call).toBeDefined();
  });

  it('dry-run prints plan only', async () => {
    const adapter = new CodexAdapter();
    const { spawner, calls } = spawnerFrom(() => ({ code: 0, stdout: '', stderr: '' }));
    adapter.setSpawner(spawner);
    const res = await adapter.update({ dryRun: true });
    expect(res.ok).toBe(true);
    expect(calls.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// ClaudeAdapter override: ~/.claude config dir probe
// ---------------------------------------------------------------------------

describe('ClaudeAdapter.detectInstallation override', () => {
  it('attaches a notes field mentioning ~/.claude', async () => {
    const adapter = new ClaudeAdapter();
    const { spawner } = spawnerFrom(() => ({ code: 1, stdout: '', stderr: '' }));
    adapter.setSpawner(spawner);
    const res = await adapter.detectInstallation();
    expect(res.notes).toBeDefined();
    expect(res.notes!.toLowerCase()).toContain('.claude');
  });
});

// ---------------------------------------------------------------------------
// GeminiAdapter override: parseVersionOutput tolerates "gemini-cli/0.4.2"
// ---------------------------------------------------------------------------

describe('GeminiAdapter.parseVersionOutput override', () => {
  it('parses "gemini-cli/0.4.2"', async () => {
    const adapter = new GeminiAdapter();
    const { spawner } = spawnerFrom((cmd, args) => {
      if (cmd === 'which' || cmd === 'where') return { code: 0, stdout: '/usr/bin/gemini\n', stderr: '' };
      if (args.includes('--version')) return { code: 0, stdout: 'gemini-cli/0.4.2', stderr: '' };
      return { code: 1, stdout: '', stderr: '' };
    });
    adapter.setSpawner(spawner);
    const res = await adapter.detectInstallation();
    expect(res.installed).toBe(true);
    expect(res.version).toBe('0.4.2');
  });
});

// ---------------------------------------------------------------------------
// CursorAdapter: install/update use standard base logic (curl installer)
// ---------------------------------------------------------------------------

describe('CursorAdapter install/update (standard base adapter logic)', () => {
  it('install resolves a curl command for cursor via shell wrapper', async () => {
    const adapter = new CursorAdapter();
    const { spawner, calls } = spawnerFrom((cmd, args) => {
      // Piped commands are wrapped: sh -c "curl ... | bash"
      if (cmd === 'sh' || cmd === 'cmd') return { code: 0, stdout: '', stderr: '' };
      if (args?.includes('--version')) return { code: 0, stdout: '1.0.0', stderr: '' };
      return { code: 0, stdout: '', stderr: '' };
    });
    adapter.setSpawner(spawner);
    const res = await adapter.install();
    expect(res.ok).toBe(true);
    const shellCall = calls.find(c => c.cmd === 'sh' || c.cmd === 'cmd');
    expect(shellCall).toBeDefined();
    expect(shellCall!.args.join(' ')).toContain('curl');
    expect(shellCall!.args.join(' ')).toContain('bash');
  });

  it('update re-runs the curl installer for cursor via shell wrapper', async () => {
    const adapter = new CursorAdapter();
    const { spawner, calls } = spawnerFrom((cmd, args) => {
      if (cmd === 'sh' || cmd === 'cmd') return { code: 0, stdout: '', stderr: '' };
      if (args?.includes('--version')) return { code: 0, stdout: '1.0.0', stderr: '' };
      return { code: 0, stdout: '', stderr: '' };
    });
    adapter.setSpawner(spawner);
    const res = await adapter.update();
    expect(res.ok).toBe(true);
    const shellCall = calls.find(c => c.cmd === 'sh' || c.cmd === 'cmd');
    expect(shellCall).toBeDefined();
    expect(shellCall!.args.join(' ')).toContain('curl');
  });
});

// ---------------------------------------------------------------------------
// AgentMuxRemoteAdapter overrides: SSH-based detect/install/update
// ---------------------------------------------------------------------------

describe('AgentMuxRemoteAdapter transport-agnostic overrides', () => {
  it('detectInstallation probes plain `amux --version` via the spawner', async () => {
    const adapter = new AgentMuxRemoteAdapter();
    const { spawner, calls } = spawnerFrom((cmd, args) => {
      if (cmd === 'amux' && args.includes('--version')) return { code: 0, stdout: '0.1.0', stderr: '' };
      return { code: 1, stdout: '', stderr: '' };
    });
    adapter.setSpawner(spawner);
    const res = await adapter.detectInstallation();
    expect(res.installed).toBe(true);
    expect(res.version).toBe('0.1.0');
    expect(calls[0]!.cmd).toBe('amux');
    expect(calls[0]!.args).toContain('--version');
  });

  it('detectInstallation reports not installed when the spawner returns non-zero', async () => {
    const adapter = new AgentMuxRemoteAdapter();
    const { spawner } = spawnerFrom(() => ({ code: 127, stdout: '', stderr: 'not found' }));
    adapter.setSpawner(spawner);
    const res = await adapter.detectInstallation();
    expect(res.installed).toBe(false);
  });

  it('install dry-run returns the plain npm install command without running it', async () => {
    const adapter = new AgentMuxRemoteAdapter();
    const { spawner, calls } = spawnerFrom(() => ({ code: 0, stdout: '', stderr: '' }));
    adapter.setSpawner(spawner);
    const res = await adapter.install({ dryRun: true });
    expect(res.ok).toBe(true);
    expect(res.command).toBe('npm install -g @a5c-ai/agent-mux-cli');
    expect(calls.length).toBe(0);
  });

  it('install spawns plain `npm install -g <pkg>` (ssh wrapping is external)', async () => {
    const adapter = new AgentMuxRemoteAdapter();
    const { spawner, calls } = spawnerFrom(() => ({ code: 0, stdout: 'ok', stderr: '' }));
    adapter.setSpawner(spawner);
    const res = await adapter.install();
    expect(res.ok).toBe(true);
    const call = calls.find((c) => c.cmd === 'npm');
    expect(call).toBeDefined();
    expect(call!.args).toEqual(['install', '-g', '@a5c-ai/agent-mux-cli']);
  });

  it('update spawns plain `npm update -g <pkg>`', async () => {
    const adapter = new AgentMuxRemoteAdapter();
    const { spawner, calls } = spawnerFrom(() => ({ code: 0, stdout: 'ok', stderr: '' }));
    adapter.setSpawner(spawner);
    const res = await adapter.update();
    expect(res.ok).toBe(true);
    const call = calls.find((c) => c.cmd === 'npm');
    expect(call!.args).toEqual(['update', '-g', '@a5c-ai/agent-mux-cli']);
  });
});
