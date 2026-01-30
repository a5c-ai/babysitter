/**
 * AST parser for extracting defineTask calls and exports from process files
 * Uses regex-based parsing for lightweight extraction without full AST dependency
 */

import type {
  ParseResult,
  ParsedAST,
  DefineTaskCall,
  ExportInfo,
} from './types';

// =============================================================================
// AST PARSER (REGEX-BASED)
// =============================================================================

/**
 * Regular expression patterns for AST extraction
 */
const PATTERNS = {
  // Match import statements
  importStatement: /import\s+(?:(\{[^}]+\})|(\w+)(?:\s*,\s*\{([^}]+)\})?)\s+from\s+['"]([^'"]+)['"]/g,
  // Match export const/let/var
  exportConst: /export\s+(const|let|var)\s+(\w+)\s*=/g,
  // Match export function
  exportFunction: /export\s+(async\s+)?function\s+(\w+)\s*\(/g,
  // Match export default
  exportDefault: /export\s+default\s+(\w+|function\s+\w*|async\s+function\s+\w*)/g,
  // Match defineTask calls
  defineTask: /(?:export\s+(?:const|let|var)\s+)?(\w+)\s*=\s*defineTask\s*\(\s*['"]([^'"]+)['"]\s*,/g,
  // Match function declarations
  functionDecl: /(?:export\s+)?(async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g,
  // Match arrow functions assigned to const
  arrowFunction: /(?:export\s+)?const\s+(\w+)\s*=\s*(async\s+)?\([^)]*\)\s*=>/g,
};

/**
 * Parse AST-like information from JavaScript content
 *
 * @param content - JavaScript file content
 * @param filePath - Source file path for location info
 * @returns Parsed AST information
 */
export function parseAST(content: string, filePath: string = ''): ParseResult<ParsedAST> {
  try {
    const result: ParsedAST = {
      imports: parseImports(content),
      exports: parseExports(content, filePath),
      defineTasks: parseDefineTasks(content, filePath),
      functions: parseFunctions(content, filePath),
    };

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error parsing AST';
    return {
      success: false,
      error: {
        code: 'AST_PARSE_ERROR',
        message: errorMessage,
        file: filePath,
      },
    };
  }
}

/**
 * Parse import statements
 *
 * @param content - JavaScript content
 * @returns Array of import information
 */
function parseImports(content: string): ParsedAST['imports'] {
  const imports: ParsedAST['imports'] = [];

  // Reset regex lastIndex
  PATTERNS.importStatement.lastIndex = 0;

  let match;
  while ((match = PATTERNS.importStatement.exec(content)) !== null) {
    const namedImports = match[1];
    const defaultImport = match[2];
    const additionalNamed = match[3];
    const source = match[4] ?? '';

    const specifiers: string[] = [];

    // Add default import if present
    if (defaultImport) {
      specifiers.push(defaultImport);
    }

    // Add named imports
    if (namedImports) {
      const names = namedImports
        .replace(/[{}]/g, '')
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s);
      specifiers.push(...names);
    }

    // Add additional named imports (import default, { named })
    if (additionalNamed) {
      const names = additionalNamed
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s);
      specifiers.push(...names);
    }

    imports.push({
      source,
      specifiers,
      isDefault: !!defaultImport && !namedImports && !additionalNamed,
    });
  }

  return imports;
}

/**
 * Parse export statements
 *
 * @param content - JavaScript content
 * @param filePath - Source file path
 * @returns Array of export information
 */
function parseExports(content: string, filePath: string): ExportInfo[] {
  const exports: ExportInfo[] = [];

  // Reset regex lastIndex
  PATTERNS.exportConst.lastIndex = 0;
  PATTERNS.exportFunction.lastIndex = 0;
  PATTERNS.exportDefault.lastIndex = 0;

  // Find export const/let/var
  let match;
  while ((match = PATTERNS.exportConst.exec(content)) !== null) {
    const name = match[2] ?? '';
    const lineNumber = getLineNumber(content, match.index);
    if (name) {
      exports.push({
        name,
        type: 'const',
        location: {
          file: filePath,
          line: lineNumber,
        },
      });
    }
  }

  // Find export function
  while ((match = PATTERNS.exportFunction.exec(content)) !== null) {
    const asyncKeyword = match[1];
    const name = match[2] ?? '';
    const lineNumber = getLineNumber(content, match.index);
    if (name) {
      exports.push({
        name,
        type: 'function',
        isAsync: !!asyncKeyword,
        location: {
          file: filePath,
          line: lineNumber,
        },
      });
    }
  }

  // Find export default
  while ((match = PATTERNS.exportDefault.exec(content)) !== null) {
    const exportedValue = match[1] ?? '';
    const lineNumber = getLineNumber(content, match.index);

    let name = exportedValue.trim();
    if (name.startsWith('function')) {
      name = name.replace(/^(?:async\s+)?function\s*/, '').trim() || 'default';
    }

    exports.push({
      name,
      type: 'default',
      location: {
        file: filePath,
        line: lineNumber,
      },
    });
  }

  return exports;
}

/**
 * Parse defineTask calls
 *
 * @param content - JavaScript content
 * @param filePath - Source file path
 * @returns Array of defineTask call information
 */
function parseDefineTasks(content: string, filePath: string): DefineTaskCall[] {
  const tasks: DefineTaskCall[] = [];

  // Reset regex lastIndex
  PATTERNS.defineTask.lastIndex = 0;

  let match;
  while ((match = PATTERNS.defineTask.exec(content)) !== null) {
    const variableName = match[1] ?? '';
    const taskName = match[2] ?? '';
    const lineNumber = getLineNumber(content, match.index);

    // Extract the full defineTask call to parse additional properties
    const taskContent = extractDefineTaskContent(content, match.index);

    const task: DefineTaskCall = {
      name: taskName,
      variableName,
      location: {
        file: filePath,
        line: lineNumber,
      },
    };

    // Extract task properties
    const kindMatch = taskContent.match(/kind:\s*['"](\w+)['"]/);
    if (kindMatch?.[1]) {
      task.kind = kindMatch[1] as DefineTaskCall['kind'];
    }

    const titleMatch = taskContent.match(/title:\s*[`'"]([^`'"]+)[`'"]/);
    if (titleMatch?.[1]) {
      task.title = titleMatch[1];
    } else {
      // Try to match template literal
      const templateTitleMatch = taskContent.match(/title:\s*`([^`]+)`/);
      if (templateTitleMatch?.[1]) {
        task.title = templateTitleMatch[1];
      }
    }

    const descMatch = taskContent.match(/description:\s*['"]([^'"]+)['"]/);
    if (descMatch?.[1]) {
      task.description = descMatch[1];
    }

    // Extract labels
    const labelsMatch = taskContent.match(/labels:\s*\[([^\]]+)\]/);
    if (labelsMatch?.[1]) {
      task.labels = labelsMatch[1]
        .split(',')
        .map((l) => l.trim().replace(/['"]/g, ''))
        .filter((l) => l);
    }

    // Extract agent information
    const agentNameMatch = taskContent.match(/agent:\s*\{[^}]*name:\s*['"]([^'"]+)['"]/);
    if (agentNameMatch?.[1]) {
      task.agent = {
        name: agentNameMatch[1],
      };

      // Try to extract prompt info
      const roleMatch = taskContent.match(/role:\s*['"]([^'"]+)['"]/);
      const taskTextMatch = taskContent.match(/task:\s*['"]([^'"]+)['"]/);

      if (roleMatch?.[1] || taskTextMatch?.[1]) {
        task.agent.prompt = {};
        if (roleMatch?.[1]) task.agent.prompt.role = roleMatch[1];
        if (taskTextMatch?.[1]) task.agent.prompt.task = taskTextMatch[1];
      }
    }

    // Extract IO paths
    const inputPathMatch = taskContent.match(/inputJsonPath:\s*[`'"]([^`'"]+)[`'"]/);
    const outputPathMatch = taskContent.match(/outputJsonPath:\s*[`'"]([^`'"]+)[`'"]/);

    if (inputPathMatch?.[1] || outputPathMatch?.[1]) {
      task.io = {};
      if (inputPathMatch?.[1]) task.io.inputJsonPath = inputPathMatch[1];
      if (outputPathMatch?.[1]) task.io.outputJsonPath = outputPathMatch[1];
    }

    tasks.push(task);
  }

  return tasks;
}

/**
 * Extract the full content of a defineTask call
 *
 * @param content - Full file content
 * @param startIndex - Start index of defineTask call
 * @returns Content of the defineTask call
 */
function extractDefineTaskContent(content: string, startIndex: number): string {
  let depth = 0;
  let started = false;
  let endIndex = startIndex;

  for (let i = startIndex; i < content.length; i++) {
    const char = content[i];

    if (char === '(') {
      depth++;
      started = true;
    } else if (char === ')') {
      depth--;
      if (started && depth === 0) {
        endIndex = i + 1;
        break;
      }
    }
  }

  return content.slice(startIndex, endIndex);
}

/**
 * Parse function declarations
 *
 * @param content - JavaScript content
 * @param filePath - Source file path
 * @returns Array of function information
 */
function parseFunctions(
  content: string,
  filePath: string
): ParsedAST['functions'] {
  const functions: ParsedAST['functions'] = [];
  const seen = new Set<string>();

  // Reset regex lastIndex
  PATTERNS.functionDecl.lastIndex = 0;
  PATTERNS.arrowFunction.lastIndex = 0;

  // Find function declarations
  let match;
  while ((match = PATTERNS.functionDecl.exec(content)) !== null) {
    const fullMatch = match[0] ?? '';
    const asyncKeyword = match[1];
    const name = match[2] ?? '';
    const params = match[3] ?? '';
    const lineNumber = getLineNumber(content, match.index);

    if (name && !seen.has(name)) {
      seen.add(name);
      functions.push({
        name,
        isAsync: !!asyncKeyword,
        isExported: fullMatch.startsWith('export'),
        params: parseParams(params),
        location: {
          file: filePath,
          line: lineNumber,
        },
      });
    }
  }

  // Find arrow functions
  while ((match = PATTERNS.arrowFunction.exec(content)) !== null) {
    const fullMatch = match[0] ?? '';
    const name = match[1] ?? '';
    const asyncKeyword = match[2];
    const lineNumber = getLineNumber(content, match.index);

    if (name && !seen.has(name)) {
      seen.add(name);
      functions.push({
        name,
        isAsync: !!asyncKeyword,
        isExported: fullMatch.startsWith('export'),
        params: [],
        location: {
          file: filePath,
          line: lineNumber,
        },
      });
    }
  }

  return functions;
}

/**
 * Parse function parameters
 *
 * @param paramsStr - Parameter string from function declaration
 * @returns Array of parameter names
 */
function parseParams(paramsStr: string): string[] {
  if (!paramsStr.trim()) {
    return [];
  }

  // Handle destructuring and default values
  const params: string[] = [];
  let current = '';
  let depth = 0;

  for (const char of paramsStr) {
    if (char === '{' || char === '[' || char === '(') {
      depth++;
      current += char;
    } else if (char === '}' || char === ']' || char === ')') {
      depth--;
      current += char;
    } else if (char === ',' && depth === 0) {
      const param = extractParamName(current.trim());
      if (param) params.push(param);
      current = '';
    } else {
      current += char;
    }
  }

  const lastParam = extractParamName(current.trim());
  if (lastParam) params.push(lastParam);

  return params;
}

/**
 * Extract parameter name from parameter declaration
 *
 * @param paramDecl - Parameter declaration
 * @returns Parameter name
 */
function extractParamName(paramDecl: string): string {
  // Remove default value
  const parts = paramDecl.split('=');
  const withoutDefault = parts[0]?.trim() ?? '';

  // Handle destructuring
  if (withoutDefault.startsWith('{') || withoutDefault.startsWith('[')) {
    return withoutDefault;
  }

  // Handle type annotation (TypeScript)
  const typeParts = withoutDefault.split(':');
  const withoutType = typeParts[0]?.trim() ?? '';

  return withoutType;
}

/**
 * Get line number from character index
 *
 * @param content - Full content
 * @param index - Character index
 * @returns Line number (1-based)
 */
function getLineNumber(content: string, index: number): number {
  const beforeMatch = content.slice(0, index);
  return beforeMatch.split('\n').length;
}

/**
 * Check if content uses defineTask from babysitter-sdk
 *
 * @param content - JavaScript content
 * @returns True if defineTask is imported from babysitter-sdk
 */
export function usesDefineTask(content: string): boolean {
  return (
    content.includes("from '@a5c-ai/babysitter-sdk'") &&
    content.includes('defineTask')
  );
}

/**
 * Get all task names from content
 *
 * @param content - JavaScript content
 * @returns Array of task names
 */
export function getTaskNames(content: string): string[] {
  const result = parseAST(content);
  if (!result.success || !result.data) {
    return [];
  }
  return result.data.defineTasks.map((t) => t.name);
}

/**
 * Check if content has a process function export
 *
 * @param content - JavaScript content
 * @returns True if process function is exported
 */
export function hasProcessFunction(content: string): boolean {
  const result = parseAST(content);
  if (!result.success || !result.data) {
    return false;
  }
  return result.data.exports.some(
    (e) => e.name === 'process' && (e.type === 'function' || e.type === 'const')
  );
}

/**
 * Extract process ID from JSDoc @process tag or file path
 *
 * @param content - JavaScript content
 * @param filePath - File path as fallback
 * @returns Process ID
 */
export function extractProcessId(content: string, filePath: string): string {
  const processMatch = content.match(/@process\s+([^\n]+)/);
  if (processMatch?.[1]) {
    return processMatch[1].trim();
  }

  // Fallback to file path
  const normalizedPath = filePath.replace(/\\/g, '/');
  const parts = normalizedPath.split('/');
  const fileName = parts[parts.length - 1]?.replace(/\.js$/, '') ?? '';
  const parentDir = parts[parts.length - 2] ?? '';

  if (parentDir === 'methodologies') {
    return `methodologies/${fileName}`;
  }

  return fileName;
}
