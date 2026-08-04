/**
 * Regression tests for the ensure-local-deps bootstrap (review round 5).
 *
 * F2 (stale-dist false green): a dependency build that exits nonzero still
 * emits dist files (tsc's noEmitOnError defaults to false), and the round-4
 * script trusted any pre-existing dist/index.js — so a red build could turn
 * green by rerunning in the same dirty worktree. The lib now only skips when
 * a build-ok marker (written after a build that exited 0) accompanies the
 * entry file, and removes the dist entirely when a build fails.
 *
 * F1 (clean-gate reproducibility): the bootstrap builds @a5c-ai/tasks-adapter,
 * whose auth middleware imports Express types. No workspace declares
 * @types/express (a full install only gets it hoisted transitively via
 * docusaurus→webpack-dev-server), so a clean `npm ci --ignore-scripts
 * --workspace @a5c-ai/babysitter-observer-dashboard` could not build it. This
 * package now declares @types/express itself; the test pins that contract.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — plain .mjs module, typechecked via JSDoc only
import { ensureWorkspaceDist, BUILD_OK_MARKER } from "../../../scripts/ensure-local-deps-lib.mjs";

import pkgJson from "../../../package.json";

const NAME = "@a5c-ai/fake-dep";

describe("ensureWorkspaceDist (F2: no false green from stale/partial dist)", () => {
  let dir: string;
  let distDir: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "ensure-local-deps-"));
    distDir = join(dir, "dist");
  });

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  const emitDist = () => {
    mkdirSync(distDir, { recursive: true });
    writeFileSync(join(distDir, "index.js"), "module.exports = {};\n");
  };

  it("builds when the dist entry is missing and writes the build-ok marker", () => {
    const calls: string[] = [];
    const result = ensureWorkspaceDist({
      name: NAME,
      dir,
      exec: (name: string) => {
        calls.push(name);
        emitDist();
      },
      log: () => {},
    });
    expect(result).toBe("built");
    expect(calls).toEqual([NAME]);
    expect(existsSync(join(distDir, BUILD_OK_MARKER))).toBe(true);
  });

  it("skips only when BOTH the entry file and the build-ok marker exist", () => {
    emitDist();
    writeFileSync(join(distDir, BUILD_OK_MARKER), "ok\n");
    const calls: string[] = [];
    const result = ensureWorkspaceDist({
      name: NAME,
      dir,
      exec: (name: string) => calls.push(name),
      log: () => {},
    });
    expect(result).toBe("skipped");
    expect(calls).toEqual([]);
  });

  it("rebuilds a dist that has no build-ok marker (partial/stale artifact)", () => {
    // Simulates the reviewed failure: a previous failed tsc run left
    // dist/index.js behind. Existence alone must NOT satisfy the gate.
    emitDist();
    const calls: string[] = [];
    const result = ensureWorkspaceDist({
      name: NAME,
      dir,
      exec: (name: string) => calls.push(name),
      log: () => {},
    });
    expect(result).toBe("built");
    expect(calls).toEqual([NAME]);
    expect(existsSync(join(distDir, BUILD_OK_MARKER))).toBe(true);
  });

  it("removes the dist and throws when the build fails, so the partial output cannot satisfy the next run", () => {
    expect(() =>
      ensureWorkspaceDist({
        name: NAME,
        dir,
        exec: () => {
          // tsc emits files even when exiting nonzero — reproduce that.
          emitDist();
          throw new Error("tsc exited 2");
        },
        log: () => {},
      }),
    ).toThrowError(/build exited nonzero/);
    expect(existsSync(distDir)).toBe(false);

    // And the NEXT invocation must attempt a real build again, not skip.
    const calls: string[] = [];
    ensureWorkspaceDist({
      name: NAME,
      dir,
      exec: (name: string) => {
        calls.push(name);
        emitDist();
      },
      log: () => {},
    });
    expect(calls).toEqual([NAME]);
  });

  it("throws (without writing a marker) when the build succeeds but emits no entry file", () => {
    expect(() =>
      ensureWorkspaceDist({ name: NAME, dir, exec: () => {}, log: () => {} }),
    ).toThrowError(/dist entry still missing after build/);
    expect(existsSync(join(distDir, BUILD_OK_MARKER))).toBe(false);
  });
});

describe("clean-install reproducibility contract (F1)", () => {
  it("declares @types/express so the workspace-scoped clean install can build @a5c-ai/tasks-adapter", () => {
    // tasks-adapter's src/auth/middleware.ts imports and augments Express
    // types, but no workspace declares @types/express — the full-install
    // green relies on a transitive hoist that a clean
    // `npm ci --ignore-scripts --workspace <this package>` does not include.
    // This devDependency keeps the bootstrap build reproducible; if it is
    // ever removed, the clean observer gates break before Vitest runs.
    expect(
      (pkgJson as { devDependencies: Record<string, string> }).devDependencies["@types/express"],
    ).toMatch(/^\^?4\./);
  });

  it("still routes every observer gate through ensure-local-deps", () => {
    const scripts = (pkgJson as { scripts: Record<string, string> }).scripts;
    expect(scripts.pretypecheck).toContain("ensure-local-deps.mjs");
    expect(scripts.pretest).toContain("ensure-local-deps.mjs");
    expect(scripts.prebuild).toContain("ensure-local-deps.mjs");
  });
});
