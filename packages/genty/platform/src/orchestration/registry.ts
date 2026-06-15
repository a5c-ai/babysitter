/**
 * Provider registry for orchestration abstractions.
 *
 * Each provider type is stored in a named map. Callers can register
 * multiple implementations and retrieve them by name. When no name is
 * supplied, the first registered provider is returned.
 *
 * If no provider has been registered for a requested type, the getter
 * throws immediately -- there are no fallbacks.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";
import type {
  OrchestrationProvider,
  JournalProvider,
  GovernanceProvider,
  ExternalAgentProvider,
  SessionProvider,
  ProcessDefinitionProvider,
  RunEvent,
} from "./interfaces";
import { createDefaultOrchestrationProvider } from "./defaultOrchestrationProvider";

function createDefaultFilesystemJournal(): JournalProvider {
  return {
    async loadEvents(runDir: string): Promise<RunEvent[]> {
      const journalDir = path.join(runDir, "journal");
      let files: string[];
      try { files = await fs.promises.readdir(journalDir); } catch { return []; }
      const jsonFiles = files.filter(f => f.endsWith(".json")).sort();
      const events: RunEvent[] = [];
      for (const file of jsonFiles) {
        const content = await fs.promises.readFile(path.join(journalDir, file), "utf8");
        const parsed = JSON.parse(content);
        events.push({ type: parsed.type, timestamp: parsed.recordedAt || parsed.timestamp, data: parsed.data } as RunEvent);
      }
      return events;
    },
    async appendEvent(runDir: string, event: RunEvent): Promise<void> {
      const journalDir = path.join(runDir, "journal");
      await fs.promises.mkdir(journalDir, { recursive: true });
      const existing = await fs.promises.readdir(journalDir).catch(() => [] as string[]);
      const nextSeq = existing.filter(f => f.endsWith(".json")).length + 1;
      const seqStr = nextSeq.toString().padStart(6, "0");
      const ulid = crypto.randomUUID().replace(/-/g, "").slice(0, 26).toUpperCase();
      await fs.promises.writeFile(
        path.join(journalDir, `${seqStr}.${ulid}.json`),
        JSON.stringify({ type: event.type, recordedAt: event.timestamp, data: event.data, checksum: crypto.createHash("sha256").update(event.type).digest("hex") }, null, 2),
      );
    },
  };
}

// ── Public interface ────────────────────────────────────────────────────

export interface OrchestrationRegistry {
  registerOrchestration(name: string, provider: OrchestrationProvider): void;
  registerJournal(name: string, provider: JournalProvider): void;
  registerGovernance(name: string, provider: GovernanceProvider): void;
  registerAgentDiscovery(name: string, provider: ExternalAgentProvider): void;
  registerSession(name: string, provider: SessionProvider): void;
  registerProcessDefinition(name: string, provider: ProcessDefinitionProvider): void;

  getOrchestration(name?: string): OrchestrationProvider;
  getJournal(name?: string): JournalProvider;
  getGovernance(name?: string): GovernanceProvider;
  getAgentDiscovery(name?: string): ExternalAgentProvider;
  getSession(name?: string): SessionProvider;
  getProcessDefinition(name?: string): ProcessDefinitionProvider;

  /** Names of all registered orchestration providers. */
  listProviders(): string[];
}

// ── Implementation ──────────────────────────────────────────────────────

/**
 * Typed helper that manages a single provider-type map and exposes
 * register / get semantics with insertion-order first-wins.
 */
class ProviderMap<T> {
  private readonly providers = new Map<string, T>();
  private readonly label: string;

  constructor(label: string) {
    this.label = label;
  }

  register(name: string, provider: T): void {
    this.providers.set(name, provider);
  }

  get(name?: string): T {
    if (name !== undefined) {
      const p = this.providers.get(name);
      if (!p) {
        throw new Error(
          `No ${this.label} provider registered with name "${name}". ` +
            `Registered: [${[...this.providers.keys()].join(", ")}]`,
        );
      }
      return p;
    }

    // Return the first registered provider.
    const first = this.providers.values().next();
    if (first.done) {
      throw new Error(
        `No ${this.label} provider registered. ` +
          `Call registry.register${capitalize(this.label)}() before accessing it.`,
      );
    }
    return first.value;
  }

  names(): string[] {
    return [...this.providers.keys()];
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Create a new orchestration registry with a default filesystem journal. */
export function createOrchestrationRegistry(): OrchestrationRegistry {
  const orchestration = new ProviderMap<OrchestrationProvider>("orchestration");
  const journal = new ProviderMap<JournalProvider>("journal");

  // Register defaults so API functions and the genty runtime work without
  // explicit provider registration (CLI tools, tests, standalone scripts).
  // The plugin's register.ts can still override these with named providers.
  journal.register("fs", createDefaultFilesystemJournal());
  orchestration.register("babysitter", createDefaultOrchestrationProvider());
  const governance = new ProviderMap<GovernanceProvider>("governance");
  const agentDiscovery = new ProviderMap<ExternalAgentProvider>("agentDiscovery");
  const session = new ProviderMap<SessionProvider>("session");
  const processDefinition = new ProviderMap<ProcessDefinitionProvider>("processDefinition");

  return {
    registerOrchestration: (n, p) => orchestration.register(n, p),
    registerJournal: (n, p) => journal.register(n, p),
    registerGovernance: (n, p) => governance.register(n, p),
    registerAgentDiscovery: (n, p) => agentDiscovery.register(n, p),
    registerSession: (n, p) => session.register(n, p),
    registerProcessDefinition: (n, p) => processDefinition.register(n, p),

    getOrchestration: (n) => orchestration.get(n),
    getJournal: (n) => journal.get(n),
    getGovernance: (n) => governance.get(n),
    getAgentDiscovery: (n) => agentDiscovery.get(n),
    getSession: (n) => session.get(n),
    getProcessDefinition: (n) => processDefinition.get(n),

    listProviders: () => orchestration.names(),
  };
}
