import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AgentMuxClient } from '@a5c-ai/agent-mux-core';
import type { ParsedArgs } from '../../src/parse-args.js';
import { pluginCommand } from '../../src/commands/plugin.js';
import { ExitCode } from '../../src/exit-codes.js';

vi.mock('../../src/lib/agent-capabilities.js', () => ({
  detectAgentCapabilities: vi.fn()
}));

vi.mock('child_process', () => ({
  exec: vi.fn()
}));

import { detectAgentCapabilities } from '../../src/lib/agent-capabilities.js';
import { exec } from 'child_process';

describe('plugin command', () => {
  let mockClient: AgentMuxClient;
  let mockArgs: ParsedArgs;
  const mockExec = vi.mocked(exec);

  beforeEach(() => {
    mockClient = {} as AgentMuxClient;
    mockArgs = {
      command: 'plugin',
      subcommand: 'list',
      positionals: ['claude'],
      flags: {},
    };
    vi.clearAllMocks();
  });

  it('should delegate to native plugin command when supported', async () => {
    vi.mocked(detectAgentCapabilities).mockResolvedValue({
      supportsPlugins: true,
      pluginCommands: ['list'],
      nativePluginCommand: 'claude plugins'
    });

    mockExec.mockImplementation((command, options, callback) => {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      setTimeout(() => callback(null, { stdout: 'mock output', stderr: '' }), 0);
      return {} as any;
    });

    const exitCode = await pluginCommand(mockClient, mockArgs);

    expect(exitCode).toBe(ExitCode.SUCCESS);
    expect(mockExec).toHaveBeenCalledWith('claude plugins list', { timeout: 30000 }, expect.any(Function));
  });

  it('should show error for unsupported agent', async () => {
    vi.mocked(detectAgentCapabilities).mockResolvedValue({
      supportsPlugins: false,
      pluginCommands: [],
      nativePluginCommand: ''
    });

    const exitCode = await pluginCommand(mockClient, mockArgs);

    expect(exitCode).toBe(ExitCode.GENERAL_ERROR);
  });

  it('should show help when requested', async () => {
    mockArgs.flags.help = true;
    const consoleSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);

    const exitCode = await pluginCommand(mockClient, mockArgs);

    expect(exitCode).toBe(ExitCode.SUCCESS);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Usage: amux plugin'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Note: Plugin support varies by agent. Use "amux mcp" for MCP servers.'));
  });

  it('should show error for missing subcommand', async () => {
    mockArgs.subcommand = undefined;

    const exitCode = await pluginCommand(mockClient, mockArgs);

    expect(exitCode).toBe(ExitCode.USAGE_ERROR);
  });

  it('should show error for missing agent name', async () => {
    mockArgs.positionals = [];

    const exitCode = await pluginCommand(mockClient, mockArgs);

    expect(exitCode).toBe(ExitCode.USAGE_ERROR);
  });

  it('should show error for unsupported subcommand', async () => {
    mockArgs.subcommand = 'invalid';
    vi.mocked(detectAgentCapabilities).mockResolvedValue({
      supportsPlugins: true,
      pluginCommands: ['list'],
      nativePluginCommand: 'claude plugins'
    });

    const exitCode = await pluginCommand(mockClient, mockArgs);

    expect(exitCode).toBe(ExitCode.USAGE_ERROR);
  });

  it('should handle exec command failure', async () => {
    vi.mocked(detectAgentCapabilities).mockResolvedValue({
      supportsPlugins: true,
      pluginCommands: ['list'],
      nativePluginCommand: 'claude plugins'
    });

    const error = new Error('Command failed') as any;
    error.code = 127;
    mockExec.mockImplementation((command, options, callback) => {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      setTimeout(() => callback(error), 0);
      return {} as any;
    });

    const exitCode = await pluginCommand(mockClient, mockArgs);

    expect(exitCode).toBe(127);
  });
});