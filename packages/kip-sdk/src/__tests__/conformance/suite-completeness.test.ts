/**
 * suite-completeness.test.ts — the executable guard for the shipped conformance suite (docs/60 §8.4).
 *
 * docs/60 §8.4 requires the INV-1..19 / INV-2a..14b / INV-A1..A14 catalog to ship as a runnable
 * artifact "so a future missing INV fails CI". This test is that guard. It asserts, purely from the
 * `suite.ts` manifest + the files actually on disk (it reads NO impl module and asserts nothing
 * about the invariants' own PASS/FAIL — only about their REGISTRATION):
 *
 *   1. The manifest's id set is EXACTLY the canonical docs/60 §8.4 id set (`DOCS60_INVARIANT_IDS`,
 *      transcribed from the doc's own anchors) — both directions. A docs/60 invariant added without
 *      a manifest entry (or a manifest entry with no docs/60 anchor) fails here.
 *   2. Every `testFiles` entry the manifest names EXISTS in this directory.
 *   3. Every named file carries the canonical `describe("INV-<id>: …")` (or `"INV-<id> (…)"`) title
 *      for the invariant it is registered under — so a file rename/retitle that silently drops an
 *      invariant's canonical block is caught.
 *   4. Every `inv-*.test.ts` file physically present in this directory is CLAIMED by some manifest
 *      entry — no orphan conformance file drifts un-catalogued.
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
  it("the manifest covers EXACTLY the canonical docs/60 §8.4 invariant-id set (no missing, no extra)", () => {
    const manifestIds = new Set(CONFORMANCE_SUITE.map((i) => i.id));
    const docIds = new Set(DOCS60_INVARIANT_IDS);

    const missingFromManifest = [...docIds].filter((id) => !manifestIds.has(id));
    const extraInManifest = [...manifestIds].filter((id) => !docIds.has(id));

    expect(missingFromManifest, `docs/60 invariants with NO manifest entry: ${missingFromManifest.join(", ")}`).toEqual([]);
    expect(extraInManifest, `manifest entries with NO docs/60 anchor: ${extraInManifest.join(", ")}`).toEqual([]);
    // No duplicate ids in the manifest.
    expect(CONFORMANCE_SUITE.length).toBe(manifestIds.size);
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

  it("INV-14b is registered as a tracked-gap (its A-1 pin-re-completeness half is a self-correcting expected-failure), every other invariant is fully covered", () => {
    for (const inv of CONFORMANCE_SUITE) {
      const disposition = inv.coverage ?? "covered";
      if (inv.id === "INV-14b") {
        expect(disposition).toBe("tracked-gap");
      } else {
        expect(disposition, `${inv.id} unexpectedly marked ${disposition}`).toBe("covered");
      }
    }
  });
});
