/**
 * temp-dir-sweep.ts — vitest global setup (wired via `test.setupFiles` in vitest.config.ts).
 *
 * D-38 item 5 (suite-level sweep half): `Substrate.createTemp()` provisions a real `os.tmpdir()`
 * `kip-sdk-*` dir per bare `new KipRepo()`. `KipRepo.close()` now eagerly removes its own temp dir,
 * but the construction path most conformance tests use (`new KipRepo()` with no `close()`) would
 * otherwise leak its temp dir for the life of the worker process — the leak that twice exhausted the
 * host `C:` drive (0 bytes free → spurious ENOSPC). This `afterEach` removes every still-present
 * `createTemp()`-tracked dir in THIS worker after each test, keeping the shared `os.tmpdir()`
 * population bounded even under parallel load — the D-38 "suggested fix (5) … and/or add a suite-level
 * sweep of its own `kip-sdk-*` dirs" half, complementing the eager `close()` cleanup.
 *
 * IMPORTANT: this file reads the created-temp-dir registry directly off `globalThis` and does NOT
 * import `substrate.ts`. Importing substrate here would pre-cache substrate's own `node:fs` binding at
 * worker-init (before any test file's `vi.mock("node:fs", …)` applies), which would defeat the fs mock
 * in round6-tip-persistence-crash-safety.test.ts (its `writeFileSync` spy would no longer intercept).
 * substrate.ts publishes tracked dirs onto the SAME `globalThis[TEMP_DIR_REGISTRY_KEY]` set, so this
 * teardown stays fully decoupled from it. For a file that never creates a bare `createTemp()` repo the
 * set is empty and this is a pure no-op (no `fs` call at all).
 *
 * Safe because no test reuses a bare (no-`dir`) `KipRepo` across `it`s via a before-hook (only the two
 * e2e files use before-hooks, and those drive a subprocess against an explicit `--dir`), so sweeping
 * per-test never deletes a substrate a later test still needs.
 */
import * as fs from "node:fs";
import { afterEach } from "vitest";

const TEMP_DIR_REGISTRY_KEY = "__kipCreatedTempDirs";

afterEach(() => {
  const registry = (globalThis as { [TEMP_DIR_REGISTRY_KEY]?: Set<string> })[TEMP_DIR_REGISTRY_KEY];
  if (!registry) return;
  for (const dir of registry) {
    fs.rmSync(dir, { recursive: true, force: true });
    registry.delete(dir);
  }
});
