---
id: page:qa-02-cicd
nodeKind: Page
title: "CI/CD"
slug: "qa/02-cicd"
articlePath: "wiki/qa/02-cicd.md"
documents: []
---
# CI/CD

> Phase-5 deliverable. The concrete pipeline that runs the gates from [`00-qa-architecture.md`](./00-qa-architecture.md) and the release flow from [`01-versioning-and-delivery.md`](./01-versioning-and-delivery.md).

## CI gates (per PR)

Every PR against `main` runs:

| # | Gate | Failure mode |
|---|---|---|
| 1 | **Schema validator** | Any V-rule violation → fail. |
| 2 | **Markdown ↔ YAML parity** (V-12.5) | NodeKind file disagrees with `ontology-schema.yaml` → fail. |
| 3 | **Generator regenerate-and-diff** | Run all 11 generators against the PR's graph; if the resulting tree diff is non-empty *and* not staged in the PR, fail. |
| 4 | **Idempotency** | Run generators twice; second run must produce zero diff. |
| 5 | **Integration tests** | Each generator's fixture-based snapshot test must pass. |
| 6 | **SDK type-check** | Regenerated TypeScript types compile under `tsc --noEmit`. |
| 7 | **Coverage delta** | Coverage (per `03-coverage.md`) must not regress from `main`. |
| 8 | **Schema-bump consistency** | Any change under `schema/` matches the bump declared in the PR (major / minor / patch). Major without `breakingChanges` + `MigrationSpec` → fail. |

Gates 1–6 must pass; gate 7 may be overridden with an explicit `coverage-waiver:<reason>` label and a Gap node tracking the waiver. Gate 8 cannot be overridden.

## CI gates (weekly batch)

Run on a cron, post results as a `Gap`-opening webhook if anything fails:

- **Freshness sweep**: every `EvidenceSource{kindLabel: web}` re-runs `reachabilityCheck`. Anything past its window or unreachable opens a Level-1 Gap.
- **Trust audit**: every safety-critical claim re-checked against trust-level floor. Synthetic-only safety claims open a Level-1 Gap.
- **Wiki regeneration on stale-evidence-only changes**: detects truths that shifted underneath the prose without a code-side trigger.

## CD pipeline

Triggered when a release tag `catalog-vX.Y.Z` lands on `main`:

1. Re-run the full CI gate suite on the tagged commit.
2. Run **adversarial review** automation: a different agent identity replays the PR list since the previous tag and confirms each closed Gap's cascade entries.
3. Build:
   - Schema bundle (zip of `graph/schema/`).
   - Generated wiki (HTML site).
   - OpenAPI artifact.
   - SDK npm package.
   - Per-package READMEs (PR'd back to consumer repos via bot).
4. Publish in the order from `01-versioning-and-delivery.md` §"Release pipeline".
5. Update the `CatalogVersion` node in the graph with `releasedAt` and `supportedUntil`.
6. Post-publish smoke tests against the published artifacts (download SDK from npm, run consumer e2e).

## Promotion environments

| Environment | Purpose | Promotion rule |
|---|---|---|
| `dev` | Generator authors iterate locally | N/A — local only. |
| `pr` | CI ephemeral environment per PR | Gates 1–8 pass. |
| `staging` | Pre-release; consumers can preview | Auto-promoted on merge to `main`. |
| `prod` | Public docs site, public npm package | Promoted on `catalog-vX.Y.Z` tag + adversarial review sign-off. |

`staging` and `prod` are the only environments that publish externally; both are reproducible from a single commit hash plus the schema bundle.

## Hooks into the debt loop

CI failures automatically open `Gap` nodes via a CI bot:

- **Validator failures** → Level 2 Gap, owner = schema owner.
- **Freshness failures** → Level 1 Gap, owner = relevant graph data owner.
- **Generator-diff failures** → Level 4 Gap, owner = generator owner.
- **SDK type-check failures** → Level 6 Gap, owner = QA owner.
- **Reachability failures** → Level 1 Gap, owner = evidence reviewer of the source.

This is what closes the loop: a failing test is not a transient state but a tracked obligation with a cascade target and an owner.
