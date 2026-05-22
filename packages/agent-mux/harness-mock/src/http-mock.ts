/**
 * HTTP Server mock implementation for harness-mock.
 */

import { EventEmitter } from 'node:events';
import { createServer, IncomingMessage, ServerResponse } from 'node:http';
import type {
  HarnessScenario,
  HttpServerMockHandle,
  MockExecutionResult,
  HttpServerResult,
  FileOperation,
} from './types.js';

export class HttpServerMock extends EventEmitter implements HttpServerMockHandle {
  readonly scenario: HarnessScenario;
  readonly id: number;
  readonly serverUrl: string;
  readonly port: number;

  private _exited = false;
  private _fileChanges: FileOperation[] = [];
  private _requestHistory: Array<{
    method: string;
    path: string;
    headers: Record<string, string>;
    body: unknown;
    timestamp: Date;
  }> = [];
  private _server: ReturnType<typeof createServer> | null = null;
  private _isRunning = false;
  private _startTime = Date.now();

  constructor(scenario: HarnessScenario, id: number) {
    super();
    this.scenario = scenario;
    this.id = id;
    this.port = scenario.httpServer?.port || 8080;
    this.serverUrl = `http://localhost:${this.port}`;
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

  get requestHistory() {
    return [...this._requestHistory];
  }

  async start(): Promise<void> {
    if (this._server) {
      throw new Error('Server already started');
    }

    // Simulate startup delay
    if (this.scenario.httpServer?.startupDelayMs) {
      await new Promise(resolve => setTimeout(resolve, this.scenario.httpServer!.startupDelayMs));
    }

    // Simulate startup failure
    if (this.scenario.httpServer?.startupFails) {
      throw new Error('Mock HTTP server startup failed');
    }

    this._server = createServer((req, res) => {
      this.handleRequest(req, res);
    });

    return new Promise((resolve, reject) => {
      this._server!.listen(this.port, (err?: Error) => {
        if (err) {
          reject(err);
        } else {
          this._isRunning = true;
          this.emit('started');
          resolve();
        }
      });
    });
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    // Collect request body
    let body = '';
    req.on('data', chunk => {
      body += chunk;
    });

    req.on('end', async () => {
      // Log request
      this._requestHistory.push({
        method: req.method || 'GET',
        path: req.url || '/',
        headers: req.headers as Record<string, string>,
        body: body ? JSON.parse(body) : undefined,
        timestamp: new Date(),
      });

      // Apply global delay
      if (this.scenario.httpServer?.globalDelayMs) {
        await new Promise(resolve => setTimeout(resolve, this.scenario.httpServer!.globalDelayMs));
      }

      // Find route configuration
      const routeKey = `${req.method} ${req.url}`;
      const route = this.scenario.httpServer?.routes?.[routeKey] ||
                   this.scenario.httpServer?.routes?.[req.url || '/'];

      // Apply route-specific delay
      if (route?.delayMs) {
        await new Promise(resolve => setTimeout(resolve, route.delayMs));
      }

      // Set headers
      if (this.scenario.httpServer?.enableCors) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      }

      if (route?.headers) {
        Object.entries(route.headers).forEach(([key, value]) => {
          res.setHeader(key, value);
        });
      }

      // Set status code
      res.statusCode = route?.status || 200;

      // Generate response body
      let responseBody: unknown = route?.body;
      if (typeof route?.body === 'function') {
        responseBody = route.body(req);
      }

      // Handle streaming responses
      if (route?.streaming && route?.streamChunks) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for (const chunk of route.streamChunks) {
          if (chunk.delayMs) {
            await new Promise(resolve => setTimeout(resolve, chunk.delayMs));
          }
          res.write(`data: ${JSON.stringify(chunk.data)}\n\n`);
        }
        res.end();
      } else {
        // Standard response
        const response = typeof responseBody === 'string'
          ? responseBody
          : JSON.stringify(responseBody || { status: 'ok' });

        res.setHeader('Content-Type', 'application/json');
        res.end(response);
      }

      // Simulate file operations
      if (this.scenario.fileOperations) {
        this._fileChanges.push(...this.scenario.fileOperations);
      }

      // Emit events
      if (this.scenario.events) {
        for (const event of this.scenario.events) {
          if (event.delayMs) {
            setTimeout(() => {
              this.emit('event', event);
            }, event.delayMs);
          } else {
            this.emit('event', event);
          }
        }
      }
    });
  }

  getStatus() {
    return {
      isRunning: this._isRunning,
      requestCount: this._requestHistory.length,
      uptime: Date.now() - this._startTime,
    };
  }

  reset(): void {
    this._requestHistory.length = 0;
    this._fileChanges.length = 0;
  }

  async stop(): Promise<void> {
    if (this._server) {
      return new Promise(resolve => {
        this._server!.close(() => {
          this._isRunning = false;
          this._exited = true;
          this.emit('stopped');
          resolve();
        });
      });
    }
  }

  forceStop(): void {
    if (this._server) {
      this._server.closeAllConnections?.();
      this._server.close();
      this._isRunning = false;
      this._exited = true;
      this.emit('stopped');
    }
  }

  async waitForCompletion(): Promise<MockExecutionResult> {
    if (!this._exited) {
      await new Promise(resolve => this.once('stopped', resolve));
    }

    const durationMs = Date.now() - this._startTime;
    const averageResponseTime = this._requestHistory.length > 0
      ? this._requestHistory.reduce((sum) => sum + 50, 0) / this._requestHistory.length // Mock timing
      : 0;

    const result: HttpServerResult = {
      type: 'http',
      requestCount: this._requestHistory.length,
      requestHistory: this._requestHistory.map(req => ({
        method: req.method,
        path: req.path,
        status: 200, // Mock successful responses
      })),
      averageResponseTimeMs: averageResponseTime,
    };

    return {
      success: true,
      durationMs,
      results: result,
    };
  }
}