'use strict';

const fs = require('fs');
const path = require('path');

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function parseMetadata(filePath, processRoot) {
  const rel = path.relative(processRoot, filePath).replace(/\\/g, '/');
  const text = fs.readFileSync(filePath, 'utf8');
  const tags = [];
  const m = text.match(/@process\s+([^\n\r]+)/);
  if (m) tags.push(m[1].trim());
  return {
    path: rel,
    absPath: filePath,
    tags,
    kind: path.extname(filePath).toLowerCase(),
  };
}

function buildIndex(processRoot, indexPath) {
  const files = walk(processRoot).filter((f) => /\.(js|md|json)$/i.test(f));
  const entries = files.map((f) => parseMetadata(f, processRoot));
  const payload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    processRoot,
    count: entries.length,
    entries,
  };
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  fs.writeFileSync(indexPath, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

function loadIndex(indexPath) {
  if (!fs.existsSync(indexPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  } catch {
    return null;
  }
}

function searchIndex(index, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return index.entries || [];
  return (index.entries || []).filter((e) =>
    e.path.toLowerCase().includes(q) || (e.tags || []).some((t) => String(t).toLowerCase().includes(q))
  );
}

module.exports = {
  buildIndex,
  loadIndex,
  searchIndex,
};
