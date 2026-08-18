import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  _setDiscoverExternalAgentsForValidationTesting,
  validateProcessExport,
} from "../validation";

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(tmpdir(), "issue-606-validation-"));
  _setDiscoverExternalAgentsForValidationTesting(async () => ({
    available: true,
    agents: [{ name: "codex", displayName: "Codex", installed: true, authenticated: true, capabilities: [] }],
    defaultProvider: null,
    defaultModel: null,
  }));
});

afterEach(async () => {
  _setDiscoverExternalAgentsForValidationTesting();
  vi.restoreAllMocks();
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

  it("rejects agent responder tasks that omit adapter", async () => {
    const processPath = path.join(tmpDir, "missing-adapter-process.mjs");
    await fs.writeFile(
      processPath,
      `
      import { defineTask } from "@a5c-ai/babysitter-sdk";

      const externalReview = defineTask("issue-606/missing-adapter", () => ({
        kind: "agent",
        title: "External review",
        agent: {
          responderType: "agent",
          prompt: { task: "review" }
        }
      }));

      export async function process(inputs, ctx) {
        return await ctx.task(externalReview, inputs);
      }
      `,
      "utf8",
    );

    await expect(validateProcessExport(processPath)).rejects.toThrow(
      /agent responder task\(s\) without a non-empty adapter/,
    );
  });

  it("warns instead of failing when agent responder tasks are valid but adapters is unavailable", async () => {
    const processPath = path.join(tmpDir, "unavailable-adapters-process.mjs");
    _setDiscoverExternalAgentsForValidationTesting(async () => ({
      available: false,
      agents: [],
      defaultProvider: null,
      defaultModel: null,
    }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    await fs.writeFile(
      processPath,
      `
      import { defineTask } from "@a5c-ai/babysitter-sdk";

      const externalReview = defineTask("issue-606/unavailable-adapters", () => ({
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
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("agent responder tasks"));
  });

  it("links the SDK into the workspace with a relative target so archived workspaces stay extractable", async () => {
    const processPath = path.join(tmpDir, "portable-sdk-link-process.mjs");
    await fs.writeFile(
      processPath,
      `
      import { defineTask } from "@a5c-ai/babysitter-sdk";

      const externalReview = defineTask("portable-sdk-link/review", () => ({
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

    // ensureSdkResolvable symlinks the SDK package under the workspace's
    // node_modules. The link must survive being archived, so its target has
    // to be relative to the link's parent rather than absolute.
    const sdkLink = path.join(tmpDir, "node_modules", "@a5c-ai", "babysitter-sdk");
    const resolvedSdk = await fs.realpath(sdkLink);
    const sdkPkgJson = JSON.parse(
      await fs.readFile(path.join(resolvedSdk, "package.json"), "utf8"),
    ) as { name?: string };
    expect(sdkPkgJson.name).toBe("@a5c-ai/babysitter-sdk");

    if (process.platform !== "win32") {
      const target = await fs.readlink(sdkLink);
      expect(path.isAbsolute(target)).toBe(false);
      // The relative target must still resolve back to the SDK package dir.
      await expect(
        fs.realpath(path.resolve(path.dirname(sdkLink), target)),
      ).resolves.toBe(resolvedSdk);
    }
  });
});
