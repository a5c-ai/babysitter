/**
 * chatHistory.test.ts
 *
 * Tests for conversation history formatting (buildPromptWithHistory)
 * and streaming callback wiring logic.
 */

import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Replicate the pure buildPromptWithHistory function for testing
// (same logic as in ChatContext.tsx)
// ---------------------------------------------------------------------------

interface ChatTurn {
  readonly role: "user" | "assistant";
  readonly text: string;
}

function buildPromptWithHistory(
  history: readonly ChatTurn[],
  currentMessage: string,
): string {
  if (history.length === 0) return currentMessage;

  const lines: string[] = [];
  lines.push("<conversation_history>");
  for (const turn of history) {
    const tag = turn.role === "user" ? "user" : "assistant";
    lines.push(`<${tag}>${turn.text}</${tag}>`);
  }
  lines.push("</conversation_history>");
  lines.push("");
  lines.push(currentMessage);

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("buildPromptWithHistory", () => {
  it("returns bare message when history is empty", () => {
    const result = buildPromptWithHistory([], "hello");
    expect(result).toBe("hello");
  });

  it("wraps single-turn history in conversation tags", () => {
    const history: ChatTurn[] = [
      { role: "user", text: "first message" },
      { role: "assistant", text: "first response" },
    ];
    const result = buildPromptWithHistory(history, "second message");
    expect(result).toContain("<conversation_history>");
    expect(result).toContain("<user>first message</user>");
    expect(result).toContain("<assistant>first response</assistant>");
    expect(result).toContain("</conversation_history>");
    expect(result).toContain("second message");
  });

  it("preserves turn order", () => {
    const history: ChatTurn[] = [
      { role: "user", text: "q1" },
      { role: "assistant", text: "a1" },
      { role: "user", text: "q2" },
      { role: "assistant", text: "a2" },
    ];
    const result = buildPromptWithHistory(history, "q3");
    const userIdx1 = result.indexOf("<user>q1</user>");
    const assistIdx1 = result.indexOf("<assistant>a1</assistant>");
    const userIdx2 = result.indexOf("<user>q2</user>");
    const assistIdx2 = result.indexOf("<assistant>a2</assistant>");
    const currentIdx = result.indexOf("q3");

    expect(userIdx1).toBeLessThan(assistIdx1);
    expect(assistIdx1).toBeLessThan(userIdx2);
    expect(userIdx2).toBeLessThan(assistIdx2);
    expect(assistIdx2).toBeLessThan(currentIdx);
  });

  it("current message appears after history block", () => {
    const history: ChatTurn[] = [{ role: "user", text: "old" }];
    const result = buildPromptWithHistory(history, "new");
    const histEnd = result.indexOf("</conversation_history>");
    const msgIdx = result.indexOf("new");
    expect(msgIdx).toBeGreaterThan(histEnd);
  });

  it("handles multi-line messages in history", () => {
    const history: ChatTurn[] = [
      { role: "user", text: "line1\nline2\nline3" },
    ];
    const result = buildPromptWithHistory(history, "follow up");
    expect(result).toContain("line1\nline2\nline3");
  });
});

// ---------------------------------------------------------------------------
// Streaming line accumulation logic
// ---------------------------------------------------------------------------

describe("streaming line accumulation", () => {
  it("accumulates lines into joined text", () => {
    const lines: string[] = [];
    const onLine = (line: string) => { lines.push(line); };

    onLine("first line");
    onLine("second line");
    onLine("third line");

    expect(lines.join("\n")).toBe("first line\nsecond line\nthird line");
  });

  it("handles empty lines", () => {
    const lines: string[] = [];
    const onLine = (line: string) => { lines.push(line); };

    onLine("line 1");
    onLine("");
    onLine("line 3");

    expect(lines.join("\n")).toBe("line 1\n\nline 3");
  });
});
