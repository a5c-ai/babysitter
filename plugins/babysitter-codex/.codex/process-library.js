'use strict';

const fs = require('fs');
const path = require('path');

function resolveStateDir(repoRoot) {
  const root = repoRoot || process.cwd();
  const override = process.env.BABYSITTER_STATE_DIR;
  if (override) {
    return path.isAbsolute(override) ? override : path.resolve(root, override);
  }
  return path.join(root, '.a5c');
}

function readActiveProcessLibraryState(repoRoot) {
  const statePath = path.join(resolveStateDir(repoRoot), 'active', 'process-library.json');
  if (!fs.existsSync(statePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch {
    return null;
  }
}

function resolveActiveBinding(repoRoot) {
  const state = readActiveProcessLibraryState(repoRoot);
  if (!state) return null;
  const runId = process.env.BABYSITTER_RUN_ID;
  const sessionId = process.env.BABYSITTER_SESSION_ID;
  if (runId && state.runBindings && state.runBindings[runId]) {
    return state.runBindings[runId];
  }
  if (sessionId && state.sessionBindings && state.sessionBindings[sessionId]) {
    return state.sessionBindings[sessionId];
  }
  return state.defaultBinding || null;
}

function resolveProcessLibraryRoot(repoRoot) {
  const root = repoRoot || process.cwd();
  const activeBinding = resolveActiveBinding(root);
  if (activeBinding && activeBinding.dir) {
    return path.isAbsolute(activeBinding.dir)
      ? activeBinding.dir
      : path.resolve(root, activeBinding.dir);
  }
  const override = process.env.BABYSITTER_PROCESS_LIBRARY_ROOT;
  if (override) {
    return path.isAbsolute(override) ? override : path.resolve(root, override);
  }
  return path.join(root, 'upstream', 'babysitter', 'skills', 'babysit', 'process');
}

function resolveReferenceRoot(repoRoot) {
  const root = repoRoot || process.cwd();
  return path.join(root, 'upstream', 'babysitter', 'skills', 'babysit', 'reference');
}

function countFiles(dir, predicate) {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(full);
      } else if (!predicate || predicate(full)) {
        total += 1;
      }
    }
  }
  return total;
}

function getLibraryStats(repoRoot) {
  const processRoot = resolveProcessLibraryRoot(repoRoot);
  const referenceRoot = resolveReferenceRoot(repoRoot);
  return {
    processRoot,
    referenceRoot,
    processFiles: countFiles(processRoot, (f) => /\.(js|md|json)$/i.test(f)),
    skillFiles: countFiles(processRoot, (f) => /\\skills\\.*\\SKILL\.md$/i.test(f) || /\/skills\/.*\/SKILL\.md$/i.test(f)),
    agentFiles: countFiles(processRoot, (f) => /\\agents\\.*\\AGENT\.md$/i.test(f) || /\/agents\/.*\/AGENT\.md$/i.test(f)),
    exists: fs.existsSync(processRoot),
  };
}

module.exports = {
  resolveProcessLibraryRoot,
  resolveReferenceRoot,
  getLibraryStats,
};
