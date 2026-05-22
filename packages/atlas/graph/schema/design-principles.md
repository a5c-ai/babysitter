# 00 — Design Principles

What the schema must guarantee, and how we govern it.

## Why schema-first

Prose docs drift. Two prose docs about the same concept end up disagreeing within a few iterations. Generators that consume prose hallucinate. The agent-catalog already exists in the codebase (`packages/agent-catalog/`) precisely because we need *one* authoritative description; atlas doubles down: the catalog *is* the spec, and prose is a derived view.

Implications:

- **Single source of truth.** Names, definitions, attributes, relationships, and evidence all live in the graph. There is exactly one place to change a fact.
- **Derivation, not duplication.** Docs, type definitions, capability matrices, install instructions, and (Phase 4) code scaffolds are generated from the graph — never re-authored.
- **Evidence-bound claims.** A claim without evidence is not a claim. It's a TBD on the open-questions list with a name and an owner.
- **Explicit boundaries.** Every entity declares what it is *and* what it isn't (in-scope / out-of-scope). Boundaries are first-class.

## The five guarantees

1. **Total coverage** — every concept the atlas stack needs to express has a node kind, an edge kind, or an attribute. Concepts that *don't* fit go on the out-of-scope list with a reason.
2. **Internal consistency** — claims do not contradict each other. Validators enforce this in CI.
3. **Versioned semantics** — capability claims are bound to version ranges; breaking schema changes get major-bumped with a migration spec.
4. **Evidence-backed** — every claim of fact has an `EvidenceSource` reachable in the freshness window declared by the evidence policy.
5. **Generative** — the schema is rich enough to derive the existing prose docs, and (Phase 4) enough to scaffold implementation.

## Governance

### Adding a node kind

A new node kind requires:

- A reason (why an existing node kind doesn't fit)
- A full attribute spec, including which are required and which evidence-bound
- At least one edge into and out of it (a node kind that's an island is a smell)
- An example populated entry in `graph/`

### Renaming or removing

Schema renames go through `../schema/versioning.md` migration. The schema carries its own deprecation chain — old names appear with `replaced_by` edges until removed.

### Resolving disagreement between vendors

Where vendors use the same word for different concepts, the schema records the divergence as separate node kinds with synonyms tying them. We do not pick a winner.

### Adding evidence types

Trust levels (`official-web`, `vendor-doc`, `community`, `synthetic`) are themselves a schema entry. Adding a new level requires a definition + freshness window + use cases.

## Naming conventions

- **Node kinds** — PascalCase singular (`AgentVersion`, `Skill`, `Term`).
- **Edge kinds** — snake_case verb phrase (`has_version`, `applies_to`, `replaces`).
- **Attributes** — camelCase (`displayName`, `versionRange`, `inScope`).
- **Enum values** — kebab-case (`vendor-doc`, `chat-channel`, `mcp-stdio`).
- **IDs** — `<kind-prefix>:<slug>` (e.g., `agent:claude-code`, `term:invocation`, `lang:typescript`).

## What the schema does *not* try to do

- It does not attempt to be a runtime database. It is a *design* artifact compiled into derived artifacts.
- It does not record operational state (running runs, live sessions, in-flight invocations). Those are runtime concerns.
- It does not record opinions. Where there is disagreement between vendors or between past and present design, the disagreement is recorded as data, not decided.

## Authoring rules

- Every node-kind file has the same structure (purpose, attributes, edges, evidence, invariants, examples, related).
- Every example must validate against the YAML schema.
- Every prose definition is short; rationale lives in this design-principles doc, not in node-kind files.
- Cross-references use schema IDs (`[AgentVersion](./schema/node-kinds/agent-stack.md#agentversion)`), never raw names.

## Phase 1 acceptance criteria

Phase 1 is done when:

1. Every node kind in `../schema/node-kinds/` has a complete attribute spec, edges spec, evidence requirements, and at least one example.
2. `../schema/edge-kinds.md` enumerates every edge kind with source/target node-kind constraints and cardinality.
3. `../schema/evidence-model.md` defines `Claim` and `EvidenceSource` with their required attributes.
4. `../schema/validation-rules.md` lists every invariant the validators check.
5. `coverage-checklist.md` cross-references every concept in `wiki/legacy/universal/` and `wiki/legacy/a5c/` to a schema element OR an out-of-scope item with a reason.
6. `schema/ontology-schema.yaml` is the machine-readable version of (1) and (2).
7. `graph/` contains populated entries for at least one product, one skill, one MCP server, one benchmark, one role, one term — covering enough of the schema to validate workability.
8. The validator runs against the examples without errors.

After acceptance, Phase 2 (full population) can begin.
