import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..', '..');
const indexPath = path.resolve(__dirname, '..', 'src', 'index.json');

const args = process.argv.slice(2);
const strict = args.includes('--strict');

const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

const claims = Object.values(index.records).filter(r => r._kind === 'TestableClaim');

const results = { passing: [], failing: [], error: [], 'no-command': [] };

for (const claim of claims) {
  const cmd = claim.testCommand;
  if (!cmd) {
    results['no-command'].push({ id: claim.id, displayName: claim.displayName });
    continue;
  }

  try {
    execSync(cmd, { cwd: root, timeout: 30_000, stdio: 'pipe' });
    results.passing.push({ id: claim.id, displayName: claim.displayName });
  } catch (err) {
    if (err.killed || err.signal === 'SIGTERM') {
      results.error.push({ id: claim.id, displayName: claim.displayName, reason: 'timeout (30s)' });
    } else if (err.status != null) {
      results.failing.push({ id: claim.id, displayName: claim.displayName, exitCode: err.status });
    } else {
      results.error.push({ id: claim.id, displayName: claim.displayName, reason: String(err.message).slice(0, 200) });
    }
  }
}

console.log('=== Testable Claims Report ===');
console.log(`Total claims: ${claims.length}`);
console.log(`Passing:    ${results.passing.length}`);
console.log(`Failing:    ${results.failing.length}`);
console.log(`Error:      ${results.error.length}`);
console.log(`No command: ${results['no-command'].length}`);

if (results.passing.length > 0) {
  console.log('\n--- Passing ---');
  for (const r of results.passing) console.log(`  [PASS] ${r.id} — ${r.displayName}`);
}
if (results.failing.length > 0) {
  console.log('\n--- Failing ---');
  for (const r of results.failing) console.log(`  [FAIL] ${r.id} — ${r.displayName} (exit ${r.exitCode})`);
}
if (results.error.length > 0) {
  console.log('\n--- Errors ---');
  for (const r of results.error) console.log(`  [ERR]  ${r.id} — ${r.displayName}: ${r.reason}`);
}
if (results['no-command'].length > 0) {
  console.log('\n--- No test command ---');
  for (const r of results['no-command']) console.log(`  [SKIP] ${r.id} — ${r.displayName}`);
}

if (strict && (results.failing.length > 0 || results.error.length > 0)) {
  process.exit(1);
}
