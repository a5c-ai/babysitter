import { describe, it, expect } from 'vitest';
import {
  createClient,
  AgentMuxClient,
  AgentMuxError,
  ValidationError,
} from '../src/index.js';

describe('createClient', () => {
  it('returns an AgentMuxClient instance', () => {
    const client = createClient();
    expect(client).toBeInstanceOf(AgentMuxClient);
  });

  it('accepts no arguments', () => {
    const client = createClient();
    expect(client).toBeDefined();
  });

  it('accepts empty options', () => {
    const client = createClient({});
    expect(client).toBeDefined();
  });

  it('stores options on the client', () => {
    const client = createClient({
      defaultAgent: 'claude',
      defaultModel: 'sonnet',
      approvalMode: 'yolo',
      timeout: 60000,
      inactivityTimeout: 30000,
      stream: true,
      debug: true,
    });
    expect(client.options.defaultAgent).toBe('claude');
    expect(client.options.defaultModel).toBe('sonnet');
    expect(client.options.approvalMode).toBe('yolo');
    expect(client.options.timeout).toBe(60000);
    expect(client.options.inactivityTimeout).toBe(30000);
    expect(client.options.stream).toBe(true);
    expect(client.options.debug).toBe(true);
  });

  it('freezes options so they are immutable', () => {
    const client = createClient({ defaultAgent: 'claude' });
    expect(Object.isFrozen(client.options)).toBe(true);
  });

  it('resolves storage paths', () => {
    const client = createClient({
      configDir: '/test/global',
      projectConfigDir: '/test/project',
    });
    expect(client.storagePaths.configDir).toContain('test');
    expect(client.storagePaths.projectConfigDir).toContain('test');
  });
});

describe('createClient validation', () => {
  it('throws ValidationError for negative timeout', () => {
    expect(() => createClient({ timeout: -1 })).toThrow(ValidationError);
  });

  it('throws ValidationError for non-integer timeout', () => {
    expect(() => createClient({ timeout: 1.5 })).toThrow(ValidationError);
  });

  it('throws ValidationError for negative inactivityTimeout', () => {
    expect(() => createClient({ inactivityTimeout: -100 })).toThrow(
      ValidationError,
    );
  });

  it('throws ValidationError for non-integer inactivityTimeout', () => {
    expect(() => createClient({ inactivityTimeout: 0.5 })).toThrow(
      ValidationError,
    );
  });

  it('throws ValidationError for relative configDir', () => {
    expect(() => createClient({ configDir: 'relative/path' })).toThrow(
      ValidationError,
    );
  });

  it('throws ValidationError for relative projectConfigDir', () => {
    expect(() =>
      createClient({ projectConfigDir: 'relative/path' }),
    ).toThrow(ValidationError);
  });

  it('accepts timeout of 0', () => {
    const client = createClient({ timeout: 0 });
    expect(client.options.timeout).toBe(0);
  });

  it('accepts inactivityTimeout of 0', () => {
    const client = createClient({ inactivityTimeout: 0 });
    expect(client.options.inactivityTimeout).toBe(0);
  });

  it('accepts absolute configDir', () => {
    const client = createClient({ configDir: '/absolute/path' });
    expect(client.options.configDir).toBe('/absolute/path');
  });

  it('accepts absolute projectConfigDir', () => {
    const client = createClient({ projectConfigDir: '/absolute/path' });
    expect(client.options.projectConfigDir).toBe('/absolute/path');
  });

  it('includes field details in ValidationError', () => {
    try {
      createClient({ timeout: -1, configDir: 'relative' });
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      const ve = err as ValidationError;
      expect(ve.fields.length).toBeGreaterThanOrEqual(2);
      const fieldNames = ve.fields.map((f) => f.field);
      expect(fieldNames).toContain('timeout');
      expect(fieldNames).toContain('configDir');
    }
  });

  it('validates approvalMode values', () => {
    expect(() =>
      createClient({ approvalMode: 'invalid' as 'yolo' }),
    ).toThrow(ValidationError);
  });

  it('validates stream values', () => {
    expect(() =>
      createClient({ stream: 'invalid' as 'auto' }),
    ).toThrow(ValidationError);
  });
});

describe('AgentMuxClient manager namespaces', () => {
  it('has adapters namespace', () => {
    const client = createClient();
    expect(client.adapters).toBeDefined();
  });

  it('has models namespace', () => {
    const client = createClient();
    expect(client.models).toBeDefined();
  });

  it('has sessions namespace', () => {
    const client = createClient();
    expect(client.sessions).toBeDefined();
  });

  it('has config namespace', () => {
    const client = createClient();
    expect(client.config).toBeDefined();
  });

  it('has auth namespace', () => {
    const client = createClient();
    expect(client.auth).toBeDefined();
  });

  it('has profiles namespace', () => {
    const client = createClient();
    expect(client.profiles).toBeDefined();
  });

  it('has plugins namespace', () => {
    const client = createClient();
    expect(client.plugins).toBeDefined();
  });
});

describe('AgentMuxClient.run() validation', () => {
  it('throws UNKNOWN_AGENT when no adapter is registered', () => {
    const client = createClient();
    try {
      client.run({ agent: 'claude', prompt: 'hello' });
      throw new Error('expected throw');
    } catch (e) {
      expect(e).toBeInstanceOf(AgentMuxError);
      expect((e as AgentMuxError).code).toBe('UNKNOWN_AGENT');
    }
  });

  it('throws VALIDATION_ERROR for missing prompt', () => {
    const client = createClient();
    try {
      // @ts-expect-error testing runtime validation
      client.run({ agent: 'claude' });
      throw new Error('expected throw');
    } catch (e) {
      expect(e).toBeInstanceOf(AgentMuxError);
      expect((e as AgentMuxError).code).toBe('VALIDATION_ERROR');
    }
  });
});

describe('createClient retryPolicy validation', () => {
  it('throws for maxAttempts < 1', () => {
    expect(() => createClient({ retryPolicy: { maxAttempts: 0 } })).toThrow(ValidationError);
  });

  it('throws for negative maxAttempts', () => {
    expect(() => createClient({ retryPolicy: { maxAttempts: -1 } })).toThrow(ValidationError);
  });

  it('throws for non-integer maxAttempts', () => {
    expect(() => createClient({ retryPolicy: { maxAttempts: 1.5 } })).toThrow(ValidationError);
  });

  it('throws for negative baseDelayMs', () => {
    expect(() => createClient({ retryPolicy: { baseDelayMs: -1 } })).toThrow(ValidationError);
  });

  it('throws for maxDelayMs < baseDelayMs', () => {
    expect(() => createClient({ retryPolicy: { baseDelayMs: 5000, maxDelayMs: 1000 } })).toThrow(ValidationError);
  });

  it('throws for jitterFactor > 1.0', () => {
    expect(() => createClient({ retryPolicy: { jitterFactor: 1.5 } })).toThrow(ValidationError);
  });

  it('throws for negative jitterFactor', () => {
    expect(() => createClient({ retryPolicy: { jitterFactor: -0.1 } })).toThrow(ValidationError);
  });

  it('accepts valid retryPolicy', () => {
    const client = createClient({ retryPolicy: { maxAttempts: 5, baseDelayMs: 500, maxDelayMs: 10000, jitterFactor: 0.5 } });
    expect(client).toBeDefined();
  });

  it('accepts retryPolicy with only some fields', () => {
    const client = createClient({ retryPolicy: { maxAttempts: 2 } });
    expect(client).toBeDefined();
  });

  it('throws when maxDelayMs alone is less than default baseDelayMs', () => {
    // Default baseDelayMs is 1000, so maxDelayMs: 500 should fail
    expect(() => createClient({ retryPolicy: { maxDelayMs: 500 } })).toThrow(ValidationError);
  });

  it('accepts maxDelayMs alone when >= default baseDelayMs', () => {
    const client = createClient({ retryPolicy: { maxDelayMs: 5000 } });
    expect(client).toBeDefined();
  });

  it('accepts empty retryPolicy (all fields optional)', () => {
    const client = createClient({ retryPolicy: {} });
    expect(client).toBeDefined();
  });

  it('throws for invalid retryOn error code', () => {
    expect(() =>
      createClient({ retryPolicy: { retryOn: ['NOT_A_REAL_CODE' as 'TIMEOUT'] } }),
    ).toThrow(ValidationError);
  });

  it('accepts valid retryOn error codes', () => {
    const client = createClient({ retryPolicy: { retryOn: ['RATE_LIMITED', 'TIMEOUT'] } });
    expect(client).toBeDefined();
  });

  // NaN/Infinity rejection in createClient
  it('rejects NaN timeout', () => {
    expect(() => createClient({ timeout: NaN })).toThrow(ValidationError);
  });

  it('rejects Infinity inactivityTimeout', () => {
    expect(() => createClient({ inactivityTimeout: Infinity })).toThrow(ValidationError);
  });

  it('rejects NaN retryPolicy.maxAttempts', () => {
    expect(() => createClient({ retryPolicy: { maxAttempts: NaN } })).toThrow(ValidationError);
  });

  it('rejects NaN retryPolicy.baseDelayMs', () => {
    expect(() => createClient({ retryPolicy: { baseDelayMs: NaN } })).toThrow(ValidationError);
  });

  it('rejects NaN retryPolicy.jitterFactor', () => {
    expect(() => createClient({ retryPolicy: { jitterFactor: NaN } })).toThrow(ValidationError);
  });
});
