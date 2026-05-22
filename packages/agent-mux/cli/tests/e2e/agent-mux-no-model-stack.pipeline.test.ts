import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { main } from '../../src/index.js';
import { startTransportMuxRuntime, type CompletionEngine, type CompletionRequest, type CompletionResult, type CompletionStreamEvent, type TransportMuxRuntime } from '@a5c-ai/transport-mux';

interface MatrixLane {
  agent: string;
  runtime: 'agent-mux-mocks' | 'real-agent';
  hooks: 'hooks-mux' | 'none';
}

interface RecordingCompletionEngine extends CompletionEngine {
  requests: CompletionRequest[];
}

const matrixIt = process.env['NO_MODEL_STACK_MATRIX'] === '1' ? it : it.skip;
const PROFILE_NAME = 'no-model-mock';
let cwd = '';
let home = '';
let binDir = '';
let runtime: TransportMuxRuntime | undefined;

const HOOK_PAYLOADS: Record<string, { hookType: string; nativeEvent: string; expectedPhase: string; payload: Record<string, unknown> }> = {
  claude: {
    hookType: 'PreToolUse',
    nativeEvent: 'PreToolUse',
    expectedPhase: 'tool.before',
    payload: { session_id: 'no-model-claude', cwd: '/workspace/claude', model: 'mock-model', tool_name: 'Bash', tool_call_id: 'claude-tool-1', tool_input: { command: 'pwd' } },
  },
  codex: {
    hookType: 'PreToolUse',
    nativeEvent: 'PreToolUse',
    expectedPhase: 'tool.before',
    payload: { session_id: 'no-model-codex', cwd: '/workspace/codex', model: 'mock-model', tool_name: 'bash', tool_call_id: 'codex-tool-1', tool_input: { command: 'pwd' } },
  },
  pi: {
    hookType: 'tool_call',
    nativeEvent: 'tool_call',
    expectedPhase: 'tool.before',
    payload: { sessionId: 'no-model-pi', cwd: '/workspace/pi', model: 'mock-model', toolName: 'Bash', toolCallId: 'pi-tool-1', toolInput: { command: 'pwd' } },
  },
  gemini: {
    hookType: 'BeforeTool',
    nativeEvent: 'BeforeTool',
    expectedPhase: 'tool.before',
    payload: { cwd: '/workspace/gemini', model: 'mock-model', toolName: 'Bash', toolCallId: 'gemini-tool-1', toolInput: { command: 'pwd' } },
  },
};

describe('agent-mux no-model stack matrix', () => {
  const previousCwd = process.cwd();
  const previousEnv = captureEnv([
    'HOME', 'USERPROFILE', 'XDG_STATE_HOME', 'PATH', 'Path', 'AMUX_PROFILE', 'AMUX_MOCK_HARNESS_BIN',
    'OPENAI_BASE_URL', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'ANTHROPIC_BASE_URL', 'GEMINI_API_KEY', 'CODE_ASSIST_ENDPOINT',
  ]);

  beforeEach(async () => {
    cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'amux-no-model-stack-'));
    home = await fs.mkdtemp(path.join(os.tmpdir(), 'amux-no-model-home-'));
    binDir = path.join(cwd, 'bin');
    await fs.mkdir(binDir, { recursive: true });
    process.chdir(cwd);
    process.env['HOME'] = home;
    process.env['USERPROFILE'] = home;
    process.env['XDG_STATE_HOME'] = path.join(home, '.local', 'state');
    const nextPath = `${binDir}${path.delimiter}${previousEnv.PATH ?? previousEnv.Path ?? ''}`;
    process.env['PATH'] = nextPath;
    process.env['Path'] = nextPath;
  });

  afterEach(async () => {
    if (runtime) {
      await runtime.stop();
      runtime = undefined;
    }
    process.chdir(previousCwd);
    restoreEnv(previousEnv);
  });

  matrixIt('installs and launches a no-model stack lane through transport-mux', async () => {
    const lane = readMatrixLane();
    const repoRoot = path.resolve(__dirname, '../../../../..');
    const evidenceDir = resolveEvidenceDir(repoRoot, process.env['NO_MODEL_STACK_ARTIFACT_DIR']);
    await fs.mkdir(evidenceDir, { recursive: true });

    const engine = createRecordingEngine(`mock transport response for ${lane.runtime}/${lane.agent}`);
    runtime = await startTransportMuxRuntime({
      targetProvider: 'openai',
      targetModel: 'openai/mock-model',
      exposedTransport: 'openai-chat',
      authToken: 'mock-token',
      port: 0,
      completionEngine: engine,
    });

    await writeProviderProfile(lane.agent, runtime.url);
    await writeRunProfile(lane.agent);
    await writeRealAgentShim(binDir, lane.agent, path.join(evidenceDir, `${lane.runtime}-${lane.agent}-agent.jsonl`));
    const mockHarnessPath = await writeMockHarnessShim(cwd, path.join(evidenceDir, `${lane.runtime}-${lane.agent}-mock-harness.jsonl`));

    const installOutput = await callMain(['install', lane.agent, '--dry-run', '--json']);
    expect(installOutput.code).toBe(0);
    const installJson = JSON.parse(installOutput.stdout) as { ok: boolean; data?: Record<string, unknown> };
    expect(installJson.ok).toBe(true);
    expect(installJson.data).toMatchObject({ agent: lane.agent, dryRun: true });

    if (lane.runtime === 'agent-mux-mocks') {
      process.env['AMUX_MOCK_HARNESS_BIN'] = mockHarnessPath;
      const runOutput = await callMain([
        'run', lane.agent,
        '--profile', PROFILE_NAME,
        '--use-mock-harness',
        '--mock-scenario', `${lane.agent}-basic`,
        '--json',
        '--env', `OPENAI_BASE_URL=${runtime.url}`,
        '--env', 'OPENAI_API_KEY=mock-token',
        'Say hello through the no-model transport mux.',
      ]);
      expect(runOutput.code).toBe(0);
      expect(runOutput.stdout).toContain('run_result');
    } else {
      setEnvForRealAgentShim(runtime.url);
      const launchOutput = await callMain([
        'launch', lane.agent,
        '--profile', PROFILE_NAME,
        '--no-proxy',
        '--no-interactive',
        '--prompt', 'Say hello through the no-model transport mux.',
      ]);
      expect(launchOutput.code).toBe(0);
    }

    expect(engine.requests.length).toBeGreaterThan(0);
    expect(engine.requests[0]?.model).toContain('mock-model');

    let hookEvidence: Record<string, unknown> | null = null;
    if (lane.hooks === 'hooks-mux') {
      hookEvidence = await fireHooksMuxBridge(repoRoot, evidenceDir, lane.agent);
      expect(hookEvidence).toMatchObject({ agent: lane.agent, phase: HOOK_PAYLOADS[lane.agent]!.expectedPhase });
    }

    await fs.writeFile(
      path.join(evidenceDir, `${lane.runtime}-${lane.agent}-summary.json`),
      JSON.stringify({ lane, transportRequests: engine.requests.length, hookEvidence }, null, 2),
      'utf8',
    );
  }, 45_000);
});

function readMatrixLane(): MatrixLane {
  const agent = requiredEnv('NO_MODEL_STACK_AGENT');
  const runtime = requiredEnv('NO_MODEL_STACK_RUNTIME');
  const hooks = requiredEnv('NO_MODEL_STACK_HOOKS');
  if (!['claude', 'codex', 'pi', 'gemini'].includes(agent)) {
    throw new Error(`Unsupported NO_MODEL_STACK_AGENT: ${agent}`);
  }
  if (runtime !== 'agent-mux-mocks' && runtime !== 'real-agent') {
    throw new Error(`Unsupported NO_MODEL_STACK_RUNTIME: ${runtime}`);
  }
  if (hooks !== 'hooks-mux' && hooks !== 'none') {
    throw new Error(`Unsupported NO_MODEL_STACK_HOOKS: ${hooks}`);
  }
  return { agent, runtime, hooks } as MatrixLane;
}

function createRecordingEngine(text: string): RecordingCompletionEngine {
  const requests: CompletionRequest[] = [];
  const resultFor = (request: CompletionRequest): CompletionResult => ({
    id: 'mock-no-model-completion',
    model: request.model,
    role: 'assistant',
    text,
    finishReason: 'stop',
    usage: { promptTokens: 7, completionTokens: 5, totalTokens: 12 },
  });
  return {
    requests,
    async complete(request) {
      requests.push(request);
      return resultFor(request);
    },
    async *stream(request): AsyncIterable<CompletionStreamEvent> {
      requests.push(request);
      yield { type: 'text-delta', text };
      yield { type: 'done', finishReason: 'stop', usage: { promptTokens: 7, completionTokens: 5, totalTokens: 12 } };
    },
  };
}

async function writeProviderProfile(agent: string, runtimeUrl: string): Promise<void> {
  const profile = providerProfileForAgent(agent, runtimeUrl);
  const providersPath = path.join(cwd, '.amux', 'providers.json');
  await fs.mkdir(path.dirname(providersPath), { recursive: true });
  await fs.writeFile(providersPath, JSON.stringify({ version: 1, profiles: { [PROFILE_NAME]: profile } }, null, 2), 'utf8');
}

async function writeRunProfile(agent: string): Promise<void> {
  const profilePath = path.join(cwd, '.agent-mux', 'profiles', `${PROFILE_NAME}.json`);
  await fs.mkdir(path.dirname(profilePath), { recursive: true });
  await fs.writeFile(profilePath, JSON.stringify({ agent, model: 'mock-model', outputFormat: 'jsonl', timeout: 15_000 }, null, 2), 'utf8');
}

function providerProfileForAgent(agent: string, runtimeUrl: string): Record<string, unknown> {
  if (agent === 'claude') {
    return { provider: 'anthropic', model: 'mock-model', auth: { type: 'api_key', apiKey: 'mock-token' }, params: { apiBase: runtimeUrl } };
  }
  if (agent === 'gemini') {
    return { provider: 'google', model: 'mock-model', auth: { type: 'api_key', apiKey: 'mock-token' }, params: { apiBase: runtimeUrl } };
  }
  return { provider: 'custom', model: 'mock-model', transport: 'openai-chat', auth: { type: 'api_key', apiKey: 'mock-token' }, params: { apiBase: runtimeUrl } };
}

function setEnvForRealAgentShim(runtimeUrl: string): void {
  process.env['OPENAI_BASE_URL'] = runtimeUrl;
  process.env['OPENAI_API_KEY'] = 'mock-token';
  process.env['ANTHROPIC_BASE_URL'] = runtimeUrl;
  process.env['ANTHROPIC_API_KEY'] = 'mock-token';
  process.env['GEMINI_API_KEY'] = 'mock-token';
  process.env['CODE_ASSIST_ENDPOINT'] = runtimeUrl;
}

async function writeRealAgentShim(dir: string, agent: string, evidencePath: string): Promise<void> {
  const scriptPath = path.join(dir, `${agent}-shim.mjs`);
  await fs.writeFile(scriptPath, shimScript(agent, evidencePath, false), 'utf8');
  const windowsShim = `@echo off\r\nnode "${scriptPath}" ${agent} %*\r\n`;
  const posixShim = `#!/usr/bin/env sh\nexec node ${quotePosix(scriptPath)} ${agent} "$@"\n`;
  await fs.writeFile(path.join(dir, agent), process.platform === 'win32' ? windowsShim : posixShim, { encoding: 'utf8', mode: 0o755 });
  await fs.writeFile(path.join(dir, `${agent}.cmd`), windowsShim, 'utf8');
  await fs.chmod(path.join(dir, agent), 0o755).catch(() => {});
}

async function writeMockHarnessShim(baseDir: string, evidencePath: string): Promise<string> {
  const scriptPath = path.join(baseDir, 'mock-harness-shim.mjs');
  await fs.writeFile(scriptPath, shimScript('mock-harness', evidencePath, true), 'utf8');
  return scriptPath;
}

function shimScript(defaultAgent: string, evidencePath: string, mockHarness: boolean): string {
  return `
import * as fs from 'node:fs';
const args = process.argv.slice(2);
const agentFlagIndex = args.indexOf('--agent');
const agent = ${mockHarness ? `(agentFlagIndex >= 0 ? args[agentFlagIndex + 1] : ${JSON.stringify(defaultAgent)})` : `args[0] ?? ${JSON.stringify(defaultAgent)}`};
const base = process.env.OPENAI_BASE_URL || process.env.AMUX_PROXY_BASE_URL || process.env.ANTHROPIC_BASE_URL || process.env.CODE_ASSIST_ENDPOINT;
if (!base) throw new Error('mock transport base URL was not provided');
const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
const response = await fetch(normalizedBase + '/v1/chat/completions', {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: 'Bearer ' + (process.env.OPENAI_API_KEY || process.env.AMUX_PROXY_AUTH_TOKEN || 'mock-token') },
  body: JSON.stringify({ model: 'mock-model', messages: [{ role: 'user', content: 'no-model stack probe for ' + agent }] }),
});
const body = await response.json();
fs.appendFileSync(${JSON.stringify(evidencePath)}, JSON.stringify({ agent, args, status: response.status, body }) + '\\n', 'utf8');
for (const line of eventsFor(agent, body.choices?.[0]?.message?.content || 'Hello from transport mux')) {
  process.stdout.write(JSON.stringify(line) + '\\n');
}
function eventsFor(agent, text) {
  if (agent === 'claude') return [
    { type: 'system', subtype: 'init', session_id: 'mock-claude-session' },
    { type: 'text', text },
  ];
  if (agent === 'codex') return [
    { type: 'thread.started', thread_id: 'mock-codex-thread' },
    { type: 'item.completed', item: { type: 'agent_message', text } },
    { type: 'turn.completed', text },
  ];
  return [{ type: 'message', content: text }];
}
`;
}

async function fireHooksMuxBridge(repoRoot: string, evidenceDir: string, agent: string): Promise<Record<string, unknown>> {
  const hook = HOOK_PAYLOADS[agent];
  if (!hook) throw new Error(`No hook payload configured for ${agent}`);
  const hooksMuxCli = path.join(repoRoot, 'packages', 'hooks-mux', 'cli', 'dist', 'cli', 'main.js');
  await fs.access(hooksMuxCli);
  const evidencePath = path.join(evidenceDir, `${agent}-hooks-mux.jsonl`);
  const handlerPath = path.join(cwd, `${agent}-hooks-handler.mjs`);
  const bridgePath = path.join(cwd, `${agent}-hooks-bridge.mjs`);
  await fs.writeFile(handlerPath, `
import * as fs from 'node:fs';
const chunks = [];
process.stdin.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
process.stdin.on('end', () => {
  const event = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  fs.appendFileSync(${JSON.stringify(evidencePath)}, JSON.stringify({ agent: ${JSON.stringify(agent)}, adapter: event.adapter, phase: event.phase, rawEventName: event.rawEventName }) + '\\n', 'utf8');
  process.stdout.write(JSON.stringify({ decision: 'allow' }));
});
`, 'utf8');
  await fs.writeFile(bridgePath, `
import { spawn } from 'node:child_process';
const chunks = [];
process.stdin.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
process.stdin.on('end', () => {
  const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  const child = spawn(process.execPath, [${JSON.stringify(hooksMuxCli)}, 'invoke', '--adapter', ${JSON.stringify(agent)}, '--native-event', ${JSON.stringify(hook.nativeEvent)}, '--handler', 'node ${path.basename(handlerPath).replace(/'/g, "\\'")}', '--json'], { stdio: ['pipe', 'pipe', 'pipe'] });
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  child.on('close', (code) => process.exit(code ?? 0));
  child.stdin.end(JSON.stringify(payload.raw && typeof payload.raw === 'object' ? payload.raw : payload));
});
`, 'utf8');

  let output = await callMain(['hooks', agent, 'add', hook.hookType, '--handler', 'command', '--target', `${quoteForShell(process.execPath)} ${quoteForShell(bridgePath)}`, '--id', 'no-model-hooks-mux', '--json']);
  expect(output.code).toBe(0);
  const stdin = mockStdin(JSON.stringify(hook.payload));
  try {
    output = await callMain(['hooks', agent, 'handle', hook.hookType]);
  } finally {
    stdin.restore();
  }
  expect(output.code).toBe(0);
  const lines = (await fs.readFile(evidencePath, 'utf8')).trim().split('\n');
  return JSON.parse(lines[lines.length - 1]!) as Record<string, unknown>;
}

async function callMain(args: string[]): Promise<{ code: number; stdout: string; stderr: string }> {
  const stdout = captureWrite(process.stdout);
  const stderr = captureWrite(process.stderr);
  try {
    const code = await main(args);
    return { code, stdout: stdout.text, stderr: stderr.text };
  } finally {
    stdout.restore();
    stderr.restore();
  }
}

function captureWrite(stream: NodeJS.WriteStream): { readonly text: string; restore: () => void } {
  const original = stream.write.bind(stream);
  let buffer = '';
  (stream.write as unknown as (chunk: string | Uint8Array) => boolean) = (chunk: unknown) => {
    buffer += typeof chunk === 'string' ? chunk : Buffer.from(chunk as Uint8Array).toString();
    return true;
  };
  return { get text() { return buffer; }, restore: () => { stream.write = original; } };
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

function captureEnv(names: string[]): Record<string, string | undefined> {
  return Object.fromEntries(names.map((name) => [name, process.env[name]]));
}

function restoreEnv(values: Record<string, string | undefined>): void {
  for (const [name, value] of Object.entries(values)) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required when NO_MODEL_STACK_MATRIX=1`);
  return value;
}

function resolveEvidenceDir(repoRoot: string, configuredDir: string | undefined): string {
  if (!configuredDir) return path.join(repoRoot, 'artifacts', 'no-model-stack-matrix');
  return path.isAbsolute(configuredDir) ? configuredDir : path.join(repoRoot, configuredDir);
}

function quoteForShell(value: string): string {
  return process.platform === 'win32' ? `"${value.replace(/"/g, '\\"')}"` : `'${value.replace(/'/g, `'\\''`)}'`;
}

function quotePosix(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}
