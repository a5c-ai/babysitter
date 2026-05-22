import assert from 'node:assert/strict';
import test from 'node:test';
import { createGiteaService } from '../src/gitea-service.js';

// ---------------------------------------------------------------------------
// Helpers — minimal fetch mocks
// ---------------------------------------------------------------------------

function makeFetch(responses) {
  // responses: Map<string, { status, body, isText? }>
  return async (url) => {
    const match = [...responses.entries()].find(([pattern]) => url.includes(pattern));
    if (!match) {
      return {
        ok: false,
        status: 404,
        json: async () => null,
        text: async () => '',
      };
    }
    const [, { status = 200, body, isText = false }] = match;
    const ok = status >= 200 && status < 300;
    return {
      ok,
      status,
      json: async () => (isText ? body : body),
      text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
    };
  };
}

// ---------------------------------------------------------------------------
// 1. No URL → null
// ---------------------------------------------------------------------------

test('createGiteaService returns null when no URL is configured', () => {
  const originalEnv = process.env.KRATE_GITEA_HTTP_URL;
  delete process.env.KRATE_GITEA_HTTP_URL;
  try {
    const service = createGiteaService({});
    assert.equal(service, null, 'should return null when giteaUrl is absent');
  } finally {
    if (originalEnv !== undefined) process.env.KRATE_GITEA_HTTP_URL = originalEnv;
  }
});

// ---------------------------------------------------------------------------
// 2. URL provided → service object
// ---------------------------------------------------------------------------

test('createGiteaService returns a service object when a URL is provided', () => {
  const service = createGiteaService({ giteaUrl: 'http://localhost:3000', fetchImpl: makeFetch(new Map()) });
  assert.ok(service !== null, 'should return a service');
  assert.equal(service.available, true, 'available should be true');
  assert.ok(typeof service.listTree === 'function', 'has listTree');
  assert.ok(typeof service.getBlob === 'function', 'has getBlob');
  assert.ok(typeof service.listBranches === 'function', 'has listBranches');
  assert.ok(typeof service.getFileContent === 'function', 'has getFileContent');
  assert.ok(typeof service.createRepository === 'function', 'has createRepository');
});

// ---------------------------------------------------------------------------
// 3. listTree — calls correct Gitea endpoint
// ---------------------------------------------------------------------------

test('listTree calls the Gitea contents endpoint and maps type:dir to tree', async () => {
  const captured = [];
  const fetchImpl = async (url, opts) => {
    captured.push(url);
    return {
      ok: true,
      status: 200,
      json: async () => [
        { name: 'src', path: 'src', type: 'dir', size: 0, sha: 'abc' },
        { name: 'README.md', path: 'README.md', type: 'file', size: 512, sha: 'def' },
      ],
      text: async () => '',
    };
  };

  const service = createGiteaService({ giteaUrl: 'http://localhost:3000', fetchImpl });
  const entries = await service.listTree('myorg', 'myrepo', 'main', '');

  assert.ok(captured[0].includes('/repos/myorg/myrepo/contents/'), 'called contents endpoint');
  assert.ok(captured[0].includes('ref=main'), 'passed ref param');

  assert.equal(entries.length, 2, 'should return 2 entries');
  const dir = entries.find((e) => e.name === 'src');
  assert.equal(dir.type, 'tree', 'type:dir should map to tree');
  const file = entries.find((e) => e.name === 'README.md');
  assert.equal(file.type, 'blob', 'type:file should map to blob');
  assert.equal(file.size, 512, 'size is preserved');
});

// ---------------------------------------------------------------------------
// 4. listTree — returns null for 404
// ---------------------------------------------------------------------------

test('listTree returns null when Gitea responds with 404', async () => {
  const fetchImpl = async () => ({ ok: false, status: 404, json: async () => null, text: async () => '' });
  const service = createGiteaService({ giteaUrl: 'http://localhost:3000', fetchImpl });
  const result = await service.listTree('org', 'missing-repo', 'main', '');
  assert.equal(result, null, 'should return null for 404');
});

// ---------------------------------------------------------------------------
// 5. getBlob — calls raw endpoint and returns text
// ---------------------------------------------------------------------------

test('getBlob calls the Gitea raw endpoint and returns file text', async () => {
  const capturedUrls = [];
  const expectedContent = 'console.log("hello");\n';
  const fetchImpl = async (url) => {
    capturedUrls.push(url);
    return {
      ok: true,
      status: 200,
      json: async () => null,
      text: async () => expectedContent,
    };
  };

  const service = createGiteaService({ giteaUrl: 'http://localhost:3000', fetchImpl });
  const content = await service.getBlob('myorg', 'myrepo', 'main', 'src/index.js');

  assert.ok(capturedUrls[0].includes('/repos/myorg/myrepo/raw/'), 'called raw endpoint');
  assert.ok(capturedUrls[0].includes('ref=main'), 'passed ref param');
  assert.equal(content, expectedContent, 'returned raw file text');
});

// ---------------------------------------------------------------------------
// 6. getBlob — returns null for 404
// ---------------------------------------------------------------------------

test('getBlob returns null when file is not found in Gitea', async () => {
  const fetchImpl = async () => ({ ok: false, status: 404, json: async () => null, text: async () => '' });
  const service = createGiteaService({ giteaUrl: 'http://localhost:3000', fetchImpl });
  const result = await service.getBlob('org', 'repo', 'main', 'nonexistent.js');
  assert.equal(result, null, 'should return null for missing file');
});

// ---------------------------------------------------------------------------
// 7. listBranches — maps branch response correctly
// ---------------------------------------------------------------------------

test('listBranches returns array with name, sha, protected fields', async () => {
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    json: async () => [
      { name: 'main', commit: { id: 'sha-main' }, protected: true },
      { name: 'dev', commit: { id: 'sha-dev' }, protected: false },
    ],
    text: async () => '',
  });

  const service = createGiteaService({ giteaUrl: 'http://localhost:3000', fetchImpl });
  const branches = await service.listBranches('myorg', 'myrepo');

  assert.equal(branches.length, 2, 'two branches returned');
  assert.equal(branches[0].name, 'main');
  assert.equal(branches[0].sha, 'sha-main');
  assert.equal(branches[0].protected, true);
  assert.equal(branches[1].name, 'dev');
  assert.equal(branches[1].protected, false);
});

// ---------------------------------------------------------------------------
// 8. getFileContent — decodes base64 content
// ---------------------------------------------------------------------------

test('getFileContent decodes base64 content from Gitea response', async () => {
  const originalText = 'export default function hello() {}\n';
  const b64 = Buffer.from(originalText).toString('base64');

  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    json: async () => ({
      path: 'src/hello.js',
      size: originalText.length,
      sha: 'abc123',
      content: b64,
      last_commit_sha: 'commitsha',
    }),
    text: async () => '',
  });

  const service = createGiteaService({ giteaUrl: 'http://localhost:3000', fetchImpl });
  const file = await service.getFileContent('myorg', 'myrepo', 'main', 'src/hello.js');

  assert.equal(file.content, originalText, 'content decoded from base64');
  assert.equal(file.path, 'src/hello.js', 'path preserved');
  assert.equal(file.sha, 'abc123', 'sha preserved');
  assert.equal(file.lastCommit, 'commitsha', 'lastCommit mapped');
});

// ---------------------------------------------------------------------------
// 9. Error handling — non-404 errors propagate
// ---------------------------------------------------------------------------

test('listTree throws when Gitea returns a non-404 error status', async () => {
  const fetchImpl = async () => ({ ok: false, status: 500, json: async () => null, text: async () => '' });
  const service = createGiteaService({ giteaUrl: 'http://localhost:3000', fetchImpl });

  await assert.rejects(
    () => service.listTree('org', 'repo', 'main', ''),
    /500/,
    'should throw on 500 error'
  );
});

// ---------------------------------------------------------------------------
// 10. createGiteaService picks up KRATE_GITEA_HTTP_URL from env
// ---------------------------------------------------------------------------

test('createGiteaService reads KRATE_GITEA_HTTP_URL from environment', () => {
  const original = process.env.KRATE_GITEA_HTTP_URL;
  process.env.KRATE_GITEA_HTTP_URL = 'http://gitea-from-env:3000';
  try {
    const fetchImpl = makeFetch(new Map());
    const service = createGiteaService({ fetchImpl });
    assert.ok(service !== null, 'should return a service when env var is set');
    assert.equal(service.baseUrl, 'http://gitea-from-env:3000', 'baseUrl should match env var');
  } finally {
    if (original !== undefined) process.env.KRATE_GITEA_HTTP_URL = original;
    else delete process.env.KRATE_GITEA_HTTP_URL;
  }
});

// ---------------------------------------------------------------------------
// 11. listTree — subdirectory path is URL-encoded correctly
// ---------------------------------------------------------------------------

test('listTree encodes subdirectory path in the API URL', async () => {
  const capturedUrls = [];
  const fetchImpl = async (url) => {
    capturedUrls.push(url);
    return {
      ok: true,
      status: 200,
      json: async () => [{ name: 'App.jsx', path: 'src/components/App.jsx', type: 'file', size: 100, sha: 'x' }],
      text: async () => '',
    };
  };

  const service = createGiteaService({ giteaUrl: 'http://localhost:3000', fetchImpl });
  await service.listTree('org', 'repo', 'main', 'src/components');

  // The path 'src/components' should appear in the URL (slashes may or may not be encoded)
  assert.ok(capturedUrls[0].includes('src'), 'URL contains path segment src');
  assert.ok(capturedUrls[0].includes('components'), 'URL contains path segment components');
});
