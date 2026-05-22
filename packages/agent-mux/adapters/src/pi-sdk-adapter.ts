/**
 * PiSdkAdapter — Enhanced programmatic Pi agent integration.
 *
 * Provides a programmatic interface to Pi agent capabilities with enhanced
 * features, better streaming, improved tool calling, and extensibility for
 * future Pi platform enhancements.
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
} from '@a5c-ai/agent-mux-core';

import { BaseProgrammaticAdapter } from './programmatic-adapter-base.js';
import { createVirtualRuntimeHookCapabilities } from './shared/runtime-hooks-virtual.js';
import {
  listJsonlFiles,
  parseJsonlSessionFile,
  readJsonFile,
  writeJsonFileAtomic,
} from './session-fs.js';

// Pi SDK types (would normally be imported from a Pi SDK package)
interface PiMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface PiStreamChunk {
  type: 'message_start' | 'content_delta' | 'tool_call_start' | 'tool_call_delta' | 'tool_call_ready' | 'tool_result' | 'message_stop' | 'error';
  data?: {
    text?: string;
    accumulated?: string;
    tool_name?: string;
    tool_id?: string;
    tool_input?: string;
    tool_output?: unknown;
    usage?: {
      input_tokens: number;
      output_tokens: number;
      total_tokens: number;
    };
    error_message?: string;
  };
}

interface PiTool {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export class PiSdkAdapter extends BaseProgrammaticAdapter {
  readonly agent: string;
  readonly displayName = 'Pi (SDK)';
  readonly minVersion = '0.1.0';

  constructor(agent?: string) {
    super();
    this.agent = agent ?? this.constructor.name.replace(/Adapter$/, '').toLowerCase().replace(/pisdk/, 'pi-sdk');
  }
  readonly hostEnvSignals = ['PI_API_KEY', 'ANTHROPIC_API_KEY', 'OPENAI_API_KEY'] as const;

  readonly capabilities: AgentCapabilities = {
    agent: 'pi-sdk',
    canResume: true,
    canFork: true,
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
    supportsSkills: true,
    supportsAgentsMd: true,
    skillsFormat: 'file',
    supportsSubagentDispatch: true,
    supportsParallelExecution: true,
    maxParallelTasks: 5,
    supportsInteractiveMode: true,
    supportsStdinInjection: true,
    supportsImageInput: false,
    supportsImageOutput: false,
    supportsFileAttachments: true,
    supportsPlugins: false,
    pluginFormats: [],
    pluginRegistries: [],
    supportedPlatforms: ['darwin', 'linux', 'win32'],
    requiresGitRepo: false,
    requiresPty: false,
    authMethods: [
      { type: 'api_key', name: 'Provider API Key', description: 'Provider-specific API key environment variables' },
      { type: 'oauth', name: 'OAuth', description: 'OAuth-based authentication' },
    ],
    authFiles: ['.pi/agent/settings.json'],
    installMethods: [
      { platform: 'all', type: 'npm', command: 'npm install -g @pi-ai/sdk' },
    ],
  };

  readonly models: ModelCapabilities[] = [
    {
      agent: 'pi-sdk',
      modelId: 'pi-default',
      displayName: 'Pi Default (SDK)',
      deprecated: false,
      contextWindow: 128000,
      maxOutputTokens: 8192,
      inputPricePerMillion: 1,
      outputPricePerMillion: 3,
      cachedInputPricePerMillion: 0.1,
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
      supportsFileInput: true,
      cliArgKey: 'model',
      cliArgValue: 'pi-default',
      lastUpdated: '2026-04-01',
      source: 'bundled',
    },
    {
      agent: 'pi-sdk',
      modelId: 'pi-enhanced',
      displayName: 'Pi Enhanced (SDK)',
      deprecated: false,
      contextWindow: 200000,
      maxOutputTokens: 16384,
      inputPricePerMillion: 2,
      outputPricePerMillion: 6,
      cachedInputPricePerMillion: 0.2,
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
      supportsFileInput: true,
      cliArgKey: 'model',
      cliArgValue: 'pi-enhanced',
      lastUpdated: '2026-04-01',
      source: 'bundled',
    },
  ];

  readonly defaultModelId = 'pi-default';

  readonly configSchema: AgentConfigSchema = {
    agent: 'pi-sdk',
    version: 1,
    fields: [],
    configFilePaths: [path.join(os.homedir(), '.pi', 'agent', 'settings.json')],
    projectConfigFilePaths: ['.pi/agent/settings.json'],
    configFormat: 'json',
    supportsProjectConfig: true,
  };

  async *execute(options: RunOptions): AsyncIterableIterator<AgentEvent> {
    this.validateRunOptions(options);

    const runId = this.generateRunId();
    const modelId = this.resolveModel(options);
    const prompt = this.normalizePrompt(options.prompt!);

    // Check authentication
    const authState = await this.detectAuth();
    if (authState.status !== 'authenticated') {
      yield this.createErrorEvent(runId, 'AUTH_MISSING', 'No API key found for Pi SDK', false);
      return;
    }

    try {
      // Emit session start
      yield {
        ...this.createBaseEvent('session_start', runId),
        type: 'session_start',
        sessionId: options.sessionId || runId,
        resumed: Boolean(options.sessionId),
      } as AgentEvent;

      // Create Pi SDK client (in real implementation)
      const client = this.createPiClient();

      // Build messages array
      const messages: PiMessage[] = [
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

      // Define available tools for Pi capabilities
      const tools: PiTool[] = [
        {
          name: 'search_web',
          description: 'Search the web for current information',
          parameters: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query',
              },
              max_results: {
                type: 'integer',
                description: 'Maximum number of results to return',
                default: 5,
              },
            },
            required: ['query'],
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
        {
          name: 'spawn_subagent',
          description: 'Spawn a subagent to handle a specific task',
          parameters: {
            type: 'object',
            properties: {
              task: {
                type: 'string',
                description: 'Task description for the subagent',
              },
              agent_type: {
                type: 'string',
                description: 'Type of agent to spawn',
                enum: ['pi', 'claude', 'opencode'],
                default: 'pi',
              },
            },
            required: ['task'],
          },
        },
      ];

      // Make streaming API call
      const stream = await this.createPiStream({
        model: modelId,
        messages,
        tools,
        max_tokens: options.maxTokens || 8192,
        temperature: 0.3,
        stream: true,
      });

      let textAccumulated = '';
      let currentToolCall: { id: string; name: string; input: string } | null = null;

      for await (const chunk of stream) {
        switch (chunk.type) {
          case 'message_start':
            // Message started
            break;

          case 'content_delta':
            if (chunk.data?.text) {
              textAccumulated += chunk.data.text;
              yield this.createTextDeltaEvent(
                runId,
                chunk.data.text,
                chunk.data.accumulated || textAccumulated
              );
            }
            break;

          case 'tool_call_start':
            if (chunk.data?.tool_name && chunk.data?.tool_id) {
              currentToolCall = {
                id: chunk.data.tool_id,
                name: chunk.data.tool_name,
                input: '',
              };

              yield this.createToolCallStartEvent(
                runId,
                currentToolCall.id,
                currentToolCall.name,
                ''
              );
            }
            break;

          case 'tool_call_delta':
            if (currentToolCall && chunk.data?.tool_input) {
              currentToolCall.input += chunk.data.tool_input;
              yield {
                ...this.createBaseEvent('tool_input_delta', runId),
                type: 'tool_input_delta',
                toolCallId: currentToolCall.id,
                delta: chunk.data.tool_input,
                inputAccumulated: currentToolCall.input,
              } as AgentEvent;
            }
            break;

          case 'tool_call_ready':
            if (currentToolCall) {
              yield {
                ...this.createBaseEvent('tool_call_ready', runId),
                type: 'tool_call_ready',
                toolCallId: currentToolCall.id,
                toolName: currentToolCall.name,
                input: currentToolCall.input,
              } as AgentEvent;

              // Execute the tool (mock execution)
              const toolResult = await this.executeMockTool(
                currentToolCall.name,
                currentToolCall.input
              );

              yield this.createToolResultEvent(
                runId,
                currentToolCall.id,
                currentToolCall.name,
                toolResult,
                200 // mock duration
              );

              currentToolCall = null;
            }
            break;

          case 'tool_result':
            // Tool result is handled in tool_call_ready
            break;

          case 'message_stop':
            if (chunk.data?.usage) {
              const cost = this.extractCostFromUsage(chunk.data.usage, modelId);
              if (cost) {
                yield this.createCostEvent(runId, cost);
              }
            }

            yield this.createMessageStopEvent(runId, textAccumulated);
            break;

          case 'error':
            yield this.createErrorEvent(
              runId,
              'INTERNAL',
              chunk.data?.error_message || 'Unknown error',
              false
            );
            break;
        }
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      yield this.createErrorEvent(runId, 'INTERNAL', `SDK error: ${message}`, false);
    }
  }

  async detectAuth(): Promise<AuthState> {
    // Check Pi-specific API key first
    const piKey = process.env['PI_API_KEY'];
    if (piKey) {
      return {
        status: 'authenticated',
        method: 'api_key',
        identity: `pi:...${piKey.slice(-4)}`,
      };
    }

    // Check common provider keys that Pi might support
    const anthropicKey = process.env['ANTHROPIC_API_KEY'];
    if (anthropicKey) {
      return {
        status: 'authenticated',
        method: 'api_key',
        identity: `anthropic:...${anthropicKey.slice(-4)}`,
      };
    }

    const openaiKey = process.env['OPENAI_API_KEY'];
    if (openaiKey) {
      return {
        status: 'authenticated',
        method: 'api_key',
        identity: `openai:...${openaiKey.slice(-4)}`,
      };
    }

    // Check Pi settings file
    const piHome = path.join(os.homedir(), '.pi', 'agent');
    const settingsPath = path.join(piHome, 'settings.json');

    try {
      const settings = await readJsonFile<{ user?: { id?: string } }>(settingsPath);
      if (settings?.user?.id) {
        return {
          status: 'authenticated',
          method: 'oauth',
          identity: `pi:${settings.user.id}`,
        };
      }
    } catch {
      // Settings file not found or invalid
    }

    return { status: 'unauthenticated' };
  }

  getAuthGuidance(): AuthSetupGuidance {
    return {
      agent: 'pi-sdk',
      providerName: 'Pi',
      steps: [
        {
          step: 1,
          description: 'Get a Pi API key from the Pi platform',
          url: 'https://pi.ai/api-keys'
        },
        {
          step: 2,
          description: 'Set the PI_API_KEY environment variable',
          command: 'export PI_API_KEY=pi-...'
        },
        {
          step: 3,
          description: 'Alternatively, set a provider API key (Anthropic, OpenAI)',
          command: 'export ANTHROPIC_API_KEY=sk-ant-...'
        },
      ],
      envVars: [
        { name: 'PI_API_KEY', description: 'Pi platform API key', required: false, exampleFormat: 'pi-...' },
        { name: 'ANTHROPIC_API_KEY', description: 'Anthropic API key', required: false, exampleFormat: 'sk-ant-...' },
        { name: 'OPENAI_API_KEY', description: 'OpenAI API key', required: false, exampleFormat: 'sk-...' },
      ],
      documentationUrls: ['https://pi.ai/docs/api'],
      verifyCommand: 'pi --version',
    };
  }

  sessionDir(_cwd?: string): string {
    return path.join(os.homedir(), '.pi', 'agent', 'sessions');
  }

  async parseSessionFile(filePath: string): Promise<Session> {
    const parsed = await parseJsonlSessionFile(filePath, 'pi-sdk');
    return { ...parsed, agent: 'pi-sdk' };
  }

  async listSessionFiles(_cwd?: string): Promise<string[]> {
    return listJsonlFiles(this.sessionDir());
  }

  async readConfig(_cwd?: string): Promise<AgentConfig> {
    const filePath = this.configSchema.configFilePaths?.[0];
    if (!filePath) return { agent: 'pi-sdk', source: 'global' };
    const data = (await readJsonFile<Record<string, unknown>>(filePath)) ?? {};
    return { agent: 'pi-sdk', source: 'global', filePaths: [filePath], ...data };
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
   * Create Pi SDK client (mock implementation).
   * In real implementation, this would return an actual Pi SDK client.
   */
  private createPiClient() {
    // Mock client - in real implementation, this would be:
    // return new PiClient({ apiKey: process.env.PI_API_KEY });
    return {};
  }

  /**
   * Create Pi stream (mock implementation).
   * In real implementation, this would use the Pi SDK.
   */
  private async createPiStream(params: {
    model: string;
    messages: PiMessage[];
    tools: PiTool[];
    max_tokens: number;
    temperature: number;
    stream: boolean;
  }): Promise<AsyncIterable<PiStreamChunk>> {
    // Mock streaming response
    const mockChunks: PiStreamChunk[] = [
      {
        type: 'message_start',
      },
      {
        type: 'content_delta',
        data: {
          text: 'I\'ll help you with that task. ',
          accumulated: 'I\'ll help you with that task. ',
        },
      },
      {
        type: 'content_delta',
        data: {
          text: 'Let me search for current information first.',
          accumulated: 'I\'ll help you with that task. Let me search for current information first.',
        },
      },
      {
        type: 'tool_call_start',
        data: {
          tool_id: 'call_123',
          tool_name: 'search_web',
        },
      },
      {
        type: 'tool_call_delta',
        data: {
          tool_input: '{"query": "latest information about ',
        },
      },
      {
        type: 'tool_call_delta',
        data: {
          tool_input: 'your topic"}',
        },
      },
      {
        type: 'tool_call_ready',
      },
      {
        type: 'content_delta',
        data: {
          text: '\n\nBased on my search, here\'s what I found...',
          accumulated: 'I\'ll help you with that task. Let me search for current information first.\n\nBased on my search, here\'s what I found...',
        },
      },
      {
        type: 'message_stop',
        data: {
          usage: {
            input_tokens: 120,
            output_tokens: 80,
            total_tokens: 200,
          },
        },
      },
    ];

    return {
      async *[Symbol.asyncIterator]() {
        for (const chunk of mockChunks) {
          await new Promise(resolve => setTimeout(resolve, 150)); // Simulate streaming delay
          yield chunk;
        }
      },
    };
  }

  /**
   * Execute mock tool calls.
   */
  private async executeMockTool(name: string, inputJson: string): Promise<string> {
    try {
      const input = JSON.parse(inputJson);

      switch (name) {
        case 'search_web':
          return `Found ${input.max_results || 5} results for "${input.query}":\n1. Sample result 1\n2. Sample result 2\n3. Sample result 3`;

        case 'read_file':
          return `Mock file contents for: ${input.path}`;

        case 'write_file':
          return `Successfully wrote ${input.content.length} characters to ${input.path}`;

        case 'spawn_subagent':
          return `Spawned ${input.agent_type || 'pi'} subagent for task: ${input.task}`;

        default:
          return `Unknown tool: ${name}`;
      }
    } catch (error) {
      return `Error executing tool ${name}: ${error}`;
    }
  }

  /**
   * Extract cost information from Pi usage object.
   */
  private extractCostFromUsage(usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  }, modelId: string): CostRecord {
    const model = this.models.find(m => m.modelId === modelId);
    if (!model) {
      return {
        totalUsd: 0,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
      };
    }

    const inputCost = (usage.input_tokens / 1_000_000) * model.inputPricePerMillion!;
    const outputCost = (usage.output_tokens / 1_000_000) * model.outputPricePerMillion!;
    const totalCost = inputCost + outputCost;

    return {
      totalUsd: totalCost,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
    };
  }
}
