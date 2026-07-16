/**
 * suite-completeness.test.ts — the executable guard for the shipped conformance suite (docs/60 §8.4).
 *
 * docs/60 §8.4 requires the INV-1..19 / INV-2a..14b / INV-A1..A14 catalog to ship as a runnable
 * artifact "so a future missing INV fails CI". This test is that guard. It asserts, purely from the
 * `suite.ts` manifest + the files actually on disk (it reads NO impl module and asserts nothing
 * about the invariants' own PASS/FAIL — only about their REGISTRATION):
 *
 *   1. The manifest's id set is EXACTLY the canonical docs/60 §8.4 id set — PARSED from the doc's
 *      own `<a id="inv-…">` anchors at test time (NOT a hand-copy) — both directions. A docs/60
 *      invariant added without a manifest entry (or a manifest entry with no docs/60 anchor) fails
 *      here. The hand-maintained `DOCS60_INVARIANT_IDS` mirror is ALSO diffed against the parsed
 *      anchors, so drift between the doc and the mirror fails too.
 *   2. Every `testFiles` entry the manifest names EXISTS in this directory.
 *   3. Every named file carries the canonical `describe("INV-<id>: …")` (or `"INV-<id> (…)"`) title
 *      for the invariant it is registered under — so a file rename/retitle that silently drops an
 *      invariant's canonical block is caught.
 *   4. Every `inv-*.test.ts` file physically present in this directory is CLAIMED by some manifest
 *      entry — no orphan conformance file drifts un-catalogued.
 *   5. Every manifest entry's `coverage` disposition is the truthful "covered" (no invariant is a
 *      tracked gap today); a regression that re-brands any invariant a "tracked-gap" fails here.
 *
 * Together these make the manifest a faithful, self-checking index of the shipped suite: coverage is
 * complete when this test PASSES, and any future gap (a new docs/60 INV with no test, or a deleted
 * test file) makes it FAIL naming the offending id/file.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CONFORMANCE_SUITE, DOCS60_INVARIANT_IDS } from "./suite";

const CONFORMANCE_DIR = path.dirname(fileURLToPath(import.meta.url));

/** The docs/60 §8.4 spec file, resolved from this test's location (src/__tests__/conformance → docs). */
const DOCS60_PATH = path.resolve(CONFORMANCE_DIR, "..", "..", "..", "docs", "60-conformance-and-testability.md");

/**
 * Parse the canonical invariant-id set DIRECTLY from the docs/60 §8.4 spec by scanning its
 * `<a id="inv-…">` anchors — the same anchors the doc uses to catalogue each invariant. Ids are
 * upper-cased to the manifest's `INV-<id>` convention (e.g. `inv-14b` → `INV-14B` → `INV-14b`).
 * This makes the completeness guard anchored on the SPEC file, not on a hand-transcribed copy, so a
 * future INV added to (or removed from) the doc fails CI even if the manifest constants are untouched.
 */
function parseDocs60InvariantIds(): string[] {
  const doc = fs.readFileSync(DOCS60_PATH, "utf8");
  const ids = new Set<string>();
  const anchorRe = /<a\s+id="(inv-[a-z0-9]+)"\s*>/gi;
  for (const m of doc.matchAll(anchorRe)) {
    // Normalize `inv-14b`/`inv-a7` → `INV-14b`/`INV-A7` (segment after the first hyphen keeps case).
    const raw = m[1]; // e.g. "inv-14b"
    const rest = raw.slice("inv-".length); // "14b" | "a7" | "1"
    ids.add(`INV-${rest.replace(/^a/, "A")}`);
  }
  return [...ids];
}

/** Non-invariant files in this directory that are NOT expected to be catalogued. */
const NON_INVARIANT_FILES = new Set(["suite.ts", "suite-completeness.test.ts"]);

/** Every `inv-*.test.ts` file physically present in this directory. */
function conformanceTestFilesOnDisk(): string[] {
  return fs
    .readdirSync(CONFORMANCE_DIR)
    .filter((name) => name.endsWith(".test.ts") && name.startsWith("inv-") && !NON_INVARIANT_FILES.has(name));
}

/** Matches `describe("INV-<id>` where the char AFTER the id is a title boundary (`:`, space, or `(`),
 * so `INV-1` never matches inside `INV-14`/`INV-14b` and `INV-14` never matches inside `INV-14a`. */
function hasCanonicalDescribeTitle(fileContents: string, id: string): boolean {
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`describe\\(\\s*["'\`]${escaped}[:\\s(]`).test(fileContents);
}

describe("conformance suite-completeness (docs/60 §8.4 shippable-suite guard)", () => {
  it("the manifest covers EXACTLY the invariant-id set PARSED from the docs/60 §8.4 anchors (no missing, no extra)", () => {
    const manifestIds = new Set(CONFORMANCE_SUITE.map((i) => i.id));
    const docIds = new Set(parseDocs60InvariantIds());

    // Sanity: the doc must actually yield anchors — a broken path / parse would otherwise make this
    // guard vacuously pass by comparing two empty-ish sets.
    expect(docIds.size, "parsed ZERO invariant anchors from docs/60 — check DOCS60_PATH / anchor regex").toBeGreaterThan(30);

    const missingFromManifest = [...docIds].filter((id) => !manifestIds.has(id));
    const extraInManifest = [...manifestIds].filter((id) => !docIds.has(id));

    expect(missingFromManifest, `docs/60 invariants with NO manifest entry: ${missingFromManifest.join(", ")}`).toEqual([]);
    expect(extraInManifest, `manifest entries with NO docs/60 anchor: ${extraInManifest.join(", ")}`).toEqual([]);
    // No duplicate ids in the manifest.
    expect(CONFORMANCE_SUITE.length).toBe(manifestIds.size);
  });

  it("the hand-maintained DOCS60_INVARIANT_IDS mirror stays in exact lockstep with the parsed docs/60 anchors", () => {
    const mirror = new Set(DOCS60_INVARIANT_IDS);
    const docIds = new Set(parseDocs60InvariantIds());

    const missingFromMirror = [...docIds].filter((id) => !mirror.has(id));
    const staleInMirror = [...mirror].filter((id) => !docIds.has(id));

    expect(missingFromMirror, `docs/60 anchors absent from DOCS60_INVARIANT_IDS: ${missingFromMirror.join(", ")}`).toEqual([]);
    expect(staleInMirror, `DOCS60_INVARIANT_IDS entries with NO docs/60 anchor: ${staleInMirror.join(", ")}`).toEqual([]);
    // No duplicates in the hand-maintained mirror.
    expect(DOCS60_INVARIANT_IDS.length).toBe(mirror.size);
  });

  it("every INV-1..19 parent and every INV-A1..A14 active invariant named by the M9 brief is registered", () => {
    const manifestIds = new Set(CONFORMANCE_SUITE.map((i) => i.id));
    const requiredParents = [
      ...Array.from({ length: 19 }, (_, n) => `INV-${n + 1}`),
      ...Array.from({ length: 14 }, (_, n) => `INV-A${n + 1}`),
    ];
    const missing = requiredParents.filter((id) => !manifestIds.has(id));
    expect(missing, `parent invariants missing a registered test: ${missing.join(", ")}`).toEqual([]);
  });

  it("every test file the manifest names exists on disk AND carries the canonical describe title for its invariant", () => {
    const problems: string[] = [];
    for (const inv of CONFORMANCE_SUITE) {
      expect(inv.testFiles.length, `${inv.id} registers no test file`).toBeGreaterThan(0);
      for (const file of inv.testFiles) {
        const full = path.join(CONFORMANCE_DIR, file);
        if (!fs.existsSync(full)) {
          problems.push(`${inv.id}: missing file ${file}`);
          continue;
        }
        const contents = fs.readFileSync(full, "utf8");
        if (!hasCanonicalDescribeTitle(contents, inv.id)) {
          problems.push(`${inv.id}: ${file} lacks a canonical describe("${inv.id}: …") title`);
        }
      }
    }
    expect(problems, problems.join("\n")).toEqual([]);
  });

  it("every inv-*.test.ts file on disk is claimed by exactly one manifest entry (no un-catalogued orphans)", () => {
    const claimed = new Set(CONFORMANCE_SUITE.flatMap((i) => i.testFiles));
    const onDisk = conformanceTestFilesOnDisk();
    const orphans = onDisk.filter((f) => !claimed.has(f));
    expect(orphans, `conformance test files not registered in suite.ts: ${orphans.join(", ")}`).toEqual([]);
  });

  it("every invariant is registered as fully 'covered' — no invariant is a tracked gap (INV-14b's A-1 pin-re-completeness half closed in M9)", () => {
    // Truthful post-M9 disposition: the A-1 attested-hole bridge landed, inv-14b.test.ts's (b) half
    // is now a real passing `it` (no `it.fails` anywhere in the conformance dir), so INV-14b — like
    // every other invariant — is fully "covered". This guard is non-vacuous: if any invariant were
    // ever re-branded "tracked-gap" (a regression to an open/expected-failure half), it fails here
    // and names the offender. It would also have caught the pre-M9 stale label this test replaces.
    const trackedGaps = CONFORMANCE_SUITE.filter((inv) => (inv.coverage ?? "covered") !== "covered");
    expect(
      trackedGaps.map((inv) => `${inv.id}=${inv.coverage}`),
      `invariants not fully covered (must be "covered" post-M9): ${trackedGaps.map((inv) => inv.id).join(", ")}`,
    ).toEqual([]);

    // Belt-and-braces: INV-14b specifically is now covered, and its test file carries NO expected-
    // failure — the A-1 flip is real, not merely relabelled.
    const inv14b = CONFORMANCE_SUITE.find((inv) => inv.id === "INV-14b");
    expect(inv14b?.coverage ?? "covered").toBe("covered");
    for (const file of inv14b?.testFiles ?? []) {
      const contents = fs.readFileSync(path.join(CONFORMANCE_DIR, file), "utf8");
      expect(/\bit\.fails\b/.test(contents), `${file} still contains an it.fails expected-failure`).toBe(false);
    }
  });
});
