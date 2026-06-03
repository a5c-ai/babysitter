import { randomUUID } from 'node:crypto';
import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

export const ASSISTANT_RUNTIME_BOUNDARY = {
  role: 'assistant-runtime',
  scope: 'In-process agent runtime for chat sessions and structured agentic calls via AgentStack CRDs',
  owns: ['chat sessions', 'message history', 'model API calls', 'structured agentic calls', 'session lifecycle'],
  delegatesTo: ['resource-model', 'agent-stack-controller', 'agent-mux-client'],
  mustNotOwn: ['secret values', 'K8s Job dispatch', 'resource persistence'],
};

/**
 * Default assistant stack configuration used when no CRD is found.
 * @returns {object}
 */
export function defaultAssistantConfig() {
  return {
    baseAgent: 'kradle-assistant',
    provider: process.env.KRADLE_ASSISTANT_PROVIDER || 'anthropic',
    model: process.env.KRADLE_ASSISTANT_MODEL || 'claude-sonnet-4-6',
    systemPrompt: `You are the Kradle Assistant — an AI agent embedded in the Kradle Kubernetes-native forge. You help users manage repositories, agent stacks, workspaces, deployments, and policies. You have access to kradle MCP tools for resource management and Atlas graph for knowledge queries.`,
    approvalMode: 'prompt',
  };
}

/**
 * Default system prompt for the assistant.
 * @returns {string}
 */
export function defaultSystemPrompt() {
  return `You are the Kradle Assistant — an AI agent embedded in the Kradle Kubernetes-native forge platform.

You help users with:
- Managing repositories, branches, and pull requests
- Configuring agent stacks and dispatching agent runs
- Managing workspaces and codespaces
- Querying the Atlas knowledge graph
- Configuring external provider integrations
- Managing secrets, policies, and permissions

You have access to MCP tools for direct resource management. Be concise and helpful.`;
}

/**
 * Call a model via the Anthropic Messages API.
 * Uses node:http/node:https — zero external deps.
 *
 * @param {{ provider: string, model: string, messages: object[], tools?: object[], maxTokens?: number, responseFormat?: string, apiKey?: string, fetchImpl?: Function }} params
 * @returns {Promise<{ content: string, usage: object, stopReason?: string, toolCalls?: object[] }>}
 */
export async function callModel({ provider, model, messages, tools, maxTokens, responseFormat, apiKey, baseUrl, fetchImpl } = {}) {
  const resolvedProvider = provider || process.env.KRADLE_ASSISTANT_PROVIDER || 'anthropic';

  if (resolvedProvider === 'anthropic') {
    return callAnthropicModel({ model, messages, tools, maxTokens, apiKey, fetchImpl });
  }

  return callOpenAICompatibleModel({ provider: resolvedProvider, model, messages, tools, maxTokens, apiKey, baseUrl, fetchImpl });
}

async function callAnthropicModel({ model, messages, tools, maxTokens, apiKey, fetchImpl }) {
  const resolvedKey = apiKey || process.env.ANTHROPIC_API_KEY || process.env.KRADLE_ASSISTANT_API_KEY;
  if (!resolvedKey) {
    return { content: 'Anthropic API key not configured. Set ANTHROPIC_API_KEY or KRADLE_ASSISTANT_API_KEY.', usage: {} };
  }

  const systemMessage = messages.find(m => m.role === 'system');
  const nonSystemMessages = messages.filter(m => m.role !== 'system');

  const body = {
    model: model || 'claude-sonnet-4-6',
    max_tokens: maxTokens || 4096,
    messages: nonSystemMessages,
    ...(systemMessage ? { system: systemMessage.content } : {}),
    ...(tools?.length ? { tools } : {}),
  };

  const doFetch = fetchImpl || globalThis.fetch;

  try {
    const res = await doFetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': resolvedKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return { content: data.error?.message || 'Model API error', usage: {} };
    return {
      content: data.content?.map(b => b.text || '').join('') || '',
      usage: data.usage || {},
      stopReason: data.stop_reason,
      toolCalls: data.content?.filter(b => b.type === 'tool_use') || [],
    };
  } catch (err) {
    return { content: `Error calling model: ${err.message}`, usage: {} };
  }
}

async function callOpenAICompatibleModel({ provider, model, messages, tools, maxTokens, apiKey, baseUrl, fetchImpl }) {
  const resolvedKey = apiKey || process.env.AZURE_API_KEY || process.env.OPENAI_API_KEY || process.env.KRADLE_ASSISTANT_API_KEY;
  const resolvedBase = baseUrl || process.env.KRADLE_ASSISTANT_BASE_URL || process.env.AGENT_MUX_API_BASE;

  if (!resolvedKey) {
    return { content: `API key not configured for ${provider}. Set AZURE_API_KEY, OPENAI_API_KEY, or KRADLE_ASSISTANT_API_KEY.`, usage: {} };
  }
  if (!resolvedBase) {
    return { content: `Base URL not configured for ${provider}. Set KRADLE_ASSISTANT_BASE_URL or AGENT_MUX_API_BASE.`, usage: {} };
  }

  const endpoint = resolvedBase.replace(/\/$/, '') + '/openai/deployments/' + (model || 'gpt-5.5') + '/chat/completions?api-version=2024-12-01-preview';

  const body = {
    messages,
    max_tokens: maxTokens || 4096,
    ...(tools?.length ? { tools: tools.map(t => ({ type: 'function', function: t })) } : {}),
  };

  const doFetch = fetchImpl || globalThis.fetch;

  try {
    const res = await doFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': resolvedKey,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return { content: data.error?.message || `${provider} API error: ${res.status}`, usage: {} };
    const choice = data.choices?.[0]?.message;
    return {
      content: choice?.content || '',
      usage: data.usage ? { input_tokens: data.usage.prompt_tokens, output_tokens: data.usage.completion_tokens } : {},
      stopReason: data.choices?.[0]?.finish_reason,
      toolCalls: choice?.tool_calls || [],
    };
  } catch (err) {
    return { content: `Error calling ${provider} model: ${err.message}`, usage: {} };
  }
}

/**
 * Create an in-process assistant runtime that reads config from AgentStack CRDs,
 * manages chat sessions with message history, and supports structured agentic calls.
 *
 * @param {{ stackName?: string, apiKey?: string, fetchImpl?: Function }} options
 * @returns {object} Assistant runtime object
 */
export function createAssistantRuntime(options = {}) {
  const stackName = options.stackName || 'assistant';
  const sessions = new Map();

  return {
    role: 'assistant-runtime',

    /**
     * Resolve stack config from a controller's AgentStack CRD, falling back to defaults.
     * @param {object} controller - Object with getResource(kind, name) method
     * @param {string} [stackNameOverride]
     * @returns {Promise<object>}
     */
    async resolveConfig(controller, stackNameOverride) {
      const name = stackNameOverride || stackName;
      if (!controller) return defaultAssistantConfig();
      try {
        const result = await controller.getResource('AgentStack', name);
        return result.resource?.spec || defaultAssistantConfig();
      } catch {
        return defaultAssistantConfig();
      }
    },

    /**
     * Create a new chat session.
     * @param {string} [sessionId] - Optional session ID; auto-generated if omitted.
     * @param {string} [stackRef] - Stack name reference; defaults to the runtime's stackName.
     * @returns {object} Session object with id, messages, createdAt, stackRef, status.
     */
    createSession(sessionId, stackRef) {
      const session = {
        id: sessionId || randomUUID(),
        messages: [],
        createdAt: new Date().toISOString(),
        stackRef: stackRef || stackName,
        status: 'active',
      };
      sessions.set(session.id, session);
      return session;
    },

    /**
     * Send a message in a session and receive the assistant's response.
     * @param {string} sessionId
     * @param {string} message
     * @param {{ controller?: object, tools?: object[], maxTokens?: number }} opts
     * @returns {Promise<object>} Model response with content, usage, stopReason, toolCalls.
     */
    async chat(sessionId, message, opts = {}) {
      const session = sessions.get(sessionId);
      if (!session) throw new Error(`Session ${sessionId} not found`);

      session.messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });

      const config = await this.resolveConfig(opts.controller, session.stackRef);
      const systemPromptText = config.systemPrompt || defaultSystemPrompt();

      const response = await callModel({
        provider: config.provider || 'anthropic',
        model: config.model || 'claude-sonnet-4-20250514',
        messages: [
          { role: 'system', content: systemPromptText },
          ...session.messages.map(m => ({ role: m.role, content: m.content })),
        ],
        tools: opts.tools || [],
        maxTokens: opts.maxTokens || 4096,
        apiKey: options.apiKey,
        fetchImpl: options.fetchImpl,
      });

      session.messages.push({ role: 'assistant', content: response.content, timestamp: new Date().toISOString() });
      return response;
    },

    /**
     * Get a session by ID.
     * @param {string} sessionId
     * @returns {object|null}
     */
    getSession(sessionId) {
      return sessions.get(sessionId) || null;
    },

    /**
     * List all active sessions.
     * @returns {object[]}
     */
    listSessions() {
      return [...sessions.values()];
    },

    /**
     * Delete a session by ID.
     * @param {string} sessionId
     * @returns {boolean}
     */
    deleteSession(sessionId) {
      return sessions.delete(sessionId);
    },

    /**
     * Structured agentic call (non-chat, single-shot).
     * @param {string|object} task - Task description or structured task object.
     * @param {{ controller?: object, stackRef?: string, systemPrompt?: string, tools?: object[], maxTokens?: number, responseFormat?: string }} opts
     * @returns {Promise<object>} Model response.
     */
    async structuredCall(task, opts = {}) {
      const config = await this.resolveConfig(opts.controller, opts.stackRef);
      const systemPromptText = opts.systemPrompt || config.systemPrompt || defaultSystemPrompt();

      const response = await callModel({
        provider: config.provider || 'anthropic',
        model: config.model || 'claude-sonnet-4-20250514',
        messages: [
          { role: 'system', content: systemPromptText },
          { role: 'user', content: typeof task === 'string' ? task : JSON.stringify(task) },
        ],
        tools: opts.tools || [],
        maxTokens: opts.maxTokens || 8192,
        responseFormat: opts.responseFormat,
        apiKey: options.apiKey,
        fetchImpl: options.fetchImpl,
      });

      return response;
    },
  };
}
