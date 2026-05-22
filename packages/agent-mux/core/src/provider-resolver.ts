import { PROVIDER_DEFAULTS, translateModelId } from './provider-config.js';
import type { ProviderConfig, ProviderId, TransportId, ProviderAuth } from './provider-config.js';
import { loadProfile, loadProviderDefaults } from './provider-profiles.js';

export interface ResolveProviderInput {
  provider?: ProviderId | string;
  model?: string;
  transport?: TransportId;
  apiKey?: string;
  apiBase?: string;
  region?: string;
  project?: string;
  resourceGroup?: string;
  endpointName?: string;
  authCommand?: string;
  profile?: string;
}

function resolveProviderId(input: ResolveProviderInput): ProviderId {
  if (input.provider && input.provider in PROVIDER_DEFAULTS) {
    return input.provider as ProviderId;
  }
  if (input.provider) {
    // Unknown provider name — pass through as 'custom'
    return 'custom';
  }
  const envProvider = process.env['AMUX_PROVIDER'];
  if (envProvider && envProvider in PROVIDER_DEFAULTS) {
    return envProvider as ProviderId;
  }
  return 'anthropic';
}

function resolveApiKey(providerId: ProviderId, explicit?: string): string | undefined {
  if (explicit) return explicit;
  const amuxKey = process.env['AMUX_API_KEY'];
  if (amuxKey) return amuxKey;
  if (providerId === 'google') {
    return process.env['GOOGLE_API_KEY'] ?? process.env['GEMINI_API_KEY'];
  }
  if (providerId === 'vertex') {
    return process.env['GOOGLE_API_KEY'];
  }
  const defaults = PROVIDER_DEFAULTS[providerId];
  if (defaults.envKey) {
    return process.env[defaults.envKey];
  }
  return undefined;
}

function resolveAuth(providerId: ProviderId, input: ResolveProviderInput): ProviderAuth {
  const defaults = PROVIDER_DEFAULTS[providerId];

  if (input.authCommand) {
    return { type: 'command', command: input.authCommand };
  }

  const authType = defaults.authType;
  const apiKey = resolveApiKey(providerId, input.apiKey);

  switch (authType) {
    case 'api_key':
      return { type: 'api_key', apiKey };
    case 'iam':
      return {
        type: 'iam',
        awsProfile: process.env['AWS_PROFILE'],
        awsSessionToken: process.env['AWS_SESSION_TOKEN'],
      };
    case 'adc':
      return {
        type: 'adc',
        apiKey,
        gcpCredentialsFile: process.env['GOOGLE_APPLICATION_CREDENTIALS'],
      };
    case 'none':
      return { type: 'none' };
    default:
      return { type: authType, apiKey };
  }
}

export function resolveProvider(input: ResolveProviderInput): ProviderConfig {
  // Load profile if specified
  const profileName = input.profile ?? process.env['AMUX_PROFILE'];
  const profile = profileName ? loadProfile(profileName) : null;
  const fileDefaults = loadProviderDefaults();

  // Merge: input > profile > fileDefaults > PROVIDER_DEFAULTS
  const effectiveProvider = input.provider ?? profile?.provider ?? fileDefaults?.provider;
  const providerId = resolveProviderId({ ...input, provider: effectiveProvider });
  const defaults = PROVIDER_DEFAULTS[providerId];

  const transport: TransportId = (input.transport ?? profile?.transport) as TransportId ?? defaults.transport;
  const rawModel = input.model ?? process.env['AMUX_MODEL'] ?? profile?.model ?? fileDefaults?.model ?? defaults.defaultModel;
  const model = translateModelId(rawModel, providerId);

  // Auth: merge profile auth with input auth
  const auth = resolveAuth(providerId, {
    ...input,
    apiKey: input.apiKey ?? profile?.auth?.apiKey,
    authCommand: input.authCommand ?? (profile?.auth?.type === 'command' ? profile.auth.command : undefined),
  });
  if (profile?.auth?.awsProfile && auth.type === 'iam' && !auth.awsProfile) {
    auth.awsProfile = profile.auth.awsProfile;
  }

  // Params: merge profile params with input params
  const params: Record<string, unknown> = {};
  if (profile?.params) {
    Object.assign(params, profile.params);
  }
  const region = input.region ?? process.env['AMUX_REGION'] ?? process.env['GOOGLE_CLOUD_LOCATION'] ?? process.env['VERTEXAI_LOCATION'] ?? process.env['AWS_REGION'] ?? process.env['AWS_REGION_NAME'] ?? params['region'];
  const project = input.project ?? process.env['AMUX_PROJECT'] ?? process.env['GOOGLE_CLOUD_PROJECT'] ?? process.env['VERTEXAI_PROJECT'] ?? params['project'];
  const providersUsingGenericApiBase = new Set(['foundry', 'azure', 'custom', 'local']);
  const amuxApiBase = providersUsingGenericApiBase.has(providerId) ? process.env['AMUX_API_BASE'] : undefined;
  const apiBase = input.apiBase ?? amuxApiBase ?? params['apiBase'];

  if (region) params['region'] = region;
  if (project) params['project'] = project;
  if (apiBase) params['apiBase'] = apiBase;

  // Auto-upgrade google provider to vertex when enterprise credentials are detected
  if (providerId === 'google' && (project || /^true$/i.test(process.env['GOOGLE_GENAI_USE_VERTEXAI'] ?? ''))) {
    params['useVertexAi'] = true;
  }
  if (input.resourceGroup) params['resourceGroup'] = input.resourceGroup;
  if (input.endpointName) params['endpointName'] = input.endpointName;

  // If resolved as 'custom' but original provider name differs, store it
  if (providerId === 'custom' && effectiveProvider && effectiveProvider !== 'custom') {
    params['litellmProvider'] = effectiveProvider;
  }

  return { provider: providerId, model, transport, auth, params };
}
