import { getPluginTargetDescriptor, getSessionConfig } from '@a5c-ai/atlas/catalog';

import type { AgentAdapter } from './adapter.js';
import type { AdapterRegistry } from './adapter-registry.js';
import type { AgentName } from './types.js';
import type { Session } from './session-types.js';

export interface PersistentSessionAdapterMetadata {
  readonly sessionDirStrategy?: string;
  readonly sessionPersistence?: string;
  readonly pluginTargetId?: string;
  readonly adapterName?: string;
}

export interface PersistentSessionAdapter {
  readonly agent: AgentName;
  readonly metadata?: PersistentSessionAdapterMetadata;

  sessionDir(cwd?: string): string;
  listSessionFiles(cwd?: string): Promise<string[]>;
  parseSessionFile(filePath: string): Promise<Session>;
}

export class SessionAdapterRegistry {
  private readonly byAlias = new Map<string, PersistentSessionAdapter>();

  register(adapter: PersistentSessionAdapter, aliases: readonly string[] = []): void {
    const keys = new Set<string>([
      adapter.agent,
      adapter.metadata?.adapterName,
      adapter.metadata?.pluginTargetId,
      ...aliases,
    ].filter((key): key is string => typeof key === 'string' && key.length > 0));

    for (const key of keys) {
      this.byAlias.set(key, adapter);
    }
  }

  get(agentOrAlias: string): PersistentSessionAdapter | undefined {
    return this.byAlias.get(agentOrAlias);
  }

  list(): PersistentSessionAdapter[] {
    return Array.from(new Set(this.byAlias.values())).sort((left, right) =>
      left.agent.localeCompare(right.agent),
    );
  }

  resolveUnifiedId(agent: AgentName, nativeSessionId: string): string {
    return `${agent}:${nativeSessionId}`;
  }

  resolveNativeId(unifiedId: string): { agent: AgentName; nativeSessionId: string } | null {
    const colonIndex = unifiedId.indexOf(':');
    if (colonIndex === -1) return null;

    const agent = unifiedId.slice(0, colonIndex);
    const nativeSessionId = unifiedId.slice(colonIndex + 1);
    if (!agent || !nativeSessionId || !this.get(agent)) return null;

    return { agent, nativeSessionId };
  }
}

export function createLegacySessionAdapter(
  adapter: AgentAdapter,
  metadata: PersistentSessionAdapterMetadata = {},
): PersistentSessionAdapter {
  return {
    agent: adapter.agent,
    metadata: {
      adapterName: adapter.agent,
      ...metadata,
    },
    sessionDir: (cwd?: string) => adapter.sessionDir(cwd),
    listSessionFiles: (cwd?: string) => adapter.listSessionFiles(cwd),
    parseSessionFile: (filePath: string) => adapter.parseSessionFile(filePath),
  };
}

export function registerLegacySessionAdapters(
  adapters: AdapterRegistry,
  registry: SessionAdapterRegistry,
): SessionAdapterRegistry {
  for (const info of adapters.list()) {
    const adapter = adapters.get(info.agent);
    if (!adapter) continue;

    const target = getPluginTargetDescriptor(info.agent);
    const session = getSessionConfig(info.agent);
    const aliases = [
      target?.targetId,
      target?.adapterName,
      target?.cliCommand,
    ].filter((alias): alias is string => typeof alias === 'string' && alias.length > 0);
    if ([info.agent, ...aliases].some((alias) => registry.get(alias))) continue;

    registry.register(
      createLegacySessionAdapter(adapter, {
        adapterName: target?.adapterName ?? info.agent,
        pluginTargetId: target?.targetId,
        sessionDirStrategy: session.sessionDir,
        sessionPersistence: session.sessionPersistence,
      }),
      aliases,
    );
  }

  return registry;
}

export function createSessionAdapterRegistry(adapters: AdapterRegistry): SessionAdapterRegistry {
  const registry = new SessionAdapterRegistry();
  registerLegacySessionAdapters(adapters, registry);
  return registry;
}
