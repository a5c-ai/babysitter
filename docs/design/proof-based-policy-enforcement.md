# Proof-Based Policy Enforcement — Design Specification

Status: **Draft 1** · Date: 2026-07-03 · Owner: Security/Platform
Research input (frozen, read in full before implementing): [`.a5c/processes/proof-policy-enforcement.research.md`](../../.a5c/processes/proof-policy-enforcement.research.md)

## 0. Summary

Add a cryptographic policy-enforcement layer to the agent-orchestration monorepo so that a
specific command, run with a specific tool and specific credentials, executes **only** when a
declarative policy's required *trust chain of signed evidence* is satisfied. Evidence includes
signed human breakpoint approvals (`PermissionEvidence`), signed model-decision attestations
(`ModelResponse`, e.g. "opus decided to call this tool"), and delegation links. When a policy is
satisfied, a short-lived **`CommandAuthorization`** envelope is issued binding the exact
tool + command hash + args hash + credential scope + evidence fingerprints + expiry. The tool
layer verifies that authorization at the point of execution and **fails closed** for
policy-covered actions. Fallbacks are forbidden: any error during verification is a denial.

The design **reuses** genty's `SignedEnvelope<T>` + JSON canonical form
(`packages/genty/core/src/trust/`) as the universal proof format, **extends** the two existing
declarative policy engines rather than duplicating them, and adds one new workspace package,
`@a5c-ai/policy-adapter` (`packages/adapters/policy`), that both genty and adapters consume
without a circular dependency.

Every requirement below has a stable acceptance-criterion ID (`AC-n`) and is mapped to exactly
one milestone (A–E) in §12.

---

## 1. Goals, non-goals, and milestones

### 1.1 Goals

- A single canonical proof envelope for every producer and consumer.
- A declarative, per-action policy language expressing *flexible* trust chains (multiple shapes).
- Non-spoofable evidence producers for human approvals and model decisions.
- Enforcement at every tool-execution gate, fail-closed for covered actions.

### 1.2 Non-goals (scope guard) — **AC-24**

The following are explicitly **out of scope** for this design and must not be built under it:

1. **Journal hash-chaining / audit hardening** (`storage/journal.ts` `prevChecksum`). Supporting,
   tracked separately; the research doc §Gap-5 lists it as non-core.
2. **General secret-management / vault integration.** Credential *scoping* is modeled; a secrets
   backend is not.
3. **Replacing the proxy's bearer-token auth** (`server.ts` `isAuthorized`, 148-175). It stays for
   transport auth; it is not reused as proof (research §6 caveat).
4. **A network trust-root distribution service / PKI CA.** Trust roots are file-based config
   (§10). No online revocation service (OCSP-style) is built; revocation is a local list.
5. **Policy authorship UI / TUI.** Policies are YAML/JSON files edited by hand in this iteration.
6. **Rewriting proven's canonical form immediately.** proven keeps its text canonical form for
   backward-compatible verification; new evidence uses the JSON form with a bridge (§4.3).
7. **Signing the passthrough-proxy path in this iteration** (documented gap, §6.5).

### 1.3 Milestones

| ID | Milestone | Scope |
|----|-----------|-------|
| **A** | trust-core | Unified envelope, evidence taxonomy, identity/key model, `CommandAuthorization` type, trust-roots config + key ops. |
| **B** | policy-engine | Policy document schema, evaluator, `@a5c-ai/policy-adapter` package, authorization issuance. |
| **C** | evidence-producers | Proxy model-attestation, in-process genty attestation, enforced signed breakpoint approvals. |
| **D** | tool-layer-enforcement | Verification at adapters GATE 1/2/3 + genty dispatcher/session. |
| **E** | e2e-integration | End-to-end trust chain (human approval + opus attestation → aws command), default-deny scopes, threat-case tests. |

---

## 2. Architecture overview

```
                        ┌─────────────────────────────────────────────┐
   evidence producers   │            @a5c-ai/policy-adapter            │  consumers
                        │        (packages/adapters/policy)            │
 human approval ──────► │                                             │
  (PermissionEvidence)  │  ┌────────────┐   ┌──────────────────────┐  │
                        │  │  Policy    │   │  Authorization        │  │ ◄── GATE 1 tools/dispatch.ts
 model decision ──────► │  │  Document  │──►│  Issuer               │  │ ◄── GATE 2 core/spawn-runtime-hooks.ts
 (ModelResponse attest) │  │  (schema)  │   │  (CommandAuthorization│  │ ◄── GATE 3 core/spawn-invocation.ts
   ▲ proxy (authoritative)│  └────────────┘   │   SignedEnvelope)     │  │ ◄── genty session.ts / MCP dispatcher
   ▲ genty (in-process)  │  ┌────────────┐   └──────────────────────┘  │
 delegation links ────► │  │ Trust      │   ┌──────────────────────┐  │
                        │  │ Roots      │   │  Authorization        │  │
                        │  │ (config)   │   │  Verifier             │  │
                        │  └────────────┘   └──────────────────────┘  │
                        └──────────────────────────────────────────────┘
                              uses @a5c-ai/genty-core/trust primitives
```

`@a5c-ai/policy-adapter` depends **only** on `@a5c-ai/genty-core` (for the trust primitives) and
Node built-ins. `@a5c-ai/genty-core` already exists as a leaf that adapters can depend on, so
placing the package under `packages/adapters/policy` lets `@a5c-ai/tools-adapter`,
`@a5c-ai/comm-adapter`, `@a5c-ai/tasks-adapter`, and `@a5c-ai/transport-adapter` consume it, while
`@a5c-ai/genty-platform` (which already depends on genty-core and can depend on adapters) consumes
it too — with no cycle (§8).

---

## 3. Unified proof envelope (Milestone A)

### 3.1 Adopt `SignedEnvelope<T>` + JSON canonical form

**AC-1.** The universal proof format is genty's `SignedEnvelope<T>`
(`packages/genty/core/src/trust/types.ts:1-8`): `{ payload, signature, publicKeyFingerprint,
signedAt, signedFields, algorithm: 'Ed25519' }`. All new evidence, `CommandAuthorization`, and
migrated proven answers use it. Canonical serialization is genty's
`canonicalize` (`signing.ts:65-68`):
`JSON.stringify({ _meta: deepSortKeys(meta), _payload: deepSortKeys(extractFields(payload,
signedFields)) })`. **No new envelope type or canonicalization routine may be introduced** — the
policy adapter imports `signPayload` / `verifySignature` from `@a5c-ai/genty-core`
(re-exported at `trust/index.ts:1`). Rationale: proven's text canonical form
(`proven/sign.ts:23-30`, `field=value\n`) cannot represent the nested structures (evidence
fingerprint arrays, args objects) this design requires; genty's form deep-sorts keys and supports
arbitrary JSON, and the research §Gap-1 designates it authoritative.

**AC-2.** `verifySignature` (`signing.ts:40-56`) is the only signature-check primitive.
Verification recomputes the canonical form from `envelope.payload` and `envelope.signedFields`;
a field present on `payload` but absent from `signedFields` is **not** covered and MUST be treated
as untrusted by every consumer (documented invariant, enforced by a lint/test asserting security-
critical fields appear in `signedFields`).

### 3.2 Migration / bridge for proven breakpoint answers

**AC-3.** A bridge in `@a5c-ai/policy-adapter` converts a legacy `ProvenBreakpointAnswer`
(text-canonical, `proven/sign.ts`) into a `SignedEnvelope<PermissionEvidencePayload>` **without
re-signing**: the bridge verifies the legacy answer via proven `verifyAnswer`
(`proven/verify.ts:20-72`), and on success emits a *derived* `PermissionEvidence` envelope signed
by the policy adapter's own bridging identity, whose payload records the original
`publicKeyFingerprint`, `breakpointId`, and `approved` so the provenance is auditable. During the
transition, breakpoint producers MAY emit **both** the legacy `.proven.json` and a new
`PermissionEvidence` envelope (dual-write); the research §Gap-1 permits "emit both during
transition." The proven text form is not deleted in this iteration (§1.2 non-goal 6).

**AC-4.** New breakpoint approvals (post-milestone-C) are signed directly as
`SignedEnvelope<PermissionEvidencePayload>` using `signPermissionEvidence`
(`trust/tool-signing.ts:36-41`); the git-native backend's auto-sign path
(`backends/git-native.ts` auto-sign on answer) is extended to write the envelope alongside
`.answer.json`, keyed by `breakpointId`. The bridge (AC-3) becomes a no-op for these.

---

## 4. Evidence taxonomy, identity & key model (Milestone A)

### 4.1 Evidence types

All three reuse existing genty payload types; **no new payload schemas** are introduced for the
base evidence set.

| Evidence | Payload type (reused) | Source | Producer key | Trust-root kind |
|----------|-----------------------|--------|--------------|-----------------|
| **human-approval** | `PermissionEvidencePayload` (`tool-signing.ts:13-20`): `{action, scope, approvedBy, approvedAt, expiresAt?, conditions?}` | breakpoint answer | human responder key (proven `.keys/private`) | `human` |
| **model-decision** | `ModelResponsePayload` (`model-signing.ts:4-12`): `{modelId, provider, inputMessagesHash, outputContent, thinkingContent?, tokenUsage?, timestamp}` | transport proxy (authoritative) **or** genty session (in-process) | proxy engine key **or** genty adapter key | `engine` |
| **delegation** | `DelegationChainLink` (`types.ts:29-33`) carried in `AgentRequestPayload.delegationChain` (`agent-signing.ts:12`) | agent | agent identity key | `agent` |

**AC-5.** The policy adapter exposes an `Evidence` discriminated union
`{ kind: 'human-approval' | 'model-decision' | 'delegation'; envelope: SignedEnvelope<...> }`
that wraps these three payloads and nothing else in v1. Adding a new evidence kind is a typed,
reviewable change (closed set), not an open string.

### 4.2 Identity & key model — who holds which key

**AC-6.** Each producer has a distinct key and a declared trust-root **kind**. A `TrustRoot` record
is `{ fingerprint, kind: 'human' | 'engine' | 'agent' | 'tool', label, expiresAt?,
revoked?: boolean }`. Fingerprints are SHA-256 of the SPKI/DER public key, exactly as both
existing systems compute them (`genty signing.ts:9-11`; `proven keys.ts:18`) — the two are
interchangeable, so proven-generated human keys are valid `human` trust roots without
re-fingerprinting.

- **Human keys**: generated + rotated by proven (`proven/keys.ts:9-37`, `122-148`), stored at
  `.breakpoints/.keys/private/<fp>.key.json` (gitignored) with the public half git-tracked under
  `trusted/`. Registered as `kind: 'human'`.
- **Engine (proxy) key**: held **outside the agent process** by the transport proxy (§6).
  Registered as `kind: 'engine'`. This is the authoritative model-decision producer.
- **Engine (in-process genty) key**: the genty adapter identity key, used only on the non-proxied
  path. Also `kind: 'engine'` but a *different fingerprint*; policies MAY require the proxy
  fingerprint specifically (§6.4, AC-15).
- **Agent keys**: `createAgentIdentity` (`trust/identity.ts:4-11`); `kind: 'agent'`.
- **Policy-adapter issuer key**: signs `CommandAuthorization` and bridged evidence. `kind:
  'engine'`, held by whichever process runs the policy adapter (typically the orchestrator).

**AC-7.** Trust roots are configured in a single file (§10) whose entries map fingerprints to
kinds. Verification uses the trusted public key material only from this config plus the proven
`trusted/` directory; a signature from any fingerprint **not** present as a trust root of the
required kind is a verification failure (no implicit trust).

---

## 5. `CommandAuthorization` envelope (Milestone A / B)

**AC-8.** `CommandAuthorizationPayload` (new type in `@a5c-ai/policy-adapter`, signed as
`SignedEnvelope<CommandAuthorizationPayload>` by the issuer key) has exactly these fields, all of
which MUST be in `signedFields`:

```ts
interface CommandAuthorizationPayload {
  policyId: string;            // which policy document granted this
  toolName: string;            // exact tool identity (e.g. "Bash", MCP tool name)
  commandHash: string;         // sha256 of the canonical command string (empty-string sentinel if N/A)
  argsHash: string;            // sha256 of canonical JSON of the tool input/args
  credentialScope: string;     // opaque scope label the creds are bound to (e.g. "aws:prod:s3-ro")
  evidenceFingerprints: string[]; // fingerprints of every evidence envelope that satisfied the chain
  evidenceEnvelopeHashes: string[]; // sha256 of each satisfying evidence envelope (binds identity AND content)
  runId?: string;
  sessionId?: string;
  toolCallId?: string;         // correlates to the genty/adapters tool call when known
  issuedAt: string;            // ISO
  expiresAt: string;           // ISO, short-lived (default 120s, per-policy override)
}
```

`commandHash`/`argsHash` are computed with a canonical hashing helper in the policy adapter that
reuses genty's `deepSortKeys` ordering so hashing is stable across producers.

**Issuance rules — AC-9.** The issuer produces an authorization **iff** the policy engine
(§7) returns `granted` for the requested `{toolName, command, args, credentialScope}` context;
it binds `evidenceFingerprints` + `evidenceEnvelopeHashes` to the *specific* evidence envelopes
consumed (not the fingerprints alone — content hash prevents swapping a different envelope from
the same signer). `expiresAt = issuedAt + policy.authorizationTtl` (default 120s).

**Verification rules — AC-10.** A gate accepts an authorization **iff all** hold, else it denies:
1. `verifySignature` passes against the issuer trust root (`kind:'engine'`, matching fingerprint).
2. `now < expiresAt` (not expired) and `now >= issuedAt`.
3. `toolName` equals the tool being executed.
4. `commandHash` equals sha256 of the actual command about to run (empty-sentinel tolerated only
   when the policy for this action declares the tool non-command-bearing).
5. `argsHash` equals sha256 of the actual args about to run (TOCTOU binding, §11).
6. `credentialScope` equals the scope of the credentials about to be injected (GATE 3, §9.3).
7. Every hash in `evidenceEnvelopeHashes` re-verifies against a currently-valid, non-revoked
   trust root of the kind the policy required for that step.

Any exception thrown during steps 1–7 is a **denial**, never a pass (research §Constraints;
CLAUDE.md "fallbacks are evil").

---

## 6. Model-attestation producer strategy (Milestone C)

Two producers emit the **same** `ModelResponse` evidence type; both register as `kind:'engine'`
trust roots with distinct fingerprints.

### 6.1 Authoritative: transport proxy (`@a5c-ai/transport-adapter`)

**AC-11.** The proxy signs `ModelResponse` attestations at the wire seam, using a key held by the
proxy process (outside the agent — the agent cannot forge what model answered). `ProxyConfig`
(`transport/src/types.ts:15-24`, built in `config.ts:11-30`, env in `config.ts:32-43`) is extended
with attestation identity: `attestationEnabled: boolean`, `attestationKeyPath: string`,
`attestationFingerprint: string`, `attestationSidecarDir: string`, read from new
`AGENT_MUX_PROXY_ATTESTATION_*` env vars. The proxy identity key becomes an `engine` trust root.

**AC-12 (non-streaming).** In each route handler (`server.ts` `/v1/messages` 1595-1611,
`/v1/chat/completions` 1613-1629, `/v1/responses` 1631-1648), *after* `trackCompletionOutcome`
(1324-1348) and *before* protocol encoding, when the result is a `CompletionResult` (not a
`Response`), sign a `ModelResponsePayload` from `{ modelId: config.targetModel, provider:
config.targetProvider, inputMessagesHash, outputContent, toolCalls }`. `inputMessagesHash` is
sha256 over `plan.request.messages` (available at the handler from `createExecutionPlan`,
369-389). The envelope is **not** injected into the response body (bodies stay provider-compatible,
research §6 delivery-channel caveat) — it is written to the sidecar store keyed by request id.

**AC-13 (streaming).** For streamed completions, tool calls finalize only at the terminal `done`
event. `trackCompletionStream` (`server.ts:1287-1322`) — already an async-iterable wrapper — is
extended to accumulate tool-call deltas and, at `event.type === 'done'`, sign the attestation from
the accumulated tool calls + usage and write it to the sidecar. The existing terminal-event points
(anthropic ~740, openai-chat ~826, responses ~1008) are where accumulated calls are complete.

**AC-14 (correlation).** An `x-request-id` middleware (~`server.ts:1545`) echoes / mints a request
id. The attestation sidecar entry is keyed by that request id; the same id is returned as a
response header so the harness can thread it forward. Where the engine already carries per-tool-call
metadata (google `thoughtSignature` map, `server.ts:1537`; openai finish-reason accumulation,
`engines/openai.ts:280-288`) that mechanism is the precedent for carrying a per-tool-call
correlation hint. The policy component later resolves attestations by `requestId` (and, when
present, `toolCallId`) from the sidecar store.

### 6.2 In-process: genty session (`@a5c-ai/genty-core`)

**AC-15.** For the non-proxied genty runtime path, `endpoint.model` (in scope at
`session.ts:1122-1123`) is flowed into `ToolExecutionContext` (`core/src/types.ts:156-165`, extended
with an optional `modelAttestation?: SignedEnvelope<ModelResponsePayload>` and `modelId?: string`)
and emitted on the `tool_use` event (`session.ts:1236`). The genty adapter signs a
`ModelResponsePayload` via `signModelResponse` (`trust/model-signing.ts:14-19`) once per model turn
in `runCompletionLoop` (around 1216, where `result.toolCalls` is known), correlating
`toolCallId → requestId`. This producer's fingerprint is a *different* `engine` trust root.

### 6.3 Attestation resolution by the policy component

**AC-16.** The policy adapter resolves a model-decision evidence for a given tool call by looking
it up in the sidecar store (proxy path) by request id / tool-call id, falling back to the
in-process attestation carried on `ToolExecutionContext` (genty path). Resolution returns the
envelope; the policy step then verifies it (§7) against the required trust root(s).

### 6.4 High-assurance: requiring the proxy-signed variant

**AC-17.** A policy step for a high-assurance action MAY set `requireProxyAttestation: true`, which
constrains the accepted model-decision evidence to the **proxy** engine fingerprint(s) only,
rejecting the in-process genty attestation. This lets an operator demand the non-forgeable variant
for e.g. production credential use.

### 6.5 Passthrough-mode gap (documented)

**AC-18.** When the proxy runs in passthrough mode (no `completionEngine`; `proxyUpstream`,
`server.ts:524-554`), request/response bodies are forwarded unparsed, so no attestation is produced.
This is a documented gap for this iteration. Policies that set `requireProxyAttestation: true` will
therefore **deny** on passthrough (fail-closed, correct) — passthrough model calls cannot satisfy a
proxy-attestation requirement until a future iteration adds buffering-based signing. Operators must
not route high-assurance actions through passthrough transports.

---

## 7. Policy document schema (Milestone B)

**AC-19.** A policy document is a declarative file (YAML or JSON) with an array of `actions`. Each
action declares matchers and **one or more** required trust-chain templates. Multiple chain shapes
are a core requirement — an action lists alternative chains and is satisfied if **any** chain is
satisfied (OR across chains; AND across a chain's steps).

```yaml
version: 1
authorizationTtlSeconds: 120        # default; per-action override allowed
defaultDeny: []                     # credentialScope globs that default-deny when uncovered (§9.4)
actions:
  - id: aws-prod-write
    match:
      tool: "Bash"                  # glob over tool name (reuses dispatch.ts globToRegex, :25-31)
      command: "^aws s3 (cp|rm|sync)\\b"   # regex over the command string
      credentialScope: "aws:prod:*" # glob over the requested credential scope
    requireProxyAttestation: true
    chains:                         # satisfied if ANY chain fully verifies
      - id: human-plus-opus
        steps:
          - kind: human-approval
            trustedIdentities: ["fp:human:alice", "role:sre-oncall"]
            conditions:
              scopeEquals: "aws:prod:s3"
              notExpired: true
          - kind: model-decision
            conditions:
              modelIdMatches: "claude-opus-.*"   # model allowlist
      - id: two-human-quorum
        quorum: { of: "human-approval", min: 2 }  # alternate shape: dual human approval
        steps:
          - kind: human-approval
            trustedIdentities: ["role:sre-oncall"]
```

Schema elements:

- **`match`** — `{ tool: glob, command?: regex, credentialScope?: glob }`. Tool glob reuses
  `dispatch.ts` `globToRegex` (25-31). An action with no `command` matches non-command tools.
- **`chains[]`** — alternative trust-chain templates (OR). **AC-19a**: an action MUST support ≥2
  chains and the evaluator MUST grant on the first fully-satisfied chain.
- **`steps[]`** — ordered required evidence steps (AND). Each step: `kind` (evidence kind),
  `trustedIdentities` (fingerprints or role labels that resolve to fingerprints via trust roots),
  `conditions`.
- **`conditions`** — reuse the existing operator vocabulary from the policy engines
  (`runtime/policy/types.ts:7` and `governance/engine.ts` `matchCondition`:
  `eq/neq/gt/lt/gte/lte/contains/matches`) plus evidence-specific sugar: `modelIdMatches` (regex,
  the "opus decided" allowlist), `scopeEquals`, `notExpired`, `tagContains`. Sugar compiles down to
  the base operators so there is one condition evaluator.
- **`quorum`** — `{ of: kind, min: n }` requires ≥n *distinct-fingerprint* evidences of that kind
  (alternate chain shape; complements the platform quorum in `approvalChains.ts:96-158`).
- **`expiry`** — per-step `notExpired` uses `isPermissionValid` (`tool-signing.ts:50-55`) for
  `PermissionEvidence`, and `expiresAt`/key-expiry checks (proven `verify.ts:39-51`) for keys.

**AC-20 (evaluation semantics).** The policy evaluator, given an action context and the resolved
evidence set, returns `{ granted: boolean, matchedChainId?, reason, evidenceUsed: Evidence[] }`.
Precedence within the adapter mirrors the existing engines: an explicit `deny` action wins over
grants (deny > grant > default), consistent with `governance/engine.ts:94-145` and
`runtime/policy/engine.ts:65-110`. When `granted`, the issuer (§5) mints the
`CommandAuthorization` from `evidenceUsed`.

---

## 8. Component placement (Milestone B)

**AC-21.** A **new workspace package `@a5c-ai/policy-adapter` at `packages/adapters/policy`** is
introduced (the only genuinely new module in this design). Placement rationale, grounded in the
current dependency graph:

- It depends **only** on `@a5c-ai/genty-core` (trust primitives, `trust/index.ts`) + Node built-ins.
- `@a5c-ai/genty-core` is a leaf that adapters may already depend on; `@a5c-ai/tools-adapter`,
  `@a5c-ai/comm-adapter`, `@a5c-ai/tasks-adapter`, `@a5c-ai/transport-adapter` all consume the new
  package with **no cycle** (they do not depend back into it).
- `@a5c-ai/genty-platform` (which already depends on genty-core and can depend on adapters) consumes
  it at the MCP dispatcher seam.
- Placing it inside `packages/adapters/*` means it is already covered by the `"packages/adapters/*"`
  workspace glob (`package.json:17`) — **no root workspace-list edit needed**, avoiding one class
  of lockfile churn.

**AC-21a (lockfile constraint).** Adding the package still requires a lockfile regeneration.
Per the research §Constraints and MEMORY, this **must not** be done with bare `npm install` on
Windows (it pins win32 native bindings non-optional and breaks Linux `npm ci`). Regeneration is
done on Linux/CI or with the repo's sanctioned lockfile workflow; the design flags this as an
explicit implementation gate.

**AC-22 (extend, do not duplicate the two engines).** The policy adapter **reuses** the condition
evaluator shape and precedence of the two existing engines rather than forking a third:
- `@a5c-ai/babysitter-sdk` `runtime/policy/` (`engine.ts:22-56` `matchCondition`, `65-110`
  precedence) — the effect-level engine. The new adapter's condition sugar compiles to the same
  `PolicyConditionOp` set (`runtime/policy/types.ts:7`). The SDK engine gains proof-awareness by
  delegating trust-chain steps to the policy adapter (it does not re-implement signature checks).
- `@a5c-ai/genty-platform` `governance/engine.ts:94-145` — the harness-level engine. Same treatment:
  the platform engine calls the policy adapter for chain verification; it keeps its own rule
  precedence.
Neither engine's public API is broken; both gain an optional "trust-chain" rule kind that hands off
to `@a5c-ai/policy-adapter`.

---

## 9. Enforcement contract at each gate (Milestone D)

Covered = the tool/command/creds match some policy `action`. Uncovered = no action matches.

**AC-23 (uniform gate contract).** At every gate, for a **covered** action:
1. Resolve the required evidence (human approval by breakpoint id; model decision by request/tool
   call id via §6.3; delegation from the agent request).
2. Evaluate the policy (§7). If not granted → **deny** (fail closed).
3. Obtain / verify the `CommandAuthorization` (§5) with the exact `argsHash`/`commandHash`/
   `credentialScope` about to execute. If verification fails or throws → **deny**.
4. Only on success does the tool/command/credential proceed.

For an **uncovered** action: pass through unchanged (default-allow), **unless** the action's
`credentialScope` matches a configured `defaultDeny` glob (§9.4), in which case deny. Any error in
steps 1–3 is a denial, never a fallback-allow.

### 9.1 GATE 1 — `@a5c-ai/tools-adapter` dispatch (`tools/src/dispatch.ts:133-188`)

The `beforeToolUse` hook (`dispatch.ts:149-164`, `ToolHookBridge`, `hooks.ts:28-49`) is the
injection point. A new `PolicyVerifierHookBridge` wraps or composes the existing bridge and returns
`{ decision: 'deny', reason }` (`dispatch.ts:151-156`) when policy verification fails for a covered
call. `ToolCallContext` (`tools/src/types.ts:194-202`) already carries `toolName`, `input`,
`runId`, `sessionId` — enough to compute `argsHash` and resolve model-decision evidence by
`sessionId`/tool-call id.

### 9.2 GATE 2 — `@a5c-ai/comm-adapter` runtime hooks (`core/spawn-runtime-hooks.ts:97-120`)

The `preToolUse` blocking dispatch (`spawn-runtime-hooks.ts:99-117`, `HookDecision` deny at
113-116, type `runtime-hooks.ts:53-60`) gates spawned harnesses. A policy `preToolUse` handler
returns `{ decision: 'deny', reason }` for covered calls that lack a valid authorization. Only
`mode === 'blocking'` adapters get hard enforcement here; for non-blocking adapters GATE 1 / GATE 3
are the enforcing gates (documented per-gate coverage).

### 9.3 GATE 3 — credential injection backstop (`core/spawn-invocation.ts`)

**AC-23a (credential binding, the backstop).** Credentials currently flow as generic env vars with
no gate (`spawn-invocation.ts` docker 86-89, ssh 120-124, k8s 211-216 / 249-251). A credential
about to be injected is tagged with a `credentialScope`. Before injection, GATE 3 requires a valid
`CommandAuthorization` whose `credentialScope` matches; **no valid authorization → the scoped
credential is not injected** (it is dropped from the env map, and if the policy marks it required,
the spawn is denied). This is the backstop against alternate execution paths (§11): even if a gate
is bypassed, unauthorized scoped creds never reach the process.

### 9.4 genty dispatcher / session

**AC-23b.** The genty MCP dispatcher seam
(`platform/.../orchestration/effects.ts:561-601` `dispatcher.dispatch(...)`) and the genty session
tool-execution point (`session.ts:1251` `definition.execute(...)`) verify authorization before
execution, using the in-process model attestation (§6.2) carried on `ToolExecutionContext`. Genty's
existing `CustomToolDefinition.metadata.requiresApproval` (`core/src/types.ts:224`) is wired to
map onto policy coverage (declared-but-unenforced today → enforced via the adapter).

**AC-23c (default-deny scopes).** `defaultDeny` (policy doc §7) is a configurable list of
credential-scope globs (e.g. `["aws:prod:*"]`) for which an **uncovered** action is denied rather
than passed through. This makes "default-deny for production scopes, default-allow elsewhere"
expressible without breaking every uncovered dev action.

---

## 10. Key management & ops (Milestone A)

**AC-25 (generation/provisioning).** Human keys use proven `generateKeyPair` +
`saveTrustedPublicKey`/`savePrivateKey` (`proven/keys.ts:9-71`). Engine/agent/issuer keys use genty
`createKeyPair` (`trust/signing.ts:4-13`) / `createAgentIdentity` (`identity.ts:4-11`). The proxy
attestation key is provisioned to the proxy host and referenced by `attestationKeyPath` (§6.1);
it is **never** placed where the agent process can read it.

**AC-26 (trust-roots config format & location).** Trust roots live in a single git-tracked file
`.policy/trust-roots.json` at repo root (public material only), an array of `TrustRoot` records
(§4.2) plus a `revoked` list. Policy documents live under `.policy/policies/*.yaml`. Private keys
are **never** git-tracked: human private keys stay under `.breakpoints/.keys/private/`
(gitignored, existing proven layout); engine/issuer private keys under `.policy/.keys/private/`
(added to `.gitignore`). Public keys are git-tracked (`trusted/` + `trust-roots.json`).

**AC-27 (rotation & revocation).** Rotation reuses proven `rotateKey` (`keys.ts:122-148`): it marks
the old public key `expiresAt` and provisions a new pair. Verification honors key expiry at
**signing time** (`proven/verify.ts:39-51`; `isPermissionValid` `tool-signing.ts:50-55`) so an old
signature made while the key was valid still verifies unless the key is explicitly revoked.
Revocation is a `revoked: true` flag / fingerprint list in `trust-roots.json`; a revoked
fingerprint fails verification immediately regardless of signing time. What is git-tracked:
public keys, trust-roots config, policy docs, revocation list. What is local-only: all private keys.

---

## 11. Threat model (Milestone E test targets)

Each row is an acceptance criterion with a defense grounded in the design.

- **AC-28 — Spoofed approval** (fabricated `approved:true`). Defense: human-approval evidence must
  be a `SignedEnvelope<PermissionEvidencePayload>` signed by a `human` trust root; unsigned or
  wrong-signer approvals fail §5 step 7 / §7. Closes the current spoofable gap
  (research §3: SDK `task_post`/`commitEffectResult` accept unsigned answers today).
- **AC-29 — Replay across commands** (reuse an old approval for a new command). Defense:
  `CommandAuthorization` binds `commandHash` + `argsHash` + `expiresAt`, and human-approval
  `conditions.scopeEquals` + `notExpired`; an old approval for scope A does not satisfy a chain for
  scope B, and expiry bounds the window.
- **AC-30 — Model downgrade** (sonnet decides, claims opus). Defense: model-decision evidence covers
  `modelId` + `inputMessagesHash`, signed by the **proxy engine key held outside the agent**
  (§6.1); the agent cannot forge which model answered. `modelIdMatches: "claude-opus-.*"` +
  `requireProxyAttestation: true` for high-assurance actions.
- **AC-31 — Expired / stolen keys.** Defense: signing-time key-expiry checks (§10 AC-27), short
  authorization TTL (§5), and immediate revocation via `trust-roots.json`. A stolen key is revoked
  by fingerprint; new authorizations from it fail at once.
- **AC-32 — TOCTOU between authorization and execution.** Defense: the authorization is verified at
  the execution gate itself (§9) against the **exact** `argsHash`/`commandHash`/`credentialScope`
  about to run, not at an earlier decision point; a mutated command/args after issuance produces a
  hash mismatch → deny.
- **AC-33 — Bypass via alternate execution path.** Defense: enforcement at all three adapters gates
  **plus** the genty dispatcher/session, and the GATE 3 credential backstop (§9.3): with no valid
  authorization the scoped credential is never injected, so an alternate path that skips GATE 1/2
  still cannot obtain production credentials.

---

## 12. Acceptance-criteria → milestone map

| Milestone | Acceptance criteria |
|-----------|---------------------|
| **A — trust-core** | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-25, AC-26, AC-27 |
| **B — policy-engine** | AC-9, AC-10, AC-19, AC-19a, AC-20, AC-21, AC-21a, AC-22 |
| **C — evidence-producers** | AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17, AC-18 |
| **D — tool-layer-enforcement** | AC-23, AC-23a, AC-23b, AC-23c |
| **E — e2e-integration** | AC-24 (non-goals guard), AC-28, AC-29, AC-30, AC-31, AC-32, AC-33 |

Every acceptance criterion maps to exactly one milestone. (AC-24, the non-goals guard, is verified
in E as a scope-regression check.)

---

## 13. Reuse ledger (extend, do not rebuild)

| Concern | Reused artifact (file:line) | New? |
|---------|-----------------------------|------|
| Envelope + canonical form | `genty/core/src/trust/signing.ts:4-86`, `types.ts:1-8` | reuse |
| Human-approval evidence | `trust/tool-signing.ts:13-55` | reuse |
| Model-decision evidence | `trust/model-signing.ts:4-26` | reuse |
| Delegation | `trust/agent-signing.ts:5-13`, `types.ts:29-33` | reuse |
| Chain verify | `trust/chain.ts:20-55` | reuse |
| Human key gen/rotate | `proven/keys.ts:9-148` | reuse |
| proven bridge | `proven/verify.ts:20-72` | reuse (bridge new) |
| Condition operators | `runtime/policy/engine.ts:22-56`; `governance/engine.ts:32-72` | reuse |
| Engine precedence | `runtime/policy/engine.ts:65-110`; `governance/engine.ts:94-145` | reuse |
| GATE 1 | `tools/src/dispatch.ts:133-188`, `hooks.ts:28-49` | reuse (verifier new) |
| GATE 2 | `core/spawn-runtime-hooks.ts:99-117` | reuse (handler new) |
| GATE 3 | `core/spawn-invocation.ts:86-89,120-124,211-216,249-251` | extend (binding new) |
| genty dispatcher seam | `platform/.../orchestration/effects.ts:561-601` | reuse (verify hook new) |
| genty session model flow | `session.ts:1122-1123,1216,1236,1251`; `types.ts:156-165` | extend |
| Proxy attestation seam | `transport/server.ts:1287-1322,1394-1423,1595-1648`; `config.ts`; `types.ts:15-24` | extend |
| **Policy adapter** | `packages/adapters/policy` (`@a5c-ai/policy-adapter`) | **NEW package** |

The **only** genuinely new module is `@a5c-ai/policy-adapter`. Everything else is an extension or
composition of existing code.
