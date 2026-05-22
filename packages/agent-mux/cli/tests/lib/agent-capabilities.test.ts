import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('child_process', () => ({
  exec: vi.fn()
}));

import { detectAgentCapabilities } from '../../src/lib/agent-capabilities.js';
import { exec } from 'child_process';

const mockExec = vi.mocked(exec);

describe('agent capabilities detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should detect claude plugin support', async () => {
    mockExec.mockImplementation((command, options, callback) => {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      setTimeout(() => callback(null, { stdout: '', stderr: '' }), 0);
      return {} as any;
    });

    const capabilities = await detectAgentCapabilities('claude');

    // Verify exec call with correct command (promisify adds a callback)
    expect(mockExec).toHaveBeenCalledWith('claude plugins --help', { timeout: 5000 }, expect.any(Function));
    expect(capabilities.supportsPlugins).toBe(true);
    expect(capabilities.pluginCommands).toEqual(['list', 'install', 'enable', 'disable', 'marketplace', 'uninstall', 'update']);
    expect(capabilities.nativePluginCommand).toBe('claude plugins');
  });

  it('should detect gemini plugin support', async () => {
    mockExec.mockImplementation((command, options, callback) => {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      setTimeout(() => callback(null, { stdout: '', stderr: '' }), 0);
      return {} as any;
    });

    const capabilities = await detectAgentCapabilities('gemini');

    // Verify exec call with correct command (promisify adds a callback)
    expect(mockExec).toHaveBeenCalledWith('gemini extensions --help', { timeout: 5000 }, expect.any(Function));
    expect(capabilities.supportsPlugins).toBe(true);
    expect(capabilities.pluginCommands).toEqual(['list', 'install', 'update']);
    expect(capabilities.nativePluginCommand).toBe('gemini extensions');
  });

  it('should detect no plugin support for unsupported agents', async () => {
    const capabilities = await detectAgentCapabilities('nonexistent');

    // Verify exec was not called for unsupported agents
    expect(mockExec).not.toHaveBeenCalled();
    expect(capabilities.supportsPlugins).toBe(false);
    expect(capabilities.pluginCommands).toEqual([]);
    expect(capabilities.nativePluginCommand).toBe('');
  });

  it('should handle command execution failure gracefully', async () => {
    mockExec.mockImplementation((command, options, callback) => {
      if (typeof options === 'function') {
        callback = options;
        options = {};
      }
      setTimeout(() => callback(new Error('command failed')), 0);
      return {} as any;
    });

    const capabilities = await detectAgentCapabilities('claude');

    // Verify exec call was attempted (promisify adds a callback)
    expect(mockExec).toHaveBeenCalledWith('claude plugins --help', { timeout: 5000 }, expect.any(Function));
    expect(capabilities.supportsPlugins).toBe(false);
    expect(capabilities.pluginCommands).toEqual([]);
    expect(capabilities.nativePluginCommand).toBe('');
  });

  it('should test nativePluginCommand for all supported agents', async () => {
    const agentConfigs = [
      { agent: 'claude', expectedCommand: 'claude plugins' },
      { agent: 'gemini', expectedCommand: 'gemini extensions' },
      { agent: 'copilot', expectedCommand: 'copilot plugin' },
      { agent: 'opencode', expectedCommand: 'opencode plugins' },
      { agent: 'omp', expectedCommand: 'omp plugin' },
      { agent: 'openclaw', expectedCommand: 'openclaw plugins' },
      { agent: 'pi', expectedCommand: 'pi' },
      { agent: 'qwen', expectedCommand: 'qwen extensions' },
    ];

    for (const { agent, expectedCommand } of agentConfigs) {
      mockExec.mockImplementation((command, options, callback) => {
        if (typeof options === 'function') {
          callback = options;
          options = {};
        }
        setTimeout(() => callback(null, { stdout: '', stderr: '' }), 0);
        return {} as any;
      });

      const capabilities = await detectAgentCapabilities(agent);

      expect(capabilities.nativePluginCommand).toBe(expectedCommand);
      expect(mockExec).toHaveBeenCalledWith(`${expectedCommand} --help`, { timeout: 5000 }, expect.any(Function));

      vi.clearAllMocks();
    }
  });
});