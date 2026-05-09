/**
 * Minimal completion engine for amux launch proxy mode.
 *
 * When the exposed transport differs from the target provider's API format
 * (e.g., exposing Anthropic for claude but targeting Azure/foundry), the
 * proxy needs a completion engine to translate between formats.
 */

import type { CompletionEngine, CompletionRequest, CompletionResult } from '@a5c-ai/transport-mux';

export function createOpenAICompletionEngine(options: {
  apiBase: string;
  apiKey: string;
  targetModel: string;
}): CompletionEngine {
  return {
    async complete(request: CompletionRequest): Promise<CompletionResult> {
      const messages = request.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(`${options.apiBase}/openai/deployments/${options.targetModel}/chat/completions?api-version=2024-12-01-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': options.apiKey,
        },
        body: JSON.stringify({
          messages,
          model: options.targetModel,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
      }

      const data = await response.json() as {
        id: string;
        choices: Array<{ message: { content: string }; finish_reason: string }>;
        usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
      };

      const choice = data.choices[0];
      return {
        id: data.id,
        model: options.targetModel,
        role: 'assistant',
        text: choice?.message?.content ?? '',
        finishReason: choice?.finish_reason ?? 'stop',
        usage: {
          promptTokens: data.usage?.prompt_tokens ?? 0,
          completionTokens: data.usage?.completion_tokens ?? 0,
          totalTokens: data.usage?.total_tokens ?? 0,
        },
      };
    },
  };
}
