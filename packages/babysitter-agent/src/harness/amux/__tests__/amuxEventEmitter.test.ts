/**
 * Tests for AmuxEventEmitter — verifies that each emit method produces
 * valid JSONL matching the event types that the agent-mux babysitter
 * adapter's parseEvent() expects.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AmuxEventEmitter } from "../amuxEventEmitter";

// Capture stdout writes
let stdoutWrites: string[];
let originalWrite: typeof process.stdout.write;

beforeEach(() => {
  stdoutWrites = [];
  originalWrite = process.stdout.write;
  process.stdout.write = vi.fn((chunk: string | Uint8Array): boolean => {
    stdoutWrites.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString());
    return true;
  }) as unknown as typeof process.stdout.write;
});

afterEach(() => {
  process.stdout.write = originalWrite;
});

function lastEvent(): Record<string, unknown> {
  expect(stdoutWrites.length).toBeGreaterThan(0);
  const lastLine = stdoutWrites[stdoutWrites.length - 1];
  // Each write should be a JSON line ending with \n
  expect(lastLine.endsWith("\n")).toBe(true);
  return JSON.parse(lastLine.trim()) as Record<string, unknown>;
}

function allEvents(): Record<string, unknown>[] {
  return stdoutWrites.map((line) => JSON.parse(line.trim()) as Record<string, unknown>);
}

describe("AmuxEventEmitter", () => {
  const RUN_ID = "test-run-001";
  const AGENT = "babysitter";

  it("emit() produces valid JSONL with base fields", () => {
    const emitter = new AmuxEventEmitter(RUN_ID, AGENT);
    emitter.emit({ type: "test_event", customField: 42 });

    const event = lastEvent();
    expect(event["type"]).toBe("test_event");
    expect(event["runId"]).toBe(RUN_ID);
    expect(event["agent"]).toBe(AGENT);
    expect(event["timestamp"]).toBeDefined();
    expect(event["customField"]).toBe(42);
  });

  it("emit() defaults agent to 'babysitter'", () => {
    const emitter = new AmuxEventEmitter(RUN_ID);
    emitter.emit({ type: "test" });

    expect(lastEvent()["agent"]).toBe("babysitter");
  });

  it("emit() outputs one line per call (JSONL)", () => {
    const emitter = new AmuxEventEmitter(RUN_ID);
    emitter.emit({ type: "a" });
    emitter.emit({ type: "b" });

    expect(stdoutWrites).toHaveLength(2);
    for (const line of stdoutWrites) {
      expect(line.endsWith("\n")).toBe(true);
      expect(() => JSON.parse(line)).not.toThrow();
    }
  });

  describe("sessionStart", () => {
    it("emits session_start with sessionId", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.sessionStart("session-42");

      const event = lastEvent();
      expect(event["type"]).toBe("session_start");
      expect(event["sessionId"]).toBe("session-42");
      expect(event["runId"]).toBe(RUN_ID);
    });

    it("defaults sessionId to runId", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.sessionStart();

      expect(lastEvent()["sessionId"]).toBe(RUN_ID);
    });
  });

  describe("sessionEnd", () => {
    it("emits session_end with exitReason", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.sessionEnd("completed", 5);

      const event = lastEvent();
      expect(event["type"]).toBe("session_end");
      expect(event["exitReason"]).toBe("completed");
      expect(event["turnCount"]).toBe(5);
      expect(event["sessionId"]).toBe(RUN_ID);
    });

    it("defaults turnCount to 0", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.sessionEnd("error");

      expect(lastEvent()["turnCount"]).toBe(0);
    });
  });

  describe("textDelta", () => {
    it("emits text_delta with text and delta fields", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.textDelta("Hello world");

      const event = lastEvent();
      expect(event["type"]).toBe("text_delta");
      expect(event["text"]).toBe("Hello world");
      expect(event["delta"]).toBe("Hello world");
    });
  });

  describe("toolCallStart", () => {
    it("emits tool_call_start with all fields", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.toolCallStart("tc-1", "read_file", { path: "/foo" });

      const event = lastEvent();
      expect(event["type"]).toBe("tool_call_start");
      expect(event["toolCallId"]).toBe("tc-1");
      expect(event["toolName"]).toBe("read_file");
      expect(event["input"]).toEqual({ path: "/foo" });
    });

    it("defaults input to empty object", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.toolCallStart("tc-2", "list_files");

      expect(lastEvent()["input"]).toEqual({});
    });
  });

  describe("toolResult", () => {
    it("emits tool_result with output", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.toolResult("tc-1", "read_file", "file contents here");

      const event = lastEvent();
      expect(event["type"]).toBe("tool_result");
      expect(event["toolCallId"]).toBe("tc-1");
      expect(event["toolName"]).toBe("read_file");
      expect(event["output"]).toBe("file contents here");
    });
  });

  describe("cost", () => {
    it("emits cost event with token and cost data", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.cost(1000, 500, 0.05);

      const event = lastEvent();
      expect(event["type"]).toBe("cost");
      expect(event["inputTokens"]).toBe(1000);
      expect(event["outputTokens"]).toBe(500);
      expect(event["totalCost"]).toBe(0.05);
      // Also check nested cost object for assembleCostRecord compatibility
      expect(event["cost"]).toEqual({
        inputTokens: 1000,
        outputTokens: 500,
        totalCost: 0.05,
      });
    });
  });

  describe("turnStart / turnEnd", () => {
    it("emits turn_start with iteration and turnIndex", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.turnStart(3);

      const event = lastEvent();
      expect(event["type"]).toBe("turn_start");
      expect(event["turnIndex"]).toBe(3);
      expect(event["iteration"]).toBe(3);
    });

    it("emits turn_end with iteration and turnIndex", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.turnEnd(3);

      const event = lastEvent();
      expect(event["type"]).toBe("turn_end");
      expect(event["turnIndex"]).toBe(3);
      expect(event["iteration"]).toBe(3);
    });
  });

  describe("error", () => {
    it("emits error event with message and code", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.error("Something broke", "TIMEOUT");

      const event = lastEvent();
      expect(event["type"]).toBe("error");
      expect(event["message"]).toBe("Something broke");
      expect(event["error"]).toBe("Something broke");
      expect(event["code"]).toBe("TIMEOUT");
    });

    it("defaults code to INTERNAL", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.error("oops");

      expect(lastEvent()["code"]).toBe("INTERNAL");
    });
  });

  describe("approvalRequest", () => {
    it("emits approval_request with id and description", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.approvalRequest("bp-1", "Allow file write to /etc/hosts");

      const event = lastEvent();
      expect(event["type"]).toBe("approval_request");
      expect(event["id"]).toBe("bp-1");
      expect(event["description"]).toBe("Allow file write to /etc/hosts");
    });
  });

  describe("session bookending", () => {
    it("sessionStart and sessionEnd bracket a complete session", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);

      emitter.sessionStart();
      emitter.textDelta("doing work");
      emitter.turnStart(1);
      emitter.toolCallStart("tc-1", "bash", { command: "ls" });
      emitter.toolResult("tc-1", "bash", "file1\nfile2");
      emitter.turnEnd(1);
      emitter.cost(100, 50, 0.01);
      emitter.sessionEnd("completed", 1);

      const events = allEvents();
      expect(events).toHaveLength(8);
      expect(events[0]["type"]).toBe("session_start");
      expect(events[events.length - 1]["type"]).toBe("session_end");

      // Verify all events have the required base fields
      for (const event of events) {
        expect(event["runId"]).toBe(RUN_ID);
        expect(event["agent"]).toBe("babysitter");
        expect(typeof event["timestamp"]).toBe("string");
      }
    });
  });

  describe("agent-mux adapter compatibility", () => {
    it("session_start is parseable by adapter", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.sessionStart("s-1");

      const event = lastEvent();
      // adapter checks: type === 'session_start' || type === 'run_started'
      expect(event["type"]).toBe("session_start");
      // adapter reads: obj['sessionId'] ?? obj['runId']
      expect(event["sessionId"]).toBeDefined();
    });

    it("text_delta has fields adapter expects", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.textDelta("hello");

      const event = lastEvent();
      // adapter reads: obj['text'] ?? obj['delta'] ?? obj['content']
      expect(event["text"]).toBe("hello");
      expect(event["delta"]).toBe("hello");
    });

    it("tool_call_start has fields adapter expects", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.toolCallStart("tc-1", "edit", { file: "x.ts" });

      const event = lastEvent();
      // adapter reads: obj['toolCallId'] ?? obj['id'], obj['toolName'] ?? obj['name']
      expect(event["toolCallId"]).toBe("tc-1");
      expect(event["toolName"]).toBe("edit");
      expect(event["input"]).toEqual({ file: "x.ts" });
    });

    it("tool_result has fields adapter expects", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.toolResult("tc-1", "edit", "done");

      const event = lastEvent();
      // adapter reads: obj['toolCallId'] ?? obj['id'], obj['output']
      expect(event["toolCallId"]).toBe("tc-1");
      expect(event["toolName"]).toBe("edit");
      expect(event["output"]).toBe("done");
    });

    it("error has fields adapter expects", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.error("fail");

      const event = lastEvent();
      // adapter reads: obj['message'] ?? obj['error']
      expect(event["message"]).toBe("fail");
      expect(event["error"]).toBe("fail");
    });

    it("cost has fields adapter expects", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.cost(100, 200, 0.03);

      const event = lastEvent();
      // adapter uses: this.assembleCostRecord(obj['cost'] ?? obj)
      expect(event["cost"]).toBeDefined();
    });

    it("turn_start/turn_end have fields adapter expects", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.turnStart(2);

      let event = lastEvent();
      // adapter checks: type === 'turn_start' || type === 'iteration_start'
      expect(event["type"]).toBe("turn_start");

      emitter.turnEnd(2);
      event = lastEvent();
      // adapter checks: type === 'turn_end' || type === 'iteration_end'
      expect(event["type"]).toBe("turn_end");
    });

    it("session_end has fields adapter expects", () => {
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.sessionEnd("completed", 3);

      const event = lastEvent();
      // adapter checks: type === 'session_end' || type === 'run_completed'
      expect(event["type"]).toBe("session_end");
      expect(event["sessionId"]).toBeDefined();
    });

    it("events with type + runId pass the adapter fast-path", () => {
      // The adapter's parseEvent() has a fast-path:
      //   if (obj['type'] && obj['runId']) return obj as AgentEvent
      const emitter = new AmuxEventEmitter(RUN_ID);
      emitter.textDelta("test");

      const event = lastEvent();
      expect(event["type"]).toBeDefined();
      expect(event["runId"]).toBeDefined();
    });
  });
});
