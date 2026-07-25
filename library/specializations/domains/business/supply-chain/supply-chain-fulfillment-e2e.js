/**
 * @process supply-chain/supply-chain-fulfillment-e2e
 * @description End-to-end supply-chain fulfillment: demand-signal intake, kip recall of
 *   supplier/logistics history, parallel supply planning (inventory position, supplier
 *   capacity, logistics options), adversarial plan-feasibility gate with executed lead-time
 *   and net-requirement recompute, policy-gated supplier POs via the composed
 *   procurement/procurement-lifecycle buy-leg, fulfillment execution tracking with a
 *   frozen-severity exception-routing map, policy-gated expedite/reroute and disruption
 *   comms with fail-closed guarded executors, delivery confirmation with deterministic
 *   OTIF metrics, and kip assert of fulfillment/exception learnings.
 * @inputs {
 *   demandSignal: object,          // required — { source, ref, sku, quantity>0, requiredByDate (ISO), destination, customerRef? }; throw if missing sku/quantity/requiredByDate
 *   suppliers: string[],           // required — non-empty candidate supplier list for the replenishment buy-leg (throw if empty)
 *   estimatedSpend: number,        // required — finite USD threaded into the composed procurement-lifecycle spend routing (throw if missing/non-finite)
 *   carriers?: string[],           // optional — eligible carrier/lane identifiers for logistics-options planning (default [])
 *   onHandInventory?: object|null, // optional — { available, inTransit, allocated } snapshot seed (default null — agent pulls live)
 *   otifPromise?: object,          // optional — { promisedDeliveryDate (ISO), orderedQuantity }; defaults derived from demandSignal
 *   planningBufferDays?: number,   // optional — planning buffer folded into compositeLeadTimeDays (default 2)
 *   maxFixAttempts?: number,       // plan-feasibility gate fixer budget (default 2)
 *   kipEnabled?: boolean,          // recall + assert supply-chain memory via kip (default true)
 *   kipDir?: string,               // kip store directory (default '.a5c/kip')
 *   kipModel?: string              // model for kip structured paths (default 'sonnet')
 * }
 * @outputs {
 *   success: boolean,
 *   demand: object,                // { sku, quantity, requiredByDate, destination, riskFlags }
 *   recall: object,                // { factCount, insights }
 *   plan: object,                  // { inventoryPosition, supplierCapacity, logisticsOptions, netRequirement, compositeLeadTimeDays, planPath, gate }
 *   procurement: object|null,      // composed procurement-lifecycle result, or null when no external replenishment needed
 *   fulfillment: object,           // { shipments, exceptions:[{ exceptionId, type, severity, expert, expedite, comms }], executionLog }
 *   approvals: object,             // { expediteReroute:[...], disruptionComms:[...] } each { approved, breakpointId, expert, response }
 *   autoApprovals: array,          // ALWAYS present (possibly empty) — every harness auto-approval of a policy gate, fail-closed
 *   otif: object,                  // process-computed { totalLines, onTimeInFullLines, otifPercent, onTimePercent, inFullPercent, breaches }
 *   kipFactsAsserted: number,
 *   artifacts: array,
 *   metadata: object               // { processId, runId, breakpointsHit, timings }
 * }
 * @graph
 *   domains: [domain:supply-chain, domain:business]
 *   specializations: [specialization:supply-chain-optimization]
 *   skillAreas: [skill-area:procurement-management, skill-area:vendor-management-ops, skill-area:logistics-transportation, skill-area:knowledge-management]
 *   workflows: [workflow:order-fulfillment, workflow:demand-planning, workflow:disruption-response]
 *   roles: [role:supply-chain-director, role:logistics-manager, role:procurement-manager, role:supply-chain-analyst]
 * @policyGatedActions supplier-commitment-approval + po-issuance-approval are realized by the
 *   COMPOSED procurement-lifecycle buy-leg (surfaced through procurement.approvals, not
 *   re-raised here — no duplication); expedite-reroute-approval (severity-routed) and
 *   disruption-comms-send (supply-chain-director) are raised natively via routedBreakpoint
 *   with breakpointId = actionId, tags ['policy-gated','supply-chain'], guarded executors
 *   requiring approved===true, never auto-approved for critical/major.
 *
 * Hard rules honored:
 *   - Style-A agent tasks only — zero kind:shell (repo override: no shell subtasks unless asked).
 *   - No fallbacks: unknown exception type throws, unknown/null routing lookup throws, missing
 *     comms body throws, gate-unapproved expedite/reroute/comms are NEVER executed.
 *   - Every evidence-carrying outputSchema declares evidence { type:array, minItems:1 }.
 *   - All numeric fulfillment math (net requirement, composite lead-time, OTIF) is computed in
 *     the ORCHESTRATOR — agents never own the arithmetic the gates/metrics rest on.
 *   - Sparse breakpoints: only the two native policy gates + the adversarialGate owner-escalation.
 *
 * @example
 * const result = await orchestrate('supply-chain/supply-chain-fulfillment-e2e', {
 *   demandSignal: {
 *     source: 'replenishment-trigger',
 *     ref: 'RPL-2026-0001',
 *     sku: 'SKU-9922',
 *     quantity: 1200,
 *     requiredByDate: '2026-09-01',
 *     destination: 'DC-East',
 *   },
 *   suppliers: ['Acme Components', 'Northwind Parts'],
 *   estimatedSpend: 84000,
 * });
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../../../common-utilities/routed-gate-combinators.js';
import { process as procurementLifecycle } from '../procurement/procurement-lifecycle.js'; // buy-leg composition BY NAME — not duplicated

// ---------------------------------------------------------------------------
// Frozen exception tables + throwing lookups.
// Direct structural reuse of incident-lifecycle SEVERITY_ROUTING + routingExpert +
// commsPolicyFor: frozen maps, no default severity, no default expert, no default policy.
// ---------------------------------------------------------------------------

export const EXCEPTION_SEVERITIES = Object.freeze(['critical', 'major', 'minor']);

/**
 * Fulfillment exception TYPE -> severity. classifyExceptionSeverity throws on an unknown
 * type (no default severity — fallbacks forbidden).
 */
export const EXCEPTION_SEVERITY = Object.freeze({
  'stockout': 'critical',
  'quality-hold': 'critical',
  'carrier-delay': 'major',
  'customs-hold': 'major',
  'supplier-delay': 'major',
  'partial-shipment': 'minor',
  'address-exception': 'minor',
});

/**
 * Classify a reported exception type into its frozen severity. THROWS on unknown type —
 * an unrecognized type is a hard routing failure, never a silently-dropped exception.
 *
 * @param {string} type - The exception type reported by the tracker
 * @returns {string} 'critical' | 'major' | 'minor'
 */
export function classifyExceptionSeverity(type) {
  if (!Object.prototype.hasOwnProperty.call(EXCEPTION_SEVERITY, type)) {
    throw new Error(
      `EXCEPTION_SEVERITY: unknown exception type '${type}'. ` +
      `Known types: ${Object.keys(EXCEPTION_SEVERITY).join(', ')} — no default severity exists (fallbacks forbidden).`
    );
  }
  return EXCEPTION_SEVERITY[type];
}

/**
 * Nested routing map: actionId -> severity -> expert. A null expert means the action is
 * NEVER raised at that severity, and looking up its expert throws.
 */
export const EXCEPTION_ROUTING = Object.freeze({
  'expedite-reroute-approval': Object.freeze({
    critical: 'supply-chain-director',
    major: 'logistics-manager',
    minor: 'logistics-manager',
  }),
  'disruption-comms-send': Object.freeze({
    critical: 'supply-chain-director',
    major: 'supply-chain-director',
    minor: null, // never raised at minor
  }),
});

/**
 * Routed expert for one policy-gated action at one severity. THROWS on an unknown action,
 * an unknown severity, or a null (never-raised) expert — there is deliberately no fallback route.
 *
 * @param {string} actionId - 'expedite-reroute-approval' | 'disruption-comms-send'
 * @param {string} severity - 'critical' | 'major' | 'minor'
 * @returns {string} The expert route for the gate
 */
export function routingExpert(actionId, severity) {
  const row = EXCEPTION_ROUTING[actionId];
  if (!row) {
    throw new Error(
      `EXCEPTION_ROUTING: unknown policy-gated action '${actionId}'. ` +
      `Known actions: ${Object.keys(EXCEPTION_ROUTING).join(', ')} — no fallback route exists.`
    );
  }
  if (!Object.prototype.hasOwnProperty.call(row, severity)) {
    throw new Error(
      `EXCEPTION_ROUTING: unknown severity '${severity}' for action '${actionId}'. ` +
      `Known severities: ${EXCEPTION_SEVERITIES.join(', ')} — no fallback route exists.`
    );
  }
  const expert = row[severity];
  if (expert === null) {
    throw new Error(
      `EXCEPTION_ROUTING: action '${actionId}' is never raised at ${severity} — ` +
      'looking up its expert is an orchestrator bug (no fallback expert exists).'
    );
  }
  return expert;
}

/**
 * Per-severity policy modes controlling whether the expedite gate uses presentAlwaysApprove
 * and whether disruption comms is raised.
 */
export const EXCEPTION_POLICY = Object.freeze({
  critical: Object.freeze({ expediteRaised: true, expeditePresentAlwaysApprove: false, commsRaised: true }),
  major: Object.freeze({ expediteRaised: true, expeditePresentAlwaysApprove: false, commsRaised: true }),
  minor: Object.freeze({ expediteRaised: true, expeditePresentAlwaysApprove: true, commsRaised: false }),
});

/**
 * Policy for one action at one severity. THROWS on unknown action or severity (mirrors
 * incident-lifecycle commsPolicyFor). Returns { raised, presentAlwaysApprove } for the action.
 *
 * @param {string} actionId - 'expedite-reroute-approval' | 'disruption-comms-send'
 * @param {string} severity - 'critical' | 'major' | 'minor'
 * @returns {{ raised: boolean, presentAlwaysApprove: boolean }}
 */
export function exceptionPolicyFor(actionId, severity) {
  const policy = EXCEPTION_POLICY[severity];
  if (!policy) {
    throw new Error(
      `EXCEPTION_POLICY: unknown severity '${severity}'. ` +
      `Known severities: ${EXCEPTION_SEVERITIES.join(', ')} — no fallback policy exists.`
    );
  }
  if (actionId === 'expedite-reroute-approval') {
    return { raised: policy.expediteRaised, presentAlwaysApprove: policy.expeditePresentAlwaysApprove };
  }
  if (actionId === 'disruption-comms-send') {
    return { raised: policy.commsRaised, presentAlwaysApprove: false };
  }
  throw new Error(`EXCEPTION_POLICY: unknown policy-gated action '${actionId}' — no fallback policy exists.`);
}

// ---------------------------------------------------------------------------
// P1 — demand-signal intake
// ---------------------------------------------------------------------------

export const demandIntakeTask = defineTask('scf.demand-intake', (args, taskCtx) => ({
  kind: 'agent',
  title: `Demand intake: ${args.demandSignal.sku}`,
  agent: {
    name: 'demand-intake-analyst',
    prompt: {
      role: 'Demand-intake analyst',
      task: 'Normalize the demand signal into an actionable fulfillment demand record.',
      context: args,
      instructions: [
        'Read demandSignal and produce { sku, quantity, requiredByDate, destination, customerRef?, riskFlags }.',
        'Flag missing/ambiguous fields (no destination, past-dated requiredByDate, quantity mismatch) as riskFlags [{ code, detail, blocking }] — never infer or invent intent.',
        'Set blocking:true on a riskFlag ONLY when the demand cannot be actioned at all (no destination, non-positive quantity, or a past-dated requiredByDate); otherwise blocking:false.',
        'Cite recalled supplier/logistics facts (context.priorKnowledge.insights) that bear on feasibility.',
      ],
      outputFormat: 'JSON with sku string, quantity number, requiredByDate string, destination string, customerRef string, riskFlags array [{ code, detail, blocking }]',
    },
    outputSchema: {
      type: 'object',
      required: ['sku', 'quantity', 'requiredByDate', 'destination', 'riskFlags'],
      properties: {
        sku: { type: 'string' },
        quantity: { type: 'number' },
        requiredByDate: { type: 'string' },
        destination: { type: 'string' },
        customerRef: { type: 'string' },
        riskFlags: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'scf', 'supply-chain', 'intake'],
}));

// ---------------------------------------------------------------------------
// P2 — parallel supply planning strands (three independent instances)
// ---------------------------------------------------------------------------

export const inventoryPositionTask = defineTask('scf.inventory-position', (args, taskCtx) => ({
  kind: 'agent',
  title: `Inventory position: ${args.demand.sku}`,
  agent: {
    name: 'inventory-position-analyst',
    prompt: {
      role: 'Inventory-position analyst',
      task: 'Determine the current inventory position for the sku across the network.',
      context: args,
      instructions: [
        'Report { available, inTransit, allocated, netAvailable, byLocation:[{ location, available }] } for context.demand.sku.',
        'If context.onHandInventory is provided treat it as a seed to reconcile against, not as authoritative — pull the live WMS/stock position.',
        'Runs in parallel with supplier-capacity and logistics-options — do NOT reference or await their outputs.',
        'Evidence entries must cite the stock/WMS query outputs behind each number — at least one entry.',
      ],
      outputFormat: 'JSON with available number, inTransit number, allocated number, netAvailable number, byLocation array, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['available', 'inTransit', 'allocated', 'netAvailable', 'evidence'],
      properties: {
        available: { type: 'number' },
        inTransit: { type: 'number' },
        allocated: { type: 'number' },
        netAvailable: { type: 'number' },
        byLocation: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'scf', 'supply-chain', 'inventory'],
}));

export const supplierCapacityTask = defineTask('scf.supplier-capacity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Supplier capacity: ${args.demand.sku}`,
  agent: {
    name: 'supplier-capacity-analyst',
    prompt: {
      role: 'Supplier-capacity analyst',
      task: 'Assess each candidate supplier capacity and quoted lead-time for the net requirement.',
      context: args,
      instructions: [
        'For every supplier in context.suppliers report { supplier, availableCapacityUnits, quotedLeadTimeDays, minOrderQty, confidence }.',
        'Honor context.priorKnowledge quoted-vs-actual lead-time history — cite the prior fact when it adjusts a quote.',
        'Never invent capacity you cannot source; unknown capacity is reported as such (confidence:"unknown"), not guessed.',
        'Runs in parallel with inventory-position and logistics-options — do NOT reference their outputs.',
        'Evidence entries must cite the capacity data/supplier comms per supplier — at least one entry.',
      ],
      outputFormat: 'JSON with suppliers array [{ supplier, availableCapacityUnits, quotedLeadTimeDays, minOrderQty, confidence }], evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['suppliers', 'evidence'],
      properties: {
        suppliers: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['supplier', 'availableCapacityUnits', 'quotedLeadTimeDays', 'minOrderQty'],
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
  labels: ['agent', 'scf', 'supply-chain', 'supplier-capacity'],
}));

export const logisticsOptionsTask = defineTask('scf.logistics-options', (args, taskCtx) => ({
  kind: 'agent',
  title: `Logistics options: ${args.demand.destination}`,
  agent: {
    name: 'logistics-options-analyst',
    prompt: {
      role: 'Logistics-options analyst',
      task: 'Enumerate feasible logistics lanes/carriers to the destination with transit and cost.',
      context: args,
      instructions: [
        'Report options [{ carrier, mode, transitDays, costUsd, cutoffTime, serviceLevel }] to context.demand.destination.',
        'Constrain to context.carriers when that list is non-empty; otherwise enumerate the feasible carriers you can source.',
        'Runs in parallel with inventory and supplier strands — do NOT reference their outputs.',
        'Evidence entries must cite the rate/transit source per option — at least one entry.',
      ],
      outputFormat: 'JSON with options array [{ carrier, mode, transitDays, costUsd, cutoffTime, serviceLevel }], evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['options', 'evidence'],
      properties: {
        options: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['carrier', 'mode', 'transitDays', 'costUsd'],
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
  labels: ['agent', 'scf', 'supply-chain', 'logistics'],
}));

// ---------------------------------------------------------------------------
// P5 — fulfillment execution tracking (reports exceptions by TYPE only)
// ---------------------------------------------------------------------------

export const fulfillmentExecutionTask = defineTask('scf.fulfillment-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Fulfillment execution: ${args.demand.sku}`,
  agent: {
    name: 'fulfillment-execution-tracker',
    prompt: {
      role: 'Fulfillment execution tracker',
      task: 'Track fulfillment execution milestones and report exceptions by TYPE only.',
      context: args,
      instructions: [
        'Track order->pick->pack->ship->in-transit milestones; report executionLog [{ milestone, timestamp, detail }] and shipments [{ shipmentId, line, carrier?, status }].',
        'Report exceptions [{ exceptionId (stable kebab-case), type, line, detail }] where type is one of the known EXCEPTION_SEVERITY keys (stockout, quality-hold, carrier-delay, customs-hold, supplier-delay, partial-shipment, address-exception).',
        'You classify TYPE from the observed event only — you do NOT assign severity or route; the orchestrator owns that via a throwing lookup.',
        'An exception whose type is not in the known set is reported with type:"unknown-<observed>" and a detail — the orchestrator surfaces it as a hard routing failure, never silently dropped.',
        'Evidence entries must cite the tracking event/carrier scan behind each exception — at least one entry.',
      ],
      outputFormat: 'JSON with executionLog array, shipments array, exceptions array [{ exceptionId, type, line, detail }], evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['executionLog', 'exceptions', 'evidence'],
      properties: {
        executionLog: { type: 'array' },
        shipments: { type: 'array' },
        exceptions: {
          type: 'array',
          items: { type: 'object', required: ['exceptionId', 'type'] },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'scf', 'supply-chain', 'execution'],
}));

// ---------------------------------------------------------------------------
// P6 — guarded executors (only ever run after their gate approved === true)
// ---------------------------------------------------------------------------

export const expediteRerouteTask = defineTask('scf.expedite-reroute', (args, taskCtx) => ({
  kind: 'agent',
  title: `Expedite/reroute: ${args.exception.exceptionId}`,
  agent: {
    name: 'expedite-reroute-executor',
    prompt: {
      role: 'Expedite/reroute executor',
      task: 'Execute EXACTLY the approved expedite or reroute action for one exception — nothing more.',
      context: args,
      instructions: [
        'This task only ever runs AFTER the expedite-reroute-approval gate approved this exception action in context (context.approved === true).',
        'Execute exactly the approved action (upgrade service level / switch lane / split shipment); do not improvise additional changes.',
        'Report { exceptionId, actionTaken, newCarrier?, newEta, costDeltaUsd, outcome }.',
        'If the action fails, stop and report honestly with outcome:"failed" — there is no alternate un-gated path.',
        'Evidence entries must be the raw execution confirmation (booking id, carrier API response) — at least one entry.',
      ],
      outputFormat: 'JSON with exceptionId string, actionTaken string, newCarrier string, newEta string, costDeltaUsd number, outcome string, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['exceptionId', 'actionTaken', 'newEta', 'outcome', 'evidence'],
      properties: {
        exceptionId: { type: 'string' },
        actionTaken: { type: 'string' },
        newCarrier: { type: 'string' },
        newEta: { type: 'string' },
        costDeltaUsd: { type: 'number' },
        outcome: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'scf', 'supply-chain', 'expedite', 'policy-guarded'],
}));

export const exceptionCommsTask = defineTask('scf.exception-comms', (args, taskCtx) => ({
  kind: 'agent',
  title: `Disruption comms: ${args.exception.exceptionId}`,
  agent: {
    name: 'disruption-comms-publisher',
    prompt: {
      role: 'Disruption-comms publisher',
      task: 'Send the gate-approved disruption/exception notification to affected suppliers/customers.',
      context: args,
      instructions: [
        'This task only ever runs AFTER the disruption-comms-send gate approved the exact message body in context (context.approvedBody) — send that body verbatim.',
        'Pick the channel from context.channels matching the audience; report the concrete messageRef (message id / delivery receipt).',
        'DRAFTS never self-send: publication happens only through the approved gate you do not control.',
        'Evidence entries must be the raw send confirmation — at least one entry.',
      ],
      outputFormat: 'JSON with sent boolean, channel string, messageRef string, body string, evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['sent', 'channel', 'messageRef', 'body', 'evidence'],
      properties: {
        sent: { type: 'boolean' },
        channel: { type: 'string' },
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
  labels: ['agent', 'scf', 'supply-chain', 'comms', 'policy-guarded'],
}));

// ---------------------------------------------------------------------------
// P7 — delivery confirmation (proof-of-delivery data only, no metric math)
// ---------------------------------------------------------------------------

export const deliveryConfirmationTask = defineTask('scf.delivery-confirmation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Delivery confirmation: ${args.demand.sku}`,
  agent: {
    name: 'delivery-confirmation-analyst',
    prompt: {
      role: 'Delivery-confirmation analyst',
      task: 'Gather proof-of-delivery per line for OTIF computation — data only, no metric math.',
      context: args,
      instructions: [
        'For every fulfillment line report { line, deliveredAt (ISO), deliveredQty, podRef, status }.',
        'Report the raw promised values you observed but do NOT compute OTIF — the orchestrator computes on-time/in-full deterministically.',
        'Missing PoD is reported as status:"unconfirmed", never fabricated as delivered.',
        'Evidence entries must cite the PoD artifact/carrier confirmation per line — at least one entry.',
      ],
      outputFormat: 'JSON with lines array [{ line, deliveredAt, deliveredQty, podRef, status }], evidence array',
    },
    outputSchema: {
      type: 'object',
      required: ['lines', 'evidence'],
      properties: {
        lines: {
          type: 'array',
          items: { type: 'object', required: ['line', 'deliveredQty', 'status'] },
        },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'scf', 'supply-chain', 'delivery'],
}));

// ---------------------------------------------------------------------------
// P3 — plan-feasibility gate: critic specs + gate-specific IRON LAW
// ---------------------------------------------------------------------------

const PLAN_GATE_ID = 'scf.plan-feasibility';

const PLAN_IRON_LAW = [
  'Evidence entries MUST be artifact-field-level (plan field + value) or an executed recomputation output — impressions about feasibility are protocol failures.',
  'The lead-time and quantity checks are EXECUTED: paste your own recomputation, not the plan-stated numbers.',
  'Default verdict is FAIL; passed:true with empty evidence is coerced to a protocol failure by the combinator.',
];

const PLAN_CRITICS = [
  {
    name: 'lead-time-feasibility-critic',
    role: 'Adversarial lead-time feasibility gatekeeper',
    focus: 'the plan can actually land by demand.requiredByDate',
    instructions: [
      'EXECUTED CHECK (required): RECOMPUTE compositeLeadTimeDays YOURSELF from the plan artifacts (selectedSupplier.quotedLeadTimeDays + selectedLane.transitDays + planningBufferDays), add it to plan.planGeneratedAt, and paste the executed date computation into evidence.',
      'A plan whose computed arrival date > demand.requiredByDate FAILS with both the computed arrival and the requiredByDate quoted.',
      'A verdict without the pasted executed recomputation is invalid.',
    ],
  },
  {
    name: 'quantity-balance-critic',
    role: 'Adversarial quantity-balance gatekeeper',
    focus: 'the planned replenishment quantity exactly covers the net requirement',
    instructions: [
      'EXECUTED CHECK (required): RECOMPUTE netRequirement = demand.quantity - inventoryPosition.available - inventoryPosition.inTransit YOURSELF from the plan artifacts and paste it into evidence.',
      'Verify the plan plannedOrderQty >= netRequirement and respects selectedSupplier.minOrderQty. A cover gap (plannedOrderQty < netRequirement) or an over-order beyond MOQ rounding FAILS with the arithmetic quoted.',
      'A verdict without the pasted recomputation is invalid.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    demandSignal,
    suppliers,
    estimatedSpend,
    carriers = [],
    onHandInventory = null,
    otifPromise,
    planningBufferDays = 2,
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs || {};

  // No fallbacks: the anchor inputs are required — a run without them is unactionable.
  if (!demandSignal || typeof demandSignal !== 'object') {
    throw new Error('supply-chain-fulfillment-e2e requires a demandSignal object — there is no default demand (fallbacks forbidden).');
  }
  if (!demandSignal.sku) {
    throw new Error('supply-chain-fulfillment-e2e requires demandSignal.sku — there is no default sku.');
  }
  if (typeof demandSignal.quantity !== 'number' || !Number.isFinite(demandSignal.quantity) || demandSignal.quantity <= 0) {
    throw new Error(`supply-chain-fulfillment-e2e requires a positive finite demandSignal.quantity (got ${JSON.stringify(demandSignal.quantity)}).`);
  }
  if (!demandSignal.requiredByDate) {
    throw new Error('supply-chain-fulfillment-e2e requires demandSignal.requiredByDate — there is no default required-by date.');
  }
  if (!Array.isArray(suppliers) || suppliers.length === 0) {
    throw new Error('supply-chain-fulfillment-e2e requires a non-empty suppliers array — there is no default supplier pool (fallbacks forbidden).');
  }
  if (typeof estimatedSpend !== 'number' || !Number.isFinite(estimatedSpend)) {
    throw new Error('supply-chain-fulfillment-e2e requires a finite numeric estimatedSpend — spend drives the composed procurement routing (fallbacks forbidden).');
  }
  if (typeof planningBufferDays !== 'number' || !Number.isFinite(planningBufferDays) || planningBufferDays < 0) {
    throw new Error(`supply-chain-fulfillment-e2e requires a non-negative finite planningBufferDays (got ${JSON.stringify(planningBufferDays)}).`);
  }

  const startTime = ctx.now();
  const nowIso = () => new Date().toISOString();
  const timings = {};
  const breakpointsHit = [];
  const artifacts = [];
  const artifactsDir = ctx.artifactsDir;

  // ALWAYS present in outputs (possibly empty): every harness-level auto-approval of a
  // policy gate is surfaced here — fail-closed posture, nothing auto-approves silently.
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

  // Mutable run state — buildResult reads these so every rejection path returns the full
  // output shape with the decision recorded (never a silent partial exit).
  let demand = null;
  let recall = null;
  let inventoryPosition = null;
  let supplierCapacity = null;
  let logisticsOptions = null;
  let selectedSupplier = null;
  let selectedLane = null;
  let netRequirement = 0;
  let plannedOrderQty = 0;
  let compositeLeadTimeDays = 0;
  let projectedArrivalIso = null;
  let planPath = null;
  let planGate = null;
  let procurement = null;
  let executionLog = [];
  let shipments = [];
  let fulfillmentExceptions = [];
  const expediteRerouteApprovals = [];
  const disruptionCommsApprovals = [];
  let otif = null;
  let otifPath = null;
  let kipFactsAsserted = 0;

  const buildResult = (success, reason) => ({
    success,
    demand,
    recall: recall ? { factCount: recall.factCount, insights: recall.insights } : null,
    plan: {
      inventoryPosition,
      supplierCapacity,
      logisticsOptions,
      selectedSupplier,
      selectedLane,
      netRequirement,
      plannedOrderQty,
      compositeLeadTimeDays,
      projectedArrivalDate: projectedArrivalIso,
      planPath,
      gate: planGate
        ? {
            passed: planGate.passed,
            attempts: planGate.attempts,
            escalated: planGate.escalated,
            issues: planGate.issues,
            evidence: planGate.evidence,
          }
        : null,
    },
    procurement,
    fulfillment: {
      shipments,
      exceptions: fulfillmentExceptions,
      executionLog,
    },
    approvals: {
      expediteReroute: expediteRerouteApprovals,
      disruptionComms: disruptionCommsApprovals,
    },
    autoApprovals,
    otif,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'supply-chain/supply-chain-fulfillment-e2e',
      runId: ctx.runId,
      breakpointsHit,
      timings: { ...timings, total: ctx.now() - startTime },
      ...(reason && { reason }),
    },
  });

  // Deterministic disruption message body — process code owns the exact text the gate
  // approves and the executor sends verbatim. Empty body is a caller bug and throws.
  const buildDisruptionMessage = (exception) => {
    const body = [
      `Supply-chain disruption notice for ${demand.sku} to ${demand.destination}.`,
      `Exception ${exception.exceptionId} (${exception.type}, severity ${exception.severity}) detected during fulfillment.`,
      exception.detail ? `Detail: ${exception.detail}.` : 'Detail: see fulfillment execution log.',
      `Required-by date on record: ${demand.requiredByDate}. We are coordinating mitigation and will follow up with a revised ETA.`,
    ].join(' ');
    if (!body || body.trim().length === 0) {
      throw new Error(`buildDisruptionMessage: produced an empty body for ${exception.exceptionId} — cannot send an empty disruption notice (fallbacks forbidden).`);
    }
    return body;
  };

  // Per-exception handler: expedite gate -> guarded executor, then (policy) comms gate ->
  // guarded executor. Runs sequentially inside its own thunk; independent exceptions fan
  // out concurrently via ctx.parallel.all. Returns its record + the gate ids it hit so the
  // orchestrator merges them deterministically after the join.
  const handleException = async (exception) => {
    const localBreakpoints = [];
    const localAutoApprovals = [];
    const record = {
      exceptionId: exception.exceptionId,
      type: exception.type,
      severity: exception.severity,
      expert: exception.expert,
      expedite: { raised: false, approved: false, executed: false },
      comms: { raised: false, approved: false, sent: false },
    };

    // --- expedite/reroute policy gate (severity-routed; minor uses presentAlwaysApprove) ---
    const expeditePolicy = exceptionPolicyFor('expedite-reroute-approval', exception.severity);
    if (expeditePolicy.raised) {
      record.expedite.raised = true;
      const expediteExpert = routingExpert('expedite-reroute-approval', exception.severity);
      const gate = await routedBreakpoint(ctx, {
        question: `Approve expedite/reroute for exception ${exception.exceptionId} (${exception.type}, ${exception.severity}) on ${demand.sku} to ${demand.destination}?`,
        title: `Approve expedite/reroute (${exception.exceptionId})`,
        context: {
          runId: ctx.runId,
          exception,
          demand: { sku: demand.sku, destination: demand.destination, requiredByDate: demand.requiredByDate },
        },
      }, {
        breakpointId: 'expedite-reroute-approval',
        expert: expediteExpert,
        tags: ['policy-gated', 'supply-chain', 'expedite'],
        strategy: 'single',
        ...(expeditePolicy.presentAlwaysApprove ? { presentAlwaysApprove: true } : {}),
      });
      localBreakpoints.push('expedite-reroute-approval');
      if (gate && (gate.autoApproved === true || (gate.metadata && gate.metadata.autoApproved === true))) {
        localAutoApprovals.push({ breakpointId: 'expedite-reroute-approval', phase: 'P6', at: nowIso() });
      }
      record.expedite.approved = gate.approved === true;
      record.expedite.response = gate.response || gate.feedback || null;

      // Fail-closed: the guarded executor runs ONLY on approved === true.
      if (gate.approved === true) {
        const execution = await ctx.task(expediteRerouteTask, {
          exception,
          approved: true,
          demand: { sku: demand.sku, destination: demand.destination, requiredByDate: demand.requiredByDate },
          logisticsOptions,
          artifactsDir,
        });
        record.expedite.executed = true;
        record.expedite.actionTaken = execution.actionTaken;
        record.expedite.newEta = execution.newEta;
        record.expedite.outcome = execution.outcome;
        record.expedite.costDeltaUsd = typeof execution.costDeltaUsd === 'number' ? execution.costDeltaUsd : null;
      }
    }

    // --- disruption-comms policy gate (raised only when EXCEPTION_POLICY.commsRaised) ---
    const commsPolicy = exceptionPolicyFor('disruption-comms-send', exception.severity);
    if (commsPolicy.raised) {
      record.comms.raised = true;
      const commsExpert = routingExpert('disruption-comms-send', exception.severity);
      const approvedBody = buildDisruptionMessage(exception); // throws if empty (no fallback)
      const gate = await routedBreakpoint(ctx, {
        question: `Approve sending the disruption notice for exception ${exception.exceptionId} (${exception.type}, ${exception.severity})? Message body is included in context and will be sent verbatim.`,
        title: `Approve disruption comms (${exception.exceptionId})`,
        context: {
          runId: ctx.runId,
          exception,
          approvedBody,
          demand: { sku: demand.sku, destination: demand.destination, customerRef: demand.customerRef ?? null },
        },
      }, {
        breakpointId: 'disruption-comms-send',
        expert: commsExpert,
        tags: ['policy-gated', 'supply-chain', 'comms'],
        strategy: 'single',
      });
      localBreakpoints.push('disruption-comms-send');
      if (gate && (gate.autoApproved === true || (gate.metadata && gate.metadata.autoApproved === true))) {
        localAutoApprovals.push({ breakpointId: 'disruption-comms-send', phase: 'P6', at: nowIso() });
      }
      record.comms.approved = gate.approved === true;
      record.comms.expert = commsExpert;
      record.comms.response = gate.response || gate.feedback || null;

      // Fail-closed: the guarded executor runs ONLY on approved === true.
      if (gate.approved === true) {
        const send = await ctx.task(exceptionCommsTask, {
          exception,
          approved: true,
          approvedBody,
          channels: carriers,
          demand: { sku: demand.sku, destination: demand.destination, customerRef: demand.customerRef ?? null },
          artifactsDir,
        });
        record.comms.sent = send.sent === true;
        record.comms.messageRef = send.messageRef || null;
        record.comms.channel = send.channel || null;
      }
    }

    return { record, localBreakpoints, localAutoApprovals };
  };

  // P0 — kip recall of supplier/logistics history. Empty store is a fresh brain, not an
  // error; the disabled shape is the documented empty-recall object.
  ctx.log?.('info', `P0: kip recall of supply-chain memory for ${demandSignal.sku}`);
  if (kipEnabled) {
    recall = await kipRecall(ctx, {
      kipDir,
      kipModel,
      kind: 'supply-chain',
      topic: `supplier lead-time actuals, lane transit reliability, and prior fulfillment exceptions for sku ${demandSignal.sku} across suppliers ${suppliers.join(', ')} to destination ${demandSignal.destination}`,
    });
  } else {
    recall = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  }
  const priorKnowledge = recall;
  timings.recall = ctx.now() - startTime;

  // P1 — demand-signal intake. No breakpoint (sparse breakpoints); ambiguity rides as
  // riskFlags. A blocking riskFlag halts the run through buildResult (recorded, not silent).
  ctx.log?.('info', 'P1: demand-signal intake');
  demand = await ctx.task(demandIntakeTask, { demandSignal, priorKnowledge, artifactsDir });
  timings.intake = ctx.now() - startTime;
  const blockingFlags = (demand.riskFlags || []).filter((flag) => flag && flag.blocking === true);
  if (blockingFlags.length > 0) {
    return buildResult(false, `demand intake surfaced ${blockingFlags.length} blocking riskFlag(s) — fulfillment cannot proceed`);
  }

  // P2 — parallel supply planning: three independent strands, none references another.
  ctx.log?.('info', 'P2: parallel supply planning (inventory, supplier capacity, logistics)');
  const [inv, cap, log] = await ctx.parallel.all([
    () => ctx.task(inventoryPositionTask, { demand, onHandInventory, priorKnowledge, artifactsDir }),
    () => ctx.task(supplierCapacityTask, { demand, suppliers, priorKnowledge, artifactsDir }),
    () => ctx.task(logisticsOptionsTask, { demand, carriers, priorKnowledge, artifactsDir }),
  ]);
  inventoryPosition = inv;
  supplierCapacity = cap;
  logisticsOptions = log;

  // ORCHESTRATOR-OWNED arithmetic — process code owns every number the gate executes against.
  const available = Number(inventoryPosition.available);
  const inTransit = Number(inventoryPosition.inTransit);
  if (!Number.isFinite(available) || !Number.isFinite(inTransit)) {
    throw new Error('supply-chain-fulfillment-e2e: inventory-position returned non-numeric available/inTransit — net requirement cannot be computed (fallbacks forbidden).');
  }
  netRequirement = Math.max(0, demand.quantity - available - inTransit);

  // Deterministic supplier selection: lowest quoted lead-time, then supplier name.
  const supplierRows = supplierCapacity.suppliers || [];
  if (supplierRows.length === 0) {
    throw new Error('supply-chain-fulfillment-e2e: supplier-capacity returned no suppliers — cannot build a feasibility plan (fallbacks forbidden).');
  }
  selectedSupplier = [...supplierRows].sort((a, b) => {
    if (a.quotedLeadTimeDays !== b.quotedLeadTimeDays) return a.quotedLeadTimeDays - b.quotedLeadTimeDays;
    return String(a.supplier).localeCompare(String(b.supplier));
  })[0];

  // Deterministic lane selection: lowest transit days, then cost, then carrier name.
  const laneRows = logisticsOptions.options || [];
  if (laneRows.length === 0) {
    throw new Error('supply-chain-fulfillment-e2e: logistics-options returned no lanes — cannot build a feasibility plan (fallbacks forbidden).');
  }
  selectedLane = [...laneRows].sort((a, b) => {
    if (a.transitDays !== b.transitDays) return a.transitDays - b.transitDays;
    if (a.costUsd !== b.costUsd) return a.costUsd - b.costUsd;
    return String(a.carrier).localeCompare(String(b.carrier));
  })[0];

  compositeLeadTimeDays =
    Number(selectedSupplier.quotedLeadTimeDays) + Number(selectedLane.transitDays) + planningBufferDays;
  if (!Number.isFinite(compositeLeadTimeDays)) {
    throw new Error('supply-chain-fulfillment-e2e: composite lead-time is non-finite — selected supplier/lane returned non-numeric days (fallbacks forbidden).');
  }
  // MOQ-respecting order quantity that covers the net requirement (MOQ as a floor).
  const minOrderQty = Number(selectedSupplier.minOrderQty);
  plannedOrderQty =
    netRequirement <= 0 ? 0 : Math.max(netRequirement, Number.isFinite(minOrderQty) ? minOrderQty : netRequirement);

  const planGeneratedMs = ctx.now();
  const planGeneratedIso = new Date(planGeneratedMs).toISOString();
  projectedArrivalIso = new Date(planGeneratedMs + compositeLeadTimeDays * 86400000).toISOString();

  // Process-authored plan artifact — the numbers the gate re-executes against.
  planPath = join(artifactsDir, 'fulfillment-plan.json');
  mkdirSync(dirname(planPath), { recursive: true });
  writeFileSync(
    planPath,
    JSON.stringify(
      {
        generatedBy: 'process-code',
        runId: ctx.runId,
        planGeneratedAt: planGeneratedIso,
        demand: {
          sku: demand.sku,
          quantity: demand.quantity,
          requiredByDate: demand.requiredByDate,
          destination: demand.destination,
        },
        inventoryPosition: {
          available,
          inTransit,
          allocated: inventoryPosition.allocated,
          netAvailable: inventoryPosition.netAvailable,
        },
        selectedSupplier,
        selectedLane,
        planningBufferDays,
        netRequirement,
        plannedOrderQty,
        compositeLeadTimeDays,
        projectedArrivalDate: projectedArrivalIso,
      },
      null,
      2
    )
  );
  artifacts.push(planPath);
  timings.planning = ctx.now() - startTime;

  // P3 — adversarial plan-feasibility gate. Two IRON-LAW critics RE-EXECUTE the lead-time
  // and net-requirement math from the plan artifacts. Escalation on fix-budget exhaustion
  // goes through the combinator's routed 'scf.plan-feasibility.gate-escalation' (expert: owner).
  ctx.log?.('info', 'P3: adversarial plan-feasibility gate');
  planGate = await adversarialGate(ctx, {
    gateId: PLAN_GATE_ID,
    artifact: {
      path: planPath,
      description: 'Process-computed fulfillment plan with netRequirement, plannedOrderQty, and compositeLeadTimeDays',
    },
    critics: PLAN_CRITICS,
    ironLaw: PLAN_IRON_LAW,
    maxFixAttempts,
    fixer: {},
    context: {
      demand: {
        sku: demand.sku,
        quantity: demand.quantity,
        requiredByDate: demand.requiredByDate,
        destination: demand.destination,
      },
      inventoryPosition: { available, inTransit },
      selectedSupplier,
      selectedLane,
      planningBufferDays,
      netRequirement,
      plannedOrderQty,
      compositeLeadTimeDays,
      planGeneratedAt: planGeneratedIso,
      projectedArrivalDate: projectedArrivalIso,
    },
  });
  if (planGate.escalated) {
    breakpointsHit.push(`${PLAN_GATE_ID}.gate-escalation`);
  }
  timings.planGate = ctx.now() - startTime;
  if (!planGate.passed) {
    return buildResult(false, 'plan-feasibility gate failed after escalation — no buy-leg entered, fulfillment halted');
  }

  // P4 — policy-gated supplier POs via the COMPOSED procurement-lifecycle buy-leg. Only when
  // netRequirement > 0: its internal vendor-commitment / spend-approval / po-issuance routed
  // gates ARE the supplier-commitment-approval + po-issuance-approval policy actions —
  // surfaced through procurement.approvals, not duplicated here.
  if (netRequirement > 0) {
    ctx.log?.('info', `P4: composed procurement buy-leg (netRequirement ${netRequirement})`);
    procurement = await procurementLifecycle(
      {
        requirementsBrief: planPath,
        category: `${demand.sku} replenishment`,
        vendors: suppliers,
        estimatedSpend,
        maxFixAttempts,
        kipEnabled,
        kipDir,
        kipModel,
      },
      ctx
    );
    if (Array.isArray(procurement.artifacts)) {
      for (const artifact of procurement.artifacts) artifacts.push(artifact);
    }
    timings.buyLeg = ctx.now() - startTime;
    if (procurement.success !== true) {
      return buildResult(false, 'composed procurement buy-leg did not complete (rejection/escalation) — fulfillment halted, procurement record retained');
    }
  } else {
    procurement = null;
    ctx.log?.('info', 'P4: netRequirement <= 0 — no external replenishment needed, buy-leg skipped');
  }

  // P5 — fulfillment execution tracking + exception routing. The tracker reports raw
  // exceptions by TYPE; the ORCHESTRATOR owns severity (classifyExceptionSeverity, throwing)
  // and the expert route (routingExpert, throwing).
  ctx.log?.('info', 'P5: fulfillment execution tracking + exception routing');
  const execution = await ctx.task(fulfillmentExecutionTask, {
    demand,
    procurement: procurement
      ? { po: procurement.po, selection: procurement.selection }
      : { po: null, selection: null },
    plan: { netRequirement, plannedOrderQty, selectedSupplier, selectedLane, projectedArrivalDate: projectedArrivalIso },
    priorKnowledge,
    artifactsDir,
  });
  executionLog = execution.executionLog || [];
  shipments = execution.shipments || [];
  // Classify + route every reported exception. Unknown type/route THROWS — never dropped.
  const routedExceptions = (execution.exceptions || []).map((raw) => {
    const severity = classifyExceptionSeverity(raw.type); // throws on unknown type
    const expert = routingExpert('expedite-reroute-approval', severity); // throws on unknown/null
    return {
      exceptionId: raw.exceptionId,
      type: raw.type,
      line: raw.line ?? null,
      detail: raw.detail ?? null,
      severity,
      expert,
    };
  });
  timings.execution = ctx.now() - startTime;

  // P6 — policy-gated expedite/reroute + disruption comms. Independent exceptions fan out
  // concurrently; each thunk runs its routed gate(s) sequentially (gate -> guarded executor).
  if (routedExceptions.length > 0) {
    ctx.log?.('info', `P6: handling ${routedExceptions.length} routed exception(s)`);
    const handled = await ctx.parallel.all(routedExceptions.map((exception) => () => handleException(exception)));
    // Merge gate ids + auto-approvals deterministically (post-join, in exception order).
    for (const outcome of handled) {
      for (const breakpointId of outcome.localBreakpoints) breakpointsHit.push(breakpointId);
      for (const auto of outcome.localAutoApprovals) autoApprovals.push(auto);
      const record = outcome.record;
      fulfillmentExceptions.push(record);
      if (record.expedite.raised) {
        expediteRerouteApprovals.push({
          exceptionId: record.exceptionId,
          approved: record.expedite.approved,
          breakpointId: 'expedite-reroute-approval',
          expert: record.expert,
          response: record.expedite.response ?? null,
        });
      }
      if (record.comms.raised) {
        disruptionCommsApprovals.push({
          exceptionId: record.exceptionId,
          approved: record.comms.approved,
          breakpointId: 'disruption-comms-send',
          expert: record.comms.expert ?? routingExpert('disruption-comms-send', record.severity),
          response: record.comms.response ?? null,
        });
      }
    }
  } else {
    ctx.log?.('info', 'P6: no exceptions reported — no policy gates raised');
  }
  timings.exceptionHandling = ctx.now() - startTime;

  // P7 — delivery confirmation + deterministic OTIF metrics. The analyst gathers PoD data;
  // the ORCHESTRATOR computes on-time / in-full / OTIF.
  ctx.log?.('info', 'P7: delivery confirmation + OTIF metrics');
  const promise = otifPromise ?? {
    promisedDeliveryDate: demand.requiredByDate,
    orderedQuantity: demand.quantity,
  };
  if (!promise.promisedDeliveryDate) {
    throw new Error('supply-chain-fulfillment-e2e: OTIF baseline has no promisedDeliveryDate — cannot compute on-time (fallbacks forbidden).');
  }
  if (typeof promise.orderedQuantity !== 'number' || !Number.isFinite(promise.orderedQuantity)) {
    throw new Error('supply-chain-fulfillment-e2e: OTIF baseline has a non-numeric orderedQuantity — cannot compute in-full (fallbacks forbidden).');
  }
  const confirmation = await ctx.task(deliveryConfirmationTask, {
    demand,
    otifPromise: promise,
    shipments,
    artifactsDir,
  });
  const lines = confirmation.lines || [];
  const promisedMs = Date.parse(promise.promisedDeliveryDate);
  if (Number.isNaN(promisedMs)) {
    throw new Error(`supply-chain-fulfillment-e2e: promisedDeliveryDate '${promise.promisedDeliveryDate}' is not a parseable ISO date (fallbacks forbidden).`);
  }
  const breaches = [];
  let onTimeInFullLines = 0;
  let onTimeLines = 0;
  let inFullLines = 0;
  for (const line of lines) {
    const deliveredMs = line.deliveredAt ? Date.parse(line.deliveredAt) : NaN;
    const confirmed = line.status === 'delivered' || line.status === 'confirmed';
    const onTime = confirmed && !Number.isNaN(deliveredMs) && deliveredMs <= promisedMs;
    const inFull = confirmed && Number(line.deliveredQty) >= promise.orderedQuantity;
    if (onTime) onTimeLines += 1;
    if (inFull) inFullLines += 1;
    if (onTime && inFull) onTimeInFullLines += 1;
    if (!onTime || !inFull) {
      const reasons = [];
      if (!confirmed) reasons.push(`status:${line.status}`);
      if (!onTime && confirmed) reasons.push('late');
      if (!inFull && confirmed) reasons.push('short');
      breaches.push({ line: line.line, reason: reasons.join('+') || 'breach' });
    }
  }
  const totalLines = lines.length;
  const pct = (n) => (totalLines === 0 ? 0 : (n / totalLines) * 100);
  otif = {
    totalLines,
    onTimeInFullLines,
    otifPercent: pct(onTimeInFullLines),
    onTimePercent: pct(onTimeLines),
    inFullPercent: pct(inFullLines),
    breaches,
  };
  otifPath = join(artifactsDir, 'otif-metrics.json');
  mkdirSync(dirname(otifPath), { recursive: true });
  writeFileSync(
    otifPath,
    JSON.stringify(
      { generatedBy: 'process-code', runId: ctx.runId, promise, lines, otif },
      null,
      2
    )
  );
  artifacts.push(otifPath);
  timings.delivery = ctx.now() - startTime;

  // P8 — kip assert of supply-chain learnings. Facts are built deterministically IN PROCESS
  // CODE from run state — agents never invent them. Guarded by the same kipEnabled flag as P0.
  const delivered = totalLines > 0 && onTimeInFullLines === totalLines;
  if (kipEnabled) {
    ctx.log?.('info', 'P8: kip assert of fulfillment/exception learnings');
    const facts = [];
    if (procurement && procurement.selection && procurement.selection.vendor) {
      facts.push({
        subject: `supplier:${procurement.selection.vendor}`,
        predicate: 'quoted-vs-actual-lead-time',
        object: `leadtime:${selectedSupplier.quotedLeadTimeDays}`,
        props: {
          quotedDays: selectedSupplier.quotedLeadTimeDays,
          actualDays: compositeLeadTimeDays,
          sku: demand.sku,
          runId: ctx.runId,
        },
      });
    }
    facts.push({
      subject: `sku:${demand.sku}`,
      predicate: 'fulfillment-outcome',
      object: `outcome:${otif.otifPercent >= 100 ? 'otif' : otif.onTimePercent < 100 ? 'late' : 'short'}`,
      props: {
        otifPercent: otif.otifPercent,
        requiredByDate: demand.requiredByDate,
        runId: ctx.runId,
      },
    });
    for (const record of fulfillmentExceptions) {
      const action = record.expedite.executed
        ? 'expedite'
        : record.comms.sent
          ? 'comms'
          : 'none';
      facts.push({
        subject: `exception:${record.type}`,
        predicate: 'resolved-by',
        object: `action:${action}`,
        props: {
          severity: record.severity,
          expert: record.expert,
          approved: record.expedite.approved || record.comms.approved,
          effective: record.expedite.executed || record.comms.sent,
          runId: ctx.runId,
        },
      });
    }
    facts.push({
      subject: `fulfillment:${demand.sku}:${ctx.runId}`,
      predicate: 'lifecycle-outcome',
      object: `outcome:${delivered ? 'delivered' : 'halted'}`,
      props: {
        netRequirement,
        exceptionsCount: fulfillmentExceptions.length,
        poIssued: !!(procurement && procurement.po),
        runId: ctx.runId,
      },
    });
    const assertion = await kipAssert(ctx, { kipDir, kipModel, kind: 'supply-chain', facts });
    kipFactsAsserted = assertion.asserted;
  }
  timings.kipAssert = ctx.now() - startTime;

  return buildResult(true);
}
