/**
 * Project Profile Management for Babysitter SDK
 *
 * Provides functions to read, write, merge, and render project profiles.
 * Project profiles are stored at `{projectRoot}/.a5c/project-profile.json`
 * with a companion human-readable markdown file alongside.
 *
 * All file operations are synchronous for CJS compatibility.
 * Writes use an atomic temp-file-then-rename strategy to prevent corruption.
 */

import * as fs from "fs";
import * as path from "path";

import {
  ProjectProfile,
  PROJECT_PROFILE_FILENAME,
  PROJECT_PROFILE_MD_FILENAME,
} from "./types";
import { renderProjectProfileMarkdown } from "./projectProfileRender";
export { mergeProjectProfile } from "./projectProfileMerge";
export { renderProjectProfileMarkdown } from "./projectProfileRender";

/**
 * Returns the directory for storing the project profile.
 *
 * Defaults to `{cwd}/.a5c/` if no project root is specified.
 *
 * @param projectRoot - Absolute path to the project root. Defaults to `process.cwd()`.
 * @returns Absolute path to the project profile directory
 */
export function getProjectProfileDir(projectRoot?: string): string {
  const root = projectRoot ?? process.cwd();
  return path.join(root, ".a5c");
}

/**
 * Reads the project profile from disk.
 *
 * Returns `null` if the profile file does not exist or contains
 * malformed JSON. Does not throw on missing or corrupt files.
 *
 * @param projectRoot - Absolute path to the project root. Defaults to `process.cwd()`.
 * @returns The parsed project profile, or `null` if unavailable
 */
export function readProjectProfile(projectRoot?: string): ProjectProfile | null {
  const dir = getProjectProfileDir(projectRoot);
  const filePath = path.join(dir, PROJECT_PROFILE_FILENAME);

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as ProjectProfile;
  } catch (_error: unknown) {
    return null;
  }
}

/**
 * Writes a project profile to disk atomically.
 *
 * Creates the profile directory recursively if it does not exist.
 * Uses a temporary file with rename to prevent partial writes.
 * Also writes a companion markdown summary file for human readability.
 *
 * @param profile - The complete project profile to persist
 * @param projectRoot - Absolute path to the project root. Defaults to `process.cwd()`.
 */
export function writeProjectProfile(profile: ProjectProfile, projectRoot?: string): void {
  const dir = getProjectProfileDir(projectRoot);
  fs.mkdirSync(dir, { recursive: true });

  const jsonPath = path.join(dir, PROJECT_PROFILE_FILENAME);
  const mdPath = path.join(dir, PROJECT_PROFILE_MD_FILENAME);
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
    const markdown = renderProjectProfileMarkdown(profile);
    fs.writeFileSync(mdPath, markdown, "utf8");
  } catch (_mdError: unknown) {
    // Markdown write failure is non-fatal
  }
}

/**
 * Deep-merges partial updates into an existing project profile.
 *
 * Merge strategy:
 * - **Scalars** (strings, numbers, booleans): overwritten by the update value
 * - **Objects**: spread-merged (shallow merge per nested object)
 * - **Arrays with identifiable items** (having `id`, `name`, or similar fields):
 *   deduplicated by that key, with update items taking precedence
 * - **Arrays of primitives**: deduplicated by value
 * - `updatedAt` is set to the current ISO timestamp
 * - `version` is incremented by 1
 *
 * @param existing - The current project profile
 * @param updates - Partial profile fields to merge in
 * @returns A new merged project profile (does not mutate inputs)
 */
/**
 * Creates a new project profile with sensible defaults.
 *
 * @param projectName - Name of the project
 * @returns A complete project profile with default values
 */
export function createDefaultProjectProfile(projectName: string): ProjectProfile {
  const now = new Date().toISOString();
  return {
    projectName,
    description: "",
    goals: [],
    techStack: {},
    architecture: {},
    workflows: [],
    tools: {},
    conventions: {},
    createdAt: now,
    updatedAt: now,
    version: 1,
  };
}
