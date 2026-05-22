import type { AgentName, ProviderConfig, TransportId } from '@a5c-ai/agent-mux-core';
import { getHarnessDefaultTransport } from '@a5c-ai/agent-mux-core';
import type { HarnessProviderTranslation } from './provider-translation.js';
import { getProviderTranslation } from '@a5c-ai/agent-catalog';
import type { ProviderTranslationRecord, ProviderTranslationEnvMapping } from '@a5c-ai/agent-catalog';
import { translateForClaude } from './translations/claude-translation.js';
import { translateForCodex } from './translations/codex-translation.js';
import { translateForOpenCode } from './translations/opencode-translation.js';

type TranslationFn = (config: ProviderConfig) => HarnessProviderTranslation;

const TRANSLATION_REGISTRY = new Map<string, TranslationFn>();

export function registerTranslation(agent: string, fn: TranslationFn): void {
  TRANSLATION_REGISTRY.set(agent, fn);
}

// Register harnesses with complex conditional logic that cannot be fully
// expressed as graph data (vertex+gemini reroute, codex foundry config args,
// opencode config generation with fs.readFileSync).
registerTranslation('claude', translateForClaude);
registerTranslation('codex', translateForCodex);
registerTranslation('opencode', translateForOpenCode);

// ---------------------------------------------------------------------------
// Graph-backed translation: resolves env vars, args, and proxy settings
// directly from atlas ProviderTranslation nodes.
// ---------------------------------------------------------------------------

function resolveEnvSource(mapping: ProviderTranslationEnvMapping, config: ProviderConfig): string | undefined {
  switch (mapping.source) {
    case 'auth.apiKey':
      return config.auth.apiKey;
    case 'auth.awsProfile':
      return config.auth.awsProfile;
    case 'params.apiBase':
      return config.params['apiBase'] != null ? String(config.params['apiBase']) : undefined;
    case 'params.region':
      return config.params['region'] != null ? String(config.params['region']) : undefined;
    case 'params.project':
      return config.params['project'] != null ? String(config.params['project']) : undefined;
    case 'config.model':
      return config.model || undefined;
    default:
      return undefined;
  }
}

function applyGraphTranslation(record: ProviderTranslationRecord, config: ProviderConfig): HarnessProviderTranslation {
  const env: Record<string, string> = {};
  const args: string[] = [...record.args];

  // Apply static env vars
  if (record.staticEnv) {
    Object.assign(env, record.staticEnv);
  }

  // Suppress ANTHROPIC_API_KEY for non-Anthropic providers if flagged
  if (record.suppressNonAnthropicKey && config.provider !== 'anthropic') {
    env['ANTHROPIC_API_KEY'] = '';
  }

  // Resolve dynamic env mappings from config
  for (const mapping of record.envMapping) {
    if (mapping.condition === 'present') {
      const value = resolveEnvSource(mapping, config);
      if (value != null) {
        env[mapping.envVar] = value;
      } else if (mapping.fallback != null) {
        env[mapping.envVar] = mapping.fallback;
      }
    }
  }

  return {
    env,
    args,
    proxyRequired: record.proxyRequired,
    proxyExposedTransport: record.proxyExposedTransport as TransportId | undefined,
  };
}

export function translateForHarness(agent: AgentName, config: ProviderConfig, adapter?: { translateProvider?(config: Record<string, unknown>): any }): HarnessProviderTranslation {
  if (adapter?.translateProvider) {
    return adapter.translateProvider(config as unknown as Record<string, unknown>);
  }

  // Use registered function for harnesses with complex conditional logic
  const fn = TRANSLATION_REGISTRY.get(agent);
  if (fn) return fn(config);

  // Resolve from atlas graph for all other harnesses
  const record = getProviderTranslation(agent, config.provider);
  if (record) {
    return applyGraphTranslation(record, config);
  }

  // Ultimate fallback when no graph data exists
  return {
    env: {},
    args: [],
    proxyRequired: true,
    proxyExposedTransport: getHarnessDefaultTransport(agent),
  };
}
