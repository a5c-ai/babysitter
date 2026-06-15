import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  GitHubIssueTracking,
  GitHubCicd,
  createGitHubProvider,
  GITHUB_ISSUE_TRACKING_BOUNDARY,
  GITHUB_CICD_BOUNDARY
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

function makeIssueTracking(fetchResponses = []) {
  return new GitHubIssueTracking({
    owner: 'my-org',
    installationToken: 'ghs_test_token',
    fetchImpl: makeMockFetch(fetchResponses)
  });
}

function makeCicd(fetchResponses = []) {
  return new GitHubCicd({
    owner: 'my-org',
    installationToken: 'ghs_test_token',
    fetchImpl: makeMockFetch(fetchResponses)
  });
}

// ---------------------------------------------------------------------------
// 1. GitHubIssueTracking.listIssues — returns normalized issue list
// ---------------------------------------------------------------------------

describe('GitHubIssueTracking.listIssues', () => {
  it('returns an array of normalized issue objects', async () => {
    const tracker = makeIssueTracking({
      status: 200,
      body: [
        { id: 1, number: 10, title: 'Bug report', state: 'open', body: 'Something is broken', html_url: 'https://github.com/my-org/repo/issues/10', user: { login: 'alice' }, labels: [{ name: 'bug' }] },
        { id: 2, number: 11, title: 'Feature request', state: 'closed', body: 'Add dark mode', html_url: 'https://github.com/my-org/repo/issues/11', user: { login: 'bob' }, labels: [] }
      ]
    });

    const issues = await tracker.listIssues({ repo: 'my-repo' });

    assert.ok(Array.isArray(issues), 'listIssues must return an array');
    assert.equal(issues.length, 2, 'must return both issues');
    assert.equal(issues[0].number, 10, 'first issue number must match');
    assert.equal(issues[0].title, 'Bug report', 'first issue title must match');
    assert.equal(issues[0].state, 'open', 'issue state must be present');
    assert.ok(Array.isArray(issues[0].labels), 'labels must be an array');
    assert.equal(issues[0].labels[0], 'bug', 'label name must be extracted');
    assert.ok(issues[0].htmlUrl, 'htmlUrl must be present');
  });
});

// ---------------------------------------------------------------------------
// 2. GitHubIssueTracking.createIssue — sends title and body
// ---------------------------------------------------------------------------

describe('GitHubIssueTracking.createIssue', () => {
  it('sends POST with title and body, returns normalized issue', async () => {
    const calls = [];
    const tracker = new GitHubIssueTracking({
      owner: 'my-org',
      installationToken: 'ghs_test',
      fetchImpl: async (url, options = {}) => {
        calls.push({ url, method: options.method, body: options.body ? JSON.parse(options.body) : undefined });
        return {
          ok: true, status: 201,
          json: async () => ({ id: 42, number: 5, title: 'New issue', state: 'open', body: 'Issue body', html_url: 'https://github.com/my-org/repo/issues/5', user: { login: 'alice' }, labels: [] })
        };
      }
    });

    const result = await tracker.createIssue({ repo: 'my-repo', title: 'New issue', body: 'Issue body' });

    assert.equal(calls.length, 1, 'exactly one HTTP call must be made');
    assert.equal(calls[0].method, 'POST', 'must use POST method');
    assert.ok(calls[0].url.includes('/repos/my-org/my-repo/issues'), `URL must target issues endpoint, got ${calls[0].url}`);
    assert.equal(calls[0].body.title, 'New issue', 'payload must include title');
    assert.equal(calls[0].body.body, 'Issue body', 'payload must include body');
    assert.ok(result, 'createIssue must return the created issue');
    assert.equal(result.number, 5, 'result must include issue number');
  });
});

// ---------------------------------------------------------------------------
// 3. GitHubIssueTracking.updateIssue — sends patch
// ---------------------------------------------------------------------------

describe('GitHubIssueTracking.updateIssue', () => {
  it('sends PATCH to the issue endpoint with updated fields', async () => {
    const calls = [];
    const tracker = new GitHubIssueTracking({
      owner: 'my-org',
      installationToken: 'ghs_test',
      fetchImpl: async (url, options = {}) => {
        calls.push({ url, method: options.method, body: options.body ? JSON.parse(options.body) : undefined });
        return {
          ok: true, status: 200,
          json: async () => ({ id: 1, number: 7, title: 'Updated title', state: 'open', body: 'Updated body', html_url: '', user: { login: 'alice' }, labels: [] })
        };
      }
    });

    const result = await tracker.updateIssue({ repo: 'my-repo', issueNumber: 7, title: 'Updated title', body: 'Updated body' });

    assert.equal(calls.length, 1, 'exactly one HTTP call must be made');
    assert.equal(calls[0].method, 'PATCH', 'must use PATCH method');
    assert.ok(calls[0].url.includes('/repos/my-org/my-repo/issues/7'), `URL must target issue 7, got ${calls[0].url}`);
    assert.equal(calls[0].body.title, 'Updated title', 'payload must include updated title');
    assert.equal(calls[0].body.body, 'Updated body', 'payload must include updated body');
    assert.ok(result, 'updateIssue must return the updated issue');
    assert.equal(result.number, 7, 'result number must match');
  });
});

// ---------------------------------------------------------------------------
// 4. GitHubIssueTracking.closeIssue — sets state to closed
// ---------------------------------------------------------------------------

describe('GitHubIssueTracking.closeIssue', () => {
  it('sends PATCH with state=closed to the issue endpoint', async () => {
    const calls = [];
    const tracker = new GitHubIssueTracking({
      owner: 'my-org',
      installationToken: 'ghs_test',
      fetchImpl: async (url, options = {}) => {
        calls.push({ url, method: options.method, body: options.body ? JSON.parse(options.body) : undefined });
        return {
          ok: true, status: 200,
          json: async () => ({ id: 1, number: 3, title: 'Old issue', state: 'closed', body: '', html_url: '', user: { login: 'alice' }, labels: [] })
        };
      }
    });

    const result = await tracker.closeIssue({ repo: 'my-repo', issueNumber: 3 });

    assert.equal(calls.length, 1, 'exactly one HTTP call must be made');
    assert.equal(calls[0].method, 'PATCH', 'must use PATCH method');
    assert.ok(calls[0].url.includes('/repos/my-org/my-repo/issues/3'), `URL must target issue 3, got ${calls[0].url}`);
    assert.equal(calls[0].body.state, 'closed', 'payload must set state to closed');
    assert.equal(result.state, 'closed', 'returned issue must have state=closed');
  });
});

// ---------------------------------------------------------------------------
// 5. GitHubIssueTracking.listComments — returns comments for issue
// ---------------------------------------------------------------------------

describe('GitHubIssueTracking.listComments', () => {
  it('returns an array of normalized comment objects for an issue', async () => {
    const tracker = makeIssueTracking({
      status: 200,
      body: [
        { id: 101, body: 'First comment', user: { login: 'alice' }, created_at: '2025-01-01T00:00:00Z', html_url: 'https://github.com/my-org/repo/issues/5#issuecomment-101' },
        { id: 102, body: 'Second comment', user: { login: 'bob' }, created_at: '2025-01-02T00:00:00Z', html_url: 'https://github.com/my-org/repo/issues/5#issuecomment-102' }
      ]
    });

    const comments = await tracker.listComments({ repo: 'my-repo', issueNumber: 5 });

    assert.ok(Array.isArray(comments), 'listComments must return an array');
    assert.equal(comments.length, 2, 'must return both comments');
    assert.equal(comments[0].id, 101, 'first comment id must match');
    assert.equal(comments[0].body, 'First comment', 'comment body must be present');
    assert.equal(comments[0].author, 'alice', 'comment author must be normalized from user.login');
    assert.ok(comments[0].createdAt, 'createdAt must be present');
  });
});

// ---------------------------------------------------------------------------
// 6. GitHubIssueTracking.createComment — posts comment body
// ---------------------------------------------------------------------------

describe('GitHubIssueTracking.createComment', () => {
  it('sends POST with comment body to the issue comments endpoint', async () => {
    const calls = [];
    const tracker = new GitHubIssueTracking({
      owner: 'my-org',
      installationToken: 'ghs_test',
      fetchImpl: async (url, options = {}) => {
        calls.push({ url, method: options.method, body: options.body ? JSON.parse(options.body) : undefined });
        return {
          ok: true, status: 201,
          json: async () => ({ id: 200, body: 'Great fix!', user: { login: 'alice' }, created_at: '2025-01-03T00:00:00Z', html_url: '' })
        };
      }
    });

    const result = await tracker.createComment({ repo: 'my-repo', issueNumber: 5, body: 'Great fix!' });

    assert.equal(calls.length, 1, 'exactly one HTTP call must be made');
    assert.equal(calls[0].method, 'POST', 'must use POST method');
    assert.ok(calls[0].url.includes('/repos/my-org/my-repo/issues/5/comments'), `URL must target issue 5 comments, got ${calls[0].url}`);
    assert.equal(calls[0].body.body, 'Great fix!', 'payload must include comment body');
    assert.ok(result, 'createComment must return the created comment');
    assert.equal(result.id, 200, 'returned comment must include id');
  });
});

// ---------------------------------------------------------------------------
// 7. GitHubIssueTracking — implements issueTracking interface
// ---------------------------------------------------------------------------

describe('GitHubIssueTracking — interface contract', () => {
  it('exposes all required issueTracking interface methods', () => {
    const tracker = makeIssueTracking();
    const requiredMethods = [
      'listIssues',
      'createIssue',
      'updateIssue',
      'closeIssue',
      'listComments',
      'createComment'
    ];
    for (const method of requiredMethods) {
      assert.equal(typeof tracker[method], 'function', `GitHubIssueTracking must expose method: ${method}`);
    }
  });

  it('has a role property identifying it as github-issue-tracking', () => {
    const tracker = makeIssueTracking();
    assert.equal(tracker.role, 'github-issue-tracking', 'role must be "github-issue-tracking"');
  });

  it('throws when required constructor arguments are missing', () => {
    assert.throws(
      () => new GitHubIssueTracking({ installationToken: 'tok', fetchImpl: () => {} }),
      /owner/i,
      'must throw when owner is missing'
    );
    assert.throws(
      () => new GitHubIssueTracking({ owner: 'org', fetchImpl: () => {} }),
      /installationToken/i,
      'must throw when installationToken is missing'
    );
  });
});

// ---------------------------------------------------------------------------
// 8. GitHubCicd.listWorkflowRuns — returns normalized run list
// ---------------------------------------------------------------------------

describe('GitHubCicd.listWorkflowRuns', () => {
  it('returns an array of normalized workflow run objects', async () => {
    const cicd = makeCicd({
      status: 200,
      body: {
        workflow_runs: [
          { id: 1001, name: 'CI', status: 'completed', conclusion: 'success', head_branch: 'main', head_sha: 'abc123', html_url: 'https://github.com/my-org/repo/actions/runs/1001', created_at: '2025-01-01T10:00:00Z', updated_at: '2025-01-01T10:05:00Z' },
          { id: 1002, name: 'CI', status: 'in_progress', conclusion: null, head_branch: 'feature-x', head_sha: 'def456', html_url: 'https://github.com/my-org/repo/actions/runs/1002', created_at: '2025-01-02T10:00:00Z', updated_at: '2025-01-02T10:02:00Z' }
        ]
      }
    });

    const runs = await cicd.listWorkflowRuns({ repo: 'my-repo' });

    assert.ok(Array.isArray(runs), 'listWorkflowRuns must return an array');
    assert.equal(runs.length, 2, 'must return both workflow runs');
    assert.equal(runs[0].id, 1001, 'first run id must match');
    assert.equal(runs[0].name, 'CI', 'run name must be present');
    assert.equal(runs[0].status, 'completed', 'run status must be present');
    assert.equal(runs[0].conclusion, 'success', 'run conclusion must be present');
    assert.equal(runs[0].headBranch, 'main', 'headBranch must be normalized from head_branch');
    assert.ok(runs[0].htmlUrl, 'htmlUrl must be present');
  });
});

// ---------------------------------------------------------------------------
// 9. GitHubCicd.listJobs — returns jobs for a run
// ---------------------------------------------------------------------------

describe('GitHubCicd.listJobs', () => {
  it('returns an array of normalized job objects for a workflow run', async () => {
    const cicd = makeCicd({
      status: 200,
      body: {
        jobs: [
          { id: 2001, name: 'build', status: 'completed', conclusion: 'success', started_at: '2025-01-01T10:00:00Z', completed_at: '2025-01-01T10:03:00Z', html_url: 'https://github.com/my-org/repo/actions/runs/1001/jobs/2001' },
          { id: 2002, name: 'test', status: 'completed', conclusion: 'failure', started_at: '2025-01-01T10:03:00Z', completed_at: '2025-01-01T10:05:00Z', html_url: 'https://github.com/my-org/repo/actions/runs/1001/jobs/2002' }
        ]
      }
    });

    const jobs = await cicd.listJobs({ repo: 'my-repo', runId: 1001 });

    assert.ok(Array.isArray(jobs), 'listJobs must return an array');
    assert.equal(jobs.length, 2, 'must return both jobs');
    assert.equal(jobs[0].id, 2001, 'first job id must match');
    assert.equal(jobs[0].name, 'build', 'job name must be present');
    assert.equal(jobs[0].status, 'completed', 'job status must be present');
    assert.equal(jobs[0].conclusion, 'success', 'job conclusion must be present');
    assert.ok(jobs[0].startedAt, 'startedAt must be present');
    assert.ok(jobs[0].htmlUrl, 'htmlUrl must be present');
  });
});

// ---------------------------------------------------------------------------
// 10. GitHubCicd.rerunWorkflow — triggers rerun
// ---------------------------------------------------------------------------

describe('GitHubCicd.rerunWorkflow', () => {
  it('sends POST to the rerun endpoint and returns success indicator', async () => {
    const calls = [];
    const cicd = new GitHubCicd({
      owner: 'my-org',
      installationToken: 'ghs_test',
      fetchImpl: async (url, options = {}) => {
        calls.push({ url, method: options.method });
        return { ok: true, status: 201, json: async () => null };
      }
    });

    const result = await cicd.rerunWorkflow({ repo: 'my-repo', runId: 1001 });

    assert.equal(calls.length, 1, 'exactly one HTTP call must be made');
    assert.equal(calls[0].method, 'POST', 'must use POST method');
    assert.ok(calls[0].url.includes('/repos/my-org/my-repo/actions/runs/1001/rerun'), `URL must target rerun endpoint, got ${calls[0].url}`);
    assert.ok(result, 'rerunWorkflow must return a result');
    assert.equal(result.triggered, true, 'result.triggered must be true');
  });
});

// ---------------------------------------------------------------------------
// 11. GitHubCicd.cancelWorkflow — cancels a run
// ---------------------------------------------------------------------------

describe('GitHubCicd.cancelWorkflow', () => {
  it('sends POST to the cancel endpoint and returns success indicator', async () => {
    const calls = [];
    const cicd = new GitHubCicd({
      owner: 'my-org',
      installationToken: 'ghs_test',
      fetchImpl: async (url, options = {}) => {
        calls.push({ url, method: options.method });
        return { ok: true, status: 202, json: async () => null };
      }
    });

    const result = await cicd.cancelWorkflow({ repo: 'my-repo', runId: 1002 });

    assert.equal(calls.length, 1, 'exactly one HTTP call must be made');
    assert.equal(calls[0].method, 'POST', 'must use POST method');
    assert.ok(calls[0].url.includes('/repos/my-org/my-repo/actions/runs/1002/cancel'), `URL must target cancel endpoint, got ${calls[0].url}`);
    assert.ok(result, 'cancelWorkflow must return a result');
    assert.equal(result.cancelled, true, 'result.cancelled must be true');
  });
});

// ---------------------------------------------------------------------------
// 12. GitHubCicd.createCheck — creates a check run
// ---------------------------------------------------------------------------

describe('GitHubCicd.createCheck', () => {
  it('sends POST to create a check run with name, headSha, and status', async () => {
    const calls = [];
    const cicd = new GitHubCicd({
      owner: 'my-org',
      installationToken: 'ghs_test',
      fetchImpl: async (url, options = {}) => {
        calls.push({ url, method: options.method, body: options.body ? JSON.parse(options.body) : undefined });
        return {
          ok: true, status: 201,
          json: async () => ({ id: 3001, name: 'my-check', status: 'in_progress', conclusion: null, html_url: 'https://github.com/my-org/repo/runs/3001' })
        };
      }
    });

    const result = await cicd.createCheck({ repo: 'my-repo', name: 'my-check', headSha: 'abc123', status: 'in_progress' });

    assert.equal(calls.length, 1, 'exactly one HTTP call must be made');
    assert.equal(calls[0].method, 'POST', 'must use POST method');
    assert.ok(calls[0].url.includes('/repos/my-org/my-repo/check-runs'), `URL must target check-runs endpoint, got ${calls[0].url}`);
    assert.equal(calls[0].body.name, 'my-check', 'payload must include name');
    assert.equal(calls[0].body.head_sha, 'abc123', 'payload must include head_sha');
    assert.equal(calls[0].body.status, 'in_progress', 'payload must include status');
    assert.ok(result, 'createCheck must return the created check run');
    assert.equal(result.id, 3001, 'result must include check run id');
  });
});

// ---------------------------------------------------------------------------
// 13. GitHubCicd.updateCheck — updates check conclusion
// ---------------------------------------------------------------------------

describe('GitHubCicd.updateCheck', () => {
  it('sends PATCH to update check run conclusion and status', async () => {
    const calls = [];
    const cicd = new GitHubCicd({
      owner: 'my-org',
      installationToken: 'ghs_test',
      fetchImpl: async (url, options = {}) => {
        calls.push({ url, method: options.method, body: options.body ? JSON.parse(options.body) : undefined });
        return {
          ok: true, status: 200,
          json: async () => ({ id: 3001, name: 'my-check', status: 'completed', conclusion: 'success', html_url: '' })
        };
      }
    });

    const result = await cicd.updateCheck({ repo: 'my-repo', checkRunId: 3001, status: 'completed', conclusion: 'success' });

    assert.equal(calls.length, 1, 'exactly one HTTP call must be made');
    assert.equal(calls[0].method, 'PATCH', 'must use PATCH method');
    assert.ok(calls[0].url.includes('/repos/my-org/my-repo/check-runs/3001'), `URL must target check-run 3001, got ${calls[0].url}`);
    assert.equal(calls[0].body.status, 'completed', 'payload must include status');
    assert.equal(calls[0].body.conclusion, 'success', 'payload must include conclusion');
    assert.ok(result, 'updateCheck must return the updated check run');
    assert.equal(result.conclusion, 'success', 'result must include conclusion');
  });
});

// ---------------------------------------------------------------------------
// 14. GitHubCicd — implements cicd interface
// ---------------------------------------------------------------------------

describe('GitHubCicd — interface contract', () => {
  it('exposes all required cicd interface methods', () => {
    const cicd = makeCicd();
    const requiredMethods = [
      'listWorkflowRuns',
      'listJobs',
      'rerunWorkflow',
      'cancelWorkflow',
      'createCheck',
      'updateCheck'
    ];
    for (const method of requiredMethods) {
      assert.equal(typeof cicd[method], 'function', `GitHubCicd must expose method: ${method}`);
    }
  });

  it('has a role property identifying it as github-cicd', () => {
    const cicd = makeCicd();
    assert.equal(cicd.role, 'github-cicd', 'role must be "github-cicd"');
  });

  it('throws when required constructor arguments are missing', () => {
    assert.throws(
      () => new GitHubCicd({ installationToken: 'tok', fetchImpl: () => {} }),
      /owner/i,
      'must throw when owner is missing'
    );
    assert.throws(
      () => new GitHubCicd({ owner: 'org', fetchImpl: () => {} }),
      /installationToken/i,
      'must throw when installationToken is missing'
    );
  });
});

// ---------------------------------------------------------------------------
// 15. createGitHubProvider — includes all 3 interfaces
// ---------------------------------------------------------------------------

describe('createGitHubProvider — all 3 interfaces', () => {
  it('returns a provider that can create forge, issueTracker, and cicd instances', () => {
    const provider = createGitHubProvider({
      appId: '12345',
      privateKey: 'test-key',
      installationId: '42'
    });

    assert.ok(provider, 'createGitHubProvider must return a value');
    assert.equal(provider.type, 'github', 'provider.type must be "github"');
    assert.equal(typeof provider.createForge, 'function', 'provider must expose createForge');
    assert.equal(typeof provider.createIssueTracker, 'function', 'provider must expose createIssueTracker');
    assert.equal(typeof provider.createCicd, 'function', 'provider must expose createCicd');
  });

  it('createIssueTracker returns a GitHubIssueTracking instance', () => {
    const provider = createGitHubProvider({ appId: '1', privateKey: 'key' });
    const tracker = provider.createIssueTracker({
      owner: 'test-org',
      installationToken: 'ghs_test',
      fetchImpl: async () => ({ ok: true, status: 200, json: async () => [] })
    });
    assert.ok(tracker, 'createIssueTracker must return a value');
    assert.equal(tracker.role, 'github-issue-tracking', 'tracker must have correct role');
    assert.equal(typeof tracker.listIssues, 'function', 'tracker must expose listIssues');
    assert.equal(typeof tracker.createIssue, 'function', 'tracker must expose createIssue');
  });

  it('createCicd returns a GitHubCicd instance', () => {
    const provider = createGitHubProvider({ appId: '1', privateKey: 'key' });
    const cicd = provider.createCicd({
      owner: 'test-org',
      installationToken: 'ghs_test',
      fetchImpl: async () => ({ ok: true, status: 200, json: async () => ({}) })
    });
    assert.ok(cicd, 'createCicd must return a value');
    assert.equal(cicd.role, 'github-cicd', 'cicd must have correct role');
    assert.equal(typeof cicd.listWorkflowRuns, 'function', 'cicd must expose listWorkflowRuns');
    assert.equal(typeof cicd.createCheck, 'function', 'cicd must expose createCheck');
  });

  it('exports GITHUB_ISSUE_TRACKING_BOUNDARY and GITHUB_CICD_BOUNDARY', () => {
    assert.ok(GITHUB_ISSUE_TRACKING_BOUNDARY, 'GITHUB_ISSUE_TRACKING_BOUNDARY must be exported');
    assert.equal(GITHUB_ISSUE_TRACKING_BOUNDARY.role, 'github-issue-tracking', 'issue tracking boundary role must match');
    assert.ok(GITHUB_CICD_BOUNDARY, 'GITHUB_CICD_BOUNDARY must be exported');
    assert.equal(GITHUB_CICD_BOUNDARY.role, 'github-cicd', 'cicd boundary role must match');
  });
});
