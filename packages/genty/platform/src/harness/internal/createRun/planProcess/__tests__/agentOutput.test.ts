import { describe, expect, it } from "vitest";
import { coerceAgentResultValue, extractJsonObjectFromText } from "../agentOutput";

describe("extractJsonObjectFromText", () => {
  it("returns a clean bare JSON object unchanged", () => {
    expect(extractJsonObjectFromText('{"a":1}')).toBe('{"a":1}');
  });

  it("extracts the first balanced object when prose/markdown follows (the #936 coercion-loop cause)", () => {
    // A worker that emits a JSON result then trailing markdown that itself
    // contains braces must not corrupt the parse.
    const output = '{"status":"success","file":"x.md"}\n\n## 1. Section { with a brace }\nmore text }';
    const candidate = extractJsonObjectFromText(output);
    expect(candidate).toBe('{"status":"success","file":"x.md"}');
    expect(JSON.parse(candidate!)).toEqual({ status: "success", file: "x.md" });
  });

  it("does not break on braces inside string values", () => {
    const output = '{"cmd":"cat <<EOF { } EOF"} trailing';
    const candidate = extractJsonObjectFromText(output);
    expect(JSON.parse(candidate!)).toEqual({ cmd: "cat <<EOF { } EOF" });
  });

  it("prefers a fenced ```json block", () => {
    const output = 'Here is the result:\n```json\n{"ok":true}\n```\nthanks';
    const candidate = extractJsonObjectFromText(output);
    expect(JSON.parse(candidate!)).toEqual({ ok: true });
  });

  it("returns null when there is no JSON", () => {
    expect(extractJsonObjectFromText("just prose, no json here")).toBeNull();
  });
});

describe("coerceAgentResultValue", () => {
  const taskDef = {
    agent: {
      outputSchema: { type: "object", required: ["status"], properties: { status: { type: "string" } } },
    },
  };

  it("coerces a worker result with trailing content into the declared JSON object", () => {
    const output = '{"status":"success"}\n\nFile written to disk.';
    expect(coerceAgentResultValue(taskDef, output)).toEqual({ status: "success" });
  });

  it("passes through raw output when no outputSchema is declared", () => {
    expect(coerceAgentResultValue({ agent: {} }, "plain text")).toBe("plain text");
  });
});
