import { describe, expect, it } from 'vitest';

import { createTestApp } from '../helpers.js';
import { createMockCompletionEngine } from '../mocks/mock-completion-engine.js';

describe('azure foundry transport', () => {
  it('returns foundry chat completions response', async () => {
    const app = createTestApp(
      {
        targetProvider: 'foundry',
        targetModel: 'foundry/gpt-4o',
        exposedTransport: 'azure-foundry',
      },
      createMockCompletionEngine({ text: 'Foundry reply' }),
    );

    const response = await app.request('/models/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'test-token',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: 'hi' }],
      }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.choices[0].message.role).toBe('assistant');
    expect(body.choices[0].message.content).toBe('Foundry reply');
  });
});
