import { describe, it, expect } from 'vitest';
import { createAgentIdentity, createToolIdentity } from './identity.js';
import { signPayload, verifySignature } from './signing.js';

describe('trust/identity', () => {
  it('creates an agent identity with unique keys', () => {
    const id = createAgentIdentity('claude', 'session-123');
    expect(id.kind).toBe('agent');
    expect(id.agentId).toBe('claude');
    expect(id.sessionId).toBe('session-123');
    expect(id.keyPair.publicKey).toContain('BEGIN PUBLIC KEY');
    expect(id.keyPair.fingerprint).toHaveLength(64);
  });

  it('creates a tool identity', () => {
    const id = createToolIdentity('Bash');
    expect(id.kind).toBe('tool');
    expect(id.toolName).toBe('Bash');
    expect(id.keyPair.fingerprint).toHaveLength(64);
  });

  it('agent identity can sign and verify', () => {
    const agent = createAgentIdentity('genty', 'sess-456');
    const payload = { action: 'tool_call', tool: 'Read', path: '/src/index.ts' };
    const envelope = signPayload(agent.keyPair.privateKey, agent.keyPair.fingerprint, payload);

    expect(envelope.publicKeyFingerprint).toBe(agent.keyPair.fingerprint);
    expect(verifySignature(agent.keyPair.publicKey, envelope)).toBe(true);
  });

  it('tool identity can sign results', () => {
    const tool = createToolIdentity('Bash');
    const result = { exitCode: 0, stdout: 'hello world', stderr: '' };
    const envelope = signPayload(tool.keyPair.privateKey, tool.keyPair.fingerprint, result);

    expect(verifySignature(tool.keyPair.publicKey, envelope)).toBe(true);
  });

  it('different identities produce non-interchangeable signatures', () => {
    const agent = createAgentIdentity('claude', 'sess');
    const tool = createToolIdentity('Bash');
    const payload = { data: 'test' };

    const agentSigned = signPayload(agent.keyPair.privateKey, agent.keyPair.fingerprint, payload);
    expect(verifySignature(tool.keyPair.publicKey, agentSigned)).toBe(false);
  });
});
