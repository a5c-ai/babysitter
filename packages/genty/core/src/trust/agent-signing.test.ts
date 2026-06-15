import { describe, it, expect } from 'vitest';
import { createKeyPair } from './signing.js';
import { signAgentRequest, verifyAgentRequest, signPrompt, verifyPrompt, hashContent } from './agent-signing.js';

describe('trust/agent-signing', () => {
  it('signs and verifies an agent request', () => {
    const kp = createKeyPair();
    const request = {
      agentId: 'claude', sessionId: 's1', turnNumber: 3,
      requestType: 'tool_call' as const, content: { tool: 'Bash', command: 'ls' },
      timestamp: new Date().toISOString(),
    };
    const envelope = signAgentRequest(kp, request);
    expect(verifyAgentRequest(kp.publicKey, envelope)).toBe(true);
  });

  it('includes delegation chain in signed content', () => {
    const kp = createKeyPair();
    const request = {
      agentId: 'child', sessionId: 's2', turnNumber: 1,
      requestType: 'delegation' as const, content: { task: 'test' },
      timestamp: new Date().toISOString(),
      delegationChain: [{ delegatorFingerprint: 'parent-fp', delegatorSignature: 'parent-sig', delegatedAt: new Date().toISOString() }],
    };
    const envelope = signAgentRequest(kp, request);
    expect(verifyAgentRequest(kp.publicKey, envelope)).toBe(true);
  });

  it('signs and verifies a prompt', () => {
    const kp = createKeyPair();
    const prompt = {
      promptType: 'initial' as const, content: 'implement auth',
      authorId: 'user-1', timestamp: new Date().toISOString(),
    };
    const envelope = signPrompt(kp, prompt);
    expect(verifyPrompt(kp.publicKey, envelope)).toBe(true);
  });

  it('distinguishes steering from initial prompts', () => {
    const kp = createKeyPair();
    const initial = signPrompt(kp, { promptType: 'initial', content: 'start', authorId: 'u', timestamp: 't1' });
    const steer = signPrompt(kp, { promptType: 'steering', content: 'go faster', authorId: 'u', timestamp: 't2' });
    expect(initial.payload.promptType).toBe('initial');
    expect(steer.payload.promptType).toBe('steering');
    expect(initial.signature).not.toBe(steer.signature);
  });

  it('hashes content deterministically', () => {
    expect(hashContent('hello')).toBe(hashContent('hello'));
    expect(hashContent('hello')).not.toBe(hashContent('world'));
    expect(hashContent('hello')).toHaveLength(64);
  });
});
