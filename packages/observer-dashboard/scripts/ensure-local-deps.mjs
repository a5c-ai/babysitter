/**
 * Ensures React 18 dependencies are locally installed in observer-dashboard's
 * node_modules to prevent version conflicts with the monorepo root (which may
 * hoist React 19 from the catalog workspace).
 *
 * Needed because observer-dashboard uses React 18 while packages/catalog uses
 * React 19. npm hoists React 19 to root, so @testing-library/react and
 * @radix-ui packages resolve the wrong React version during tests.
 *
 * Also ensures the workspace dists the tests need are built (see the
 * workspace-dist section at the bottom): the approve-breakpoint tests run the
 * REAL @a5c-ai/babysitter-sdk commit path, which needs the SDK dist (and its
 * workspace deps' dists) to exist on a fresh clone.
 */
import { existsSync, cpSync, mkdirSync, readdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve, dirname, basename, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgDir = resolve(__dirname, "..");
const rootDir = resolve(pkgDir, "../..");
const localNm = join(pkgDir, "node_modules");

function copyIfMissing(pkg) {
  const src = join(rootDir, "node_modules", pkg);
  const dst = join(localNm, pkg);
  if (existsSync(src) && !existsSync(dst)) {
    mkdirSync(dirname(dst), { recursive: true });
    cpSync(src, dst, { recursive: true });
  }
}

// @testing-library packages
for (const pkg of [
  "@testing-library/react",
  "@testing-library/dom",
  "@testing-library/jest-dom",
  "@testing-library/user-event",
]) {
  copyIfMissing(pkg);
}

// @radix-ui packages
const radixDir = join(rootDir, "node_modules", "@radix-ui");
if (existsSync(radixDir)) {
  for (const entry of readdirSync(radixDir)) {
    copyIfMissing(`@radix-ui/${entry}`);
  }
}

// @floating-ui packages (used by @radix-ui/react-tooltip)
for (const pkg of [
  "@floating-ui/react-dom",
  "@floating-ui/dom",
  "@floating-ui/core",
  "@floating-ui/utils",
]) {
  copyIfMissing(pkg);
}

// @tanstack packages (react-virtual uses React hooks)
const tanstackDir = join(rootDir, "node_modules", "@tanstack");
if (existsSync(tanstackDir)) {
  for (const entry of readdirSync(tanstackDir)) {
    copyIfMissing(`@tanstack/${entry}`);
  }
}

// React runtime packages and other React-dependent packages
for (const pkg of [
  "react",
  "react-dom",
  "react-remove-scroll",
  "react-remove-scroll-bar",
  "react-style-singleton",
  "aria-hidden",
  "use-callback-ref",
  "use-sidecar",
  "get-nonce",
  "class-variance-authority",
]) {
  copyIfMissing(pkg);
}

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
  if (existsSync(entry)) continue;

  console.log(`[ensure-local-deps] ${name}: dist entry missing, building...`);
  try {
    execSync(`npm run build -w ${name}`, { cwd: rootDir, stdio: "inherit" });
  } catch {
    // Tolerated: under filtered installs the tasks-adapter's tsc can exit
    // nonzero (its @types/express devDep may be absent) while still emitting
    // JS. The hard gate is the dist entry file existing afterward.
    console.warn(`[ensure-local-deps] ${name}: build exited nonzero (tolerated if the dist emitted)`);
  }

  if (!existsSync(entry)) {
    throw new Error(
      `[ensure-local-deps] ${name}: dist entry still missing after build (${entry}). ` +
        `Run "npm run build -w ${name}" from the repo root and inspect its output.`,
    );
  }
}
