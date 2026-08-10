/**
 * @process specializations/domains/science/biomedical-engineering/medical-device-tplc-workflow
 * @description Flagship medical-device total-product-lifecycle workflow: design-control intake ->
 *   ISO 14971 risk management -> parallel design characterization (biological evaluation,
 *   sterilization/sterile-barrier, human factors, IEC 62304 software) -> DESIGN FREEZE
 *   (policy-gated) -> verification and validation over the frozen baseline -> clinical evaluation
 *   with policy-gated first-in-human authorization -> Design History File sufficiency gate ->
 *   policy-gated regulatory submission with bounded deficiency-response rounds -> post-market
 *   surveillance with severity-routed CAPA, policy-gated field action and policy-gated vigilance
 *   filing. Composes the 14 biomedical point processes BY NAME (never imported).
 * @inputs {
 *   deviceName: string,            // required — the device under development
 *   intendedUse: string,           // required — the intended-use statement driving inputs and risk
 *   deviceClass: string,           // required — e.g. 'Class II' | 'Class III' | 'MDR Class IIb'
 *   regulatoryPathway: string,     // required — '510k' | 'eu-mdr' (throwing lookup, no default)
 *   markets?: string[],            // markets in scope (default ['US'])
 *   hasSoftware?: boolean,         // false skips the software-lifecycle leg, recorded skipped:true (default true)
 *   predicateDevices?: object[],   // required in practice for '510k'; a missing predicate FAILS dossier assembly
 *   signalDataPath?: string,       // post-market dataset path; absent -> pendingExternal, never fabricated signals
 *   repoRoot?: string,             // repository root the agents work in (default '.')
 *   artifactsDir?: string,         // default 'artifacts/medical-device-tplc/<device-slug>'
 *   maxFixAttempts?: number,       // adversarial-gate fixer budget (default 2)
 *   maxSubmissionRounds?: number,  // bounded deficiency-response rounds (default 2)
 *   maxParallelProtocols?: number, // ctx.parallel.map concurrency for V&V protocols (default 3)
 *   kipDir?: string,               // kip store directory (default '.a5c/kip')
 *   kipModel?: string              // model for kip structured paths (default 'sonnet')
 * }
 * @outputs {
 *   success: boolean,
 *   designControl: object,         // { planPath, dhfIndexPath, designInputIds }
 *   riskManagement: object,        // { riskFilePath, traceabilityPath, hazardCount, riskControlIds }
 *   characterization: object,      // { biologicalEvaluation, sterilizationBarrier, humanFactors, softwareLifecycle }
 *   designFreeze: object|null,     // { approved, baselineId, baselineDigest, baselinePath } or null when never reached
 *   verificationValidation: object,// { planPath, summaryPath, protocolCount, passedCount, failedCount }
 *   clinicalEvaluation: object,    // { planPath, investigationConducted, cerPath, evidenceGaps }
 *   designHistoryFile: object,     // { dhfPath, evidenceIndexPath, missingArtifacts, gate }
 *   submission: object,            // { pathway, manifestPath, transmitted, submissionReference, rounds, settled }
 *   postMarket: object,            // { pmsPlanPath, analysisPath, pendingExternal, signals, capas, fieldActions, filings }
 *   evidenceIndex: object,         // per-phase artifact path index accumulated in the orchestrator
 *   dossierManifest: object|null,  // the assembled submission dossier manifest (null when never assembled)
 *   kipFactsAsserted: number,
 *   metadata: object               // { processId, runId, deviceName, deviceClass, regulatoryPathway, markets,
 *                                  //   policyGatedActions, policyDecisions, autoApprovedActions, breakpointsHit,
 *                                  //   gateResults, submissionRounds, escalations, kipRecallFactCount }
 * }
 * @graph
 *   domains: [domain:biomedical-engineering, domain:healthcare]
 *   specializations: [specialization:biomedical-engineering, specialization:data-privacy-compliance]
 *   skillAreas: [skill-area:risk-management, skill-area:verification-validation, skill-area:regulatory-affairs, skill-area:human-factors-engineering]
 *   workflows: [workflow:product-lifecycle, workflow:release-management]
 *   topics: [topic:compliance-traceability, topic:medical-device-regulation]
 *   roles: [role:biomedical-engineer, role:regulatory-affairs-lead, role:quality-management-representative, role:design-assurance-lead, role:medical-director]
 * @policyGatedActions medical-device-tplc.design-freeze (design-assurance-lead),
 *   medical-device-tplc.clinical-study-start (medical-director),
 *   medical-device-tplc.regulatory-submission (regulatory-affairs-lead),
 *   medical-device-tplc.field-action (quality-management-representative),
 *   medical-device-tplc.post-market-report-filing (regulatory-affairs-lead) — each via
 *   routedBreakpoint with breakpointId = actionId, tags including 'policy-gated', strategy
 *   'single', never auto-approved (no autoApproveAfterN, no presentAlwaysApprove)
 *
 * Policy-gated actions (adapters/policy ready):
 *   medical-device-tplc.design-freeze            (design-assurance-lead)          — unfreezing invalidates completed V&V evidence.
 *   medical-device-tplc.clinical-study-start     (medical-director)               — first-in-human exposure cannot be undone.
 *   medical-device-tplc.regulatory-submission    (regulatory-affairs-lead)        — the submitted record is permanent and starts a statutory clock.
 *   medical-device-tplc.field-action             (quality-management-representative) — a recall/FSCA is publicly and commercially irreversible.
 *   medical-device-tplc.post-market-report-filing(regulatory-affairs-lead)        — a filing to a competent authority is a permanent regulatory record.
 * Each is raised via routedBreakpoint with breakpointId === actionId verbatim, the accountable
 * expert above, a 'policy-gated' tag and strategy 'single'. NONE carries autoApproveAfterN or
 * presentAlwaysApprove (fail-closed); every executor is scheduled strictly inside
 * `if (decision.approved === true)`, and any harness auto-approval is recorded verbatim in
 * metadata.policyDecisions, aggregated into metadata.autoApprovedActions, threaded into the
 * executor context as authorization.autoApproved and carried in the kip run-outcome fact.
 *
 * Hard rules: Style-A agent tasks only (zero kind:'shell'); combinators are imported from
 * common-utilities and never re-implemented; every gate/verification outputSchema declares
 * evidence { type:'array', minItems:1 }; NO fallbacks — pathwaySpec, policyAction, routingExpert
 * and assertSignalSeverity all THROW on unknown keys, a missing predicate artifact FAILS dossier
 * assembly, an unmet gate FAILS its phase, and no rejected gate has an alternate path to the same
 * effect. The 14 sibling point processes are composed BY NAME inside agent prompts only — importing
 * them would double-fire their internal breakpoints and can collide task ids in the SDK registry.
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/biomedical-engineering/medical-device-tplc-workflow', {
 *   deviceName: 'Acme Infusion Pump X1',
 *   intendedUse: 'Continuous intravenous infusion of therapeutic fluids in acute-care settings',
 *   deviceClass: 'Class II',
 *   regulatoryPathway: '510k',
 *   markets: ['US'],
 *   hasSoftware: true,
 *   predicateDevices: [{ name: 'Acme Infusion Pump X0', k510: 'K123456' }],
 *   maxSubmissionRounds: 2
 * });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../../../common-utilities/routed-gate-combinators.js';

// ---------------------------------------------------------------------------
// Frozen lookup tables + throwing lookups — there is no default anywhere here
// ---------------------------------------------------------------------------

/**
 * Regulatory submission pathways. The ingredientProcess names the sibling library process
 * whose section structure the dossier assembler follows BY NAME (it is never imported).
 */
export const SUBMISSION_PATHWAYS = Object.freeze({
  '510k': Object.freeze({
    label: '510(k) premarket notification',
    ingredientProcess: '510k-submission.js',
    authority: 'FDA',
  }),
  'eu-mdr': Object.freeze({
    label: 'EU MDR technical documentation',
    ingredientProcess: 'eu-mdr-technical-documentation.js',
    authority: 'notified-body',
  }),
});

/** Post-market signal severities. Anything outside this frozen list is a protocol error. */
export const SIGNAL_SEVERITIES = Object.freeze(['critical', 'major', 'moderate', 'minor']);

/**
 * Policy-gate routing per post-market signal severity. `null` means the action is NEVER
 * raised at that severity — looking up its expert is an orchestrator bug and throws.
 * Structural transfer from incident-management/incident-lifecycle.js SEVERITY_ROUTING.
 */
export const SIGNAL_SEVERITY_ROUTING = Object.freeze({
  'medical-device-tplc.field-action': Object.freeze({
    critical: 'quality-management-representative',
    major: 'quality-management-representative',
    moderate: null, // not raised
    minor: null, // not raised
  }),
  'medical-device-tplc.post-market-report-filing': Object.freeze({
    critical: 'regulatory-affairs-lead',
    major: 'regulatory-affairs-lead',
    moderate: 'regulatory-affairs-lead',
    minor: null, // not raised
  }),
});

/**
 * Design History File sections that MUST be covered before the sufficiency gate runs.
 * A missing section FAILS the phase — it is never downgraded to a warning. The
 * software-lifecycle section is required only when inputs.hasSoftware === true.
 */
export const REQUIRED_DHF_SECTIONS = Object.freeze([
  'design-plan',
  'design-inputs',
  'design-outputs',
  'design-reviews',
  'risk-management',
  'biological-evaluation',
  'sterilization-barrier',
  'human-factors',
  'software-lifecycle',
  'verification',
  'validation',
  'clinical-evaluation',
  'design-transfer',
]);

/**
 * The five irreversible actions of this process, declared for adapters/policy so a run can
 * be gated declaratively. Returned verbatim in metadata.policyGatedActions.
 */
export const POLICY_GATED_ACTIONS = Object.freeze([
  Object.freeze({
    actionId: 'medical-device-tplc.design-freeze',
    expert: 'design-assurance-lead',
    description: 'Freeze the design inputs/outputs baseline for verification; downstream V&V evidence is only valid against a frozen baseline, so unfreezing invalidates completed testing.',
    irreversible: true,
  }),
  Object.freeze({
    actionId: 'medical-device-tplc.clinical-study-start',
    expert: 'medical-director',
    description: 'Authorize enrollment/first-in-human for the clinical investigation; exposes patients to an investigational device and cannot be undone.',
    irreversible: true,
  }),
  Object.freeze({
    actionId: 'medical-device-tplc.regulatory-submission',
    expert: 'regulatory-affairs-lead',
    description: 'Transmit the 510(k) or EU MDR technical documentation dossier to the regulator/notified body; the submitted record is permanent and starts a statutory clock.',
    irreversible: true,
  }),
  Object.freeze({
    actionId: 'medical-device-tplc.field-action',
    expert: 'quality-management-representative',
    description: 'Initiate a field safety corrective action or recall based on post-market signal analysis; publicly and commercially irreversible.',
    irreversible: true,
  }),
  Object.freeze({
    actionId: 'medical-device-tplc.post-market-report-filing',
    expert: 'regulatory-affairs-lead',
    description: 'File a vigilance/MDR adverse-event report or periodic safety update to the competent authority.',
    irreversible: true,
  }),
]);

/**
 * The 14 sibling point processes this flagship composes BY NAME. They are named in agent
 * prompts and asserted into kip; they are NEVER imported and their process() functions are
 * NEVER called.
 */
export const COMPOSED_PROCESSES = Object.freeze([
  'design-control-process',
  'risk-management-iso14971',
  'biological-evaluation-iso10993',
  'sterilization-validation',
  'sterile-barrier-validation',
  'human-factors-engineering',
  'software-lifecycle-iec62304',
  'software-verification-validation',
  'verification-validation-planning',
  'clinical-study-design',
  'clinical-evaluation-report',
  '510k-submission',
  'eu-mdr-technical-documentation',
  'post-market-surveillance',
]);

/**
 * Pathway lookup. THROWS on an unknown pathway — there is deliberately no default pathway
 * and no generic dossier path.
 *
 * @param {string} pathway - '510k' | 'eu-mdr'
 * @returns {{label: string, ingredientProcess: string, authority: string}} The pathway spec
 */
export function pathwaySpec(pathway) {
  const spec = SUBMISSION_PATHWAYS[pathway];
  if (!spec) {
    throw new Error(
      `SUBMISSION_PATHWAYS: unknown regulatoryPathway '${pathway}'. ` +
      `Known pathways: ${Object.keys(SUBMISSION_PATHWAYS).join(', ')} — no default pathway exists.`
    );
  }
  return spec;
}

/**
 * Policy-gated action lookup. THROWS on an unknown actionId so every routedBreakpoint call
 * site reads its expert from one table instead of hard-coding a role string twice.
 *
 * @param {string} actionId - One of the five declared policy-gated action ids
 * @returns {{actionId: string, expert: string, description: string, irreversible: boolean}} The declared action
 */
export function policyAction(actionId) {
  const action = POLICY_GATED_ACTIONS.find((a) => a.actionId === actionId);
  if (!action) {
    throw new Error(
      `POLICY_GATED_ACTIONS: unknown actionId '${actionId}'. ` +
      `Known actions: ${POLICY_GATED_ACTIONS.map((a) => a.actionId).join(', ')} — no fallback action exists.`
    );
  }
  return action;
}

/**
 * Severity assertion. THROWS on anything outside the frozen SIGNAL_SEVERITIES list — an
 * invented severity is a protocol error, never coerced into the nearest known value.
 *
 * @param {string} severity - The signal severity reported by the analyst
 * @param {string} signalId - The signal id, for the error message
 * @returns {string} The validated severity
 */
export function assertSignalSeverity(severity, signalId) {
  if (!SIGNAL_SEVERITIES.includes(severity)) {
    throw new Error(
      `Signal '${signalId}' carries unknown severity '${severity}'. ` +
      `Known severities: ${SIGNAL_SEVERITIES.join(', ')} — no default severity is applied.`
    );
  }
  return severity;
}

/**
 * Is the policy-gated action raisable at this severity? Explicit predicate so the process
 * can skip a never-raised cell WITHOUT triggering routingExpert's throw; the throw then
 * only fires on genuine orchestrator bugs. THROWS on unknown action/severity.
 *
 * @param {string} actionId - 'medical-device-tplc.field-action' | 'medical-device-tplc.post-market-report-filing'
 * @param {string} severity - One of SIGNAL_SEVERITIES
 * @returns {boolean} true when the action has an expert route at that severity
 */
export function isRaisable(actionId, severity) {
  const row = SIGNAL_SEVERITY_ROUTING[actionId];
  if (!row) {
    throw new Error(
      `SIGNAL_SEVERITY_ROUTING: unknown policy-gated action '${actionId}'. ` +
      `Known actions: ${Object.keys(SIGNAL_SEVERITY_ROUTING).join(', ')} — no fallback route exists.`
    );
  }
  if (!Object.prototype.hasOwnProperty.call(row, severity)) {
    throw new Error(
      `SIGNAL_SEVERITY_ROUTING: unknown severity '${severity}' for action '${actionId}'. ` +
      `Known severities: ${SIGNAL_SEVERITIES.join(', ')} — no fallback route exists.`
    );
  }
  return row[severity] !== null;
}

/**
 * Severity routing lookup. THROWS on unknown action, unknown severity, AND on a null cell
 * (the action is never raised at that severity — asking for its expert is an orchestrator
 * bug). There is deliberately no default expert.
 *
 * @param {string} actionId - 'medical-device-tplc.field-action' | 'medical-device-tplc.post-market-report-filing'
 * @param {string} severity - One of SIGNAL_SEVERITIES
 * @returns {string} The expert route for the gate
 */
export function routingExpert(actionId, severity) {
  if (!isRaisable(actionId, severity)) {
    throw new Error(
      `SIGNAL_SEVERITY_ROUTING: action '${actionId}' is never raised at severity '${severity}' — ` +
      'looking up its expert is an orchestrator bug (no fallback expert exists).'
    );
  }
  return SIGNAL_SEVERITY_ROUTING[actionId][severity];
}

/**
 * Required-input assertion. Optional inputs get defaults; required inputs THROW.
 *
 * @param {string} name - The input name
 * @param {*} value - The supplied value
 * @returns {*} The value, when present
 */
function requireInput(name, value) {
  if (value === undefined || value === null || value === '') {
    throw new Error(
      `medical-device-tplc-workflow requires '${name}' (got ${JSON.stringify(value)}) — ` +
      'there is no default and no degraded path.'
    );
  }
  return value;
}

/**
 * Deterministic device slug for artifact paths, baseline ids and kip subjects.
 *
 * @param {string} deviceName - The device name
 * @returns {string} kebab-case slug
 */
function deviceSlugOf(deviceName) {
  return String(deviceName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ---------------------------------------------------------------------------
// P1 — design-control intake
// ---------------------------------------------------------------------------

export const intakeDesignControlPlanTask = defineTask('mdt.intake-design-control-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design-control intake and plan: ${args.deviceName}`,
  agent: {
    name: 'design-control-planner',
    prompt: {
      role: 'Medical device design-assurance engineer (FDA 21 CFR 820.30 / ISO 13485 clause 7.3)',
      task: `Interview the device brief and produce the design-control plan, user needs, design inputs and the empty Design History File skeleton for ${args.deviceName}`,
      context: args,
      instructions: [
        'Compose BY NAME, do not import: follow the procedure of the sibling library process design-control-process.js (@process specializations/domains/science/biomedical-engineering/design-control-process) — read that file in the repo and execute its user-needs / design-input / design-output / DHF-index steps against this device. Never import its module and never call its process() function.',
        `Write the plan to ${args.artifactsDir}/design-control/design-control-plan.json and the DHF index skeleton to ${args.artifactsDir}/dhf/dhf-index.json; report both paths.`,
        'Each design input MUST carry a stable requirement id (DI-###), the user need it satisfies, and an acceptance criterion that is objectively verifiable — inputs without a verifiable criterion are defects, not to be softened.',
        'Honor every recalled kip insight in context.priorKnowledge or justify the divergence explicitly in rationale; never silently ignore prior facts.',
        'Do not perform verification work here and do not invent regulatory conclusions.',
      ],
      outputFormat: 'JSON with planPath, dhfIndexPath, userNeeds[], designInputs[{id,userNeed,acceptanceCriterion}], designOutputs[], regulatoryPathway, deviceClassRationale, openQuestions[], evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['planPath', 'dhfIndexPath', 'designInputs', 'evidence'],
      properties: {
        planPath: { type: 'string' },
        dhfIndexPath: { type: 'string' },
        userNeeds: { type: 'array' },
        designInputs: {
          type: 'array',
          items: { type: 'object', required: ['id', 'acceptanceCriterion'] },
        },
        designOutputs: { type: 'array' },
        regulatoryPathway: { type: 'string' },
        deviceClassRationale: { type: 'string' },
        openQuestions: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'design-control'],
}));

// ---------------------------------------------------------------------------
// P2 — ISO 14971 risk management
// ---------------------------------------------------------------------------

export const riskManagementFileTask = defineTask('mdt.risk-management-file', (args, taskCtx) => ({
  kind: 'agent',
  title: `ISO 14971 risk management file: ${args.deviceName}`,
  agent: {
    name: 'risk-management-engineer',
    prompt: {
      role: 'ISO 14971 risk manager for medical devices',
      task: `Produce the risk management plan, hazard analysis, risk controls and residual-risk evaluation for ${args.deviceName}, traced to the design inputs`,
      context: args,
      instructions: [
        'Compose BY NAME, do not import: follow the procedure of the sibling library process risk-management-iso14971.js — read it in the repo and execute its hazard-identification, risk-estimation, risk-evaluation, risk-control and residual-risk steps. Do not import the module.',
        'Every hazard MUST trace to at least one design input id from context.designInputs, and every risk control MUST produce a verification obligation id (RC-###) that phase P5 verifies — an untraceable control is a defect.',
        `Write the risk management file to ${args.artifactsDir}/risk/risk-management-file.json and the hazard/control traceability table to ${args.artifactsDir}/risk/risk-traceability.json; report both paths.`,
        'Report benefitRiskConclusion explicitly; if the residual risk is not acceptable, say so — never downgrade a hazard to make the phase pass.',
      ],
      outputFormat: 'JSON with riskFilePath, traceabilityPath, hazards[{id,designInputIds,severity,probability,riskLevel}], riskControls[{id,hazardId,verificationObligationId}], residualRisks[], benefitRiskConclusion, evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['riskFilePath', 'traceabilityPath', 'hazards', 'riskControls', 'evidence'],
      properties: {
        riskFilePath: { type: 'string' },
        traceabilityPath: { type: 'string' },
        hazards: {
          type: 'array',
          items: { type: 'object', required: ['id', 'designInputIds'] },
        },
        riskControls: {
          type: 'array',
          items: { type: 'object', required: ['id', 'verificationObligationId'] },
        },
        residualRisks: { type: 'array' },
        benefitRiskConclusion: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'risk-management'],
}));

// ---------------------------------------------------------------------------
// P3 — parallel design characterization (four independent legs)
// ---------------------------------------------------------------------------

export const biologicalEvaluationTask = defineTask('mdt.biological-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Biological evaluation (ISO 10993): ${args.deviceName}`,
  agent: {
    name: 'biocompatibility-engineer',
    prompt: {
      role: 'ISO 10993 biological-evaluation lead',
      task: `Produce the biological evaluation plan and report for ${args.deviceName} from its materials and body-contact profile`,
      context: args,
      instructions: [
        'Compose BY NAME, do not import: follow biological-evaluation-iso10993.js (and consult extractables-leachables.js for chemical characterization endpoints) as sibling library processes read from the repo; never import them.',
        'Derive the ISO 10993-1 endpoint matrix from the contact type and duration in context.designInputs — do not copy a generic endpoint list.',
        `Write the biological evaluation report to ${args.artifactsDir}/characterization/biological-evaluation.json and report its path.`,
        'Each endpoint MUST resolve to one of: existing-data-justification, chemical-characterization, or planned-test — an endpoint left unresolved is an open gap you must report, not hide.',
      ],
      outputFormat: 'JSON with reportPath, endpointMatrix[{endpoint,resolution,justification}], openGaps[], evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'endpointMatrix', 'evidence'],
      properties: {
        reportPath: { type: 'string' },
        endpointMatrix: {
          type: 'array',
          items: { type: 'object', required: ['endpoint', 'resolution'] },
        },
        openGaps: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'characterization', 'biological-evaluation'],
}));

export const sterilizationBarrierValidationTask = defineTask('mdt.sterilization-barrier-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sterilization and sterile-barrier validation: ${args.deviceName}`,
  agent: {
    name: 'sterilization-validation-engineer',
    prompt: {
      role: 'Sterilization and packaging validation engineer (ISO 11135/11137, ISO 11607)',
      task: `Produce the sterilization validation strategy and the sterile-barrier-system validation plan for ${args.deviceName}`,
      context: args,
      instructions: [
        'Compose BY NAME, do not import: follow sterilization-validation.js and sterile-barrier-validation.js as sibling library processes read from the repo; never import them.',
        'Select the sterilization modality from the device materials and justify it against the biological-evaluation constraints in context; state the SAL target and the validation method (overkill/bioburden-based).',
        'Cover shelf-life/aging and distribution simulation for the sterile barrier system explicitly.',
        `Write the combined report to ${args.artifactsDir}/characterization/sterilization-barrier.json and report its path.`,
      ],
      outputFormat: 'JSON with reportPath, modality, salTarget, validationApproach, barrierTests[], shelfLifeStrategy, openGaps[], evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'modality', 'validationApproach', 'evidence'],
      properties: {
        reportPath: { type: 'string' },
        modality: { type: 'string' },
        salTarget: { type: 'string' },
        validationApproach: { type: 'string' },
        barrierTests: { type: 'array' },
        shelfLifeStrategy: { type: 'string' },
        openGaps: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'characterization', 'sterilization'],
}));

export const humanFactorsTask = defineTask('mdt.human-factors', (args, taskCtx) => ({
  kind: 'agent',
  title: `Human factors engineering (IEC 62366): ${args.deviceName}`,
  agent: {
    name: 'human-factors-engineer',
    prompt: {
      role: 'Usability engineering lead (IEC 62366-1, FDA HFE guidance)',
      task: `Produce the use-related risk analysis, critical-task list and summative-validation plan for ${args.deviceName}`,
      context: args,
      instructions: [
        'Compose BY NAME, do not import: follow human-factors-engineering.js as a sibling library process read from the repo; never import it.',
        'Derive critical tasks from the use-related hazards in context.riskManagement.hazards — every use-related hazard MUST map to at least one critical task, and every critical task MUST appear in the summative validation plan.',
        `Write the HFE report to ${args.artifactsDir}/characterization/human-factors.json and report its path.`,
        'Report unmappedHazards explicitly rather than quietly dropping them.',
      ],
      outputFormat: 'JSON with reportPath, useRelatedRisks[], criticalTasks[{id,hazardIds}], summativePlan{}, unmappedHazards[], evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'criticalTasks', 'summativePlan', 'evidence'],
      properties: {
        reportPath: { type: 'string' },
        useRelatedRisks: { type: 'array' },
        criticalTasks: {
          type: 'array',
          items: { type: 'object', required: ['id', 'hazardIds'] },
        },
        summativePlan: { type: 'object' },
        unmappedHazards: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'characterization', 'human-factors'],
}));

export const softwareLifecycleTask = defineTask('mdt.software-lifecycle', (args, taskCtx) => ({
  kind: 'agent',
  title: `IEC 62304 software lifecycle: ${args.deviceName}`,
  agent: {
    name: 'medical-software-engineer',
    prompt: {
      role: 'IEC 62304 medical device software lifecycle lead',
      task: `Produce the software safety classification, software development plan and SOUP inventory for ${args.deviceName}`,
      context: args,
      instructions: [
        'Compose BY NAME, do not import: follow software-lifecycle-iec62304.js as a sibling library process read from the repo; never import it.',
        'Assign the IEC 62304 software safety class (A/B/C) from the software-related hazards in context.riskManagement.hazards and justify it with the specific hazard ids — an unjustified class is a defect.',
        'Produce the SOUP inventory with the anomaly-list obligation per item, and the software requirements traced to design input ids.',
        `Write the software plan to ${args.artifactsDir}/characterization/software-lifecycle.json and report its path.`,
        'This task runs ONLY when the device contains software; the process skips this leg (recording skipped:true in the characterization index) when inputs.hasSoftware is false. Never fabricate a software plan for a device without software.',
      ],
      outputFormat: 'JSON with reportPath, safetyClass, safetyClassRationale, softwareRequirements[], soupInventory[], evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'safetyClass', 'softwareRequirements', 'evidence'],
      properties: {
        reportPath: { type: 'string' },
        safetyClass: { type: 'string' },
        safetyClassRationale: { type: 'string' },
        softwareRequirements: { type: 'array' },
        soupInventory: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'characterization', 'software-lifecycle'],
}));

// ---------------------------------------------------------------------------
// P4 — DESIGN FREEZE executor (guarded by medical-device-tplc.design-freeze)
// ---------------------------------------------------------------------------

export const designFreezeBaselineTask = defineTask('mdt.design-freeze-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Freeze design baseline: ${args.deviceName} (${args.baselineId})`,
  agent: {
    name: 'configuration-manager',
    prompt: {
      role: 'Design configuration manager',
      task: `COMPUTE and WRITE the frozen design baseline manifest for ${args.baselineId} — do not narrate`,
      context: args,
      instructions: [
        'This task is the executor of the approved policy-gated action medical-device-tplc.design-freeze. It is only ever scheduled after the routed breakpoint returned approved === true; it must never re-decide the freeze.',
        `Enumerate every design input id, design output artifact path, risk control id and characterization report path from the context and write ${args.artifactsDir}/baseline/${args.baselineId}.json as {baselineId, frozenAt, designInputIds[], designOutputPaths[], riskControlIds[], characterizationPaths[], approval{breakpointId,respondedBy,autoApproved}}.`,
        'Record the authorization provenance verbatim from context.authorization {breakpointId, respondedBy, autoApproved, approvedAt} into the approval block of the written baseline — including autoApproved, which is never omitted or normalized away.',
        'Compute a content digest (sha256 over the sorted artifact path list plus their byte sizes) and record it as baselineDigest — downstream V&V evidence is only valid against this digest.',
        'Report the exact counts you wrote. Evidence must cite the executed enumeration and the written file, not intentions.',
      ],
      outputFormat: 'JSON with baselinePath, baselineId, baselineDigest, frozenInputCount, frozenArtifactCount, evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['baselinePath', 'baselineId', 'baselineDigest', 'frozenInputCount', 'evidence'],
      properties: {
        baselinePath: { type: 'string' },
        baselineId: { type: 'string' },
        baselineDigest: { type: 'string' },
        frozenInputCount: { type: 'number' },
        frozenArtifactCount: { type: 'number' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'design-freeze', 'policy-executor'],
}));

// ---------------------------------------------------------------------------
// P5 — verification and validation over the frozen baseline
// ---------------------------------------------------------------------------

export const vvPlanningTask = defineTask('mdt.vv-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `V&V planning against baseline ${args.baselineId}`,
  agent: {
    name: 'vv-planner',
    prompt: {
      role: 'Design verification and validation planner',
      task: `Decompose the frozen baseline into executable verification and validation protocols for ${args.deviceName}`,
      context: args,
      instructions: [
        'Compose BY NAME, do not import: follow verification-validation-planning.js as a sibling library process read from the repo; never import it.',
        'Every protocol MUST carry: id (kebab-case, unique — it is interpolated into per-protocol report paths and label ids), type (verification|validation), coversDesignInputIds[], coversRiskControlIds[], acceptanceCriteria[], method, and parallelSafe (boolean).',
        'Coverage is mandatory: every design input id and every risk control id in the frozen baseline MUST be covered by at least one protocol. Report uncoveredDesignInputIds and uncoveredRiskControlIds — the process FAILS the phase on a non-empty list, so do not pad coverage with protocols you cannot execute.',
        'Record baselineDigest verbatim from context so protocol results can be bound to the frozen baseline.',
        `Write the V&V plan to ${args.artifactsDir}/vv/vv-plan.json and report its path.`,
      ],
      outputFormat: 'JSON with planPath, baselineDigest, protocols[{id,type,coversDesignInputIds,coversRiskControlIds,acceptanceCriteria,method,parallelSafe}], uncoveredDesignInputIds[], uncoveredRiskControlIds[], evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['planPath', 'baselineDigest', 'protocols', 'uncoveredDesignInputIds', 'uncoveredRiskControlIds', 'evidence'],
      properties: {
        planPath: { type: 'string' },
        baselineDigest: { type: 'string' },
        protocols: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'type', 'coversDesignInputIds', 'acceptanceCriteria', 'method'],
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              coversDesignInputIds: { type: 'array' },
              coversRiskControlIds: { type: 'array' },
              acceptanceCriteria: { type: 'array' },
              method: { type: 'string' },
              parallelSafe: { type: 'boolean' },
            },
          },
        },
        uncoveredDesignInputIds: { type: 'array' },
        uncoveredRiskControlIds: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'vv-planning'],
}));

export const vvProtocolExecutionTask = defineTask('mdt.vv-protocol-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute V&V protocol: ${args.protocol.id}`,
  agent: {
    name: 'vv-engineer',
    prompt: {
      role: 'Verification and validation test engineer',
      task: `EXECUTE protocol ${args.protocol.id} against the frozen baseline and record the objective evidence`,
      context: args,
      instructions: [
        'Compose BY NAME, do not import: follow verification-validation-planning.js for protocol execution/report structure, and for software protocols additionally follow software-verification-validation.js; never import either module.',
        'Execute the protocol — run the described checks/analyses against the repository artifacts and record actual measured or observed results per acceptance criterion. A narrated result with no executed check is a protocol failure, not a pass.',
        `Write the protocol report to ${args.artifactsDir}/vv/protocols/${args.protocol.id}.json including {protocolId, baselineDigest, criteria[{criterion, expected, actual, passed}], deviations[], passed}.`,
        'Bind the report to context.baselineDigest verbatim; if the supplied digest does not match the frozen baseline you were given, report passed:false with a digest-mismatch deviation — do not proceed on a stale baseline.',
        'Evidence must cite the executed checks (commands run and their output, or artifact file:line references), never the plan text.',
      ],
      outputFormat: 'JSON with protocolId, reportPath, passed, criteria[], deviations[], baselineDigest, evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['protocolId', 'reportPath', 'passed', 'criteria', 'baselineDigest', 'evidence'],
      properties: {
        protocolId: { type: 'string' },
        reportPath: { type: 'string' },
        passed: { type: 'boolean' },
        criteria: { type: 'array' },
        deviations: { type: 'array' },
        baselineDigest: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'vv-execution'],
}));

export const vvSummaryTask = defineTask('mdt.vv-summary', (args, taskCtx) => ({
  kind: 'agent',
  title: `V&V summary report: ${args.deviceName}`,
  agent: {
    name: 'vv-reporter',
    prompt: {
      role: 'V&V summary author',
      task: 'COMPUTE the V&V coverage roll-up from the executed protocol reports — do not narrate',
      context: args,
      instructions: [
        'Read every protocol report path listed in context.protocolReportPaths from disk and compute: passedCount, failedCount, the set of design input ids and risk control ids with at least one PASSED protocol, and the residual uncovered sets.',
        `Write the roll-up to ${args.artifactsDir}/vv/vv-summary.json and report its path plus the exact counts.`,
        'Any protocol report whose baselineDigest differs from context.baselineDigest is counted as a digest mismatch and listed in staleReports — never averaged away.',
        'Evidence must cite the files you actually opened (path plus the fields read), not the plan.',
      ],
      outputFormat: 'JSON with summaryPath, passedCount, failedCount, coveredDesignInputIds[], coveredRiskControlIds[], uncoveredDesignInputIds[], uncoveredRiskControlIds[], staleReports[], evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['summaryPath', 'passedCount', 'failedCount', 'uncoveredDesignInputIds', 'uncoveredRiskControlIds', 'evidence'],
      properties: {
        summaryPath: { type: 'string' },
        passedCount: { type: 'number' },
        failedCount: { type: 'number' },
        coveredDesignInputIds: { type: 'array' },
        coveredRiskControlIds: { type: 'array' },
        uncoveredDesignInputIds: { type: 'array' },
        uncoveredRiskControlIds: { type: 'array' },
        staleReports: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'vv-summary'],
}));

// ---------------------------------------------------------------------------
// P6 — clinical evaluation (design, guarded conduct, CER)
// ---------------------------------------------------------------------------

export const clinicalStudyDesignTask = defineTask('mdt.clinical-study-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Clinical investigation design: ${args.deviceName}`,
  agent: {
    name: 'clinical-study-designer',
    prompt: {
      role: 'Clinical investigation designer (ISO 14155, FDA IDE)',
      task: `Produce the clinical investigation plan for ${args.deviceName} including endpoints, sample size and the ethics/regulatory prerequisite list`,
      context: args,
      instructions: [
        'Compose BY NAME, do not import: follow clinical-study-design.js as a sibling library process read from the repo; never import it.',
        'Ground the primary/secondary endpoints in the intended use and the residual risks from the risk management file; state the statistical justification for the sample size.',
        'Enumerate the enrollment prerequisites explicitly as prerequisites[{id, description, satisfied:boolean, evidence}] — IRB/ethics-committee approval, IDE/competent-authority authorization, investigator brochure, informed-consent form, and the completed benefit-risk determination.',
        'A prerequisite you cannot confirm is satisfied:false with the reason. Never mark a prerequisite satisfied on assumption — the enrollment authorization gate reads this list.',
        `Write the plan to ${args.artifactsDir}/clinical/clinical-investigation-plan.json and report its path.`,
      ],
      outputFormat: 'JSON with planPath, design, endpoints[], sampleSize, statisticalJustification, prerequisites[{id,description,satisfied,evidence}], evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['planPath', 'endpoints', 'prerequisites', 'evidence'],
      properties: {
        planPath: { type: 'string' },
        design: { type: 'string' },
        endpoints: { type: 'array' },
        sampleSize: { type: 'number' },
        statisticalJustification: { type: 'string' },
        prerequisites: {
          type: 'array',
          items: { type: 'object', required: ['id', 'description', 'satisfied'] },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'clinical-design'],
}));

export const clinicalInvestigationConductTask = defineTask('mdt.clinical-investigation-conduct', (args, taskCtx) => ({
  kind: 'agent',
  title: `Conduct clinical investigation: ${args.deviceName}`,
  agent: {
    name: 'clinical-operations-lead',
    prompt: {
      role: 'Clinical operations lead',
      task: 'Open enrollment for the authorized clinical investigation and record the conduct log and safety events',
      context: args,
      instructions: [
        'This task is the executor of the approved policy-gated action medical-device-tplc.clinical-study-start. It is only ever scheduled after the routed breakpoint returned approved === true and every prerequisite was satisfied. It must never re-decide enrollment.',
        'Record the authorization provenance verbatim from context.authorization {breakpointId, respondedBy, autoApproved, approvedAt} into the conduct log — autoApproved is copied as-is, never omitted.',
        `Write the conduct log to ${args.artifactsDir}/clinical/conduct-log.json with {authorization, sitesActivated, enrolled, deviations[], safetyEvents[{id,seriousness,deviceRelated,reportable}]}.`,
        'Report reportable safety events explicitly — they feed the vigilance-reporting gate. Never downgrade seriousness to avoid a filing.',
      ],
      outputFormat: 'JSON with conductLogPath, enrolled, sitesActivated, deviations[], safetyEvents[], evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['conductLogPath', 'enrolled', 'safetyEvents', 'evidence'],
      properties: {
        conductLogPath: { type: 'string' },
        enrolled: { type: 'number' },
        sitesActivated: { type: 'array' },
        deviations: { type: 'array' },
        safetyEvents: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'clinical-conduct', 'policy-executor'],
}));

export const clinicalEvaluationReportTask = defineTask('mdt.clinical-evaluation-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Clinical evaluation report: ${args.deviceName}`,
  agent: {
    name: 'clinical-evaluation-author',
    prompt: {
      role: 'Clinical evaluation report author (MEDDEV 2.7/1 rev4, MDR Annex XIV)',
      task: `Author the clinical evaluation report for ${args.deviceName} from the literature appraisal and the clinical investigation data`,
      context: args,
      instructions: [
        'Compose BY NAME, do not import: follow clinical-evaluation-report.js as a sibling library process read from the repo; never import it.',
        'State the clinical evidence sources used (literature, equivalence, own investigation) and appraise each; an equivalence claim MUST name the equivalent device and the technical/biological/clinical equivalence basis.',
        'Conclude with a benefit-risk determination that references the residual risks from the risk management file by hazard id.',
        'Where the clinical investigation was not authorized, the report MUST state clinicalInvestigationConducted:false and carry the resulting evidence gap — never substitute literature for an unconducted study without declaring the gap.',
        `Write the CER to ${args.artifactsDir}/clinical/clinical-evaluation-report.json and report its path.`,
      ],
      outputFormat: 'JSON with cerPath, evidenceSources[], clinicalInvestigationConducted, benefitRiskConclusion, evidenceGaps[], pmcfObligations[], evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['cerPath', 'evidenceSources', 'benefitRiskConclusion', 'evidence'],
      properties: {
        cerPath: { type: 'string' },
        evidenceSources: { type: 'array' },
        clinicalInvestigationConducted: { type: 'boolean' },
        benefitRiskConclusion: { type: 'string' },
        evidenceGaps: { type: 'array' },
        pmcfObligations: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'clinical-evaluation'],
}));

// ---------------------------------------------------------------------------
// P7 — Design History File assembly
// ---------------------------------------------------------------------------

export const designHistoryFileAssemblyTask = defineTask('mdt.design-history-file-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assemble Design History File: ${args.deviceName}`,
  agent: {
    name: 'dhf-assembler',
    prompt: {
      role: 'Design History File custodian (21 CFR 820.30(j))',
      task: 'COMPUTE and WRITE the Design History File index and the phase evidence index — do not narrate',
      context: args,
      instructions: [
        'Compose BY NAME, do not import: follow design-control-process.js for the DHF section taxonomy; never import it.',
        'Enumerate every artifact produced in phases P1-P6 from the context paths, verify each file EXISTS on disk, and record {section, path, exists, bytes, phase} — a missing artifact is recorded exists:false and listed in missingArtifacts, never omitted or substituted.',
        `Write ${args.artifactsDir}/dhf/design-history-file.json (the DHF index) and ${args.artifactsDir}/dhf/evidence-index.json (per-phase evidence index keyed by phase id).`,
        `Compute completenessByCategory over the required DHF sections supplied in context.requiredSections: ${(args.requiredSections ?? []).join(', ')}.`,
        'Evidence must cite the executed existence checks (path plus size), not the assembly intent.',
      ],
      outputFormat: 'JSON with dhfPath, evidenceIndexPath, sections[{section,path,exists,bytes,phase}], missingArtifacts[], completenessByCategory{}, evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['dhfPath', 'evidenceIndexPath', 'sections', 'missingArtifacts', 'completenessByCategory', 'evidence'],
      properties: {
        dhfPath: { type: 'string' },
        evidenceIndexPath: { type: 'string' },
        sections: {
          type: 'array',
          items: { type: 'object', required: ['section', 'path', 'exists'] },
        },
        missingArtifacts: { type: 'array' },
        completenessByCategory: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'dhf'],
}));

// ---------------------------------------------------------------------------
// P8 — regulatory submission (assembly, guarded transmission, bounded rounds)
// ---------------------------------------------------------------------------

export const submissionDossierAssemblyTask = defineTask('mdt.submission-dossier-assembly', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assemble ${args.pathwayLabel} dossier: ${args.deviceName}`,
  agent: {
    name: 'regulatory-dossier-author',
    prompt: {
      role: 'Regulatory affairs dossier author',
      task: `Assemble the ${args.pathwayLabel} submission dossier for ${args.deviceName} from the Design History File`,
      context: args,
      instructions: [
        `Compose BY NAME, do not import: follow the sibling library process named in context.ingredientProcess (${args.ingredientProcess}) — 510k-submission.js for the 510k pathway, eu-mdr-technical-documentation.js for the eu-mdr pathway. Read that file from the repo and execute its section structure; never import it.`,
        'For 510k: build the substantial-equivalence argument against the named predicate devices with a comparison table; a missing predicate artifact is a hard failure you must report as blockers, never a generic-predicate substitution.',
        'For eu-mdr: build the Annex II/III technical documentation structure including GSPR checklist status per requirement.',
        'Every dossier section MUST reference a DHF artifact path from context.dhf.sections — a section with no backing artifact is listed in unbackedSections and is a blocker.',
        `Write the dossier manifest to ${args.artifactsDir}/submission/dossier-manifest.json with {pathway, sections[{id,title,artifactPaths,complete}], unbackedSections[], blockers[]} and report its path.`,
      ],
      outputFormat: 'JSON with manifestPath, pathway, sections[], unbackedSections[], blockers[], seArgument (510k) or gsprChecklist (eu-mdr), evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['manifestPath', 'pathway', 'sections', 'unbackedSections', 'blockers', 'evidence'],
      properties: {
        manifestPath: { type: 'string' },
        pathway: { type: 'string' },
        sections: { type: 'array' },
        unbackedSections: { type: 'array' },
        blockers: { type: 'array' },
        seArgument: { type: 'object' },
        gsprChecklist: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'submission', 'dossier'],
}));

export const submissionTransmitTask = defineTask('mdt.submission-transmit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Transmit ${args.pathwayLabel} submission: ${args.deviceName}`,
  agent: {
    name: 'regulatory-submission-agent',
    prompt: {
      role: 'Regulatory submission transmitter',
      task: `Record the authorized transmission of the ${args.pathwayLabel} dossier and open the statutory clock`,
      context: args,
      instructions: [
        'This task is the executor of the approved policy-gated action medical-device-tplc.regulatory-submission. It is only ever scheduled after the routed breakpoint returned approved === true. It must never re-decide transmission and must never transmit a dossier with blockers.',
        'Record the authorization provenance verbatim from context.authorization {breakpointId, respondedBy, autoApproved, approvedAt} — autoApproved is written into the transmission record as-is.',
        `Write the transmission record to ${args.artifactsDir}/submission/transmission-record.json with {pathway, manifestPath, dossierDigest, transmittedAt, authorization, statutoryClockStart, submissionReference} and report its path.`,
        'The submitted record is permanent: report exactly what was transmitted, with the dossier digest computed over the manifest section artifact list.',
      ],
      outputFormat: 'JSON with transmissionRecordPath, submissionReference, dossierDigest, statutoryClockStart, evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['transmissionRecordPath', 'submissionReference', 'dossierDigest', 'evidence'],
      properties: {
        transmissionRecordPath: { type: 'string' },
        submissionReference: { type: 'string' },
        dossierDigest: { type: 'string' },
        statutoryClockStart: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'submission', 'policy-executor'],
}));

export const deficiencyResponseTask = defineTask('mdt.deficiency-response', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deficiency response round ${args.round}: ${args.submissionReference}`,
  agent: {
    name: 'regulatory-deficiency-responder',
    prompt: {
      role: 'Regulatory affairs deficiency-response author',
      task: `Ingest the reviewer deficiency letter for round ${args.round} and produce the response package`,
      context: args,
      instructions: [
        `This is round ${args.round} of at most ${args.maxRounds} bounded deficiency rounds — the loop never silently adds rounds.`,
        'Ingest the reviewer/notified-body questions for this round from context.deficiencyInputPath. If no deficiency artifact exists yet, report settled:false with pendingExternal:true and an empty deficiencies array — an honest pending state, never an invented deficiency letter and never an assumed clearance.',
        'For each deficiency produce {id, question, responseSummary, supportingArtifactPaths[], requiresNewEvidence:boolean}.',
        'A deficiency requiring new V&V or clinical evidence MUST set requiresNewEvidence:true and name the missing evidence — do not answer it with argument alone.',
        `Write the response package to ${args.artifactsDir}/submission/deficiency-round-${args.round}.json and report its path.`,
        'Report settled:true only when every deficiency in this round has a complete response and the reviewer position recorded in the artifact is accepted/cleared.',
      ],
      outputFormat: 'JSON with responsePath, round, deficiencies[], settled, pendingExternal, requiresNewEvidenceIds[], evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['responsePath', 'round', 'deficiencies', 'settled', 'evidence'],
      properties: {
        responsePath: { type: 'string' },
        round: { type: 'number' },
        deficiencies: { type: 'array' },
        settled: { type: 'boolean' },
        pendingExternal: { type: 'boolean' },
        requiresNewEvidenceIds: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'submission', 'deficiency-round'],
}));

// ---------------------------------------------------------------------------
// P9 — post-market surveillance, signal analysis, CAPA, guarded actions
// ---------------------------------------------------------------------------

export const pmsPlanTask = defineTask('mdt.pms-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Post-market surveillance plan: ${args.deviceName}`,
  agent: {
    name: 'pms-lead',
    prompt: {
      role: 'Post-market surveillance lead (EU MDR Art.83-86, FDA 21 CFR 803/806)',
      task: `Produce the post-market surveillance plan and the signal-detection thresholds for ${args.deviceName}`,
      context: args,
      instructions: [
        'Compose BY NAME, do not import: follow post-market-surveillance.js as a sibling library process read from the repo; never import it.',
        'Define the data sources (complaints, vigilance databases, registries, PMCF), the PSUR/periodic-reporting cadence per market, and the PMCF obligations carried over from the clinical evaluation report.',
        'Define quantitative signal thresholds per monitored endpoint — a threshold stated only in prose is not a threshold.',
        `Write the plan to ${args.artifactsDir}/post-market/pms-plan.json and report its path.`,
      ],
      outputFormat: 'JSON with planPath, dataSources[], reportingCadence{}, signalThresholds[{endpoint,metric,threshold}], pmcfObligations[], evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['planPath', 'dataSources', 'signalThresholds', 'evidence'],
      properties: {
        planPath: { type: 'string' },
        dataSources: { type: 'array' },
        reportingCadence: { type: 'object' },
        signalThresholds: {
          type: 'array',
          items: { type: 'object', required: ['endpoint', 'threshold'] },
        },
        pmcfObligations: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'post-market'],
}));

export const signalAnalysisTask = defineTask('mdt.signal-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Post-market signal analysis: ${args.deviceName}`,
  agent: {
    name: 'signal-analyst',
    prompt: {
      role: 'Post-market signal analyst',
      task: 'COMPUTE the signal analysis over the post-market complaint/vigilance dataset — do not narrate',
      context: args,
      instructions: [
        `Read the dataset at context.signalDataPath (${args.signalDataPath}) from disk and compute, per monitored endpoint, the observed rate against the plan threshold; enumerate the records that drove each exceedance by record id.`,
        `Classify each detected signal with a severity drawn EXACTLY from the frozen set SIGNAL_SEVERITIES in the process module: ${SIGNAL_SEVERITIES.join(' | ')}. Any other value is a protocol error — the process lookup throws on unknown severities, so do not invent one.`,
        'Assess reportability per market against the vigilance criteria (serious incident / death or serious deterioration / field safety corrective action) and set reportable:true|false with the criterion cited.',
        `Write the analysis to ${args.artifactsDir}/post-market/signal-analysis.json and report its path plus the exact counts.`,
        'Evidence must cite the executed computation (records counted, rates computed) and the written file, not an impression of the data.',
      ],
      outputFormat: 'JSON with analysisPath, signals[{id,endpoint,observedRate,threshold,exceeded,severity,reportable,drivingRecordIds}], recordsAnalyzed, highestSeverity, reportableCount, evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['analysisPath', 'signals', 'recordsAnalyzed', 'highestSeverity', 'evidence'],
      properties: {
        analysisPath: { type: 'string' },
        signals: {
          type: 'array',
          items: { type: 'object', required: ['id', 'severity', 'exceeded'] },
        },
        recordsAnalyzed: { type: 'number' },
        highestSeverity: { type: 'string' },
        reportableCount: { type: 'number' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'post-market', 'signal-analysis'],
}));

export const capaInvestigationTask = defineTask('mdt.capa-investigation', (args, taskCtx) => ({
  kind: 'agent',
  title: `CAPA investigation: ${args.signalId} (${args.severity})`,
  agent: {
    name: 'capa-investigator',
    prompt: {
      role: 'CAPA investigator (21 CFR 820.100)',
      task: `Investigate signal ${args.signalId} to root cause and produce the CAPA record with the health-hazard evaluation`,
      context: args,
      instructions: [
        'Perform root-cause analysis against the risk management file: name the hazard ids the signal maps to and state whether the realized risk exceeds the estimate recorded pre-market.',
        'Produce the health hazard evaluation and a recommendedAction drawn EXACTLY from the frozen set: monitor | correction | field-safety-corrective-action | recall. The severity-routing lookup in the process throws on unknown actions, so do not invent one.',
        'State fieldActionRequired:true|false with its justification, and reportabilityAssessment per market.',
        `Write the CAPA record to ${args.artifactsDir}/post-market/capa/${args.signalId}.json and report its path.`,
        'Never recommend a lesser action because a stronger one is costly — record the evaluation as the evidence supports it.',
      ],
      outputFormat: 'JSON with capaPath, signalId, rootCause, hazardIds[], riskExceedsEstimate, recommendedAction, fieldActionRequired, reportabilityAssessment[], evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['capaPath', 'signalId', 'rootCause', 'recommendedAction', 'fieldActionRequired', 'evidence'],
      properties: {
        capaPath: { type: 'string' },
        signalId: { type: 'string' },
        rootCause: { type: 'string' },
        hazardIds: { type: 'array' },
        riskExceedsEstimate: { type: 'boolean' },
        recommendedAction: { type: 'string' },
        fieldActionRequired: { type: 'boolean' },
        reportabilityAssessment: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'post-market', 'capa'],
}));

export const fieldActionExecutionTask = defineTask('mdt.field-action-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute field safety corrective action: ${args.signalId}`,
  agent: {
    name: 'field-action-coordinator',
    prompt: {
      role: 'Field safety corrective action coordinator',
      task: `Record the authorized field safety corrective action for signal ${args.signalId} and produce the customer notice and authority notification package`,
      context: args,
      instructions: [
        'This task is the executor of the approved policy-gated action medical-device-tplc.field-action. It is only ever scheduled after the routed breakpoint returned approved === true. It must never re-decide the field action.',
        'Record the authorization provenance verbatim from context.authorization {breakpointId, respondedBy, autoApproved, approvedAt} into the written package — autoApproved is copied as-is.',
        'Produce the Field Safety Notice text, the affected-lot/serial scope, the effectiveness-check plan, and the per-market authority notification list.',
        `Write the package to ${args.artifactsDir}/post-market/field-action/${args.signalId}.json and report its path. This action is publicly and commercially irreversible — record exactly what was authorized.`,
      ],
      outputFormat: 'JSON with fieldActionPath, actionType, affectedScope{}, fieldSafetyNotice, authorityNotifications[], effectivenessCheckPlan, evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['fieldActionPath', 'actionType', 'affectedScope', 'authorityNotifications', 'evidence'],
      properties: {
        fieldActionPath: { type: 'string' },
        actionType: { type: 'string' },
        affectedScope: { type: 'object' },
        fieldSafetyNotice: { type: 'string' },
        authorityNotifications: { type: 'array' },
        effectivenessCheckPlan: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'post-market', 'field-action', 'policy-executor'],
}));

export const vigilanceReportFilingTask = defineTask('mdt.vigilance-report-filing', (args, taskCtx) => ({
  kind: 'agent',
  title: `File vigilance/MDR report: ${args.signalId} (${args.market})`,
  agent: {
    name: 'vigilance-reporter',
    prompt: {
      role: 'Vigilance reporting officer',
      task: `Record the authorized vigilance/MDR filing for signal ${args.signalId} to the ${args.market} competent authority`,
      context: args,
      instructions: [
        'This task is the executor of the approved policy-gated action medical-device-tplc.post-market-report-filing. It is only ever scheduled after the routed breakpoint returned approved === true. It must never re-decide the filing.',
        'Record the authorization provenance verbatim from context.authorization {breakpointId, respondedBy, autoApproved, approvedAt} into the filing record — autoApproved is copied as-is.',
        `Produce the filing content per market template (FDA MDR eMDR / EU MIR / PSUR update as indicated by context.reportType: ${args.reportType}), the reporting deadline computed from the awareness date, and the submission reference.`,
        `Write the filing record to ${args.artifactsDir}/post-market/filings/${args.signalId}-${args.market}.json and report its path. The filed record is permanent — never file speculative content.`,
      ],
      outputFormat: 'JSON with filingPath, reportType, market, submissionReference, reportingDeadline, filedAt, evidence[]',
    },
    outputSchema: {
      type: 'object',
      required: ['filingPath', 'reportType', 'market', 'submissionReference', 'evidence'],
      properties: {
        filingPath: { type: 'string' },
        reportType: { type: 'string' },
        market: { type: 'string' },
        submissionReference: { type: 'string' },
        reportingDeadline: { type: 'string' },
        filedAt: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'mdt', 'biomedical', 'post-market', 'vigilance', 'policy-executor'],
}));

// ---------------------------------------------------------------------------
// Process — P0..P10
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    deviceName,
    intendedUse,
    deviceClass,
    regulatoryPathway,
    markets = ['US'],
    hasSoftware = true,
    predicateDevices = [],
    signalDataPath = null,
    repoRoot = '.',
    artifactsDir: artifactsDirInput,
    maxFixAttempts = 2,
    maxSubmissionRounds = 2,
    maxParallelProtocols = 3,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs || {};

  // Required inputs throw — there is no default device, use, class or pathway.
  requireInput('deviceName', deviceName);
  requireInput('intendedUse', intendedUse);
  requireInput('deviceClass', deviceClass);
  requireInput('regulatoryPathway', regulatoryPathway);
  const pathway = pathwaySpec(regulatoryPathway); // throws on unknown pathway

  const deviceSlug = deviceSlugOf(deviceName);
  const artifactsDir = artifactsDirInput || `artifacts/medical-device-tplc/${deviceSlug}`;

  // In-process accumulators — returned in metadata, never delegated to an agent.
  const policyDecisions = [];
  const autoApprovedActions = [];
  const breakpointsHit = [];
  const gateResults = {};
  const evidenceIndex = {};
  let escalations = 0;

  /**
   * Record a policy decision verbatim (including auto-approval provenance) and return
   * the authorization block threaded into the guarded executor context.
   */
  const recordPolicyDecision = (actionId, decision) => {
    const action = policyAction(actionId); // throws on unknown actionId
    const autoApproved = decision.autoApproved === true;
    const record = {
      actionId,
      breakpointId: actionId,
      expert: action.expert,
      approved: decision.approved === true,
      autoApproved,
      respondedBy: decision.respondedBy ?? null,
      notes: decision.response ?? decision.feedback ?? null,
      decidedAt: ctx.now(),
    };
    policyDecisions.push(record);
    if (autoApproved) {
      autoApprovedActions.push(actionId);
    }
    return {
      breakpointId: actionId,
      respondedBy: record.respondedBy,
      autoApproved,
      approvedAt: record.decidedAt,
    };
  };

  const recordGate = (gateId, gate) => {
    gateResults[gateId] = {
      passed: gate.passed === true,
      attempts: gate.attempts,
      escalated: gate.escalated === true,
      issues: gate.issues,
      evidence: gate.evidence,
    };
    if (gate.escalated === true) {
      escalations += 1;
      breakpointsHit.push(`${gateId}.gate-escalation`);
    }
    return gateResults[gateId];
  };

  // -------------------------------------------------------------------------
  // P0 — kip recall. An empty store is a fresh brain, never an error.
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P0: kip recall of prior medical-device-lifecycle facts');
  const recall = await kipRecall(ctx, {
    kipDir,
    kipModel,
    kind: 'medical-device-lifecycle',
    topic: `medical device TPLC: ${deviceName} (${deviceClass}, ${pathway.label})`,
  });
  const priorKnowledge = { factCount: recall.factCount, insights: recall.insights };

  const sharedArgs = {
    deviceName,
    deviceSlug,
    intendedUse,
    deviceClass,
    regulatoryPathway,
    pathwayLabel: pathway.label,
    authority: pathway.authority,
    markets,
    repoRoot,
    artifactsDir,
    priorKnowledge,
  };

  // A structured finish so a blocked run still teaches the kip store and still returns
  // the full policy/evidence record. Facts are built deterministically from computed
  // values only — no agent decides what is asserted.
  const finish = async (outcome) => {
    const facts = [
      ...COMPOSED_PROCESSES.map((name) => ({
        subject: 'process:medical-device-tplc-workflow',
        predicate: 'composes',
        object: `process:${name}`,
      })),
      {
        subject: 'process:medical-device-tplc-workflow',
        predicate: 'enforces-pattern',
        object: 'pattern:design-freeze-binds-vv-evidence-to-baseline-digest',
      },
      {
        subject: 'process:medical-device-tplc-workflow',
        predicate: 'enforces-pattern',
        object: 'pattern:irreversible-actions-are-routed-breakpoints-with-guarded-executors',
      },
      {
        subject: 'process:medical-device-tplc-workflow',
        predicate: 'enforces-pattern',
        object: 'pattern:bounded-deficiency-rounds-fail-instead-of-degrading',
      },
      {
        subject: `device:${deviceSlug}`,
        predicate: 'regulatory-pathway',
        object: `pathway:${regulatoryPathway}`,
        props: { deviceClass, markets },
      },
    ];
    if (outcome.designFreeze && outcome.designFreeze.approved === true) {
      facts.push({
        subject: `device:${deviceSlug}`,
        predicate: 'design-baseline',
        object: `baseline:${outcome.designFreeze.baselineId}`,
        props: {
          baselineDigest: outcome.designFreeze.baselineDigest,
          frozenInputCount: outcome.designFreeze.frozenInputCount,
          approvedBy: outcome.designFreeze.approvedBy,
        },
      });
    }
    facts.push({
      subject: `run:${ctx.runId}`,
      predicate: 'run-outcome',
      object: 'process:medical-device-tplc-workflow',
      props: {
        success: outcome.success,
        phasesCompleted: outcome.phasesCompleted,
        gateAttempts: Object.values(gateResults).reduce((sum, g) => sum + (g.attempts ?? 0), 0),
        gateEscalations: escalations,
        submissionRounds: outcome.submission.rounds.length,
        submissionTransmitted: outcome.submission.transmitted === true,
        clinicalInvestigationConducted: outcome.clinicalEvaluation.investigationConducted === true,
        fieldActionsExecuted: outcome.postMarket.fieldActions.filter((f) => f.executed === true).length,
        filingsExecuted: outcome.postMarket.filings.filter((f) => f.executed === true).length,
        policyDecisions: POLICY_GATED_ACTIONS.reduce((acc, action) => {
          const decision = policyDecisions.find((d) => d.actionId === action.actionId);
          acc[action.actionId] = decision ? (decision.approved ? 'approved' : 'rejected') : 'not-raised';
          return acc;
        }, {}),
        autoApprovedActions,
      },
    });

    ctx.log?.('info', 'P10: kip assert + structured result');
    const asserted = await kipAssert(ctx, {
      kipDir,
      kipModel,
      kind: 'medical-device-lifecycle',
      facts,
    });

    return {
      success: outcome.success,
      designControl: outcome.designControl,
      riskManagement: outcome.riskManagement,
      characterization: outcome.characterization,
      designFreeze: outcome.designFreeze,
      verificationValidation: outcome.verificationValidation,
      clinicalEvaluation: outcome.clinicalEvaluation,
      designHistoryFile: outcome.designHistoryFile,
      submission: outcome.submission,
      postMarket: outcome.postMarket,
      evidenceIndex,
      dossierManifest: outcome.dossierManifest,
      kipFactsAsserted: asserted.asserted,
      metadata: {
        processId: 'specializations/domains/science/biomedical-engineering/medical-device-tplc-workflow',
        runId: ctx.runId,
        deviceName,
        deviceClass,
        regulatoryPathway,
        markets,
        policyGatedActions: POLICY_GATED_ACTIONS,
        policyDecisions,
        autoApprovedActions,
        breakpointsHit,
        gateResults,
        submissionRounds: outcome.submission.rounds.length,
        escalations,
        kipRecallFactCount: recall.factCount,
        ...(outcome.reason ? { reason: outcome.reason } : {}),
      },
    };
  };

  // -------------------------------------------------------------------------
  // P1 — intake and design-control plan
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P1: Intake and design-control plan');
  const designControl = await ctx.task(intakeDesignControlPlanTask, { ...sharedArgs });
  evidenceIndex.P1 = [designControl.planPath, designControl.dhfIndexPath];
  const designInputIds = designControl.designInputs.map((di) => di.id);

  // -------------------------------------------------------------------------
  // P2 — ISO 14971 risk management, traced to the P1 design inputs
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P2: Risk management (ISO 14971)');
  const riskManagement = await ctx.task(riskManagementFileTask, {
    ...sharedArgs,
    designInputs: designControl.designInputs,
    designOutputs: designControl.designOutputs,
  });
  evidenceIndex.P2 = [riskManagement.riskFilePath, riskManagement.traceabilityPath];

  const untracedHazards = riskManagement.hazards.filter(
    (h) => !Array.isArray(h.designInputIds) || h.designInputIds.length === 0
  );
  if (untracedHazards.length > 0) {
    throw new Error(
      `P2 risk management FAILED: ${untracedHazards.length} hazard(s) carry no design-input trace ` +
      `(${untracedHazards.map((h) => h.id).join(', ')}) — an untraceable hazard has no degraded path.`
    );
  }
  const uncontrolledRiskControls = riskManagement.riskControls.filter((rc) => !rc.verificationObligationId);
  if (uncontrolledRiskControls.length > 0) {
    throw new Error(
      `P2 risk management FAILED: ${uncontrolledRiskControls.length} risk control(s) carry no verification ` +
      `obligation id (${uncontrolledRiskControls.map((rc) => rc.id).join(', ')}) — P5 cannot verify them.`
    );
  }
  const riskControlIds = riskManagement.riskControls.map((rc) => rc.id);

  // -------------------------------------------------------------------------
  // P3 — parallel design characterization. The four legs share only P1/P2 inputs
  // and write disjoint artifact paths, so they are genuinely independent.
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P3: Parallel design characterization');
  const characterizationArgs = {
    ...sharedArgs,
    designInputs: designControl.designInputs,
    riskManagement: { hazards: riskManagement.hazards, riskControls: riskManagement.riskControls },
  };
  const characterizationLegs = [
    () => ctx.task(biologicalEvaluationTask, characterizationArgs),
    () => ctx.task(sterilizationBarrierValidationTask, characterizationArgs),
    () => ctx.task(humanFactorsTask, characterizationArgs),
    ...(hasSoftware === true ? [() => ctx.task(softwareLifecycleTask, characterizationArgs)] : []),
  ];
  const legResults = await ctx.parallel.all(characterizationLegs);
  const [biologicalEvaluation, sterilizationBarrier, humanFactors] = legResults;
  const softwareLifecycle = hasSoftware === true
    ? legResults[3]
    : { skipped: true, reason: 'device contains no software' };

  const characterization = {
    biologicalEvaluation,
    sterilizationBarrier,
    humanFactors,
    softwareLifecycle,
  };
  const characterizationPaths = [
    biologicalEvaluation.reportPath,
    sterilizationBarrier.reportPath,
    humanFactors.reportPath,
    ...(hasSoftware === true ? [softwareLifecycle.reportPath] : []),
  ];
  evidenceIndex.P3 = characterizationPaths;
  const openGaps = [
    ...(biologicalEvaluation.openGaps ?? []),
    ...(sterilizationBarrier.openGaps ?? []),
    ...(humanFactors.unmappedHazards ?? []),
  ];

  // -------------------------------------------------------------------------
  // P4 — DESIGN FREEZE (policy-gated). Rejection THROWS: there is no partial-freeze
  // or provisional-baseline path, and the executor is never scheduled.
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P4: DESIGN FREEZE (policy-gated)');
  const freezeActionId = 'medical-device-tplc.design-freeze';
  const baselineId = `${deviceSlug}-baseline-${ctx.runId}`;
  const freezeDecision = await routedBreakpoint(ctx, {
    question: `Freeze the design baseline '${baselineId}' for ${deviceName}? Downstream V&V evidence is only valid against this frozen baseline — unfreezing invalidates completed testing.`,
    title: 'Design freeze authorization',
    context: {
      runId: ctx.runId,
      summary: {
        deviceName,
        deviceClass,
        baselineId,
        characterizationIndex: {
          biologicalEvaluation: biologicalEvaluation.reportPath,
          sterilizationBarrier: sterilizationBarrier.reportPath,
          humanFactors: humanFactors.reportPath,
          softwareLifecycle: hasSoftware === true ? softwareLifecycle.reportPath : { skipped: true, reason: 'device contains no software' },
        },
        openGaps,
        hazardCount: riskManagement.hazards.length,
        riskControlCount: riskManagement.riskControls.length,
        designInputCount: designInputIds.length,
        artifactPathsToFreeze: [...evidenceIndex.P1, ...evidenceIndex.P2, ...characterizationPaths],
      },
    },
  }, {
    breakpointId: freezeActionId,
    expert: policyAction(freezeActionId).expert,
    tags: ['policy-gated', 'biomedical-engineering', 'mdt', 'design-freeze'],
    strategy: 'single',
  });
  breakpointsHit.push(freezeActionId);
  const freezeAuthorization = recordPolicyDecision(freezeActionId, freezeDecision);

  if (freezeDecision.approved !== true) {
    throw new Error(
      `P4 design freeze REJECTED for '${baselineId}': ` +
      `${freezeDecision.response ?? freezeDecision.feedback ?? 'no reviewer notes supplied'} — ` +
      'there is no partial-freeze or provisional-baseline path.'
    );
  }

  const baseline = await ctx.task(designFreezeBaselineTask, {
    ...sharedArgs,
    baselineId,
    designInputIds,
    designOutputPaths: designControl.designOutputs,
    riskControlIds,
    characterizationPaths,
    authorization: freezeAuthorization,
  });
  evidenceIndex.P4 = [baseline.baselinePath];
  const designFreeze = {
    approved: true,
    baselineId: baseline.baselineId,
    baselineDigest: baseline.baselineDigest,
    baselinePath: baseline.baselinePath,
    frozenInputCount: baseline.frozenInputCount,
    approvedBy: freezeAuthorization.respondedBy,
    autoApproved: freezeAuthorization.autoApproved,
  };

  // -------------------------------------------------------------------------
  // P5 — verification and validation over the frozen baseline
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P5: Verification and validation');
  const vvPlan = await ctx.task(vvPlanningTask, {
    ...sharedArgs,
    baselineId: baseline.baselineId,
    baselineDigest: baseline.baselineDigest,
    designInputIds,
    riskControlIds,
  });
  if (vvPlan.uncoveredDesignInputIds.length > 0 || vvPlan.uncoveredRiskControlIds.length > 0) {
    throw new Error(
      'P5 V&V planning FAILED: coverage is incomplete — uncovered design inputs ' +
      `[${vvPlan.uncoveredDesignInputIds.join(', ')}], uncovered risk controls ` +
      `[${vvPlan.uncoveredRiskControlIds.join(', ')}]. A degraded verification path is forbidden.`
    );
  }

  const protocolResults = await ctx.parallel.map(
    vvPlan.protocols,
    (protocol) => ctx.task(vvProtocolExecutionTask, {
      ...sharedArgs,
      protocol,
      baselineId: baseline.baselineId,
      baselineDigest: baseline.baselineDigest,
    }),
    // maxConcurrency is the option the SDK scheduler reads; concurrency is carried
    // alongside it as the design-declared alias so neither name silently no-ops.
    { concurrency: maxParallelProtocols, maxConcurrency: maxParallelProtocols }
  );
  const protocolReportPaths = protocolResults.map((r) => r.reportPath);

  const vvSummary = await ctx.task(vvSummaryTask, {
    ...sharedArgs,
    baselineDigest: baseline.baselineDigest,
    protocolReportPaths,
  });
  if ((vvSummary.staleReports ?? []).length > 0) {
    throw new Error(
      `P5 V&V summary FAILED: ${vvSummary.staleReports.length} protocol report(s) carry a baselineDigest ` +
      'that does not match the frozen baseline — stale evidence is never averaged away.'
    );
  }
  evidenceIndex.P5 = [vvPlan.planPath, ...protocolReportPaths, vvSummary.summaryPath];
  const verificationValidation = {
    planPath: vvPlan.planPath,
    summaryPath: vvSummary.summaryPath,
    protocolCount: vvPlan.protocols.length,
    passedCount: vvSummary.passedCount,
    failedCount: vvSummary.failedCount,
    baselineDigest: baseline.baselineDigest,
  };

  // -------------------------------------------------------------------------
  // P6 — clinical evaluation. Unsatisfied prerequisites THROW before the
  // authorization is ever raised; an unauthorized first-in-human path does not exist.
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P6: Clinical evaluation (policy-gated study start)');
  const clinicalPlan = await ctx.task(clinicalStudyDesignTask, {
    ...sharedArgs,
    residualRisks: riskManagement.residualRisks,
    verificationValidation,
  });
  const unsatisfiedPrerequisites = clinicalPlan.prerequisites.filter((p) => p.satisfied !== true);
  if (unsatisfiedPrerequisites.length > 0) {
    throw new Error(
      'P6 clinical study start BLOCKED: unsatisfied enrollment prerequisites ' +
      `[${unsatisfiedPrerequisites.map((p) => p.id).join(', ')}] — the authorization is not raised and ` +
      'no unauthorized enrollment path exists.'
    );
  }

  const studyStartActionId = 'medical-device-tplc.clinical-study-start';
  const studyStartDecision = await routedBreakpoint(ctx, {
    question: `Authorize enrollment / first-in-human for the clinical investigation of ${deviceName}? Exposure to an investigational device cannot be undone.`,
    title: 'Clinical investigation authorization',
    context: {
      runId: ctx.runId,
      files: [{ path: clinicalPlan.planPath, label: 'Clinical investigation plan' }],
      summary: {
        deviceName,
        planPath: clinicalPlan.planPath,
        design: clinicalPlan.design,
        endpoints: clinicalPlan.endpoints,
        sampleSize: clinicalPlan.sampleSize,
        benefitRiskConclusion: riskManagement.benefitRiskConclusion,
        residualRisksByHazardId: riskManagement.residualRisks,
        prerequisites: clinicalPlan.prerequisites,
      },
    },
  }, {
    breakpointId: studyStartActionId,
    expert: policyAction(studyStartActionId).expert,
    tags: ['policy-gated', 'biomedical-engineering', 'mdt', 'clinical'],
    strategy: 'single',
  });
  breakpointsHit.push(studyStartActionId);
  const studyStartAuthorization = recordPolicyDecision(studyStartActionId, studyStartDecision);

  let clinicalConduct = null;
  if (studyStartDecision.approved === true) {
    clinicalConduct = await ctx.task(clinicalInvestigationConductTask, {
      ...sharedArgs,
      clinicalPlan,
      authorization: studyStartAuthorization,
    });
  }
  const clinicalInvestigationConducted = clinicalConduct !== null;

  const cer = await ctx.task(clinicalEvaluationReportTask, {
    ...sharedArgs,
    clinicalPlan,
    clinicalInvestigationConducted,
    conductLog: clinicalConduct,
    riskManagement: { residualRisks: riskManagement.residualRisks, hazards: riskManagement.hazards },
    studyStartDecisionNotes: studyStartDecision.response ?? studyStartDecision.feedback ?? null,
  });
  evidenceIndex.P6 = [
    clinicalPlan.planPath,
    ...(clinicalConduct ? [clinicalConduct.conductLogPath] : []),
    cer.cerPath,
  ];
  const clinicalEvaluation = {
    planPath: clinicalPlan.planPath,
    investigationConducted: clinicalInvestigationConducted,
    conductLogPath: clinicalConduct ? clinicalConduct.conductLogPath : null,
    cerPath: cer.cerPath,
    evidenceGaps: cer.evidenceGaps ?? [],
    benefitRiskConclusion: cer.benefitRiskConclusion,
  };

  // -------------------------------------------------------------------------
  // P7 — DHF assembly + adversarial sufficiency gate. A missing required section
  // FAILS before the gate runs; a failed gate FAILS the phase (P8 is never reached).
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P7: Design History File assembly + sufficiency gate');
  const requiredSections = REQUIRED_DHF_SECTIONS.filter(
    (section) => section !== 'software-lifecycle' || hasSoftware === true
  );
  const dhf = await ctx.task(designHistoryFileAssemblyTask, {
    ...sharedArgs,
    requiredSections,
    evidenceIndex,
    designControl,
    riskManagement: { riskFilePath: riskManagement.riskFilePath, traceabilityPath: riskManagement.traceabilityPath },
    characterization,
    designFreeze,
    verificationValidation,
    clinicalEvaluation,
  });
  evidenceIndex.P7 = [dhf.dhfPath, dhf.evidenceIndexPath];

  const coveredSections = dhf.sections.map((s) => s.section);
  const missingSections = requiredSections.filter((section) => !coveredSections.includes(section));
  if (missingSections.length > 0) {
    throw new Error(
      `P7 Design History File FAILED: required section(s) missing [${missingSections.join(', ')}] — ` +
      'a missing DHF section is a phase failure, never a warning.'
    );
  }

  const dhfGateId = 'medical-device-tplc.design-history-file-sufficiency';
  const dhfGate = await adversarialGate(ctx, {
    gateId: dhfGateId,
    artifact: {
      path: dhf.dhfPath,
      description: 'Assembled Design History File index plus the per-phase evidence index',
    },
    critics: [
      {
        name: 'dhf-completeness-critic',
        role: 'Design History File auditor (21 CFR 820.30(j))',
        focus: 'every required DHF section is present AND its referenced artifact actually exists on disk with non-zero bytes',
      },
      {
        name: 'traceability-evidence-critic',
        role: 'Design traceability auditor',
        focus: 'every design input id traces to a design output, a verification protocol and a PASSED protocol result bound to the frozen baselineDigest; every risk control id traces to a verification obligation that was executed',
      },
      {
        name: 'standards-conformance-critic',
        role: 'Medical device standards reviewer (ISO 13485, ISO 14971, IEC 62366, IEC 62304, ISO 10993)',
        focus: 'each characterization leg resolves its endpoints/classes with a stated justification and no unresolved open gap is presented as closed',
      },
    ],
    ironLaw: [
      `OPEN the artifact files yourself. Read ${dhf.dhfPath}, the evidence index at ${dhf.evidenceIndexPath}, and every referenced report path from disk. A verdict derived from the implementer report or from this prompt context alone is invalid.`,
      `EXECUTE the check: enumerate the required DHF sections (${requiredSections.join(', ')}) and diff them against what the file actually contains; enumerate design input ids and diff them against the protocol coverage in the V&V summary. Cite the ids you enumerated.`,
      'Evidence entries MUST be file:line citations from files you opened, or the literal output of a command you ran. "The report states..." is not evidence.',
      'A referenced artifact path that does not exist on disk is an automatic FAIL — verify existence, do not assume.',
      `Every PASSED V&V protocol you rely on must carry the same baselineDigest as the frozen baseline (${baseline.baselineDigest}); a digest mismatch is an automatic FAIL.`,
      'Emit the verdict as JSON with EXACTLY these keys: {"passed": boolean, "issues": [{"severity": string, "description": string, "location": string}], "evidence": [string]}. passed:true with an empty evidence array will be rejected by the orchestrator.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      evidenceIndexPath: dhf.evidenceIndexPath,
      requiredSections,
      baselineDigest: baseline.baselineDigest,
      vvSummaryPath: vvSummary.summaryPath,
      missingArtifacts: dhf.missingArtifacts,
    },
  });
  recordGate(dhfGateId, dhfGate);
  if (dhfGate.passed !== true) {
    throw new Error(
      `P7 Design History File sufficiency gate FAILED after ${dhfGate.attempts} attempt(s) ` +
      `(escalated: ${dhfGate.escalated}) with ${dhfGate.issues.length} open issue(s) — ` +
      'the submission phase is never reached on an insufficient DHF.'
    );
  }
  const designHistoryFile = {
    dhfPath: dhf.dhfPath,
    evidenceIndexPath: dhf.evidenceIndexPath,
    missingArtifacts: dhf.missingArtifacts,
    completenessByCategory: dhf.completenessByCategory,
    gate: gateResults[dhfGateId],
  };

  // -------------------------------------------------------------------------
  // P8 — regulatory submission: dossier assembly, readiness gate, policy-gated
  // transmission, bounded deficiency rounds.
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P8: Regulatory submission + bounded deficiency rounds');
  if (regulatoryPathway === '510k' && predicateDevices.length === 0) {
    throw new Error(
      'P8 dossier assembly FAILED: the 510k pathway requires at least one predicate device artifact and ' +
      'none was supplied (inputs.predicateDevices is empty) — a generic or substituted predicate is never acceptable.'
    );
  }

  const dossier = await ctx.task(submissionDossierAssemblyTask, {
    ...sharedArgs,
    ingredientProcess: pathway.ingredientProcess,
    predicateDevices,
    dhf: { sections: dhf.sections, dhfPath: dhf.dhfPath },
    clinicalEvaluation,
    verificationValidation,
  });
  evidenceIndex.P8 = [dossier.manifestPath];

  if (dossier.blockers.length > 0 || dossier.unbackedSections.length > 0) {
    throw new Error(
      `P8 dossier assembly FAILED: ${dossier.blockers.length} blocker(s) ` +
      `[${dossier.blockers.map((b) => (typeof b === 'string' ? b : b.id ?? JSON.stringify(b))).join(', ')}] and ` +
      `${dossier.unbackedSections.length} unbacked section(s) — a degraded submission is forbidden.`
    );
  }

  const dossierGateId = 'medical-device-tplc.submission-dossier-readiness';
  const dossierGate = await adversarialGate(ctx, {
    gateId: dossierGateId,
    artifact: {
      path: dossier.manifestPath,
      description: 'Assembled submission dossier manifest for the resolved pathway',
    },
    critics: [
      {
        name: 'dossier-completeness-critic',
        role: 'Regulatory dossier reviewer',
        focus: 'every pathway-required section is present, backed by an existing DHF artifact, and no section is backed only by a promise',
      },
      {
        name: 'substantial-equivalence-critic',
        role: regulatoryPathway === '510k' ? 'Predicate/equivalence reviewer (510k)' : 'GSPR reviewer (EU MDR)',
        focus: 'the SE argument names real predicate artifacts and the comparison table addresses every technological difference, OR every GSPR line has a conformance route and evidence path',
      },
    ],
    ironLaw: [
      `OPEN the dossier manifest at ${dossier.manifestPath} and every artifact path it references from disk before judging. Reviewing the assembler report is invalid.`,
      'EXECUTE the existence check on every referenced artifact path and cite path plus byte size in evidence.',
      'A missing predicate artifact (510k) or a GSPR line with no evidence path (EU MDR) is an automatic FAIL — a generic or substituted predicate is never acceptable.',
      'Evidence must be file:line citations or command output. Emit the verdict as JSON with EXACTLY these keys: {"passed": boolean, "issues": [{"severity": string, "description": string, "location": string}], "evidence": [string]}. passed:true with an empty evidence array will be rejected.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      pathway: regulatoryPathway,
      pathwayLabel: pathway.label,
      authority: pathway.authority,
      predicateDevices,
      dhfPath: dhf.dhfPath,
    },
  });
  recordGate(dossierGateId, dossierGate);
  if (dossierGate.passed !== true) {
    throw new Error(
      `P8 submission dossier readiness gate FAILED after ${dossierGate.attempts} attempt(s) ` +
      `(escalated: ${dossierGate.escalated}) — an unready dossier is never presented for irreversible transmission.`
    );
  }

  const submissionActionId = 'medical-device-tplc.regulatory-submission';
  const submissionDecision = await routedBreakpoint(ctx, {
    question: `Transmit the ${pathway.label} dossier for ${deviceName} to the ${pathway.authority}? The submitted record is permanent and starts a statutory clock.`,
    title: 'Regulatory submission authorization',
    context: {
      runId: ctx.runId,
      files: [{ path: dossier.manifestPath, label: 'Dossier manifest' }],
      summary: {
        pathway: regulatoryPathway,
        pathwayLabel: pathway.label,
        authority: pathway.authority,
        deviceName,
        manifestPath: dossier.manifestPath,
        sectionCount: dossier.sections.length,
        completeSectionCount: dossier.sections.filter((s) => s.complete === true).length,
        unbackedSections: dossier.unbackedSections,
        blockers: dossier.blockers,
        dhfGate: gateResults[dhfGateId],
        dossierGate: gateResults[dossierGateId],
        vvCounts: { passed: vvSummary.passedCount, failed: vvSummary.failedCount },
      },
    },
  }, {
    breakpointId: submissionActionId,
    expert: policyAction(submissionActionId).expert,
    tags: ['policy-gated', 'biomedical-engineering', 'mdt', 'submission'],
    strategy: 'single',
  });
  breakpointsHit.push(submissionActionId);
  const submissionAuthorization = recordPolicyDecision(submissionActionId, submissionDecision);

  const submission = {
    pathway: regulatoryPathway,
    pathwayLabel: pathway.label,
    authority: pathway.authority,
    manifestPath: dossier.manifestPath,
    transmitted: false,
    submissionReference: null,
    rounds: [],
    settled: false,
    pendingExternal: false,
  };
  const emptyPostMarket = {
    pmsPlanPath: null,
    analysisPath: null,
    pendingExternal: false,
    signals: [],
    capas: [],
    fieldActions: [],
    filings: [],
  };

  if (submissionDecision.approved !== true) {
    // No alternate transmission channel exists — the dossier is retained and the run ends.
    return finish({
      success: false,
      reason: `Regulatory submission rejected at ${submissionActionId}: ${submissionDecision.response ?? submissionDecision.feedback ?? 'no reviewer notes supplied'}`,
      phasesCompleted: 8,
      designControl: {
        planPath: designControl.planPath,
        dhfIndexPath: designControl.dhfIndexPath,
        designInputIds,
      },
      riskManagement: {
        riskFilePath: riskManagement.riskFilePath,
        traceabilityPath: riskManagement.traceabilityPath,
        hazardCount: riskManagement.hazards.length,
        riskControlIds,
      },
      characterization,
      designFreeze,
      verificationValidation,
      clinicalEvaluation,
      designHistoryFile,
      submission,
      postMarket: emptyPostMarket,
      dossierManifest: dossier,
    });
  }

  const transmission = await ctx.task(submissionTransmitTask, {
    ...sharedArgs,
    manifestPath: dossier.manifestPath,
    sections: dossier.sections,
    authorization: submissionAuthorization,
  });
  submission.transmitted = true;
  submission.submissionReference = transmission.submissionReference;
  submission.transmissionRecordPath = transmission.transmissionRecordPath;
  evidenceIndex.P8 = [...evidenceIndex.P8, transmission.transmissionRecordPath];

  // Bounded, strictly sequential deficiency rounds. Each round consumes the previous
  // reviewer position, so rounds are never parallel and never silently added.
  for (let round = 1; round <= maxSubmissionRounds; round++) {
    const roundResult = await ctx.task(deficiencyResponseTask, {
      ...sharedArgs,
      round,
      maxRounds: maxSubmissionRounds,
      submissionReference: transmission.submissionReference,
      deficiencyInputPath: `${artifactsDir}/submission/deficiency-letter-${round}.json`,
      priorRounds: submission.rounds,
    });
    submission.rounds.push({
      round,
      responsePath: roundResult.responsePath,
      deficiencyCount: roundResult.deficiencies.length,
      settled: roundResult.settled === true,
      pendingExternal: roundResult.pendingExternal === true,
      requiresNewEvidenceIds: roundResult.requiresNewEvidenceIds ?? [],
    });
    evidenceIndex.P8 = [...evidenceIndex.P8, roundResult.responsePath];
    if (roundResult.settled === true) {
      submission.settled = true;
      break;
    }
    if (roundResult.pendingExternal === true) {
      // Honest stop: the reviewer position does not exist yet. Never assume clearance.
      submission.pendingExternal = true;
      break;
    }
  }

  if (!submission.settled && !submission.pendingExternal) {
    const exhaustionId = 'medical-device-tplc.submission-rounds-exhausted';
    const exhaustionDecision = await routedBreakpoint(ctx, {
      question: `The ${pathway.label} submission for ${deviceName} is still unsettled after ${maxSubmissionRounds} deficiency round(s). Approve to accept the open-deficiency state explicitly, or reject to FAIL the run with the full round record.`,
      title: 'Submission rounds exhausted',
      context: {
        runId: ctx.runId,
        summary: {
          submissionReference: transmission.submissionReference,
          rounds: submission.rounds,
          maxSubmissionRounds,
        },
      },
    }, {
      breakpointId: exhaustionId,
      expert: 'regulatory-affairs-lead',
      tags: ['mdt', 'submission', 'escalation'],
      strategy: 'single',
    });
    breakpointsHit.push(exhaustionId);
    escalations += 1;
    if (exhaustionDecision.approved !== true) {
      throw new Error(
        `P8 submission FAILED: ${maxSubmissionRounds} deficiency round(s) exhausted without settlement and the ` +
        'owner did not accept the open-deficiency state — the run never assumes clearance and never adds rounds.'
      );
    }
    submission.openDeficienciesAccepted = true;
    submission.openDeficienciesAcceptedBy = exhaustionDecision.respondedBy ?? null;
  }

  // -------------------------------------------------------------------------
  // P9 — post-market surveillance, signal gate, severity-routed CAPA / field
  // action / filing. All policy breakpoints are raised SEQUENTIALLY after the
  // CAPA fan-in so an owner never approves two irreversible actions from stale state.
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P9: Post-market surveillance, signal gate, severity-routed CAPA');
  const pmsPlan = await ctx.task(pmsPlanTask, {
    ...sharedArgs,
    clinicalEvaluation,
    pmcfObligations: cer.pmcfObligations ?? [],
  });
  const postMarket = {
    pmsPlanPath: pmsPlan.planPath,
    analysisPath: null,
    pendingExternal: false,
    signals: [],
    capas: [],
    fieldActions: [],
    filings: [],
  };
  evidenceIndex.P9 = [pmsPlan.planPath];

  if (!signalDataPath) {
    // No dataset: report an honest pending-external state. Signals are never fabricated.
    postMarket.pendingExternal = true;
  } else {
    const analysis = await ctx.task(signalAnalysisTask, {
      ...sharedArgs,
      signalDataPath,
      signalThresholds: pmsPlan.signalThresholds,
      pmsPlanPath: pmsPlan.planPath,
    });
    postMarket.analysisPath = analysis.analysisPath;
    evidenceIndex.P9 = [...evidenceIndex.P9, analysis.analysisPath];

    // Throwing severity validation before anything is routed on it.
    for (const signal of analysis.signals) {
      assertSignalSeverity(signal.severity, signal.id);
    }
    postMarket.signals = analysis.signals;

    const signalGateId = 'medical-device-tplc.post-market-signal-integrity';
    const signalGate = await adversarialGate(ctx, {
      gateId: signalGateId,
      artifact: {
        path: analysis.analysisPath,
        description: 'Computed post-market signal analysis with per-endpoint rates and reportability assessments',
      },
      critics: [
        {
          name: 'signal-detection-critic',
          role: 'Post-market signal detection auditor',
          focus: 'the observed rates are RECOMPUTED from the underlying dataset and match; no exceedance is missed and no signal is inflated',
        },
        {
          name: 'vigilance-reportability-critic',
          role: 'Vigilance reportability auditor (EU MDR Art.87, FDA 21 CFR 803)',
          focus: 'every serious incident / death-or-serious-deterioration / FSCA-triggering event is marked reportable with the criterion cited, and no reportable event is downgraded',
        },
      ],
      ironLaw: [
        `OPEN ${analysis.analysisPath} AND the underlying dataset at ${signalDataPath} from disk. RECOMPUTE at least the exceeded endpoint rates yourself and compare to the reported values — accepting the analyst numbers is an invalid review.`,
        'Cite the record ids you counted and the arithmetic you performed in evidence; "rates look plausible" is not evidence.',
        `A signal whose severity is outside {${SIGNAL_SEVERITIES.join(', ')}} is an automatic FAIL (the process severity lookup throws on unknown values).`,
        'A reportable event marked reportable:false without an explicit cited criterion is an automatic FAIL — under-reporting is the failure mode this gate exists to catch.',
        'Emit the verdict as JSON with EXACTLY these keys: {"passed": boolean, "issues": [{"severity": string, "description": string, "location": string}], "evidence": [string]}. passed:true with an empty evidence array will be rejected.',
      ],
      maxFixAttempts,
      fixer: {},
      context: {
        signalDataPath,
        signalThresholds: pmsPlan.signalThresholds,
        recordsAnalyzed: analysis.recordsAnalyzed,
        markets,
      },
    });
    recordGate(signalGateId, signalGate);
    if (signalGate.passed !== true) {
      throw new Error(
        `P9 post-market signal integrity gate FAILED after ${signalGate.attempts} attempt(s) ` +
        `(escalated: ${signalGate.escalated}) — no irreversible field action or filing is taken on an ` +
        'unverified signal analysis.'
      );
    }

    // Independent per-signal CAPA investigations write disjoint paths — safe to fan out.
    const exceededSignals = analysis.signals.filter((s) => s.exceeded === true);
    const capas = exceededSignals.length > 0
      ? await ctx.parallel.all(exceededSignals.map((signal) => () => ctx.task(capaInvestigationTask, {
        ...sharedArgs,
        signalId: signal.id,
        severity: signal.severity,
        signal,
        analysisPath: analysis.analysisPath,
        riskManagement: { hazards: riskManagement.hazards, riskFilePath: riskManagement.riskFilePath },
      })))
      : [];
    postMarket.capas = capas.map((c) => ({
      signalId: c.signalId,
      capaPath: c.capaPath,
      recommendedAction: c.recommendedAction,
      fieldActionRequired: c.fieldActionRequired === true,
    }));
    evidenceIndex.P9 = [...evidenceIndex.P9, ...capas.map((c) => c.capaPath)];

    const fieldActionId = 'medical-device-tplc.field-action';
    const filingActionId = 'medical-device-tplc.post-market-report-filing';

    for (let i = 0; i < exceededSignals.length; i++) {
      const signal = exceededSignals[i];
      const capa = capas[i];

      // --- Field action (severity-routed, policy-gated) ---------------------
      if (capa.fieldActionRequired === true) {
        if (!isRaisable(fieldActionId, signal.severity)) {
          postMarket.fieldActions.push({
            signalId: signal.id,
            severity: signal.severity,
            raised: false,
            executed: false,
            reason: `field action is never raised at severity '${signal.severity}'`,
          });
        } else {
          const fieldDecision = await routedBreakpoint(ctx, {
            question: `Execute a field safety corrective action for signal ${signal.id} (${signal.severity}) on ${deviceName}? A recall/FSCA is publicly and commercially irreversible.`,
            title: `Field action authorization: ${signal.id}`,
            context: {
              runId: ctx.runId,
              files: [{ path: capa.capaPath, label: 'CAPA record' }],
              summary: {
                signalId: signal.id,
                severity: signal.severity,
                affectedScope: signal.affectedScope ?? null,
                proposedActionType: capa.recommendedAction,
                capaPath: capa.capaPath,
                rootCause: capa.rootCause,
                hazardIds: capa.hazardIds ?? [],
                riskExceedsEstimate: capa.riskExceedsEstimate === true,
                healthHazardEvaluation: capa.healthHazardEvaluation ?? null,
                signalIntegrityGate: gateResults[signalGateId],
              },
            },
          }, {
            breakpointId: fieldActionId,
            expert: routingExpert(fieldActionId, signal.severity),
            tags: ['policy-gated', 'biomedical-engineering', 'mdt', 'field-action'],
            strategy: 'single',
          });
          breakpointsHit.push(fieldActionId);
          const fieldAuthorization = recordPolicyDecision(fieldActionId, fieldDecision);

          if (fieldDecision.approved === true) {
            const executed = await ctx.task(fieldActionExecutionTask, {
              ...sharedArgs,
              signalId: signal.id,
              severity: signal.severity,
              capa,
              signal,
              authorization: fieldAuthorization,
            });
            postMarket.fieldActions.push({
              signalId: signal.id,
              severity: signal.severity,
              raised: true,
              executed: true,
              fieldActionPath: executed.fieldActionPath,
              actionType: executed.actionType,
              autoApproved: fieldAuthorization.autoApproved,
            });
            evidenceIndex.P9 = [...evidenceIndex.P9, executed.fieldActionPath];
          } else {
            // Rejected: the executor is never scheduled and is never retried silently.
            postMarket.fieldActions.push({
              signalId: signal.id,
              severity: signal.severity,
              raised: true,
              executed: false,
              rejectionNotes: fieldDecision.response ?? fieldDecision.feedback ?? null,
            });
          }
        }
      }

      // --- Vigilance filing per reportable market (severity-routed) ---------
      const reportableMarkets = (capa.reportabilityAssessment ?? [])
        .filter((r) => r.reportable === true)
        .map((r) => r.market);
      for (const market of reportableMarkets) {
        if (!isRaisable(filingActionId, signal.severity)) {
          postMarket.filings.push({
            signalId: signal.id,
            market,
            severity: signal.severity,
            raised: false,
            executed: false,
            reason: `filing is never raised at severity '${signal.severity}'`,
          });
          continue;
        }
        const assessment = (capa.reportabilityAssessment ?? []).find((r) => r.market === market);
        const filingDecision = await routedBreakpoint(ctx, {
          question: `File the vigilance/MDR report for signal ${signal.id} to the ${market} competent authority? A filing is a permanent regulatory record.`,
          title: `Vigilance filing authorization: ${signal.id} (${market})`,
          context: {
            runId: ctx.runId,
            files: [{ path: capa.capaPath, label: 'CAPA record' }],
            summary: {
              signalId: signal.id,
              market,
              severity: signal.severity,
              reportType: assessment?.reportType ?? null,
              reportingDeadline: assessment?.reportingDeadline ?? null,
              awarenessDate: assessment?.awarenessDate ?? null,
              reportabilityCriterion: assessment?.criterion ?? null,
              capaPath: capa.capaPath,
              analysisPath: analysis.analysisPath,
            },
          },
        }, {
          breakpointId: filingActionId,
          expert: routingExpert(filingActionId, signal.severity),
          tags: ['policy-gated', 'biomedical-engineering', 'mdt', 'vigilance'],
          strategy: 'single',
        });
        breakpointsHit.push(filingActionId);
        const filingAuthorization = recordPolicyDecision(filingActionId, filingDecision);

        if (filingDecision.approved === true) {
          const filed = await ctx.task(vigilanceReportFilingTask, {
            ...sharedArgs,
            signalId: signal.id,
            market,
            reportType: assessment?.reportType ?? null,
            awarenessDate: assessment?.awarenessDate ?? null,
            criterion: assessment?.criterion ?? null,
            capa,
            authorization: filingAuthorization,
          });
          postMarket.filings.push({
            signalId: signal.id,
            market,
            severity: signal.severity,
            raised: true,
            executed: true,
            filingPath: filed.filingPath,
            submissionReference: filed.submissionReference,
            autoApproved: filingAuthorization.autoApproved,
          });
          evidenceIndex.P9 = [...evidenceIndex.P9, filed.filingPath];
        } else {
          postMarket.filings.push({
            signalId: signal.id,
            market,
            severity: signal.severity,
            raised: true,
            executed: false,
            rejectionNotes: filingDecision.response ?? filingDecision.feedback ?? null,
          });
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // P10 — kip assert + structured result
  // -------------------------------------------------------------------------
  return finish({
    success: true,
    phasesCompleted: 10,
    designControl: {
      planPath: designControl.planPath,
      dhfIndexPath: designControl.dhfIndexPath,
      designInputIds,
    },
    riskManagement: {
      riskFilePath: riskManagement.riskFilePath,
      traceabilityPath: riskManagement.traceabilityPath,
      hazardCount: riskManagement.hazards.length,
      riskControlIds,
    },
    characterization,
    designFreeze,
    verificationValidation,
    clinicalEvaluation,
    designHistoryFile,
    submission,
    postMarket,
    dossierManifest: dossier,
  });
}
