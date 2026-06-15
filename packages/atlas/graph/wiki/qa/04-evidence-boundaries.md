---
id: page:qa-04-evidence-boundaries
nodeKind: Page
title: "Evidence Boundaries"
slug: "qa/04-evidence-boundaries"
articlePath: "wiki/qa/04-evidence-boundaries.md"
documents: []
---
# Evidence Boundaries

> Phase-5 deliverable. Where graph claims meet the outside world is where staleness, broken links, and silent untruths emerge. This document specifies the boundary, how staleness is detected, and how to refresh.

## What is an "evidence boundary"?

Most edges in the graph are internal: `AgentVersion → bound_to → ModelVersion` is fully under our control — both endpoints are nodes we author. But every `Claim → evidenced_by → EvidenceSource` ultimately points outward: at a vendor doc page, a published package, a captured observation, an external attestation. That outward arrow is the **evidence boundary**.

Properties of the boundary:

- The far side is **not under our control**. URLs rename, packages get yanked, attestations expire.
- The near side **claims a truth on the far side**. If the far side has shifted and the near side has not, the graph is silently lying.
- Detection requires **active probing**, not passive review.

## Boundary detection

The validator catalogs every evidence boundary as a triple `(Claim, EvidenceSource, kindLabel)`:

| `kindLabel` | Boundary | Detection technique |
|---|---|---|
| `web` | URL on the open internet | HTTP HEAD/GET, status code, redirect chain, content-hash comparison against last known. |
| `file` | Path inside a tracked repo | Git blob hash; if the file moved or its hash changed, the evidence is stale. |
| `package` | Published package version | Registry API check; package yanked → boundary failure. |
| `observation` | A captured measurement at a point in time | `observedAt + freshnessWindowDays` test only — there is no live re-probe. |
| `attestation` | A signed claim by an `Authority` | Signature still valid, `expiresAt` not past. |

Each boundary also carries a `freshnessWindowDays` either from the source or from the governing `EvidencePolicy`. The boundary is **fresh** if `(now - observedAt) < freshnessWindowDays` AND, for `web` / `package`, the most recent `reachabilityCheck.status = ok`.

## Staleness detection

Three triggers:

1. **Time-based**: nightly cron walks every `EvidenceSource`. Any source past its window is flagged.
2. **Probe-based**: weekly job re-runs `reachabilityCheck` on every `kindLabel: web` source. Non-`ok` status is flagged immediately.
3. **Hash-based** (web sources only): the latest fetched body's content-hash is compared against the snapshot in `reachabilityCheck.lastChecked`. A changed body means the page has been edited under us; the source enters a "needs human review" state and the depending claim is marked uncertain until reviewed.

Flagged sources auto-open a Level-1 `Gap` via the CI bot, with `affects` pointing at every claim they back.

## Refresh workflow

1. The graph data owner of the affected cluster gets the Gap.
2. They reload the source: re-fetch the URL, re-pin the package version, re-capture the observation, or re-issue the attestation.
3. Update `observedAt` (and `reachabilityCheck.lastChecked`) on the `EvidenceSource`.
4. If the truth has changed, **fix the claim too**: update the `Claim.value` and document the change in the Gap's `propagationChain`.
5. Cascade per [`process/02-cascade-rule.md`](../process/02-cascade-rule.md). A factual change at Level 1 typically forces wiki regeneration (Level 4) and may force SDK type updates (Level 6).
6. Close the Gap.

## Anti-patterns

- **Silent re-fetch**: refreshing `observedAt` without re-reading the source content. The validator detects this when the content-hash stays identical across "refreshes" (suggests the bot is updating timestamps without re-probing).
- **Synthetic-only safety claims**: V-2.4 forbids backing safety-critical attributes (capability binding, install method, sandbox profile) with `synthetic` evidence alone. Detected at validate time.
- **Boundary erasure**: deleting an `EvidenceSource` to make a failing claim pass. The validator (V-2.1) requires every claim to retain ≥1 evidence; deleting all evidence drops the claim itself and the deletion is visible in the graph diff.

## Reporting

The wiki page `/meta/evidence/` is generated from the boundary catalog: which sources are fresh, which are flagged, which are unreviewed-after-content-change, which Gaps are open against them. It is the operational dashboard for the boundary regime.
