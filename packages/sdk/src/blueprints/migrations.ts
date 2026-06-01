/**
 * Plugin Migration Chain Resolution
 *
 * Parses migration filenames, builds a version graph, and finds
 * the shortest migration path between two versions using BFS.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { MigrationDescriptor, isNodeError } from "./types";

/**
 * Migration filenames use `<from>_to_<to>.<ext>`.
 * Versions may contain digits, letters, dots, underscores, dashes, and
 * pre-release identifiers.
 */
function isMigrationVersionSegment(value: string): boolean {
  if (!value) return false;
  for (const char of value) {
    const code = char.charCodeAt(0);
    const isDigit = code >= 48 && code <= 57;
    const isUpper = code >= 65 && code <= 90;
    const isLower = code >= 97 && code <= 122;
    if (!isDigit && !isUpper && !isLower && char !== "." && char !== "_" && char !== "-") {
      return false;
    }
  }
  return true;
}

/**
 * Parses a migration filename into its constituent version parts.
 * Returns undefined if the filename does not match the expected pattern.
 *
 * @param filename - The migration filename to parse
 */
export function parseMigrationFilename(
  filename: string
): MigrationDescriptor | undefined {
  const extensionIndex = filename.lastIndexOf(".");
  if (extensionIndex <= 0) return undefined;

  const ext = filename.slice(extensionIndex + 1);
  if (ext !== "md" && ext !== "js") return undefined;

  const base = filename.slice(0, extensionIndex);
  const separator = "_to_";
  const separatorIndex = base.indexOf(separator);
  if (separatorIndex <= 0 || separatorIndex !== base.lastIndexOf(separator)) return undefined;

  const from = base.slice(0, separatorIndex);
  const to = base.slice(separatorIndex + separator.length);
  if (!isMigrationVersionSegment(from) || !isMigrationVersionSegment(to)) return undefined;

  return {
    from,
    to,
    file: filename,
    type: ext,
  };
}

/**
 * Lists all migration descriptors found in a migrations directory.
 * Ignores files that do not match the expected naming pattern.
 *
 * @param migrationsDir - Absolute path to the migrations directory
 */
export async function listMigrations(
  migrationsDir: string
): Promise<MigrationDescriptor[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(migrationsDir);
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }

  const descriptors: MigrationDescriptor[] = [];
  for (const entry of entries) {
    const descriptor = parseMigrationFilename(entry);
    if (descriptor) {
      descriptors.push(descriptor);
    }
  }

  return descriptors.sort((a, b) => a.from.localeCompare(b.from));
}

/**
 * Builds a directed adjacency list from version to version,
 * keyed by "from" version, with edges pointing to "to" versions.
 *
 * @param migrations - Array of migration descriptors
 */
export function buildMigrationGraph(
  migrations: MigrationDescriptor[]
): Map<string, MigrationDescriptor[]> {
  const graph = new Map<string, MigrationDescriptor[]>();
  for (const migration of migrations) {
    const existing = graph.get(migration.from);
    if (existing) {
      existing.push(migration);
    } else {
      graph.set(migration.from, [migration]);
    }
  }
  return graph;
}

/**
 * Finds the shortest migration path from one version to another using BFS.
 * Returns the ordered list of migration descriptors, or undefined if no path exists.
 *
 * @param migrations - All available migration descriptors
 * @param fromVersion - Starting version
 * @param toVersion - Target version
 */
export function findMigrationPath(
  migrations: MigrationDescriptor[],
  fromVersion: string,
  toVersion: string
): MigrationDescriptor[] | undefined {
  if (fromVersion === toVersion) {
    return [];
  }

  const graph = buildMigrationGraph(migrations);

  // BFS
  const queue: Array<{ version: string; path: MigrationDescriptor[] }> = [
    { version: fromVersion, path: [] },
  ];
  const visited = new Set<string>([fromVersion]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = graph.get(current.version) ?? [];

    for (const edge of neighbors) {
      if (edge.to === toVersion) {
        return [...current.path, edge];
      }
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        queue.push({
          version: edge.to,
          path: [...current.path, edge],
        });
      }
    }
  }

  return undefined;
}

/**
 * Full migration resolution flow: lists migrations from a package directory,
 * finds the shortest path, and returns the migration descriptors with their
 * file contents loaded.
 *
 * @param packageDir - Absolute path to the plugin package directory (containing migrations/ subdir)
 * @param fromVersion - Current installed version
 * @param toVersion - Target version to migrate to
 * @returns Array of objects with descriptor and content, or undefined if no path exists
 */
export async function resolveMigrationChain(
  packageDir: string,
  fromVersion: string,
  toVersion: string
): Promise<Array<{ descriptor: MigrationDescriptor; content: string }> | undefined> {
  const migrationsDir = path.join(packageDir, "migrations");
  const allMigrations = await listMigrations(migrationsDir);
  const migrationPath = findMigrationPath(
    allMigrations,
    fromVersion,
    toVersion
  );

  if (!migrationPath) {
    return undefined;
  }

  const results: Array<{ descriptor: MigrationDescriptor; content: string }> = [];
  for (const descriptor of migrationPath) {
    const filePath = path.join(migrationsDir, descriptor.file);
    const content = await fs.readFile(filePath, "utf8");
    results.push({ descriptor, content });
  }

  return results;
}
