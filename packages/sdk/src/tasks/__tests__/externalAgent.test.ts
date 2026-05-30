import { describe, expect, it } from "vitest";
import { defineTask } from "../defineTask";
import { externalAgentTask } from "../kinds";
import type { TaskBuildContext } from "../types";

describe("external agent task definitions", () => {
  it("builds an agent responder task with adapter, model, provider, and fallback metadata", async () => {
    const task = externalAgentTask("issue-606.external-agent", {
      title: "Delegate review",
      adapter: () => "codex",
      model: () => "gpt-5.4",
      provider: () => "foundry",
      timeout: () => 300_000,
      fallbackType: () => "internal",
      prompt: () => ({ task: "Review the diff" }),
    });

    const def = await task.build({}, createContext());

    expect(def).toMatchObject({
      kind: "agent",
      title: "Delegate review",
      agent: {
        external: true,
        responderType: "agent",
        adapter: "codex",
        model: "gpt-5.4",
        provider: "foundry",
        timeout: 300_000,
        fallbackType: "internal",
        prompt: { task: "Review the diff" },
      },
    });
    expect(def.agent).toHaveProperty("external", true);
  });

  it("rejects external agent tasks without a non-empty adapter", async () => {
    const missingAdapter = defineTask("issue-606.missing-adapter", () => ({
      kind: "agent",
      agent: { external: true },
    }));

    await expect(missingAdapter.build({}, createContext())).rejects.toThrow(
      "agent.responderType 'agent' requires a non-empty agent.adapter",
    );
  });
});

function createContext(): TaskBuildContext {
  return {
    effectId: "01ISSUE606",
    invocationKey: "process:step",
    taskId: "issue-606-task",
    runId: "issue-606-run",
    runDir: "/tmp/issue-606-run",
    taskDir: "/tmp/issue-606-run/tasks/01ISSUE606",
    tasksDir: "/tmp/issue-606-run/tasks",
    labels: [],
    async createBlobRef(name: string) {
      return `tasks/01ISSUE606/blobs/${name}`;
    },
    toTaskRelativePath(relativePath: string) {
      return `tasks/01ISSUE606/${relativePath}`;
    },
  };
}
