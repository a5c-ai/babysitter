import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgentSubagentController, AGENT_SUBAGENT_CONTROLLER_BOUNDARY, createResource } from '../src/index.js';

function makeSubagent(name, specOverrides = {}) {
  return createResource('AgentSubagent', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    rolePrompt: 'You are a specialized subagent',
    taskKinds: ['code-review', 'linting'],
    role: 'reviewer',
    parentStackRef: 'parent-stack-1',
    ...specOverrides
  });
}

function makeParentStack(name) {
  return createResource('AgentStack', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    baseAgent: 'claude-code',
    adapter: 'anthropic',
    runtimeIdentity: { serviceAccountRef: 'sa-default' }
  });
}

// 1. createAgentSubagentController returns controller with validate, dispatch, getToolScope
test('createAgentSubagentController returns controller with expected methods', () => {
  const controller = createAgentSubagentController();
  assert.ok(controller, 'controller should be created');
  assert.equal(typeof controller.validate, 'function', 'should have validate method');
  assert.equal(typeof controller.dispatchSubagent, 'function', 'should have dispatchSubagent method');
  assert.equal(typeof controller.getToolScope, 'function', 'should have getToolScope method');
});

// 2. validate accepts valid subagent (name, orgRef, parentStackRef, role)
test('validate accepts valid subagent with name, orgRef, parentStackRef, role', () => {
  const controller = createAgentSubagentController();
  const subagent = makeSubagent('valid-sub');
  const result = controller.validate(subagent);
  assert.equal(result.valid, true, 'valid subagent should pass validation');
  assert.equal(result.errors.length, 0, 'should have no errors');
});

// 3. validate rejects missing name
test('validate rejects subagent missing metadata.name', () => {
  const controller = createAgentSubagentController();
  const subagent = makeSubagent('temp-name');
  delete subagent.metadata.name;
  const result = controller.validate(subagent);
  assert.equal(result.valid, false, 'should be invalid without name');
  assert.ok(result.errors.some(e => e.includes('name')), 'error should mention name');
});

// 4. validate rejects missing parentStackRef
test('validate rejects subagent missing parentStackRef', () => {
  const controller = createAgentSubagentController();
  const subagent = makeSubagent('no-parent', { parentStackRef: undefined });
  const result = controller.validate(subagent);
  assert.equal(result.valid, false, 'should be invalid without parentStackRef');
  assert.ok(result.errors.some(e => e.includes('parentStackRef')), 'error should mention parentStackRef');
});

// 5. validate rejects missing role
test('validate rejects subagent missing role', () => {
  const controller = createAgentSubagentController();
  const subagent = makeSubagent('no-role', { role: undefined });
  const result = controller.validate(subagent);
  assert.equal(result.valid, false, 'should be invalid without role');
  assert.ok(result.errors.some(e => e.includes('role')), 'error should mention role');
});

// 6. getToolScope returns allowed tools from spec
test('getToolScope returns allowed tools list from spec.toolScope.allowed', () => {
  const controller = createAgentSubagentController();
  const subagent = makeSubagent('tool-sub', {
    toolScope: { allowed: ['Read', 'Grep', 'Glob'], denied: ['Bash'] }
  });
  const scope = controller.getToolScope(subagent);
  assert.deepEqual(scope.allowed, ['Read', 'Grep', 'Glob']);
});

// 7. getToolScope returns all tools when no restriction set
test('getToolScope returns unrestricted scope when no toolScope set', () => {
  const controller = createAgentSubagentController();
  const subagent = makeSubagent('open-sub');
  const scope = controller.getToolScope(subagent);
  assert.equal(scope.unrestricted, true, 'should be unrestricted when no toolScope set');
  assert.deepEqual(scope.allowed, [], 'allowed should be empty when unrestricted');
});

// 8. getDeniedTools returns denied tools list
test('getDeniedTools returns denied tools from spec.toolScope.denied', () => {
  const controller = createAgentSubagentController();
  const subagent = makeSubagent('restricted-sub', {
    toolScope: { allowed: ['Read'], denied: ['Bash', 'Write'] }
  });
  const denied = controller.getDeniedTools(subagent);
  assert.deepEqual(denied, ['Bash', 'Write'], 'should return denied tools');
});

// 9. dispatchSubagent creates a dispatch record with parentSessionRef
test('dispatchSubagent creates dispatch record with parentSessionRef', () => {
  const controller = createAgentSubagentController();
  const subagent = makeSubagent('dispatch-sub');
  const parentStack = makeParentStack('parent-stack-1');
  const result = controller.dispatchSubagent({
    subagent,
    parentSessionRef: 'session-parent-abc',
    taskKind: 'code-review',
    namespace: 'krate-org-default',
    organizationRef: 'default',
    resources: { AgentStack: [parentStack] }
  });
  assert.ok(result.dispatchRecord, 'should return a dispatch record');
  assert.equal(result.dispatchRecord.spec.parentSessionRef, 'session-parent-abc', 'should record parentSessionRef');
  assert.ok(result.dispatchRecord.metadata.name, 'dispatch record should have a name');
  assert.equal(result.error, undefined, 'should have no error');
});

// 10. dispatchSubagent rejects when parent session not provided
test('dispatchSubagent rejects when parentSessionRef not provided', () => {
  const controller = createAgentSubagentController();
  const subagent = makeSubagent('dispatch-no-parent');
  const result = controller.dispatchSubagent({
    subagent,
    parentSessionRef: undefined,
    taskKind: 'code-review',
    namespace: 'krate-org-default',
    organizationRef: 'default',
    resources: {}
  });
  assert.equal(result.error, true, 'should return error when no parentSessionRef');
  assert.ok(result.reason.includes('parentSessionRef') || result.message.includes('parentSessionRef'), 'error should mention parentSessionRef');
});

// 11. getSupervisionConfig returns supervision settings (monitorInterval, maxDuration, autoTerminate)
test('getSupervisionConfig returns configured supervision settings', () => {
  const controller = createAgentSubagentController();
  const subagent = makeSubagent('supervised-sub', {
    supervision: {
      monitorInterval: 30,
      maxDuration: 3600,
      autoTerminate: true
    }
  });
  const config = controller.getSupervisionConfig(subagent);
  assert.equal(config.monitorInterval, 30, 'should return monitorInterval');
  assert.equal(config.maxDuration, 3600, 'should return maxDuration');
  assert.equal(config.autoTerminate, true, 'should return autoTerminate');
});

// 12. getSupervisionConfig returns defaults when not configured
test('getSupervisionConfig returns default supervision settings when not configured', () => {
  const controller = createAgentSubagentController();
  const subagent = makeSubagent('default-supervision-sub');
  const config = controller.getSupervisionConfig(subagent);
  assert.ok(typeof config.monitorInterval === 'number', 'monitorInterval should be a number');
  assert.ok(typeof config.maxDuration === 'number', 'maxDuration should be a number');
  assert.ok(typeof config.autoTerminate === 'boolean', 'autoTerminate should be a boolean');
});

// 13. validateTaskRouting accepts valid routing (role matches available subagents)
test('validateTaskRouting accepts routing when role matches available subagent', () => {
  const controller = createAgentSubagentController();
  const subagents = [
    makeSubagent('sub-reviewer', { role: 'reviewer' }),
    makeSubagent('sub-tester', { role: 'tester' })
  ];
  const result = controller.validateTaskRouting({ role: 'reviewer', taskKind: 'code-review', subagents });
  assert.equal(result.valid, true, 'routing to existing role should be valid');
  assert.ok(result.matchedSubagent, 'should return the matched subagent');
  assert.equal(result.matchedSubagent.metadata.name, 'sub-reviewer');
});

// 14. validateTaskRouting rejects routing to non-existent role
test('validateTaskRouting rejects routing to non-existent role', () => {
  const controller = createAgentSubagentController();
  const subagents = [
    makeSubagent('sub-reviewer', { role: 'reviewer' })
  ];
  const result = controller.validateTaskRouting({ role: 'deployer', taskKind: 'deploy', subagents });
  assert.equal(result.valid, false, 'routing to non-existent role should be invalid');
  assert.ok(result.error.includes('deployer') || result.error.includes('role'), 'error should mention the missing role');
});

// 15. getSubagentStatus returns status from spec (idle, active, completed, failed)
test('getSubagentStatus returns status from spec.status field', () => {
  const controller = createAgentSubagentController();
  const subagent = makeSubagent('active-sub');
  subagent.status = { phase: 'active', sessionRef: 'session-xyz' };
  const status = controller.getSubagentStatus(subagent);
  assert.equal(status.phase, 'active', 'should return the phase from status');
  assert.equal(status.sessionRef, 'session-xyz', 'should return sessionRef from status');
});

// 16. BOUNDARY exported with correct role
test('AGENT_SUBAGENT_CONTROLLER_BOUNDARY is exported with correct role', () => {
  assert.ok(AGENT_SUBAGENT_CONTROLLER_BOUNDARY, 'BOUNDARY should be exported');
  assert.equal(AGENT_SUBAGENT_CONTROLLER_BOUNDARY.role, 'agent-subagent-controller', 'role should be agent-subagent-controller');
  assert.ok(Array.isArray(AGENT_SUBAGENT_CONTROLLER_BOUNDARY.owns), 'owns should be an array');
  assert.ok(Array.isArray(AGENT_SUBAGENT_CONTROLLER_BOUNDARY.delegatesTo), 'delegatesTo should be an array');
});
