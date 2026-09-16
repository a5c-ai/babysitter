#!/usr/bin/env node

/**
 * CLI entry point for the babysitter observer dashboard.
 *
 * Parses command-line flags, maps them to environment variables,
 * then execs into `next dev` or `next start`.
 *
 * Usage:
 *   npx ts-node src/cli.ts --port 4800 --watch-dir /tmp/runs --poll-interval 5000 --theme light
 *   npx ts-node src/cli.ts --production --port 4800
 */

import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import https from "https";

interface CliOptions {
  port?: string;
  watchDir?: string;
  pollInterval?: string;
  theme?: string;
  dev?: boolean;
  help?: boolean;
  version?: boolean;
}

// Injected at build time by esbuild define. Falls back to reading package.json
// at runtime for development (ts-node) usage.
declare const __CLI_VERSION__: string | undefined;

function getVersion(): string {
  if (typeof __CLI_VERSION__ !== "undefined") {
    return __CLI_VERSION__;
  }
  try {
    const pkgPath = resolve(__dirname, "..", "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    return pkg.version || "unknown";
  } catch {
    return "unknown";
  }
}

function printUsage(): void {
  const usage = `
babysitter-observer-dashboard — CLI for the observer dashboard

Usage:
  observer [options]

Options:
  --port <number>           Port to listen on (default: 4800)
  --watch-dir <path>        Directory to watch for .a5c/runs (default: cwd)
  --poll-interval <ms>      Polling interval in milliseconds (default: 2000)
  --theme <dark|light>      Default UI theme (default: dark)
  --dev                     Run in dev mode (next dev) instead of production
  --version, -v             Show version number
  --help                    Show this help message

Environment variable mapping:
  --port           -> OBSERVER_PORT
  --watch-dir      -> OBSERVER_WATCH_DIR
  --poll-interval  -> OBSERVER_POLL_INTERVAL
  --theme          -> OBSERVER_DEFAULT_THEME

Examples:
  # Start dashboard on port 3002 watching a specific directory
  observer --port 3002 --watch-dir /home/user/projects

  # Start with light theme
  observer --theme light
`.trim();

  console.log(usage);
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {};
  // Skip first two entries: node binary and script path
  const args = argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--port":
        i++;
        opts.port = args[i];
        if (!opts.port || isNaN(Number(opts.port))) {
          console.error("Error: --port requires a numeric value");
          process.exit(1);
        }
        break;

      case "--watch-dir":
        i++;
        opts.watchDir = args[i];
        if (!opts.watchDir) {
          console.error("Error: --watch-dir requires a path value");
          process.exit(1);
        }
        break;

      case "--poll-interval":
        i++;
        opts.pollInterval = args[i];
        if (!opts.pollInterval || isNaN(Number(opts.pollInterval))) {
          console.error("Error: --poll-interval requires a numeric value (ms)");
          process.exit(1);
        }
        break;

      case "--theme":
        i++;
        opts.theme = args[i];
        if (opts.theme !== "dark" && opts.theme !== "light") {
          console.error('Error: --theme must be "dark" or "light"');
          process.exit(1);
        }
        break;

      case "--dev":
        opts.dev = true;
        break;

      case "--production":
        // Legacy flag — production is now the default, so this is a no-op
        break;

      case "--version":
      case "-v":
        opts.version = true;
        break;

      case "--help":
      case "-h":
        opts.help = true;
        break;

      default:
        console.error(`Unknown flag: ${arg}`);
        console.error('Run with --help for usage information.');
        process.exit(1);
    }
  }

  return opts;
}

/**
 * Locate the `next` binary across all installation scenarios.
 *
 * npm may hoist dependencies to a parent node_modules (e.g. when this
 * package is installed via npx or as a dependency of another project).
 * We try several strategies before giving up:
 *
 *   1. require.resolve — honours Node's module resolution & hoisting
 *   2. Local node_modules/.bin — classic non-hoisted layout
 *   3. Walk up the directory tree — covers deep-nested workspaces
 *   4. Bare "next" — last resort, assumes it is on $PATH
 */
function findNextBin(): string {
  const projectRoot = resolve(__dirname, "..");

  // Method 1: Use require.resolve to find next's package.json (handles hoisting).
  // We derive the .bin/next wrapper path (not dist/bin/next) because the wrapper
  // is cross-platform: on Unix it has a shebang, on Windows there is a .cmd peer.
  try {
    const nextPkgPath = require.resolve("next/package.json", {
      paths: [projectRoot],
    });
    // nextPkgPath => .../node_modules/next/package.json
    // Go up to the containing node_modules directory, then into .bin
    const nodeModulesDir = resolve(nextPkgPath, "..", "..");
    const binPath = resolve(nodeModulesDir, ".bin", "next");
    if (existsSync(binPath) || existsSync(binPath + ".cmd")) {
      return binPath;
    }
  } catch {
    // next is not resolvable from projectRoot — continue to fallbacks
  }

  // Method 2: Check the local node_modules/.bin (non-hoisted layout)
  const localBin = resolve(projectRoot, "node_modules", ".bin", "next");
  if (existsSync(localBin)) {
    return localBin;
  }

  // Method 3: Walk up the directory tree looking for node_modules/.bin/next
  let current = projectRoot;
  while (true) {
    const candidate = resolve(current, "node_modules", ".bin", "next");
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = resolve(current, "..");
    if (parent === current) {
      break; // reached filesystem root
    }
    current = parent;
  }

  // Method 4: Fall back to bare "next" and hope it is on PATH
  return "next";
}

/**
 * Check npm registry for a newer version and print an update notice.
 * Non-blocking — fires and forgets so it never delays startup.
 */
function checkForUpdate(currentVersion: string): void {
  if (currentVersion === "unknown") return;

  const url =
    "https://registry.npmjs.org/@a5c-ai/babysitter-observer-dashboard/latest";

  const req = https.get(url, { timeout: 3000 }, (res) => {
    let data = "";
    res.on("data", (chunk: Buffer) => {
      data += chunk;
    });
    res.on("end", () => {
      try {
        const latest = JSON.parse(data).version as string;
        if (latest && latest !== currentVersion) {
          console.log(
            `\n  Update available: ${currentVersion} → ${latest}` +
              `\n  Run: npm i -g @a5c-ai/babysitter-observer-dashboard@latest\n`
          );
        }
      } catch {
        // Silently ignore parse errors
      }
    });
  });

  req.on("error", () => {
    // Silently ignore network errors — update check is best-effort
  });

  req.end();
}

function main(): void {
  const opts = parseArgs(process.argv);

  if (opts.version) {
    console.log(`babysitter-observer-dashboard v${getVersion()}`);
    process.exit(0);
  }

  if (opts.help) {
    printUsage();
    process.exit(0);
  }

  // Non-blocking update check
  checkForUpdate(getVersion());

  // Map CLI flags to environment variables
  if (opts.port) {
    process.env.OBSERVER_PORT = opts.port;
  }

  // Default watch directory to the user's cwd (not the package root, which is
  // where Next.js will run). Without this, the config falls back to
  // process.cwd() inside the Next.js process, which points at the package
  // root — useless for npx / global installs.
  process.env.OBSERVER_WATCH_DIR = opts.watchDir || process.cwd();

  if (opts.pollInterval) {
    process.env.OBSERVER_POLL_INTERVAL = opts.pollInterval;
  }

  if (opts.theme) {
    process.env.OBSERVER_DEFAULT_THEME = opts.theme;
  }

  // Determine the Next.js command — use local binary for global installs
  const port = opts.port || process.env.OBSERVER_PORT || "4800";
  const nextBin = findNextBin();
  const nextCmd = opts.dev
    ? `"${nextBin}" dev --port ${port}`
    : `"${nextBin}" start --port ${port}`;

  console.log(`Starting observer: ${nextCmd}`);

  if (opts.watchDir) {
    console.log(`  Watch directory: ${opts.watchDir}`);
  }
  if (opts.pollInterval) {
    console.log(`  Poll interval: ${opts.pollInterval}ms`);
  }
  if (opts.theme) {
    console.log(`  Theme: ${opts.theme}`);
  }

  try {
    execSync(nextCmd, {
      env: process.env,
      stdio: "inherit",
      cwd: resolve(__dirname, ".."),
    });
  } catch {
    // next dev exits with non-zero on SIGINT/SIGTERM — that is normal
    process.exit(0);
  }
}

main();
