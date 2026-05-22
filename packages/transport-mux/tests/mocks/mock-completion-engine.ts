import type {
  CompletionEngine,
  CompletionRequest,
  CompletionResult,
  CompletionStreamEvent,
} from '../../src/types.js';

export interface MockCompletionEngine extends CompletionEngine {
  requests: CompletionRequest[];
}

export function createMockCompletionEngine(
  resultOverrides: Partial<CompletionResult> = {},
): MockCompletionEngine {
  const requests: CompletionRequest[] = [];

  function createResult(request: CompletionRequest): CompletionResult {
    return {
      id: 'mock-completion',
      model: request.model,
      role: 'assistant',
      text: 'Hello',
      finishReason: 'stop',
      usage: {
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
      },
      ...resultOverrides,
    };
  }

  return {
    requests,
    async complete(request) {
      requests.push(request);
      return createResult(request);
    },
    async *stream(request): AsyncIterable<CompletionStreamEvent> {
      requests.push(request);
      const result = createResult(request);
      if (result.text) {
        yield { type: 'text-delta', text: result.text };
      }
      yield {
        type: 'done',
        finishReason: result.finishReason,
        usage: result.usage,
      };
    },
  };
}
