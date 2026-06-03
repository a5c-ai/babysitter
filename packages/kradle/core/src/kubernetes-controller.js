import { spawn, spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';

export const KRADLE_API_GROUP = 'kradle.a5c.ai';
export const KRADLE_API_VERSION = 'v1alpha1';
export const KRADLE_API_VERSIONED_GROUP = `${KRADLE_API_VERSION}.${KRADLE_API_GROUP}`;
export const KUBEVELA_API_GROUP = 'core.oam.dev';
export const KYVERNO_API_GROUP = 'kyverno.io';
export const KYVERNO_POLICIES_API_GROUP = 'policies.kyverno.io';
export const POLICY_REPORT_API_GROUP = 'wgpolicyk8s.io';
export const KRADLE_ORG_LABEL = 'kradle.a5c.ai/org';
export const KRADLE_ORG_NAMESPACE_LABEL = 'kradle.a5c.ai/namespace';
export const KRADLE_PLATFORM_NAMESPACE = process.env.KRADLE_NAMESPACE || 'kradle-system';

export const KUBERNETES_RESOURCE_CLIENT_BOUNDARY = {
  role: 'kubernetes-resource-client',
  scope: 'workspace API discovery, delegated access checks, list/get/apply/delete/watch, and command normalization',
  owns: ['workspace command execution', 'Kradle API resource discovery', 'delegated access checks', 'workspace watch streams'],
  mustNotOwn: ['HTTP route orchestration', 'Next.js page flows', 'forge DTO composition', 'business workflow decisions']
};

export const KRADLE_KUBERNETES_RECONCILER_BOUNDARY = {
  role: 'kradle-kubernetes-reconciler',
  scope: 'reconcile Kubernetes-style Kradle resources into status, repository hosting intent, policy projection, and data-plane sync intent',
  owns: ['Repository status projection', 'identity and access status projection', 'repository hosting intent', 'policy sync intent', 'degraded condition reporting'],
  delegatesTo: ['kubernetes-resource-gateway', 'git-data-plane'],
  mustNotOwn: ['HTTP routes', 'web page navigation', 'API DTO shaping', 'browser form behavior']
};

export const KRADLE_RESOURCES = [
  { kind: 'Organization', plural: 'organizations', namespaced: true, namespace: KRADLE_PLATFORM_NAMESPACE, storage: 'etcd', platformScoped: true },
  { kind: 'OrgNamespaceBinding', plural: 'orgnamespacebindings', namespaced: true, namespace: KRADLE_PLATFORM_NAMESPACE, storage: 'etcd', platformScoped: true },
  { kind: 'User', plural: 'users', namespaced: true, storage: 'etcd' },
  { kind: 'Team', plural: 'teams', namespaced: true, storage: 'etcd' },
  { kind: 'Invite', plural: 'invites', namespaced: true, storage: 'etcd' },
  { kind: 'IdentityMapping', plural: 'identitymappings', namespaced: true, storage: 'etcd' },
  { kind: 'AuthProvider', plural: 'authproviders', namespaced: true, storage: 'etcd' },
  { kind: 'Repository', plural: 'repositories', namespaced: true, storage: 'etcd' },
  { kind: 'SSHKey', plural: 'sshkeys', namespaced: true, storage: 'etcd' },
  { kind: 'RepositoryPermission', plural: 'repositorypermissions', namespaced: true, storage: 'etcd' },
  { kind: 'BranchProtection', plural: 'branchprotections', namespaced: true, storage: 'etcd' },
  { kind: 'RefPolicy', plural: 'refpolicies', namespaced: true, storage: 'etcd' },
  { kind: 'PolicyProfile', plural: 'policyprofiles', namespaced: true, storage: 'etcd' },
  { kind: 'PolicyTemplate', plural: 'policytemplates', namespaced: true, storage: 'etcd' },
  { kind: 'PolicyBinding', plural: 'policybindings', namespaced: true, storage: 'etcd' },
  { kind: 'PolicyExceptionRequest', plural: 'policyexceptionrequests', namespaced: true, storage: 'etcd' },
  { kind: 'WebhookSubscription', plural: 'webhooksubscriptions', namespaced: true, storage: 'etcd' },
  { kind: 'RunnerPool', plural: 'runnerpools', namespaced: true, storage: 'etcd' },
  { kind: 'PullRequest', plural: 'pullrequests', namespaced: true, storage: 'postgres' },
  { kind: 'Issue', plural: 'issues', namespaced: true, storage: 'postgres' },
  { kind: 'Review', plural: 'reviews', namespaced: true, storage: 'postgres' },
  { kind: 'Pipeline', plural: 'pipelines', namespaced: true, storage: 'postgres' },
  { kind: 'Job', plural: 'jobs', namespaced: true, storage: 'postgres' },
  { kind: 'WebhookDelivery', plural: 'webhookdeliveries', namespaced: true, storage: 'postgres' },
  { kind: 'KubeVelaApplication', plural: 'applications', group: KUBEVELA_API_GROUP, namespaced: true, storage: 'kubevela' },
  { kind: 'KubeVelaApplicationRevision', plural: 'applicationrevisions', group: KUBEVELA_API_GROUP, namespaced: true, storage: 'kubevela' },
  { kind: 'KubeVelaComponentDefinition', plural: 'componentdefinitions', group: KUBEVELA_API_GROUP, namespaced: true, namespace: process.env.KRADLE_KUBEVELA_NAMESPACE || 'vela-system', storage: 'kubevela' },
  { kind: 'KubeVelaWorkloadDefinition', plural: 'workloaddefinitions', group: KUBEVELA_API_GROUP, namespaced: true, namespace: process.env.KRADLE_KUBEVELA_NAMESPACE || 'vela-system', storage: 'kubevela' },
  { kind: 'KubeVelaTraitDefinition', plural: 'traitdefinitions', group: KUBEVELA_API_GROUP, namespaced: true, namespace: process.env.KRADLE_KUBEVELA_NAMESPACE || 'vela-system', storage: 'kubevela' },
  { kind: 'KubeVelaScopeDefinition', plural: 'scopedefinitions', group: KUBEVELA_API_GROUP, namespaced: true, namespace: process.env.KRADLE_KUBEVELA_NAMESPACE || 'vela-system', storage: 'kubevela' },
  { kind: 'KubeVelaPolicyDefinition', plural: 'policydefinitions', group: KUBEVELA_API_GROUP, namespaced: true, namespace: process.env.KRADLE_KUBEVELA_NAMESPACE || 'vela-system', storage: 'kubevela' },
  { kind: 'KubeVelaPolicy', plural: 'policies', group: KUBEVELA_API_GROUP, namespaced: true, storage: 'kubevela' },
  { kind: 'KubeVelaWorkflowStepDefinition', plural: 'workflowstepdefinitions', group: KUBEVELA_API_GROUP, namespaced: true, namespace: process.env.KRADLE_KUBEVELA_NAMESPACE || 'vela-system', storage: 'kubevela' },
  { kind: 'KubeVelaWorkflow', plural: 'workflows', group: KUBEVELA_API_GROUP, namespaced: true, storage: 'kubevela' },
  { kind: 'KubeVelaResourceTracker', plural: 'resourcetrackers', group: KUBEVELA_API_GROUP, namespaced: false, storage: 'kubevela' },
  { kind: 'View', plural: 'views', namespaced: true, storage: 'etcd' },
  { kind: 'Selector', plural: 'selectors', namespaced: true, storage: 'etcd' },
  // Agent orchestration CRDs (etcd-stored, kradle.a5c.ai group)
  { kind: 'AgentPersona', plural: 'agentpersonas', namespaced: true, storage: 'etcd' },
  { kind: 'AgentSoul', plural: 'agentsouls', namespaced: true, storage: 'etcd' },
  { kind: 'AgentAppearance', plural: 'agentappearances', namespaced: true, storage: 'etcd' },
  { kind: 'AgentVoiceProfile', plural: 'agentvoiceprofiles', namespaced: true, storage: 'etcd' },
  { kind: 'AgentDefinition', plural: 'agentdefinitions', namespaced: true, storage: 'etcd' },
  { kind: 'AgentStack', plural: 'agentstacks', namespaced: true, storage: 'etcd' },
  { kind: 'AgentSubagent', plural: 'agentsubagents', namespaced: true, storage: 'etcd' },
  { kind: 'AgentToolProfile', plural: 'agenttoolprofiles', namespaced: true, storage: 'etcd' },
  { kind: 'AgentMcpServer', plural: 'agentmcpservers', namespaced: true, storage: 'etcd' },
  { kind: 'AgentSkill', plural: 'agentskills', namespaced: true, storage: 'etcd' },
  { kind: 'AgentTriggerRule', plural: 'agenttriggerrules', namespaced: true, storage: 'etcd' },
  { kind: 'AgentContextLabel', plural: 'agentcontextlabels', namespaced: true, storage: 'etcd' },
  { kind: 'KradleWorkspacePolicy', plural: 'kradleworkspacepolicies', namespaced: true, storage: 'etcd' },
  { kind: 'AgentServiceAccount', plural: 'agentserviceaccounts', namespaced: true, storage: 'etcd' },
  { kind: 'AgentRoleBinding', plural: 'agentrolebindings', namespaced: true, storage: 'etcd' },
  { kind: 'AgentSecretGrant', plural: 'agentsecretgrants', namespaced: true, storage: 'etcd' },
  { kind: 'AgentConfigGrant', plural: 'agentconfiggrants', namespaced: true, storage: 'etcd' },
  { kind: 'AgentAdapter', plural: 'agentadapters', namespaced: true, storage: 'etcd' },
  { kind: 'AgentTransportBinding', plural: 'agenttransportbindings', namespaced: true, storage: 'etcd' },
  { kind: 'AgentProviderConfig', plural: 'agentproviderconfigs', namespaced: true, storage: 'etcd' },
  { kind: 'KradleProject', plural: 'kradleprojects', namespaced: true, storage: 'etcd' },
  { kind: 'AgentGatewayConfig', plural: 'agentgatewayconfigs', namespaced: true, storage: 'etcd' },
  { kind: 'AgentMemoryRepository', plural: 'agentmemoryrepositories', namespaced: true, storage: 'etcd' },
  { kind: 'AgentMemorySource', plural: 'agentmemorysources', namespaced: true, storage: 'etcd' },
  { kind: 'AgentMemoryOntology', plural: 'agentmemoryontologies', namespaced: true, storage: 'etcd' },
  { kind: 'AgentMemoryAssociation', plural: 'agentmemoryassociations', namespaced: true, storage: 'etcd' },
  // Aggregated agent resources (postgres-stored, accessed via snapshot but need discovery)
  { kind: 'AgentDispatchRun', plural: 'agentdispatchruns', namespaced: true, storage: 'postgres' },
  { kind: 'AgentDispatchAttempt', plural: 'agentdispatchattempts', namespaced: true, storage: 'postgres' },
  { kind: 'AgentSession', plural: 'agentsessions', namespaced: true, storage: 'postgres' },
  { kind: 'AgentContextBundle', plural: 'agentcontextbundles', namespaced: true, storage: 'postgres' },
  { kind: 'KradleArtifact', plural: 'kradleartifacts', namespaced: true, storage: 'postgres' },
  { kind: 'AgentApproval', plural: 'agentapprovals', namespaced: true, storage: 'postgres' },
  { kind: 'KradleWorkspace', plural: 'kradleworkspaces', namespaced: true, storage: 'postgres' },
  { kind: 'AgentTriggerExecution', plural: 'agenttriggerexecutions', namespaced: true, storage: 'postgres' },
  { kind: 'KradleWorkspaceRuntime', plural: 'kradleworkspaceruntimes', namespaced: true, storage: 'postgres' },
  { kind: 'AgentSessionTranscript', plural: 'agentsessiontranscripts', namespaced: true, storage: 'postgres' },
  // External backend resources (etcd-stored)
  { kind: 'ExternalBackendProvider', plural: 'externalbackendproviders', namespaced: true, storage: 'etcd' },
  { kind: 'ExternalBackendBinding', plural: 'externalbackendbindings', namespaced: true, storage: 'etcd' },
  { kind: 'ExternalBackendSyncPolicy', plural: 'externalbackendsyncpolicies', namespaced: true, storage: 'etcd' },
  // Artifact registry resources (etcd-stored)
  { kind: 'ArtifactRegistry', plural: 'artifactregistries', namespaced: true, storage: 'etcd' },
  { kind: 'ArtifactFeed', plural: 'artifactfeeds', namespaced: true, storage: 'etcd' },
  { kind: 'ArtifactAccessPolicy', plural: 'artifactaccesspolicies', namespaced: true, storage: 'etcd' },
  // Artifact registry resources (postgres-stored)
  { kind: 'ArtifactVersion', plural: 'artifactversions', namespaced: true, storage: 'postgres' },
  { kind: 'ArtifactDownload', plural: 'artifactdownloads', namespaced: true, storage: 'postgres' },
  // Inference resources (etcd-stored, kradle.a5c.ai group)
  { kind: 'KradleInferenceService', plural: 'kradleinferenceservices', namespaced: true, storage: 'etcd' },
  { kind: 'KradleServingRuntime', plural: 'kradleservingruntimes', namespaced: true, storage: 'etcd' },
  // Jitsi resources
  { kind: 'JitsiMeetProvider', plural: 'jitsimeetproviders', namespaced: true, storage: 'etcd' },
  { kind: 'JitsiMeetingTemplate', plural: 'jitsimeetingtemplates', namespaced: true, storage: 'etcd' },
  { kind: 'JitsiMeeting', plural: 'jitsimeetings', namespaced: true, storage: 'postgres' },
  { kind: 'JitsiRecording', plural: 'jitsirecordings', namespaced: true, storage: 'postgres' },
  // Core Kubernetes resources (group: '' — no API group prefix for kubectl).
  // These are excluded from snapshot discovery (storage: 'core') but are
  // available for list/get/delete via findResourceDefinition.
  { kind: 'Secret', plural: 'secrets', group: '', namespaced: true, storage: 'core' },
  { kind: 'ConfigMap', plural: 'configmaps', group: '', namespaced: true, storage: 'core' }
];

export const KYVERNO_RESOURCES = [
  { kind: 'KyvernoPolicy', plural: 'policies', group: KYVERNO_API_GROUP, namespaced: true, storage: 'kyverno', namespace: process.env.KRADLE_KYVERNO_POLICY_NAMESPACE || process.env.KRADLE_NAMESPACE || 'kradle-system' },
  { kind: 'KyvernoClusterPolicy', plural: 'clusterpolicies', group: KYVERNO_API_GROUP, namespaced: false, storage: 'kyverno' },
  { kind: 'KyvernoValidatingPolicy', plural: 'validatingpolicies', group: KYVERNO_POLICIES_API_GROUP, namespaced: false, storage: 'kyverno' },
  { kind: 'KyvernoMutatingPolicy', plural: 'mutatingpolicies', group: KYVERNO_POLICIES_API_GROUP, namespaced: false, storage: 'kyverno' },
  { kind: 'KyvernoGeneratingPolicy', plural: 'generatingpolicies', group: KYVERNO_POLICIES_API_GROUP, namespaced: false, storage: 'kyverno' },
  { kind: 'KyvernoDeletingPolicy', plural: 'deletingpolicies', group: KYVERNO_POLICIES_API_GROUP, namespaced: false, storage: 'kyverno' },
  { kind: 'KyvernoImageValidatingPolicy', plural: 'imagevalidatingpolicies', group: KYVERNO_POLICIES_API_GROUP, namespaced: false, storage: 'kyverno' },
  { kind: 'KyvernoPolicyException', plural: 'policyexceptions', group: KYVERNO_POLICIES_API_GROUP, namespaced: true, storage: 'kyverno', namespace: process.env.KRADLE_KYVERNO_POLICY_NAMESPACE || process.env.KRADLE_NAMESPACE || 'kradle-system' },
  { kind: 'PolicyReport', plural: 'policyreports', group: POLICY_REPORT_API_GROUP, namespaced: true, storage: 'kyverno-reports' },
  { kind: 'ClusterPolicyReport', plural: 'clusterpolicyreports', group: POLICY_REPORT_API_GROUP, namespaced: false, storage: 'kyverno-reports' }
];

const KYVERNO_DISCOVERY_GROUPS = new Set([KYVERNO_API_GROUP, KYVERNO_POLICIES_API_GROUP, POLICY_REPORT_API_GROUP]);

export function createKubernetesResourceClient(options = {}) {
  const kubectl = options.kubectl || process.env.KRADLE_KUBECTL || 'kubectl';
  const namespace = options.namespace || process.env.KRADLE_NAMESPACE || 'kradle-system';
  const timeoutMs = Number(options.timeoutMs || process.env.KRADLE_KUBECTL_TIMEOUT_MS || 3_000);
  const env = { ...process.env, ...(options.env || {}) };

  return {
    ...KUBERNETES_RESOURCE_CLIENT_BOUNDARY,
    namespace,
    kubectl,
    resourceDefinitions: KRADLE_RESOURCES,
    async snapshot() {
      return getControllerSnapshot({ kubectl, namespace, timeoutMs, env });
    },
    async listResource(kindOrPlural) {
      return listResource(kindOrPlural, { kubectl, namespace, timeoutMs, env });
    },
    async getResource(kindOrPlural, name) {
      return getResource(kindOrPlural, name, { kubectl, namespace, timeoutMs, env });
    },
    async applyResource(resource) {
      return applyResource(resource, { kubectl, namespace, timeoutMs, env });
    },
    async deleteResource(kindOrPlural, name) {
      return deleteResource(kindOrPlural, name, { kubectl, namespace, timeoutMs, env });
    },
    async createRepository(input) {
      return applyResource(repositoryManifest(input, namespace), { kubectl, namespace, timeoutMs, env });
    },
    async createOrganization(input) {
      return createOrganization(input, { kubectl, namespace, timeoutMs, env });
    },
    watchResource(resourcePath, handlers = {}) {
      return watchResource(resourcePath, { kubectl, namespace, env }, handlers);
    }
  };
}

export function createKubernetesController(options = {}) {
  return createKubernetesResourceClient(options);
}
export function createKradleKubernetesReconciler(options = {}) {
  const namespace = options.namespace || process.env.KRADLE_NAMESPACE || 'kradle-system';
  return {
    ...KRADLE_KUBERNETES_RECONCILER_BOUNDARY,
    namespace,
    describeReconciliationScope() {
      return {
        ...KRADLE_KUBERNETES_RECONCILER_BOUNDARY,
        namespace,
        resources: KRADLE_RESOURCES.map(({ kind, plural, storage }) => ({ kind, plural, storage }))
      };
    },
    reconcileRepository(resource = {}) {
      const name = resource.metadata?.name || 'unknown-repository';
      return {
        kind: 'RepositoryReconciliationPlan',
        namespace: resource.metadata?.namespace || namespace,
        name,
        desiredStatus: {
          phase: resource.status?.phase || 'Reconciling',
          gitBackend: resource.status?.gitBackend || 'gitea',
          conditions: [
            { type: 'ResourceObserved', status: 'True', reason: 'KubernetesResourceWatch' },
            { type: 'DataPlaneSyncPlanned', status: 'True', reason: 'RepositoryBackendProjection' }
          ]
        },
        syncIntents: [
          { target: 'git-data-plane', action: 'ensure-gitea-repository', repository: name },
          { target: 'policy-controller', action: 'compile-ref-policy', repository: name }
        ]
      };
    },
    reconcileIdentityAccess(resource = {}, context = {}) {
      return identityAccessReconciliationPlan(resource, { namespace, ...context });
    },
    reconcileIdentityAccessResources(resources = {}, context = {}) {
      const items = ['User', 'Team', 'Invite', 'IdentityMapping', 'RepositoryPermission', 'SSHKey']
        .flatMap((kind) => (resources[kind] || []).map((resource) => identityAccessReconciliationPlan(resource, { namespace, ...context })));
      return {
        kind: 'IdentityAccessReconciliationPlan',
        namespace,
        desiredStatuses: items.map(({ kind, name, desiredStatus }) => ({ kind, name, phase: desiredStatus.phase, conditions: desiredStatus.conditions })),
        syncIntents: items.flatMap((item) => item.syncIntents),
        counts: items.reduce((counts, item) => ({ ...counts, [item.kind]: (counts[item.kind] || 0) + 1 }), {})
      };
    }
  };
}
export function identityAccessReconciliationPlan(resource = {}, options = {}) {
  const kind = resource.kind || 'Unknown';
  const name = resource.metadata?.name || `unknown-${kind.toLowerCase()}`;
  const namespace = resource.metadata?.namespace || options.namespace || process.env.KRADLE_NAMESPACE || 'kradle-system';
  const spec = resource.spec || {};
  const baseCondition = { type: `${kind}Observed`, status: 'True', reason: 'KradleResourceWatch' };
  const base = {
    kind,
    namespace,
    name,
    desiredStatus: { phase: resource.status?.phase || 'Reconciling', conditions: [baseCondition] },
    syncIntents: []
  };
  if (kind === 'User') {
    const disabled = Boolean(spec.disabled);
    return {
      ...base,
      desiredStatus: {
        phase: disabled ? 'Disabled' : 'Active',
        repositoryIdentity: spec.username || name,
        groups: ['kradle:users', spec.admin ? 'kradle:platform-engineers' : 'kradle:developers', ...(spec.teams || []).map((team) => `team:${team}`)],
        conditions: [baseCondition, { type: 'WorkspaceIdentityProjected', status: 'True', reason: disabled ? 'UserDisabled' : 'UserActive' }, { type: 'RepositoryIdentityProjected', status: disabled ? 'False' : 'True', reason: disabled ? 'RepositoryAccessSuspended' : 'RepositoryAccountPlanned' }]
      },
      syncIntents: [
        { target: 'workspace-identity', action: disabled ? 'suspend-user' : 'ensure-user', user: name },
        { target: 'repository-access', action: disabled ? 'suspend-repository-user' : 'ensure-repository-user', user: name, repositoryIdentity: spec.username || name }
      ]
    };
  }
  if (kind === 'Team') {
    return {
      ...base,
      desiredStatus: { phase: 'Active', memberCount: (spec.members || []).length, maintainerCount: (spec.maintainers || []).length, conditions: [baseCondition, { type: 'TeamMembershipProjected', status: 'True', reason: 'MembersAndMaintainersPlanned' }, { type: 'RepositoryGrantsProjected', status: 'True', reason: 'TeamGrantProjectionPlanned' }] },
      syncIntents: [
        { target: 'workspace-identity', action: 'sync-team-membership', team: name, members: spec.members || [], maintainers: spec.maintainers || [] },
        ...(spec.repositoryGrants || []).map((grant) => ({ target: 'repository-access', action: 'sync-team-repository-grant', team: name, repository: grant.repository, permission: grant.permission }))
      ]
    };
  }
  if (kind === 'Invite') {
    const phase = resource.status?.phase || 'Pending';
    return {
      ...base,
      desiredStatus: { phase, expiresAt: spec.expiresAt || '', conditions: [baseCondition, { type: 'InviteLifecycleTracked', status: 'True', reason: phase === 'Pending' ? 'InvitePending' : `Invite${phase}` }] },
      syncIntents: [{ target: 'workspace-identity', action: phase === 'Pending' ? 'send-invite' : 'close-invite', invite: name, email: spec.email, phase }]
    };
  }
  if (kind === 'IdentityMapping') {
    const complete = Boolean(spec.user && spec.provider && spec.subject);
    return {
      ...base,
      desiredStatus: { phase: complete ? 'Synced' : 'Pending', workspaceIdentity: spec.workspaceIdentity?.name || spec.subject || '', repositoryIdentity: spec.repositoryIdentity?.username || spec.user || '', conditions: [baseCondition, { type: 'WorkspaceIdentityProjected', status: complete ? 'True' : 'False', reason: complete ? 'SubjectLinked' : 'MissingSubject' }, { type: 'RepositoryIdentityProjected', status: complete ? 'True' : 'False', reason: complete ? 'RepositoryAccountLinked' : 'MissingRepositoryIdentity' }] },
      syncIntents: [
        { target: 'workspace-identity', action: 'link-identity', user: spec.user, provider: spec.provider, subject: spec.subject },
        { target: 'repository-access', action: 'link-repository-identity', user: spec.user, repositoryIdentity: spec.repositoryIdentity?.username || spec.user }
      ]
    };
  }
  if (kind === 'RepositoryPermission') {
    const revoked = Boolean(spec.revoked || resource.status?.phase === 'Revoked');
    return {
      ...base,
      desiredStatus: { phase: revoked ? 'Revoked' : 'Synced', repository: spec.repository, subject: spec.subject, permission: spec.permission || 'read', conditions: [baseCondition, { type: 'RepositoryPermissionProjected', status: revoked ? 'False' : 'True', reason: revoked ? 'GrantRevoked' : 'GrantSynced' }] },
      syncIntents: [{ target: 'repository-access', action: revoked ? 'revoke-repository-permission' : 'sync-repository-permission', repository: spec.repository, subject: spec.subject, subjectKind: spec.subjectKind || 'user', permission: spec.permission || 'read' }]
    };
  }
  if (kind === 'SSHKey') {
    const fingerprint = spec.key ? `sha256:${createHash('sha256').update(spec.key).digest('base64url').slice(0, 32)}` : '';
    const revoked = Boolean(spec.revoked || resource.status?.phase === 'Revoked');
    return {
      ...base,
      desiredStatus: { phase: revoked ? 'Revoked' : 'Synced', scope: spec.scope, fingerprint, conditions: [baseCondition, { type: 'SSHKeyProjected', status: revoked ? 'False' : 'True', reason: revoked ? 'KeyRevoked' : 'KeySynced' }] },
      syncIntents: [{ target: 'repository-access', action: revoked ? 'revoke-ssh-key' : 'sync-ssh-key', name, scope: spec.scope, owner: spec.owner || spec.user, fingerprint }]
    };
  }
  return base;
}


export function orgNamespaceName(org) {
  const slug = normalizeOrgSlug(org);
  if (!slug) throw new Error('organization is required');
  return `kradle-org-${slug}`;
}

export function normalizeOrgSlug(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 63);
}

export function resolveResourceOrg(resource = {}, options = {}) {
  const organizationRef = resource.spec?.organizationRef || resource.metadata?.labels?.[KRADLE_ORG_LABEL] || options.organization || options.org;
  const org = normalizeOrgSlug(organizationRef);
  if (!org && resource.kind !== 'Organization' && resource.kind !== 'OrgNamespaceBinding') throw new Error(`${resource.kind || 'Resource'} requires spec.organizationRef`);
  const namespaceName = resource.kind === 'Organization'
    ? (resource.metadata?.namespace || options.platformNamespace || KRADLE_PLATFORM_NAMESPACE)
    : (resource.spec?.namespaceName || resource.spec?.namespace || resource.metadata?.labels?.[KRADLE_ORG_NAMESPACE_LABEL] || (org ? orgNamespaceName(org) : resource.metadata?.namespace || options.platformNamespace || KRADLE_PLATFORM_NAMESPACE));
  return { org, namespace: namespaceName };
}

export function withOrgScope(resource, options = {}) {
  if (!resource || typeof resource !== 'object') throw new Error('resource object is required');
  const platformNamespace = options.platformNamespace || options.namespace || KRADLE_PLATFORM_NAMESPACE;
  if (resource.kind === 'Organization') {
    const org = normalizeOrgSlug(resource.spec?.slug || resource.metadata?.name);
    if (!org) throw new Error('Organization requires metadata.name or spec.slug');
    const orgNamespace = resource.spec?.namespaceName || orgNamespaceName(org);
    return {
      apiVersion: resource.apiVersion || `${KRADLE_API_GROUP}/${KRADLE_API_VERSION}`,
      ...resource,
      metadata: { ...(resource.metadata || {}), name: org, namespace: resource.metadata?.namespace || platformNamespace, labels: { ...(resource.metadata?.labels || {}), [KRADLE_ORG_LABEL]: org, [KRADLE_ORG_NAMESPACE_LABEL]: orgNamespace } },
      spec: { ...(resource.spec || {}), slug: org, namespaceName: orgNamespace }
    };
  }
  if (resource.kind === 'OrgNamespaceBinding') {
    const org = normalizeOrgSlug(resource.spec?.organizationRef || resource.metadata?.labels?.[KRADLE_ORG_LABEL] || resource.metadata?.name);
    if (!org) throw new Error('OrgNamespaceBinding requires spec.organizationRef');
    const orgNamespace = resource.spec?.namespace || orgNamespaceName(org);
    return {
      apiVersion: resource.apiVersion || `${KRADLE_API_GROUP}/${KRADLE_API_VERSION}`,
      ...resource,
      metadata: { ...(resource.metadata || {}), name: resource.metadata?.name || org, namespace: resource.metadata?.namespace || platformNamespace, labels: { ...(resource.metadata?.labels || {}), [KRADLE_ORG_LABEL]: org, [KRADLE_ORG_NAMESPACE_LABEL]: orgNamespace } },
      spec: { createNamespace: true, ...(resource.spec || {}), organizationRef: org, namespace: orgNamespace, labels: { ...(resource.spec?.labels || {}), [KRADLE_ORG_LABEL]: org } }
    };
  }
  const { org, namespace } = resolveResourceOrg(resource, options);
  if (resource.metadata?.namespace && resource.metadata.namespace !== namespace) throw new Error(`${resource.kind} namespace ${resource.metadata.namespace} does not match organization ${org} namespace ${namespace}`);
  if (resource.metadata?.labels?.[KRADLE_ORG_LABEL] && resource.metadata.labels[KRADLE_ORG_LABEL] !== org) throw new Error(`${resource.kind} org label does not match spec.organizationRef`);
  return {
    apiVersion: resource.apiVersion || `${KRADLE_API_GROUP}/${KRADLE_API_VERSION}`,
    ...resource,
    metadata: { ...(resource.metadata || {}), namespace, labels: { ...(resource.metadata?.labels || {}), [KRADLE_ORG_LABEL]: org, [KRADLE_ORG_NAMESPACE_LABEL]: namespace } },
    spec: { ...(resource.spec || {}), organizationRef: org }
  };
}

export async function getControllerSnapshot(options = {}) {
  const kubectl = options.kubectl || process.env.KRADLE_KUBECTL || 'kubectl';
  const namespace = options.namespace || process.env.KRADLE_NAMESPACE || 'kradle-system';
  const timeoutMs = Number(options.timeoutMs || process.env.KRADLE_KUBECTL_TIMEOUT_MS || 3_000);
  const env = { ...process.env, ...(options.env || {}) };
  const correlationId = randomUUID();
  const contextResult = currentContextResult({ kubectl, timeoutMs, env });
  const versionResult = runKubectl(['version', '--client=true', '-o', 'json'], { kubectl, timeoutMs, env, allowFailure: true });
  if (!contextResult.ok || !versionResult.ok) {
    const failed = [contextResult, versionResult].filter((result) => !result.ok);
    return {
      source: 'kubernetes',
      mode: 'kubernetes-api',
      namespace,
      generatedAt: new Date().toISOString(),
      correlationId,
      kubectl: {
        binary: kubectl,
        context: contextResult.ok ? contextResult.stdout.trim() : null,
        clientVersion: versionResult.ok ? safeJson(versionResult.stdout)?.clientVersion?.gitVersion || null : null,
        available: false,
        errors: failed.map((result) => commandFailure(result)).filter(Boolean)
      },
      apiService: null,
      crds: [],
      resources: Object.fromEntries(KRADLE_RESOURCES.filter((d) => d.storage !== 'core').map((definition) => [definition.kind, []])),
      kyverno: emptyKyvernoDiscovery(namespace, env),
      events: [],
      permissions: [],
      storage: storageBoundaries(),
      commands: controllerCommands(namespace)
    };
  }
  const apiServiceResult = runKubectl(['get', 'apiservice', KRADLE_API_VERSIONED_GROUP, '-o', 'json'], { kubectl, timeoutMs, env, allowFailure: true });
  const crdResult = runKubectl(['get', 'crd', '-o', 'json'], { kubectl, timeoutMs, env, allowFailure: true });
  if (!apiServiceResult.ok && !crdResult.ok) {
    const failed = [apiServiceResult, crdResult].filter((result) => !result.ok);
    return {
      source: 'kubernetes',
      mode: 'kubernetes-api',
      namespace,
      generatedAt: new Date().toISOString(),
      correlationId,
      kubectl: {
        binary: kubectl,
        context: contextResult.stdout.trim(),
        clientVersion: safeJson(versionResult.stdout)?.clientVersion?.gitVersion || null,
        available: true,
        errors: failed.map((result) => commandFailure(result)).filter(Boolean)
      },
      apiService: null,
      crds: [],
      resources: Object.fromEntries(KRADLE_RESOURCES.filter((d) => d.storage !== 'core').map((definition) => [definition.kind, []])),
      kyverno: emptyKyvernoDiscovery(namespace, env),
      events: [],
      permissions: [],
      storage: storageBoundaries(),
      commands: controllerCommands(namespace)
    };
  }
  const discoveredCrds = crdResult.ok ? parseKubernetesList(crdResult.stdout).items.filter((crd) => [KRADLE_API_GROUP, KUBEVELA_API_GROUP].includes(crd.spec?.group) || KYVERNO_DISCOVERY_GROUPS.has(crd.spec?.group)) : [];
  const discoveredPluralSet = new Set(discoveredCrds.map((crd) => `${crd.spec?.group || KRADLE_API_GROUP}/${crd.spec?.names?.plural}`).filter(Boolean));
  if (!apiServiceResult.ok && discoveredCrds.length === 0) {
    return {
      source: 'kubernetes',
      mode: 'kubernetes-api',
      namespace,
      generatedAt: new Date().toISOString(),
      correlationId,
      kubectl: {
        binary: kubectl,
        context: contextResult.stdout.trim(),
        clientVersion: safeJson(versionResult.stdout)?.clientVersion?.gitVersion || null,
        available: true,
        errors: [commandFailure(apiServiceResult)].filter(Boolean)
      },
      apiService: null,
      crds: [],
      resources: Object.fromEntries(KRADLE_RESOURCES.filter((d) => d.storage !== 'core').map((definition) => [definition.kind, []])),
      kyverno: emptyKyvernoDiscovery(namespace, env),
      events: [],
      permissions: [],
      storage: storageBoundaries(),
      commands: controllerCommands(namespace)
    };
  }
  const kyverno = discoverKyverno({ kubectl, namespace, timeoutMs, env, discoveredPluralSet });
  // Exclude core K8s resources (Secret, ConfigMap) from snapshot — they are
  // accessed on-demand via listResource, not loaded into the full snapshot.
  const snapshotResources = KRADLE_RESOURCES.filter((d) => d.storage !== 'core');
  const resources = Object.fromEntries(snapshotResources.map((definition) => [definition.kind, []]));
  const listResults = [];
  const platformScopedDefinitions = snapshotResources.filter((definition) => definition.platformScoped);
  const orgScopedDefinitions = snapshotResources.filter((definition) => !definition.platformScoped);

  for (const definition of platformScopedDefinitions) {
    if (!shouldListSnapshotDefinition(definition, discoveredPluralSet)) continue;
    const resourceNamespace = definition.namespace || namespace;
    const result = runKubectl(['get', apiResourceName(definition), ...namespaceArgs(definition, resourceNamespace), '-o', 'json', '--ignore-not-found'], { kubectl, timeoutMs, env, allowFailure: true });
    listResults.push({ definition, result });
    resources[definition.kind] = result.ok ? parseKubernetesList(result.stdout).items : [];
  }

  const orgNamespaces = organizationNamespaces(resources.Organization, resources.OrgNamespaceBinding, namespace);
  for (const definition of orgScopedDefinitions) {
    if (!shouldListSnapshotDefinition(definition, discoveredPluralSet)) continue;
    const namespaces = definition.namespaced === false ? [null] : [definition.namespace || null].filter(Boolean).concat(definition.namespace ? [] : orgNamespaces);
    resources[definition.kind] = namespaces.flatMap((resourceNamespace) => {
      const effectiveNamespace = resourceNamespace || namespace;
      const result = runKubectl(['get', apiResourceName(definition), ...namespaceArgs(definition, effectiveNamespace), '-o', 'json', '--ignore-not-found'], { kubectl, timeoutMs, env, allowFailure: true });
      listResults.push({ definition, result });
      return result.ok ? parseKubernetesList(result.stdout).items : [];
    });
  }

  const eventsResult = runKubectl(['get', 'events', '-n', namespace, '-o', 'json', '--ignore-not-found'], { kubectl, timeoutMs, env, allowFailure: true });
  const permissions = await Promise.all(snapshotResources.filter((definition) => discoveredPluralSet.has(`${definition.group || KRADLE_API_GROUP}/${definition.plural}`)).map(async (definition) => ({
    kind: definition.kind,
    plural: definition.plural,
    verbs: Object.fromEntries(['get', 'list', 'watch', 'create', 'update', 'patch', 'delete'].map((verb) => [verb, canI(verb, definition, { kubectl, namespace: definition.namespace || namespace, timeoutMs, env })]))
  })));
  const unavailable = [contextResult, versionResult, ...listResults.map((item) => item.result)].filter((result) => !result.ok);

  return {
    source: 'kubernetes',
    mode: 'kubernetes-api',
    namespace,
    generatedAt: new Date().toISOString(),
    correlationId,
    kubectl: {
      binary: kubectl,
      context: contextResult.ok ? contextResult.stdout.trim() : null,
      clientVersion: versionResult.ok ? safeJson(versionResult.stdout)?.clientVersion?.gitVersion || null : null,
      available: contextResult.ok && versionResult.ok,
      errors: unavailable.map((result) => commandFailure(result)).filter(Boolean)
    },
    apiService: apiServiceResult.ok ? safeJson(apiServiceResult.stdout) : null,
    crds: discoveredCrds,
    resources,
    kyverno,
    events: eventsResult.ok ? parseKubernetesList(eventsResult.stdout).items : [],
    permissions,
    storage: storageBoundaries(),
    commands: controllerCommands(namespace)
  };
}

export async function listResource(kindOrPlural, options = {}) {
  const namespace = options.namespace || process.env.KRADLE_NAMESPACE || 'kradle-system';
  const definition = findResourceDefinition(kindOrPlural);
  const resourceNamespace = definition.namespace || namespace;
  const args = ['get', apiResourceName(definition), ...namespaceArgs(definition, resourceNamespace), '-o', 'json', '--ignore-not-found'];
  const result = runKubectl(args, {
    kubectl: options.kubectl || process.env.KRADLE_KUBECTL || 'kubectl',
    timeoutMs: Number(options.timeoutMs || process.env.KRADLE_KUBECTL_TIMEOUT_MS || 3_000),
    env: { ...process.env, ...(options.env || {}) },
    allowFailure: false
  });
  return { operation: 'list', kind: definition.kind, command: `kubectl ${args.join(' ')}`, items: parseKubernetesList(result.stdout).items, stderr: result.stderr.trim() };
}

export async function getResource(kindOrPlural, name, options = {}) {
  if (!name) throw new Error('resource name is required');
  const namespace = options.namespace || process.env.KRADLE_NAMESPACE || 'kradle-system';
  const definition = findResourceDefinition(kindOrPlural);
  const resourceNamespace = definition.namespace || namespace;
  const args = ['get', apiResourceName(definition), name, ...namespaceArgs(definition, resourceNamespace), '-o', 'json'];
  const result = runKubectl(args, {
    kubectl: options.kubectl || process.env.KRADLE_KUBECTL || 'kubectl',
    timeoutMs: Number(options.timeoutMs || process.env.KRADLE_KUBECTL_TIMEOUT_MS || 3_000),
    env: { ...process.env, ...(options.env || {}) },
    allowFailure: false
  });
  return { operation: 'get', kind: definition.kind, name, command: `kubectl ${args.join(' ')}`, resource: safeJson(result.stdout), stderr: result.stderr.trim() };
}
export async function applyResource(resource, options = {}) {
  if (!resource || typeof resource !== 'object') throw new Error('resource object is required');
  if (!resource.kind) throw new Error('resource.kind is required');
  const namespace = options.namespace || process.env.KRADLE_NAMESPACE || 'kradle-system';
  const manifest = withOrgScope(resource, { namespace });
  const kubectlBin = options.kubectl || process.env.KRADLE_KUBECTL || 'kubectl';
  const timeoutMs = Number(options.timeoutMs || process.env.KRADLE_KUBECTL_TIMEOUT_MS || 3_000);
  const env = { ...process.env, ...(options.env || {}) };
  const targetNs = manifest.metadata?.namespace;
  if (targetNs) {
    ensureNamespace(targetNs, { kubectl: kubectlBin, timeoutMs, env });
  }
  const result = runKubectl(['apply', '-f', '-', '-o', 'json'], {
    kubectl: kubectlBin,
    timeoutMs,
    env,
    input: JSON.stringify(manifest),
    allowFailure: false
  });
  return { operation: 'apply', command: 'kubectl apply -f -', resource: safeJson(result.stdout) || manifest, stderr: result.stderr.trim() };
}

function ensureNamespace(name, options) {
  const check = runKubectl(['get', 'namespace', name], { ...options, allowFailure: true });
  if (check.ok) return;
  runKubectl(['create', 'namespace', name], { ...options, allowFailure: true });
}

export async function deleteResource(kindOrPlural, name, options = {}) {
  if (!name) throw new Error('resource name is required');
  const namespace = options.namespace || process.env.KRADLE_NAMESPACE || 'kradle-system';
  const definition = findResourceDefinition(kindOrPlural);
  const resourceNamespace = definition.namespace || namespace;
  const args = ['delete', apiResourceName(definition), name, ...namespaceArgs(definition, resourceNamespace), '-o', 'json', '--ignore-not-found'];
  const result = runKubectl(args, {
    kubectl: options.kubectl || process.env.KRADLE_KUBECTL || 'kubectl',
    timeoutMs: Number(options.timeoutMs || process.env.KRADLE_KUBECTL_TIMEOUT_MS || 3_000),
    env: { ...process.env, ...(options.env || {}) },
    allowFailure: false
  });
  return { operation: 'delete', command: `kubectl ${args.join(' ')}`, resource: safeJson(result.stdout), stdout: result.stdout.trim(), stderr: result.stderr.trim() };
}

export async function createOrganization(input = {}, options = {}) {
  const namespace = options.namespace || process.env.KRADLE_NAMESPACE || KRADLE_PLATFORM_NAMESPACE;
  const org = normalizeOrgSlug(input.slug || input.name || input.metadata?.name || input.spec?.slug);
  if (!org) throw new Error('organization name is required');
  const orgNamespace = input.namespaceName || input.namespace || input.spec?.namespaceName || orgNamespaceName(org);
  const displayName = input.displayName || input.fullName || input.spec?.displayName || org;
  const namespaceManifest = {
    apiVersion: 'v1',
    kind: 'Namespace',
    metadata: { name: orgNamespace, labels: { [KRADLE_ORG_LABEL]: org, [KRADLE_ORG_NAMESPACE_LABEL]: orgNamespace, ...(input.labels || {}) } }
  };
  const organization = withOrgScope({
    apiVersion: `${KRADLE_API_GROUP}/${KRADLE_API_VERSION}`,
    kind: 'Organization',
    metadata: { name: org },
    spec: { displayName, slug: org, namespaceName: orgNamespace, ...(input.spec || {}) }
  }, { namespace });
  const binding = withOrgScope({
    apiVersion: `${KRADLE_API_GROUP}/${KRADLE_API_VERSION}`,
    kind: 'OrgNamespaceBinding',
    metadata: { name: org },
    spec: { organizationRef: org, namespace: orgNamespace, createNamespace: true, labels: input.labels || {} }
  }, { namespace });
  const applyOptions = {
    kubectl: options.kubectl || process.env.KRADLE_KUBECTL || 'kubectl',
    timeoutMs: Number(options.timeoutMs || process.env.KRADLE_KUBECTL_TIMEOUT_MS || 3_000),
    env: { ...process.env, ...(options.env || {}) },
    allowFailure: false
  };
  const namespaceResult = runKubectl(['apply', '-f', '-', '-o', 'json'], { ...applyOptions, input: JSON.stringify(namespaceManifest) });
  const organizationResult = await applyResource(organization, { ...applyOptions, namespace });
  const bindingResult = await applyResource(binding, { ...applyOptions, namespace });
  return {
    operation: 'create-organization',
    organization: organizationResult.resource,
    namespace: safeJson(namespaceResult.stdout) || namespaceManifest,
    binding: bindingResult.resource,
    command: 'kubectl apply -f -'
  };
}

export function repositoryManifest(input = {}, namespace = process.env.KRADLE_NAMESPACE || 'kradle-system') {
  const name = String(input.name || input.metadata?.name || '').trim();
  const organizationRef = normalizeOrgSlug(input.organizationRef || input.org || input.spec?.organizationRef || input.metadata?.labels?.[KRADLE_ORG_LABEL]);
  if (!name) throw new Error('repository name is required');
  if (!organizationRef) throw new Error('repository organization is required');
  return withOrgScope({
    apiVersion: `${KRADLE_API_GROUP}/${KRADLE_API_VERSION}`,
    kind: 'Repository',
    metadata: { name, labels: input.labels || {} },
    spec: {
      organizationRef,
      visibility: input.visibility || input.spec?.visibility || 'internal',
      defaultBranch: input.defaultBranch || input.spec?.defaultBranch || 'main'
    }
  }, { namespace });
}

export function watchResource(resourcePath = 'orgs/default/repositories', options = {}, handlers = {}) {
  const namespace = options.namespace || process.env.KRADLE_NAMESPACE || 'kradle-system';
  const kubectl = options.kubectl || process.env.KRADLE_KUBECTL || 'kubectl';
  const parts = String(resourcePath || '').split('/').filter(Boolean);
  if (parts[0] !== 'orgs' || !parts[1] || !parts[2]) throw new Error('watch requires /api/watch/orgs/{org}/{resource}');
  const org = normalizeOrgSlug(parts[1]);
  const [pluralOrKind, name] = parts.slice(2);
  const definition = findResourceDefinition(pluralOrKind || 'repositories');
  const resourceNamespace = definition.namespace || (definition.platformScoped ? namespace : orgNamespaceName(org));
  const args = ['get', apiResourceName(definition), ...(name ? [name] : []), ...namespaceArgs(definition, resourceNamespace), '--watch', '-o', 'json'];
  const env = { ...process.env, ...(options.env || {}) };
  const child = spawn(kubectl, kubectlInvocationArgs(args, env), { env, windowsHide: true });
  child.stdout.on('data', (chunk) => handlers.stdout?.(chunk));
  child.stderr.on('data', (chunk) => handlers.stderr?.(chunk));
  child.on('error', (error) => handlers.error?.(error));
  child.on('close', (code) => handlers.close?.(code));
  return { child, command: `kubectl ${args.join(' ')}` };
}

export function findResourceDefinition(kindOrPlural) {
  const normalized = String(kindOrPlural || '').toLowerCase();
  const definition = KRADLE_RESOURCES.find((item) => item.kind.toLowerCase() === normalized || item.plural.toLowerCase() === normalized);
  if (!definition) throw new Error(`Unsupported Kradle resource ${kindOrPlural}`);
  return definition;
}

export function apiResourceName(definition) {
  // Core K8s resources (Secret, ConfigMap) have group: '' — use bare plural name
  const group = definition.group === '' ? '' : (definition.group || KRADLE_API_GROUP);
  return group ? `${definition.plural}.${group}` : definition.plural;
}

export function withKradleDefaults(resource, namespace) {
  if (resource?.kind && resource.kind !== 'Organization' && resource.kind !== 'OrgNamespaceBinding') return withOrgScope(resource, { namespace });
  return {
    apiVersion: resource.apiVersion || `${KRADLE_API_GROUP}/${KRADLE_API_VERSION}`,
    ...resource,
    metadata: {
      ...(resource.metadata || {}),
      namespace: resource.metadata?.namespace || namespace
    }
  };
}

function canI(verb, definition, options) {
  const result = runKubectl(['auth', 'can-i', verb, apiResourceName(definition), ...namespaceArgs(definition, options.namespace)], { ...options, allowFailure: true });
  return result.ok && result.stdout.trim().toLowerCase() === 'yes';
}

export function runKubectl(args, options = {}) {
  const env = options.env || process.env;
  const result = spawnSync(options.kubectl || 'kubectl', kubectlInvocationArgs(args, env), {
    input: options.input,
    encoding: 'utf8',
    timeout: options.timeoutMs || 3_000,
    env,
    windowsHide: true,
    maxBuffer: Number(env.KRADLE_KUBECTL_MAX_BUFFER_BYTES || 32 * 1024 * 1024)
  });
  const normalized = {
    ok: result.status === 0 && !result.error,
    status: result.status,
    signal: result.signal,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error ? result.error.message : null,
    command: `kubectl ${args.join(' ')}`
  };
  if (!normalized.ok && !options.allowFailure) {
    throw new Error(commandFailure(normalized) || `kubectl failed: ${normalized.command}`);
  }
  return normalized;
}


function currentContextResult(options = {}) {
  const inCluster = inClusterKubectlConfig(options.env || process.env);
  if (inCluster) {
    return {
      ok: true,
      status: 0,
      signal: null,
      stdout: `${inCluster.context}\n`,
      stderr: '',
      error: null,
      command: 'kubectl config current-context'
    };
  }
  return runKubectl(['config', 'current-context'], { ...options, allowFailure: true });
}

function kubectlInvocationArgs(args, env = process.env) {
  const inCluster = inClusterKubectlConfig(env);
  return inCluster ? [...inCluster.args, ...args] : args;
}

function inClusterKubectlConfig(env = process.env) {
  if (String(env.KRADLE_DISABLE_IN_CLUSTER_KUBECTL || '').toLowerCase() === 'true') return null;
  if (env.KUBECONFIG) return null;
  const host = env.KUBERNETES_SERVICE_HOST;
  const port = env.KUBERNETES_SERVICE_PORT || '443';
  const serviceAccountDir = env.KRADLE_SERVICE_ACCOUNT_DIR || '/var/run/secrets/kubernetes.io/serviceaccount';
  const tokenPath = env.KRADLE_SERVICE_ACCOUNT_TOKEN || `${serviceAccountDir}/token`;
  const certificateAuthorityPath = env.KRADLE_SERVICE_ACCOUNT_CA || `${serviceAccountDir}/ca.crt`;
  if (!host || !port || !existsSync(tokenPath) || !existsSync(certificateAuthorityPath)) return null;
  const token = readFileSync(tokenPath, 'utf8').trim();
  if (!token) return null;
  return {
    context: 'in-cluster',
    args: [
      `--server=https://${host}:${port}`,
      `--certificate-authority=${certificateAuthorityPath}`,
      `--token=${token}`
    ]
  };
}


function kyvernoMode(env = process.env) {
  const configured = env.KRADLE_KYVERNO_MODE || env.KRADLE_EXTERNAL_KYVERNO_MODE;
  if (configured) return configured;
  if (String(env.KRADLE_KYVERNO_ENABLED || '').toLowerCase() === 'true') return 'byo';
  if (String(env.KRADLE_KYVERNO_DISCOVER_EXISTING || '').toLowerCase() !== 'false') return 'auto';
  return 'disabled';
}

function emptyKyvernoDiscovery(namespace = KRADLE_PLATFORM_NAMESPACE, env = process.env) {
  return {
    mode: kyvernoMode(env),
    namespace: env.KRADLE_KYVERNO_NAMESPACE || env.KRADLE_EXTERNAL_KYVERNO_NAMESPACE || 'kyverno',
    policyNamespace: env.KRADLE_KYVERNO_POLICY_NAMESPACE || namespace,
    requireForEnforceMode: String(env.KRADLE_KYVERNO_REQUIRE_FOR_ENFORCE_MODE || 'true') !== 'false',
    detected: false,
    controllers: [],
    resources: Object.fromEntries(KYVERNO_RESOURCES.map((definition) => [definition.kind, []])),
    reports: { policyReports: [], clusterPolicyReports: [], results: [], violations: [] },
    permissions: [],
    degraded: []
  };
}

function discoverKyverno({ kubectl, namespace, timeoutMs, env, discoveredPluralSet }) {
  const discovery = emptyKyvernoDiscovery(namespace, env);
  const availableDefinitions = KYVERNO_RESOURCES.filter((definition) => discoveredPluralSet.has(`${definition.group || KRADLE_API_GROUP}/${definition.plural}`));
  discovery.detected = availableDefinitions.length > 0;
  if (discovery.detected && discovery.mode === 'auto') discovery.mode = 'byo';
  if (!discovery.detected) {
    if (discovery.mode !== 'disabled') discovery.degraded.push('Kyverno CRDs are not installed or are not readable by the Kradle service account.');
    return discovery;
  }

  const listResults = [];
  for (const definition of availableDefinitions) {
    const resourceNamespace = definition.namespaced === false ? null : definition.namespace || (definition.kind === 'PolicyReport' ? namespace : discovery.policyNamespace);
    const result = runKubectl(['get', apiResourceName(definition), ...namespaceArgs(definition, resourceNamespace), '-o', 'json', '--ignore-not-found'], { kubectl, timeoutMs, env, allowFailure: true });
    listResults.push({ definition, result });
    discovery.resources[definition.kind] = result.ok ? parseKubernetesList(result.stdout).items : [];
  }

  const deploymentsResult = runKubectl(['get', 'deploy', '-n', discovery.namespace, '-o', 'json', '--ignore-not-found'], { kubectl, timeoutMs, env, allowFailure: true });
  discovery.controllers = deploymentsResult.ok ? parseKubernetesList(deploymentsResult.stdout).items.filter((deployment) => String(deployment.metadata?.name || '').includes('kyverno') || deployment.metadata?.labels?.['app.kubernetes.io/part-of'] === 'kyverno').map((deployment) => ({ name: deployment.metadata?.name, namespace: deployment.metadata?.namespace || discovery.namespace, ready: Number(deployment.status?.readyReplicas || 0) >= Number(deployment.spec?.replicas || 1), readyReplicas: deployment.status?.readyReplicas || 0, replicas: deployment.spec?.replicas || 0 })) : [];

  discovery.permissions = availableDefinitions.map((definition) => {
    const resourceNamespace = definition.namespaced === false ? null : definition.namespace || (definition.kind === 'PolicyReport' ? namespace : discovery.policyNamespace);
    return {
      kind: definition.kind,
      plural: definition.plural,
      apiResource: apiResourceName(definition),
      verbs: Object.fromEntries(['get', 'list', 'watch', 'create', 'patch'].map((verb) => [verb, canI(verb, definition, { kubectl, namespace: resourceNamespace || namespace, timeoutMs, env })]))
    };
  });

  const policyReports = discovery.resources.PolicyReport || [];
  const clusterPolicyReports = discovery.resources.ClusterPolicyReport || [];
  const results = [...policyReports, ...clusterPolicyReports].flatMap((report) => (report.results || []).map((result) => ({ report: report.metadata?.name, namespace: report.metadata?.namespace || '', policy: result.policy, rule: result.rule, result: result.result, severity: result.severity || result.properties?.severity || 'medium', message: result.message || '', resource: result.resources?.[0] || report.scope || null })));
  discovery.reports = { policyReports, clusterPolicyReports, results, violations: results.filter((result) => ['fail', 'error', 'warn'].includes(String(result.result || '').toLowerCase())) };
  discovery.degraded.push(...listResults.filter(({ result }) => !result.ok).map(({ definition, result }) => `${definition.kind}: ${commandFailure(result)}`));
  if (discovery.mode !== 'disabled' && discovery.controllers.length === 0) discovery.degraded.push(`No Kyverno controller deployments were found in namespace ${discovery.namespace}.`);
  return discovery;
}
function organizationNamespaces(organizations = [], bindings = [], fallbackNamespace = KRADLE_PLATFORM_NAMESPACE) {
  const namespaces = [...new Set([
    ...organizations.map((org) => org.spec?.namespaceName || org.metadata?.labels?.[KRADLE_ORG_NAMESPACE_LABEL]).filter(Boolean),
    ...bindings.map((binding) => binding.spec?.namespace || binding.metadata?.labels?.[KRADLE_ORG_NAMESPACE_LABEL]).filter(Boolean)
  ])];
  if (namespaces.length) return namespaces;
  const fallbackOrgs = new Set();
  const adminOrg = process.env.KRADLE_ADMIN_ORG;
  const defaultOrg = process.env.KRADLE_ORG || 'default';
  if (adminOrg) fallbackOrgs.add(orgNamespaceName(adminOrg));
  fallbackOrgs.add(orgNamespaceName(defaultOrg));
  return fallbackOrgs.size ? [...fallbackOrgs] : [fallbackNamespace];
}

function shouldListSnapshotDefinition(definition, discoveredPluralSet) {
  const group = definition.group || KRADLE_API_GROUP;
  if (discoveredPluralSet.has(`${group}/${definition.plural}`)) return true;
  return group === KRADLE_API_GROUP;
}

function parseKubernetesList(stdout) {
  const parsed = safeJson(stdout);
  if (!parsed) return { items: [] };
  if (Array.isArray(parsed.items)) return parsed;
  if (parsed.kind && parsed.metadata) return { items: [parsed] };
  return { items: [] };
}

function safeJson(text) {
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

function commandFailure(result) {
  if (!result || result.ok) return null;
  const detail = (result.stderr || result.error || result.stdout || '').trim();
  return `${result.command}: ${detail || `exit ${result.status ?? 'unknown'}`}`;
}

function namespaceArgs(definition, namespace) {
  return definition.namespaced === false ? [] : ['-n', namespace];
}

function commandString(args) {
  return args.join(' ');
}

function storageBoundaries() {
  return {
    etcd: 'Kradle CRDs: Organization, Repository, SSHKey, RepositoryPermission, BranchProtection, RefPolicy, WebhookSubscription, RunnerPool, View, Selector',
    kubevela: 'Kradle deployment CRDs: Application, ApplicationRevision, ComponentDefinition, WorkloadDefinition, TraitDefinition, ScopeDefinition, PolicyDefinition, Policy, WorkflowStepDefinition, Workflow, ResourceTracker',
    postgres: 'Aggregated API resources: PullRequest, Issue, Review, Pipeline, Job, WebhookDelivery',
    repositories: 'Repository backend Deployment, repository storage, and integration plans',
    objects: 'Object storage referenced by Repository specs and Pipeline artifacts'
  };
}

function controllerCommands(namespace) {
  return KRADLE_RESOURCES.map((definition) => {
    const resourceNamespace = definition.namespace || namespace;
    return {
      kind: definition.kind,
      list: commandString(['kubectl', 'get', apiResourceName(definition), ...namespaceArgs(definition, resourceNamespace)]),
      watch: commandString(['kubectl', 'get', apiResourceName(definition), ...namespaceArgs(definition, resourceNamespace), '--watch', '-o', 'json']),
      apply: 'kubectl apply -f -',
      delete: commandString(['kubectl', 'delete', apiResourceName(definition), '<name>', ...namespaceArgs(definition, resourceNamespace)])
    };
  });
}





