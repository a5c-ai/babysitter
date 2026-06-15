import { describe, it, expect } from 'vitest';
import { createKeyPair } from '@a5c-ai/genty-core/trust';
import {
  signOutgoingPrompt,
  verifyIncomingPrompt,
  signOutgoingToolResult,
  verifyIncomingToolResult,
  signIncomingModelResponse,
  verifySignedModelResponse,
} from './harness-signing.js';
import type { TrustContext } from './harness-signing.js';

function makeTrustCtx(): TrustContext {
  const keyPair = createKeyPair();
  return { keyPair, agentId: 'test-agent', sessionId: 'sess-1' };
}

describe('harness-signing', () => {
  it('signs and verifies an outgoing prompt', () => {
    const ctx = makeTrustCtx();
    const envelope = signOutgoingPrompt(ctx, 'Hello world');
    expect(envelope.payload.content).toBe('Hello world');
    expect(envelope.payload.promptType).toBe('initial');
    expect(verifyIncomingPrompt(ctx.keyPair.publicKey, envelope)).toBe(true);
  });

  it('rejects a tampered prompt', () => {
    const ctx = makeTrustCtx();
    const envelope = signOutgoingPrompt(ctx, 'Hello world');
    envelope.payload.content = 'Tampered';
    expect(verifyIncomingPrompt(ctx.keyPair.publicKey, envelope)).toBe(false);
  });

  it('signs and verifies a tool result', () => {
    const ctx = makeTrustCtx();
    const envelope = signOutgoingToolResult(ctx, 'bash', { cmd: 'ls' }, { exit: 0, output: 'ok' });
    expect(envelope.payload.toolName).toBe('bash');
    expect(verifyIncomingToolResult(ctx.keyPair.publicKey, envelope)).toBe(true);
  });

  it('signs and verifies a model response', () => {
    const ctx = makeTrustCtx();
    const envelope = signIncomingModelResponse(ctx, 'I will help you.', 'claude-sonnet-4-6', 'anthropic');
    expect(envelope.payload.outputContent).toBe('I will help you.');
    expect(envelope.payload.modelId).toBe('claude-sonnet-4-6');
    expect(verifySignedModelResponse(ctx.keyPair.publicKey, envelope)).toBe(true);
  });

  it('cross-key verification fails', () => {
    const ctx = makeTrustCtx();
    const otherCtx = makeTrustCtx();
    const envelope = signOutgoingPrompt(ctx, 'Secret');
    expect(verifyIncomingPrompt(otherCtx.keyPair.publicKey, envelope)).toBe(false);
  });

  it('supports different prompt types', () => {
    const ctx = makeTrustCtx();
    const steering = signOutgoingPrompt(ctx, 'Do this instead', 'steering');
    expect(steering.payload.promptType).toBe('steering');
    expect(verifyIncomingPrompt(ctx.keyPair.publicKey, steering)).toBe(true);
  });
});
