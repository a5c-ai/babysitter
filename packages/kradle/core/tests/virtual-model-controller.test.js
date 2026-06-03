import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createVirtualModelController,
  validateVirtualModel,
  createResource,
  createEventBus,
  VIRTUAL_MODEL_CONTROLLER_BOUNDARY
} from '../src/index.js';

// ---------------------------------------------------------------------------
// KradleVirtualModel Controller Tests
//
// A KradleVirtualModel provides a programmable model abstraction with declarative
// routing rules, JS hooks for request/response transformation, session lifecycle
// management, and observability injection.
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

function makeModelRoute(name) {
  return {
    kind: 'KradleModelRoute',
    metadata: { name, namespace: 'kradle-org-default' },
    spec: { organizationRef: 'default', modelName: name, routeType: 'external' }
  };
}

// ---------------------------------------------------------------------------
// 1. Factory and shape
// ---------------------------------------------------------------------------

test('createVirtualModelController returns controller with expected methods', () => {
  const controller = createVirtualModelController();
  assert.ok(controller, 'controller must be truthy');
  assert.equal(typeof controller.validate, 'function', 'must expose validate');
  assert.equal(typeof controller.evaluateRules, 'function', 'must expose evaluateRules');
  assert.equal(typeof controller.executeHook, 'function', 'must expose executeHook');
  assert.equal(typeof controller.resolveRoute, 'function', 'must expose resolveRoute');
  assert.equal(typeof controller.transformRequest, 'function', 'must expose transformRequest');
  assert.equal(typeof controller.transformResponse, 'function', 'must expose transformResponse');
  assert.equal(typeof controller.handleSessionEvent, 'function', 'must expose handleSessionEvent');
  assert.equal(typeof controller.emitObservability, 'function', 'must expose emitObservability');
  assert.equal(typeof controller.reconcileVirtualModels, 'function', 'must expose reconcileVirtualModels');
  assert.equal(controller.role, 'virtual-model-controller', 'must declare its role');
});

// ---------------------------------------------------------------------------
// 2. VIRTUAL_MODEL_CONTROLLER_BOUNDARY exported correctly
// ---------------------------------------------------------------------------

test('VIRTUAL_MODEL_CONTROLLER_BOUNDARY is exported with correct role', () => {
  assert.ok(VIRTUAL_MODEL_CONTROLLER_BOUNDARY, 'BOUNDARY must be exported');
  assert.equal(VIRTUAL_MODEL_CONTROLLER_BOUNDARY.role, 'virtual-model-controller', 'role must match');
  assert.ok(Array.isArray(VIRTUAL_MODEL_CONTROLLER_BOUNDARY.owns), 'must declare owned concerns');
  assert.ok(VIRTUAL_MODEL_CONTROLLER_BOUNDARY.owns.includes('virtual model validation'), 'must own validation');
  assert.ok(VIRTUAL_MODEL_CONTROLLER_BOUNDARY.owns.includes('route resolution'), 'must own route resolution');
  assert.ok(Array.isArray(VIRTUAL_MODEL_CONTROLLER_BOUNDARY.mustNotOwn), 'must declare mustNotOwn');
  assert.ok(VIRTUAL_MODEL_CONTROLLER_BOUNDARY.mustNotOwn.includes('secret values'), 'must not own secret values');
});

// ---------------------------------------------------------------------------
// 3. validate — accepts valid virtual model
// ---------------------------------------------------------------------------

test('validate accepts valid virtual model', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('valid');
  const result = controller.validate(vm);

  assert.equal(result.valid, true, 'valid virtual model must pass validation');
  assert.equal(result.errors.length, 0, 'errors array must be empty');
});

// ---------------------------------------------------------------------------
// 4. validate — rejects null resource
// ---------------------------------------------------------------------------

test('validate rejects null resource', () => {
  const controller = createVirtualModelController();
  const result = controller.validate(null);

  assert.equal(result.valid, false, 'null resource must fail validation');
  assert.ok(result.errors.some(e => /null|undefined/i.test(e)), 'error must mention null or undefined');
});

// ---------------------------------------------------------------------------
// 5. validate — rejects missing organizationRef
// ---------------------------------------------------------------------------

test('validate rejects missing organizationRef', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('no-org');
  delete vm.spec.organizationRef;
  const result = controller.validate(vm);

  assert.equal(result.valid, false, 'missing organizationRef must fail');
  assert.ok(result.errors.some(e => /organizationRef/i.test(e)), 'error must mention organizationRef');
});

// ---------------------------------------------------------------------------
// 6. validate — rejects missing modelName
// ---------------------------------------------------------------------------

test('validate rejects missing modelName', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('no-model');
  delete vm.spec.modelName;
  const result = controller.validate(vm);

  assert.equal(result.valid, false, 'missing modelName must fail');
  assert.ok(result.errors.some(e => /modelName/i.test(e)), 'error must mention modelName');
});

// ---------------------------------------------------------------------------
// 7. validate — rejects missing routes
// ---------------------------------------------------------------------------

test('validate rejects missing routes', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('no-routes');
  delete vm.spec.routes;
  const result = controller.validate(vm);

  assert.equal(result.valid, false, 'missing routes must fail');
  assert.ok(result.errors.some(e => /routes/i.test(e)), 'error must mention routes');
});

// ---------------------------------------------------------------------------
// 8. validate — rejects empty routes array
// ---------------------------------------------------------------------------

test('validate rejects empty routes array', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('empty-routes', { routes: [] });
  const result = controller.validate(vm);

  assert.equal(result.valid, false, 'empty routes must fail');
  assert.ok(result.errors.some(e => /routes/i.test(e)), 'error must mention routes');
});

// ---------------------------------------------------------------------------
// 9. validate — rejects route without modelRouteRef
// ---------------------------------------------------------------------------

test('validate rejects route without modelRouteRef', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('bad-route', {
    routes: [{ weight: 100 }]
  });
  const result = controller.validate(vm);

  assert.equal(result.valid, false, 'route without modelRouteRef must fail');
  assert.ok(result.errors.some(e => /modelRouteRef/i.test(e)), 'error must mention modelRouteRef');
});

// ---------------------------------------------------------------------------
// 10. validate — rejects rule with invalid operator
// ---------------------------------------------------------------------------

test('validate rejects rule with invalid operator', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('bad-rule', {
    rules: [{
      name: 'bad-op',
      conditions: [{ field: 'tokenCount', operator: 'invalid', value: 100 }],
      action: { route: 'route-a' }
    }]
  });
  const result = controller.validate(vm);

  assert.equal(result.valid, false, 'invalid operator must fail');
  assert.ok(result.errors.some(e => /operator/i.test(e)), 'error must mention operator');
});

// ---------------------------------------------------------------------------
// 11. validate — validates rules with missing action.route
// ---------------------------------------------------------------------------

test('validate rejects rule with missing action.route', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('no-action', {
    rules: [{
      name: 'no-route',
      conditions: [{ field: 'tokenCount', operator: 'gt', value: 100 }],
      action: {}
    }]
  });
  const result = controller.validate(vm);

  assert.equal(result.valid, false, 'missing action.route must fail');
  assert.ok(result.errors.some(e => /action\.route/i.test(e)), 'error must mention action.route');
});

// ---------------------------------------------------------------------------
// 12. evaluateRules — returns matching rule
// ---------------------------------------------------------------------------

test('evaluateRules returns matching rule for eq operator', () => {
  const controller = createVirtualModelController();
  const rules = [{
    name: 'premium-user',
    conditions: [{ field: 'userRole', operator: 'eq', value: 'premium' }],
    action: { route: 'route-premium' }
  }];
  const result = controller.evaluateRules(rules, { userRole: 'premium' });

  assert.ok(result, 'must return a result');
  assert.equal(result.matched, true, 'must be matched');
  assert.equal(result.routeRef, 'route-premium', 'must return correct route');
  assert.equal(result.ruleName, 'premium-user', 'must return rule name');
});

// ---------------------------------------------------------------------------
// 13. evaluateRules — returns null when no rules match
// ---------------------------------------------------------------------------

test('evaluateRules returns null when no rules match', () => {
  const controller = createVirtualModelController();
  const rules = [{
    name: 'high-token',
    conditions: [{ field: 'tokenCount', operator: 'gt', value: 1000 }],
    action: { route: 'route-large' }
  }];
  const result = controller.evaluateRules(rules, { tokenCount: 500 });

  assert.equal(result, null, 'must return null when no rules match');
});

// ---------------------------------------------------------------------------
// 14. evaluateRules — supports all comparison operators
// ---------------------------------------------------------------------------

test('evaluateRules supports gt, lt, gte, lte operators', () => {
  const controller = createVirtualModelController();

  // gt
  assert.ok(controller.evaluateRules(
    [{ name: 'r', conditions: [{ field: 'x', operator: 'gt', value: 5 }], action: { route: 'r' } }],
    { x: 10 }
  )?.matched, 'gt must match');

  // lt
  assert.ok(controller.evaluateRules(
    [{ name: 'r', conditions: [{ field: 'x', operator: 'lt', value: 10 }], action: { route: 'r' } }],
    { x: 5 }
  )?.matched, 'lt must match');

  // gte
  assert.ok(controller.evaluateRules(
    [{ name: 'r', conditions: [{ field: 'x', operator: 'gte', value: 5 }], action: { route: 'r' } }],
    { x: 5 }
  )?.matched, 'gte must match on equal');

  // lte
  assert.ok(controller.evaluateRules(
    [{ name: 'r', conditions: [{ field: 'x', operator: 'lte', value: 10 }], action: { route: 'r' } }],
    { x: 10 }
  )?.matched, 'lte must match on equal');
});

// ---------------------------------------------------------------------------
// 15. evaluateRules — supports neq, in, contains, matches operators
// ---------------------------------------------------------------------------

test('evaluateRules supports neq, in, contains, matches operators', () => {
  const controller = createVirtualModelController();

  // neq
  assert.ok(controller.evaluateRules(
    [{ name: 'r', conditions: [{ field: 'x', operator: 'neq', value: 'a' }], action: { route: 'r' } }],
    { x: 'b' }
  )?.matched, 'neq must match');

  // in
  assert.ok(controller.evaluateRules(
    [{ name: 'r', conditions: [{ field: 'x', operator: 'in', value: ['a', 'b', 'c'] }], action: { route: 'r' } }],
    { x: 'b' }
  )?.matched, 'in must match');

  // contains
  assert.ok(controller.evaluateRules(
    [{ name: 'r', conditions: [{ field: 'x', operator: 'contains', value: 'world' }], action: { route: 'r' } }],
    { x: 'hello world' }
  )?.matched, 'contains must match');

  // matches
  assert.ok(controller.evaluateRules(
    [{ name: 'r', conditions: [{ field: 'x', operator: 'matches', value: '^test-\\d+$' }], action: { route: 'r' } }],
    { x: 'test-42' }
  )?.matched, 'matches must match');
});

// ---------------------------------------------------------------------------
// 16. evaluateRules — returns null for empty or null input
// ---------------------------------------------------------------------------

test('evaluateRules returns null for empty or null input', () => {
  const controller = createVirtualModelController();

  assert.equal(controller.evaluateRules([], {}), null, 'empty rules returns null');
  assert.equal(controller.evaluateRules(null, {}), null, 'null rules returns null');
  assert.equal(controller.evaluateRules([{ name: 'r', conditions: [{ field: 'x', operator: 'eq', value: 1 }], action: { route: 'r' } }], null), null, 'null context returns null');
});

// ---------------------------------------------------------------------------
// 17. executeHook — executes a JS hook body and returns result
// ---------------------------------------------------------------------------

test('executeHook executes JS hook body and returns result', () => {
  const controller = createVirtualModelController();
  const result = controller.executeHook('test', 'return args.x + args.y', { x: 2, y: 3 }, {});

  assert.equal(result, 5, 'must return computed result');
});

// ---------------------------------------------------------------------------
// 18. executeHook — returns null on error
// ---------------------------------------------------------------------------

test('executeHook returns null on syntax error', () => {
  const controller = createVirtualModelController();
  const result = controller.executeHook('test', 'this is not valid JS {{{', {}, {});

  assert.equal(result, null, 'must return null on error');
});

// ---------------------------------------------------------------------------
// 19. executeHook — returns null for empty/null hookBody
// ---------------------------------------------------------------------------

test('executeHook returns null for empty or null hookBody', () => {
  const controller = createVirtualModelController();

  assert.equal(controller.executeHook('test', null, {}, {}), null, 'null hookBody returns null');
  assert.equal(controller.executeHook('test', '', {}, {}), null, 'empty hookBody returns null');
});

// ---------------------------------------------------------------------------
// 20. resolveRoute — evaluates rules first
// ---------------------------------------------------------------------------

test('resolveRoute evaluates rules first (priority 1)', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('rules-first', {
    rules: [{
      name: 'high-token-rule',
      conditions: [{ field: 'tokenCount', operator: 'gt', value: 1000 }],
      action: { route: 'route-large-model' }
    }]
  });

  const result = controller.resolveRoute(vm, { tokenCount: 2000 });

  assert.equal(result.routeRef, 'route-large-model', 'must use rule-matched route');
  assert.equal(result.appliedRule, 'high-token-rule', 'must identify which rule was applied');
});

// ---------------------------------------------------------------------------
// 21. resolveRoute — executes routeSelect hook (priority 2)
// ---------------------------------------------------------------------------

test('resolveRoute executes routeSelect hook when no rules match', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('hook-select', {
    hooks: {
      routeSelect: 'return "route-hook-selected"'
    }
  });

  const result = controller.resolveRoute(vm, { tokenCount: 100 });

  assert.equal(result.routeRef, 'route-hook-selected', 'must use hook-selected route');
  assert.equal(result.appliedHook, true, 'must indicate hook was applied');
});

// ---------------------------------------------------------------------------
// 22. resolveRoute — uses weighted random (priority 3)
// ---------------------------------------------------------------------------

test('resolveRoute falls through to weighted random when no rules or hooks match', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('weighted');

  const result = controller.resolveRoute(vm, {});

  assert.ok(result.routeRef, 'must select a route via weighted random');
  assert.ok(['route-primary', 'route-secondary'].includes(result.routeRef), 'must be one of the configured routes');
  assert.equal(result.appliedRule, undefined, 'no rule should be applied');
  assert.equal(result.appliedHook, undefined, 'no hook should be applied');
});

// ---------------------------------------------------------------------------
// 23. resolveRoute — uses fallbackChain (priority 4)
// ---------------------------------------------------------------------------

test('resolveRoute uses fallbackChain when routes are empty', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('fallback', {
    routes: [{ modelRouteRef: '', weight: 100 }],
    fallbackChain: ['route-fallback-1', 'route-fallback-2']
  });
  // Clear the routes so weighted random cannot pick
  vm.spec.routes = [];

  const result = controller.resolveRoute(vm, {});

  assert.equal(result.routeRef, 'route-fallback-1', 'must use first fallback');
  assert.equal(result.fallbackUsed, true, 'must indicate fallback was used');
});

// ---------------------------------------------------------------------------
// 24. resolveRoute — returns null when model is disabled
// ---------------------------------------------------------------------------

test('resolveRoute returns null routeRef when model is disabled', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('disabled', { enabled: false });

  const result = controller.resolveRoute(vm, {});

  assert.equal(result.routeRef, null, 'disabled model must return null routeRef');
});

// ---------------------------------------------------------------------------
// 25. transformRequest — applies requestTransform hook
// ---------------------------------------------------------------------------

test('transformRequest applies requestTransform hook', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('transform-req', {
    hooks: {
      requestTransform: 'return { ...args.request, transformed: true }'
    }
  });

  const result = controller.transformRequest(vm, { prompt: 'hello' }, {});

  assert.equal(result.prompt, 'hello', 'must preserve original fields');
  assert.equal(result.transformed, true, 'must apply transformation');
});

// ---------------------------------------------------------------------------
// 26. transformRequest — returns original on no hook
// ---------------------------------------------------------------------------

test('transformRequest returns original request when no hook defined', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('no-transform');
  const request = { prompt: 'hello' };

  const result = controller.transformRequest(vm, request, {});

  assert.deepEqual(result, request, 'must return original request');
});

// ---------------------------------------------------------------------------
// 27. transformResponse — applies responseTransform hook
// ---------------------------------------------------------------------------

test('transformResponse applies responseTransform hook', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('transform-resp', {
    hooks: {
      responseTransform: 'return { ...args.response, filtered: true }'
    }
  });

  const result = controller.transformResponse(vm, { content: 'world' }, {});

  assert.equal(result.content, 'world', 'must preserve original fields');
  assert.equal(result.filtered, true, 'must apply transformation');
});

// ---------------------------------------------------------------------------
// 28. handleSessionEvent — terminates on maxTurns exceeded
// ---------------------------------------------------------------------------

test('handleSessionEvent terminates when maxTurns exceeded', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('session-max', {
    sessionConfig: { enabled: true, maxTurns: 5 }
  });

  const result = controller.handleSessionEvent(vm, 'turnEnd', { turnCount: 5 });

  assert.equal(result.action, 'terminate', 'must terminate when maxTurns exceeded');
});

// ---------------------------------------------------------------------------
// 29. handleSessionEvent — escalates on threshold exceeded
// ---------------------------------------------------------------------------

test('handleSessionEvent escalates when escalationThreshold exceeded', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('session-escalate', {
    sessionConfig: { enabled: true, maxTurns: 100, escalationThreshold: 50000 }
  });

  const result = controller.handleSessionEvent(vm, 'turnEnd', { turnCount: 3, totalTokens: 60000 });

  assert.equal(result.action, 'escalate', 'must escalate when threshold exceeded');
});

// ---------------------------------------------------------------------------
// 30. handleSessionEvent — continues normally
// ---------------------------------------------------------------------------

test('handleSessionEvent returns continue for normal session', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('session-ok', {
    sessionConfig: { enabled: true, maxTurns: 100 }
  });

  const result = controller.handleSessionEvent(vm, 'turnEnd', { turnCount: 3, totalTokens: 1000 });

  assert.equal(result.action, 'continue', 'must continue for normal session');
});

// ---------------------------------------------------------------------------
// 31. handleSessionEvent — executes sessionLifecycle hook
// ---------------------------------------------------------------------------

test('handleSessionEvent executes sessionLifecycle hook', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('session-hook', {
    sessionConfig: { enabled: true, maxTurns: 100 },
    hooks: {
      sessionLifecycle: 'return { action: "reroute", nextRoute: "route-premium" }'
    }
  });

  const result = controller.handleSessionEvent(vm, 'escalation', { turnCount: 3, totalTokens: 1000 });

  assert.equal(result.action, 'reroute', 'must use hook result action');
  assert.equal(result.nextRoute, 'route-premium', 'must use hook result nextRoute');
});

// ---------------------------------------------------------------------------
// 32. emitObservability — emits to event bus
// ---------------------------------------------------------------------------

test('emitObservability emits event to event bus', () => {
  const bus = createEventBus();
  const controller = createVirtualModelController({ eventBus: bus });
  const vm = makeVirtualModel('observe');

  let emitted = null;
  bus.subscribe(event => { emitted = event; });

  controller.emitObservability(vm, 'request-completed', { latencyMs: 150, tokenCount: 500 });

  assert.ok(emitted, 'must emit an event');
  assert.equal(emitted.type, 'virtual-model-observability', 'event type must match');
  assert.equal(emitted.kind, 'KradleVirtualModel', 'kind must match');
  assert.equal(emitted.modelName, 'model-observe', 'modelName must match');
  assert.equal(emitted.event, 'request-completed', 'event name must match');
  assert.equal(emitted.metrics.latencyMs, 150, 'metrics must be included');
  assert.ok(emitted.timestamp, 'timestamp must be present');
});

// ---------------------------------------------------------------------------
// 33. reconcileVirtualModels — marks valid models as ready
// ---------------------------------------------------------------------------

test('reconcileVirtualModels marks valid models as VirtualModelReady True', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('ready');
  const routes = [makeModelRoute('route-primary'), makeModelRoute('route-secondary')];

  const { conditions, resolvedModels } = controller.reconcileVirtualModels([vm], routes);

  assert.equal(conditions.length, 1, 'must have one condition');
  assert.equal(conditions[0].status, 'True', 'status must be True');
  assert.equal(conditions[0].reason, 'Reconciled', 'reason must be Reconciled');
  assert.equal(resolvedModels.length, 1, 'must have one resolved model');
  assert.equal(resolvedModels[0].routeCount, 2, 'must have 2 routes');
});

// ---------------------------------------------------------------------------
// 34. reconcileVirtualModels — marks invalid models as not ready
// ---------------------------------------------------------------------------

test('reconcileVirtualModels marks invalid models as VirtualModelReady False', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('invalid');
  delete vm.spec.modelName;

  const { conditions, resolvedModels } = controller.reconcileVirtualModels([vm], []);

  assert.equal(conditions.length, 1, 'must have one condition');
  assert.equal(conditions[0].status, 'False', 'status must be False');
  assert.equal(conditions[0].reason, 'ValidationFailed', 'reason must be ValidationFailed');
  assert.equal(resolvedModels.length, 0, 'must have no resolved models');
});

// ---------------------------------------------------------------------------
// 35. KradleVirtualModel can be created via createResource
// ---------------------------------------------------------------------------

test('KradleVirtualModel can be created via createResource', () => {
  const resource = createResource('KradleVirtualModel', { name: 'test-vm', namespace: 'kradle-org-default' }, {
    organizationRef: 'default',
    modelName: 'gpt-4o-virtual',
    routes: [{ modelRouteRef: 'route-a', weight: 100 }]
  });

  assert.equal(resource.kind, 'KradleVirtualModel', 'kind must match');
  assert.equal(resource.apiVersion, 'kradle.a5c.ai/v1alpha1', 'apiVersion must match');
  assert.equal(resource.spec.modelName, 'gpt-4o-virtual', 'modelName must be set');
  assert.ok(Array.isArray(resource.spec.routes), 'routes must be an array');
});

// ---------------------------------------------------------------------------
// 36. validateVirtualModel standalone export works
// ---------------------------------------------------------------------------

test('validateVirtualModel standalone export works', () => {
  assert.equal(typeof validateVirtualModel, 'function', 'must be a named export');
  const vm = makeVirtualModel('standalone');
  const result = validateVirtualModel(vm);
  assert.equal(result.valid, true, 'valid vm must pass standalone validation');
});

// ---------------------------------------------------------------------------
// 37. validate accumulates multiple errors
// ---------------------------------------------------------------------------

test('validate accumulates multiple errors at once', () => {
  const controller = createVirtualModelController();
  const vm = {
    apiVersion: 'kradle.a5c.ai/v1alpha1',
    kind: 'KradleVirtualModel',
    metadata: { name: 'multi-error', namespace: 'default', labels: {}, annotations: {} },
    spec: {},
    status: {}
  };
  const result = controller.validate(vm);

  assert.equal(result.valid, false, 'must fail validation');
  assert.ok(result.errors.length >= 3, 'must have at least 3 errors (orgRef, modelName, routes)');
  assert.ok(result.errors.some(e => /organizationRef/i.test(e)), 'must mention organizationRef');
  assert.ok(result.errors.some(e => /modelName/i.test(e)), 'must mention modelName');
  assert.ok(result.errors.some(e => /routes/i.test(e)), 'must mention routes');
});

// ---------------------------------------------------------------------------
// 38. evaluateRules — multiple conditions must all match (AND logic)
// ---------------------------------------------------------------------------

test('evaluateRules requires all conditions to match (AND logic)', () => {
  const controller = createVirtualModelController();
  const rules = [{
    name: 'multi-condition',
    conditions: [
      { field: 'userRole', operator: 'eq', value: 'premium' },
      { field: 'tokenCount', operator: 'gt', value: 1000 }
    ],
    action: { route: 'route-premium-large' }
  }];

  // Both match
  const match = controller.evaluateRules(rules, { userRole: 'premium', tokenCount: 2000 });
  assert.ok(match?.matched, 'both conditions met must match');

  // Only one matches
  const noMatch = controller.evaluateRules(rules, { userRole: 'premium', tokenCount: 500 });
  assert.equal(noMatch, null, 'partial conditions must not match');
});

// ---------------------------------------------------------------------------
// 39. transformResponse — returns original on hook error
// ---------------------------------------------------------------------------

test('transformResponse returns original response on hook error', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('bad-transform', {
    hooks: { responseTransform: 'throw new Error("boom")' }
  });
  const response = { content: 'original' };

  const result = controller.transformResponse(vm, response, {});

  assert.deepEqual(result, response, 'must return original response on error');
});

// ---------------------------------------------------------------------------
// 40. resolveRoute — returns null when no routes, rules, hooks, or fallback
// ---------------------------------------------------------------------------

test('resolveRoute returns null routeRef when all resolution paths exhausted', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('exhausted');
  vm.spec.routes = [];
  delete vm.spec.fallbackChain;

  const result = controller.resolveRoute(vm, {});

  assert.equal(result.routeRef, null, 'must return null when all paths exhausted');
});

// ---------------------------------------------------------------------------
// 41. validate — accepts valid sessionConfig
// ---------------------------------------------------------------------------

test('validate accepts valid sessionConfig', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('session-valid', {
    sessionConfig: { enabled: true, maxTurns: 10, escalationThreshold: 50000, stateFields: ['topic'] }
  });
  const result = controller.validate(vm);

  assert.equal(result.valid, true, 'valid sessionConfig must pass');
});

// ---------------------------------------------------------------------------
// 42. validate — rejects invalid sessionConfig.maxTurns
// ---------------------------------------------------------------------------

test('validate rejects invalid sessionConfig.maxTurns', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('session-bad', {
    sessionConfig: { enabled: true, maxTurns: -1 }
  });
  const result = controller.validate(vm);

  assert.equal(result.valid, false, 'negative maxTurns must fail');
  assert.ok(result.errors.some(e => /maxTurns/i.test(e)), 'error must mention maxTurns');
});

// ── Agentic Lifecycle Hook Tests ──────────────────────────────────────────

test('fireSessionStart emits event and runs hook', () => {
  const events = [];
  const bus = createEventBus();
  bus.subscribe((e) => events.push(e));
  const controller = createVirtualModelController({ eventBus: bus });
  const vm = makeVirtualModel('sess-start', { hooks: { onSessionStart: 'return undefined;' } });
  controller.fireSessionStart(vm, { id: 's1' });
  assert.ok(events.some(e => e.type === 'virtual-model-session-start'));
});

test('fireSessionEnd emits event with turn count', () => {
  const events = [];
  const bus = createEventBus();
  bus.subscribe((e) => events.push(e));
  const controller = createVirtualModelController({ eventBus: bus });
  const vm = makeVirtualModel('sess-end');
  controller.fireSessionEnd(vm, { id: 's1', turnCount: 5 });
  const ev = events.find(e => e.type === 'virtual-model-session-end');
  assert.ok(ev);
  assert.equal(ev.turns, 5);
});

test('fireTurnEnd returns action from hook', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('turn-end', { hooks: { onTurnEnd: 'return { action: "escalate" };' } });
  const result = controller.fireTurnEnd(vm, { turnNumber: 3 }, { id: 's1' });
  assert.equal(result.action, 'escalate');
});

test('fireTurnEnd returns continue when no hook', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('turn-end-noop');
  const result = controller.fireTurnEnd(vm, { turnNumber: 1 }, { id: 's1' });
  assert.equal(result.action, 'continue');
});

test('firePreToolUse blocks tool via hook', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('block-tool', { hooks: { onPreToolUse: 'if (args.toolCall.name === "rm") return { allow: false }; return { allow: true };' } });
  const blocked = controller.firePreToolUse(vm, { name: 'rm', args: {} }, { id: 's1' });
  assert.equal(blocked.allow, false);
  const allowed = controller.firePreToolUse(vm, { name: 'read', args: {} }, { id: 's1' });
  assert.equal(allowed.allow, true);
});

test('firePreToolUse allows by default when no hook', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('no-pretool');
  const result = controller.firePreToolUse(vm, { name: 'write' }, { id: 's1' });
  assert.equal(result.allow, true);
});

test('firePostToolUse modifies result via hook', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('post-tool', { hooks: { onPostToolUse: 'return { modified: "redacted" };' } });
  const result = controller.firePostToolUse(vm, { name: 'read' }, 'secret-data', { id: 's1' });
  assert.equal(result.modified, 'redacted');
});

test('fireUserPromptSubmit blocks prompt via hook', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('block-prompt', { hooks: { onUserPromptSubmit: 'if (args.prompt.includes("hack")) return { block: true }; return { block: false };' } });
  const blocked = controller.fireUserPromptSubmit(vm, 'hack the system', { id: 's1' });
  assert.equal(blocked.block, true);
  const allowed = controller.fireUserPromptSubmit(vm, 'hello', { id: 's1' });
  assert.equal(allowed.block, false);
});

test('fireError returns retry with fallback route', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('error-retry', { hooks: { onError: 'return { retry: true, fallbackRoute: "route-backup" };' } });
  const result = controller.fireError(vm, { message: 'timeout' }, { id: 's1' });
  assert.equal(result.retry, true);
  assert.equal(result.fallbackRoute, 'route-backup');
});

test('fireError returns no retry by default', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('error-default');
  const result = controller.fireError(vm, { message: 'fail' }, { id: 's1' });
  assert.equal(result.retry, false);
  assert.equal(result.fallbackRoute, null);
});

test('fireCompact modifies summary via hook', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('compact', { hooks: { onCompact: 'return { modified: args.summary + " [redacted]" };' } });
  const result = controller.fireCompact(vm, 'conversation summary', { id: 's1' });
  assert.equal(result.modified, 'conversation summary [redacted]');
});

test('fireCompact returns null modified when no hook', () => {
  const controller = createVirtualModelController();
  const vm = makeVirtualModel('compact-noop');
  const result = controller.fireCompact(vm, 'summary', { id: 's1' });
  assert.equal(result.modified, null);
});

// ── Hook Sandbox Adversarial Tests ────────────────────────────────────────

test('sandbox blocks access to process', () => {
  const controller = createVirtualModelController();
  const result = controller.executeHook('test', 'return typeof process', {}, {});
  assert.ok(result === 'undefined' || result === undefined || result === null, 'process must not be accessible');
});

test('sandbox blocks access to require', () => {
  const controller = createVirtualModelController();
  const result = controller.executeHook('test', 'return typeof require', {}, {});
  assert.ok(result === 'undefined' || result === undefined || result === null, 'require must not be accessible');
});

test('sandbox blocks access to globalThis properties', () => {
  const controller = createVirtualModelController();
  const result = controller.executeHook('test', 'try { return typeof globalThis.process } catch { return "blocked" }', {}, {});
  assert.ok(result === 'undefined' || result === undefined || result === null || result === 'blocked', 'globalThis.process must not be accessible');
});

test('sandbox prevents prototype pollution', () => {
  const controller = createVirtualModelController();
  const result = controller.executeHook('test', 'try { args.__proto__.polluted = true; return args.polluted } catch { return null }', { clean: true }, {});
  assert.ok(result === undefined || result === null, 'prototype pollution must be blocked (args are frozen)');
});

test('sandbox enforces timeout on infinite loops', () => {
  const controller = createVirtualModelController();
  const result = controller.executeHook('test', 'while(true){}', {}, {});
  assert.equal(result, null, 'infinite loop must timeout and return null');
});

test('sandbox blocks constructor escape', () => {
  const controller = createVirtualModelController();
  const result = controller.executeHook('test', 'try { return this.constructor.constructor("return process")() } catch { return null }', {}, {});
  assert.equal(result, null, 'constructor escape must be blocked');
});
