import { randomUUID } from "node:crypto";
import type { IndexShape } from "@a5c-ai/atlas";
import { buildOverlayIndexFromYaml, mergeManyIndexes } from "./atlas-overlay";
import { ensureDatabaseSchema, execute, getDbPool, isDatabaseConfigured, queryRow, queryRows } from "./db";
import { getLocalDevelopmentSqlite } from "./local-dev-sqlite";

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

type UploadDocumentRow = {
  raw_yaml: string;
  source_filename: string;
  title: string;
  description: string | null;
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

function localUploadRowFromSql(row: Record<string, unknown>): UploadRow {
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    slug: String(row.slug),
    title: String(row.title),
    description: row.description == null ? null : String(row.description),
    source_filename: String(row.source_filename),
    status: String(row.status),
    validation_summary_json:
      typeof row.validation_summary_json === "string" && row.validation_summary_json.length > 0
        ? (JSON.parse(row.validation_summary_json) as Record<string, unknown>)
        : {},
    index_json:
      typeof row.index_json === "string" && row.index_json.length > 0
        ? (JSON.parse(row.index_json) as IndexShape)
        : buildOverlayIndexFromYaml("", "empty"),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function localUploadDocumentRowFromSql(row: Record<string, unknown>): UploadDocumentRow {
  return {
    raw_yaml: String(row.raw_yaml),
    source_filename: String(row.source_filename),
    title: String(row.title),
    description: row.description == null ? null : String(row.description),
  };
}

export async function listUserGraphUploads(userId: string): Promise<UserGraphUpload[]> {
  if (!isDatabaseConfigured()) {
    const rows = getLocalDevelopmentSqlite()
      .prepare(`
        SELECT id, user_id, slug, title, description, source_filename, status, validation_summary_json, index_json, created_at, updated_at
        FROM atlas_user_graph_uploads_local
        WHERE user_id = ?
        ORDER BY created_at DESC
      `)
      .all(userId)
      .map(localUploadRowFromSql);
    return rows.map(toUpload);
  }

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
  const status = index.stats.parseErrors > 0 ? "warning" : "ready";
  const validationSummary = {
    totalRecords: index.stats.totalRecords,
    totalEdges: index.stats.totalEdges,
    parseErrors: index.stats.parseErrors,
  };
  const title = input.title || input.sourceFilename;

  if (!isDatabaseConfigured()) {
    const now = new Date().toISOString();
    const db = getLocalDevelopmentSqlite();
    db.prepare(`
      INSERT INTO atlas_user_graph_uploads_local
        (id, user_id, slug, title, description, source_filename, status, validation_summary_json, index_json, created_at, updated_at)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uploadId,
      input.userId,
      slug,
      title,
      input.description ?? null,
      input.sourceFilename,
      status,
      JSON.stringify(validationSummary),
      JSON.stringify(index),
      now,
      now,
    );
    db.prepare(`
      INSERT INTO atlas_user_graph_documents_local
        (id, upload_id, document_order, raw_yaml, parsed_json, record_count, edge_count)
      VALUES
        (?, ?, 0, ?, ?, ?, ?)
    `).run(
      documentId,
      uploadId,
      input.rawYaml,
      JSON.stringify(index),
      index.stats.totalRecords,
      index.stats.totalEdges,
    );
    return toUpload({
      id: uploadId,
      user_id: input.userId,
      slug,
      title,
      description: input.description ?? null,
      source_filename: input.sourceFilename,
      status,
      validation_summary_json: validationSummary,
      index_json: index,
      created_at: now,
      updated_at: now,
    });
  }

  await ensureDatabaseSchema();
  const client = await (await getDbPool()).connect();
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
        status,
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

export async function deleteUserGraphUpload(userId: string, uploadId: string): Promise<void> {
  if (!isDatabaseConfigured()) {
    getLocalDevelopmentSqlite()
      .prepare(`
        DELETE FROM atlas_user_graph_uploads_local
        WHERE user_id = ? AND id = ?
      `)
      .run(userId, uploadId);
    return;
  }

  await ensureDatabaseSchema();
  await execute(
    `DELETE FROM atlas_user_graph_uploads
      WHERE user_id = $1 AND id = $2`,
    [userId, uploadId],
  );
}

export async function rebuildUserGraphUpload(userId: string, uploadId: string): Promise<UserGraphUpload> {
  if (!isDatabaseConfigured()) {
    const db = getLocalDevelopmentSqlite();
    const sourceRow = db.prepare(`
      SELECT d.raw_yaml, u.source_filename, u.title, u.description
      FROM atlas_user_graph_documents_local d
      INNER JOIN atlas_user_graph_uploads_local u ON u.id = d.upload_id
      WHERE u.user_id = ? AND u.id = ?
      ORDER BY d.document_order ASC
      LIMIT 1
    `).get(userId, uploadId);

    if (!sourceRow) {
      throw new Error("Uploaded graph not found.");
    }

    const source = localUploadDocumentRowFromSql(sourceRow);
    const index = buildOverlayIndexFromYaml(source.raw_yaml, source.source_filename);
    const status = index.stats.parseErrors > 0 ? "warning" : "ready";
    const validationSummary = {
      totalRecords: index.stats.totalRecords,
      totalEdges: index.stats.totalEdges,
      parseErrors: index.stats.parseErrors,
    };
    const updatedAt = new Date().toISOString();

    db.prepare(`
      UPDATE atlas_user_graph_uploads_local
      SET status = ?, validation_summary_json = ?, index_json = ?, updated_at = ?
      WHERE user_id = ? AND id = ?
    `).run(
      status,
      JSON.stringify(validationSummary),
      JSON.stringify(index),
      updatedAt,
      userId,
      uploadId,
    );
    db.prepare(`
      UPDATE atlas_user_graph_documents_local
      SET parsed_json = ?, record_count = ?, edge_count = ?
      WHERE upload_id = ? AND document_order = 0
    `).run(
      JSON.stringify(index),
      index.stats.totalRecords,
      index.stats.totalEdges,
      uploadId,
    );

    const row = db.prepare(`
      SELECT id, user_id, slug, title, description, source_filename, status, validation_summary_json, index_json, created_at, updated_at
      FROM atlas_user_graph_uploads_local
      WHERE user_id = ? AND id = ?
    `).get(userId, uploadId);

    if (!row) {
      throw new Error("Failed to reload uploaded graph metadata.");
    }

    return toUpload(localUploadRowFromSql(row));
  }

  const source = await queryRow<UploadDocumentRow>(
    `SELECT d.raw_yaml, u.source_filename, u.title, u.description
       FROM atlas_user_graph_documents d
       INNER JOIN atlas_user_graph_uploads u ON u.id = d.upload_id
      WHERE u.user_id = $1 AND u.id = $2
      ORDER BY d.document_order ASC
      LIMIT 1`,
    [userId, uploadId],
  );

  if (!source) {
    throw new Error("Uploaded graph not found.");
  }

  const index = buildOverlayIndexFromYaml(source.raw_yaml, source.source_filename);
  const validationSummary = {
    totalRecords: index.stats.totalRecords,
    totalEdges: index.stats.totalEdges,
    parseErrors: index.stats.parseErrors,
  };

  await execute(
    `UPDATE atlas_user_graph_uploads
        SET status = $3,
            validation_summary_json = $4::jsonb,
            index_json = $5::jsonb,
            updated_at = NOW()
      WHERE user_id = $1 AND id = $2`,
    [
      userId,
      uploadId,
      index.stats.parseErrors > 0 ? "warning" : "ready",
      JSON.stringify(validationSummary),
      JSON.stringify(index),
    ],
  );

  await execute(
    `UPDATE atlas_user_graph_documents
        SET parsed_json = $3::jsonb,
            record_count = $4,
            edge_count = $5
      WHERE upload_id = $1 AND document_order = 0`,
    [uploadId, JSON.stringify(index), index.stats.totalRecords, index.stats.totalEdges],
  );

  const row = await queryRow<UploadRow>(
    `SELECT id, user_id, slug, title, description, source_filename, status, validation_summary_json, index_json, created_at, updated_at
       FROM atlas_user_graph_uploads
      WHERE user_id = $1 AND id = $2`,
    [userId, uploadId],
  );

  if (!row) {
    throw new Error("Failed to reload uploaded graph metadata.");
  }

  return toUpload(row);
}

export async function getUserOverlayIndex(userId: string): Promise<IndexShape | null> {
  if (!isDatabaseConfigured()) {
    const rows = getLocalDevelopmentSqlite()
      .prepare(`
        SELECT index_json
        FROM atlas_user_graph_uploads_local
        WHERE user_id = ? AND status IN ('ready', 'warning')
        ORDER BY created_at ASC
      `)
      .all(userId)
      .map((row) =>
        typeof row.index_json === "string" && row.index_json.length > 0
          ? (JSON.parse(row.index_json) as IndexShape)
          : null,
      )
      .filter((row): row is IndexShape => row !== null);

    if (rows.length === 0) {
      return null;
    }

    return mergeManyIndexes(rows);
  }

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
