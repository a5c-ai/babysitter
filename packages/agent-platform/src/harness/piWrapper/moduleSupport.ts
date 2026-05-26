import type { AgentCoreSessionEvent } from "../types";
import {
  BabysitterRuntimeError,
  ErrorCategory,
} from "@a5c-ai/babysitter-sdk";

interface PiModelRegistry {
  find(provider: string, modelId: string): PiModelEntry | undefined;
  getAll(): PiModelEntry[];
  getApiKey?(model: PiModelEntry): Promise<string | null>;
  hasConfiguredAuth?(model: PiModelEntry): boolean;
  getApiKeyAndHeaders?(model: PiModelEntry): Promise<{
    ok: boolean;
    apiKey?: string;
    headers?: Record<string, string>;
    error?: string;
  }>;
  getApiKeyForProvider?(provider: string): Promise<string | undefined>;
}

export interface PiModelEntry {
  id: string;
  provider: string;
  api: string;
  baseUrl: string;
  [key: string]: unknown;
}

interface PiAuthStorage {
  create(path?: string): PiAuthStorage;
}

export interface PiCodingAgentModule {
  createAgentSession: (options?: Record<string, unknown>) => Promise<{
    session: PiAgentSession;
    extensionsResult?: unknown;
    modelFallbackMessage?: string;
  }>;
  DefaultResourceLoader: new (options?: Record<string, unknown>) => {
    reload(): Promise<void>;
  };
  AuthStorage: PiAuthStorage & { create(path?: string): PiAuthStorage };
  ModelRegistry: new (auth: PiAuthStorage, modelsPath?: string) => PiModelRegistry;
  SessionManager: {
    inMemory(): unknown;
  };
  SettingsManager: {
    inMemory(settings?: Record<string, unknown>): unknown;
  };
  createBashToolDefinition?: (cwd: string, options?: Record<string, unknown>) => unknown;
  codingTools?: unknown[];
  readOnlyTools?: unknown[];
  createCodingTools?: (cwd: string, options?: Record<string, unknown>) => unknown[];
  createReadOnlyTools?: (cwd: string, options?: Record<string, unknown>) => unknown[];
}

export interface PiAgentSession {
  prompt(text: string, options?: Record<string, unknown>): Promise<void>;
  steer(text: string): Promise<void>;
  followUp(text: string): Promise<void>;
  subscribe(listener: (event: AgentCoreSessionEvent) => void): () => void;
  bindExtensions?(bindings: { uiContext?: unknown }): Promise<void>;
  executeBash(
    command: string,
    onChunk?: (chunk: string) => void,
    options?: Record<string, unknown>,
  ): Promise<{ output: string; exitCode: number | undefined; cancelled: boolean; truncated: boolean }>;
  abort(): Promise<void>;
  dispose(): void;
  getLastAssistantText(): string | undefined;
  get sessionId(): string;
  get isStreaming(): boolean;
  get messages(): unknown[];
}

const PI_MODULE_ID = "@earendil-works/pi-coding-agent";

const dynamicImportPi: (specifier: string) => Promise<unknown> = (() => {
  if (process.env.VITEST) {
    return (specifier: string) => import(specifier);
  }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function("id", "return import(id)") as (id: string) => Promise<unknown>;
})();

export async function loadPiModule(): Promise<PiCodingAgentModule> {
  try {
    const mod = await dynamicImportPi(PI_MODULE_ID);
    return mod as PiCodingAgentModule;
  } catch {
    throw new BabysitterRuntimeError(
      "PiModuleNotFound",
      "Cannot load @earendil-works/pi-coding-agent — is the package installed?",
      { category: ErrorCategory.Configuration },
    );
  }
}

function normalizeAzureOpenAiBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const normalizedPath = parsed.pathname.replace(/\/+$/, "");
    const isAzureOpenAiHost = /\.openai\.azure\.com$/i.test(parsed.hostname);

    if (normalizedPath === "/openai/v1") {
      return `${parsed.origin}${normalizedPath}`;
    }
    if (normalizedPath === "/openai") {
      return `${parsed.origin}/openai/v1`;
    }
    if (isAzureOpenAiHost && (normalizedPath === "" || normalizedPath === "/")) {
      return `${parsed.origin}/openai/v1`;
    }
  } catch {
    // Fall back to the raw value when the URL cannot be parsed.
  }

  return trimmed;
}

export function configureAzureOpenAiEnvDefaults(requestedModel?: string): void {
  const resourceName = process.env.AZURE_OPENAI_RESOURCE_NAME || process.env.AZURE_OPENAI_PROJECT_NAME;
  if (!process.env.AZURE_OPENAI_RESOURCE_NAME && process.env.AZURE_OPENAI_PROJECT_NAME) {
    process.env.AZURE_OPENAI_RESOURCE_NAME = process.env.AZURE_OPENAI_PROJECT_NAME;
  }
  if (process.env.AZURE_OPENAI_BASE_URL) {
    process.env.AZURE_OPENAI_BASE_URL = normalizeAzureOpenAiBaseUrl(process.env.AZURE_OPENAI_BASE_URL);
  } else if (resourceName) {
    process.env.AZURE_OPENAI_BASE_URL = normalizeAzureOpenAiBaseUrl(`https://${resourceName}.openai.azure.com`);
  }
  if (
    requestedModel &&
    !requestedModel.includes(":") &&
    process.env.AZURE_OPENAI_DEPLOYMENT &&
    !process.env.AZURE_OPENAI_DEPLOYMENT_NAME_MAP
  ) {
    process.env.AZURE_OPENAI_DEPLOYMENT_NAME_MAP = `${requestedModel}=${process.env.AZURE_OPENAI_DEPLOYMENT}`;
  }
}

function synthesizeAzureModelEntry(modelId: string): PiModelEntry | undefined {
  if (!process.env.AZURE_OPENAI_API_KEY) {
    return undefined;
  }
  const resourceName = process.env.AZURE_OPENAI_RESOURCE_NAME || process.env.AZURE_OPENAI_PROJECT_NAME;
  const baseUrl = process.env.AZURE_OPENAI_BASE_URL
    ? normalizeAzureOpenAiBaseUrl(process.env.AZURE_OPENAI_BASE_URL)
    : (resourceName ? normalizeAzureOpenAiBaseUrl(`https://${resourceName}.openai.azure.com`) : undefined);
  if (!baseUrl) {
    return undefined;
  }

  return {
    id: modelId,
    name: modelId,
    provider: "azure-openai-responses",
    api: "openai-responses",
    baseUrl,
    reasoning: true,
    input: ["text"],
    contextWindow: 128000,
    maxTokens: 16384,
    cost: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
    },
  };
}

export function extractAssistantFailure(messages: unknown[] | undefined): string | undefined {
  if (!Array.isArray(messages) || messages.length === 0) {
    return undefined;
  }

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (!message || typeof message !== "object") {
      continue;
    }
    const candidate = message as {
      role?: unknown;
      stopReason?: unknown;
      errorMessage?: unknown;
    };
    if (candidate.role !== "assistant") {
      continue;
    }
    if (candidate.stopReason === "error" && typeof candidate.errorMessage === "string" && candidate.errorMessage.trim()) {
      return candidate.errorMessage.trim();
    }
  }

  return undefined;
}

async function modelHasUsableAuth(
  registry: PiModelRegistry,
  model: PiModelEntry,
): Promise<boolean> {
  if (typeof registry.hasConfiguredAuth === "function") {
    return registry.hasConfiguredAuth(model);
  }

  if (typeof registry.getApiKey === "function") {
    const key = await registry.getApiKey(model);
    return Boolean(key);
  }

  if (typeof registry.getApiKeyAndHeaders === "function") {
    const result = await registry.getApiKeyAndHeaders(model);
    return Boolean(
      result.ok &&
      ((typeof result.apiKey === "string" && result.apiKey.length > 0) ||
        (result.headers && Object.keys(result.headers).length > 0)),
    );
  }

  if (typeof registry.getApiKeyForProvider === "function") {
    const key = await registry.getApiKeyForProvider(model.provider);
    return Boolean(key);
  }

  return false;
}

export async function resolvePiModel(
  mod: PiCodingAgentModule,
  modelStr: string,
): Promise<PiModelEntry | undefined> {
  const auth = mod.AuthStorage.create();
  const registry = new mod.ModelRegistry(auth);

  let resolved: PiModelEntry | undefined;
  if (modelStr.includes(":")) {
    const [provider, modelId] = modelStr.split(":", 2);
    resolved = registry.find(provider, modelId);
  }
  if (!resolved) {
    for (const model of registry.getAll()) {
      if (model.id === modelStr || model.id === modelStr.split(":").pop()) {
        if (await modelHasUsableAuth(registry, model)) {
          resolved = model;
          break;
        }
      }
    }
  }

  return resolved ?? synthesizeAzureModelEntry(modelStr);
}

export function describePiModelResolutionFailure(modelStr: string): string {
  const requestedModel = modelStr.trim();
  const normalized = requestedModel.toLowerCase();

  if (
    normalized.includes("gemini") ||
    normalized.startsWith("google:") ||
    normalized.startsWith("gemini:")
  ) {
    return [
      `Explicit model "${requestedModel}" could not be resolved to a configured internal agent-core model.`,
      "Configure GOOGLE_API_KEY or GEMINI_API_KEY for Gemini/Google models, or choose a model available in the PI model registry.",
    ].join(" ");
  }

  return [
    `Explicit model "${requestedModel}" could not be resolved to a configured internal agent-core model.`,
    "Configure auth for that model, or choose a model available in the PI model registry.",
  ].join(" ");
}
