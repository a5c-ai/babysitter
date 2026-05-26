import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CONFIG_KINDS,
  AGGREGATED_KINDS,
  ALL_KINDS,
  RESOURCE_DEFINITIONS,
  createResource,
  validateResource,
  resourceSchemaForKind,
  storageClassForKind,
  listResourceDefinitions
} from '../src/resource-model.js';

const AGENT_CONFIG_KINDS = [
  'AgentStack',
  'AgentSubagent',
  'AgentToolProfile',
  'AgentMcpServer',
  'AgentSkill',
  'AgentTriggerRule',
  'AgentContextLabel',
  'KrateWorkspacePolicy',
  'AgentServiceAccount',
  'AgentRoleBinding',
  'AgentSecretGrant',
  'AgentConfigGrant',
  'AgentAdapter',
  'AgentTransportBinding',
  'AgentProviderConfig',
  'KrateProject',
  'AgentGatewayConfig',
  'AgentMemoryRepository',
  'AgentMemorySource',
  'AgentMemoryOntology',
  'AgentMemoryAssociation',
  'KrateWorkspace'
];

const AGENT_AGGREGATED_KINDS = [
  'AgentDispatchRun',
  'AgentDispatchAttempt',
  'AgentSession',
  'AgentContextBundle',
  'KrateArtifact',
  'AgentApproval',
  'AgentTriggerExecution',
  'AgentCapabilityRequirement',
  'WorkItemSessionLink',
  'WorkItemWorkspaceLink',
  'AgentSessionTranscript',
  'AgentSessionAttachment',
  'KrateWorkspaceRuntime',
  'AgentMemorySnapshot',
  'AgentMemoryQuery',
  'AgentMemoryUpdate',
  'AgentRunMemoryImport'
];

const ALL_AGENT_KINDS = [...AGENT_CONFIG_KINDS, ...AGENT_AGGREGATED_KINDS];

/** Minimal valid spec for each agent kind, satisfying requiredSpec. */
function minimalSpecForKind(kind) {
  const specs = {
    AgentStack: { organizationRef: 'default', baseAgent: 'claude-code', adapter: 'babysitter', runtimeIdentity: 'sa-agent' },
    AgentSubagent: { organizationRef: 'default', rolePrompt: 'Code reviewer', taskKinds: ['review'] },
    AgentToolProfile: { organizationRef: 'default', filesystemPolicy: 'read-write', approvalPolicyByTool: { shell: 'auto' } },
    AgentMcpServer: { organizationRef: 'default', transport: 'stdio', scope: 'workspace' },
    AgentSkill: { organizationRef: 'default', format: 'markdown', sourceRef: 'skills/debug.md' },
    AgentTriggerRule: { organizationRef: 'default', sources: ['ci-failure'], agentStack: 'default-stack', taskKind: 'fix' },
    AgentContextLabel: { organizationRef: 'default', promptFragment: 'Always run tests before committing', allowedSources: ['admin'] },
    KrateWorkspacePolicy: { organizationRef: 'default', mode: 'worktree', retentionPolicy: '7d' },
    AgentServiceAccount: { organizationRef: 'default', namespace: 'krate-agents', serviceAccountName: 'agent-runner' },
    AgentRoleBinding: { organizationRef: 'default', subject: 'agent-runner', roleRef: 'agent-role', scope: 'namespace' },
    AgentSecretGrant: { organizationRef: 'default', subject: 'agent-runner', secretRef: 'api-keys', purpose: 'API access' },
    AgentConfigGrant: { organizationRef: 'default', subject: 'agent-runner', configMapRef: 'agent-config', purpose: 'Configuration' },
    AgentDispatchRun: { organizationRef: 'default', repository: 'app', sourceRefs: ['refs/heads/main'], agentStack: 'default-stack', taskKind: 'fix' },
    AgentDispatchAttempt: { organizationRef: 'default', agentDispatchRun: 'run-1', attemptReason: 'initial', agentStackSnapshot: { baseAgent: 'claude-code' } },
    AgentSession: { organizationRef: 'default', agentMuxSessionId: 'sess-123', dispatchRun: 'run-1' },
    AgentContextBundle: { organizationRef: 'default', dispatchRun: 'run-1', digest: 'sha256:abc', sources: ['repo-context'] },
    KrateArtifact: { organizationRef: 'default', dispatchRun: 'run-1', kind: 'patch', digest: 'sha256:def' },
    AgentApproval: { organizationRef: 'default', dispatchRun: 'run-1', action: 'write-back', requestedBy: 'agent-runner' },
    KrateWorkspace: { organizationRef: 'default', repository: 'app', volumeSpec: { storageClassName: 'standard', capacity: '10Gi', accessModes: ['ReadWriteOnce'] } },
    AgentTriggerExecution: { organizationRef: 'default', triggerRule: 'on-ci-fail', sourceEvent: 'pipeline-failed', decision: 'dispatch' },
    AgentCapabilityRequirement: { organizationRef: 'default', ownerRef: 'stack-1', requiredRoles: ['shell', 'git'] },
    WorkItemSessionLink: { organizationRef: 'default', workItemRef: 'issue-1', agentSession: 'sess-123' },
    WorkItemWorkspaceLink: { organizationRef: 'default', workItemRef: 'issue-1', workspace: 'ws-1' },
    AgentAdapter: { organizationRef: 'default', adapterType: 'claude-code', transport: 'stdio' },
    AgentTransportBinding: { organizationRef: 'default', adapterRef: 'claude-code', endpoint: 'https://agent.example.test', protocol: 'https' },
    AgentProviderConfig: { organizationRef: 'default', provider: 'anthropic', authType: 'api-key' },
    KrateProject: { organizationRef: 'default', displayName: 'Platform' },
    AgentGatewayConfig: { organizationRef: 'default', gatewayUrl: 'https://mux.example.test' },
    AgentSessionTranscript: { organizationRef: 'default', sessionRef: 'sess-123', messages: [{ role: 'user', content: 'hello' }] },
    AgentSessionAttachment: { organizationRef: 'default', sessionRef: 'sess-123', sourceType: 'upload', digest: 'sha256:abc' },
    KrateWorkspaceRuntime: { organizationRef: 'default', workspaceRef: 'ws-1', status: 'running' },
    AgentMemoryRepository: { organizationRef: 'default', repositoryRef: 'memory-repo', defaultBranch: 'main', layoutProfile: 'standard' },
    AgentMemorySource: { organizationRef: 'default', repositoryRef: 'memory-repo', appliesTo: 'team:platform', include: ['decisions/**', 'runbooks/**'] },
    AgentMemoryOntology: { organizationRef: 'default', memoryRepository: 'memory-repo', ontologyPath: '.memory/ontology.yaml' },
    AgentMemoryAssociation: { organizationRef: 'default', memoryRef: 'decision-001', targetRef: 'issue-42', relationship: 'informs' },
    AgentMemorySnapshot: { organizationRef: 'default', memoryRepository: 'memory-repo', requestedRef: 'refs/heads/main', resolvedCommit: 'a'.repeat(40) },
    AgentMemoryQuery: { organizationRef: 'default', snapshotRef: 'snap-1', requester: 'agent-runner', query: 'deployment patterns' },
    AgentMemoryUpdate: { organizationRef: 'default', memoryRepository: 'memory-repo', sourceRun: 'run-1', changes: [{ path: 'decisions/001.md', op: 'add' }] },
    AgentRunMemoryImport: { organizationRef: 'default', memoryRepository: 'memory-repo', source: 'babysitter-run-42', include: ['journal', 'effects'] }
  };
  return specs[kind];
}

describe('agent resource set membership', () => {
  for (const kind of AGENT_CONFIG_KINDS) {
    it(`${kind} is in CONFIG_KINDS`, () => {
      assert.ok(CONFIG_KINDS.has(kind), `${kind} should be in CONFIG_KINDS`);
    });
  }

  for (const kind of AGENT_AGGREGATED_KINDS) {
    it(`${kind} is in AGGREGATED_KINDS`, () => {
      assert.ok(AGGREGATED_KINDS.has(kind), `${kind} should be in AGGREGATED_KINDS`);
    });
  }

  for (const kind of ALL_AGENT_KINDS) {
    it(`${kind} is in ALL_KINDS`, () => {
      assert.ok(ALL_KINDS.has(kind), `${kind} should be in ALL_KINDS`);
    });
  }
});

describe('RESOURCE_DEFINITIONS for agent kinds', () => {
  for (const kind of ALL_AGENT_KINDS) {
    it(`${kind} has valid definition with storage, context, plural, purpose, requiredSpec`, () => {
      const def = RESOURCE_DEFINITIONS[kind];
      assert.ok(def, `${kind} should exist in RESOURCE_DEFINITIONS`);
      assert.ok(['etcd', 'postgres'].includes(def.storage), `${kind} storage should be etcd or postgres`);
      assert.ok(typeof def.context === 'string' && def.context.length > 0, `${kind} context should be a non-empty string`);
      assert.ok(typeof def.plural === 'string' && def.plural.length > 0, `${kind} plural should be a non-empty string`);
      assert.ok(typeof def.purpose === 'string' && def.purpose.length > 0, `${kind} purpose should be a non-empty string`);
      assert.ok(Array.isArray(def.requiredSpec) && def.requiredSpec.length > 0, `${kind} requiredSpec should be a non-empty array`);
    });
  }
});

describe('createResource for agent kinds', () => {
  for (const kind of ALL_AGENT_KINDS) {
    it(`creates a valid ${kind} resource`, () => {
      const spec = minimalSpecForKind(kind);
      const resource = createResource(kind, { name: `test-${kind.toLowerCase()}` }, spec);
      assert.equal(resource.apiVersion, 'krate.a5c.ai/v1alpha1');
      assert.equal(resource.kind, kind);
      assert.equal(resource.metadata.name, `test-${kind.toLowerCase()}`);
      assert.equal(resource.metadata.namespace, 'default');
      assert.ok(resource.metadata.labels !== undefined);
      assert.ok(resource.metadata.annotations !== undefined);
      assert.ok(typeof resource.spec === 'object');
      assert.ok(typeof resource.status === 'object');
    });
  }
});

describe('validateResource rejects missing required spec fields for agent kinds', () => {
  for (const kind of ALL_AGENT_KINDS) {
    it(`throws on empty spec for ${kind}`, () => {
      const resource = {
        apiVersion: 'krate.a5c.ai/v1alpha1',
        kind,
        metadata: { name: `invalid-${kind.toLowerCase()}` },
        spec: {},
        status: {}
      };
      const def = RESOURCE_DEFINITIONS[kind];
      assert.throws(
        () => validateResource(resource),
        (err) => {
          assert.ok(err.message.includes(`${kind} spec.${def.requiredSpec[0]} is required`));
          return true;
        }
      );
    });
  }
});

describe('resourceSchemaForKind for agent kinds', () => {
  for (const kind of ALL_AGENT_KINDS) {
    it(`returns correct schema for ${kind}`, () => {
      const schema = resourceSchemaForKind(kind);
      assert.equal(schema.apiVersion, 'krate.a5c.ai/v1alpha1');
      assert.equal(schema.kind, kind);
      assert.ok(typeof schema.plural === 'string');
      assert.ok(['etcd', 'postgres'].includes(schema.storage));
      assert.ok(Array.isArray(schema.required.metadata));
      assert.ok(schema.required.metadata.includes('name'));
      assert.ok(Array.isArray(schema.required.spec));
      assert.ok(schema.required.spec.length > 0);
      assert.deepEqual(schema.status, ['storage', 'phase', 'conditions']);
    });
  }
});

describe('storageClassForKind for agent kinds', () => {
  for (const kind of AGENT_CONFIG_KINDS) {
    it(`${kind} returns etcd`, () => {
      assert.equal(storageClassForKind(kind), 'etcd');
    });
  }

  for (const kind of AGENT_AGGREGATED_KINDS) {
    it(`${kind} returns postgres`, () => {
      assert.equal(storageClassForKind(kind), 'postgres');
    });
  }
});

describe('kind set counts', () => {
  it('CONFIG_KINDS has 53 members', () => {
    assert.equal(CONFIG_KINDS.size, 53);
  });

  it('AGGREGATED_KINDS has 31 members', () => {
    assert.equal(AGGREGATED_KINDS.size, 31);
  });

  it('ALL_KINDS has 84 members', () => {
    assert.equal(ALL_KINDS.size, 84);
  });

  it('listResourceDefinitions returns 84 definitions', () => {
    assert.equal(listResourceDefinitions().length, 84);
  });
});
