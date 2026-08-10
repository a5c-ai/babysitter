/**
 * temp-dir-hygiene.test.ts — SUITE-HARDENING guard for DEBT **D-38** (work item `suite-hardening`,
 * sub-goal (c)). FROZEN, spec-driving, authored BEFORE the fix. Every test here is a D-38 regression
 * proof and MUST FAIL TODAY; the implement round makes them pass.
 *
 * D-38 items covered (see packages/kip-sdk/docs/DEBTS.md#d-38):
 *   - item 5 (HIGHEST-IMPACT): `Substrate.createTemp()` `mkdtempSync`s a real OS temp dir per bare
 *     `new KipRepo()` (provisioned on first write), but `KipRepo.close()` only unregisters from the
 *     in-process registry — it NEVER deletes the temp dir. Across a suite this leaks unboundedly; it
 *     twice exhausted the host `C:` drive (0 bytes free → spurious ENOSPC) during the fix-all program.
 *   - item 2: `writeJsonAtomic()` (substrate.ts) writes a temp sibling then `fs.renameSync`s it over
 *     the target, with NO try/finally around the rename — a rename failure (e.g. Windows EPERM)
 *     leaves an orphaned `.tmp-*` file.
 *   - item 1: `KeyRegistryStore`/`SelfWitnessedExcisionStore` still `load()` via an unguarded
 *     `JSON.parse(fs.readFileSync(...))` — a torn/corrupt side-file throws a RAW `SyntaxError`
 *     (no `.code`) rather than a typed error like `SeqTipStore`/`CommitTipStore`'s `CorruptTipFileError`.
 *
 * These tests do NOT implement the fix — they pin the target behavior so the implement round has a
 * red→green signal and a permanent regression guard.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import { KipRepo } from "../index";
import { KeyRegistryStore, SelfWitnessedExcisionStore, SeqTipStore } from "../substrate";

/** A minimal, valid `assertFact` input — enough to force `getSubstrate()` (⇒ `createTemp()`) on a
 * bare `new KipRepo()`. Signature/HLC/seq are filled by `mintFact`; a "pending" status is fine (the
 * point is that the temp substrate dir gets provisioned on disk). Mirrors m0-signing-and-substrate.test.ts. */
function assertDraft(eid: string): Parameters<KipRepo["assertFact"]>[0] {
  return {
    v: 1,
    type: "assert",
    target: { kind: "node", eid, nodeKind: "person" },
    value: "x",
    validFrom: 0,
    validTo: null,
    replicaId: "replica-hygiene",
    provenance: {
      author: "hygiene-test",
      signature: "overwritten-by-mint",
      publicKeyFingerprint: "overwritten-by-mint",
      signedFields: [],
    },
  } as Parameters<KipRepo["assertFact"]>[0];
}

/** Read the private, lazily-provisioned substrate dir off a repo (TS `private` is compile-time only;
 * the runtime property exists once a write has provisioned it). Deterministic per-repo, so this
 * guard is NOT racy against parallel workers also creating `kip-sdk-*` dirs in os.tmpdir(). */
function provisionedSubstrateDir(repo: KipRepo): string | undefined {
  return (repo as unknown as { substrate?: { dir: string } }).substrate?.dir;
}

describe("D-38 item 5: Substrate.createTemp()/KipRepo.close() must not leak temp dirs", () => {
  it("close() removes every createTemp()-provisioned temp dir (net-new leak == 0)", async () => {
    const tmpRoot = os.tmpdir();

    const createdDirs: string[] = [];
    for (let i = 0; i < 4; i++) {
      const repo = new KipRepo();
      await repo.assertFact(assertDraft(`person/hygiene-${i}`));
      const dir = provisionedSubstrateDir(repo);
      expect(dir, "a bare new KipRepo() write should have provisioned a createTemp() substrate dir").toBeTruthy();
      expect(fs.existsSync(dir as string)).toBe(true);
      createdDirs.push(dir as string);
      repo.close();
    }

    // THE D-38 PROOF: after close(), NONE of the createTemp()-provisioned dirs may survive on disk.
    // This FAILS today because close() only unregisters — it never rmSync's the temp dir.
    const leaked = createdDirs.filter((d) => fs.existsSync(d));
    expect(
      leaked,
      `KipRepo.close() leaked ${leaked.length}/${createdDirs.length} createTemp() temp dir(s) ` +
        `(D-38 item 5 — the disk-exhaustion leak):\n${leaked.join("\n")}`,
    ).toEqual([]);

    // Secondary (DETERMINISTIC, parallelism-independent): a scoped restatement of "we grew the shared
    // pool net-zero". This reads only THIS test's OWN unique `kip-sdk-*` basenames out of the shared
    // os.tmpdir() listing — never a raw COUNT of the pool, which other parallel workers concurrently
    // add to and remove from between two snapshots (the old count+tolerance form depended on the
    // vitest fork cap to stay under its fudge factor; this form does not — it is exact at any fork
    // count because it never observes another worker's dirs).
    const ourBasenames = new Set(createdDirs.map((d) => path.basename(d)));
    const survivingOurs = fs.readdirSync(tmpRoot).filter((n) => ourBasenames.has(n));
    expect(
      survivingOurs,
      `close() left ${survivingOurs.length}/${createdDirs.length} of THIS test's own createTemp() ` +
        `dirs in the shared os.tmpdir() pool: ${survivingOurs.join(", ")}`,
    ).toEqual([]);
  });
});

describe("D-38 item 2: writeJsonAtomic must clean up its temp file if the rename fails", () => {
  it("a renameSync failure leaves NO orphaned .tmp-* file (exercised via SeqTipStore.save())", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kip-sdk-d38-atomic-"));
    try {
      const store = new SeqTipStore(dir);
      // Force the exact failure mode D-38 item 2 names (a `fs.renameSync` that throws after the temp
      // sibling is already written) WITHOUT mocking node:fs (its ESM namespace is not spy-able):
      // pre-create the rename TARGET (`kip-seq-tips.json`) as a DIRECTORY, so renaming the temp file
      // onto it throws EISDIR/EPERM on both POSIX and Windows. writeJsonAtomic has no try/finally
      // around the rename today, so its temp sibling is orphaned when the rename throws.
      fs.mkdirSync(path.join(dir, "kip-seq-tips.json"));
      expect(() => store.save({ "chain-a": 3 })).toThrow();

      const orphans = fs.readdirSync(dir).filter((n) => n.includes(".tmp-"));
      expect(
        orphans,
        `writeJsonAtomic leaked ${orphans.length} orphaned temp file(s) on a rename failure ` +
          `(D-38 item 2): ${orphans.join(", ")}`,
      ).toEqual([]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("D-38 item 1: side-file loads must be guarded (typed error, not a raw SyntaxError)", () => {
  function expectTypedCorruptLoadError(load: () => unknown, label: string): void {
    let err: unknown;
    try {
      load();
    } catch (e) {
      err = e;
    }
    expect(err, `${label}: a corrupt side-file must surface an error`).toBeDefined();
    expect(
      (err as { name?: string }).name,
      `${label}: must be a TYPED kip error, not a raw JSON SyntaxError`,
    ).not.toBe("SyntaxError");
    expect(
      (err as { code?: string }).code,
      `${label}: the typed error must carry an ERR_* code (like CorruptTipFileError's ERR_CORRUPT_TIP_FILE)`,
    ).toMatch(/^ERR_/);
  }

  it("KeyRegistryStore.load() throws a typed error on a torn/corrupt file", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kip-sdk-d38-keyreg-"));
    try {
      fs.writeFileSync(path.join(dir, "kip-key-registry.json"), "{ this is not valid json", "utf8");
      expectTypedCorruptLoadError(() => new KeyRegistryStore(dir).load(), "KeyRegistryStore");
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("SelfWitnessedExcisionStore.load() throws a typed error on a torn/corrupt file", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kip-sdk-d38-excision-"));
    try {
      fs.writeFileSync(
        path.join(dir, "kip-self-witnessed-excisions.json"),
        "{ torn side-file :::",
        "utf8",
      );
      expectTypedCorruptLoadError(
        () => new SelfWitnessedExcisionStore(dir).load(),
        "SelfWitnessedExcisionStore",
      );
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
