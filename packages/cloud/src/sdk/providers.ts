import type { CloudConfig, KubernetesManifest, ProviderConfig, ProviderConfigurationResult } from "../types.js";

function providerSecretName(namespace: string, providerId: string): string {
  return `${namespace}-${providerId}-provider`.replace(/[^a-z0-9-]/gi, "-").toLowerCase();
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
  const providers = config.components.babysitterAgent?.providers ?? [];
  const manifests: KubernetesManifest[] = [];
  const env: Record<string, string> = {};
  const summary: string[] = [];

  for (const provider of providers) {
    const secretName = providerSecretName(config.namespace, provider.id);
    const manifest = providerSecretManifest(config.namespace, secretName, provider);
    if (manifest) {
      manifests.push(manifest);
      env[`PROVIDER_${provider.id.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_SECRET`] = secretName;
    }
    if (provider.defaultModel) {
      env[`PROVIDER_${provider.id.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_DEFAULT_MODEL`] = provider.defaultModel;
    }
    summary.push(`provider ${provider.id}: ${manifest ? "secret rendered" : "secret ref only"}`);
  }

  return {
    manifests,
    env,
    summary,
  };
}

