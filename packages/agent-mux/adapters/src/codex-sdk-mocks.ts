/**
 * OpenAI-shaped type defs + mock chat/function helpers for CodexSdkAdapter.
 * Extracted to keep codex-sdk-adapter.ts under the 400-line cap.
 */

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface OpenAICompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
      function_call?: {
        name?: string;
        arguments?: string;
      };
    };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface OpenAIFunction {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export function createOpenAIClient(): object {
  // Real impl: return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return {};
}

export async function createChatCompletion(params: {
  model: string;
  messages: OpenAIMessage[];
  functions: OpenAIFunction[];
  stream: boolean;
  temperature: number;
}): Promise<AsyncIterable<OpenAICompletionChunk>> {
  const mockChunks: OpenAICompletionChunk[] = [
    {
      id: 'chatcmpl-123',
      object: 'chat.completion.chunk',
      created: Date.now(),
      model: params.model,
      choices: [
        {
          index: 0,
          delta: { role: 'assistant', content: "I'll help you with that task. Let me " },
          finish_reason: null,
        },
      ],
    },
    {
      id: 'chatcmpl-123',
      object: 'chat.completion.chunk',
      created: Date.now(),
      model: params.model,
      choices: [
        {
          index: 0,
          delta: { content: 'execute some code to solve this.' },
          finish_reason: null,
        },
      ],
    },
    {
      id: 'chatcmpl-123',
      object: 'chat.completion.chunk',
      created: Date.now(),
      model: params.model,
      choices: [
        {
          index: 0,
          delta: {
            function_call: {
              name: 'execute_code',
              arguments: '{\n  "language": "python",\n  "code": "print(\\"Hello from Codex SDK!\\")"',
            },
          },
          finish_reason: null,
        },
      ],
    },
    {
      id: 'chatcmpl-123',
      object: 'chat.completion.chunk',
      created: Date.now(),
      model: params.model,
      choices: [
        {
          index: 0,
          delta: { function_call: { arguments: '\n}' } },
          finish_reason: 'function_call',
        },
      ],
      usage: { prompt_tokens: 150, completion_tokens: 50, total_tokens: 200 },
    },
  ];

  return {
    async *[Symbol.asyncIterator]() {
      for (const chunk of mockChunks) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        yield chunk;
      }
    },
  };
}

export async function executeMockFunction(name: string, arguments_: string): Promise<string> {
  try {
    const args = JSON.parse(arguments_);
    switch (name) {
      case 'execute_code':
        return `Executed ${args.language} code:\n${args.code}\n\nOutput: Hello from Codex SDK!`;
      case 'read_file':
        return `Mock file contents for: ${args.path}`;
      case 'write_file':
        return `Successfully wrote ${args.content.length} characters to ${args.path}`;
      default:
        return `Unknown function: ${name}`;
    }
  } catch (error) {
    return `Error executing function ${name}: ${error}`;
  }
}
