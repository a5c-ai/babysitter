/**
 * @process specializations/domains/science/mathematics/proof-quality-convergence
 * @description Build hash-bound proof obligations, run deterministic artifact gates and isolated adversarial audits, and converge through bounded immutable repair rounds.
 * @inputs { problemStatement: string, workspace: string, packageRoot?: string, sourceArtifacts?: string[], artifacts?: object[], domainProfile?: string, applicableModules: object[], priorRegistryPath?: string, requiredSections?: string[], bibliographies?: string[], maxRevisionRounds?: number, requiredScore?: number, strictness?: string, breakpointPolicy?: string, requestedWaiver?: boolean, toolPolicy?: object }
 * @outputs { success: boolean, finalArtifact?: string, registryPath: string, edgeMatrixPath: string, rounds: object[], score: number|null, unresolvedBlockers: object[], waivers: object[], finalGateManifest?: object }
 * @skill proof-obligation-registry
 * @skill adversarial-proof-audit
 * @skill mathematical-artifact-validation
 * @skill proof-structure-analyzer
 * @skill counterexample-generator
 * @skill latex-math-formatter
 * @skill math-notation-validator
 * @agent proof-strategist
 * @agent theorem-prover-expert
 * @agent discrete-optimization-expert
 * @agent mathematics-writer
 * @graph
 *   domains: [domain:mathematics]
 *   specializations: [specialization:computational-mathematics]
 *   skillAreas: [skill-area:mathematical-reasoning, skill-area:algorithm-analysis, skill-area:technical-writing]
 *   workflows: [workflow:research-validation, workflow:quality-convergence]
 *   roles: [role:research-scientist, role:computational-scientist]
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import { defineTask } from '@a5c-ai/babysitter-sdk';

const io = ctx => ({
  inputJsonPath: `tasks/${ctx.effectId}/input.json`,
  outputJsonPath: `tasks/${ctx.effectId}/result.json`,
});
const objectSchema = (required, properties, extra = {}) => ({
  type: 'object', additionalProperties: false, required, properties, ...extra,
});
const stringArray = { type: 'array', items: { type: 'string', minLength: 1 } };
const artifactSchema = objectSchema(['path', 'mediaType'], {
  path: { type: 'string', minLength: 1 },
  mediaType: { type: 'string', minLength: 1 },
  extractedTextPath: { type: 'string', minLength: 1 },
  extractionTool: { type: 'string', minLength: 1 },
  extractionVersion: { type: 'string', minLength: 1 },
  extractionSha256: { type: 'string', pattern: '^[0-9a-f]{64}$' },
}, {
  allOf: [{
    if: { properties: { mediaType: { pattern: '^(?!text/)' } } },
    then: { required: ['extractedTextPath', 'extractionTool', 'extractionVersion', 'extractionSha256'] },
  }],
});
export const inputSchema = objectSchema(['problemStatement', 'workspace'], {
  problemStatement: { type: 'string', minLength: 1 },
  workspace: { type: 'string', minLength: 1 },
  packageRoot: { type: 'string', minLength: 1 },
  sourceArtifacts: stringArray,
  artifacts: { type: 'array', items: artifactSchema },
  domainProfile: { type: 'string' },
  applicableModules: { type: 'array', minItems: 1, items: objectSchema(['id', 'applicable', 'rationale'], { id: { type: 'string', minLength: 1 }, applicable: { type: 'boolean' }, rationale: { type: 'string', minLength: 1 } }) },
  priorRegistryPath: { type: 'string' },
  requiredSections: stringArray,
  bibliographies: stringArray,
  maxRevisionRounds: { type: 'integer', minimum: 0, maximum: 3 },
  requiredScore: { type: 'integer', minimum: 1, maximum: 100 },
  strictness: { enum: ['draft', 'review', 'publication'] },
  breakpointPolicy: { enum: ['evidence-only', 'on-disagreement', 'none'] },
  requestedWaiver: { type: 'boolean' },
  toolPolicy: objectSchema([], {
    latexCompile: { enum: ['required', 'optional', 'off'] },
    unavailable: { enum: ['fail', 'breakpoint', 'report'] },
  }),
});
const extractionSchema = objectSchema(
  ['registryPath', 'edgeMatrixPath', 'summary', 'unresolvedAmbiguities', 'scopeChanges'],
  { registryPath: { type: 'string' }, edgeMatrixPath: { type: 'string' }, summary: { type: 'string' }, unresolvedAmbiguities: stringArray, scopeChanges: stringArray },
);
const authoredSchema = objectSchema(
  ['artifactPath', 'registryPath', 'summary'],
  { artifactPath: { type: 'string' }, registryPath: { type: 'string' }, summary: { type: 'string' }, addressedObligationIds: stringArray, remainingOpenIds: stringArray, repairedFindingIds: stringArray, reopenedObligationIds: stringArray },
);
const edgeBindingSchema = objectSchema(
  ['edgeSha256', 'profileId', 'profileVersion', 'strictness', 'openRows'],
  { edgeSha256: { type: 'string', pattern: '^[0-9a-f]{64}$' }, profileId: { type: 'string', minLength: 1 }, profileVersion: { type: 'string', minLength: 1 }, strictness: { enum: ['review', 'publication'] }, openRows: stringArray },
);
const gradeSchema = objectSchema(
  ['roundId', 'artifactSha256', 'lens', 'categoryScores', 'totalScore', 'deductions', 'findings', 'blockingIssues', 'perfectScoreDefensible', 'materialDisagreements', 'gateManifest', 'edgeBinding'],
  { roundId: { type: 'string' }, artifactSha256: { type: 'string' }, lens: { type: 'string' }, categoryScores: { type: 'object' }, totalScore: { type: 'integer' }, deductions: { type: 'array' }, findings: { type: 'array' }, blockingIssues: { type: 'array' }, perfectScoreDefensible: { type: 'boolean' }, materialDisagreements: { type: 'array' }, gateManifest: { type: 'object' }, edgeBinding: edgeBindingSchema },
);
const agentTask = (id, title, schema, task, instructions) => defineTask(id, (args, ctx) => ({
  kind: 'agent', title, labels: ['mathematics', 'proof-evidence'],
  agent: { name: 'general-purpose', prompt: { role: 'Independent mathematical proof-evidence specialist', task, context: args, instructions, outputFormat: 'Return only strict JSON matching outputSchema.' }, outputSchema: schema },
  io: io(ctx),
}));
export const extractObligationsTask = agentTask('proof.extract-obligations', 'Extract proof obligations', extractionSchema, 'Create the exact requested fresh registry and edge-matrix files.', ['Instantiate every profile template and edge row.', 'Preserve every prior semantic field and history.', 'The process overwrites policy identity fields deterministically before validation.']);
export const refineObligationScopeTask = agentTask('proof.refine-obligation-scope', 'Refine proof scope', extractionSchema, 'Write the exact requested fresh refined registry and edge matrix.', ['Apply owner response, append history, preserve all semantic fields.']);
export const draftAgainstRegistryTask = agentTask('proof.draft-against-registry', 'Draft proof', authoredSchema, 'Write the exact fresh artifact and registry targets.', ['Never overwrite.', 'Preserve registry semantics and append history.']);
export const targetedRepairTask = agentTask('proof.targeted-repair', 'Repair proof', authoredSchema, 'Write the exact next-round artifact and registry targets.', ['Never overwrite.', 'Preserve all fields and append history.']);
export const adversarialLensTask = agentTask('proof.adversarial-lens', 'Run isolated proof-audit lens', gradeSchema, 'Audit the immutable artifact through the assigned lens against supplied deterministic manifests. This isolated task is not, by itself, model-family-independent verification.', ['Persist the identical report to gradePath.', 'Copy gateManifest exactly; do not infer gate state from prose.', 'Do not read or infer any other lens report before submitting.']);
const shellTask = (id, title, build) => defineTask(id, (args, ctx) => ({ kind: 'shell', title, labels: ['deterministic', 'hard-gate'], shell: { ...build(args), expectedExitCode: 0, timeout: 60000, outputPath: `tasks/${ctx.effectId}/result.json` }, io: io(ctx) }));
const py = (script, args, cwd) => ({ command: 'python', args: [path.join(cwd, 'validators', script), ...args], cwd });
export const mkdirFreshTask = shellTask('proof.mkdir-fresh', 'Create fresh directory', a => py('prepare_fresh_path.py', ['--directory', a.directory], a.packageRoot));
export const sourceGateTask = shellTask('proof.source-gate', 'Validate sources', a => py('validate_sources.py', [...a.sources.flatMap(s => ['--source', s.path, '--expected-sha256', s.sha256 || 'recompute', '--metadata', JSON.stringify(s.metadata || {})]), '--manifest', a.manifest], a.packageRoot));
export const policyGateTask = shellTask('proof.policy-inject', 'Inject registry policy', a => py('inject_registry_policy.py', [a.registry, '--profile', a.profile, '--applicable-modules-json', JSON.stringify(a.applicableModules)], a.packageRoot));
export const registryGateTask = shellTask('proof.registry-gate', 'Validate registry schema and semantics', a => py('validate_registry.py', [a.registry, '--schema', path.join(a.packageRoot, 'schemas', 'proof-obligation-registry.schema.json'), '--profile', a.profile, '--applicable-modules-json', JSON.stringify(a.applicableModules), '--strict', a.strict], a.packageRoot));
export const edgeGateTask = shellTask('proof.edge-gate', 'Validate edge matrix', a => py('validate_edge_matrix.py', [a.edge, '--profile', a.profile, '--strict', a.strict, '--applicable-modules-json', JSON.stringify(a.applicableModules), '--manifest', a.manifest], a.packageRoot));
export const evolutionGateTask = shellTask('proof.evolution-gate', 'Validate registry evolution', a => py('validate_registry_evolution.py', [a.before, a.after], a.packageRoot));
export const bindGateTask = shellTask('proof.bind-gate', 'Bind registry', a => py('bind_registry_artifact.py', [a.registry, a.artifact, a.output, '--hash-output', a.hash], a.packageRoot));
export const artifactGateTask = shellTask('proof.artifact-gate', 'Validate artifact', a => py('validate_math_artifact.py', [a.artifact, ...a.sections.flatMap(x => ['--required-section', x]), ...a.bibs.flatMap(x => ['--bib', x]), '--manifest', a.manifest], a.packageRoot));
export const texGateTask = shellTask('proof.tex-gate', 'Validate TeX policy', a => py('validate_tex.py', [a.artifact, '--policy', a.policy, '--unavailable', a.unavailable, '--manifest', a.manifest], a.packageRoot));
export const gradeGateTask = shellTask('proof.grade-gate', 'Validate grade schema and binding', a => py('validate_grade.py', [a.grade, '--schema', path.join(a.packageRoot, 'schemas', 'adversarial-grade.schema.json'), '--registry', a.registry, '--artifact-sha256', a.hash, '--artifact', a.artifact, '--round-id', a.round, '--lens', a.lens, '--gate-manifest-json', JSON.stringify(a.gateManifest), '--edge-binding-json', JSON.stringify(a.edgeBinding)], a.packageRoot));
export const publicationGateTask = shellTask('proof.publication-gate', 'Seal publication', a => py('validate_publication.py', ['--round', a.dir, '--artifact', a.artifact, '--registry', a.registry, '--edge', a.edge, '--source-gate', a.sourceManifest, '--edge-gate', a.edgeManifest, '--artifact-gate', a.artifactManifest, '--tex-gate', a.texManifest, ...a.grades.flatMap(x => ['--grade', x]), '--required-score', String(a.score), '--manifest', a.manifest], a.packageRoot));

function inside(root, p, label) {
  const r = path.resolve(root), q = path.resolve(p);
  if (q !== r && !q.startsWith(r + path.sep)) throw new Error(`${label} outside workspace`);
  return q;
}
function exact(result, field, expected, label) {
  if (inside(path.dirname(expected), result?.[field], label) !== path.resolve(expected)) throw new Error(`${label} did not use exact target`);
}
function ok(result, label) {
  if (!result || result.success !== true || result.exitCode !== 0) throw new Error(`${label} failed closed`);
  return result;
}
async function gate(ctx, task, args, label) { return ok(await ctx.task(task, args), label); }
function shellJson(result, label) {
  const line = String(result?.stdout || '').trim().split(/\r?\n/).filter(Boolean).at(-1);
  try { return JSON.parse(line); } catch { throw new Error(`${label} did not emit a JSON manifest`); }
}
function bp(result, allowed) {
  if (!result || result.approved !== true || !allowed.includes(result.option) || typeof result.response !== 'string' || !result.response.trim()) return null;
  return result.option;
}
function sameJson(a, b) {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object' || Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a)) return a.length === b.length && a.every((value, i) => sameJson(value, b[i]));
  const ak = Object.keys(a).sort(), bk = Object.keys(b).sort();
  return ak.length === bk.length && ak.every((key, i) => key === bk[i] && sameJson(a[key], b[key]));
}
const lenses = ['dependency-use-site', 'reconstruction-counterexample', 'boundary-exact-complexity', 'ambiguity-theorem-reference'];
const converged = grades => grades.length === 4 && grades.every(g => g.totalScore === 100 && g.perfectScoreDefensible === true && !g.findings.length && !g.blockingIssues.length && !g.materialDisagreements.length);
export const descriptor = { id: 'specializations/domains/science/mathematics/proof-quality-convergence', version: '1.0.0', agents: ['general-purpose'], taskKinds: ['agent', 'shell'], breakpoints: ['validated-obligation-scope', 'material-disagreement-or-waiver'], maxRevisionRounds: 3, inputSchema };

export async function process(inputs, ctx) {
  const workspace = path.resolve(inputs.workspace);
  const packageRoot = path.resolve(inputs.packageRoot || path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, match => match.slice(1))));
  const profile = path.resolve(inputs.domainProfile || path.join(packageRoot, 'profiles', 'submodular-optimization.json'));
  const score = inputs.requiredScore ?? 100;
  const max = inputs.maxRevisionRounds ?? 2;
  const policy = { latexCompile: 'required', unavailable: 'fail', ...(inputs.toolPolicy || {}) };
  let profileDefinition;
  try { profileDefinition = JSON.parse(await fs.readFile(profile, 'utf8')); }
  catch (error) { throw new Error(`cannot read selected domain profile: ${error.message}`); }
  const declaredModules = profileDefinition?.moduleSelection?.modules;
  if (!Array.isArray(declaredModules) || !declaredModules.length || new Set(declaredModules).size !== declaredModules.length || !declaredModules.every(id => typeof id === 'string' && id.trim())) throw new Error('selected profile has invalid moduleSelection.modules');
  if (!Array.isArray(inputs.applicableModules) || inputs.applicableModules.length !== declaredModules.length || new Set(inputs.applicableModules.map(m => m?.id)).size !== declaredModules.length || !declaredModules.every(id => inputs.applicableModules.some(m => m?.id === id && typeof m.applicable === 'boolean' && typeof m.rationale === 'string' && m.rationale.trim()))) throw new Error('applicableModules must explicitly classify every selected-profile module exactly once with rationale');
  if (!Number.isInteger(score) || score < 1 || score > 100 || !Number.isInteger(max) || max < 0 || max > 3) throw new Error('invalid score or revision bound');

  const sourceManifest = inside(workspace, path.join(workspace, 'source-quality.json'), 'source manifest');
  await gate(ctx, mkdirFreshTask, { packageRoot, directory: workspace }, 'workspace freshness');
  const sources = (inputs.sourceArtifacts || []).map(sourcePath => ({ path: sourcePath, metadata: { mediaType: 'text/plain', directText: true } }));
  for (const artifact of inputs.artifacts || []) {
    if (artifact.mediaType.startsWith('text/')) {
      sources.push({ path: artifact.path, metadata: { mediaType: artifact.mediaType, directText: true } });
      continue;
    }
    for (const field of ['extractedTextPath', 'extractionTool', 'extractionVersion', 'extractionSha256']) {
      if (typeof artifact[field] !== 'string' || !artifact[field].trim()) throw new Error(`non-text artifact requires ${field}`);
    }
    if (!/^[0-9a-f]{64}$/.test(artifact.extractionSha256)) throw new Error('non-text artifact requires lowercase SHA-256 extraction hash');
    sources.push({
      path: artifact.extractedTextPath,
      sha256: artifact.extractionSha256,
      metadata: { sourcePath: artifact.path, mediaType: artifact.mediaType, extractionTool: artifact.extractionTool, extractionVersion: artifact.extractionVersion },
    });
  }
  if (!sources.length) throw new Error('source required');
  const sourceResult = await gate(ctx, sourceGateTask, { packageRoot, sources, manifest: sourceManifest }, 'source/extraction hash gate');
  const sourceStatus = shellJson(sourceResult, 'source gate').status;

  let seq = 0;
  const fresh = name => inside(workspace, path.join(workspace, `scope-${seq++}`, name), name);
  let registryTarget = fresh('registry.json');
  let edgeTarget = path.join(path.dirname(registryTarget), 'edge-matrix.json');
  await gate(ctx, mkdirFreshTask, { packageRoot, directory: path.dirname(registryTarget) }, 'scope directory freshness');
  let extraction = await ctx.task(extractObligationsTask, { ...inputs, profilePath: profile, registryPath: registryTarget, edgeMatrixPath: edgeTarget });
  exact(extraction, 'registryPath', registryTarget, 'registry');
  exact(extraction, 'edgeMatrixPath', edgeTarget, 'edge matrix');
  await gate(ctx, policyGateTask, { packageRoot, registry: registryTarget, profile, applicableModules: inputs.applicableModules }, 'initial policy injection');
  if (inputs.priorRegistryPath) {
    const priorRegistry = path.resolve(inputs.priorRegistryPath);
    await gate(ctx, registryGateTask, { packageRoot, registry: priorRegistry, profile, applicableModules: inputs.applicableModules, strict: 'review' }, 'prior registry');
    await gate(ctx, evolutionGateTask, { packageRoot, before: priorRegistry, after: registryTarget }, 'prior-to-initial evolution');
  }
  let registryResult = await gate(ctx, registryGateTask, { packageRoot, registry: registryTarget, profile, applicableModules: inputs.applicableModules, strict: 'review' }, 'registry');
  let edgeManifest = path.join(path.dirname(edgeTarget), 'edge-gate.json');
  let edgeResult = await gate(ctx, edgeGateTask, { packageRoot, edge: edgeTarget, profile, applicableModules: inputs.applicableModules, strict: 'review', manifest: edgeManifest }, 'edge matrix');

  if ((inputs.breakpointPolicy || 'evidence-only') !== 'none') {
    let approved = false;
    for (let i = 0; i < 2; i++) {
      const response = await ctx.breakpoint({ title: 'Review validated proof-obligation scope', question: 'Select approve-scope, reject-and-refine, or deny.', context: { extraction, options: ['approve-scope', 'reject-and-refine', 'deny'] } });
      const option = bp(response, ['approve-scope', 'reject-and-refine', 'deny']);
      if (!option || option === 'deny') return { success: false, reason: option ? 'obligation-scope-denied' : 'invalid-scope-breakpoint-result', rounds: [] };
      if (option === 'approve-scope') { approved = true; break; }
      const before = registryTarget;
      registryTarget = fresh('registry.json');
      edgeTarget = path.join(path.dirname(registryTarget), 'edge-matrix.json');
      await gate(ctx, mkdirFreshTask, { packageRoot, directory: path.dirname(registryTarget) }, 'refined scope freshness');
      extraction = await ctx.task(refineObligationScopeTask, { ...inputs, priorRegistryPath: before, registryPath: registryTarget, edgeMatrixPath: edgeTarget, ownerResponse: response });
      exact(extraction, 'registryPath', registryTarget, 'refined registry');
      exact(extraction, 'edgeMatrixPath', edgeTarget, 'refined edge');
      await gate(ctx, policyGateTask, { packageRoot, registry: registryTarget, profile, applicableModules: inputs.applicableModules }, 'refined policy injection');
      await gate(ctx, evolutionGateTask, { packageRoot, before, after: registryTarget }, 'scope evolution');
      registryResult = await gate(ctx, registryGateTask, { packageRoot, registry: registryTarget, profile, applicableModules: inputs.applicableModules, strict: 'review' }, 'refined registry');
      edgeManifest = path.join(path.dirname(edgeTarget), 'edge-gate.json');
      edgeResult = await gate(ctx, edgeGateTask, { packageRoot, edge: edgeTarget, profile, applicableModules: inputs.applicableModules, strict: 'review', manifest: edgeManifest }, 'refined edge');
    }
    if (!approved) return { success: false, reason: 'obligation-scope-not-approved-within-bound', rounds: [] };
  }

  const rounds = [];
  let prior = registryTarget;
  let repairContext = null;
  for (let n = 0; n <= max; n++) {
    const round = `round-${n + 1}`;
    const dir = path.join(workspace, round);
    await gate(ctx, mkdirFreshTask, { packageRoot, directory: dir }, 'round freshness');
    const artifact = path.join(dir, 'proof.tex');
    const unbound = path.join(dir, 'registry-unbound.json');
    const authored = n === 0
      ? await ctx.task(draftAgainstRegistryTask, { ...inputs, roundId: round, artifactPath: artifact, registryPath: unbound, priorRegistryPath: prior })
      : await ctx.task(targetedRepairTask, { ...repairContext, roundId: round, artifactPath: artifact, registryPath: unbound, priorRegistryPath: prior });
    exact(authored, 'artifactPath', artifact, 'artifact');
    exact(authored, 'registryPath', unbound, 'round registry');
    await gate(ctx, policyGateTask, { packageRoot, registry: unbound, profile, applicableModules: inputs.applicableModules }, 'round policy injection');
    await gate(ctx, evolutionGateTask, { packageRoot, before: prior, after: unbound }, 'round evolution');
    registryResult = await gate(ctx, registryGateTask, { packageRoot, registry: unbound, profile, applicableModules: inputs.applicableModules, strict: 'review' }, 'round registry');
    const registry = path.join(dir, 'registry.json');
    const hashFile = path.join(dir, 'artifact.sha256');
    const binding = await gate(ctx, bindGateTask, { packageRoot, registry: unbound, artifact, output: registry, hash: hashFile }, 'binding');
    const hash = shellJson(binding, 'binding').artifactSha256;

    const artifactManifest = path.join(dir, 'artifact-gate.json');
    const texManifest = path.join(dir, 'tex-gate.json');
    const artifactResult = await gate(ctx, artifactGateTask, { packageRoot, artifact, sections: inputs.requiredSections || [], bibs: inputs.bibliographies || [], manifest: artifactManifest }, 'artifact gate');
    const texResult = await ctx.task(texGateTask, { packageRoot, artifact, policy: policy.latexCompile, unavailable: policy.unavailable, manifest: texManifest });
    if (texResult?.success !== true || texResult?.exitCode !== 0) {
      if (policy.unavailable !== 'breakpoint') ok(texResult, 'TeX gate');
      const response = await ctx.breakpoint({ title: 'TeX tool unavailable', question: 'Select terminate or continue-reported-unavailable.', context: { options: ['terminate', 'continue-reported-unavailable'], texResult } });
      const option = bp(response, ['terminate', 'continue-reported-unavailable']);
      if (option !== 'continue-reported-unavailable' || policy.latexCompile === 'required') return { success: false, reason: option ? 'tex-unavailable-terminated' : 'invalid-tex-breakpoint-result', rounds };
    }
    const texEvidence = shellJson(texResult, 'TeX gate');
    const edgeEvidence = shellJson(edgeResult, 'edge gate');
    const edgeBinding = {
      edgeSha256: edgeEvidence.edgeSha256,
      profileId: edgeEvidence.profileId,
      profileVersion: edgeEvidence.profileVersion,
      strictness: edgeEvidence.strictness,
      openRows: edgeEvidence.openRows || [],
    };
    const gateManifest = {
      gateResults: [
        { gateId: 'source', required: true, status: sourceStatus },
        { gateId: 'registry', required: true, status: shellJson(registryResult, 'registry gate').status },
        { gateId: 'edge-matrix', required: true, status: shellJson(edgeResult, 'edge gate').status },
        { gateId: 'artifact', required: true, status: shellJson(artifactResult, 'artifact gate').status },
        { gateId: 'tex', required: policy.latexCompile === 'required', status: texEvidence.status },
      ],
    };
    const gradePaths = lenses.map(lens => path.join(dir, `grade-${lens}.json`));
    const grades = await ctx.parallel.all(lenses.map((lens, i) => () => ctx.task(adversarialLensTask, { roundId: round, artifactPath: artifact, artifactSha256: hash, registryPath: registry, edgeMatrixPath: edgeTarget, lens, gradePath: gradePaths[i], gateManifest, edgeBinding })));
    for (let i = 0; i < lenses.length; i++) {
      const currentGrade = grades[i];
      if (currentGrade.roundId !== round || currentGrade.artifactSha256 !== hash || currentGrade.lens !== lenses[i] || !sameJson(currentGrade.gateManifest, gateManifest) || !sameJson(currentGrade.edgeBinding, edgeBinding)) throw new Error('stale or rewritten grade evidence');
      await gate(ctx, gradeGateTask, { packageRoot, grade: gradePaths[i], registry, hash, artifact, round, lens: lenses[i], gateManifest, edgeBinding }, `grade ${lenses[i]}`);
    }
    rounds.push({ roundId: round, artifactPath: artifact, artifactSha256: hash, registryPath: registry, grades, gateManifest, edgeBinding, artifactManifest, texManifest });

    if (converged(grades)) {
      await gate(ctx, registryGateTask, { packageRoot, registry, profile, applicableModules: inputs.applicableModules, strict: 'publication' }, 'publication registry');
      const publicationEdgeManifest = path.join(dir, 'edge-publication-gate.json');
      edgeResult = await gate(ctx, edgeGateTask, { packageRoot, edge: edgeTarget, profile, applicableModules: inputs.applicableModules, strict: 'publication', manifest: publicationEdgeManifest }, 'publication edge matrix');
      const manifest = path.join(dir, 'publication-gate.json');
      const publicationResult = await gate(ctx, publicationGateTask, { packageRoot, dir, artifact, registry, edge: edgeTarget, sourceManifest, edgeManifest: publicationEdgeManifest, artifactManifest, texManifest, grades: gradePaths, score: 100, manifest }, 'publication');
      const publicationSeal = shellJson(publicationResult, 'publication gate');
      if (publicationSeal.status !== 'pass' || publicationSeal.manifestPath !== path.resolve(manifest) || !/^[0-9a-f]{64}$/.test(publicationSeal.manifestSha256 || '')) throw new Error('publication gate returned invalid manifest contract');
      const finalGateManifest = { path: publicationSeal.manifestPath, sha256: publicationSeal.manifestSha256, manifest: Object.fromEntries(Object.entries(publicationSeal).filter(([key]) => !['manifestPath', 'manifestSha256'].includes(key))) };
      return { success: true, finalArtifact: artifact, registryPath: registry, edgeMatrixPath: edgeTarget, edgeMatrixSha256: shellJson(edgeResult, 'publication edge gate').edgeSha256, rounds, finalGateManifest, score: Math.min(...grades.map(g => g.totalScore)), unresolvedBlockers: [], waivers: [] };
    }

    const blockers = grades.flatMap(g => g.blockingIssues);
    if (grades.some(g => g.materialDisagreements.length) || inputs.requestedWaiver) {
      if ((inputs.breakpointPolicy || 'evidence-only') === 'none') return { success: false, reason: 'unresolved-disagreement-without-breakpoint', rounds, unresolvedBlockers: blockers, waivers: [] };
      const response = await ctx.breakpoint({ title: 'Resolve disagreement', question: 'Select reject-and-refine, waive-with-record, or terminate.', context: { options: ['reject-and-refine', 'waive-with-record', 'terminate'] } });
      const option = bp(response, ['reject-and-refine', 'waive-with-record', 'terminate']);
      if (option !== 'reject-and-refine') return { success: false, reason: option === 'waive-with-record' ? 'waiver-prevents-unqualified-convergence' : option ? 'disagreement-terminated' : 'invalid-disagreement-breakpoint-result', rounds, unresolvedBlockers: blockers, waivers: option === 'waive-with-record' ? [response] : [] };
    }
    if (n === max) break;
    prior = registry;
    repairContext = { ...inputs, grades };
  }
  const latest = rounds.at(-1);
  return { success: false, reason: 'bounded-revision-exhausted', finalArtifact: latest?.artifactPath, registryPath: latest?.registryPath || registryTarget, edgeMatrixPath: edgeTarget, rounds, score: latest ? Math.min(...latest.grades.map(g => g.totalScore)) : null, unresolvedBlockers: latest ? latest.grades.flatMap(g => g.blockingIssues) : [], waivers: [] };
}
