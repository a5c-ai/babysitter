import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { DefaultOrchestrationProvider } from "../../../../../orchestration/defaultOrchestrationProvider";
import type { RunHandle } from "../../../../../orchestration/interfaces";

/**
 * #936 (live in-process path) — a delegated agent effect that FAILS must NOT
 * spin the orchestration loop printing
 *   `Unexpected token 'E', "Error: Effect failed" is not valid JSON`
 * thousands of times until the 80-minute timeout.
 *
 * Root cause (no external model creds needed to repro): the genty in-process
 * loop posts a failed effect via DefaultOrchestrationProvider.postEffectResult(
 * status="error", error=new Error("Effect failed")). That helper used to write
 * `String(result.error)` (a bare, NON-JSON string `Error: Effect failed`) into
 * the `--error` file, and the babysitter CLI `task:post --error <file>`
 * JSON.parses that file UNGUARDED — producing the cryptic, internal-categorized
 * SyntaxError that, because the post then exited non-zero, spun the loop.
 *
 * Fix verified here end-to-end against a REAL run + REAL CLI:
 *   - postEffectResult(status="error", error) succeeds (no cryptic SyntaxError).
 *   - the stored error result carries the real failure message.
 *   - re-iterating converges to a terminal (process-error / failed) state
 *     instead of re-emitting the same pending effect forever.
 */

// A tiny ESM process with exactly ONE agent-kind ctx.task (genty platform is
// "type":"module", so the process file must be ESM and use defineTask()).
const PROCESS_SOURCE = `
import { defineTask } from "@a5c-ai/babysitter-sdk";
const doThing = defineTask({
  id: "do-thing",
  kind: "agent",
  title: "Do the thing",
  agent: { prompt: "do it" },
});
export async function process(_inputs, ctx) {
  const result = await ctx.task(doThing, {});
  return { result };
}
`;

describe("#936 delegated-effect-failure must fail fast (no cryptic parse / no spin)", () => {
  let tmpRoot: string;
  let runsDir: string;
  let processPath: string;
  let provider: DefaultOrchestrationProvider;

  beforeEach(async () => {
    // Place the run + process INSIDE the repo so the process file's
    // `import "@a5c-ai/babysitter-sdk"` resolves via the monorepo node_modules.
    const here = fileURLToPath(new URL(".", import.meta.url));
    tmpRoot = await mkdtemp(join(here, ".tmp-delegated-fail-loop-"));
    // Nest runsDir under the temp root so the SDK's ensureParentPackageJson
    // writes its package.json into the (cleaned-up) temp root, not __tests__.
    runsDir = join(tmpRoot, "runs");
    processPath = join(tmpRoot, "tiny-process.mjs");
    await writeFile(processPath, PROCESS_SOURCE, "utf8");
    provider = new DefaultOrchestrationProvider();
  });

  afterEach(async () => {
    await rm(tmpRoot, { recursive: true, force: true }).catch(() => {});
  });

  async function createAndRequestEffect(): Promise<{ handle: RunHandle; effectId: string }> {
    const handle = await provider.createRun({
      processId: "tiny-process",
      entrypoint: `${processPath}#process`,
      prompt: "go",
      harness: "agent-core",
      runsDir,
    });
    // First iteration emits the pending agent effect.
    await provider.iterateRun(handle);
    // Read the requested effect straight off disk (robust to CLI list shape).
    const tasksDir = join(handle.runDir, "tasks");
    const effectId = (await readdir(tasksDir).catch(() => []))[0];
    expect(effectId, "expected exactly one pending agent effect").toBeTruthy();
    return { handle, effectId: effectId! };
  }

  it("posts a failed delegated effect without throwing a cryptic JSON SyntaxError", async () => {
    const { handle, effectId } = await createAndRequestEffect();

    // Mirrors internalPhase posting the delegated FAILURE with the bare
    // Error("Effect failed") produced by taskResult.ts when no structured error
    // is supplied. Pre-fix this threw the cryptic non-JSON SyntaxError.
    let caught: unknown;
    try {
      await provider.postEffectResult(handle, effectId, {
        status: "error",
        error: new Error("Effect failed"),
      });
    } catch (err) {
      caught = err;
    }

    expect(
      caught ? String((caught as Error).message) : "",
      "delegated-effect failure must not surface a cryptic non-JSON SyntaxError",
    ).not.toMatch(/Unexpected token .*is not valid JSON/);
    expect(caught, "posting a failed effect must succeed").toBeUndefined();

    // The stored error result carries the real failure message.
    const resultRaw = await readFile(join(handle.runDir, "tasks", effectId, "result.json"), "utf8");
    const stored = JSON.parse(resultRaw) as { status: string; error?: { message?: string } };
    expect(stored.status).toBe("error");
    expect(stored.error?.message).toContain("Effect failed");
  });

  it("converges to a terminal state after a failed effect (no spin)", async () => {
    const { handle, effectId } = await createAndRequestEffect();
    await provider.postEffectResult(handle, effectId, {
      status: "error",
      error: new Error("Effect failed"),
    });

    // Re-iterating replays the process: ctx.task() re-throws the stored error.
    // The run must converge to a terminal (process-error/failed/completed)
    // state promptly — it must NOT keep re-emitting a fresh pending effect.
    let converged = false;
    for (let i = 0; i < 3 && !converged; i++) {
      const result = await provider.iterateRun(handle);
      if (result.status !== "waiting") {
        converged = true;
        break;
      }
    }
    expect(converged, "run must converge (not keep waiting/spinning) after a failed effect").toBe(true);
  });
});
