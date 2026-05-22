// GitHub CI/CD implementation — Slice 3.3b
// Implements the cicd interface contract:
//   listWorkflowRuns, listJobs, rerunWorkflow, cancelWorkflow, createCheck, updateCheck
//
// All HTTP calls are injected via fetchImpl for full testability.

const GITHUB_API = 'https://api.github.com';

/**
 * @typedef {{ id: number, name: string, status: string, conclusion: string|null, headBranch: string, headSha: string, htmlUrl: string, createdAt: string, updatedAt: string }} NormalizedWorkflowRun
 * @typedef {{ id: number, name: string, status: string, conclusion: string|null, startedAt: string, completedAt: string, htmlUrl: string }} NormalizedJob
 * @typedef {{ id: number, name: string, status: string, conclusion: string|null, htmlUrl: string }} NormalizedCheckRun
 */

/**
 * GitHub implementation of the cicd interface.
 *
 * @param {{ owner: string, installationToken: string, fetchImpl?: Function }} opts
 */
export class GitHubCicd {
  constructor({ owner, installationToken, fetchImpl = globalThis.fetch } = {}) {
    if (!owner) throw new Error('GitHubCicd: owner (org or user) is required');
    if (!installationToken) throw new Error('GitHubCicd: installationToken is required');
    if (!fetchImpl) throw new Error('GitHubCicd: a fetch implementation is required');

    this.role = 'github-cicd';
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

  _normalizeRun(data) {
    return {
      id: data.id,
      name: data.name ?? '',
      status: data.status ?? '',
      conclusion: data.conclusion ?? null,
      headBranch: data.head_branch ?? '',
      headSha: data.head_sha ?? '',
      htmlUrl: data.html_url ?? '',
      createdAt: data.created_at ?? '',
      updatedAt: data.updated_at ?? ''
    };
  }

  _normalizeJob(data) {
    return {
      id: data.id,
      name: data.name ?? '',
      status: data.status ?? '',
      conclusion: data.conclusion ?? null,
      startedAt: data.started_at ?? '',
      completedAt: data.completed_at ?? '',
      htmlUrl: data.html_url ?? ''
    };
  }

  _normalizeCheckRun(data) {
    return {
      id: data.id,
      name: data.name ?? '',
      status: data.status ?? '',
      conclusion: data.conclusion ?? null,
      htmlUrl: data.html_url ?? ''
    };
  }

  // ---------------------------------------------------------------------------
  // Interface methods
  // ---------------------------------------------------------------------------

  /**
   * List workflow runs for a repository (optionally filtered by workflow file name).
   * @param {{ repo: string, workflowId?: string|number }} opts
   * @returns {Promise<NormalizedWorkflowRun[]>}
   */
  async listWorkflowRuns({ repo, workflowId } = {}) {
    const path = workflowId
      ? this._repoPath(repo, `/actions/workflows/${encodeURIComponent(workflowId)}/runs`)
      : this._repoPath(repo, '/actions/runs');
    const data = await this._request('GET', path);
    const runs = data?.workflow_runs ?? data ?? [];
    return runs.map(r => this._normalizeRun(r));
  }

  /**
   * List jobs for a specific workflow run.
   * @param {{ repo: string, runId: number }} opts
   * @returns {Promise<NormalizedJob[]>}
   */
  async listJobs({ repo, runId } = {}) {
    const data = await this._request('GET', this._repoPath(repo, `/actions/runs/${runId}/jobs`));
    const jobs = data?.jobs ?? data ?? [];
    return jobs.map(j => this._normalizeJob(j));
  }

  /**
   * Trigger a re-run of a workflow run.
   * @param {{ repo: string, runId: number }} opts
   * @returns {Promise<{ triggered: boolean, runId: number }>}
   */
  async rerunWorkflow({ repo, runId } = {}) {
    await this._request('POST', this._repoPath(repo, `/actions/runs/${runId}/rerun`));
    return { triggered: true, runId };
  }

  /**
   * Cancel a workflow run.
   * @param {{ repo: string, runId: number }} opts
   * @returns {Promise<{ cancelled: boolean, runId: number }>}
   */
  async cancelWorkflow({ repo, runId } = {}) {
    await this._request('POST', this._repoPath(repo, `/actions/runs/${runId}/cancel`));
    return { cancelled: true, runId };
  }

  /**
   * Create a check run on a commit.
   * @param {{ repo: string, name: string, headSha: string, status?: string, conclusion?: string, detailsUrl?: string, output?: object }} opts
   * @returns {Promise<NormalizedCheckRun>}
   */
  async createCheck({ repo, name, headSha, status = 'queued', conclusion, detailsUrl, output } = {}) {
    const payload = { name, head_sha: headSha, status };
    if (conclusion !== undefined) payload.conclusion = conclusion;
    if (detailsUrl !== undefined) payload.details_url = detailsUrl;
    if (output !== undefined) payload.output = output;
    const data = await this._request('POST', this._repoPath(repo, '/check-runs'), payload);
    return this._normalizeCheckRun(data);
  }

  /**
   * Update an existing check run.
   * @param {{ repo: string, checkRunId: number, status?: string, conclusion?: string, output?: object }} opts
   * @returns {Promise<NormalizedCheckRun>}
   */
  async updateCheck({ repo, checkRunId, status, conclusion, output } = {}) {
    const payload = {};
    if (status !== undefined) payload.status = status;
    if (conclusion !== undefined) payload.conclusion = conclusion;
    if (output !== undefined) payload.output = output;
    const data = await this._request('PATCH', this._repoPath(repo, `/check-runs/${checkRunId}`), payload);
    return this._normalizeCheckRun(data);
  }
}
