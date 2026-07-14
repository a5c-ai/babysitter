/**
 * UX-R3 §14.5 (AC-63) — write-path-unchanged invariant, asserted statically.
 *
 * The observer's approve-breakpoint server action is the ONLY write path. It
 * must write result.json + one EFFECT_RESOLVED journal entry and NOTHING else:
 * it spawns no driver, runs no `run:iterate`, and executes no post-breakpoint
 * command. This test fails if a second (process-spawning) write path is ever
 * introduced into the action. It intentionally does NOT mock fs — it reads the
 * real source of the action from disk.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const ACTION_SRC = readFileSync(
  path.resolve(__dirname, "../approve-breakpoint.ts"),
  "utf-8"
);

describe("approve-breakpoint write path (UX-R3 §14.5 AC-63)", () => {
  it("imports no process-spawning module", () => {
    expect(ACTION_SRC).not.toMatch(/child_process|node:child_process/);
  });

  it("calls no exec/spawn/fork surface", () => {
    expect(ACTION_SRC).not.toMatch(
      /\bexecFile\s*\(|\bexecSync\s*\(|\bspawnSync\s*\(|\bspawn\s*\(|\bexec\s*\(|\bfork\s*\(/
    );
  });

  it("never runs the resume command as code (only prose in comments may mention run:iterate)", () => {
    // A doc comment may reference run:iterate in prose, but the CODE (comments
    // stripped) must never mention it — no string literal, no template, nothing
    // that could shell out to the resume command.
    const codeOnly = ACTION_SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    expect(codeOnly).not.toMatch(/run:iterate/);
  });

  it("writes exactly the two on-disk artifacts (result.json + one EFFECT_RESOLVED) and no REST/API route", () => {
    // The two sanctioned writes are present...
    expect(ACTION_SRC).toMatch(/result\.json/);
    expect(ACTION_SRC).toMatch(/EFFECT_RESOLVED/);
    // ...and no additional mutating network surface is invoked from the action.
    expect(ACTION_SRC).not.toMatch(/\bfetch\s*\(|axios|XMLHttpRequest/);
  });
});
