import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  adapterMocks,
  AdapterMockFactory,
  mockScenarios,
  createAdapterMock,
  testMockScenario,
  ClaudeAgentSdkMock,
  CodexSdkMock,
  PiSdkMock,
  OpenCodeHttpMock,
  CodexWebSocketMock,
  MockServer,
  ProgrammaticMockEngine,
  createProgrammaticMockBuilder,
  createRemoteMockBuilder,
} from '../src/index.js';

describe('Adapter Mocks', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('AdapterMockFactory', () => {
    let factory: AdapterMockFactory;

    beforeEach(() => {
      factory = new AdapterMockFactory();
    });

    it('creates claude agent sdk builder', () => {
      const builder = factory.claudeAgentSdk();
      expect(builder).toBeDefined();
      expect(typeof builder.build).toBe('function');
    });

    it('creates codex sdk builder', () => {
      const builder = factory.codexSdk();
      expect(builder).toBeDefined();
      expect(typeof builder.build).toBe('function');
    });

    it('creates pi sdk builder', () => {
      const builder = factory.piSdk();
      expect(builder).toBeDefined();
      expect(typeof builder.build).toBe('function');
    });

    it('creates opencode http builder', () => {
      const builder = factory.opencodeHttp();
      expect(builder).toBeDefined();
      expect(typeof builder.build).toBe('function');
    });

    it('creates codex websocket builder', () => {
      const builder = factory.codexWebSocket();
      expect(builder).toBeDefined();
      expect(typeof builder.build).toBe('function');
    });

    it('creates generic programmatic builder', () => {
      const builder = factory.programmatic();
      expect(builder).toBeDefined();
      expect(typeof builder.build).toBe('function');
    });

    it('creates generic remote builder', () => {
      const builder = factory.remote();
      expect(builder).toBeDefined();
      expect(typeof builder.build).toBe('function');
    });
  });

  describe('ProgrammaticMockBuilder', () => {
    it('builds basic configuration', () => {
      const config = createProgrammaticMockBuilder()
        .name('test-config')
        .withAuth(true)
        .addTextStream('Hello world')
        .withCost(50, 20)
        .build();

      expect(config.name).toBe('test-config');
      expect(config.authSucceeds).toBe(true);
      expect(config.events.length).toBeGreaterThanOrEqual(2);
      expect(config.cost).toEqual({
        inputTokens: 50,
        outputTokens: 20,
        thinkingTokens: 0,
        totalUsd: expect.any(Number),
      });
    });

    it('adds tool calling sequence', () => {
      const config = createProgrammaticMockBuilder()
        .addToolCall('read_file', '{"path": "test.txt"}', 'file contents')
        .build();

      expect(config.events).toHaveLength(4);
      expect(config.events[0].type).toBe('tool_call_start');
      expect(config.events[1].type).toBe('tool_input_delta');
      expect(config.events[2].type).toBe('tool_call_ready');
      expect(config.events[3].type).toBe('tool_result');
    });

    it('adds thinking sequence', () => {
      const config = createProgrammaticMockBuilder()
        .addThinking('Let me think about this...')
        .build();

      expect(config.events).toHaveLength(3);
      expect(config.events[0].type).toBe('thinking_start');
      expect(config.events[1].type).toBe('thinking_delta');
      expect(config.events[2].type).toBe('thinking_stop');
    });
  });

  describe('RemoteMockBuilder', () => {
    it('builds basic remote configuration', () => {
      const config = createRemoteMockBuilder()
        .name('test-remote')
        .withServer({ port: 3000, startupDelayMs: 100 })
        .withConnection({ connectDelayMs: 50 })
        .addEvents([{ type: 'text_delta', data: { delta: 'hello' }, delayMs: 100 }])
        .build();

      expect(config.name).toBe('test-remote');
      expect(config.server?.port).toBe(3000);
      expect(config.server?.startupDelayMs).toBe(100);
      expect(config.connection?.connectDelayMs).toBe(50);
      expect(config.events).toHaveLength(1);
    });
  });

  describe('ProgrammaticMockEngine', () => {
    let engine: ProgrammaticMockEngine;

    beforeEach(() => {
      engine = new ProgrammaticMockEngine();
    });

    it('executes basic success scenario', async () => {
      const config = ClaudeAgentSdkMock.basicSuccess();
      const events = [];
      const eventStream = await engine.execute(config, {
        agent: 'claude-agent-sdk' as const,
        prompt: 'test',
      });

      const eventPromise = (async () => {
        for await (const event of eventStream) {
          events.push(event);
          if (events.length >= 10) break;
        }
      })();

      await vi.advanceTimersToNextTimerAsync();
      await vi.runAllTimersAsync();
      await eventPromise;

      expect(events.length).toBeGreaterThan(0);
      expect(events[0].type).toBe('session_start');
      expect(events.find((e) => e.type === 'thinking_start')).toBeDefined();
      expect(events.find((e) => e.type === 'text_delta')).toBeDefined();
      expect(events.find((e) => e.type === 'cost')).toBeDefined();
    }, 10000);
  });

  describe('MockServer', () => {
    let server: MockServer;

    afterEach(async () => {
      if (server) {
        await server.stop();
      }
    });

    it('starts and stops successfully', async () => {
      const config = OpenCodeHttpMock.basicSuccess();
      server = new MockServer(config);

      const startPromise = server.start();
      await vi.runAllTimersAsync();
      const serverInfo = await startPromise;

      expect(serverInfo.status).toBe('running');
      expect(serverInfo.port).toBe(3000);

      await server.stop();
      expect(server.getInfo().status).toBe('stopped');
    }, 10000);

    it('creates connections', async () => {
      const config = CodexWebSocketMock.basicSuccess();
      server = new MockServer(config);

      const startPromise = server.start();
      await vi.runAllTimersAsync();
      await startPromise;

      const connection = await server.createConnection('websocket');
      expect(connection.connectionType).toBe('websocket');
      expect(server.getConnections()).toHaveLength(1);
    }, 10000);
  });

  describe('Adapter-Specific Mocks', () => {
    it('creates codex sdk code generation scenario', () => {
      const config = CodexSdkMock.codeGeneration();
      expect(config.name).toBe('codex-sdk-codegen');
      const codeExecuteEvent = config.events.find((e) =>
        e.type === 'tool_call_start' && e.data.toolName === 'code_execute',
      );
      expect(codeExecuteEvent).toBeDefined();
    });

    it('creates pi sdk web search scenario', () => {
      const config = PiSdkMock.webSearch();
      expect(config.name).toBe('pi-sdk-web-search');
      const searchEvent = config.events.find((e) =>
        e.type === 'tool_call_start' && e.data.toolName === 'search_web',
      );
      expect(searchEvent).toBeDefined();
    });
  });

  describe('Mock Scenarios', () => {
    it('provides scenario families', () => {
      expect(mockScenarios.basicSuccess.programmatic).toBeDefined();
      expect(mockScenarios.basicSuccess.remote).toBeDefined();
      expect(mockScenarios.errors.connectionDrop).toBeDefined();
      expect(mockScenarios.performance.highThroughput).toBeDefined();
      expect(mockScenarios.edgeCases.malformedEvents).toBeDefined();
    });
  });

  describe('Utility Functions', () => {
    it('creates adapter mock with different scenarios', () => {
      const basicClaude = createAdapterMock('claude-agent-sdk', 'basic');
      expect(basicClaude.name).toBe('claude-agent-sdk-basic');

      const toolsClaude = createAdapterMock('claude-agent-sdk', 'tools');
      expect(toolsClaude.name).toBe('claude-agent-sdk-tools');

      const errorClaude = createAdapterMock('claude-agent-sdk', 'error');
      expect(errorClaude.authSucceeds).toBe(false);
    });

    it('validates mock scenarios', async () => {
      const config = ClaudeAgentSdkMock.basicSuccess();
      const isValid = await testMockScenario(config, ['session_start', 'text_delta']);
      expect(isValid).toBe(true);
      expect(await testMockScenario(null, ['session_start'])).toBe(false);
    });
  });

  describe('Integration', () => {
    it('provides complete mock ecosystem', () => {
      expect(adapterMocks.factory).toBeInstanceOf(AdapterMockFactory);
      expect(adapterMocks.claude).toBe(ClaudeAgentSdkMock);
      expect(adapterMocks.codex.sdk).toBe(CodexSdkMock);
      expect(adapterMocks.codex.websocket).toBe(CodexWebSocketMock);
      expect(adapterMocks.pi).toBe(PiSdkMock);
      expect(adapterMocks.opencode).toBe(OpenCodeHttpMock);
      expect(adapterMocks.scenarios).toBe(mockScenarios);
    });
  });
});
