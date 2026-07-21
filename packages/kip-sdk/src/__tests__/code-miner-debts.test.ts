/**
 * Debt-closure tests for the code-analysis Miner (M7) + `runAcquisition` — DEBTS.md D-53, D-55, D-56.
 *
 *   D-55  newline-LOC off-by-one: a file with NO trailing newline undercounts its last line by one.
 *   D-53  probed/accelerator tier had NO automated coverage (live-gated behind `KIP_INDEX_TOOLS`).
 *         Covered HERMETICALLY here via the injectable `CodeMinerProbeSeam` — no real subprocess, no
 *         `KIP_INDEX_TOOLS` needed — asserting the N5 honest behaviors (present metric + `<metric>Tool`
 *         provenance; absent tool → `skipped:<tool>` and NO fabricated metric; first-available-wins LOC).
 *   D-56  `runAcquisition` swallowed a dispatched microagent's verbatim error, surfacing only a generic
 *         non-zero exit. It now threads `output.error` into the thrown KipError's message + context.
 *
 * These add NO runtime dependency and NEVER touch package-lock.json, and weaken/skip no existing test.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { AssertInput, RetractInput } from "../index";
import { KipError, KipRepo } from "../index";
import {
  buildCodeMinerResult,
  DEFAULT_PROBE_SEAM,
  PROBED_TOOLS,
  type CodeMinerProbeSeam,
  type ProbedTool,
} from "../miner/code-miner";
import type { ResolvedHarnessBinary } from "../cli/ask";
import {
  FIXED_AS_OF,
  freshReplicaId,
  makeScriptedDispatch,
  registerAcquisitionManifest,
} from "./conformance/fixtures-m7";

type Candidate = AssertInput | RetractInput;

// --- a REAL git repo fixture under os.tmpdir() (never the project repo) ------------------------

interface Fixture {
  repoDir: string;
  gitSha: string;
  cleanup: () => void;
}

/** Create a real git repo with the given files and return its dir + HEAD sha. Unsigned commit with a
 *  pinned identity so no global git config is needed (mirrors code-miner.test.ts's fixture). */
function makeRepoWith(files: Record<string, string>): Fixture {
  const repoDir = mkdtempSync(join(tmpdir(), "kip-miner-debt-"));
  for (const [name, content] of Object.entries(files)) writeFileSync(join(repoDir, name), content, "utf8");
  const git = (...args: string[]): string =>
    execFileSync("git", args, { cwd: repoDir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  git("init", "-q");
  git("config", "user.email", "fixture@kip.test");
  git("config", "user.name", "kip fixture");
  git("config", "commit.gpgsign", "false");
  git("add", "-A");
  git("-c", "user.email=fixture@kip.test", "-c", "user.name=kip fixture", "commit", "-q", "-m", "fixture");
  const gitSha = git("rev-parse", "HEAD");
  return { repoDir, gitSha, cleanup: () => rmSync(repoDir, { recursive: true, force: true }) };
}

/** The per-module `linesOfCode` node-prop value for the file whose EID ends with `name`. */
function locFor(proposed: readonly Candidate[], name: string): unknown {
  const hit = proposed.find(
    (c) => c.target.kind === "node-prop" && c.target.prop === "linesOfCode" && c.target.eid.endsWith(name),
  );
  return hit && hit.type === "assert" ? hit.value : undefined;
}

/** Repo-node (`code:repo:*`) probed-tier node-props, keyed by prop → value. */
function repoNodeProps(proposed: readonly Candidate[]): Array<{ prop: string; value: unknown }> {
  return proposed
    .filter((c) => c.target.kind === "node-prop" && (c.target as { eid: string }).eid.startsWith("code:repo:"))
    .map((c) => ({ prop: (c.target as { prop: string }).prop, value: c.type === "assert" ? c.value : undefined }));
}

const fixtures: Fixture[] = [];
afterEach(() => {
  for (const fx of fixtures.splice(0)) fx.cleanup();
});

// ================================================================================================
// D-55 — newline-LOC off-by-one on files with no trailing newline.
// ================================================================================================

describe("code Miner — newline-LOC counts an unterminated final line (D-55)", () => {
  it("adds one for a non-empty file lacking a trailing newline; trailing-newline unchanged; empty=0", () => {
    const fx = makeRepoWith({
      // 1 `\n`, NO trailing newline → the last line ("line two") must still count ⇒ 2 (undercounted 1 before).
      "noeol.txt": "line one\nline two",
      // 2 `\n`, trailing newline → unchanged ⇒ 2.
      "witheol.txt": "line one\nline two\n",
      // 0 `\n`, NO trailing newline → a single unterminated line ⇒ 1 (was 0 before).
      "oneline-noeol.txt": "solo",
      // genuinely empty → 0 (never 1).
      "empty.txt": "",
    });
    fixtures.push(fx);

    const { proposed } = buildCodeMinerResult({ repoDir: fx.repoDir, gitSha: fx.gitSha });

    expect(locFor(proposed, "noeol.txt")).toBe(2);
    expect(locFor(proposed, "witheol.txt")).toBe(2);
    expect(locFor(proposed, "oneline-noeol.txt")).toBe(1);
    expect(locFor(proposed, "empty.txt")).toBe(0);
  });
});

// ================================================================================================
// D-53 — hermetic coverage of the probed/accelerator tier via the injectable seam.
// ================================================================================================

const fakeBinary = (tool: string): ResolvedHarnessBinary => ({ path: `/fake/bin/${tool}`, isWindowsShim: false });

/** A hermetic probe seam: `present[tool]` = the stdout that tool's run returns (its ABSENCE ⇒ not on
 *  PATH). No real subprocess, no `KIP_INDEX_TOOLS` env — the gate is satisfied by the seam's own env. */
function fakeSeam(present: Partial<Record<ProbedTool, string>>): CodeMinerProbeSeam {
  return {
    env: { KIP_INDEX_TOOLS: "1" } as NodeJS.ProcessEnv,
    resolve: (tool) => (tool in present ? fakeBinary(tool) : undefined),
    probeVersion: () => 0,
    run: (binary) => {
      const tool = binary.path.split("/").pop() as ProbedTool;
      return present[tool] ?? "";
    },
  };
}

describe("code Miner — probed/accelerator tier honest behavior, hermetic (D-53)", () => {
  const TOKEI_OUT = JSON.stringify({ TypeScript: { code: 42 }, Total: { code: 42 } });
  const SCC_OUT = JSON.stringify([{ Code: 99 }]);
  const CLOC_OUT = JSON.stringify({ SUM: { code: 77 } });
  const input = (fx: Fixture) => ({ repoDir: fx.repoDir, gitSha: fx.gitSha });
  const withFixture = (): Fixture => {
    const fx = makeRepoWith({ "a.ts": 'import { B } from "./b";\nexport const A = B + 1;\n', "b.ts": "export const B = 2;\n" });
    fixtures.push(fx);
    return fx;
  };

  it("a PRESENT tool emits its metric WITH the `<metric>Tool` provenance prop", () => {
    const { proposed } = buildCodeMinerResult(input(withFixture()), fakeSeam({ tokei: TOKEI_OUT }));
    const props = repoNodeProps(proposed);
    expect(props.find((p) => p.prop === "linesOfCode" && p.value === 42)).toBeDefined();
    expect(props.find((p) => p.prop === "linesOfCodeTool" && p.value === "tokei")).toBeDefined();
  });

  it("an ABSENT tool records `skipped:<tool>` with a non-empty reason and NO fabricated metric (N5)", () => {
    const { proposed } = buildCodeMinerResult(input(withFixture()), fakeSeam({}));
    const props = repoNodeProps(proposed);
    for (const tool of PROBED_TOOLS) {
      const skip = props.find((p) => p.prop === `skipped:${tool}`);
      expect(skip, `skipped:${tool}`).toBeDefined();
      expect(typeof skip?.value === "string" && (skip.value as string).length > 0).toBe(true);
    }
    // No metric and no fabricated provenance companion is authored for a tool that never ran.
    expect(props.find((p) => p.prop === "linesOfCode")).toBeUndefined();
    expect(props.find((p) => p.prop === "todoMarkers")).toBeUndefined();
    expect(props.find((p) => p.prop.endsWith("Tool"))).toBeUndefined();
  });

  it("first-available-wins: the first LOC tool writes `linesOfCode`; later LOC tools loud-skip", () => {
    // tokei is probed before scc/cloc (PROBED_TOOLS order), so tokei wins the shared `linesOfCode` cell.
    const { proposed } = buildCodeMinerResult(input(withFixture()), fakeSeam({ tokei: TOKEI_OUT, scc: SCC_OUT, cloc: CLOC_OUT }));
    const props = repoNodeProps(proposed);

    const locMetrics = props.filter((p) => p.prop === "linesOfCode");
    expect(locMetrics.length).toBe(1);
    expect(locMetrics[0]?.value).toBe(42); // tokei's value, not scc's 99 or cloc's 77
    expect(props.find((p) => p.prop === "linesOfCodeTool" && p.value === "tokei")).toBeDefined();

    // scc + cloc each loud-skip WITH a reason naming the winner (never a silent overwrite).
    expect(String(props.find((p) => p.prop === "skipped:scc")?.value)).toContain("already provided by tokei");
    expect(String(props.find((p) => p.prop === "skipped:cloc")?.value)).toContain("already provided by tokei");
  });

  it("the DEFAULT seam leaves probing opt-in (no KIP_INDEX_TOOLS ⇒ every probed tool skips)", () => {
    // Guards that the injected seam did not change the shipped default behavior.
    expect(DEFAULT_PROBE_SEAM.env).toBe(process.env);
    const { proposed } = buildCodeMinerResult(input(withFixture()));
    const props = repoNodeProps(proposed);
    // With KIP_INDEX_TOOLS unset in the test env, the opt-in gate skips every probed tool.
    if (!process.env.KIP_INDEX_TOOLS) {
      for (const tool of PROBED_TOOLS) expect(props.find((p) => p.prop === `skipped:${tool}`)).toBeDefined();
      expect(props.find((p) => p.prop.endsWith("Tool"))).toBeUndefined();
    }
  });
});

// ================================================================================================
// D-56 — runAcquisition surfaces the microagent's verbatim error (output.error), not just exit N.
// ================================================================================================

describe("runAcquisition — surfaces a dispatched microagent's verbatim error (D-56)", () => {
  const repos: KipRepo[] = [];
  afterEach(() => {
    for (const repo of repos.splice(0)) repo.close();
  });

  it("threads output.error into the thrown KipError message + context, keeping code + N5 unchanged", async () => {
    const reason = "code-miner: no enclosing git repository found for /tmp/not-a-repo";
    const { dispatch } = makeScriptedDispatch({
      // The real code-miner failure shape: a non-zero exit carrying its reason on `output.error`.
      miner: () => ({ exitCode: 1, output: { error: reason }, elapsedMs: 0 }),
    });
    const repo = new KipRepo({ replicaId: freshReplicaId("d56"), dispatchMicroagent: dispatch });
    repos.push(repo);
    const manifest = await registerAcquisitionManifest(repo, "miner");

    let thrown: unknown;
    try {
      await repo.runAcquisition(manifest, {}, { asOf: FIXED_AS_OF });
    } catch (e) {
      thrown = e;
    }
    expect(thrown).toBeInstanceOf(KipError);
    const err = thrown as KipError;
    // Code + N5 fail-loud contract are unchanged.
    expect(err.code).toBe("ERR_MALFORMED_INPUT");
    // The verbatim reason is now visible to the caller — in the message AND the context.
    expect(err.message).toContain(reason);
    expect(err.message).toContain("exitCode (1)");
    expect(err.context?.reason).toBe(reason);
    expect(err.context?.exitCode).toBe(1);
  });

  it("a non-zero exit WITHOUT an output.error still fails loud (no reason clause, code unchanged)", async () => {
    const { dispatch } = makeScriptedDispatch({
      miner: () => ({ exitCode: 7, output: { note: "no error field here" }, elapsedMs: 0 }),
    });
    const repo = new KipRepo({ replicaId: freshReplicaId("d56-noerr"), dispatchMicroagent: dispatch });
    repos.push(repo);
    const manifest = await registerAcquisitionManifest(repo, "miner");

    let thrown: unknown;
    try {
      await repo.runAcquisition(manifest, {}, { asOf: FIXED_AS_OF });
    } catch (e) {
      thrown = e;
    }
    const err = thrown as KipError;
    expect(err.code).toBe("ERR_MALFORMED_INPUT");
    expect(err.message).toContain("exitCode (7)");
    expect(err.context?.exitCode).toBe(7);
    expect(err.context?.reason).toBeUndefined();
  });
});
