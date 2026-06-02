/**
 * Declares the capabilities and phase support of a harness adapter.
 *
 * Spec section 16.
 */
export interface AdapterCapabilities {
  name: string;
  family: 'shell-hook' | 'in-process' | 'observer';
  sessionIdQuality: 'native' | 'derived' | 'synthetic' | 'none';
  supportsOrderedFanout: boolean;
  supportsNativeAdditionalContext: boolean;
  supportsBlock: boolean;
  supportsAsk: boolean;
  supportsToolInputMutation: boolean;
  supportsToolResultMutation: boolean;
  supportsPersistedEnv: boolean;
  envPersistenceMode: 'native_env_file' | 'runtime_hook' | 'wrapper_only' | 'none';
  toolInterceptionScope: 'all' | 'shell_only' | 'partial_shell_only' | 'none';
  hostTools?: HostToolDescriptor[];
  notes?: string[];
}

export type HostToolCategory =
  | 'file'
  | 'shell'
  | 'search'
  | 'browser'
  | 'workflow'
  | 'interaction'
  | 'mcp'
  | 'other';

export type HostToolAvailability = 'built-in' | 'conditional' | 'unknown';

export interface HostToolDescriptor {
  name: string;
  category?: HostToolCategory;
  description?: string;
  availability?: HostToolAvailability;
  notes?: string[];
}
