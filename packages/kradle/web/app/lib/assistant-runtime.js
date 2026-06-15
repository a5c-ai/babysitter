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

function generateId() {
  return `asst_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;
}

function defaultSystemPrompt() {
  return coreDefaultSystemPrompt();
}

async function resolveStackConfig(controller, stackRef) {
  const defaults = { provider: 'anthropic', model: 'claude-sonnet-4-20250514', systemPrompt: defaultSystemPrompt() };
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

    async chat(sessionId, userMessage, { controller } = {}) {
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

      try {
        const config = await resolveStackConfig(controller, session.stackRef);

        const result = await callModel({
          provider: config.provider || 'anthropic',
          model: config.model || 'claude-sonnet-4-20250514',
          messages: [
            ...(config.systemPrompt ? [{ role: 'system', content: config.systemPrompt }] : []),
            ...session.messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          maxTokens: 4096,
        });

        assistantContent = result.content || 'No response from model.';
        tokenUsage = result.usage || null;
      } catch (err) {
        assistantContent = `Error: ${err.message}. Check that ANTHROPIC_API_KEY is configured.`;
      }

      const assistantEntry = {
        id: generateId(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
        usage: tokenUsage,
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
