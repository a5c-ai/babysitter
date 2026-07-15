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
import { createHash, randomBytes } from "node:crypto";
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
  private readonly configPath: string;

  constructor(dir: string, hashAlgo: HashAlgo = "sha1") {
    this.dir = dir;
    this.hashAlgo = hashAlgo;
    this.objectsDir = path.join(dir, "objects");
    this.factsIndexPath = path.join(dir, "kip-facts-index.json");
    // The repo-LOCAL git config file (this substrate's `dir` IS the git dir — `objects/` sits
    // directly beneath it, bare-repo-style), the sole place the regenerate-not-3-way-merge driver's
    // COMMAND can live (`.gitattributes` only NAMES a driver; its command is per-clone config that
    // `.gitattributes` cannot ship, docs/22 §1.4 m7-4).
    this.configPath = path.join(dir, "config");
    fs.mkdirSync(this.objectsDir, { recursive: true });
  }

  /**
   * docs/22 §1.4 m7-4 (NORMATIVE): `kip open` (of any clone) MUST install `merge.kip-regen.driver`
   * into the repo-local git config BEFORE any other operation, and bind `/heads/**` + `/manifest.json`
   * to it via git attributes, so a stock `git merge` in a provisioned clone regenerates `/heads` from
   * the unioned `/facts` instead of silently 3-way-text-merging them. `.gitattributes` alone is
   * insufficient — it only names the driver; the driver's COMMAND lives here, in per-clone config.
   * Idempotent: re-installing over an already-provisioned config/attributes file is a no-op.
   *
   * ROUND-2 finding #5 (HONESTY about what this provisions): the `driver` command below names a
   * `kip merge-regen` entrypoint. This SDK ships **no such binary** and **never invokes stock
   * `git merge`** — it realizes the "regenerate not 3-way-merge" rule (docs/22 §1.4) by folding
   * `proj()` LIVE over the unioned `/facts` on every read (see index.ts `getNode`/`asOf`), which is
   * the actual regeneration path that EXISTS. Writing this config is therefore the normative m7-4
   * PROVISIONING for a future real-git deployment (where a shipped `kip merge-regen` executable would
   * be on PATH), and `isMergeDriverInstalled`/`fsck().mergeDriverInstalled` honestly attest that the
   * config provisioning is PRESENT — they do NOT (and are documented not to) claim the command is a
   * resolvable executable in this library-only build. The command string is kept exactly as a real
   * deployment's config would carry it so provisioning is a no-op migration when the binary lands.
   */
  installMergeDriver(): void {
    const section = '[merge "kip-regen"]';
    const existingConfig = fs.existsSync(this.configPath) ? fs.readFileSync(this.configPath, "utf8") : "";
    if (!existingConfig.includes(section)) {
      const block =
        `${section}\n` +
        "\tname = kip regenerate-not-3-way-merge driver — discards both sides, recomputes /heads from unioned /facts (docs/22 §1.4)\n" +
        "\tdriver = kip merge-regen %O %A %B %P\n";
      const prefix = existingConfig.length > 0 ? existingConfig.replace(/\n?$/, "\n") : "";
      fs.writeFileSync(this.configPath, `${prefix}${block}`);
    }
    // Bind /heads/** and /manifest.json to the driver via the bare-repo attributes file (info/attributes).
    const infoDir = path.join(this.dir, "info");
    fs.mkdirSync(infoDir, { recursive: true });
    const attrPath = path.join(infoDir, "attributes");
    const attrLines = ["/heads/** merge=kip-regen", "/manifest.json merge=kip-regen"];
    const existingAttrs = fs.existsSync(attrPath) ? fs.readFileSync(attrPath, "utf8") : "";
    const missing = attrLines.filter((line) => !existingAttrs.includes(line));
    if (missing.length > 0) {
      const sep = existingAttrs.length > 0 && !existingAttrs.endsWith("\n") ? "\n" : "";
      fs.writeFileSync(attrPath, `${existingAttrs}${sep}${missing.join("\n")}\n`);
    }
  }

  /**
   * docs/22 §1.4 m7-4: `kip fsck` MUST verify the merge driver is installed (a missing driver is a
   * reported integrity failure). Genuinely reads the repo-local config and confirms the
   * `[merge "kip-regen"]` section is present AND carries a `driver =` command line (a named section
   * with no driver command would still silently fall back to the default 3-way text merge). It ALSO
   * confirms the `/heads/**` + `/manifest.json` attribute bindings that direct git to the driver are
   * present in `info/attributes` — a driver command with no attribute binding would never be reached.
   *
   * ROUND-2 finding #5 (HONESTY): this verifies the m7-4 config PROVISIONING is present and internally
   * consistent (section + `driver =` line + attribute bindings). It deliberately does NOT shell out to
   * check that the named `kip merge-regen` command resolves to an executable — this library ships no
   * such binary and never runs stock `git merge` (regeneration is `proj()`-live on read; see
   * `installMergeDriver`). So a `true` here means "provisioning present", not "an executable driver
   * would run"; `fsck().mergeDriverInstalled`'s field doc (index.ts) states the same bound.
   */
  isMergeDriverInstalled(): boolean {
    if (!fs.existsSync(this.configPath)) return false;
    const config = fs.readFileSync(this.configPath, "utf8");
    const sectionIdx = config.indexOf('[merge "kip-regen"]');
    if (sectionIdx === -1) return false;
    const afterSection = config.slice(sectionIdx);
    const nextSectionIdx = afterSection.indexOf("\n[", 1);
    const sectionBody = nextSectionIdx === -1 ? afterSection : afterSection.slice(0, nextSectionIdx);
    if (!/(^|\n)\s*driver\s*=/.test(sectionBody)) return false;
    // The attribute bindings that actually route /heads + /manifest.json through the driver must also
    // be present — a driver command git is never told to use is not "installed" in any useful sense.
    const attrPath = path.join(this.dir, "info", "attributes");
    if (!fs.existsSync(attrPath)) return false;
    const attrs = fs.readFileSync(attrPath, "utf8");
    return attrs.includes("/heads/** merge=kip-regen") && attrs.includes("/manifest.json merge=kip-regen");
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

/**
 * D-36 ROUND-6 CRITIC FIX (CRITICAL, convergence-safety — tip-persistence crash-safety): writes a
 * JSON side-file CRASH-SAFELY by first writing to a temp sibling file IN THE SAME DIRECTORY, then
 * `fs.renameSync`-ing it over the real target path. A same-volume rename is atomic on both POSIX
 * and NTFS, so a `fs.writeFileSync` that fails PARTWAY THROUGH (disk-full, a Windows EBUSY/EPERM
 * file-lock — both already named as live risks elsewhere in this file's own doc comments) can NEVER
 * leave a truncated/torn file at the real path: either the rename completes (the new content is now
 * durably in place, atomically, all-at-once) or it doesn't (the OLD file — or no file, on a first
 * write — is exactly what's still there). There is no observable in-between state, unlike the prior
 * single unguarded `fs.writeFileSync(filePath, ...)` this replaces for `SeqTipStore`/`CommitTipStore`
 * (below) — see `CorruptTipFileError`'s own doc comment for the read-side half of this fix. The temp
 * file's name embeds the pid and a random suffix so concurrent writers (not a supported concurrency
 * mode for a single substrate dir, see `KipRepo.txn()`'s own "Concurrency scope" doc comment, but
 * cheap to make safe here regardless) never collide on the same temp path.
 */
function writeJsonAtomic(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  const tmpPath = path.join(dir, `.${path.basename(filePath)}.tmp-${process.pid}-${randomBytes(6).toString("hex")}`);
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  fs.renameSync(tmpPath, filePath);
}

/**
 * D-36 ROUND-6 CRITIC FIX (CRITICAL, convergence-safety — tip-persistence crash-safety): thrown by
 * `SeqTipStore.load()`/`CommitTipStore.load()` when the tip file EXISTS on disk but its content
 * fails to parse as JSON — a corrupt/torn file. Before this fix, both loaders did a bare
 * `JSON.parse(fs.readFileSync(...))` with no guard at all: a parse failure threw a raw, unexplained
 * `SyntaxError` straight out of `.load()`, and since `getSubstrate()` (index.ts) calls both loaders
 * UNGUARDED during `KipRepo.open()`, that raw throw PERMANENTLY BRICKED every future `getSubstrate()`
 * call (i.e. the entire repo) against that directory — with no indication to the caller of what was
 * actually wrong or how to recover.
 *
 * `writeJsonAtomic` (above) now makes a torn write-in-progress file structurally impossible going
 * forward (see its own doc comment), so a parse failure here means either (a) a pre-existing corrupt
 * file from BEFORE this fix was deployed, or (b) genuine external/manual corruption of the file —
 * either way this is surfaced LOUDLY with a distinct, typed `.code` and the file's own path, giving
 * an operator a clear diagnosis, rather than either an opaque raw-`SyntaxError` crash (the pre-fix
 * behavior) OR silently discarding the file's content and starting over as if it never existed (a
 * fallback CLAUDE.md prohibits: that would let a real, durable seq/commit tip silently regress
 * without any operator visibility, reopening exactly the seq-collision hazard this same round's
 * OTHER fix — the `currentFacts()` cross-validation in `getSubstrate()`, index.ts — closes for the
 * ordinary stale-but-parseable case).
 */
export class CorruptTipFileError extends Error {
  readonly code = "ERR_CORRUPT_TIP_FILE" as const;
  readonly filePath: string;

  constructor(filePath: string, cause: unknown) {
    super(
      `Corrupt tip file at "${filePath}": failed to parse its contents as JSON. This file is now ` +
        "written atomically (temp-file-then-rename), so a torn write-in-progress file should be " +
        "structurally impossible going forward — this indicates either a pre-existing corrupt file " +
        "from before that fix was deployed, or external/manual corruption of the file. Inspect or " +
        `restore "${filePath}" before reopening this repo against this directory; this file caches ` +
        "only a durable seq/commit tip — the underlying fact/commit data in this substrate's git " +
        "object store is unaffected and not itself at risk.",
      { cause },
    );
    this.name = "CorruptTipFileError";
    this.filePath = filePath;
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
    const raw = fs.readFileSync(this.filePath, "utf8");
    try {
      return JSON.parse(raw) as Record<string, number>;
    } catch (err) {
      throw new CorruptTipFileError(this.filePath, err);
    }
  }

  save(snapshot: Record<string, number>): void {
    writeJsonAtomic(this.filePath, snapshot);
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
 * D-36: a small JSON side-file, next to the object store, that durably persists the real git commit
 * oid `KipRepo.txn()` last wrote to THIS substrate's own `dir` (via its shared tree/commit-write
 * recipe with `regenerateHeads()`, see index.ts's `writeFactsTreeAndCommit`) — mirrors `SeqTipStore`'s
 * exact load/save shape above, just for a single scalar tip instead of a per-chain map. Without this,
 * a `KipRepo` reopened against the SAME `dir` would have no way to learn what its own last `txn()`
 * commit's oid was, and every subsequent `txn()` call would either re-parent onto `null` (a second,
 * disconnected root) or require re-deriving the tip by re-walking `.git` — this store makes it a
 * plain, durable O(1) read instead.
 */
export class CommitTipStore {
  private readonly filePath: string;

  constructor(dir: string) {
    this.filePath = path.join(dir, "kip-commit-tip.json");
  }

  load(): { tip: string | null } {
    if (!fs.existsSync(this.filePath)) return { tip: null };
    const raw = fs.readFileSync(this.filePath, "utf8");
    try {
      return JSON.parse(raw) as { tip: string | null };
    } catch (err) {
      throw new CorruptTipFileError(this.filePath, err);
    }
  }

  save(snapshot: { tip: string | null }): void {
    writeJsonAtomic(this.filePath, snapshot);
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
