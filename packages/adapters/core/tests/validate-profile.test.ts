import { describe, it, expect } from 'vitest';
import {
  validateProfileData,
  PROHIBITED_PROFILE_FIELDS,
  ValidationError,
} from '../src/index.js';

describe('validateProfileData', () => {
  // -----------------------------------------------------------------------
  // Prohibited fields
  // -----------------------------------------------------------------------
  describe('prohibited fields', () => {
    const prohibited = [
      'prompt',
      'onInputRequired',
      'onApprovalRequest',
      'env',
      'cwd',
      'sessionId',
      'forkSessionId',
      'noSession',
      'attachments',
      'runId',
      'projectId',
      'profile',
      'agentsDoc',
    ];

    for (const field of prohibited) {
      it(`rejects "${field}"`, () => {
        expect(() => validateProfileData({ [field]: 'value' })).toThrow(ValidationError);
      });
    }

    it('PROHIBITED_PROFILE_FIELDS set has all 13 fields', () => {
      expect(PROHIBITED_PROFILE_FIELDS.size).toBe(13);
      for (const field of prohibited) {
        expect(PROHIBITED_PROFILE_FIELDS.has(field)).toBe(true);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Allowed fields validated
  // -----------------------------------------------------------------------
  describe('allowed field validation', () => {
    it('accepts valid profile data', () => {
      expect(() => validateProfileData({
        model: 'sonnet',
        temperature: 1.0,
        topP: 0.9,
        topK: 40,
        maxTokens: 4096,
        maxOutputTokens: 2048,
        thinkingBudgetTokens: 2048,
        timeout: 60000,
        inactivityTimeout: 10000,
        maxTurns: 5,
        approvalMode: 'yolo',
        thinkingEffort: 'high',
        stream: 'auto',
        outputFormat: 'json',
        systemPromptMode: 'append',
      })).not.toThrow();
    });

    it('rejects invalid temperature in profile', () => {
      expect(() => validateProfileData({ temperature: -1 })).toThrow(ValidationError);
    });

    it('rejects invalid topP in profile', () => {
      expect(() => validateProfileData({ topP: 2 })).toThrow(ValidationError);
    });

    it('rejects invalid topK in profile', () => {
      expect(() => validateProfileData({ topK: 0 })).toThrow(ValidationError);
    });

    it('rejects invalid maxTokens in profile', () => {
      expect(() => validateProfileData({ maxTokens: 0 })).toThrow(ValidationError);
    });

    it('rejects invalid maxOutputTokens in profile', () => {
      expect(() => validateProfileData({ maxOutputTokens: -1 })).toThrow(ValidationError);
    });

    it('rejects invalid thinkingBudgetTokens in profile', () => {
      expect(() => validateProfileData({ thinkingBudgetTokens: 512 })).toThrow(ValidationError);
    });

    it('rejects invalid timeout in profile', () => {
      expect(() => validateProfileData({ timeout: -1 })).toThrow(ValidationError);
    });

    it('rejects invalid inactivityTimeout in profile', () => {
      expect(() => validateProfileData({ inactivityTimeout: -1 })).toThrow(ValidationError);
    });

    it('rejects invalid maxTurns in profile', () => {
      expect(() => validateProfileData({ maxTurns: 0 })).toThrow(ValidationError);
    });

    it('rejects invalid approvalMode in profile', () => {
      expect(() => validateProfileData({ approvalMode: 'invalid' })).toThrow(ValidationError);
    });

    it('rejects invalid thinkingEffort in profile', () => {
      expect(() => validateProfileData({ thinkingEffort: 'ultra' })).toThrow(ValidationError);
    });

    it('rejects invalid stream in profile', () => {
      expect(() => validateProfileData({ stream: 'maybe' })).toThrow(ValidationError);
    });

    it('rejects invalid outputFormat in profile', () => {
      expect(() => validateProfileData({ outputFormat: 'xml' })).toThrow(ValidationError);
    });

    it('rejects invalid systemPromptMode in profile', () => {
      expect(() => validateProfileData({ systemPromptMode: 'inject' })).toThrow(ValidationError);
    });

    it('accepts empty data', () => {
      expect(() => validateProfileData({})).not.toThrow();
    });

    it('accepts unknown fields (forward compatibility)', () => {
      expect(() => validateProfileData({ futureField: 42 })).not.toThrow();
    });

    it('rejects NaN in numeric profile fields', () => {
      expect(() => validateProfileData({ temperature: NaN })).toThrow(ValidationError);
      expect(() => validateProfileData({ topK: NaN })).toThrow(ValidationError);
      expect(() => validateProfileData({ maxTurns: NaN })).toThrow(ValidationError);
      expect(() => validateProfileData({ gracePeriodMs: NaN })).toThrow(ValidationError);
    });

    it('accepts valid gracePeriodMs in profile', () => {
      expect(() => validateProfileData({ gracePeriodMs: 5000 })).not.toThrow();
    });

    it('rejects invalid gracePeriodMs in profile', () => {
      expect(() => validateProfileData({ gracePeriodMs: -1 })).toThrow(ValidationError);
    });
  });

  // -----------------------------------------------------------------------
  // Nested retryPolicy validation
  // -----------------------------------------------------------------------
  describe('nested retryPolicy validation', () => {
    it('accepts valid retryPolicy in profile', () => {
      expect(() => validateProfileData({
        retryPolicy: { maxAttempts: 3, baseDelayMs: 1000, jitterFactor: 0.5 },
      })).not.toThrow();
    });

    it('rejects invalid retryPolicy.maxAttempts in profile', () => {
      expect(() => validateProfileData({
        retryPolicy: { maxAttempts: -1 },
      })).toThrow(ValidationError);
    });

    it('rejects NaN retryPolicy.maxAttempts in profile', () => {
      expect(() => validateProfileData({
        retryPolicy: { maxAttempts: NaN },
      })).toThrow(ValidationError);
    });

    it('rejects invalid retryPolicy.jitterFactor in profile', () => {
      expect(() => validateProfileData({
        retryPolicy: { jitterFactor: 2.0 },
      })).toThrow(ValidationError);
    });

    it('rejects maxDelayMs < baseDelayMs in profile (cross-field §5.2)', () => {
      expect(() => validateProfileData({
        retryPolicy: { baseDelayMs: 5000, maxDelayMs: 1000 },
      })).toThrow(ValidationError);
    });

    it('accepts maxDelayMs >= baseDelayMs in profile', () => {
      expect(() => validateProfileData({
        retryPolicy: { baseDelayMs: 1000, maxDelayMs: 5000 },
      })).not.toThrow();
    });

    it('rejects non-object retryPolicy in profile', () => {
      expect(() => validateProfileData({
        retryPolicy: 'invalid',
      })).toThrow(ValidationError);
    });

    it('rejects invalid retryOn error code in profile', () => {
      expect(() => validateProfileData({
        retryPolicy: { retryOn: ['BOGUS_CODE'] },
      })).toThrow(ValidationError);
    });
  });

  // -----------------------------------------------------------------------
  // Nested mcpServers validation
  // -----------------------------------------------------------------------
  describe('nested mcpServers validation', () => {
    it('accepts valid mcpServers in profile', () => {
      expect(() => validateProfileData({
        mcpServers: [{ name: 'test', transport: 'stdio', command: 'echo' }],
      })).not.toThrow();
    });

    it('rejects invalid mcpServer name in profile', () => {
      expect(() => validateProfileData({
        mcpServers: [{ name: '', transport: 'stdio', command: 'echo' }],
      })).toThrow(ValidationError);
    });

    it('rejects invalid mcpServer transport in profile', () => {
      expect(() => validateProfileData({
        mcpServers: [{ name: 'test', transport: 'invalid' }],
      })).toThrow(ValidationError);
    });

    it('rejects non-array mcpServers in profile', () => {
      expect(() => validateProfileData({
        mcpServers: 'invalid',
      })).toThrow(ValidationError);
    });

    it('rejects stdio without command in profile', () => {
      expect(() => validateProfileData({
        mcpServers: [{ name: 'test', transport: 'stdio' }],
      })).toThrow(ValidationError);
    });

    it('rejects non-string env values in mcpServers profile', () => {
      expect(() => validateProfileData({
        mcpServers: [{ name: 'test', transport: 'stdio', command: 'echo', env: { KEY: 42 } }],
      })).toThrow(ValidationError);
    });

    it('accepts string env values in mcpServers profile', () => {
      expect(() => validateProfileData({
        mcpServers: [{ name: 'test', transport: 'stdio', command: 'echo', env: { KEY: 'val' } }],
      })).not.toThrow();
    });
  });
});
