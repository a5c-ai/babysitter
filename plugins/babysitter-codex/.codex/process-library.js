'use strict';

const fs = require('fs');
const path = require('path');

function resolveProcessLibraryRoot(repoRoot) {
  const root = repoRoot || process.cwd();
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
