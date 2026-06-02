export type LiveStackProvider = 'foundry-openai' | 'anthropic-direct' | 'google-vertex' | 'google';
export type AgentMuxProviderId = 'foundry' | 'anthropic' | 'vertex' | 'google';
export type LiveStackAgentPath = 'agent-mux' | 'agent-platform' | 'tula';
export type LiveStackIntegrationType = 'third-party-plugin' | 'runtime-cli';
export type LiveStackInstallMode = 'babysitter-plugin' | 'vanilla';
export type LiveStackAgentId = 'claude-code' | 'codex' | 'gemini-cli' | 'pi' | 'agent-platform' | 'tula' | 'internal';
export type LiveStackAgentMuxAgentId = 'claude' | 'codex' | 'gemini' | 'pi' | 'babysitter' | 'tula';

export interface LiveStackModelEntry {
  readonly provider: LiveStackProvider;
  readonly amuxProvider: AgentMuxProviderId;
  readonly model: string;
  readonly credentialMode: 'github-org-secrets-and-vars' | 'github-org-secrets';
  readonly requiredEnv: readonly string[];
}

export interface LiveStackAgentEntry {
  readonly agentPath: LiveStackAgentPath;
  readonly agent: LiveStackAgentId;
  readonly agentMuxAgent: LiveStackAgentMuxAgentId;
  readonly integrationType: LiveStackIntegrationType;
  readonly babysitterHarness?: string;
  readonly installMode: LiveStackInstallMode;
  readonly setupCommands: readonly string[];
}

export interface LiveStackScenario {
  readonly scenarioId: string;
  readonly lane: 'model-backed-live';
  readonly model: LiveStackModelEntry;
  readonly agent: LiveStackAgentEntry;
  readonly layers: readonly string[];
  readonly requiredTraceIds: readonly string[];
  readonly expectedArtifacts: readonly string[];
}

export interface CapabilityStatus {
  readonly runnable: boolean;
  readonly missingEnv: readonly string[];
  readonly failureReason?: string;
}

export interface LiveStackEvidenceBundle {
  readonly scenarioId: string;
  readonly agentMuxRunId?: string;
  readonly agentMuxSessionId?: string;
  readonly babysitterRunId?: string;
  readonly babysitterEffectId?: string;
  readonly hookEventId?: string;
  readonly hookMuxEventId?: string;
  readonly transportTraceId?: string;
  readonly provider: string;
  readonly model: string;
  readonly artifacts: Record<string, string>;
}

export function primaryLiveStackScenario(): LiveStackScenario {
  return createLiveStackScenario({
    scenarioId: 'live.agent-mux.claude-code.foundry-openai.gpt-5.5',
    agentPath: 'agent-mux',
    agent: 'claude-code',
    agentMuxAgent: 'claude',
    integrationType: 'third-party-plugin',
    installMode: 'babysitter-plugin',
    provider: 'foundry-openai',
    amuxProvider: 'foundry',
    model: 'gpt-5.5',
    credentialMode: 'github-org-secrets-and-vars',
    requiredEnv: ['AZURE_API_KEY', 'AMUX_API_BASE'],
    layers: [
      'agent-mux install',
      'agent-mux invocation',
      'generated Babysitter plugin package',
      'Babysitter SDK installation',
      'plugin babysitter command dispatch',
      'session persistence',
      'native stop hook',
      'hooks-mux normalization',
      'transport-mux route',
      'provider/model trace',
    ],
    requiredTraceIds: ['agentMuxRunId', 'agentMuxSessionId', 'babysitterRunId', 'babysitterEffectId', 'hookEventId', 'hookMuxEventId', 'transportTraceId'],
    expectedArtifacts: [
      'agent-mux-events',
      'plugin-command-transcript',
      'babysitter-run-summary',
      'babysitter-task-bundle',
      'hooks-mux-normalized-event',
      'hooks-mux-handler-result',
      'transport-mux-trace',
      'provider-trace-redacted',
    ],
  });
}

export function externalAgentDispatchLiveStackScenario(): LiveStackScenario {
  return createLiveStackScenario({
    scenarioId: 'live.tula.claude-code-external-agent.foundry-openai.gpt-5.5',
    agentPath: 'tula',
    agent: 'tula',
    agentMuxAgent: 'tula',
    integrationType: 'runtime-cli',
    babysitterHarness: 'tula',
    installMode: 'vanilla',
    provider: 'foundry-openai',
    amuxProvider: 'foundry',
    model: 'gpt-5.5',
    credentialMode: 'github-org-secrets-and-vars',
    requiredEnv: ['LIVE_STACK_EXTERNAL_AGENT', 'AZURE_API_KEY', 'AMUX_API_BASE'],
    layers: [
      'tula runtime-cli',
      'tasks-mux responder routing',
      'agent-mux claude-code adapter',
      'external agent cost event',
      'provider/model trace',
    ],
    requiredTraceIds: ['babysitterRunId', 'babysitterEffectId', 'agentMuxRunId', 'transportTraceId'],
    expectedArtifacts: [
      'babysitter-run-summary',
      'babysitter-task-bundle',
      'agent-mux-events',
      'external-agent-cost-event',
      'provider-trace-redacted',
    ],
  });
}

export function liveStackScenarioFromEnv(env: Record<string, string | undefined>): LiveStackScenario {
  if (!env['LIVE_STACK_SCENARIO_ID']) return primaryLiveStackScenario();
  return createLiveStackScenario({
    scenarioId: env['LIVE_STACK_SCENARIO_ID'],
    agentPath: requiredEnvValue(env, 'LIVE_STACK_AGENT_PATH') as LiveStackAgentPath,
    agent: requiredEnvValue(env, 'LIVE_STACK_AGENT') as LiveStackAgentId,
    agentMuxAgent: requiredEnvValue(env, 'LIVE_STACK_AMUX_AGENT') as LiveStackAgentMuxAgentId,
    integrationType: requiredEnvValue(env, 'LIVE_STACK_INTEGRATION_TYPE') as LiveStackIntegrationType,
    babysitterHarness: env['LIVE_STACK_BABYSITTER_HARNESS'],
    installMode: requiredEnvValue(env, 'LIVE_STACK_INSTALL_MODE') as LiveStackInstallMode,
    provider: requiredEnvValue(env, 'LIVE_STACK_PROVIDER') as LiveStackProvider,
    amuxProvider: requiredEnvValue(env, 'LIVE_STACK_AMUX_PROVIDER') as AgentMuxProviderId,
    model: requiredEnvValue(env, 'LIVE_STACK_MODEL'),
    credentialMode: requiredEnvValue(env, 'LIVE_STACK_CREDENTIAL_MODE') as LiveStackModelEntry['credentialMode'],
    requiredEnv: listEnvValue(env, 'LIVE_STACK_REQUIRED_ENV'),
    layers: listEnvValue(env, 'LIVE_STACK_LAYERS'),
    requiredTraceIds: listEnvValue(env, 'LIVE_STACK_REQUIRED_TRACE_IDS'),
    expectedArtifacts: listEnvValue(env, 'LIVE_STACK_EXPECTED_ARTIFACTS'),
  });
}

export function createLiveStackScenario(input: {
  readonly scenarioId: string;
  readonly agentPath: LiveStackAgentPath;
  readonly agent: LiveStackAgentId;
  readonly agentMuxAgent?: LiveStackAgentMuxAgentId;
  readonly integrationType: LiveStackIntegrationType;
  readonly babysitterHarness?: string;
  readonly installMode: LiveStackInstallMode;
  readonly provider: LiveStackProvider;
  readonly amuxProvider: AgentMuxProviderId;
  readonly model: string;
  readonly credentialMode: LiveStackModelEntry['credentialMode'];
  readonly requiredEnv: readonly string[];
  readonly layers: readonly string[];
  readonly requiredTraceIds: readonly string[];
  readonly expectedArtifacts: readonly string[];
}): LiveStackScenario {
  const agentMuxAgent = input.agentMuxAgent ?? agentMuxAgentFor(input.agent);
  return {
    scenarioId: input.scenarioId,
    lane: 'model-backed-live',
    model: {
      provider: input.provider,
      amuxProvider: input.amuxProvider,
      model: input.model,
      credentialMode: input.credentialMode,
      requiredEnv: input.requiredEnv,
    },
    agent: {
      agentPath: input.agentPath,
      agent: input.agent,
      agentMuxAgent,
      integrationType: input.integrationType,
      installMode: input.installMode,
      setupCommands: setupCommandsFor(input.agentPath, input.agent, agentMuxAgent, input.installMode),
      ...(input.babysitterHarness ? { babysitterHarness: input.babysitterHarness } : {}),
    },
    layers: input.layers,
    requiredTraceIds: input.requiredTraceIds,
    expectedArtifacts: input.expectedArtifacts,
  };
}

export function getScenarioCapabilityStatus(scenario: LiveStackScenario, env: Record<string, string | undefined>): CapabilityStatus {
  const missingEnv = scenario.model.requiredEnv.filter((name) => !env[name]);
  return missingEnv.length === 0
    ? { runnable: true, missingEnv }
    : { runnable: false, missingEnv, failureReason: `missing live-model credential env: ${missingEnv.join(', ')}` };
}

export function createEvidenceBundle(
  scenario: LiveStackScenario,
  ids: Partial<Omit<LiveStackEvidenceBundle, 'scenarioId' | 'provider' | 'model' | 'artifacts'>>,
  artifacts: Record<string, string>,
): LiveStackEvidenceBundle {
  return redactLiveStackArtifact({
    scenarioId: scenario.scenarioId,
    provider: scenario.model.provider,
    model: scenario.model.model,
    ...ids,
    artifacts,
  }) as LiveStackEvidenceBundle;
}

export function redactLiveStackArtifact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((entry) => redactLiveStackArtifact(entry));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        isSecretKey(key) ? '[REDACTED]' : redactLiveStackArtifact(entry),
      ]),
    );
  }
  return typeof value === 'string' && looksLikeSecret(value) ? '[REDACTED]' : value;
}

export function assertEvidenceBundleComplete(scenario: LiveStackScenario, bundle: LiveStackEvidenceBundle): string[] {
  return scenario.requiredTraceIds.filter((traceId) => !bundle[traceId as keyof LiveStackEvidenceBundle]);
}

function setupCommandsFor(agentPath: LiveStackAgentPath, agent: LiveStackAgentId, agentMuxAgent: LiveStackAgentMuxAgentId, installMode: LiveStackInstallMode): readonly string[] {
  if (agentPath === 'agent-platform') return ['agent-platform create-run --harness internal'];
  if (agentPath === 'tula') return ['tula call'];
  if (installMode === 'vanilla') return [`amux install ${agentMuxAgent}`, agent === 'agent-platform' ? 'amux run babysitter' : `amux launch ${agentMuxAgent}`];
  return [
    'npm run generate:plugins',
    `amux install ${agentMuxAgent}`,
    'npm install --global ./packages/sdk',
    'npm install --global ./packages/agent-mux/hooks/cli',
    `babysitter harness:install-plugin ${agent}`,
    'mkdir -p .a5c-live-test',
    'cp fixtures/summarize-translate-test.mjs .a5c/processes/',
    agent === 'agent-platform' ? 'amux run babysitter' : `amux launch ${agentMuxAgent}`,
  ];
}

function agentMuxAgentFor(agent: LiveStackAgentId): LiveStackAgentMuxAgentId {
  switch (agent) {
    case 'claude-code':
      return 'claude';
    case 'gemini-cli':
      return 'gemini';
    case 'codex':
    case 'pi':
      return agent;
    case 'agent-platform':
      return 'babysitter';
    case 'tula':
      return 'tula';
    case 'internal':
      return 'babysitter';
  }
}

function requiredEnvValue(env: Record<string, string | undefined>, name: string): string {
  const value = env[name];
  if (!value) throw new Error(`missing pipeline live-stack scenario env: ${name}`);
  return value;
}

function listEnvValue(env: Record<string, string | undefined>, name: string): readonly string[] {
  return requiredEnvValue(env, name).split(',').map((value) => value.trim()).filter(Boolean);
}

function isSecretKey(key: string): boolean {
  return /(api[_-]?key|token|secret|authorization|password|credential)/i.test(key);
}

function looksLikeSecret(value: string): boolean {
  return /^(sk-|pat_|ghp_|xox|Bearer\s+)/i.test(value);
}
