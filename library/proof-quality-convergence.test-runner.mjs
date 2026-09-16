import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire, registerHooks } from 'node:module';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '..');
const mathematicsRoot = path.join(repoRoot, 'library', 'specializations', 'domains', 'science', 'mathematics');
const sdkPackage = require.resolve('@a5c-ai/babysitter-sdk/package.json', { paths: [repoRoot] });
const sdkRoot = path.dirname(sdkPackage);
const sdkMetadata = JSON.parse(fs.readFileSync(sdkPackage, 'utf8'));
assert.match(sdkMetadata.version, /^6\./, 'tests require the repository SDK v6 contract');
const { createDeterministicRunHarness, runToCompletionWithFakeRunner } = require(sdkRoot);
const sdkUrl = pathToFileURL(path.join(sdkRoot, 'dist', 'index.js')).href;
registerHooks({ resolve(specifier, context, nextResolve) { if (specifier === '@a5c-ai/babysitter-sdk') return { url: sdkUrl, shortCircuit: true }; return nextResolve(specifier, context); } });

const processPath = fileURLToPath(new URL('./specializations/domains/science/mathematics/proof-quality-convergence.js', import.meta.url));
const root = mathematicsRoot;
const hash = 'a'.repeat(64);
const gradeLenses = ['dependency-use-site', 'reconstruction-counterexample', 'boundary-exact-complexity', 'ambiguity-theorem-reference'];
const base = overrides => ({
  problemStatement: 'p', workspace: path.join(os.tmpdir(), `proof-sdk-${Date.now()}-${Math.random()}`), packageRoot: root,
  sourceArtifacts: [path.join(root, 'validators', 'fixtures', 'latex', 'valid.tex')], breakpointPolicy: 'evidence-only', maxRevisionRounds: 0,
  requiredScore: 100, requiredSections: [], toolPolicy: { latexCompile: 'off', unavailable: 'fail' },
  applicableModules: [
    { id: 'multilinear-extension', applicable: true, rationale: 'test exercises common proof contract' },
    { id: 'matroid-maximization', applicable: true, rationale: 'fixture exercises matroid maximization' },
    { id: 'density-reduction', applicable: true, rationale: 'fixture exercises density reduction' },
    { id: 'graphical-specialization', applicable: false, rationale: 'fixture is not a graphical specialization' },
  ], ...overrides,
});
function resolver(inputs, { scopes = [{ approved: true, option: 'approve-scope', response: 'approved' }], scores = [100], shellFailure, texEvidence, executeShell = false } = {}) {
  let gradeSeen = false, artifactGateSeen = false, roundFresh = new Set(), repairSeen = false, priorEvolutionSeen = false, publicationRegistryStrict = false, publicationScoreStrict = false, gradeRound = 0, scopeIndex = 0;
  return {
    get order() { return { gradeSeen, artifactGateSeen, repairSeen, priorEvolutionSeen, publicationRegistryStrict, publicationScoreStrict }; },
    async resolve(action) {
      const id = action.taskId;
      const context = action.taskDef?.agent?.prompt?.context || {};
      if (id === '__sdk.breakpoint') return { status: 'ok', value: scopes[Math.min(scopeIndex++, scopes.length - 1)] };
      if (id === 'proof.extract-obligations') return { status: 'ok', value: { registryPath: path.join(inputs.workspace, 'scope-0', 'registry.json'), edgeMatrixPath: path.join(inputs.workspace, 'scope-0', 'edge-matrix.json'), summary: '', unresolvedAmbiguities: [], scopeChanges: [] } };
      if (id === 'proof.refine-obligation-scope') return { status: 'ok', value: { registryPath: context.registryPath, edgeMatrixPath: context.edgeMatrixPath, summary: '', unresolvedAmbiguities: [], scopeChanges: [] } };
      if (id === 'proof.draft-against-registry' || id === 'proof.targeted-repair') {
        if (id === 'proof.targeted-repair') { repairSeen = true; assert.ok(roundFresh.has(path.dirname(context.artifactPath)), 'repair must run after fresh round directory gate'); }
        return { status: 'ok', value: { artifactPath: context.artifactPath, registryPath: context.registryPath, summary: '', addressedObligationIds: [], remainingOpenIds: [] } };
      }
      if (id === 'proof.adversarial-lens') {
        gradeSeen = true;
        assert.equal(artifactGateSeen, true, 'grades must run after deterministic gates');
        const roundNumber = Number(context.roundId.split('-')[1]) - 1;
        const score = scores[Math.min(roundNumber, scores.length - 1)];
        const gateManifest = context.gateManifest;
        assert.ok(context.edgeBinding, 'grade receives edge binding');
        if (texEvidence) assert.equal(gateManifest.gateResults.find(g => g.gateId === 'tex').status, texEvidence.status);
        gradeRound = Math.max(gradeRound, roundNumber);
        return { status: 'ok', value: {
          roundId: context.roundId, artifactSha256: hash, lens: context.lens,
          categoryScores: { coreMathematicalValidity: score === 100 ? 35 : 34, lemmaUseSiteClosure: 15, domainEdgeCompleteness: 20, exactReductionComplexity: 15, expositionAmbiguity: 5, deterministicArtifactSemantics: 10 },
          totalScore: score, deductions: score === 100 ? [] : [{ findingId: 'F', points: 1 }],
          findings: score === 100 ? [] : [{ id: 'F', obligationIds: ['OB-X'], category: 'coreMathematicalValidity', severity: 'major', location: { path: 'proof.tex', locator: '1' }, failureScenario: 'x', deduction: 1, repair: 'x' }],
          blockingIssues: [], perfectScoreDefensible: score === 100, materialDisagreements: [], gateManifest, edgeBinding: context.edgeBinding,
        } };
      }
      if (action.kind === 'shell') {
        assert.deepEqual(Object.keys(action.taskDef.shell).sort(), ['args', 'command', 'cwd', 'expectedExitCode', 'outputPath', 'timeout']);
        assert.equal(action.taskDef.shell.expectedExitCode, 0);
        if (executeShell) {
          const shell = action.taskDef.shell;
          const execution = spawnSync(shell.command, shell.args, { cwd: shell.cwd, encoding: 'utf8', timeout: shell.timeout });
          return { status: 'ok', value: { success: execution.status === 0 && !execution.error, exitCode: execution.status ?? 1, stdout: execution.stdout || '', stderr: execution.stderr || '', ...(execution.error ? { error: execution.error.message } : {}) } };
        }
        if (shellFailure === id) return { status: 'ok', value: { success: false, exitCode: 9, stdout: '', stderr: 'boom', error: 'Shell command exited with code 9' } };
        if (id === 'proof.mkdir-fresh') roundFresh.add(action.taskDef.shell.args.at(-1));
        if (id === 'proof.artifact-gate') artifactGateSeen = true;
        if (id === 'proof.evolution-gate' && inputs.priorRegistryPath && action.taskDef.shell.args.includes(path.resolve(inputs.priorRegistryPath))) priorEvolutionSeen = true;
        let payload = { status: 'pass' };
        if (id === 'proof.bind-gate') payload = { status: 'pass', artifactSha256: hash };
        if (id === 'proof.edge-gate') payload = { status: 'pass', edgeSha256: 'b'.repeat(64), profileId: 'submodular-optimization', profileVersion: '1.0.0', openRows: [], strictness: action.taskDef.shell.args.includes('publication') ? 'publication' : 'review' };
        if (id === 'proof.registry-gate' && action.taskDef.shell.args.at(-1) === 'publication') publicationRegistryStrict = true;
        if (id === 'proof.tex-gate') payload = texEvidence || { status: 'not-required', policy: 'off', unavailablePolicy: 'fail' };
        if (id === 'proof.source-gate') payload = { status: 'pass', complete: true };
        if (id === 'proof.publication-gate') { publicationScoreStrict = action.taskDef.shell.args[action.taskDef.shell.args.indexOf('--required-score') + 1] === '100'; const manifestPath = action.taskDef.shell.args.at(-1); payload = { status: 'pass', manifestPath: path.resolve(manifestPath), manifestSha256: 'c'.repeat(64) }; }
        return { status: 'ok', value: { success: true, exitCode: 0, stdout: JSON.stringify(payload), stderr: '' } };
      }
      throw new Error(`unhandled ${id}`);
    },
  };
}
async function run(options = {}) {
  const inputs = base(options.inputs);
  const responseResolver = resolver(inputs, options);
  const harness = await createDeterministicRunHarness({ processPath, inputs, exportName: 'process' });
  try {
    try { return { result: await runToCompletionWithFakeRunner({ runDir: harness.runDir, resolve: responseResolver.resolve.bind(responseResolver), maxIterations: 160 }), resolver: responseResolver }; }
    catch (error) { if (options.shellFailure || options.expectFailure) return { result: { status: 'failed', error }, resolver: responseResolver }; throw error; }
  } finally { await harness.cleanup(); }
}

test('repository SDK resolves through the live v6 workspace contract', () => {
  assert.match(sdkMetadata.version, /^6\./);
});
test('installed SDK executes genuine shell effects and verifies publication manifest hash', async () => {
  const { result, resolver: r } = await run(); assert.equal(result.status, 'completed'); assert.equal(result.output.success, true); assert.equal(r.order.gradeSeen, true);
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'proof-publication-'));
  try {
    const round = path.join(temp, 'round-1'); fs.mkdirSync(round);
    const artifact = path.join(round, 'proof.tex'); fs.writeFileSync(artifact, 'proof\n');
    const digest = (await import('node:crypto')).createHash('sha256').update(fs.readFileSync(artifact)).digest('hex');
    const edge = path.join(temp, 'edge.json'); fs.copyFileSync(path.join(root, 'validators', 'fixtures', 'contracts', 'valid-edge-matrix.json'), edge);
    const edgeDigest = (await import('node:crypto')).createHash('sha256').update(fs.readFileSync(edge)).digest('hex');
    const registry = JSON.parse(fs.readFileSync(path.join(root, 'validators', 'fixtures', 'contracts', 'valid-registry.json'), 'utf8').replace(/^﻿/, '')); registry.artifactSha256 = digest; fs.writeFileSync(path.join(round, 'registry.json'), JSON.stringify(registry));
    const edgeBinding = { edgeSha256: edgeDigest, profileId: 'submodular-optimization', profileVersion: '1.0.0', strictness: 'review', openRows: [] };
    const source = path.join(temp, 'source.json'); fs.writeFileSync(source, JSON.stringify({ status: 'pass', complete: true, artifacts: [{}] }));
    const edgeManifest = path.join(temp, 'edge-manifest.json'); fs.writeFileSync(edgeManifest, JSON.stringify({ status: 'pass', strictness: 'publication', edgeSha256: edgeDigest, profileId: edgeBinding.profileId, profileVersion: edgeBinding.profileVersion, openRows: [], rowCount: 12 }));
    const artifactManifest = path.join(round, 'artifact.json'); fs.writeFileSync(artifactManifest, JSON.stringify({ status: 'pass', citations: 0 }));
    const tex = path.join(round, 'tex.json'); fs.writeFileSync(tex, JSON.stringify({ status: 'not-required', policy: 'off', unavailablePolicy: 'fail' }));
    const gradePaths = gradeLenses.map(lens => { const p = path.join(round, `grade-${lens}.json`); fs.writeFileSync(p, JSON.stringify({ roundId: 'round-1', artifactSha256: digest, lens, categoryScores: { coreMathematicalValidity:35, lemmaUseSiteClosure:15, domainEdgeCompleteness:20, exactReductionComplexity:15, expositionAmbiguity:5, deterministicArtifactSemantics:10 }, totalScore:100, deductions:[], findings:[], blockingIssues:[], perfectScoreDefensible:true, materialDisagreements:[], gateManifest:{gateResults:[]}, edgeBinding })); return p; });
    const manifest = path.join(round, 'publication.json');
    const args = [path.join(root, 'validators', 'validate_publication.py'), '--round', round, '--artifact', artifact, '--registry', path.join(round, 'registry.json'), '--edge', edge, '--source-gate', source, '--edge-gate', edgeManifest, '--artifact-gate', artifactManifest, '--tex-gate', tex, ...gradePaths.flatMap(p => ['--grade', p]), '--required-score', '100', '--manifest', manifest];
    const integrationProcess = path.join(temp, 'installed-sdk-shell-process.mjs');
    fs.writeFileSync(integrationProcess, `import { defineTask } from '@a5c-ai/babysitter-sdk';\nconst publish = defineTask('integration.publish', (input, ctx) => ({ kind: 'shell', title: 'Publish fixture', shell: { command: input.command, args: input.args, cwd: input.cwd, timeout: 60000 }, io: { inputJsonPath: \`tasks/\${ctx.effectId}/input.json\`, outputJsonPath: \`tasks/\${ctx.effectId}/result.json\` } }));\nexport async function process(inputs, ctx) { return ctx.task(publish, inputs); }\n`);
    const integrationHarness = await createDeterministicRunHarness({ processPath: integrationProcess, inputs: { command: 'python', args, cwd: root }, exportName: 'process' });
    let integrationResult;
    try {
      integrationResult = await runToCompletionWithFakeRunner({ runDir: integrationHarness.runDir, maxIterations: 20, resolve: async action => {
        assert.equal(action.kind, 'shell');
        const shell = action.taskDef.shell;
        const execution = spawnSync(shell.command, shell.args, { cwd: shell.cwd, encoding: 'utf8', timeout: shell.timeout });
        return { status: 'ok', value: { success: execution.status === 0 && !execution.error, exitCode: execution.status ?? 1, stdout: execution.stdout || '', stderr: execution.stderr || '', ...(execution.error ? { error: execution.error.message } : {}) } };
      } });
    } finally { await integrationHarness.cleanup(); }
    assert.equal(integrationResult.status, 'completed');
    assert.equal(integrationResult.output.success, true, integrationResult.output.stderr);
    const returned = JSON.parse(integrationResult.output.stdout.trim().split(/\r?\n/).at(-1));
    const manifestBytes = fs.readFileSync(manifest);
    const publication = JSON.parse(manifestBytes);
    assert.equal(publication.status, 'pass'); assert.equal(publication.edgeMatrixSha256, edgeDigest);
    assert.equal(returned.manifestPath, path.resolve(manifest));
    assert.equal(returned.manifestSha256, createHash('sha256').update(manifestBytes).digest('hex'));
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
test('finalGateManifest has an explicit path, hash, and manifest contract', async () => { const { result } = await run(); assert.deepEqual(Object.keys(result.output.finalGateManifest).sort(), ['manifest', 'path', 'sha256']); assert.equal(result.output.finalGateManifest.manifest.status, 'pass'); assert.match(result.output.finalGateManifest.sha256, /^[0-9a-f]{64}$/); });
test('real SDK shell error object fails closed', async () => { const { result } = await run({ shellFailure: 'proof.source-gate' }); assert.equal(result.status, 'failed'); });
test('breakpoint deny fails closed', async () => { const { result } = await run({ scopes: [{ approved: true, option: 'deny', response: 'no' }] }); assert.equal(result.output.reason, 'obligation-scope-denied'); });
test('breakpoint missing approval, option, or response fails closed', async () => { for (const scope of [{ option: 'approve-scope', response: 'x' }, { approved: true, response: 'x' }, { approved: true, option: 'approve-scope' }]) { const { result } = await run({ scopes: [scope] }); assert.equal(result.output.reason, 'invalid-scope-breakpoint-result'); } });
test('tool unavailable shell failure fails closed', async () => { const { result } = await run({ shellFailure: 'proof.tex-gate' }); assert.equal(result.status, 'failed'); });
test('nonconverged final round is bounded failure', async () => { const { result } = await run({ scores: [99] }); assert.equal(result.output.reason, 'bounded-revision-exhausted'); });
test('final convergence ignores permissive input score and strictness', async () => { const rejected = await run({ inputs: { requiredScore: 90, strictness: 'draft' }, scores: [99] }); assert.equal(rejected.result.output.success, false); assert.equal(rejected.result.output.reason, 'bounded-revision-exhausted'); const accepted = await run({ inputs: { requiredScore: 90, strictness: 'draft' }, scores: [100] }); assert.equal(accepted.result.output.success, true); assert.equal(accepted.resolver.order.publicationRegistryStrict, true); assert.equal(accepted.resolver.order.publicationScoreStrict, true); });
test('repair waits for fresh round then receives complete regrade', async () => { const { result, resolver: r } = await run({ inputs: { maxRevisionRounds: 1 }, scores: [99, 100] }); assert.equal(result.output.success, true); assert.equal(result.output.rounds.length, 2); assert.equal(r.order.repairSeen, true); });
test('prior registry evolution is validated before drafting', async () => { const prior = path.join(os.tmpdir(), 'prior-registry.json'); const { result, resolver: r } = await run({ inputs: { priorRegistryPath: prior } }); assert.equal(result.output.success, true); assert.equal(r.order.priorEvolutionSeen, true); });
test('partial tool policy inherits fail-closed unavailable default', async () => { const { result } = await run({ inputs: { toolPolicy: { latexCompile: 'off' } } }); assert.equal(result.output.success, true); });
test('partial unavailable policy inherits required compile default', async () => { const { result } = await run({ inputs: { toolPolicy: { unavailable: 'report' } }, texEvidence: { status: 'pass', policy: 'required', unavailablePolicy: 'report' } }); assert.equal(result.output.success, true); });
test('optional unavailable TeX evidence is preserved for graders', async () => { const evidence = { status: 'unavailable', policy: 'optional', unavailablePolicy: 'report' }; const { result } = await run({ inputs: { toolPolicy: { latexCompile: 'optional', unavailable: 'report' } }, texEvidence: evidence }); assert.equal(result.output.success, true); assert.equal(result.output.rounds[0].gateManifest.gateResults.find(g => g.gateId === 'tex').status, 'unavailable'); });
test('selected profile modules, not a hard-coded list, define input applicability', async () => {
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proof-profile-'));
  try {
    const profile = JSON.parse(fs.readFileSync(path.join(root, 'profiles', 'submodular-optimization.json'), 'utf8'));
    profile.moduleSelection.modules = [...profile.moduleSelection.modules, 'new-profile-module'];
    const profilePath = path.join(profileDir, 'profile.json'); fs.writeFileSync(profilePath, JSON.stringify(profile));
    const { result, resolver: r } = await run({ expectFailure: true, inputs: { domainProfile: profilePath } });
    assert.equal(result.status, 'failed'); assert.equal(r.order.gradeSeen, false);
  } finally { fs.rmSync(profileDir, { recursive: true, force: true }); }
});
test('non-text artifacts require complete extraction metadata before effects', async () => { const { result, resolver: r } = await run({ expectFailure: true, inputs: { sourceArtifacts: [], artifacts: [{ path: 'paper.pdf', mediaType: 'application/pdf' }] } }); assert.equal(result.status, 'failed'); assert.equal(r.order.gradeSeen, false); assert.equal(r.order.artifactGateSeen, false); });
