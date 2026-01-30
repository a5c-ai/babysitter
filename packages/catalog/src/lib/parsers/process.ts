/**
 * Process file parser - combines JSDoc and AST parsing for .js process files
 */

import type {
  ParseResult,
  ParsedProcess,
  JSDocInput,
  JSDocOutput,
  DefineTaskCall,
  ExportInfo,
  ParserOptions,
} from './types';
import { parseJSDoc, validateJSDoc } from './jsdoc';
import { parseAST, hasProcessFunction, extractProcessId } from './ast';

// =============================================================================
// PROCESS PARSER
// =============================================================================

/**
 * Process parser options
 */
export interface ProcessParserOptions extends ParserOptions {
  /** Whether to extract task definitions */
  extractTasks?: boolean;
  /** Whether to extract all exports */
  extractExports?: boolean;
  /** Whether to validate JSDoc completeness */
  validateJSDoc?: boolean;
}

const DEFAULT_OPTIONS: ProcessParserOptions = {
  extractTasks: true,
  extractExports: true,
  extractAST: true,
  validateJSDoc: true,
};

/**
 * Parse a process definition from .js file content
 *
 * @param content - Raw JavaScript file content
 * @param filePath - Source file path
 * @param options - Parser options
 * @returns Parsed process definition
 */
export function parseProcessContent(
  content: string,
  filePath: string = '',
  options: ProcessParserOptions = {}
): ParseResult<ParsedProcess> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const warnings: Array<{ code: string; message: string }> = [];

  // Parse JSDoc header
  const jsdocResult = parseJSDoc(content);

  if (!jsdocResult.success) {
    return {
      success: false,
      error: {
        code: 'PROCESS_PARSE_ERROR',
        message: jsdocResult.error?.message || 'Failed to parse JSDoc header',
        file: filePath,
      },
    };
  }

  const jsdoc = jsdocResult.data!;

  // Validate JSDoc if requested
  if (opts.validateJSDoc) {
    const validation = validateJSDoc(jsdoc);
    if (!validation.valid) {
      warnings.push({
        code: 'JSDOC_VALIDATION',
        message: `Missing JSDoc tags: ${validation.missing.join(', ')}`,
      });
    }
    for (const warning of validation.warnings) {
      warnings.push({
        code: 'JSDOC_WARNING',
        message: warning,
      });
    }
  }

  // Parse AST if requested
  let tasks: DefineTaskCall[] = [];
  let exports: ExportInfo[] = [];
  let hasProcess = false;

  if (opts.extractAST) {
    const astResult = parseAST(content, filePath);
    if (astResult.success && astResult.data) {
      if (opts.extractTasks) {
        tasks = astResult.data.defineTasks;
      }
      if (opts.extractExports) {
        exports = astResult.data.exports;
      }
      hasProcess = hasProcessFunction(content);
    }
  }

  // Extract process ID
  const processId = jsdoc.process || extractProcessId(content, filePath);

  // Determine category from process ID or path
  const category = extractCategory(processId, filePath);

  // Build process definition
  const process: ParsedProcess = {
    id: processId,
    description: jsdoc.description || '',
    inputs: jsdoc.inputs || parseInputsFromRaw(jsdoc.rawInputs),
    outputs: jsdoc.outputs || parseOutputsFromRaw(jsdoc.rawOutputs),
    tasks,
    exports,
    hasProcessFunction: hasProcess,
    category,
    path: filePath,
    source: {
      file: filePath,
      directory: getDirectory(filePath),
    },
  };

  return {
    success: true,
    data: process,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Parse a process from a file
 *
 * @param filePath - Path to .js file
 * @param readFile - Function to read file contents
 * @param options - Parser options
 * @returns Parsed process definition
 */
export async function parseProcessFile(
  filePath: string,
  readFile: (path: string) => Promise<string>,
  options: ProcessParserOptions = {}
): Promise<ParseResult<ParsedProcess>> {
  try {
    const content = await readFile(filePath);
    return parseProcessContent(content, filePath, options);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error reading file';
    return {
      success: false,
      error: {
        code: 'FILE_READ_ERROR',
        message: errorMessage,
        file: filePath,
      },
    };
  }
}

/**
 * Parse inputs from raw string if structured parsing failed
 */
function parseInputsFromRaw(raw: string | undefined): JSDocInput[] {
  if (!raw) return [];

  try {
    // Try to parse as JSON-like object definition
    const clean = raw.trim();
    if (!clean.startsWith('{') || !clean.endsWith('}')) {
      return [];
    }

    const inner = clean.slice(1, -1).trim();
    const inputs: JSDocInput[] = [];

    // Split by comma (simple parsing)
    const parts = splitByTopLevelComma(inner);

    for (const part of parts) {
      const colonIdx = part.indexOf(':');
      if (colonIdx === -1) continue;

      let name = part.slice(0, colonIdx).trim();
      const type = part.slice(colonIdx + 1).trim();

      // Check for optional marker
      const required = !name.endsWith('?');
      if (name.endsWith('?')) {
        name = name.slice(0, -1);
      }

      inputs.push({ name, type, required });
    }

    return inputs;
  } catch {
    return [];
  }
}

/**
 * Parse outputs from raw string if structured parsing failed
 */
function parseOutputsFromRaw(raw: string | undefined): JSDocOutput[] {
  if (!raw) return [];

  try {
    const clean = raw.trim();
    if (!clean.startsWith('{') || !clean.endsWith('}')) {
      return [];
    }

    const inner = clean.slice(1, -1).trim();
    const outputs: JSDocOutput[] = [];

    const parts = splitByTopLevelComma(inner);

    for (const part of parts) {
      const colonIdx = part.indexOf(':');
      if (colonIdx === -1) continue;

      const name = part.slice(0, colonIdx).trim();
      const type = part.slice(colonIdx + 1).trim();

      outputs.push({ name, type });
    }

    return outputs;
  } catch {
    return [];
  }
}

/**
 * Split string by comma at top level (not inside braces)
 */
function splitByTopLevelComma(str: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;

  for (const char of str) {
    if (char === '{' || char === '[' || char === '(') {
      depth++;
      current += char;
    } else if (char === '}' || char === ']' || char === ')') {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

/**
 * Extract category from process ID or file path
 */
function extractCategory(processId: string, filePath: string): string {
  // Try to extract from process ID
  if (processId.includes('/')) {
    const parts = processId.split('/');
    return parts[0] ?? 'uncategorized';
  }

  // Try to extract from file path
  const normalized = filePath.replace(/\\/g, '/');
  const methodologiesMatch = normalized.match(/\/methodologies\/([^/]+)/);
  if (methodologiesMatch) {
    return 'methodologies';
  }

  const specializationsMatch = normalized.match(/\/specializations\/([^/]+)/);
  if (specializationsMatch?.[1]) {
    return specializationsMatch[1];
  }

  return 'uncategorized';
}

/**
 * Get directory from file path
 */
function getDirectory(filePath: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const lastSlash = normalized.lastIndexOf('/');
  return lastSlash >= 0 ? normalized.slice(0, lastSlash) : '';
}

/**
 * Validate parsed process
 *
 * @param process - Parsed process to validate
 * @returns Validation result
 */
export function validateProcess(process: ParsedProcess): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!process.id) {
    errors.push('Process ID is required (via @process tag)');
  }

  if (!process.description) {
    errors.push('Process description is required (via @description tag)');
  }

  // Check for process function
  if (!process.hasProcessFunction) {
    warnings.push('Process file should export a process function');
  }

  // Check for tasks
  if (process.tasks.length === 0) {
    warnings.push('Process file has no defineTask calls');
  }

  // Check inputs/outputs documentation
  if (process.inputs.length === 0) {
    warnings.push('Process inputs not documented (via @inputs tag)');
  }

  if (process.outputs.length === 0) {
    warnings.push('Process outputs not documented (via @outputs tag)');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Convert parsed process to catalog entry format
 */
export function processToCatalogEntry(process: ParsedProcess): {
  id: string;
  type: 'process';
  name: string;
  description: string;
  path: string;
  category: string;
  tags: string[];
  metadata: Record<string, unknown>;
} {
  // Extract name from ID
  const name = process.id.includes('/')
    ? process.id.split('/').pop()!
    : process.id;

  // Generate tags from tasks and inputs
  const tags: string[] = [];

  // Add task kinds as tags
  for (const task of process.tasks) {
    if (task.kind) {
      tags.push(`kind:${task.kind}`);
    }
    if (task.labels) {
      tags.push(...task.labels.map((l) => `label:${l}`));
    }
  }

  // Add input names as tags
  for (const input of process.inputs) {
    if (input.required) {
      tags.push(`input:${input.name}`);
    }
  }

  return {
    id: process.id,
    type: 'process',
    name,
    description: process.description,
    path: process.path,
    category: process.category,
    tags: Array.from(new Set(tags)), // Remove duplicates
    metadata: {
      inputs: process.inputs,
      outputs: process.outputs,
      tasks: process.tasks.map((t) => ({
        name: t.name,
        kind: t.kind,
        title: t.title,
      })),
      hasProcessFunction: process.hasProcessFunction,
      exportCount: process.exports.length,
    },
  };
}

/**
 * Generate process summary
 */
export function generateProcessSummary(process: ParsedProcess): string {
  const parts: string[] = [];

  parts.push(`# ${process.id}`);
  parts.push('');
  parts.push(`**Category:** ${process.category}`);
  parts.push('');
  parts.push(`**Description:** ${process.description}`);
  parts.push('');

  if (process.inputs.length > 0) {
    parts.push('**Inputs:**');
    for (const input of process.inputs) {
      const required = input.required ? '' : ' (optional)';
      parts.push(`- \`${input.name}\`: ${input.type}${required}`);
    }
    parts.push('');
  }

  if (process.outputs.length > 0) {
    parts.push('**Outputs:**');
    for (const output of process.outputs) {
      parts.push(`- \`${output.name}\`: ${output.type}`);
    }
    parts.push('');
  }

  if (process.tasks.length > 0) {
    parts.push('**Tasks:**');
    for (const task of process.tasks) {
      const kind = task.kind ? ` (${task.kind})` : '';
      parts.push(`- \`${task.name}\`${kind}: ${task.title || task.description || 'No description'}`);
    }
    parts.push('');
  }

  return parts.join('\n');
}

/**
 * Get all task names from a process
 */
export function getProcessTaskNames(process: ParsedProcess): string[] {
  return process.tasks.map((t) => t.name);
}

/**
 * Check if process has required inputs
 */
export function getRequiredInputs(process: ParsedProcess): JSDocInput[] {
  return process.inputs.filter((i) => i.required);
}

/**
 * Group processes by category
 */
export function groupProcessesByCategory(
  processes: ParsedProcess[]
): Map<string, ParsedProcess[]> {
  const grouped = new Map<string, ParsedProcess[]>();

  for (const process of processes) {
    const category = process.category;
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category)!.push(process);
  }

  return grouped;
}
