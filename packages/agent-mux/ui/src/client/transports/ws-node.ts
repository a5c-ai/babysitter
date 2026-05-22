import WebSocket from 'ws';

import type { GatewaySocket } from './ws-browser.js';

export function createWebSocket(url: string, token?: string): GatewaySocket {
  const socket = new WebSocket(url, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined);
  return {
    send(data) {
      socket.send(data);
    },
    close(code, reason) {
      socket.close(code, reason);
    },
    onOpen(handler) {
      socket.on('open', handler);
    },
    onMessage(handler) {
      socket.on('message', (data) => handler(String(data)));
    },
    onClose(handler) {
      socket.on('close', (code, reason) => handler({ code, reason: String(reason) }));
    },
    onError(handler) {
      socket.on('error', handler);
    },
  };
}
