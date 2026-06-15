export type ProviderId =
  | 'anthropic' | 'openai' | 'google' | 'bedrock' | 'vertex'
  | 'azure' | 'foundry' | 'ollama' | 'local' | 'openrouter'
  | 'groq' | 'fireworks' | 'together' | 'deepseek' | 'mistral'
  | 'cerebras' | 'sambanova' | 'custom'
  | 'lmstudio' | 'vllm' | 'nvidia-nim' | 'perplexity' | 'cohere';

export type TransportId =
  | 'anthropic' | 'openai-chat' | 'openai-responses' | 'google'
  | 'passthrough' | 'bedrock-converse' | 'vertex-native' | 'azure-foundry';

export interface ProviderAuth {
  type: 'api_key' | 'oauth' | 'iam' | 'adc' | 'service_account' | 'spn' | 'bearer' | 'none' | 'command';
  apiKey?: string;
  token?: string;
  command?: string;
  awsProfile?: string;
  awsRoleArn?: string;
  awsSessionToken?: string;
  gcpCredentialsFile?: string;
  azureTenantId?: string;
  azureClientId?: string;
  azureClientSecret?: string;
}

export interface ProviderConfig {
  provider: ProviderId;
  model: string;
  transport: TransportId;
  auth: ProviderAuth;
  params: Record<string, unknown>;
}

export interface ProviderDefaults {
  transport: TransportId;
  authType: ProviderAuth['type'];
  apiBase: string;
  defaultModel: string;
  envKey?: string;
}

export const PROVIDER_DEFAULTS: Record<ProviderId, ProviderDefaults> = {
  anthropic: { transport: 'anthropic', authType: 'api_key', apiBase: 'https://api.anthropic.com', defaultModel: 'claude-sonnet-4-20250514', envKey: 'ANTHROPIC_API_KEY' },
  openai: { transport: 'openai-responses', authType: 'api_key', apiBase: 'https://api.openai.com', defaultModel: 'gpt-4o', envKey: 'OPENAI_API_KEY' },
  google: { transport: 'google', authType: 'api_key', apiBase: 'https://generativelanguage.googleapis.com', defaultModel: 'gemini-3.1-pro-preview', envKey: 'GOOGLE_API_KEY' },
  bedrock: { transport: 'anthropic', authType: 'iam', apiBase: 'https://bedrock-runtime.{region}.amazonaws.com', defaultModel: 'anthropic.claude-sonnet-4-20250514-v1:0' },
  vertex: { transport: 'google', authType: 'adc', apiBase: 'https://aiplatform.googleapis.com', defaultModel: 'claude-sonnet-4@20250514', envKey: 'GOOGLE_API_KEY' },
  azure: { transport: 'openai-chat', authType: 'api_key', apiBase: 'https://{resource}.openai.azure.com', defaultModel: '', envKey: 'AZURE_API_KEY' },
  foundry: { transport: 'openai-chat', authType: 'api_key', apiBase: 'https://{resource}.services.ai.azure.com', defaultModel: '', envKey: 'AZURE_API_KEY' },
  ollama: { transport: 'openai-chat', authType: 'none', apiBase: 'http://localhost:11434', defaultModel: 'qwen3:latest' },
  local: { transport: 'openai-chat', authType: 'none', apiBase: 'http://localhost:8080', defaultModel: '' },
  openrouter: { transport: 'openai-chat', authType: 'api_key', apiBase: 'https://openrouter.ai/api', defaultModel: 'anthropic/claude-sonnet-4', envKey: 'OPENROUTER_API_KEY' },
  groq: { transport: 'openai-chat', authType: 'api_key', apiBase: 'https://api.groq.com/openai', defaultModel: 'llama-4-scout-17b-16e-instruct', envKey: 'GROQ_API_KEY' },
  fireworks: { transport: 'openai-chat', authType: 'api_key', apiBase: 'https://api.fireworks.ai/inference', defaultModel: 'accounts/fireworks/models/llama-v3p3-70b-instruct', envKey: 'FIREWORKS_API_KEY' },
  together: { transport: 'openai-chat', authType: 'api_key', apiBase: 'https://api.together.xyz', defaultModel: 'meta-llama/Meta-Llama-3.3-70B-Instruct-Turbo', envKey: 'TOGETHER_API_KEY' },
  deepseek: { transport: 'openai-chat', authType: 'api_key', apiBase: 'https://api.deepseek.com', defaultModel: 'deepseek-chat', envKey: 'DEEPSEEK_API_KEY' },
  mistral: { transport: 'openai-chat', authType: 'api_key', apiBase: 'https://api.mistral.ai', defaultModel: 'mistral-large-latest', envKey: 'MISTRAL_API_KEY' },
  cerebras: { transport: 'openai-chat', authType: 'api_key', apiBase: 'https://api.cerebras.ai', defaultModel: 'llama-4-scout-17b-16e-instruct', envKey: 'CEREBRAS_API_KEY' },
  sambanova: { transport: 'openai-chat', authType: 'api_key', apiBase: 'https://api.sambanova.ai', defaultModel: 'Meta-Llama-3.3-70B-Instruct', envKey: 'SAMBANOVA_API_KEY' },
  custom: { transport: 'openai-chat', authType: 'api_key', apiBase: '', defaultModel: '' },
  lmstudio: { transport: 'openai-chat', authType: 'none', apiBase: 'http://localhost:1234', defaultModel: '' },
  vllm: { transport: 'openai-chat', authType: 'none', apiBase: 'http://localhost:8000', defaultModel: '' },
  'nvidia-nim': { transport: 'openai-chat', authType: 'api_key', apiBase: 'https://integrate.api.nvidia.com', defaultModel: '', envKey: 'NVIDIA_API_KEY' },
  perplexity: { transport: 'openai-chat', authType: 'api_key', apiBase: 'https://api.perplexity.ai', defaultModel: 'sonar', envKey: 'PERPLEXITY_API_KEY' },
  cohere: { transport: 'openai-chat', authType: 'api_key', apiBase: 'https://api.cohere.com', defaultModel: 'command-r-plus', envKey: 'COHERE_API_KEY' },
};

/**
 * Maps canonical model IDs to provider-specific formats.
 * Keys are canonical model IDs, values map ProviderId → provider-specific ID.
 */
export const MODEL_TRANSLATION_TABLE: Record<string, Partial<Record<ProviderId, string>>> = {
  'claude-sonnet-4-20250514': {
    anthropic: 'claude-sonnet-4-20250514',
    bedrock: 'anthropic.claude-sonnet-4-20250514-v1:0',
    vertex: 'claude-sonnet-4@20250514',
  },
  'claude-opus-4-20250514': {
    anthropic: 'claude-opus-4-20250514',
    bedrock: 'anthropic.claude-opus-4-20250514-v1:0',
    vertex: 'claude-opus-4@20250514',
  },
  'claude-3-5-haiku-20241022': {
    anthropic: 'claude-3-5-haiku-20241022',
    bedrock: 'anthropic.claude-3-5-haiku-20241022-v1:0',
    vertex: 'claude-3-5-haiku@20241022',
  },
  'claude-opus-4-6-20250610': {
    anthropic: 'claude-opus-4-6-20250610',
    bedrock: 'anthropic.claude-opus-4-6-20250610-v1:0',
    vertex: 'claude-opus-4-6@20250610',
  },
  'claude-sonnet-4-6-20250610': {
    anthropic: 'claude-sonnet-4-6-20250610',
    bedrock: 'anthropic.claude-sonnet-4-6-20250610-v1:0',
    vertex: 'claude-sonnet-4-6@20250610',
  },
};

/**
 * Translate a canonical model ID to the provider-specific format.
 * Returns the original model ID if no translation exists.
 */
export function translateModelId(canonical: string, provider: ProviderId): string {
  const entry = MODEL_TRANSLATION_TABLE[canonical];
  if (!entry) return canonical;
  return entry[provider] ?? canonical;
}
