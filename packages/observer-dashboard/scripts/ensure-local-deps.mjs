/**
 * Ensures the workspace dists the tests need are built: the
 * approve-breakpoint tests run the REAL @a5c-ai/babysitter-sdk commit path,
 * which needs the SDK dist (and its workspace deps' dists) to exist on a
 * fresh clone.
 *
 * NOTE: this script used to also copy React 18 + @radix-ui/@testing-library
 * packages into the local node_modules to shield the workspace from the
 * monorepo root's hoisted React 19. Since the Next 15 / React 19 upgrade the
 * workspace shares the root's React 19, so that copy machinery is gone — it
 * would now CREATE the duplicate-React problem it was built to prevent
 * (two React instances break context identity in tests and in `next build`
 * prerendering).
 */
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgDir = resolve(__dirname, "..");
const rootDir = resolve(pkgDir, "../..");

// ---------------------------------------------------------------------------
// Workspace dists the tests need (reproducible `npm test` on a fresh clone).
//
// The approve-breakpoint action tests exercise the REAL SDK commit path
// (@a5c-ai/babysitter-sdk dist/runtime/commitEffectResult), so the SDK dist —
// and the dists of the workspace packages it resolves at runtime — must exist.
// Build each one individually only when its dist entry file is missing.
// Ordered by dependency: atlas → tasks-adapter → sdk.
// ---------------------------------------------------------------------------
const workspaceDists = [
  { name: "@a5c-ai/atlas", dir: join(rootDir, "packages", "atlas") },
  { name: "@a5c-ai/tasks-adapter", dir: join(rootDir, "packages", "adapters", "tasks") },
  { name: "@a5c-ai/babysitter-sdk", dir: join(rootDir, "packages", "babysitter-sdk") },
];

for (const { name, dir } of workspaceDists) {
  // The dist entry file is each package's `main` (dist/index.js for all three).
  const entry = join(dir, "dist", "index.js");
  if (existsSync(entry)) {
    // Loud skip (review round 4): a pre-existing dist is trusted as-is — it is
    // NOT validated for freshness against the package sources. Delete the dist
    // (or run "npm run build -w <name>" from the repo root) to force a rebuild.
    console.log(
      `[ensure-local-deps] ${name}: dist entry present, SKIPPING build — freshness not validated (delete ${join(dir, "dist")} to force a rebuild)`,
    );
    continue;
  }

  console.log(`[ensure-local-deps] ${name}: dist entry missing, building...`);
  try {
    execSync(`npm run build -w ${name}`, { cwd: rootDir, stdio: "inherit" });
  } catch (err) {
    // Fail HARD (review round 4): a nonzero dependency build must never be
    // hidden — tolerating it can mask real dependency build breakage (e.g.
    // TypeScript errors) behind a stale or partially-emitted dist.
    throw new Error(
      `[ensure-local-deps] ${name}: build exited nonzero. Fix the dependency build ` +
        `(run "npm run build -w ${name}" from the repo root and inspect its output). ` +
        `Original error: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (!existsSync(entry)) {
    throw new Error(
      `[ensure-local-deps] ${name}: dist entry still missing after build (${entry}). ` +
        `Run "npm run build -w ${name}" from the repo root and inspect its output.`,
    );
  }
}
