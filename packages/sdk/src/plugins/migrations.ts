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
 * Regex for migration filenames: `<from>_to_<to>.<ext>`
 * Versions may contain digits, dots, dashes, and pre-release identifiers.
 *
 * Examples: "1.0.0_to_1.1.0.md", "2.0.0-beta_to_2.0.0.js"
 */
const MIGRATION_FILENAME_REGEX =
  /^([a-zA-Z0-9._-]+)_to_([a-zA-Z0-9._-]+)\.(md|js)$/;

/**
 * Parses a migration filename into its constituent version parts.
 * Returns undefined if the filename does not match the expected pattern.
 *
 * @param filename - The migration filename to parse
 */
export function parseMigrationFilename(
  filename: string
): MigrationDescriptor | undefined {
  const match = MIGRATION_FILENAME_REGEX.exec(filename);
  if (!match) {
    return undefined;
  }
  const [, from, to, ext] = match;
  return {
    from,
    to,
    file: filename,
    type: ext as "md" | "js",
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
