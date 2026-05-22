import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AgentMuxClient } from '@a5c-ai/agent-mux-core';
import type { ParsedArgs } from '../../src/parse-args.js';
import { mcpCommand } from '../../src/commands/mcp.js';
import { ExitCode } from '../../src/exit-codes.js';

describe('mcp command', () => {
  let mockClient: AgentMuxClient;
  let mockArgs: ParsedArgs;

  beforeEach(() => {
    mockClient = {
      config: {
        getMcpServers: vi.fn().mockReturnValue([]),
        addMcpServer: vi.fn(),
        removeMcpServer: vi.fn(),
      },
      plugins: {
        list: vi.fn().mockResolvedValue([]),
        install: vi.fn(),
        uninstall: vi.fn(),
      },
    } as unknown as AgentMuxClient;
    mockArgs = {
      command: 'mcp',
      subcommand: 'list',
      positionals: ['claude'],
      flags: {},
    };
  });

  it('should list MCPs for an agent', async () => {
    const consoleSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    const exitCode = await mcpCommand(mockClient, mockArgs);

    expect(exitCode).toBe(ExitCode.SUCCESS);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('(no MCP servers installed)'));
  });

  it('should show help when requested', async () => {
    mockArgs.flags.help = true;
    const consoleSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    const exitCode = await mcpCommand(mockClient, mockArgs);

    expect(exitCode).toBe(ExitCode.SUCCESS);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Usage: amux mcp'));
  });
});