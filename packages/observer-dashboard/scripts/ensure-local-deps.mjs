/**
 * Ensures the workspace dists the tests need are built: the
 * approve-breakpoint tests run the REAL @a5c-ai/babysitter-sdk commit path,
 * which needs the SDK dist (and its workspace deps' dists) to exist on a
 * fresh clone.
 *
 * Reproducibility contract (review round 5): the observer gates must be green
 * from a CLEAN workspace-scoped install (`npm ci --ignore-scripts --workspace
 * @a5c-ai/babysitter-observer-dashboard`). @a5c-ai/tasks-adapter's build
 * imports Express types (src/auth/middleware.ts) but no workspace declares
 * @types/express — a full monorepo install only works because
 * @docusaurus/core→webpack-dev-server hoists it transitively, and a
 * workspace-scoped install does not include that chain. This package therefore
 * declares @types/express as a devDependency so the hoisted install always
 * satisfies the tasks-adapter build this script performs.
 *
 * Skip/rebuild semantics live in ensure-local-deps-lib.mjs (unit-tested):
 * a pre-existing dist is trusted only alongside the build-ok marker written
 * after a build that exited 0; a failed build removes its partial dist so it
 * can never satisfy the next run.
 *
 * NOTE: this script used to also copy React 18 + @radix-ui/@testing-library
 * packages into the local node_modules to shield the workspace from the
 * monorepo root's hoisted React 19. Since the Next 15 / React 19 upgrade the
 * workspace shares the root's React 19, so that copy machinery is gone — it
 * would now CREATE the duplicate-React problem it was built to prevent
 * (two React instances break context identity in tests and in `next build`
 * prerendering).
 */
import { execSync } from "node:child_process";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ensureWorkspaceDist } from "./ensure-local-deps-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgDir = resolve(__dirname, "..");
const rootDir = resolve(pkgDir, "../..");

// ---------------------------------------------------------------------------
// Workspace dists the tests need (reproducible `npm test` on a fresh clone).
//
// The approve-breakpoint action tests exercise the REAL SDK commit path
// (@a5c-ai/babysitter-sdk dist/runtime/commitEffectResult), so the SDK dist —
// and the dists of the workspace packages it resolves at runtime — must exist.
// Ordered by dependency: atlas → tasks-adapter → sdk.
// ---------------------------------------------------------------------------
const workspaceDists = [
  { name: "@a5c-ai/atlas", dir: join(rootDir, "packages", "atlas") },
  { name: "@a5c-ai/tasks-adapter", dir: join(rootDir, "packages", "adapters", "tasks") },
  { name: "@a5c-ai/babysitter-sdk", dir: join(rootDir, "packages", "babysitter-sdk") },
];

for (const { name, dir } of workspaceDists) {
  ensureWorkspaceDist({
    name,
    dir,
    exec: (pkgName) => execSync(`npm run build -w ${pkgName}`, { cwd: rootDir, stdio: "inherit" }),
  });
}
