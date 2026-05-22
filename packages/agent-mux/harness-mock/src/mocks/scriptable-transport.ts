import type { HarnessScenario } from '../types.js';
import type {
  ScriptableTransportBuilder,
  ScriptableTransportResponse,
  ScriptableTransportStep,
} from './mock-types.js';

type TransportKind = 'http' | 'websocket';

export class ScriptableTransportBuilderImpl implements ScriptableTransportBuilder {
  private nameValue = 'scriptable-transport';
  private transport: TransportKind = 'http';
  private httpConfig: { port?: number; enableCors?: boolean } = {};
  private websocketConfig: { port?: number; reconnectDelayMs?: number } = {};
  private readonly steps: ScriptableTransportStep[] = [];
  private readonly events: Array<{ type: string; data: Record<string, unknown>; delayMs?: number }> = [];

  name(name: string): this {
    this.nameValue = name;
    return this;
  }

  http(config: { port?: number; enableCors?: boolean } = {}): this {
    this.transport = 'http';
    this.httpConfig = { ...this.httpConfig, ...config };
    return this;
  }

  websocket(config: { port?: number; reconnectDelayMs?: number } = {}): this {
    this.transport = 'websocket';
    this.websocketConfig = { ...this.websocketConfig, ...config };
    return this;
  }

  onRequest(path: string, response: ScriptableTransportResponse, method = 'POST'): this {
    this.steps.push({
      method: method.toUpperCase(),
      path,
      response,
    });
    return this;
  }

  emitEvent(type: string, data: Record<string, unknown>, delayMs?: number): this {
    this.events.push({ type, data, delayMs });
    return this;
  }

  build(): HarnessScenario {
    if (this.transport === 'websocket') {
      return {
        harness: 'codex-websocket',
        executionType: 'websocket',
        name: this.nameValue,
        websocketServer: {
          port: this.websocketConfig.port,
          simulateDrops: this.websocketConfig.reconnectDelayMs == null
            ? undefined
            : { reconnectDelayMs: this.websocketConfig.reconnectDelayMs },
        },
        events: this.events.map((event) => ({
          type: event.type,
          data: event.data,
          delayMs: event.delayMs,
        })),
      };
    }

    const routes: Record<string, ScriptableTransportResponse> = {};
    for (const step of this.steps) {
      const key = `${step.method ?? 'POST'} ${step.path}`;
      routes[key] = {
        status: step.response?.status ?? 200,
        headers: step.response?.headers,
        body: step.response?.body,
        delayMs: step.response?.delayMs,
      };
    }

    return {
      harness: 'opencode-http',
      executionType: 'http',
      name: this.nameValue,
      httpServer: {
        port: this.httpConfig.port,
        enableCors: this.httpConfig.enableCors,
        routes,
      },
      events: this.events.map((event) => ({
        type: event.type,
        data: event.data,
        delayMs: event.delayMs,
      })),
    };
  }
}

export function createScriptableTransportBuilder(): ScriptableTransportBuilder {
  return new ScriptableTransportBuilderImpl();
}
