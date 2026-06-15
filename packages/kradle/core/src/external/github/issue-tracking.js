// GitHub Issue Tracking implementation — Slice 3.3b
// Implements the issueTracking interface contract:
//   listIssues, createIssue, updateIssue, closeIssue, listComments, createComment
//
// All HTTP calls are injected via fetchImpl for full testability.

const GITHUB_API = 'https://api.github.com';

/**
 * @typedef {{ number: number, title: string, state: string, body: string, labels: string[], author: string, htmlUrl: string }} NormalizedIssue
 * @typedef {{ id: number, body: string, author: string, createdAt: string, htmlUrl: string }} NormalizedComment
 */

/**
 * GitHub implementation of the issueTracking interface.
 *
 * @param {{ owner: string, installationToken: string, fetchImpl?: Function }} opts
 */
export class GitHubIssueTracking {
  constructor({ owner, installationToken, fetchImpl = globalThis.fetch } = {}) {
    if (!owner) throw new Error('GitHubIssueTracking: owner (org or user) is required');
    if (!installationToken) throw new Error('GitHubIssueTracking: installationToken is required');
    if (!fetchImpl) throw new Error('GitHubIssueTracking: a fetch implementation is required');

    this.role = 'github-issue-tracking';
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
  // Normalizers
  // ---------------------------------------------------------------------------

  _normalizeIssue(data) {
    return {
      id: data.id,
      number: data.number,
      title: data.title,
      state: data.state,
      body: data.body ?? '',
      labels: (data.labels ?? []).map(l => (typeof l === 'string' ? l : l.name)),
      author: data.user?.login ?? '',
      htmlUrl: data.html_url ?? ''
    };
  }

  _normalizeComment(data) {
    return {
      id: data.id,
      body: data.body ?? '',
      author: data.user?.login ?? '',
      createdAt: data.created_at ?? '',
      htmlUrl: data.html_url ?? ''
    };
  }

  // ---------------------------------------------------------------------------
  // Interface methods
  // ---------------------------------------------------------------------------

  /**
   * List issues for a repository.
   * @param {{ repo: string, state?: 'open'|'closed'|'all' }} opts
   * @returns {Promise<NormalizedIssue[]>}
   */
  async listIssues({ repo, state = 'open' } = {}) {
    const data = await this._request('GET', this._repoPath(repo, `/issues?state=${state}`));
    const issues = data ?? [];
    return issues.map(i => this._normalizeIssue(i));
  }

  /**
   * Create an issue.
   * @param {{ repo: string, title: string, body?: string, labels?: string[] }} opts
   * @returns {Promise<NormalizedIssue>}
   */
  async createIssue({ repo, title, body = '', labels = [] }) {
    const data = await this._request('POST', this._repoPath(repo, '/issues'), {
      title,
      body,
      ...(labels.length > 0 ? { labels } : {})
    });
    return this._normalizeIssue(data);
  }

  /**
   * Update an issue (title, body, labels).
   * @param {{ repo: string, issueNumber: number, title?: string, body?: string, labels?: string[] }} opts
   * @returns {Promise<NormalizedIssue>}
   */
  async updateIssue({ repo, issueNumber, title, body, labels } = {}) {
    const payload = {};
    if (title !== undefined) payload.title = title;
    if (body !== undefined) payload.body = body;
    if (labels !== undefined) payload.labels = labels;
    const data = await this._request('PATCH', this._repoPath(repo, `/issues/${issueNumber}`), payload);
    return this._normalizeIssue(data);
  }

  /**
   * Close an issue by setting its state to 'closed'.
   * @param {{ repo: string, issueNumber: number }} opts
   * @returns {Promise<NormalizedIssue>}
   */
  async closeIssue({ repo, issueNumber } = {}) {
    const data = await this._request('PATCH', this._repoPath(repo, `/issues/${issueNumber}`), { state: 'closed' });
    return this._normalizeIssue(data);
  }

  /**
   * List comments for an issue.
   * @param {{ repo: string, issueNumber: number }} opts
   * @returns {Promise<NormalizedComment[]>}
   */
  async listComments({ repo, issueNumber } = {}) {
    const data = await this._request('GET', this._repoPath(repo, `/issues/${issueNumber}/comments`));
    const comments = data ?? [];
    return comments.map(c => this._normalizeComment(c));
  }

  /**
   * Create a comment on an issue.
   * @param {{ repo: string, issueNumber: number, body: string }} opts
   * @returns {Promise<NormalizedComment>}
   */
  async createComment({ repo, issueNumber, body }) {
    const data = await this._request('POST', this._repoPath(repo, `/issues/${issueNumber}/comments`), { body });
    return this._normalizeComment(data);
  }
}
