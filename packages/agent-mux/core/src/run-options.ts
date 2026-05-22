/**
 * RunOptions interface and validation for @a5c-ai/agent-mux.
 *
 * Defines the full set of options accepted by `AgentMuxClient.run()`
 * and the validation logic that enforces spec constraints.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

import type {
  AgentName,
  Attachment,
  ErrorCode,
  InputRequiredEvent,
  ApprovalRequestEvent,
  McpServerConfig,
  RetryPolicy,
  ValidationFieldError,
} from './types.js';
import type { RuntimeHooks } from './runtime-hooks.js';
import { ValidationError } from './errors.js';
import type { InvocationMode } from './invocation.js';
import {
  VALID_ERROR_CODES,
  PROFILE_NAME_RE,
  MCP_NAME_RE,
  ULID_RE,
} from './run-options-validation.js';

export {
  PROHIBITED_PROFILE_FIELDS,
  validateProfileData,
} from './run-options-validation.js';

// ---------------------------------------------------------------------------
// RunOptions (§2)
// ---------------------------------------------------------------------------

/**
 * Full configuration for a single agent run.
 *
 * Only `agent` and `prompt` are required; all other fields are optional
 * and fall back to profile, client, or global defaults.
 */
export interface RunOptions {
  // --- Required ---

  /** The agent to invoke. */
  agent: AgentName;

  /** The prompt to send to the agent. */
  prompt: string | string[];

  // --- System prompt ---

  /** System prompt text to inject. */
  systemPrompt?: string;

  /** How to combine the system prompt with the agent's default. */
  systemPromptMode?: 'prepend' | 'append' | 'replace';

  // --- Attachments ---

  /** File or data attachments to include with the prompt. */
  attachments?: Attachment[];

  // --- Model ---

  /** Model identifier (agent-specific). */
  model?: string;

  // --- Thinking ---

  /** Thinking effort level. */
  thinkingEffort?: 'low' | 'medium' | 'high' | 'max';

  /** Thinking budget in tokens. Must be >= 1024. */
  thinkingBudgetTokens?: number;

  /** Override thinking behavior entirely (agent-specific). */
  thinkingOverride?: Record<string, unknown>;

  // --- Sampling ---

  /** Sampling temperature. Must be in [0, 2]. */
  temperature?: number;

  /** Top-P nucleus sampling. Must be in [0, 1]. */
  topP?: number;

  /** Top-K sampling. Must be an integer >= 1. */
  topK?: number;

  /** Maximum tokens for the response. Must be >= 1. */
  maxTokens?: number;

  /** Maximum output tokens (alias). Must be >= 1. */
  maxOutputTokens?: number;

  // --- Session ---

  /** Resume an existing session by ID. Mutually exclusive with forkSessionId and noSession. */
  sessionId?: string;

  /** Fork from an existing session. Mutually exclusive with sessionId and noSession. */
  forkSessionId?: string;

  /** Start with no session context. Mutually exclusive with sessionId and forkSessionId. */
  noSession?: boolean;

  // --- Output ---

  /** Enable streaming. */
  stream?: boolean | 'auto';

  /** Output format. */
  outputFormat?: 'text' | 'json' | 'jsonl';

  /** Force headless one-shot prompt delivery instead of stdin-driven interactive transport. */
  nonInteractive?: boolean;

  /**
   * Spawn the harness with a real PTY (via node-pty) so it gets a TTY for
   * interactive features (colors, prompt input, tool approval UIs).
   * Output is tee'd through the event parser so hooks still fire.
   */
  interactive?: boolean;

  // --- Environment ---

  /** Working directory for the agent process. Must be an absolute path. */
  cwd?: string;

  /** Additional environment variables for the agent process. */
  env?: Record<string, string>;

  // --- Timeouts ---

  /** Overall run timeout in milliseconds. Must be a non-negative integer. */
  timeout?: number;

  /** Inactivity timeout in milliseconds. Must be a non-negative integer. */
  inactivityTimeout?: number;

  /** Maximum number of agent turns. Must be >= 1. */
  maxTurns?: number;

  // --- Approval ---

  /** Approval mode for tool calls and file operations. */
  approvalMode?: 'yolo' | 'prompt' | 'deny';

  /** Callback invoked when the agent requires user input. Returns the input text. */
  onInputRequired?: (event: InputRequiredEvent) => Promise<string>;

  /** Callback invoked when the agent requests tool call approval. Returns the decision. */
  onApprovalRequest?: (event: ApprovalRequestEvent) => Promise<'approve' | 'deny'>;

  // --- Extensions ---

  /** In-process runtime hooks for this run only. */
  hooks?: RuntimeHooks;

  /** Skills to load for this run. */
  skills?: string[];

  /** Path or content for the agents doc. */
  agentsDoc?: string;

  /** MCP server configurations for this run. */
  mcpServers?: McpServerConfig[];

  /** Retry policy for transient failures. */
  retryPolicy?: RetryPolicy;

  // --- Metadata ---

  /** Explicit run ID (ULID format, 26 Crockford base32 chars). */
  runId?: string;

  /** Tags for run indexing and filtering. */
  tags?: string[];

  /** Project ID for multi-project setups. */
  projectId?: string;

  /** Named profile to apply as a base layer. Must match `^[a-zA-Z0-9_-]{1,64}$`. */
  profile?: string;

  // --- Advanced ---

  /** Whether to collect all events in memory. */
  collectEvents?: boolean;

  /** Grace period in milliseconds for cleanup on abort. */
  gracePeriodMs?: number;

  /** Invocation mode — how to spawn the underlying process (local, docker, ssh, k8s). */
  invocation?: InvocationMode;

  // --- Provider Configuration ---

  /** Provider configuration for model/provider selection. */
  providerConfig?: import('./provider-config.js').ProviderConfig;

  /** Named provider profile from ~/.amux/providers.json. */
  providerProfile?: string;
}

// ---------------------------------------------------------------------------
// RunHandle (§5.3 — re-exported from run-handle.ts)
// ---------------------------------------------------------------------------

/**
 * Handle returned by `AgentMuxClient.run()`.
 *
 * Full implementation lives in run-handle.ts. Re-exported here for
 * backwards compatibility with imports from run-options.
 */
export type { RunHandle } from './run-handle.js';

// ---------------------------------------------------------------------------
// validateRunOptions (§6.4)
// ---------------------------------------------------------------------------

/**
 * Validate RunOptions according to the spec validation order.
 *
 * Validation order:
 * 1. Session mutual exclusivity
 * 2. Required fields (agent, prompt non-empty)
 * 3. Range validation for numeric/enum fields
 * 4. Attachment validation
 * 5. McpServerConfig validation
 *
 * @throws ValidationError if any fields are invalid.
 */
export function validateRunOptions(options: RunOptions): void {
  // §6.4: Validation stops at the first failure group.

  // 1. Session mutual exclusivity (§6.1 — per-pair error messages)
  {
    const errors: ValidationFieldError[] = [];
    const hasSession = options.sessionId !== undefined;
    const hasFork = options.forkSessionId !== undefined;
    const hasNoSession = options.noSession === true;

    if (hasSession && hasNoSession) {
      errors.push({
        field: 'sessionId',
        message: 'sessionId and noSession are mutually exclusive',
        received: { sessionId: options.sessionId, noSession: options.noSession },
        expected: 'mutually exclusive',
      });
    }
    if (hasSession && hasFork) {
      errors.push({
        field: 'sessionId',
        message: 'sessionId and forkSessionId are mutually exclusive',
        received: { sessionId: options.sessionId, forkSessionId: options.forkSessionId },
        expected: 'mutually exclusive',
      });
    }
    if (hasFork && hasNoSession) {
      errors.push({
        field: 'forkSessionId',
        message: 'forkSessionId and noSession are mutually exclusive',
        received: { forkSessionId: options.forkSessionId, noSession: options.noSession },
        expected: 'mutually exclusive',
      });
    }
    if (errors.length > 0) throw new ValidationError(errors);
  }

  // 2. Required fields
  {
    const errors: ValidationFieldError[] = [];
    if (!options.agent || (typeof options.agent === 'string' && options.agent.trim() === '')) {
      errors.push({
        field: 'agent',
        message: 'is required and must be a non-empty string',
        received: options.agent,
        expected: 'AgentName (non-empty string)',
      });
    }

    if (options.prompt === undefined || options.prompt === null) {
      errors.push({
        field: 'prompt',
        message: 'is required',
        received: options.prompt,
        expected: 'string | string[] (non-empty)',
      });
    } else if (typeof options.prompt === 'string') {
      if (options.prompt.trim() === '') {
        errors.push({
          field: 'prompt',
          message: 'must not be empty',
          received: options.prompt,
          expected: 'non-empty string',
        });
      }
    } else if (Array.isArray(options.prompt)) {
      if (options.prompt.length === 0 || options.prompt.every(s => s.trim() === '')) {
        errors.push({
          field: 'prompt',
          message: 'must not be empty',
          received: options.prompt,
          expected: 'non-empty string[]',
        });
      }
    }
    if (errors.length > 0) throw new ValidationError(errors);
  }

  // 3. Range validation for numeric/enum fields
  const errors: ValidationFieldError[] = [];

  if (options.temperature !== undefined) {
    if (typeof options.temperature !== 'number' || !Number.isFinite(options.temperature) || options.temperature < 0 || options.temperature > 2) {
      errors.push({ field: 'temperature', message: 'must be a number in [0, 2]', received: options.temperature, expected: '[0, 2]' });
    }
  }

  if (options.topP !== undefined) {
    if (typeof options.topP !== 'number' || !Number.isFinite(options.topP) || options.topP < 0 || options.topP > 1) {
      errors.push({ field: 'topP', message: 'must be a number in [0, 1]', received: options.topP, expected: '[0, 1]' });
    }
  }

  if (options.topK !== undefined) {
    if (typeof options.topK !== 'number' || !Number.isFinite(options.topK) || options.topK < 1 || !Number.isInteger(options.topK)) {
      errors.push({ field: 'topK', message: 'must be an integer >= 1', received: options.topK, expected: '>= 1 (integer)' });
    }
  }

  if (options.maxTokens !== undefined) {
    if (typeof options.maxTokens !== 'number' || !Number.isFinite(options.maxTokens) || options.maxTokens < 1 || !Number.isInteger(options.maxTokens)) {
      errors.push({ field: 'maxTokens', message: 'must be an integer >= 1', received: options.maxTokens, expected: '>= 1 (integer)' });
    }
  }

  if (options.maxOutputTokens !== undefined) {
    if (typeof options.maxOutputTokens !== 'number' || !Number.isFinite(options.maxOutputTokens) || options.maxOutputTokens < 1 || !Number.isInteger(options.maxOutputTokens)) {
      errors.push({ field: 'maxOutputTokens', message: 'must be an integer >= 1', received: options.maxOutputTokens, expected: '>= 1 (integer)' });
    }
  }

  if (options.thinkingBudgetTokens !== undefined) {
    if (typeof options.thinkingBudgetTokens !== 'number' || !Number.isFinite(options.thinkingBudgetTokens) || options.thinkingBudgetTokens < 1024 || !Number.isInteger(options.thinkingBudgetTokens)) {
      errors.push({ field: 'thinkingBudgetTokens', message: 'must be an integer >= 1024', received: options.thinkingBudgetTokens, expected: '>= 1024 (integer)' });
    }
  }

  if (options.timeout !== undefined) {
    if (typeof options.timeout !== 'number' || !Number.isFinite(options.timeout) || options.timeout < 0 || !Number.isInteger(options.timeout)) {
      errors.push({ field: 'timeout', message: 'must be a non-negative integer', received: options.timeout, expected: '>= 0 (integer, ms)' });
    }
  }

  if (options.inactivityTimeout !== undefined) {
    if (typeof options.inactivityTimeout !== 'number' || !Number.isFinite(options.inactivityTimeout) || options.inactivityTimeout < 0 || !Number.isInteger(options.inactivityTimeout)) {
      errors.push({ field: 'inactivityTimeout', message: 'must be a non-negative integer', received: options.inactivityTimeout, expected: '>= 0 (integer, ms)' });
    }
  }

  if (options.maxTurns !== undefined) {
    if (typeof options.maxTurns !== 'number' || !Number.isFinite(options.maxTurns) || options.maxTurns < 1 || !Number.isInteger(options.maxTurns)) {
      errors.push({ field: 'maxTurns', message: 'must be an integer >= 1', received: options.maxTurns, expected: '>= 1 (integer)' });
    }
  }

  // Enum validations
  if (options.approvalMode !== undefined) {
    const valid = ['yolo', 'prompt', 'deny'];
    if (!valid.includes(options.approvalMode)) {
      errors.push({ field: 'approvalMode', message: 'must be one of: yolo, prompt, deny', received: options.approvalMode, expected: "'yolo' | 'prompt' | 'deny'" });
    }
  }

  if (options.stream !== undefined) {
    if (options.stream !== true && options.stream !== false && options.stream !== 'auto') {
      errors.push({ field: 'stream', message: "must be true, false, or 'auto'", received: options.stream, expected: "boolean | 'auto'" });
    }
  }

  if (options.systemPromptMode !== undefined) {
    const valid = ['prepend', 'append', 'replace'];
    if (!valid.includes(options.systemPromptMode)) {
      errors.push({ field: 'systemPromptMode', message: 'must be one of: prepend, append, replace', received: options.systemPromptMode, expected: "'prepend' | 'append' | 'replace'" });
    }
  }

  if (options.outputFormat !== undefined) {
    const valid = ['text', 'json', 'jsonl'];
    if (!valid.includes(options.outputFormat)) {
      errors.push({ field: 'outputFormat', message: 'must be one of: text, json, jsonl', received: options.outputFormat, expected: "'text' | 'json' | 'jsonl'" });
    }
  }

  if (options.thinkingEffort !== undefined) {
    const valid = ['low', 'medium', 'high', 'max'];
    if (!valid.includes(options.thinkingEffort)) {
      errors.push({ field: 'thinkingEffort', message: 'must be one of: low, medium, high, max', received: options.thinkingEffort, expected: "'low' | 'medium' | 'high' | 'max'" });
    }
  }

  // env values must be strings
  if (options.env !== undefined) {
    for (const [key, val] of Object.entries(options.env)) {
      if (typeof val !== 'string') {
        errors.push({ field: `env.${key}`, message: 'values must be strings', received: val, expected: 'string' });
      }
    }
  }

  // cwd must be absolute and the directory must exist
  if (options.cwd !== undefined) {
    if (!path.isAbsolute(options.cwd)) {
      errors.push({ field: 'cwd', message: 'must be an absolute path', received: options.cwd, expected: 'Absolute path' });
    } else {
      try {
        const stat = fs.statSync(options.cwd);
        if (!stat.isDirectory()) {
          errors.push({ field: 'cwd', message: 'must be an existing directory', received: options.cwd, expected: 'existing directory' });
        }
      } catch {
        errors.push({ field: 'cwd', message: 'must be an existing directory', received: options.cwd, expected: 'existing directory' });
      }
    }
  }

  // profile name pattern
  if (options.profile !== undefined) {
    if (!PROFILE_NAME_RE.test(options.profile)) {
      errors.push({ field: 'profile', message: 'must match ^[a-zA-Z0-9_-]{1,64}$', received: options.profile, expected: '^[a-zA-Z0-9_-]{1,64}$' });
    }
  }

  // runId ULID format
  if (options.runId !== undefined) {
    if (!ULID_RE.test(options.runId)) {
      errors.push({ field: 'runId', message: 'must be a valid ULID (26 Crockford base32 characters)', received: options.runId, expected: '26-char Crockford base32 ULID' });
    }
  }

  // 4. Attachment validation
  if (options.attachments !== undefined) {
    if (!Array.isArray(options.attachments)) {
      errors.push({ field: 'attachments', message: 'must be an array', received: options.attachments, expected: 'Attachment[]' });
    } else {
      for (let i = 0; i < options.attachments.length; i++) {
        const att = options.attachments[i]!;
        const prefix = `attachments[${i}]`;
        const sourceCount = [att.filePath, att.url, att.base64].filter((s) => s !== undefined).length;
        if (sourceCount !== 1) {
          errors.push({ field: prefix, message: 'must have exactly one source (filePath, url, or base64)', received: att, expected: 'exactly one of filePath | url | base64' });
        }
        if (att.base64 !== undefined && !att.mimeType) {
          errors.push({ field: `${prefix}.mimeType`, message: 'is required when base64 is set', received: att.mimeType, expected: 'string (MIME type)' });
        }
        if (att.filePath !== undefined) {
          if (!path.isAbsolute(att.filePath)) {
            errors.push({ field: `${prefix}.filePath`, message: 'must be an absolute path', received: att.filePath, expected: 'Absolute path' });
          } else {
            try {
              fs.accessSync(att.filePath, fs.constants.R_OK);
            } catch {
              errors.push({ field: `${prefix}.filePath`, message: 'file must exist and be readable', received: att.filePath, expected: 'existing readable file' });
            }
          }
        }
      }
    }
  }

  // 5. McpServerConfig validation
  if (options.mcpServers !== undefined) {
    if (!Array.isArray(options.mcpServers)) {
      errors.push({ field: 'mcpServers', message: 'must be an array', received: options.mcpServers, expected: 'McpServerConfig[]' });
    } else {
      for (let i = 0; i < options.mcpServers.length; i++) {
        const srv = options.mcpServers[i]!;
        const prefix = `mcpServers[${i}]`;
        if (!MCP_NAME_RE.test(srv.name)) {
          errors.push({ field: `${prefix}.name`, message: 'must match ^[a-zA-Z0-9_-]{1,64}$', received: srv.name, expected: '^[a-zA-Z0-9_-]{1,64}$' });
        }
        const validTransports = ['stdio', 'sse', 'streamable-http'];
        if (!validTransports.includes(srv.transport)) {
          errors.push({ field: `${prefix}.transport`, message: 'must be one of: stdio, sse, streamable-http', received: srv.transport, expected: "'stdio' | 'sse' | 'streamable-http'" });
        }
        if (srv.transport === 'stdio' && !srv.command) {
          errors.push({ field: `${prefix}.command`, message: 'is required for stdio transport', received: srv.command, expected: 'string' });
        }
        if ((srv.transport === 'sse' || srv.transport === 'streamable-http') && !srv.url) {
          errors.push({ field: `${prefix}.url`, message: `is required for ${srv.transport} transport`, received: srv.url, expected: 'string (URL)' });
        }
        // Validate env values are strings
        if (srv.env !== undefined) {
          for (const [key, val] of Object.entries(srv.env)) {
            if (typeof val !== 'string') {
              errors.push({ field: `${prefix}.env.${key}`, message: 'values must be strings', received: val, expected: 'string' });
            }
          }
        }
      }
    }
  }

  // gracePeriodMs validation
  if (options.gracePeriodMs !== undefined) {
    if (typeof options.gracePeriodMs !== 'number' || !Number.isFinite(options.gracePeriodMs) || options.gracePeriodMs < 0 || !Number.isInteger(options.gracePeriodMs)) {
      errors.push({ field: 'gracePeriodMs', message: 'must be a non-negative integer', received: options.gracePeriodMs, expected: '>= 0 (integer, ms)' });
    }
  }

  // retryPolicy validation
  if (options.retryPolicy !== undefined) {
    const rp = options.retryPolicy;
    if (rp.maxAttempts !== undefined && (typeof rp.maxAttempts !== 'number' || !Number.isFinite(rp.maxAttempts) || rp.maxAttempts < 1 || !Number.isInteger(rp.maxAttempts))) {
      errors.push({ field: 'retryPolicy.maxAttempts', message: 'must be an integer >= 1', received: rp.maxAttempts, expected: '>= 1 (integer)' });
    }
    if (rp.baseDelayMs !== undefined && (typeof rp.baseDelayMs !== 'number' || !Number.isFinite(rp.baseDelayMs) || rp.baseDelayMs < 0 || !Number.isInteger(rp.baseDelayMs))) {
      errors.push({ field: 'retryPolicy.baseDelayMs', message: 'must be a non-negative integer', received: rp.baseDelayMs, expected: '>= 0 (integer)' });
    }
    if (rp.maxDelayMs !== undefined && (typeof rp.maxDelayMs !== 'number' || !Number.isFinite(rp.maxDelayMs) || rp.maxDelayMs < 0 || !Number.isInteger(rp.maxDelayMs))) {
      errors.push({ field: 'retryPolicy.maxDelayMs', message: 'must be a non-negative integer', received: rp.maxDelayMs, expected: '>= 0 (integer)' });
    }
    // Cross-field: maxDelayMs >= baseDelayMs (using defaults)
    {
      const effectiveBase = rp.baseDelayMs ?? 1000;
      const effectiveMax = rp.maxDelayMs ?? 30_000;
      if (effectiveMax < effectiveBase) {
        errors.push({ field: 'retryPolicy.maxDelayMs', message: 'must be >= baseDelayMs', received: rp.maxDelayMs ?? effectiveMax, expected: `>= ${effectiveBase}` });
      }
    }
    if (rp.jitterFactor !== undefined && (typeof rp.jitterFactor !== 'number' || !Number.isFinite(rp.jitterFactor) || rp.jitterFactor < 0 || rp.jitterFactor > 1)) {
      errors.push({ field: 'retryPolicy.jitterFactor', message: 'must be between 0.0 and 1.0', received: rp.jitterFactor, expected: '[0.0, 1.0]' });
    }
    if (rp.retryOn !== undefined) {
      if (!Array.isArray(rp.retryOn)) {
        errors.push({ field: 'retryPolicy.retryOn', message: 'must be an array of ErrorCode strings', received: rp.retryOn, expected: 'ErrorCode[]' });
      } else {
        for (const code of rp.retryOn) {
          if (!VALID_ERROR_CODES.has(code as ErrorCode)) {
            errors.push({ field: 'retryPolicy.retryOn', message: `invalid error code: ${String(code)}`, received: code, expected: 'ErrorCode' });
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationError(errors);
  }
}
