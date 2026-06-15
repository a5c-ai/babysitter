# API Route Issues

Audit of all 55 API routes in `packages/kradle/web/app/api/`.

## Fixed Issues (resolved in this session)

| Route | Issue | Fix |
|-------|-------|-----|
| `/external/conflicts/[id]/resolve` | Called controller with `(id, strategy)` positional args, expected `({ conflictName, strategy, resolvedValue, resources })` | Fixed — passes named object |
| `/external/write-intents/[name]/cancel` | Called controller with `(name)` positional arg, expected `({ intentName, cancelledBy, resources })` | Fixed — passes named object with session user |

## Remaining Issues

### Signature Mismatch — External Sync

**File:** `app/api/orgs/[org]/external/sync/route.js`
**Issue:** The route passes only `body.bindingName` to `controller.syncExternalBinding()` but the MCP tool `kradle_sync_external` accepts `kind`, `localName`, `spec`, `externalEnvelope`, and `watermark` in addition to `bindingName`. The route ignores these additional parameters from the request body.

**Impact:** Sync operations initiated via the web UI work (binding name is sufficient for the controller), but programmatic sync via the MCP tool loses context data.

### Potential Method Name Mismatch — Inference Infer

**File:** `app/api/orgs/[org]/inference/services/[name]/infer/route.js`
**Issue:** Route calls `controller.listResources()` — verify this method exists on the controller. The SDK exports `listResource` (singular). If the method doesn't exist, inference proxy requests will fail with a TypeError.

### Potential Method Name Mismatch — Assistant Generate

**File:** `app/api/orgs/[org]/assistant/generate/route.js`
**Issue:** Route calls `listResourceForOrg()` — verify this method exists. May need to be `listResource()` with org parameter.

### Unauthenticated Routes (by design)

These routes intentionally skip `withAuth`:

| Route | Reason |
|-------|--------|
| `/atlas/search` | Public Atlas search proxy |
| `/auth/callback/[provider]` | OAuth callback (must be unauthenticated) |
| `/auth/logout` | Logout endpoint |
| `/auth/[provider]` | OAuth initiation |
| `/auth/delegated` | Delegated identity headers |
| `/agents/events/stream` | SSE stream (uses `requireAuth` directly, not `withAuth` wrapper) |
| `/watch/[[...resource]]` | Resource watch endpoint |

### Routes That Return Stubs When Infrastructure Missing

These routes work correctly when configured but return empty/stub data when backing services are absent:

| Route | Required Config | Behavior When Missing |
|-------|----------------|----------------------|
| `/repositories/[name]/blob/[...path]` | `KRADLE_GITEA_HTTP_URL` | Returns null for file content |
| `/repositories/[name]/tree` | `KRADLE_GITEA_HTTP_URL` | Returns empty tree |
| `/assistant/chat` | `ANTHROPIC_API_KEY` | Returns 500 "API key not configured" |
| `/assistant/generate` | `ANTHROPIC_API_KEY` | Returns 500 "API key not configured" |
| `/agents/events/stream` | `KRADLE_CONTROLLER_URL` | Falls back to local event bus (heartbeats + local resource events only) |
| `/snapshot` | `KRADLE_CONTROLLER_URL` | Falls back to direct kubectl snapshot |

## Route Count Summary

- **Total route.js files:** 55
- **With withAuth:** 48
- **Intentionally unauthenticated:** 7
- **With force-dynamic:** 55/55 (all correctly set)
- **With pagination support:** 6 (resources, inference services/routes/virtual-models, repositories, secrets)
