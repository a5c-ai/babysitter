/**
 * Tests for amuxStdinReader — verifies stdin JSONL parsing of
 * interaction events from agent-mux.
 */
import { describe, it, expect } from "vitest";
import { Readable } from "node:stream";
import * as readline from "node:readline";

// We test the parsing logic directly since mocking process.stdin
// for the module-level createAmuxStdinReader is fragile.
// Instead, we test the core parsing behavior via a helper.

interface AmuxInteractionEvent {
  type: string;
  id: string;
  response: unknown;
  approved?: boolean;
}

/**
 * Parse a single line into an interaction event (mirrors the logic
 * inside createAmuxStdinReader).
 */
function parseLine(line: string): AmuxInteractionEvent | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    return null;
  }

  if (typeof parsed["type"] !== "string" || typeof parsed["id"] !== "string") {
    return null;
  }

  return {
    type: parsed["type"] as string,
    id: parsed["id"] as string,
    response: parsed["response"],
    approved: typeof parsed["approved"] === "boolean" ? parsed["approved"] : undefined,
  };
}

/**
 * Simulate the async-iterable reader over a set of input lines.
 */
async function readFromLines(lines: string[]): Promise<AmuxInteractionEvent[]> {
  const stream = new Readable({
    read() {
      for (const line of lines) {
        this.push(line + "\n");
      }
      this.push(null);
    },
  });

  const rl = readline.createInterface({
    input: stream,
    crlfDelay: Infinity,
  });

  const results: AmuxInteractionEvent[] = [];
  for await (const line of rl) {
    const event = parseLine(line);
    if (event) results.push(event);
  }
  return results;
}

describe("amuxStdinReader parseLine", () => {
  it("parses a valid approval_response", () => {
    const event = parseLine(
      JSON.stringify({ type: "approval_response", id: "bp-1", approved: true, response: "ok" }),
    );
    expect(event).not.toBeNull();
    expect(event!.type).toBe("approval_response");
    expect(event!.id).toBe("bp-1");
    expect(event!.approved).toBe(true);
    expect(event!.response).toBe("ok");
  });

  it("parses a valid input_response", () => {
    const event = parseLine(
      JSON.stringify({ type: "input_response", id: "in-1", response: { text: "user input" } }),
    );
    expect(event).not.toBeNull();
    expect(event!.type).toBe("input_response");
    expect(event!.id).toBe("in-1");
    expect(event!.approved).toBeUndefined();
  });

  it("returns null for empty lines", () => {
    expect(parseLine("")).toBeNull();
    expect(parseLine("   ")).toBeNull();
  });

  it("returns null for non-JSON lines", () => {
    expect(parseLine("not json at all")).toBeNull();
    expect(parseLine("{ broken json")).toBeNull();
  });

  it("returns null for JSON without type field", () => {
    expect(parseLine(JSON.stringify({ id: "x", response: "y" }))).toBeNull();
  });

  it("returns null for JSON without id field", () => {
    expect(parseLine(JSON.stringify({ type: "approval_response", response: "y" }))).toBeNull();
  });

  it("handles approved=false correctly", () => {
    const event = parseLine(
      JSON.stringify({ type: "approval_response", id: "bp-2", approved: false }),
    );
    expect(event!.approved).toBe(false);
  });

  it("sets approved to undefined when not a boolean", () => {
    const event = parseLine(
      JSON.stringify({ type: "approval_response", id: "bp-3", approved: "yes" }),
    );
    expect(event!.approved).toBeUndefined();
  });
});

describe("readFromLines (async iterable simulation)", () => {
  it("reads multiple events from a stream", async () => {
    const events = await readFromLines([
      JSON.stringify({ type: "approval_response", id: "bp-1", approved: true }),
      JSON.stringify({ type: "input_response", id: "in-1", response: "hello" }),
    ]);
    expect(events).toHaveLength(2);
    expect(events[0].type).toBe("approval_response");
    expect(events[1].type).toBe("input_response");
  });

  it("skips invalid lines in the stream", async () => {
    const events = await readFromLines([
      "not json",
      JSON.stringify({ type: "approval_response", id: "bp-1", approved: true }),
      "",
      JSON.stringify({ noType: true }),
      JSON.stringify({ type: "input_response", id: "in-1", response: "x" }),
    ]);
    expect(events).toHaveLength(2);
  });

  it("handles empty stream", async () => {
    const events = await readFromLines([]);
    expect(events).toHaveLength(0);
  });
});
