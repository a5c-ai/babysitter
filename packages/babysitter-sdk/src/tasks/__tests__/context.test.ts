import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createTaskBuildContext } from "../context";

const EFFECT_ID = "01HPZKTHATASKCTX";

describe("TaskBuildContext helpers", () => {
  let runDir: string;

  beforeEach(async () => {
    runDir = await fs.mkdtemp(path.join(os.tmpdir(), "babysitter-task-ctx-"));
  });

  afterEach(async () => {
    if (runDir) {
      await fs.rm(runDir, { recursive: true, force: true });
    }
  });

  const buildCtx = (label?: string) =>
    createTaskBuildContext({
      runId: "run-123",
      runDir,
      effectId: EFFECT_ID,
      invocationKey: "invoke-key",
      taskId: "build-task",
      label,
    });

  it("exposes normalized metadata and immutable references", () => {
    const ctx = buildCtx("  primary  ");
    expect(ctx.taskId).toBe("build-task");
    expect(ctx.effectId).toBe(EFFECT_ID);
    expect(ctx.runDir).toBe(runDir);
    expect(ctx.tasksDir).toBe(path.join(runDir, "tasks"));
    expect(ctx.taskDir).toBe(path.join(runDir, "tasks", EFFECT_ID));
    expect(ctx.label).toBe("primary");
    expect(ctx.labels).toEqual(["primary"]);
    expect(Object.isFrozen(ctx)).toBe(true);
  });

  it("allows mutation of ctx.labels for downstream metadata", () => {
    const ctx = buildCtx();
    ctx.labels.push("first");
    ctx.labels.push("second");
    expect(ctx.labels).toEqual(["first", "second"]);
  });

  it("creates deterministic blob refs for JSON payloads", async () => {
    const ctx = buildCtx();
    const ref = await ctx.createBlobRef("inputs.json", { foo: "bar" });
    expect(ref).toMatch(new RegExp(`^tasks/${EFFECT_ID}/blobs/inputs-[0-9a-f]{64}\\.json$`));

    const filePath = resolveRef(runDir, ref);
    const onDisk = await fs.readFile(filePath, "utf8");
    expect(JSON.parse(onDisk)).toEqual({ foo: "bar" });

    const sameRef = await ctx.createBlobRef("inputs.json", { foo: "bar" });
    expect(sameRef).toBe(ref);
  });

  it("normalizes unsafe blob names and appends default extensions", async () => {
    const ctx = buildCtx();
    const ref = await ctx.createBlobRef(" ..\\evil payload  ", { answer: 42 });
    expect(ref).toMatch(new RegExp(`^tasks/${EFFECT_ID}/blobs/evil-payload-[0-9a-f]{64}\\.json$`));
  });

  it("supports text and binary blob payloads", async () => {
    const ctx = buildCtx();
    const textRef = await ctx.createBlobRef("notes.txt", "hello\nworld");
    const textContents = await fs.readFile(resolveRef(runDir, textRef), "utf8");
    expect(textContents).toBe("hello\nworld");

    const buffer = Buffer.from("bytes\x00go-here", "utf8");
    const binRef = await ctx.createBlobRef("payload.bin", buffer);
    const stored = await fs.readFile(resolveRef(runDir, binRef));
    expect(stored.equals(buffer)).toBe(true);
  });

  it("rejects empty blob names", async () => {
    const ctx = buildCtx();
    await expect(ctx.createBlobRef("   ", { foo: "bar" })).rejects.toThrow(/non-empty/i);
  });

  it("normalizes task-relative paths and prevents traversal", () => {
    const ctx = buildCtx();
    const normalized = ctx.toTaskRelativePath(".\\artifacts\\out\\result.json");
    expect(normalized).toBe(`tasks/${EFFECT_ID}/artifacts/out/result.json`);

    expect(() => ctx.toTaskRelativePath("../outside.txt")).toThrow(/cannot traverse/i);
  });

  it("rejects absolute task-relative paths", () => {
    const ctx = buildCtx();
    const absolute = path.join(runDir, "tasks", "other.json");
    expect(() => ctx.toTaskRelativePath(absolute)).toThrow(/absolute/i);
  });
});

function resolveRef(runDir: string, ref: string): string {
  const segments = ref.split("/").filter(Boolean);
  return path.join(runDir, ...segments);
}
