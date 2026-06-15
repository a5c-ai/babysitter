/**
 * Backend abstraction (SPEC §7).
 *
 * The UI talks ONLY to this interface. v1 binds it to the deterministic mock
 * simulation (`src/backend/mock/`); v2 swaps in a real
 * `@a5c-ai/adapters-gateway` WS+REST transport without touching UI code.
 */

import type {
  AgentSummary,
  ClientFrame,
  RunEntry,
  ServerFrame,
  SessionEntry,
} from '../contracts/gateway-protocol';
import type { CommanderTask } from '../contracts/kradle-resources';

export interface CommanderBackend {
  connect(): Promise<void>;
  disconnect(): void;
  /** Commands go in as protocol frames. */
  send(frame: ClientFrame): void;
  /** Events come out as protocol frames. Returns an unsubscribe function. */
  onFrame(cb: (frame: ServerFrame) => void): () => void;
  /** GET /api/v1/agents */
  listAgents(): Promise<AgentSummary[]>;
  /** GET /api/v1/sessions (gateway entries for ACTIVE agents; the §V5-1 persistent-session views live on the sim/backend as `listSessions(taskId?)`/`getSession`). */
  listSessionEntries(): Promise<SessionEntry[]>;
  /** GET /api/v1/runs */
  listRuns(): Promise<RunEntry[]>;
  /** kradle AgentDispatchRun list (mock-local for v1) */
  listTasks(): Promise<CommanderTask[]>;
}
