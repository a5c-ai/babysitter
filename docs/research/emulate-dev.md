# Emulate — emulate third-party APIs

> **Status:** Assimilation research note (no code change beyond the atlas record).
> **Date:** 2026-06-23.
> **Tagline (requester):** "Emulate third-party APIs."
> **Method:** single-source pass over the vendor homepage <https://emulate.dev>. Claims below are vendor-stated and not independently verified.
> **Atlas record:** `tool:emulate-dev` — `packages/atlas/graph/domain/tools/emulate-dev.yaml` (evidence `evidence:emulate-dev-homepage-2026-06`).

---

## 0. Bottom line

A CLI that runs **offline, stateful local replicas of ~11 popular third-party services** (Stripe, GitHub, Google, AWS, Slack, …) speaking their **real protocols** — no network, API keys, or real accounts. Built for local dev and CI: deterministic, zero-config, state persists across requests.

## 1. What it does

Stand-in services you can develop and test against without touching production APIs: create repos and push commits, charge cards, exchange OAuth tokens — and the emulated state sticks across requests within a run.

## 2. How it works

- Emulates **authentic protocols**: OAuth with **RS256** tokens, **AWS XML** responses, etc. — not just static stubs.
- **Stateful**: operations mutate persistent in-emulator state.
- **Offline & CI-ready**: deterministic results across environments, no secrets.
- Services bind to HTTPS localhost endpoints (e.g. `https://stripe.emulate.localhost`); integrates with **Portless** for the named-host routing.
- SDKs are pointed at the local host/port (e.g. `localhost:4010`) via host/port/protocol config.

## 3. Install & usage

```bash
npx emulate --portless                 # run with Portless routing
npx emulate --service github,stripe    # select services
```

Programmatic + framework integration:

```js
import { createEmulator } from "emulate"
// Next.js adapter:
// npm install @emulators/adapter-next @emulators/github
```

## 4. Relevance to babysitter / agent workflows

- **Deterministic, offline integration tests** are exactly what the live-stack / E2E lanes need to avoid flaky external dependencies and secret management — cf. the published live-stack work where real third-party installs/auth were a recurring blocker.
- An orchestrated agent could target emulated Stripe/GitHub/AWS to exercise tool-service-integration flows hermetically.
- Recorded as catalog awareness (`used_for: skill-area:tool-service-integration-agents`); not wired into babysitter test infra.

## 5. Comparison (atlas edges)

`alternative_to`: `tool:wiremock` (generic HTTP stub server vs. stateful, protocol-accurate named-service emulation), `tool:pact` (consumer-driven contract testing vs. runnable stateful service replicas).

## 6. Caveats / open questions

- Single source (vendor homepage); the exact 11 services, fidelity per service, OSS/licensing, and the `localhost:4010` vs. `*.emulate.localhost` addressing modes are vendor claims.
