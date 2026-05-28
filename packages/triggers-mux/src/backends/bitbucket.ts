import type { NormalizedTriggerEvent, TriggerChange } from '../types.js';
import { arr, asRecord, change, collectText, str } from './utils.js';

export function normalizeBitbucket(eventName: string, event: Record<string, unknown>, raw: unknown): NormalizedTriggerEvent {
  const repository = asRecord(event.repository);
  const actor = asRecord(event.actor);
  const pullRequest = asRecord(event.pullrequest);
  const push = asRecord(event.push);
  const pushChange = asRecord(arr(push.changes)[0] ?? {});
  const pushNew = asRecord(pushChange.new);
  const pushTarget = asRecord(pushNew.target);
  const changes = arr(push.changes).flatMap((entry) => {
    const newTarget = asRecord(asRecord(entry).new).target;
    const files = arr(asRecord(newTarget).files);
    return files.map((file) => change(asRecord(file).path, asRecord(file).type));
  }).filter((entry): entry is TriggerChange => Boolean(entry));
  const title = str(pullRequest.title);
  const body = str(pullRequest.description);

  return {
    backend: 'bitbucket',
    eventName,
    action: eventName.split(':')[1],
    actor: str(actor.nickname) ?? str(actor.display_name),
    repository: str(repository.full_name),
    ref: str(pushNew.name),
    sha: str(pushTarget.hash),
    title,
    body,
    url: str(asRecord(asRecord(pullRequest.links).html).href),
    sourceBranch: str(asRecord(pullRequest.source && asRecord(pullRequest.source).branch).name),
    targetBranch: str(asRecord(pullRequest.destination && asRecord(pullRequest.destination).branch).name),
    labels: [],
    text: collectText([eventName, title, body, str(repository.full_name), str(actor.nickname)]),
    changes,
    raw,
  };
}
