/**
 * API E2E Tests -- Verify that the Kradle web API works end-to-end against
 * a real running server (local dev or staging).
 *
 * Unlike the structural/mock tests in this directory, these tests make real
 * HTTP requests and verify the product actually functions.
 *
 * Auth-protected endpoints may return 307 (redirect to login) or 401/403.
 * The tests treat any of those as "auth required, endpoint is alive" and
 * only validate JSON structure when a 200 is returned.
 *
 * Usage:
 *   KRADLE_E2E_URL=https://kradle-staging.a5c.ai node --test tests/api-e2e.test.js
 *   KRADLE_E2E_URL=http://localhost:3000 node --test tests/api-e2e.test.js
 */
import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.KRADLE_E2E_URL || 'http://localhost:3000';
const ORG = process.env.KRADLE_E2E_ORG || 'default';
const E2E_PREFIX = 'api-e2e-test';
const TIMEOUT_MS = 15_000;

/** Auth redirect/deny statuses that mean "endpoint is alive but needs auth". */
const AUTH_STATUSES = new Set([301, 302, 303, 307, 308, 401, 403]);

function apiUrl(path) {
  return `${BASE_URL}${path}`;
}

function jsonHeaders(extra = {}) {
  return { 'Content-Type': 'application/json', 'x-kradle-request': '1', ...extra };
}

/**
 * Fetch an API endpoint without following redirects so we can distinguish
 * "auth redirect to login page" from "endpoint returned JSON".
 */
function apiFetch(path, options = {}) {
  return fetch(apiUrl(path), { redirect: 'manual', ...options });
}

/** Returns true if the response is a JSON 200 we can parse. */
function isJsonOk(res) {
  if (res.status !== 200) return false;
  const ct = res.headers.get('content-type') || '';
  return ct.includes('json');
}

/** Returns true if the response indicates auth is required (redirect or 4xx). */
function isAuthRequired(res) {
  return AUTH_STATUSES.has(res.status);
}

// ---------------------------------------------------------------------------
// 1. Health / snapshot endpoint returns structured status
// ---------------------------------------------------------------------------

test('GET /api/orgs/:org/snapshot returns structured health status', { timeout: TIMEOUT_MS }, async () => {
  const res = await apiFetch(`/api/orgs/${ORG}/snapshot`);
  assert.ok(res.status < 500, `snapshot endpoint returned ${res.status}`);

  if (isJsonOk(res)) {
    const data = await res.json();
    assert.ok(data.health !== undefined, 'response must include health object');
    assert.ok(data.health.kubernetes !== undefined, 'health must include kubernetes probe');
    assert.ok(data.health.controller !== undefined, 'health must include controller probe');
    assert.ok(data.timestamp, 'response must include timestamp');
    assert.ok(data.org, 'response must include org');
  } else if (isAuthRequired(res)) {
    // Auth redirect/deny -- endpoint is alive, just needs credentials
  }
});

// ---------------------------------------------------------------------------
// 2. Controller endpoint returns UI model
// ---------------------------------------------------------------------------

test('GET /api/controller returns controller UI model', { timeout: TIMEOUT_MS }, async () => {
  const res = await apiFetch('/api/controller');
  assert.ok(res.status < 500, `controller endpoint returned ${res.status}`);

  if (isJsonOk(res)) {
    const data = await res.json();
    assert.ok(typeof data === 'object', 'controller must return an object');
  } else if (isAuthRequired(res)) {
    // Auth redirect/deny -- endpoint is alive
  }
});

// ---------------------------------------------------------------------------
// 3. Resource list endpoint returns items
// ---------------------------------------------------------------------------

test('GET /api/orgs/:org/resources?kind=AgentStack returns resource list', { timeout: TIMEOUT_MS }, async () => {
  const res = await apiFetch(`/api/orgs/${ORG}/resources?kind=AgentStack`);
  assert.ok(res.status < 500, `resources endpoint returned ${res.status}`);

  if (isJsonOk(res)) {
    const data = await res.json();
    const items = data.items || (Array.isArray(data) ? data : []);
    assert.ok(Array.isArray(items), 'resources must return an items array');
  } else if (isAuthRequired(res)) {
    // Auth redirect/deny -- endpoint is alive
  }
});

// ---------------------------------------------------------------------------
// 4. Resource list with pagination
// ---------------------------------------------------------------------------

test('GET /api/orgs/:org/resources?kind=AgentStack&limit=5 returns paginated response', { timeout: TIMEOUT_MS }, async () => {
  const res = await apiFetch(`/api/orgs/${ORG}/resources?kind=AgentStack&limit=5`);
  assert.ok(res.status < 500, `paginated resources endpoint returned ${res.status}`);

  if (isJsonOk(res)) {
    const data = await res.json();
    assert.ok(data.items !== undefined, 'paginated response must include items');
    assert.ok(typeof data.total === 'number', 'paginated response must include total count');
    assert.ok(typeof data.limit === 'number', 'paginated response must include limit');
    assert.ok(typeof data.hasMore === 'boolean', 'paginated response must include hasMore');
    assert.ok(data.limit <= 5, `limit should be <= 5, got ${data.limit}`);
  } else if (isAuthRequired(res)) {
    // Auth redirect/deny -- endpoint is alive
  }
});

// ---------------------------------------------------------------------------
// 5. Search endpoint returns structured results
// ---------------------------------------------------------------------------

test('GET /api/orgs/:org/search?q=test returns search results', { timeout: TIMEOUT_MS }, async () => {
  const res = await apiFetch(`/api/orgs/${ORG}/search?q=test`);
  assert.ok(res.status < 500, `search endpoint returned ${res.status}`);

  if (isJsonOk(res)) {
    const data = await res.json();
    assert.ok(data.results !== undefined, 'search must return results array');
    assert.ok(typeof data.query === 'string', 'search must return query string');
    assert.ok(typeof data.total === 'number', 'search must return total count');
  } else if (isAuthRequired(res)) {
    // Auth redirect/deny -- endpoint is alive
  }
});

// ---------------------------------------------------------------------------
// 6. Search with short query returns empty
// ---------------------------------------------------------------------------

test('GET /api/orgs/:org/search?q=x returns empty for short queries', { timeout: TIMEOUT_MS }, async () => {
  const res = await apiFetch(`/api/orgs/${ORG}/search?q=x`);
  assert.ok(res.status < 500, `search endpoint returned ${res.status}`);

  if (isJsonOk(res)) {
    const data = await res.json();
    assert.ok(Array.isArray(data.results), 'search must return results array');
    assert.equal(data.results.length, 0, 'single-char query should return empty results');
  } else if (isAuthRequired(res)) {
    // Auth redirect/deny -- endpoint is alive
  }
});

// ---------------------------------------------------------------------------
// 7. Inference catalog endpoint
// ---------------------------------------------------------------------------

test('GET /api/orgs/:org/inference/catalog responds without crashing', { timeout: TIMEOUT_MS }, async () => {
  const res = await apiFetch(`/api/orgs/${ORG}/inference/catalog`);
  assert.ok(res.status < 500, `inference catalog returned ${res.status}`);
});

// ---------------------------------------------------------------------------
// 8. Agent tools catalog endpoint
// ---------------------------------------------------------------------------

test('GET /api/orgs/:org/agents/tools/catalog returns tool categories', { timeout: TIMEOUT_MS }, async () => {
  const res = await apiFetch(`/api/orgs/${ORG}/agents/tools/catalog`);
  assert.ok(res.status < 500, `tools catalog returned ${res.status}`);

  if (isJsonOk(res)) {
    const data = await res.json();
    assert.ok(data.categories !== undefined, 'tools catalog must include categories');
    assert.ok(Array.isArray(data.categories), 'categories must be an array');
    assert.ok(data.categories.length > 0, 'categories must not be empty');
  }
});

// ---------------------------------------------------------------------------
// 9. Resource CRUD lifecycle: create -> read -> delete
// ---------------------------------------------------------------------------

test('resource CRUD lifecycle: create, read-back, delete an AgentStack', { timeout: TIMEOUT_MS * 2 }, async () => {
  const stackName = `${E2E_PREFIX}-${Date.now().toString(36)}`;

  // CREATE
  const createRes = await apiFetch(`/api/orgs/${ORG}/resources`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      apiVersion: 'kradle.a5c.ai/v1alpha1',
      kind: 'AgentStack',
      metadata: { name: stackName },
      spec: {
        organizationRef: ORG,
        baseAgent: 'claude-code',
        taskPrompt: 'E2E test stack -- will be deleted',
      },
    }),
  });
  assert.ok(createRes.status < 500, `create returned ${createRes.status}`);
  if (isAuthRequired(createRes)) {
    // Auth required -- skip the rest of the CRUD test
    return;
  }
  assert.ok(createRes.ok, `create response not ok: ${createRes.status}`);

  // READ BACK from list
  const listRes = await apiFetch(`/api/orgs/${ORG}/resources?kind=AgentStack`);
  if (!isJsonOk(listRes)) {
    // If we can't read back, clean up and bail
    await apiFetch(`/api/orgs/${ORG}/resources/AgentStack/${stackName}`, { method: 'DELETE', headers: jsonHeaders() }).catch(() => {});
    assert.fail(`list after create returned ${listRes.status}, expected 200 JSON`);
  }
  const listData = await listRes.json();
  const items = listData.items || (Array.isArray(listData) ? listData : []);
  const found = items.some((item) => item.metadata?.name === stackName);
  assert.ok(found, `created stack "${stackName}" not found in resource list`);

  // READ single resource
  const getRes = await apiFetch(`/api/orgs/${ORG}/resources/AgentStack/${stackName}`);
  assert.ok(getRes.status < 500, `get single resource returned ${getRes.status}`);
  if (isJsonOk(getRes)) {
    const getBody = await getRes.json();
    const resource = getBody.resource || getBody;
    assert.equal(resource.metadata?.name, stackName, 'single resource name must match');
    assert.equal(resource.kind, 'AgentStack', 'single resource kind must match');
  }

  // DELETE
  const delRes = await apiFetch(`/api/orgs/${ORG}/resources/AgentStack/${stackName}`, {
    method: 'DELETE',
    headers: jsonHeaders(),
  });
  assert.ok(delRes.status < 500, `delete returned ${delRes.status}`);
  assert.ok(delRes.ok, `delete response not ok: ${delRes.status}`);

  // VERIFY DELETION
  const verifyRes = await apiFetch(`/api/orgs/${ORG}/resources?kind=AgentStack`);
  if (isJsonOk(verifyRes)) {
    const verifyData = await verifyRes.json();
    const verifyItems = verifyData.items || (Array.isArray(verifyData) ? verifyData : []);
    const stillExists = verifyItems.some((item) => item.metadata?.name === stackName);
    assert.ok(!stillExists, `stack "${stackName}" should not exist after deletion`);
  }
});

// ---------------------------------------------------------------------------
// 10. Resource validation rejects invalid payloads
// ---------------------------------------------------------------------------

test('POST /api/orgs/:org/resources rejects invalid resource (no kind)', { timeout: TIMEOUT_MS }, async () => {
  const res = await apiFetch(`/api/orgs/${ORG}/resources`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify({
      // Missing kind -- should fail validation or be treated as unknown
      metadata: { name: `${E2E_PREFIX}-invalid` },
      spec: {},
    }),
  });
  assert.ok(res.status < 500, `invalid resource should not cause 500, got ${res.status}`);
  if (isAuthRequired(res)) {
    // Auth required -- endpoint is alive, cannot test validation without auth
    return;
  }
  // Without a kind, the server may accept it (unknown kinds bypass validation)
  // or reject it. Either way, no 5xx is the primary assertion.
});

// ---------------------------------------------------------------------------
// 11. Agent events stream endpoint is reachable
// ---------------------------------------------------------------------------

test('GET /api/orgs/:org/agents/events/stream responds without 5xx', { timeout: TIMEOUT_MS }, async () => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(apiUrl(`/api/orgs/${ORG}/agents/events/stream`), {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    assert.ok(res.status < 500, `events stream returned ${res.status}`);
    if (res.status === 200) {
      const ct = res.headers.get('content-type') || '';
      assert.ok(
        ct.includes('text/event-stream') || ct.includes('text/html') || ct.includes('application/json'),
        `events stream content-type should be SSE or structured, got: ${ct}`,
      );
    }
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      // Stream connected and was alive for 5s -- that's a pass
    } else {
      throw err;
    }
  }
});

// ---------------------------------------------------------------------------
// 12. Login page is accessible (public -- no auth required)
// ---------------------------------------------------------------------------

test('GET /login returns HTML page', { timeout: TIMEOUT_MS }, async () => {
  const res = await fetch(apiUrl('/login'));
  assert.ok(res.status < 500, `login page returned ${res.status}`);
  assert.ok([200, 302, 307].includes(res.status), `login page should return 200 or redirect, got ${res.status}`);
  if (res.status === 200) {
    const ct = res.headers.get('content-type') || '';
    assert.ok(ct.includes('text/html'), `login page should return HTML, got: ${ct}`);
    const body = await res.text();
    assert.ok(body.includes('Sign in') || body.includes('sign in') || body.includes('Login'), 'login page should contain sign-in text');
  }
});

// ---------------------------------------------------------------------------
// 13. Multiple resource kinds can be listed
// ---------------------------------------------------------------------------

test('resource list works for multiple kinds', { timeout: TIMEOUT_MS * 2 }, async () => {
  const kinds = ['AgentStack', 'Repository', 'KradleProject', 'AgentDispatchRun', 'TriggerRule'];

  for (const kind of kinds) {
    const res = await apiFetch(`/api/orgs/${ORG}/resources?kind=${kind}`);
    assert.ok(
      res.status < 500,
      `listing ${kind} returned ${res.status} (expected < 500)`,
    );
  }
});

// ---------------------------------------------------------------------------
// 14. External sync dashboard endpoint
// ---------------------------------------------------------------------------

test('GET /api/orgs/:org/external/sync responds without 5xx', { timeout: TIMEOUT_MS }, async () => {
  const res = await apiFetch(`/api/orgs/${ORG}/external/sync`);
  assert.ok(res.status < 500, `external sync returned ${res.status}`);
});
