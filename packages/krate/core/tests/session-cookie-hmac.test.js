/**
 * C5: Session cookie HMAC signing tests
 * Tests for HMAC-SHA256 signing of session cookies when KRATE_SESSION_SECRET is set.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { createSessionCookie, parseSessionCookie } from '../src/auth.js';

function makeConfig(cookieName = 'krate_session') {
  return { session: { cookieName } };
}

const TEST_SECRET = 'super-secret-hmac-key-for-testing-1234567890';

const testProfile = {
  provider: 'github',
  subject: 'user-42',
  username: 'alice',
  email: 'alice@example.com'
};

// --- createSessionCookie with HMAC signing ---

test('createSessionCookie includes HMAC signature in cookie value when secret is set', () => {
  const config = makeConfig();
  const cookie = createSessionCookie(config, testProfile, { secret: TEST_SECRET });

  // Cookie format: name=payload.signature; Path=/; ...
  const cookieValue = cookie.split(';')[0].split('=').slice(1).join('=');
  assert.ok(cookieValue.includes('.'), 'Signed cookie value should contain a period separating payload from signature');

  const parts = cookieValue.split('.');
  assert.equal(parts.length, 2, 'Should have exactly payload and signature parts');
  assert.ok(parts[0].length > 0, 'Payload should be non-empty');
  assert.ok(parts[1].length > 0, 'Signature should be non-empty');
});

test('createSessionCookie without secret produces unsigned cookie (no period separator)', () => {
  const config = makeConfig();
  const cookie = createSessionCookie(config, testProfile);

  const cookieValue = cookie.split(';')[0].split('=').slice(1).join('=');
  // Unsigned: base64url encoded JSON, no dot separator
  assert.ok(!cookieValue.includes('.'), 'Unsigned cookie should not have period separator');

  // Payload should be valid base64url JSON
  const parsed = JSON.parse(Buffer.from(cookieValue, 'base64url').toString('utf8'));
  assert.equal(parsed.provider, testProfile.provider);
  assert.equal(parsed.subject, testProfile.subject);
});

test('createSessionCookie without secret but with empty string secret is unsigned', () => {
  const config = makeConfig();
  const cookie = createSessionCookie(config, testProfile, { secret: '' });

  const cookieValue = cookie.split(';')[0].split('=').slice(1).join('=');
  assert.ok(!cookieValue.includes('.'), 'Empty secret should produce unsigned cookie');
});

// --- parseSessionCookie with HMAC verification ---

test('parseSessionCookie verifies HMAC signature and returns session when valid', () => {
  const config = makeConfig();
  const cookie = createSessionCookie(config, testProfile, { secret: TEST_SECRET });
  const cookieValue = cookie.split(';')[0].split('=').slice(1).join('=');

  const session = parseSessionCookie(config, cookieValue, { secret: TEST_SECRET });

  assert.ok(session, 'Should parse and verify correctly');
  assert.equal(session.provider, testProfile.provider);
  assert.equal(session.subject, testProfile.subject);
  assert.equal(session.user, testProfile.username);
});

test('parseSessionCookie rejects tampered cookie payload', () => {
  const config = makeConfig();
  const cookie = createSessionCookie(config, testProfile, { secret: TEST_SECRET });
  const cookieValue = cookie.split(';')[0].split('=').slice(1).join('=');

  // Tamper with the payload by replacing it with different data
  const [, signature] = cookieValue.split('.');
  const tamperedPayload = Buffer.from(JSON.stringify({ provider: 'github', subject: 'hacker', user: 'hacker' })).toString('base64url');
  const tamperedCookieValue = `${tamperedPayload}.${signature}`;

  const session = parseSessionCookie(config, tamperedCookieValue, { secret: TEST_SECRET });

  assert.equal(session, null, 'Should reject tampered cookie');
});

test('parseSessionCookie rejects cookie with wrong signature', () => {
  const config = makeConfig();
  const cookie = createSessionCookie(config, testProfile, { secret: TEST_SECRET });
  const cookieValue = cookie.split(';')[0].split('=').slice(1).join('=');

  // Replace signature with garbage
  const [payload] = cookieValue.split('.');
  const tamperedCookieValue = `${payload}.invalidsignatureXXXXXX`;

  const session = parseSessionCookie(config, tamperedCookieValue, { secret: TEST_SECRET });

  assert.equal(session, null, 'Should reject cookie with wrong signature');
});

test('parseSessionCookie accepts unsigned cookie when no secret provided (backward compat)', () => {
  const config = makeConfig();
  // Create unsigned cookie (no secret)
  const cookie = createSessionCookie(config, testProfile);
  const cookieValue = cookie.split(';')[0].split('=').slice(1).join('=');

  const session = parseSessionCookie(config, cookieValue);

  assert.ok(session, 'Should parse unsigned cookie when no secret provided');
  assert.equal(session.provider, testProfile.provider);
  assert.equal(session.subject, testProfile.subject);
});

test('parseSessionCookie rejects signed cookie when no verification secret is given', () => {
  const config = makeConfig();
  // Signed cookie but parsed without secret
  const cookie = createSessionCookie(config, testProfile, { secret: TEST_SECRET });
  const cookieValue = cookie.split(';')[0].split('=').slice(1).join('=');

  // Parse without secret — signed payload contains a dot, so base64url decode will fail or return null
  const session = parseSessionCookie(config, cookieValue);

  assert.equal(session, null, 'Should reject signed cookie when no secret is provided for verification');
});

test('parseSessionCookie with different secret rejects the cookie', () => {
  const config = makeConfig();
  const cookie = createSessionCookie(config, testProfile, { secret: TEST_SECRET });
  const cookieValue = cookie.split(';')[0].split('=').slice(1).join('=');

  const session = parseSessionCookie(config, cookieValue, { secret: 'wrong-secret-completely-different' });

  assert.equal(session, null, 'Should reject cookie signed with a different secret');
});

test('createSessionCookie with same input and same secret produces same signature (deterministic)', () => {
  const config = makeConfig();
  const cookie1 = createSessionCookie(config, testProfile, { secret: TEST_SECRET });
  const cookie2 = createSessionCookie(config, testProfile, { secret: TEST_SECRET });

  const value1 = cookie1.split(';')[0].split('=').slice(1).join('=');
  const value2 = cookie2.split(';')[0].split('=').slice(1).join('=');

  const sig1 = value1.split('.')[1];
  const sig2 = value2.split('.')[1];

  assert.equal(sig1, sig2, 'Same input+secret should produce same HMAC signature');
});
