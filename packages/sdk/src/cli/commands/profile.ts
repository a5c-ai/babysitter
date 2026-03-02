/**
 * profile:* commands — Read, write, merge, and render user/project profiles.
 *
 * Commands:
 *   profile:read   --user|--project [--dir <dir>] [--json]
 *   profile:write  --user|--project --input <file> [--dir <dir>] [--json]
 *   profile:merge  --user|--project --input <file> [--dir <dir>] [--json]
 *   profile:render --user|--project [--dir <dir>] [--json]
 */

import { promises as fs } from "node:fs";
import { resolveInputPath } from "../resolveInputPath";

import {
  readUserProfile,
  writeUserProfile,
  mergeUserProfile,
  renderUserProfileMarkdown,
  getUserProfileDir,
} from "../../profiles/userProfile";

import {
  readProjectProfile,
  writeProjectProfile,
  mergeProjectProfile,
  renderProjectProfileMarkdown,
  getProjectProfileDir,
} from "../../profiles/projectProfile";

import type { UserProfile } from "../../profiles/types";
import type { ProjectProfile } from "../../profiles/types";

// ============================================================================
// Types
// ============================================================================

export interface ProfileCommandArgs {
  subcommand: "read" | "write" | "merge" | "render";
  user: boolean;
  project: boolean;
  inputPath?: string;
  dir?: string;
  json: boolean;
}

// ============================================================================
// Handlers
// ============================================================================

export function handleProfileRead(args: ProfileCommandArgs): number {
  const { user, project, dir, json } = args;
  if (!user && !project) {
    console.error("[profile:read] Specify --user or --project");
    return 1;
  }

  if (user) {
    const profile = readUserProfile(dir);
    if (!profile) {
      if (json) {
        console.log(JSON.stringify({ error: "no_profile", profileDir: dir ?? getUserProfileDir() }));
      } else {
        console.error(`[profile:read] No user profile found at ${dir ?? getUserProfileDir()}`);
      }
      return 1;
    }
    if (json) {
      console.log(JSON.stringify(profile, null, 2));
    } else {
      console.log(renderUserProfileMarkdown(profile));
    }
    return 0;
  }

  // project
  const profile = readProjectProfile(dir);
  if (!profile) {
    if (json) {
      console.log(JSON.stringify({ error: "no_profile", profileDir: dir ?? getProjectProfileDir() }));
    } else {
      console.error(`[profile:read] No project profile found at ${dir ?? getProjectProfileDir()}`);
    }
    return 1;
  }
  if (json) {
    console.log(JSON.stringify(profile, null, 2));
  } else {
    console.log(renderProjectProfileMarkdown(profile));
  }
  return 0;
}

export async function handleProfileWrite(args: ProfileCommandArgs): Promise<number> {
  const { user, project, inputPath, dir, json } = args;
  if (!user && !project) {
    console.error("[profile:write] Specify --user or --project");
    return 1;
  }
  if (!inputPath) {
    console.error("[profile:write] --input <file> is required");
    return 1;
  }

  let profileData: unknown;
  try {
    const raw = await fs.readFile(resolveInputPath(inputPath), "utf8");
    profileData = JSON.parse(raw);
  } catch (error) {
    console.error(`[profile:write] Failed to read input file: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }

  if (user) {
    writeUserProfile(profileData as UserProfile, dir);
    const profileDir = dir ?? getUserProfileDir();
    if (json) {
      console.log(JSON.stringify({ status: "ok", profileDir, type: "user" }));
    } else {
      console.log(`[profile:write] User profile written to ${profileDir}`);
    }
    return 0;
  }

  // project
  writeProjectProfile(profileData as ProjectProfile, dir);
  const profileDir = dir ?? getProjectProfileDir();
  if (json) {
    console.log(JSON.stringify({ status: "ok", profileDir, type: "project" }));
  } else {
    console.log(`[profile:write] Project profile written to ${profileDir}`);
  }
  return 0;
}

export async function handleProfileMerge(args: ProfileCommandArgs): Promise<number> {
  const { user, project, inputPath, dir, json } = args;
  if (!user && !project) {
    console.error("[profile:merge] Specify --user or --project");
    return 1;
  }
  if (!inputPath) {
    console.error("[profile:merge] --input <file> is required");
    return 1;
  }

  let updates: unknown;
  try {
    const raw = await fs.readFile(resolveInputPath(inputPath), "utf8");
    updates = JSON.parse(raw);
  } catch (error) {
    console.error(`[profile:merge] Failed to read input file: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }

  if (user) {
    const existing = readUserProfile(dir);
    if (!existing) {
      console.error(`[profile:merge] No existing user profile to merge into at ${dir ?? getUserProfileDir()}`);
      return 1;
    }
    const merged = mergeUserProfile(existing, updates as Partial<UserProfile>);
    writeUserProfile(merged, dir);
    if (json) {
      console.log(JSON.stringify({ status: "ok", type: "user", version: merged.version }));
    } else {
      console.log(`[profile:merge] User profile merged (version ${merged.version})`);
    }
    return 0;
  }

  // project
  const existing = readProjectProfile(dir);
  if (!existing) {
    console.error(`[profile:merge] No existing project profile to merge into at ${dir ?? getProjectProfileDir()}`);
    return 1;
  }
  const merged = mergeProjectProfile(existing, updates as Partial<ProjectProfile>);
  writeProjectProfile(merged, dir);
  if (json) {
    console.log(JSON.stringify({ status: "ok", type: "project", version: merged.version }));
  } else {
    console.log(`[profile:merge] Project profile merged (version ${merged.version})`);
  }
  return 0;
}

export function handleProfileRender(args: ProfileCommandArgs): number {
  const { user, project, dir, json } = args;
  if (!user && !project) {
    console.error("[profile:render] Specify --user or --project");
    return 1;
  }

  if (user) {
    const profile = readUserProfile(dir);
    if (!profile) {
      console.error(`[profile:render] No user profile found at ${dir ?? getUserProfileDir()}`);
      return 1;
    }
    const markdown = renderUserProfileMarkdown(profile);
    if (json) {
      console.log(JSON.stringify({ markdown, type: "user" }));
    } else {
      console.log(markdown);
    }
    return 0;
  }

  // project
  const profile = readProjectProfile(dir);
  if (!profile) {
    console.error(`[profile:render] No project profile found at ${dir ?? getProjectProfileDir()}`);
    return 1;
  }
  const markdown = renderProjectProfileMarkdown(profile);
  if (json) {
    console.log(JSON.stringify({ markdown, type: "project" }));
  } else {
    console.log(markdown);
  }
  return 0;
}

/**
 * Route a profile:* command to the appropriate handler.
 */
export async function handleProfileCommand(
  subcommand: string,
  args: ProfileCommandArgs,
): Promise<number> {
  switch (subcommand) {
    case "read":
      return handleProfileRead(args);
    case "write":
      return handleProfileWrite(args);
    case "merge":
      return handleProfileMerge(args);
    case "render":
      return handleProfileRender(args);
    default:
      console.error(`[profile] Unknown subcommand: ${subcommand}. Use read, write, merge, or render.`);
      return 1;
  }
}
