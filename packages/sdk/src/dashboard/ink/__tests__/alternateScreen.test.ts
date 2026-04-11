/**
 * alternateScreen.test.ts
 *
 * Tests for alternate screen buffer escape sequence builders.
 */

import { describe, it, expect } from "vitest";
import {
  buildAlternateScreenEnter,
  buildAlternateScreenLeave,
} from "../helpers.js";

describe("buildAlternateScreenEnter", () => {
  it("returns CSI ?1049h for entering alternate screen", () => {
    const seq = buildAlternateScreenEnter();
    expect(seq).toBe("\x1b[?1049h");
  });
});

describe("buildAlternateScreenLeave", () => {
  it("returns CSI ?1049l for leaving alternate screen", () => {
    const seq = buildAlternateScreenLeave();
    expect(seq).toBe("\x1b[?1049l");
  });
});
