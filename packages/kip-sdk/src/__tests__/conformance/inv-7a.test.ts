/**
 * INV-7a — CID dedup at the gate, no reducer required (M0's exit gate, B-3).
 *
 * Scope (docs/60-conformance-and-testability.md): the gate-level half only — INV-7's
 * pncounter/aggregate-reducer no-double-count claim needs M1 machinery; this sub-case is
 * runnable at M0. Asserts: re-offering an already-admitted fact (same CID) is a no-op — the
 * `/facts` store contains exactly one blob per distinct CID, verifiable by re-running
 * `ingest()` on the same fact and checking `/facts` git-tree state directly (no proj/reducer
 * involved).
 *
 * `KipRepo.ingest()` currently throws `unimplemented: ingest` (M0 scaffold) — these tests are
 * EXPECTED TO FAIL until it is implemented; failures should surface as
 * `expect(...).resolves.toEqual(...)` assertion mismatches, not import/type errors.
 *
 * IMPORTANT GAP (see this task's `untestable` report): the spec text's verification method is
 * "checking /facts git-tree state directly" — i.e., counting blobs under the on-disk
 * `/facts/<shardHi>/<shardLo>/` layout (SPEC.md §3.1). The current `Repo`/`KipRepo`/`OpenOptions`
 * public surface in index.ts exposes NO seam to inspect that store: there is no
 * `getFact`/`hasFact`/`listFacts`/store-handle accessor, `OpenOptions.dir` is a write-only
 * constructor input, and `open()` itself is an unimplemented stub. Per this task's instructions,
 * no such method is invented here. The two tests below instead pin the only checkable proxy on
 * the current surface: `ingest()`'s own return-value contract for a re-offered same-CID fact.
 * The direct git-tree/blob-count half of INV-7a remains genuinely untestable as currently
 * scaffolded and is recorded as such rather than faked.
 */
import { describe, expect, it } from "vitest";
import { KipRepo } from "../../index";
import { cloneFact, makeWellFormedFact } from "./fixtures";

describe("INV-7a: CID dedup at the gate, no reducer required (M0's exit gate, B-3)", () => {
  it("re-offering an already-admitted fact (same CID) is a no-op: the second ingest() resolves with the identical verdict as the first", async () => {
    const repo = new KipRepo();
    const fact = makeWellFormedFact();
    const first = await repo.ingest(cloneFact(fact));
    const second = await repo.ingest(cloneFact(fact));
    expect(second).toEqual(first);
    expect(second.admitted).toBe(true);
  });

  it("re-offering the same CID repeatedly stays idempotent: every verdict after the first admit is identical (no growing/changing state observable through ingest())", async () => {
    const repo = new KipRepo();
    const fact = makeWellFormedFact();
    const verdicts = [];
    for (let i = 0; i < 3; i += 1) {
      // eslint-disable-next-line no-await-in-loop -- intentionally sequential re-offers of one CID
      verdicts.push(await repo.ingest(cloneFact(fact)));
    }
    expect(verdicts[1]).toEqual(verdicts[0]);
    expect(verdicts[2]).toEqual(verdicts[0]);
  });

  // SKIP-REASON: D-38 sub-goal (a) / D-50 (conformance scaffolding-seam gaps). Deferred, not a logic
  // gap: no PUBLIC store-inspection seam exists on Repo/KipRepo/OpenOptions to assert "exactly one
  // /facts blob per distinct CID" directly. The observable idempotence (identical projected result on
  // re-offer) IS exercised above; adding a private-reflection probe here is out of this work's scope.
  it.skip(
    "UNTESTABLE AS CURRENTLY SCAFFOLDED: the /facts git-tree contains exactly one blob per distinct CID after a re-offer — no store-inspection seam exists on Repo/KipRepo/OpenOptions to verify this directly (see file-header comment and this task's untestable report)",
    () => {
      // Intentionally skipped, not faked. See the file-level comment above for the exact gap.
    },
  );
});
