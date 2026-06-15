---
id: page:qa
nodeKind: Page
title: "Quality, Verification, and Delivery"
slug: "qa"
articlePath: "wiki/qa/README.md"
documents: []
---
# Quality, Verification, and Delivery

Tests, evidence-boundary checks, versioning, CI/CD, and downstream artifact distribution. The phase that **enforces** every guarantee the earlier phases promise.

## Files in this directory

| Path | Purpose |
|---|---|
| [`00-qa-architecture.md`](./00-qa-architecture.md) | Test pyramid, evidence-boundary checks, regression detection. |
| [`01-versioning-and-delivery.md`](./01-versioning-and-delivery.md) | Schema semver, downstream artifact tagging, release pipeline, consumer pinning. |
| [`02-cicd.md`](./02-cicd.md) | CI gates, CD pipeline, promotion environments. |
| [`03-coverage.md`](./03-coverage.md) | Coverage definitions across the catalog. |
| [`04-evidence-boundaries.md`](./04-evidence-boundaries.md) | Where graph claims meet external truth; staleness detection; refresh. |
| `tests/` | Test fixtures, integration harnesses, e2e scripts. |

## Acceptance

- Every NodeKind has at least one test.
- Every generator has an integration test against a known graph fixture.
- E2E tests cover key user flows (schema change → regenerated docs → SDK consumer compiles).
- CI gates schema/graph PRs on validator + invariant + freshness checks.
