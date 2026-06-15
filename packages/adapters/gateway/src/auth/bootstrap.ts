import { createRequire } from 'node:module';

import { hashSecret, verifySecretHash } from './hashing.js';
import type { TokenIssueResult, TokenStore } from './tokens.js';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite') as { DatabaseSync: new (path: string) => any };

export type BootstrapAuthMode = 'manual' | 'local-dev' | 'bootstrap-admin';

export interface BootstrapAuthConfig {
  mode: BootstrapAuthMode;
  adminUsername: string | null;
  adminPassword: string | null;
  tokenSeed: string | null;
  bootstrapTokenName: string;
}

export interface BootstrapAuthState {
  mode: BootstrapAuthMode;
  adminUsername: string;
  passwordHash: string;
  bootstrapTokenName: string;
  bootstrapTokenId: string | null;
  createdAt: number;
  updatedAt: number;
  lastLoginAt: number | null;
}

export interface BootstrapAuthStore {
  get(): Promise<BootstrapAuthState | null>;
  save(input: {
    mode: BootstrapAuthMode;
    adminUsername: string;
    passwordHash: string;
    bootstrapTokenName: string;
    bootstrapTokenId?: string | null;
  }): Promise<BootstrapAuthState>;
  touchLogin(): Promise<void>;
  updateBootstrapToken(tokenId: string | null): Promise<void>;
  close?(): void;
}

function now(): number {
  return Date.now();
}

function normalizeString(value: string | null | undefined): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export class MemoryBootstrapAuthStore implements BootstrapAuthStore {
  private state: BootstrapAuthState | null = null;

  async get(): Promise<BootstrapAuthState | null> {
    return this.state ? { ...this.state } : null;
  }

  async save(input: {
    mode: BootstrapAuthMode;
    adminUsername: string;
    passwordHash: string;
    bootstrapTokenName: string;
    bootstrapTokenId?: string | null;
  }): Promise<BootstrapAuthState> {
    const timestamp = now();
    const existing = this.state;
    this.state = {
      mode: input.mode,
      adminUsername: input.adminUsername,
      passwordHash: input.passwordHash,
      bootstrapTokenName: input.bootstrapTokenName,
      bootstrapTokenId: input.bootstrapTokenId ?? existing?.bootstrapTokenId ?? null,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
      lastLoginAt: existing?.lastLoginAt ?? null,
    };
    return { ...this.state };
  }

  async touchLogin(): Promise<void> {
    if (!this.state) {
      return;
    }
    const timestamp = now();
    this.state.lastLoginAt = timestamp;
    this.state.updatedAt = timestamp;
  }

  async updateBootstrapToken(tokenId: string | null): Promise<void> {
    if (!this.state) {
      return;
    }
    this.state.bootstrapTokenId = tokenId;
    this.state.updatedAt = now();
  }

  close(): void {}
}

export class SqliteBootstrapAuthStore implements BootstrapAuthStore {
  private readonly db: any;

  constructor(dbPath: string) {
    this.db = new DatabaseSync(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS gateway_bootstrap_auth (
        singleton_key TEXT PRIMARY KEY,
        mode TEXT NOT NULL,
        admin_username TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        bootstrap_token_name TEXT NOT NULL,
        bootstrap_token_id TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        last_login_at INTEGER
      );
    `);
  }

  async get(): Promise<BootstrapAuthState | null> {
    const row = this.db.prepare(`
      SELECT mode, admin_username, password_hash, bootstrap_token_name, bootstrap_token_id, created_at, updated_at, last_login_at
      FROM gateway_bootstrap_auth
      WHERE singleton_key = 'bootstrap'
    `).get() as Record<string, unknown> | undefined;
    return row ? this.rowToState(row) : null;
  }

  async save(input: {
    mode: BootstrapAuthMode;
    adminUsername: string;
    passwordHash: string;
    bootstrapTokenName: string;
    bootstrapTokenId?: string | null;
  }): Promise<BootstrapAuthState> {
    const existing = await this.get();
    const timestamp = now();
    this.db.prepare(`
      INSERT INTO gateway_bootstrap_auth (
        singleton_key,
        mode,
        admin_username,
        password_hash,
        bootstrap_token_name,
        bootstrap_token_id,
        created_at,
        updated_at,
        last_login_at
      )
      VALUES ('bootstrap', ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(singleton_key) DO UPDATE SET
        mode = excluded.mode,
        admin_username = excluded.admin_username,
        password_hash = excluded.password_hash,
        bootstrap_token_name = excluded.bootstrap_token_name,
        bootstrap_token_id = excluded.bootstrap_token_id,
        updated_at = excluded.updated_at
    `).run(
      input.mode,
      input.adminUsername,
      input.passwordHash,
      input.bootstrapTokenName,
      input.bootstrapTokenId ?? existing?.bootstrapTokenId ?? null,
      existing?.createdAt ?? timestamp,
      timestamp,
      existing?.lastLoginAt ?? null,
    );
    const state = await this.get();
    if (!state) {
      throw new Error('bootstrap_auth_state_missing');
    }
    return state;
  }

  async touchLogin(): Promise<void> {
    const timestamp = now();
    this.db.prepare(`
      UPDATE gateway_bootstrap_auth
      SET last_login_at = ?, updated_at = ?
      WHERE singleton_key = 'bootstrap'
    `).run(timestamp, timestamp);
  }

  async updateBootstrapToken(tokenId: string | null): Promise<void> {
    this.db.prepare(`
      UPDATE gateway_bootstrap_auth
      SET bootstrap_token_id = ?, updated_at = ?
      WHERE singleton_key = 'bootstrap'
    `).run(tokenId, now());
  }

  close(): void {
    this.db.close();
  }

  private rowToState(row: Record<string, unknown>): BootstrapAuthState {
    return {
      mode: (row['mode'] === 'bootstrap-admin' || row['mode'] === 'local-dev') ? row['mode'] : 'manual',
      adminUsername: String(row['admin_username']),
      passwordHash: String(row['password_hash']),
      bootstrapTokenName: String(row['bootstrap_token_name']),
      bootstrapTokenId: row['bootstrap_token_id'] == null ? null : String(row['bootstrap_token_id']),
      createdAt: Number(row['created_at']),
      updatedAt: Number(row['updated_at']),
      lastLoginAt: row['last_login_at'] == null ? null : Number(row['last_login_at']),
    };
  }
}

export interface BootstrapAuthInitResult {
  enabled: boolean;
  mode: BootstrapAuthMode;
  adminUsername: string | null;
  bootstrapTokenIssued: boolean;
  bootstrapTokenId: string | null;
}

export interface BootstrapLoginInput {
  username: string;
  password: string;
  clientName?: string | null;
  ttlMs?: number | null;
}

export class BootstrapAuthService {
  constructor(
    private readonly config: BootstrapAuthConfig,
    private readonly store: BootstrapAuthStore,
    private readonly tokenStore: TokenStore,
  ) {}

  async initialize(): Promise<BootstrapAuthInitResult> {
    const mode = this.config.mode;
    const adminUsername = normalizeString(this.config.adminUsername);
    const adminPassword = normalizeString(this.config.adminPassword);
    if (mode === 'manual' || !adminUsername || !adminPassword) {
      return {
        enabled: false,
        mode,
        adminUsername,
        bootstrapTokenIssued: false,
        bootstrapTokenId: null,
      };
    }

    const passwordHash = await hashSecret(adminPassword);
    let state = await this.store.save({
      mode,
      adminUsername,
      passwordHash,
      bootstrapTokenName: this.config.bootstrapTokenName,
    });
    let bootstrapTokenIssued = false;

    const tokenSeed = normalizeString(this.config.tokenSeed);
    if (tokenSeed) {
      const existingToken = await this.tokenStore.verify(tokenSeed);
      if (existingToken) {
        await this.store.updateBootstrapToken(existingToken.id);
        state = (await this.store.get()) ?? state;
      } else {
        const issued = await this.tokenStore.create({
          name: this.config.bootstrapTokenName,
          plaintext: tokenSeed,
        });
        bootstrapTokenIssued = true;
        await this.store.updateBootstrapToken(issued.id);
        state = (await this.store.get()) ?? state;
      }
    }

    return {
      enabled: true,
      mode: state.mode,
      adminUsername: state.adminUsername,
      bootstrapTokenIssued,
      bootstrapTokenId: state.bootstrapTokenId,
    };
  }

  async login(input: BootstrapLoginInput): Promise<TokenIssueResult | null> {
    const state = await this.store.get();
    if (!state) {
      return null;
    }

    const username = normalizeString(input.username);
    if (!username || username !== state.adminUsername) {
      return null;
    }
    if (!(await verifySecretHash(state.passwordHash, input.password))) {
      return null;
    }

    await this.store.touchLogin();
    return await this.tokenStore.create({
      name: normalizeString(input.clientName) ?? `${state.adminUsername}-session`,
      ttlMs: typeof input.ttlMs === 'number' ? input.ttlMs : null,
    });
  }

  async describe() {
    const state = await this.store.get();
    return {
      enabled: state !== null,
      mode: state?.mode ?? this.config.mode,
      adminUsername: state?.adminUsername ?? normalizeString(this.config.adminUsername),
      bootstrapTokenId: state?.bootstrapTokenId ?? null,
    };
  }
}
