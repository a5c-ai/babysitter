import { readdir, readFile } from "node:fs/promises";
import { join, extname } from "node:path";

import { ResponderProfileSchema } from "../types.js";
import type { ResponderProfile } from "../types.js";

/**
 * Result of validating a single profile.
 */
export interface ProfileValidationResult {
  valid: boolean;
  filePath?: string;
  profile?: ResponderProfile;
  errors: string[];
}

/**
 * Result of validating all profiles in a directory.
 */
export interface DirectoryValidationResult {
  valid: boolean;
  results: ProfileValidationResult[];
  totalProfiles: number;
  validProfiles: number;
  invalidProfiles: number;
}

/**
 * Validate a profile object against the ResponderProfile Zod schema.
 */
export function validateProfile(profile: unknown): ProfileValidationResult {
  const result = ResponderProfileSchema.safeParse(profile);
  if (result.success) {
    return {
      valid: true,
      profile: result.data,
      errors: [],
    };
  }
  return {
    valid: false,
    errors: result.error.message.split("; "),
  };
}

/**
 * Read a JSON profile file from disk and validate it against the ResponderProfile schema.
 */
export async function validateProfileFile(
  filePath: string,
): Promise<ProfileValidationResult> {
  try {
    const raw = await readFile(filePath, "utf-8");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return {
        valid: false,
        filePath,
        errors: [`Failed to parse JSON in ${filePath}`],
      };
    }
    const result = validateProfile(parsed);
    result.filePath = filePath;
    return result;
  } catch (err) {
    return {
      valid: false,
      filePath,
      errors: [`Failed to read file ${filePath}: ${(err as Error).message}`],
    };
  }
}

/**
 * Validate all JSON profile files in a directory.
 * Non-JSON files are ignored.
 */
export async function validateAllProfiles(
  dir: string,
): Promise<DirectoryValidationResult> {
  const results: ProfileValidationResult[] = [];

  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return {
      valid: false,
      results: [
        {
          valid: false,
          errors: [`Directory not found or not readable: ${dir}`],
        },
      ],
      totalProfiles: 0,
      validProfiles: 0,
      invalidProfiles: 0,
    };
  }

  const jsonFiles = entries.filter(
    (e) => extname(e).toLowerCase() === ".json" && e !== "schema.json",
  );

  for (const file of jsonFiles) {
    const filePath = join(dir, file);
    const result = await validateProfileFile(filePath);
    results.push(result);
  }

  const validCount = results.filter((r) => r.valid).length;
  const invalidCount = results.filter((r) => !r.valid).length;

  return {
    valid: invalidCount === 0 && results.length > 0,
    results,
    totalProfiles: results.length,
    validProfiles: validCount,
    invalidProfiles: invalidCount,
  };
}
