/**
 * substrate.ts — the git object write-path (T1.1/T1.5 slice): "Git is the ONLY durable store"
 * (docs/22 §1). ADR-B1 (accepted) names isomorphic-git as M0-M3's plumbing library; this file
 * does NOT import it (kip-sdk's package.json currently declares zero runtime dependencies, and
 * ADR-B6/this task's instructions are explicit: no `npm install`, no lockfile edits, this round
 * ships with only the devDeps already present). Instead it writes REAL, standard git LOOSE OBJECTS
 * by hand — `zlib.deflateSync("blob <len>\0<content>")` under `<dir>/objects/<hh>/<rest>`, hashed
 * with the manifest's configured algorithm (SHA-1 or SHA-256, docs/22 §1.3) via `node:crypto` —
 * so a real `git cat-file`/`git fsck` against this directory sees legitimate blob objects. This is
 * flagged in this task's `disputes` output: swapping this hand-rolled writer for isomorphic-git's
 * tree/commit/ref plumbing (full ADR-B1) is follow-up work once the dependency is actually
 * installed from a Linux/CI-consistent environment (ADR-B6).
 *
 * What IS implemented here: content-addressed, idempotent blob writes (INV-7's CID-dedup, at the
 * storage layer) and the `/facts/<shardHi>/<shardLo>/<oid>.json` shard layout (docs/22 §1.3).
 * What is NOT yet implemented: tree objects, commits, and refs (T1.5's "batched commit +
 * durability signalling" is scaffolded via `SeqTipStore` below for T1.2.5's durable persistence
 * requirement, but full commit/ref assembly is left `unimplemented` per this task's scope note
 * that `txn`/`commit` stay throwing stubs).
 *
 * INVARIANT: canonical fact content lives ONLY in the oid-keyed object store (`writeBlob`/
 * `readBlobContent`, keyed by the fact's REAL content hash). The caller-declared `factId` is used
 * ONLY as an eviction-witness leaf filename (`facts/by-id/<oid>/<factId>.json`, see `writeFactBlob`/
 * `writeFactWitness` below) — never as a content key or path-collision-relevant identifier, because
 * well-formed.ts's item-4 self-consistency check is a documented length-only heuristic, not a real
 * hash-recompute-and-compare, so two admitted facts can legitimately declare the same `factId` with
 * different content. See round2-storage-collision-fix.test.ts and round3-witness-collision-fix.test.ts
 * for the regression tests covering the attacks this design closes (a grindable shard-prefix content
 * collision, and a shared eviction-witness file masking an unrelated fact's eviction, respectively).
 */
import { createHash } from "node:crypto";
import { deflateSync, inflateSync } from "node:zlib";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import type { SelfWitnessedExcisionRecord } from "./proj";

export type HashAlgo = "sha1" | "sha256";

export function gitBlobId(content: Buffer, algo: HashAlgo): string {
  const header = Buffer.from(`blob ${content.length}\0`, "utf8");
  return createHash(algo).update(Buffer.concat([header, content])).digest("hex");
}

export interface WriteResult {
  oid: string;
  /** `false` iff the blob was already present — the INV-7 CID-dedup no-op. */
  created: boolean;
}

/**
 * One `kip-facts-index.json` entry — the canonical, collision-safe record of one DISTINCT admitted
 * fact-content blob (keyed, at the JSON-object level, by a path built from the fact's FULL real
 * content `oid`; see `writeFactBlob`). `witnessRelPath` is purely a pointer to this admission's
 * eviction witness file (see `writeFactWitness`) — it plays no role in content lookup, only in
 * deciding whether `listFactBlobs` should still consider this entry's content locally present.
 * `witnessRelPath` is namespaced by this entry's own `oid` (`facts/by-id/<oid>/<factId>.json`, not
 * `facts/by-id/<factId>.json`) — see this file's top-level doc comment.
 */
interface FactsIndexEntry {
  oid: string;
  witnessRelPath: string;
}

/**
 * A single-repo git object/fact-tree substrate rooted at `dir`. `dir` is either the caller's
 * `OpenOptions.dir` (via `open()`) or a lazily-created OS temp directory for a bare
 * `new KipRepo()` (no `open()` call) — see index.ts.
 */
export class Substrate {
  readonly dir: string;
  readonly hashAlgo: HashAlgo;
  private readonly objectsDir: string;
  private readonly factsIndexPath: string;

  constructor(dir: string, hashAlgo: HashAlgo = "sha1") {
    this.dir = dir;
    this.hashAlgo = hashAlgo;
    this.objectsDir = path.join(dir, "objects");
    this.factsIndexPath = path.join(dir, "kip-facts-index.json");
    fs.mkdirSync(this.objectsDir, { recursive: true });
  }

  static createTemp(hashAlgo: HashAlgo = "sha1"): Substrate {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "kip-sdk-"));
    return new Substrate(dir, hashAlgo);
  }

  private objectPath(oid: string): string {
    return path.join(this.objectsDir, oid.slice(0, 2), oid.slice(2));
  }

  hasBlob(oid: string): boolean {
    return fs.existsSync(this.objectPath(oid));
  }

  /** Write a loose git blob object; a no-op (INV-7) if the object is already present. */
  writeBlob(content: Buffer): WriteResult {
    const oid = gitBlobId(content, this.hashAlgo);
    const objPath = this.objectPath(oid);
    if (fs.existsSync(objPath)) return { oid, created: false };
    fs.mkdirSync(path.dirname(objPath), { recursive: true });
    const header = Buffer.from(`blob ${content.length}\0`, "utf8");
    fs.writeFileSync(objPath, deflateSync(Buffer.concat([header, content])));
    return { oid, created: true };
  }

  /**
   * Write `/facts/<shardHi>/<shardLo>/<oid>.json` (docs/22 §1.2/§1.3: first 2 + next 2 hex chars
   * of the fact's CID, default depth 2). Idempotent: re-offering byte-identical content is a no-op
   * at the object-store level (`writeBlob`'s own dedup) AND at the facts-index level (the path is
   * only recorded once).
   *
   * CALLER-DECLARED `factId` IS NOT USED TO DERIVE THE CANONICAL PATH — see this file's top-level
   * doc comment: the shard/filename are keyed off `oid`, the REAL content hash `writeBlob` computes
   * from `json`'s actual bytes, never off the caller-supplied `factId` parameter. Two facts only
   * ever share this canonical path if `writeBlob` independently computed the same real hash for
   * both, i.e. they are byte-identical content (INV-7a's actual guarantee) — no grindable
   * 2-byte-prefix shortcut, since the FULL oid is the key.
   *
   * ALSO writes a lightweight eviction WITNESS (`writeFactWitness`, below) — never a second copy of
   * the fact's bytes, just a pointer — purely so INV-14a's frozen test can find-and-delete a
   * specific admission's on-disk file to simulate local-store eviction (A-7). `factId` plays NO
   * role in canonical path derivation, content lookup, or dedup; it is used only (together with
   * `oid`) to name this witness pointer: the witness path is namespaced by `oid`
   * (`facts/by-id/<oid>/<factId>.json`), so two distinct-content facts that happen to declare the
   * same `factId` get two DISTINCT witness files — see this file's top-level doc comment and
   * round3-witness-collision-fix.test.ts.
   */
  writeFactBlob(factId: string, json: string): { relPath: string; oid: string; created: boolean } {
    const { oid, created } = this.writeBlob(Buffer.from(json, "utf8"));
    const hi = (oid.slice(0, 2) || "00").padEnd(2, "0");
    const lo = (oid.slice(2, 4) || "00").padEnd(2, "0");
    const relPath = `facts/${hi}/${lo}/${oid}.json`;
    // `encodeURIComponent` is defense-in-depth against a `factId` containing path-traversal
    // sequences (e.g. "../../etc") — a NO-OP for every plain alnum/dash/slash-free id this SDK's own
    // fixtures and self-minted (real-CID) ids ever use, so it never changes the literal filename an
    // ordinary caller (or inv-14a.test.ts's own recursive `<factId>.json` search, which is agnostic
    // to directory depth) observes. The `oid` PATH SEGMENT above the filename (not the filename
    // itself) is what makes this witness path collision-safe per-distinct-content.
    const witnessRelPath = `facts/by-id/${oid}/${encodeURIComponent(factId)}.json`;
    const index = this.readFactsIndex();
    if (!(relPath in index)) {
      index[relPath] = { oid, witnessRelPath };
      fs.writeFileSync(this.factsIndexPath, JSON.stringify(index, null, 2));
    }
    this.writeFactWitness(witnessRelPath, oid);
    return { relPath, oid, created };
  }

  /**
   * Writes (or refreshes) a tiny eviction-witness POINTER FILE at `witnessRelPath` — its content is
   * just the oid text, NEVER a duplicate copy of the fact's actual JSON bytes; the object store
   * `writeBlob` writes to is the ONLY place fact content bytes live. `listFactBlobs` (below) never
   * reads this file's CONTENT — only whether it still EXISTS, which is what lets
   * inv-14a.test.ts's `fs.rmSync`/restore recipe simulate and reverse a local-store eviction (A-7)
   * of one specific admission. `witnessRelPath` is namespaced by `oid` (see `writeFactBlob`'s doc
   * comment above) so that two differing-content facts that happen to declare the SAME `factId` do
   * NOT share this witness path: `listFactBlobs` gates an entry's VISIBILITY on its witness's
   * presence, so a shared witness would let deleting it to evict one fact collaterally hide an
   * unrelated fact sharing the same declared id, even though its content was untouched in the object
   * store. See this file's top-level doc comment and round3-witness-collision-fix.test.ts.
   */
  private writeFactWitness(witnessRelPath: string, oid: string): void {
    const fullPath = path.join(this.dir, witnessRelPath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, oid, "utf8");
  }

  /**
   * M3/T4.6: PHYSICAL erasure of one admitted fact's content blob (excise, GDPR Art. 17,
   * docs/50-security-trust-tenancy.md §8.3) — the "one operation that breaks pure append-only".
   * Deletes the loose git object bytes at `oid` from `objects/` AND removes its facts-index entry
   * (and its eviction-witness pointer file), so `listFactBlobs`/`listFactBlobsWithOid` never again
   * enumerate this content: the ONLY copy of the fact's bytes THIS substrate ever held is now
   * genuinely gone from disk, not merely hidden behind a flag. A no-op if `oid` is not currently
   * indexed (idempotent, mirrors `writeBlob`'s own dedup-idempotence philosophy).
   *
   * Per docs §8.3's own "distributed-erasure residual" clause, this is a LOCAL, per-replica
   * guarantee only — a peer that already holds (or later re-syncs) a byte-identical copy of this
   * content under its own oid is entirely unaffected by this replica's own erasure; see index.ts's
   * `KipRepo.excise()`/`fsck()` doc comments for how the read layer stays honest about that.
   */
  erase(oid: string): void {
    const index = this.readFactsIndex();
    let changed = false;
    for (const [relPath, entry] of Object.entries(index)) {
      if (entry.oid !== oid) continue;
      delete index[relPath];
      changed = true;
      const witnessFullPath = path.join(this.dir, entry.witnessRelPath);
      if (fs.existsSync(witnessFullPath)) fs.rmSync(witnessFullPath);
    }
    if (changed) fs.writeFileSync(this.factsIndexPath, JSON.stringify(index, null, 2));
    const objPath = this.objectPath(oid);
    if (fs.existsSync(objPath)) fs.rmSync(objPath);
  }

  private readFactsIndex(): Record<string, FactsIndexEntry> {
    if (!fs.existsSync(this.factsIndexPath)) return {};
    return JSON.parse(fs.readFileSync(this.factsIndexPath, "utf8")) as Record<string, FactsIndexEntry>;
  }

  /** The exact inverse of `writeBlob`'s encoding: inflate the real git loose-object bytes at `oid`
   * and strip the `"blob <len>\0"` header, returning the original fact JSON bytes. */
  private readBlobContent(oid: string): Buffer {
    const inflated = inflateSync(fs.readFileSync(this.objectPath(oid)));
    const nul = inflated.indexOf(0);
    return inflated.subarray(nul + 1);
  }

  /**
   * M1/T2.2's facts-listing seam: read back every admitted fact's RAW JSON bytes — the concrete "S"
   * (the admitted fact SET) that `proj(S)` folds (SPEC.md §3.4). Returns RAW JSON STRINGS (not
   * parsed `Fact` objects) so this module stays decoupled from `index.ts`'s `Fact` shape — callers
   * (`index.ts` / `proj.ts`) own the `JSON.parse` + cast.
   *
   * Enumerates the collision-safe, oid-keyed `factsIndex` (one entry per DISTINCT admitted content
   * blob — see `writeFactBlob`'s doc comment) and reads each entry's bytes back EXCLUSIVELY from the
   * oid object store (`readBlobContent`) — never from the per-`factId` witness file (see this file's
   * top-level doc comment for why). An entry whose `witnessRelPath` has been removed from disk
   * (§3.5a retention-driven eviction, A-7 — inv-14a.test.ts's own test literally `fs.rmSync`s this
   * exact file) is skipped: that specific admission is genuinely, locally gone until re-fetched (the
   * witness restored with its original bytes), never a fabricated substitute for its content. A
   * missing OBJECT for an otherwise-witnessed entry is treated the same way (skipped, not thrown)
   * for the same reason.
   */
  listFactBlobs(): string[] {
    return this.listFactBlobsWithOid().map((entry) => entry.json);
  }

  /**
   * The same fold as `listFactBlobs()` above, but also returns each surviving entry's real content
   * `oid` alongside its JSON bytes. `index.ts`'s belief-audit lens (`rxFromByOid`/
   * `asOf({txTime, believer})`) needs something collision-safe to key a fact's receive-order stamp
   * by — the caller-declared `Fact.id` is NOT that (well-formed.ts's item-4 check is a length-only
   * heuristic, so two admitted facts can legitimately declare the same `id` with different content);
   * the real content `oid` this module already computes is. Kept as a separate method (rather than
   * changing `listFactBlobs`'s return shape) so every existing caller of the plain JSON-strings
   * method is untouched.
   */
  listFactBlobsWithOid(): Array<{ oid: string; json: string }> {
    const index = this.readFactsIndex();
    const out: Array<{ oid: string; json: string }> = [];
    for (const entry of Object.values(index)) {
      if (!fs.existsSync(path.join(this.dir, entry.witnessRelPath))) continue;
      let content: Buffer;
      try {
        content = this.readBlobContent(entry.oid);
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === "ENOENT") continue;
        throw err;
      }
      out.push({ oid: entry.oid, json: content.toString("utf8") });
    }
    return out;
  }
}

/** T1.2.5's "durable seq-tip persistence" — a small JSON side-file next to the object store. */
export class SeqTipStore {
  private readonly filePath: string;

  constructor(dir: string) {
    this.filePath = path.join(dir, "kip-seq-tips.json");
  }

  load(): Record<string, number> {
    if (!fs.existsSync(this.filePath)) return {};
    return JSON.parse(fs.readFileSync(this.filePath, "utf8")) as Record<string, number>;
  }

  save(snapshot: Record<string, number>): void {
    fs.writeFileSync(this.filePath, JSON.stringify(snapshot, null, 2));
  }
}

/**
 * A small JSON side-file, next to the object store, that durably persists the
 * `fingerprint -> SPKI PEM` entries a `KipRepo` learns about a REMOTE peer's real signing key via
 * `sync()` (index.ts's own "TRUST BOOTSTRAP" doc comment on `sync()`). `signing.ts`'s `KeyRegistry`
 * is otherwise an in-memory-only `Map` that a fresh `KipRepo` instance re-opened against an existing
 * `dir` starts from empty (own keypair + genesis `rootKeys` only) — without this store, that would
 * silently flip `isAuthorizedExcisionMarker`'s "never-registered-so-permissive" branch from closed
 * to open for a peer fact this replica HAD genuinely verified before the reopen, letting an
 * unrelated attacker's excision marker censor it post-restart (the restart-censorship attack this
 * closes). Mirrors `SeqTipStore`'s exact load/save shape (a plain JSON `Record`, no new runtime
 * dependency) so a reopened `KipRepo` pointed at the SAME `dir` re-seeds `keyRegistry` with every
 * peer key it had durably learned (own keypair / genesis `rootKeys` are already re-supplied by the
 * caller on every construction — see index.ts's constructor doc comment — so only `sync()`-learned
 * remote keys need this store). See reviews/build-final-report.md for the fuller adversarial-TDD
 * history.
 */
export class KeyRegistryStore {
  private readonly filePath: string;

  constructor(dir: string) {
    this.filePath = path.join(dir, "kip-key-registry.json");
  }

  load(): Record<string, string> {
    if (!fs.existsSync(this.filePath)) return {};
    return JSON.parse(fs.readFileSync(this.filePath, "utf8")) as Record<string, string>;
  }

  save(snapshot: Record<string, string>): void {
    fs.writeFileSync(this.filePath, JSON.stringify(snapshot, null, 2));
  }
}

/**
 * D-28: a small JSON side-file, next to the object store, that durably persists this replica's own
 * `(oid -> SelfWitnessedExcisionRecord)` map (index.ts's `selfWitnessedExcisionOids`) — mirrors
 * `KeyRegistryStore`'s exact load/save shape above. Without this, a `KipRepo` reopened against the
 * SAME `dir` starts that map empty, so a cell this replica legitimately self-excised in a prior
 * process lifetime re-folds to `"unknown"` instead of `"excised"` on restart (see this replica's
 * `excise()` doc comment and DEBTS.md D-28). Uses `import type` for `SelfWitnessedExcisionRecord`
 * (proj.ts) so this stays a type-only reference, erased at compile time — this module still has no
 * runtime dependency on proj.ts.
 */
export class SelfWitnessedExcisionStore {
  private readonly filePath: string;

  constructor(dir: string) {
    this.filePath = path.join(dir, "kip-self-witnessed-excisions.json");
  }

  load(): Record<string, SelfWitnessedExcisionRecord> {
    if (!fs.existsSync(this.filePath)) return {};
    return JSON.parse(fs.readFileSync(this.filePath, "utf8")) as Record<string, SelfWitnessedExcisionRecord>;
  }

  save(snapshot: Record<string, SelfWitnessedExcisionRecord>): void {
    fs.writeFileSync(this.filePath, JSON.stringify(snapshot, null, 2));
  }
}
