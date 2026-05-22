# observability — Install Instructions

Set up observability feedback loops — OpenTelemetry SDK wiring (traces + metrics + logs), structured logging (pino / winston / structlog), error reporting (Sentry or Datadog), and log-format lint to prevent regressions to unstructured `console.log`-style output.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:

1. Read `package.json`, `pyproject.toml`, `go.mod` to identify language(s)
2. Detect runtime stack:
   - Node (Express / Fastify / NestJS / Koa)
   - Python (FastAPI / Django / Flask / Celery)
   - Go (net/http / gin / echo / chi)
3. Check existing logging: `pino`, `winston`, `bunyan`, `structlog`, `loguru`, `zap`, `logrus`, `zerolog`
4. Check existing tracing: `@opentelemetry/*`, `opentelemetry-api`, `go.opentelemetry.io/otel`
5. Check existing error reporting: `@sentry/*`, `datadog`, `newrelic`, `elastic-apm-node`
6. Check deployment target (k8s, Lambda, Vercel, Fly, Render) — affects exporter config
7. Summarize findings to the user

### Stage 2: Observability Layers

Ask the user which layers to install (multi-select):

1. **OpenTelemetry SDK** — Traces + metrics (+ logs bridge) with OTLP exporter
2. **Structured logging** — pino/winston/structlog with JSON output + request correlation
3. **Error reporting** — Sentry or Datadog APM init + release tracking
4. **Log format lint** — Detect unstructured `console.log` / `print` in source
5. **All** — Install every applicable layer

### Stage 3: Tool Selection

Confirm:

| Stack | Logger | Tracing | Error Reporting |
|-------|--------|---------|-----------------|
| Node | `pino` (recommended) or `winston` | `@opentelemetry/sdk-node` | `@sentry/node` or `dd-trace` |
| Python | `structlog` (recommended) or `loguru` | `opentelemetry-sdk` | `sentry-sdk` or `ddtrace` |
| Go | `zap` or `slog` (stdlib) | `go.opentelemetry.io/otel` | `sentry-go` or `dd-trace-go` |

### Stage 4: Destination

Ask:
- Observability backend? (Jaeger, Tempo, Honeycomb, Datadog, New Relic, Grafana Cloud, Sentry, self-hosted Collector)
- OTLP endpoint URL? (default: `http://localhost:4318` — OTel Collector)
- Sampling rate? (default: `0.1` for prod, `1.0` for dev)

## Step 2: Install OpenTelemetry SDK

### Node

```bash
npm install @opentelemetry/api \
  @opentelemetry/sdk-node \
  @opentelemetry/auto-instrumentations-node \
  @opentelemetry/exporter-trace-otlp-http \
  @opentelemetry/exporter-metrics-otlp-http
```

Create `src/telemetry.ts`:

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'app',
    [ATTR_SERVICE_VERSION]: process.env.APP_VERSION || '0.0.0',
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
process.on('SIGTERM', () => sdk.shutdown());
```

Preload before app entry:

```json
{ "scripts": { "start": "node --require ./dist/telemetry.js dist/index.js" } }
```

### Python

```bash
pip install opentelemetry-api opentelemetry-sdk \
  opentelemetry-instrumentation \
  opentelemetry-exporter-otlp-proto-http \
  opentelemetry-distro
opentelemetry-bootstrap -a install
```

Create `app/telemetry.py`:

```python
from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

provider = TracerProvider(resource=Resource.create({"service.name": "app"}))
provider.add_span_processor(BatchSpanProcessor(OTLPSpanExporter()))
trace.set_tracer_provider(provider)
```

Run with auto-instrumentation: `opentelemetry-instrument python -m app`.

### Go

```bash
go get go.opentelemetry.io/otel \
  go.opentelemetry.io/otel/sdk \
  go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracehttp
```

```go
// telemetry.go
func initTracer(ctx context.Context) (*sdktrace.TracerProvider, error) {
    exp, err := otlptracehttp.New(ctx)
    if err != nil { return nil, err }
    tp := sdktrace.NewTracerProvider(
        sdktrace.WithBatcher(exp),
        sdktrace.WithResource(resource.NewWithAttributes(
            semconv.SchemaURL,
            semconv.ServiceName("app"),
        )),
    )
    otel.SetTracerProvider(tp)
    return tp, nil
}
```

## Step 3: Install Structured Logging

### Node — pino

```bash
npm install pino pino-pretty
```

`src/logger.ts`:

```typescript
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password'],
});
```

### Python — structlog

```bash
pip install structlog
```

```python
import structlog

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(20),
)
log = structlog.get_logger()
```

### Go — slog (stdlib)

```go
logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
slog.SetDefault(logger)
```

## Step 4: Install Error Reporting

### Sentry (Node)

```bash
npm install @sentry/node
```

```typescript
import * as Sentry from '@sentry/node';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: Number(process.env.SENTRY_TRACES_RATE || '0.1'),
  release: process.env.APP_VERSION,
  environment: process.env.NODE_ENV,
});
```

### Sentry (Python)

```bash
pip install "sentry-sdk[fastapi]"
```

```python
import sentry_sdk
sentry_sdk.init(
    dsn=os.environ["SENTRY_DSN"],
    traces_sample_rate=0.1,
    release=os.environ.get("APP_VERSION"),
)
```

### Datadog (Node)

```bash
npm install dd-trace
```

Preload: `node --require dd-trace/init dist/index.js`.

## Step 5: Add Log Format Lint

### Node — no-console rule

Edit `eslint.config.mjs`:

```javascript
export default [
  {
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
];
```

Custom rule to require structured logging:

```javascript
{
  files: ['src/**/*.ts'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        selector: "CallExpression[callee.object.name='console']",
        message: 'Use the structured logger (logger.info/warn/error) instead of console',
      },
    ],
  },
},
```

### Python — flake8-print / ruff

Add to `pyproject.toml`:

```toml
[tool.ruff.lint]
select = ["T20"]  # flake8-print (T201 = print, T203 = pprint)
```

### Go — no-print via custom linter

Use `gocritic` or a repo-level `go vet` rule. Minimum, forbid `fmt.Println` in production code via a linting config.

## Step 6: Add Pre-commit Hook

```bash
npm install -D husky lint-staged
npx husky init
```

```json
{
  "lint-staged": {
    "*.{ts,js}": ["eslint --fix --max-warnings=0"],
    "*.py": ["ruff check --fix"]
  }
}
```

## Step 7: Create GitHub Actions Workflow

Create `.github/workflows/observability.yml`:

```yaml
name: Observability

on:
  pull_request:
  push:
    branches: [main]

jobs:
  log-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - run: npm run lint
      - name: Check for console.log regressions
        run: |
          ! git diff origin/main...HEAD -- '*.ts' '*.js' | grep -E '^\+.*console\.(log|debug|info)' || \
            (echo "::error::New console.* detected — use structured logger" && exit 1)
```

## Step 8: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name observability --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 9: Verify Setup

1. App emits structured JSON logs on stdout
2. OTLP traces reach the configured endpoint (check backend)
3. Error reporting captures a test exception
4. Lint blocks new `console.log` / `print` additions
5. Workflow is committed at `.github/workflows/observability.yml`

## Reference

- OpenTelemetry JS: https://opentelemetry.io/docs/languages/js/
- OpenTelemetry Python: https://opentelemetry.io/docs/languages/python/
- pino: https://getpino.io/
- structlog: https://www.structlog.org/
- Sentry: https://docs.sentry.io/
