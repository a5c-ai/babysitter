/**
 * @process methodologies/composition-aerospace-flight-control
 * @description DO-178C flight-control software composition (backlog Example 6): Waterfall
 *   system/software requirements capture -> V-Model decomposition with per-level verification
 *   plans -> Cleanroom incremental development with statistical usage testing -> INLINE formal
 *   verification of critical properties (parallel per-property proofs with EXECUTED proof-checker
 *   output) -> certification evidence assembly with an independent adversarial certification gate
 *   -> flight-software baseline release. Every stage exit is guarded by an EXECUTED
 *   requirement-to-verification traceability gate plus a routed verification-lead sign-off;
 *   safety-requirement waivers, DER certification sign-off, and baseline release are policy-gated,
 *   fail-closed human approvals that never auto-execute. Pairs with composition-regulated-greenfield
 *   to complete the safety/compliance quadrant. The formal-verification ingredient is modeled INLINE
 *   as caf.* tasks per the batch-3 strangler-fig precedent (composition-legacy-modernization) because
 *   no library/methodologies/formal-verification/ dir exists.
 * @inputs { systemRequirements: string, dalLevelHint?: string, flightControlFunctions?: string[], criticalPropertiesHint?: string[], complianceStandards?: string[] (default ['DO-178C']), incrementCountHint?: number, kipDir?: string, kipModel?: string, maxFixAttempts?: number (default 2), maxProofAttempts?: number (default 2) }
 * @outputs { success: boolean, srs: object, safetyAssessment: object, vModelDesign: object, cleanroomDevelopment: object, formalVerification: object, verification: object, traceabilityMatrices: object, waivers: array, certificationEvidence: object|null, signoffs: object, baselineRelease: object|null, metadata: object }
 * @graph
 *   domains: [domain:software-engineering, domain:aerospace]
 *   specializations: [specialization:qa-testing-automation]
 *   skillAreas: [skill-area:formal-verification, skill-area:acceptance-testing, skill-area:integration-testing]
 *   workflows: [workflow:release-management]
 *   topics: [topic:compliance-traceability, topic:do-178c-certification]
 *   roles: [role:safety-engineer, role:verification-lead, role:chief-engineer]
 *
 * Policy-gated actions (adapters/policy ready):
 *   - requirement-waiver-approval        (expert: certification-liaison)                  — approve any waiver/deviation from a captured safety requirement or DO-178C objective
 *   - certification-evidence-signoff     (expert: designated-engineering-representative)  — sign off the assembled DO-178C certification evidence package
 *   - flight-software-baseline-release   (expert: chief-engineer)                         — approve release of a flight-software baseline for integration or flight test
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
// composition uses NEITHER module's 'implementation' task — Cleanroom's
// implementIncrementTask does implementation — so the two modules are imported
// sequentially and the inert colliding definition is cleared between them.
// Nothing else collides across waterfall/v-model/cleanroom.
const waterfallModule = await import('../waterfall/waterfall.js');
const { requirementsGatheringTask } = waterfallModule;
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
  planIncrementsTask,
  createFormalSpecificationTask,
  designWithVerificationTask,
  fixDesignTask,
  implementIncrementTask,
  codeInspectionTask,
  fixImplementationTask,
  createUsageModelTask,
  generateStatisticalTestsTask,
  executeStatisticalTestsTask,
  analyzeReliabilityTask,
} from '../cleanroom/cleanroom.js';

// Cleanroom statistical certification needs an explicit reliability target; the
// authoritative pass/fail signal is analyzeReliabilityTask's targetMet, not this
// constant — a missed target routes through requireSafetyWaiver, never silent.
const RELIABILITY_TARGET_HOURS = 100000;
const STATISTICAL_CONFIDENCE = 0.99;
const PROJECT_NAME = 'aerospace-flight-control';
const SAFETY_LEVEL = 'critical';
const TESTING_RIGOR = 'high';

/**
 * Extract stable ids from a heterogeneous list of requirement/property records
 * (objects with id/requirementId/propertyId/name, or bare string ids).
 * @param {Array<object|string>} list
 * @returns {string[]}
 */
function extractIds(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((x) => (x && typeof x === 'object' ? (x.id ?? x.requirementId ?? x.propertyId ?? x.name) : x))
    .filter((x) => typeof x === 'string' && x.length > 0);
}

// ---------------------------------------------------------------------------
// caf.* tasks — Style-A agent-only factories
// ---------------------------------------------------------------------------

/**
 * caf.safety-assessment — authoritative DO-178C safety assessment. Assigns the
 * software level (DAL A-E) per flight-control function from the SRS, derives the
 * safety-requirement inventory, and produces the authoritative criticalProperties
 * list that governs which properties go through formal verification. dalLevelHint
 * and criticalPropertiesHint are HINTS only — this task's output governs.
 *
 * @param {object} args - { srs, requirements, dalLevelHint, criticalPropertiesHint, flightControlFunctions, complianceStandards, kipInsights }
 * @returns {{softwareLevel: string, functions: array, safetyRequirements: array, criticalProperties: array, objectives: array, refutedHints: array, evidence: string[]}}
 */
export const safetyAssessmentTask = defineTask('caf.safety-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'DO-178C safety assessment: software-level assignment + critical properties',
  agent: {
    name: 'safety-assessment-engineer',
    prompt: {
      role: 'DO-178C safety assessment engineer (ARP4761 SSA/FHA framing)',
      task: 'Assess the flight-control software: assign the DO-178C software level per function, derive the safety-requirement inventory, and produce the authoritative critical-properties list',
      context: {
        srs: args.srs,
        requirements: args.requirements,
        dalLevelHint: args.dalLevelHint,
        criticalPropertiesHint: args.criticalPropertiesHint,
        flightControlFunctions: args.flightControlFunctions,
        complianceStandards: args.complianceStandards,
        kipInsights: args.kipInsights,
      },
      instructions: [
        'Derive failure conditions per flight-control function (ARP4761 FHA/SSA); map failure-condition severity (catastrophic/hazardous/major/minor/no-effect) to the software level (DAL A-E).',
        'dalLevelHint and criticalPropertiesHint are HINTS ONLY — confirm or refute every hinted entry against SRS text; the hint is never the authority.',
        'Every safety requirement and every critical property MUST cite the SRS requirement id it derives from; do not invent functions the SRS does not support.',
        'Report the DO-178C objective set implied by the assigned level (e.g. Level A adds MC/DC structural coverage and verification-independence objectives).',
        'List in refutedHints every caller-hinted safety requirement or critical property that the SRS does NOT support — these become explicit waiver candidates, never silently dropped.',
        'A flight-control build with no critical properties is a misuse of this methodology — if the SRS genuinely implies none, say so explicitly in evidence.',
      ],
      outputFormat: 'JSON with softwareLevel string, functions array, safetyRequirements array, criticalProperties array, objectives array, refutedHints array, evidence array of SRS citations',
    },
    outputSchema: {
      type: 'object',
      required: ['softwareLevel', 'functions', 'safetyRequirements', 'criticalProperties', 'objectives', 'evidence'],
      properties: {
        softwareLevel: { type: 'string' },
        functions: { type: 'array' },
        safetyRequirements: { type: 'array' },
        criticalProperties: { type: 'array' },
        objectives: { type: 'array' },
        refutedHints: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'caf', 'safety', 'do-178c'],
}));

/**
 * caf.level-verification-plan — per-V-Model-level verification plan (SVP section).
 * For one level (unit | integration | system | acceptance) define verification
 * methods, DO-178C independence requirements for the assigned software level, the
 * structural-coverage objective, the verified requirement subset, and the executed
 * evidence artifact the level must produce. Run under ctx.parallel across levels.
 *
 * @param {object} args - { level, safetyAssessment, requirements, pairedTestDesign }
 * @returns {{level: string, methods: array, independence: object, coverageObjective: string, requirementIds: string[], evidence: string[]}}
 */
export const levelVerificationPlanTask = defineTask('caf.level-verification-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verification plan: ${args.level} level`,
  agent: {
    name: 'verification-planner',
    prompt: {
      role: 'DO-178C verification planning engineer (SVP author)',
      task: `Define the verification plan for the "${args.level}" level`,
      context: {
        level: args.level,
        safetyAssessment: args.safetyAssessment,
        requirements: args.requirements,
        pairedTestDesign: args.pairedTestDesign,
      },
      instructions: [
        'Every plan entry must trace to requirement ids from the context.',
        'State who verifies and enforce DO-178C independence (verifier != developer) for the assigned software level (required for Level A/B objectives).',
        'Declare the structural-coverage objective for this level (statement / decision / MC/DC per DAL A-C).',
        'Declare the EXECUTED-evidence artifact the level must produce (the test-run output path) — the level gate will require it.',
        'Report requirementIds as the subset of requirements verified at this level.',
      ],
      outputFormat: 'JSON with level string, methods array, independence object, coverageObjective string, requirementIds array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['level', 'methods', 'independence', 'coverageObjective', 'requirementIds', 'evidence'],
      properties: {
        level: { type: 'string' },
        methods: { type: 'array' },
        independence: { type: 'object' },
        coverageObjective: { type: 'string' },
        requirementIds: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'caf', 'verification-planning'],
}));

/**
 * caf.trace-diff — COMPUTE (do not narrate) the requirement->verification set-diff
 * for a stage and write artifacts/caf/<stage>/trace-diff.json. Waiver-provenance
 * variant of crg.trace-diff: every waived requirement must cite a recorded
 * requirement-waiver-approval breakpoint event id.
 *
 * @param {object} args - { stage, matrix, previousMatrix, requirements, waivers }
 * @returns {{diffPath: string, coveredCount: number, uncovered: string[], orphanedVerifications: string[], regressions: string[], waivedRequirements: array, evidence: string[]}}
 */
export const traceDiffTask = defineTask('caf.trace-diff', (args, taskCtx) => ({
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
        waivers: args.waivers,
      },
      instructions: [
        'Load the stage traceability matrix and the prior stored matrix from the context; execute the set-diff of requirement ids vs verification artifact links — actually enumerate ids, do not summarize in prose.',
        `Write the computed diff to artifacts/caf/${args.stage}/trace-diff.json as {stage, coveredCount, uncovered:[reqIds], orphanedVerifications:[ids], regressions:[reqIds], waivedRequirements:[{reqId, waiverBreakpointEventId}]}.`,
        'uncovered = SRS requirement ids with no verification artifact link in the current matrix.',
        'orphanedVerifications = verification artifact ids in the current matrix that trace to no requirement id.',
        'regressions = requirement ids covered in the previous matrix but uncovered now (empty when there is no previous matrix).',
        'For every uncovered requirement that is intentionally waived, it MUST appear in waivedRequirements citing the exact recorded requirement-waiver-approval breakpoint event id from the waivers log in context — a waived-but-uncited requirement is a diff FAILURE.',
        'Report exact counts and the written file path; evidence cites the executed computation and the written file, not opinions.',
      ],
      outputFormat: 'JSON with diffPath string, coveredCount number, uncovered array, orphanedVerifications array, regressions array, waivedRequirements array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['diffPath', 'coveredCount', 'uncovered', 'orphanedVerifications', 'regressions', 'waivedRequirements', 'evidence'],
      properties: {
        diffPath: { type: 'string' },
        coveredCount: { type: 'number' },
        uncovered: { type: 'array' },
        orphanedVerifications: { type: 'array' },
        regressions: { type: 'array' },
        waivedRequirements: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'caf', 'traceability'],
}));

/**
 * caf.formal-property-extraction — INLINE formal verification step 1: derive the
 * formally verifiable property set from the authoritative criticalProperties list,
 * safety requirements, and Cleanroom formal specifications.
 *
 * @param {object} args - { criticalProperties, safetyRequirements, formalSpecs, requirements }
 * @returns {{properties: array, unformalizable: array, evidence: string[]}}
 */
export const formalPropertyExtractionTask = defineTask('caf.formal-property-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'INLINE formal verification: property extraction',
  agent: {
    name: 'formal-property-extractor',
    prompt: {
      role: 'Formal methods engineer (safety-critical property extraction)',
      task: 'Derive the formally verifiable property set for the flight-control software',
      context: {
        criticalProperties: args.criticalProperties,
        safetyRequirements: args.safetyRequirements,
        formalSpecs: args.formalSpecs,
        requirements: args.requirements,
      },
      instructions: [
        'From the authoritative criticalProperties list + safety requirements + Cleanroom formal (box-structure) specifications, derive the verifiable property set: safety invariants (e.g. actuator command bounds, mode-exclusion), liveness/timing properties (control-loop deadline), and numerical-stability properties.',
        'Each property gets {propertyId, kind: invariant|liveness|timing, formalStatement, sourceRequirementIds, componentScope, checkerStrategy: model-check|proof-obligation|abstract-interpretation}.',
        'Every property MUST trace to at least one safetyRequirement id; do not extract properties with no requirement grounding.',
        'Flag in unformalizable any critical property from caf.safety-assessment that yielded NO formalizable statement — {propertyId, sourceRequirementIds, reason}; these become explicit waiver candidates, never silently dropped.',
      ],
      outputFormat: 'JSON with properties array, unformalizable array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['properties', 'unformalizable', 'evidence'],
      properties: {
        properties: { type: 'array', minItems: 1 },
        unformalizable: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'caf', 'formal-verification'],
}));

/**
 * caf.formal-model-construction — INLINE formal verification step 2 (per property,
 * inside ctx.parallel): construct the analyzable model/annotation set for one
 * property, grounded in the Cleanroom box-structure spec and the increment impl.
 *
 * @param {object} args - { property, cleanroomSpec, implementation }
 * @returns {{propertyId: string, modelPath: string, assumptions: array, evidence: string[]}}
 */
export const formalModelConstructionTask = defineTask('caf.formal-model-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: `Formal model: ${args.property.propertyId}`,
  agent: {
    name: 'formal-model-constructor',
    prompt: {
      role: 'Formal methods engineer (model / annotation construction)',
      task: `Construct the analyzable model for property "${args.property.propertyId}"`,
      context: {
        property: args.property,
        cleanroomSpec: args.cleanroomSpec,
        implementation: args.implementation,
      },
      instructions: [
        'Construct the analyzable model/annotation set for exactly ONE property: a state-machine or transition-system model, contract annotations, or proof obligations.',
        'Ground the model in the Cleanroom box-structure specification and the increment implementation for the property componentScope — do not model behavior the code does not have.',
        `Write the model to artifacts/caf/formal/${args.property.propertyId}/model.json (or .smv/.tla-style text captured inside that artifact) so the proof task has a concrete input.`,
        'Record every modeling assumption explicitly — an unstated assumption invalidates the proof.',
      ],
      outputFormat: 'JSON with propertyId string, modelPath string, assumptions array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['propertyId', 'modelPath', 'assumptions', 'evidence'],
      properties: {
        propertyId: { type: 'string' },
        modelPath: { type: 'string' },
        assumptions: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'caf', 'formal-verification'],
}));

/**
 * caf.property-proof — INLINE formal verification step 3 (per property, inside
 * ctx.parallel): EXECUTE the proof check over the constructed model and CAPTURE the
 * executed checker output verbatim to artifacts/caf/formal/<propertyId>/proof-output.json.
 * The gate requires this executed output — prose claims of 'proved' are insufficient.
 *
 * @param {object} args - { property, model, attempt }
 * @returns {{propertyId: string, proofStatus: string, proofOutputPath: string, executionRecord: object, counterexample: object|null, evidence: string[]}}
 */
export const propertyProofTask = defineTask('caf.property-proof', (args, taskCtx) => ({
  kind: 'agent',
  title: `Property proof (EXECUTED): ${args.property.propertyId}`,
  agent: {
    name: 'property-prover',
    prompt: {
      role: 'Formal methods engineer executing the proof check',
      task: `EXECUTE the proof check for property "${args.property.propertyId}" and capture the raw output`,
      context: {
        property: args.property,
        model: args.model,
        attempt: args.attempt,
      },
      instructions: [
        'EXECUTE, do not narrate — actually run the property analysis over the constructed model: exhaustive state enumeration for finite models, discharge of proof obligations, or bounded exploration with an explicitly reported bound.',
        `CAPTURE the executed checker output verbatim to artifacts/caf/formal/${args.property.propertyId}/proof-output.json as {propertyId, proofStatus, executionRecord:{statesExplored|obligationsDischarged, bound, wallTime}, counterexample|null}.`,
        'proofStatus is proved | falsified | inconclusive. Never report proved without the captured execution record.',
        'inconclusive with an honest bound is acceptable output; a fabricated "proved" is not.',
        'falsified MUST include the concrete minimal counterexample trace usable by caf.fix-formal.',
      ],
      outputFormat: 'JSON with propertyId string, proofStatus string, proofOutputPath string, executionRecord object, counterexample object-or-null, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['propertyId', 'proofStatus', 'proofOutputPath', 'executionRecord', 'counterexample', 'evidence'],
      properties: {
        propertyId: { type: 'string' },
        proofStatus: { type: 'string', enum: ['proved', 'falsified', 'inconclusive'] },
        proofOutputPath: { type: 'string' },
        executionRecord: { type: 'object' },
        counterexample: { type: ['object', 'null'] },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'caf', 'formal-verification', 'executed-proof'],
}));

/**
 * caf.fix-formal — bounded fix-loop body for falsified/inconclusive proofs:
 * counterexample-driven remediation of the implementation/spec/model for ONE
 * property only. Also serves as the fixer for the caf.formal.proof-audit gate.
 *
 * @param {object} args - generic gate-fixer args or { propertyId, property, proof, counterexample, attempt }
 * @returns {{propertyId: string, fixed: boolean, changeKind: string, changes: array, evidence: string[]}}
 */
export const fixFormalTask = defineTask('caf.fix-formal', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix formal proof: ${args.propertyId ?? args.gateId ?? 'proof-audit'} (attempt ${args.attempt})`,
  agent: {
    name: 'formal-fixer',
    prompt: {
      role: 'Remediation engineer (formal proof failures only)',
      task: 'Counterexample-driven remediation of a falsified/inconclusive proof for ONE property',
      context: {
        propertyId: args.propertyId,
        property: args.property,
        proof: args.proof,
        counterexample: args.counterexample,
        artifact: args.artifact,
        issues: args.issues,
        gateId: args.gateId,
        attempt: args.attempt,
      },
      instructions: [
        'Scope-wrapped: fix ONLY the listed proof failure (or the gate-reported issues) — no unrelated refactors.',
        'Drive the fix from the counterexample trace where present.',
        'State whether the fix changed the implementation, the specification, or the model assumptions in changeKind — a spec/assumption change re-triggers the trace-diff at the next stage exit.',
        'Report per-change evidence citing the changed artifact and the re-check that will confirm it.',
      ],
      outputFormat: 'JSON with propertyId string, fixed boolean, changeKind string, changes array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['propertyId', 'fixed', 'changeKind', 'changes', 'evidence'],
      properties: {
        propertyId: { type: 'string' },
        fixed: { type: 'boolean' },
        changeKind: { type: 'string' },
        changes: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'caf', 'formal-verification', 'fixer'],
}));

/**
 * caf.fix-verification — bounded fix-loop body for V-Model verification-level
 * failures (port of crg.fix-verification). Also serves as the fixer for the
 * per-level caf.verification.<level> gate. Fixes ONLY the listed failures.
 *
 * @param {object} args - { level, failures, implementation, attempt, context } or generic gate-fixer args
 * @returns {{fixed: boolean, changes: array, evidence: string[]}}
 */
export const fixVerificationTask = defineTask('caf.fix-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix ${args.level ?? 'verification'} failures (attempt ${args.attempt})`,
  agent: {
    name: 'verification-fixer',
    prompt: {
      role: 'Remediation engineer (verification failures only)',
      task: `Fix ONLY the listed ${args.level ?? 'verification'}-level failures`,
      context: {
        level: args.level,
        failures: args.failures ?? args.issues,
        implementation: args.implementation,
        attempt: args.attempt,
        artifact: args.artifact,
        gateId: args.gateId,
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
  labels: ['agent', 'caf', 'fixer'],
}));

/**
 * caf.assemble-certification-evidence — assemble the DO-178C certification evidence
 * package (SOI-style index) into artifacts/caf/certification/evidence-index.json.
 * Every index entry cites a concrete artifact path or breakpoint event id — no entry
 * may be a prose assertion. Also serves as the re-assembly fixer for the certification gate.
 *
 * @param {object} args - { softwareLevel, objectives, verificationPlans, traceabilityMatrices, verification, formalVerification, cleanroomDevelopment, waivers, signoffs }
 * @returns {{evidenceIndexPath: string, sections: array, openItems: array, evidence: string[]}}
 */
export const assembleCertificationEvidenceTask = defineTask('caf.assemble-certification-evidence', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble DO-178C certification evidence index',
  agent: {
    name: 'certification-evidence-assembler',
    prompt: {
      role: 'DO-178C certification evidence engineer (SOI package author)',
      task: 'Assemble the certification evidence index from executed artifacts, proof outputs, waivers, and stage sign-offs',
      context: {
        softwareLevel: args.softwareLevel,
        objectives: args.objectives,
        verificationPlans: args.verificationPlans,
        traceabilityMatrices: args.traceabilityMatrices,
        verification: args.verification,
        formalVerification: args.formalVerification,
        cleanroomDevelopment: args.cleanroomDevelopment,
        waivers: args.waivers,
        signoffs: args.signoffs,
        issues: args.issues,
      },
      instructions: [
        'Assemble artifacts/caf/certification/evidence-index.json with sections mapping each DO-178C objective for the assigned software level to: the per-level verification plans, the full requirement-to-verification traceability matrix, per-level EXECUTED test results, Cleanroom inspection + statistical-testing/reliability results, per-property EXECUTED proof-output.json paths, the structural-coverage summary, the complete waiver provenance log, and all stage sign-off records.',
        'Every section entry MUST be {objective, artifactPath|breakpointEventId} — a concrete artifact path or a recorded breakpoint event id. No entry may be a prose assertion.',
        'List in openItems every objective that is not fully satisfied by an executed artifact (uncovered, waived-with-citation, or inconclusive proof) — do not hide gaps.',
        'If invoked with gate issues in context, re-assemble to resolve every listed issue and report the resolution in evidence.',
      ],
      outputFormat: 'JSON with evidenceIndexPath string, sections array, openItems array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['evidenceIndexPath', 'sections', 'openItems', 'evidence'],
      properties: {
        evidenceIndexPath: { type: 'string' },
        sections: { type: 'array', minItems: 1 },
        openItems: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'caf', 'certification'],
}));

/**
 * caf.baseline-release — GUARDED EXECUTOR: cut the flight-software baseline
 * (configuration index, version identification, released-artifact manifest,
 * environment/build record). Scheduled ONLY inside `if (releaseDecision.approved === true)`.
 * The prompt instructs it to FAIL if the approval provenance is absent from its context.
 *
 * @param {object} args - { evidenceIndex, derSignoff, traceabilityMatrices, approvalProvenance }
 * @returns {{baselineId: string, configurationIndex: object, manifest: array, approvalProvenance: object, evidence: string[]}}
 */
export const baselineReleaseTask = defineTask('caf.baseline-release', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Cut flight-software baseline (guarded executor)',
  agent: {
    name: 'baseline-release-engineer',
    prompt: {
      role: 'Flight-software configuration-management / release engineer',
      task: 'Cut the flight-software baseline for integration or flight test',
      context: {
        evidenceIndex: args.evidenceIndex,
        derSignoff: args.derSignoff,
        traceabilityMatrices: args.traceabilityMatrices,
        approvalProvenance: args.approvalProvenance,
      },
      instructions: [
        'REFUSE and FAIL if approvalProvenance is absent from the context, or if it does not carry breakpointId "flight-software-baseline-release" with autoApproved:false and a respondedBy — an unapproved release is never permitted.',
        'Cut the baseline: configuration index, version identification, released-artifact manifest, and the environment/build record.',
        'Cite the signed evidence index and the DER sign-off provenance in the released configuration index.',
        'Evidence cites the produced configuration-management records and the approval provenance, not prose.',
      ],
      outputFormat: 'JSON with baselineId string, configurationIndex object, manifest array, approvalProvenance object, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['baselineId', 'configurationIndex', 'manifest', 'approvalProvenance', 'evidence'],
      properties: {
        baselineId: { type: 'string' },
        configurationIndex: { type: 'object' },
        manifest: { type: 'array' },
        approvalProvenance: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'caf', 'release', 'guarded-executor'],
}));

// ---------------------------------------------------------------------------
// requireSafetyWaiver — fail-closed waiver guard (policy-gated action)
// ---------------------------------------------------------------------------

/**
 * Safety-requirement waiver guard. Raises the requirement-waiver-approval routed
 * breakpoint (expert: certification-liaison) for ANY deviation from a captured
 * safety requirement or DO-178C objective (unformalizable properties, exhausted
 * proof budgets, uncovered requirements a stage wants to carry, coverage/reliability
 * shortfalls). breakpointId === actionId exactly. This breakpoint NEVER auto-executes
 * (no autoApproveAfterN, no presentAlwaysApprove). approved !== true throws — the run
 * stops; no de-scoped fallback path exists. On approval, appends a per-requirement
 * provenance record to the mutable waivers log threaded through the run.
 *
 * Direct structural port of requirePhiApproval in composition-regulated-greenfield.js
 * (validation-first, per-item provenance, never generalized, rejection throws).
 *
 * @param {object} ctx - The process context
 * @param {object} deviation - REQUIRED { requirementIds: string[], rationale: string, deviationKind?: string }
 * @param {object} options
 * @param {string} options.requestingStage - REQUIRED stage id raising the guard
 * @param {Array<object>} options.waivers - REQUIRED mutable waiver provenance log
 * @returns {Promise<{breakpointEventId: string, breakpointId: string, requirementIds: string[], rationale: string, requestingStage: string, approvedAt: string, respondedBy: string|null}>}
 */
export async function requireSafetyWaiver(ctx, deviation, { requestingStage, waivers } = {}) {
  if (!deviation || typeof deviation !== 'object') {
    throw new Error(`requireSafetyWaiver: deviation object is required (got ${JSON.stringify(deviation)})`);
  }
  if (!Array.isArray(deviation.requirementIds) || deviation.requirementIds.length === 0) {
    throw new Error(`requireSafetyWaiver: deviation.requirementIds is required and must be non-empty (got ${JSON.stringify(deviation.requirementIds)})`);
  }
  if (!deviation.rationale || (typeof deviation.rationale === 'string' && deviation.rationale.trim().length === 0)) {
    throw new Error(`requireSafetyWaiver: deviation.rationale is required (got ${JSON.stringify(deviation.rationale)})`);
  }
  if (!requestingStage) {
    throw new Error(`requireSafetyWaiver: requestingStage is required (got ${JSON.stringify(requestingStage)})`);
  }
  if (!Array.isArray(waivers)) {
    throw new Error('requireSafetyWaiver: waivers provenance log (array) is required');
  }

  const decision = await routedBreakpoint(ctx, {
    question: `Safety-requirement waiver requested by ${requestingStage}: approve deviation from ${deviation.requirementIds.length} captured requirement(s)/objective(s)? Rationale: ${deviation.rationale}. Approvals are per-requirement and never generalized.`,
    deviationKind: deviation.deviationKind ?? 'safety-requirement-deviation',
    requirementIds: deviation.requirementIds,
    rationale: deviation.rationale,
    requestingStage,
  }, {
    breakpointId: 'requirement-waiver-approval',
    expert: 'certification-liaison',
    tags: ['caf', 'policy-gated', 'waiver', 'do-178c'],
    strategy: 'single',
    // NEVER auto-executes: no autoApproveAfterN, no presentAlwaysApprove.
  });

  if (decision.approved !== true) {
    const notes = decision.response ?? decision.feedback ?? 'no reviewer notes';
    throw new Error(`Safety-requirement waiver REJECTED by certification-liaison for ${requestingStage} (requirements ${JSON.stringify(deviation.requirementIds)}): ${notes}. There is no de-scoped fallback path — the run stops here.`);
  }

  const approvedAt = new Date().toISOString();
  const record = {
    breakpointEventId: `requirement-waiver-approval@${approvedAt}#${waivers.length}`,
    breakpointId: 'requirement-waiver-approval',
    requirementIds: deviation.requirementIds,
    rationale: deviation.rationale,
    requestingStage,
    approvedAt,
    respondedBy: decision.respondedBy ?? null,
    autoApproved: false,
  };
  waivers.push(record);
  return record;
}

// ---------------------------------------------------------------------------
// certifiedStageExit — executed trace-diff -> adversarial gate -> verification-lead sign-off
// ---------------------------------------------------------------------------

/**
 * Stage-boundary contract, applied at every phase exit (port of regulatedStageExit):
 *   1. EXECUTED traceability — traceabilityMatrixTask computes the stage matrix,
 *      caf.trace-diff diffs it against previousMatrix + the SRS requirement set and
 *      writes artifacts/caf/<stage>/trace-diff.json (a computed diff, not prose).
 *   2. adversarialGate gateId caf.<stage>.traceability over the executed diff with
 *      traceability-critic + waiver-provenance-critic; gate failure throws.
 *   3. verification-lead sign-off via routedBreakpoint breakpointId caf.stage-exit.<stage>;
 *      payload constructed FROM the executed gate result after a structural malformed-check.
 *   4. approved !== true throws (stages are sequential, no skip-ahead).
 *
 * Sign-offs here are process breakpoints, not policy-gated actions; the three
 * policy-gated actions keep breakpointId === actionId exactly.
 *
 * @param {object} ctx - The process context
 * @param {string} stage - REQUIRED stage id
 * @param {object} options - { artifacts, requirements, verificationArtifacts, previousMatrix, waivers, maxFixAttempts }
 * @returns {Promise<{stage: string, matrix: object, traceDiff: object, gateResult: object, signoff: object}>}
 */
export async function certifiedStageExit(ctx, stage, {
  artifacts = [],
  requirements,
  verificationArtifacts = {},
  previousMatrix = null,
  waivers = [],
  maxFixAttempts = 2,
} = {}) {
  if (!stage) {
    throw new Error(`certifiedStageExit: stage is required (got ${JSON.stringify(stage)})`);
  }
  if (!requirements) {
    throw new Error(`certifiedStageExit(${stage}): requirements is required — the trace diff is computed against the SRS requirement set`);
  }

  // (1) EXECUTED traceability — compute the stage matrix, then the diff.
  const matrix = await ctx.task(traceabilityMatrixTask, {
    requirements,
    ...verificationArtifacts,
  });

  const traceDiff = await ctx.task(traceDiffTask, {
    stage,
    matrix,
    previousMatrix,
    requirements,
    waivers,
  });

  // (2) Adversarial gate over the EXECUTED artifact (imported combinator).
  const gateResult = await adversarialGate(ctx, {
    gateId: `caf.${stage}.traceability`,
    artifact: {
      path: `artifacts/caf/${stage}/trace-diff.json`,
      description: 'Executed requirement-to-verification traceability diff',
    },
    critics: [
      {
        name: 'traceability-critic',
        role: 'DO-178C traceability auditor',
        focus: 'every requirement traces to a designed AND (post-implementation stages) EXECUTED verification artifact; uncovered/regressions must be zero or carry a cited waiver',
      },
      {
        name: 'waiver-provenance-critic',
        role: 'Waiver provenance auditor',
        focus: 'every waived requirement cites a recorded requirement-waiver-approval breakpoint event id from the waivers log',
      },
    ],
    ironLaw: [
      'Re-run the trace computation yourself or cite the executed trace-diff.json line-by-line; prose claims of coverage are not evidence.',
    ],
    maxFixAttempts,
    fixer: {},
    context: { stage, traceDiff, waivers },
  });

  // Gate failure throws — escalation already happened inside the combinator
  // (owner breakpoint); a still-failed gate means the owner rejected too. No
  // pass-anyway path.
  if (gateResult.passed !== true) {
    throw new Error(`Stage exit BLOCKED: adversarial gate caf.${stage}.traceability failed after ${gateResult.attempts} attempt(s) (escalated: ${gateResult.escalated}). Issues: ${JSON.stringify(gateResult.issues)}`);
  }

  // (3) verification-lead sign-off. The payload is constructed FROM the executed
  // gate result — a sign-off without executed traceability evidence is
  // structurally impossible to build.
  if (typeof gateResult.passed !== 'boolean' || typeof gateResult.attempts !== 'number' || !Array.isArray(gateResult.evidence)) {
    throw new Error(`certifiedStageExit(${stage}): executed gate result is malformed — sign-off without traceability evidence is structurally impossible`);
  }
  const signoffDecision = await routedBreakpoint(ctx, {
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
    breakpointId: `caf.stage-exit.${stage}`,
    expert: 'verification-lead',
    tags: ['caf', 'stage-exit', stage],
    strategy: 'single',
  });

  // (4) Rejected sign-off throws — no skip-ahead fallback.
  if (signoffDecision.approved !== true) {
    const notes = signoffDecision.response ?? signoffDecision.feedback ?? 'no reviewer notes';
    throw new Error(`Stage exit REJECTED by verification-lead for "${stage}": ${notes}`);
  }

  const signoff = { ...signoffDecision, autoApproved: signoffDecision.autoApproved ?? false };
  return { stage, matrix, traceDiff, gateResult, signoff };
}

// ---------------------------------------------------------------------------
// Internal: bounded verification-level runner (Phase 5) with per-level gate
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

/**
 * Bounded verification-level runner. Runs the executeTestsTask -> caf.fix-verification
 * loop (owner escalation on exhausted budget, approved!==true throws) PER SCOPE — the
 * scopes are executed in ctx.parallel for the unit/integration levels (per module /
 * per suite) and singly for system/acceptance — then runs the per-level adversarialGate
 * ONCE over the aggregated executed results (gateId caf.verification.<level>, exactly one
 * gate per V-Model level: unit, integration, system, acceptance). Gate failure throws.
 *
 * Internal (not exported).
 * @param {object} ctx
 * @param {string} level
 * @param {object} taskArgs - { scopes?: array } ; each scope carries its own executeTests args + scopeId
 * @param {object} options - { maxFixAttempts, escalationId, verificationPlan }
 * @returns {Promise<{level: string, results: array, gateResult: object}>}
 */
async function runVerificationLevel(ctx, level, taskArgs, { maxFixAttempts, escalationId, verificationPlan }) {
  const scopes = Array.isArray(taskArgs.scopes) && taskArgs.scopes.length > 0 ? taskArgs.scopes : [taskArgs];
  const multiScope = scopes.length > 1;

  // Per-scope executed test-run + bounded fix loop + owner escalation. Parallel
  // WITHIN the level; the level itself is sequenced by the caller.
  const results = await ctx.parallel.all(
    scopes.map((scope, index) => async () => {
      let result = await ctx.task(executeTestsTask, { ...scope, level });
      let attempt = 0;
      while (!levelResultPassed(result, level) && attempt < maxFixAttempts) {
        attempt += 1;
        await ctx.task(fixVerificationTask, {
          level,
          attempt,
          failures: result.testResults ?? result,
          implementation: scope.implementation,
          context: { escalationId, scopeId: scope.scopeId },
        });
        result = await ctx.task(executeTestsTask, { ...scope, level });
      }
      if (!levelResultPassed(result, level)) {
        // Exhausted the fix budget — escalate, never auto-pass.
        const scopeSuffix = multiScope ? `.${scope.scopeId ?? `scope-${index + 1}`}` : '';
        const escalation = await routedBreakpoint(ctx, {
          question: `${level}-level verification still failing after ${attempt} fix attempt(s)${multiScope ? ` for scope ${scope.scopeId ?? index + 1}` : ''}. Accept the current results and continue, or reject (stops the run)?`,
          level,
          scopeId: scope.scopeId,
          results: result.testResults ?? result,
        }, {
          breakpointId: `${escalationId}${scopeSuffix}`,
          expert: 'owner',
          tags: ['caf', 'verification', 'escalation', level],
          strategy: 'single',
        });
        if (escalation.approved !== true) {
          throw new Error(`Verification level "${level}"${scopeSuffix} failed after ${attempt} fix attempt(s) and the owner rejected continuing.`);
        }
      }
      return { scopeId: scope.scopeId ?? `scope-${index + 1}`, result };
    })
  );

  // Per-level adversarialGate ONCE over the aggregated EXECUTED test output.
  const gateResult = await adversarialGate(ctx, {
    gateId: `caf.verification.${level}`,
    artifact: {
      path: `artifacts/caf/verification/${level}/results.json`,
      description: `Executed ${level}-level test-run results (per plan method)`,
    },
    critics: [
      {
        name: 'verification-critic',
        role: 'DO-178C verification auditor',
        focus: 're-run or line-cite the executed test output; every plan method has an executed result; the coverage objective is met or a waiver is cited',
      },
      {
        name: 'independence-critic',
        role: 'DO-178C verification-independence auditor',
        focus: `the ${level} level's DO-178C independence requirements from its caf.level-verification-plan are satisfied; verifier-role (verifier != developer) evidence is present`,
      },
    ],
    ironLaw: [
      'Executed test output is the only admissible evidence; re-run it or line-cite it, do not trust the prose.',
    ],
    maxFixAttempts,
    fixer: { task: fixVerificationTask, args: { level } },
    context: { level, verificationPlan, results },
  });

  if (gateResult.passed !== true) {
    throw new Error(`Verification level gate BLOCKED: caf.verification.${level} failed after ${gateResult.attempts} attempt(s) (escalated: ${gateResult.escalated}). Issues: ${JSON.stringify(gateResult.issues)}`);
  }

  return { level, results, gateResult };
}

// ---------------------------------------------------------------------------
// process — the composition orchestrator
// ---------------------------------------------------------------------------

/**
 * Flight-control software composition orchestrator. Phases are strictly sequential;
 * ctx.parallel.all is used only WITHIN a phase (per-level verification planning,
 * per-property formal analysis, per-module/per-suite verification). Cleanroom
 * increments are deliberately sequential.
 *
 * @param {object} inputs - See @inputs
 * @param {object} ctx - Babysitter process context
 * @returns {Promise<object>} See @outputs
 */
export async function process(inputs, ctx) {
  const {
    systemRequirements,
    dalLevelHint,
    flightControlFunctions = [],
    criticalPropertiesHint = [],
    complianceStandards = ['DO-178C'],
    incrementCountHint,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
    maxFixAttempts = 2,
    maxProofAttempts = 2,
  } = inputs ?? {};

  // No fallbacks: empty systemRequirements is a caller bug, not a defaultable input.
  if (!systemRequirements || (typeof systemRequirements === 'string' && systemRequirements.trim().length === 0)) {
    throw new Error('composition-aerospace-flight-control: systemRequirements is required and must be non-empty');
  }

  const waivers = [];               // safety-requirement waiver provenance log (threaded through the run)
  const signoffs = {};              // per-breakpoint decision records (stage exits + policy-gated actions)
  const traceabilityMatrices = {};  // per-stage computed matrices
  const gateAttempts = {};          // per-gate adversarial-gate attempts
  let escalations = 0;

  // -------------------------------------------------------------------------
  // Phase 0 — kip recall
  // -------------------------------------------------------------------------
  const recall = await kipRecall(ctx, {
    kipDir,
    topic: 'safety-critical composition precedents: DO-178C traceability, Cleanroom/V-Model interfaces, formal-proof evidence patterns',
    kipModel,
    kind: 'methodology-composition',
  });
  const kipInsights = recall.insights ?? [];

  // -------------------------------------------------------------------------
  // Phase 1 — Waterfall requirements capture + safety assessment
  // -------------------------------------------------------------------------
  const srs = await ctx.task(requirementsGatheringTask, {
    projectName: PROJECT_NAME,
    projectDescription: systemRequirements,
    stakeholders: ['flight-test engineers', 'systems engineering', 'certification authority liaison', 'pilots'],
    requirementsSource: systemRequirements,
    regulatoryCompliance: complianceStandards,
    kipInsights,
  });

  const requirementsPhase = await ctx.task(requirementsWithAcceptanceTask, {
    projectRequirements: systemRequirements,
    safetyLevel: SAFETY_LEVEL,
    testingRigor: TESTING_RIGOR,
    complianceStandards,
    existingArtifacts: { srs },
    kipInsights,
  });
  const requirements = requirementsPhase.requirements;
  const acceptanceTestDesign = requirementsPhase.acceptanceTestDesign;

  const safetyAssessment = await ctx.task(safetyAssessmentTask, {
    srs,
    requirements,
    dalLevelHint,
    criticalPropertiesHint,
    flightControlFunctions,
    complianceStandards,
    kipInsights,
  });
  if (!Array.isArray(safetyAssessment.criticalProperties) || safetyAssessment.criticalProperties.length === 0) {
    throw new Error('composition-aerospace-flight-control: caf.safety-assessment produced no critical properties — a flight-control composition with no critical properties is a misuse; use a lighter methodology');
  }

  // A hinted-but-refuted safety requirement the caller insisted on is a deviation:
  // waive it (certification-liaison) BEFORE any downstream task consumes the reduced set.
  const refutedHints = Array.isArray(safetyAssessment.refutedHints) ? safetyAssessment.refutedHints : [];
  if (refutedHints.length > 0) {
    const refutedIds = extractIds(refutedHints);
    await requireSafetyWaiver(ctx, {
      requirementIds: refutedIds.length > 0 ? refutedIds : refutedHints.map((_, i) => `refuted-hint-${i + 1}`),
      rationale: 'Caller-insisted safety requirement(s)/critical propert(ies) refuted by the authoritative safety assessment; deviation from the captured (hinted) requirement set.',
      deviationKind: 'refuted-hinted-requirement',
    }, { requestingStage: 'phase-1-requirements', waivers });
  }

  const requirementsExit = await certifiedStageExit(ctx, 'requirements', {
    artifacts: ['artifacts/caf/requirements/trace-diff.json'],
    requirements,
    verificationArtifacts: { acceptanceTestDesign, safetyAssessment, complianceStandards },
    previousMatrix: null,
    waivers,
    maxFixAttempts,
  });
  signoffs['caf.stage-exit.requirements'] = requirementsExit.signoff;
  traceabilityMatrices.requirements = requirementsExit.matrix;
  gateAttempts['requirements'] = requirementsExit.gateResult.attempts;
  if (requirementsExit.gateResult.escalated) escalations += 1;

  // -------------------------------------------------------------------------
  // Phase 2 — V-Model decomposition with per-level verification plans
  // -------------------------------------------------------------------------
  const systemDesignPhase = await ctx.task(systemDesignWithSystemTestTask, {
    requirements,
    acceptanceTestDesign,
    safetyLevel: SAFETY_LEVEL,
    testingRigor: TESTING_RIGOR,
    complianceStandards,
    safetyAssessment,
  });
  const systemDesign = systemDesignPhase.systemDesign;
  const systemTestDesign = systemDesignPhase.systemTestDesign;

  const architecturePhase = await ctx.task(architectureWithIntegrationTestTask, {
    systemDesign,
    systemTestDesign,
    requirements,
    safetyLevel: SAFETY_LEVEL,
    testingRigor: TESTING_RIGOR,
  });
  const architecture = architecturePhase.architecture;
  const integrationTestDesign = architecturePhase.integrationTestDesign;

  const architectureModules = Array.isArray(architecture?.modules) && architecture.modules.length > 0
    ? architecture.modules
    : (Array.isArray(architecture?.components) ? architecture.components : []);
  if (architectureModules.length === 0) {
    throw new Error('composition-aerospace-flight-control: architecture yielded no modules — cannot decompose module designs or unit verification');
  }

  const moduleDesignResults = await ctx.parallel.all(
    architectureModules.map((mod) => async () => {
      const result = await ctx.task(moduleDesignWithUnitTestTask, {
        module: typeof mod === 'object' ? mod : { name: mod },
        architecture,
        requirements,
        safetyLevel: SAFETY_LEVEL,
        testingRigor: TESTING_RIGOR,
      });
      return { module: typeof mod === 'object' ? mod : { name: mod }, moduleDesign: result.moduleDesign, unitTestDesign: result.unitTestDesign };
    })
  );
  const moduleDesigns = moduleDesignResults.map((m) => m.moduleDesign);
  const unitTestDesigns = moduleDesignResults.map((m) => m.unitTestDesign);

  // Per-level verification planning — parallel across the four V-Model levels.
  const levels = ['unit', 'integration', 'system', 'acceptance'];
  const pairedTestDesignByLevel = {
    unit: unitTestDesigns,
    integration: integrationTestDesign,
    system: systemTestDesign,
    acceptance: acceptanceTestDesign,
  };
  const verificationPlanResults = await ctx.parallel.all(
    levels.map((level) => async () =>
      ctx.task(levelVerificationPlanTask, {
        level,
        safetyAssessment,
        requirements,
        pairedTestDesign: pairedTestDesignByLevel[level],
      })
    )
  );
  const verificationPlans = {};
  for (let i = 0; i < levels.length; i++) {
    verificationPlans[levels[i]] = verificationPlanResults[i];
  }

  const vModelDesign = {
    systemDesign,
    systemTestDesign,
    architecture,
    integrationTestDesign,
    moduleDesigns,
    unitTestDesigns,
    verificationPlans,
  };

  const decompositionExit = await certifiedStageExit(ctx, 'decomposition', {
    artifacts: ['artifacts/caf/decomposition/trace-diff.json'],
    requirements,
    verificationArtifacts: { systemDesign, systemTestDesign, architecture, integrationTestDesign, moduleDesigns, unitTestDesigns, verificationPlans },
    previousMatrix: traceabilityMatrices.requirements,
    waivers,
    maxFixAttempts,
  });
  signoffs['caf.stage-exit.decomposition'] = decompositionExit.signoff;
  traceabilityMatrices.decomposition = decompositionExit.matrix;
  gateAttempts['decomposition'] = decompositionExit.gateResult.attempts;
  if (decompositionExit.gateResult.escalated) escalations += 1;

  // -------------------------------------------------------------------------
  // Phase 3 — Cleanroom incremental development with statistical usage testing
  // -------------------------------------------------------------------------
  const incrementPlan = await ctx.task(planIncrementsTask, {
    projectName: PROJECT_NAME,
    specifications: { requirements, architecture, systemDesign },
    incrementCount: incrementCountHint,
    criticalComponents: extractIds(safetyAssessment.functions),
  });
  if (!Array.isArray(incrementPlan.increments) || incrementPlan.increments.length === 0) {
    throw new Error('composition-aerospace-flight-control: plan-increments produced zero increments — cannot run Cleanroom incremental development');
  }

  // SEQUENTIAL over increments — Cleanroom increments build on prior increments.
  const perIncrement = [];
  const cumulativeCode = [];
  for (let i = 0; i < incrementPlan.increments.length; i++) {
    const increment = incrementPlan.increments[i];
    const incrementNumber = i + 1;
    const incrementKey = increment.name ?? increment.id ?? `increment-${incrementNumber}`;
    const incrementReqIds = extractIds(increment.requirementIds ?? increment.requirements) ;

    const spec = await ctx.task(createFormalSpecificationTask, {
      projectName: PROJECT_NAME,
      systemDescription: systemRequirements,
      criticalComponents: [incrementKey],
      includeProofOfCorrectness: true,
      increment,
    });

    let designResult = await ctx.task(designWithVerificationTask, {
      projectName: PROJECT_NAME,
      increment,
      incrementNumber,
      specifications: spec,
      previousIncrements: perIncrement,
      includeProofOfCorrectness: true,
    });

    let designFix = 0;
    while (designResult.verificationPassed !== true && designFix < maxFixAttempts) {
      designFix += 1;
      const fixed = await ctx.task(fixDesignTask, {
        projectName: PROJECT_NAME,
        increment,
        incrementNumber,
        designResult,
        verificationIssues: designResult.verificationIssues,
      });
      designResult = { ...designResult, ...fixed };
    }
    if (designResult.verificationPassed !== true) {
      const escalation = await routedBreakpoint(ctx, {
        question: `Cleanroom design verification for increment "${incrementKey}" still failing after ${designFix} fix attempt(s). Accept the design anyway, or reject (stops the run)?`,
        increment: incrementKey,
        verificationIssues: designResult.verificationIssues,
      }, {
        breakpointId: `caf.phase-3.design-escalation.${incrementKey}`,
        expert: 'owner',
        tags: ['caf', 'escalation'],
        strategy: 'single',
      });
      if (escalation.approved !== true) {
        throw new Error(`Cleanroom design verification failed for increment "${incrementKey}" after ${designFix} fix attempt(s) and the owner rejected continuing — never silently accept.`);
      }
      escalations += 1;
      // Owner acceptance of a shortfall against a safety requirement ALSO
      // requires the certification-liaison waiver — owner escalation never
      // substitutes for the requirement-waiver-approval.
      if (incrementReqIds.length > 0) {
        await requireSafetyWaiver(ctx, {
          requirementIds: incrementReqIds,
          rationale: `Cleanroom design verification shortfall accepted by owner escalation for increment "${incrementKey}".`,
          deviationKind: 'design-verification-shortfall',
        }, { requestingStage: `phase-3-design.${incrementKey}`, waivers });
      }
    }

    const implementation = await ctx.task(implementIncrementTask, {
      projectName: PROJECT_NAME,
      increment,
      incrementNumber,
      design: designResult,
      specifications: spec,
      cumulativeCode,
    });

    let inspection = await ctx.task(codeInspectionTask, {
      projectName: PROJECT_NAME,
      increment,
      incrementNumber,
      implementation,
      design: designResult,
      specifications: spec,
    });
    let inspectionFix = 0;
    while (inspection.criticalDefects > 0 && inspectionFix < maxFixAttempts) {
      inspectionFix += 1;
      await ctx.task(fixImplementationTask, {
        projectName: PROJECT_NAME,
        increment,
        incrementNumber,
        implementation,
        defects: (inspection.defects ?? []).filter((d) => d.severity === 'critical'),
      });
      inspection = await ctx.task(codeInspectionTask, {
        projectName: PROJECT_NAME,
        increment,
        incrementNumber,
        implementation,
        design: designResult,
        specifications: spec,
      });
    }
    if (inspection.criticalDefects > 0) {
      const escalation = await routedBreakpoint(ctx, {
        question: `Cleanroom code inspection for increment "${incrementKey}" still reports ${inspection.criticalDefects} critical defect(s) after ${inspectionFix} fix attempt(s). Accept and continue, or reject (stops the run)?`,
        increment: incrementKey,
        defects: inspection.defects,
      }, {
        breakpointId: `caf.phase-3.inspection-escalation.${incrementKey}`,
        expert: 'owner',
        tags: ['caf', 'escalation'],
        strategy: 'single',
      });
      if (escalation.approved !== true) {
        throw new Error(`Code inspection failed for increment "${incrementKey}" with unresolved critical defects and the owner rejected continuing — never auto-pass.`);
      }
      escalations += 1;
      if (incrementReqIds.length > 0) {
        await requireSafetyWaiver(ctx, {
          requirementIds: incrementReqIds,
          rationale: `Cleanroom code-inspection shortfall (${inspection.criticalDefects} unresolved critical defect(s)) accepted by owner escalation for increment "${incrementKey}".`,
          deviationKind: 'code-inspection-shortfall',
        }, { requestingStage: `phase-3-inspection.${incrementKey}`, waivers });
      }
    }

    if (Array.isArray(implementation.modules)) {
      cumulativeCode.push(...implementation.modules);
    }
    perIncrement.push({ increment, incrementNumber, spec, designResult, implementation, inspection });
  }

  // Statistical usage testing over the integrated increments.
  const usageModel = await ctx.task(createUsageModelTask, {
    projectName: PROJECT_NAME,
    systemDescription: systemRequirements,
    specifications: { requirements, architecture, perIncrement },
    usageProfile: { flightControlFunctions },
    developmentResults: perIncrement,
  });
  const statisticalTests = await ctx.task(generateStatisticalTestsTask, {
    projectName: PROJECT_NAME,
    usageModel,
    reliabilityTarget: RELIABILITY_TARGET_HOURS,
    statisticalConfidence: STATISTICAL_CONFIDENCE,
    specifications: { requirements, architecture },
  });
  let statisticalTestResults = await ctx.task(executeStatisticalTestsTask, {
    projectName: PROJECT_NAME,
    testCases: statisticalTests.testCases,
    implementation: cumulativeCode,
    usageModel,
    statisticalConfidence: STATISTICAL_CONFIDENCE,
  });
  let reliabilityAnalysis = await ctx.task(analyzeReliabilityTask, {
    projectName: PROJECT_NAME,
    testExecution: statisticalTestResults,
    usageModel,
    reliabilityTarget: RELIABILITY_TARGET_HOURS,
    statisticalConfidence: STATISTICAL_CONFIDENCE,
  });

  // Reliability shortfall: bounded caf.fix-verification loop then a waiver — never silent.
  let reliabilityFix = 0;
  while (reliabilityAnalysis.targetMet !== true && reliabilityFix < maxFixAttempts) {
    reliabilityFix += 1;
    await ctx.task(fixVerificationTask, {
      level: 'reliability',
      attempt: reliabilityFix,
      failures: reliabilityAnalysis,
      implementation: cumulativeCode,
      context: { escalationId: 'caf.phase-3.reliability' },
    });
    statisticalTestResults = await ctx.task(executeStatisticalTestsTask, {
      projectName: PROJECT_NAME,
      testCases: statisticalTests.testCases,
      implementation: cumulativeCode,
      usageModel,
      statisticalConfidence: STATISTICAL_CONFIDENCE,
    });
    reliabilityAnalysis = await ctx.task(analyzeReliabilityTask, {
      projectName: PROJECT_NAME,
      testExecution: statisticalTestResults,
      usageModel,
      reliabilityTarget: RELIABILITY_TARGET_HOURS,
      statisticalConfidence: STATISTICAL_CONFIDENCE,
    });
  }
  if (reliabilityAnalysis.targetMet !== true) {
    const reliabilityReqIds = extractIds(safetyAssessment.safetyRequirements);
    await requireSafetyWaiver(ctx, {
      requirementIds: reliabilityReqIds.length > 0 ? reliabilityReqIds : extractIds(safetyAssessment.criticalProperties),
      rationale: `Cleanroom statistical reliability target not met after ${reliabilityFix} bounded fix attempt(s); accepted deviation from the reliability objective.`,
      deviationKind: 'reliability-shortfall',
    }, { requestingStage: 'phase-3-reliability', waivers });
  }

  const cleanroomDevelopment = {
    incrementPlan,
    perIncrement,
    usageModel,
    statisticalTestResults,
    reliabilityAnalysis,
  };

  const cleanroomExit = await certifiedStageExit(ctx, 'cleanroom-development', {
    artifacts: ['artifacts/caf/cleanroom-development/trace-diff.json'],
    requirements,
    verificationArtifacts: {
      formalSpecs: perIncrement.map((p) => p.spec),
      incrementDesigns: perIncrement.map((p) => p.designResult),
      implementations: perIncrement.map((p) => p.implementation),
      inspections: perIncrement.map((p) => p.inspection),
      usageModel,
      statisticalTestResults,
      reliabilityAnalysis,
    },
    previousMatrix: traceabilityMatrices.decomposition,
    waivers,
    maxFixAttempts,
  });
  signoffs['caf.stage-exit.cleanroom-development'] = cleanroomExit.signoff;
  traceabilityMatrices['cleanroom-development'] = cleanroomExit.matrix;
  gateAttempts['cleanroom-development'] = cleanroomExit.gateResult.attempts;
  if (cleanroomExit.gateResult.escalated) escalations += 1;

  // -------------------------------------------------------------------------
  // Phase 4 — INLINE formal verification of critical properties (parallel per-property proofs)
  // -------------------------------------------------------------------------
  const extraction = await ctx.task(formalPropertyExtractionTask, {
    criticalProperties: safetyAssessment.criticalProperties,
    safetyRequirements: safetyAssessment.safetyRequirements,
    formalSpecs: perIncrement.map((p) => p.spec),
    requirements,
  });
  if (!Array.isArray(extraction.properties) || extraction.properties.length === 0) {
    throw new Error('composition-aerospace-flight-control: caf.formal-property-extraction produced no properties — cannot formally verify critical properties');
  }

  // Every unformalizable critical property is a deviation (critical property with
  // no formal verification): waive it — fail-closed — BEFORE proofs proceed.
  const unformalizable = Array.isArray(extraction.unformalizable) ? extraction.unformalizable : [];
  for (const entry of unformalizable) {
    const entryReqIds = extractIds(entry.sourceRequirementIds ?? entry.requirementIds);
    await requireSafetyWaiver(ctx, {
      requirementIds: entryReqIds.length > 0 ? entryReqIds : [entry.propertyId ?? 'unformalizable-property'],
      rationale: `Critical property "${entry.propertyId ?? 'unknown'}" has no formalizable statement — deviation: no formal verification. Reason: ${entry.reason ?? 'unformalizable'}.`,
      deviationKind: 'unformalizable-critical-property',
    }, { requestingStage: 'phase-4-formal-extraction', waivers });
  }

  // Per-property model construction -> executed proof -> bounded counterexample fix loop.
  const perProperty = await ctx.parallel.all(
    extraction.properties.map((property) => async () => {
      const model = await ctx.task(formalModelConstructionTask, {
        property,
        cleanroomSpec: perIncrement.map((p) => p.spec),
        implementation: cumulativeCode,
      });

      let proof = await ctx.task(propertyProofTask, { property, model, attempt: 0 });
      let proofAttempts = 0;
      while (proof.proofStatus !== 'proved' && proofAttempts < maxProofAttempts) {
        proofAttempts += 1;
        await ctx.task(fixFormalTask, {
          propertyId: property.propertyId,
          property,
          proof,
          counterexample: proof.counterexample,
          attempt: proofAttempts,
        });
        proof = await ctx.task(propertyProofTask, { property, model, attempt: proofAttempts });
      }

      let waiver = null;
      if (proof.proofStatus !== 'proved') {
        // Exhausted the proof budget with a non-proved property: waive the
        // property's source requirements via the certification-liaison — never
        // an owner-only acceptance, never auto-pass.
        const propertyReqIds = extractIds(property.sourceRequirementIds ?? property.requirementIds);
        waiver = await requireSafetyWaiver(ctx, {
          requirementIds: propertyReqIds.length > 0 ? propertyReqIds : [property.propertyId],
          rationale: `Formal proof for critical property "${property.propertyId}" is ${proof.proofStatus} after ${proofAttempts} fix attempt(s); accepted deviation with executed proof-output evidence.`,
          deviationKind: 'unproved-critical-property',
        }, { requestingStage: `phase-4-proof.${property.propertyId}`, waivers });
      }

      return { property, model, finalProof: proof, proofAttempts, waiver };
    })
  );

  // Independent proof-audit gate over the EXECUTED proof outputs.
  const proofAuditGate = await adversarialGate(ctx, {
    gateId: 'caf.formal.proof-audit',
    artifact: {
      path: 'artifacts/caf/formal/',
      description: 'Executed per-property proof outputs (proof-output.json tree) + computed proofStatus summary',
    },
    critics: [
      {
        name: 'proof-audit-critic',
        role: 'Formal proof auditor',
        focus: 're-execute at least one proof per property class and diff against the recorded proof-output.json; an unreproducible "proved" is a failure',
      },
      {
        name: 'property-coverage-critic',
        role: 'Property coverage auditor',
        focus: 'every criticalProperty from caf.safety-assessment is proved or carries a cited requirement-waiver-approval event id',
      },
    ],
    ironLaw: [
      'Executed proof-checker output is the only admissible evidence; re-run it, do not trust the prose.',
    ],
    maxFixAttempts,
    fixer: { task: fixFormalTask, args: { propertyId: 'proof-audit' } },
    context: {
      proofSummary: perProperty.map((p) => ({ propertyId: p.property.propertyId, proofStatus: p.finalProof.proofStatus, waiverBreakpointEventId: p.waiver ? p.waiver.breakpointEventId : null })),
      waivers,
    },
  });
  if (proofAuditGate.passed !== true) {
    throw new Error(`Formal proof-audit gate BLOCKED: caf.formal.proof-audit failed after ${proofAuditGate.attempts} attempt(s) (escalated: ${proofAuditGate.escalated}). Issues: ${JSON.stringify(proofAuditGate.issues)}`);
  }
  gateAttempts['formal-proof-audit'] = proofAuditGate.attempts;
  if (proofAuditGate.escalated) escalations += 1;

  const formalVerification = {
    properties: extraction.properties,
    perProperty,
    proofAuditGate: { passed: proofAuditGate.passed, attempts: proofAuditGate.attempts, escalated: proofAuditGate.escalated, evidence: proofAuditGate.evidence },
  };

  const formalVerificationExit = await certifiedStageExit(ctx, 'formal-verification', {
    artifacts: ['artifacts/caf/formal-verification/trace-diff.json'],
    requirements,
    verificationArtifacts: {
      properties: extraction.properties,
      proofResults: perProperty.map((p) => ({ propertyId: p.property.propertyId, proofStatus: p.finalProof.proofStatus, proofOutputPath: p.finalProof.proofOutputPath })),
      proofAuditGate: formalVerification.proofAuditGate,
    },
    previousMatrix: traceabilityMatrices['cleanroom-development'],
    waivers,
    maxFixAttempts,
  });
  signoffs['caf.stage-exit.formal-verification'] = formalVerificationExit.signoff;
  traceabilityMatrices['formal-verification'] = formalVerificationExit.matrix;
  gateAttempts['formal-verification'] = formalVerificationExit.gateResult.attempts;
  if (formalVerificationExit.gateResult.escalated) escalations += 1;

  // -------------------------------------------------------------------------
  // Phase 5 — V-Model right-side verification (levels sequential, work within a level parallel)
  // -------------------------------------------------------------------------

  // UNIT — parallel over modules; per-level gate once.
  const unitLevel = await runVerificationLevel(ctx, 'unit', {
    scopes: moduleDesignResults.map((m, index) => {
      const incrementEntry = perIncrement[index] ?? perIncrement[perIncrement.length - 1];
      return {
        scopeId: m.module.name ?? `module-${index + 1}`,
        implementation: incrementEntry ? incrementEntry.implementation : null,
        unitTestDesigns: [m.unitTestDesign],
        requirements,
        testingRigor: TESTING_RIGOR,
        safetyLevel: SAFETY_LEVEL,
      };
    }),
  }, {
    maxFixAttempts,
    escalationId: 'caf.phase-5.unit-escalation',
    verificationPlan: verificationPlans.unit,
  });

  // INTEGRATION — parallel over integration suites; per-level gate once.
  const integrationSuites = Array.isArray(integrationTestDesign?.testSuites) && integrationTestDesign.testSuites.length > 0
    ? integrationTestDesign.testSuites
    : [integrationTestDesign];
  const integrationLevel = await runVerificationLevel(ctx, 'integration', {
    scopes: integrationSuites.map((suite, index) => ({
      scopeId: (suite && suite.name) ? suite.name : `suite-${index + 1}`,
      implementation: { perIncrement, cumulativeCode },
      integrationTestDesign: suite,
      requirements,
      testingRigor: TESTING_RIGOR,
      safetyLevel: SAFETY_LEVEL,
    })),
  }, {
    maxFixAttempts,
    escalationId: 'caf.phase-5.integration-escalation',
    verificationPlan: verificationPlans.integration,
  });

  // SYSTEM — single scope.
  const systemLevel = await runVerificationLevel(ctx, 'system', {
    implementation: { perIncrement, cumulativeCode },
    systemTestDesign,
    requirements,
    testingRigor: TESTING_RIGOR,
    safetyLevel: SAFETY_LEVEL,
  }, {
    maxFixAttempts,
    escalationId: 'caf.phase-5.system-escalation',
    verificationPlan: verificationPlans.system,
  });

  // ACCEPTANCE — single scope against the Phase-1 acceptance test design.
  const acceptanceLevel = await runVerificationLevel(ctx, 'acceptance', {
    implementation: { perIncrement, cumulativeCode },
    acceptanceTestDesign,
    requirements,
    testingRigor: TESTING_RIGOR,
    safetyLevel: SAFETY_LEVEL,
  }, {
    maxFixAttempts,
    escalationId: 'caf.phase-5.acceptance-escalation',
    verificationPlan: verificationPlans.acceptance,
  });

  const verification = {
    unit: unitLevel.results,
    integration: integrationLevel.results,
    system: systemLevel.results,
    acceptance: acceptanceLevel.results,
    levelGates: {
      unit: { passed: unitLevel.gateResult.passed, attempts: unitLevel.gateResult.attempts, escalated: unitLevel.gateResult.escalated },
      integration: { passed: integrationLevel.gateResult.passed, attempts: integrationLevel.gateResult.attempts, escalated: integrationLevel.gateResult.escalated },
      system: { passed: systemLevel.gateResult.passed, attempts: systemLevel.gateResult.attempts, escalated: systemLevel.gateResult.escalated },
      acceptance: { passed: acceptanceLevel.gateResult.passed, attempts: acceptanceLevel.gateResult.attempts, escalated: acceptanceLevel.gateResult.escalated },
    },
  };
  for (const lv of levels) {
    gateAttempts[`verification-${lv}`] = verification.levelGates[lv].attempts;
    if (verification.levelGates[lv].escalated) escalations += 1;
  }

  const verificationExit = await certifiedStageExit(ctx, 'verification', {
    artifacts: ['artifacts/caf/verification/trace-diff.json'],
    requirements,
    verificationArtifacts: {
      systemDesign,
      systemTestDesign,
      architecture,
      integrationTestDesign,
      moduleDesigns,
      unitTestDesigns,
      implementations: perIncrement.map((p) => p.implementation),
      testResults: verification,
      verificationPlans,
    },
    previousMatrix: traceabilityMatrices['formal-verification'],
    waivers,
    maxFixAttempts,
  });
  signoffs['caf.stage-exit.verification'] = verificationExit.signoff;
  traceabilityMatrices.verification = verificationExit.matrix;
  gateAttempts['verification'] = verificationExit.gateResult.attempts;
  if (verificationExit.gateResult.escalated) escalations += 1;

  // -------------------------------------------------------------------------
  // Phase 6 — Certification evidence assembly + independent certification gate + DER sign-off
  // -------------------------------------------------------------------------
  const finalMatrix = await ctx.task(traceabilityMatrixTask, {
    requirements,
    systemDesign,
    architecture,
    moduleDesigns,
    implementations: perIncrement.map((p) => p.implementation),
    unitTestDesigns,
    integrationTestDesign,
    systemTestDesign,
    acceptanceTestDesign,
    testResults: verification,
    proofResults: perProperty.map((p) => ({ propertyId: p.property.propertyId, proofStatus: p.finalProof.proofStatus, proofOutputPath: p.finalProof.proofOutputPath })),
  });
  traceabilityMatrices.certification = finalMatrix;

  const certificationTraceDiff = await ctx.task(traceDiffTask, {
    stage: 'certification',
    matrix: finalMatrix,
    previousMatrix: traceabilityMatrices.verification,
    requirements,
    waivers,
  });

  const certificationEvidenceAssembly = await ctx.task(assembleCertificationEvidenceTask, {
    softwareLevel: safetyAssessment.softwareLevel,
    objectives: safetyAssessment.objectives,
    verificationPlans,
    traceabilityMatrices: { ...traceabilityMatrices, certificationTraceDiff },
    verification,
    formalVerification,
    cleanroomDevelopment,
    waivers,
    signoffs,
  });

  // INDEPENDENT adversarial certification gate — critics DISTINCT from every
  // producer role and from the per-stage critics; auditor SPOT-CHECKS by
  // re-executing at least one test level and one property proof.
  const certificationGate = await adversarialGate(ctx, {
    gateId: 'caf.certification.evidence',
    artifact: {
      path: certificationEvidenceAssembly.evidenceIndexPath,
      description: 'Assembled DO-178C certification evidence index',
    },
    critics: [
      {
        name: 'certification-auditor',
        role: 'Independent DO-178C certification auditor (DER-adjacent, not a producer)',
        focus: 'walk the evidence index; every DO-178C objective for the assigned software level maps to an artifact; SPOT-CHECK by re-executing at least one test level and one property proof and diffing against recorded outputs',
      },
      {
        name: 'evidence-integrity-critic',
        role: 'Evidence integrity auditor',
        focus: 'every index entry resolves to a real artifact path or breakpoint event id; every waiver in the index matches the waivers provenance log exactly',
      },
    ],
    ironLaw: [
      'An objective without an executed-artifact citation is a gate failure — narrative compliance claims are inadmissible.',
    ],
    maxFixAttempts,
    fixer: { task: assembleCertificationEvidenceTask, args: {
      softwareLevel: safetyAssessment.softwareLevel,
      objectives: safetyAssessment.objectives,
      verificationPlans,
      traceabilityMatrices: { ...traceabilityMatrices, certificationTraceDiff },
      verification,
      formalVerification,
      cleanroomDevelopment,
      waivers,
      signoffs,
    } },
    context: { softwareLevel: safetyAssessment.softwareLevel, evidenceIndexPath: certificationEvidenceAssembly.evidenceIndexPath, waivers },
  });
  if (certificationGate.passed !== true) {
    throw new Error(`Certification evidence gate BLOCKED: caf.certification.evidence failed after ${certificationGate.attempts} attempt(s) (escalated: ${certificationGate.escalated}). The DER sign-off breakpoint is unreachable without a passed gate. Issues: ${JSON.stringify(certificationGate.issues)}`);
  }
  gateAttempts['certification-evidence'] = certificationGate.attempts;
  if (certificationGate.escalated) escalations += 1;

  // POLICY-GATED: DER sign-off. Payload constructed FROM the executed gate result
  // + evidence index + waiver log after a structural malformed-check. NEVER
  // auto-executes; approved !== true throws.
  if (typeof certificationGate.passed !== 'boolean' || typeof certificationGate.attempts !== 'number' || !Array.isArray(certificationGate.evidence)) {
    throw new Error('composition-aerospace-flight-control: certification gate result is malformed — a DER sign-off without the executed gate evidence is structurally impossible to construct');
  }
  const derDecision = await routedBreakpoint(ctx, {
    question: `DO-178C certification evidence sign-off (software level ${safetyAssessment.softwareLevel}): the certification gate passed in ${certificationGate.attempts} attempt(s), the evidence index lists ${certificationEvidenceAssembly.sections.length} objective section(s) with ${certificationEvidenceAssembly.openItems.length} open item(s), and the waiver log has ${waivers.length} entr(y/ies). Sign off the certification evidence package?`,
    evidenceIndexPath: certificationEvidenceAssembly.evidenceIndexPath,
    certificationGate: { passed: certificationGate.passed, attempts: certificationGate.attempts, escalated: certificationGate.escalated, evidence: certificationGate.evidence },
    openItems: certificationEvidenceAssembly.openItems,
    waivers,
  }, {
    breakpointId: 'certification-evidence-signoff',
    expert: 'designated-engineering-representative',
    tags: ['caf', 'policy-gated', 'certification', 'do-178c'],
    strategy: 'single',
    // NEVER auto-executes: no autoApproveAfterN, no presentAlwaysApprove.
  });
  if (derDecision.approved !== true) {
    const notes = derDecision.response ?? derDecision.feedback ?? 'no reviewer notes';
    throw new Error(`Certification evidence sign-off REJECTED by designated-engineering-representative: ${notes}. The evidence package cannot be released unsigned — no fallback.`);
  }
  const derSignoff = { ...derDecision, breakpointId: 'certification-evidence-signoff', autoApproved: false };
  signoffs['certification-evidence-signoff'] = derSignoff;

  const certificationEvidence = {
    evidenceIndexPath: certificationEvidenceAssembly.evidenceIndexPath,
    sections: certificationEvidenceAssembly.sections,
    certificationGate: { passed: certificationGate.passed, attempts: certificationGate.attempts, escalated: certificationGate.escalated, evidence: certificationGate.evidence },
    derSignoff,
  };

  // -------------------------------------------------------------------------
  // Phase 7 — Flight-software baseline release (policy-gated, guarded executor)
  // -------------------------------------------------------------------------
  const releaseDecision = await routedBreakpoint(ctx, {
    question: `Flight-software baseline release (software level ${safetyAssessment.softwareLevel}): signed certification evidence index ${certificationEvidence.evidenceIndexPath}, DER sign-off recorded, full traceability matrix attached, ${waivers.length} waiver(s), ${certificationEvidenceAssembly.openItems.length} open item(s). Approve release of the flight-software baseline for integration or flight test?`,
    evidenceIndexPath: certificationEvidence.evidenceIndexPath,
    derSignoff,
    traceabilityMatrixSummary: { stages: Object.keys(traceabilityMatrices) },
    waiverCount: waivers.length,
    openItems: certificationEvidenceAssembly.openItems,
  }, {
    breakpointId: 'flight-software-baseline-release',
    expert: 'chief-engineer',
    tags: ['caf', 'policy-gated', 'release', 'flight-test'],
    strategy: 'single',
    // NEVER auto-executes: no autoApproveAfterN, no presentAlwaysApprove.
  });
  signoffs['flight-software-baseline-release'] = { ...releaseDecision, breakpointId: 'flight-software-baseline-release', autoApproved: false };

  // GUARDED EXECUTOR: caf.baseline-release runs ONLY on approved === true.
  let baselineRelease = null;
  let success = false;
  if (releaseDecision.approved === true) {
    baselineRelease = await ctx.task(baselineReleaseTask, {
      evidenceIndex: certificationEvidence.evidenceIndexPath,
      derSignoff,
      traceabilityMatrices,
      approvalProvenance: {
        breakpointId: 'flight-software-baseline-release',
        respondedBy: releaseDecision.respondedBy ?? null,
        autoApproved: false,
        approvedAt: new Date().toISOString(),
      },
    });
    success = true;
  }
  // On rejection: baselineRelease stays null, success stays false — no fallback
  // release path exists in this process.

  // -------------------------------------------------------------------------
  // Phase 8 — kip assert (both outcomes)
  // -------------------------------------------------------------------------
  const stagesPassed = Object.keys(signoffs).filter((s) => s.startsWith('caf.stage-exit.')).map((s) => s.replace('caf.stage-exit.', ''));
  const provedCount = perProperty.filter((p) => p.finalProof.proofStatus === 'proved').length;
  const waivedProofCount = perProperty.filter((p) => p.waiver !== null).length;
  const proofSummary = { proved: provedCount, waived: waivedProofCount };

  await kipAssert(ctx, {
    kipDir,
    kipModel,
    kind: 'methodology-composition',
    facts: [
      { subject: 'process:composition-aerospace-flight-control', predicate: 'composes', object: 'methodology:waterfall' },
      { subject: 'process:composition-aerospace-flight-control', predicate: 'composes', object: 'methodology:v-model' },
      { subject: 'process:composition-aerospace-flight-control', predicate: 'composes', object: 'methodology:cleanroom' },
      {
        subject: 'process:composition-aerospace-flight-control',
        predicate: 'inlines-methodology',
        object: 'methodology:formal-verification',
        props: { reason: 'no library dir exists; strangler-fig inline precedent', seam: 'caf.formal-* task set + proof-evidence schema' },
      },
      {
        subject: 'methodology:cleanroom',
        predicate: 'feeds',
        object: 'skill-area:formal-verification',
        props: { interface: 'box-structure formal specs feed per-property model construction' },
      },
      { subject: 'process:composition-aerospace-flight-control', predicate: 'enforces-pattern', object: 'pattern:executed-proof-output-required-for-certification' },
      { subject: 'process:composition-aerospace-flight-control', predicate: 'enforces-pattern', object: 'pattern:requirement-waiver-provenance-threading' },
      {
        subject: `run:${ctx.runId}`,
        predicate: 'run-outcome',
        object: 'process:composition-aerospace-flight-control',
        props: {
          softwareLevel: safetyAssessment.softwareLevel,
          stagesPassed,
          gateAttempts,
          escalations,
          proofSummary,
          waiverCount: waivers.length,
          released: success,
        },
      },
    ],
  });

  return {
    success,
    srs,
    safetyAssessment,
    vModelDesign,
    cleanroomDevelopment,
    formalVerification,
    verification,
    traceabilityMatrices,
    waivers,
    certificationEvidence,
    signoffs,
    baselineRelease,
    metadata: {
      process: 'methodologies/composition-aerospace-flight-control',
      projectName: PROJECT_NAME,
      softwareLevel: safetyAssessment.softwareLevel,
      complianceStandards,
      waivers,
      gateAttempts,
      escalations,
      proofSummary,
      kipRecallFactCount: recall.factCount,
    },
  };
}
