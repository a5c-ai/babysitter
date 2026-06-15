import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface AgentCapabilities {
  supportsPlugins: boolean;
  pluginCommands: string[];
  nativePluginCommand: string;
}

const AGENT_PLUGIN_CONFIGS = {
  claude: {
    command: 'claude plugins',
    commands: ['list', 'install', 'enable', 'disable', 'marketplace', 'uninstall', 'update'],
  },
  gemini: {
    command: 'gemini extensions',
    commands: ['list', 'install', 'update'],
  },
  copilot: {
    command: 'copilot plugin',
    commands: ['list', 'install', 'update', 'uninstall'],
  },
  opencode: {
    command: 'opencode plugins',
    commands: ['list', 'install'],
  },
  omp: {
    command: 'omp plugin',
    commands: ['list', 'install', 'uninstall', 'enable', 'disable', 'doctor'],
  },
  openclaw: {
    command: 'openclaw plugins',
    commands: ['list', 'install', 'enable', 'disable', 'doctor'],
  },
  pi: {
    command: 'pi',
    commands: ['list', 'install', 'update', 'config'],
  },
  qwen: {
    command: 'qwen extensions',
    commands: ['install', 'settings'],
  }
} as const;

export async function detectAgentCapabilities(agent: string): Promise<AgentCapabilities> {
  const config = AGENT_PLUGIN_CONFIGS[agent as keyof typeof AGENT_PLUGIN_CONFIGS];

  if (!config) {
    return {
      supportsPlugins: false,
      pluginCommands: [],
      nativePluginCommand: '',
    };
  }

  try {
    await execAsync(`${config.command} --help`, { timeout: 5000 });
    return {
      supportsPlugins: true,
      pluginCommands: [...config.commands],
      nativePluginCommand: config.command,
    };
  } catch {
    return {
      supportsPlugins: false,
      pluginCommands: [],
      nativePluginCommand: '',
    };
  }
}