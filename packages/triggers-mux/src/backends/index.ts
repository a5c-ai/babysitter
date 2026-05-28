import type { NormalizedTriggerEvent, TriggerBackend } from '../types.js';
import { asRecord } from './utils.js';
import { normalizeBitbucket } from './bitbucket.js';
import { normalizeGeneric } from './generic-webhook.js';
import { normalizeGithub } from './github.js';
import { normalizeGitlab } from './gitlab.js';

export function normalizeEvent(backend: TriggerBackend, eventName: string, payload: unknown): NormalizedTriggerEvent {
  const event = asRecord(payload);
  if (backend === 'github') return normalizeGithub(eventName, event, payload);
  if (backend === 'gitlab') return normalizeGitlab(eventName, event, payload);
  if (backend === 'bitbucket') return normalizeBitbucket(eventName, event, payload);
  return normalizeGeneric(eventName, event, payload);
}

export { normalizeBitbucket } from './bitbucket.js';
export { normalizeGeneric } from './generic-webhook.js';
export { normalizeGithub } from './github.js';
export { normalizeGitlab } from './gitlab.js';
