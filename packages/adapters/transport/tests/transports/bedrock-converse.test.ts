import { describe, expect, it } from 'vitest';

import { createTestApp } from '../helpers.js';
import { createMockCompletionEngine } from '../mocks/mock-completion-engine.js';

describe('bedrock converse transport', () => {
  it('returns converse response body', async () => {
    const app = createTestApp(
      {
        targetProvider: 'bedrock',
        targetModel: 'bedrock/anthropic.claude',
        exposedTransport: 'bedrock-converse',
      },
      createMockCompletionEngine({ text: 'World' }),
    );

    const response = await app.request('/converse', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'test-token',
      },
      body: JSON.stringify({
        modelId: 'claude',
        messages: [{ role: 'user', content: [{ text: 'test' }] }],
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.output.message.role).toBe('assistant');
    expect(body.output.message.content[0].text).toBe('World');
    expect(body.stopReason).toBeDefined();
  });
});
