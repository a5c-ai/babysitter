// GitHub Git Forge implementation — Slice 3.3a
// Implements the gitForge interface contract:
//   listRepositories, getPullRequest, createPullRequest, mergePullRequest,
//   listRefs, syncDeployKeys, syncBranchProtection
//
// All HTTP calls are injected via fetchImpl for full testability.

const GITHUB_API = 'https://api.github.com';
const VALID_MERGE_METHODS = new Set(['merge', 'squash', 'rebase']);

/**
 * @typedef {{ name: string, fullName: string, private: boolean, defaultBranch: string, cloneUrl: string }} NormalizedRepo
 * @typedef {{ number: number, title: string, state: string, head: object, base: object, body: string, merged: boolean, htmlUrl: string }} NormalizedPR
 * @typedef {{ name: string, sha: string, protected: boolean }} NormalizedBranch
 * @typedef {{ name: string, sha: string }} NormalizedTag
 */

/**
 * GitHub implementation of the git forge interface.
 *
 * @param {{ owner: string, installationToken: string, fetchImpl?: Function }} opts
 */
export class GitHubGitForge {
  constructor({ owner, installationToken, fetchImpl = globalThis.fetch } = {}) {
    if (!owner) throw new Error('GitHubGitForge: owner (org or user) is required');
    if (!installationToken) throw new Error('GitHubGitForge: installationToken is required');
    if (!fetchImpl) throw new Error('GitHubGitForge: a fetch implementation is required');

    this.role = 'github-git-forge';
    this._owner = owner;
    this._token = installationToken;
    this._fetch = fetchImpl;
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  _headers() {
    return {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${this._token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json'
    };
  }

  async _request(method, path, body) {
    const url = `${GITHUB_API}${path}`;
    const options = {
      method,
      headers: this._headers(),
      ...(body !== undefined ? { body: JSON.stringify(body) } : {})
    };
    const response = await this._fetch(url, options);
    if (!response.ok) {
      throw new Error(`GitHub ${method} ${path} failed with status ${response.status}`);
    }
    if (response.status === 204) return null;
    return response.json();
  }

  _repoPath(repo, suffix = '') {
    return `/repos/${encodeURIComponent(this._owner)}/${encodeURIComponent(repo)}${suffix}`;
  }

  // ---------------------------------------------------------------------------
  // Interface methods
  // ---------------------------------------------------------------------------

  /**
   * List all repositories for the installation.
   * @returns {Promise<NormalizedRepo[]>}
   */
  async listRepositories() {
    const data = await this._request('GET', `/installation/repositories`);
    const repos = data?.repositories ?? data ?? [];
    return repos.map(r => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      private: r.private,
      defaultBranch: r.default_branch,
      cloneUrl: r.clone_url,
      sshUrl: r.ssh_url
    }));
  }

  /**
   * Get a single pull request by number.
   * @param {{ repo: string, pullNumber: number }} opts
   * @returns {Promise<NormalizedPR>}
   */
  async getPullRequest({ repo, pullNumber }) {
    const data = await this._request('GET', this._repoPath(repo, `/pulls/${pullNumber}`));
    return this._normalizePR(data);
  }

  /**
   * Create a pull request.
   * @param {{ repo: string, title: string, head: string, base: string, body?: string }} opts
   * @returns {Promise<NormalizedPR>}
   */
  async createPullRequest({ repo, title, head, base, body = '' }) {
    const data = await this._request('POST', this._repoPath(repo, '/pulls'), {
      title,
      head,
      base,
      body
    });
    return this._normalizePR(data);
  }

  /**
   * Merge a pull request.
   * @param {{ repo: string, pullNumber: number, mergeMethod?: 'merge'|'squash'|'rebase', commitTitle?: string }} opts
   * @returns {Promise<{ merged: boolean, sha: string, message: string }>}
   */
  async mergePullRequest({ repo, pullNumber, mergeMethod = 'merge', commitTitle } = {}) {
    if (!VALID_MERGE_METHODS.has(mergeMethod)) {
      throw new Error(
        `GitHubGitForge.mergePullRequest: invalid mergeMethod "${mergeMethod}". ` +
        `Valid values are: ${[...VALID_MERGE_METHODS].join(', ')}`
      );
    }
    const payload = { merge_method: mergeMethod };
    if (commitTitle) payload.commit_title = commitTitle;
    const data = await this._request('PUT', this._repoPath(repo, `/pulls/${pullNumber}/merge`), payload);
    return {
      merged: data?.merged ?? true,
      sha: data?.sha ?? '',
      message: data?.message ?? ''
    };
  }

  /**
   * List branches and tags for a repository.
   * @param {{ repo: string }} opts
   * @returns {Promise<{ branches: NormalizedBranch[], tags: NormalizedTag[] }>}
   */
  async listRefs({ repo }) {
    const [branchData, tagData] = await Promise.all([
      this._request('GET', this._repoPath(repo, '/branches')),
      this._request('GET', this._repoPath(repo, '/tags'))
    ]);

    const branches = (branchData ?? []).map(b => ({
      name: b.name,
      sha: b.commit?.sha ?? b.sha,
      protected: b.protected ?? false
    }));

    const tags = (tagData ?? []).map(t => ({
      name: t.name,
      sha: t.commit?.sha ?? t.sha
    }));

    return { branches, tags };
  }

  /**
   * Sync deploy keys: add missing, remove extra.
   * @param {{ repo: string, desiredKeys: Array<{ title: string, key: string, readOnly: boolean }> }} opts
   * @returns {Promise<{ added: number, removed: number }>}
   */
  async syncDeployKeys({ repo, desiredKeys = [] }) {
    const current = await this._request('GET', this._repoPath(repo, '/keys'));
    const currentList = current ?? [];

    // Find keys to remove (title not in desired)
    const desiredTitles = new Set(desiredKeys.map(k => k.title));
    const toRemove = currentList.filter(k => !desiredTitles.has(k.title));

    // Find keys to add (title not in current)
    const currentTitles = new Set(currentList.map(k => k.title));
    const toAdd = desiredKeys.filter(k => !currentTitles.has(k.title));

    // Perform deletions
    await Promise.all(toRemove.map(k =>
      this._request('DELETE', this._repoPath(repo, `/keys/${k.id}`))
    ));

    // Perform additions
    await Promise.all(toAdd.map(k =>
      this._request('POST', this._repoPath(repo, '/keys'), {
        title: k.title,
        key: k.key,
        read_only: k.readOnly ?? true
      })
    ));

    return { added: toAdd.length, removed: toRemove.length };
  }

  /**
   * Sync branch protection rules.
   * @param {{ repo: string, branch: string, requiredReviews?: number, requiredStatusChecks?: string[], dismissStaleReviews?: boolean, enforceAdmins?: boolean }} opts
   * @returns {Promise<object>}
   */
  async syncBranchProtection({
    repo,
    branch = 'main',
    requiredReviews = 1,
    requiredStatusChecks = [],
    dismissStaleReviews = false,
    enforceAdmins = false
  } = {}) {
    const payload = {
      required_status_checks: requiredStatusChecks.length > 0
        ? { strict: true, contexts: requiredStatusChecks }
        : null,
      enforce_admins: enforceAdmins,
      required_pull_request_reviews: {
        dismiss_stale_reviews: dismissStaleReviews,
        require_code_owner_reviews: false,
        required_approving_review_count: requiredReviews
      },
      restrictions: null
    };

    return this._request('PUT', this._repoPath(repo, `/branches/${encodeURIComponent(branch)}/protection`), payload);
  }

  // ---------------------------------------------------------------------------
  // Internal normalizer
  // ---------------------------------------------------------------------------

  _normalizePR(data) {
    return {
      number: data.number,
      title: data.title,
      state: data.state,
      head: { ref: data.head?.ref, sha: data.head?.sha },
      base: { ref: data.base?.ref, sha: data.base?.sha },
      body: data.body ?? '',
      merged: data.merged ?? false,
      htmlUrl: data.html_url ?? ''
    };
  }
}
