import { execFile } from "node:child_process";

export interface ExternalAgentInfo {
  name: string;
  displayName: string;
  installed: boolean;
  authenticated: boolean;
  capabilities: string[];
}

export interface ExternalAgentDiscovery {
  available: boolean;
  agents: ExternalAgentInfo[];
  defaultProvider: string | null;
  defaultModel: string | null;
}

export interface ExternalAgentDiscoveryOptions {
  timeout?: number;
  cwd?: string;
  force?: boolean;
}

type AuthStatus = "authenticated" | "unauthenticated" | "expired" | "unknown" | string;

interface AmuxAdapterInfo {
  agent?: string;
  name?: string;
  displayName?: string;
}

interface AmuxInstalledInfo {
  agent?: string;
  name?: string;
  installed?: boolean;
  authState?: AuthStatus;
  activeModel?: string | null;
}

interface AmuxModelInfo {
  modelId?: string;
  id?: string;
  name?: string;
}

interface AmuxAdapterRegistry {
  list?(): AmuxAdapterInfo[];
  installed?(): Promise<AmuxInstalledInfo[]>;
  capabilities?(agent: string): unknown;
}

interface AmuxModelRegistry {
  defaultModel?(agent: string): AmuxModelInfo | string | null;
}

interface AgentMuxClientLike {
  adapters?: AmuxAdapterRegistry;
  models?: AmuxModelRegistry;
}

interface AmuxModuleLike {
  createClient?(options?: Record<string, unknown>): AgentMuxClientLike;
}

interface CacheEntry {
  expiresAt: number;
  value: ExternalAgentDiscovery;
}

const CACHE_TTL_MS = 60_000;
const DEFAULT_TIMEOUT_MS = 5_000;
const AGENT_MUX_PACKAGE = "@a5c-ai/adapters";
const UNAVAILABLE_RESULT: ExternalAgentDiscovery = {
  available: false,
  agents: [],
  defaultProvider: null,
  defaultModel: null,
};

let cacheEntry: CacheEntry | null = null;
let moduleOverride: AmuxModuleLike | null | undefined;

export async function discoverExternalAgents(
  options: ExternalAgentDiscoveryOptions = {},
): Promise<ExternalAgentDiscovery> {
  if (!options.force && cacheEntry && Date.now() < cacheEntry.expiresAt) {
    return cloneDiscovery(cacheEntry.value);
  }

  const moduleResult = await discoverViaModule(options);
  const result = moduleResult ?? await discoverViaCli(options) ?? UNAVAILABLE_RESULT;

  cacheEntry = {
    value: cloneDiscovery(result),
    expiresAt: Date.now() + CACHE_TTL_MS,
  };

  return cloneDiscovery(result);
}

async function discoverViaModule(
  options: ExternalAgentDiscoveryOptions,
): Promise<ExternalAgentDiscovery | null> {
  try {
    const adapters = await loadAmuxModule();
    const createClient = adapters?.createClient;
    if (typeof createClient !== "function") {
      return null;
    }

    const client = createClient({
      defaultAgent: process.env.AGENT_MUX_PROVIDER,
      defaultModel: process.env.AGENT_MUX_MODEL,
      cwd: options.cwd,
    });
    const adapters = client?.adapters;
    if (!adapters || typeof adapters.list !== "function" || typeof adapters.installed !== "function") {
      return null;
    }

    const adapterInfos = adapters.list();
    const installedInfos = await adapters.installed();
    const installedByAgent = new Map(
      installedInfos.map((info) => [normalizeAgentName(info), info]),
    );

    const agents = adapterInfos
      .map((info) => normalizeModuleAgent(info, installedByAgent.get(normalizeAgentName(info)), adapters))
      .filter((agent): agent is ExternalAgentInfo => agent !== null)
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      available: true,
      agents,
      defaultProvider: defaultProvider(),
      defaultModel: defaultModel(client, installedInfos),
    };
  } catch {
    return null;
  }
}

async function loadAmuxModule(): Promise<AmuxModuleLike | null> {
  if (moduleOverride !== undefined) {
    return moduleOverride;
  }

  try {
    return await import(AGENT_MUX_PACKAGE) as AmuxModuleLike;
  } catch {
    return null;
  }
}

function normalizeModuleAgent(
  info: AmuxAdapterInfo,
  installedInfo: AmuxInstalledInfo | undefined,
  adapters: AmuxAdapterRegistry,
): ExternalAgentInfo | null {
  const name = normalizeAgentName(info);
  if (!name) {
    return null;
  }

  return {
    name,
    displayName: typeof info.displayName === "string" && info.displayName.length > 0
      ? info.displayName
      : name,
    installed: installedInfo?.installed === true,
    authenticated: installedInfo?.authState === "authenticated",
    capabilities: normalizeCapabilities(readCapabilities(adapters, name)),
  };
}

function readCapabilities(adapters: AmuxAdapterRegistry, agent: string): unknown {
  if (typeof adapters.capabilities !== "function") {
    return [];
  }
  try {
    return adapters.capabilities(agent);
  } catch {
    return [];
  }
}

async function discoverViaCli(
  options: ExternalAgentDiscoveryOptions,
): Promise<ExternalAgentDiscovery | null> {
  try {
    const stdout = await execFilePromise(
      "adapters",
      ["doctor", "--json"],
      {
        cwd: options.cwd,
        timeout: options.timeout ?? DEFAULT_TIMEOUT_MS,
      },
    );
    const parsed = JSON.parse(stdout) as unknown;
    const report = unwrapDoctorReport(parsed);
    const agents = Array.isArray(report?.agents)
      ? report.agents
        .map((agent) => normalizeCliAgent(agent))
        .filter((agent): agent is ExternalAgentInfo => agent !== null)
      : [];

    return {
      available: true,
      agents,
      defaultProvider: defaultProvider(),
      defaultModel: defaultModelFromEnv(),
    };
  } catch {
    return null;
  }
}

function execFilePromise(
  command: string,
  args: string[],
  options: { cwd?: string; timeout: number },
): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      command,
      args,
      {
        cwd: options.cwd,
        timeout: options.timeout,
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(String(stdout ?? "").trim());
      },
    );

    child.on("error", reject);
  });
}

function unwrapDoctorReport(value: unknown): Record<string, unknown> | null {
  if (!isRecord(value)) {
    return null;
  }

  for (const key of ["data", "report", "result"]) {
    const nested = value[key];
    if (isRecord(nested) && Array.isArray(nested.agents)) {
      return nested;
    }
  }

  return Array.isArray(value.agents) ? value : null;
}

function normalizeCliAgent(value: unknown): ExternalAgentInfo | null {
  if (!isRecord(value)) {
    return null;
  }

  const name = normalizeAgentName(value);
  if (!name) {
    return null;
  }

  const install = isRecord(value.install) ? value.install : {};
  const auth = isRecord(value.auth) ? value.auth : {};

  return {
    name,
    displayName: typeof value.displayName === "string" && value.displayName.length > 0
      ? value.displayName
      : name,
    installed: install.installed === true || value.installed === true,
    authenticated: auth.status === "authenticated" || value.authState === "authenticated",
    capabilities: normalizeCapabilities(value.capabilities),
  };
}

function defaultProvider(): string | null {
  return nonEmptyString(process.env.AGENT_MUX_PROVIDER);
}

function defaultModel(client: AgentMuxClientLike, installedInfos: AmuxInstalledInfo[]): string | null {
  const envDefault = defaultModelFromEnv();
  if (envDefault) {
    return envDefault;
  }

  const provider = defaultProvider();
  if (provider && typeof client.models?.defaultModel === "function") {
    try {
      const model = client.models.defaultModel(provider);
      if (typeof model === "string") {
        return nonEmptyString(model);
      }
      if (isRecord(model)) {
        return nonEmptyString(model.modelId) ?? nonEmptyString(model.id) ?? nonEmptyString(model.name);
      }
    } catch {
      // Ignore model-registry failures; discovery itself is still useful.
    }
  }

  if (provider) {
    const activeModel = installedInfos.find((info) => normalizeAgentName(info) === provider)?.activeModel;
    return nonEmptyString(activeModel);
  }

  return null;
}

function defaultModelFromEnv(): string | null {
  return nonEmptyString(process.env.AGENT_MUX_MODEL);
}

function normalizeAgentName(value: unknown): string {
  if (!isRecord(value)) {
    return "";
  }
  return nonEmptyString(value.agent) ?? nonEmptyString(value.name) ?? "";
}

function normalizeCapabilities(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.length > 0);
  }

  if (!isRecord(value)) {
    return [];
  }

  const capabilities = new Set<string>();
  addCapability(capabilities, value.supportsNativeTools, "file-edit");
  addCapability(capabilities, value.supportsNativeTools, "bash");
  addCapability(capabilities, value.supportsInteractiveMode, "browser");
  addCapability(capabilities, value.supportsMCP, "mcp");
  addCapability(capabilities, value.supportsSkills, "skills");
  addCapability(capabilities, value.supportsSubagentDispatch, "subagents");
  addCapability(capabilities, value.supportsParallelExecution, "parallel");
  addCapability(capabilities, value.supportsMultiTurn, "multi-turn");
  addCapability(capabilities, value.supportsJsonMode, "json");
  addCapability(capabilities, value.supportsImageInput, "image-input");
  addCapability(capabilities, value.supportsImageOutput, "image-output");
  addCapability(capabilities, value.supportsFileAttachments, "file-attachments");

  return [...capabilities].sort();
}

function addCapability(target: Set<string>, enabled: unknown, capability: string): void {
  if (enabled === true) {
    target.add(capability);
  }
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function cloneDiscovery(value: ExternalAgentDiscovery): ExternalAgentDiscovery {
  return {
    available: value.available,
    defaultProvider: value.defaultProvider,
    defaultModel: value.defaultModel,
    agents: value.agents.map((agent) => ({
      ...agent,
      capabilities: [...agent.capabilities],
    })),
  };
}

export function _setExternalAgentDiscoveryModuleForTesting(
  mod: AmuxModuleLike | null | undefined,
): void {
  moduleOverride = mod;
}

export function _resetExternalAgentDiscoveryCache(): void {
  cacheEntry = null;
}
