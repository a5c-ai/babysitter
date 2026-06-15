import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { createRun } from "../../../runtime/createRun";
import { runIterate } from "../runIterate";
import { loadJournal } from "../../../storage/journal";

vi.mock("@a5c-ai/tasks-adapter", () => {
  class AgentMuxResponderBackend {
    constructor(readonly config: Record<string, unknown> = {}) {}

    async submitBreakpoint(params: Record<string, unknown>) {
      return {
        answers: [{
          text: `adapters answer for ${String((params.context as Record<string, unknown> | undefined)?.description ?? "task")}`,
          responderId: String(this.config.adapter ?? "codex"),
          responderName: String(this.config.adapter ?? "codex"),
        }],
        context: {
          metadata: {
            agentMux: {
              runId: "adapters-run-1",
              agent: this.config.adapter ?? "codex",
              model: this.config.model ?? "gpt-test",
              durationMs: 123,
              cost: { costUsd: 0.001 },
              tokenUsage: { inputTokens: 10, outputTokens: 5 },
            },
          },
        },
      };
    }
  }

  function routeTask(task: { kind?: string; agent?: Record<string, unknown>; metadata?: Record<string, unknown> }) {
    const responderType = task.agent?.responderType ?? task.metadata?.responderType;
    if (task.kind === "agent" && (responderType === "agent" || task.agent?.external === true)) {
      return {
        responderType: "agent",
        route: "adapters",
        responder: {
          id: String(task.agent?.adapter ?? task.metadata?.adapter ?? "codex"),
          adapter: String(task.agent?.adapter ?? task.metadata?.adapter ?? "codex"),
          model: task.agent?.model as string | undefined,
        },
      };
    }
    return {
      responderType: "internal",
      route: "agent-core",
      responder: { id: "agent-core" },
    };
  }

  return { AgentMuxResponderBackend, routeTask };
});

const EXTERNAL_AGENT_PROCESS = `
const externalAgentTask = {
  id: "external-agent",
  build() {
    return {
      kind: "agent",
      title: "External agent",
      agent: {
        external: true,
        adapter: "codex",
        model: "gpt-test",
        prompt: { task: "review externally" },
      },
    };
  },
};

export async function process(_inputs, ctx) {
  return await ctx.task(externalAgentTask, {}, { key: "external-agent" });
}
`;

describe("runIterate external agent routing", () => {
  let tmpRoot: string;
  let savedCrossSubagents: string | undefined;

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-run-iterate-external-agent-"));
    savedCrossSubagents = process.env.BABYSITTER_CROSS_SUBAGENTS;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (savedCrossSubagents !== undefined) process.env.BABYSITTER_CROSS_SUBAGENTS = savedCrossSubagents;
    else delete process.env.BABYSITTER_CROSS_SUBAGENTS;
    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  async function makeExternalAgentRun() {
    const entryFile = path.join(tmpRoot, "processes", "external-agent.mjs");
    await fs.mkdir(path.dirname(entryFile), { recursive: true });
    await fs.writeFile(entryFile, EXTERNAL_AGENT_PROCESS);
    return await createRun({
      runsDir: tmpRoot,
      process: {
        processId: "ci/external-agent",
        importPath: entryFile,
        exportName: "process",
      },
    });
  }

  it("with BABYSITTER_CROSS_SUBAGENTS=1, resolves tasks-adapter routed agent effects before returning pending work", async () => {
    process.env.BABYSITTER_CROSS_SUBAGENTS = "1";
    const run = await makeExternalAgentRun();

    const first = await runIterate({ runDir: run.runDir, json: true });

    expect(first).toMatchObject({
      status: "executed",
      action: "executed-tasks",
      reason: "external-agent-effects-resolved",
      count: 1,
    });
    expect(first.nextActions).toBeUndefined();

    const events = await loadJournal(run.runDir);
    expect(events.find((event) => event.type === "EFFECT_RESOLVED")?.data).toMatchObject({
      status: "ok",
    });
    expect(events.find((event) => event.type === "COST_TRACKED")?.data).toMatchObject({
      source: "tasks-adapter:adapters",
      inputTokens: 10,
      outputTokens: 5,
      costUsd: 0.001,
    });

    const second = await runIterate({ runDir: run.runDir, json: true });
    expect(second.status).toBe("completed");
    const output = JSON.parse(await fs.readFile(path.join(run.runDir, "state", "output.json"), "utf8"));
    expect(output).toBe("adapters answer for External agent");
  });

  it("with BABYSITTER_CROSS_SUBAGENTS unset (default OFF), leaves the agent effect PENDING and does NOT dispatch tasks-adapter", async () => {
    delete process.env.BABYSITTER_CROSS_SUBAGENTS;
    const run = await makeExternalAgentRun();

    const first = await runIterate({ runDir: run.runDir, json: true });

    // Default OFF must EMIT the effect: the run stays waiting and the agent
    // effect is surfaced as pending work rather than auto-resolved.
    expect(first.status).toBe("waiting");
    expect(first.reason).not.toBe("external-agent-effects-resolved");
    expect(Array.isArray(first.nextActions)).toBe(true);
    expect(first.nextActions).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "agent" })]),
    );

    // No tasks-adapter dispatch occurred: the effect was not resolved.
    const events = await loadJournal(run.runDir);
    expect(events.find((event) => event.type === "EFFECT_RESOLVED")).toBeUndefined();
    expect(events.find((event) => event.type === "COST_TRACKED")).toBeUndefined();
  });
});
