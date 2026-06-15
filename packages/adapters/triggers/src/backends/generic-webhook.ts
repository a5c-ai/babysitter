import type { NormalizedTriggerEvent, TriggerChange } from '../types.js';
import { arr, asRecord, change, collectText, str } from './utils.js';

export function normalizeGeneric(eventName: string, event: Record<string, unknown>, raw: unknown): NormalizedTriggerEvent {
  const changes = arr(event.changes).map((entry) => {
    const record = asRecord(entry);
    return change(record.path ?? record.file ?? record.filename, record.status, record.patch ?? record.diff);
  }).filter((entry): entry is TriggerChange => Boolean(entry));
  const title = str(event.title);
  const body = str(event.body) ?? str(event.message) ?? str(event.text);

  return {
    backend: 'generic-webhook',
    eventName: str(event.event) ?? eventName,
    action: str(event.action),
    actor: str(event.actor) ?? str(event.user),
    repository: str(event.repository) ?? str(event.repo),
    ref: str(event.ref) ?? str(event.branch),
    sha: str(event.sha) ?? str(event.commit),
    title,
    body,
    url: str(event.url),
    sourceBranch: str(event.sourceBranch),
    targetBranch: str(event.targetBranch),
    labels: arr(event.labels).map(String),
    text: collectText([eventName, title, body, str(event.repository), str(event.actor)]),
    changes,
    raw,
  };
}
