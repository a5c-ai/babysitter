import { describe, expect, test } from "vitest";
import { ADAPTER_TYPE_MAP } from "../types";

describe("ADAPTER_TYPE_MAP", () => {
  test("maps all known Paperclip adapter types", () => {
    expect(ADAPTER_TYPE_MAP).toEqual({
      claude_local: "claude-code",
      codex_local: "codex",
      gemini_local: "gemini-cli",
      cursor_local: "cursor",
      github_copilot: "github-copilot",
      opencode_local: "opencode",
      pi_local: "pi",
      omp_local: "oh-my-pi",
    });
  });

  test("covers all expected harnesses", () => {
    const harnesses = Object.values(ADAPTER_TYPE_MAP);
    expect(harnesses).toContain("claude-code");
    expect(harnesses).toContain("codex");
    expect(harnesses).toContain("gemini-cli");
    expect(harnesses).toContain("cursor");
    expect(harnesses).toContain("github-copilot");
    expect(harnesses).toContain("opencode");
    expect(harnesses).toContain("pi");
    expect(harnesses).toContain("oh-my-pi");
  });
});
