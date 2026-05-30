import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { createRun } from "../../../runtime/createRun";
import { runIterate } from "../runIterate";
import { loadJournal } from "../../../storage/journal";

vi.mock("@a5c-ai/tasks-mux", () => {
  class AgentMuxResponderBackend {
    constructor(readonly config: Record<string, unknown> = {}) {}

    async submitBreakpoint(params: Record<string, unknown>) {
      return {
        answers: [{
          text: `agent-mux answer for ${String((params.context as Record<string, unknown> | undefined)?.description ?? "task")}`,
          responderId: String(this.config.adapter ?? "codex"),
          responderName: String(this.config.adapter ?? "codex"),
        }],
        context: {
          metadata: {
            agentMux: {
              runId: "amux-run-1",
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
        route: "agent-mux",
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

describe("runIterate external agent routing", () => {
  let tmpRoot: string;

  beforeEach(async () => {
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sdk-run-iterate-external-agent-"));
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(tmpRoot, { recursive: true, force: true });
  });

  it("resolves tasks-mux routed agent effects before returning pending work to the CLI caller", async () => {
    const entryFile = path.join(tmpRoot, "processes", "external-agent.mjs");
    await fs.mkdir(path.dirname(entryFile), { recursive: true });
    await fs.writeFile(entryFile, `
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
`);

    const run = await createRun({
      runsDir: tmpRoot,
      process: {
        processId: "ci/external-agent",
        importPath: entryFile,
        exportName: "process",
      },
    });

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
      source: "tasks-mux:agent-mux",
      inputTokens: 10,
      outputTokens: 5,
      costUsd: 0.001,
    });

    const second = await runIterate({ runDir: run.runDir, json: true });
    expect(second.status).toBe("completed");
    const output = JSON.parse(await fs.readFile(path.join(run.runDir, "state", "output.json"), "utf8"));
    expect(output).toBe("agent-mux answer for External agent");
  });
});
