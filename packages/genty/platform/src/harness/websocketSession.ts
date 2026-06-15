/**
 * Remote sessions via WebSocket (GAP-REMOTE-003).
 *
 * Provides a WebSocket session abstraction with auto-reconnect,
 * exponential backoff, and typed message handling.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebSocketSessionConfig {
  url: string;
  /** Base reconnect interval in ms. Default: 1000. */
  reconnectIntervalMs?: number;
  /** Max reconnect attempts before giving up. Default: 10. */
  maxReconnects?: number;
  /** Optional auth token sent in the initial handshake. */
  authToken?: string;
}

export type WsMessageType = 'prompt' | 'response' | 'event' | 'error';

export interface WsMessage {
  type: WsMessageType;
  payload: unknown;
  timestamp: number;
}

export type WsMessageCallback = (message: WsMessage) => void;

/**
 * Minimal WebSocket-like interface for dependency injection / testing.
 */
export interface WebSocketLike {
  readyState: number;
  send(data: string): void;
  close(): void;
  onopen: ((ev: unknown) => void) | null;
  onclose: ((ev: unknown) => void) | null;
  onmessage: ((ev: { data: string }) => void) | null;
  onerror: ((ev: unknown) => void) | null;
}

export type WebSocketFactory = (url: string, protocols?: string[]) => WebSocketLike;

// ---------------------------------------------------------------------------
// Constants (mirroring WebSocket readyState)
// ---------------------------------------------------------------------------

const WS_OPEN = 1;

// ---------------------------------------------------------------------------
// WebSocketSession
// ---------------------------------------------------------------------------

export class WebSocketSession {
  private ws: WebSocketLike | null = null;
  private listeners: WsMessageCallback[] = [];
  private reconnectCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  private readonly url: string;
  private readonly reconnectIntervalMs: number;
  private readonly maxReconnects: number;
  private readonly authToken: string | undefined;
  private readonly wsFactory: WebSocketFactory;

  constructor(config: WebSocketSessionConfig, wsFactory: WebSocketFactory) {
    this.url = config.url;
    this.reconnectIntervalMs = config.reconnectIntervalMs ?? 1_000;
    this.maxReconnects = config.maxReconnects ?? 10;
    this.authToken = config.authToken;
    this.wsFactory = wsFactory;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /** Open a WebSocket connection. */
  connect(): void {
    this.intentionalClose = false;
    this.reconnectCount = 0;
    this.doConnect();
  }

  /** Gracefully close the connection (no auto-reconnect). */
  disconnect(): void {
    this.intentionalClose = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /** Send a typed message over the WebSocket. */
  send(message: WsMessage): void {
    if (!this.ws || this.ws.readyState !== WS_OPEN) {
      throw new Error('WebSocket is not connected');
    }
    this.ws.send(JSON.stringify(message));
  }

  /** Register a callback for incoming messages. */
  onMessage(callback: WsMessageCallback): void {
    this.listeners.push(callback);
  }

  /** Whether the underlying WebSocket is currently open. */
  isConnected(): boolean {
    return this.ws != null && this.ws.readyState === WS_OPEN;
  }

  // -----------------------------------------------------------------------
  // Internal
  // -----------------------------------------------------------------------

  private doConnect(): void {
    const protocols = this.authToken ? [`auth-${this.authToken}`] : undefined;
    const ws = this.wsFactory(this.url, protocols);
    this.ws = ws;

    ws.onopen = () => {
      this.reconnectCount = 0;
    };

    ws.onmessage = (ev: { data: string }) => {
      let msg: WsMessage;
      try {
        msg = JSON.parse(ev.data) as WsMessage;
      } catch {
        return; // ignore unparseable frames
      }
      for (const cb of this.listeners) {
        cb(msg);
      }
    };

    ws.onclose = () => {
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    };

    ws.onerror = () => {
      // Error is typically followed by close — let onclose handle reconnect.
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectCount >= this.maxReconnects) {
      return; // give up
    }
    const delay = this.reconnectIntervalMs * Math.pow(2, this.reconnectCount);
    this.reconnectCount++;
    this.reconnectTimer = setTimeout(() => {
      this.doConnect();
    }, delay);
  }
}
