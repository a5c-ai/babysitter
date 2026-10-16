import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import os from "node:os";
import path from "node:path";
import { promises as fs } from "node:fs";
import { appendEvent, loadJournal } from "../../../storage/journal";
import { resolveExternalAgentEffectsForRun } from "../externalAgentEffect";

vi.mock("@a5c-ai/tasks-adapter", () => ({
  AgentMuxResponderBackend: class {
    async submitBreakpoint() {
      return {
        answers: [],
        context: { metadata: { agentMux: { agent: "pi", exitReason: "completed" } } },
      };
    }
  },
  routeTask: () => ({ responderType: "agent", responder: { adapter: "pi" } }),
}));

describe("resolveExternalAgentEffectsForRun", () => {
  let runDir: string;

  beforeEach(async () => {
    runDir = await fs.mkdtemp(path.join(os.tmpdir(), "external-agent-effect-"));
    const effectId = "pi-child";
    await fs.mkdir(path.join(runDir, "tasks", effectId), { recursive: true });
    await fs.writeFile(path.join(runDir, "tasks", effectId, "task.json"), JSON.stringify({
      kind: "agent",
      agent: { external: true, adapter: "pi", prompt: "finish" },
    }));
    await appendEvent({
      runDir,
      eventType: "EFFECT_REQUESTED",
      event: {
        effectId,
        invocationKey: "test:pi-child",
        stepId: "pi-child",
        taskId: "pi-child",
        taskDefRef: `tasks/${effectId}/task.json`,
        kind: "agent",
      },
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await fs.rm(runDir, { recursive: true, force: true });
  });

  it("atomically persists a terminal error when a Pi child completes without a direct tool result, once across replay", async () => {
    const first = await resolveExternalAgentEffectsForRun({ runDir });
    const replay = await resolveExternalAgentEffectsForRun({ runDir });
    const events = await loadJournal(runDir);
    const result = JSON.parse(await fs.readFile(path.join(runDir, "tasks", "pi-child", "result.json"), "utf8"));

    expect({
      first,
      replay,
      resolved: events.filter((event) => event.type === "EFFECT_RESOLVED").map((event) => event.data),
      result,
    }).toMatchObject({
      first: { attempted: 1, resolved: [{ effectId: "pi-child", status: "error" }] },
      replay: { attempted: 0, resolved: [] },
      resolved: [{ effectId: "pi-child", status: "error" }],
      result: { status: "error" },
    });
  });
});
