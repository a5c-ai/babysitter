/**
 * round6-tip-persistence-crash-safety.test.ts — D-36 ROUND-6 CRITIC FIX (CRITICAL,
 * convergence-safety): a FRESH, focused round of 3 independent critics found the tip-persistence
 * layer (`SeqTipStore`/`CommitTipStore`, substrate.ts) still had real gaps after 5 prior rounds:
 * both `.save()` methods were a single unguarded `fs.writeFileSync` (not atomic — no
 * write-to-temp-then-rename), and both `.load()` methods did a bare
 * `JSON.parse(fs.readFileSync(...))` with NO try/catch, unlike `KeyRegistryStore`'s/
 * `SelfWitnessedExcisionStore`'s loaders. A `fs.writeFileSync` that fails mid-write (disk-full,
 * Windows EBUSY/EPERM) could leave TRUNCATED/INVALID JSON on disk; the next `KipRepo.open()` against
 * that same substrate.dir would then hit an UNGUARDED `JSON.parse` inside `getSubstrate()`,
 * PERMANENTLY BRICKING every future `getSubstrate()` call (i.e. the entire repo) against that
 * directory.
 *
 * Fixed (substrate.ts): `writeJsonAtomic()` now backs both `.save()` methods — write to a temp
 * sibling file in the SAME directory, then `fs.renameSync` over the real target (atomic on both
 * POSIX and NTFS for same-volume renames), so a failure mid-write can never leave a torn file at the
 * real path. Both `.load()` methods now guard their `JSON.parse` call and throw a typed,
 * distinctly-coded `CorruptTipFileError` (`.code === "ERR_CORRUPT_TIP_FILE"`) naming the file, rather
 * than letting a raw `SyntaxError` escape unguarded — never silently swallowing/discarding the
 * corrupt file either (fallbacks are evil, CLAUDE.md), just surfacing it loudly and clearly instead
 * of bricking the repo with an opaque crash.
 *
 * ISOLATED IN ITS OWN FILE (deliberately, not appended to m6-round4-critic-fixes.test.ts): these
 * tests need `vi.mock("node:fs", ...)` to inject a one-off `writeFileSync` failure (`node:fs`'s real
 * ES module namespace is frozen/non-configurable under vitest, so `vi.spyOn(fs, "writeFileSync")`
 * cannot patch it directly without a module-level mock — a vitest ESM limitation, not a bug in the
 * write path under test). Mocking `node:fs` module-wide would otherwise leak into every OTHER test in
 * a shared file that exercises `KipRepo.txn()` (which calls through `isomorphic-git`'s own `fs`-based
 * `FileSystem`/`writeBlob`, and breaks when `node:fs` is replaced with a plain object rather than the
 * real module) — this file imports ONLY `substrate.ts`'s stores directly plus one `KipRepo.assertFact`
 * (non-txn) call, deliberately avoiding `KipRepo.txn()`/`isomorphic-git` entirely, so the mock stays
 * safely scoped to this one file with no cross-file contamination risk.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { KipRepo, generateEd25519KeyPair } from "../index";
import { CommitTipStore, CorruptTipFileError, SeqTipStore } from "../substrate";

// See this file's own top-level doc comment for why this mock exists and why it is safely scoped to
// this one file: a plain, mutable shallow copy of the real module, delegating to the REAL
// implementation for every export by default, so nothing here behaves differently from the real
// `node:fs` unless a specific test explicitly `vi.spyOn`s over one export for one call.
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return { ...actual };
});

describe("D-36 ROUND-6 CRITIC FIX (CRITICAL, convergence-safety — tip-persistence crash-safety): SeqTipStore/CommitTipStore now write atomically (temp-then-rename) and guard JSON.parse on load, surfacing a corrupt file as a typed CorruptTipFileError instead of either bricking getSubstrate() with a raw SyntaxError or leaving a torn file", () => {
  const tmpDirs: string[] = [];
  afterEach(() => {
    for (const dir of tmpDirs.splice(0)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("SeqTipStore.save(): a write failure PARTWAY THROUGH (simulated fs.writeFileSync throw, e.g. disk-full) never leaves a torn file at the real path — the OLD content survives byte-identical, and no stray temp file is left behind either", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kip-sdk-round6-atomic-seq-"));
    tmpDirs.push(dir);
    const store = new SeqTipStore(dir);
    const filePath = path.join(dir, "kip-seq-tips.json");

    store.save({ "chain-a": 3 });
    const before = fs.readFileSync(filePath, "utf8");
    expect(JSON.parse(before)).toEqual({ "chain-a": 3 });

    const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementationOnce(() => {
      throw new Error("simulated ENOSPC (disk-full) mid-write");
    });
    try {
      expect(() => store.save({ "chain-a": 99 })).toThrow("simulated ENOSPC");
    } finally {
      writeSpy.mockRestore();
    }

    // The REAL file at `filePath` is byte-identical to before the failed write attempt — never a
    // truncated/torn "99" write. This is only possible because the failed write targeted a TEMP
    // file (which the mocked `writeFileSync` never even created), never the real path directly.
    const after = fs.readFileSync(filePath, "utf8");
    expect(after).toBe(before);
    expect(JSON.parse(after)).toEqual({ "chain-a": 3 });

    const entries = fs.readdirSync(dir);
    expect(entries.filter((f) => f.includes(".tmp-"))).toEqual([]);
  });

  it("SeqTipStore.save(): the write path is temp-then-rename, never a direct write to the real path — no stray '.tmp-' file survives a SUCCESSFUL save() either, and the directory ends up with exactly one file", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kip-sdk-round6-atomic-seq2-"));
    tmpDirs.push(dir);
    const store = new SeqTipStore(dir);
    store.save({ "chain-a": 1 });
    store.save({ "chain-a": 2 });
    expect(fs.readdirSync(dir)).toEqual(["kip-seq-tips.json"]);
    expect(JSON.parse(fs.readFileSync(path.join(dir, "kip-seq-tips.json"), "utf8"))).toEqual({ "chain-a": 2 });
  });

  it("CommitTipStore.save(): the same crash-safe write/rename fix applies — a failed write never leaves a torn commit-tip file", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kip-sdk-round6-atomic-commit-"));
    tmpDirs.push(dir);
    const store = new CommitTipStore(dir);
    const filePath = path.join(dir, "kip-commit-tip.json");
    store.save({ tip: "aaaa" });
    const before = fs.readFileSync(filePath, "utf8");

    const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementationOnce(() => {
      throw new Error("simulated EBUSY mid-write");
    });
    try {
      expect(() => store.save({ tip: "bbbb" })).toThrow("simulated EBUSY");
    } finally {
      writeSpy.mockRestore();
    }
    expect(fs.readFileSync(filePath, "utf8")).toBe(before);
  });

  it("SeqTipStore.load(): a corrupt (invalid-JSON) tip file throws a typed CorruptTipFileError (ERR_CORRUPT_TIP_FILE) naming the file — never a raw, unexplained SyntaxError, and never silently treated as an absent/empty file", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kip-sdk-round6-corrupt-seq-"));
    tmpDirs.push(dir);
    const filePath = path.join(dir, "kip-seq-tips.json");
    fs.writeFileSync(filePath, "{ this is not valid JSON <<<TORN");

    const store = new SeqTipStore(dir);
    let thrown: unknown;
    try {
      store.load();
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(CorruptTipFileError);
    expect((thrown as CorruptTipFileError).code).toBe("ERR_CORRUPT_TIP_FILE");
    expect((thrown as CorruptTipFileError).filePath).toBe(filePath);
    expect((thrown as Error).message).toContain(filePath);
    // NEVER a raw SyntaxError escaping unguarded (the pre-fix behavior), and never silently
    // discarded/replaced with an empty snapshot (a fallback CLAUDE.md prohibits):
    expect(thrown).not.toBeInstanceOf(SyntaxError);
  });

  it("CommitTipStore.load(): the same guarded-parse fix applies to the commit-tip file", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kip-sdk-round6-corrupt-commit-"));
    tmpDirs.push(dir);
    const filePath = path.join(dir, "kip-commit-tip.json");
    fs.writeFileSync(filePath, "not json at all");

    const store = new CommitTipStore(dir);
    expect(() => store.load()).toThrow(CorruptTipFileError);
    try {
      store.load();
      expect.unreachable("store.load() must throw for a corrupt file");
    } catch (err) {
      expect(err).toBeInstanceOf(CorruptTipFileError);
      expect((err as CorruptTipFileError).code).toBe("ERR_CORRUPT_TIP_FILE");
    }
  });

  it("a KipRepo pointed at a dir with a corrupt kip-seq-tips.json surfaces the SAME typed CorruptTipFileError from its first substrate-touching call — never an opaque, un-typed raw SyntaxError (pre-fix, this PERMANENTLY BRICKED every future getSubstrate() call against that directory; post-fix it still correctly refuses to proceed against unrecoverable corrupt state, but names exactly what's wrong)", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kip-sdk-round6-corrupt-repo-"));
    tmpDirs.push(dir);
    fs.writeFileSync(path.join(dir, "kip-seq-tips.json"), "{{{ corrupt");

    const repo = new KipRepo({ dir, replicaId: "round6-corrupt-repo" });
    let thrown: unknown;
    try {
      await repo.assertFact({
        type: "assert",
        v: 1,
        target: { kind: "node", eid: "person/round6-corrupt", nodeKind: "person" },
        value: true,
        validFrom: 0,
        validTo: null,
        replicaId: "round6-corrupt-repo",
        provenance: { author: "self" },
      });
    } catch (err) {
      thrown = err;
    }
    expect(thrown).toBeInstanceOf(CorruptTipFileError);
    expect((thrown as CorruptTipFileError).code).toBe("ERR_CORRUPT_TIP_FILE");
    repo.close();
  });

  it("D-36 ROUND-7 CRITIC FIX (CRITICAL, silent-permanent-reseed-disable — live-reproduced seq collision): a corrupt kip-seq-tips.json throws on the FIRST getSubstrate()-triggering call, throws AGAIN (not silently succeeds) on a SECOND call while still corrupt, and only succeeds — with correctly cross-validated seq state, never colliding with an already-durable fact on the same chain — once the file is fixed", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kip-sdk-round7-reseed-retry-"));
    tmpDirs.push(dir);
    const seqTipPath = path.join(dir, "kip-seq-tips.json");
    const replicaId = "round7-reseed-retry";
    // A fixed, shared keypair — both `KipRepo` instances below must mint onto the SAME chain
    // (`chainIdFor(replicaId, publicKeyFingerprint)`) for this test to prove anything about a seq
    // COLLISION; two instances with independently auto-generated keypairs would land on different
    // chains and never collide regardless of whether the reseed bug is present.
    const keyPair = generateEd25519KeyPair();

    // Seed a real, durably-admitted fact on this chain via a FIRST short-lived `KipRepo` instance —
    // mirrors the bug's own live-reproduced scenario: "two distinct facts durably admitted with
    // identical (chainId, seq)" can only happen when a chain already has durable history that a later
    // reseed must respect.
    const seedEid = "round7-reseed-retry:node/seed";
    const seedRepo = new KipRepo({ dir, replicaId, keyPair });
    const seedOutcome = await seedRepo.assertFact({
      type: "assert",
      v: 1,
      target: { kind: "node", eid: seedEid, nodeKind: "person" },
      value: true,
      validFrom: 0,
      validTo: null,
      replicaId,
      provenance: { author: "self" },
    });
    seedRepo.close();

    // Corrupt the seq-tip file — simulating exactly the "process crashed before this instance's own
    // next mint would have self-healed the file" scenario `getSubstrate()`'s own round-6 doc comment
    // describes: a fresh process now reopens this same `dir` and must reconstruct `chainSequencer`
    // from scratch, genuinely retrying on failure rather than silently trusting a pristine default.
    fs.writeFileSync(seqTipPath, "{{{ corrupt, not valid JSON");

    // A FRESH `KipRepo` instance (own `this.substrate` starts `undefined`) pointed at the SAME `dir`
    // and SAME keypair — simulating the reopen-after-crash this bug targets.
    const repo = new KipRepo({ dir, replicaId, keyPair });
    const eid = "round7-reseed-retry:node/a";

    const assertOnce = () =>
      repo.assertFact({
        type: "assert",
        v: 1,
        target: { kind: "node", eid, nodeKind: "person" },
        value: true,
        validFrom: 0,
        validTo: null,
        replicaId,
        provenance: { author: "self" },
      });

    // First call: throws — the seq-tip file is genuinely corrupt.
    let firstErr: unknown;
    try {
      await assertOnce();
    } catch (err) {
      firstErr = err;
    }
    expect(firstErr).toBeInstanceOf(CorruptTipFileError);
    expect((firstErr as CorruptTipFileError).code).toBe("ERR_CORRUPT_TIP_FILE");

    // Second call, file STILL corrupt: PRE-FIX, `this.substrate` was assigned before the
    // `SeqTipStore.load()` throw on the first call, so this second call's `if (!this.substrate)` guard
    // would short-circuit and silently "succeed" with `chainSequencer` stuck at its pristine empty
    // default (never re-attempting the load, never re-throwing) — the exact silent-permanent-disable
    // bug. POST-FIX, `this.substrate` genuinely stays `undefined` after a throw, so this call must
    // GENUINELY RETRY the whole sequence and fail loudly again, consistently.
    let secondErr: unknown;
    try {
      await assertOnce();
    } catch (err) {
      secondErr = err;
    }
    expect(secondErr).toBeInstanceOf(CorruptTipFileError);
    expect((secondErr as CorruptTipFileError).code).toBe("ERR_CORRUPT_TIP_FILE");

    // Now fix the file — worst case, resetting it to an EMPTY/stale tip (simulating the "persisted tip
    // file is BEHIND a fact that already committed durably" scenario `getSubstrate()`'s round-6 doc
    // comment names) — and confirm the THIRD call succeeds, with correctly cross-validated state: the
    // reseed must fold in the seed fact's own real, durable seq (never trusting the empty persisted
    // tip alone), so this newly-minted fact's seq is STRICTLY GREATER than the seed fact's — never
    // colliding. PRE-FIX (even setting the round-7 bug aside), the silently-stuck-empty-default
    // `chainSequencer` from the second call would have minted the SAME seq as the seed fact here — a
    // real, silent, permanent seq collision on this chain.
    new SeqTipStore(dir).save({});
    const outcome = await assertOnce();
    expect(outcome.status).toBe("pending");
    expect(typeof outcome.seq).toBe("number");
    expect(outcome.seq).toBeGreaterThan(seedOutcome.seq);

    const seedView = await repo.getNode(seedEid);
    expect(seedView).not.toBeNull();
    const view = await repo.getNode(eid);
    expect(view).not.toBeNull();
    expect(view?.kind).toBe("person");

    repo.close();
  });
});
