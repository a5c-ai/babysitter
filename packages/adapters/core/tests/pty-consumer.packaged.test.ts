/**
 * FIX-009 — built-artifact (packed tarball) integration proof for interactive
 * PTY spawning.
 *
 * Everything here runs against the EXACT tarball `npm pack` would publish,
 * installed into a clean consumer project outside the workspace, and reached
 * only through the package's public entrypoint (`createClient()`). The
 * workspace sources are never imported, so the ESM `require` defect this fix
 * removes (`ReferenceError: require is not defined`) is observable.
 *
 * node-pty is an OPTIONAL PEER dependency: the consumer supplies it. Each
 * scenario therefore builds its own consumer whose `node_modules/node-pty` is
 * controlled:
 *
 *   - `real`    → symlink to the repository's real, natively built node-pty
 *   - `missing` → not installed at all (the only permitted-fallback condition)
 *   - `broken`  → installed but throwing on load (native-binding/ABI failure)
 *
 * Non-node-pty dependencies are supplied by a shared link farm one directory
 * above the consumers, which deliberately omits node-pty so the `missing`
 * scenario cannot accidentally resolve the workspace copy.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '..', '..', '..');
const REPO_NODE_MODULES = path.join(REPO_ROOT, 'node_modules');
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const BUILD_TIMEOUT_MS = 300_000;
const SCENARIO_TIMEOUT_MS = 120_000;

function exec(command: string, args: string[], cwd: string): string {
  return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: 'pipe' });
}

function parseNpmPackJson(output: string): Array<{ filename: string }> {
  const jsonStart = output.search(/(?:^|\n)\s*\[\s*\{/);
  if (jsonStart === -1) throw new Error(`npm pack --json did not emit JSON: ${output}`);
  return JSON.parse(output.slice(jsonStart).trim()) as Array<{ filename: string }>;
}

/**
 * node-pty ships `spawn-helper` as a prebuilt executable; some npm/registry
 * install paths drop its executable bit, and every posix_spawnp then fails.
 * Restoring the mode is an environment repair, not a test double — the PTY the
 * assertions exercise is still the real one.
 */
function repairNodePtyPermissions(nodePtyDir: string): void {
  const prebuilds = path.join(nodePtyDir, 'prebuilds');
  if (!fs.existsSync(prebuilds)) return;
  for (const platformDir of fs.readdirSync(prebuilds)) {
    const helper = path.join(prebuilds, platformDir, 'spawn-helper');
    if (!fs.existsSync(helper)) continue;
    const mode = fs.statSync(helper).mode & 0o777;
    if ((mode & 0o111) === 0) fs.chmodSync(helper, mode | 0o755);
  }
}

/** Probe whether this machine can actually allocate a PTY (CI runners often cannot). */
function canOpenRealPty(): { ok: true } | { ok: false; reason: string } {
  try {
    const probe = `
      const pty = require(${JSON.stringify(path.join(REPO_NODE_MODULES, 'node-pty'))});
      const p = pty.spawn('/bin/sh', ['-c', 'exit 0'], {
        name: 'xterm-256color', cols: 80, rows: 24, cwd: process.cwd(),
        env: { PATH: process.env.PATH || '/bin:/usr/bin', TERM: 'xterm-256color' },
      });
      p.onExit(() => process.exit(0));
    `;
    exec(process.execPath, ['-e', probe], os.tmpdir());
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Shared link farm: every top-level entry of the repository node_modules EXCEPT
 * node-pty. Placed one level above the consumers so Node's node_modules walk
 * finds it for ordinary dependencies while each consumer keeps full control of
 * its own node-pty (or absence of one).
 */
function buildSharedLinkFarm(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
  for (const entry of fs.readdirSync(REPO_NODE_MODULES)) {
    if (entry.startsWith('.') || entry === 'node-pty') continue;
    fs.symlinkSync(path.join(REPO_NODE_MODULES, entry), path.join(dir, entry), 'junction');
  }
}

type PtyVariant = 'real' | 'missing' | 'broken';

interface Consumer {
  dir: string;
  resultFile: string;
  markerFile: string;
}

function extractTarball(tarball: string, destination: string): void {
  fs.mkdirSync(destination, { recursive: true });
  exec('tar', ['-xzf', tarball, '-C', destination, '--strip-components=1'], destination);
}

describe('FIX-009 packed-artifact interactive PTY contract', () => {
  let tempRoot = '';
  let tarball = '';
  let ptyProbe: { ok: true } | { ok: false; reason: string } = { ok: false, reason: 'not probed' };
  let packedManifest: Record<string, any> = {};

  const makeConsumer = (name: string, variant: PtyVariant): Consumer => {
    const dir = path.join(tempRoot, 'consumers', name);
    const nodeModules = path.join(dir, 'node_modules');
    fs.mkdirSync(path.join(nodeModules, '@a5c-ai'), { recursive: true });
    fs.writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ name: `pty-consumer-${name}`, private: true, type: 'module' }, null, 2),
    );
    extractTarball(tarball, path.join(nodeModules, '@a5c-ai', 'comm-adapter'));

    if (variant === 'real') {
      fs.symlinkSync(path.join(REPO_NODE_MODULES, 'node-pty'), path.join(nodeModules, 'node-pty'), 'junction');
    } else if (variant === 'broken') {
      const brokenDir = path.join(nodeModules, 'node-pty');
      fs.mkdirSync(brokenDir, { recursive: true });
      fs.writeFileSync(
        path.join(brokenDir, 'package.json'),
        JSON.stringify({ name: 'node-pty', version: '1.1.0', main: 'lib/index.js' }, null, 2),
      );
      fs.mkdirSync(path.join(brokenDir, 'lib'), { recursive: true });
      // Reproduces the documented native-binding failure: the package IS
      // installed, but its compiled addon cannot be loaded.
      fs.writeFileSync(
        path.join(brokenDir, 'lib', 'index.js'),
        [
          "const err = new Error(\"Cannot find module '../build/Release/pty.node'\");",
          "err.code = 'MODULE_NOT_FOUND';",
          'throw err;',
        ].join('\n'),
      );
    }

    return {
      dir,
      resultFile: path.join(dir, 'result.json'),
      markerFile: path.join(dir, 'child-ran.marker'),
    };
  };

  const CONSUMER_SCRIPT = `
import fs from 'node:fs';
import { createClient } from '@a5c-ai/comm-adapter';

const resultFile = process.env.RESULT_FILE;
const childScript = process.env.CHILD_SCRIPT;
const ptyMode = process.env.PTY_MODE || undefined;
const requiresPty = process.env.REQUIRES_PTY === '1';

const parsedLines = [];
const observed = [];

const client = createClient();
client.adapters.register({
  agent: 'pty-probe',
  displayName: 'PTY Probe',
  cliCommand: 'sh',
  models: [],
  adapterType: 'subprocess',
  capabilities: { supportsStdinInjection: true, requiresPty },
  buildSpawnArgs: () => ({
    command: '/bin/sh',
    args: ['-c', childScript],
    env: { PATH: process.env.PATH, TERM: 'xterm-256color' },
    cwd: process.cwd(),
    usePty: true,
  }),
  parseEvent: (line) => { parsedLines.push(line); return null; },
});

const handle = client.run({
  agent: 'pty-probe',
  prompt: 'go',
  interactive: true,
  collectEvents: true,
  timeout: 30000,
  ...(ptyMode ? { ptyMode } : {}),
});

handle.on('debug', (event) => observed.push({ type: 'debug', level: event.level, message: event.message }));
handle.on('error', (event) => observed.push({ type: 'error', code: event.code, message: event.message }));

let result = null;
let threw = null;
try {
  const r = await handle.result();
  result = {
    exitReason: r.exitReason,
    exitCode: r.exitCode,
    error: r.error ? { code: r.error.code, message: r.error.message } : null,
  };
} catch (error) {
  threw = error instanceof Error ? \`\${error.name}: \${error.message}\` : String(error);
}

fs.writeFileSync(resultFile, JSON.stringify({ result, threw, parsedLines, observed }, null, 2));
process.exit(0);
`;

  interface ScenarioResult {
    result: { exitReason: string; exitCode: number | null; error: { code: string; message: string } | null } | null;
    threw: string | null;
    parsedLines: string[];
    observed: Array<{ type: string; level?: string; code?: string; message: string }>;
    childRan: boolean;
    stderr: string;
  }

  const runScenario = (
    name: string,
    variant: PtyVariant,
    env: { CHILD_SCRIPT: string; PTY_MODE?: string; REQUIRES_PTY?: string },
  ): ScenarioResult => {
    const consumer = makeConsumer(name, variant);
    const scriptPath = path.join(consumer.dir, 'scenario.mjs');
    fs.writeFileSync(scriptPath, CONSUMER_SCRIPT);
    let stderr = '';
    try {
      execFileSync(process.execPath, [scriptPath], {
        cwd: consumer.dir,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 90_000,
        env: {
          ...process.env,
          RESULT_FILE: consumer.resultFile,
          MARKER_FILE: consumer.markerFile,
          ...env,
        },
      });
    } catch (error) {
      stderr = (error as { stderr?: string }).stderr ?? String(error);
    }
    if (!fs.existsSync(consumer.resultFile)) {
      throw new Error(`consumer "${name}" produced no result. stderr:\n${stderr}`);
    }
    const parsed = JSON.parse(fs.readFileSync(consumer.resultFile, 'utf8'));
    return { ...parsed, childRan: fs.existsSync(consumer.markerFile), stderr };
  };

  beforeAll(() => {
    exec(NPM, ['run', 'build', '--workspace=@a5c-ai/comm-adapter'], REPO_ROOT);

    const packOutput = exec(NPM, ['pack', '--ignore-scripts', '--json'], PACKAGE_ROOT);
    const [packed] = parseNpmPackJson(packOutput);
    const packedInRepo = path.join(PACKAGE_ROOT, packed!.filename);

    tempRoot = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'fix009-pty-'));
    tarball = path.join(tempRoot, packed!.filename);
    fs.renameSync(packedInRepo, tarball);

    buildSharedLinkFarm(path.join(tempRoot, 'consumers', 'node_modules'));
    repairNodePtyPermissions(path.join(REPO_NODE_MODULES, 'node-pty'));
    ptyProbe = canOpenRealPty();

    const manifestProbe = path.join(tempRoot, 'manifest');
    extractTarball(tarball, manifestProbe);
    packedManifest = JSON.parse(fs.readFileSync(path.join(manifestProbe, 'package.json'), 'utf8'));
  }, BUILD_TIMEOUT_MS);

  afterAll(() => {
    if (tempRoot && fs.existsSync(tempRoot)) fs.rmSync(tempRoot, { recursive: true, force: true });
  });

  it('declares node-pty under exactly one intentional ownership model in the packed manifest', () => {
    expect(packedManifest.peerDependencies?.['node-pty']).toBeTypeOf('string');
    expect(packedManifest.peerDependenciesMeta?.['node-pty']).toEqual({ optional: true });
    // One model only — an optional peer must not also be a hard/optional dependency.
    expect(packedManifest.dependencies?.['node-pty']).toBeUndefined();
    expect(packedManifest.optionalDependencies?.['node-pty']).toBeUndefined();
  });

  it(
    'selects the PTY branch and opens a REAL pty from the compiled ESM artifact',
    () => {
      if (!ptyProbe.ok) {
        console.warn(`skipping real-PTY assertions: ${ptyProbe.reason}`);
        return;
      }
      const scenario = runScenario('real-required', 'real', {
        // stty/tty prove a real TTY; the marker proves the child actually ran.
        CHILD_SCRIPT: 'touch "$MARKER_FILE"; stty size; tty; echo PARSED-LINE-OK; exit 7',
        PTY_MODE: 'required',
      });

      expect(scenario.threw).toBeNull();
      expect(scenario.childRan).toBe(true);
      const output = scenario.parsedLines.join('\n');

      // PTY branch selected — a piped child reports "not a tty".
      expect(output).toMatch(/\/dev\/(tty|pts)/);
      expect(output).not.toContain('not a tty');
      // Terminal dimensions: spawn-runner passes rows/cols (40x120 when the
      // host stdout is not itself a TTY).
      expect(output).toMatch(/\b40 120\b/);
      // Output parsing: ANSI-stripped lines reach adapter.parseEvent.
      expect(output).toContain('PARSED-LINE-OK');
      // Exit propagation through the PTY onExit facade.
      expect(scenario.result?.exitCode).toBe(7);
      // No degradation notice on the success path.
      expect(scenario.observed.some((e) => e.message.includes('PTY_NOT_AVAILABLE'))).toBe(false);
    },
    SCENARIO_TIMEOUT_MS,
  );

  it(
    'fails loudly with PTY_NOT_AVAILABLE and never degrades to pipes when PTY is required',
    () => {
      const scenario = runScenario('missing-required', 'missing', {
        CHILD_SCRIPT: 'touch "$MARKER_FILE"; echo SHOULD-NOT-RUN',
        PTY_MODE: 'required',
      });

      expect(scenario.threw).toBeNull();
      expect(scenario.result?.exitReason).toBe('crashed');
      expect(scenario.result?.error?.code).toBe('PTY_NOT_AVAILABLE');
      expect(scenario.result?.error?.message).toContain('node-pty');
      // The decisive assertion: a required-PTY run must not silently run on pipes.
      expect(scenario.childRan).toBe(false);
      expect(scenario.parsedLines.join('\n')).not.toContain('SHOULD-NOT-RUN');
    },
    SCENARIO_TIMEOUT_MS,
  );

  it(
    'treats adapter capabilities.requiresPty as required by default',
    () => {
      const scenario = runScenario('missing-capability-required', 'missing', {
        CHILD_SCRIPT: 'touch "$MARKER_FILE"; echo SHOULD-NOT-RUN',
        REQUIRES_PTY: '1',
      });

      expect(scenario.result?.error?.code).toBe('PTY_NOT_AVAILABLE');
      expect(scenario.childRan).toBe(false);
    },
    SCENARIO_TIMEOUT_MS,
  );

  it(
    'falls back to pipes ONLY for an absent optional peer, and the fallback is observable',
    () => {
      const scenario = runScenario('missing-preferred', 'missing', {
        CHILD_SCRIPT: 'touch "$MARKER_FILE"; tty; echo FALLBACK-RAN',
        PTY_MODE: 'preferred',
      });

      expect(scenario.threw).toBeNull();
      expect(scenario.result?.exitReason).toBe('completed');
      expect(scenario.childRan).toBe(true);
      const output = scenario.parsedLines.join('\n');
      expect(output).toContain('FALLBACK-RAN');
      expect(output).toContain('not a tty');

      // Observable degradation notice emitted BEFORE the pipe spawn.
      const warning = scenario.observed.find(
        (event) => event.type === 'debug' && event.level === 'warn' && event.message.includes('PTY_NOT_AVAILABLE'),
      );
      expect(warning, JSON.stringify(scenario.observed)).toBeDefined();
      expect(warning!.message).toContain('node-pty');
      expect(warning!.message).toContain('preferred');
      // A permitted fallback is a warning, not a run error.
      expect(scenario.result?.error).toBeNull();
    },
    SCENARIO_TIMEOUT_MS,
  );

  it(
    'does NOT treat a broken native node-pty install as an absent optional peer',
    () => {
      const scenario = runScenario('broken-preferred', 'broken', {
        CHILD_SCRIPT: 'touch "$MARKER_FILE"; echo SHOULD-NOT-RUN',
        PTY_MODE: 'preferred',
      });

      expect(scenario.threw).toBeNull();
      expect(scenario.result?.exitReason).toBe('crashed');
      expect(scenario.result?.error?.code).toBe('PTY_NOT_AVAILABLE');
      expect(scenario.result?.error?.message).toMatch(/installed|load/i);
      // Even in "preferred" mode an installed-but-broken PTY is an environment
      // defect, not an absent optional dependency: no silent pipe fallback.
      expect(scenario.childRan).toBe(false);
    },
    SCENARIO_TIMEOUT_MS,
  );
});
