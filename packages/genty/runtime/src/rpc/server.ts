import { createInterface } from 'node:readline';
import type { RpcRequest, RpcResponse, RpcEvent, RpcMethod } from './types.js';

export type RpcHandler = (params: Record<string, unknown>) => Promise<unknown>;

export class RpcServer {
  private handlers = new Map<string, RpcHandler>();
  private running = false;

  register(method: RpcMethod | string, handler: RpcHandler): void {
    this.handlers.set(method, handler);
  }

  emit(event: string, data: unknown): void {
    const msg: RpcEvent = { event, data, timestamp: new Date().toISOString() };
    process.stdout.write(JSON.stringify(msg) + '\n');
  }

  async start(): Promise<void> {
    this.running = true;
    const rl = createInterface({ input: process.stdin, terminal: false });

    this.emit('server.ready', { methods: [...this.handlers.keys()] });

    for await (const line of rl) {
      if (!this.running) break;
      if (!line.trim()) continue;

      let request: RpcRequest;
      try {
        request = JSON.parse(line);
      } catch {
        this.sendError('parse-error', -32700, 'Parse error');
        continue;
      }

      if (!request.id || !request.method) {
        this.sendError(request.id ?? 'unknown', -32600, 'Invalid request: missing id or method');
        continue;
      }

      const handler = this.handlers.get(request.method);
      if (!handler) {
        this.sendError(request.id, -32601, `Method not found: ${request.method}`);
        continue;
      }

      try {
        const result = await handler(request.params ?? {});
        this.sendResult(request.id, result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.sendError(request.id, -32000, message);
      }
    }
  }

  stop(): void {
    this.running = false;
    this.emit('server.shutdown', {});
  }

  private sendResult(id: string, result: unknown): void {
    const response: RpcResponse = { id, result };
    process.stdout.write(JSON.stringify(response) + '\n');
  }

  private sendError(id: string, code: number, message: string, data?: unknown): void {
    const response: RpcResponse = { id, error: { code, message, data } };
    process.stdout.write(JSON.stringify(response) + '\n');
  }
}
