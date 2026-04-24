import type { AgentEvent } from '@a5c-ai/agent-mux-core';

export interface ProgrammaticMockConfig {
  name?: string;
  authSucceeds: boolean;
  events: MockStreamEvent[];
  startDelayMs?: number;
  simulateError?: {
    errorCode: string;
    message: string;
    delayMs?: number;
  };
  cost?: {
    inputTokens: number;
    outputTokens: number;
    thinkingTokens?: number;
    totalUsd: number;
  };
}

export interface MockStreamEvent {
  type: string;
  data: Record<string, unknown>;
  delayMs?: number;
}

export interface RemoteMockConfig {
  name?: string;
  server?: {
    startupDelayMs?: number;
    port?: number;
    startupFails?: boolean;
  };
  connection?: {
    connectDelayMs?: number;
    connectFails?: boolean;
    disconnectAfterEvents?: number;
  };
  websocket?: {
    channels?: string[];
    pingIntervalMs?: number;
    dropConnection?: {
      afterMs: number;
      reconnectDelayMs?: number;
    };
  };
  http?: {
    baseUrl?: string;
    endpointDelays?: Record<string, number>;
    statusCodes?: Record<string, number>;
  };
  events: MockStreamEvent[];
  simulateErrors?: {
    networkTimeout?: boolean;
    connectionReset?: boolean;
    invalidResponse?: boolean;
    authFailure?: boolean;
  };
}

export interface ProgrammaticMockResponse {
  events: AgentEvent[];
  durationMs: number;
  success: boolean;
  error?: {
    code: string;
    message: string;
  };
}

export interface MockServerInfo {
  serverId: string;
  endpoint: string;
  port: number;
  startedAt: Date;
  status: 'starting' | 'running' | 'stopped' | 'error';
}

export interface MockConnection {
  connectionId: string;
  connectionType: 'http' | 'websocket';
  endpoint: string;
  state: 'connecting' | 'connected' | 'disconnected' | 'error';
  send(data: unknown): Promise<void>;
  receive(): AsyncIterableIterator<AgentEvent>;
  close(): Promise<void>;
  getStats(): {
    eventsReceived: number;
    eventsSent: number;
    connectTime: Date;
    lastActivity: Date;
  };
}

export interface ProgrammaticMockBuilder {
  name(name: string): this;
  withAuth(succeeds: boolean): this;
  addEvents(events: MockStreamEvent[]): this;
  addEvent(type: string, data: Record<string, unknown>, delayMs?: number): this;
  addTextStream(text: string, chunkSize?: number, delayBetweenChunks?: number): this;
  addToolCall(toolName: string, input: string, output: unknown, processingTimeMs?: number): this;
  addThinking(thinkingContent: string, delayMs?: number): this;
  withCost(inputTokens: number, outputTokens: number, thinkingTokens?: number): this;
  withError(code: string, message: string, delayMs?: number): this;
  build(): ProgrammaticMockConfig;
}

export interface RemoteMockBuilder {
  name(name: string): this;
  withServer(config: RemoteMockConfig['server']): this;
  withConnection(config: RemoteMockConfig['connection']): this;
  withWebSocket(config: RemoteMockConfig['websocket']): this;
  withHttp(config: RemoteMockConfig['http']): this;
  addEvents(events: MockStreamEvent[]): this;
  withErrors(errors: RemoteMockConfig['simulateErrors']): this;
  build(): RemoteMockConfig;
}

export interface ScriptableTransportResponse {
  status?: number;
  headers?: Record<string, string>;
  body?: string | object | ((req: unknown) => unknown);
  delayMs?: number;
}

export interface ScriptableTransportStep {
  method?: string;
  path: string;
  response?: ScriptableTransportResponse;
}

export interface ScriptableTransportBuilder {
  name(name: string): this;
  http(config?: { port?: number; enableCors?: boolean }): this;
  websocket(config?: { port?: number; reconnectDelayMs?: number }): this;
  onRequest(path: string, response: ScriptableTransportResponse, method?: string): this;
  emitEvent(type: string, data: Record<string, unknown>, delayMs?: number): this;
  build(): import('../types.js').HarnessScenario;
}

export interface MockConfigFactory {
  claudeAgentSdk(): ProgrammaticMockBuilder;
  codexSdk(): ProgrammaticMockBuilder;
  piSdk(): ProgrammaticMockBuilder;
  opencodeHttp(): RemoteMockBuilder;
  codexWebSocket(): RemoteMockBuilder;
  programmatic(): ProgrammaticMockBuilder;
  remote(): RemoteMockBuilder;
  scriptedTransport(): ScriptableTransportBuilder;
}

export interface MockScenarios {
  basicSuccess: {
    programmatic: ProgrammaticMockConfig;
    remote: RemoteMockConfig;
  };
  toolCalling: {
    programmatic: ProgrammaticMockConfig;
    remote: RemoteMockConfig;
  };
  errors: {
    authFailure: ProgrammaticMockConfig;
    networkTimeout: RemoteMockConfig;
    connectionDrop: RemoteMockConfig;
    invalidResponse: RemoteMockConfig;
  };
  performance: {
    highThroughput: RemoteMockConfig;
    lowLatency: ProgrammaticMockConfig;
    largeBatch: ProgrammaticMockConfig;
  };
  edgeCases: {
    emptyResponse: ProgrammaticMockConfig;
    malformedEvents: RemoteMockConfig;
    reconnection: RemoteMockConfig;
  };
}
