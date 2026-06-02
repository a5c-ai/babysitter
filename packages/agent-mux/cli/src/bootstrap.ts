/**
 * Bootstrap helper: registers all built-in agent adapters with a client.
 *
 * The core `AdapterRegistry` starts empty — adapters must be explicitly
 * registered. This module centralises that wiring so the CLI (and any
 * consumer) gets all built-in adapters with a single call.
 */

import type { AgentMuxClient } from '@a5c-ai/agent-mux-comm';
import type { MultiAgentAdapter } from '@a5c-ai/agent-mux-comm';
import {
  ClaudeAdapter,
  ClaudeAgentSdkAdapter,
  ClaudeRemoteControlAdapter,
  CodexAdapter,
  CodexSdkAdapter,
  CodexWebSocketAdapter,
  DroidAdapter,
  AmpAdapter,
  GeminiAdapter,
  CopilotAdapter,
  CursorAdapter,
  OpenCodeAdapter,
  OpenCodeHttpAdapter,
  PiAdapter,
  PiSdkAdapter,
  OmpAdapter,
  OpenClawAdapter,
  HermesAdapter,
  AgentMuxRemoteAdapter,
  QwenAdapter,
  BabysitterAdapter,
} from '@a5c-ai/agent-mux-adapters';

/**
 * Registers every built-in adapter on the given client's adapter registry.
 * Safe to call multiple times — `register()` replaces existing entries.
 */
export function registerBuiltInAdapters(client: AgentMuxClient): void {
  const adapters: MultiAgentAdapter[] = [
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

  // Prefer `registerBuiltIn` on the impl so the `source` shows as 'built-in';
  // fall back to the public `register()` (which marks as 'plugin') for any
  // AdapterRegistry implementation that doesn't expose the built-in helper.
  const registry = client.adapters as unknown as {
    registerBuiltIn?: (a: MultiAgentAdapter) => void;
    register: (a: MultiAgentAdapter) => void;
  };

  for (const adapter of adapters) {
    try {
      if (typeof registry.registerBuiltIn === 'function') {
        registry.registerBuiltIn(adapter);
      } else {
        registry.register(adapter);
      }
    } catch (e) {
      // Skip adapters that fail validation (e.g. partially-implemented
      // programmatic/HTTP adapters). Log to stderr so callers can diagnose
      // without crashing the whole process.
      const name = (adapter as { agent?: string }).agent ?? adapter.constructor.name;
      process.stderr.write(`[amux] skipping adapter ${name}: ${(e as Error).message}\n`);
    }
  }
}
