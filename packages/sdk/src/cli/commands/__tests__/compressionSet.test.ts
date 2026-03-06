/**
 * Tests for compression:set CLI command (handleCompressionSet).
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { handleCompressionSet } from "../compressionSet";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

async function makeTmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "compression-set-test-"));
}

function configPath(dir: string): string {
  return path.join(dir, ".a5c", "compression.config.json");
}

async function readConfig(dir: string): Promise<unknown> {
  const raw = await fs.readFile(configPath(dir), "utf8");
  return JSON.parse(raw);
}

let tmpDir: string;
let stdoutChunks: string[];
let stderrChunks: string[];
let originalStdout: typeof process.stdout.write;
let originalStderr: typeof process.stderr.write;

beforeEach(async () => {
  tmpDir = await makeTmpDir();
  stdoutChunks = [];
  stderrChunks = [];
  originalStdout = process.stdout.write;
  originalStderr = process.stderr.write;
  process.stdout.write = ((c: string | Uint8Array) => { stdoutChunks.push(typeof c === "string" ? c : Buffer.from(c).toString()); return true; }) as typeof process.stdout.write;
  process.stderr.write = ((c: string | Uint8Array) => { stderrChunks.push(typeof c === "string" ? c : Buffer.from(c).toString()); return true; }) as typeof process.stderr.write;
});

afterEach(async () => {
  process.stdout.write = originalStdout;
  process.stderr.write = originalStderr;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

function stdout(): string { return stdoutChunks.join(""); }
function stderr(): string { return stderrChunks.join(""); }

describe("compression:set", () => {
  it("sets a numeric field", async () => {
    const code = await handleCompressionSet({ key: "userPromptHook.threshold", value: "300", cwd: tmpDir });
    expect(code).toBe(0);
    const cfg = await readConfig(tmpDir) as { layers: { userPromptHook: { threshold: number } } };
    expect(cfg.layers.userPromptHook.threshold).toBe(300);
  });

  it("sets keepRatio as a float", async () => {
    const code = await handleCompressionSet({ key: "userPromptHook.keepRatio", value: "0.85", cwd: tmpDir });
    expect(code).toBe(0);
    const cfg = await readConfig(tmpDir) as { layers: { userPromptHook: { keepRatio: number } } };
    expect(cfg.layers.userPromptHook.keepRatio).toBe(0.85);
  });

  it("sets excludeCommands as a parsed array", async () => {
    const code = await handleCompressionSet({ key: "commandOutputHook.excludeCommands", value: "node,python,ruby", cwd: tmpDir });
    expect(code).toBe(0);
    const cfg = await readConfig(tmpDir) as { layers: { commandOutputHook: { excludeCommands: string[] } } };
    expect(cfg.layers.commandOutputHook.excludeCommands).toEqual(["node", "python", "ruby"]);
  });

  it("sets top-level enabled (boolean)", async () => {
    const code = await handleCompressionSet({ key: "enabled", value: "false", cwd: tmpDir });
    expect(code).toBe(0);
    const cfg = await readConfig(tmpDir) as { enabled: boolean };
    expect(cfg.enabled).toBe(false);
  });

  it("accepts on/off/yes/no for booleans", async () => {
    await handleCompressionSet({ key: "enabled", value: "on", cwd: tmpDir });
    let cfg = await readConfig(tmpDir) as { enabled: boolean };
    expect(cfg.enabled).toBe(true);
    await handleCompressionSet({ key: "enabled", value: "no", cwd: tmpDir });
    cfg = await readConfig(tmpDir) as { enabled: boolean };
    expect(cfg.enabled).toBe(false);
  });

  it("preserves existing keys when setting a new one", async () => {
    await handleCompressionSet({ key: "userPromptHook.threshold", value: "400", cwd: tmpDir });
    await handleCompressionSet({ key: "userPromptHook.keepRatio", value: "0.9", cwd: tmpDir });
    const cfg = await readConfig(tmpDir) as { layers: { userPromptHook: { threshold: number; keepRatio: number } } };
    expect(cfg.layers.userPromptHook.threshold).toBe(400);
    expect(cfg.layers.userPromptHook.keepRatio).toBe(0.9);
  });

  it("rejects unknown key", async () => {
    const code = await handleCompressionSet({ key: "userPromptHook.bogus", value: "123", cwd: tmpDir });
    expect(code).toBe(1);
    expect(stderr()).toContain("Unknown key");
  });

  it("rejects non-numeric value for numeric field", async () => {
    const code = await handleCompressionSet({ key: "userPromptHook.threshold", value: "notanumber", cwd: tmpDir });
    expect(code).toBe(1);
    expect(stderr()).toContain("expects a number");
  });

  it("rejects invalid boolean value", async () => {
    const code = await handleCompressionSet({ key: "enabled", value: "maybe", cwd: tmpDir });
    expect(code).toBe(1);
    expect(stderr()).toContain("expects true/false");
  });

  it("outputs JSON when --json flag set", async () => {
    const code = await handleCompressionSet({ key: "userPromptHook.threshold", value: "250", json: true, cwd: tmpDir });
    expect(code).toBe(0);
    const out = JSON.parse(stdout());
    expect(out.key).toBe("userPromptHook.threshold");
    expect(out.value).toBe(250);
  });
});
