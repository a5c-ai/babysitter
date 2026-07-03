# Proof-Based Policy Enforcement — Design Specification

Status: **Draft 3 (post second adversarial security review)** · Date: 2026-07-03 · Owner: Security/Platform
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

> **Revision note (Draft 3).** A **second** adversarial security review (score 74/100) confirmed the
> five Draft-1 attacks are closed but found **3 residual blocking attacks** against Draft 2. This
> revision closes each precisely and completely, preserving every previously-closed AC. Stable AC ids
> are preserved; ACs whose fix changed are updated in place; new criteria are added as **AC-46+**.
> The three residual blocking issues and their governing ACs:
>
> | # | Residual blocking issue (Draft 2) | Closed by |
> |---|-----------------------------------|-----------|
> | 6 | **Config rollback / downgrade.** AC-36/37 sign `sha256(file bytes)` with no version/counter, so an older validly-signed, more-permissive `trust-roots + policy` set (incl. an older revocation list — un-revoking stolen keys) can be swapped back in. | **AC-46** (signed config **manifest** with a monotonic `configEpoch` covering ALL config files together), **AC-47** (off-workspace minimum-epoch floor pinned beside `POLICY_CONFIG_ROOT_FP`; every gate rejects `configEpoch < floor`), AC-27/AC-36/AC-37/AC-45 revised |
> | 7 | **Proven-bridge unsigned `approved` bit.** `proven/verify.ts:60` rebuilds the signing payload from attacker-supplied `provenAnswer.signedFields` and never requires `approved` to be signed; the bridge then trusts `payload.approved` and mints "human" evidence. | **AC-48** (bridge asserts legacy `signedFields ⊇ {breakpointId, approved, responderId}` — the AC-2 completeness rule applied to the legacy proven answer — BEFORE deriving evidence; else deny), AC-3/AC-43 revised |
> | 8 | **GATE 3 backstop scope.** GATE 3 only mediates scoped-credential ENV-VAR injection, so (i) policy-covered non-credential actions have no backstop when GATE 2 is advisory and GATE 1 is bypassed, and (ii) file/mount/IMDS-delivered credentials evade the env gate. | **AC-49** (GATE 1 + genty dispatcher/session seam declared LOAD-BEARING, un-bypassable for ALL covered actions; execution-path enumeration acceptance test), **AC-50** (GATE 3 extended to non-env credential channels `spawn-invocation.ts` controls — docker `-v`, k8s secrets — with an explicit bounded non-goal + warning for channels it cannot mediate, e.g. IMDS), AC-23a/AC-33/AC-40/AC-44 revised |
>
> Additional review items folded in cheaply (Draft 3): **domain separation** — a bound
> `payloadType` constant is added to every payload and to `signedFields` so a signature is
> non-transferable across evidence kinds (**AC-51**); **one canonical argv/args serialization** shared
> byte-for-byte by proxy and every gate, with a conformance test (**AC-52**, closes argsHash
> divergence); **argv wrapper allowlist** — the wrapper handling of AC-38 becomes an allowlist of
> recognized programs per covered scope rather than a denylist (**AC-38c**); **heterogeneous quorum
> composition** — how `quorum` composes with typed `steps[]` so "human+opus AND 2-human-quorum" is one
> chain (**AC-41a**); and **collision-resistant credential identity** for AC-40 scope keying with
> deny-on-ambiguous (**AC-40a**).

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
3. **Config integrity + rollback resistance.** Trust-roots and policy files live on the workspace,
   which the in-scope adversary (compromised/workspace-writable agent) can edit. This design requires
   them to be signed by an **out-of-agent root of trust**, verified before any root or policy is
   honored (AC-36/AC-37). Draft 3 adds that the config root signs **one manifest** covering **all**
   config files together, carrying a **monotonic `configEpoch`** integer; every gate rejects any
   config whose epoch is below an off-workspace pinned floor (`POLICY_CONFIG_MIN_EPOCH`), so an older
   validly-signed, more-permissive config set — including an older revocation list — cannot be rolled
   back in (AC-46/AC-47).

**Two cross-cutting hardening rules Draft 3 makes explicit, because the reused primitives do not
provide them:**

4. **Domain separation.** Genty's `canonicalize` binds `signedFields` but no payload-type tag, so a
   signature over one payload kind is byte-identical to (and thus transferable to) a structurally
   compatible payload of a *different* kind. Every payload in this design carries a bound
   `payloadType` constant that MUST be in `signedFields`; the verifier binds the expected
   `payloadType` per kind and denies on mismatch (AC-51).

5. **One canonical serialization for argv and args.** Proxy-side and every gate-side `argsHash` /
   `commandHash` MUST be produced by a **single, total, loss-preserving** canonicalizer exported from
   the policy adapter, so hashes are byte-identical across producers and consumers; a conformance
   test pins this (AC-52).

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
   backward-compatible verification; new evidence uses the JSON form with a bridge (§4.3). **Draft-3
   note:** the load-bearing defense against a proven answer with a stripped `signedFields` is the
   bridge-side AC-48 completeness assertion at the trust boundary; hardening `proven/verify.ts:60`
   itself to reject an under-specified `signedFields` is desirable defense-in-depth but is a
   follow-up, not required for the guarantee.
7. **Signing the passthrough-proxy path in this iteration** (documented gap, §6.5).
8. **Gating substrate-delivered credentials** (cloud instance metadata / IMDS / IRSA /
   workload-identity, credentials in a container image, pre-existing files on a mount the agent
   already controls, secret endpoints the process calls itself). `spawn-invocation.ts` does not
   construct these deliveries, so GATE 3 cannot see or gate them (AC-50). This is a **bounded,
   warned** non-goal: the evaluator emits an audit-logged warning and refuses to claim a GATE-3
   backstop for any scoped action whose credential would arrive by such a channel; mitigation is a
   substrate control (no broad instance role for agent pods, minimal images, egress policy).

### 1.3 Milestones

| ID | Milestone | Scope |
|----|-----------|-------|
| **A** | trust-core | Unified envelope (with bound `payloadType`), evidence taxonomy, identity/key model, `CommandAuthorization` type, trusted-store verifier wrapper, trust-roots config + config-integrity root-of-trust + monotonic-epoch config manifest + off-workspace epoch floor + key ops. |
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

**AC-51 (domain separation — bound `payloadType`).** Genty's `canonicalize` (`signing.ts:65-68`)
binds `signedFields` and `_meta` but **no payload-type tag**, so a signature over payload kind X is
byte-identical to a signature over a structurally compatible payload of kind Y — an
`engine`-signed `ModelDecisionPayload` whose field shape overlaps another engine-signed type could be
presented for the wrong step. To make signatures **non-transferable across payload types**, every
payload type in this design carries a constant discriminant field
`payloadType: 'human-approval' | 'model-decision' | 'delegation' | 'command-authorization' |
'config-manifest'`, and `payloadType` MUST be a member of `REQUIRED_SIGNED_FIELDS[kind]` for **every**
kind (so it is always inside the signature, per AC-2). `verifyEnvelopeTrusted(envelope, kind, ...)`
takes the expected `payloadType` for that kind and denies unless `envelope.payload.payloadType`
equals it **and** `payloadType ∈ signedFields`. This is a bound constant, not caller-supplied trust
(the wrapper `kind` claim is checked against the trust root's kind per AC-5/AC-35 as before);
`payloadType` closes the *cross-payload-type* transfer that the `kind`/trust-root check alone does
not (two different payload types can both be `engine`-signed).

**AC-52 (one total, loss-preserving canonical argv/args serialization — closes argsHash divergence).**
`argsHash` and `commandHash` are computed in at least three places — the proxy producer (AC-12/13),
GATE 1 (§9.1), and GATE 3 (§9.3, the last recomputation before exec) — and any byte-level divergence
between producer and consumer silently breaks the binding (a mismatch denies a legitimate call, or,
worse, a lossy normalization lets two different arg objects collide). This design therefore mandates
**one** canonicalizer, `canonicalizeArgs(value): string` and `canonicalizeArgv(command): string[]`,
exported from `@a5c-ai/policy-adapter` and imported by **every** producer and gate (the proxy imports
it too — it is a leaf util with no adapter-runtime dependency). It MUST be:
- **Total** — defined for every JSON-representable args value; it never throws on well-formed input
  and has an explicit deny-path for input it cannot represent (e.g. non-finite numbers), never a
  silent coercion.
- **Loss-preserving** — it does not drop, reorder-collide, or fold distinct inputs to the same bytes
  (it builds on genty `deepSortKeys` for object-key ordering but preserves array order, string bytes,
  and value types; it does not lowercase, trim, or unicode-fold). `argsHash = sha256(canonicalizeArgs(args))`.
- **Shared byte-for-byte** — the proxy-side and every gate-side hash are produced by the identical
  function. **AC-52a (conformance test):** an acceptance test feeds a fixed corpus of args/argv
  fixtures through the proxy path and each gate path and asserts the resulting `argsHash`/`commandHash`
  are byte-identical, and that two distinct fixtures never collide. A hash produced by any code path
  that does **not** route through `canonicalizeArgs`/`canonicalizeArgv` is a design violation caught
  by this test.

### 3.2 Migration / bridge for proven breakpoint answers

**AC-3 (revised — Draft 3).** A bridge in `@a5c-ai/policy-adapter` converts a legacy
`ProvenBreakpointAnswer` (text-canonical, `proven/sign.ts`) into a
`SignedEnvelope<PermissionEvidencePayload>` **without re-signing the human's intent as the adapter's
own**: the bridge verifies the legacy answer via proven `verifyAnswer` (`proven/verify.ts:20-72`)
**against a fingerprint that is a `human` trust root** (AC-35), **passes the AC-48 legacy-completeness
assertion**, and only on success emits a *derived* `PermissionEvidence` envelope whose payload records
the original human `publicKeyFingerprint`, `breakpointId`, and `approved`.

**AC-48 (proven-bridge legacy `signedFields` completeness — closes residual issue 7).** `verifyAnswer`
(`proven/verify.ts:60`) rebuilds the signing payload from the **attacker-supplied**
`provenAnswer.signedFields` (`buildSigningPayload(provenAnswer, provenAnswer.signedFields)`) and
imposes **no** requirement that `approved` — or any security-critical field — actually appears in the
signed set. An attacker with any single validly-signed proven answer from a `human` key (e.g. a
signed *rejection*, or an answer signed over only `{id, text}`) can present a forged
`ProvenBreakpointAnswer` that sets `approved: true`, `breakpointId: <target>` as **unsigned** payload
fields while listing a `signedFields` that omits them; `verifyAnswer` returns `valid: true` because
the signature covers only the fields the attacker chose to include, and the Draft-2 bridge then reads
`provenAnswer.approved` and mints "human approved" evidence. This is the same class of hole AC-2
closed for the new-form envelopes, but it was **not** applied to the legacy proven answer inside the
bridge.

The bridge MUST, **before deriving any evidence**, apply the AC-2 completeness rule to the legacy
answer and fail closed (deny, no evidence emitted) unless **all** hold:

- `{ breakpointId, approved, responderId } ⊆ new Set(provenAnswer.signedFields)` — i.e. `approved`
  and the identity/target-binding fields were **actually within the human-signed set**. (The
  canonical proven signer signs all three today, `proven/sign.ts:9-17`; a legitimate answer therefore
  passes, a stripped-`signedFields` forgery does not.)
- Each of those fields is **present** on `provenAnswer` (a `signedFields` entry naming an absent field
  is treated as missing → deny), mirroring AC-2's "present on payload" clause.
- Only then does the bridge trust `provenAnswer.approved`; and it derives evidence **only when
  `approved === true`** (a signed rejection never yields an approval envelope).

Any exception in this check is a denial. This assertion runs at the bridge (the trust boundary),
not as a proven-side lint, so a compromised producer emitting a stripped-`signedFields` answer is
rejected at consumption. (Hardening `proven/verify.ts` itself to reject an under-specified
`signedFields` is desirable defense-in-depth and noted in §1.2 non-goal 6's follow-up, but the
**load-bearing** check is AC-48 in the bridge, because the bridge is where the `approved` bit is
promoted to human evidence.)

**AC-43 (derived evidence still evaluates as `kind:'human'`).** The derived envelope is
*co-signed* by the adapter's bridging identity for storage integrity, but the policy evaluator MUST
NOT treat the bridging (engine) signature as the trust anchor for a `human-approval` step. The
bridge is honored **only if** the recorded `originalHumanFingerprint` is a currently-valid,
non-revoked `human` trust root, the original proven verification passed, **and the AC-48
legacy-completeness assertion passed**; the evaluator resolves the `human-approval` step against
`originalHumanFingerprint` (kind `human`), not against the adapter issuer key. Otherwise a
compromised adapter could launder any approval into a "human" one by re-signing it. The
derived-payload MUST carry `{ payloadType: 'human-approval', originalHumanFingerprint, breakpointId,
approved, provenVerified: true }` in `signedFields` (AC-51 binds `payloadType`).

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
| **human-approval** | `PermissionEvidencePayload` (`tool-signing.ts:13-20`), reused with a bound `payloadType:'human-approval'` added (AC-51): `{payloadType, action, scope, approvedBy, approvedAt, expiresAt?, conditions?}` | breakpoint answer | human responder key (proven `.keys/private`) | `human` |
| **model-decision** | **`ModelDecisionPayload`** — `ModelResponsePayload` (`model-signing.ts:4-12`) **extended** with `payloadType:'model-decision'` + signed `toolCalls[]` (§4.1a, AC-34/AC-51) | transport proxy (authoritative) **or** genty session (in-process) | proxy engine key **or** genty adapter key | `engine` |
| **delegation** | `DelegationChainLink` (`types.ts:29-33`) carried in `AgentRequestPayload.delegationChain` (`agent-signing.ts:12`), with a bound `payloadType:'delegation'` (AC-51) | agent | agent identity key | `agent` |

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
  payloadType: 'model-decision'; // AC-51 domain-separation constant, MUST be in signedFields
  toolCalls: SignedToolCall[];   // EVERY tool call the model emitted this turn, each bound
}
```

`payloadType`, `toolCalls` (and its `toolCallId`/`name`/`argsHash` sub-fields) MUST be in
`signedFields` (enforced at runtime by AC-2 / AC-10 step 8 and AC-51). The `argsHash` is computed by
the shared `canonicalizeArgs` (AC-52) — the **same** helper as `CommandAuthorization.argsHash`
(AC-8) — so proxy-side and gate-side hashes are byte-identical.

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
- **(e) Enforce `signedFields` completeness + bound `payloadType`** for the envelope's kind (AC-2,
  AC-51) → deny on any missing required field, or if `payload.payloadType` is absent from
  `signedFields` or does not equal the expected constant for `requiredKind`.
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
  payloadType: 'command-authorization'; // AC-51 domain-separation constant, MUST be in signedFields
  policyId: string;            // which policy document granted this
  policyDocHash: string;       // sha256 of the integrity-verified policy doc (AC-36) that granted this
  configEpoch: number;         // AC-46: monotonic config epoch under which this authorization was issued
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

`commandHash`/`argsHash` are computed with the **single shared** `canonicalizeArgv`/`canonicalizeArgs`
helper (AC-52), which builds on genty's `deepSortKeys` ordering so hashing is byte-identical across
the proxy producer and every gate. `toolCallId` is mandatory (Draft 1 made it optional "when known")
because tool-call binding is now the load-bearing defense against replay-within-turn (AC-34).
`payloadType` (AC-51) and `configEpoch` (AC-46) are part of the authorization's signed field set.

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
8. **Per-evidence `signedFields` completeness** (AC-2) **and bound `payloadType`** (AC-51): for each
   evidence kind, its `REQUIRED_SIGNED_FIELDS` set is present in that envelope's `signedFields` and
   `payload.payloadType` equals the expected constant — human-approval: `{payloadType:'human-approval',
   action, scope, approvedBy, approvedAt, expiresAt?}`; model-decision: `{payloadType:'model-decision',
   modelId, provider, inputMessagesHash, toolCalls}` (incl. each `toolCalls[].toolCallId/name/argsHash`);
   delegation: `{payloadType:'delegation', delegatorFingerprint, delegatorSignature, delegatedAt}`. A
   missing field or wrong `payloadType` → deny.
9. `policyDocHash` equals the sha256 of the integrity-verified policy document (AC-36) governing this
   action at the gate, and `matchedChainId` names a chain that still exists in it.
10. **`configEpoch` floor** (AC-46/AC-47): `authorization.configEpoch` equals the `configEpoch` of the
    currently-honored config manifest at this gate **and** `authorization.configEpoch >=` the
    off-workspace pinned `POLICY_CONFIG_MIN_EPOCH` floor. A stale authorization issued under a
    rolled-back or below-floor epoch → deny.

Any exception thrown during steps 1–10 is a **denial**, never a pass (research §Constraints;
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
     that defeats canonicalization is detected for a policy-covered scope — these MUST NOT fall
     through to default-allow; a covered scope with an unresolvable program is treated as a
     covered-but-unauthorized action → deny (AC-38a).
  4. `subcommandEquals` / `subcommandMatches` operate on the **normalized** subcommand tokens
     (`argv[1..]` with flags separated), not the raw string.
- **`argv` wrapper handling (AC-38c — allowlist, not denylist).** Draft 2 said to *detect* a
  denylist of defeating wrappers (`env`, `xargs`, `$()`, ...). A denylist is unbounded — the next
  unlisted wrapper (`nice`, `stdbuf`, `time`, `nohup`, `setsid`, `doas`, a shell builtin, an unknown
  launcher) slips through. Draft 3 inverts it: for a **policy-covered scope**, canonicalization
  **succeeds only if every leading token is on an allowlist of recognized, transparent wrappers**
  declared **per covered scope** (e.g. a scope may permit `sudo -u <user>` or `time` and recurse
  through them to the real program), and the finally-resolved program is a recognized program for
  that scope. Any leading token **not** on the scope's wrapper allowlist — or any construct that
  breaks static resolution (command substitution `$()`/backticks, variable-indirect program
  `$PROG`, `eval`, piping the program name in) — makes the program **unresolvable → deny** (AC-38a),
  never default-allow. The allowlist is closed and reviewable; adding a wrapper is a policy edit
  signed into the config manifest (AC-46), not an open bypass surface.
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
- **`quorum` composition with heterogeneous `steps[]` (AC-41a).** Draft 2 left it ambiguous whether a
  chain could mix ordered typed steps *and* a quorum (so "human+opus AND 2-human-quorum" needed two
  separate chains, which changes the semantics from AND to OR). Draft 3 makes a chain a list of
  **requirements** evaluated with **AND**, where each requirement is one of:
  `{ step: {kind, trustedIdentities, conditions} }` (a single typed step) **or**
  `{ quorum: {of, min, trustedIdentities?, conditions?} }` (a distinct-holder quorum, AC-41). A chain
  is satisfied iff **every** requirement is satisfied (AND), and grant is on the first fully-satisfied
  chain (AC-19a). This lets one chain express `human-approval(alice) AND model-decision(opus) AND
  quorum(human-approval, min:2)` as three AND-ed requirements. `evidenceStepBindings` (AC-42) records
  one binding per satisfied requirement — for a quorum requirement, one binding **per contributing
  evidence** (min entries), each pinning its `{stepIndex, requiredKind, envelopeHash}`; the issuer
  refuses to issue if any requirement (or any of a quorum's `min` contributors) lacks a bound, verified
  envelope. The legacy top-level `quorum:` form in the §7 example remains valid sugar for a
  single-requirement chain. An evidence envelope MUST NOT be counted toward more than one requirement
  in the same chain (no double-use across a typed step and a quorum).
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

**AC-23a (revised — Draft 3 — credential binding across ALL delivery channels).** Credentials
currently flow with no gate through **multiple** channels that `spawn-invocation.ts` controls, not
env vars alone: docker `-e K=V` (86-89) **and** docker `-v` mounts (79, 81); ssh `K=V` prefix
(120-124); k8s exec `env K=V` (211-216); k8s ephemeral `--env=K=V` (249-251) and
`--serviceaccount=`/secret references (239). A credential about to be delivered by **any** of these
channels is tagged with a `credentialScope` from the trusted out-of-agent source (AC-40/AC-40a).
Before delivery, GATE 3 requires a valid `CommandAuthorization` whose `credentialScope` matches;
**no valid authorization → the scoped credential is not delivered** by that channel (env var dropped,
`-v` mount omitted, secret/serviceaccount reference stripped), and if the policy marks it required,
the spawn is denied. GATE 3 is the **last** point before exec, so it **recomputes** `argsHash` and
`commandHash` (shared canonicalizer, AC-52 / AC-38) from the exact command/args being spawned and
re-checks them against the authorization (AC-10 steps 4/5) — the hashes are never carried forward
from GATE 1. This is a backstop for the credential-delivery surface; the **load-bearing**
enforcement for every covered action (credential-bearing or not) is AC-49. AC-50 defines exactly
which credential channels GATE 3 mediates and which are a bounded, warned non-goal.

**AC-40 (trusted, out-of-agent credential→scope source).** The mapping from an actual credential to
its `credentialScope` tag MUST come from a source **outside the agent process** — the same
orchestrator/proxy trust domain that holds the issuer/config keys (e.g. a credential-broker config
signed by the config root, or KMS/secret-store metadata). The agent process MUST NOT be able to
assert "these creds are scope `aws:prod:s3-ro`" for creds that are actually broader. GATE 3 reads
the scope tag from this trusted source keyed by the credential's identity, not from any
agent-supplied hint. If the trusted source has no scope for a credential that a policy marks scoped,
GATE 3 denies (fail closed) rather than injecting an untagged credential.

**AC-40a (collision-resistant credential identity; deny on ambiguous).** The "credential's identity"
GATE 3 keys the scope lookup on MUST be **collision-resistant**, not a guessable/forgeable label: it
is `sha256` of the credential's *stable secret-store identity* (broker key id, KMS ARN/key-version,
or secret name+version), **never** the credential value's prefix, the env-var name, or an
agent-supplied alias. The trusted source (AC-40) is a map keyed by this identity. If two distinct
credentials resolve to the **same** identity key (a collision or a mis-keyed broker entry), or if a
credential's identity is **absent/ambiguous** in the trusted map, GATE 3 **denies** (fail closed) —
it never guesses a scope, and never picks the narrower of two candidate scopes. This prevents an
attacker from getting a broad credential tagged with a narrow scope by exploiting a weak identity
key.

**AC-49 (load-bearing, un-bypassable gates for ALL covered actions — closes residual issue 8(i)).**
Draft 2 leaned on GATE 3 as "the backstop," but GATE 3 only ever sees a *scoped credential injection*.
A policy-covered action that injects **no** scoped credential (e.g. a covered `Bash rm -rf`, a
covered MCP tool, a `kubectl delete` with the pod's ambient service-account) has **nothing** for
GATE 3 to gate; if GATE 2 is advisory (non-blocking adapter, §9.2) and GATE 1 is bypassed, such an
action would execute unchecked. Draft 3 therefore **designates GATE 1 and the genty
dispatcher/session seam (§9.4) as the LOAD-BEARING, un-bypassable enforcement for every covered
action — credential-bearing or not** — and requires proof that every tool-execution path traverses at
least one blocking gate:

- **Invariant.** For a **covered** action, at least one *blocking* gate on the path (GATE 1
  `beforeToolUse` deny, §9.1; **or** the genty dispatcher `dispatcher.dispatch` / session
  `definition.execute` verifier, §9.4) MUST evaluate the policy and be able to return `deny` **before**
  execution. GATE 2 (advisory for non-blocking adapters) and GATE 3 (credential-only) are **defense-in-depth,
  not the sole line**. A covered action reaching exec without having passed a blocking gate is a
  design defect.
- **AC-49a (execution-path enumeration acceptance test).** From the research execution-path map
  (research §4 genty decision/execution points; §5 the three adapters gates; §6.3 dispatcher seam),
  the test **enumerates every tool-execution entry path** — genty session `session.ts:1251`
  `definition.execute`; genty MCP dispatcher `effects.ts:561-601` `dispatcher.dispatch`; adapters
  GATE 1 `dispatch.ts:133-188`; spawned-harness GATE 2 `spawn-runtime-hooks.ts:99-117`; and the spawn
  path `spawn-invocation.ts` (local/docker/ssh/k8s) — and asserts that for a covered action **each
  path hits at least one gate that blocks on policy denial**. The test fails if any enumerated path
  can reach execution of a covered action without a blocking gate. This converts "enforcement at all
  gates" from prose into an executable coverage check, and is the acceptance evidence for AC-33's
  alternate-path defense.

**AC-50 (GATE 3 credential-channel coverage; bounded, warned non-goal — closes residual issue 8(ii)).**
GATE 3 mediates the credential-delivery channels that `spawn-invocation.ts` **constructs and can
therefore see** — enumerated in AC-23a: env injection (docker `-e`, ssh `K=V`, k8s `env`/`--env`),
docker `-v` file mounts, and k8s secret/service-account references (`--serviceaccount`, mounted secret
volumes it emits). For each, "no valid authorization" means the channel is **omitted** (mount dropped,
secret ref stripped), not merely the env var. Channels GATE 3 **cannot** mediate are an explicit,
**bounded non-goal with a warning**, not a silent gap:
- **Out-of-scope (documented):** credentials the process obtains **without** `spawn-invocation.ts`
  constructing the delivery — cloud **instance metadata (IMDS/IRSA/workload-identity)**, pre-existing
  files on a shared/mounted path the agent already controls, credentials embedded in a container image,
  and network-reachable secret endpoints the process calls itself. GATE 3 does not see these, so it
  **cannot** enforce scope on them.
- **Why env/mount is the primary channel:** `spawn-invocation.ts` is the one seam this design controls
  for *injecting* credentials into a spawned process, so it is where scoped injection is gated. The
  out-of-scope channels are properties of the **execution substrate** (VM metadata, image contents),
  mitigated by substrate controls (no broad instance role for agent pods, minimal images, network
  egress policy) — called out here as an operator warning, and cross-referenced from §1.2.
- **Mandatory warning + fail-closed default.** When a policy action declares a `credentialScope` that
  the deployment **cannot** deliver through a GATE-3-mediated channel (i.e. it would arrive via IMDS or
  a pre-existing mount), the evaluator MUST emit a loud **audit-logged warning** at load time and, for
  such an action, MUST NOT report `granted` on the assumption GATE 3 will backstop it — because it
  will not. High-assurance scoped credentials MUST be delivered through a GATE-3-mediated channel; the
  design does not claim to gate substrate-delivered credentials.

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

**AC-26 (revised — Draft 3 — trust-roots config format, location, signed manifest).** Trust roots
live in a single git-tracked file `.policy/trust-roots.json` at repo root (public material only), an
array of `TrustRoot` records (§4.2, each now carrying key material per AC-6) plus a `revoked` list.
Policy documents live under `.policy/policies/*.yaml`. Private keys are **never** git-tracked: human
private keys stay under `.breakpoints/.keys/private/` (gitignored, existing proven layout);
engine/issuer private keys under `.policy/.keys/private/` (added to `.gitignore`). Public keys are
git-tracked (`trusted/` + `trust-roots.json`).

**Draft 3 replaces per-file detached signatures with a single signed `configEpoch` manifest** (AC-46).
Rather than one `<name>.sig.json` per file — which permits **partial rollback** of one file to an
older validly-signed version — there is exactly **one** signed manifest,
`.policy/config-manifest.json`, that lists **every** config file (`trust-roots.json` and every
`policies/*.yaml`) with its sha256, plus a monotonically increasing `configEpoch` integer, all signed
as one `SignedEnvelope<ConfigManifestPayload>` by the out-of-agent config root-of-trust (AC-36).
Git-tracking a file does **not** make it trusted; presence in the current-epoch signed manifest does.

### 10.1 Config integrity — the out-of-agent root of trust (**AC-36/AC-37**, review issue 3)

**Threat being closed.** The threat model puts a compromised / workspace-writable agent in scope
(§11 AC-33). Draft 1's trust-roots and policy files were merely git-tracked JSON/YAML on that same
workspace, so such an agent could **add its own fingerprint as a `human` root, relax an `argv`
matcher, or widen a `credentialScope` glob, then self-authorize.** No signature check stopped it.

**AC-36 (revised — Draft 3 — config root-of-trust; one signed manifest, verified before honoring).**
There is a distinguished **config root-of-trust** key whose private half is held **outside every
agent process** — the same place the transport proxy / issuer keys live (the orchestrator/proxy host,
or a hardware token / KMS in production), never on the agent-writable workspace and never under any
path an agent step can write. Its public half is pinned as a `kind:'config'` root. Configuration is
covered by **one** signed manifest:

```ts
interface ConfigManifestPayload {
  payloadType: 'config-manifest';   // AC-51 domain-separation constant
  configEpoch: number;              // AC-46: monotonically increasing; strictly greater on every re-sign
  files: { path: string; sha256: string }[];  // EVERY config file: trust-roots.json + every policies/*.yaml
  issuedAt: string;                 // ISO
}
```

Every gate and the evaluator MUST, before honoring **any** trust root or policy document:
1. Load `.policy/config-manifest.json` and verify it via `verifyEnvelopeTrusted(manifest,
   requiredKind:'config', allowedFingerprints: [pinnedConfigRootFp])` (AC-35, which also enforces
   `payloadType === 'config-manifest'` per AC-51) against the pinned config-root fingerprint.
2. **Enforce the epoch floor (AC-47):** require `manifest.payload.configEpoch >=
   POLICY_CONFIG_MIN_EPOCH` (the off-workspace pin). Below the floor → **deny all**.
3. For **every** config file about to be honored, recompute sha256 of its canonical bytes and require
   it to equal the entry in `manifest.files` for that path; a config file **not listed** in the
   manifest, or whose hash disagrees, → **deny all**. (This binds trust-roots and every policy doc to
   the *same* epoch, so no single file can be rolled back independently — AC-46.)
4. Mismatch, missing manifest, wrong signer, below-floor epoch, or an unlisted/edited file → **deny
   all** (fail closed): if the config itself is untrusted, no action is authorized.
   `CommandAuthorization.policyDocHash` (AC-8) is the per-doc hash from this same manifest and
   `CommandAuthorization.configEpoch` records the manifest epoch, so a gate confirms it enforced the
   exact signed documents, under the exact epoch, that the authorization was issued under (AC-10
   steps 9–10).

Because the signing key is off the workspace, an in-scope compromised agent can edit the files but
**cannot produce a valid signature** for the edit; the tampered config is rejected. This is the
integrity guarantee Draft 1 lacked. (Alternative considered and rejected for this iteration: placing
the files on a read-only path the agent cannot write. Signing is preferred because it survives the
files being copied, distributed, or served over git, and does not depend on per-deployment mount
permissions.)

**AC-46 (monotonic config epoch — one manifest covers all config, closes residual issue 6).** Draft 2
signed `sha256(file bytes)` per file with **no version, counter, or nonce**. A validly-signed *older*
config set therefore remains valid forever: an in-scope adversary who retains a previously-signed
`trust-roots.json` + policy set (e.g. from git history, or a prior deploy) can **swap the older,
more-permissive set back in** — and because the revocation list lives inside `trust-roots.json`, the
rollback **un-revokes** any key that was revoked after that snapshot (re-enabling a stolen key), and
restores any policy loosened since (wider `credentialScope` globs, relaxed `argv` matchers). Each
file's signature verifies in isolation, so nothing detects the downgrade. **AC-46 binds a
monotonically increasing integer `configEpoch` into a single signed manifest** that covers **all**
config files together (AC-36):
- The config root signs **one** `ConfigManifestPayload` per config change; `configEpoch` MUST be
  **strictly greater** than the previous manifest's epoch on every re-sign (the `sign-config` CLI,
  AC-37, refuses to emit a manifest whose epoch is `<=` the epoch it is replacing, unless an explicit
  operator `--force-epoch` override records an intentional reset in the audit log).
- Because trust-roots (incl. the revocation list) and every policy doc are hashed **into the same
  manifest under the same epoch**, **partial rollback of one file is impossible**: you cannot pair an
  old `trust-roots.json` with a new policy set (or vice-versa) — the manifest hash for the swapped
  file will not match, and there is no per-file signature to verify it independently. Revocation
  therefore cannot be downgraded independently of the epoch.

**AC-47 (off-workspace minimum-epoch floor; every gate rejects below-floor config).** The rollback
defense requires a monotonic reference the adversary cannot rewind. That reference is an
**off-workspace pin**: `POLICY_CONFIG_MIN_EPOCH` is pinned in the **same** code/deploy artifact as
`POLICY_CONFIG_ROOT_FP` (AC-37) — the deploy image / env, never a workspace file an agent can edit.
Every gate and the evaluator, after verifying the manifest signature (AC-36), MUST reject any config
whose `configEpoch < POLICY_CONFIG_MIN_EPOCH` (**deny all**), and MUST reject any
`CommandAuthorization` whose `configEpoch` is below the floor or does not equal the currently-honored
manifest epoch (AC-10 step 10). Advancing the floor is a deploy operation performed **together with**
signing a new config epoch, so a rolled-back-but-validly-signed older manifest (epoch below the
current floor) is rejected even though its signature verifies. The floor is what converts "monotonic
counter" into an enforceable anti-rollback bound: the manifest proves *which* epoch; the pinned floor
proves the *minimum acceptable* epoch, and neither can be moved by editing the workspace. (Where a
hardware monotonic counter / KMS key-version is available in production, the floor MAY be sourced from
it instead of a static pin; the static deploy pin is the baseline.)

**AC-37 (bootstrap / root-of-trust provisioning).** The top of the trust hierarchy is provisioned
out-of-band, once, before any agent runs, and its story is:
- The config root-of-trust keypair is generated on the operator's trusted host (or KMS/HSM) via
  `policy-adapter init-config-root` (**flagged new CLI in `@a5c-ai/policy-adapter`**). The private
  half is stored where agents cannot read it (proxy/orchestrator host secret store, KMS, or token);
  the public half's fingerprint is **pinned in code/deploy config** (`POLICY_CONFIG_ROOT_FP` env /
  a committed `pinned-config-root.json` that is itself part of the deploy image, not the workspace),
  so the pin cannot be swapped by editing a workspace file. **The minimum-epoch floor
  `POLICY_CONFIG_MIN_EPOCH` (AC-47) is pinned in the same artifact, beside `POLICY_CONFIG_ROOT_FP`.**
- Signing a config change is an explicit operator step: `policy-adapter sign-config` runs on the
  trusted host, hashes **all** config files into one `ConfigManifestPayload` with the next
  `configEpoch` (strictly greater than the current epoch — AC-46), and emits the single signed
  `.policy/config-manifest.json`. Agents never hold this key, so agents cannot sign config or mint a
  higher epoch. Advancing the deploy-pinned floor is done together with rolling out a new epoch.
- The config root signs (via the manifest) the initial `trust-roots.json` + policy docs at epoch 1
  (with the floor pinned at 1); `trust-roots.json` in turn names the `human`/`engine`/`agent` roots.
  Revocation of the config root itself is a deploy operation (rotate the pin), out of scope for online
  revocation (§1.2 non-goal 4).
- **Chain summary:** pinned config root + pinned epoch floor (off-workspace) → sign one
  `config-manifest.json` (epoch ≥ floor) covering `trust-roots.json` + policy docs → those name the
  evidence-signing roots → evidence chains authorize commands. Every link is verified by
  `verifyEnvelopeTrusted`; the only links anchored by a code/deploy pin (not a file) are the config
  root **and the epoch floor**, which together make the tree resistant to both tampering and rollback
  by the workspace-writable adversary.

**AC-27 (revised — Draft 3 — rotation & revocation, downgrade-protected).** Rotation reuses proven
`rotateKey` (`keys.ts:122-148`): it marks the old public key `expiresAt` and provisions a new pair.
Verification honors key expiry at **signing time** (`proven/verify.ts:39-51`; `isPermissionValid`
`tool-signing.ts:50-55`) so an old signature made while the key was valid still verifies unless the
key is explicitly revoked. Revocation is a `revoked: true` flag / fingerprint list in
`trust-roots.json`; a revoked fingerprint fails verification immediately regardless of signing time.

**Revocation cannot be downgraded independently (AC-46).** Because the revocation list lives inside
`trust-roots.json` and `trust-roots.json` is hashed into the single signed manifest under the current
`configEpoch`, rolling the revocation list back to un-revoke a stolen key requires swapping in an
older `trust-roots.json` — which changes the manifest hash and lowers `configEpoch` below the pinned
floor (AC-47), so it is rejected. **Every revocation MUST therefore be published by signing a new,
strictly-higher config epoch and advancing the deploy floor**, so the un-revoked state (a lower
epoch) is permanently below the floor. What is git-tracked: public keys, trust-roots config, policy
docs, revocation list, `config-manifest.json`. What is local-only: all private keys. What is
deploy-pinned (off-workspace): `POLICY_CONFIG_ROOT_FP` and `POLICY_CONFIG_MIN_EPOCH` (AC-37/AC-47).

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
- **AC-33 — Bypass via alternate execution path.** Defense: GATE 1 and the genty dispatcher/session
  seam are the **load-bearing, un-bypassable** blocking gates for **every** covered action —
  credential-bearing or not (AC-49); the AC-49a execution-path enumeration test asserts each
  enumerated exec path hits a blocking gate. GATE 2 (advisory for non-blocking adapters) and the GATE
  3 credential backstop across **all** delivery channels it controls (AC-50) are defense-in-depth:
  with no valid authorization the scoped credential is never delivered by any GATE-3-mediated channel,
  so an alternate path that skips GATE 1/2 still cannot obtain scoped credentials it controls. The
  credential→scope tag comes from the trusted out-of-agent source keyed by collision-resistant
  credential identity (AC-40/AC-40a), so the agent cannot relabel broad creds as a narrow scope. GATE
  3's substrate-delivered-credential limits (IMDS, pre-existing mounts) are a bounded, warned non-goal
  (AC-50), not a silent hole.
- **AC-45 — Config / policy tampering by a compromised agent** (adds its own trust root, relaxes an
  `argv` matcher, widens a `credentialScope`, then self-authorizes). Defense: `.policy/trust-roots.json`
  and every policy doc are hashed into the **single out-of-agent config-root-signed manifest** (AC-36)
  whose fingerprint is pinned in deploy config, not on the workspace; every gate verifies the manifest
  signature and per-file hashes before honoring any root or policy and denies-all on mismatch. The
  agent can edit the files but cannot produce a valid signature (AC-37), so tampered config is
  rejected. `CommandAuthorization.policyDocHash` + `configEpoch` tie each authorization to the exact
  signed policy doc under the exact epoch.
- **AC-46 — Config rollback / downgrade by a compromised agent** (swaps a validly-signed *older*,
  more-permissive `trust-roots + policy` set back in, un-revoking a stolen key and re-widening scopes).
  Defense (residual issue 6): the single signed manifest carries a **monotonic `configEpoch`** (AC-46)
  covering all config files together, and every gate rejects any `configEpoch` below the off-workspace
  pinned `POLICY_CONFIG_MIN_EPOCH` floor (AC-47) and any authorization whose `configEpoch` is below the
  floor or ≠ the current manifest epoch (AC-10 step 10). Revocation is published by advancing the epoch
  + floor (AC-27), so the un-revoked older state is permanently below the floor. Partial rollback of one
  file is impossible — all files share one manifest hash + epoch. Test: sign epoch N, advance floor to
  N, present the epoch-(N-1) manifest → **deny all**.
- **AC-48 — Proven-bridge unsigned `approved` bit** (a forged `ProvenBreakpointAnswer` sets
  `approved:true` as an **unsigned** field, listing a `signedFields` that omits it; `verifyAnswer`
  still returns valid because it rebuilds the payload from the attacker's `signedFields`,
  `proven/verify.ts:60`). Defense (residual issue 7): the bridge applies the AC-2 completeness rule to
  the legacy proven answer — it denies unless `{breakpointId, approved, responderId} ⊆
  provenAnswer.signedFields` and each is present — **before** deriving any human evidence, and derives
  only when `approved === true` (AC-48/AC-3/AC-43). Test: a proven answer valid under a `human` key but
  with `approved` absent from `signedFields` yields **no** human evidence → chain unsatisfied → deny.
- **AC-49 — Covered non-credential action on a bypassed/advisory path** (a covered `Bash rm -rf` or MCP
  tool that injects no scoped credential, with GATE 2 advisory and GATE 1 skipped). Defense (residual
  issue 8(i)): GATE 1 and the genty dispatcher/session seam are load-bearing blocking gates for **all**
  covered actions (AC-49); the AC-49a enumeration test asserts every exec path hits a blocking gate, so
  no covered action reaches exec unchecked even when no credential is involved.
- **AC-51 — Cross-payload-type signature transfer** (an `engine`-signed envelope of one payload type
  presented for a step expecting a different `engine`-signed type). Defense: every payload carries a
  bound `payloadType` constant in `signedFields`, and `verifyEnvelopeTrusted` denies unless
  `payload.payloadType` equals the expected constant for the step's kind (AC-51). Test: present a
  `model-decision` envelope for a `command-authorization` slot → deny.
- **AC-44 — Non-blocking-GATE-2 coverage + passthrough denial (acceptance test).** Two fail-closed
  behaviors that Draft 1 asserted but did not test: (i) for a **non-blocking** GATE-2 adapter
  (`mode !== 'blocking'`, §9.2), GATE 2 cannot hard-enforce, so the test asserts that GATE 1 and/or
  GATE 3 still deny a covered-but-unauthorized call — i.e. the overall system is fail-closed even
  when GATE 2 is advisory. (ii) A model call routed through **passthrough proxy mode** (no
  `completionEngine`, §6.5) produces no attestation, so an action requiring proxy attestation (incl.
  any credential-touching action defaulting to it, AC-39) MUST be **denied** on that path. AC-44 is
  the explicit acceptance test for both. **(Draft 3)** The non-blocking-GATE-2 case is subsumed by the
  broader AC-49a enumeration test: with GATE 2 advisory, a blocking gate (GATE 1 or the genty seam)
  still denies a covered-but-unauthorized call whether or not it carries a credential.

---

## 12. Acceptance-criteria → milestone map

| Milestone | Acceptance criteria |
|-----------|---------------------|
| **A — trust-core** | AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-25, AC-26, AC-27, **AC-34** (model-decision payload extension type), **AC-35** (trusted-store verifier wrapper), **AC-36** (config-integrity verification), **AC-37** (root-of-trust bootstrap), **AC-43** (proven bridge → human), **AC-46** (monotonic config-epoch manifest), **AC-47** (off-workspace epoch floor), **AC-48** (proven-bridge legacy signedFields completeness), **AC-51** (domain-separation `payloadType`), **AC-52**+**AC-52a** (shared canonical argv/args serialization + conformance test) |
| **B — policy-engine** | AC-9, AC-10, AC-19, AC-19a, AC-20, AC-21, AC-21a, AC-22, **AC-38** (canonicalized argv matcher), **AC-38a**, **AC-38b** (command default-allow opt-in), **AC-38c** (argv wrapper allowlist), **AC-41** (quorum distinct-holder), **AC-41a** (heterogeneous quorum composition), **AC-42** (evidence covers every step) |
| **C — evidence-producers** | AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17, AC-18, **AC-34a** (tool-call binding at produce/verify), **AC-39** (proxy-attestation default for credential actions) |
| **D — tool-layer-enforcement** | AC-23, AC-23a, AC-23b, AC-23c, **AC-40** (trusted credential→scope source), **AC-40a** (collision-resistant credential identity), **AC-49** (load-bearing un-bypassable gates), **AC-50** (GATE 3 credential-channel coverage + bounded non-goal) |
| **E — e2e-integration** | AC-24 (non-goals guard), AC-28, AC-29, AC-30, AC-31, AC-32, AC-33, **AC-44** (non-blocking-GATE-2 + passthrough-denial test), **AC-45** (config-tampering threat), **AC-46** (config-rollback threat test), **AC-48** (proven-bridge unsigned-approved threat test), **AC-49a** (execution-path enumeration test), **AC-51** (cross-payload-type transfer test) |

Every acceptance criterion maps to exactly one milestone. (AC-24, the non-goals guard, is verified
in E as a scope-regression check.) New ACs from the Draft-2 security revision are assigned as above:
type/verifier/config-integrity work lands in A, schema/evaluator work in B, producer binding in C,
credential-scope sourcing in D, and the new threat/behavior tests in E. **Draft-3 note on dual-listed
ids:** AC-46, AC-48, AC-49, and AC-51 name a *mechanism* (implemented in its home milestone — A for
46/47/48/51, D for 49/50) **and** a *threat test* (verified in E). The mechanism AC and its E-row test
are the same criterion observed at implementation vs. verification time; the milestone of record for
implementation is the home milestone (A/B/D), and E lists the acceptance **test** that exercises it —
consistent with how AC-34/AC-34a and AC-30 already appear in both a producer milestone and the E
threat model. AC-49a and AC-52a are test-only sub-criteria owned by E and A respectively.

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
| **Config-integrity verification + signing CLI** (AC-36/AC-37) | `@a5c-ai/policy-adapter` (`init-config-root`, `sign-config`, gate-side `verifyConfigManifest`) | **NEW code** |
| **Config-epoch manifest + off-workspace floor** (AC-46/AC-47) | `ConfigManifestPayload` + `POLICY_CONFIG_MIN_EPOCH` pin; `sign-config` mints strictly-higher epoch; gates enforce floor | **NEW code** |
| **Proven-bridge legacy signedFields completeness** (AC-48) | `@a5c-ai/policy-adapter` bridge (wraps `proven/verify.ts:20-72`; asserts `{breakpointId,approved,responderId}⊆signedFields` before deriving) | **NEW code** (bridge assertion) |
| **Domain-separation `payloadType`** (AC-51) | bound constant added to every payload + `REQUIRED_SIGNED_FIELDS`; checked in `verifyEnvelopeTrusted` | **NEW field + check** |
| **Shared canonical argv/args serialization** (AC-52) | `canonicalizeArgs`/`canonicalizeArgv` in `@a5c-ai/policy-adapter` (builds on genty `deepSortKeys`), imported by proxy + every gate | **NEW code** (single shared util) |
| **Canonicalized argv matcher + wrapper allowlist** (AC-38/AC-38c) | `@a5c-ai/policy-adapter` | **NEW code** (tokenize + resolve program + per-scope wrapper allowlist + normalize subcommand) |
| **Load-bearing gate coverage + exec-path enumeration test** (AC-49/AC-49a) | assertion over existing gates (GATE 1 `dispatch.ts`, genty seam `effects.ts`/`session.ts`); enumeration test | **NEW test** (no new runtime module) |
| **GATE 3 non-env credential channels** (AC-50) | extend GATE 3 to docker `-v` (`spawn-invocation.ts:79,81`), k8s secret/serviceaccount refs (239) — env channels already in AC-23a | **extend** (bounded non-goal for IMDS/pre-mounts) |
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
composition of existing code, with the flagged exceptions the security revisions require:
(1) a **new type** `ModelDecisionPayload`/`SignedToolCall` added beside `trust/model-signing.ts` in
`@a5c-ai/genty-core` — the single, deliberate relaxation of the no-new-schema rule, needed to bind a
model decision to a specific tool call (AC-34; Draft 3 adds a bound `payloadType` field to it and to
every other payload, AC-51); and (2) **new security-critical code inside** `@a5c-ai/policy-adapter` —
the `verifyEnvelopeTrusted` trusted-store wrapper (AC-35, incl. `payloadType` binding), the
config-integrity verify/sign path with the **monotonic-epoch manifest** (AC-36/AC-37/AC-46/AC-47), the
**proven-bridge legacy-completeness assertion** (AC-48), the **shared canonical argv/args serializer**
(AC-52), and the canonicalized-argv matcher with a **per-scope wrapper allowlist** (AC-38/AC-38c) —
which are extensions of, not forks of, existing genty/proven primitives. The Draft-3 GATE-3 extension
(AC-50) and load-bearing-gate assertion (AC-49) add no new runtime module (they extend
`spawn-invocation.ts` credential handling and add a coverage test over existing gates). No third policy
engine is created (AC-22); the two existing engines delegate trust-chain steps to the adapter.
