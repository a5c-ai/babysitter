import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(__dirname, '..', 'src', 'index.json');

const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

const claims = Object.values(index.records).filter(r => r._kind === 'TestableClaim');
const untested = claims.filter(c => !c.testCommand);

console.log(`=== Untested Claims (${untested.length} / ${claims.length}) ===\n`);

const byPriority = { critical: [], high: [], medium: [], low: [] };
for (const c of untested) {
  const p = c.priority || 'medium';
  if (!byPriority[p]) byPriority[p] = [];
  byPriority[p].push(c);
}

for (const priority of ['critical', 'high', 'medium', 'low']) {
  const group = byPriority[priority];
  if (!group || group.length === 0) continue;
  console.log(`--- ${priority.toUpperCase()} (${group.length}) ---`);
  for (const c of group) {
    const testType = c.testType || 'unknown';
    const category = c.category || 'uncategorized';
    console.log(`  ${c.id}`);
    console.log(`    ${c.displayName} [${testType}/${category}]`);
    console.log(`    Suggestion: add a testCommand that validates the claim assertion`);
  }
  console.log('');
}

if (untested.length === 0) {
  console.log('All claims have test commands.');
}
