# observability — Uninstall Instructions

## Step 1: Interview the User

Ask what to remove:

1. **Processes and configs only** — Remove babysitter observability processes but keep SDK wiring, logger, and error reporting
2. **Everything** — Remove all SDKs, loggers, lint rules, workflow, and processes
3. **Selective** — Let the user choose which layers to remove

**Warning**: Removing tracing or error reporting will silently drop production visibility. Confirm with the user.

## Step 2: Remove OpenTelemetry SDK

### Node

```bash
npm uninstall @opentelemetry/api @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/exporter-metrics-otlp-http
rm -f src/telemetry.ts
```

Remove `--require ./dist/telemetry.js` from start script.

### Python

```bash
pip uninstall opentelemetry-api opentelemetry-sdk \
  opentelemetry-exporter-otlp-proto-http opentelemetry-distro
rm -f app/telemetry.py
```

### Go

```bash
go mod tidy  # after deleting imports
rm -f telemetry.go
```

## Step 3: Remove Structured Logger

Only if installed solely by this plugin — check with the user first.

```bash
# Node
npm uninstall pino pino-pretty
rm -f src/logger.ts

# Python
pip uninstall structlog
```

## Step 4: Remove Error Reporting

```bash
# Sentry Node
npm uninstall @sentry/node

# Sentry Python
pip uninstall sentry-sdk

# Datadog
npm uninstall dd-trace
```

Remove init calls from app entrypoints.

## Step 5: Remove Log Format Lint

Edit `eslint.config.mjs` and remove `no-console` / `no-restricted-syntax` rules added by this plugin.

Edit `pyproject.toml` and remove `T20` from `[tool.ruff.lint]` select list.

## Step 6: Remove Pre-commit Hook

Edit `package.json` and remove `lint-staged` globs. Do not uninstall husky unless it was installed solely for this plugin.

## Step 7: Remove GitHub Actions Workflow

```bash
rm -f .github/workflows/observability.yml
```

## Step 8: Remove Processes

```bash
rm -rf .a5c/processes/observability
```

## Step 9: Remove from Registry

```bash
babysitter plugin:remove-from-registry --plugin-name observability --project --json
```

## Notes

- Backend data (traces, logs, errors already exported) is not removed from Sentry/Datadog/etc. — rotate per retention policy
- Environment variables (`OTEL_*`, `SENTRY_DSN`) remain in `.env` / secrets — remove manually if desired
