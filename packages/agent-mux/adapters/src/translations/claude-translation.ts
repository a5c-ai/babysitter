import type { ProviderConfig } from '@a5c-ai/agent-mux-comm';
import type { HarnessProviderTranslation } from '../provider-translation.js';

export function translateForClaude(config: ProviderConfig): HarnessProviderTranslation {
  const env: Record<string, string> = {};
  const args: string[] = [];

  switch (config.provider) {
    case 'anthropic':
      if (config.auth.apiKey) env['ANTHROPIC_API_KEY'] = config.auth.apiKey;
      if (config.model) env['ANTHROPIC_MODEL'] = config.model;
      return { env, args, proxyRequired: false };
    case 'bedrock':
      env['CLAUDE_CODE_USE_BEDROCK'] = '1';
      if (config.params['region']) env['AWS_REGION'] = String(config.params['region']);
      if (config.auth.awsProfile) env['AWS_PROFILE'] = config.auth.awsProfile;
      return { env, args, proxyRequired: false };
    case 'vertex':
      if (/^gemini[-.]/i.test(config.model)) {
        env['ANTHROPIC_API_KEY'] = '';
        return { env, args, proxyRequired: true, proxyExposedTransport: 'anthropic' };
      }
      env['CLAUDE_CODE_USE_VERTEX'] = '1';
      if (config.params['project']) env['GOOGLE_CLOUD_PROJECT'] = String(config.params['project']);
      if (config.params['region']) env['GOOGLE_CLOUD_LOCATION'] = String(config.params['region']);
      return { env, args, proxyRequired: false };
    case 'foundry':
      env['ANTHROPIC_API_KEY'] = '';
      return { env, args, proxyRequired: true, proxyExposedTransport: 'anthropic' };
    case 'ollama': {
      const apiBase = config.params['apiBase'] ? String(config.params['apiBase']) : 'http://localhost:11434';
      env['ANTHROPIC_BASE_URL'] = apiBase;
      env['ANTHROPIC_API_KEY'] = '';
      env['ANTHROPIC_AUTH_TOKEN'] = 'ollama';
      env['CLAUDE_CODE_ATTRIBUTION_HEADER'] = '0';
      // Set all model tier env vars to the Ollama model so Claude doesn't try
      // to use a real Anthropic model name
      if (config.model) {
        env['ANTHROPIC_DEFAULT_SONNET_MODEL'] = config.model;
        env['ANTHROPIC_DEFAULT_OPUS_MODEL'] = config.model;
        env['ANTHROPIC_DEFAULT_HAIKU_MODEL'] = config.model;
      }
      env['CLAUDE_CODE_AUTO_COMPACT_WINDOW'] = '8192';
      return { env, args, proxyRequired: false };
    }
    default:
      env['ANTHROPIC_API_KEY'] = '';
      return { env, args, proxyRequired: true, proxyExposedTransport: 'anthropic' };
  }
}
