# NodeKinds: Security Descriptors

> Cluster — Informational security descriptors. See [`README.md`](./README.md) for the
> full catalog.

This file specifies three **informational** descriptor NodeKinds added in catalog pass 18:
**`FilesystemSafetyInvariant`**, **`SecretHandlingPolicy`**, and **`HarnessHardening`**.

These descriptors document hardening posture and runtime safety expectations of an
agent host or harness. They are **purely informational catalog metadata** — they
do NOT participate in a Trust Chain, attestation graph, evidence-signing chain, or
any cryptographic provenance. No edges to/from a `Trust*` NodeKind are introduced.

Origin: `convergent` for all three (cross-vendor patterns observed in Claude Code,
Codex, OpenCode, Gemini CLI hardening docs; not yet a single ratified standard).

---

## NodeKind: `FilesystemSafetyInvariant`

### Purpose

A **`FilesystemSafetyInvariant`** records an invariant that an agent host or harness
declares about filesystem access (e.g., "agent processes never write outside the
declared workspace root", "tmp paths are scoped per-session and pruned on exit").

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `fs-safety-invariant:<slug>`, e.g. `fs-safety-invariant:workspace-write-scope`. |
| `displayName` | string | yes | Human-readable label. |
| `description` | markdown | yes | One paragraph stating the invariant. |
| `kind` | enum<workspace-write-scope,tmp-scope,read-only-paths,deny-list,sandbox-confinement,symlink-policy,case-sensitivity> | yes | Category of invariant. |
| `enforcementMode` | enum<documented,advisory,enforced-runtime,enforced-sandbox> | yes | How the invariant is held: documentation only, advisory check, runtime enforcement, or sandbox-level enforcement. |
| `appliesTo` | list<ref<`AgentVersion`> \| ref<`AgentPlatformImpl`>> | yes | The agent or platform the invariant applies to. |
| `informationalOnly` | bool | yes | MUST be `true`. Marker that this is descriptor-only metadata, not a Trust Chain entry. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `applies_to_agent` | `AgentVersion` \| `AgentPlatformImpl` | N:N | Mirrors `appliesTo`. |

### Invariants

1. `id` MUST start with `fs-safety-invariant:`.
2. `informationalOnly` MUST equal `true`. Records cannot be promoted to Trust Chain
   evidence without an explicit schema bump.
3. No edge to a Trust-Chain NodeKind (`TrustLevel`, `EvidenceSource`, `Claim`,
   `EvidencePolicy`) is permitted.

### Examples

- `graph/security-descriptors/fs-safety-invariant/workspace-write-scope.yaml`

---

## NodeKind: `SecretHandlingPolicy`

### Purpose

A **`SecretHandlingPolicy`** records how an agent host handles secrets (env vars,
api keys, oauth tokens) — what is masked in transcripts, what is forwarded to
subprocesses, and what is persisted to session files.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `secret-handling:<slug>`, e.g. `secret-handling:claude-code-default`. |
| `displayName` | string | yes | Human-readable label. |
| `description` | markdown | yes | One paragraph on the policy. |
| `maskingMode` | enum<none,heuristic-redaction,explicit-allowlist,explicit-denylist> | yes | How secrets are detected and masked in transcripts. |
| `forwardingPolicy` | enum<inherit,scoped-allowlist,explicit-injection,none> | yes | Whether the agent forwards env vars to subprocesses. |
| `persistencePolicy` | enum<never,scrubbed,as-recorded> | yes | Whether secrets may end up in persisted session/journal files. |
| `appliesTo` | list<ref<`AgentVersion`> \| ref<`AgentPlatformImpl`>> | yes | Subjects of the policy. |
| `informationalOnly` | bool | yes | MUST be `true`. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `applies_to_agent` | `AgentVersion` \| `AgentPlatformImpl` | N:N | Mirrors `appliesTo`. |

### Invariants

1. `id` MUST start with `secret-handling:`.
2. `informationalOnly` MUST equal `true`.
3. No edge to a Trust-Chain NodeKind permitted.

### Examples

- `graph/security-descriptors/secret-handling/claude-code-default.yaml`

---

## NodeKind: `HarnessHardening`

### Purpose

A **`HarnessHardening`** describes hardening features the host harness applies to
agent processes (process isolation, capability dropping, network restrictions, fd
limits). Aggregates posture; not a per-invocation runtime record.

### Attributes

| Attribute | Type | Required | Notes |
|---|---|---|---|
| `id` | id | yes | `harness-hardening:<slug>`, e.g. `harness-hardening:claude-code-mac-default`. |
| `displayName` | string | yes | Human-readable label. |
| `description` | markdown | yes | One paragraph on hardening posture. |
| `processIsolation` | enum<none,subprocess,namespace,sandbox-app,vm,container> | yes | Process-isolation level. |
| `networkPolicy` | enum<unrestricted,allowlist,denylist,offline> | yes | Outbound network restriction posture. |
| `capabilityDropping` | list<string> | optional | Linux capabilities or macOS entitlements dropped (e.g. `["CAP_NET_ADMIN","CAP_SYS_ADMIN"]`). |
| `fdLimit` | int | optional | Per-process fd cap when applied. |
| `appliesTo` | list<ref<`AgentVersion`> \| ref<`AgentPlatformImpl`>> | yes | Subjects. |
| `informationalOnly` | bool | yes | MUST be `true`. |

### Edges

| Edge | Target | Cardinality | Notes |
|---|---|---|---|
| `applies_to_agent` | `AgentVersion` \| `AgentPlatformImpl` | N:N | Mirrors `appliesTo`. |

### Invariants

1. `id` MUST start with `harness-hardening:`.
2. `informationalOnly` MUST equal `true`.
3. No edge to a Trust-Chain NodeKind permitted.

### Examples

- `graph/security-descriptors/harness-hardening/claude-code-mac-default.yaml`

---

## Scope guard (informational-only)

These three NodeKinds were added in catalog pass 18 explicitly *outside* the Trust Chain
program. The `informationalOnly: true` attribute is a hard schema marker:
validators MUST reject any record whose `informationalOnly` is unset or `false`,
and MUST reject any edge between these NodeKinds and `TrustLevel`,
`EvidenceSource`, `Claim`, or `EvidencePolicy`. If the project later decides to
bring filesystem/secret/harness posture into a formal trust graph, that requires
its own remodel pass with explicit reviewer sign-off.

---

## Related

- [`README.md`](./README.md) — node-kind catalog and cluster index.
- [`trust.md`](./trust.md) — Trust Chain NodeKinds. **Distinct cluster** — no
  cross-edges with this file's descriptors.
- [`agent-stack.md`](./agent-stack.md) — `AgentVersion`, `AgentPlatformImpl`
  (subjects of these descriptors).

