import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgentStackController, createResource } from '../src/index.js';

function makeStack(name, spec = {}) {
  return createResource('AgentStack', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    baseAgent: 'claude-code',
    adapter: 'anthropic',
    runtimeIdentity: { serviceAccountRef: 'sa-default' },
    ...spec
  });
}

function makeToolProfile(name) {
  return createResource('AgentToolProfile', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    filesystemPolicy: 'read-write',
    approvalPolicyByTool: {}
  });
}

function makeMcpServer(name) {
  return createResource('AgentMcpServer', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    transport: 'stdio',
    scope: 'workspace'
  });
}

function makeSkill(name, overrides = {}) {
  return createResource('AgentSkill', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    format: 'markdown',
    sourceRef: 'git://repo/skills/' + name,
    ...overrides
  });
}

function makeSubagent(name, overrides = {}) {
  return createResource('AgentSubagent', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    rolePrompt: 'Test subagent',
    taskKinds: ['code-review'],
    ...overrides
  });
}

function makeContextLabel(name) {
  return createResource('AgentContextLabel', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    promptFragment: 'context for ' + name,
    allowedSources: ['manual']
  });
}

function makeServiceAccount(name) {
  return createResource('AgentServiceAccount', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    namespace: 'krate-org-default',
    serviceAccountName: name
  });
}

function makeRoleBinding(name, subject) {
  return createResource('AgentRoleBinding', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    subject,
    roleRef: 'agent-developer',
    scope: 'namespace'
  });
}

function makeSecretGrant(name, subject, purpose) {
  return createResource('AgentSecretGrant', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    subject,
    secretRef: 'secret-' + purpose,
    purpose
  });
}

test('Stack with all refs present results in Ready=True', () => {
  const controller = createAgentStackController();
  const stack = makeStack('full-stack', {
    toolPolicy: 'tool-profile-1',
    mcpServerRefs: ['mcp-github'],
    skillRefs: ['skill-review'],
    subagentRefs: ['sub-linter'],
    contextLabelRefs: ['ctx-security']
  });

  const resources = {
    AgentStack: [stack],
    AgentToolProfile: [makeToolProfile('tool-profile-1')],
    AgentMcpServer: [makeMcpServer('mcp-github')],
    AgentSkill: [makeSkill('skill-review')],
    AgentSubagent: [makeSubagent('sub-linter')],
    AgentContextLabel: [makeContextLabel('ctx-security')],
    AgentServiceAccount: [makeServiceAccount('sa-default')],
    AgentRoleBinding: [makeRoleBinding('rb-1', 'sa-default')],
    AgentSecretGrant: [makeSecretGrant('sg-model', 'sa-default', 'model-provider')]
  };

  const result = controller.reconcileStack(stack, resources);
  const readyCondition = result.conditions.find((c) => c.type === 'Ready');
  assert.equal(readyCondition.status, 'True', 'Ready condition should be True when all refs are present');
  assert.equal(result.validation, 'valid');
  assert.equal(result.capabilities.tools.length, 1);
  assert.equal(result.capabilities.mcpServers.length, 1);
  assert.equal(result.capabilities.skills.length, 1);
  assert.equal(result.capabilities.subagents.length, 1);
  assert.equal(result.capabilities.contextLabels.length, 1);
});

test('Stack with missing MCP server results in McpHealthy=False and Ready=False', () => {
  const controller = createAgentStackController();
  const stack = makeStack('missing-mcp-stack', {
    mcpServerRefs: ['mcp-github', 'mcp-missing']
  });

  const resources = {
    AgentStack: [stack],
    AgentMcpServer: [makeMcpServer('mcp-github')],
    AgentServiceAccount: [makeServiceAccount('sa-default')],
    AgentRoleBinding: [makeRoleBinding('rb-1', 'sa-default')],
    AgentSecretGrant: [makeSecretGrant('sg-model', 'sa-default', 'model-provider')]
  };

  const result = controller.reconcileStack(stack, resources);
  const mcpCondition = result.conditions.find((c) => c.type === 'McpHealthy');
  const readyCondition = result.conditions.find((c) => c.type === 'Ready');
  assert.equal(mcpCondition.status, 'False', 'McpHealthy should be False when MCP server is missing');
  assert.equal(readyCondition.status, 'False', 'Ready should be False when McpHealthy is False');
  assert.ok(mcpCondition.message.includes('mcp-missing'));
});

test('Stack with missing skill results in SkillsValidated=False and Ready=False', () => {
  const controller = createAgentStackController();
  const stack = makeStack('missing-skill-stack', {
    skillRefs: ['skill-review', 'skill-ghost']
  });

  const resources = {
    AgentStack: [stack],
    AgentSkill: [makeSkill('skill-review')],
    AgentServiceAccount: [makeServiceAccount('sa-default')],
    AgentRoleBinding: [makeRoleBinding('rb-1', 'sa-default')],
    AgentSecretGrant: [makeSecretGrant('sg-model', 'sa-default', 'model-provider')]
  };

  const result = controller.reconcileStack(stack, resources);
  const skillsCondition = result.conditions.find((c) => c.type === 'SkillsValidated');
  const readyCondition = result.conditions.find((c) => c.type === 'Ready');
  assert.equal(skillsCondition.status, 'False', 'SkillsValidated should be False when skill is missing');
  assert.equal(readyCondition.status, 'False', 'Ready should be False when SkillsValidated is False');
  assert.ok(skillsCondition.message.includes('skill-ghost'));
});

test('Minimal stack with no capability refs results in Ready=True', () => {
  const controller = createAgentStackController();
  const stack = makeStack('minimal-stack');

  const resources = {
    AgentStack: [stack],
    AgentServiceAccount: [makeServiceAccount('sa-default')],
    AgentRoleBinding: [makeRoleBinding('rb-1', 'sa-default')],
    AgentSecretGrant: [makeSecretGrant('sg-model', 'sa-default', 'model-provider')]
  };

  const result = controller.reconcileStack(stack, resources);
  const readyCondition = result.conditions.find((c) => c.type === 'Ready');
  assert.equal(readyCondition.status, 'True', 'Ready should be True for minimal stack with identity present');
  assert.equal(result.validation, 'valid');
  assert.equal(result.capabilities.tools.length, 0);
  assert.equal(result.capabilities.mcpServers.length, 0);
  assert.equal(result.capabilities.skills.length, 0);
  assert.equal(result.capabilities.subagents.length, 0);
  assert.equal(result.capabilities.contextLabels.length, 0);
});

test('listStackCapabilities returns correct normalized capability list', () => {
  const controller = createAgentStackController();
  const stack = makeStack('caps-stack', {
    toolPolicy: 'tp-1',
    mcpServerRefs: ['mcp-a', 'mcp-b'],
    skillRefs: ['skill-x'],
    subagentRefs: ['sub-y'],
    contextLabelRefs: ['ctx-z']
  });

  const resources = {
    AgentToolProfile: [makeToolProfile('tp-1')],
    AgentMcpServer: [makeMcpServer('mcp-a')],
    AgentSkill: [makeSkill('skill-x')],
    AgentSubagent: [makeSubagent('sub-y')],
    AgentContextLabel: [makeContextLabel('ctx-z')]
  };

  const capabilities = controller.listStackCapabilities(stack, resources);
  assert.equal(capabilities.length, 6);

  const tool = capabilities.find((c) => c.kind === 'tool');
  assert.equal(tool.name, 'tp-1');
  assert.equal(tool.status, 'resolved');

  const mcpA = capabilities.find((c) => c.kind === 'mcp' && c.name === 'mcp-a');
  assert.equal(mcpA.status, 'resolved');

  const mcpB = capabilities.find((c) => c.kind === 'mcp' && c.name === 'mcp-b');
  assert.equal(mcpB.status, 'missing');

  const skill = capabilities.find((c) => c.kind === 'skill');
  assert.equal(skill.status, 'resolved');

  const subagent = capabilities.find((c) => c.kind === 'subagent');
  assert.equal(subagent.status, 'resolved');

  const ctxLabel = capabilities.find((c) => c.kind === 'contextLabel');
  assert.equal(ctxLabel.status, 'resolved');
});
