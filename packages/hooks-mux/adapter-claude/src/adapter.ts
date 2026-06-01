import type { AdapterCapabilities } from '@a5c-ai/hooks-mux-core';
import { getPluginTargetDescriptor } from '@a5c-ai/atlas/catalog';

/**
 * Creates the Claude Code adapter capability descriptor.
 *
 * Reads capability data from the Atlas graph via the agent-catalog.
 * Falls back to hardcoded defaults if the catalog is unavailable.
 *
 * Spec section 17.1.
 */
const DEFAULT_ADAPTER_NAME = 'claude';

const CLAUDE_HOST_TOOLS: AdapterCapabilities['hostTools'] = [
  {
    name: 'Bash',
    category: 'shell',
    description: 'Run shell commands in the workspace.',
    availability: 'built-in',
  },
  {
    name: 'Read',
    category: 'file',
    description: 'Read file contents.',
    availability: 'built-in',
  },
  {
    name: 'Edit',
    category: 'file',
    description: 'Apply targeted file edits.',
    availability: 'built-in',
  },
  {
    name: 'MultiEdit',
    category: 'file',
    description: 'Apply multiple targeted edits to one file.',
    availability: 'built-in',
  },
  {
    name: 'Write',
    category: 'file',
    description: 'Create or overwrite files.',
    availability: 'built-in',
  },
  {
    name: 'Glob',
    category: 'search',
    description: 'Find files by glob pattern.',
    availability: 'built-in',
  },
  {
    name: 'Grep',
    category: 'search',
    description: 'Search file contents.',
    availability: 'built-in',
  },
  {
    name: 'Task',
    category: 'workflow',
    description: 'Delegate work to a Claude Code subagent.',
    availability: 'built-in',
  },
];

export function createAdapter(name: string = DEFAULT_ADAPTER_NAME): AdapterCapabilities {
  const target = getPluginTargetDescriptor(name === 'claude' ? 'claude-code' : name);
  return {
    name,
    family: (target?.hooksMuxFamily as AdapterCapabilities['family']) ?? 'shell-hook',
    sessionIdQuality: (target?.sessionIdQuality as AdapterCapabilities['sessionIdQuality']) ?? 'native',
    supportsOrderedFanout: target?.supportsOrderedFanout ?? true,
    supportsNativeAdditionalContext: target?.supportsNativeAdditionalContext ?? true,
    supportsBlock: target?.supportsBlock ?? true,
    supportsAsk: target?.supportsAsk ?? true,
    supportsToolInputMutation: target?.supportsToolInputMutation ?? false,
    supportsToolResultMutation: target?.supportsToolResultMutation ?? false,
    supportsPersistedEnv: target?.supportsPersistedEnv ?? true,
    envPersistenceMode: (target?.envPersistenceMode as AdapterCapabilities['envPersistenceMode']) ?? 'native_env_file',
    toolInterceptionScope: (target?.toolInterceptionScope as AdapterCapabilities['toolInterceptionScope']) ?? 'all',
    hostTools: name === DEFAULT_ADAPTER_NAME ? CLAUDE_HOST_TOOLS : undefined,
    notes: [
      'CLAUDE_ENV_FILE is only available on specific events; append semantics required',
      'turn.stop can recurse if not guarded; stop_hook_active must be checked',
      'session.start source values: startup, resume, clear, compact',
    ],
  };
}
