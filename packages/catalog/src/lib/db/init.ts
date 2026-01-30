/**
 * Database initialization module for auto-init on first run
 *
 * This module handles automatic database initialization and population
 * when the application starts for the first time.
 */

import { initializeDatabase, databaseExists } from './client';
import { CatalogIndexer, needsRebuild } from './indexer';

// =============================================================================
// TYPES
// =============================================================================

export interface InitOptions {
  /** Force reindex even if database exists */
  force?: boolean;
  /** Show verbose logging */
  verbose?: boolean;
  /** Custom source paths to index */
  sourcePaths?: string[];
  /** Progress callback */
  onProgress?: (message: string, progress?: number) => void;
}

export interface InitResult {
  initialized: boolean;
  reindexed: boolean;
  stats: {
    domainsCount: number;
    specializationsCount: number;
    agentsCount: number;
    skillsCount: number;
    processesCount: number;
  };
  duration: number;
  errors: string[];
}

// =============================================================================
// INITIALIZATION STATE
// =============================================================================

let isInitialized = false;
let initPromise: Promise<InitResult> | null = null;

// =============================================================================
// INITIALIZATION FUNCTIONS
// =============================================================================

/**
 * Initialize the database, creating schema and populating data if needed
 * This function is idempotent - calling it multiple times has no effect
 */
export async function ensureDatabaseInitialized(options: InitOptions = {}): Promise<InitResult> {
  // Return existing promise if initialization is in progress
  if (initPromise) {
    return initPromise;
  }

  // Return cached result if already initialized and not forcing
  if (isInitialized && !options.force) {
    const db = initializeDatabase();
    const stats = db.getStats();
    return {
      initialized: true,
      reindexed: false,
      stats: {
        domainsCount: stats.domainsCount,
        specializationsCount: stats.specializationsCount,
        agentsCount: stats.agentsCount,
        skillsCount: stats.skillsCount,
        processesCount: stats.processesCount,
      },
      duration: 0,
      errors: [],
    };
  }

  // Start initialization
  initPromise = performInitialization(options);

  try {
    const result = await initPromise;
    isInitialized = true;
    return result;
  } finally {
    initPromise = null;
  }
}

/**
 * Perform the actual initialization
 */
async function performInitialization(options: InitOptions): Promise<InitResult> {
  const startTime = Date.now();
  const errors: string[] = [];

  const log = (message: string, progress?: number) => {
    if (options.verbose) {
      console.log(`[db/init] ${message}`);
    }
    options.onProgress?.(message, progress);
  };

  try {
    log('Starting database initialization...', 0);

    // Initialize database schema
    const db = initializeDatabase();
    log('Database schema initialized', 10);

    // Check if we need to populate data
    const stats = db.getStats();
    const isEmpty = stats.agentsCount === 0 && stats.skillsCount === 0 && stats.processesCount === 0;
    const shouldReindex = options.force || isEmpty || needsRebuild();

    if (!shouldReindex) {
      log('Database already populated, skipping reindex', 100);
      return {
        initialized: true,
        reindexed: false,
        stats: {
          domainsCount: stats.domainsCount,
          specializationsCount: stats.specializationsCount,
          agentsCount: stats.agentsCount,
          skillsCount: stats.skillsCount,
          processesCount: stats.processesCount,
        },
        duration: Date.now() - startTime,
        errors: [],
      };
    }

    log('Running full index...', 20);

    // Run full index
    const baseDir = process.cwd();
    const indexer = new CatalogIndexer(baseDir, {
      forceReindex: true,
      libraryPaths: options.sourcePaths,
      onProgress: (progress) => {
        const total = progress.total > 0 ? progress.total : 1;
        const percent = 20 + ((progress.current / total) * 80); // Scale from 20-100%
        log(`Indexing: ${progress.message || progress.currentFile || 'processing...'}`, percent);
      },
    });
    const indexResult = await indexer.index();

    log('Index complete', 100);

    // Collect errors
    if (indexResult.errors && indexResult.errors.length > 0) {
      errors.push(...indexResult.errors.map((e) => `${e.file}: ${e.error}`));
    }

    // Get final stats
    const finalStats = db.getStats();

    return {
      initialized: true,
      reindexed: true,
      stats: {
        domainsCount: finalStats.domainsCount,
        specializationsCount: finalStats.specializationsCount,
        agentsCount: finalStats.agentsCount,
        skillsCount: finalStats.skillsCount,
        processesCount: finalStats.processesCount,
      },
      duration: Date.now() - startTime,
      errors,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(message);
    log(`Initialization failed: ${message}`, 0);

    return {
      initialized: false,
      reindexed: false,
      stats: {
        domainsCount: 0,
        specializationsCount: 0,
        agentsCount: 0,
        skillsCount: 0,
        processesCount: 0,
      },
      duration: Date.now() - startTime,
      errors,
    };
  }
}

/**
 * Check if database needs initialization
 */
export function needsInitialization(): boolean {
  if (!databaseExists()) {
    return true;
  }

  try {
    const db = initializeDatabase();
    const stats = db.getStats();
    return stats.agentsCount === 0 && stats.skillsCount === 0 && stats.processesCount === 0;
  } catch {
    return true;
  }
}

/**
 * Reset initialization state (useful for testing)
 */
export function resetInitializationState(): void {
  isInitialized = false;
  initPromise = null;
}

/**
 * Get current initialization status
 */
export function getInitializationStatus(): {
  isInitialized: boolean;
  isInitializing: boolean;
} {
  return {
    isInitialized,
    isInitializing: initPromise !== null,
  };
}

// =============================================================================
// AUTO-INIT MIDDLEWARE HELPER
// =============================================================================

/**
 * Middleware helper to ensure database is initialized before handling requests
 * Use this in API routes to automatically initialize the database on first request
 */
export async function withDatabaseInit<T>(
  handler: () => Promise<T>,
  options: InitOptions = {}
): Promise<T> {
  await ensureDatabaseInitialized(options);
  return handler();
}

/**
 * Create a wrapped handler that ensures database initialization
 */
export function createInitializedHandler<TArgs extends unknown[], TResult>(
  handler: (...args: TArgs) => Promise<TResult>,
  options: InitOptions = {}
): (...args: TArgs) => Promise<TResult> {
  return async (...args: TArgs): Promise<TResult> => {
    await ensureDatabaseInitialized(options);
    return handler(...args);
  };
}
