'use client';

import { useMemo, useState } from 'react';

export function IssueCreateForm({ org, repo = null, project = null }) {
  const [form, setForm] = useState({ name: '', title: '', description: '', labels: '', repositories: repo || '', projects: project || '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [createdHref, setCreatedHref] = useState('');

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function createIssue(event) {
    event.preventDefault();
    const resource = buildIssueResource(form, { repo, project });
    if (!resource.metadata?.name || !resource.spec?.title) return;
    setBusy(true);
    setMessage('');
    setCreatedHref('');
    try {
      const response = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(resource)
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) {
        const name = body.resource?.metadata?.name || resource.metadata?.name;
        setCreatedHref(issueHref(org, name, { repo, project }));
        setMessage(`Created Issue/${name}`);
        setForm({ name: '', title: '', description: '', labels: '', repositories: repo || '', projects: project || '' });
      } else {
        setMessage(body.message || body.error || 'Issue create failed');
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  return <details className="issueCreateForm"><summary>Create scoped issue</summary><form onSubmit={createIssue} className="formGrid"><label><span>Name</span><input value={form.name} onChange={(event) => updateField('name', event.target.value)} placeholder="issue-login-timeout" required /></label><label><span>Title</span><input value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Describe the issue" required /></label><label className="spanFull"><span>Description</span><textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows={4} /></label><label><span>Repository refs</span><input value={form.repositories} onChange={(event) => updateField('repositories', event.target.value)} placeholder="repo-a, repo-b" /></label><label><span>Project refs</span><input value={form.projects} onChange={(event) => updateField('projects', event.target.value)} placeholder="project-a, project-b" /></label><label className="spanFull"><span>Labels</span><input value={form.labels} onChange={(event) => updateField('labels', event.target.value)} placeholder="bug, ui, backend" /></label><button type="submit" disabled={busy} aria-label="Create new issue">{busy ? 'Creating...' : 'Create issue'}</button></form>{message ? <p role="status" className="mutationStatus">{message}{createdHref ? <> · <a href={createdHref}>Open issue</a></> : null}</p> : null}</details>;
}

export function IssueEditor({ org, issue, repo = null, project = null }) {
  const initialRepositories = useMemo(() => refsFrom(issue, 'repository', repo), [issue, repo]);
  const initialProjects = useMemo(() => refsFrom(issue, 'project', project), [issue, project]);
  const [form, setForm] = useState({
    title: issue.spec?.title || issue.metadata?.name || '',
    status: issue.status?.phase || issue.spec?.status || 'Open',
    description: issue.spec?.body || issue.spec?.description || issue.status?.summary || '',
    labels: (issue.spec?.labels || []).join(', '),
    repositories: initialRepositories.join(', '),
    projects: initialProjects.join(', ')
  });
  const [comments, setComments] = useState(normalizeComments(issue));
  const [commentBody, setCommentBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const issueName = issue.metadata?.name;

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function saveIssue(event) {
    event.preventDefault();
    await patchIssue(buildIssuePatch(form));
  }

  async function addComment(event) {
    event.preventDefault();
    const body = commentBody.trim();
    if (!body) return;
    const comment = { id: `comment-${Date.now()}`, author: 'Krate user', body, createdAt: new Date().toISOString() };
    const previousComments = comments;
    const nextComments = [...comments, comment];
    // Optimistic update: show comment immediately
    setComments(nextComments);
    setCommentBody('');
    const ok = await patchIssue({ spec: { comments: nextComments } });
    if (!ok) {
      // Revert optimistic update on failure
      setComments(previousComments);
      setCommentBody(body);
    }
  }

  async function patchIssue(payload) {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/orgs/${encodeURIComponent(org)}/resources/Issue/${encodeURIComponent(issueName)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await response.json().catch(() => ({}));
      setMessage(response.ok ? `Saved Issue/${issueName}` : body.message || body.error || 'Issue update failed');
      return response.ok;
    } catch (error) {
      setMessage(error.message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  return <div className="card issueEditor"><div className="cardTitle"><h3>Edit issue</h3><span className="pill neutral">synced</span></div><form onSubmit={saveIssue} className="formGrid"><label><span>Title</span><input value={form.title} onChange={(event) => updateField('title', event.target.value)} required /></label><label><span>Status</span><select value={form.status} onChange={(event) => updateField('status', event.target.value)}><option>Open</option><option>In Progress</option><option>Blocked</option><option>Closed</option><option>Done</option></select></label><label className="spanFull"><span>Description</span><textarea value={form.description} onChange={(event) => updateField('description', event.target.value)} rows={5} /></label><label><span>Repository refs</span><input value={form.repositories} onChange={(event) => updateField('repositories', event.target.value)} placeholder="repo-a, repo-b" /></label><label><span>Project refs</span><input value={form.projects} onChange={(event) => updateField('projects', event.target.value)} placeholder="project-a, project-b" /></label><label className="spanFull"><span>Labels</span><input value={form.labels} onChange={(event) => updateField('labels', event.target.value)} placeholder="bug, ui, backend" /></label><button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save issue'}</button></form><form onSubmit={addComment} className="formGrid commentComposer"><label className="spanFull"><span>Add comment</span><textarea value={commentBody} onChange={(event) => setCommentBody(event.target.value)} rows={4} placeholder="Write a synced issue comment" /></label><button type="submit" disabled={busy || !commentBody.trim()}>{busy ? 'Saving...' : 'Add comment'}</button></form>{message ? <p role="status" className="mutationStatus">{message}</p> : null}</div>;
}

function buildIssueResource(form, scope = {}) {
  const repositories = unique([scope.repo, ...csv(form.repositories)]);
  const projects = unique([scope.project, ...csv(form.projects)]);
  const labels = csv(form.labels);
  return {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'Issue',
    metadata: {
      name: resourceName(form.name),
      annotations: { 'krate.a5c.ai/repositories': repositories.join(', '), 'krate.a5c.ai/projects': projects.join(', ') }
    },
    spec: {
      title: form.title.trim(),
      description: form.description,
      body: form.description,
      status: 'Open',
      labels,
      repositories,
      repositoryRefs: repositories.map((name) => ({ name })),
      projects,
      projectRefs: projects.map((name) => ({ name })),
      comments: [],
      sync: { backend: 'krate', mode: 'metadata' }
    },
    status: { phase: 'Open' }
  };
}

function buildIssuePatch(form) {
  const repositories = csv(form.repositories);
  const projects = csv(form.projects);
  const labels = csv(form.labels);
  return {
    metadata: { annotations: { 'krate.a5c.ai/repositories': repositories.join(', '), 'krate.a5c.ai/projects': projects.join(', ') } },
    spec: {
      title: form.title.trim(),
      description: form.description,
      body: form.description,
      status: form.status,
      labels,
      repositories,
      repositoryRefs: repositories.map((name) => ({ name })),
      projects,
      projectRefs: projects.map((name) => ({ name })),
      sync: { backend: 'krate', mode: 'metadata' }
    },
    status: { phase: form.status }
  };
}

function issueHref(org, name, { repo = null, project = null } = {}) {
  if (repo) return `/orgs/${encodeURIComponent(org)}/repositories/${encodeURIComponent(repo)}/issues/${encodeURIComponent(name)}`;
  if (project) return `/orgs/${encodeURIComponent(org)}/agents/projects/${encodeURIComponent(project)}/issues/${encodeURIComponent(name)}`;
  return `/orgs/${encodeURIComponent(org)}/inbox`;
}

function refsFrom(issue, scope, fallback) {
  const singular = scope === 'repository' ? ['repository', 'repoRef', 'repositoryRef'] : ['project', 'projectRef', 'krateProject', 'krateProjectRef'];
  const plural = scope === 'repository' ? ['repositories', 'repositoryRefs'] : ['projects', 'projectRefs'];
  return unique([fallback, ...singular.map((key) => issue.spec?.[key]), ...plural.flatMap((key) => issue.spec?.[key] || []), issue.metadata?.annotations?.[`krate.a5c.ai/${plural[0]}`], issue.metadata?.labels?.[`krate.a5c.ai/${scope}`]]);
}

function normalizeComments(issue) {
  return [issue.spec?.comments, issue.status?.comments, issue.spec?.discussion, issue.status?.discussion].flat().filter(Boolean).map((comment, index) => typeof comment === 'string' ? { id: `comment-${index}`, author: 'synced comment', body: comment, createdAt: '' } : { id: comment.id || comment.url || `comment-${index}`, author: comment.author || comment.user || 'synced comment', body: comment.body || comment.text || comment.message || '', createdAt: comment.createdAt || comment.created_at || comment.updatedAt || '' });
}

function csv(value) {
  return String(value || '').split(',').map((part) => part.trim()).filter(Boolean);
}

function unique(values) {
  return [...new Set(values.flatMap((value) => refNames(value)).filter(Boolean))];
}

function refNames(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(refNames);
  if (typeof value === 'string') return value.split(',').map((part) => part.trim()).filter(Boolean);
  if (typeof value === 'object') return [value.name, value.repository, value.project, value.ref, value.id].filter(Boolean);
  return [String(value)];
}

function resourceName(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
}
