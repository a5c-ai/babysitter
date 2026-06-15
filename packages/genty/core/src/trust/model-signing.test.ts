import { describe, it, expect } from 'vitest';
import { createKeyPair } from './signing.js';
import { signModelResponse, verifyModelResponse } from './model-signing.js';

describe('trust/model-signing', () => {
  it('signs and verifies a model response', () => {
    const kp = createKeyPair();
    const response = {
      modelId: 'claude-sonnet-4',
      provider: 'anthropic',
      inputMessagesHash: 'abc123',
      outputContent: 'Hello world',
      timestamp: new Date().toISOString(),
    };
    const envelope = signModelResponse(kp, response);
    expect(verifyModelResponse(kp.publicKey, envelope)).toBe(true);
  });

  it('includes thinking content in signature', () => {
    const kp = createKeyPair();
    const response = {
      modelId: 'claude-opus-4',
      provider: 'anthropic',
      inputMessagesHash: 'def456',
      outputContent: 'Answer',
      thinkingContent: 'Let me reason about this...',
      tokenUsage: { input: 100, output: 50 },
      timestamp: new Date().toISOString(),
    };
    const envelope = signModelResponse(kp, response);
    expect(verifyModelResponse(kp.publicKey, envelope)).toBe(true);

    // Tampering thinking breaks signature
    envelope.payload.thinkingContent = 'Different thinking';
    expect(verifyModelResponse(kp.publicKey, envelope)).toBe(false);
  });

  it('rejects wrong key', () => {
    const kp1 = createKeyPair();
    const kp2 = createKeyPair();
    const envelope = signModelResponse(kp1, {
      modelId: 'm', provider: 'p', inputMessagesHash: 'h', outputContent: 'o', timestamp: 't',
    });
    expect(verifyModelResponse(kp2.publicKey, envelope)).toBe(false);
  });
});
