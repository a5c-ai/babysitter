/**
 * WebSocket server mock implementation for harness-mock.
 */

import { EventEmitter } from 'node:events';
import WebSocket, { WebSocketServer } from 'ws';
import type { RawData } from 'ws';
import type {
  FileOperation,
  HarnessScenario,
  MockExecutionResult,
  WebSocketServerMockHandle,
  WebSocketServerResult,
} from './types.js';

interface MockConnectionState {
  connectionId: string;
  socket: WebSocket;
  connectedAt: Date;
  disconnectedAt?: Date;
  messageCount: number;
  timers: ReturnType<typeof setTimeout>[];
}

let nextConnectionId = 1;

export class WebSocketServerMock extends EventEmitter implements WebSocketServerMockHandle {
  readonly scenario: HarnessScenario;
  readonly id: number;

  private _port: number;
  private _serverUrl: string;
  private _server: WebSocketServer | null = null;

  private _exited = false;
  private _isRunning = false;
  private _startTime = Date.now();
  private _fileChanges: FileOperation[] = [];
  private readonly _messageHistory: Array<{
    connectionId: string;
    direction: 'inbound' | 'outbound';
    message: unknown;
    timestamp: Date;
  }> = [];
  private readonly _connections = new Map<string, MockConnectionState>();
  private readonly _completedConnections: MockConnectionState[] = [];
  private _reconnectAllowedAt: number | null = null;
  private _reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(scenario: HarnessScenario, id: number) {
    super();
    this.scenario = scenario;
    this.id = id;
    this._port = scenario.websocketServer?.port ?? 8081;
    const host = scenario.websocketServer?.host ?? '127.0.0.1';
    this._serverUrl = `ws://${host}:${this._port}`;
  }

  get port(): number {
    return this._port;
  }

  get serverUrl(): string {
    return this._serverUrl;
  }

  get exited(): boolean {
    return this._exited;
  }

  get fileChanges(): FileOperation[] {
    return [...this._fileChanges];
  }

  get isRunning(): boolean {
    return this._isRunning;
  }

  get connectionCount(): number {
    return this._connections.size;
  }

  get messageHistory() {
    return [...this._messageHistory];
  }

  async start(): Promise<void> {
    if (this._server || this._isRunning) {
      throw new Error('WebSocket server already started');
    }

    const config = this.scenario.websocketServer;
    if (config?.startupDelayMs) {
      await new Promise((resolve) => setTimeout(resolve, config.startupDelayMs));
    }
    if (config?.startupFails) {
      throw new Error('Mock WebSocket server startup failed');
    }

    const host = config?.host ?? '127.0.0.1';
    const port = config?.port ?? 8081;
    this._port = port;
    this._serverUrl = `ws://${host}:${port}`;
    this._server = new WebSocketServer({
      host,
      port,
      maxPayload: 1024 * 1024 * 8,
    });

    try {
      await new Promise<void>((resolve, reject) => {
        const server = this._server;
        if (!server) {
          reject(new Error('WebSocket server failed to initialize'));
          return;
        }

        const cleanup = () => {
          server.off('error', onError);
          server.off('listening', onListening);
        };
        const onError = (error: Error) => {
          cleanup();
          reject(error);
        };
        const onListening = () => {
          cleanup();
          const address = server.address();
          if (address && typeof address === 'object' && 'port' in address) {
            this._port = address.port;
            this._serverUrl = `ws://${host}:${address.port}`;
          }
          this._isRunning = true;
          this.emit('started');
          resolve();
        };

        server.once('error', onError);
        server.once('listening', onListening);
      });
    } catch (error) {
      this._isRunning = false;
      if (this._server) {
        await new Promise<void>((resolve) => this._server?.close(() => resolve()));
        this._server = null;
      }
      throw error;
    }

    this._server.on('connection', (socket) => {
      if (!this._isRunning) {
        socket.close(1012, 'Server stopping');
        return;
      }

      const now = Date.now();
      if (this._reconnectAllowedAt != null && now < this._reconnectAllowedAt) {
        socket.close(1013, 'Reconnect not yet allowed');
        return;
      }
      const isReconnect = this._reconnectAllowedAt != null && now >= this._reconnectAllowedAt;
      if (isReconnect) {
        this._reconnectAllowedAt = null;
      }

      if (this.scenario.websocketServer?.maxConnections != null
        && this._connections.size >= this.scenario.websocketServer.maxConnections) {
        socket.close(1013, 'Mock connection limit reached');
        return;
      }

      const connection = this.createConnection(socket);
      this.emit('connection', connection.connectionId);
      if (isReconnect) {
        this.emit('reconnected', connection.connectionId);
      }
      this.scheduleScenarioEvents(connection);
      this.attachSocketHandlers(connection);
    });
  }

  broadcast(message: unknown): void {
    for (const connectionId of this._connections.keys()) {
      this.sendTo(connectionId, message);
    }
  }

  sendTo(connectionId: string, message: unknown): void {
    const connection = this._connections.get(connectionId);
    if (!connection) {
      throw new Error(`Unknown connection: ${connectionId}`);
    }
    if (connection.disconnectedAt) {
      throw new Error(`Connection already closed: ${connectionId}`);
    }
    this.sendFrame(connection, message);
  }

  receiveFrom(connectionId: string, message: unknown): void {
    const connection = this._connections.get(connectionId);
    if (!connection) {
      throw new Error(`Unknown connection: ${connectionId}`);
    }
    if (connection.disconnectedAt) {
      throw new Error(`Connection already closed: ${connectionId}`);
    }
    this.recordMessage(connection, 'inbound', message);
    this.emit('message', { connectionId, direction: 'inbound', message });
    this.checkForDrop(connection);
  }

  dropConnection(connectionId: string): void {
    const connection = this._connections.get(connectionId);
    if (!connection || connection.disconnectedAt) {
      return;
    }
    this.closeConnection(connection, 1011, 'Mock connection dropped');

    const drops = this.scenario.websocketServer?.simulateDrops;
    if (drops?.reconnectDelayMs != null) {
      this._reconnectAllowedAt = Date.now() + drops.reconnectDelayMs;
      if (this._reconnectTimer) {
        clearTimeout(this._reconnectTimer);
      }
      this._reconnectTimer = setTimeout(() => {
        this._reconnectTimer = null;
        if (!this._isRunning) return;
        if (this._reconnectAllowedAt != null && Date.now() >= this._reconnectAllowedAt) {
          this._reconnectAllowedAt = null;
        }
      }, drops.reconnectDelayMs);
    }
  }

  getConnectionStatus() {
    return Array.from(this._connections.values()).map((connection) => ({
      connectionId: connection.connectionId,
      connectedAt: connection.connectedAt,
      messageCount: connection.messageCount,
    }));
  }

  async stop(): Promise<void> {
    if (!this._isRunning) {
      this._exited = true;
      return;
    }
    this._isRunning = false;
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
      this._reconnectTimer = null;
    }
    for (const connection of [...this._connections.values()]) {
      this.closeConnection(connection, 1001, 'Server stopped');
    }
    this._connections.clear();
    await new Promise<void>((resolve) => {
      if (!this._server) {
        resolve();
        return;
      }
      this._server.close(() => resolve());
      this._server = null;
    });
    this._exited = true;
    this.emit('stopped');
  }

  forceStop(): void {
    void this.stop();
  }

  async waitForCompletion(): Promise<MockExecutionResult> {
    if (!this._exited) {
      await new Promise<void>((resolve) => this.once('stopped', resolve));
    }

    const durationMs = Date.now() - this._startTime;
    const completedConnections = this.getHistoricalConnections();
    const averageConnectionDurationMs = completedConnections.length === 0
      ? durationMs
      : completedConnections.reduce((sum, connection) => sum + connection.durationMs, 0) / completedConnections.length;

    const result: WebSocketServerResult = {
      type: 'websocket',
      connectionCount: completedConnections.length,
      messageCount: this._messageHistory.length,
      averageConnectionDurationMs,
    };

    return {
      success: true,
      durationMs,
      results: result,
    };
  }

  private createConnection(socket: WebSocket): MockConnectionState {
    const connectionId = `ws-${nextConnectionId++}`;
    const connection: MockConnectionState = {
      connectionId,
      socket,
      connectedAt: new Date(),
      messageCount: 0,
      timers: [],
    };
    this._connections.set(connectionId, connection);
    return connection;
  }

  private scheduleScenarioEvents(connection: MockConnectionState): void {
    let delayMs = 0;
    for (const event of this.scenario.events ?? []) {
      delayMs += event.delayMs ?? 0;
      const timer = setTimeout(() => {
        if (!this._isRunning || !this._connections.has(connection.connectionId)) {
          return;
        }
        this.sendFrame(connection, event);
        this.emit('event', { connectionId: connection.connectionId, event });
      }, delayMs);
      connection.timers.push(timer);
    }

    for (const op of this.scenario.fileOperations ?? []) {
      this._fileChanges.push(op);
    }
  }

  private recordMessage(
    connection: MockConnectionState,
    direction: 'inbound' | 'outbound',
    message: unknown,
  ): void {
    connection.messageCount += 1;
    this._messageHistory.push({
      connectionId: connection.connectionId,
      direction,
      message,
      timestamp: new Date(),
    });
  }

  private sendFrame(connection: MockConnectionState, message: unknown): void {
    if (connection.socket.readyState !== WebSocket.OPEN) {
      throw new Error(`Connection already closed: ${connection.connectionId}`);
    }
    this.recordMessage(connection, 'outbound', message);
    connection.socket.send(typeof message === 'string' ? message : JSON.stringify(message));
    this.emit('message', { connectionId: connection.connectionId, direction: 'outbound', message });
    this.checkForDrop(connection);
  }

  private attachSocketHandlers(connection: MockConnectionState): void {
    connection.socket.on('message', (data, isBinary) => {
      const message = this.decodeMessage(data, isBinary);
      this.receiveFrom(connection.connectionId, message);
    });

    connection.socket.once('close', () => {
      this.finalizeConnection(connection);
    });

    connection.socket.once('error', (error) => {
      if (!connection.disconnectedAt) {
        this.emit('error', error);
      }
    });
  }

  private decodeMessage(data: RawData, isBinary: boolean): unknown {
    const normalized = this.normalizeRawData(data);
    if (isBinary) {
      return normalized;
    }
    const text = typeof normalized === 'string' ? normalized : normalized.toString('utf8');
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  private normalizeRawData(data: RawData): Buffer | string {
    if (typeof data === 'string') {
      return data;
    }
    if (Buffer.isBuffer(data)) {
      return data;
    }
    if (Array.isArray(data)) {
      return Buffer.concat(data);
    }
    return Buffer.from(new Uint8Array(data));
  }

  private closeConnection(connection: MockConnectionState, code: number, reason: string): void {
    if (connection.disconnectedAt) {
      return;
    }
    connection.disconnectedAt = new Date();
    for (const timer of connection.timers) {
      clearTimeout(timer);
    }
    connection.timers.length = 0;
    if (connection.socket.readyState === WebSocket.OPEN || connection.socket.readyState === WebSocket.CONNECTING) {
      connection.socket.close(code, reason);
    }
    this.finalizeConnection(connection);
  }

  private finalizeConnection(connection: MockConnectionState): void {
    if (!this._connections.has(connection.connectionId)) {
      return;
    }
    connection.disconnectedAt ??= new Date();
    this._connections.delete(connection.connectionId);
    if (!this._completedConnections.includes(connection)) {
      this._completedConnections.push(connection);
    }
    this.emit('disconnected', connection.connectionId);
  }

  private checkForDrop(connection: MockConnectionState): void {
    const drops = this.scenario.websocketServer?.simulateDrops;
    if (drops?.afterMessages != null && connection.messageCount >= drops.afterMessages) {
      this.dropConnection(connection.connectionId);
    }
  }

  private getHistoricalConnections(): Array<{ connectionId: string; durationMs: number }> {
    const allConnections = [...this._completedConnections, ...this._connections.values()];
    return allConnections.map((connection) => ({
      connectionId: connection.connectionId,
      durationMs: Math.max(
        0,
        (connection.disconnectedAt ?? new Date()).getTime() - connection.connectedAt.getTime(),
      ),
    }));
  }
}
