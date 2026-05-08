import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(__dirname, '..', 'src', 'index.json');
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

const deferred = Object.values(index.records).filter(r => r._kind === 'DeferredNode');
console.log(`=== Deferred Nodes (${deferred.length}) ===`);

const byPriority = {};
const byTarget = {};
for (const d of deferred) {
  const p = d.priority || 'unset';
  const t = d.targetNodeKind || 'unknown';
  byPriority[p] = (byPriority[p] || 0) + 1;
  byTarget[t] = (byTarget[t] || 0) + 1;
  const resolved = d.resolvedTo ? ' [RESOLVED → ' + d.resolvedTo + ']' : '';
  console.log(`  ${d.id} (${p}) — ${d.displayName}${resolved}`);
}
console.log(`\nBy priority: ${JSON.stringify(byPriority)}`);
console.log(`By target kind: ${JSON.stringify(byTarget)}`);
