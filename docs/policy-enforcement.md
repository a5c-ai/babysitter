# Proof-Based Policy Enforcement

A cryptographic policy-enforcement layer for the babysitter monorepo. A specific
command, run with a specific tool and specific credentials, executes **only** when a
declarative policy's required *trust chain of signed evidence* is satisfied. When a
policy is satisfied, a short-lived **`CommandAuthorization`** envelope is minted and the
tool layer verifies it at the point of execution, **failing closed** for policy-covered
actions.

This document describes the **shipped** system (Milestones A–E). Every schema, config
key, environment variable, and behavior below is verified against the source, not the
design doc alone. Where the design and code differ, this documents the **code**.

- **Authoritative design spec:** [`docs/design/proof-based-policy-enforcement.md`](design/proof-based-policy-enforcement.md)
  (acceptance criteria `AC-n` are referenced throughout for traceability).
- **Package:** [`@a5c-ai/policy-adapter`](../packages/adapters/policy) (`packages/adapters/policy`).
- **Trust primitives:** [`@a5c-ai/genty-core/trust`](../packages/genty/core/src/trust).
- **Worked example configs:** [`packages/adapters/policy/examples/`](../packages/adapters/policy/examples).

> **Overriding rule (repo policy: "fallbacks are evil").** Every verification, parse, and
> config step **fails closed**: any error, missing field, or thrown exception is a
> **denial**, never a pass-through. There is no fallback-allow anywhere in the enforcement
> path.

---

## 1. Concepts

### 1.1 The unified proof envelope

Every producer and consumer speaks one proof format: genty's `SignedEnvelope<T>`
([`packages/genty/core/src/trust/types.ts`](../packages/genty/core/src/trust/types.ts)):

```ts
interface SignedEnvelope<T> {
  payload: T;
  signature: string;               // base64 Ed25519 signature
  publicKeyFingerprint: string;    // sha256 of the SPKI/DER public key
  signedAt: string;                // ISO
  signedFields: string[];          // exactly which payload fields the signature covers
  algorithm: 'Ed25519';
}
```

Canonicalization is genty's `canonicalize`
([`signing.ts`](../packages/genty/core/src/trust/signing.ts)):
`JSON.stringify({ _meta: deepSortKeys(meta), _payload: deepSortKeys(extractFields(payload, signedFields)) })`.
No new envelope type or canonicalization routine is introduced — the policy adapter
imports `signPayload` / `verifySignature` from `@a5c-ai/genty-core`.

**Two hardening rules the raw primitives do not provide (added in the policy adapter):**

- **`signedFields` completeness (AC-2).** A field present on `payload` but absent from
  `signedFields` is **not** covered by the signature. The verifier asserts a per-kind
  required-field set at the trust boundary and denies on any missing field. See
  `REQUIRED_SIGNED_FIELDS` in
  [`verify-envelope-trusted.ts`](../packages/adapters/policy/src/verify-envelope-trusted.ts).
- **Domain separation via `payloadType` (AC-51).** Every payload carries a constant
  `payloadType` discriminant that MUST be in `signedFields`. The verifier binds the
  expected constant per kind, so a signature over one payload kind is **not transferable**
  to a structurally compatible payload of another kind (`EXPECTED_PAYLOAD_TYPE`).

### 1.2 Evidence taxonomy

Three evidence kinds, each anchored to a distinct trust-root **kind**:

| Evidence | `payloadType` | Payload | Producer | Trust-root kind |
| --- | --- | --- | --- | --- |
| **human-approval** | `human-approval` | `PermissionEvidencePayload` (`{action, scope, approvedBy, approvedAt, expiresAt?}`) | signed breakpoint answer / proven bridge | `human` |
| **model-decision** | `model-decision` | `ModelDecisionPayload` (§1.3) | transport proxy (authoritative) **or** in-process genty | `engine` |
| **delegation** | `delegation` | `DelegationChainLink` (`{delegatorFingerprint, delegatorSignature, delegatedAt}`) | agent identity | `agent` |

The policy adapter exposes an `Evidence` discriminated union
(`{ kind, envelope }`). The `kind` is a *claim*, not a trust decision: it selects which
required trust-root kind the verifier binds against, and the verifier rejects if the
resolved trust root's kind disagrees. A caller cannot relabel an engine-signed envelope
as `human-approval`.

### 1.3 Model-decision attestation and tool-call binding (AC-34)

`ModelResponsePayload` has no field naming the tool call it authorized, so a valid
attestation would be replayable to a *different* tool call in the same model turn.
`ModelDecisionPayload`
([`model-decision.ts`](../packages/genty/core/src/trust/model-decision.ts)) extends it —
the single, deliberate exception to the no-new-schema rule:

```ts
interface SignedToolCall {
  toolCallId: string;   // the provider/harness tool-call id
  name: string;         // tool name the model chose
  argsHash: string;     // sha256 of the canonical JSON of that call's arguments
}
interface ModelDecisionPayload extends ModelResponsePayload {
  payloadType: 'model-decision';
  toolCalls: SignedToolCall[];   // EVERY tool call the model emitted this turn, each bound
}
```

The signed-field set is fixed to `MODEL_DECISION_SIGNED_FIELDS`
(`payloadType, modelId, provider, inputMessagesHash, outputContent, timestamp, toolCalls`).
A model-decision step is satisfied for a given executing tool call **iff** the attestation
contains a `SignedToolCall` whose `toolCallId` **and** `argsHash` both match the call about
to run (AC-34a) — so the turn's attestation cannot be replayed onto a sibling call.

### 1.4 `CommandAuthorization` (AC-8)

On a satisfied policy the issuer mints a short-lived
`SignedEnvelope<CommandAuthorizationPayload>` binding the exact execution context:

```ts
interface CommandAuthorizationPayload {
  payloadType: 'command-authorization';
  policyId: string;
  policyDocHash: string;       // sha256 of the integrity-verified policy doc that granted this
  configEpoch: number;         // the config epoch under which it was issued (AC-46)
  matchedChainId: string;
  toolName: string;
  toolCallId: string;          // the exact tool-call id this authorization is bound to
  commandHash: string;         // sha256 of the canonicalized argv (empty-string sentinel if N/A)
  argsHash: string;            // sha256 of the canonical JSON of the tool args
  credentialScope: string;
  evidenceFingerprints: string[];
  evidenceEnvelopeHashes: string[];   // content hash of each satisfying evidence envelope
  evidenceStepBindings: { stepIndex; requiredKind; envelopeHash }[]; // one per required step
  runId?: string;
  sessionId?: string;
  issuedAt: string;
  expiresAt: string;           // short-lived; default 120s, per-policy override
}
```

All fields above are in `signedFields` (enforced at runtime by AC-2). The default TTL is
`120` seconds. Every gate **re-verifies** the authorization against the exact
tool/args/command/scope about to run, recomputing `argsHash` and `commandHash` at the gate
(TOCTOU binding).

### 1.5 The shared canonicalizer (AC-52)

`argsHash` / `commandHash` are computed in the proxy producer and at each gate. Byte
divergence would silently break the binding, so **one** canonicalizer is exported from the
adapter ([`canonicalize-args.ts`](../packages/adapters/policy/src/canonicalize-args.ts))
and imported by every producer and gate:

- `canonicalizeArgs(value): string` — **total** (throws only the explicit deny-path on
  non-finite numbers / non-representable types, never a silent coercion), **loss-preserving**
  (deep-sorts object keys but preserves array order, string bytes, value types; no
  lowercase/trim/unicode-fold).
- `canonicalizeArgv(command): string[]` — POSIX-ish tokenizer honoring single/double quotes
  and backslash escapes; throws on an unterminated quote (not statically tokenizable → the
  caller must deny). Backticks and `$( )` are **not** treated as quotes — they stay in the
  token so the argv matcher can detect and deny them.
- `argsHash(v) = sha256(canonicalizeArgs(v))`, `commandHash(cmd) = sha256(canonicalizeArgv(cmd).join('|'))`.

The in-process genty attestation producer re-implements the byte-identical serialization
([`in-process-attestation.ts`](../packages/genty/core/src/trust/in-process-attestation.ts))
because genty-core is a *dependency* of the policy adapter (importing back would be a
cycle); a conformance test pins byte-identity.

---

## 2. Trust and threat model

**Adversary in scope:** a compromised, **workspace-writable** agent. It can read and edit
any file on the workspace — including `.policy/` config, trust-roots, and policy documents
— and can emit envelopes signed with any key it holds.

**What is protected:**

- **Config integrity + anti-rollback (AC-36/AC-45/AC-46/AC-47).** Trust-roots and policy
  files are honored **only** when covered by a single signed manifest with a monotonic
  `configEpoch`, verified against an **off-workspace pinned** config root and epoch floor
  (§4). The agent can edit files but cannot produce a valid signature or a higher epoch, so
  tampered or rolled-back config is rejected (deny-all).
- **Key resolution (AC-35).** Signatures are verified only against key material resolved
  from the trusted store, with fingerprint binding and cross-kind rejection — never against
  a caller-supplied key.
- **Human-approval non-spoofing (AC-28/AC-48).** An `approved` bit is honored only if it was
  actually inside the human-signed field set, signed by a `human` trust root.
- **Model-decision binding (AC-30/AC-34).** The authoritative model attestation is signed by
  a key held **outside** the agent (the proxy); the agent cannot forge which model answered
  nor which call it authorized. In-process attestation is correlation-grade only (§3.1).
- **TOCTOU (AC-32).** The authorization is verified at the execution gate against the exact
  hashes about to run, recomputed at the gate.
- **Credential scoping (AC-40).** The credential→scope mapping comes from a trusted
  out-of-agent source keyed by a collision-resistant credential identity; the agent cannot
  relabel a broad credential as a narrow scope.

**Explicit non-goals (do not build under this design):** journal hash-chaining; a general
secrets/vault backend; replacing the proxy's bearer-token transport auth; a network
PKI/CA/OCSP service; a policy-authoring UI; rewriting proven's canonical form immediately;
signing the passthrough-proxy path; and **gating substrate-delivered credentials** (IMDS /
IRSA / workload-identity, image-baked creds, pre-existing mounts) — see §6.4.

---

## 3. Evidence producers

### 3.1 Model attestation — two producers, one evidence type

Both producers emit the same `ModelDecisionPayload` and both register as `engine` trust
roots with **distinct** fingerprints, distinguished by a `producer` marker on the trust
root (`'proxy'` vs `'in-process'`):

- **Authoritative — transport proxy** (`@a5c-ai/transport-adapter`,
  [`attestation.ts`](../packages/adapters/transport/src/attestation.ts)). Signs at the wire
  seam with a key held by the proxy process, outside the agent. Marker
  `PROXY_ATTESTATION_PRODUCER = 'proxy'`.
  - Non-streaming (`signCompletionAttestation`, AC-12): binds each `CompletionResult`
    tool call; `arguments` is a provider JSON string, `JSON.parse`d then hashed via the
    shared `argsHash`.
  - Streaming (`accumulateStreamAttestation`, AC-13): accumulates tool-call argument deltas
    and signs **only** at the terminal `done` event, over the fully-accumulated arguments.
  - Sidecar (`AttestationSidecarStore`, AC-14/AC-16): keyed by request id, indexed by every
    bound tool-call id. The model response body is never mutated (bodies stay
    provider-compatible).
- **Correlation-grade — in-process genty** (`@a5c-ai/genty-core`,
  [`in-process-attestation.ts`](../packages/genty/core/src/trust/in-process-attestation.ts),
  AC-15). Signs one `ModelDecisionPayload` per model turn with the agent's own key, attached
  to each call's `ToolExecutionContext`. Marker `IN_PROCESS_ATTESTATION_PRODUCER =
  'in-process'`. **Because the key is inside the agent, a compromised agent can forge it** —
  it is rejected for any action that requires proxy attestation (§3.3).

**Proxy config (AC-11).** The proxy attestation identity is read from env
([`config.ts`](../packages/adapters/transport/src/config.ts)):

| Env var | Field |
| --- | --- |
| `AGENT_MUX_PROXY_ATTESTATION_ENABLED` | `attestationEnabled` |
| `AGENT_MUX_PROXY_ATTESTATION_KEY_PATH` | `attestationKeyPath` |
| `AGENT_MUX_PROXY_ATTESTATION_FINGERPRINT` | `attestationFingerprint` |
| `AGENT_MUX_PROXY_ATTESTATION_SIDECAR_DIR` | `attestationSidecarDir` |

**Passthrough gap (AC-18).** In proxy passthrough mode (no completion engine) bodies are
forwarded unparsed, so **no attestation is produced**. Any action requiring proxy
attestation — explicitly or by the AC-39 default — therefore **denies** on passthrough
(fail-closed). Do not route high-assurance actions through passthrough transports.

### 3.2 Human approvals — signed breakpoints and the proven bridge

- **Enforced signed breakpoints (AC-4/AC-28/AC-48).**
  [`enforce-signed-breakpoint.ts`](../packages/babysitter-sdk/src/breakpoints/enforce-signed-breakpoint.ts)
  is the enforcement decision for a breakpoint answer. When a signature is required, an
  unsigned / invalid / wrong-key / tampered / unsigned-`approved` answer is **rejected**
  (the commit is refused, the effect stays pending). The security-critical set
  `{breakpointId, approved, responderId}` MUST be inside the human-signed `signedFields`,
  and only `approved === true` is honored. The trusted `human` fingerprints come **only**
  from the manifest-verified trust-roots config, never from `task.json`.
- **Proven bridge (AC-3/AC-43/AC-48).**
  [`proven-bridge.ts`](../packages/adapters/policy/src/proven-bridge.ts) converts a legacy
  `ProvenBreakpointAnswer` into `human-approval` evidence **without re-signing the human's
  intent as the adapter's own**. It applies the AC-48 completeness assertion
  (`{breakpointId, approved, responderId} ⊆ signedFields`, each present) **before** deriving
  anything, requires `originalHumanFingerprint` to be a currently-valid, non-revoked `human`
  root, verifies via proven `verifyAnswer`, and derives only when `approved === true`. The
  derived envelope records `originalHumanFingerprint`; the evaluator anchors the
  human-approval step on that human root, not on the adapter's bridging key.

### 3.3 High-assurance: `requireProxyAttestation` and the credential default (AC-17/AC-39)

A model-decision step is satisfied only by a `producer:'proxy'` root when proxy attestation
is required. `requireProxyAttestation`:

- **Defaults to `true`** for any action whose `match` names a `credentialScope` (a
  credential-touching action). The in-process (agent-held) attestation is rejected unless
  the policy author explicitly sets `requireProxyAttestation: false`.
- **Defaults to `false`** for non-credential actions.

This is enforced in the evaluator
([`policy-evaluator.ts`](../packages/adapters/policy/src/policy-evaluator.ts),
`attestationIsProxy` + the `requireProxyAttestation` derivation in `evaluatePolicy`).

---

## 4. Config: trust roots, the signed manifest, and key ops

### 4.1 The `.policy/` directory

Public material is git-tracked; private keys are never git-tracked. A signed `.policy/`
tree at run time:

```
.policy/
  config-manifest.json          # SignedEnvelope<ConfigManifestPayload>, signed by the
                                #   off-workspace config root (AC-36); carries configEpoch (AC-46)
  trust-roots.json              # public key material only (AC-26); human / engine / agent roots
  credential-scope-source.json  # trusted credential→scope source (AC-40 / AC-40a / AC-55) [optional]
  policies/
    *.yaml                      # covered actions + trust chains (§5)
  breakpoint-policy.json        # which breakpoints require a signature (used by the SDK breakpoint gate)
```

Private keys live outside git: human private keys under `.breakpoints/.keys/private/`
(existing proven layout), engine/issuer private keys under `.policy/.keys/private/`.
**Git-tracking a file does not make it trusted; presence in the current-epoch signed
manifest does.**

### 4.2 Trust roots (`TrustRoot`, AC-6)

```ts
interface TrustRoot {
  fingerprint: string;                 // sha256 of the SPKI/DER public key
  kind: 'human' | 'engine' | 'agent' | 'tool' | 'config';
  publicKey?: string;                  // inline PEM/DER-base64 ...
  publicKeyPath?: string;              // ... OR a path to it (exactly one)
  label: string;
  identityId?: string;                 // stable identity for quorum distinct-holder counting (AC-41)
  producer?: 'proxy' | 'in-process';   // for `engine` roots: proxy vs in-process (AC-39)
  expiresAt?: string;
  revoked?: boolean;
}
```

The trust-roots file is `{ "trustRoots": [...], "revoked": [] }`. `loadTrustStore`
([`policy-schema.ts`](../packages/adapters/policy/src/policy-schema.ts)) rejects a store
containing **duplicate fingerprints** (a cross-kind-confusion vector).

### 4.3 The trusted-store verifier (`verifyEnvelopeTrusted`, AC-35)

The single sanctioned entry to raw signature checking, in
[`verify-envelope-trusted.ts`](../packages/adapters/policy/src/verify-envelope-trusted.ts).
It fails closed at the first failure, in order:

1. Resolve key material **only** from the trusted store by fingerprint (the envelope's own
   embedded key is ignored). Absent → deny.
2. Require the resolved root's `kind` to equal the required kind; if the step supplied
   `allowedFingerprints`, the resolved fingerprint must be in that set.
3. Bind fingerprint to material: `sha256(resolvedPublicKey) === envelope.publicKeyFingerprint`.
4. Cross-kind rejection (redundant with (2), stated explicitly).
5. `signedFields` completeness + bound `payloadType` for the kind.
6. Root validity: not `revoked`, not expired at `signedAt`.
7. **Only now** call genty `verifySignature`. Any thrown exception in (1)–(7) is a denial.

`verifyTrustChainTrusted` verifies delegation chains: each link's key is resolved from the
store (never taken from the link), and true delegation linkage is asserted
(`delegatorFingerprint` must name the immediate predecessor's signer and
`delegatorSignature` must equal the parent's signature), rejecting reordered or spliced
chains.

### 4.4 The signed config manifest (AC-36/AC-46) and epoch floor (AC-47)

A single `SignedEnvelope<ConfigManifestPayload>` covers **all** config files together:

```ts
interface ConfigManifestPayload {
  payloadType: 'config-manifest';
  configEpoch: number;              // monotonically increasing; strictly greater on every re-sign
  files: { path: string; sha256: string }[];  // EVERY config file
  issuedAt: string;
}
```

`verifyConfigManifest`
([`config-manifest.ts`](../packages/adapters/policy/src/config-manifest.ts)) runs before
any trust root or policy is honored and denies-all on any mismatch:

1. Verify the manifest via `verifyEnvelopeTrusted(..., 'config-manifest', ...)` against the
   pinned config root only.
2. Enforce the epoch floor: `configEpoch >= minEpoch` (else deny-all).
3. Every on-disk config file must be listed in the manifest, and every listed file must be
   present with a matching sha256.

Because trust-roots (including the revocation list) and every policy doc are hashed into
**one** manifest under **one** epoch, partial rollback of a single file is impossible, and
an older validly-signed but lower-epoch manifest is rejected by the floor.

### 4.5 Off-workspace pins (env / deploy)

Two pins are held off the workspace (env / deploy image), never in a workspace file the
agent can edit:

| Env var | Meaning |
| --- | --- |
| `POLICY_CONFIG_ROOT_FP` | the pinned config-root fingerprint (AC-37). **Its presence toggles enforcement.** |
| `POLICY_CONFIG_MIN_EPOCH` | the minimum acceptable `configEpoch` floor (AC-47); defaults to `1`. |
| `POLICY_CONFIG_ROOT_KEY` | the config-root public key material (PEM/DER-base64) ... |
| `POLICY_CONFIG_ROOT_KEY_PATH` | ... or a path to it. |
| `POLICY_CONFIG_DIR` | override for the `.policy` directory (default `<projectRoot>/.policy`). |
| `POLICY_ISSUER_ROOTS` | the `engine` trust roots that may sign a `CommandAuthorization` (JSON). |

These names are shared by the SDK breakpoint gate
([`trusted-breakpoint-policy.ts`](../packages/babysitter-sdk/src/breakpoints/trusted-breakpoint-policy.ts))
and the tool-layer gate
([`policy-enforcement-wiring.ts`](../packages/adapters/policy/src/policy-enforcement-wiring.ts)),
so one pinned anchor governs both.

### 4.6 Key provisioning / rotation runbook

> **Note on CLI status.** The design describes `policy-adapter init-config-root` /
> `sign-config` CLI steps (AC-37). The **shipped** package exports the verification and
> issuance library functions (`verifyConfigManifest`, `issueCommandAuthorization`,
> `signPayload`, `createKeyPair`); the manifest-signing is performed by an out-of-agent
> operator step (in the e2e fixture builder,
> [`e2e-trust-chain.e2e.test.ts`](../packages/adapters/policy/src/__tests__/e2e-trust-chain.e2e.test.ts),
> this is done in-process with `signPayload`). Treat the following as the operator
> procedure the library supports; a packaged CLI binary is not yet shipped.

1. **Generate the config root off the workspace.** `createKeyPair()`
   (`@a5c-ai/genty-core/trust`) on the operator's trusted host (or KMS/HSM). Store the
   private half where agents cannot read it. Pin the public half's fingerprint as
   `POLICY_CONFIG_ROOT_FP` and its material as `POLICY_CONFIG_ROOT_KEY[_PATH]`, and pin
   `POLICY_CONFIG_MIN_EPOCH` (start at `1`) — all in the deploy artifact, not the workspace.
2. **Generate evidence-signing keys.** Human keys via proven `generateKeyPair`
   (`kind:'human'`); engine/proxy/issuer keys via `createKeyPair` (`kind:'engine'`, with
   `producer:'proxy'` / `'in-process'` where relevant); agent keys via `createAgentIdentity`
   (`kind:'agent'`). Register their public halves in `.policy/trust-roots.json`.
3. **Sign the manifest.** Hash `trust-roots.json` + every `policies/*.yaml`
   (+ `credential-scope-source.json` / `breakpoint-policy.json` when present) into a
   `ConfigManifestPayload` with `configEpoch = 1`, sign it with the config-root key, and
   write `.policy/config-manifest.json`. Provision the issuer roots into `POLICY_ISSUER_ROOTS`.
4. **Rotate a key.** Rotation reuses proven `rotateKey` (marks the old public key
   `expiresAt`, provisions a new pair). A signature made while a key was valid still verifies
   unless the key is revoked.
5. **Revoke a key.** Set `revoked: true` in `trust-roots.json` — **and** re-sign a
   strictly-higher `configEpoch` **and** advance the deploy-pinned `POLICY_CONFIG_MIN_EPOCH`.
   Because the revocation list is hashed into the manifest under the epoch, this permanently
   pushes the un-revoked (lower-epoch) state below the floor, so a rollback cannot un-revoke
   a stolen key (AC-27/AC-46).

---

## 5. Policy document schema

A policy document (YAML or JSON) is parsed and validated by `parsePolicyDocument`
([`policy-schema.ts`](../packages/adapters/policy/src/policy-schema.ts)), which **fails
closed** (throws) on invalid YAML or any missing/invalid required field.

```yaml
version: 1                          # required
authorizationTtlSeconds: 120        # default; per-action override allowed
commandDefaultAllow: false          # AC-38b: default-allow for command-bearing tools is OPT-IN (default false)
defaultDeny:                        # AC-23c: credentialScope globs that default-deny when uncovered
  - "aws:prod:*"
actions:
  - id: aws-prod-write
    effect: allow                   # optional; 'deny' makes an explicit deny action (deny > grant)
    match:
      tool: "Bash"                  # glob over tool name
      argv:                         # AC-38: match on CANONICALIZED argv (absent → non-command tool)
        program: "aws"
        subcommandEquals: ["s3 cp", "s3 rm", "s3 sync"]
        subcommandMatches: ["s3 .*"]      # optional; anchored regex over a normalized subcommand window
        wrapperAllowlist: ["time", "sudo"] # AC-38c: transparent wrappers the matcher may recurse through
        recognizedPrograms: ["aws"]        # programs recognized as legitimate for this scope
      credentialScope: "aws:prod:*" # glob over the requested credential scope
    requireProxyAttestation: true   # optional; defaults TRUE when credentialScope is present (AC-39)
    authorizationTtlSeconds: 120    # optional per-action override
    chains:                         # satisfied if ANY chain fully verifies (OR across chains)
      - id: human-plus-opus
        requirements:               # AND across a chain's requirements
          - step:
              kind: human-approval
              trustedIdentities: ["role:sre-oncall"]
              conditions:
                scopeEquals: "aws:prod:s3"
                notExpired: true
          - step:
              kind: model-decision
              conditions:
                modelIdMatches: "claude-opus-.*"
```

### 5.1 Action matchers

- **`match.tool`** — a `*`-glob over the tool name.
- **`match.argv` (AC-38, canonicalized/tokenized).** Matching operates on a canonicalized
  argv, never a raw string (see
  [`argv-matcher.ts`](../packages/adapters/policy/src/argv-matcher.ts)):
  - `program` — the resolved binary **basename** (`/usr/local/bin/aws`, a symlink to it, and
    bare `aws` all canonicalize to `aws`).
  - `subcommandEquals` / `subcommandMatches` — matched as a **contiguous window over the
    non-option token sequence**, so global options (`aws --region x s3 rm`) cannot hide a
    covered/deny-listed subcommand. `subcommandMatches` regexes are anchored full-string over
    the window.
  - `wrapperAllowlist` (AC-38c) — a **closed per-scope allowlist** of transparent leading
    wrappers (e.g. `time`, `sudo -u <user>`) the matcher recurses through. Any leading token
    **not** on the allowlist, a shell `-c` payload, an interpreter running inline code
    (`python -c`, `perl -e`, `node -e`, `python -m`), command substitution (`$()`/backticks),
    variable-indirect programs (`$PROG`), `eval`, or inline env-assignment (`AWS=aws`) makes
    the program **unresolvable**. An unresolvable program **that touches a covered scope** is
    **denied** outright (covered-but-unauthorized, AC-38a) — it never falls through to
    default-allow. (A shell `-c` payload's *inner* program is matched by recursing into it.)
  - `recognizedPrograms` — the programs recognized as legitimate resolved programs for the
    scope, used to decide whether an unresolvable command "touches" the scope.
- **`match.credentialScope`** — a `*`-glob over the requested credential scope.

### 5.2 Chains, requirements, conditions

- **`chains[]`** — alternative trust-chain templates; the evaluator grants on the **first**
  fully-satisfied chain (OR across chains, AC-19a). A grant action must declare ≥1 chain; a
  `deny` action needs none.
- **`requirements[]`** — a chain is a list of **requirements** evaluated with **AND**
  (AC-41a). Each requirement is either `{ step: {...} }` or `{ quorum: {...} }`. An evidence
  envelope may not be counted toward more than one requirement (no double-use).
  - **Legacy sugar** accepted and normalized: a top-level `steps: [...]` (one `{ step }` per
    entry) and a top-level `quorum: {of, min}` (with a sibling single `steps[0]` supplying
    its `trustedIdentities`/`conditions`).
- **`step`** — `{ kind, trustedIdentities?, conditions? }`. `kind` is one of `human-approval`
  | `model-decision` | `delegation`. `trustedIdentities` are fingerprints or role labels
  passed to the verifier as `allowedFingerprints`.
- **`quorum` (AC-41 distinct-holder)** — `{ of, min, trustedIdentities?, conditions? }`.
  Requires `min` evidences of that kind from **`min` distinct trusted-store identities**. For
  human approvals, distinctness is keyed on the resolved trust root's `identityId` (falling
  back to `label`, then fingerprint), **not** the payload's attacker-signed `approvedBy` — so
  one human's two keys cannot meet a 2-of quorum.
- **`conditions`** (all in
  [`policy-schema.ts`](../packages/adapters/policy/src/policy-schema.ts) `StepConditions`,
  evaluated in `policy-evaluator.ts` `conditionsHold`):
  - `modelIdMatches` — anchored full-string regex over `payload.modelId` (the "opus decided"
    allowlist; anchoring prevents `gpt-cheap-claude-opus-x` widening).
  - `scopeEquals` — `payload.scope` must equal this value.
  - `notExpired` — reuses `isPermissionValid` for `PermissionEvidence`.
  - `tagContains` — a tag must be present in `payload.tags`.
  - `requiresDelegation` / `expectedDelegatee` — a delegation requirement takes the chain
    path, verifies true linkage via `verifyTrustChainTrusted`, and asserts the terminal
    identity equals `expectedDelegatee` (a single independent link cannot satisfy it).

### 5.3 Evaluation semantics (AC-20)

`evaluatePolicy` returns `{ granted, matchedChainId?, reason, evidenceUsed, actionId?,
requiredStepCount?, stepBindings? }`. Precedence: a covered-but-disguised command (AC-38a)
denies unconditionally; then any matching `deny` action wins over grants; then the first
grant action whose any chain is fully satisfied grants. A below-floor `configEpoch` denies
all. On a grant, `issueFromDecision`
([`authorization-issuer.ts`](../packages/adapters/policy/src/authorization-issuer.ts)) mints
the `CommandAuthorization` **only** when `decision.granted === true`, binding
tool/args/command/scope/toolCallId/epoch/chain from the granted decision and one evidence
per satisfied requirement — never from free-form caller input.

### 5.4 Worked example — `aws-cli` human + opus (with quorum alternate)

From
[`examples/aws-cli-human-plus-opus/policies/aws-prod-write.yaml`](../packages/adapters/policy/examples/aws-cli-human-plus-opus/policies/aws-prod-write.yaml)
— copy-pasteable:

```yaml
version: 1
authorizationTtlSeconds: 120
commandDefaultAllow: false
defaultDeny:
  - "aws:prod:*"
actions:
  - id: aws-prod-write
    match:
      tool: "Bash"
      argv:
        program: "aws"
        subcommandEquals: ["s3 cp", "s3 rm", "s3 sync"]
        wrapperAllowlist: ["time", "sudo"]
        recognizedPrograms: ["aws"]
      credentialScope: "aws:prod:*"
    # requireProxyAttestation omitted -> defaults to TRUE (credentialScope present, AC-39).
    chains:
      - id: human-plus-opus
        requirements:
          - step:
              kind: human-approval
              trustedIdentities: ["role:sre-oncall"]
              conditions:
                scopeEquals: "aws:prod:s3"
                notExpired: true
          - step:
              kind: model-decision
              conditions:
                modelIdMatches: "claude-opus-.*"
      - id: two-human-quorum
        requirements:
          - quorum:
              of: "human-approval"
              min: 2
              trustedIdentities: ["role:sre-oncall"]
              conditions:
                scopeEquals: "aws:prod:s3"
                notExpired: true
```

`s3 cp|rm|sync` under `aws:prod:*` is authorized by **either** a signed human approval AND
an opus model-decision, **or** a distinct-holder 2-human quorum (OR across chains). Because
the action names a `credentialScope`, proxy attestation is required by default.

The scenario's trust roots and credential source are in
[`trust-roots.template.json`](../packages/adapters/policy/examples/aws-cli-human-plus-opus/trust-roots.template.json)
(two human roots with distinct `identityId`s, a `proxy` and an `in-process` engine root, and
the issuer engine root) and
[`credential-scope-source.template.json`](../packages/adapters/policy/examples/aws-cli-human-plus-opus/credential-scope-source.template.json)
(a KMS credential with two aliases canonicalizing to one identity → one scope, AC-55). The
`.template.json` placeholders are filled by the e2e fixture builder with real Ed25519 keys.

### 5.5 Worked example — 2-human quorum (configurability)

From
[`examples/aws-cli-two-human-quorum/policies/aws-prod-write-quorum.yaml`](../packages/adapters/policy/examples/aws-cli-two-human-quorum/policies/aws-prod-write-quorum.yaml)
— a structurally different chain shape in the same format with **no code change**:

```yaml
version: 1
authorizationTtlSeconds: 120
commandDefaultAllow: false
actions:
  - id: aws-prod-write-quorum
    match:
      tool: "Bash"
      argv:
        program: "aws"
        subcommandEquals: ["s3 cp", "s3 rm", "s3 sync"]
        recognizedPrograms: ["aws"]
    # No credentialScope → proxy attestation NOT required by default; a pure human quorum.
    chains:
      - id: two-human-quorum
        requirements:
          - quorum:
              of: "human-approval"
              min: 2
              trustedIdentities: ["role:sre-oncall"]
              conditions:
                scopeEquals: "aws:prod:s3"
                notExpired: true
```

Two distinct human identities approve ⇒ allow. One human's two keys ⇒ deny (distinct-holder
rule). This proves the policy component is not hardcoded to the human+opus flow.

---

## 6. Enforcement gates

Covered = the tool/command/creds match some policy `action`. Uncovered = no action matches.
The checked-in exec-seam registry
([`exec-seam-registry.ts`](../packages/adapters/policy/src/exec-seam-registry.ts), AC-56)
enumerates every tool-execution / dispatch / spawn entry seam with its enforcement role; the
enumeration test fails the build if a new exec path is added without registering it.

### 6.1 Uniform gate contract (AC-23)

For a **covered** action: resolve required evidence, evaluate the policy against the
integrity-verified doc (not granted → deny), obtain and verify the `CommandAuthorization`
with the exact `toolCallId`/`argsHash`/`commandHash`/`credentialScope` about to run
(recomputed at the gate), and only then proceed. For an **uncovered** action: a
non-command tool passes through (default-allow) unless a `defaultDeny` scope matches; a
command-bearing tool passes only if `commandDefaultAllow: true`, otherwise **denies**
(default-deny, AC-38b). Any error, or an argv-canonicalization failure for a covered scope,
is a denial.

### 6.2 The three gates + genty seams (what each verifies)

| Seam | Role | File | Enforces |
| --- | --- | --- | --- |
| **GATE 1** — tools-adapter `ToolDispatcher.beforeToolUse` | blocking (load-bearing) | `packages/adapters/tools/src/dispatch.ts` + `policy-verifier-wiring.ts` | Full covered/uncovered/authorization decision before `executor` runs; recomputes hashes; binds the executing `toolCallId`. |
| **genty session** `definition.execute` | blocking (load-bearing) | `packages/genty/core/src/session.ts` (`policyToolGate`) | Same evaluator, in-process, using the attestation on `ToolExecutionContext`. |
| **genty MCP dispatcher** `dispatcher.dispatch` | blocking (load-bearing) | `packages/genty/platform/.../orchestration/effects.ts` (`mcpPolicyGate`) | Same evaluator at the MCP routing seam. |
| **GATE 2** — comm-adapter `preToolUse` | defense-in-depth | `packages/adapters/core/src/spawn-runtime-hooks.ts` | Hard-enforces **only** in `blocking` mode; advisory for non-blocking adapters. |
| **GATE 3** — credential-injection backstop | defense-in-depth | `packages/adapters/core/src/spawn-invocation.ts` (+ `policy-spawn-gate.ts`, `spawn-runner.ts`) | Gates scoped-credential delivery channels (§6.3). |

**Load-bearing vs defense-in-depth (AC-49).** GATE 1 and the genty session / MCP dispatcher
seams are the **load-bearing, un-bypassable** blocking gates for **every** covered action —
credential-bearing or not. GATE 2 (advisory for non-blocking adapters) and GATE 3
(credential-only) are defense-in-depth, never the sole line.

**Load-bearing status accurately stated (per the design and code).** GATE 1's
`PolicyVerifierHookBridge` primitive is production-wired via `loadPolicyVerifierBridge` /
`composePolicyBridge`
([`policy-verifier-wiring.ts`](../packages/adapters/tools/src/policy-verifier-wiring.ts)),
which installs the bridge in front of the existing hooks bridge when the anchor is pinned.
The **load-bearing seams that must be present for every covered action** are the genty
session `policyToolGate` and the MCP dispatcher `mcpPolicyGate`
([genty platform `policy-enforcement-wiring.ts`](../packages/genty/platform/src/harness/internal/createRun/orchestration/policy-enforcement-wiring.ts)),
attached centrally via `withPolicyGate` / `resolveRunPolicyGates` so no tool-executing
session can omit them.

### 6.3 GATE 3 — credential channels (AC-23a/AC-40/AC-50)

GATE 3 (`Gate3Options` + `gateCredentialInjection` in
[`spawn-invocation.ts`](../packages/adapters/core/src/spawn-invocation.ts)) mediates the
credential-delivery channels `spawn-invocation.ts` constructs: docker `-e` env and `-v`
mounts, ssh `K=V`, k8s `env`/`--env`, and k8s secret/`--serviceaccount` references. Before a
**scoped** credential is delivered, GATE 3 requires a valid `CommandAuthorization` whose
`credentialScope` matches, recomputing `argsHash`/`commandHash` from the exact command being
spawned. **No valid authorization → the channel is omitted** (env dropped, `-v` mount
omitted, secret/serviceaccount ref stripped); if the policy marks the credential required,
the spawn is **denied** (`CredentialGateDenied`).

- **The scope tag is trusted, out-of-agent (AC-40/AC-40a/AC-55).**
  [`credential-identity.ts`](../packages/adapters/policy/src/credential-identity.ts) resolves
  a credential's scope from `credential-scope-source.json`, keyed by the collision-resistant
  `sha256(stableId)` identity (never the value prefix, env-var name, or agent alias). An
  absent alias, an unknown identity, or an ambiguous identity (`>1` distinct credential)
  **denies**. Multiple aliases of one physical credential canonicalize to one identity → one
  scope (AC-55) via the alias map.
- **Auto-activation from signed config.** The scoped-credential map (`scopedCredentials`) is
  **deployment configuration** hashed into the signed manifest, not agent-writable input.
  When the anchor is pinned and the signed source declares scoped credentials, GATE 3
  **auto-activates** from config alone (`resolveSpawnGate3FromConfig` in
  [`policy-spawn-gate.ts`](../packages/adapters/core/src/policy-spawn-gate.ts)) — no caller
  `RunOptions.policyGate3` needed.

### 6.4 Honest limitations / boundaries

- **Substrate-delivered credentials are a bounded, warned non-goal (AC-50).** GATE 3 cannot
  see credentials the process obtains without `spawn-invocation.ts` constructing the
  delivery: cloud instance metadata (**IMDS / IRSA / workload-identity**), pre-existing files
  on a mount the agent already controls, image-baked creds, and secret endpoints the process
  calls itself. High-assurance scoped credentials **must** be delivered through a
  GATE-3-mediated channel; substrate-delivered credentials are mitigated by substrate
  controls (no broad instance role for agent pods, minimal images, egress policy), not by
  this design.
- **Passthrough proxy mode is a documented non-goal (AC-18).** No attestation is produced, so
  actions requiring proxy attestation deny on that path.
- **The remaining integration boundary is live evidence-collection wiring.** The
  ALLOW-path production seam exists — `createAuthorizationStore`
  ([`authorization-store.ts`](../packages/adapters/policy/src/authorization-store.ts)) plus
  `registerRunAuthorizationResolver` — but populating it (issuing authorizations from
  real proxy-sidecar / in-process attestations and signed breakpoint answers **at run time**)
  is the orchestrator-side integration that closes the loop. Until an authorization store is
  populated for a run, a covered action with no resolvable `CommandAuthorization` **denies**
  (the correct fail-closed posture): with the anchor pinned, enforcement is on and denies
  covered actions that lack proof.

---

## 7. Enabling / disabling enforcement

Enforcement is toggled by whether the off-workspace anchor is pinned:

- **Pinned (`POLICY_CONFIG_ROOT_FP` set) → enforcement ACTIVE, fail-closed.** The manifest is
  verified; covered actions require a valid `CommandAuthorization`; any config error (missing
  / edited / corrupt manifest or file, wrong signer, below-floor epoch, unreadable policy
  docs) denies every covered action. If the policy adapter cannot even load while the anchor
  is pinned, the run installs a **deny-all** gate (`denyAllGates`) — enforcement was requested
  and must not be silently disabled.
- **Not pinned → back-compat pass-through.** No gate is constructed; the SDK breakpoint gate
  and the tool-layer gates return `enforcementActive: false` and existing runs are unaffected.
  Opting in is a **deploy** operation (pinning the off-workspace root + floor), which an
  in-workspace agent cannot perform.

The same anchor governs both the SDK signed-breakpoint gate and the tool-layer gates.

---

## 8. Troubleshooting

Every denial carries a `reason`. Common ones and their causes:

| Deny reason (substring) | Cause / fix |
| --- | --- |
| `covered action has no CommandAuthorization` | The action is covered but no authorization was issued/resolved for the executing tool-call id. Populate the run's authorization store (evidence-collection wiring, §6.4), or provide the required evidence. |
| `config manifest not trusted` / `hash mismatch` / `on-disk file not listed in manifest` | A config file was edited without re-signing the manifest, or the manifest signer is not the pinned config root. Re-run the manifest signing step (§4.6). |
| `configEpoch below floor` / `configEpoch != current manifest epoch` | The config epoch is below `POLICY_CONFIG_MIN_EPOCH`, or a stale authorization from an older epoch. Advance the floor together with the new epoch (§4.6). |
| `fingerprint not in trusted store` / `trust-root kind does not match required kind` | A signer is not registered as a trust root of the required kind (e.g. an engine key presented for a human step). Register the correct root, or fix the step's `trustedIdentities`. |
| `required field not signed` / `payloadType mismatch` | The envelope omitted a required field from `signedFields`, or the wrong payload kind was presented. The producer must sign the full field set with the correct `payloadType`. |
| `signer ... is not a trusted human root` (breakpoint) | A breakpoint answer verified against a key that is not a trusted `human` root (e.g. an agent-dropped key). Only manifest-verified human roots are honored. |
| `disguised covered command` / `unresolvable ...` | A covered program was invoked via a shell `-c`, interpreter eval, `$()`/backtick, `$VAR`, `eval`, or non-allowlisted wrapper. Add a legitimate wrapper to the scope's `wrapperAllowlist`, or invoke the program directly. |
| `uncovered command-bearing action, default-deny (AC-38b)` | A command-bearing tool is not covered by any action and `commandDefaultAllow` is false. Add a covering action or set `commandDefaultAllow: true` for the environment. |
| `authorization expired` / `not yet valid` | The `CommandAuthorization` TTL lapsed (default 120s) between issuance and execution. Increase `authorizationTtlSeconds` if the gap is legitimate. |
| `ambiguous identity (>1 distinct credential)` / `alias not in trusted alias map` | The credential→scope source cannot uniquely resolve the credential. Fix `credential-scope-source.json` (add the alias, disambiguate the identity). |

Common misconfigurations:

- **Enforcement seems off.** `POLICY_CONFIG_ROOT_FP` is unset → back-compat pass-through.
  Pin it (and the key material + floor) in the deploy artifact.
- **Every covered action denies even with evidence.** The authorization store is not
  populated at run time (§6.4), or `POLICY_ISSUER_ROOTS` does not include the issuer key that
  signs authorizations.
- **In-process attestation rejected for an aws-style action.** Expected: credential-touching
  actions default to `requireProxyAttestation: true`. Route through the attesting proxy, or
  explicitly set `requireProxyAttestation: false` (recorded as a lower-assurance opt-out).

---

## 9. Package surface

`@a5c-ai/policy-adapter` public exports
([`index.ts`](../packages/adapters/policy/src/index.ts)):

| Export | Purpose |
| --- | --- |
| `verifyEnvelopeTrusted`, `verifyCommandAuthorization`, `verifyTrustChainTrusted` | Trusted-store verification (AC-35), gate CA check (AC-10), delegation chains. |
| `REQUIRED_SIGNED_FIELDS`, `EXPECTED_PAYLOAD_TYPE` | Per-kind completeness + `payloadType` constants (AC-2/AC-51). |
| `verifyConfigManifest` | Config-integrity manifest verification (AC-36/AC-46/AC-47). |
| `bridgeProvenAnswer` | proven → human-approval bridge (AC-3/AC-43/AC-48). |
| `canonicalizeArgs`, `canonicalizeArgv`, `argsHash`, `commandHash` | The one shared canonicalizer (AC-52). |
| `matchArgv` | Canonicalized argv matcher (AC-38/AC-38a/AC-38c). |
| `parsePolicyDocument`, `loadTrustStore` | Policy-doc + trust-store parse/validate (fail-closed). |
| `evaluatePolicy` | Trust-chain evaluator (AC-9/AC-19a/AC-20/AC-41/AC-42). |
| `issueCommandAuthorization`, `issueFromDecision` | Authorization issuance (grant-gated). |
| `createAuthorizationStore` | Run-level ALLOW-path store + resolver (§6.4). |
| `canonicalizeCredentialIdentity`, `resolveCredentialScope` | Credential→scope resolution (AC-40/AC-40a/AC-55). |
| `EXEC_SEAM_REGISTRY` | Checked-in exec-seam registry (AC-56). |
| `loadPolicyEnforcementGate`, `argvScopesOf` | Production gate loader + coverage helper (AC-49). |

Subpath exports: `./trust` (`verify-envelope-trusted`), `./config-manifest`,
`./proven-bridge`.

---

## 10. Acceptance-criteria traceability

The design's `AC-n` → milestone map is in
[`docs/design/proof-based-policy-enforcement.md` §12](design/proof-based-policy-enforcement.md).
Milestones: **A** trust-core, **B** policy-engine, **C** evidence-producers, **D**
tool-layer-enforcement, **E** e2e-integration. Each source file's header comment names the
ACs it implements; tests live in
[`packages/adapters/policy/src/__tests__/`](../packages/adapters/policy/src/__tests__) (unit
+ threat-model + the `e2e-trust-chain.e2e.test.ts` end-to-end scenario).
