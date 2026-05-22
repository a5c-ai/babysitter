import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(__dirname, '..', 'src', 'index.json');
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

const deferred = Object.values(index.records).filter(r => r._kind === 'DeferredNode');
const resolved = deferred.filter(d => d.resolvedTo);
const unresolved = deferred.filter(d => !d.resolvedTo);

console.log(`=== Deferred Node Resolution ===`);
console.log(`Total: ${deferred.length}  Resolved: ${resolved.length}  Open: ${unresolved.length}`);

if (resolved.length > 0) {
  console.log(`\n--- Resolved (can be removed) ---`);
  for (const d of resolved) {
    const targetExists = index.records[d.resolvedTo];
    const status = targetExists ? 'target exists' : 'TARGET MISSING';
    console.log(`  ${d.id} → ${d.resolvedTo} [${status}]`);
  }
}

if (unresolved.length > 0) {
  console.log(`\n--- Open (need resolution) ---`);
  for (const d of unresolved) {
    const priority = d.priority || 'unset';
    const targetKind = d.targetNodeKind || 'unknown';
    console.log(`  ${d.id} (${priority}, target: ${targetKind}) — ${d.displayName}`);
    if (d.description) console.log(`    ${d.description.trim().split('\n')[0]}`);
  }
}

if (process.argv.includes('--prune') && resolved.length > 0) {
  const graphDir = path.resolve(__dirname, '..', 'graph');
  const deferredFiles = new Set(resolved.map(d => path.join(graphDir, d._file)));
  let pruned = 0;

  for (const file of deferredFiles) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    for (const d of resolved.filter(r => path.join(graphDir, r._file) === file)) {
      const idPattern = new RegExp(
        `---\\s*\\n[\\s\\S]*?id:\\s*${d.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=\\n---\\s*\\n|$)`,
        'g'
      );
      const newContent = content.replace(idPattern, '');
      if (newContent !== content) {
        content = newContent;
        modified = true;
        pruned++;
      }
    }

    if (modified) {
      content = content.replace(/\n{3,}/g, '\n\n').replace(/^---\s*\n---/gm, '---');
      fs.writeFileSync(file, content);
    }
  }

  console.log(`\nPruned ${pruned} resolved deferred nodes from YAML files.`);
}
