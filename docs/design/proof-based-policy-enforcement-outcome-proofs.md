# Proof-Based Policy Enforcement — Outcome Proofs (Execution Attestation) Design Specification

Status: **Draft 2** (2026-07-04). Frozen input: `.a5c/processes/outcome-proofs.brief.md`.
Supersedes Draft 1, which an adversarial review (score 34) **failed** on a FATAL producer-seam
flaw (see §0.1). Draft 2 **redesigns the producer model** and leaves the sound Milestone-F
verify/consume mechanics unchanged. This spec adds the **outcome-proof / execution-attestation**
direction to the shipped proof-based policy-enforcement system (Milestones A–E, the *precondition*
direction). Every decision cites the exact file it extends; every acceptance criterion (AC) has a
stable id `OP-N` that is independently testable.

Read the base spec first: [`docs/design/proof-based-policy-enforcement.md`](./proof-based-policy-enforcement.md)
(especially §4.2 authoritative-vs-correlation-grade, §6 producer strategy + honesty boundaries,
§10.1 the out-of-agent config root of trust) and the overview
[`docs/proof-based-policy-enforcement-overview.md`](../proof-based-policy-enforcement-overview.md) §5.

---

## 0. Summary

The shipped feature answers *"may this command run?"* via **precondition proofs**: evidence
(human-approval, model-decision, delegation) → `verifyEnvelopeTrusted` → `CommandAuthorization` →
gate. This increment answers the complement — *"can I prove this command ran, and what it
returned?"* — via **outcome proofs**: a signed `ToolResultAttestation` binding an exact invocation
to its exact observed outcome, produced by an executor that **actually ran the command**, using a
key the *orchestrating / deciding* agent does not hold. Two consumers:

- **(A) Policy evidence** — a later policy chain requires a `tool-result` step (e.g. authorize
  `aws deploy` only if a signed proof that `npm test` provably exited 0 exists).
- **(B) Babysitter-process gate** — a process step gates on `ctx.requireProof(...)`; the
  orchestrating agent cannot fabricate "tests passed" to advance, because the journal must carry a
  valid **executor-signed** attestation over an execution the SDK itself performed and observed.

**The core property is DATA PROVENANCE, not key-reachability.** A proof is worth exactly as much as
*who observed the execution*. An attestation over a value the executor did **not** itself observe is
worthless no matter how well its signing key is isolated. Draft 1 got this backwards; §0.1 is the
correction.

### 0.1 What Draft 1 got FATALLY wrong (the producer-seam flaw)

Draft 1 named two producers and treated both as authoritative-capable. **Both were unimplementable
for the mandated guarantee, because neither producer ever observes the command whose outcome it
claims to attest.** Grounded in the shipped code:

- **The babysitter SDK runtime does NOT execute shell commands.** A `ctx.task({ kind: 'shell', … })`
  compiles to a `TaskDef` and an `EFFECT_REQUESTED` journal event (`runtime/intrinsics/task.ts:120`,
  `:191-212`) — a *request*. The orchestrating agent runs the command out-of-band and reports the
  outcome back via `babysitter task:post --status ok --value … --stdout-file …`
  (`cli/main/taskCommands.ts:123-249`). `commitEffectResult` then signs — in Draft 1 — `options.result`
  (`commitEffectResult.ts:44`, `buildResultPayload` `:444-466`), i.e. **agent-fabricated data**. A
  compromised agent posts `exitCode:0` for a command it never ran, or that failed, and the
  "SDK-commit signer" faithfully signs the lie. *Key isolation is irrelevant:* the signer signs
  attacker-chosen content regardless of where the key lives, because the content **is** the
  `task:post` payload. Draft 1's "SDK-commit signer" is therefore **NOT an outcome proof of any
  grade.** It is removed in Draft 2 (§0.2, OP-11-DEL).
- **The spawn-layer signer attests the HARNESS invocation, not an inner command.** `spawn-runner.ts`
  launches the *harness/agent* as its child (`spawn(invocationCmd.command, invocationCmd.args, …)`,
  `spawn-runner.ts:231`, where `invocationCmd.command` is e.g. `claude`/`codex` or `docker run … <image>`
  `spawn-invocation.ts:276-388`) and observes *that process's* exit (`child.on('exit', …)` `:591-613`).
  It genuinely observes an execution — but the execution is **the harness**, whose argv is `claude …`,
  **not** an inner `npm test` the agent may (or may not) have run inside it. So the spawn-layer signer
  can honestly attest *"the harness ran with this exact invocation and exited N"* — a real, useful,
  **coarser** fact — but it **cannot** satisfy the mandated `npm test` example. Draft 1 mislabeled it
  as able to. Draft 2 keeps it with honest, correct scope (§5.3).

**Consequence:** the mandated example — *authorize `aws deploy` only if `npm test` provably passed* —
was **unimplementable by either Draft-1 producer.** The fix is not better key custody. The fix is a
producer that **owns execution**: an SDK seam that *itself* runs `npm test`, captures the real
outcome, and signs over what it observed.

### 0.2 The Draft 2 producer model (redesigned)

One new trust-root kind `tool-executor`. One `ToolExecutorSigner` interface, with **two** concrete
signers whose scopes are now HONEST and DISJOINT:

1. **Proven-execution runner (NEW, authoritative for the inner-command guarantee).** A new attested
   execution seam — a `kind: 'proven-shell'` effect — that the babysitter **SDK runtime itself
   executes** via `node:child_process` (`execFileSync`) in the SDK's own trust domain, captures the
   REAL `exitCode`/`stdout`/`stderr` it observed, and signs a `ToolResultAttestation` over **what IT
   ran and observed** — never over any `task:post`-supplied value. This is the authoritative producer
   for *"did THIS command actually run and return X"* and is what makes the `npm test` example
   implementable. §5.2 specifies it precisely; it is the only genuinely new execution seam and the
   heart of Draft 2.
2. **Spawn-layer signer (kept, honest coarser scope).** The adapters spawn layer that actually
   launches a process (`spawn-runner.ts`) signs, at process exit, over the **exact process it
   launched** — the harness invocation argv. It attests *"the harness ran with this exact invocation
   and exited N"*, which is a **different (coarser) granularity** than an inner command and is
   therefore **NOT** what satisfies the `npm test` example. Useful where the whole harness run *is*
   the thing to attest. §5.3.

**REMOVED (OP-11-DEL):** the Draft-1 "SDK-commit signer that signs the agent-reported `task:post`
value." It is deleted entirely — not kept as a weak variant. **Signing an agent-reported value is not
an outcome proof of any grade**, and the OP-B1 "correlation-grade" framing that overclaimed it in
Draft 1 is deleted with it. `commitEffectResult` is NOT modified to sign `options.result` (§5.4).

Both remaining signers unify under one `ToolExecutorSigner` interface and one `tool-executor`
trust-root kind so the policy evaluator + process gate consume attestations identically regardless of
producer (§4).

**Reuse posture.** No new package. The crypto payload extends the shipped primitive
`ToolResultPayload`/`signToolResult`/`verifyToolResult` in `@a5c-ai/trust-core`
(`packages/trust-core/src/tool-signing.ts`) rather than forking it; the trust-root kind, the
trusted-store resolver, and the policy step extend `@a5c-ai/policy-adapter`; the proven-execution
runner and the process gate are new modules **inside `babysitter-sdk`** (§5.2, §7); the spawn-layer
signer extends `spawn-runner`. Everything fails closed, no fallbacks (repo rule).

---

## 1. Goals, non-goals, milestones

### 1.1 Goals
- Make **execution itself** attestable by an executor that **observed** it: a signed proof that a
  specific command, with specific args, ran and returned a specific outcome — where the signer is the
  process that actually ran it.
- A **proven-execution seam owned by the SDK** (`kind: 'proven-shell'`) so the authoritative
  inner-command guarantee (the `npm test` example) is implementable, not just described.
- Two consumers of the proof, over the **same** verified `ToolResultAttestation`: a `tool-result`
  policy step (A) and a `ctx.requireProof(...)` process gate (B).
- Byte-identical binding with the precondition path: `argsHash`/`commandHash` via the **shared**
  `canonicalizeArgs`/`commandHash` (`packages/adapters/policy/src/canonicalize-args.ts`), so an
  outcome proof and a `CommandAuthorization` for the same call agree bit-for-bit.
- Pluggable executor: one interface, two signers of disjoint honest scope, one trust-root kind, one
  verify path.

### 1.2 Non-goals (**OP-30**)
- **No new package** (extend `trust-core` + `policy-adapter`; add the proven-execution runner +
  `requireProof` intrinsic to `babysitter-sdk`). A new package would need `private:true` +
  metadata-passing (`scripts/check-package-metadata.cjs`); we avoid it.
- **No third engine.** The `tool-result` step is evaluated by the existing `evaluatePolicy`
  (`packages/adapters/policy/src/policy-evaluator.ts`), not a new evaluator.
- **No online revocation of executor keys** beyond the shipped `revoked`/`expiresAt` + manifest-epoch
  mechanism (same posture as A–E, §10.1 AC-27).
- **No result-*content* semantic validation** beyond the declared predicates (exitCode, hash/pattern,
  freshness, command/args binding). We do not interpret stdout meaning; we bind its hash.
- **No attestation of a tool the SDK/spawn layer did not itself execute.** The proof is only ever
  over an execution one of the two seams **performed and observed**. An agent-reported `task:post`
  value is never attested (OP-11-DEL). Anything else is unproven → the gate/step denies (§7 OP-B4).
- **NOT in scope: workspace-script integrity.** The proven-execution runner attests that *the exact
  argv it ran* returned exit 0. It does **not** prove the *meaning* of that argv: if the agent has
  write access to the workspace's own `package.json` test script, it can make `npm test` a no-op that
  exits 0. That is an orthogonal supply-chain concern (§8 OP-T8), out of scope here and stated plainly.

### 1.3 Milestones
- **Milestone F — attestation-core** (`trust-core` + `policy-adapter`): the payload, the
  `tool-executor` trust-root kind, the trusted-store verify path. **Unchanged from Draft 1 — sound.**
- **Milestone G — producers** (`babysitter-sdk` proven-execution runner + `adapters/core` spawn
  signer): the SDK **executes and observes** the command and signs (proven-shell); the spawn layer
  signs over the harness process it launched. **Redesigned in Draft 2.**
- **Milestone H — consumers** (`policy-adapter` step + `babysitter-sdk` process gate): the
  `tool-result` policy step + result predicates, and `ctx.requireProof` + optional proof-gated
  breakpoint auto-approval. **Unchanged from Draft 1 — sound.**

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
   ┌─────────────── PRODUCERS (Milestone G, fail-closed, anchor-pinned) ───────────────────────────┐
   │  (1) PROVEN-EXECUTION RUNNER  babysitter-sdk  — the SDK RUNTIME ITSELF runs `execFileSync`,    │
   │        captures REAL exitCode/stdout/stderr, signs ToolResultAttestation over WHAT IT OBSERVED │
   │        (never over any task:post value) → StoredTaskResult.metadata. AUTHORITATIVE for the     │
   │        inner-command guarantee.                                                                │
   │  (2) SPAWN-LAYER SIGNER  spawn-runner.ts (process exit) — signs over the exit of the EXACT      │
   │        HARNESS PROCESS it launched (commandHash = launched argv). Attests the HARNESS run,      │
   │        a coarser fact — NOT an inner command.                                                  │
   │  (X) [REMOVED] the Draft-1 "sign agent-reported task:post value" producer — OP-11-DEL.          │
   └───────────────────────────────────────────────────────────────────────────────────────────────┘
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
`packages/trust-core/package.json`). `policy-adapter` (ESM) hosts the trusted-store resolver, the
`ToolExecutorSigner` resolver, and the policy step. `babysitter-sdk` consumes `policy-adapter` via
**dynamic `import()`** — the exact pattern `trusted-breakpoint-policy.ts:218-226` already uses — so no
static ESM edge is added to the CJS SDK build and no `dispatch-core → orchestration-core` edge is
created (§8, OP-28).

---

## 3. The `ToolResultAttestation` payload (Milestone F — unchanged from Draft 1)

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
  // WHAT the executor ran (bound by hash over the argv the EXECUTOR actually ran — never asserted):
  toolName: string;
  toolCallId: string;
  commandHash: string;                       // sha256(canonicalizeArgv(argv the executor ran)) — OP-2
  argsHash: string;                          // sha256(canonicalizeArgs(args the executor ran))  — OP-2
  // WHAT the executor OBSERVED it return:
  exitCode: number;
  stdoutHash: string;                        // sha256 of the stdout bytes the EXECUTOR captured (OP-2)
  stderrHash: string;                        // sha256 of the stderr bytes the EXECUTOR captured (OP-2)
  // WHEN:
  startedAt: string;                         // ISO
  finishedAt: string;                        // ISO
  durationMs: number;
  // WHERE (replay binding, OP-14):
  runId: string;
  sessionId: string;
  // WHO decided (optional link to the precondition path, §4.2 A–E of the base spec):
  modelDecisionFingerprint?: string;
  // WHO executed + AT WHAT GRANULARITY (honest scope, OP-B-PRODUCER):
  executorKind: 'tool-executor';
  producer: 'proven-shell' | 'spawn-layer';  // OP-B-PRODUCER: the seam that OBSERVED the execution
  attestationScope: 'inner-command' | 'harness-invocation'; // what the commandHash names (§5.2/§5.3)
}
```

`ToolResultPayload` (the shipped shape) is retained for back-compat; the attestation payload is a
new, fully-bound superset. `signToolResult` is generalized to sign the attestation payload with an
explicit `fields` list (the existing `signPayload(privateKey, fingerprint, payload, fields)` third
argument, `signing.ts:24-30`) so `payloadType`, `producer`, and `attestationScope` are provably in
`signedFields`.

### 3.2 OP-2 — Hashes via the SHARED canonicalizers, over what the EXECUTOR ran

`argsHash` and `commandHash` MUST be computed by the **single shared** helpers exported from
`@a5c-ai/policy-adapter` (`packages/adapters/policy/src/canonicalize-args.ts`):
`argsHash(value)` = `sha256(canonicalizeArgs(value))` (`canonicalize-args.ts:77-79`) and
`commandHash(command)` = `sha256(canonicalizeArgv(command).join('|'))` (`canonicalize-args.ts:82-85`).
This is the identical function the gate and the `CommandAuthorization` issuer use (base spec AC-52/53),
so an outcome proof's `argsHash`/`commandHash` are byte-identical to a `CommandAuthorization`'s for the
same call. **Critically, the argv fed to `commandHash` is the argv the EXECUTOR actually ran** — for
the proven-execution runner that is the exact `command`+`args` it passed to `execFileSync` (§5.2); for
the spawn-layer signer it is the launched harness `invocationCmd.command`+`args` (§5.3). `stdoutHash`/
`stderrHash` are `sha256` over the **captured** output bytes (the exact bytes the executor observed,
OP-15 TOCTOU). A non-representable arg (non-finite number) throws in `canonicalizeArgs`
(`canonicalize-args.ts:47-49`) → the producer **denies** (no proof), never coerces. Because
`trust-core` is a leaf and cannot import `policy-adapter`, the producers (in the SDK and adapters
layers, both of which already reach `policy-adapter` by dynamic import) compute the hashes with the
shared helper and hand the finished payload to `signToolResult`; `trust-core` never sees the
canonicalizer (preserving the leaf boundary, §8/OP-28).

### 3.3 OP-3 — `payloadType` + `producer` + `attestationScope` bound for domain separation

`payloadType: 'tool-result-attestation'` MUST be in `signedFields` and MUST equal that constant, so a
`ToolResultAttestation` cannot be replayed as, or confused with, a `command-authorization`,
`model-decision`, `config-manifest`, etc. `producer` and `attestationScope` are also bound so a
consumer can require the authoritative inner-command producer and reject a harness-scope proof
presented as if it were an inner-command proof (OP-18). This mirrors AC-51 and the shipped
`EXPECTED_PAYLOAD_TYPE`/`REQUIRED_SIGNED_FIELDS` maps in
`packages/adapters/policy/src/verify-envelope-trusted.ts:29-72`. See OP-6 for where the check lands.

---

## 4. The `tool-executor` trust-root kind + verify path (Milestone F — unchanged from Draft 1, sound)

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
`loadTrustStore`, `policy-schema.ts:318-333`, already forbids one fingerprint appearing twice). The
`tool-executor` root carries the same `producer` discriminant the shipped `engine` root uses
(`verify-envelope-trusted.ts:101`, `producer:'proxy'|'in-process'`) — here `producer:'proven-shell'|
'spawn-layer'` — so a policy can require the authoritative producer (OP-18).

### 4.2 OP-5 — New evidence kind `tool-result` + its `EvidenceKind` mapping

**OP-5** adds `'tool-result'` to the shipped `EvidenceKind` union
(`verify-envelope-trusted.ts:21-26`), to `EXPECTED_PAYLOAD_TYPE`
(`'tool-result' → 'tool-result-attestation'`), and to `REQUIRED_SIGNED_FIELDS`:

```ts
REQUIRED_SIGNED_FIELDS['tool-result'] = [
  'payloadType', 'toolName', 'toolCallId', 'commandHash', 'argsHash',
  'exitCode', 'stdoutHash', 'stderrHash', 'startedAt', 'finishedAt', 'durationMs',
  'runId', 'sessionId', 'executorKind', 'producer', 'attestationScope',
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
  fingerprint→material binding a raw verify omits;
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
**manifest-verified** `.policy/trust-roots.json`. The producers (OP-11/OP-12) resolve the trust roots
+ executor key through the SAME manifest-verification path A–E use: for the proven-execution runner,
the pinned `POLICY_CONFIG_ROOT_FP` + `POLICY_CONFIG_MIN_EPOCH` → `verifyConfigManifest`
(`packages/adapters/policy/src/config-manifest.ts:67`) → trust-roots, exactly as
`loadTrustedBreakpointPolicy` does (`trusted-breakpoint-policy.ts:161-290`); for the spawn signer, the
same `loadPolicyEnforcementGate(projectRoot)` gate context the shipped GATE 3 already resolves
(`policy-spawn-gate.ts:70-96`). A config file whose sha256 is not the manifest-bound one, a manifest
signed by anything but the pinned config root, or an epoch below the floor → deny-all (config-manifest
verifier, `config-manifest.ts:88-123`). **The executor public keys + trust roots are therefore never
taken from agent-writable input** — closing the same class of attack Milestone C closed for
breakpoints (`trusted-breakpoint-policy.ts:6-42`).

---

## 5. The `ToolExecutorSigner` interface + the two signers (Milestone G — redesigned)

### 5.1 OP-10 — The pluggable `ToolExecutorSigner` interface

```ts
// packages/adapters/policy/src/tool-executor-signer.ts  (NEW module in the EXISTING package)
export interface ToolExecutorSigner {
  readonly fingerprint: string;          // this executor's tool-executor fingerprint (in trust-roots)
  readonly producer: 'proven-shell' | 'spawn-layer';
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
`ToolExecutorSigner`s — the policy evaluator + process gate consume their output identically. The
resolved signer's `producer` is stamped into every payload it signs, so `attestationScope` and
`producer` cannot be forged onto a proof by a consumer (they are signed).

### 5.2 OP-11 — Proven-execution runner (`kind: 'proven-shell'`, NEW, authoritative)

**This is the heart of the Draft-2 redesign: a producer that OWNS EXECUTION.** The SDK runtime — not
the orchestrating agent — runs the command, observes the real outcome, and signs over what it observed.

**New task kind + dispatch (so the SDK, not the agent, executes).** We add a `kind: 'proven-shell'`
task and a new module `packages/babysitter-sdk/src/runtime/proven-shell/runner.ts` (the one genuinely
new execution seam). Unlike `kind: 'shell'` — which compiles to a *request* the agent fulfils
out-of-band (`intrinsics/task.ts:120,191-212`) — a `proven-shell` effect is **executed in-line by the
SDK runtime**:

- The intrinsic `runProvenShellIntrinsic` (new, alongside `runTaskIntrinsic`) resolves the effect not
  by emitting an `EFFECT_REQUESTED` for the agent to answer, but by invoking the runner **directly in
  the SDK runtime process**. The runner calls `node:child_process.execFileSync(command, args, {
  timeout, maxBuffer, cwd, env })` — **`shell:false`, argv form only** (no `sh -c`, so the agent
  cannot smuggle a different command through shell metacharacters; a `command` that is not a bare
  program is rejected, mirroring the anti-evasion `matchArgv` posture, `policy-evaluator.ts:509-547`).
- The runner captures the **real** `status` (exit code, or the thrown `error.status`/`error.signal`
  from a non-zero exit), the **real** `stdout` and `stderr` bytes it received, and the wall-clock
  `startedAt`/`finishedAt`. **These are the bytes the SDK itself observed** — there is no `task:post`
  in this path, so there is no agent-supplied value anywhere in the chain.
- The runner then builds the `ToolResultAttestationPayload`: `commandHash`/`argsHash` over the
  **exact `command`+`args` it passed to `execFileSync`** (shared canonicalizer, OP-2),
  `exitCode`/`stdoutHash`/`stderrHash` over what it captured, `attestationScope:'inner-command'`,
  `producer:'proven-shell'`, and signs via the resolved `ToolExecutorSigner` (OP-10). The signed
  envelope is written into `StoredTaskResult.metadata.toolResultAttestation` (OP-13) as the effect
  result is committed — but the *value being signed comes from the runner, never from `commitEffectResult`
  `options.result`*.

**Where the command definition comes from vs. what is observed.** The agent (process author) declares
**which** command to run — `ctx.provenShell({ command: 'npm', args: ['test'] })`. The agent does
**not** supply the result: the SDK runs it. So the agent controls the *definition* (which is fine — a
policy binds `commandHash` to the required command via OP-17e, so a swapped definition is caught) but
**not the OBSERVED outcome**. This is the exact provenance boundary Draft 1 violated.

**Fail closed.** If the anchor is pinned but signing throws (key unresolvable, canonicalization deny,
`command` not a bare program), the effect **rejects** (`RunFailedError`, mirroring the
`signed_breakpoint_rejected` throw at `commitEffectResult.ts:279-289`) — an execution that was required
to be proven but could not be leaves the run unable to advance rather than committing an unproven
result. When no anchor is pinned, `proven-shell` still executes the command in-SDK and returns the
result, but attaches **no** attestation (back-compat; a downstream `requireProof`/`tool-result` step
then denies for lack of proof — never silently passes).

**Where the key lives.** The executor private key is resolved by `resolveToolExecutorSigner` from the
off-agent env/deploy pin (OP-10) — **not** from the run directory, **not** from `task.json`, **not**
from any workspace file the agent can write. The runner runs in the SDK **runtime** process; the
orchestrating agent's *reasoning context* is the LLM conversation, which never sees
`process.env[POLICY_TOOL_EXECUTOR_KEY]`.

**Honest residual key-custody boundary (OP-B-KEY).** The proven-execution runner is **authoritative
for the OBSERVATION**: the SDK genuinely ran the command and saw the result, so the *content* of the
attestation is trustworthy by construction — it is not agent-fabricated. The remaining assumption is
purely about **key custody**, and it is the *same* assumption the base spec makes for the transport
proxy (§4.2 posture): the SDK runtime's executor key must be kept out of a domain where the agent can
execute arbitrary code and read `process.env`. In the intended deployment the SDK runtime holds the
key in a domain the agent's reasoning context cannot reach (separate process/user, or a KMS-backed
signer). If a deployment instead runs the SDK runtime in the *same* process as an agent that can
`require` the SDK and read `process.env`, the key is reachable — but note this is a strictly weaker
attack than Draft 1's: the attacker would have to *forge a signature over a fabricated outcome*, not
merely *report a fabricated value that gets signed for it*. The observation itself remains genuine
whenever the runner actually runs; the boundary is stated so deployments provision the key off-agent
(KMS-backed signer recommended), exactly as they do the proxy key.

### 5.3 OP-12 — Spawn-layer signer (harness-invocation scope, honest and correct)

**Where.** `packages/adapters/core/src/spawn-runner.ts`, in the `child.on('exit', ...)` handler
(`spawn-runner.ts:591-613`) / `cleanupAndFinalize` (`:568-589`), where the real exit code and the
accumulated stdout/stderr (`stderrBuf`, `:288`, and the streamed stdout) are known. The command + args
that were launched are `invocationCmd.command` / `invocationCmd.args` — the **exact argv the spawn
layer ran** (`buildInvocationCommand`, `spawn-invocation.ts:276-388`; e.g. `claude …`, or
`docker run … <image> …`). At exit, the spawn signer builds the `ToolResultAttestationPayload` over the
CAPTURED exit outcome, **binding `commandHash` to the launched `invocationCmd` argv** (OP-2), with
`attestationScope:'harness-invocation'` and `producer:'spawn-layer'`, and signs with the executor key
resolved from the SAME manifest-verified gate context GATE 3 uses (`resolveGate3Context` →
`loadPolicyEnforcementGate`, `policy-spawn-gate.ts:70-96`). The signed attestation is surfaced on the
run result so the SDK stores it in the journal (OP-13) for the effect that dispatched the spawn.

**Honest scope (OP-B-SCOPE).** The spawn layer launches a process (`spawn(...)`, `spawn-runner.ts:231`)
and observes *that process* — **the harness invocation**. It genuinely observes an execution, and its
key is well-isolated (the harness is a **child** that cannot read its parent's `process.env`/memory).
But it observes the **harness**, whose argv is e.g. `claude …`, **not** an inner `npm test` the harness
may run inside itself. Therefore the spawn-layer attestation is **NOT** what satisfies the `npm test`
example. It honestly attests *"the harness ran with this exact invocation and exited N"* — useful when
the whole harness run is the unit to be proven (e.g. "a sandboxed one-shot tool container ran and
exited 0"), or for coarse audit. A consumer that needs an inner-command guarantee MUST require
`producer:'proven-shell'` / `attestationScope:'inner-command'` (OP-18); a spawn-layer proof will not
satisfy it. This is stated in code (the signed `producer`/`attestationScope` fields) and in docs.

**Both signers, one consumer.** Because both emit a `SignedEnvelope<ToolResultAttestationPayload>`
verified through the identical `verifyToolResultTrusted` path (OP-6) against the identical
`tool-executor` kind, the policy evaluator (OP-16) and the process gate (OP-19) consume them
uniformly; they differ only in the signed `producer`/`attestationScope`, which a policy may constrain
(OP-18).

### 5.4 OP-11-DEL — REMOVED: the "sign agent-reported `task:post` value" producer

The Draft-1 SDK-commit signer signed `commitEffectResult` `options.result` — an agent-fabricated
`task:post` value (§0.1). **It is deleted.** `commitEffectResult.ts` is **not** modified to attach a
`ToolResultAttestation` over `options.result`; there is no `signToolResultAttestation(options, record)`
step, no `attestResult`-triggered signing of a `task:post` value. The only path that produces a
proof at commit time is the proven-execution runner, whose value the SDK observed directly, not the
agent's post. Signing an agent-reported value is **not an outcome proof of any grade**; the Draft-1
"correlation-grade OP-B1" framing that presented it as a weak-but-usable proof is deleted with it. Any
`ctx.task({ kind: 'shell' })` continues to work exactly as today (agent runs it, `task:post` reports
it) — it simply **produces no outcome proof**, and a downstream gate that demands one denies.

### 5.5 OP-13 — How the attestation rides the effect result / journal

The attestation is stored at `StoredTaskResult.metadata.toolResultAttestation`
(`packages/babysitter-sdk/src/storage/types.ts:119-141`; `metadata` is a `JsonRecord`, already
stable-cloned by `serializeTaskResult`, `serializer.ts:167`). It therefore travels with the effect
result and is replayable from the append-only journal — the same durable artifact the process gate reads
(OP-19). The proven-execution runner writes it inline as the `proven-shell` effect result is committed;
the spawn signer's envelope is threaded back through the effect result the caller commits, so it lands
in the same `metadata` slot. **OP-13** is: a valid attestation for a proven execution is present at
`StoredTaskResult.metadata.toolResultAttestation`, byte-stable across replay. (Note: this is the SDK
writing metadata for a value *it* produced, not signing an agent's `task:post` value — the distinction
that OP-11-DEL enforces.)

---

## 6. The `tool-result` policy step + result predicates (Milestone H, consumer A — unchanged from Draft 1)

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
  bound `commandHash` must match the required command, not a different command.
- **`signedBy: tool-executor`** — enforced structurally by the kind→`tool-executor` mapping (OP-5); a
  step MAY also set `requireExecutorProducer` / `requireAttestationScope` (OP-18).

Any predicate miss → the requirement is unsatisfied → the chain does not grant → deny (fail closed, the
shipped `evaluateChain` returns unsatisfied at the first miss, `policy-evaluator.ts:443-447`).

### 6.3 OP-18 — `requireExecutorProducer` / `requireAttestationScope` (inner-command vs harness scope)

Mirroring the shipped `requireProxyAttestation` (`policy-schema.ts:83-85`,
`policy-evaluator.ts:224-230`, `:259-264`), a `tool-result` step MAY set:

- `requireExecutorProducer: 'proven-shell'` — accept only proofs from the authoritative
  proven-execution runner, rejecting a harness-scope spawn-layer proof; and/or
- `requireAttestationScope: 'inner-command'` — accept only proofs whose signed `attestationScope`
  proves an inner command (as opposed to `'harness-invocation'`).

**Default:** for any action whose `match` names a `credentialScope` (i.e. can inject a scoped
credential), both default to the authoritative inner-command posture (`producer:'proven-shell'`,
`attestationScope:'inner-command'`), matching the AC-39 credential-default posture; non-credential
actions may accept a harness-scope proof if the policy explicitly opts in. An explicit value opts out.
This makes the honest producer-scope boundary of §5.2/§5.3 enforceable in policy — the `npm test`
example **must** use a proven-shell proof, and the evaluator rejects a spawn-layer harness proof
substituted for it.

### 6.4 OP-19-A — Worked example (the mandated "authorize aws deploy only if npm test provably passed")

The `npm test` step runs through the **proven-execution runner** (the SDK executes `npm test`,
captures exit 0, signs — §5.2), and the aws-deploy policy's `tool-result` step requires that
proven-shell attestation. The command is defined by the process as a `proven-shell` task; the deploy
policy binds to the resulting proof:

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
    #                        ⇒ requireExecutorProducer defaults 'proven-shell'  (tool-result step, OP-18)
    #                        ⇒ requireAttestationScope   defaults 'inner-command'(tool-result step, OP-18)
    chains:
      - id: human-opus-and-tests-passed
        requirements:
          - step: { kind: human-approval }                       # a person approved   (precondition)
          - step:
              kind: model-decision
              conditions: { modelIdMatches: "^claude-opus-" }    # opus decided        (precondition)
          - step:
              kind: tool-result                                   # AND tests PROVABLY passed (OUTCOME PROOF)
              conditions:
                commandMatches: "^npm(\\s+run)?\\s+test\\b"       # binds proof.commandHash (OP-17e)
                require: { exitCode: 0 }                          # OP-17a
                maxAgeMs: 1800000                                 # 30-min freshness (OP-17d)
                requireExecutorProducer: "proven-shell"           # authoritative inner-command only (OP-18)
                requireAttestationScope: "inner-command"          # a harness-invocation proof is REJECTED
              # signedBy: tool-executor is structural (OP-5)
```

The process that runs the tests:

```js
// The SDK ITSELF executes npm test and signs over what it observed — no task:post, no agent value.
await ctx.provenShell({ command: 'npm', args: ['test'] });   // kind:'proven-shell' → SDK runs it (§5.2)
```

The `aws deploy` command is authorized only if the evidence set for the call contains a valid
`tool-executor`-signed `ToolResultAttestation` whose signed `producer` is `proven-shell`, whose bound
`commandHash` matches `^npm ... test`, and whose signed `exitCode` is 0, in addition to the
human-approval + opus model-decision preconditions. Because the SDK — not the agent — produced that
proof by running the command, a compromised agent cannot mint it. The `tool-result` evidence is bound
into the resulting `CommandAuthorization`'s `evidenceStepBindings` (`policy-evaluator.ts:448-452`)
exactly like every other evidence, so the gate confirms it enforced the proven-test precondition.

---

## 7. The babysitter-process gate: `provenShell` + `requireProof` (Milestone H, consumer B)

### 7.1 OP-20 — `ctx.provenShell` task option (replaces the Draft-1 `attestResult` flag)

**OP-20** adds a `ctx.provenShell({ command, args, timeout?, cwd?, env? })` intrinsic that emits a
`kind: 'proven-shell'` effect (§5.2). Draft 1's `attestResult?: boolean` flag on a `kind:'shell'` task
is **removed** — it declared intent to attest an agent-reported value, which OP-11-DEL forbids. In
Draft 2, attestation is not a flag on an agent-executed task; it is intrinsic to the `proven-shell`
kind, whose defining property is that the **SDK executes it**. When the anchor is pinned, a
`proven-shell` effect yields a `ToolResultAttestation` over the SDK-observed outcome (OP-13); when the
anchor is not pinned, it runs and returns the result but attaches no attestation (back-compat). The
trust comes from the executor key + manifest anchor (OP-9) and from the SDK owning execution — never
from an agent-set flag.

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
   freshness, `signedBy`/`requireExecutorProducer`/`requireAttestationScope`) — the **same** predicate
   set as OP-17, shared code; **and**
3. is bound to **this** run (`payload.runId === current runId`, OP-14) and is fresh (OP-14).

If a matching valid attestation exists → `requireProof` resolves and the process advances. If none
exists → the intrinsic **throws** (`RunFailedError`, the shipped fail-closed exception used at
`commitEffectResult.ts:279`), so **the step blocks**. An orchestrator that did not actually run the
command (no `proven-shell` effect, hence no attestation), or whose command failed (`exitCode !== 0` →
predicate miss), or ran a different command (`commandHash` mismatch), **cannot advance** — the
requirement is checked against a signed artifact the SDK produced by observing execution, never the
agent's narrative and never an agent-reported `task:post` value.

Copy-pasteable:

```js
// The step that runs the tests: the SDK EXECUTES npm test and signs over what it observed (§5.2).
await ctx.provenShell({ command: 'npm', args: ['test'] });   // kind:'proven-shell'

// A later step / breakpoint gate requires the signed proof — not the agent's word.
await ctx.requireProof({
  command: /^npm(\s+run)?\s+test\b/,        // binds the proof's commandHash (OP-17e)
  result:  { exitCode: 0 },                 // OP-17a
  maxAgeMs: 1_800_000,                      // freshness (OP-17d / OP-14)
  signedBy: 'tool-executor',                // structural (OP-5)
  requireExecutorProducer: 'proven-shell',  // authoritative inner-command only (OP-18)
  requireAttestationScope: 'inner-command', // a harness-invocation proof is REJECTED
});
// → no valid proven-shell attestation in the journal for THIS run → the step throws → blocks.
```

### 7.3 OP-21 — Single-use consumption where required (journal-anchored ledger, OP-27)

A `requireProof` call MAY set `singleUse:true`; when so, the consumed attestation's
`toolCallId`+`runId`+`finishedAt` triple is recorded in the **journal-anchored** proof-consumption
ledger (OP-27) and a second `requireProof` for the same triple denies — preventing one genuine proof
from satisfying two distinct gates that each demanded a fresh execution. The ledger is **NOT** an
agent-writable `.a5c` file (§10, OP-27). Default is multi-use (a proof of a fact can be read by several
observers) unless the caller declares the fact must be freshly produced per gate.

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
where the guarantee is bounded.

- **OP-T1 — forged / never-ran result.** The orchestrator emits "tests passed" it never ran. **Blocked:**
  the only path that mints a `proven-shell` proof is the SDK runtime running the command itself (§5.2),
  so there is no `task:post` value to forge — the agent cannot report a passing outcome the SDK did not
  observe. A `kind:'shell'` task the agent runs out-of-band produces **no** attestation, so a
  `requireProof`/`tool-result` step denies (OP-19/OP-16). The agent cannot mint a proof — the executor
  key is off-agent (OP-9), and `verifyEnvelopeTrusted` resolves keys only from the manifest-verified
  store, rejecting any non-executor key (OP-7). *Boundary (OP-B-KEY):* the guarantee that the *observed*
  outcome is genuine is unconditional whenever the runner runs; the only residual assumption is
  key-custody (the executor key must be off-agent), the same posture as the proxy key (§5.2).
- **OP-T2 — wrong-command swap.** The agent presents a real proof of a *different* command as the
  required one. **Blocked:** the proof binds `commandHash`/`argsHash` (OP-2) over the argv the executor
  actually ran; the step/gate's `commandMatches`/`argsHashEquals` predicate (OP-17e) must match the
  bound hash, and the policy argv matcher is the anti-evasion `matchArgv` (`policy-evaluator.ts:509-547`)
  — a disguised wrapper (`sh -c`, `$(...)`) is denied, not matched. The proven-shell runner itself
  refuses a non-bare-program `command` (§5.2), so a shell-smuggled swap never even executes.
- **OP-T3 — replay / staleness.** The agent replays a stale proof from an old run/step. **Blocked
  (OP-14):** the payload binds `runId`/`sessionId`/`toolCallId` (in `signedFields`, OP-5) and the
  consumer requires `payload.runId === current runId` + `now - finishedAt <= maxAgeMs` (OP-17d);
  `singleUse` (OP-21) prevents intra-run double-satisfaction where the gate demands a fresh execution.
- **OP-T4 — tamper (stored attestation or trust roots).** The agent edits the stored envelope or the
  trust-roots file. **Blocked:** editing the envelope invalidates the Ed25519 signature (OP-6 step g);
  editing `.policy/trust-roots.json` fails the config-manifest hash/epoch check (`config-manifest.ts:88-123`,
  base §10.1 AC-46/47) → deny-all. The pins (`POLICY_CONFIG_ROOT_FP`, `POLICY_CONFIG_MIN_EPOCH`) are
  off-workspace (OP-9).
- **OP-T5 — producer-scope substitution.** The agent presents a real **spawn-layer** (harness-invocation)
  proof where an inner-command proof is required. **Blocked:** `producer`/`attestationScope` are signed
  (OP-3) and the credential-default policy requires `producer:'proven-shell'` /
  `attestationScope:'inner-command'` (OP-18); a harness-scope proof is rejected. This is the honest
  encoding of the §5.3 scope boundary — the spawn-layer proof is genuine but attests a *different fact*.
- **OP-T6 — TOCTOU (capture-then-sign).** A result changes between running and attesting. **Blocked
  (OP-15):** both signers sign over the **captured** result at capture time — the proven-shell runner
  over the exact bytes `execFileSync` returned to it, the spawn signer over the captured
  `exitCode`/`stderrBuf`/stdout at the `exit` event (`spawn-runner.ts:591-613`). The signed
  `stdoutHash`/`stderrHash` bind those exact bytes; a later re-read that differs cannot match.
- **OP-T7 — cross-kind / cross-payload-type confusion.** A `model-decision` or `command-authorization`
  envelope presented as a `tool-result`. **Blocked:** `payloadType` domain separation (OP-3) + kind
  binding (OP-7) — no non-`tool-executor` root and no non-`tool-result-attestation` payload satisfies a
  `tool-result` step.
- **OP-T8 — workspace test-script tampering (OUT OF SCOPE, stated).** The agent rewrites the workspace's
  own `package.json` `test` script to a no-op that exits 0, then has the SDK prove `npm test` exit 0.
  The proof is *honest* — `npm test` genuinely exited 0 — but its *meaning* is subverted upstream of the
  execution seam. This is an orthogonal workspace-integrity / supply-chain concern (§1.2), **not
  addressed** by outcome proofs, and called out plainly so no one over-reads the guarantee. Mitigations
  (attesting a pinned/hashed script, running in a read-only or vetted image via the spawn-layer seam) are
  future work.

---

## 9. Milestone map & AC index

| AC | What | Milestone |
|----|------|-----------|
| OP-1 | Extend `ToolResultPayload` → `ToolResultAttestationPayload` (+ `producer`/`attestationScope`) | **F** |
| OP-2 | `argsHash`/`commandHash`/`stdoutHash`/`stderrHash` via shared canonicalizers, over executor-run argv | **F** |
| OP-3 | `payloadType`/`producer`/`attestationScope` bound in `signedFields` (domain separation) | **F** |
| OP-4 | `tool-executor` trust-root kind added to `TrustRootKind` | **F** |
| OP-5 | `tool-result` `EvidenceKind` + required-fields + kind mapping | **F** |
| OP-6 | `verifyEnvelopeTrusted`/`verifyToolResultTrusted` resolves + kind-checks executor | **F** |
| OP-7 | Cross-kind rejection: no non-executor key satisfies `tool-result` | **F** |
| OP-8 | Expiry / revocation of the executor root honored | **F** |
| OP-9 | Verify + key anchored to manifest-verified config, never agent input | **F** |
| OP-10 | `ToolExecutorSigner` interface (+ `producer`) + `resolveToolExecutorSigner` | **F** |
| OP-11 | **Proven-execution runner** (`kind:'proven-shell'`): SDK executes + observes + signs (fail-closed) | **G** |
| OP-11-DEL | **REMOVED** the "sign agent-reported `task:post` value" producer — not an outcome proof | **G** |
| OP-12 | Spawn-layer signer: signs the launched HARNESS argv exit (harness-invocation scope) | **G** |
| OP-13 | Attestation rides `StoredTaskResult.metadata.toolResultAttestation` (SDK-produced value only) | **G** |
| OP-14 | Replay binding: `runId`/`sessionId`/`toolCallId` + freshness | **G**/**H** |
| OP-15 | TOCTOU: sign over captured result at capture time | **G** |
| OP-16 | `tool-result` policy step type (no evaluator change to add a policy) | **H** |
| OP-17 | Result predicates (exitCode/hash/pattern/freshness/command-args binding) | **H** |
| OP-18 | `requireExecutorProducer` + `requireAttestationScope` (inner-command vs harness scope) | **H** |
| OP-19 | `ctx.requireProof` intrinsic — step BLOCKS without a valid attestation | **H** |
| OP-19-A | Worked "aws deploy only if npm test PROVABLY passed" policy YAML (via `proven-shell`) | **H** |
| OP-20 | `ctx.provenShell` intrinsic (replaces the Draft-1 `attestResult` flag) | **H** |
| OP-21 | Single-use proof consumption where required (journal-anchored ledger) | **H** |
| OP-22 | Optional proof-gated breakpoint auto-approval | **H** |
| OP-27 | Proof-consumption ledger in the append-only journal / manifest-anchored store (NOT `.a5c`) | **H** |
| OP-28 | Architecture-boundary + metadata/lockfile constraints honored | **F/G/H** |
| OP-30 | Non-goals | — |

Every `OP-N` maps to exactly one of F (attestation-core), G (producers), H (consumers), except OP-14
(payload field is F/G, freshness check is H) and OP-28 (a cross-cutting build constraint). OP-11-DEL is
a removal recorded under G for traceability.

---

## 10. Reuse ledger, boundaries, constraints (OP-27 / OP-28)

**OP-27 — reuse the spine; no new package; ledger is NOT agent-writable.**

| Concern | Reused / extended artifact (file) | New? |
|---------|-----------------------------------|------|
| Signed envelope + canonical form | `trust-core/src/signing.ts:24-65` | reuse |
| Tool-result payload + sign/verify | `trust-core/src/tool-signing.ts:4-34` | **extend** (add bound fields + `payloadType`/`producer`/`attestationScope`) |
| Shared arg/argv/output hashing | `policy/src/canonicalize-args.ts:77-85` | reuse |
| Trusted-store verify + kind check | `policy/src/verify-envelope-trusted.ts:237-329` | **extend** (add `tool-executor`/`tool-result`) |
| Config-manifest anchor | `policy/src/config-manifest.ts:67-133` | reuse |
| Policy schema + evaluator | `policy/src/policy-schema.ts`, `policy-evaluator.ts` | **extend** (`tool-result` step + predicates) |
| Executor signer | `policy/src/tool-executor-signer.ts` | **NEW module** (in existing package) |
| **Proven-execution runner** | `babysitter-sdk/src/runtime/proven-shell/runner.ts` + `intrinsics/provenShell.ts` | **NEW module** (in existing package) — the SDK-owned execution seam |
| Spawn-layer signer | `adapters/core/src/spawn-runner.ts:568-613`; gate ctx `policy-spawn-gate.ts:70-96` | **extend** (bind `commandHash` to launched argv, `attestationScope:'harness-invocation'`) |
| Attestation storage | `babysitter-sdk/src/tasks/serializer.ts:150-185`; `storage/types.ts:119-141` | reuse (`metadata`) |
| `requireProof` intrinsic | `babysitter-sdk/src/runtime/intrinsics/` | **NEW intrinsic** (extends the intrinsic set) |
| Proof-consumption ledger | **append-only journal event** (new `PROOF_CONSUMED` event) or a manifest-anchored run-scoped index — **NOT** an agent-writable `.a5c` file | reuse (journal) |
| Proof-gated auto-approval | `babysitter-sdk/src/breakpoints/evaluator.ts` (wired `task.ts:163-177`) | **extend** (optional clause) |
| ~~SDK-commit signer over `task:post` value~~ | ~~`commitEffectResult.ts`~~ | **REMOVED (OP-11-DEL)** — `commitEffectResult` is NOT modified to sign `options.result` |

The **genuinely new modules** are `policy/src/tool-executor-signer.ts`, the proven-execution runner
(`babysitter-sdk/src/runtime/proven-shell/runner.ts` + its `provenShell` intrinsic — the one new
execution seam, described precisely in §5.2), and the `requireProof` intrinsic — all **inside existing
packages**. **No new package** is created (OP-30). If a future deployment needs a standalone
out-of-process executor daemon or a KMS-backed signer service, that would be a new package and must be
classified + `private:true` + metadata-passing (`scripts/check-package-metadata.cjs`) — explicitly out
of scope here.

**Single-use ledger placement (OP-27, MUST).** The proof-consumption record for `singleUse` (OP-21)
lives in the **append-only journal** (a new `PROOF_CONSUMED` event carrying the
`toolCallId`+`runId`+`finishedAt` triple) or a manifest-anchored run-scoped store — the same durable,
integrity-covered artifact class the attestation itself rides. It is **never** an agent-writable
`.a5c/**` file, so an agent cannot erase a consumption record to double-spend a single-use proof.

**OP-28 — architecture-boundary + metadata/lockfile constraints.**
- Crypto stays in `trust-core` (support-systems leaf, `packages/trust-core/package.json`
  `private:true`, `type:commonjs`); `trust-core` gains **no** dependency on `policy-adapter` — the
  producers compute the shared hashes in the SDK/adapters layers (which already reach `policy-adapter`)
  and hand a finished payload to `signToolResult` (OP-2). The pre-push
  `scripts/check-architecture-boundaries.cjs` gate is respected: **no `dispatch-core →
  orchestration-core` edge** is introduced. `babysitter-sdk` consumes `policy-adapter` (ESM) only via
  **dynamic `import()`**, the proven pattern at `trusted-breakpoint-policy.ts:218-226` and
  `policy-spawn-gate.ts:76` — no new static ESM edge in the CJS SDK build.
- The proven-execution runner's `node:child_process` use is confined to the new
  `babysitter-sdk/src/runtime/proven-shell/runner.ts` module (SDK runtime layer, which is where the
  runtime already lives); it introduces no cross-package edge and no new dependency.
- Windows lockfile: no bare `npm install`; use `--package-lock-only`, verify no win32 pins (project
  memory: Windows npm install pollutes lockfile). `execFileSync` is `argv`-form, `shell:false`, so it is
  Windows-safe without shell-quoting (and refuses non-bare-program commands, §5.2).
- Any new package would need metadata-passing; we add none (OP-30).
- Tests-first, frozen; adversarial security review at each crypto/enforcement milestone; introduce no
  NEW `babysitter-sdk` test failures (7 known pre-existing session-state/`task_cancel` failures are
  unrelated and not counted). Commit specific product files only; never `.a5c/**` or lockfiles in agent
  commits.

---

## 11. Non-goals (OP-30, consolidated)

- No new package; no third evaluator; no online executor-key revocation beyond manifest-epoch + `revoked`.
- No semantic interpretation of stdout/stderr content beyond declared predicates.
- **No attestation of an agent-reported `task:post` value** — that is not an outcome proof of any grade
  (OP-11-DEL). The only proofs are over executions a seam performed and observed: the SDK-owned
  proven-execution runner (inner command) and the spawn layer (harness invocation).
- No attestation of executions outside those two seams — anything else is unproven and denies.
- **No workspace-script integrity guarantee** — a proven `npm test` exit 0 proves the *argv ran and
  returned 0*, not that the workspace's test script is trustworthy (OP-T8, §1.2). Orthogonal, out of scope.
- No claim that a spawn-layer harness-invocation proof satisfies an inner-command requirement; the two
  scopes are signed and a policy/gate rejects the wrong one (OP-18, OP-T5).
