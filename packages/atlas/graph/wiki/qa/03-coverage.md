---
id: page:qa-03-coverage
nodeKind: Page
title: "Coverage"
slug: "qa/03-coverage"
articlePath: "wiki/qa/03-coverage.md"
documents: []
---
# Coverage

> Phase-5 deliverable. Five distinct coverage measures. Each must be reportable as a percentage and tracked across releases. A regression in any of them fails CI gate 7 unless explicitly waived.

## NodeKind coverage

> "What fraction of the schema's NodeKinds have real-world entities populated in the graph?"

```
NodeKindCoverage = |{ kinds with ≥1 non-fixture node }| / |all NodeKinds|
```

Fixture-only kinds count as 0. Excluded by waiver: kinds explicitly marked `populationDeferred` in the coverage checklist.

## Edge coverage

> "What fraction of declared EdgeKinds are exercised by at least one edge in the graph?"

```
EdgeCoverage = |{ edge kinds with ≥1 instance }| / |all EdgeKinds|
```

Edges in `ontology-schema.yaml` that have zero instances are flagged for either population or removal.

## Capability coverage

> "What fraction of named `Capability` nodes have at least one `CapabilitySupport` binding?"

```
CapabilityCoverage = |{ capabilities with ≥1 CapabilitySupport edge }| / |all Capability nodes|
```

A capability with no support binding is dead text. The threshold for new capabilities is 1 binding within 30 days of creation; missing the threshold opens a Gap.

## Evidence freshness coverage

> "What fraction of fact-bearing claims have evidence within the freshness window?"

```
FreshnessCoverage = |{ claims with all evidenceSources in-window }| / |all claims|
```

Claims with stale evidence count as not-fresh until refreshed. Long-lived stable facts (e.g. "Claude Code is published as `@anthropic-ai/claude-code`") get a longer `freshnessWindowDays` from their policy; volatile facts (pricing, model lineup) get shorter windows.

## Generator coverage

> "What fraction of declared `Generator` nodes have an integration test and a passing run on the current graph?"

```
GeneratorCoverage = |{ generators with passing integration test ∧ green run on current graph }| / |all Generator nodes|
```

A generator without a test is a future regression. A generator that fails on the current graph is a current regression. Both reduce coverage.

## Composite

A single weighted score is reported on the home page of the wiki's `/meta/coverage/`:

```
Composite = 0.20·NodeKind + 0.20·Edge + 0.20·Capability + 0.25·Freshness + 0.15·Generator
```

The weights are chosen so that **freshness** dominates — drift between the world and the graph is the single most expensive failure mode. Composite is informational; the per-axis percentages are the real gates.
