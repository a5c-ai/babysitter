/**
 * Database client singleton for the process library catalog
 * Manages database connections and provides common operations
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import {
  initializeSchema,
  needsMigration,
  runMigrations,
  resetDatabase,
  rebuildFTSIndexes,
  getSchemaVersion,
  SCHEMA_VERSION,
} from './schema';
import type { DatabaseClientOptions, DatabaseStats } from './types';

// =============================================================================
// DEFAULT CONFIGURATION
// =============================================================================

// Detect if we're running from the catalog package directory or the root
const isInCatalogDir = process.cwd().endsWith('catalog') || process.cwd().includes('packages\\catalog') || process.cwd().includes('packages/catalog');
const DEFAULT_DB_PATH = isInCatalogDir
  ? path.join(process.cwd(), 'data', 'catalog.db')
  : path.join(process.cwd(), 'packages', 'catalog', 'data', 'catalog.db');

// =============================================================================
// DATABASE CLIENT
// =============================================================================

/**
 * Database client for the process library catalog
 * Implements singleton pattern for connection reuse
 */
export class CatalogDatabase {
  private static instance: CatalogDatabase | null = null;
  private db: Database.Database;
  private dbPath: string;
  private isInitialized: boolean = false;

  private constructor(options: DatabaseClientOptions) {
    this.dbPath = options.dbPath;

    // Ensure directory exists
    const dbDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Open database connection
    this.db = new Database(this.dbPath, {
      verbose: options.verbose ? console.log : undefined,
    });

    // Configure database
    this.configure(options);
  }

  /**
   * Configure database settings
   */
  private configure(options: DatabaseClientOptions): void {
    // Enable WAL mode for better concurrent access
    if (options.walMode !== false) {
      this.db.pragma('journal_mode = WAL');
    }

    // Performance optimizations
    this.db.pragma('synchronous = NORMAL');
    this.db.pragma('cache_size = -64000'); // 64MB cache
    this.db.pragma('temp_store = MEMORY');
    this.db.pragma('mmap_size = 268435456'); // 256MB mmap

    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');
  }

  /**
   * Get or create the database instance
   */
  public static getInstance(options?: Partial<DatabaseClientOptions>): CatalogDatabase {
    if (!CatalogDatabase.instance) {
      CatalogDatabase.instance = new CatalogDatabase({
        dbPath: options?.dbPath ?? DEFAULT_DB_PATH,
        walMode: options?.walMode ?? true,
        verbose: options?.verbose ?? false,
      });
    }
    return CatalogDatabase.instance;
  }

  /**
   * Initialize the database schema
   */
  public initialize(): void {
    if (this.isInitialized) return;

    const currentVersion = getSchemaVersion(this.db);

    if (currentVersion === 0) {
      // Fresh database, create schema
      initializeSchema(this.db);
    } else if (needsMigration(this.db)) {
      // Run migrations
      runMigrations(this.db);
    }

    this.isInitialized = true;
  }

  /**
   * Get the underlying better-sqlite3 database instance
   */
  public getDb(): Database.Database {
    return this.db;
  }

  /**
   * Get database file path
   */
  public getDbPath(): string {
    return this.dbPath;
  }

  /**
   * Check if database is initialized
   */
  public isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Reset the database (drop all tables and recreate)
   */
  public reset(): void {
    resetDatabase(this.db);
    this.isInitialized = true;
  }

  /**
   * Rebuild FTS indexes
   */
  public rebuildFTS(): void {
    rebuildFTSIndexes(this.db);
  }

  /**
   * Get database statistics
   */
  public getStats(): DatabaseStats {
    const domainsCount = this.db
      .prepare('SELECT COUNT(*) as count FROM domains')
      .get() as { count: number };
    const specializationsCount = this.db
      .prepare('SELECT COUNT(*) as count FROM specializations')
      .get() as { count: number };
    const agentsCount = this.db
      .prepare('SELECT COUNT(*) as count FROM agents')
      .get() as { count: number };
    const skillsCount = this.db
      .prepare('SELECT COUNT(*) as count FROM skills')
      .get() as { count: number };
    const processesCount = this.db
      .prepare('SELECT COUNT(*) as count FROM processes')
      .get() as { count: number };

    const metadata = this.db
      .prepare('SELECT last_full_index FROM index_metadata WHERE id = 1')
      .get() as { last_full_index: string | null } | undefined;

    // Get database file size
    let databaseSize = 0;
    try {
      const stats = fs.statSync(this.dbPath);
      databaseSize = stats.size;
    } catch {
      // File might not exist yet
    }

    return {
      domainsCount: domainsCount.count,
      specializationsCount: specializationsCount.count,
      agentsCount: agentsCount.count,
      skillsCount: skillsCount.count,
      processesCount: processesCount.count,
      lastIndexedAt: metadata?.last_full_index ?? null,
      databaseSize,
    };
  }

  /**
   * Run a transaction
   */
  public transaction<T>(fn: () => T): T {
    return this.db.transaction(fn)();
  }

  /**
   * Prepare a statement
   */
  public prepare(sql: string): Database.Statement {
    return this.db.prepare(sql);
  }

  /**
   * Execute raw SQL
   */
  public exec(sql: string): void {
    this.db.exec(sql);
  }

  /**
   * Vacuum the database
   */
  public vacuum(): void {
    this.db.exec('VACUUM');
  }

  /**
   * Checkpoint WAL
   */
  public checkpoint(): void {
    this.db.pragma('wal_checkpoint(TRUNCATE)');
  }

  /**
   * Close the database connection
   */
  public close(): void {
    if (this.db) {
      this.db.close();
    }
    CatalogDatabase.instance = null;
    this.isInitialized = false;
  }

  /**
   * Get schema version
   */
  public getSchemaVersion(): number {
    return getSchemaVersion(this.db);
  }

  /**
   * Get expected schema version
   */
  public getExpectedSchemaVersion(): number {
    return SCHEMA_VERSION;
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Get the database instance (convenience function)
 */
export function getDatabase(options?: Partial<DatabaseClientOptions>): CatalogDatabase {
  return CatalogDatabase.getInstance(options);
}

/**
 * Initialize the database (convenience function)
 */
export function initializeDatabase(options?: Partial<DatabaseClientOptions>): CatalogDatabase {
  const db = CatalogDatabase.getInstance(options);
  db.initialize();
  return db;
}

/**
 * Close the database connection (convenience function)
 */
export function closeDatabase(): void {
  const instance = CatalogDatabase.getInstance();
  instance.close();
}

/**
 * Reset the database (convenience function)
 */
export function resetCatalogDatabase(options?: Partial<DatabaseClientOptions>): void {
  const db = CatalogDatabase.getInstance(options);
  db.reset();
}

/**
 * Get database path
 */
export function getDatabasePath(): string {
  return DEFAULT_DB_PATH;
}

/**
 * Check if database file exists
 */
export function databaseExists(dbPath?: string): boolean {
  return fs.existsSync(dbPath ?? DEFAULT_DB_PATH);
}
