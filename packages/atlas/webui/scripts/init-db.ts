import { Pool } from "pg";
import { ATLAS_WEBUI_SCHEMA_SQL } from "../lib/server/db-schema";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await pool.query(ATLAS_WEBUI_SCHEMA_SQL);
    console.log("[atlas-webui] database schema is ready");
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
