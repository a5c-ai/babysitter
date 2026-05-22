import { EventEmitter } from 'node:events';
import type { AgentEvent } from '@a5c-ai/agent-mux-core';
import type {
  MockConnection,
  MockServerInfo,
  MockStreamEvent,
  RemoteMockBuilder,
  RemoteMockConfig,
} from './mock-types.js';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function generateId(): string {
  return `mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function createBaseEvent(type: string, runId: string, agent = 'mock-agent') {
  return {
    timestamp: new Date().toISOString(),
    runId,
    type,
    agent,
  };
}

export class MockServer extends EventEmitter {
  private info: MockServerInfo;
  private readonly config: RemoteMockConfig;
  private readonly connections = new Map<string, MockConnection>();
  private _started = false;

  constructor(config: RemoteMockConfig) {
    super();
    this.config = config;
    this.info = {
      serverId: generateId(),
      endpoint: config.http?.baseUrl || `ws://localhost:${config.server?.port || 8080}`,
      port: config.server?.port || 8080,
      startedAt: new Date(),
      status: 'starting',
    };
  }

  async start(): Promise<MockServerInfo> {
    if (this._started) {
      throw new Error('Server already started');
    }
    this.info.status = 'starting';
    if (this.config.server?.startupDelayMs) {
      await delay(this.config.server.startupDelayMs);
    }
    if (this.config.server?.startupFails) {
      this.info.status = 'error';
      throw new Error('Mock server startup failed');
    }
    this._started = true;
    this.info.status = 'running';
    this.emit('started', this.info);
    return this.info;
  }

  async stop(): Promise<void> {
    if (!this._started) {
      return;
    }
    this.info.status = 'stopped';
    this._started = false;
    for (const connection of this.connections.values()) {
      await connection.close();
    }
    this.connections.clear();
    this.emit('stopped');
  }

  async createConnection(connectionType: 'http' | 'websocket'): Promise<MockConnection> {
    if (!this._started) {
      throw new Error('Server not started');
    }
    const connection = new MockConnectionImpl(connectionType, this.info.endpoint, this.config);
    this.connections.set(connection.connectionId, connection);
    this.emit('connection', connection);
    return connection;
  }

  getInfo(): MockServerInfo {
    return { ...this.info };
  }

  getConnections(): MockConnection[] {
    return Array.from(this.connections.values());
  }
}

class MockConnectionImpl extends EventEmitter implements MockConnection {
  readonly connectionId: string;
  readonly connectionType: 'http' | 'websocket';
  readonly endpoint: string;

  private readonly config: RemoteMockConfig;
  private _state: 'connecting' | 'connected' | 'disconnected' | 'error' = 'connecting';
  private readonly stats = {
    eventsReceived: 0,
    eventsSent: 0,
    connectTime: new Date(),
    lastActivity: new Date(),
  };
  private readonly eventQueue: AgentEvent[] = [];

  constructor(
    connectionType: 'http' | 'websocket',
    endpoint: string,
    config: RemoteMockConfig,
  ) {
    super();
    this.connectionId = generateId();
    this.connectionType = connectionType;
    this.endpoint = endpoint;
    this.config = config;
    void this.connect();
  }

  get state(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    return this._state;
  }

  private async connect(): Promise<void> {
    try {
      if (this.config.connection?.connectDelayMs) {
        await delay(this.config.connection.connectDelayMs);
      }
      if (this.config.connection?.connectFails) {
        this._state = 'error';
        this.emit('error', new Error('Mock connection failed'));
        return;
      }
      this._state = 'connected';
      this.stats.connectTime = new Date();
      this.emit('connected');
      void this.startEventGeneration();
    } catch (error) {
      this._state = 'error';
      this.emit('error', error);
    }
  }

  private async startEventGeneration(): Promise<void> {
    const runId = generateId();
    try {
      for (const [index, mockEvent] of this.config.events.entries()) {
        if (this._state !== 'connected') break;
        if (mockEvent.delayMs) {
          await delay(mockEvent.delayMs);
        }
        const event: AgentEvent = {
          ...createBaseEvent(mockEvent.type, runId),
          ...mockEvent.data,
        } as unknown as AgentEvent;
        this.eventQueue.push(event);
        this.stats.eventsReceived += 1;
        this.stats.lastActivity = new Date();
        this.emit('event', event);
        if (
          this.config.connection?.disconnectAfterEvents &&
          index >= this.config.connection.disconnectAfterEvents - 1
        ) {
          await this.simulateDisconnection();
          break;
        }
      }
    } catch (error) {
      this._state = 'error';
      this.emit('error', error);
    }
  }

  private async simulateDisconnection(): Promise<void> {
    this._state = 'disconnected';
    this.emit('disconnected');
    if (this.config.websocket?.dropConnection?.reconnectDelayMs) {
      await delay(this.config.websocket.dropConnection.reconnectDelayMs);
      await this.connect();
    }
  }

  async send(data: unknown): Promise<void> {
    if (this._state !== 'connected') {
      throw new Error(`Cannot send data: connection state is ${this._state}`);
    }
    this.stats.eventsSent += 1;
    this.stats.lastActivity = new Date();
    if (this.connectionType === 'websocket' && this.config.websocket?.pingIntervalMs) {
      await delay(10);
    }
    this.emit('sent', data);
  }

  async *receive(): AsyncIterableIterator<AgentEvent> {
    while (this._state === 'connected' || this.eventQueue.length > 0) {
      if (this.eventQueue.length === 0) {
        await delay(10);
        continue;
      }
      const event = this.eventQueue.shift();
      if (event) {
        yield event;
      }
    }
    if (this._state === 'error') {
      yield {
        ...createBaseEvent('error', generateId()),
        code: 'CONNECTION_ERROR',
        message: 'Mock connection error',
        fatal: false,
        recoverable: true,
      } as unknown as AgentEvent;
    }
  }

  async close(): Promise<void> {
    if (this._state === 'disconnected') return;
    this._state = 'disconnected';
    this.eventQueue.length = 0;
    this.emit('closed');
  }

  getStats() {
    return { ...this.stats };
  }
}

export class RemoteMockBuilderImpl implements RemoteMockBuilder {
  private config: Partial<RemoteMockConfig> = {
    events: [],
  };

  name(name: string): this {
    this.config.name = name;
    return this;
  }

  withServer(serverConfig: RemoteMockConfig['server']): this {
    this.config.server = { ...this.config.server, ...serverConfig };
    return this;
  }

  withConnection(connectionConfig: RemoteMockConfig['connection']): this {
    this.config.connection = { ...this.config.connection, ...connectionConfig };
    return this;
  }

  withWebSocket(wsConfig: RemoteMockConfig['websocket']): this {
    this.config.websocket = { ...this.config.websocket, ...wsConfig };
    return this;
  }

  withHttp(httpConfig: RemoteMockConfig['http']): this {
    this.config.http = { ...this.config.http, ...httpConfig };
    return this;
  }

  addEvents(events: MockStreamEvent[]): this {
    this.config.events = [...(this.config.events || []), ...events];
    return this;
  }

  withErrors(errors: RemoteMockConfig['simulateErrors']): this {
    this.config.simulateErrors = { ...this.config.simulateErrors, ...errors };
    return this;
  }

  build(): RemoteMockConfig {
    return {
      events: [],
      ...this.config,
    } as RemoteMockConfig;
  }
}

export class OpenCodeHttpMock {
  static basicSuccess(): RemoteMockConfig {
    return new RemoteMockBuilderImpl()
      .name('opencode-http-basic')
      .withServer({ startupDelayMs: 100, port: 3000 })
      .withConnection({ connectDelayMs: 50 })
      .withHttp({
        baseUrl: 'http://localhost:3000',
        endpointDelays: { '/execute': 200, '/status': 50 },
      })
      .addEvents([
        { type: 'session_start', data: { sessionId: 'mock_session' }, delayMs: 100 },
        { type: 'text_delta', data: { delta: 'Starting OpenCode execution...', accumulated: 'Starting OpenCode execution...' }, delayMs: 200 },
        { type: 'text_delta', data: { delta: '\nCode executed successfully!', accumulated: 'Starting OpenCode execution...\nCode executed successfully!' }, delayMs: 300 },
        { type: 'message_stop', data: {}, delayMs: 100 },
      ])
      .build();
  }

  static serverStartupFailure(): RemoteMockConfig {
    return new RemoteMockBuilderImpl()
      .name('opencode-http-startup-fail')
      .withServer({ startupFails: true })
      .build();
  }

  static networkTimeout(): RemoteMockConfig {
    return new RemoteMockBuilderImpl()
      .name('opencode-http-timeout')
      .withServer({ startupDelayMs: 100 })
      .withConnection({ connectDelayMs: 50 })
      .withErrors({ networkTimeout: true })
      .build();
  }
}

export class CodexWebSocketMock {
  static basicSuccess(): RemoteMockConfig {
    return new RemoteMockBuilderImpl()
      .name('codex-websocket-basic')
      .withServer({ startupDelayMs: 150, port: 8080 })
      .withConnection({ connectDelayMs: 30 })
      .withWebSocket({ channels: ['code', 'output'], pingIntervalMs: 5000 })
      .addEvents([
        { type: 'session_start', data: { sessionId: 'mock_ws_session' }, delayMs: 50 },
        { type: 'text_delta', data: { delta: '# Generated Code\n', accumulated: '# Generated Code\n' }, delayMs: 100 },
        { type: 'text_delta', data: { delta: 'def hello():\n    return "Hello, World!"', accumulated: '# Generated Code\ndef hello():\n    return "Hello, World!"' }, delayMs: 200 },
        { type: 'message_stop', data: {}, delayMs: 50 },
      ])
      .build();
  }

  static connectionDrop(): RemoteMockConfig {
    return new RemoteMockBuilderImpl()
      .name('codex-websocket-drop')
      .withServer({ startupDelayMs: 100 })
      .withConnection({ disconnectAfterEvents: 2 })
      .withWebSocket({ dropConnection: { afterMs: 1000, reconnectDelayMs: 500 } })
      .addEvents([
        { type: 'session_start', data: { sessionId: 'mock_session' }, delayMs: 50 },
        { type: 'text_delta', data: { delta: 'Starting...', accumulated: 'Starting...' }, delayMs: 100 },
        { type: 'text_delta', data: { delta: ' reconnecting...', accumulated: 'Starting... reconnecting...' }, delayMs: 200 },
      ])
      .build();
  }

  static highThroughput(): RemoteMockConfig {
    const events: MockStreamEvent[] = [
      { type: 'session_start', data: { sessionId: 'high_throughput_session' }, delayMs: 10 },
    ];
    for (let i = 0; i < 50; i++) {
      events.push({
        type: 'text_delta',
        data: { delta: `chunk_${i} `, accumulated: `chunk_0 ${'chunk_'.repeat(i)}${i} ` },
        delayMs: 5,
      });
    }
    events.push({ type: 'message_stop', data: {}, delayMs: 10 });
    return new RemoteMockBuilderImpl()
      .name('codex-websocket-high-throughput')
      .withWebSocket({ pingIntervalMs: 1000 })
      .addEvents(events)
      .build();
  }
}

export function createRemoteMockBuilder(): RemoteMockBuilder {
  return new RemoteMockBuilderImpl();
}

export function createMockServer(config: RemoteMockConfig): MockServer {
  return new MockServer(config);
}

export const remoteMocks = {
  opencode: OpenCodeHttpMock,
  codex: CodexWebSocketMock,
  builder: createRemoteMockBuilder,
  server: createMockServer,
};
