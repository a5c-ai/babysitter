/**
 * @process incident-management/incident-lifecycle
 * @description Flagship detection-to-postmortem incident lifecycle with severity-routed
 *   policy gates, an adversarial postmortem-completeness gate, and kip incident memory.
 *   Single owner for incident handling across the library: detection + severity
 *   classification -> incident-commander assignment -> parallel mitigation strands
 *   (iterative diagnosis, blast-radius assessment, comms drafting) -> policy-gated
 *   production mitigation -> policy-gated status-page/customer comms on a
 *   severity-driven cadence -> recovery verification (one bounded re-mitigation loop) ->
 *   blameless postmortem with adversarial completeness gate -> policy-gated postmortem
 *   publication -> action-item tracking + kip assert at close.
 * @inputs {
 *   signal: {                       // required — the triggering signal
 *     source: 'alert'|'user-report'|'cron'|'synthetic',
 *     ref: string,
 *     firstSeenAt: string,          // ISO timestamp — seeds the timeline and MTTR math
 *     symptomSummary: string,
 *     impactedSurfaces?: string[]
 *   },
 *   severityOverride?: string,      // 'SEV1'|'SEV2'|'SEV3'|'SEV4'|'non-incident' — wins over classification, recorded in metadata
 *   customerFacing?: boolean,       // drives SEV2 customer-comms requirement (default false)
 *   oncall?: { primary: string, secondary?: string, commsLead?: string, engineeringManager?: string },
 *   commsChannels?: Array<{ kind: 'slack'|'status-page'|'email', target: string }>,
 *   slo?: { mttdMinutes: number, mttrMinutes: number },
 *   postmortemRequired?: boolean|null, // SEV1/SEV2 always; SEV3 default true (null); SEV4 only when === true
 *   maxDiagnosisPasses?: number,    // sequential diagnosis passes (default 3)
 *   maxFixAttempts?: number,        // postmortem-gate fixer budget (default 2)
 *   kipEnabled?: boolean,           // recall + assert incident memory via kip (default true)
 *   kipDir?: string,                // kip store directory (default '.a5c/kip')
 *   kipModel?: string,              // model for kip structured paths (default 'sonnet')
 *   artifactsDir?: string           // where the postmortem markdown lands (default ctx.artifactsDir)
 * }
 * @outputs {
 *   success: boolean,
 *   incidentId: string,
 *   severity: string,               // 'SEV1'|'SEV2'|'SEV3'|'SEV4'|'non-incident'
 *   commander: object|null,         // { incidentCommander, techLead, commsLead, scribe, missingRoles, warRoomRef }
 *   diagnosis: object|null,
 *   blastRadius: object|null,
 *   mitigation: { plan: object|null, executed: object|null, mitigated: boolean },
 *   commsLog: Array<{ action, sev, phase, required, raised, approved, published, messageRef? }>,
 *   recoveryVerified: boolean,
 *   postmortem: { path: string|null, published: boolean, gate: { passed, attempts, escalated, issues }|null },
 *   actionItems: Array<{ title, owner, dueDate, category, issueUrl? }>,
 *   autoApprovals: Array<{ breakpointId, phase, at }>, // ALWAYS present (possibly empty) — fail-closed surfacing
 *   kipFactsAsserted: number,
 *   slaBreaches: string[],
 *   artifacts: string[],
 *   metadata: { processId, runId, timeline, breakpointsHit, severityOverridden, reason? }
 * }
 * @graph
 *   domains: [domain:incident-management]
 *   specializations: [specialization:incident-management]
 *   workflows: [workflow:incident-response, workflow:post-mortem-review, workflow:on-call-rotation]
 *   roles: [role:incident-commander, role:sre, role:comms-lead, role:engineering-manager]
 *   skillAreas: [skill-area:incident-response, skill-area:incident-management, skill-area:alerting-oncall]
 * @policyGatedActions execute-prod-mitigation, publish-status-page, send-customer-incident-comms, publish-postmortem
 * @supersedes specializations/devops-sre-platform/incident-response.js (harvested: commander/roles
 *   mobilization, parallel log/metrics/trace investigation folded into the diagnosis strand,
 *   blast-radius fields, MTTR/MTTD metrics, Style-A task shape)
 * @supersedes domains/business/customer-experience/itil-incident-management.js (harvested:
 *   categorization-informed severity rationale, KB lookup replaced by kipRecall,
 *   post-incident-review loop replaced by adversarialGate)
 * @absorbs specializations/observability/incident-lifecycle.js (structural seed: single-workflow
 *   lifecycle, severity matrix text, non-incident early exit, timeline accumulation, comms phase
 *   model with no-blame rules, iterative 3-pass diagnosis, SLO breach detection, follow-up issue
 *   creation)
 *
 * SEVERITY_ROUTING (reproduced verbatim — the frozen const below is the implementation):
 *   execute-prod-mitigation:       SEV1 incident-commander | SEV2 incident-commander | SEV3 tech-lead | SEV4 tech-lead
 *   publish-status-page:           SEV1 comms-lead | SEV2 comms-lead | SEV3 comms-lead (presentAlwaysApprove) | SEV4 not raised
 *   send-customer-incident-comms:  SEV1 comms-lead | SEV2 comms-lead (only if customerFacing) | SEV3 not raised | SEV4 not raised
 *   publish-postmortem:            SEV1 engineering-manager | SEV2 engineering-manager | SEV3 tech-lead | SEV4 tech-lead (postmortem only when postmortemRequired===true)
 *
 * COMMS CADENCE (reproduced verbatim):
 *   SEV1: status page required (30m updates), customer comms required
 *   SEV2: status page required (60m updates), customer comms required iff customerFacing
 *   SEV3: status page discretionary, customer comms not required
 *   SEV4: status page not required, customer comms not required
 *
 * Hard rules: Style-A agent tasks only (zero kind:'shell'); every evidence-carrying
 * outputSchema declares evidence { type:'array', minItems:1 }; NO fallbacks — unknown
 * severity throws, unknown routing lookup throws, gate-unapproved actions are never
 * executed via an alternate path and comms are never published without an approved gate;
 * the timeline is accumulated in the ORCHESTRATOR (never inside agents) so the
 * timeline-fidelity critic has ground truth to diff.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../common-utilities/routed-gate-combinators.js';

// ---------------------------------------------------------------------------
// Severity model — frozen routing + cadence tables, throwing lookups
// ---------------------------------------------------------------------------

/** Incident severities (non-incident is a classification outcome, not a severity). */
export const INCIDENT_SEVERITIES = Object.freeze(['SEV1', 'SEV2', 'SEV3', 'SEV4']);

/**
 * Policy-gate routing per severity. `null` means the action is NEVER raised at that
 * severity — looking up its expert is an orchestrator bug and throws (no default
 * expert exists; fallbacks are forbidden).
 */
export const SEVERITY_ROUTING = Object.freeze({
  'execute-prod-mitigation': Object.freeze({
    SEV1: 'incident-commander',
    SEV2: 'incident-commander',
    SEV3: 'tech-lead',
    SEV4: 'tech-lead',
  }),
  'publish-status-page': Object.freeze({
    SEV1: 'comms-lead',
    SEV2: 'comms-lead',
    SEV3: 'comms-lead', // discretionary — gate raised with presentAlwaysApprove:true
    SEV4: null, // not raised
  }),
  'send-customer-incident-comms': Object.freeze({
    SEV1: 'comms-lead',
    SEV2: 'comms-lead', // only raised when customerFacing
    SEV3: null, // not raised
    SEV4: null, // not raised
  }),
  'publish-postmortem': Object.freeze({
    SEV1: 'engineering-manager',
    SEV2: 'engineering-manager',
    SEV3: 'tech-lead',
    SEV4: 'tech-lead', // postmortem only exists when postmortemRequired === true
  }),
});

/**
 * COMMS CADENCE RULES. Values are policy modes, not free text:
 *   'required'            -> gate raised, action mandatory
 *   'iff-customer-facing' -> gate raised only when inputs.customerFacing === true
 *   'discretionary'       -> gate raised with presentAlwaysApprove:true, not mandatory
 *   'not-raised'          -> gate never raised; recorded { required:false, raised:false }
 */
export const COMMS_CADENCE = Object.freeze({
  SEV1: Object.freeze({ statusPage: 'required', statusPageUpdateMinutes: 30, customerComms: 'required' }),
  SEV2: Object.freeze({ statusPage: 'required', statusPageUpdateMinutes: 60, customerComms: 'iff-customer-facing' }),
  SEV3: Object.freeze({ statusPage: 'discretionary', statusPageUpdateMinutes: null, customerComms: 'not-raised' }),
  SEV4: Object.freeze({ statusPage: 'not-raised', statusPageUpdateMinutes: null, customerComms: 'not-raised' }),
});

/** Roles that MUST be staffed per severity (drives the roster-gap breakpoint). */
export const REQUIRED_ROLES = Object.freeze({
  SEV1: Object.freeze(['incidentCommander', 'techLead', 'commsLead', 'scribe']),
  SEV2: Object.freeze(['incidentCommander', 'techLead', 'commsLead']),
  SEV3: Object.freeze(['incidentCommander']),
  SEV4: Object.freeze(['incidentCommander']),
});

/**
 * Routing lookup. THROWS on unknown action, unknown severity, and on actions that are
 * never raised at the given severity — there is deliberately no default expert.
 *
 * @param {string} actionId - One of the four policy-gated action ids
 * @param {string} severity - 'SEV1'|'SEV2'|'SEV3'|'SEV4'
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
      `Known severities: ${INCIDENT_SEVERITIES.join(', ')} — no fallback route exists.`
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
 * Comms policy for one action at one severity. THROWS on unknown severity or action.
 *
 * @param {string} actionId - 'publish-status-page' | 'send-customer-incident-comms'
 * @param {string} severity - 'SEV1'|'SEV2'|'SEV3'|'SEV4'
 * @param {boolean} customerFacing - inputs.customerFacing (resolved to a boolean)
 * @returns {{ required: boolean, raised: boolean, presentAlwaysApprove: boolean }}
 */
export function commsPolicyFor(actionId, severity, customerFacing) {
  const cadence = COMMS_CADENCE[severity];
  if (!cadence) {
    throw new Error(
      `COMMS_CADENCE: unknown severity '${severity}'. ` +
      `Known severities: ${INCIDENT_SEVERITIES.join(', ')} — no fallback cadence exists.`
    );
  }
  const mode = actionId === 'publish-status-page'
    ? cadence.statusPage
    : actionId === 'send-customer-incident-comms'
      ? cadence.customerComms
      : undefined;
  if (mode === undefined) {
    throw new Error(`COMMS_CADENCE: unknown comms action '${actionId}' — no fallback policy exists.`);
  }
  if (mode === 'required') return { required: true, raised: true, presentAlwaysApprove: false };
  if (mode === 'iff-customer-facing') {
    return { required: customerFacing === true, raised: customerFacing === true, presentAlwaysApprove: false };
  }
  if (mode === 'discretionary') return { required: false, raised: true, presentAlwaysApprove: true };
  if (mode === 'not-raised') return { required: false, raised: false, presentAlwaysApprove: false };
  throw new Error(`COMMS_CADENCE: unrecognized policy mode '${mode}' for '${actionId}' at ${severity}.`);
}

function assertClassifiedSeverity(value, source) {
  if (value === 'non-incident') return value;
  if (!INCIDENT_SEVERITIES.includes(value)) {
    throw new Error(
      `Unknown severity '${value}' from ${source} — expected one of ` +
      `${INCIDENT_SEVERITIES.join('|')}|non-incident. No fallback severity is applied.`
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// P1 — detection + severity classification
// ---------------------------------------------------------------------------

export const detectClassifyTask = defineTask('iml.detect-classify', (args, taskCtx) => ({
  kind: 'agent',
  title: `Detect + classify incident signal from ${args.signal.source}`,
  agent: {
    name: 'incident-triage',
    prompt: {
      role: 'Incident triage classifier',
      task: 'Decide whether the signal is an incident and classify its severity',
      context: args,
      instructions: [
        'Apply the severity matrix exactly:',
        'SEV1: user-facing outage on a critical path OR data loss/corruption risk.',
        'SEV2: significant degradation with ongoing user impact (workaround may exist).',
        'SEV3: partial degradation, limited user impact.',
        'SEV4: internal-only, no user impact, cleanup-later.',
        'non-incident: false alarm, duplicate, or expected behavior.',
        'Mint a stable kebab-case incidentId from the signal ref and date.',
        'Cross-reference priorKnowledge facts (prior incidents with matching signatures) and list matches in matchedPriorIncidents.',
        'Set customerFacing from whether the impacted surfaces are customer-visible.',
        'Evidence entries must cite the concrete signal fields, probe outputs, or prior-incident facts that ground the classification — at least one entry.',
      ],
      outputFormat: 'JSON with incidentId string, severity string (SEV1|SEV2|SEV3|SEV4|non-incident), rationale string, initialHypotheses array, impactedSurfaces array, customerFacing boolean, matchedPriorIncidents array, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['incidentId', 'severity', 'rationale', 'initialHypotheses', 'impactedSurfaces', 'customerFacing', 'evidence'],
      properties: {
        incidentId: { type: 'string' },
        severity: { type: 'string', enum: ['SEV1', 'SEV2', 'SEV3', 'SEV4', 'non-incident'] },
        rationale: { type: 'string' },
        initialHypotheses: { type: 'array' },
        impactedSurfaces: { type: 'array' },
        customerFacing: { type: 'boolean' },
        matchedPriorIncidents: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'iml', 'incident', 'triage'],
}));

// ---------------------------------------------------------------------------
// P2 — commander assignment
// ---------------------------------------------------------------------------

export const commanderAssignmentTask = defineTask('iml.commander-assignment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Mobilize incident roster for ${args.severity} incident ${args.incidentId}`,
  agent: {
    name: 'incident-commander-mobilizer',
    prompt: {
      role: 'Incident commander mobilizer',
      task: 'Assign the incident roster from the on-call inputs and severity',
      context: args,
      instructions: [
        'Roles by severity: incidentCommander (all severities); techLead and commsLead (SEV1/SEV2); scribe (SEV1).',
        'Fill roles from inputs.oncall (primary/secondary/commsLead/engineeringManager) — never invent people.',
        'A role you cannot fill from the given roster goes into missingRoles; do NOT substitute a placeholder.',
        'Open (or name) the war room channel and report it as warRoomRef.',
        'Evidence entries must cite the oncall fields used for each assignment — at least one entry.',
      ],
      outputFormat: 'JSON with incidentCommander string|null, techLead string|null, commsLead string|null, scribe string|null, missingRoles array, warRoomRef string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['incidentCommander', 'missingRoles', 'warRoomRef', 'evidence'],
      properties: {
        incidentCommander: { type: ['string', 'null'] },
        techLead: { type: ['string', 'null'] },
        commsLead: { type: ['string', 'null'] },
        scribe: { type: ['string', 'null'] },
        missingRoles: { type: 'array' },
        warRoomRef: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'iml', 'incident', 'roster'],
}));

// ---------------------------------------------------------------------------
// P3 — parallel mitigation strands: diagnosis / blast radius / comms drafting
// ---------------------------------------------------------------------------

export const diagnoseTask = defineTask('iml.diagnose', (args, taskCtx) => ({
  kind: 'agent',
  title: `Diagnose root cause (pass ${args.pass}) for ${args.incidentId}`,
  agent: {
    name: 'incident-diagnostician',
    prompt: {
      role: 'Incident diagnostician',
      task: 'Rule hypotheses in/out against logs, metrics, traces, and recent deploys/config changes',
      context: args,
      instructions: [
        'Investigate logs, metrics, and traces in parallel with recent deploy/config change history.',
        'Rule the given hypotheses in or out; carry the survivors in remainingHypotheses.',
        'Honor priorKnowledge (prior incidents with matching signatures and known-good mitigations) — cite matches instead of rediscovering them.',
        'Set needsMoreSignal true only when another pass with the remaining hypotheses could genuinely change the verdict.',
        'Every evidence entry must be { source, excerpt, weight } grounded in data you actually pulled — at least one entry; never fabricate excerpts.',
      ],
      outputFormat: 'JSON with rootCause string|null, confidence string (low|medium|high), evidence array of { source, excerpt, weight } (minItems 1), remainingHypotheses array, needsMoreSignal boolean',
    },
    outputSchema: {
      type: 'object',
      required: ['confidence', 'evidence', 'remainingHypotheses', 'needsMoreSignal'],
      properties: {
        rootCause: { type: ['string', 'null'] },
        confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
        evidence: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['source', 'excerpt', 'weight'] },
        },
        remainingHypotheses: { type: 'array' },
        needsMoreSignal: { type: 'boolean' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'iml', 'incident', 'diagnose'],
}));

export const blastRadiusTask = defineTask('iml.blast-radius', (args, taskCtx) => ({
  kind: 'agent',
  title: `Assess blast radius for ${args.severity} incident ${args.incidentId}`,
  agent: {
    name: 'impact-assessor',
    prompt: {
      role: 'Impact assessor',
      task: 'Quantify who and what the incident is hurting',
      context: args,
      instructions: [
        'Estimate customersAffected from the impacted surfaces and traffic data.',
        'List the critical user journeys impacted and every dependent service in the failure path.',
        'Compute SLO error-budget burn against the provided slo targets where available.',
        'Classify degradationType (full-outage | partial-degradation | latency | data-quality | internal-only).',
        'Evidence entries must cite the dashboards, queries, or traffic data behind each number — at least one entry.',
      ],
      outputFormat: 'JSON with customersAffected number|string, criticalJourneysImpacted array, sloBurn object|string|null, dependentServices array, degradationType string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['customersAffected', 'criticalJourneysImpacted', 'dependentServices', 'degradationType', 'evidence'],
      properties: {
        customersAffected: { type: ['number', 'string'] },
        criticalJourneysImpacted: { type: 'array' },
        sloBurn: {},
        dependentServices: { type: 'array' },
        degradationType: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'iml', 'incident', 'blast-radius'],
}));

export const commsDraftTask = defineTask('iml.comms-draft', (args, taskCtx) => ({
  kind: 'agent',
  title: args.redraft
    ? `Redraft ${args.redraft.actionId} comms (${args.redraft.phase}) for ${args.incidentId}`
    : `Draft incident comms for ${args.severity} incident ${args.incidentId}`,
  agent: {
    name: 'comms-drafter',
    prompt: {
      role: 'Incident communications drafter',
      task: 'Draft status-page and customer-comms bodies for every comms phase — DRAFTS ONLY',
      context: args,
      instructions: [
        'Produce draft bodies for all four phases: open (investigating; known/unknown), update (what changed; next update in N minutes), mitigated (impact reduced; monitoring), resolved (closed; postmortem link to follow).',
        'Rules: no blame, no speculation stated as fact, and every non-resolved draft names a concrete next-update time from the severity cadence.',
        'DRAFTS ONLY: you must NOT post, publish, or send anything — publication happens through a policy gate you do not control.',
        args.redraft
          ? `Redraft round: revise ONLY the ${args.redraft.actionId} body for phase '${args.redraft.phase}' addressing this gate feedback: ${JSON.stringify(args.redraft.feedback)}. Return the full draft tables with that body replaced.`
          : 'First drafting round: no gate feedback to address.',
        'Evidence entries must cite the blast-radius/diagnosis fields each claim in the drafts is grounded in — at least one entry.',
      ],
      outputFormat: 'JSON with statusPageDrafts { open, update, mitigated, resolved }, customerCommsDrafts { open, update, mitigated, resolved }, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['statusPageDrafts', 'customerCommsDrafts', 'evidence'],
      properties: {
        statusPageDrafts: {
          type: 'object',
          required: ['open', 'update', 'mitigated', 'resolved'],
          properties: {
            open: { type: 'string' },
            update: { type: 'string' },
            mitigated: { type: 'string' },
            resolved: { type: 'string' },
          },
        },
        customerCommsDrafts: {
          type: 'object',
          required: ['open', 'update', 'mitigated', 'resolved'],
          properties: {
            open: { type: 'string' },
            update: { type: 'string' },
            mitigated: { type: 'string' },
            resolved: { type: 'string' },
          },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'iml', 'incident', 'comms', 'draft'],
}));

// ---------------------------------------------------------------------------
// P4 — mitigation planning + gated execution
// ---------------------------------------------------------------------------

export const mitigationPlanTask = defineTask('iml.mitigation-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? `Re-plan mitigation for ${args.incidentId} (gate feedback)`
    : `Plan mitigation for ${args.severity} incident ${args.incidentId}`,
  agent: {
    name: 'mitigation-planner',
    prompt: {
      role: 'Mitigation planner',
      task: 'Turn the diagnosis into a concrete, reversible-first mitigation plan — a PLAN, not an execution',
      context: args,
      instructions: [
        'Prefer reversible actions (rollback, feature-flag disable, traffic shift) over forward code fixes.',
        'Every action must carry: action, reversible (boolean), rollback (how to undo it), risk.',
        'Honor priorKnowledge known-good mitigations for matching signatures — cite them.',
        'You must NOT execute anything: production changes only happen after the execute-prod-mitigation policy gate approves.',
        args.feedback
          ? `Re-plan round: address ONLY this gate feedback: ${JSON.stringify(args.feedback)}`
          : 'First planning round: no gate feedback to address.',
        'Evidence entries must cite the diagnosis evidence or prior-incident facts each planned action rests on — at least one entry.',
      ],
      outputFormat: 'JSON with actions array of { action, reversible, rollback, risk }, planSummary string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'planSummary', 'evidence'],
      properties: {
        actions: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['action', 'reversible', 'rollback', 'risk'] },
        },
        planSummary: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'iml', 'incident', 'mitigation', 'plan'],
}));

export const executeMitigationTask = defineTask('iml.execute-mitigation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved mitigation for ${args.severity} incident ${args.incidentId}`,
  agent: {
    name: 'mitigation-executor',
    prompt: {
      role: 'Mitigation executor',
      task: 'Execute EXACTLY the approved mitigation plan — nothing more',
      context: args,
      instructions: [
        'This task only ever runs AFTER the execute-prod-mitigation policy gate approved the plan in context.',
        'Execute exactly the approved actions in order; do not improvise additional production changes.',
        'Log every action with an ISO timestamp and its outcome — these entries feed the orchestrator timeline and the postmortem.',
        'If an action fails, stop, attempt its documented rollback, and report honestly with mitigated:false.',
        'Evidence entries must be the raw command/console outputs of the executed actions — at least one entry.',
      ],
      outputFormat: 'JSON with executed array of { action, timestamp, outcome, reversible }, mitigated boolean, mitigationSummary string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['executed', 'mitigated', 'mitigationSummary', 'evidence'],
      properties: {
        executed: {
          type: 'array',
          items: { type: 'object', required: ['action', 'timestamp', 'outcome', 'reversible'] },
        },
        mitigated: { type: 'boolean' },
        mitigationSummary: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'iml', 'incident', 'mitigation', 'execute', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P5 — gated comms publication
// ---------------------------------------------------------------------------

export const publishCommsTask = defineTask('iml.publish-comms', (args, taskCtx) => ({
  kind: 'agent',
  title: `Publish ${args.actionId} (${args.phase}) for ${args.severity} incident ${args.incidentId}`,
  agent: {
    name: 'comms-publisher',
    prompt: {
      role: 'Incident communications publisher',
      task: 'Publish the gate-approved comms body to its channel',
      context: args,
      instructions: [
        'This task only ever runs AFTER its policy gate approved the exact body in context — publish that body verbatim.',
        'Pick the channel from the provided channels list matching the action (status-page action -> status-page channel; customer comms -> email/slack customer channels).',
        'Report the concrete messageRef (URL, message id, or post id) of what you published.',
        'Evidence entries must be the raw publish confirmation (API response, post URL) — at least one entry.',
      ],
      outputFormat: 'JSON with sent boolean, channel string, phase string, messageRef string, body string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['sent', 'channel', 'phase', 'messageRef', 'body', 'evidence'],
      properties: {
        sent: { type: 'boolean' },
        channel: { type: 'string' },
        phase: { type: 'string' },
        messageRef: { type: 'string' },
        body: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'iml', 'incident', 'comms', 'publish', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P6 — recovery verification
// ---------------------------------------------------------------------------

export const verifyRecoveryTask = defineTask('iml.verify-recovery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify recovery (attempt ${args.attempt}) for ${args.incidentId}`,
  agent: {
    name: 'recovery-verifier',
    prompt: {
      role: 'Recovery verifier',
      task: 'Prove the original symptoms are no longer reproducing',
      context: args,
      instructions: [
        'Re-run the failing probes / synthetic checks against the ORIGINAL symptom and impacted surfaces — not against the mitigation story.',
        'Hold for at least one stability window and report its length in minutes.',
        'Every probesRun entry must be a probe you actually executed with its pass/fail and detail.',
        'Evidence entries must be executed probe outputs — a claim without a run is not evidence; at least one entry.',
        'recovered:true requires every probe passing across the stability window; anything less is recovered:false, honestly reported.',
      ],
      outputFormat: 'JSON with recovered boolean, probesRun array of { name, passed, detail } (minItems 1), stabilityWindowMinutes number, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['recovered', 'probesRun', 'stabilityWindowMinutes', 'evidence'],
      properties: {
        recovered: { type: 'boolean' },
        probesRun: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['name', 'passed', 'detail'] },
        },
        stabilityWindowMinutes: { type: 'number' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'iml', 'incident', 'recovery'],
}));

// ---------------------------------------------------------------------------
// P7 — postmortem draft
// ---------------------------------------------------------------------------

export const postmortemDraftTask = defineTask('iml.postmortem-draft', (args, taskCtx) => ({
  kind: 'agent',
  title: `Draft blameless postmortem for ${args.severity} incident ${args.incidentId}`,
  agent: {
    name: 'postmortem-author',
    prompt: {
      role: 'Blameless postmortem author',
      task: `Compose the blameless postmortem markdown at ${args.postmortemPath}`,
      context: args,
      instructions: [
        `Write the postmortem to ${args.postmortemPath} and report that exact path back.`,
        'Sections in order: Summary, Impact, Timeline, Root cause, Contributing factors, What went well, What went poorly, Action items.',
        'The Timeline section must reproduce the orchestrator-accumulated timeline in context VERBATIM with its timestamps — an independent critic will diff it against the run journal.',
        'Contributing factors must go beyond the proximate cause (systemic depth, 5-whys).',
        'Every action item must carry: title, a NAMED owner, a concrete dueDate, severity, and category (prevention|detection|response). No TBD owners or dates.',
        'Language stays blameless: name systems and decisions, never fault individuals.',
      ],
      outputFormat: 'JSON with postmortemPath string, actionItems array of { title, owner, dueDate, severity, category }, executiveSummary string',
    },
    outputSchema: {
      type: 'object',
      required: ['postmortemPath', 'actionItems', 'executiveSummary'],
      properties: {
        postmortemPath: { type: 'string' },
        actionItems: {
          type: 'array',
          items: { type: 'object', required: ['title', 'owner', 'dueDate', 'severity', 'category'] },
        },
        executiveSummary: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'iml', 'incident', 'postmortem'],
}));

// ---------------------------------------------------------------------------
// P10 — action-item tracking
// ---------------------------------------------------------------------------

export const actionItemTrackingTask = defineTask('iml.action-item-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create ${args.actionItems.length} action-item tracking issues for ${args.incidentId}`,
  agent: {
    name: 'follow-through-tracker',
    prompt: {
      role: 'Follow-through tracker',
      task: 'Create one tracking issue per postmortem action item',
      context: args,
      instructions: [
        'Create one tracking issue per action item, labeled postmortem plus the severity tag.',
        'Each issue carries the item title, its NAMED owner, and its concrete dueDate — there are no defaults; an item missing either is reported as-is, never silently filled in.',
        'If an equivalent issue already exists, report it with action:"existed" instead of duplicating.',
      ],
      outputFormat: 'JSON with issues array of { title, owner, dueDate, url?, action } where action is created|existed',
    },
    outputSchema: {
      type: 'object',
      required: ['issues'],
      properties: {
        issues: {
          type: 'array',
          items: {
            type: 'object',
            required: ['title', 'owner', 'dueDate', 'action'],
            properties: {
              title: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' },
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
  labels: ['agent', 'iml', 'incident', 'follow-through'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    signal,
    severityOverride = null,
    customerFacing = false,
    oncall = {},
    commsChannels = [],
    slo = null,
    postmortemRequired = null,
    maxDiagnosisPasses = 3,
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
    artifactsDir,
  } = inputs || {};

  if (!signal || !signal.source || !signal.ref || !signal.firstSeenAt || !signal.symptomSummary) {
    throw new Error(
      'incident-lifecycle requires signal { source, ref, firstSeenAt, symptomSummary } — refusing to guess missing fields.'
    );
  }
  if (severityOverride !== null) {
    assertClassifiedSeverity(severityOverride, 'inputs.severityOverride');
  }

  const artifactsRoot = artifactsDir ?? ctx.artifactsDir;
  const nowIso = () => new Date().toISOString();
  const startMs = ctx.now();

  // Timeline is accumulated HERE, in the orchestrator — agents never write it. The
  // timeline-fidelity critic diffs the postmortem against this ground truth.
  const timeline = [{ at: signal.firstSeenAt, event: 'signal-received', detail: signal.symptomSummary }];
  const breakpointsHit = [];
  // ALWAYS present in outputs (possibly empty): every harness-level auto-approval of a
  // policy gate is surfaced here — fail-closed posture, nothing auto-approves silently.
  const autoApprovals = [];
  const commsLog = [];

  const recordGate = (breakpointId, phase, result) => {
    breakpointsHit.push(breakpointId);
    const auto =
      result && (result.autoApproved === true || (result.metadata && result.metadata.autoApproved === true));
    if (auto) {
      autoApprovals.push({ breakpointId, phase, at: nowIso() });
    }
    return result;
  };

  // Mutable run state referenced by buildResult (terminal returns carry full state).
  let incidentId = null;
  let severity = null;
  let severityOverridden = false;
  let commander = null;
  let diagnosis = null;
  let blastRadius = null;
  let commsDrafts = null;
  let mitigationPlan = null;
  let execution = null;
  let verify = null;
  let postmortem = { path: null, published: false, gate: null };
  let actionItemsOut = [];
  let kipFactsAsserted = 0;
  let slaBreaches = [];
  const artifacts = [];

  const buildResult = (success, reason) => ({
    success,
    incidentId,
    severity,
    commander,
    diagnosis,
    blastRadius,
    mitigation: {
      plan: mitigationPlan,
      executed: execution,
      mitigated: execution ? execution.mitigated === true : false,
    },
    commsLog,
    recoveryVerified: verify ? verify.recovered === true : false,
    postmortem,
    actionItems: actionItemsOut,
    autoApprovals,
    kipFactsAsserted,
    slaBreaches,
    artifacts,
    metadata: {
      processId: 'incident-management/incident-lifecycle',
      runId: ctx.runId,
      timeline,
      breakpointsHit,
      severityOverridden,
      ...(reason ? { reason } : {}),
    },
  });

  // -------------------------------------------------------------------------
  // P0 — kip recall at detection
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P0: kip recall of prior incident memory');
  let priorKnowledge = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  const signatureString = `incident signature: ${signal.symptomSummary} [${(signal.impactedSurfaces ?? []).join(', ')}]`;
  if (kipEnabled) {
    priorKnowledge = await kipRecall(ctx, {
      kipDir,
      topic: signatureString,
      kipModel,
      kind: 'incident-management',
    });
    timeline.push({ at: nowIso(), event: 'kip-recall', detail: `factCount=${priorKnowledge.factCount}` });
  }

  // -------------------------------------------------------------------------
  // P1 — detection + severity classification (non-incident exits early)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P1: detection + severity classification');
  const classification = await ctx.task(detectClassifyTask, {
    signal,
    priorKnowledge,
    customerFacingHint: customerFacing === true,
  });
  incidentId = classification.incidentId;
  severity = assertClassifiedSeverity(classification.severity, 'iml.detect-classify');
  if (severityOverride !== null && severityOverride !== severity) {
    severity = severityOverride;
    severityOverridden = true;
  }
  const isCustomerFacing = customerFacing === true || classification.customerFacing === true;
  timeline.push({ at: nowIso(), event: 'classified', detail: `${severity}${severityOverridden ? ' (overridden)' : ''}: ${classification.rationale}` });

  if (severity === 'non-incident') {
    // False alarm / duplicate / expected behavior — exit before mobilizing anyone.
    return buildResult(true, 'classified non-incident: no commander assigned, no gates raised');
  }

  const sevTag = severity.toLowerCase();

  // -------------------------------------------------------------------------
  // P2 — commander assignment (roster-gap breakpoint only when genuinely blocked)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P2: commander assignment');
  commander = await ctx.task(commanderAssignmentTask, {
    incidentId,
    severity,
    oncall,
    classification,
  });
  timeline.push({ at: nowIso(), event: 'commander-assigned', detail: `IC=${commander.incidentCommander} war-room=${commander.warRoomRef}` });

  const missingRequired = commander.missingRoles.filter((role) => REQUIRED_ROLES[severity].includes(role));
  if (missingRequired.length > 0) {
    // The only non-policy breakpoint in this process: an unstaffed incident is
    // genuinely blocking (sparse-breakpoint rule).
    const rosterGap = await routedBreakpoint(ctx, {
      question: `Severity-required roles are unstaffed for ${severity} incident ${incidentId}: ${missingRequired.join(', ')}. Confirm staffing (reply with assignments) or reject to halt the run.`,
      missingRoles: missingRequired,
      roster: commander,
      oncall,
    }, {
      breakpointId: 'iml.commander-assignment.roster-gap',
      expert: 'incident-commander',
      tags: ['incident', 'roster', sevTag],
      strategy: 'single',
    });
    recordGate('iml.commander-assignment.roster-gap', 'P2', rosterGap);
    if (rosterGap.approved !== true) {
      return buildResult(false, `roster gap unresolved: ${missingRequired.join(', ')} unstaffed for ${severity}`);
    }
    timeline.push({ at: nowIso(), event: 'roster-gap-resolved', detail: rosterGap.response || 'staffing confirmed' });
  }

  // -------------------------------------------------------------------------
  // P3 — parallel mitigation strands: diagnosis loop / blast radius / comms drafts
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P3: parallel strands — diagnosis, blast radius, comms drafting');
  const diagnosisLoop = async () => {
    let current = null;
    let hypotheses = classification.initialHypotheses;
    for (let pass = 1; pass <= maxDiagnosisPasses; pass++) {
      current = await ctx.task(diagnoseTask, {
        incidentId,
        severity,
        signal,
        hypotheses,
        previousFindings: current,
        priorKnowledge,
        pass,
      });
      if (!current.needsMoreSignal && current.rootCause) break;
      hypotheses = current.remainingHypotheses;
    }
    return current;
  };

  const strandArgs = { incidentId, severity, signal, classification, slo, priorKnowledge };
  [diagnosis, blastRadius, commsDrafts] = await ctx.parallel.all([
    () => diagnosisLoop(),
    () => ctx.task(blastRadiusTask, strandArgs),
    () => ctx.task(commsDraftTask, { ...strandArgs, customerFacing: isCustomerFacing, cadence: COMMS_CADENCE[severity] }),
  ]);
  timeline.push({ at: nowIso(), event: 'diagnosed', detail: `${diagnosis.rootCause ?? '(unresolved)'} [confidence=${diagnosis.confidence}]` });
  timeline.push({ at: nowIso(), event: 'blast-radius-assessed', detail: `${blastRadius.degradationType}: ${blastRadius.customersAffected} customers` });
  timeline.push({ at: nowIso(), event: 'comms-drafted', detail: 'status-page + customer drafts for open/update/mitigated/resolved' });

  // -------------------------------------------------------------------------
  // P4 — policy gate: execute-prod-mitigation (never auto-approves by design)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P4: mitigation plan + execute-prod-mitigation policy gate');
  mitigationPlan = await ctx.task(mitigationPlanTask, {
    incidentId,
    severity,
    diagnosis,
    blastRadius,
    priorKnowledge,
  });
  timeline.push({ at: nowIso(), event: 'mitigation-planned', detail: mitigationPlan.planSummary });

  const raiseMitigationGate = async (plan, phase) => {
    const gate = await routedBreakpoint(ctx, {
      question: `Approve execution of this production mitigation for ${severity} incident ${incidentId}?`,
      plan,
      diagnosisConfidence: diagnosis.confidence,
      rootCause: diagnosis.rootCause,
      blastRadius,
      rollback: plan.actions.map((a) => ({ action: a.action, rollback: a.rollback })),
    }, {
      breakpointId: 'execute-prod-mitigation',
      expert: routingExpert('execute-prod-mitigation', severity),
      tags: ['policy-gated', 'incident', sevTag],
      strategy: 'single',
      // Deliberately NO autoApproveAfterN — production mitigation must never auto-approve.
    });
    return recordGate('execute-prod-mitigation', phase, gate);
  };

  let mitigationApproved = false;
  let planFeedback = null;
  for (let round = 0; round < 2; round++) {
    if (round > 0) {
      // Exactly one re-plan pass with the rejection feedback threaded in.
      mitigationPlan = await ctx.task(mitigationPlanTask, {
        incidentId,
        severity,
        diagnosis,
        blastRadius,
        priorKnowledge,
        feedback: planFeedback,
        revision: round,
      });
      timeline.push({ at: nowIso(), event: 'mitigation-replanned', detail: mitigationPlan.planSummary });
    }
    const gate = await raiseMitigationGate(mitigationPlan, 'P4');
    if (gate.approved === true) {
      mitigationApproved = true;
      break;
    }
    planFeedback = gate.response || gate.feedback || 'mitigation plan rejected';
    timeline.push({ at: nowIso(), event: 'mitigation-gate-rejected', detail: String(planFeedback) });
  }
  if (!mitigationApproved) {
    // Fail closed: the executor is NEVER invoked on an unapproved plan — there is no
    // alternate execution path.
    return buildResult(false, 'execute-prod-mitigation gate rejected twice — mitigation never executed');
  }

  execution = await ctx.task(executeMitigationTask, {
    incidentId,
    severity,
    plan: mitigationPlan,
  });
  for (const act of execution.executed) {
    timeline.push({ at: act.timestamp, event: 'mitigation-action', detail: `${act.action} -> ${act.outcome}` });
  }
  timeline.push({ at: nowIso(), event: 'mitigation-executed', detail: execution.mitigationSummary });

  // -------------------------------------------------------------------------
  // P5 — policy gates: comms per severity cadence (fail-closed publication)
  // -------------------------------------------------------------------------
  const draftBodyFor = (actionId, commsPhase, draftSet) => {
    const table = actionId === 'publish-status-page' ? draftSet.statusPageDrafts : draftSet.customerCommsDrafts;
    const body = table ? table[commsPhase] : undefined;
    if (!body) {
      throw new Error(
        `Comms draft missing for ${actionId}/${commsPhase} — the drafter must produce all four phases; no fallback body is synthesized.`
      );
    }
    return body;
  };

  const publishGatedComms = async (actionId, policy, commsPhase, phaseLabel) => {
    const entry = {
      action: actionId,
      sev: severity,
      phase: commsPhase,
      required: policy.required,
      raised: true,
      approved: false,
      published: false,
    };
    let body = draftBodyFor(actionId, commsPhase, commsDrafts);
    let feedback = null;
    for (let round = 0; round < 2; round++) {
      if (round > 0) {
        // One redraft with the gate feedback, then exactly one re-gate.
        const redraft = await ctx.task(commsDraftTask, {
          incidentId,
          severity,
          signal,
          classification,
          blastRadius,
          diagnosis,
          customerFacing: isCustomerFacing,
          cadence: COMMS_CADENCE[severity],
          previousDrafts: commsDrafts,
          redraft: { actionId, phase: commsPhase, feedback },
        });
        body = draftBodyFor(actionId, commsPhase, redraft);
      }
      const gate = await routedBreakpoint(ctx, {
        question: `Approve ${actionId} (${commsPhase} update) for ${severity} incident ${incidentId}?`,
        draft: body,
        required: policy.required,
        cadence: COMMS_CADENCE[severity],
        blastRadius,
      }, {
        breakpointId: actionId,
        expert: routingExpert(actionId, severity),
        tags: ['policy-gated', 'incident', sevTag],
        strategy: 'single',
        ...(policy.presentAlwaysApprove ? { presentAlwaysApprove: true } : {}),
      });
      recordGate(actionId, phaseLabel, gate);
      if (gate.approved === true) {
        // Publication happens ONLY here, after this gate's approval.
        entry.approved = true;
        const published = await ctx.task(publishCommsTask, {
          incidentId,
          severity,
          actionId,
          phase: commsPhase,
          body,
          channels: commsChannels,
        });
        entry.published = published.sent === true;
        entry.messageRef = published.messageRef;
        timeline.push({ at: nowIso(), event: `comms-published:${actionId}`, detail: `${commsPhase} -> ${published.channel} (${published.messageRef})` });
        break;
      }
      feedback = gate.response || gate.feedback || 'comms gate rejected';
    }
    if (!entry.approved) {
      // Fail closed: a rejected/skipped gate leaves the message UNPUBLISHED, recorded.
      timeline.push({ at: nowIso(), event: `comms-withheld:${actionId}`, detail: `${commsPhase} left unpublished — gate not approved` });
    }
    commsLog.push(entry);
    return entry;
  };

  const runCommsRound = async (commsPhase, phaseLabel, logUnraised) => {
    const thunks = [];
    for (const actionId of ['publish-status-page', 'send-customer-incident-comms']) {
      const policy = commsPolicyFor(actionId, severity, isCustomerFacing);
      if (!policy.raised) {
        if (logUnraised) {
          commsLog.push({
            action: actionId,
            sev: severity,
            phase: commsPhase,
            required: false,
            raised: false,
            approved: false,
            published: false,
          });
        }
        continue;
      }
      thunks.push(() => publishGatedComms(actionId, policy, commsPhase, phaseLabel));
    }
    if (thunks.length > 1) {
      // The two SEV1 comms gates are independent — run them in parallel.
      await ctx.parallel.all(thunks);
    } else if (thunks.length === 1) {
      await thunks[0]();
    }
  };

  ctx.log?.('info', 'P5: severity-cadence comms gates');
  await runCommsRound('open', 'P5', true);

  // -------------------------------------------------------------------------
  // P6 — recovery verification (one bounded re-mitigation loop)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P6: recovery verification');
  verify = await ctx.task(verifyRecoveryTask, {
    incidentId,
    severity,
    signal,
    mitigation: execution,
    attempt: 1,
  });
  timeline.push({ at: nowIso(), event: 'recovery-checked', detail: `recovered=${verify.recovered} window=${verify.stabilityWindowMinutes}m` });

  if (verify.recovered !== true) {
    // Loop back to P4 planning exactly once. The re-mitigation goes through the SAME
    // execute-prod-mitigation gate — no un-gated retry path exists.
    ctx.log?.('info', 'P6: recovery failed — one bounded re-mitigation loop');
    mitigationPlan = await ctx.task(mitigationPlanTask, {
      incidentId,
      severity,
      diagnosis,
      blastRadius,
      priorKnowledge,
      feedback: {
        reason: 'recovery verification failed',
        probesRun: verify.probesRun,
        previousPlan: mitigationPlan.planSummary,
        previousExecution: execution.mitigationSummary,
      },
      revision: 'recovery-retry',
    });
    timeline.push({ at: nowIso(), event: 'mitigation-replanned', detail: `recovery-retry: ${mitigationPlan.planSummary}` });
    const retryGate = await raiseMitigationGate(mitigationPlan, 'P6');
    if (retryGate.approved !== true) {
      return buildResult(false, 'recovery failed and the re-mitigation gate was rejected — run halted with state surfaced');
    }
    execution = await ctx.task(executeMitigationTask, {
      incidentId,
      severity,
      plan: mitigationPlan,
    });
    for (const act of execution.executed) {
      timeline.push({ at: act.timestamp, event: 'mitigation-action', detail: `${act.action} -> ${act.outcome}` });
    }
    verify = await ctx.task(verifyRecoveryTask, {
      incidentId,
      severity,
      signal,
      mitigation: execution,
      attempt: 2,
    });
    timeline.push({ at: nowIso(), event: 'recovery-checked', detail: `recovered=${verify.recovered} window=${verify.stabilityWindowMinutes}m (attempt 2)` });
    if (verify.recovered !== true) {
      return buildResult(false, 'recovery verification failed twice (initial + one bounded re-mitigation) — run halted with state surfaced');
    }
  }

  // Resolved update rides the SAME P5 gate machinery (unraised actions were already
  // recorded once in the open round — not re-logged here).
  await runCommsRound('resolved', 'P6', false);

  // -------------------------------------------------------------------------
  // P7/P8/P9 — postmortem draft, adversarial completeness gate, gated publication
  // -------------------------------------------------------------------------
  const postmortemNeeded =
    severity === 'SEV1' || severity === 'SEV2'
      ? true
      : severity === 'SEV3'
        ? postmortemRequired !== false
        : postmortemRequired === true;

  let draftActionItems = [];
  if (postmortemNeeded) {
    ctx.log?.('info', 'P7: postmortem draft');
    const postmortemPath = `${artifactsRoot}/postmortem-${incidentId}.md`;
    const draft = await ctx.task(postmortemDraftTask, {
      incidentId,
      severity,
      signal,
      classification,
      diagnosis,
      blastRadius,
      mitigation: { plan: mitigationPlan, execution },
      verify,
      commsLog,
      timeline,
      postmortemPath,
    });
    postmortem = { ...postmortem, path: draft.postmortemPath };
    draftActionItems = draft.actionItems;
    artifacts.push(draft.postmortemPath);
    timeline.push({ at: nowIso(), event: 'postmortem-drafted', detail: draft.postmortemPath });

    ctx.log?.('info', 'P8: adversarial postmortem-completeness gate');
    const gateResult = await adversarialGate(ctx, {
      gateId: 'iml.postmortem-completeness',
      artifact: { path: draft.postmortemPath, description: 'Blameless postmortem' },
      critics: [
        {
          name: 'timeline-fidelity-critic',
          role: 'Incident timeline auditor',
          focus: 'every timeline entry in the postmortem matches the run journal and task timestamps — EXECUTE the comparison: read the postmortem timeline, read the journal/timeline context, diff them; cite each verified/mismatched entry',
        },
        {
          name: 'action-item-completeness-critic',
          role: 'Follow-through auditor',
          focus: 'every action item has a named owner AND concrete due date AND category; every "what went poorly" finding maps to at least one action item — cite exact lines',
        },
        {
          name: 'blameless-depth-critic',
          role: 'Postmortem quality reviewer',
          focus: 'contributing factors go beyond the proximate cause (systemic depth, 5-whys), language blameless, root cause stated with supporting evidence',
        },
      ],
      ironLaw: [
        'Executed evidence only: run the actual cross-checks (diff timeline vs journal context, enumerate action items) — a read-only skim is not evidence.',
        'Cite file:line or executed-check output for every claim; passed:true with empty evidence is rejected by the combinator.',
      ],
      maxFixAttempts,
      fixer: {},
      context: {
        timeline,
        journalHint: `run ${ctx.runId} journal — orchestrator timeline in context is ground truth`,
        actionItems: draftActionItems,
        diagnosis,
        mitigationExecution: execution,
      },
    });
    postmortem = {
      ...postmortem,
      gate: {
        passed: gateResult.passed,
        attempts: gateResult.attempts,
        escalated: gateResult.escalated,
        issues: gateResult.issues,
      },
    };
    if (gateResult.escalated) {
      breakpointsHit.push('iml.postmortem-completeness.gate-escalation');
    }
    timeline.push({ at: nowIso(), event: 'postmortem-gate', detail: `passed=${gateResult.passed} attempts=${gateResult.attempts} escalated=${gateResult.escalated}` });

    // P9 — raised ONLY when the gate passed (or the owner accepted via escalation).
    if (gateResult.passed) {
      ctx.log?.('info', 'P9: publish-postmortem policy gate');
      const pubGate = await routedBreakpoint(ctx, {
        question: `Publish the postmortem for ${severity} incident ${incidentId} to its audience?`,
        postmortemPath: draft.postmortemPath,
        executiveSummary: draft.executiveSummary,
        gateEvidence: gateResult.evidence,
        audience: severity === 'SEV1' || severity === 'SEV2' ? 'internal-wide' : 'team',
      }, {
        breakpointId: 'publish-postmortem',
        expert: routingExpert('publish-postmortem', severity),
        tags: ['policy-gated', 'incident', sevTag],
        strategy: 'single',
      });
      recordGate('publish-postmortem', 'P9', pubGate);
      if (pubGate.approved === true) {
        postmortem = { ...postmortem, published: true };
        timeline.push({ at: nowIso(), event: 'postmortem-published', detail: draft.postmortemPath });
      } else {
        timeline.push({ at: nowIso(), event: 'postmortem-withheld', detail: 'publish gate not approved — stays draft (fail-closed)' });
      }
    } else {
      timeline.push({ at: nowIso(), event: 'postmortem-withheld', detail: 'completeness gate failed — publish gate never raised' });
    }
  } else {
    timeline.push({ at: nowIso(), event: 'postmortem-skipped', detail: `${severity} with postmortemRequired=${String(postmortemRequired)}` });
  }

  // -------------------------------------------------------------------------
  // P10 — action-item tracking + kip assert at close
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P10: action-item tracking + kip assert');
  let trackedIssues = [];
  if (draftActionItems.length > 0) {
    const tracking = await ctx.task(actionItemTrackingTask, {
      incidentId,
      severity,
      actionItems: draftActionItems,
    });
    trackedIssues = tracking.issues;
    timeline.push({ at: nowIso(), event: 'action-items-tracked', detail: `${trackedIssues.length} issues` });
  }
  actionItemsOut = draftActionItems.map((item) => {
    const issue = trackedIssues.find((i) => i.title === item.title);
    return {
      title: item.title,
      owner: item.owner,
      dueDate: item.dueDate,
      category: item.category,
      ...(issue && issue.url ? { issueUrl: issue.url } : {}),
    };
  });

  if (kipEnabled) {
    // Facts are built unconditionally-non-empty when this branch is reached: the
    // signature fact always exists.
    const facts = [
      { subject: `incident:${incidentId}`, predicate: 'has-signature', object: signatureString },
    ];
    if (diagnosis.rootCause) {
      facts.push({ subject: `incident:${incidentId}`, predicate: 'root-cause', object: diagnosis.rootCause });
    }
    facts.push({
      subject: `incident:${incidentId}`,
      predicate: 'mitigated-by',
      object: mitigationPlan.planSummary,
      props: {
        efficacy: verify.recovered === true ? 'effective' : 'ineffective',
        reversible: mitigationPlan.actions.every((a) => a.reversible === true),
      },
    });
    for (const item of actionItemsOut) {
      facts.push({
        subject: `incident:${incidentId}`,
        predicate: 'action-item',
        object: item.title,
        props: { owner: item.owner, dueDate: item.dueDate, category: item.category },
      });
    }
    const asserted = await kipAssert(ctx, { kipDir, kipModel, kind: 'incident-management', facts });
    kipFactsAsserted = asserted.asserted;
    timeline.push({ at: nowIso(), event: 'kip-assert', detail: `${kipFactsAsserted} facts` });
  }

  // SLA breach detection (MTTR against the provided slo).
  slaBreaches = [];
  if (slo && typeof slo.mttrMinutes === 'number') {
    const mttrMinutes = (ctx.now() - new Date(signal.firstSeenAt).getTime()) / 60000;
    if (mttrMinutes > slo.mttrMinutes) {
      slaBreaches.push(`mttr-breach: ${mttrMinutes.toFixed(1)}m > ${slo.mttrMinutes}m`);
    }
  }
  timeline.push({ at: nowIso(), event: 'incident-closed', detail: `elapsed=${((ctx.now() - startMs) / 60000).toFixed(1)}m` });

  const success =
    verify.recovered === true && (postmortemNeeded ? postmortem.gate !== null && postmortem.gate.passed === true : true);
  return buildResult(success);
}
