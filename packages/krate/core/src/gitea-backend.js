export function createGiteaBackend({ baseUrl = 'http://krate-gitea-http:3000', token, fetchImpl = globalThis.fetch } = {}) {
  if (!fetchImpl) throw new Error('Gitea backend requires a fetch implementation');
  const root = baseUrl.replace(/\/$/, '');

  async function request(method, path, body) {
    const response = await fetchImpl(`${root}/api/v1${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `token ${token}` } : {})
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    if (!response.ok) throw new Error(`Gitea ${method} ${path} failed with ${response.status}`);
    return response.status === 204 ? null : response.json();
  }

  return {
    role: 'gitea-backend',
    baseUrl: root,
    createOrganization({ name, fullName = name, description = '', visibility = 'private' }) {
      return request('POST', '/orgs', { username: name, full_name: fullName, description, visibility });
    },
    createUser({ username, email, fullName = username, password, mustChangePassword = true }) {
      return request('POST', '/admin/users', { username, email, full_name: fullName, password, must_change_password: mustChangePassword });
    },
    editUser({ username, email, fullName, active = true, admin = false }) {
      return request('PATCH', `/admin/users/${encodeURIComponent(username)}`, { email, full_name: fullName, active, admin });
    },
    addUserSshKey({ title, key, readOnly = false }) {
      return request('POST', '/user/keys', { title, key, read_only: readOnly });
    },
    createRepository({ owner, name, private: isPrivate = true, defaultBranch = 'main', description = '' }) {
      const path = owner ? `/orgs/${encodeURIComponent(owner)}/repos` : '/user/repos';
      return request('POST', path, { name, private: isPrivate, default_branch: defaultBranch, description, auto_init: false });
    },
    addDeployKey({ owner, repo, title, key, readOnly = true }) {
      return request('POST', `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/keys`, { title, key, read_only: readOnly });
    },
    addCollaborator({ owner, repo, username, permission = 'read' }) {
      return request('PUT', `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/collaborators/${encodeURIComponent(username)}`, { permission });
    },
    addTeamRepository({ org, team, repo, owner = org, permission = 'read' }) {
      return request('PUT', `/teams/${encodeURIComponent(team)}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, { permission });
    },
    createTeam({ org, name, permission = 'read', units = ['repo.code', 'repo.pulls', 'repo.issues'] }) {
      return request('POST', `/orgs/${encodeURIComponent(org)}/teams`, { name, permission, units });
    },
    addTeamMember({ team, username }) {
      return request('PUT', `/teams/${encodeURIComponent(team)}/members/${encodeURIComponent(username)}`);
    },
    protectBranch({ owner, repo, branch = 'main', approvals = 1, statusChecks = [] }) {
      return request('POST', `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/branch_protections`, {
        branch_name: branch,
        enable_push: false,
        enable_push_whitelist: true,
        required_approvals: approvals,
        enable_status_check: statusChecks.length > 0,
        status_check_contexts: statusChecks
      });
    },
    createIssue({ owner, repo, title, body = '', labels = [], assignees = [] }) {
      return request('POST', `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`, { title, body, labels, assignees });
    },
    createPullRequest({ owner, repo, title, head, base = 'main', body = '' }) {
      return request('POST', `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls`, { title, head, base, body });
    },
    createWebhook({ owner, repo, url, events = ['push', 'pull_request'], secret }) {
      return request('POST', `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/hooks`, {
        type: 'gitea',
        active: true,
        events,
        config: { url, content_type: 'json', ...(secret ? { secret } : {}) }
      });
    }
  };
}

export function orgMemoryRepositoryName(org = 'default') {
  return `_${String(org || 'default').replace(/[^a-zA-Z0-9.-]+/g, '-')}_`;
}

export function giteaIssueSyncPlan({ org = 'default', project = null, issue = null, repositories = [] } = {}) {
  const owner = org;
  const repo = orgMemoryRepositoryName(org);
  const issueName = issue?.metadata?.name || issue?.name || '<issue>';
  return {
    backend: 'gitea',
    owner,
    repo,
    issue: issueName,
    project,
    repositoryRefs: repositories,
    metadataKeys: ['krate.a5c.ai/project', 'krate.a5c.ai/repositories'],
    actions: [
      { action: 'ensureOrgMemoryRepository', owner, repo },
      { action: 'syncIssue', owner, repo, issue: issueName },
      { action: 'writeIssueRepositoryMetadata', issue: issueName, repositories }
    ]
  };
}

export function githubProjectIssueSyncPlan({ org = 'default', project = null, issue = null, repositories = [] } = {}) {
  return {
    backend: 'github',
    owner: org,
    project,
    issue: issue?.metadata?.name || issue?.name || '<issue>',
    repositoryRefs: repositories,
    metadataKeys: ['project item fields', 'krate repositories field'],
    actions: ['syncProjectItem', 'syncIssueMetadata', 'syncRepositoryLinks']
  };
}

export function giteaRepositoryIntegrationPlan({ owner, repo, deployKeyTitle = 'krate-gitops', permission = 'write', branch = 'main', webhookUrl }) {
  return {
    backend: 'gitea',
    operations: [
      { action: 'createOrganization', owner },
      { action: 'createRepository', owner, repo },
      { action: 'ensureUserMappings', owner },
      { action: 'addDeployKey', owner, repo, title: deployKeyTitle, readOnly: false },
      { action: 'addUserSshKey', owner, repo, title: 'developer key' },
      { action: 'addCollaborator', owner, repo, permission },
      { action: 'addTeamRepository', owner, repo, team: 'maintainers', permission: 'admin' },
      { action: 'protectBranch', owner, repo, branch },
      { action: 'createWebhook', owner, repo, url: webhookUrl }
    ]
  };
}
