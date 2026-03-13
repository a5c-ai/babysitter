'use strict';

const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function indexPath(repoRoot) {
  return path.join(repoRoot || process.cwd(), '.a5c', 'index', 'sessions.json');
}

function loadIndex(repoRoot) {
  const p = indexPath(repoRoot);
  if (!fs.existsSync(p)) return { version: 1, sessions: [] };
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (!data || !Array.isArray(data.sessions)) return { version: 1, sessions: [] };
    return data;
  } catch {
    return { version: 1, sessions: [] };
  }
}

function saveIndex(repoRoot, data) {
  const p = indexPath(repoRoot);
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}

function registerSession(repoRoot, session) {
  const data = loadIndex(repoRoot);
  const now = new Date().toISOString();
  const existing = data.sessions.find((s) => s.sessionId === session.sessionId);
  if (existing) {
    existing.updatedAt = now;
    existing.lastRunId = session.runId || existing.lastRunId || null;
    existing.tags = Array.from(new Set([...(existing.tags || []), ...(session.tags || [])]));
    if (session.alias) existing.alias = session.alias;
  } else {
    data.sessions.push({
      sessionId: session.sessionId,
      alias: session.alias || null,
      tags: session.tags || [],
      createdAt: now,
      updatedAt: now,
      lastRunId: session.runId || null,
      runIds: session.runId ? [session.runId] : [],
    });
  }
  if (session.runId) {
    const target = data.sessions.find((s) => s.sessionId === session.sessionId);
    if (target) {
      target.runIds = Array.from(new Set([...(target.runIds || []), session.runId]));
      target.lastRunId = session.runId;
    }
  }
  saveIndex(repoRoot, data);
  return data;
}

function findSession(repoRoot, selector) {
  const data = loadIndex(repoRoot);
  const token = String(selector || '').trim();
  if (!token || token === 'recent') {
    return [...data.sessions].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0] || null;
  }
  if (token.startsWith('tag:')) {
    const tag = token.slice(4);
    return [...data.sessions]
      .filter((s) => (s.tags || []).includes(tag))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0] || null;
  }
  if (token.startsWith('search:')) {
    const query = token.slice(7).trim().toLowerCase();
    if (!query) return null;
    return [...data.sessions]
      .filter((s) => {
        const alias = String(s.alias || '').toLowerCase();
        const sessionId = String(s.sessionId || '').toLowerCase();
        const tags = (s.tags || []).map((t) => String(t).toLowerCase());
        return alias.includes(query) || sessionId.includes(query) || tags.some((t) => t.includes(query));
      })
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0] || null;
  }
  return data.sessions.find((s) => s.alias === token || s.sessionId === token) || null;
}

function listSessions(repoRoot, options = {}) {
  const data = loadIndex(repoRoot);
  const query = String(options.query || '').trim().toLowerCase();
  const tag = String(options.tag || '').trim();
  const includeRecentFirst = options.includeRecentFirst !== false;

  let sessions = [...data.sessions];
  if (tag) {
    sessions = sessions.filter((s) => (s.tags || []).includes(tag));
  }
  if (query) {
    sessions = sessions.filter((s) => {
      const alias = String(s.alias || '').toLowerCase();
      const sessionId = String(s.sessionId || '').toLowerCase();
      const tags = (s.tags || []).map((t) => String(t).toLowerCase());
      return alias.includes(query) || sessionId.includes(query) || tags.some((t) => t.includes(query));
    });
  }
  if (includeRecentFirst) {
    sessions.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }
  return sessions;
}

function updateSessionMetadata(repoRoot, sessionId, updates = {}) {
  if (!sessionId) return { ok: false, error: 'sessionId is required' };
  const data = loadIndex(repoRoot);
  const target = data.sessions.find((s) => s.sessionId === sessionId);
  if (!target) {
    return { ok: false, error: `session ${sessionId} not found` };
  }

  if (updates.alias !== undefined) {
    const alias = String(updates.alias || '').trim();
    target.alias = alias || null;
  }
  if (Array.isArray(updates.tags)) {
    target.tags = Array.from(new Set(updates.tags.map((t) => String(t).trim()).filter(Boolean)));
  }
  if (updates.addTag) {
    target.tags = Array.from(new Set([...(target.tags || []), String(updates.addTag).trim()]));
  }
  if (updates.removeTag) {
    target.tags = (target.tags || []).filter((t) => t !== String(updates.removeTag).trim());
  }
  if (updates.runId) {
    target.runIds = Array.from(new Set([...(target.runIds || []), updates.runId]));
    target.lastRunId = updates.runId;
  }
  target.updatedAt = new Date().toISOString();
  saveIndex(repoRoot, data);
  return { ok: true, session: target };
}

module.exports = {
  loadIndex,
  saveIndex,
  registerSession,
  findSession,
  listSessions,
  updateSessionMetadata,
};
