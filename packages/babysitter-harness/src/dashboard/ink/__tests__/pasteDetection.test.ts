/**
 * pasteDetection.test.ts
 *
 * Tests for bracketed paste mode detection and content extraction.
 */

import { describe, it, expect } from "vitest";
import {
  detectBracketedPaste,
  extractPasteContent,
  isPasteSequence,
  PASTE_START,
  PASTE_END,
} from "../helpers.js";

describe("PASTE_START / PASTE_END constants", () => {
  it("PASTE_START is the bracketed paste start sequence", () => {
    expect(PASTE_START).toBe("\x1b[200~");
  });

  it("PASTE_END is the bracketed paste end sequence", () => {
    expect(PASTE_END).toBe("\x1b[201~");
  });
});

describe("isPasteSequence", () => {
  it("returns true for string containing paste start", () => {
    expect(isPasteSequence("\x1b[200~hello\x1b[201~")).toBe(true);
  });

  it("returns false for normal input", () => {
    expect(isPasteSequence("hello world")).toBe(false);
  });

  it("returns false for empty string", () => {
    expect(isPasteSequence("")).toBe(false);
  });

  it("returns true for just the start sequence", () => {
    expect(isPasteSequence("\x1b[200~")).toBe(true);
  });
});

describe("detectBracketedPaste", () => {
  it("returns { isPaste: true } for complete paste sequence", () => {
    const result = detectBracketedPaste("\x1b[200~pasted text\x1b[201~");
    expect(result.isPaste).toBe(true);
    expect(result.content).toBe("pasted text");
  });

  it("returns { isPaste: false } for normal text", () => {
    const result = detectBracketedPaste("normal text");
    expect(result.isPaste).toBe(false);
  });

  it("handles multi-line paste content", () => {
    const result = detectBracketedPaste("\x1b[200~line1\nline2\nline3\x1b[201~");
    expect(result.isPaste).toBe(true);
    expect(result.content).toContain("line1\nline2\nline3");
  });
});

describe("extractPasteContent", () => {
  it("strips bracket sequences from pasted text", () => {
    expect(extractPasteContent("\x1b[200~hello\x1b[201~")).toBe("hello");
  });

  it("returns original string if no paste sequences", () => {
    expect(extractPasteContent("plain text")).toBe("plain text");
  });

  it("handles empty paste", () => {
    expect(extractPasteContent("\x1b[200~\x1b[201~")).toBe("");
  });
});
