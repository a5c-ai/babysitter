/**
 * D-32 (docs/DEBTS.md) — FROZEN acceptance tests, authored TEST-FIRST (nothing for D-32 is
 * implemented yet; see `exportKeyring()`'s throwing stub and the D-32 doc comments in
 * `../index.ts`). These tests are EXPECTED TO FAIL until D-32 is actually implemented; failures
 * should surface as thrown "unimplemented: exportKeyring" errors / real assertion mismatches, not
 * import or compile errors (mirroring the M0-era conformance suite's own documented convention —
 * see `__tests__/conformance/inv-13a.test.ts`'s doc comment for precedent).
 *
 * D-32 in one line: `open({dir, replicaId, keyring: undefined})` — the documented "no explicit
 * keyring supplied" fallback — mints a brand-new RANDOM Ed25519 identity every call
 * (`KipRepo.getOwnKeyPair`), nothing durably persists it anywhere `open()` reads back, and
 * `signing.ts`'s key-generation/import helpers were never part of this package's own public
 * surface — so a caller had no supported way to either (a) mint/persist a keyring up front, or (b)
 * export the auto-generated fallback identity for persistence. A `close()`+re-`open()` of the same
 * `dir` therefore comes back with a DIFFERENT signing identity, so the reopened replica can no
 * longer verify its own prior-session fact signatures (`fsck().badSignatures`), and `sync()`-ing
 * those pre-restart facts to a peer silently drops them as `signature-invalid`.
 *
 * Acceptance criteria under test (see this task's brief):
 *   1. index.ts re-exports generateEd25519KeyPair/importEd25519KeyPair/Ed25519KeyPair.
 *   2. A caller can mint+PEM-serialize a keypair via the re-exported helper and pass it as
 *      OpenOptions.keyring on a fresh open().
 *   3. KipRepo gains a public exportKeyring() returning the CURRENT ownKeyPair as PEM strings,
 *      callable any time after open()/construction.
 *   4. exportKeyring() right after open({keyring: undefined}) returns a PEM pair whose fingerprint
 *      matches the key that actually signed facts in that session.
 *   5. Persisting that exported PEM pair and passing it back as OpenOptions.keyring into a fresh
 *      open() on the SAME dir after close() restores the IDENTICAL signing identity.
 *   6. Facts asserted before close(), re-verified after close()+reopen() with the persisted
 *      keyring, are NOT listed in fsck().badSignatures.
 *   7. sync() from the reopened replica (restored keyring) to a peer registered before close() no
 *      longer drops pre-restart facts as signature-invalid.
 *   8. (Optional/nice-to-have) SyncReport gains a distinct signature-invalid rejection count.
 *   9. No behavior change to the default (no-keyring, never-restarted) path.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { describe, expect, it } from "vitest";
import {
  generateEd25519KeyPair,
  importEd25519KeyPair,
  KipRepo,
  open,
  type AssertInput,
  type Ed25519KeyPair,
  type OpenOptions,
  type SyncReport,
} from "../index";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "kip-d32-"));
}

/** A minimal well-formed `AssertInput` for a node-existence fact under the given replica. */
function makeAssertInput(replicaId: string, eid: string): AssertInput {
  return {
    v: 1,
    type: "assert",
    target: { kind: "node", eid, nodeKind: "D32TestNode" },
    value: undefined,
    validFrom: new Date().toISOString(),
    validTo: null,
    replicaId,
    provenance: {
      author: "d32-test-author",
      signature: "",
      publicKeyFingerprint: "",
      signedFields: [],
    },
  };
}

/** PEM-serializes a re-exported `Ed25519KeyPair` into the shape `OpenOptions.keyring` accepts. */
function toPemKeyring(kp: Ed25519KeyPair): { privateKeyPem: string; publicKeyPem: string } {
  return {
    privateKeyPem: kp.privateKey.export({ type: "pkcs8", format: "pem" }) as string,
    publicKeyPem: kp.publicKey.export({ type: "spki", format: "pem" }) as string,
  };
}

describe("D-32: durable signing-identity persistence across close()+open()", () => {
  it("(criterion 1) re-exports generateEd25519KeyPair/importEd25519KeyPair/Ed25519KeyPair from the public entrypoint", () => {
    expect(typeof generateEd25519KeyPair).toBe("function");
    expect(typeof importEd25519KeyPair).toBe("function");

    const kp = generateEd25519KeyPair();
    expect(typeof kp.fingerprint).toBe("string");
    expect(kp.fingerprint.length).toBeGreaterThan(0);

    // The re-exported import helper must round-trip the re-exported generate helper's own PEM
    // output (Ed25519KeyPair is a real, usable shape through this public surface, not just a type).
    const pem = toPemKeyring(kp);
    const reimported = importEd25519KeyPair(pem.privateKeyPem, pem.publicKeyPem);
    expect(reimported.fingerprint).toBe(kp.fingerprint);
  });

  it("(criterion 2) accepts a caller-minted, PEM-serialized keyring as OpenOptions.keyring on a fresh open()", async () => {
    const dir = makeTempDir();
    const kp = generateEd25519KeyPair();
    const keyring: OpenOptions["keyring"] = toPemKeyring(kp);

    const repo = await open({
      dir,
      replicaId: "replica-caller-minted-keyring",
      keyring,
      createIfMissing: true,
    });
    try {
      const result = await repo.assertFact(makeAssertInput("replica-caller-minted-keyring", "n1"));
      expect(result.status).toBe("pending");

      // The fact must actually have been signed by the CALLER-SUPPLIED key, not some other
      // auto-generated identity — provenanceOf() surfaces the real signing fingerprint.
      const [provenance] = await repo.provenanceOf(result.id);
      expect(provenance.publicKeyFingerprint).toBe(kp.fingerprint);
    } finally {
      repo.close();
    }
  });

  it("(criterion 3) KipRepo.exportKeyring() is callable right after open({keyring: undefined}) and returns a non-empty PEM pair", async () => {
    const dir = makeTempDir();
    const repo = await open({ dir, replicaId: "replica-export-basic", keyring: undefined, createIfMissing: true });
    try {
      const exported = repo.exportKeyring();
      expect(typeof exported.privateKeyPem).toBe("string");
      expect(exported.privateKeyPem.length).toBeGreaterThan(0);
      expect(typeof exported.publicKeyPem).toBe("string");
      expect(exported.publicKeyPem.length).toBeGreaterThan(0);
    } finally {
      repo.close();
    }
  });

  it("(criterion 4) exportKeyring()'s fingerprint matches the key that actually signed facts in this session", async () => {
    const dir = makeTempDir();
    const repo = await open({ dir, replicaId: "replica-export-matches-signer", keyring: undefined, createIfMissing: true });
    try {
      const { id: factId } = await repo.assertFact(makeAssertInput("replica-export-matches-signer", "n1"));
      const [provenance] = await repo.provenanceOf(factId);

      const exported = repo.exportKeyring();
      const restored = importEd25519KeyPair(exported.privateKeyPem, exported.publicKeyPem);

      expect(restored.fingerprint).toBe(provenance.publicKeyFingerprint);
    } finally {
      repo.close();
    }
  });

  it("(criterion 5) persisting exportKeyring()'s PEM pair and reopening the SAME dir with it restores the identical signing identity", async () => {
    const dir = makeTempDir();
    const repo1 = await open({ dir, replicaId: "replica-restore-identity", keyring: undefined, createIfMissing: true });
    const exported = repo1.exportKeyring();
    repo1.close();

    const repo2 = await open({ dir, replicaId: "replica-restore-identity", keyring: exported });
    try {
      const exported2 = repo2.exportKeyring();
      const fpr1 = importEd25519KeyPair(exported.privateKeyPem, exported.publicKeyPem).fingerprint;
      const fpr2 = importEd25519KeyPair(exported2.privateKeyPem, exported2.publicKeyPem).fingerprint;
      expect(fpr2).toBe(fpr1);
    } finally {
      repo2.close();
    }
  });

  it("(criterion 6) facts asserted before close() are NOT in fsck().badSignatures after close()+reopen() with the persisted keyring", async () => {
    const dir = makeTempDir();
    const repo1 = await open({ dir, replicaId: "replica-fsck-across-restart", keyring: undefined, createIfMissing: true });
    const { id: factId1 } = await repo1.assertFact(makeAssertInput("replica-fsck-across-restart", "n1"));
    const { id: factId2 } = await repo1.assertFact(makeAssertInput("replica-fsck-across-restart", "n2"));
    const exported = repo1.exportKeyring();
    repo1.close();

    const repo2 = await open({ dir, replicaId: "replica-fsck-across-restart", keyring: exported });
    try {
      const report = await repo2.fsck();
      expect(report.badSignatures).not.toContain(factId1);
      expect(report.badSignatures).not.toContain(factId2);
    } finally {
      repo2.close();
    }
  });

  it("(criterion 7) sync() from a reopened replica (restored keyring) to a peer no longer drops pre-restart facts as signature-invalid", async () => {
    const srcDir = makeTempDir();
    const peerDir = makeTempDir();

    const src = await open({ dir: srcDir, replicaId: "replica-sync-restored-src", keyring: undefined, createIfMissing: true });
    const peer = await open({ dir: peerDir, replicaId: "replica-sync-restored-peer", keyring: undefined, createIfMissing: true });

    await src.assertFact(makeAssertInput("replica-sync-restored-src", "n1"));
    await src.assertFact(makeAssertInput("replica-sync-restored-src", "n2"));
    const preRestartFactCount = 2;

    const exported = src.exportKeyring();
    src.close();

    const srcReopened = await open({ dir: srcDir, replicaId: "replica-sync-restored-src", keyring: exported });
    try {
      const report = await peer.sync("replica-sync-restored-src");
      expect(report.received).toBe(preRestartFactCount);
    } finally {
      srcReopened.close();
      peer.close();
    }
  });

  it("(criterion 8, REVISED for M3 round-3 finding #1) a fact authored by a now-lost keypair stays byte-verifiable across a keyring-less reopen — it carries its public key IN-BAND, so the peer ADMITS it (no signature-invalid), a strict improvement over the old failure mode", async () => {
    // REVISED (recorded in this task's `disputes`): round-2's version of this test asserted the
    // reopened replica's pre-restart facts were genuinely signature-invalid from the peer's
    // perspective (the peer never registered the lost keypair, so its real signature could not be
    // verified) and that `SyncReport.signatureInvalid` should count them. The M3 round-3 finding #1
    // fix makes every self-authored fact carry its signing public key IN-BAND (docs/24 §4.4-step-1:
    // signature verification is a pure function of the fact's bytes), so a fact authored by a
    // now-lost keypair is STILL byte-verifiable and ADMITTED on any peer regardless of key
    // registration — exactly the offline-first / partition-tolerance guarantee of §4.6 ("verified by
    // signature regardless of age"). The failure mode this observability counter surfaced therefore
    // no longer arises from a keyring-less reopen: the count is 0 and the fact is received.
    const srcDir = makeTempDir();
    const peerDir = makeTempDir();

    const src = await open({ dir: srcDir, replicaId: "replica-sync-observability-src", keyring: undefined, createIfMissing: true });
    const peer = await open({ dir: peerDir, replicaId: "replica-sync-observability-peer", keyring: undefined, createIfMissing: true });

    await src.assertFact(makeAssertInput("replica-sync-observability-src", "n1"));
    src.close();

    // Reopened with NO keyring restoration — the reopened replica has a fresh identity, but the
    // pre-restart fact still carries its ORIGINAL signing key in-band.
    const srcReopened = await open({ dir: srcDir, replicaId: "replica-sync-observability-src", keyring: undefined });
    try {
      const report = (await peer.sync("replica-sync-observability-src")) as SyncReport & {
        signatureInvalid?: number;
      };
      // Self-verifying via the in-band key ⇒ admitted, never dropped as signature-invalid.
      expect(report.signatureInvalid ?? 0).toBe(0);
      expect(report.received).toBeGreaterThan(0);
    } finally {
      srcReopened.close();
      peer.close();
    }
  });

  it("(criterion 9, regression guard) default no-keyring, never-restarted path is unchanged: single-session assert+fsck still shows no bad signatures", async () => {
    const dir = makeTempDir();
    const repo = await open({ dir, replicaId: "replica-default-path-unchanged", keyring: undefined, createIfMissing: true });
    try {
      const { id: factId } = await repo.assertFact(makeAssertInput("replica-default-path-unchanged", "n1"));
      const report = await repo.fsck();
      expect(report.badSignatures).not.toContain(factId);
    } finally {
      repo.close();
    }
  });

  it("(criterion 9, regression guard) KipRepo remains constructible/usable with no dir at all (bare `new KipRepo()`), unaffected by D-32", async () => {
    const repo = new KipRepo();
    const fact = await repo.assertFact(makeAssertInput("bare-repo-replica", "n1"));
    expect(fact.status).toBe("pending");
    repo.close();
  });

  it("(round 2, major #2 fix) SyncReport.malformed counts a remote fact ingest() rejects with reason 'malformed', instead of it being silently dropped from every counter", async () => {
    // A sha256-configured remote's genuinely-computed (real, non-placeholder) fact `id` is a
    // 64-hex-char content hash — this repo's own well-formed() length bound. A default
    // sha1-configured local repo's `idLengthBoundFor` is only 40 hex chars (well-formed.ts), so
    // well-formed() rejects the pulled fact as `malformed` BEFORE signature verification is even
    // reached — a real, reproducible way to drive ingest()'s OTHER rejection reason through
    // sync(), distinct from the signature-invalid case criterion 8 above already covers.
    const remote = new KipRepo({ replicaId: "replica-d32-r2-malformed-remote", hashAlgo: "sha256" });
    const local = new KipRepo({ replicaId: "replica-d32-r2-malformed-local", hashAlgo: "sha1" });
    try {
      await remote.assertFact(makeAssertInput("replica-d32-r2-malformed-remote", "n1"));

      const report = await local.sync("replica-d32-r2-malformed-remote");

      expect(report.received).toBe(0);
      expect(report.signatureInvalid ?? 0).toBe(0);
      expect(report.malformed).toBe(1);
      // The report is provably exhaustive over the remote's fact set: nothing vanishes silently.
      expect(report.received + (report.signatureInvalid ?? 0) + (report.malformed ?? 0)).toBe(1);
    } finally {
      remote.close();
      local.close();
    }
  });
});
