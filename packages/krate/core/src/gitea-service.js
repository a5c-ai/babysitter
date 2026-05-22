import { createGiteaBackend } from './gitea-backend.js';

/**
 * Gitea service layer that wraps gitea-backend.js for repo code-browsing operations.
 *
 * Returns null when Gitea is not configured so call-sites can fall back to mock data.
 *
 * @param {{ giteaUrl?: string, token?: string, fetchImpl?: Function }} [options]
 * @returns {GiteaService|null}
 */
export function createGiteaService(options = {}) {
  const giteaUrl = options.giteaUrl || process.env.KRATE_GITEA_HTTP_URL;
  if (!giteaUrl) return null; // Gitea not configured — callers must fall back

  const backend = createGiteaBackend({
    baseUrl: giteaUrl,
    token: options.token || process.env.KRATE_GITEA_TOKEN,
    fetchImpl: options.fetchImpl || globalThis.fetch,
  });

  // Low-level fetch helper that bypasses the backend's opinionated error handling
  // so service methods can gracefully return null on 404 rather than throwing.
  const root = giteaUrl.replace(/\/$/, '');
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const token = options.token || process.env.KRATE_GITEA_TOKEN;

  async function rawRequest(path) {
    if (!fetchImpl) throw new Error('Gitea service requires a fetch implementation');
    const response = await fetchImpl(`${root}/api/v1${path}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `token ${token}` } : {}),
      },
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Gitea GET ${path} failed with ${response.status}`);
    }
    return response.json();
  }

  async function rawRawRequest(path) {
    if (!fetchImpl) throw new Error('Gitea service requires a fetch implementation');
    const response = await fetchImpl(`${root}/api/v1${path}`, {
      method: 'GET',
      headers: {
        Accept: 'text/plain',
        ...(token ? { Authorization: `token ${token}` } : {}),
      },
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Gitea GET ${path} failed with ${response.status}`);
    }
    return response.text();
  }

  return {
    available: true,
    baseUrl: root,

    /**
     * List tree entries for a repository path at a given ref.
     * Uses GET /api/v1/repos/{owner}/{repo}/contents/{path}?ref={ref}
     *
     * @param {string} org
     * @param {string} repo
     * @param {string} ref  — branch name, tag, or commit SHA
     * @param {string} [path='']
     * @returns {Promise<Array<{path:string,type:'blob'|'tree',size:number}>|null>}
     */
    async listTree(org, repo, ref, path = '') {
      const encodedPath = path ? encodeURIComponent(path).replace(/%2F/g, '/') : '';
      const apiPath = `/repos/${encodeURIComponent(org)}/${encodeURIComponent(repo)}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`;
      const data = await rawRequest(apiPath);
      if (data === null) return null;

      // Gitea returns an array for directories, an object for files
      const entries = Array.isArray(data) ? data : [data];
      return entries.map((entry) => ({
        path: entry.path || entry.name,
        type: entry.type === 'dir' ? 'tree' : 'blob',
        size: entry.size || 0,
        sha: entry.sha,
        name: entry.name,
      }));
    },

    /**
     * Get the raw text content of a file.
     * Uses GET /api/v1/repos/{owner}/{repo}/raw/{filepath}?ref={ref}
     *
     * @param {string} org
     * @param {string} repo
     * @param {string} ref
     * @param {string} path
     * @returns {Promise<string|null>}
     */
    async getBlob(org, repo, ref, path) {
      const encodedPath = path ? encodeURIComponent(path).replace(/%2F/g, '/') : '';
      const apiPath = `/repos/${encodeURIComponent(org)}/${encodeURIComponent(repo)}/raw/${encodedPath}?ref=${encodeURIComponent(ref)}`;
      return rawRawRequest(apiPath);
    },

    /**
     * List branches for a repository.
     * Uses GET /api/v1/repos/{owner}/{repo}/branches
     *
     * @param {string} org
     * @param {string} repo
     * @returns {Promise<Array<{name:string,sha:string,protected:boolean}>|null>}
     */
    async listBranches(org, repo) {
      const data = await rawRequest(`/repos/${encodeURIComponent(org)}/${encodeURIComponent(repo)}/branches`);
      if (data === null) return null;
      return data.map((b) => ({
        name: b.name,
        sha: b.commit?.id || b.commit?.sha || '',
        protected: b.protected || false,
      }));
    },

    /**
     * Get file metadata + base64-decoded content for a path.
     * Uses GET /api/v1/repos/{owner}/{repo}/contents/{path}?ref={ref}
     *
     * @param {string} org
     * @param {string} repo
     * @param {string} ref
     * @param {string} path
     * @returns {Promise<{path:string,content:string,size:number,sha:string,encoding:string}|null>}
     */
    async getFileContent(org, repo, ref, path) {
      const encodedPath = path ? encodeURIComponent(path).replace(/%2F/g, '/') : '';
      const apiPath = `/repos/${encodeURIComponent(org)}/${encodeURIComponent(repo)}/contents/${encodedPath}?ref=${encodeURIComponent(ref)}`;
      const data = await rawRequest(apiPath);
      if (data === null || Array.isArray(data)) return null; // null = not found, array = directory

      // Gitea returns content as base64 — decode it
      const rawContent = data.content
        ? Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8')
        : '';

      return {
        path: data.path || path,
        content: rawContent,
        size: data.size || Buffer.byteLength(rawContent, 'utf8'),
        sha: data.sha,
        encoding: 'utf-8',
        lastCommit: data.last_commit_sha || null,
      };
    },

    /**
     * Create a repository inside an org.
     * Delegates to the underlying gitea-backend.
     *
     * @param {string} org
     * @param {string} name
     * @param {{ private?: boolean, defaultBranch?: string, description?: string }} [repoOptions]
     */
    async createRepository(org, name, repoOptions = {}) {
      return backend.createRepository({
        owner: org,
        name,
        private: repoOptions.private ?? true,
        defaultBranch: repoOptions.defaultBranch || 'main',
        description: repoOptions.description || '',
      });
    },
  };
}
