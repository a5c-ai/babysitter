# Controller Persistence Gaps

Audit of which kradle core controllers actually persist state vs which only plan/validate.

## Persistence Patterns

Controllers use three persistence patterns:

1. **Async applyResource()** — Writes CRDs to Kubernetes via kubectl. Durable.
2. **Fire-and-forget persistFn()** — Calls an optional callback. If no callback wired, state is lost.
3. **In-memory only** — State stored in Maps/arrays. Lost on restart.

## Controller Status

### Fully Persistent (write to K8s)

| Controller | File | Write Methods | Mechanism |
|------------|------|---------------|-----------|
| kubernetes-controller | kubernetes-controller.js | applyResource, deleteResource, createRepository, createOrganization | kubectl apply/delete |
| auth | auth.js | registerLoginProfile | applyResource for User + IdentityMapping |
| agent-dispatch | agent-dispatch-controller.js | createManualDispatch, persistSessionEvent | applyResource for AgentDispatchRun, AgentDispatchAttempt |
| agent-approval | agent-approval-controller.js | persistApproval, recordDecision | applyResource for AgentApproval |
| adapters-client | adapters-client.js | submitAgentJob, deleteJob | resourceGateway.apply/delete for K8s Jobs |
| agent-writeback | agent-writeback-controller.js | persistWriteIntent, executeWriteIntent | applyResource + gateway.pushBranch/mergePr |
| gitea-backend | gitea-backend.js | create*, add*, protect* (13+ methods) | Gitea REST API |
| event-bus | event-bus.js | emit → persistEvent | JSONL file write (~/.kradle/events/) |

### Fire-and-Forget (optional persistence callback)

These controllers accept an optional `persistFn` callback. If the callback isn't wired at instantiation, state changes are lost.

| Controller | File | Methods | Risk |
|------------|------|---------|------|
| sync-controller | external/sync-controller.js | upsertResource, updateWatermark | Watermarks lost → re-sync from scratch on restart |
| write-controller | external/write-controller.js | createWriteIntent, approveWriteIntent | Pending intents lost → approved writes never execute |
| conflict-controller | external/conflict-controller.js | detectConflict, resolveConflict | Open conflicts lost → user must re-resolve |

**Are the callbacks wired?** This depends on how the web API routes instantiate these controllers. The routes in `packages/kradle/web/app/api/orgs/[org]/external/` create controller instances — need to verify if they pass `persistFn` that calls `applyResource`.

### Plan-Only (no persistence)

These controllers validate, compute, or plan but never write state:

| Controller | File | What It Does | What's Missing |
|------------|------|-------------|----------------|
| agent-memory-controller | agent-memory-controller.js | Creates snapshot/import/update resource objects | Never calls applyResource — returns objects for the caller to persist |
| agent-stack-controller | agent-stack-controller.js | Reconciles stack config, checks MCP health | Read-only validation |
| agent-adapter-controller | agent-adapter-controller.js | Validates adapter config, returns capabilities | Read-only validation |
| model-route-controller | model-route-controller.js | Validates routes, generates Envoy manifests | Manifests generated but not applied to K8s |
| virtual-model-controller | virtual-model-controller.js | Executes hooks in sandbox, evaluates rules | Side-effects via eventBus only, no CRD writes |
| provider-adapter | external/provider-adapter.js | Registry and validation | Pure validation |

### Implications

1. **External sync state is fragile.** If the web server restarts, all watermarks and conflict records are lost. Users have to re-resolve conflicts.

2. **Memory controller returns objects but doesn't persist.** The API route that calls `controller.createMemorySnapshot()` gets back a resource object — it must then call `applyResource()` itself. If any route forgets this step, the operation appears to succeed but nothing is saved.

3. **Model route manifests are generated but never applied.** `generateEnvoyRouteManifest()` creates valid Envoy RouteConfig YAML, but there's no code that applies it to the cluster. The manifests are returned to the UI for display only.

4. **Virtual model hooks execute but don't persist results.** Hooks run in the vm sandbox and return results, but hook execution results aren't written to any CRD. The only side effect is eventBus emission.

## Missing Error Handling

- `auth.js` `registerLoginProfile()` calls `applyResource()` but doesn't check the result. If the write fails, login appears to succeed but the user/identity mapping isn't created.
- External controllers use fire-and-forget `persist()` — no error propagation to the caller.
- `event-bus.js` `persistEvent()` catches and silently ignores file write errors.
