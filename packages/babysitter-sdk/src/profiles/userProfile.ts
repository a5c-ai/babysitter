/**
 * User Profile Management for Babysitter SDK
 *
 * Provides functions to read, write, merge, and render user profiles.
 * User profiles are stored at `~/.a5c/user-profile.json`
 * with a companion human-readable markdown file alongside.
 *
 * All file operations are synchronous for CJS compatibility.
 * Writes use an atomic temp-file-then-rename strategy to prevent corruption.
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

import {
  UserProfile,
  USER_PROFILE_FILENAME,
  USER_PROFILE_MD_FILENAME,
} from "./types";
import { renderUserProfileMarkdown } from "./userProfileRender";
export { renderUserProfileMarkdown } from "./userProfileRender";

/**
 * Returns the default directory for storing the user profile.
 *
 * Uses `~/.a5c/` as the user-level configuration directory.
 * The directory may not yet exist on disk.
 *
 * @returns Absolute path to the user profile directory
 */
export function getUserProfileDir(): string {
  return path.join(os.homedir(), ".a5c");
}

/**
 * Reads the user profile from disk.
 *
 * Returns `null` if the profile file does not exist or contains
 * malformed JSON. Does not throw on missing or corrupt files.
 *
 * @param profileDir - Directory containing the profile file. Defaults to {@link getUserProfileDir}.
 * @returns The parsed user profile, or `null` if unavailable
 */
export function readUserProfile(profileDir?: string): UserProfile | null {
  const dir = profileDir ?? getUserProfileDir();
  const filePath = path.join(dir, USER_PROFILE_FILENAME);

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as UserProfile;
  } catch (_error: unknown) {
    return null;
  }
}

/**
 * Writes a user profile to disk atomically.
 *
 * Creates the profile directory recursively if it does not exist.
 * Uses a temporary file with rename to prevent partial writes.
 * Also writes a companion markdown summary file for human readability.
 *
 * @param profile - The complete user profile to persist
 * @param profileDir - Directory to write the profile to. Defaults to {@link getUserProfileDir}.
 */
export function writeUserProfile(profile: UserProfile, profileDir?: string): void {
  const dir = profileDir ?? getUserProfileDir();
  fs.mkdirSync(dir, { recursive: true });

  const jsonPath = path.join(dir, USER_PROFILE_FILENAME);
  const mdPath = path.join(dir, USER_PROFILE_MD_FILENAME);
  const jsonData = JSON.stringify(profile, null, 2) + "\n";

  // Atomic write for JSON
  const tmpPath = `${jsonPath}.tmp-${process.pid}-${Date.now()}`;
  try {
    fs.writeFileSync(tmpPath, jsonData, "utf8");
    fs.renameSync(tmpPath, jsonPath);
  } catch (_error: unknown) {
    // Clean up temp file on failure
    try {
      fs.unlinkSync(tmpPath);
    } catch (_cleanupError: unknown) {
      // Ignore cleanup errors
    }
    throw _error;
  }

  // Write markdown summary (best-effort, not atomic)
  try {
    const markdown = renderUserProfileMarkdown(profile);
    fs.writeFileSync(mdPath, markdown, "utf8");
  } catch (_mdError: unknown) {
    // Markdown write failure is non-fatal
  }
}

/**
 * Deep-merges partial updates into an existing user profile.
 *
 * Merge strategy:
 * - **Scalars** (strings, numbers, booleans): overwritten by the update value
 * - **Objects**: spread-merged (shallow merge per nested object)
 * - **Arrays with identifiable items** (having `id`, `name`, `domain`, or `platform` fields):
 *   deduplicated by that key, with update items taking precedence
 * - **Arrays of primitives**: deduplicated by value
 * - `updatedAt` is set to the current ISO timestamp
 * - `version` is incremented by 1
 *
 * @param existing - The current user profile
 * @param updates - Partial profile fields to merge in
 * @returns A new merged user profile (does not mutate inputs)
 */
export function mergeUserProfile(
  existing: UserProfile,
  updates: Partial<UserProfile>,
): UserProfile {
  const merged: UserProfile = { ...existing };

  // Merge scalar fields
  if (updates.name !== undefined) merged.name = updates.name;
  if (updates.createdAt !== undefined) merged.createdAt = updates.createdAt;

  // Merge specialties (deduplicate by domain)
  if (updates.specialties !== undefined) {
    merged.specialties = mergeArrayByKey(
      existing.specialties,
      updates.specialties,
      "domain",
    );
  }

  // Merge expertise levels (object spread)
  if (updates.expertiseLevels !== undefined) {
    merged.expertiseLevels = { ...existing.expertiseLevels };
    for (const [key, value] of Object.entries(updates.expertiseLevels)) {
      merged.expertiseLevels[key] = { ...existing.expertiseLevels[key], ...value };
    }
  }

  // Merge goals (deduplicate by id)
  if (updates.goals !== undefined) {
    merged.goals = mergeArrayByKey(existing.goals, updates.goals, "id");
  }

  // Merge preferences (shallow spread)
  if (updates.preferences !== undefined) {
    merged.preferences = { ...existing.preferences, ...updates.preferences };
    // Deep merge workingHours if both exist
    if (existing.preferences.workingHours && updates.preferences.workingHours) {
      merged.preferences.workingHours = {
        ...existing.preferences.workingHours,
        ...updates.preferences.workingHours,
      };
    }
  }

  // Merge tool preferences (shallow spread)
  if (updates.toolPreferences !== undefined) {
    merged.toolPreferences = { ...existing.toolPreferences, ...updates.toolPreferences };
    // Deduplicate array fields
    if (updates.toolPreferences.packageManagers) {
      merged.toolPreferences.packageManagers = deduplicatePrimitiveArray([
        ...(existing.toolPreferences.packageManagers ?? []),
        ...updates.toolPreferences.packageManagers,
      ]);
    }
    if (updates.toolPreferences.languages) {
      merged.toolPreferences.languages = deduplicatePrimitiveArray([
        ...(existing.toolPreferences.languages ?? []),
        ...updates.toolPreferences.languages,
      ]);
    }
  }

  // Merge breakpoint tolerance
  if (updates.breakpointTolerance !== undefined) {
    merged.breakpointTolerance = {
      ...existing.breakpointTolerance,
      ...updates.breakpointTolerance,
    };
    if (updates.breakpointTolerance.perCategory) {
      merged.breakpointTolerance.perCategory = {
        ...(existing.breakpointTolerance.perCategory ?? {}),
        ...updates.breakpointTolerance.perCategory,
      };
    }
    if (updates.breakpointTolerance.alwaysBreakOn) {
      merged.breakpointTolerance.alwaysBreakOn = deduplicatePrimitiveArray([
        ...(existing.breakpointTolerance.alwaysBreakOn ?? []),
        ...updates.breakpointTolerance.alwaysBreakOn,
      ]);
    }
  }

  // Merge communication style (shallow spread)
  if (updates.communicationStyle !== undefined) {
    merged.communicationStyle = {
      ...existing.communicationStyle,
      ...updates.communicationStyle,
    };
  }

  // Merge social profiles (deduplicate by platform)
  if (updates.socialProfiles !== undefined) {
    merged.socialProfiles = mergeArrayByKey(
      existing.socialProfiles ?? [],
      updates.socialProfiles,
      "platform",
    );
  }

  // Merge experience (shallow spread with array handling)
  if (updates.experience !== undefined) {
    merged.experience = { ...existing.experience, ...updates.experience };
    if (updates.experience.industries) {
      merged.experience.industries = deduplicatePrimitiveArray([
        ...(existing.experience.industries ?? []),
        ...updates.experience.industries,
      ]);
    }
    if (updates.experience.previousRoles) {
      merged.experience.previousRoles = mergeArrayByKey(
        existing.experience.previousRoles ?? [],
        updates.experience.previousRoles,
        "title",
      );
    }
    if (updates.experience.education) {
      merged.experience.education = mergeArrayByKey(
        existing.experience.education ?? [],
        updates.experience.education,
        "institution",
      );
    }
    if (updates.experience.certifications) {
      merged.experience.certifications = deduplicatePrimitiveArray([
        ...(existing.experience.certifications ?? []),
        ...updates.experience.certifications,
      ]);
    }
  }

  // Merge external integrations (deduplicate by service)
  if (updates.externalIntegrations !== undefined) {
    merged.externalIntegrations = mergeArrayByKey(
      existing.externalIntegrations ?? [],
      updates.externalIntegrations,
      "service",
    );
  }

  // Merge installed plugins/skills/agents (deduplicate)
  if (updates.installedPlugins !== undefined) {
    merged.installedPlugins = deduplicatePrimitiveArray([
      ...(existing.installedPlugins ?? []),
      ...updates.installedPlugins,
    ]);
  }
  if (updates.installedSkills !== undefined) {
    merged.installedSkills = deduplicatePrimitiveArray([
      ...(existing.installedSkills ?? []),
      ...updates.installedSkills,
    ]);
  }
  if (updates.installedAgents !== undefined) {
    merged.installedAgents = deduplicatePrimitiveArray([
      ...(existing.installedAgents ?? []),
      ...updates.installedAgents,
    ]);
  }

  // Always update metadata
  merged.updatedAt = new Date().toISOString();
  merged.version = existing.version + 1;

  return merged;
}

/**
 * Creates a new user profile with sensible defaults.
 *
 * @param name - Display name for the user
 * @returns A complete user profile with default values
 */
export function createDefaultUserProfile(name: string): UserProfile {
  const now = new Date().toISOString();
  return {
    name,
    specialties: [],
    expertiseLevels: {},
    goals: [],
    preferences: {
      verbosity: "normal",
      autonomyLevel: "semi-autonomous",
      riskTolerance: "moderate",
    },
    toolPreferences: {},
    breakpointTolerance: {
      global: "moderate",
      skipBreakpointsForKnownPatterns: false,
      alwaysBreakOn: [],
    },
    communicationStyle: {
      tone: "professional",
      useEmojis: false,
      explanationDepth: "standard",
      preferredResponseFormat: "markdown",
    },
    experience: {},
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}

/**
 * Renders a human-readable markdown summary of a user profile.
 *
 * @param profile - The user profile to render
 * @returns Markdown-formatted string summarizing the profile
 */
// ─── Internal Helpers ─────────────────────────────────────────────────

/**
 * Merges two arrays of objects, deduplicating by a specified key field.
 * Items from the `updates` array take precedence over `existing` items
 * with the same key value.
 */
function mergeArrayByKey<T, K extends keyof T>(
  existing: T[],
  updates: T[],
  key: K,
): T[] {
  const map = new Map<unknown, T>();
  for (const item of existing) {
    const keyValue = item[key];
    if (keyValue !== undefined) {
      map.set(keyValue, item);
    }
  }
  for (const item of updates) {
    const keyValue = item[key];
    if (keyValue !== undefined) {
      const prev = map.get(keyValue);
      map.set(keyValue, prev ? { ...prev, ...item } : item);
    } else {
      // Items without the key field are appended
      map.set(Symbol(), item);
    }
  }
  return Array.from(map.values());
}

/**
 * Removes duplicate primitive values from an array while preserving order.
 */
function deduplicatePrimitiveArray<T extends string | number | boolean>(arr: T[]): T[] {
  return [...new Set(arr)];
}
