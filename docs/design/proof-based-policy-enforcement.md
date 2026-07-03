# Proof-Based Policy Enforcement — Design Specification

Status: **Draft 2 (post adversarial security review)** · Date: 2026-07-03 · Owner: Security/Platform
Research input (frozen, read in full before implementing): [`.a5c/processes/proof-policy-enforcement.research.md`](../../.a5c/processes/proof-policy-enforcement.research.md)

> **Revision note (Draft 2).** An adversarial security review (score 62/100) found 5 viable
> attacks against Draft 1. This revision closes every blocking issue with concrete, testable
> acceptance criteria. Stable AC ids are preserved; ACs whose fix changed them are updated in
> place; new criteria are added as **AC-34+**. The five closed issues and their governing ACs:
>
> | # | Blocking issue (Draft 1) | Closed by |
> |---|--------------------------|-----------|
> | 1 | Model-decision cannot bind a specific tool call (attestation replayable to a different tool in the same turn) | **AC-34** (signed `toolCalls[]` with `toolCallId`+`argsHash`), AC-4/§4.1, AC-12/13/15/16, AC-30 |
> | 2 | Trust-root key material unspecified; `verifySignature` trusts caller-supplied keys; cross-kind confusion | **AC-35** (trusted-store resolution + fingerprint binding + kind check), AC-5/6/7/26 |
> | 3 | Trust-root / policy files not integrity-protected against the workspace-writable adversary | **AC-36/AC-37** (out-of-agent root-of-trust signs the config; bootstrap story), threat model, §1.2, AC-26/33 |
> | 4 | "Must-be-signed" invariant is only a build-time lint | **AC-2/AC-8/AC-10** rewritten (runtime `signedFields` completeness assertion at the trust boundary) |
> | 5 | Uncanonicalized regex command matching → alias bypass; global default-allow | **AC-38** (canonicalized argv matcher) + §7 schema + AC-23 (per-env opt-in default-allow) |
>
> Non-blocking review improvements folded in: proxy attestation default for credential-touching
> actions (AC-17/AC-39), trusted out-of-agent credential→scope source (AC-40), quorum distinct-holder
> rule (AC-19/AC-41), argsHash recomputed at GATE 3 (AC-32/AC-23a), `evidenceEnvelopeHashes` covers
> every required step (AC-9/AC-42), proven-bridge derived evidence still evaluates as `human`
> (AC-3/AC-43), and a non-blocking-GATE-2 + passthrough-denial acceptance test (AC-44).

## 0. Summary

Add a cryptographic policy-enforcement layer to the agent-orchestration monorepo so that a
specific command, run with a specific tool and specific credentials, executes **only** when a
declarative policy's required *trust chain of signed evidence* is satisfied. Evidence includes
signed human breakpoint approvals (`PermissionEvidence`), signed model-decision attestations
(`ModelDecision`, e.g. "opus decided to call **this specific** tool call with **these** args"),
and delegation links. When a policy is satisfied, a short-lived **`CommandAuthorization`** envelope
is issued binding the exact tool + tool-call id + command hash + args hash + credential scope +
evidence fingerprints + evidence content hashes + expiry. The tool layer verifies that
authorization at the point of execution and **fails closed** for policy-covered actions.
Fallbacks are forbidden: any error during verification is a denial.

The design **reuses** genty's `SignedEnvelope<T>` + JSON canonical form
(`packages/genty/core/src/trust/`) as the universal proof format, **extends** the two existing
declarative policy engines rather than duplicating them, and adds one new workspace package,
`@a5c-ai/policy-adapter` (`packages/adapters/policy`), that both genty and adapters consume
without a circular dependency.

**Three trust boundaries the reused genty primitives do not enforce on their own — this design
adds them in the policy adapter:**

1. **Tool-call binding.** The reused `ModelResponsePayload` has no field naming the tool call it
   authorized, so a valid attestation is replayable to a *different* tool call in the same turn.
   This design extends the model-decision payload (the one producer where the no-new-schema rule is
   relaxed) with a signed `toolCalls[]` array — each entry `{ toolCallId, name, argsHash }` — and
   binds `CommandAuthorization.toolCallId == attestation.toolCalls[i].toolCallId` with matching
   `argsHash` (AC-34).
2. **Trusted-store key resolution.** Genty's `verifySignature` verifies a signature against a
   **caller-supplied** public key and never checks `sha256(publicKey) == envelope.publicKeyFingerprint`
   or that the key's declared *kind* matches the policy step. The policy adapter wraps it with a
   verifier that resolves key material **only** from the trusted store, selects by
   `(requiredKind, allowedFingerprints)`, binds the fingerprint, and rejects cross-kind (AC-35).
3. **Config integrity.** Trust-roots and policy files live on the workspace, which the in-scope
   adversary (compromised/workspace-writable agent) can edit. This design requires them to be
   signed by an **out-of-agent root of trust**, verified before any root or policy is honored
   (AC-36/AC-37).

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
   **In-scope correction (review issue 3):** although distribution stays file-based, the trust-roots
   file and every policy document **are** integrity-protected by an out-of-agent root-of-trust
   signature (AC-36/AC-37). "File-based config" no longer means "trusted because it is on disk."
5. **Policy authorship UI / TUI.** Policies are YAML/JSON files edited by hand in this iteration.
   Signing them (AC-37) is a mechanical `policy-adapter sign-config` CLI step, not a UI.
6. **Rewriting proven's canonical form immediately.** proven keeps its text canonical form for
   backward-compatible verification; new evidence uses the JSON form with a bridge (§4.3).
7. **Signing the passthrough-proxy path in this iteration** (documented gap, §6.5).

### 1.3 Milestones

| ID | Milestone | Scope |
|----|-----------|-------|
| **A** | trust-core | Unified envelope, evidence taxonomy, identity/key model, `CommandAuthorization` type, trusted-store verifier wrapper, trust-roots config + config-integrity root-of-trust + key ops. |
| **B** | policy-engine | Policy document schema (incl. canonicalized argv matcher + config-signature verification), evaluator, `@a5c-ai/policy-adapter` package, authorization issuance. |
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

**AC-2 (revised — runtime, not lint).** `verifySignature` (`signing.ts:40-56`) is the underlying
signature-check primitive, but it is **never called directly** by a consumer; it is only reached
through the policy adapter's `verifyEnvelopeTrusted` wrapper (AC-35). Verification recomputes the
canonical form from `envelope.payload` and `envelope.signedFields`; a field present on `payload` but
absent from `signedFields` is **not** covered by the signature.

The Draft-1 "documented invariant enforced by a lint/test" is **insufficient** (review issue 4): a
compromised producer can emit an envelope that omits a security-critical field from `signedFields`,
and a build-time lint never runs at the trust boundary. Therefore the **runtime** verifier MUST,
before honoring any envelope, assert `signedFields` completeness for that envelope's declared kind
and **DENY** on any missing field:

- For every evidence/authorization kind, the adapter defines a `REQUIRED_SIGNED_FIELDS[kind]` set.
- `verifyEnvelopeTrusted(envelope, kind)` fails closed unless
  `REQUIRED_SIGNED_FIELDS[kind] ⊆ new Set(envelope.signedFields)` **and** every such field is
  actually present on `envelope.payload`.
- This runs at each gate on the actual envelope being consumed — not once at build time. A missing
  required field is a verification failure (a denial), identical in effect to a bad signature.

Required-field sets (each MUST appear in `signedFields`): see AC-8 (authorization) and AC-10 step 8
(per-evidence). The build-time lint is retained only as defense-in-depth for repo-authored payloads;
it is **not** the enforcement mechanism.

### 3.2 Migration / bridge for proven breakpoint answers

**AC-3 (revised).** A bridge in `@a5c-ai/policy-adapter` converts a legacy `ProvenBreakpointAnswer`
(text-canonical, `proven/sign.ts`) into a `SignedEnvelope<PermissionEvidencePayload>` **without
re-signing the human's intent as the adapter's own**: the bridge verifies the legacy answer via
proven `verifyAnswer` (`proven/verify.ts:20-72`) **against a fingerprint that is a `human` trust
root** (AC-35), and on success emits a *derived* `PermissionEvidence` envelope whose payload records
the original human `publicKeyFingerprint`, `breakpointId`, and `approved`.

**AC-43 (derived evidence still evaluates as `kind:'human'`).** The derived envelope is
*co-signed* by the adapter's bridging identity for storage integrity, but the policy evaluator MUST
NOT treat the bridging (engine) signature as the trust anchor for a `human-approval` step. The
bridge is honored **only if** the recorded `originalHumanFingerprint` is a currently-valid,
non-revoked `human` trust root and the original proven verification passed; the evaluator resolves
the `human-approval` step against `originalHumanFingerprint` (kind `human`), not against the adapter
issuer key. Otherwise a compromised adapter could launder any approval into a "human" one by
re-signing it. The derived-payload MUST carry `{ originalHumanFingerprint, breakpointId, approved,
provenVerified: true }` in `signedFields`.

During the transition, breakpoint producers MAY emit **both** the legacy `.proven.json` and a new
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

Two of three evidence kinds reuse existing genty payload types unchanged. The **model-decision**
kind is the single, deliberate exception to the no-new-schema rule (review issue 1): its reused
`ModelResponsePayload` has no field that names the tool call it authorized, so it cannot bind
"opus decided to call **this** tool call." §4.1a extends it with a signed `toolCalls[]` array.

| Evidence | Payload type | Source | Producer key | Trust-root kind |
|----------|-----------------------|--------|--------------|-----------------|
| **human-approval** | `PermissionEvidencePayload` (`tool-signing.ts:13-20`), reused unchanged: `{action, scope, approvedBy, approvedAt, expiresAt?, conditions?}` | breakpoint answer | human responder key (proven `.keys/private`) | `human` |
| **model-decision** | **`ModelDecisionPayload`** — `ModelResponsePayload` (`model-signing.ts:4-12`) **extended** with signed `toolCalls[]` (§4.1a, AC-34) | transport proxy (authoritative) **or** genty session (in-process) | proxy engine key **or** genty adapter key | `engine` |
| **delegation** | `DelegationChainLink` (`types.ts:29-33`) carried in `AgentRequestPayload.delegationChain` (`agent-signing.ts:12`) | agent | agent identity key | `agent` |

### 4.1a Model-decision payload extension — the tool-call binding (**AC-34**, review issue 1)

**Problem.** Draft 1 reused `ModelResponsePayload` verbatim. That payload carries `modelId`,
`inputMessagesHash`, and `outputContent`, but **no `toolCallId` and no per-call `argsHash`**. A turn
can emit many tool calls (session loop `session.ts:1235` iterates `result.toolCalls`, each a
`NormalizedToolCall` with a distinct `id`). A single valid attestation for the turn therefore
satisfies a policy step for **any** tool call in that turn — an attacker replays the "opus decided"
proof onto a *different*, unapproved call with different args. This is the model-decision-cannot-bind
attack.

**AC-34.** The model-decision producer (proxy at §6.1/6.2, in-process genty at §6.2) signs a
`ModelDecisionPayload` that **extends** `ModelResponsePayload` (this is the one relaxed no-new-schema
exception — flagged; the new type lives in `@a5c-ai/genty-core/trust` next to `model-signing.ts`
so both producers share it) with:

```ts
interface SignedToolCall {
  toolCallId: string;   // the provider/harness tool-call id (NormalizedToolCall.id)
  name: string;         // tool name the model chose
  argsHash: string;     // sha256 of canonical JSON of that call's arguments (deepSortKeys)
}
interface ModelDecisionPayload extends ModelResponsePayload {
  toolCalls: SignedToolCall[];   // EVERY tool call the model emitted this turn, each bound
}
```

`toolCalls` (and its `toolCallId`/`name`/`argsHash` sub-fields) MUST be in `signedFields`
(enforced at runtime by AC-2 / AC-10 step 8). The `argsHash` uses the same canonical hashing helper
as `CommandAuthorization.argsHash` (AC-8) so proxy-side and gate-side hashes are byte-identical.

**AC-34a (binding at issuance and verification).** A model-decision step is satisfied for a given
executing tool call **iff** the attestation contains a `SignedToolCall` whose `toolCallId` equals
the executing tool-call id **and** whose `argsHash` equals the sha256 of the args about to run.
`CommandAuthorization` records that `toolCallId` (AC-8), and every gate asserts
`authorization.toolCallId == executing toolCallId` (AC-10 step 3a). An attestation with no matching
`toolCallId`, or a matching id with a mismatched `argsHash`, is a **denial** — so the same turn's
attestation cannot be replayed to a sibling call. This closes AC-30's replay-within-turn variant.

**AC-5 (revised).** The policy adapter exposes an `Evidence` discriminated union
`{ kind: 'human-approval' | 'model-decision' | 'delegation'; envelope: SignedEnvelope<...> }`
that wraps these three payloads and nothing else in v1. Adding a new evidence kind is a typed,
reviewable change (closed set), not an open string. The `kind` on the `Evidence` wrapper is a
*claim*, not a trust decision: it selects which `requiredKind` the verifier binds against
(AC-35), and the verifier rejects if the resolved trust root's `kind` disagrees. A caller cannot
upgrade an engine-signed envelope to `human-approval` by relabeling the wrapper.

### 4.2 Identity & key model — who holds which key

**AC-6 (revised — trust root carries key material).** Each producer has a distinct key and a
declared trust-root **kind**. A `TrustRoot` record is:

```ts
interface TrustRoot {
  fingerprint: string;                 // sha256 of the SPKI/DER public key
  kind: 'human' | 'engine' | 'agent' | 'tool' | 'config';  // 'config' = out-of-agent config root (AC-36)
  publicKey: string;                   // REQUIRED: the SPKI public key material (PEM or DER-base64)...
  publicKeyPath?: string;              // ...OR a repo-relative path to it (exactly one of the two)
  label: string;
  expiresAt?: string;
  revoked?: boolean;
}
```

Draft 1's `trust-roots.json` carried **no key material** and no rule binding a `requiredKind` to a
specific key, so verification depended on a caller-supplied public key — the review's cross-kind
confusion (an engine key satisfying a human step) and caller-supplied-key attacks. **AC-6 now
requires every root to carry its public key** (inline `publicKey` or `publicKeyPath`, exactly one),
and the verifier (AC-35) resolves material **only** from this store.

Fingerprints are SHA-256 of the SPKI/DER public key, exactly as both existing systems compute them
(`genty signing.ts:9-11`; `proven keys.ts:18`) — the two are interchangeable, so proven-generated
human keys are valid `human` trust roots without re-fingerprinting. The verifier still recomputes
`sha256(resolvedPublicKey)` and rejects if it disagrees with the stored `fingerprint` (AC-35 c),
so a mismatched or swapped key file is caught.

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

**AC-7 (revised).** Trust roots are configured in a single, integrity-protected file (§10, AC-36)
whose entries map fingerprints to kinds **and carry key material** (AC-6). Verification uses trusted
public key material **only** from this config (and the proven `trusted/` directory, re-expressed as
`human` roots); a signature from any fingerprint **not** present as a trust root of the *required*
kind is a verification failure (no implicit trust). The single verification entry point is AC-35's
`verifyEnvelopeTrusted` — no consumer calls genty `verifySignature` / `verifyTrustChain` directly.

**AC-35 (trusted-store verifier wrapper — the core key-resolution rule; review issue 2).** The
policy adapter provides a thin wrapper over genty `verifySignature` / `verifyTrustChain`
(**flagged as new code in `@a5c-ai/policy-adapter`**, because genty's primitives verify against a
caller-supplied key and cannot be safely called directly at a trust boundary):

```ts
verifyEnvelopeTrusted(envelope, requiredKind, allowedFingerprints?): TrustedVerification
```

It MUST, in order, and fail closed (deny) at the first failure:

- **(a) Resolve key material only from the trusted store.** Load the `TrustRoot` for
  `envelope.publicKeyFingerprint` from the (integrity-verified, AC-36) trust-roots config / proven
  `trusted/`. If absent → deny. The envelope's own embedded key, if any, is **ignored**.
- **(b) Select by `(requiredKind, allowedFingerprints)`.** The resolved root's `kind` MUST equal
  `requiredKind`; if the policy step supplied `allowedFingerprints` (or roles that resolve to
  fingerprints), the resolved fingerprint MUST be in that set. Otherwise → deny.
- **(c) Bind fingerprint to material.** Compute `sha256(resolvedPublicKey)` and require it to equal
  `envelope.publicKeyFingerprint`. This is the check genty `verifySignature` omits; without it a
  caller can present material that does not match the claimed fingerprint. Mismatch → deny.
- **(d) Reject cross-kind.** Redundant with (b) but stated explicitly: if the resolved root's kind
  ≠ the step's required kind (e.g. an `engine` root presented for a `human-approval` step) → deny.
  This closes "engine key satisfies a human step."
- **(e) Enforce `signedFields` completeness** for the envelope's kind (AC-2) → deny on any missing
  required field.
- **(f) Check root validity** — not `revoked`, and (for key-expiry-bearing roots) not expired at
  the envelope's `signedAt` (AC-27) → deny otherwise.
- **(g) Only now** call genty `verifySignature(resolvedPublicKey, envelope)` (or `verifyTrustChain`
  for delegation chains, with each link's public key resolved the same way, never taken from the
  link). Any thrown exception anywhere in (a)–(g) is a **denial**, never a pass.

---

## 5. `CommandAuthorization` envelope (Milestone A / B)

**AC-8.** `CommandAuthorizationPayload` (new type in `@a5c-ai/policy-adapter`, signed as
`SignedEnvelope<CommandAuthorizationPayload>` by the issuer key) has exactly these fields, all of
which MUST be in `signedFields`:

```ts
interface CommandAuthorizationPayload {
  policyId: string;            // which policy document granted this
  policyDocHash: string;       // sha256 of the integrity-verified policy doc (AC-36) that granted this
  matchedChainId: string;      // the specific chain that was satisfied (§7)
  toolName: string;            // exact tool identity (e.g. "Bash", MCP tool name)
  toolCallId: string;          // REQUIRED: the exact tool-call id this authorization is bound to (AC-34a)
  commandHash: string;         // sha256 of the canonicalized argv (AC-38), empty-string sentinel if N/A
  argsHash: string;            // sha256 of canonical JSON of the tool input/args (deepSortKeys)
  credentialScope: string;     // opaque scope label the creds are bound to (e.g. "aws:prod:s3-ro")
  evidenceFingerprints: string[]; // fingerprints of every evidence envelope that satisfied the chain
  evidenceEnvelopeHashes: string[]; // sha256 of each satisfying evidence envelope (binds identity AND content)
  evidenceStepBindings: { stepIndex: number; requiredKind: string; envelopeHash: string }[]; // one per REQUIRED step (AC-42)
  runId?: string;
  sessionId?: string;
  issuedAt: string;            // ISO
  expiresAt: string;           // ISO, short-lived (default 120s, per-policy override)
}
```

**All of the above fields MUST appear in `signedFields`** (the runtime completeness assertion of
AC-2 enforces this — `REQUIRED_SIGNED_FIELDS['command-authorization']` is the full field set above).
An authorization missing any field from `signedFields` is denied at every gate.

`commandHash`/`argsHash` are computed with a canonical hashing helper in the policy adapter that
reuses genty's `deepSortKeys` ordering so hashing is stable across producers. `toolCallId` is
mandatory (Draft 1 made it optional "when known") because tool-call binding is now the load-bearing
defense against replay-within-turn (AC-34).

**Issuance rules — AC-9 (revised).** The issuer produces an authorization **iff** the policy engine
(§7) returns `granted` for the requested `{toolName, canonicalArgv, args, credentialScope,
toolCallId}` context; it binds `evidenceFingerprints` + `evidenceEnvelopeHashes` to the *specific*
evidence envelopes consumed (not the fingerprints alone — content hash prevents swapping a different
envelope from the same signer). `expiresAt = issuedAt + policy.authorizationTtl` (default 120s).

**AC-42 (evidence coverage of every required step).** `evidenceStepBindings` MUST contain exactly
one entry per **required** step of the matched chain (including every step of a satisfied
`quorum`), each pinning `{stepIndex, requiredKind, envelopeHash}`. The issuer MUST refuse to issue
(and the evaluator MUST NOT report `granted`) if any required step lacks a bound, verified evidence
envelope. `evidenceEnvelopeHashes` is the multiset of those `envelopeHash` values — so it covers
**every** required step, not merely "the evidence that happened to be present." A gate later
re-verifies each binding (AC-10 step 7), guaranteeing no required step was silently skipped at issue
time. `matchedChainId` and `policyDocHash` are recorded so a gate can confirm the authorization was
issued under the same policy document it is now enforcing.

**Verification rules — AC-10 (revised).** A gate accepts an authorization **iff all** hold, else it
denies:
1. `verifyEnvelopeTrusted(authorization, requiredKind: 'engine', allowedFingerprints: issuerRoots)`
   passes (AC-35) — this subsumes signature check, trusted-store key resolution, fingerprint
   binding, cross-kind rejection, and `signedFields` completeness for the authorization.
2. `now < expiresAt` (not expired) and `now >= issuedAt`.
3. `toolName` equals the tool being executed.
3a. `toolCallId` equals the id of the tool call about to execute (AC-34a binding).
4. `commandHash` equals sha256 of the **canonicalized argv** (AC-38) of the actual command about to
   run — recomputed at this gate, not carried from an earlier gate (empty-sentinel tolerated only
   when the policy for this action declares the tool non-command-bearing).
5. `argsHash` equals sha256 of the actual args about to run, **recomputed at this gate** (TOCTOU
   binding, §11; at GATE 3 this is the last recomputation before exec, AC-23a).
6. `credentialScope` equals the scope of the credentials about to be injected (GATE 3, §9.3), where
   that scope is supplied by the trusted out-of-agent source (AC-40), not by the agent.
7. Every `evidenceStepBindings[i]` re-verifies: the referenced evidence envelope hashes to
   `envelopeHash`, and `verifyEnvelopeTrusted(evidenceEnvelope, requiredKind = binding.requiredKind,
   allowedFingerprints = step.trustedIdentities)` passes against a currently-valid, non-revoked trust
   root (AC-35). For a `model-decision` step, the envelope MUST additionally contain a
   `SignedToolCall` matching this call's `toolCallId` + `argsHash` (AC-34a).
8. **Per-evidence `signedFields` completeness** (AC-2): for each evidence kind, its
   `REQUIRED_SIGNED_FIELDS` set is present in that envelope's `signedFields` — human-approval:
   `{action, scope, approvedBy, approvedAt, expiresAt?}`; model-decision: `{modelId, provider,
   inputMessagesHash, toolCalls}` (incl. each `toolCalls[].toolCallId/name/argsHash`); delegation:
   `{delegatorFingerprint, delegatorSignature, delegatedAt}`. A missing field → deny.
9. `policyDocHash` equals the sha256 of the integrity-verified policy document (AC-36) governing this
   action at the gate, and `matchedChainId` names a chain that still exists in it.

Any exception thrown during steps 1–9 is a **denial**, never a pass (research §Constraints;
CLAUDE.md "fallbacks are evil").

---

## 6. Model-attestation producer strategy (Milestone C)

Two producers emit the **same** `ModelDecision` evidence type (AC-34, `ModelResponsePayload`
extended with signed `toolCalls[]`); both register as `kind:'engine'` trust roots with distinct
fingerprints. Both MUST populate `toolCalls[]` — an attestation with an empty/absent `toolCalls`
cannot satisfy any model-decision step for a tool call (AC-34a).

### 6.1 Authoritative: transport proxy (`@a5c-ai/transport-adapter`)

**AC-11.** The proxy signs `ModelResponse` attestations at the wire seam, using a key held by the
proxy process (outside the agent — the agent cannot forge what model answered). `ProxyConfig`
(`transport/src/types.ts:15-24`, built in `config.ts:11-30`, env in `config.ts:32-43`) is extended
with attestation identity: `attestationEnabled: boolean`, `attestationKeyPath: string`,
`attestationFingerprint: string`, `attestationSidecarDir: string`, read from new
`AGENT_MUX_PROXY_ATTESTATION_*` env vars. The proxy identity key becomes an `engine` trust root.

**AC-12 (non-streaming, revised).** In each route handler (`server.ts` `/v1/messages` 1595-1611,
`/v1/chat/completions` 1613-1629, `/v1/responses` 1631-1648), *after* `trackCompletionOutcome`
(1324-1348) and *before* protocol encoding, when the result is a `CompletionResult` (not a
`Response`), sign a `ModelDecisionPayload` (AC-34) from `{ modelId: config.targetModel, provider:
config.targetProvider, inputMessagesHash, outputContent, toolCalls }` where `toolCalls` is built
from the `CompletionResult.toolCalls[]` (each `{id, name, arguments}`) as
`{ toolCallId: id, name, argsHash: sha256(canonicalize(JSON.parse(arguments))) }`. The `argsHash`
uses the **same** canonical helper as the gate (AC-8) so proxy and gate hashes match byte-for-byte.
`inputMessagesHash` is sha256 over `plan.request.messages` (available at the handler from
`createExecutionPlan`, 369-389). The envelope is **not** injected into the response body (bodies
stay provider-compatible, research §6 delivery-channel caveat) — it is written to the sidecar store
keyed by request id, with a per-`toolCallId` index so the policy component can resolve by tool-call
id (AC-16).

**AC-13 (streaming, revised).** For streamed completions, tool calls finalize only at the terminal
`done` event. `trackCompletionStream` (`server.ts:1287-1322`) — already an async-iterable wrapper —
is extended to accumulate tool-call deltas and, at `event.type === 'done'`, build the per-call
`SignedToolCall[]` (id + name + `argsHash` over the fully-accumulated arguments) and sign the
`ModelDecisionPayload` from those + usage, writing it to the sidecar with the per-`toolCallId` index.
The existing terminal-event points (anthropic ~740, openai-chat ~826, responses ~1008) are where
accumulated calls are complete. Signing MUST happen only after every tool call's arguments are fully
accumulated, so `argsHash` is over the final argument bytes.

**AC-14 (correlation).** An `x-request-id` middleware (~`server.ts:1545`) echoes / mints a request
id. The attestation sidecar entry is keyed by that request id; the same id is returned as a
response header so the harness can thread it forward. Where the engine already carries per-tool-call
metadata (google `thoughtSignature` map, `server.ts:1537`; openai finish-reason accumulation,
`engines/openai.ts:280-288`) that mechanism is the precedent for carrying a per-tool-call
correlation hint. The policy component later resolves attestations by `requestId` (and, when
present, `toolCallId`) from the sidecar store.

### 6.2 In-process: genty session (`@a5c-ai/genty-core`)

**AC-15 (revised).** For the non-proxied genty runtime path, `endpoint.model` (in scope at
`session.ts:1122-1123`) is flowed into `ToolExecutionContext` (`core/src/types.ts:156-165`, extended
with an optional `modelAttestation?: SignedEnvelope<ModelDecisionPayload>` and `modelId?: string`)
and emitted on the `tool_use` event (`session.ts:1236`). The genty adapter signs **one**
`ModelDecisionPayload` per model turn in `runCompletionLoop` (around 1216, where `result.toolCalls`
is known), whose `toolCalls[]` binds **every** call in `result.toolCalls` with `{toolCallId: id,
name, argsHash}` — computed once before the tool loop at `session.ts:1235` iterates. The same signed
envelope is attached to the `ToolExecutionContext` of **each** call in the turn; each gate then
matches its own `toolCallId` against the signed `toolCalls[]` (AC-34a). This producer's fingerprint
is a *different* `engine` trust root, and (per AC-39) is **not** accepted for credential-touching
actions unless the policy explicitly opts out of `requireProxyAttestation`.

### 6.3 Attestation resolution by the policy component

**AC-16 (revised).** The policy adapter resolves a model-decision evidence for a given tool call by
looking it up in the sidecar store (proxy path) **by tool-call id** (the per-`toolCallId` index of
AC-12/13), then by the in-process attestation carried on `ToolExecutionContext` (genty path).
"Falling back" here is **not** a security fallback: resolution returns whichever envelope is present,
and the step still verifies it (§7, AC-35) and requires a `SignedToolCall` matching this call's
`toolCallId` + `argsHash` (AC-34a). If neither source yields an envelope that binds this exact tool
call, the model-decision step is **unsatisfied → deny**. There is no path where a missing or
non-matching attestation is treated as satisfied.

### 6.4 High-assurance: requiring the proxy-signed variant

**AC-17 (revised).** A policy step MAY set `requireProxyAttestation`, which constrains the accepted
model-decision evidence to the **proxy** engine fingerprint(s) only, rejecting the in-process genty
attestation.

**AC-39 (proxy attestation is the DEFAULT for credential-touching actions; label the in-process
variant correlation-grade).** Because the in-process genty attestation is signed by a key **inside**
the agent process, a compromised agent can forge it; it is therefore **correlation-grade only** and
labeled as such in code and docs. For any action whose `match` names a `credentialScope` (i.e. any
action that can cause a scoped credential to be injected, §9.3), `requireProxyAttestation` **defaults
to `true`** and must be *explicitly* set to `false` to accept the in-process attestation. The
default flips the Draft-1 opt-in to an opt-out for exactly the actions that matter. Non-credential
actions keep `requireProxyAttestation: false` as the default. The evaluator MUST reject an
in-process (agent-held-key) attestation for a credential-touching action unless the policy author
explicitly opted out, and that opt-out is recorded in the audit log.

### 6.5 Passthrough-mode gap (documented)

**AC-18.** When the proxy runs in passthrough mode (no `completionEngine`; `proxyUpstream`,
`server.ts:524-554`), request/response bodies are forwarded unparsed, so no attestation is produced.
This is a documented gap for this iteration. Policies that require proxy attestation — explicitly, or
by the AC-39 default for **every credential-touching action** — therefore **deny** on passthrough
(fail-closed, correct); passthrough model calls cannot satisfy a proxy-attestation requirement until
a future iteration adds buffering-based signing. Operators must not route high-assurance actions
through passthrough transports. AC-44 tests this denial.

---

## 7. Policy document schema (Milestone B)

**AC-19.** A policy document is a declarative file (YAML or JSON) with an array of `actions`. Each
action declares matchers and **one or more** required trust-chain templates. Multiple chain shapes
are a core requirement — an action lists alternative chains and is satisfied if **any** chain is
satisfied (OR across chains; AND across a chain's steps).

```yaml
version: 1
authorizationTtlSeconds: 120        # default; per-action override allowed
commandDefaultAllow: false          # AC-38b: default-allow for command-bearing tools is OPT-IN per env
defaultDeny: []                     # credentialScope globs that default-deny when uncovered (§9.4)
actions:
  - id: aws-prod-write
    match:
      tool: "Bash"                  # glob over tool name (reuses dispatch.ts globToRegex, :25-31)
      argv:                         # AC-38: match on CANONICALIZED argv, not a raw regex
        program: "aws"             # resolved binary basename (abs path/symlink resolved to real path)
        subcommandEquals: ["s3 cp", "s3 rm", "s3 sync"]  # normalized subcommand tokens
      credentialScope: "aws:prod:*" # glob over the requested credential scope
    # requireProxyAttestation omitted -> defaults to TRUE here (credentialScope present, AC-39)
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

- **`match`** — `{ tool: glob, argv?: ArgvMatch, credentialScope?: glob }`. Tool glob reuses
  `dispatch.ts` `globToRegex` (25-31). `argv` (AC-38) replaces Draft-1's `command: regex`. An action
  with no `argv` matches non-command tools.
- **`argv` (AC-38 — canonicalized/tokenized command matching; review issue 5).** Draft 1 matched a
  raw command **string** with a regex (`"^aws s3 (cp|rm|sync)\\b"`). That is trivially bypassed:
  `sh -c 'aws s3 rm ...'`, `npx aws ...`, an absolute or symlinked path
  (`/usr/local/bin/aws`, `/tmp/link->aws`), or env indirection (`AWS=aws; $AWS s3 rm`) all fail the
  regex, so the action does **not match**, and an uncovered command-bearing action then
  default-allows — a default-allow bypass. AC-38 requires the matcher to operate on a
  **canonicalized argv**, not the raw string:
  1. Tokenize the command into `argv[]` (respecting the tool's real quoting; for `Bash`, parse the
     command line, and if the program is a shell (`sh`/`bash`/`zsh`) with `-c`, recurse into the
     `-c` payload so the *inner* program is matched, not `sh`).
  2. Resolve `argv[0]` to a **real absolute path** (follow symlinks, apply `PATH`), then take its
     canonical basename as `program`. `program` matching is on the resolved basename, so
     `/usr/local/bin/aws`, a symlink to it, and bare `aws` all canonicalize to `aws`.
  3. Reject/deny (do not silently non-match) when the program cannot be resolved, or when a wrapper
     that defeats canonicalization is detected (e.g. `env`, `xargs`, backticks/`$()` command
     substitution around the program token) for a policy-covered scope — these MUST NOT fall through
     to default-allow; a covered scope with an unresolvable program is treated as a covered-but-
     unauthorized action → deny (AC-38a).
  4. `subcommandEquals` / `subcommandMatches` operate on the **normalized** subcommand tokens
     (`argv[1..]` with flags separated), not the raw string.
- **`commandDefaultAllow` (AC-38b — default-allow becomes opt-in for command-bearing tools).** The
  global default-allow-for-uncovered behavior is **retained only for non-command-bearing tools**.
  For command-bearing tools (any tool that can execute a shell command / carries an `argv`),
  default-allow is **off unless** `commandDefaultAllow: true` is set for the environment. When it is
  `false` (the default), an uncovered command-bearing invocation is **denied**, not passed through.
  This makes the dangerous default (arbitrary uncovered commands) an explicit per-environment opt-in
  rather than the global default, while non-command tools keep default-allow so the world does not
  break (§9, AC-23).
- **`chains[]`** — alternative trust-chain templates (OR). **AC-19a**: an action MUST support ≥2
  chains and the evaluator MUST grant on the first fully-satisfied chain.
- **`steps[]`** — ordered required evidence steps (AND). Each step: `kind` (evidence kind),
  `trustedIdentities` (fingerprints or role labels that resolve to fingerprints via trust roots and
  are passed to `verifyEnvelopeTrusted` as `allowedFingerprints`, AC-35 b), `conditions`.
- **`conditions`** — reuse the existing operator vocabulary from the policy engines
  (`runtime/policy/types.ts:7` and `governance/engine.ts` `matchCondition`:
  `eq/neq/gt/lt/gte/lte/contains/matches`) plus evidence-specific sugar: `modelIdMatches` (regex,
  the "opus decided" allowlist), `scopeEquals`, `notExpired`, `tagContains`. Sugar compiles down to
  the base operators so there is one condition evaluator.
- **`quorum` (AC-41 — distinct-holder rule).** `{ of: kind, min: n }` requires ≥n evidences of that
  kind from **n distinct trust-root fingerprints** — *and*, because one human may hold several keys,
  from **n distinct human identities** (the `responderId`/`approvedBy` behind the fingerprint, not
  merely n distinct fingerprints). A two-human quorum therefore **cannot** be met by one human's two
  keys: the evaluator groups accepted evidences by the underlying identity resolved from the trust
  root and counts distinct identities, not distinct keys. Complements the platform quorum in
  `approvalChains.ts:96-158`.
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

**AC-23 (uniform gate contract, revised).** At every gate, the action is first matched using the
**canonicalized argv** (AC-38), never a raw string. For a **covered** action:
1. Resolve the required evidence (human approval by breakpoint id; model decision **by tool-call id**
   via §6.3, AC-16; delegation from the agent request).
2. Evaluate the policy (§7) against the integrity-verified policy doc (AC-36). If not granted →
   **deny** (fail closed).
3. Obtain / verify the `CommandAuthorization` (§5) with the exact `toolCallId`/`argsHash`/
   `commandHash`(canonicalized argv)/`credentialScope` about to execute, recomputed at this gate. If
   verification fails or throws → **deny**.
4. Only on success does the tool/command/credential proceed.

For an **uncovered** action, coverage-and-default is now split by tool class (AC-38b):
- **Non-command-bearing tool:** pass through unchanged (default-allow), **unless** the action's
  `credentialScope` matches a configured `defaultDeny` glob (§9.4, AC-23c) → deny.
- **Command-bearing tool:** pass through **only if** `commandDefaultAllow: true` for this
  environment; otherwise **deny** (default-deny). An uncovered command that could not even be
  canonicalized (AC-38a) under a covered scope is denied regardless.
Any error in steps 1–3, or any argv-canonicalization failure for a covered scope, is a denial, never
a fallback-allow.

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
about to be injected is tagged with a `credentialScope` (AC-40). Before injection, GATE 3 requires a
valid `CommandAuthorization` whose `credentialScope` matches; **no valid authorization → the scoped
credential is not injected** (it is dropped from the env map, and if the policy marks it required,
the spawn is denied). GATE 3 is the **last** point before exec, so it **recomputes** `argsHash` and
`commandHash` (canonicalized argv, AC-38) from the exact command/args being spawned and re-checks
them against the authorization (AC-10 steps 4/5) — the hashes are never carried forward from GATE 1.
This is the backstop against alternate execution paths (§11): even if a gate is bypassed,
unauthorized scoped creds never reach the process, and a command mutated between GATE 1 and exec
fails the recomputed-hash check here.

**AC-40 (trusted, out-of-agent credential→scope source).** The mapping from an actual credential to
its `credentialScope` tag MUST come from a source **outside the agent process** — the same
orchestrator/proxy trust domain that holds the issuer/config keys (e.g. a credential-broker config
signed by the config root, or KMS/secret-store metadata). The agent process MUST NOT be able to
assert "these creds are scope `aws:prod:s3-ro`" for creds that are actually broader. GATE 3 reads
the scope tag from this trusted source keyed by the credential's identity, not from any
agent-supplied hint. If the trusted source has no scope for a credential that a policy marks scoped,
GATE 3 denies (fail closed) rather than injecting an untagged credential.

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

**AC-26 (revised — trust-roots config format, location & signature).** Trust roots live in a single
git-tracked file `.policy/trust-roots.json` at repo root (public material only), an array of
`TrustRoot` records (§4.2, each now carrying key material per AC-6) plus a `revoked` list. Policy
documents live under `.policy/policies/*.yaml`. Private keys are **never** git-tracked: human private
keys stay under `.breakpoints/.keys/private/` (gitignored, existing proven layout); engine/issuer
private keys under `.policy/.keys/private/` (added to `.gitignore`). Public keys are git-tracked
(`trusted/` + `trust-roots.json`).

Both `.policy/trust-roots.json` and every `.policy/policies/*.yaml` are accompanied by a detached
signature file `<name>.sig.json` (a `SignedEnvelope` over the sha256 of the file's canonical bytes),
signed by the **out-of-agent config root-of-trust** (AC-36). Git-tracking a file does **not** make
it trusted; the signature does.

### 10.1 Config integrity — the out-of-agent root of trust (**AC-36/AC-37**, review issue 3)

**Threat being closed.** The threat model puts a compromised / workspace-writable agent in scope
(§11 AC-33). Draft 1's trust-roots and policy files were merely git-tracked JSON/YAML on that same
workspace, so such an agent could **add its own fingerprint as a `human` root, relax an `argv`
matcher, or widen a `credentialScope` glob, then self-authorize.** No signature check stopped it.

**AC-36 (config root-of-trust; files signed, verified before honoring).** There is a distinguished
**config root-of-trust** key whose private half is held **outside every agent process** — the same
place the transport proxy / issuer keys live (the orchestrator/proxy host, or a hardware token / KMS
in production), never on the agent-writable workspace and never under any path an agent step can
write. Its public half is pinned as a `kind:'config'` root. Every gate and the evaluator MUST, before
honoring **any** trust root or policy document:
1. Load `<file>.sig.json` and verify it via `verifyEnvelopeTrusted(sig, requiredKind:'config',
   allowedFingerprints: [pinnedConfigRootFp])` (AC-35) against the pinned config-root fingerprint.
2. Recompute sha256 of the file's canonical bytes and require it to equal the hash in the signed
   payload. Mismatch, missing signature, or wrong signer → **deny all** (fail closed): if the config
   itself is untrusted, no action is authorized. `CommandAuthorization.policyDocHash` (AC-8) is this
   same hash, so a gate confirms it enforced the exact signed document under which the authorization
   was issued.

Because the signing key is off the workspace, an in-scope compromised agent can edit the files but
**cannot produce a valid signature** for the edit; the tampered config is rejected. This is the
integrity guarantee Draft 1 lacked. (Alternative considered and rejected for this iteration: placing
the files on a read-only path the agent cannot write. Signing is preferred because it survives the
files being copied, distributed, or served over git, and does not depend on per-deployment mount
permissions.)

**AC-37 (bootstrap / root-of-trust provisioning).** The top of the trust hierarchy is provisioned
out-of-band, once, before any agent runs, and its story is:
- The config root-of-trust keypair is generated on the operator's trusted host (or KMS/HSM) via
  `policy-adapter init-config-root` (**flagged new CLI in `@a5c-ai/policy-adapter`**). The private
  half is stored where agents cannot read it (proxy/orchestrator host secret store, KMS, or token);
  the public half's fingerprint is **pinned in code/deploy config** (`POLICY_CONFIG_ROOT_FP` env /
  a committed `pinned-config-root.json` that is itself part of the deploy image, not the workspace),
  so the pin cannot be swapped by editing a workspace file.
- Signing a config change is an explicit operator step: `policy-adapter sign-config <file>` runs on
  the trusted host and emits `<file>.sig.json`. Agents never hold this key, so agents cannot sign
  config.
- The config root signs (directly or via a short intermediate) the initial `trust-roots.json`, which
  in turn names the `human`/`engine`/`agent` roots. Revocation of the config root itself is a deploy
  operation (rotate the pin), out of scope for online revocation (§1.2 non-goal 4).
- **Chain summary:** pinned config root (off-workspace) → signs `trust-roots.json` + policy docs →
  those name the evidence-signing roots → evidence chains authorize commands. Every link is verified
  by `verifyEnvelopeTrusted`; the only link anchored by a code/deploy pin (not a file) is the config
  root, which is what makes the whole tree resistant to the workspace-writable adversary.

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
- **AC-30 — Model downgrade + attestation replay within a turn** (sonnet decides, claims opus; or a
  valid opus attestation for call A is replayed onto sibling call B in the same turn). Defense:
  model-decision evidence covers `modelId` + `inputMessagesHash` **and** a signed `toolCalls[]`
  binding each `toolCallId` to its `argsHash` (AC-34), signed by the **proxy engine key held outside
  the agent** (§6.1); the agent cannot forge which model answered nor which call it authorized. The
  gate requires a `SignedToolCall` matching the executing `toolCallId`+`argsHash` (AC-34a), so a
  turn's attestation is not replayable to a different call. `modelIdMatches: "claude-opus-.*"` plus
  `requireProxyAttestation` (defaulting to true for credential-touching actions, AC-39).
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
  still cannot obtain production credentials. The credential→scope tag itself comes from the trusted
  out-of-agent source (AC-40), so the agent cannot relabel broad creds as a narrow scope to dodge a
  policy.
- **AC-45 — Config / policy tampering by a compromised agent** (adds its own trust root, relaxes an
  `argv` matcher, widens a `credentialScope`, then self-authorizes). Defense: `.policy/trust-roots.json`
  and every policy doc are signed by the **out-of-agent config root** (AC-36) whose fingerprint is
  pinned in deploy config, not on the workspace; every gate verifies the config signature before
  honoring any root or policy and denies-all on mismatch. The agent can edit the files but cannot
  produce a valid signature (AC-37), so tampered config is rejected. `CommandAuthorization.policyDocHash`
  ties each authorization to the exact signed policy doc.
- **AC-44 — Non-blocking-GATE-2 coverage + passthrough denial (acceptance test).** Two fail-closed
  behaviors that Draft 1 asserted but did not test: (i) for a **non-blocking** GATE-2 adapter
  (`mode !== 'blocking'`, §9.2), GATE 2 cannot hard-enforce, so the test asserts that GATE 1 and/or
  GATE 3 still deny a covered-but-unauthorized call — i.e. the overall system is fail-closed even
  when GATE 2 is advisory. (ii) A model call routed through **passthrough proxy mode** (no
  `completionEngine`, §6.5) produces no attestation, so an action requiring proxy attestation (incl.
  any credential-touching action defaulting to it, AC-39) MUST be **denied** on that path. AC-44 is
  the explicit acceptance test for both.

---

## 12. Acceptance-criteria → milestone map

| Milestone | Acceptance criteria |
|-----------|---------------------|
| **A — trust-core** | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-25, AC-26, AC-27, **AC-34** (model-decision payload extension type), **AC-35** (trusted-store verifier wrapper), **AC-36** (config-integrity verification), **AC-37** (root-of-trust bootstrap), **AC-43** (proven bridge → human) |
| **B — policy-engine** | AC-9, AC-10, AC-19, AC-19a, AC-20, AC-21, AC-21a, AC-22, **AC-38** (canonicalized argv matcher), **AC-38a**, **AC-38b** (command default-allow opt-in), **AC-41** (quorum distinct-holder), **AC-42** (evidence covers every step) |
| **C — evidence-producers** | AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17, AC-18, **AC-34a** (tool-call binding at produce/verify), **AC-39** (proxy-attestation default for credential actions) |
| **D — tool-layer-enforcement** | AC-23, AC-23a, AC-23b, AC-23c, **AC-40** (trusted credential→scope source) |
| **E — e2e-integration** | AC-24 (non-goals guard), AC-28, AC-29, AC-30, AC-31, AC-32, AC-33, **AC-44** (non-blocking-GATE-2 + passthrough-denial test), **AC-45** (config-tampering threat) |

Every acceptance criterion maps to exactly one milestone. (AC-24, the non-goals guard, is verified
in E as a scope-regression check.) New ACs from the Draft-2 security revision are assigned as above:
type/verifier/config-integrity work lands in A, schema/evaluator work in B, producer binding in C,
credential-scope sourcing in D, and the new threat/behavior tests in E.

---

## 13. Reuse ledger (extend, do not rebuild)

| Concern | Reused artifact (file:line) | New? |
|---------|-----------------------------|------|
| Envelope + canonical form | `genty/core/src/trust/signing.ts:4-86`, `types.ts:1-8` | reuse |
| Human-approval evidence | `trust/tool-signing.ts:13-55` | reuse |
| Model-decision evidence (base) | `trust/model-signing.ts:4-26` | reuse |
| **Model-decision payload extension** (`ModelDecisionPayload` + `SignedToolCall`, AC-34) | new type beside `trust/model-signing.ts` in genty-core | **NEW type** (only relaxed no-new-schema exception) |
| Delegation | `trust/agent-signing.ts:5-13`, `types.ts:29-33` | reuse |
| Chain verify (raw) | `trust/chain.ts:20-55` | reuse (never called directly, see wrapper) |
| **Trusted-store verifier wrapper** (`verifyEnvelopeTrusted`, AC-35) | `@a5c-ai/policy-adapter` | **NEW code** (wraps genty verify; adds fingerprint-binding + kind + trusted-store resolution) |
| **Config-integrity verification + signing CLI** (AC-36/AC-37) | `@a5c-ai/policy-adapter` (`init-config-root`, `sign-config`, gate-side `verifyConfigSignature`) | **NEW code** |
| **Canonicalized argv matcher** (AC-38) | `@a5c-ai/policy-adapter` | **NEW code** (tokenize + resolve program + normalize subcommand) |
| **Trusted credential→scope source** (AC-40) | out-of-agent broker/KMS metadata; adapter reads it at GATE 3 | **NEW integration** |
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

The **only** genuinely new *package* is `@a5c-ai/policy-adapter`. Everything else is an extension or
composition of existing code, with two flagged exceptions the Draft-2 security revision requires:
(1) a **new type** `ModelDecisionPayload`/`SignedToolCall` added beside `trust/model-signing.ts` in
`@a5c-ai/genty-core` — the single, deliberate relaxation of the no-new-schema rule, needed to bind a
model decision to a specific tool call (AC-34); and (2) **new security-critical code inside**
`@a5c-ai/policy-adapter` — the `verifyEnvelopeTrusted` trusted-store wrapper (AC-35), the
config-integrity verify/sign path (AC-36/AC-37), and the canonicalized-argv matcher (AC-38) — which
are extensions of, not forks of, existing genty/proven primitives. No third policy engine is created
(AC-22); the two existing engines delegate trust-chain steps to the adapter.
