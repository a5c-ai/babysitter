import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.resolve(__dirname, '..', 'src', 'index.json');
const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));

const records = Object.values(index.records);
const edges = index.edges;
const recordCount = records.length;
const edgeCount = edges.length;
const verbose = process.argv.includes('--verbose');

// ── Helpers ──
const pct = (n, d) => d > 0 ? Math.min(100, n / d * 100).toFixed(1) : '0.0';
const pad = (s, w = 8) => String(s).padStart(w);
const edgesFrom = (id) => edges.filter(e => e.from === id);
const edgesTo = (id) => edges.filter(e => e.to === id);
const edgeSet = (kind) => new Set(edges.filter(e => e.kind === kind).flatMap(e => [e.from, e.to]));
const sourceSet = (kind) => new Set(edges.filter(e => e.kind === kind).map(e => e.from));
const byKind = (k) => records.filter(r => r._kind === k);
const recordIds = new Set(Object.keys(index.records));

// ═══════════════════════════════════════════
// SECTION 1: Structural Quality (existing)
// ═══════════════════════════════════════════

const avgDegree = (edgeCount * 2 / recordCount).toFixed(1);

const withEdges = new Set([...edges.map(e => e.from), ...edges.map(e => e.to)]);
const orphans = records.filter(r => !withEdges.has(r.id));
const connectivityScore = (100 - orphans.length / recordCount * 100).toFixed(1);

const activeEdgeKinds = Object.entries(index.edgeKinds).filter(([, v]) => v.count > 0).length;
const totalEdgeKinds = Object.keys(index.edgeKinds).length;
const edgeDiversity = pct(activeEdgeKinds, totalEdgeKinds);

const libs = byKind('Library');
const libWithSkill = new Set(edges.filter(e => e.from.startsWith('library:') && (e.kind === 'library_used_by' || e.kind === 'used_for')).map(e => e.from));
const libCoverage = pct(libWithSkill.size, libs.length);

const tools = byKind('Tool');
const toolWithSkill = new Set(edges.filter(e => e.from.startsWith('tool:') && (e.kind === 'used_for' || e.kind === 'tool_used_by')).map(e => e.from));
const toolCoverage = pct(toolWithSkill.size, tools.length);

const fws = byKind('Framework');
const fwWithSkill = new Set(edges.filter(e => e.from.startsWith('framework:') && e.kind === 'used_by_skill_area').map(e => e.from));
const fwCoverage = pct(fwWithSkill.size, fws.length);

const tsList = byKind('ToolServer');
const candidateToolServers = tsList.filter(t => t.candidateStatus === 'needs-source-verification');
const verifiedToolServers = tsList.filter(t => t.candidateStatus !== 'needs-source-verification');
const tsWithInt = new Set(edges.filter(e => e.kind === 'integrates_with' && e.from.startsWith('tool-server:')).map(e => e.from));
const tsCoverage = pct(tsWithInt.size, tsList.length);

const altEligible = records.filter(r => ['Tool', 'Framework', 'Library'].includes(r._kind)).length;
const withAlt = edgeSet('alternative_to');
const altCoverage = pct(withAlt.size, altEligible);

const skillAreas = byKind('SkillArea');
const withPrereq = edgeSet('prerequisite_for_learning');
const learnCoverage = pct(Math.min(withPrereq.size, skillAreas.length), skillAreas.length);

const agentVersions = byKind('AgentVersion');
const withMem = sourceSet('uses_memory_system');
const memCoverage = pct(withMem.size, agentVersions.length);

const dangling = edges.filter(e => !recordIds.has(e.to)).length;

// ═══════════════════════════════════════════
// SECTION 2: Description & Attribute Coverage
// ═══════════════════════════════════════════

const domainKinds = ['Tool', 'Framework', 'Library', 'ToolServer', 'AgentProduct', 'SkillArea', 'Role', 'Workflow', 'Methodology', 'Topic', 'Domain'];
const domainRecords = records.filter(r => domainKinds.includes(r._kind));

const withDesc = domainRecords.filter(r => r.description && String(r.description).trim().length > 10);
const descCoverage = pct(withDesc.size ?? withDesc.length, domainRecords.length);

const withDisplayName = domainRecords.filter(r => r.displayName && String(r.displayName).trim().length > 0);
const displayNameCoverage = pct(withDisplayName.length, domainRecords.length);

// Products with description
const products = byKind('AgentProduct');
const productsWithDesc = products.filter(r => r.description && String(r.description).trim().length > 20);
const productDescCoverage = pct(productsWithDesc.length, products.length);

// Tools with homepageUrl or repoUrl
const toolsWithUrl = tools.filter(r => r.homepageUrl || r.repoUrl || r.npmPackage);
const toolUrlCoverage = pct(toolsWithUrl.length, tools.length);

// Frameworks with homepageUrl
const fwsWithUrl = fws.filter(r => r.homepageUrl || r.repoUrl);
const fwUrlCoverage = pct(fwsWithUrl.length, fws.length);

// ═══════════════════════════════════════════
// SECTION 3: Claims & Evidence Coverage
// ═══════════════════════════════════════════

const claims = byKind('TestableClaim');
const claimsWithTest = claims.filter(c => c.testCommand && String(c.testCommand).trim().length > 0);
const claimTestCoverage = pct(claimsWithTest.length, claims.length);

const experiments = byKind('Experiment');
const experimentsWithEvidence = experiments.filter(e => e.outcome || e.result || e.status);
const experimentCompletionRate = pct(experimentsWithEvidence.length, experiments.length);

const evidenceSources = byKind('EvidenceSource');
const evidenceWithUrl = evidenceSources.filter(e => e.url || e.repoUrl || e.sourceUrl);
const evidenceUrlCoverage = pct(evidenceWithUrl.length, evidenceSources.length);

// Claims per product (how many products have at least one claim about them?)
const claimEdgeKinds = ['has_testable_claim', 'tests_claim', 'asserts_about'];
const productsWithClaims = products.filter(p => {
  return edges.some(e =>
    (e.to === p.id && claimEdgeKinds.includes(e.kind)) ||
    (e.from === p.id && claimEdgeKinds.includes(e.kind))
  );
});
const productClaimCoverage = pct(productsWithClaims.length, products.length);

// ═══════════════════════════════════════════
// SECTION 4: Association Completeness
// ═══════════════════════════════════════════

// Tools/Frameworks/Libraries with belongs_to_language.
// Language-neutral Tool records are SaaS/API/service products where forcing a
// programming-language edge would be misleading. They are tracked separately so
// remaining Tool→language gaps stay actionable.
const langEdge = (prefix) => new Set(edges.filter(e => e.from.startsWith(prefix) && e.kind === 'belongs_to_language').map(e => e.from));
const toolsWithLang = langEdge('tool:');
const languageNeutralTools = tools.filter(t => t.languageApplicability === 'neutral');
const languageApplicableTools = tools.filter(t => t.languageApplicability !== 'neutral');
const languageApplicableToolsWithLang = languageApplicableTools.filter(t => toolsWithLang.has(t.id));
const fwsWithLang = langEdge('framework:');
const libsWithLang = langEdge('library:');
const toolLangCoverage = pct(languageApplicableToolsWithLang.length, languageApplicableTools.length);
const fwLangCoverage = pct(fwsWithLang.size, fws.length);
const libLangCoverage = pct(libsWithLang.size, libs.length);

// Roles with at least one responsibility edge
const roles = byKind('Role');
const rolesWithResp = new Set(edges.filter(e => (e.kind === 'has_responsibility' || e.kind === 'holds_responsibility') && roles.some(r => r.id === e.from)).map(e => e.from));
const roleRespCoverage = pct(rolesWithResp.size, roles.length);

// Workflows with at least one step or involves edge
const workflows = byKind('Workflow');
const workflowEdgeSet = new Set(edges.filter(e => (e.kind === 'has_step' || e.kind === 'involves_role' || e.kind === 'involves_skill_area') && workflows.some(w => w.id === e.from)).map(e => e.from));
const workflowAssocCoverage = pct(workflowEdgeSet.size, workflows.length);

// Domains with contains edges
const domains = byKind('Domain');
const domainsWithContains = new Set(edges.filter(e => e.kind === 'contains' && domains.some(d => d.id === e.from)).map(e => e.from));
const domainContainsCoverage = pct(domainsWithContains.size, domains.length);

// Topics with parent domain
const topics = byKind('Topic');
const topicsWithParent = new Set(edges.filter(e => (e.kind === 'belongs_to_domain' || e.kind === 'contains') && topics.some(t => t.id === e.to || t.id === e.from)).flatMap(e => [e.from, e.to]).filter(id => topics.some(t => t.id === id)));
const topicParentCoverage = pct(topicsWithParent.size, topics.length);

// Verified ToolServers with repoUrl, installCommand, or npmPackage.
// Candidate records intentionally track source-verification gaps and should not
// incentivize fabricated repository/install metadata.
const tsWithRepo = verifiedToolServers.filter(t => t.repoUrl || t.installCommand || t.npmPackage);
const tsRepoCoverage = pct(tsWithRepo.length, verifiedToolServers.length);

// ═══════════════════════════════════════════
// SECTION 6: Agent Stack Completeness
// ═══════════════════════════════════════════

const agentProducts = byKind('AgentProduct');
const productsWithImpl = new Set(edges.filter(e => e.kind === 'has_version' && agentProducts.some(p => p.id === e.from)).map(e => e.from));
const productVersionCoverage = pct(productsWithImpl.size, agentProducts.length);

const versionsWithCaps = new Set(edges.filter(e => e.kind === 'supports' && agentVersions.some(v => v.id === e.from)).map(e => e.from));
const versionCapCoverage = pct(versionsWithCaps.size, agentVersions.length);

const versionComposed = new Set(edges.filter(e => e.kind === 'composed_of' && agentVersions.some(v => v.id === e.from)).map(e => e.from));
const versionComposedCoverage = pct(versionComposed.size, agentVersions.length);

const coreImpls = byKind('AgentCoreImpl');
const coreRealizes = new Set(edges.filter(e => e.kind === 'realizes' && coreImpls.some(c => c.id === e.from)).map(e => e.from));
const coreRealizeCoverage = pct(coreRealizes.size, coreImpls.length);

const rtImpls = byKind('AgentRuntimeImpl');
const rtRealizes = new Set(edges.filter(e => e.kind === 'realizes' && rtImpls.some(r => r.id === e.from)).map(e => e.from));
const rtRealizeCoverage = pct(rtRealizes.size, rtImpls.length);

const platImpls = byKind('AgentPlatformImpl');
const platRealizes = new Set(edges.filter(e => e.kind === 'realizes' && platImpls.some(p => p.id === e.from)).map(e => e.from));
const platRealizeCoverage = pct(platRealizes.size, platImpls.length);

const uiImpls = byKind('AgentUIImpl');
const uiWithSIP = new Set(edges.filter(e => e.kind === 'supports_interaction_primitive').map(e => e.from));
const uiSIPCoverage = pct(uiImpls.filter(u => uiWithSIP.has(u.id)).length, uiImpls.length);

const presentations = byKind('Presentation');
const presBundled = new Set(edges.filter(e => e.kind === 'bundled_with' || e.kind === 'bundled_into').flatMap(e => [e.from, e.to]));
const presBundledCoverage = pct(presentations.filter(p => presBundled.has(p.id)).length, presentations.length);

const orchPrimitives = byKind('OrchestrationPrimitive');
const orchWithEdge = new Set([...edges.filter(e => e.from.startsWith('orch-primitive:')).map(e => e.from), ...edges.filter(e => e.to.startsWith('orch-primitive:')).map(e => e.to)]);
const orchConnectedCoverage = pct(orchPrimitives.filter(o => orchWithEdge.has(o.id)).length, orchPrimitives.length);

// ═══════════════════════════════════════════
// SECTION 7: Compute & Models
// ═══════════════════════════════════════════

const modelVersions = byKind('ModelVersion');
const modelFamilies = byKind('ModelFamily');
const providers = byKind('Provider');

const mvWithFamily = new Set(edges.filter(e => e.kind === 'belongs_to_family').map(e => e.from));
const mvFamilyCoverage = pct(mvWithFamily.size, modelVersions.length);

const modelProviderEdgeKinds = new Set(['provided_by', 'serves', 'served_by']);
const modelVersionIds = new Set(modelVersions.map(m => m.id));
const mvWithProvider = new Set(edges.filter(e => modelProviderEdgeKinds.has(e.kind) && (modelVersionIds.has(e.from) || modelVersionIds.has(e.to))).flatMap(e => [e.from, e.to]).filter(id => modelVersionIds.has(id)));
const mvProviderCoverage = pct(mvWithProvider.size, modelVersions.length);

const transportClients = byKind('TransportClient');
const transportProxies = byKind('TransportProxy');

// ═══════════════════════════════════════════
// SECTION 8: Benchmarks & Eval
// ═══════════════════════════════════════════

const benchmarks = byKind('Benchmark');
const evalResults = byKind('EvalResult');
const evalRuns = byKind('EvalRun');
const testSets = byKind('TestSet');

const benchmarkIds = new Set(benchmarks.map(b => b.id));
const evalResultIds = new Set(evalResults.map(r => r.id));
const evalRunIds = new Set(evalRuns.map(r => r.id));
const benchmarkResultEdgeKinds = new Set(['evaluated_on', 'has_eval_result', 'benchmarked_on', 'scored_against', 'for_benchmark']);
const benchmarkTestSetEdgeKinds = new Set(['belongs_to_benchmark', 'uses_test_set', 'has_test_set']);
const benchmarkSourceFields = ['homepageUrl', 'repoUrl', 'paperUrl', 'datasetUrl', 'leaderboardUrl', 'sourceUrl'];

const benchmarkWithSources = new Set(benchmarks
  .filter(b => benchmarkSourceFields.some(field => b[field] || b.attributes?.[field]))
  .map(b => b.id));
const benchmarkSourceCoverage = pct(benchmarkWithSources.size, benchmarks.length);

const benchWithTestSets = new Set();
for (const testSet of testSets) {
  const benchmarkId = testSet.benchmarkId || testSet.attributes?.benchmarkId;
  if (benchmarkIds.has(benchmarkId)) benchWithTestSets.add(benchmarkId);
}
for (const edge of edges) {
  if (!benchmarkTestSetEdgeKinds.has(edge.kind)) continue;
  if (benchmarkIds.has(edge.from)) benchWithTestSets.add(edge.from);
  if (benchmarkIds.has(edge.to)) benchWithTestSets.add(edge.to);
}
const benchmarkTestSetCoverage = pct(benchWithTestSets.size, benchmarks.length);

const benchWithResults = new Set();
for (const edge of edges) {
  if (!benchmarkResultEdgeKinds.has(edge.kind)) continue;
  const fromIsBenchmark = benchmarkIds.has(edge.from);
  const toIsBenchmark = benchmarkIds.has(edge.to);
  const fromIsEvalArtifact = evalResultIds.has(edge.from) || evalRunIds.has(edge.from);
  const toIsEvalArtifact = evalResultIds.has(edge.to) || evalRunIds.has(edge.to);
  if (fromIsBenchmark && toIsEvalArtifact) benchWithResults.add(edge.from);
  if (toIsBenchmark && fromIsEvalArtifact) benchWithResults.add(edge.to);
}
const benchResultCoverage = pct(benchWithResults.size, benchmarks.length);
const benchmarkArtifactCoverage = ((
  parseFloat(benchmarkSourceCoverage) +
  parseFloat(benchmarkTestSetCoverage) +
  parseFloat(benchResultCoverage)
) / 3).toFixed(1);

const evalRunsWithBench = new Set(edges
  .filter(e => benchmarkResultEdgeKinds.has(e.kind) && evalRunIds.has(e.from) && benchmarkIds.has(e.to))
  .map(e => e.from));
const evalRunBenchCoverage = pct(evalRunsWithBench.size, evalRuns.length);

// ═══════════════════════════════════════════
// SECTION 9: Knowledge Fabric & Security
// ═══════════════════════════════════════════

const kfImpls = byKind('KnowledgeFabricImpl');
const kfWithRealize = new Set(edges.filter(e => e.kind === 'realizes' && kfImpls.some(k => k.id === e.from)).map(e => e.from));
const kfRealizeCoverage = pct(kfWithRealize.size, kfImpls.length);

const memorySystems = byKind('MemorySystem');
const memWithProduct = new Set(edges.filter(e => e.kind === 'uses_memory_system').map(e => e.to));
const memUsedCoverage = pct(memorySystems.filter(m => memWithProduct.has(m.id)).length, memorySystems.length);

// ═══════════════════════════════════════════
// SECTION 10: Hooks & Channels
// ═══════════════════════════════════════════

const hookSurfaces = byKind('HookSurface');
const hookMappings = byKind('HookMapping');
const hookSurfacesWithMapping = new Set(edges.filter(e => e.kind === 'maps_hook').map(e => e.to));
const hookMappingCoverage = pct(hookSurfacesWithMapping.size, hookSurfaces.length);

const hookSurfacesExposed = new Set(edges.filter(e => e.kind === 'exposes' && hookSurfaces.some(h => h.id === e.to)).map(e => e.to));
const hookExposedCoverage = pct(hookSurfacesExposed.size, hookSurfaces.length);

// ═══════════════════════════════════════════
// SECTION 11: Library Bridge
// ═══════════════════════════════════════════

const libProcesses = byKind('LibraryProcess');
const libSkills = byKind('LibrarySkill');
const libAgents = byKind('LibraryAgent');

const lpWithSkillArea = new Set(edges.filter(e => e.kind === 'lib_requires_skill_area' && e.from.startsWith('lib-process:')).map(e => e.from));
const lpSkillCoverage = pct(lpWithSkillArea.size, libProcesses.length);

const lsWithSkillArea = new Set(edges.filter(e => e.kind === 'lib_requires_skill_area' && e.from.startsWith('lib-skill:')).map(e => e.from));
const lsSkillCoverage = pct(lsWithSkillArea.size, libSkills.length);

const laWithRole = new Set(edges.filter(e => e.kind === 'lib_involves_role' && e.from.startsWith('lib-agent:')).map(e => e.from));
const laRoleCoverage = pct(laWithRole.size, libAgents.length);

// ═══════════════════════════════════════════
// SECTION 12: Domain Taxonomy & Structure
// ═══════════════════════════════════════════

const specializations = byKind('Specialization');
const specializationIds = new Set(specializations.map(s => s.id));
const skillAreaIds = new Set(skillAreas.map(s => s.id));
const specsWithAppliedSkillArea = new Set(edges
  .filter(e => e.kind === 'applies_to' && specializationIds.has(e.to) && skillAreaIds.has(e.from))
  .map(e => e.to));
const specsContainingSkillArea = new Set(edges
  .filter(e => e.kind === 'contains' && specializationIds.has(e.from) && skillAreaIds.has(e.to))
  .map(e => e.from));
const specsWithSkillArea = new Set([...specsWithAppliedSkillArea, ...specsContainingSkillArea]);
const specSkillCoverage = pct(specsWithSkillArea.size, specializations.length);

const methodologies = byKind('Methodology');
const methsReferenced = new Set(edges.filter(e => e.kind === 'follows_methodology').map(e => e.to));
const methRefCoverage = pct(methsReferenced.size, methodologies.length);

const languages = byKind('Language');
const langsWithRef = new Set(edges.filter(e => e.kind === 'belongs_to_language').map(e => e.to));
const langRefCoverage = pct(langsWithRef.size, languages.length);

const platformServices = byKind('PlatformService');
const platforms = byKind('Platform');

// ═══════════════════════════════════════════
// SECTION 13: Graph Health & Hygiene
// ═══════════════════════════════════════════

// Cross-cluster connectivity
const clusterOf = (id) => index.records[id]?._cluster || 'unknown';
let crossCluster = 0, sameCluster = 0;
for (const e of edges) {
  const fc = clusterOf(e.from), tc = clusterOf(e.to);
  if (fc !== 'unknown' && tc !== 'unknown') {
    if (fc === tc) sameCluster++; else crossCluster++;
  }
}
const crossClusterRatio = pct(crossCluster, sameCluster + crossCluster);

// Edge reciprocity
const activeKindsList = Object.entries(index.edgeKinds).filter(([, v]) => v.count > 0);
let withInverse = 0;
for (const [, info] of activeKindsList) {
  const inv = info.inverse;
  if (inv && index.edgeKinds[inv] && index.edgeKinds[inv].count > 0) withInverse++;
}
const edgeReciprocity = pct(withInverse, activeKindsList.length);

// Source pinning for products
const withSourceEdge = new Set(edges.filter(e => e.kind === 'sourced_from' || e.kind === 'source_of' || e.kind === 'packageRef').flatMap(e => [e.from, e.to]));
const productsWithSource = agentProducts.filter(p => withSourceEdge.has(p.id) || p.packageRef || p.homepageUrl);
const productSourceCoverage = pct(productsWithSource.length, agentProducts.length);

// Description quality (short descriptions < 20 chars among domain entities)
const shortDescs = domainRecords.filter(r => r.description && String(r.description).trim().length > 0 && String(r.description).trim().length < 20);
const descQualityScore = pct(domainRecords.length - shortDescs.length, domainRecords.length);

// Duplicate displayName detection (cross-kind)
const nameMap = {};
for (const r of records) {
  const name = r.displayName;
  if (!name) continue;
  const key = name.toLowerCase().trim();
  if (!nameMap[key]) nameMap[key] = [];
  nameMap[key].push({ id: r.id, kind: r._kind });
}
const crossKindDupes = Object.entries(nameMap).filter(([, v]) => v.length > 1 && new Set(v.map(x => x.kind)).size > 1);

// ToolServer categorization
const tsWithCategory = tsList.filter(t => t.category);
const tsCategoryCoverage = pct(tsWithCategory.length, tsList.length);

// ═══════════════════════════════════════════
// Overall Score (reweighted with new metrics)
// ═══════════════════════════════════════════

const overall = (
  // Structural (15%)
  parseFloat(connectivityScore) * 0.06 +
  parseFloat(edgeDiversity) * 0.03 +
  (100 - dangling / edgeCount * 10000) * 0.03 +
  (index.stats.parseErrors === 0 ? 100 : 0) * 0.03 +
  // Domain coverage (15%)
  parseFloat(libCoverage) * 0.03 +
  parseFloat(toolCoverage) * 0.03 +
  parseFloat(fwCoverage) * 0.03 +
  parseFloat(tsCoverage) * 0.03 +
  parseFloat(altCoverage) * 0.03 +
  // Learning & memory (4%)
  parseFloat(learnCoverage) * 0.02 +
  parseFloat(memCoverage) * 0.02 +
  // Description & attributes (12%)
  parseFloat(descCoverage) * 0.04 +
  parseFloat(productDescCoverage) * 0.02 +
  parseFloat(toolUrlCoverage) * 0.03 +
  parseFloat(tsRepoCoverage) * 0.03 +
  // Claims & evidence (10%)
  parseFloat(claimTestCoverage) * 0.04 +
  parseFloat(productClaimCoverage) * 0.03 +
  pct(evidenceWithUrl.length, evidenceSources.length) * 0.03 +
  // Associations (12%)
  parseFloat(roleRespCoverage) * 0.02 +
  parseFloat(domainContainsCoverage) * 0.02 +
  parseFloat(workflowAssocCoverage) * 0.02 +
  parseFloat(topicParentCoverage) * 0.02 +
  parseFloat(toolLangCoverage) * 0.02 +
  parseFloat(versionCapCoverage) * 0.02 +
  // Agent stack (14%)
  parseFloat(productVersionCoverage) * 0.02 +
  parseFloat(versionComposedCoverage) * 0.02 +
  parseFloat(coreRealizeCoverage) * 0.01 +
  parseFloat(rtRealizeCoverage) * 0.01 +
  parseFloat(platRealizeCoverage) * 0.01 +
  parseFloat(uiSIPCoverage) * 0.02 +
  parseFloat(presBundledCoverage) * 0.01 +
  parseFloat(orchConnectedCoverage) * 0.02 +
  parseFloat(hookMappingCoverage) * 0.02 +
  // Compute & benchmarks (8%)
  parseFloat(mvProviderCoverage) * 0.02 +
  parseFloat(benchmarkArtifactCoverage) * 0.015 +
  parseFloat(benchResultCoverage) * 0.005 +
  parseFloat(kfRealizeCoverage) * 0.02 +
  parseFloat(memUsedCoverage) * 0.02 +
  // Library bridge (4%)
  parseFloat(lpSkillCoverage) * 0.02 +
  parseFloat(lsSkillCoverage) * 0.01 +
  parseFloat(laRoleCoverage) * 0.01 +
  // Taxonomy & structure (5%)
  parseFloat(specSkillCoverage) * 0.02 +
  parseFloat(methRefCoverage) * 0.01 +
  parseFloat(langRefCoverage) * 0.02 +
  // Graph health (5%)
  parseFloat(crossClusterRatio) * 0.01 +
  parseFloat(edgeReciprocity) * 0.01 +
  parseFloat(productSourceCoverage) * 0.01 +
  parseFloat(descQualityScore) * 0.01 +
  parseFloat(tsCategoryCoverage) * 0.01
).toFixed(1);

// ═══════════════════════════════════════════
// Output
// ═══════════════════════════════════════════

const W = 56;
const line = (label, value) => `║ ${label.padEnd(26)}${pad(value, 8)}                  ║`;
const header = (title) => `╠${'═'.repeat(W - 2)}╣\n║ ${title.padEnd(W - 4)} ║`;

console.log(`╔${'═'.repeat(W - 2)}╗`);
console.log(`║   Atlas Graph Quality Report (Extended)      ║`);
console.log(`╠${'═'.repeat(W - 2)}╣`);
console.log(line('Records:', recordCount));
console.log(line('Edges:', edgeCount));
console.log(line('Node kinds:', Object.keys(index.nodeKinds).length));
console.log(line('Edge kinds:', `${totalEdgeKinds} (${activeEdgeKinds} active)`));
console.log(line('Avg degree:', avgDegree));

console.log(header('STRUCTURAL QUALITY'));
console.log(line('Connectivity:', connectivityScore + '%'));
console.log(line('Edge diversity:', edgeDiversity + '%'));
console.log(line('Dangling edges:', dangling));
console.log(line('Parse errors:', index.stats.parseErrors));

console.log(header('ENTITY → SKILL COVERAGE'));
console.log(line('Library→skill:', libCoverage + '%'));
console.log(line('Tool→skill:', toolCoverage + '%'));
console.log(line('Framework→skill:', fwCoverage + '%'));
console.log(line('ToolServer integ:', tsCoverage + '%'));
console.log(line('Alternatives:', altCoverage + '%'));

console.log(header('LEARNING & MEMORY'));
console.log(line('Learning paths:', learnCoverage + '%'));
console.log(line('Memory systems:', memCoverage + '%'));

console.log(header('DESCRIPTION & ATTRIBUTES'));
console.log(line('Domain desc coverage:', descCoverage + '%'));
console.log(line('DisplayName coverage:', displayNameCoverage + '%'));
console.log(line('Product descriptions:', productDescCoverage + '%'));
console.log(line('Tool URLs:', toolUrlCoverage + '%'));
console.log(line('Framework URLs:', fwUrlCoverage + '%'));
console.log(line('Verified TS repo/install:', tsRepoCoverage + '%'));

console.log(header('CLAIMS & EVIDENCE'));
console.log(line('Claims total:', claims.length));
console.log(line('Claims with tests:', claimTestCoverage + '%'));
console.log(line('Experiments total:', experiments.length));
console.log(line('Experiment completion:', experimentCompletionRate + '%'));
console.log(line('Evidence sources:', evidenceSources.length));
console.log(line('Evidence with URLs:', evidenceUrlCoverage + '%'));
console.log(line('Products with claims:', productClaimCoverage + '%'));

console.log(header('ASSOCIATION COMPLETENESS'));
console.log(line('Tool→language:', toolLangCoverage + '%'));
console.log(line('Language-neutral tools:', languageNeutralTools.length));
console.log(line('Framework→language:', fwLangCoverage + '%'));
console.log(line('Library→language:', libLangCoverage + '%'));
console.log(line('Role→responsibility:', roleRespCoverage + '%'));
console.log(line('Workflow associations:', workflowAssocCoverage + '%'));
console.log(line('Domain→contains:', domainContainsCoverage + '%'));
console.log(line('Topic→parent:', topicParentCoverage + '%'));

console.log(header('AGENT STACK'));
console.log(line('Product→version:', productVersionCoverage + '%'));
console.log(line('Version→composed_of:', versionComposedCoverage + '%'));
console.log(line('Version→capabilities:', versionCapCoverage + '%'));
console.log(line('Core→realizes:', coreRealizeCoverage + '%'));
console.log(line('Runtime→realizes:', rtRealizeCoverage + '%'));
console.log(line('Platform→realizes:', platRealizeCoverage + '%'));
console.log(line('UI→interaction prims:', uiSIPCoverage + '%'));
console.log(line('Presentations bundled:', presBundledCoverage + '%'));
console.log(line('Orch primitives conn:', orchConnectedCoverage + '%'));

console.log(header('COMPUTE & MODELS'));
console.log(line('Providers:', providers.length));
console.log(line('Model families:', modelFamilies.length));
console.log(line('Model versions:', modelVersions.length));
console.log(line('MV→family:', mvFamilyCoverage + '%'));
console.log(line('MV→provider:', mvProviderCoverage + '%'));

console.log(header('BENCHMARKS & EVAL'));
console.log(line('Benchmarks:', benchmarks.length));
console.log(line('Eval results:', evalResults.length));
console.log(line('Eval runs:', evalRuns.length));
console.log(line('Bench→sources:', benchmarkSourceCoverage + '%'));
console.log(line('Bench→test sets:', benchmarkTestSetCoverage + '%'));
console.log(line('Bench artifact score:', benchmarkArtifactCoverage + '%'));
console.log(line('Bench→results:', benchResultCoverage + '%'));
console.log(line('Runs→benchmark:', evalRunBenchCoverage + '%'));

console.log(header('KNOWLEDGE FABRIC'));
console.log(line('KF implementations:', kfImpls.length));
console.log(line('KF→realizes:', kfRealizeCoverage + '%'));
console.log(line('Memory systems:', memorySystems.length));
console.log(line('Memory systems used:', memUsedCoverage + '%'));
console.log(line('Knowledge sources:', byKind('KnowledgeSource').length));
console.log(line('Retrieval pipelines:', byKind('RetrievalPipeline').length));

console.log(header('HOOKS & CHANNELS'));
console.log(line('Hook surfaces:', hookSurfaces.length));
console.log(line('Hook mappings:', hookMappings.length));
console.log(line('Surfaces→mapping:', hookMappingCoverage + '%'));
console.log(line('Surfaces exposed:', hookExposedCoverage + '%'));

console.log(header('LIBRARY BRIDGE'));
console.log(line('Lib processes:', libProcesses.length));
console.log(line('Process→skill-area:', lpSkillCoverage + '%'));
console.log(line('Lib skills:', libSkills.length));
console.log(line('Skill→skill-area:', lsSkillCoverage + '%'));
console.log(line('Lib agents:', libAgents.length));
console.log(line('Agent→role:', laRoleCoverage + '%'));

console.log(header('DOMAIN TAXONOMY'));
console.log(line('Specializations:', specializations.length));
console.log(line('Spec→skill coverage:', specSkillCoverage + '%'));
console.log(line('Methodologies:', methodologies.length));
console.log(line('Meth referenced:', methRefCoverage + '%'));
console.log(line('Languages:', languages.length));
console.log(line('Lang referenced:', langRefCoverage + '%'));
console.log(line('Platforms:', platforms.length));
console.log(line('Platform services:', platformServices.length));

console.log(header('GRAPH HEALTH'));
console.log(line('Cross-cluster ratio:', crossClusterRatio + '%'));
console.log(line('Edge reciprocity:', edgeReciprocity + '%'));
console.log(line('Product source refs:', productSourceCoverage + '%'));
console.log(line('Desc quality (>20ch):', descQualityScore + '%'));
console.log(line('ToolServer categories:', tsCategoryCoverage + '%'));
console.log(line('Cross-kind dupes:', crossKindDupes.length));
console.log(line('Orphans:', orphans.length));

console.log(`╠${'═'.repeat(W - 2)}╣`);
console.log(`║ OVERALL SCORE:        ${pad(overall + '/100', 8)}                  ║`);
console.log(`╚${'═'.repeat(W - 2)}╝`);

// ── Verbose: list gaps ──
if (verbose) {
  console.log('\n=== GAPS ===\n');

  const noDesc = domainRecords.filter(r => !r.description || String(r.description).trim().length <= 10);
  if (noDesc.length > 0) {
    console.log(`Domain entities without descriptions (${noDesc.length}):`);
    const byK = {};
    for (const r of noDesc) byK[r._kind] = (byK[r._kind] || 0) + 1;
    for (const [k, v] of Object.entries(byK).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`);
  }

  const noUrl = tools.filter(r => !r.homepageUrl && !r.repoUrl && !r.npmPackage);
  if (noUrl.length > 0) {
    console.log(`\nTools without URLs (${noUrl.length}):`);
    for (const t of noUrl.slice(0, 15)) console.log(`  ${t.id}`);
    if (noUrl.length > 15) console.log(`  ... and ${noUrl.length - 15} more`);
  }

  const noTestClaims = claims.filter(c => !c.testCommand);
  if (noTestClaims.length > 0) {
    console.log(`\nClaims without testCommand (${noTestClaims.length}):`);
    for (const c of noTestClaims.slice(0, 10)) console.log(`  ${c.id} — ${c.displayName || ''}`);
    if (noTestClaims.length > 10) console.log(`  ... and ${noTestClaims.length - 10} more`);
  }

  const noLangTools = languageApplicableTools.filter(r => !toolsWithLang.has(r.id));
  if (noLangTools.length > 0) {
    console.log(`\nLanguage-applicable tools without language (${noLangTools.length}):`);
    for (const t of noLangTools.slice(0, 10)) console.log(`  ${t.id}`);
    if (noLangTools.length > 10) console.log(`  ... and ${noLangTools.length - 10} more`);
  }

  if (languageNeutralTools.length > 0) {
    console.log(`\nLanguage-neutral tools excluded from Tool→language denominator (${languageNeutralTools.length}):`);
    for (const t of languageNeutralTools.slice(0, 10)) console.log(`  ${t.id}`);
    if (languageNeutralTools.length > 10) console.log(`  ... and ${languageNeutralTools.length - 10} more`);
  }

  const noCapsVersions = agentVersions.filter(v => !versionsWithCaps.has(v.id));
  if (noCapsVersions.length > 0) {
    console.log(`\nAgent versions without capabilities (${noCapsVersions.length}):`);
    for (const v of noCapsVersions) console.log(`  ${v.id}`);
  }

  const productsNoClaims = products.filter(p => !productsWithClaims.includes(p));
  if (productsNoClaims.length > 0) {
    console.log(`\nProducts without testable claims (${productsNoClaims.length}):`);
    for (const p of productsNoClaims.slice(0, 15)) console.log(`  ${p.id} — ${p.displayName || ''}`);
    if (productsNoClaims.length > 15) console.log(`  ... and ${productsNoClaims.length - 15} more`);
  }

  const versionsNoComposed = agentVersions.filter(v => !versionComposed.has(v.id));
  if (versionsNoComposed.length > 0) {
    console.log(`\nAgent versions without composed_of (${versionsNoComposed.length}):`);
    for (const v of versionsNoComposed) console.log(`  ${v.id}`);
  }

  const mvNoFamily = modelVersions.filter(m => !mvWithFamily.has(m.id));
  if (mvNoFamily.length > 0) {
    console.log(`\nModel versions without family (${mvNoFamily.length}):`);
    for (const m of mvNoFamily.slice(0, 10)) console.log(`  ${m.id}`);
    if (mvNoFamily.length > 10) console.log(`  ... and ${mvNoFamily.length - 10} more`);
  }

  const benchNoSources = benchmarks.filter(b => !benchmarkWithSources.has(b.id));
  if (benchNoSources.length > 0) {
    console.log(`\nBenchmarks without source URLs (${benchNoSources.length}):`);
    for (const b of benchNoSources.slice(0, 10)) console.log(`  ${b.id}`);
    if (benchNoSources.length > 10) console.log(`  ... and ${benchNoSources.length - 10} more`);
  }

  const benchNoTestSets = benchmarks.filter(b => !benchWithTestSets.has(b.id));
  if (benchNoTestSets.length > 0) {
    console.log(`\nBenchmarks without test-set artifacts (${benchNoTestSets.length}):`);
    for (const b of benchNoTestSets.slice(0, 10)) console.log(`  ${b.id}`);
    if (benchNoTestSets.length > 10) console.log(`  ... and ${benchNoTestSets.length - 10} more`);
  }

  const benchNoResults = benchmarks.filter(b => !benchWithResults.has(b.id));
  if (benchNoResults.length > 0) {
    console.log(`\nBenchmarks without eval results (${benchNoResults.length}):`);
    for (const b of benchNoResults.slice(0, 10)) console.log(`  ${b.id}`);
    if (benchNoResults.length > 10) console.log(`  ... and ${benchNoResults.length - 10} more`);
  }

  const hookNoMapping = hookSurfaces.filter(h => !hookSurfacesWithMapping.has(h.id) && !hookSurfacesExposed.has(h.id));
  if (hookNoMapping.length > 0) {
    console.log(`\nHook surfaces without mapping or exposure (${hookNoMapping.length}):`);
    for (const h of hookNoMapping.slice(0, 10)) console.log(`  ${h.id}`);
    if (hookNoMapping.length > 10) console.log(`  ... and ${hookNoMapping.length - 10} more`);
  }

  const langsNoRef = languages.filter(l => !langsWithRef.has(l.id));
  if (langsNoRef.length > 0) {
    console.log(`\nLanguages not referenced by any framework/library (${langsNoRef.length}):`);
    for (const l of langsNoRef) console.log(`  ${l.id}`);
  }

  const specsNoSkill = specializations.filter(s => !specsWithSkillArea.has(s.id));
  if (specsNoSkill.length > 0) {
    console.log(`\nSpecializations without skill-area coverage (${specsNoSkill.length}):`);
    for (const s of specsNoSkill.slice(0, 15)) console.log(`  ${s.id}`);
    if (specsNoSkill.length > 15) console.log(`  ... and ${specsNoSkill.length - 15} more`);
  }

  if (crossKindDupes.length > 0) {
    console.log(`\nCross-kind duplicate displayNames (${crossKindDupes.length}):`);
    for (const [name, entries] of crossKindDupes.slice(0, 10)) {
      console.log(`  "${name}": ${entries.map(e => e.kind + ':' + e.id).join(', ')}`);
    }
    if (crossKindDupes.length > 10) console.log(`  ... and ${crossKindDupes.length - 10} more`);
  }

  const verifiedTsNoRepo = verifiedToolServers.filter(t => !t.repoUrl && !t.installCommand && !t.npmPackage);
  if (verifiedTsNoRepo.length > 0) {
    console.log(`\nVerified ToolServers without repo/install metadata (${verifiedTsNoRepo.length}):`);
    for (const t of verifiedTsNoRepo.slice(0, 10)) console.log(`  ${t.id}`);
    if (verifiedTsNoRepo.length > 10) console.log(`  ... and ${verifiedTsNoRepo.length - 10} more`);
  }

  if (candidateToolServers.length > 0) {
    console.log(`\nToolServer candidates pending source verification (${candidateToolServers.length}):`);
    for (const t of candidateToolServers.slice(0, 10)) console.log(`  ${t.id}`);
    if (candidateToolServers.length > 10) console.log(`  ... and ${candidateToolServers.length - 10} more`);
  }

  const tsNoCategory = tsList.filter(t => !t.category);
  if (tsNoCategory.length > 0) {
    console.log(`\nToolServers without category (${tsNoCategory.length}):`);
    for (const t of tsNoCategory.slice(0, 10)) console.log(`  ${t.id}`);
    if (tsNoCategory.length > 10) console.log(`  ... and ${tsNoCategory.length - 10} more`);
  }

  console.log(`\nOrphans by kind (${orphans.length} total):`);
  const orphanByKind = {};
  for (const r of orphans) orphanByKind[r._kind] = (orphanByKind[r._kind] || 0) + 1;
  for (const [k, v] of Object.entries(orphanByKind).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`);
}
