/**
 * Capability profiles for the Cursor adapter.
 *
 * Cursor's hook surface evolves rapidly. This module allows
 * overriding the default capability assumptions when the
 * adapter's built-in profile doesn't match the actual Cursor
 * version/mode being used.
 *
 * Spec section 17.5: "allow adapter version/profile overrides
 * if Cursor behavior changes rapidly."
 */

/**
 * Describes what the current Cursor version/mode supports.
 */
export interface CursorCapabilityProfile {
  /** Profile name for diagnostics. */
  name: string;
  /** Cursor version range this profile applies to (informational). */
  cursorVersion?: string;
  /** Whether Cursor is running as IDE or CLI. */
  mode: 'ide' | 'cli' | 'unknown';
  /** Which native hook events are known to fire reliably. */
  reliableEvents: string[];
  /** Which native hook events exist but are unreliable or undocumented. */
  unreliableEvents: string[];
  /** Whether stop hook can actually continue the session. */
  stopCanContinue: boolean;
  /** Whether tool-level hooks are available at all. */
  toolHooksAvailable: boolean;
  /** Free-form notes about this profile's known limitations. */
  notes: string[];
}

/**
 * The default profile: based on the documented/stable Cursor
 * hook surface as of mid-2026. All listed events are now
 * documented as native hooks per Cursor's official docs.
 */
export const DEFAULT_PROFILE: CursorCapabilityProfile = {
  name: 'default',
  mode: 'unknown',
  reliableEvents: ['sessionStart', 'sessionEnd', 'stop', 'preToolUse', 'postToolUse'],
  unreliableEvents: [],
  stopCanContinue: true,
  toolHooksAvailable: true,
  notes: [
    'All hook events are documented and stable as of Cursor 3.0',
    'IDE and CLI share the same event surface',
  ],
};

/**
 * A CLI-specific profile with the same capabilities as default.
 * Retained for backward compatibility.
 */
export const CLI_PERMISSIVE_PROFILE: CursorCapabilityProfile = {
  name: 'cli-permissive',
  mode: 'cli',
  reliableEvents: ['sessionStart', 'sessionEnd', 'stop', 'preToolUse', 'postToolUse'],
  unreliableEvents: [],
  stopCanContinue: true,
  toolHooksAvailable: true,
  notes: [
    'CLI mode with full hook support',
  ],
};

/** Active profile — defaults to conservative. */
let activeProfile: CursorCapabilityProfile = { ...DEFAULT_PROFILE };

/**
 * Get the currently active capability profile.
 */
export function getActiveProfile(): CursorCapabilityProfile {
  return activeProfile;
}

/**
 * Override the active capability profile.
 * Use this when deploying against a known Cursor version/mode
 * that differs from the default conservative assumptions.
 *
 * @param profile - The profile to activate.
 */
export function setActiveProfile(profile: CursorCapabilityProfile): void {
  activeProfile = { ...profile };
}

/**
 * Reset to the default conservative profile.
 */
export function resetProfile(): void {
  activeProfile = { ...DEFAULT_PROFILE };
}

/**
 * Check whether a given native event name is considered reliable
 * under the current profile.
 */
export function isEventReliable(nativeEventName: string): boolean {
  return activeProfile.reliableEvents.includes(nativeEventName);
}

/**
 * Check whether a given native event name is known at all
 * (reliable or unreliable) under the current profile.
 */
export function isEventKnown(nativeEventName: string): boolean {
  return (
    activeProfile.reliableEvents.includes(nativeEventName) ||
    activeProfile.unreliableEvents.includes(nativeEventName)
  );
}

/**
 * Build a diagnostics summary of profile-related uncertainty
 * for a given event. Used by the normalizer to annotate events.
 */
export function getEventDiagnostics(nativeEventName: string): {
  isReliable: boolean;
  isKnown: boolean;
  profileName: string;
  mode: string;
  warnings: string[];
} {
  const isReliable = activeProfile.reliableEvents.includes(nativeEventName);
  const isKnown =
    isReliable || activeProfile.unreliableEvents.includes(nativeEventName);

  const warnings: string[] = [];

  if (!isKnown) {
    warnings.push(
      `Event '${nativeEventName}' is not recognized by the '${activeProfile.name}' capability profile`,
    );
  } else if (!isReliable) {
    warnings.push(
      `Event '${nativeEventName}' is known but unreliable under the '${activeProfile.name}' profile`,
    );
  }

  if (activeProfile.mode === 'unknown') {
    warnings.push(
      'Cursor mode (IDE vs CLI) is unknown; event behavior may vary',
    );
  }

  return {
    isReliable,
    isKnown,
    profileName: activeProfile.name,
    mode: activeProfile.mode,
    warnings,
  };
}
