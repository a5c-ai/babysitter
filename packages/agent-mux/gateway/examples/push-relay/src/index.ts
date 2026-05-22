import * as http from 'node:http';

import apn from 'apn';

type HookWebhookPayload = {
  type: 'hook.request';
  runId: string;
  hookRequestId: string;
  kind: string;
  compact: string;
  pushTargets: Array<{ deviceToken?: string; topic?: string }>;
};

const port = Number(process.env.PORT ?? '8788');
const provider = new apn.Provider({
  token: {
    key: process.env.APN_KEY_PATH ?? '',
    keyId: process.env.APN_KEY_ID ?? '',
    teamId: process.env.APN_TEAM_ID ?? '',
  },
  production: process.env.APN_PRODUCTION === '1',
});

const server = http.createServer(async (req, res) => {
  if (req.method !== 'POST' || req.url !== '/hook-request') {
    res.writeHead(404).end();
    return;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }
  const payload = JSON.parse(Buffer.concat(chunks).toString('utf8')) as HookWebhookPayload;

  const notification = new apn.Notification();
  notification.pushType = 'background';
  notification.priority = 5;
  notification.topic = payload.pushTargets[0]?.topic ?? process.env.APN_TOPIC ?? '';
  notification.payload = payload;
  notification.aps = { 'content-available': 1 };

  const deviceTokens = payload.pushTargets.map((target) => target.deviceToken).filter((token): token is string => Boolean(token));
  if (deviceTokens.length > 0) {
    await provider.send(notification, deviceTokens);
  }

  res.writeHead(202, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ accepted: deviceTokens.length }));
});

server.listen(port, '0.0.0.0', () => {
  console.log(`push relay listening on ${port}`);
});
