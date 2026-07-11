/**
 * debt-closure-d28-d29-d30.test.ts — ADDITIVE regression coverage for closing three small,
 * independently-tracked implementation debts recorded in `packages/kip-sdk/docs/DEBTS.md`:
 *
 * D-29 (leaking static registry, index.ts): `KipRepo.registry` (a static `Map<ReplicaId, KipRepo>`)
 * self-registered every constructed instance but had no removal path, leaking every `KipRepo` (and
 * its `Substrate`/`keyRegistry`/`selfWitnessedExcisionOids`) forever in a long-lived host process.
 * Fixed by adding an explicit `KipRepo.prototype.close()` that removes `this.replicaId` from the
 * registry. Test (a) below proves `close()` actually removes the entry — tested INDIRECTLY (the
 * cleanest available seam) via `sync()`: a remote resolves fine before `close()` and fails to
 * resolve ("unknown remote") immediately after, which is only possible if the registry entry is
 * genuinely gone.
 *
 * D-28 (non-durable `selfWitnessedExcisionOids`, index.ts): unlike `keyRegistry` (durably re-seeded
 * from `KeyRegistryStore` in `getSubstrate()`), `selfWitnessedExcisionOids` was populated ONLY by
 * live `excise()` calls and started empty again after a process restart / fresh `KipRepo` pointed at
 * the same `dir`. Fixed by adding `SelfWitnessedExcisionStore` (substrate.ts, mirroring
 * `KeyRegistryStore`'s exact load/save shape) and wiring it into `excise()` (write-through) and
 * `getSubstrate()` (re-seed). Test (b) below proves a self-excised fact's typed `"excised"`
 * placeholder survives a close()+reopen of a `KipRepo` pointed at the same directory.
 *
 * D-30 (mistyped `SyncReport.tip`/`MergeReport.tip`, index.ts): both were typed `CID` (a real git
 * object id per the type catalog) but populated with `computeFactSetDigest(...)`, a fact-set digest,
 * not a git-resolvable commit id (there is no regenerated commit DAG yet, see D-27). Fixed by
 * introducing a distinct `FactSetDigest` type alias and retyping both fields to it — a pure
 * type-level change, the actual runtime value is UNCHANGED. Because both `CID` and `FactSetDigest`
 * are (necessarily, per the task's "don't change the runtime value" constraint) plain `string`
 * aliases with no branding, there is no way to write a runtime assertion that would fail to compile
 * under the OLD typing and succeed under the NEW one — the authoritative signal for this item is
 * `tsc --noEmit` passing (verified separately, see this task's summary). Test (c) below is
 * therefore a source-level regression guard (grep the field declarations) that would fail if a
 * future edit reverted `tip`'s declared type back to `CID`, plus a sanity check that the runtime
 * value itself is untouched (still whatever `computeFactSetDigest` produces).
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { KipRepo } from "../index";

describe("D-29: KipRepo.close() deregisters from the static same-process replica registry", () => {
  it("(a) sync() resolves a remote before close() and fails to resolve it immediately after", async () => {
    const remote = new KipRepo({ replicaId: "d29-remote" });
    await remote.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node", eid: "person/d29-1", nodeKind: "person" },
      value: true,
      validFrom: 0,
      validTo: null,
      replicaId: "d29-remote",
      provenance: { author: "remote" },
    });

    const local = new KipRepo({ replicaId: "d29-local" });

    // BEFORE close(): the registry still holds "d29-remote" — sync() resolves it and pulls its facts.
    const before = await local.sync("d29-remote");
    expect(before.received).toBeGreaterThan(0);

    remote.close();

    // AFTER close(): the registry entry for "d29-remote" is gone — sync() must fail to resolve it,
    // which is only possible if `close()` genuinely removed the entry (proving D-29's fix works;
    // pre-fix, this second sync() would have succeeded again since nothing ever deregistered it).
    await expect(local.sync("d29-remote")).rejects.toThrow(/unknown remote/i);

    // close() is documented idempotent — calling it again must not throw.
    expect(() => remote.close()).not.toThrow();
  });

  it("close() on a repo that was never resolved via sync() is a harmless no-op", () => {
    const repo = new KipRepo({ replicaId: "d29-standalone" });
    expect(() => repo.close()).not.toThrow();
    expect(() => repo.close()).not.toThrow();
  });
});

describe("D-28: selfWitnessedExcisionOids survives a KipRepo close()+reopen against the same dir", () => {
  it("(b) a self-excised fact's typed 'excised' placeholder (not degraded to 'unknown') is still shown after reopening a fresh KipRepo against the same directory", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kip-sdk-d28-"));

    const repo = new KipRepo({ dir, replicaId: "d28-self-excise" });
    await repo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node", eid: "person/d28-1", nodeKind: "person" },
      value: true,
      validFrom: 0,
      validTo: null,
      replicaId: "d28-self-excise",
      provenance: { author: "self" },
    });
    const f = await repo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node-prop", eid: "person/d28-1", prop: "diary" },
      value: "private thoughts",
      validFrom: 100,
      validTo: null,
      replicaId: "d28-self-excise",
      provenance: { author: "self" },
    });

    const marker = await repo.excise(f.id, "gdpr-erasure");
    expect(marker.excised).toBe(f.id);

    // Sanity check BEFORE any reopen: the historical asOf read already shows the typed "excised"
    // placeholder, backed by this replica's own in-memory `selfWitnessedExcisionOids` record.
    const beforeClose = await (await repo.asOf({ validTime: 500 })).getNode("person/d28-1");
    expect(beforeClose?.props.diary.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "excised", excisedFactId: f.id })]),
    );

    repo.close();

    // Reopen: a BRAND NEW KipRepo instance pointed at the SAME `dir`. Its own
    // `selfWitnessedExcisionOids` map starts empty in memory — everything it knows must come from
    // the durable `SelfWitnessedExcisionStore` side-file (D-28's fix) re-seeded in `getSubstrate()`,
    // exactly like `keyRegistry` already re-seeds from `KeyRegistryStore`.
    const reopened = new KipRepo({ dir, replicaId: "d28-self-excise" });

    // PRE-FIX: `selfWitnessedExcisionOids` would be empty on this fresh instance, so
    // `collectExcisions`'s CASE-2(ii) self-witnessed branch could never match this oid — the cell
    // would fall through to the typed "unknown" placeholder instead (SAFE, but a real audit-fidelity
    // regression across restarts, per D-28's own "Why it is debt" section).
    // POST-FIX: the durable side-file survives the reopen, so the SAME typed "excised" placeholder
    // (carrying the identical `excisedFactId`) is still produced.
    const afterReopen = await (await reopened.asOf({ validTime: 500 })).getNode("person/d28-1");
    expect(afterReopen?.props.diary.segments).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "excised", excisedFactId: f.id })]),
    );
    expect(afterReopen?.props.diary.segments).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "unknown" })]),
    );
  });
});

describe("D-30: SyncReport.tip / MergeReport.tip are typed FactSetDigest, not CID", () => {
  it("(c) index.ts declares both fields as `FactSetDigest`, and the runtime value is unchanged (still a fact-set digest, not a real git commit id)", async () => {
    // Source-level regression guard: a pure type-alias rename has no runtime-observable signature
    // (both `CID` and `FactSetDigest` are, by this task's own "don't change the runtime value"
    // constraint, plain unbranded `string` aliases) — `tsc --noEmit` passing is the authoritative
    // check for this item (verified separately). This grep-based assertion additionally guards
    // against a future regression that reverts the declared type back to `CID` in the source.
    const indexSource = fs.readFileSync(path.join(__dirname, "..", "index.ts"), "utf8");
    expect(indexSource).toMatch(/interface MergeReport \{[\s\S]*?tip: FactSetDigest;[\s\S]*?\}/);
    expect(indexSource).toMatch(/interface SyncReport \{[\s\S]*?tip: FactSetDigest;[\s\S]*?\}/);
    expect(indexSource).not.toMatch(/tip: CID/);

    // Runtime sanity check: the actual VALUE sync() produces for `tip` is untouched — still
    // whatever `computeFactSetDigest` computes (a stable, non-empty hex-looking digest string),
    // never a resolvable git commit object id (no commit-DAG regeneration exists yet, see D-27).
    const remote = new KipRepo({ replicaId: "d30-remote" });
    await remote.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node", eid: "person/d30-1", nodeKind: "person" },
      value: true,
      validFrom: 0,
      validTo: null,
      replicaId: "d30-remote",
      provenance: { author: "remote" },
    });
    const local = new KipRepo({ replicaId: "d30-local" });
    const report = await local.sync("d30-remote");
    expect(typeof report.tip).toBe("string");
    expect(report.tip.length).toBeGreaterThan(0);
  });
});
