import type { ProviderId, TransportId } from './provider-config.js';
import type { AgentName } from './types.js';

export interface NativeSupportEntry {
  agent: string;
  provider: ProviderId;
  mechanism: string;
}

/**
 * Build native support entries and transport maps from the Atlas catalog.
 * Falls back to empty when the catalog is unavailable.
 */
function buildFromCatalog(): {
  nativeSupport: NativeSupportEntry[];
  harnessDefaultTransport: Record<string, TransportId>;
} {
  try {
    const { listPluginTargetDescriptors, getAgentCatalog } = require('@a5c-ai/agent-catalog') as {
      listPluginTargetDescriptors: () => Array<{
        targetId: string;
        adapterName: string;
        defaultTransportId?: string;
      }>;
      getAgentCatalog: () => {
        providers: Array<{ providerId: string; hostEnvSignals: string[] }>;
        agents: Array<{ agentId: string; providerIds: string[] }>;
      };
    };

    const targets = listPluginTargetDescriptors();

    // Build harness default transport from catalog
    const harnessDefaultTransport: Record<string, TransportId> = {};
    for (const target of targets) {
      if (target.defaultTransportId) {
        harnessDefaultTransport[target.adapterName] = target.defaultTransportId as TransportId;
      }
    }

    // Build native support from catalog agent-provider relationships and
    // transport-family defaults exposed by plugin targets.
    const catalog = getAgentCatalog();
    const nativeSupport: NativeSupportEntry[] = [];
    const addNativeSupport = (agent: string, providerId: string) => {
      if (nativeSupport.some(e => e.agent === agent && e.provider === providerId)) return;
      const provider = catalog.providers.find(p => p.providerId === providerId);
      const mechanism = provider?.hostEnvSignals?.[0] ?? providerId;
      nativeSupport.push({ agent, provider: providerId as ProviderId, mechanism });
    };

    for (const agent of catalog.agents) {
      for (const providerId of agent.providerIds) {
        addNativeSupport(agent.agentId, providerId);
      }
    }

    for (const target of targets) {
      const nativeProviders = target.defaultTransportId
        ? NATIVE_PROVIDERS_BY_TRANSPORT[target.defaultTransportId as TransportId] ?? []
        : [];
      for (const providerId of nativeProviders) {
        addNativeSupport(target.adapterName, providerId);
      }
    }

    return { nativeSupport, harnessDefaultTransport };
  } catch {
    return { nativeSupport: [], harnessDefaultTransport: {} };
  }
}

let _cached: ReturnType<typeof buildFromCatalog> | undefined;
function getCatalogData() {
  if (!_cached) _cached = buildFromCatalog();
  return _cached;
}

const NATIVE_PROVIDERS_BY_TRANSPORT: Partial<Record<TransportId, ProviderId[]>> = {
  anthropic: ['anthropic', 'bedrock', 'vertex'],
  'openai-responses': ['openai', 'ollama'],
  google: ['google', 'vertex'],
};

const PROVIDER_NATIVE_TRANSPORT: Record<string, TransportId> = {
  anthropic: 'anthropic', openai: 'openai-responses', google: 'google',
  groq: 'openai-chat', fireworks: 'openai-chat', together: 'openai-chat',
  deepseek: 'openai-chat', mistral: 'openai-chat', cerebras: 'openai-chat',
  sambanova: 'openai-chat', openrouter: 'openai-chat', ollama: 'openai-chat',
  local: 'openai-chat',
  lmstudio: 'openai-chat',
  vllm: 'openai-chat',
};

export function isNativelySupported(agent: AgentName, provider: ProviderId): boolean {
  return getCatalogData().nativeSupport.some(e => e.agent === agent && e.provider === provider);
}

export function isTransportCompatible(agent: AgentName, provider: ProviderId): boolean {
  const harnessTransport = getCatalogData().harnessDefaultTransport[agent] ?? 'openai-chat';
  const providerTransport = PROVIDER_NATIVE_TRANSPORT[provider];
  if (!providerTransport) return false;
  return harnessTransport === providerTransport;
}

export function getNativeMechanism(agent: AgentName, provider: ProviderId): string | null {
  const entry = getCatalogData().nativeSupport.find(e => e.agent === agent && e.provider === provider);
  return entry?.mechanism ?? null;
}

export function getRequiredProxyTransport(agent: AgentName, provider: ProviderId): TransportId | null {
  if (isNativelySupported(agent, provider)) return null;
  return getCatalogData().harnessDefaultTransport[agent] ?? 'openai-chat';
}

export function getHarnessDefaultTransport(agent: AgentName): TransportId {
  return getCatalogData().harnessDefaultTransport[agent] ?? 'openai-chat';
}
