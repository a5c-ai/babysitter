import { describe, it, expect } from 'vitest';
import { enhanceWorkerSessionOptions } from './workerSessionEnhancer.js';
import { ExtensionRegistry } from '@a5c-ai/genty-core/extensions';
import { createKeyPair } from '@a5c-ai/genty-core/trust';
import { createDynamicContextPipeline } from '../../../../context/dynamic.js';
import { SteeringQueue } from '../../../../interaction/steering.js';
import { createModelSwitchState } from '../../../../interaction/model-switch.js';
import type { GentySessionContext } from '../../../../gentySessionContext.js';
import type { AgentCoreSessionOptions } from '../../../../types.js';

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

describe('workerSessionEnhancer', () => {
  it('returns opts unchanged when no genty context', () => {
    const opts: AgentCoreSessionOptions = { workspace: '/tmp', model: 'test' };
    expect(enhanceWorkerSessionOptions(opts, null)).toBe(opts);
    expect(enhanceWorkerSessionOptions(opts, undefined)).toBe(opts);
  });

  it('applies AGENTS.md instructions', () => {
    const ctx = makeCtx({
      instructions: {
        agentInstructions: ['Rule 1', 'Rule 2'],
        systemPromptMode: 'none',
        sources: [],
      },
    });
    const opts: AgentCoreSessionOptions = { workspace: '/tmp' };
    const result = enhanceWorkerSessionOptions(opts, ctx);
    expect(result.appendSystemPrompt).toEqual(['Rule 1', 'Rule 2']);
  });

  it('applies extension tools', async () => {
    const registry = new ExtensionRegistry();
    await registry.activate({
      name: 'ext',
      activate(c) {
        c.registerTool({ name: 'hello', description: 'hi', inputSchema: {}, handler: async () => 'hi' });
      },
    });
    const ctx = makeCtx({ extensionRegistry: registry });
    const opts: AgentCoreSessionOptions = { customTools: ['existing'] };
    const result = enhanceWorkerSessionOptions(opts, ctx);
    expect((result.customTools as unknown[]).length).toBe(2);
  });

  it('uses model switch when no explicit model', () => {
    const ctx = makeCtx();
    const opts: AgentCoreSessionOptions = {};
    const result = enhanceWorkerSessionOptions(opts, ctx);
    expect(result.model).toBe('claude-sonnet-4-6');
  });

  it('preserves explicit model over switch state', () => {
    const ctx = makeCtx();
    const opts: AgentCoreSessionOptions = { model: 'claude-opus-4-6' };
    const result = enhanceWorkerSessionOptions(opts, ctx);
    expect(result.model).toBe('claude-opus-4-6');
  });
});
