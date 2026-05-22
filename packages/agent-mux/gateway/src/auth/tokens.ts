import * as os from 'node:os';
import * as path from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';

import { hashToken, verifyTokenHash } from './hashing.js';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (path: string) => any };

export interface TokenRecord {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  lastUsedAt: number | null;
  expiresAt: number | null;
  revokedAt: number | null;
}

export interface TokenIssueResult {
  id: string;
  plaintext: string;
  record: TokenRecord;
}

export interface TokenCreateInput {
  name: string;
  ttlMs?: number | null;
  plaintext?: string | null;
}

export interface TokenStore {
  create(input: TokenCreateInput): Promise<TokenIssueResult>;
  verify(plaintext: string): Promise<TokenRecord | null>;
  revoke(id: string): Promise<boolean>;
  list(): Promise<TokenRecord[]>;
  touch(id: string): Promise<boolean>;
}

interface StoredTokenRecord extends TokenRecord {
  hash: string;
}

function defaultSqlitePath(): string {
  return path.join(os.homedir(), '.amux', 'gateway', 'tokens.db');
}

function now(): number {
  return Date.now();
}

function issuePlaintextToken(): string {
  return randomBytes(32).toString('base64url');
}

function toPublicRecord(record: StoredTokenRecord): TokenRecord {
  const { hash: _hash, ...publicRecord } = record;
  return publicRecord;
}

function isUsable(record: StoredTokenRecord, currentTime: number): boolean {
  if (record.revokedAt !== null) return false;
  if (record.expiresAt !== null && record.expiresAt <= currentTime) return false;
  return true;
}

export class MemoryTokenStore implements TokenStore {
  private readonly records = new Map<string, StoredTokenRecord>();

  async create(input: TokenCreateInput): Promise<TokenIssueResult> {
    const plaintext = input.plaintext && input.plaintext.trim().length > 0
      ? input.plaintext
      : issuePlaintextToken();
    const createdAt = now();
    const record: StoredTokenRecord = {
      id: randomUUID(),
      name: input.name,
      hash: await hashToken(plaintext),
      createdAt,
      updatedAt: createdAt,
      lastUsedAt: null,
      expiresAt: input.ttlMs ? createdAt + input.ttlMs : null,
      revokedAt: null,
    };
    this.records.set(record.id, record);
    return {
      id: record.id,
      plaintext,
      record: toPublicRecord(record),
    };
  }

  async verify(plaintext: string): Promise<TokenRecord | null> {
    const currentTime = now();
    for (const record of this.records.values()) {
      if (!isUsable(record, currentTime)) continue;
      if (await verifyTokenHash(record.hash, plaintext)) {
        return toPublicRecord(record);
      }
    }
    return null;
  }

  async revoke(id: string): Promise<boolean> {
    const record = this.records.get(id);
    if (!record || record.revokedAt !== null) return false;
    record.revokedAt = now();
    record.updatedAt = record.revokedAt;
    return true;
  }

  async list(): Promise<TokenRecord[]> {
    return Array.from(this.records.values()).map(toPublicRecord);
  }

  async touch(id: string): Promise<boolean> {
    const record = this.records.get(id);
    if (!record) return false;
    record.lastUsedAt = now();
    record.updatedAt = record.lastUsedAt;
    return true;
  }
}

export class SqliteTokenStore implements TokenStore {
  private readonly db: any;

  constructor(dbPath: string = defaultSqlitePath()) {
    mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new DatabaseSync(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS gateway_tokens (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        hash TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        last_used_at INTEGER,
        expires_at INTEGER,
        revoked_at INTEGER
      );
    `);
  }

  async create(input: TokenCreateInput): Promise<TokenIssueResult> {
    const plaintext = input.plaintext && input.plaintext.trim().length > 0
      ? input.plaintext
      : issuePlaintextToken();
    const createdAt = now();
    const record: StoredTokenRecord = {
      id: randomUUID(),
      name: input.name,
      hash: await hashToken(plaintext),
      createdAt,
      updatedAt: createdAt,
      lastUsedAt: null,
      expiresAt: input.ttlMs ? createdAt + input.ttlMs : null,
      revokedAt: null,
    };
    this.db.prepare(`
      INSERT INTO gateway_tokens (id, name, hash, created_at, updated_at, last_used_at, expires_at, revoked_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      record.id,
      record.name,
      record.hash,
      record.createdAt,
      record.updatedAt,
      record.lastUsedAt,
      record.expiresAt,
      record.revokedAt,
    );
    return {
      id: record.id,
      plaintext,
      record: toPublicRecord(record),
    };
  }

  async verify(plaintext: string): Promise<TokenRecord | null> {
    const rows = this.db.prepare(`
      SELECT id, name, hash, created_at, updated_at, last_used_at, expires_at, revoked_at
      FROM gateway_tokens
      ORDER BY created_at DESC
    `).all() as Array<Record<string, unknown>>;
    const currentTime = now();
    for (const row of rows) {
      const record = this.rowToRecord(row);
      if (!isUsable(record, currentTime)) continue;
      if (await verifyTokenHash(record.hash, plaintext)) {
        return toPublicRecord(record);
      }
    }
    return null;
  }

  async revoke(id: string): Promise<boolean> {
    const updatedAt = now();
    const result = this.db.prepare(`
      UPDATE gateway_tokens
      SET revoked_at = ?, updated_at = ?
      WHERE id = ? AND revoked_at IS NULL
    `).run(updatedAt, updatedAt, id);
    return result.changes > 0;
  }

  async list(): Promise<TokenRecord[]> {
    const rows = this.db.prepare(`
      SELECT id, name, hash, created_at, updated_at, last_used_at, expires_at, revoked_at
      FROM gateway_tokens
      ORDER BY created_at DESC
    `).all() as Array<Record<string, unknown>>;
    return rows.map((row) => toPublicRecord(this.rowToRecord(row)));
  }

  async touch(id: string): Promise<boolean> {
    const updatedAt = now();
    const result = this.db.prepare(`
      UPDATE gateway_tokens
      SET last_used_at = ?, updated_at = ?
      WHERE id = ?
    `).run(updatedAt, updatedAt, id);
    return result.changes > 0;
  }

  close(): void {
    this.db.close();
  }

  private rowToRecord(row: Record<string, unknown>): StoredTokenRecord {
    return {
      id: String(row['id']),
      name: String(row['name']),
      hash: String(row['hash']),
      createdAt: Number(row['created_at']),
      updatedAt: Number(row['updated_at']),
      lastUsedAt: row['last_used_at'] == null ? null : Number(row['last_used_at']),
      expiresAt: row['expires_at'] == null ? null : Number(row['expires_at']),
      revokedAt: row['revoked_at'] == null ? null : Number(row['revoked_at']),
    };
  }
}
