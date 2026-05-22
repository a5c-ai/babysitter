# NodeKinds: Capabilities

> Cluster 8 — Capability descriptors, plus the cross-cluster `InstallMethod` used by
> `installs` edges. See [`README.md`](./README.md) for the full catalog and
> [`../../schema/meta-schema.md`](../../schema/meta-schema.md) for the standard node-kind file shape.

> **Remodel 2026-04-29:** the former `Modality` NodeKind was collapsed into a
> `list<enum<text,image,audio,video,embedding,tool-output>>` attribute on
> `ModelVersion`. The `has_modality` / `modality_of` edges and the standalone
> `modality:*` example files were removed.
>
> **Remodel 2026-04-29 (catalog pass 9c):** the former `CapabilitySupport` NodeKind
> was collapsed into a direct `supports` edge that carries `versionRange`,
> `level`, `notes`, and `evidenceSourceIds` as edge attributes. All 415 prior
> CapabilitySupport bindings (across 250 example files) were inlined onto
> their source entity's example file. The `references_capability` and
> `references_entity` edges (which were CapabilitySupport-internal) were
> deleted. The new edge sources include any version-bearing entity that can
> claim a capability — see `edge:supports` in `schema/ontology-schema.yaml`.

## Purpose

This file specifies the node kinds that turn capability claims, modality declarations,
and install methods into first-class graph entities:

- **`Capability`** — a named, single-concept capability that other entities can claim
  to support (or require). Capability claims are persisted as **direct `supports` edges**
  whose attributes (`versionRange`, `level`, `notes`, `evidenceSourceIds`) carry the
  former `CapabilitySupport` payload (see catalog pass 9c remodel above).
- **`InstallMethod`** — the canonical install methods (npm, brew, gh-extension, …)
  referenced by `AgentVersion.installMethods`, `Plugin.installFormats`, and the
  `installs` edge.

Together these node kinds anchor every capability and install claim to evidence and
keep them queryable across clusters.

---

## NodeKind: `Capability`

A named capability that an entity can support, partially support, or require.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `capability:<slug>`, e.g. `capability:supports-thinking`. |
| `displayName` | string | yes | Human-readable. |
| `description` | markdown | yes | One-paragraph description of what the capability is and what its absence means. |
| `appliesToNodeKinds` | list<string> | yes | NodeKind names the capability is meaningful on (e.g., `["AgentVersion","ModelVersion"]`). |
| `category` | enum<model,agent,runtime,platform,tool,session,hook,extension,reasoning,provider-feature> | yes | Coarse category for grouping. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `supported_by` | `AgentVersion` | N:N | Inverse of `supports`. |
| `required_by` | `Skill` \| `Plugin` \| `Subagent` \| `ToolServer` \| `ToolDescriptor` \| `InteractionPrimitive` \| `LaunchConfig` \| `CapabilityProfile` \| `SessionModel` | N:N | Inverse of `requires_capability`. Carries `level` (`required` / `recommended`). |
| `referenced_by` | `Term` | N:N | Inverse of `references`. |

### Canonical capabilities (excerpt)

The catalog ships the following capabilities at minimum (drawn from the legacy
capability-flag list and extended for atlas):

- **streaming** — `capability:streaming`, `capability:supports-text-streaming`,
  `capability:supports-tool-call-streaming`, `capability:supports-thinking-streaming`.
- **MCP** — `capability:supports-mcp`, `capability:mcp-stdio`,
  `capability:mcp-streamable-http`, `capability:mcp-sse`.
- **tool calls** — `capability:parallel-tool-calls`, `capability:supports-native-tools`,
  `capability:requires-tool-approval`, `capability:supports-tool-call-streaming`.
- **thinking** — `capability:supports-thinking`,
  `capability:supports-thinking-budget-tokens`,
  `capability:supports-thinking-effort-levels`.
- **session** — `capability:can-resume`, `capability:can-fork`,
  `capability:can-multi-turn`, `capability:turn-boundary-queue`,
  `capability:in-flight-context-injection`.
- **plugins** — `capability:supports-plugins`, `capability:supports-marketplace`,
  `capability:project-bootstrap`.
- **hooks** — `capability:supports-pre-tool-use-hook`,
  `capability:supports-post-tool-use-hook`, `capability:supports-stop-hook`.

The full list lives in `schema/ontology-schema.yaml`; this file is the spec for the
NodeKind, not the population.

### Evidence

`Capability` itself is descriptive (no evidence-bound attributes). Every *claim* of
support, however, is evidence-bound — the `supports` edge carries
`evidenceSourceIds` for the simple direct path; mint a `Claim` only when the
fact is disputed, time-banded, or has multiple competing sources (see
[../../schema/evidence-model.md](../../schema/evidence-model.md)).

### Invariants

1. `appliesToNodeKinds` MUST be non-empty and reference real NodeKind names.
2. `category` MUST be one of the declared enum values.
3. A `Capability` MUST be reachable from at least one entity through `supported_by`
   or `required_by` once the catalog is populated.

---

## Edge: `supports` (replaces former `CapabilitySupport` NodeKind)

> catalog pass 9c remodel (2026-04-29): capability bindings live on a direct `supports`
> edge. The former `CapabilitySupport` NodeKind, with its `references_capability`
> and `references_entity` edges, was deleted.

A `supports` edge binds an entity (`AgentVersion`, `ModelVersion`,
`AgentRuntimeImpl`, `AgentPlatformImpl`, `AgentCoreImpl`, `AgentProduct`,
`ToolServer`, `Plugin`, or `Provider`) to a `Capability`, with the following
edge attributes:

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `target` | ref<`Capability`> | yes | The capability being claimed. |
| `versionRange` | versionRange | yes | Range over which the claim holds. |
| `level` | enum<full,partial,experimental,unsupported,degraded,none> | yes | Support level. `none` is retained as a legacy synonym for `unsupported`. |
| `notes` | markdown | no | Caveats, partial-support details, or known degradations. |
| `evidenceSourceIds` | list<ref<`EvidenceSource`>> | no | Direct evidence references (see [../../schema/evidence-model.md](../../schema/evidence-model.md) for when to mint a `Claim` instead). |

### Example

```yaml
nodeKind: AgentRuntimeImpl
id: agent-runtime-impl:claude-code.runtime@1.x
edges:
  supports:
    - target: capability:supports-mcp
      level: full
      versionRange: ">=1.0.0 <2.0.0"
      notes: "Full MCP support per Claude Code 1.0+"
      evidenceSourceIds:
        - evidence:claude-code-docs-mcp-2026
```

### Invariants

1. The source NodeKind MUST be one of the declared `edge:supports.source` kinds.
2. The target Capability's `appliesToNodeKinds` MUST include the source NodeKind.
3. `level = degraded` SHOULD have `notes` set.
4. For a given `(source, capability)` pair, `versionRange`s across multiple
   `supports` entries MUST NOT overlap unless one is `supersededBy` another.

---

## NodeKind: `InstallMethod`

A canonical install method referenced by versioned products, plugins, and blueprints.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `install:<slug>`, e.g. `install:npm`. |
| `displayName` | string | yes | Human-readable. |
| `kind` | enum<npm,brew,gh-extension,curl,winget,scoop,manual,pip,nix,cargo,go-install> | yes | The install-method kind. |
| `platforms` | list<enum<darwin,linux,win32>> | yes | Supported OS platforms. |
| `command` | string | yes | Install-command template, e.g. `npm install -g {{package}}`. |
| `prerequisiteCheck` | string | no | Check-command template, e.g. `node --version`. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `installs` | `AgentVersion` \| `Plugin` \| `Blueprint` | N:N | Cross-cluster install edge. |
| `requires_capability` | `Capability` | N:N | E.g., `install:gh-extension` requires the `gh` CLI; modeled as a capability. |

### Invariants

1. `command` MUST be a non-empty templated string.
2. `platforms` MUST be non-empty.
3. `kind` values MUST be unique across the catalog (one canonical `InstallMethod`
   per kind).

---

## Examples

```yaml
- id: capability:supports-thinking
  displayName: "Supports thinking"
  description: |
    The entity can produce internal reasoning ("thinking") tokens before
    emitting the final response. Implies the wire protocol carries a
    distinct thinking channel and the runtime can render or hide it.
  appliesToNodeKinds: ["AgentVersion", "ModelVersion"]
  category: model
  edges:
    referenced_by:
      - target: term:thinking
```

```yaml
# Direct `supports` edge (catalog pass 9c remodel — replaces former CapabilitySupport node).
nodeKind: ModelVersion
id: model:claude-opus-4-7@current
edges:
  supports:
    - target: capability:supports-thinking-budget-tokens
      versionRange: ">=4.7.0 <5.0.0"
      level: full
      notes: |
        Anthropic API exposes `thinking.budget_tokens` for Opus 4.7 and Sonnet
        4.7. Budget is enforced server-side; values above the model's max are
        clamped, not rejected.
      evidenceSourceIds:
        - evidence:anthropic-api-thinking-2026-01
```

```yaml
- id: install:npm
  displayName: "npm (global)"
  kind: npm
  platforms: [darwin, linux, win32]
  command: "npm install -g {{package}}"
  prerequisiteCheck: "node --version"
  edges:
    installs:
      - target: agent-version:claude-code@1.x
      - target: plugin:react-tdd
    requires_capability:
      - target: capability:host-has-node
```

## Related

- [`README.md`](./README.md) — full node-kind catalog and cluster index.
- [`agent-stack.md`](./agent-stack.md) — `AgentVersion`, `ModelVersion`, `Provider`,
  `LaunchConfig`, `CapabilityProfile`, `SessionModel` are the primary subjects of
  capability claims.
- [`extensions-plugins.md`](./extensions-plugins.md) — `Plugin`, `Skill`, `Subagent`,
  `ToolServer`, `ToolDescriptor`, `Blueprint` reference capabilities via
  `requires_capability`.
- [`../../schema/edge-kinds.md`](../../schema/edge-kinds.md) — edge specs for `supports`,
  `supported_by`, `requires_capability`, `has_modality`, and `installs`-style edges.
- [`../../schema/evidence-model.md`](../../schema/evidence-model.md) — the evidence policy that
  gates capability claims (the `policy:capability` rule applies to the
  `supports` edge attributes; mint a `Claim` only for disputed/time-banded facts).

