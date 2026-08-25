/**
 * UX-R3 §14.5 (AC-63) — write-path invariant, asserted statically.
 *
 * The observer's approve-breakpoint server action is the ONLY write path, and
 * it must delegate the write to the babysitter SDK's supported commit path
 * (`commitEffectResult`) — never hand-roll result.json / journal mutation,
 * never spawn a driver, never run `run:iterate`, never execute a
 * post-breakpoint command. This test fails if a hand-written run mutation or
 * a second (process-spawning) write path is ever reintroduced. It
 * intentionally does NOT mock fs — it reads the real source of the action
 * from disk.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const ACTION_SRC = readFileSync(
  path.resolve(__dirname, "../approve-breakpoint.ts"),
  "utf-8"
);

// Comment-stripped view: prose in comments may mention forbidden names, the
// CODE must not.
const CODE_ONLY = ACTION_SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

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
    expect(CODE_ONLY).not.toMatch(/run:iterate/);
  });

  it("delegates the run mutation to the SDK's supported commit path", () => {
    expect(CODE_ONLY).toMatch(/commitEffectResult/);
    expect(CODE_ONLY).toMatch(/@a5c-ai\/babysitter-sdk/);
  });

  it("hand-rolls no result/journal write (no fs, no checksum, no seq allocation)", () => {
    // The SDK owns result.json + EFFECT_RESOLVED emission under the run lock.
    // The action itself must not touch the filesystem or forge SDK formats.
    expect(CODE_ONLY).not.toMatch(/\bfrom\s+["'](node:)?fs["']|require\(\s*["'](node:)?fs["']\s*\)/);
    expect(CODE_ONLY).not.toMatch(/writeFile|mkdir\s*\(|createHash|\bulid\b|monotonicFactory/i);
    expect(CODE_ONLY).not.toMatch(/result\.json|EFFECT_RESOLVED/);
  });

  it("invokes no additional mutating network surface", () => {
    expect(ACTION_SRC).not.toMatch(/\bfetch\s*\(|axios|XMLHttpRequest/);
  });
});
