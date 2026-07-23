/**
 * @process data-privacy-compliance/dsar-lifecycle
 * @description Single-workflow DSAR (data-subject access request) lifecycle with statutory
 *   deadline clocks, deadline-zone-routed policy gates, and kip data-privacy memory.
 *   Intake + statutory-clock start (clock runs from RECEIPT) -> identity verification
 *   (fail-closed) -> kip-reconciled data-map refresh -> parallel multi-system retrieval ->
 *   exemption analysis with mandatory per-item legal bases -> branch: disclosure package
 *   compilation OR policy-gated deletion plan/execution -> adversarial
 *   completeness-and-exemption gate with EXECUTED post-deletion verification ->
 *   conditional DPIA sign-off gate -> policy-gated disclosure/denial delivery ->
 *   deadline-audited closure + kip assert.
 * @inputs {
 *   request: {                       // required — the data-subject request
 *     receivedAt: string,            // ISO timestamp, REQUIRED — starts the statutory clock
 *     channel: string,               // how the request arrived (email, portal, letter, ...)
 *     subject: { name: string, email: string, identifiers?: object },
 *     rawText: string
 *   },
 *   requestTypeOverride?: string,    // 'access'|'erasure'|'rectification'|'portability'|'non-dsar' — wins over intake classification, recorded
 *   jurisdiction: string,            // 'gdpr'|'ccpa'|string — REQUIRED
 *   dpiaContext?: object,            // provided -> DPIA drafted + dpia-signoff gate raised
 *   maxFixAttempts?: number,         // completeness-gate fixer budget (default 2)
 *   kipEnabled?: boolean,            // recall + assert data-privacy memory via kip (default true)
 *   kipDir?: string,                 // kip store directory (default '.a5c/kip')
 *   kipModel?: string,               // model for kip structured paths (default 'sonnet')
 *   artifactsDir?: string            // where packages/DPIA/audit land (default ctx.artifactsDir)
 * }
 * @outputs {
 *   success: boolean,
 *   dsarId: string,
 *   requestType: string,             // 'access'|'erasure'|'rectification'|'portability'|'non-dsar'
 *   identityVerified: boolean,
 *   clock: { startedAt, deadlineAt, zoneAtClosure, breached, ledger: array },
 *   dataMap: { systems, discrepancies, dpiaRequired } | null,
 *   retrieval: { perSystem: array, allSystemsSearched: boolean } | null,
 *   withheld: Array<{ itemRef, reason, legalBasis }>,
 *   deletion: { plan, executed, verified } | null,     // erasure branch only
 *   disclosure: { sent, deliveredAt, messageRef } | null,
 *   dpia: { required, path, signedOff } | null,
 *   completenessGate: { passed, attempts, escalated, issues } | null,
 *   autoApprovals: Array<{ breakpointId, phase, at }>, // ALWAYS present (possibly empty) — fail-closed provenance
 *   kipFactsAsserted: number,
 *   slaBreaches: string[],
 *   artifacts: string[],
 *   metadata: { processId, runId, clockLedger, breakpointsHit, requestTypeOverridden, reason? }
 * }
 * @graph
 *   domains: [domain:legal, domain:business]
 *   specializations: [specialization:data-privacy-compliance]
 *   workflows: [workflow:compliance-audit]
 *   roles: [role:dpo, role:privacy-counsel, role:compliance-officer]
 *   skillAreas: [skill-area:compliance-automation]
 * @policyGatedActions data-deletion, disclosure-response, dpia-signoff
 * @absorbs-as-seed domains/business/legal/data-mapping-inventory.js (composition, NOT
 *   supersedes: discovery/classification/system-inventory slices folded into
 *   dpc.data-map-refresh) and domains/business/legal/data-breach-response.js (composed BY
 *   NAME when breachIndicators fire the 72-hour clock — this process never absorbs
 *   regulator notification)
 *
 * STATUTORY_CLOCKS (reproduced verbatim — the frozen const below is the implementation):
 *   dsar:   30 days  — GDPR Art 12(3) / CCPA 1798.130 — runs from RECEIPT, not verification
 *   breach: 72 hours — GDPR Art 33(1)
 *   Clocks are statutory and NOT input-configurable; there is no override input.
 *
 * DEADLINE_ESCALATION (reproduced verbatim — the frozen const below is the implementation).
 * Expert escalates as the clock runs down:
 *   data-deletion:        comfortable dpo | warning dpo | critical privacy-counsel | breached privacy-counsel
 *   disclosure-response:  comfortable dpo | warning dpo | critical privacy-counsel | breached privacy-counsel
 *   dpia-signoff:         comfortable privacy-counsel | warning privacy-counsel | critical privacy-counsel | breached privacy-counsel
 *                         (not clock-driven, table kept total so lookups never miss)
 *
 * Hard rules: Style-A agent tasks only (zero kind:'shell'); every evidence-carrying
 * outputSchema declares evidence { type:'array', minItems:1 }; NO fallbacks — unknown
 * requestType throws, empty data map throws, unknown zone/action lookup throws, deletion
 * and disclosure never execute via any ungated path, and the clock ledger is accumulated
 * in the ORCHESTRATOR (never inside agents) so the deadline auditor and gate critics diff
 * against ground truth the agents cannot rewrite.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../common-utilities/routed-gate-combinators.js';

// ---------------------------------------------------------------------------
// Statutory model — frozen clocks, zones, escalation map, throwing lookups
// ---------------------------------------------------------------------------

/**
 * Statutory clocks. NOT input-configurable — there is deliberately no override input;
 * a statute is not a knob.
 */
export const STATUTORY_CLOCKS = Object.freeze({
  dsar: Object.freeze({ days: 30, basis: 'GDPR Art 12(3) / CCPA 1798.130' }),
  breach: Object.freeze({ hours: 72, basis: 'GDPR Art 33(1)' }),
});

/**
 * Valid DSAR request types. 'non-dsar' is a classification OUTCOME permitting early
 * exit, not a request type — it never appears in this list.
 */
export const REQUEST_TYPES = Object.freeze(['access', 'erasure', 'rectification', 'portability']);

/** Identity-verification methods the verifier must report one of; unknown method throws. */
export const IDENTITY_VERIFICATION_METHODS = Object.freeze([
  'account-authenticated',
  'document-check',
  'knowledge-based',
  'delegated-authority',
]);

/** Deadline zones, ordered from most to least remaining clock. */
export const DEADLINE_ZONES = Object.freeze(['comfortable', 'warning', 'critical', 'breached']);

/**
 * Policy-gate expert routing per deadline zone. The table is total — every action has an
 * expert at every zone — but lookups still go through deadlineExpert(), which throws on
 * unknown actions and zones (no default expert exists; fallbacks are forbidden).
 */
export const DEADLINE_ESCALATION = Object.freeze({
  'data-deletion': Object.freeze({
    comfortable: 'dpo',
    warning: 'dpo',
    critical: 'privacy-counsel',
    breached: 'privacy-counsel',
  }),
  'disclosure-response': Object.freeze({
    comfortable: 'dpo',
    warning: 'dpo',
    critical: 'privacy-counsel',
    breached: 'privacy-counsel',
  }),
  'dpia-signoff': Object.freeze({
    comfortable: 'privacy-counsel',
    warning: 'privacy-counsel',
    critical: 'privacy-counsel',
    breached: 'privacy-counsel', // not clock-driven — table kept total so lookups never miss
  }),
});

/**
 * Escalation lookup. THROWS on unknown action and unknown zone — exact analog of
 * incident-lifecycle routingExpert(); there is deliberately no default expert.
 *
 * @param {string} actionId - One of the three policy-gated action ids
 * @param {string} zone - 'comfortable'|'warning'|'critical'|'breached'
 * @returns {string} The expert route for the gate
 */
export function deadlineExpert(actionId, zone) {
  const row = DEADLINE_ESCALATION[actionId];
  if (!row) {
    throw new Error(
      `DEADLINE_ESCALATION: unknown policy-gated action '${actionId}'. ` +
      `Known actions: ${Object.keys(DEADLINE_ESCALATION).join(', ')} — no fallback route exists.`
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
 * Compute the deadline zone from the statutory clock. THROWS on non-finite inputs or a
 * deadline at/before the clock start — there is no fallback zone.
 *
 * remaining/total > 0.5 -> 'comfortable'; > 0.25 -> 'warning'; > 0 -> 'critical';
 * <= 0 -> 'breached'.
 *
 * @param {number} nowMs - Current epoch millis
 * @param {number} clockStartMs - Clock start epoch millis (receipt)
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
 * Request-type assertion (mirror of incident-lifecycle assertClassifiedSeverity).
 * 'non-dsar' passes through as a classification outcome permitting early exit; anything
 * else must be a member of REQUEST_TYPES or this THROWS — no fallback type is applied.
 *
 * @param {string} value - Candidate request type
 * @param {string} source - Where the value came from (for the error message)
 * @returns {string} The validated value
 */
export function assertRequestType(value, source) {
  if (value === 'non-dsar') return value;
  if (!REQUEST_TYPES.includes(value)) {
    throw new Error(
      `Unknown requestType '${value}' from ${source} — expected one of ` +
      `${REQUEST_TYPES.join('|')}|non-dsar. No fallback request type is applied.`
    );
  }
  return value;
}

function assertVerificationMethod(value, source) {
  if (!IDENTITY_VERIFICATION_METHODS.includes(value)) {
    throw new Error(
      `Unknown identity-verification method '${value}' from ${source} — expected one of ` +
      `${IDENTITY_VERIFICATION_METHODS.join('|')}. No fallback method is applied.`
    );
  }
  return value;
}

// ---------------------------------------------------------------------------
// P1 — DSAR intake
// ---------------------------------------------------------------------------

export const dsarIntakeTask = defineTask('dpc.dsar-intake', (args, taskCtx) => ({
  kind: 'agent',
  title: `Intake + classify DSAR from ${args.request.subject.email} (${args.jurisdiction})`,
  agent: {
    name: 'dsar-intake-analyst',
    prompt: {
      role: 'DSAR intake analyst',
      task: 'Classify the data-subject request against the statutory catalog and scope it',
      context: args,
      instructions: [
        'Classify requestType strictly: access | erasure | rectification | portability | non-dsar.',
        'non-dsar means the message is not a data-subject request at all (marketing opt-out only, support ticket, spam, duplicate) — the process exits early on it.',
        'Mint a stable kebab-case dsarId from the subject and receipt date.',
        'Name the statutoryBasis for the classified type in the given jurisdiction (e.g. GDPR Art 15 for access, Art 17 for erasure).',
        'Cross-reference priorKnowledge facts (prior DSAR precedents for this subject/jurisdiction) and reflect them in scopeNotes.',
        'Scan the raw text for breach indicators (mentions of leaks, unauthorized access, exposed data) — a non-empty breachIndicators opens the statutory 72-hour clock upstream.',
        'Never guess missing subject identifiers — gaps become scopeNotes, not invented values.',
        'Evidence entries must cite the concrete request fields or prior-DSAR facts grounding the classification — at least one entry.',
      ],
      outputFormat: 'JSON with dsarId string, requestType string (access|erasure|rectification|portability|non-dsar), statutoryBasis string, subjectProfile object, breachIndicators array, scopeNotes array, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['dsarId', 'requestType', 'statutoryBasis', 'subjectProfile', 'breachIndicators', 'scopeNotes', 'evidence'],
      properties: {
        dsarId: { type: 'string' },
        requestType: { type: 'string', enum: ['access', 'erasure', 'rectification', 'portability', 'non-dsar'] },
        statutoryBasis: { type: 'string' },
        subjectProfile: { type: 'object' },
        breachIndicators: { type: 'array' },
        scopeNotes: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpc', 'privacy', 'dsar', 'intake'],
}));

// ---------------------------------------------------------------------------
// P2 — identity verification
// ---------------------------------------------------------------------------

export const identityVerificationTask = defineTask('dpc.identity-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Verify data-subject identity for ${args.dsarId}`,
  agent: {
    name: 'identity-verifier',
    prompt: {
      role: 'Identity verifier',
      task: 'Verify the requester is the data subject (or an authorized delegate) before any data moves',
      context: args,
      instructions: [
        'Report exactly one method: account-authenticated | document-check | knowledge-based | delegated-authority.',
        'checksPerformed must list the concrete checks you actually executed — verified:true with no checks is schema-invalid.',
        'Proportionality: do not demand more identity data than the request warrants (GDPR Art 12(6)).',
        'For delegated-authority, the delegation instrument itself must be verified and cited.',
        'Report residualRisk honestly — verification is fail-closed upstream; do not round up to verified:true.',
        'Evidence entries must cite the concrete check outputs — at least one entry.',
      ],
      outputFormat: 'JSON with verified boolean, method string (account-authenticated|document-check|knowledge-based|delegated-authority), checksPerformed array (minItems 1), residualRisk string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['verified', 'method', 'checksPerformed', 'residualRisk', 'evidence'],
      properties: {
        verified: { type: 'boolean' },
        method: { type: 'string', enum: ['account-authenticated', 'document-check', 'knowledge-based', 'delegated-authority'] },
        checksPerformed: { type: 'array', minItems: 1 },
        residualRisk: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpc', 'privacy', 'dsar', 'identity'],
}));

// ---------------------------------------------------------------------------
// P3 — data-map refresh
// ---------------------------------------------------------------------------

export const dataMapRefreshTask = defineTask('dpc.data-map-refresh', (args, taskCtx) => ({
  kind: 'agent',
  title: `Refresh data map for ${args.dsarId} (${args.jurisdiction})`,
  agent: {
    name: 'data-map-curator',
    prompt: {
      role: 'Data-map curator',
      task: 'Reconcile the kip-recalled data map with the live system inventory for this subject',
      context: args,
      instructions: [
        'Seeded by data-mapping-inventory discovery/classification/system-inventory slices folded into this one reconciliation task.',
        'Cite recalled kip facts for systems already mapped — do not rediscover what the store already knows; verify it instead.',
        'Every system entry must carry: systemId, owner, dataCategories, queryMethod, containsSubjectDataLikely.',
        'Record every discrepancy between the recalled map and the live inventory in discrepanciesVsRecalled — these get asserted back to kip at closure.',
        'Set dpiaRequired true only when the request surfaces new or changed high-risk processing (with dpiaTrigger naming it) — never as a precaution default.',
        'Evidence entries must cite the inventory sources or kip facts behind each system entry — at least one entry.',
      ],
      outputFormat: 'JSON with systems array (minItems 1) of { systemId, owner, dataCategories, queryMethod, containsSubjectDataLikely }, discrepanciesVsRecalled array, dpiaRequired boolean, dpiaTrigger string|null, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['systems', 'discrepanciesVsRecalled', 'dpiaRequired', 'evidence'],
      properties: {
        systems: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['systemId', 'owner', 'dataCategories', 'queryMethod'] },
        },
        discrepanciesVsRecalled: { type: 'array' },
        dpiaRequired: { type: 'boolean' },
        dpiaTrigger: { type: ['string', 'null'] },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpc', 'privacy', 'data-map'],
}));

// ---------------------------------------------------------------------------
// P4 — per-system retrieval (ctx.parallel fan-out unit)
// ---------------------------------------------------------------------------

export const systemRetrievalTask = defineTask('dpc.system-retrieval', (args, taskCtx) => ({
  kind: 'agent',
  title: `Retrieve subject data from ${args.system.systemId} for ${args.dsarId}`,
  agent: {
    name: 'system-data-retriever',
    prompt: {
      role: 'System data retriever',
      task: `Search ${args.system.systemId} for every record about the data subject`,
      context: args,
      instructions: [
        'Search via the mapped queryMethod using every subject identifier available (email, name, ids).',
        'queriesRun must list each query you actually executed with its resultCount — searched:true without queriesRun is schema-invalid.',
        'Report records found as structured entries with their data categories; notFound:true only after every identifier was queried.',
        'RETRIEVAL ONLY: do not redact, delete, or transform anything — exemption analysis and deletion happen downstream under their own controls.',
        'Evidence entries must be the raw executed query outputs — at least one entry.',
      ],
      outputFormat: 'JSON with systemId string, searched boolean, queriesRun array (minItems 1) of { query, resultCount }, records array, notFound boolean, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['systemId', 'searched', 'queriesRun', 'records', 'notFound', 'evidence'],
      properties: {
        systemId: { type: 'string' },
        searched: { type: 'boolean' },
        queriesRun: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['query', 'resultCount'] },
        },
        records: { type: 'array' },
        notFound: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpc', 'privacy', 'retrieval'],
}));

// ---------------------------------------------------------------------------
// P5 — exemption analysis + branch assembly tasks
// ---------------------------------------------------------------------------

export const exemptionAnalysisTask = defineTask('dpc.exemption-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze exemptions for ${args.dsarId} (${args.jurisdiction})`,
  agent: {
    name: 'exemption-analyst',
    prompt: {
      role: 'Exemption analyst',
      task: 'Decide, item by item, what is disclosable and what must be withheld — with legal bases',
      context: args,
      instructions: [
        'Every withheld item MUST cite a specific legal basis: instrument + article + rationale (e.g. GDPR Art 15(4) third-party rights). An uncited withholding cannot be expressed in the schema.',
        'No blanket exemptions — each withholding is per-item, and the exemption critic re-verifies every citation.',
        'Check disclosed items for third-party personal data that itself needs withholding or redaction.',
        'Items neither withheld nor listed as disclosable do not exist — account for every retrieved record.',
        'Evidence entries must cite the specific retrieved records and legal texts consulted — at least one entry.',
      ],
      outputFormat: 'JSON with withheld array of { itemRef, reason, legalBasis { instrument, article, rationale } }, disclosable array, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['withheld', 'disclosable', 'evidence'],
      properties: {
        withheld: {
          type: 'array',
          items: {
            type: 'object',
            required: ['itemRef', 'reason', 'legalBasis'],
            properties: {
              itemRef: { type: 'string' },
              reason: { type: 'string' },
              legalBasis: {
                type: 'object',
                required: ['instrument', 'article', 'rationale'],
                properties: {
                  instrument: { type: 'string' },
                  article: { type: 'string' },
                  rationale: { type: 'string' },
                },
              },
            },
          },
        },
        disclosable: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpc', 'privacy', 'exemption'],
}));

export const responseCompilationTask = defineTask('dpc.response-compilation', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? `Revise DSAR response package for ${args.dsarId} (gate feedback)`
    : `Compile DSAR response package for ${args.dsarId}`,
  agent: {
    name: 'disclosure-compiler',
    prompt: {
      role: 'Disclosure compiler',
      task: `Compile the DSAR response package at ${args.packagePath} — DRAFT ONLY`,
      context: args,
      instructions: [
        `Write the package to ${args.packagePath} and report that exact path back.`,
        'For access/portability: include the disclosable records (portability in a structured, machine-readable format), processing purposes, recipients, and retention periods.',
        'For rectification: include the corrections applied and their before/after states.',
        'If nothing is disclosable, compile a DENIAL letter instead — it must cite the per-item legal basis for every withholding; denial rides this same schema and the same gates.',
        'Include a withheld-items summary citing each legal basis (instrument + article) without revealing the withheld content.',
        'DRAFT ONLY: you must NOT send anything — delivery happens only after the disclosure-response policy gate approves.',
        args.feedback
          ? `Revision round: address ONLY this gate feedback: ${JSON.stringify(args.feedback)}`
          : 'First compilation round: no gate feedback to address.',
        'Evidence entries must cite the retrieval/exemption results each package section is grounded in — at least one entry.',
      ],
      outputFormat: 'JSON with packagePath string, format string, sectionsIncluded array, withheldSummaryIncluded boolean, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['packagePath', 'format', 'sectionsIncluded', 'withheldSummaryIncluded', 'evidence'],
      properties: {
        packagePath: { type: 'string' },
        format: { type: 'string' },
        sectionsIncluded: { type: 'array' },
        withheldSummaryIncluded: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpc', 'privacy', 'disclosure', 'draft'],
}));

export const deletionPlanTask = defineTask('dpc.deletion-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? `Re-plan deletion for ${args.dsarId} (gate feedback)`
    : `Plan deletion for ${args.dsarId}`,
  agent: {
    name: 'deletion-planner',
    prompt: {
      role: 'Deletion planner',
      task: 'Turn the retrieval results into a per-system deletion plan — a PLAN, not an execution',
      context: args,
      instructions: [
        'One action per system holding subject data: { systemId, action, method, verificationQuery, retentionOverride? }.',
        'Every action MUST carry the exact verificationQuery the completeness gate will later EXECUTE to prove zero records remain.',
        'Retention-hold conflicts become retentionOverride entries with their legal basis (instrument + article) — never silent skips.',
        'You must NOT delete anything: deletion only happens after the data-deletion policy gate approves this plan.',
        args.feedback
          ? `Re-plan round: address ONLY this gate feedback: ${JSON.stringify(args.feedback)}`
          : 'First planning round: no gate feedback to address.',
        'Evidence entries must cite the retrieval results each planned action rests on — at least one entry.',
      ],
      outputFormat: 'JSON with actions array (minItems 1) of { systemId, action, method, verificationQuery, retentionOverride? }, planSummary string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'planSummary', 'evidence'],
      properties: {
        actions: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['systemId', 'action', 'method', 'verificationQuery'] },
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
  labels: ['agent', 'dpc', 'privacy', 'deletion', 'plan'],
}));

// ---------------------------------------------------------------------------
// P7 — deletion execution (post-approval ONLY)
// ---------------------------------------------------------------------------

export const deletionExecutionTask = defineTask('dpc.deletion-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved deletion plan for ${args.dsarId}`,
  agent: {
    name: 'deletion-executor',
    prompt: {
      role: 'Deletion executor',
      task: 'Execute EXACTLY the approved deletion plan — nothing more',
      context: args,
      instructions: [
        'This task only ever runs AFTER the data-deletion policy gate approved the plan in context.',
        'Execute exactly the approved actions in order; do not improvise additional deletions or touch unlisted systems.',
        'Log every action with an ISO timestamp, its outcome, and deleted true/false — these entries feed the orchestrator clock ledger.',
        'Failures are reported honestly with deleted:false for that system — never silently retried, never papered over.',
        `Write the deletion execution report to ${args.reportPath} and report allDeleted accordingly.`,
        'Evidence entries must be the raw per-system execution outputs — at least one entry.',
      ],
      outputFormat: 'JSON with executed array of { systemId, action, timestamp, outcome, deleted }, allDeleted boolean, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['executed', 'allDeleted', 'evidence'],
      properties: {
        executed: {
          type: 'array',
          items: { type: 'object', required: ['systemId', 'action', 'timestamp', 'outcome', 'deleted'] },
        },
        allDeleted: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpc', 'privacy', 'deletion', 'execute', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P9 — DPIA draft
// ---------------------------------------------------------------------------

export const dpiaDraftTask = defineTask('dpc.dpia-draft', (args, taskCtx) => ({
  kind: 'agent',
  title: `Draft DPIA for ${args.dsarId}`,
  agent: {
    name: 'dpia-author',
    prompt: {
      role: 'DPIA author',
      task: `Compose the data-protection impact assessment at ${args.dpiaPath}`,
      context: args,
      instructions: [
        `Write the DPIA to ${args.dpiaPath} and report that exact path back.`,
        'Sections in order: processing description, necessity/proportionality, risks, mitigations, residual risk.',
        'Every risk entry carries: risk, likelihood, severity, mitigation.',
        'residualRiskAcceptable is your honest verdict after mitigations — the sign-off gate decides, not you.',
        'Evidence entries must cite the dpiaTrigger/dpiaContext and data-map facts grounding the assessment — at least one entry.',
      ],
      outputFormat: 'JSON with dpiaPath string, risks array (minItems 1) of { risk, likelihood, severity, mitigation }, residualRiskAcceptable boolean, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['dpiaPath', 'risks', 'residualRiskAcceptable', 'evidence'],
      properties: {
        dpiaPath: { type: 'string' },
        risks: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['risk', 'likelihood', 'severity', 'mitigation'] },
        },
        residualRiskAcceptable: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpc', 'privacy', 'dpia'],
}));

// ---------------------------------------------------------------------------
// P10 — response delivery (post-approval ONLY)
// ---------------------------------------------------------------------------

export const responseDeliveryTask = defineTask('dpc.response-delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deliver gate-approved DSAR response for ${args.dsarId}`,
  agent: {
    name: 'disclosure-sender',
    prompt: {
      role: 'Disclosure sender',
      task: 'Send the gate-approved response package to the data subject',
      context: args,
      instructions: [
        'This task only ever runs AFTER the disclosure-response policy gate approved the exact package in context — send it VERBATIM.',
        'Deliver via the channel the request arrived on unless the subject specified otherwise; use a secure delivery method for personal data.',
        'Report the concrete messageRef (message id, tracking id, or delivery receipt) and deliveredAt timestamp.',
        'Evidence entries must be the raw delivery confirmation — at least one entry.',
      ],
      outputFormat: 'JSON with sent boolean, channel string, messageRef string, deliveredAt string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['sent', 'channel', 'messageRef', 'deliveredAt', 'evidence'],
      properties: {
        sent: { type: 'boolean' },
        channel: { type: 'string' },
        messageRef: { type: 'string' },
        deliveredAt: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpc', 'privacy', 'disclosure', 'delivery', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P11 — deadline-audited closure
// ---------------------------------------------------------------------------

export const closureAuditTask = defineTask('dpc.closure-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: `Audit statutory deadlines at closure for ${args.dsarId}`,
  agent: {
    name: 'deadline-auditor',
    prompt: {
      role: 'Deadline auditor',
      task: 'EXECUTE the deadline arithmetic against the orchestrator clock ledger (ground truth)',
      context: args,
      instructions: [
        'For every clock in context (the 30-day DSAR clock, and the 72-hour breach clock if opened): compute elapsed vs the statutory deadline and the signed marginMinutes.',
        'The orchestrator clock ledger in context is ground truth — cite its entries; do not reconstruct timestamps from memory.',
        'Verdict deadlineBreached is true when ANY audited clock closed past its deadline.',
        `Write the audit report to ${args.auditPath} and report that exact path back.`,
        'Evidence entries must cite the specific ledger entries and the executed arithmetic — at least one entry.',
      ],
      outputFormat: 'JSON with clocks array (minItems 1) of { clockId, startedAt, deadlineAt, closedAt, marginMinutes, breached }, deadlineBreached boolean, auditPath string, evidence array (minItems 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['clocks', 'deadlineBreached', 'auditPath', 'evidence'],
      properties: {
        clocks: {
          type: 'array',
          minItems: 1,
          items: { type: 'object', required: ['clockId', 'startedAt', 'deadlineAt', 'closedAt', 'marginMinutes', 'breached'] },
        },
        deadlineBreached: { type: 'boolean' },
        auditPath: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'dpc', 'privacy', 'audit'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    request,
    requestTypeOverride = null,
    jurisdiction,
    dpiaContext = null,
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
    artifactsDir,
  } = inputs || {};

  if (!request || !request.receivedAt || !request.subject || !request.subject.name || !request.subject.email) {
    throw new Error(
      'dsar-lifecycle requires request { receivedAt, subject { name, email } } — refusing to guess when a statutory clock started or who the data subject is.'
    );
  }
  if (!jurisdiction) {
    throw new Error('dsar-lifecycle requires jurisdiction (gdpr|ccpa|...) — exemption analysis has no fallback legal regime.');
  }
  const clockStartMs = Date.parse(request.receivedAt);
  if (!Number.isFinite(clockStartMs)) {
    throw new Error(
      `dsar-lifecycle: request.receivedAt '${request.receivedAt}' is not a parseable ISO timestamp — the statutory clock cannot start from a guess.`
    );
  }
  if (requestTypeOverride !== null) {
    assertRequestType(requestTypeOverride, 'inputs.requestTypeOverride');
  }

  const artifactsRoot = artifactsDir ?? ctx.artifactsDir;
  const nowIso = () => new Date().toISOString();

  // Statutory clock — started by the ORCHESTRATOR from RECEIPT (GDPR Art 12(3)),
  // never from verification, never by an agent.
  const clockStartedAt = request.receivedAt;
  const deadlineMs = clockStartMs + STATUTORY_CLOCKS.dsar.days * 24 * 60 * 60 * 1000;
  const deadlineAt = new Date(deadlineMs).toISOString();
  const currentZone = () => deadlineZone(ctx.now(), clockStartMs, deadlineMs);

  // Clock ledger is accumulated HERE, in the orchestrator — agents never write it.
  // The deadline auditor and gate critics diff against this ground truth.
  const clockLedger = [];
  const recordClock = (clock, event, detail) => {
    clockLedger.push({ at: nowIso(), clock, event, detail });
  };
  const breakpointsHit = [];
  // ALWAYS present in outputs (possibly empty): every harness-level auto-approval of a
  // policy gate is surfaced here — fail-closed provenance, nothing auto-approves silently.
  const autoApprovals = [];

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
  let dsarId = null;
  let requestType = null;
  let requestTypeOverridden = false;
  let identityVerified = false;
  let identityBypassed = false;
  let dataMap = null;
  let retrieval = null;
  let withheld = [];
  let deletion = null;
  let disclosure = null;
  let dpia = null;
  let completenessGate = null;
  let kipFactsAsserted = 0;
  let slaBreaches = [];
  const artifacts = [];
  let breachClock = null;

  const buildResult = (success, reason) => ({
    success,
    dsarId,
    requestType,
    identityVerified,
    clock: {
      startedAt: clockStartedAt,
      deadlineAt,
      zoneAtClosure: currentZone(),
      breached: currentZone() === 'breached',
      ledger: clockLedger,
    },
    dataMap: dataMap
      ? {
          systems: dataMap.systems,
          discrepancies: dataMap.discrepanciesVsRecalled,
          dpiaRequired: dataMap.dpiaRequired === true,
        }
      : null,
    retrieval,
    withheld,
    deletion,
    disclosure,
    dpia,
    completenessGate,
    autoApprovals,
    kipFactsAsserted,
    slaBreaches,
    artifacts,
    metadata: {
      processId: 'data-privacy-compliance/dsar-lifecycle',
      runId: ctx.runId,
      clockLedger,
      breakpointsHit,
      requestTypeOverridden,
      ...(reason ? { reason } : {}),
    },
  });

  const runClosureAudit = async (phaseLabel) => {
    const clocks = [
      {
        clockId: 'dsar',
        startedAt: clockStartedAt,
        deadlineAt,
        basis: STATUTORY_CLOCKS.dsar.basis,
      },
      ...(breachClock
        ? [{ clockId: 'breach', startedAt: breachClock.startedAt, deadlineAt: breachClock.deadlineAt, basis: STATUTORY_CLOCKS.breach.basis }]
        : []),
    ];
    const audit = await ctx.task(closureAuditTask, {
      dsarId,
      clocks,
      clockLedger,
      deliveredAt: disclosure && disclosure.deliveredAt ? disclosure.deliveredAt : null,
      auditPath: `${artifactsRoot}/closure-audit-${dsarId}.md`,
      zone: currentZone(),
    });
    artifacts.push(audit.auditPath);
    slaBreaches = audit.clocks
      .filter((clock) => clock.breached === true)
      .map((clock) => `${clock.clockId}-deadline-breach: margin=${clock.marginMinutes}m (deadline ${clock.deadlineAt})`);
    recordClock('dsar', 'closure-audited', `${phaseLabel}: deadlineBreached=${audit.deadlineBreached} clocks=${audit.clocks.length}`);
    return audit;
  };

  // -------------------------------------------------------------------------
  // P0 — kip recall (kind 'data-privacy')
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P0: kip recall of data-map facts and DSAR precedents');
  let priorKnowledge = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  if (kipEnabled) {
    priorKnowledge = await kipRecall(ctx, {
      kipDir,
      topic: `data map + DSAR precedents: ${request.subject.email} [${jurisdiction}]`,
      kipModel,
      kind: 'data-privacy',
    });
    recordClock('dsar', 'kip-recall', `factCount=${priorKnowledge.factCount}`);
  }

  // -------------------------------------------------------------------------
  // P1 — DSAR intake + statutory-clock start (non-dsar exits early)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P1: DSAR intake + statutory clock start');
  // Clock runs from RECEIPT — recorded before classification, because the statute does
  // not wait for us to finish reading the request.
  recordClock('dsar', 'clock-started', `receivedAt=${clockStartedAt} deadline=${deadlineAt} basis=${STATUTORY_CLOCKS.dsar.basis}`);

  const intake = await ctx.task(dsarIntakeTask, {
    request,
    jurisdiction,
    priorKnowledge,
  });
  dsarId = intake.dsarId;
  requestType = assertRequestType(intake.requestType, 'dpc.dsar-intake');
  if (requestTypeOverride !== null && requestTypeOverride !== requestType) {
    requestType = requestTypeOverride;
    requestTypeOverridden = true;
  }
  recordClock('dsar', 'classified', `${requestType}${requestTypeOverridden ? ' (overridden)' : ''}: ${intake.statutoryBasis}`);

  if (requestType === 'non-dsar') {
    // Not a data-subject request — exit before verification, retrieval, or any gate.
    recordClock('dsar', 'clock-closed', 'classified non-dsar — statutory clock moot');
    return buildResult(true, 'classified non-dsar: no identity verification run, no data retrieved, no gates raised');
  }

  if (Array.isArray(intake.breachIndicators) && intake.breachIndicators.length > 0) {
    // A SECOND statutory clock opens: 72 hours, GDPR Art 33(1). Breach notification is
    // NOT absorbed here — it is composed BY NAME as its own process.
    const breachStartMs = ctx.now();
    breachClock = {
      startedAt: new Date(breachStartMs).toISOString(),
      deadlineAt: new Date(breachStartMs + STATUTORY_CLOCKS.breach.hours * 60 * 60 * 1000).toISOString(),
    };
    recordClock('breach', 'clock-started', `indicators=${JSON.stringify(intake.breachIndicators)} deadline=${breachClock.deadlineAt} basis=${STATUTORY_CLOCKS.breach.basis}`);
    recordClock('breach', 'composition-directive', 'run specializations/domains/business/legal/data-breach-response by name — dsar-lifecycle never absorbs regulator notification');
  }

  // -------------------------------------------------------------------------
  // P2 — identity verification (fail-closed)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P2: identity verification');
  const verification = await ctx.task(identityVerificationTask, {
    dsarId,
    requestType,
    jurisdiction,
    subject: request.subject,
    zone: currentZone(),
  });
  assertVerificationMethod(verification.method, 'dpc.identity-verification');
  identityVerified = verification.verified === true;
  recordClock('dsar', 'identity-verified', `verified=${identityVerified} method=${verification.method}`);

  if (!identityVerified) {
    // The only non-policy breakpoint in this process besides gate escalations: an
    // unverified requester is genuinely blocking (sparse-breakpoint rule). Verification
    // failure gates DISCLOSURE, so it routes via the disclosure-response escalation row.
    const zone = currentZone();
    const unverifiedGate = await routedBreakpoint(ctx, {
      question: `Identity verification FAILED for ${requestType} request ${dsarId} (method ${verification.method}, residual risk: ${verification.residualRisk}). Approve continuing anyway (recorded as an identity bypass), or reject to refuse the request fail-closed.`,
      checksPerformed: verification.checksPerformed,
      residualRisk: verification.residualRisk,
      clock: { deadlineAt, zone },
    }, {
      breakpointId: 'dpc.identity-verification.unverified',
      expert: deadlineExpert('disclosure-response', zone),
      tags: ['privacy', 'dsar', 'identity', zone],
      strategy: 'single',
    });
    recordGate('dpc.identity-verification.unverified', 'P2', unverifiedGate);
    if (unverifiedGate.approved !== true) {
      // A refusal is still deadline-audited before the run closes.
      recordClock('dsar', 'request-refused', 'identity unverified and bypass rejected — fail closed');
      await runClosureAudit('P2-refusal');
      return buildResult(false, 'identity unverified — no data retrieved, no disclosure');
    }
    identityBypassed = true;
    recordClock('dsar', 'identity-bypass-approved', unverifiedGate.response || 'proceeding despite failed verification — recorded, success will be false');
  }

  // -------------------------------------------------------------------------
  // P3 — data-map refresh (kip-recalled map reconciled against live inventory)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P3: data-map refresh');
  dataMap = await ctx.task(dataMapRefreshTask, {
    dsarId,
    requestType,
    jurisdiction,
    subject: request.subject,
    priorKnowledge,
    dpiaContext,
  });
  if (!Array.isArray(dataMap.systems) || dataMap.systems.length === 0) {
    throw new Error(
      'data map is empty — refusing to search nothing; run data-mapping-inventory first. No fallback system list.'
    );
  }
  recordClock('dsar', 'data-map-refreshed', `systems=${dataMap.systems.length} discrepancies=${dataMap.discrepanciesVsRecalled.length} dpiaRequired=${dataMap.dpiaRequired === true}`);
  const dpiaFromRequest = dataMap.dpiaRequired === true;
  const dpiaRequired = dpiaFromRequest || dpiaContext !== null;

  // -------------------------------------------------------------------------
  // P4 — parallel multi-system retrieval
  // -------------------------------------------------------------------------
  ctx.log?.('info', `P4: parallel retrieval across ${dataMap.systems.length} systems`);
  const perSystem = await ctx.parallel.all(
    dataMap.systems.map((system) => () =>
      ctx.task(systemRetrievalTask, {
        dsarId,
        requestType,
        subject: request.subject,
        system,
        zone: currentZone(),
      })
    )
  );
  for (const result of perSystem) {
    recordClock('dsar', 'system-searched', `${result.systemId}: searched=${result.searched} records=${result.records.length} queries=${result.queriesRun.length}`);
  }
  // allSystemsSearched is computed by the ORCHESTRATOR by diffing retrieval results
  // against the data map — ground truth for the coverage critic, not an agent claim.
  const searchedIds = new Set(perSystem.filter((r) => r.searched === true).map((r) => r.systemId));
  const missedSystems = dataMap.systems.filter((system) => !searchedIds.has(system.systemId)).map((system) => system.systemId);
  retrieval = { perSystem, allSystemsSearched: missedSystems.length === 0 };
  if (missedSystems.length > 0) {
    recordClock('dsar', 'coverage-gap', `unsearched systems: ${missedSystems.join(', ')}`);
  }

  // -------------------------------------------------------------------------
  // P5 — exemption analysis + branch assembly
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P5: exemption analysis + branch assembly');
  const exemption = await ctx.task(exemptionAnalysisTask, {
    dsarId,
    requestType,
    jurisdiction,
    retrieval: perSystem,
    zone: currentZone(),
  });
  withheld = exemption.withheld;
  recordClock('dsar', 'exemptions-analyzed', `withheld=${withheld.length} disclosable=${exemption.disclosable.length}`);

  const isErasure = requestType === 'erasure';
  const deletionReportPath = `${artifactsRoot}/deletion-report-${dsarId}.json`;
  let compilation = null;
  let deletionPlan = null;

  if (isErasure) {
    deletionPlan = await ctx.task(deletionPlanTask, {
      dsarId,
      jurisdiction,
      subject: request.subject,
      retrieval: perSystem,
      withheld,
      dataMapSystems: dataMap.systems,
    });
    recordClock('dsar', 'deletion-planned', deletionPlan.planSummary);
  } else {
    compilation = await ctx.task(responseCompilationTask, {
      dsarId,
      requestType,
      jurisdiction,
      subject: request.subject,
      disclosable: exemption.disclosable,
      withheld,
      packagePath: `${artifactsRoot}/dsar-response-${dsarId}.md`,
    });
    artifacts.push(compilation.packagePath);
    recordClock('dsar', 'response-compiled', `${compilation.packagePath} (${compilation.format})`);
  }

  // -------------------------------------------------------------------------
  // P6 — policy gate: data-deletion (erasure branch only — NEVER auto-executes)
  // -------------------------------------------------------------------------
  let execution = null;
  if (isErasure) {
    ctx.log?.('info', 'P6: data-deletion policy gate');
    let deletionApproved = false;
    let planFeedback = null;
    for (let round = 0; round < 2; round++) {
      if (round > 0) {
        // Exactly one bounded re-plan round with the rejection feedback threaded in.
        deletionPlan = await ctx.task(deletionPlanTask, {
          dsarId,
          jurisdiction,
          subject: request.subject,
          retrieval: perSystem,
          withheld,
          dataMapSystems: dataMap.systems,
          feedback: planFeedback,
          revision: round,
        });
        recordClock('dsar', 'deletion-replanned', deletionPlan.planSummary);
      }
      const zone = currentZone();
      const gate = await routedBreakpoint(ctx, {
        question: `Approve IRREVERSIBLE deletion of personal data for ${dsarId} across ${deletionPlan.actions.length} systems?`,
        plan: deletionPlan,
        verificationQueries: deletionPlan.actions.map((a) => ({ systemId: a.systemId, verificationQuery: a.verificationQuery })),
        withheld,
        clock: { deadlineAt, zone },
      }, {
        breakpointId: 'data-deletion',
        expert: deadlineExpert('data-deletion', zone),
        tags: ['policy-gated', 'privacy', 'dsar', zone],
        strategy: 'single',
        // Deliberately NO autoApproveAfterN and NO presentAlwaysApprove — irreversible
        // deletion must never auto-approve; recordGate surfaces any harness override.
      });
      recordGate('data-deletion', 'P6', gate);
      if (gate.approved === true) {
        deletionApproved = true;
        break;
      }
      planFeedback = gate.response || gate.feedback || 'deletion plan rejected';
      recordClock('dsar', 'deletion-gate-rejected', String(planFeedback));
    }
    if (!deletionApproved) {
      // Fail closed: the executor is NEVER invoked on an unapproved plan — there is no
      // alternate execution path anywhere in this process.
      deletion = { plan: deletionPlan, executed: null, verified: false };
      return buildResult(false, 'data-deletion gate rejected twice — nothing deleted');
    }

    // -----------------------------------------------------------------------
    // P7 — deletion execution (post-approval ONLY)
    // -----------------------------------------------------------------------
    ctx.log?.('info', 'P7: deletion execution');
    execution = await ctx.task(deletionExecutionTask, {
      dsarId,
      plan: deletionPlan,
      reportPath: deletionReportPath,
    });
    for (const act of execution.executed) {
      recordClock('dsar', 'deletion-action', `${act.systemId}: ${act.action} -> ${act.outcome} deleted=${act.deleted}`);
    }
    artifacts.push(deletionReportPath);
    deletion = { plan: deletionPlan, executed: execution, verified: false };
  }

  // -------------------------------------------------------------------------
  // P8 — adversarial completeness-and-exemption gate (executed evidence)
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P8: adversarial completeness-and-exemption gate');
  const gateArtifact = isErasure
    ? { path: deletionReportPath, description: 'Deletion execution report' }
    : { path: compilation.packagePath, description: 'DSAR disclosure package (or denial letter)' };
  const gateResult = await adversarialGate(ctx, {
    gateId: 'dpc.dsar-completeness',
    artifact: gateArtifact,
    critics: [
      {
        name: 'coverage-critic',
        role: 'Data-map coverage auditor',
        focus: 'every system in dataMap.systems has a retrieval result with searched:true and queriesRun — EXECUTE the diff of retrieval results vs the system inventory in context; cite each covered/missed systemId',
      },
      {
        name: 'exemption-critic',
        role: 'Legal-basis auditor',
        focus: 'every withheld item cites a specific legal basis (instrument + article) that actually supports the withholding; no blanket exemptions; disclosed items contain no third-party personal data that itself needed withholding — cite each item verdict',
      },
      ...(isErasure
        ? [
            {
              name: 'deletion-verification-critic',
              role: 'Post-deletion verifier',
              focus: 'EXECUTE every verificationQuery from the approved deletion plan against its system and prove zero records return; a deletion claim without an executed post-deletion query is a FAIL — cite raw query outputs',
            },
          ]
        : []),
    ],
    ironLaw: [
      'Executed evidence only: run the actual cross-checks and queries — a read-only skim is not evidence.',
      'Cite file:line or executed-query output for every claim; passed:true with empty evidence is rejected by the combinator.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      dataMapSystems: dataMap.systems,
      retrievalResults: perSystem,
      withheldItems: withheld,
      deletionPlan,
      deletionExecution: execution,
      clockLedger,
    },
  });
  completenessGate = {
    passed: gateResult.passed,
    attempts: gateResult.attempts,
    escalated: gateResult.escalated,
    issues: gateResult.issues,
  };
  if (gateResult.escalated) {
    breakpointsHit.push('dpc.dsar-completeness.gate-escalation');
  }
  recordClock('dsar', 'completeness-gate', `passed=${gateResult.passed} attempts=${gateResult.attempts} escalated=${gateResult.escalated}`);
  if (isErasure) {
    deletion = { ...deletion, verified: execution.allDeleted === true && gateResult.passed === true };
  }

  // -------------------------------------------------------------------------
  // P9 — policy gate: dpia-signoff (conditional)
  // -------------------------------------------------------------------------
  if (dpiaRequired) {
    ctx.log?.('info', 'P9: DPIA draft + dpia-signoff policy gate');
    const dpiaDraft = await ctx.task(dpiaDraftTask, {
      dsarId,
      jurisdiction,
      dpiaContext,
      dpiaTrigger: dataMap.dpiaTrigger ?? null,
      dataMapSystems: dataMap.systems,
      dpiaPath: `${artifactsRoot}/dpia-${dsarId}.md`,
    });
    artifacts.push(dpiaDraft.dpiaPath);
    const zone = currentZone();
    const dpiaGate = await routedBreakpoint(ctx, {
      question: `Sign off the DPIA for ${dsarId}? Residual risk acceptable per author: ${dpiaDraft.residualRiskAcceptable}.`,
      dpiaPath: dpiaDraft.dpiaPath,
      risks: dpiaDraft.risks,
      clock: { deadlineAt, zone },
    }, {
      breakpointId: 'dpia-signoff',
      expert: deadlineExpert('dpia-signoff', zone),
      tags: ['policy-gated', 'privacy', 'dpia', zone],
      strategy: 'single',
      // No auto-approve — a privacy impact assessment is signed by a human, not a timer.
    });
    recordGate('dpia-signoff', 'P9', dpiaGate);
    dpia = { required: true, path: dpiaDraft.dpiaPath, signedOff: dpiaGate.approved === true };
    recordClock('dsar', 'dpia-signoff', `signedOff=${dpia.signedOff} trigger=${dpiaFromRequest ? 'request-processing' : 'dpiaContext'}`);
  }

  // -------------------------------------------------------------------------
  // P10 — policy gate: disclosure-response -> delivery (or denial)
  // -------------------------------------------------------------------------
  if (completenessGate.passed === true) {
    ctx.log?.('info', 'P10: disclosure-response policy gate + delivery');
    let responseApproved = false;
    let responseFeedback = null;
    let responsePath = isErasure ? deletionReportPath : compilation.packagePath;
    for (let round = 0; round < 2; round++) {
      if (round > 0 && !isErasure) {
        // Exactly one bounded revise-and-re-gate round with the rejection feedback.
        compilation = await ctx.task(responseCompilationTask, {
          dsarId,
          requestType,
          jurisdiction,
          subject: request.subject,
          disclosable: exemption.disclosable,
          withheld,
          packagePath: `${artifactsRoot}/dsar-response-${dsarId}.md`,
          feedback: responseFeedback,
          revision: round,
        });
        responsePath = compilation.packagePath;
        recordClock('dsar', 'response-recompiled', `${compilation.packagePath} (revision ${round})`);
      }
      const zone = currentZone();
      const gate = await routedBreakpoint(ctx, {
        question: `Approve sending the ${isErasure ? 'erasure confirmation' : requestType} response for ${dsarId} to the data subject?`,
        packagePath: responsePath,
        withheld,
        gateEvidence: gateResult.evidence,
        clock: { deadlineAt, zone },
      }, {
        breakpointId: 'disclosure-response',
        expert: deadlineExpert('disclosure-response', zone),
        tags: ['policy-gated', 'privacy', 'dsar', zone],
        strategy: 'single',
        // No auto-approve — personal data leaves only on an accountable approval.
      });
      recordGate('disclosure-response', 'P10', gate);
      if (gate.approved === true) {
        responseApproved = true;
        break;
      }
      responseFeedback = gate.response || gate.feedback || 'disclosure-response gate rejected';
      recordClock('dsar', 'disclosure-gate-rejected', String(responseFeedback));
    }
    if (responseApproved) {
      // Delivery happens ONLY here, after this gate's approval — verbatim package.
      const delivered = await ctx.task(responseDeliveryTask, {
        dsarId,
        requestType,
        subject: request.subject,
        channel: request.channel,
        packagePath: responsePath,
        zone: currentZone(),
      });
      disclosure = {
        sent: delivered.sent === true,
        deliveredAt: delivered.deliveredAt,
        messageRef: delivered.messageRef,
      };
      recordClock('dsar', 'response-delivered', `${delivered.channel} (${delivered.messageRef}) at ${delivered.deliveredAt}`);
    } else {
      // Fail closed: a rejected gate leaves the response UNSENT and recorded — nothing
      // is ever sent through an alternate path.
      disclosure = { sent: false, deliveredAt: null, messageRef: null };
      recordClock('dsar', 'response-withheld', 'disclosure-response gate not approved after revise round — response withheld, fail closed');
    }
  } else {
    // Completeness gate failed and the owner did not accept — the disclosure-response
    // gate is never raised and nothing leaves.
    disclosure = null;
    recordClock('dsar', 'response-withheld', 'completeness gate failed — disclosure-response gate never raised, nothing sent');
  }

  // -------------------------------------------------------------------------
  // P11 — deadline-audited closure + kip assert
  // -------------------------------------------------------------------------
  ctx.log?.('info', 'P11: deadline-audited closure + kip assert');
  const audit = await runClosureAudit('P11');

  if (kipEnabled) {
    // Facts are non-empty by construction on every path that reaches P11: the data map
    // has minItems 1 systems and the precedent fact always exists.
    const zoneAtClosure = currentZone();
    const facts = [];
    for (const system of dataMap.systems) {
      facts.push({
        subject: `system:${system.systemId}`,
        predicate: 'holds-data-categories',
        object: Array.isArray(system.dataCategories) ? system.dataCategories.join(', ') : String(system.dataCategories),
        props: { owner: system.owner, queryMethod: system.queryMethod },
      });
    }
    for (const discrepancy of dataMap.discrepanciesVsRecalled) {
      facts.push({
        subject: `system:${discrepancy.systemId ?? 'unknown'}`,
        predicate: 'map-discrepancy',
        object: typeof discrepancy === 'string' ? discrepancy : JSON.stringify(discrepancy),
      });
    }
    facts.push({
      subject: `dsar:${dsarId}`,
      predicate: 'outcome',
      object: disclosure && disclosure.sent === true ? 'delivered' : 'withheld',
      props: {
        requestType,
        exemptions: withheld.length,
        zoneAtClosure,
        deadlineBreached: audit.deadlineBreached === true,
      },
    });
    if (deletion && deletion.executed) {
      for (const act of deletion.executed.executed) {
        facts.push({
          subject: `dsar:${dsarId}`,
          predicate: 'deleted-from',
          object: `system:${act.systemId}`,
          props: { verified: deletion.verified === true, deleted: act.deleted === true },
        });
      }
    }
    const asserted = await kipAssert(ctx, { kipDir, kipModel, kind: 'data-privacy', facts });
    kipFactsAsserted = asserted.asserted;
    recordClock('dsar', 'kip-assert', `${kipFactsAsserted} facts`);
  }

  recordClock('dsar', 'clock-closed', `zoneAtClosure=${currentZone()} deadlineBreached=${audit.deadlineBreached}`);

  const success =
    disclosure !== null &&
    disclosure.sent === true &&
    completenessGate.passed === true &&
    !identityBypassed &&
    (isErasure ? deletion.verified === true : true) &&
    (dpiaFromRequest ? dpia !== null && dpia.signedOff === true : true);
  return buildResult(success);
}
