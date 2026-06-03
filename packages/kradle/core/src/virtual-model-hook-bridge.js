// Virtual Model Hook Bridge
// Bridges KradleVirtualModel CRD hooks to the agent-mux hook dispatcher.

import { createVirtualModelController } from './virtual-model-controller.js';

export const VIRTUAL_MODEL_HOOK_BRIDGE_BOUNDARY = {
  role: 'virtual-model-hook-bridge',
  scope: 'Bridge between KradleVirtualModel CRD hooks and agent-mux hook dispatcher',
  owns: ['virtual model matching', 'hook type mapping', 'result format conversion'],
  delegatesTo: ['virtual-model-controller', 'resource-model'],
  mustNotOwn: ['hook dispatch orchestration', 'model invocation']
};

export const VIRTUAL_MODEL_HOOK_TYPES = [
  'VirtualModel.PreModelResolution',
  'VirtualModel.PreCompletion',
  'VirtualModel.PostCompletion',
  'VirtualModel.PreToolUse',
  'VirtualModel.PostToolUse',
  'VirtualModel.TurnEnd',
  'VirtualModel.SessionStart',
  'VirtualModel.SessionEnd',
  'VirtualModel.UserPromptSubmit',
  'VirtualModel.OnError',
  'VirtualModel.OnCompact',
];

/**
 * Find a virtual model whose spec.modelName matches the given modelName.
 * @param {string} modelName
 * @param {object[]} virtualModels
 * @returns {object|null}
 */
function matchVirtualModel(modelName, virtualModels) {
  if (!modelName || !Array.isArray(virtualModels)) return null;
  for (const vm of virtualModels) {
    if (vm?.spec?.modelName === modelName) return vm;
  }
  return null;
}

/**
 * Handle a hook invocation by mapping it to the appropriate controller method
 * and converting the result to UnifiedHookResult format.
 *
 * @param {string} hookType - One of VIRTUAL_MODEL_HOOK_TYPES
 * @param {object} payload - The hook payload data
 * @param {object|null} virtualModel - The matched KradleVirtualModel resource
 * @param {object} controller - The virtual model controller instance
 * @returns {{ decision: string, modifiedInput?: object, message?: string }}
 */
function handleHook(hookType, payload, virtualModel, controller) {
  if (!virtualModel) {
    return { decision: 'allow' };
  }

  switch (hookType) {
    case 'VirtualModel.PreModelResolution': {
      const requestContext = payload?.data?.requestContext || payload?.data || {};
      const resources = payload?.data?.resources || [];
      const result = controller.resolveRoute(virtualModel, requestContext, resources);
      if (result.routeRef) {
        return { decision: 'modify', modifiedInput: { modelId: result.routeRef } };
      }
      return { decision: 'allow' };
    }

    case 'VirtualModel.PreCompletion': {
      const request = payload?.data?.request || {};
      const context = payload?.data?.context || {};
      const transformed = controller.transformRequest(virtualModel, request, context);
      if (transformed !== request) {
        return { decision: 'modify', modifiedInput: { request: transformed } };
      }
      return { decision: 'allow' };
    }

    case 'VirtualModel.PostCompletion': {
      const response = payload?.data?.response || {};
      const context = payload?.data?.context || {};
      const transformed = controller.transformResponse(virtualModel, response, context);
      if (transformed !== response) {
        return { decision: 'modify', modifiedInput: { response: transformed } };
      }
      return { decision: 'allow' };
    }

    case 'VirtualModel.PreToolUse': {
      const toolCall = payload?.data?.toolCall || payload?.data?.tool_input || {};
      const session = payload?.data?.session || {};
      const result = controller.firePreToolUse(virtualModel, toolCall, session);
      return { decision: result.allow ? 'allow' : 'deny' };
    }

    case 'VirtualModel.PostToolUse': {
      const toolCall = payload?.data?.toolCall || {};
      const toolResult = payload?.data?.toolResult || payload?.data?.tool_output || {};
      const session = payload?.data?.session || {};
      const result = controller.firePostToolUse(virtualModel, toolCall, toolResult, session);
      if (result.modified) {
        return { decision: 'modify', modifiedInput: { result: result.modified } };
      }
      return { decision: 'allow' };
    }

    case 'VirtualModel.TurnEnd': {
      const turn = payload?.data?.turn || {};
      const session = payload?.data?.session || {};
      const result = controller.fireTurnEnd(virtualModel, turn, session);
      return { decision: 'allow', modifiedInput: { action: result.action } };
    }

    case 'VirtualModel.SessionStart': {
      const session = payload?.data?.session || {};
      controller.fireSessionStart(virtualModel, session);
      return { decision: 'allow' };
    }

    case 'VirtualModel.SessionEnd': {
      const session = payload?.data?.session || {};
      controller.fireSessionEnd(virtualModel, session);
      return { decision: 'allow' };
    }

    case 'VirtualModel.UserPromptSubmit': {
      const prompt = payload?.data?.prompt || payload?.data?.message || '';
      const session = payload?.data?.session || {};
      const result = controller.fireUserPromptSubmit(virtualModel, prompt, session);
      if (result.block) {
        return { decision: 'deny', message: 'Blocked by virtual model hook' };
      }
      if (result.modified) {
        return { decision: 'modify', modifiedInput: { prompt: result.modified } };
      }
      return { decision: 'allow' };
    }

    case 'VirtualModel.OnError': {
      const error = payload?.data?.error || {};
      const session = payload?.data?.session || {};
      const result = controller.fireError(virtualModel, error, session);
      return { decision: 'modify', modifiedInput: { retry: result.retry, fallbackRoute: result.fallbackRoute } };
    }

    case 'VirtualModel.OnCompact': {
      const summary = payload?.data?.summary || {};
      const session = payload?.data?.session || {};
      const result = controller.fireCompact(virtualModel, summary, session);
      if (result.modified) {
        return { decision: 'modify', modifiedInput: { summary: result.modified } };
      }
      return { decision: 'allow' };
    }

    default:
      return { decision: 'allow' };
  }
}

/**
 * Create a virtual model hook bridge instance.
 *
 * @param {object} [options]
 * @param {object} [options.controller] - Virtual model controller (created if not supplied)
 * @param {object} [options.eventBus] - Event bus for the controller
 * @returns {{ matchVirtualModel: Function, handleHook: Function, hookTypes: string[] }}
 */
export function createVirtualModelHookBridge(options = {}) {
  const controller = options.controller || createVirtualModelController({
    eventBus: options.eventBus
  });

  return {
    role: 'virtual-model-hook-bridge',

    /**
     * Find a virtual model by modelName.
     * @param {string} modelName
     * @param {object[]} virtualModels
     * @returns {object|null}
     */
    matchVirtualModel(modelName, virtualModels) {
      return matchVirtualModel(modelName, virtualModels);
    },

    /**
     * Handle a hook invocation.
     * @param {string} hookType
     * @param {object} payload
     * @param {object|null} virtualModel
     * @returns {{ decision: string, modifiedInput?: object, message?: string }}
     */
    handleHook(hookType, payload, virtualModel) {
      return handleHook(hookType, payload, virtualModel, controller);
    },

    /** All supported hook types. */
    hookTypes: VIRTUAL_MODEL_HOOK_TYPES,
  };
}
