import { describe, it, expect } from 'vitest';
import { createKeyPair, signPayload } from './signing.js';
import { verifyTrustChain } from './chain.js';
import type { TrustChainLink } from './chain.js';

describe('trust/chain', () => {
  it('verifies a valid 3-link chain', () => {
    const userKey = createKeyPair();
    const agentKey = createKeyPair();
    const toolKey = createKeyPair();

    const promptEnvelope = signPayload(userKey.privateKey, userKey.fingerprint, {
      type: 'prompt', content: 'delete /tmp/test',
    });

    const requestEnvelope = signPayload(agentKey.privateKey, agentKey.fingerprint, {
      type: 'tool_call', tool: 'Bash', command: 'rm /tmp/test',
    });

    const resultEnvelope = signPayload(toolKey.privateKey, toolKey.fingerprint, {
      type: 'tool_result', exitCode: 0, output: '',
    });

    const chain: TrustChainLink[] = [
      { step: 'user-prompt', envelope: promptEnvelope, publicKey: userKey.publicKey },
      { step: 'agent-request', envelope: requestEnvelope, publicKey: agentKey.publicKey, parentSignature: promptEnvelope.signature },
      { step: 'tool-result', envelope: resultEnvelope, publicKey: toolKey.publicKey, parentSignature: requestEnvelope.signature },
    ];

    const result = verifyTrustChain(chain);
    expect(result.valid).toBe(true);
    expect(result.verifiedLinks).toBe(3);
  });

  it('detects tampered signature in chain', () => {
    const key1 = createKeyPair();
    const key2 = createKeyPair();

    const env1 = signPayload(key1.privateKey, key1.fingerprint, { step: 1 });
    const env2 = signPayload(key2.privateKey, key2.fingerprint, { step: 2 });
    env2.payload = { step: 999 } as any; // tamper

    const chain: TrustChainLink[] = [
      { step: 'first', envelope: env1, publicKey: key1.publicKey },
      { step: 'second', envelope: env2, publicKey: key2.publicKey, parentSignature: env1.signature },
    ];

    const result = verifyTrustChain(chain);
    expect(result.valid).toBe(false);
    expect(result.brokenAt).toBe(1);
    expect(result.brokenStep).toBe('second');
  });

  it('detects broken parent signature link', () => {
    const key1 = createKeyPair();
    const key2 = createKeyPair();

    const env1 = signPayload(key1.privateKey, key1.fingerprint, { a: 1 });
    const env2 = signPayload(key2.privateKey, key2.fingerprint, { b: 2 });

    const chain: TrustChainLink[] = [
      { step: 'first', envelope: env1, publicKey: key1.publicKey },
      { step: 'second', envelope: env2, publicKey: key2.publicKey, parentSignature: 'wrong-signature' },
    ];

    const result = verifyTrustChain(chain);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Parent signature mismatch');
  });

  it('verifies empty chain', () => {
    const result = verifyTrustChain([]);
    expect(result.valid).toBe(true);
    expect(result.verifiedLinks).toBe(0);
  });
});
