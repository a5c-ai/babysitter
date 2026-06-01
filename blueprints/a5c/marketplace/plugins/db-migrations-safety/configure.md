# db-migrations-safety — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `linter` | `squawk`, `atlas`, `both` | `squawk` | workflow jobs |
| `pgVersion` | `12`..`17` | `16.0` | `.squawk.toml` `pg_version` |
| `severity` | `error`, `warning`, `info` | `error` | squawk rule levels |
| `requireConcurrentIndex` | `on`, `off` | `on` | squawk rule |
| `banDropColumn` | `on`, `off` | `on` | squawk rule |
| `banDropTable` | `on`, `off` | `on` | squawk rule |
| `banChangingColumnType` | `on`, `off` | `on` | squawk rule |
| `lockTimeout` | duration | `5s` | template `SET LOCAL lock_timeout` |
| `statementTimeout` | duration | `30s` | template `SET LOCAL statement_timeout` |
| `shadowDbMode` | `empty`, `schema-dump`, `anon-prod` | `empty` | `scripts/migrate-shadow.sh` |
| `requireDownMigration` | `on`, `off` | `off` | PR checklist |
| `destructiveOverrideLabel` | label name | `allow-destructive` | workflow conditional |

## 2. Relax Noisy Rules

Edit `.squawk.toml`:

```toml
excluded_rules = [
  "prefer-text-field",           # VARCHAR(n) is acceptable in this codebase
  "prefer-big-int",
]
```

## 3. Per-File Ignore (inline)

Add at the top of a migration file:

```sql
-- squawk-disable ban-drop-column
-- This is an intentional cleanup of deprecated column X, see JIRA-1234
ALTER TABLE users DROP COLUMN legacy_field;
```

## 4. Switch to atlas-only

Remove the `squawk` job from `.github/workflows/db-migrations.yml` and keep `atlas-lint` + `shadow-apply`. Configure atlas lint rules in `atlas.hcl`:

```hcl
lint {
  destructive { error = true }
  data_depend { error = true }
  incompatible { error = true }
  naming {
    match = "^[a-z][a-z0-9_]+$"
    message = "snake_case table/column names required"
  }
}
```

## 5. Shadow DB from Schema Dump

Edit `scripts/migrate-shadow.sh` to seed schema from a prod dump before applying new migrations:

```bash
docker exec -i "$CONTAINER" psql -U postgres < schema-dump.sql
# Then run the migration tool as before
```

Store the dump via `pg_dump --schema-only` in CI.

## 6. Require Destructive-DDL Override Label

Edit `.github/workflows/db-migrations.yml`:

```yaml
- name: Block destructive DDL without label
  if: contains(github.event.pull_request.labels.*.name, 'allow-destructive') == false
  run: squawk migrations/*.sql --error-on-rule ban-drop-column,ban-drop-table
```

## 7. Match Production Postgres Version

Edit `.squawk.toml`:

```toml
pg_version = "17.2"
```

Edit workflow service:

```yaml
postgres:
  image: postgres:17-alpine
```

## 8. Support MySQL Migrations

squawk is Postgres-only. For MySQL use atlas:

```hcl
env "mysql" {
  src = "file://schema.hcl"
  url = "mysql://root:root@localhost:3306/app"
  dev = "docker://mysql/8/dev"
  migration { dir = "file://migrations" }
  lint {
    destructive { error = true }
  }
}
```

## 9. Online Schema-Change Integration

For very large tables, delegate to `pt-online-schema-change` (MySQL) or `pg_repack` (Postgres). Add a check that DDL on tables over N rows must go via the tool:

```bash
# In scripts/migrate-shadow.sh, after atlas migrate diff
atlas migrate lint --latest 1 --format '{{ .Files }}' | \
  grep -E 'ALTER TABLE (large_|huge_)' && \
  { echo "Use pt-online-schema-change for large tables"; exit 1; }
```

## 10. Auto-Fix Baseline Migrations

```bash
babysitter run:create \
  --process-id db-migrations-audit \
  --entry .a5c/processes/db-migrations-safety/audit.js#process \
  --prompt "Audit all pending migrations, rewrite unsafe DDL into multi-step safe sequences" \
  --json
```

## 11. Disable Shadow Apply for Fast Iteration

Set `shadow-apply` job to `if: false` during a spike, and re-enable before merging to `main`. Do **not** disable the linter.
