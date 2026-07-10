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
 * storage layer) and the `/facts/<shardHi>/<shardLo>/<factId>.json` shard layout (docs/22 §1.3).
 * What is NOT yet implemented: tree objects, commits, and refs (T1.5's "batched commit +
 * durability signalling" is scaffolded via `SeqTipStore` below for T1.2.5's durable persistence
 * requirement, but full commit/ref assembly is left `unimplemented` per this task's scope note
 * that `txn`/`commit` stay throwing stubs).
 */
import { createHash } from "node:crypto";
import { deflateSync, inflateSync } from "node:zlib";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

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
   * CALLER-DECLARED `factId` IS NOT USED TO DERIVE THE PATH (this round's finding #3, previously a
   * real divergence vector): the shard/filename are keyed off `oid` — the REAL content hash
   * `writeBlob` computes from `json`'s actual bytes — never off the caller-supplied `factId`
   * parameter. Previously the path was built from `factId` directly, so two facts with a
   * colliding/attacker-chosen `id` (well-formed.ts's item-4 self-consistency check is
   * DELIBERATELY a length-only heuristic for externally-supplied facts, see its doc comment) could
   * silently overwrite each other's facts-index entry, with the outcome depending on arrival order
   * — a real cross-replica divergence and silent-data-loss vector. Keying off `oid` instead makes a
   * storage-path collision between DIFFERING content impossible regardless of what `id` either
   * fact claims: two facts only ever share a path if `writeBlob` independently computed the same
   * real hash for both, i.e. they are byte-identical content (INV-7a's actual guarantee). `factId`
   * is accepted as a parameter purely so call sites can log/correlate against the fact's own
   * declared id; it plays no role in path derivation or dedup.
   */
  writeFactBlob(_factId: string, json: string): { relPath: string; oid: string; created: boolean } {
    const { oid, created } = this.writeBlob(Buffer.from(json, "utf8"));
    const hi = (oid.slice(0, 2) || "00").padEnd(2, "0");
    const lo = (oid.slice(2, 4) || "00").padEnd(2, "0");
    const relPath = `facts/${hi}/${lo}/${oid}.json`;
    const index = this.readFactsIndex();
    if (!(relPath in index)) {
      index[relPath] = oid;
      fs.writeFileSync(this.factsIndexPath, JSON.stringify(index, null, 2));
    }
    return { relPath, oid, created };
  }

  private readFactsIndex(): Record<string, string> {
    if (!fs.existsSync(this.factsIndexPath)) return {};
    return JSON.parse(fs.readFileSync(this.factsIndexPath, "utf8")) as Record<string, string>;
  }

  /**
   * M1/T2.2's facts-listing seam: read back every admitted fact's RAW JSON bytes (as durably
   * written by `writeFactBlob`) — the concrete "S" (the admitted fact SET) that `proj(S)` folds
   * (SPEC.md §3.4). Deflates the real git loose-object bytes at each indexed `oid` and strips the
   * `"blob <len>\0"` header (the exact inverse of `writeBlob`'s own encoding). Dedup is automatic:
   * `readFactsIndex()`'s values are themselves already oid-deduplicated (INV-7a — two facts with
   * byte-identical content collapse to ONE index entry, see `writeFactBlob`'s doc comment), so this
   * never returns two copies of the same content-addressed fact. Returns RAW JSON STRINGS (not
   * parsed `Fact` objects) so this module stays decoupled from `index.ts`'s `Fact` shape — callers
   * (`index.ts` / `proj.ts`) own the `JSON.parse` + cast.
   */
  listFactBlobs(): string[] {
    const index = this.readFactsIndex();
    const oids = new Set(Object.values(index));
    const out: string[] = [];
    for (const oid of oids) {
      const compressed = fs.readFileSync(this.objectPath(oid));
      const inflated = inflateSync(compressed);
      const nul = inflated.indexOf(0);
      out.push(inflated.subarray(nul + 1).toString("utf8"));
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
