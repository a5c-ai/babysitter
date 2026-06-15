import type { ContextInjection, ContextProvider, TurnContext } from '@a5c-ai/genty-core/extensions';

export interface DynamicContextPipeline {
  providers: ContextProvider[];
  addProvider(provider: ContextProvider): void;
  removeProvider(id: string): void;
  collectInjections(turnCtx: TurnContext): Promise<ContextInjection[]>;
  applyInjections(injections: ContextInjection[], messages: Array<{ role: string; content: string }>): Array<{ role: string; content: string }>;
}

export function createDynamicContextPipeline(): DynamicContextPipeline {
  const providers: ContextProvider[] = [];

  return {
    providers,

    addProvider(provider: ContextProvider): void {
      providers.push(provider);
    },

    removeProvider(id: string): void {
      const idx = providers.findIndex(p => p.id === id);
      if (idx >= 0) providers.splice(idx, 1);
    },

    async collectInjections(turnCtx: TurnContext): Promise<ContextInjection[]> {
      const results: ContextInjection[] = [];
      for (const provider of providers) {
        try {
          const injection = await provider.provide(turnCtx);
          results.push(injection);
        } catch {
          // Provider errors must not block the turn
        }
      }
      return results;
    },

    applyInjections(injections: ContextInjection[], messages: Array<{ role: string; content: string }>): Array<{ role: string; content: string }> {
      const result = [...messages];
      let systemAppend = '';

      for (const injection of injections) {
        if (injection.messages) {
          const lastUserIdx = result.findLastIndex((m) => m.role === 'user');
          if (lastUserIdx >= 0) {
            result.splice(lastUserIdx, 0, ...injection.messages);
          } else {
            result.push(...injection.messages);
          }
        }
        if (injection.systemPromptAppend) {
          systemAppend += '\n' + injection.systemPromptAppend;
        }
      }

      if (systemAppend && result.length > 0) {
        const first = result[0];
        if (first.role === 'system') {
          result[0] = { ...first, content: first.content + systemAppend };
        }
      }

      return result;
    },
  };
}
