# Milestone E — example policy configs for the aws-cli end-to-end scenario

These are the **example configuration files** the Milestone-E end-to-end scenario
uses, so the runbook / docs milestone can reference a concrete, working config
set. They are authored from `docs/design/proof-based-policy-enforcement.md`
(§7 policy schema, §10 config layout, §11 threat model, §12 AC→milestone map).

> The `.template.json` files carry `<placeholders>` because real trust roots
> embed **generated Ed25519 public keys** and their sha256 fingerprints, and the
> credential source embeds sha256 canonical identities. The e2e test
> (`src/__tests__/e2e-trust-chain.e2e.test.ts`) is the executable fixture
> builder: it generates real keys, substitutes them into these shapes, writes a
> concrete `.policy/` tree to a temp dir, signs the config-manifest with an
> out-of-agent config root, pins `POLICY_CONFIG_ROOT_FP` + `POLICY_CONFIG_MIN_EPOCH`,
> and drives the real wired gates. Nothing here is trusted because it is on disk —
> it is trusted because it is hashed into the current-epoch signed manifest
> (AC-36 / AC-46).

## Layout (what a signed `.policy/` tree looks like at run time)

```
.policy/
  config-manifest.json         # SignedEnvelope<ConfigManifestPayload>, signed by the
                               # off-workspace config root (AC-36); carries configEpoch (AC-46)
  trust-roots.json             # public key material only (AC-26); human / engine roots
  credential-scope-source.json # trusted credential→scope source (AC-40 / AC-40a / AC-55)
  policies/
    aws-prod-write.yaml        # the covered action + trust chains
```

## `aws-cli-human-plus-opus/`

The **canonical** scenario. `policies/aws-prod-write.yaml` authorizes the `aws`
CLI to run `s3 cp|rm|sync` under a `aws:prod:*` credential scope, via two
alternative chains:

- **`human-plus-opus`** — a signed human breakpoint approval (scope `aws:prod:s3`,
  not expired) **AND** an opus model-decision attestation (`modelIdMatches:
  claude-opus-.*`). Because the action names a `credentialScope`, proxy
  attestation is required by default (AC-39): the in-process, agent-held
  attestation is rejected.
- **`two-human-quorum`** — the alternate shape, a distinct-holder 2-human quorum
  with no model condition (OR across chains, §7 / AC-19a).

`trust-roots.template.json` shows the roots the scenario needs: two human roots
(`role:sre-oncall`, distinct `identityId`s), a **proxy** engine root and an
**in-process** engine root (distinguished by `producer`, AC-6/AC-39), and the
policy-adapter **issuer** engine root that signs the `CommandAuthorization`.

`credential-scope-source.template.json` is the out-of-agent credential→scope map
(AC-40): a KMS credential referenced by two aliases (ARN + key-id) canonicalizes
to one identity → one scope (AC-55), keyed by the collision-resistant
`sha256(stableId)` identity (AC-40a).

## `aws-cli-two-human-quorum/`

The **configurability** scenario. `policies/aws-prod-write-quorum.yaml` expresses
a *different* chain shape (a pure 2-human quorum, no model condition) in the same
document format with **no code change**, proving the policy component is not
hardcoded to the human+opus flow. Two distinct human identities => allow; one
human's two keys => deny (AC-41 distinct-holder rule).
