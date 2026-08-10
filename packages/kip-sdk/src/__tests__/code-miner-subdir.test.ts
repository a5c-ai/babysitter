/**
 * Regression tests for the code-analysis Miner's ENCLOSING-git-root walk-up + subdirectory scoping
 * (round-4 DEFECT 1) — ADR-B9c. These are SIBLING to the frozen `code-miner.test.ts` acceptance suite
 * (which is left untouched): they exercise `kip index <subdir>` behavior that the frozen fixtures — which
 * only ever index a repo ROOT — do not cover.
 *
 * DEFECT 1: the miner read `<repoDir>/.git/HEAD` directly, so indexing a SUBDIRECTORY of a repo failed
 * ENOENT (no `.git` under the subdir). The fix walks UP from the given path to the enclosing git root,
 * reads git metadata (HEAD sha, tracked set) from there, and scopes the emitted `code:module` facts to
 * files UNDER the given subdirectory — failing LOUDLY (typed error, named path) when NO enclosing `.git`
 * exists (N5: never a fabricated sha or a non-repo scan).
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { AssertInput, RetractInput } from "../index";
import { buildCodeMinerResult } from "../miner/code-miner";

type Candidate = AssertInput | RetractInput;

/** A repo with source files at the ROOT and inside a nested `src/foo/` subdirectory. `src/foo/a.ts`
 *  imports `./b` (an intra-subdir import) so the scoped scan still resolves a real `code:imports` edge. */
const FIXTURE_FILES: Record<string, string> = {
  "root.ts": "export const ROOT = 0;\n",
  "src/other.ts": "export const OTHER = 1;\n",
  "src/foo/a.ts": 'import { B } from "./b";\nexport const A = B + 1;\n',
  "src/foo/b.ts": "export const B = 2;\n",
};

interface FixtureRepo {
  repoDir: string;
  subDir: string;
  gitSha: string;
  cleanup: () => void;
}

function makeFixtureRepo(): FixtureRepo {
  const repoDir = mkdtempSync(join(tmpdir(), "kip-code-miner-subdir-"));
  for (const [name, content] of Object.entries(FIXTURE_FILES)) {
    const abs = join(repoDir, name);
    mkdirSync(join(abs, ".."), { recursive: true });
    writeFileSync(abs, content, "utf8");
  }
  const git = (...args: string[]): string =>
    execFileSync("git", args, { cwd: repoDir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  git("init", "-q");
  git("config", "user.email", "fixture@kip.test");
  git("config", "user.name", "kip fixture");
  git("config", "commit.gpgsign", "false");
  git("add", "-A");
  git("-c", "user.email=fixture@kip.test", "-c", "user.name=kip fixture", "commit", "-q", "-m", "fixture");
  const gitSha = git("rev-parse", "HEAD");
  return {
    repoDir,
    subDir: join(repoDir, "src", "foo"),
    gitSha,
    cleanup: () => rmSync(repoDir, { recursive: true, force: true }),
  };
}

function moduleEidSuffixes(proposed: readonly Candidate[]): string[] {
  return proposed
    .filter((c) => c.target.kind === "node" && c.target.nodeKind === "code:module")
    .map((c) => (c.target as { eid: string }).eid);
}

describe("code-miner — enclosing git-root walk-up + subdirectory scoping (DEFECT 1)", () => {
  let fixture: FixtureRepo;
  beforeAll(() => {
    fixture = makeFixtureRepo();
  });
  afterAll(() => {
    fixture.cleanup();
  });

  it("indexing a SUBDIR resolves the enclosing repo's sha and emits code:module facts ONLY for files under the subdir", () => {
    const { proposed, source } = buildCodeMinerResult({ repoDir: fixture.subDir });

    // (a) provenance sha resolved from the ENCLOSING git root (no --git-sha supplied).
    expect(source.source?.uri).toMatch(/^code-resource:\/\/[^@]+@[0-9a-f]{7,40}$/);
    expect(source.source?.uri?.endsWith(`@${fixture.gitSha}`)).toBe(true);

    // (b) exactly the two modules UNDER src/foo — never root.ts or src/other.ts.
    const eids = moduleEidSuffixes(proposed);
    expect(eids.length).toBe(2);
    expect(eids.some((e) => e.endsWith("src/foo/a.ts"))).toBe(true);
    expect(eids.some((e) => e.endsWith("src/foo/b.ts"))).toBe(true);
    expect(eids.some((e) => e.endsWith("root.ts"))).toBe(false);
    expect(eids.some((e) => e.endsWith("src/other.ts"))).toBe(false);

    // The intra-subdir import (a.ts -> ./b) still resolves to a code:imports edge within the scope.
    const imports = proposed.filter((c) => c.target.kind === "edge" && c.target.edgeKind === "code:imports");
    expect(imports.length).toBe(1);
  });

  it("indexing the git ROOT is unchanged — the full tracked set is emitted", () => {
    const eids = moduleEidSuffixes(buildCodeMinerResult({ repoDir: fixture.repoDir }).proposed);
    expect(eids.length).toBe(Object.keys(FIXTURE_FILES).length);
    expect(eids.some((e) => e.endsWith("root.ts"))).toBe(true);
    expect(eids.some((e) => e.endsWith("src/foo/a.ts"))).toBe(true);
  });

  it("fails LOUDLY (typed error naming the path) when NO enclosing .git is found walking up (N5)", () => {
    const orphan = mkdtempSync(join(tmpdir(), "kip-code-miner-no-git-"));
    try {
      expect(() => buildCodeMinerResult({ repoDir: orphan })).toThrow(/no enclosing git repository found/i);
      // The error names the offending path (loud, actionable) — never a silent fabricated sha.
      expect(() => buildCodeMinerResult({ repoDir: orphan })).toThrow(orphan);
    } finally {
      rmSync(orphan, { recursive: true, force: true });
    }
  });
});
