/**
 * @process specializations/domains/social-sciences-humanities/healthcare/clinical-safety-quality-workflow
 * @description Flagship clinical safety and quality lifecycle with harm-severity-routed policy
 *   gates, statutory reporting clocks, an adversarial clinical-review gate with executed
 *   evidence, and kip clinical-safety memory. Safety-event intake + harm classification ->
 *   immediate patient-safety containment (gated care-standard suspension, gated PHI handling) ->
 *   parallel investigation (clinical review, iterative RCA over six fanned-out
 *   contributing-factor analyses, harm assessment, conditional proactive FMEA, per-unit practice
 *   scans) -> CAPA design + dossier -> adversarial investigation-sufficiency gate -> policy-gated
 *   regulatory/notifiable-event filing on statutory clocks and policy-gated patient/family
 *   disclosure -> policy-gated clinical practice change + PDSA + CAPA tracking + HRO learning
 *   spread -> deadline-audited closure + kip assert.
 * @inputs {
 *   event: {                            // REQUIRED — the safety event under investigation
 *     reportedAt: string,               // ISO timestamp
 *     discoveredAt: string,             // REQUIRED ISO timestamp — organizational awareness; starts EVERY statutory clock
 *     source: 'incident-report'|'chart-review'|'patient-complaint'|'staff-report'|'device-alert'|'mortality-review',
 *     ref: string,                      // REQUIRED
 *     narrative: string,                // REQUIRED
 *     careSetting: string,
 *     affectedUnits?: string[],
 *     patientRef?: string,              // pseudonymous
 *     deviceRefs?: string[]
 *   },
 *   jurisdiction: string,               // REQUIRED — selects WHICH channels apply, never how long their windows are
 *   approvers: {                        // REQUIRED — role -> named person; an unreachable routed role FAILS the run
 *     'chief-medical-officer': string,
 *     'chief-quality-officer': string,
 *     'patient-safety-officer': string,
 *     'privacy-officer': string
 *   },
 *   severityOverride?: string,          // 'sentinel'|'severe-harm'|'moderate-harm'|'minor-harm'|'no-harm'|'near-miss'
 *                                       // 'non-event' is NOT accepted: it is a classification outcome the intake
 *                                       // agent may reach from the record, never an override a caller may assert.
 *                                       // Any override that is not STRICTLY more severe than the classification is
 *                                       // reported as metadata.severityDowngraded = true.
 *   immediateJeopardy?: boolean,        // hint, ORed with intake's own determination (default false)
 *   phiHandlingRequested?: boolean,     // combined with intake.phiInScope to raise the PHI gate (default false)
 *   practiceChangeRequested?: boolean|null, // null (default) => decided by capaDesign.requiresLivePathwayChange
 *   proactiveFmeaRequested?: boolean,   // FMEA also runs unconditionally at sentinel / severe-harm (default false)
 *   maxRcaPasses?: number,              // bounded sequential RCA passes (default 3)
 *   maxFixAttempts?: number,            // adversarial gate fixer budget (default 2)
 *   kipEnabled?: boolean,               // recall + assert clinical-safety memory (default true)
 *   kipDir?: string,                    // kip store directory (default '.a5c/kip')
 *   kipModel?: string,                  // model for kip structured paths (default 'sonnet')
 *   artifactsDir?: string               // where the dossier / closure audit land (default ctx.artifactsDir)
 * }
 * @outputs {
 *   success: boolean,                   // investigation gate passed AND every required channel filed in window
 *                                       // AND every required disclosure conducted AND no unremediated breach
 *   eventId: string,
 *   severity: string,                   // one of HARM_SEVERITIES or 'non-event'
 *   reachedPatient: boolean,
 *   containment: { plan, executed, contained, suspensionRequested, suspensionApproved, withheldActions },
 *   phi: { inScope, gateRaised, approved, handled },
 *   investigation: { clinicalReview, rootCause, contributingFactors, harmAssessment, fmea, unitScans },
 *   investigationGate: { passed, attempts, escalated, issues, evidence }|null,
 *   capa: { items, maxStrengthTier, pdsaPlan, tracked },
 *   reportingLog: Array<{ actionId, channel, severity, zone, expert, required, raised, approved, submitted, submissionRef?, deadlineAt, filedAt?, breached }>,
 *   disclosureLog: Array<{ actionId, severity, zone, expert, required, raised, approved, conducted, conversationRef?, attendees? }>,
 *   practiceChange: { designed, gateRaised, approved, activated },
 *   clocks: { startedAt, perChannel, ledger },
 *   autoApprovals: Array<{ breakpointId, actionId, severity, expert, phase, at, irreversible, reason }>, // ALWAYS present (possibly empty) — fail-closed surfacing
 *   kipFactsAsserted: number,
 *   slaBreaches: string[],
 *   artifacts: string[],
 *   metadata: { processId, runId, jurisdiction, clockLedger, breakpointsHit, severityOverridden, severityDowngraded, autoApprovalRecords, reason? }
 * }
 * @graph
 *   domains: [domain:healthcare]
 *   specializations: [specialization:healthcare]
 *   workflows: [workflow:incident-response, workflow:post-mortem-review, workflow:compliance-audit]
 *   roles: [role:clinician, role:patient-safety-officer, role:chief-medical-officer, role:quality-improvement-lead]
 *   skillAreas: [skill-area:incident-response, skill-area:compliance-automation, skill-area:quality-improvement]
 * @policyGatedActions clinical-safety.regulatory-report-filing, clinical-safety.clinical-pathway-activation,
 *   clinical-safety.patient-family-disclosure, clinical-safety.care-standard-suspension,
 *   clinical-safety.phi-data-handling
 * @composes specializations/domains/social-sciences-humanities/healthcare/patient-safety-event-reporting
 * @composes specializations/domains/social-sciences-humanities/healthcare/root-cause-analysis-healthcare
 * @composes specializations/domains/social-sciences-humanities/healthcare/fmea-healthcare
 * @composes specializations/domains/social-sciences-humanities/healthcare/pdsa-cycle-implementation
 * @composes specializations/domains/social-sciences-humanities/healthcare/clinical-pathway-development
 * @composes specializations/domains/social-sciences-humanities/healthcare/clinical-decision-support
 * @composes specializations/domains/social-sciences-humanities/healthcare/clinical-documentation-improvement
 * @composes specializations/domains/social-sciences-humanities/healthcare/high-reliability-organization
 * @composes specializations/domains/social-sciences-humanities/healthcare/cms-conditions-participation
 * @composes specializations/domains/social-sciences-humanities/healthcare/joint-commission-survey-readiness
 * @composes specializations/domains/social-sciences-humanities/healthcare/quality-reporting-program
 * @composes specializations/domains/social-sciences-humanities/healthcare/hipaa-compliance-program
 * @composes specializations/domains/social-sciences-humanities/healthcare/care-coordination-protocol
 *
 * SEVERITY_ROUTING (reproduced verbatim — the frozen const below is the implementation):
 *   clinical-safety.care-standard-suspension:    sentinel chief-medical-officer | severe-harm chief-medical-officer | moderate-harm chief-medical-officer | minor-harm chief-medical-officer | no-harm chief-medical-officer | near-miss chief-medical-officer
 *   clinical-safety.phi-data-handling:           sentinel privacy-officer | severe-harm privacy-officer | moderate-harm privacy-officer | minor-harm privacy-officer | no-harm privacy-officer | near-miss privacy-officer
 *   clinical-safety.regulatory-report-filing:    sentinel chief-quality-officer | severe-harm chief-quality-officer | moderate-harm chief-quality-officer | minor-harm NOT RAISED | no-harm NOT RAISED | near-miss NOT RAISED
 *   clinical-safety.patient-family-disclosure:   sentinel chief-medical-officer | severe-harm chief-medical-officer | moderate-harm patient-safety-officer | minor-harm patient-safety-officer | no-harm patient-safety-officer | near-miss NOT RAISED
 *   clinical-safety.clinical-pathway-activation: sentinel chief-medical-officer | severe-harm chief-medical-officer | moderate-harm chief-medical-officer | minor-harm chief-quality-officer | no-harm chief-quality-officer | near-miss chief-quality-officer
 *
 * STATUTORY_REPORTING_CLOCKS (reproduced verbatim):
 *   sentinel-event-review:      45 days  — The Joint Commission Sentinel Event Policy — RCA2 and action plan within 45 days of awareness
 *   cms-immediate-jeopardy:     24 hours — 42 CFR 482 Conditions of Participation / State Operations Manual immediate-jeopardy notification
 *   state-adverse-event:         5 days  — State adverse-event reporting statute (jurisdiction-selected channel, statutory window)
 *   accreditation-notification: 30 days  — Accrediting-body notification of a reportable change in conditions
 *   Clocks are statutory and NOT input-configurable; there is no override input. Every clock
 *   runs from event.discoveredAt (organizational awareness), never from occurrence.
 *
 * DEADLINE_ESCALATION (reproduced verbatim):
 *   clinical-safety.regulatory-report-filing:  comfortable chief-quality-officer | warning chief-quality-officer | critical chief-medical-officer | breached chief-medical-officer
 *   clinical-safety.patient-family-disclosure: comfortable patient-safety-officer | warning patient-safety-officer | critical chief-medical-officer | breached chief-medical-officer
 *   Monotone by construction: gateExpert() returns whichever of {severity base, deadline
 *   escalation} is MORE senior, so a running clock can only ever raise seniority — a breached
 *   clock can never hand an irreversible clinical action to a more junior approver.
 *
 * AUTO-APPROVAL POLICY (reproduced verbatim):
 *   None of the five policy-gated clinical actions auto-approves at ANY severity. Harm-bearing
 *   severities (sentinel, severe-harm, moderate-harm, minor-harm) disable autoApproveAfterN
 *   entirely. The only breakpoint that may auto-approve is csq.closure.quality-committee-signoff,
 *   and only at no-harm / near-miss.
 *
 * BREAKPOINT ID SCOPING (regulatory filing):
 *   The design's breakpoints table pins breakpointId == actionId for every policy gate. That
 *   holds for the four gates raised at most once per run. The regulatory filing gate is the one
 *   exception: it is raised once per resolved statutory channel CONCURRENTLY inside a single
 *   ctx.parallel.map, so a bare 'clinical-safety.regulatory-report-filing' would reach the
 *   approver up to four times with nothing distinguishing which statutory channel is being
 *   authorized. Its breakpointId is therefore scoped per channel as
 *   `clinical-safety.regulatory-report-filing.<channelId>`, and the unscoped actionId is kept as
 *   its own routing field — carried in the payload (`actionId`), in the tags array, in every
 *   reportingLog entry, and passed to recordGate as the actionId argument — so the design's
 *   policy-matching intent (match on the action, not on the raise) still holds exactly.
 *   NEVER_AUTO_APPROVE_ACTIONS membership is likewise tested against the actionId, so the
 *   scoping cannot launder an irreversible action into an auto-approvable one.
 *
 * Hard rules: Style-A agent tasks only (zero kind:'shell'); every evidence-carrying outputSchema
 * declares evidence { type:'array', minItems:1 }; NO fallbacks — unknown or missing harm severity
 * throws, unknown routing/zone/channel lookup throws, an unreachable clinical approver throws, and
 * NO clinical, regulatory, or external action executes without an approved gate (each executor
 * task is referenced exactly once, inside its gate's approved branch — there is no alternate
 * execution path); the clock ledger is accumulated in the ORCHESTRATOR (never inside agents) so
 * the deadline auditor and the gate critics diff against ground truth the agents cannot rewrite.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../../../common-utilities/routed-gate-combinators.js';

// ---------------------------------------------------------------------------
// Harm model — frozen severity / routing / clock tables, throwing lookups
// ---------------------------------------------------------------------------

/**
 * NCC MERP / Joint Commission aligned harm ladder. 'non-event' is a CLASSIFICATION
 * OUTCOME permitting early exit — not a harm level — and deliberately never appears here.
 */
export const HARM_SEVERITIES = Object.freeze([
  'sentinel',
  'severe-harm',
  'moderate-harm',
  'minor-harm',
  'no-harm',
  'near-miss',
]);

/**
 * Total over HARM_SEVERITIES. Drives the fail-closed auto-approval rule: any harm-bearing
 * severity disables autoApproveAfterN entirely, everywhere.
 */
export const HARM_BEARING = Object.freeze({
  sentinel: true,
  'severe-harm': true,
  'moderate-harm': true,
  'minor-harm': true,
  'no-harm': false,
  'near-miss': false,
});

/**
 * Policy-gate routing per harm severity. Every row is TOTAL over HARM_SEVERITIES. `null`
 * means the action is NEVER raised at that severity — looking up its expert is an
 * orchestrator bug and throws (no default expert exists; fallbacks are forbidden).
 */
export const SEVERITY_ROUTING = Object.freeze({
  'clinical-safety.care-standard-suspension': Object.freeze({
    // TOTAL and never null: suspending a service line, device, or standing order is always
    // the CMO's call; severity does not dilute it. The gate is only RAISED when the
    // containment plan actually proposes a suspension action.
    sentinel: 'chief-medical-officer',
    'severe-harm': 'chief-medical-officer',
    'moderate-harm': 'chief-medical-officer',
    'minor-harm': 'chief-medical-officer',
    'no-harm': 'chief-medical-officer',
    'near-miss': 'chief-medical-officer',
  }),
  'clinical-safety.phi-data-handling': Object.freeze({
    // Not severity-driven, but kept TOTAL so lookups never miss.
    sentinel: 'privacy-officer',
    'severe-harm': 'privacy-officer',
    'moderate-harm': 'privacy-officer',
    'minor-harm': 'privacy-officer',
    'no-harm': 'privacy-officer',
    'near-miss': 'privacy-officer',
  }),
  'clinical-safety.regulatory-report-filing': Object.freeze({
    // Below moderate harm nothing is notifiable by this workflow's policy, so the gate is
    // never raised; asking for its expert is an orchestrator bug.
    sentinel: 'chief-quality-officer',
    'severe-harm': 'chief-quality-officer',
    'moderate-harm': 'chief-quality-officer',
    'minor-harm': null,
    'no-harm': null,
    'near-miss': null,
  }),
  'clinical-safety.patient-family-disclosure': Object.freeze({
    // Severity escalates the discloser from the patient-safety officer to the CMO. A
    // near-miss by definition never reached the patient, so the gate is never raised.
    sentinel: 'chief-medical-officer',
    'severe-harm': 'chief-medical-officer',
    'moderate-harm': 'patient-safety-officer',
    'minor-harm': 'patient-safety-officer',
    'no-harm': 'patient-safety-officer',
    'near-miss': null,
  }),
  'clinical-safety.clinical-pathway-activation': Object.freeze({
    // TOTAL and never null — changing care delivered to real patients always requires a
    // named clinical approver, regardless of what triggered the change.
    sentinel: 'chief-medical-officer',
    'severe-harm': 'chief-medical-officer',
    'moderate-harm': 'chief-medical-officer',
    'minor-harm': 'chief-quality-officer',
    'no-harm': 'chief-quality-officer',
    'near-miss': 'chief-quality-officer',
  }),
});

/**
 * Patient/family disclosure policy MODES, not free text:
 *   'required'            -> gate raised, disclosure mandatory
 *   'iff-reached-patient' -> gate raised only when the event actually reached the patient
 *   'not-raised'          -> gate never raised; recorded { required:false, raised:false }
 * presentAlwaysApprove is NEVER set on any clinical gate in this process.
 */
export const DISCLOSURE_POLICY = Object.freeze({
  sentinel: 'required',
  'severe-harm': 'required',
  'moderate-harm': 'required',
  'minor-harm': 'required',
  'no-harm': 'iff-reached-patient',
  'near-miss': 'not-raised',
});

/**
 * Statutory reporting clocks. NOT input-configurable — there is deliberately no override
 * input; a statute is not a knob. inputs.jurisdiction selects WHICH channels apply, never
 * how long their windows are. All clocks run from event.discoveredAt.
 */
export const STATUTORY_REPORTING_CLOCKS = Object.freeze({
  'sentinel-event-review': Object.freeze({
    days: 45,
    basis: 'The Joint Commission Sentinel Event Policy — RCA2 and action plan within 45 days of awareness',
  }),
  'cms-immediate-jeopardy': Object.freeze({
    hours: 24,
    basis: '42 CFR 482 Conditions of Participation / State Operations Manual immediate-jeopardy notification',
  }),
  'state-adverse-event': Object.freeze({
    days: 5,
    basis: 'State adverse-event reporting statute (jurisdiction-selected channel, statutory window)',
  }),
  'accreditation-notification': Object.freeze({
    days: 30,
    basis: 'Accrediting-body notification of a reportable change in conditions',
  }),
});

/**
 * Reportable channels per severity. TOTAL over HARM_SEVERITIES; empty arrays are explicit,
 * not missing keys. 'cms-immediate-jeopardy' is NOT severity-derived — it is added iff
 * immediate jeopardy is determined, at any severity, and is the shortest clock in the table.
 */
export const REPORTABLE_CHANNELS_BY_SEVERITY = Object.freeze({
  sentinel: Object.freeze(['sentinel-event-review', 'state-adverse-event', 'accreditation-notification']),
  'severe-harm': Object.freeze(['state-adverse-event', 'accreditation-notification']),
  'moderate-harm': Object.freeze(['state-adverse-event']),
  'minor-harm': Object.freeze([]),
  'no-harm': Object.freeze([]),
  'near-miss': Object.freeze([]),
});

/** Deadline zones, ordered from most to least remaining clock. */
export const DEADLINE_ZONES = Object.freeze(['comfortable', 'warning', 'critical', 'breached']);

/**
 * Deadline-driven escalation. Only the two clock-driven actions appear; looking up an
 * action that is not clock-driven THROWS (a caller bug, not a miss).
 */
export const DEADLINE_ESCALATION = Object.freeze({
  'clinical-safety.regulatory-report-filing': Object.freeze({
    comfortable: 'chief-quality-officer',
    warning: 'chief-quality-officer',
    critical: 'chief-medical-officer',
    breached: 'chief-medical-officer',
  }),
  'clinical-safety.patient-family-disclosure': Object.freeze({
    comfortable: 'patient-safety-officer',
    warning: 'patient-safety-officer',
    critical: 'chief-medical-officer',
    breached: 'chief-medical-officer',
  }),
});

/**
 * Seniority ranks for the four named clinical roles, so deadline escalation can only ever
 * RAISE seniority. Lookups go through seniorityOf(), which THROWS on an unranked role.
 */
export const EXPERT_SENIORITY = Object.freeze({
  'chief-medical-officer': 4,
  'chief-quality-officer': 3,
  'patient-safety-officer': 2,
  'privacy-officer': 2,
});

/**
 * The six independent contributing-factor analyses fanned out inside the RCA strand. Frozen
 * so the RCA-sufficiency critic can enumerate exactly which domains were required and detect
 * a silently skipped one.
 */
export const CONTRIBUTING_FACTOR_DOMAINS = Object.freeze([
  'human-factors',
  'equipment-and-device',
  'environment-and-staffing',
  'policy-and-procedure',
  'communication-and-handoff',
  'medication-and-order-process',
]);

/**
 * CAPA action-strength hierarchy — the CAPA-effectiveness critic's ground truth. A CAPA set
 * whose maximum tier is 1 (education only) is a FAIL.
 */
export const CAPA_STRENGTH_TIERS = Object.freeze({
  'forcing-function': 4,
  automation: 3,
  standardization: 2,
  'education-and-training': 1,
});

/**
 * The five irreversible clinical / regulatory actions. autoApproveAfterNFor() returns null
 * for every one of them at EVERY severity — no auto-approval exists for them anywhere in
 * this file. This is the single most important table in the process.
 */
export const NEVER_AUTO_APPROVE_ACTIONS = Object.freeze([
  'clinical-safety.regulatory-report-filing',
  'clinical-safety.clinical-pathway-activation',
  'clinical-safety.patient-family-disclosure',
  'clinical-safety.care-standard-suspension',
  'clinical-safety.phi-data-handling',
]);

/**
 * Containment-plan scopes whose actions are treated as suspensions is NOT inferred: the
 * planner marks each action with `suspension: true|false` and the orchestrator partitions on
 * that flag. A plan that claims suspensionRequested while flagging no action THROWS — an
 * unmarked suspension must never slip past the care-standard-suspension gate.
 */

/**
 * Harm-severity assertion. 'non-event' passes through as a classification outcome; anything
 * else must be in HARM_SEVERITIES or it THROWS. A MISSING severity hits the same throw — an
 * undetermined severity FAILS the run, it never routes to the lower-severity path.
 *
 * @param {string} value - The severity to validate
 * @param {string} source - Where the value came from (for the error message)
 * @returns {string} The validated severity
 */
export function assertHarmSeverity(value, source) {
  if (value === 'non-event') return value;
  if (!HARM_SEVERITIES.includes(value)) {
    throw new Error(
      `Unknown harm severity '${value}' from ${source} — expected one of ` +
      `${HARM_SEVERITIES.join('|')}|non-event. No fallback severity is applied; ` +
      'a clinical safety event is never silently downgraded.'
    );
  }
  return value;
}

/**
 * Severity routing lookup. THROWS on unknown action, unknown severity, and on actions that
 * are never raised at the given severity — there is deliberately no default expert.
 *
 * @param {string} actionId - One of the five policy-gated action ids
 * @param {string} severity - One of HARM_SEVERITIES
 * @returns {string} The expert route for the gate
 */
export function routingExpert(actionId, severity) {
  const row = SEVERITY_ROUTING[actionId];
  if (!row) {
    throw new Error(
      `SEVERITY_ROUTING: unknown policy-gated action '${actionId}'. ` +
      `Known actions: ${Object.keys(SEVERITY_ROUTING).join(', ')} — no fallback route exists.`
    );
  }
  if (!Object.prototype.hasOwnProperty.call(row, severity)) {
    throw new Error(
      `SEVERITY_ROUTING: unknown severity '${severity}' for action '${actionId}'. ` +
      `Known severities: ${HARM_SEVERITIES.join(', ')} — no fallback route exists.`
    );
  }
  const expert = row[severity];
  if (expert === null) {
    throw new Error(
      `SEVERITY_ROUTING: action '${actionId}' is never raised at ${severity} — ` +
      'looking up its expert is an orchestrator bug (no fallback expert exists).'
    );
  }
  return expert;
}

/**
 * Deadline escalation lookup. THROWS on an action that is not clock-driven and on an
 * unknown zone — there is deliberately no default expert and no default zone.
 *
 * @param {string} actionId - A clock-driven policy-gated action id
 * @param {string} zone - One of DEADLINE_ZONES
 * @returns {string} The escalated expert route
 */
export function deadlineExpert(actionId, zone) {
  const row = DEADLINE_ESCALATION[actionId];
  if (!row) {
    throw new Error(
      `DEADLINE_ESCALATION: '${actionId}' is not a clock-driven action. ` +
      `Clock-driven actions: ${Object.keys(DEADLINE_ESCALATION).join(', ')} — no fallback route exists.`
    );
  }
  if (!Object.prototype.hasOwnProperty.call(row, zone)) {
    throw new Error(
      `DEADLINE_ESCALATION: unknown deadline zone '${zone}' for action '${actionId}'. ` +
      `Known zones: ${DEADLINE_ZONES.join(', ')} — no fallback zone exists.`
    );
  }
  return row[zone];
}

/**
 * Seniority rank of a clinical approver role. THROWS on an unranked role — a role with no
 * rank cannot be compared and must not silently win or lose a routing contest.
 *
 * @param {string} expert - A clinical approver role
 * @returns {number} The seniority rank
 */
export function seniorityOf(expert) {
  if (!Object.prototype.hasOwnProperty.call(EXPERT_SENIORITY, expert)) {
    throw new Error(
      `EXPERT_SENIORITY: unranked clinical approver '${expert}' — cannot compare seniority, ` +
      `no fallback rank exists. Ranked roles: ${Object.keys(EXPERT_SENIORITY).join(', ')}.`
    );
  }
  return EXPERT_SENIORITY[expert];
}

/**
 * THE single routing entry point for every policy gate. Resolves the severity base (throws),
 * and when a deadline zone is supplied for a clock-driven action resolves the escalation
 * (throws) and returns whichever role is MORE senior — base winning ties. MONOTONE BY
 * CONSTRUCTION: the clock can only raise seniority, never lower it.
 *
 * @param {string} actionId - One of the five policy-gated action ids
 * @param {string} severity - One of HARM_SEVERITIES
 * @param {string|null} zone - A deadline zone, or null when no clock applies
 * @returns {string} The routed expert
 */
export function gateExpert(actionId, severity, zone) {
  const base = routingExpert(actionId, severity);
  if (zone === null || !Object.prototype.hasOwnProperty.call(DEADLINE_ESCALATION, actionId)) {
    return base;
  }
  const escalated = deadlineExpert(actionId, zone);
  return seniorityOf(escalated) > seniorityOf(base) ? escalated : base;
}

/**
 * Compute the deadline zone from a statutory clock. THROWS on non-finite inputs or a
 * deadline at/before the clock start — there is no fallback zone.
 *
 * remaining/total > 0.5 -> 'comfortable'; > 0.25 -> 'warning'; > 0 -> 'critical';
 * <= 0 -> 'breached'.
 *
 * @param {number} nowMs - Current epoch millis
 * @param {number} clockStartMs - Clock start epoch millis (organizational awareness)
 * @param {number} deadlineMs - Statutory deadline epoch millis
 * @returns {string} One of DEADLINE_ZONES
 */
export function deadlineZone(nowMs, clockStartMs, deadlineMs) {
  if (!Number.isFinite(nowMs) || !Number.isFinite(clockStartMs) || !Number.isFinite(deadlineMs)) {
    throw new Error(
      `deadlineZone: non-finite input (nowMs=${nowMs}, clockStartMs=${clockStartMs}, deadlineMs=${deadlineMs}) — no fallback zone exists.`
    );
  }
  if (deadlineMs <= clockStartMs) {
    throw new Error(
      `deadlineZone: deadline (${deadlineMs}) must be after clock start (${clockStartMs}) — no fallback zone exists.`
    );
  }
  const total = deadlineMs - clockStartMs;
  const remaining = deadlineMs - nowMs;
  const ratio = remaining / total;
  if (ratio > 0.5) return 'comfortable';
  if (ratio > 0.25) return 'warning';
  if (ratio > 0) return 'critical';
  return 'breached';
}

/**
 * Patient/family disclosure policy for one severity. THROWS on unknown severity and on an
 * unrecognized policy mode. presentAlwaysApprove is hard-coded false — no clinical gate ever
 * offers an always-approve affordance.
 *
 * @param {string} severity - One of HARM_SEVERITIES
 * @param {boolean} reachedPatient - Whether the event actually reached the patient
 * @returns {{ required: boolean, raised: boolean, presentAlwaysApprove: boolean }}
 */
export function disclosurePolicyFor(severity, reachedPatient) {
  if (!Object.prototype.hasOwnProperty.call(DISCLOSURE_POLICY, severity)) {
    throw new Error(
      `DISCLOSURE_POLICY: unknown severity '${severity}'. ` +
      `Known severities: ${HARM_SEVERITIES.join(', ')} — no fallback disclosure policy exists.`
    );
  }
  const mode = DISCLOSURE_POLICY[severity];
  if (mode === 'required') return { required: true, raised: true, presentAlwaysApprove: false };
  if (mode === 'iff-reached-patient') {
    return { required: reachedPatient === true, raised: reachedPatient === true, presentAlwaysApprove: false };
  }
  if (mode === 'not-raised') return { required: false, raised: false, presentAlwaysApprove: false };
  throw new Error(`DISCLOSURE_POLICY: unrecognized policy mode '${mode}' at severity ${severity}.`);
}

/**
 * Resolve the reportable channels for a severity. THROWS on unknown severity. Returns a
 * fresh array copy (the frozen row is never mutated), with 'cms-immediate-jeopardy'
 * prepended (deduped) when immediate jeopardy was determined.
 *
 * @param {string} severity - One of HARM_SEVERITIES
 * @param {boolean} immediateJeopardy - Whether immediate jeopardy was determined
 * @returns {string[]} The channel ids that must be filed
 */
export function reportableChannelsFor(severity, immediateJeopardy) {
  if (!Object.prototype.hasOwnProperty.call(REPORTABLE_CHANNELS_BY_SEVERITY, severity)) {
    throw new Error(
      `REPORTABLE_CHANNELS_BY_SEVERITY: unknown severity '${severity}'. ` +
      `Known severities: ${HARM_SEVERITIES.join(', ')} — no fallback channel set exists.`
    );
  }
  const channels = REPORTABLE_CHANNELS_BY_SEVERITY[severity].slice();
  if (immediateJeopardy === true && !channels.includes('cms-immediate-jeopardy')) {
    channels.unshift('cms-immediate-jeopardy');
  }
  return channels;
}

/**
 * Statutory window for one reporting channel. THROWS on an unknown channel — filing on an
 * invented deadline is worse than failing.
 *
 * @param {string} channelId - One of the STATUTORY_REPORTING_CLOCKS keys
 * @returns {{ channelId: string, windowMs: number, basis: string }}
 */
export function clockSpecFor(channelId) {
  const spec = STATUTORY_REPORTING_CLOCKS[channelId];
  if (!spec) {
    throw new Error(
      `STATUTORY_REPORTING_CLOCKS: unknown reporting channel '${channelId}'. ` +
      `Known channels: ${Object.keys(STATUTORY_REPORTING_CLOCKS).join(', ')} — ` +
      'no fallback statutory window exists.'
    );
  }
  const windowMs = typeof spec.days === 'number'
    ? spec.days * 24 * 60 * 60 * 1000
    : spec.hours * 60 * 60 * 1000;
  return { channelId, windowMs, basis: spec.basis };
}

/**
 * CAPA action-strength rank. THROWS on an unknown tier — the CAPA critic must not be able to
 * launder an unknown tier into a passing score.
 *
 * @param {string} tier - One of the CAPA_STRENGTH_TIERS keys
 * @returns {number} The strength rank
 */
export function capaStrengthOf(tier) {
  if (!Object.prototype.hasOwnProperty.call(CAPA_STRENGTH_TIERS, tier)) {
    throw new Error(
      `CAPA_STRENGTH_TIERS: unknown CAPA strength tier '${tier}'. ` +
      `Known tiers: ${Object.keys(CAPA_STRENGTH_TIERS).join(', ')} — no fallback tier rank exists.`
    );
  }
  return CAPA_STRENGTH_TIERS[tier];
}

/**
 * Auto-approval policy. Returns null for every one of the five irreversible clinical actions
 * at EVERY severity, and null at every harm-bearing severity for anything else. The only
 * value it ever returns is 1, for the closure signoff at 'no-harm' / 'near-miss'. THROWS on
 * an unknown severity. The orchestrator spreads the result so a null never reaches
 * routedBreakpoint at all.
 *
 * @param {string} breakpointId - The breakpoint about to be raised
 * @param {string} severity - One of HARM_SEVERITIES
 * @returns {number|null} The auto-approve threshold, or null when auto-approval is forbidden
 */
export function autoApproveAfterNFor(breakpointId, severity) {
  if (!Object.prototype.hasOwnProperty.call(HARM_BEARING, severity)) {
    throw new Error(
      `HARM_BEARING: unknown severity '${severity}' for breakpoint '${breakpointId}'. ` +
      `Known severities: ${HARM_SEVERITIES.join(', ')} — no fallback auto-approval policy exists.`
    );
  }
  if (NEVER_AUTO_APPROVE_ACTIONS.includes(breakpointId)) return null;
  if (HARM_BEARING[severity] === true) return null;
  if (breakpointId === 'csq.closure.quality-committee-signoff') return 1;
  return null;
}

/**
 * Approver reachability check, called immediately before EVERY policy-gated breakpoint. A
 * missing, empty, or non-string entry THROWS — the run FAILS rather than routing an
 * irreversible clinical action to a generic owner or downgrading to a lower-severity path.
 *
 * @param {string} expert - The routed clinical role
 * @param {object} approvers - inputs.approvers (role -> named person)
 * @param {string} actionId - The policy-gated action being routed
 * @param {string} severity - The severity the run is routing on
 * @returns {string} The routed role, unchanged
 */
export function assertApproverReachable(expert, approvers, actionId, severity) {
  const named = approvers && approvers[expert];
  if (typeof named !== 'string' || named.trim() === '') {
    throw new Error(
      `unreachable clinical approver: no named person for role '${expert}' required by ` +
      `'${actionId}' at severity ${severity} — the run FAILS rather than routing an irreversible ` +
      'clinical action to a generic owner or downgrading to a lower-severity path.'
    );
  }
  return expert;
}

// ---------------------------------------------------------------------------
// P1 — safety-event intake + harm classification
// ---------------------------------------------------------------------------

export const eventIntakeTask = defineTask('csq.event-intake', (args, taskCtx) => ({
  kind: 'agent',
  title: `Intake + classify safety event from ${args.event.source} (${args.jurisdiction})`,
  agent: {
    name: 'patient-safety-event-intake',
    prompt: {
      role: 'Patient-safety event intake analyst',
      task: 'Classify the safety event harm level and scope its reportability',
      context: args,
      instructions: [
        'Apply the harm ladder exactly: sentinel (death, permanent harm, or an always-review event regardless of outcome); severe-harm (temporary harm requiring life-sustaining intervention); moderate-harm (temporary harm requiring treatment or prolonged stay); minor-harm (temporary harm, no or minimal treatment); no-harm (reached the patient, caused no harm); near-miss (never reached the patient); non-event (not a safety event: duplicate, expected clinical course, or an administrative complaint).',
        'Apply the intake, harm-scoring, and reportability methods of specializations/domains/social-sciences-humanities/healthcare/patient-safety-event-reporting BY NAME — a lens, not a re-implementation.',
        'If you cannot determine a harm level from the record, say so explicitly with severity omitted — the orchestrator will FAIL the run. Never guess downward; never pick a lower severity because the evidence is thin.',
        'Set reachedPatient, immediateJeopardy, and phiInScope from the record. immediateJeopardy means a situation likely to cause serious injury or death imminently.',
        'Mint a stable kebab-case eventId from the event ref and discovery date.',
        'Cross-reference priorKnowledge (prior events with matching signatures, prior CAPAs on this unit/device) and list them in matchedPriorEvents.',
        'List candidate reportable channels you believe the facts trigger in the given jurisdiction — the orchestrator resolves the authoritative list from its frozen table, and a mismatch is a critic finding.',
        'Evidence entries must cite the concrete record fields, chart references, or prior-event facts grounding the classification — at least one entry.',
      ],
      outputFormat: 'JSON with eventId string, severity string, rationale string, reachedPatient boolean, immediateJeopardy boolean, phiInScope boolean, affectedUnits array, reportableCandidates array, matchedPriorEvents array, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['eventId', 'severity', 'rationale', 'reachedPatient', 'immediateJeopardy', 'phiInScope', 'affectedUnits', 'reportableCandidates', 'evidence'],
      properties: {
        eventId: { type: 'string' },
        severity: {
          type: 'string',
          enum: ['sentinel', 'severe-harm', 'moderate-harm', 'minor-harm', 'no-harm', 'near-miss', 'non-event'],
        },
        rationale: { type: 'string' },
        reachedPatient: { type: 'boolean' },
        immediateJeopardy: { type: 'boolean' },
        phiInScope: { type: 'boolean' },
        affectedUnits: { type: 'array' },
        reportableCandidates: { type: 'array' },
        matchedPriorEvents: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'intake'],
}));

// ---------------------------------------------------------------------------
// P2 — immediate patient-safety containment
// ---------------------------------------------------------------------------

export const containmentPlanTask = defineTask('csq.containment-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan immediate containment for ${args.severity} event ${args.eventId}`,
  agent: {
    name: 'patient-safety-containment-planner',
    prompt: {
      role: 'Patient-safety officer (containment planner)',
      task: 'Turn the event into an immediate patient-safety containment PLAN — a plan, not an execution',
      context: args,
      instructions: [
        'Every action carries: action, scope (patient|unit|service-line|device|order-set|enterprise), suspension boolean, reversible boolean, rollback (how to undo it), clinicalRisk (the risk of DOING it), riskOfInaction.',
        'Prefer the narrowest containment that removes the hazard; escalate scope only with a stated reason.',
        'Set an action suspension:true when that action suspends a service line, device, standing order, or clinician privilege, and set suspensionRequested true if ANY action does — those actions require the care-standard-suspension policy gate and you do not control it. suspensionRequested true with no action flagged suspension:true is an inconsistent plan and the orchestrator will FAIL the run.',
        'You must NOT execute anything. No orders, no EHR writes, no device removals, no notifications.',
        'Evidence entries must cite the intake findings or unit checks each action rests on — at least one entry.',
      ],
      outputFormat: 'JSON with actions array (minItems 1) of { action, scope, suspension, reversible, rollback, clinicalRisk, riskOfInaction }, suspensionRequested boolean, planSummary string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'suspensionRequested', 'planSummary', 'evidence'],
      properties: {
        actions: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['action', 'scope', 'suspension', 'reversible', 'rollback', 'riskOfInaction'],
            properties: {
              action: { type: 'string' },
              scope: { type: 'string', enum: ['patient', 'unit', 'service-line', 'device', 'order-set', 'enterprise'] },
              suspension: { type: 'boolean' },
              reversible: { type: 'boolean' },
              rollback: { type: 'string' },
              clinicalRisk: { type: 'string' },
              riskOfInaction: { type: 'string' },
            },
          },
        },
        suspensionRequested: { type: 'boolean' },
        planSummary: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'containment', 'plan'],
}));

export const unitContainmentCheckTask = defineTask('csq.unit-containment-check', (args, taskCtx) => ({
  kind: 'agent',
  title: `Unit containment check: ${args.unit} (${args.eventId})`,
  agent: {
    name: 'unit-safety-lead',
    prompt: {
      role: 'Unit safety lead',
      task: 'Check whether the hazard is still live on this specific unit',
      context: args,
      instructions: [
        'Check for the same device lot, order set, staffing pattern, or workflow on THIS unit only — do not generalize to other units.',
        'Report hazardStillLive with the concrete observation that establishes it.',
        'Report patientsPotentiallyExposed as a count or an explicit "unknown" with the reason — never a guessed number.',
        'Evidence entries must be the observations, logs, or inventory checks you actually performed on this unit — at least one entry.',
      ],
      outputFormat: 'JSON with unit string, hazardStillLive boolean, patientsPotentiallyExposed number|string, localFindings array, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['unit', 'hazardStillLive', 'patientsPotentiallyExposed', 'evidence'],
      properties: {
        unit: { type: 'string' },
        hazardStillLive: { type: 'boolean' },
        patientsPotentiallyExposed: { type: ['number', 'string'] },
        localFindings: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'containment', 'unit'],
}));

export const containmentExecuteTask = defineTask('csq.containment-execute', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved containment for ${args.severity} event ${args.eventId}`,
  agent: {
    name: 'containment-executor',
    prompt: {
      role: 'Containment executor',
      task: 'Execute EXACTLY the approved containment actions — nothing more',
      context: args,
      instructions: [
        'This task only ever runs on the action subset the orchestrator approved. Suspension actions appear here ONLY when the care-standard-suspension gate approved them.',
        'Execute the approved actions in order; do not improvise additional clinical changes.',
        'Log every action with an ISO timestamp and its outcome — these entries feed the orchestrator clock ledger and the dossier.',
        'If an action fails, stop, attempt its documented rollback, and report honestly with contained:false.',
        'Evidence entries must be the raw execution outputs/confirmations — at least one entry.',
      ],
      outputFormat: 'JSON with executed array of { action, scope, timestamp, outcome, reversible }, contained boolean, containmentSummary string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['executed', 'contained', 'containmentSummary', 'evidence'],
      properties: {
        executed: { type: 'array' },
        contained: { type: 'boolean' },
        containmentSummary: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'containment', 'execute', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P3 — parallel investigation strands
// ---------------------------------------------------------------------------

export const clinicalReviewTask = defineTask('csq.clinical-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Clinical review of ${args.severity} event ${args.eventId}`,
  agent: {
    name: 'clinical-peer-reviewer',
    prompt: {
      role: 'Clinical peer reviewer',
      task: 'Review the care delivered against the applicable standard of care and decision-support rules',
      context: args,
      instructions: [
        'Apply the rule-evaluation and alert-appropriateness methods of specializations/domains/social-sciences-humanities/healthcare/clinical-decision-support BY NAME, and the handoff/transition methods of specializations/domains/social-sciences-humanities/healthcare/care-coordination-protocol BY NAME — lenses, not re-implementations.',
        'State the applicable standard of care with its source and whether the delivered care met it.',
        'Identify every point where a decision-support rule fired, failed to fire, or was overridden, and whether the override was clinically reasonable.',
        'Keep the language blameless: name systems, rules, and decisions — never fault an individual clinician.',
        'When args.phiAccess === false you are working from de-identified material: say so and lower your stated confidence accordingly. Do NOT attempt to obtain PHI by another route.',
        'Evidence entries must cite chart references, rule logs, or protocol documents with locations — at least one entry.',
      ],
      outputFormat: 'JSON with standardOfCare string, metStandard boolean, cdsFindings array, careCoordinationFindings array, clinicalConfidence string (low|medium|high), evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['standardOfCare', 'metStandard', 'cdsFindings', 'clinicalConfidence', 'evidence'],
      properties: {
        standardOfCare: { type: 'string' },
        metStandard: { type: 'boolean' },
        cdsFindings: { type: 'array' },
        careCoordinationFindings: { type: 'array' },
        clinicalConfidence: { type: 'string', enum: ['low', 'medium', 'high'] },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'clinical-review'],
}));

export const rootCauseAnalysisTask = defineTask('csq.root-cause-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Root-cause analysis (pass ${args.pass}) for ${args.eventId}`,
  agent: {
    name: 'healthcare-rca-analyst',
    prompt: {
      role: 'Healthcare RCA2 analyst',
      task: 'Trace the causal chain from the proximate event to a SYSTEM cause',
      context: args,
      instructions: [
        'Apply the RCA2 method of specializations/domains/social-sciences-humanities/healthcare/root-cause-analysis-healthcare BY NAME — timeline, causal chain, 5-whys to a system level.',
        'The causal chain must be an ordered array of { step, why, level } where level is proximate|contributing|system. Stopping at "human error" or "staff did not follow policy" is NOT a system cause — ask why the system permitted or invited that action.',
        'Set systemCauseReached true ONLY when the final chain link is level "system" and names a design, process, staffing, or technology condition that can be changed.',
        'Fold in the six contributing-factor analyses in context; do not re-derive them.',
        'Set needsMoreSignal true only when another pass could genuinely change the verdict.',
        'Every evidence entry must be { source, excerpt, weight } grounded in material you actually read — at least one entry; never fabricate excerpts.',
      ],
      outputFormat: 'JSON with rootCause string|null, causalChain array (minItems 1) of { step, why, level }, systemCauseReached boolean, needsMoreSignal boolean, remainingQuestions array, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['causalChain', 'systemCauseReached', 'needsMoreSignal', 'evidence'],
      properties: {
        rootCause: { type: ['string', 'null'] },
        causalChain: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['step', 'why', 'level'],
            properties: {
              step: { type: 'string' },
              why: { type: 'string' },
              level: { type: 'string', enum: ['proximate', 'contributing', 'system'] },
            },
          },
        },
        systemCauseReached: { type: 'boolean' },
        needsMoreSignal: { type: 'boolean' },
        remainingQuestions: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'rca'],
}));

export const contributingFactorTask = defineTask('csq.contributing-factor', (args, taskCtx) => ({
  kind: 'agent',
  title: `Contributing-factor analysis: ${args.factorDomain} (${args.eventId})`,
  agent: {
    name: 'contributing-factor-analyst',
    prompt: {
      role: 'Contributing-factor analyst',
      task: 'Analyze this ONE factor domain independently',
      context: args,
      instructions: [
        'Analyze ONLY the factor domain named in context. Do not comment on the other domains — an independent read is the point.',
        'Report present true only when you can point at a concrete condition in this domain that contributed; "possible" is present:false with the reason stated.',
        'Rate contribution as primary|contributing|not-a-factor and say what would have to change for the condition to stop contributing.',
        'When args.phiAccess === false you are working from de-identified material: say so and lower your stated confidence. Do NOT seek PHI by another route.',
        'Evidence entries must cite the material you examined for THIS domain — at least one entry.',
      ],
      outputFormat: 'JSON with factorDomain string, present boolean, contribution string (primary|contributing|not-a-factor), findings array, changeRequired string|null, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['factorDomain', 'present', 'contribution', 'evidence'],
      properties: {
        factorDomain: { type: 'string' },
        present: { type: 'boolean' },
        contribution: { type: 'string', enum: ['primary', 'contributing', 'not-a-factor'] },
        findings: { type: 'array' },
        changeRequired: { type: ['string', 'null'] },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'contributing-factor'],
}));

export const harmAssessmentTask = defineTask('csq.harm-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Harm assessment for ${args.severity} event ${args.eventId}`,
  agent: {
    name: 'clinical-harm-assessor',
    prompt: {
      role: 'Clinical harm assessor',
      task: 'Characterize the harm actually sustained and its preventability',
      context: args,
      instructions: [
        'Apply the harm-scoring method of specializations/domains/social-sciences-humanities/healthcare/patient-safety-event-reporting BY NAME.',
        'State harmLevel independently of the intake classification — a disagreement is a finding, not an error to hide.',
        'Rate preventability (definitely|probably|possibly|not-preventable) with the clinical reasoning behind it.',
        'Report ongoingClinicalNeeds for the affected patient (further treatment, monitoring, follow-up) — this feeds the disclosure conversation.',
        'When args.phiAccess === false, work de-identified, say so, and lower stated confidence. Do not seek PHI by another route.',
        'Evidence entries must cite the clinical documentation supporting each judgement — at least one entry.',
      ],
      outputFormat: 'JSON with harmLevel string, agreesWithIntake boolean, preventability string, ongoingClinicalNeeds array, harmNarrative string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['harmLevel', 'agreesWithIntake', 'preventability', 'ongoingClinicalNeeds', 'evidence'],
      properties: {
        harmLevel: { type: 'string' },
        agreesWithIntake: { type: 'boolean' },
        preventability: { type: 'string', enum: ['definitely', 'probably', 'possibly', 'not-preventable'] },
        ongoingClinicalNeeds: { type: 'array' },
        harmNarrative: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'harm-assessment'],
}));

export const proactiveFmeaTask = defineTask('csq.proactive-fmea', (args, taskCtx) => ({
  kind: 'agent',
  title: `Proactive FMEA on the implicated process (${args.eventId})`,
  agent: {
    name: 'fmea-facilitator',
    prompt: {
      role: 'Healthcare FMEA facilitator',
      task: 'Run a proactive failure-mode analysis on the process this event exposed',
      context: args,
      instructions: [
        'Apply the FMEA method of specializations/domains/social-sciences-humanities/healthcare/fmea-healthcare BY NAME: process map -> failure modes -> effects -> severity/occurrence/detection -> RPN.',
        'Cover failure modes this event did NOT trigger but the same process permits — the point is the next event, not this one.',
        'Every failure mode carries severity, occurrence, detection, and the computed RPN; show the arithmetic.',
        'Evidence entries must cite the process documentation or observations behind each mode — at least one entry.',
      ],
      outputFormat: 'JSON with processScope string, failureModes array (minItems 1) of { mode, effect, severity, occurrence, detection, rpn }, highestRpnMode object, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['processScope', 'failureModes', 'evidence'],
      properties: {
        processScope: { type: 'string' },
        failureModes: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['mode', 'effect', 'severity', 'occurrence', 'detection', 'rpn'],
            properties: {
              mode: { type: 'string' },
              effect: { type: 'string' },
              severity: { type: 'number' },
              occurrence: { type: 'number' },
              detection: { type: 'number' },
              rpn: { type: 'number' },
            },
          },
        },
        highestRpnMode: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'fmea'],
}));

export const unitPracticeScanTask = defineTask('csq.unit-practice-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Practice-variance scan: ${args.unit} (${args.eventId})`,
  agent: {
    name: 'unit-practice-scanner',
    prompt: {
      role: 'Unit practice scanner',
      task: 'Scan this unit for the practice variance the event exposed',
      context: args,
      instructions: [
        'Scan THIS unit only for the same variance, workaround, or drift the event exposed.',
        'Report varianceFound with the concrete practice observed versus the documented standard.',
        'Report spreadRisk (whether the variance is likely present on units you did not scan) with your reason — do not assert it for units outside your scope.',
        'Evidence entries must be observations, audits, or records from this unit — at least one entry.',
      ],
      outputFormat: 'JSON with unit string, varianceFound boolean, observedPractice string, documentedStandard string, spreadRisk string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['unit', 'varianceFound', 'spreadRisk', 'evidence'],
      properties: {
        unit: { type: 'string' },
        varianceFound: { type: 'boolean' },
        observedPractice: { type: 'string' },
        documentedStandard: { type: 'string' },
        spreadRisk: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'practice-scan'],
}));

// ---------------------------------------------------------------------------
// P4 — CAPA design + dossier compile
// ---------------------------------------------------------------------------

export const capaDesignTask = defineTask('csq.capa-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design CAPA for ${args.severity} event ${args.eventId}`,
  agent: {
    name: 'capa-designer',
    prompt: {
      role: 'CAPA designer',
      task: 'Turn the root cause and contributing factors into corrective and preventive actions',
      context: args,
      instructions: [
        'Every CAPA item carries: title, linkedFactor (one of the six contributing-factor domains or the root cause), strengthTier (forcing-function|automation|standardization|education-and-training), a NAMED owner, a concrete dueDate, and its effectiveness measure.',
        'The action strength hierarchy is not decoration: at least one item MUST be forcing-function or automation unless you state, explicitly, why no stronger action than standardization is physically possible. An education-only CAPA set will be failed by the CAPA-effectiveness critic.',
        'Do NOT write "TBD" for an owner or a due date — an unassignable item is reported in the unassignable array with the reason.',
        'Set requiresLivePathwayChange true when any item changes a clinical pathway, order set, or decision-support rule in the live EHR — that change is policy-gated and you do not control the gate.',
        'Apply the high-reliability-organization and clinical-pathway-development methods of specializations/domains/social-sciences-humanities/healthcare BY NAME as design lenses.',
        'Evidence entries must link each item to the causal-chain link or contributing factor it addresses — at least one entry.',
      ],
      outputFormat: 'JSON with items array (minItems 1) of { title, linkedFactor, strengthTier, owner, dueDate, effectivenessMeasure }, requiresLivePathwayChange boolean, unassignable array, capaSummary string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['items', 'requiresLivePathwayChange', 'capaSummary', 'evidence'],
      properties: {
        items: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['title', 'linkedFactor', 'strengthTier', 'owner', 'dueDate', 'effectivenessMeasure'],
            properties: {
              title: { type: 'string' },
              linkedFactor: { type: 'string' },
              strengthTier: {
                type: 'string',
                enum: ['forcing-function', 'automation', 'standardization', 'education-and-training'],
              },
              owner: { type: 'string' },
              dueDate: { type: 'string' },
              effectivenessMeasure: { type: 'string' },
            },
          },
        },
        requiresLivePathwayChange: { type: 'boolean' },
        unassignable: { type: 'array' },
        capaSummary: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'capa'],
}));

export const dossierCompileTask = defineTask('csq.dossier-compile', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compile clinical safety dossier for ${args.eventId}`,
  agent: {
    name: 'clinical-safety-dossier-author',
    prompt: {
      role: 'Clinical safety dossier author',
      task: 'Compose the investigation dossier markdown at the supplied dossierPath',
      context: args,
      instructions: [
        'Write the dossier to the dossierPath in context and report that exact path back.',
        'Sections in order: Summary; Harm assessment; Timeline; Containment actions taken and withheld; Causal chain; Contributing factors (all six domains, including the ones found not to contribute); CAPA plan; Reportability determination; Disclosure plan; Open questions.',
        'The Timeline and Containment sections must reproduce the orchestrator-accumulated clock ledger in context VERBATIM with its timestamps — an independent critic will diff them against the run journal.',
        'The Contributing factors section must name all six required domains explicitly; a domain omitted because it was not a factor must still appear, marked not-a-factor.',
        'Language stays blameless throughout: name systems, processes, and decisions — never fault individuals.',
        'Do not soften or omit a finding because it is unflattering to the organization.',
      ],
      outputFormat: 'JSON with dossierPath string, sectionsWritten array, executiveSummary string, openQuestions array',
    },
    outputSchema: {
      type: 'object',
      required: ['dossierPath', 'sectionsWritten', 'executiveSummary'],
      properties: {
        dossierPath: { type: 'string' },
        sectionsWritten: { type: 'array' },
        executiveSummary: { type: 'string' },
        openQuestions: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'dossier'],
}));

// ---------------------------------------------------------------------------
// P5 — regulatory reporting + patient/family disclosure
// ---------------------------------------------------------------------------

export const regulatoryReportDraftTask = defineTask('csq.regulatory-report-draft', (args, taskCtx) => ({
  kind: 'agent',
  title: `Draft ${args.channel} report for ${args.severity} event ${args.eventId}`,
  agent: {
    name: 'regulatory-reporting-analyst',
    prompt: {
      role: 'Healthcare regulatory reporting analyst',
      task: 'Draft the mandated report body for ONE reporting channel — a DRAFT, not a submission',
      context: args,
      instructions: [
        'Draft for the single channel named in context only, against its statutory basis and deadline as given.',
        'Apply the reporting-content methods of specializations/domains/social-sciences-humanities/healthcare/cms-conditions-participation, joint-commission-survey-readiness, and quality-reporting-program BY NAME as content lenses for the channel in scope.',
        'Every factual assertion in the body must be traceable to the dossier — cite the dossier section for each.',
        'State the harm level, the system cause, and the CAPA plan honestly. Do not minimize, and do not speculate beyond the investigation.',
        'DRAFT ONLY: you must NOT submit, file, transmit, or notify anyone. Submission happens through a policy gate you do not control.',
        'When a redraft directive is present in context, revise ONLY the points named in the gate feedback and return the full body.',
        'Evidence entries must cite the dossier sections each assertion rests on — at least one entry.',
      ],
      outputFormat: 'JSON with channel string, reportBody string, assertionTrace array of { assertion, dossierSection }, completenessNotes array, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['channel', 'reportBody', 'assertionTrace', 'evidence'],
      properties: {
        channel: { type: 'string' },
        reportBody: { type: 'string' },
        assertionTrace: { type: 'array' },
        completenessNotes: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'regulatory', 'draft'],
}));

export const regulatoryReportSubmitTask = defineTask('csq.regulatory-report-submit', (args, taskCtx) => ({
  kind: 'agent',
  title: `File approved ${args.channel} report for ${args.eventId}`,
  agent: {
    name: 'regulatory-report-filer',
    prompt: {
      role: 'Regulatory report filer',
      task: 'File the gate-approved report body to its channel',
      context: args,
      instructions: [
        'This task only ever runs AFTER the clinical-safety.regulatory-report-filing gate approved the exact body in context — file that body verbatim.',
        'File to the channel named in context and to no other channel.',
        'Report the concrete submissionRef (confirmation number, portal receipt, or case id) and the ISO filedAt.',
        'If the filing fails, report submitted:false with the raw error — never claim a filing you did not complete.',
        'Evidence entries must be the raw submission confirmation — at least one entry.',
      ],
      outputFormat: 'JSON with submitted boolean, channel string, submissionRef string, filedAt string, body string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['submitted', 'channel', 'submissionRef', 'filedAt', 'evidence'],
      properties: {
        submitted: { type: 'boolean' },
        channel: { type: 'string' },
        submissionRef: { type: 'string' },
        filedAt: { type: 'string' },
        body: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'regulatory', 'submit', 'policy-gated'],
}));

export const disclosureDraftTask = defineTask('csq.disclosure-draft', (args, taskCtx) => ({
  kind: 'agent',
  title: `Draft patient/family disclosure for ${args.severity} event ${args.eventId}`,
  agent: {
    name: 'patient-disclosure-communicator',
    prompt: {
      role: 'Patient and family disclosure communicator',
      task: 'Draft the disclosure conversation plan and script — a DRAFT, not a conversation',
      context: args,
      instructions: [
        'Structure the plan: who attends (clinician, patient-safety officer, interpreter if needed), setting, what happened in plain language, what is known and not yet known, the ongoing clinical needs and plan, the expression of regret, and next steps including how findings will be shared.',
        'Plain language: no clinical jargon, no hedging that obscures what happened, no blame of any individual.',
        'State only what the investigation established. Do not speculate about cause, and do not promise a finding the investigation has not made.',
        'Apply the family-communication and transition methods of specializations/domains/social-sciences-humanities/healthcare/care-coordination-protocol BY NAME.',
        'DRAFT ONLY: you must NOT contact the patient or family. The conversation happens only after a policy gate you do not control approves it.',
        'When a redraft directive is present in context, revise ONLY the points named in the gate feedback and return the full plan.',
        'Evidence entries must cite the harm assessment and dossier sections grounding each statement — at least one entry.',
      ],
      outputFormat: 'JSON with script string, attendees array, setting string, knownUnknowns object, ongoingCarePlan string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['script', 'attendees', 'knownUnknowns', 'ongoingCarePlan', 'evidence'],
      properties: {
        script: { type: 'string' },
        attendees: { type: 'array' },
        setting: { type: 'string' },
        knownUnknowns: { type: 'object' },
        ongoingCarePlan: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'disclosure', 'draft'],
}));

export const disclosureConductTask = defineTask('csq.disclosure-conduct', (args, taskCtx) => ({
  kind: 'agent',
  title: `Conduct approved disclosure for ${args.eventId}`,
  agent: {
    name: 'disclosure-conductor',
    prompt: {
      role: 'Disclosure conductor',
      task: 'Conduct and document the gate-approved disclosure conversation',
      context: args,
      instructions: [
        'This task only ever runs AFTER the clinical-safety.patient-family-disclosure gate approved the exact plan in context — follow that plan.',
        'Document who attended, what was said, what the patient/family asked, and what was committed to.',
        'Do not extend commitments beyond the approved plan; a new commitment is a finding for follow-up, not something you grant in the room.',
        'Report conducted:false honestly if the conversation could not be held (patient unavailable, family declined) with the reason.',
        'Evidence entries must be the documentation record reference for the conversation — at least one entry.',
      ],
      outputFormat: 'JSON with conducted boolean, conversationRef string, attendees array, commitmentsMade array, followUpNeeded array, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['conducted', 'conversationRef', 'attendees', 'evidence'],
      properties: {
        conducted: { type: 'boolean' },
        conversationRef: { type: 'string' },
        attendees: { type: 'array' },
        commitmentsMade: { type: 'array' },
        followUpNeeded: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'disclosure', 'conduct', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P6 — practice change, PDSA, CAPA tracking, HRO spread, closure audit
// ---------------------------------------------------------------------------

export const practiceChangeDesignTask = defineTask('csq.practice-change-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Design clinical practice change for ${args.eventId}`,
  agent: {
    name: 'clinical-practice-change-designer',
    prompt: {
      role: 'Clinical practice change designer',
      task: 'Design the pathway / decision-support / documentation change the CAPA requires — a DESIGN, not an activation',
      context: args,
      instructions: [
        'Apply specializations/domains/social-sciences-humanities/healthcare/clinical-pathway-development BY NAME for the pathway change, clinical-decision-support BY NAME for any rule/alert change, and clinical-documentation-improvement BY NAME for any documentation or template change.',
        'Every change carries: target (pathway|order-set|cds-rule|documentation-template), the exact before and after, affectedPopulation, alertBurdenDelta, and its rollback.',
        'Assess the risk of the CHANGE itself, not only the risk it mitigates: alert fatigue, workflow disruption, and unintended populations.',
        'DESIGN ONLY: you must NOT write to the live EHR or activate any rule. Activation happens only after a policy gate you do not control approves it.',
        'Evidence entries must link each change to the CAPA item and causal-chain link it implements — at least one entry.',
      ],
      outputFormat: 'JSON with changes array (minItems 1) of { target, before, after, affectedPopulation, alertBurdenDelta, rollback }, changeRisks array, designSummary string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['changes', 'changeRisks', 'designSummary', 'evidence'],
      properties: {
        changes: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['target', 'before', 'after', 'affectedPopulation', 'rollback'],
            properties: {
              target: {
                type: 'string',
                enum: ['pathway', 'order-set', 'cds-rule', 'documentation-template'],
              },
              before: { type: 'string' },
              after: { type: 'string' },
              affectedPopulation: { type: 'string' },
              alertBurdenDelta: { type: 'string' },
              rollback: { type: 'string' },
            },
          },
        },
        changeRisks: { type: 'array' },
        designSummary: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'practice-change', 'design'],
}));

export const practiceChangeActivateTask = defineTask('csq.practice-change-activate', (args, taskCtx) => ({
  kind: 'agent',
  title: `Activate approved practice change for ${args.eventId}`,
  agent: {
    name: 'clinical-pathway-activator',
    prompt: {
      role: 'Clinical pathway activator',
      task: 'Activate EXACTLY the gate-approved changes in the live clinical system',
      context: args,
      instructions: [
        'This task only ever runs AFTER the clinical-safety.clinical-pathway-activation gate approved the exact change set in context — activate that set and nothing else.',
        'Activate in the stated order, verifying each change took effect before starting the next.',
        'Log every activation with an ISO timestamp, the target, and its verification result.',
        'If an activation fails or verifies wrong, STOP, execute its documented rollback, and report activated:false — a partially applied clinical rule is a hazard.',
        'Evidence entries must be the raw activation and verification outputs — at least one entry.',
      ],
      outputFormat: 'JSON with activated boolean, applied array of { target, timestamp, verification, rolledBack }, activationSummary string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['activated', 'applied', 'activationSummary', 'evidence'],
      properties: {
        activated: { type: 'boolean' },
        applied: { type: 'array' },
        activationSummary: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'practice-change', 'activate', 'policy-gated'],
}));

export const pdsaPlanTask = defineTask('csq.pdsa-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan PDSA effectiveness cycle for ${args.eventId}`,
  agent: {
    name: 'pdsa-facilitator',
    prompt: {
      role: 'PDSA facilitator',
      task: 'Design the measurement cycle that will prove whether the CAPA worked',
      context: args,
      instructions: [
        'Apply the PDSA method of specializations/domains/social-sciences-humanities/healthcare/pdsa-cycle-implementation BY NAME, and the measure-definition method of quality-reporting-program BY NAME.',
        'Every CAPA item gets at least one measure with: measure name, numerator, denominator, data source, baseline, target, and review date.',
        'A measure with no data source is not a measure — report it in the unmeasurable array with the reason rather than inventing a source.',
        'Define the explicit failure criterion: what result would mean the CAPA did NOT work and must be redesigned.',
        'Evidence entries must cite the CAPA items each measure covers — at least one entry.',
      ],
      outputFormat: 'JSON with measures array (minItems 1) of { capaItem, measure, numerator, denominator, dataSource, baseline, target, reviewDate }, unmeasurable array, failureCriterion string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['measures', 'failureCriterion', 'evidence'],
      properties: {
        measures: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['capaItem', 'measure', 'numerator', 'denominator', 'dataSource', 'reviewDate'],
            properties: {
              capaItem: { type: 'string' },
              measure: { type: 'string' },
              numerator: { type: 'string' },
              denominator: { type: 'string' },
              dataSource: { type: 'string' },
              baseline: { type: 'string' },
              target: { type: 'string' },
              reviewDate: { type: 'string' },
            },
          },
        },
        unmeasurable: { type: 'array' },
        failureCriterion: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'pdsa'],
}));

export const capaTrackingTask = defineTask('csq.capa-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Track ${args.items.length} CAPA items for ${args.eventId}`,
  agent: {
    name: 'capa-follow-through-tracker',
    prompt: {
      role: 'CAPA follow-through tracker',
      task: 'Create one tracking record per CAPA item',
      context: args,
      instructions: [
        'Create one tracking record per CAPA item, labeled clinical-safety plus the severity tag and the strength tier.',
        'Each record carries the item title, its NAMED owner, its concrete dueDate, and its effectiveness measure — there are no defaults; an item missing either is reported as-is, never silently filled in.',
        'If an equivalent record already exists, report it with action:"existed" instead of duplicating.',
        'Report the review checkpoint date from the PDSA plan for each item.',
      ],
      outputFormat: 'JSON with records array of { title, owner, dueDate, strengthTier, reviewDate, url?, action } where action is created|existed',
    },
    outputSchema: {
      type: 'object',
      required: ['records'],
      properties: {
        records: {
          type: 'array',
          items: {
            type: 'object',
            required: ['title', 'owner', 'dueDate', 'action'],
            properties: {
              title: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' },
              strengthTier: { type: 'string' },
              reviewDate: { type: 'string' },
              url: { type: 'string' },
              action: { type: 'string', enum: ['created', 'existed'] },
            },
          },
        },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'capa', 'tracking'],
}));

export const hroLearningTask = defineTask('csq.hro-learning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Spread learning from ${args.eventId} across the organization`,
  agent: {
    name: 'hro-learning-spreader',
    prompt: {
      role: 'High-reliability learning lead',
      task: 'Turn the event into organizational learning beyond the affected units',
      context: args,
      instructions: [
        'Apply the high-reliability-organization method of specializations/domains/social-sciences-humanities/healthcare/high-reliability-organization BY NAME: preoccupation with failure, reluctance to simplify, sensitivity to operations, commitment to resilience, deference to expertise.',
        'Identify units NOT involved in this event where the same latent condition plausibly exists, with the reason for each.',
        'Propose the learning vehicle per audience (safety huddle, grand rounds, simulation, policy update) — a vehicle, not a mass email.',
        'Do not propose education as a substitute for a stronger CAPA; state where education is the supplement and where a forcing function is required.',
        'Evidence entries must cite the unit scans or FMEA modes grounding each spread hypothesis — at least one entry.',
      ],
      outputFormat: 'JSON with spreadTargets array of { unit, latentCondition, rationale }, learningVehicles array of { audience, vehicle, owner }, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['spreadTargets', 'learningVehicles', 'evidence'],
      properties: {
        spreadTargets: { type: 'array' },
        learningVehicles: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'hro'],
}));

export const closureAuditTask = defineTask('csq.closure-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Audit statutory clocks and closure evidence for ${args.eventId}`,
  agent: {
    name: 'clinical-deadline-auditor',
    prompt: {
      role: 'Clinical compliance deadline auditor',
      task: 'Audit every statutory clock and assemble the closure evidence package at the supplied closureAuditPath',
      context: args,
      instructions: [
        'Write the closure audit to the closureAuditPath in context and report that exact path back.',
        'For every clock in the orchestrator-supplied ledger report { clockId, startedAt, deadlineAt, closedAt, marginMinutes, breached } — compute the margins yourself, do not restate numbers without checking them.',
        'Assemble the closure evidence package using specializations/domains/social-sciences-humanities/healthcare/quality-reporting-program, cms-conditions-participation, and joint-commission-survey-readiness BY NAME, and record the PHI handling decision using hipaa-compliance-program BY NAME (including a denied PHI gate, which is itself an auditable fact).',
        'A gate that was rejected, or a channel left unfiled, is part of the audit — report it, never omit it.',
        'Evidence entries must be the ledger entries and artifacts you actually read — at least one entry.',
      ],
      outputFormat: 'JSON with clocks array (minItems 1) of { clockId, startedAt, deadlineAt, closedAt, marginMinutes, breached }, anyBreached boolean, auditPath string, unfiledChannels array, rejectedGates array, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['clocks', 'anyBreached', 'auditPath', 'evidence'],
      properties: {
        clocks: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['clockId', 'startedAt', 'deadlineAt', 'breached'],
            properties: {
              clockId: { type: 'string' },
              startedAt: { type: 'string' },
              deadlineAt: { type: 'string' },
              closedAt: { type: ['string', 'null'] },
              marginMinutes: { type: 'number' },
              breached: { type: 'boolean' },
            },
          },
        },
        anyBreached: { type: 'boolean' },
        auditPath: { type: 'string' },
        unfiledChannels: { type: 'array' },
        rejectedGates: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csq', 'clinical-safety', 'closure', 'audit'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    event,
    jurisdiction,
    approvers,
    severityOverride = null,
    immediateJeopardy = false,
    phiHandlingRequested = false,
    practiceChangeRequested = null,
    proactiveFmeaRequested = false,
    maxRcaPasses = 3,
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
    artifactsDir,
  } = inputs || {};

  // -- Input validation: everything throws BEFORE any effect runs. ------------
  if (!event || !event.source || !event.ref || !event.narrative || !event.discoveredAt) {
    throw new Error(
      'clinical-safety-quality-workflow requires event { source, ref, narrative, discoveredAt, careSetting } — ' +
      'refusing to guess missing fields on a patient-safety event.'
    );
  }
  const clockStartMs = Date.parse(event.discoveredAt);
  if (!Number.isFinite(clockStartMs)) {
    throw new Error(
      `clinical-safety-quality-workflow: event.discoveredAt '${event.discoveredAt}' does not parse to a finite epoch — ` +
      'organizational awareness starts every statutory clock and cannot be guessed.'
    );
  }
  if (typeof jurisdiction !== 'string' || jurisdiction.trim() === '') {
    throw new Error(
      'clinical-safety-quality-workflow requires a jurisdiction string — it selects which reportable channels apply ' +
      'and there is no default jurisdiction.'
    );
  }
  if (!approvers || typeof approvers !== 'object') {
    throw new Error(
      'clinical-safety-quality-workflow requires an approvers map (role -> named person) — irreversible clinical ' +
      'actions are never routed to a generic owner.'
    );
  }
  // A caller-supplied override is validated against HARM_SEVERITIES ONLY — deliberately NOT
  // through assertHarmSeverity, whose 'non-event' pass-through exists for the intake agent's
  // CLASSIFICATION OUTCOME. 'non-event' asserted as an override would close a sentinel event
  // as a success with zero gates, zero statutory clocks, and zero disclosure. It is rejected.
  if (severityOverride !== null) {
    if (!HARM_SEVERITIES.includes(severityOverride)) {
      throw new Error(
        `clinical-safety-quality-workflow: invalid inputs.severityOverride '${severityOverride}' — expected one of ` +
        `${HARM_SEVERITIES.join('|')}. 'non-event' is a classification outcome the intake agent may reach from the ` +
        'record, NOT an override a caller may assert: asserting it would close the event with no containment, no ' +
        'gates, and no clocks. No fallback severity is applied.'
      );
    }
  }

  const artifactsRoot = artifactsDir ?? ctx.artifactsDir;
  const nowIso = () => new Date().toISOString();
  /**
   * Epoch-millis view of the harness clock, for the deadlineZone call sites ONLY.
   * The SDK ProcessContext contract is `now(): Date` (packages/babysitter-sdk/src/runtime/types.ts),
   * while deadlineZone takes epoch millis and THROWS on anything non-numeric — deliberately, so a
   * statutory deadline zone can never be computed from a coerced value. The conversion therefore
   * happens HERE, at the call site, and is itself a throw, not a fallback: a harness clock that is
   * neither a Date nor a finite epoch FAILS the run rather than inventing a zone.
   */
  const nowMs = () => {
    const raw = ctx.now();
    const ms = raw instanceof Date ? raw.getTime() : raw;
    if (!Number.isFinite(ms)) {
      throw new Error(
        `clinical-safety-quality-workflow: ctx.now() returned '${String(raw)}', which is neither a Date nor a finite ` +
        'epoch — the statutory deadline zone cannot be computed and no fallback clock exists.'
      );
    }
    return ms;
  };
  const affectedUnits = Array.isArray(event.affectedUnits) ? event.affectedUnits : [];

  // -- Orchestrator-owned state. Agents never write any of this. -------------
  const clockLedger = [];
  const recordClock = (clock, ledgerEvent, detail) => {
    clockLedger.push({ at: nowIso(), clock, event: ledgerEvent, detail });
  };
  const breakpointsHit = [];
  // ALWAYS present in outputs (possibly empty). Because all five clinical actions are in
  // NEVER_AUTO_APPROVE_ACTIONS, an irreversible entry here means the harness overrode this
  // process's own policy — it is additionally raised as an SLA breach, never silently accepted.
  const autoApprovals = [];
  const reportingLog = [];
  const disclosureLog = [];
  const perChannel = [];
  const artifacts = [];
  const slaBreaches = [];

  let eventId = null;
  let severity = null;
  let severityOverridden = false;
  let severityDowngraded = false;
  let reachedPatient = false;
  let intake = null;
  let containment = {
    plan: null,
    executed: null,
    contained: false,
    suspensionRequested: false,
    suspensionApproved: false,
    withheldActions: [],
  };
  let phi = { inScope: false, gateRaised: false, approved: false, handled: null };
  let investigation = {
    clinicalReview: null,
    rootCause: null,
    contributingFactors: [],
    harmAssessment: null,
    fmea: null,
    unitScans: [],
  };
  let investigationGate = null;
  let capa = { items: [], maxStrengthTier: null, pdsaPlan: null, tracked: [] };
  let practiceChange = { designed: null, gateRaised: false, approved: false, activated: null };
  let kipFactsAsserted = 0;
  let clockStartedAt = null;

  const recordGate = (breakpointId, actionId, expert, phase, result) => {
    breakpointsHit.push(breakpointId);
    const auto =
      result && (result.autoApproved === true || (result.metadata && result.metadata.autoApproved === true));
    if (auto) {
      const record = {
        breakpointId,
        actionId,
        severity,
        expert,
        phase,
        at: nowIso(),
        // Tested against the actionId FIRST: the regulatory filing gate's breakpointId is scoped
        // per statutory channel (see BREAKPOINT ID SCOPING in the header), so an id-only test
        // would launder an irreversible action into a non-irreversible auto-approval record.
        irreversible:
          NEVER_AUTO_APPROVE_ACTIONS.includes(actionId) || NEVER_AUTO_APPROVE_ACTIONS.includes(breakpointId),
        reason: 'harness auto-approval in non-interactive mode',
      };
      autoApprovals.push(record);
      if (record.irreversible) {
        slaBreaches.push(`auto-approval-of-irreversible-clinical-action: ${breakpointId}`);
      }
      recordClock('gate', 'auto-approved', breakpointId);
    }
    return result;
  };

  const buildResult = (success, reason) => ({
    success,
    eventId,
    severity,
    reachedPatient,
    containment,
    phi,
    investigation,
    investigationGate,
    capa,
    reportingLog,
    disclosureLog,
    practiceChange,
    clocks: { startedAt: clockStartedAt, perChannel, ledger: clockLedger },
    autoApprovals,
    kipFactsAsserted,
    slaBreaches,
    artifacts,
    metadata: {
      processId: 'specializations/domains/social-sciences-humanities/healthcare/clinical-safety-quality-workflow',
      runId: ctx.runId,
      jurisdiction,
      clockLedger,
      breakpointsHit,
      severityOverridden,
      severityDowngraded,
      autoApprovalRecords: autoApprovals,
      ...(reason ? { reason } : {}),
    },
  });

  // -------------------------------------------------------------------------
  // P0 — kip recall of prior clinical-safety memory
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P0: kip recall of prior clinical-safety memory');
  let priorKnowledge = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  const signatureString =
    `clinical safety signature: ${event.narrative} [${event.careSetting}; units: ${affectedUnits.join(', ')}]`;
  if (kipEnabled) {
    priorKnowledge = await kipRecall(ctx, {
      kipDir,
      topic: signatureString,
      kipModel,
      kind: 'clinical-safety',
    });
    recordClock('intake', 'kip-recall', `factCount=${priorKnowledge.factCount}`);
  }

  // -------------------------------------------------------------------------
  // P1 — intake, harm classification, statutory clock start
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P1: safety-event intake + harm-severity classification');
  intake = await ctx.task(eventIntakeTask, {
    event,
    jurisdiction,
    priorKnowledge,
    immediateJeopardyHint: immediateJeopardy === true,
  });
  eventId = intake.eventId;
  // Missing or unknown severity FAILS the run — there is no lower-severity default.
  severity = assertHarmSeverity(intake.severity, 'csq.event-intake');
  reachedPatient = intake.reachedPatient === true;

  if (severityOverride !== null && severityOverride !== severity) {
    // Both ranks are always resolvable. severityOverride is validated against HARM_SEVERITIES
    // above, and 'non-event' is the ONLY unranked classification the intake can return — it sits
    // BELOW every harm level, so overriding it with any harm level is an escalation.
    const classifiedRank = severity === 'non-event' ? HARM_SEVERITIES.length : HARM_SEVERITIES.indexOf(severity);
    const overrideRank = HARM_SEVERITIES.indexOf(severityOverride);
    // A LOWER index is a MORE severe harm level. Anything that is NOT STRICTLY more severe than
    // the classification counts as a downgrade — the telemetry that exists to catch a silently
    // softened safety event never reports 'not a downgrade' because a rank failed to resolve.
    severityDowngraded = !(overrideRank < classifiedRank);
    recordClock(
      'intake',
      'severity-overridden',
      `classified=${severity} override=${severityOverride} downgraded=${severityDowngraded}`
    );
    severity = severityOverride;
    severityOverridden = true;
  }
  recordClock('intake', 'classified', `${severity}: ${intake.rationale}`);

  if (severity === 'non-event') {
    return buildResult(true, 'classified non-event: no containment, no gates raised, no clocks opened');
  }

  const sevTag = severity;
  const immediateJeopardyEffective = immediateJeopardy === true || intake.immediateJeopardy === true;

  clockStartedAt = event.discoveredAt;
  const resolvedChannels = reportableChannelsFor(severity, immediateJeopardyEffective);
  const clockByChannel = new Map();
  for (const channelId of resolvedChannels) {
    const spec = clockSpecFor(channelId);
    const deadlineMs = clockStartMs + spec.windowMs;
    const entry = {
      channelId,
      startedAt: clockStartedAt,
      deadlineAt: new Date(deadlineMs).toISOString(),
      deadlineMs,
      closedAt: null,
      marginMinutes: null,
      breached: false,
      basis: spec.basis,
    };
    perChannel.push(entry);
    clockByChannel.set(channelId, entry);
    recordClock(channelId, 'clock-started', `deadline=${entry.deadlineAt} basis=${spec.basis}`);
  }

  const logUnraisedChannels = (reason) => {
    for (const channelId of Object.keys(STATUTORY_REPORTING_CLOCKS)) {
      if (resolvedChannels.includes(channelId)) continue;
      reportingLog.push({
        actionId: 'clinical-safety.regulatory-report-filing',
        channel: channelId,
        severity,
        zone: null,
        expert: null,
        required: false,
        raised: false,
        approved: false,
        submitted: false,
        deadlineAt: null,
        breached: false,
        reason,
      });
    }
  };

  // -------------------------------------------------------------------------
  // P2 — immediate patient-safety containment (gated suspension, gated PHI)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P2: containment plan, unit checks, suspension + PHI gates');
  const plan = await ctx.task(containmentPlanTask, {
    eventId,
    severity,
    event,
    intake,
    priorKnowledge,
  });
  containment = { ...containment, plan, suspensionRequested: plan.suspensionRequested === true };
  recordClock('containment', 'planned', plan.planSummary);

  const unitChecks = affectedUnits.length > 0
    ? await ctx.parallel.map(affectedUnits, (unit) =>
      ctx.task(unitContainmentCheckTask, { unit, eventId, severity, intake, event }))
    : [];
  recordClock('containment', 'unit-checks', `${unitChecks.length} units checked`);

  const suspensionActions = plan.actions.filter((action) => action.suspension === true);
  if (containment.suspensionRequested && suspensionActions.length === 0) {
    throw new Error(
      `csq.containment-plan returned suspensionRequested:true with no action flagged suspension:true for event ${eventId} — ` +
      'the plan is inconsistent and an unmarked suspension must never bypass the care-standard-suspension gate. ' +
      'No fallback partition is inferred.'
    );
  }

  let approvedActions = plan.actions;
  if (containment.suspensionRequested) {
    const suspensionActionId = 'clinical-safety.care-standard-suspension';
    const suspensionExpert = assertApproverReachable(
      gateExpert(suspensionActionId, severity, null),
      approvers,
      suspensionActionId,
      severity
    );
    const suspensionGate = await routedBreakpoint(ctx, {
      question: `Approve suspension of the named service line / device / standing order for ${severity} event ${eventId}?`,
      plan,
      suspensionActions,
      riskOfInaction: suspensionActions.map((a) => ({ action: a.action, riskOfInaction: a.riskOfInaction })),
      unitChecks,
      harmSoFar: intake.rationale,
    }, {
      breakpointId: suspensionActionId,
      expert: suspensionExpert,
      tags: ['policy-gated', 'clinical-safety', 'containment', sevTag],
      strategy: 'single',
      // Deliberately NO autoApproveAfterN — the id is in NEVER_AUTO_APPROVE_ACTIONS.
    });
    recordGate(suspensionActionId, suspensionActionId, suspensionExpert, 'P2', suspensionGate);
    if (suspensionGate.approved === true) {
      containment = { ...containment, suspensionApproved: true };
      recordClock('containment', 'suspension-approved', `${suspensionActions.length} suspension actions approved`);
    } else {
      // Fail closed: the suspension actions are NEVER executed. The rest still runs.
      approvedActions = plan.actions.filter((action) => action.suspension !== true);
      containment = { ...containment, withheldActions: suspensionActions };
      recordClock('containment', 'suspension-withheld', `${suspensionActions.length} suspension actions withheld — gate not approved`);
    }
  }

  phi = { ...phi, inScope: intake.phiInScope === true };
  if (intake.phiInScope === true || phiHandlingRequested === true) {
    const phiActionId = 'clinical-safety.phi-data-handling';
    const phiExpert = assertApproverReachable(
      gateExpert(phiActionId, severity, null),
      approvers,
      phiActionId,
      severity
    );
    phi = { ...phi, gateRaised: true };
    const phiGate = await routedBreakpoint(ctx, {
      question: `Approve moving/exporting/deleting PHI for the investigation of ${eventId}?`,
      phiScope: intake.phiInScope === true ? 'intake determined PHI is in scope' : 'PHI handling requested by the caller',
      systems: event.deviceRefs ?? [],
      minimumNecessaryJustification: 'Investigation of a patient-safety event under the organization quality-improvement privilege',
      retentionPlan: 'Retained with the investigation dossier under the quality-assurance retention schedule',
    }, {
      breakpointId: phiActionId,
      expert: phiExpert,
      tags: ['policy-gated', 'clinical-safety', 'phi', sevTag],
      strategy: 'single',
      // Deliberately NO autoApproveAfterN — the id is in NEVER_AUTO_APPROVE_ACTIONS.
    });
    recordGate(phiActionId, phiActionId, phiExpert, 'P2', phiGate);
    phi = { ...phi, approved: phiGate.approved === true };
    recordClock('phi', phi.approved ? 'phi-approved' : 'phi-denied', `expert=${phiExpert}`);
  }
  // Explicit, recorded branch — not a fallback. When the gate was raised and DENIED every
  // downstream investigation task is told to work de-identified; no task reads PHI by another
  // route. When no PHI is in scope at all there is no PHI restriction to apply.
  const phiAccess = phi.gateRaised === true ? phi.approved === true : true;

  if (approvedActions.length > 0) {
    // The ONLY invocation of the containment executor in this file, on the approved subset.
    const executed = await ctx.task(containmentExecuteTask, {
      eventId,
      severity,
      approvedActions,
      withheldActions: containment.withheldActions,
    });
    // NO FALLBACK: the executed action list IS the containment ledger. A result that claims
    // contained:true while omitting it is unverifiable, and defaulting it to [] would let a
    // silent executor produce an empty ledger while its contained:true is still honoured.
    if (!Array.isArray(executed.executed)) {
      throw new Error(
        `csq.containment-execute returned no executed array for event ${eventId} (contained=${executed.contained}) — ` +
        'the executed action list is the containment ledger and is never defaulted to empty. ' +
        'A result reporting contained:true with no executed actions is unverifiable; the run FAILS.'
      );
    }
    containment = { ...containment, executed, contained: executed.contained === true };
    for (const act of executed.executed) {
      recordClock('containment', 'action-executed', `${act.action} -> ${act.outcome}`);
    }
  } else {
    containment = { ...containment, contained: false };
    recordClock('containment', 'nothing-executed', 'no containment action was approved — nothing was executed');
  }

  // -------------------------------------------------------------------------
  // P3 — parallel investigation strands
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P3: parallel investigation — clinical review, RCA, harm, FMEA, unit scans');
  const strandArgs = { eventId, severity, event, intake, priorKnowledge, phiAccess };

  const rcaLoop = async () => {
    // Six independent contributing-factor analyses first — none sees another's output.
    const factors = await ctx.parallel.all(
      CONTRIBUTING_FACTOR_DOMAINS.map((factorDomain) => () =>
        ctx.task(contributingFactorTask, { ...strandArgs, factorDomain }))
    );
    let current = null;
    for (let pass = 1; pass <= maxRcaPasses; pass++) {
      current = await ctx.task(rootCauseAnalysisTask, {
        ...strandArgs,
        pass,
        previousFindings: current,
        contributingFactors: factors,
      });
      if (current.systemCauseReached === true && current.needsMoreSignal === false) break;
    }
    // Exhausting the loop without a system cause does NOT fail the phase — it is carried
    // forward as systemCauseReached:false into the adversarial gate, where the RCA-sufficiency
    // critic fails it. The process never papers over a shallow RCA.
    return { rca: current, factors };
  };

  const fmeaNeeded =
    severity === 'sentinel' || severity === 'severe-harm' || proactiveFmeaRequested === true;

  const strandResults = await ctx.parallel.all([
    () => ctx.task(clinicalReviewTask, strandArgs),
    () => rcaLoop(),
    () => ctx.task(harmAssessmentTask, strandArgs),
    () => (affectedUnits.length > 0
      ? ctx.parallel.map(affectedUnits, (unit) => ctx.task(unitPracticeScanTask, { ...strandArgs, unit }))
      : Promise.resolve([])),
    // Conditional strand appended LAST so positional destructuring of the fixed four is stable.
    ...(fmeaNeeded ? [() => ctx.task(proactiveFmeaTask, strandArgs)] : []),
  ]);

  const [clinicalReview, rcaStrand, harmAssessment, unitScans] = strandResults;
  investigation = {
    clinicalReview,
    rootCause: rcaStrand.rca,
    contributingFactors: rcaStrand.factors,
    harmAssessment,
    fmea: fmeaNeeded ? strandResults[4] : null,
    unitScans,
  };
  recordClock('investigation', 'strands-complete', `systemCauseReached=${rcaStrand.rca.systemCauseReached} factors=${rcaStrand.factors.length} unitScans=${unitScans.length}`);

  // -------------------------------------------------------------------------
  // P4 — CAPA design + dossier + adversarial investigation-sufficiency gate
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P4: CAPA design, dossier compile, adversarial investigation-sufficiency gate');
  const capaDesign = await ctx.task(capaDesignTask, {
    ...strandArgs,
    investigation,
    contributingFactorDomains: CONTRIBUTING_FACTOR_DOMAINS,
  });
  // Strength is computed HERE, with capaStrengthOf(), so the critic is handed a number the
  // drafting agent did not produce. An unknown tier throws.
  let computedMaxStrengthTier = null;
  let computedMaxStrengthRank = 0;
  for (const item of capaDesign.items) {
    const rank = capaStrengthOf(item.strengthTier);
    if (rank > computedMaxStrengthRank) {
      computedMaxStrengthRank = rank;
      computedMaxStrengthTier = item.strengthTier;
    }
  }
  capa = { ...capa, items: capaDesign.items, maxStrengthTier: computedMaxStrengthTier };
  recordClock('capa', 'designed', `${capaDesign.items.length} items maxStrengthTier=${computedMaxStrengthTier}`);

  const dossierPath = `${artifactsRoot}/clinical-safety-dossier-${eventId}.md`;
  const dossier = await ctx.task(dossierCompileTask, {
    eventId,
    severity,
    event,
    intake,
    investigation,
    capaDesign,
    containment,
    phi,
    clockLedger,
    requiredChannels: resolvedChannels,
    contributingFactorDomains: CONTRIBUTING_FACTOR_DOMAINS,
    dossierPath,
  });
  artifacts.push(dossier.dossierPath);
  recordClock('investigation', 'dossier-compiled', dossier.dossierPath);

  const gateResult = await adversarialGate(ctx, {
    gateId: 'csq.investigation-sufficiency',
    artifact: {
      path: dossier.dossierPath,
      description: 'Clinical safety investigation dossier (RCA + harm assessment + CAPA)',
    },
    critics: [
      {
        name: 'rca-sufficiency-critic',
        role: 'RCA2 sufficiency auditor',
        focus: 'does the causal chain actually reach a SYSTEM cause, or does it stop at human error — EXECUTE the walk: read the Causal chain section, walk every link in order, and for the terminal link state whether it names a changeable design/process/staffing/technology condition; a chain terminating in "staff error", "failure to follow policy", "lapse in judgement", or "training gap" is a FAIL. Also verify all six contributingFactorDomains in context appear in the dossier (including any marked not-a-factor) — a silently omitted domain is a FAIL. Cite file:line for every link you evaluated.',
      },
      {
        name: 'capa-effectiveness-critic',
        role: 'CAPA strength auditor',
        focus: 'EXECUTE the strength scoring: enumerate every CAPA item from the dossier, read off its strengthTier, compute the maximum tier yourself against the capaStrengthTiers table in context, and compare it with the orchestrator-computed computedMaxStrengthTier. An education-and-training-only CAPA set (max tier 1) is a FAIL unless the dossier states explicitly why no stronger action is physically possible. Every item must have a NAMED owner, a concrete dueDate, and an effectiveness measure — a TBD is a FAIL. Every contributing factor rated primary or contributing must be addressed by at least one item. Cite file:line per item.',
      },
      {
        name: 'harm-attribution-critic',
        role: 'Harm attribution auditor',
        focus: 'EXECUTE the cross-check: diff the dossier stated harm level against the harm assessment and the clinical documentation cited, and against the severity the run routed on. A harm level asserted more favorably than the documentation supports is a FAIL. The preventability rating must be supported by the causal chain, not asserted. Cite file:line for each comparison.',
      },
      {
        name: 'reportability-critic',
        role: 'Regulatory reportability auditor',
        focus: 'EXECUTE the coverage check: enumerate the channels the facts trigger under the jurisdiction and severity in context, compare against the requiredChannels list supplied by the orchestrator AND against the dossier Reportability determination section. A channel the facts trigger but the dossier omits is a FAIL — an unreported notifiable event is the highest-consequence defect this gate exists to catch. Also verify each channel statutory deadline in the dossier matches the clock ledger in context. Cite file:line.',
      },
    ],
    ironLaw: [
      'Executed evidence only: run the actual cross-checks (walk the causal chain link by link, enumerate the CAPA items and score their tiers, diff the reportable channels against the orchestrator-supplied list and the clock ledger) — a read-only skim is not evidence.',
      'Cite file:line or executed-check output for every claim; passed:true with empty evidence is rejected by the combinator.',
      'This is a patient-safety artifact. A finding you soften is a patient who is harmed next time — report every issue at its true severity.',
      'You may not accept a promise of a future fix. Only what is in the dossier now counts.',
      // TERMINAL instruction by construction. The combinator assembles the critic prompt as
      // [...IRON_LAW_BLOCK, ...ironLaw, ...critic.instructions] (routed-gate-combinators.js),
      // so its own shape line is followed by these gate-specific laws — this entry re-pins the
      // SAME {passed, issues[], evidence[]} shape (never a different one) as the LAST thing the
      // critic reads. It must stay last in this array.
      'Return JSON exactly as { passed, issues[], evidence[] } — passed:true with an empty evidence array is rejected.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      clockLedger,
      contributingFactorDomains: CONTRIBUTING_FACTOR_DOMAINS,
      capaStrengthTiers: CAPA_STRENGTH_TIERS,
      computedMaxStrengthTier,
      requiredChannels: resolvedChannels,
      severity,
      jurisdiction,
      harmAssessment: investigation.harmAssessment,
      causalChain: investigation.rootCause ? investigation.rootCause.causalChain : null,
      unitScans: investigation.unitScans,
    },
  });
  investigationGate = {
    passed: gateResult.passed,
    attempts: gateResult.attempts,
    escalated: gateResult.escalated,
    issues: gateResult.issues,
    evidence: gateResult.evidence,
  };
  if (gateResult.escalated) {
    breakpointsHit.push('csq.investigation-sufficiency.gate-escalation');
    // KNOWN LIMITATION: adversarialGate hard-codes the escalation expert as 'owner'. The
    // combinator is NOT forked; the clinical expert that WOULD have been routed is recorded
    // so the safety-critical routing stays visible.
    recordClock('gate', 'investigation-sufficiency-escalated', 'combinator expert=owner intendedClinicalExpert=chief-quality-officer');
  }
  recordClock('gate', 'investigation-sufficiency', `passed=${gateResult.passed} attempts=${gateResult.attempts} escalated=${gateResult.escalated}`);

  if (investigationGate.passed !== true) {
    // HARD STOP. No regulatory filing gate, no disclosure gate, no practice-change gate is
    // ever raised: an unverified investigation can never become an external filing or a
    // family conversation.
    for (const channelId of resolvedChannels) {
      const clock = clockByChannel.get(channelId);
      reportingLog.push({
        actionId: 'clinical-safety.regulatory-report-filing',
        channel: channelId,
        severity,
        zone: null,
        expert: null,
        required: true,
        raised: false,
        approved: false,
        submitted: false,
        deadlineAt: clock.deadlineAt,
        breached: true,
        reason: 'investigation gate failed',
      });
      slaBreaches.push(`unfiled-required-channel: ${channelId} (investigation gate failed)`);
    }
    logUnraisedChannels('investigation gate failed');
    const blockedPolicy = disclosurePolicyFor(severity, reachedPatient);
    disclosureLog.push({
      actionId: 'clinical-safety.patient-family-disclosure',
      severity,
      zone: null,
      expert: null,
      required: blockedPolicy.required,
      raised: false,
      approved: false,
      conducted: false,
      reason: 'investigation gate failed',
    });
    if (blockedPolicy.required) {
      slaBreaches.push('undisclosed-required-event: investigation gate failed');
    }
    return buildResult(
      false,
      'investigation-sufficiency gate failed — no regulatory filing, disclosure, or practice change was attempted'
    );
  }

  // -------------------------------------------------------------------------
  // P5 — policy-gated regulatory filing + policy-gated patient/family disclosure
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P5: policy-gated regulatory reporting + patient/family disclosure');
  logUnraisedChannels('not reportable at this severity under this policy');

  /**
   * Read a rejecting approver's stated rationale. NO FALLBACK: an approver who supplies neither
   * a response nor a feedback string (or supplies an empty one) is recorded as EXACTLY that —
   * `{ rationale: null, rationaleProvided: false }`. Their silence is NEVER rewritten into a
   * synthetic reason and then handed to the redrafting agent or written into the statutory clock
   * ledger as if it were approver text. The two states are distinguishable everywhere they land.
   *
   * @param {object} gate - The BreakpointResult from a rejected policy gate
   * @returns {{ rationale: string|null, rationaleProvided: boolean }}
   */
  const readGateRationale = (gate) => {
    const fromResponse = typeof gate.response === 'string' && gate.response.trim() !== '' ? gate.response : null;
    const fromFeedback = typeof gate.feedback === 'string' && gate.feedback.trim() !== '' ? gate.feedback : null;
    const rationale = fromResponse !== null ? fromResponse : fromFeedback;
    return { rationale, rationaleProvided: rationale !== null };
  };

  const reportActionId = 'clinical-safety.regulatory-report-filing';
  const fileGatedReport = async (channelId) => {
    const clock = clockByChannel.get(channelId);
    const zone = deadlineZone(nowMs(), clockStartMs, clock.deadlineMs);
    // Per-channel breakpointId; the unscoped actionId stays a routing field of its own.
    // See BREAKPOINT ID SCOPING in the file header.
    const channelBreakpointId = `${reportActionId}.${channelId}`;
    const expert = assertApproverReachable(
      gateExpert(reportActionId, severity, zone),
      approvers,
      reportActionId,
      severity
    );
    const entry = {
      actionId: reportActionId,
      channel: channelId,
      severity,
      zone,
      expert,
      required: true,
      raised: true,
      approved: false,
      submitted: false,
      deadlineAt: clock.deadlineAt,
      breached: false,
    };

    let draft = await ctx.task(regulatoryReportDraftTask, {
      eventId,
      severity,
      channel: channelId,
      jurisdiction,
      basis: clock.basis,
      deadlineAt: clock.deadlineAt,
      zone,
      dossierPath: dossier.dossierPath,
      dossierSummary: dossier.executiveSummary,
      investigation,
      capaDesign,
    });
    let rejection = { rationale: null, rationaleProvided: false };
    for (let round = 0; round < 2; round++) {
      if (round > 0) {
        // Exactly one bounded redraft round with the gate rationale threaded in. The redrafting
        // agent is told whether a rationale exists at all — it never receives an invented one.
        draft = await ctx.task(regulatoryReportDraftTask, {
          eventId,
          severity,
          channel: channelId,
          jurisdiction,
          basis: clock.basis,
          deadlineAt: clock.deadlineAt,
          zone,
          dossierPath: dossier.dossierPath,
          dossierSummary: dossier.executiveSummary,
          investigation,
          capaDesign,
          redraft: { feedback: rejection.rationale, feedbackProvided: rejection.rationaleProvided },
        });
      }
      const gate = await routedBreakpoint(ctx, {
        question: `Approve filing the ${channelId} report for ${severity} event ${eventId}? Statutory deadline ${clock.deadlineAt} (${zone}), basis ${clock.basis}.`,
        actionId: reportActionId,
        channel: channelId,
        reportBody: draft.reportBody,
        assertionTrace: draft.assertionTrace,
        deadlineAt: clock.deadlineAt,
        zone,
        gateEvidence: investigationGate.evidence,
      }, {
        breakpointId: channelBreakpointId,
        expert,
        tags: ['policy-gated', 'clinical-safety', 'regulatory', reportActionId, sevTag, channelId],
        strategy: 'single',
        // Deliberately NO autoApproveAfterN — the actionId is in NEVER_AUTO_APPROVE_ACTIONS.
      });
      recordGate(channelBreakpointId, reportActionId, expert, 'P5', gate);
      if (gate.approved === true) {
        entry.approved = true;
        // The ONLY invocation of the regulatory filer in this file.
        const submission = await ctx.task(regulatoryReportSubmitTask, {
          eventId,
          severity,
          channel: channelId,
          body: draft.reportBody,
          basis: clock.basis,
          deadlineAt: clock.deadlineAt,
        });
        entry.submitted = submission.submitted === true;
        entry.submissionRef = submission.submissionRef;
        entry.filedAt = submission.filedAt;
        if (entry.submitted) {
          const filedMs = Date.parse(submission.filedAt);
          if (!Number.isFinite(filedMs)) {
            throw new Error(
              `csq.regulatory-report-submit returned an unparseable filedAt '${submission.filedAt}' for channel ${channelId} — ` +
              'a filing timestamp cannot be guessed and no fallback is applied.'
            );
          }
          clock.closedAt = submission.filedAt;
          clock.marginMinutes = (clock.deadlineMs - filedMs) / 60000;
          clock.breached = filedMs > clock.deadlineMs;
          entry.breached = clock.breached;
          recordClock(channelId, 'filed', `ref=${submission.submissionRef} filedAt=${submission.filedAt} breached=${clock.breached}`);
        } else {
          clock.breached = true;
          entry.breached = true;
          recordClock(channelId, 'filing-failed', 'submitter reported submitted:false — the channel remains UNFILED');
        }
        break;
      }
      rejection = readGateRationale(gate);
      // Two DISTINCT ledger states: a stated reason is recorded as the approver's own words;
      // silence is recorded under its own event name, never as invented approver text.
      if (rejection.rationaleProvided) {
        recordClock(channelId, 'gate-rejected', rejection.rationale);
      } else {
        recordClock(channelId, 'gate-rejected-no-rationale', 'no rationale supplied');
      }
    }
    if (!entry.approved) {
      // Fail closed: nothing is ever transmitted to a regulator without an approval.
      clock.breached = true;
      entry.breached = true;
      recordClock(channelId, 'unfiled', 'gate not approved after one bounded redraft — the channel is left UNFILED');
    }
    reportingLog.push(entry);
    return entry;
  };

  const disclosureActionId = 'clinical-safety.patient-family-disclosure';
  const disclosurePolicy = disclosurePolicyFor(severity, reachedPatient);
  const runDisclosureStrand = async () => {
    // The disclosure gate has no statute of its own; it rides the TIGHTEST open statutory
    // clock. When no clock is open the zone is null and gateExpert returns the severity base
    // unescalated — gateExpert is monotone, so this can never route below the base.
    const openClocks = perChannel.filter((c) => c.closedAt === null);
    const tightest = (openClocks.length > 0 ? openClocks : perChannel)
      .slice()
      .sort((a, b) => a.deadlineMs - b.deadlineMs)[0];
    const zone = tightest ? deadlineZone(nowMs(), clockStartMs, tightest.deadlineMs) : null;
    const expert = assertApproverReachable(
      gateExpert(disclosureActionId, severity, zone),
      approvers,
      disclosureActionId,
      severity
    );
    const entry = {
      actionId: disclosureActionId,
      severity,
      zone,
      expert,
      required: disclosurePolicy.required,
      raised: true,
      approved: false,
      conducted: false,
    };

    let draft = await ctx.task(disclosureDraftTask, {
      eventId,
      severity,
      event,
      harmAssessment: investigation.harmAssessment,
      dossierPath: dossier.dossierPath,
      dossierSummary: dossier.executiveSummary,
      reachedPatient,
    });
    let rejection = { rationale: null, rationaleProvided: false };
    for (let round = 0; round < 2; round++) {
      if (round > 0) {
        // Exactly one bounded redraft round. The redrafting agent is told whether a rationale
        // exists at all — it never receives an invented one.
        draft = await ctx.task(disclosureDraftTask, {
          eventId,
          severity,
          event,
          harmAssessment: investigation.harmAssessment,
          dossierPath: dossier.dossierPath,
          dossierSummary: dossier.executiveSummary,
          reachedPatient,
          redraft: { feedback: rejection.rationale, feedbackProvided: rejection.rationaleProvided },
        });
      }
      const gate = await routedBreakpoint(ctx, {
        question: `Approve conducting the disclosure conversation with the patient/family for ${severity} event ${eventId}?`,
        script: draft.script,
        attendees: draft.attendees,
        setting: draft.setting,
        knownUnknowns: draft.knownUnknowns,
        ongoingCarePlan: draft.ongoingCarePlan,
        harmAssessment: investigation.harmAssessment,
      }, {
        breakpointId: disclosureActionId,
        expert,
        tags: ['policy-gated', 'clinical-safety', 'disclosure', sevTag],
        strategy: 'single',
        // Deliberately NO autoApproveAfterN — the id is in NEVER_AUTO_APPROVE_ACTIONS.
      });
      recordGate(disclosureActionId, disclosureActionId, expert, 'P5', gate);
      if (gate.approved === true) {
        entry.approved = true;
        // The ONLY invocation of the disclosure conductor in this file.
        const conducted = await ctx.task(disclosureConductTask, {
          eventId,
          severity,
          plan: draft,
        });
        entry.conducted = conducted.conducted === true;
        entry.conversationRef = conducted.conversationRef;
        entry.attendees = conducted.attendees;
        recordClock('disclosure', entry.conducted ? 'conducted' : 'not-conducted', String(conducted.conversationRef));
        break;
      }
      rejection = readGateRationale(gate);
      // Two DISTINCT ledger states: a stated reason is recorded as the approver's own words;
      // silence is recorded under its own event name, never as invented approver text.
      if (rejection.rationaleProvided) {
        recordClock('disclosure', 'gate-rejected', rejection.rationale);
      } else {
        recordClock('disclosure', 'gate-rejected-no-rationale', 'no rationale supplied');
      }
    }
    if (!entry.approved) {
      // Fail closed: an external, unretractable communication never happens without approval.
      recordClock('disclosure', 'withheld', 'gate not approved after one bounded redraft — nothing was said');
    }
    disclosureLog.push(entry);
    return entry;
  };

  const p5Strands = [];
  if (resolvedChannels.length > 0) {
    p5Strands.push(() => ctx.parallel.map(resolvedChannels, (channelId) => fileGatedReport(channelId)));
  }
  if (disclosurePolicy.raised) {
    p5Strands.push(() => runDisclosureStrand());
  } else {
    disclosureLog.push({
      actionId: disclosureActionId,
      severity,
      zone: null,
      expert: null,
      required: disclosurePolicy.required,
      raised: false,
      approved: false,
      conducted: false,
    });
  }
  if (p5Strands.length > 1) {
    await ctx.parallel.all(p5Strands);
  } else if (p5Strands.length === 1) {
    await p5Strands[0]();
  }

  // -------------------------------------------------------------------------
  // P6 — gated practice change, follow-through, closure audit, closure signoff
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P6: gated practice change, PDSA, CAPA tracking, HRO spread, closure audit');
  const practiceChangeNeeded =
    practiceChangeRequested === true ||
    (practiceChangeRequested === null && capaDesign.requiresLivePathwayChange === true);

  if (practiceChangeNeeded) {
    const activationActionId = 'clinical-safety.clinical-pathway-activation';
    const designed = await ctx.task(practiceChangeDesignTask, {
      eventId,
      severity,
      investigation,
      capaDesign,
      dossierPath: dossier.dossierPath,
    });
    practiceChange = { ...practiceChange, designed, gateRaised: true };
    recordClock('practice-change', 'designed', designed.designSummary);

    const activationExpert = assertApproverReachable(
      gateExpert(activationActionId, severity, null),
      approvers,
      activationActionId,
      severity
    );
    const activationGate = await routedBreakpoint(ctx, {
      question: `Approve activating these pathway / order-set / CDS changes in the live EHR for ${eventId}? This alters care delivered to real patients.`,
      changes: designed.changes,
      affectedPopulation: designed.changes.map((c) => ({ target: c.target, affectedPopulation: c.affectedPopulation })),
      alertBurdenDelta: designed.changes.map((c) => ({ target: c.target, alertBurdenDelta: c.alertBurdenDelta })),
      changeRisks: designed.changeRisks,
      rollbackPlan: designed.changes.map((c) => ({ target: c.target, rollback: c.rollback })),
    }, {
      breakpointId: activationActionId,
      expert: activationExpert,
      tags: ['policy-gated', 'clinical-safety', 'practice-change', sevTag],
      strategy: 'single',
      // Deliberately NO autoApproveAfterN — the id is in NEVER_AUTO_APPROVE_ACTIONS.
    });
    recordGate(activationActionId, activationActionId, activationExpert, 'P6', activationGate);
    if (activationGate.approved === true) {
      practiceChange = { ...practiceChange, approved: true };
      // The ONLY invocation of the pathway activator in this file.
      const activated = await ctx.task(practiceChangeActivateTask, {
        eventId,
        severity,
        changes: designed.changes,
      });
      practiceChange = { ...practiceChange, activated };
      recordClock('practice-change', 'activated', activated.activationSummary);
    } else {
      // Fail closed: the design is retained as an artifact and NOTHING is activated.
      recordClock('practice-change', 'withheld', 'activation gate not approved — nothing was activated in the live EHR');
    }
  }

  const [pdsaPlan, tracking, hroLearning] = await ctx.parallel.all([
    () => ctx.task(pdsaPlanTask, { eventId, severity, items: capaDesign.items, investigation }),
    () => ctx.task(capaTrackingTask, { eventId, severity, items: capaDesign.items }),
    () => ctx.task(hroLearningTask, {
      eventId,
      severity,
      investigation,
      capaDesign,
      affectedUnits,
    }),
  ]);
  capa = { ...capa, pdsaPlan, tracked: tracking.records };
  recordClock('capa', 'follow-through', `measures=${pdsaPlan.measures.length} tracked=${tracking.records.length} spreadTargets=${hroLearning.spreadTargets.length}`);

  const closureAuditPath = `${artifactsRoot}/clinical-safety-closure-audit-${eventId}.md`;
  const closureAudit = await ctx.task(closureAuditTask, {
    eventId,
    severity,
    clockLedger,
    clocks: perChannel.map((c) => ({
      clockId: c.channelId,
      startedAt: c.startedAt,
      deadlineAt: c.deadlineAt,
      closedAt: c.closedAt,
      basis: c.basis,
    })),
    reportingLog,
    disclosureLog,
    phi,
    containment,
    practiceChange,
    closureAuditPath,
  });
  artifacts.push(closureAudit.auditPath);
  recordClock('closure', 'audited', `anyBreached=${closureAudit.anyBreached} path=${closureAudit.auditPath}`);

  // SLA breaches are derived from the ORCHESTRATOR ledger, never from the auditor's numbers.
  for (const clock of perChannel) {
    if (clock.breached) {
      slaBreaches.push(`statutory-window-breach: ${clock.channelId} (deadline ${clock.deadlineAt}, basis ${clock.basis})`);
    }
    // The auditor's verdict is diffed against the ledger and a disagreement is itself surfaced.
    const auditRow = (closureAudit.clocks ?? []).find((row) => row.clockId === clock.channelId);
    if (!auditRow) {
      slaBreaches.push(`closure-audit-omission: ${clock.channelId} missing from the closure audit clocks`);
    } else if (auditRow.breached !== clock.breached) {
      slaBreaches.push(
        `closure-audit-disagreement: ${clock.channelId} audit=${auditRow.breached} ledger=${clock.breached}`
      );
    }
  }
  for (const entry of disclosureLog) {
    if (entry.required === true && entry.conducted !== true) {
      slaBreaches.push('undisclosed-required-event: required patient/family disclosure was not conducted');
    }
  }

  const closureBreakpointId = 'csq.closure.quality-committee-signoff';
  const closureAutoApproveAfterN = autoApproveAfterNFor(closureBreakpointId, severity);
  // Routed through assertApproverReachable like EVERY other gate in this file: an approvers map
  // with no named chief quality officer FAILS the run rather than raising a signoff addressed to
  // a role with no person behind it — which, at no-harm / near-miss, is the one breakpoint that
  // may auto-approve and would otherwise close the event outright with nobody accountable.
  const closureExpert = assertApproverReachable(
    'chief-quality-officer',
    approvers,
    closureBreakpointId,
    severity
  );
  const closureGate = await routedBreakpoint(ctx, {
    question: `Close the clinical safety event ${eventId} (${severity})?`,
    closureAudit,
    capaTracked: capa.tracked,
    reportingLog,
    disclosureLog,
    slaBreaches,
  }, {
    breakpointId: closureBreakpointId,
    expert: closureExpert,
    tags: ['clinical-safety', 'closure', sevTag],
    strategy: 'single',
    // The ONLY breakpoint in this process that can ever auto-approve, and only at
    // no-harm / near-miss. null is never spread, so it never reaches routedBreakpoint.
    ...(closureAutoApproveAfterN !== null ? { autoApproveAfterN: closureAutoApproveAfterN } : {}),
  });
  recordGate(closureBreakpointId, null, closureExpert, 'P6', closureGate);
  if (closureGate.approved !== true) {
    recordClock('closure', 'declined', 'quality committee declined closure — nothing is undone, all state surfaced');
    return buildResult(false, 'quality committee declined closure');
  }

  // -------------------------------------------------------------------------
  // P7 — kip assert of clinical-safety memory
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P7: kip assert of clinical-safety memory');
  if (kipEnabled) {
    // Non-empty by construction: the signature and harm-severity facts always exist here.
    const facts = [
      { subject: `event:${eventId}`, predicate: 'has-signature', object: signatureString },
      {
        subject: `event:${eventId}`,
        predicate: 'harm-severity',
        object: severity,
        props: {
          reachedPatient,
          immediateJeopardy: immediateJeopardyEffective,
          preventability: investigation.harmAssessment.preventability,
        },
      },
    ];
    if (investigation.rootCause && investigation.rootCause.rootCause) {
      facts.push({
        subject: `event:${eventId}`,
        predicate: 'root-cause',
        object: investigation.rootCause.rootCause,
        props: {
          systemCauseReached: investigation.rootCause.systemCauseReached,
          rcaPasses: maxRcaPasses,
        },
      });
    }
    for (const factor of investigation.contributingFactors) {
      facts.push({
        subject: `event:${eventId}`,
        predicate: 'contributing-factor',
        object: factor.factorDomain,
        props: { present: factor.present, contribution: factor.contribution },
      });
    }
    for (const item of capa.items) {
      facts.push({
        subject: `event:${eventId}`,
        predicate: 'capa-item',
        object: item.title,
        props: { owner: item.owner, dueDate: item.dueDate, strengthTier: item.strengthTier },
      });
    }
    for (const entry of reportingLog) {
      if (entry.submitted !== true) continue;
      facts.push({
        subject: `event:${eventId}`,
        predicate: 'reported-to',
        object: entry.channel,
        props: { deadlineAt: entry.deadlineAt, filedAt: entry.filedAt, breached: entry.breached },
      });
    }
    for (const entry of disclosureLog) {
      if (entry.raised !== true) continue;
      facts.push({
        subject: `event:${eventId}`,
        predicate: 'disclosed-to-patient',
        object: entry.conducted === true ? entry.conversationRef : 'not-conducted',
        props: { approved: entry.approved, expert: entry.expert },
      });
    }
    const asserted = await kipAssert(ctx, { kipDir, kipModel, kind: 'clinical-safety', facts });
    kipFactsAsserted = asserted.asserted;
    recordClock('closure', 'kip-assert', `${kipFactsAsserted} facts`);
  }

  const everyRequiredChannelFiled = reportingLog
    .filter((entry) => entry.required === true)
    .every((entry) => entry.submitted === true && entry.breached === false);
  const everyRequiredDisclosureConducted = disclosureLog
    .filter((entry) => entry.required === true)
    .every((entry) => entry.conducted === true);
  const success =
    investigationGate.passed === true &&
    everyRequiredChannelFiled &&
    everyRequiredDisclosureConducted &&
    slaBreaches.length === 0;

  recordClock('closure', 'event-closed', `success=${success} slaBreaches=${slaBreaches.length}`);
  return buildResult(success);
}
