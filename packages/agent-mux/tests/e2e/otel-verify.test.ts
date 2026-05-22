import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createClient } from '@a5c-ai/agent-mux-core';

// Mock the whole module at the top level to ensure all imports get the same mock
vi.mock('@a5c-ai/agent-mux-observability', () => {
  return {
    telemetry: {
      startRunSpan: vi.fn().mockReturnValue({ 
        end: vi.fn(), 
        setStatus: vi.fn(), 
        setAttributes: vi.fn(),
        recordException: vi.fn()
      }),
      startToolCallSpan: vi.fn().mockReturnValue({ 
        end: vi.fn(), 
        setStatus: vi.fn(), 
        setAttributes: vi.fn() 
      }),
      startSubagentSpan: vi.fn().mockReturnValue({ 
        end: vi.fn(), 
        setStatus: vi.fn(), 
        setAttributes: vi.fn() 
      }),
      recordRunStart: vi.fn(),
      recordRunComplete: vi.fn(),
      recordRunError: vi.fn(),
      recordToolCall: vi.fn(),
      recordAuthEvent: vi.fn(),
      endSpanSuccess: vi.fn(),
      endSpanError: vi.fn(),
    },
    createComponentLogger: vi.fn().mockReturnValue({
      runStart: vi.fn(),
      runComplete: vi.fn(),
      runError: vi.fn(),
      toolCallStart: vi.fn(),
      toolCallComplete: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    }),
    reconfigureLogger: vi.fn(),
  };
});

// Import after mocking
import { telemetry } from '@a5c-ai/agent-mux-observability';

describe('OTEL Tracing and Metrics Verification', () => {
  beforeEach(() => {
    process.env.AMUX_OBSERVABILITY_MODE = 'full';
    vi.clearAllMocks();
  });

  it('should record spans and metrics during a run', async () => {
    const client = createClient({
      defaultAgent: 'codex',
    });
    
    const mockAdapter = {
      agent: 'codex',
      displayName: 'Codex',
      cliCommand: 'codex',
      adapterType: 'subprocess',
      capabilities: { supportsStdinInjection: true },
      models: [{ modelId: 'default', displayName: 'Default' }],
      buildSpawnArgs: () => ({ command: 'echo', args: ['hi'] }),
      detectInstallation: async () => ({ installed: true, path: '/usr/bin/echo' }),
      detectAuth: async () => ({ status: 'authenticated' }),
      parseEvent: () => null,
      sessionDir: () => '.',
      parseSessionFile: async () => ({ agent: 'codex', sessionId: 'test', messages: [] }),
      listSessionFiles: async () => [],
      readConfig: async () => ({}),
      writeConfig: async () => {},
      getAuthGuidance: () => ({ steps: [] }),
    };
    
    // @ts-ignore
    client.adapters.register(mockAdapter);
    
    const handle = client.run({
      agent: 'codex',
      prompt: 'hello',
    });
    
    expect(telemetry.startRunSpan).toHaveBeenCalled();
    
    // Simulate completion
    // @ts-ignore
    handle.complete('completed', 0, null);
    
    expect(telemetry.recordRunComplete).toHaveBeenCalled();
  });
});
