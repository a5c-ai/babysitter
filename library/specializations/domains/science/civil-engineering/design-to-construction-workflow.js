/**
 * @process specializations/domains/science/civil-engineering/design-to-construction-workflow
 * @description Design-to-construction end-to-end flagship: project brief + siting constraints ->
 *   concept design and load/seismic analysis -> parallel discipline design (structural, geotechnical,
 *   MEP, drainage) with per-element executed capacity checks -> specifications + BIM coordination +
 *   code-compliance permit package -> INDEPENDENT adversarial structural peer review (recomputed
 *   governing load combinations, opened calculation artifacts, file:line citations) plus a
 *   constructability/BIM-clash conformance gate -> engineer-of-record stamp -> permit submission to
 *   the AHJ -> construction release -> shop-drawing review and fabrication release -> construction QC
 *   with inspection hold points and RFI/field-deviation handling -> handover and as-built
 *   reconciliation. Every stage exit is guarded by an EXECUTED requirement/code-clause-to-drawing/
 *   calculation traceability diff plus a routed sign-off. All five statutory actions are fail-closed
 *   policy-gated human approvals that never auto-execute; a failed peer-review check blocks the stamp
 *   and there is no reduced-scope stamp path.
 * @inputs { projectId: string, projectBrief: string, siteLocation: object, projectType: string (building|bridge|site-civil), occupancyCategory?: string, jurisdiction: object, applicableCodes?: string[] (default DEFAULT_CODES), structureLoadsHint?: object, disciplineScopeHint?: string[], shopDrawingSubmittals?: array, kipDir?: string (default '.a5c/kip'), kipModel?: string (default 'sonnet'), maxFixAttempts?: number (default 2), maxCheckAttempts?: number (default 2) }
 * @outputs { success: boolean, projectBriefRecord: object, requirementRegister: object, conceptDesign: object, siteInvestigation: object, analysis: object, disciplineDesigns: object, elementChecks: array, specifications: object, bimCoordination: object, permitPackage: object, peerReview: object, gates: object, stamp: object|null, permitSubmission: object|null, constructionRelease: object|null, shopDrawings: array, holdPoints: array, deviations: array, asBuilt: object|null, handover: object|null, traceabilityMatrices: object, statutoryApprovals: array, signoffs: object, metadata: object }
 * @graph
 *   domains: [domain:civil-engineering]
 *   specializations: [specialization:construction-management]
 *   skillAreas: [skill-area:structural-analysis, skill-area:code-compliance, skill-area:quality-assurance]
 *   workflows: [workflow:design-review, workflow:permitting, workflow:construction-administration]
 *   topics: [topic:statutory-certification, topic:compliance-traceability, topic:public-safety]
 *   roles: [role:structural-engineer, role:geotechnical-engineer, role:construction-manager]
 *
 * Policy-gated actions (adapters/policy ready):
 *   - design-to-construction.engineer-of-record-stamp   (expert: engineer-of-record)          — apply the EOR seal to the design documents, taking personal legal responsibility for public safety
 *   - design-to-construction.permit-submission          (expert: engineer-of-record)          — submit the permit application to the authority having jurisdiction
 *   - design-to-construction.shop-drawing-approval      (expert: engineer-of-record)          — approve a fabricator shop drawing, authorizing fabrication to begin
 *   - design-to-construction.hold-point-release         (expert: construction-quality-manager)— release a construction hold point (e.g. rebar inspection before pour), allowing work to be permanently covered
 *   - design-to-construction.design-deviation-acceptance(expert: engineer-of-record)          — accept a field deviation or substitution from the stamped design
 */

import { defineTask, globalTaskRegistry } from '@a5c-ai/babysitter-sdk';

import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../../../common-utilities/routed-gate-combinators.js';

// ---------------------------------------------------------------------------
// Ingredient processes — composed BY NAME (18 modules)
// ---------------------------------------------------------------------------
//
// Composed BY NAME, never re-implemented:
//   geotechnical-site-investigation, slope-stability-analysis, structural-load-analysis,
//   seismic-design-analysis, foundation-design, reinforced-concrete-design,
//   structural-steel-design, retaining-wall-design, bridge-design-lrfd,
//   stormwater-management-design, specifications-development, bim-coordination,
//   structural-peer-review, permit-application-preparation, shop-drawing-review,
//   construction-quality-control, construction-cost-estimation,
//   construction-schedule-development.
//
// Only the exported task factories are imported. Ingredient process() functions
// are deliberately NOT imported and NOT called, so ingredient-internal
// breakpoints and fix loops never double-fire inside this composition.
//
// The MEP/utility slice has no module under this directory and is therefore
// modeled INLINE as the d2c.mep-systems-design task (strangler-fig precedent
// from composition-aerospace-flight-control's inline caf.formal-* tasks).

import {
  siteAssessmentTask,
  boringProgramTask,
  fieldInvestigationTask,
  labTestingTask,
  subsurfaceCharacterizationTask,
  foundationRecommendationsTask,
  constructionConsiderationsTask,
  geotechReportTask,
} from './geotechnical-site-investigation.js';

import {
  geometryDefinitionTask,
  soilCharacterizationTask,
  staticStabilityTask,
  seismicStabilityTask,
  groundwaterSensitivityTask,
  remediationDesignTask,
  monitoringPlanTask,
  stabilityReportTask,
} from './slope-stability-analysis.js';

import {
  projectSetupTask,
  deadLoadAnalysisTask,
  liveLoadAnalysisTask,
  windLoadAnalysisTask,
  seismicLoadAnalysisTask,
  snowRainLoadAnalysisTask,
  loadCombinationsTask,
  loadPathAnalysisTask,
  loadReportTask,
} from './structural-load-analysis.js';

import {
  seismicHazardTask,
  sdcDeterminationTask,
  systemSelectionTask,
  seismicForceAnalysisTask,
  responseSpectrumTask,
  driftAnalysisTask,
  seismicDetailingTask,
  nonStructuralTask,
  seismicReportTask,
} from './seismic-design-analysis.js';

import {
  foundationSelectionTask,
  bearingCapacityTask,
  settlementAnalysisTask,
  shallowFoundationTask,
  deepFoundationTask,
  pileCapDesignTask,
  gradeBeamDesignTask,
  foundationPlansTask,
  foundationSpecsTask,
} from './foundation-design.js';

import {
  designCriteriaTask,
  beamDesignTask,
  columnDesignTask,
  slabDesignTask,
  shearWallDesignTask,
  foundationDesignTask,
  detailingTask,
  reinforcementSchedulesTask,
  structuralDrawingsTask,
} from './reinforced-concrete-design.js';

import {
  steelDesignCriteriaTask,
  steelBeamDesignTask,
  steelColumnDesignTask,
  bracingDesignTask,
  momentFrameDesignTask,
  connectionDesignTask,
  steelDetailingTask,
  materialTakeoffTask,
} from './structural-steel-design.js';

import {
  wallGeometryTask,
  earthPressureTask,
  externalStabilityTask,
  structuralDesignTask,
  globalStabilityTask,
  drainageDesignTask,
  wallDrawingsTask,
  wallSpecsTask,
} from './retaining-wall-design.js';

import {
  bridgeGeometryTask,
  bridgeLoadAnalysisTask,
  superstructureDesignTask,
  deckDesignTask,
  substructureDesignTask,
  bridgeFoundationTask,
  bearingDesignTask,
  loadRatingTask,
  bridgeReportTask,
} from './bridge-design-lrfd.js';

import {
  hydrologicAnalysisTask,
  prePostComparisonTask,
  waterQualityTask,
  lidDesignTask,
  detentionDesignTask,
  conveyanceDesignTask,
  escDesignTask,
  drainagePlansTask,
  stormwaterReportTask,
} from './stormwater-management-design.js';

import {
  specScopeDefinitionTask,
  generalRequirementsTask,
  technicalSpecsTask,
  materialSpecsTask,
  executionProceduresTask,
  qaSpecsTask,
  referenceCompilationTask,
  specsAssemblyTask,
} from './specifications-development.js';

import {
  standardsVerificationTask,
  modelAggregationTask,
  clashDetectionTask,
  clashAnalysisTask,
  clashResolutionTask,
  updateVerificationTask,
  coordinationDrawingsTask,
  coordinationReportTask,
} from './bim-coordination.js';

import {
  permitRequirementsTask,
  buildingPermitTask,
  sitePermitTask,
  environmentalPermitsTask,
  utilityPermitsTask,
  supportingDocsTask,
  feeCalculationTask,
  submissionPackageTask,
} from './permit-application-preparation.js';

import {
  submittalLoggingTask,
  specComplianceTask,
  designIntentTask,
  coordinationReviewTask,
  materialReviewTask,
  commentCompilationTask,
  approvalDeterminationTask,
  responsePackageTask,
} from './shop-drawing-review.js';

import {
  requirementsAnalysisTask,
  qcPlanDevelopmentTask,
  inspectionProtocolsTask,
  testingRequirementsTask,
  acceptanceCriteriaTask,
  inspectionChecklistsTask,
  nonConformanceProceduresTask,
  qcDocumentationTask,
} from './construction-quality-control.js';

import {
  wbsDevelopmentTask,
  activityDefinitionTask,
  durationEstimationTask,
  activitySequencingTask,
  criticalPathTask,
  resourceLoadingTask,
  scheduleOptimizationTask,
  scheduleDocumentationTask,
} from './construction-schedule-development.js';

// structural-peer-review.js and construction-cost-estimation.js BOTH register
// the SDK global task id 'scope-definition' at module-evaluation time, and
// packages/babysitter-sdk/src/tasks/registry.ts THROWS DuplicateTaskIdError on
// the second registration — importing both statically crashes this file at
// load. 'scope-definition' is the ONLY collision across the 18 ingredients
// (verified by enumerating every defineTask id). This composition uses NEITHER
// module's scopeDefinitionTask — d2c.project-brief and d2c.code-requirement-register
// do that work — so the two modules are imported sequentially and the inert
// colliding definition is cleared between them, exactly as
// composition-aerospace-flight-control does for the waterfall/v-model
// 'implementation' collision.
const peerReviewModule = await import('./structural-peer-review.js');
const {
  codeComplianceTask,
  loadReviewTask,
  analysisReviewTask,
  memberReviewTask,
  connectionReviewTask,
  constructabilityReviewTask,
  commentResolutionTask,
  peerReviewReportTask,
} = peerReviewModule;
if (globalTaskRegistry.hasTask('scope-definition')) {
  globalTaskRegistry.definitions.delete('scope-definition');
}
const costModule = await import('./construction-cost-estimation.js');
const {
  quantityTakeoffTask,
  unitCostTask,
  directCostTask,
  indirectCostTask,
  contingencyAnalysisTask,
  bidTabulationTask,
  costReportTask,
} = costModule;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROCESS_NAME = 'design-to-construction-workflow';

/** kip kind for BOTH kipRecall and kipAssert. */
const KIP_KIND = 'civil-design-record';

const ARTIFACT_ROOT = 'artifacts/d2c';

/**
 * Default applicable code family. d2c.code-requirement-register output is the
 * AUTHORITY; this is only a seed.
 */
const DEFAULT_CODES = ['IBC', 'ASCE 7', 'ACI 318', 'AISC 360'];

const DISCIPLINES = ['structural', 'geotechnical', 'mep', 'drainage'];

/**
 * The foundation selections this composition knows how to route, keyed to the
 * value foundation-design.js foundationSelectionTask DECLARES (`selectedType`).
 * The shallow set mirrors foundation-design.js's own branch
 * (`selectedType === 'shallow' || selectedType === 'mat'`). Anything outside
 * these two sets throws — a safety-critical branch is never chosen by default.
 */
const SHALLOW_FOUNDATION_TYPES = ['shallow', 'mat'];
const DEEP_FOUNDATION_TYPES = ['deep'];

/**
 * Shop-drawing approval determinations, keyed to the value
 * shop-drawing-review.js approvalDeterminationTask DECLARES (`status`).
 * RELEASING statuses raise the design-to-construction.shop-drawing-approval
 * statutory breakpoint; RESUBMIT statuses deliberately do not (the fabricator
 * resubmits, which is out of scope). A status in NEITHER set throws — a
 * statutory approval silently skipped is worse than a stopped run.
 */
const RELEASING_SUBMITTAL_STATUSES = ['approved', 'approved-as-noted'];
const RESUBMIT_SUBMITTAL_STATUSES = ['revise-and-resubmit', 'rejected'];

const NEVER_AUTO_APPROVE_ACTIONS = [
  'design-to-construction.engineer-of-record-stamp',
  'design-to-construction.permit-submission',
  'design-to-construction.hold-point-release',
];

/**
 * The five declared policy-gated actions. breakpointId === actionId EXACTLY,
 * with no instance suffix — that exactness is what adapters/policy YAML matches
 * on. Per-instance uniqueness is carried by the instanceId tag, the routing
 * label, and the per-instance breakpointEventId recorded in the approvals log.
 */
const POLICY_GATED_ACTIONS = {
  'design-to-construction.engineer-of-record-stamp': {
    expert: 'engineer-of-record',
    tags: ['d2c', 'policy-gated', 'stamp', 'public-safety'],
  },
  'design-to-construction.permit-submission': {
    expert: 'engineer-of-record',
    tags: ['d2c', 'policy-gated', 'permit', 'public-safety'],
  },
  'design-to-construction.shop-drawing-approval': {
    expert: 'engineer-of-record',
    tags: ['d2c', 'policy-gated', 'shop-drawing'],
  },
  'design-to-construction.hold-point-release': {
    expert: 'construction-quality-manager',
    tags: ['d2c', 'policy-gated', 'hold-point'],
  },
  'design-to-construction.design-deviation-acceptance': {
    expert: 'engineer-of-record',
    tags: ['d2c', 'policy-gated', 'deviation'],
  },
};

/** The 18 ingredient processes composed BY NAME (kip provenance + JSDoc parity). */
const INGREDIENT_PROCESSES = [
  'geotechnical-site-investigation',
  'slope-stability-analysis',
  'structural-load-analysis',
  'seismic-design-analysis',
  'foundation-design',
  'reinforced-concrete-design',
  'structural-steel-design',
  'retaining-wall-design',
  'bridge-design-lrfd',
  'stormwater-management-design',
  'specifications-development',
  'bim-coordination',
  'structural-peer-review',
  'permit-application-preparation',
  'shop-drawing-review',
  'construction-quality-control',
  'construction-cost-estimation',
  'construction-schedule-development',
];

/**
 * Normalize a heterogeneous list of records (objects carrying
 * id/reqId/elementId/holdPointId/submittalId/deviationId/name, or bare string
 * ids) to string ids. Internal; ported from composition-aerospace-flight-control.
 *
 * @param {Array<object|string>} list
 * @returns {string[]}
 */
function extractIds(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((x) => (x && typeof x === 'object'
      ? (x.id ?? x.reqId ?? x.elementId ?? x.holdPointId ?? x.submittalId ?? x.deviationId ?? x.name)
      : x))
    .filter((x) => typeof x === 'string' && x.length > 0);
}

// ---------------------------------------------------------------------------
// d2c.* tasks — Style-A agent-only factories
// ---------------------------------------------------------------------------

/**
 * d2c.project-brief — capture the project definition and the siting constraint
 * set, and pin the ADOPTED code editions the AHJ enforces.
 *
 * Usage:
 *   const brief = await ctx.task(projectBriefTask, { projectId, projectBrief, siteLocation, projectType, jurisdiction, applicableCodes, kipInsights });
 *
 * @param {object} args - { projectBrief, projectId, siteLocation, projectType, occupancyCategory, jurisdiction, applicableCodes, kipInsights }
 * @returns {{projectProfile: object, sitingConstraints: array, jurisdictionRecord: object, adoptedCodeEditions: array, refutedCodes: array, evidence: string[]}}
 */
export const projectBriefTask = defineTask('d2c.project-brief', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Project brief + siting constraints',
  agent: {
    name: 'civil-project-planner',
    prompt: {
      role: 'Civil project engineer (project definition and siting)',
      task: 'Capture the project brief and the siting constraint set that governs the design',
      context: {
        projectBrief: args.projectBrief,
        projectId: args.projectId,
        siteLocation: args.siteLocation,
        projectType: args.projectType,
        occupancyCategory: args.occupancyCategory,
        jurisdiction: args.jurisdiction,
        applicableCodes: args.applicableCodes,
        kipInsights: args.kipInsights,
      },
      instructions: [
        'Capture the project definition: structure type, occupancy/risk category, service life, performance objectives, and the owner\'s stated constraints.',
        'Enumerate the siting constraints: parcel geometry, setbacks, easements, adjacent structures, utility corridors, access/laydown, environmental overlays (wetlands, floodplain, coastal), and known hazards.',
        'Identify the authority having jurisdiction and the ADOPTED code edition it enforces — the adopted edition, not the newest published edition.',
        'applicableCodes from the caller is a HINT ONLY; confirm or refute each entry against the jurisdiction record and list refutations in refutedCodes.',
        'Every constraint entry must cite its source (survey, title record, ordinance section, agency correspondence). An uncited constraint is not a constraint.',
      ],
      outputFormat: 'JSON with projectProfile object, sitingConstraints array, jurisdictionRecord object, adoptedCodeEditions array, refutedCodes array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['projectProfile', 'sitingConstraints', 'jurisdictionRecord', 'adoptedCodeEditions', 'evidence'],
      properties: {
        projectProfile: { type: 'object' },
        sitingConstraints: { type: 'array' },
        jurisdictionRecord: { type: 'object' },
        adoptedCodeEditions: { type: 'array' },
        refutedCodes: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'd2c', 'project-definition'],
}));

/**
 * d2c.code-requirement-register — the authoritative requirement <-> code-clause
 * register. This register is the traceability spine every drawing and
 * calculation must trace back to.
 *
 * Usage:
 *   const register = await ctx.task(codeRequirementRegisterTask, { projectProfile, sitingConstraints, adoptedCodeEditions, jurisdictionRecord, disciplineScopeHint, kipInsights });
 *
 * @param {object} args - { projectProfile, sitingConstraints, adoptedCodeEditions, jurisdictionRecord, disciplineScopeHint, kipInsights }
 * @returns {{requirements: array, disciplineCoverage: string[], amendments: array, evidence: string[]}}
 */
export const codeRequirementRegisterTask = defineTask('d2c.code-requirement-register', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Requirement <-> code-clause register (traceability spine)',
  agent: {
    name: 'code-compliance-registrar',
    prompt: {
      role: 'Building-code compliance registrar',
      task: 'Build the authoritative requirement register that every downstream drawing and calculation must trace to',
      context: {
        projectProfile: args.projectProfile,
        sitingConstraints: args.sitingConstraints,
        adoptedCodeEditions: args.adoptedCodeEditions,
        jurisdictionRecord: args.jurisdictionRecord,
        disciplineScopeHint: args.disciplineScopeHint,
        kipInsights: args.kipInsights,
      },
      instructions: [
        'Produce one register entry per governing requirement: {reqId, discipline, requirementText, codeClause (document + edition + section number), acceptanceCriterion, verificationMethod: calculation|test|inspection|drawing-note}.',
        'Every entry MUST carry a specific clause number from an ADOPTED edition — "per ASCE 7" with no section is a register defect, not an entry.',
        'Include jurisdiction-specific amendments and any owner performance requirements that exceed code, tagged source: code|amendment|owner.',
        'disciplineScopeHint is a HINT ONLY; the register\'s discipline coverage governs which discipline packages Phase 3 must produce.',
        'This register is the traceability spine: d2c.trace-diff diffs against reqId, so ids must be stable and unique.',
      ],
      outputFormat: 'JSON with requirements array, disciplineCoverage array, amendments array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['requirements', 'disciplineCoverage', 'evidence'],
      properties: {
        requirements: { type: 'array', minItems: 1 },
        disciplineCoverage: { type: 'array' },
        amendments: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'd2c', 'code-compliance', 'traceability'],
}));

/**
 * d2c.concept-design — select the structural system and enumerate the
 * structural element inventory that drives the Phase-3 ctx.parallel.map.
 *
 * Usage:
 *   const concept = await ctx.task(conceptDesignTask, { projectProfile, sitingConstraints, requirements, geotechnicalReport, slopeStabilityReport, kipInsights });
 *
 * @param {object} args - { projectProfile, sitingConstraints, requirements, geotechnicalReport, slopeStabilityReport, kipInsights }
 * @returns {{conceptDesign: object, structuralSystem: object, structuralElements: array, disciplinesInScope: string[], alternativesConsidered: array, evidence: string[]}}
 */
export const conceptDesignTask = defineTask('d2c.concept-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Concept design + structural element inventory',
  agent: {
    name: 'concept-design-engineer',
    prompt: {
      role: 'Structural concept design engineer',
      task: 'Select the structural system and enumerate the structural element inventory that drives the parallel discipline design',
      context: {
        projectProfile: args.projectProfile,
        sitingConstraints: args.sitingConstraints,
        requirements: args.requirements,
        geotechnicalReport: args.geotechnicalReport,
        slopeStabilityReport: args.slopeStabilityReport,
        kipInsights: args.kipInsights,
      },
      instructions: [
        'Select the structural system and lateral system with an explicit alternatives comparison grounded in the requirement register and the geotechnical findings.',
        'Enumerate the structural element inventory as {elementId, elementType (beam|column|slab|shear-wall|footing|pile-cap|retaining-wall|girder|deck), discipline, tributaryDescription, governingRequirementIds} — this list drives ctx.parallel.map in Phase 3.',
        `Declare which of the four disciplines (${DISCIPLINES.join(', ')}) are in scope, justified against disciplineCoverage from the register.`,
        'An empty structural element inventory is a caller/scope error, not a valid concept — say so explicitly rather than returning an empty list.',
      ],
      outputFormat: 'JSON with conceptDesign object, structuralSystem object, structuralElements array, disciplinesInScope array, alternativesConsidered array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['conceptDesign', 'structuralSystem', 'structuralElements', 'disciplinesInScope', 'evidence'],
      properties: {
        conceptDesign: { type: 'object' },
        structuralSystem: { type: 'object' },
        structuralElements: { type: 'array', minItems: 1 },
        disciplinesInScope: { type: 'array', minItems: 1 },
        alternativesConsidered: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'd2c', 'concept-design'],
}));

/**
 * d2c.mep-systems-design — INLINE ingredient. No MEP process module exists under
 * library/specializations/domains/science/civil-engineering/, so the MEP/utility
 * slice is modeled inline per the strangler-fig precedent used for caf.formal-*
 * in composition-aerospace-flight-control.
 *
 * Usage:
 *   const mep = await ctx.task(mepSystemsDesignTask, { conceptDesign, structuralSystem, requirements, sitingConstraints, structuralElements });
 *
 * @param {object} args - { conceptDesign, structuralSystem, requirements, sitingConstraints, structuralElements }
 * @returns {{mepDesign: object, penetrationSchedule: array, coordinationDemands: array, requirementIds: string[], evidence: string[]}}
 */
export const mepSystemsDesignTask = defineTask('d2c.mep-systems-design', (args, taskCtx) => ({
  kind: 'agent',
  title: 'MEP / utility systems design (INLINE ingredient)',
  agent: {
    name: 'mep-systems-engineer',
    prompt: {
      role: 'Building services / utility systems engineer',
      task: 'Design the MEP and utility systems slice for coordination with the structural and civil packages',
      context: {
        conceptDesign: args.conceptDesign,
        structuralSystem: args.structuralSystem,
        requirements: args.requirements,
        sitingConstraints: args.sitingConstraints,
        structuralElements: args.structuralElements,
      },
      instructions: [
        'Design the mechanical, electrical, plumbing, and site-utility systems at the level needed for coordination: equipment loads and locations, main distribution routes, riser/chase locations, service entries, and penetration schedules.',
        'Every penetration through a structural element MUST reference the elementId it passes through so BIM clash detection and the structural package can react.',
        'Cite the register reqIds each system satisfies (life safety, egress lighting, fire protection water demand, ventilation).',
        'Report structural coordination demands explicitly in coordinationDemands — hidden MEP demands are the primary source of late clashes.',
      ],
      outputFormat: 'JSON with mepDesign object, penetrationSchedule array, coordinationDemands array, requirementIds array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['mepDesign', 'penetrationSchedule', 'coordinationDemands', 'requirementIds', 'evidence'],
      properties: {
        mepDesign: { type: 'object' },
        penetrationSchedule: { type: 'array' },
        coordinationDemands: { type: 'array' },
        requirementIds: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'd2c', 'mep', 'inline-ingredient'],
}));

/**
 * d2c.discipline-package — index one discipline's ingredient outputs into a
 * reviewable package with concrete calculation/drawing artifact paths.
 *
 * Usage:
 *   const pkg = await ctx.task(disciplinePackageTask, { discipline, ingredientOutputs, requirements, conceptDesign });
 *
 * @param {object} args - { discipline, ingredientOutputs, requirements, conceptDesign }
 * @returns {{discipline: string, packagePath: string, artifacts: array, unlinkedRequirements: array, evidence: string[]}}
 */
export const disciplinePackageTask = defineTask('d2c.discipline-package', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assemble discipline design package: ${args.discipline}`,
  agent: {
    name: 'discipline-package-assembler',
    prompt: {
      role: 'Discipline design package assembler',
      task: 'Assemble one discipline\'s ingredient outputs into a reviewable design package with concrete calculation and drawing artifact paths',
      context: {
        discipline: args.discipline,
        ingredientOutputs: args.ingredientOutputs,
        requirements: args.requirements,
        conceptDesign: args.conceptDesign,
      },
      instructions: [
        `Assemble the discipline package index at ${ARTIFACT_ROOT}/disciplines/${args.discipline}/package.json listing every drawing and every calculation artifact produced by the composed ingredient tasks for this discipline.`,
        'Each index entry MUST be {artifactId, kind: drawing|calculation|specification|model, path, requirementIds} — a prose assertion is not an entry.',
        'Report unlinkedRequirements: register reqIds assigned to this discipline that no artifact in the package covers. Do not hide them; the trace diff will find them anyway.',
        'Do not re-derive engineering results here — this task indexes what the ingredient tasks produced; inventing a calculation that no ingredient ran is a defect.',
      ],
      outputFormat: 'JSON with discipline string, packagePath string, artifacts array, unlinkedRequirements array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['discipline', 'packagePath', 'artifacts', 'unlinkedRequirements', 'evidence'],
      properties: {
        discipline: { type: 'string' },
        packagePath: { type: 'string' },
        artifacts: { type: 'array', minItems: 1 },
        unlinkedRequirements: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'd2c', 'discipline-package'],
}));

/**
 * d2c.element-design-check — EXECUTE the governing-load-combination capacity
 * check for ONE structural element and capture the computation to disk.
 *
 * Usage:
 *   const check = await ctx.task(elementDesignCheckTask, { element, loadCombinations, disciplineDesigns, requirements, attempt });
 *
 * @param {object} args - { element, loadCombinations, disciplineDesigns, requirements, attempt }
 * @returns {{elementId: string, checkPath: string, governingCombination: object, demandCapacityRatio: number, passed: boolean, codeClauses: array, evidence: string[]}}
 */
export const elementDesignCheckTask = defineTask('d2c.element-design-check', (args, taskCtx) => ({
  kind: 'agent',
  title: `EXECUTED element capacity check: ${args.elementId} (attempt ${args.attempt})`,
  agent: {
    name: 'element-check-engineer',
    prompt: {
      role: 'Structural engineer executing member capacity checks',
      task: 'EXECUTE the governing-load-combination capacity check for ONE structural element and capture the computation',
      context: {
        element: args.element,
        loadCombinations: args.loadCombinations,
        disciplineDesigns: args.disciplineDesigns,
        requirements: args.requirements,
        attempt: args.attempt,
      },
      instructions: [
        'EXECUTE, do not narrate: enumerate the applicable load combinations for this element from the load-combination set, compute the demand for each, identify the GOVERNING combination, and compute the capacity from the member design.',
        `CAPTURE the computation to ${ARTIFACT_ROOT}/elements/${args.elementId}/check.json as {elementId, combinationsEvaluated:[{combinationId, demand, units}], governingCombination, demand, capacity, demandCapacityRatio, passed, codeClauses:[...]}.`,
        'passed is demandCapacityRatio <= 1.0 for the governing combination. Report the real ratio; a rounded-down or asserted ratio is a falsified check.',
        'Cite the code clause governing the capacity equation used, with document + edition + section.',
        'If the element\'s inputs are incomplete, FAIL the check with the missing input named — never assume a value to make the check pass.',
      ],
      outputFormat: 'JSON with elementId string, checkPath string, governingCombination object, demandCapacityRatio number, passed boolean, codeClauses array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['elementId', 'checkPath', 'governingCombination', 'demandCapacityRatio', 'passed', 'codeClauses', 'evidence'],
      properties: {
        elementId: { type: 'string' },
        checkPath: { type: 'string' },
        governingCombination: { type: 'object' },
        demandCapacityRatio: { type: 'number' },
        passed: { type: 'boolean' },
        codeClauses: { type: 'array', minItems: 1 },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'd2c', 'structural', 'executed-check'],
}));

/**
 * d2c.trace-diff — COMPUTE (do not narrate) the requirement/code-clause ->
 * drawing/calculation set-diff for one stage and write it to
 * artifacts/d2c/<stage>/trace-diff.json. Every stage-exit gate reviews THIS
 * executed artifact.
 *
 * Usage:
 *   const diff = await ctx.task(traceDiffTask, { stage, requirements, artifacts, previousMatrix, deviations });
 *
 * @param {object} args - { stage, requirements, artifacts, previousMatrix, deviations }
 * @returns {{diffPath: string, coveredCount: number, uncovered: array, orphanedArtifacts: array, regressions: array, deviatedRequirements: array, evidence: string[]}}
 */
export const traceDiffTask = defineTask('d2c.trace-diff', (args, taskCtx) => ({
  kind: 'agent',
  title: `COMPUTE requirement -> drawing/calculation trace diff: ${args.stage}`,
  agent: {
    name: 'trace-diff-computer',
    prompt: {
      role: 'Traceability computation engineer',
      task: `COMPUTE, do not narrate: the requirement/code-clause-to-drawing/calculation set-diff for stage "${args.stage}"`,
      context: {
        stage: args.stage,
        requirements: args.requirements,
        artifacts: args.artifacts,
        previousMatrix: args.previousMatrix,
        deviations: args.deviations,
      },
      instructions: [
        'Load the register requirement ids and every artifact index entry for the stage from the context; EXECUTE the set-diff — actually enumerate ids, do not summarize in prose.',
        `Write the computed diff to ${ARTIFACT_ROOT}/${args.stage}/trace-diff.json as {stage, coveredCount, uncovered:[reqIds], orphanedArtifacts:[artifactIds], regressions:[reqIds], deviatedRequirements:[{reqId, deviationBreakpointEventId}]}.`,
        'uncovered = register reqIds with no drawing/calculation artifact link in the current stage index.',
        'orphanedArtifacts = artifact ids in the index that trace to no reqId.',
        'regressions = reqIds covered in the previous matrix but uncovered now (empty when there is no previous matrix).',
        'Every requirement intentionally departed from MUST appear in deviatedRequirements citing the exact recorded design-to-construction.design-deviation-acceptance breakpoint event id from the deviations log — a deviated-but-uncited requirement is a diff FAILURE.',
        'Report exact counts and the written path; evidence cites the executed computation and the written file, not opinions.',
      ],
      outputFormat: 'JSON with diffPath string, coveredCount number, uncovered array, orphanedArtifacts array, regressions array, deviatedRequirements array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['diffPath', 'coveredCount', 'uncovered', 'orphanedArtifacts', 'regressions', 'deviatedRequirements', 'evidence'],
      properties: {
        diffPath: { type: 'string' },
        coveredCount: { type: 'number' },
        uncovered: { type: 'array' },
        orphanedArtifacts: { type: 'array' },
        regressions: { type: 'array' },
        deviatedRequirements: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'd2c', 'traceability'],
}));

/**
 * d2c.assemble-design-record — assemble the statutory design record index from
 * executed artifacts, peer-review findings, and recorded approvals. This index
 * is the artifact the independent design-review gate audits.
 *
 * Usage:
 *   const record = await ctx.task(assembleDesignRecordTask, { requirements, disciplinePackages, elementChecks, analysis, specifications, bimCoordination, peerReview, traceabilityMatrices, deviations, statutoryApprovals });
 *
 * @param {object} args - { requirements, disciplinePackages, elementChecks, analysis, specifications, bimCoordination, peerReview, traceabilityMatrices, deviations, statutoryApprovals, issues }
 * @returns {{recordIndexPath: string, sections: array, openItems: array, evidence: string[]}}
 */
export const assembleDesignRecordTask = defineTask('d2c.assemble-design-record', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble the statutory design record index',
  agent: {
    name: 'design-record-assembler',
    prompt: {
      role: 'Design record / document control engineer',
      task: 'Assemble the statutory design record index from executed artifacts, peer-review findings, and recorded approvals',
      context: {
        requirements: args.requirements,
        disciplinePackages: args.disciplinePackages,
        elementChecks: args.elementChecks,
        analysis: args.analysis,
        specifications: args.specifications,
        bimCoordination: args.bimCoordination,
        peerReview: args.peerReview,
        traceabilityMatrices: args.traceabilityMatrices,
        deviations: args.deviations,
        statutoryApprovals: args.statutoryApprovals,
        issues: args.issues,
      },
      instructions: [
        `Assemble ${ARTIFACT_ROOT}/design-record/index.json with sections mapping every register requirement to: the discipline package artifact(s), the executed element check(s), the analysis reports, the specification section, the BIM coordination record, and the peer-review disposition.`,
        'Every section entry MUST be {reqId, artifactPath | breakpointEventId} — a concrete artifact path or a recorded breakpoint event id. No entry may be a prose assertion.',
        'List in openItems every requirement not fully satisfied by an executed artifact (uncovered, deviated-with-citation, or failed check) — do not hide gaps.',
        'If invoked with gate issues in context, re-assemble to resolve every listed issue and report the resolution in evidence.',
      ],
      outputFormat: 'JSON with recordIndexPath string, sections array, openItems array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['recordIndexPath', 'sections', 'openItems', 'evidence'],
      properties: {
        recordIndexPath: { type: 'string' },
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
  labels: ['agent', 'd2c', 'design-record'],
}));

/**
 * d2c.fix-design — scope-wrapped remediation of listed design findings or
 * gate-reported issues. Used as the fixer for every adversarial gate and as the
 * body of the bounded element-check and hold-point re-inspection loops.
 *
 * Usage:
 *   const fix = await ctx.task(fixDesignTask, { artifact, issues, gateId, attempt, elementId, discipline, context });
 *
 * @param {object} args - { artifact, issues, gateId, attempt, elementId, discipline, context }
 * @returns {{fixed: boolean, changeKind: string, changes: array, evidence: string[]}}
 */
export const fixDesignTask = defineTask('d2c.fix-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fix design/gate issues: ${args.gateId} (attempt ${args.attempt})`,
  agent: {
    name: 'design-fixer',
    prompt: {
      role: 'Remediation engineer (design findings only)',
      task: 'Fix ONLY the listed design findings or gate-reported issues',
      context: {
        artifact: args.artifact,
        issues: args.issues,
        gateId: args.gateId,
        attempt: args.attempt,
        elementId: args.elementId,
        discipline: args.discipline,
        extra: args.context,
      },
      instructions: [
        'Scope-wrapped: fix ONLY the listed issues — no unrelated redesign, no scope growth.',
        'State whether the fix changed a drawing, a calculation, a specification section, or a design assumption in changeKind — an assumption change re-triggers the trace diff at the next stage exit.',
        'Re-run the affected executed check (element check, clash detection, or trace diff) and cite its new output; a fix without a re-executed check is not a fix.',
        'Do not dismiss findings. If a finding is genuinely wrong, refute it with a file:line citation instead of ignoring it.',
      ],
      outputFormat: 'JSON with fixed boolean, changeKind string, changes array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['fixed', 'changeKind', 'changes', 'evidence'],
      properties: {
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
  labels: ['agent', 'd2c', 'fixer'],
}));

/**
 * d2c.stamp-execution — GUARDED EXECUTOR. Scheduled ONLY inside
 * `if (stampDecision.approved === true)`; refuses without approval provenance.
 *
 * Usage:
 *   const stamp = await ctx.task(stampExecutionTask, { designRecordIndexPath, peerReviewDisposition, gateResults, traceabilityMatrices, approvalProvenance });
 *
 * @param {object} args - { designRecordIndexPath, peerReviewDisposition, gateResults, traceabilityMatrices, approvalProvenance }
 * @returns {{stampId: string, sealRecordPath: string, sealedManifest: array, approvalProvenance: object, evidence: string[]}}
 */
export const stampExecutionTask = defineTask('d2c.stamp-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply engineer-of-record seal (guarded executor)',
  agent: {
    name: 'engineer-of-record-stamp-executor',
    prompt: {
      role: 'Engineer of record document-control executor',
      task: 'Apply the engineer-of-record seal to the design document set and emit the seal record',
      context: {
        designRecordIndexPath: args.designRecordIndexPath,
        peerReviewDisposition: args.peerReviewDisposition,
        gateResults: args.gateResults,
        traceabilityMatrices: args.traceabilityMatrices,
        approvalProvenance: args.approvalProvenance,
      },
      instructions: [
        'REFUSE and FAIL if approvalProvenance is absent, or if it does not carry breakpointId "design-to-construction.engineer-of-record-stamp" with autoApproved:false and a respondedBy — an unapproved seal is never permitted.',
        'REFUSE and FAIL if the peer-review gate or the constructability gate result in context is not passed:true — a failed peer-review check blocks the stamp and there is no reduced-scope stamp path.',
        `Emit the seal record at ${ARTIFACT_ROOT}/stamp/seal-record.json: sealed sheet/calculation manifest with revision ids, the licensed professional's identification as supplied in the approval provenance, the seal date, and the jurisdiction.`,
        'Cite the signed design record index and both gate results in the seal record. Evidence cites the emitted records and the approval provenance, not prose.',
      ],
      outputFormat: 'JSON with stampId string, sealRecordPath string, sealedManifest array, approvalProvenance object, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['stampId', 'sealRecordPath', 'sealedManifest', 'approvalProvenance', 'evidence'],
      properties: {
        stampId: { type: 'string' },
        sealRecordPath: { type: 'string' },
        sealedManifest: { type: 'array', minItems: 1 },
        approvalProvenance: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'd2c', 'statutory', 'guarded-executor'],
}));

/**
 * d2c.permit-submission-execution — GUARDED EXECUTOR. Scheduled ONLY inside
 * `if (permitDecision.approved === true)`.
 *
 * Usage:
 *   const submission = await ctx.task(permitSubmissionExecutionTask, { permitPackage, stamp, jurisdictionRecord, feeSchedule, approvalProvenance });
 *
 * @param {object} args - { permitPackage, stamp, jurisdictionRecord, feeSchedule, approvalProvenance }
 * @returns {{submissionId: string, submissionRecordPath: string, applications: array, approvalProvenance: object, evidence: string[]}}
 */
export const permitSubmissionExecutionTask = defineTask('d2c.permit-submission-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Submit permit package to the AHJ (guarded executor)',
  agent: {
    name: 'permit-submission-executor',
    prompt: {
      role: 'Permitting coordinator',
      task: 'Transmit the stamped permit package to the authority having jurisdiction and record the submission',
      context: {
        permitPackage: args.permitPackage,
        stamp: args.stamp,
        jurisdictionRecord: args.jurisdictionRecord,
        feeSchedule: args.feeSchedule,
        approvalProvenance: args.approvalProvenance,
      },
      instructions: [
        'REFUSE and FAIL if approvalProvenance is absent, or if it does not carry breakpointId "design-to-construction.permit-submission" with autoApproved:false and a respondedBy.',
        'REFUSE and FAIL if the stamp record in context is null or its sealedManifest does not cover every sheet in the permit package — submitting unsealed documents is a statutory violation.',
        `Record the submission at ${ARTIFACT_ROOT}/permit/submission-record.json: agency, application ids, transmittal manifest, fee record, submission timestamp, and the receiving reference returned by the agency.`,
        'Evidence cites the submission record and the approval provenance.',
      ],
      outputFormat: 'JSON with submissionId string, submissionRecordPath string, applications array, approvalProvenance object, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['submissionId', 'submissionRecordPath', 'applications', 'approvalProvenance', 'evidence'],
      properties: {
        submissionId: { type: 'string' },
        submissionRecordPath: { type: 'string' },
        applications: { type: 'array', minItems: 1 },
        approvalProvenance: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'd2c', 'statutory', 'guarded-executor'],
}));

/**
 * d2c.fabrication-release — GUARDED EXECUTOR. Scheduled ONLY inside
 * `if (submittalDecision.approved === true)` in the per-submittal map body.
 *
 * Usage:
 *   const release = await ctx.task(fabricationReleaseTask, { submittal, reviewComments, approvalStatus, stamp, approvalProvenance });
 *
 * @param {object} args - { submittal, reviewComments, approvalStatus, stamp, approvalProvenance }
 * @returns {{submittalId: string, releaseRecordPath: string, releasedScope: object, approvalProvenance: object, evidence: string[]}}
 */
export const fabricationReleaseTask = defineTask('d2c.fabrication-release', (args, taskCtx) => ({
  kind: 'agent',
  title: `Release shop drawing for fabrication (guarded executor): ${args.submittalId}`,
  agent: {
    name: 'fabrication-release-executor',
    prompt: {
      role: 'Construction administration engineer',
      task: 'Release ONE approved shop drawing for fabrication and record the release',
      context: {
        submittal: args.submittal,
        reviewComments: args.reviewComments,
        approvalStatus: args.approvalStatus,
        stamp: args.stamp,
        approvalProvenance: args.approvalProvenance,
      },
      instructions: [
        'REFUSE and FAIL if approvalProvenance is absent, or if it does not carry breakpointId "design-to-construction.shop-drawing-approval" with a respondedBy and a submittalId matching the submittal in context.',
        'REFUSE and FAIL if the review approvalStatus is "rejected" or "revise-and-resubmit" — only an approved or approved-as-noted submittal may be released.',
        `Record the release at ${ARTIFACT_ROOT}/shop-drawings/${args.submittalId}/release-record.json with the reviewed revision id, the comment disposition, and the fabrication authorization scope.`,
        'Evidence cites the release record and the approval provenance.',
      ],
      outputFormat: 'JSON with submittalId string, releaseRecordPath string, releasedScope object, approvalProvenance object, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['submittalId', 'releaseRecordPath', 'releasedScope', 'approvalProvenance', 'evidence'],
      properties: {
        submittalId: { type: 'string' },
        releaseRecordPath: { type: 'string' },
        releasedScope: { type: 'object' },
        approvalProvenance: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'd2c', 'statutory', 'guarded-executor'],
}));

/**
 * d2c.hold-point-inspection — EXECUTE the inspection checklist for ONE
 * construction hold point and capture the measured results to disk.
 *
 * Usage:
 *   const inspection = await ctx.task(holdPointInspectionTask, { holdPoint, inspectionChecklist, testingProtocol, acceptanceCriteria, stamp, attempt });
 *
 * @param {object} args - { holdPoint, inspectionChecklist, testingProtocol, acceptanceCriteria, stamp, attempt }
 * @returns {{holdPointId: string, inspectionPath: string, checklistResults: array, testReports: array, nonConformances: array, conforming: boolean, evidence: string[]}}
 */
export const holdPointInspectionTask = defineTask('d2c.hold-point-inspection', (args, taskCtx) => ({
  kind: 'agent',
  title: `EXECUTE hold-point inspection: ${args.holdPointId} (attempt ${args.attempt})`,
  agent: {
    name: 'field-inspector',
    prompt: {
      role: 'Construction quality inspector',
      task: 'EXECUTE the inspection checklist for ONE construction hold point and capture the results',
      context: {
        holdPoint: args.holdPoint,
        inspectionChecklist: args.inspectionChecklist,
        testingProtocol: args.testingProtocol,
        acceptanceCriteria: args.acceptanceCriteria,
        stamp: args.stamp,
        attempt: args.attempt,
      },
      instructions: [
        'EXECUTE, do not narrate: walk every checklist line for this hold point, record the measured value against the acceptance criterion, and attach the material test reports the protocol requires.',
        `CAPTURE to ${ARTIFACT_ROOT}/hold-points/${args.holdPointId}/inspection.json as {holdPointId, checklistResults:[{lineId, criterion, measured, conforming}], testReports:[{testId, path, result}], nonConformances:[...], conforming}.`,
        'conforming is true ONLY when every checklist line conforms and every required test report is present and passing. A missing test report is a non-conformance, not a pass.',
        'Every non-conformance must name the violated register reqId or specification section — an unattributed non-conformance cannot be dispositioned.',
        'Never report conforming:true on the strength of a scheduled-but-unperformed test.',
      ],
      outputFormat: 'JSON with holdPointId string, inspectionPath string, checklistResults array, testReports array, nonConformances array, conforming boolean, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['holdPointId', 'inspectionPath', 'checklistResults', 'testReports', 'nonConformances', 'conforming', 'evidence'],
      properties: {
        holdPointId: { type: 'string' },
        inspectionPath: { type: 'string' },
        checklistResults: { type: 'array', minItems: 1 },
        testReports: { type: 'array' },
        nonConformances: { type: 'array' },
        conforming: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'd2c', 'construction-qc', 'executed-inspection'],
}));

/**
 * d2c.hold-point-release-execution — GUARDED EXECUTOR. Scheduled ONLY inside
 * `if (releaseDecision.approved === true)` in the per-hold-point loop.
 *
 * Usage:
 *   const release = await ctx.task(holdPointReleaseExecutionTask, { holdPoint, inspection, nonConformanceDispositions, approvalProvenance });
 *
 * @param {object} args - { holdPoint, inspection, nonConformanceDispositions, approvalProvenance }
 * @returns {{holdPointId: string, releaseRecordPath: string, releasedScope: object, approvalProvenance: object, evidence: string[]}}
 */
export const holdPointReleaseExecutionTask = defineTask('d2c.hold-point-release-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Release construction hold point (guarded executor): ${args.holdPointId}`,
  agent: {
    name: 'hold-point-release-executor',
    prompt: {
      role: 'Construction quality manager executor',
      task: 'Record the release of ONE construction hold point, authorizing the work to be covered',
      context: {
        holdPoint: args.holdPoint,
        inspection: args.inspection,
        nonConformanceDispositions: args.nonConformanceDispositions,
        approvalProvenance: args.approvalProvenance,
      },
      instructions: [
        'REFUSE and FAIL if approvalProvenance is absent, or if it does not carry breakpointId "design-to-construction.hold-point-release" with autoApproved:false, a respondedBy, and a holdPointId matching the hold point in context.',
        'REFUSE and FAIL if the inspection in context is not conforming:true and any open non-conformance lacks a recorded disposition — releasing an open non-conformance permanently conceals defective work.',
        `Record the release at ${ARTIFACT_ROOT}/hold-points/${args.holdPointId}/release-record.json with the inspection path, the disposition of every non-conformance, the released work scope, and the release timestamp.`,
        'Evidence cites the release record, the executed inspection artifact, and the approval provenance.',
      ],
      outputFormat: 'JSON with holdPointId string, releaseRecordPath string, releasedScope object, approvalProvenance object, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['holdPointId', 'releaseRecordPath', 'releasedScope', 'approvalProvenance', 'evidence'],
      properties: {
        holdPointId: { type: 'string' },
        releaseRecordPath: { type: 'string' },
        releasedScope: { type: 'object' },
        approvalProvenance: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'd2c', 'statutory', 'guarded-executor'],
}));

/**
 * d2c.rfi-triage — classify ONE construction RFI as a clarification (already
 * answered by the stamped design) or a deviation (departs from it).
 *
 * Usage:
 *   const triage = await ctx.task(rfiTriageTask, { rfi, stamp, designRecordIndexPath, requirements, specifications });
 *
 * @param {object} args - { rfi, stamp, designRecordIndexPath, requirements, specifications }
 * @returns {{rfiId: string, classification: string, citedDocuments: array, affectedRequirementIds: array, affectedElementIds: array, evidence: string[]}}
 */
export const rfiTriageTask = defineTask('d2c.rfi-triage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Triage construction RFI: ${args.rfiId}`,
  agent: {
    name: 'construction-administration-engineer',
    prompt: {
      role: 'Construction administration engineer',
      task: 'Triage ONE construction RFI into a clarification or a design deviation',
      context: {
        rfi: args.rfi,
        stamp: args.stamp,
        designRecordIndexPath: args.designRecordIndexPath,
        requirements: args.requirements,
        specifications: args.specifications,
      },
      instructions: [
        'Classify the RFI as classification: clarification (the stamped design already answers it) or deviation (the field condition or proposed substitution departs from the stamped design).',
        'A clarification MUST cite the stamped drawing sheet, detail, or specification section that answers it — an uncited clarification is a deviation by default.',
        'For a deviation, list the affected register reqIds and the affected structural elementIds so the assessment can recompute exactly those checks.',
        'Never downgrade a deviation to a clarification to avoid the approval breakpoint.',
      ],
      outputFormat: 'JSON with rfiId string, classification string, citedDocuments array, affectedRequirementIds array, affectedElementIds array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['rfiId', 'classification', 'citedDocuments', 'affectedRequirementIds', 'affectedElementIds', 'evidence'],
      properties: {
        rfiId: { type: 'string' },
        classification: { type: 'string', enum: ['clarification', 'deviation'] },
        citedDocuments: { type: 'array' },
        affectedRequirementIds: { type: 'array' },
        affectedElementIds: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'd2c', 'construction-administration'],
}));

/**
 * d2c.deviation-assessment — EXECUTED recomputation of the affected element
 * checks under a proposed field deviation. acceptable:false means the deviation
 * is rejected BEFORE any approver sees it.
 *
 * Usage:
 *   const assessment = await ctx.task(deviationAssessmentTask, { deviation, affectedElements, loadCombinations, requirements, elementChecks, stamp });
 *
 * @param {object} args - { deviation, affectedElements, loadCombinations, requirements, elementChecks, stamp }
 * @returns {{deviationId: string, assessmentPath: string, affectedElements: array, acceptable: boolean, codeClauses: array, evidence: string[]}}
 */
export const deviationAssessmentTask = defineTask('d2c.deviation-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `EXECUTED field-deviation assessment: ${args.deviationId}`,
  agent: {
    name: 'deviation-assessment-engineer',
    prompt: {
      role: 'Structural engineer assessing a field deviation',
      task: 'Recompute the affected checks for ONE proposed field deviation and report the safety impact',
      context: {
        deviation: args.deviation,
        affectedElements: args.affectedElements,
        loadCombinations: args.loadCombinations,
        requirements: args.requirements,
        elementChecks: args.elementChecks,
        stamp: args.stamp,
      },
      instructions: [
        'EXECUTE, do not narrate: re-run d2c.element-design-check-equivalent computations for every affected elementId under the deviated condition and compare against the stamped baseline ratio.',
        `CAPTURE to ${ARTIFACT_ROOT}/deviations/${args.deviationId}/assessment.json as {deviationId, affectedElements:[{elementId, baselineRatio, deviatedRatio, governingCombination}], affectedRequirementIds, codeClauses, acceptable, rationale}.`,
        'acceptable is true only when every affected element still satisfies its governing combination AND every affected register requirement still has a satisfied acceptance criterion.',
        'Report the safety impact in plain terms. A deviation that reduces margin without violating a criterion is still reported with the margin delta.',
        'Never mark acceptable:true on the strength of engineering judgement alone — the recomputed ratios are the evidence.',
      ],
      outputFormat: 'JSON with deviationId string, assessmentPath string, affectedElements array, acceptable boolean, codeClauses array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['deviationId', 'assessmentPath', 'affectedElements', 'acceptable', 'codeClauses', 'evidence'],
      properties: {
        deviationId: { type: 'string' },
        assessmentPath: { type: 'string' },
        affectedElements: { type: 'array' },
        acceptable: { type: 'boolean' },
        codeClauses: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'd2c', 'structural', 'executed-check'],
}));

/**
 * d2c.deviation-implementation — GUARDED EXECUTOR. Scheduled ONLY inside
 * `if (deviationDecision.approved === true)`.
 *
 * Usage:
 *   const revision = await ctx.task(deviationImplementationTask, { deviation, assessment, stamp, approvalProvenance });
 *
 * @param {object} args - { deviation, assessment, stamp, approvalProvenance }
 * @returns {{deviationId: string, revisionRecordPath: string, revisedDocuments: array, requiresRestamp: boolean, approvalProvenance: object, evidence: string[]}}
 */
export const deviationImplementationTask = defineTask('d2c.deviation-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement accepted design deviation (guarded executor): ${args.deviationId}`,
  agent: {
    name: 'deviation-implementation-engineer',
    prompt: {
      role: 'Engineer of record delegate implementing an accepted deviation',
      task: 'Issue the revised documents implementing ONE accepted field deviation',
      context: {
        deviation: args.deviation,
        assessment: args.assessment,
        stamp: args.stamp,
        approvalProvenance: args.approvalProvenance,
      },
      instructions: [
        'REFUSE and FAIL if approvalProvenance is absent, or if it does not carry breakpointId "design-to-construction.design-deviation-acceptance" with a respondedBy and a deviationId matching the deviation in context.',
        `Issue the revision record at ${ARTIFACT_ROOT}/deviations/${args.deviationId}/revision-record.json: revised sheets/details, the supplemental instruction or change-order reference, the affected reqIds, and the link to the recomputed assessment.`,
        'Flag in requiresRestamp whether the revision changes sealed content and therefore requires a re-stamp — never silently amend sealed documents.',
        'Evidence cites the revision record, the recomputed assessment, and the approval provenance.',
      ],
      outputFormat: 'JSON with deviationId string, revisionRecordPath string, revisedDocuments array, requiresRestamp boolean, approvalProvenance object, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['deviationId', 'revisionRecordPath', 'revisedDocuments', 'requiresRestamp', 'approvalProvenance', 'evidence'],
      properties: {
        deviationId: { type: 'string' },
        revisionRecordPath: { type: 'string' },
        revisedDocuments: { type: 'array', minItems: 1 },
        requiresRestamp: { type: 'boolean' },
        approvalProvenance: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'd2c', 'statutory', 'guarded-executor'],
}));

/**
 * d2c.as-built-reconciliation — reconcile the constructed work against the
 * stamped design and enumerate every delta. A delta with no approval breakpoint
 * event id is an UNAPPROVED departure and blocks handover.
 *
 * Usage:
 *   const asBuilt = await ctx.task(asBuiltReconciliationTask, { stamp, deviations, holdPoints, shopDrawings, requirements, traceabilityMatrices });
 *
 * @param {object} args - { stamp, deviations, holdPoints, shopDrawings, requirements, traceabilityMatrices }
 * @returns {{reconciliationPath: string, deltas: array, unapprovedDeltas: array, recordGaps: array, evidence: string[]}}
 */
export const asBuiltReconciliationTask = defineTask('d2c.as-built-reconciliation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reconcile as-built against the stamped design',
  agent: {
    name: 'as-built-engineer',
    prompt: {
      role: 'As-built records engineer',
      task: 'Reconcile the constructed work against the stamped design and enumerate every delta',
      context: {
        stamp: args.stamp,
        deviations: args.deviations,
        holdPoints: args.holdPoints,
        shopDrawings: args.shopDrawings,
        requirements: args.requirements,
        traceabilityMatrices: args.traceabilityMatrices,
      },
      instructions: [
        `Produce ${ARTIFACT_ROOT}/as-built/reconciliation.json enumerating every delta between the stamped design and the constructed work, each as {deltaId, reqIds, elementIds, source: deviation|shop-drawing|field-condition, approvalBreakpointEventId|null}.`,
        'A delta with approvalBreakpointEventId null is an UNAPPROVED as-built departure — list it in unapprovedDeltas; do not normalize it into the record.',
        'Cross-check that every released hold point has a recorded conforming inspection and that every released shop drawing has a fabrication release record; list gaps in recordGaps.',
        'Evidence cites the reconciliation file and the specific records checked.',
      ],
      outputFormat: 'JSON with reconciliationPath string, deltas array, unapprovedDeltas array, recordGaps array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['reconciliationPath', 'deltas', 'unapprovedDeltas', 'recordGaps', 'evidence'],
      properties: {
        reconciliationPath: { type: 'string' },
        deltas: { type: 'array' },
        unapprovedDeltas: { type: 'array' },
        recordGaps: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'd2c', 'handover'],
}));

/**
 * d2c.handover-package — assemble the owner handover / O&M dossier index from
 * executed records.
 *
 * Usage:
 *   const handover = await ctx.task(handoverPackageTask, { asBuilt, stamp, permitSubmission, holdPoints, shopDrawings, specifications, qcDocumentation, statutoryApprovals });
 *
 * @param {object} args - { asBuilt, stamp, permitSubmission, holdPoints, shopDrawings, specifications, qcDocumentation, statutoryApprovals }
 * @returns {{dossierIndexPath: string, sections: array, openItems: array, evidence: string[]}}
 */
export const handoverPackageTask = defineTask('d2c.handover-package', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assemble handover / O&M dossier',
  agent: {
    name: 'handover-package-assembler',
    prompt: {
      role: 'Project closeout engineer',
      task: 'Assemble the owner handover dossier index from executed records',
      context: {
        asBuilt: args.asBuilt,
        stamp: args.stamp,
        permitSubmission: args.permitSubmission,
        holdPoints: args.holdPoints,
        shopDrawings: args.shopDrawings,
        specifications: args.specifications,
        qcDocumentation: args.qcDocumentation,
        statutoryApprovals: args.statutoryApprovals,
      },
      instructions: [
        `Assemble ${ARTIFACT_ROOT}/handover/dossier-index.json: as-built set, sealed design record, permit records and any certificate of occupancy reference, the full hold-point inspection and release log, approved shop drawings, O&M and warranty data, and the statutory approval provenance log.`,
        'Every dossier entry MUST be {section, artifactPath | breakpointEventId} — no prose entries.',
        'List in openItems every dossier section with a missing record; an incomplete handover is reported, never padded.',
      ],
      outputFormat: 'JSON with dossierIndexPath string, sections array, openItems array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['dossierIndexPath', 'sections', 'openItems', 'evidence'],
      properties: {
        dossierIndexPath: { type: 'string' },
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
  labels: ['agent', 'd2c', 'handover'],
}));

// ---------------------------------------------------------------------------
// requireStatutoryApproval — fail-closed guard for all five policy-gated actions
// ---------------------------------------------------------------------------

/**
 * Single fail-closed guard for the five policy-gated statutory actions. Direct
 * structural port of requirePhiApproval (composition-regulated-greenfield) and
 * requireSafetyWaiver (composition-aerospace-flight-control): validation-first,
 * per-instance provenance, never generalized, rejection throws.
 *
 * breakpointId === actionId EXACTLY, with no instance suffix — that is what
 * adapters/policy YAML matches on. Per-instance uniqueness is carried by the
 * instanceId tag, the routing label, and the per-instance breakpointEventId.
 *
 * These breakpoints NEVER auto-execute: autoApproveAfterN and
 * presentAlwaysApprove are never passed. A non-interactive auto-approval is
 * recorded as an explicit anomaly record BEFORE anything else; for the three
 * never-auto-approve actions (stamp, permit submission, hold-point release) it
 * then throws.
 *
 * Usage:
 *   const approval = await requireStatutoryApproval(ctx, {
 *     actionId: 'design-to-construction.hold-point-release',
 *     expert: 'construction-quality-manager',
 *     neverAutoApprove: true,
 *     instanceId: holdPointId,
 *     question: 'Release hold point HP-07?',
 *     payload: { holdPointId, inspectionPath },
 *     approvals: statutoryApprovals,
 *   });
 *
 * @param {object} ctx - The process context
 * @param {object} options
 * @param {string} options.actionId - REQUIRED one of the five declared policy-gated actionIds
 * @param {string} options.expert - REQUIRED expert route; must match the declared expert for the action
 * @param {string} options.question - REQUIRED reviewer question
 * @param {object} [options.payload={}] - Extra evidence payload surfaced to the approver
 * @param {string|null} [options.instanceId=null] - Per-instance id (holdPointId / submittalId / deviationId)
 * @param {boolean} [options.neverAutoApprove=false] - true for the three public-safety actions
 * @param {Array<object>} options.approvals - REQUIRED mutable statutory-approval provenance log
 * @returns {Promise<{breakpointEventId: string, breakpointId: string, actionId: string, instanceId: string|null, expert: string, question: string, approvedAt: string, respondedBy: string|null, autoApproved: boolean, anomaly: string|null}>}
 */
export async function requireStatutoryApproval(ctx, {
  actionId,
  expert,
  question,
  payload = {},
  instanceId = null,
  neverAutoApprove = false,
  approvals,
} = {}) {
  // Validate-first, no fallbacks.
  if (!actionId) {
    throw new Error(`requireStatutoryApproval: actionId is required (got ${JSON.stringify(actionId)})`);
  }
  const spec = POLICY_GATED_ACTIONS[actionId];
  if (!spec) {
    throw new Error(`requireStatutoryApproval: "${actionId}" is not one of the five declared policy-gated actions (${Object.keys(POLICY_GATED_ACTIONS).join(', ')}) — an undeclared statutory action must not be raisable`);
  }
  if (!expert) {
    throw new Error(`requireStatutoryApproval(${actionId}): expert is required (got ${JSON.stringify(expert)})`);
  }
  if (expert !== spec.expert) {
    throw new Error(`requireStatutoryApproval(${actionId}): expert must be "${spec.expert}" as declared (got ${JSON.stringify(expert)})`);
  }
  if (!question) {
    throw new Error(`requireStatutoryApproval(${actionId}): question is required (got ${JSON.stringify(question)})`);
  }
  if (!Array.isArray(approvals)) {
    throw new Error(`requireStatutoryApproval(${actionId}): approvals provenance log (array) is required (got ${JSON.stringify(approvals)})`);
  }
  if (neverAutoApprove && !NEVER_AUTO_APPROVE_ACTIONS.includes(actionId)) {
    throw new Error(`requireStatutoryApproval(${actionId}): neverAutoApprove is declared only for ${JSON.stringify(NEVER_AUTO_APPROVE_ACTIONS)}`);
  }

  const label = instanceId ? `${actionId}: ${instanceId}` : actionId;

  const decision = await routedBreakpoint(ctx, {
    question,
    actionId,
    instanceId,
    ...payload,
  }, {
    breakpointId: actionId,
    expert,
    tags: [...spec.tags, ...(instanceId ? [instanceId] : [])],
    strategy: 'single',
    label,
    // NEVER auto-executes: no autoApproveAfterN, no presentAlwaysApprove.
  });

  const approvedAt = new Date().toISOString();
  const autoApproved = decision.autoApproved === true;
  const approved = decision.approved === true;

  // The record is written FIRST — before any throw — so a non-interactive
  // auto-approval or a rejection is always visible in
  // metadata.statutoryApprovals / metadata.autoApprovalAnomalies even when this
  // guard then stops the run.
  const record = {
    breakpointEventId: `${actionId}@${approvedAt}#${approvals.length}`,
    breakpointId: actionId,
    actionId,
    instanceId,
    expert,
    question,
    approvedAt,
    respondedBy: decision.respondedBy ?? null,
    autoApproved,
    approved,
    anomaly: autoApproved ? 'non-interactive-auto-approval' : (approved ? null : 'rejected'),
  };
  approvals.push(record);

  // A non-interactive auto-approval on a public-safety action is recorded and
  // then stops the run. For the other two the anomaly record stands and the run
  // continues with the anomaly surfaced in the returned metadata.
  if (autoApproved && neverAutoApprove) {
    throw new Error(`Statutory action ${actionId}${instanceId ? ` (${instanceId})` : ''} was AUTO-APPROVED non-interactively. This is a public-safety action that never auto-approves; the anomaly has been recorded and the run stops here.`);
  }

  if (!approved) {
    const notes = decision.response ?? decision.feedback ?? 'no reviewer notes';
    throw new Error(`Statutory action ${actionId}${instanceId ? ` (${instanceId})` : ''} REJECTED by ${expert}: ${notes}. There is no reduced-scope path — the run stops here.`);
  }

  return record;
}

// ---------------------------------------------------------------------------
// certifiedStageExit — executed trace-diff -> adversarial gate -> routed sign-off
// ---------------------------------------------------------------------------

/**
 * Stage-boundary contract, applied at every phase exit (port of
 * certifiedStageExit / regulatedStageExit):
 *   1. EXECUTED traceability — d2c.trace-diff computes the requirement/code-clause
 *      -> drawing/calculation set-diff and writes artifacts/d2c/<stage>/trace-diff.json.
 *   2. adversarialGate d2c.<stage>.traceability over that computed diff with
 *      traceability-critic + code-clause-critic; a failed gate throws.
 *   3. Structural malformed-check on the gate result, so a sign-off without
 *      executed evidence is impossible to construct.
 *   4. routedBreakpoint sign-off with breakpointId d2c.stage-exit.<stage>. These
 *      are PROCESS sign-offs, not policy-gated actions — they keep the
 *      d2c.stage-exit.* namespace and never collide with the five actionIds.
 *   5. approved !== true throws (stages are sequential, no skip-ahead).
 *
 * @param {object} ctx - The process context
 * @param {string} stage - REQUIRED stage id
 * @param {object} options
 * @param {string[]} [options.artifacts=[]] - Stage artifact paths surfaced to the reviewer
 * @param {object} options.requirements - REQUIRED register requirement set the diff is computed against
 * @param {object|null} [options.previousMatrix=null] - Previous stage's stored diff (null only for the first stage exit)
 * @param {Array<object>} [options.deviations=[]] - Recorded deviation log for the code-clause critic
 * @param {string} [options.expert='structural-engineer-of-record-delegate'] - Sign-off route
 * @param {number} [options.maxFixAttempts=2] - Adversarial-gate fix budget
 * @returns {Promise<{stage: string, traceDiff: object, gateResult: object, signoff: object}>}
 */
export async function certifiedStageExit(ctx, stage, {
  artifacts = [],
  requirements,
  previousMatrix = null,
  deviations = [],
  expert = 'structural-engineer-of-record-delegate',
  maxFixAttempts = 2,
} = {}) {
  if (!stage) {
    throw new Error(`certifiedStageExit: stage is required (got ${JSON.stringify(stage)})`);
  }
  if (!requirements) {
    throw new Error(`certifiedStageExit(${stage}): requirements is required — the trace diff is computed against the register requirement set`);
  }

  // (1) EXECUTED traceability diff.
  const traceDiff = await ctx.task(traceDiffTask, {
    stage,
    requirements,
    artifacts,
    previousMatrix,
    deviations,
  });

  // (2) Adversarial gate over the EXECUTED artifact (imported combinator).
  const gateResult = await adversarialGate(ctx, {
    gateId: `d2c.${stage}.traceability`,
    artifact: {
      path: `${ARTIFACT_ROOT}/${stage}/trace-diff.json`,
      description: 'Executed requirement/code-clause-to-drawing/calculation traceability diff',
    },
    critics: [
      {
        name: 'traceability-critic',
        role: 'Design traceability auditor',
        focus: 'every register requirement traces to a drawing or calculation artifact; uncovered and regressions must be zero or carry a cited design-deviation-acceptance event id',
      },
      {
        name: 'code-clause-critic',
        role: 'Code-clause provenance auditor',
        focus: 'every requirement\'s code clause names document + adopted edition + section, and every deviated requirement cites a recorded breakpoint event id from the deviations log',
      },
    ],
    ironLaw: [
      `Re-run the trace computation yourself or cite ${ARTIFACT_ROOT}/${stage}/trace-diff.json line by line; prose claims of coverage are not evidence.`,
      'Output verdict as JSON: {"passed": boolean, "issues": [{"severity": string, "description": string, "location": string}], "evidence": [string]}. This exact shape, nothing else.',
    ],
    maxFixAttempts,
    fixer: { task: fixDesignTask },
    context: { stage, traceDiff, deviations },
  });

  // Gate failure throws — escalation already happened inside the combinator; a
  // still-failed gate means the owner rejected too. No pass-anyway path.
  if (gateResult.passed !== true) {
    throw new Error(`Stage exit BLOCKED: adversarial gate d2c.${stage}.traceability failed after ${gateResult.attempts} attempt(s) (escalated: ${gateResult.escalated}). Issues: ${JSON.stringify(gateResult.issues)}`);
  }

  // (3) Structural malformed-check — a sign-off without executed evidence is
  // structurally impossible to construct.
  if (typeof gateResult.passed !== 'boolean' || typeof gateResult.attempts !== 'number' || !Array.isArray(gateResult.evidence)) {
    throw new Error(`certifiedStageExit(${stage}): executed gate result is malformed — sign-off without traceability evidence is structurally impossible`);
  }

  // (4) Routed sign-off, per-stage-unique breakpointId in the d2c.stage-exit.* namespace.
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
    breakpointId: `d2c.stage-exit.${stage}`,
    expert,
    tags: ['d2c', 'stage-exit', stage],
    strategy: 'single',
  });

  // (5) Rejected sign-off throws — no skip-ahead fallback.
  if (signoffDecision.approved !== true) {
    const notes = signoffDecision.response ?? signoffDecision.feedback ?? 'no reviewer notes';
    throw new Error(`Stage exit REJECTED by ${expert} for "${stage}": ${notes}`);
  }

  return { stage, traceDiff, gateResult, signoff: signoffDecision };
}

// ---------------------------------------------------------------------------
// process — the composition orchestrator
// ---------------------------------------------------------------------------

/**
 * Design-to-construction orchestrator. Phases are strictly sequential;
 * ctx.parallel is used only WITHIN a phase. Hold points are deliberately
 * sequential — construction sequence is physical, and parallel release would
 * authorize covering work out of order.
 *
 * @param {object} inputs - See @inputs
 * @param {object} ctx - Babysitter process context
 * @returns {Promise<object>} See @outputs
 */
export async function process(inputs, ctx) {
  const {
    projectId,
    projectBrief,
    siteLocation,
    projectType,
    occupancyCategory = null,
    jurisdiction,
    applicableCodes = DEFAULT_CODES,
    structureLoadsHint = null,
    disciplineScopeHint = [],
    shopDrawingSubmittals = [],
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
    maxFixAttempts = 2,
    maxCheckAttempts = 2,
  } = inputs ?? {};

  // No fallbacks: these are caller bugs, not defaultable inputs.
  if (!projectId) {
    throw new Error(`${PROCESS_NAME}: projectId is required (got ${JSON.stringify(projectId)})`);
  }
  if (!projectBrief || (typeof projectBrief === 'string' && projectBrief.trim().length === 0)) {
    throw new Error(`${PROCESS_NAME}: projectBrief is required and must be non-empty (got ${JSON.stringify(projectBrief)})`);
  }
  if (!siteLocation) {
    throw new Error(`${PROCESS_NAME}: siteLocation is required (got ${JSON.stringify(siteLocation)})`);
  }
  if (!projectType) {
    throw new Error(`${PROCESS_NAME}: projectType is required — building | bridge | site-civil (got ${JSON.stringify(projectType)})`);
  }
  if (!jurisdiction) {
    throw new Error(`${PROCESS_NAME}: jurisdiction is required — the AHJ governs the adopted code editions (got ${JSON.stringify(jurisdiction)})`);
  }

  const statutoryApprovals = [];   // statutory approval provenance log
  const signoffs = {};             // stage-exit sign-off results
  const traceabilityMatrices = {}; // per-stage computed trace diffs
  const gateAttempts = {};         // per-gate attempt counts
  const gates = {};                // named gate results
  const deviations = [];           // accepted field-deviation records
  const restampRequired = [];      // deviations whose revision touches sealed content
  let escalations = 0;

  const recordStageExit = (exit) => {
    traceabilityMatrices[exit.stage] = exit.traceDiff;
    signoffs[exit.stage] = exit.signoff;
    gateAttempts[`d2c.${exit.stage}.traceability`] = exit.gateResult.attempts;
    if (exit.gateResult.escalated === true) {
      escalations += 1;
    }
  };

  const recordGate = (gateId, gateResult) => {
    gates[gateId] = gateResult;
    gateAttempts[gateId] = gateResult.attempts;
    if (gateResult.escalated === true) {
      escalations += 1;
    }
  };

  // -------------------------------------------------------------------------
  // Phase 0 — kip recall
  // -------------------------------------------------------------------------
  const recall = await kipRecall(ctx, {
    kipDir,
    topic: 'civil design-to-construction precedents: code-clause traceability, peer-review findings, hold-point non-conformance patterns, permit review comments',
    kipModel,
    kind: KIP_KIND,
  });
  // kipRecallTask DECLARES insights as REQUIRED — `?? []` would paper over a
  // recall that silently returned nothing.
  if (!Array.isArray(recall.insights)) {
    throw new Error(`${PROCESS_NAME}: kip recall returned no insights array (got ${JSON.stringify(recall.insights)}) — kipRecallTask declares insights as required`);
  }
  const kipInsights = recall.insights;

  // -------------------------------------------------------------------------
  // Phase 1 — Project brief + siting constraints + site investigation
  // -------------------------------------------------------------------------
  const briefRecord = await ctx.task(projectBriefTask, {
    projectId,
    projectBrief,
    siteLocation,
    projectType,
    occupancyCategory,
    jurisdiction,
    applicableCodes,
    kipInsights,
  });

  const requirementRegister = await ctx.task(codeRequirementRegisterTask, {
    projectProfile: briefRecord.projectProfile,
    sitingConstraints: briefRecord.sitingConstraints,
    adoptedCodeEditions: briefRecord.adoptedCodeEditions,
    jurisdictionRecord: briefRecord.jurisdictionRecord,
    disciplineScopeHint,
    kipInsights,
  });
  if (!Array.isArray(requirementRegister.requirements) || requirementRegister.requirements.length === 0) {
    throw new Error(`${PROCESS_NAME}: d2c.code-requirement-register produced no requirements — a register with no requirements makes every downstream trace diff vacuous`);
  }
  const requirements = requirementRegister.requirements;

  // Geotechnical site investigation composed BY NAME, sequential.
  const siteAssessment = await ctx.task(siteAssessmentTask, {
    projectProfile: briefRecord.projectProfile,
    siteLocation,
    sitingConstraints: briefRecord.sitingConstraints,
    projectType,
  });
  const boringProgram = await ctx.task(boringProgramTask, { siteAssessment, projectType, projectProfile: briefRecord.projectProfile });
  const fieldInvestigation = await ctx.task(fieldInvestigationTask, { boringProgram, siteAssessment });
  const labTesting = await ctx.task(labTestingTask, { fieldInvestigation, boringProgram });
  const subsurfaceCharacterization = await ctx.task(subsurfaceCharacterizationTask, { fieldInvestigation, labTesting });
  const foundationRecommendations = await ctx.task(foundationRecommendationsTask, {
    subsurfaceCharacterization,
    projectProfile: briefRecord.projectProfile,
    requirements,
  });
  const constructionConsiderations = await ctx.task(constructionConsiderationsTask, {
    subsurfaceCharacterization,
    foundationRecommendations,
    sitingConstraints: briefRecord.sitingConstraints,
  });
  const geotechnicalReport = await ctx.task(geotechReportTask, {
    siteAssessment,
    boringProgram,
    fieldInvestigation,
    labTesting,
    subsurfaceCharacterization,
    foundationRecommendations,
    constructionConsiderations,
  });

  // Two independent follow-on site studies, in parallel.
  const [slopeStabilityReport, stormwaterHydrology] = await ctx.parallel.all([
    async () => {
      const geometry = await ctx.task(geometryDefinitionTask, { siteLocation, siteAssessment, sitingConstraints: briefRecord.sitingConstraints });
      const soils = await ctx.task(soilCharacterizationTask, { geometry, subsurfaceCharacterization, labTesting });
      const staticStability = await ctx.task(staticStabilityTask, { geometry, soils });
      const seismicStability = await ctx.task(seismicStabilityTask, { geometry, soils, staticStability, siteLocation });
      const groundwater = await ctx.task(groundwaterSensitivityTask, { geometry, soils, staticStability });
      const remediation = await ctx.task(remediationDesignTask, { staticStability, seismicStability, groundwater });
      const monitoring = await ctx.task(monitoringPlanTask, { remediation, geometry });
      return ctx.task(stabilityReportTask, {
        geometry,
        soils,
        staticStability,
        seismicStability,
        groundwater,
        remediation,
        monitoring,
      });
    },
    async () => {
      const hydrology = await ctx.task(hydrologicAnalysisTask, { siteLocation, siteAssessment, sitingConstraints: briefRecord.sitingConstraints, requirements });
      const prePost = await ctx.task(prePostComparisonTask, { hydrology, siteAssessment });
      return { hydrology, prePost };
    },
  ]);

  const siteInvestigationExit = await certifiedStageExit(ctx, 'site-investigation', {
    requirements,
    artifacts: [geotechnicalReport, slopeStabilityReport, stormwaterHydrology],
    previousMatrix: null,
    deviations,
    expert: 'geotechnical-engineer-of-record',
    maxFixAttempts,
  });
  recordStageExit(siteInvestigationExit);

  // -------------------------------------------------------------------------
  // Phase 2 — Concept design + load and seismic analysis
  // -------------------------------------------------------------------------
  const concept = await ctx.task(conceptDesignTask, {
    projectProfile: briefRecord.projectProfile,
    sitingConstraints: briefRecord.sitingConstraints,
    requirements,
    geotechnicalReport,
    slopeStabilityReport,
    kipInsights,
  });
  if (!Array.isArray(concept.structuralElements) || concept.structuralElements.length === 0) {
    throw new Error(`${PROCESS_NAME}: d2c.concept-design produced an empty structural element inventory — there is nothing to check, design, or stamp`);
  }
  if (!Array.isArray(concept.disciplinesInScope) || concept.disciplinesInScope.length === 0) {
    throw new Error(`${PROCESS_NAME}: d2c.concept-design declared no disciplines in scope (got ${JSON.stringify(concept.disciplinesInScope)})`);
  }

  const loadProjectSetup = await ctx.task(projectSetupTask, {
    projectProfile: briefRecord.projectProfile,
    conceptDesign: concept.conceptDesign,
    structuralSystem: concept.structuralSystem,
    structureLoadsHint,
    requirements,
    siteLocation,
  });

  const [deadLoads, liveLoads, windLoads, seismicLoads, snowRainLoads] = await ctx.parallel.all([
    () => ctx.task(deadLoadAnalysisTask, { projectSetup: loadProjectSetup, structuralSystem: concept.structuralSystem, requirements }),
    () => ctx.task(liveLoadAnalysisTask, { projectSetup: loadProjectSetup, occupancyCategory, requirements }),
    () => ctx.task(windLoadAnalysisTask, { projectSetup: loadProjectSetup, siteLocation, requirements }),
    () => ctx.task(seismicLoadAnalysisTask, { projectSetup: loadProjectSetup, siteLocation, subsurfaceCharacterization, requirements }),
    () => ctx.task(snowRainLoadAnalysisTask, { projectSetup: loadProjectSetup, siteLocation, requirements }),
  ]);

  const loadCombinations = await ctx.task(loadCombinationsTask, {
    projectSetup: loadProjectSetup,
    deadLoads,
    liveLoads,
    windLoads,
    seismicLoads,
    snowRainLoads,
    adoptedCodeEditions: briefRecord.adoptedCodeEditions,
  });
  const loadPaths = await ctx.task(loadPathAnalysisTask, { loadCombinations, structuralSystem: concept.structuralSystem });
  const loadReport = await ctx.task(loadReportTask, {
    projectSetup: loadProjectSetup,
    deadLoads,
    liveLoads,
    windLoads,
    seismicLoads,
    snowRainLoads,
    loadCombinations,
    loadPaths,
  });

  const seismicHazard = await ctx.task(seismicHazardTask, { siteLocation, subsurfaceCharacterization, adoptedCodeEditions: briefRecord.adoptedCodeEditions });
  const sdc = await ctx.task(sdcDeterminationTask, { seismicHazard, occupancyCategory, projectProfile: briefRecord.projectProfile });
  const seismicSystem = await ctx.task(systemSelectionTask, { sdc, structuralSystem: concept.structuralSystem, requirements });
  const seismicForces = await ctx.task(seismicForceAnalysisTask, { sdc, seismicSystem, loadCombinations });
  const responseSpectrum = await ctx.task(responseSpectrumTask, { seismicHazard, sdc, seismicSystem });
  const drift = await ctx.task(driftAnalysisTask, { seismicForces, responseSpectrum, structuralSystem: concept.structuralSystem });
  const seismicDetailing = await ctx.task(seismicDetailingTask, { sdc, seismicSystem, drift, requirements });
  const nonStructural = await ctx.task(nonStructuralTask, { sdc, seismicForces, requirements });
  const seismicReport = await ctx.task(seismicReportTask, {
    seismicHazard,
    sdc,
    seismicSystem,
    seismicForces,
    responseSpectrum,
    drift,
    seismicDetailing,
    nonStructural,
  });

  const analysis = { loadReport, loadCombinations, loadPaths, seismicReport, drift };

  const conceptExit = await certifiedStageExit(ctx, 'concept-and-analysis', {
    requirements,
    artifacts: [concept.conceptDesign, loadReport, seismicReport],
    previousMatrix: traceabilityMatrices['site-investigation'],
    deviations,
    expert: 'structural-engineer-of-record',
    maxFixAttempts,
  });
  recordStageExit(conceptExit);

  // -------------------------------------------------------------------------
  // Phase 3 — Parallel discipline design + per-element EXECUTED checks
  // -------------------------------------------------------------------------
  const disciplinesInScope = concept.disciplinesInScope;
  const disciplineCoverage = Array.isArray(requirementRegister.disciplineCoverage) ? requirementRegister.disciplineCoverage : [];

  // The register governs scope — silently narrowing it is a fallback.
  for (const covered of disciplineCoverage) {
    if (!disciplinesInScope.includes(covered)) {
      throw new Error(`${PROCESS_NAME}: register disciplineCoverage includes "${covered}" but d2c.concept-design left it out of disciplinesInScope (${JSON.stringify(disciplinesInScope)}) — the register governs scope`);
    }
  }
  for (const discipline of disciplinesInScope) {
    if (!DISCIPLINES.includes(discipline)) {
      throw new Error(`${PROCESS_NAME}: unknown discipline "${discipline}" in disciplinesInScope — supported disciplines are ${JSON.stringify(DISCIPLINES)}`);
    }
  }

  const disciplineBranches = {
    structural: async () => {
      const concreteCriteria = await ctx.task(designCriteriaTask, {
        requirements,
        loadCombinations,
        structuralSystem: concept.structuralSystem,
        adoptedCodeEditions: briefRecord.adoptedCodeEditions,
      });
      const [concreteBeams, concreteColumns, concreteSlabs, shearWalls] = await ctx.parallel.all([
        () => ctx.task(beamDesignTask, { designCriteria: concreteCriteria, loadCombinations, structuralElements: concept.structuralElements }),
        () => ctx.task(columnDesignTask, { designCriteria: concreteCriteria, loadCombinations, structuralElements: concept.structuralElements }),
        () => ctx.task(slabDesignTask, { designCriteria: concreteCriteria, loadCombinations, structuralElements: concept.structuralElements }),
        () => ctx.task(shearWallDesignTask, { designCriteria: concreteCriteria, loadCombinations, seismicDetailing, structuralElements: concept.structuralElements }),
      ]);
      const concreteFoundations = await ctx.task(foundationDesignTask, {
        designCriteria: concreteCriteria,
        foundationRecommendations,
        loadCombinations,
      });
      const concreteDetailing = await ctx.task(detailingTask, {
        beams: concreteBeams,
        columns: concreteColumns,
        slabs: concreteSlabs,
        shearWalls,
        seismicDetailing,
      });
      const reinforcementSchedules = await ctx.task(reinforcementSchedulesTask, { detailing: concreteDetailing });
      const structuralDrawings = await ctx.task(structuralDrawingsTask, {
        detailing: concreteDetailing,
        reinforcementSchedules,
        foundations: concreteFoundations,
      });

      const steelCriteria = await ctx.task(steelDesignCriteriaTask, {
        requirements,
        loadCombinations,
        structuralSystem: concept.structuralSystem,
        adoptedCodeEditions: briefRecord.adoptedCodeEditions,
      });
      const [steelBeams, steelColumns, bracing, momentFrames] = await ctx.parallel.all([
        () => ctx.task(steelBeamDesignTask, { steelDesignCriteria: steelCriteria, loadCombinations, structuralElements: concept.structuralElements }),
        () => ctx.task(steelColumnDesignTask, { steelDesignCriteria: steelCriteria, loadCombinations, structuralElements: concept.structuralElements }),
        () => ctx.task(bracingDesignTask, { steelDesignCriteria: steelCriteria, loadCombinations, seismicForces }),
        () => ctx.task(momentFrameDesignTask, { steelDesignCriteria: steelCriteria, loadCombinations, seismicDetailing }),
      ]);
      const steelConnections = await ctx.task(connectionDesignTask, {
        steelBeams,
        steelColumns,
        bracing,
        momentFrames,
        steelDesignCriteria: steelCriteria,
      });
      const steelDetails = await ctx.task(steelDetailingTask, { steelConnections, steelBeams, steelColumns });
      const materialTakeoff = await ctx.task(materialTakeoffTask, { steelDetails, steelBeams, steelColumns, bracing, momentFrames });

      const ingredientOutputs = {
        concrete: {
          designCriteria: concreteCriteria,
          beams: concreteBeams,
          columns: concreteColumns,
          slabs: concreteSlabs,
          shearWalls,
          foundations: concreteFoundations,
          detailing: concreteDetailing,
          reinforcementSchedules,
          structuralDrawings,
        },
        steel: {
          designCriteria: steelCriteria,
          beams: steelBeams,
          columns: steelColumns,
          bracing,
          momentFrames,
          connections: steelConnections,
          detailing: steelDetails,
          materialTakeoff,
        },
      };

      if (projectType === 'bridge') {
        const bridgeGeometry = await ctx.task(bridgeGeometryTask, { projectProfile: briefRecord.projectProfile, siteLocation, requirements });
        const bridgeLoads = await ctx.task(bridgeLoadAnalysisTask, { bridgeGeometry, loadCombinations, requirements });
        const superstructure = await ctx.task(superstructureDesignTask, { bridgeGeometry, bridgeLoads });
        const deck = await ctx.task(deckDesignTask, { superstructure, bridgeLoads });
        const substructure = await ctx.task(substructureDesignTask, { bridgeGeometry, bridgeLoads, superstructure });
        const bridgeFoundation = await ctx.task(bridgeFoundationTask, { substructure, foundationRecommendations, subsurfaceCharacterization });
        const bearings = await ctx.task(bearingDesignTask, { superstructure, substructure, bridgeLoads });
        const loadRating = await ctx.task(loadRatingTask, { superstructure, deck, substructure, bridgeLoads });
        ingredientOutputs.bridge = await ctx.task(bridgeReportTask, {
          bridgeGeometry,
          bridgeLoads,
          superstructure,
          deck,
          substructure,
          bridgeFoundation,
          bearings,
          loadRating,
        });
      }

      return ctx.task(disciplinePackageTask, {
        discipline: 'structural',
        ingredientOutputs,
        requirements,
        conceptDesign: concept.conceptDesign,
      });
    },

    geotechnical: async () => {
      const foundationSelection = await ctx.task(foundationSelectionTask, {
        foundationRecommendations,
        subsurfaceCharacterization,
        loadCombinations,
        requirements,
      });
      const bearing = await ctx.task(bearingCapacityTask, { foundationSelection, subsurfaceCharacterization });
      const settlement = await ctx.task(settlementAnalysisTask, { foundationSelection, bearing, loadCombinations });

      // foundation-design.js foundationSelectionTask DECLARES `selectedType`
      // (required: ['success','selectedType','artifacts']) — there is no
      // `foundationType` in its outputSchema. Reading the undeclared name made
      // every project take the shallow-footing branch, carrying a pile
      // foundation into the element checks, the peer review and the seal.
      // The selection is validated against the ingredient's own vocabulary
      // (foundation-design.js:80 branches shallow on 'shallow' | 'mat'); an
      // unrecognized selection STOPS the run — there is no default branch.
      const selectedFoundationType = foundationSelection.selectedType;
      if (!SHALLOW_FOUNDATION_TYPES.includes(selectedFoundationType) && !DEEP_FOUNDATION_TYPES.includes(selectedFoundationType)) {
        throw new Error(`${PROCESS_NAME}: foundation-selection returned selectedType ${JSON.stringify(selectedFoundationType)}, which is neither a shallow type (${JSON.stringify(SHALLOW_FOUNDATION_TYPES)}) nor a deep type (${JSON.stringify(DEEP_FOUNDATION_TYPES)}). A foundation branch chosen by default would carry the wrong foundation design into the engineer-of-record stamp.`);
      }
      const deep = DEEP_FOUNDATION_TYPES.includes(selectedFoundationType);
      let shallowFoundation = null;
      let deepFoundation = null;
      let pileCaps = null;
      if (deep) {
        deepFoundation = await ctx.task(deepFoundationTask, { foundationSelection, bearing, settlement, loadCombinations });
        pileCaps = await ctx.task(pileCapDesignTask, { deepFoundation, loadCombinations });
      } else {
        shallowFoundation = await ctx.task(shallowFoundationTask, { foundationSelection, bearing, settlement, loadCombinations });
      }
      const gradeBeams = await ctx.task(gradeBeamDesignTask, { foundationSelection, shallowFoundation, pileCaps, loadCombinations });
      const foundationPlans = await ctx.task(foundationPlansTask, { foundationSelection, shallowFoundation, deepFoundation, pileCaps, gradeBeams });
      const foundationSpecs = await ctx.task(foundationSpecsTask, { foundationPlans, foundationSelection, requirements });

      const wallGeometry = await ctx.task(wallGeometryTask, { sitingConstraints: briefRecord.sitingConstraints, siteAssessment, requirements });
      const earthPressure = await ctx.task(earthPressureTask, { wallGeometry, subsurfaceCharacterization, seismicForces });
      const externalStability = await ctx.task(externalStabilityTask, { wallGeometry, earthPressure, bearing });
      const wallStructural = await ctx.task(structuralDesignTask, { wallGeometry, earthPressure, loadCombinations });
      const wallGlobalStability = await ctx.task(globalStabilityTask, { wallGeometry, earthPressure, slopeStabilityReport });
      const wallDrainage = await ctx.task(drainageDesignTask, { wallGeometry, subsurfaceCharacterization });
      const wallDrawings = await ctx.task(wallDrawingsTask, { wallGeometry, wallStructural, wallDrainage });
      const wallSpecs = await ctx.task(wallSpecsTask, { wallDrawings, wallStructural, requirements });

      return ctx.task(disciplinePackageTask, {
        discipline: 'geotechnical',
        ingredientOutputs: {
          foundations: {
            foundationSelection,
            bearing,
            settlement,
            shallowFoundation,
            deepFoundation,
            pileCaps,
            gradeBeams,
            foundationPlans,
            foundationSpecs,
          },
          retainingWalls: {
            wallGeometry,
            earthPressure,
            externalStability,
            wallStructural,
            wallGlobalStability,
            wallDrainage,
            wallDrawings,
            wallSpecs,
          },
        },
        requirements,
        conceptDesign: concept.conceptDesign,
      });
    },

    mep: async () => {
      const mep = await ctx.task(mepSystemsDesignTask, {
        conceptDesign: concept.conceptDesign,
        structuralSystem: concept.structuralSystem,
        requirements,
        sitingConstraints: briefRecord.sitingConstraints,
        structuralElements: concept.structuralElements,
      });
      return ctx.task(disciplinePackageTask, {
        discipline: 'mep',
        ingredientOutputs: { mep },
        requirements,
        conceptDesign: concept.conceptDesign,
      });
    },

    drainage: async () => {
      const waterQuality = await ctx.task(waterQualityTask, { hydrology: stormwaterHydrology.hydrology, prePost: stormwaterHydrology.prePost, requirements });
      const lid = await ctx.task(lidDesignTask, { waterQuality, hydrology: stormwaterHydrology.hydrology, sitingConstraints: briefRecord.sitingConstraints });
      const detention = await ctx.task(detentionDesignTask, { lid, prePost: stormwaterHydrology.prePost, hydrology: stormwaterHydrology.hydrology });
      const conveyance = await ctx.task(conveyanceDesignTask, { detention, hydrology: stormwaterHydrology.hydrology, siteAssessment });
      const esc = await ctx.task(escDesignTask, { conveyance, siteAssessment, sitingConstraints: briefRecord.sitingConstraints });
      const drainagePlans = await ctx.task(drainagePlansTask, { lid, detention, conveyance, esc });
      const stormwaterReport = await ctx.task(stormwaterReportTask, {
        hydrology: stormwaterHydrology.hydrology,
        prePost: stormwaterHydrology.prePost,
        waterQuality,
        lid,
        detention,
        conveyance,
        esc,
        drainagePlans,
      });
      return ctx.task(disciplinePackageTask, {
        discipline: 'drainage',
        ingredientOutputs: { waterQuality, lid, detention, conveyance, esc, drainagePlans, stormwaterReport },
        requirements,
        conceptDesign: concept.conceptDesign,
      });
    },
  };

  const disciplinePackageList = await ctx.parallel.all(
    disciplinesInScope.map((discipline) => () => disciplineBranches[discipline]())
  );

  const disciplineDesigns = {};
  for (let i = 0; i < disciplinesInScope.length; i++) {
    disciplineDesigns[disciplinesInScope[i]] = disciplinePackageList[i];
  }

  // Per-element EXECUTED capacity checks with a bounded fix loop. A still-failing
  // element throws: there is no owner-accept path and no reduced-scope stamp.
  const elementChecks = await ctx.parallel.map(concept.structuralElements, async (element) => {
    const [elementId] = extractIds([element]);
    if (!elementId) {
      throw new Error(`${PROCESS_NAME}: structural element has no resolvable id (got ${JSON.stringify(element)})`);
    }
    let attempt = 0;
    let check = await ctx.task(elementDesignCheckTask, {
      element,
      elementId,
      loadCombinations,
      disciplineDesigns,
      requirements,
      attempt,
    });
    while (check.passed !== true && attempt < maxCheckAttempts) {
      attempt += 1;
      await ctx.task(fixDesignTask, {
        artifact: { path: check.checkPath, description: `Executed capacity check for element ${elementId}` },
        issues: [check],
        gateId: 'd2c.element-check',
        attempt,
        elementId,
        discipline: element.discipline,
        context: { elementId },
      });
      check = await ctx.task(elementDesignCheckTask, {
        element,
        elementId,
        loadCombinations,
        disciplineDesigns,
        requirements,
        attempt,
      });
    }
    if (check.passed !== true) {
      throw new Error(`${PROCESS_NAME}: structural element ${elementId} still fails its governing load combination (D/C ratio ${check.demandCapacityRatio}) after ${attempt} fix attempt(s). A failing element cannot be carried forward to a stamp — there is no reduced-scope stamp path.`);
    }
    return { ...check, attempts: attempt };
  });

  const disciplineDesignExit = await certifiedStageExit(ctx, 'discipline-design', {
    requirements,
    artifacts: [...disciplinePackageList, ...elementChecks],
    previousMatrix: traceabilityMatrices['concept-and-analysis'],
    deviations,
    expert: 'structural-engineer-of-record',
    maxFixAttempts,
  });
  recordStageExit(disciplineDesignExit);

  // -------------------------------------------------------------------------
  // Phase 4 — Specifications, BIM coordination, cost, schedule, permit package
  // -------------------------------------------------------------------------
  const [specifications, bimCoordination, costEstimate, schedule] = await ctx.parallel.all([
    async () => {
      const specScope = await ctx.task(specScopeDefinitionTask, { requirements, disciplineDesigns, conceptDesign: concept.conceptDesign });
      const generalRequirements = await ctx.task(generalRequirementsTask, { specScope, jurisdictionRecord: briefRecord.jurisdictionRecord });
      const technicalSpecs = await ctx.task(technicalSpecsTask, { specScope, disciplineDesigns, requirements });
      const materialSpecs = await ctx.task(materialSpecsTask, { technicalSpecs, disciplineDesigns });
      const executionProcedures = await ctx.task(executionProceduresTask, { technicalSpecs, materialSpecs });
      const qaSpecs = await ctx.task(qaSpecsTask, { technicalSpecs, executionProcedures, requirements });
      const references = await ctx.task(referenceCompilationTask, { technicalSpecs, adoptedCodeEditions: briefRecord.adoptedCodeEditions });
      return ctx.task(specsAssemblyTask, {
        specScope,
        generalRequirements,
        technicalSpecs,
        materialSpecs,
        executionProcedures,
        qaSpecs,
        references,
      });
    },
    async () => {
      const standards = await ctx.task(standardsVerificationTask, { disciplineDesigns, requirements });
      const aggregated = await ctx.task(modelAggregationTask, { standards, disciplineDesigns, disciplinesInScope });
      const clashes = await ctx.task(clashDetectionTask, { aggregated, disciplinesInScope });
      const clashAnalysis = await ctx.task(clashAnalysisTask, { clashes, disciplineDesigns });
      const clashResolution = await ctx.task(clashResolutionTask, { clashAnalysis, disciplineDesigns });
      const updateVerification = await ctx.task(updateVerificationTask, { clashResolution, aggregated });
      const coordinationDrawings = await ctx.task(coordinationDrawingsTask, { updateVerification, aggregated });
      return ctx.task(coordinationReportTask, {
        standards,
        aggregated,
        clashes,
        clashAnalysis,
        clashResolution,
        updateVerification,
        coordinationDrawings,
      });
    },
    async () => {
      const takeoff = await ctx.task(quantityTakeoffTask, { disciplineDesigns, conceptDesign: concept.conceptDesign });
      const unitCosts = await ctx.task(unitCostTask, { takeoff, siteLocation });
      const directCosts = await ctx.task(directCostTask, { takeoff, unitCosts });
      const indirectCosts = await ctx.task(indirectCostTask, { directCosts, projectProfile: briefRecord.projectProfile });
      const contingency = await ctx.task(contingencyAnalysisTask, { directCosts, indirectCosts, projectProfile: briefRecord.projectProfile });
      return ctx.task(costReportTask, { takeoff, unitCosts, directCosts, indirectCosts, contingency });
    },
    async () => {
      const wbs = await ctx.task(wbsDevelopmentTask, { conceptDesign: concept.conceptDesign, disciplineDesigns });
      const activities = await ctx.task(activityDefinitionTask, { wbs });
      const durations = await ctx.task(durationEstimationTask, { activities, disciplineDesigns });
      const sequencing = await ctx.task(activitySequencingTask, { activities, durations });
      const criticalPath = await ctx.task(criticalPathTask, { sequencing, durations });
      const resources = await ctx.task(resourceLoadingTask, { criticalPath, activities });
      const optimized = await ctx.task(scheduleOptimizationTask, { criticalPath, resources });
      return ctx.task(scheduleDocumentationTask, { wbs, activities, durations, sequencing, criticalPath, resources, optimized });
    },
  ]);

  const permitRequirements = await ctx.task(permitRequirementsTask, {
    jurisdictionRecord: briefRecord.jurisdictionRecord,
    projectProfile: briefRecord.projectProfile,
    requirements,
  });
  const [buildingPermit, sitePermit, environmentalPermits, utilityPermits] = await ctx.parallel.all([
    () => ctx.task(buildingPermitTask, { permitRequirements, disciplineDesigns, specifications }),
    () => ctx.task(sitePermitTask, { permitRequirements, sitingConstraints: briefRecord.sitingConstraints, disciplineDesigns }),
    () => ctx.task(environmentalPermitsTask, { permitRequirements, sitingConstraints: briefRecord.sitingConstraints, disciplineDesigns }),
    () => ctx.task(utilityPermitsTask, { permitRequirements, disciplineDesigns }),
  ]);
  const supportingDocs = await ctx.task(supportingDocsTask, {
    permitRequirements,
    buildingPermit,
    sitePermit,
    environmentalPermits,
    utilityPermits,
    specifications,
    disciplineDesigns,
  });
  const feeSchedule = await ctx.task(feeCalculationTask, { permitRequirements, buildingPermit, sitePermit, environmentalPermits, utilityPermits });
  const permitPackage = await ctx.task(submissionPackageTask, {
    permitRequirements,
    buildingPermit,
    sitePermit,
    environmentalPermits,
    utilityPermits,
    supportingDocs,
    feeSchedule,
  });

  const documentationExit = await certifiedStageExit(ctx, 'documentation', {
    requirements,
    artifacts: [specifications, bimCoordination, permitPackage, costEstimate, schedule],
    previousMatrix: traceabilityMatrices['discipline-design'],
    deviations,
    expert: 'project-engineer',
    maxFixAttempts,
  });
  recordStageExit(documentationExit);

  // -------------------------------------------------------------------------
  // Phase 5 — Independent structural peer review + adversarial design gates
  // -------------------------------------------------------------------------
  // The peer review is composed BY NAME and is structurally independent of every
  // designing task above. It is EXECUTED first; the adversarial gate then audits
  // its executed output. Peer review is never wired as a self-check.
  const [
    peerCodeCompliance,
    peerLoadReview,
    peerAnalysisReview,
    peerMemberReview,
    peerConnectionReview,
    peerConstructabilityReview,
  ] = await ctx.parallel.all([
    () => ctx.task(codeComplianceTask, { requirements, adoptedCodeEditions: briefRecord.adoptedCodeEditions, disciplineDesigns, elementChecks }),
    () => ctx.task(loadReviewTask, { loadReport, loadCombinations, requirements }),
    () => ctx.task(analysisReviewTask, { analysis, seismicReport, disciplineDesigns }),
    () => ctx.task(memberReviewTask, { elementChecks, disciplineDesigns, loadCombinations }),
    () => ctx.task(connectionReviewTask, { disciplineDesigns, loadCombinations }),
    () => ctx.task(constructabilityReviewTask, { disciplineDesigns, bimCoordination, schedule }),
  ]);
  const commentResolution = await ctx.task(commentResolutionTask, {
    codeCompliance: peerCodeCompliance,
    loadReview: peerLoadReview,
    analysisReview: peerAnalysisReview,
    memberReview: peerMemberReview,
    connectionReview: peerConnectionReview,
    constructabilityReview: peerConstructabilityReview,
    disciplineDesigns,
  });
  const peerReviewReport = await ctx.task(peerReviewReportTask, {
    codeCompliance: peerCodeCompliance,
    loadReview: peerLoadReview,
    analysisReview: peerAnalysisReview,
    memberReview: peerMemberReview,
    connectionReview: peerConnectionReview,
    constructabilityReview: peerConstructabilityReview,
    commentResolution,
  });
  const peerReview = {
    codeCompliance: peerCodeCompliance,
    loadReview: peerLoadReview,
    analysisReview: peerAnalysisReview,
    memberReview: peerMemberReview,
    connectionReview: peerConnectionReview,
    constructabilityReview: peerConstructabilityReview,
    commentResolution,
    report: peerReviewReport,
  };

  const designRecord = await ctx.task(assembleDesignRecordTask, {
    requirements,
    disciplinePackages: disciplinePackageList,
    elementChecks,
    analysis,
    specifications,
    bimCoordination,
    peerReview,
    traceabilityMatrices,
    deviations,
    statutoryApprovals,
  });

  // GATE 1 — independent structural peer review (EXECUTED traceability).
  const peerGate = await adversarialGate(ctx, {
    gateId: 'd2c.design-review.independent',
    artifact: {
      path: designRecord.recordIndexPath,
      description: 'Assembled statutory design record: requirement -> code-clause -> drawing/calculation index with the executed element checks and the independent peer-review report',
    },
    critics: [
      {
        name: 'independent-structural-reviewer',
        role: 'Independent structural peer reviewer (licensed, not a producer on this project)',
        focus: 'RECOMPUTE the governing load combination and the demand/capacity ratio for a sample of structural elements spanning every elementType, OPEN the calculation artifacts, and cite file:line; a ratio that cannot be reproduced from the recorded calculation is a FAILURE',
      },
      {
        name: 'code-compliance-critic',
        role: 'Building-code compliance auditor',
        focus: 'every register requirement traces requirement -> code clause (document + adopted edition + section) -> drawing sheet or calculation artifact; a requirement with no artifact link, or an artifact citing a non-adopted edition, is a FAILURE',
      },
    ],
    ironLaw: [
      `EXECUTE the checks — open ${ARTIFACT_ROOT}/elements/<elementId>/check.json, re-enumerate the load combinations, and recompute the governing demand yourself. Prose agreement with the designer is not evidence.`,
      'Every claim cites file:line or the executed recomputation output. A PASS with an empty evidence array is rejected by the orchestrator.',
      'Traceability is checked end to end: register requirement id -> code clause -> drawing/calculation artifact path. A broken link at any hop is a FAILURE.',
      'Do not soften findings and do not pass on a promise of a future fix.',
      'Output verdict as JSON: {"passed": boolean, "issues": [{"severity": string, "description": string, "location": string}], "evidence": [string]}. This exact shape, nothing else.',
    ],
    maxFixAttempts: 2,
    fixer: { task: fixDesignTask, args: { gateId: 'd2c.design-review.independent' } },
    context: { requirements, elementChecks, peerReview, adoptedCodeEditions: briefRecord.adoptedCodeEditions },
  });
  recordGate('d2c.design-review.independent', peerGate);
  if (peerGate.passed !== true) {
    throw new Error(`${PROCESS_NAME}: independent design-review gate d2c.design-review.independent FAILED after ${peerGate.attempts} attempt(s) (escalated: ${peerGate.escalated}). A failed peer-review check blocks the stamp; there is no reduced-scope stamp path. Issues: ${JSON.stringify(peerGate.issues)}`);
  }
  // PUBLIC-SAFETY OVERRIDE BLOCK. adversarialGate escalates an exhausted gate to
  // a routedBreakpoint routed to the 'owner' expert and returns
  // {passed:true, escalated:true} when the owner accepts as-is. An owner
  // accept-as-is is NOT a passed independent structural peer review, and the
  // owner is not the licensed reviewer. escalated:true on this gate means the
  // critics failed, so the stamp must be unreachable.
  if (peerGate.escalated === true) {
    throw new Error(`${PROCESS_NAME}: independent design-review gate d2c.design-review.independent was ESCALATED to the owner after the critics FAILED (attempts: ${peerGate.attempts}). An owner accept-as-is is not a passed independent peer review — the engineer-of-record stamp is unreachable whenever the critics failed, and there is no reduced-scope stamp path. Issues: ${JSON.stringify(peerGate.issues)}`);
  }

  // GATE 2 — constructability / BIM clash conformance.
  const clashGate = await adversarialGate(ctx, {
    gateId: 'd2c.constructability.bim-clash',
    artifact: {
      path: `${ARTIFACT_ROOT}/bim/coordination-report.json`,
      description: 'BIM coordination record: aggregated discipline models, clash detection output, clash resolution log, update verification',
    },
    critics: [
      {
        name: 'clash-conformance-critic',
        role: 'BIM clash conformance auditor',
        focus: 'RE-RUN clash detection over the aggregated model and DIFF against the recorded clashReports; every recorded clash has a resolution with a verified model update; an unreproducible zero-clash claim is a FAILURE',
      },
      {
        name: 'constructability-critic',
        role: 'Constructability and cross-discipline coordination auditor',
        focus: 'every MEP penetration in the penetration schedule is coordinated with the structural element it passes through; access, sequencing, tolerance, and formwork/rebar congestion issues from the constructability review are dispositioned with an artifact, not a promise',
      },
    ],
    ironLaw: [
      'EXECUTE the clash re-run over the aggregated model; a recorded clash count you did not reproduce is not evidence.',
      'Cross-discipline clash means STRUCTURAL vs MEP vs DRAINAGE vs GEOTECHNICAL — check every discipline pair present in disciplinesInScope, not only the easy pair.',
      'Every claim cites file:line in the coordination report / clash report or the executed re-run output.',
      'Do not soften findings and do not pass on a promise of a future fix.',
      'Output verdict as JSON: {"passed": boolean, "issues": [{"severity": string, "description": string, "location": string}], "evidence": [string]}. This exact shape, nothing else.',
    ],
    maxFixAttempts: 2,
    fixer: { task: fixDesignTask, args: { gateId: 'd2c.constructability.bim-clash' } },
    context: { bimCoordination, disciplinesInScope, constructabilityReview: peerConstructabilityReview },
  });
  recordGate('d2c.constructability.bim-clash', clashGate);
  if (clashGate.passed !== true) {
    throw new Error(`${PROCESS_NAME}: constructability gate d2c.constructability.bim-clash FAILED after ${clashGate.attempts} attempt(s) (escalated: ${clashGate.escalated}). The stamp is unreachable without a passed gate. Issues: ${JSON.stringify(clashGate.issues)}`);
  }
  // Same public-safety override block as the peer-review gate above: an owner
  // accept-as-is over failed constructability/clash critics does not unlock the seal.
  if (clashGate.escalated === true) {
    throw new Error(`${PROCESS_NAME}: constructability gate d2c.constructability.bim-clash was ESCALATED to the owner after the critics FAILED (attempts: ${clashGate.attempts}). An owner accept-as-is is not a passed conformance gate — the engineer-of-record stamp is unreachable whenever the critics failed. Issues: ${JSON.stringify(clashGate.issues)}`);
  }

  const designReviewExit = await certifiedStageExit(ctx, 'design-review', {
    requirements,
    artifacts: [designRecord.recordIndexPath, peerReviewReport],
    previousMatrix: traceabilityMatrices['documentation'],
    deviations,
    expert: 'independent-peer-reviewer',
    maxFixAttempts,
  });
  recordStageExit(designReviewExit);

  // -------------------------------------------------------------------------
  // Phase 6 — EOR stamp, permit submission, construction release (policy-gated)
  // -------------------------------------------------------------------------
  // A stamp request without executed gate evidence is structurally impossible
  // to build.
  for (const [gateId, gateResult] of [['d2c.design-review.independent', peerGate], ['d2c.constructability.bim-clash', clashGate]]) {
    if (typeof gateResult.passed !== 'boolean' || typeof gateResult.attempts !== 'number' || !Array.isArray(gateResult.evidence)) {
      throw new Error(`${PROCESS_NAME}: gate result for ${gateId} is malformed — a stamp request without executed gate evidence cannot be constructed (got ${JSON.stringify(gateResult)})`);
    }
  }

  const elementCheckSummary = {
    total: elementChecks.length,
    passed: elementChecks.filter((c) => c.passed === true).length,
  };

  const stampApproval = await requireStatutoryApproval(ctx, {
    actionId: 'design-to-construction.engineer-of-record-stamp',
    expert: 'engineer-of-record',
    neverAutoApprove: true,
    question: `Apply the engineer-of-record seal to project ${projectId}? Independent design-review gate passed in ${peerGate.attempts} attempt(s), constructability/BIM-clash gate in ${clashGate.attempts} attempt(s); ${designRecord.openItems.length} open item(s); ${elementCheckSummary.passed}/${elementCheckSummary.total} executed element checks passed. Sealing takes personal legal responsibility for public safety.`,
    payload: {
      recordIndexPath: designRecord.recordIndexPath,
      peerReviewGate: { passed: peerGate.passed, attempts: peerGate.attempts, escalated: peerGate.escalated, evidence: peerGate.evidence },
      clashGate: { passed: clashGate.passed, attempts: clashGate.attempts, escalated: clashGate.escalated, evidence: clashGate.evidence },
      openItems: designRecord.openItems,
      elementCheckSummary,
    },
    approvals: statutoryApprovals,
  });

  // GUARDED EXECUTOR — requireStatutoryApproval throws on rejection, so reaching
  // this line already means approved === true; the explicit structural assertion
  // plus the executor's own REFUSE-if-absent instruction is defence in depth.
  if (stampApproval.approved !== true) {
    throw new Error(`${PROCESS_NAME}: stamp approval record is not approved — the seal executor must never be scheduled (got ${JSON.stringify(stampApproval)})`);
  }
  const stamp = await ctx.task(stampExecutionTask, {
    designRecordIndexPath: designRecord.recordIndexPath,
    peerReviewDisposition: peerReview.commentResolution,
    gateResults: { peerReview: peerGate, constructability: clashGate },
    traceabilityMatrices,
    approvalProvenance: stampApproval,
  });

  const permitApproval = await requireStatutoryApproval(ctx, {
    actionId: 'design-to-construction.permit-submission',
    expert: 'engineer-of-record',
    neverAutoApprove: true,
    question: `Submit the sealed permit package for project ${projectId} to ${briefRecord.jurisdictionRecord.agency ?? 'the authority having jurisdiction'}? Seal record: ${stamp.sealRecordPath}; ${stamp.sealedManifest.length} sealed document(s).`,
    payload: {
      permitPackage,
      sealRecordPath: stamp.sealRecordPath,
      stampId: stamp.stampId,
      jurisdictionRecord: briefRecord.jurisdictionRecord,
    },
    approvals: statutoryApprovals,
  });
  if (permitApproval.approved !== true) {
    throw new Error(`${PROCESS_NAME}: permit-submission approval record is not approved — the submission executor must never be scheduled (got ${JSON.stringify(permitApproval)})`);
  }
  const permitSubmission = await ctx.task(permitSubmissionExecutionTask, {
    permitPackage,
    stamp,
    jurisdictionRecord: briefRecord.jurisdictionRecord,
    feeSchedule,
    approvalProvenance: permitApproval,
  });

  // Construction release — a PROCESS stage-exit sign-off, not a sixth statutory
  // action. approved !== true throws: no construction proceeds without release.
  const constructionRelease = await routedBreakpoint(ctx, {
    question: `Release project ${projectId} for construction? Sealed design record ${stamp.sealRecordPath}, permit submission ${permitSubmission.submissionId} lodged with ${briefRecord.jurisdictionRecord.agency ?? 'the AHJ'}.`,
    stampId: stamp.stampId,
    sealRecordPath: stamp.sealRecordPath,
    submissionId: permitSubmission.submissionId,
    submissionRecordPath: permitSubmission.submissionRecordPath,
  }, {
    breakpointId: 'd2c.stage-exit.construction-release',
    expert: 'construction-manager',
    tags: ['d2c', 'stage-exit', 'construction-release'],
    strategy: 'single',
  });
  if (constructionRelease.approved !== true) {
    const notes = constructionRelease.response ?? constructionRelease.feedback ?? 'no reviewer notes';
    throw new Error(`${PROCESS_NAME}: construction release REJECTED by construction-manager for project ${projectId}: ${notes}. No construction proceeds without the release.`);
  }
  signoffs['construction-release'] = constructionRelease;

  // Construction QC planning composed BY NAME — its inspection protocols yield
  // the hold-point inventory used in Phase 8.
  const qcRequirements = await ctx.task(requirementsAnalysisTask, { requirements, specifications, disciplineDesigns });
  const qcPlan = await ctx.task(qcPlanDevelopmentTask, { qcRequirements, specifications, schedule });
  const inspectionProtocols = await ctx.task(inspectionProtocolsTask, { qcPlan, qcRequirements, disciplineDesigns, schedule });
  const testingRequirements = await ctx.task(testingRequirementsTask, { inspectionProtocols, specifications, qcRequirements });
  const acceptanceCriteria = await ctx.task(acceptanceCriteriaTask, { testingRequirements, requirements, specifications });
  const inspectionChecklists = await ctx.task(inspectionChecklistsTask, { inspectionProtocols, acceptanceCriteria, testingRequirements });
  const nonConformanceProcedures = await ctx.task(nonConformanceProceduresTask, { acceptanceCriteria, qcPlan });
  const qcDocumentation = await ctx.task(qcDocumentationTask, {
    qcPlan,
    inspectionProtocols,
    testingRequirements,
    acceptanceCriteria,
    inspectionChecklists,
    nonConformanceProcedures,
  });

  const holdPointInventory = inspectionProtocols.holdPoints;
  if (!Array.isArray(holdPointInventory) || holdPointInventory.length === 0) {
    throw new Error(`${PROCESS_NAME}: the QC inspection protocols declared no hold points (got ${JSON.stringify(holdPointInventory)}) — a construction phase with no hold points is a misuse of this process`);
  }

  // -------------------------------------------------------------------------
  // Phase 7 — Shop-drawing review + fabrication release
  // -------------------------------------------------------------------------
  let shopDrawings = [];
  if (Array.isArray(shopDrawingSubmittals) && shopDrawingSubmittals.length > 0) {
    // shop-drawing-review.js submittalLoggingTask logs ONE submittal and
    // DECLARES required ['success','submittalNumber','artifacts'] — it emits
    // neither `submittals` nor `log`. Each caller-supplied submittal is
    // therefore mapped through the ingredient individually and the logged list
    // is built from its declared `submittalNumber`. No `??` chain.
    const loggedSubmittals = await ctx.parallel.map(shopDrawingSubmittals, async (suppliedSubmittal) => {
      const logEntry = await ctx.task(submittalLoggingTask, {
        submittalPackage: [suppliedSubmittal],
        submittal: suppliedSubmittal,
        specifications,
        schedule,
        stamp,
      });
      if (typeof logEntry.submittalNumber !== 'string' || logEntry.submittalNumber.trim().length === 0) {
        throw new Error(`${PROCESS_NAME}: submittal logging returned no submittalNumber for a supplied shop-drawing submittal (got ${JSON.stringify(logEntry.submittalNumber)} from ${JSON.stringify(logEntry)}) — an unnumbered submittal cannot carry a statutory shop-drawing approval`);
      }
      return {
        submittalId: logEntry.submittalNumber,
        submittalNumber: logEntry.submittalNumber,
        suppliedSubmittal,
        logEntry,
      };
    });
    if (loggedSubmittals.length !== shopDrawingSubmittals.length) {
      throw new Error(`${PROCESS_NAME}: ${shopDrawingSubmittals.length} shop-drawing submittal(s) were supplied but only ${loggedSubmittals.length} were logged — a dropped submittal silently skips its statutory shop-drawing approval`);
    }

    shopDrawings = await ctx.parallel.map(loggedSubmittals, async (submittal) => {
      const submittalId = submittal.submittalId;
      if (typeof submittalId !== 'string' || submittalId.length === 0) {
        throw new Error(`${PROCESS_NAME}: logged shop-drawing submittal has no resolvable id (got ${JSON.stringify(submittal)})`);
      }

      const [specComplianceResult, designIntentResult, coordinationResult, materialResult] = await ctx.parallel.all([
        () => ctx.task(specComplianceTask, { submittal, specifications, requirements }),
        () => ctx.task(designIntentTask, { submittal, disciplineDesigns, stamp }),
        () => ctx.task(coordinationReviewTask, { submittal, bimCoordination, disciplineDesigns }),
        () => ctx.task(materialReviewTask, { submittal, specifications }),
      ]);
      const comments = await ctx.task(commentCompilationTask, {
        submittal,
        specCompliance: specComplianceResult,
        designIntent: designIntentResult,
        coordination: coordinationResult,
        material: materialResult,
      });
      const determination = await ctx.task(approvalDeterminationTask, { submittal, comments });
      const responsePackage = await ctx.task(responsePackageTask, { submittal, comments, determination });

      // shop-drawing-review.js commentCompilationTask DECLARES `allComments`
      // (required: ['allComments','artifacts']) — there is no `reviewComments`.
      // Reading the undeclared name rendered "0 open review comment(s)" into
      // the statutory approval prompt while the compiled review carried
      // findings. An absent compiled comment set STOPS the run.
      const reviewComments = comments.allComments;
      if (!Array.isArray(reviewComments)) {
        throw new Error(`${PROCESS_NAME}: comment compilation for submittal ${submittalId} returned no allComments array (got ${JSON.stringify(comments.allComments)}) — the engineer-of-record must not be asked to authorize fabrication against an unknown comment set`);
      }

      // shop-drawing-review.js approvalDeterminationTask DECLARES `status`
      // (required: ['status','stamp','artifacts']) — there is no
      // `approvalStatus`. Reading the undeclared name silently withheld the
      // statutory shop-drawing approval for every submittal.
      const approvalStatus = determination.status;
      if (!RELEASING_SUBMITTAL_STATUSES.includes(approvalStatus) && !RESUBMIT_SUBMITTAL_STATUSES.includes(approvalStatus)) {
        throw new Error(`${PROCESS_NAME}: approval determination for submittal ${submittalId} returned status ${JSON.stringify(approvalStatus)}, which is neither a releasing status (${JSON.stringify(RELEASING_SUBMITTAL_STATUSES)}) nor a resubmit status (${JSON.stringify(RESUBMIT_SUBMITTAL_STATUSES)}). An unrecognized determination stops the run — silently withholding the statutory shop-drawing approval is worse than a throw.`);
      }

      // A rejected / revise-and-resubmit determination does NOT raise the
      // statutory approval breakpoint — the fabricator resubmits (out of scope).
      if (!RELEASING_SUBMITTAL_STATUSES.includes(approvalStatus)) {
        return {
          submittalId,
          released: false,
          approvalStatus,
          comments,
          determination,
          responsePackage,
          release: null,
          approvalProvenance: null,
        };
      }

      const submittalApproval = await requireStatutoryApproval(ctx, {
        actionId: 'design-to-construction.shop-drawing-approval',
        expert: 'engineer-of-record',
        instanceId: submittalId,
        question: `Approve shop-drawing submittal ${submittalId} (determination: ${approvalStatus}, ${reviewComments.length} open review comment(s))? Approval authorizes fabrication to begin.`,
        payload: {
          submittalId,
          approvalStatus,
          reviewComments,
        },
        approvals: statutoryApprovals,
      });
      if (submittalApproval.approved !== true) {
        throw new Error(`${PROCESS_NAME}: shop-drawing approval record for ${submittalId} is not approved — the fabrication-release executor must never be scheduled (got ${JSON.stringify(submittalApproval)})`);
      }
      const release = await ctx.task(fabricationReleaseTask, {
        submittal,
        submittalId,
        reviewComments,
        approvalStatus,
        stamp,
        approvalProvenance: submittalApproval,
      });

      return {
        submittalId,
        released: true,
        approvalStatus,
        comments,
        determination,
        responsePackage,
        release,
        approvalProvenance: submittalApproval,
      };
    });

    const shopDrawingGate = await adversarialGate(ctx, {
      gateId: 'd2c.shop-drawings.conformance',
      artifact: {
        path: `${ARTIFACT_ROOT}/shop-drawings/`,
        description: 'Per-submittal review comments, approval determinations, and fabrication release records',
      },
      critics: [
        {
          name: 'submittal-conformance-critic',
          role: 'Submittal review auditor',
          focus: 'every released submittal has an approved/approved-as-noted determination AND a recorded design-to-construction.shop-drawing-approval breakpoint event id; a release with no approval record is a FAILURE',
        },
        {
          name: 'design-intent-critic',
          role: 'Design intent auditor',
          focus: 'every substitution or dimensional departure in a released submittal is either within the stamped design intent with a cited sheet/detail, or routed through design-deviation-acceptance',
        },
      ],
      ironLaw: [
        'Open the release records and the approval provenance log and cross-check them; an unverified release claim is not evidence.',
        'Output verdict as JSON: {"passed": boolean, "issues": [{"severity": string, "description": string, "location": string}], "evidence": [string]}. This exact shape, nothing else.',
      ],
      maxFixAttempts: 2,
      fixer: { task: fixDesignTask, args: { gateId: 'd2c.shop-drawings.conformance' } },
      context: { shopDrawings, statutoryApprovals, stamp },
    });
    recordGate('d2c.shop-drawings.conformance', shopDrawingGate);
    if (shopDrawingGate.passed !== true) {
      throw new Error(`${PROCESS_NAME}: shop-drawing conformance gate d2c.shop-drawings.conformance FAILED after ${shopDrawingGate.attempts} attempt(s) (escalated: ${shopDrawingGate.escalated}). Issues: ${JSON.stringify(shopDrawingGate.issues)}`);
    }
  }

  // -------------------------------------------------------------------------
  // Phase 8 — Construction: hold points (SEQUENTIAL) + RFI / deviation handling
  // -------------------------------------------------------------------------
  // Hold points are processed in schedule order with a plain for-of loop —
  // parallelizing them would authorize covering work out of construction sequence.
  const holdPoints = [];
  for (const holdPoint of holdPointInventory) {
    const [holdPointId] = extractIds([holdPoint]);
    if (!holdPointId) {
      throw new Error(`${PROCESS_NAME}: hold point has no resolvable id (got ${JSON.stringify(holdPoint)})`);
    }

    let attempt = 0;
    let inspection = await ctx.task(holdPointInspectionTask, {
      holdPoint,
      holdPointId,
      inspectionChecklist: inspectionChecklists,
      testingProtocol: testingRequirements,
      acceptanceCriteria,
      stamp,
      attempt,
    });
    while (inspection.conforming !== true && attempt < maxFixAttempts) {
      attempt += 1;
      await ctx.task(fixDesignTask, {
        artifact: { path: inspection.inspectionPath, description: `Executed hold-point inspection ${holdPointId}` },
        issues: inspection.nonConformances,
        gateId: 'd2c.hold-point',
        attempt,
        context: { holdPointId },
      });
      inspection = await ctx.task(holdPointInspectionTask, {
        holdPoint,
        holdPointId,
        inspectionChecklist: inspectionChecklists,
        testingProtocol: testingRequirements,
        acceptanceCriteria,
        stamp,
        attempt,
      });
    }

    // Remaining non-conformances are routed through the RFI / design-deviation
    // path — never through an owner "accept anyway". An unresolved
    // non-conformance never reaches hold-point release.
    const dispositions = [];
    const remaining = Array.isArray(inspection.nonConformances) ? inspection.nonConformances : [];
    for (let i = 0; i < remaining.length; i++) {
      const nonConformance = remaining[i];
      const rfiId = `RFI-${holdPointId}-${i + 1}`;
      const rfi = { rfiId, holdPointId, nonConformance, inspectionPath: inspection.inspectionPath };

      const triage = await ctx.task(rfiTriageTask, {
        rfi,
        rfiId,
        stamp,
        designRecordIndexPath: designRecord.recordIndexPath,
        requirements,
        specifications,
      });

      if (triage.classification === 'clarification') {
        dispositions.push({
          rfiId,
          type: 'clarification',
          citedDocuments: triage.citedDocuments,
          nonConformance,
        });
        continue;
      }

      const deviationId = `DEV-${holdPointId}-${i + 1}`;
      const affectedElements = elementChecks.filter((check) => triage.affectedElementIds.includes(check.elementId));
      const assessment = await ctx.task(deviationAssessmentTask, {
        deviation: { deviationId, rfiId, holdPointId, nonConformance, triage },
        deviationId,
        affectedElements,
        loadCombinations,
        requirements,
        elementChecks,
        stamp,
      });

      // An engineering-unacceptable deviation is rejected BEFORE the approver
      // ever sees it — it is never put to a human as an option.
      if (assessment.acceptable !== true) {
        throw new Error(`${PROCESS_NAME}: field deviation ${deviationId} at hold point ${holdPointId} is engineering-UNACCEPTABLE (recomputed ratios: ${JSON.stringify(assessment.affectedElements)}). It is rejected before any approval breakpoint; there is no accept-anyway path.`);
      }

      const deviationApproval = await requireStatutoryApproval(ctx, {
        actionId: 'design-to-construction.design-deviation-acceptance',
        expert: 'engineer-of-record',
        instanceId: deviationId,
        question: `Accept field deviation ${deviationId} at hold point ${holdPointId}? Recomputed assessment ${assessment.assessmentPath} reports acceptable:true across ${assessment.affectedElements.length} affected element(s).`,
        payload: {
          deviationId,
          holdPointId,
          rfiId,
          assessmentPath: assessment.assessmentPath,
          affectedElements: assessment.affectedElements,
          codeClauses: assessment.codeClauses,
        },
        approvals: statutoryApprovals,
      });
      if (deviationApproval.approved !== true) {
        throw new Error(`${PROCESS_NAME}: deviation approval record for ${deviationId} is not approved — the deviation-implementation executor must never be scheduled (got ${JSON.stringify(deviationApproval)})`);
      }
      const implementation = await ctx.task(deviationImplementationTask, {
        deviation: { deviationId, rfiId, holdPointId, nonConformance, triage },
        deviationId,
        assessment,
        stamp,
        approvalProvenance: deviationApproval,
      });

      const deviationRecord = {
        deviationId,
        rfiId,
        holdPointId,
        triage,
        assessment,
        implementation,
        approvalProvenance: deviationApproval,
        breakpointEventId: deviationApproval.breakpointEventId,
      };
      deviations.push(deviationRecord);
      if (implementation.requiresRestamp === true) {
        // The process never silently re-seals — the requirement is surfaced.
        restampRequired.push(deviationRecord);
      }
      dispositions.push({
        rfiId,
        type: 'deviation',
        deviationId,
        revisionRecordPath: implementation.revisionRecordPath,
        breakpointEventId: deviationApproval.breakpointEventId,
        nonConformance,
      });
    }

    const releaseApproval = await requireStatutoryApproval(ctx, {
      actionId: 'design-to-construction.hold-point-release',
      expert: 'construction-quality-manager',
      neverAutoApprove: true,
      instanceId: holdPointId,
      question: `Release hold point ${holdPointId}, allowing the work to be permanently covered? Executed inspection ${inspection.inspectionPath} reports conforming:${inspection.conforming} with ${remaining.length} non-conformance(s) and ${dispositions.length} recorded disposition(s).`,
      payload: {
        holdPointId,
        inspectionPath: inspection.inspectionPath,
        checklistResults: inspection.checklistResults,
        nonConformances: inspection.nonConformances,
        dispositions,
      },
      approvals: statutoryApprovals,
    });
    if (releaseApproval.approved !== true) {
      throw new Error(`${PROCESS_NAME}: hold-point release record for ${holdPointId} is not approved — the release executor must never be scheduled (got ${JSON.stringify(releaseApproval)})`);
    }
    const release = await ctx.task(holdPointReleaseExecutionTask, {
      holdPoint,
      holdPointId,
      inspection,
      nonConformanceDispositions: dispositions,
      approvalProvenance: releaseApproval,
    });

    holdPoints.push({
      holdPointId,
      inspection,
      inspectionAttempts: attempt,
      dispositions,
      release,
      released: true,
      approvalProvenance: releaseApproval,
    });
  }

  const constructionExit = await certifiedStageExit(ctx, 'construction', {
    requirements,
    artifacts: [...holdPoints, ...deviations],
    previousMatrix: traceabilityMatrices['design-review'],
    deviations,
    expert: 'construction-quality-manager',
    maxFixAttempts,
  });
  recordStageExit(constructionExit);

  // -------------------------------------------------------------------------
  // Phase 9 — Handover + as-built
  // -------------------------------------------------------------------------
  const asBuilt = await ctx.task(asBuiltReconciliationTask, {
    stamp,
    deviations,
    holdPoints,
    shopDrawings,
    requirements,
    traceabilityMatrices,
  });
  if (Array.isArray(asBuilt.unapprovedDeltas) && asBuilt.unapprovedDeltas.length > 0) {
    throw new Error(`${PROCESS_NAME}: ${asBuilt.unapprovedDeltas.length} as-built departure(s) carry no recorded design-deviation-acceptance event id (${JSON.stringify(asBuilt.unapprovedDeltas)}) — they cannot be handed over and there is no normalize-it-into-the-record path.`);
  }

  const handover = await ctx.task(handoverPackageTask, {
    asBuilt,
    stamp,
    permitSubmission,
    holdPoints,
    shopDrawings,
    specifications,
    qcDocumentation,
    statutoryApprovals,
  });

  const asBuiltGate = await adversarialGate(ctx, {
    gateId: 'd2c.as-built.conformance',
    artifact: {
      path: asBuilt.reconciliationPath,
      description: 'As-built reconciliation and the handover dossier index',
    },
    critics: [
      {
        name: 'as-built-critic',
        role: 'As-built records auditor',
        focus: 'every delta between stamped design and constructed work cites an approval breakpoint event id; unapprovedDeltas must be empty',
      },
      {
        name: 'record-completeness-critic',
        role: 'Closeout record completeness auditor',
        focus: 'every hold point has an executed inspection AND a release record; every dossier entry resolves to a real artifact path or breakpoint event id',
      },
    ],
    ironLaw: [
      'Resolve every cited path and every breakpoint event id against the run\'s records; a dangling citation is a FAILURE.',
      'Output verdict as JSON: {"passed": boolean, "issues": [{"severity": string, "description": string, "location": string}], "evidence": [string]}. This exact shape, nothing else.',
    ],
    maxFixAttempts: 2,
    fixer: { task: fixDesignTask, args: { gateId: 'd2c.as-built.conformance' } },
    context: { asBuilt, handover, holdPoints, shopDrawings, statutoryApprovals },
  });
  recordGate('d2c.as-built.conformance', asBuiltGate);
  if (asBuiltGate.passed !== true) {
    throw new Error(`${PROCESS_NAME}: as-built conformance gate d2c.as-built.conformance FAILED after ${asBuiltGate.attempts} attempt(s) (escalated: ${asBuiltGate.escalated}). Issues: ${JSON.stringify(asBuiltGate.issues)}`);
  }

  const handoverExit = await certifiedStageExit(ctx, 'handover', {
    requirements,
    artifacts: [asBuilt.reconciliationPath, handover.dossierIndexPath],
    previousMatrix: traceabilityMatrices['construction'],
    deviations,
    expert: 'construction-manager',
    maxFixAttempts,
  });
  recordStageExit(handoverExit);

  const holdPointSummary = { total: holdPointInventory.length, released: holdPoints.filter((h) => h.released === true).length };
  const shopDrawingSummary = { total: shopDrawings.length, released: shopDrawings.filter((s) => s.released === true).length };

  const success = stamp !== null
    && permitSubmission !== null
    && constructionRelease.approved === true
    && holdPointSummary.released === holdPointSummary.total
    && asBuiltGate.passed === true;

  const autoApprovalAnomalies = statutoryApprovals.filter((r) => r.anomaly !== null);

  // -------------------------------------------------------------------------
  // Phase 10 — kip assert
  // -------------------------------------------------------------------------
  await kipAssert(ctx, {
    kipDir,
    kipModel,
    kind: KIP_KIND,
    facts: [
      ...INGREDIENT_PROCESSES.map((ingredient) => ({
        subject: `process:${PROCESS_NAME}`,
        predicate: 'composes',
        object: `process:${ingredient}`,
      })),
      {
        subject: `process:${PROCESS_NAME}`,
        predicate: 'enforces-pattern',
        object: 'pattern:executed-element-check-required-for-stamp',
      },
      {
        subject: `process:${PROCESS_NAME}`,
        predicate: 'enforces-pattern',
        object: 'pattern:independent-peer-review-blocks-stamp',
      },
      {
        subject: `process:${PROCESS_NAME}`,
        predicate: 'enforces-pattern',
        object: 'pattern:hold-point-release-requires-executed-inspection',
      },
      {
        subject: `project:${projectId}`,
        predicate: 'stamped-by',
        object: 'role:engineer-of-record',
        props: {
          stampId: stamp.stampId,
          sealRecordPath: stamp.sealRecordPath,
          peerReviewGateAttempts: peerGate.attempts,
          clashGateAttempts: clashGate.attempts,
        },
      },
      {
        subject: `project:${projectId}`,
        predicate: 'permit-submitted-to',
        object: `agency:${briefRecord.jurisdictionRecord.agency ?? 'unknown'}`,
        props: {
          submissionId: permitSubmission.submissionId,
          applications: permitSubmission.applications,
        },
      },
      {
        subject: `run:${ctx.runId}`,
        predicate: 'run-outcome',
        object: `process:${PROCESS_NAME}`,
        props: {
          projectId,
          projectType,
          stagesPassed: Object.keys(traceabilityMatrices),
          gateAttempts,
          escalations,
          elementCheckSummary,
          holdPointSummary,
          shopDrawingSummary,
          deviationCount: deviations.length,
          restampRequiredCount: restampRequired.length,
          statutoryApprovalCount: statutoryApprovals.length,
          autoApprovalAnomalyCount: autoApprovalAnomalies.length,
          success,
        },
      },
    ],
  });

  return {
    success,
    projectBriefRecord: briefRecord,
    requirementRegister,
    conceptDesign: concept,
    siteInvestigation: { geotechnicalReport, slopeStabilityReport, stormwaterHydrology },
    analysis,
    disciplineDesigns,
    elementChecks,
    specifications,
    bimCoordination,
    permitPackage,
    peerReview,
    gates,
    stamp,
    permitSubmission,
    constructionRelease,
    shopDrawings,
    holdPoints,
    deviations,
    asBuilt,
    handover,
    traceabilityMatrices,
    statutoryApprovals,
    signoffs,
    metadata: {
      process: PROCESS_NAME,
      projectId,
      projectType,
      adoptedCodeEditions: briefRecord.adoptedCodeEditions,
      gateAttempts,
      escalations,
      elementCheckSummary,
      holdPointSummary,
      shopDrawingSummary,
      deviations: deviations.map((d) => d.deviationId),
      restampRequired: restampRequired.map((d) => d.deviationId),
      statutoryApprovals,
      autoApprovalAnomalies,
      kipRecallFactCount: recall.factCount,
    },
  };
}
