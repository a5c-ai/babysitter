/**
 * @process qa-testing-automation/release-quality-assurance-workflow
 * @description Flagship release-quality end-to-end workflow: risk-based test strategy ->
 *   coverage/gap analysis -> suite authoring -> environment + test-data provisioning
 *   (adversarial fidelity gate) -> parallel multi-tier suite execution -> mutation + flake
 *   depth analysis -> adversarial false-green gate -> defect routing and policy-gated
 *   waivers/quarantines/finding-acceptances -> release quality certificate with an explicit
 *   go/no-go. Complements release-engineering/release-lifecycle.js (which owns
 *   cut/build/rollout/rollback) — this process owns the EVIDENCE, that one owns the ACT.
 * @inputs {
 *   release: {                        // required
 *     serviceName: string,            // required
 *     version: string,                // required
 *     repoRoot?: string,              // default '.'
 *     baseRef?: string,               // optional ref the change manifest is diffed from
 *     changeManifest: Array<{ area: string, files?: string[], riskHint?: string }>
 *                                     // required non-empty — an empty manifest means there is
 *                                     // nothing to risk-rank and THROWS (no synthesized manifest)
 *   },
 *   environment: {                    // required
 *     targetEnv: string,              // required — the env the suites run against
 *     platform: string,               // required — provisioning platform for environment-management.js
 *     parityBaseline: string          // required — the production baseline parity is measured against
 *   },
 *   thresholds?: object,              // partial override of DEFAULT_THRESHOLDS; an unknown key THROWS.
 *                                     // p95LatencyMs is MANDATORY here (the table value is null and a
 *                                     // performance budget is never guessed)
 *   layersOverride?: string[]|null,   // must be a subset of Object.keys(TEST_LAYERS); unknown layer THROWS
 *   maxFixAttempts?: number,          // fixer budget inside each adversarialGate (default 2)
 *   maxParallelSuites?: number,       // ctx.parallel.map concurrency within a tier (default 4)
 *   quarantineAutoApproveAfterN?: number, // routed to the suite-quarantine breakpoint ONLY (default 3)
 *   kipEnabled?: boolean,             // recall + assert release-quality memory (default true)
 *   kipDir?: string,                  // kip store directory (default '.a5c/kip')
 *   kipModel?: string,                // model for kip structured paths (default 'sonnet')
 *   artifactsDir?: string             // where dossiers/certificate/report land (default ctx.artifactsDir)
 * }
 * @outputs {
 *   success: boolean,                 // true only when goNoGo.approved === true AND every blocking
 *                                     // layer passed-or-waived AND both adversarial gates passed
 *   releaseQualityId: string,
 *   strategy: { strategyPath, riskAreas, layerPlan, shiftLeftFindings },
 *   coverage: { lineCoverage, branchCoverage, gaps, uncoveredRiskAreas, evidence },
 *   authoring: Array<{ layer, suitesAuthored, filesChanged, evidence }>,
 *   environment: { provisioned, envRef, parityScore, dataFidelity, fidelityGate },
 *   execution: { tiers: object, suites: Array<{ layer, status, passedCount, failedCount,
 *                failingTestIds, command, outputExcerpt, executionError }> },
 *   depth: { mutationScore, survivedMutants, flakinessRate, flakyTestIds, quarantineCandidates },
 *   gateResults: { envDataFidelity: {...}, falseGreen: {...} },
 *   defects: Array<{ defectId, layer, testId, severity, owner, routedTo, ticketRef }>,
 *   waivers: Array<{ actionId, thresholdKey, requested, approved, approvedBy, autoApproved, rationale, expiresAt }>,
 *   quarantines: Array<{ actionId, testIds, approved, approvedBy, autoApproved, coverageRemoved, expiresAt }>,
 *   acceptedFindings: Array<{ actionId, findingId, kind, approved, approvedBy, rationale }>,
 *   goNoGo: { approved, decision: 'go'|'no-go', decidedBy, response, at, certificatePath },
 *   autoApprovals: Array<{ breakpointId, phase, at }>, // ALWAYS present (possibly empty) —
 *                                     // every harness auto-approval surfaced, fail-closed posture
 *   kipFactsAsserted: number,
 *   artifacts: string[],
 *   metadata: { processId, runId, breakpointsHit, timeline (orchestrator-accumulated only), reason? }
 * }
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:qa-testing-automation]
 *   skillAreas: [skill-area:quality-engineering, skill-area:e2e-testing, skill-area:mutation-testing]
 *   workflows: [workflow:release]
 *   roles: [role:qa-engineer, role:tech-lead, role:release-manager]
 *   topics: [topic:continuous-integration, topic:test-driven-development]
 * @policyGatedActions release-quality.go-no-go-signoff, release-quality.suite-quarantine,
 *   release-quality.coverage-threshold-waiver, release-quality.security-finding-acceptance
 * @composedProcesses test-strategy, shift-left-testing, automation-framework, e2e-test-suite,
 *   api-testing, contract-testing, performance-testing, security-testing, accessibility-testing,
 *   cross-browser-testing, mobile-testing, visual-regression, mutation-testing,
 *   environment-management, test-data-management, flakiness-elimination, continuous-testing,
 *   quality-gates, metrics-dashboard
 *
 * BOUNDARY vs release-engineering/release-lifecycle.js (reproduced verbatim):
 *   release-lifecycle.js owns the RELEASE ACT: cutting the release, changelog+versioning,
 *   building/verifying the artifact, the staged canary/partial/full rollout, and rollback.
 *   release-quality-assurance-workflow.js owns the RELEASE EVIDENCE: whether the candidate has
 *   been genuinely tested. It never deploys, never shifts traffic, never rolls back, never
 *   writes a changelog or computes a version.
 *
 *   OWNED HERE ONLY: risk-based test strategy | coverage and gap analysis | suite authoring
 *     across layers | test environment and test-data provisioning fidelity | parallel multi-tier
 *     suite execution | mutation-score / false-green detection | flake triage and quarantine |
 *     defect routing | coverage and security waivers | the release quality certificate and the
 *     go/no-go verdict.
 *   OWNED BY release-lifecycle ONLY: ROLLOUT_STAGES and ROLLOUT_STAGE_POLICY | REGRESSION_ROUTING
 *     and severity triage | policy gates production-deploy, stage-promotion, production-rollback |
 *     changelog, version derivation, artifact build | smoke probes against a DEPLOYED stage |
 *     post-release regression watch.
 *   HANDOFF: this process emits { certificatePath, goNoGo, waivers, quarantines, tierResults } as
 *     its release-quality certificate. release-lifecycle consumes that certificate path as an
 *     input artifact to its 'rel.release-readiness' adversarial gate. The two gates do not
 *     overlap: rel.release-readiness executes the BUILT ARTIFACT plus smoke probes;
 *     qa.false-green executes the TEST SUITES to prove they can still fail. A no-go here means
 *     release-lifecycle is never started.
 *   ANTI-DUPLICATION: no stage/rollout tables here; no deploy/promote/rollback executor tasks
 *     here; no breakpointId from the release-lifecycle namespace here; this process never re-runs
 *     release-lifecycle's readiness critics — it cites its own executed suite evidence.
 *
 * TEST_LAYER_POLICY (reproduced verbatim — the frozen const below is the implementation):
 *   layer          | tier          | module                    | blocking | thresholdKey                 | expert              | authoring owned by point process
 *   api            | functional    | api-testing.js            | yes      | apiPassRate                  | qa-lead             | yes
 *   contract       | functional    | contract-testing.js       | yes      | contractPassRate             | qa-lead             | yes
 *   e2e            | functional    | e2e-test-suite.js         | yes      | e2ePassRate                  | qa-lead             | yes
 *   performance    | performance   | performance-testing.js    | yes      | p95LatencyMs                 | engineering-manager | no
 *   security       | security      | security-testing.js       | yes      | maxOpenHighSecurityFindings  | security-lead       | no
 *   accessibility  | experience    | accessibility-testing.js  | yes      | a11yLevel                    | security-lead       | no
 *   cross-browser  | compatibility | cross-browser-testing.js  | yes      | compatPassRate               | qa-lead             | yes
 *   mobile         | compatibility | mobile-testing.js         | yes      | compatPassRate               | qa-lead             | yes
 *   visual         | experience    | visual-regression.js      | no       | maxVisualDiffs               | qa-lead             | yes
 *
 * Hard rules: Style-A agent tasks only (zero kind:'shell'); every verification/critic
 * outputSchema declares evidence { type:'array', minItems:1 }; NO fallbacks — unknown layer,
 * unknown tier, unknown threshold key, an unknown suite status and a null performance budget all
 * THROW; a suite that cannot run is status 'failed' with executionError, never skipped-and-passed
 * (SUITE_STATUSES has exactly two members to make the skipped-and-passed path unrepresentable);
 * coverage is only ever removed through the release-quality.suite-quarantine policy gate, so
 * flakiness-elimination.js is invoked with quarantineEnabled:false; the quarantine/waiver/
 * acceptance/certificate executors are guarded by approved === true and each has exactly ONE call
 * site; the timeline is accumulated in the ORCHESTRATOR only (agents never write it).
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../common-utilities/routed-gate-combinators.js';

import { process as testStrategyProcess } from './test-strategy.js';
import { process as shiftLeftProcess } from './shift-left-testing.js';
import { process as automationFrameworkProcess } from './automation-framework.js';
import { process as e2eSuiteProcess } from './e2e-test-suite.js';
import { process as apiTestingProcess } from './api-testing.js';
import { process as contractTestingProcess } from './contract-testing.js';
import { process as performanceTestingProcess } from './performance-testing.js';
import { process as securityTestingProcess } from './security-testing.js';
import { process as accessibilityTestingProcess } from './accessibility-testing.js';
import { process as crossBrowserTestingProcess } from './cross-browser-testing.js';
import { process as mobileTestingProcess } from './mobile-testing.js';
import { process as visualRegressionProcess } from './visual-regression.js';
import { process as mutationTestingProcess } from './mutation-testing.js';
import { process as environmentManagementProcess } from './environment-management.js';
import { process as testDataManagementProcess } from './test-data-management.js';
import { process as flakinessEliminationProcess } from './flakiness-elimination.js';
import { process as continuousTestingProcess } from './continuous-testing.js';
import { process as qualityGatesProcess } from './quality-gates.js';
import { process as metricsDashboardProcess } from './metrics-dashboard.js';

// ---------------------------------------------------------------------------
// Frozen tables + throwing lookups — no fallback policy, no default threshold
// ---------------------------------------------------------------------------

/** The five independent execution tiers. ctx.parallel.all fans out across these. */
export const TEST_TIERS = Object.freeze([
  'functional',
  'performance',
  'security',
  'compatibility',
  'experience',
]);

/**
 * Per-layer policy: which tier it executes in, which point process implements it, whether it
 * blocks the release, which threshold key scores it, which expert owns its waivers, and whether
 * the point process owns the AUTHORING pass (P2) as well as the EXECUTION pass (P4).
 * Lookup via layerPolicy(layerId, field) — unknown layer and unknown field both throw.
 */
export const TEST_LAYERS = Object.freeze({
  api: Object.freeze({
    tier: 'functional',
    composedProcess: apiTestingProcess,
    moduleName: 'api-testing.js',
    blocking: true,
    thresholdKey: 'apiPassRate',
    expert: 'qa-lead',
    authoringOwned: true,
  }),
  contract: Object.freeze({
    tier: 'functional',
    composedProcess: contractTestingProcess,
    moduleName: 'contract-testing.js',
    blocking: true,
    thresholdKey: 'contractPassRate',
    expert: 'qa-lead',
    authoringOwned: true,
  }),
  e2e: Object.freeze({
    tier: 'functional',
    composedProcess: e2eSuiteProcess,
    moduleName: 'e2e-test-suite.js',
    blocking: true,
    thresholdKey: 'e2ePassRate',
    expert: 'qa-lead',
    authoringOwned: true,
  }),
  performance: Object.freeze({
    tier: 'performance',
    composedProcess: performanceTestingProcess,
    moduleName: 'performance-testing.js',
    blocking: true,
    thresholdKey: 'p95LatencyMs',
    expert: 'engineering-manager',
    authoringOwned: false,
  }),
  security: Object.freeze({
    tier: 'security',
    composedProcess: securityTestingProcess,
    moduleName: 'security-testing.js',
    blocking: true,
    thresholdKey: 'maxOpenHighSecurityFindings',
    expert: 'security-lead',
    authoringOwned: false,
  }),
  accessibility: Object.freeze({
    tier: 'experience',
    composedProcess: accessibilityTestingProcess,
    moduleName: 'accessibility-testing.js',
    blocking: true,
    thresholdKey: 'a11yLevel',
    expert: 'security-lead',
    authoringOwned: false,
  }),
  'cross-browser': Object.freeze({
    tier: 'compatibility',
    composedProcess: crossBrowserTestingProcess,
    moduleName: 'cross-browser-testing.js',
    blocking: true,
    thresholdKey: 'compatPassRate',
    expert: 'qa-lead',
    authoringOwned: true,
  }),
  mobile: Object.freeze({
    tier: 'compatibility',
    composedProcess: mobileTestingProcess,
    moduleName: 'mobile-testing.js',
    blocking: true,
    thresholdKey: 'compatPassRate',
    expert: 'qa-lead',
    authoringOwned: true,
  }),
  visual: Object.freeze({
    tier: 'experience',
    composedProcess: visualRegressionProcess,
    moduleName: 'visual-regression.js',
    blocking: false,
    thresholdKey: 'maxVisualDiffs',
    expert: 'qa-lead',
    authoringOwned: true,
  }),
});

/** Every field a layer row exposes. layerPolicy throws on anything else. */
const TEST_LAYER_FIELDS = Object.freeze([
  'tier',
  'composedProcess',
  'moduleName',
  'blocking',
  'thresholdKey',
  'expert',
  'authoringOwned',
]);

/**
 * Default quality thresholds. p95LatencyMs is deliberately null: a performance budget cannot be
 * guessed, so inputs.thresholds MUST supply it and reading a null value THROWS.
 */
export const DEFAULT_THRESHOLDS = Object.freeze({
  lineCoverage: 80,
  branchCoverage: 70,
  mutationScore: 70,
  maxFlakinessRate: 2,
  apiPassRate: 100,
  contractPassRate: 100,
  e2ePassRate: 100,
  compatPassRate: 98,
  maxVisualDiffs: 0,
  maxOpenHighSecurityFindings: 0,
  a11yLevel: 'WCAG-2.2-AA',
  p95LatencyMs: null,
});

/**
 * The ONLY suite statuses. There is deliberately no 'skipped' or 'not-run': a suite that could
 * not run is recorded as 'failed' with executionError set. Coverage is only ever removed through
 * the release-quality.suite-quarantine policy gate, never by a status value.
 */
export const SUITE_STATUSES = Object.freeze(['passed', 'failed']);

/**
 * Layer-policy lookup. THROWS on unknown layer and on unknown field — no fallback layer policy
 * exists (fallbacks are forbidden).
 *
 * @param {string} layerId - A key of TEST_LAYERS
 * @param {string} field - One of TEST_LAYER_FIELDS
 * @returns {*} The frozen row's field value
 */
export function layerPolicy(layerId, field) {
  if (!Object.prototype.hasOwnProperty.call(TEST_LAYERS, layerId)) {
    throw new Error(
      `TEST_LAYERS: unknown layer '${layerId}'. Known layers: ${Object.keys(TEST_LAYERS).join(', ')} — ` +
      'no fallback layer policy exists.'
    );
  }
  if (!TEST_LAYER_FIELDS.includes(field)) {
    throw new Error(
      `TEST_LAYERS: unknown field '${field}' for layer '${layerId}'. ` +
      `Known fields: ${TEST_LAYER_FIELDS.join(', ')} — no fallback field value exists.`
    );
  }
  return TEST_LAYERS[layerId][field];
}

/**
 * Threshold lookup. THROWS on an unknown key (a typo'd threshold is how false greens ship) and
 * THROWS when the resolved value is null (an unset performance budget is never guessed).
 *
 * @param {string} key - A key of DEFAULT_THRESHOLDS
 * @param {object} [resolved=DEFAULT_THRESHOLDS] - The run's resolved threshold table
 * @returns {number|string} The threshold value
 */
export function thresholdFor(key, resolved = DEFAULT_THRESHOLDS) {
  if (!Object.prototype.hasOwnProperty.call(DEFAULT_THRESHOLDS, key)) {
    throw new Error(
      `DEFAULT_THRESHOLDS: unknown threshold key '${key}'. ` +
      `Known keys: ${Object.keys(DEFAULT_THRESHOLDS).join(', ')} — no fallback threshold exists.`
    );
  }
  const value = resolved[key];
  if (value === null || value === undefined) {
    throw new Error(
      `Threshold '${key}' is not set. It has no default and must be supplied via inputs.thresholds — ` +
      'a quality budget is never guessed.'
    );
  }
  return value;
}

/**
 * Layer-list assertion. THROWS on a non-array, an empty array, an unknown layer id, a duplicate,
 * or a layer outside the allowed set. Returns the list unchanged when valid.
 *
 * @param {string[]} layers - Candidate layer ids
 * @param {string} source - Where the list came from (for the error message)
 * @param {string[]} [allowed=Object.keys(TEST_LAYERS)] - The permitted layer ids
 * @returns {string[]} The validated list
 */
export function assertLayers(layers, source, allowed = Object.keys(TEST_LAYERS)) {
  if (!Array.isArray(layers) || layers.length === 0) {
    throw new Error(
      `${source}: expected a non-empty layer array (got ${JSON.stringify(layers)}) — ` +
      'a release with no test layers is untested, not defaulted.'
    );
  }
  const seen = new Set();
  for (const layer of layers) {
    if (!Object.prototype.hasOwnProperty.call(TEST_LAYERS, layer)) {
      throw new Error(
        `${source}: unknown layer '${layer}'. Known layers: ${Object.keys(TEST_LAYERS).join(', ')} — ` +
        'no fallback layer plan exists.'
      );
    }
    if (!allowed.includes(layer)) {
      throw new Error(
        `${source}: layer '${layer}' is outside the permitted set ${allowed.join(', ')} — ` +
        'the plan is rejected, never silently trimmed.'
      );
    }
    if (seen.has(layer)) {
      throw new Error(`${source}: duplicate layer '${layer}' — the plan is rejected, never de-duplicated.`);
    }
    seen.add(layer);
  }
  return layers;
}

/**
 * Suite-status assertion. THROWS on anything outside SUITE_STATUSES — in particular there is no
 * 'skipped' status, so a suite that could not run must be reported 'failed' with executionError.
 *
 * @param {string} status - Reported status
 * @param {string} layer - Layer the status came from
 * @returns {string} The validated status
 */
export function assertSuiteStatus(status, layer) {
  if (!SUITE_STATUSES.includes(status)) {
    throw new Error(
      `Suite status '${status}' from layer '${layer}' is unknown — expected ${SUITE_STATUSES.join('|')}. ` +
      'There is deliberately no skipped/not-run status: a suite that cannot run is failed with ' +
      'executionError, never skipped-and-passed.'
    );
  }
  return status;
}

/**
 * Group a layer plan into the tiers that will execute in parallel. Only tiers with at least one
 * planned layer appear. THROWS on a layer whose tier is not a known tier (an unreachable state
 * that would otherwise silently drop a suite).
 *
 * @param {string[]} layerPlan - Validated layer ids
 * @returns {Array<{ tier: string, layers: string[] }>} Tier groups in TEST_TIERS order
 */
export function tierPlan(layerPlan) {
  const groups = new Map();
  for (const layer of layerPlan) {
    const tier = layerPolicy(layer, 'tier');
    if (!TEST_TIERS.includes(tier)) {
      throw new Error(
        `TEST_LAYERS: layer '${layer}' declares unknown tier '${tier}'. ` +
        `Known tiers: ${TEST_TIERS.join(', ')} — no fallback tier exists.`
      );
    }
    if (!groups.has(tier)) groups.set(tier, []);
    groups.get(tier).push(layer);
  }
  return TEST_TIERS.filter((tier) => groups.has(tier)).map((tier) => ({ tier, layers: groups.get(tier) }));
}

// ---------------------------------------------------------------------------
// P1 — risk profile + coverage/gap analysis
// ---------------------------------------------------------------------------

export const riskProfileTask = defineTask('rqa.risk-profile', (args, taskCtx) => ({
  kind: 'agent',
  title: `Risk-based test profile for ${args.serviceName}@${args.version}`,
  agent: {
    name: 'qa-strategist',
    prompt: {
      role: 'Risk-based test strategist',
      task: 'Rank the change surface by risk and decide which test layers this release actually needs',
      context: args,
      instructions: [
        'Rank every changeManifest area by blast radius x change size x prior-defect density, using priorKnowledge from kip.',
        'Select the TEST_LAYERS entries this release actually needs and justify every layer you EXCLUDE — an unjustified exclusion is a coverage hole, not an optimization.',
        `layerPlan must be a non-empty subset of the permitted layers in context (${args.permittedLayers.join(', ')}); an id outside that set is rejected by the orchestrator, never trimmed.`,
        'Cite the composed test-strategy and shift-left outputs by file:line or section id.',
        'IRON LAW: an adversarial gate will independently re-open and re-run the work grounded in this profile — do not assert a risk ranking you cannot point at.',
        'Evidence entries must cite the strategy/shift-left artifacts behind the ranking — at least one entry.',
      ],
      outputFormat: 'JSON with riskAreas array, layerPlan array of layer ids, exclusions array [{ layer, justification }], strategyPath string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['riskAreas', 'layerPlan', 'exclusions', 'strategyPath', 'evidence'],
      properties: {
        riskAreas: { type: 'array', minItems: 1 },
        layerPlan: { type: 'array', minItems: 1, items: { type: 'string' } },
        exclusions: { type: 'array' },
        strategyPath: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rqa', 'qa', 'strategy'],
}));

export const coverageGapAnalysisTask = defineTask('rqa.coverage-gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Coverage and gap analysis for ${args.serviceName}@${args.version}`,
  agent: {
    name: 'coverage-analyst',
    prompt: {
      role: 'Coverage and gap analyst',
      task: 'Measure coverage by RUNNING the tooling and map every high-risk area to the tests that assert it',
      context: args,
      instructions: [
        'IRON LAW: run the coverage tooling yourself and paste the raw summary; never quote a stored coverage badge or a previous report.',
        'Map every high-risk area from riskAreas to the tests that actually assert it; an area with tests that only import the module is UNCOVERED.',
        'Report lineCoverage and branchCoverage as measured numbers and list gaps as [{ area, reason, suggestedLayer }].',
        `The release thresholds in context are the bar (lineCoverage ${args.lineCoverageThreshold}, branchCoverage ${args.branchCoverageThreshold}); report the measured numbers honestly even when they miss the bar.`,
        'IRON LAW: an adversarial gate will independently re-run this measurement — a number you cannot reproduce is a finding against you.',
        'Evidence entries must be the raw coverage command output — at least one entry.',
      ],
      outputFormat: 'JSON with lineCoverage number, branchCoverage number, gaps array, uncoveredRiskAreas array, command string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['lineCoverage', 'branchCoverage', 'gaps', 'uncoveredRiskAreas', 'command', 'evidence'],
      properties: {
        lineCoverage: { type: 'number' },
        branchCoverage: { type: 'number' },
        gaps: { type: 'array' },
        uncoveredRiskAreas: { type: 'array' },
        command: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rqa', 'qa', 'coverage'],
}));

// ---------------------------------------------------------------------------
// P2 — suite authoring (one lane per planned layer)
// ---------------------------------------------------------------------------

export const suiteAuthoringTask = defineTask('rqa.suite-authoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Author ${args.layer} suite for ${args.releaseQualityId}`,
  agent: {
    name: 'test-automation-engineer',
    prompt: {
      role: 'Test suite author',
      task: `Author or extend the ${args.layer} suite so every assigned gap has a test that can fail`,
      context: args,
      instructions: [
        'Author or extend the suite for this layer so that every assigned gap has a test that FAILS when the behavior is broken.',
        'Run the new tests once against a deliberately broken expectation to prove they can fail, and paste that output.',
        'List filesChanged and the stable test ids you created — the false-green critic will cite them.',
        `The point process that owns this layer is ${args.moduleName}; align the suite with its structure and conventions.`,
        'IRON LAW: an adversarial false-green gate will independently re-run these tests under mutation — a test that cannot go red is worse than no test.',
        'Evidence entries must include the proof-of-failure run output — at least one entry.',
      ],
      outputFormat: 'JSON with layer string, suitesAuthored array, testIds array, filesChanged array, proofOfFailureExcerpt string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['layer', 'suitesAuthored', 'testIds', 'filesChanged', 'proofOfFailureExcerpt', 'evidence'],
      properties: {
        layer: { type: 'string' },
        suitesAuthored: { type: 'array' },
        testIds: { type: 'array' },
        filesChanged: { type: 'array' },
        proofOfFailureExcerpt: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rqa', 'qa', 'authoring'],
}));

// ---------------------------------------------------------------------------
// P3 — environment + test-data fidelity verification and dossier
// ---------------------------------------------------------------------------

export const environmentVerificationTask = defineTask('rqa.environment-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify environment parity for ${args.targetEnv} vs ${args.parityBaseline}`,
  agent: {
    name: 'test-environment-engineer',
    prompt: {
      role: 'Environment parity verifier',
      task: 'EXECUTE health/readiness checks and measure parity against the production baseline',
      context: args,
      instructions: [
        'Execute health and readiness checks against the provisioned environment; paste the raw output.',
        'Diff the environment against the production parityBaseline: service versions, feature flags, config, dependency stubs vs real dependencies, data volume class.',
        'Report parityScore with the per-dimension breakdown; a dimension you could not measure is a FAILURE to report, not an assumed match.',
        'IRON LAW: an adversarial environment-parity critic will re-run these checks against the live environment — a claimed match you did not measure will be found.',
        'Evidence entries must be raw command outputs from checks you ran in THIS task — at least one entry.',
      ],
      outputFormat: 'JSON with provisioned boolean, envRef string, parityScore number, dimensions array [{ name, matches, detail }], evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['provisioned', 'envRef', 'parityScore', 'dimensions', 'evidence'],
      properties: {
        provisioned: { type: 'boolean' },
        envRef: { type: 'string' },
        parityScore: { type: 'number' },
        dimensions: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['name', 'matches', 'detail'] },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rqa', 'qa', 'environment'],
}));

export const testDataVerificationTask = defineTask('rqa.test-data-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify test-data fidelity in ${args.targetEnv}`,
  agent: {
    name: 'test-data-engineer',
    prompt: {
      role: 'Test-data fidelity verifier',
      task: 'PROBE the seeded data and prove it exercises more than the happy path',
      context: args,
      instructions: [
        'Probe the seeded data: row counts, key distributions, edge-case rows (nulls, unicode, boundary amounts), and PII masking.',
        'Prove referential integrity by executing at least one join/lookup probe per critical entity and pasting the output.',
        'Report dataFidelity with the entities that are thin or synthetic-only — a suite that only ever sees happy-path fixtures is a false-green factory.',
        'IRON LAW: an adversarial test-data critic will re-query this data itself — a reported row count you did not measure will be found.',
        'Evidence entries must be the exact query plus its output — at least one entry.',
      ],
      outputFormat: 'JSON with dataFidelity number, entities array [{ name, rows, edgeCasesPresent, masked }], gaps array, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['dataFidelity', 'entities', 'gaps', 'evidence'],
      properties: {
        dataFidelity: { type: 'number' },
        entities: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['name', 'rows', 'edgeCasesPresent', 'masked'] },
        },
        gaps: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rqa', 'qa', 'test-data'],
}));

export const fidelityReportTask = defineTask('rqa.fidelity-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Write environment+data fidelity dossier for ${args.releaseQualityId}`,
  agent: {
    name: 'quality-analyst',
    prompt: {
      role: 'Fidelity dossier writer',
      task: 'Write the machine-readable environment + test-data fidelity dossier',
      context: args,
      instructions: [
        `Write the machine-readable environment+data fidelity dossier to ${args.fidelityReportPath} and report that exact path back as fidelityReportPath.`,
        'Include every executed command and every measured dimension so a critic can re-run them verbatim.',
        'IRON LAW: two adversarial critics will re-execute everything in this dossier — do not restate a claim the verification tasks did not measure.',
      ],
      outputFormat: 'JSON with fidelityReportPath string, summary string',
    },
    outputSchema: {
      type: 'object',
      required: ['fidelityReportPath', 'summary'],
      properties: {
        fidelityReportPath: { type: 'string' },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rqa', 'qa', 'report'],
}));

// ---------------------------------------------------------------------------
// P4 — suite execution (one per layer, inside its tier)
// ---------------------------------------------------------------------------

export const suiteExecutionTask = defineTask('rqa.suite-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute ${args.layer} suite (${args.tier} tier) for ${args.releaseQualityId}`,
  agent: {
    name: 'test-runner',
    prompt: {
      role: 'Suite executor',
      task: `Execute the ${args.layer} suite against the verified environment and report executed results`,
      context: args,
      instructions: [
        'Execute the suite for this layer against the verified environment and report the exact command and raw output excerpt.',
        "status MUST be 'passed' or 'failed'. There is no skipped status: if the suite cannot run (missing binary, env error, timeout) report status 'failed' with executionError describing the blocker.",
        'List failingTestIds with stable ids; a failure count without ids is unusable for defect routing and will be rejected.',
        'Never mark a suite green because a previous run was green.',
        'IRON LAW: an adversarial false-green gate will re-run this suite and inject a mutation — a green that survives a broken behavior is a gate failure.',
        'Evidence entries must be raw command output from THIS execution — at least one entry.',
      ],
      outputFormat: "JSON with layer string, status string ('passed'|'failed'), passedCount number, failedCount number, failingTestIds array, command string, outputExcerpt string, executionError string|null, evidence array (minItems 1)",
    },
    outputSchema: {
      type: 'object',
      required: ['layer', 'status', 'passedCount', 'failedCount', 'failingTestIds', 'command', 'outputExcerpt', 'executionError', 'evidence'],
      properties: {
        layer: { type: 'string' },
        status: { type: 'string', enum: ['passed', 'failed'] },
        passedCount: { type: 'number' },
        failedCount: { type: 'number' },
        failingTestIds: { type: 'array' },
        command: { type: 'string' },
        outputExcerpt: { type: 'string' },
        executionError: { type: ['string', 'null'] },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rqa', 'qa', 'execution'],
}));

// ---------------------------------------------------------------------------
// P6 — depth dossier (mutation + flakiness + execution rows)
// ---------------------------------------------------------------------------

export const depthReportTask = defineTask('rqa.depth-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Write depth dossier for ${args.releaseQualityId}`,
  agent: {
    name: 'quality-analyst',
    prompt: {
      role: 'Depth dossier writer',
      task: 'Write the mutation + flakiness + execution depth dossier',
      context: args,
      instructions: [
        `Write the depth dossier (mutation score, survived mutants with file:line, flakiness rate, flaky test ids, per-suite execution rows) to ${args.depthReportPath} and report that exact path back as depthReportPath.`,
        'Every row must carry the command that produced it so a critic can replay it.',
        'IRON LAW: an adversarial false-green gate will re-run the suites and reconcile every survived mutant in this dossier — do not smooth a number.',
      ],
      outputFormat: 'JSON with depthReportPath string, mutationScore number, flakinessRate number, survivedMutants array, flakyTestIds array',
    },
    outputSchema: {
      type: 'object',
      required: ['depthReportPath', 'mutationScore', 'flakinessRate', 'survivedMutants', 'flakyTestIds'],
      properties: {
        depthReportPath: { type: 'string' },
        mutationScore: { type: 'number' },
        flakinessRate: { type: 'number' },
        survivedMutants: { type: 'array' },
        flakyTestIds: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rqa', 'qa', 'report'],
}));

// ---------------------------------------------------------------------------
// P7 — defect routing, waiver dossier, and the three guarded policy executors
// ---------------------------------------------------------------------------

export const defectRoutingTask = defineTask('rqa.defect-routing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Route defects for ${args.releaseQualityId}`,
  agent: {
    name: 'defect-triage-lead',
    prompt: {
      role: 'Defect router',
      task: 'Turn every failing test and every survived mutant into a routed defect',
      context: args,
      instructions: [
        'Turn every failingTestId and every survived mutant into a defect with severity and an owning role.',
        'Cluster duplicates by root cause but never drop a failing test id — every id must appear in exactly one defect.',
        'Severity rules: a failing blocking-layer test or an open high security finding is release-blocking; say so explicitly.',
        'Evidence entries must cite the executed suite output or mutant file:line behind each defect — at least one entry.',
      ],
      outputFormat: 'JSON with defects array [{ defectId, layer, testId, severity, owner, routedTo, ticketRef }], blockingDefectIds array, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['defects', 'blockingDefectIds', 'evidence'],
      properties: {
        defects: {
          type: 'array',
          items: { type: 'object', required: ['defectId', 'layer', 'testId', 'severity', 'owner', 'routedTo'] },
        },
        blockingDefectIds: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rqa', 'qa', 'defects'],
}));

export const waiverDossierTask = defineTask('rqa.waiver-dossier', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prepare waiver/quarantine/acceptance requests for ${args.releaseQualityId}`,
  agent: {
    name: 'quality-analyst',
    prompt: {
      role: 'Waiver and quarantine dossier preparer',
      task: 'Turn every threshold breach, flaky test, and open finding into an explicit, evidence-carrying request',
      context: args,
      instructions: [
        'For every threshold breach produce a waiver request: thresholdKey, measured value, required value, blast radius, and what coverage the release loses if waived.',
        'For every flaky test propose a quarantine request with the test ids, the observed flake rate, and the coverage that quarantining REMOVES.',
        'For every open high security or accessibility finding produce an acceptance request with the exploit/impact path.',
        'You prepare requests only. You never quarantine, waive, or accept — those are gated actions executed after approval.',
        'A prior waiver in priorKnowledge that has EXPIRED is a blocker, not a precedent — say so explicitly in the request.',
        'Evidence entries must cite the measurement behind each request — at least one entry.',
      ],
      outputFormat: 'JSON with waiverRequests array, quarantineRequests array, acceptanceRequests array, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['waiverRequests', 'quarantineRequests', 'acceptanceRequests', 'evidence'],
      properties: {
        waiverRequests: { type: 'array' },
        quarantineRequests: { type: 'array' },
        acceptanceRequests: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rqa', 'qa', 'waiver'],
}));

export const executeQuarantineTask = defineTask('rqa.execute-quarantine', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved quarantine for ${args.releaseQualityId}`,
  agent: {
    name: 'test-automation-engineer',
    prompt: {
      role: 'Quarantine executor',
      task: 'Quarantine exactly the approved test ids and record the approval provenance',
      context: args,
      instructions: [
        'This task only ever runs AFTER the release-quality.suite-quarantine policy gate approved these exact test ids in context.',
        'Quarantine exactly the approved test ids and no others.',
        'Record the approver, the approval provenance (human or autoApproved), the expiry, and the tracking defect id in the quarantine registry file.',
        'Report the coverage removed so the go/no-go payload can show it.',
        'Evidence entries must be the raw registry write / config change output — at least one entry.',
      ],
      outputFormat: 'JSON with quarantined array, registryPath string, coverageRemoved array, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['quarantined', 'registryPath', 'coverageRemoved', 'evidence'],
      properties: {
        quarantined: { type: 'array' },
        registryPath: { type: 'string' },
        coverageRemoved: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rqa', 'qa', 'policy-executor'],
}));

export const executeWaiverTask = defineTask('rqa.execute-waiver', (args, taskCtx) => ({
  kind: 'agent',
  title: `Record approved threshold waivers for ${args.releaseQualityId}`,
  agent: {
    name: 'quality-analyst',
    prompt: {
      role: 'Threshold-waiver executor',
      task: 'Record each approved threshold waiver against this release id',
      context: args,
      instructions: [
        'This task only ever runs AFTER the release-quality.coverage-threshold-waiver policy gate approved these exact requests in context.',
        'Record the approved waiver against the named thresholdKey with approver, rationale, measured-vs-required values, and expiry.',
        'Waivers are scoped to THIS release id; never edit the threshold table or the gate config.',
        'Evidence entries must be the raw registry write output — at least one entry.',
      ],
      outputFormat: 'JSON with waivers array, registryPath string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['waivers', 'registryPath', 'evidence'],
      properties: {
        waivers: { type: 'array' },
        registryPath: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rqa', 'qa', 'policy-executor'],
}));

export const executeFindingAcceptanceTask = defineTask('rqa.execute-finding-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: `Record accepted findings for ${args.releaseQualityId}`,
  agent: {
    name: 'quality-analyst',
    prompt: {
      role: 'Known-issue acceptance executor',
      task: 'Record each accepted security/accessibility finding as a known issue',
      context: args,
      instructions: [
        'This task only ever runs AFTER the release-quality.security-finding-acceptance policy gate approved these exact findings in context.',
        'Record each accepted security/accessibility finding as a known issue with approver, rationale, compensating control, and review date.',
        'Never close, downgrade, or delete the underlying finding — acceptance is a record, not a fix.',
        'Evidence entries must be the raw registry write output — at least one entry.',
      ],
      outputFormat: 'JSON with accepted array, registryPath string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['accepted', 'registryPath', 'evidence'],
      properties: {
        accepted: { type: 'array' },
        registryPath: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rqa', 'qa', 'policy-executor'],
}));

// ---------------------------------------------------------------------------
// P8/P9 — verdict, guarded certificate, final report
// ---------------------------------------------------------------------------

export const qualityVerdictTask = defineTask('rqa.quality-verdict', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compile release quality verdict for ${args.releaseQualityId}`,
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'Release quality verdict compiler',
      task: 'Compute the blocking-layer verdict from executed results plus APPROVED waivers only',
      context: args,
      instructions: [
        'Compute per-blocking-layer pass/fail from EXECUTED results plus APPROVED waivers only — an unapproved breach is a fail.',
        'State the residual risk in one paragraph the sign-off owner can act on: what is untested, what is quarantined, what is waived and until when.',
        'Recommend go or no-go and say which single fact would flip your recommendation.',
        'Evidence entries must cite the executed suite results and approval records behind the verdict — at least one entry.',
      ],
      outputFormat: "JSON with blockingLayerResults array [{ layer, passed, detail }], recommendation string ('go'|'no-go'), residualRisk string, unresolvedBlockers array, evidence array (minItems 1)",
    },
    outputSchema: {
      type: 'object',
      required: ['blockingLayerResults', 'recommendation', 'residualRisk', 'unresolvedBlockers', 'evidence'],
      properties: {
        blockingLayerResults: {
          type: 'array',
          items: { type: 'object', required: ['layer', 'passed', 'detail'] },
        },
        recommendation: { type: 'string', enum: ['go', 'no-go'] },
        residualRisk: { type: 'string' },
        unresolvedBlockers: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rqa', 'qa', 'verdict'],
}));

export const certificateTask = defineTask('rqa.quality-certificate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Write release quality certificate for ${args.releaseQualityId}`,
  agent: {
    name: 'quality-assessor',
    prompt: {
      role: 'Release quality certificate writer',
      task: 'Write the self-contained release quality certificate consumed by release-lifecycle',
      context: args,
      instructions: [
        `Write the release quality certificate to ${args.certificatePath} and report that exact path back as certificatePath.`,
        'The certificate records: release id, version, per-layer executed results with commands, mutation score, flakiness rate, both gate verdicts, every waiver/quarantine/acceptance with its approver, and the sign-off record.',
        'This certificate is consumed by release-engineering/release-lifecycle.js as a readiness input — it must be self-contained and cite executed evidence only.',
        'Do NOT describe deployment, rollout stages, or rollback: those belong to release-lifecycle.js, not to this certificate.',
      ],
      outputFormat: 'JSON with certificatePath string, summary string',
    },
    outputSchema: {
      type: 'object',
      required: ['certificatePath', 'summary'],
      properties: {
        certificatePath: { type: 'string' },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rqa', 'qa', 'certificate'],
}));

export const finalReportTask = defineTask('rqa.final-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Write release quality run report for ${args.releaseQualityId}`,
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical writer',
      task: 'Write the markdown release quality run report',
      context: args,
      instructions: [
        `Write the markdown run report to ${args.reportPath} and report that exact path back as reportPath.`,
        'Cover: strategy, coverage gaps, per-tier execution, depth analysis, both gate verdicts with evidence refs, defects, waivers/quarantines with approvers, and the go/no-go decision.',
        'Link every claim to a task result or an artifact path; a no-go report is written in exactly the same detail as a go.',
        'The orchestrator timeline in context is ground truth — do not restate an event that is not in it.',
      ],
      outputFormat: 'JSON with reportPath string, summary string',
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'summary'],
      properties: {
        reportPath: { type: 'string' },
        summary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'rqa', 'qa', 'report'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    release,
    environment,
    thresholds: thresholdOverrides = {},
    layersOverride = null,
    maxFixAttempts = 2,
    maxParallelSuites = 4,
    quarantineAutoApproveAfterN = 3,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
    artifactsDir,
  } = inputs || {};

  // -------------------------------------------------------------------------
  // Input validation — no fallbacks: unknown/missing values THROW.
  // -------------------------------------------------------------------------
  if (!release || !release.serviceName || !release.version) {
    throw new Error(
      'release-quality-assurance-workflow requires release { serviceName, version } — ' +
      'refusing to guess missing fields.'
    );
  }
  const serviceName = release.serviceName;
  const version = release.version;
  const repoRoot = release.repoRoot ?? '.';
  const baseRef = release.baseRef ?? null;
  const changeManifest = release.changeManifest;
  if (!Array.isArray(changeManifest) || changeManifest.length === 0) {
    throw new Error(
      'release.changeManifest must be a non-empty array — an empty change manifest means there is ' +
      'nothing to risk-rank; no manifest is synthesized.'
    );
  }
  for (const entry of changeManifest) {
    if (!entry || !entry.area) {
      throw new Error(
        `release.changeManifest entries require { area } (got ${JSON.stringify(entry)}) — ` +
        'no fallback area name exists.'
      );
    }
  }
  if (!environment || !environment.targetEnv || !environment.platform || !environment.parityBaseline) {
    throw new Error(
      'release-quality-assurance-workflow requires environment { targetEnv, platform, parityBaseline } — ' +
      'parity cannot be measured against a guessed baseline.'
    );
  }

  // Threshold resolution: an unknown override key THROWS (a typo'd threshold is how false
  // greens ship), and p95LatencyMs must be supplied because the table value is null.
  if (thresholdOverrides === null || typeof thresholdOverrides !== 'object' || Array.isArray(thresholdOverrides)) {
    throw new Error(
      `inputs.thresholds must be an object of known threshold keys (got ${JSON.stringify(thresholdOverrides)}).`
    );
  }
  for (const key of Object.keys(thresholdOverrides)) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_THRESHOLDS, key)) {
      throw new Error(
        `inputs.thresholds: unknown threshold key '${key}'. ` +
        `Known keys: ${Object.keys(DEFAULT_THRESHOLDS).join(', ')} — an unrecognized threshold is rejected, never ignored.`
      );
    }
  }
  const thresholds = Object.freeze({ ...DEFAULT_THRESHOLDS, ...thresholdOverrides });
  if (thresholds.p95LatencyMs === null || thresholds.p95LatencyMs === undefined) {
    throw new Error(
      'thresholds.p95LatencyMs is required: the table value is deliberately null because a ' +
      'performance budget cannot be guessed. Supply it via inputs.thresholds.'
    );
  }

  const permittedLayers = layersOverride === null
    ? Object.keys(TEST_LAYERS)
    : assertLayers(layersOverride, 'inputs.layersOverride');

  const artifactsRoot = artifactsDir ?? ctx.artifactsDir;
  const releaseQualityId = `rqa-${serviceName}-${version}`;
  const nowIso = () => new Date().toISOString();

  // Timeline is accumulated HERE, in the orchestrator — agents never write it, so the report and
  // the certificate have ground truth to diff against.
  const timeline = [];
  const breakpointsHit = [];
  // ALWAYS present in outputs (possibly empty): every harness-level auto-approval of a policy
  // gate is surfaced here — fail-closed posture, nothing auto-approves silently.
  const autoApprovals = [];

  const recordGate = (breakpointId, phase, result) => {
    breakpointsHit.push(breakpointId);
    const auto = result && (
      result.autoApproved === true ||
      result.autoApprove === true ||
      (result.metadata && result.metadata.autoApproved === true)
    );
    if (auto) {
      autoApprovals.push({ breakpointId, phase, at: nowIso() });
    }
    return result;
  };
  const isAutoApproved = (result) => Boolean(result && (
    result.autoApproved === true ||
    result.autoApprove === true ||
    (result.metadata && result.metadata.autoApproved === true)
  ));

  // Mutable run state referenced by buildResult (terminal returns carry full state).
  let strategyOut = { strategyPath: null, riskAreas: [], layerPlan: [], shiftLeftFindings: [] };
  let coverageOut = null;
  const authoringOut = [];
  let environmentOut = null;
  let executionOut = { tiers: {}, suites: [] };
  let depthOut = null;
  const gateResults = { envDataFidelity: null, falseGreen: null };
  let defectsOut = [];
  const waiversOut = [];
  const quarantinesOut = [];
  const acceptedFindingsOut = [];
  let goNoGoOut = { approved: false, decision: 'no-go', decidedBy: null, response: null, at: null, certificatePath: null };
  let kipFactsAsserted = 0;
  const artifacts = [];

  const buildResult = (success, reason) => ({
    success,
    releaseQualityId,
    strategy: strategyOut,
    coverage: coverageOut,
    authoring: authoringOut,
    environment: environmentOut,
    execution: executionOut,
    depth: depthOut,
    gateResults,
    defects: defectsOut,
    waivers: waiversOut,
    quarantines: quarantinesOut,
    acceptedFindings: acceptedFindingsOut,
    goNoGo: goNoGoOut,
    autoApprovals,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'qa-testing-automation/release-quality-assurance-workflow',
      runId: ctx.runId,
      breakpointsHit,
      timeline,
      ...(reason ? { reason } : {}),
    },
  });

  // -------------------------------------------------------------------------
  // P0 — kip recall of prior release-quality memory
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P0: kip recall of prior release-quality memory');
  let priorKnowledge = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  if (kipEnabled) {
    // A fresh store (factCount 0, storeInitialized true) is a fresh brain, never an error.
    priorKnowledge = await kipRecall(ctx, {
      kipDir,
      kipModel,
      kind: 'release-quality',
      topic: `release quality signature: ${serviceName}@${version}`,
    });
    timeline.push({ at: nowIso(), event: 'kip-recall', detail: `factCount=${priorKnowledge.factCount}` });
  }

  // -------------------------------------------------------------------------
  // P1 — risk-based strategy + shift-left findings (parallel), then coverage
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P1: risk-based strategy + shift-left findings (parallel)');
  const [strategyRun, shiftLeftRun] = await ctx.parallel.all([
    () => testStrategyProcess({
      projectName: serviceName,
      requirements: changeManifest,
      constraints: thresholds,
      outputDir: `${artifactsRoot}/${releaseQualityId}/test-strategy`,
      targetTestCoverage: thresholdFor('lineCoverage', thresholds),
    }, ctx),
    () => shiftLeftProcess({
      projectPath: repoRoot,
      qualityTargets: {
        defectReduction: 50,
        testCoverage: thresholdFor('lineCoverage', thresholds),
        earlyDetection: 70,
      },
      currentWorkflow: { changeManifest, baseRef },
    }, ctx),
  ]);
  timeline.push({ at: nowIso(), event: 'strategy-strands', detail: 'test-strategy + shift-left complete' });

  const riskProfile = await ctx.task(riskProfileTask, {
    releaseQualityId,
    serviceName,
    version,
    repoRoot,
    baseRef,
    changeManifest,
    permittedLayers,
    thresholds,
    strategyRun,
    shiftLeftRun,
    priorKnowledge,
  });
  const layerPlan = assertLayers(riskProfile.layerPlan, 'rqa.risk-profile layerPlan', permittedLayers);
  strategyOut = {
    strategyPath: riskProfile.strategyPath,
    riskAreas: riskProfile.riskAreas,
    layerPlan,
    shiftLeftFindings: shiftLeftRun,
  };
  artifacts.push(riskProfile.strategyPath);
  timeline.push({ at: nowIso(), event: 'risk-profile', detail: `layerPlan=${layerPlan.join(',')} exclusions=${riskProfile.exclusions.length}` });

  const coverage = await ctx.task(coverageGapAnalysisTask, {
    releaseQualityId,
    serviceName,
    version,
    repoRoot,
    riskAreas: riskProfile.riskAreas,
    layerPlan,
    lineCoverageThreshold: thresholdFor('lineCoverage', thresholds),
    branchCoverageThreshold: thresholdFor('branchCoverage', thresholds),
    priorKnowledge,
  });
  coverageOut = {
    lineCoverage: coverage.lineCoverage,
    branchCoverage: coverage.branchCoverage,
    gaps: coverage.gaps,
    uncoveredRiskAreas: coverage.uncoveredRiskAreas,
    evidence: coverage.evidence,
  };
  timeline.push({ at: nowIso(), event: 'coverage-analysis', detail: `line=${coverage.lineCoverage} branch=${coverage.branchCoverage} gaps=${coverage.gaps.length}` });

  // -------------------------------------------------------------------------
  // P2 — framework readiness (shared, sequential) + per-layer suite authoring
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P2: automation framework readiness + suite authoring');
  const framework = await automationFrameworkProcess({
    projectName: serviceName,
    techStack: environment.platform,
    testTypes: layerPlan,
    environmentDetails: environment,
    parallelExecution: true,
    outputDir: `${artifactsRoot}/${releaseQualityId}/automation-framework`,
  }, ctx);
  timeline.push({ at: nowIso(), event: 'automation-framework', detail: 'shared framework scaffolding ready' });

  const authoringResults = await ctx.parallel.map(
    layerPlan,
    async (layer) => {
      const gaps = coverage.gaps.filter((gap) => gap && gap.suggestedLayer === layer);
      const authored = await ctx.task(suiteAuthoringTask, {
        releaseQualityId,
        layer,
        tier: layerPolicy(layer, 'tier'),
        moduleName: layerPolicy(layer, 'moduleName'),
        gaps,
        repoRoot,
        environment,
        framework,
        priorKnowledge,
      });
      // The point process owns authoring for these layers; for the rest authoring is the
      // agent task above and the point process runs in the P4 execution pass instead.
      if (layerPolicy(layer, 'authoringOwned') === true) {
        await layerPolicy(layer, 'composedProcess')({
          projectName: serviceName,
          appName: serviceName,
          projectPath: repoRoot,
          applicationUrl: environment.targetEnv,
          baseUrl: environment.targetEnv,
          environmentType: environment.targetEnv,
          environmentDetails: environment,
          outputDir: `${artifactsRoot}/${releaseQualityId}/authoring/${layer}`,
        }, ctx);
      }
      return authored;
    },
    { maxConcurrency: maxParallelSuites }
  );
  for (const authored of authoringResults) {
    authoringOut.push({
      layer: authored.layer,
      suitesAuthored: authored.suitesAuthored,
      filesChanged: authored.filesChanged,
      evidence: authored.evidence,
    });
  }
  timeline.push({ at: nowIso(), event: 'suite-authoring', detail: `${authoringOut.length} layer(s) authored` });

  // -------------------------------------------------------------------------
  // P3 — environment + test-data provisioning, then ADVERSARIAL GATE #1
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P3: environment + test-data provisioning');
  const [envProvisioning, dataProvisioning] = await ctx.parallel.all([
    () => environmentManagementProcess({
      projectName: serviceName,
      infrastructurePlatform: environment.platform,
      applicationArchitecture: { parityBaseline: environment.parityBaseline },
      environments: [environment.targetEnv],
    }, ctx),
    () => testDataManagementProcess({
      projectName: serviceName,
      environments: [environment.targetEnv],
      testTypes: layerPlan,
      outputDir: `${artifactsRoot}/${releaseQualityId}/test-data`,
    }, ctx),
  ]);
  timeline.push({ at: nowIso(), event: 'provisioning', detail: 'environment + test-data strands complete' });

  const envVerification = await ctx.task(environmentVerificationTask, {
    releaseQualityId,
    serviceName,
    version,
    targetEnv: environment.targetEnv,
    platform: environment.platform,
    parityBaseline: environment.parityBaseline,
    provisioning: envProvisioning,
    layerPlan,
  });
  const dataVerification = await ctx.task(testDataVerificationTask, {
    releaseQualityId,
    serviceName,
    targetEnv: environment.targetEnv,
    provisioning: dataProvisioning,
    layerPlan,
  });
  const fidelityReport = await ctx.task(fidelityReportTask, {
    releaseQualityId,
    fidelityReportPath: `${artifactsRoot}/fidelity-${releaseQualityId}.json`,
    envVerification,
    dataVerification,
    environment,
  });
  artifacts.push(fidelityReport.fidelityReportPath);
  environmentOut = {
    provisioned: envVerification.provisioned === true,
    envRef: envVerification.envRef,
    parityScore: envVerification.parityScore,
    dataFidelity: dataVerification.dataFidelity,
    fidelityGate: null,
  };
  timeline.push({ at: nowIso(), event: 'fidelity-dossier', detail: `parityScore=${envVerification.parityScore} dataFidelity=${dataVerification.dataFidelity} -> ${fidelityReport.fidelityReportPath}` });

  ctx.log?.('info', 'P3: adversarial gate qa.env-data-fidelity');
  const fidelityGate = await adversarialGate(ctx, {
    gateId: 'qa.env-data-fidelity',
    artifact: {
      path: fidelityReport.fidelityReportPath,
      description: 'Environment parity + test-data fidelity dossier',
    },
    critics: [
      {
        name: 'environment-parity-critic',
        role: 'Adversarial environment-parity gatekeeper',
        focus: 'prove the test environment can actually reveal production defects',
        instructions: [
          'IRON LAW: EXECUTE. Run the health checks and at least one real request against the provisioned environment yourself; a verdict derived from reading the dossier is invalid.',
          'Verify each claimed parity dimension against the live environment: service versions, feature-flag values, config, whether dependencies are real or stubbed, data volume class.',
          'Deliberately probe for the classic lies: a stubbed dependency reported as real, a flag on in prod and off here, a single-node topology standing in for a cluster.',
          'Cite file:line for config claims and the raw command output for live claims. An unmeasurable dimension is an ISSUE, never an assumed match.',
          'Return your verdict as JSON with EXACTLY these keys and nothing else, as the LAST thing you output: {"passed": boolean, "issues": [{"severity": string, "description": string, "location": string}], "evidence": [string]}. passed:true with an empty evidence array is rejected by the orchestrator.',
        ],
      },
      {
        name: 'test-data-fidelity-critic',
        role: 'Adversarial test-data gatekeeper',
        focus: 'prove the seeded data exercises more than the happy path',
        instructions: [
          'IRON LAW: EXECUTE. Query the seeded data yourself and paste the results; do not trust the reported row counts.',
          'Check for edge cases the suites claim to cover: nulls, unicode, boundary amounts, timezone edges, soft-deleted rows, referential orphans.',
          'Verify PII masking on any production-derived data and report any leak as a blocking issue.',
          'Cite the exact query and its output for every claim; entity names alone are not evidence.',
          'Return your verdict as JSON with EXACTLY these keys and nothing else, as the LAST thing you output: {"passed": boolean, "issues": [{"severity": string, "description": string, "location": string}], "evidence": [string]}. passed:true with an empty evidence array is rejected by the orchestrator.',
        ],
      },
    ],
    ironLaw: [
      'EXECUTED EVIDENCE ONLY: every claim must come from a command YOU ran in this attempt, quoted with its raw output. Reading the dossier, the provisioning logs, or a prior run\'s report is NOT evidence.',
      "A dimension or entity you could not measure is an issue with severity 'unverifiable' — never an assumed pass.",
      'Fallbacks are forbidden: if the environment or the data store is unreachable, that is a FAIL with the error quoted, not a soft pass.',
      'Cite file:line for config/code claims and command + output excerpt for live claims.',
    ],
    maxFixAttempts,
    fixer: {},
    context: { releaseQualityId, environment, envVerification, dataVerification, layerPlan, priorKnowledge },
  });
  gateResults.envDataFidelity = {
    passed: fidelityGate.passed,
    attempts: fidelityGate.attempts,
    escalated: fidelityGate.escalated,
    issues: fidelityGate.issues,
    evidence: fidelityGate.evidence,
  };
  environmentOut.fidelityGate = gateResults.envDataFidelity;
  if (fidelityGate.escalated) {
    breakpointsHit.push('qa.env-data-fidelity.gate-escalation');
  }
  timeline.push({ at: nowIso(), event: 'env-data-fidelity-gate', detail: `passed=${fidelityGate.passed} attempts=${fidelityGate.attempts} escalated=${fidelityGate.escalated}` });

  if (fidelityGate.passed !== true) {
    // Fail closed BEFORE P4: results from an unfaithful environment are worthless, so no suite
    // executes and no go/no-go gate is ever raised.
    return buildResult(false, 'environment/test-data fidelity gate failed — suites not executed');
  }

  // -------------------------------------------------------------------------
  // P4 — parallel multi-tier suite execution
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P4: parallel multi-tier suite execution');
  const tiers = tierPlan(layerPlan);
  const tierResults = await ctx.parallel.all(
    tiers.map(({ tier, layers }) => () => ctx.parallel.map(
      layers,
      async (layer) => {
        await layerPolicy(layer, 'composedProcess')({
          projectName: serviceName,
          appName: serviceName,
          projectPath: repoRoot,
          applicationUrl: environment.targetEnv,
          baseUrl: environment.targetEnv,
          environmentType: environment.targetEnv,
          environmentDetails: environment,
          outputDir: `${artifactsRoot}/${releaseQualityId}/execution/${layer}`,
        }, ctx);
        const executed = await ctx.task(suiteExecutionTask, {
          releaseQualityId,
          layer,
          tier,
          moduleName: layerPolicy(layer, 'moduleName'),
          blocking: layerPolicy(layer, 'blocking'),
          thresholdKey: layerPolicy(layer, 'thresholdKey'),
          threshold: thresholdFor(layerPolicy(layer, 'thresholdKey'), thresholds),
          envRef: envVerification.envRef,
          environment,
          priorKnowledge,
        });
        assertSuiteStatus(executed.status, layer);
        return executed;
      },
      { maxConcurrency: maxParallelSuites }
    ))
  );
  const suites = [];
  const tiersOut = {};
  tiers.forEach(({ tier }, index) => {
    const rows = tierResults[index];
    tiersOut[tier] = rows.map((row) => ({ layer: row.layer, status: row.status }));
    for (const row of rows) {
      suites.push({
        layer: row.layer,
        status: row.status,
        passedCount: row.passedCount,
        failedCount: row.failedCount,
        failingTestIds: row.failingTestIds,
        command: row.command,
        outputExcerpt: row.outputExcerpt,
        executionError: row.executionError,
      });
    }
  });
  executionOut = { tiers: tiersOut, suites };
  timeline.push({ at: nowIso(), event: 'suite-execution', detail: `${suites.length} suite(s) across ${tiers.length} tier(s); failed=${suites.filter((s) => s.status === 'failed').length}` });

  // -------------------------------------------------------------------------
  // P5 — depth analysis: mutation score + flakiness (parallel)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P5: depth analysis (mutation + flakiness)');
  const [mutationRun, flakinessRun] = await ctx.parallel.all([
    () => mutationTestingProcess({
      projectPath: repoRoot,
      qualityThresholds: {
        overallMutationScore: thresholdFor('mutationScore', thresholds),
        criticalCodeMutationScore: thresholdFor('mutationScore', thresholds),
        maxSurvivedMutants: 0,
      },
      outputDir: `${artifactsRoot}/${releaseQualityId}/mutation`,
    }, ctx),
    () => flakinessEliminationProcess({
      testSuite: releaseQualityId,
      executionHistory: suites,
      targetFlakiness: thresholdFor('maxFlakinessRate', thresholds),
      // Quarantining is a POLICY-GATED action owned by P7 — never a silent side effect here.
      quarantineEnabled: false,
      environmentDetails: environment,
      outputDir: `${artifactsRoot}/${releaseQualityId}/flakiness`,
    }, ctx),
  ]);
  timeline.push({ at: nowIso(), event: 'depth-strands', detail: 'mutation + flakiness complete' });

  // -------------------------------------------------------------------------
  // P6 — depth dossier, then ADVERSARIAL GATE #2 (false green)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P6: depth dossier + adversarial gate qa.false-green');
  const depthReport = await ctx.task(depthReportTask, {
    releaseQualityId,
    depthReportPath: `${artifactsRoot}/depth-${releaseQualityId}.json`,
    suites,
    tiers: tiersOut,
    mutationRun,
    flakinessRun,
    authoring: authoringOut,
    mutationScoreThreshold: thresholdFor('mutationScore', thresholds),
    flakinessThreshold: thresholdFor('maxFlakinessRate', thresholds),
  });
  artifacts.push(depthReport.depthReportPath);
  depthOut = {
    mutationScore: depthReport.mutationScore,
    survivedMutants: depthReport.survivedMutants,
    flakinessRate: depthReport.flakinessRate,
    flakyTestIds: depthReport.flakyTestIds,
    quarantineCandidates: depthReport.flakyTestIds,
  };
  timeline.push({ at: nowIso(), event: 'depth-dossier', detail: `mutationScore=${depthReport.mutationScore} flakinessRate=${depthReport.flakinessRate} -> ${depthReport.depthReportPath}` });

  const blockingLayers = layerPlan.filter((layer) => layerPolicy(layer, 'blocking') === true);
  const falseGreenGate = await adversarialGate(ctx, {
    gateId: 'qa.false-green',
    artifact: {
      path: depthReport.depthReportPath,
      description: 'Suite execution + mutation + flakiness depth dossier',
    },
    critics: [
      {
        name: 'mutation-false-green-critic',
        role: 'Adversarial false-green gatekeeper',
        focus: 'prove the passing suites would actually FAIL if the product broke',
        instructions: [
          'IRON LAW: EXECUTE. Re-run at least one suite per blocking layer yourself and paste the raw command and output.',
          'For each blocking layer, inject at least one mutation (or revert an assertion / break a behavior in a scratch copy) and prove the suite goes RED. A suite that stays green under mutation is a false green and fails this gate.',
          'Reconcile every survived mutant in the dossier against the tests that were supposed to kill it; cite file:line of the mutant and the test id that failed to catch it.',
          'Hunt the classic false greens: assertion-free tests, always-true assertions, tests that swallow errors in try/catch, snapshot tests auto-updated in the run, suites whose entire body was skipped by a tag filter, and suites whose reported pass count is lower than the authored test id count.',
          'A suite reported as passed that you cannot re-run is an ISSUE, not a pass — never accept a report in place of an execution.',
          'Return your verdict as JSON with EXACTLY these keys and nothing else, as the LAST thing you output: {"passed": boolean, "issues": [{"severity": string, "description": string, "location": string}], "evidence": [string]}. passed:true with an empty evidence array is rejected by the orchestrator.',
        ],
      },
      {
        name: 'flake-and-quarantine-integrity-critic',
        role: 'Adversarial flake-and-quarantine gatekeeper',
        focus: 'prove greens are stable and that no coverage was quietly removed',
        instructions: [
          'IRON LAW: EXECUTE. Re-run the suites the dossier calls stable at least twice (vary order/parallelism where the runner supports it) and paste both outputs.',
          'Diff the test ids that RAN in this release against the ids authored in P2 and against the previous release\'s id set; any id that disappeared without an approved quarantine record is a silent coverage loss and fails this gate.',
          'Verify every quarantine claim: it must name an approver, an expiry, and a tracking defect. An unapproved or expired quarantine is a blocking issue.',
          'Verify the reported flakinessRate against your own re-runs; a rate that only holds on a single lucky run is not a rate.',
          'Cite test ids and raw run output for every claim.',
          'Return your verdict as JSON with EXACTLY these keys and nothing else, as the LAST thing you output: {"passed": boolean, "issues": [{"severity": string, "description": string, "location": string}], "evidence": [string]}. passed:true with an empty evidence array is rejected by the orchestrator.',
        ],
      },
    ],
    ironLaw: [
      'EXECUTED EVIDENCE ONLY: you must RUN the suites (or replay the recorded runs with the runner) in this attempt. Reading the depth report, the CI summary, or a coverage badge is NOT evidence and yields an automatic FAIL.',
      'Every issue must cite a test id or file:line. Every evidence entry must be either a raw command+output excerpt you produced or a file:line citation.',
      'Mutation proof is mandatory: for every blocking layer you must show one injected break that turned the suite RED, or report that layer as unverified (an issue).',
      'Fallbacks are forbidden: a suite you cannot execute is a FAILURE with the error quoted — never a skipped-and-passed path.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      releaseQualityId,
      blockingLayers,
      suites,
      authoring: authoringOut,
      priorKnowledge,
      mutationScoreThreshold: thresholdFor('mutationScore', thresholds),
    },
  });
  gateResults.falseGreen = {
    passed: falseGreenGate.passed,
    attempts: falseGreenGate.attempts,
    escalated: falseGreenGate.escalated,
    issues: falseGreenGate.issues,
    evidence: falseGreenGate.evidence,
  };
  if (falseGreenGate.escalated) {
    breakpointsHit.push('qa.false-green.gate-escalation');
  }
  timeline.push({ at: nowIso(), event: 'false-green-gate', detail: `passed=${falseGreenGate.passed} attempts=${falseGreenGate.attempts} escalated=${falseGreenGate.escalated}` });

  // -------------------------------------------------------------------------
  // P7 — defect routing + policy-gated waivers, quarantines, acceptances
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P7: defect routing + policy-gated waivers/quarantines/acceptances');
  const defectRouting = await ctx.task(defectRoutingTask, {
    releaseQualityId,
    suites,
    blockingLayers,
    survivedMutants: depthReport.survivedMutants,
    gateIssues: falseGreenGate.issues,
  });
  defectsOut = defectRouting.defects;
  timeline.push({ at: nowIso(), event: 'defect-routing', detail: `${defectRouting.defects.length} defect(s), ${defectRouting.blockingDefectIds.length} blocking` });

  const waiverDossier = await ctx.task(waiverDossierTask, {
    releaseQualityId,
    thresholds,
    suites,
    coverage: coverageOut,
    depth: depthOut,
    defects: defectRouting.defects,
    blockingDefectIds: defectRouting.blockingDefectIds,
    gateResults,
    priorKnowledge,
  });
  timeline.push({ at: nowIso(), event: 'waiver-dossier', detail: `waivers=${waiverDossier.waiverRequests.length} quarantines=${waiverDossier.quarantineRequests.length} acceptances=${waiverDossier.acceptanceRequests.length}` });

  // --- release-quality.suite-quarantine ------------------------------------
  // The only gate here that carries autoApproveAfterN: quarantine is the lowest-consequence
  // action and is expiry-bound. The autoApproved provenance is recorded on every quarantine
  // record and surfaced in outputs.autoApprovals.
  if (waiverDossier.quarantineRequests.length > 0) {
    const quarantineGate = await routedBreakpoint(ctx, {
      question: `Quarantine ${waiverDossier.quarantineRequests.length} flaky test group(s) for ${releaseQualityId}? Quarantining REMOVES this coverage from the release decision.`,
      quarantineRequests: waiverDossier.quarantineRequests,
      coverageRemoved: waiverDossier.quarantineRequests.map((request) => request.coverageRemoved),
      flakeRates: depthOut.flakinessRate,
      blockingDefectIds: defectRouting.blockingDefectIds,
      releaseQualityId,
    }, {
      breakpointId: 'release-quality.suite-quarantine',
      expert: 'qa-lead',
      tags: ['policy-gated', 'release-quality', 'quarantine'],
      strategy: 'single',
      autoApproveAfterN: quarantineAutoApproveAfterN,
    });
    recordGate('release-quality.suite-quarantine', 'P7', quarantineGate);
    if (quarantineGate.approved === true) {
      // executeQuarantineTask is invoked ONLY here, inside approved === true — no other call site.
      const quarantineExec = await ctx.task(executeQuarantineTask, {
        releaseQualityId,
        approvedRequests: waiverDossier.quarantineRequests,
        approvedBy: quarantineGate.respondedBy ?? 'qa-lead',
        autoApproved: isAutoApproved(quarantineGate),
        registryPath: `${artifactsRoot}/quarantine-registry-${releaseQualityId}.json`,
        defects: defectRouting.defects,
      });
      artifacts.push(quarantineExec.registryPath);
      for (const record of quarantineExec.quarantined) {
        quarantinesOut.push({
          actionId: 'release-quality.suite-quarantine',
          testIds: record.testIds,
          approved: true,
          approvedBy: record.approvedBy,
          autoApproved: isAutoApproved(quarantineGate),
          coverageRemoved: record.coverageRemoved,
          expiresAt: record.expiresAt,
        });
      }
      timeline.push({ at: nowIso(), event: 'quarantine-executed', detail: `${quarantineExec.quarantined.length} quarantine record(s) -> ${quarantineExec.registryPath}` });
    } else {
      // Fail closed: nothing is quarantined, the flaky tests stay blocking, and their failures
      // ride into the go/no-go payload. There is no alternate quarantine path.
      timeline.push({ at: nowIso(), event: 'quarantine-gate', detail: 'rejected — flaky tests stay blocking' });
    }
  }

  // --- release-quality.coverage-threshold-waiver ----------------------------
  // Deliberately NO autoApproveAfterN — a threshold waiver removes a measured bar and must
  // always be a human decision; do not add it.
  if (waiverDossier.waiverRequests.length > 0) {
    const waiverGate = await routedBreakpoint(ctx, {
      question: `Waive ${waiverDossier.waiverRequests.length} quality threshold(s) for ${releaseQualityId}? Each waiver removes a measured bar from the release decision.`,
      waiverRequests: waiverDossier.waiverRequests,
      releaseQualityId,
    }, {
      breakpointId: 'release-quality.coverage-threshold-waiver',
      expert: 'engineering-manager',
      tags: ['policy-gated', 'release-quality', 'waiver'],
      strategy: 'single',
    });
    recordGate('release-quality.coverage-threshold-waiver', 'P7', waiverGate);
    if (waiverGate.approved === true) {
      // executeWaiverTask is invoked ONLY here, inside approved === true — no other call site.
      const waiverExec = await ctx.task(executeWaiverTask, {
        releaseQualityId,
        approvedRequests: waiverDossier.waiverRequests,
        approvedBy: waiverGate.respondedBy ?? 'engineering-manager',
        autoApproved: isAutoApproved(waiverGate),
        rationale: waiverGate.response ?? null,
        registryPath: `${artifactsRoot}/waiver-registry-${releaseQualityId}.json`,
      });
      artifacts.push(waiverExec.registryPath);
      for (const record of waiverExec.waivers) {
        // Validate the waived key against the frozen table — a waiver against a key that does
        // not exist would silently waive nothing, so thresholdFor throws instead.
        thresholdFor(record.thresholdKey, thresholds);
        waiversOut.push({
          actionId: 'release-quality.coverage-threshold-waiver',
          thresholdKey: record.thresholdKey,
          requested: record.requested,
          approved: true,
          approvedBy: record.approvedBy,
          autoApproved: isAutoApproved(waiverGate),
          rationale: record.rationale,
          expiresAt: record.expiresAt,
        });
      }
      timeline.push({ at: nowIso(), event: 'waiver-executed', detail: `${waiverExec.waivers.length} waiver(s) -> ${waiverExec.registryPath}` });
    } else {
      // Fail closed: the breach remains a blocker in the quality verdict.
      timeline.push({ at: nowIso(), event: 'waiver-gate', detail: 'rejected — threshold breaches remain blockers' });
    }
  }

  // --- release-quality.security-finding-acceptance --------------------------
  // Deliberately NO autoApproveAfterN — accepting an open security/accessibility finding must
  // always be a human decision; do not add it.
  if (waiverDossier.acceptanceRequests.length > 0) {
    const acceptanceGate = await routedBreakpoint(ctx, {
      question: `Accept ${waiverDossier.acceptanceRequests.length} open security/accessibility finding(s) as known issues for ${releaseQualityId}? The findings stay open — acceptance is a record, not a fix.`,
      acceptanceRequests: waiverDossier.acceptanceRequests,
      releaseQualityId,
    }, {
      breakpointId: 'release-quality.security-finding-acceptance',
      expert: 'security-lead',
      tags: ['policy-gated', 'release-quality', 'security'],
      strategy: 'single',
    });
    recordGate('release-quality.security-finding-acceptance', 'P7', acceptanceGate);
    if (acceptanceGate.approved === true) {
      // executeFindingAcceptanceTask is invoked ONLY here, inside approved === true.
      const acceptanceExec = await ctx.task(executeFindingAcceptanceTask, {
        releaseQualityId,
        approvedRequests: waiverDossier.acceptanceRequests,
        approvedBy: acceptanceGate.respondedBy ?? 'security-lead',
        autoApproved: isAutoApproved(acceptanceGate),
        rationale: acceptanceGate.response ?? null,
        registryPath: `${artifactsRoot}/accepted-findings-${releaseQualityId}.json`,
      });
      artifacts.push(acceptanceExec.registryPath);
      for (const record of acceptanceExec.accepted) {
        acceptedFindingsOut.push({
          actionId: 'release-quality.security-finding-acceptance',
          findingId: record.findingId,
          kind: record.kind,
          approved: true,
          approvedBy: record.approvedBy,
          rationale: record.rationale,
        });
      }
      timeline.push({ at: nowIso(), event: 'acceptance-executed', detail: `${acceptanceExec.accepted.length} finding(s) accepted -> ${acceptanceExec.registryPath}` });
    } else {
      // Fail closed: the finding stays open and blocking.
      timeline.push({ at: nowIso(), event: 'acceptance-gate', detail: 'rejected — findings stay open and blocking' });
    }
  }

  // -------------------------------------------------------------------------
  // P8 — quality-gate aggregation, metrics dashboard, CI wiring (parallel)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P8: quality gates + metrics dashboard + continuous testing (parallel)');
  const [qualityGatesRun, metricsRun, continuousRun] = await ctx.parallel.all([
    () => qualityGatesProcess({
      projectPath: repoRoot,
      qualityStandards: thresholds,
      enforcementLevel: 'blocking',
      outputDir: `${artifactsRoot}/${releaseQualityId}/quality-gates`,
    }, ctx),
    () => metricsDashboardProcess({
      projectName: serviceName,
      testSources: layerPlan,
      outputDir: `${artifactsRoot}/${releaseQualityId}/metrics`,
    }, ctx),
    () => continuousTestingProcess({
      projectPath: repoRoot,
      repositoryUrl: repoRoot,
      qualityGates: {
        coverage: thresholdFor('lineCoverage', thresholds),
        flakinessThreshold: thresholdFor('maxFlakinessRate', thresholds),
      },
    }, ctx),
  ]);
  timeline.push({ at: nowIso(), event: 'aggregation-strands', detail: 'quality-gates + metrics + continuous-testing complete' });

  const verdict = await ctx.task(qualityVerdictTask, {
    releaseQualityId,
    serviceName,
    version,
    thresholds,
    blockingLayers,
    suites,
    coverage: coverageOut,
    depth: depthOut,
    gateResults,
    waivers: waiversOut,
    quarantines: quarantinesOut,
    acceptedFindings: acceptedFindingsOut,
    defects: defectsOut,
    qualityGatesRun,
    metricsRun,
    continuousRun,
  });
  timeline.push({ at: nowIso(), event: 'quality-verdict', detail: `recommendation=${verdict.recommendation} unresolvedBlockers=${verdict.unresolvedBlockers.length}` });

  // -------------------------------------------------------------------------
  // P9 — go/no-go sign-off, guarded certificate, kip assert, final report
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P9: release-quality.go-no-go-signoff');
  // Deliberately NO autoApproveAfterN and NO presentAlwaysApprove — authorizing promotion to
  // production must never auto-approve and must never offer a one-click always-approve
  // affordance. Do not add either of them.
  const goNoGoGate = await routedBreakpoint(ctx, {
    question: `Sign off the release quality gate for ${releaseQualityId}? Recommendation: ${verdict.recommendation}. Unresolved blockers: ${verdict.unresolvedBlockers.length}. Mutation score ${depthOut.mutationScore}, flakiness ${depthOut.flakinessRate}.`,
    recommendation: verdict.recommendation,
    residualRisk: verdict.residualRisk,
    blockingLayerResults: verdict.blockingLayerResults,
    unresolvedBlockers: verdict.unresolvedBlockers,
    mutationScore: depthOut.mutationScore,
    flakinessRate: depthOut.flakinessRate,
    gateResults,
    waivers: waiversOut,
    quarantines: quarantinesOut,
    acceptedFindings: acceptedFindingsOut,
    releaseQualityId,
  }, {
    breakpointId: 'release-quality.go-no-go-signoff',
    expert: 'qa-lead',
    tags: ['policy-gated', 'release-quality', 'signoff'],
    strategy: 'single',
  });
  recordGate('release-quality.go-no-go-signoff', 'P9', goNoGoGate);

  goNoGoOut = {
    approved: goNoGoGate.approved === true,
    decision: goNoGoGate.approved === true ? 'go' : 'no-go',
    decidedBy: goNoGoGate.respondedBy ?? 'qa-lead',
    response: goNoGoGate.response ?? null,
    at: nowIso(),
    certificatePath: null,
  };

  if (goNoGoGate.approved === true) {
    // certificateTask is invoked ONLY here, inside goNoGoGate.approved === true — no other
    // call site exists, so a no-go can never produce a release quality certificate.
    const certificate = await ctx.task(certificateTask, {
      releaseQualityId,
      serviceName,
      version,
      certificatePath: `${artifactsRoot}/release-quality-certificate-${releaseQualityId}.md`,
      suites,
      tiers: tiersOut,
      depth: depthOut,
      coverage: coverageOut,
      gateResults,
      waivers: waiversOut,
      quarantines: quarantinesOut,
      acceptedFindings: acceptedFindingsOut,
      verdict,
      signoff: goNoGoOut,
      timeline,
    });
    goNoGoOut.certificatePath = certificate.certificatePath;
    artifacts.push(certificate.certificatePath);
    timeline.push({ at: nowIso(), event: 'certificate', detail: `go -> ${certificate.certificatePath}` });
  } else {
    timeline.push({ at: nowIso(), event: 'go-no-go', detail: 'no-go — certificate deliberately not written' });
  }

  const blockingResultsPassed = Array.isArray(verdict.blockingLayerResults)
    && verdict.blockingLayerResults.length > 0
    && verdict.blockingLayerResults.every((row) => row.passed === true);
  const success = goNoGoOut.approved === true
    && blockingResultsPassed
    && gateResults.envDataFidelity.passed === true
    && gateResults.falseGreen.passed === true;

  // kip assert: a no-go asserts exactly the same fact set as a go — failure memory is the point.
  // Facts are built DETERMINISTICALLY here in the orchestrator; agents never invent facts. The
  // decision fact always exists, so kipAssert's empty-facts throw is unreachable by construction.
  if (kipEnabled) {
    const subject = `release-quality:${releaseQualityId}`;
    const facts = [
      {
        subject,
        predicate: 'decision',
        object: goNoGoOut.decision,
        props: { decidedBy: goNoGoOut.decidedBy, at: goNoGoOut.at, version },
      },
      {
        subject,
        predicate: 'depth',
        object: `mutationScore=${depthOut.mutationScore};flakinessRate=${depthOut.flakinessRate}`,
      },
    ];
    for (const layer of blockingLayers) {
      const row = suites.find((suite) => suite.layer === layer);
      if (row) {
        facts.push({
          subject,
          predicate: 'layer-result',
          object: `${layer}:${row.status}`,
          props: { passedCount: row.passedCount, failedCount: row.failedCount, command: row.command },
        });
      }
    }
    for (const [gateId, gate] of [['qa.env-data-fidelity', gateResults.envDataFidelity], ['qa.false-green', gateResults.falseGreen]]) {
      facts.push({
        subject,
        predicate: 'gate-outcome',
        object: `${gateId}:${gate.passed}`,
        props: {
          attempts: gate.attempts,
          escalated: gate.escalated,
          firstIssue: gate.issues.length > 0 ? `${gate.issues[0].critic}: ${gate.issues[0].description}` : null,
        },
      });
    }
    for (const waiver of waiversOut) {
      facts.push({
        subject,
        predicate: 'policy-action',
        object: waiver.actionId,
        props: { approvedBy: waiver.approvedBy, autoApproved: waiver.autoApproved, expiresAt: waiver.expiresAt, coverageRemoved: null },
      });
    }
    for (const quarantine of quarantinesOut) {
      facts.push({
        subject,
        predicate: 'policy-action',
        object: quarantine.actionId,
        props: { approvedBy: quarantine.approvedBy, autoApproved: quarantine.autoApproved, expiresAt: quarantine.expiresAt, coverageRemoved: quarantine.coverageRemoved },
      });
    }
    for (const finding of acceptedFindingsOut) {
      facts.push({
        subject,
        predicate: 'policy-action',
        object: finding.actionId,
        props: { approvedBy: finding.approvedBy, autoApproved: false, expiresAt: null, coverageRemoved: null },
      });
    }
    // Only insights this run's executed evidence supports.
    for (const issue of gateResults.falseGreen.issues) {
      facts.push({
        subject,
        predicate: 'insight',
        object: `${issue.critic}: ${issue.description}`,
      });
    }
    const asserted = await kipAssert(ctx, { kipDir, kipModel, kind: 'release-quality', facts });
    kipFactsAsserted = asserted.asserted;
    timeline.push({ at: nowIso(), event: 'kip-assert', detail: `${kipFactsAsserted} facts` });
  }

  const finalReport = await ctx.task(finalReportTask, {
    releaseQualityId,
    serviceName,
    version,
    reportPath: `${artifactsRoot}/release-quality-report-${releaseQualityId}.md`,
    strategy: strategyOut,
    coverage: coverageOut,
    authoring: authoringOut,
    environment: environmentOut,
    execution: executionOut,
    depth: depthOut,
    gateResults,
    defects: defectsOut,
    waivers: waiversOut,
    quarantines: quarantinesOut,
    acceptedFindings: acceptedFindingsOut,
    goNoGo: goNoGoOut,
    verdict,
    timeline,
  });
  artifacts.push(finalReport.reportPath);
  timeline.push({ at: nowIso(), event: 'final-report', detail: finalReport.reportPath });

  return buildResult(
    success,
    success ? undefined : `release quality not signed off as clean (decision=${goNoGoOut.decision}, blockingLayersPassed=${blockingResultsPassed})`
  );
}
