import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeResourcePatch } from '../app/api/orgs/[org]/resources/[kind]/[name]/route.js';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function readWebFile(...parts) {
  return fs.readFileSync(path.join(webRoot, ...parts), 'utf8');
}

test('issue PATCH merge preserves scoped metadata while updating comments and refs', () => {
  const existing = {
    apiVersion: 'krate.a5c.ai/v1alpha1',
    kind: 'Issue',
    metadata: { name: 'issue-1', namespace: 'krate-org-default', labels: { keep: 'yes' } },
    spec: { organizationRef: 'default', title: 'Old title', repositoryRefs: [{ name: 'repo-a' }], comments: [{ id: 'c1', body: 'old' }] },
    status: { phase: 'Open' }
  };
  const merged = mergeResourcePatch(existing, {
    metadata: { annotations: { 'krate.a5c.ai/repositories': 'repo-a, repo-b' } },
    spec: { title: 'New title', repositoryRefs: [{ name: 'repo-a' }, { name: 'repo-b' }], comments: [{ id: 'c1', body: 'old' }, { id: 'c2', body: 'new' }] },
    status: { phase: 'Blocked' }
  }, { kind: 'Issue', name: 'issue-1' });

  assert.equal(merged.kind, 'Issue');
  assert.equal(merged.metadata.name, 'issue-1');
  assert.equal(merged.metadata.namespace, 'krate-org-default');
  assert.equal(merged.metadata.labels.keep, 'yes');
  assert.equal(merged.metadata.annotations['krate.a5c.ai/repositories'], 'repo-a, repo-b');
  assert.equal(merged.spec.organizationRef, 'default');
  assert.equal(merged.spec.title, 'New title');
  assert.deepEqual(merged.spec.repositoryRefs, [{ name: 'repo-a' }, { name: 'repo-b' }]);
  assert.equal(merged.spec.comments.at(-1).body, 'new');
  assert.equal(merged.status.phase, 'Blocked');
});

test('issue detail UI exposes shared editor and comment patch affordances', () => {
  const shell = readWebFile('app', 'ui-shell.jsx');
  const editor = readWebFile('app', 'components', 'issue-editor.jsx');
  const route = readWebFile('app', 'api', 'orgs', '[org]', 'resources', '[kind]', '[name]', 'route.js');

  assert.match(shell, /IssueWorkspace[\s\S]*<IssueCreateForm/);
  assert.match(shell, /IssueDetailView[\s\S]*<IssueEditor/);
  assert.match(editor, /Create scoped issue/);
  assert.match(editor, /method: 'POST'/);
  assert.match(editor, /method: 'PATCH'/);
  assert.match(editor, /Add comment/);
  assert.match(editor, /krate\.a5c\.ai\/repositories/);
  assert.match(editor, /krate\.a5c\.ai\/projects/);
  assert.match(route, /export const PATCH = withAuth/);
  assert.match(route, /applyResourceForOrg\(org, resource\)/);
});
