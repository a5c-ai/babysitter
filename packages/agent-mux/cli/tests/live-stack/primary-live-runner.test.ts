import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildPrimaryLiveStackCommands, executeChildProcessCommand, runPrimaryLiveStackScenario } from './primary-live-runner';
import { primaryLiveStackScenario } from './scenario-contract';

describe('primary live stack runner contract', () => {
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

  it('skips provider-backed live runs when configured credentials are rejected upstream', async () => {
    const artifactsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'live-stack-provider-auth-skip-'));
    const result = await runPrimaryLiveStackScenario({
      cwd: process.cwd(),
      artifactsDir,
      executeLiveProvider: true,
      env: { AZURE_API_KEY: 'sk-live-secret', AMUX_API_BASE: 'https://foundry.example.test', LIVE_STACK_TRACE_ID: 'trace-1', LIVE_STACK_SCENARIO_ID: 'live.agent-mux.pi.foundry-openai.gpt-5.5', LIVE_STACK_AGENT_PATH: 'agent-mux', LIVE_STACK_AGENT: 'pi', LIVE_STACK_AMUX_AGENT: 'pi', LIVE_STACK_INTEGRATION_TYPE: 'third-party-plugin', LIVE_STACK_INSTALL_MODE: 'vanilla', LIVE_STACK_PROVIDER: 'foundry-openai', LIVE_STACK_AMUX_PROVIDER: 'foundry', LIVE_STACK_MODEL: 'gpt-5.5', LIVE_STACK_CREDENTIAL_MODE: 'github-org-secrets-and-vars', LIVE_STACK_REQUIRED_ENV: 'AZURE_API_KEY,AMUX_API_BASE', LIVE_STACK_LAYERS: 'agent-mux install,agent-mux invocation,transport-mux route,provider/model trace', LIVE_STACK_REQUIRED_TRACE_IDS: 'agentMuxRunId,agentMuxSessionId,transportTraceId', LIVE_STACK_EXPECTED_ARTIFACTS: 'agent-mux-events,transport-mux-trace,provider-trace-redacted' },
      executeCommand: async (command) => command.args.includes('install')
        ? { status: 0, stdout: '{"ok":true}', stderr: '' }
        : { status: 1, stdout: '', stderr: '401 Incorrect API key provided: sk-incorrect' },
    });

    expect(result.status).toBe('skipped');
    expect(result.skipReason).toContain('configured credentials were rejected');
    expect(result.artifactPath).toBeDefined();
  });

  it('skips Codex live runs when upstream OpenAI auth is missing', async () => {
    const artifactsDir = await fs.mkdtemp(path.join(os.tmpdir(), 'live-stack-provider-codex-auth-skip-'));
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

    expect(result.status).toBe('skipped');
    expect(result.skipReason).toContain('configured credentials were rejected');
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
