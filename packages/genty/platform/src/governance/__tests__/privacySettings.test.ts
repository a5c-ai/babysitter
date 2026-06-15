import { describe, it, expect } from 'vitest';
import {
  applyPrivacyFilter,
  shouldCollect,
  DEFAULT_PRIVACY_SETTINGS,
  type PrivacySettings,
} from '../privacySettings';

describe('privacySettings', () => {
  // -------------------------------------------------------------------------
  // DEFAULT_PRIVACY_SETTINGS
  // -------------------------------------------------------------------------

  describe('DEFAULT_PRIVACY_SETTINGS', () => {
    it('has sensible defaults', () => {
      expect(DEFAULT_PRIVACY_SETTINGS.telemetryLevel).toBe('redacted');
      expect(DEFAULT_PRIVACY_SETTINGS.logLevel).toBe('redacted');
      expect(DEFAULT_PRIVACY_SETTINGS.includeFileContents).toBe(false);
      expect(DEFAULT_PRIVACY_SETTINGS.includePaths).toBe(true);
      expect(DEFAULT_PRIVACY_SETTINGS.shareSessionData).toBe(false);
    });

    it('is frozen', () => {
      expect(Object.isFrozen(DEFAULT_PRIVACY_SETTINGS)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // applyPrivacyFilter
  // -------------------------------------------------------------------------

  describe('applyPrivacyFilter', () => {
    const data = {
      username: 'alice',
      password: 'hunter2',
      apiKey: 'sk-abc',
      count: 42,
      filePath: '/home/user/code.ts',
      fileContents: 'const x = 1;',
      nested: { secret: 'inner', value: 10 },
    };

    it('returns empty object when telemetry is off', () => {
      const settings: PrivacySettings = { ...DEFAULT_PRIVACY_SETTINGS, telemetryLevel: 'off' };
      expect(applyPrivacyFilter(data, settings)).toEqual({});
    });

    it('passes everything through on full', () => {
      const settings: PrivacySettings = { ...DEFAULT_PRIVACY_SETTINGS, telemetryLevel: 'full' };
      const result = applyPrivacyFilter(data, settings);
      expect(result.password).toBe('hunter2');
      expect(result.apiKey).toBe('sk-abc');
    });

    it('redacts sensitive fields on redacted level', () => {
      const settings: PrivacySettings = { ...DEFAULT_PRIVACY_SETTINGS, telemetryLevel: 'redacted' };
      const result = applyPrivacyFilter(data, settings);
      expect(result.password).toBe('[REDACTED]');
      expect(result.apiKey).toBe('[REDACTED]');
      expect(result.username).toBe('alice');
      expect(result.count).toBe(42);
    });

    it('redacts nested sensitive fields', () => {
      const settings: PrivacySettings = { ...DEFAULT_PRIVACY_SETTINGS, telemetryLevel: 'redacted' };
      const result = applyPrivacyFilter(data, settings);
      const nested = result.nested as Record<string, unknown>;
      expect(nested.secret).toBe('[REDACTED]');
      expect(nested.value).toBe(10);
    });

    it('drops sensitive fields entirely on anonymous', () => {
      const settings: PrivacySettings = { ...DEFAULT_PRIVACY_SETTINGS, telemetryLevel: 'anonymous' };
      const result = applyPrivacyFilter(data, settings);
      expect(result.password).toBeUndefined();
      expect(result.apiKey).toBeUndefined();
    });

    it('redacts file contents when includeFileContents is false', () => {
      const settings: PrivacySettings = { ...DEFAULT_PRIVACY_SETTINGS, telemetryLevel: 'redacted' };
      const result = applyPrivacyFilter(data, settings);
      expect(result.fileContents).toBe('[CONTENT_REDACTED]');
    });

    it('redacts paths when includePaths is false', () => {
      const settings: PrivacySettings = {
        ...DEFAULT_PRIVACY_SETTINGS,
        telemetryLevel: 'redacted',
        includePaths: false,
      };
      const result = applyPrivacyFilter(data, settings);
      expect(result.filePath).toBe('[PATH_REDACTED]');
    });
  });

  // -------------------------------------------------------------------------
  // shouldCollect
  // -------------------------------------------------------------------------

  describe('shouldCollect', () => {
    it('returns false when telemetry is off', () => {
      const settings: PrivacySettings = { ...DEFAULT_PRIVACY_SETTINGS, telemetryLevel: 'off' };
      expect(shouldCollect('any_event', settings)).toBe(false);
    });

    it('returns true for normal events with redacted level', () => {
      expect(shouldCollect('task_completed', DEFAULT_PRIVACY_SETTINGS)).toBe(true);
    });

    it('blocks session_share when shareSessionData is false', () => {
      expect(shouldCollect('session_share', DEFAULT_PRIVACY_SETTINGS)).toBe(false);
    });

    it('allows session_share when shareSessionData is true', () => {
      const settings: PrivacySettings = { ...DEFAULT_PRIVACY_SETTINGS, shareSessionData: true };
      expect(shouldCollect('session_share', settings)).toBe(true);
    });

    it('blocks file_content when includeFileContents is false', () => {
      expect(shouldCollect('file_content', DEFAULT_PRIVACY_SETTINGS)).toBe(false);
    });

    it('allows file_content when includeFileContents is true', () => {
      const settings: PrivacySettings = { ...DEFAULT_PRIVACY_SETTINGS, includeFileContents: true };
      expect(shouldCollect('file_content', settings)).toBe(true);
    });
  });
});
