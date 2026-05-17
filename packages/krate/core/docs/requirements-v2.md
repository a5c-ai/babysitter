# Krate Requirements Specification v2

> Exhaustive requirements derived from implemented functionality.
> Every requirement corresponds to verified source code behavior.

---

## 1. Functional Requirements — Identity and Access

| ID | Priority | Description | Acceptance Criteria | Implementation | Test Coverage | Status |
|----|----------|-------------|--------------------:|----------------|---------------|--------|
| REQ-FUNC-IAM-001 | MUST | Multi-tenant organizations with display name and namespace binding | Organization resource created with displayName and namespaceName; OrgNamespaceBinding created; tenant namespace created in K8s | `kubernetes-controller.js:createOrganization()` | `tests/kubernetes-controller.test.js` | Implemented |
| REQ-FUNC-IAM-002 | MUST | User accounts with email, display name, admin flag | User resource created with required spec fields; admin derived from group membership | `auth.js:mapLoginProfileToKrateIdentity()` | `tests/auth.test.js` | Implemented |
| REQ-FUNC-IAM-003 | MUST | Teams with membership, maintainers, and permission grants | Team resource with members[], maintainers[], repositoryGrants[]; memberCount in status | `auth.js:createTeamResource()` | `tests/auth.test.js` | Implemented |
| REQ-FUNC-IAM-004 | MUST | Pending invitations with email, role, team, and expiry | Invite resource with expiresAt computed from expiresInDays; phase=Pending | `auth.js:createInviteResource()` | `tests/auth.test.js` | Implemented |
| REQ-FUNC-IAM-005 | MUST | Identity mapping between Krate users and external subjects | IdentityMapping with workspaceIdentity and repositoryIdentity sub-objects | `auth.js:mapLoginProfileToKrateIdentity()` | `tests/auth.test.js` | Implemented |
| REQ-FUNC-IAM-006 | MUST | Configurable auth providers (GitHub OAuth, OIDC/SSO, Delegated) | AuthProvider resource per provider; environment-driven configuration | `auth.js:createAuthProviderConfig()` | `tests/auth.test.js` | Implemented |
| REQ-FUNC-IAM-007 | MUST | Agent service accounts for K8s identity binding | AgentServiceAccount with namespace and serviceAccountName fields | `resource-model.js` | `tests/resource-model.test.js` | Implemented |
| REQ-FUNC-IAM-008 | MUST | Managed RBAC projection for agent identity | AgentRoleBinding with subject, roleRef, scope fields | `agent-permission-review.js` | `tests/agent-permission-review.test.js` | Implemented |
| REQ-FUNC-IAM-009 | MUST | Explicit secret access grants with purpose scope | AgentSecretGrant with subject, secretRef, purpose; validated by permission reviewer | `agent-secret-config-grant-controller.js` | `tests/agent-secret-config-grant.test.js` | Implemented |
| REQ-FUNC-IAM-010 | MUST | Explicit ConfigMap access grants with purpose scope | AgentConfigGrant with subject, configMapRef, purpose; validated by permission reviewer | `agent-secret-config-grant-controller.js` | `tests/agent-secret-config-grant.test.js` | Implemented |
| REQ-FUNC-IAM-011 | MUST | Admin detection from group membership | Groups `krate:platform-engineers` or `krate:repo-admins` set admin=true | `auth.js:normalizeProviderProfile()` line 124 | `tests/auth.test.js` | Implemented |
| REQ-FUNC-IAM-012 | MUST | Bootstrap admin via KRATE_ADMIN_USERNAME | Username match against profile sets isBootstrapAdmin | `auth.js:registerLoginProfile()` line 143 | `tests/auth.test.js` | Implemented |

---

## 2. Functional Requirements — Authentication

| ID | Priority | Description | Acceptance Criteria | Implementation | Test Coverage | Status |
|----|----------|-------------|--------------------:|----------------|---------------|--------|
| REQ-FUNC-AUTH-001 | MUST | GitHub OAuth sign-in flow | Authorization URL built with client_id, redirect_uri, scope, state; code exchanged for access_token; profile fetched from /user | `auth.js:buildAuthorizationRedirect(), exchangeOAuthCodeForProfile()` | `tests/auth.test.js` | Implemented |
| REQ-FUNC-AUTH-002 | MUST | OIDC/SSO sign-in flow | Same OAuth flow with configurable issuer/token/userinfo endpoints; scopes include groups | `auth.js:exchangeOAuthCodeForProfile()` | `tests/auth.test.js` | Implemented |
| REQ-FUNC-AUTH-003 | MUST | Delegated identity via proxy headers | x-forwarded-user, x-forwarded-groups, x-forwarded-email parsed; local dev fallback | `auth.js:profileFromDelegatedHeaders()` | `tests/auth.test.js` | Implemented |
| REQ-FUNC-AUTH-004 | MUST | HMAC-SHA256 signed session cookies | Payload base64url encoded; signature = HMAC-SHA256(payload, secret).base64url | `auth.js:createSessionCookie()` | `tests/auth.test.js` | Implemented |
| REQ-FUNC-AUTH-005 | MUST | Timing-safe signature verification | `timingSafeEqual(expected, received)` from node:crypto | `auth.js:parseSessionCookie()` line 189 | `tests/auth.test.js` | Implemented |
| REQ-FUNC-AUTH-006 | MUST | Reject unsigned cookies when secret configured | If dotIndex === -1 and secret is set: return null | `auth.js:parseSessionCookie()` line 178 | `tests/auth.test.js` | Implemented |
| REQ-FUNC-AUTH-007 | MUST | Reject signed cookies when no secret | If dotIndex !== -1 and no secret: return null | `auth.js:parseSessionCookie()` line 172 | `tests/auth.test.js` | Implemented |
| REQ-FUNC-AUTH-008 | MUST | HttpOnly and SameSite=Lax cookie attributes | Cookie string ends with `; Path=/; HttpOnly; SameSite=Lax` | `auth.js:createSessionCookie()` line 162 | `tests/auth.test.js` | Implemented |
| REQ-FUNC-AUTH-009 | SHOULD | Local development auto-login | Active when NODE_ENV !== 'production'; configurable user/groups | `auth.js:localDelegatedDevelopmentProfile()` | `tests/auth.test.js` | Implemented |
| REQ-FUNC-AUTH-010 | MUST | User+IdentityMapping registration on first login | registerLoginProfile creates/updates User and IdentityMapping resources via applyResource | `auth.js:registerLoginProfile()` | `tests/auth.test.js` | Implemented |

---

## 3. Functional Requirements — Repository Management

| ID | Priority | Description | Acceptance Criteria | Implementation | Test Coverage | Status |
|----|----------|-------------|--------------------:|----------------|---------------|--------|
| REQ-FUNC-REPO-001 | MUST | Repository CRUD with visibility | Repository created with organizationRef, visibility (private/internal/public); delete removes CRD | `api-controller.js:createRepository()` | `tests/api-controller.test.js` | Implemented |
| REQ-FUNC-REPO-002 | MUST | SSH key management (user, deploy, automation scopes) | SSHKey with scope field; fingerprint computed via sha256 hash | `kubernetes-controller.js:identityAccessReconciliationPlan()` | `tests/kubernetes-controller.test.js` | Implemented |
| REQ-FUNC-REPO-003 | MUST | Repository permission management | RepositoryPermission with subject, permission (read/write/admin), revoked flag | `kubernetes-controller.js:identityAccessReconciliationPlan()` | `tests/kubernetes-controller.test.js` | Implemented |
| REQ-FUNC-REPO-004 | MUST | Branch protection rules | BranchProtection with refs pattern; PR requirement enforcement | `resource-model.js` | `tests/resource-model.test.js` | Implemented |
| REQ-FUNC-REPO-005 | MUST | Reference deny rules and force-push policy | RefPolicy resource with organizationRef | `resource-model.js` | `tests/resource-model.test.js` | Implemented |
| REQ-FUNC-REPO-006 | MUST | Git object recording | POST /api/orgs/:org/repositories/:repo/objects stores object reference | `http-server.js` line 60-63 | `tests/http-server.test.js` | Implemented |
| REQ-FUNC-REPO-007 | MUST | Search index enqueuing | POST returns 202 Accepted; search indexing queued asynchronously | `http-server.js` line 66-70 | `tests/http-server.test.js` | Implemented |

---

## 4. Functional Requirements — Agent Orchestration

| ID | Priority | Description | Acceptance Criteria | Implementation | Test Coverage | Status |
|----|----------|-------------|--------------------:|----------------|---------------|--------|
| REQ-FUNC-AGENT-001 | MUST | Reusable agent stacks with full config | AgentStack with baseAgent, adapter, runtimeIdentity, toolPolicy, mcpServerRefs, skillRefs, subagentRefs, contextLabelRefs, approvalMode | `agent-stack-controller.js` | `tests/agent-stack-controller.test.js` | Implemented |
| REQ-FUNC-AGENT-002 | MUST | Stack readiness reconciliation with 10 conditions | reconcileStack() resolves all refs, runs permission review, computes Ready condition | `agent-stack-controller.js:reconcileStack()` | `tests/agent-stack-controller.test.js` | Implemented |
| REQ-FUNC-AGENT-003 | MUST | MCP health check with 3s timeout | HTTP GET to endpoint with AbortController timeout; returns healthy/unhealthy + latencyMs | `agent-stack-controller.js:checkMcpHealth()` | `tests/agent-stack-controller.test.js` | Implemented |
| REQ-FUNC-AGENT-004 | MUST | Manual dispatch with permission gating | createManualDispatch: find stack → permission review → memory snapshot → workspace → context → launch | `agent-dispatch-controller.js` | `tests/agent-dispatch-controller.test.js` | Implemented |
| REQ-FUNC-AGENT-005 | MUST | Permission review with cross-org denial | Cross-org check: agent org vs repository org; denied if mismatch | `agent-permission-review.js` line 44-52 | `tests/agent-permission-review.test.js` | Implemented |
| REQ-FUNC-AGENT-006 | MUST | Untrusted fork detection | Refs matching `/^refs\/pull\/\d+\//` flagged as fork; privileged grants restricted | `agent-permission-review.js` line 64 | `tests/agent-permission-review.test.js` | Implemented |
| REQ-FUNC-AGENT-007 | MUST | Approval mode enforcement (yolo/prompt/deny) | deny: immediate block; prompt: requires-approval; yolo: allowed | `agent-permission-review.js` lines 34-40 | `tests/agent-permission-review.test.js` | Implemented |
| REQ-FUNC-AGENT-008 | MUST | Workspace provisioning with PVC | createWorkspace generates KrateWorkspace + PVC manifest with storage class, capacity, access modes | `agent-workspace-controller.js:createWorkspace()` | `tests/agent-workspace-controller.test.js` | Implemented |
| REQ-FUNC-AGENT-009 | MUST | Workspace reuse by repo+branch+phase | findReusableWorkspace matches org+repo+branch+Ready phase | `agent-workspace-controller.js:findReusableWorkspace()` | `tests/agent-workspace-controller.test.js` | Implemented |
| REQ-FUNC-AGENT-010 | MUST | Codespace lifecycle (launch/stop/status) | Pod spec with code-server image, PVC mount, Service with ClusterIP | `agent-workspace-controller.js:launchCodespace()` | `tests/agent-workspace-controller.test.js` | Implemented |
| REQ-FUNC-AGENT-011 | MUST | Event-to-stack routing via trigger rules | evaluateEvent matches event type against rule sources; dedup check; dispatch creation | `agent-trigger-controller.js:processEvent()` | `tests/agent-trigger-controller.test.js` | Implemented |
| REQ-FUNC-AGENT-012 | MUST | Cron expression validation (5-field) | validateCronExpression checks 5 fields, valid chars [0-9*/,-] | `agent-trigger-controller.js:validateCronExpression()` | `tests/agent-trigger-controller.test.js` | Implemented |
| REQ-FUNC-AGENT-013 | MUST | Next cron run calculation | calculateNextRun iterates minute-by-minute up to 527,040 iterations (1 year) | `agent-trigger-controller.js:calculateNextRun()` | `tests/agent-trigger-controller.test.js` | Implemented |
| REQ-FUNC-AGENT-014 | MUST | Human approval gates for agent actions | createApprovalRequest with 5 valid actions; recordDecision approve/deny; dedup check | `agent-approval-controller.js` | `tests/agent-approval-controller.test.js` | Implemented |
| REQ-FUNC-AGENT-015 | MUST | Approval enforcement gate | enforceApproval returns allowed/denied/pending based on phase | `agent-approval-controller.js:enforceApproval()` | `tests/agent-approval-controller.test.js` | Implemented |
| REQ-FUNC-AGENT-016 | MUST | Work item linking (issues/PRs to sessions/workspaces) | WorkItemSessionLink and WorkItemWorkspaceLink resources created | `agent-workspace-controller.js:linkWorkItem(), linkWorkItemToSession()` | `tests/agent-workspace-controller.test.js` | Implemented |
| REQ-FUNC-AGENT-017 | MUST | Workspace associations | addAssociation/removeAssociation with valid kinds: AgentDispatchRun, User, AgentSession | `agent-workspace-controller.js:addAssociation()` | `tests/agent-workspace-controller.test.js` | Implemented |
| REQ-FUNC-AGENT-018 | MUST | Workspace run history | getWorkspaceRuns partitions into active (Running/Queued/Pending/Dispatched) and history | `agent-workspace-controller.js:getWorkspaceRuns()` | `tests/agent-workspace-controller.test.js` | Implemented |

---

## 5. Functional Requirements — Memory System

| ID | Priority | Description | Acceptance Criteria | Implementation | Test Coverage | Status |
|----|----------|-------------|--------------------:|----------------|---------------|--------|
| REQ-FUNC-MEM-001 | MUST | Graph query with nodeKind filtering and depth | queryGraph: records filtered by kinds[], scored by id/attribute match, edges followed to depth | `agent-memory-query.js:queryGraph()` | `tests/agent-memory-query.test.js` | Implemented |
| REQ-FUNC-MEM-002 | MUST | Full-text grep with context extraction | queryGrep: line-by-line case-insensitive search; context lines above/below; highlighted output | `agent-memory-query.js:queryGrep()` | `tests/agent-memory-query.test.js` | Implemented |
| REQ-FUNC-MEM-003 | MUST | Combined graph+grep query | queryMemory: mode selects graph-only, grep-only, or both; merged stats | `agent-memory-query.js:queryMemory()` | `tests/agent-memory-query.test.js` | Implemented |
| REQ-FUNC-MEM-004 | MUST | Query validation (non-empty string required) | Throws Error if query is null, undefined, or empty string | `agent-memory-query.js` lines 42-45 | `tests/agent-memory-query.test.js` | Implemented |
| REQ-FUNC-MEM-005 | MUST | Mode validation | Throws Error if mode not in ['graph-only', 'grep-only', 'graph-and-grep'] | `agent-memory-query.js` line 168 | `tests/agent-memory-query.test.js` | Implemented |
| REQ-FUNC-MEM-006 | MUST | Grep path filtering with glob patterns | Glob match: * matches any sequence; documents filtered before search | `agent-memory-query.js:globMatch()` | `tests/agent-memory-query.test.js` | Implemented |
| REQ-FUNC-MEM-007 | MUST | Grep max matches limit | Default 25; stops searching once limit reached | `agent-memory-query.js:queryGrep()` line 106 | `tests/agent-memory-query.test.js` | Implemented |
| REQ-FUNC-MEM-008 | MUST | Graph adjacency from both record edges and flat edges | buildAdjacency merges per-record edges[] with flat edges parameter | `agent-memory-query.js:buildAdjacency()` | `tests/agent-memory-query.test.js` | Implemented |
| REQ-FUNC-MEM-009 | MUST | BFS edge traversal with cycle prevention | visited Set prevents infinite loops; frontier-based BFS up to maxDepth | `agent-memory-query.js:followEdges()` | `tests/agent-memory-query.test.js` | Implemented |
| REQ-FUNC-MEM-010 | MUST | Memory import from babysitter runs | parseJournalForImport extracts importable data; validateMemoryImport checks structure | `agent-memory-import.js` | `tests/agent-memory-import.test.js` | Implemented |

---

## 6. Functional Requirements — External Backend Integration

| ID | Priority | Description | Acceptance Criteria | Implementation | Test Coverage | Status |
|----|----------|-------------|--------------------:|----------------|---------------|--------|
| REQ-FUNC-EXT-001 | MUST | HMAC-SHA256 webhook signature verification | sha256= prefix; createHmac + timingSafeEqual; reject on mismatch | `external/webhook-controller.js:verifyHmacSignature()` | `tests/external/webhook-controller.test.js` | Implemented |
| REQ-FUNC-EXT-002 | MUST | Delivery deduplication by ID | isDuplicate(deliveryId) checks Map; processDelivery returns duplicate=true if exists | `external/webhook-controller.js:isDuplicate()` | `tests/external/webhook-controller.test.js` | Implemented |
| REQ-FUNC-EXT-003 | MUST | Event normalization from raw provider format | normalizeEvent produces canonical { eventType, action, nativeId, providerRef, resourceKind, data, timestamps } | `external/sync-controller.js:normalizeEvent()` | `tests/external/sync-controller.test.js` | Implemented |
| REQ-FUNC-EXT-004 | MUST | Resource upsert with external envelope | upsertResource stores nativeId, url, etag, providerRef, firstSyncedAt, lastSyncedAt | `external/sync-controller.js:upsertResource()` | `tests/external/sync-controller.test.js` | Implemented |
| REQ-FUNC-EXT-005 | MUST | High-watermark tracking per binding | updateWatermark only advances forward; getWatermark returns current | `external/sync-controller.js:updateWatermark()` | `tests/external/sync-controller.test.js` | Implemented |
| REQ-FUNC-EXT-006 | MUST | Ownership mode enforcement | bidirectional=allow all; external-owned=block krate writes; krate-owned=block external writes | `external/sync-controller.js:applyOwnershipMode()` | `tests/external/sync-controller.test.js` | Implemented |
| REQ-FUNC-EXT-007 | MUST | Tombstone creation for deleted externals | createTombstone stores nativeId, providerRef, localRef, deletedAt, tombstoned=true | `external/sync-controller.js:createTombstone()` | `tests/external/sync-controller.test.js` | Implemented |
| REQ-FUNC-EXT-008 | MUST | Field-level conflict detection | detectConflict compares localValue vs externalValue; creates ExternalSyncConflict if different | `external/conflict-controller.js:detectConflict()` | `tests/external/conflict-controller.test.js` | Implemented |
| REQ-FUNC-EXT-009 | MUST | Conflict resolution with 4 strategies | prefer-external, prefer-krate, manual, ignore; resolveConflict sets phase=Resolved | `external/conflict-controller.js:resolveConflict()` | `tests/external/conflict-controller.test.js` | Implemented |
| REQ-FUNC-EXT-010 | MUST | Write intent lifecycle with approval | createWriteIntent → PendingApproval → ReadyToSend → Sending → Succeeded/Failed | `external/write-controller.js` | `tests/external/write-controller.test.js` | Implemented |
| REQ-FUNC-EXT-011 | MUST | Write intent idempotency key | Deterministic djb2 hash of (interfaceKey, operation, resourceRef, payload) | `external/write-controller.js:getIdempotencyKey()` | `tests/external/write-controller.test.js` | Implemented |
| REQ-FUNC-EXT-012 | MUST | GitHub adapter (auth, git-forge, issues, CI) | Separate modules: auth.js, git-forge.js, issue-tracking.js, cicd.js, index.js | `external/github/` | `tests/external/github/` | Implemented |

---

## 7. Non-Functional Requirements — Performance

| ID | Priority | Description | Acceptance Criteria | Implementation | Status |
|----|----------|-------------|--------------------:|----------------|--------|
| NFR-PERF-001 | MUST | Stale-while-revalidate cache with 30s TTL | Return stale data immediately; background refresh; configurable via KRATE_SNAPSHOT_CACHE_TTL_MS | `snapshot-cache.js:staleWhileRevalidate()` | Implemented |
| NFR-PERF-002 | MUST | Per-org independent cache entries | Map-based; each org revalidates independently | `snapshot-cache.js:orgCacheMap` | Implemented |
| NFR-PERF-003 | MUST | Event batching with configurable flush | maxBatchSize=50, flushIntervalMs=1000; fire-and-forget on size limit | `async-controller.js:createEventBatcher()` | Implemented |
| NFR-PERF-004 | MUST | Exponential backoff retry with jitter | baseDelay * 2^attempt, capped at maxDelay; full-jitter option | `async-controller.js:createRetryPolicy()` | Implemented |
| NFR-PERF-005 | MUST | Concurrent delivery queue | configurable concurrency (default 5); ordered processing | `async-controller.js:createDeliveryQueue()` | Implemented |
| NFR-PERF-006 | MUST | SSE heartbeat every 30 seconds | setInterval(30000) writes heartbeat JSON | `http-server.js` line 302 | Implemented |
| NFR-PERF-007 | MUST | kubectl timeout protection | spawnSync with configurable timeout (default 3s) | `kubernetes-controller.js:runKubectl()` | Implemented |
| NFR-PERF-008 | MUST | 32MB kubectl output buffer | maxBuffer: KRATE_KUBECTL_MAX_BUFFER_BYTES | `kubernetes-controller.js:runKubectl()` | Implemented |

---

## 8. Non-Functional Requirements — Security

| ID | Priority | Description | Acceptance Criteria | Implementation | Status |
|----|----------|-------------|--------------------:|----------------|--------|
| NFR-SEC-001 | MUST | HMAC-SHA256 session cookie signing | createHmac('sha256', secret).update(payload).digest('base64url') | `auth.js:createSessionCookie()` | Implemented |
| NFR-SEC-002 | MUST | Timing-safe signature comparison | `timingSafeEqual` from node:crypto; length check before compare | `auth.js:parseSessionCookie()` line 189 | Implemented |
| NFR-SEC-003 | MUST | Auth on all mutating API routes | POST/DELETE routes check session; read routes generally unprotected | `http-server.js` | Implemented |
| NFR-SEC-004 | MUST | Cross-org namespace isolation | applyResource/deleteResourceForOrg verify namespace matches org | `api-controller.js` lines 85-100 | Implemented |
| NFR-SEC-005 | MUST | HMAC-SHA256 webhook signature verification | External webhook controller uses timing-safe comparison | `external/webhook-controller.js` | Implemented |
| NFR-SEC-006 | MUST | Delivery deduplication prevents replay | Map-based check before processing; duplicate returns early | `external/webhook-controller.js:isDuplicate()` | Implemented |
| NFR-SEC-007 | MUST | No secrets in permission review output | permissionReviewer mustNotOwn: 'secret values' | `agent-permission-review.js` boundary | Implemented |
| NFR-SEC-008 | MUST | Fork-restricted privileged grants | Untrusted fork detection blocks AgentServiceAccount/AgentSecretGrant auto-approval | `agent-permission-review.js` line 66-73 | Implemented |

---

## 9. Non-Functional Requirements — Reliability

| ID | Priority | Description | Acceptance Criteria | Implementation | Status |
|----|----------|-------------|--------------------:|----------------|--------|
| NFR-REL-001 | MUST | Audit failures must not crash operations | try/catch around emitAuditEvent; swallowed silently | `api-controller.js:emitAuditEvent()` | Implemented |
| NFR-REL-002 | MUST | Background revalidation errors reset flag | catch block clears revalidating=false for retry | `snapshot-cache.js:staleWhileRevalidate()` | Implemented |
| NFR-REL-003 | MUST | Fire-and-forget persistence in external controllers | `Promise.resolve(persistFn(resource)).catch(() => {})` | All external controllers | Implemented |
| NFR-REL-004 | MUST | Delivery queue error isolation | processItem catches; retries per policy; swallows after max | `async-controller.js:createDeliveryQueue()` | Implemented |
| NFR-REL-005 | MUST | Graceful degraded snapshot on kubectl failure | Returns partial snapshot with errors[] array; resources empty | `kubernetes-controller.js:getControllerSnapshot()` | Implemented |

---

## 10. Integration Requirements

| ID | Priority | Description | Acceptance Criteria | Implementation | Status |
|----|----------|-------------|--------------------:|----------------|--------|
| INT-K8S-001 | MUST | Store CONFIG resources as CRDs | kubectl apply/get/delete with krate.a5c.ai group | `kubernetes-controller.js` | Implemented |
| INT-K8S-002 | MUST | Use kubectl for all K8s operations | spawnSync/spawn with configurable binary path | `kubernetes-controller.js:runKubectl()` | Implemented |
| INT-K8S-003 | MUST | In-cluster authentication support | Auto-detect SA token + CA cert; inject --server/--token/--certificate-authority | `kubernetes-controller.js:inClusterKubectlConfig()` | Implemented |
| INT-K8S-004 | MUST | Namespace auto-creation | ensureNamespace before apply; kubectl create namespace if not exists | `kubernetes-controller.js:ensureNamespace()` | Implemented |
| INT-K8S-005 | MUST | SubjectAccessReview for permission discovery | `kubectl auth can-i <verb> <resource>` for each CRD | `kubernetes-controller.js:canI()` | Implemented |
| INT-GITEA-001 | MUST | Repository hosting via Gitea | createGiteaService with baseUrl and token | `gitea-service.js` | Implemented |
| INT-ATLAS-001 | SHOULD | Atlas graph search for stack builder | fetchAtlasRecordsByKinds queries /api/v1/kinds/{kind}; searchAtlasGraph queries /api/v1/search | `sdk/src/atlas-graph-client.js` | Implemented |
| INT-GH-001 | MUST | GitHub webhook normalization | normalizeWebhookEvent handles workflow_run, PR, comment, label, push | `http-server.js:normalizeWebhookEvent()` | Implemented |
| INT-KYVERNO-001 | SHOULD | Kyverno policy engine integration | CRD discovery; controller health check; policy report aggregation | `kubernetes-controller.js:discoverKyverno()` | Implemented |
| INT-KUBEVELA-001 | SHOULD | KubeVela application delivery | Application, Revision, Component, Trait, Scope discovery | `kubernetes-controller.js:KRATE_RESOURCES` | Implemented |

---

## 11. Testing Requirements

| ID | Description | Framework | Count | Source |
|----|-------------|-----------|-------|--------|
| TEST-CORE-001 | Core package unit+integration tests | node:test | 1259 | `packages/krate/core/package.json` |
| TEST-SDK-001 | SDK export and integration tests | node:test | 73 | `packages/krate/sdk/tests/` |
| TEST-CLI-001 | CLI command and MCP protocol tests | node:test | 51 | `packages/krate/cli/tests/` |
| TEST-E2E-001 | End-to-end package validation | npm run e2e | 3 | `packages/krate/core/package.json` |
| TEST-SMOKE-001 | MVP smoke assertions | npm run smoke | 21 | `packages/krate/core/package.json` |
| TEST-WEB-001 | Web console build validation | npm run build | 1 | `packages/krate/web/package.json` |
