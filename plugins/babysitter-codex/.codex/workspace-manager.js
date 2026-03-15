'use strict';

const fs = require('fs');
const path = require('path');

function manifestPath(repoRoot) {
  return path.join(repoRoot || process.cwd(), '.a5c', 'workspace', 'repos.json');
}

function loadWorkspace(repoRoot) {
  const root = repoRoot || process.cwd();
  const p = manifestPath(repoRoot);
  if (!fs.existsSync(p)) {
    return { version: 1, repos: [{ alias: 'default', path: root }] };
  }
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!data || !Array.isArray(data.repos)) throw new Error('invalid');
    const repos = data.repos
      .map((r) => ({
        alias: r.alias,
        scope: r.scope || r.alias || 'default',
        path: path.isAbsolute(r.path) ? r.path : path.resolve(root, r.path || '.'),
      }))
      .filter((r) => r.alias && r.path);
    if (repos.length === 0) {
      return { version: 1, repos: [{ alias: 'default', path: root, scope: 'default' }] };
    }
    return { ...data, repos };
  } catch {
    return { version: 1, repos: [{ alias: 'default', path: root, scope: 'default' }] };
  }
}

function resolveRepoPath(workspace, aliasOrScope) {
  const token = aliasOrScope || 'default';
  const found = (workspace.repos || []).find((r) => r.alias === token || r.scope === token);
  return found ? found.path : null;
}

function listRepos(workspace) {
  return (workspace.repos || []).map((r) => ({
    alias: r.alias,
    scope: r.scope || r.alias,
    path: r.path,
  }));
}

function validateWorkspace(workspace) {
  const issues = [];
  for (const repo of workspace.repos || []) {
    if (!fs.existsSync(repo.path)) {
      issues.push(`Missing repo path for alias "${repo.alias}": ${repo.path}`);
    }
  }
  return {
    ok: issues.length === 0,
    issues,
  };
}

module.exports = {
  loadWorkspace,
  resolveRepoPath,
  listRepos,
  validateWorkspace,
};
