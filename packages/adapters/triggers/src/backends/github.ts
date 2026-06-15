import type { NormalizedTriggerEvent, TriggerChange } from '../types.js';
import { arr, asRecord, change, collectText, labelsFrom, str } from './utils.js';

export function normalizeGithub(eventName: string, event: Record<string, unknown>, raw: unknown): NormalizedTriggerEvent {
  const repository = asRecord(event.repository);
  const sender = asRecord(event.sender);
  const issue = asRecord(event.issue);
  const pullRequest = asRecord(event.pull_request);
  const comment = asRecord(event.comment);
  const headCommit = asRecord(event.head_commit);
  const commits = arr(event.commits).map(asRecord);
  const changes = commits.flatMap((commit) => [
    ...arr(commit.added).map((path) => change(path, 'added')),
    ...arr(commit.modified).map((path) => change(path, 'modified')),
    ...arr(commit.removed).map((path) => change(path, 'removed')),
  ]).filter((entry): entry is TriggerChange => Boolean(entry));
  const title = str(issue.title) ?? str(pullRequest.title) ?? str(headCommit.message);
  const body = str(comment.body) ?? str(issue.body) ?? str(pullRequest.body) ?? str(headCommit.message);

  return {
    backend: 'github',
    eventName,
    action: str(event.action),
    actor: str(sender.login),
    repository: str(repository.full_name),
    ref: str(event.ref),
    sha: str(event.after) ?? str(headCommit.id) ?? str(pullRequest.head && asRecord(pullRequest.head).sha),
    title,
    body,
    url: str(comment.html_url) ?? str(issue.html_url) ?? str(pullRequest.html_url),
    sourceBranch: str(asRecord(pullRequest.head).ref),
    targetBranch: str(asRecord(pullRequest.base).ref),
    labels: labelsFrom(issue.labels ?? pullRequest.labels),
    text: collectText([eventName, str(event.action), title, body, str(repository.full_name), str(sender.login)]),
    changes,
    raw,
  };
}
