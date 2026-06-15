/**
 * Backend factory (SPEC-LIVE-BACKEND §5.3). The ONLY place that knows which
 * concrete implementation exists; returns the `CommanderBackend` interface so
 * the boot seam and UI stay implementation-agnostic.
 *
 * The mock branch constructs `new MockBackend({ seed })` — the exact constructor
 * path `createMockBackendFromSearch` uses — so the byte-identical-default
 * guarantee (AC1) is structural, not re-derived.
 */

import type { AgentSummary, ClientFrame, RunEntry, ServerFrame, SessionEntry } from '../contracts/gateway-protocol';
import type { CommanderTask } from '../contracts/kradle-resources';
import type { BackendConfig } from './config';
import type { CommanderBackend } from './types';
import { MockBackend } from './mock/mockBackend';
import { RealBackend, type RealBackendDeps } from './real/realBackend';

/**
 * Kradle-only real mode (SPEC-KRADLE-CONTROLPLANE §4.1/AC16): real mode is valid
 * with just `kradleApiUrl` and NO adapters-gateway. The kradle control-plane data
 * flows through `bootReal`'s own `KradleControllerClient` (snapshot cache + SSE),
 * not through this `CommanderBackend` — so the gateway transport is genuinely
 * inert here: `connect()` resolves, `onFrame` never fires, `send` is a no-op, and
 * the gateway REST lists are empty. (When a gateway IS configured, the real
 * `RealBackend` is used and `bootReal` adds the kradle cache alongside it.)
 */
class InertGatewayBackend implements CommanderBackend {
  connect(): Promise<void> {
    return Promise.resolve();
  }
  disconnect(): void {
    /* nothing to tear down — no socket */
  }
  send(_frame: ClientFrame): void {
    /* no gateway in kradle-only mode */
  }
  onFrame(_cb: (frame: ServerFrame) => void): () => void {
    return () => {
      /* no frames ever arrive without a gateway */
    };
  }
  listAgents(): Promise<AgentSummary[]> {
    return Promise.resolve([]);
  }
  listSessionEntries(): Promise<SessionEntry[]> {
    return Promise.resolve([]);
  }
  listRuns(): Promise<RunEntry[]> {
    return Promise.resolve([]);
  }
  listTasks(): Promise<CommanderTask[]> {
    return Promise.resolve([]);
  }
}

export function createBackend(config: BackendConfig, deps?: RealBackendDeps): CommanderBackend {
  if (config.mode === 'real') {
    // Gateway present → the real WS+REST transport (kradle cache, if any, is added
    // by bootReal alongside it). Kradle-only real mode (no gateway) → an inert
    // gateway; the kradle control plane rides bootReal's own client (§4.1/AC16).
    if (config.gatewayUrl !== undefined && config.token !== undefined) {
      return new RealBackend(config, deps);
    }
    return new InertGatewayBackend();
  }
  return new MockBackend({ seed: config.seed });
}
