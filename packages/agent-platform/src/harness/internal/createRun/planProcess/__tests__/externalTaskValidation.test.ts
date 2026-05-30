import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validateProcessExport } from "../validation";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(tmpdir(), "issue-606-validation-"));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("issue #606 external responder process validation", () => {
  it("accepts process tasks that route to an external agent responder", async () => {
    const processPath = path.join(tmpDir, "external-agent-process.mjs");
    await fs.writeFile(
      processPath,
      `
      import { defineTask } from "@a5c-ai/babysitter-sdk";

      const externalReview = defineTask("issue-606/external-review", () => ({
        kind: "agent",
        title: "External review",
        agent: {
          responderType: "agent",
          adapter: "codex",
          fallbackType: "internal",
          prompt: { task: "review" }
        }
      }));

      export async function process(inputs, ctx) {
        return await ctx.task(externalReview, inputs);
      }
      `,
      "utf8",
    );

    await expect(validateProcessExport(processPath)).resolves.toBeUndefined();
  });
});
