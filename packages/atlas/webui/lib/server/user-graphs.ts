import { randomUUID } from "node:crypto";
import type { IndexShape } from "@a5c-ai/atlas";
import { buildOverlayIndexFromYaml, mergeManyIndexes } from "./atlas-overlay";
import { ensureDatabaseSchema, getDbPool, queryRow, queryRows } from "./db";

type UploadRow = {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string | null;
  source_filename: string;
  status: string;
  validation_summary_json: Record<string, unknown>;
  index_json: IndexShape;
  created_at: string;
  updated_at: string;
};

export type UserGraphUpload = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sourceFilename: string;
  status: string;
  recordCount: number;
  edgeCount: number;
  createdAt: string;
  updatedAt: string;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || `graph-${Date.now()}`;
}

function toUpload(row: UploadRow): UserGraphUpload {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    sourceFilename: row.source_filename,
    status: row.status,
    recordCount: row.index_json?.stats?.totalRecords ?? 0,
    edgeCount: row.index_json?.stats?.totalEdges ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listUserGraphUploads(userId: string): Promise<UserGraphUpload[]> {
  const rows = await queryRows<UploadRow>(
    `SELECT id, user_id, slug, title, description, source_filename, status, validation_summary_json, index_json, created_at, updated_at
       FROM atlas_user_graph_uploads
      WHERE user_id = $1
      ORDER BY created_at DESC`,
    [userId],
  );
  return rows.map(toUpload);
}

export async function createUserGraphUpload(input: {
  userId: string;
  title: string;
  description?: string;
  sourceFilename: string;
  rawYaml: string;
}): Promise<UserGraphUpload> {
  const slug = slugify(input.title || input.sourceFilename);
  const uploadId = randomUUID();
  const documentId = randomUUID();
  const index = buildOverlayIndexFromYaml(input.rawYaml, input.sourceFilename);
  const validationSummary = {
    totalRecords: index.stats.totalRecords,
    totalEdges: index.stats.totalEdges,
    parseErrors: index.stats.parseErrors,
  };

  await ensureDatabaseSchema();
  const client = await getDbPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO atlas_user_graph_uploads
        (id, user_id, slug, title, description, source_filename, status, validation_summary_json, index_json)
       VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)`,
      [
        uploadId,
        input.userId,
        slug,
        input.title || input.sourceFilename,
        input.description ?? null,
        input.sourceFilename,
        index.stats.parseErrors > 0 ? "warning" : "ready",
        JSON.stringify(validationSummary),
        JSON.stringify(index),
      ],
    );

    await client.query(
      `INSERT INTO atlas_user_graph_documents
        (id, upload_id, document_order, raw_yaml, parsed_json, record_count, edge_count)
       VALUES
        ($1, $2, 0, $3, $4::jsonb, $5, $6)`,
      [
        documentId,
        uploadId,
        input.rawYaml,
        JSON.stringify(index),
        index.stats.totalRecords,
        index.stats.totalEdges,
      ],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const row = await queryRow<UploadRow>(
    `SELECT id, user_id, slug, title, description, source_filename, status, validation_summary_json, index_json, created_at, updated_at
       FROM atlas_user_graph_uploads
      WHERE id = $1`,
    [uploadId],
  );

  if (!row) {
    throw new Error("Failed to read uploaded graph metadata.");
  }

  return toUpload(row);
}

export async function getUserOverlayIndex(userId: string): Promise<IndexShape | null> {
  const rows = await queryRows<{ index_json: IndexShape }>(
    `SELECT index_json
       FROM atlas_user_graph_uploads
      WHERE user_id = $1 AND status IN ('ready', 'warning')
      ORDER BY created_at ASC`,
    [userId],
  );

  if (rows.length === 0) {
    return null;
  }

  return mergeManyIndexes(rows.map((row) => row.index_json));
}
