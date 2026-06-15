/**
 * Individual health check implementations.
 * Extracted from health.ts for max-lines compliance.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import type { HealthCheck } from "../health";
import { resolveRunsDir } from "../../../config";

// ============================================================================
// Version Utilities
// ============================================================================

async function readCliVersion(): Promise<string> {
  const candidatePaths = [
    path.join(__dirname, "..", "..", "..", "package.json"),
    path.join(__dirname, "..", "..", "..", "..", "package.json"),
  ];
  for (const packagePath of candidatePaths) {
    try {
      const raw = await fs.readFile(packagePath, "utf8");
      const parsed = JSON.parse(raw) as { version?: string };
      return parsed.version ?? "unknown";
    } catch {
      // try the next candidate
    }
  }
  return "unknown";
}

function parseVersion(version: string): { major: number; minor: number; patch: number } | null {
  const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

// ============================================================================
// Individual Health Checks
// ============================================================================

export async function checkSdkVersion(): Promise<HealthCheck> {
  const version = await readCliVersion();

  if (version === "unknown") {
    return {
      name: "sdk-version",
      description: "SDK CLI version is accessible",
      status: "fail",
      message: "Unable to read SDK version from package.json",
      nextSteps: [
        "Ensure @a5c-ai/babysitter-sdk is properly installed",
        "Run: npm install @a5c-ai/babysitter-sdk",
      ],
    };
  }

  return {
    name: "sdk-version",
    description: "SDK CLI version is accessible",
    status: "pass",
    message: `SDK version ${version}`,
    details: { version },
  };
}

export function checkNodeVersion(): HealthCheck {
  const nodeVersion = process.version;
  const parsed = parseVersion(nodeVersion);

  if (!parsed) {
    return {
      name: "node-version",
      description: "Node.js version is compatible (>=18)",
      status: "warn",
      message: `Unable to parse Node.js version: ${nodeVersion}`,
      nextSteps: ["Verify Node.js is properly installed"],
      details: { version: nodeVersion },
    };
  }

  const minMajor = 18;
  if (parsed.major < minMajor) {
    return {
      name: "node-version",
      description: "Node.js version is compatible (>=18)",
      status: "fail",
      message: `Node.js ${nodeVersion} is below minimum required version (v${minMajor}.0.0)`,
      nextSteps: [
        `Upgrade Node.js to version ${minMajor} or higher`,
        "Visit https://nodejs.org to download the latest LTS version",
        "Consider using nvm or fnm for version management",
      ],
      details: { version: nodeVersion, required: `>=${minMajor}.0.0` },
    };
  }

  return {
    name: "node-version",
    description: "Node.js version is compatible (>=18)",
    status: "pass",
    message: `Node.js ${nodeVersion}`,
    details: { version: nodeVersion, major: parsed.major },
  };
}

export async function checkA5cDirectory(cwd: string): Promise<HealthCheck> {
  const a5cDir = path.join(cwd, ".a5c");
  const runsDir = resolveRunsDir({ cwd });

  try {
    const stats = await fs.stat(a5cDir);
    if (!stats.isDirectory()) {
      return {
        name: "a5c-directory",
        description: ".a5c directory exists and is writable",
        status: "fail",
        message: `.a5c exists but is not a directory at ${a5cDir}`,
        nextSteps: [
          "Remove the .a5c file and let the SDK create the directory",
          "Or run: rm .a5c && mkdir -p .a5c",
        ],
        details: { path: a5cDir, isDirectory: false },
      };
    }

    const testFile = path.join(a5cDir, ".health-check-test");
    try {
      await fs.writeFile(testFile, "test", "utf8");
      await fs.unlink(testFile);
    } catch (_writeError) {
      return {
        name: "a5c-directory",
        description: ".a5c directory exists and is writable",
        status: "fail",
        message: `.a5c directory exists but is not writable at ${a5cDir}`,
        nextSteps: [
          "Check file permissions on the .a5c directory",
          "Run: chmod 755 .a5c",
        ],
        details: { path: a5cDir, writable: false },
      };
    }

    let runsExists = false;
    try {
      const runsStats = await fs.stat(runsDir);
      runsExists = runsStats.isDirectory();
    } catch {
      // runs dir doesn't exist yet, that's okay
    }

    return {
      name: "a5c-directory",
      description: ".a5c directory exists and is writable",
      status: "pass",
        message: `.a5c directory is ready at ${a5cDir}`,
        details: { path: a5cDir, runsDir, runsExists, writable: true },
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return {
        name: "a5c-directory",
        description: ".a5c directory exists and is writable",
        status: "warn",
        message: `.a5c directory does not exist at ${a5cDir}`,
        nextSteps: [
          "The directory will be created automatically when running babysitter commands",
          "Or create it manually: mkdir -p .a5c",
        ],
        details: { path: a5cDir, exists: false },
      };
    }

    return {
      name: "a5c-directory",
      description: ".a5c directory exists and is writable",
      status: "fail",
      message: `Error accessing .a5c directory: ${err.message}`,
      nextSteps: ["Check file system permissions and disk space"],
      details: { path: a5cDir, error: err.message },
    };
  }
}

export async function checkPackageDependency(cwd: string): Promise<HealthCheck> {
  const packagePath = path.join(cwd, "package.json");

  try {
    const raw = await fs.readFile(packagePath, "utf8");
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };

    const depVersion = pkg.dependencies?.["@a5c-ai/babysitter-sdk"];
    const devDepVersion = pkg.devDependencies?.["@a5c-ai/babysitter-sdk"];
    const version = depVersion || devDepVersion;
    const location = depVersion ? "dependencies" : devDepVersion ? "devDependencies" : null;

    if (version) {
      return {
        name: "package-dependency",
        description: "Project has babysitter-sdk dependency",
        status: "pass",
        message: `@a5c-ai/babysitter-sdk@${version} found in ${location}`,
        details: { version, location, packagePath },
      };
    }

    return {
      name: "package-dependency",
      description: "Project has babysitter-sdk dependency",
      status: "warn",
      message: "@a5c-ai/babysitter-sdk not found in package.json",
      nextSteps: [
        "Add the dependency: npm install @a5c-ai/babysitter-sdk",
        "Or if this is not a babysitter project, this warning can be ignored",
      ],
      details: { packagePath, found: false },
    };
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === "ENOENT") {
      return {
        name: "package-dependency",
        description: "Project has babysitter-sdk dependency",
        status: "warn",
        message: "No package.json found in current directory",
        nextSteps: [
          "If this is a Node.js project, run: npm init -y",
          "If not in a project directory, this warning can be ignored",
        ],
        details: { packagePath, exists: false },
      };
    }

    return {
      name: "package-dependency",
      description: "Project has babysitter-sdk dependency",
      status: "warn",
      message: `Error reading package.json: ${err.message}`,
      details: { packagePath, error: err.message },
    };
  }
}
