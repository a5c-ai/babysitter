import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createPuppeteerJitsiClient } from '../src/puppeteer-jitsi-client.js';

describe('local Jitsi integration smoke', () => {
  it('connects to local Jitsi only when JITSI_LOCAL_TEST_URL is configured', async (t) => {
    if (!process.env.JITSI_LOCAL_TEST_URL) {
      t.skip('JITSI_LOCAL_TEST_URL is not set; #623 local Jitsi dependency unavailable');
      return;
    }

    const client = createPuppeteerJitsiClient({
      roomUrl: process.env.JITSI_LOCAL_TEST_URL,
      jwt: process.env.JITSI_LOCAL_TEST_JWT || '',
      roomId: 'local-jitsi-smoke',
      participantName: 'Kradle Sidecar Smoke',
      headless: true,
    });

    const result = await client.connect();
    await client.disconnect('smoke-complete');

    assert.ok(result.connected);
  });
});
