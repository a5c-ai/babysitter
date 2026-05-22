# Agent chart and packaging spec

## Purpose

This document defines how the agent orchestration docs should map into the Helm chart and package surfaces. It is grounded in the current chart:

- CRDs live under `charts/krate/crds/`.
- Deployments, services, RBAC, ServiceAccount, NetworkPolicy, and auth Secret templates live under `charts/krate/templates/`.
- `charts/krate/values.yaml` already contains `externalDependencies`, `auth`, `apiService`, `rbac`, `serviceAccount`, `networkPolicy`, `arc`, `kyverno`, and `gatekeeper` blocks.
- `scripts/validate-package.mjs` checks required files, CRDs, values terms, and npm package contents.

## Chart values to add

```yaml
agents:
  enabled: false
  agentMux:
    enabled: false
    gatewayUrl: ""
    existingSecret: ""
    streamTimeoutSeconds: 300
  defaults:
    runnerPool: untrusted-linux
    runtimeServiceAccount: ""
    workspacePolicy: isolated-worktree-default
    approvalMode: prompt
  retention:
    dispatchRunsDays: 90
    transcriptsDays: 30
    contextBundlesDays: 30
    artifactsDays: 180
    auditDays: 365
  permissions:
    manageNativeRbac: true
    allowClusterRoleBindings: false
    requireBindEscalateReview: true
  secrets:
    enableGrantManagement: true
    allowUiSecretCreation: true
    showConfigMapValues: false
  featureGates:
    triggerRules: false
    manualDispatch: false
    workspaceLifecycle: false
    writeBackApprovals: false
    subagentTelemetry: false
```

These should be off by default until controllers exist.

## CRD packaging

Add CRDs in a dedicated file such as `charts/krate/crds/agent-resources.yaml` or split by domain:

- `agent-config-resources.yaml`
- `agent-execution-resources.yaml`
- `agent-rbac-grant-resources.yaml`

Required CRD groups:

- stack/tool/MCP/skill/subagent/context/workspace policy;
- trigger rules;
- ServiceAccount/RoleBinding/SecretGrant/ConfigGrant;
- dispatch/run/attempt/session/workspace/approval/artifact projections if CRD-backed for MVP.

If execution resources are served by the aggregated API only, the chart must still install APIService/openapi surfaces and examples; do not create etcd-backed high-cardinality CRDs by accident.

## Template changes

### ServiceAccount and RBAC

Current chart has `templates/serviceaccount.yaml` and `templates/rbac.yaml`. Agent implementation should extend them to include:

- controller permissions for agent config resources;
- read/watch permissions for native ServiceAccounts/Roles/RoleBindings where enabled;
- Secret/ConfigMap metadata access only where grants are enabled;
- no blanket Secret read for the web pod;
- separate controller role from web role if agents need broader reconciliation permissions.

### Deployments

Current deployments already set auth-related env vars. Agent additions should include:

- `KRATE_AGENTS_ENABLED`;
- `KRATE_AGENT_MUX_GATEWAY_URL`;
- `KRATE_AGENT_DEFAULT_RUNNER_POOL`;
- `KRATE_AGENT_DEFAULT_SERVICE_ACCOUNT`;
- retention env vars;
- feature gate env vars;
- secret/config grant management flags.

### NetworkPolicy

Agent Mux gateway and MCP traffic should be explicit egress rules, not broad outbound allow. The UI should surface when network policy blocks an MCP server or Agent Mux gateway.

### Secrets

Agent Mux gateway credentials should use `existingSecret` by default. The chart must not render provider secrets from plaintext values except for local-dev/demo modes.

## Examples

Add examples later under `examples/agents/`:

- `agent-stack-claude-code.yaml`;
- `agent-rbac-grants.yaml`;
- `agent-trigger-ci-repair.yaml`;
- `agent-manual-dispatch.yaml`;
- `agent-permission-review-denied.yaml`.

Package validation should eventually require at least one agent stack example and one SecretGrant/ConfigGrant example.

## Validation updates

When implementation starts, update `scripts/validate-package.mjs` to check:

- agent CRD file exists;
- required agent CRD kinds are included;
- values include `agents`, `agentMux`, `retention`, `permissions`, `secrets`, `featureGates`;
- npm pack includes new docs and examples;
- chart templates do not give web pods broad Secret read;
- chart templates consume new values.

## Release safety

- Agent features should be disabled by default until a vertical slice is implemented.
- Installing the chart with `agents.enabled=false` should behave exactly as today.
- Enabling agents without Agent Mux gateway configured should show degraded readiness, not crash the whole app.
- Missing RBAC permissions should disable agent actions but keep repository browsing available.