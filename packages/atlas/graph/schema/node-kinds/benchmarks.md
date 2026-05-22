# NodeKinds: `Benchmark`, `TestSet`, `EvalRun`, `EvalResult`

> Cluster 11 — Benchmarks & evaluation. See [`README.md`](./README.md) for the full catalog.

## Purpose

Cluster 11 makes evaluation a first-class citizen of the catalog. Without it, the graph can
declare that an `AgentVersion` *supports* a `Capability` but cannot say *how well*. With it,
the graph carries the evidence chain from `Benchmark` → `EvalRun` → `EvalResult` →
`Attestation`, so any quantitative claim about agent or model quality has a traceable
provenance.

The four NodeKinds form a small pipeline:

1. **`Benchmark`** — a named test or test-suite, with metrics and a declared `targetsKind`
   that constrains what entities it can score against.
2. **`TestSet`** — a named collection of test cases. Often a *subset* of a benchmark, used to
   pin a frozen evaluation surface.
3. **`EvalRun`** — one execution of a benchmark (optionally a specific test set) against a
   target entity at a specific time.
4. **`EvalResult`** — a single scored metric produced by an `EvalRun`. Each run can produce
   many results (one per metric).

Cross-cluster links: `Benchmark.targets` may point at any of `Skill`, `Plugin`, `Domain`,
`Specialization`, `StackProfile`, `AgentVersion`, `ModelVersion`, `Layer`, `Capability`,
`ExtensionInterface`. `EvalRun` may carry an `attestationId` to bind the run to a signed
`Attestation` (Cluster 12), giving evaluation results trust-chain integration matching the
rest of the catalog.

This cluster is *the* surface that lets the schema answer:

- "What is the SWE-bench-Verified score for `agent-version:claude-code@1.x`?"
- "Which benchmarks target `language:python` code generation, and what's the latest
  HumanEval result for our default `ModelVersion`?"
- "For `domain:security`, which benchmarks exist and which agents have been evaluated
  against them?"

---

## `Benchmark`

A named test or test-suite.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `benchmark:<slug>`. |
| `displayName` | string | yes | Canonical name (e.g., `"SWE-bench Verified"`). |
| `homepageUrl` | url | yes, evidence: vendor-doc-or-better | Canonical homepage for the benchmark. Required and evidence-bound. |
| `description` | markdown | yes | One-paragraph description: what the benchmark measures, who maintains it, and the canonical citation. |
| `version` | string | yes | The benchmark's own version identifier (e.g., `"verified-2024-12"`, `"v1.1"`, `"2025-01"`). Free-form because benchmark vendors do not share a versioning scheme. |
| `kind` | enum<full-stack,model-only,agent-platform,skill,extension-interface,layer-specific,domain-specific,sub-stack-component> | yes | What kind of subject the benchmark addresses. Editorial classification. |
| `targetsKind` | string (a NodeKind name) | yes | The NodeKind name this benchmark scores entities of (e.g., `"AgentVersion"`, `"ModelVersion"`, `"StackProfile"`). MUST match an existing NodeKind. |
| `metrics` | list<map<name:string, description:string, unit:string>> | yes | The metrics this benchmark publishes, each with a unit (e.g., `pct`, `tokens`, `seconds`, `pass-rate`). |
| `scopeBoundary` | ref<ScopeBoundary> | optional | When the benchmark explicitly excludes parts of a larger surface. |
| `domainsTested` | list<ref<Domain> \| ref<Specialization> \| ref<Topic>> | optional | The Cluster 9 nodes this benchmark exercises. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `targets` | various (see Cluster 11 row in `../../schema/edge-kinds.md`) | N:N | The catalog NodeKinds this benchmark may score. |
| `targeted_by` (inverse) | from any of the above | N:N | Inverse of `targets`. |
| `covers` | `SkillArea` | N:N | A Benchmark exercises a SkillArea (catalog pass 16). Carries `coverage: enum<full,partial,tangential>` and optional `weight: float` (0..1). Inverse `covered_by_benchmark`. Lets the catalog answer "which SkillAreas does benchmark X probe, and how strongly?". |

### Evidence

`homepageUrl` is **required** and evidence-bound at `vendor-doc-or-better`. Benchmarks are
public artifacts; an unreachable or unattributable benchmark is not a valid catalog entry.

### Invariants

1. `targetsKind` MUST match the canonical name of an existing NodeKind in the schema.
2. `metrics` is non-empty; each entry has `name`, `description`, and `unit`.
3. `id` MUST follow the form `benchmark:<kebab-slug>`.
4. `homepageUrl` MUST resolve at the `EvidenceSource.reachabilityCheck.lastChecked`
   timestamp; a stale homepage flags the benchmark for review.

### Canonical roster

The Phase-2 population enumerates these benchmarks (this list is illustrative, not closed):

| id | displayName | targetsKind | kind | domain |
|---|---|---|---|---|
| `benchmark:swe-bench` | SWE-bench | `AgentVersion` | agent-platform | software engineering |
| `benchmark:swe-bench-verified` | SWE-bench Verified | `AgentVersion` | agent-platform | software engineering (refined) |
| `benchmark:human-eval` | HumanEval | `ModelVersion` | model-only | code generation |
| `benchmark:mmlu` | MMLU | `ModelVersion` | model-only | knowledge |
| `benchmark:gaia` | GAIA | `AgentVersion` | full-stack | multi-step agentic tasks |
| `benchmark:mle-bench` | MLE-bench | `AgentVersion` | full-stack | ML engineering |
| `benchmark:webarena` | WebArena | `AgentVersion` | agent-platform | web navigation |
| `benchmark:terminal-bench` | Terminal-Bench | `AgentVersion` | agent-platform | terminal/shell |
| `benchmark:tau-bench` | τ-bench | `AgentVersion` | agent-platform | tool-use |
| `benchmark:agentbench` | AgentBench | `AgentVersion` | agent-platform | general agent eval |
| `benchmark:mbpp` | MBPP | `ModelVersion` | model-only | Python programming |

Canonical homepages (each requires an `EvidenceSource` at `vendor-doc-or-better`):

- SWE-bench — https://www.swebench.com/
- SWE-bench Verified — https://www.swebench.com/ (Verified subset, see site)
- HumanEval — https://github.com/openai/human-eval
- MMLU — https://github.com/hendrycks/test
- GAIA — https://huggingface.co/gaia-benchmark
- MLE-bench — https://github.com/openai/mle-bench
- WebArena — https://webarena.dev/
- Terminal-Bench — https://www.tbench.ai/
- τ-bench — https://github.com/sierra-research/tau-bench
- AgentBench — https://llmbench.ai/agent
- MBPP — https://github.com/google-research/google-research/tree/master/mbpp

---

## `TestSet`

A named collection of test cases, usually a frozen slice of a benchmark.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `test-set:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `benchmarkId` | ref<Benchmark> | optional | When the test set is a subset of a benchmark, the parent benchmark. Absent for ad-hoc internal test sets. |
| `caseCount` | int | yes | Number of test cases (frozen at the time of declaration). |
| `composition` | markdown | yes | Description of how the cases were chosen (random sample, stratified by domain, vendor-curated, etc.). |
| `homepageUrl` | url | optional, evidence: vendor-doc-or-better | When the test set has a public canonical home, the URL; evidence-bound when set. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `tests_in_scope` | any catalog entity | N:N | Declares the entities the test set is in-scope for. |
| `subset_of` | `Benchmark` | N:1 | Mirrors `benchmarkId`. |

### Evidence

`homepageUrl` is evidence-bound when set. `caseCount` and `composition` are editorial unless
the policy explicitly upgrades them.

### Invariants

1. `caseCount` ≥ 1.
2. If `benchmarkId` is set, the referenced `Benchmark` MUST exist.
3. `id` MUST follow the form `test-set:<kebab-slug>`.

---

## `EvalRun`

One execution of a benchmark (optionally constrained to a test set) against a target entity.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `eval-run:<benchmark-slug>.<target-slug>.<date>`. |
| `benchmarkId` | ref<Benchmark> | yes | The benchmark executed. |
| `testSetId` | ref<TestSet> | optional | Set when the run was bound to a specific test set. |
| `targetId` | ref<Skill \| Plugin \| Domain \| Specialization \| StackProfile \| AgentVersion \| ModelVersion \| Layer \| Capability \| ExtensionInterface> | yes | The entity being evaluated. |
| `runAt` | iso-timestamp | yes | When the run completed. |
| `runBy` | ref<Authority> \| string | yes | The party that performed the run. Either an `Authority` ref (when the runner is in the trust graph) or a free-form string (e.g., `"OpenAI public release post"`) for third-party-reported runs. |
| `notes` | markdown | optional | Free-form commentary (configuration, scaffolding, harness version, deviations from canonical run). |
| `attestationId` | ref<Attestation> | optional | When the run is signed by an `Authority`, the attestation; provides trust-chain integration. |
| `evalKind` | enum<capability,safety,robustness,alignment,regression> | yes | **catalog pass 19 addition** (new attribute, not enum-extension — verified absent from prior atlas EvalRun schema). Discriminates the eval surface: capability/safety/robustness/alignment/regression. The `safety` value subsumes the former `SafetyEvalRun` proposal (catalog pass 19 reviewer fold). |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `evaluated_by` | `Benchmark` | N:1 | Mirrors `benchmarkId`. Edge attribute `runAt` records the timestamp. |
| `against_target` | various (see `Benchmark.targets` allow-list) | N:1 | The entity the run scored. |
| `produced_result` | `EvalResult` | 1:N | The metric records produced by the run. |

### Evidence

`runAt` and `notes` are editorial. The `attestationId`, when set, ties the run to a signed
`Attestation`, which itself carries evidence per Cluster 12 rules.

### Invariants

1. `benchmarkId` MUST refer to an existing `Benchmark`.
2. `targetId`'s NodeKind MUST be in the `Benchmark.targets` allow-list of the referenced
   benchmark, AND match the benchmark's `targetsKind`.
3. `runAt` MUST NOT be in the future relative to the catalog snapshot's reference clock.
4. `id` MUST follow the form `eval-run:<benchmark-slug>.<target-slug>.<iso-date>` (or with a
   tiebreaker suffix when multiple runs share a date).

---

## `EvalResult`

A single scored metric produced by an `EvalRun`.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `eval-result:<eval-run-slug>.<metric-name>`. |
| `evalRunId` | ref<EvalRun> | yes | The run that produced this result. |
| `metricName` | string | yes | One of the metric names declared on the parent benchmark. |
| `score` | float | yes | The numeric value. |
| `unit` | string | optional | Mirrored from the benchmark's metric declaration when ambiguous (e.g., `"pct"`, `"tokens"`). |
| `passFail` | enum<pass,fail,partial> | optional | Coarse classification when the metric carries one. |
| `details` | markdown | optional | Per-result commentary (e.g., per-task pass-rate breakdown). |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `produced_by` | `EvalRun` | N:1 | Inverse of `EvalRun.produced_result`. Mirrors `evalRunId`. |
| `scored_against` | `Benchmark` | N:1 | The benchmark whose metric is being recorded. Edge attributes carry `score` and `unit` for at-a-glance queries. |

### Evidence

When the result is reported by a third party, the `EvidenceSource` for the result attaches
via the parent `EvalRun`'s `attestationId` (or via direct `Claim` against the `score`
attribute).

### Invariants

1. `evalRunId` MUST refer to an existing `EvalRun`.
2. `metricName` MUST appear in `EvalRun.benchmarkId.metrics[*].name`.
3. `score` is finite (no `NaN` / `Infinity`).
4. `id` MUST follow the form `eval-result:<eval-run-slug>.<metric-name>`.

---

---

## `EvalHarness`

A reusable evaluation framework / scaffolding (Inspect AI, OpenAI Evals,
EleutherAI lm-evaluation-harness, promptfoo). Distinct from `Benchmark` (a *test*) —
a harness is the *runner* that executes one or more benchmarks against one or more targets.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `eval-harness:<slug>`. |
| `displayName` | string | yes | Canonical name. |
| `homepageUrl` | url | yes, evidence: vendor-doc-or-better | Canonical homepage. |
| `vendor` | string | yes | Maintaining org or person (e.g., `"UK AI Safety Institute"`, `"EleutherAI"`). |
| `language` | string | yes | Primary implementation language (e.g., `python`, `typescript`). |
| `description` | markdown | yes | One-paragraph description. |

### Edges

No outgoing edges by default. Inverse: `Judge.judges_for`.

### Evidence

`homepageUrl` is required and evidence-bound at `vendor-doc-or-better`.

### Invariants

1. `id` MUST follow the form `eval-harness:<kebab-slug>`.

---

## `Judge`

A scoring agent / scorer used by an `EvalHarness`. Typically an LLM-as-judge configuration
(model + prompt style) or a deterministic checker.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `judge:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `judgeKind` | enum<llm-as-judge,deterministic,human-panel,hybrid> | yes | Discriminator. |
| `modelRef` | string | optional | Provider-qualified model id (when `judgeKind = llm-as-judge`). |
| `promptStyle` | enum<pairwise,rubric-scored,rationale-only,classification,scalar-1-5,scalar-0-3> | optional | Judging prompt style (when `judgeKind = llm-as-judge`). |
| `description` | markdown | yes | One-paragraph description. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `judges_for` | `EvalHarness` | N:N | The harness(es) that invoke this judge. |
| `uses_model` | `Provider` \| `ModelVersion` | N:1 | The provider / model the judge is bound to (when `judgeKind = llm-as-judge`). |

### Evidence

No evidence-bound attributes by default.

### Invariants

1. When `judgeKind = llm-as-judge`, `modelRef` SHOULD be set.
2. `id` MUST follow the form `judge:<kebab-slug>`.

---

## `Rubric`

A scoring rubric attached to one or more `Judge`s. Defines the scale and dimensions
against which a `Judge` produces an `EvalResult`.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `rubric:<slug>`. |
| `displayName` | string | yes | Human-readable label. |
| `scale` | string | yes | Scale label (e.g., `"1-5"`, `"0-3"`, `"pairwise"`). |
| `dimensions` | list<string> | yes | Named dimensions scored (e.g., `[helpfulness]`, `[harm,bias,refusal-appropriateness]`). |
| `description` | markdown | yes | One-paragraph description. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `scored_by` | `Judge` | N:N | The judge(s) that apply this rubric. |

### Evidence

No evidence-bound attributes by default.

### Invariants

1. `dimensions` is non-empty.
2. `id` MUST follow the form `rubric:<kebab-slug>`.

---

## Examples

```yaml
- id: benchmark:swe-bench-verified
  displayName: "SWE-bench Verified"
  homepageUrl: https://www.swebench.com/
  description: |
    A human-curated, refined subset of SWE-bench focused on issues with
    reliably correct ground-truth fixes. Targets full-stack agent platforms
    (loop + tools + sandbox) on real GitHub-issue resolution in Python repos.
  version: "verified-2024-12"
  kind: agent-platform
  targetsKind: AgentVersion
  metrics:
    - name: resolved
      description: "Fraction of tasks where the agent's patch passes the hidden test suite."
      unit: pct
    - name: applied
      description: "Fraction of tasks where the agent produced a syntactically applicable patch."
      unit: pct
  domainsTested:
    - specialization:backend-python-django
    - topic:bug-fixing
    - topic:test-driven-development
  evidence:
    - attribute: homepageUrl
      claim: claim:swe-bench-homepage
      source: evidence:swe-bench-homepage-2026-01
      trustLevel: trust:vendor-doc
```

```yaml
- id: benchmark:human-eval
  displayName: "HumanEval"
  homepageUrl: https://github.com/openai/human-eval
  description: |
    OpenAI's Python code-generation benchmark: 164 hand-written programming
    problems with unit tests. Targets ModelVersions directly (no agent
    scaffolding); the canonical metric is pass@k.
  version: "v1.0"
  kind: model-only
  targetsKind: ModelVersion
  metrics:
    - name: pass@1
      description: "Fraction of problems solved on the first sample."
      unit: pct
    - name: pass@10
      description: "Fraction of problems solved within 10 samples."
      unit: pct
  domainsTested:
    - language:python
    - topic:code-generation
```

```yaml
- id: test-set:swe-bench-verified-2024-12
  displayName: "SWE-bench Verified — 2024-12 freeze"
  benchmarkId: benchmark:swe-bench-verified
  caseCount: 500
  composition: |
    Frozen at the December 2024 release. Stratified across the 12 source
    repositories with no per-repo cap; mirrors the upstream verified set.
  homepageUrl: https://www.swebench.com/
```

```yaml
- id: eval-run:swe-bench-verified.claude-code-1.x.2025-04-29
  benchmarkId: benchmark:swe-bench-verified
  testSetId: test-set:swe-bench-verified-2024-12
  targetId: agent-version:claude-code@1.x
  runAt: "2025-04-29T18:00:00Z"
  runBy: authority:a5c-ai-catalog
  notes: |
    Default Claude Code launch config, no custom subagents, sandbox=docker,
    five-shot retries on transient infra failures.
  attestationId: attestation:swe-bench-verified-claude-code-1x-2025-04-29
```

```yaml
- id: eval-result:swe-bench-verified.claude-code-1.x.2025-04-29.resolved
  evalRunId: eval-run:swe-bench-verified.claude-code-1.x.2025-04-29
  metricName: resolved
  score: 0.612
  unit: pct
  passFail: pass
  details: |
    Per-repo breakdown attached in the run notes; lowest per-repo score
    was django at 0.48, highest was sympy at 0.71.
```

```yaml
- id: eval-run:human-eval.claude-opus-4-7.2026-04-15
  benchmarkId: benchmark:human-eval
  targetId: model-version:claude-opus-4-7
  runAt: "2026-04-15T12:00:00Z"
  runBy: "Anthropic public release post"
  notes: |
    Reported in the Opus 4.7 launch blog. No internal re-run yet; this entry
    is sourced from a vendor-doc trust-level evidence and will be re-run
    internally before the next catalog release.
```

## Related

- [`README.md`](./README.md) — the full node-kind catalog and cluster index.
- [`domain-ontology.md`](./domain-ontology.md) — `Benchmark.domainsTested` and
  `Benchmark.targets` may reference Cluster 9 nodes.
- [`role-ontology.md`](./role-ontology.md) — agentic `Role`s often carry implied benchmark
  expectations; the cross-link is via the `Subagent` / `AgentVersion` they reference.
- [`../../schema/edge-kinds.md`](../../schema/edge-kinds.md) — `targets`, `tests_in_scope`, `evaluated_by`,
  `produced_result`, `scored_against` edge specifications.
- [`../../schema/evidence-model.md`](../../schema/evidence-model.md) — `Benchmark.homepageUrl` and
  `TestSet.homepageUrl` policies; `EvalRun.attestationId` ties results into the
  trust/evidence chain.
- `Attestation` (Cluster 12) — signs `EvalRun`s when the run carries an authority signature.

