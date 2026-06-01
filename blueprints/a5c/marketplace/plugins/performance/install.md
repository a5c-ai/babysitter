# performance — Install Instructions

Set up performance feedback loops — bundle size budgets, Lighthouse CI performance budgets, load-testing harness (k6 or Artillery), and a PR regression gate that fails when frontend bundle size, backend latency, or throughput degrade beyond thresholds.

## Step 1: Interview the User

### Stage 1: Project Analysis

Before asking questions, analyze the project:

1. Read `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, or equivalent to identify language(s)
2. Detect frontend stack:
   - React / Next.js / Vite / webpack / Rollup / esbuild
   - Check for `dist/`, `build/`, `.next/` build outputs
3. Detect backend stack:
   - Node (Express/Fastify/NestJS), Python (FastAPI/Django/Flask), Go, Rust, Java
   - Look for `Dockerfile`, `openapi.yaml`, or HTTP handler patterns
4. Check existing perf tooling: `size-limit`, `bundlesize`, `lighthouse`, `k6`, `artillery`, `autocannon`
5. Check CI: `.github/workflows/`, `.gitlab-ci.yml`, `.circleci/`
6. Summarize findings to the user

### Stage 2: Performance Layers

Ask the user which layers to install (multi-select):

1. **Bundle size budget** — size-limit or bundlesize gate on frontend builds
2. **Lighthouse CI** — performance / LCP / TBT / CLS budgets on built pages
3. **Load testing** — k6 or Artillery harness with PR regression comparison
4. **API latency gate** — p50/p95/p99 thresholds per endpoint
5. **PR regression gate** — fail PRs that regress any metric beyond configured delta
6. **All** — Install every applicable layer

### Stage 3: Tool Selection

Confirm per-stack choices:

| Stack | Bundle Tool | Load Tool |
|-------|-------------|-----------|
| React / Next.js / Vite | `size-limit` (recommended) or `bundlesize` | `k6` |
| Backend API (Node/Python/Go) | n/a | `k6` (recommended) or `artillery` |
| Static site | `size-limit` | Lighthouse CI only |

### Stage 4: Thresholds

Ask the user:
- Max JS bundle size? (default: `200 KB` gzipped per entry)
- Lighthouse perf min score? (default: `0.85`)
- p95 latency target? (default: `300 ms`)
- Max allowed regression per PR? (default: `+10%` size, `+15%` latency)

## Step 2: Install Bundle Size Budget

### size-limit (recommended)

```bash
npm install -D size-limit @size-limit/preset-app
```

Add to `package.json`:

```json
{
  "size-limit": [
    { "name": "main", "path": "dist/**/*.js", "limit": "200 KB" },
    { "name": "vendor", "path": "dist/vendor-*.js", "limit": "150 KB" }
  ],
  "scripts": {
    "perf:size": "size-limit"
  }
}
```

### bundlesize (alternative)

```bash
npm install -D bundlesize
```

```json
{
  "bundlesize": [
    { "path": "./dist/**/*.js", "maxSize": "200 kB", "compression": "gzip" }
  ]
}
```

## Step 3: Install Lighthouse CI

```bash
npm install -D @lhci/cli
```

Create `lighthouserc.json`:

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:3000/", "http://localhost:3000/pricing"],
      "numberOfRuns": 3,
      "startServerCommand": "npm run start"
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }],
        "first-contentful-paint": ["warn", { "maxNumericValue": 1800 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "total-blocking-time": ["error", { "maxNumericValue": 300 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }]
      }
    },
    "upload": { "target": "temporary-public-storage" }
  }
}
```

Add script:

```json
{ "scripts": { "perf:lighthouse": "lhci autorun" } }
```

## Step 4: Install Load Testing Harness

### k6 (recommended)

Install locally or rely on CI container:

```bash
# macOS
brew install k6
# Linux via docker
docker pull grafana/k6
```

Create `perf/load/smoke.js`:

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<800'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const res = http.get(`${__ENV.TARGET_URL || 'http://localhost:8080'}/health`);
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}
```

### Artillery (alternative)

```bash
npm install -D artillery
```

Create `perf/load/smoke.yml`:

```yaml
config:
  target: "http://localhost:8080"
  phases:
    - duration: 60
      arrivalRate: 10
  ensure:
    p95: 300
    maxErrorRate: 1
scenarios:
  - flow:
      - get: { url: "/health" }
```

## Step 5: Add Pre-commit Hook (Size Only)

Pre-commit for bundle size is optional — builds can be slow. If enabled:

```bash
npm install -D husky lint-staged
npx husky init
```

Add to `.husky/pre-push` (not pre-commit — too slow):

```bash
npm run build && npm run perf:size
```

## Step 6: Create GitHub Actions Workflow

Create `.github/workflows/performance.yml`:

```yaml
name: Performance

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - run: npm run build
      - run: npm run perf:size

  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: 'npm' }
      - run: npm ci
      - run: npm run build
      - run: npm run perf:lighthouse

  load-test:
    runs-on: ubuntu-latest
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v6
      - uses: grafana/setup-k6-action@v1
      - name: Start app
        run: |
          npm ci && npm run build
          npm run start &
          npx wait-on http://localhost:8080 --timeout 60000
      - run: k6 run perf/load/smoke.js
        env:
          TARGET_URL: http://localhost:8080
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: perf-report
          path: |
            .lighthouseci/
            k6-results.json
```

## Step 7: PR Regression Gate

Use the k6 thresholds (above) and size-limit's built-in GitHub comment action:

```yaml
- uses: andresz1/size-limit-action@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

This posts a PR comment with size deltas and fails if budgets exceeded.

## Step 8: Run Baseline

```bash
npm run build
npm run perf:size || true
npm run perf:lighthouse || true
k6 run perf/load/smoke.js || true
```

Record baseline metrics and report to the user.

## Step 9: Register Plugin

```bash
babysitter plugin:update-registry --plugin-name performance --plugin-version 1.0.0 --marketplace-name marketplace --project --json
```

## Step 10: Verify Setup

1. `npm run perf:size` passes against configured budget
2. `npm run perf:lighthouse` produces a report
3. `k6 run perf/load/smoke.js` completes with thresholds met
4. Workflow is committed at `.github/workflows/performance.yml`
5. Baseline metrics recorded

## Reference

- size-limit: https://github.com/ai/size-limit
- Lighthouse CI: https://github.com/GoogleChrome/lighthouse-ci
- k6: https://k6.io/docs/
- Artillery: https://www.artillery.io/docs
