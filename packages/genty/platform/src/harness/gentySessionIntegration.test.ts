import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { GentySessionContext } from './gentySessionContext.js';
import type { AgentCoreSessionOptions } from './types.js';
import {
  applyInstructionsToSessionOptions,
  applyExtensionToolsToSessionOptions,
  applyDynamicContextToMessages,
  drainSteeringMessages,
  getTrustContext,
  getCurrentModel,
} from './gentySessionIntegration.js';
import { ExtensionRegistry } from '@a5c-ai/genty-core/extensions';
import { createKeyPair } from '@a5c-ai/genty-core/trust';
import { createDynamicContextPipeline } from '../context/dynamic.js';
import { SteeringQueue } from '../interaction/steering.js';
import { createModelSwitchState } from '../interaction/model-switch.js';

function makeCtx(overrides?: Partial<GentySessionContext>): GentySessionContext {
  return {
    agentId: 'agent-1',
    sessionId: 'sess-1',
    keyPair: createKeyPair(),
    extensionRegistry: new ExtensionRegistry(),
    dynamicContext: createDynamicContextPipeline(),
    instructions: { agentInstructions: [], systemPromptMode: 'none', sources: [] },
    steeringQueue: new SteeringQueue(),
    modelSwitch: createModelSwitchState('claude-sonnet-4-6', 'anthropic'),
    extensionLoadResult: { activated: [], failed: [] },
    ...overrides,
  };
}

describe('gentySessionIntegration', () => {
  describe('applyInstructionsToSessionOptions', () => {
    it('appends AGENTS.md content to system prompt', () => {
      const ctx = makeCtx({
        instructions: {
          agentInstructions: ['Rule 1', 'Rule 2'],
          systemPromptMode: 'none',
          sources: ['AGENTS.md'],
        },
      });
      const opts: AgentCoreSessionOptions = {};
      const result = applyInstructionsToSessionOptions(ctx, opts);
      expect(result.appendSystemPrompt).toEqual(['Rule 1', 'Rule 2']);
    });

    it('replaces system prompt when SYSTEM.md mode is replace', () => {
      const ctx = makeCtx({
        instructions: {
          agentInstructions: [],
          systemPrompt: 'Custom system',
          systemPromptMode: 'replace',
          sources: ['SYSTEM.md'],
        },
      });
      const opts: AgentCoreSessionOptions = {};
      const result = applyInstructionsToSessionOptions(ctx, opts);
      expect(result.systemPrompt).toBe('Custom system');
    });

    it('appends SYSTEM.md when mode is append', () => {
      const ctx = makeCtx({
        instructions: {
          agentInstructions: [],
          systemPrompt: 'Extra context',
          systemPromptMode: 'append',
          sources: ['SYSTEM.md'],
        },
      });
      const opts: AgentCoreSessionOptions = { appendSystemPrompt: ['Existing'] };
      const result = applyInstructionsToSessionOptions(ctx, opts);
      expect(result.appendSystemPrompt).toEqual(['Existing', 'Extra context']);
    });
  });

  describe('applyExtensionToolsToSessionOptions', () => {
    it('adds extension tools to customTools', async () => {
      const registry = new ExtensionRegistry();
      await registry.activate({
        name: 'tool-ext',
        activate(ctx) {
          ctx.registerTool({
            name: 'hello',
            description: 'Says hello',
            inputSchema: {},
            handler: async () => 'hi',
          });
        },
      });
      const ctx = makeCtx({ extensionRegistry: registry });
      const opts: AgentCoreSessionOptions = {};
      const result = applyExtensionToolsToSessionOptions(ctx, opts);
      expect(result.customTools).toHaveLength(1);
    });

    it('returns opts unchanged when no extension tools', () => {
      const ctx = makeCtx();
      const opts: AgentCoreSessionOptions = {};
      const result = applyExtensionToolsToSessionOptions(ctx, opts);
      expect(result).toBe(opts);
    });
  });

  describe('applyDynamicContextToMessages', () => {
    it('injects context from providers', async () => {
      const ctx = makeCtx();
      ctx.dynamicContext.addProvider({
        id: 'test-provider',
        provide: async () => ({
          messages: [{ role: 'system', content: 'Injected context' }],
        }),
      });
      const messages = [
        { role: 'system', content: 'System' },
        { role: 'user', content: 'Hello' },
      ];
      const result = await applyDynamicContextToMessages(ctx, messages, 1);
      expect(result.some(m => m.content === 'Injected context')).toBe(true);
    });

    it('returns messages unchanged when no providers', async () => {
      const ctx = makeCtx();
      const messages = [{ role: 'user', content: 'Hello' }];
      const result = await applyDynamicContextToMessages(ctx, messages, 1);
      expect(result).toEqual(messages);
    });
  });

  describe('drainSteeringMessages', () => {
    it('returns undefined when queue is empty', () => {
      const ctx = makeCtx();
      expect(drainSteeringMessages(ctx)).toBeUndefined();
    });

    it('returns formatted messages and clears queue', () => {
      const ctx = makeCtx();
      ctx.steeringQueue.submit('Do this first', 'steer');
      ctx.steeringQueue.submit('Also this', 'followup');
      const result = drainSteeringMessages(ctx);
      expect(result).toContain('[steer] Do this first');
      expect(result).toContain('[followup] Also this');
      expect(ctx.steeringQueue.pending).toBe(0);
    });
  });

  describe('getTrustContext', () => {
    it('returns a trust context from session context', () => {
      const ctx = makeCtx();
      const trust = getTrustContext(ctx);
      expect(trust.agentId).toBe('agent-1');
      expect(trust.sessionId).toBe('sess-1');
      expect(trust.keyPair.fingerprint).toHaveLength(64);
    });
  });

  describe('getCurrentModel', () => {
    it('returns the current model', () => {
      const ctx = makeCtx();
      expect(getCurrentModel(ctx)).toBe('claude-sonnet-4-6');
    });
  });
});
