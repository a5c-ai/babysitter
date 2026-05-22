import type { GatewayRunClient } from './config.js';

import { createClient } from '@a5c-ai/agent-mux-core';
import {
  AgentMuxRemoteAdapter,
  AmpAdapter,
  ClaudeAdapter,
  ClaudeAgentSdkAdapter,
  ClaudeRemoteControlAdapter,
  CodexAdapter,
  CodexSdkAdapter,
  CodexWebSocketAdapter,
  CopilotAdapter,
  CursorAdapter,
  DroidAdapter,
  GeminiAdapter,
  HermesAdapter,
  OmpAdapter,
  OpenClawAdapter,
  OpenCodeAdapter,
  OpenCodeHttpAdapter,
  PiAdapter,
  PiSdkAdapter,
  QwenAdapter,
  BabysitterAdapter,
} from '@a5c-ai/agent-mux-adapters';

export function createGatewayRunClient(): GatewayRunClient {
  const client = createClient();
  const registry = client.adapters as unknown as {
    registerBuiltIn?: (adapter: unknown) => void;
    register: (adapter: unknown) => void;
  };
  const adapters = [
    new ClaudeAdapter(),
    new ClaudeAgentSdkAdapter(),
    new ClaudeRemoteControlAdapter(),
    new CodexAdapter(),
    new CodexSdkAdapter(),
    new CodexWebSocketAdapter(),
    new DroidAdapter(),
    new AmpAdapter(),
    new GeminiAdapter(),
    new CopilotAdapter(),
    new CursorAdapter(),
    new OpenCodeAdapter(),
    new OpenCodeHttpAdapter(),
    new PiAdapter(),
    new PiSdkAdapter(),
    new OmpAdapter(),
    new OpenClawAdapter(),
    new HermesAdapter(),
    new AgentMuxRemoteAdapter(),
    new QwenAdapter(),
    new BabysitterAdapter(),
  ];

  for (const adapter of adapters) {
    if (typeof registry.registerBuiltIn === 'function') {
      registry.registerBuiltIn(adapter);
      continue;
    }
    registry.register(adapter);
  }

  return client;
}

export function listBuiltInAgentNames(): string[] {
  const client = createGatewayRunClient() as ReturnType<typeof createClient>;
  return client.adapters.list().map((entry) => entry.agent);
}

export interface RunnableGatewayAgent {
  agent: string;
  displayName: string;
  adapterType: string;
  structuredSessionTransport: 'none' | 'restart-per-turn' | 'persistent';
  sessionControlPlane: 'self-managed' | 'external-host' | 'mcp-mediated';
  supportsInteractiveMode: boolean;
  canResume: boolean;
  supportsImageInput: boolean;
  supportsFileAttachments: boolean;
  approvalModes: Array<'yolo' | 'prompt' | 'deny'>;
}

type DetectableGatewayClient = GatewayRunClient & {
  adapters?: {
    list(): Array<{ agent: string; displayName: string }>;
    installed(): Promise<Array<{ agent: string; installed: boolean; meetsMinVersion: boolean }>>;
    get(agent: string): {
      adapterType?: string;
      capabilities?: {
        structuredSessionTransport?: 'none' | 'restart-per-turn' | 'persistent';
        sessionControlPlane?: 'self-managed' | 'external-host' | 'mcp-mediated';
        supportsInteractiveMode?: boolean;
        canResume?: boolean;
        supportsImageInput?: boolean;
        supportsFileAttachments?: boolean;
        approvalModes?: Array<'yolo' | 'prompt' | 'deny'>;
      };
    } | undefined;
  };
};

export async function listRunnableGatewayAgents(client?: GatewayRunClient): Promise<RunnableGatewayAgent[]> {
  const detectable = client as DetectableGatewayClient | undefined;
  if (!detectable?.adapters) {
    return listBuiltInAgentNames().map((agent) => ({
      agent,
      displayName: agent,
      adapterType: 'subprocess',
      structuredSessionTransport: 'none',
      sessionControlPlane: 'self-managed',
      supportsInteractiveMode: false,
      canResume: false,
      supportsImageInput: false,
      supportsFileAttachments: false,
      approvalModes: ['prompt'],
    }));
  }

  const [entries, installed] = await Promise.all([
    Promise.resolve(detectable.adapters.list()),
    detectable.adapters.installed(),
  ]);

  const installMap = new Map(installed.map((entry) => [entry.agent, entry]));
  const runnable = entries.flatMap((entry) => {
    const adapter = detectable.adapters?.get(entry.agent);
    const status = installMap.get(entry.agent);
    if (!status?.installed || !status.meetsMinVersion) {
      return [];
    }
    return [{
      agent: entry.agent,
      displayName: entry.displayName,
      adapterType: adapter?.adapterType ?? 'subprocess',
      structuredSessionTransport: adapter?.capabilities?.structuredSessionTransport ?? 'none',
      sessionControlPlane: adapter?.capabilities?.sessionControlPlane ?? 'self-managed',
      supportsInteractiveMode: adapter?.capabilities?.supportsInteractiveMode ?? false,
      canResume: adapter?.capabilities?.canResume ?? false,
      supportsImageInput: adapter?.capabilities?.supportsImageInput ?? false,
      supportsFileAttachments: adapter?.capabilities?.supportsFileAttachments ?? false,
      approvalModes: adapter?.capabilities?.approvalModes ?? ['prompt'],
    }];
  });

  if (runnable.length > 0) {
    return runnable.sort((left, right) => {
      const score = (candidate: RunnableGatewayAgent): number => {
        if (candidate.structuredSessionTransport === 'persistent' && candidate.supportsInteractiveMode) return 4;
        if (candidate.supportsInteractiveMode) return 3;
        if (candidate.structuredSessionTransport === 'persistent') return 2;
        if (candidate.canResume) return 1;
        return 0;
      };
      const delta = score(right) - score(left);
      if (delta !== 0) {
        return delta;
      }
      return left.displayName.localeCompare(right.displayName);
    });
  }

  return listBuiltInAgentNames().map((agent) => ({
    agent,
    displayName: agent,
    adapterType: 'subprocess',
      structuredSessionTransport: 'none',
      sessionControlPlane: 'self-managed',
      supportsInteractiveMode: false,
      canResume: false,
      supportsImageInput: false,
      supportsFileAttachments: false,
      approvalModes: ['prompt'],
    }));
}

export async function listRunnableGatewayAgentNames(client?: GatewayRunClient): Promise<string[]> {
  const runnable = await listRunnableGatewayAgents(client);
  return runnable.map((entry) => entry.agent);
}
