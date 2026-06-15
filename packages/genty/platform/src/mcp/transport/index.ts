/**
 * Status: Integrated with agent-platform MCP orchestration wiring.
 * Moved from @a5c-ai/babysitter-sdk.
 */
export { createWebSocketTransport, authenticateUpgrade, WebSocketConnectionTransport } from "./websocket";
export { WebSocketSessionManager } from "./session";
export type { WebSocketServerTransport } from "./websocket";
export type {
  WebSocketTransportOptions,
  WebSocketSession,
} from "./types";
