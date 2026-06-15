import { randomUUID } from 'node:crypto';
import type { WebSocket } from 'ws';

import type { TokenRecord } from '../auth/tokens.js';
import { encodeFrame } from '../protocol/frames.js';
import type { GatewayFrame } from '../protocol/v1.js';
import { GATEWAY_CLOSE_CODES } from '../protocol/errors.js';

export class ClientConn {
  readonly id = randomUUID();
  readonly socket: WebSocket;
  readonly subscriptions = new Set<string>();
  readonly sessionSubscriptions = new Set<string>();
  readonly connectedAt = Date.now();
  tokenId: string | null;
  authenticated = false;

  private pendingFrames = 0;

  constructor(
    socket: WebSocket,
    private readonly maxPendingFrames: number,
    tokenRecord?: TokenRecord | null,
  ) {
    this.socket = socket;
    this.tokenId = tokenRecord?.id ?? null;
    this.authenticated = tokenRecord != null;
  }

  authenticate(record: TokenRecord): void {
    this.tokenId = record.id;
    this.authenticated = true;
  }

  send(frame: GatewayFrame): void {
    this.sendEncoded(encodeFrame(frame));
  }

  sendJson(payload: Record<string, unknown>): void {
    this.sendEncoded(JSON.stringify(payload));
  }

  private sendEncoded(payload: string): void {
    if (this.socket.readyState !== this.socket.OPEN) {
      return;
    }
    this.pendingFrames += 1;
    if (this.pendingFrames > this.maxPendingFrames) {
      this.socket.close(GATEWAY_CLOSE_CODES.backpressure, 'backpressure');
      return;
    }
    this.socket.send(payload, () => {
      this.pendingFrames = Math.max(0, this.pendingFrames - 1);
    });
  }

  close(code: number, reason: string): void {
    if (this.socket.readyState === this.socket.CLOSED) {
      return;
    }
    const normalizedReason = Buffer.from(reason, 'utf8').byteLength <= 123
      ? reason
      : `${reason.slice(0, 120)}...`;
    this.socket.close(code, normalizedReason);
  }
}
