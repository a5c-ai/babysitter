# Kradle Product Improvement Plan

## Current Reality: 35-40% Functional

The web console is 100% built but 75% of it is theater — forms render, CRDs get stored in etcd, but nothing executes. The gap between "configured" and "deployed" is unmeasured. CI validates code compiles, not that the product works.

## Three Problems to Solve

### Problem 1: The Data Plane Doesn't Exist
Controllers validate and plan but don't execute. Agent dispatch creates CRDs but no K8s Jobs. Model routes generate Envoy manifests but never apply them. The product is a control plane without a data plane.

### Problem 2: CI Tests Code, Not Product
2,113 tests all pass — against in-memory mocks. Zero tests prove the product works end-to-end. No test creates a stack → dispatches an agent → verifies the Job runs → checks the result. The test suite gives false confidence.

### Problem 3: Staging Is Half-Deployed
Gitea is down. Agent Gateway isn't configured. No API key for the assistant. Features silently degrade to empty states. Nobody knows what works because there's no feedback loop from staging to development.

---

## Phase 0: Staging Must Work First (Week 1)

Nothing else matters until staging is functional. Developers can't iterate on features they can't see working.

### 0.1 Fix staging infrastructure
- Deploy Gitea with persistent storage (not emptyDir)
- Configure Agent Adapter Gateway URL
- Set ANTHROPIC_API_KEY or wire Azure Foundry (already partially done)
- Verify health page shows all green

### 0.2 Smoke test staging manually
Walk through every page. Document what works vs what's broken. This becomes the baseline.

### 0.3 Add staging health check to CI
After every deploy, run a curl-based smoke test:
```bash
curl -s https://kradle-staging.a5c.ai/api/controller | jq '.status'
# Must return "ready"
```
If staging deploy breaks, CI should surface it immediately — not silently succeed.

---

## Phase 1: Close the Controller Execution Gap (Weeks 2-4)

### 1.1 Agent dispatch must actually run
The dispatch controller creates `AgentDispatchRun` CRDs but `agentMuxClient.submitAgentJob()` has no gateway. Fix:
- Wire the Agent Adapter Gateway URL in staging
- Verify: create stack → dispatch → K8s Job appears → pod runs → result returned
- Add integration test that proves this works

### 1.2 Memory controller must persist
`createMemorySnapshot()`, `createImport()` return objects but never call `applyResource()`. The API routes must persist the returned objects. Fix:
```javascript
const snapshot = controller.createMemorySnapshot(params);
await kradleSdk.applyResource(snapshot); // This line is missing
```

### 1.3 Model route manifests must be applied
`generateEnvoyRouteManifest()` creates valid YAML but nothing applies it. Add a reconciliation step that applies generated manifests to the cluster.

### 1.4 External sync state must persist across restarts
Sync/write/conflict controllers use fire-and-forget `persistFn` callbacks. Verify the web API routes pass the callback that calls `applyResource()`.

---

## Phase 2: E2E Testing That Proves the Product Works (Weeks 3-5)

### 2.1 Playwright E2E against staging
```
cd packages/kradle/web && npx playwright test --config=playwright.config.js
```
Tests that actually navigate the UI, submit forms, and verify results:
- Login → dashboard loads
- Create stack → appears in list
- Dispatch run → run appears with "Pending" status
- Create trigger rule → enable/disable works
- View memory search → returns results

### 2.2 API integration tests against staging
Start the dev server, make real HTTP requests:
```javascript
const res = await fetch('https://kradle-staging.a5c.ai/api/orgs/default/resources', {
  method: 'POST',
  body: JSON.stringify({ kind: 'AgentStack', spec: {...} })
});
expect(res.status).toBe(200);

// Verify it was persisted
const list = await fetch('https://kradle-staging.a5c.ai/api/orgs/default/resources?kind=AgentStack');
const data = await list.json();
expect(data.items.find(s => s.metadata.name === 'test-stack')).toBeTruthy();
```

### 2.3 Cross-package integration test
Test the full pipeline: web request → API route → SDK → core controller → kubectl:
```javascript
// In packages/kradle/core/tests/integration/
// 1. Start controller with real kubectl (minikube or kind)
// 2. Apply a CRD
// 3. Query it back
// 4. Verify reconciliation happened
```

### 2.4 Add E2E to CI
The publish workflow should run E2E after deploy:
```yaml
- name: E2E smoke test
  run: |
    npx playwright test packages/kradle/web/e2e/smoke.spec.js
    curl -sf https://kradle-staging.a5c.ai/healthz | jq -e '.ok == true'
```
If E2E fails, the publish run should fail — not silently pass.

---

## Phase 3: Product Pipeline & Strategy (Weeks 4-8)

### 3.1 Feature flags per integration
Instead of silently degrading, explicitly surface what's configured:
```javascript
// In the health page
{
  gitea: { configured: true, healthy: true },
  agentGateway: { configured: false, reason: "AGENT_MUX_URL not set" },
  assistant: { configured: false, reason: "No API key" },
  inference: { configured: false, reason: "KServe not deployed" }
}
```
Pages that depend on unconfigured services should show a clear "Enable X in Settings" message, not silently render empty lists.

### 3.2 Progressive deployment strategy
Don't try to ship everything at once. Define tiers:

**Tier 1 (Ship now):** CRD management, resource CRUD, dashboard, settings
**Tier 2 (Next):** Agent dispatch + sessions (requires gateway)
**Tier 3 (After):** Git operations (requires Gitea), assistant (requires API key)
**Tier 4 (Later):** Inference serving (requires KServe), cost tracking

Each tier has its own E2E test suite. A tier ships when its tests pass against staging.

### 3.3 SDLC improvements
- **Every PR that touches kradle must include an E2E test** that proves the feature works
- **Staging deploy health check runs after every push** to staging
- **Product dashboard** showing which tiers are functional on staging vs production
- **Weekly staging review** — actually use the product, file bugs

### 3.4 Contract between web and controller
The web console imports data from the controller snapshot. This coupling is implicit — there's no contract test that verifies the web app can render what the controller returns. Add:
```javascript
// Contract: controller snapshot includes all kinds the web expects
test('snapshot includes all agent view kinds', () => {
  const snapshot = controller.snapshot();
  expect(snapshot.agents.stacks).toBeDefined();
  expect(snapshot.agents.runs).toBeDefined();
  // ... for every kind the web pages reference
});
```

---

## Phase 4: Quality Gates (Ongoing)

### 4.1 Pre-merge gates
- Unit tests pass (existing)
- Lint passes (existing)
- Build succeeds (existing)
- **NEW:** Architecture boundaries pass
- **NEW:** E2E smoke test passes against staging preview

### 4.2 Post-deploy gates
- Health check returns ok for all configured services
- E2E Playwright suite passes
- No new "Unsupported Kradle resource" errors in controller logs
- SSE endpoint emits real events (not just heartbeats)

### 4.3 Weekly product metrics
Track weekly:
- Number of CRD kinds that are end-to-end functional (target: all 89)
- E2E test count and pass rate
- Staging uptime (controller pod ready %)
- Number of pages with real data vs placeholders

---

## Priority Order

| Week | Focus | Outcome |
|------|-------|---------|
| 1 | Fix staging (Gitea, Gateway, API key) | All health checks green |
| 2 | Agent dispatch works end-to-end | First real agent run on staging |
| 3 | Playwright E2E for top 5 flows | Automated proof product works |
| 4 | Controller persistence gaps (memory, sync, model routes) | Controllers execute, not just plan |
| 5 | E2E in CI pipeline | Failing features block deploys |
| 6-8 | Tier 2-3 features online | Git ops, assistant working |

---

## Phase Scores (as of 2026-06-04)

| Phase | Score | Details |
|-------|-------|---------|
| Phase 0 | 4/6 green | kubernetes, gitea (after deploy), eventTransport, assistant (after deploy) ok; agentMux, agentGateway not configured |
| Phase 1 | 11/11 | All controller methods that produce resources now persist them |
| Phase 2 | 14/14 tests | 14 API E2E tests passing against staging, 8 core flows covered |
| Phase 3 | 3/3 gates | Post-deploy health verification, featureRequires helper, controller-contract test added |
