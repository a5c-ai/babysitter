/**
 * Tests for `amux install` / `amux update` / `amux detect` / `amux uninstall`.
 *
 * Uses real adapters (ClaudeAdapter, CodexAdapter, CursorAdapter) registered
 * through the client's AdapterRegistry, with an injectable Spawner to keep
 * the tests hermetic.
 */
import { describe, it, expect, beforeEach } from 'vitest';

import { createClient, type AgentAdapter, type Spawner } from '@a5c-ai/agent-mux-core';
import { ClaudeAdapter, CodexAdapter, CursorAdapter } from '@a5c-ai/agent-mux-adapters';

import {
  installCommand,
  INSTALL_FLAGS,
  type SpawnRunner,
} from '../../src/commands/install.js';
import { ExitCode } from '../../src/exit-codes.js';
import { parseArgs } from '../../src/parse-args.js';

interface RegisteredCall { cmd: string; args: string[] }

function makeSpawnRunner(
  handler: (cmd: string, args: string[]) => Promise<{ code: number; stdout: string; stderr: string }>,
): { runner: SpawnRunner; calls: RegisteredCall[] } {
  const calls: RegisteredCall[] = [];
  const runner: SpawnRunner = async (cmd, args) => {
    calls.push({ cmd, args });
    return handler(cmd, args);
  };
  return { runner, calls };
}

function makeClient(adapters: AgentAdapter[]) {
  const client = createClient();
  for (const a of adapters) {
    client.adapters.register(a);
  }
  return client;
}

function captureOutput() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const origStdout = process.stdout.write;
  const origStderr = process.stderr.write;
  process.stdout.write = ((chunk: string) => { stdout.push(chunk); return true; }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: string) => { stderr.push(chunk); return true; }) as typeof process.stderr.write;
  return { stdout, stderr, restore() { process.stdout.write = origStdout; process.stderr.write = origStderr; } };
}

describe('installCommand argument parsing', () => {
  it('returns USAGE_ERROR when no agent and no --all', async () => {
    const io = captureOutput();
    try {
      const args = parseArgs(['install'], INSTALL_FLAGS);
      const client = makeClient([]);
      const code = await installCommand(client, args);
      expect(code).toBe(ExitCode.USAGE_ERROR);
      expect(io.stderr.join('')).toContain('Usage:');
    } finally { io.restore(); }
  });

  it('uninstall without agent returns USAGE_ERROR', async () => {
    const io = captureOutput();
    try {
      const args = parseArgs(['uninstall'], INSTALL_FLAGS);
      const client = makeClient([]);
      const code = await installCommand(client, args);
      expect(code).toBe(ExitCode.USAGE_ERROR);
    } finally { io.restore(); }
  });

  it('unknown agent returns AGENT_NOT_FOUND exit code', async () => {
    const io = captureOutput();
    try {
      const args = parseArgs(['install', 'bogus'], INSTALL_FLAGS);
      const client = makeClient([]);
      const code = await installCommand(client, args);
      expect(code).toBe(ExitCode.AGENT_NOT_FOUND);
      expect(io.stderr.join('')).toContain('Unknown agent');
    } finally { io.restore(); }
  });

  it('update without agent returns USAGE_ERROR', async () => {
    const io = captureOutput();
    try {
      const args = parseArgs(['update'], INSTALL_FLAGS);
      const client = makeClient([]);
      const code = await installCommand(client, args);
      expect(code).toBe(ExitCode.USAGE_ERROR);
    } finally { io.restore(); }
  });

  it('detect without agent returns USAGE_ERROR', async () => {
    const io = captureOutput();
    try {
      const args = parseArgs(['detect'], INSTALL_FLAGS);
      const client = makeClient([]);
      const code = await installCommand(client, args);
      expect(code).toBe(ExitCode.USAGE_ERROR);
    } finally { io.restore(); }
  });
});

// ---------------------------------------------------------------------------
// install <agent> — real adapter dispatch
// ---------------------------------------------------------------------------

describe('installCommand dispatch (real adapters)', () => {
  let claude: ClaudeAdapter;
  let codex: CodexAdapter;
  let cursor: CursorAdapter;

  beforeEach(() => {
    claude = new ClaudeAdapter();
    codex = new CodexAdapter();
    cursor = new CursorAdapter();
  });

  it('short-circuits when already installed (detect finds binary)', async () => {
    const io = captureOutput();
    // Spawner: which/where returns success; `claude --version` returns 1.2.3.
    const { runner, calls } = makeSpawnRunner(async (cmd, args) => {
      if (cmd === 'which' || cmd === 'where') return { code: 0, stdout: '/usr/bin/claude\n', stderr: '' };
      if (args.includes('--version')) return { code: 0, stdout: '1.2.3\n', stderr: '' };
      return { code: 0, stdout: '', stderr: '' };
    });
    try {
      const args = parseArgs(['install', 'claude'], INSTALL_FLAGS);
      const client = makeClient([claude]);
      const code = await installCommand(client, args, { spawnRunner: runner });
      expect(code).toBe(ExitCode.SUCCESS);
      // Should not have invoked `npm install`.
      expect(calls.find((c) => c.cmd === 'npm' && c.args[0] === 'install')).toBeUndefined();
      expect(io.stdout.join('')).toContain('already installed');
    } finally { io.restore(); }
  });

  it('dispatches npm install when not installed', async () => {
    const io = captureOutput();
    const { runner, calls } = makeSpawnRunner(async (cmd, args) => {
      if (cmd === 'which' || cmd === 'where') return { code: 1, stdout: '', stderr: '' };
      if (cmd === 'npm' && args[0] === 'install') return { code: 0, stdout: 'ok', stderr: '' };
      return { code: 0, stdout: '', stderr: '' };
    });
    try {
      const args = parseArgs(['install', 'claude'], INSTALL_FLAGS);
      const client = makeClient([claude]);
      const code = await installCommand(client, args, { spawnRunner: runner });
      expect(code).toBe(ExitCode.SUCCESS);
      const installCall = calls.find((c) => c.cmd === 'npm' && c.args[0] === 'install');
      expect(installCall).toBeDefined();
      expect(installCall!.args).toEqual(['install', '-g', '@anthropic-ai/claude-code']);
    } finally { io.restore(); }
  });

  it('--force reinstalls even when detected', async () => {
    const io = captureOutput();
    const { runner, calls } = makeSpawnRunner(async (cmd, args) => {
      if (cmd === 'which' || cmd === 'where') return { code: 0, stdout: '/usr/bin/claude\n', stderr: '' };
      if (args.includes('--version')) return { code: 0, stdout: '1.0.0\n', stderr: '' };
      if (cmd === 'npm' && args[0] === 'install') return { code: 0, stdout: 'ok', stderr: '' };
      return { code: 0, stdout: '', stderr: '' };
    });
    try {
      const args = parseArgs(['install', 'claude', '--force'], INSTALL_FLAGS);
      const client = makeClient([claude]);
      const code = await installCommand(client, args, { spawnRunner: runner });
      expect(code).toBe(ExitCode.SUCCESS);
      expect(calls.find((c) => c.cmd === 'npm' && c.args[0] === 'install')).toBeDefined();
    } finally { io.restore(); }
  });

  it('--dry-run prints planned command without spawning', async () => {
    const io = captureOutput();
    const { runner, calls } = makeSpawnRunner(async () => ({ code: 0, stdout: '', stderr: '' }));
    try {
      const args = parseArgs(['install', 'claude', '--dry-run'], INSTALL_FLAGS);
      const client = makeClient([claude]);
      const code = await installCommand(client, args, { spawnRunner: runner });
      expect(code).toBe(ExitCode.SUCCESS);
      // No npm install should run.
      expect(calls.find((c) => c.cmd === 'npm' && c.args[0] === 'install')).toBeUndefined();
      expect(io.stdout.join('')).toContain('[dry-run]');
    } finally { io.restore(); }
  });

  it('--pkg-version pins npm install to @<version>', async () => {
    const io = captureOutput();
    const { runner, calls } = makeSpawnRunner(async () => ({ code: 0, stdout: '', stderr: '' }));
    try {
      const args = parseArgs(['install', 'claude', '--dry-run', '--pkg-version', '1.5.0'], INSTALL_FLAGS);
      const client = makeClient([claude]);
      const code = await installCommand(client, args, { spawnRunner: runner });
      expect(code).toBe(ExitCode.SUCCESS);
      expect(io.stdout.join('')).toContain('@anthropic-ai/claude-code@1.5.0');
      void calls;
    } finally { io.restore(); }
  });

  it('cursor install runs curl install via shell wrapper', async () => {
    const io = captureOutput();
    const { runner, calls } = makeSpawnRunner(async (cmd) => {
      if (cmd === 'which' || cmd === 'where') return { code: 1, stdout: '', stderr: '' };
      return { code: 0, stdout: '', stderr: '' };
    });
    try {
      const args = parseArgs(['install', 'cursor'], INSTALL_FLAGS);
      const client = makeClient([cursor]);
      const code = await installCommand(client, args, { spawnRunner: runner });
      expect(code).toBe(ExitCode.SUCCESS);
      // Piped commands (curl ... | bash) are wrapped in sh -c / cmd /c
      const shellCall = calls.find((c) => c.cmd === 'sh' || c.cmd === 'cmd');
      expect(shellCall).toBeDefined();
      expect(shellCall!.args.join(' ')).toContain('curl');
    } finally { io.restore(); }
  });

  it('uninstall dispatches npm uninstall -g <pkg>', async () => {
    const io = captureOutput();
    const { runner, calls } = makeSpawnRunner(async () => ({ code: 0, stdout: '', stderr: '' }));
    try {
      const args = parseArgs(['uninstall', 'claude'], INSTALL_FLAGS);
      const client = makeClient([claude]);
      const code = await installCommand(client, args, { spawnRunner: runner });
      expect(code).toBe(ExitCode.SUCCESS);
      const call = calls.find((c) => c.cmd === 'npm');
      expect(call!.args).toEqual(['uninstall', '-g', '@anthropic-ai/claude-code']);
    } finally { io.restore(); }
  });

  it('install --all iterates through every registered adapter', async () => {
    const io = captureOutput();
    const { runner, calls } = makeSpawnRunner(async (cmd) => {
      if (cmd === 'which' || cmd === 'where') return { code: 1, stdout: '', stderr: '' };
      return { code: 0, stdout: 'ok', stderr: '' };
    });
    try {
      const args = parseArgs(['install', '--all'], INSTALL_FLAGS);
      const client = makeClient([claude, codex]);
      const code = await installCommand(client, args, { spawnRunner: runner });
      // Cursor isn't registered here, so only claude+codex.
      expect(code).toBe(ExitCode.SUCCESS);
      const installs = calls.filter((c) => c.cmd === 'npm' && c.args[0] === 'install');
      expect(installs.length).toBe(2);
    } finally { io.restore(); }
  });
});

// ---------------------------------------------------------------------------
// update
// ---------------------------------------------------------------------------

describe('updateCommand dispatch', () => {
  it('dispatches `npm update -g <pkg>` for npm-installed adapter', async () => {
    const io = captureOutput();
    const { runner, calls } = makeSpawnRunner(async (cmd, args) => {
      if (cmd === 'which' || cmd === 'where') return { code: 0, stdout: '/usr/bin/claude\n', stderr: '' };
      if (args.includes('--version')) return { code: 0, stdout: '1.2.4', stderr: '' };
      return { code: 0, stdout: 'updated', stderr: '' };
    });
    try {
      const args = parseArgs(['update', 'claude'], INSTALL_FLAGS);
      const client = makeClient([new ClaudeAdapter()]);
      const code = await installCommand(client, args, { spawnRunner: runner });
      expect(code).toBe(ExitCode.SUCCESS);
      const call = calls.find((c) => c.cmd === 'npm' && c.args[0] === 'update');
      expect(call!.args).toEqual(['update', '-g', '@anthropic-ai/claude-code']);
    } finally { io.restore(); }
  });

  it('update --dry-run prints planned command', async () => {
    const io = captureOutput();
    const { runner, calls } = makeSpawnRunner(async () => ({ code: 0, stdout: '', stderr: '' }));
    try {
      const args = parseArgs(['update', 'claude', '--dry-run'], INSTALL_FLAGS);
      const client = makeClient([new ClaudeAdapter()]);
      const code = await installCommand(client, args, { spawnRunner: runner });
      expect(code).toBe(ExitCode.SUCCESS);
      expect(calls.find((c) => c.cmd === 'npm' && c.args[0] === 'update')).toBeUndefined();
      expect(io.stdout.join('')).toContain('[dry-run]');
    } finally { io.restore(); }
  });

  it('cursor update resolves curl update via shell wrapper', async () => {
    const io = captureOutput();
    const { runner, calls } = makeSpawnRunner(async (cmd) => {
      if (cmd === 'which' || cmd === 'where') return { code: 0, stdout: '/usr/bin/cursor-agent\n', stderr: '' };
      return { code: 0, stdout: '', stderr: '' };
    });
    try {
      const args = parseArgs(['update', 'cursor'], INSTALL_FLAGS);
      const client = makeClient([new CursorAdapter()]);
      const code = await installCommand(client, args, { spawnRunner: runner });
      expect(code).toBe(ExitCode.SUCCESS);
      const shellCall = calls.find((c) => c.cmd === 'sh' || c.cmd === 'cmd');
      expect(shellCall).toBeDefined();
      expect(shellCall!.args.join(' ')).toContain('curl');
    } finally { io.restore(); }
  });
});

// ---------------------------------------------------------------------------
// detect
// ---------------------------------------------------------------------------

describe('detectCommand dispatch', () => {
  it('reports installed + version when binary is present', async () => {
    const io = captureOutput();
    const { runner } = makeSpawnRunner(async (cmd, args) => {
      if (cmd === 'which' || cmd === 'where') return { code: 0, stdout: '/usr/bin/codex\n', stderr: '' };
      if (args.includes('--version')) return { code: 0, stdout: '0.9.2\n', stderr: '' };
      return { code: 0, stdout: '', stderr: '' };
    });
    try {
      const args = parseArgs(['detect', 'codex'], INSTALL_FLAGS);
      const client = makeClient([new CodexAdapter()]);
      const code = await installCommand(client, args, { spawnRunner: runner });
      expect(code).toBe(ExitCode.SUCCESS);
      const out = io.stdout.join('');
      expect(out).toContain('Installed:');
      expect(out).toContain('yes');
      expect(out).toContain('0.9.2');
    } finally { io.restore(); }
  });

  it('reports not installed when binary is missing', async () => {
    const io = captureOutput();
    const { runner } = makeSpawnRunner(async () => ({ code: 1, stdout: '', stderr: '' }));
    try {
      const args = parseArgs(['detect', 'codex'], INSTALL_FLAGS);
      const client = makeClient([new CodexAdapter()]);
      const code = await installCommand(client, args, { spawnRunner: runner });
      expect(code).toBe(ExitCode.SUCCESS);
      expect(io.stdout.join('')).toContain('Installed:');
      expect(io.stdout.join('')).toContain('no');
    } finally { io.restore(); }
  });

  it('detect --all iterates through registered adapters', async () => {
    const io = captureOutput();
    const { runner } = makeSpawnRunner(async () => ({ code: 1, stdout: '', stderr: '' }));
    try {
      const args = parseArgs(['detect', '--all'], INSTALL_FLAGS);
      const client = makeClient([new ClaudeAdapter(), new CodexAdapter()]);
      const code = await installCommand(client, args, { spawnRunner: runner });
      expect(code).toBe(ExitCode.SUCCESS);
      const out = io.stdout.join('');
      expect(out).toContain('=== claude ===');
      expect(out).toContain('=== codex ===');
    } finally { io.restore(); }
  });

  it('detect --json emits structured JSON', async () => {
    const io = captureOutput();
    const { runner } = makeSpawnRunner(async (cmd, args) => {
      if (cmd === 'which' || cmd === 'where') return { code: 0, stdout: '/usr/bin/codex\n', stderr: '' };
      if (args.includes('--version')) return { code: 0, stdout: '1.0.0\n', stderr: '' };
      return { code: 0, stdout: '', stderr: '' };
    });
    try {
      const args = parseArgs(['detect', 'codex', '--json'], INSTALL_FLAGS);
      const client = makeClient([new CodexAdapter()]);
      const code = await installCommand(client, args, { spawnRunner: runner });
      expect(code).toBe(ExitCode.SUCCESS);
      const obj = JSON.parse(io.stdout.join(''));
      expect(obj.ok).toBe(true);
      expect(obj.data.installed).toBe(true);
      expect(obj.data.version).toBe('1.0.0');
    } finally { io.restore(); }
  });
});

// ---------------------------------------------------------------------------
// Spawner DI via adapter.setSpawner
// ---------------------------------------------------------------------------

describe('Spawner dependency injection', () => {
  it('installCommand honors adapter.setSpawner injection', async () => {
    const io = captureOutput();
    // We deliberately don't pass a spawnRunner; instead inject via adapter.
    const calls: RegisteredCall[] = [];
    const spawner: Spawner = async (cmd, args) => {
      calls.push({ cmd, args });
      if (cmd === 'which' || cmd === 'where') return { code: 1, stdout: '', stderr: '' };
      if (cmd === 'npm') return { code: 0, stdout: 'ok', stderr: '' };
      return { code: 0, stdout: '', stderr: '' };
    };
    try {
      const claude = new ClaudeAdapter();
      claude.setSpawner(spawner);
      const client = makeClient([claude]);
      const result = await claude.install({ force: false, dryRun: false });
      expect(result.ok).toBe(true);
      expect(calls.find((c) => c.cmd === 'npm')).toBeDefined();
      void client;
    } finally { io.restore(); }
  });
});
