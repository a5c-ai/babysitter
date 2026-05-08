import { describe, expect, it } from 'vitest';

import {
  assertEvidenceBundleComplete,
  createEvidenceBundle,
  getScenarioCapabilityStatus,
  liveStackScenarioFromEnv,
  primaryLiveStackScenario,
  redactLiveStackArtifact,
} from './scenario-contract';

describe('live stack scenario contract primitives', () => {
  it('declares the primary no-mock agent-mux Claude Code transport flow', () => {
    const scenario = primaryLiveStackScenario();

    expect(scenario.scenarioId).toBe('live.agent-mux.claude-code.foundry-openai.gpt-5.5');
    expect(scenario.model.amuxProvider).toBe('foundry');
    expect(scenario.lane).toBe('model-backed-live');
    expect(scenario.agent.integrationType).toBe('third-party-plugin');
    expect(scenario.agent.installMode).toBe('babysitter-plugin');
    expect(scenario.agent.agentMuxAgent).toBe('claude');
    expect(scenario.agent.setupCommands).toEqual([
      'npm run generate:plugins',
      'amux install claude',
      'npm install --global ./packages/sdk',
      'babysitter harness:install-plugin claude-code',
      'amux launch claude',
    ]);
    expect(scenario.layers).toContain('transport-mux route');
    expect(scenario.layers).toContain('hooks-mux normalization');
    expect(scenario.requiredTraceIds).toContain('transportTraceId');
    expect(scenario.requiredTraceIds).toContain('hookMuxEventId');
    expect(scenario.expectedArtifacts).toContain('provider-trace-redacted');
  });

  it('accepts the scenario selected by pipeline env without enumerating scenarios in code', () => {
    const scenario = liveStackScenarioFromEnv({
      LIVE_STACK_SCENARIO_ID: 'live.babysitter-agent.internal.foundry-openai.gpt-5.5',
      LIVE_STACK_AGENT_PATH: 'babysitter-agent',
      LIVE_STACK_AGENT: 'internal',
      LIVE_STACK_AMUX_AGENT: 'babysitter',
      LIVE_STACK_INTEGRATION_TYPE: 'runtime-cli',
      LIVE_STACK_INSTALL_MODE: 'babysitter-plugin',
      LIVE_STACK_PROVIDER: 'foundry-openai',
      LIVE_STACK_AMUX_PROVIDER: 'foundry',
      LIVE_STACK_MODEL: 'gpt-5.5',
      LIVE_STACK_CREDENTIAL_MODE: 'github-org-secrets-and-vars',
      LIVE_STACK_REQUIRED_ENV: 'AZURE_API_KEY,AMUX_API_BASE',
      LIVE_STACK_LAYERS: 'babysitter-agent create-run,agent-core runtime session,provider/model trace',
      LIVE_STACK_REQUIRED_TRACE_IDS: 'babysitterRunId,babysitterEffectId',
      LIVE_STACK_EXPECTED_ARTIFACTS: 'babysitter-run-summary,babysitter-task-bundle,provider-trace-redacted',
    });

    expect(scenario.agent.integrationType).toBe('runtime-cli');
    expect(scenario.agent.setupCommands).toEqual(['babysitter-agent create-run --harness internal']);
    expect(scenario.requiredTraceIds).toEqual(['babysitterRunId', 'babysitterEffectId']);
  });


  it('accepts pipeline-selected vanilla install mode without Babysitter lifecycle trace requirements', () => {
    const scenario = liveStackScenarioFromEnv({
      LIVE_STACK_SCENARIO_ID: 'live.agent-mux.gemini.foundry-openai.gpt-5.5',
      LIVE_STACK_AGENT_PATH: 'agent-mux',
      LIVE_STACK_AGENT: 'gemini-cli',
      LIVE_STACK_AMUX_AGENT: 'gemini',
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

    expect(scenario.agent.installMode).toBe('vanilla');
    expect(scenario.agent.agentMuxAgent).toBe('gemini');
    expect(scenario.agent.setupCommands).toEqual(['amux install gemini', 'amux launch gemini']);
    expect(scenario.requiredTraceIds).toEqual(['agentMuxRunId', 'agentMuxSessionId', 'transportTraceId']);
  });


  it('accepts pipeline-selected babysitter-agent vanilla scenarios through agent-mux', () => {
    const scenario = liveStackScenarioFromEnv({
      LIVE_STACK_SCENARIO_ID: 'live.agent-mux.babysitter-agent.foundry-openai.gpt-5.5',
      LIVE_STACK_AGENT_PATH: 'agent-mux',
      LIVE_STACK_AGENT: 'babysitter-agent',
      LIVE_STACK_AMUX_AGENT: 'babysitter',
      LIVE_STACK_INTEGRATION_TYPE: 'third-party-plugin',
      LIVE_STACK_BABYSITTER_HARNESS: 'agent-core',
      LIVE_STACK_INSTALL_MODE: 'vanilla',
      LIVE_STACK_PROVIDER: 'foundry-openai',
      LIVE_STACK_AMUX_PROVIDER: 'foundry',
      LIVE_STACK_MODEL: 'gpt-5.5',
      LIVE_STACK_CREDENTIAL_MODE: 'github-org-secrets-and-vars',
      LIVE_STACK_REQUIRED_ENV: 'AZURE_API_KEY,AMUX_API_BASE',
      LIVE_STACK_LAYERS: 'agent-mux install,agent-mux invocation,babysitter-agent runtime,provider/model trace',
      LIVE_STACK_REQUIRED_TRACE_IDS: 'agentMuxRunId,agentMuxSessionId,transportTraceId',
      LIVE_STACK_EXPECTED_ARTIFACTS: 'agent-mux-events,transport-mux-trace,provider-trace-redacted',
    });

    expect(scenario.agent.agent).toBe('babysitter-agent');
    expect(scenario.agent.agentMuxAgent).toBe('babysitter');
    expect(scenario.agent.installMode).toBe('vanilla');
    expect(scenario.agent.babysitterHarness).toBe('agent-core');
    expect(scenario.agent.setupCommands).toEqual(['amux install babysitter', 'amux run babysitter']);
  });

  it('separates live model capability gates from deterministic no-credential execution', () => {
    const scenario = primaryLiveStackScenario();

    expect(getScenarioCapabilityStatus(scenario, {})).toEqual({
      runnable: false,
      missingEnv: ['AZURE_API_KEY', 'AMUX_API_BASE'],
      skipReason: 'missing live-model credential env: AZURE_API_KEY, AMUX_API_BASE',
    });

    expect(getScenarioCapabilityStatus(scenario, { AZURE_API_KEY: 'present', AMUX_API_BASE: 'https://example.services.ai.azure.com' })).toEqual({
      runnable: true,
      missingEnv: [],
    });
  });

  it('builds joined evidence bundles and reports missing trace IDs', () => {
    const scenario = primaryLiveStackScenario();
    const incompleteBundle = createEvidenceBundle(
      scenario,
      { agentMuxRunId: 'amux-run-1', agentMuxSessionId: 'amux-session-1' },
      { 'agent-mux-events': 'artifacts/live-stack/agent-mux-events-amux-run-1.ndjson' },
    );

    expect(assertEvidenceBundleComplete(scenario, incompleteBundle)).toEqual([
      'babysitterRunId',
      'babysitterEffectId',
      'hookEventId',
      'hookMuxEventId',
      'transportTraceId',
    ]);
  });

  it('redacts secrets recursively before artifact upload', () => {
    expect(
      redactLiveStackArtifact({
        provider: 'foundry-openai',
        apiKey: 'sk-test-value',
        nested: { Authorization: 'Bearer live-token', endpoint: 'https://example.services.ai.azure.com' },
        events: [{ token: 'abc123' }, { status: 'ok' }],
      }),
    ).toEqual({
      provider: 'foundry-openai',
      apiKey: '[REDACTED]',
      nested: { Authorization: '[REDACTED]', endpoint: 'https://example.services.ai.azure.com' },
      events: [{ token: '[REDACTED]' }, { status: 'ok' }],
    });
  });
});
