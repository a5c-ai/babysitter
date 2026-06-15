import fs from "node:fs";
import path from "node:path";

type SqliteStatement = {
  run: (...params: unknown[]) => { changes?: number };
  get: (...params: unknown[]) => Record<string, unknown> | undefined;
  all: (...params: unknown[]) => Array<Record<string, unknown>>;
};

export type LocalDevelopmentSqliteDatabase = {
  exec: (sql: string) => void;
  prepare: (sql: string) => SqliteStatement;
  close: () => void;
};

function getDatabaseSync(): new (dbPath: string) => LocalDevelopmentSqliteDatabase {
  const getBuiltinModule = (
    process as NodeJS.Process & {
      getBuiltinModule?: (name: string) => unknown;
    }
  ).getBuiltinModule;
  const sqliteModule = getBuiltinModule?.("node:sqlite") as
    | { DatabaseSync?: new (dbPath: string) => LocalDevelopmentSqliteDatabase }
    | undefined;

  if (!sqliteModule?.DatabaseSync) {
    throw new Error("The current Node.js runtime does not expose the built-in `node:sqlite` module.");
  }

  return sqliteModule.DatabaseSync;
}

declare global {
  // eslint-disable-next-line no-var
  var __atlasWebuiLocalDevelopmentSqlite: LocalDevelopmentSqliteDatabase | undefined;
  // eslint-disable-next-line no-var
  var __atlasWebuiLocalDevelopmentSqlitePath: string | undefined;
}

function getLocalDevelopmentStorageDir(): string {
  const configured = process.env.ATLAS_LOCAL_STORAGE_DIR?.trim();
  return configured
    ? path.resolve(configured)
    : path.join(process.cwd(), ".atlas-local", "atlas-webui");
}

function getLocalDevelopmentSqlitePath(): string {
  return path.join(getLocalDevelopmentStorageDir(), "local-dev.db");
}

function ensureSchema(db: LocalDevelopmentSqliteDatabase): void {
  db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS atlas_company_blueprints_local (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL,
      draft_json TEXT,
      last_export_yaml TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_atlas_company_blueprints_local_user
      ON atlas_company_blueprints_local (user_id, updated_at DESC, created_at DESC);

    CREATE TABLE IF NOT EXISTS atlas_user_graph_uploads_local (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      source_filename TEXT NOT NULL,
      status TEXT NOT NULL,
      validation_summary_json TEXT NOT NULL,
      index_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_atlas_user_graph_uploads_local_user
      ON atlas_user_graph_uploads_local (user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS atlas_user_graph_documents_local (
      id TEXT PRIMARY KEY,
      upload_id TEXT NOT NULL,
      document_order INTEGER NOT NULL,
      raw_yaml TEXT NOT NULL,
      parsed_json TEXT NOT NULL,
      record_count INTEGER NOT NULL,
      edge_count INTEGER NOT NULL,
      FOREIGN KEY (upload_id) REFERENCES atlas_user_graph_uploads_local (id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_atlas_user_graph_documents_local_upload
      ON atlas_user_graph_documents_local (upload_id, document_order ASC);
  `);
}

export function getLocalDevelopmentSqlite(): LocalDevelopmentSqliteDatabase {
  const dbPath = getLocalDevelopmentSqlitePath();
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  if (
    global.__atlasWebuiLocalDevelopmentSqlite &&
    global.__atlasWebuiLocalDevelopmentSqlitePath !== dbPath
  ) {
    global.__atlasWebuiLocalDevelopmentSqlite.close();
    global.__atlasWebuiLocalDevelopmentSqlite = undefined;
    global.__atlasWebuiLocalDevelopmentSqlitePath = undefined;
  }

  if (!global.__atlasWebuiLocalDevelopmentSqlite) {
    const DatabaseSync = getDatabaseSync();
    global.__atlasWebuiLocalDevelopmentSqlite = new DatabaseSync(dbPath);
    global.__atlasWebuiLocalDevelopmentSqlitePath = dbPath;
    ensureSchema(global.__atlasWebuiLocalDevelopmentSqlite);
  }

  return global.__atlasWebuiLocalDevelopmentSqlite;
}

export function resetLocalDevelopmentSqliteForTests(): void {
  global.__atlasWebuiLocalDevelopmentSqlite?.close();
  global.__atlasWebuiLocalDevelopmentSqlite = undefined;
  global.__atlasWebuiLocalDevelopmentSqlitePath = undefined;
}
