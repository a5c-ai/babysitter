import { describe, it, expect } from 'vitest';
import { createDynamicContextPipeline } from './dynamic.js';

describe('context/dynamic', () => {
  it('collects injections from providers', async () => {
    const pipeline = createDynamicContextPipeline();
    pipeline.addProvider({
      id: 'rag',
      provide: async (ctx) => ({
        messages: [{ role: 'system', content: `RAG context for turn ${ctx.turnNumber}` }],
      }),
    });

    const injections = await pipeline.collectInjections({
      sessionId: 's1', turnNumber: 5, messageHistory: [], pendingTools: [],
    });
    expect(injections).toHaveLength(1);
    expect(injections[0].messages?.[0].content).toContain('turn 5');
  });

  it('applies injected messages before the last user message', () => {
    const pipeline = createDynamicContextPipeline();
    const messages = [
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: 'First question' },
      { role: 'assistant', content: 'First answer' },
      { role: 'user', content: 'Second question' },
    ];

    const result = pipeline.applyInjections(
      [{ messages: [{ role: 'system', content: 'Injected context' }] }],
      messages,
    );
    expect(result).toHaveLength(5);
    expect((result[3] as any).content).toBe('Injected context');
    expect((result[4] as any).content).toBe('Second question');
  });

  it('appends to system prompt', () => {
    const pipeline = createDynamicContextPipeline();
    const messages = [
      { role: 'system', content: 'Base prompt' },
      { role: 'user', content: 'Hi' },
    ];

    const result = pipeline.applyInjections(
      [{ systemPromptAppend: 'Extra instructions' }],
      messages,
    );
    expect((result[0] as any).content).toBe('Base prompt\nExtra instructions');
  });

  it('removes providers by id', async () => {
    const pipeline = createDynamicContextPipeline();
    pipeline.addProvider({ id: 'a', provide: async () => ({ messages: [{ role: 'system', content: 'a' }] }) });
    pipeline.addProvider({ id: 'b', provide: async () => ({ messages: [{ role: 'system', content: 'b' }] }) });

    pipeline.removeProvider('a');
    const injections = await pipeline.collectInjections({ sessionId: '', turnNumber: 0, messageHistory: [], pendingTools: [] });
    expect(injections).toHaveLength(1);
  });

  it('swallows provider errors', async () => {
    const pipeline = createDynamicContextPipeline();
    pipeline.addProvider({ id: 'crasher', provide: async () => { throw new Error('boom'); } });
    pipeline.addProvider({ id: 'ok', provide: async () => ({ messages: [{ role: 'system', content: 'fine' }] }) });

    const injections = await pipeline.collectInjections({ sessionId: '', turnNumber: 0, messageHistory: [], pendingTools: [] });
    expect(injections).toHaveLength(1);
    expect(injections[0].messages?.[0].content).toBe('fine');
  });
});
