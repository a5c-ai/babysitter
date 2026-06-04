export interface GatewaySocket {
  send(data: string): void;
  close(code?: number, reason?: string): void;
  onOpen(handler: () => void): void;
  onMessage(handler: (data: string) => void): void;
  onClose(handler: (event?: { code?: number; reason?: string }) => void): void;
  onError(handler: (error: unknown) => void): void;
}

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
      socket.addEventListener('message', (event) => handler(String(event.data)));
    },
    onClose(handler) {
      socket.addEventListener('close', (event) => handler({ code: event.code, reason: event.reason }));
    },
    onError(handler) {
      socket.addEventListener('error', handler);
    },
  };
}
