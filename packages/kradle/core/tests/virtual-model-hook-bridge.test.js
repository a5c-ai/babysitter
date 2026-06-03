import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createVirtualModelHookBridge,
  VIRTUAL_MODEL_HOOK_TYPES,
  VIRTUAL_MODEL_HOOK_BRIDGE_BOUNDARY,
  createVirtualModelController,
  createResource,
  createEventBus,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Virtual Model Hook Bridge Tests
//
// Verifies the bridge between KradleVirtualModel CRD hooks and the agent-mux
// hook dispatcher, including model matching, hook type mapping, and result
// format conversion.
// ---------------------------------------------------------------------------

function makeVirtualModel(name, overrides = {}) {
  return createResource('KradleVirtualModel', { name, namespace: 'kradle-org-default' }, {
    organizationRef: 'default',
    modelName: `model-${name}`,
    routes: [
      { modelRouteRef: 'route-primary', weight: 80 },
      { modelRouteRef: 'route-secondary', weight: 20 }
    ],
    ...overrides
  });
}

// ---------------------------------------------------------------------------
// 1. Factory and shape
// ---------------------------------------------------------------------------

test('createVirtualModelHookBridge returns bridge with expected methods', () => {
  const bridge = createVirtualModelHookBridge();
  assert.ok(bridge, 'bridge must be truthy');
  assert.equal(typeof bridge.matchVirtualModel, 'function', 'must expose matchVirtualModel');
  assert.equal(typeof bridge.handleHook, 'function', 'must expose handleHook');
  assert.ok(Array.isArray(bridge.hookTypes), 'must expose hookTypes array');
  assert.equal(bridge.role, 'virtual-model-hook-bridge', 'must declare its role');
});

// ---------------------------------------------------------------------------
// 2. VIRTUAL_MODEL_HOOK_BRIDGE_BOUNDARY exported correctly
// ---------------------------------------------------------------------------

test('VIRTUAL_MODEL_HOOK_BRIDGE_BOUNDARY is exported with correct role', () => {
  assert.ok(VIRTUAL_MODEL_HOOK_BRIDGE_BOUNDARY, 'BOUNDARY must be exported');
  assert.equal(VIRTUAL_MODEL_HOOK_BRIDGE_BOUNDARY.role, 'virtual-model-hook-bridge');
  assert.ok(Array.isArray(VIRTUAL_MODEL_HOOK_BRIDGE_BOUNDARY.owns));
  assert.ok(VIRTUAL_MODEL_HOOK_BRIDGE_BOUNDARY.owns.includes('virtual model matching'));
  assert.ok(Array.isArray(VIRTUAL_MODEL_HOOK_BRIDGE_BOUNDARY.mustNotOwn));
  assert.ok(VIRTUAL_MODEL_HOOK_BRIDGE_BOUNDARY.mustNotOwn.includes('hook dispatch orchestration'));
});

// ---------------------------------------------------------------------------
// 3. VIRTUAL_MODEL_HOOK_TYPES exported correctly
// ---------------------------------------------------------------------------

test('VIRTUAL_MODEL_HOOK_TYPES contains all expected hook types', () => {
  assert.ok(Array.isArray(VIRTUAL_MODEL_HOOK_TYPES), 'must be an array');
  assert.equal(VIRTUAL_MODEL_HOOK_TYPES.length, 11, 'must have 11 hook types');
  assert.ok(VIRTUAL_MODEL_HOOK_TYPES.includes('VirtualModel.PreModelResolution'));
  assert.ok(VIRTUAL_MODEL_HOOK_TYPES.includes('VirtualModel.PreCompletion'));
  assert.ok(VIRTUAL_MODEL_HOOK_TYPES.includes('VirtualModel.PostCompletion'));
  assert.ok(VIRTUAL_MODEL_HOOK_TYPES.includes('VirtualModel.PreToolUse'));
  assert.ok(VIRTUAL_MODEL_HOOK_TYPES.includes('VirtualModel.PostToolUse'));
  assert.ok(VIRTUAL_MODEL_HOOK_TYPES.includes('VirtualModel.TurnEnd'));
  assert.ok(VIRTUAL_MODEL_HOOK_TYPES.includes('VirtualModel.SessionStart'));
  assert.ok(VIRTUAL_MODEL_HOOK_TYPES.includes('VirtualModel.SessionEnd'));
  assert.ok(VIRTUAL_MODEL_HOOK_TYPES.includes('VirtualModel.UserPromptSubmit'));
  assert.ok(VIRTUAL_MODEL_HOOK_TYPES.includes('VirtualModel.OnError'));
  assert.ok(VIRTUAL_MODEL_HOOK_TYPES.includes('VirtualModel.OnCompact'));
});

// ---------------------------------------------------------------------------
// 4. matchVirtualModel finds by modelName
// ---------------------------------------------------------------------------

test('matchVirtualModel finds virtual model by spec.modelName', () => {
  const bridge = createVirtualModelHookBridge();
  const vm1 = makeVirtualModel('alpha');
  const vm2 = makeVirtualModel('beta');
  const matched = bridge.matchVirtualModel('model-beta', [vm1, vm2]);
  assert.ok(matched, 'should find a match');
  assert.equal(matched.metadata.name, 'beta');
});

// ---------------------------------------------------------------------------
// 5. matchVirtualModel returns null for non-matching
// ---------------------------------------------------------------------------

test('matchVirtualModel returns null when no model matches', () => {
  const bridge = createVirtualModelHookBridge();
  const vm1 = makeVirtualModel('alpha');
  const matched = bridge.matchVirtualModel('model-missing', [vm1]);
  assert.equal(matched, null, 'should return null for non-matching');
});

test('matchVirtualModel returns null for empty array', () => {
  const bridge = createVirtualModelHookBridge();
  const matched = bridge.matchVirtualModel('model-alpha', []);
  assert.equal(matched, null, 'should return null for empty array');
});

test('matchVirtualModel returns null for null inputs', () => {
  const bridge = createVirtualModelHookBridge();
  assert.equal(bridge.matchVirtualModel(null, []), null);
  assert.equal(bridge.matchVirtualModel('model', null), null);
});

// ---------------------------------------------------------------------------
// 6. handleHook PreModelResolution with rules returns modify
// ---------------------------------------------------------------------------

test('handleHook PreModelResolution with rules returns modify decision', () => {
  const bridge = createVirtualModelHookBridge();
  const vm = makeVirtualModel('routed', {
    rules: [
      {
        name: 'region-rule',
        conditions: [{ field: 'region', operator: 'eq', value: 'us-east' }],
        action: { route: 'route-us-east' }
      }
    ]
  });
  const result = bridge.handleHook('VirtualModel.PreModelResolution', {
    data: { requestContext: { region: 'us-east' } }
  }, vm);
  assert.equal(result.decision, 'modify');
  assert.equal(result.modifiedInput.modelId, 'route-us-east');
});

// ---------------------------------------------------------------------------
// 7. handleHook PreCompletion with transform hook returns modified request
// ---------------------------------------------------------------------------

test('handleHook PreCompletion with transform hook returns modified request', () => {
  const bridge = createVirtualModelHookBridge();
  const vm = makeVirtualModel('transform', {
    hooks: {
      requestTransform: 'return { ...args.request, injected: true };'
    }
  });
  const result = bridge.handleHook('VirtualModel.PreCompletion', {
    data: { request: { model: 'gpt-4', prompt: 'hello' }, context: {} }
  }, vm);
  assert.equal(result.decision, 'modify');
  assert.ok(result.modifiedInput.request.injected, 'should have injected field');
  assert.equal(result.modifiedInput.request.model, 'gpt-4');
});

// ---------------------------------------------------------------------------
// 8. handleHook PostCompletion with transform hook returns modified response
// ---------------------------------------------------------------------------

test('handleHook PostCompletion with transform hook returns modified response', () => {
  const bridge = createVirtualModelHookBridge();
  const vm = makeVirtualModel('resp-transform', {
    hooks: {
      responseTransform: 'return { ...args.response, filtered: true };'
    }
  });
  const result = bridge.handleHook('VirtualModel.PostCompletion', {
    data: { response: { text: 'hello world' }, context: {} }
  }, vm);
  assert.equal(result.decision, 'modify');
  assert.ok(result.modifiedInput.response.filtered, 'should have filtered field');
  assert.equal(result.modifiedInput.response.text, 'hello world');
});

// ---------------------------------------------------------------------------
// 9. handleHook PreToolUse deny via hook
// ---------------------------------------------------------------------------

test('handleHook PreToolUse deny via hook', () => {
  const bridge = createVirtualModelHookBridge();
  const vm = makeVirtualModel('tool-deny', {
    hooks: {
      onPreToolUse: 'return { allow: false };'
    }
  });
  const result = bridge.handleHook('VirtualModel.PreToolUse', {
    data: { toolCall: { name: 'dangerous_tool' }, session: {} }
  }, vm);
  assert.equal(result.decision, 'deny');
});

// ---------------------------------------------------------------------------
// 10. handleHook PreToolUse allow by default
// ---------------------------------------------------------------------------

test('handleHook PreToolUse allow by default (no hook defined)', () => {
  const bridge = createVirtualModelHookBridge();
  const vm = makeVirtualModel('tool-allow');
  const result = bridge.handleHook('VirtualModel.PreToolUse', {
    data: { toolCall: { name: 'safe_tool' }, session: {} }
  }, vm);
  assert.equal(result.decision, 'allow');
});

// ---------------------------------------------------------------------------
// 11. handleHook UserPromptSubmit deny via hook
// ---------------------------------------------------------------------------

test('handleHook UserPromptSubmit deny via hook', () => {
  const bridge = createVirtualModelHookBridge();
  const vm = makeVirtualModel('prompt-deny', {
    hooks: {
      onUserPromptSubmit: 'return { block: true };'
    }
  });
  const result = bridge.handleHook('VirtualModel.UserPromptSubmit', {
    data: { prompt: 'DROP TABLE users;', session: {} }
  }, vm);
  assert.equal(result.decision, 'deny');
  assert.ok(result.message, 'should include a deny message');
});

// ---------------------------------------------------------------------------
// 12. handleHook UserPromptSubmit modify via hook
// ---------------------------------------------------------------------------

test('handleHook UserPromptSubmit modify via hook', () => {
  const bridge = createVirtualModelHookBridge();
  const vm = makeVirtualModel('prompt-modify', {
    hooks: {
      onUserPromptSubmit: 'return { block: false, modified: args.prompt + " [sanitized]" };'
    }
  });
  const result = bridge.handleHook('VirtualModel.UserPromptSubmit', {
    data: { prompt: 'hello', session: {} }
  }, vm);
  assert.equal(result.decision, 'modify');
  assert.equal(result.modifiedInput.prompt, 'hello [sanitized]');
});

// ---------------------------------------------------------------------------
// 13. handleHook OnError returns retry
// ---------------------------------------------------------------------------

test('handleHook OnError returns retry with fallback route', () => {
  const bridge = createVirtualModelHookBridge();
  const vm = makeVirtualModel('error-retry', {
    hooks: {
      onError: 'return { retry: true, fallbackRoute: "route-fallback" };'
    }
  });
  const result = bridge.handleHook('VirtualModel.OnError', {
    data: { error: { code: 503, message: 'Service unavailable' }, session: {} }
  }, vm);
  assert.equal(result.decision, 'modify');
  assert.equal(result.modifiedInput.retry, true);
  assert.equal(result.modifiedInput.fallbackRoute, 'route-fallback');
});

// ---------------------------------------------------------------------------
// 14. handleHook SessionStart/End return allow
// ---------------------------------------------------------------------------

test('handleHook SessionStart returns allow', () => {
  const eventBus = createEventBus();
  const bridge = createVirtualModelHookBridge({ eventBus });
  const vm = makeVirtualModel('session-start');
  const result = bridge.handleHook('VirtualModel.SessionStart', {
    data: { session: { id: 'sess-1' } }
  }, vm);
  assert.equal(result.decision, 'allow');
});

test('handleHook SessionEnd returns allow', () => {
  const eventBus = createEventBus();
  const bridge = createVirtualModelHookBridge({ eventBus });
  const vm = makeVirtualModel('session-end');
  const result = bridge.handleHook('VirtualModel.SessionEnd', {
    data: { session: { id: 'sess-1', turnCount: 5 } }
  }, vm);
  assert.equal(result.decision, 'allow');
});

// ---------------------------------------------------------------------------
// 15. handleHook with unknown type returns allow
// ---------------------------------------------------------------------------

test('handleHook with unknown type returns allow', () => {
  const bridge = createVirtualModelHookBridge();
  const vm = makeVirtualModel('unknown');
  const result = bridge.handleHook('VirtualModel.UnknownHook', {
    data: {}
  }, vm);
  assert.equal(result.decision, 'allow');
});

// ---------------------------------------------------------------------------
// 16. handleHook with null virtual model returns allow
// ---------------------------------------------------------------------------

test('handleHook with null virtual model returns allow', () => {
  const bridge = createVirtualModelHookBridge();
  const result = bridge.handleHook('VirtualModel.PreCompletion', {
    data: { request: { model: 'test' } }
  }, null);
  assert.equal(result.decision, 'allow');
});

// ---------------------------------------------------------------------------
// 17. handleHook TurnEnd returns action
// ---------------------------------------------------------------------------

test('handleHook TurnEnd returns allow with action', () => {
  const bridge = createVirtualModelHookBridge();
  const vm = makeVirtualModel('turn-end', {
    hooks: {
      onTurnEnd: 'return { action: "escalate" };'
    }
  });
  const result = bridge.handleHook('VirtualModel.TurnEnd', {
    data: { turn: { index: 3 }, session: { turnCount: 3 } }
  }, vm);
  assert.equal(result.decision, 'allow');
  assert.equal(result.modifiedInput.action, 'escalate');
});

// ---------------------------------------------------------------------------
// 18. handleHook OnCompact with modification
// ---------------------------------------------------------------------------

test('handleHook OnCompact with modification returns modify', () => {
  const bridge = createVirtualModelHookBridge();
  const vm = makeVirtualModel('compact-mod', {
    hooks: {
      onCompact: 'return { modified: args.summary + " [compacted]" };'
    }
  });
  const result = bridge.handleHook('VirtualModel.OnCompact', {
    data: { summary: 'conversation so far', session: {} }
  }, vm);
  assert.equal(result.decision, 'modify');
  assert.equal(result.modifiedInput.summary, 'conversation so far [compacted]');
});

// ---------------------------------------------------------------------------
// 19. handleHook OnCompact without modification returns allow
// ---------------------------------------------------------------------------

test('handleHook OnCompact without modification returns allow', () => {
  const bridge = createVirtualModelHookBridge();
  const vm = makeVirtualModel('compact-noop');
  const result = bridge.handleHook('VirtualModel.OnCompact', {
    data: { summary: 'conversation', session: {} }
  }, vm);
  assert.equal(result.decision, 'allow');
});

// ---------------------------------------------------------------------------
// 20. handleHook PostToolUse with modification
// ---------------------------------------------------------------------------

test('handleHook PostToolUse with modification returns modify', () => {
  const bridge = createVirtualModelHookBridge();
  const vm = makeVirtualModel('post-tool-mod', {
    hooks: {
      onPostToolUse: 'return { modified: "sanitized output" };'
    }
  });
  const result = bridge.handleHook('VirtualModel.PostToolUse', {
    data: { toolCall: { name: 'read' }, toolResult: 'raw output', session: {} }
  }, vm);
  assert.equal(result.decision, 'modify');
  assert.equal(result.modifiedInput.result, 'sanitized output');
});

// ---------------------------------------------------------------------------
// 21. Bridge accepts custom controller
// ---------------------------------------------------------------------------

test('createVirtualModelHookBridge accepts custom controller', () => {
  const controller = createVirtualModelController({ eventBus: createEventBus() });
  const bridge = createVirtualModelHookBridge({ controller });
  assert.ok(bridge, 'bridge should be created with custom controller');
  assert.equal(bridge.role, 'virtual-model-hook-bridge');
});
