# deployed-route-verify-gate

A deterministic (`kind: 'shell'`) quality gate for **auth-gated serverless routes**.
The only layer that catches serverless-specific failure — native-binary bundling,
function OOM, cold-start, cookie/SSR auth — is a request to the **actual deployed
route** with a **real authenticated session**, asserting the real response body.
Local unit tests, local pipeline probes (wrong runtime), and reachability checks
(HTTP-401 / chunk-grep) prove the code *loads*, not that it *behaves* on the target.

## Usage

```js
import { defineTask } from '@a5c-ai/babysitter-sdk';
import { createDeployedRouteVerifyGate } from './deployed-route-verify-gate.js';

const gate = createDeployedRouteVerifyGate({
  name: 'verify-import-image',
  // Command that mints a REAL session, requests the DEPLOYED route, and exits 0
  // only when the real response body satisfies the contract.
  command:
    'node scripts/verify-prod-route.mjs --path /api/import/image ' +
    '--file ./fixtures/recipe.heic --expect-status 200 --expect-json draftId',
  timeout: 300000,
});
```

Auth-mechanism-agnostic: you supply the verify command. A reference harness for
Supabase + `@supabase/ssr` cookie auth (mint session via service-role
`admin.generateLink(magiclink)` → `verifyOtp` → build the `sb-<ref>-auth-token`
cookie `base64-`+base64url(session), 3180-char chunks → POST the real file) is
described in the module JSDoc.

## Match the test to the failure mode

| Failure class | Cheapest layer that can catch it |
|---|---|
| Pure logic / data mapping | hostless unit test |
| Query / schema / RLS | 2-actor integration test |
| Native-binary bundling (sharp, node-gyp) | **deployed route** |
| Memory / OOM / cold-start / timeout | **deployed route** |
| Cookie / SSR auth | **deployed route** with a real session |
| Rendered / wired UI | screenshot of the real authenticated page |

## Diagnostic

An uncatchable **HTML-5xx** (a `try/catch` around the handler does not catch it) is
a process kill, usually **OOM**. A **JSON error** body is a normal throw.

## Provenance

Distilled from a real saga (2026-07-07): five deploys shipped with fixes "verified"
only locally; every real failure — `sharp` not bundling under Turbopack +
`vercel --prebuilt` (prod 500), and OOM decoding a 51 MP image past a 2048 MB
function limit — lived at the one layer never tested.
