import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import type {
  AgentMuxProvidersFile,
  CloudConfig,
  KubernetesManifest,
  ModelRoutingConfig,
  ProviderAutomationScope,
  ProviderConfig,
  ProviderConfigurationApplyResult,
  ProviderConfigurationResult,
  ProviderCredentialBinding,
  ProviderProfileEntry,
} from "../types.js";

const PROVIDER_DEFAULTS: Readonly<Record<string, {
  transport: string;
  authType: string;
}>> = {
  anthropic: { transport: "anthropic", authType: "api_key" },
  openai: { transport: "openai-responses", authType: "api_key" },
  google: { transport: "google", authType: "api_key" },
  bedrock: { transport: "anthropic", authType: "iam" },
  vertex: { transport: "google", authType: "adc" },
  azure: { transport: "openai-chat", authType: "api_key" },
  foundry: { transport: "openai-chat", authType: "api_key" },
  ollama: { transport: "openai-chat", authType: "none" },
  local: { transport: "openai-chat", authType: "none" },
  openrouter: { transport: "openai-chat", authType: "api_key" },
  groq: { transport: "openai-chat", authType: "api_key" },
  fireworks: { transport: "openai-chat", authType: "api_key" },
  together: { transport: "openai-chat", authType: "api_key" },
  deepseek: { transport: "openai-chat", authType: "api_key" },
  mistral: { transport: "openai-chat", authType: "api_key" },
  cerebras: { transport: "openai-chat", authType: "api_key" },
  sambanova: { transport: "openai-chat", authType: "api_key" },
  custom: { transport: "openai-chat", authType: "api_key" },
  lmstudio: { transport: "openai-chat", authType: "none" },
  vllm: { transport: "openai-chat", authType: "none" },
  "nvidia-nim": { transport: "openai-chat", authType: "api_key" },
  perplexity: { transport: "openai-chat", authType: "api_key" },
  cohere: { transport: "openai-chat", authType: "api_key" },
};

function providerSecretName(namespace: string, providerId: string): string {
  return `${namespace}-${providerId}-provider`.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
}

function providerKey(providerId: string): string {
  return providerId.toUpperCase().replace(/[^A-Z0-9]/g, "_");
}

function toProviderCredentialBindings(provider: ProviderConfig): ProviderCredentialBinding[] {
  return (provider.credentials ?? []).map((credential) => ({
    providerId: provider.id,
    envVar: credential.envVar,
    ...(credential.value ? { value: credential.value } : {}),
    ...(credential.secretRef ? { secretRef: credential.secretRef } : {}),
    required: credential.required !== false,
  }));
}

function resolveProviderDefaults(providerId: string) {
  if (providerId in PROVIDER_DEFAULTS) {
    return PROVIDER_DEFAULTS[providerId];
  }
  return PROVIDER_DEFAULTS.custom;
}

function buildProviderProfile(provider: ProviderConfig): ProviderProfileEntry {
  const defaults = resolveProviderDefaults(provider.id);
  const model = provider.defaultModel ?? provider.models?.[0];
  const params: Record<string, unknown> = {};

  if (!(provider.id in PROVIDER_DEFAULTS)) {
    params.litellmProvider = provider.id;
  }

  return {
    provider: provider.id,
    ...(model ? { model } : {}),
    transport: defaults.transport,
    auth: { type: defaults.authType },
    ...(Object.keys(params).length > 0 ? { params } : {}),
  };
}

function defaultRouting(_config: CloudConfig, providers: readonly ProviderConfig[]): ModelRoutingConfig | undefined {
  return providers
    .map((provider) => provider.defaultModel ? { provider: provider.id, model: provider.defaultModel } : undefined)
    .find((entry): entry is ModelRoutingConfig => entry !== undefined);
}

function buildProviderAutomationPlan(config: CloudConfig): ProviderConfigurationResult["automation"] {
  const configAny = config as unknown as Record<string, unknown>;
  const providers: readonly ProviderConfig[] = (configAny.providerConfigs as readonly ProviderConfig[] | undefined) ?? [];
  const modelRouting: readonly ModelRoutingConfig[] = (configAny.modelRouting as readonly ModelRoutingConfig[] | undefined) ?? [];
  const defaultRoute = defaultRouting(config, providers);

  return {
    scope: "project",
    filePath: ".amux/providers.json",
    providersFile: {
      version: 1,
      ...(defaultRoute ? { defaults: { provider: defaultRoute.provider, model: defaultRoute.model } } : {}),
      profiles: Object.fromEntries(providers.map((provider) => [provider.id, buildProviderProfile(provider)])),
    } satisfies AgentMuxProvidersFile,
    modelRouting,
    credentials: providers.flatMap((provider) => toProviderCredentialBindings(provider)),
  };
}

function resolveProvidersFilePath(scope: ProviderAutomationScope, cwd?: string): string {
  if (scope === "global") {
    return path.join(os.homedir(), ".amux", "providers.json");
  }
  return path.join(cwd ?? process.cwd(), ".amux", "providers.json");
}

function writeProvidersFile(filePath: string, providersFile: AgentMuxProvidersFile): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(providersFile, null, 2)}\n`, {
    encoding: "utf8",
    mode: 0o600,
  });
  try {
    fs.chmodSync(filePath, 0o600);
  } catch {}
}

function providerSecretManifest(
  namespace: string,
  secretName: string,
  provider: ProviderConfig,
): KubernetesManifest | null {
  const stringData: Record<string, string> = {};
  for (const credential of provider.credentials ?? []) {
    if (credential.value) {
      stringData[credential.envVar] = credential.value;
    }
  }

  if (Object.keys(stringData).length === 0) {
    return null;
  }

  return {
    apiVersion: "v1",
    kind: "Secret",
    metadata: {
      name: secretName,
      namespace,
      labels: {
        "app.kubernetes.io/name": provider.id,
        "app.kubernetes.io/component": "provider-config",
      },
    },
    type: "Opaque",
    stringData,
  };
}

export function configureProviders(config: CloudConfig): ProviderConfigurationResult {
  const configAny2 = config as unknown as Record<string, unknown>;
  const providers: readonly ProviderConfig[] = (configAny2.providerConfigs as readonly ProviderConfig[] | undefined) ?? [];
  const manifests: KubernetesManifest[] = [];
  const env: Record<string, string> = {};
  const summary: string[] = [];
  const automation = buildProviderAutomationPlan(config);

  for (const provider of providers) {
    const key = providerKey(provider.id);
    const secretName = providerSecretName(config.namespace, provider.id);
    const manifest = providerSecretManifest(config.namespace, secretName, provider);
    if (manifest) {
      manifests.push(manifest);
      env[`PROVIDER_${key}_SECRET`] = secretName;
    }
    if (provider.defaultModel) {
      env[`PROVIDER_${key}_DEFAULT_MODEL`] = provider.defaultModel;
    }
    summary.push(`provider ${provider.id}: ${manifest ? "secret rendered" : "secret ref only"}`);
  }

  env.BABYSITTER_AGENT_PROVIDER_CONFIG_JSON = JSON.stringify(providers);
  env.BABYSITTER_AGENT_MODEL_ROUTING_JSON = JSON.stringify(automation.modelRouting);
  env.BABYSITTER_AGENT_AMUX_PROVIDERS_FILE_PATH = automation.filePath;
  env.BABYSITTER_AGENT_AMUX_PROVIDERS_FILE_JSON = JSON.stringify(automation.providersFile);
  env.BABYSITTER_AGENT_AMUX_MODEL_ROUTING_JSON = JSON.stringify(automation.modelRouting);
  summary.push(`agent-mux provider config: ${automation.filePath}`);

  return {
    manifests,
    env,
    summary,
    automation,
  };
}

export function applyProviderConfiguration(
  config: CloudConfig,
  options: { readonly cwd?: string; readonly scope?: ProviderAutomationScope } = {},
): ProviderConfigurationApplyResult {
  const planned = configureProviders(config);
  const scope = options.scope ?? config.execution?.providerConfigScope ?? "project";
  const filePath = resolveProvidersFilePath(scope, options.cwd);
  writeProvidersFile(filePath, planned.automation.providersFile);

  return {
    success: true,
    scope,
    filePath,
    providersFile: planned.automation.providersFile,
    modelRouting: planned.automation.modelRouting,
    credentials: planned.automation.credentials,
    summary: [
      `wrote ${scope} provider profile file`,
      `configured ${planned.automation.credentials.length} provider credential binding(s)`,
      ...(planned.automation.modelRouting.length > 0
        ? [`configured ${planned.automation.modelRouting.length} model routing rule(s)`]
        : []),
    ],
  };
}
