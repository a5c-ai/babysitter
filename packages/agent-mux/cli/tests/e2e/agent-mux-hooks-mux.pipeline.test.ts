import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { main } from '../../src/index.js';

interface MatrixLane {
  amuxAgent: string;
  hooksAdapter: string;
  hookType: string;
  nativeEvent: string;
  payload: Record<string, unknown>;
  expectedPhase: string;
}

const matrixIt = process.env['AGENT_MUX_HOOKS_MUX_MATRIX'] === '1' ? it : it.skip;

describe('agent-mux hooks-mux no-SDK wiring matrix', () => {
  let cwd: string;
  let home: string;
  const previousCwd = process.cwd();
  const previousHome = process.env['HOME'];
  const previousUserProfile = process.env['USERPROFILE'];
  const previousXdgStateHome = process.env['XDG_STATE_HOME'];

  beforeEach(async () => {
    cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'amux-hooks-mux-'));
    home = await fs.mkdtemp(path.join(os.tmpdir(), 'amux-hooks-mux-home-'));
    process.chdir(cwd);
    process.env['HOME'] = home;
    process.env['USERPROFILE'] = home;
    process.env['XDG_STATE_HOME'] = path.join(home, '.local', 'state');
  });

  afterEach(() => {
    process.chdir(previousCwd);
    restoreEnv('HOME', previousHome);
    restoreEnv('USERPROFILE', previousUserProfile);
    restoreEnv('XDG_STATE_HOME', previousXdgStateHome);
  });

  matrixIt('routes a native hook payload from amux hooks into hooks-mux', async () => {
    const lane = readMatrixLane();
    const repoRoot = path.resolve(__dirname, '../../../../..');
    const hooksMuxCli = path.join(repoRoot, 'packages', 'hooks-mux', 'cli', 'dist', 'cli', 'main.js');
    await assertFileExists(hooksMuxCli, 'hooks-mux CLI must be built before this matrix test runs');

    const evidenceDir = resolveEvidenceDir(repoRoot, process.env['AGENT_MUX_HOOKS_MUX_ARTIFACT_DIR']);
    await fs.mkdir(evidenceDir, { recursive: true });
    const evidencePath = path.join(evidenceDir, `${sanitize(lane.amuxAgent)}-${sanitize(lane.hooksAdapter)}.jsonl`);
    const handlerPath = path.join(cwd, 'hooks-mux-handler.mjs');
    const bridgePath = path.join(cwd, 'amux-to-hooks-mux-bridge.mjs');

    await fs.writeFile(handlerPath, handlerScript(evidencePath), 'utf8');
    await fs.writeFile(bridgePath, bridgeScript(hooksMuxCli, lane.hooksAdapter, lane.nativeEvent, handlerPath), 'utf8');

    let stdout = captureStdout();
    let code = await main(['hooks', lane.amuxAgent, 'discover', '--json']);
    stdout.restore();
    expect(code).toBe(0);
    expect(JSON.parse(stdout.text).ok).toBe(true);

    stdout = captureStdout();
    code = await main([
      'hooks', lane.amuxAgent, 'add', lane.hookType,
      '--handler', 'command',
      '--target', commandForNodeScript(bridgePath),
      '--id', 'hooks-mux-bridge',
      '--json',
    ]);
    stdout.restore();
    expect(code).toBe(0);

    const stdin = mockStdin(JSON.stringify(lane.payload));
    stdout = captureStdout();
    code = await main(['hooks', lane.amuxAgent, 'handle', lane.hookType]);
    stdout.restore();
    stdin.restore();

    expect(code).toBe(0);
    expect(stdout.text).toContain('"decision":"allow"');
    expect(stdout.text).toContain(lane.hooksAdapter);

    const evidence = (await fs.readFile(evidencePath, 'utf8'))
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    expect(evidence).toHaveLength(1);
    expect(evidence[0]).toMatchObject({
      adapter: lane.hooksAdapter,
      rawEventName: lane.nativeEvent,
      phase: lane.expectedPhase,
      amuxAgent: lane.amuxAgent,
    });
  }, 30_000);
});

function readMatrixLane(): MatrixLane {
  const payloadJson = requiredEnv('AGENT_MUX_HOOKS_MUX_PAYLOAD_JSON');
  const parsed = JSON.parse(payloadJson) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('AGENT_MUX_HOOKS_MUX_PAYLOAD_JSON must be a JSON object');
  }

  return {
    amuxAgent: requiredEnv('AGENT_MUX_HOOKS_MUX_AMUX_AGENT'),
    hooksAdapter: requiredEnv('AGENT_MUX_HOOKS_MUX_ADAPTER'),
    hookType: requiredEnv('AGENT_MUX_HOOKS_MUX_HOOK_TYPE'),
    nativeEvent: requiredEnv('AGENT_MUX_HOOKS_MUX_NATIVE_EVENT'),
    payload: parsed as Record<string, unknown>,
    expectedPhase: requiredEnv('AGENT_MUX_HOOKS_MUX_EXPECTED_PHASE'),
  };
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required when AGENT_MUX_HOOKS_MUX_MATRIX=1`);
  }
  return value;
}

function restoreEnv(name: string, value: string | undefined): void {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function resolveEvidenceDir(repoRoot: string, configuredDir: string | undefined): string {
  if (!configuredDir) return path.join(repoRoot, 'artifacts', 'agent-mux-hooks-mux');
  return path.isAbsolute(configuredDir) ? configuredDir : path.join(repoRoot, configuredDir);
}

async function assertFileExists(filePath: string, message: string): Promise<void> {
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`${message}: ${filePath}`);
  }
}

function handlerScript(evidencePath: string): string {
  return `
import * as fs from 'node:fs';
const chunks = [];
process.stdin.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
process.stdin.on('end', () => {
  const event = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const evidence = {
    adapter: event.adapter,
    rawEventName: event.rawEventName,
    phase: event.phase,
    sessionId: event.execution?.sessionId ?? null,
    amuxAgent: process.env.AMUX_AGENT_UNDER_TEST,
  };
  fs.appendFileSync(${JSON.stringify(evidencePath)}, JSON.stringify(evidence) + '\\n', 'utf8');
  process.stdout.write(JSON.stringify({
    decision: 'allow',
    reason: 'hooks-mux bridge accepted ' + event.adapter,
    additionalContext: JSON.stringify(evidence),
  }));
});
`;
}

function bridgeScript(hooksMuxCli: string, hooksAdapter: string, nativeEvent: string, handlerPath: string): string {
  return `
import { spawn } from 'node:child_process';
const chunks = [];
process.stdin.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
process.stdin.on('end', () => {
  const amuxPayload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const nativePayload = amuxPayload.raw && typeof amuxPayload.raw === 'object' ? amuxPayload.raw : amuxPayload;
  const handlerCommand = 'node ' + JSON.stringify(${JSON.stringify(path.basename(handlerPath))});
  const child = spawn(process.execPath, [
    ${JSON.stringify(hooksMuxCli)},
    'invoke',
    '--adapter', ${JSON.stringify(hooksAdapter)},
    '--native-event', ${JSON.stringify(nativeEvent)},
    '--handler', handlerCommand,
    '--json',
  ], {
    env: { ...process.env, AMUX_AGENT_UNDER_TEST: amuxPayload.agent ?? '' },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk.toString(); });
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
  child.on('close', (code) => {
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    process.exit(code ?? 0);
  });
  child.stdin.end(JSON.stringify(nativePayload));
});
`;
}

function commandForNodeScript(scriptPath: string): string {
  return `${quoteForShell(process.execPath)} ${quoteForShell(scriptPath)}`;
}

function quoteForShell(value: string): string {
  if (process.platform === 'win32') {
    return `"${value.replace(/"/g, '\\"')}"`;
  }
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function sanitize(value: string): string {
  return value.replace(/[^a-z0-9_.-]+/gi, '-');
}

function captureStdout(): { readonly text: string; restore: () => void } {
  const original = process.stdout.write.bind(process.stdout);
  let buffer = '';
  (process.stdout.write as unknown as (chunk: string | Uint8Array) => boolean) = (chunk: unknown) => {
    buffer += typeof chunk === 'string' ? chunk : Buffer.from(chunk as Uint8Array).toString();
    return true;
  };
  return {
    get text() { return buffer; },
    restore: () => { process.stdout.write = original; },
  };
}

function mockStdin(data: string): { restore: () => void } {
  const originalIsTTY = process.stdin.isTTY;
  const originalOn = process.stdin.on.bind(process.stdin);
  const originalSetEncoding = process.stdin.setEncoding.bind(process.stdin);
  (process.stdin as unknown as { isTTY: boolean }).isTTY = false;
  process.stdin.setEncoding = () => process.stdin;
  process.stdin.on = ((event: string, handler: (...args: unknown[]) => void) => {
    if (event === 'data') handler(data);
    if (event === 'end') handler();
    return process.stdin;
  }) as typeof process.stdin.on;
  return {
    restore: () => {
      (process.stdin as unknown as { isTTY: boolean | undefined }).isTTY = originalIsTTY;
      process.stdin.on = originalOn;
      process.stdin.setEncoding = originalSetEncoding;
    },
  };
}
