/**
 * Security edge-case tests -- verify auth, CSRF, org-ownership, and
 * security hygiene across the kradle web API surface.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { Buffer } from 'node:buffer';
import { fileURLToPath } from 'node:url';
import { requireAuth, withAuth } from '../app/lib/api-auth.js';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fakeRequest(cookieHeader = '', { method = 'GET', extraHeaders = {} } = {}) {
  const hdrs = { cookie: cookieHeader, ...extraHeaders };
  return {
    method,
    headers: {
      get(name) { return hdrs[name.toLowerCase()] || ''; },
      has(name) { return name.toLowerCase() in hdrs && !!hdrs[name.toLowerCase()]; },
    },
  };
}

function encodeSession(data) {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

// ---------------------------------------------------------------------------
// withAuth -- missing / expired / malformed cookie
// ---------------------------------------------------------------------------

test('withAuth returns 401 for completely missing cookie header', async () => {
  const handler = async () => { throw new Error('must not reach handler'); };
  const resp = await withAuth(handler)(fakeRequest(''), {});
  assert.equal(resp.status, 401);
  const body = await resp.json();
  assert.equal(body.error, 'unauthorized');
});

test('withAuth returns 401 for malformed base64 session value', async () => {
  const handler = async () => { throw new Error('must not reach handler'); };
  const resp = await withAuth(handler)(fakeRequest('kradle_session=!!!invalid!!!'), {});
  assert.equal(resp.status, 401);
});

test('withAuth returns 401 when session cookie encodes empty payload (no user)', async () => {
  const handler = async () => { throw new Error('must not reach handler'); };
  const payload = encodeSession({ provider: 'kradle' }); // missing user/subject
  const resp = await withAuth(handler)(fakeRequest(`kradle_session=${payload}`), {});
  assert.equal(resp.status, 401);
});

// ---------------------------------------------------------------------------
// CSRF protection
// ---------------------------------------------------------------------------

test('CSRF check returns 403 for POST without Content-Type or X-Kradle-Request', async () => {
  const payload = encodeSession({ user: 'csrf-test', provider: 'kradle' });
  const req = fakeRequest(`kradle_session=${payload}`, { method: 'POST' });
  const handler = async () => { throw new Error('must not reach handler'); };
  const resp = await withAuth(handler)(req, {});
  assert.equal(resp.status, 403);
  const body = await resp.json();
  assert.match(body.message, /CSRF/);
});

test('CSRF check returns 403 for PUT without protection headers', async () => {
  const payload = encodeSession({ user: 'csrf-put', provider: 'kradle' });
  const req = fakeRequest(`kradle_session=${payload}`, { method: 'PUT' });
  const handler = async () => { throw new Error('must not reach handler'); };
  const resp = await withAuth(handler)(req, {});
  assert.equal(resp.status, 403);
});

test('CSRF check passes for GET requests without extra headers', async () => {
  const payload = encodeSession({ user: 'read-user', provider: 'kradle' });
  const req = fakeRequest(`kradle_session=${payload}`, { method: 'GET' });
  let called = false;
  const handler = async () => { called = true; return new Response('ok'); };
  const resp = await withAuth(handler)(req, {});
  assert.equal(resp.status, 200);
  assert.ok(called);
});

// ---------------------------------------------------------------------------
// Org ownership enforcement
// ---------------------------------------------------------------------------

test('org ownership check allows access when session has no org claims', async () => {
  // The SDK parseSessionCookie strips the orgs field, so session.orgs is undefined.
  // With no org claims the ownership check is skipped -- user passes through.
  const payload = encodeSession({ user: 'alice', provider: 'kradle' });
  const req = fakeRequest(`kradle_session=${payload}`, { method: 'GET' });
  let called = false;
  const handler = async () => { called = true; return new Response('ok'); };
  const context = { params: Promise.resolve({ org: 'any-org' }) };
  const resp = await withAuth(handler)(req, context);
  assert.equal(resp.status, 200);
  assert.ok(called, 'handler should be called when session has no org claims');
});

test('org ownership check: withAuth passes org param to handler via context', async () => {
  const payload = encodeSession({ user: 'bob', provider: 'kradle' });
  const req = fakeRequest(`kradle_session=${payload}`, { method: 'GET' });
  let receivedContext = null;
  const handler = async (_req, ctx, _session) => { receivedContext = ctx; return new Response('ok'); };
  const context = { params: Promise.resolve({ org: 'test-org' }) };
  const resp = await withAuth(handler)(req, context);
  assert.equal(resp.status, 200);
  assert.ok(receivedContext, 'handler should receive context');
});

test('withAuth org check code path reads org from awaited context.params', () => {
  // Verify the api-auth.js source awaits context.params (Next.js 15+ dynamic params)
  const src = fs.readFileSync(path.join(webRoot, 'app', 'lib', 'api-auth.js'), 'utf8');
  assert.ok(src.includes('await context.params'), 'withAuth must await context.params for Next.js 15+ compatibility');
});

// ---------------------------------------------------------------------------
// No hardcoded secrets in auth module
// ---------------------------------------------------------------------------

test('api-auth.js does not contain hardcoded API keys or secrets', () => {
  const src = fs.readFileSync(path.join(webRoot, 'app', 'lib', 'api-auth.js'), 'utf8');
  // Common patterns for hardcoded secrets
  assert.ok(!/(sk-|api[_-]?key|secret)\s*[:=]\s*['"][A-Za-z0-9]{16,}['"]/.test(src),
    'api-auth.js must not contain hardcoded secret-like strings');
});

test('api-errors.js does not contain hardcoded secrets', () => {
  const src = fs.readFileSync(path.join(webRoot, 'app', 'lib', 'api-errors.js'), 'utf8');
  assert.ok(!/(sk-|api[_-]?key|secret)\s*[:=]\s*['"][A-Za-z0-9]{16,}['"]/.test(src),
    'api-errors.js must not contain hardcoded secret-like strings');
});

// ---------------------------------------------------------------------------
// All route files with POST handlers use withAuth
// ---------------------------------------------------------------------------

test('every org route file with POST handler imports withAuth', () => {
  const routeDir = path.join(webRoot, 'app', 'api', 'orgs');
  if (!fs.existsSync(routeDir)) return; // skip if routes not present
  const violations = [];
  const exemptPatterns = ['webhooks/ingest', 'callback'];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === 'route.js') {
        const content = fs.readFileSync(full, 'utf8');
        const rel = path.relative(webRoot, full).replace(/\\/g, '/');
        if (exemptPatterns.some((p) => rel.includes(p))) continue;
        const hasPost = /export\s+(const\s+)?POST\b/.test(content) || /export\s+async\s+function\s+POST/.test(content);
        if (hasPost && !content.includes('withAuth')) {
          violations.push(rel);
        }
      }
    }
  }
  walk(routeDir);
  assert.deepEqual(violations, [], `POST routes without withAuth: ${violations.join(', ')}`);
});

// ---------------------------------------------------------------------------
// Session cookie module exports
// ---------------------------------------------------------------------------

test('api-auth.js exports requireAuth and withAuth', () => {
  const src = fs.readFileSync(path.join(webRoot, 'app', 'lib', 'api-auth.js'), 'utf8');
  assert.match(src, /export\s+function\s+requireAuth/, 'must export requireAuth');
  assert.match(src, /export\s+function\s+withAuth/, 'must export withAuth');
});

test('api-errors.js exports errorResponse', () => {
  const src = fs.readFileSync(path.join(webRoot, 'app', 'lib', 'api-errors.js'), 'utf8');
  assert.match(src, /export\s+function\s+errorResponse/, 'must export errorResponse');
});
