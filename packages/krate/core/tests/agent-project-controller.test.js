import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgentProjectController, validateAgentProject, createResource, AGENT_PROJECT_CONTROLLER_BOUNDARY } from '../src/index.js';

// ---------------------------------------------------------------------------
// Acceptance criteria: Slice 1.2d — Agent Project Controller
//
// A KrateProject groups issues and tasks into a kanban board with workflow
// columns, default column assignment, issue tracking, and board state management.
//
// All tests in this file are expected to FAIL until the controller is
// implemented and exported from src/index.js.
// ---------------------------------------------------------------------------

function makeProject(name, overrides = {}) {
  return createResource('KrateProject', { name, namespace: 'krate-org-default' }, {
    organizationRef: 'default',
    workflowColumns: [
      { id: 'todo', displayName: 'To Do', color: '#888888', default: true },
      { id: 'in-progress', displayName: 'In Progress', color: '#0075ca' },
      { id: 'review', displayName: 'Review', color: '#e4e669' },
      { id: 'done', displayName: 'Done', color: '#0e8a16' }
    ],
    ...overrides
  });
}

// ---------------------------------------------------------------------------
// 1. Factory and shape
// ---------------------------------------------------------------------------

test('createAgentProjectController returns a controller with validate, getWorkflowColumns, getBoardState', () => {
  const controller = createAgentProjectController();
  assert.ok(controller, 'controller must be truthy');
  assert.equal(typeof controller.validate, 'function', 'controller must expose a validate method');
  assert.equal(typeof controller.getWorkflowColumns, 'function', 'controller must expose a getWorkflowColumns method');
  assert.equal(typeof controller.getBoardState, 'function', 'controller must expose a getBoardState method');
  assert.equal(controller.role, 'agent-project-controller', 'controller must declare its role');
});

// ---------------------------------------------------------------------------
// 2. validate — happy path
// ---------------------------------------------------------------------------

test('validate accepts valid project with name, organizationRef, workflowColumns', () => {
  const controller = createAgentProjectController();
  const project = makeProject('my-sprint');
  const result = controller.validate(project);

  assert.equal(result.valid, true, 'valid project must pass validation');
  assert.ok(Array.isArray(result.errors), 'result must contain an errors array');
  assert.equal(result.errors.length, 0, 'errors array must be empty for a valid project');
});

// ---------------------------------------------------------------------------
// 3. validate — missing name
// ---------------------------------------------------------------------------

test('validate rejects project with missing name', () => {
  const controller = createAgentProjectController();
  const project = {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'KrateProject',
    metadata: { namespace: 'krate-org-default', labels: {}, annotations: {} },
    spec: {
      organizationRef: 'default',
      workflowColumns: [{ id: 'todo', displayName: 'To Do', color: '#888888' }]
    },
    status: {}
  };
  const result = controller.validate(project);

  assert.equal(result.valid, false, 'project without name must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /name/i.test(e)),
    'at least one error must mention "name"'
  );
});

// ---------------------------------------------------------------------------
// 4. validate — missing organizationRef
// ---------------------------------------------------------------------------

test('validate rejects project with missing organizationRef', () => {
  const controller = createAgentProjectController();
  const project = makeProject('no-org-project', { organizationRef: undefined });
  delete project.spec.organizationRef;
  const result = controller.validate(project);

  assert.equal(result.valid, false, 'project without organizationRef must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /organizationRef/i.test(e)),
    'at least one error must mention "organizationRef"'
  );
});

// ---------------------------------------------------------------------------
// 5. validate — empty workflowColumns array
// ---------------------------------------------------------------------------

test('validate rejects project with empty workflowColumns array', () => {
  const controller = createAgentProjectController();
  const project = makeProject('no-columns-project', { workflowColumns: [] });
  const result = controller.validate(project);

  assert.equal(result.valid, false, 'project with empty workflowColumns must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /workflowColumns/i.test(e)),
    'at least one error must mention "workflowColumns"'
  );
});

// ---------------------------------------------------------------------------
// 6. validate — duplicate column IDs
// ---------------------------------------------------------------------------

test('validate rejects project with duplicate column IDs', () => {
  const controller = createAgentProjectController();
  const project = makeProject('dup-columns-project', {
    workflowColumns: [
      { id: 'todo', displayName: 'To Do', color: '#888888' },
      { id: 'todo', displayName: 'Also To Do', color: '#999999' },
      { id: 'done', displayName: 'Done', color: '#0e8a16' }
    ]
  });
  const result = controller.validate(project);

  assert.equal(result.valid, false, 'project with duplicate column IDs must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /duplicate|column/i.test(e)),
    'at least one error must mention duplicate column IDs'
  );
});

// ---------------------------------------------------------------------------
// 7. getWorkflowColumns — returns columns in order
// ---------------------------------------------------------------------------

test('getWorkflowColumns returns columns from spec with order preserved', () => {
  const controller = createAgentProjectController();
  const columns = [
    { id: 'backlog', displayName: 'Backlog', color: '#cccccc' },
    { id: 'todo', displayName: 'To Do', color: '#888888', default: true },
    { id: 'doing', displayName: 'Doing', color: '#0075ca' },
    { id: 'done', displayName: 'Done', color: '#0e8a16' }
  ];
  const project = makeProject('ordered-project', { workflowColumns: columns });
  const result = controller.getWorkflowColumns(project);

  assert.ok(Array.isArray(result), 'getWorkflowColumns must return an array');
  assert.equal(result.length, 4, 'must return all four columns');
  assert.equal(result[0].id, 'backlog', 'first column must be backlog');
  assert.equal(result[1].id, 'todo', 'second column must be todo');
  assert.equal(result[2].id, 'doing', 'third column must be doing');
  assert.equal(result[3].id, 'done', 'fourth column must be done');
});

// ---------------------------------------------------------------------------
// 8. getDefaultColumn — returns marked default or first column
// ---------------------------------------------------------------------------

test('getDefaultColumn returns the column marked as default', () => {
  const controller = createAgentProjectController();
  const project = makeProject('default-col-project', {
    workflowColumns: [
      { id: 'todo', displayName: 'To Do', color: '#888888' },
      { id: 'in-progress', displayName: 'In Progress', color: '#0075ca', default: true },
      { id: 'done', displayName: 'Done', color: '#0e8a16' }
    ]
  });
  const col = controller.getDefaultColumn(project);

  assert.ok(col, 'getDefaultColumn must return a column');
  assert.equal(col.id, 'in-progress', 'must return the column marked as default');
});

test('getDefaultColumn returns first column when none is marked as default', () => {
  const controller = createAgentProjectController();
  const project = makeProject('no-default-col-project', {
    workflowColumns: [
      { id: 'backlog', displayName: 'Backlog', color: '#cccccc' },
      { id: 'todo', displayName: 'To Do', color: '#888888' },
      { id: 'done', displayName: 'Done', color: '#0e8a16' }
    ]
  });
  const col = controller.getDefaultColumn(project);

  assert.ok(col, 'getDefaultColumn must return a column');
  assert.equal(col.id, 'backlog', 'must return first column when no default is marked');
});

// ---------------------------------------------------------------------------
// 9. getBoardState — default is 'active'
// ---------------------------------------------------------------------------

test('getBoardState returns "active" by default when boardState is not set', () => {
  const controller = createAgentProjectController();
  const project = makeProject('active-project');
  const state = controller.getBoardState(project);

  assert.equal(state, 'active', 'getBoardState must return "active" by default');
});

// ---------------------------------------------------------------------------
// 10. getBoardState — returns spec.boardState when set
// ---------------------------------------------------------------------------

test('getBoardState returns spec.boardState when explicitly set', () => {
  const controller = createAgentProjectController();
  const project = makeProject('archived-project', { boardState: 'archived' });
  const state = controller.getBoardState(project);

  assert.equal(state, 'archived', 'getBoardState must return the spec boardState value');
});

// ---------------------------------------------------------------------------
// 11. validate — null resource
// ---------------------------------------------------------------------------

test('validate rejects null resource with a clear error', () => {
  const controller = createAgentProjectController();
  const result = controller.validate(null);

  assert.equal(result.valid, false, 'null resource must fail validation');
  assert.ok(result.errors.length > 0, 'errors array must not be empty');
  assert.ok(
    result.errors.some((e) => /null|undefined/i.test(e)),
    'error must mention null or undefined'
  );
});

// ---------------------------------------------------------------------------
// 12. BOUNDARY exported with correct role
// ---------------------------------------------------------------------------

test('AGENT_PROJECT_CONTROLLER_BOUNDARY is exported and has correct role', () => {
  assert.ok(AGENT_PROJECT_CONTROLLER_BOUNDARY, 'BOUNDARY must be exported');
  assert.equal(
    AGENT_PROJECT_CONTROLLER_BOUNDARY.role,
    'agent-project-controller',
    'BOUNDARY role must be "agent-project-controller"'
  );
  assert.ok(
    Array.isArray(AGENT_PROJECT_CONTROLLER_BOUNDARY.owns),
    'BOUNDARY must declare owned concerns'
  );
});

// ---------------------------------------------------------------------------
// 13. validateAgentProject — standalone export
// ---------------------------------------------------------------------------

test('validateAgentProject exported as standalone function follows existing pattern', () => {
  assert.equal(typeof validateAgentProject, 'function', 'validateAgentProject must be a named export');

  const project = makeProject('standalone-validate-project');
  const result = validateAgentProject(project);

  assert.ok(result, 'validateAgentProject must return a result');
  assert.ok('valid' in result, 'result must have a valid property');
  assert.ok(Array.isArray(result.errors), 'result must have an errors array');
  assert.equal(result.valid, true, 'a fully-specified project must pass standalone validation');
});

// ---------------------------------------------------------------------------
// 14. validate — missing workflowColumns field entirely
// ---------------------------------------------------------------------------

test('validate rejects project with no workflowColumns field', () => {
  const controller = createAgentProjectController();
  const project = makeProject('missing-cols-project');
  delete project.spec.workflowColumns;
  const result = controller.validate(project);

  assert.equal(result.valid, false, 'project missing workflowColumns must fail validation');
  assert.ok(
    result.errors.some((e) => /workflowColumns/i.test(e)),
    'at least one error must mention "workflowColumns"'
  );
});

// ---------------------------------------------------------------------------
// 15. getWorkflowColumns — returns empty array when no spec
// ---------------------------------------------------------------------------

test('getWorkflowColumns handles resource with no spec gracefully', () => {
  const controller = createAgentProjectController();
  const resource = {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'KrateProject',
    metadata: { name: 'spec-less-project', namespace: 'krate-org-default', labels: {}, annotations: {} },
    status: {}
  };
  const result = controller.getWorkflowColumns(resource);

  assert.ok(Array.isArray(result), 'getWorkflowColumns must return an array');
  assert.equal(result.length, 0, 'must return empty array when spec is absent');
});
