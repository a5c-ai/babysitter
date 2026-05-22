/**
 * validate-library-bridge.mjs
 *
 * Post-build quality gate for the generated library graph. Runs after
 * generate-library-nodes.mjs + indexer and validates coverage, connectivity,
 * attribute completeness, edge integrity, distribution health, and
 * cross-graph semantics of LibraryProcess, LibrarySkill, and LibraryAgent
 * nodes.
 *
 * Exit code: 0 if all checks pass, 1 if any threshold is violated (--strict).
 * Run: node packages/atlas/scripts/validate-library-bridge.mjs [--strict] [--verbose]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(__dirname, '..', 'src', 'index.json');

if (!fs.existsSync(indexPath)) {
  console.error('index.json not found — run npm run build first');
  process.exit(1);
}

const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
const records = Object.values(index.records);
const edges = index.edges;
const strict = process.argv.includes('--strict');
const verbose = process.argv.includes('--verbose');

// ── Helpers ──
const pct = (n, d) => d > 0 ? (n / d * 100) : 0;
const pad = (s, w = 7) => String(s).padStart(w);
const recordIds = new Set(Object.keys(index.records));
const libPrefix = (id) => id.startsWith('lib-process:') || id.startsWith('lib-skill:') || id.startsWith('lib-agent:');

// ── Entities ──
const lp = records.filter(r => r._kind === 'LibraryProcess');
const ls = records.filter(r => r._kind === 'LibrarySkill');
const la = records.filter(r => r._kind === 'LibraryAgent');
const total = lp.length + ls.length + la.length;
const allLib = [...lp, ...ls, ...la];

const deg = new Map();
for (const e of edges) { deg.set(e.from, (deg.get(e.from) || 0) + 1); deg.set(e.to, (deg.get(e.to) || 0) + 1); }

const libEdges = edges.filter(e => libPrefix(e.from));
const nonLibIds = new Set(records.filter(r => !['LibraryProcess', 'LibrarySkill', 'LibraryAgent'].includes(r._kind)).map(r => r.id));

// ── Results ──
const failures = [];
const warnings = [];
const info = [];

function check(label, actual, threshold, unit = '%') {
  const pass = actual >= threshold;
  const icon = pass ? '✓' : '✗';
  const tag = pass ? '' : ' ← FAIL';
  console.log(`  ${icon} ${label}: ${typeof actual === 'number' ? actual.toFixed(1) : actual}${unit} (≥${threshold}${unit})${tag}`);
  if (!pass) failures.push(label);
  return pass;
}

function warn(label, detail) {
  warnings.push(`${label}: ${detail}`);
  console.log(`  ⚠ ${label}: ${detail}`);
}

function note(label, detail) {
  info.push(`${label}: ${detail}`);
  console.log(`  ℹ ${label}: ${detail}`);
}

const W = 56;
const header = (title) => `╠${'═'.repeat(W - 2)}╣\n║ ${title.padEnd(W - 4)} ║`;

// ═══════════════════════════════════════════════════
console.log(`╔${'═'.repeat(W - 2)}╗`);
console.log(`║   Library Bridge Quality Report               ║`);
console.log(`╠${'═'.repeat(W - 2)}╣`);
console.log(`║ Processes: ${pad(lp.length)}  Skills: ${pad(ls.length)}  Agents: ${pad(la.length)}  ║`);
console.log(`║ Total: ${pad(total)}     Edges: ${pad(libEdges.length)}               ║`);

// ═══════════════════════════════════════════════════
// 1. ENTITY COUNTS & SANITY
// ═══════════════════════════════════════════════════
console.log(header('1. ENTITY COUNTS'));
check('Processes exist', lp.length, 500, '');
check('Skills exist', ls.length, 500, '');
check('Agents exist', la.length, 500, '');

// Duplicate ID check
const idCounts = {};
for (const r of allLib) idCounts[r.id] = (idCounts[r.id] || 0) + 1;
const dupes = Object.entries(idCounts).filter(([, v]) => v > 1);
check('No duplicate IDs', dupes.length === 0 ? 100 : 0, 100);
if (dupes.length > 0 && verbose) {
  for (const [id, c] of dupes) console.log(`    DUP: ${id} (×${c})`);
}

// ═══════════════════════════════════════════════════
// 2. ZERO ORPHANS
// ═══════════════════════════════════════════════════
console.log(header('2. ORPHAN CHECK'));
const lpOrphan = lp.filter(r => !deg.has(r.id));
const lsOrphan = ls.filter(r => !deg.has(r.id));
const laOrphan = la.filter(r => !deg.has(r.id));
check('Process orphans', 100 - pct(lpOrphan.length, lp.length), 100);
check('Skill orphans', 100 - pct(lsOrphan.length, ls.length), 100);
check('Agent orphans', 100 - pct(laOrphan.length, la.length), 100);

// ═══════════════════════════════════════════════════
// 3. EDGE INTEGRITY
// ═══════════════════════════════════════════════════
console.log(header('3. EDGE INTEGRITY'));

// Dangling targets
const danglingLib = libEdges.filter(e => !recordIds.has(e.to));
check('Edge target validity', pct(libEdges.length - danglingLib.length, libEdges.length), 100);
if (danglingLib.length > 0) {
  const byKind = {};
  for (const e of danglingLib) byKind[e.kind] = (byKind[e.kind] || 0) + 1;
  for (const [k, v] of Object.entries(byKind).sort((a, b) => b[1] - a[1]))
    console.log(`    ${k}: ${v} dangling`);
}

// uses_agent targets must be LibraryAgent
const agentRefs = edges.filter(e => e.kind === 'uses_agent' && e.from.startsWith('lib-process:'));
const badAgentRefs = agentRefs.filter(e => !index.records[e.to] || index.records[e.to]._kind !== 'LibraryAgent');
check('uses_agent→LibraryAgent', pct(agentRefs.length - badAgentRefs.length, agentRefs.length || 1), 100);

// uses_skill targets must be LibrarySkill
const skillRefs = edges.filter(e => e.kind === 'uses_skill' && e.from.startsWith('lib-process:'));
const badSkillRefs = skillRefs.filter(e => !index.records[e.to] || index.records[e.to]._kind !== 'LibrarySkill');
check('uses_skill→LibrarySkill', pct(skillRefs.length - badSkillRefs.length, skillRefs.length || 1), 100);

// All edge weights are valid numbers in [0,1]
const weightedEdges = libEdges.filter(e => e.attributes?.weight != null);
const invalidWeights = weightedEdges.filter(e => {
  const w = Number(e.attributes.weight);
  return isNaN(w) || w < 0 || w > 1;
});
check('Edge weights valid', pct(weightedEdges.length - invalidWeights.length, weightedEdges.length || 1), 100);
note('Weighted edges', `${weightedEdges.length}/${libEdges.length} (${pct(weightedEdges.length, libEdges.length).toFixed(0)}%)`);

// ═══════════════════════════════════════════════════
// 4. SEMANTIC EDGE COVERAGE
// ═══════════════════════════════════════════════════
console.log(header('4. PROCESS SEMANTIC EDGES'));

const lpE = (kind) => new Set(edges.filter(e => e.kind === kind && e.from.startsWith('lib-process:')).map(e => e.from));
check('Process→skill-area', pct(lpE('lib_requires_skill_area').size, lp.length), 90);
check('Process→role', pct(lpE('lib_involves_role').size, lp.length), 90);
check('Process→workflow', pct(lpE('lib_implements_workflow').size, lp.length), 95);
check('Process→domain', pct(lpE('lib_applies_to_domain').size, lp.length), 99);
check('Process→specialization', pct(lpE('lib_belongs_to_specialization').size, lp.length), 80);

console.log(header('4b. SKILL SEMANTIC EDGES'));
const lsE = (kind) => new Set(edges.filter(e => e.kind === kind && e.from.startsWith('lib-skill:')).map(e => e.from));
check('Skill→skill-area', pct(lsE('lib_requires_skill_area').size, ls.length), 99);
check('Skill→role', pct(lsE('lib_involves_role').size, ls.length), 99);

console.log(header('4c. AGENT SEMANTIC EDGES'));
const laE = (kind) => new Set(edges.filter(e => e.kind === kind && e.from.startsWith('lib-agent:')).map(e => e.from));
check('Agent→role', pct(laE('lib_involves_role').size, la.length), 99);
check('Agent→skill-area', pct(laE('lib_requires_skill_area').size, la.length), 99);

// ═══════════════════════════════════════════════════
// 5. CROSS-GRAPH CONNECTIVITY
// ═══════════════════════════════════════════════════
console.log(header('5. CROSS-GRAPH CONNECTIVITY'));

let crossEdgeCount = 0;
for (const e of libEdges) { if (nonLibIds.has(e.to)) crossEdgeCount++; }
check('Cross-graph edges', crossEdgeCount, 5000, '');

// Bidirectional: do domain entities point BACK to lib entities?
const domainToLib = edges.filter(e => nonLibIds.has(e.from) && libPrefix(e.to));
note('Domain→lib edges', `${domainToLib.length}`);

// Internal refs
note('Process→agent refs', `${new Set(edges.filter(e => e.kind === 'uses_agent' && e.from.startsWith('lib-process:')).map(e => e.from)).size}/${lp.length}`);
note('Process→skill refs', `${new Set(edges.filter(e => e.kind === 'uses_skill' && e.from.startsWith('lib-process:')).map(e => e.from)).size}/${lp.length}`);

// ═══════════════════════════════════════════════════
// 6. ATTRIBUTE COMPLETENESS
// ═══════════════════════════════════════════════════
console.log(header('6. ATTRIBUTE COMPLETENESS'));

const withDesc = (arr, minLen) => arr.filter(r => r.description && String(r.description).trim().length > minLen);
check('Process desc (>10ch)', pct(withDesc(lp, 10).length, lp.length), 98);
check('Skill desc (>10ch)', pct(withDesc(ls, 10).length, ls.length), 95);
check('Agent desc (>10ch)', pct(withDesc(la, 10).length, la.length), 95);

const withDisplay = (arr) => arr.filter(r => r.displayName && String(r.displayName).trim().length > 0);
check('Process displayName', pct(withDisplay(lp).length, lp.length), 99);
check('Skill displayName', pct(withDisplay(ls).length, ls.length), 99);
check('Agent displayName', pct(withDisplay(la).length, la.length), 99);

// Placeholder/TODO detection
const hasPlaceholder = (r) => {
  const d = String(r.description || '').toLowerCase();
  return d.includes('todo') || d.includes('placeholder') || d.includes('tbd') || (d.length > 0 && d.length < 15);
};
const placeholders = allLib.filter(hasPlaceholder);
check('No placeholder desc', pct(allLib.length - placeholders.length, allLib.length), 99.5);
if (placeholders.length > 0 && verbose) {
  for (const p of placeholders.slice(0, 10)) console.log(`    PLACEHOLDER: ${p.id}`);
}

// ═══════════════════════════════════════════════════
// 7. DISTRIBUTION HEALTH
// ═══════════════════════════════════════════════════
console.log(header('7. DISTRIBUTION HEALTH'));

// Workflow concentration: no single workflow should have >30% of all process edges
const wfEdges = edges.filter(e => e.kind === 'lib_implements_workflow' && e.from.startsWith('lib-process:'));
const wfCounts = {};
for (const e of wfEdges) wfCounts[e.to] = (wfCounts[e.to] || 0) + 1;
const sortedWf = Object.entries(wfCounts).sort((a, b) => b[1] - a[1]);
const topWfPct = sortedWf[0] ? pct(sortedWf[0][1], lp.length) : 0;
check('Workflow not over-concentrated', 100 - topWfPct, 70);
note('Top workflow', `${sortedWf[0]?.[0]} at ${topWfPct.toFixed(1)}%`);
if (verbose) {
  console.log('    Top 5 workflows:');
  for (const [k, v] of sortedWf.slice(0, 5)) console.log(`      ${k}: ${v} (${pct(v, lp.length).toFixed(1)}%)`);
}

// Skill-area concentration
const saEdges = edges.filter(e => e.kind === 'lib_requires_skill_area');
const saCounts = {};
for (const e of saEdges) saCounts[e.to] = (saCounts[e.to] || 0) + 1;
const sortedSA = Object.entries(saCounts).sort((a, b) => b[1] - a[1]);
const topSAPct = sortedSA[0] ? pct(sortedSA[0][1], saEdges.length) : 0;
check('Skill-area not over-concentrated', 100 - topSAPct, 90);
note('Top skill-area', `${sortedSA[0]?.[0]} at ${topSAPct.toFixed(1)}%`);

// Target diversity minimums
const uniqueTargets = (kind) => new Set(edges.filter(e => e.kind === kind).map(e => e.to)).size;
check('Unique skill-area targets', uniqueTargets('lib_requires_skill_area'), 50, '');
check('Unique role targets', uniqueTargets('lib_involves_role'), 20, '');
check('Unique workflow targets', uniqueTargets('lib_implements_workflow'), 20, '');
check('Unique domain targets', uniqueTargets('lib_applies_to_domain'), 10, '');
check('Unique specialization targets', uniqueTargets('lib_belongs_to_specialization'), 15, '');

// Edge weight distribution: should have a mix, not all weight=1
const weightDist = {};
for (const e of libEdges) {
  const w = e.attributes?.weight != null ? String(e.attributes.weight) : 'none';
  weightDist[w] = (weightDist[w] || 0) + 1;
}
const weight1Pct = pct(weightDist['1'] || 0, libEdges.length);
check('Weight diversity (not all 1.0)', 100 - weight1Pct, 30);
if (verbose) {
  console.log('    Weight distribution:');
  for (const [w, c] of Object.entries(weightDist).sort()) console.log(`      ${w}: ${c} (${pct(c, libEdges.length).toFixed(1)}%)`);
}

// ═══════════════════════════════════════════════════
// 8. SEMANTIC VALIDATION
// ═══════════════════════════════════════════════════
console.log(header('8. SEMANTIC VALIDATION'));

// Skill-area targets must be SkillArea nodes
const saTargetEdges = edges.filter(e => e.kind === 'lib_requires_skill_area');
const badSA = saTargetEdges.filter(e => {
  const target = index.records[e.to];
  return !target || target._kind !== 'SkillArea';
});
check('skill-area targets valid', pct(saTargetEdges.length - badSA.length, saTargetEdges.length || 1), 100);

// Role targets must be Role nodes
const roleTargetEdges = edges.filter(e => e.kind === 'lib_involves_role');
const badRole = roleTargetEdges.filter(e => {
  const target = index.records[e.to];
  return !target || target._kind !== 'Role';
});
check('role targets valid', pct(roleTargetEdges.length - badRole.length, roleTargetEdges.length || 1), 100);

// Workflow targets must be Workflow nodes
const wfTargetEdges = edges.filter(e => e.kind === 'lib_implements_workflow');
const badWf = wfTargetEdges.filter(e => {
  const target = index.records[e.to];
  return !target || target._kind !== 'Workflow';
});
check('workflow targets valid', pct(wfTargetEdges.length - badWf.length, wfTargetEdges.length || 1), 100);

// Domain targets must be Domain nodes
const domTargetEdges = edges.filter(e => e.kind === 'lib_applies_to_domain');
const badDom = domTargetEdges.filter(e => {
  const target = index.records[e.to];
  return !target || target._kind !== 'Domain';
});
check('domain targets valid', pct(domTargetEdges.length - badDom.length, domTargetEdges.length || 1), 100);

// Specialization targets must be Specialization nodes
const specTargetEdges = edges.filter(e => e.kind === 'lib_belongs_to_specialization');
const badSpec = specTargetEdges.filter(e => {
  const target = index.records[e.to];
  return !target || target._kind !== 'Specialization';
});
check('specialization targets valid', pct(specTargetEdges.length - badSpec.length, specTargetEdges.length || 1), 100);

if (verbose && (badSA.length + badRole.length + badWf.length + badDom.length + badSpec.length) > 0) {
  console.log('    Invalid targets:');
  for (const e of [...badSA, ...badRole, ...badWf, ...badDom, ...badSpec].slice(0, 10)) {
    const t = index.records[e.to];
    console.log(`      ${e.kind}: ${e.from} → ${e.to} (${t ? t._kind : 'MISSING'})`);
  }
}

// ═══════════════════════════════════════════════════
// 9. METHODOLOGY & TOPIC (informational)
// ═══════════════════════════════════════════════════
console.log(header('9. SUPPLEMENTARY COVERAGE'));

const lpWithMeth = new Set(edges.filter(e => e.kind === 'follows_methodology' && e.from.startsWith('lib-process:')).map(e => e.from));
note('Process→methodology', `${lpWithMeth.size}/${lp.length} (${pct(lpWithMeth.size, lp.length).toFixed(1)}%)`);

const lpWithTopic = lpE('lib_covers_topic');
note('Process→topic', `${lpWithTopic.size}/${lp.length} (${pct(lpWithTopic.size, lp.length).toFixed(1)}%)`);

// Average edges per entity
const avgEdgesProcess = libEdges.filter(e => e.from.startsWith('lib-process:')).length / (lp.length || 1);
const avgEdgesSkill = libEdges.filter(e => e.from.startsWith('lib-skill:')).length / (ls.length || 1);
const avgEdgesAgent = libEdges.filter(e => e.from.startsWith('lib-agent:')).length / (la.length || 1);
note('Avg edges/process', avgEdgesProcess.toFixed(1));
note('Avg edges/skill', avgEdgesSkill.toFixed(1));
note('Avg edges/agent', avgEdgesAgent.toFixed(1));

// Processes with very few edges (< 3)
const sparseProcesses = lp.filter(r => {
  const count = edges.filter(e => e.from === r.id).length;
  return count < 3;
});
if (sparseProcesses.length > 0) {
  warn('Sparse processes (<3 edges)', `${sparseProcesses.length}`);
  if (verbose) {
    for (const p of sparseProcesses.slice(0, 10)) {
      const c = edges.filter(e => e.from === p.id).length;
      console.log(`    ${p.id}: ${c} edges`);
    }
  }
}

// ═══════════════════════════════════════════════════
// 10. GENERATED FILE INTEGRITY
// ═══════════════════════════════════════════════════
console.log(header('10. GENERATED FILE INTEGRITY'));

const generatedDir = path.resolve(__dirname, '..', 'graph', 'generated-library');
const generatedFiles = ['processes.yaml', 'skills.yaml', 'agents.yaml'];
let filesOk = 0;
for (const f of generatedFiles) {
  const p = path.join(generatedDir, f);
  if (fs.existsSync(p)) {
    const stat = fs.statSync(p);
    if (stat.size > 100) {
      filesOk++;
      note(`${f}`, `${(stat.size / 1024).toFixed(0)} KB`);
    } else {
      warn(`${f}`, 'file exists but is suspiciously small');
    }
  } else {
    warn(`${f}`, 'MISSING');
  }
}
check('Generated files present', filesOk, 3, '');

// ═══════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════
console.log(`╠${'═'.repeat(W - 2)}╣`);

const totalChecks = failures.length + (allLib.length > 0 ? 30 - failures.length : 0);
const passRate = pct(totalChecks - failures.length, totalChecks);

if (failures.length === 0) {
  console.log(`║ RESULT: ALL CHECKS PASSED ✓ (${totalChecks} checks)${' '.repeat(W - 40 - String(totalChecks).length)}║`);
} else {
  console.log(`║ FAILURES: ${failures.length}/${totalChecks} checks failed${' '.repeat(W - 32 - String(failures.length).length - String(totalChecks).length)}║`);
  for (const f of failures) console.log(`║   ✗ ${f.slice(0, W - 8).padEnd(W - 8)} ║`);
}

if (warnings.length > 0) {
  console.log(`║ WARNINGS: ${warnings.length}${' '.repeat(W - 16 - String(warnings.length).length)}║`);
}

console.log(`╚${'═'.repeat(W - 2)}╝`);

if (strict && failures.length > 0) {
  process.exit(1);
}
