/**
 * pasteIntegration.test.ts
 *
 * Integration tests for bracketed paste detection in PromptBar.
 * Tests that paste sequences are properly detected and the pasted content
 * is correctly extracted and inserted.
 *
 * Phase 3: Paste detection in PromptBar (Wave 5)
 */

import { describe, it, expect } from "vitest";
import {
  PASTE_START,
  PASTE_END,
  isPasteSequence,
  detectBracketedPaste,
  extractPasteContent,
} from "../helpers.js";

// ---------------------------------------------------------------------------
// Paste detection flow (simulating PromptBar behavior)
// ---------------------------------------------------------------------------

/**
 * Simulates the PromptBar paste handling flow.
 * When input contains bracketed paste sequences, extract content
 * and append to the current value.
 */
function simulatePasteHandling(
  currentValue: string,
  rawInput: string,
): { newValue: string; wasPaste: boolean } {
  const result = detectBracketedPaste(rawInput);
  if (result.isPaste && result.content !== undefined) {
    return {
      newValue: currentValue + result.content,
      wasPaste: true,
    };
  }
  // Not a paste — treat as regular character input
  return {
    newValue: currentValue + rawInput,
    wasPaste: false,
  };
}

// ---------------------------------------------------------------------------
// Basic paste detection
// ---------------------------------------------------------------------------

describe("paste integration: basic detection", () => {
  it("detects bracketed paste input", () => {
    const raw = `${PASTE_START}hello world${PASTE_END}`;
    const result = simulatePasteHandling("", raw);
    expect(result.wasPaste).toBe(true);
    expect(result.newValue).toBe("hello world");
  });

  it("does not detect regular input as paste", () => {
    const result = simulatePasteHandling("", "hello");
    expect(result.wasPaste).toBe(false);
    expect(result.newValue).toBe("hello");
  });

  it("appends pasted content to existing input", () => {
    const raw = `${PASTE_START}world${PASTE_END}`;
    const result = simulatePasteHandling("hello ", raw);
    expect(result.wasPaste).toBe(true);
    expect(result.newValue).toBe("hello world");
  });
});

// ---------------------------------------------------------------------------
// Multi-line paste
// ---------------------------------------------------------------------------

describe("paste integration: multi-line paste", () => {
  it("handles multi-line pasted content", () => {
    const multiLine = "line one\nline two\nline three";
    const raw = `${PASTE_START}${multiLine}${PASTE_END}`;
    const result = simulatePasteHandling("", raw);
    expect(result.wasPaste).toBe(true);
    expect(result.newValue).toBe("line one\nline two\nline three");
  });

  it("preserves indentation in pasted code", () => {
    const code = "function foo() {\n  return 42;\n}";
    const raw = `${PASTE_START}${code}${PASTE_END}`;
    const result = simulatePasteHandling("", raw);
    expect(result.newValue).toContain("  return 42;");
  });

  it("handles pasted content with empty lines", () => {
    const content = "first\n\nsecond";
    const raw = `${PASTE_START}${content}${PASTE_END}`;
    const result = simulatePasteHandling("", raw);
    expect(result.newValue).toBe("first\n\nsecond");
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("paste integration: edge cases", () => {
  it("handles empty paste", () => {
    const raw = `${PASTE_START}${PASTE_END}`;
    const result = simulatePasteHandling("", raw);
    expect(result.wasPaste).toBe(true);
    expect(result.newValue).toBe("");
  });

  it("handles paste with special characters", () => {
    const content = "echo 'hello $USER' | grep -v test";
    const raw = `${PASTE_START}${content}${PASTE_END}`;
    const result = simulatePasteHandling("", raw);
    expect(result.newValue).toBe(content);
  });

  it("handles paste with unicode", () => {
    const content = "Hello 世界 🌍";
    const raw = `${PASTE_START}${content}${PASTE_END}`;
    const result = simulatePasteHandling("", raw);
    expect(result.newValue).toBe(content);
  });

  it("PASTE_START/END constants are correct escape sequences", () => {
    expect(PASTE_START).toBe("\x1b[200~");
    expect(PASTE_END).toBe("\x1b[201~");
  });
});

// ---------------------------------------------------------------------------
// Helper function verification
// ---------------------------------------------------------------------------

describe("paste helpers integration", () => {
  it("isPasteSequence returns true for paste input", () => {
    expect(isPasteSequence(`${PASTE_START}test${PASTE_END}`)).toBe(true);
  });

  it("isPasteSequence returns false for regular input", () => {
    expect(isPasteSequence("regular text")).toBe(false);
  });

  it("extractPasteContent strips sequences", () => {
    const raw = `${PASTE_START}content${PASTE_END}`;
    expect(extractPasteContent(raw)).toBe("content");
  });

  it("detectBracketedPaste returns structured result", () => {
    const raw = `${PASTE_START}test${PASTE_END}`;
    const result = detectBracketedPaste(raw);
    expect(result.isPaste).toBe(true);
    expect(result.content).toBe("test");
  });
});
