/**
 * Tests for capability mapping between hooks-mux and SDK.
 *
 * Covers:
 *   - deriveCapabilitiesFromProxy with various adapter profiles
 *   - buildPromptContextFromProxy mapping fields correctly
 */

import { describe, it, expect } from "vitest";
import {
  deriveCapabilitiesFromProxy,
  buildPromptContextFromProxy,
  type ProxyCapabilities,
} from "../capabilities";
import { HarnessCapability } from "../../types";

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

function makeProxy(overrides?: Partial<ProxyCapabilities>): ProxyCapabilities {
  return {
    name: "test-adapter",
    family: "shell-hook",
    supportsBlock: false,
    supportsAsk: false,
    supportsToolInputMutation: false,
    supportsToolResultMutation: false,
    supportsPersistedEnv: false,
    envPersistenceMode: "none",
    toolInterceptionScope: "all",
    sessionIdQuality: "stable",
    supportsOrderedFanout: false,
    supportsNativeAdditionalContext: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// deriveCapabilitiesFromProxy
// ---------------------------------------------------------------------------

describe("deriveCapabilitiesFromProxy", () => {
  it("always includes Programmatic, SessionBinding, HeadlessPrompt", () => {
    const caps = deriveCapabilitiesFromProxy(makeProxy());
    expect(caps).toContain(HarnessCapability.Programmatic);
    expect(caps).toContain(HarnessCapability.SessionBinding);
    expect(caps).toContain(HarnessCapability.HeadlessPrompt);
  });

  it("includes StopHook when supportsBlock is true", () => {
    const caps = deriveCapabilitiesFromProxy(
      makeProxy({ supportsBlock: true }),
    );
    expect(caps).toContain(HarnessCapability.StopHook);
  });

  it("excludes StopHook when supportsBlock is false", () => {
    const caps = deriveCapabilitiesFromProxy(
      makeProxy({ supportsBlock: false }),
    );
    expect(caps).not.toContain(HarnessCapability.StopHook);
  });

  it("does not include Mcp (not surfaced by proxy)", () => {
    const caps = deriveCapabilitiesFromProxy(
      makeProxy({ supportsBlock: true }),
    );
    expect(caps).not.toContain(HarnessCapability.Mcp);
  });

  it("returns a fresh array on each call", () => {
    const proxy = makeProxy();
    const caps1 = deriveCapabilitiesFromProxy(proxy);
    const caps2 = deriveCapabilitiesFromProxy(proxy);
    expect(caps1).not.toBe(caps2);
    expect(caps1).toEqual(caps2);
  });
});

// ---------------------------------------------------------------------------
// buildPromptContextFromProxy
// ---------------------------------------------------------------------------

describe("buildPromptContextFromProxy", () => {
  it("sets harness name from proxy", () => {
    const ctx = buildPromptContextFromProxy(
      makeProxy({ name: "my-editor" }),
    );
    expect(ctx.harness).toBe("my-editor");
  });

  it("sets harnessLabel as title-cased name", () => {
    const ctx = buildPromptContextFromProxy(
      makeProxy({ name: "my-cool-editor" }),
    );
    expect(ctx.harnessLabel).toBe("My Cool Editor");
  });

  it("sets hookDriven=true when family is shell-hook and supportsBlock", () => {
    const ctx = buildPromptContextFromProxy(
      makeProxy({ family: "shell-hook", supportsBlock: true }),
    );
    expect(ctx.hookDriven).toBe(true);
    expect(ctx.loopControlTerm).toBe("stop-hook");
  });

  it("sets hookDriven=false when supportsBlock is false", () => {
    const ctx = buildPromptContextFromProxy(
      makeProxy({ family: "shell-hook", supportsBlock: false }),
    );
    expect(ctx.hookDriven).toBe(false);
    expect(ctx.loopControlTerm).toBe("in-turn");
  });

  it("sets hookDriven=false when family is not shell-hook", () => {
    const ctx = buildPromptContextFromProxy(
      makeProxy({ family: "ide-extension", supportsBlock: true }),
    );
    expect(ctx.hookDriven).toBe(false);
    expect(ctx.loopControlTerm).toBe("stop-hook");
  });

  it("includes ask-user-question capability when supportsAsk", () => {
    const ctx = buildPromptContextFromProxy(
      makeProxy({ supportsAsk: true }),
    );
    expect(ctx.capabilities).toContain("ask-user-question");
    expect(ctx.interactiveToolName).toBe("question tool");
  });

  it("excludes ask-user-question capability when not supportsAsk", () => {
    const ctx = buildPromptContextFromProxy(
      makeProxy({ supportsAsk: false }),
    );
    expect(ctx.capabilities).not.toContain("ask-user-question");
    expect(ctx.interactiveToolName).toBe("");
  });

  it("includes hooks and stop-hook capabilities when supportsBlock", () => {
    const ctx = buildPromptContextFromProxy(
      makeProxy({ supportsBlock: true }),
    );
    expect(ctx.capabilities).toContain("hooks");
    expect(ctx.capabilities).toContain("stop-hook");
  });

  it("uses 'Unified' as fallback label for empty name", () => {
    const ctx = buildPromptContextFromProxy(makeProxy({ name: "" }));
    expect(ctx.harness).toBe("unified");
    expect(ctx.harnessLabel).toBe("Unified");
  });

  it("applies overrides", () => {
    const ctx = buildPromptContextFromProxy(
      makeProxy({ name: "test" }),
      { interactive: false, hookDriven: true },
    );
    expect(ctx.interactive).toBe(false);
    expect(ctx.hookDriven).toBe(true);
  });

  it("has platform set", () => {
    const ctx = buildPromptContextFromProxy(makeProxy());
    expect(ctx.platform).toBe(process.platform);
  });
});
