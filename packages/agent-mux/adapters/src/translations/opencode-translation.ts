import * as fs from 'node:fs';
import type { ProviderConfig, ProviderId } from '@a5c-ai/agent-mux-comm';
import type { HarnessProviderTranslation } from '../provider-translation.js';

function mergeWithExistingConfig(generatedConfig: string): string {
  try {
    const existing = JSON.parse(fs.readFileSync('opencode.json', 'utf-8'));
    const generated = JSON.parse(generatedConfig);
    return JSON.stringify({ ...existing, ...generated });
  } catch {
    return generatedConfig;
  }
}

export function translateForOpenCode(config: ProviderConfig): HarnessProviderTranslation {
  const env: Record<string, string> = {};
  const args: string[] = [];

  // OpenCode has built-in providers for anthropic, openai, google, etc.
  // For these, just set the API key and use the built-in provider directly.
  const builtinProviderMap: Partial<Record<ProviderId, { envKey: string; providerId: string }>> = {
    anthropic: { envKey: 'ANTHROPIC_API_KEY', providerId: 'anthropic' },
    openai: { envKey: 'OPENAI_API_KEY', providerId: 'openai' },
    google: { envKey: 'GOOGLE_GENERATIVE_AI_API_KEY', providerId: 'google' },
  };

  const builtin = builtinProviderMap[config.provider];
  if (builtin) {
    if (config.auth.apiKey) env[builtin.envKey] = config.auth.apiKey;
    env['OPENCODE_CONFIG_CONTENT'] = mergeWithExistingConfig(JSON.stringify({
      $schema: 'https://opencode.ai/config.json',
      model: `${builtin.providerId}/${config.model}`,
    }));
    return { env, args, proxyRequired: false };
  }

  // For providers without a built-in (foundry, etc.), route through the
  // proxy and use opencode's built-in "openai" provider with a custom
  // baseURL pointing at the proxy. No npm package loading needed.
  if (config.auth.apiKey) env['OPENAI_API_KEY'] = config.auth.apiKey;
  env['OPENCODE_CONFIG_CONTENT'] = mergeWithExistingConfig(JSON.stringify({
    $schema: 'https://opencode.ai/config.json',
    provider: {
      openai: {
        options: { baseURL: '' },
      },
    },
    model: `openai/${config.model}`,
  }));
  return { env, args, proxyRequired: true, proxyExposedTransport: 'openai-chat' as any };
}
