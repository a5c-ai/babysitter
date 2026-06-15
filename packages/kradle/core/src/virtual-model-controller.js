// KradleVirtualModel Controller
// Programmable model abstraction with declarative routing rules, JS hooks for
// request/response transformation, session lifecycle management, and
// observability injection.

import { globalEventBus } from './event-bus.js';
import vm from 'node:vm';

export const VIRTUAL_MODEL_CONTROLLER_BOUNDARY = {
  role: 'virtual-model-controller',
  scope: 'Programmable model abstraction with declarative routing rules, JS hooks, session lifecycle, and observability',
  owns: ['virtual model validation', 'rule evaluation', 'hook execution', 'route resolution', 'session lifecycle', 'observability emission'],
  delegatesTo: ['resource-model', 'model-route-controller', 'event-bus'],
  mustNotOwn: ['secret values', 'gateway deployment', 'network policy', 'actual model invocation']
};

const VALID_OPERATORS = ['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'in', 'contains', 'matches'];

/**
 * Evaluate a single condition against a request context value.
 * @param {{ field: string, operator: string, value: * }} condition
 * @param {object} requestContext
 * @returns {boolean}
 */
function evaluateCondition(condition, requestContext) {
  const actual = requestContext[condition.field];
  const expected = condition.value;

  switch (condition.operator) {
    case 'eq': return actual === expected;
    case 'neq': return actual !== expected;
    case 'gt': return actual > expected;
    case 'lt': return actual < expected;
    case 'gte': return actual >= expected;
    case 'lte': return actual <= expected;
    case 'in': return Array.isArray(expected) && expected.includes(actual);
    case 'contains': return typeof actual === 'string' && actual.includes(expected);
    case 'matches': {
      try { return new RegExp(expected).test(String(actual)); }
      catch { return false; }
    }
    default: return false;
  }
}

/**
 * Select a route via weighted random from the routes array.
 * @param {Array<{ modelRouteRef: string, weight: number }>} routes
 * @returns {string|null} modelRouteRef
 */
function weightedRandomSelect(routes) {
  if (!Array.isArray(routes) || routes.length === 0) return null;
  const totalWeight = routes.reduce((sum, r) => sum + (r.weight || 1), 0);
  if (totalWeight <= 0) return routes[0].modelRouteRef || null;
  let rand = Math.random() * totalWeight;
  for (const route of routes) {
    rand -= (route.weight || 1);
    if (rand <= 0) return route.modelRouteRef;
  }
  return routes[routes.length - 1].modelRouteRef;
}

/**
 * Validate a KradleVirtualModel resource. Returns { valid, errors }.
 * @param {object} resource
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateVirtualModel(resource) {
  const errors = [];

  if (resource == null) {
    errors.push('resource must not be null or undefined');
    return { valid: false, errors };
  }

  if (!resource?.metadata?.name) {
    errors.push('metadata.name is required');
  }

  const spec = resource?.spec || {};

  if (!spec.organizationRef) {
    errors.push('spec.organizationRef is required');
  }

  if (!spec.modelName) {
    errors.push('spec.modelName is required');
  }

  if (!Array.isArray(spec.routes) || spec.routes.length === 0) {
    errors.push('spec.routes is required and must be a non-empty array');
  } else {
    for (let i = 0; i < spec.routes.length; i++) {
      const route = spec.routes[i];
      if (!route.modelRouteRef) {
        errors.push(`spec.routes[${i}].modelRouteRef is required`);
      }
      if (route.weight !== undefined && (typeof route.weight !== 'number' || route.weight < 0)) {
        errors.push(`spec.routes[${i}].weight must be a non-negative number`);
      }
    }
  }

  // Validate rules if present
  if (spec.rules && Array.isArray(spec.rules)) {
    for (let i = 0; i < spec.rules.length; i++) {
      const rule = spec.rules[i];
      if (!rule.name) {
        errors.push(`spec.rules[${i}].name is required`);
      }
      if (!Array.isArray(rule.conditions) || rule.conditions.length === 0) {
        errors.push(`spec.rules[${i}].conditions must be a non-empty array`);
      } else {
        for (let j = 0; j < rule.conditions.length; j++) {
          const cond = rule.conditions[j];
          if (!cond.field) {
            errors.push(`spec.rules[${i}].conditions[${j}].field is required`);
          }
          if (!cond.operator || !VALID_OPERATORS.includes(cond.operator)) {
            errors.push(`spec.rules[${i}].conditions[${j}].operator must be one of: ${VALID_OPERATORS.join(', ')}`);
          }
        }
      }
      if (!rule.action || !rule.action.route) {
        errors.push(`spec.rules[${i}].action.route is required`);
      }
    }
  }

  // Validate sessionConfig if present
  if (spec.sessionConfig) {
    if (spec.sessionConfig.maxTurns !== undefined && (typeof spec.sessionConfig.maxTurns !== 'number' || spec.sessionConfig.maxTurns < 1)) {
      errors.push('spec.sessionConfig.maxTurns must be a positive number');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Factory that returns a KradleVirtualModel controller instance.
 * @param {object} [options]
 * @returns {object}
 */
export function createVirtualModelController(options = {}) {
  const eventBus = options.eventBus || globalEventBus;

  return {
    role: 'virtual-model-controller',

    /**
     * Validate a KradleVirtualModel resource.
     * @param {object} resource
     * @returns {{ valid: boolean, errors: string[] }}
     */
    validate(resource) {
      return validateVirtualModel(resource);
    },

    /**
     * Evaluate rules against a request context.
     * Returns the first matching rule's route, or null if none match.
     *
     * @param {Array<{ name: string, conditions: Array<{ field: string, operator: string, value: * }>, action: { route: string } }>} rules
     * @param {object} requestContext
     * @returns {{ matched: boolean, routeRef: string, ruleName: string }|null}
     */
    evaluateRules(rules, requestContext) {
      if (!Array.isArray(rules) || rules.length === 0) return null;
      if (!requestContext || typeof requestContext !== 'object') return null;

      for (const rule of rules) {
        if (!Array.isArray(rule.conditions)) continue;

        const allMatch = rule.conditions.every(cond => evaluateCondition(cond, requestContext));
        if (allMatch) {
          return {
            matched: true,
            routeRef: rule.action?.route || null,
            ruleName: rule.name || 'unnamed'
          };
        }
      }

      return null;
    },

    /**
     * Execute a JS hook body in a sandboxed Function constructor.
     * Returns the result or null on error.
     *
     * @param {string} hookType - e.g. 'routeSelect', 'requestTransform'
     * @param {string} hookBody - JS function body as string
     * @param {object} args - arguments to pass to the hook
     * @param {object} context - execution context
     * @returns {*} result or null on error
     */
    executeHook(hookType, hookBody, args, context) {
      if (!hookBody || typeof hookBody !== 'string') return null;

      try {
        const safeArgs = JSON.parse(JSON.stringify(args || {}));
        const safeCtx = JSON.parse(JSON.stringify(context || {}));
        Object.setPrototypeOf(safeArgs, null);
        Object.setPrototypeOf(safeCtx, null);
        Object.freeze(safeArgs);
        Object.freeze(safeCtx);
        const sandbox = Object.create(null);
        sandbox.args = safeArgs;
        sandbox.context = safeCtx;
        sandbox.result = null;
        sandbox.JSON = JSON;
        sandbox.Math = Math;
        sandbox.Date = Date;
        sandbox.parseInt = parseInt;
        sandbox.parseFloat = parseFloat;
        sandbox.isNaN = isNaN;
        sandbox.isFinite = isFinite;
        sandbox.encodeURIComponent = encodeURIComponent;
        sandbox.decodeURIComponent = decodeURIComponent;
        const script = new vm.Script(`result = (function(args, context) { "use strict"; ${hookBody} })(args, context);`);
        const vmContext = vm.createContext(sandbox);
        script.runInContext(vmContext, { timeout: 3000 });
        return sandbox.result;
      } catch (err) {
        console.warn(`[virtual-model-controller] hook execution error (${hookType}): ${err.message}`);
        return null;
      }
    },

    /**
     * Resolve which route to use for a virtual model given a request context.
     * Resolution order:
     *   1. Evaluate declarative rules
     *   2. Execute routeSelect hook
     *   3. Weighted random from routes array
     *   4. Try fallbackChain
     *
     * @param {object} virtualModel - KradleVirtualModel resource
     * @param {object} requestContext
     * @param {object[]} [resources] - cluster resources for route lookup
     * @returns {{ routeRef: string|null, appliedRule?: string, appliedHook?: boolean, fallbackUsed?: boolean }}
     */
    resolveRoute(virtualModel, requestContext, resources = []) {
      const spec = virtualModel?.spec || {};

      // Check if model is disabled
      if (spec.enabled === false) {
        return { routeRef: null };
      }

      // 1. Evaluate declarative rules
      if (spec.rules && Array.isArray(spec.rules)) {
        const ruleResult = this.evaluateRules(spec.rules, requestContext);
        if (ruleResult && ruleResult.matched) {
          return {
            routeRef: ruleResult.routeRef,
            appliedRule: ruleResult.ruleName
          };
        }
      }

      // 2. Execute routeSelect hook
      if (spec.hooks?.routeSelect) {
        const hookResult = this.executeHook('routeSelect', spec.hooks.routeSelect, {
          routes: spec.routes,
          requestContext
        }, { resources });
        if (hookResult && typeof hookResult === 'string') {
          return {
            routeRef: hookResult,
            appliedHook: true
          };
        }
      }

      // 3. Weighted random from routes
      if (Array.isArray(spec.routes) && spec.routes.length > 0) {
        const enabledRoutes = spec.routes.filter(r => r.modelRouteRef);
        const routeRef = weightedRandomSelect(enabledRoutes);
        if (routeRef) {
          return { routeRef };
        }
      }

      // 4. Try fallbackChain
      if (Array.isArray(spec.fallbackChain)) {
        for (const fallbackRef of spec.fallbackChain) {
          if (fallbackRef) {
            return {
              routeRef: fallbackRef,
              fallbackUsed: true
            };
          }
        }
      }

      return { routeRef: null };
    },

    /**
     * Transform an outbound request using the requestTransform hook.
     *
     * @param {object} virtualModel
     * @param {object} request
     * @param {object} context
     * @returns {object} modified request (or original on error)
     */
    transformRequest(virtualModel, request, context) {
      const hookBody = virtualModel?.spec?.hooks?.requestTransform;
      if (!hookBody) return request;

      const result = this.executeHook('requestTransform', hookBody, { request }, context);
      if (result && typeof result === 'object') return result;
      return request;
    },

    /**
     * Transform an inbound response using the responseTransform hook.
     *
     * @param {object} virtualModel
     * @param {object} response
     * @param {object} context
     * @returns {object} modified response (or original on error)
     */
    transformResponse(virtualModel, response, context) {
      const hookBody = virtualModel?.spec?.hooks?.responseTransform;
      if (!hookBody) return response;

      const result = this.executeHook('responseTransform', hookBody, { response }, context);
      if (result && typeof result === 'object') return result;
      return response;
    },

    /**
     * Handle a session lifecycle event (turn started, turn ended, escalation, etc.).
     *
     * @param {object} virtualModel
     * @param {string} event - event type ('turnStart', 'turnEnd', 'escalation')
     * @param {object} session - current session state
     * @returns {{ action: string, nextRoute?: string }}
     */
    handleSessionEvent(virtualModel, event, session) {
      const sessionConfig = virtualModel?.spec?.sessionConfig;
      const hookBody = virtualModel?.spec?.hooks?.sessionLifecycle;

      // Check maxTurns
      if (sessionConfig?.enabled && sessionConfig?.maxTurns) {
        const turnCount = session?.turnCount || 0;
        if (turnCount >= sessionConfig.maxTurns) {
          return { action: 'terminate' };
        }
      }

      // Check escalation threshold
      if (sessionConfig?.enabled && sessionConfig?.escalationThreshold) {
        const totalTokens = session?.totalTokens || 0;
        if (totalTokens >= sessionConfig.escalationThreshold) {
          return { action: 'escalate' };
        }
      }

      // Execute session lifecycle hook
      if (hookBody) {
        const result = this.executeHook('sessionLifecycle', hookBody, { event, session }, {
          sessionConfig: sessionConfig || {}
        });
        if (result && typeof result === 'object' && result.action) {
          return result;
        }
      }

      return { action: 'continue' };
    },

    /**
     * Emit observability data via the event bus.
     *
     * @param {object} virtualModel
     * @param {string} event - event type
     * @param {object} metrics - metric data
     */
    emitObservability(virtualModel, event, metrics) {
      const hookBody = virtualModel?.spec?.hooks?.observe;

      // Execute observe hook (side-effect only)
      if (hookBody) {
        this.executeHook('observe', hookBody, { event, metrics }, {
          modelName: virtualModel?.spec?.modelName
        });
      }

      // Always emit to event bus
      eventBus.emit({
        type: 'virtual-model-observability',
        kind: 'KradleVirtualModel',
        name: virtualModel?.metadata?.name || 'unknown',
        modelName: virtualModel?.spec?.modelName || 'unknown',
        event,
        metrics: metrics || {},
        timestamp: new Date().toISOString()
      });
    },

    // ── Agentic Lifecycle Hooks ─────────────────────────────────────────────

    fireSessionStart(virtualModel, session) {
      const hookBody = virtualModel?.spec?.hooks?.onSessionStart;
      if (hookBody) this.executeHook('onSessionStart', hookBody, { session }, { modelName: virtualModel?.spec?.modelName });
      eventBus.emit({ type: 'virtual-model-session-start', kind: 'KradleVirtualModel', name: virtualModel?.metadata?.name, modelName: virtualModel?.spec?.modelName, sessionId: session?.id, timestamp: new Date().toISOString() });
    },

    fireSessionEnd(virtualModel, session) {
      const hookBody = virtualModel?.spec?.hooks?.onSessionEnd;
      if (hookBody) this.executeHook('onSessionEnd', hookBody, { session }, { modelName: virtualModel?.spec?.modelName });
      eventBus.emit({ type: 'virtual-model-session-end', kind: 'KradleVirtualModel', name: virtualModel?.metadata?.name, modelName: virtualModel?.spec?.modelName, sessionId: session?.id, turns: session?.turnCount, timestamp: new Date().toISOString() });
    },

    fireTurnEnd(virtualModel, turn, session) {
      const hookBody = virtualModel?.spec?.hooks?.onTurnEnd;
      if (hookBody) {
        const result = this.executeHook('onTurnEnd', hookBody, { turn, session }, { modelName: virtualModel?.spec?.modelName });
        if (result && typeof result === 'object') return result;
      }
      return { action: 'continue' };
    },

    firePreToolUse(virtualModel, toolCall, session) {
      const hookBody = virtualModel?.spec?.hooks?.onPreToolUse;
      if (hookBody) {
        const result = this.executeHook('onPreToolUse', hookBody, { toolCall, session }, { modelName: virtualModel?.spec?.modelName });
        if (result && typeof result === 'object') return { allow: result.allow !== false, modified: result.modified || null };
      }
      return { allow: true, modified: null };
    },

    firePostToolUse(virtualModel, toolCall, toolResult, session) {
      const hookBody = virtualModel?.spec?.hooks?.onPostToolUse;
      if (hookBody) {
        const result = this.executeHook('onPostToolUse', hookBody, { toolCall, result: toolResult, session }, { modelName: virtualModel?.spec?.modelName });
        if (result && typeof result === 'object') return { modified: result.modified || null };
      }
      return { modified: null };
    },

    fireUserPromptSubmit(virtualModel, prompt, session) {
      const hookBody = virtualModel?.spec?.hooks?.onUserPromptSubmit;
      if (hookBody) {
        const result = this.executeHook('onUserPromptSubmit', hookBody, { prompt, session }, { modelName: virtualModel?.spec?.modelName });
        if (result && typeof result === 'object') return { block: !!result.block, modified: result.modified || null };
      }
      return { block: false, modified: null };
    },

    fireError(virtualModel, error, session) {
      const hookBody = virtualModel?.spec?.hooks?.onError;
      if (hookBody) {
        const result = this.executeHook('onError', hookBody, { error, session }, { modelName: virtualModel?.spec?.modelName });
        if (result && typeof result === 'object') return { retry: !!result.retry, fallbackRoute: result.fallbackRoute || null };
      }
      return { retry: false, fallbackRoute: null };
    },

    fireCompact(virtualModel, summary, session) {
      const hookBody = virtualModel?.spec?.hooks?.onCompact;
      if (hookBody) {
        const result = this.executeHook('onCompact', hookBody, { summary, session }, { modelName: virtualModel?.spec?.modelName });
        if (result && typeof result === 'object') return { modified: result.modified || null };
      }
      return { modified: null };
    },

    /**
     * Reconcile a set of virtual models, resolving routes and producing conditions.
     *
     * @param {object[]} virtualModels - array of KradleVirtualModel resources
     * @param {object[]} [resources] - all cluster resources
     * @returns {{ conditions: object[], resolvedModels: object[] }}
     */
    reconcileVirtualModels(virtualModels, resources = []) {
      const conditions = [];
      const resolvedModels = [];

      for (const vm of virtualModels) {
        const validation = validateVirtualModel(vm);
        if (!validation.valid) {
          conditions.push({
            type: 'VirtualModelReady',
            status: 'False',
            name: vm?.metadata?.name,
            reason: 'ValidationFailed',
            message: validation.errors.join('; ')
          });
          continue;
        }

        const spec = vm?.spec || {};
        const routeRefs = (spec.routes || []).map(r => r.modelRouteRef).filter(Boolean);

        // Check that referenced routes exist
        const missingRoutes = routeRefs.filter(ref =>
          !resources.some(r => r.kind === 'KradleModelRoute' && r.metadata?.name === ref)
        );

        if (missingRoutes.length > 0 && resources.length > 0) {
          conditions.push({
            type: 'VirtualModelReady',
            status: 'False',
            name: vm.metadata?.name,
            reason: 'RoutesNotFound',
            message: `Missing routes: ${missingRoutes.join(', ')}`
          });
          continue;
        }

        conditions.push({
          type: 'VirtualModelReady',
          status: 'True',
          name: vm.metadata?.name,
          reason: 'Reconciled',
          message: `Virtual model "${vm.metadata?.name}" resolved with ${routeRefs.length} route(s)`
        });

        resolvedModels.push({
          name: vm.metadata?.name,
          modelName: spec.modelName,
          routeCount: routeRefs.length,
          rulesCount: spec.rules?.length || 0,
          hooksEnabled: !!spec.hooks,
          sessionEnabled: !!spec.sessionConfig?.enabled,
          enabled: spec.enabled !== false
        });
      }

      return { conditions, resolvedModels };
    }
  };
}
