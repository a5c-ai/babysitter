/**
 * Shared types for the agent-launch-mux package.
 */

import type { TransportId } from '@a5c-ai/agent-mux-comm';

// ---------------------------------------------------------------------------
// Launch plan types
// ---------------------------------------------------------------------------

export interface LaunchPlanInput {
  harness: string;
  provider?: string;
  model?: string;
  transport?: string;
  apiKey?: string;
  apiBase?: string;
  region?: string;
  project?: string;
  resourceGroup?: string;
  endpointName?: string;
  authCommand?: string;
  profile?: string;
  proxyMode: 'always' | 'if-needed' | 'never';
  proxyPort?: number;
  adapter?: { translateProvider?(config: Record<string, unknown>): any };
  providerArgs?: Record<string, unknown>;
}

export interface ProxyPlan {
  targetProvider: string;
  targetModel: string;
  exposedTransport: TransportId;
  port: number;
  apiBase?: string;
  apiKey?: string;
  project?: string;
  location?: string;
  useVertexAi?: boolean;
}

export interface LaunchPlan {
  harness: string;
  provider: string;
  transport: string;
  model: string;
  proxyNeeded: boolean;
  proxyReason: string;
  proxy?: ProxyPlan;
  command: string;
  args: string[];
  env: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Flag types (re-usable without depending on CLI parse-args)
// ---------------------------------------------------------------------------

/** Known flag definition for the parser. */
export interface FlagDef {
  /** Short alias (single character). */
  short?: string;

  /** Flag type. */
  type: 'boolean' | 'string' | 'number';

  /** Whether the flag can be specified multiple times. */
  repeatable?: boolean;
}

/** Parsed CLI arguments. */
export interface ParsedArgs {
  /** The command (e.g., 'run', 'adapters'). */
  command: string | undefined;

  /** The subcommand (e.g., 'list', 'show'). */
  subcommand: string | undefined;

  /** Remaining positional arguments after command/subcommand. */
  positionals: string[];

  /** Named flags. Boolean flags are true/false. String/number flags are strings. */
  flags: Record<string, string | boolean | string[]>;
}

// ---------------------------------------------------------------------------
// Session/prompt types
// ---------------------------------------------------------------------------

export interface SessionArgs {
  resumeId?: string;
  sessionId?: string;
  prompt?: string;
  maxTurns?: number;
  interactive?: boolean;
  bridgeInteractive?: boolean;
}
