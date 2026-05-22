# graph

The authoritative ontology for the atlas agentic stack. Phase 1 deliverable.

This directory IS the source of truth. All other docs and (eventually) generated code derive from it.

## Reading order

1. [./schema/design-principles.md](./schema/design-principles.md) — why schema-first, what the schema must guarantee, governance
2. [./schema/meta-schema.md](./schema/meta-schema.md) — the schema for the schema: how node kinds, edge kinds, attributes, and evidence are themselves described
3. [./schema/node-kinds/README.md](./schema/node-kinds/README.md) — catalog of every node kind in the ontology
4. [./schema/node-kinds/](./schema/node-kinds/) — one file per node kind cluster, with full attribute spec
5. [./schema/edge-kinds.md](./schema/edge-kinds.md) — catalog of every edge kind (relationships)
6. [./schema/evidence-model.md](./schema/evidence-model.md) — claim + evidence shape, trust levels, freshness
7. [./schema/validation-rules.md](./schema/validation-rules.md) — invariants, required attributes, version-binding rules
8. [./schema/derivation-spec.md](./schema/derivation-spec.md) — how docs and (later) code are projected from the graph
9. [./schema/versioning.md](./schema/versioning.md) — schema versioning, deprecation, migration
10. [coverage-checklist.md](./coverage-checklist.md) — every concept in `wiki/legacy/` mapped to a schema element or out-of-scope

## Repository layout

```
graph/
├── README.md
├── REMODEL-NOTES.md          project-level decision log
├── coverage-checklist.md     coverage of legacy concepts vs schema
├── schema/                   schema DEFINITIONS
│   ├── design-principles.md
│   ├── meta-schema.md
│   ├── node-kinds/           one file per node kind cluster
│   ├── edge-kinds.md
│   ├── evidence-model.md
│   ├── validation-rules.md
│   ├── derivation-spec.md
│   ├── versioning.md
│   ├── ontology-schema.yaml  authoritative — node kinds, edge kinds, types
│   ├── attribute-types.yaml  primitive attribute types
│   └── invariants.yaml       validation rules
├── graph/                    populated graph instances (was schema/examples/)
├── research/                 supporting research artifacts
└── tools/
    └── validator/            Phase-1.5 stub validator
```

The YAML files in `schema/` are loaded by validators and (Phase 3) by generators. Graph instances under `graph/` are validated against `schema/`.

## What lives in this schema

Everything the prose docs in `wiki/legacy/` covered, plus more — because terminology itself is in the graph:

- **Stack layers** — Model, Provider, Transport, Agent-Core, Agent-Runtime, Agent-Platform, Workspace, Execution, Sandbox, Interaction, Presentation
- **Agent products** — concrete products (Claude Code, Codex, …) with their versions, capabilities, profiles
- **Transport protocols** — Model-Transport, MCP-Transport, Agent Host Transport
- **Channels** — MCP-channel, A2A-channel, chat-channel, mailbox-channel
- **Extension shapes** — Native Extension, Portable Extension, Skill, Subagent, Tool Server, Plugin (universal union)
- **Lifecycle** — Run, Invocation, Session, Phase, Hook, Effect (with their state machines)
- **Domain ontology** — Domain, Specialization, Topic, Language, Framework, ExpertiseLevel, StackProfile
- **Role ontology** — Role, Responsibility, OrgUnit
- **Benchmarks** — Benchmark, TestSet, EvalRun, EvalResult
- **Trust** — Authority, Attestation, TrustLevel
- **Catalog meta** — Claim, EvidenceSource, SourceRef, ScopeBoundary
- **Terminology** — Term, Definition, Synonym, Acronym (so the glossary is derivable)
- **Interaction primitives** — slash commands, @-mentions, fork, replay, steering, queueing, etc.

Edges connect them: `has_version`, `supports`, `contains`, `applies_to`, `requires`, `holds_responsibility`, `targets`, `in_scope`, `out_of_scope`, `delegates_to`, `defined_in_context_of`, `synonym_of`, `replaces`, `produces_evidence_for`, etc.

## What is *not* in this schema

Things deliberately left out (recorded in `coverage-checklist.md` under "out of scope"):

- Implementation code paths (those are Phase 4 derivations)
- Operational runbooks
- Project history / changelogs
- Vendor pricing tables (volatile; tracked in evidence sources, not as authoritative claims)

## How to read a node-kind file

Each file under `./schema/node-kinds/` follows the same structure:

```
# <node-kind name>

## Purpose
why this node kind exists

## Attributes
| Attribute | Type | Required? | Notes |
| ... | ... | ... | ... |

## Edges (incoming and outgoing)
| Edge | Direction | Target | Cardinality | Notes |

## Evidence requirements
which attributes need evidence; trust-level minimums; freshness window

## Validation invariants
rules that must hold

## Examples
short, concrete examples in YAML

## Related node kinds
cross-refs
```

## How to read an edge-kind file

A single file (`./schema/edge-kinds.md`) holds them all in a table form because edges are simpler than nodes.
