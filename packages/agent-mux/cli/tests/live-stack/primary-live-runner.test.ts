import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildPrimaryLiveStackCommands, executeChildProcessCommand, runPrimaryLiveStackScenario } from './primary-live-runner';
import type { LiveStackScenario } from './scenario-contract';
import { liveStackScenarioFromEnv, primaryLiveStackScenario } from './scenario-contract';

async function writeMinimalJournal(journalDir: string, completed: boolean): Promise<void> {
  const events = [
    { type: 'RUN_CREATED' },
    { type: 'PROCESS_ASSIGNED' },
    { type: 'ITERATION_STARTED', iteration: 1 },
    { type: 'EFFECT_REQUESTED', kind: 'shell' },
    { type: 'EFFECT_RESOLVED', status: 'ok' },
    { type: 'EFFECT_REQUESTED', kind: 'agent' },
    { type: 'EFFECT_RESOLVED', status: 'ok' },
    { type: 'ITERATION_STARTED', iteration: 2 },
    { type: 'EFFECT_REQUESTED', kind: 'agent' },
    { type: 'EFFECT_RESOLVED', status: 'ok' },
    { type: 'EFFECT_REQUESTED', kind: 'agent' },
    { type: 'EFFECT_RESOLVED', status: 'ok' },
    { type: 'EFFECT_REQUESTED', kind: 'agent' },
    { type: 'EFFECT_RESOLVED', status: 'ok' },
    { type: 'ITERATION_STARTED', iteration: 3 },
    { type: 'EFFECT_REQUESTED', kind: 'shell' },
    { type: 'EFFECT_RESOLVED', status: 'ok' },
    ...(completed ? [{ type: 'RUN_COMPLETED' }] : []),
  ];
  for (let i = 0; i < events.length; i++) {
    await fs.writeFile(path.join(journalDir, `${String(i + 1).padStart(6, '0')}.json`), JSON.stringify(events[i]));
  }
}

function foundryClaudeVanillaScenario(): LiveStackScenario {
  return liveStackScenarioFromEnv({
    LIVE_STACK_SCENARIO_ID: 'live.agent-mux.claude-code.foundry-openai.gpt-5.5',
    LIVE_STACK_AGENT_PATH: 'agent-mux',
    LIVE_STACK_AGENT: 'claude-code',
    LIVE_STACK_AMUX_AGENT: 'claude',
    LIVE_STACK_INTEGRATION_TYPE: 'third-party-plugin',
    LIVE_STACK_INSTALL_MODE: 'vanilla',
    LIVE_STACK_PROVIDER: 'foundry-openai',
    LIVE_STACK_AMUX_PROVIDER: 'foundry',
    LIVE_STACK_MODEL: 'gpt-5.5',
    LIVE_STACK_CREDENTIAL_MODE: 'github-org-secrets-and-vars',
    LIVE_STACK_REQUIRED_ENV: 'AZURE_API_KEY,AMUX_API_BASE',
    LIVE_STACK_LAYERS: 'agent-mux install,agent-mux invocation,transport-mux route,provider/model trace',
    LIVE_STACK_REQUIRED_TRACE_IDS: 'agentMuxRunId,agentMuxSessionId,transportTraceId',
    LIVE_STACK_EXPECTED_ARTIFACTS: 'agent-mux-events,transport-mux-trace,provider-trace-redacted',
  });
}

function promptFor(scenario: LiveStackScenario, env: Record<string, string | undefined> = {}): string | undefined {
  const commands = buildPrimaryLiveStackCommands(scenario, {
    cwd: '/repo',
    timeoutMs: 1000,
    env: { AZURE_API_KEY: 'sk-live-secret', AMUX_API_BASE: 'https://foundry.example.test', LIVE_STACK_TRACE_ID: 'trace-1', ...env },
  });
  const launch = commands.at(-1);
  return launch?.args[(launch?.args.indexOf('--prompt') ?? -2) + 1];
}

describe('primary live stack runner contract', () => {
  it('keeps Claude Code babysitter-plugin live lanes on Foundry GPT-5.5', () => {
    const scenario = primaryLiveStackScenario();
    const commands = buildPrimaryLiveStackCommands(scenario, {
      cwd: '/repo',
      timeoutMs: 1000,
      env: { AZURE_API_KEY: 'sk-live-secret', AMUX_API_BASE: 'https://foundry.example.test', LIVE_STACK_TRACE_ID: 'trace-1' },
    });

    const run = commands.at(-1);
    expect(run?.args).toContain('launch');
    expect(run?.args).toContain('claude');
    expect(run?.args).toContain('gpt-5.5');
    expect(run?.args).toContain('foundry');
    expect(run?.args).not.toContain('anthropic');
    expect(run?.args).not.toContain('sonnet');
  });

  it('invokes concrete Babysitter commands for plugin live lanes', () => {
    const claudeScenario = primaryLiveStackScenario();
    const claudeCommands = buildPrimaryLiveStackCommands(claudeScenario, {
      cwd: '/repo',
      timeoutMs: 1000,
      env: { AZURE_API_KEY: 'sk-live-secret', AMUX_API_BASE: 'https://foundry.example.test', LIVE_STACK_TRACE_ID: 'trace-1' },
    });
    const claudeLaunch = claudeCommands.at(-1);
    const claudePrompt = claudeLaunch?.args[(claudeLaunch?.args.indexOf('--prompt') ?? -2) + 1];

    expect(claudePrompt).toMatch(/^\/babysitter:yolo /);
    expect(claudePrompt).toContain('.a5c/processes/summarize-translate-test.mjs');
    expect(claudePrompt).not.toContain('Use the babysitter skill');

    const codexScenario = liveStackScenarioFromEnv({
      LIVE_STACK_SCENARIO_ID: 'live.agent-mux.codex.foundry-openai.gpt-5.5',
      LIVE_STACK_AGENT_PATH: 'agent-mux',
      LIVE_STACK_AGENT: 'codex',
      LIVE_STACK_AMUX_AGENT: 'codex',
      LIVE_STACK_INTEGRATION_TYPE: 'third-party-plugin',
      LIVE_STACK_INSTALL_MODE: 'babysitter-plugin',
      LIVE_STACK_PROVIDER: 'foundry-openai',
      LIVE_STACK_AMUX_PROVIDER: 'foundry',
      LIVE_STACK_MODEL: 'gpt-5.5',
      LIVE_STACK_CREDENTIAL_MODE: 'github-org-secrets-and-vars',
      LIVE_STACK_REQUIRED_ENV: 'AZURE_API_KEY,AMUX_API_BASE',
      LIVE_STACK_LAYERS: 'babysitter-plugin',
      LIVE_STACK_REQUIRED_TRACE_IDS: 'agentMuxRunId,agentMuxSessionId,transportTraceId',
      LIVE_STACK_EXPECTED_ARTIFACTS: 'agent-mux-events,plugin-command-transcript,transport-mux-trace,provider-trace-redacted',
    });
    const codexCommands = buildPrimaryLiveStackCommands(codexScenario, {
      cwd: '/repo',
      timeoutMs: 1000,
      env: { AZURE_API_KEY: 'sk-live-secret', AMUX_API_BASE: 'https://foundry.example.test', LIVE_STACK_TRACE_ID: 'trace-1' },
    });
    const codexLaunch = codexCommands.at(-1);
    const codexPrompt = codexLaunch?.args[(codexLaunch?.args.indexOf('--prompt') ?? -2) + 1];

    expect(codexPrompt).toMatch(/^\$babysitter:yolo /);
    expect(codexPrompt).toContain('.a5c/processes/summarize-translate-test.mjs');
  });

  it('uses the direct harness runner for yolo plugin commands', async () => {
    const yoloCommand = await fs.readFile(path.join(process.cwd(), 'plugins', 'babysitter-unified', 'commands', 'yolo.md'), 'utf8');

    expect(yoloCommand).toContain('babysitter-agent yolo --harness claude-code');
    expect(yoloCommand).toContain('babysitter-agent yolo --harness codex');
    expect(yoloCommand).not.toContain('instructions:babysit-skill');
    expect(yoloCommand).not.toContain('Invoke the babysitter:babysit skill');
  });

  it('keeps Claude TTY live prompts bounded for interactive and bridged-interactive lanes', () => {
    const scenario = foundryClaudeVanillaScenario();

    for (const env of [
      { LIVE_STACK_INTERACTIVE: 'true' },
      { LIVE_STACK_INTERACTIVE: 'false', LIVE_STACK_BRIDGE_INTERACTIVE: 'true' },
    ]) {
      const prompt = promptFor(scenario, env);

      expect(prompt).toContain('concise 6-section summary');
      expect(prompt).toContain('do not run shell commands');
      expect(prompt).not.toContain('12-paragraph summary');
    }
  });

  it('keeps the full Odyssey task for non-TTY live prompts', () => {
    const claudePrompt = promptFor(foundryClaudeVanillaScenario());
    const codexPrompt = promptFor(liveStackScenarioFromEnv({
      LIVE_STACK_SCENARIO_ID: 'live.agent-mux.codex.foundry-openai.gpt-5.5',
      LIVE_STACK_AGENT_PATH: 'agent-mux',
      LIVE_STACK_AGENT: 'codex',
      LIVE_STACK_AMUX_AGENT: 'codex',
      LIVE_STACK_INTEGRATION_TYPE: 'third-party-plugin',
      LIVE_STACK_INSTALL_MODE: 'babysitter-plugin',
      LIVE_STACK_PROVIDER: 'foundry-openai',
      LIVE_STACK_AMUX_PROVIDER: 'foundry',
      LIVE_STACK_MODEL: 'gpt-5.5',
      LIVE_STACK_CREDENTIAL_MODE: 'github-org-secrets-and-vars',
      LIVE_STACK_REQUIRED_ENV: 'AZURE_API_KEY,AMUX_API_BASE',
      LIVE_STACK_LAYERS: 'babysitter-plugin',
      LIVE_STACK_REQUIRED_TRACE_IDS: 'agentMuxRunId,agentMuxSessionId,transportTraceId',
      LIVE_STACK_EXPECTED_ARTIFACTS: 'agent-mux-events,plugin-command-transcript,transport-mux-trace,provider-trace-redacted',
    }));

    for (const prompt of [claudePrompt, codexPrompt]) {
      expect(prompt).toContain('12-paragraph summary');
      expect(prompt).not.toContain('concise 6-section summary');
    }
  });

  it('runs plugin bridged-hooks through the interactive bridge so slash commands resolve', () => {
    const scenario = primaryLiveStackScenario();
    const commands = buildPrimaryLiveStackCommands(scenario, {
      cwd: '/repo',
      timeoutMs: 1000,
      env: {
        AZURE_API_KEY: 'sk-live-secret',
        AMUX_API_BASE: 'https://foundry.example.test',
        LIVE_STACK_TRACE_ID: 'trace-1',
        LIVE_STACK_INTERACTIVE: 'false',
        LIVE_STACK_BRIDGE_INTERACTIVE: 'true',
        LIVE_STACK_BRIDGE_HOOKS: 'true',
      },
    });

    const launch = commands.at(-1);
    expect(launch?.args).toContain('--no-interactive');
    expect(launch?.args).toContain('--bridge-interactive');
    expect(launch?.args).toContain('--bridge-hooks');
    expect(launch?.args).not.toContain('-p');
  });

  it('pins babysitter-plugin runs to the workspace runs directory', () => {
    const scenario = primaryLiveStackScenario();
    const commands = buildPrimaryLiveStackCommands(scenario, {
      cwd: '/repo',
      timeoutMs: 1000,
      env: { AZURE_API_KEY: 'sk-live-secret', AMUX_API_BASE: 'https://foundry.example.test', LIVE_STACK_TRACE_ID: 'trace-1' },
    });

    for (const command of commands) {
      expect(command.env['BABYSITTER_RUNS_DIR']).toBe(path.join('/repo', '.a5c', 'runs'));
      expect(command.env['BABYSITTER_RUNS_SCOPE']).toBe('repo');
    }
  });

  it('does not pre-create a babysitter run — hooks handle run lifecycle', () => {
    const scenario = primaryLiveStackScenario();
    const commands = buildPrimaryLiveStackCommands(scenario, {
      cwd: '/repo',
      timeoutMs: 1000,
      env: { AZURE_API_KEY: 'sk-live-secret', AMUX_API_BASE: 'https://foundry.example.test', LIVE_STACK_TRACE_ID: 'trace-1' },
    });

    const createRun = commands.find((command) => command.args?.[0] === 'run:create');
    expect(createRun).toBeUndefined();
  });

  it('removes stale create-mode process files before exposing only the skeleton', () => {
    const scenario = primaryLiveStackScenario();
    const commands = buildPrimaryLiveStackCommands(scenario, {
      cwd: '/repo',
      timeoutMs: 1000,
      env: {
        AZURE_API_KEY: 'sk-live-secret',
        AMUX_API_BASE: 'https://foundry.example.test',
        LIVE_STACK_TRACE_ID: 'trace-1',
        LIVE_STACK_PROCESS_MODE: 'create',
      },
    });

    const createSetup = commands.find((command) => command.args.join(' ').includes('odyssey-live-test.skeleton.mjs'));
    const setupScript = createSetup?.args.at(-1) ?? '';

    expect(setupScript).toContain('create-process-skeleton.mjs');
    expect(setupScript).toContain('odyssey-live-test.skeleton.mjs');
    expect(setupScript).toContain('rm -f');
    expect(setupScript).toContain('odyssey-live-test.mjs');
    expect(setupScript).toContain('summarize-translate-test.mjs');
  });

  it('passes explicit Google env to Gemini 3.1 Pro live lanes', () => {
    const scenario = liveStackScenarioFromEnv({
      LIVE_STACK_SCENARIO_ID: 'live.agent-mux.claude-code.google.gemini-3.1-pro',
      LIVE_STACK_AGENT_PATH: 'agent-mux',
      LIVE_STACK_AGENT: 'claude-code',
      LIVE_STACK_AMUX_AGENT: 'claude',
      LIVE_STACK_INTEGRATION_TYPE: 'third-party-plugin',
      LIVE_STACK_INSTALL_MODE: 'vanilla',
      LIVE_STACK_PROVIDER: 'google',
      LIVE_STACK_AMUX_PROVIDER: 'google',
      LIVE_STACK_MODEL: 'gemini-3.1-pro-preview',
      LIVE_STACK_CREDENTIAL_MODE: 'github-org-secrets-and-vars',
      LIVE_STACK_REQUIRED_ENV: 'GOOGLE_API_KEY',
      LIVE_STACK_LAYERS: 'agent-mux install,agent-mux invocation,transport-mux route,provider/model trace',
      LIVE_STACK_REQUIRED_TRACE_IDS: 'agentMuxRunId,agentMuxSessionId,transportTraceId',
      LIVE_STACK_EXPECTED_ARTIFACTS: 'agent-mux-events,transport-mux-trace,provider-trace-redacted',
    });
    const commands = buildPrimaryLiveStackCommands(scenario, {
      cwd: '/repo',
      timeoutMs: 1000,
      env: {
        GOOGLE_API_KEY: 'google-secret',
        LIVE_STACK_TRACE_ID: 'trace-1',
      },
    });

    const launch = commands.at(-1);
    expect(launch?.args).toContain('google');
    expect(launch?.args).toContain('gemini-3.1-pro-preview');
    expect(launch?.env['GOOGLE_API_KEY']).toBe('google-secret');
  });

  it('fails without Foundry credentials and never calls the command executor', async () => {
    const result = await runPrimaryLiveStackScenario({
      cwd: process.cwd(),
      artifactsDir: path.join(os.tmpdir(), 'live-stack-missing-credentials'),
      env: {},
      executeCommand: async () => {
        throw new Error('should not execute commands when credentials are missing');
      },
    });

    expect(result.status).toBe('failed');
    expect(result.failure).toContain('missing live-model credential env');
    expect(result.commands.at(-1)?.command).toBe('amux');
  });

  it('fails credential-present runs unless the explicit live execution flag is set', async () => {
    const result = await runPrimaryLiveStackScenario({
      cwd: process.cwd(),
      artifactsDir: path.join(os.tmpdir(), 'live-stack-opt-in'),
      env: { AZURE_API_KEY: 'sk-live-secret', AMUX_API_BASE: 'https://foundry.example.test' },
      executeCommand: async () => {
        throw new Error('should not execute without live opt-in');
      },
    });

    expect(result.status).toBe('failed');
    expect(result.failure).toBe('LIVE_STACK_RUN_MODEL_TESTS=1 is required to execute live provider scenario');
    expect(JSON.stringify(result)).not.toContain('sk-live-secret');
  });

  it('accepts completed plugin runs when setup also leaves a bare run behind', async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'live-stack-plugin-run-'));
    const artifactsDir = path.join(cwd, 'artifacts');
    const traceId = 'trace-plugin-run';
    const completedRunId = '01KRNFFW81BT433PT8HSTA32NZ';
    const bareRunId = '01KRNFFW81BT433PT8HSTA32NY';

    const result = await runPrimaryLiveStackScenario({
      cwd,
      artifactsDir,
      executeLiveProvider: true,
      env: { AZURE_API_KEY: 'sk-live-secret', AMUX_API_BASE: 'https://foundry.example.test', LIVE_STACK_TRACE_ID: traceId },
      executeCommand: async (command) => {
        if (!command.args.includes('launch')) return { status: 0, stdout: '{}', stderr: '' };

        await fs.mkdir(path.join(cwd, '.a5c-live-test'), { recursive: true });
        await fs.writeFile(path.join(cwd, '.a5c-live-test', `${traceId}-odyssey.md`), '# Odyssey\n\n' + 'Greek text ΑΒΓ '.repeat(80));
        for (const [runId, processId, completed] of [
          [bareRunId, 'bare-run', false],
          [completedRunId, 'processes/shared/local-dev-workflow', true],
        ] as const) {
          const runDir = path.join(cwd, '.a5c', 'runs', runId);
          await fs.mkdir(path.join(runDir, 'journal'), { recursive: true });
          await fs.writeFile(path.join(runDir, 'run.json'), JSON.stringify({ processId, metadata: { completionProof: `${runId}-proof` } }));
          await writeMinimalJournal(path.join(runDir, 'journal'), completed);
        }

        return {
          status: 0,
          stdout: [
            'agentMuxRunId: amux-run-1',
            'agentMuxSessionId: amux-session-1',
            `babysitterRunId: ${completedRunId}`,
            'babysitterEffectId: effect-1',
            'hookEventId: hook-1',
            'hookMuxEventId: hookmux-1',
            `transportTraceId: ${traceId}`,
          ].join('\n'),
          stderr: '',
        };
      },
    });

    expect(result.status).toBe('passed');
    expect(result.failure).toBeUndefined();
  });

  it('requires hooks evidence from interactive plugin lanes', async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'live-stack-plugin-interactive-run-'));
    const artifactsDir = path.join(cwd, 'artifacts');
    const traceId = 'trace-plugin-interactive-run';
    const runId = '01KRNFFW81BT433PT8HSTA32PZ';

    const result = await runPrimaryLiveStackScenario({
      cwd,
      artifactsDir,
      executeLiveProvider: true,
      env: {
        AZURE_API_KEY: 'sk-live-secret',
        AMUX_API_BASE: 'https://foundry.example.test',
        LIVE_STACK_TRACE_ID: traceId,
        LIVE_STACK_INTERACTIVE: 'true',
        LIVE_STACK_BRIDGE_HOOKS: 'false',
      },
      executeCommand: async (command) => {
        if (!command.args.includes('launch')) return { status: 0, stdout: '{}', stderr: '' };

        await fs.mkdir(path.join(cwd, '.a5c-live-test'), { recursive: true });
        await fs.writeFile(path.join(cwd, '.a5c-live-test', `${traceId}-odyssey.md`), '# Odyssey\n\n' + 'Greek text ΑΒΓ '.repeat(80));
        const runDir = path.join(cwd, '.a5c', 'runs', runId);
        await fs.mkdir(path.join(runDir, 'journal'), { recursive: true });
        await fs.writeFile(path.join(runDir, 'run.json'), JSON.stringify({ processId: 'processes/live-stack/summarize-translate-test', metadata: { completionProof: `${runId}-proof` } }));
        await writeMinimalJournal(path.join(runDir, 'journal'), true);
        const hooksDir = path.join(cwd, '.a5c', 'logs', 'hooks');
        await fs.mkdir(hooksDir, { recursive: true });
        await fs.writeFile(path.join(hooksDir, 'session-start.json'), JSON.stringify({ eventId: 'hook-1', status: 'completed' }));

        return {
          status: 0,
          stdout: [
            'agentMuxRunId: amux-run-1',
            'agentMuxSessionId: amux-session-1',
            `babysitterRunId: ${runId}`,
            'babysitterEffectId: effect-1',
            'hookEventId: hook-1',
            'hookMuxEventId: hookmux-1',
            `transportTraceId: ${traceId}`,
          ].join('\n'),
          stderr: '',
        };
      },
    });

    expect(result.status).toBe('passed');
    expect(result.failure).toBeUndefined();
  });
  it('requires hooks evidence from bridged-interactive plugin lanes', async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'live-stack-plugin-bridged-interactive-run-'));
    const artifactsDir = path.join(cwd, 'artifacts');
    const traceId = 'trace-plugin-bridged-interactive-run';
    const runId = '01KRNFFW81BT433PT8HSTA32Q0';

    const result = await runPrimaryLiveStackScenario({
      cwd,
      artifactsDir,
      executeLiveProvider: true,
      env: {
        AZURE_API_KEY: 'sk-live-secret',
        AMUX_API_BASE: 'https://foundry.example.test',
        LIVE_STACK_TRACE_ID: traceId,
        LIVE_STACK_INTERACTIVE: 'false',
        LIVE_STACK_BRIDGE_INTERACTIVE: 'true',
        LIVE_STACK_BRIDGE_HOOKS: 'false',
      },
      executeCommand: async (command) => {
        if (!command.args.includes('launch')) return { status: 0, stdout: '{}', stderr: '' };

        await fs.mkdir(path.join(cwd, '.a5c-live-test'), { recursive: true });
        await fs.writeFile(path.join(cwd, '.a5c-live-test', `${traceId}-odyssey.md`), '# Odyssey\n\n' + 'Greek text ΑΒΓ '.repeat(80));
        const runDir = path.join(cwd, '.a5c', 'runs', runId);
        await fs.mkdir(path.join(runDir, 'journal'), { recursive: true });
        await fs.writeFile(path.join(runDir, 'run.json'), JSON.stringify({ processId: 'processes/live-stack/summarize-translate-test', metadata: { completionProof: `${runId}-proof` } }));
        await writeMinimalJournal(path.join(runDir, 'journal'), true);
        const hooksDir = path.join(cwd, '.a5c', 'logs', 'hooks');
        await fs.mkdir(hooksDir, { recursive: true });
        await fs.writeFile(path.join(hooksDir, 'session-start.json'), JSON.stringify({ eventId: 'hook-1', status: 'completed' }));

        return {
          status: 0,
          stdout: [
            'agentMuxRunId: amux-run-1',
            'agentMuxSessionId: amux-session-1',
            `babysitterRunId: ${runId}`,
            'babysitterEffectId: effect-1',
            'hookEventId: hook-1',
            'hookMuxEventId: hookmux-1',
            `transportTraceId: ${traceId}`,
          ].join('\n'),
          stderr: '',
        };
      },
    });

    expect(result.status).toBe('passed');
    expect(result.failure).toBeUndefined();
  });

  it('requires hook evidence from bridged interactive hook plugin lanes', async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'live-stack-plugin-bridged-hooks-run-'));
    const artifactsDir = path.join(cwd, 'artifacts');
    const traceId = 'trace-plugin-bridged-hooks-run';
    const runId = '01KRNFFW81BT433PT8HSTA32Q1';

    const result = await runPrimaryLiveStackScenario({
      cwd,
      artifactsDir,
      executeLiveProvider: true,
      env: {
        AZURE_API_KEY: 'sk-live-secret',
        AMUX_API_BASE: 'https://foundry.example.test',
        LIVE_STACK_TRACE_ID: traceId,
        LIVE_STACK_INTERACTIVE: 'false',
        LIVE_STACK_BRIDGE_INTERACTIVE: 'true',
        LIVE_STACK_BRIDGE_HOOKS: 'true',
      },
      executeCommand: async (command) => {
        if (!command.args.includes('launch')) return { status: 0, stdout: '{}', stderr: '' };

        await fs.mkdir(path.join(cwd, '.a5c-live-test'), { recursive: true });
        await fs.writeFile(path.join(cwd, '.a5c-live-test', `${traceId}-odyssey.md`), '# Odyssey\n\n' + 'Greek text ΑΒΓ '.repeat(80));
        const runDir = path.join(cwd, '.a5c', 'runs', runId);
        await fs.mkdir(path.join(runDir, 'journal'), { recursive: true });
        await fs.writeFile(path.join(runDir, 'run.json'), JSON.stringify({ processId: 'processes/live-stack/summarize-translate-test', metadata: { completionProof: `${runId}-proof` } }));
        await writeMinimalJournal(path.join(runDir, 'journal'), true);

        return {
          status: 0,
          stdout: [
            'agentMuxRunId: amux-run-1',
            'agentMuxSessionId: amux-session-1',
            `babysitterRunId: ${runId}`,
            'babysitterEffectId: effect-1',
            'hookEventId: hook-1',
            'hookMuxEventId: hookmux-1',
            `transportTraceId: ${traceId}`,
          ].join('\n'),
          stderr: '',
        };
      },
    });

    expect(result.status).toBe('passed');
    const hookCheck = result.verifications?.find(v => v.name === 'stop-hooks');
    expect(hookCheck?.detail).toContain('run completed');
  });

  it('accepts create-mode plugin lanes when Babysitter run proof exists without a persisted process file', async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'live-stack-create-run-proof-'));
    const artifactsDir = path.join(cwd, 'artifacts');
    const traceId = 'trace-create-run-proof';
    const runId = 'run-create-proof';

    const result = await runPrimaryLiveStackScenario({
      cwd,
      artifactsDir,
      executeLiveProvider: true,
      env: {
        AZURE_API_KEY: 'sk-live-secret',
        AMUX_API_BASE: 'https://foundry.example.test',
        LIVE_STACK_TRACE_ID: traceId,
        LIVE_STACK_PROCESS_MODE: 'create',
        LIVE_STACK_INTERACTIVE: 'false',
        LIVE_STACK_BRIDGE_INTERACTIVE: 'true',
        LIVE_STACK_BRIDGE_HOOKS: 'true',
      },
      executeCommand: async (command) => {
        if (!command.args.includes('launch')) return { status: 0, stdout: '{}', stderr: '' };

        await fs.mkdir(path.join(cwd, '.a5c-live-test'), { recursive: true });
        await fs.writeFile(path.join(cwd, '.a5c-live-test', `${traceId}-odyssey.md`), '# Odyssey\n\n' + 'Greek text ΑΒΓ about Homer and Odyssey. '.repeat(80));
        const runDir = path.join(cwd, '.a5c', 'runs', runId);
        await fs.mkdir(path.join(runDir, 'journal'), { recursive: true });
        await fs.writeFile(path.join(runDir, 'run.json'), JSON.stringify({ processId: 'processes/live-stack/summarize-translate-test', metadata: { completionProof: `${runId}-proof` } }));
        await writeMinimalJournal(path.join(runDir, 'journal'), true);

        return {
          status: 0,
          stdout: [
            'agentMuxRunId: amux-run-1',
            'agentMuxSessionId: amux-session-1',
            `babysitterRunId: ${runId}`,
            'babysitterEffectId: effect-1',
            'hookEventId: hook-1',
            'hookMuxEventId: hookmux-1',
            `transportTraceId: ${traceId}`,
          ].join('\n'),
          stderr: '',
        };
      },
    });

    expect(result.status).toBe('passed');
    expect(result.verifications?.find(v => v.name === 'process-creation')?.detail).toContain('run proof');
  });

  it('does not treat bridged auth errors as valid Odyssey artifacts', async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'live-stack-bridged-auth-error-'));
    const artifactsDir = path.join(cwd, 'artifacts');
    const traceId = 'trace-bridged-auth-error';

    const result = await runPrimaryLiveStackScenario({
      cwd,
      artifactsDir,
      executeLiveProvider: true,
      requireRunnable: true,
      env: {
        AZURE_API_KEY: 'sk-live-secret',
        AMUX_API_BASE: 'https://foundry.example.test',
        LIVE_STACK_TRACE_ID: traceId,
        LIVE_STACK_PROCESS_MODE: 'create',
        LIVE_STACK_SCENARIO_ID: 'live.agent-mux.codex.foundry-openai.gpt-5.5',
        LIVE_STACK_AGENT_PATH: 'agent-mux',
        LIVE_STACK_AGENT: 'codex',
        LIVE_STACK_AMUX_AGENT: 'codex',
        LIVE_STACK_INTEGRATION_TYPE: 'third-party-plugin',
        LIVE_STACK_INSTALL_MODE: 'babysitter-plugin',
        LIVE_STACK_PROVIDER: 'foundry-openai',
        LIVE_STACK_AMUX_PROVIDER: 'foundry',
        LIVE_STACK_MODEL: 'gpt-5.5',
        LIVE_STACK_CREDENTIAL_MODE: 'github-org-secrets-and-vars',
        LIVE_STACK_REQUIRED_ENV: 'AZURE_API_KEY,AMUX_API_BASE',
        LIVE_STACK_LAYERS: 'babysitter-plugin',
        LIVE_STACK_REQUIRED_TRACE_IDS: 'agentMuxRunId,agentMuxSessionId,transportTraceId',
        LIVE_STACK_EXPECTED_ARTIFACTS: 'agent-mux-events,plugin-command-transcript,transport-mux-trace,provider-trace-redacted',
      },
      executeCommand: async (command) => {
        if (!command.args.includes('launch')) return { status: 0, stdout: '{}', stderr: '' };
        await fs.mkdir(path.join(cwd, '.a5c-live-test'), { recursive: true });
        await fs.writeFile(path.join(cwd, '.a5c-live-test', `${traceId}-odyssey.md`), 'ERROR: unexpected status 401 Unauthorized\n'.repeat(40));
        return { status: 1, stdout: '', stderr: 'ERROR: unexpected status 401 Unauthorized: Unauthorized, url: http://127.0.0.1:46085/v1/responses' };
      },
    });

    expect(result.status).toBe('failed');
    expect(result.failure).toContain('command failed:');
  });

  it('fails live agents that emit login UI instead of task output', async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'live-stack-login-ui-'));
    const artifactsDir = path.join(cwd, 'artifacts');
    const traceId = 'trace-login-ui';

    const result = await runPrimaryLiveStackScenario({
      cwd,
      artifactsDir,
      executeLiveProvider: true,
      requireRunnable: true,
      env: {
        GOOGLE_API_KEY: 'google-secret',
        LIVE_STACK_TRACE_ID: traceId,
        LIVE_STACK_PROCESS_MODE: 'create',
        LIVE_STACK_SCENARIO_ID: 'live.agent-mux.codex.google.gemini-3.1-pro-preview',
        LIVE_STACK_AGENT_PATH: 'agent-mux',
        LIVE_STACK_AGENT: 'codex',
        LIVE_STACK_AMUX_AGENT: 'codex',
        LIVE_STACK_INTEGRATION_TYPE: 'third-party-plugin',
        LIVE_STACK_INSTALL_MODE: 'babysitter-plugin',
        LIVE_STACK_PROVIDER: 'google',
        LIVE_STACK_AMUX_PROVIDER: 'google',
        LIVE_STACK_MODEL: 'gemini-3.1-pro-preview',
        LIVE_STACK_CREDENTIAL_MODE: 'github-org-secrets-and-vars',
        LIVE_STACK_REQUIRED_ENV: 'GOOGLE_API_KEY',
        LIVE_STACK_LAYERS: 'babysitter-plugin',
        LIVE_STACK_REQUIRED_TRACE_IDS: 'agentMuxRunId,agentMuxSessionId,transportTraceId',
        LIVE_STACK_EXPECTED_ARTIFACTS: 'agent-mux-events,plugin-command-transcript,transport-mux-trace,provider-trace-redacted',
      },
      executeCommand: async (command) => {
        if (!command.args.includes('launch')) return { status: 0, stdout: '{}', stderr: '' };
        await fs.mkdir(path.join(cwd, '.a5c-live-test'), { recursive: true });
        await fs.writeFile(path.join(cwd, '.a5c-live-test', `${traceId}-odyssey.md`), '# Welcome to Codex\n\nPreparing device code login\nRequesting a one-time code\n'.repeat(40));
        return { status: 0, stdout: 'Welcome to Codex\nPreparing device code login\nRequesting a one-time code', stderr: '' };
      },
    });

    expect(result.status).toBe('failed');
    expect(result.failure).toContain('does not contain a valid Odyssey markdown artifact');
  });

  it('fails live agents that request tools without executable tool results', async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'live-stack-empty-tool-use-'));
    const artifactsDir = path.join(cwd, 'artifacts');
    const traceId = 'trace-empty-tool-use';

    const result = await runPrimaryLiveStackScenario({
      cwd,
      artifactsDir,
      executeLiveProvider: true,
      requireRunnable: true,
      env: {
        AZURE_API_KEY: 'sk-live-secret',
        AMUX_API_BASE: 'https://foundry.example.test',
        LIVE_STACK_TRACE_ID: traceId,
        LIVE_STACK_PROCESS_MODE: 'create',
        LIVE_STACK_SCENARIO_ID: 'live.agent-mux.pi.foundry-openai.Kimi-K2.6',
        LIVE_STACK_AGENT_PATH: 'agent-mux',
        LIVE_STACK_AGENT: 'pi',
        LIVE_STACK_AMUX_AGENT: 'pi',
        LIVE_STACK_INTEGRATION_TYPE: 'third-party-plugin',
        LIVE_STACK_INSTALL_MODE: 'babysitter-plugin',
        LIVE_STACK_PROVIDER: 'foundry-openai',
        LIVE_STACK_AMUX_PROVIDER: 'foundry',
        LIVE_STACK_MODEL: 'Kimi-K2.6',
        LIVE_STACK_CREDENTIAL_MODE: 'github-org-secrets-and-vars',
        LIVE_STACK_REQUIRED_ENV: 'AZURE_API_KEY,AMUX_API_BASE',
        LIVE_STACK_LAYERS: 'babysitter-plugin',
        LIVE_STACK_REQUIRED_TRACE_IDS: 'agentMuxRunId,agentMuxSessionId,transportTraceId',
        LIVE_STACK_EXPECTED_ARTIFACTS: 'agent-mux-events,plugin-command-transcript,transport-mux-trace,provider-trace-redacted',
      },
      executeCommand: async (command) => {
        if (!command.args.includes('launch')) return { status: 0, stdout: '{}', stderr: '' };
        const transcript = '{"type":"turn_end","message":{"stopReason":"toolUse"},"toolResults":[]}';
        await fs.mkdir(path.join(cwd, '.a5c-live-test'), { recursive: true });
        await fs.writeFile(path.join(cwd, '.a5c-live-test', `${traceId}-odyssey.md`), transcript.repeat(80));
        return { status: 0, stdout: '', stderr: '[amux launch] agent wrote invalid transcript artifact' };
      },
    });

    expect(result.status).toBe('failed');
    expect(result.failure).toContain('does not contain a valid Odyssey markdown artifact');
  });

  it('fails terminated bridged launches that only bridge transcripts', async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'live-stack-terminated-bridge-'));
    const artifactsDir = path.join(cwd, 'artifacts');
    const traceId = 'trace-terminated-bridge';

    const result = await runPrimaryLiveStackScenario({
      cwd,
      artifactsDir,
      executeLiveProvider: true,
      requireRunnable: true,
      env: {
        AZURE_API_KEY: 'sk-live-secret',
        AMUX_API_BASE: 'https://foundry.example.test',
        LIVE_STACK_TRACE_ID: traceId,
        LIVE_STACK_PROCESS_MODE: 'create',
        LIVE_STACK_SCENARIO_ID: 'live.agent-mux.pi.foundry-openai.Kimi-K2.6',
        LIVE_STACK_AGENT_PATH: 'agent-mux',
        LIVE_STACK_AGENT: 'pi',
        LIVE_STACK_AMUX_AGENT: 'pi',
        LIVE_STACK_INTEGRATION_TYPE: 'third-party-plugin',
        LIVE_STACK_INSTALL_MODE: 'babysitter-plugin',
        LIVE_STACK_PROVIDER: 'foundry-openai',
        LIVE_STACK_AMUX_PROVIDER: 'foundry',
        LIVE_STACK_MODEL: 'Kimi-K2.6',
        LIVE_STACK_CREDENTIAL_MODE: 'github-org-secrets-and-vars',
        LIVE_STACK_REQUIRED_ENV: 'AZURE_API_KEY,AMUX_API_BASE',
        LIVE_STACK_LAYERS: 'babysitter-plugin',
        LIVE_STACK_REQUIRED_TRACE_IDS: 'agentMuxRunId,agentMuxSessionId,transportTraceId',
        LIVE_STACK_EXPECTED_ARTIFACTS: 'agent-mux-events,plugin-command-transcript,transport-mux-trace,provider-trace-redacted',
      },
      executeCommand: async (command) => {
        if (!command.args.includes('launch')) return { status: 0, stdout: '{}', stderr: '' };
        const transcript = '{"type":"message_start","message":{"role":"assistant","content":[],"stopReason":"stop"}}';
        await fs.mkdir(path.join(cwd, '.a5c-live-test'), { recursive: true });
        await fs.writeFile(path.join(cwd, '.a5c-live-test', `${traceId}-odyssey.md`), transcript.repeat(80));
        return {
          status: 143,
          stdout: transcript,
          stderr: '[amux launch] exit=143 captured=3444 chunks=6',
        };
      },
    });

    expect(result.status).toBe('failed');
    expect(result.failure).toContain('command failed:');
  });

  it('fails successful bridged launches that only bridge non-task transcripts', async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'live-stack-invalid-bridge-'));
    const artifactsDir = path.join(cwd, 'artifacts');
    const traceId = 'trace-invalid-bridge';

    const result = await runPrimaryLiveStackScenario({
      cwd,
      artifactsDir,
      executeLiveProvider: true,
      requireRunnable: true,
      env: {
        GOOGLE_API_KEY: 'google-secret',
        LIVE_STACK_TRACE_ID: traceId,
        LIVE_STACK_PROCESS_MODE: 'create',
        LIVE_STACK_SCENARIO_ID: 'live.agent-mux.codex.google.gemini-3.1-pro-preview',
        LIVE_STACK_AGENT_PATH: 'agent-mux',
        LIVE_STACK_AGENT: 'codex',
        LIVE_STACK_AMUX_AGENT: 'codex',
        LIVE_STACK_INTEGRATION_TYPE: 'third-party-plugin',
        LIVE_STACK_INSTALL_MODE: 'babysitter-plugin',
        LIVE_STACK_PROVIDER: 'google',
        LIVE_STACK_AMUX_PROVIDER: 'google',
        LIVE_STACK_MODEL: 'gemini-3.1-pro-preview',
        LIVE_STACK_CREDENTIAL_MODE: 'github-org-secrets-and-vars',
        LIVE_STACK_REQUIRED_ENV: 'GOOGLE_API_KEY',
        LIVE_STACK_LAYERS: 'babysitter-plugin',
        LIVE_STACK_REQUIRED_TRACE_IDS: 'agentMuxRunId,agentMuxSessionId,transportTraceId',
        LIVE_STACK_EXPECTED_ARTIFACTS: 'agent-mux-events,plugin-command-transcript,transport-mux-trace,provider-trace-redacted',
      },
      executeCommand: async (command) => {
        if (!command.args.includes('launch')) return { status: 0, stdout: '{}', stderr: '' };
        await fs.mkdir(path.join(cwd, '.a5c-live-test'), { recursive: true });
        await fs.writeFile(path.join(cwd, '.a5c-live-test', `${traceId}-odyssey.md`), 'terminal transcript without greek markdown\n'.repeat(80));
        return { status: 0, stdout: 'terminal transcript without task output', stderr: '[amux launch] agent wrote invalid transcript artifact' };
      },
    });

    expect(result.status).toBe('failed');
    expect(result.failure).toContain('does not contain a valid Odyssey markdown artifact');
  });

  it('writes a redacted failed artifact when live output lacks required joined trace IDs', async () => {
    const artifactsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'live-stack-artifacts-'));
    const result = await runPrimaryLiveStackScenario({
      cwd: process.cwd(),
      artifactsDir,
      executeLiveProvider: true,
      env: { AZURE_API_KEY: 'sk-live-secret', AMUX_API_BASE: 'https://foundry.example.test', LIVE_STACK_TRACE_ID: 'transport-trace-1' },
      executeCommand: async () => ({
        status: 0,
        stdout: 'transportTraceId: transport-trace-1\nagentMuxRunId: amux-1\nagentMuxSessionId: sess-1',
        stderr: '',
      }),
    });

    expect(result.status).toBe('failed');
    expect(result.missingTraceIds).toEqual(['babysitterRunId', 'babysitterEffectId', 'hookEventId', 'hookMuxEventId']);
    expect(result.artifactPath).toBeDefined();
    const artifact = await fs.readFile(result.artifactPath!, 'utf8');
    expect(artifact).not.toContain('sk-live-secret');
    expect(artifact).toContain('[REDACTED]');
  });

  it('fails provider-backed live runs when the upstream service reports exhausted credits', async () => {
    const artifactsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'live-stack-provider-fail-'));
    const result = await runPrimaryLiveStackScenario({
      cwd: process.cwd(),
      artifactsDir,
      executeLiveProvider: true,
      env: { ANTHROPIC_API_KEY: 'sk-ant-secret', LIVE_STACK_TRACE_ID: 'trace-1', LIVE_STACK_SCENARIO_ID: 'live.agent-mux.claude-code.anthropic-direct.sonnet', LIVE_STACK_AGENT_PATH: 'agent-mux', LIVE_STACK_AGENT: 'claude-code', LIVE_STACK_AMUX_AGENT: 'claude', LIVE_STACK_INTEGRATION_TYPE: 'third-party-plugin', LIVE_STACK_INSTALL_MODE: 'vanilla', LIVE_STACK_PROVIDER: 'anthropic-direct', LIVE_STACK_AMUX_PROVIDER: 'anthropic', LIVE_STACK_MODEL: 'sonnet', LIVE_STACK_CREDENTIAL_MODE: 'github-org-secrets', LIVE_STACK_REQUIRED_ENV: 'ANTHROPIC_API_KEY', LIVE_STACK_LAYERS: 'agent-mux install,agent-mux invocation,transport-mux route,provider/model trace', LIVE_STACK_REQUIRED_TRACE_IDS: 'agentMuxRunId,agentMuxSessionId,transportTraceId', LIVE_STACK_EXPECTED_ARTIFACTS: 'agent-mux-events,transport-mux-trace,provider-trace-redacted' },
      executeCommand: async (command) => command.args.includes('install')
        ? { status: 0, stdout: '{"ok":true}', stderr: '' }
        : { status: 1, stdout: 'Credit balance is too low', stderr: '' },
    });

    expect(result.status).toBe('failed');
    expect(result.failure).toContain('command failed:');
    expect(result.artifactPath).toBeDefined();
  });

  it('fails provider-backed live runs when configured credentials are rejected upstream', async () => {
    const artifactsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'live-stack-provider-auth-fail-'));
    const result = await runPrimaryLiveStackScenario({
      cwd: process.cwd(),
      artifactsDir,
      executeLiveProvider: true,
      env: { AZURE_API_KEY: 'sk-live-secret', AMUX_API_BASE: 'https://foundry.example.test', LIVE_STACK_TRACE_ID: 'trace-1', LIVE_STACK_SCENARIO_ID: 'live.agent-mux.pi.foundry-openai.gpt-5.5', LIVE_STACK_AGENT_PATH: 'agent-mux', LIVE_STACK_AGENT: 'pi', LIVE_STACK_AMUX_AGENT: 'pi', LIVE_STACK_INTEGRATION_TYPE: 'third-party-plugin', LIVE_STACK_INSTALL_MODE: 'vanilla', LIVE_STACK_PROVIDER: 'foundry-openai', LIVE_STACK_AMUX_PROVIDER: 'foundry', LIVE_STACK_MODEL: 'gpt-5.5', LIVE_STACK_CREDENTIAL_MODE: 'github-org-secrets-and-vars', LIVE_STACK_REQUIRED_ENV: 'AZURE_API_KEY,AMUX_API_BASE', LIVE_STACK_LAYERS: 'agent-mux install,agent-mux invocation,transport-mux route,provider/model trace', LIVE_STACK_REQUIRED_TRACE_IDS: 'agentMuxRunId,agentMuxSessionId,transportTraceId', LIVE_STACK_EXPECTED_ARTIFACTS: 'agent-mux-events,transport-mux-trace,provider-trace-redacted' },
      executeCommand: async (command) => command.args.includes('install')
        ? { status: 0, stdout: '{"ok":true}', stderr: '' }
        : { status: 1, stdout: '', stderr: '401 Incorrect API key provided: sk-incorrect' },
    });

    expect(result.status).toBe('failed');
    expect(result.failure).toContain('command failed:');
    expect(result.artifactPath).toBeDefined();
  });

  it('fails Codex live runs when upstream OpenAI auth is missing', async () => {
    const artifactsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'live-stack-provider-codex-auth-fail-'));
    const result = await runPrimaryLiveStackScenario({
      cwd: process.cwd(),
      artifactsDir,
      executeLiveProvider: true,
      env: {
        AZURE_API_KEY: 'sk-live-secret',
        AMUX_API_BASE: 'https://foundry.example.test',
        LIVE_STACK_TRACE_ID: 'trace-1',
        LIVE_STACK_SCENARIO_ID: 'live.agent-mux.codex.foundry-openai.gpt-5.5',
        LIVE_STACK_AGENT_PATH: 'agent-mux',
        LIVE_STACK_AGENT: 'codex',
        LIVE_STACK_AMUX_AGENT: 'codex',
        LIVE_STACK_INTEGRATION_TYPE: 'third-party-plugin',
        LIVE_STACK_INSTALL_MODE: 'vanilla',
        LIVE_STACK_PROVIDER: 'foundry-openai',
        LIVE_STACK_AMUX_PROVIDER: 'foundry',
        LIVE_STACK_MODEL: 'gpt-5.5',
        LIVE_STACK_CREDENTIAL_MODE: 'github-org-secrets-and-vars',
        LIVE_STACK_REQUIRED_ENV: 'AZURE_API_KEY,AMUX_API_BASE',
        LIVE_STACK_LAYERS: 'agent-mux install,agent-mux invocation,vanilla agent prompt,transport-mux route,provider/model trace',
        LIVE_STACK_REQUIRED_TRACE_IDS: 'agentMuxRunId,agentMuxSessionId,transportTraceId',
        LIVE_STACK_EXPECTED_ARTIFACTS: 'agent-mux-events,transport-mux-trace,provider-trace-redacted',
      },
      executeCommand: async (command) => command.args.includes('install')
        ? { status: 0, stdout: '{"ok":true}', stderr: '' }
        : { status: 1, stdout: '', stderr: 'ERROR: unexpected status 401 Unauthorized: Missing bearer or basic authentication in header, url: https://api.openai.com/v1/responses' },
    });

    expect(result.status).toBe('failed');
    expect(result.failure).toContain('command failed:');
    expect(result.artifactPath).toBeDefined();
  });

  it('terminates the command process group when live commands time out', async () => {
    const result = await executeChildProcessCommand({
      command: process.execPath,
      args: ['-e', 'process.on("SIGTERM", () => {}); setInterval(() => {}, 1000);'],
      env: {},
      cwd: process.cwd(),
      timeoutMs: 50,
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('Timed out after 50ms');
  });

  it('executes the primary live provider scenario when explicitly enabled', async () => {
    if (process.env['LIVE_STACK_RUN_MODEL_TESTS'] !== '1') return;
    const result = await runPrimaryLiveStackScenario({
      cwd: process.cwd(),
      artifactsDir: 'artifacts/live-stack',
      executeLiveProvider: true,
      env: process.env,
      executeCommand: executeChildProcessCommand,
      timeoutMs: 5 * 60 * 1000,
    });

    expect(result.status).toBe('passed');
    expect(result.missingTraceIds).toEqual([]);
    expect(result.artifactPath).toBeDefined();
  });
});
