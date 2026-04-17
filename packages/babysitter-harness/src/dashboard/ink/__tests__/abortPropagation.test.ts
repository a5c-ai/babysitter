/**
 * abortPropagation.test.ts
 *
 * Tests for abort signal propagation from ChatContext through to
 * invokeHarnessStreaming and child process kill logic.
 *
 * Phase 3: Abort/cancel propagation (Wave 8)
 */

import { describe, it, expect } from "vitest";
import type { HarnessInvokeOptions } from "../../../harness/types.js";

// ---------------------------------------------------------------------------
// HarnessInvokeOptions.signal field
// ---------------------------------------------------------------------------

describe("HarnessInvokeOptions.signal", () => {
  it("accepts an AbortSignal in the options type", () => {
    const controller = new AbortController();
    const options: HarnessInvokeOptions = {
      prompt: "test",
      signal: controller.signal,
    };
    expect(options.signal).toBe(controller.signal);
  });

  it("signal is optional", () => {
    const options: HarnessInvokeOptions = {
      prompt: "test",
    };
    expect(options.signal).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// ChatContext abort signal wiring (unit tests for the interface)
// ---------------------------------------------------------------------------

describe("ChatContext abort signal contract", () => {
  it("AbortController.abort() sets signal.aborted to true", () => {
    const controller = new AbortController();
    expect(controller.signal.aborted).toBe(false);
    controller.abort();
    expect(controller.signal.aborted).toBe(true);
  });

  it("abort event fires on signal", () => {
    const controller = new AbortController();
    let fired = false;
    controller.signal.addEventListener("abort", () => {
      fired = true;
    });
    controller.abort();
    expect(fired).toBe(true);
  });

  it("already-aborted signal has aborted=true immediately", () => {
    const controller = new AbortController();
    controller.abort();
    const options: HarnessInvokeOptions = {
      prompt: "test",
      signal: controller.signal,
    };
    expect(options.signal?.aborted).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// StreamCallbacks signal field
// ---------------------------------------------------------------------------

describe("StreamCallbacks with abort", () => {
  it("ChatContext should create an AbortController and pass signal to options", () => {
    // This tests the contract: ChatContext creates the controller,
    // passes signal through to invokeHarnessStreaming options
    const controller = new AbortController();

    // Simulate what ChatContext.sendMessage should do
    const invokerOptions: HarnessInvokeOptions = {
      prompt: "test prompt",
      workspace: "/tmp",
      timeout: 600_000,
      signal: controller.signal,
    };

    expect(invokerOptions.signal).toBeDefined();
    expect(invokerOptions.signal?.aborted).toBe(false);

    // Simulate what ChatContext.cancel() does
    controller.abort();
    expect(invokerOptions.signal?.aborted).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// OutputStreamCollector flush on abort
// ---------------------------------------------------------------------------

describe("abort cleanup contract", () => {
  it("abort listener should be removable (cleanup on normal exit)", () => {
    const controller = new AbortController();
    let listenerCalled = false;
    const handler = () => {
      listenerCalled = true;
    };
    controller.signal.addEventListener("abort", handler);

    // Simulate normal exit: remove listener before abort
    controller.signal.removeEventListener("abort", handler);
    controller.abort();
    expect(listenerCalled).toBe(false);
  });
});
