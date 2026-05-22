import { describe, expect, it } from 'vitest';

import { listRunnableGatewayAgents } from '../src/builtin-adapters.js';

describe('listRunnableGatewayAgents', () => {
  it('surfaces Claude CLI as a persistent interactive transport when capabilities advertise it', async () => {
    const agents = await listRunnableGatewayAgents({
      adapters: {
        list: () => [
          { agent: 'claude', displayName: 'Claude Code' },
          { agent: 'claude-agent-sdk', displayName: 'Claude (Agent SDK)' },
          { agent: 'codex', displayName: 'Codex' },
        ],
        installed: async () => [
          { agent: 'claude', installed: true, meetsMinVersion: true },
          { agent: 'claude-agent-sdk', installed: true, meetsMinVersion: true },
          { agent: 'codex', installed: true, meetsMinVersion: true },
        ],
        get: (agent: string) => {
          switch (agent) {
            case 'claude':
              return {
                adapterType: 'subprocess',
                capabilities: {
                  structuredSessionTransport: 'persistent',
                  sessionControlPlane: 'self-managed',
                  supportsInteractiveMode: true,
                  canResume: true,
                },
              };
            case 'claude-agent-sdk':
              return {
                adapterType: 'programmatic',
                capabilities: {
                  structuredSessionTransport: 'persistent',
                  sessionControlPlane: 'self-managed',
                  supportsInteractiveMode: true,
                  canResume: true,
                },
              };
            case 'codex':
              return {
                adapterType: 'subprocess',
                capabilities: {
                  structuredSessionTransport: 'restart-per-turn',
                  sessionControlPlane: 'self-managed',
                  supportsInteractiveMode: false,
                  canResume: true,
                },
              };
            default:
              return undefined;
          }
        },
      },
    } as never);

    expect(agents).toEqual([
      expect.objectContaining({
        agent: 'claude-agent-sdk',
        adapterType: 'programmatic',
        structuredSessionTransport: 'persistent',
        sessionControlPlane: 'self-managed',
        supportsInteractiveMode: true,
      }),
      expect.objectContaining({
        agent: 'claude',
        adapterType: 'subprocess',
        structuredSessionTransport: 'persistent',
        sessionControlPlane: 'self-managed',
        supportsInteractiveMode: true,
      }),
      expect.objectContaining({
        agent: 'codex',
        structuredSessionTransport: 'restart-per-turn',
        sessionControlPlane: 'self-managed',
        supportsInteractiveMode: false,
      }),
    ]);
  });
});
