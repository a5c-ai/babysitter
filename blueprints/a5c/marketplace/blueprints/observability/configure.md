# observability — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `otlpEndpoint` | URL | `http://localhost:4318` | `OTEL_EXPORTER_OTLP_ENDPOINT` |
| `otlpProtocol` | `http/protobuf`, `grpc`, `http/json` | `http/protobuf` | `OTEL_EXPORTER_OTLP_PROTOCOL` |
| `serviceName` | string | `app` | `OTEL_SERVICE_NAME` |
| `tracesSampleRate` | `0.0`–`1.0` | `0.1` prod / `1.0` dev | SDK init |
| `logLevel` | `trace`, `debug`, `info`, `warn`, `error` | `info` | `LOG_LEVEL` |
| `logFormat` | `json`, `pretty` | `json` (prod) | pino/structlog config |
| `sentryDsn` | URL | (none) | `SENTRY_DSN` |
| `sentryTracesRate` | `0.0`–`1.0` | `0.1` | Sentry init |
| `redactKeys` | list of keys | `['password','token','authorization','cookie']` | logger redact |
| `instrumentations` | list | `auto` | OTel SDK |
| `resourceAttrs` | key=value map | `{service.name,service.version}` | OTel Resource |

## 2. Change OTLP Backend

Swap Collector/Jaeger/Datadog/Honeycomb by changing env:

```bash
# Honeycomb
export OTEL_EXPORTER_OTLP_ENDPOINT="https://api.honeycomb.io"
export OTEL_EXPORTER_OTLP_HEADERS="x-honeycomb-team=$HONEYCOMB_API_KEY"

# Grafana Cloud
export OTEL_EXPORTER_OTLP_ENDPOINT="https://otlp-gateway-prod.grafana.net/otlp"
export OTEL_EXPORTER_OTLP_HEADERS="Authorization=Basic $GRAFANA_TOKEN"
```

## 3. Tune Sampling

Edit `src/telemetry.ts`:

```typescript
import { TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-node';

const sdk = new NodeSDK({
  sampler: new TraceIdRatioBasedSampler(
    Number(process.env.OTEL_TRACES_SAMPLE_RATE || '0.1')
  ),
  // ...
});
```

Head-based parent-aware sampling:

```typescript
import { ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-node';

sampler: new ParentBasedSampler({
  root: new TraceIdRatioBasedSampler(0.1),
}),
```

## 4. Add Custom Span Attributes

```typescript
import { trace } from '@opentelemetry/api';
const tracer = trace.getTracer('app');

await tracer.startActiveSpan('checkout', async (span) => {
  span.setAttribute('user.id', userId);
  span.setAttribute('cart.size', cart.length);
  try {
    return await processCheckout();
  } finally {
    span.end();
  }
});
```

## 5. Correlate Logs with Traces

### Node — pino with trace context

```typescript
import { context, trace } from '@opentelemetry/api';

export const logger = pino({
  mixin() {
    const span = trace.getSpan(context.active());
    if (!span) return {};
    const { traceId, spanId } = span.spanContext();
    return { traceId, spanId };
  },
});
```

### Python — structlog

```python
from opentelemetry.trace import get_current_span

def add_trace_context(_, __, event_dict):
    span = get_current_span()
    ctx = span.get_span_context()
    if ctx.is_valid:
        event_dict["trace_id"] = format(ctx.trace_id, "032x")
        event_dict["span_id"] = format(ctx.span_id, "016x")
    return event_dict
```

## 6. Adjust Redaction

```typescript
const logger = pino({
  redact: {
    paths: ['req.headers.authorization', '*.password', '*.apiKey', '*.ssn'],
    censor: '[REDACTED]',
  },
});
```

## 7. Enable / Disable Instrumentations

```typescript
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

instrumentations: [
  getNodeAutoInstrumentations({
    '@opentelemetry/instrumentation-fs': { enabled: false },  // noisy
    '@opentelemetry/instrumentation-http': {
      ignoreIncomingRequestHook: (req) => req.url === '/healthz',
    },
  }),
],
```

## 8. Configure Release Tracking

Tag traces and errors with git SHA:

```bash
export APP_VERSION="$(git rev-parse --short HEAD)"
```

Sentry picks this up via `release`; OTel picks it up via `service.version`.

## 9. Run Observability Audit

```bash
babysitter run:create \
  --process-id observability-audit \
  --entry .a5c/processes/observability/audit.js#process \
  --prompt "Audit tracing coverage — find HTTP handlers without spans and DB calls without instrumentation" \
  --json
```

## 10. Local Dev Collector

Spin up an OTel Collector locally for fast feedback:

```yaml
# docker-compose.otel.yml
services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    ports:
      - "4317:4317"
      - "4318:4318"
    volumes:
      - ./otel-collector-config.yaml:/etc/otelcol-contrib/config.yaml
```

Run `docker compose -f docker-compose.otel.yml up` to see traces locally.
