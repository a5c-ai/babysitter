import { describe, it, expect } from 'vitest';
import * as os from 'node:os';
import { validateRunOptions, ValidationError } from '../src/index.js';
import type { RunOptions } from '../src/index.js';

/** Helper to build minimal valid RunOptions. */
function valid(overrides: Partial<RunOptions> = {}): RunOptions {
  return { agent: 'claude', prompt: 'hello', ...overrides };
}

/** Extract field names from a ValidationError. */
function fieldNames(fn: () => void): string[] {
  try {
    fn();
    return [];
  } catch (err) {
    if (err instanceof ValidationError) {
      return err.fields.map((f) => f.field);
    }
    throw err;
  }
}

describe('validateRunOptions', () => {
  // -------------------------------------------------------------------------
  // Required fields
  // -------------------------------------------------------------------------
  describe('required fields', () => {
    it('accepts minimal valid options', () => {
      expect(() => validateRunOptions(valid())).not.toThrow();
    });

    it('throws for missing agent (empty string)', () => {
      expect(() => validateRunOptions(valid({ agent: '' }))).toThrow(ValidationError);
    });

    it('throws for whitespace-only agent', () => {
      expect(() => validateRunOptions(valid({ agent: '  ' }))).toThrow(ValidationError);
    });

    it('throws for empty prompt string', () => {
      expect(() => validateRunOptions(valid({ prompt: '' }))).toThrow(ValidationError);
    });

    it('throws for whitespace-only prompt', () => {
      expect(() => validateRunOptions(valid({ prompt: '  ' }))).toThrow(ValidationError);
    });

    it('throws for empty prompt array', () => {
      expect(() => validateRunOptions(valid({ prompt: [] }))).toThrow(ValidationError);
    });

    it('throws for all-whitespace prompt array', () => {
      expect(() => validateRunOptions(valid({ prompt: ['  ', '\t'] }))).toThrow(ValidationError);
    });

    it('accepts prompt array with content', () => {
      expect(() => validateRunOptions(valid({ prompt: ['hello', 'world'] }))).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Session mutual exclusivity
  // -------------------------------------------------------------------------
  describe('session mutual exclusivity', () => {
    it('accepts sessionId alone', () => {
      expect(() => validateRunOptions(valid({ sessionId: 'abc' }))).not.toThrow();
    });

    it('accepts forkSessionId alone', () => {
      expect(() => validateRunOptions(valid({ forkSessionId: 'abc' }))).not.toThrow();
    });

    it('accepts noSession alone', () => {
      expect(() => validateRunOptions(valid({ noSession: true }))).not.toThrow();
    });

    it('throws for sessionId + forkSessionId with per-pair message', () => {
      try {
        validateRunOptions(valid({ sessionId: 'a', forkSessionId: 'b' }));
        expect.fail('should throw');
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        const ve = err as ValidationError;
        expect(ve.fields.some(f => f.message === 'sessionId and forkSessionId are mutually exclusive')).toBe(true);
      }
    });

    it('throws for sessionId + noSession with per-pair message', () => {
      try {
        validateRunOptions(valid({ sessionId: 'a', noSession: true }));
        expect.fail('should throw');
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        const ve = err as ValidationError;
        expect(ve.fields.some(f => f.message === 'sessionId and noSession are mutually exclusive')).toBe(true);
      }
    });

    it('throws for forkSessionId + noSession with per-pair message', () => {
      try {
        validateRunOptions(valid({ forkSessionId: 'b', noSession: true }));
        expect.fail('should throw');
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        const ve = err as ValidationError;
        expect(ve.fields.some(f => f.message === 'forkSessionId and noSession are mutually exclusive')).toBe(true);
      }
    });

    it('throws for all three session fields with multiple errors', () => {
      try {
        validateRunOptions(valid({ sessionId: 'a', forkSessionId: 'b', noSession: true }));
        expect.fail('should throw');
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        const ve = err as ValidationError;
        expect(ve.fields.length).toBe(3);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Numeric range validations
  // -------------------------------------------------------------------------
  describe('temperature', () => {
    it('accepts 0', () => { expect(() => validateRunOptions(valid({ temperature: 0 }))).not.toThrow(); });
    it('accepts 2', () => { expect(() => validateRunOptions(valid({ temperature: 2 }))).not.toThrow(); });
    it('accepts 1.5', () => { expect(() => validateRunOptions(valid({ temperature: 1.5 }))).not.toThrow(); });
    it('rejects -0.1', () => { expect(() => validateRunOptions(valid({ temperature: -0.1 }))).toThrow(ValidationError); });
    it('rejects 2.1', () => { expect(() => validateRunOptions(valid({ temperature: 2.1 }))).toThrow(ValidationError); });
  });

  describe('topP', () => {
    it('accepts 0', () => { expect(() => validateRunOptions(valid({ topP: 0 }))).not.toThrow(); });
    it('accepts 1', () => { expect(() => validateRunOptions(valid({ topP: 1 }))).not.toThrow(); });
    it('rejects -0.1', () => { expect(() => validateRunOptions(valid({ topP: -0.1 }))).toThrow(ValidationError); });
    it('rejects 1.1', () => { expect(() => validateRunOptions(valid({ topP: 1.1 }))).toThrow(ValidationError); });
  });

  describe('topK', () => {
    it('accepts 1', () => { expect(() => validateRunOptions(valid({ topK: 1 }))).not.toThrow(); });
    it('accepts 100', () => { expect(() => validateRunOptions(valid({ topK: 100 }))).not.toThrow(); });
    it('rejects 0', () => { expect(() => validateRunOptions(valid({ topK: 0 }))).toThrow(ValidationError); });
    it('rejects 1.5 (non-integer)', () => { expect(() => validateRunOptions(valid({ topK: 1.5 }))).toThrow(ValidationError); });
  });

  describe('maxTokens', () => {
    it('accepts 1', () => { expect(() => validateRunOptions(valid({ maxTokens: 1 }))).not.toThrow(); });
    it('rejects 0', () => { expect(() => validateRunOptions(valid({ maxTokens: 0 }))).toThrow(ValidationError); });
    it('rejects negative', () => { expect(() => validateRunOptions(valid({ maxTokens: -1 }))).toThrow(ValidationError); });
    it('rejects non-integer', () => { expect(() => validateRunOptions(valid({ maxTokens: 1.5 }))).toThrow(ValidationError); });
  });

  describe('maxOutputTokens', () => {
    it('accepts 1', () => { expect(() => validateRunOptions(valid({ maxOutputTokens: 1 }))).not.toThrow(); });
    it('rejects 0', () => { expect(() => validateRunOptions(valid({ maxOutputTokens: 0 }))).toThrow(ValidationError); });
  });

  describe('thinkingBudgetTokens', () => {
    it('accepts 1024', () => { expect(() => validateRunOptions(valid({ thinkingBudgetTokens: 1024 }))).not.toThrow(); });
    it('accepts 100000', () => { expect(() => validateRunOptions(valid({ thinkingBudgetTokens: 100000 }))).not.toThrow(); });
    it('rejects 1023', () => { expect(() => validateRunOptions(valid({ thinkingBudgetTokens: 1023 }))).toThrow(ValidationError); });
    it('rejects 0', () => { expect(() => validateRunOptions(valid({ thinkingBudgetTokens: 0 }))).toThrow(ValidationError); });
    it('rejects non-integer', () => { expect(() => validateRunOptions(valid({ thinkingBudgetTokens: 1024.5 }))).toThrow(ValidationError); });
  });

  describe('timeout', () => {
    it('accepts 0', () => { expect(() => validateRunOptions(valid({ timeout: 0 }))).not.toThrow(); });
    it('accepts 60000', () => { expect(() => validateRunOptions(valid({ timeout: 60000 }))).not.toThrow(); });
    it('rejects negative', () => { expect(() => validateRunOptions(valid({ timeout: -1 }))).toThrow(ValidationError); });
    it('rejects non-integer', () => { expect(() => validateRunOptions(valid({ timeout: 1.5 }))).toThrow(ValidationError); });
  });

  describe('inactivityTimeout', () => {
    it('accepts 0', () => { expect(() => validateRunOptions(valid({ inactivityTimeout: 0 }))).not.toThrow(); });
    it('rejects negative', () => { expect(() => validateRunOptions(valid({ inactivityTimeout: -1 }))).toThrow(ValidationError); });
    it('rejects non-integer', () => { expect(() => validateRunOptions(valid({ inactivityTimeout: 0.5 }))).toThrow(ValidationError); });
  });

  describe('maxTurns', () => {
    it('accepts 1', () => { expect(() => validateRunOptions(valid({ maxTurns: 1 }))).not.toThrow(); });
    it('rejects 0', () => { expect(() => validateRunOptions(valid({ maxTurns: 0 }))).toThrow(ValidationError); });
    it('rejects negative', () => { expect(() => validateRunOptions(valid({ maxTurns: -1 }))).toThrow(ValidationError); });
    it('rejects non-integer', () => { expect(() => validateRunOptions(valid({ maxTurns: 1.5 }))).toThrow(ValidationError); });
  });

  // -------------------------------------------------------------------------
  // Enum validations
  // -------------------------------------------------------------------------
  describe('approvalMode', () => {
    it('accepts yolo', () => { expect(() => validateRunOptions(valid({ approvalMode: 'yolo' }))).not.toThrow(); });
    it('accepts prompt', () => { expect(() => validateRunOptions(valid({ approvalMode: 'prompt' }))).not.toThrow(); });
    it('accepts deny', () => { expect(() => validateRunOptions(valid({ approvalMode: 'deny' }))).not.toThrow(); });
    it('rejects invalid', () => { expect(() => validateRunOptions(valid({ approvalMode: 'nope' as 'yolo' }))).toThrow(ValidationError); });
  });

  describe('stream', () => {
    it('accepts true', () => { expect(() => validateRunOptions(valid({ stream: true }))).not.toThrow(); });
    it('accepts false', () => { expect(() => validateRunOptions(valid({ stream: false }))).not.toThrow(); });
    it('accepts auto', () => { expect(() => validateRunOptions(valid({ stream: 'auto' }))).not.toThrow(); });
    it('rejects invalid string', () => { expect(() => validateRunOptions(valid({ stream: 'maybe' as 'auto' }))).toThrow(ValidationError); });
  });

  describe('systemPromptMode', () => {
    it('accepts prepend', () => { expect(() => validateRunOptions(valid({ systemPromptMode: 'prepend' }))).not.toThrow(); });
    it('accepts append', () => { expect(() => validateRunOptions(valid({ systemPromptMode: 'append' }))).not.toThrow(); });
    it('accepts replace', () => { expect(() => validateRunOptions(valid({ systemPromptMode: 'replace' }))).not.toThrow(); });
    it('rejects invalid', () => { expect(() => validateRunOptions(valid({ systemPromptMode: 'nope' as 'prepend' }))).toThrow(ValidationError); });
  });

  describe('outputFormat', () => {
    it('accepts text', () => { expect(() => validateRunOptions(valid({ outputFormat: 'text' }))).not.toThrow(); });
    it('accepts json', () => { expect(() => validateRunOptions(valid({ outputFormat: 'json' }))).not.toThrow(); });
    it('accepts jsonl', () => { expect(() => validateRunOptions(valid({ outputFormat: 'jsonl' }))).not.toThrow(); });
    it('rejects invalid', () => { expect(() => validateRunOptions(valid({ outputFormat: 'xml' as 'text' }))).toThrow(ValidationError); });
  });

  describe('thinkingEffort', () => {
    it('accepts low', () => { expect(() => validateRunOptions(valid({ thinkingEffort: 'low' }))).not.toThrow(); });
    it('accepts max', () => { expect(() => validateRunOptions(valid({ thinkingEffort: 'max' }))).not.toThrow(); });
    it('rejects invalid', () => { expect(() => validateRunOptions(valid({ thinkingEffort: 'ultra' as 'low' }))).toThrow(ValidationError); });
  });

  // -------------------------------------------------------------------------
  // cwd
  // -------------------------------------------------------------------------
  describe('env', () => {
    it('accepts valid env values', () => {
      expect(() => validateRunOptions(valid({ env: { FOO: 'bar', BAZ: 'qux' } }))).not.toThrow();
    });

    it('rejects non-string env values', () => {
      expect(() => validateRunOptions(valid({ env: { FOO: 42 } as never }))).toThrow(ValidationError);
    });
  });

  describe('cwd', () => {
    it('accepts existing absolute directory', () => {
      expect(() => validateRunOptions(valid({ cwd: os.tmpdir() }))).not.toThrow();
    });

    it('rejects relative path', () => {
      expect(() => validateRunOptions(valid({ cwd: 'relative/path' }))).toThrow(ValidationError);
    });

    it('rejects non-existent absolute directory', () => {
      expect(() => validateRunOptions(valid({ cwd: '/absolutely/does/not/exist/path' }))).toThrow(ValidationError);
    });
  });

  // -------------------------------------------------------------------------
  // profile name pattern
  // -------------------------------------------------------------------------
  describe('profile', () => {
    it('accepts valid names', () => {
      expect(() => validateRunOptions(valid({ profile: 'my-profile_01' }))).not.toThrow();
    });

    it('rejects names with spaces', () => {
      expect(() => validateRunOptions(valid({ profile: 'my profile' }))).toThrow(ValidationError);
    });

    it('rejects empty name', () => {
      expect(() => validateRunOptions(valid({ profile: '' }))).toThrow(ValidationError);
    });

    it('rejects names over 64 chars', () => {
      expect(() => validateRunOptions(valid({ profile: 'a'.repeat(65) }))).toThrow(ValidationError);
    });
  });

  // -------------------------------------------------------------------------
  // runId ULID format
  // -------------------------------------------------------------------------
  describe('runId', () => {
    it('accepts valid ULID', () => {
      expect(() => validateRunOptions(valid({ runId: '01ARZ3NDEKTSV4RRFFQ69G5FAV' }))).not.toThrow();
    });

    it('rejects too-short string', () => {
      expect(() => validateRunOptions(valid({ runId: '01ARZ3NDEK' }))).toThrow(ValidationError);
    });

    it('rejects lowercase', () => {
      expect(() => validateRunOptions(valid({ runId: '01arz3ndektsv4rrffq69g5fav' }))).toThrow(ValidationError);
    });

    it('rejects strings with invalid chars (I, L, O)', () => {
      // I, L, O are not in Crockford base32
      expect(() => validateRunOptions(valid({ runId: '01ARZ3NDIKTSV4RRFFQ69G5FAV' }))).toThrow(ValidationError);
    });
  });

  // -------------------------------------------------------------------------
  // Attachment validation
  // -------------------------------------------------------------------------
  describe('attachments', () => {
    it('accepts valid filePath attachment for existing file', () => {
      // Use a file we know exists (this test file itself, resolved to absolute)
      const thisFile = new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');
      expect(() => validateRunOptions(valid({
        attachments: [{ filePath: thisFile }],
      }))).not.toThrow();
    });

    it('rejects non-existent filePath', () => {
      expect(() => validateRunOptions(valid({
        attachments: [{ filePath: '/absolutely/nonexistent/file.txt' }],
      }))).toThrow(ValidationError);
    });

    it('accepts valid url attachment', () => {
      expect(() => validateRunOptions(valid({
        attachments: [{ url: 'https://example.com/file.txt' }],
      }))).not.toThrow();
    });

    it('accepts valid base64 attachment with mimeType', () => {
      expect(() => validateRunOptions(valid({
        attachments: [{ base64: 'dGVzdA==', mimeType: 'text/plain' }],
      }))).not.toThrow();
    });

    it('rejects attachment with no source', () => {
      expect(() => validateRunOptions(valid({
        attachments: [{ name: 'orphan' }],
      }))).toThrow(ValidationError);
    });

    it('rejects attachment with multiple sources', () => {
      expect(() => validateRunOptions(valid({
        attachments: [{ filePath: '/tmp/file', url: 'https://x.com' }],
      }))).toThrow(ValidationError);
    });

    it('rejects base64 without mimeType', () => {
      const fields = fieldNames(() => validateRunOptions(valid({
        attachments: [{ base64: 'dGVzdA==' }],
      })));
      expect(fields.some((f) => f.includes('mimeType'))).toBe(true);
    });

    it('rejects relative filePath', () => {
      const fields = fieldNames(() => validateRunOptions(valid({
        attachments: [{ filePath: 'relative/path.txt' }],
      })));
      expect(fields.some((f) => f.includes('filePath'))).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // McpServerConfig validation
  // -------------------------------------------------------------------------
  describe('mcpServers', () => {
    it('accepts valid stdio server', () => {
      expect(() => validateRunOptions(valid({
        mcpServers: [{ name: 'my-server', transport: 'stdio', command: 'node' }],
      }))).not.toThrow();
    });

    it('accepts valid sse server', () => {
      expect(() => validateRunOptions(valid({
        mcpServers: [{ name: 'my-server', transport: 'sse', url: 'https://x.com/sse' }],
      }))).not.toThrow();
    });

    it('accepts valid streamable-http server', () => {
      expect(() => validateRunOptions(valid({
        mcpServers: [{ name: 'srv', transport: 'streamable-http', url: 'https://x.com' }],
      }))).not.toThrow();
    });

    it('rejects invalid name pattern', () => {
      expect(() => validateRunOptions(valid({
        mcpServers: [{ name: 'has space', transport: 'stdio', command: 'node' }],
      }))).toThrow(ValidationError);
    });

    it('rejects stdio without command', () => {
      expect(() => validateRunOptions(valid({
        mcpServers: [{ name: 'srv', transport: 'stdio' }],
      }))).toThrow(ValidationError);
    });

    it('rejects sse without url', () => {
      expect(() => validateRunOptions(valid({
        mcpServers: [{ name: 'srv', transport: 'sse' }],
      }))).toThrow(ValidationError);
    });

    it('rejects streamable-http without url', () => {
      expect(() => validateRunOptions(valid({
        mcpServers: [{ name: 'srv', transport: 'streamable-http' }],
      }))).toThrow(ValidationError);
    });
  });

  // -------------------------------------------------------------------------
  // retryOn validation
  // -------------------------------------------------------------------------
  describe('retryPolicy.retryOn', () => {
    it('accepts valid error codes', () => {
      expect(() => validateRunOptions(valid({
        retryPolicy: { retryOn: ['RATE_LIMITED', 'TIMEOUT'] },
      }))).not.toThrow();
    });

    it('rejects invalid error codes', () => {
      expect(() => validateRunOptions(valid({
        retryPolicy: { retryOn: ['NOT_REAL' as 'TIMEOUT'] },
      }))).toThrow(ValidationError);
    });

    // Spec ambiguity: JSDoc says "Setting to 0 disables retries" but §5.1 says >= 1.
    // Implementation enforces >= 1 (spec table wins over JSDoc).
    it('rejects maxAttempts: 0 (spec §5.1 table: >= 1)', () => {
      expect(() => validateRunOptions(valid({
        retryPolicy: { maxAttempts: 0 },
      }))).toThrow(ValidationError);
    });

    // §5.2 rule 1: maxDelayMs must be >= baseDelayMs
    it('rejects maxDelayMs < baseDelayMs (cross-field §5.2)', () => {
      expect(() => validateRunOptions(valid({
        retryPolicy: { baseDelayMs: 5000, maxDelayMs: 1000 },
      }))).toThrow(ValidationError);
    });

    it('accepts maxDelayMs >= baseDelayMs', () => {
      expect(() => validateRunOptions(valid({
        retryPolicy: { baseDelayMs: 1000, maxDelayMs: 5000 },
      }))).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Multiple errors collected
  // -------------------------------------------------------------------------
  describe('multiple errors', () => {
    it('stops at first failure group per §6.4', () => {
      // Group 2 (required fields) fails: stops before group 3 (range validation)
      try {
        validateRunOptions({
          agent: '',
          prompt: '',
          temperature: -1,
          topK: 0.5,
          timeout: -1,
        });
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        const ve = err as ValidationError;
        // Only agent + prompt errors from group 2
        expect(ve.fields.length).toBe(2);
        expect(ve.fields.map(f => f.field)).toContain('agent');
        expect(ve.fields.map(f => f.field)).toContain('prompt');
      }
    });

    it('collects multiple range errors within group 3', () => {
      try {
        validateRunOptions({
          agent: 'claude',
          prompt: 'hello',
          temperature: -1,
          topK: 0.5,
          timeout: -1,
        });
        expect.fail('should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        const ve = err as ValidationError;
        expect(ve.fields.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  // -------------------------------------------------------------------------
  // NaN rejection
  // -------------------------------------------------------------------------
  describe('NaN rejection', () => {
    const nanFields: Array<[string, Record<string, unknown>]> = [
      ['temperature', { temperature: NaN }],
      ['topP', { topP: NaN }],
      ['topK', { topK: NaN }],
      ['maxTokens', { maxTokens: NaN }],
      ['maxOutputTokens', { maxOutputTokens: NaN }],
      ['thinkingBudgetTokens', { thinkingBudgetTokens: NaN }],
      ['timeout', { timeout: NaN }],
      ['inactivityTimeout', { inactivityTimeout: NaN }],
      ['maxTurns', { maxTurns: NaN }],
      ['gracePeriodMs', { gracePeriodMs: NaN }],
    ];

    for (const [field, overrides] of nanFields) {
      it(`rejects NaN for ${field}`, () => {
        expect(() => validateRunOptions(valid(overrides as Partial<RunOptions>))).toThrow(ValidationError);
      });
    }

    it('rejects NaN in retryPolicy fields', () => {
      expect(() => validateRunOptions(valid({
        retryPolicy: { maxAttempts: NaN },
      }))).toThrow(ValidationError);
      expect(() => validateRunOptions(valid({
        retryPolicy: { baseDelayMs: NaN },
      }))).toThrow(ValidationError);
      expect(() => validateRunOptions(valid({
        retryPolicy: { maxDelayMs: NaN },
      }))).toThrow(ValidationError);
      expect(() => validateRunOptions(valid({
        retryPolicy: { jitterFactor: NaN },
      }))).toThrow(ValidationError);
    });

    it('rejects Infinity for numeric fields', () => {
      expect(() => validateRunOptions(valid({ temperature: Infinity }))).toThrow(ValidationError);
      expect(() => validateRunOptions(valid({ timeout: -Infinity }))).toThrow(ValidationError);
    });
  });

  // -------------------------------------------------------------------------
  // gracePeriodMs validation
  // -------------------------------------------------------------------------
  describe('gracePeriodMs', () => {
    it('accepts valid gracePeriodMs', () => {
      expect(() => validateRunOptions(valid({ gracePeriodMs: 0 }))).not.toThrow();
      expect(() => validateRunOptions(valid({ gracePeriodMs: 5000 }))).not.toThrow();
    });

    it('rejects negative gracePeriodMs', () => {
      expect(() => validateRunOptions(valid({ gracePeriodMs: -1 }))).toThrow(ValidationError);
    });

    it('rejects non-integer gracePeriodMs', () => {
      expect(() => validateRunOptions(valid({ gracePeriodMs: 1.5 }))).toThrow(ValidationError);
    });
  });
});
