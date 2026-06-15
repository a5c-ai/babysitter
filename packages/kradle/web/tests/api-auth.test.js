/**
 * Web API auth utility tests — requireAuth, withAuth, errorResponse
 *
 * These tests run in Node.js without Next.js or React.
 * They exercise the pure-logic helpers in app/lib/api-auth.js and app/lib/api-errors.js.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { requireAuth, withAuth } from '../app/lib/api-auth.js';
import { errorResponse } from '../app/lib/api-errors.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal Request-like object with a cookie header.
 * @param {string} cookieHeader - raw cookie header value (or empty string)
 * @param {object} options - optional { method, extraHeaders }
 */
function fakeRequest(cookieHeader = '', { method = 'GET', extraHeaders = {} } = {}) {
  const hdrs = { cookie: cookieHeader, ...extraHeaders };
  return {
    method,
    headers: {
      get(name) {
        return hdrs[name.toLowerCase()] || '';
      },
      has(name) {
        return name.toLowerCase() in hdrs && !!hdrs[name.toLowerCase()];
      },
    },
  };
}

/**
 * Encode a plain (unsigned) session payload as base64url JSON.
 * Only works when KRADLE_SESSION_SECRET is not set (no HMAC signing).
 */
function encodeSession(data) {
  return Buffer.from(JSON.stringify(data)).toString('base64url');
}

// ---------------------------------------------------------------------------
// requireAuth
// ---------------------------------------------------------------------------

test('requireAuth returns null when no cookie header is present', () => {
  const req = fakeRequest('');
  const result = requireAuth(req);
  assert.equal(result, null);
});

test('requireAuth returns null when cookie header contains no session cookie', () => {
  const req = fakeRequest('theme=dark; locale=en');
  const result = requireAuth(req);
  assert.equal(result, null);
});

test('requireAuth returns null when session cookie value is malformed', () => {
  const req = fakeRequest('kradle_session=not-valid-base64!!!');
  const result = requireAuth(req);
  assert.equal(result, null);
});

test('requireAuth returns session object for valid unsigned session cookie', () => {
  const payload = encodeSession({ user: 'alice', provider: 'kradle' });
  const req = fakeRequest(`kradle_session=${payload}`);
  const session = requireAuth(req);
  assert.ok(session, 'session should not be null');
  assert.equal(session.subject, 'alice');
  assert.equal(session.provider, 'kradle');
  assert.equal(session.cookieName, 'kradle_session');
});

test('requireAuth ignores unrelated cookies before the session cookie', () => {
  const payload = encodeSession({ user: 'bob', provider: 'gitea' });
  const req = fakeRequest(`other=123; kradle_session=${payload}; another=456`);
  const session = requireAuth(req);
  assert.ok(session, 'session should not be null even with surrounding cookies');
  assert.equal(session.subject, 'bob');
});

test('requireAuth returns null when session payload encodes empty user and subject', () => {
  const payload = encodeSession({ provider: 'kradle' }); // no user or subject
  const req = fakeRequest(`kradle_session=${payload}`);
  const result = requireAuth(req);
  assert.equal(result, null);
});

// ---------------------------------------------------------------------------
// withAuth
// ---------------------------------------------------------------------------

test('withAuth calls handler with session when cookie is valid', async () => {
  const payload = encodeSession({ user: 'charlie', provider: 'kradle' });
  const req = fakeRequest(`kradle_session=${payload}`);

  let calledWith = null;
  const handler = async (request, context, session) => {
    calledWith = session;
    return new Response('ok');
  };

  const wrapped = withAuth(handler);
  const response = await wrapped(req, {});
  assert.ok(calledWith, 'handler should have been called');
  assert.equal(calledWith.subject, 'charlie');
  assert.equal(response.status, 200);
});

test('withAuth returns 401 when no session cookie present', async () => {
  const req = fakeRequest('');
  const handler = async () => { throw new Error('should not be called'); };

  const wrapped = withAuth(handler);
  const response = await wrapped(req, {});
  assert.equal(response.status, 401);

  const body = await response.json();
  assert.equal(body.error, 'unauthorized');
});

test('withAuth rejects mutating requests without CSRF protection', async () => {
  const payload = encodeSession({ user: 'dave', provider: 'kradle' });
  const req = fakeRequest(`kradle_session=${payload}`, { method: 'POST' });
  const handler = async () => { throw new Error('should not be called'); };

  const wrapped = withAuth(handler);
  const response = await wrapped(req, {});
  assert.equal(response.status, 403);
  const body = await response.json();
  assert.match(body.message, /CSRF/);
});

test('withAuth allows mutating requests with Content-Type: application/json', async () => {
  const payload = encodeSession({ user: 'eve', provider: 'kradle' });
  const req = fakeRequest(`kradle_session=${payload}`, { method: 'POST', extraHeaders: { 'content-type': 'application/json' } });

  let calledWith = null;
  const handler = async (request, context, session) => {
    calledWith = session;
    return new Response('ok');
  };

  const wrapped = withAuth(handler);
  const response = await wrapped(req, {});
  assert.ok(calledWith, 'handler should have been called');
  assert.equal(response.status, 200);
});

test('withAuth allows mutating requests with X-Kradle-Request header', async () => {
  const payload = encodeSession({ user: 'frank', provider: 'kradle' });
  const req = fakeRequest(`kradle_session=${payload}`, { method: 'DELETE', extraHeaders: { 'x-kradle-request': '1' } });

  let calledWith = null;
  const handler = async (request, context, session) => {
    calledWith = session;
    return new Response('ok');
  };

  const wrapped = withAuth(handler);
  const response = await wrapped(req, {});
  assert.ok(calledWith, 'handler should have been called');
  assert.equal(response.status, 200);
});

// ---------------------------------------------------------------------------
// errorResponse
// ---------------------------------------------------------------------------

test('errorResponse returns 500 internal_error by default', async () => {
  const resp = errorResponse('Something went wrong');
  assert.equal(resp.status, 500);
  const body = await resp.json();
  assert.equal(body.error, 'internal_error');
  assert.equal(body.message, 'Something went wrong');
});

test('errorResponse returns 401 unauthorized for status 401', async () => {
  const resp = errorResponse('Not authenticated', 401);
  assert.equal(resp.status, 401);
  const body = await resp.json();
  assert.equal(body.error, 'unauthorized');
});

test('errorResponse returns 404 not_found for status 404', async () => {
  const resp = errorResponse('Resource missing', 404);
  assert.equal(resp.status, 404);
  const body = await resp.json();
  assert.equal(body.error, 'not_found');
});

test('errorResponse returns 400 bad_request for status 400', async () => {
  const resp = errorResponse('Invalid input', 400);
  assert.equal(resp.status, 400);
  const body = await resp.json();
  assert.equal(body.error, 'bad_request');
});

test('errorResponse body contains the provided message string', async () => {
  const message = 'Custom error message here';
  const resp = errorResponse(message, 500);
  const body = await resp.json();
  assert.equal(body.message, message);
});
