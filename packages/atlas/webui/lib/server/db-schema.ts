export const ATLAS_WEBUI_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  oauth_token_secret TEXT,
  oauth_token TEXT,
  PRIMARY KEY (provider, "providerAccountId")
);

CREATE TABLE IF NOT EXISTS sessions (
  "sessionToken" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_token (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions("userId");
CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts("userId");

CREATE TABLE IF NOT EXISTS atlas_user_graph_uploads (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  source_filename TEXT NOT NULL,
  status TEXT NOT NULL,
  validation_summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  index_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS atlas_user_graph_uploads_user_slug_idx
  ON atlas_user_graph_uploads(user_id, slug);

CREATE INDEX IF NOT EXISTS atlas_user_graph_uploads_user_idx
  ON atlas_user_graph_uploads(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS atlas_user_graph_documents (
  id UUID PRIMARY KEY,
  upload_id UUID NOT NULL REFERENCES atlas_user_graph_uploads(id) ON DELETE CASCADE,
  document_order INTEGER NOT NULL DEFAULT 0,
  raw_yaml TEXT NOT NULL,
  parsed_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  record_count INTEGER NOT NULL DEFAULT 0,
  edge_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS atlas_user_graph_documents_upload_idx
  ON atlas_user_graph_documents(upload_id, document_order);

CREATE TABLE IF NOT EXISTS atlas_company_blueprints (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  draft_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_export_yaml TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS atlas_company_blueprints_user_slug_idx
  ON atlas_company_blueprints(user_id, slug);

CREATE TABLE IF NOT EXISTS atlas_company_blueprint_exports (
  id UUID PRIMARY KEY,
  blueprint_id UUID NOT NULL REFERENCES atlas_company_blueprints(id) ON DELETE CASCADE,
  export_format TEXT NOT NULL,
  payload TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS atlas_company_blueprint_exports_blueprint_idx
  ON atlas_company_blueprint_exports(blueprint_id, created_at DESC);
`;
