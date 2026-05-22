import { ATLAS_WEBUI_SCHEMA_SQL } from "./db-schema";

type Pool = import("pg").Pool;
type QueryResultRow = import("pg").QueryResultRow;

declare global {
  // eslint-disable-next-line no-var
  var __atlasWebuiPgPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __atlasWebuiSchemaReady: Promise<void> | undefined;
}

export function isDatabaseConfigured(): boolean {
  return typeof process.env.DATABASE_URL === "string" && process.env.DATABASE_URL.length > 0;
}

async function createPool(): Promise<Pool> {
  const { Pool: PgPool } = await import("pg");
  return new PgPool({
    connectionString: process.env.DATABASE_URL!,
    max: 10,
  });
}

export async function getDbPool(): Promise<Pool> {
  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured. Private workspace features are unavailable.");
  }
  if (!global.__atlasWebuiPgPool) {
    global.__atlasWebuiPgPool = await createPool();
  }
  return global.__atlasWebuiPgPool;
}

export async function ensureDatabaseSchema(): Promise<void> {
  if (!global.__atlasWebuiSchemaReady) {
    global.__atlasWebuiSchemaReady = getDbPool()
      .then((pool) => pool.query(ATLAS_WEBUI_SCHEMA_SQL))
      .then(() => undefined);
  }
  return global.__atlasWebuiSchemaReady;
}

export async function queryRows<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<T[]> {
  await ensureDatabaseSchema();
  const pool = await getDbPool();
  const result = await pool.query<T>(text, values);
  return result.rows;
}

export async function queryRow<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<T | null> {
  const rows = await queryRows<T>(text, values);
  return rows[0] ?? null;
}

export async function execute(text: string, values: unknown[] = []): Promise<void> {
  await ensureDatabaseSchema();
  const pool = await getDbPool();
  await pool.query(text, values);
}
