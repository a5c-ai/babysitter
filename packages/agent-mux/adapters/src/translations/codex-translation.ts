import type { ProviderConfig } from '@a5c-ai/agent-mux-core';
import type { HarnessProviderTranslation } from '../provider-translation.js';

export function translateForCodex(config: ProviderConfig): HarnessProviderTranslation {
  const env: Record<string, string> = {};
  const args: string[] = [];

  const addOpenAiBaseUrlConfig = (apiBase: string): void => {
    args.push('-c', `openai_base_url=${apiBase}`);
  };

  switch (config.provider) {
    case 'openai':
      if (config.auth.apiKey) env['OPENAI_API_KEY'] = config.auth.apiKey;
      return { env, args, proxyRequired: false };
    case 'ollama':
      // Codex requires v0.81.0+ for --oss / custom provider support (ref: ollama/cmd/launch/codex.go)
      env['OPENAI_API_KEY'] = 'ollama';
      args.push('--oss');
      return { env, args, proxyRequired: false };
    case 'foundry': {
      const apiBase = config.params['apiBase'] ? String(config.params['apiBase']) : undefined;
      if (apiBase) {
        args.push('-c', `model_provider=${config.provider}`);
        args.push('-c', `model_providers.${config.provider}.name=Azure Foundry`);
        args.push('-c', `model_providers.${config.provider}.base_url=${apiBase}/openai`);
        args.push('-c', `model_providers.${config.provider}.env_key=AZURE_API_KEY`);
        args.push('-c', 'model_providers.foundry.query_params.api-version=2025-04-01-preview');
      }
      if (config.auth.apiKey) env['AZURE_API_KEY'] = config.auth.apiKey;
      env['ANTHROPIC_API_KEY'] = '';
      return { env, args, proxyRequired: false };
    }
    case 'custom':
    case 'groq':
    case 'fireworks':
    case 'together':
    case 'deepseek':
    case 'mistral':
    case 'cerebras':
    case 'sambanova':
    case 'openrouter':
      if (config.params['apiBase']) {
        const apiBase = String(config.params['apiBase']);
        env['OPENAI_BASE_URL'] = apiBase;
        addOpenAiBaseUrlConfig(apiBase);
      }
      if (config.auth.apiKey) env['OPENAI_API_KEY'] = config.auth.apiKey;
      env['ANTHROPIC_API_KEY'] = '';
      return { env, args, proxyRequired: false };
    default:
      env['ANTHROPIC_API_KEY'] = '';
      return { env, args, proxyRequired: true, proxyExposedTransport: 'openai-responses' };
  }
}
