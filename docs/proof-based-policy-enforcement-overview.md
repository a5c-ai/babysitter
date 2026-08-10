# Proof-Based Policy Enforcement

> A trust-chain authorization system that lets a tool command run **only** when it is
> accompanied by cryptographic *proof* that the required conditions were met — a signed human
> approval, an attestation of which model decided to call the tool, and a policy-signed
> authorization binding all of it to the exact command about to execute.

---

## 1. Overview

Proof-Based Policy Enforcement makes agent tool execution **provable and non-spoofable**.
Instead of trusting that "the agent said a human approved" or "the agent said Opus decided
this," every sensitive action must carry an unforgeable chain of signed evidence that a
configurable policy engine verifies before the tool layer will run the command.

The canonical example:

> Allow the `aws` CLI with a specific credential scope **only if**
> (a) a specific human breakpoint was approved — signed and not spoofable — **and**
> (b) the model that decided to call the tool was Opus (proven, not asserted).
> The tool layer itself refuses to execute unless it can verify a signed authorization,
> and the policy component that issues that authorization is configurable so different
> actions can require entirely different trust chains.

It ships as a new leaf crypto package plus a policy engine and enforcement gates wired
across the agent runtime:

| Package / surface | Role |
|---|---|
| `@a5c-ai/trust-core` | Ed25519 signing, the universal `SignedEnvelope<T>` proof format, model-decision & permission payloads, trust-chain verification (a **support-systems leaf** — everything can depend on it) |
| `@a5c-ai/policy-adapter` | The configurable policy component: trust-chain evaluator, `CommandAuthorization` issuer, config-manifest verification, canonicalized argv matcher, credential-identity resolution |
| `babysitter-sdk` breakpoints | Enforced signed breakpoint approvals (the human-approval evidence producer) |
| `transport-adapter` | Proxy-side model-decision attestation at the wire seam (the authoritative "which model decided" evidence producer) |
| `genty-core` / `genty-platform` / `adapters-core` | The three enforcement gates + the session/dispatcher seams that verify authorizations before a tool runs or a credential is injected |

---

## 2. What it solves

Agent systems increasingly take real, irreversible actions — running cloud CLIs, deleting
resources, moving money, touching production. The safeguards that gate those actions
("a human approved this", "only our most capable model may do this", "these credentials are
only for this command") have historically been **claims the agent process itself makes**.
A compromised, buggy, or adversarial agent can fabricate every one of them:

- **Spoofed approval** — the agent writes `{approved: true}` and skips the human.
- **Model downgrade** — a cheap model does the work while the logs claim Opus.
- **Credential over-reach** — production credentials are handed to whatever command asks.
- **Config tampering** — the agent rewrites the policy or the trusted-key list.
- **Replay / aliasing / TOCTOU** — reusing an old approval, disguising a covered command
  (`sh -c "aws …"`, `aws --region x s3 rm …`), or mutating arguments after approval.

This feature closes those gaps by making each safeguard a **cryptographic proof** that is
verified at the exact moment of execution, sourced from an **integrity-protected,
out-of-agent trust anchor** the agent cannot rewrite.

**Threat model.** The in-scope adversary is a *workspace-writable / compromised agent
process*: it can execute tools, write and commit to the working tree, and craft arbitrary
payloads. It **cannot** forge signatures from keys it does not hold, and it cannot change the
deployment-pinned root of trust. Everything the system protects is protected against exactly
this adversary.

### Two directions of proof

Proofs flow in two complementary directions, and this feature spans both:

1. **Precondition proofs — "you may run X because these proofs exist."**
   Evidence (a signed human approval, a model-decision attestation) is gathered *before* a
   command, a policy verifies it, and only then is the command authorized to execute. This is
   the direction that gates dangerous actions. **(Shipped.)**

2. **Outcome proofs — "the tool call *is* the proof that X happened."**
   The tool invocation *and its result* are themselves signed by a trusted executor, producing
   an unforgeable record such as *"`npm test` was run via Bash and returned exit code 0."* That
   proof then becomes evidence a *later* policy step can require, or a **gate a babysitter
   process step advances on** — so the orchestrating agent cannot fabricate "tests passed" to
   move forward. See [§5](#5-the-complementary-direction-outcome-proofs). **(Design + a signing
   primitive exist; producer/consumer integration is the next increment.)**

---

## 3. Why proofs (and not just checks)

A "check" (an `if` statement in the agent, a flag in a run file, a hook that reads
`task.json`) is only as trustworthy as the process running it — and that is the very process
we do not trust. A **proof** is different: its validity does not depend on who presents it or
where it is stored, only on the signing key. That property is what makes the guarantees hold
even when the agent is fully compromised:

- The **human approval** is signed by a human's key held outside the agent, so the agent
  cannot manufacture one.
- The **model-decision attestation** is signed by the *transport proxy* — a component that
  sits on the wire between the harness and the model provider, holds its own key, and sees the
  real completion. The agent cannot forge "Opus decided this" because it does not hold the
  proxy's key.
- The **policy configuration and trusted-key list** are covered by a signed **config manifest**
  with a monotonically increasing epoch, pinned off-workspace. The agent can edit the files on
  disk, but the gate rejects any manifest whose signature or epoch does not match the pin — so
  tampering and rollback both fail closed.

Design principle throughout: **fail closed, no fallbacks.** Any verification error, missing
config, or unresolved authorization results in a **denial**, never a pass-through.

---

## 4. How it works

### 4.1 The unified proof format

Everything is a `SignedEnvelope<T>` (Ed25519 over a canonical JSON serialization), so evidence,
attestations, and authorizations all share one verification path. Each envelope binds its
own `payloadType` and the exact fields it signed, so a signature for one kind of payload can
never be transferred to another.

### 4.2 Evidence — the inputs to a trust chain

| Evidence | Payload | Produced by | Proves |
|---|---|---|---|
| **Human approval** | `PermissionEvidence` | A signed breakpoint answer (enforced in the SDK) | A specific human approved a specific breakpoint |
| **Model decision** | `ModelDecisionPayload` (with per-tool-call `toolCallId` + `argsHash`) | Transport proxy at the wire seam (authoritative); genty in-process signer (correlation-grade) | *Which* model decided to call *this exact* tool with *these exact* args |
| **Delegation** | delegation-chain links | Agent identities | A → B → C delegation actually happened (linkage verified, not just "each is trusted") |

The model-decision attestation binds the **specific tool call** — its `toolCallId` and a hash
of its arguments — so an attestation produced for one tool call cannot be replayed to
authorize a different one in the same turn.

### 4.3 The policy component

A **policy document** declares, per action (matched on tool name + a *canonicalized argv* of
the command + credential scope), one or more acceptable **trust chains**. Chains compose
flexibly with no code changes:

- **AND across steps** — every required evidence step must be satisfied.
- **OR across chains** — any one of several alternative chains satisfies the action.
- **Quorum** — N *distinct* trusted identities (counted by resolved trust-root identity, not a
  self-asserted label, so one human with two keys cannot satisfy a 2-of-N).
- **Per-step conditions** — model allowlist (`modelIdMatches`), tags, expiry,
  `requireProxyAttestation`, etc.

The evaluator verifies every evidence envelope against the **manifest-verified trust roots**
(resolving each key from the trusted store, binding `sha256(publicKey) == fingerprint`, and
rejecting cross-kind confusion), checks the chain linkage and conditions, and — on success —
**issues a short-lived signed `CommandAuthorization`**. That authorization binds the policy id,
tool name, command hash, args hash, credential scope, the evidence fingerprints, the config
epoch, and an expiry. If nothing is satisfied, no authorization is issued and the action is
denied.

### 4.4 The tool-layer gates (enforcement)

Verification happens at the moment of execution, against what is *actually* about to run
(hashes recomputed at the gate to close TOCTOU):

- **Session gate (`policyToolGate`)** — verifies the `CommandAuthorization` before
  `definition.execute` in every tool-executing session. *Load-bearing.*
- **MCP dispatcher gate (`mcpPolicyGate`)** — same, before an MCP `dispatcher.dispatch`.
  *Load-bearing.*
- **GATE 3 — credential-injection backstop** — before a spawn injects scoped credentials
  (docker `-e`/`-v`, ssh, k8s env/serviceaccount), it verifies an authorization covers that
  credential's scope; with none, the credential is simply **not injected**.
- **GATE 1 — dispatcher hook** — a `ToolDispatcher` policy verifier, built and active-by-default
  when a dispatcher is constructed (see boundaries below).

Both load-bearing seams **auto-activate** when the deployment pins `POLICY_CONFIG_ROOT_FP`
(the config root fingerprint) and `POLICY_CONFIG_MIN_EPOCH` (the anti-rollback floor). When
the anchor is not pinned, enforcement is inert (back-compat pass-through) — this is the single
intentional pass-through.

### 4.5 End-to-end flow (the aws-cli scenario)

```
1. Agent decides to run `aws s3 rm …` with prod credentials.
2. A human answers the required breakpoint → SDK signs it (PermissionEvidence).      [proof #1]
3. The transport proxy signs the model turn, binding this toolCall + argsHash,
   attesting modelId = Opus.                                                         [proof #2]
4. Policy component: matches the action, verifies both proofs against the
   manifest-signed trust roots, checks modelIdMatches(opus) + the human step,
   and issues a short-lived signed CommandAuthorization bound to the exact
   command/args/credential-scope/epoch.                                             [authorization]
5. Tool-layer gate: recomputes the command/args hashes, verifies the authorization
   signature + expiry + epoch + binding → ALLOWS, and the scoped credential is
   injected. Any mismatch → DENY, credential withheld.
```

Every negative variant fails closed: unsigned approval, a Sonnet attestation, an expired or
replayed authorization, tampered args, an untrusted key, a rolled-back config, or a covered
command disguised behind a wrapper/global-option/interpreter.

---

## 5. The complementary direction: outcome proofs

> Status: the low-level signing primitive (`signToolResult` / `ToolResultPayload` in
> `@a5c-ai/trust-core`) exists; the producer, the policy/process consumers, and the
> docs below describe the **next increment**, not yet wired end-to-end.

Everything in §4 answers *"may this command run?"*. The equally important question is
*"can I prove this command ran, and what it returned?"* — and use that proof to validate a
result or to advance a process. This is what makes **execution itself** trustworthy rather
than just self-reported.

### 5.1 The problem it closes

In a multi-step workflow, steps depend on prior steps having *actually happened*:

- "Only deploy if the tests actually passed."
- "Only mark this phase complete if the build, lint, and integration suite all ran and
  returned success."
- "Only proceed to the migration if a dry-run was executed and produced no diff."

Today, in an agent-driven process, the *agent orchestrating the process* is the one reporting
those outcomes — the same untrusted process we are guarding against. A compromised or
over-eager agent can claim "`npm test` passed" and advance, having never run it (or having
run it and ignored a failure). The result gate is a self-report, not a proof.

### 5.2 The mechanism: a trusted executor signs the invocation + result

When a tool actually executes, the component that runs it — the **trusted tool executor**,
holding a key the *deciding/orchestrating* agent does not — signs a `ToolResultAttestation`
binding the exact invocation to its exact outcome:

```
ToolResultAttestation {
  payloadType:   'tool-result-attestation',
  toolName, toolCallId, commandHash, argsHash,   // WHAT ran (bound, not asserted)
  exitCode, stdoutHash, stderrHash,               // WHAT it returned
  startedAt, finishedAt, durationMs,
  runId, sessionId,
  modelDecisionFingerprint?,                      // links to WHO decided to run it (§4.2)
  executorKind: 'tool-executor'                   // signed by a trusted executor root
}
```

Because it is signed by the executor (not the orchestrator), and it binds the exact command
and args by hash, the orchestrating agent cannot forge "tests passed", cannot swap in a
different command's result, and cannot replay an old run's proof for a new command.

### 5.3 Consuming an outcome proof — two use cases

**A. As evidence in a later policy chain.** A policy step of kind `tool-result` requires a
valid `ToolResultAttestation` matching a command pattern *and* a result predicate, signed by a
trusted `tool-executor` root — expressed in the same policy-document schema as §4.3:

```yaml
# Authorize `aws deploy` only if the test suite provably passed.
action: { tool: Bash, command: "^aws deploy\\b", credentialScope: aws:prod:deploy }
chains:
  - steps:
      - kind: human-approval        # a person approved the deploy         (precondition)
      - kind: model-decision
        modelIdMatches: "^claude-opus-"
      - kind: tool-result           # AND the tests provably passed        (outcome proof)
        commandMatches: "^npm test\\b"
        require: { exitCode: 0 }
        signedBy: tool-executor
```

**B. As a babysitter process gate.** A process step produces an attestation when it runs, and a
downstream step refuses to advance without a matching one — making process progression itself
non-spoofable:

```js
// The step that runs the tests emits a signed proof as part of its effect result.
const test = await ctx.task({ kind: 'shell', command: 'npm test', attestResult: true });

// A later step / breakpoint gate requires the signed proof — not the agent's word.
await ctx.requireProof({
  command: /^npm test\b/,
  result:  { exitCode: 0 },
  signedBy: 'tool-executor',
});               // no valid executor-signed attestation in the journal → the step blocks
```

The attestation travels in the effect result and the run journal, so the requirement is
checked against a signed artifact, not a narrative summary — the orchestrator cannot advance
the process by *claiming* success.

### 5.4 What this shares with §4 — and what is new

It reuses the whole existing spine: the `SignedEnvelope` format, the manifest-verified
trust-roots, the evaluator, and the fail-closed discipline. What the increment adds is:

- a `ToolResultAttestation` payload + a **`tool-executor` trust-root kind**;
- **production** of it at the tool-execution seam (the shell/Bash effect and the adapters tool
  layer), signed by the executor identity — so it is unforgeable by the orchestrator;
- a **`tool-result` policy step type** with result predicates (`exitCode`, output-hash/pattern
  match, freshness/expiry, command binding);
- a **babysitter-process gate** (`attestResult` on a task + a `requireProof` intrinsic /
  proof-gated breakpoint auto-approval) that consumes the attestation from the effect/journal.

The same threat model applies: the outcome proof is only as strong as the executor key being
held outside the orchestrating agent, so *where the executor runs and holds its key* is the
central design decision for a deployment (e.g. a sidecar/harness-layer executor vs. an
in-process one, mirroring the authoritative-proxy vs. correlation-grade split in §4.2).

---

## 6. Configuration & operations

Configuration lives under a `.policy/` directory, all of it covered by one signed manifest:

- `.policy/policies/*.yaml` — the policy documents (worked examples shipped under
  `packages/adapters/policy/examples/`: an aws-cli human+opus chain and a 2-human quorum chain).
- `.policy/trust-roots.json` — the trusted public keys, each tagged by kind (human / engine /
  proxy / config) and fingerprint.
- `.policy/credential-scope-source.json` — the deployment's declaration of which credentials
  map to which scope (signed, so the agent cannot re-scope its own credentials).
- The **config manifest** — signs all of the above together with a monotonic `configEpoch`.

The root of trust is pinned **off-workspace** via `POLICY_CONFIG_ROOT_FP` +
`POLICY_CONFIG_MIN_EPOCH` (deploy-image config, not agent-writable). Rotating keys or changing
policy means re-signing the manifest and bumping the epoch (which also atomically publishes
revocations). Full schema reference, key-provisioning/rotation runbook, and the deny-reason
troubleshooting table live in [`docs/policy-enforcement.md`](./policy-enforcement.md); the
authoritative spec is [`docs/design/proof-based-policy-enforcement.md`](./design/proof-based-policy-enforcement.md).

**What is code vs. deployment config.** The verification, gating, issuance, and auto-activation
are *code*. Which credentials are scoped, what the policies say, and where the pins live are
*deployment configuration* — carried in the signed manifest, never taken from agent-writable
input.

---

## 7. Guarantees and honest boundaries

**Guarantees (verified against the workspace-writable adversary):**
no unsigned/spoofed approval is accepted (enforcement anchors to the signed manifest, not the
run-directory `task.json`); no covered action executes and no scoped credential is injected
without a valid `CommandAuthorization`; replay-within-turn, model downgrade, config
rollback, trust-anchor tampering, cross-kind/cross-payload-type confusion, argv/command alias
evasion, and TOCTOU are all denied with tests; every error path fails closed.

**Boundaries (documented, not overclaimed):**

- **Live evidence-collection wiring** — the production plumbing to populate the authorization
  store and GATE-3 resolver *from run-produced attestations at runtime* is an orchestrator-side
  integration step; until wired for a given deployment, covered actions simply deny (correct
  fail-closed). The store, registry, and auto-activation code all exist.
- **GATE 1 latent-until-consumed** — the `ToolDispatcher` policy verifier is built and
  active-by-default, but nothing in the current runtime constructs that dispatcher; the
  load-bearing enforcement is the session + MCP-dispatcher seams (which *are* wired).
- **Substrate-delivered credentials** (IMDS/IRSA/workload-identity, pre-existing mounts,
  image-baked secrets) are a bounded non-goal — GATE 3 mediates injected credentials, not
  credentials the substrate hands the process; mitigate those with substrate controls.
- **Passthrough proxy mode** produces no attestation, so any action requiring proxy
  attestation denies on that path (documented non-goal, fail-closed).
- **Outcome proofs ([§5](#5-the-complementary-direction-outcome-proofs))** — the precondition
  direction is shipped and enforced; the outcome-proof direction (trusted-executor result
  attestation, the `tool-result` policy step, and the babysitter-process `requireProof` gate)
  has a signing primitive in `trust-core` but is **not yet produced or consumed** — it is the
  next planned increment, not a current guarantee.

---

## 8. Status

**Shipped: the precondition direction (§4).** Delivered across five milestones (unified trust core → configurable policy engine → evidence
producers → tool-layer enforcement gates → end-to-end scenario), each independently
security-reviewed, with a whole-system acceptance audit at **96/100** and every acceptance
criterion met with code + passing tests. The adversarial reviews caught and forced fixes for
real authorization bypasses at each milestone (delegation-linkage forgery, quorum-by-one-human,
argv global-option evasion, and initially-unwired gates) before it was accepted.

**Next: the outcome direction (§5).** The trusted-executor `ToolResultAttestation`, the
`tool-result` policy step, and the babysitter-process `requireProof` gate are designed above
and rest on a signing primitive already present in `trust-core`, but are not yet produced or
consumed end-to-end. This is the planned next increment.
