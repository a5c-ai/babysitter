import { afterEach, beforeEach, describe, expect, it } from "vitest";
import * as os from "node:os";
import * as path from "node:path";
import { resolveWorkspaceRunsDir } from "../internalPhase";
import { buildAgentPrompt, coerceAgentResultValue } from "../../planProcess";

/**
 * #936 layer 3 — genty internal (in-process) execution.
 *
 *  Bug 1 (result propagation): the auto-delegated agent effect must surface the
 *  AGENT'S result coerced against the task's outputSchema — not the
 *  {success,output,harness} delegation wrapper. We assert the coercion +
 *  prompt-building behaviors that the internal path now reuses from the SDK
 *  effect resolver.
 *
 *  Bug 2 (run lifecycle): genty's internal execution must establish the run
 *  lifecycle in the WORKSPACE .a5c/runs (<repoRoot>/.a5c/runs), not the global
 *  ~/.a5c/runs, when no explicit runsDir / BABYSITTER_RUNS_DIR is provided.
 */

const ENV_KEYS = ["BABYSITTER_RUNS_DIR", "BABYSITTER_RUNS_SCOPE"] as const;

describe("#936 genty internal run lifecycle (resolveWorkspaceRunsDir)", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] !== undefined) process.env[k] = saved[k];
      else delete process.env[k];
    }
  });

  it("defaults to the WORKSPACE repo runs dir (not global home) when nothing is set", () => {
    // Use a workspace nested under cwd so the repo-root walk resolves to a dir
    // beneath the workspace (the babysitter monorepo root), never the home dir.
    const workspace = process.cwd();
    const resolved = resolveWorkspaceRunsDir(undefined, workspace);
    expect(resolved).toBeDefined();
    expect(resolved!.endsWith(path.join(".a5c", "runs"))).toBe(true);
    // Must NOT be the global home state dir (~/.a5c/runs) unless the repo root
    // genuinely IS the home dir (it is not in this monorepo workspace).
    const globalHomeRuns = path.resolve(path.join(os.homedir(), ".a5c", "runs"));
    const repoRoot = path.resolve(workspace);
    if (repoRoot !== path.resolve(os.homedir())) {
      expect(path.resolve(resolved!)).not.toBe(globalHomeRuns);
    }
  });

  it("honors an explicit runsDir verbatim", () => {
    const explicit = path.join(path.sep, "custom", "runs");
    expect(resolveWorkspaceRunsDir(explicit, "/ws")).toBe(explicit);
  });

  it("honors the BABYSITTER_RUNS_DIR env override", () => {
    const override = path.resolve(path.join("tmp-override", ".a5c", "runs"));
    process.env.BABYSITTER_RUNS_DIR = override;
    const resolved = resolveWorkspaceRunsDir(undefined, process.cwd());
    expect(path.resolve(resolved!)).toBe(override);
  });
});

describe("#936 genty internal result propagation (coercion)", () => {
  it("coerces agent output to the declared outputSchema shape", () => {
    const taskDef = {
      kind: "agent",
      title: "Write doc",
      agent: {
        prompt: { task: "write" },
        outputSchema: {
          type: "object",
          required: ["markdown"],
          properties: { markdown: { type: "string" } },
        },
      },
    } as Record<string, unknown>;

    // The agent returns JSON matching the schema — the internal path must hand
    // ctx.task() the parsed object, NOT the raw delegation wrapper.
    const agentOutput = JSON.stringify({ markdown: "# Hello\nworld" });
    const coerced = coerceAgentResultValue(taskDef, agentOutput) as { markdown: string };
    expect(coerced.markdown).toBe("# Hello\nworld");
  });

  it("returns the raw string output when no outputSchema is declared", () => {
    const taskDef = {
      kind: "agent",
      title: "Summarize",
      agent: { prompt: { task: "summarize" } },
    } as Record<string, unknown>;
    expect(coerceAgentResultValue(taskDef, "plain summary")).toBe("plain summary");
  });

  it("builds a structured prompt that embeds the outputSchema instructions", () => {
    const taskDef = {
      kind: "agent",
      title: "Write doc",
      agent: {
        prompt: { role: "scholar", task: "write a summary" },
        outputSchema: { type: "object", properties: { markdown: { type: "string" } } },
      },
    } as Record<string, unknown>;
    const prompt = buildAgentPrompt(taskDef);
    expect(prompt).toContain("write a summary");
    expect(prompt).toContain("Output schema");
  });
});
