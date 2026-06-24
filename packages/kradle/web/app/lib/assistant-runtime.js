/**
 * In-memory assistant runtime for kradle chat sessions.
 *
 * Each session holds a message history and an optional stack reference.
 * The runtime calls the Anthropic API directly via the SDK's callModel()
 * — no K8s Job dispatch, no controller.dispatchAgent(). This prevents
 * pod crashes from missing Job infrastructure.
 *
 * Stack config is resolved from AgentStack CRDs when a controller is
 * available, falling back to sensible defaults.
 *
 * Sessions persist across Next.js hot reloads via globalThis.
 */

import { callModel, defaultSystemPrompt as coreDefaultSystemPrompt } from '@a5c-ai/kradle-sdk';

let idCounter = 1;

const MAX_TOOL_ITERATIONS = 6;

/**
 * Built-in tools the assistant agent can call to read and act on the kradle
 * control plane. OpenAI-function shape ({ name, description, parameters });
 * callModel wraps them for the provider. Execution is in executeAssistantTool().
 */
function buildAssistantTools() {
  return [
    {
      name: 'list_resources',
      description: 'List kradle resources of a given kind in this org (e.g. AgentStack, AgentDispatchRun, AgentDefinition, AgentPersona, Repository, KradleGeneratedView).',
      parameters: {
        type: 'object',
        properties: { kind: { type: 'string', description: 'The resource kind to list.' } },
        required: ['kind'],
      },
    },
    {
      name: 'get_resource',
      description: 'Get a single kradle resource by kind and name.',
      parameters: {
        type: 'object',
        properties: { kind: { type: 'string' }, name: { type: 'string' } },
        required: ['kind', 'name'],
      },
    },
    {
      name: 'apply_resource',
      description: 'Create or update a kradle resource. Pass the full resource object (apiVersion, kind, metadata.name, spec).',
      parameters: {
        type: 'object',
        properties: { resource: { type: 'object', description: 'The full kradle resource manifest.' } },
        required: ['resource'],
      },
    },
    {
      name: 'dispatch_agent',
      description: 'Dispatch an agent run for an AgentStack to do work (e.g. implement, review, fix).',
      parameters: {
        type: 'object',
        properties: {
          agentStack: { type: 'string', description: 'The AgentStack name to dispatch.' },
          taskKind: { type: 'string', description: 'implement | review | fix | diagnostic' },
        },
        required: ['agentStack'],
      },
    },
    {
      name: 'save_view',
      description: 'Save a generated HTML widget/view/screen as a durable, named kradle resource (KradleGeneratedView) so it can be reused and viewed later. Use this when the user asks to save/name a widget, view, dashboard, or screen.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'A short kebab-case name for the view.' },
          title: { type: 'string', description: 'Human-readable title.' },
          viewType: { type: 'string', description: 'widget | view | screen' },
          html: { type: 'string', description: 'The complete HTML document for the view.' },
        },
        required: ['name', 'html'],
      },
    },
  ];
}

/** Execute a built-in assistant tool against the kradle control plane. */
async function executeAssistantTool(controller, org, name, input) {
  if (!controller) return { error: 'No control-plane controller available.' };
  try {
    switch (name) {
      case 'list_resources': {
        const r = await controller.listResourceForOrg(org, input.kind);
        const items = (r?.items || r || []).map((it) => ({ name: it?.metadata?.name, phase: it?.status?.phase }));
        return { kind: input.kind, count: items.length, items: items.slice(0, 50) };
      }
      case 'get_resource': {
        const r = await controller.getResource(input.kind, input.name);
        return r?.resource || r || { error: 'not found' };
      }
      case 'apply_resource': {
        const r = await controller.applyResource(input.resource);
        return { ok: true, applied: r?.resource?.metadata?.name || input.resource?.metadata?.name };
      }
      case 'dispatch_agent': {
        const r = await controller.dispatchAgent({
          agentStack: input.agentStack,
          repository: 'default',
          ref: 'main',
          taskKind: input.taskKind || 'diagnostic',
          actor: 'assistant',
          organizationRef: org,
        });
        if (r?.error) return { error: r.message || 'dispatch failed' };
        return { ok: true, run: r?.run?.metadata?.name };
      }
      case 'save_view': {
        const resource = buildGeneratedViewResource(org, input);
        await controller.applyResource(resource);
        return { ok: true, name: resource.metadata.name, viewUrl: `/api/orgs/${org}/views/${resource.metadata.name}` };
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { error: err?.message || String(err) };
  }
}

/** Build a KradleGeneratedView resource from a save_view tool input. */
export function buildGeneratedViewResource(org, input) {
  const name = String(input.name || 'view').toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'view';
  return {
    apiVersion: 'kradle.a5c.ai/v1alpha1',
    kind: 'KradleGeneratedView',
    metadata: { name },
    spec: {
      organizationRef: org,
      title: input.title || name,
      viewType: input.viewType || 'widget',
      contentType: 'text/html',
      content: input.html || '',
    },
  };
}

/** Normalize provider-specific tool-call shapes (openai vs anthropic). */
function normalizeToolCall(tc) {
  if (tc?.function) {
    let args = {};
    try { args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {}; } catch { args = {}; }
    return { id: tc.id, name: tc.function.name, input: args };
  }
  return { id: tc.id, name: tc.name, input: tc.input || {} };
}

function generateId() {
  return `asst_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;
}

function defaultSystemPrompt() {
  return coreDefaultSystemPrompt();
}

async function resolveStackConfig(controller, stackRef) {
  // Default to the deployment's CONFIGURED assistant provider/model (env, sourced
  // from the assistant secret — KRADLE_ASSISTANT_PROVIDER=openai, MODEL=gpt-5.5),
  // not a hardcoded Anthropic default. Otherwise, whenever the org's `assistant`
  // AgentStack is absent (e.g. right after a deploy reaps the org namespace), the
  // chat falls back to Anthropic and dead-ends on "ANTHROPIC_API_KEY not
  // configured" even though Azure/OpenAI creds ARE configured. The stack spec,
  // when present, still wins (it's spread over these defaults).
  const defaults = {
    provider: process.env.KRADLE_ASSISTANT_PROVIDER || 'anthropic',
    model: process.env.KRADLE_ASSISTANT_MODEL || 'claude-sonnet-4-20250514',
    systemPrompt: defaultSystemPrompt(),
  };
  if (!controller) return defaults;
  try {
    const result = await controller.getResource('AgentStack', stackRef || 'assistant');
    if (result?.resource?.spec) {
      return { ...defaults, ...result.resource.spec };
    }
  } catch { /* use defaults */ }
  return defaults;
}

export function createAssistantRuntime() {
  // Each call returns a fresh facade but they all share the same sessions Map
  const sessions = getSessionStore();
  return {
    getSession(id) {
      return sessions.get(id) || null;
    },

    createSession(id, stackRef = 'assistant') {
      const sessionId = id || generateId();
      const session = {
        id: sessionId,
        stackRef,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      sessions.set(sessionId, session);
      return session;
    },

    listSessions() {
      return Array.from(sessions.values()).map((s) => ({
        id: s.id,
        stackRef: s.stackRef,
        messageCount: s.messages.length,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        lastMessage: s.messages.length ? s.messages[s.messages.length - 1] : null,
      }));
    },

    deleteSession(id) {
      return sessions.delete(id);
    },

    async chat(sessionId, userMessage, { controller, org } = {}) {
      const session = sessions.get(sessionId);
      if (!session) throw new Error(`Session ${sessionId} not found`);

      session.messages.push({
        id: generateId(),
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      });

      let assistantContent = '';
      let tokenUsage = null;
      const toolEvents = [];

      try {
        const config = await resolveStackConfig(controller, session.stackRef);
        // The assistant is a real tool-using agent: it can read/act on the kradle
        // control plane and save generated views. Tools only when a controller is
        // available to execute them.
        const tools = controller ? buildAssistantTools() : undefined;

        // Working transcript (provider message shape) seeded from the session's
        // displayable text history; the tool-use turns are appended here, not to
        // session.messages (which stays user/assistant text for the UI).
        const working = [
          ...(config.systemPrompt ? [{ role: 'system', content: config.systemPrompt }] : []),
          ...session.messages.map((m) => ({ role: m.role, content: m.content })),
        ];

        for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
          const result = await callModel({
            provider: config.provider || 'anthropic',
            model: config.model || 'claude-sonnet-4-20250514',
            messages: working,
            tools,
            maxTokens: 4096,
          });
          tokenUsage = result.usage || tokenUsage;
          const calls = (result.toolCalls || []).map(normalizeToolCall);

          if (calls.length === 0 || !tools) {
            assistantContent = result.content || 'No response from model.';
            break;
          }

          // Record the model's tool-call turn, execute each, feed results back.
          working.push({ role: 'assistant', content: result.content || '', tool_calls: result.toolCalls });
          for (const call of calls) {
            const out = await executeAssistantTool(controller, org, call.name, call.input);
            toolEvents.push({ tool: call.name, input: call.input, result: out });
            working.push({ role: 'tool', tool_call_id: call.id, content: JSON.stringify(out).slice(0, 4000) });
          }
          if (i === MAX_TOOL_ITERATIONS - 1) {
            assistantContent = result.content || 'Reached the tool-iteration limit.';
          }
        }
      } catch (err) {
        assistantContent = `Error: ${err.message}. Check that the assistant model provider is configured.`;
      }

      const assistantEntry = {
        id: generateId(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
        usage: tokenUsage,
        ...(toolEvents.length ? { toolEvents } : {}),
      };
      session.messages.push(assistantEntry);
      session.updatedAt = new Date().toISOString();

      return { message: assistantEntry, usage: tokenUsage };
    },

    async generate(task, { controller, context, responseFormat, stackRef, outputType } = {}) {
      let content;
      let tokenUsage = null;
      try {
        const config = await resolveStackConfig(controller, stackRef);
        const systemPrompt = buildGeneratePrompt(task, context, outputType);

        const result = await callModel({
          provider: config.provider || 'anthropic',
          model: config.model || 'claude-sonnet-4-20250514',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: task },
          ],
          maxTokens: 4096,
        });

        content = result.content || generateStubContent(task, context, outputType);
        tokenUsage = result.usage || null;
      } catch (err) {
        content = `Generation error: ${err.message}`;
      }

      const contentType = outputType === 'html' ? 'text/html' : outputType === 'json' ? 'application/json' : 'text/markdown';

      // For JSON output, attempt to parse
      if (outputType === 'json') {
        try {
          const jsonMatch = content.match(/```json\s*([\s\S]*?)```/);
          if (jsonMatch) content = jsonMatch[1].trim();
          content = JSON.parse(content);
        } catch {
          // Keep as string if parsing fails
        }
      }

      return { content, contentType, usage: tokenUsage };
    },
  };
}

// ---------- Singleton session store (persists across Next.js hot reloads) ----------

function getSessionStore() {
  if (!globalThis.__kradleAssistantSessions) {
    globalThis.__kradleAssistantSessions = new Map();
  }
  return globalThis.__kradleAssistantSessions;
}

// Use globalThis to persist across Next.js hot reloads
if (!globalThis.__kradleAssistantRuntime) {
  globalThis.__kradleAssistantRuntime = createAssistantRuntime();
}

/**
 * Returns the singleton assistant runtime instance.
 * Prefer this over createAssistantRuntime() in route handlers.
 */
export function getAssistantRuntime() {
  return globalThis.__kradleAssistantRuntime;
}

function buildGeneratePrompt(task, context, outputType) {
  let prompt = `Task: ${task}\n`;
  if (context) prompt += `Context: ${JSON.stringify(context)}\n`;
  if (outputType === 'html') prompt += '\nRespond with a complete HTML document. Include inline styles for a polished appearance.';
  else if (outputType === 'json') prompt += '\nRespond with valid JSON only, wrapped in ```json``` code fences.';
  else if (outputType === 'jsx') prompt += '\nRespond with a React JSX component. Export a default function component.';
  else prompt += '\nRespond in Markdown format.';
  return prompt;
}

function generateStubContent(task, context, outputType) {
  if (outputType === 'html') {
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Generated</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:2rem auto;padding:0 1rem;color:#1b1611;background:#f6f2e6;}h1{border-bottom:2px solid #c98a3e;padding-bottom:.5rem;}pre{background:#181624;color:#f0e6d1;padding:1rem;border-radius:8px;overflow:auto;}</style>
</head><body><h1>Generated Content</h1><p>Task: ${escapeHtml(task)}</p>${context ? `<pre>${escapeHtml(JSON.stringify(context, null, 2))}</pre>` : ''}<p><em>Connect an agent backend to generate AI-powered content.</em></p></body></html>`;
  }
  if (outputType === 'json') {
    return JSON.stringify({ task, context: context || null, status: 'stub', note: 'Connect an agent backend for real generation.' }, null, 2);
  }
  return `# Generated Content\n\n**Task:** ${task}\n\n${context ? '```json\n' + JSON.stringify(context, null, 2) + '\n```\n\n' : ''}*Connect an agent backend to generate AI-powered content.*`;
}

function escapeHtml(str) {
  return String(str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Artifact store for generated content served via /artifacts/:id
// Persists across Next.js hot reloads via globalThis
if (!globalThis.__kradleArtifacts) {
  globalThis.__kradleArtifacts = new Map();
}
const artifacts = globalThis.__kradleArtifacts;

export function storeArtifact(content, contentType) {
  const id = generateId();
  artifacts.set(id, { content, contentType, createdAt: new Date().toISOString() });
  return id;
}

export function getArtifact(id) {
  return artifacts.get(id) || null;
}
