/**
 * @process methodologies/composition-regulated-greenfield
 * @description Regulated greenfield composition (HIPAA patient portal archetype): Waterfall stages ->
 *   DDD clinical-domain modeling -> Cleanroom formal specification of PHI components -> implementation ->
 *   V-Model paired verification (unit<->detailed-design, integration<->architecture, system<->requirements)
 *   with per-component ctx.parallel verification; policy-gated PHI access, per-stage traceability gates,
 *   compliance-officer deploy approval. Implements backlog Example 2.
 * @inputs { projectRequirements: string, phiComponents?: string[], complianceStandards?: string[], kipDir?: string, kipModel?: string, maxFixAttempts?: number }
 * @outputs { success: boolean, srs: object, domainModel: object, formalSpecs: object, implementation: object, verification: object, traceabilityMatrices: object, stageSignoffs: object, deployment: object|null }
 * @graph
 *   domains: [domain:software-engineering, domain:healthcare]
 *   specializations: [specialization:data-privacy-compliance, specialization:qa-testing-automation]
 *   skillAreas: [skill-area:acceptance-testing, skill-area:integration-testing, skill-area:formal-verification]
 *   workflows: [workflow:feature-development, workflow:release-management]
 *   topics: [topic:compliance-traceability]
 *   roles: [role:qa-engineer, role:compliance-officer, role:tech-lead]
 *
 * Policy-gated actions (adapters/policy ready):
 *   - phi-data-access-approval  (expert: compliance-officer) — approve any access to PHI or PHI-derived test data
 *   - production-deploy         (expert: compliance-officer) — deploy the patient portal to production
 *   - stage-exit-signoff        (expert: qa-lead)            — stage-boundary exit approval with traceability evidence
 */

import { defineTask, globalTaskRegistry } from '@a5c-ai/babysitter-sdk';

import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../../specializations/common-utilities/routed-gate-combinators.js';

// Ingredient tasks — composed BY NAME, never re-implemented. Ingredient
// process() functions are deliberately NOT imported/called so ingredient-
// internal breakpoints and loops never double-fire inside this composition.
//
// waterfall.js and v-model.js BOTH register the task id 'implementation' in
// the SDK's global task registry at module-evaluation time (a known
// library-wide shared-id issue; see library/__tests__/smoke.test.mjs). This
// composition uses NEITHER module's 'implementation' task — it has its own
// crg.implement-component — so the two modules are imported sequentially and
// the inert colliding definition is cleared between them. Nothing else
// collides across waterfall/ddd/cleanroom/v-model.
const waterfallModule = await import('../waterfall/waterfall.js');
const { requirementsGatheringTask, deploymentTask } = waterfallModule;
if (globalTaskRegistry.hasTask('implementation')) {
  globalTaskRegistry.definitions.delete('implementation');
}
const vModelModule = await import('../v-model/v-model.js');
const {
  requirementsWithAcceptanceTask,
  systemDesignWithSystemTestTask,
  architectureWithIntegrationTestTask,
  moduleDesignWithUnitTestTask,
  executeTestsTask,
  traceabilityMatrixTask,
} = vModelModule;

import {
  identifySubdomainsTask,
  defineBoundedContextsTask,
  createContextMapTask,
  buildUbiquitousLanguageTask,
  identifyEntitiesValueObjectsTask,
  defineAggregatesTask,
  identifyDomainEventsTask,
  validateLanguageConsistencyTask,
} from '../domain-driven-design/domain-driven-design.js';

import {
  createFormalSpecificationTask,
  designWithVerificationTask,
  fixDesignTask,
  codeInspectionTask,
  fixImplementationTask,
} from '../cleanroom/cleanroom.js';

// ---------------------------------------------------------------------------
// crg.* tasks — Style-A agent-only factories
// ---------------------------------------------------------------------------

/**
 * crg.phi-classification — compute the AUTHORITATIVE PHI component/dataset
 * inventory from the SRS. The phiComponents input is only a hint; this task's
 * output governs which components go through Cleanroom formal specification
 * and which datasets require phi-data-access-approval provenance.
 *
 * Usage:
 *   const phiInventory = await ctx.task(phiClassificationTask, {
 *     srs, requirements, phiComponentsHint: ['medical-records'], complianceStandards,
 *   });
 *
 * @param {object} args - { srs, requirements, phiComponentsHint, complianceStandards, kipInsights }
 * @returns {{components: Array<{name: string, handlesPhi: boolean, phiCategories: string[], rationale: string}>, datasets: Array<{name: string, phiCategories: string[], minimumNecessaryJustification: string}>, evidence: string[]}}
 */
export const phiClassificationTask = defineTask('crg.phi-classification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'PHI classification: authoritative component/dataset inventory',
  agent: {
    name: 'phi-classifier',
    prompt: {
      role: 'HIPAA data-classification analyst (Privacy Rule + Security Rule)',
      task: 'Classify every system component and dataset in the SRS for PHI handling and produce the authoritative inventory',
      context: {
        srs: args.srs,
        requirements: args.requirements,
        phiComponentsHint: args.phiComponentsHint,
        complianceStandards: args.complianceStandards,
        kipInsights: args.kipInsights,
      },
      instructions: [
        'Derive the component list from the SRS and requirements — the phiComponentsHint is a hint, never the authority; confirm or refute each hinted component from SRS text.',
        'For each component report handlesPhi, the PHI categories touched (e.g. demographics, diagnoses, medications, appointment metadata, billing/insurance), and the SRS-grounded rationale.',
        'For each PHI-bearing dataset report the PHI categories and a minimum-necessary justification (HIPAA Privacy Rule 164.502(b)) for why the process needs it.',
        'Evidence is mandatory: cite the SRS section/requirement id for every classification decision.',
        'Do not invent components or datasets that the SRS does not support.',
      ],
      outputFormat: 'JSON with components array [{name, handlesPhi, phiCategories, rationale}], datasets array [{name, phiCategories, minimumNecessaryJustification}], evidence array of SRS citations',
    },
    outputSchema: {
      type: 'object',
      required: ['components', 'datasets', 'evidence'],
      properties: {
        components: { type: 'array' },
        datasets: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'crg', 'phi', 'classification'],
}));

/**
 * crg.trace-diff — COMPUTE (do not narrate) the requirement->verification
 * set-diff for a stage and write it to artifacts/crg/<stage>/trace-diff.json.
 * This executed diff is the artifact every stage-exit adversarial gate reviews.
 *
 * Usage:
 *   const diff = await ctx.task(traceDiffTask, {
 *     stage, matrix, previousMatrix, requirements, phiApprovals,
 *   });
 *
 * @param {object} args - { stage, matrix, previousMatrix, requirements, phiApprovals }
 * @returns {{diffPath: string, coveredCount: number, uncovered: string[], orphanedTests: string[], regressions: string[], evidence: string[]}}
 */
export const traceDiffTask = defineTask('crg.trace-diff', (args, taskCtx) => ({
  kind: 'agent',
  title: `Trace diff: ${args.stage}`,
  agent: {
    name: 'trace-diff-computer',
    prompt: {
      role: 'Traceability computation engineer',
      task: `COMPUTE, do not narrate: the requirement-to-verification set-diff for stage "${args.stage}"`,
      context: {
        stage: args.stage,
        matrix: args.matrix,
        previousMatrix: args.previousMatrix,
        requirements: args.requirements,
        phiApprovals: args.phiApprovals,
      },
      instructions: [
        'Load the stage traceability matrix and the prior stored matrix from the context; execute the set-diff of requirement ids vs verification artifact links — actually enumerate ids, do not summarize in prose.',
        `Write the computed diff to artifacts/crg/${args.stage}/trace-diff.json as {stage, coveredCount, uncovered:[reqIds], orphanedTests:[testIds], regressions:[reqIds newly uncovered vs the previous matrix]}.`,
        'uncovered = requirement ids from the SRS requirement set with no verification artifact link in the current matrix.',
        'orphanedTests = test/verification ids in the current matrix that trace to no requirement id.',
        'regressions = requirement ids covered in the previous matrix but uncovered now (empty array when there is no previous matrix).',
        'Report the exact counts and the written file path. Evidence must cite the executed computation and the written file (path plus id lists), not opinions.',
      ],
      outputFormat: 'JSON with diffPath string, coveredCount number, uncovered array, orphanedTests array, regressions array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['diffPath', 'coveredCount', 'uncovered', 'orphanedTests', 'regressions', 'evidence'],
      properties: {
        diffPath: { type: 'string' },
        coveredCount: { type: 'number' },
        uncovered: { type: 'array' },
        orphanedTests: { type: 'array' },
        regressions: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'crg', 'traceability'],
}));

/**
 * crg.implement-component — implement one component against its Cleanroom
 * formal specification (PHI components) or V-Model module design (non-PHI),
 * tests-first from the pre-designed unit tests.
 *
 * Usage:
 *   const impl = await ctx.task(implementComponentTask, {
 *     component, formalSpec, moduleDesign, unitTestDesign, phiApproval,
 *   });
 *
 * @param {object} args - { component, formalSpec, moduleDesign, unitTestDesign, phiApproval, requirements }
 * @returns {{summary: string, filesChanged: string[], testsPassing: boolean, evidence: string[]}}
 */
export const implementComponentTask = defineTask('crg.implement-component', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement component: ${args.component.name}`,
  agent: {
    name: 'component-implementer',
    prompt: {
      role: 'Senior engineer implementing under regulated-traceability discipline',
      task: `Implement component "${args.component.name}" against its ${args.component.handlesPhi ? 'Cleanroom formal specification' : 'module design'}`,
      context: {
        component: args.component,
        formalSpec: args.formalSpec,
        moduleDesign: args.moduleDesign,
        unitTestDesign: args.unitTestDesign,
        phiApproval: args.phiApproval,
        requirements: args.requirements,
      },
      instructions: [
        'Tests first: start from the pre-designed V-Model unit tests for this component, then implement until they pass.',
        'PHI components implement against the formal specification (box structures, correctness conditions); non-PHI components implement against the module design.',
        'PHI components MUST cite the phiApproval provenance (breakpointEventId + dataset names) from the context for every PHI-derived data touch, and never fabricate or widen data access beyond the approved datasets.',
        'If work would require a PHI-derived dataset with no covering approval in the context, STOP and report it as a failure — never proceed without recorded approval.',
        'Report every file changed and whether the pre-designed unit tests pass; evidence cites executed test output and implementation files.',
      ],
      outputFormat: 'JSON with summary string, filesChanged array, testsPassing boolean, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'filesChanged', 'testsPassing', 'evidence'],
      properties: {
        summary: { type: 'string' },
        filesChanged: { type: 'array' },
        testsPassing: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'crg', 'implementation'],
}));

/**
 * crg.fix-verification — bounded fix-loop body for Stage-5 verification-level
 * failures. Scope-wrapped: fixes ONLY the listed failures.
 *
 * Usage:
 *   const fix = await ctx.task(fixVerificationTask, { level, failures, implementation });
 *
 * @param {object} args - { level, failures, implementation, context }
 * @returns {{fixed: boolean, changes: string[], evidence: string[]}}
 */
export const fixVerificationTask = defineTask('crg.fix-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix ${args.level} verification failures (attempt ${args.attempt})`,
  agent: {
    name: 'verification-fixer',
    prompt: {
      role: 'Remediation engineer (verification failures only)',
      task: `Fix ONLY the listed ${args.level}-level verification failures`,
      context: {
        level: args.level,
        failures: args.failures,
        implementation: args.implementation,
        attempt: args.attempt,
        extra: args.context,
      },
      instructions: [
        'Fix ONLY the failures listed in the context — no unrelated refactors, no new features.',
        'Preserve prior implementation where it was correct.',
        'Report what changed per failure so the re-run can verify each fix; evidence cites the changed files and executed re-checks.',
      ],
      outputFormat: 'JSON with fixed boolean, changes array (one entry per addressed failure), evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['fixed', 'changes', 'evidence'],
      properties: {
        fixed: { type: 'boolean' },
        changes: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'crg', 'fixer'],
}));

// ---------------------------------------------------------------------------
// requirePhiApproval — PHI guard raised BEFORE any PHI-touching task schedules
// ---------------------------------------------------------------------------

/**
 * PHI access guard. Raises the crg.phi-data-access-approval routed breakpoint
 * (expert: compliance-officer) for every requested dataset that has no recorded
 * approval yet, BEFORE any task receives PHI-derived data in its context.
 * Approvals are per-dataset and never generalized: a dataset is covered only
 * when a recorded approval names it exactly. The breakpoint NEVER auto-executes
 * (no autoApproveAfterN, no presentAlwaysApprove). Rejection throws — this
 * process invents no de-identified fallback path.
 *
 * Usage:
 *   const provenance = await requirePhiApproval(ctx, 'formal specification against PHI-shaped schemas', phiInventory.datasets, {
 *     requestingStage: 'stage-3-cleanroom-spec',
 *     phiApprovals, // mutable provenance log owned by the process
 *   });
 *
 * @param {object} ctx - The process context
 * @param {string} purpose - REQUIRED human-readable purpose of the PHI access
 * @param {Array<{name: string, phiCategories?: string[], minimumNecessaryJustification?: string}>} datasets - REQUIRED non-empty dataset descriptors
 * @param {object} options
 * @param {string} options.requestingStage - REQUIRED stage id raising the guard
 * @param {Array<object>} options.phiApprovals - REQUIRED mutable provenance log; new approvals are appended
 * @returns {Promise<{approvals: Array<{breakpointEventId: string, breakpointId: string, purpose: string, requestingStage: string, datasets: string[], approvedAt: string, respondedBy: string|null}>}>} approvals covering every requested dataset
 */
export async function requirePhiApproval(ctx, purpose, datasets, { requestingStage, phiApprovals } = {}) {
  if (!purpose) {
    throw new Error(`requirePhiApproval: purpose is required (got ${JSON.stringify(purpose)})`);
  }
  if (!Array.isArray(datasets) || datasets.length === 0) {
    throw new Error(`requirePhiApproval: datasets is required and must be non-empty (got ${JSON.stringify(datasets)})`);
  }
  if (!requestingStage) {
    throw new Error(`requirePhiApproval: requestingStage is required (got ${JSON.stringify(requestingStage)})`);
  }
  if (!Array.isArray(phiApprovals)) {
    throw new Error('requirePhiApproval: phiApprovals provenance log (array) is required');
  }
  for (const dataset of datasets) {
    if (!dataset || !dataset.name) {
      throw new Error(`requirePhiApproval: every dataset needs a name (got ${JSON.stringify(dataset)})`);
    }
  }

  const approvedNames = new Set();
  for (const approval of phiApprovals) {
    for (const name of approval.datasets) {
      approvedNames.add(name);
    }
  }

  // Per-dataset, never generalized: only datasets with no recorded approval
  // are raised; already-approved datasets reuse their recorded provenance.
  const uncovered = datasets.filter((d) => !approvedNames.has(d.name));

  if (uncovered.length > 0) {
    const decision = await routedBreakpoint(ctx, {
      question: `PHI data access requested by ${requestingStage}: approve access to ${uncovered.length} dataset(s) for "${purpose}"? Approvals are per-dataset and never generalized.`,
      purpose,
      datasets: uncovered.map((d) => ({
        name: d.name,
        phiCategories: d.phiCategories ?? [],
        minimumNecessaryJustification: d.minimumNecessaryJustification ?? '',
      })),
      requestingStage,
    }, {
      breakpointId: 'crg.phi-data-access-approval',
      expert: 'compliance-officer',
      tags: ['crg', 'policy-gated', 'phi', 'hipaa'],
      strategy: 'single',
      // NEVER auto-executes: no autoApproveAfterN, no presentAlwaysApprove.
    });

    if (decision.approved !== true) {
      const notes = decision.response ?? decision.feedback ?? 'no reviewer notes';
      throw new Error(`PHI data access REJECTED by compliance-officer for ${requestingStage} (${purpose}): ${notes}. There is no de-identified fallback path — the run stops here.`);
    }

    const approvedAt = new Date().toISOString();
    phiApprovals.push({
      breakpointEventId: `crg.phi-data-access-approval@${approvedAt}#${phiApprovals.length}`,
      breakpointId: 'crg.phi-data-access-approval',
      purpose,
      requestingStage,
      datasets: uncovered.map((d) => d.name),
      approvedAt,
      respondedBy: decision.respondedBy ?? null,
    });
  }

  const requestedNames = new Set(datasets.map((d) => d.name));
  return {
    approvals: phiApprovals.filter((a) => a.datasets.some((name) => requestedNames.has(name))),
  };
}

// ---------------------------------------------------------------------------
// regulatedStageExit — executed trace-diff -> adversarial gate -> qa-lead sign-off
// ---------------------------------------------------------------------------

/**
 * Regulated stage-exit contract, applied at every stage boundary:
 *   1. EXECUTED traceability check — traceabilityMatrixTask computes the stage's
 *      requirement->artifact->test matrix, then crg.trace-diff diffs it against
 *      the previous stage's stored matrix + the SRS requirement set, emitting
 *      artifacts/crg/<stage>/trace-diff.json (a computed diff, not prose).
 *   2. adversarialGate over the executed trace-diff.json with traceability-critic
 *      + phi-provenance-critic; gate failure blocks the stage (escalation only
 *      via the combinator's built-in owner breakpoint).
 *   3. qa-lead sign-off via routedBreakpoint with the per-stage-unique
 *      breakpointId crg.stage-exit.<stage>; the payload structurally requires
 *      the executed gate result — sign-off without traceability evidence is
 *      impossible to construct.
 *   4. Rejected sign-off throws (stage boundaries are sequential; no skip-ahead).
 *
 * Usage:
 *   const exit = await regulatedStageExit(ctx, 'requirements', {
 *     artifacts: ['artifacts/crg/requirements/srs.json'],
 *     requirements, verificationArtifacts: { acceptanceTestDesign },
 *     previousMatrix: null, phiApprovals, kipDir, kipModel, maxFixAttempts,
 *   });
 *
 * @param {object} ctx - The process context
 * @param {string} stage - REQUIRED stage id (requirements | domain-modeling | formal-specification | implementation | verification)
 * @param {object} options
 * @param {string[]} [options.artifacts=[]] - Stage artifact paths surfaced to the reviewer
 * @param {object} options.requirements - REQUIRED SRS requirement set for the diff
 * @param {object} [options.verificationArtifacts={}] - Stage-scoped design/implementation/test artifacts fed to the matrix computation
 * @param {object|null} [options.previousMatrix=null] - Previous stage's stored matrix (null only for the first stage exit)
 * @param {Array<object>} [options.phiApprovals=[]] - Recorded PHI approval provenance for the phi-provenance-critic
 * @param {number} [options.maxFixAttempts=2] - Adversarial-gate fix budget
 * @returns {Promise<{stage: string, matrix: object, traceDiff: object, gateResult: {passed: boolean, attempts: number, escalated: boolean, evidence: array}, signoff: object}>}
 */
export async function regulatedStageExit(ctx, stage, {
  artifacts = [],
  requirements,
  verificationArtifacts = {},
  previousMatrix = null,
  phiApprovals = [],
  maxFixAttempts = 2,
} = {}) {
  if (!stage) {
    throw new Error(`regulatedStageExit: stage is required (got ${JSON.stringify(stage)})`);
  }
  if (!requirements) {
    throw new Error(`regulatedStageExit(${stage}): requirements is required — the trace diff is computed against the SRS requirement set`);
  }

  // (1) EXECUTED traceability check — compute the stage matrix, then the diff.
  const matrix = await ctx.task(traceabilityMatrixTask, {
    requirements,
    ...verificationArtifacts,
  });

  const traceDiff = await ctx.task(traceDiffTask, {
    stage,
    matrix,
    previousMatrix,
    requirements,
    phiApprovals,
  });

  // (2) Adversarial gate over the EXECUTED artifact (imported combinator).
  const gateResult = await adversarialGate(ctx, {
    gateId: `crg.${stage}.traceability`,
    artifact: {
      path: `artifacts/crg/${stage}/trace-diff.json`,
      description: 'Executed requirement-to-verification traceability diff',
    },
    critics: [
      {
        name: 'traceability-critic',
        role: 'Compliance traceability auditor',
        focus: 'every SRS requirement traces to a designed AND (post-implementation stages) executed verification artifact; uncovered/regressions must be zero',
      },
      {
        name: 'phi-provenance-critic',
        role: 'PHI provenance auditor',
        focus: 'every artifact touching PHI-derived data cites a recorded phi-data-access-approval breakpoint id',
      },
    ],
    ironLaw: [
      'Re-run the trace computation yourself or cite the executed trace-diff.json line-by-line; prose claims of coverage are not evidence.',
    ],
    maxFixAttempts,
    fixer: {},
    context: { stage, traceDiff, phiApprovals },
  });

  // Gate failure blocks the stage. Escalation already happened inside the
  // combinator (owner breakpoint); a still-failed gate means the owner
  // rejected too — there is no pass-anyway path.
  if (gateResult.passed !== true) {
    throw new Error(`Stage exit BLOCKED: adversarial gate crg.${stage}.traceability failed after ${gateResult.attempts} attempt(s) (escalated: ${gateResult.escalated}). Issues: ${JSON.stringify(gateResult.issues)}`);
  }

  // (3) qa-lead sign-off. The payload is constructed FROM the executed gate
  // result — it cannot be built without it.
  if (typeof gateResult.passed !== 'boolean' || typeof gateResult.attempts !== 'number' || !Array.isArray(gateResult.evidence)) {
    throw new Error(`regulatedStageExit(${stage}): executed gate result is malformed — sign-off without traceability evidence is structurally impossible`);
  }
  const signoff = await routedBreakpoint(ctx, {
    question: `Stage exit sign-off for "${stage}": trace diff covers ${traceDiff.coveredCount} requirement(s), ${traceDiff.uncovered.length} uncovered, ${traceDiff.regressions.length} regression(s); adversarial gate passed in ${gateResult.attempts} attempt(s). Approve stage exit?`,
    stage,
    traceDiff,
    gateResult: {
      passed: gateResult.passed,
      attempts: gateResult.attempts,
      escalated: gateResult.escalated,
      evidence: gateResult.evidence,
    },
    artifacts,
  }, {
    breakpointId: `crg.stage-exit.${stage}`,
    expert: 'qa-lead',
    tags: ['crg', 'policy-gated', 'stage-exit', stage],
    strategy: 'single',
  });

  // (4) Rejected sign-off throws — no skip-ahead fallback.
  if (signoff.approved !== true) {
    const notes = signoff.response ?? signoff.feedback ?? 'no reviewer notes';
    throw new Error(`Stage exit REJECTED by qa-lead for "${stage}": ${notes}`);
  }

  return { stage, matrix, traceDiff, gateResult, signoff };
}

// ---------------------------------------------------------------------------
// Internal: bounded verification-level runner (Stage 5)
// ---------------------------------------------------------------------------

function levelResultPassed(result, level) {
  const keyByLevel = {
    unit: 'unitTests',
    integration: 'integrationTests',
    system: 'systemTests',
    acceptance: 'acceptanceTests',
  };
  const key = keyByLevel[level];
  const levelResult = result && result.testResults ? result.testResults[key] : undefined;
  return Boolean(levelResult && levelResult.passed === true);
}

async function runVerificationLevel(ctx, level, taskArgs, { maxFixAttempts, escalationId }) {
  let result = await ctx.task(executeTestsTask, { ...taskArgs, level });
  let attempt = 0;
  while (!levelResultPassed(result, level) && attempt < maxFixAttempts) {
    attempt += 1;
    await ctx.task(fixVerificationTask, {
      level,
      attempt,
      failures: result.testResults ?? result,
      implementation: taskArgs.implementation,
      context: { escalationId },
    });
    result = await ctx.task(executeTestsTask, { ...taskArgs, level });
  }
  if (!levelResultPassed(result, level)) {
    // Exhausted the fix budget — escalate, never auto-pass.
    const escalation = await routedBreakpoint(ctx, {
      question: `${level}-level verification still failing after ${attempt} fix attempt(s). Accept the current results and continue, or reject (stops the run)?`,
      level,
      results: result.testResults ?? result,
    }, {
      breakpointId: escalationId,
      expert: 'owner',
      tags: ['crg', 'verification', 'escalation', level],
      strategy: 'single',
    });
    if (escalation.approved !== true) {
      throw new Error(`Verification level "${level}" failed after ${attempt} fix attempt(s) and the owner rejected continuing.`);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// process — the composition orchestrator
// ---------------------------------------------------------------------------

/**
 * Regulated greenfield composition orchestrator. Stages are strictly
 * sequential; ctx.parallel.all is used only WITHIN a stage.
 *
 * @param {object} inputs - See @inputs
 * @param {object} ctx - Babysitter process context
 * @returns {Promise<object>} See @outputs
 */
export async function process(inputs, ctx) {
  const {
    projectRequirements,
    phiComponents = [],
    boundedContextsHint = [],
    complianceStandards = ['HIPAA Security Rule', 'HIPAA Privacy Rule'],
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
    maxFixAttempts = 2,
  } = inputs ?? {};

  // No fallbacks: empty requirements is a caller bug, not a defaultable input.
  if (!projectRequirements || (typeof projectRequirements === 'string' && projectRequirements.trim().length === 0)) {
    throw new Error('composition-regulated-greenfield: projectRequirements is required and must be non-empty');
  }

  const projectName = 'regulated-greenfield-patient-portal';
  const safetyLevel = 'high';
  const testingRigor = 'high';

  const phiApprovals = [];        // PHI approval provenance log (threaded into PHI task contexts)
  const stageSignoffs = {};       // per-stage breakpoint results
  const traceabilityMatrices = {}; // per-stage computed matrices
  const gateAttempts = {};        // per-stage adversarial-gate attempts
  let escalations = 0;

  // -------------------------------------------------------------------------
  // Stage 0 — kip recall
  // -------------------------------------------------------------------------
  const recall = await kipRecall(ctx, {
    kipDir,
    topic: 'regulated-composition precedents: Cleanroom/V-Model interfaces, HIPAA traceability patterns',
    kipModel,
    kind: 'methodology-composition',
  });
  const kipInsights = recall.insights ?? [];

  // -------------------------------------------------------------------------
  // Stage 1 — Waterfall Requirements
  // -------------------------------------------------------------------------
  const srs = await ctx.task(requirementsGatheringTask, {
    projectName,
    projectDescription: projectRequirements,
    stakeholders: ['doctors', 'nurses', 'patients', 'administrators'],
    requirementsSource: projectRequirements,
    regulatoryCompliance: complianceStandards,
    kipInsights,
  });

  const requirementsPhase = await ctx.task(requirementsWithAcceptanceTask, {
    projectRequirements,
    safetyLevel,
    complianceStandards,
    existingArtifacts: { srs },
    kipInsights,
  });
  const requirements = requirementsPhase.requirements;
  const acceptanceTestDesign = requirementsPhase.acceptanceTestDesign;

  const phiInventory = await ctx.task(phiClassificationTask, {
    srs,
    requirements,
    phiComponentsHint: phiComponents,
    complianceStandards,
    kipInsights,
  });
  if (!Array.isArray(phiInventory.components) || phiInventory.components.length === 0) {
    throw new Error('composition-regulated-greenfield: crg.phi-classification produced no components — cannot plan PHI-safe stages');
  }

  const requirementsExit = await regulatedStageExit(ctx, 'requirements', {
    artifacts: ['artifacts/crg/requirements/trace-diff.json'],
    requirements,
    verificationArtifacts: { acceptanceTestDesign, complianceStandards },
    previousMatrix: null,
    phiApprovals,
    maxFixAttempts,
  });
  stageSignoffs.requirements = requirementsExit.signoff;
  traceabilityMatrices.requirements = requirementsExit.matrix;
  gateAttempts.requirements = requirementsExit.gateResult.attempts;
  if (requirementsExit.gateResult.escalated) escalations += 1;

  // -------------------------------------------------------------------------
  // Stage 2 — DDD Clinical-Domain Modeling
  // -------------------------------------------------------------------------
  const subdomains = await ctx.task(identifySubdomainsTask, {
    projectName,
    domainDescription: projectRequirements,
    complexity: 'complex',
    existingDomainModel: null,
  });

  const boundedContextsResult = await ctx.task(defineBoundedContextsTask, {
    projectName,
    subdomains,
    domainDescription: projectRequirements,
    complexity: 'complex',
    boundedContextsHint,
  });
  const boundedContexts = boundedContextsResult.boundedContexts;
  if (!Array.isArray(boundedContexts) || boundedContexts.length === 0) {
    throw new Error('composition-regulated-greenfield: defineBoundedContextsTask returned no bounded contexts');
  }

  const contextMap = await ctx.task(createContextMapTask, {
    projectName,
    boundedContexts: boundedContextsResult,
    subdomains,
  });

  const ubiquitousLanguage = await ctx.task(buildUbiquitousLanguageTask, {
    projectName,
    domainDescription: projectRequirements,
    boundedContexts: boundedContextsResult,
    subdomains,
    phase: 'initial',
  });

  // Tactical modeling per bounded context — parallel WITHIN the stage.
  const tacticalResults = await ctx.parallel.all(
    boundedContexts.map((boundedContext) => async () => {
      const entitiesValueObjects = await ctx.task(identifyEntitiesValueObjectsTask, {
        projectName,
        boundedContext,
        ubiquitousLanguage,
        domainDescription: projectRequirements,
      });
      const aggregates = await ctx.task(defineAggregatesTask, {
        projectName,
        boundedContext,
        entities: entitiesValueObjects.entities,
        valueObjects: entitiesValueObjects.valueObjects,
        ubiquitousLanguage,
      });
      const domainEvents = await ctx.task(identifyDomainEventsTask, {
        projectName,
        strategicDesign: { subdomains, boundedContexts: boundedContextsResult, contextMap },
        tacticalDesign: { boundedContext, entitiesValueObjects, aggregates },
        ubiquitousLanguage,
      });
      return { boundedContext, entitiesValueObjects, aggregates, domainEvents };
    })
  );

  const languageValidation = await ctx.task(validateLanguageConsistencyTask, {
    projectName,
    ubiquitousLanguage,
    strategicDesign: { subdomains, boundedContexts: boundedContextsResult, contextMap },
    tacticalDesign: tacticalResults,
    domainEvents: tacticalResults.map((t) => t.domainEvents),
  });

  const systemDesignPhase = await ctx.task(systemDesignWithSystemTestTask, {
    requirements,
    acceptanceTestDesign,
    safetyLevel,
    testingRigor,
    complianceStandards,
    contextMap,
  });
  const systemDesign = systemDesignPhase.systemDesign;
  const systemTestDesign = systemDesignPhase.systemTestDesign;

  const domainModel = {
    strategicDesign: { subdomains, boundedContexts: boundedContextsResult, contextMap },
    tacticalDesign: tacticalResults,
    ubiquitousLanguage,
    languageValidation,
  };

  const domainModelingExit = await regulatedStageExit(ctx, 'domain-modeling', {
    artifacts: ['artifacts/crg/domain-modeling/trace-diff.json'],
    requirements,
    verificationArtifacts: { acceptanceTestDesign, systemDesign, systemTestDesign, complianceStandards },
    previousMatrix: traceabilityMatrices.requirements,
    phiApprovals,
    maxFixAttempts,
  });
  stageSignoffs['domain-modeling'] = domainModelingExit.signoff;
  traceabilityMatrices['domain-modeling'] = domainModelingExit.matrix;
  gateAttempts['domain-modeling'] = domainModelingExit.gateResult.attempts;
  if (domainModelingExit.gateResult.escalated) escalations += 1;

  // -------------------------------------------------------------------------
  // Stage 3 — Cleanroom Formal Specification (PHI components)
  // -------------------------------------------------------------------------

  // GUARD FIRST: the phi-data-access-approval breakpoint is raised BEFORE any
  // task is scheduled with PHI-derived data in its context. Rejection throws.
  if (!Array.isArray(phiInventory.datasets) || phiInventory.datasets.length === 0) {
    throw new Error('composition-regulated-greenfield: crg.phi-classification produced no PHI datasets — the regulated composition requires an explicit (possibly justified-empty) dataset inventory, and an empty one cannot gate Stage 3');
  }
  const stage3Approval = await requirePhiApproval(
    ctx,
    'formal specification against PHI-shaped schemas/derived samples',
    phiInventory.datasets,
    { requestingStage: 'stage-3-cleanroom-spec', phiApprovals }
  );

  const phiComponentList = phiInventory.components.filter((c) => c.handlesPhi === true);
  if (phiComponentList.length === 0) {
    throw new Error('composition-regulated-greenfield: no PHI-handling components classified — this composition targets regulated systems; use a lighter methodology for PHI-free builds');
  }

  // Per PHI component: formal spec -> design-with-verification with a bounded
  // fixDesignTask loop; exhaustion escalates via routedBreakpoint.
  const formalSpecResults = await ctx.parallel.all(
    phiComponentList.map((component, index) => async () => {
      const spec = await ctx.task(createFormalSpecificationTask, {
        projectName,
        systemDescription: projectRequirements,
        criticalComponents: [component.name],
        includeProofOfCorrectness: true,
        phiApproval: stage3Approval,
        component,
      });

      let designResult = await ctx.task(designWithVerificationTask, {
        projectName,
        increment: component.name,
        incrementNumber: index + 1,
        specifications: spec,
        previousIncrements: [],
        includeProofOfCorrectness: true,
        phiApproval: stage3Approval,
      });

      let fixAttempt = 0;
      while (designResult.verificationPassed !== true && fixAttempt < maxFixAttempts) {
        fixAttempt += 1;
        const fixed = await ctx.task(fixDesignTask, {
          projectName,
          increment: component.name,
          incrementNumber: index + 1,
          designResult,
          verificationIssues: designResult.verificationIssues,
        });
        designResult = { ...designResult, ...fixed };
      }
      if (designResult.verificationPassed !== true) {
        const escalation = await routedBreakpoint(ctx, {
          question: `Cleanroom design verification for PHI component "${component.name}" still failing after ${fixAttempt} fix attempt(s). Accept the design anyway, or reject (stops the run)?`,
          component: component.name,
          verificationIssues: designResult.verificationIssues,
        }, {
          breakpointId: `crg.stage-3.design-escalation.${component.name}`,
          expert: 'owner',
          tags: ['crg', 'cleanroom', 'escalation', component.name],
          strategy: 'single',
        });
        if (escalation.approved !== true) {
          throw new Error(`Cleanroom design verification failed for PHI component "${component.name}" after ${fixAttempt} fix attempt(s) and the owner rejected continuing — never silently accept.`);
        }
        escalations += 1;
      }

      return { component, spec, designResult };
    })
  );

  // V-Model left side pairing: architecture<->integration, detailed-design<->unit.
  const architecturePhase = await ctx.task(architectureWithIntegrationTestTask, {
    systemDesign,
    systemTestDesign,
    requirements,
    safetyLevel,
    testingRigor,
  });
  const architecture = architecturePhase.architecture;
  const integrationTestDesign = architecturePhase.integrationTestDesign;

  const moduleDesignResults = await ctx.parallel.all(
    phiInventory.components.map((component) => async () => {
      const result = await ctx.task(moduleDesignWithUnitTestTask, {
        module: { name: component.name, handlesPhi: component.handlesPhi === true },
        architecture,
        requirements,
        safetyLevel,
        testingRigor,
      });
      return { component, moduleDesign: result.moduleDesign, unitTestDesign: result.unitTestDesign };
    })
  );
  const unitTestDesigns = moduleDesignResults.map((m) => m.unitTestDesign);

  const formalSpecs = {
    perComponent: formalSpecResults,
    architecture,
    integrationTestDesign,
    moduleDesigns: moduleDesignResults,
  };

  const formalSpecificationExit = await regulatedStageExit(ctx, 'formal-specification', {
    artifacts: ['artifacts/crg/formal-specification/trace-diff.json'],
    requirements,
    verificationArtifacts: {
      acceptanceTestDesign,
      systemDesign,
      systemTestDesign,
      architecture,
      integrationTestDesign,
      moduleDesigns: moduleDesignResults.map((m) => m.moduleDesign),
      unitTestDesigns,
      complianceStandards,
    },
    previousMatrix: traceabilityMatrices['domain-modeling'],
    phiApprovals,
    maxFixAttempts,
  });
  stageSignoffs['formal-specification'] = formalSpecificationExit.signoff;
  traceabilityMatrices['formal-specification'] = formalSpecificationExit.matrix;
  gateAttempts['formal-specification'] = formalSpecificationExit.gateResult.attempts;
  if (formalSpecificationExit.gateResult.escalated) escalations += 1;

  // -------------------------------------------------------------------------
  // Stage 4 — Implementation
  // -------------------------------------------------------------------------

  // Re-guard: approvals are per-dataset, never generalized. Datasets already
  // approved in Stage 3 are covered by recorded provenance; any new dataset
  // would raise the breakpoint again BEFORE implementation tasks schedule.
  const stage4Approval = await requirePhiApproval(
    ctx,
    'implementation and unit-test execution against PHI-derived test data',
    phiInventory.datasets,
    { requestingStage: 'stage-4-implementation', phiApprovals }
  );

  const implementationResults = await ctx.parallel.all(
    phiInventory.components.map((component) => async () => {
      const isPhi = component.handlesPhi === true;
      const specEntry = formalSpecResults.find((s) => s.component.name === component.name);
      const moduleEntry = moduleDesignResults.find((m) => m.component.name === component.name);
      const impl = await ctx.task(implementComponentTask, {
        component,
        formalSpec: isPhi && specEntry ? specEntry.spec : null,
        moduleDesign: moduleEntry ? moduleEntry.moduleDesign : null,
        unitTestDesign: moduleEntry ? moduleEntry.unitTestDesign : null,
        phiApproval: isPhi ? stage4Approval : null,
        requirements,
      });
      return { component, impl };
    })
  );

  const implementation = {
    perComponent: implementationResults,
    filesChanged: implementationResults.flatMap((r) => r.impl.filesChanged ?? []),
  };

  const implementationExit = await regulatedStageExit(ctx, 'implementation', {
    artifacts: ['artifacts/crg/implementation/trace-diff.json'],
    requirements,
    verificationArtifacts: {
      acceptanceTestDesign,
      systemDesign,
      systemTestDesign,
      architecture,
      integrationTestDesign,
      moduleDesigns: moduleDesignResults.map((m) => m.moduleDesign),
      unitTestDesigns,
      implementation,
      complianceStandards,
    },
    previousMatrix: traceabilityMatrices['formal-specification'],
    phiApprovals,
    maxFixAttempts,
  });
  stageSignoffs.implementation = implementationExit.signoff;
  traceabilityMatrices.implementation = implementationExit.matrix;
  gateAttempts.implementation = implementationExit.gateResult.attempts;
  if (implementationExit.gateResult.escalated) escalations += 1;

  // -------------------------------------------------------------------------
  // Stage 5 — V-Model Paired Verification (levels sequential, components parallel)
  // -------------------------------------------------------------------------

  // (a) UNIT <-> DETAILED-DESIGN — per component in parallel; PHI components
  // additionally go through Cleanroom code inspection with a bounded
  // fixImplementationTask loop, then escalation.
  const unitResults = await ctx.parallel.all(
    phiInventory.components.map((component, index) => async () => {
      const entry = implementationResults.find((r) => r.component.name === component.name);
      const moduleEntry = moduleDesignResults.find((m) => m.component.name === component.name);
      const specEntry = formalSpecResults.find((s) => s.component.name === component.name);

      const testRun = await runVerificationLevel(ctx, 'unit', {
        implementation: entry ? entry.impl : null,
        unitTestDesigns: moduleEntry ? [moduleEntry.unitTestDesign] : [],
        requirements,
        testingRigor,
        safetyLevel,
      }, {
        maxFixAttempts,
        escalationId: `crg.stage-5.unit-escalation.${component.name}`,
      });

      let inspection = null;
      if (component.handlesPhi === true) {
        inspection = await ctx.task(codeInspectionTask, {
          projectName,
          increment: component.name,
          incrementNumber: index + 1,
          implementation: entry ? entry.impl : null,
          design: specEntry ? specEntry.designResult : null,
          specifications: specEntry ? specEntry.spec : null,
        });
        let inspectionFix = 0;
        while (inspection.criticalDefects > 0 && inspectionFix < maxFixAttempts) {
          inspectionFix += 1;
          await ctx.task(fixImplementationTask, {
            projectName,
            increment: component.name,
            incrementNumber: index + 1,
            implementation: entry ? entry.impl : null,
            defects: (inspection.defects ?? []).filter((d) => d.severity === 'critical'),
          });
          inspection = await ctx.task(codeInspectionTask, {
            projectName,
            increment: component.name,
            incrementNumber: index + 1,
            implementation: entry ? entry.impl : null,
            design: specEntry ? specEntry.designResult : null,
            specifications: specEntry ? specEntry.spec : null,
          });
        }
        if (inspection.criticalDefects > 0) {
          const escalation = await routedBreakpoint(ctx, {
            question: `Cleanroom code inspection for PHI component "${component.name}" still reports ${inspection.criticalDefects} critical defect(s) after ${inspectionFix} fix attempt(s). Accept and continue, or reject (stops the run)?`,
            component: component.name,
            defects: inspection.defects,
          }, {
            breakpointId: `crg.stage-5.inspection-escalation.${component.name}`,
            expert: 'owner',
            tags: ['crg', 'cleanroom', 'inspection', 'escalation'],
            strategy: 'single',
          });
          if (escalation.approved !== true) {
            throw new Error(`Code inspection failed for PHI component "${component.name}" with unresolved critical defects and the owner rejected continuing — never auto-pass.`);
          }
          escalations += 1;
        }
      }

      return { component, testRun, inspection };
    })
  );

  // (b) INTEGRATION <-> ARCHITECTURE — parallel over integration suites.
  const integrationSuites = Array.isArray(integrationTestDesign?.testSuites) && integrationTestDesign.testSuites.length > 0
    ? integrationTestDesign.testSuites
    : [integrationTestDesign];
  const integrationResults = await ctx.parallel.all(
    integrationSuites.map((suite, index) => async () =>
      runVerificationLevel(ctx, 'integration', {
        implementation,
        integrationTestDesign: suite,
        requirements,
        testingRigor,
        safetyLevel,
      }, {
        maxFixAttempts,
        escalationId: `crg.stage-5.integration-escalation.suite-${index + 1}`,
      })
    )
  );

  // (c) SYSTEM <-> REQUIREMENTS, then ACCEPTANCE against Stage-1 designs.
  const systemResult = await runVerificationLevel(ctx, 'system', {
    implementation,
    systemTestDesign,
    requirements,
    testingRigor,
    safetyLevel,
  }, {
    maxFixAttempts,
    escalationId: 'crg.stage-5.system-escalation',
  });

  const acceptanceResult = await runVerificationLevel(ctx, 'acceptance', {
    implementation,
    acceptanceTestDesign,
    requirements,
    testingRigor,
    safetyLevel,
  }, {
    maxFixAttempts,
    escalationId: 'crg.stage-5.acceptance-escalation',
  });

  const verification = {
    unit: unitResults,
    integration: integrationResults,
    system: systemResult,
    acceptance: acceptanceResult,
  };

  const verificationExit = await regulatedStageExit(ctx, 'verification', {
    artifacts: ['artifacts/crg/verification/trace-diff.json'],
    requirements,
    verificationArtifacts: {
      acceptanceTestDesign,
      systemDesign,
      systemTestDesign,
      architecture,
      integrationTestDesign,
      moduleDesigns: moduleDesignResults.map((m) => m.moduleDesign),
      unitTestDesigns,
      implementation,
      testResults: verification,
      complianceStandards,
    },
    previousMatrix: traceabilityMatrices.implementation,
    phiApprovals,
    maxFixAttempts,
  });
  stageSignoffs.verification = verificationExit.signoff;
  traceabilityMatrices.verification = verificationExit.matrix;
  gateAttempts.verification = verificationExit.gateResult.attempts;
  if (verificationExit.gateResult.escalated) escalations += 1;

  // -------------------------------------------------------------------------
  // Stage 6 — Sign-off and Production Deploy
  // -------------------------------------------------------------------------
  const finalMatrix = await ctx.task(traceabilityMatrixTask, {
    requirements,
    systemDesign,
    architecture,
    moduleDesigns: moduleDesignResults.map((m) => m.moduleDesign),
    implementation,
    unitTestDesigns,
    integrationTestDesign,
    systemTestDesign,
    acceptanceTestDesign,
    testResults: verification,
    complianceStandards,
  });
  traceabilityMatrices.final = finalMatrix;

  const openIssueCount = (Array.isArray(acceptanceResult?.testResults?.acceptanceTests?.results)
    ? acceptanceResult.testResults.acceptanceTests.results.filter((r) => r && r.passed === false).length
    : 0);

  const deployDecision = await routedBreakpoint(ctx, {
    question: 'Production deploy of the regulated greenfield build: the full traceability matrix, all stage sign-offs, and the PHI approval provenance log are attached. Approve production deployment?',
    traceabilityMatrix: finalMatrix,
    stageSignoffs,
    phiApprovals,
    openIssueCount,
  }, {
    breakpointId: 'crg.production-deploy',
    expert: 'compliance-officer',
    tags: ['crg', 'policy-gated', 'deploy', 'hipaa'],
    strategy: 'single',
    // NEVER auto-executes: no autoApproveAfterN, no presentAlwaysApprove.
  });
  stageSignoffs['production-deploy'] = deployDecision;

  // Guarded deploy executor: deploymentTask runs ONLY on approved === true.
  let deployment = null;
  let success = false;
  if (deployDecision.approved === true) {
    deployment = await ctx.task(deploymentTask, {
      projectName,
      requirements: srs,
      design: { systemDesign, architecture, formalSpecs },
      testing: verification,
      deploymentTarget: 'production',
      regulatoryCompliance: complianceStandards,
    });
    success = true;
  }
  // On rejection: deployment stays null, success stays false — no fallback
  // deploy path exists in this process.

  // kip assert — durable composition + run-outcome facts (both outcomes).
  const stagesPassed = Object.keys(stageSignoffs).filter((s) => s !== 'production-deploy');
  await kipAssert(ctx, {
    kipDir,
    kipModel,
    kind: 'methodology-composition',
    facts: [
      { subject: 'process:composition-regulated-greenfield', predicate: 'composes', object: 'methodology:waterfall' },
      { subject: 'process:composition-regulated-greenfield', predicate: 'composes', object: 'methodology:domain-driven-design' },
      { subject: 'process:composition-regulated-greenfield', predicate: 'composes', object: 'methodology:cleanroom' },
      { subject: 'process:composition-regulated-greenfield', predicate: 'composes', object: 'methodology:v-model' },
      {
        subject: 'methodology:cleanroom',
        predicate: 'feeds',
        object: 'methodology:v-model',
        props: { interface: 'cleanroom formal specs feed v-model unit<->detailed-design pairing per PHI component' },
      },
      { subject: 'process:composition-regulated-greenfield', predicate: 'enforces-pattern', object: 'pattern:stage-exit-signoff-requires-executed-trace-diff' },
      { subject: 'process:composition-regulated-greenfield', predicate: 'enforces-pattern', object: 'pattern:phi-data-access-approval-provenance-threading' },
      {
        subject: `run:${ctx.runId}`,
        predicate: 'run-outcome',
        object: 'process:composition-regulated-greenfield',
        props: {
          stagesPassed,
          gateAttempts,
          escalations,
          phiApprovalCount: phiApprovals.length,
          deployed: success,
        },
      },
    ],
  });

  return {
    success,
    srs,
    domainModel,
    formalSpecs,
    implementation,
    verification,
    traceabilityMatrices,
    stageSignoffs,
    deployment,
    metadata: {
      process: 'methodologies/composition-regulated-greenfield',
      projectName,
      complianceStandards,
      phiApprovals,
      gateAttempts,
      escalations,
      kipRecallFactCount: recall.factCount,
    },
  };
}
