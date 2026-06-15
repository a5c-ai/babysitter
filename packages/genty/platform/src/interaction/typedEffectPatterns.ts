/**
 * Typed effect interaction patterns (GAP-UX-010).
 *
 * Defines interaction patterns for each effect kind — input schemas,
 * output schemas, and rendering hints — so UIs can present effects
 * consistently and validate user input.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SchemaField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  description?: string;
}

export interface RenderHints {
  /** Preferred UI widget. */
  widget: 'terminal' | 'form' | 'dialog' | 'inline' | 'panel';
  /** Whether the effect supports streaming output. */
  streaming?: boolean;
  /** Whether user confirmation is required before execution. */
  requiresConfirmation?: boolean;
  /** Icon suggestion for the UI. */
  icon?: string;
}

export interface EffectInteractionPattern {
  kind: string;
  inputSchema: SchemaField[];
  outputSchema: SchemaField[];
  renderHints: RenderHints;
}

export interface EffectLike {
  kind: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Built-in patterns
// ---------------------------------------------------------------------------

export const BUILT_IN_PATTERNS: readonly EffectInteractionPattern[] = [
  {
    kind: 'agent',
    inputSchema: [
      { name: 'prompt', type: 'string', required: true, description: 'Prompt to send to the agent' },
      { name: 'model', type: 'string', required: false, description: 'Target model override' },
    ],
    outputSchema: [
      { name: 'response', type: 'string', required: true, description: 'Agent response text' },
      { name: 'tokenUsage', type: 'object', required: false, description: 'Token usage stats' },
    ],
    renderHints: {
      widget: 'panel',
      streaming: true,
      requiresConfirmation: false,
      icon: 'robot',
    },
  },
  {
    kind: 'shell',
    inputSchema: [
      { name: 'command', type: 'string', required: true, description: 'Shell command to execute' },
      { name: 'cwd', type: 'string', required: false, description: 'Working directory' },
      { name: 'timeout', type: 'number', required: false, description: 'Timeout in ms' },
    ],
    outputSchema: [
      { name: 'stdout', type: 'string', required: true, description: 'Standard output' },
      { name: 'stderr', type: 'string', required: false, description: 'Standard error' },
      { name: 'exitCode', type: 'number', required: true, description: 'Exit code' },
    ],
    renderHints: {
      widget: 'terminal',
      streaming: true,
      requiresConfirmation: true,
      icon: 'terminal',
    },
  },
  {
    kind: 'breakpoint',
    inputSchema: [
      { name: 'message', type: 'string', required: true, description: 'Message to show at breakpoint' },
      { name: 'choices', type: 'array', required: false, description: 'Available choices' },
    ],
    outputSchema: [
      { name: 'selection', type: 'string', required: true, description: 'User selection or input' },
    ],
    renderHints: {
      widget: 'dialog',
      streaming: false,
      requiresConfirmation: true,
      icon: 'pause',
    },
  },
  {
    kind: 'sleep',
    inputSchema: [
      { name: 'durationMs', type: 'number', required: true, description: 'Duration in milliseconds' },
      { name: 'reason', type: 'string', required: false, description: 'Reason for waiting' },
    ],
    outputSchema: [
      { name: 'elapsed', type: 'number', required: true, description: 'Actual elapsed time in ms' },
    ],
    renderHints: {
      widget: 'inline',
      streaming: false,
      requiresConfirmation: false,
      icon: 'clock',
    },
  },
  {
    kind: 'mcp',
    inputSchema: [
      { name: 'server', type: 'string', required: true, description: 'MCP server name' },
      { name: 'tool', type: 'string', required: true, description: 'Tool to invoke' },
      { name: 'args', type: 'object', required: false, description: 'Tool arguments' },
    ],
    outputSchema: [
      { name: 'result', type: 'object', required: true, description: 'Tool result' },
      { name: 'error', type: 'string', required: false, description: 'Error message if failed' },
    ],
    renderHints: {
      widget: 'panel',
      streaming: false,
      requiresConfirmation: false,
      icon: 'plug',
    },
  },
];

// ---------------------------------------------------------------------------
// getPatternForEffect
// ---------------------------------------------------------------------------

/**
 * Find the interaction pattern for a given effect.
 */
export function getPatternForEffect(effect: EffectLike): EffectInteractionPattern | undefined {
  return BUILT_IN_PATTERNS.find((p) => p.kind === effect.kind);
}

// ---------------------------------------------------------------------------
// validateEffectInput
// ---------------------------------------------------------------------------

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate input data against a pattern's input schema.
 */
export function validateEffectInput(
  pattern: EffectInteractionPattern,
  input: Record<string, unknown>,
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const field of pattern.inputSchema) {
    const value = input[field.name];

    // Required check
    if (field.required && (value === undefined || value === null)) {
      errors.push({ field: field.name, message: `Required field "${field.name}" is missing` });
      continue;
    }

    // Type check (only if value is present)
    if (value !== undefined && value !== null) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== field.type) {
        errors.push({
          field: field.name,
          message: `Expected ${field.type} for "${field.name}", got ${actualType}`,
        });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// formatEffectSummary
// ---------------------------------------------------------------------------

/**
 * Format a human-readable summary of an effect result.
 */
export function formatEffectSummary(
  pattern: EffectInteractionPattern,
  result: Record<string, unknown>,
): string {
  const parts: string[] = [`[${pattern.kind}]`];

  switch (pattern.kind) {
    case 'shell': {
      const code = result.exitCode ?? '?';
      const cmd = typeof result.command === 'string' ? result.command : '';
      parts.push(`exit=${code}`);
      if (cmd) parts.push(cmd.length > 60 ? cmd.slice(0, 57) + '...' : cmd);
      break;
    }
    case 'agent': {
      const resp = typeof result.response === 'string' ? result.response : '';
      const preview = resp.length > 80 ? resp.slice(0, 77) + '...' : resp;
      if (preview) parts.push(preview);
      break;
    }
    case 'breakpoint': {
      const sel = typeof result.selection === 'string' ? result.selection : 'n/a';
      parts.push(`selected: ${sel}`);
      break;
    }
    case 'sleep': {
      const elapsed = typeof result.elapsed === 'number' ? result.elapsed : 0;
      parts.push(`waited ${elapsed}ms`);
      break;
    }
    case 'mcp': {
      const tool = typeof result.tool === 'string' ? result.tool : '';
      const err = typeof result.error === 'string' ? result.error : '';
      if (tool) parts.push(tool);
      if (err) parts.push(`ERROR: ${err}`);
      break;
    }
    default: {
      // Generic: show keys
      const keys = Object.keys(result).slice(0, 3);
      if (keys.length > 0) parts.push(`keys: ${keys.join(', ')}`);
    }
  }

  return parts.join(' ');
}
