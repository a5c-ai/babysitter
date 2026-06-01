import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { normalizeEvent } from './backends/index.js';
import type { EnrichmentOptions, NormalizedTriggerEvent, TriggerBackend, TriggerChange } from './types.js';

const execFileAsync = promisify(execFile);

function detectBackend(value: string | undefined): TriggerBackend {
  if (value === 'gitlab' || value === 'bitbucket' || value === 'generic-webhook') return value;
  return 'github';
}

async function readPayload(options: EnrichmentOptions): Promise<unknown> {
  if (options.event !== undefined) return options.event;
  const eventPath = options.eventPath ?? process.env.GITHUB_EVENT_PATH;
  if (!eventPath) return {};
  return JSON.parse(await readFile(eventPath, 'utf8')) as unknown;
}

function uniqueChanges(changes: TriggerChange[]): TriggerChange[] {
  const byPath = new Map<string, TriggerChange>();
  for (const change of changes) {
    const previous = byPath.get(change.path);
    byPath.set(change.path, { ...previous, ...change, patch: change.patch ?? previous?.patch });
  }
  return [...byPath.values()].sort((a, b) => a.path.localeCompare(b.path));
}

async function enrichWithLocalGit(event: NormalizedTriggerEvent, cwd: string): Promise<TriggerChange[]> {
  const ref = event.sha ?? 'HEAD';
  try {
    const { stdout } = await execFileAsync('git', ['show', '--format=', '--name-status', ref], { cwd });
    const changes: TriggerChange[] = [];
    for (const line of stdout.split(/\r?\n/)) {
      const [status, filePath] = line.split(/\s+/, 2);
      if (filePath) changes.push({ path: filePath, status });
    }
    return changes;
  } catch {
    return [];
  }
}

async function enrichDiffsWithLocalGit(event: NormalizedTriggerEvent, cwd: string): Promise<TriggerChange[]> {
  const ref = event.sha ?? 'HEAD';
  try {
    const { stdout } = await execFileAsync('git', ['show', '--format=', '--unified=80', ref], { cwd, maxBuffer: 10 * 1024 * 1024 });
    const patches = stdout.split(/^diff --git /m).slice(1);
    const byPath = new Map<string, string>();
    for (const patch of patches) {
      const match = patch.match(/^a\/(.*?) b\/(.*?)\r?\n/);
      if (match) byPath.set(match[2]!, `diff --git ${patch}`);
    }
    return event.changes.map((entry) => ({ ...entry, patch: entry.patch ?? byPath.get(entry.path) }));
  } catch {
    return event.changes;
  }
}

async function enrichGithubFromApi(event: NormalizedTriggerEvent, options: EnrichmentOptions): Promise<TriggerChange[]> {
  if (!options.token || !event.repository) return [];
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = options.baseUrl ?? 'https://api.github.com';
  const headers = {
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${options.token}`,
    'user-agent': 'a5c-ai-triggers',
  };

  const raw = event.raw && typeof event.raw === 'object' ? event.raw as Record<string, unknown> : {};
  const pullRequest = raw.pull_request && typeof raw.pull_request === 'object' ? raw.pull_request as Record<string, unknown> : undefined;
  const number = pullRequest && typeof pullRequest.number === 'number' ? pullRequest.number : undefined;
  const endpoint = number
    ? `${baseUrl}/repos/${event.repository}/pulls/${number}/files?per_page=100`
    : event.sha
      ? `${baseUrl}/repos/${event.repository}/commits/${event.sha}`
      : undefined;
  if (!endpoint) return [];

  const response = await fetchImpl(endpoint, { headers });
  if (!response.ok) {
    process.stderr.write(`[triggers-mux] GitHub API ${response.status}: ${endpoint}\n`);
    return [];
  }
  const payload = await response.json() as unknown;
  const files = Array.isArray(payload) ? payload : Array.isArray((payload as { files?: unknown }).files) ? (payload as { files: unknown[] }).files : [];
  const changes: TriggerChange[] = [];
  for (const file of files) {
    const record = file as Record<string, unknown>;
    if (typeof record.filename !== 'string') continue;
    changes.push({
      path: record.filename,
      status: typeof record.status === 'string' ? record.status : undefined,
      patch: typeof record.patch === 'string' ? record.patch : undefined,
    });
  }
  return changes;
}

export async function enrichEvent(options: EnrichmentOptions = {}): Promise<NormalizedTriggerEvent> {
  const backend = detectBackend(options.backend ?? process.env.AMUX_TRIGGER_BACKEND);
  const eventName = options.eventName ?? process.env.GITHUB_EVENT_NAME ?? process.env.AMUX_TRIGGER_EVENT ?? 'webhook';
  const payload = await readPayload(options);
  const event = normalizeEvent(backend, eventName, payload);
  const cwd = options.cwd ?? process.env.GITHUB_WORKSPACE ?? process.cwd();
  const apiChanges = backend === 'github' ? await enrichGithubFromApi(event, options) : [];
  const localChanges = event.changes.length === 0 ? await enrichWithLocalGit(event, cwd) : [];
  event.changes = uniqueChanges([...event.changes, ...apiChanges, ...localChanges]);
  if (options.includeDiff) {
    event.changes = await enrichDiffsWithLocalGit(event, cwd);
  }
  event.text = [event.text, ...event.changes.map((entry) => `${entry.status ?? ''} ${entry.path} ${entry.patch ?? ''}`)].join('\n');
  return event;
}
