/**
 * Type definitions for process library catalog parsers
 */

// =============================================================================
// COMMON TYPES
// =============================================================================

/**
 * Result wrapper for parser operations
 */
export interface ParseResult<T> {
  success: boolean;
  data?: T;
  error?: ParseError;
  warnings?: ParseWarning[];
}

/**
 * Parse error information
 */
export interface ParseError {
  code: string;
  message: string;
  file?: string;
  line?: number;
  column?: number;
}

/**
 * Parse warning information
 */
export interface ParseWarning {
  code: string;
  message: string;
  file?: string;
  line?: number;
}

/**
 * Source location information
 */
export interface SourceLocation {
  file: string;
  line?: number;
  column?: number;
}

// =============================================================================
// FRONTMATTER TYPES
// =============================================================================

/**
 * Raw frontmatter data from YAML parsing
 */
export interface FrontmatterData {
  [key: string]: unknown;
}

/**
 * Parsed frontmatter result
 */
export interface ParsedFrontmatter<T = FrontmatterData> {
  data: T;
  content: string;
  isEmpty: boolean;
  excerpt?: string;
}

// =============================================================================
// AGENT TYPES
// =============================================================================

/**
 * Agent metadata from YAML frontmatter
 */
export interface AgentMetadata {
  specialization?: string;
  domain?: string;
  category?: string;
  phase?: number;
  id?: string;
}

/**
 * Agent frontmatter structure
 */
export interface AgentFrontmatter {
  name: string;
  description: string;
  role?: string;
  expertise?: string[];
  metadata?: AgentMetadata;
}

/**
 * Markdown section extracted from agent file
 */
export interface MarkdownSection {
  title: string;
  level: number;
  content: string;
  subsections?: MarkdownSection[];
}

/**
 * Parsed agent definition
 */
export interface ParsedAgent {
  // From frontmatter
  name: string;
  description: string;
  role?: string;
  expertise: string[];
  metadata: AgentMetadata;

  // From markdown content
  sections: MarkdownSection[];
  responsibilities?: string[];
  requiredSkills?: string[];
  collaboration?: string[];

  // Source information
  source: {
    file: string;
    directory: string;
  };
}

// =============================================================================
// SKILL TYPES
// =============================================================================

/**
 * Skill metadata from YAML frontmatter
 */
export interface SkillMetadata {
  specialization?: string;
  domain?: string;
  category?: string;
  phase?: number;
  id?: string;
}

/**
 * Skill frontmatter structure
 */
export interface SkillFrontmatter {
  name: string;
  description: string;
  'allowed-tools'?: string[];
  metadata?: SkillMetadata;
}

/**
 * Parsed skill definition
 */
export interface ParsedSkill {
  // From frontmatter
  name: string;
  description: string;
  allowedTools: string[];
  metadata: SkillMetadata;

  // From markdown content
  sections: MarkdownSection[];
  purpose?: string;
  capabilities?: string[];
  usageGuidelines?: string[];
  tools?: string[];

  // Source information
  source: {
    file: string;
    directory: string;
  };
}

// =============================================================================
// JSDOC TYPES
// =============================================================================

/**
 * Input parameter definition from JSDoc
 */
export interface JSDocInput {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  defaultValue?: string;
}

/**
 * Output definition from JSDoc
 */
export interface JSDocOutput {
  name: string;
  type: string;
  description?: string;
}

/**
 * Parsed JSDoc comment
 */
export interface ParsedJSDoc {
  process?: string;
  description?: string;
  inputs?: JSDocInput[];
  outputs?: JSDocOutput[];
  rawInputs?: string;
  rawOutputs?: string;
  author?: string;
  version?: string;
  since?: string;
  deprecated?: string;
  see?: string[];
  example?: string[];
  tags?: Record<string, string>;
}

// =============================================================================
// AST TYPES
// =============================================================================

/**
 * Extracted defineTask call information
 */
export interface DefineTaskCall {
  name: string;
  variableName?: string;
  kind?: 'agent' | 'node' | 'parallel' | 'sequence';
  title?: string;
  description?: string;
  labels?: string[];
  agent?: {
    name?: string;
    prompt?: {
      role?: string;
      task?: string;
      instructions?: string[];
      outputFormat?: string;
    };
    outputSchema?: Record<string, unknown>;
  };
  io?: {
    inputJsonPath?: string;
    outputJsonPath?: string;
    outputArtifacts?: Array<{
      path?: string;
      format?: string;
    }>;
  };
  location: SourceLocation;
}

/**
 * Extracted export information
 */
export interface ExportInfo {
  name: string;
  type: 'function' | 'const' | 'default';
  isAsync?: boolean;
  location: SourceLocation;
}

/**
 * Parsed AST result for process files
 */
export interface ParsedAST {
  imports: Array<{
    source: string;
    specifiers: string[];
    isDefault?: boolean;
  }>;
  exports: ExportInfo[];
  defineTasks: DefineTaskCall[];
  functions: Array<{
    name: string;
    isAsync: boolean;
    isExported: boolean;
    params: string[];
    location: SourceLocation;
  }>;
}

// =============================================================================
// PROCESS FILE TYPES
// =============================================================================

/**
 * Parsed process file combining JSDoc and AST
 */
export interface ParsedProcess {
  // From JSDoc header
  id: string;
  description: string;
  inputs: JSDocInput[];
  outputs: JSDocOutput[];

  // From AST
  tasks: DefineTaskCall[];
  exports: ExportInfo[];
  hasProcessFunction: boolean;

  // Metadata
  category: string;
  path: string;

  // Source information
  source: {
    file: string;
    directory: string;
  };
}

// =============================================================================
// DIRECTORY STRUCTURE TYPES
// =============================================================================

/**
 * Domain definition in directory hierarchy
 */
export interface DomainInfo {
  name: string;
  path: string;
  category?: string;
  specializations: SpecializationInfo[];
  agents: string[];
  skills: string[];
  readme?: string;
  references?: string;
}

/**
 * Specialization definition in directory hierarchy
 */
export interface SpecializationInfo {
  name: string;
  path: string;
  domain?: string;
  agents: string[];
  skills: string[];
  processes?: string[];
  readme?: string;
  references?: string;
}

/**
 * Directory scan result
 */
export interface DirectoryScanResult {
  domains: DomainInfo[];
  specializations: SpecializationInfo[];
  methodologies: string[];
  totalAgents: number;
  totalSkills: number;
  totalProcesses: number;
}

// =============================================================================
// UNIFIED CATALOG TYPES
// =============================================================================

/**
 * Catalog item types
 */
export type CatalogItemType = 'agent' | 'skill' | 'process' | 'domain' | 'specialization';

/**
 * Unified catalog item
 */
export interface CatalogEntry {
  id: string;
  type: CatalogItemType;
  name: string;
  description: string;
  path: string;
  domain?: string;
  specialization?: string;
  category?: string;
  phase?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Full catalog structure
 */
export interface ProcessCatalog {
  version: string;
  generatedAt: string;
  entries: CatalogEntry[];
  domains: DomainInfo[];
  specializations: SpecializationInfo[];
  statistics: {
    totalAgents: number;
    totalSkills: number;
    totalProcesses: number;
    totalDomains: number;
    totalSpecializations: number;
  };
}

// =============================================================================
// PARSER INTERFACE TYPES
// =============================================================================

/**
 * Parser options
 */
export interface ParserOptions {
  /** Base directory for relative path resolution */
  baseDir?: string;
  /** Whether to include source location info */
  includeSourceLocations?: boolean;
  /** Whether to parse markdown content sections */
  parseMarkdownSections?: boolean;
  /** Whether to extract AST information */
  extractAST?: boolean;
  /** Maximum depth for directory scanning */
  maxDepth?: number;
}

/**
 * Parser interface that all parsers should implement
 */
export interface Parser<T, O = ParserOptions> {
  /**
   * Parse content from a file path
   */
  parseFile(filePath: string, options?: O): Promise<ParseResult<T>>;

  /**
   * Parse content from a string
   */
  parseContent(content: string, options?: O): ParseResult<T>;
}
