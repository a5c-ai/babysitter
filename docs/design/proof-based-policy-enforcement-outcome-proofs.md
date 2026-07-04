# Proof-Based Policy Enforcement — Outcome Proofs (Execution Attestation) Design Specification

Status: **first draft** (2026-07-04). Frozen input: `.a5c/processes/outcome-proofs.brief.md`.
This spec adds the **outcome-proof / execution-attestation** direction to the shipped
proof-based policy-enforcement system (Milestones A–E, the *precondition* direction). It is
grounded, line by line, in the shipped code that Milestones A–E delivered; every decision cites
the exact file it extends and every acceptance criterion (AC) has a stable id `OP-N` that is
independently testable.

Read the base spec first: [`docs/design/proof-based-policy-enforcement.md`](./proof-based-policy-enforcement.md)
(especially §4.2 authoritative-vs-correlation-grade, §6 producer strategy + honesty boundaries,
§10.1 the out-of-agent config root of trust) and the overview
[`docs/proof-based-policy-enforcement-overview.md`](../proof-based-policy-enforcement-overview.md) §5.

---

## 0. Summary

The shipped feature answers *"may this command run?"* via **precondition proofs**: evidence
(human-approval, model-decision, delegation) → `verifyEnvelopeTrusted` → `CommandAuthorization` →
gate. This increment answers the complement — *"can I prove this command ran, and what it
returned?"* — via **outcome proofs**: whoever **actually executes** a tool signs a
`ToolResultAttestation` binding the exact invocation to its exact outcome, using a key the
*orchestrating / deciding* agent does not hold. Two consumers:

- **(A) Policy evidence** — a later policy chain requires a `tool-result` step (e.g. authorize
  `aws deploy` only if a signed proof that `npm test` exited 0 exists).
- **(B) Babysitter-process gate** — a process step gates on `ctx.requireProof(...)`; the
  orchestrating agent cannot fabricate "tests passed" to advance, because the journal must carry a
  valid **executor-signed** attestation.

**Non-spoofability property.** The attestation is signed by whoever actually executes the tool,
holding a `tool-executor` key that the orchestrating/deciding agent's reasoning context cannot
read. Binding is by hash (`commandHash`/`argsHash`/`stdoutHash`/`stderrHash`), never by assertion.

**Owner-decided executor model: PLUGGABLE.** One new trust-root kind `tool-executor`. One
`ToolExecutorSigner` interface, with **two** concrete signers, both trusted as `tool-executor`:

1. **SDK-commit signer** — the babysitter SDK runtime signs the tool result when a shell/tool
   effect resolves into the journal at `commitEffectResult`
   (`packages/babysitter-sdk/src/runtime/commitEffectResult.ts`), using a run/deployment executor
   key not exposed to the agent's reasoning context. Primary path for in-SDK shell effects and the
   process-gate use case (B).
2. **Spawn-layer signer** — the adapters spawn/tool layer that actually launches the process
   (`packages/adapters/core/src/spawn-runner.ts` → `buildInvocationCommand`) signs at process exit
   for harness/sandbox-run tools. Strongest isolation.

Both unify under one interface and one `tool-executor` trust-root kind so the policy evaluator +
process gate consume attestations identically regardless of producer.

**Reuse posture.** No new package. The crypto payload extends the shipped primitive
`ToolResultPayload`/`signToolResult`/`verifyToolResult` in `@a5c-ai/trust-core`
(`packages/trust-core/src/tool-signing.ts`) rather than forking it; the trust-root kind, the
trusted-store resolver, and the policy step extend `@a5c-ai/policy-adapter`; the producers extend
`commitEffectResult` and `spawn-runner`; the process gate is a new intrinsic in `babysitter-sdk`.
The attestation rides `StoredTaskResult.metadata` (`packages/babysitter-sdk/src/tasks/serializer.ts`),
already a `JsonRecord` and already stable-cloned. Everything fails closed, no fallbacks (repo rule).

---

## 1. Goals, non-goals, milestones

### 1.1 Goals
- Make **execution itself** attestable: a signed proof that a specific command, with specific args,
  ran and returned a specific outcome.
- Two consumers of that proof, over the **same** verified `ToolResultAttestation`: a `tool-result`
  policy step (A) and a `ctx.requireProof(...)` process gate (B).
- Byte-identical binding with the precondition path: `argsHash`/`commandHash` via the **shared**
  `canonicalizeArgs`/`commandHash` (`packages/adapters/policy/src/canonicalize-args.ts`), so an
  outcome proof and a `CommandAuthorization` for the same call agree bit-for-bit.
- Pluggable executor: one interface, two signers, one trust-root kind, one verify path.

### 1.2 Non-goals (**OP-30**)
- **No new package** (extend `trust-core` + `policy-adapter`; add one intrinsic to `babysitter-sdk`).
  A new package would need `private:true` + metadata-passing (`scripts/check-package-metadata.cjs`);
  we avoid it.
- **No third engine.** The `tool-result` step is evaluated by the existing `evaluatePolicy`
  (`packages/adapters/policy/src/policy-evaluator.ts`), not a new evaluator.
- **No online revocation of executor keys** beyond the shipped `revoked`/`expiresAt` + manifest-epoch
  mechanism (same posture as A–E, §10.1 AC-27).
- **No result-*content* semantic validation** beyond the declared predicates (exitCode, hash/pattern,
  freshness, command/args binding). We do not interpret stdout meaning; we bind its hash.
- **No attestation of a tool the SDK/spawn layer did not itself execute** (e.g. a side effect a
  harness performed out-of-band). Only the two shipped execution seams produce proofs; anything else
  is unproven → the gate/step denies. See §7 boundary OP-B4.

### 1.3 Milestones
- **Milestone F — attestation-core** (`trust-core` + `policy-adapter`): the payload, the
  `tool-executor` trust-root kind, the trusted-store verify path.
- **Milestone G — producers** (`babysitter-sdk` commit signer + `adapters/core` spawn signer):
  emit the attestation at the two execution seams, keyed off the pinned manifest anchor.
- **Milestone H — consumers** (`policy-adapter` step + `babysitter-sdk` process gate): the
  `tool-result` policy step + result predicates, and `ctx.requireProof` + `attestResult` task option
  + optional proof-gated breakpoint auto-approval.

The **F → G → H** map for every `OP-N` is in §9.

---

## 2. Architecture overview

```
                       ┌──────────────────── deployment config (off-workspace, signed) ─────────┐
                       │  POLICY_CONFIG_ROOT_FP + POLICY_CONFIG_MIN_EPOCH  (env/deploy pin)      │
                       │  → .policy/config-manifest.json (epoch, AC-46) → .policy/trust-roots.json│
                       │      (now also `kind:'tool-executor'` roots)                            │
                       │  executor PRIVATE key: off-agent (deploy secret / KMS), NOT in workspace │
                       └────────────────────────────────────────────────────────────────────────┘
                                                    │ (anchors both key + trust roots)
   ┌─────────────── PRODUCERS (Milestone G, fail-closed, anchor-pinned) ───────────────┐
   │  (1) SDK-commit signer   commitEffectResult.ts  — shell/tool effect resolves →     │
   │        sign ToolResultAttestation over the CAPTURED result → StoredTaskResult.metadata│
   │  (2) Spawn-layer signer  spawn-runner.ts (process exit) — sign over captured        │
   │        exitCode/stdout/stderr → attestation returned to the SDK to store            │
   └───────────────────────────────────────────────────────────────────────────────────┘
                                                    │ ToolResultAttestation (SignedEnvelope)
                          ┌─────────────────────────┴──────────────────────────┐
   ┌────── CONSUMER A (policy) ───────┐                         ┌────── CONSUMER B (process) ──────┐
   │ policy-evaluator.ts: `tool-result`│                        │ ctx.requireProof({command,result})│
   │ step → verifyToolResultTrusted →  │                        │ → reads journal StoredTaskResult  │
   │ result predicates → chain grant   │                        │   .metadata → verifyToolResultTrusted│
   │ (evidence for CommandAuthorization)│                       │   → predicates → advance / BLOCK   │
   └───────────────────────────────────┘                        └───────────────────────────────────┘
                          (both call the SAME verify path: verifyEnvelopeTrusted(kind:'tool-executor'))
```

The crypto stays in `trust-core` (support-systems leaf, `private:true`, `type:commonjs`,
`packages/trust-core/package.json`). `policy-adapter` (ESM) hosts the trusted-store resolver and the
policy step. `babysitter-sdk` consumes `policy-adapter` via **dynamic `import()`** — the exact
pattern `trusted-breakpoint-policy.ts:218-226` already uses — so no static ESM edge is added to the
CJS SDK build and no `dispatch-core → orchestration-core` edge is created (§8, OP-28).

---

## 3. The `ToolResultAttestation` payload (Milestone F)

### 3.1 OP-1 — Extend `ToolResultPayload`, do not fork

The shipped primitive is `ToolResultPayload` + `signToolResult`/`verifyToolResult` in
`packages/trust-core/src/tool-signing.ts:4-34`. It is present but wired to nothing (brief §"What
already exists"). `signToolResult` is a thin wrapper over `signPayload`
(`packages/trust-core/src/signing.ts:24-47`), which already binds `signedFields`, `signedAt`,
`publicKeyFingerprint`, and `algorithm` into the canonical form. **OP-1** extends the existing
`ToolResultPayload` interface with the missing bound fields and adds a domain-separation
`payloadType`, keeping `signToolResult`/`verifyToolResult` as the low-level entry points (the
attestation is a `SignedEnvelope<ToolResultAttestationPayload>` produced by `signToolResult`).

```ts
// packages/trust-core/src/tool-signing.ts  (EXTENDED — additive; keeps existing fields optional)
export interface ToolResultAttestationPayload {
  payloadType: 'tool-result-attestation';   // OP-3 domain-separation constant (in signedFields)
  // WHAT ran (bound by hash, never asserted):
  toolName: string;
  toolCallId: string;
  commandHash: string;                       // sha256(canonicalizeArgv(...).join('|')) — OP-2
  argsHash: string;                          // sha256(canonicalizeArgs(args))          — OP-2
  // WHAT it returned:
  exitCode: number;
  stdoutHash: string;                        // sha256 of captured stdout bytes (OP-2)
  stderrHash: string;                        // sha256 of captured stderr bytes (OP-2)
  // WHEN:
  startedAt: string;                         // ISO
  finishedAt: string;                        // ISO
  durationMs: number;
  // WHERE (replay binding, OP-14):
  runId: string;
  sessionId: string;
  // WHO decided (optional link to the precondition path, §4.2 A–E of the base spec):
  modelDecisionFingerprint?: string;
  // WHO executed:
  executorKind: 'tool-executor';
}
```

`ToolResultPayload` (the shipped shape) is retained for back-compat; the attestation payload is a
new, fully-bound superset. `signToolResult` is generalized to sign the attestation payload with an
explicit `fields` list (the existing `signPayload(privateKey, fingerprint, payload, fields)` third
argument, `signing.ts:24-30`) so `payloadType` is provably in `signedFields`.

### 3.2 OP-2 — Hashes via the SHARED canonicalizers (byte-identity with the precondition path)

`argsHash` and `commandHash` MUST be computed by the **single shared** helpers exported from
`@a5c-ai/policy-adapter` (`packages/adapters/policy/src/canonicalize-args.ts`):
`argsHash(value)` = `sha256(canonicalizeArgs(value))` (`canonicalize-args.ts:77-79`) and
`commandHash(command)` = `sha256(canonicalizeArgv(command).join('|'))` (`canonicalize-args.ts:82-85`).
This is the identical function the gate and the `CommandAuthorization` issuer use (base spec AC-52/53),
so an outcome proof's `argsHash`/`commandHash` are byte-identical to a `CommandAuthorization`'s for the
same call — a `tool-result` step and a precondition step can be bound to the same invocation without a
second canonicalizer. `stdoutHash`/`stderrHash` are `sha256` over the **captured** output bytes
(the exact bytes the executor observed, OP-15 TOCTOU). A non-representable arg (non-finite number)
throws in `canonicalizeArgs` (`canonicalize-args.ts:47-49`) → the producer **denies** (no proof), never
coerces. Because `trust-core` is a leaf and cannot import `policy-adapter`, the producers (in the SDK
and adapters layers, both of which already reach `policy-adapter` by dynamic import) compute the hashes
with the shared helper and hand the finished payload to `signToolResult`; `trust-core` never sees the
canonicalizer (preserving the leaf boundary, §8/OP-28).

### 3.3 OP-3 — `payloadType` bound for domain separation

`payloadType: 'tool-result-attestation'` MUST be in `signedFields` and MUST equal that constant, so a
`ToolResultAttestation` cannot be replayed as, or confused with, a `command-authorization`,
`model-decision`, `config-manifest`, etc. This mirrors AC-51 and the shipped
`EXPECTED_PAYLOAD_TYPE`/`REQUIRED_SIGNED_FIELDS` maps in
`packages/adapters/policy/src/verify-envelope-trusted.ts:29-72`. See OP-6 for where the check lands.

---

## 4. The `tool-executor` trust-root kind + verify path (Milestone F)

### 4.1 OP-4 — Add `tool-executor` to `TrustRootKind`

The shipped `TrustRootKind` is `'human' | 'engine' | 'agent' | 'tool' | 'config'`
(`verify-envelope-trusted.ts:76`). **OP-4** adds `'tool-executor'`:

```ts
export type TrustRootKind = 'human' | 'engine' | 'agent' | 'tool' | 'config' | 'tool-executor';
```

`'tool'` (the shipped generic tool-identity kind, unused by the enforcement path) is intentionally
distinct from `'tool-executor'` (the execution-attestation signer). A `tool` root does NOT satisfy a
`tool-executor` requirement and vice-versa (OP-7 cross-kind rejection). `tool-executor` public keys
live in the manifest-covered `.policy/trust-roots.json` (a new-kind entry), exactly like the
`human`/`engine` roots that `trusted-breakpoint-policy.ts:293-298` and the base evaluator already read;
the executor **private** key is provisioned off-agent (deploy config / KMS, like the proxy key — base
spec §4.2, §10.1). No fingerprint may be shared across kinds (the duplicate-fingerprint rejection in
`loadTrustStore`, `policy-schema.ts:318-333`, already forbids one fingerprint appearing twice).

### 4.2 OP-5 — New evidence kind `tool-result` + its `EvidenceKind` mapping

**OP-5** adds `'tool-result'` to the shipped `EvidenceKind` union
(`verify-envelope-trusted.ts:21-26`), to `EXPECTED_PAYLOAD_TYPE`
(`'tool-result' → 'tool-result-attestation'`), and to `REQUIRED_SIGNED_FIELDS`:

```ts
REQUIRED_SIGNED_FIELDS['tool-result'] = [
  'payloadType', 'toolName', 'toolCallId', 'commandHash', 'argsHash',
  'exitCode', 'stdoutHash', 'stderrHash', 'startedAt', 'finishedAt', 'durationMs',
  'runId', 'sessionId', 'executorKind',
];   // modelDecisionFingerprint is OPTIONAL — omitted from the required set (OP-1)
```

and extends `trustRootKindForEvidence` (`verify-envelope-trusted.ts:292-305`) with
`case 'tool-result': return 'tool-executor';`. This wires `tool-result` evidence to the
`tool-executor` trust-root kind through the identical selection machinery A–E use — **no new resolver**.

### 4.3 OP-6 — `verifyEnvelopeTrusted` resolves + kind-checks the executor key (fail-closed, in order)

The shipped `verifyEnvelopeTrusted` / `verifyOne` (`verify-envelope-trusted.ts:237-329`) already
implements the AC-35 (a)–(g) sequence. Because OP-4/OP-5 register `tool-result → tool-executor`,
`verifyEnvelopeTrusted(attestation, 'tool-result', store, allowedFingerprints?)` resolves a
`ToolResultAttestation` with **zero new verification code**, enforcing exactly:

- **(a)** resolve key material **only** from the trusted store by `publicKeyFingerprint`
  (`verify-envelope-trusted.ts:250-251`); the envelope's own embedded key, if any, is ignored;
- **(b)** the resolved root's `kind` MUST equal `tool-executor` (`:254-257` via
  `trustRootKindForEvidence('tool-result')`); `allowedFingerprints` (if the step supplies them) MUST
  contain the fingerprint (`:258-260`);
- **(c)** `sha256(resolvedPublicKey) === envelope.publicKeyFingerprint` (`:267-269`) — the
  fingerprint→material binding genty's raw verify omits;
- **(d)** cross-kind is rejected by (b): **NO** non-`tool-executor` key (human/engine/agent/tool/config)
  can satisfy a `tool-result` step (**OP-7**);
- **(e)** `signedFields` completeness + `payloadType === 'tool-result-attestation'`
  (`:274-275` → `checkCompleteness`, `:211-230`) using the OP-5 required-field set (**OP-3**);
- **(f)** root not `revoked` and not expired at `signedAt` (`:278-279`, `keyValidAt` `:196-202`) — **OP-8**;
- **(g)** only now, the raw `verifySignature(resolvedPublicKey, envelope)` (`:282`).

Any thrown exception at any step is a DENY (`:326-328`). **OP-6** is: a `ToolResultAttestation`
verifies iff and only iff (a)–(g) all pass against a `tool-executor` root in the manifest-verified
store. A convenience export `verifyToolResultTrusted(envelope, store, allowedFingerprints?)` wraps
`verifyEnvelopeTrusted(envelope, 'tool-result', ...)` so consumers have a named entry (mirrors the
shipped `verifyCommandAuthorization` wrapper, `:355`).

### 4.4 OP-9 — The verify path is anchored to the manifest-verified config, never agent-writable input

`verifyToolResultTrusted` is only ever called with a `store` whose `tool-executor` roots come from the
**manifest-verified** `.policy/trust-roots.json`. The producers (OP-10/OP-12) resolve the trust roots
+ executor key through the SAME manifest-verification path A–E use: for the SDK signer, the pinned
`POLICY_CONFIG_ROOT_FP` + `POLICY_CONFIG_MIN_EPOCH` → `verifyConfigManifest`
(`packages/adapters/policy/src/config-manifest.ts:67`) → trust-roots, exactly as
`loadTrustedBreakpointPolicy` does (`trusted-breakpoint-policy.ts:161-290`); for the spawn signer, the
same `loadPolicyEnforcementGate(projectRoot)` gate context the shipped GATE 3 already resolves
(`policy-spawn-gate.ts:70-96`). A config file whose sha256 is not the manifest-bound one, a manifest
signed by anything but the pinned config root, or an epoch below the floor → deny-all (config-manifest
verifier, `config-manifest.ts:88-123`). **The executor public keys + trust roots are therefore never
taken from agent-writable input** — closing the same class of attack Milestone C closed for
breakpoints (`trusted-breakpoint-policy.ts:6-42`).

---

## 5. The `ToolExecutorSigner` interface + the two signers (Milestone G)

### 5.1 OP-10 — The pluggable `ToolExecutorSigner` interface

```ts
// packages/adapters/policy/src/tool-executor-signer.ts  (NEW module in the EXISTING package)
export interface ToolExecutorSigner {
  readonly fingerprint: string;          // this executor's tool-executor fingerprint (in trust-roots)
  /** Sign the CAPTURED result at capture time (OP-15). Returns a SignedEnvelope or throws (fail closed). */
  sign(payload: ToolResultAttestationPayload): SignedEnvelope<ToolResultAttestationPayload>;
}
/** Resolve the configured executor signer from the manifest-verified config, or `undefined`
 *  when no anchor is pinned (enforcement inactive → no attestation, back-compat). Throws → deny. */
export function resolveToolExecutorSigner(projectRoot: string): Promise<ToolExecutorSigner | undefined>;
```

`resolveToolExecutorSigner` loads the executor **private** key from the off-agent pin
(`POLICY_TOOL_EXECUTOR_KEY` / `POLICY_TOOL_EXECUTOR_KEY_PATH`, mirroring the config-root key envs at
`trusted-breakpoint-policy.ts:83-89`), verifies the config manifest, confirms the corresponding
`tool-executor` public root is present + non-revoked in the manifest-verified `.policy/trust-roots.json`,
and returns a signer whose `sign` delegates to `signToolResult`. Both concrete signers below **are**
`ToolExecutorSigner`s — the policy evaluator + process gate consume their output identically.

### 5.2 OP-11 — SDK-commit signer (at `commitEffectResult`)

**Where.** `packages/babysitter-sdk/src/runtime/commitEffectResult.ts`, inside the shipped
`withRunLock` critical section, **after** the result is captured and **before**
`serializeAndWriteTaskResult` (`commitEffectResult.ts:63-69`) and the `EFFECT_RESOLVED` append
(`:85-99`) — the exact point that already anchors signed-breakpoint enforcement to the
manifest-verified config (`enforceSignedBreakpointGate`, `:223-291`). We add a symmetric
`signToolResultAttestation(options, record)` step, gated on:

1. the effect `record.kind === 'shell'` (or a tool effect) — same predicate the shipped
   output-schema validator uses (`validateTaskResultOutputSchema`, `:330-331`); **and**
2. the task was marked `attestResult` (OP-20) in its stored task definition metadata
   (read via `readTaskDefinition`, `:335`, the same read the breakpoint-id enrichment uses at `:78`); **and**
3. the config anchor is pinned (`resolveToolExecutorSigner(process.cwd())` returns a signer). When no
   anchor is pinned, this is a **no-op** (back-compat, exactly like `enforcementActive:false` at
   `commitEffectResult.ts:232-233`).

**What it signs.** The `ToolResultAttestationPayload` built from the CAPTURED result: `exitCode` from
the shell result value, `stdoutHash`/`stderrHash` over the captured stdout/stderr bytes (the same bytes
`buildResultPayload` serializes, `:444-466`), `argsHash`/`commandHash` over the task's recorded
command/args (from the task definition, not agent narrative), `startedAt`/`finishedAt`/`durationMs` from
the result payload (`:419-424`), `runId = path.basename(options.runDir)` (as at `:51`), `sessionId`,
`toolName`/`toolCallId` from the effect record, `executorKind:'tool-executor'`. The signed envelope is
written into `StoredTaskResult.metadata.toolResultAttestation` (OP-13). **Fail closed:** if
`attestResult` is set + anchor pinned but signing throws (key unresolvable, canonicalization deny), the
commit **rejects** (mirrors the `signed_breakpoint_rejected` throw, `:279-289`) — an effect that was
required to be attested but could not be leaves the run unable to advance rather than committing an
unproven result.

**Where the key lives.** The executor private key is resolved by `resolveToolExecutorSigner` from the
off-agent env/deploy pin (OP-10) — **not** from the run directory, **not** from `task.json`, **not** from
any workspace file the agent can write. The `commitEffectResult` code runs in the SDK **runtime**
process; the orchestrating agent's *reasoning context* is the LLM conversation, which never sees
`process.env[POLICY_TOOL_EXECUTOR_KEY]`. **Honest boundary (OP-B1, mirrors base §4.2/§6.4-6.5):** if a
deployment runs the SDK runtime **in the same process/trust domain as the agent that can execute
arbitrary code** (e.g. the agent can `require` the SDK and read `process.env`), this signer is
**correlation-grade**, not authoritative — a fully-compromised in-process agent could read the key. It
is authoritative only when the SDK runtime holds the key in a domain the agent's code cannot reach
(separate process/user, KMS-backed signer, or the spawn-layer signer below). This is stated in code
(the `tool-executor` root carries an optional `producer: 'sdk-commit' | 'spawn-layer'` discriminant,
mirroring the shipped `engine` root's `producer: 'proxy' | 'in-process'` at
`verify-envelope-trusted.ts:101`) and in docs.

### 5.3 OP-12 — Spawn-layer signer (at process exit)

**Where.** `packages/adapters/core/src/spawn-runner.ts`, in the `child.on('exit', ...)` handler
(`spawn-runner.ts:591-613`) / `cleanupAndFinalize` (`:568-589`), where the real exit code, and the
accumulated stdout/stderr (`stderrBuf`, `:288`, and the streamed stdout) are known. The command + args
about to run are already computed as `spawnArgs.command` / `spawnArgs.args` (`:139`, `:159`) — the exact
argv the GATE-3 binding already hashes (`policy-spawn-gate.ts:127`, `spawn-runner.ts:135-141`). At exit,
the spawn signer builds the `ToolResultAttestationPayload` over the CAPTURED exit outcome and signs it
with the executor key resolved from the SAME manifest-verified gate context GATE 3 uses
(`resolveGate3Context` → `loadPolicyEnforcementGate`, `policy-spawn-gate.ts:70-96`). The signed
attestation is surfaced on the run result so the SDK stores it in the journal (OP-13) for the effect
that dispatched the spawn.

**Strongest isolation (OP-B2).** The spawn layer launches the process (`spawn(...)`,
`spawn-runner.ts:231`); the executor key lives in the adapters-layer process, distinct from the
harness/agent it spawns as a **child** — the child (the agent/tool) cannot read its parent's
`process.env` or memory. This is the **authoritative** producer for harness/sandbox-run tools, the
outcome-proof analogue of the transport-proxy attestation (base §4.2/§6.1). Marked
`producer:'spawn-layer'` on its `tool-executor` root.

**Both signers, one consumer.** Because both emit a `SignedEnvelope<ToolResultAttestationPayload>`
verified through the identical `verifyToolResultTrusted` path (OP-6) against the identical
`tool-executor` kind, the policy evaluator (OP-16) and the process gate (OP-19) neither know nor care
which produced a given proof. A policy MAY require the authoritative producer specifically via
`requireExecutorProducer: 'spawn-layer'` (OP-18), exactly as `requireProxyAttestation` narrows
model-decision producers (`policy-evaluator.ts:224-230`).

### 5.4 OP-13 — How the attestation rides the effect result / journal

The attestation is stored at `StoredTaskResult.metadata.toolResultAttestation`
(`packages/babysitter-sdk/src/storage/types.ts:119-141`; `metadata` is a `JsonRecord`, already
stable-cloned by `serializeTaskResult`, `serializer.ts:167`). It therefore travels with the effect
result and is replayable from the append-only journal — the same durable artifact the process gate reads
(OP-19). The SDK-commit signer writes it inline before `serializeAndWriteTaskResult`
(`commitEffectResult.ts:44-69`); the spawn signer's envelope is threaded back through the effect result
the caller commits, so it lands in the same `metadata` slot. **OP-13** is: a valid attestation for an
`attestResult` effect is present at `StoredTaskResult.metadata.toolResultAttestation`, byte-stable across
replay.

---

## 6. The `tool-result` policy step + result predicates (Milestone H, consumer A)

### 6.1 OP-16 — New step kind `tool-result`, expressible with NO evaluator code change to add a policy

**OP-16** adds `'tool-result'` to `EvidenceStepKind` (`policy-schema.ts:23`) and to
`KIND_TO_EVIDENCE_KIND` (`policy-evaluator.ts:177-181`) and to the `Evidence.kind` union
(`policy-evaluator.ts:42-45`). A `tool-result` requirement is satisfied by an `Evidence` of kind
`tool-result` whose envelope verifies via `verifyEnvelopeTrusted(envelope, 'tool-result', store,
allowedFingerprints)` (the shipped `evidenceSatisfiesStep` path, `policy-evaluator.ts:241-267`) AND whose
**result predicates** hold (OP-17). Once the step kind + predicates exist, **adding a new
tool-result-gated policy is pure YAML** — no code change — because it flows through the same
`normalizeTypedStep`/`satisfyTypedStep`/`evaluateChain` machinery as every other step
(`policy-schema.ts:117-129`, `policy-evaluator.ts:277-307`, `:424-469`).

### 6.2 OP-17 — Result predicates on the verified attestation

Result predicates are declared in the step's `conditions` (the shipped `StepConditions` escape-hatch is
already open-ended, `policy-schema.ts:26-41`) and evaluated in `conditionsHold`
(`policy-evaluator.ts:110-146`) with a new `tool-result` branch. All predicates run **only after** the
envelope is verified (OP-6), so they read signed fields:

- **`exitCode`** — `require.exitCode` MUST equal `payload.exitCode` (**OP-17a**).
- **`stdoutHash` / `stderrHash`** — an exact expected hash MUST equal the signed hash (**OP-17b**).
- **`stdoutMatches` / `stderrMatches`** — a full-string-anchored regex (compiled like `modelIdMatches`,
  `policy-evaluator.ts:120-128`) over the captured output; requires the raw output be carried alongside
  the proof and re-hashed to the signed `stdoutHash` before matching, else deny (the proof binds the
  hash; pattern-match is over the hash-verified bytes) (**OP-17c**).
- **`freshness` / expiry** — `now - finishedAt <= maxAgeMs` (from the step) AND, when the step sets
  `notExpired`, honored via the existing `notExpired` operator convention (**OP-17d**).
- **command/args binding** — `commandMatches` (regex over the recomputed canonical argv, tokenized by
  the SHARED `canonicalizeArgv`) and/or `argsHashEquals` MUST match `payload.commandHash`/`argsHash`
  (**OP-17e**) — this is what makes the wrong-command-swap attack (§7 OP-T2) impossible: the proof's
  bound `commandHash` must match the required command, not a different command the agent ran.
- **`signedBy: tool-executor`** — enforced structurally by the kind→`tool-executor` mapping (OP-5); a
  step MAY also set `requireExecutorProducer` (OP-18).

Any predicate miss → the requirement is unsatisfied → the chain does not grant → deny (fail closed, the
shipped `evaluateChain` returns unsatisfied at the first miss, `policy-evaluator.ts:443-447`).

### 6.3 OP-18 — `requireExecutorProducer` (authoritative vs correlation-grade at the policy layer)

Mirroring the shipped `requireProxyAttestation` (`policy-schema.ts:83-85`,
`policy-evaluator.ts:224-230`, `:259-264`), a `tool-result` step MAY set `requireExecutorProducer:
'spawn-layer'` to accept only attestations signed by the authoritative spawn-layer producer, rejecting
the correlation-grade SDK-commit producer. **Default:** for any action whose `match` names a
`credentialScope` (i.e. can inject a scoped credential), `requireExecutorProducer` defaults to
`'spawn-layer'` (authoritative), matching the AC-39 credential-default posture; non-credential actions
default to accepting either producer. An explicit value opts out. This makes the honesty boundary of
§5.2/OP-B1 enforceable in policy.

### 6.4 OP-19-A — Worked example (the mandated "authorize aws deploy only if npm test provably passed")

```yaml
version: 1
authorizationTtlSeconds: 120
commandDefaultAllow: false
defaultDeny: ["aws:*"]
actions:
  - id: aws-deploy-if-tests-passed
    match:
      tool: Bash
      argv:
        program: aws
        subcommandEquals: ["deploy"]
      credentialScope: "aws:prod:deploy"
    # credentialScope present ⇒ requireProxyAttestation defaults true (model step)
    #                        ⇒ requireExecutorProducer defaults 'spawn-layer' (tool-result step, OP-18)
    chains:
      - id: human-opus-and-tests-passed
        requirements:
          - step: { kind: human-approval }                       # a person approved   (precondition)
          - step:
              kind: model-decision
              conditions: { modelIdMatches: "^claude-opus-" }    # opus decided        (precondition)
          - step:
              kind: tool-result                                   # AND tests provably passed (OUTCOME PROOF)
              conditions:
                commandMatches: "^npm(\\s+run)?\\s+test\\b"       # binds proof.commandHash (OP-17e)
                require: { exitCode: 0 }                          # OP-17a
                maxAgeMs: 1800000                                 # 30-min freshness (OP-17d)
                requireExecutorProducer: "spawn-layer"            # authoritative only (OP-18)
              # signedBy: tool-executor is structural (OP-5)
```

The `aws deploy` command is authorized only if the evidence set for the call contains a valid
`tool-executor`-signed `ToolResultAttestation` whose bound `commandHash` matches `^npm ... test` and
whose signed `exitCode` is 0, in addition to the human-approval + opus model-decision preconditions.
The `tool-result` evidence is bound into the resulting `CommandAuthorization`'s `evidenceStepBindings`
(`policy-evaluator.ts:448-452`) exactly like every other evidence, so the gate confirms it enforced the
proven-test precondition.

---

## 7. The babysitter-process gate: `attestResult` + `requireProof` (Milestone H, consumer B)

### 7.1 OP-20 — `attestResult` task option

**OP-20** adds an `attestResult?: boolean` option to shell/tool task definitions (surfaced on the task
metadata written by `serializeAndWriteTaskDefinition`, `serializer.ts:90-129`, and read back in
`commitEffectResult` at `:335`). When `attestResult:true` and the anchor is pinned, the SDK-commit
signer (OP-11) attaches a `ToolResultAttestation` to the effect result (OP-13). When the anchor is not
pinned, `attestResult` is inert (no attestation; back-compat). `attestResult` is **not** the security
boundary — it declares *intent to attest*; the trust comes from the executor key + manifest anchor
(OP-9), which the agent cannot forge.

### 7.2 OP-19 — The `ctx.requireProof` intrinsic (a step BLOCKS without a matching valid attestation)

**OP-19** adds a `requireProof` intrinsic to `babysitter-sdk`, registered in
`packages/babysitter-sdk/src/runtime/intrinsics/index.ts` and exposed as `ctx.requireProof(...)`
alongside the shipped `ctx.task` / `ctx.breakpoint` (`runtime/intrinsics/task.ts`, `.../breakpoint.ts`).
It scans the append-only journal / task results of the current run for a `StoredTaskResult` carrying
`metadata.toolResultAttestation` (OP-13) that:

1. verifies via `verifyToolResultTrusted(envelope, store, ...)` against the manifest-verified
   `tool-executor` roots (OP-6/OP-9) — the store is loaded through the same
   `loadTrustedBreakpointPolicy`-style dynamic-import path (`trusted-breakpoint-policy.ts:218-246`) so
   the SDK's CJS build stays clean (OP-28); **and**
2. satisfies the caller's predicates (`command` regex → `commandHash` binding, `result.exitCode`,
   freshness, `signedBy`/`requireExecutorProducer`) — the **same** predicate set as OP-17, shared code;
   **and**
3. is bound to **this** run (`payload.runId === current runId`, OP-14) and is fresh (OP-14).

If a matching valid attestation exists → `requireProof` resolves and the process advances. If none
exists → the intrinsic **throws** (`RunFailedError`, the shipped fail-closed exception used at
`commitEffectResult.ts:279`), so **the step blocks**. An orchestrator that did not actually run the
command (no attestation), or ran it with a failing result (`exitCode !== 0` → predicate miss), or ran a
different command (`commandHash` mismatch), **cannot advance** — the requirement is checked against a
signed artifact, never the agent's narrative.

Copy-pasteable:

```js
// The step that runs the tests emits a signed proof as part of its effect result.
const test = await ctx.task({ kind: 'shell', command: 'npm test', attestResult: true });

// A later step / breakpoint gate requires the signed proof — not the agent's word.
await ctx.requireProof({
  command: /^npm(\s+run)?\s+test\b/,   // binds the proof's commandHash (OP-17e)
  result:  { exitCode: 0 },            // OP-17a
  maxAgeMs: 1_800_000,                 // freshness (OP-17d / OP-14)
  signedBy: 'tool-executor',           // structural (OP-5)
  // requireExecutorProducer: 'spawn-layer',  // opt in to authoritative-only (OP-18)
});
// → no valid executor-signed attestation in the journal for THIS run → the step throws → blocks.
```

### 7.3 OP-21 — Single-use consumption where required

A `requireProof` call MAY set `singleUse:true`; when so, the consumed attestation's
`toolCallId`+`runId`+`finishedAt` triple is recorded in the run's proof-consumption ledger (OP-27) and a
second `requireProof` for the same triple denies — preventing one genuine proof from satisfying two
distinct gates that each demanded a fresh execution. Default is multi-use (a proof of a fact can be read
by several observers) unless the caller declares the fact must be freshly produced per gate.

### 7.4 OP-22 — Optional proof-gated breakpoint auto-approval

The shipped breakpoint auto-approval engine (`evaluateAutoApproval`, wired at
`runtime/intrinsics/task.ts:163-177`; rules from `breakpoints/rules.ts`) is a natural consumer.
**OP-22** adds a `requireProof` clause to an auto-approval rule: a breakpoint auto-approves **only if** a
matching valid `ToolResultAttestation` exists (evaluated through the same OP-19 verify + predicate path).
Without a matching proof, the rule does not fire and the breakpoint falls through to human input — so an
auto-approval cannot be driven by an agent's unproven claim. This is additive to the existing rules
engine; absent the clause, behavior is unchanged.

---

## 8. Threat model (Milestone H test targets)

Each row is a stable-id AC with the blocking mechanism grounded in shipped code, and an honest boundary
where the guarantee is only correlation-grade.

- **OP-T1 — forged / never-ran result.** The orchestrator emits "tests passed" it never ran. **Blocked:**
  no `tool-executor`-signed attestation exists in the journal (OP-13); `requireProof`/`tool-result`
  step deny (OP-19/OP-16). The agent cannot mint one — the executor key is off-agent (OP-9), and
  `verifyEnvelopeTrusted` resolves keys only from the manifest-verified store, rejecting any non-executor
  key (OP-7). *Boundary:* authoritative only for the spawn-layer producer or an out-of-process SDK
  runtime; correlation-grade if the SDK runtime shares the agent's process (OP-B1).
- **OP-T2 — wrong-command swap.** The agent presents a real proof of a *different* command as the
  required one. **Blocked:** the proof binds `commandHash`/`argsHash` (OP-2) over the shared canonical
  argv; the step/gate's `commandMatches`/`argsHashEquals` predicate (OP-17e) must match the bound hash,
  and the policy argv matcher is the anti-evasion `matchArgv` (`policy-evaluator.ts:509-547`) — a
  disguised wrapper (`sh -c`, `$(...)`) is denied, not matched.
- **OP-T3 — replay / staleness.** The agent replays a stale proof from an old run/step. **Blocked
  (OP-14):** the payload binds `runId`/`sessionId`/`toolCallId` (in `signedFields`, OP-5) and the
  consumer requires `payload.runId === current runId` + `now - finishedAt <= maxAgeMs` (OP-17d);
  `singleUse` (OP-21) prevents intra-run double-satisfaction where the gate demands a fresh execution.
- **OP-T4 — tamper (stored attestation or trust roots).** The agent edits the stored envelope or the
  trust-roots file. **Blocked:** editing the envelope invalidates the Ed25519 signature (OP-6 step g);
  editing `.policy/trust-roots.json` fails the config-manifest hash/epoch check (`config-manifest.ts:88-123`,
  base §10.1 AC-46/47) → deny-all. The pins (`POLICY_CONFIG_ROOT_FP`, `POLICY_CONFIG_MIN_EPOCH`) are
  off-workspace (OP-9).
- **OP-T5 — key reachability (both signers).** *SDK-commit signer:* key at
  `POLICY_TOOL_EXECUTOR_KEY[_PATH]`, resolved in the SDK **runtime** process, not the LLM reasoning
  context, not `task.json`, not any workspace file (OP-11). **Honest boundary (OP-B1):** if the agent
  can execute code in the SDK runtime's process, it can read the key → correlation-grade; authoritative
  only when the key is in a domain the agent's code cannot reach. *Spawn-layer signer:* key in the
  adapters parent process; the spawned agent is a child that cannot read the parent's env/memory →
  **authoritative** (OP-B2). Policy/gate can require the authoritative producer (OP-18).
- **OP-T6 — TOCTOU (capture-then-sign).** A result changes between running and attesting. **Blocked
  (OP-15):** both signers sign over the **captured** result at capture time — the SDK signer over the
  bytes `buildResultPayload` already froze (`commitEffectResult.ts:444-466`), the spawn signer over the
  captured `exitCode`/`stderrBuf`/stdout at the `exit` event (`spawn-runner.ts:591-613`). The signed
  `stdoutHash`/`stderrHash` bind those exact bytes; a later re-read that differs cannot match.
- **OP-T7 — cross-kind / cross-payload-type confusion.** A `model-decision` or `command-authorization`
  envelope presented as a `tool-result`. **Blocked:** `payloadType` domain separation (OP-3) + kind
  binding (OP-7) — no non-`tool-executor` root and no non-`tool-result-attestation` payload satisfies a
  `tool-result` step.

---

## 9. Milestone map & AC index

| AC | What | Milestone |
|----|------|-----------|
| OP-1 | Extend `ToolResultPayload` → `ToolResultAttestationPayload` (bound fields) | **F** |
| OP-2 | `argsHash`/`commandHash`/`stdoutHash`/`stderrHash` via shared canonicalizers | **F** |
| OP-3 | `payloadType` bound in `signedFields` (domain separation) | **F** |
| OP-4 | `tool-executor` trust-root kind added to `TrustRootKind` | **F** |
| OP-5 | `tool-result` `EvidenceKind` + required-fields + kind mapping | **F** |
| OP-6 | `verifyEnvelopeTrusted`/`verifyToolResultTrusted` resolves + kind-checks executor | **F** |
| OP-7 | Cross-kind rejection: no non-executor key satisfies `tool-result` | **F** |
| OP-8 | Expiry / revocation of the executor root honored | **F** |
| OP-9 | Verify + key anchored to manifest-verified config, never agent input | **F** |
| OP-10 | `ToolExecutorSigner` interface + `resolveToolExecutorSigner` | **F** |
| OP-11 | SDK-commit signer wired into `commitEffectResult` (fail-closed) | **G** |
| OP-12 | Spawn-layer signer wired into `spawn-runner` process exit (authoritative) | **G** |
| OP-13 | Attestation rides `StoredTaskResult.metadata.toolResultAttestation` | **G** |
| OP-14 | Replay binding: `runId`/`sessionId`/`toolCallId` + freshness | **G**/**H** |
| OP-15 | TOCTOU: sign over captured result at capture time | **G** |
| OP-16 | `tool-result` policy step type (no evaluator change to add a policy) | **H** |
| OP-17 | Result predicates (exitCode/hash/pattern/freshness/command-args binding) | **H** |
| OP-18 | `requireExecutorProducer` (authoritative vs correlation-grade in policy) | **H** |
| OP-19 | `ctx.requireProof` intrinsic — step BLOCKS without a valid attestation | **H** |
| OP-19-A | Worked "aws deploy only if npm test passed" policy YAML | **H** |
| OP-20 | `attestResult` task option | **H** |
| OP-21 | Single-use proof consumption where required | **H** |
| OP-22 | Optional proof-gated breakpoint auto-approval | **H** |
| OP-27 | Proof-consumption ledger reuse (extend the spine) | **H** |
| OP-28 | Architecture-boundary + metadata/lockfile constraints honored | **F/G/H** |
| OP-30 | Non-goals | — |

Every `OP-N` maps to exactly one of F (attestation-core), G (producers), H (consumers), except OP-14
(payload field is F/G, freshness check is H) and OP-28 (a cross-cutting build constraint).

---

## 10. Reuse ledger, boundaries, constraints (OP-27 / OP-28)

**OP-27 — reuse the spine; no new package.**

| Concern | Reused / extended artifact (file) | New? |
|---------|-----------------------------------|------|
| Signed envelope + canonical form | `trust-core/src/signing.ts:24-65` | reuse |
| Tool-result payload + sign/verify | `trust-core/src/tool-signing.ts:4-34` | **extend** (add bound fields + `payloadType`) |
| Shared arg/argv/output hashing | `policy/src/canonicalize-args.ts:77-85` | reuse |
| Trusted-store verify + kind check | `policy/src/verify-envelope-trusted.ts:237-329` | **extend** (add `tool-executor`/`tool-result`) |
| Config-manifest anchor | `policy/src/config-manifest.ts:67-133` | reuse |
| Policy schema + evaluator | `policy/src/policy-schema.ts`, `policy-evaluator.ts` | **extend** (`tool-result` step + predicates) |
| Executor signer | `policy/src/tool-executor-signer.ts` | **NEW module** (in existing package, not a new package) |
| SDK-commit signer | `babysitter-sdk/src/runtime/commitEffectResult.ts:44-99,223-291` | **extend** |
| Spawn-layer signer | `adapters/core/src/spawn-runner.ts:568-613`; gate ctx `policy-spawn-gate.ts:70-96` | **extend** |
| Attestation storage | `babysitter-sdk/src/tasks/serializer.ts:150-185`; `storage/types.ts:119-141` | reuse (`metadata`) |
| `requireProof` intrinsic | `babysitter-sdk/src/runtime/intrinsics/` | **NEW intrinsic** (extends the intrinsic set) |
| Proof-consumption ledger | reuse the run journal / a `.a5c` run-scoped index (no new store) | reuse |
| Proof-gated auto-approval | `babysitter-sdk/src/breakpoints/evaluator.ts` (wired `task.ts:163-177`) | **extend** (optional clause) |

The **only genuinely new modules** are `policy/src/tool-executor-signer.ts` and the `requireProof`
intrinsic file — both **inside existing packages**. **No new package** is created (OP-30). If a future
deployment needs a standalone out-of-process executor daemon, that would be a new package and must be
classified + `private:true` + metadata-passing (`scripts/check-package-metadata.cjs`) — explicitly out
of scope here.

**OP-28 — architecture-boundary + metadata/lockfile constraints.**
- Crypto stays in `trust-core` (support-systems leaf, `packages/trust-core/package.json`
  `private:true`, `type:commonjs`); `trust-core` gains **no** dependency on `policy-adapter` — the
  producers compute the shared hashes in the SDK/adapters layers (which already reach `policy-adapter`)
  and hand a finished payload to `signToolResult` (OP-2). The pre-push
  `scripts/check-architecture-boundaries.cjs` gate is respected: **no `dispatch-core →
  orchestration-core` edge** is introduced. `babysitter-sdk` consumes `policy-adapter` (ESM) only via
  **dynamic `import()`**, the proven pattern at `trusted-breakpoint-policy.ts:218-226` and
  `policy-spawn-gate.ts:76` — no new static ESM edge in the CJS SDK build.
- Windows lockfile: no bare `npm install`; use `--package-lock-only`, verify no win32 pins (project
  memory: Windows npm install pollutes lockfile).
- Any new package would need metadata-passing; we add none (OP-30).
- Tests-first, frozen; adversarial security review at each crypto/enforcement milestone; introduce no
  NEW `babysitter-sdk` test failures (7 known pre-existing session-state/`task_cancel` failures are
  unrelated and not counted). Commit specific product files only; never `.a5c/**` or lockfiles in agent
  commits.

---

## 11. Non-goals (OP-30, consolidated)

- No new package; no third evaluator; no online executor-key revocation beyond manifest-epoch + `revoked`.
- No semantic interpretation of stdout/stderr content beyond declared predicates.
- No attestation of executions outside the two shipped seams (SDK commit, spawn exit) — anything else is
  unproven and denies.
- No claim of authoritative-grade for an in-process SDK-commit signer sharing the agent's process; that
  configuration is documented correlation-grade (OP-B1) and a policy/gate may require the authoritative
  spawn-layer producer (OP-18).
