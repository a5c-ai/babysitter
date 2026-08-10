/**
 * INV-18 — admission-control / retention resource bound + partial-replication SEC (C4-1, m5-1/m5-2,
 * C5-1).  "The single largest invariant" (docs/60 §9).
 *
 * docs/60-conformance-and-testability.md#inv-18 (verbatim core): "an unregistered key's flood of
 * distinct signature-valid facts is admitted LOGICALLY (INV-13 still holds) but computes
 * `RetentionClass = quarantined-ttl` … a registered key's TRUSTED facts compute `durable` … The suite
 * floods from a fresh unregistered key and asserts: (a) trusted heads are UNCHANGED (the flood
 * projects `quarantined`, affecting no cell); (b) durable bytes are bounded under the default
 * retention policy … the aggregate `quarantined-ttl` pool never exceeds the global `quarantinePoolBytes`
 * budget; (c) per-shared-subset SEC + the C5-1 regression test; (d) `RetentionClass` is computed
 * identically on every replica holding the same set."  docs/50 §8.3b: "the flood NEVER affects
 * `/heads` (those facts project `quarantined`)."
 *
 * OBSERVABLE SUBSET DRIVEN HERE — clause (a) "trusted heads unchanged": reachable via `getNode`
 * (a flood must not become a trusted value head, nor overwrite an authorized cell). Clauses (b)/(d)'s
 * `RetentionClass`/`quarantinePoolBytes`/`keyChainDurableCapBytes` accounting and the (d2) cap-
 * eviction/re-fetch behavior have NO public-surface seam (no `RetentionClass`, no byte-budget query,
 * no eviction hook) — recorded in this suite's `untestable` report. Clause (c)'s chain-gap→`pending`
 * regression is covered by INV-19. Clause (a) is the genuine-failure anchor here.
 *
 * EXPECTED TO FAIL NOW: no value-trust demotion — a flood of admitted facts projects trusted values
 * and (by higher author-HLC) overwrites the authorized cell today. Failures are assertion mismatches,
 * never type/import errors. NOTE the modeled KeyAuthorization carrier (fixtures-m8.ts #2).
 */
import { describe, expect, it } from "vitest";
import type { Fact } from "../../index";
import {
  existenceFact,
  freshFactId,
  governNamespaces,
  hasTrustedValueHead,
  hlc,
  ingestAll,
  keyAuthFact,
  m8Repo,
  propFact,
  valueSegments,
} from "./fixtures-m8";

describe("INV-18: admission-control / retention — the flood never affects trusted /heads", () => {
  it("(a) an unregistered key's flood of distinct signature-valid facts is admitted but projects quarantined — it does NOT overwrite an authorized cell's trusted head", async () => {
    const rootFpr = "genesis-root-inv18";
    const goodFpr = "authorized-key-inv18";
    const floodFpr = "fresh-unregistered-flooder-inv18";
    const repo = m8Repo("inv18-flood"); // pins `genesis-root-inv18`
    const eid = "person/inv18-flood";

    // An authorized, legitimately-trusted value on the target cell.
    await ingestAll(repo, [
      keyAuthFact(
        { keyFpr: goodFpr, namespaces: ["person"], ops: ["write"], authorizedBy: rootFpr, effectiveFrom: hlc(0) },
        { id: freshFactId("inv18-auth"), signerFpr: rootFpr, wall: 100 },
      ),
      existenceFact(eid, "person", { id: freshFactId("inv18-good-ex"), fpr: goodFpr, wall: 1000, replicaId: "chain-inv18-good", seq: 0 }),
      propFact(eid, "status", "authorized-value", { id: freshFactId("inv18-good-status"), fpr: goodFpr, wall: 1001, replicaId: "chain-inv18-good", seq: 1 }),
    ]);
    expect(hasTrustedValueHead(await repo.getNode(eid), "status", "authorized-value")).toBe(true);

    // The flood: N distinct facts from a fresh unregistered key, at HIGHER author-HLC (would win LWW if trusted).
    const flood: Fact[] = [];
    for (let i = 0; i < 25; i += 1) {
      flood.push(propFact(eid, "status", `flood-${i}`, { id: freshFactId(`inv18-flood-${i}`), fpr: floodFpr, wall: 9000 + i, replicaId: "chain-inv18-flood", seq: i }));
    }
    await ingestAll(repo, flood);

    const node = await repo.getNode(eid);
    // The authorized trusted head is UNCHANGED (flood quarantined, affects no cell).
    expect(hasTrustedValueHead(node, "status", "authorized-value")).toBe(true);
    // No flood value is a trusted head.
    const trustedValues = valueSegments(node?.props.status).map((s) => s.value);
    for (let i = 0; i < 25; i += 1) {
      expect(trustedValues).not.toContain(`flood-${i}`);
    }
    repo.close();
  });

  it("(a, N-identity) a flood from N DISTINCT fresh unregistered keys likewise projects quarantined — none of the N keys' values becomes a trusted head (per-key caps do not multiply into a trusted-head ceiling)", async () => {
    const repo = m8Repo("inv18-nkeys");
    const eid = "person/inv18-nkeys";
    // `person` is GOVERNED by a real authority regime, so none of the N fresh unregistered keys is
    // authorized — each is demoted by set-resident authorization state (per-key caps do not multiply).
    await ingestAll(repo, [governNamespaces(freshFactId("inv18-nk-gov"))]);
    const flood: Fact[] = [];
    for (let k = 0; k < 8; k += 1) {
      const kf = `fresh-unregistered-inv18-key-${k}`;
      flood.push(existenceFact(eid, "person", { id: freshFactId(`inv18-nk-ex-${k}`), fpr: kf, wall: 4000 + k, replicaId: `chain-inv18-nk-${k}`, seq: 0 }));
      flood.push(propFact(eid, "v", `k${k}`, { id: freshFactId(`inv18-nk-v-${k}`), fpr: kf, wall: 4001 + k, replicaId: `chain-inv18-nk-${k}`, seq: 1 }));
    }
    await ingestAll(repo, flood);
    const node = await repo.getNode(eid);
    const trustedValues = valueSegments(node?.props.v).map((s) => s.value);
    for (let k = 0; k < 8; k += 1) {
      expect(trustedValues).not.toContain(`k${k}`);
    }
    repo.close();
  });
});
