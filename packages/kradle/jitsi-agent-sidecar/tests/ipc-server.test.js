import assert from 'node:assert/strict';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { stat, rm } from 'node:fs/promises';

import { createIpcServer } from '../src/ipc-server.js';
import { createRuntimeState } from '../src/runtime-state.js';

const sockets = [];

afterEach(async () => {
  await Promise.all(sockets.splice(0).map((socketPath) => rm(socketPath, { force: true })));
});

function socketPath(name) {
  const value = path.join(os.tmpdir(), `kradle-jitsi-${process.pid}-${Date.now()}-${name}.sock`);
  sockets.push(value);
  return value;
}

function connectAndCollect(socketPath) {
  return new Promise((resolve, reject) => {
    const client = net.createConnection(socketPath);
    let buffer = '';
    const messages = [];
    client.on('data', (chunk) => {
      buffer += chunk.toString('utf8');
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.trim()) messages.push(JSON.parse(line));
      }
    });
    client.on('connect', () => resolve({ client, messages }));
    client.on('error', reject);
  });
}

function waitFor(predicate) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (predicate()) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - started > 1000) {
        clearInterval(timer);
        reject(new Error('timed out waiting for IPC response'));
      }
    }, 10);
  });
}

describe('Jitsi sidecar IPC contract from docs/jitsi/07-agent-meeting-runtime.md', () => {
  it('creates /tmp/jitsi-agent.sock-compatible Unix socket with 0600 permissions', async () => {
    const runtime = { handleCommand: async () => ({ ok: true }) };
    const server = createIpcServer({ socketPath: socketPath('permissions'), runtime });

    await server.start();
    const mode = (await stat(server.socketPath)).mode & 0o777;
    await server.stop();

    assert.equal(mode, 0o600);
  });

  it('parses NDJSON commands and replies with transcript and participant state', async () => {
    const state = createRuntimeState();
    state.addTranscript({ speaker: 'alice', text: 'hello', timestamp: '2026-05-30T09:00:00Z' });
    state.setParticipant({ id: 'alice', name: 'Alice' });
    const runtime = {
      handleCommand: async (command) => {
        if (command.action === 'get_transcript') return { ok: true, transcript: state.getTranscript() };
        if (command.action === 'get_participants') return { ok: true, participants: state.getParticipants() };
        return { ok: true };
      },
    };
    const server = createIpcServer({ socketPath: socketPath('state'), runtime });

    await server.start();
    const { client, messages } = await connectAndCollect(server.socketPath);
    client.write(JSON.stringify({ action: 'get_transcript' }) + '\n');
    client.write(JSON.stringify({ action: 'get_participants' }) + '\n');

    await waitFor(() => messages.length === 2);
    client.end();
    await server.stop();

    assert.equal(messages[0].type, 'command_result');
    assert.equal(messages[0].transcript[0].speaker, 'alice');
    assert.equal(messages[1].participants[0].name, 'Alice');
  });

  it('emits protocol errors for malformed JSON and unsupported actions without crashing', async () => {
    const runtime = { handleCommand: async () => ({ ok: true }) };
    const server = createIpcServer({ socketPath: socketPath('errors'), runtime });

    await server.start();
    const { client, messages } = await connectAndCollect(server.socketPath);
    client.write('{not-json}\n');
    client.write(JSON.stringify({ action: 'not_supported' }) + '\n');

    await waitFor(() => messages.length === 2);
    client.end();
    await server.stop();

    assert.equal(messages[0].type, 'error');
    assert.equal(messages[1].type, 'error');
    assert.match(messages[1].message, /unsupported action/i);
  });
});
