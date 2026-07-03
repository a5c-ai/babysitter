import { describe, it, expect } from 'vitest';
import { createKeyPair } from './signing.js';
import { signToolResult, verifyToolResult, signPermissionEvidence, verifyPermissionEvidence, isPermissionValid } from './tool-signing.js';

describe('trust/tool-signing', () => {
  it('signs and verifies a tool result', () => {
    const kp = createKeyPair();
    const result = {
      toolName: 'Bash', inputParams: { command: 'ls' }, output: 'file.ts',
      timestamp: new Date().toISOString(),
    };
    const envelope = signToolResult(kp, result);
    expect(verifyToolResult(kp.publicKey, envelope)).toBe(true);
  });

  it('includes request signature in tool result', () => {
    const kp = createKeyPair();
    const result = {
      toolName: 'Read', inputParams: { path: '/src' }, output: 'contents',
      timestamp: new Date().toISOString(), requestSignature: 'agent-signed-request',
    };
    const envelope = signToolResult(kp, result);
    expect(envelope.payload.requestSignature).toBe('agent-signed-request');
    expect(verifyToolResult(kp.publicKey, envelope)).toBe(true);
  });

  it('includes upstream signatures for gateway tools', () => {
    const kp = createKeyPair();
    const result = {
      toolName: 'GitHubAPI', inputParams: { endpoint: '/repos' }, output: { repos: [] },
      timestamp: new Date().toISOString(), upstreamSignatures: ['github-api-sig-1', 'github-api-sig-2'],
    };
    const envelope = signToolResult(kp, result);
    expect(envelope.payload.upstreamSignatures).toHaveLength(2);
    expect(verifyToolResult(kp.publicKey, envelope)).toBe(true);
  });

  it('signs and verifies permission evidence', () => {
    const kp = createKeyPair();
    const permission = {
      action: 'delete', scope: '/tmp/*', approvedBy: 'user-1',
      approvedAt: new Date().toISOString(),
    };
    const envelope = signPermissionEvidence(kp, permission);
    expect(verifyPermissionEvidence(kp.publicKey, envelope)).toBe(true);
  });

  it('validates non-expired permission', () => {
    const kp = createKeyPair();
    const future = new Date(Date.now() + 3600_000).toISOString();
    const envelope = signPermissionEvidence(kp, {
      action: 'write', scope: '/src', approvedBy: 'admin', approvedAt: new Date().toISOString(), expiresAt: future,
    });
    expect(isPermissionValid(envelope)).toBe(true);
  });

  it('rejects expired permission', () => {
    const kp = createKeyPair();
    const past = new Date(Date.now() - 1000).toISOString();
    const envelope = signPermissionEvidence(kp, {
      action: 'write', scope: '/src', approvedBy: 'admin', approvedAt: new Date().toISOString(), expiresAt: past,
    });
    expect(isPermissionValid(envelope)).toBe(false);
  });

  it('permission without expiry is always valid', () => {
    const kp = createKeyPair();
    const envelope = signPermissionEvidence(kp, {
      action: 'read', scope: '*', approvedBy: 'yolo', approvedAt: new Date().toISOString(),
    });
    expect(isPermissionValid(envelope)).toBe(true);
  });
});
