export type {
  ProgrammaticMockConfig,
  RemoteMockConfig,
  MockStreamEvent,
  ProgrammaticMockResponse,
  MockServerInfo,
  MockConnection,
  ProgrammaticMockBuilder,
  RemoteMockBuilder,
  ScriptableTransportBuilder,
  ScriptableTransportResponse,
  ScriptableTransportStep,
  MockConfigFactory,
  MockScenarios,
} from './mock-types.js';

export {
  ProgrammaticMockEngine,
  createProgrammaticMockBuilder,
  ClaudeAgentSdkMock,
  CodexSdkMock,
  PiSdkMock,
  programmaticMocks,
} from './programmatic-mocks.js';

export {
  MockServer,
  createMockServer,
  createRemoteMockBuilder,
  OpenCodeHttpMock,
  CodexWebSocketMock,
  remoteMocks,
} from './remote-mocks.js';

export {
  ScriptableTransportBuilderImpl,
  createScriptableTransportBuilder,
} from './scriptable-transport.js';

import {
  ProgrammaticMockEngine,
  createProgrammaticMockBuilder,
  ClaudeAgentSdkMock,
  CodexSdkMock,
  PiSdkMock,
  programmaticMocks,
} from './programmatic-mocks.js';
import {
  MockServer,
  createMockServer,
  createRemoteMockBuilder,
  OpenCodeHttpMock,
  CodexWebSocketMock,
  remoteMocks,
} from './remote-mocks.js';
import {
  createScriptableTransportBuilder,
} from './scriptable-transport.js';
import type { MockConfigFactory, MockScenarios } from './mock-types.js';

export class AdapterMockFactory implements MockConfigFactory {
  claudeAgentSdk() {
    return createProgrammaticMockBuilder().name('claude-agent-sdk-default');
  }

  codexSdk() {
    return createProgrammaticMockBuilder().name('codex-sdk-default');
  }

  piSdk() {
    return createProgrammaticMockBuilder().name('pi-sdk-default');
  }

  opencodeHttp() {
    return createRemoteMockBuilder().name('opencode-http-default');
  }

  codexWebSocket() {
    return createRemoteMockBuilder().name('codex-websocket-default');
  }

  programmatic() {
    return createProgrammaticMockBuilder();
  }

  remote() {
    return createRemoteMockBuilder();
  }

  scriptedTransport() {
    return createScriptableTransportBuilder();
  }
}

export const mockScenarios: MockScenarios = {
  basicSuccess: {
    programmatic: ClaudeAgentSdkMock.basicSuccess(),
    remote: OpenCodeHttpMock.basicSuccess(),
  },
  toolCalling: {
    programmatic: ClaudeAgentSdkMock.toolCalling(),
    remote: OpenCodeHttpMock.basicSuccess(),
  },
  errors: {
    authFailure: ClaudeAgentSdkMock.authFailure(),
    networkTimeout: OpenCodeHttpMock.networkTimeout(),
    connectionDrop: CodexWebSocketMock.connectionDrop(),
    invalidResponse: createRemoteMockBuilder()
      .name('invalid-response')
      .addEvents([{ type: 'invalid_event_type', data: { malformed: true }, delayMs: 100 }])
      .build(),
  },
  performance: {
    highThroughput: CodexWebSocketMock.highThroughput(),
    lowLatency: createProgrammaticMockBuilder()
      .name('low-latency')
      .addTextStream('Fast response', 50, 10)
      .withCost(10, 15)
      .build(),
    largeBatch: createProgrammaticMockBuilder()
      .name('large-batch')
      .addTextStream('Lorem ipsum '.repeat(100), 20, 25)
      .withCost(500, 200)
      .build(),
  },
  edgeCases: {
    emptyResponse: createProgrammaticMockBuilder()
      .name('empty-response')
      .withCost(5, 0)
      .build(),
    malformedEvents: createRemoteMockBuilder()
      .name('malformed-events')
      .addEvents([{ type: 'invalid_event_type', data: { malformed: true }, delayMs: 100 }])
      .build(),
    reconnection: CodexWebSocketMock.connectionDrop(),
  },
};

export function createAdapterMock(
  adapterName: 'claude-agent-sdk' | 'codex-sdk' | 'pi-sdk' | 'opencode-http' | 'codex-websocket',
  scenario: 'basic' | 'tools' | 'error' | 'performance' = 'basic',
) {
  switch (adapterName) {
    case 'claude-agent-sdk':
      switch (scenario) {
        case 'basic': return ClaudeAgentSdkMock.basicSuccess();
        case 'tools': return ClaudeAgentSdkMock.toolCalling();
        case 'error': return ClaudeAgentSdkMock.authFailure();
        default: return ClaudeAgentSdkMock.basicSuccess();
      }
    case 'codex-sdk':
      switch (scenario) {
        case 'basic': return CodexSdkMock.basicSuccess();
        case 'tools': return CodexSdkMock.codeGeneration();
        default: return CodexSdkMock.basicSuccess();
      }
    case 'pi-sdk':
      switch (scenario) {
        case 'basic': return PiSdkMock.basicSuccess();
        case 'tools': return PiSdkMock.webSearch();
        default: return PiSdkMock.basicSuccess();
      }
    case 'opencode-http':
      switch (scenario) {
        case 'basic': return OpenCodeHttpMock.basicSuccess();
        case 'error': return OpenCodeHttpMock.networkTimeout();
        default: return OpenCodeHttpMock.basicSuccess();
      }
    case 'codex-websocket':
      switch (scenario) {
        case 'basic': return CodexWebSocketMock.basicSuccess();
        case 'performance': return CodexWebSocketMock.highThroughput();
        case 'error': return CodexWebSocketMock.connectionDrop();
        default: return CodexWebSocketMock.basicSuccess();
      }
  }
}

export async function testMockScenario(
  mockConfig: unknown,
  _expectedEventTypes: string[],
): Promise<boolean> {
  if (!mockConfig || typeof mockConfig !== 'object') {
    return false;
  }
  const maybeEvents = (mockConfig as { events?: unknown }).events;
  return Array.isArray(maybeEvents) && maybeEvents.length > 0;
}

export const adapterMocks = {
  factory: new AdapterMockFactory(),
  claude: ClaudeAgentSdkMock,
  codex: {
    sdk: CodexSdkMock,
    websocket: CodexWebSocketMock,
  },
  pi: PiSdkMock,
  opencode: OpenCodeHttpMock,
  scenarios: mockScenarios,
  createMock: createAdapterMock,
  testScenario: testMockScenario,
  programmatic: createProgrammaticMockBuilder,
  remote: createRemoteMockBuilder,
  scriptedTransport: createScriptableTransportBuilder,
  programmaticMocks,
  remoteMocks,
  MockServer,
  ProgrammaticMockEngine,
  createMockServer,
};
