import { describe, it, expect } from 'vitest';
import {
  AgentMuxError,
  CapabilityError,
  ValidationError,
  AuthError,
} from '../src/index.js';

describe('AgentMuxError', () => {
  it('extends Error', () => {
    const err = new AgentMuxError('INTERNAL', 'something broke');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(AgentMuxError);
  });

  it('sets name to AgentMuxError', () => {
    const err = new AgentMuxError('INTERNAL', 'test');
    expect(err.name).toBe('AgentMuxError');
  });

  it('stores code and message', () => {
    const err = new AgentMuxError('SPAWN_ERROR', 'could not spawn');
    expect(err.code).toBe('SPAWN_ERROR');
    expect(err.message).toBe('could not spawn');
  });

  it('defaults recoverable to false', () => {
    const err = new AgentMuxError('TIMEOUT', 'timed out');
    expect(err.recoverable).toBe(false);
  });

  it('accepts explicit recoverable flag', () => {
    const err = new AgentMuxError('RATE_LIMITED', 'rate limited', true);
    expect(err.recoverable).toBe(true);
  });

  it('has readonly code and recoverable', () => {
    const err = new AgentMuxError('INTERNAL', 'test');
    // TypeScript enforces readonly at compile-time.
    // At runtime, just verify the fields exist and are correct.
    expect(err.code).toBe('INTERNAL');
    expect(err.recoverable).toBe(false);
  });
});

describe('CapabilityError', () => {
  it('extends AgentMuxError', () => {
    const err = new CapabilityError('claude', 'thinking');
    expect(err).toBeInstanceOf(AgentMuxError);
    expect(err).toBeInstanceOf(CapabilityError);
    expect(err).toBeInstanceOf(Error);
  });

  it('sets code to CAPABILITY_ERROR', () => {
    const err = new CapabilityError('codex', 'mcp');
    expect(err.code).toBe('CAPABILITY_ERROR');
  });

  it('sets name to CapabilityError', () => {
    const err = new CapabilityError('codex', 'mcp');
    expect(err.name).toBe('CapabilityError');
  });

  it('stores agent and capability', () => {
    const err = new CapabilityError('gemini', 'plugins');
    expect(err.agent).toBe('gemini');
    expect(err.capability).toBe('plugins');
  });

  it('stores optional model', () => {
    const err = new CapabilityError('claude', 'thinking', 'haiku');
    expect(err.model).toBe('haiku');
  });

  it('has undefined model when not provided', () => {
    const err = new CapabilityError('claude', 'thinking');
    expect(err.model).toBeUndefined();
  });

  it('is not recoverable', () => {
    const err = new CapabilityError('codex', 'streaming');
    expect(err.recoverable).toBe(false);
  });

  it('generates a descriptive message without model', () => {
    const err = new CapabilityError('codex', 'streaming');
    expect(err.message).toContain('codex');
    expect(err.message).toContain('streaming');
  });

  it('generates a descriptive message with model', () => {
    const err = new CapabilityError('claude', 'thinking', 'haiku');
    expect(err.message).toContain('claude');
    expect(err.message).toContain('thinking');
    expect(err.message).toContain('haiku');
  });
});

describe('ValidationError', () => {
  it('extends AgentMuxError', () => {
    const err = new ValidationError([
      { field: 'timeout', message: 'negative', received: -1, expected: '>= 0' },
    ]);
    expect(err).toBeInstanceOf(AgentMuxError);
    expect(err).toBeInstanceOf(ValidationError);
    expect(err).toBeInstanceOf(Error);
  });

  it('sets code to VALIDATION_ERROR', () => {
    const err = new ValidationError([
      { field: 'x', message: 'bad', received: null, expected: 'number' },
    ]);
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('sets name to ValidationError', () => {
    const err = new ValidationError([
      { field: 'x', message: 'bad', received: null, expected: 'number' },
    ]);
    expect(err.name).toBe('ValidationError');
  });

  it('stores fields array', () => {
    const fields = [
      { field: 'timeout', message: 'negative', received: -1, expected: '>= 0' },
      { field: 'temperature', message: 'out of range', received: 3.0, expected: '[0, 2]' },
    ];
    const err = new ValidationError(fields);
    expect(err.fields).toHaveLength(2);
    expect(err.fields[0]?.field).toBe('timeout');
    expect(err.fields[1]?.field).toBe('temperature');
  });

  it('is not recoverable', () => {
    const err = new ValidationError([
      { field: 'x', message: 'bad', received: null, expected: 'number' },
    ]);
    expect(err.recoverable).toBe(false);
  });

  it('generates a summary message from fields', () => {
    const err = new ValidationError([
      { field: 'timeout', message: 'must be positive', received: -1, expected: '>= 0' },
    ]);
    expect(err.message).toContain('timeout');
    expect(err.message).toContain('must be positive');
  });
});

describe('AuthError', () => {
  it('extends AgentMuxError', () => {
    const err = new AuthError('claude', 'unauthenticated', 'Run `claude auth login`');
    expect(err).toBeInstanceOf(AgentMuxError);
    expect(err).toBeInstanceOf(AuthError);
    expect(err).toBeInstanceOf(Error);
  });

  it('sets code to AUTH_ERROR', () => {
    const err = new AuthError('claude', 'expired', 'Re-authenticate');
    expect(err.code).toBe('AUTH_ERROR');
  });

  it('sets name to AuthError', () => {
    const err = new AuthError('claude', 'expired', 'Re-authenticate');
    expect(err.name).toBe('AuthError');
  });

  it('stores agent, status, and guidance', () => {
    const err = new AuthError('codex', 'unauthenticated', 'Set OPENAI_API_KEY');
    expect(err.agent).toBe('codex');
    expect(err.status).toBe('unauthenticated');
    expect(err.guidance).toBe('Set OPENAI_API_KEY');
  });

  it('accepts all status values', () => {
    const statuses = ['unauthenticated', 'expired', 'unknown'] as const;
    for (const status of statuses) {
      const err = new AuthError('claude', status, 'guidance');
      expect(err.status).toBe(status);
    }
  });

  it('is not recoverable', () => {
    const err = new AuthError('claude', 'unknown', 'guidance');
    expect(err.recoverable).toBe(false);
  });

  it('generates a descriptive message', () => {
    const err = new AuthError('claude', 'unauthenticated', 'Run `claude auth login`');
    expect(err.message).toContain('claude');
    expect(err.message).toContain('unauthenticated');
    expect(err.message).toContain('Run `claude auth login`');
  });
});
