/**
 * Configuration-related types for @a5c-ai/agent-mux.
 *
 * Defines agent config, config schema, config fields,
 * and validation result types.
 *
 * @see 08-config-and-auth.md
 */

import type { AgentName, McpServerConfig } from './types.js';

// ---------------------------------------------------------------------------
// AgentConfig
// ---------------------------------------------------------------------------

/** Unified agent configuration structure. */
export interface AgentConfig {
  /** The agent this configuration belongs to. */
  readonly agent?: AgentName;

  /** Configuration source: global, project, or merged. */
  readonly source?: 'global' | 'project' | 'merged';

  /** File paths the configuration was loaded from. */
  readonly filePaths?: string[];

  /** Default model ID. */
  model?: string | null;

  /** Provider name. */
  provider?: string | null;

  /** Sampling temperature. */
  temperature?: number;

  /** Maximum output tokens. */
  maxTokens?: number;

  /** Allowed shell commands. */
  allowedCommands?: string[];

  /** Denied shell commands. */
  deniedCommands?: string[];

  /** Approval mode for tool calls. */
  approvalMode?: 'yolo' | 'prompt' | 'deny';

  /** MCP server configurations. */
  mcpServers?: McpServerConfig[];

  /** Skills to load. */
  skills?: string[];

  /** Path to the agents doc file. */
  agentsDoc?: string;

  /** Environment variables. */
  env?: Record<string, string>;

  /** Native agent-specific configuration. */
  native?: Record<string, unknown>;

  /** Index signature for dynamic access. */
  [key: string]: unknown;
}

/** Effective model selection state for an agent. */
export interface ModelSelection {
  /** Explicitly configured model, if any. */
  readonly configuredModel: string | null;

  /** Explicitly configured provider, if any. */
  readonly configuredProvider: string | null;

  /** Adapter-declared default model. */
  readonly defaultModel: string | null;

  /** Effective model after config fallback to adapter default. */
  readonly effectiveModel: string | null;
}

// ---------------------------------------------------------------------------
// ConfigField
// ---------------------------------------------------------------------------

/** Describes a single configuration field within an agent's config schema. */
export interface ConfigField {
  /** Dot-notation field path. */
  readonly path: string;

  /** Human-readable label. */
  readonly label: string;

  /** Brief description. */
  readonly description: string;

  /** Value type. */
  readonly type: 'string' | 'number' | 'boolean' | 'enum' | 'string[]' | 'object' | 'McpServerConfig[]';

  /** Whether the field is required. */
  readonly required: boolean;

  /** Default value. */
  readonly defaultValue?: unknown;

  /** Allowed values for enum type. */
  readonly enumValues?: string[];

  /** Minimum for numeric fields. */
  readonly min?: number;

  /** Maximum for numeric fields. */
  readonly max?: number;

  /** Regex pattern for string values. */
  readonly pattern?: string;

  /** Whether this maps to a normalized AgentConfig field. */
  readonly normalized: boolean;

  /** Native key path in the agent's config file. */
  readonly nativeKeyPath: string;

  /** Which config scope(s) this field can appear in. */
  readonly scope: 'global' | 'project' | 'both';
}

// ---------------------------------------------------------------------------
// AgentConfigSchema
// ---------------------------------------------------------------------------

/** Agent configuration schema descriptor. */
export interface AgentConfigSchema {
  /** The agent this schema belongs to. */
  readonly agent?: AgentName;

  /** Schema version (for backward compat). */
  readonly version?: number;

  /** Schema fields. */
  readonly fields: ConfigField[] | unknown[];

  /** Global config file paths. */
  readonly configFilePaths?: string[];

  /** Project config file paths. */
  readonly projectConfigFilePaths?: string[];

  /** Config file format. */
  readonly configFormat?: 'json' | 'yaml';

  /** Whether this agent supports project-level config. */
  readonly supportsProjectConfig?: boolean;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Validation result from ConfigManager.validate(). */
export interface ValidationResult {
  /** Whether the config is valid. */
  readonly valid: boolean;

  /** Field-level validation errors. */
  readonly errors: ConfigValidationError[];

  /** Field-level warnings. */
  readonly warnings: ConfigValidationWarning[];
}

/** A single validation error for a config field. */
export interface ConfigValidationError {
  /** Dot-notation path to the field. */
  readonly field: string;

  /** Error code. */
  readonly code:
    | 'required'
    | 'type_mismatch'
    | 'out_of_range'
    | 'invalid_enum'
    | 'pattern_mismatch'
    | 'unknown_field'
    | 'invalid_format';

  /** Human-readable error message. */
  readonly message: string;

  /** The invalid value. */
  readonly value?: unknown;

  /** Expected type or constraint. */
  readonly expected?: string;
}

/** A non-fatal validation warning. */
export interface ConfigValidationWarning {
  /** Dot-notation path to the field. */
  readonly field: string;

  /** Warning code. */
  readonly code: 'deprecated' | 'non_standard';

  /** Human-readable warning message. */
  readonly message: string;

  /** Suggested replacement. */
  readonly suggestion?: string;
}
