import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
  'AgentPersona',
  'AgentSoul',
  'AgentAppearance',
  'AgentVoiceProfile',
  'AgentDefinition',
  'AgentSubagent',
  'AgentToolProfile',
  'AgentMcpServer',
  'AgentSkill',
  'AgentTriggerRule',
  'AgentContextLabel',
  'KradleWorkspacePolicy',
  'AgentServiceAccount',
  'AgentRoleBinding',
  'AgentSecretGrant',
  'AgentConfigGrant',
  'AgentAdapter',
  'AgentTransportBinding',
  'AgentProviderConfig',
  'KradleProject',
  'AgentGatewayConfig',
  'AgentMemoryRepository',
  'AgentMemorySource',
  'AgentMemoryOntology',
  'AgentMemoryAssociation',
  'KradleWorkspace'
];

const AGENT_AGGREGATED_KINDS = [
  'AgentDispatchRun',
  'AgentDispatchAttempt',
  'AgentSession',
  'AgentContextBundle',
  'KradleArtifact',
  'AgentApproval',
  'AgentTriggerExecution',
  'AgentCapabilityRequirement',
  'WorkItemSessionLink',
  'WorkItemWorkspaceLink',
  'AgentSessionTranscript',
  'AgentSessionAttachment',
  'KradleWorkspaceRuntime',
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
    AgentPersona: { organizationRef: 'default', displayName: 'Aria' },
    AgentSoul: { organizationRef: 'default', content: 'You are Aria.' },
    AgentAppearance: { organizationRef: 'default' },
    AgentVoiceProfile: { organizationRef: 'default', ttsProvider: 'openai' },
    AgentDefinition: { organizationRef: 'default', personaRef: 'aria', stackRef: 'default-stack' },
    AgentSubagent: { organizationRef: 'default', rolePrompt: 'Code reviewer', taskKinds: ['review'] },
    AgentToolProfile: { organizationRef: 'default', filesystemPolicy: 'read-write', approvalPolicyByTool: { shell: 'auto' } },
    AgentMcpServer: { organizationRef: 'default', transport: 'stdio', scope: 'workspace' },
    AgentSkill: { organizationRef: 'default', format: 'markdown', sourceRef: 'skills/debug.md' },
    AgentTriggerRule: { organizationRef: 'default', sources: ['ci-failure'], agentStack: 'default-stack', taskKind: 'fix' },
    AgentContextLabel: { organizationRef: 'default', promptFragment: 'Always run tests before committing', allowedSources: ['admin'] },
    KradleWorkspacePolicy: { organizationRef: 'default', mode: 'worktree', retentionPolicy: '7d' },
    AgentServiceAccount: { organizationRef: 'default', namespace: 'kradle-agents', serviceAccountName: 'agent-runner' },
    AgentRoleBinding: { organizationRef: 'default', subject: 'agent-runner', roleRef: 'agent-role', scope: 'namespace' },
    AgentSecretGrant: { organizationRef: 'default', subject: 'agent-runner', secretRef: 'api-keys', purpose: 'API access' },
    AgentConfigGrant: { organizationRef: 'default', subject: 'agent-runner', configMapRef: 'agent-config', purpose: 'Configuration' },
    AgentDispatchRun: { organizationRef: 'default', repository: 'app', sourceRefs: ['refs/heads/main'], agentStack: 'default-stack', taskKind: 'fix' },
    AgentDispatchAttempt: { organizationRef: 'default', agentDispatchRun: 'run-1', attemptReason: 'initial', agentStackSnapshot: { baseAgent: 'claude-code' } },
    AgentSession: { organizationRef: 'default', agentMuxSessionId: 'sess-123', dispatchRun: 'run-1' },
    AgentContextBundle: { organizationRef: 'default', dispatchRun: 'run-1', digest: 'sha256:abc', sources: ['repo-context'] },
    KradleArtifact: { organizationRef: 'default', dispatchRun: 'run-1', kind: 'patch', digest: 'sha256:def' },
    AgentApproval: { organizationRef: 'default', dispatchRun: 'run-1', action: 'write-back', requestedBy: 'agent-runner' },
    KradleWorkspace: { organizationRef: 'default', repository: 'app', volumeSpec: { storageClassName: 'standard', capacity: '10Gi', accessModes: ['ReadWriteOnce'] } },
    AgentTriggerExecution: { organizationRef: 'default', triggerRule: 'on-ci-fail', sourceEvent: 'pipeline-failed', decision: 'dispatch' },
    AgentCapabilityRequirement: { organizationRef: 'default', ownerRef: 'stack-1', requiredRoles: ['shell', 'git'] },
    WorkItemSessionLink: { organizationRef: 'default', workItemRef: 'issue-1', agentSession: 'sess-123' },
    WorkItemWorkspaceLink: { organizationRef: 'default', workItemRef: 'issue-1', workspace: 'ws-1' },
    AgentAdapter: { organizationRef: 'default', adapterType: 'claude-code', transport: 'stdio' },
    AgentTransportBinding: { organizationRef: 'default', adapterRef: 'claude-code', endpoint: 'https://agent.example.test', protocol: 'https' },
    AgentProviderConfig: { organizationRef: 'default', provider: 'anthropic', authType: 'api-key' },
    KradleProject: { organizationRef: 'default', displayName: 'Platform' },
    AgentGatewayConfig: { organizationRef: 'default', gatewayUrl: 'https://mux.example.test' },
    AgentSessionTranscript: { organizationRef: 'default', sessionRef: 'sess-123', messages: [{ role: 'user', content: 'hello' }] },
    AgentSessionAttachment: { organizationRef: 'default', sessionRef: 'sess-123', sourceType: 'upload', digest: 'sha256:abc' },
    KradleWorkspaceRuntime: { organizationRef: 'default', workspaceRef: 'ws-1', status: 'running' },
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
      assert.equal(resource.apiVersion, 'kradle.a5c.ai/v1alpha1');
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
        apiVersion: 'kradle.a5c.ai/v1alpha1',
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
      assert.equal(schema.apiVersion, 'kradle.a5c.ai/v1alpha1');
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
  it('CONFIG_KINDS has 65 members', () => {
    assert.equal(CONFIG_KINDS.size, 65);
  });

  it('AGGREGATED_KINDS has 33 members', () => {
    assert.equal(AGGREGATED_KINDS.size, 33);
  });

  it('ALL_KINDS has 98 members', () => {
    assert.equal(ALL_KINDS.size, 98);
  });

  it('listResourceDefinitions returns 98 definitions', () => {
    assert.equal(listResourceDefinitions().length, 98);
  });
});

describe('agent identity CRDs', () => {
  const chart = readFileSync(new URL('../../charts/crds/agent-resources.yaml', import.meta.url), 'utf8');
  const identityCrds = {
    AgentPersona: ['agentpersonas', 'organizationRef', 'displayName'],
    AgentSoul: ['agentsouls', 'organizationRef', 'content'],
    AgentAppearance: ['agentappearances', 'organizationRef'],
    AgentVoiceProfile: ['agentvoiceprofiles', 'organizationRef', 'ttsProvider'],
    AgentDefinition: ['agentdefinitions', 'organizationRef', 'personaRef', 'stackRef']
  };

  for (const [kind, expected] of Object.entries(identityCrds)) {
    it(`${kind} CRD is present with required identity fields`, () => {
      assert.ok(chart.includes(`kind: ${kind}`), `${kind} kind should be present`);
      for (const field of expected) {
        assert.ok(chart.includes(field), `${kind} CRD should include ${field}`);
      }
    });
  }

  it('AgentDispatchRun and AgentTriggerRule CRDs allow agentDefinition targets', () => {
    assert.ok(chart.includes('agentDefinition'), 'agent-resources CRD should include agentDefinition target fields');
  });

  it('AgentTriggerRule CRD requires agentStack or agentDefinition target', () => {
    assert.ok(chart.includes('anyOf:'), 'AgentTriggerRule CRD should express target alternatives');
    assert.ok(chart.includes('- agentStack'), 'AgentTriggerRule CRD should allow agentStack target');
    assert.ok(chart.includes('- agentDefinition'), 'AgentTriggerRule CRD should allow agentDefinition target');
  });
});

describe('agent dispatch and trigger target validation', () => {
  it('AgentTriggerRule accepts agentDefinition without agentStack', () => {
    const rule = createResource('AgentTriggerRule', { name: 'identity-trigger' }, {
      organizationRef: 'default',
      sources: ['ci-failure'],
      agentDefinition: 'aria-reviewer',
      taskKind: 'diagnostic'
    });

    assert.equal(validateResource(rule), rule);
  });

  it('AgentTriggerRule rejects missing agentStack and agentDefinition', () => {
    const rule = createResource('AgentTriggerRule', { name: 'missing-target' }, {
      organizationRef: 'default',
      sources: ['ci-failure'],
      taskKind: 'diagnostic'
    });

    assert.throws(() => validateResource(rule), /spec\.agentStack or spec\.agentDefinition is required/);
  });

  it('AgentDispatchRun rejects missing agentStack and agentDefinition', () => {
    const run = createResource('AgentDispatchRun', { name: 'missing-target' }, {
      organizationRef: 'default',
      repository: 'repo',
      sourceRefs: [],
      taskKind: 'diagnostic'
    });

    assert.throws(() => validateResource(run), /spec\.agentStack or spec\.agentDefinition is required/);
  });
});
