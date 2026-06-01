import { describe, expect, test } from "vitest";
import {
  deriveForwardFixStrikeState,
  classifyForwardFixAttempt,
} from "../forwardFixStrikes";

describe("forward-fix strike-state derivation", () => {
  test("classifies the third failed-fix attempt for the same bugClass as instrumentation_only", () => {
    const state = deriveForwardFixStrikeState([
      { bugClass: "scheduler-precedence", attemptStatus: "failed" },
      { bugClass: "scheduler-precedence", attemptStatus: "failed" },
    ]);

    expect(classifyForwardFixAttempt({ bugClass: "scheduler-precedence" }, state)).toEqual({
      bugClass: "scheduler-precedence",
      strikeCount: 2,
      instrumentation_only: true,
    });
  });

  test("does not share strike counts across bugClass values", () => {
    const state = deriveForwardFixStrikeState([
      { bugClass: "scheduler-precedence", attemptStatus: "failed" },
      { bugClass: "scheduler-precedence", attemptStatus: "failed" },
      { bugClass: "cli-docs", attemptStatus: "failed" },
    ]);

    expect(classifyForwardFixAttempt({ bugClass: "cli-docs" }, state)).toMatchObject({
      bugClass: "cli-docs",
      strikeCount: 1,
      instrumentation_only: false,
    });
  });

  test("derivation is replay-safe and idempotent for the same journaled attempts", () => {
    const attempts = [
      { bugClass: "mcp-g3", attemptStatus: "failed" },
      { bugClass: "mcp-g3", attemptStatus: "failed" },
      { bugClass: "mcp-g3", attemptStatus: "succeeded" },
    ];

    expect(deriveForwardFixStrikeState(attempts)).toEqual(deriveForwardFixStrikeState(attempts));
  });
});
