import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(__dirname, '..', 'src', 'index.json');
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

const canon = index.edges.filter(e => e.kind === 'canonicalized_to');
const byTarget = {};
for (const e of canon) {
  if (!byTarget[e.to]) byTarget[e.to] = [];
  byTarget[e.to].push(e.from);
}

console.log('=== Canonicalization Compaction Report ===');
console.log(`Canonical targets: ${Object.keys(byTarget).length}`);
console.log(`Alias nodes: ${canon.length}`);
console.log('');

for (const [target, aliases] of Object.entries(byTarget).sort((a, b) => b[1].length - a[1].length)) {
  const targetRecord = index.records[target];
  console.log(`${target} (${targetRecord?.displayName || 'unknown'})`);

  const aliasEdges = index.edges.filter(e => aliases.includes(e.from) && e.kind !== 'canonicalized_to');
  const targetEdges = index.edges.filter(e => e.from === target || e.to === target);

  console.log(`  Aliases: ${aliases.join(', ')}`);
  console.log(`  Alias edges (non-canon): ${aliasEdges.length}`);
  console.log(`  Target edges: ${targetEdges.length}`);

  const edgesToMigrate = aliasEdges.filter(e => {
    const existing = targetEdges.find(te =>
      te.kind === e.kind && (te.to === e.to || te.from === e.from)
    );
    return !existing;
  });
  console.log(`  Edges to migrate: ${edgesToMigrate.length}`);
  for (const e of edgesToMigrate) {
    console.log(`    ${e.kind}: ${e.from} → ${e.to}`);
  }

  const refEdges = index.edges.filter(e => aliases.includes(e.to) && e.kind !== 'canonicalized_to');
  console.log(`  Incoming refs to aliases: ${refEdges.length}`);
  for (const e of refEdges.slice(0, 5)) {
    console.log(`    ${e.from} --${e.kind}--> ${e.to} (should → ${target})`);
  }
  console.log('');
}

console.log('Run with --apply to rewrite YAML files.');
