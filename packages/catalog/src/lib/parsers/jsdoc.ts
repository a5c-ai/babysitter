/**
 * JSDoc parser for process .js files
 * Extracts @process, @description, @inputs, @outputs tags
 */

import type { ParseResult, ParsedJSDoc, JSDocInput, JSDocOutput } from './types';

// =============================================================================
// JSDOC PARSER
// =============================================================================

/**
 * Regular expression patterns for JSDoc parsing
 */
const PATTERNS = {
  // Match JSDoc comment block
  jsdocBlock: /\/\*\*[\s\S]*?\*\//g,
  // Match single JSDoc tag with value
  tag: /@(\w+)\s+([^\n@]*(?:\n(?!\s*@|\s*\*\/)[^\n]*)*)/g,
  // Match @process tag
  process: /@process\s+([^\n]+)/,
  // Match @description tag
  description: /@description\s+([\s\S]*?)(?=@\w|$)/,
  // Match @inputs tag - captures object definition
  inputs: /@inputs\s+(\{[\s\S]*?\})/,
  // Match @outputs tag - captures object definition
  outputs: /@outputs\s+(\{[\s\S]*?\})/,
  // Match @author tag
  author: /@author\s+([^\n]+)/,
  // Match @version tag
  version: /@version\s+([^\n]+)/,
  // Match @since tag
  since: /@since\s+([^\n]+)/,
  // Match @deprecated tag
  deprecated: /@deprecated\s*([^\n]*)/,
  // Match @see tag
  see: /@see\s+([^\n]+)/g,
  // Match @example tag
  example: /@example\s*([\s\S]*?)(?=@\w|$)/g,
};

/**
 * Parse JSDoc comments from JavaScript content
 *
 * @param content - JavaScript file content
 * @returns Parsed JSDoc information
 */
export function parseJSDoc(content: string): ParseResult<ParsedJSDoc> {
  try {
    // Find the first JSDoc block (process header comment)
    const jsdocBlocks = content.match(PATTERNS.jsdocBlock);

    if (!jsdocBlocks || jsdocBlocks.length === 0) {
      return {
        success: false,
        error: {
          code: 'NO_JSDOC_FOUND',
          message: 'No JSDoc comment block found in content',
        },
      };
    }

    const headerBlock = jsdocBlocks[0];
    if (!headerBlock) {
      return {
        success: false,
        error: {
          code: 'NO_JSDOC_FOUND',
          message: 'No JSDoc comment block found in content',
        },
      };
    }

    const result = parseJSDocBlock(headerBlock);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error parsing JSDoc';
    return {
      success: false,
      error: {
        code: 'JSDOC_PARSE_ERROR',
        message: errorMessage,
      },
    };
  }
}

/**
 * Parse a single JSDoc block
 *
 * @param block - JSDoc comment block
 * @returns Parsed JSDoc data
 */
export function parseJSDocBlock(block: string): ParsedJSDoc {
  // Clean up the block - remove comment markers
  const cleanBlock = block
    .replace(/\/\*\*/, '')
    .replace(/\*\//, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, ''))
    .join('\n')
    .trim();

  const result: ParsedJSDoc = {};

  // Extract @process
  const processMatch = cleanBlock.match(PATTERNS.process);
  if (processMatch?.[1]) {
    result.process = processMatch[1].trim();
  }

  // Extract @description
  const descMatch = cleanBlock.match(PATTERNS.description);
  if (descMatch?.[1]) {
    result.description = descMatch[1].trim();
  } else {
    // If no @description tag, use first line/paragraph as description
    const lines = cleanBlock.split('\n');
    const firstLine = lines.find((line) => !line.startsWith('@') && line.trim());
    if (firstLine) {
      result.description = firstLine.trim();
    }
  }

  // Extract @inputs
  const inputsMatch = cleanBlock.match(PATTERNS.inputs);
  if (inputsMatch?.[1]) {
    result.rawInputs = inputsMatch[1].trim();
    result.inputs = parseInputsOutputs(inputsMatch[1], 'input');
  }

  // Extract @outputs
  const outputsMatch = cleanBlock.match(PATTERNS.outputs);
  if (outputsMatch?.[1]) {
    result.rawOutputs = outputsMatch[1].trim();
    result.outputs = parseInputsOutputs(outputsMatch[1], 'output');
  }

  // Extract @author
  const authorMatch = cleanBlock.match(PATTERNS.author);
  if (authorMatch?.[1]) {
    result.author = authorMatch[1].trim();
  }

  // Extract @version
  const versionMatch = cleanBlock.match(PATTERNS.version);
  if (versionMatch?.[1]) {
    result.version = versionMatch[1].trim();
  }

  // Extract @since
  const sinceMatch = cleanBlock.match(PATTERNS.since);
  if (sinceMatch?.[1]) {
    result.since = sinceMatch[1].trim();
  }

  // Extract @deprecated
  const deprecatedMatch = cleanBlock.match(PATTERNS.deprecated);
  if (deprecatedMatch) {
    result.deprecated = deprecatedMatch[1]?.trim() || 'true';
  }

  // Extract @see tags
  const seeMatches = Array.from(cleanBlock.matchAll(PATTERNS.see));
  if (seeMatches.length > 0) {
    result.see = seeMatches
      .map((m) => m[1]?.trim())
      .filter((s): s is string => typeof s === 'string' && s.length > 0);
  }

  // Extract @example tags
  const exampleMatches = Array.from(cleanBlock.matchAll(PATTERNS.example));
  if (exampleMatches.length > 0) {
    result.example = exampleMatches
      .map((m) => m[1]?.trim())
      .filter((s): s is string => typeof s === 'string' && s.length > 0);
  }

  // Extract any other tags
  const tags: Record<string, string> = {};
  const tagMatches = Array.from(cleanBlock.matchAll(PATTERNS.tag));
  const knownTags = ['process', 'description', 'inputs', 'outputs', 'author', 'version', 'since', 'deprecated', 'see', 'example', 'param', 'returns'];
  for (const match of tagMatches) {
    const tagName = match[1];
    const tagValue = match[2]?.trim() ?? '';
    if (tagName && !knownTags.includes(tagName)) {
      tags[tagName] = tagValue;
    }
  }
  if (Object.keys(tags).length > 0) {
    result.tags = tags;
  }

  return result;
}

/**
 * Parse inputs/outputs object definition
 *
 * @param definition - Object definition string like "{ name: string, count: number }"
 * @param type - 'input' or 'output'
 * @returns Array of parsed inputs or outputs
 */
function parseInputsOutputs(
  definition: string,
  type: 'input' | 'output'
): JSDocInput[] | JSDocOutput[] {
  try {
    // Clean up the definition
    let clean = definition.trim();

    // Remove outer braces
    if (clean.startsWith('{') && clean.endsWith('}')) {
      clean = clean.slice(1, -1).trim();
    }

    const items: Array<JSDocInput | JSDocOutput> = [];

    // Split by comma (being careful about nested objects)
    const parts = splitByComma(clean);

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      // Parse "name: type" or "name?: type"
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;

      let name = trimmed.slice(0, colonIndex).trim();
      const typeStr = trimmed.slice(colonIndex + 1).trim();

      // Check for optional marker
      const required = !name.endsWith('?');
      if (name.endsWith('?')) {
        name = name.slice(0, -1);
      }

      if (type === 'input') {
        items.push({
          name,
          type: typeStr,
          required,
        } as JSDocInput);
      } else {
        items.push({
          name,
          type: typeStr,
        } as JSDocOutput);
      }
    }

    return items;
  } catch {
    return [];
  }
}

/**
 * Split string by comma, respecting nested braces
 *
 * @param str - String to split
 * @returns Array of parts
 */
function splitByComma(str: string): string[] {
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
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    parts.push(current);
  }

  return parts;
}

/**
 * Extract all JSDoc blocks from content
 *
 * @param content - JavaScript file content
 * @returns Array of all JSDoc blocks
 */
export function extractAllJSDocBlocks(content: string): ParseResult<ParsedJSDoc[]> {
  try {
    const blocks = content.match(PATTERNS.jsdocBlock);

    if (!blocks || blocks.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    const parsed = blocks.map((block) => parseJSDocBlock(block));

    return {
      success: true,
      data: parsed,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error parsing JSDoc';
    return {
      success: false,
      error: {
        code: 'JSDOC_PARSE_ERROR',
        message: errorMessage,
      },
    };
  }
}

/**
 * Find JSDoc block associated with a function
 *
 * @param content - JavaScript file content
 * @param functionName - Name of the function
 * @returns JSDoc block for the function
 */
export function findJSDocForFunction(
  content: string,
  functionName: string
): ParseResult<ParsedJSDoc> {
  try {
    // Find function declaration patterns
    const patterns = [
      new RegExp(`/\\*\\*[\\s\\S]*?\\*/\\s*(?:export\\s+)?(?:async\\s+)?function\\s+${functionName}\\s*\\(`),
      new RegExp(`/\\*\\*[\\s\\S]*?\\*/\\s*(?:export\\s+)?const\\s+${functionName}\\s*=`),
      new RegExp(`/\\*\\*[\\s\\S]*?\\*/\\s*${functionName}\\s*:`),
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match?.[0]) {
        const jsdocMatch = match[0].match(PATTERNS.jsdocBlock);
        if (jsdocMatch?.[0]) {
          return {
            success: true,
            data: parseJSDocBlock(jsdocMatch[0]),
          };
        }
      }
    }

    return {
      success: false,
      error: {
        code: 'NO_JSDOC_FOR_FUNCTION',
        message: `No JSDoc found for function: ${functionName}`,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: {
        code: 'JSDOC_PARSE_ERROR',
        message: errorMessage,
      },
    };
  }
}

/**
 * Parse @param tags from a JSDoc block
 *
 * @param block - JSDoc block content
 * @returns Array of parsed parameters
 */
export function parseParams(block: string): JSDocInput[] {
  const params: JSDocInput[] = [];
  const cleanBlock = block
    .replace(/\/\*\*/, '')
    .replace(/\*\//, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, ''))
    .join('\n');

  const paramRegex = /@param\s+\{([^}]+)\}\s+(?:(\[)?(\w+(?:\.\w+)*)(?:=([^\]]+))?\]?)\s*-?\s*(.*)/g;
  let match;

  while ((match = paramRegex.exec(cleanBlock)) !== null) {
    const isOptional = match[2] === '[';
    const name = match[3] ?? '';
    const defaultValue = match[4];
    const description = match[5]?.trim();
    const typeStr = match[1]?.trim() ?? 'unknown';

    if (name) {
      params.push({
        name,
        type: typeStr,
        description,
        required: !isOptional,
        defaultValue,
      });
    }
  }

  return params;
}

/**
 * Validate JSDoc completeness
 *
 * @param jsdoc - Parsed JSDoc
 * @returns Validation result with missing fields
 */
export function validateJSDoc(jsdoc: ParsedJSDoc): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!jsdoc.process) {
    missing.push('@process');
  }

  if (!jsdoc.description) {
    missing.push('@description');
  }

  if (!jsdoc.inputs || jsdoc.inputs.length === 0) {
    warnings.push('@inputs not specified or empty');
  }

  if (!jsdoc.outputs || jsdoc.outputs.length === 0) {
    warnings.push('@outputs not specified or empty');
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}
