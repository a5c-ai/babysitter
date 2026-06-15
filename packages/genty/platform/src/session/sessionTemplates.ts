/**
 * GAP-SESSION-003: Session Templates.
 *
 * Pre-defined templates for common session types (coding, research, review,
 * planning) with default model, extensions, and system prompt overrides.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionTemplateConfig {
  /** Maximum iterations per session. */
  maxIterations?: number;
  /** Default cost budget in USD. */
  maxCostUsd?: number;
  /** Additional key-value options. */
  [key: string]: unknown;
}

export interface SessionTemplate {
  /** Unique template identifier. */
  id: string;
  /** Human-readable template name. */
  name: string;
  /** Brief description of the template. */
  description: string;
  /** Default model for sessions using this template. */
  defaultModel: string;
  /** Extensions enabled by default. */
  extensions: string[];
  /** Optional system prompt override text. */
  systemPromptOverride?: string;
  /** Template-specific configuration. */
  config: SessionTemplateConfig;
}

export interface SessionOptions {
  model?: string;
  extensions?: string[];
  systemPrompt?: string;
  maxIterations?: number;
  maxCostUsd?: number;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Built-in templates
// ---------------------------------------------------------------------------

export const BUILT_IN_TEMPLATES: ReadonlyArray<Readonly<SessionTemplate>> = Object.freeze([
  Object.freeze({
    id: 'default',
    name: 'Default',
    description: 'General-purpose session with balanced defaults.',
    defaultModel: 'sonnet',
    extensions: [],
    config: { maxIterations: 0 },
  }),
  Object.freeze({
    id: 'coding',
    name: 'Coding',
    description: 'Optimized for code generation and debugging.',
    defaultModel: 'sonnet',
    extensions: ['code-analysis', 'test-runner'],
    systemPromptOverride: 'You are an expert software engineer. Focus on clean, tested code.',
    config: { maxIterations: 50 },
  }),
  Object.freeze({
    id: 'research',
    name: 'Research',
    description: 'Optimized for information gathering and analysis.',
    defaultModel: 'opus',
    extensions: ['web-search', 'summarizer'],
    systemPromptOverride: 'You are a thorough researcher. Cite sources and verify claims.',
    config: { maxIterations: 30 },
  }),
  Object.freeze({
    id: 'review',
    name: 'Code Review',
    description: 'Focused on reviewing code changes and providing feedback.',
    defaultModel: 'sonnet',
    extensions: ['code-analysis', 'diff-viewer'],
    systemPromptOverride: 'You are an experienced code reviewer. Be constructive and thorough.',
    config: { maxIterations: 20 },
  }),
  Object.freeze({
    id: 'planning',
    name: 'Planning',
    description: 'Session for project planning and architecture design.',
    defaultModel: 'opus',
    extensions: ['note-taking'],
    systemPromptOverride: 'You are a technical architect. Think systematically about trade-offs.',
    config: { maxIterations: 25 },
  }),
]) as ReadonlyArray<Readonly<SessionTemplate>>;

// ---------------------------------------------------------------------------
// Functions
// ---------------------------------------------------------------------------

/**
 * Retrieve a template by ID. Returns undefined if not found.
 */
export function getTemplate(id: string): SessionTemplate | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id) as SessionTemplate | undefined;
}

/**
 * List all available template IDs and names.
 */
export function listTemplates(): Array<{ id: string; name: string; description: string }> {
  return BUILT_IN_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
  }));
}

/**
 * Merge a template's defaults into session options.
 * Explicit session options take precedence over template defaults.
 */
export function applyTemplate(
  template: SessionTemplate,
  sessionOpts: SessionOptions,
): SessionOptions {
  return {
    model: sessionOpts.model ?? template.defaultModel,
    extensions: sessionOpts.extensions ?? [...template.extensions],
    systemPrompt: sessionOpts.systemPrompt ?? template.systemPromptOverride,
    maxIterations: sessionOpts.maxIterations ?? template.config.maxIterations,
    maxCostUsd: sessionOpts.maxCostUsd ?? template.config.maxCostUsd,
  };
}
