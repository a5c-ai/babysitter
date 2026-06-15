import type { GatewaySocket } from './ws-browser.js';

export function createWebSocket(url: string): GatewaySocket {
  const socket = new WebSocket(url);
  return {
    send(data) {
      socket.send(data);
    },
    close(code, reason) {
      socket.close(code, reason);
    },
    onOpen(handler) {
      socket.addEventListener('open', handler);
    },
    onMessage(handler) {
      socket.addEventListener('message', (event) => handler(String((event as { data?: unknown }).data ?? '')));
    },
    onClose(handler) {
      socket.addEventListener('close', handler);
    },
    onError(handler) {
      socket.addEventListener('error', handler);
    },
  };
}
