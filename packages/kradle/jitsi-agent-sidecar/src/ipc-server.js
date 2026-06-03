import net from 'node:net';
import { chmod, rm } from 'node:fs/promises';

const SUPPORTED_ACTIONS = new Set([
  'send_chat',
  'raise_hand',
  'lower_hand',
  'react',
  'speak_tts',
  'share_screen',
  'get_transcript',
  'get_participants',
  'disconnect',
]);

function writeJson(socket, message) {
  socket.write(`${JSON.stringify(message)}\n`);
}

function parseCommand(line) {
  let command;
  try {
    command = JSON.parse(line);
  } catch {
    return { error: 'Malformed NDJSON command' };
  }
  if (!command || typeof command !== 'object' || typeof command.action !== 'string') {
    return { error: 'Command must include an action string' };
  }
  if (!SUPPORTED_ACTIONS.has(command.action)) {
    return { error: `Unsupported action: ${command.action}` };
  }
  return { command };
}

export function createIpcServer({ socketPath = '/tmp/jitsi-agent.sock', runtime }) {
  if (!runtime || typeof runtime.handleCommand !== 'function') {
    throw new Error('createIpcServer requires runtime.handleCommand');
  }

  const clients = new Set();
  let server = null;

  return {
    socketPath,

    async start() {
      await rm(socketPath, { force: true });
      server = net.createServer((socket) => {
        clients.add(socket);
        let buffer = '';

        socket.on('data', async (chunk) => {
          buffer += chunk.toString('utf8');
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.trim()) continue;
            const parsed = parseCommand(line);
            if (parsed.error) {
              writeJson(socket, { type: 'error', message: parsed.error });
              continue;
            }

            try {
              const result = await runtime.handleCommand(parsed.command);
              writeJson(socket, { type: 'command_result', action: parsed.command.action, ...result });
            } catch (err) {
              writeJson(socket, { type: 'error', action: parsed.command.action, message: err.message || String(err) });
            }
          }
        });

        socket.on('close', () => clients.delete(socket));
        socket.on('error', () => clients.delete(socket));
      });

      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(socketPath, () => {
          server.off('error', reject);
          resolve();
        });
      });
      await chmod(socketPath, 0o600);
    },

    broadcast(event) {
      for (const client of clients) {
        if (!client.destroyed) writeJson(client, event);
      }
    },

    async stop() {
      for (const client of clients) client.destroy();
      clients.clear();
      if (server) {
        await new Promise((resolve) => server.close(resolve));
        server = null;
      }
      await rm(socketPath, { force: true });
    },
  };
}
