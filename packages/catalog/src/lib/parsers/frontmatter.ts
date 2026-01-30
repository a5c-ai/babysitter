/**
 * YAML frontmatter parser for .md files
 * Uses gray-matter for parsing YAML frontmatter from markdown content
 */

import matter from 'gray-matter';
import type {
  ParseResult,
  ParsedFrontmatter,
  FrontmatterData,
  AgentFrontmatter,
  SkillFrontmatter,
} from './types';

// =============================================================================
// FRONTMATTER PARSER
// =============================================================================

/**
 * Parse YAML frontmatter from markdown content
 *
 * @param content - Raw markdown content with YAML frontmatter
 * @returns Parsed frontmatter data and remaining content
 */
export function parseFrontmatter<T = FrontmatterData>(
  content: string
): ParseResult<ParsedFrontmatter<T>> {
  try {
    const result = matter(content);

    return {
      success: true,
      data: {
        data: result.data as T,
        content: result.content,
        isEmpty: Object.keys(result.data).length === 0,
        excerpt: result.excerpt,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error parsing frontmatter';
    return {
      success: false,
      error: {
        code: 'FRONTMATTER_PARSE_ERROR',
        message: errorMessage,
      },
    };
  }
}

/**
 * Parse YAML frontmatter from a file
 *
 * @param filePath - Path to the markdown file
 * @param readFile - Function to read file contents
 * @returns Parsed frontmatter data and remaining content
 */
export async function parseFrontmatterFromFile<T = FrontmatterData>(
  filePath: string,
  readFile: (path: string) => Promise<string>
): Promise<ParseResult<ParsedFrontmatter<T>>> {
  try {
    const content = await readFile(filePath);
    const result = parseFrontmatter<T>(content);

    if (!result.success && result.error) {
      result.error.file = filePath;
    }

    return result;
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

// =============================================================================
// SPECIALIZED FRONTMATTER PARSERS
// =============================================================================

/**
 * Parse agent frontmatter with validation
 *
 * @param content - Raw markdown content
 * @returns Validated agent frontmatter
 */
export function parseAgentFrontmatter(
  content: string
): ParseResult<ParsedFrontmatter<AgentFrontmatter>> {
  const result = parseFrontmatter<AgentFrontmatter>(content);

  if (!result.success || !result.data) {
    return result;
  }

  const warnings: Array<{ code: string; message: string }> = [];

  // Validate required fields
  if (!result.data.data.name) {
    return {
      success: false,
      error: {
        code: 'MISSING_REQUIRED_FIELD',
        message: 'Agent frontmatter missing required field: name',
      },
    };
  }

  if (!result.data.data.description) {
    return {
      success: false,
      error: {
        code: 'MISSING_REQUIRED_FIELD',
        message: 'Agent frontmatter missing required field: description',
      },
    };
  }

  // Validate optional fields and add warnings
  if (!result.data.data.role) {
    warnings.push({
      code: 'MISSING_OPTIONAL_FIELD',
      message: 'Agent frontmatter missing optional field: role',
    });
  }

  if (!result.data.data.expertise || result.data.data.expertise.length === 0) {
    warnings.push({
      code: 'MISSING_OPTIONAL_FIELD',
      message: 'Agent frontmatter missing optional field: expertise',
    });
  }

  return {
    success: true,
    data: result.data,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Parse skill frontmatter with validation
 *
 * @param content - Raw markdown content
 * @returns Validated skill frontmatter
 */
export function parseSkillFrontmatter(
  content: string
): ParseResult<ParsedFrontmatter<SkillFrontmatter>> {
  const result = parseFrontmatter<SkillFrontmatter>(content);

  if (!result.success || !result.data) {
    return result;
  }

  const warnings: Array<{ code: string; message: string }> = [];

  // Validate required fields
  if (!result.data.data.name) {
    return {
      success: false,
      error: {
        code: 'MISSING_REQUIRED_FIELD',
        message: 'Skill frontmatter missing required field: name',
      },
    };
  }

  if (!result.data.data.description) {
    return {
      success: false,
      error: {
        code: 'MISSING_REQUIRED_FIELD',
        message: 'Skill frontmatter missing required field: description',
      },
    };
  }

  // Validate optional fields and add warnings
  if (!result.data.data['allowed-tools'] || result.data.data['allowed-tools'].length === 0) {
    warnings.push({
      code: 'MISSING_OPTIONAL_FIELD',
      message: 'Skill frontmatter missing optional field: allowed-tools',
    });
  }

  return {
    success: true,
    data: result.data,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if content has frontmatter
 *
 * @param content - Raw content to check
 * @returns True if content starts with frontmatter delimiter
 */
export function hasFrontmatter(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.startsWith('---');
}

/**
 * Extract frontmatter boundaries
 *
 * @param content - Raw content
 * @returns Start and end positions of frontmatter
 */
export function getFrontmatterBoundaries(content: string): {
  start: number;
  end: number;
} | null {
  const trimmed = content.trim();

  if (!trimmed.startsWith('---')) {
    return null;
  }

  const endMarker = trimmed.indexOf('---', 3);
  if (endMarker === -1) {
    return null;
  }

  return {
    start: content.indexOf('---'),
    end: content.indexOf('---', content.indexOf('---') + 3) + 3,
  };
}

/**
 * Normalize frontmatter data by converting common variations
 *
 * @param data - Raw frontmatter data
 * @returns Normalized data object
 */
export function normalizeFrontmatter(data: FrontmatterData): FrontmatterData {
  const normalized: FrontmatterData = { ...data };

  // Normalize 'allowed-tools' to 'allowedTools'
  if ('allowed-tools' in normalized && !('allowedTools' in normalized)) {
    normalized['allowedTools'] = normalized['allowed-tools'];
  }

  // Ensure arrays are actually arrays
  const arrayFields = ['expertise', 'allowed-tools', 'allowedTools', 'tags'];
  for (const field of arrayFields) {
    if (field in normalized && !Array.isArray(normalized[field])) {
      const value = normalized[field];
      if (typeof value === 'string') {
        normalized[field] = value.split(',').map((s) => (s as string).trim());
      } else {
        normalized[field] = [value];
      }
    }
  }

  return normalized;
}

/**
 * Merge frontmatter with defaults
 *
 * @param data - Parsed frontmatter data
 * @param defaults - Default values
 * @returns Merged data
 */
export function mergeFrontmatterWithDefaults<T extends FrontmatterData>(
  data: Partial<T>,
  defaults: T
): T {
  const result = { ...defaults };

  for (const key of Object.keys(data) as Array<keyof T>) {
    if (data[key] !== undefined) {
      result[key] = data[key] as T[keyof T];
    }
  }

  return result;
}
