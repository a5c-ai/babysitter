import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildPrimaryLiveStackCommands, executeChildProcessCommand, runPrimaryLiveStackScenario } from './primary-live-runner';
import { primaryLiveStackScenario } from './scenario-contract';

describe('primary live stack runner contract', () => {
  it('builds the babysitter-plugin command chain through generated plugin setup, SDK install, and amux launch', () => {
    const scenario = primaryLiveStackScenario();
    const commands = buildPrimaryLiveStackCommands(scenario, {
      cwd: '/repo',
      timeoutMs: 1000,
      env: { AZURE_API_KEY: 'sk-live-secret', AMUX_API_BASE: 'https://foundry.example.test', LIVE_STACK_TRACE_ID: 'trace-1' },
    });

    expect(commands.map((command) => [command.command, ...command.args])).toEqual([
      ['npm', 'run', 'generate:plugins'],
      ['amux', 'install', 'claude', '--json'],
      ['npm', 'install', '--global', './packages/sdk'],
      ['babysitter', 'harness:install-plugin', 'claude-code', '--workspace', '/repo', '--json'],
      [
        'amux',
        'launch',
        'claude',
        'foundry',
        '--model',
        'gpt-5.5',
        '--with-proxy-if-needed',
        '--proxy-log-level',
        'debug',
        '--session-id',
        'trace-1',
        '--prompt',
        '/babysitter:call Create a tiny proof run for live.agent-mux.claude-code.foundry-openai.gpt-5.5. trace=trace-1; print labels agentMuxSessionId, babysitterRunId, babysitterEffectId, hookEventId, hookMuxEventId, transportTraceId when observable. Verify the stop hook ran.',
        '--max-turns',
        '1',
      ],
    ]);
  });

  it('builds the vanilla command chain through agent-mux install and launch only', () => {
    const scenario = primaryLiveStackScenario();
    const vanillaScenario = {
      ...scenario,
      agent: { ...scenario.agent, installMode: 'vanilla' as const, setupCommands: ['amux install claude', 'amux launch claude'] },
      requiredTraceIds: ['agentMuxRunId', 'agentMuxSessionId', 'transportTraceId'],
      expectedArtifacts: ['agent-mux-events', 'transport-mux-trace', 'provider-trace-redacted'],
    };
    const commands = buildPrimaryLiveStackCommands(vanillaScenario, {
      cwd: '/repo',
      timeoutMs: 1000,
      env: { AZURE_API_KEY: 'sk-live-secret', AMUX_API_BASE: 'https://foundry.example.test', LIVE_STACK_TRACE_ID: 'trace-1' },
    });

    expect(commands.map((command) => [command.command, ...command.args])).toEqual([
      ['amux', 'install', 'claude', '--json'],
      [
        'amux',
        'launch',
        'claude',
        'foundry',
        '--model',
        'gpt-5.5',
        '--with-proxy-if-needed',
        '--proxy-log-level',
        'debug',
        '--session-id',
        'trace-1',
        '--prompt',
        'Run a tiny vanilla agent-mux proof for live.agent-mux.claude-code.foundry-openai.gpt-5.5. trace=trace-1; print labels agentMuxSessionId and transportTraceId when observable. Do not invoke Babysitter commands.',
        '--max-turns',
        '1',
      ],
    ]);
  });

  it('keeps Claude Code live lanes on Foundry GPT-5.5 through transport-mux', () => {
    const scenario = primaryLiveStackScenario();
    const commands = buildPrimaryLiveStackCommands(scenario, {
      cwd: '/repo',
      timeoutMs: 1000,
      env: { AZURE_API_KEY: 'sk-live-secret', AMUX_API_BASE: 'https://foundry.example.test', LIVE_STACK_TRACE_ID: 'trace-1' },
    });

    const launch = commands.at(-1);
    expect(launch?.args).toContain('foundry');
    expect(launch?.args).toContain('gpt-5.5');
    expect(launch?.args).toContain('--with-proxy-if-needed');
    expect(launch?.args).not.toContain('anthropic');
    expect(launch?.args).not.toContain('sonnet');
  });


  it('routes babysitter-agent scenarios through amux run with the selected harness', () => {
    const scenario = primaryLiveStackScenario();
    const babysitterScenario = {
      ...scenario,
      scenarioId: 'live.agent-mux.babysitter-agent.foundry-openai.gpt-5.5',
      agent: { ...scenario.agent, agent: 'babysitter-agent' as const, agentMuxAgent: 'babysitter' as const, installMode: 'vanilla' as const, babysitterHarness: 'agent-core', setupCommands: ['amux install babysitter', 'amux run babysitter'] },
      requiredTraceIds: ['agentMuxRunId', 'agentMuxSessionId', 'transportTraceId'],
      expectedArtifacts: ['agent-mux-events', 'transport-mux-trace', 'provider-trace-redacted'],
    };
    const commands = buildPrimaryLiveStackCommands(babysitterScenario, {
      cwd: '/repo',
      timeoutMs: 1000,
      env: { AZURE_API_KEY: 'sk-live-secret', AMUX_API_BASE: 'https://foundry.example.test', LIVE_STACK_TRACE_ID: 'trace-1' },
    });

    expect(commands.map((command) => [command.command, ...command.args])).toEqual([
      ['amux', 'install', 'babysitter', '--json'],
      [
        'amux',
        'run',
        'babysitter',
        '--model',
        'gpt-5.5',
        '--cwd',
        '/repo',
        '--output-format',
        'jsonl',
        '--env',
        'BABYSITTER_HARNESS=agent-core',
        '--prompt',
        'Run a tiny vanilla agent-mux proof for live.agent-mux.babysitter-agent.foundry-openai.gpt-5.5. trace=trace-1; print labels agentMuxSessionId and transportTraceId when observable. Do not invoke Babysitter commands.',
        '--max-turns',
        '1',
        '--non-interactive',
        '--json',
      ],
    ]);
    expect(commands[0]?.env['BABYSITTER_HARNESS']).toBe('agent-core');
    expect(commands[1]?.env['BABYSITTER_HARNESS']).toBe('agent-core');
  });

  it('skips safely without Foundry credentials and never calls the command executor', async () => {
    const result = await runPrimaryLiveStackScenario({
      cwd: process.cwd(),
      artifactsDir: path.join(os.tmpdir(), 'live-stack-skipped'),
      env: {},
      executeCommand: async () => {
        throw new Error('should not execute commands when credentials are missing');
      },
    });

    expect(result.status).toBe('skipped');
    expect(result.skipReason).toContain('missing live-model credential env');
    expect(result.commands.at(-1)?.command).toBe('amux');
  });

  it('skips credential-present runs unless the explicit live execution flag is set', async () => {
    const result = await runPrimaryLiveStackScenario({
      cwd: process.cwd(),
      artifactsDir: path.join(os.tmpdir(), 'live-stack-opt-in'),
      env: { AZURE_API_KEY: 'sk-live-secret', AMUX_API_BASE: 'https://foundry.example.test' },
      executeCommand: async () => {
        throw new Error('should not execute without live opt-in');
      },
    });

    expect(result.status).toBe('skipped');
    expect(result.skipReason).toBe('set LIVE_STACK_RUN_MODEL_TESTS=1 to execute live provider scenario');
    expect(JSON.stringify(result)).not.toContain('sk-live-secret');
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

  it('skips provider-backed live runs when the upstream service reports exhausted credits', async () => {
    const artifactsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'live-stack-provider-skip-'));
    const result = await runPrimaryLiveStackScenario({
      cwd: process.cwd(),
      artifactsDir,
      executeLiveProvider: true,
      env: { ANTHROPIC_API_KEY: 'sk-ant-secret', LIVE_STACK_TRACE_ID: 'trace-1', LIVE_STACK_SCENARIO_ID: 'live.agent-mux.claude-code.anthropic-direct.sonnet', LIVE_STACK_AGENT_PATH: 'agent-mux', LIVE_STACK_AGENT: 'claude-code', LIVE_STACK_AMUX_AGENT: 'claude', LIVE_STACK_INTEGRATION_TYPE: 'third-party-plugin', LIVE_STACK_INSTALL_MODE: 'vanilla', LIVE_STACK_PROVIDER: 'anthropic-direct', LIVE_STACK_AMUX_PROVIDER: 'anthropic', LIVE_STACK_MODEL: 'sonnet', LIVE_STACK_CREDENTIAL_MODE: 'github-org-secrets', LIVE_STACK_REQUIRED_ENV: 'ANTHROPIC_API_KEY', LIVE_STACK_LAYERS: 'agent-mux install,agent-mux invocation,transport-mux route,provider/model trace', LIVE_STACK_REQUIRED_TRACE_IDS: 'agentMuxRunId,agentMuxSessionId,transportTraceId', LIVE_STACK_EXPECTED_ARTIFACTS: 'agent-mux-events,transport-mux-trace,provider-trace-redacted' },
      executeCommand: async (command) => command.args.includes('install')
        ? { status: 0, stdout: '{"ok":true}', stderr: '' }
        : { status: 1, stdout: 'Credit balance is too low', stderr: '' },
    });

    expect(result.status).toBe('skipped');
    expect(result.skipReason).toContain('credit balance is too low');
    expect(result.artifactPath).toBeDefined();
  });

  const liveIt = process.env['LIVE_STACK_RUN_MODEL_TESTS'] === '1' ? it : it.skip;

  liveIt('executes the primary live provider scenario when explicitly enabled', async () => {
    const result = await runPrimaryLiveStackScenario({
      cwd: process.cwd(),
      artifactsDir: 'artifacts/live-stack',
      executeLiveProvider: true,
      env: process.env,
      executeCommand: executeChildProcessCommand,
      timeoutMs: 20 * 60 * 1000,
    });

    expect(result.status).toBe('passed');
    expect(result.missingTraceIds).toEqual([]);
    expect(result.artifactPath).toBeDefined();
  });
});
