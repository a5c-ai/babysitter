# 05 — Validation Rules

Invariants the validator checks before a graph is considered valid. Rules are numbered for citation from node-kind specs (`invariants: [V-3.1, V-5.2]`).

Severity: **fail** blocks merge; **warn** logs but does not block.

---

## V-1. Structural rules

- **V-1.1** Every node has a `NodeKind` declared in `schema/ontology-schema.yaml`. *(fail)*
- **V-1.2** Every edge has an `EdgeKind` declared in the schema, and its `source` and `target` NodeKinds are within the EdgeKind's allowed sets. *(fail)*
- **V-1.3** Every edge respects its declared `cardinality`. *(fail)*
- **V-1.4** Every required attribute on a node has a value. *(fail)*
- **V-1.5** Every `id` is well-formed: `<kind-prefix>:<slug>` where `<kind-prefix>` is the prefix declared by that NodeKind and `<slug>` is lower-kebab-case. *(fail)*
- **V-1.6** Every `ref<NodeKind>` attribute resolves to a node of the declared NodeKind. *(fail)*
- **V-1.7** Every attribute value type-checks against its declared `AttributeType`. *(fail)*
- **V-1.8** Every id whose NodeKind is version-qualified (`AgentVersion`, `ModelVersion`, `ModelProviderVersion`) MUST contain an `@` separator with a non-empty `<version-spec>` after it (i.e. `<prefix>:<product-slug>@<version-spec>`). Bare `<prefix-version>:<slug>` ids without `@<version-spec>` are invalid. See `../schema/meta-schema.md` § Identity → Version-qualified ids. *(fail)*
- **V-1.9** Every NodeKind in `schema/ontology-schema.yaml` MUST declare `origin: standard | universal | a5c | derived`. The classification is metadata on the NodeKind itself (analogous to `cluster`, `prefix`), not a per-instance attribute. `derived` indicates a synthesized / cross-vendor concept that is not (yet) a ratified standard. (redefined this taxonomy: `standardized` → `standard`, `convergent` → `derived`.) See `../schema/meta-schema.md` § NodeKind. *(fail)*
- **V-1.12** Any NodeKind or EdgeKind that declares `origin: derived` MUST carry connected evidence: at least one of `originContext` (free-form citation), `originDate` (iso-date), or `evidenceRefs` (list, when defined on the kind) MUST be present and non-empty. This rule encodes the redefinition of `derived` ("synthesized/derived; must have connected evidence"). *(fail)*
- **V-1.13** Sidecar files (YAML docs whose top-level shape is the `extendsNode:` envelope, see `meta-schema.md` § Partial node representation) MUST reference an existing canonical id and MUST NOT redefine attributes (sidecars are edge-only by convention). A sidecar pointing at an undefined id, declaring `attributes:`, or whose `extendsNode.nodeKind` disagrees with the canonical declaration, fails. *(fail)*
- **V-1.14** Merge-mode partial-node-representation: when the same `(nodeKind, id)` is declared in multiple files, scalar attributes MUST agree across all files (else fail). List attributes concatenate (de-duplicated), map attributes deep-merge with no overlapping keys, and `displayName` / `description` follow first-non-empty-wins. A `nodeKind` mismatch on the same id is also a V-1.14 failure. *(fail)*
- **V-1.10** For version-qualified entities (`AgentVersion`, `ModelVersion`, `ModelProviderVersion`), the `<version-spec>` segment after the `@` separator in the id MUST match exactly one of the following forms: *(fail)*
  - `current` (floating reference to the most recent canonical version)
  - `latest` (alias for `current`)
  - `next` (the upcoming version)
  - a major-version range: `\d+\.x` or `\d+\.x\.x` (e.g. `1.x`, `2.x.x`)
  - a minor-version range: `\d+\.\d+\.x` (e.g. `1.0.x`)
  - a full semver: `\d+\.\d+\.\d+(-[\w.]+)?` (e.g. `1.0.0`, `1.2.3-rc.1`)

  Forms like `@1.x.0` or `@v1` or empty `@` are invalid. The `validate.py` validator enforces this regex.

## V-2. Evidence rules

- **V-2.1** Every evidence-bound attribute is backed by at least one `Claim`, and that `Claim` has at least one `EvidenceSource` whose `trustLevel` meets or exceeds the policy's `minimumTrustLevel`. *(fail)*
- **V-2.2** Every `EvidenceSource` is within its applicable `freshnessWindowDays` (measured from `observedAt` or `reviewedAt`, whichever is later). *(fail)*
- **V-2.3** Every `Claim` has a `reviewOwner` matching the policy's `reviewOwnerPattern` when one is declared. *(fail)*
- **V-2.4** No `Claim` on a safety-critical attribute (capability binding, install method, sandbox profile) is backed solely by `synthetic`-trust evidence. *(fail)*
- **V-2.5** Every `EvidenceSource` of `kindLabel = web` has a `reachabilityCheck` whose `status = ok` within the freshness window. *(warn → fail after 30d stale)*
- **V-2.6** A `Claim` whose `expiresAt` has passed is treated as missing for V-2.1 purposes. *(fail)*
- **V-2.7** A `Claim` with `supersededBy` set must point to a newer `Claim` on the same `subjectId` and `attribute`. *(fail)*

## V-3. Versioning rules

- **V-3.1** Capability claims (`supports` edges and capability-attributes) are bound to a `versionRange` referring to an `AgentVersion`, not directly to an `AgentProduct`. *(fail)*
- **V-3.2** Every `replaces` edge has a matching `replaced_by` inverse, and vice versa. *(fail)*
- **V-3.3** A node carrying `deprecatedAt` must have a `replacedBy` ref unless its NodeKind allows terminal deprecation (declared explicitly). *(fail)*
- **V-3.4** No two non-deprecated `AgentVersion` nodes for the same `AgentProduct` overlap on `versionRange`. *(fail)*
- **V-3.5** Every EdgeKind that declares `aliasOf: <canonical>` MUST point at a canonical EdgeKind that exists in the schema. The aliased edge MUST NOT itself declare `aliasOf` (single-hop only). When a graph example uses an aliased edge, the validator treats it as the canonical edge for cross-checking source/target/cardinality. (Formalized in the 2026-04-29 remodel — Change D.) *(fail)*

## V-4. Domain ontology rules

- **V-4.1** The `Domain → Specialization → Topic` hierarchy (via `contains` edges) is acyclic. *(fail)*
- **V-4.2** Every `Framework` has exactly one `belongs_to_language` edge (or, if a multi-language framework is declared, a `multiLanguage: true` attribute and at least one `belongs_to_language` edge). *(fail)*
- **V-4.3** A `StackProfile` composes at least one `Language` and at least one `Framework` or `Tool`. *(fail)*

## V-5. Role ontology rules

- **V-5.1** `Role.isAgentic` is required (a `bool`, no default). *(fail)*
- **V-5.2** The `delegates_to` graph on `Role` nodes is acyclic. *(fail)*
- **V-5.3** Every `Role` has at least one `holds_responsibility` edge. *(fail)*
- **V-5.4** A `Subagent` linked by `roles_played_by` to a `Role` must satisfy that `Role`'s `requires_skill` set or the link declares an explicit `partial: true` attribute. *(warn)*

## V-6. Terminology rules

- **V-6.1** Every `Term` has at least one associated `Definition`. *(fail)*
- **V-6.2** Every `Term.canonicalDefinition` resolves to a `Definition` node that exists. *(fail)*
- **V-6.3** `synonym_of` edges within the same `inContext` form valid equivalence classes (symmetric, transitive, no cycles introducing contradictory `subsumes` claims). *(fail)*
- **V-6.4** A `Term` referenced by `references` must point to a NodeKind or Capability that exists in the current schema version. *(fail)*

## V-7. Channel and hook rules

- **V-7.1** `ChannelKind` values are restricted to: `mcp-channel`, `a2a-channel`, `chat-channel`, `mailbox-channel`. New values require a schema bump. *(fail)*
- **V-7.2** `HookFamily` values are restricted to: `shell-hook`, `in-process`, `observer`. *(fail)*
- **V-7.3** Every `HookSurface` has exactly one `belongs_to_family` edge. *(fail)*
- **V-7.4** Every `Channel` has exactly one `has_kind` edge. *(fail)*

## V-8. Trust rules

- **V-8.1** The `Authority.delegates_to` graph is acyclic. *(fail)*
- **V-8.2** Every `Attestation.signed_by` resolves to a known `Authority`. *(fail)*
- **V-8.3** `TrustLevel` values are restricted to: `official-web`, `vendor-doc`, `community`, `synthetic`. *(fail)*
- **V-8.4** An `Attestation` whose subject is itself an `Authority` does not introduce a self-attestation cycle. *(fail)*

## V-9. Scope rules

- **V-9.1** For any entity, its `in_scope` and `out_of_scope` edges to the same `ScopeBoundary` cannot coexist. *(fail)*
- **V-9.2** Every `ScopeBoundary` carrying `out_of_scope` items has at least one `out_of_scope_reason` edge per item or a default reason on the boundary. *(fail)*
- **V-9.3** `OutOfScopeReason` enum values are listed in the schema; new reasons require a schema bump. *(fail)*

## V-10. Lifecycle rules

- **V-10.1** Every separate `LifecycleState` entry has exactly one `belongs_to_machine` edge. (Inline states declared in `StateMachine.states[]` automatically belong to their parent machine and are exempt.) *(fail)*
- **V-10.2** Every `StateMachine` has at least one terminal state. After remodel 2026-04-29 (change J), the check reads `StateMachine.states[].terminal = true` when states are inline; when states are declared as separate `LifecycleState` entries, the check reads `LifecycleState.terminal = true` on entries whose `belongs_to_machine` resolves to this machine. *(fail)*
- **V-10.3** From every non-terminal state — whether inline (`StateMachine.states[]` with `terminal: false`) or separate (`LifecycleState`) — at least one transition exists, declared via `StateMachine.transitions[]` (inline) or via a `transitions_to` edge (separate). *(fail)*
- **V-10.4** Transition cycles are allowed only when annotated `cycle: explicit` on at least one transition in the cycle. *(warn)*

## V-11. Extension rules

- **V-11.1** Every `Plugin.installs_into` edge declares an `installMethod`. *(fail)*
- **V-11.2** A `PortableExtension.compiles_to` `NativeExtension` declares a `host` matching a known `AgentProduct`. *(fail)*
- **V-11.3** Every extension claiming `implements ExtensionInterface` carries a `Claim` on `interfaceVersion` evidence-bound to the interface's release notes. *(fail)*

## V-12. General invariants

- **V-12.1** **No node is an island.** Every node has at least one edge. NodeKinds may opt out by declaring `isolatedAllowed: true` (e.g., `TrustLevel`, `OutOfScopeReason`). *(fail)*
- **V-12.2** `displayName` is unique per NodeKind. Duplicates require a `duplicateOf` ref justifying the duplication (e.g., disambiguated by context). *(fail)*
- **V-12.3** `id` is globally unique across the graph. *(fail)*
- **V-12.4** Every example in `graph/` validates against rules V-1 through V-11. *(fail)*
- **V-12.5** Markdown node-kind specs and YAML node-kind records are in parity: every attribute documented in markdown is declared in YAML, and vice versa. *(fail)*

---

## V-13. Informational passes ()

These passes emit data into the validator JSON report under top-level keys
(`islands`, `coverageStats`) and console summaries, but **do not fail
validation**. They support iteration, not gating.

- **V-13.1 (islands.orphanExamples)** Example records with no incoming AND no
  outgoing edges to other example records. NodeKinds declaring
  `isolatedAllowed: true` are exempt. Severity: `info`.
  - ****: NodeKinds whose instances are reference-data
    BY DESIGN (glossaries / lookup tables / catalog rows that exist to be
    cited by id, not to participate in graph edges) are filtered out of
    `orphanExamples` and reported under a separate
    `islands.referenceDataExamples` field instead. The allowlist is
    defined in `tools/validator/validate.py` as
    `REFERENCE_DATA_NODE_KINDS = { "Term", "SourceRef", "PathDescriptor",
    "Language", "Topic", "InstallMethod", "EvidenceSource", "Acronym",
    "Synonym" }`. Both lists print in the validator stdout summary.
- **V-13.2 (islands.deadNodeKinds)** NodeKinds declared in
  `schema/ontology-schema.yaml` with zero example instances anywhere in
  `graph/`. Severity: `info` (deferred populating some).
- **V-13.3 (islands.deadEdgeKinds)** EdgeKinds declared in
  `schema/edge-kinds.yaml` that are never referenced from any example
  `edges:` block. Severity: `warn` (probably should be removed or used).
- **V-13.5 (largeFiles)** File-size soft warn (): for every
  YAML file under `graph/`, the validator records `{path, sizeBytes,
  lineCount, suggestion}` whenever `sizeBytes > 30 KB` OR `lineCount >
  800`. The validator stdout prints the top 10 largest files. Severity:
  `warn` (informational; never fails validation). The remediation is to
  apply the  (file split or
  sidecar) — see `meta-schema.md` § Partial node representation.
- **V-13.4 (coverageStats.perNodeKind)** Per-NodeKind coverage report:
  declared attribute count, declared incoming/outgoing edge-type counts,
  example instance count, and population fractions averaged across instances
  (`attrCoverage`, `incomingEdgeCoverage`, `outgoingEdgeCoverage`). The
  validator stdout prints the top-10 most-covered + bottom-10 least-covered
  NodeKinds (excluding 0-instance kinds).

---

Each rule is referenced by id (e.g., `V-2.4`) from node-kind invariants and from CI failure messages so authors can locate the offending rule quickly.
