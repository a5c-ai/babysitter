import type { NormalizedTriggerEvent, TriggerChange } from '../types.js';
import { arr, asRecord, change, collectText, labelsFrom, str } from './utils.js';

export function normalizeGitlab(eventName: string, event: Record<string, unknown>, raw: unknown): NormalizedTriggerEvent {
  const project = asRecord(event.project);
  const user = asRecord(event.user);
  const objectAttributes = asRecord(event.object_attributes);
  const commits = arr(event.commits).map(asRecord);
  const changes = commits.flatMap((commit) => [
    ...arr(commit.added).map((path) => change(path, 'added')),
    ...arr(commit.modified).map((path) => change(path, 'modified')),
    ...arr(commit.removed).map((path) => change(path, 'removed')),
  ]).filter((entry): entry is TriggerChange => Boolean(entry));
  const title = str(objectAttributes.title) ?? str(event.title);
  const body = str(objectAttributes.description) ?? str(objectAttributes.note) ?? str(event.message);

  return {
    backend: 'gitlab',
    eventName: str(event.object_kind) ?? eventName,
    action: str(objectAttributes.action),
    actor: str(user.username) ?? str(user.name),
    repository: str(project.path_with_namespace) ?? str(project.web_url),
    ref: str(event.ref),
    sha: str(objectAttributes.last_commit && asRecord(objectAttributes.last_commit).id) ?? str(event.after),
    title,
    body,
    url: str(objectAttributes.url),
    sourceBranch: str(objectAttributes.source_branch),
    targetBranch: str(objectAttributes.target_branch),
    labels: labelsFrom(objectAttributes.labels),
    text: collectText([eventName, title, body, str(project.path_with_namespace), str(user.username)]),
    changes,
    raw,
  };
}
