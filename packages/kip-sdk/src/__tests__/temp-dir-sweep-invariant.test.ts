/**
 * temp-dir-sweep-invariant.test.ts — ENFORCES the safety precondition of the D-38 suite-level
 * temp-dir sweep (`src/__tests__/setup/temp-dir-sweep.ts`), converting a previously comment-only
 * invariant into a harness-checked constraint (round-2 code-quality finding: "the sweep assumes but
 * does not enforce no bare-repo reuse across `it()`s").
 *
 * THE INVARIANT: the sweep is a vitest `afterEach` that `rmSync`s EVERY `createTemp()`-provisioned
 * `kip-sdk-*` dir tracked in the worker after each test. That is safe ONLY if no test holds a bare
 * (no explicit `dir`) `new KipRepo()` — whose memoized `createTemp()` substrate dir the sweep would
 * delete — ACROSS `it()`s. The only way to share one repo instance across `it()`s is to construct it
 * in a `beforeAll`/`beforeEach` hook and close over it. So the enforceable, sufficient constraint is:
 * **no `beforeAll`/`beforeEach` hook may construct a bare `new KipRepo()` (one with no `dir:` option).**
 * A before-hook that needs a durable shared repo must pass an explicit `dir` (caller-owned, never
 * swept); a per-`it` bare repo (constructed inside the `it`, torn down when that test ends) is fine and
 * is what the whole conformance suite already does. The two e2e files use before-hooks but drive a
 * subprocess against an explicit `--dir`, never an in-process bare `KipRepo`, so they pass.
 *
 * If this guard fails, do NOT relax it: move the bare-repo construction into each `it`, or give the
 * before-hook an explicit `dir` and `close()` it in an `afterAll`/`afterEach`.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const TESTS_ROOT = dirname(fileURLToPath(import.meta.url));

function listTestFiles(root: string): string[] {
  return (readdirSync(root, { recursive: true }) as string[])
    .map((n) => n.replace(/\\/g, "/"))
    .filter((n) => n.endsWith(".test.ts"))
    .map((n) => join(root, n));
}

/** Replace comments and string/template literals with same-role placeholders so brace/paren matching
 * below is never thrown off by braces or parens that appear inside comment prose or string content. */
function stripCommentsAndStrings(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ")
    .replace(/`(?:\\.|[^`\\])*`/g, "``")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, "''");
}

/** Returns the substring from `open` (an opening `{` or `(`) through its balanced close, or "" if
 * the delimiters never balance. */
function balancedSlice(text: string, open: number, openCh: "{" | "(", closeCh: "}" | ")"): string {
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === openCh) depth += 1;
    else if (text[i] === closeCh) {
      depth -= 1;
      if (depth === 0) return text.slice(open, i + 1);
    }
  }
  return "";
}

/** True if `sanitized` source constructs a bare (no `dir:` option) `new KipRepo()` inside the body of
 * any `beforeAll`/`beforeEach` hook. */
function hasBareRepoInBeforeHook(sanitized: string): boolean {
  const hookRe = /\b(?:beforeAll|beforeEach)\s*\(/g;
  let hook: RegExpExecArray | null;
  while ((hook = hookRe.exec(sanitized))) {
    const braceStart = sanitized.indexOf("{", hook.index);
    if (braceStart === -1) continue;
    const body = balancedSlice(sanitized, braceStart, "{", "}");
    if (!body) continue;
    const repoRe = /new\s+KipRepo\s*\(/g;
    let repo: RegExpExecArray | null;
    while ((repo = repoRe.exec(body))) {
      const parenStart = body.indexOf("(", repo.index);
      const args = balancedSlice(body, parenStart, "(", ")");
      // A bare repo has no `dir:` in its options (an explicit-dir repo is caller-owned, never swept).
      if (!/\bdir\s*:/.test(args)) return true;
    }
  }
  return false;
}

describe("D-38 sweep safety: no bare-repo reuse across it()s via a before-hook", () => {
  it("the recursive test-file scan actually reaches the suite (guard sanity)", () => {
    expect(listTestFiles(TESTS_ROOT).length).toBeGreaterThan(10);
  });

  it("no beforeAll/beforeEach hook constructs a bare `new KipRepo()` (no explicit dir) — which the afterEach temp-dir sweep would delete mid-file", () => {
    const violations: string[] = [];
    for (const file of listTestFiles(TESTS_ROOT)) {
      const sanitized = stripCommentsAndStrings(readFileSync(file, "utf8"));
      if (hasBareRepoInBeforeHook(sanitized)) {
        violations.push(relative(TESTS_ROOT, file).replace(/\\/g, "/"));
      }
    }
    expect(
      violations,
      `A beforeAll/beforeEach hook constructs a bare \`new KipRepo()\` in:\n${violations.join("\n")}\n` +
        `The afterEach temp-dir sweep (setup/temp-dir-sweep.ts) rmSyncs every createTemp() dir after ` +
        `each test, so a shared bare repo's substrate dir would be deleted out from under a later it(). ` +
        `Fix: construct the repo inside each it(), OR give the hook an explicit \`dir\` and close() it.`,
    ).toEqual([]);
  });
});
