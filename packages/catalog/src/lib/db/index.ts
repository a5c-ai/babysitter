/**
 * Process Library Catalog Database
 *
 * SQLite-based storage and search for the process library catalog.
 * Features:
 * - Full-text search using FTS5
 * - Incremental indexing based on file modification times
 * - Query builder with filter, sort, and pagination support
 * - Relationship tracking between domains, specializations, agents, and skills
 *
 * @module db
 */

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
  // Row types
  DomainRow,
  SpecializationRow,
  AgentRow,
  SkillRow,
  ProcessRow,
  FileTrackingRow,

  // Search types
  FTSSearchRow,
  SearchResult,

  // Query types
  FilterOperator,
  FilterCondition,
  SortDirection,
  SortSpec,
  PaginationOptions,
  QueryOptions,
  PaginatedResult,

  // Indexer types
  IndexProgressCallback,
  IndexProgress,
  IndexResult,
  IndexerOptions,

  // Client types
  DatabaseClientOptions,
  DatabaseStats,

  // Catalog types
  CatalogEntryType,
  CatalogEntryView,
} from './types';

// =============================================================================
// SCHEMA EXPORTS
// =============================================================================

export {
  SCHEMA_VERSION,
  initializeSchema,
  getSchemaVersion,
  needsMigration,
  runMigrations,
  resetDatabase,
  rebuildFTSIndexes,
  rebuildCatalogSearch,
  getTableNames,
  getFTSTableNames,
  getIndexNames,
  getSchemaInfo,
} from './schema';

// =============================================================================
// CLIENT EXPORTS
// =============================================================================

export {
  CatalogDatabase,
  getDatabase,
  initializeDatabase,
  closeDatabase,
  resetCatalogDatabase,
  getDatabasePath,
  databaseExists,
} from './client';

// =============================================================================
// INDEXER EXPORTS
// =============================================================================

export {
  CatalogIndexer,
  runFullIndex,
  runIncrementalIndex,
  needsRebuild,
} from './indexer';

// =============================================================================
// INIT EXPORTS
// =============================================================================

export {
  ensureDatabaseInitialized,
  needsInitialization,
  resetInitializationState,
  getInitializationStatus,
  withDatabaseInit,
  createInitializedHandler,
} from './init';

export type { InitOptions, InitResult } from './init';

// =============================================================================
// QUERY EXPORTS
// =============================================================================

export {
  QueryBuilder,
  CatalogQueries,
  createCatalogQueries,
  createQueryBuilder,
} from './queries';

// =============================================================================
// CONVENIENCE RE-EXPORTS
// =============================================================================

/**
 * Initialize the database and return the query interface
 */
export function initializeCatalog(): {
  db: import('./client').CatalogDatabase;
  queries: import('./queries').CatalogQueries;
} {
  const { initializeDatabase } = require('./client');
  const { CatalogQueries } = require('./queries');

  const db = initializeDatabase();
  const queries = new CatalogQueries(db);

  return { db, queries };
}

/**
 * Get a summary of the catalog contents
 */
export function getCatalogSummary(): {
  version: number;
  stats: import('./types').DatabaseStats;
  schema: ReturnType<typeof import('./schema').getSchemaInfo>;
} {
  const { initializeDatabase } = require('./client');
  const { getSchemaVersion, getSchemaInfo } = require('./schema');

  const db = initializeDatabase();
  const stats = db.getStats();
  const version = getSchemaVersion(db.getDb());
  const schema = getSchemaInfo();

  return { version, stats, schema };
}
