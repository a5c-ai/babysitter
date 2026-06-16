import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { detectExistingRun } from "../detectExistingRun";

/**
 * Regression coverage for run-overlap detection leaking finished or
 * cross-project runs into the `instructions:*` output. The global runs dir is
 * shared by every project/worktree, so detection must (a) skip runs that
 * already have a completion proof and (b) skip runs created in a different cwd.
 */
describe("detectExistingRun", () => {
  let runsDir: string;
  const originalRunsDir = process.env.BABYSITTER_RUNS_DIR;

  beforeEach(async () => {
    runsDir = await fs.mkdtemp(path.join(os.tmpdir(), "detect-existing-run-"));
    process.env.BABYSITTER_RUNS_DIR = runsDir;
  });

  afterEach(async () => {
    if (originalRunsDir === undefined) delete process.env.BABYSITTER_RUNS_DIR;
    else process.env.BABYSITTER_RUNS_DIR = originalRunsDir;
    await fs.rm(runsDir, { recursive: true, force: true });
  });

  async function writeRun(runId: string, meta: Record<string, unknown>): Promise<void> {
    const dir = path.join(runsDir, runId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "run.json"), JSON.stringify(meta), "utf8");
  }

  it("skips a finished run (completionProof present) even if it is the latest", async () => {
    await writeRun("01AAAAAAAAAAAAAAAAAAAAAAAA", {
      processId: "done-process",
      cwd: process.cwd(),
      completionProof: "deadbeef",
      entrypoint: { importPath: "./process.js", exportName: "process" },
    });

    expect(await detectExistingRun()).toBeUndefined();
  });

  it("skips a run created in a different project (cwd mismatch)", async () => {
    await writeRun("01BBBBBBBBBBBBBBBBBBBBBBBB", {
      processId: "other-project-process",
      cwd: path.join(os.tmpdir(), "some-other-project"),
      entrypoint: { importPath: "./process.js", exportName: "process" },
    });

    expect(await detectExistingRun()).toBeUndefined();
  });

  it("returns an in-progress run created in the current cwd", async () => {
    await writeRun("01CCCCCCCCCCCCCCCCCCCCCCCC", {
      processId: "my-process",
      cwd: process.cwd(),
      entrypoint: { importPath: "./process.js", exportName: "process" },
    });

    const result = await detectExistingRun();
    expect(result?.runId).toBe("01CCCCCCCCCCCCCCCCCCCCCCCC");
    expect(result?.processId).toBe("my-process");
    expect(result?.isBareRun).toBe(false);
  });

  it("prefers the in-progress current-project run over a newer finished cross-project run", async () => {
    // Older: a valid in-progress run for this project.
    await writeRun("01DDDDDDDDDDDDDDDDDDDDDDDD", {
      processId: "mine",
      cwd: process.cwd(),
      entrypoint: { importPath: "./process.js", exportName: "process" },
    });
    // Newer (sorts later): a finished run from a different project.
    await writeRun("01EEEEEEEEEEEEEEEEEEEEEEEE", {
      processId: "theirs",
      cwd: path.join(os.tmpdir(), "elsewhere"),
      completionProof: "cafef00d",
      entrypoint: { importPath: "./process.js", exportName: "process" },
    });

    const result = await detectExistingRun();
    expect(result?.runId).toBe("01DDDDDDDDDDDDDDDDDDDDDDDD");
    expect(result?.processId).toBe("mine");
  });

  it("still surfaces a legacy in-progress run that has no recorded cwd", async () => {
    await writeRun("01FFFFFFFFFFFFFFFFFFFFFFFF", {
      processId: "legacy",
      entrypoint: { importPath: "bare-run" },
    });

    const result = await detectExistingRun();
    expect(result?.runId).toBe("01FFFFFFFFFFFFFFFFFFFFFFFF");
    expect(result?.isBareRun).toBe(true);
  });
});
