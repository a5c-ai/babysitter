'use strict';

const { spawnSync } = require('child_process');

function runGh(args, options = {}) {
  const res = spawnSync(
    process.platform === 'win32' ? 'gh.exe' : 'gh',
    args,
    { encoding: 'utf8', timeout: options.timeout || 20000 }
  );
  return {
    ok: res.status === 0,
    stdout: String(res.stdout || ''),
    stderr: String(res.stderr || ''),
    exitCode: res.status,
  };
}

function fetchIssue(repo, number) {
  const res = runGh(
    ['issue', 'view', String(number), '--repo', repo, '--json', 'number,title,body,state,url,labels,assignees,author'],
  );
  if (!res.ok) {
    return { ok: false, error: String(res.stderr || res.stdout || 'gh issue view failed') };
  }
  try {
    return { ok: true, issue: JSON.parse(String(res.stdout || '{}')) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function fetchIssueComments(repo, number) {
  const res = spawnSync(
    process.platform === 'win32' ? 'gh.exe' : 'gh',
    ['issue', 'view', String(number), '--repo', repo, '--comments', '--json', 'comments'],
    { encoding: 'utf8', timeout: 20000 },
  );
  if (res.status !== 0) {
    return { ok: false, error: String(res.stderr || res.stdout || 'gh issue comments failed') };
  }
  try {
    const parsed = JSON.parse(String(res.stdout || '{}'));
    return { ok: true, comments: Array.isArray(parsed.comments) ? parsed.comments : [] };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function updatePullRequest(repo, prNumber, body) {
  if (!repo || !prNumber || !body) {
    return { ok: false, error: 'repo, prNumber, and body are required' };
  }
  const res = runGh(['pr', 'comment', String(prNumber), '--repo', repo, '--body', body], { timeout: 30000 });
  if (!res.ok) {
    return { ok: false, error: res.stderr || res.stdout || 'gh pr comment failed' };
  }
  return { ok: true, message: res.stdout.trim() || 'PR comment posted' };
}

module.exports = {
  runGh,
  fetchIssue,
  fetchIssueComments,
  updatePullRequest,
};
