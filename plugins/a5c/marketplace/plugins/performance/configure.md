# performance — Configuration

## 1. Configuration Options Table

| Option | Values | Default | Where |
|--------|--------|---------|-------|
| `bundleMaxSize` | size string (e.g. `200 KB`) | `200 KB` | `package.json` `size-limit` |
| `bundleCompression` | `gzip`, `brotli`, `none` | `gzip` | size-limit / bundlesize |
| `lighthouseMinScore` | `0.0`–`1.0` | `0.85` | `lighthouserc.json` |
| `lcpBudgetMs` | integer (ms) | `2500` | lighthouserc assertions |
| `tbtBudgetMs` | integer (ms) | `300` | lighthouserc assertions |
| `clsBudget` | float | `0.1` | lighthouserc assertions |
| `p95LatencyMs` | integer (ms) | `300` | k6 / artillery thresholds |
| `p99LatencyMs` | integer (ms) | `800` | k6 thresholds |
| `maxErrorRate` | float (0–1) | `0.01` | k6 `http_req_failed` |
| `loadVus` | integer | `50` | k6 `stages[].target` |
| `loadDuration` | duration string | `2m` | k6 stage durations |
| `ciGate` | `off`, `warn`, `error` | `error` | workflow `continue-on-error` |
| `regressionDelta` | percentage | `10%` | size-limit-action comment |

## 2. Adjust Bundle Budget

Edit `package.json`:

```json
{
  "size-limit": [
    { "name": "main", "path": "dist/index-*.js", "limit": "250 KB" },
    { "name": "vendor", "path": "dist/vendor-*.js", "limit": "180 KB", "gzip": true }
  ]
}
```

## 3. Adjust Lighthouse Budgets

Edit `lighthouserc.json`:

```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.9 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2000 }]
      }
    }
  }
}
```

Downgrade from `error` to `warn` to avoid blocking PRs while improving.

## 4. Tune Load Test Stages

Edit `perf/load/smoke.js`:

```javascript
export const options = {
  stages: [
    { duration: '1m', target: 100 },   // ramp
    { duration: '5m', target: 100 },   // sustained
    { duration: '30s', target: 0 },    // cooldown
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.005'],
  },
};
```

## 5. Per-Endpoint Latency Budgets

Use tagged metrics in k6:

```javascript
http.get(`${base}/api/users`, { tags: { name: 'GetUsers' } });

export const options = {
  thresholds: {
    'http_req_duration{name:GetUsers}': ['p(95)<150'],
    'http_req_duration{name:CreateOrder}': ['p(95)<400'],
  },
};
```

## 6. Change CI Gate Behavior

Edit `.github/workflows/performance.yml`:

```yaml
bundle-size:
  continue-on-error: true  # warn-only
```

For hard gate, remove `continue-on-error` and mark the job required in branch protection.

## 7. Exclude Files from Bundle Measurement

```json
{
  "size-limit": [
    { "path": ["dist/**/*.js", "!dist/**/*.test.js"], "limit": "200 KB" }
  ]
}
```

## 8. Add Additional Pages to Lighthouse

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/pricing",
        "http://localhost:3000/docs"
      ]
    }
  }
}
```

## 9. Run Performance Fix Process

```bash
babysitter run:create \
  --process-id perf-baseline-fix \
  --entry .a5c/processes/performance/fix-baseline.js#process \
  --prompt "Investigate LCP regression on /pricing and reduce main bundle by 15%" \
  --json
```

## 10. Schedule Nightly Deep Load Tests

Create `.github/workflows/perf-nightly.yml`:

```yaml
on:
  schedule:
    - cron: '0 2 * * *'
jobs:
  soak:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: grafana/setup-k6-action@v1
      - run: k6 run perf/load/soak.js
```

With `soak.js` running at sustained load for 30+ minutes to catch memory leaks and slow degradation.
