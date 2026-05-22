import * as http from 'node:http';
import { once } from 'node:events';

import { describe, expect, it } from 'vitest';

import { createHookWebhookPayload, emitHookWebhook } from '../src/notifications/webhook-out.js';

describe('notification webhook', () => {
  it('posts a compact hook payload to the configured relay', async () => {
    const received: string[] = [];
    const server = http.createServer(async (req, res) => {
      for await (const chunk of req) {
        received.push(Buffer.from(chunk).toString('utf8'));
      }
      res.writeHead(202).end();
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');

    const address = server.address();
    if (!address || typeof address === 'string') {
      throw new Error('server address unavailable');
    }

    const payload = createHookWebhookPayload('run-1', 'hook-1', 'preToolUse', {
      toolName: 'bash',
      command: 'echo hello',
      pushTargets: [{ deviceToken: 'token', topic: 'ai.a5c.agentmux.ios' }],
    });

    await emitHookWebhook(
      { url: `http://127.0.0.1:${address.port}`, timeoutMs: 1000 },
      payload,
    );

    server.close();
    expect(received[0]).toContain('"type":"hook.request"');
    expect(received[0]).toContain('"pushTargets"');
  });
});
