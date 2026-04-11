/**
 * GAP-REMOTE-003: WebSocket transport types.
 */

export interface WebSocketTransportOptions {
  port: number;
  host?: string;
  authToken?: string;
  pingIntervalMs?: number;
  maxMessagesPerSecond?: number;
  sessionGracePeriodMs?: number;
}

export interface WebSocketSession {
  sessionId: string;
  connectedAt: string;
  lastActivity: string;
}
