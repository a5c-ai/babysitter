import { nextBackoffDelay } from './backoff.js';
import { GatewayClientDisconnectedError, GatewayClientTimeoutError } from './errors.js';
import { createWebSocket as createBrowserWebSocket, type GatewaySocket } from './transports/ws-browser.js';
import type { Attachment } from '@a5c-ai/agent-mux-comm';
import type { GatewayFrame, HookRequestFrame, RunEventFrame, SubscribeFrame } from '../protocol/v1.js';

type GatewayClientEventMap = {
  connected: [];
  disconnected: [{ code?: number; reason?: string }];
  frame: [Record<string, unknown>];
  error: [unknown];
};

type EventKey = keyof GatewayClientEventMap;

type PendingRequest = {
  resolve: (value: Record<string, unknown>) => void;
  reject: (error: unknown) => void;
  timer: ReturnType<typeof setTimeout>;
};

type SessionSubscription = {
  sessionId: string;
  callback?: (frame: Record<string, unknown>) => void;
};

type RunSubscription = {
  runId: string;
  sinceSeq: number;
  callbacks: Set<(frame: RunEventFrame) => void>;
  subscriberCount: number;
};

export interface GatewayClientOptions {
  url: string;
  token: string;
  createSocket?: (url: string, token: string) => GatewaySocket;
  requestTimeoutMs?: number;
  shouldReconnect?: boolean;
}

export interface StartSessionInput extends Record<string, unknown> {
  agent: string;
  prompt: string;
  model?: string;
  attachments?: Attachment[];
  approvalMode?: 'yolo' | 'prompt' | 'deny';
  sessionId?: string;
  runId?: string;
  cwd?: string;
  workspaceId?: string;
  forkSessionId?: string;
}

export interface SendSessionMessageInput extends Record<string, unknown> {
  sessionId: string;
  prompt: string;
  agent?: string;
  model?: string;
  attachments?: Attachment[];
  approvalMode?: 'yolo' | 'prompt' | 'deny';
}

export class GatewayClient {
  private socket: GatewaySocket | null = null;
  private readonly pending = new Map<string, PendingRequest>();
  private readonly listeners = new Map<EventKey, Set<(...args: unknown[]) => void>>();
  private readonly runSubscriptions = new Map<string, RunSubscription>();
  private readonly sessionSubscriptions = new Map<string, SessionSubscription>();
  private readonly requestTimeoutMs: number;
  private readonly shouldReconnect: boolean;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  private closedManually = false;
  private ready = false;
  private nextId = 0;

  constructor(private readonly options: GatewayClientOptions) {
    this.requestTimeoutMs = options.requestTimeoutMs ?? 10_000;
    this.shouldReconnect = options.shouldReconnect ?? true;
  }

  async connect(): Promise<void> {
    this.closedManually = false;
    await this.openSocket();
  }

  async close(): Promise<void> {
    this.closedManually = true;
    this.ready = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close(1000, 'client close');
    this.socket = null;
  }

  async request<TRequest extends Record<string, unknown>, TResponse extends Record<string, unknown>>(
    frame: TRequest,
  ): Promise<TResponse> {
    const id = typeof frame['id'] === 'string' ? frame['id'] : this.allocateId();
    const payload = { ...frame, id };
    const socket = this.socket;
    if (!socket) {
      throw new GatewayClientDisconnectedError('Gateway socket is not connected');
    }

    return await new Promise<TResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new GatewayClientTimeoutError(`Timed out waiting for response to frame ${id}`));
      }, this.requestTimeoutMs);

      this.pending.set(id, { resolve: resolve as (value: Record<string, unknown>) => void, reject, timer });
      socket.send(JSON.stringify(payload));
    });
  }

  async startSession<TResponse extends Record<string, unknown> = Record<string, unknown>>(
    input: StartSessionInput,
  ): Promise<TResponse> {
    return await this.request<StartSessionInput & { type: 'session.start' }, TResponse>({
      type: 'session.start',
      ...input,
    });
  }

  async sendSessionMessage<TResponse extends Record<string, unknown> = Record<string, unknown>>(
    input: SendSessionMessageInput,
  ): Promise<TResponse> {
    return await this.request<SendSessionMessageInput & { type: 'session.message' }, TResponse>({
      type: 'session.message',
      ...input,
    });
  }

  subscribeRun(runId: string, callback?: (frame: RunEventFrame) => void): () => void {
    const existing = this.runSubscriptions.get(runId);
    const subscription: RunSubscription = existing ?? {
      runId,
      sinceSeq: 0,
      callbacks: new Set(),
      subscriberCount: 0,
    };
    subscription.subscriberCount += 1;
    if (callback) {
      subscription.callbacks.add(callback);
    }
    this.runSubscriptions.set(runId, subscription);
    if (!existing) {
      this.sendFrame({ type: 'subscribe', runId, sinceSeq: subscription.sinceSeq } satisfies SubscribeFrame);
    }
    return () => {
      const current = this.runSubscriptions.get(runId);
      if (!current) {
        return;
      }
      current.subscriberCount = Math.max(0, current.subscriberCount - 1);
      if (callback) {
        current.callbacks.delete(callback);
      }
      if (current.subscriberCount > 0) {
        return;
      }
      this.runSubscriptions.delete(runId);
      this.sendFrame({ type: 'unsubscribe', runId });
    };
  }

  subscribeSession(sessionId: string, callback?: (frame: Record<string, unknown>) => void): () => void {
    this.sessionSubscriptions.set(sessionId, { sessionId, callback });
    this.sendFrame({ type: 'session.subscribe', sessionId });
    return () => {
      this.sessionSubscriptions.delete(sessionId);
      this.sendFrame({ type: 'session.unsubscribe', sessionId });
    };
  }

  on<TEvent extends EventKey>(event: TEvent, handler: (...args: GatewayClientEventMap[TEvent]) => void): () => void {
    let handlers = this.listeners.get(event);
    if (!handlers) {
      handlers = new Set();
      this.listeners.set(event, handlers);
    }
    handlers.add(handler as (...args: unknown[]) => void);
    return () => {
      handlers?.delete(handler as (...args: unknown[]) => void);
    };
  }

  private async openSocket(): Promise<void> {
    const createSocket = this.options.createSocket ?? createBrowserWebSocket;
    const socket = createSocket(this.options.url, this.options.token);
    this.socket = socket;
    this.ready = false;
    let handshakeComplete = false;

    await new Promise<void>((resolve, reject) => {
      socket.onOpen(() => {
        socket.send(JSON.stringify({ type: 'auth', token: this.options.token }));
      });
      socket.onError((error) => {
        this.emit('error', error);
        if (!handshakeComplete) {
          reject(error);
        }
      });
      socket.onMessage((data) => {
        this.handleMessage(data);
        if (!handshakeComplete) {
          const frame = JSON.parse(data) as Record<string, unknown>;
                    if (frame['type'] === 'hello') {
                        handshakeComplete = true;
                        this.ready = true;
                        this.reconnectAttempt = 0;
                        this.emit('connected');
                        this.replaySubscriptions();
            resolve();
          }
        }
      });
            socket.onClose((event) => {
                this.ready = false;
                this.emit('disconnected', event ?? {});
                if (!handshakeComplete) {
          reject(new GatewayClientDisconnectedError('Gateway socket closed before authentication completed'));
          return;
        }
        if (!this.closedManually && this.shouldReconnect) {
          this.scheduleReconnect();
        }
      });
    });
  }

  private sendFrame(frame: Record<string, unknown>): void {
    if (!this.socket || !this.ready) return;
    this.socket.send(JSON.stringify(frame));
  }

  private handleMessage(data: string): void {
    const frame = JSON.parse(data) as Record<string, unknown>;
    const id = typeof frame['id'] === 'string' ? frame['id'] : null;
    if (id) {
      const pending = this.pending.get(id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pending.delete(id);
        pending.resolve(frame);
      }
    }

    if (frame['type'] === 'run.event' && typeof frame['runId'] === 'string' && typeof frame['seq'] === 'number') {
      const subscription = this.runSubscriptions.get(frame['runId']);
      if (subscription) {
        subscription.sinceSeq = Math.max(subscription.sinceSeq, Number(frame['seq']));
        for (const callback of subscription.callbacks) {
          callback(frame as unknown as RunEventFrame);
        }
      }
    }

    if (frame['type'] === 'hook.request') {
      const hookFrame = frame as unknown as HookRequestFrame;
      const subscription = this.runSubscriptions.get(hookFrame.runId);
      if (subscription) {
        const eventFrame = {
          type: 'run.event',
          runId: hookFrame.runId,
          seq: hookFrame.deadlineTs,
          source: 'gateway',
          event: hookFrame as unknown as Record<string, unknown>,
        } satisfies RunEventFrame;
        for (const callback of subscription.callbacks) {
          callback(eventFrame);
        }
      }
    }

    this.emit('frame', frame);
  }

  private replaySubscriptions(): void {
    for (const subscription of this.runSubscriptions.values()) {
      this.sendFrame({
        type: 'subscribe',
        runId: subscription.runId,
        sinceSeq: subscription.sinceSeq,
      });
    }
    for (const subscription of this.sessionSubscriptions.values()) {
      this.sendFrame({
        type: 'session.subscribe',
        sessionId: subscription.sessionId,
      });
    }
  }

  private scheduleReconnect(): void {
    const delay = nextBackoffDelay(++this.reconnectAttempt);
    this.reconnectTimer = setTimeout(() => {
      void this.openSocket().catch((error) => {
        this.emit('error', error);
        this.scheduleReconnect();
      });
    }, delay);
  }

  private emit<TEvent extends EventKey>(event: TEvent, ...args: GatewayClientEventMap[TEvent]): void {
    const handlers = this.listeners.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      handler(...(args as unknown[]));
    }
  }

  private allocateId(): string {
    this.nextId += 1;
    return `req-${this.nextId}`;
  }
}
