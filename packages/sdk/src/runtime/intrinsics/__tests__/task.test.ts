import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRunDir } from "../../../storage/createRunDir";
import { appendEvent } from "../../../storage/journal";
import { orchestrateIteration } from "../../orchestrateIteration";

let tmpRoot: string;

beforeEach(async () => {
  tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), "issue-606-task-intrinsic-"));
});

afterEach(async () => {
  await fs.rm(tmpRoot, { recursive: true, force: true });
});

describe("task intrinsic responder routing metadata", () => {
  it("preserves agent responder metadata on waiting effects for tasks-mux routing", async () => {
    const processPath = path.join(tmpRoot, "process.mjs");
    await fs.writeFile(
      processPath,
      `
      const externalAgentTask = {
        id: "issue-606-external-agent",
        async build() {
          return {
            kind: "agent",
            title: "external agent",
            agent: {
              responderType: "agent",
              adapter: "codex",
              model: "gpt-5.4",
              provider: "foundry",
              fallbackType: "internal",
              prompt: { task: "review" }
            },
            metadata: {
              responderType: "agent",
              adapter: "codex"
            }
          };
        }
      };

      export async function process(inputs, ctx) {
        return await ctx.task(externalAgentTask, {});
      }
      `,
      "utf8",
    );

    const { runDir } = await createRunDir({
      runsRoot: tmpRoot,
      runId: "issue-606-runtime-routing",
      request: "issue-606",
      processPath,
      inputs: {},
    });
    await appendEvent({ runDir, eventType: "RUN_CREATED", event: { runId: "issue-606-runtime-routing" } });

    const iteration = await orchestrateIteration({ runDir });

    expect(iteration.status).toBe("waiting");
    if (iteration.status !== "waiting") throw new Error("Expected waiting iteration");
    expect(iteration.nextActions[0]?.taskDef.agent).toMatchObject({
      responderType: "agent",
      adapter: "codex",
      model: "gpt-5.4",
      provider: "foundry",
      fallbackType: "internal",
    });
    expect(iteration.nextActions[0]?.taskDef.metadata).toMatchObject({
      responderType: "agent",
      adapter: "codex",
    });
  });
});
