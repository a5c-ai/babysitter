/**
 * GAP-SEC-007: Privacy Settings.
 *
 * Defines privacy levels and filtering logic for controlling what
 * telemetry, log data, and file contents are collected or shared.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PrivacyLevel = 'full' | 'redacted' | 'anonymous' | 'off';

export interface PrivacySettings {
  /** Level of telemetry data collection. */
  telemetryLevel: PrivacyLevel;
  /** Level of log data retention. */
  logLevel: PrivacyLevel;
  /** Whether file contents may be included in telemetry/logs. */
  includeFileContents: boolean;
  /** Whether file paths may be included. */
  includePaths: boolean;
  /** Whether session data may be shared externally. */
  shareSessionData: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_PRIVACY_SETTINGS: Readonly<PrivacySettings> = Object.freeze({
  telemetryLevel: 'redacted',
  logLevel: 'redacted',
  includeFileContents: false,
  includePaths: true,
  shareSessionData: false,
});

// ---------------------------------------------------------------------------
// Sensitive field patterns
// ---------------------------------------------------------------------------

const SENSITIVE_KEYS = new Set([
  'password', 'secret', 'token', 'apiKey', 'api_key',
  'accessToken', 'access_token', 'refreshToken', 'refresh_token',
  'authorization', 'credentials', 'private_key', 'privateKey',
  'cookie', 'session_id', 'sessionId', 'ssn', 'credit_card',
]);

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.has(key) ||
    SENSITIVE_KEYS.has(key.toLowerCase()) ||
    /password|secret|token|key|credential/i.test(key);
}

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Apply privacy filtering to a data object.
 * Returns a new object with sensitive fields redacted according to settings.
 */
export function applyPrivacyFilter(
  data: Record<string, unknown>,
  settings: PrivacySettings,
): Record<string, unknown> {
  if (settings.telemetryLevel === 'off') {
    return {};
  }

  if (settings.telemetryLevel === 'full') {
    return { ...data };
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    // Redact sensitive keys
    if (isSensitiveKey(key)) {
      if (settings.telemetryLevel === 'anonymous') {
        continue; // drop entirely
      }
      result[key] = '[REDACTED]';
      continue;
    }

    // Handle file paths
    if (!settings.includePaths && typeof value === 'string' && looksLikePath(value)) {
      result[key] = '[PATH_REDACTED]';
      continue;
    }

    // Handle file contents
    if (!settings.includeFileContents && key === 'fileContents') {
      result[key] = '[CONTENT_REDACTED]';
      continue;
    }

    // Recurse into nested objects
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = applyPrivacyFilter(value as Record<string, unknown>, settings);
      continue;
    }

    // In anonymous mode, strip string values that might contain PII
    if (settings.telemetryLevel === 'anonymous' && typeof value === 'string') {
      result[key] = '[ANONYMOUS]';
      continue;
    }

    result[key] = value;
  }

  return result;
}

/**
 * Determine whether a telemetry/log event should be collected
 * given the current privacy settings.
 */
export function shouldCollect(
  eventType: string,
  settings: PrivacySettings,
): boolean {
  if (settings.telemetryLevel === 'off') return false;

  // Session sharing events require explicit opt-in
  if (eventType === 'session_share' && !settings.shareSessionData) return false;

  // File content events require includeFileContents
  if (eventType === 'file_content' && !settings.includeFileContents) return false;

  return true;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function looksLikePath(value: string): boolean {
  return /^(\/|[A-Z]:\\|~\/)/.test(value) || /\.(ts|js|json|md|py|go|rs)$/.test(value);
}
