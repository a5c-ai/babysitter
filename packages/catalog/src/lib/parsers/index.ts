/**
 * Process Library Catalog Parsers
 *
 * A comprehensive parsing library for the process library catalog that handles:
 * - AGENT.md files (YAML frontmatter + markdown content)
 * - SKILL.md files (YAML frontmatter + markdown content)
 * - Process .js files (JSDoc + AST extraction)
 * - Directory structure scanning
 *
 * @module parsers
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Common types
  ParseResult,
  ParseError,
  ParseWarning,
  SourceLocation,
  ParserOptions,
  Parser,

  // Frontmatter types
  FrontmatterData,
  ParsedFrontmatter,
  AgentFrontmatter,
  SkillFrontmatter,
  AgentMetadata,
  SkillMetadata,

  // Markdown types
  MarkdownSection,

  // JSDoc types
  ParsedJSDoc,
  JSDocInput,
  JSDocOutput,

  // AST types
  ParsedAST,
  DefineTaskCall,
  ExportInfo,

  // Entity types
  ParsedAgent,
  ParsedSkill,
  ParsedProcess,

  // Directory types
  DirectoryScanResult,
  DomainInfo,
  SpecializationInfo,

  // Catalog types
  CatalogItemType,
  CatalogEntry,
  ProcessCatalog,
} from './types';

// =============================================================================
// FRONTMATTER PARSER EXPORTS
// =============================================================================

export {
  parseFrontmatter,
  parseFrontmatterFromFile,
  parseAgentFrontmatter,
  parseSkillFrontmatter,
  hasFrontmatter,
  getFrontmatterBoundaries,
  normalizeFrontmatter,
  mergeFrontmatterWithDefaults,
} from './frontmatter';

// =============================================================================
// MARKDOWN PARSER EXPORTS
// =============================================================================

export {
  parseMarkdownSections,
  findSection,
  findSectionsByPattern,
  extractListItems,
  extractListFromSection,
  getPlainText,
  flattenSections,
  getSectionPath,
  getSectionSummary,
  countWords,
  extractHeadings,
} from './markdown';

// =============================================================================
// JSDOC PARSER EXPORTS
// =============================================================================

export {
  parseJSDoc,
  parseJSDocBlock,
  extractAllJSDocBlocks,
  findJSDocForFunction,
  parseParams,
  validateJSDoc,
} from './jsdoc';

// =============================================================================
// AST PARSER EXPORTS
// =============================================================================

export {
  parseAST,
  usesDefineTask,
  getTaskNames,
  hasProcessFunction,
  extractProcessId,
} from './ast';

// =============================================================================
// DIRECTORY PARSER EXPORTS
// =============================================================================

export type { FileSystem, DirectoryParserOptions } from './directory';

export {
  parseDirectoryStructure,
  getRelativePath,
  extractDomainFromPath,
  extractSpecializationFromPath,
  extractNameFromPath,
} from './directory';

// =============================================================================
// AGENT PARSER EXPORTS
// =============================================================================

export type { AgentParserOptions } from './agent';

export {
  parseAgentContent,
  parseAgentFile,
  validateAgent,
  agentToCatalogEntry,
  generateAgentSummary,
} from './agent';

// =============================================================================
// SKILL PARSER EXPORTS
// =============================================================================

export type { SkillParserOptions } from './skill';

export {
  parseSkillContent,
  parseSkillFile,
  validateSkill,
  skillToCatalogEntry,
  generateSkillSummary,
  isSkillCompatibleWithTools,
  groupSkillsByCategory,
} from './skill';

// =============================================================================
// PROCESS PARSER EXPORTS
// =============================================================================

export type { ProcessParserOptions } from './process';

export {
  parseProcessContent,
  parseProcessFile,
  validateProcess,
  processToCatalogEntry,
  generateProcessSummary,
  getProcessTaskNames,
  getRequiredInputs,
  groupProcessesByCategory,
} from './process';

// =============================================================================
// UNIFIED PARSER INTERFACE
// =============================================================================

import type {
  ParseResult,
  ParsedAgent,
  ParsedSkill,
  ParsedProcess,
  DirectoryScanResult,
  CatalogEntry,
  ProcessCatalog,
} from './types';
import type { FileSystem } from './directory';
import { parseAgentFile } from './agent';
import { parseSkillFile } from './skill';
import { parseProcessFile } from './process';
import { parseDirectoryStructure } from './directory';
import { agentToCatalogEntry } from './agent';
import { skillToCatalogEntry } from './skill';
import { processToCatalogEntry } from './process';

/**
 * Unified parser options
 */
export interface UnifiedParserOptions {
  /** Base directory for the process library */
  baseDir: string;
  /** File system interface */
  fs: FileSystem;
  /** Whether to parse markdown sections */
  parseMarkdownSections?: boolean;
  /** Whether to extract AST information */
  extractAST?: boolean;
  /** Whether to validate parsed content */
  validate?: boolean;
  /** Progress callback */
  onProgress?: (current: number, total: number, item: string) => void;
}

/**
 * Unified parser result
 */
export interface UnifiedParserResult {
  agents: ParsedAgent[];
  skills: ParsedSkill[];
  processes: ParsedProcess[];
  directoryStructure: DirectoryScanResult;
  catalog: ProcessCatalog;
  errors: Array<{ file: string; error: string }>;
  warnings: Array<{ file: string; warning: string }>;
}

/**
 * Parse the entire process library and build a catalog
 *
 * @param options - Parser options
 * @returns Complete parse result with catalog
 */
export async function parseProcessLibrary(
  options: UnifiedParserOptions
): Promise<ParseResult<UnifiedParserResult>> {
  const { baseDir, fs, onProgress } = options;
  const errors: Array<{ file: string; error: string }> = [];
  const warnings: Array<{ file: string; warning: string }> = [];

  try {
    // Step 1: Scan directory structure
    const dirResult = await parseDirectoryStructure(baseDir, fs);
    if (!dirResult.success || !dirResult.data) {
      return {
        success: false,
        error: {
          code: 'DIRECTORY_SCAN_FAILED',
          message: dirResult.error?.message || 'Failed to scan directory structure',
        },
      };
    }

    const directoryStructure = dirResult.data;

    // Collect all files to parse
    const agentFiles: string[] = [];
    const skillFiles: string[] = [];
    const processFiles: string[] = directoryStructure.methodologies;

    for (const domain of directoryStructure.domains) {
      agentFiles.push(...domain.agents);
      skillFiles.push(...domain.skills);
      for (const spec of domain.specializations) {
        agentFiles.push(...spec.agents);
        skillFiles.push(...spec.skills);
        if (spec.processes) {
          processFiles.push(...spec.processes);
        }
      }
    }

    for (const spec of directoryStructure.specializations) {
      agentFiles.push(...spec.agents);
      skillFiles.push(...spec.skills);
      if (spec.processes) {
        processFiles.push(...spec.processes);
      }
    }

    const totalItems = agentFiles.length + skillFiles.length + processFiles.length;
    let currentItem = 0;

    // Step 2: Parse agents
    const agents: ParsedAgent[] = [];
    for (const file of agentFiles) {
      currentItem++;
      onProgress?.(currentItem, totalItems, file);

      const result = await parseAgentFile(file, (path) => fs.readFile(path), {
        parseMarkdownSections: options.parseMarkdownSections ?? true,
      });

      if (result.success && result.data) {
        agents.push(result.data);
        if (result.warnings) {
          for (const warning of result.warnings) {
            warnings.push({ file, warning: warning.message });
          }
        }
      } else {
        errors.push({ file, error: result.error?.message || 'Parse failed' });
      }
    }

    // Step 3: Parse skills
    const skills: ParsedSkill[] = [];
    for (const file of skillFiles) {
      currentItem++;
      onProgress?.(currentItem, totalItems, file);

      const result = await parseSkillFile(file, (path) => fs.readFile(path), {
        parseMarkdownSections: options.parseMarkdownSections ?? true,
      });

      if (result.success && result.data) {
        skills.push(result.data);
        if (result.warnings) {
          for (const warning of result.warnings) {
            warnings.push({ file, warning: warning.message });
          }
        }
      } else {
        errors.push({ file, error: result.error?.message || 'Parse failed' });
      }
    }

    // Step 4: Parse processes
    const processes: ParsedProcess[] = [];
    for (const file of processFiles) {
      currentItem++;
      onProgress?.(currentItem, totalItems, file);

      const result = await parseProcessFile(file, (path) => fs.readFile(path), {
        extractAST: options.extractAST ?? true,
        validateJSDoc: options.validate ?? true,
      });

      if (result.success && result.data) {
        processes.push(result.data);
        if (result.warnings) {
          for (const warning of result.warnings) {
            warnings.push({ file, warning: warning.message });
          }
        }
      } else {
        errors.push({ file, error: result.error?.message || 'Parse failed' });
      }
    }

    // Step 5: Build catalog
    const catalogEntries: CatalogEntry[] = [
      ...agents.map(agentToCatalogEntry),
      ...skills.map(skillToCatalogEntry),
      ...processes.map(processToCatalogEntry),
    ];

    const catalog: ProcessCatalog = {
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      entries: catalogEntries,
      domains: directoryStructure.domains,
      specializations: directoryStructure.specializations,
      statistics: {
        totalAgents: agents.length,
        totalSkills: skills.length,
        totalProcesses: processes.length,
        totalDomains: directoryStructure.domains.length,
        totalSpecializations: directoryStructure.specializations.length,
      },
    };

    return {
      success: true,
      data: {
        agents,
        skills,
        processes,
        directoryStructure,
        catalog,
        errors,
        warnings,
      },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: {
        code: 'PARSE_LIBRARY_ERROR',
        message: errorMessage,
      },
    };
  }
}

/**
 * Create a file system adapter for Node.js fs module
 *
 * @param nodeFs - Node.js fs/promises module
 * @param nodePath - Node.js path module
 * @returns FileSystem interface
 */
export function createNodeFileSystem(
  nodeFs: {
    readdir: (path: string) => Promise<string[]>;
    stat: (path: string) => Promise<{ isDirectory(): boolean }>;
    readFile: (path: string, encoding: string) => Promise<string>;
    access?: (path: string) => Promise<void>;
  },
  _nodePath?: { join: (...paths: string[]) => string }
): FileSystem {
  return {
    readdir: nodeFs.readdir,
    stat: nodeFs.stat,
    exists: async (path: string) => {
      try {
        if (nodeFs.access) {
          await nodeFs.access(path);
          return true;
        }
        await nodeFs.stat(path);
        return true;
      } catch {
        return false;
      }
    },
    readFile: (path: string) => nodeFs.readFile(path, 'utf-8'),
  };
}

/**
 * Quick parse a single file based on extension
 *
 * @param filePath - File path
 * @param content - File content
 * @returns Parsed result
 */
export function quickParse(
  filePath: string,
  content: string
): ParseResult<ParsedAgent | ParsedSkill | ParsedProcess> {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();

  if (normalized.endsWith('agent.md')) {
    return parseAgentContent(content, filePath) as ParseResult<ParsedAgent>;
  }

  if (normalized.endsWith('skill.md')) {
    return parseSkillContent(content, filePath) as ParseResult<ParsedSkill>;
  }

  if (normalized.endsWith('.js')) {
    return parseProcessContent(content, filePath) as ParseResult<ParsedProcess>;
  }

  return {
    success: false,
    error: {
      code: 'UNKNOWN_FILE_TYPE',
      message: `Unknown file type: ${filePath}`,
      file: filePath,
    },
  };
}

// Re-export for convenience
import { parseAgentContent } from './agent';
import { parseSkillContent } from './skill';
import { parseProcessContent } from './process';
