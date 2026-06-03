import { expect, test as base } from '@playwright/test';

export const E2E_PREFIX = 'issue-609-e2e';

function enabled(name) {
  return process.env[name] === '1' || process.env[name] === 'true';
}

function slugPart(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24) || 'test';
}

function baseUrl(testInfo) {
  return testInfo.project.use?.baseURL || process.env.KRADLE_E2E_URL || 'http://localhost:3000';
}

function localUnsignedAuthAvailable() {
  if (process.env.KRADLE_SESSION_SECRET) return false;
  const url = process.env.KRADLE_E2E_URL || 'http://localhost:3000';
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
  } catch {
    return false;
  }
}

function unsignedSessionCookie() {
  const now = Math.floor(Date.now() / 1000);
  return Buffer.from(JSON.stringify({
    provider: 'kradle',
    subject: `${E2E_PREFIX}-user`,
    user: `${E2E_PREFIX}-user`,
    iat: now,
    exp: now + 3600,
  })).toString('base64url');
}

export function hasUsableAuthFixture() {
  return Boolean(process.env.KRADLE_E2E_AUTH_STATE || localUnsignedAuthAvailable());
}

export function mutatingStagingEnabled() {
  if (process.env.KRADLE_E2E_URL) return enabled('KRADLE_E2E_ENABLE_MUTATING_STAGING') && hasUsableAuthFixture();
  return enabled('KRADLE_E2E_ENABLE_MUTATING_LOCAL');
}

export function serviceFlowsEnabled() {
  return enabled('KRADLE_E2E_ENABLE_SERVICE_FLOWS');
}

export function skipUnlessMutatingEnabled(test) {
  test.skip(
    !mutatingStagingEnabled(),
    'Set KRADLE_E2E_ENABLE_MUTATING_STAGING=1 with KRADLE_E2E_AUTH_STATE for shared staging CRUD E2E tests; local runs may use KRADLE_E2E_ENABLE_MUTATING_LOCAL=1.',
  );
}

export function skipUnlessServiceFlowsEnabled(test) {
  test.skip(
    !serviceFlowsEnabled(),
    'Requires #608 staging services and KRADLE_E2E_ENABLE_SERVICE_FLOWS=1 for real assistant, playground, and agent dispatch/session flows.',
  );
}

export function attachBrowserErrorCapture(page) {
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error') return;
    const text = message.text();
    const isKnownDevNoise = text.includes('fonts.googleapis.com')
      || text.includes('eval() is not supported in this environment');
    if (!isKnownDevNoise) errors.push(`console: ${text}`);
  });
  return errors;
}

export async function expectNoRawServerErrors(page) {
  const body = await page.locator('body').innerText({ timeout: 10_000 }).catch(() => '');
  expect(body).not.toContain('Internal Server Error');
  expect(body).not.toContain('NEXT_NOT_FOUND');
  expect(body).not.toContain('Application error');
  expect(body).not.toContain('Unhandled Runtime Error');
}

export function expectNoBrowserErrors(errors) {
  expect(errors, errors.join('\n')).toEqual([]);
}

export const test = base.extend({
  org: [async ({}, use) => {
    await use(process.env.KRADLE_E2E_ORG || 'default');
  }, { option: true }],

  uniqueName: async ({}, use, testInfo) => {
    const worker = `w${testInfo.workerIndex}`;
    const stamp = Date.now().toString(36);
    let counter = 0;
    await use((suffix = 'resource') => {
      counter += 1;
      return `${E2E_PREFIX}-${worker}-${stamp}-${counter}-${slugPart(suffix)}`.slice(0, 63);
    });
  },

  createdResources: async ({ request, org }, use) => {
    const resources = [];
    await use(resources);
    for (const resource of resources.reverse()) {
      if (!resource?.kind || !resource?.name || !String(resource.name).startsWith(E2E_PREFIX)) continue;
      await request.delete(`/api/orgs/${encodeURIComponent(org)}/resources/${encodeURIComponent(resource.kind)}/${encodeURIComponent(resource.name)}`, {
        headers: { 'x-kradle-request': '1' },
      }).catch(() => null);
    }
  },

  cleanupResource: async ({ request, org }, use) => {
    await use(async (kind, name) => {
      if (!kind || !name || !String(name).startsWith(E2E_PREFIX)) return;
      await request.delete(`/api/orgs/${encodeURIComponent(org)}/resources/${encodeURIComponent(kind)}/${encodeURIComponent(name)}`, {
        headers: { 'x-kradle-request': '1' },
      }).catch(() => null);
    });
  },

  createResource: async ({ request, org, createdResources }, use) => {
    await use(async (resource) => {
      const response = await request.post(`/api/orgs/${encodeURIComponent(org)}/resources`, {
        headers: { 'x-kradle-request': '1' },
        data: resource,
      });
      if (response.ok()) createdResources.push({ kind: resource.kind, name: resource.metadata?.name });
      return response;
    });
  },

  authenticatedPage: async ({ page }, use, testInfo) => {
    if (!process.env.KRADLE_E2E_AUTH_STATE && localUnsignedAuthAvailable()) {
      await page.context().addCookies([{
        name: process.env.KRADLE_AUTH_COOKIE_NAME || 'kradle_session',
        value: unsignedSessionCookie(),
        url: baseUrl(testInfo),
        httpOnly: true,
        sameSite: 'Strict',
      }]);
    }
    await use(page);
  },
});

export { expect };
