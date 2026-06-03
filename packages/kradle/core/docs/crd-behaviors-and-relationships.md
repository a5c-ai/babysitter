# Kradle CRD Behaviors and Relationships

Exhaustive behavioral specification for all 76 Kradle resource kinds, external backend
synchronization patterns, Gitea and GitHub integration, issue/project relationships,
and run/runner lifecycle with Argo CD and external pipeline integration.

**API Group:** `kradle.a5c.ai`
**API Version:** `v1alpha1`
**Platform Namespace:** `kradle-system` (configurable via `KRADLE_NAMESPACE`)

---

## PART 1: Complete CRD Behavioral Specification

This section documents every resource kind in the Kradle platform. Resources are divided
into two storage classes:

- **CONFIG_KINDS** (44 kinds): Stored in etcd via Kubernetes CRDs, managed declaratively
- **AGGREGATED_KINDS** (30 kinds): Stored in PostgreSQL, accessed via aggregated API

Additionally, the platform integrates with external CRDs:
- **KubeVela** (12 kinds): `core.oam.dev` group — delivery plane
- **Kyverno** (10 kinds): `kyverno.io` and `policies.kyverno.io` — policy engine

---

### 1.1 Identity Domain (8 kinds)

Resources that establish tenant boundaries, user identities, team membership,
invitations, identity federation, authentication providers, and agent service accounts.

---

#### Organization

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | identity |
| Plural | organizations |
| Namespace | `kradle-system` (platform-scoped) |

**Purpose:** Tenant boundary. Each organization owns exactly one namespace and all
resources within it. Organizations are the top-level isolation primitive.

**Required Spec Fields:**
- `displayName` — human-readable organization name
- `namespaceName` — the bound Kubernetes namespace (e.g., `kradle-org-acme`)

**Derived Fields:**
- `spec.slug` — URL-safe identifier derived from metadata.name via `normalizeOrgSlug()`

**Behavior on Create/Apply:**
1. `withOrgScope()` normalizes the slug and assigns `metadata.namespace = kradle-system`
2. `ensureNamespace()` is called to guarantee `kradle-org-{slug}` namespace exists
3. Labels are applied: `kradle.a5c.ai/org: {slug}`, `kradle.a5c.ai/namespace: kradle-org-{slug}`
4. If the namespace does not exist, `kubectl create namespace {name}` is executed

**Behavior on Login (auto-creation):**
- `registerLoginProfile()` in `auth.js` reads `KRADLE_ADMIN_ORG` or `KRADLE_ORG` (default: `'default'`)
- Creates or updates the Organization if it does not exist

**Relationships:**
- Owns: ALL other org-scoped resources in `kradle-org-{slug}` namespace
- Referenced by: OrgNamespaceBinding (1:1 mapping)
- Platform scope: Organization and OrgNamespaceBinding live in `kradle-system`

**Controller:** `kubernetes-controller.js` — `organizationNamespaces()` resolves all org namespaces for snapshot enumeration

**Web Pages:** `/orgs` (list), auto-created on first OAuth login

**Reconciliation Plan:**
- `createOrganization()` creates three resources atomically:
  1. Kubernetes Namespace manifest with org labels
  2. Organization resource in `kradle-system`
  3. OrgNamespaceBinding resource in `kradle-system`

---

#### OrgNamespaceBinding

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | identity |
| Plural | orgnamespacebindings |
| Namespace | `kradle-system` (platform-scoped) |

**Purpose:** Explicit binding from one Organization to exactly one tenant namespace.
Ensures that namespace ownership is auditable and that organizations cannot accidentally
share namespaces.

**Required Spec Fields:**
- `organizationRef` — reference to the Organization slug
- `namespace` — the target namespace name

**Behavior on Create/Apply:**
1. `withOrgScope()` resolves org slug → namespace name
2. `spec.createNamespace` defaults to `true`
3. Labels propagated: `kradle.a5c.ai/org`, `kradle.a5c.ai/namespace`
4. Additional labels from `spec.labels` are merged into namespace metadata

**Relationships:**
- 1:1 with Organization
- Determines which namespaces are scanned during `getControllerSnapshot()`
- Used by `organizationNamespaces()` to build the list of org-scoped namespaces

**Reconciliation:**
- Created atomically alongside Organization via `createOrganization()`
- Snapshot controller enumerates bindings to discover all tenant namespaces

---

#### User

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | identity |
| Plural | users |
| Namespace | org-scoped (`kradle-org-{slug}`) |

**Purpose:** Human account profile representing an organization member. Tracks sign-in
state, admin privileges, team membership, and linked external identities.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `displayName` — full name
- `email` — primary email address

**Optional Spec Fields:**
- `username` — login handle
- `teams[]` — team membership list
- `groups[]` — group membership (e.g., `kradle:platform-engineers`)
- `disabled` — boolean to suspend the user
- `admin` — boolean for platform admin privileges

**Behavior on Create (via OAuth):**
1. `exchangeOAuthCodeForProfile()` exchanges authorization code for access token
2. `normalizeProviderProfile()` maps provider-specific fields to canonical form
3. `registerLoginProfile()` calls `mapLoginProfileToKradleIdentity()` which:
   - Creates or updates a User resource
   - Creates or updates an IdentityMapping resource
4. Bootstrap admin detection: if `KRADLE_ADMIN_USERNAME` matches, `admin: true`

**Reconciliation (identity access):**
- `identityAccessReconciliationPlan()` for User kind:
  - Phase: `Active` (normal) or `Disabled` (suspended)
  - Computes `repositoryIdentity` from username or metadata.name
  - Computes `groups` array: `['kradle:users', role-group, ...team-groups]`
  - Sync intents:
    - `workspace-identity`: ensure-user or suspend-user
    - `repository-access`: ensure-repository-user or suspend-repository-user

**RBAC:**
- Label `role: admin|member` determines permission level
- Admin users get group `kradle:platform-engineers`
- Non-admin users get group `kradle:developers`

**Relationships:**
- Belongs to: Organization (via organizationRef)
- Has: IdentityMapping (1:N, one per provider)
- References: Team (via teams[] array)
- Referenced by: RepositoryPermission, AgentApproval, AgentDispatchRun

---

#### Team

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | identity |
| Plural | teams |
| Namespace | org-scoped |

**Purpose:** Team membership group with maintainers and repository permission grants.
Teams provide a grouping mechanism for repository access control.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `displayName` — team name

**Optional Spec Fields:**
- `members[]` — list of user references
- `maintainers[]` — subset of members with team management rights
- `repositoryGrants[]` — array of `{ repository, permission }` tuples

**Reconciliation:**
- Phase: always `Active`
- Reports `memberCount` and `maintainerCount`
- Sync intents:
  - `workspace-identity`: sync-team-membership (members + maintainers)
  - `repository-access`: one sync-team-repository-grant per repositoryGrant entry
- Conditions: `TeamMembershipProjected`, `RepositoryGrantsProjected`

**Relationships:**
- Belongs to: Organization
- Contains: Users (via members/maintainers arrays)
- Grants: RepositoryPermission (via repositoryGrants)
- Synced to: Gitea team (via `createTeam()`, `addTeamMember()`, `addTeamRepository()`)

---

#### Invite

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | identity |
| Plural | invites |
| Namespace | org-scoped |

**Purpose:** Pending user invitation with requested teams and expiry. Tracks the
invitation lifecycle from creation through acceptance or expiration.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `email` — invitee email address
- `role` — requested role (admin/member)

**Optional Spec Fields:**
- `expiresAt` — ISO 8601 expiration timestamp
- `teams[]` — teams to auto-assign on acceptance

**Lifecycle Phases:**
- `Pending` — invitation sent, awaiting acceptance
- `Accepted` — user has accepted; User resource created
- `Expired` — past expiresAt without acceptance
- `Revoked` — manually cancelled by admin

**Reconciliation:**
- Tracks `expiresAt` in status
- Sync intents:
  - `workspace-identity`: send-invite (Pending) or close-invite (other phases)
- Condition: `InviteLifecycleTracked`

**Relationships:**
- Belongs to: Organization
- Creates: User (on acceptance)
- References: Teams (for auto-assignment)

---

#### IdentityMapping

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | identity |
| Plural | identitymappings |
| Namespace | org-scoped |

**Purpose:** Mapping between Kradle user accounts, sign-in provider subjects, workspace
identities, and repository hosting accounts. Enables federation across multiple
identity providers.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `user` — reference to local User resource name
- `provider` — identity provider ID (e.g., 'github', 'sso', 'delegated')
- `subject` — external subject identifier (e.g., GitHub user ID)

**Optional Spec Fields:**
- `workspaceIdentity` — `{ name }` workspace identity binding
- `repositoryIdentity` — `{ username }` git hosting identity binding

**Behavior on Create:**
- Created automatically during OAuth login callback
- `mapLoginProfileToKradleIdentity()` in `identity-policy.js` generates both User and IdentityMapping

**Reconciliation:**
- Phase: `Synced` (all fields present) or `Pending` (missing user/provider/subject)
- Reports `workspaceIdentity` and `repositoryIdentity` in status
- Sync intents:
  - `workspace-identity`: link-identity (user, provider, subject)
  - `repository-access`: link-repository-identity (user, repositoryIdentity)
- Conditions: `WorkspaceIdentityProjected`, `RepositoryIdentityProjected`

**Relationships:**
- Belongs to: User (via user field)
- Links: external provider subject → local user
- Used by: auth system to resolve login → User mapping

---

#### AuthProvider

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | identity |
| Plural | authproviders |
| Namespace | org-scoped |

**Purpose:** Installation sign-in provider configuration including visibility, OAuth
endpoints, and delegated identity settings. Controls which authentication methods
are available.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `type` — provider type ('github', 'oidc', 'delegated')

**Optional Spec Fields (via environment):**
- `clientId` — OAuth client ID
- `clientSecret` — OAuth client secret (never stored in spec, env-only)
- `authorizationUrl` — OAuth authorization endpoint
- `tokenUrl` — OAuth token exchange endpoint
- `userInfoUrl` — OIDC userinfo endpoint
- `scopes` — space-separated OAuth scopes
- `enabled` — boolean toggle

**Provider Types:**
1. **GitHub OAuth**: `KRADLE_AUTH_GITHUB_*` environment variables
2. **SSO (OIDC)**: `KRADLE_AUTH_SSO_*` environment variables
3. **Delegated Identity**: proxy-header-based auth (`x-forwarded-user`, etc.)

**Configuration (via `createAuthProviderConfig()`):**
- Session cookie name: `KRADLE_AUTH_COOKIE_NAME` (default: `kradle_session`)
- Delegated identity local development mode for testing without real OAuth
- Session secret for HMAC-signed cookies: `KRADLE_SESSION_SECRET`

**Relationships:**
- Used by: auth middleware, login flow
- Produces: IdentityMapping (on successful login)
- Referenced by: IdentityMapping.spec.provider

---

#### AgentServiceAccount

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | identity |
| Plural | agentserviceaccounts |
| Namespace | org-scoped |

**Purpose:** Kubernetes ServiceAccount wrapper for agent and runner identity binding.
Provides the runtime identity that agent pods use to authenticate to the Kubernetes
API and external services.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `namespace` — target K8s namespace for the ServiceAccount
- `serviceAccountName` — name of the K8s ServiceAccount to bind

**Behavior:**
- Referenced by AgentStack via `spec.runtimeIdentity.serviceAccountRef`
- Stack reconciliation checks `RuntimeIdentityReady` condition against this resource
- Used to generate pod specs with `serviceAccountName` field

**Relationships:**
- Referenced by: AgentStack (runtimeIdentity)
- Controls: RBAC access for agent pods via AgentRoleBinding
- Bound to: Kubernetes ServiceAccount in the cluster

---

### 1.2 Repository Domain (7 kinds)

Resources managing git repository abstractions, deploy keys, collaborator permissions,
branch protection rules, reference policies, webhook subscriptions, and runner pools.

---

#### Repository

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | data-plane |
| Plural | repositories |
| Namespace | org-scoped |

**Purpose:** Git repository abstraction over the Gitea backend (or external git hosts).
Manages repository identity, visibility, default branch, and integration with the
repository hosting layer.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `visibility` — one of `public`, `internal`, `private`

**Optional Spec Fields:**
- `defaultBranch` — default branch name (default: `main`)

**Behavior on Create/Apply:**
1. `repositoryManifest()` constructs the resource with org scope
2. `applyResource()` calls `withOrgScope()` to resolve namespace
3. `ensureNamespace()` ensures the org namespace exists
4. `kubectl apply -f -` persists the CRD
5. Reconciler emits sync intent: `ensure-gitea-repository`

**Gitea Integration:**
- `createGiteaBackend().createRepository({ owner, name, private, defaultBranch })`
- Owner is the Gitea organization corresponding to the Kradle org
- Private flag derived from visibility (private/internal → private, public → public)
- Repository name matches `metadata.name`

**External Backend Integration:**
- When an ExternalBackendBinding exists with matching repository scope:
  - Repository metadata synced bidirectionally with GitHub/GitLab
  - ExternalObjectLink created mapping local repo → external repo ID
  - Webhook registered on external provider for push/PR events

**Reconciliation (via `reconcileRepository()`):**
- Phase: `Reconciling` → `Ready`
- `gitBackend: 'gitea'` in status
- Conditions: `ResourceObserved`, `DataPlaneSyncPlanned`
- Sync intents:
  - `git-data-plane`: ensure-gitea-repository
  - `policy-controller`: compile-ref-policy

**Relationships:**
- Belongs to: Organization
- Has: SSHKey, RepositoryPermission, BranchProtection, RefPolicy
- Referenced by: AgentDispatchRun, Pipeline, Issue, PullRequest, KradleWorkspace
- Synced to: Gitea repository, GitHub repository (via ExternalBackendBinding)

**Web Pages:** `/repositories` (list), `/repositories/{name}/code` (browser),
`/repositories/{name}/settings`

---

#### SSHKey

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | data-plane |
| Plural | sshkeys |
| Namespace | org-scoped |

**Purpose:** User, deploy, and automation SSH keys reconciled into repository key APIs.
Manages the lifecycle of SSH keys used for git authentication.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `scope` — key scope (e.g., 'deploy', 'user', 'automation')
- `key` — public key material (SSH format)

**Optional Spec Fields:**
- `readOnly` — boolean (default: false for user keys, true for deploy keys)
- `owner` / `user` — the user or automation that owns this key
- `revoked` — boolean to mark key as revoked

**Reconciliation:**
- Phase: `Synced` (active) or `Revoked` (disabled)
- Fingerprint computed: `sha256:{base64url hash of key material}`
- Sync intents:
  - `repository-access`: sync-ssh-key or revoke-ssh-key
- Condition: `SSHKeyProjected`

**Gitea Integration:**
- `createGiteaBackend().addDeployKey({ owner, repo, title, key, readOnly })`
- `createGiteaBackend().addUserSshKey({ title, key, readOnly })`
- Deploy keys are scoped to specific repositories
- User keys provide access across all repositories the user can access

**External (GitHub) Integration:**
- `GitHubGitForge.syncDeployKeys({ repo, desiredKeys })` — adds missing, removes extra
- Bidirectional sync: keys created in Kradle → pushed to GitHub; keys from GitHub → synced to Kradle

**Relationships:**
- Belongs to: Organization, optionally scoped to a Repository
- Synced to: Gitea deploy keys, GitHub deploy keys

---

#### RepositoryPermission

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | data-plane |
| Plural | repositorypermissions |
| Namespace | org-scoped |

**Purpose:** Repository collaborator and team access permissions synced with the
repository hosting backend.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `repository` — target repository name
- `subject` — user or team name
- `permission` — access level: `read`, `write`, `admin`

**Optional Spec Fields:**
- `subjectKind` — `user` or `team` (default: `user`)
- `revoked` — boolean to revoke access

**Reconciliation:**
- Phase: `Synced` (active) or `Revoked` (disabled)
- Reports `repository`, `subject`, `permission` in status
- Sync intents:
  - `repository-access`: sync-repository-permission or revoke-repository-permission
- Condition: `RepositoryPermissionProjected`

**Gitea Integration:**
- `createGiteaBackend().addCollaborator({ owner, repo, username, permission })`
- `createGiteaBackend().addTeamRepository({ org, team, repo, permission })`
- Permission levels map directly to Gitea collaborator permissions

**External (GitHub) Integration:**
- Collaborators synced via GitHub REST API when ExternalBackendBinding exists
- Permission mapping: read→pull, write→push, admin→admin

**Relationships:**
- Belongs to: Organization, Repository
- References: User or Team (via subject)
- Synced to: Gitea collaborators, GitHub collaborators

---

#### BranchProtection

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | control-plane |
| Plural | branchprotections |
| Namespace | org-scoped |

**Purpose:** Protected reference rules such as required reviews, status checks,
force-push policy, and merge requirements.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `refs` — branch pattern(s) to protect (e.g., `['main', 'release/*']`)

**Optional Spec Fields:**
- `requiredReviews` — number of required approving reviews (default: 1)
- `statusChecks[]` — required status check contexts
- `allowForcePush` — boolean (default: false)
- `dismissStaleReviews` — boolean
- `enforceAdmins` — boolean

**Gitea Integration:**
- `createGiteaBackend().protectBranch({ owner, repo, branch, approvals, statusChecks })`
- Maps to Gitea branch protection rules with push whitelist, required approvals

**External (GitHub) Integration:**
- `GitHubGitForge.syncBranchProtection({ repo, branch, requiredReviews, requiredStatusChecks, dismissStaleReviews, enforceAdmins })`
- Full bidirectional sync with GitHub branch protection rules

**Relationships:**
- Belongs to: Organization, implicitly scoped to Repository
- Enforced by: Gitea, GitHub (via sync)
- Referenced by: CI pipeline gates

---

#### RefPolicy

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | data-plane |
| Plural | refpolicies |
| Namespace | org-scoped |

**Purpose:** Reference deny rules, force-push policy, signing requirements, and custom
hook gates. Provides fine-grained control over what operations are allowed on refs.

**Required Spec Fields:**
- `organizationRef` — owning organization

**Optional Spec Fields:**
- `denyRules[]` — patterns that are denied (e.g., `['refs/heads/main']`)
- `forcePushPolicy` — `deny` | `allow` | `allowWithReview`
- `signingPolicy` — `required` | `optional` | `disabled`
- `hookGates[]` — custom pre-receive hook configurations

**Behavior:**
- Reconciler emits sync intent: `policy-controller: compile-ref-policy`
- Compiled into server-side hooks on the git backend
- Evaluated on push operations before accepting commits

**Relationships:**
- Belongs to: Organization, optionally scoped to Repository
- Complements: BranchProtection (ref policies are lower-level)
- Evaluated by: git pre-receive hooks

---

#### WebhookSubscription

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | hooks-events |
| Plural | webhooksubscriptions |
| Namespace | org-scoped |

**Purpose:** Outbound webhook endpoint configuration with event filters, signing
reference, delivery mode, and retry policy.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `url` — target webhook URL
- `events` — array of event types to subscribe to

**Optional Spec Fields:**
- `secret` — shared secret for HMAC signing
- `contentType` — `json` (default) or `form`
- `active` — boolean toggle
- `retryPolicy` — `{ maxRetries, backoffMs }`

**Gitea Integration:**
- `createGiteaBackend().createWebhook({ owner, repo, url, events, secret })`
- Registered on the Gitea repository for push/PR/issue events

**Relationships:**
- Belongs to: Organization, optionally scoped to Repository
- Produces: WebhookDelivery records (outbound attempts)
- Consumed by: WebhookController for outbound delivery

---

#### RunnerPool

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | runners-ci |
| Plural | runnerpools |
| Namespace | org-scoped |

**Purpose:** Runner capacity pool with warm/max replicas, container image, cache policy,
trust boundary, and scaling configuration.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `warmReplicas` — minimum number of idle runners to maintain (non-negative integer)
- `maxReplicas` — maximum runners allowed (positive integer, must be >= warmReplicas)

**Optional Spec Fields:**
- `image` — container image for runners (default: `ubuntu:24.04`)
- `trustTier` — `trusted` or `untrusted`
- `cache` — `{ type: 'object-storage' }` cache configuration
- `scalingMetric` — `queueDepth` (default)
- `serviceAccount` — K8s service account name for runners
- `resourceLimits` — `{ cpu, memory }` pod resource limits
- `resourceRequests` — `{ cpu, memory }` pod resource requests

**Validation (`validateRunnerPool()`):**
- metadata.name required
- organizationRef required
- warmReplicas: non-negative integer
- maxReplicas: positive integer >= warmReplicas

**Pool Status (`getPoolStatus()`):**
- `phase`: Empty | Active | Idle
- `scaling`: ScalingUp | ScalingDown | Stable
- Tracks: idle, active, terminating, total runner counts

**Capacity (`getCapacity()`):**
- `used`: runners currently Running
- `available`: maxReplicas - used
- `utilizationPct`: percentage of capacity in use

**Pod Spec Generation (`generatePodSpec()`):**
- Container: runner image with env vars (KRADLE_ORG, KRADLE_RUN_ID, KRADLE_WORKSPACE_PATH)
- Volumes: workspace PVC mounted at /workspace
- Labels: kradle.a5c.ai/runner, kradle.a5c.ai/pool, kradle.a5c.ai/org
- Service account: configured or default `kradle-runner`
- Restart policy: Never

**Relationships:**
- Belongs to: Organization
- Contains: Runners (in-memory registry)
- Schedules: CI Jobs from Pipelines; agent execution via `batch/v1` K8s Jobs for AgentDispatchRuns
- Referenced by: AgentStack (runner policy)

---

### 1.2.1 How K8s Jobs Relate to RunnerPools

Agent dispatch (via `AgentDispatchRun`) uses **Kubernetes `batch/v1` Jobs** for
execution, not the RunnerPool's in-memory runner registry directly.

| Concept | RunnerPool (CI) | Agent K8s Job |
|---------|----------------|---------------|
| Scheduling unit | Runner pod (long-lived, warm) | Job pod (short-lived, per-run) |
| Lifecycle | Idle → Running → Terminating (reused) | Pending → Active → Succeeded/Failed (one-shot) |
| Scaling | warmReplicas/maxReplicas | One Job per dispatch run |
| Workspace mount | `/workspace` via PVC | `/workspace` via same PVC pattern |
| Budget enforcement | `resourceLimits` in pod spec | `activeDeadlineSeconds` in Job spec |
| Result delivery | Runner calls back or exits | Agent pod POSTs to callback endpoint |

RunnerPool capacity is used for **CI Jobs** (Pipeline, Job resources). For **agent
dispatch**, the dispatch controller creates `batch/v1` Jobs directly using the pod
spec from the stack's `AgentServiceAccount` and `RunnerPool.spec.image` as a
starting point. The RunnerPool's `warmReplicas` does not pre-warm agent Job pods.

When an AgentStack references a `runnerPolicy.runnerPoolRef`, the referenced pool's
`spec.image`, `spec.resourceLimits`, `spec.resourceRequests`, and `spec.serviceAccount`
fields are used as defaults when building the agent Job manifest via `createAgentJob()`.

---

### 1.3 Policy Domain (4 kinds)

Resources that manage policy posture, template libraries, binding/enforcement,
and exception workflows via Kyverno integration.

---

#### PolicyProfile

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | policy |
| Plural | policyprofiles |
| Namespace | org-scoped |

**Purpose:** Organization-level policy posture configuration. Defines default templates,
rollout mode (audit vs enforce), and exception approval rules.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `displayName` — profile name
- `mode` — rollout mode: `audit`, `enforce`, `disabled`

**Optional Spec Fields:**
- `defaultTemplates[]` — PolicyTemplate references to apply by default
- `exceptionApprovalPolicy` — rules for approving PolicyExceptionRequests
- `rolloutSchedule` — when to transition from audit to enforce

**Relationships:**
- Belongs to: Organization
- References: PolicyTemplate (defaults)
- Controls: PolicyBinding enforcement mode
- Evaluated by: Kyverno (when installed)

---

#### PolicyTemplate

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | policy |
| Plural | policytemplates |
| Namespace | org-scoped |

**Purpose:** Curated Kyverno policy template with parameters, rollout defaults,
target kinds, and remediation guidance.

**Required Spec Fields:**
- `displayName` — template name
- `targetKinds` — resource kinds this policy applies to
- `kyverno` — Kyverno policy definition (ClusterPolicy or Policy body)

**Optional Spec Fields:**
- `parameters` — configurable parameters with defaults
- `rolloutDefault` — default mode when bound (audit/enforce)
- `remediation` — guidance text for violations
- `severity` — low/medium/high/critical

**Behavior:**
- Templates are the library of available policies
- Binding a template creates the actual Kyverno policy resources
- Parameters are substituted into the Kyverno spec at binding time

**Relationships:**
- Referenced by: PolicyBinding, PolicyProfile
- Produces: Kyverno ClusterPolicy/Policy (when bound and Kyverno installed)

---

#### PolicyBinding

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | policy |
| Plural | policybindings |
| Namespace | org-scoped |

**Purpose:** Binding from a policy template to organization, repository, environment,
or resource selectors with audit/enforce rollout state.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `templateRef` — reference to PolicyTemplate
- `mode` — current mode: `audit`, `enforce`, `disabled`

**Optional Spec Fields:**
- `scope` — `{ repositories[], environments[], labels }` targeting
- `parameters` — overrides for template parameters
- `exceptions[]` — PolicyExceptionRequest references

**Behavior:**
- When mode is `enforce` and Kyverno is installed:
  - Generates a KyvernoPolicy or KyvernoClusterPolicy resource
  - Policy violations block resource admission
- When mode is `audit`:
  - Policy runs in audit mode; violations appear in PolicyReports
- When Kyverno is NOT installed:
  - `requireForEnforceMode` env check; policies page shows info banner

**Relationships:**
- Belongs to: Organization
- References: PolicyTemplate
- Produces: Kyverno policy resources
- Has: PolicyExceptionRequest (exceptions to this binding)

---

#### PolicyExceptionRequest

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | policy |
| Plural | policyexceptionrequests |
| Namespace | org-scoped |

**Purpose:** Auditable request and approval workflow for temporary Kyverno
PolicyException resources. Allows teams to request time-limited exceptions to
enforced policies.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `policyRef` — reference to the PolicyBinding being excepted
- `justification` — reason for the exception
- `expiresAt` — ISO 8601 expiration timestamp

**Lifecycle:**
- `Pending` — request submitted, awaiting approval
- `Approved` — approved; KyvernoPolicyException created
- `Denied` — rejected by policy admin
- `Expired` — past expiresAt; exception removed
- `Revoked` — manually cancelled

**Behavior:**
- On approval: creates `KyvernoPolicyException` resource in policy namespace
- On expiry/revocation: deletes the KyvernoPolicyException
- Full audit trail maintained in resource history

**Relationships:**
- Belongs to: Organization
- References: PolicyBinding (the excepted policy)
- Produces: KyvernoPolicyException (when approved and Kyverno installed)

---

### 1.4 Web UI Domain (2 kinds)

---

#### View

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | web-ui |
| Plural | views |
| Namespace | org-scoped |

**Purpose:** Saved triage and dashboard view backed by resource selectors. Allows users
to create custom filtered views of resources.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `selector` — reference to a Selector resource or inline selector spec

**Optional Spec Fields:**
- `columns[]` — column definitions for table display
- `sort[]` — sort order specifications

**Relationships:**
- Belongs to: Organization
- References: Selector (filter definition)
- Displayed by: web console dashboard

---

#### Selector

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | web-ui |
| Plural | selectors |
| Namespace | org-scoped |

**Purpose:** Reusable label/query selector for workflows and views. Encapsulates filter
criteria that can be shared across multiple Views.

**Required Spec Fields:**
- `organizationRef` — owning organization

**Optional Spec Fields:**
- `labels` — label selector map
- `query` — free-text query string

**Helper:** `createSelector()` factory function in resource-model.js

**Relationships:**
- Belongs to: Organization
- Referenced by: View resources

---

### 1.5 Agent Domain (28 kinds)

The agent domain is the largest, comprising resources for AI agent orchestration,
dispatch, sessions, tools, providers, memory, workspaces, projects, and approval gates.

---

#### AgentStack

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | agents |
| Plural | agentstacks |
| Namespace | org-scoped |

**Purpose:** Reusable agent definition — the "recipe" for an agent. Specifies the base
agent, adapter, provider, model, prompt templates, MCP server references, skill
references, subagent references, context labels, approval mode, and runner policy.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `baseAgent` — agent type identifier
- `adapter` — adapter reference (e.g., 'claude-code', 'openai')
- `runtimeIdentity` — AgentServiceAccount reference or inline config

**Optional Spec Fields:**
- `provider` — model provider (e.g., 'anthropic', 'openai')
- `model` — model identifier
- `promptTemplates` — system/user prompt fragments
- `toolPolicy` / `toolPolicyRef` — reference to AgentToolProfile
- `mcpServerRefs[]` — references to AgentMcpServer resources
- `skillRefs[]` — references to AgentSkill resources
- `subagentRefs[]` — references to AgentSubagent resources
- `contextLabelRefs[]` — references to AgentContextLabel resources
- `approvalMode` — when to require human approval
- `workspacePolicy` — reference to KradleWorkspacePolicy
- `taskKind` — default task kind

**Stack Reconciliation (`reconcileStack()`):**
Produces conditions indicating readiness:
1. `CapabilitiesResolved` — all ref fields resolve to existing resources
2. `ToolsAdmitted` — AgentToolProfile found (if referenced)
3. `McpHealthy` — all referenced MCP servers exist
4. `SkillsValidated` — all skills have valid format and sourceRef
5. `SubagentsValid` — all subagents have non-empty taskKinds
6. `ContextLabelsValid` — all context labels exist
7. `RuntimeIdentityReady` — AgentServiceAccount exists
8. `RolesAdmitted` — AgentRoleBinding requirements met
9. `SecretsAdmitted` — AgentSecretGrant requirements met
10. `ConfigAdmitted` — AgentConfigGrant requirements met
11. `Ready` — all above conditions are True

**MCP Health Check (`checkMcpHealth()`):**
- HTTP GET to MCP server endpoint with 3-second timeout
- Returns: `{ serverName, status: 'healthy'|'unhealthy'|'unknown', latencyMs }`

**Capabilities List (`listStackCapabilities()`):**
- Returns array of `{ kind, name, status, ref }` for all referenced capabilities

**Relationships:**
- Belongs to: Organization
- References: AgentSubagent, AgentToolProfile, AgentMcpServer, AgentSkill,
  AgentContextLabel, KradleWorkspacePolicy, AgentServiceAccount
- Referenced by: AgentDispatchRun, AgentTriggerRule, KradleProject
- Controls: which tools, prompts, and resources an agent session has access to

---

#### AgentSubagent

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | agents |
| Plural | agentsubagents |
| Namespace | org-scoped |

**Purpose:** Named child-agent definition with role prompt, task kinds, tool subset,
and workspace scope. Enables hierarchical agent composition where a parent stack
can delegate to specialized subagents.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `rolePrompt` — system prompt defining the subagent's role
- `taskKinds` — array of task kinds this subagent handles

**Optional Spec Fields:**
- `toolSubset[]` — restricted tool list (subset of parent)
- `workspaceScope` — workspace access level
- `maxConcurrency` — max parallel executions

**Validation:**
- `taskKinds` must be a non-empty array (checked during stack reconciliation)

**Relationships:**
- Belongs to: Organization
- Referenced by: AgentStack (via subagentRefs)
- Used during: dispatch to determine which subagent handles a task

---

#### AgentToolProfile

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | agents |
| Plural | agenttoolprofiles |
| Namespace | org-scoped |

**Purpose:** Native tool policy defining filesystem access, network access, shell
access, and per-tool approval gates. Controls what an agent is allowed to do.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `filesystemPolicy` — filesystem access rules
- `approvalPolicyByTool` — map of tool names to approval requirements

**Optional Spec Fields:**
- `networkPolicy` — network access rules
- `shellPolicy` — shell command execution rules
- `denyList[]` — explicitly denied tool/operation patterns

**Relationships:**
- Belongs to: Organization
- Referenced by: AgentStack (via toolPolicy/toolPolicyRef)
- Evaluated during: agent execution for tool-use gating

---

#### AgentMcpServer

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | agents |
| Plural | agentmcpservers |
| Namespace | org-scoped |

**Purpose:** Managed MCP (Model Context Protocol) endpoint registration with transport
type, discovery metadata, health check configuration, and secret/config references.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `transport` — transport type (e.g., 'stdio', 'http', 'sse')
- `scope` — access scope

**Optional Spec Fields:**
- `endpoint` — HTTP endpoint URL (for health checks)
- `discoveryUrl` — MCP discovery URL
- `secretRefs[]` — references to Kubernetes Secrets
- `configRefs[]` — references to ConfigMaps
- `healthCheck` — health check configuration

**Health Monitoring:**
- `checkMcpHealth()` in stack controller performs HTTP GET with 3s timeout
- Status: `healthy` (response.ok), `unhealthy` (error/timeout), `unknown` (no endpoint)

**Relationships:**
- Belongs to: Organization
- Referenced by: AgentStack (via mcpServerRefs)
- Provides: tools and resources to agent sessions via MCP protocol

---

#### AgentSkill

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | agents |
| Plural | agentskills |
| Namespace | org-scoped |

**Purpose:** Reusable runbook/procedure bundle with prompt fragments, tool dependencies,
and output contracts. Skills encapsulate specialized knowledge and procedures.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `format` — skill format (e.g., 'markdown', 'yaml')
- `sourceRef` — reference to the skill source (git path, URL, etc.)

**Optional Spec Fields:**
- `promptFragments[]` — prompt fragments contributed by this skill
- `toolDeps[]` — required tools
- `outputContract` — expected output schema

**Validation:**
- Must have non-empty `format` and `sourceRef` (checked during stack reconciliation)

**Relationships:**
- Belongs to: Organization
- Referenced by: AgentStack (via skillRefs)
- Injected into: agent context during session initialization

---

#### AgentTriggerRule

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | agents |
| Plural | agenttriggerrules |
| Namespace | org-scoped |

**Purpose:** Event-to-stack routing rules for CI failures, webhooks, comments, labels,
schedules (cron), and manual dispatch. Determines which events should trigger which
agent stacks.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `sources` — event source types (e.g., ['push', 'pull_request', 'issue_comment'])
- `agentStack` — reference to AgentStack to dispatch
- `taskKind` — task kind for the dispatch

**Optional Spec Fields:**
- `enabled` — boolean toggle (default: true)
- `repository` — scope to specific repository
- `allowedActors[]` — restrict triggering to specific users
- `cronExpression` — 5-field cron for scheduled triggers
- `webhookTrigger` — `{ url, events[], repository, action, secretRef }`
- `commentTrigger` — `{ pattern, repos[] }`
- `labelTrigger` — `{ labels[], action: 'labeled'|'unlabeled' }`

**Source Type Detection (`getTriggerSourceType()`):**
- `cronExpression` present → `cron`
- `webhookTrigger` present → `webhook`
- `commentTrigger` present → `comment`
- `labelTrigger` present → `label`
- `sources` present → `event`
- None → `unknown`

**Validation (`validateTriggerRule()`):**
- Validates source-specific sub-configs (cron expression, webhook URL, etc.)
- Cron: 5 fields, valid characters only
- Webhook: valid HTTP/HTTPS URL
- Comment: non-empty pattern string
- Label: non-empty labels array, valid action

**Cron Scheduling:**
- `validateCronExpression()` — validates 5-field cron syntax
- `calculateNextRun()` — computes next execution time (minute precision)

**Event Evaluation (`evaluateEvent()`):**
- Matches event type against rule sources
- Checks repository scope filter
- Checks actor filter (allowedActors)
- Deduplication: skips if identical execution already exists (non-Failed)

**Webhook Event Evaluation (`evaluateWebhookEvent()`):**
- Checks enabled flag
- Matches eventType against webhookTrigger.events (or wildcard '*')
- Filters by webhookTrigger.repository
- Filters by webhookTrigger.action
- Deduplicates by rule name
- Returns matchingRules + dispatchIntents

**Relationships:**
- Belongs to: Organization
- References: AgentStack (dispatch target)
- Produces: AgentTriggerExecution (evaluation record), AgentDispatchRun (on match)
- Consumed by: webhook controller, event bus, cron scheduler

---

#### AgentContextLabel

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | agents |
| Plural | agentcontextlabels |
| Namespace | org-scoped |

**Purpose:** Reviewed prompt fragment with provenance tracking and allowlisted sources.
Provides curated context that can be injected into agent sessions.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `promptFragment` — the prompt text to inject
- `allowedSources` — which stacks/contexts may use this label

**Relationships:**
- Belongs to: Organization
- Referenced by: AgentStack (via contextLabelRefs)
- Injected into: AgentContextBundle during dispatch

---

#### KradleWorkspacePolicy

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | agents |
| Plural | kradleworkspacepolicies |
| Namespace | org-scoped |

**Purpose:** Git worktree provisioning, cleanup, retention, and trust tier policies.
Controls how agent workspaces are created, reused, and cleaned up.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `mode` — provisioning mode (e.g., 'on-demand', 'pre-warmed')
- `retentionPolicy` — `{ maxAge, maxCount, cleanupSchedule }`

**Optional Spec Fields:**
- `trustTier` — workspace trust level
- `storageClassName` — PVC storage class
- `defaultCapacity` — default PVC size

**Relationships:**
- Belongs to: Organization
- Referenced by: AgentStack (workspace policy)
- Controls: KradleWorkspace creation and lifecycle

---

#### AgentAdapter

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | agents |
| Plural | agentadapters |
| Namespace | org-scoped |

**Purpose:** Agent adapter definition declaring transport type, capabilities matrix,
authentication requirements, and installation method. Adapters are the bridge between
the Kradle control plane and actual agent runtimes (e.g., Claude Code, OpenAI, etc.).

**Required Spec Fields:**
- `organizationRef` — owning organization
- `adapterType` — adapter identifier (e.g., 'claude-code', 'openai-assistants')
- `transport` — communication transport (e.g., 'http', 'stdio', 'websocket')

**Optional Spec Fields:**
- `capabilities[]` — supported operations/features
- `authRequirements` — what credentials the adapter needs
- `installationMethod` — how to deploy the adapter

**Relationships:**
- Belongs to: Organization
- Referenced by: AgentTransportBinding (connection config)
- Used by: AgentStack (via adapter field)

---

#### AgentTransportBinding

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | agents |
| Plural | agenttransportbindings |
| Namespace | org-scoped |

**Purpose:** Connection configuration for an adapter instance with endpoint, protocol
details, authentication, health check, and reconnect policy.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `adapterRef` — reference to AgentAdapter
- `endpoint` — connection endpoint URL
- `protocol` — protocol version/details

**Optional Spec Fields:**
- `auth` — authentication configuration (token refs, etc.)
- `healthCheck` — `{ interval, timeout, path }`
- `reconnectPolicy` — `{ maxRetries, backoffMs }`
- `tls` — TLS configuration

**Relationships:**
- Belongs to: Organization
- References: AgentAdapter
- Used by: Agent Mux client for session establishment

---

#### AgentProviderConfig

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | agents |
| Plural | agentproviderconfigs |
| Namespace | org-scoped |

**Purpose:** Model provider configuration with API base URL, authentication type,
default model, model translation mappings, and rate limits.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `provider` — provider identifier (e.g., 'anthropic', 'openai')
- `authType` — authentication method (e.g., 'api-key', 'oauth')

**Optional Spec Fields:**
- `apiBase` — API base URL override
- `defaultModel` — default model to use
- `modelTranslations` — map of model aliases to actual model IDs
- `rateLimits` — `{ requestsPerMinute, tokensPerMinute }`
- `secretRef` — reference to K8s Secret containing API key

**Relationships:**
- Belongs to: Organization
- Referenced by: AgentStack (provider configuration)
- Used by: Agent Mux for model API calls

---

#### AgentGatewayConfig

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | agents |
| Plural | agentgatewayconfigs |
| Namespace | org-scoped |

**Purpose:** Runtime Agent Mux gateway connection settings with URL, auth configuration,
reconnect policy, and feature flags.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `gatewayUrl` — Agent Mux gateway URL

**Optional Spec Fields:**
- `auth` — gateway authentication config
- `reconnectPolicy` — `{ maxRetries, backoffMs }`
- `featureFlags` — feature toggles for the gateway
- `sseEnabled` — enable SSE event streaming

**Relationships:**
- Belongs to: Organization
- Used by: Agent Mux client (`createAgentMuxClient()`)
- Controls: how the dispatch controller connects to the agent runtime

---

#### KradleProject

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | agents |
| Plural | kradleprojects |
| Namespace | org-scoped |

**Purpose:** Organization project grouping issues, linked repositories, kanban board
configuration, default workflow, and backend sync references.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `displayName` — project name

**Optional Spec Fields:**
- `workflowColumns[]` — kanban column definitions: `[{ id, displayName, color, default? }]`
- `boardState` — `active` or `archived`
- `repositoryRefs[]` — linked repositories
- `stackRefs[]` — linked agent stacks
- `syncRefs[]` — external project sync references (GitHub Projects, etc.)

**Validation (`validateAgentProject()`):**
- metadata.name required
- organizationRef required
- workflowColumns: non-empty array, no duplicate column IDs
- boardState: must be `active` or `archived` (if set)

**Board Operations:**
- `getWorkflowColumns()` — returns ordered column array
- `getDefaultColumn()` — column with `default: true`, or first column
- `getBoardState()` — returns current board state (default: 'active')

**Issue Assignment:**
- Issues reference projects via `spec.projectRefs`
- Issues have `workflowState` field corresponding to column IDs
- Kanban drag-drop updates issue workflowState

**Relationships:**
- Belongs to: Organization
- Groups: Issues (via projectRefs on issues)
- References: Repositories (repositoryRefs), AgentStacks (stackRefs)
- Synced to: GitHub Projects (via ExternalBackendBinding)

---

#### AgentRoleBinding

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | identity |
| Plural | agentrolebindings |
| Namespace | org-scoped |

**Purpose:** Managed projection to native Kubernetes RBAC for agent identity. Maps
agent service accounts to cluster roles and namespaced roles.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `subject` — AgentServiceAccount or user reference
- `roleRef` — Kubernetes Role or ClusterRole reference
- `scope` — namespace or cluster scope

**Relationships:**
- Belongs to: Organization
- References: AgentServiceAccount (subject)
- Produces: Kubernetes RoleBinding/ClusterRoleBinding
- Checked by: stack reconciliation (RolesAdmitted condition)

---

#### AgentSecretGrant

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | identity |
| Plural | agentsecretgrants |
| Namespace | org-scoped |

**Purpose:** Explicit permission for a subject to access specific Secret keys with
purpose scoping. Provides fine-grained secret access control for agents.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `subject` — who gets access (AgentServiceAccount ref)
- `secretRef` — K8s Secret reference `{ name, namespace, keys[] }`
- `purpose` — why access is needed

**Relationships:**
- Belongs to: Organization
- Grants access to: Kubernetes Secrets
- Checked by: stack reconciliation (SecretsAdmitted condition)
- Checked by: permission reviewer during dispatch

---

#### AgentConfigGrant

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | identity |
| Plural | agentconfiggrants |
| Namespace | org-scoped |

**Purpose:** Explicit permission for a subject to access specific ConfigMap keys with
purpose scoping.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `subject` — who gets access
- `configMapRef` — K8s ConfigMap reference `{ name, namespace, keys[] }`
- `purpose` — why access is needed

**Relationships:**
- Belongs to: Organization
- Grants access to: Kubernetes ConfigMaps
- Checked by: stack reconciliation (ConfigAdmitted condition)

---

#### AgentDispatchRun

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | agents |
| Plural | agentdispatchruns |
| Namespace | org-scoped |

**Purpose:** Logical CI-like run record visible alongside Pipeline/Job records. Represents
a complete agent invocation with queue state, execution status, workspace binding,
cost tracking, and memory snapshot reference.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `repository` — target repository
- `sourceRefs` — source references that triggered this run
- `agentStack` — reference to AgentStack used
- `taskKind` — the type of task (e.g., 'diagnostic', 'fix', 'review')

**Optional Spec Fields:**
- `contextBundleRef` — reference to AgentContextBundle
- `memorySnapshotRef` — reference to AgentMemorySnapshot
- `workspaceRef` — reference to KradleWorkspace
- `mountSpec` — volume/volumeMount configuration

**Lifecycle Phases:**
- `Pending` — created, workspace being provisioned
- `AwaitingApproval` — permission review requires approval
- `Queued` — ready but Agent Mux not available
- `Running` — session launched, executing
- `Succeeded` — completed successfully
- `Failed` — execution failed
- `Cancelled` — manually cancelled

**Status Fields:**
- `queuedAt` — when run entered queue
- `sseSubscription` — `{ runId, active }` event stream state
- `transcriptRef` — reference to AgentSessionTranscript
- `conditions[]` — K8s-style condition array

**Creation Flow (via `createManualDispatch()`):**
1. Resolve AgentStack via `resolveStack()` (translates CRD → execution config)
2. Permission review (allowed / denied / requires-approval)
3. Budget check via `checkBudget()` + `estimateCost()`
4. Memory snapshot creation (if AgentMemoryRepository exists)
5. Approval gate (if required) — emits `APPROVAL_REQUESTED` hooks event
6. Workspace provisioning (reuse existing or create new)
7. Context bundle assembly
8. Create AgentDispatchRun + AgentDispatchAttempt resources
9. `createAgentJob()` generates `batch/v1` Job manifest (image, command, env, volumes, deadline)
10. `submitAgentJob()` submits Job to Kubernetes
11. Workspace PVC mounted at `/workspace` in agent pod
12. Transport env vars injected: `AGENT_MUX_TRANSPORT`, `TRANSPORT_MUX_CODEC`
13. Agent pod executes and POSTs result to `/api/orgs/{org}/agents/runs/{name}/callback`
14. `persistSessionEvent()` applies result, emits `RUN_COMPLETED` or `RUN_FAILED`

**K8s Job Relationship:**
Each `Running` dispatch run owns exactly one active `batch/v1` Job in Kubernetes.
Job name: `agent-{run.metadata.name}`. The `activeDeadlineSeconds` field enforces
the budget ceiling: if the agent exceeds the allowed time, Kubernetes terminates
the pod and the run transitions to `Failed` (deadline-exceeded).

**Relationships:**
- Belongs to: Organization
- References: AgentStack, Repository, KradleWorkspace, AgentContextBundle
- Has: AgentDispatchAttempt (1:N), AgentSession (1:1), AgentApproval (0:N)
- Produces: KradleArtifact (0:N), AgentSessionTranscript
- Linked via: WorkItemSessionLink, WorkItemWorkspaceLink

---

#### AgentDispatchAttempt

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | agents |
| Plural | agentdispatchattempts |
| Namespace | org-scoped |

**Purpose:** Concrete execution attempt with reason, stack snapshot, runtime state,
and Agent Mux binding. One run may have multiple attempts (retries).

**Required Spec Fields:**
- `organizationRef` — owning organization
- `agentDispatchRun` — reference to parent run
- `attemptReason` — why this attempt was created (e.g., 'initial', 'retry')
- `agentStackSnapshot` — frozen copy of the stack spec at attempt time

**Optional Spec Fields:**
- `contextBundleDigest` — digest of the context bundle used

**Status Fields:**
- `permissionSnapshot` — captured permission review result
- `queueEnteredAt` — when attempt entered queue
- `agentMuxRunId` — Agent Mux run identifier
- `agentMuxSessionId` — Agent Mux session identifier
- `startedAt` — when execution began

**Relationships:**
- Belongs to: AgentDispatchRun (parent)
- Creates: AgentSession (1:1 per successful launch)
- Contains: frozen stack snapshot for reproducibility

---

#### AgentSession

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | agents |
| Plural | agentsessions |
| Namespace | org-scoped |

**Purpose:** Kradle projection of an Agent Mux chat/session with lifecycle state.
Represents a live or completed interaction between an agent and the system.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `agentMuxSessionId` �� external Agent Mux session identifier
- `dispatchRun` — reference to the parent AgentDispatchRun

**Lifecycle:**
- `Active` — session is live, agent is executing
- `Completed` — session ended normally
- `Failed` — session ended with error
- `Cancelled` — session was manually terminated

**Relationships:**
- Belongs to: AgentDispatchRun
- Has: AgentSessionTranscript, AgentSessionAttachment
- Linked via: WorkItemSessionLink (to Issues/PRs)
- Bound to: KradleWorkspace (via workspace controller)

---

#### AgentContextBundle

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | agents |
| Plural | agentcontextbundles |
| Namespace | org-scoped |

**Purpose:** Immutable prompt/context snapshot with content-addressable digest,
provenance tracking, source references, and redaction manifest.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `dispatchRun` — reference to the run that created this bundle
- `digest` — content-addressable hash of the bundle
- `sources` — array of source references (context labels, prompts, etc.)

**Assembly (via `assembleContextBundle()`):**
- Gathers: stack prompts, context labels, repository context, source refs
- Applies: redaction scanning for secrets/credentials
- Produces: immutable snapshot with digest for cache/dedup

**Relationships:**
- Belongs to: AgentDispatchRun
- References: AgentContextLabel (sources)
- Contains: assembled prompt content for the agent session

---

#### KradleArtifact

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | agents |
| Plural | kradleartifacts |
| Namespace | org-scoped |

**Purpose:** Durable agent output with kind classification, content-addressable digest,
and retention policy. Captures the results of agent work.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `dispatchRun` — reference to producing run
- `kind` — artifact type (e.g., 'patch', 'report', 'review', 'log')
- `digest` — content-addressable hash

**Optional Spec Fields:**
- `retentionPolicy` — how long to keep the artifact
- `size` — artifact size in bytes
- `mimeType` — content type

**Relationships:**
- Belongs to: AgentDispatchRun (producer)
- Stored in: object storage (referenced by digest)
- Linked to: Pipeline jobs (for CI artifacts)

---

#### AgentApproval

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | agents |
| Plural | agentapprovals |
| Namespace | org-scoped |

**Purpose:** Human gate for tools, secrets, write-back, and release actions. Implements
the approval workflow that pauses agent execution until a human decides.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `dispatchRun` — reference to the run requesting approval
- `action` — what is being requested: `tool-use`, `secret-access`, `write-back`, `release`, `escalation`
- `requestedBy` — who/what triggered the request

**Optional Spec Fields:**
- `description` — context about why approval is needed
- `requestedAt` — ISO timestamp

**Lifecycle Phases:**
- `Pending` — awaiting human decision
- `Approved` — action allowed to proceed
- `Denied` — action blocked

**Operations:**
- `createApprovalRequest()` — creates with dedup check (no duplicate pending for same run+action)
- `recordDecision()` — records approve/deny with decidedBy and reason
- `isActionApproved()` — checks if action is approved for a run
- `enforceApproval()` — enforcement gate (allowed/denied/pending)
- `persistApproval()` — persists via applyResource
- `listPendingApprovals()` — finds all pending approvals for an org
- `listApprovalsForRun()` — finds all approvals for a dispatch run

**Relationships:**
- Belongs to: AgentDispatchRun
- Blocks: agent execution until decided
- Created by: dispatch controller (on requires-approval review)
- Decided by: human operator via UI or API

---

#### AgentTriggerExecution

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | agents |
| Plural | agenttriggerexecutions |
| Namespace | org-scoped |

**Purpose:** Durable trigger evaluation record with deduplication state, coalescing
decisions, and rejection reasons. Provides audit trail for trigger matching.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `triggerRule` — reference to the evaluated AgentTriggerRule
- `sourceEvent` — event UID (`type:kind:name`)
- `decision` — evaluation outcome

**Decision Values:**
- `Dispatching` / `Dispatched` — trigger matched, run created
- `Skipped` — trigger did not match (with reason)
- `Deduplicated` — would match but identical execution already exists
- `Failed` — dispatch attempted but failed

**Status Fields:**
- `phase` — mirrors decision
- `reason` — explanation of the decision
- `evaluatedAt` — when evaluation occurred
- `dispatchRunRef` — reference to created run (if dispatched)

**Relationships:**
- References: AgentTriggerRule (the rule that was evaluated)
- Produces: AgentDispatchRun (on successful dispatch)
- Used for: deduplication of subsequent identical events

---

#### AgentCapabilityRequirement

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | agents |
| Plural | agentcapabilityrequirements |
| Namespace | org-scoped |

**Purpose:** Computed dependency record derived from tools, MCP servers, skills, models,
and subagents. Represents what capabilities an agent needs to function.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `ownerRef` — reference to the requiring resource (usually AgentStack)
- `requiredRoles` — array of required role/capability identifiers

**Relationships:**
- Belongs to: AgentStack (owner)
- Checked during: stack reconciliation and dispatch permission review

---

#### WorkItemSessionLink

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | agents |
| Plural | workitemsessionlinks |
| Namespace | org-scoped |

**Purpose:** Association between issues/PRs and agent sessions. Tracks which agent
sessions worked on which work items.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `workItemRef` — reference to Issue or PullRequest
- `agentSession` — reference to AgentSession

**Creation:**
- `linkWorkItemToSession()` in workspace controller
- Auto-generated name: `wisl-{sessionRef}-{workItemRef}-{timestamp}`

**Relationships:**
- Links: Issue/PullRequest ↔ AgentSession
- Used by: project boards to show which sessions worked on which items
- Enables: session history view per work item

---

#### WorkItemWorkspaceLink

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | agents |
| Plural | workitemworkspacelinks |
| Namespace | org-scoped |

**Purpose:** Association between issues/PRs and agent workspaces. Tracks which
workspaces contain work related to which items.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `workItemRef` — reference to Issue or PullRequest
- `workspace` — reference to KradleWorkspace

**Optional Spec Fields:**
- `workItemKind` — `Issue` or `PullRequest`

**Creation:**
- `linkWorkItem()` in workspace controller
- Auto-generated name: `wiwl-{workspaceName}-{workItemRef}-{timestamp}`

**Relationships:**
- Links: Issue/PullRequest ↔ KradleWorkspace
- Used by: workspace controller for run history queries

---

#### AgentSessionTranscript

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | agents |
| Plural | agentsessiontranscripts |
| Namespace | org-scoped |

**Purpose:** Durable chat transcript with message nodes, pagination support, and
cost-per-turn tracking. Stores the full conversation history.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `sessionRef` — reference to AgentSession
- `messages` — array of message nodes

**Message Node Structure:**
- `role` — user/assistant/system/tool
- `content` — message content
- `timestamp` — when the message was sent
- `costTokens` — token usage for this turn
- `toolCalls[]` — tool invocations (if any)

**Reconciliation:**
- Created by `agentMuxClient.reconcileTranscript()`
- Updated as SSE events stream in from Agent Mux
- Referenced by AgentDispatchRun.status.transcriptRef

**Relationships:**
- Belongs to: AgentSession
- Contains: full conversation history
- Updated via: SSE event streaming from Agent Mux

---

#### AgentSessionAttachment

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | agents |
| Plural | agentsessionattachments |
| Namespace | org-scoped |

**Purpose:** File attached to a session message with source type, MIME type, digest,
and redaction status.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `sessionRef` — reference to AgentSession
- `sourceType` — where the file came from (e.g., 'workspace', 'upload', 'tool-output')
- `digest` — content-addressable hash

**Optional Spec Fields:**
- `mimeType` — MIME type
- `size` — file size
- `redacted` — boolean indicating if content was redacted
- `originalPath` — original file path in workspace

**Relationships:**
- Belongs to: AgentSession
- Stored in: object storage (referenced by digest)
- May reference: KradleWorkspace files

---

### 1.6 Workspace Domain (3 kinds)

---

#### KradleWorkspace

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | workspaces |
| Plural | kradleworkspaces |
| Namespace | org-scoped |

**Purpose:** Volume-backed git workspace with PVC lifecycle, repository binding, agent
Job mount spec, session associations, and run history.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `repository` — bound git repository
- `volumeSpec` — PVC specification `{ storageClassName, capacity, accessModes }`

**Optional Spec Fields:**
- `branch` — checked-out branch (default: 'main')
- `pvcName` — PVC name (auto-generated: `kradle-ws-{name}`)
- `associations[]` — `[{ kind, name, addedAt }]` linked resources

**Lifecycle Phases:**
- `Pending` — workspace created, PVC not yet bound
- `Provisioning` — PVC being created
- `Ready` — workspace available for use
- `InUse` — claimed by a dispatch run; PVC mounted at `/workspace` in agent Job pod
- `Released` — run completed, workspace available again
- `Archived` — long-term storage, not active
- `Terminating` — being deleted

**Agent Job Mounting:**
When an `AgentDispatchRun` enters the `Running` phase, the workspace PVC is mounted
into the agent's `batch/v1` Job pod at `/workspace`. `getMountSpec()` returns the
`{ volume, volumeMount }` pair that `createAgentJob()` injects into the Job template:

```yaml
volumes:
  - name: workspace
    persistentVolumeClaim:
      claimName: kradle-ws-{workspaceName}
containers:
  - name: agent
    volumeMounts:
      - name: workspace
        mountPath: /workspace
```

The agent process reads source code, writes changes, and produces artifacts relative
to `/workspace`. This path is fixed regardless of which workspace PVC is mounted.

**Operations:**
- `createWorkspace()` — creates workspace + PVC manifest
- `deleteWorkspace()` — marks Terminating, generates PVC delete manifest
- `claimWorkspace()` — transitions Ready → InUse with runRef
- `releaseWorkspace()` — transitions InUse → Ready
- `archiveWorkspace()` — transitions to Archived
- `recoverWorkspace()` — transitions Archived → Active
- `findReusableWorkspace()` — finds Ready workspace matching org+repo+branch
- `initializeWorkspace()` — generates git clone command spec
- `checkoutBranch()` — generates git checkout command spec
- `syncWorkspace()` — generates git fetch + reset command specs
- `getMountSpec()` — generates PVC volume + volumeMount for pod specs
- `bindSession()` — records session binding in status
- `linkWorkItem()` — creates WorkItemWorkspaceLink
- `linkWorkItemToSession()` — creates WorkItemSessionLink
- `addAssociation()` — adds resource association (AgentDispatchRun, User, AgentSession)
- `removeAssociation()` — removes resource association
- `listAssociations()` — returns all associations
- `getWorkspaceRuns()` — returns active and historical runs for this workspace

**Codespace Operations:**
- `launchCodespace()` — generates Pod + Service specs for code-server IDE
- `stopCodespace()` — generates delete manifests for codespace pod/service
- `getCodespaceStatus()` — reports codespace running state and URL

**PVC Generation:**
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: kradle-ws-{workspaceName}
  labels:
    kradle.a5c.ai/workspace: {workspaceName}
    kradle.a5c.ai/org: {organizationRef}
spec:
  storageClassName: standard
  accessModes: [ReadWriteOnce]
  resources:
    requests:
      storage: 10Gi
```

**Relationships:**
- Belongs to: Organization, Repository
- Used by: AgentDispatchRun, RunnerPool pods
- Contains: git worktree with checked-out code
- Linked via: WorkItemWorkspaceLink (to Issues/PRs)

---

#### KradleWorkspacePolicy

(Documented above in Agent Domain - section 1.5)

---

#### KradleWorkspaceRuntime

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | agents |
| Plural | kradleworkspaceruntimes |
| Namespace | org-scoped |

**Purpose:** Workspace runtime surface state with current working directory, environment
variables, process status, and preview URL.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `workspaceRef` — reference to KradleWorkspace
- `status` — current runtime status

**Status Fields:**
- `phase` — Provisioning | Active | Stopped
- `cwd` — current working directory
- `env` — environment variables map
- `processStatus` — running process info
- `previewUrl` — if workspace exposes a preview
- `createdAt` — creation timestamp

**Creation:**
- Created by `provisionWorkspace()` alongside KradleWorkspace
- Updated as workspace state changes

**Relationships:**
- Belongs to: KradleWorkspace
- Reflects: runtime state of the workspace pod

---

### 1.7 Memory Domain (7 kinds)

Resources for the "Company Brain" — organization-wide agent memory with graph/grep
search, time-travel, imports, ontology validation, and snapshot pinning.

---

#### AgentMemoryRepository

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | agents |
| Plural | agentmemoryrepositories |
| Namespace | org-scoped |

**Purpose:** Organization-level Git repository pointer for shared agent memory with
layout profile and index policy. The memory repository contains structured knowledge
that agents can query.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `repositoryRef` — reference to a Repository resource (the git repo storing memory)
- `defaultBranch` — branch to read from (e.g., 'main')
- `layoutProfile` — how memory is organized in the repo (e.g., 'flat', 'hierarchical')

**Optional Spec Fields:**
- `indexPolicy` — how and when to rebuild indexes
- `retentionPolicy` — how long to keep old memory

**Gitea Naming Convention:**
- `orgMemoryRepositoryName(org)` → `_${org}_` (e.g., `_default_`)
- Used as the Gitea repo name for memory storage

**Relationships:**
- Belongs to: Organization
- References: Repository (the backing git repo)
- Has: AgentMemorySource (read policies), AgentMemoryOntology (schema)
- Produces: AgentMemorySnapshot (at dispatch time)

---

#### AgentMemorySource

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | agents |
| Plural | agentmemorysources |
| Namespace | org-scoped |

**Purpose:** Read policy for memory paths and kinds per repository, team, stack, or
trigger. Controls which parts of memory are available to which consumers.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `repositoryRef` — which memory repository this applies to
- `appliesTo` — scope (`{ kind, name }` — e.g., `{ kind: 'AgentStack', name: 'my-stack' }`)
- `include` — paths/patterns to include

**Optional Spec Fields:**
- `exclude` — paths/patterns to exclude
- `kinds[]` — node kinds to include in graph queries

**Relationships:**
- Belongs to: AgentMemoryRepository
- Controls: what memory content is visible to specific stacks/teams

---

#### AgentMemoryOntology

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | agents |
| Plural | agentmemoryontologies |
| Namespace | org-scoped |

**Purpose:** Ontology policy pointer with required fields, edge kinds, and controlled
vocabulary. Defines the schema that memory records must conform to.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `memoryRepository` — reference to AgentMemoryRepository
- `ontologyPath` — path within the memory repo where ontology is defined

**Ontology Structure:**
- `requiredFields` — map of nodeKind → required field names
- `allowedEdgeKinds` — array of valid edge relationship types
- `controlledVocabulary` — terms that must be used consistently

**Validation (`validateOntology()`):**
- Checks all records have required fields for their nodeKind
- Checks all edge kinds are in allowedEdgeKinds list

**Relationships:**
- Belongs to: AgentMemoryRepository
- Enforced on: AgentMemoryUpdate submissions
- Checked during: import processing

---

#### AgentMemoryAssociation

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | agents |
| Plural | agentmemoryassociations |
| Namespace | org-scoped |

**Purpose:** Bridge record linking memory content to Kradle resources by relationship type.
Enables bidirectional navigation between memory and resources.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `memoryRef` — reference to a memory record (path or ID)
- `targetRef` — reference to a Kradle resource (`{ kind, name }`)
- `relationship` — type of relationship (e.g., 'documents', 'implements', 'relates-to')

**Relationships:**
- Links: memory records ↔ Kradle resources
- Enables: context-aware memory retrieval during dispatch

---

#### AgentMemorySnapshot

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | agents |
| Plural | agentmemorysnapshots |
| Namespace | org-scoped |

**Purpose:** Immutable dispatch-time memory pin with resolved commit, query manifest
digest, and selected records digest. Captures the exact memory state used for a run.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `memoryRepository` — which memory repository was snapshotted
- `requestedRef` — the ref that was requested (branch, tag, commit)
- `resolvedCommit` — the actual commit SHA used

**Optional Spec Fields:**
- `queryManifestDigest` — hash of the query parameters used
- `selectedRecordsDigest` — hash of selected graph records
- `selectedDocumentsDigest` — hash of selected grep documents
- `ontologyDigest` — hash of ontology at snapshot time
- `recordCount` — number of selected records
- `documentCount` — number of selected documents

**Time-Travel Modes (`resolveTimeTravel()`):**
- `current` — use latest commit
- `explicit-ref` — use specified ref directly
- `ref-at-time` — find commit closest to but not after target time
- `snapshot-tag` — use tagged snapshot commit

**Relationships:**
- Belongs to: AgentDispatchRun (via memorySnapshotRef)
- References: AgentMemoryRepository
- Pinned at: specific git commit for reproducibility

---

#### AgentMemoryQuery

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | agents |
| Plural | agentmemoryqueries |
| Namespace | org-scoped |

**Purpose:** Graph and grep retrieval record with query parameters, result digests,
and ranking metadata. Logs what queries were executed and their results.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `snapshotRef` — reference to AgentMemorySnapshot used
- `requester` — who/what executed the query
- `query` — query parameters object

**Query Modes:**
- `graph-only` — search graph records only
- `grep-only` — search document content only
- `graph-and-grep` — both (default)

**Graph Search:**
- Filters by `kinds[]` (node kinds)
- Traverses edges up to `edgeDepth` levels
- Text matching against record content
- Returns: `{ matches: [{ record, score, edges }], totalMatches }`

**Grep Search:**
- Filters by `paths[]` patterns
- Pattern matching against document content
- Limited by `maxMatches` (default: 25)
- Returns: `{ excerpts: [...], totalMatches }`

**Relationships:**
- Belongs to: AgentMemorySnapshot
- Records: query execution history for auditing

---

#### AgentMemoryUpdate

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | agents |
| Plural | agentmemoryupdates |
| Namespace | org-scoped |

**Purpose:** Reviewable proposed memory mutation with branch, changes, and validation
status. Represents an agent's request to update the memory repository.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `memoryRepository` — target memory repository
- `sourceRun` — reference to the run proposing changes
- `changes` — array of proposed changes

**Lifecycle Phases:**
- `Pending` — update proposed, awaiting review
- `Validated` — ontology checks passed
- `Approved` — human approved the changes
- `Committed` — changes committed to memory repo
- `Rejected` — changes rejected

**Relationships:**
- References: AgentMemoryRepository, AgentDispatchRun (source)
- Validated against: AgentMemoryOntology
- On commit: creates git commit in memory repository

---

#### AgentRunMemoryImport

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | agents |
| Plural | agentrunmemoryimports |
| Namespace | org-scoped |

**Purpose:** Import curated babysitter run metadata into the organization's company brain
with redaction and review workflow.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `memoryRepository` — target memory repository
- `source` — source of the import (run reference, external URL, etc.)
- `include` — what to include from the source

**Optional Spec Fields:**
- `validationPolicy` — validation rules to apply (default: 'none')

**Import Pipeline Phases:**
1. `Pending` — import created
2. `Collecting` — gathering content from source
3. `Redacting` — scanning for secrets/credentials
4. `Normalizing` — converting to memory format
5. `Validating` — checking against ontology
6. `AwaitingReview` — ready for human review

**Redaction Scanning (`scanForRedaction()`):**
Detects and replaces:
- Secret keys (API_KEY=, PASSWORD=, etc.)
- Provider tokens (sk-*, ghp_*, glpat-*, xoxb-*, etc.)
- Bearer tokens
- Private keys (PEM format)
- Base64 credentials (40+ chars)

**Relationships:**
- References: AgentMemoryRepository
- Source: babysitter runs, external data
- Validated by: AgentMemoryOntology
- Produces: memory records on approval

---

### 1.8 External Backend Domain (10 kinds)

Resources managing bidirectional synchronization with external providers (GitHub, GitLab,
etc.) including provider registration, binding, sync policy, webhook delivery,
event normalization, state tracking, write intents, conflict resolution, object linking,
and capability manifests.

---

#### ExternalBackendProvider

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | external-backends |
| Plural | externalbackendproviders |
| Namespace | org-scoped |

**Purpose:** External backend provider registration with type, endpoint, auth
configuration, and capability discovery settings.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `providerType` — provider identifier (e.g., 'github', 'gitlab', 'gitea')
- `endpoint` — provider API endpoint URL

**Optional Spec Fields:**
- `displayName` — human-readable provider name
- `config` — provider-specific configuration
- `authConfig` — authentication settings (app ID, installation ID, etc.)

**Lifecycle Phases:**
- `Pending` — provider created, not yet authenticated
- `Authenticating` — auth flow in progress
- `Discovering` — capability discovery running
- `Ready` — provider fully operational
- `Degraded` — partial functionality (some APIs failing)
- `Failed` — provider unreachable or auth invalid

**Creation (via `createExternalBackendProvider()`):**
- Validates: name required, providerType required
- Initial status.phase: `Pending`
- Labels and annotations initialized empty

**Provider Registry (`createDefaultProviderRegistry()`):**
- Auto-registers GitHub adapter
- GitHub descriptor exposes: gitForge, issueTracking, cicd interfaces
- Factory methods: `createForge()`, `createIssueTracker()`, `createCicd()`

**Relationships:**
- Belongs to: Organization
- Has: ExternalBackendBinding (0:N)
- Describes: ExternalProviderCapabilityManifest (1:1)
- Authenticated via: GitHub App JWT + installation token exchange

---

#### ExternalBackendBinding

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | external-backends |
| Plural | externalbackendbindings |
| Namespace | org-scoped |

**Purpose:** Binding of an external backend provider to an organization with credential
reference and sync scope. Activates synchronization for specific resources.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `providerRef` — reference to ExternalBackendProvider
- `credentialRef` — reference to K8s Secret with provider credentials

**Optional Spec Fields:**
- `scope` — what to sync: `{ repositories[], issues, pullRequests, pipelines }`
- `webhookSecret` — shared secret for webhook HMAC verification
- `syncEnabled` — boolean toggle

**Lifecycle Phases:**
- `Pending` — binding created, not yet validated
- `ValidatingTarget` — checking provider connectivity
- `RegisteringWebhook` — setting up webhook on provider
- `Backfilling` — importing existing data from provider
- `Ready` — bidirectional sync active
- `Degraded` — sync partially working
- `Failed` — sync completely broken

**Relationships:**
- Belongs to: Organization
- References: ExternalBackendProvider
- Controls: ExternalBackendSyncPolicy (sync behavior)
- Produces: ExternalWebhookDelivery, ExternalSyncEvent, ExternalObjectLink
- Manages: webhook registration on external provider

---

#### ExternalBackendSyncPolicy

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | external-backends |
| Plural | externalbackendsyncpolicies |
| Namespace | org-scoped |

**Purpose:** Sync interval, conflict resolution mode, field mapping overrides, and retry
policy for an external backend provider.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `providerRef` — reference to ExternalBackendProvider
- `syncInterval` — how often to poll for changes (e.g., '5m', '1h')

**Optional Spec Fields:**
- `conflictResolution` — default strategy: `prefer-external`, `prefer-kradle`, `manual`
- `fieldMappingOverrides` — custom field mappings
- `retryPolicy` — `{ maxRetries, backoffMs }`
- `webhookFirst` — boolean (prefer webhooks over polling)
- `backfillInterval` — how often to do full backfill

**Ownership Modes (applied by sync-controller):**
- `bidirectional` — both kradle and external may write
- `external-owned` — external is authoritative; kradle is read-only
- `kradle-owned` — kradle is authoritative; external is read-only

**Relationships:**
- Belongs to: ExternalBackendProvider/Binding
- Controls: sync-controller behavior
- Determines: conflict resolution strategy

---

#### ExternalProviderCapabilityManifest

| Field | Value |
|-------|-------|
| Storage | etcd |
| Context | external-backends |
| Plural | externalprovidercapabilitymanifests |
| Namespace | org-scoped |

**Purpose:** Discovered capability surface of an external backend provider including
supported resource kinds and API features.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `providerRef` — reference to ExternalBackendProvider
- `capabilities` — capability description

**Capability Manifest Structure:**
- `providerType` — provider type string
- `interfaces[]` — implemented interfaces: `gitForge`, `issueTracking`, `cicd`

**Validation (`validateCapabilityManifest()`):**
- providerType: required non-empty string
- interfaces: non-empty array of known interface names
- Unknown interfaces rejected

**Provider Adapter Validation (`validateProviderAdapter()`):**
Required contract:
- `descriptor()` → `{ providerType, displayName, hosting, authModes, apiCapabilities }`
- `health()` → `{ status: 'healthy'|'degraded'|'unavailable', message }`
- At least one interface: issueTracking, cicd, or gitForge
- `normalizeWebhook(payload)` → NormalizedEvent[]
- `verifyWebhook(request)` → `{ valid, reason }`

**Relationships:**
- Belongs to: ExternalBackendProvider
- Describes: what the provider can do
- Used by: platform for routing sync operations to correct interface

---

#### ExternalWebhookDelivery

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | external-backends |
| Plural | externalwebhookdeliveries |
| Namespace | org-scoped |

**Purpose:** Inbound webhook delivery from an external backend provider with event type,
payload, and processing state.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `providerRef` — which provider sent this
- `eventType` — webhook event type (e.g., 'push', 'pull_request', 'issues')
- `payload` — raw webhook payload

**Lifecycle Phases:**
- `Received` — webhook received, signature verified
- `Queued` — in processing queue
- `Normalizing` — converting to canonical event format
- `Processing` — being processed by sync controller
- `Succeeded` — successfully processed
- `DeadLettered` — processing failed after retries

**Webhook Processing (via webhook-controller):**
1. Verify HMAC-SHA256 signature (timing-safe comparison)
2. Check deduplication by deliveryId
3. Create delivery record with timestamp
4. Emit to subscriber queue
5. Process: normalize event → upsert resources → update watermark

**HMAC Verification:**
- Signature format: `sha256={hex digest}`
- Uses `crypto.createHmac('sha256', secret)`
- Timing-safe comparison via `crypto.timingSafeEqual()`
- Rejects: missing signature, invalid format, mismatched HMAC

**Relationships:**
- From: ExternalBackendProvider (via webhook)
- Produces: ExternalSyncEvent (normalized)
- Tracked by: ExternalSyncState (watermark)

---

#### ExternalSyncEvent

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | external-backends |
| Plural | externalsyncevents |
| Namespace | org-scoped |

**Purpose:** Discrete sync event record from an external backend for a specific resource
kind with deduplication and ordering metadata.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `providerRef` — source provider
- `eventKind` — event category
- `resourceRef` — affected resource reference

**Event Normalization (via sync-controller `normalizeEvent()`):**
Input:
```
{ eventType, action, nativeId, providerRef, resourceKind, data, receivedAt }
```
Output (canonical format):
```
{ eventType, action, nativeId, providerRef, resourceKind, data, receivedAt, canonicalAt }
```

**Relationships:**
- Produced by: ExternalWebhookDelivery processing
- Updates: ExternalSyncState (watermark)
- May produce: ExternalSyncConflict (on field divergence)

---

#### ExternalSyncState

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | external-backends |
| Plural | externalsyncstates |
| Namespace | org-scoped |

**Purpose:** Current sync phase, last successful sync timestamp, and error details for
an external resource binding. Implements high-watermark tracking.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `providerRef` — source provider
- `resourceRef` — the resource being tracked
- `phase` — current sync phase

**Watermark Tracking (via sync-controller):**
- `updateWatermark(bindingRef, timestamp)` — advances if newer than current
- `getWatermark(bindingRef)` — returns current watermark or null
- Persisted as CRD-shaped resource with bindingRef and timestamp

**Relationships:**
- Tracks: sync progress for each binding/resource pair
- Updated by: sync-controller after successful event processing
- Used for: resume-from-last-known-good on reconnection

---

#### ExternalWriteIntent

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | external-backends |
| Plural | externalwriteintents |
| Namespace | org-scoped |

**Purpose:** Queued write-back intent to an external backend with operation, payload
snapshot, and approval state. Manages the lifecycle of outbound mutations.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `providerRef` — target provider
- `resourceRef` — resource being written
- `operation` — operation type (e.g., 'create', 'update', 'delete')

**Optional Spec Fields:**
- `interfaceKey` — which interface to use (gitForge, issueTracking, cicd)
- `payload` — operation payload
- `requiresApproval` — boolean
- `maxRetries` — max retry attempts (default: 3)
- `idempotencyKey` — deterministic key for dedup

**Lifecycle Phases:**
- `PendingApproval` — write requires human approval
- `ReadyToSend` — approved (or no approval needed), ready for execution
- `Sending` — write in progress
- `Retrying` — write failed, retrying
- `Succeeded` — write completed successfully
- `Failed` — write failed after all retries exhausted
- `Rejected` — write approval denied

**Idempotency Key Generation (`getIdempotencyKey()`):**
- Deterministic hash of: interfaceKey + operation + resourceRef + payload
- Format: `idem-{interfaceKey}-{operation}-{hash}`
- Prevents duplicate writes for identical operations

**Operations:**
- `createWriteIntent()` — creates with validation and idempotency key
- `approveWriteIntent()` — PendingApproval → ReadyToSend
- `rejectWriteIntent()` — PendingApproval → Rejected
- `executeWriteIntent()` — ReadyToSend → Sending → Succeeded/Retrying/Failed

**Execution (`executeWriteIntent()`):**
1. Verify phase is ReadyToSend
2. Transition to Sending
3. Call executor function
4. On success: → Succeeded (with externalResult)
5. On failure: increment retry, → Retrying (if retries remain)
6. On exhaustion: → Failed (with lastError)

**Relationships:**
- Targets: ExternalBackendProvider (via providerRef)
- May require: AgentApproval (if requiresApproval)
- May produce: ExternalSyncConflict (on conflict during write)

---

#### ExternalSyncConflict

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | external-backends |
| Plural | externalsyncconflicts |
| Namespace | org-scoped |

**Purpose:** Detected conflict between local Kradle state and external provider state
with conflict kind, field-level diff, and resolution outcome.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `providerRef` — provider where conflict was detected
- `resourceRef` — affected resource
- `conflictKind` — type of conflict

**Optional Spec Fields:**
- `fieldPath` — specific field in conflict
- `localValue` — Kradle's value for the field
- `externalValue` — external provider's value
- `detectedAt` — when conflict was found

**Lifecycle Phases:**
- `Open` — conflict detected, unresolved
- `Resolving` — resolution in progress
- `Resolved` — conflict resolved (with chosen value)
- `Ignored` — conflict intentionally ignored
- `Superseded` — new sync event made this conflict irrelevant

**Resolution Strategies:**
- `prefer-external` — use external provider's value
- `prefer-kradle` — use Kradle's value
- `manual` — use explicitly provided resolvedValue
- `ignore` — mark as Ignored, no value chosen

**Operations:**
- `detectConflict()` — creates conflict if localValue !== externalValue
- `resolveConflict()` — applies strategy, transitions to Resolved/Ignored
- `supersededCheck()` — marks all Open conflicts for a resource/field as Superseded
- `getOpenConflicts()` — lists all Open (unresolved) conflicts

**Relationships:**
- References: ExternalBackendProvider, affected resource
- Resolved by: human operator or automated policy
- May block: ExternalWriteIntent (if unresolved)

---

#### ExternalObjectLink

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | external-backends |
| Plural | externalobjectlinks |
| Namespace | org-scoped |

**Purpose:** Stable mapping between a Kradle local resource and its external backend
counterpart. The identity envelope that tracks external IDs, URLs, and ETags.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `providerRef` — external provider
- `externalId` — native ID on the external system (e.g., GitHub node ID)
- `localRef` — reference to local Kradle resource

**Optional Spec Fields (in status.external on synced resources):**
- `nativeId` — external system's identifier
- `url` — external URL (e.g., GitHub PR URL)
- `etag` — HTTP ETag for change detection
- `lastSyncedAt` — last successful sync timestamp
- `firstSyncedAt` — when first synced

**Upsert Behavior (via sync-controller `upsertResource()`):**
- Creates resource with external envelope in status
- Preserves `firstSyncedAt` from existing record
- Updates `lastSyncedAt` to current time
- Sets phase to `Synced`

**Relationships:**
- Links: local Kradle resource ↔ external resource
- Used by: sync controller for bidirectional mapping
- Enables: URL resolution, change detection (ETag), dedup

---

### 1.9 Control Plane Domain (3 kinds)

---

#### PullRequest

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | control-plane |
| Plural | pullrequests |
| Namespace | org-scoped |

**Purpose:** Review unit with source/target refs, title, checks, and merge lifecycle.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `repository` — target repository
- `title` — PR title

**Gitea Integration:**
- `createGiteaBackend().createPullRequest({ owner, repo, title, head, base, body })`

**GitHub Integration:**
- `GitHubGitForge.createPullRequest({ repo, title, head, base, body })`
- `GitHubGitForge.getPullRequest({ repo, pullNumber })`
- `GitHubGitForge.mergePullRequest({ repo, pullNumber, mergeMethod })`
- Normalized: `{ number, title, state, head, base, body, merged, htmlUrl }`

**Relationships:**
- Belongs to: Organization, Repository
- Has: Review (0:N)
- Linked via: WorkItemSessionLink (to agent sessions)
- Synced from: GitHub PRs via ExternalBackendBinding

---

#### Issue

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | control-plane |
| Plural | issues |
| Namespace | org-scoped |

**Purpose:** Project-scoped work item with labels, comments, backend sync metadata,
and zero-or-more repository associations.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `title` — issue title

**Optional Spec Fields:**
- `repositoryRefs[]` — associated repositories
- `projectRefs[]` — associated projects
- `workflowState` — kanban column ID
- `labels[]` — issue labels
- `assignees[]` — assigned users

**Gitea Integration:**
- `createGiteaBackend().createIssue({ owner, repo, title, body, labels, assignees })`
- `giteaIssueSyncPlan()` — plans: ensureOrgMemoryRepository, syncIssue, writeIssueRepositoryMetadata

**GitHub Integration:**
- `GitHubIssueTracking.listIssues({ repo, state })`
- `GitHubIssueTracking.createIssue({ repo, title, body, labels })`
- `GitHubIssueTracking.updateIssue({ repo, issueNumber, title, body, labels })`
- `GitHubIssueTracking.closeIssue({ repo, issueNumber })`
- Normalized: `{ id, number, title, state, body, labels, author, htmlUrl }`
- `githubProjectIssueSyncPlan()` — plans: syncProjectItem, syncIssueMetadata, syncRepositoryLinks

**Project Relationship:**
- Issues belong to KradleProjects via `projectRefs`
- `workflowState` corresponds to project's `workflowColumns[].id`
- Kanban drag-drop updates workflowState
- Board derives columns from `project.spec.workflowColumns`

**Relationships:**
- Belongs to: Organization
- References: Repository (0:N via repositoryRefs), KradleProject (0:N via projectRefs)
- Has: Comments (via GitHub/Gitea sync)
- Linked via: WorkItemSessionLink, WorkItemWorkspaceLink
- Synced from: GitHub Issues, Gitea Issues

---

#### Review

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | control-plane |
| Plural | reviews |
| Namespace | org-scoped |

**Purpose:** Approval, comment, or change-request record for a pull request.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `pullRequest` — reference to the PullRequest

**Optional Spec Fields:**
- `state` — `approved`, `changes_requested`, `commented`
- `body` — review body text
- `author` — reviewer username

**Relationships:**
- Belongs to: PullRequest
- Synced from: GitHub PR reviews

---

### 1.10 CI/CD Domain (3 kinds)

---

#### Pipeline

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | runners-ci |
| Plural | pipelines |
| Namespace | org-scoped |

**Purpose:** CI pipeline run state with trust tier, steps, current step, and resume point.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `repository` — target repository
- `ref` — git ref (branch, tag, commit)

**Optional Spec Fields:**
- `actor` — who triggered the pipeline
- `steps[]` — ordered step names (e.g., ['checkout', 'test', 'build'])
- `trustTier` — `trusted` or `untrusted` (fork = untrusted)
- `resumeFrom` — step to resume from (for reruns)

**Creation (via `RunnerScheduler.startPipeline()`):**
- Creates Pipeline resource with phase: Running
- Creates Job resource for each step
- First job (or resumeFrom) starts as Running, others as Pending
- Trust tier from fork status (fork = untrusted)

**Rerun:**
- `RunnerScheduler.rerunFromStep()` — creates new pipeline with resumeFrom

**GitHub Integration:**
- `GitHubCicd.listWorkflowRuns({ repo, workflowId })`
- Normalized: `{ id, name, status, conclusion, headBranch, headSha, htmlUrl, createdAt }`
- External pipeline events via webhook → ExternalWebhookDelivery → Pipeline projection

**Relationships:**
- Belongs to: Organization, Repository
- Has: Job (1:N, one per step)
- Scheduled on: RunnerPool
- Synced from: GitHub Actions workflow_run events

---

#### Job

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | runners-ci |
| Plural | jobs |
| Namespace | org-scoped |

**Purpose:** Executable CI step with service-account scope and isolation metadata.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `pipeline` — reference to parent Pipeline
- `step` — step name

**Optional Spec Fields:**
- `serviceAccount` — computed service account name for RBAC isolation

**Service Account Generation (`serviceAccountForJob()`):**
- Format: `kradle-runner-{namespace}-{repository}-{pipeline}-{trustTier}`
- Ensures each job runs with appropriate permissions

**Lifecycle Phases:**
- `Pending` — waiting for runner assignment
- `Running` — executing on a runner
- `Succeeded` — completed successfully
- `Failed` — execution failed

**GitHub Integration:**
- `GitHubCicd.listJobs({ repo, runId })`
- Normalized: `{ id, name, status, conclusion, startedAt, completedAt, htmlUrl }`

**Runner Assignment:**
- `runnerController.scheduleJob(pool, job)` — assigns job to idle runner or creates new
- Volume: workspace PVC mounted at /workspace
- Environment: KRADLE_ORG, KRADLE_RUN_ID, KRADLE_WORKSPACE_PATH

**Relationships:**
- Belongs to: Pipeline
- Scheduled on: RunnerPool runner
- Has: service account for RBAC isolation

---

#### WebhookDelivery (outbound)

| Field | Value |
|-------|-------|
| Storage | postgres |
| Context | hooks-events |
| Plural | webhookdeliveries |
| Namespace | org-scoped |

**Purpose:** Durable outbound webhook delivery attempt with signature, phase, response,
and replay metadata.

**Required Spec Fields:**
- `organizationRef` — owning organization
- `subscription` — reference to WebhookSubscription
- `eventType` — event type being delivered
- `signature` — HMAC signature of payload

**Lifecycle Phases:**
- `Pending` — queued for delivery
- `Delivering` — HTTP request in flight
- `Delivered` — 2xx response received
- `Failed` — non-2xx response or network error
- `Retrying` — failed, will retry

**Relationships:**
- Belongs to: WebhookSubscription
- Contains: delivery attempt history
- Triggered by: resource-change events via event bus

---

## PART 2: External Backend Relationships

---

### 2.1 Gitea Integration

Gitea serves as the default git hosting backend. The integration is implemented in
`gitea-backend.js` and `gitea-service.js`.

#### Repository ↔ Gitea Repo

| Kradle Operation | Gitea API Call |
|-----------------|----------------|
| Create Repository | `POST /api/v1/orgs/{owner}/repos` (org) or `POST /api/v1/user/repos` (personal) |
| Private flag | Derived from visibility: private/internal → `private: true`, public → `private: false` |
| Default branch | `default_branch` parameter |
| Auto-init | `auto_init: false` (repo initialized externally) |

#### SSHKey ↔ Gitea Deploy Keys

| Kradle Operation | Gitea API Call |
|-----------------|----------------|
| Add deploy key | `POST /api/v1/repos/{owner}/{repo}/keys` with `{ title, key, read_only }` |
| Add user key | `POST /api/v1/user/keys` with `{ title, key, read_only }` |
| Remove key | (not exposed in current backend — reconciler handles) |

#### RepositoryPermission ↔ Gitea Collaborators

| Kradle Operation | Gitea API Call |
|-----------------|----------------|
| Add collaborator | `PUT /api/v1/repos/{owner}/{repo}/collaborators/{username}` with `{ permission }` |
| Team repository | `PUT /api/v1/teams/{team}/repos/{owner}/{repo}` with `{ permission }` |
| Permission levels | `read`, `write`, `admin` (direct mapping) |

#### Team ↔ Gitea Teams

| Kradle Operation | Gitea API Call |
|-----------------|----------------|
| Create team | `POST /api/v1/orgs/{org}/teams` with `{ name, permission, units }` |
| Add member | `PUT /api/v1/teams/{team}/members/{username}` |
| Default units | `['repo.code', 'repo.pulls', 'repo.issues']` |

#### BranchProtection ↔ Gitea Branch Protection

| Kradle Operation | Gitea API Call |
|-----------------|----------------|
| Protect branch | `POST /api/v1/repos/{owner}/{repo}/branch_protections` |
| Parameters | `branch_name`, `enable_push: false`, `enable_push_whitelist: true`, `required_approvals`, status checks |

#### Issue/PR ↔ Gitea

| Kradle Operation | Gitea API Call |
|-----------------|----------------|
| Create issue | `POST /api/v1/repos/{owner}/{repo}/issues` |
| Create PR | `POST /api/v1/repos/{owner}/{repo}/pulls` |
| Create webhook | `POST /api/v1/repos/{owner}/{repo}/hooks` (type: 'gitea') |

#### Git Tree/Blob API (gitea-service.js)

| Operation | Gitea API Call |
|-----------|----------------|
| listTree | `GET /api/v1/repos/{owner}/{repo}/contents/{path}?ref={ref}` |
| getBlob | `GET /api/v1/repos/{owner}/{repo}/raw/{filepath}?ref={ref}` |
| listBranches | `GET /api/v1/repos/{owner}/{repo}/branches` |

**Fallback Behavior:**
- `createGiteaService()` returns `null` when `KRADLE_GITEA_HTTP_URL` is not set
- Callers fall back to mock data when service is null
- 404 responses return null (graceful degradation)

#### Repository Integration Plan (`giteaRepositoryIntegrationPlan()`)

Complete integration requires these sequential operations:
1. `createOrganization` — ensure Gitea org exists
2. `createRepository` — create the repo
3. `ensureUserMappings` — map Kradle users to Gitea users
4. `addDeployKey` — add GitOps deploy key (read/write)
5. `addUserSshKey` — add developer keys
6. `addCollaborator` — set permissions
7. `addTeamRepository` — grant team access (maintainers: admin)
8. `protectBranch` — protect main branch
9. `createWebhook` — register event webhook

#### Issue Sync Plan (`giteaIssueSyncPlan()`)

For issue synchronization with Gitea:
1. `ensureOrgMemoryRepository` — ensure `_${org}_` repo exists
2. `syncIssue` — create/update issue in Gitea
3. `writeIssueRepositoryMetadata` — write metadata labels linking issue to repositories

---

### 2.2 GitHub Integration (External Backend)

GitHub is implemented as the first ExternalBackendProvider with full adapter support.

#### Authentication Flow

1. **JWT Creation (`createGitHubJwt()`):**
   - Encodes: `{ iat, exp, iss: appId }` with RS256 (production) or HS256 (test)
   - PEM key detection: looks for `-----BEGIN` prefix
   - Produces: signed JWT for GitHub App authentication

2. **Installation Token Exchange (`exchangeInstallationToken()`):**
   - Endpoint: `POST /app/installations/{installationId}/access_tokens`
   - Authorization: `Bearer {appJwt}`
   - Returns: `{ token, expiresAt }`
   - Token used for all subsequent API calls

#### Git Forge Interface (GitHubGitForge)

| Method | GitHub API | Returns |
|--------|-----------|---------|
| `listRepositories()` | `GET /installation/repositories` | `NormalizedRepo[]` |
| `getPullRequest({ repo, pullNumber })` | `GET /repos/{owner}/{repo}/pulls/{number}` | `NormalizedPR` |
| `createPullRequest({ repo, title, head, base, body })` | `POST /repos/{owner}/{repo}/pulls` | `NormalizedPR` |
| `mergePullRequest({ repo, pullNumber, mergeMethod })` | `PUT /repos/{owner}/{repo}/pulls/{number}/merge` | `{ merged, sha, message }` |
| `listRefs({ repo })` | `GET /repos/.../branches` + `GET /repos/.../tags` | `{ branches, tags }` |
| `syncDeployKeys({ repo, desiredKeys })` | GET+DELETE+POST `/repos/.../keys` | `{ added, removed }` |
| `syncBranchProtection({ repo, branch, ... })` | `PUT /repos/.../branches/{branch}/protection` | protection object |

#### Issue Tracking Interface (GitHubIssueTracking)

| Method | GitHub API | Returns |
|--------|-----------|---------|
| `listIssues({ repo, state })` | `GET /repos/{owner}/{repo}/issues?state={state}` | `NormalizedIssue[]` |
| `createIssue({ repo, title, body, labels })` | `POST /repos/{owner}/{repo}/issues` | `NormalizedIssue` |
| `updateIssue({ repo, issueNumber, ... })` | `PATCH /repos/{owner}/{repo}/issues/{number}` | `NormalizedIssue` |
| `closeIssue({ repo, issueNumber })` | `PATCH .../issues/{number}` (state: closed) | `NormalizedIssue` |
| `listComments({ repo, issueNumber })` | `GET /repos/.../issues/{number}/comments` | `NormalizedComment[]` |
| `createComment({ repo, issueNumber, body })` | `POST /repos/.../issues/{number}/comments` | `NormalizedComment` |

#### CI/CD Interface (GitHubCicd)

| Method | GitHub API | Returns |
|--------|-----------|---------|
| `listWorkflowRuns({ repo, workflowId })` | `GET /repos/.../actions/runs` or `.../workflows/{id}/runs` | `NormalizedWorkflowRun[]` |
| `listJobs({ repo, runId })` | `GET /repos/.../actions/runs/{id}/jobs` | `NormalizedJob[]` |
| `rerunWorkflow({ repo, runId })` | `POST /repos/.../actions/runs/{id}/rerun` | `{ triggered, runId }` |
| `cancelWorkflow({ repo, runId })` | `POST /repos/.../actions/runs/{id}/cancel` | `{ cancelled, runId }` |
| `createCheck({ repo, name, headSha, ... })` | `POST /repos/.../check-runs` | `NormalizedCheckRun` |
| `updateCheck({ repo, checkRunId, ... })` | `PATCH /repos/.../check-runs/{id}` | `NormalizedCheckRun` |

#### Webhook Events Handled

The webhook controller processes these GitHub event types:
- `push` — code pushed to repository
- `pull_request` — PR opened, closed, merged, edited, synchronized
- `pull_request_review` — review submitted
- `issues` — issue opened, closed, edited, labeled
- `issue_comment` — comment on issue or PR
- `workflow_run` — GitHub Actions workflow started/completed
- `workflow_job` — individual job within a workflow
- `check_suite` — check suite created/completed
- `check_run` — check run created/completed
- `deployment` — deployment created
- `deployment_status` — deployment status changed
- `label` — label created/edited/deleted

#### Bidirectional Sync Flow

**Inbound (GitHub → Kradle):**
1. GitHub fires webhook to Kradle endpoint
2. `webhookController.processDelivery()` — verify HMAC, dedup, queue
3. `syncController.normalizeEvent()` — raw → canonical format
4. `syncController.upsertResource()` — create/update local resource with external envelope
5. `syncController.updateWatermark()` — advance high-watermark
6. Event bus emits resource-change → SSE → UI updates

**Outbound (Kradle → GitHub):**
1. User creates/modifies resource in Kradle
2. `writeController.createWriteIntent()` — queue write with idempotency key
3. If approval required: pause at PendingApproval
4. `writeController.executeWriteIntent()` — call GitHub API via adapter
5. On success: mark Succeeded, update ExternalObjectLink
6. On failure: retry up to maxRetries, then mark Failed

#### Conflict Handling

When GitHub and Kradle disagree on a field value:
1. `conflictController.detectConflict()` — compares localValue vs externalValue
2. If different: creates ExternalSyncConflict (phase: Open)
3. Resolution options:
   - Auto-resolve via ExternalBackendSyncPolicy conflictResolution setting
   - Manual resolve via UI/API
4. `conflictController.resolveConflict()` — applies chosen strategy
5. `conflictController.supersededCheck()` — cleans up when new sync arrives

---

### 2.3 Issue/Project Relationships

#### How KradleProject Groups Issues

1. **Project Definition:**
   - `spec.workflowColumns[]` defines kanban columns (e.g., Backlog, In Progress, Done)
   - Each column has: `{ id, displayName, color, default? }`
   - `spec.repositoryRefs[]` links project to repositories

2. **Issue → Project Association:**
   - Issues reference projects via `spec.projectRefs[]`
   - Multiple issues can belong to one project
   - One issue can belong to multiple projects

3. **Kanban Board Derivation:**
   - Board columns come from `project.spec.workflowColumns`
   - Issues are placed in columns based on `issue.spec.workflowState`
   - Default column: first column with `default: true`, or first column overall

4. **Drag-Drop Updates:**
   - Moving issue between columns updates `issue.spec.workflowState` to target column ID
   - Triggers event bus → SSE → UI update

5. **External Issues (GitHub → Kradle):**
   - GitHub issues synced via ExternalBackendBinding
   - External issue gets ExternalObjectLink with nativeId
   - workflowState mapped from GitHub project column (if synced)
   - Labels and assignees synchronized bidirectionally

6. **Work Item Links:**
   - `WorkItemSessionLink`: connects issues to agent sessions that worked on them
   - `WorkItemWorkspaceLink`: connects issues to workspaces containing related work
   - Enables: "which agent sessions touched this issue?" queries

---

### 2.4 GitHub Project Sync Plan

`githubProjectIssueSyncPlan()` produces a plan with these actions:
1. `syncProjectItem` — sync issue to/from GitHub Project board
2. `syncIssueMetadata` — sync labels, assignees, state
3. `syncRepositoryLinks` — sync repository associations

---

## PART 3: Runs, Runners, and Pipeline Integration

---

### 3.1 Run Lifecycle (AgentDispatchRun)

The complete lifecycle of an agent dispatch run:

#### Phase 1: Initiation

**Manual Dispatch (`createManualDispatch()`):**
1. **Stack Resolution**: Find AgentStack by name in resources
   - Error if not found: `stack-not-found`

2. **Permission Review**: `permissionReviewer.reviewPermissions()`
   - Inputs: repository, ref, actor, agentStack, resources
   - Outcomes:
     - `allowed` → proceed to workspace provisioning
     - `denied` → return error with review details
     - `requires-approval` → create approval, return early

3. **Memory Snapshot**: If AgentMemoryRepository exists:
   - Resolve time-travel (mode: current)
   - Create AgentMemorySnapshot with resolved commit
   - Pin memory state for reproducibility

4. **Approval Gate** (if requires-approval):
   - Create AgentApproval (action: 'secret-access')
   - Create AgentDispatchRun with phase: `AwaitingApproval`
   - Return early — human must approve before continuing

**Trigger-Based Dispatch (`processEvent()`):**
1. Evaluate event against all AgentTriggerRule resources
2. For each matching rule (not deduplicated):
   - Create AgentTriggerExecution record
   - Call `createManualDispatch()` with rule's agentStack and taskKind
3. Track: processed, dispatched, skipped counts

#### Phase 2: Workspace Provisioning

5. **Find Reusable Workspace**: `findReusableWorkspace()`
   - Match: same org + same repository + same branch + phase=Ready
   - If found: `claimWorkspace()` → phase: InUse

6. **Create New Workspace** (if no reusable):
   - `createWorkspace()` → generates:
     - KradleWorkspace resource (phase: Pending)
     - PersistentVolumeClaim manifest
   - PVC: storageClassName=standard, capacity=10Gi, ReadWriteOnce

7. **Mount Spec**: `getMountSpec()` → volume + volumeMount for pod spec

#### Phase 3: Context Assembly

8. **Context Bundle**: `assembleContextBundle()`
   - Gathers: stack spec prompts, context labels, repository info, source refs
   - Applies: redaction scanning
   - Produces: immutable bundle with content-addressable digest

#### Phase 4: Resource Creation

9. **Create AgentDispatchRun**: 
   - Spec: organizationRef, repository, sourceRefs, agentStack, taskKind, contextBundleRef
   - Optional: memorySnapshotRef, workspaceRef, mountSpec
   - Status: phase=Pending, queuedAt=now

10. **Create AgentDispatchAttempt**:
    - Spec: agentDispatchRun, attemptReason='initial', agentStackSnapshot (frozen)
    - Status: permissionSnapshot, queueEnteredAt

#### Phase 5: Session Launch

11. **Agent Mux Client Check**: `agentMuxClient.isAvailable()`
    - If unavailable: phase=Queued, condition `AgentMuxBound: False (Unavailable)`

12. **Launch Session**: `agentMuxClient.launchSession({ stack, contextBundle, permissionSnapshot })`
    - Success: returns `{ runId, sessionId }`
    - Sets: attempt.status.agentMuxRunId, agentMuxSessionId
    - Run phase → Running, attempt.status.startedAt

13. **SSE Subscription**: `agentMuxClient.subscribeToEvents(runId, handler)`
    - Streams real-time events from Agent Mux
    - Events collected in array for transcript reconciliation
    - Run status: `sseSubscription: { runId, active: true }`

14. **Transcript Creation**: `agentMuxClient.reconcileTranscript(sessionId, events)`
    - Creates AgentSessionTranscript resource
    - Run status: transcriptRef set

#### Phase 6: Completion

15. **Success**: Agent completes task
    - Run phase → Succeeded
    - Workspace released: `releaseWorkspace()` → phase: Ready
    - Artifacts emitted as KradleArtifact resources

16. **Failure**: Agent fails or times out
    - Run phase → Failed
    - May create new attempt (retry) with attemptReason='retry'
    - Workspace may be retained for debugging

---

### 3.2 Runner System

#### RunnerPool Resource Management

**Pool Validation:**
- metadata.name: required
- organizationRef: required, non-empty
- warmReplicas: non-negative integer
- maxReplicas: positive integer, >= warmReplicas

**Pool Status Tracking:**
```
{ poolName, idle, active, terminating, total, desired, maxReplicas, phase, scaling }
```
- Phase: Empty (no runners) | Active (runners executing) | Idle (runners waiting)
- Scaling: ScalingUp (total < desired) | ScalingDown (total > max) | Stable

**Capacity Tracking:**
```
{ poolName, maxReplicas, used, available, utilizationPct }
```
- used: runners with status=Running
- available: maxReplicas - used
- utilizationPct: (used/maxReplicas) * 100

#### Runner Lifecycle

**Creation (`createRunner()`):**
- Generates unique ID: `runner-{poolName}-{timestamp}-{random}`
- Status: `Idle` (pre-warmed) or `Running` (assigned to job)
- Produces pod spec for Kubernetes

**Termination (`terminateRunner()`):**
- Status → Terminating
- Removes job assignment
- Removes from registry

**Job Scheduling (`scheduleJob()`):**
1. Check if job already assigned → return existing runner (reused)
2. Find idle runner in pool → assign job, status → Running
3. Check capacity → if available, create new runner
4. No capacity → error: `no-capacity`

#### Pod Spec Generation

`generatePodSpec()` produces:
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: runner-{runnerId}
  namespace: {org namespace}
  labels:
    kradle.a5c.ai/runner: {runnerId}
    kradle.a5c.ai/pool: {poolName}
    kradle.a5c.ai/org: {orgRef}
spec:
  serviceAccountName: {configured or 'kradle-runner'}
  restartPolicy: Never
  containers:
    - name: runner
      image: {pool.spec.image or 'ubuntu:24.04'}
      env:
        - name: KRADLE_ORG
          value: {organizationRef}
        - name: KRADLE_RUN_ID
          value: {runId}
        - name: KRADLE_WORKSPACE_PATH
          value: /workspace
      volumeMounts:
        - name: workspace
          mountPath: /workspace
      resources:
        limits: {cpu: '2', memory: '4Gi'}
        requests: {cpu: '500m', memory: '1Gi'}
  volumes:
    - name: workspace
      persistentVolumeClaim:
        claimName: kradle-ws-{runId}
```

---

### 3.3 Argo CD / KubeVela Relationship

#### Argo CD for GitOps Deployment

Kradle uses Argo CD for GitOps-based deployment of itself. The integration is in
`argocd-gitops.js`.

**Application Resource (`createArgoCdApplication()`):**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: kradle
  namespace: argocd
  labels:
    app.kubernetes.io/part-of: kradle
    kradle.a5c.ai/gitops-engine: argocd
spec:
  project: default
  source:
    repoURL: {configured repo URL}
    targetRevision: HEAD
    path: charts/kradle
  destination:
    server: https://kubernetes.default.svc
    namespace: kradle-system
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

**GitOps Plan (`createKradleGitOpsPlan()`):**
- Engine: argocd
- Required cluster resources: Application.argoproj.io, Namespace, ServiceAccount, RBAC, APIService, Kradle CRDs
- Sync guarantees: automated prune, automated selfHeal, namespace creation

**Label Convention:**
- `kradle.a5c.ai/gitops-engine: argocd` — identifies GitOps-managed resources

#### KubeVela for Delivery Abstractions

KubeVela provides OAM (Open Application Model) delivery abstractions:

**Discovered Resources (core.oam.dev group):**
- KubeVelaApplication — OAM application definition
- KubeVelaApplicationRevision — revision history
- KubeVelaComponentDefinition — component type definitions
- KubeVelaWorkloadDefinition — workload type definitions
- KubeVelaTraitDefinition — trait type definitions
- KubeVelaScopeDefinition — scope type definitions
- KubeVelaPolicyDefinition — policy type definitions
- KubeVelaPolicy — policy instances
- KubeVelaWorkflowStepDefinition — workflow step definitions
- KubeVelaWorkflow — workflow instances
- KubeVelaResourceTracker — resource tracking (cluster-scoped)

**KubeVela Integration Points:**
- Default namespace: `vela-system` (configurable via `KRADLE_KUBEVELA_NAMESPACE`)
- Discovered via CRD listing during snapshot
- ResourceTracker is cluster-scoped (not namespaced)
- Applications are org-scoped (live in org namespaces)

**When KubeVela is NOT installed:**
- Deployments page shows fallback pipeline visualization
- No OAM resources in snapshot
- CRD discovery reports empty for core.oam.dev group

**When Kyverno is NOT installed:**
- Policies page shows informational banner
- No Kyverno resources in snapshot
- PolicyBinding enforce mode may be blocked (if `KRADLE_KYVERNO_REQUIRE_FOR_ENFORCE_MODE=true`)

---

### 3.4 External Pipeline Integration

#### Pipeline/Job ↔ External CI Systems

**GitHub Actions Integration via ExternalBackendBinding:**

1. **Webhook Events:**
   - `workflow_run` → Pipeline resource projection
   - `workflow_job` → Job resource projection
   - `check_suite` → Pipeline status update
   - `check_run` → Job status update

2. **Event Flow:**
   ```
   GitHub webhook → ExternalWebhookDelivery → normalizeEvent() → Pipeline/Job upsert
   ```

3. **Pipeline Phase Mapping:**
   - GitHub `queued` → Pipeline phase `Queued`
   - GitHub `in_progress` → Pipeline phase `Running`
   - GitHub `completed` + conclusion `success` → Pipeline phase `Succeeded`
   - GitHub `completed` + conclusion `failure` → Pipeline phase `Failed`

4. **Job Phase Mapping:**
   - Similar to Pipeline but at individual job level
   - Tracks: startedAt, completedAt, conclusion

**Check Run Integration:**
- `GitHubCicd.createCheck()` — create check run on commit
- `GitHubCicd.updateCheck()` — update check status/conclusion
- Used by: Kradle to report agent dispatch status back to GitHub

**Runner Integration (External Runners):**
- GitHub Actions self-hosted runners (ARC) can connect to RunnerPool
- External runners register via RunnerPool configuration
- Trust tier: `trusted` (internal runners) vs `untrusted` (fork runners)
- Capacity tracked: external runners count toward pool maxReplicas

#### Pipeline Visualization (RunnerScheduler)

`RunnerScheduler.startPipeline()`:
- Creates Pipeline resource with ordered steps
- Creates Job per step with service account isolation
- Jobs start sequentially (first Running, rest Pending)
- Trust tier propagated to job labels

`RunnerScheduler.rerunFromStep()`:
- Creates new pipeline named `{original}-rerun-{step}`
- Preserves same steps but resumes from specified step
- Maintains trust tier from original pipeline

---

## PART 4: Cross-cutting Relationships

---

### 4.1 Resource Dependency Graph

#### AgentStack References (hub resource)
```
AgentStack
  ├── AgentSubagent[]         (via subagentRefs)
  ├── AgentToolProfile        (via toolPolicy/toolPolicyRef)
  ├── AgentMcpServer[]        (via mcpServerRefs)
  ├── AgentSkill[]            (via skillRefs)
  ├── AgentContextLabel[]     (via contextLabelRefs)
  ├── AgentServiceAccount     (via runtimeIdentity)
  ├── KradleWorkspacePolicy    (via workspacePolicy)
  ├── AgentProviderConfig     (via provider)
  └── AgentAdapter            (via adapter)
```

#### AgentDispatchRun References
```
AgentDispatchRun
  ├── AgentStack              (via agentStack)
  ├── Repository              (via repository)
  ├── KradleWorkspace          (via workspaceRef)
  ├─��� AgentContextBundle      (via contextBundleRef)
  ├── AgentMemorySnapshot     (via memorySnapshotRef)
  ├── AgentDispatchAttempt[]  (child resources)
  ├── AgentSession            (child, via Attempt)
  ├── AgentApproval[]         (gating resources)
  ├── KradleArtifact[]         (outputs)
  └── AgentSessionTranscript  (via transcriptRef)
```

#### AgentSession References
```
AgentSession
  ├── AgentDispatchRun        (via dispatchRun)
  ├── AgentSessionTranscript  (1:1)
  ├── AgentSessionAttachment[] (0:N)
  ├── WorkItemSessionLink[]   (to Issues/PRs)
  └── KradleWorkspace          (bound workspace)
```

#### ExternalBackendBinding References
```
ExternalBackendBinding
  ├── ExternalBackendProvider        (via providerRef)
  ├── ExternalBackendSyncPolicy      (controls sync)
  ├── ExternalWebhookDelivery[]      (inbound events)
  ├── ExternalSyncEvent[]            (normalized events)
  ├── ExternalSyncState[]            (watermarks)
  ├── ExternalWriteIntent[]          (outbound writes)
  ├── ExternalSyncConflict[]         (detected conflicts)
  ├── ExternalObjectLink[]           (identity mappings)
  └── Repository                     (sync target)
```

#### KradleProject References
```
KradleProject
  ├── Issue[]                 (via issue.projectRefs)
  ├── Repository[]            (via repositoryRefs)
  ├── AgentStack[]            (via stackRefs)
  └── ExternalBackendBinding  (for GitHub Projects sync)
```

#### Pipeline References
```
Pipeline
  ├── Repository              (via repository)
  ├── Job[]                   (child resources)
  ├���─ RunnerPool              (scheduling target)
  └── ExternalObjectLink      (GitHub Actions workflow_run)
```

---

### 4.2 Namespace Topology

#### Platform Namespace (`kradle-system`)
Contains platform-scoped resources that span all organizations:
- Organization (all org definitions)
- OrgNamespaceBinding (all namespace bindings)

#### Organization Namespace (`kradle-org-{slug}`)
Contains all org-scoped resources:
- Identity: User, Team, Invite, IdentityMapping, AuthProvider, AgentServiceAccount
- Repository: Repository, SSHKey, RepositoryPermission, BranchProtection, RefPolicy, WebhookSubscription
- Agents: AgentStack, AgentSubagent, AgentToolProfile, AgentMcpServer, AgentSkill, AgentTriggerRule, AgentContextLabel, KradleWorkspacePolicy, AgentAdapter, AgentTransportBinding, AgentProviderConfig, KradleProject, AgentGatewayConfig
- Memory: AgentMemoryRepository, AgentMemorySource, AgentMemoryOntology, AgentMemoryAssociation
- Workspace: KradleWorkspace
- External: ExternalBackendProvider, ExternalBackendBinding, ExternalBackendSyncPolicy, ExternalProviderCapabilityManifest
- Policy: PolicyProfile, PolicyTemplate, PolicyBinding, PolicyExceptionRequest
- Runners: RunnerPool
- UI: View, Selector
- Aggregated (postgres): PullRequest, Issue, Review, Pipeline, Job, WebhookDelivery, all Agent* aggregated kinds, all External* aggregated kinds

#### Cross-Namespace References
- Resources do NOT reference across org namespaces (org isolation guarantee)
- Platform-scoped resources (Organization, OrgNamespaceBinding) are in `kradle-system`
- Org-scoped resources resolve their namespace via `resolveResourceOrg()`
- If `metadata.namespace` conflicts with org namespace → error thrown
- If org label conflicts with spec.organizationRef → error thrown

#### Org Isolation Guarantees
- Each org gets exactly one namespace
- Resources cannot reference resources in other org namespaces
- Snapshot enumeration only queries known org namespaces
- `withOrgScope()` enforces namespace consistency at apply time
- RBAC via AgentRoleBinding is scoped to org namespace

---

### 4.3 Event Propagation

#### Resource Change → UI Update
```
Resource apply/delete
  → event-bus.emitResourceChange(kind, name, operation)
  → globalEventBus.emit({ type: 'resource-change', kind, name, operation, timestamp })
  → SSE endpoint streams to connected clients
  → React UI receives event → refetches affected resources
```

#### Webhook → Resource Update → UI
```
External webhook (GitHub, etc.)
  → webhookController.processDelivery() [verify HMAC, dedup]
  → syncController.normalizeEvent() [raw → canonical]
  → syncController.upsertResource() [create/update with envelope]
  → syncController.updateWatermark() [advance cursor]
  → event-bus.emitResourceChange()
  → SSE → UI update
```

#### Trigger Rule → Dispatch → Session → Events
```
Event arrives (push, PR, issue, cron, webhook, comment, label)
  → triggerController.evaluateEvent() [match rules, dedup]
  → triggerController.createTriggerExecution() [audit record]
  → dispatchController.createManualDispatch() [full orchestration]
  → agentMuxClient.launchSession() [start agent]
  → agentMuxClient.subscribeToEvents() [SSE from agent]
  → agentMuxClient.reconcileTranscript() [build transcript]
  → event-bus.emitResourceChange('AgentDispatchRun', ...)
  → SSE → UI shows running session
```

#### Approval Request → User Action → Run Continues
```
Permission review says 'requires-approval'
  → approvalController.createApprovalRequest() [phase: Pending]
  → event-bus.emitResourceChange('AgentApproval', ...)
  → SSE → UI shows approval request notification
  → User clicks approve/deny in UI
  → approvalController.recordDecision() [phase: Approved/Denied]
  → event-bus.emitResourceChange('AgentApproval', ...)
  → If approved: dispatch continues from step 5 (workspace provisioning)
  → If denied: run marked Failed
```

#### External Write → Conflict → Resolution
```
User modifies resource in Kradle
  → writeController.createWriteIntent() [queue outbound write]
  → If requiresApproval: pause at PendingApproval
  → writeController.executeWriteIntent() [call external API]
  → On conflict: conflictController.detectConflict()
  → ExternalSyncConflict created (phase: Open)
  → event-bus → SSE → UI shows conflict
  → User resolves via UI
  → conflictController.resolveConflict() [strategy applied]
  → If prefer-kradle: retry write
  → If prefer-external: accept external value, update local
```

---

### 4.4 Storage Boundaries

| Storage | Resources | Access Pattern |
|---------|-----------|----------------|
| etcd (CRDs) | Organization, User, Team, Repository, AgentStack, ExternalBackendProvider, etc. (44 kinds) | kubectl get/apply/delete, K8s watch |
| postgres (Aggregated) | PullRequest, Issue, Pipeline, AgentDispatchRun, AgentSession, ExternalWebhookDelivery, etc. (30 kinds) | Aggregated API, snapshot cache |
| kubevela | KubeVelaApplication, etc. (12 kinds) | kubectl via core.oam.dev group |
| kyverno | KyvernoPolicy, PolicyReport, etc. (10 kinds) | kubectl via kyverno.io group |
| core | Secret, ConfigMap | kubectl (not in snapshot, on-demand access) |
| repositories | Git repository data | Gitea API, raw git |
| objects | Artifacts, attachments | Object storage (referenced by digest) |

---

### 4.5 Snapshot Architecture

The `getControllerSnapshot()` function produces a comprehensive cluster state:

```javascript
{
  source: 'kubernetes',
  mode: 'kubernetes-api',
  namespace,           // platform namespace
  generatedAt,         // ISO timestamp
  correlationId,       // UUID for request tracing
  kubectl: {           // kubectl binary status
    binary, context, clientVersion, available, errors
  },
  apiService,          // Kradle APIService resource (if exists)
  crds,                // Discovered CRD resources
  resources: {         // All resources by kind
    Organization: [...],
    Repository: [...],
    AgentStack: [...],
    // ... all 76+ kinds
  },
  kyverno: {           // Kyverno discovery
    mode, namespace, detected, controllers, resources, reports, permissions, degraded
  },
  events,              // K8s events in platform namespace
  permissions,         // RBAC can-i results per resource kind
  storage,             // Storage boundary descriptions
  commands             // kubectl command templates per kind
}
```

**Snapshot Enumeration:**
1. Platform-scoped resources: listed in `kradle-system`
2. Org-scoped resources: listed in each discovered org namespace
3. Kyverno resources: listed if CRDs detected
4. Stale-while-revalidate: 30s TTL cache

**In-Cluster Detection:**
- Checks `KUBERNETES_SERVICE_HOST` + service account token
- Auto-configures kubectl with in-cluster credentials

---

## Part 10: Inference Domain

### 10.1 KradleInferenceService Behavior

`KradleInferenceService` is a Kradle-owned wrapper around the KServe `InferenceService` CRD in the `serving.kserve.io/v1beta1` API group. The controller (`kradle-inference-service-controller.js`) manages the full lifecycle:

**On create/update:**
1. Validates `spec.predictor.model.modelFormat.name` against `SUPPORTED_MODEL_FORMATS`
2. Generates a complete KServe `InferenceService` manifest including predictor, resources, and protocol version
3. Applies the manifest to Kubernetes via `kubectl apply`
4. Sets `status.phase = 'Pending'`

**Phase transitions:**
- `Pending` → `Ready`: When KServe readiness probe passes and the service URL is available
- `Pending` / `Ready` → `Failed`: On error during manifest apply or when KServe reports failure
- Status transitions are driven by polling `status.url` from the underlying `InferenceService` resource

**Endpoint discovery:**
- `status.url` is resolved from the underlying KServe `InferenceService.status.url` field
- Available only after the service reaches `Ready` phase
- Used by `toProviderConfig()` to bridge to `AgentProviderConfig`

**`toProviderConfig()` bridge:**
- Returns an `AgentProviderConfig` with `spec.type: 'kserve'`
- Includes the resolved endpoint URL and inference protocol version
- Allows `AgentStack` CRDs to route requests to on-cluster inference services alongside cloud LLMs

**Deletion:**
- Deleting the `KradleInferenceService` resource cascades to deletion of the underlying KServe `InferenceService`

### 10.2 KradleServingRuntime Behavior

`KradleServingRuntime` wraps the KServe `ServingRuntime` (or `ClusterServingRuntime`) CRD:

**On create/update:**
1. Validates `supportedModelFormats` entries
2. Generates and applies the KServe `ServingRuntime` manifest
3. Runtime is registered in the KServe runtime registry

**Lifecycle:**
- Independent of individual inference services — a runtime can be referenced by multiple `KradleInferenceService` instances
- Deleted only when explicitly removed; does not cascade from inference service deletion

**Reference from KradleInferenceService:**
- `spec.predictor.model.runtime` field names the runtime
- KServe uses the runtime to determine the serving container image and configuration

---

## Part 11: Artifact Domain

### 11.1 ArtifactRegistry Lifecycle

`ArtifactRegistry` is the top-level scope for artifact storage:

**On create:**
1. Allocates storage in the configured backend:
   - `internal`: uses etcd (small artifacts, dev/test)
   - `s3` / `gcs` / `azure-blob`: creates/configures cloud bucket paths from `storageConfig`
2. If `externalIntegration` is set, establishes connection to external provider
3. Sets `status.phase = 'Ready'` when storage is accessible

**External integration modes:**
- `read-only`: proxies reads to external provider; writes are rejected
- `read-write`: both reads and writes flow to the external provider
- `mirror`: internal storage is primary; published versions are also synced to the external provider

**Deletion:**
- Cascades to all child `ArtifactFeed` resources
- Cloud storage data is NOT automatically deleted (requires manual cleanup)

### 11.2 Feed Management

`ArtifactFeed` belongs to exactly one `ArtifactRegistry`:

**Visibility enforcement:**
- `public` feeds: all authenticated users can read (download)
- `private` feeds: read access requires an `ArtifactAccessPolicy` with `permission: 'read'`

**Retention policy:**
- Enforced on each version publish: after storing the new version, the controller checks `maxVersions` and `maxAgeDays`
- Oldest versions pruned first; versions are soft-deleted (phase set to `Archived`) before hard-delete

**Access policy resolution:**
- Fine-grained permissions via `ArtifactAccessPolicy` resources
- `write` permission required to publish versions
- `admin` permission required to modify feed settings or revoke other policies

### 11.3 Version Publishing

`ArtifactVersion` is created via `POST /api/orgs/{org}/artifacts/feeds/{feed}/publish`:

1. `withAuth` middleware populates `spec.publishedBy` from the session user
2. `spec.publishedAt` is set to current ISO 8601 timestamp
3. Checksums (`sha256`, `md5`) are computed from the uploaded content and stored
4. Version name is derived from `name@version` string; immutable once set
5. Retention policy check runs post-publish

### 11.4 Download Tracking

`ArtifactDownload` records are written on each package download:

- Created by the download handler in the artifact feed controller
- Captures: `downloadedBy`, `downloadedAt`, `ipAddress`, `userAgent`, `clientId`
- Used for analytics dashboards and rate-limiting enforcement
- Records are append-only; not modified after creation

---

## Part 12: Cross-Domain Relationships

### 12.1 Inference → Agent

The inference domain integrates with the agent domain via the provider config bridge:

1. `KradleInferenceService.toProviderConfig()` creates an `AgentProviderConfig` with:
   - `spec.type: 'kserve'`
   - `spec.endpoint`: resolved `status.url` from the inference service
   - `spec.protocolVersion`: V1 or V2

2. `AgentStack` references the provider config in `spec.providers[]`

3. When an agent is dispatched, `resolveStack()` resolves all provider configs and injects the KServe endpoint URL as an env var into the K8s Job

4. This allows agent stacks to mix cloud LLMs (Anthropic, OpenAI) with on-cluster models (KServe-hosted sklearn, PyTorch, etc.) in the same stack definition

### 12.2 Artifacts → Repositories

Artifact feeds can integrate with Kradle repositories:

- **Version tagging**: ArtifactVersion publish can create a git tag in the associated repository
- **Release integration**: In `mirror` mode, published versions are synced to repository releases (GitHub Releases / Gitea Releases)
- **Internal feeds**: use Kradle storage (etcd or cloud blob); no repository dependency required
- **External feeds**: proxy to the configured provider (e.g., npm registry, PyPI, GitHub Packages); repository serves as the source of truth for release metadata

The relationship is optional: artifact feeds do not require a repository reference and can operate as standalone package registries.
- Falls back to kubeconfig if not in-cluster
