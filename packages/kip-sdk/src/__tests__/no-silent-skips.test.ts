/**
 * no-silent-skips.test.ts — SUITE-HARDENING guard (work item `suite-hardening`, sub-goal (a):
 * triage the pre-existing `it.skip`/`test.skip`/`describe.skip` tests so that NO skip is silent).
 *
 * This is a FROZEN, spec-driving guard authored BEFORE the fix. It enumerates every static skip
 * marker under `src/__tests__/` and asserts each one is ACCOUNTED FOR — i.e. carries a documented
 * justification tying it to a tracked debt / open-question, via EITHER:
 *   (1) an inline `// SKIP-REASON: <ref>` tag within a small window around the skip call, OR
 *   (2) a `DOCUMENTED_SKIP_REGISTRY` entry below (matched by file + a substring of the skip title).
 *
 * The test FAILS if any skip exists with no documented justification — this converts a "silent skip"
 * into a "tracked gap". It FAILS TODAY: the ~10 real `it.skip(...)` markers presently carry a
 * descriptive title ("UNTESTABLE AS CURRENTLY SCAFFOLDED …") but NO `// SKIP-REASON:` tag and no
 * registry entry, so none is currently justified under this guard's contract. The implement round
 * either un-skips the now-implementable ones or adds a `// SKIP-REASON:` tag (or a registry entry)
 * to each genuinely-deferred one — after which this guard passes and pins the property so a future
 * silent skip can't creep back in.
 *
 * NB: this file matches only STATIC markers `it.skip(` / `test.skip(` / `describe.skip(` (the `(`
 * requirement excludes prose/comment references like `` `it.skip` `` or "no longer it.skip'd"), and
 * excludes ITSELF (its own source contains the matching regex as text). Runtime conditional skips
 * (`ctx.skip(reason)`, e.g. the live-probe gates in graph-qa-live.test.ts) are out of scope — those
 * are not silent (they report a reason at runtime) and are not static `.skip()` markers.
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const TESTS_ROOT = dirname(fileURLToPath(import.meta.url)); // .../packages/kip-sdk/src/__tests__

/** This guard file's own basename — excluded from the scan (its source carries the skip regex). */
const SELF_BASENAME = "no-silent-skips.test.ts";

/**
 * Matches a REAL static skip CALL. The trailing `\(` is load-bearing: it excludes prose / comment
 * references (`` `it.skip` ``, "no longer it.skip'd", "EXPLICITLY it.skips") that have no call paren.
 */
const SKIP_CALL = /\b(?:it|test|describe)\.skip\s*\(/;

/**
 * The "registry entry" alternative to an inline `// SKIP-REASON:` tag (both are accepted by the
 * guard). An entry justifies a skip in `file` whose title text (within the match window) contains
 * `titleIncludes`, tying it to the tracked `ref`. EMPTY today — the implement round populates this
 * OR adds inline `// SKIP-REASON:` tags OR un-skips the now-implementable markers. Keyed by file +
 * title substring (not line number) so it is robust to line drift.
 */
interface SkipRegistryEntry {
  /** repo-relative-ish path suffix under src/__tests__ (forward slashes), e.g. "conformance/inv-8.test.ts". */
  readonly file: string;
  /** a distinctive substring of the skip's title, present within the match window. */
  readonly titleIncludes: string;
  /** the tracked debt / open-question this deferral is tied to, e.g. "D-38", "R12", "docs/60 INV-8". */
  readonly ref: string;
}
const DOCUMENTED_SKIP_REGISTRY: readonly SkipRegistryEntry[] = [];

function listTestFiles(root: string): string[] {
  return (readdirSync(root, { recursive: true }) as string[])
    .map((n) => n.replace(/\\/g, "/"))
    .filter((n) => n.endsWith(".test.ts"))
    .filter((n) => !n.endsWith(SELF_BASENAME))
    .map((n) => join(root, n));
}

interface FoundSkip {
  file: string;
  line: number;
  title: string;
  justified: boolean;
}

function scanSkips(): FoundSkip[] {
  const out: FoundSkip[] = [];
  for (const file of listTestFiles(TESTS_ROOT)) {
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    const rel = relative(TESTS_ROOT, file).replace(/\\/g, "/");
    for (let i = 0; i < lines.length; i++) {
      if (!SKIP_CALL.test(lines[i])) continue;
      // Window: 10 lines before through 3 lines after the call (the title string commonly trails the
      // `it.skip(` onto the next line(s); a leading `// SKIP-REASON:` tag sits just above the call).
      const from = Math.max(0, i - 10);
      const to = Math.min(lines.length - 1, i + 3);
      const windowText = lines.slice(from, to + 1).join("\n");
      const titleText = lines.slice(i, to + 1).join(" ").replace(/\s+/g, " ").trim();
      const inlineJustified = /SKIP-REASON\s*:/i.test(windowText);
      const registryJustified = DOCUMENTED_SKIP_REGISTRY.some(
        (e) => rel.endsWith(e.file) && windowText.includes(e.titleIncludes),
      );
      out.push({
        file: rel,
        line: i + 1,
        title: titleText.slice(0, 180),
        justified: inlineJustified || registryJustified,
      });
    }
  }
  return out;
}

describe("suite-hardening (a): no silent test skips", () => {
  it("the recursive test-file scan actually reaches the suite (guard sanity)", () => {
    // Guards against a broken scan silently passing (0 files ⇒ 0 skips ⇒ vacuous green).
    expect(listTestFiles(TESTS_ROOT).length).toBeGreaterThan(10);
  });

  it("every it.skip/test.skip/describe.skip carries a documented reason (inline // SKIP-REASON: tag or registry entry)", () => {
    const skips = scanSkips();
    const unjustified = skips.filter((s) => !s.justified);
    expect(
      unjustified,
      `Found ${unjustified.length} undocumented skip(s) of ${skips.length} total. Each MUST either be ` +
        `un-skipped, or carry an inline \`// SKIP-REASON: <tracked debt/open-question>\` tag near the ` +
        `skip call, or a DOCUMENTED_SKIP_REGISTRY entry:\n` +
        unjustified.map((s) => `  - ${s.file}:${s.line}  ${s.title}`).join("\n"),
    ).toEqual([]);
  });
});
