/**
 * Database-specific types for the process library catalog
 */

// =============================================================================
// DATABASE ROW TYPES
// =============================================================================

/**
 * Domain row in the database
 */
export interface DomainRow {
  id: number;
  name: string;
  path: string;
  category: string | null;
  readme_path: string | null;
  references_path: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Specialization row in the database
 */
export interface SpecializationRow {
  id: number;
  name: string;
  path: string;
  domain_id: number | null;
  readme_path: string | null;
  references_path: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Agent row in the database
 */
export interface AgentRow {
  id: number;
  name: string;
  description: string;
  file_path: string;
  directory: string;
  role: string | null;
  expertise: string; // JSON array
  specialization_id: number | null;
  domain_id: number | null;
  frontmatter: string; // JSON object
  content: string;
  file_mtime: number;
  created_at: string;
  updated_at: string;
}

/**
 * Skill row in the database
 */
export interface SkillRow {
  id: number;
  name: string;
  description: string;
  file_path: string;
  directory: string;
  allowed_tools: string; // JSON array
  specialization_id: number | null;
  domain_id: number | null;
  frontmatter: string; // JSON object
  content: string;
  file_mtime: number;
  created_at: string;
  updated_at: string;
}

/**
 * Process row in the database
 */
export interface ProcessRow {
  id: number;
  process_id: string;
  description: string;
  file_path: string;
  directory: string;
  category: string | null;
  inputs: string; // JSON array
  outputs: string; // JSON array
  tasks: string; // JSON array
  frontmatter: string; // JSON object
  file_mtime: number;
  created_at: string;
  updated_at: string;
}

/**
 * File tracking row for incremental updates
 */
export interface FileTrackingRow {
  id: number;
  file_path: string;
  file_type: 'agent' | 'skill' | 'process' | 'domain' | 'specialization';
  mtime: number;
  hash: string | null;
  indexed_at: string;
}

// =============================================================================
// FTS5 SEARCH TYPES
// =============================================================================

/**
 * FTS5 search result row
 */
export interface FTSSearchRow {
  id: number;
  item_type: string;
  item_id: number;
  name: string;
  description: string;
  content: string;
  rank: number;
}

/**
 * Combined search result with highlights
 */
export interface SearchResult {
  type: 'agent' | 'skill' | 'process' | 'domain' | 'specialization';
  id: number;
  name: string;
  description: string;
  path: string;
  score: number;
  highlights?: {
    name?: string;
    description?: string;
    content?: string;
  };
  metadata?: Record<string, unknown>;
}

// =============================================================================
// QUERY TYPES
// =============================================================================

/**
 * Filter operators for query building
 */
export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'in'
  | 'not_in'
  | 'is_null'
  | 'is_not_null';

/**
 * Single filter condition
 */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Sort specification
 */
export interface SortSpec {
  field: string;
  direction: SortDirection;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  pageSize: number;
}

/**
 * Query options for the query builder
 */
export interface QueryOptions {
  filters?: FilterCondition[];
  sort?: SortSpec[];
  pagination?: PaginationOptions;
  search?: string;
  includeContent?: boolean;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// =============================================================================
// INDEXER TYPES
// =============================================================================

/**
 * Indexing progress callback
 */
export type IndexProgressCallback = (progress: IndexProgress) => void;

/**
 * Index progress information
 */
export interface IndexProgress {
  phase: 'scanning' | 'parsing' | 'indexing' | 'complete';
  current: number;
  total: number;
  currentFile?: string;
  message?: string;
}

/**
 * Indexing result
 */
export interface IndexResult {
  success: boolean;
  statistics: {
    domainsIndexed: number;
    specializationsIndexed: number;
    agentsIndexed: number;
    skillsIndexed: number;
    processesIndexed: number;
    filesProcessed: number;
    errors: number;
    duration: number;
  };
  errors: Array<{ file: string; error: string }>;
}

/**
 * Indexer options
 */
export interface IndexerOptions {
  /** Force full re-index even if files haven't changed */
  forceReindex?: boolean;
  /** Progress callback */
  onProgress?: IndexProgressCallback;
  /** Batch size for database operations */
  batchSize?: number;
  /** Library paths to index */
  libraryPaths?: string[];
}

// =============================================================================
// DATABASE CLIENT TYPES
// =============================================================================

/**
 * Database client options
 */
export interface DatabaseClientOptions {
  /** Path to the database file */
  dbPath: string;
  /** Enable WAL mode for better concurrent access */
  walMode?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * Database statistics
 */
export interface DatabaseStats {
  domainsCount: number;
  specializationsCount: number;
  agentsCount: number;
  skillsCount: number;
  processesCount: number;
  lastIndexedAt: string | null;
  databaseSize: number;
}

// =============================================================================
// CATALOG ENTRY TYPES (for unified view)
// =============================================================================

/**
 * Catalog entry type enum
 */
export type CatalogEntryType = 'agent' | 'skill' | 'process' | 'domain' | 'specialization';

/**
 * Unified catalog entry for display
 */
export interface CatalogEntryView {
  id: number;
  type: CatalogEntryType;
  name: string;
  description: string;
  path: string;
  domainName: string | null;
  specializationName: string | null;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
