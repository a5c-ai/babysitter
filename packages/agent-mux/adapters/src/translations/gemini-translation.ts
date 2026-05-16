import type { ProviderConfig, TransportId } from '@a5c-ai/agent-mux-core';
import { getProviderTranslation } from '@a5c-ai/agent-catalog';
import type { ProviderTranslationRecord, ProviderTranslationEnvMapping } from '@a5c-ai/agent-catalog';
import type { HarnessProviderTranslation } from '../provider-translation.js';

function resolveEnvSource(mapping: ProviderTranslationEnvMapping, config: ProviderConfig): string | undefined {
  switch (mapping.source) {
    case 'auth.apiKey':
      return config.auth.apiKey;
    case 'params.region':
      return config.params['region'] != null ? String(config.params['region']) : undefined;
    case 'params.project':
      return config.params['project'] != null ? String(config.params['project']) : undefined;
    default:
      return undefined;
  }
}

function applyRecord(record: ProviderTranslationRecord, config: ProviderConfig): HarnessProviderTranslation {
  const env: Record<string, string> = {};
  const args: string[] = [...record.args];

  if (record.staticEnv) {
    Object.assign(env, record.staticEnv);
  }

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

export function translateForGemini(config: ProviderConfig): HarnessProviderTranslation {
  const record = getProviderTranslation('gemini', config.provider);
  if (record) {
    return applyRecord(record, config);
  }
  return { env: {}, args: [], proxyRequired: true, proxyExposedTransport: 'google' };
}
