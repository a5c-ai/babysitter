/**
 * markdownLite.test.ts
 *
 * Tests for the markdown-lite parser used in TUI message rendering.
 * parseMarkdownLite converts basic markdown to an array of styled spans.
 *
 * Phase 2: Rich message rendering (Wave 5)
 */

import { describe, it, expect } from "vitest";
import { parseMarkdownLite } from "../helpers.js";
import type { MarkdownSpan } from "../helpers.js";

// ---------------------------------------------------------------------------
// Plain text
// ---------------------------------------------------------------------------

describe("parseMarkdownLite plain text", () => {
  it("returns a single plain span for text without markdown", () => {
    const spans = parseMarkdownLite("Hello world");
    expect(spans).toHaveLength(1);
    expect(spans[0].text).toBe("Hello world");
    expect(spans[0].style).toBe("plain");
  });

  it("returns empty array for empty string", () => {
    const spans = parseMarkdownLite("");
    expect(spans).toHaveLength(0);
  });

  it("preserves whitespace in plain text", () => {
    const spans = parseMarkdownLite("  indented  ");
    expect(spans[0].text).toBe("  indented  ");
  });
});

// ---------------------------------------------------------------------------
// Bold
// ---------------------------------------------------------------------------

describe("parseMarkdownLite bold", () => {
  it("parses **bold** text", () => {
    const spans = parseMarkdownLite("some **bold** text");
    expect(spans).toHaveLength(3);
    expect(spans[0]).toEqual({ text: "some ", style: "plain" });
    expect(spans[1]).toEqual({ text: "bold", style: "bold" });
    expect(spans[2]).toEqual({ text: " text", style: "plain" });
  });

  it("parses multiple **bold** segments", () => {
    const spans = parseMarkdownLite("**a** and **b**");
    const boldSpans = spans.filter((s) => s.style === "bold");
    expect(boldSpans).toHaveLength(2);
    expect(boldSpans[0].text).toBe("a");
    expect(boldSpans[1].text).toBe("b");
  });
});

// ---------------------------------------------------------------------------
// Italic
// ---------------------------------------------------------------------------

describe("parseMarkdownLite italic", () => {
  it("parses *italic* text", () => {
    const spans = parseMarkdownLite("some *italic* text");
    const italicSpan = spans.find((s) => s.style === "italic");
    expect(italicSpan).toBeDefined();
    expect(italicSpan!.text).toBe("italic");
  });
});

// ---------------------------------------------------------------------------
// Inline code
// ---------------------------------------------------------------------------

describe("parseMarkdownLite inline code", () => {
  it("parses `inline code`", () => {
    const spans = parseMarkdownLite("use `npm install` here");
    const codeSpan = spans.find((s) => s.style === "code");
    expect(codeSpan).toBeDefined();
    expect(codeSpan!.text).toBe("npm install");
  });

  it("handles multiple inline code spans", () => {
    const spans = parseMarkdownLite("`a` and `b`");
    const codeSpans = spans.filter((s) => s.style === "code");
    expect(codeSpans).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Code blocks
// ---------------------------------------------------------------------------

describe("parseMarkdownLite code blocks", () => {
  it("parses fenced code blocks with language", () => {
    const input = "before\n```typescript\nconst x = 1;\n```\nafter";
    const spans = parseMarkdownLite(input);
    const codeBlock = spans.find((s) => s.style === "codeBlock");
    expect(codeBlock).toBeDefined();
    expect(codeBlock!.text).toContain("const x = 1;");
    expect(codeBlock!.language).toBe("typescript");
  });

  it("parses fenced code blocks without language", () => {
    const input = "```\nhello\n```";
    const spans = parseMarkdownLite(input);
    const codeBlock = spans.find((s) => s.style === "codeBlock");
    expect(codeBlock).toBeDefined();
    expect(codeBlock!.text).toBe("hello");
  });

  it("preserves code block content exactly", () => {
    const input = "```\n  indented\n    more\n```";
    const spans = parseMarkdownLite(input);
    const codeBlock = spans.find((s) => s.style === "codeBlock");
    expect(codeBlock).toBeDefined();
    expect(codeBlock!.text).toBe("  indented\n    more");
  });
});

// ---------------------------------------------------------------------------
// Blockquotes
// ---------------------------------------------------------------------------

describe("parseMarkdownLite blockquotes", () => {
  it("parses > blockquote lines", () => {
    const input = "> This is a quote";
    const spans = parseMarkdownLite(input);
    const quoteSpan = spans.find((s) => s.style === "blockquote");
    expect(quoteSpan).toBeDefined();
    expect(quoteSpan!.text).toContain("This is a quote");
  });
});

// ---------------------------------------------------------------------------
// Lists
// ---------------------------------------------------------------------------

describe("parseMarkdownLite lists", () => {
  it("parses bullet list items (- prefix)", () => {
    const input = "- item one\n- item two";
    const spans = parseMarkdownLite(input);
    const listSpans = spans.filter((s) => s.style === "listItem");
    expect(listSpans.length).toBeGreaterThanOrEqual(2);
  });

  it("parses bullet list items (* prefix)", () => {
    const input = "* first\n* second";
    const spans = parseMarkdownLite(input);
    const listSpans = spans.filter((s) => s.style === "listItem");
    expect(listSpans.length).toBeGreaterThanOrEqual(2);
  });

  it("parses numbered list items", () => {
    const input = "1. first\n2. second";
    const spans = parseMarkdownLite(input);
    const listSpans = spans.filter((s) => s.style === "listItem");
    expect(listSpans.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Mixed content
// ---------------------------------------------------------------------------

describe("parseMarkdownLite mixed content", () => {
  it("handles bold inside a sentence with code", () => {
    const spans = parseMarkdownLite("Run **npm install** then `npm test`");
    const bold = spans.find((s) => s.style === "bold");
    const code = spans.find((s) => s.style === "code");
    expect(bold).toBeDefined();
    expect(bold!.text).toBe("npm install");
    expect(code).toBeDefined();
    expect(code!.text).toBe("npm test");
  });

  it("handles code block followed by inline text", () => {
    const input = "```\ncode\n```\nDone!";
    const spans = parseMarkdownLite(input);
    expect(spans.some((s) => s.style === "codeBlock")).toBe(true);
    expect(spans.some((s) => s.text.includes("Done!"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("parseMarkdownLite edge cases", () => {
  it("unmatched ** is treated as plain text", () => {
    const spans = parseMarkdownLite("some ** unclosed bold");
    // Should not crash, all text should be present
    const fullText = spans.map((s) => s.text).join("");
    expect(fullText).toContain("**");
    expect(fullText).toContain("unclosed bold");
  });

  it("unmatched ` is treated as plain text", () => {
    const spans = parseMarkdownLite("some ` unclosed code");
    const fullText = spans.map((s) => s.text).join("");
    expect(fullText).toContain("`");
  });

  it("empty code block", () => {
    const input = "```\n```";
    const spans = parseMarkdownLite(input);
    const codeBlock = spans.find((s) => s.style === "codeBlock");
    expect(codeBlock).toBeDefined();
    expect(codeBlock!.text).toBe("");
  });

  it("preserves newlines in output", () => {
    const input = "line one\nline two";
    const spans = parseMarkdownLite(input);
    const fullText = spans.map((s) => s.text).join("");
    expect(fullText).toContain("\n");
  });
});
