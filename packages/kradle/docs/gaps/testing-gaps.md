# Testing Gaps

## Test Inventory

| Package | Test Files | Tests | Pass Rate | Type |
|---------|-----------|-------|-----------|------|
| kradle-core | 65 | 1,678 | 100% | Unit + integration (in-memory) |
| kradle-web | 18 | 300 | 100% | Structural (file-based, no server) |
| kradle-sdk | ? | 84 | 100% | Unit |
| kradle-cli | ? | 51 | 100% | Unit (mock controller) |
| **Total** | **83+** | **2,113** | **100%** | |

## What the Tests Actually Verify

### kradle-core (1,678 tests)
- Resource model validation (89 kinds, required fields, type rules)
- Controller method behavior with in-memory mocks
- Virtual model hook sandbox security (prototype pollution, constructor escape)
- Model route resolution and Envoy manifest generation
- Event bus persistence and ring buffer
- Memory query graph traversal and grep search
- Auth cookie HMAC signing and parsing

### kradle-web (300 tests)
- **Build smoke** — Next.js production build compiles
- **API route structure** — all routes have force-dynamic, auth, correct HTTP methods
- **Component structure** — barrel exports, use-client directives, aria-labels, no alert()
- **Resource contracts** — frontend forms send fields matching CRD requiredSpec
- **Page structure** — page.jsx files export metadata, error/loading boundaries exist
- **Barrel exports** — index.js re-exports from all 10 subdirectories
- **Lib modules** — utility function behavior (phaseTone, relativeTime)
- **Security edge cases** — auth returns 401/403 for invalid sessions, CSRF checks

### kradle-cli (51 tests)
- MCP tool definitions match expected schema
- Tool handler responses have correct structure
- Mock controller receives expected parameters

## What the Tests DO NOT Verify

### Zero End-to-End Tests

There are **no tests that start the server and make HTTP requests**. All 300 web tests read files from disk and assert patterns. This means:

- We don't know if pages render without runtime errors in a browser
- We don't know if form submissions create resources on a real API
- We don't know if navigation flows work in a real browser
- We don't know if auth cookies are properly set/read in HTTP
- We don't know if SSE streaming works with a real EventSource client
- We don't know if the inference proxy actually forwards to KServe

### No Component Rendering Tests

There are no tests that render React components (no jsdom, no React Testing Library). The "component tests" are file-based pattern matching. This means:

- We don't know if components render without throwing
- We don't know if event handlers fire correctly
- We don't know if conditional rendering works (loading/error/empty states)
- We don't know if form validation shows proper error messages

### No Integration Tests Between Packages

- No test verifies that the SDK correctly wraps core controllers
- No test verifies that the CLI MCP server correctly delegates to SDK
- No test verifies that the web API routes correctly call SDK methods
- No test verifies the web → SDK → core → kubectl pipeline

### No Contract Tests Against Real Infrastructure

- No test hits a real Kubernetes cluster
- No test hits a real Gitea instance
- No test hits the Anthropic API
- No test verifies CRD schemas match the YAML definitions in charts/crds/

## What's Needed

### P0 — Playwright E2E Against Staging
```
cd packages/kradle/web
npx playwright test --config=playwright.config.js
```
The config file exists but there are no test files. Need:
- Login flow test
- Dashboard renders test
- Create stack → dispatch run flow
- CRUD for each resource type
- Error boundary triggers correctly

### P1 — API Route Integration Tests
Start the Next.js server locally and make real HTTP requests:
- POST /api/orgs/default/resources with valid/invalid bodies
- GET with pagination params
- DELETE with auth
- SSE connection and event reception

### P2 — Cross-Package Integration Tests
- SDK wraps core correctly
- CLI MCP tools call SDK correctly
- Web routes call SDK correctly
- Full pipeline: web request → API route → SDK → core controller → kubectl mock

### P3 — Infrastructure Contract Tests
- CRD YAML schemas match RESOURCE_DEFINITIONS in code
- Helm chart values.yaml matches env vars used in code
- Docker image builds and starts successfully
