'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const crypto = require('crypto');

const EVENT_VERSION = 'v1';

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function eventsPath(repoRoot) {
  const root = repoRoot || process.cwd();
  return path.join(root, '.a5c', 'events', 'events.jsonl');
}

function emitEvent(eventType, payload, options = {}) {
  const root = options.repoRoot || process.cwd();
  const runId = payload && payload.runId ? payload.runId : 'global';
  const seqPath = path.join(root, '.a5c', 'events', `${runId}.seq`);
  let seq = 1;
  try {
    if (fs.existsSync(seqPath)) {
      seq = Number(fs.readFileSync(seqPath, 'utf8') || '0') + 1;
    }
  } catch {
    seq = 1;
  }
  ensureDir(path.dirname(seqPath));
  fs.writeFileSync(seqPath, String(seq), 'utf8');

  const ts = new Date().toISOString();
  const id = crypto
    .createHash('sha1')
    .update(`${runId}|${eventType}|${ts}|${seq}|${JSON.stringify(payload || {})}`)
    .digest('hex')
    .slice(0, 20);
  const entry = {
    version: EVENT_VERSION,
    id,
    seq,
    ts,
    type: eventType,
    runId,
    payload: payload || {},
  };

  const p = eventsPath(root);
  ensureDir(path.dirname(p));
  fs.appendFileSync(p, JSON.stringify(entry) + '\n', 'utf8');
  return entry;
}

function notify(event) {
  const sinks = String(process.env.BABYSITTER_NOTIFY_SINKS || 'webhook,slack,desktop')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const webhook = process.env.BABYSITTER_NOTIFY_WEBHOOK_URL;
  if (webhook && sinks.includes('webhook')) {
    try {
      fetch(webhook, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(event),
      }).catch(() => {});
    } catch {
      // best effort
    }
  }

  const slackWebhook = process.env.BABYSITTER_NOTIFY_SLACK_WEBHOOK;
  if (slackWebhook && sinks.includes('slack')) {
    try {
      const text = `[babysitter] ${event.type} - ${JSON.stringify(event.payload).slice(0, 200)}`;
      fetch(slackWebhook, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      }).catch(() => {});
    } catch {
      // best effort
    }
  }

  if (process.env.BABYSITTER_NOTIFY_DESKTOP === '1' && sinks.includes('desktop')) {
    const msg = `babysitter: ${event.type}`;
    if (process.platform === 'darwin') {
      spawnSync('osascript', ['-e', `display notification "${msg}" with title "babysitter-codex"`], { stdio: 'ignore' });
    } else if (process.platform === 'linux') {
      spawnSync('notify-send', ['babysitter-codex', msg], { stdio: 'ignore' });
    } else if (process.platform === 'win32') {
      // Best effort no-op without external dependency.
    }
  }

  if (sinks.includes('file')) {
    const root = process.env.BABYSITTER_REPO_ROOT || process.cwd();
    const outPath = path.join(root, '.a5c', 'events', 'notifications.jsonl');
    ensureDir(path.dirname(outPath));
    fs.appendFileSync(outPath, JSON.stringify({
      ts: new Date().toISOString(),
      type: event.type,
      runId: event.runId || null,
      id: event.id || null,
      payload: event.payload || {},
    }) + '\n', 'utf8');
  }
}

module.exports = {
  EVENT_VERSION,
  emitEvent,
  notify,
};
