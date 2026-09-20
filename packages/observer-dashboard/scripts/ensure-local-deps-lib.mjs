/**
 * Core logic for ensure-local-deps.mjs, split out so it can be unit-tested
 * (the entry script wires in the real `npm run build -w <name>` exec).
 */
import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Written into a package's dist/ ONLY after its build exited 0 and the dist
 * entry file exists. Skipping a rebuild requires BOTH the entry file and this
 * marker: `tsc` emits output files even when it exits nonzero (noEmitOnError
 * defaults to false), so entry-file existence alone cannot distinguish a good
 * dist from the partial output of a failed or interrupted build.
 */
export const BUILD_OK_MARKER = ".ensure-local-deps-build-ok";

/**
 * Ensure one workspace package's dist is present and trustworthy.
 *
 * - entry + marker present  -> skip (marker proves a build that exited 0)
 * - entry without marker    -> rebuild once (stale round-4 dist, a manual
 *                              repo-root build, or a failed/interrupted build);
 *                              the marker written afterwards makes later runs skip
 * - entry missing           -> build
 * - build exits nonzero     -> remove dist/ entirely (a partial dist must never
 *                              satisfy the next run's check), then throw
 *
 * @param {{ name: string, dir: string, exec: (name: string) => void, log?: (msg: string) => void }} opts
 * @returns {"skipped" | "built"}
 */
export function ensureWorkspaceDist({ name, dir, exec, log = console.log }) {
  const distDir = join(dir, "dist");
  // The dist entry file is each package's `main` (dist/index.js for all three).
  const entry = join(distDir, "index.js");
  const marker = join(distDir, BUILD_OK_MARKER);

  if (existsSync(entry) && existsSync(marker)) {
    log(
      `[ensure-local-deps] ${name}: dist entry + build-ok marker present, skipping build (delete ${distDir} to force a rebuild)`,
    );
    return "skipped";
  }

  if (existsSync(entry)) {
    log(
      `[ensure-local-deps] ${name}: dist entry present WITHOUT build-ok marker (possibly stale, or emitted by a failed/interrupted build) — rebuilding`,
    );
  } else {
    log(`[ensure-local-deps] ${name}: dist entry missing, building...`);
  }

  try {
    exec(name);
  } catch (err) {
    rmSync(distDir, { recursive: true, force: true });
    throw new Error(
      `[ensure-local-deps] ${name}: build exited nonzero; removed ${distDir} so its partial ` +
        `output cannot satisfy the next run. Fix the dependency build ` +
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

  writeFileSync(
    marker,
    "Written by packages/observer-dashboard/scripts/ensure-local-deps.mjs after a build that exited 0.\n",
  );
  return "built";
}
