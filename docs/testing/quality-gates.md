---
title: Quality Gates
description: Acceptance criteria and adversarial review checklist for testing strategy implementation.
last_updated: 2026-05-07
---

# Quality Gates

These gates define what must be true before a new test lane, workflow, or model-backed scenario is treated as release evidence.

## Gate Matrix

| Gate | Applies to | Required checks | Failure action |
| --- | --- | --- | --- |
| Determinism | No-model tests | No provider secrets, fixed fixtures, repeatable locally, stable timeout budget | Block PR until deterministic |
| Credential guard | Model-backed tests | Explicit secret detection before setup, clear skip reason, no fallback to fake success | Block staging/release if selected job cannot prove setup |
| Artifact redaction | All E2E tests | Secret scan over logs/artifacts, redacted paths, no raw token files | Fail job and suppress unsafe upload |
| Protocol compatibility | Mux tests | Mock and live event streams satisfy the same schema/version | Open compatibility issue before promotion |
| Transport-mux seam evidence | Transport-mux tests | Route matrix, runtime env injection, proxy auth, launch proxy decision, stream transcript, metrics/cache artifact, and invalid-combination boundaries are explicit | Block transport-mux coverage promotion until the missing seam has a direct artifact |
| Runtime completeness | Babysitter-agent E2E | Run creation, session binding, effect emission, task post, terminal state | Block runtime release gate |
| Cost and flake budget | Model-backed tests | Retry policy, duration budget, provider rate-limit classification | Keep scheduled/manual until stable |
| Documentation parity | All lanes | Docs name command, owner, trigger, artifacts, skip/failure semantics | Block workflow merge |

## Adversarial Review Checklist

Every implementation phase should answer these questions before it is accepted:

- What would make this pass without testing the promised behavior?
- Which secret or credential path could leak into logs?
- Which mock assumption could diverge from live Codex or Claude Code behavior?
- Which package boundary is only tested indirectly?
- Did transport-mux traffic actually use proxy routes and injected env, or did the harness call the provider directly?
- Is this test accidentally proving plugin install, harness install, hooks, or Babysitter journal behavior with transport-mux evidence only?
- Which failure would be misclassified as provider flake instead of product regression?
- Which CI trigger would run too often, too late, or not at all?
- Which artifact proves the claim to a reviewer who did not watch the run?

## Promotion Criteria

A test can move from manual to scheduled when it has three consecutive successful runs or one documented provider-side skip with no product failures.

A test can move from scheduled to staging preflight when:

- it has stable credential gating,
- it emits redacted artifacts,
- transport-mux bridge tests include launch-plan JSON, redacted proxy config/env diff, route or stream transcript, metrics/cache snapshot, and provider/harness version metadata when they claim proxy coverage,
- it adds unique evidence not already covered by no-model tests,
- it has an owner for failures,
- it has a bounded runtime and retry policy.

A test can move from staging preflight to release preflight only when it protects a production publish risk that cannot be caught earlier.

## Quarantine And Demotion

Model-backed tests are allowed to start outside required branch protection. They must be demoted or quarantined when reliability falls below release-gate quality.

| Condition | Action |
| --- | --- |
| Two provider-infra failures in seven days | Keep scheduled, remove from required staging checks until root cause is classified |
| One product regression in staging preflight | Keep required and block publish until fixed or explicitly waived |
| Secret redaction failure | Disable artifact upload for that lane and block promotion until redaction test exists |
| Runtime exceeds hard timeout twice | Move to manual diagnostics until scope or timeout budget is redesigned |
| Mock/live schema drift | Block promotion and open a compatibility issue naming the event family |

A quarantined test can return to required status after three consecutive clean scheduled runs and one clean manual rerun by the owning maintainer.
