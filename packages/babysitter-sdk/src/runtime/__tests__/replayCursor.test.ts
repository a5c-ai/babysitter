import { describe, expect, test } from "vitest";
import { ReplayCursor } from "../replay/replayCursor";

describe("ReplayCursor", () => {
  test("increments step ids sequentially", () => {
    const cursor = new ReplayCursor();
    expect(cursor.nextStepId()).toBe("S000001");
    expect(cursor.nextStepId()).toBe("S000002");
    expect(cursor.peekNextStepId()).toBe("S000003");
    expect(cursor.value).toBe(2);
    expect(cursor.nextStepId()).toBe("S000003");
  });

  test("formats with leading zeros", () => {
    const cursor = new ReplayCursor();
    for (let i = 0; i < 999; i += 1) {
      cursor.nextStepId();
    }
    expect(cursor.nextStepId()).toBe("S001000");
  });
});
