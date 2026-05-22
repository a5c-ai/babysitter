# db-migrations-safety — Install Instructions

Guard your database migrations with static analysis (squawk for Postgres, atlas-schema for multi-DB), a shadow-database apply check, a PR review checklist, and a CI workflow that blocks dangerous DDL before it reaches production.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:
1. Detect database stack:
   - Postgres: `pg`, `psycopg`, `asyncpg`, `postgres://` in config
   - MySQL / MariaDB: `mysql2`, `pymysql`
   - SQLite: `better-sqlite3`, `sqlite3`
   - SQL Server: `mssql`, `pyodbc`
2. Detect migration tool:
   - Node: `knex`, `drizzle-kit`, `prisma`, `typeorm`, `sequelize-cli`, `@mikro-orm/cli`
   - Python: `alembic`, `django migrations`, `yoyo-migrations`
   - Go: `goose`, `migrate`, `atlas`
   - Ruby: `activerecord` migrations
3. Check for existing safety tools: `squawk`, `atlas`, `pt-online-schema-change`, `gh-ost`
4. Locate migration files directory (`migrations/`, `db/migrate/`, `alembic/versions/`, `prisma/migrations/`)
5. Check for existing CI/CD
6. Summarize findings to the user

### Stage 2: Safety Tool Selection

Ask which tools to wire up (multi-select):

1. **squawk** — Postgres linter for dangerous DDL (`ALTER TABLE ... ADD COLUMN NOT NULL`, etc.)
2. **atlas** — Multi-DB schema diff + migration planning + lint rules
3. **Shadow DB apply** — Spin up a throwaway DB and apply migrations to verify they run clean
4. **PR checklist** — Template enforced via GitHub PR template
5. **All** — Install every layer applicable to the stack

### Stage 3: Risk Thresholds

Ask:
- Block PRs on rule severities: `error` (default) / `warning` / `info`
- Require manual override for destructive DDL (`DROP COLUMN`, `DROP TABLE`)? (default: yes)
- Require down-migration for every up-migration? (default: no for production DBs)
- Lock DDL timeout to: `5s` (default) to prevent table-lock production incidents

### Stage 4: Shadow DB Strategy

Ask:
- Shadow source: empty DB (default) / schema-only dump from prod / anonymized prod dump
- Container runtime: Docker (default) / docker-compose service / GitHub Actions service container
- Postgres version to match prod: auto-detect from `DATABASE_URL` / user-specified

## Step 2: Install squawk (Postgres)

```bash
# macOS
brew install squawk
# Linux
curl -L https://github.com/sbdchd/squawk/releases/latest/download/squawk-linux-x86_64 -o /usr/local/bin/squawk && chmod +x /usr/local/bin/squawk
# Node wrapper (cross-platform)
npm install -D squawk-cli
```

Create `.squawk.toml`:

```toml
excluded_rules = []
pg_version = "16.0"
assume_in_transaction = true

[[rules]]
name = "require-concurrent-index-creation"
# Error on CREATE INDEX without CONCURRENTLY

[[rules]]
name = "ban-drop-column"

[[rules]]
name = "changing-column-type"

[[rules]]
name = "adding-not-nullable-field"
# NOT NULL without a default rewrites the whole table

[[rules]]
name = "disallowed-unique-constraint"
```

Add to `package.json`:

```json
{ "scripts": { "migrate:lint": "squawk migrations/*.sql" } }
```

## Step 3: Install atlas (Multi-DB)

```bash
# macOS
brew install ariga/tap/atlas
# Linux / Windows
curl -sSf https://atlasgo.sh | sh
```

Create `atlas.hcl`:

```hcl
env "local" {
  src = "file://schema.hcl"
  url = "postgres://postgres:postgres@localhost:5432/app?sslmode=disable"
  dev = "docker://postgres/16/dev"
  migration {
    dir = "file://migrations"
    format = atlas
  }
  lint {
    destructive {
      error = true
    }
    data_depend {
      error = true
    }
    incompatible {
      error = true
    }
  }
}
```

Commands:

```bash
atlas migrate lint --env local --latest 1
atlas migrate diff --env local
atlas migrate apply --env local --dry-run
```

## Step 4: Install Shadow DB Apply Script

Create `scripts/migrate-shadow.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

CONTAINER=migrate-shadow-$$
IMAGE=postgres:16-alpine

docker run --rm -d --name "$CONTAINER" \
  -e POSTGRES_PASSWORD=shadow \
  -p 54329:5432 \
  "$IMAGE"

trap 'docker stop "$CONTAINER" >/dev/null' EXIT

# Wait for ready
for i in {1..30}; do
  docker exec "$CONTAINER" pg_isready -U postgres && break
  sleep 1
done

export DATABASE_URL="postgres://postgres:shadow@localhost:54329/postgres"

# Run migrations using the project's tool
if [ -f package.json ] && grep -q '"knex"' package.json; then
  npx knex migrate:latest
elif [ -f alembic.ini ]; then
  alembic upgrade head
elif command -v atlas >/dev/null; then
  atlas migrate apply --url "$DATABASE_URL" --dir file://migrations
else
  echo "Unknown migration tool — edit scripts/migrate-shadow.sh" >&2
  exit 2
fi

echo "Shadow DB apply: OK"
```

```bash
chmod +x scripts/migrate-shadow.sh
```

## Step 5: Create PR Template

Create `.github/pull_request_template.md` (or append a section):

```markdown
### Migration Safety Checklist

- [ ] New indexes use `CONCURRENTLY` (Postgres)
- [ ] New `NOT NULL` columns have a default or are added in a multi-step deploy
- [ ] No `DROP COLUMN` / `DROP TABLE` without a deprecation window
- [ ] Column type changes are backward-compatible
- [ ] `statement_timeout` is acceptable for the largest affected table
- [ ] Migration tested against a production-sized shadow DB
- [ ] Rollback plan documented in PR description
```

## Step 6: Create GitHub Actions Workflow

Create `.github/workflows/db-migrations.yml`:

```yaml
name: DB Migrations Safety
on:
  pull_request:
    paths:
      - 'migrations/**'
      - 'db/migrate/**'
      - 'alembic/versions/**'
      - 'prisma/migrations/**'
jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - name: Install squawk
        run: |
          curl -L https://github.com/sbdchd/squawk/releases/latest/download/squawk-linux-x86_64 -o /usr/local/bin/squawk
          chmod +x /usr/local/bin/squawk
      - name: Lint SQL migrations
        run: squawk migrations/*.sql

  atlas-lint:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: atlas
        ports: ['5432:5432']
        options: >-
          --health-cmd pg_isready --health-interval 10s
          --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v6
        with: { fetch-depth: 0 }
      - uses: ariga/setup-atlas@v0
      - run: atlas migrate lint --env local --git-base=origin/${{ github.base_ref }}

  shadow-apply:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: shadow
        ports: ['54329:5432']
        options: >-
          --health-cmd pg_isready --health-interval 10s
          --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - name: Apply to shadow
        env:
          DATABASE_URL: postgres://postgres:shadow@localhost:54329/postgres
        run: ./scripts/migrate-shadow.sh
```

## Step 7: Add Pre-commit Hook

For Node:

```json
{
  "lint-staged": {
    "migrations/*.sql": ["squawk"]
  }
}
```

For Python:

```yaml
repos:
  - repo: local
    hooks:
      - id: squawk
        name: squawk migration lint
        entry: squawk
        language: system
        files: ^migrations/.*\.sql$
```

## Step 8: Seed a Safe-Migration Template

Create `migrations/_TEMPLATE.sql`:

```sql
-- Safe migration template
-- 1. Add new column as nullable
-- 2. Backfill in a separate deploy
-- 3. Add NOT NULL + default in a third deploy

BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

-- Your DDL here
-- ALTER TABLE ...

COMMIT;
```

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name db-migrations-safety --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify Setup

1. `squawk migrations/*.sql` runs on existing migrations without unexpected errors
2. Atlas shadow container starts and applies current schema cleanly
3. Workflow fires on a PR that modifies `migrations/`
4. PR template appears on new PRs
5. `scripts/migrate-shadow.sh` works locally with Docker running

## Reference

- squawk: https://github.com/sbdchd/squawk
- atlas: https://atlasgo.io/
- Strong Migrations (Rails equivalent): https://github.com/ankane/strong_migrations
- Postgres safe migrations guide: https://www.postgresql.org/docs/current/mvcc.html
