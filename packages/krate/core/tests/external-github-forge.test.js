import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createGitHubJwt,
  exchangeInstallationToken,
  GitHubGitForge,
  createGitHubProvider,
  GITHUB_GIT_FORGE_BOUNDARY
} from '../src/external/github/index.js';

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------

function makeMockFetch(responses) {
  let callIndex = 0;
  return async function mockFetch(url, options = {}) {
    const entry = Array.isArray(responses) ? responses[callIndex++] : responses;
    if (!entry) throw new Error(`Unexpected fetch call to ${url}`);
    return {
      ok: entry.status >= 200 && entry.status < 300,
      status: entry.status ?? 200,
      json: async () => entry.body,
      text: async () => JSON.stringify(entry.body)
    };
  };
}

function makeForge(fetchResponses = []) {
  return new GitHubGitForge({
    owner: 'my-org',
    installationToken: 'ghs_test_token',
    fetchImpl: makeMockFetch(fetchResponses)
  });
}

// ---------------------------------------------------------------------------
// 1. createGitHubJwt — generates a valid JWT structure (header.payload.signature)
// ---------------------------------------------------------------------------

describe('createGitHubJwt — structure', () => {
  it('generates a string with three dot-separated parts', async () => {
    const jwt = await createGitHubJwt({ appId: '12345', privateKey: 'hmac-test-key' });
    const parts = jwt.split('.');
    assert.equal(parts.length, 3, 'JWT must have exactly three parts separated by dots');
    parts.forEach((part, i) => {
      assert.ok(part.length > 0, `JWT part ${i} must not be empty`);
    });
  });

  it('header decodes to valid JSON with alg and typ', async () => {
    const jwt = await createGitHubJwt({ appId: '12345', privateKey: 'hmac-test-key' });
    const [headerB64] = jwt.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
    assert.ok(header.alg, 'header must contain alg claim');
    assert.equal(header.typ, 'JWT', 'header.typ must be "JWT"');
  });

  it('payload decodes to valid JSON', async () => {
    const jwt = await createGitHubJwt({ appId: '12345', privateKey: 'hmac-test-key' });
    const [, payloadB64] = jwt.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    assert.ok(typeof payload === 'object' && payload !== null, 'payload must be a JSON object');
  });
});

// ---------------------------------------------------------------------------
// 2. createGitHubJwt — includes iss (app ID) and exp (10 min) claims
// ---------------------------------------------------------------------------

describe('createGitHubJwt — claims', () => {
  it('includes iss claim equal to appId', async () => {
    const appId = 'app-999';
    const jwt = await createGitHubJwt({ appId, privateKey: 'hmac-test-key' });
    const [, payloadB64] = jwt.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    assert.equal(String(payload.iss), appId, 'iss claim must equal the appId');
  });

  it('includes iat claim set to approximately now (seconds)', async () => {
    const before = Math.floor(Date.now() / 1000);
    const jwt = await createGitHubJwt({ appId: '1', privateKey: 'hmac-test-key' });
    const after = Math.floor(Date.now() / 1000);
    const [, payloadB64] = jwt.split('.');
    const { iat } = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    assert.ok(iat >= before - 1 && iat <= after + 1, `iat (${iat}) must be within 1 second of now`);
  });

  it('includes exp claim set to approximately 10 minutes after iat', async () => {
    const jwt = await createGitHubJwt({ appId: '1', privateKey: 'hmac-test-key' });
    const [, payloadB64] = jwt.split('.');
    const { iat, exp } = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    const diff = exp - iat;
    assert.ok(diff >= 590 && diff <= 610, `exp - iat (${diff}s) must be approximately 600 seconds`);
  });
});

// ---------------------------------------------------------------------------
// 3. createGitHubJwt — rejects missing appId or privateKey
// ---------------------------------------------------------------------------

describe('createGitHubJwt — validation', () => {
  it('throws when appId is missing', async () => {
    await assert.rejects(
      () => createGitHubJwt({ privateKey: 'some-key' }),
      /appId/i,
      'must throw mentioning appId when appId is absent'
    );
  });

  it('throws when privateKey is missing', async () => {
    await assert.rejects(
      () => createGitHubJwt({ appId: '123' }),
      /privateKey/i,
      'must throw mentioning privateKey when privateKey is absent'
    );
  });

  it('throws when both appId and privateKey are missing', async () => {
    await assert.rejects(
      () => createGitHubJwt({}),
      /appId|privateKey/i,
      'must throw when both appId and privateKey are absent'
    );
  });
});

// ---------------------------------------------------------------------------
// 4. exchangeInstallationToken — calls correct GitHub API endpoint
// ---------------------------------------------------------------------------

describe('exchangeInstallationToken — API endpoint', () => {
  it('calls the correct installation access token endpoint', async () => {
    const calls = [];
    const mockFetch = async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 201,
        json: async () => ({ token: 'ghs_live_token', expires_at: '2025-01-01T00:10:00Z' })
      };
    };

    await exchangeInstallationToken({
      appJwt: 'fake.jwt.token',
      installationId: '42',
      fetchImpl: mockFetch
    });

    assert.equal(calls.length, 1, 'exactly one HTTP call must be made');
    assert.ok(
      calls[0].url.includes('/app/installations/42/access_tokens'),
      `URL must include /app/installations/42/access_tokens, got: ${calls[0].url}`
    );
  });

  it('sends Authorization header with Bearer JWT', async () => {
    const calls = [];
    const mockFetch = async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 201,
        json: async () => ({ token: 'ghs_x', expires_at: '2025-01-01T00:10:00Z' })
      };
    };

    await exchangeInstallationToken({
      appJwt: 'my.jwt.here',
      installationId: '7',
      fetchImpl: mockFetch
    });

    const authHeader = calls[0].options?.headers?.Authorization;
    assert.ok(authHeader, 'Authorization header must be present');
    assert.ok(authHeader.startsWith('Bearer '), 'Authorization header must use Bearer scheme');
    assert.ok(authHeader.includes('my.jwt.here'), 'Authorization header must include the JWT');
  });
});

// ---------------------------------------------------------------------------
// 5. exchangeInstallationToken — returns token and expiry
// ---------------------------------------------------------------------------

describe('exchangeInstallationToken — return value', () => {
  it('returns an object with token and expiresAt fields', async () => {
    const mockFetch = makeMockFetch({
      status: 201,
      body: { token: 'ghs_returned_token', expires_at: '2025-06-01T00:10:00Z' }
    });

    const result = await exchangeInstallationToken({
      appJwt: 'fake.jwt',
      installationId: '99',
      fetchImpl: mockFetch
    });

    assert.ok(result, 'result must be truthy');
    assert.equal(result.token, 'ghs_returned_token', 'result.token must match API response');
    assert.ok(result.expiresAt, 'result.expiresAt must be present');
  });

  it('throws when GitHub API returns an error status', async () => {
    const mockFetch = makeMockFetch({ status: 401, body: { message: 'Requires authentication' } });

    await assert.rejects(
      () => exchangeInstallationToken({ appJwt: 'bad.jwt', installationId: '1', fetchImpl: mockFetch }),
      /401|authentication|token/i,
      'must throw on non-2xx response'
    );
  });
});

// ---------------------------------------------------------------------------
// 6. GitHubGitForge.listRepositories — returns normalized repository list
// ---------------------------------------------------------------------------

describe('GitHubGitForge.listRepositories', () => {
  it('returns an array of normalized repository objects', async () => {
    const forge = makeForge({
      status: 200,
      body: {
        repositories: [
          { id: 1, name: 'repo-a', full_name: 'my-org/repo-a', private: true, default_branch: 'main', clone_url: 'https://github.com/my-org/repo-a.git' },
          { id: 2, name: 'repo-b', full_name: 'my-org/repo-b', private: false, default_branch: 'trunk', clone_url: 'https://github.com/my-org/repo-b.git' }
        ]
      }
    });

    const repos = await forge.listRepositories();

    assert.ok(Array.isArray(repos), 'listRepositories must return an array');
    assert.equal(repos.length, 2, 'must return both repositories');
    assert.equal(repos[0].name, 'repo-a', 'first repo name must match');
    assert.equal(repos[0].fullName, 'my-org/repo-a', 'fullName must be normalized from full_name');
    assert.equal(repos[0].private, true, 'private flag must be present');
    assert.equal(repos[0].defaultBranch, 'main', 'defaultBranch must be normalized from default_branch');
    assert.ok(repos[0].cloneUrl, 'cloneUrl must be present');
  });
});

// ---------------------------------------------------------------------------
// 7. GitHubGitForge.getPullRequest — returns normalized PR object
// ---------------------------------------------------------------------------

describe('GitHubGitForge.getPullRequest', () => {
  it('returns a normalized PR object with id, title, state, head, base', async () => {
    const forge = makeForge({
      status: 200,
      body: {
        number: 42,
        title: 'Add feature X',
        state: 'open',
        head: { ref: 'feature-x', sha: 'abc123' },
        base: { ref: 'main', sha: 'def456' },
        body: 'PR description',
        merged: false,
        html_url: 'https://github.com/my-org/repo/pull/42'
      }
    });

    const pr = await forge.getPullRequest({ repo: 'my-repo', pullNumber: 42 });

    assert.ok(pr, 'getPullRequest must return a value');
    assert.equal(pr.number, 42, 'PR number must match');
    assert.equal(pr.title, 'Add feature X', 'PR title must match');
    assert.equal(pr.state, 'open', 'PR state must match');
    assert.equal(pr.head.ref, 'feature-x', 'head.ref must be present');
    assert.equal(pr.base.ref, 'main', 'base.ref must be present');
    assert.equal(pr.merged, false, 'merged flag must be present');
  });
});

// ---------------------------------------------------------------------------
// 8. GitHubGitForge.createPullRequest — sends correct payload
// ---------------------------------------------------------------------------

describe('GitHubGitForge.createPullRequest', () => {
  it('sends POST to correct endpoint with title, head, base, body', async () => {
    const calls = [];
    const forge = new GitHubGitForge({
      owner: 'my-org',
      installationToken: 'ghs_test',
      fetchImpl: async (url, options) => {
        calls.push({ url, method: options?.method, body: options?.body ? JSON.parse(options.body) : undefined });
        return { ok: true, status: 201, json: async () => ({ number: 1, title: 'Test PR', state: 'open', head: { ref: 'feat', sha: 'aaa' }, base: { ref: 'main', sha: 'bbb' }, body: '', merged: false, html_url: '' }) };
      }
    });

    await forge.createPullRequest({ repo: 'my-repo', title: 'Test PR', head: 'feat-branch', base: 'main', body: 'PR body text' });

    assert.equal(calls.length, 1, 'exactly one HTTP call must be made');
    assert.equal(calls[0].method, 'POST', 'must use POST method');
    assert.ok(calls[0].url.includes('/repos/my-org/my-repo/pulls'), `URL must target pulls endpoint, got ${calls[0].url}`);
    assert.equal(calls[0].body.title, 'Test PR', 'payload must include title');
    assert.equal(calls[0].body.head, 'feat-branch', 'payload must include head');
    assert.equal(calls[0].body.base, 'main', 'payload must include base');
    assert.equal(calls[0].body.body, 'PR body text', 'payload must include body');
  });
});

// ---------------------------------------------------------------------------
// 9. GitHubGitForge.mergePullRequest — validates merge method
// ---------------------------------------------------------------------------

describe('GitHubGitForge.mergePullRequest', () => {
  it('accepts valid merge methods: merge, squash, rebase', async () => {
    for (const mergeMethod of ['merge', 'squash', 'rebase']) {
      const calls = [];
      const forge = new GitHubGitForge({
        owner: 'my-org',
        installationToken: 'ghs_test',
        fetchImpl: async (url, options) => {
          calls.push({ url, body: options?.body ? JSON.parse(options.body) : undefined });
          return { ok: true, status: 200, json: async () => ({ merged: true, message: 'Pull Request successfully merged', sha: 'abc' }) };
        }
      });
      const result = await forge.mergePullRequest({ repo: 'my-repo', pullNumber: 1, mergeMethod });
      assert.equal(result.merged, true, `merge with method "${mergeMethod}" must succeed`);
      assert.equal(calls[0].body.merge_method, mergeMethod, `payload must include merge_method="${mergeMethod}"`);
    }
  });

  it('rejects invalid merge method with a descriptive error', async () => {
    const forge = makeForge();
    await assert.rejects(
      () => forge.mergePullRequest({ repo: 'my-repo', pullNumber: 1, mergeMethod: 'fast-forward' }),
      /mergeMethod|merge_method|merge|squash|rebase/i,
      'must throw on invalid mergeMethod'
    );
  });
});

// ---------------------------------------------------------------------------
// 10. GitHubGitForge.listRefs — returns branches and tags
// ---------------------------------------------------------------------------

describe('GitHubGitForge.listRefs', () => {
  it('returns normalized branches and tags from the repository', async () => {
    const forge = new GitHubGitForge({
      owner: 'my-org',
      installationToken: 'ghs_test',
      fetchImpl: makeMockFetch([
        {
          status: 200,
          body: [
            { name: 'main', commit: { sha: 'abc123' }, protected: true },
            { name: 'develop', commit: { sha: 'def456' }, protected: false }
          ]
        },
        {
          status: 200,
          body: [
            { name: 'v1.0.0', commit: { sha: 'tag123' }, tarball_url: 'https://...' }
          ]
        }
      ])
    });

    const refs = await forge.listRefs({ repo: 'my-repo' });

    assert.ok(refs, 'listRefs must return a value');
    assert.ok(Array.isArray(refs.branches), 'refs.branches must be an array');
    assert.ok(Array.isArray(refs.tags), 'refs.tags must be an array');
    assert.equal(refs.branches.length, 2, 'must return 2 branches');
    assert.equal(refs.branches[0].name, 'main', 'first branch name must be "main"');
    assert.equal(refs.branches[0].sha, 'abc123', 'branch sha must be present');
    assert.equal(refs.branches[0].protected, true, 'branch protected flag must be present');
    assert.equal(refs.tags.length, 1, 'must return 1 tag');
    assert.equal(refs.tags[0].name, 'v1.0.0', 'tag name must match');
  });
});

// ---------------------------------------------------------------------------
// 11. GitHubGitForge.syncDeployKeys — compares desired vs current keys
// ---------------------------------------------------------------------------

describe('GitHubGitForge.syncDeployKeys', () => {
  it('adds missing keys and removes extra keys', async () => {
    const calls = [];
    const forge = new GitHubGitForge({
      owner: 'my-org',
      installationToken: 'ghs_test',
      fetchImpl: async (url, options = {}) => {
        calls.push({ url, method: options.method ?? 'GET', body: options.body ? JSON.parse(options.body) : undefined });
        if ((options.method ?? 'GET') === 'GET') {
          return {
            ok: true, status: 200,
            json: async () => [
              { id: 101, title: 'old-key', key: 'ssh-rsa OLDKEY', read_only: true }
            ]
          };
        }
        return { ok: true, status: 201, json: async () => ({ id: 102, title: 'new-key' }) };
      }
    });

    const result = await forge.syncDeployKeys({
      repo: 'my-repo',
      desiredKeys: [{ title: 'new-key', key: 'ssh-rsa NEWKEY', readOnly: true }]
    });

    assert.ok(result, 'syncDeployKeys must return a result');
    const deleteCalls = calls.filter(c => c.method === 'DELETE');
    const postCalls = calls.filter(c => c.method === 'POST');
    assert.equal(deleteCalls.length, 1, 'must delete the extra key');
    assert.ok(deleteCalls[0].url.includes('101'), 'must delete key with id 101');
    assert.equal(postCalls.length, 1, 'must add the new key');
    assert.equal(postCalls[0].body.title, 'new-key', 'must POST correct title');
  });

  it('returns a summary with added and removed counts', async () => {
    const forge = new GitHubGitForge({
      owner: 'my-org',
      installationToken: 'ghs_test',
      fetchImpl: async (url, options = {}) => {
        if ((options.method ?? 'GET') === 'GET') {
          return { ok: true, status: 200, json: async () => [] };
        }
        return { ok: true, status: 201, json: async () => ({ id: 1, title: 'k1' }) };
      }
    });

    const result = await forge.syncDeployKeys({
      repo: 'my-repo',
      desiredKeys: [{ title: 'k1', key: 'ssh-rsa KEY1', readOnly: false }]
    });

    assert.ok('added' in result, 'result must have added count');
    assert.ok('removed' in result, 'result must have removed count');
    assert.equal(result.added, 1, 'must report 1 added key');
    assert.equal(result.removed, 0, 'must report 0 removed keys');
  });
});

// ---------------------------------------------------------------------------
// 12. GitHubGitForge.syncBranchProtection — sends protection config
// ---------------------------------------------------------------------------

describe('GitHubGitForge.syncBranchProtection', () => {
  it('sends PUT to the branch protection endpoint with correct config', async () => {
    const calls = [];
    const forge = new GitHubGitForge({
      owner: 'my-org',
      installationToken: 'ghs_test',
      fetchImpl: async (url, options = {}) => {
        calls.push({ url, method: options.method, body: options.body ? JSON.parse(options.body) : undefined });
        return { ok: true, status: 200, json: async () => ({ url, required_status_checks: null }) };
      }
    });

    await forge.syncBranchProtection({
      repo: 'my-repo',
      branch: 'main',
      requiredReviews: 2,
      requiredStatusChecks: ['ci/build', 'ci/test'],
      dismissStaleReviews: true
    });

    assert.equal(calls.length, 1, 'exactly one HTTP call must be made');
    assert.equal(calls[0].method, 'PUT', 'must use PUT method');
    assert.ok(calls[0].url.includes('/repos/my-org/my-repo/branches/main/protection'), `URL must target protection endpoint, got: ${calls[0].url}`);
    const body = calls[0].body;
    assert.ok(body, 'request body must be present');
    assert.ok(body.required_pull_request_reviews || body.required_status_checks !== undefined, 'body must include protection config');
  });

  it('sends required_approving_review_count matching requiredReviews', async () => {
    const calls = [];
    const forge = new GitHubGitForge({
      owner: 'my-org',
      installationToken: 'ghs_test',
      fetchImpl: async (url, options = {}) => {
        calls.push({ body: options.body ? JSON.parse(options.body) : undefined });
        return { ok: true, status: 200, json: async () => ({}) };
      }
    });

    await forge.syncBranchProtection({ repo: 'my-repo', branch: 'main', requiredReviews: 3 });

    const body = calls[0].body;
    assert.equal(
      body?.required_pull_request_reviews?.required_approving_review_count,
      3,
      'must set required_approving_review_count to 3'
    );
  });
});

// ---------------------------------------------------------------------------
// 13. GitHubGitForge implements the gitForge interface contract
// ---------------------------------------------------------------------------

describe('GitHubGitForge — interface contract', () => {
  it('exposes all required git forge interface methods', () => {
    const forge = makeForge();
    const requiredMethods = [
      'listRepositories',
      'getPullRequest',
      'createPullRequest',
      'mergePullRequest',
      'listRefs',
      'syncDeployKeys',
      'syncBranchProtection'
    ];
    for (const method of requiredMethods) {
      assert.equal(typeof forge[method], 'function', `GitHubGitForge must expose method: ${method}`);
    }
  });

  it('has a role property identifying it as github-git-forge', () => {
    const forge = makeForge();
    assert.equal(forge.role, 'github-git-forge', 'role must be "github-git-forge"');
  });
});

// ---------------------------------------------------------------------------
// 14. createGitHubProvider — returns a valid ExternalProviderAdapter
// ---------------------------------------------------------------------------

describe('createGitHubProvider', () => {
  it('returns an object with required ExternalProviderAdapter fields', () => {
    const provider = createGitHubProvider({
      appId: '12345',
      privateKey: 'test-key',
      installationId: '42'
    });

    assert.ok(provider, 'createGitHubProvider must return a value');
    assert.equal(provider.type, 'github', 'provider.type must be "github"');
    assert.equal(typeof provider.createForge, 'function', 'provider must expose createForge function');
    assert.ok(provider.config, 'provider must expose config');
  });

  it('throws when required fields are missing', () => {
    assert.throws(
      () => createGitHubProvider({ privateKey: 'key' }),
      /appId/i,
      'must throw when appId is missing'
    );
    assert.throws(
      () => createGitHubProvider({ appId: '1' }),
      /privateKey/i,
      'must throw when privateKey is missing'
    );
  });
});

// ---------------------------------------------------------------------------
// 15. GITHUB_GIT_FORGE_BOUNDARY — boundary object export
// ---------------------------------------------------------------------------

describe('GITHUB_GIT_FORGE_BOUNDARY', () => {
  it('is exported with correct role', () => {
    assert.ok(GITHUB_GIT_FORGE_BOUNDARY, 'GITHUB_GIT_FORGE_BOUNDARY must be exported');
    assert.equal(GITHUB_GIT_FORGE_BOUNDARY.role, 'github-git-forge', 'role must be "github-git-forge"');
    assert.ok(Array.isArray(GITHUB_GIT_FORGE_BOUNDARY.owns), 'BOUNDARY must declare owned concerns');
    assert.ok(GITHUB_GIT_FORGE_BOUNDARY.scope, 'BOUNDARY must declare scope');
  });
});
