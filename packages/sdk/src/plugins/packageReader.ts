/**
 * Plugin Package Reader
 *
 * Reads plugin package contents including instruction files,
 * migration descriptors, and process definition files.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  MigrationDescriptor,
  PluginPackageInfo,
  isNodeError,
} from "./types";
import { listMigrations as listMigrationsFromDir } from "./migrations";

/**
 * Standard instruction file names within a plugin package.
 */
const INSTALL_FILE = "install.md";
const UNINSTALL_FILE = "uninstall.md";
const CONFIGURE_FILE = "configure.md";
const MIGRATIONS_DIR = "migrations";
const PROCESS_DIR = "process";

/**
 * Reads a text file, returning undefined if the file does not exist.
 */
async function readOptionalFile(filePath: string): Promise<string | undefined> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return undefined;
    }
    throw error;
  }
}

/**
 * Recursively collects all files under a directory, returning paths
 * relative to the given base directory.
 */
async function collectFiles(dir: string, base: string): Promise<string[]> {
  const results: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const nested = await collectFiles(fullPath, base);
        results.push(...nested);
      } else {
        results.push(path.relative(base, fullPath).replace(/\\/g, "/"));
      }
    }
  } catch (error: unknown) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
  return results.sort();
}

/**
 * Reads all metadata and instruction files from a plugin package directory.
 *
 * @param packageDir - Absolute path to the plugin package directory
 */
export async function readPluginPackage(
  packageDir: string
): Promise<PluginPackageInfo> {
  // Read package.json or plugin.json for the name
  let name = path.basename(packageDir);
  try {
    const pkgRaw = await fs.readFile(
      path.join(packageDir, "package.json"),
      "utf8"
    );
    const pkg = JSON.parse(pkgRaw) as Record<string, unknown>;
    if (typeof pkg.name === "string") {
      name = pkg.name;
    }
  } catch {
    // No package.json is acceptable; use directory name
  }

  const [installInstructions, uninstallInstructions, configureInstructions, migrations, processFiles] =
    await Promise.all([
      readInstallInstructions(packageDir),
      readUninstallInstructions(packageDir),
      readConfigureInstructions(packageDir),
      listMigrations(packageDir),
      collectFiles(path.join(packageDir, PROCESS_DIR), packageDir),
    ]);

  return {
    name,
    installInstructions,
    uninstallInstructions,
    configureInstructions,
    migrations,
    processFiles,
  };
}

/**
 * Reads the install instructions markdown file from a plugin package.
 *
 * @param packageDir - Absolute path to the plugin package directory
 */
export async function readInstallInstructions(
  packageDir: string
): Promise<string | undefined> {
  return readOptionalFile(path.join(packageDir, INSTALL_FILE));
}

/**
 * Reads the uninstall instructions markdown file from a plugin package.
 *
 * @param packageDir - Absolute path to the plugin package directory
 */
export async function readUninstallInstructions(
  packageDir: string
): Promise<string | undefined> {
  return readOptionalFile(path.join(packageDir, UNINSTALL_FILE));
}

/**
 * Reads the configure instructions markdown file from a plugin package.
 *
 * @param packageDir - Absolute path to the plugin package directory
 */
export async function readConfigureInstructions(
  packageDir: string
): Promise<string | undefined> {
  return readOptionalFile(path.join(packageDir, CONFIGURE_FILE));
}

/**
 * Lists all migration descriptors found in the migrations/ subdirectory.
 * Filenames must follow the pattern: `<from>_to_<to>.<ext>`
 *
 * @param packageDir - Absolute path to the plugin package directory
 */
export async function listMigrations(
  packageDir: string
): Promise<MigrationDescriptor[]> {
  return listMigrationsFromDir(path.join(packageDir, MIGRATIONS_DIR));
}

/**
 * Reads the content of a specific migration file.
 *
 * @param packageDir - Absolute path to the plugin package directory
 * @param from - Source version
 * @param to - Target version
 */
export async function readMigration(
  packageDir: string,
  from: string,
  to: string
): Promise<string> {
  const migrationsDir = path.join(packageDir, MIGRATIONS_DIR);
  const descriptors = await listMigrationsFromDir(migrationsDir);
  const match = descriptors.find((d) => d.from === from && d.to === to);
  if (!match) {
    throw new Error(
      `Migration from "${from}" to "${to}" not found in ${migrationsDir}`
    );
  }
  return fs.readFile(path.join(migrationsDir, match.file), "utf8");
}
