import { describe, it, expect } from "vitest";
import {
  HARNESS_TO_AMUX_ADAPTER,
  mapHarnessToAmuxAdapter,
  hasAmuxAdapter,
} from "../amuxHarnessMap";

describe("HARNESS_TO_AMUX_ADAPTER", () => {
  it("maps claude-code to claude", () => {
    expect(HARNESS_TO_AMUX_ADAPTER["claude-code"]).toBe("claude");
  });

  it("maps codex to codex", () => {
    expect(HARNESS_TO_AMUX_ADAPTER["codex"]).toBe("codex");
  });

  it("maps gemini-cli to gemini", () => {
    expect(HARNESS_TO_AMUX_ADAPTER["gemini-cli"]).toBe("gemini");
  });

  it("maps github-copilot to copilot", () => {
    expect(HARNESS_TO_AMUX_ADAPTER["github-copilot"]).toBe("copilot");
  });

  it("maps cursor to cursor", () => {
    expect(HARNESS_TO_AMUX_ADAPTER["cursor"]).toBe("cursor");
  });

  it("maps opencode to opencode", () => {
    expect(HARNESS_TO_AMUX_ADAPTER["opencode"]).toBe("opencode");
  });

  it("maps openclaw to openclaw", () => {
    expect(HARNESS_TO_AMUX_ADAPTER["openclaw"]).toBe("openclaw");
  });

  it("maps oh-my-pi to omp", () => {
    expect(HARNESS_TO_AMUX_ADAPTER["oh-my-pi"]).toBe("omp");
  });

  it("does not include pi", () => {
    expect(HARNESS_TO_AMUX_ADAPTER["pi"]).toBeUndefined();
  });

  it("does not include agent-core", () => {
    expect(HARNESS_TO_AMUX_ADAPTER["agent-core"]).toBeUndefined();
  });

  it("has exactly 9 entries", () => {
    expect(Object.keys(HARNESS_TO_AMUX_ADAPTER)).toHaveLength(9);
  });
});

describe("mapHarnessToAmuxAdapter", () => {
  it("returns the adapter name for a known harness", () => {
    expect(mapHarnessToAmuxAdapter("claude-code")).toBe("claude");
    expect(mapHarnessToAmuxAdapter("codex")).toBe("codex");
    expect(mapHarnessToAmuxAdapter("oh-my-pi")).toBe("omp");
  });

  it("throws for pi (uses agent-core)", () => {
    expect(() => mapHarnessToAmuxAdapter("pi")).toThrow(
      /agent-core/,
    );
  });

  it("throws for agent-core (uses agent-core)", () => {
    expect(() => mapHarnessToAmuxAdapter("agent-core")).toThrow(
      /agent-core/,
    );
  });

  it("throws for internal alias (uses agent-core)", () => {
    expect(() => mapHarnessToAmuxAdapter("internal")).toThrow(
      /agent-core/,
    );
  });

  it("throws for unknown harness names", () => {
    expect(() => mapHarnessToAmuxAdapter("nonexistent")).toThrow(
      /No agent-mux adapter mapping/,
    );
  });
});

describe("hasAmuxAdapter", () => {
  it("returns true for known harnesses", () => {
    expect(hasAmuxAdapter("claude-code")).toBe(true);
    expect(hasAmuxAdapter("codex")).toBe(true);
    expect(hasAmuxAdapter("gemini-cli")).toBe(true);
  });

  it("returns false for pi", () => {
    expect(hasAmuxAdapter("pi")).toBe(false);
  });

  it("returns false for internal alias", () => {
    expect(hasAmuxAdapter("internal")).toBe(false);
  });

  it("returns false for unknown harnesses", () => {
    expect(hasAmuxAdapter("nonexistent")).toBe(false);
  });
});
