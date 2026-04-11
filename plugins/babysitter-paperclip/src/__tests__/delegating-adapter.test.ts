import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { detectHarness, mapAdapterType } from "../delegating-adapter";

describe("detectHarness", () => {
  // Save and clear env vars that trigger Tier 2 detection
  const envKeys = [
    "CLAUDE_CODE_SESSION", "CLAUDE_CODE_ENTRYPOINT",
    "CODEX_SESSION", "CODEX_HOME",
    "GEMINI_CLI_SESSION", "GOOGLE_GENAI_API_KEY",
    "CURSOR_SESSION",
  ];
  const savedEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of envKeys) {
      savedEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of envKeys) {
      if (savedEnv[key] !== undefined) {
        process.env[key] = savedEnv[key];
      } else {
        delete process.env[key];
      }
    }
  });

  test("Tier 1: maps known Paperclip adapter types to babysitter harness names", () => {
    expect(detectHarness("claude_local")).toEqual({
      harnessName: "claude-code",
      detectionTier: "agent-metadata",
      confidence: "high",
    });
    expect(detectHarness("codex_local")).toEqual({
      harnessName: "codex",
      detectionTier: "agent-metadata",
      confidence: "high",
    });
    expect(detectHarness("gemini_local")).toEqual({
      harnessName: "gemini-cli",
      detectionTier: "agent-metadata",
      confidence: "high",
    });
  });

  test("Tier 3: falls back to plugin config when adapter type unknown", () => {
    expect(detectHarness("unknown_adapter", { defaultHarness: "cursor" })).toEqual({
      harnessName: "cursor",
      detectionTier: "config",
      confidence: "medium",
    });
  });

  test("Tier 4: defaults to claude-code when no detection succeeds", () => {
    expect(detectHarness(undefined)).toEqual({
      harnessName: "claude-code",
      detectionTier: "fallback",
      confidence: "low",
    });
  });

  test("handles undefined adapter type with no config", () => {
    expect(detectHarness(undefined, {})).toEqual({
      harnessName: "claude-code",
      detectionTier: "fallback",
      confidence: "low",
    });
  });
});

describe("mapAdapterType", () => {
  test("maps known types", () => {
    expect(mapAdapterType("claude_local")).toBe("claude-code");
    expect(mapAdapterType("pi_local")).toBe("pi");
    expect(mapAdapterType("omp_local")).toBe("oh-my-pi");
  });

  test("returns undefined for unknown types", () => {
    expect(mapAdapterType("unknown")).toBeUndefined();
    expect(mapAdapterType("")).toBeUndefined();
  });
});
