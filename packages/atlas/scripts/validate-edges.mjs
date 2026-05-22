import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(__dirname, '..', 'src', 'index.json');

const args = process.argv.slice(2);
const summaryOnly = args.includes('--summary');
const strict = args.includes('--strict');
const thresholdArg = args.find(a => a.startsWith('--max-dangling='));
const maxDangling = thresholdArg ? parseInt(thresholdArg.split('=')[1]) : Infinity;

const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const recordIds = new Set(Object.keys(index.records));
const edges = index.edges;

let valid = 0;
let dangling = 0;
const danglingByPrefix = {};
const danglingList = [];

for (const edge of edges) {
  if (recordIds.has(edge.to)) {
    valid++;
  } else {
    dangling++;
    const prefix = edge.to.split(':')[0] || 'unknown';
    danglingByPrefix[prefix] = (danglingByPrefix[prefix] || 0) + 1;
    if (!summaryOnly) {
      danglingList.push({ from: edge.from, to: edge.to, kind: edge.kind });
    }
  }
}

console.log('=== Dangling Edge Report ===');
console.log(`Total edges: ${valid + dangling}`);
console.log(`Valid: ${valid} (${((valid/(valid+dangling))*100).toFixed(1)}%)`);
console.log(`Dangling: ${dangling} (${((dangling/(valid+dangling))*100).toFixed(1)}%)`);
console.log('');
console.log('By target prefix:');
for (const [prefix, count] of Object.entries(danglingByPrefix).sort((a,b) => b[1]-a[1])) {
  console.log(`  ${prefix}: ${count}`);
}

if (!summaryOnly && danglingList.length > 0) {
  console.log('');
  console.log('Full list:');
  for (const d of danglingList.slice(0, 200)) {
    console.log(`  ${d.from} → ${d.to} (${d.kind})`);
  }
  if (danglingList.length > 200) {
    console.log(`  ... and ${danglingList.length - 200} more`);
  }
}

if (strict && dangling > maxDangling) {
  process.exit(1);
}
