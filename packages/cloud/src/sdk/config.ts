import * as fs from "node:fs/promises";

import type {
  CloudConfig,
  DeploymentEnvironment,
  LoadCloudConfigInput,
  TargetConfig,
  ValidationMessage,
  ValidationResult,
} from "../types.js";
import { environmentPreset } from "./environments.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function mergeValue(base: unknown, override: unknown): unknown {
  if (override === undefined) return base;
  if (Array.isArray(base) && Array.isArray(override)) {
    return [...override];
  }
  if (isRecord(base) && isRecord(override)) {
    const next: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(override)) {
      next[key] = mergeValue(next[key], value);
    }
    return next;
  }
  return override;
}

export function mergeCloudConfig(base: CloudConfig, ...overrides: Array<Partial<CloudConfig> | undefined>): CloudConfig {
  let merged: unknown = clone(base);
  for (const override of overrides) {
    if (!override) continue;
    merged = mergeValue(merged, override);
  }
  return merged as CloudConfig;
}

function normalizeEnvironment(value: string | undefined): DeploymentEnvironment | undefined {
  if (!value) return undefined;
  if (value === "minikube" || value === "staging" || value === "prod" || value === "custom") {
    return value;
  }
  return undefined;
}

function normalizeTargetAlias(target: Record<string, unknown>): Record<string, unknown> {
  if (typeof target.type !== "string") {
    return target;
  }
  if (target.type === "gks") {
    return { ...target, type: "gke" as const };
  }
  return target;
}

async function parseConfigFile(configPath: string): Promise<Partial<CloudConfig>> {
  const raw = await fs.readFile(configPath, "utf8");
  if (!configPath.endsWith(".json")) {
    throw new Error(`Only JSON config files are supported right now: ${configPath}`);
  }
  const parsed = JSON.parse(raw) as unknown;
  if (!isRecord(parsed)) {
    throw new Error(`Config file must contain an object: ${configPath}`);
  }
  const candidate = { ...parsed } as Partial<CloudConfig>;
  if (candidate.target) {
    candidate.target = normalizeTargetAlias(candidate.target as unknown as Record<string, unknown>) as unknown as TargetConfig;
  }
  return candidate;
}

function parseEnvOverrides(env: Readonly<NodeJS.ProcessEnv>): Partial<CloudConfig> {
  const environment = normalizeEnvironment(env.A5C_CLOUD_ENVIRONMENT);
  const namespace = env.A5C_CLOUD_NAMESPACE;
  const releaseTag = env.A5C_CLOUD_RELEASE_TAG;
  const imageRegistry = env.A5C_CLOUD_IMAGE_REGISTRY;
  const targetType = env.A5C_CLOUD_TARGET_TYPE;
  const ingressHosts = env.A5C_CLOUD_INGRESS_HOSTS?.split(",").map((entry: string) => entry.trim()).filter((entry: string) => entry.length > 0);
  const target: Partial<TargetConfig> = {};

  if (targetType) {
    (target as { type?: string }).type = targetType === "gks" ? "gke" : targetType;
  }
  if (env.A5C_CLOUD_KUBE_CONTEXT) {
    (target as { kubeContext?: string }).kubeContext = env.A5C_CLOUD_KUBE_CONTEXT;
  }
  if (env.A5C_CLOUD_CLUSTER_NAME) {
    (target as { clusterName?: string }).clusterName = env.A5C_CLOUD_CLUSTER_NAME;
  }
  if (env.A5C_CLOUD_REGION) {
    (target as { region?: string }).region = env.A5C_CLOUD_REGION;
  }
  if (env.A5C_CLOUD_PROJECT_ID) {
    (target as { projectId?: string }).projectId = env.A5C_CLOUD_PROJECT_ID;
  }
  if (env.A5C_CLOUD_RESOURCE_GROUP) {
    (target as { resourceGroup?: string }).resourceGroup = env.A5C_CLOUD_RESOURCE_GROUP;
  }
  if (env.A5C_CLOUD_SUBSCRIPTION_ID) {
    (target as { subscriptionId?: string }).subscriptionId = env.A5C_CLOUD_SUBSCRIPTION_ID;
  }

  return {
    ...(environment ? { environment } : {}),
    ...(namespace ? { namespace } : {}),
    ...(releaseTag ? { releaseTag } : {}),
    ...(imageRegistry ? { imageRegistry } : {}),
    ...(Object.keys(target).length > 0 ? { target: target as TargetConfig } : {}),
    ...(ingressHosts && ingressHosts.length > 0 ? { ingress: { hostnames: ingressHosts } } : {}),
  };
}

function assignPathValue(target: Record<string, unknown>, path: string, value: unknown): void {
  const segments = path.split(".").filter(Boolean);
  if (segments.length === 0) return;
  let cursor: Record<string, unknown> = target;
  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    const current = cursor[segment];
    if (!isRecord(current)) {
      cursor[segment] = {};
    }
    cursor = cursor[segment] as Record<string, unknown>;
  }
  cursor[segments[segments.length - 1]] = value;
}

function parseScalar(raw: string): unknown {
  if (raw === "true") return true;
  if (raw === "false") return false;
  if (raw === "null") return null;
  if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
  if ((raw.startsWith("[") && raw.endsWith("]")) || (raw.startsWith("{") && raw.endsWith("}"))) {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return raw;
    }
  }
  return raw;
}

export function parseSetOverrides(entries: readonly string[]): Partial<CloudConfig> {
  const root: Record<string, unknown> = {};
  for (const entry of entries) {
    const eqIndex = entry.indexOf("=");
    if (eqIndex <= 0) {
      throw new Error(`Invalid --set entry "${entry}". Expected key=value.`);
    }
    const key = entry.slice(0, eqIndex);
    const value = parseScalar(entry.slice(eqIndex + 1));
    assignPathValue(root, key, value);
  }
  return root as Partial<CloudConfig>;
}

export async function loadCloudConfig(input: LoadCloudConfigInput = {}): Promise<CloudConfig> {
  const env = input.env ?? process.env;
  const environment = input.environment
    ?? normalizeEnvironment(env.A5C_CLOUD_ENVIRONMENT)
    ?? "minikube";
  const base = environmentPreset(environment);
  const envOverrides = parseEnvOverrides(env);
  const fileOverrides = input.configPath ? await parseConfigFile(input.configPath) : undefined;
  const setOverrides = input.set && input.set.length > 0 ? parseSetOverrides(input.set) : undefined;
  const merged = mergeCloudConfig(base, envOverrides, fileOverrides, input.overrides, setOverrides);

  if (merged.target.type === "existing" && !merged.target.namespace) {
    merged.target = { ...merged.target, namespace: merged.namespace };
  }

  return merged;
}

function pushMessage(target: ValidationMessage[], path: string, message: string): void {
  target.push({ path, message });
}

export function validateCloudConfig(config: CloudConfig): ValidationResult {
  const errors: ValidationMessage[] = [];
  const warnings: ValidationMessage[] = [];

  if (!config.namespace.trim()) {
    pushMessage(errors, "namespace", "Namespace is required.");
  }
  if (!config.ingress.hostnames.length) {
    pushMessage(errors, "ingress.hostnames", "At least one ingress hostname is required.");
  }
  if (config.krate.api.replicas < 1) {
    pushMessage(errors, "krate.api.replicas", "API must have at least 1 replica.");
  }
  if (config.krate.web.replicas < 1) {
    pushMessage(warnings, "krate.web.replicas", "Web has zero replicas; the deployment will not expose the primary UI.");
  }
  if (config.auth.mode === "bootstrap-admin" && !config.auth.adminUsername.trim()) {
    pushMessage(errors, "auth.adminUsername", "Bootstrap-admin mode requires an admin username.");
  }
  if (config.auth.mode === "local-dev" && !config.auth.defaultAdminPassword && !config.auth.adminPasswordSecretRef) {
    pushMessage(warnings, "auth.defaultAdminPassword", "Local-dev mode will generate a password because none was provided.");
  }

  switch (config.target.type) {
    case "existing":
      if (!config.target.kubeContext.trim()) {
        pushMessage(errors, "target.kubeContext", "Existing-cluster target requires kubeContext.");
      }
      break;
    case "eks":
      if (!config.target.region.trim()) {
        pushMessage(errors, "target.region", "EKS target requires region.");
      }
      if (!config.target.clusterName.trim()) {
        pushMessage(errors, "target.clusterName", "EKS target requires clusterName.");
      }
      break;
    case "aks":
      if (!config.target.subscriptionId.trim()) {
        pushMessage(errors, "target.subscriptionId", "AKS target requires subscriptionId.");
      }
      if (!config.target.resourceGroup.trim()) {
        pushMessage(errors, "target.resourceGroup", "AKS target requires resourceGroup.");
      }
      if (!config.target.clusterName.trim()) {
        pushMessage(errors, "target.clusterName", "AKS target requires clusterName.");
      }
      break;
    case "gke":
      if (!config.target.projectId.trim()) {
        pushMessage(errors, "target.projectId", "GKE target requires projectId.");
      }
      if (!config.target.region.trim()) {
        pushMessage(errors, "target.region", "GKE target requires region.");
      }
      if (!config.target.clusterName.trim()) {
        pushMessage(errors, "target.clusterName", "GKE target requires clusterName.");
      }
      break;
    case "minikube":
      break;
    default:
      pushMessage(errors, "target.type", "Unsupported target type.");
  }

  if (config.agents?.install && config.agents.targets.length === 0) {
    pushMessage(warnings, "agents.targets", "Agent install is enabled with no targets configured.");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
  };
}
