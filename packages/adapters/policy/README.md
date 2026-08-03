# @a5c-ai/policy-adapter

Proof-based policy enforcement trust core: unified signed envelopes, trusted-store key
resolution, config-integrity manifest, and the proven bridge.

This package is a runtime dependency of `@a5c-ai/comm-adapter`, `@a5c-ai/tools-adapter`
and `@a5c-ai/transport-adapter`, so it is published alongside them. It is a library, not a
CLI — there is no binary and no standalone entrypoint.

## Install

```bash
npm install @a5c-ai/policy-adapter
```

## Entrypoints

| Export | Module | Purpose |
| --- | --- | --- |
| `@a5c-ai/policy-adapter` | `dist/index.js` | Policy evaluation, authorization issue/store, exec-seam registry, argv matching and arg canonicalization. |
| `@a5c-ai/policy-adapter/trust` | `dist/verify-envelope-trusted.js` | Verify a signed envelope against the trusted key store. |
| `@a5c-ai/policy-adapter/config-manifest` | `dist/config-manifest.js` | Build and check the config-integrity manifest. |
| `@a5c-ai/policy-adapter/proven-bridge` | `dist/proven-bridge.js` | The proven bridge between an evaluated policy decision and the enforcing seam. |

## Scope

The package holds the decision and verification primitives only. Wiring them onto a
production path (which exec seams are gated, which credentials identify a caller) is the
consumer's job — see `policy-enforcement-wiring` in the main entrypoint for the seam that
consumers call.

Signing and envelope primitives live one layer down in
[`@a5c-ai/trust-core`](../../trust-core/README.md).

## License

MIT
