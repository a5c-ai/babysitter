/**
 * SQLite schema definitions and table creation for the process library catalog
 * Uses FTS5 for full-text search capabilities
 */

import type Database from 'better-sqlite3';

// =============================================================================
// SCHEMA VERSION
// =============================================================================

export const SCHEMA_VERSION = 1;

// =============================================================================
// TABLE CREATION SQL
// =============================================================================

/**
 * SQL statements to create all tables
 */
export const CREATE_TABLES_SQL = `
-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_version (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  version INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Domains table
CREATE TABLE IF NOT EXISTS domains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  path TEXT NOT NULL UNIQUE,
  category TEXT,
  readme_path TEXT,
  references_path TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Specializations table
CREATE TABLE IF NOT EXISTS specializations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  path TEXT NOT NULL UNIQUE,
  domain_id INTEGER,
  readme_path TEXT,
  references_path TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL
);

-- Agents table
CREATE TABLE IF NOT EXISTS agents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  file_path TEXT NOT NULL UNIQUE,
  directory TEXT NOT NULL,
  role TEXT,
  expertise TEXT NOT NULL DEFAULT '[]',
  specialization_id INTEGER,
  domain_id INTEGER,
  frontmatter TEXT NOT NULL DEFAULT '{}',
  content TEXT NOT NULL DEFAULT '',
  file_mtime INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (specialization_id) REFERENCES specializations(id) ON DELETE SET NULL,
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL
);

-- Skills table
CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  file_path TEXT NOT NULL UNIQUE,
  directory TEXT NOT NULL,
  allowed_tools TEXT NOT NULL DEFAULT '[]',
  specialization_id INTEGER,
  domain_id INTEGER,
  frontmatter TEXT NOT NULL DEFAULT '{}',
  content TEXT NOT NULL DEFAULT '',
  file_mtime INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (specialization_id) REFERENCES specializations(id) ON DELETE SET NULL,
  FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL
);

-- Processes table
CREATE TABLE IF NOT EXISTS processes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  process_id TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  file_path TEXT NOT NULL UNIQUE,
  directory TEXT NOT NULL,
  category TEXT,
  inputs TEXT NOT NULL DEFAULT '[]',
  outputs TEXT NOT NULL DEFAULT '[]',
  tasks TEXT NOT NULL DEFAULT '[]',
  frontmatter TEXT NOT NULL DEFAULT '{}',
  file_mtime INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- File tracking for incremental updates
CREATE TABLE IF NOT EXISTS file_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_path TEXT NOT NULL UNIQUE,
  file_type TEXT NOT NULL CHECK (file_type IN ('agent', 'skill', 'process', 'domain', 'specialization')),
  mtime INTEGER NOT NULL,
  hash TEXT,
  indexed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index metadata
CREATE TABLE IF NOT EXISTS index_metadata (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  last_full_index TEXT,
  last_incremental_index TEXT,
  total_files_indexed INTEGER DEFAULT 0,
  index_duration_ms INTEGER DEFAULT 0
);
`;

/**
 * SQL statements to create indexes
 */
export const CREATE_INDEXES_SQL = `
-- Domain indexes
CREATE INDEX IF NOT EXISTS idx_domains_name ON domains(name);
CREATE INDEX IF NOT EXISTS idx_domains_category ON domains(category);

-- Specialization indexes
CREATE INDEX IF NOT EXISTS idx_specializations_name ON specializations(name);
CREATE INDEX IF NOT EXISTS idx_specializations_domain_id ON specializations(domain_id);

-- Agent indexes
CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name);
CREATE INDEX IF NOT EXISTS idx_agents_specialization_id ON agents(specialization_id);
CREATE INDEX IF NOT EXISTS idx_agents_domain_id ON agents(domain_id);
CREATE INDEX IF NOT EXISTS idx_agents_file_mtime ON agents(file_mtime);

-- Skill indexes
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_specialization_id ON skills(specialization_id);
CREATE INDEX IF NOT EXISTS idx_skills_domain_id ON skills(domain_id);
CREATE INDEX IF NOT EXISTS idx_skills_file_mtime ON skills(file_mtime);

-- Process indexes
CREATE INDEX IF NOT EXISTS idx_processes_process_id ON processes(process_id);
CREATE INDEX IF NOT EXISTS idx_processes_category ON processes(category);
CREATE INDEX IF NOT EXISTS idx_processes_file_mtime ON processes(file_mtime);

-- File tracking indexes
CREATE INDEX IF NOT EXISTS idx_file_tracking_path ON file_tracking(file_path);
CREATE INDEX IF NOT EXISTS idx_file_tracking_type ON file_tracking(file_type);
CREATE INDEX IF NOT EXISTS idx_file_tracking_mtime ON file_tracking(mtime);
`;

/**
 * SQL statements to create FTS5 virtual tables
 */
export const CREATE_FTS_SQL = `
-- FTS5 virtual table for agents
CREATE VIRTUAL TABLE IF NOT EXISTS agents_fts USING fts5(
  name,
  description,
  role,
  expertise,
  content,
  content='agents',
  content_rowid='id',
  tokenize='porter unicode61'
);

-- FTS5 virtual table for skills
CREATE VIRTUAL TABLE IF NOT EXISTS skills_fts USING fts5(
  name,
  description,
  allowed_tools,
  content,
  content='skills',
  content_rowid='id',
  tokenize='porter unicode61'
);

-- FTS5 virtual table for processes
CREATE VIRTUAL TABLE IF NOT EXISTS processes_fts USING fts5(
  process_id,
  description,
  category,
  inputs,
  outputs,
  content='processes',
  content_rowid='id',
  tokenize='porter unicode61'
);

-- Unified search table for all catalog items
CREATE VIRTUAL TABLE IF NOT EXISTS catalog_search USING fts5(
  item_type,
  item_id UNINDEXED,
  name,
  description,
  content,
  tokenize='porter unicode61'
);
`;

/**
 * SQL triggers to keep FTS tables in sync
 */
export const CREATE_TRIGGERS_SQL = `
-- Agents FTS triggers
CREATE TRIGGER IF NOT EXISTS agents_ai AFTER INSERT ON agents BEGIN
  INSERT INTO agents_fts(rowid, name, description, role, expertise, content)
  VALUES (new.id, new.name, new.description, new.role, new.expertise, new.content);
END;

CREATE TRIGGER IF NOT EXISTS agents_ad AFTER DELETE ON agents BEGIN
  INSERT INTO agents_fts(agents_fts, rowid, name, description, role, expertise, content)
  VALUES ('delete', old.id, old.name, old.description, old.role, old.expertise, old.content);
END;

CREATE TRIGGER IF NOT EXISTS agents_au AFTER UPDATE ON agents BEGIN
  INSERT INTO agents_fts(agents_fts, rowid, name, description, role, expertise, content)
  VALUES ('delete', old.id, old.name, old.description, old.role, old.expertise, old.content);
  INSERT INTO agents_fts(rowid, name, description, role, expertise, content)
  VALUES (new.id, new.name, new.description, new.role, new.expertise, new.content);
END;

-- Skills FTS triggers
CREATE TRIGGER IF NOT EXISTS skills_ai AFTER INSERT ON skills BEGIN
  INSERT INTO skills_fts(rowid, name, description, allowed_tools, content)
  VALUES (new.id, new.name, new.description, new.allowed_tools, new.content);
END;

CREATE TRIGGER IF NOT EXISTS skills_ad AFTER DELETE ON skills BEGIN
  INSERT INTO skills_fts(skills_fts, rowid, name, description, allowed_tools, content)
  VALUES ('delete', old.id, old.name, old.description, old.allowed_tools, old.content);
END;

CREATE TRIGGER IF NOT EXISTS skills_au AFTER UPDATE ON skills BEGIN
  INSERT INTO skills_fts(skills_fts, rowid, name, description, allowed_tools, content)
  VALUES ('delete', old.id, old.name, old.description, old.allowed_tools, old.content);
  INSERT INTO skills_fts(rowid, name, description, allowed_tools, content)
  VALUES (new.id, new.name, new.description, new.allowed_tools, new.content);
END;

-- Processes FTS triggers
CREATE TRIGGER IF NOT EXISTS processes_ai AFTER INSERT ON processes BEGIN
  INSERT INTO processes_fts(rowid, process_id, description, category, inputs, outputs)
  VALUES (new.id, new.process_id, new.description, new.category, new.inputs, new.outputs);
END;

CREATE TRIGGER IF NOT EXISTS processes_ad AFTER DELETE ON processes BEGIN
  INSERT INTO processes_fts(processes_fts, rowid, process_id, description, category, inputs, outputs)
  VALUES ('delete', old.id, old.process_id, old.description, old.category, old.inputs, old.outputs);
END;

CREATE TRIGGER IF NOT EXISTS processes_au AFTER UPDATE ON processes BEGIN
  INSERT INTO processes_fts(processes_fts, rowid, process_id, description, category, inputs, outputs)
  VALUES ('delete', old.id, old.process_id, old.description, old.category, old.inputs, old.outputs);
  INSERT INTO processes_fts(rowid, process_id, description, category, inputs, outputs)
  VALUES (new.id, new.process_id, new.description, new.category, new.inputs, new.outputs);
END;
`;

// =============================================================================
// SCHEMA MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Initialize the database schema
 * Creates all tables, indexes, and FTS virtual tables
 */
export function initializeSchema(db: Database.Database): void {
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Run table creation
  db.exec(CREATE_TABLES_SQL);

  // Run index creation
  db.exec(CREATE_INDEXES_SQL);

  // Create FTS tables
  db.exec(CREATE_FTS_SQL);

  // Create triggers
  db.exec(CREATE_TRIGGERS_SQL);

  // Initialize schema version
  const versionStmt = db.prepare(`
    INSERT OR REPLACE INTO schema_version (id, version, updated_at)
    VALUES (1, ?, datetime('now'))
  `);
  versionStmt.run(SCHEMA_VERSION);

  // Initialize index metadata
  db.prepare(`
    INSERT OR IGNORE INTO index_metadata (id) VALUES (1)
  `).run();
}

/**
 * Get current schema version
 */
export function getSchemaVersion(db: Database.Database): number {
  const row = db.prepare('SELECT version FROM schema_version WHERE id = 1').get() as
    | { version: number }
    | undefined;
  return row?.version ?? 0;
}

/**
 * Check if schema needs migration
 */
export function needsMigration(db: Database.Database): boolean {
  const currentVersion = getSchemaVersion(db);
  return currentVersion < SCHEMA_VERSION;
}

/**
 * Run schema migrations
 */
export function runMigrations(db: Database.Database): void {
  const currentVersion = getSchemaVersion(db);

  if (currentVersion < 1) {
    // Initial schema creation
    initializeSchema(db);
    return;
  }

  // Add future migrations here as needed
  // if (currentVersion < 2) { ... }
}

/**
 * Reset the database (drop all tables and recreate)
 */
export function resetDatabase(db: Database.Database): void {
  // Drop all tables in reverse order of dependencies
  const dropStatements = `
    DROP TABLE IF EXISTS catalog_search;
    DROP TABLE IF EXISTS processes_fts;
    DROP TABLE IF EXISTS skills_fts;
    DROP TABLE IF EXISTS agents_fts;
    DROP TABLE IF EXISTS file_tracking;
    DROP TABLE IF EXISTS index_metadata;
    DROP TABLE IF EXISTS processes;
    DROP TABLE IF EXISTS skills;
    DROP TABLE IF EXISTS agents;
    DROP TABLE IF EXISTS specializations;
    DROP TABLE IF EXISTS domains;
    DROP TABLE IF EXISTS schema_version;
  `;

  // Drop triggers
  const dropTriggers = `
    DROP TRIGGER IF EXISTS agents_ai;
    DROP TRIGGER IF EXISTS agents_ad;
    DROP TRIGGER IF EXISTS agents_au;
    DROP TRIGGER IF EXISTS skills_ai;
    DROP TRIGGER IF EXISTS skills_ad;
    DROP TRIGGER IF EXISTS skills_au;
    DROP TRIGGER IF EXISTS processes_ai;
    DROP TRIGGER IF EXISTS processes_ad;
    DROP TRIGGER IF EXISTS processes_au;
  `;

  db.exec(dropTriggers);
  db.exec(dropStatements);

  // Recreate schema
  initializeSchema(db);
}

/**
 * Rebuild FTS indexes
 */
export function rebuildFTSIndexes(db: Database.Database): void {
  // Rebuild agents FTS
  db.exec(`INSERT INTO agents_fts(agents_fts) VALUES('rebuild')`);

  // Rebuild skills FTS
  db.exec(`INSERT INTO skills_fts(skills_fts) VALUES('rebuild')`);

  // Rebuild processes FTS
  db.exec(`INSERT INTO processes_fts(processes_fts) VALUES('rebuild')`);

  // Rebuild catalog search
  rebuildCatalogSearch(db);
}

/**
 * Rebuild the unified catalog search table
 */
export function rebuildCatalogSearch(db: Database.Database): void {
  // Clear existing data
  db.exec(`DELETE FROM catalog_search`);

  // Insert agents
  db.exec(`
    INSERT INTO catalog_search (item_type, item_id, name, description, content)
    SELECT 'agent', id, name, description, content FROM agents
  `);

  // Insert skills
  db.exec(`
    INSERT INTO catalog_search (item_type, item_id, name, description, content)
    SELECT 'skill', id, name, description, content FROM skills
  `);

  // Insert processes
  db.exec(`
    INSERT INTO catalog_search (item_type, item_id, name, description, content)
    SELECT 'process', id, process_id, description, '' FROM processes
  `);

  // Insert domains
  db.exec(`
    INSERT INTO catalog_search (item_type, item_id, name, description, content)
    SELECT 'domain', id, name, '', '' FROM domains
  `);

  // Insert specializations
  db.exec(`
    INSERT INTO catalog_search (item_type, item_id, name, description, content)
    SELECT 'specialization', id, name, '', '' FROM specializations
  `);
}

/**
 * Get table names
 */
export function getTableNames(): string[] {
  return [
    'schema_version',
    'domains',
    'specializations',
    'agents',
    'skills',
    'processes',
    'file_tracking',
    'index_metadata',
  ];
}

/**
 * Get FTS table names
 */
export function getFTSTableNames(): string[] {
  return ['agents_fts', 'skills_fts', 'processes_fts', 'catalog_search'];
}

/**
 * Get index names
 */
export function getIndexNames(): string[] {
  return [
    'idx_domains_name',
    'idx_domains_category',
    'idx_specializations_name',
    'idx_specializations_domain_id',
    'idx_agents_name',
    'idx_agents_specialization_id',
    'idx_agents_domain_id',
    'idx_agents_file_mtime',
    'idx_skills_name',
    'idx_skills_specialization_id',
    'idx_skills_domain_id',
    'idx_skills_file_mtime',
    'idx_processes_process_id',
    'idx_processes_category',
    'idx_processes_file_mtime',
    'idx_file_tracking_path',
    'idx_file_tracking_type',
    'idx_file_tracking_mtime',
  ];
}

/**
 * Get schema information for documentation
 */
export function getSchemaInfo(): {
  tables: Array<{ name: string; description: string }>;
  indexes: Array<{ name: string; table: string }>;
  fts: Array<{ name: string; description: string }>;
} {
  return {
    tables: [
      { name: 'domains', description: 'Top-level domain categories (e.g., science, business)' },
      { name: 'specializations', description: 'Specialized areas within or outside domains' },
      { name: 'agents', description: 'AI agent definitions with roles and capabilities' },
      { name: 'skills', description: 'Skill definitions with tools and instructions' },
      { name: 'processes', description: 'Process definitions with inputs/outputs' },
      { name: 'file_tracking', description: 'File modification tracking for incremental updates' },
      { name: 'index_metadata', description: 'Metadata about indexing operations' },
      { name: 'schema_version', description: 'Schema version for migrations' },
    ],
    indexes: [
      { name: 'idx_domains_name', table: 'domains' },
      { name: 'idx_domains_category', table: 'domains' },
      { name: 'idx_specializations_name', table: 'specializations' },
      { name: 'idx_specializations_domain_id', table: 'specializations' },
      { name: 'idx_agents_name', table: 'agents' },
      { name: 'idx_agents_specialization_id', table: 'agents' },
      { name: 'idx_agents_domain_id', table: 'agents' },
      { name: 'idx_agents_file_mtime', table: 'agents' },
      { name: 'idx_skills_name', table: 'skills' },
      { name: 'idx_skills_specialization_id', table: 'skills' },
      { name: 'idx_skills_domain_id', table: 'skills' },
      { name: 'idx_skills_file_mtime', table: 'skills' },
      { name: 'idx_processes_process_id', table: 'processes' },
      { name: 'idx_processes_category', table: 'processes' },
      { name: 'idx_processes_file_mtime', table: 'processes' },
      { name: 'idx_file_tracking_path', table: 'file_tracking' },
      { name: 'idx_file_tracking_type', table: 'file_tracking' },
      { name: 'idx_file_tracking_mtime', table: 'file_tracking' },
    ],
    fts: [
      { name: 'agents_fts', description: 'Full-text search for agents (name, description, role, expertise, content)' },
      { name: 'skills_fts', description: 'Full-text search for skills (name, description, allowed_tools, content)' },
      { name: 'processes_fts', description: 'Full-text search for processes (process_id, description, category, inputs, outputs)' },
      { name: 'catalog_search', description: 'Unified full-text search across all catalog items' },
    ],
  };
}
