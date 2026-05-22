import * as http from 'node:http';
import { once } from 'node:events';

export interface MockUpstream {
  url: string;
  requests: Array<{ method: string; path: string; body: string; headers: http.IncomingHttpHeaders }>;
  close(): Promise<void>;
}

export async function startMockUpstream(
  responseBody: unknown = {
    id: 'upstream-response',
    object: 'chat.completion',
    choices: [{ message: { role: 'assistant', content: 'Hello from upstream' } }],
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  },
): Promise<MockUpstream> {
  const requests: MockUpstream['requests'] = [];
  const server = http.createServer(async (req, res) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    requests.push({
      method: req.method ?? 'GET',
      path: req.url ?? '/',
      body: Buffer.concat(chunks).toString('utf8'),
      headers: req.headers,
    });

    res.statusCode = 200;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify(responseBody));
  });

  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to start mock upstream server.');
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    requests,
    async close() {
      server.close();
      await once(server, 'close');
    },
  };
}
