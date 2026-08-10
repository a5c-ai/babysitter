/**
 * INV-12 golden-digest CI fixture (D-27's second required fidelity,
 * docs/60-conformance-and-testability.md#inv-12): "true cross-OS coverage is a named CI matrix job
 * (windows-latest + ubuntu-latest) that regenerates the fixture set and asserts the commit-object
 * bytes equal a committed golden digest — both fidelities are required to claim INV-12 passes."
 *
 * The FIRST fidelity (in-process TZ/autocrlf/locale perturbation) already exists in
 * src/__tests__/conformance/inv-12.test.ts (a frozen conformance file — NOT modified here). This
 * file is the SECOND fidelity's fixture-regeneration-and-compare logic:
 * .github/workflows/kip-inv12-golden-digest.yml runs THIS test on a `[windows-latest, ubuntu-latest]`
 * matrix. It builds a small, FIXED, fully deterministic fact set — same `makeWellFormedFact`/
 * placeholder-signature fixture convention `inv-12.test.ts` itself uses (see
 * src/__tests__/conformance/fixtures.ts) — calls `KipRepo.regenerateHeads()` on it, and asserts the
 * resulting commit chain's oids equal the values committed in
 * src/__tests__/fixtures/inv12-golden-digest.json.
 *
 * Why comparing each OS run against ONE shared committed golden value is sufficient to also catch
 * "windows-latest disagrees with ubuntu-latest": both matrix jobs assert against the identical
 * golden.json committed to this repo, so if either OS's regeneration ever produces a different oid,
 * that job fails on its own — and transitively, the two OSes can never silently agree with each
 * other while both disagreeing with the golden value (each is checked independently against the
 * same fixed target).
 *
 * Determinism note: `regenerateHeads()`'s tree/commit bytes are built from each fact's OWN
 * JSON-serialized content (see index.ts's `regenerateHeads` doc comment) plus a fixed sentinel
 * committer/author and a `floor(wall/1000)` timestamp — no real-time clock, no host-specific
 * randomness, no real Ed25519 signing is involved on this path (the facts below use the same
 * deterministic placeholder-signature convention `fixtures.ts` documents, i.e.
 * `signature === "sig:" + id"`), so re-running this exact fixture set on any OS is expected to
 * reproduce byte-identical commit objects — genuine drift here is a real INV-12 regression, not
 * environmental noise.
 *
 * This file is NOT one of the 15 frozen conformance test files under
 * src/__tests__/conformance/ (ADR-B7 reserves that directory + naming convention for the frozen
 * INV-<id>.test.ts suite) — it is a new, additive file created specifically for D-27's second
 * fidelity. If `regenerateHeads()`'s byte recipe is ever deliberately, reviewedly changed, this
 * file's fixture and src/__tests__/fixtures/inv12-golden-digest.json must be regenerated together
 * (run this file locally, capture the new `commits`/`commitOid`, and commit the updated JSON).
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { KipRepo } from "../index";
import { cloneFact, makeWellFormedFact } from "./conformance/fixtures";

interface GoldenDigest {
  description: string;
  commits: string[];
  commitOid: string;
}

const goldenPath = join(dirname(fileURLToPath(import.meta.url)), "fixtures", "inv12-golden-digest.json");
const golden: GoldenDigest = JSON.parse(readFileSync(goldenPath, "utf8"));

describe("INV-12 golden-digest CI fixture (D-27 second fidelity: named cross-OS CI matrix job)", () => {
  it("regenerateHeads() over a small, FIXED, deterministic fact set produces the exact commit oid(s) committed as this repo's golden digest in src/__tests__/fixtures/inv12-golden-digest.json — a mismatch here on EITHER ubuntu-latest or windows-latest is the cross-OS byte-DAG drift INV-12's second fidelity exists to catch", async () => {
    const eid = "person/inv12-golden-digest-fixture";
    const replicaId = "author-golden-digest";

    // Batch 1 (wall = 1_650_000_000_000): a node-existence fact plus one prop fact sharing the same
    // author-HLC wall — one author-HLC-contiguous batch (docs/23 §5.2's regenBoundaryRule).
    const existence = makeWellFormedFact({
      target: { kind: "node", eid, nodeKind: "person" },
      id: "golden-digest-existence",
      replicaId,
      hlc: { wall: 1_650_000_000_000 },
      seq: 0,
    });
    existence.value = true;
    existence.validFrom = 0;
    existence.validTo = null;

    const fieldA = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "fieldA" },
      id: "golden-digest-field-a",
      replicaId,
      hlc: { wall: 1_650_000_000_000 },
      seq: 1,
    });
    fieldA.value = "alpha";
    fieldA.validFrom = 0;
    fieldA.validTo = null;

    // Batch 2 (wall = 1_660_000_000_000): a distinct author-HLC wall -> a second, parent-linked batch,
    // so this fixture exercises the multi-commit / parent-chain path, not only a single-commit DAG.
    const fieldB = makeWellFormedFact({
      target: { kind: "node-prop", eid, prop: "fieldB" },
      id: "golden-digest-field-b",
      replicaId,
      hlc: { wall: 1_660_000_000_000 },
      seq: 2,
    });
    fieldB.value = "beta";
    fieldB.validFrom = 0;
    fieldB.validTo = null;

    const repo = new KipRepo({ replicaId: "storage-golden-digest" });
    for (const f of [existence, fieldA, fieldB]) {
      // eslint-disable-next-line no-await-in-loop -- intentionally sequential, deterministic ingest order
      const verdict = await repo.ingest(cloneFact(f));
      expect(verdict.admitted).toBe(true);
    }

    const run = await repo.regenerateHeads();

    // Printed (not just asserted) so a CI log directly shows the regenerated oid(s) on each OS,
    // making cross-OS drift legible without needing to open the golden JSON file.
    // eslint-disable-next-line no-console -- deliberate CI-log visibility of the regenerated digest
    console.log(
      `[inv12-golden-digest] regenerated commit chain: ${JSON.stringify({
        commits: run.commits.map((c) => c.commitOid),
        commitOid: run.commitOid,
      })}`,
    );

    expect(run.commits.map((c) => c.commitOid)).toEqual(golden.commits);
    expect(run.commitOid).toBe(golden.commitOid);
    expect(run.commitOid).toBe(golden.commits[golden.commits.length - 1]);
  });
});
