/**
 * CodexSdkAdapter — Direct OpenAI SDK integration for Codex.
 *
 * Uses the OpenAI SDK directly instead of the Codex CLI for better performance
 * and more granular control over API interactions.
 */

import * as os from 'node:os';
import * as path from 'node:path';

import type {
  AgentCapabilities,
  ModelCapabilities,
  AgentConfigSchema,
  AuthState,
  AuthSetupGuidance,
  Session,
  RunOptions,
  AgentEvent,
  AgentConfig,
  CostRecord,
} from '@a5c-ai/agent-mux-comm';

import { BaseProgrammaticAdapter } from './programmatic-adapter-base.js';
import { createVirtualRuntimeHookCapabilities } from './shared/runtime-hooks-virtual.js';
import {
  listJsonlFiles,
  parseCodexSessionFile,
  readJsonFile,
  writeJsonFileAtomic,
} from './session-fs.js';
import { readAuthConfigIdentity } from './auth-config.js';
import {
  createOpenAIClient,
  createChatCompletion,
  executeMockFunction,
  type OpenAIMessage,
  type OpenAIFunction,
} from './codex-sdk-mocks.js';

export class CodexSdkAdapter extends BaseProgrammaticAdapter {
  readonly agent: string;
  readonly displayName = 'Codex (SDK)';
  readonly minVersion = '0.1.0';

  constructor(agent?: string) {
    super();
    this.agent = agent ?? this.constructor.name.replace(/Adapter$/, '').toLowerCase().replace(/sdk$/, '-sdk');
  }
  readonly hostEnvSignals = ['OPENAI_API_KEY'] as const;

  readonly capabilities: AgentCapabilities = {
    agent: 'codex-sdk',
    canResume: true,
    canFork: false,
    supportsMultiTurn: true,
    sessionPersistence: 'file',
    supportsTextStreaming: true,
    supportsToolCallStreaming: true,
    supportsThinkingStreaming: false,
    supportsNativeTools: true,
    supportsMCP: false,
    supportsParallelToolCalls: true,
    requiresToolApproval: true,
    approvalModes: ['yolo', 'prompt', 'deny'],
    runtimeHooks: createVirtualRuntimeHookCapabilities(),
    supportsThinking: false,
    thinkingEffortLevels: [],
    supportsThinkingBudgetTokens: false,
    supportsJsonMode: true,
    supportsStructuredOutput: true,
    structuredSessionTransport: 'restart-per-turn',
    sessionControlPlane: 'self-managed',
    supportsSkills: false,
    supportsAgentsMd: false,
    skillsFormat: null,
    supportsSubagentDispatch: false,
    supportsParallelExecution: false,
    supportsInteractiveMode: true,
    supportsStdinInjection: true,
    supportsImageInput: false,
    supportsImageOutput: false,
    supportsFileAttachments: false,
    supportsPlugins: false,
    pluginFormats: [],
    pluginRegistries: [],
    supportedPlatforms: ['darwin', 'linux', 'win32'],
    requiresGitRepo: false,
    requiresPty: false,
    authMethods: [
      { type: 'api_key', name: 'API Key', description: 'OPENAI_API_KEY environment variable' },
    ],
    authFiles: ['.codex/config.json'],
    installMethods: [
      { platform: 'all', type: 'npm', command: 'npm install -g openai' },
    ],
  };

  readonly models: ModelCapabilities[] = [
    {
      agent: 'codex-sdk',
      modelId: 'o4-mini',
      displayName: 'o4-mini',
      deprecated: false,
      contextWindow: 200000,
      maxOutputTokens: 100000,
      supportsThinking: true,
      thinkingEffortLevels: ['low', 'medium', 'high'],
      supportsToolCalling: true,
      supportsParallelToolCalls: true,
      supportsToolCallStreaming: true,
      supportsJsonMode: true,
      supportsStructuredOutput: true,
      supportsTextStreaming: true,
      supportsThinkingStreaming: false,
      supportsImageInput: false,
      supportsImageOutput: false,
      supportsFileInput: false,
      inputPricePerMillion: 0.15, // Example pricing
      outputPricePerMillion: 0.6,
      cachedInputPricePerMillion: 0.075,
      cliArgKey: 'model', // Not used in SDK adapter
      cliArgValue: 'o4-mini',
      lastUpdated: '2026-04-01',
      source: 'bundled',
    },
    {
      agent: 'codex-sdk',
      modelId: 'codex-mini-latest',
      displayName: 'Codex Mini',
      deprecated: false,
      contextWindow: 200000,
      maxOutputTokens: 100000,
      supportsThinking: false,
      supportsToolCalling: true,
      supportsParallelToolCalls: true,
      supportsToolCallStreaming: true,
      supportsJsonMode: true,
      supportsStructuredOutput: true,
      supportsTextStreaming: true,
      supportsThinkingStreaming: false,
      supportsImageInput: false,
      supportsImageOutput: false,
      supportsFileInput: false,
      inputPricePerMillion: 0.1, // Example pricing
      outputPricePerMillion: 0.4,
      cachedInputPricePerMillion: 0.05,
      cliArgKey: 'model', // Not used in SDK adapter
      cliArgValue: 'codex-mini-latest',
      lastUpdated: '2026-04-01',
      source: 'bundled',
    },
  ];

  readonly defaultModelId = 'o4-mini';

  readonly configSchema: AgentConfigSchema = {
    agent: 'codex-sdk',
    version: 1,
    fields: [],
    configFilePaths: [path.join(os.homedir(), '.codex', 'config.json')],
    configFormat: 'json',
    supportsProjectConfig: false,
  };

  async *execute(options: RunOptions): AsyncIterableIterator<AgentEvent> {
    this.validateRunOptions(options);

    const runId = this.generateRunId();
    const modelId = this.resolveModel(options);
    const prompt = this.normalizePrompt(options.prompt!);

    // Check authentication
    const authState = await this.detectAuth();
    if (authState.status !== 'authenticated') {
      yield this.createErrorEvent(runId, 'AUTH_MISSING', 'OpenAI API key not found', false);
      return;
    }

    try {
      // Emit session start
      yield {
        ...this.createBaseEvent('session_start', runId),
        type: 'session_start',
        sessionId: options.sessionId || runId,
        resumed: false,
      } as AgentEvent;

      // Create OpenAI client (in real implementation, this would use the actual OpenAI SDK)
      const client = createOpenAIClient();

      // Build messages array
      const messages: OpenAIMessage[] = [
        {
          role: 'user',
          content: prompt,
        },
      ];

      // Add system prompt if provided
      if (options.systemPrompt) {
        messages.unshift({
          role: 'system',
          content: options.systemPrompt,
        });
      }

      // Define available tools/functions
      const functions: OpenAIFunction[] = [
        {
          name: 'execute_code',
          description: 'Execute code in a sandboxed environment',
          parameters: {
            type: 'object',
            properties: {
              language: {
                type: 'string',
                enum: ['bash', 'python', 'javascript', 'typescript'],
                description: 'Programming language to execute',
              },
              code: {
                type: 'string',
                description: 'Code to execute',
              },
            },
            required: ['language', 'code'],
          },
        },
        {
          name: 'read_file',
          description: 'Read the contents of a file',
          parameters: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to the file to read',
              },
            },
            required: ['path'],
          },
        },
        {
          name: 'write_file',
          description: 'Write content to a file',
          parameters: {
            type: 'object',
            properties: {
              path: {
                type: 'string',
                description: 'Path to the file to write',
              },
              content: {
                type: 'string',
                description: 'Content to write to the file',
              },
            },
            required: ['path', 'content'],
          },
        },
      ];

      // Make streaming API call
      const stream = await createChatCompletion({
        model: modelId,
        messages,
        functions,
        stream: true,
        temperature: 0.1,
      });

      let textAccumulated = '';
      let currentFunctionCall: { name?: string; arguments?: string } | null = null;
      let toolCallId: string | null = null;

      for await (const chunk of stream) {
        if (chunk.choices && chunk.choices[0]) {
          const choice = chunk.choices[0];
          const delta = choice.delta;

          // Handle text content
          if (delta.content) {
            textAccumulated += delta.content;
            yield this.createTextDeltaEvent(runId, delta.content, textAccumulated);
          }

          // Handle function calls
          if (delta.function_call) {
            if (delta.function_call.name && !currentFunctionCall) {
              // Start of function call
              currentFunctionCall = { name: delta.function_call.name, arguments: '' };
              toolCallId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

              yield this.createToolCallStartEvent(
                runId,
                toolCallId,
                delta.function_call.name,
                ''
              );
            }

            if (delta.function_call.arguments && currentFunctionCall) {
              // Accumulate function arguments
              currentFunctionCall.arguments = (currentFunctionCall.arguments || '') + delta.function_call.arguments;

              // Emit tool input delta
              yield {
                ...this.createBaseEvent('tool_input_delta', runId),
                type: 'tool_input_delta',
                toolCallId: toolCallId!,
                delta: delta.function_call.arguments,
                inputAccumulated: currentFunctionCall.arguments,
              } as AgentEvent;
            }
          }

          // Handle completion
          if (choice.finish_reason === 'function_call' && currentFunctionCall && toolCallId) {
            // Function call is ready
            yield {
              ...this.createBaseEvent('tool_call_ready', runId),
              type: 'tool_call_ready',
              toolCallId,
              toolName: currentFunctionCall.name!,
              input: currentFunctionCall.arguments || '',
            } as AgentEvent;

            // Execute the function (mock execution)
            const functionResult = await executeMockFunction(
              currentFunctionCall.name!,
              currentFunctionCall.arguments || '{}'
            );

            yield this.createToolResultEvent(
              runId,
              toolCallId,
              currentFunctionCall.name!,
              functionResult,
              100 // mock duration
            );

            currentFunctionCall = null;
            toolCallId = null;
          }
        }

        // Handle usage/cost information
        if (chunk.usage) {
          const cost = this.extractCostFromUsage(chunk.usage);
          if (cost) {
            yield this.createCostEvent(runId, cost);
          }
        }
      }

      // Emit message stop
      yield this.createMessageStopEvent(runId, textAccumulated);

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      yield this.createErrorEvent(runId, 'INTERNAL', `SDK error: ${message}`, false);
    }
  }

  async detectAuth(): Promise<AuthState> {
    const apiKey = process.env['OPENAI_API_KEY'];
    if (apiKey) {
      return {
        status: 'authenticated',
        method: 'api_key',
        identity: `openai:...${apiKey.slice(-4)}`,
      };
    }

    // Check config files
    const codexHome = process.env['CODEX_HOME'] ?? path.join(os.homedir(), '.codex');
    const found = await readAuthConfigIdentity([
      path.join(codexHome, 'auth.json'),
      path.join(codexHome, 'credentials.json'),
    ]);
    if (found) {
      return { status: 'authenticated', method: found.method, identity: found.identity };
    }

    return { status: 'unauthenticated' };
  }

  getAuthGuidance(): AuthSetupGuidance {
    return {
      agent: 'codex-sdk',
      providerName: 'OpenAI',
      steps: [
        {
          step: 1,
          description: 'Get an API key from https://platform.openai.com/api-keys',
          url: 'https://platform.openai.com/api-keys'
        },
        {
          step: 2,
          description: 'Set the OPENAI_API_KEY environment variable',
          command: 'export OPENAI_API_KEY=sk-...'
        },
      ],
      envVars: [
        { name: 'OPENAI_API_KEY', description: 'OpenAI API key', required: true, exampleFormat: 'sk-...' },
      ],
      documentationUrls: ['https://platform.openai.com/docs'],
      verifyCommand: 'node -e "console.log(process.env.OPENAI_API_KEY ? \'OK\' : \'Missing\')"',
    };
  }

  sessionDir(_cwd?: string): string {
    return path.join(os.homedir(), '.codex', 'sessions');
  }

  async parseSessionFile(filePath: string): Promise<Session> {
    const parsed = await parseCodexSessionFile(filePath, 'codex-sdk');
    return { ...parsed, agent: 'codex-sdk' };
  }

  async listSessionFiles(_cwd?: string): Promise<string[]> {
    return listJsonlFiles(this.sessionDir());
  }

  async readConfig(_cwd?: string): Promise<AgentConfig> {
    const filePath = this.configSchema.configFilePaths?.[0];
    if (!filePath) return { agent: 'codex-sdk', source: 'global' };
    const data = (await readJsonFile<Record<string, unknown>>(filePath)) ?? {};
    return { agent: 'codex-sdk', source: 'global', filePaths: [filePath], ...data };
  }

  async writeConfig(config: Partial<AgentConfig>, _cwd?: string): Promise<void> {
    const filePath = this.configSchema.configFilePaths?.[0];
    if (!filePath) return;
    const existing = (await readJsonFile<Record<string, unknown>>(filePath)) ?? {};
    const { agent: _a, source: _s, filePaths: _fp, ...rest } = config as Record<string, unknown>;
    void _a; void _s; void _fp;
    await writeJsonFileAtomic(filePath, { ...existing, ...rest });
  }

  // ── Private implementation methods ─────────────────────────────────

  /**
   * Create OpenAI client (mock implementation).
   * In real implementation, this would return an actual OpenAI client instance.
   */
  private extractCostFromUsage(usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  }): CostRecord {
    const model = this.models.find(m => m.modelId === this.defaultModelId);
    if (!model) {
      return {
        totalUsd: 0,
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
      };
    }

    const inputCost = (usage.prompt_tokens / 1_000_000) * model.inputPricePerMillion!;
    const outputCost = (usage.completion_tokens / 1_000_000) * model.outputPricePerMillion!;
    const totalCost = inputCost + outputCost;

    return {
      totalUsd: totalCost,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
    };
  }
}
