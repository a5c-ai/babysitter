import { describe, expect, it } from "vitest";
import { toolError, toolResult } from "../../util/errors";

describe("toolError", () => {
  it("returns an error response with isError flag", () => {
    const result = toolError("something went wrong");
    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toEqual({ error: "something went wrong" });
  });

  it("wraps message in JSON format", () => {
    const result = toolError("test error");
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.error).toBe("test error");
  });
});

describe("toolResult", () => {
  it("returns a success response without isError flag", () => {
    const result = toolResult({ key: "value" });
    expect(result.isError).toBeUndefined();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe("text");

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toEqual({ key: "value" });
  });

  it("pretty-prints JSON with 2-space indentation", () => {
    const result = toolResult({ a: 1, b: 2 });
    const text = result.content[0].text;
    expect(text).toBe(JSON.stringify({ a: 1, b: 2 }, null, 2));
  });

  it("handles nested objects", () => {
    const data = { level1: { level2: { value: 42 } } };
    const result = toolResult(data);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.level1.level2.value).toBe(42);
  });

  it("handles arrays", () => {
    const result = toolResult([1, 2, 3]);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toEqual([1, 2, 3]);
  });

  it("handles null values", () => {
    const result = toolResult(null);
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toBeNull();
  });
});
