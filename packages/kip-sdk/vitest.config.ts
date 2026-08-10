import { cpus } from "node:os";
import { defineConfig } from "vitest/config";

/**
 * Cap fork concurrency for the fs-heavy conformance suite. The git-substrate tests are I/O-bound, so
 * oversubscribing a big box's cores (24 on the dev machine) just multiplies fs contention — the root of
 * the old 5000ms-timeout flake (a DIFFERENT slow git-substrate test blowing the default timeout each run
 * under parallel load, not a logic bug). `min(4, cpus)` caps big boxes at 4 while NEVER oversubscribing a
 * small CI runner (2-core ubuntu/windows-latest keep their natural 2), keeping the timeout headroom
 * deterministic without slowing CI. Applied to the `unit` project below. NOTE: this cap is NOT relied on
 * by any assertion — temp-dir-hygiene.test.ts's secondary check was reworked to read only its OWN unique
 * `kip-sdk-*` basenames (parallelism-independent), so it holds at any fork count; the cap is purely a
 * contention/timeout lever.
 */
const UNIT_MAX_WORKERS = Math.max(1, Math.min(4, cpus().length));

/**
 * The three test files that BUILD/CLEAN the shared `dist/` and SPAWN the shipped binaries
 * (`node dist/cli/kip.js`, `node dist/mcp/server.js`) or read the bundled dist manifest. They mutate a
 * SINGLE shared resource — `packages/kip-sdk/dist` — so running them in PARALLEL forks corrupts each
 * other: e2e-cli's cold-build test `rm -rf dist`s while e2e-mcp is mid-spawn (⇒ the server can't load ⇒
 * a missing JSON-RPC response frame ⇒ `frameById` undefined), and two `npm run build`/`tsc` writing the
 * same `dist` concurrently throw EPERM/EBUSY on Windows (⇒ a `beforeAll` build throws ⇒ a whole file's
 * tests report as "skipped"). They are quarantined into their OWN project below with
 * `fileParallelism: false`, so they run one-at-a-time (never concurrently with each other), while the
 * other ~87 files — none of which touch `dist` — keep running fully in parallel. This is the
 * `suite-hardening` fix for the e2e subprocess-IPC flake; it weakens no assertion.
 */
const DIST_SERIAL_FILES = [
  "src/__tests__/e2e-cli.test.ts",
  "src/__tests__/e2e-mcp.test.ts",
  "src/__tests__/graph-qa-live.test.ts",
];

const shared = {
  environment: "node" as const,
  // D-38 item 5 (suite-level sweep): remove leaked `Substrate.createTemp()` `kip-sdk-*` temp dirs
  // after each test so a bare `new KipRepo()` that never `close()`d cannot accumulate them and
  // exhaust the host disk. See src/__tests__/setup/temp-dir-sweep.ts.
  setupFiles: ["src/__tests__/setup/temp-dir-sweep.ts"],
  // D-38 item 4 (suite-hardening): the git-heavy conformance files (inv-12, m2-surface, and rotating
  // others) intermittently blew vitest's DEFAULT 5000ms testTimeout under parallel load — a DIFFERENT
  // slow git-substrate test each run, not a logic bug. The suite passes green at this 20000ms floor;
  // pin it so it can never silently regress to the flaky 5000 default. Guarded by
  // src/__tests__/test-timeout-config.test.ts (must stay >= 15000). Applies to BOTH projects below.
  testTimeout: 20000,
  passWithNoTests: true,
};

export default defineConfig({
  test: {
    ...shared,
    projects: [
      {
        // Everything EXCEPT the dist-mutating e2e files.
        test: {
          ...shared,
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: [...DIST_SERIAL_FILES, "**/node_modules/**", "**/dist/**"],
          // See UNIT_MAX_WORKERS above: cap fork concurrency to tame fs contention (the root of the old
          // timeout flake) without oversubscribing CI. No assertion depends on this cap.
          maxWorkers: UNIT_MAX_WORKERS,
          minWorkers: 1,
        },
      },
      {
        // The dist-mutating / binary-spawning e2e files — serialized so their shared-`dist` builds,
        // cleans, and spawns never overlap. `fileParallelism: false` runs these files one at a time.
        test: {
          ...shared,
          name: "e2e-dist-serial",
          include: DIST_SERIAL_FILES,
          fileParallelism: false,
        },
      },
    ],
  },
});
