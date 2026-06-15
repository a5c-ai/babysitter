# Kradle Product Gaps

Comprehensive gap analysis across all kradle packages. Last updated: 2026-05-30.

## Documents

| File | Scope |
|------|-------|
| [staging-status.md](./staging-status.md) | Current staging health, what works and what doesn't |
| [controller-persistence.md](./controller-persistence.md) | Which controllers persist vs plan-only, fire-and-forget patterns |
| [api-route-issues.md](./api-route-issues.md) | Signature mismatches, missing auth, stub responses |
| [testing-gaps.md](./testing-gaps.md) | Zero E2E tests, what's actually verified vs assumed |
| [infrastructure-deps.md](./infrastructure-deps.md) | Required services, env vars, what breaks when each is missing |
| [ui-ux-remaining.md](./ui-ux-remaining.md) | Console.warn in prod, index-based keys, remaining polish |

## Quick Summary

The UI layer is functionally complete — 10 resource pages with full CRUD, 300 structural tests, 10 component subdirectories, all navigation flows connected. But the product is a **control plane without a data plane**: the web console can create and manage CRD resources, but most controllers stop at "plan" without "apply" because the backing infrastructure (Gitea, Agent Adapter, real K8s reconciliation) is either not deployed or not configured on staging.

**Staging health as of 2026-05-30:**
- Kubernetes: Connected
- Gitea: Error
- Agent Adapter Gateway: Not configured
- Assistant API key: Not configured
