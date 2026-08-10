/**
 * @process specializations/domains/business/project-management/program-delivery-workflow
 * @description Program delivery end-to-end — business case and program charter, scope baseline
 *   and WBS, parallel core planning (schedule/CPM, budget, risk register, stakeholder map) and
 *   parallel supporting planning (resource plan, procurement plan, quality plan, dependency map)
 *   via ctx.parallel.all, deterministic integrated-baseline coverage verification, an adversarial
 *   estimate-and-risk-realism gate with EXECUTED WBS-to-schedule-to-budget traceability, sponsor
 *   baseline approval, stage-gated execution with per-stage earned-value checkpoints and a
 *   ctx.parallel.map workstream status rollup, an adversarial status-integrity (watermelon) gate
 *   that EXECUTES reported status against on-disk artifacts and evidence, a bounded
 *   change-control-board loop with per-CR-per-round-unique routed approvals, issue and dependency
 *   escalation, per-stage steering-committee phase gates, sponsor program closure, lessons-learned
 *   capture, and a benefits-realization stage whose critic EXECUTES claimed benefits against the
 *   business-case baseline with file:line citations before asserting program-delivery facts into kip.
 * @inputs {
 *   programName: string,                  // required — the program under delivery
 *   programBrief: string,                 // required — the authorized mandate / problem statement the charter and business case derive from
 *   businessCaseBaselinePath?: string,    // path to a pre-existing business case; when absent the workflow authors one and uses it as the baseline
 *   sponsor?: string,                     // named accountable sponsor (routing hint only; the expert route is still 'project-sponsor')
 *   stages: Array<{ id, name, objectives?, exitCriteria? }>,   // required, min 1 — the stage-gated execution loop iterates these IN ORDER
 *   workstreams: Array<{ id, name, owner?, scopeSummary? }>,   // required, min 1 — the units the parallel.map status rollup iterates
 *   changeRequests?: Array<{ id, title, description, type, estimatedImpact? }>, // inbound CRs the change-control board adjudicates
 *   changeThreshold?: { costPct: number, scheduleDays: number }, // REQUIRED when changeRequests is non-empty; the declared minor-change threshold — there is no default
 *   evThresholds?: { cpiFloor: number, spiFloor: number },       // default { cpiFloor: 0.9, spiFloor: 0.9 } — breaching either forces an escalation
 *   maxChangeRounds?: number,             // default 3 — bounded change-control negotiation rounds per contested CR
 *   maxFixAttempts?: number,              // default 2 — adversarial-gate fix budget
 *   maxParallel?: number,                 // default 4 — ctx.parallel concurrency
 *   kipEnabled?: boolean,                 // default true
 *   kipDir?: string,                      // default '.a5c/kip'
 *   kipModel?: string                     // default 'sonnet'
 * }
 * @outputs {
 *   success: boolean,          // true only when the baseline was approved, every stage reached a recorded gate decision, the status-integrity and benefits gates passed (or were owner-accepted), and closure was decided
 *   businessCasePath: string,
 *   charterPath: string,
 *   baseline: object,          // { scopeBaselinePath, wbsPath, schedulePath, budgetPath, riskRegisterPath, approved, approvedAt, version }
 *   stages: array,             // [{ stageId, name, evCheckpoint { pv, ev, ac, cpi, spi, eac, vac }, statusRollup, statusIntegrity { passed, escalated, discrepancies }, changeRequests, gateDecision, breakpointId }]
 *   changeControl: array,      // [{ crId, type, rounds: [{ round, breakpointId, expert, approved, response, autoApproved }], disposition, rebaselined }]
 *   benefits: array,           // [{ benefitId, claimed, baseline, measured, verdict, evidenceRef }]
 *   closure: object,           // { decision: closed|cancelled|not-reached, closureReportPath, lessonsPath }
 *   gateResults: object,       // { estimateRealism, statusIntegrity: [{ stageId, ...gate }], benefitsRealization }
 *   policyDecisions: array,    // [{ actionId, breakpointId, approved, response, autoApproved }] surfaced here AND in the closure report's Policy decisions section
 *   kipFactsAsserted: number,
 *   artifacts: array,
 *   metadata: object           // { processId, runId, breakpointsHit, timings, reason? }
 * }
 * @policyGatedActions baseline-approval (project-sponsor), scope-change-approval (change-control-board), budget-rebaseline (project-sponsor), phase-gate-go-no-go (steering-committee), project-cancellation (project-sponsor), program-closure (project-sponsor)
 * @composedProcesses project-charter-development.js, business-case-development.js,
 *   stakeholder-analysis-engagement.js, wbs-development.js, schedule-development-cpm.js,
 *   budget-development.js, resource-planning-allocation.js, risk-planning-assessment.js,
 *   risk-monitoring-response.js, change-control-management.js, earned-value-management.js,
 *   issue-management-escalation.js, program-dependency-management.js,
 *   status-reporting-communication.js, quality-assurance-implementation.js,
 *   vendor-procurement-management.js, portfolio-prioritization.js,
 *   lessons-learned-knowledge.js, benefits-realization.js
 * @graph
 *   domains: [domain:project-management]
 *   specializations: [specialization:project-management]
 *   workflows: [workflow:delivery]
 *   roles: [role:program-manager, role:project-sponsor, role:steering-committee, role:change-control-board]
 *
 * BOUNDARY
 * --------
 * This is PROGRAM / PORTFOLIO DELIVERY GOVERNANCE, not product discovery. The sibling style
 * reference (library/specializations/product-management/product-lifecycle-e2e.js) governs an idea
 * from discovery to launch: it asks "should we build this and did the hypotheses hold".
 * program-delivery-workflow governs an ALREADY-AUTHORIZED program from charter to benefits
 * realization: it asks "is the committed scope/schedule/cost baseline being delivered, is reported
 * status true, and were the promised benefits actually realized". Concretely: no user research, no
 * PRD, no rice/moscow prioritization, no launch go/no-go. Instead: scope/schedule/cost baseline
 * with variance measured against it, stage gates with steering-committee go/no-go per stage, a
 * change-control board loop, earned-value checkpoints, an adversarial status-integrity (watermelon)
 * gate, and benefits realization measured against the business-case baseline. Where the two touch
 * (a program delivering a product), this workflow consumes the product decision as an input
 * artifact; it never re-litigates it.
 *
 * REUSABLE STAGES
 * ---------------
 * Other flagships (portfolio, finance, vendor) are expected to run a change-control board loop and
 * a stage gate without copying this file. Both are exported twice: the AGENT unit as a defineTask
 * with a stable id (independently invocable via ctx.task), and an async orchestration helper that
 * wraps the task plus its routed breakpoints (a breakpoint cannot live inside a defineTask, so the
 * helper is what makes the stage genuinely reusable end to end):
 *   - changeControlStageTask (pdw.change-control-stage) + runChangeControlStage(ctx, options)
 *   - stageGateReviewTask    (pdw.stage-gate-review)    + runStageGateReview(ctx, options)
 *
 * HARD RULES
 * ----------
 * - Style-A agent tasks only: every defineTask is kind:'agent' with agent.prompt
 *   {role, task, context, instructions, outputFormat}, agent.outputSchema, io paths under
 *   tasks/<taskCtx.effectId>/, and a labels array. Zero kind:'shell' subtasks (repo override).
 * - Every task outputSchema declares evidence: { type: 'array', minItems: 1 }.
 * - NO FALLBACKS: a gate without a recorded decision FAILS the phase — if a routed breakpoint
 *   result carries neither approved===true nor approved===false, THROW. Absence is never read as
 *   approval. Every deterministic verifier throws on mismatch; there is no warn-and-continue and no
 *   best-effort mode. A change-request rejection without a directive throws. There is no default
 *   changeThreshold and no default expert.
 * - Where data genuinely does not exist (no actual-cost feed, a measurement date not yet reached),
 *   the task reports null / 'not-computable' / 'not-measurable' WITH the reason. Nothing is
 *   substituted for the missing value — that is honest reporting, not a fallback.
 * - The aggregate rollup RAG is the WORST constituent status computed in process code, never an
 *   average and never an agent summarization.
 * - Per-stage and per-CR-per-round breakpointIds are UNIQUE by construction so replay never
 *   collapses two decisions into one. Duplicate stage ids and workstream ids are rejected at input
 *   validation for exactly that reason.
 * - autoApproveAfterN appears exactly ONCE in this file — on the conditional scope-change-approval
 *   path, spread conditionally and only when the CR is provably under the declared threshold and
 *   needs no re-baseline. baseline-approval, budget-rebaseline, phase-gate-go-no-go,
 *   project-cancellation and program-closure NEVER auto-approve; do not "helpfully" add it.
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

const PROCESS_ID = 'specializations/domains/business/project-management/program-delivery-workflow';

// ---------------------------------------------------------------------------
// Deterministic helpers — pure mechanics, no model involved
// ---------------------------------------------------------------------------

/**
 * Deterministic kebab-case for artifact filenames and kip subjects.
 *
 * @param {string} value - Raw value
 * @returns {string} kebab-cased value
 */
export function kebab(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Integrated-baseline coverage verifier. Every WBS package id must be referenced
 * by at least one schedule activity AND at least one budget cost account, and
 * every referenced id must exist in the WBS. Throws on ANY mismatch — an
 * unscheduled or unfunded work package is a baseline defect, never a warning.
 *
 * @param {Array<{id: string}>} wbsPackages - WBS work packages
 * @param {Array<{activityId: string, wbsIds: string[]}>} scheduleActivities - Schedule activities
 * @param {Array<{accountId: string, wbsIds: string[]}>} budgetCostAccounts - Budget cost accounts
 * @returns {void}
 */
export function verifyBaselineCoverage(wbsPackages, scheduleActivities, budgetCostAccounts) {
  if (!Array.isArray(wbsPackages) || wbsPackages.length === 0) {
    throw new Error(`program-delivery-workflow: verifyBaselineCoverage requires a non-empty wbsPackages array (got ${JSON.stringify(wbsPackages)})`);
  }
  if (!Array.isArray(scheduleActivities) || scheduleActivities.length === 0) {
    throw new Error(`program-delivery-workflow: verifyBaselineCoverage requires a non-empty scheduleActivities array (got ${JSON.stringify(scheduleActivities)})`);
  }
  if (!Array.isArray(budgetCostAccounts) || budgetCostAccounts.length === 0) {
    throw new Error(`program-delivery-workflow: verifyBaselineCoverage requires a non-empty budgetCostAccounts array (got ${JSON.stringify(budgetCostAccounts)})`);
  }

  const wbsIds = new Set(wbsPackages.map((p) => String(p.id)));
  const scheduled = new Set();
  for (const activity of scheduleActivities) {
    for (const id of activity.wbsIds || []) scheduled.add(String(id));
  }
  const funded = new Set();
  for (const account of budgetCostAccounts) {
    for (const id of account.wbsIds || []) funded.add(String(id));
  }

  const unscheduled = [...wbsIds].filter((id) => !scheduled.has(id)).sort();
  const unfunded = [...wbsIds].filter((id) => !funded.has(id)).sort();
  const unknownInSchedule = [...scheduled].filter((id) => !wbsIds.has(id)).sort();
  const unknownInBudget = [...funded].filter((id) => !wbsIds.has(id)).sort();

  if (unscheduled.length > 0 || unfunded.length > 0 || unknownInSchedule.length > 0 || unknownInBudget.length > 0) {
    throw new Error(
      'program-delivery-workflow: integrated baseline coverage mismatch — ' +
      `WBS ids with no schedule activity: ${JSON.stringify(unscheduled)}; ` +
      `WBS ids with no cost account: ${JSON.stringify(unfunded)}; ` +
      `schedule wbsIds with no WBS package: ${JSON.stringify(unknownInSchedule)}; ` +
      `budget wbsIds with no WBS package: ${JSON.stringify(unknownInBudget)}`
    );
  }
}

/**
 * Status-rollup completeness verifier. Every input workstream id must have
 * EXACTLY one status report. Missing or duplicate ids throw — a silently-missing
 * workstream is how watermelon status hides.
 *
 * @param {Array<{id: string}>} workstreams - Program workstreams
 * @param {Array<{workstreamId: string}>} statusReports - Per-workstream status reports
 * @returns {void}
 */
export function verifyStatusCoverage(workstreams, statusReports) {
  const expected = workstreams.map((w) => String(w.id));
  const counts = new Map();
  for (const report of statusReports) {
    const id = String(report.workstreamId);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const missing = expected.filter((id) => !counts.has(id)).sort();
  const duplicated = [...counts.entries()].filter(([, n]) => n > 1).map(([id]) => id).sort();
  const unknown = [...counts.keys()].filter((id) => !expected.includes(id)).sort();
  if (missing.length > 0 || duplicated.length > 0 || unknown.length > 0) {
    throw new Error(
      'program-delivery-workflow: workstream status rollup is incomplete — ' +
      `workstream ids with no report: ${JSON.stringify(missing)}; ` +
      `workstream ids reported more than once: ${JSON.stringify(duplicated)}; ` +
      `reported ids that are not program workstreams: ${JSON.stringify(unknown)}`
    );
  }
}

/**
 * Benefits adjudication-completeness verifier. Every benefit id declared in the
 * business case must carry a verdict. Missing ids throw — an unadjudicated
 * promised benefit is a process defect, never a dropped promise.
 *
 * @param {Array<{benefitId: string}>} businessCaseBenefits - Declared benefits
 * @param {Array<{benefitId: string}>} benefitVerdicts - Adjudicated benefits
 * @returns {void}
 */
export function verifyBenefitsCoverage(businessCaseBenefits, benefitVerdicts) {
  const adjudicated = new Set(benefitVerdicts.map((v) => String(v.benefitId)));
  const missing = businessCaseBenefits
    .map((b) => String(b.benefitId))
    .filter((id) => !adjudicated.has(id))
    .sort();
  if (missing.length > 0) {
    throw new Error(
      `program-delivery-workflow: benefits realization is incomplete — no verdict for business-case benefit ids: ${JSON.stringify(missing)}`
    );
  }
}

const RAG_RANK = Object.freeze({ green: 0, amber: 1, red: 2 });

/**
 * Aggregate RAG is the WORST constituent status, computed here in process code.
 * An unknown status throws — averaging (or defaulting) is precisely how one red
 * workstream disappears into a green program.
 *
 * @param {string[]} statuses - Reported per-workstream RAG statuses
 * @returns {string} The worst status
 */
export function worstRag(statuses) {
  if (!Array.isArray(statuses) || statuses.length === 0) {
    throw new Error(`program-delivery-workflow: worstRag requires a non-empty statuses array (got ${JSON.stringify(statuses)})`);
  }
  let worst = 'green';
  for (const status of statuses) {
    const rank = RAG_RANK[status];
    if (rank === undefined) {
      throw new Error(`program-delivery-workflow: unknown ragStatus ${JSON.stringify(status)} — expected one of ${JSON.stringify(Object.keys(RAG_RANK))}`);
    }
    if (rank > RAG_RANK[worst]) worst = status;
  }
  return worst;
}

/**
 * Sum the baselined cost accounts plus the two named reserves. A non-numeric
 * amount throws rather than being coerced to zero.
 *
 * @param {Array<{accountId: string, amount: number}>} costAccounts - Cost accounts
 * @param {number} contingencyReserve - Contingency reserve line item
 * @param {number} managementReserve - Management reserve line item
 * @returns {number} Total baselined cost
 */
function totalBaselineCost(costAccounts, contingencyReserve, managementReserve) {
  let sum = 0;
  for (const account of costAccounts) {
    const amount = Number(account.amount);
    if (!Number.isFinite(amount)) {
      throw new Error(`program-delivery-workflow: cost account ${JSON.stringify(account.accountId)} has a non-numeric amount ${JSON.stringify(account.amount)}`);
    }
    sum += amount;
  }
  for (const [name, value] of [['contingencyReserve', contingencyReserve], ['managementReserve', managementReserve]]) {
    if (!Number.isFinite(Number(value))) {
      throw new Error(`program-delivery-workflow: ${name} must be numeric (got ${JSON.stringify(value)})`);
    }
    sum += Number(value);
  }
  return sum;
}

/**
 * The planned finish is the early finish of the terminal critical-path activity.
 * A critical path naming an activity that is not in the activities array throws.
 *
 * @param {Array<{activityId: string, earlyFinish: *}>} activities - Schedule activities
 * @param {string[]} criticalPath - Ordered critical-path activity ids
 * @returns {*} The terminal activity's earlyFinish
 */
function plannedFinishFromSchedule(activities, criticalPath) {
  if (!Array.isArray(criticalPath) || criticalPath.length === 0) {
    throw new Error(`program-delivery-workflow: the schedule reported no critical path (got ${JSON.stringify(criticalPath)}) — a network without a critical path cannot be baselined`);
  }
  const terminalId = String(criticalPath[criticalPath.length - 1]);
  const activity = activities.find((a) => String(a.activityId) === terminalId);
  if (!activity) {
    throw new Error(`program-delivery-workflow: critical-path terminal activity ${JSON.stringify(terminalId)} is not present in the activities array`);
  }
  return activity.earlyFinish;
}

/**
 * A gate without a recorded decision FAILS the phase. A breakpoint result that
 * carries neither approved===true nor approved===false is never read as a pass.
 *
 * @param {object} result - BreakpointResult
 * @param {string} breakpointId - The id the decision was raised under
 * @returns {boolean} The recorded decision
 */
function requireRecordedDecision(result, breakpointId) {
  if (result && result.approved === true) return true;
  if (result && result.approved === false) return false;
  throw new Error(
    `program-delivery-workflow: breakpoint ${breakpointId} returned no recorded decision (approved=${JSON.stringify(result && result.approved)}) — a gate without a decision FAILS the phase and is never read as approval`
  );
}

/**
 * A conditional-go requires that the review actually returned conditions AND
 * that the committee's response references at least one of them by text.
 *
 * @param {*} response - The committee's free-text response
 * @param {Array<{condition: string}>} conditions - Review conditions
 * @returns {boolean} Whether the response references the conditions
 */
function responseReferencesConditions(response, conditions) {
  if (typeof response !== 'string' || response.length === 0) return false;
  if (!Array.isArray(conditions) || conditions.length === 0) return false;
  return conditions.some((c) => typeof c.condition === 'string' && c.condition.length > 0 && response.includes(c.condition));
}

/**
 * Deterministic process-code-written index artifact. Byte-stable: sorted ids, no
 * timestamps beyond ctx.runId, generatedBy 'process-code'.
 *
 * @param {string} path - Absolute artifact path
 * @param {object} payload - Index payload
 * @returns {string} The path written
 */
function writeIndexArtifact(path, payload) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(payload, null, 2));
  return path;
}

// ---------------------------------------------------------------------------
// P1 — business case + program charter
// ---------------------------------------------------------------------------

export const businessCaseTask = defineTask('pdw.business-case', (args, taskCtx) => ({
  kind: 'agent',
  title: `Business case for ${args.programName}`,
  agent: {
    name: 'business-analyst',
    prompt: {
      role: 'Business analyst establishing the program benefit baseline',
      task: 'Author (or ingest) the business case that every later benefit claim is measured against',
      context: args,
      instructions: [
        'Apply the method of business-case-development.js from this specialization: problem, options considered, recommended option, cost/benefit, and the benefit baseline. For the full standalone treatment run that process — this task performs the baseline slice inline.',
        'benefits MUST be [{ benefitId, description, baselineValue, targetValue, measurementMethod, measurementDate }] — a benefit without a baselineValue and a named measurementMethod is unmeasurable and therefore a defect, not a stylistic choice. The benefits-realization phase adjudicates EXACTLY this id set.',
        'When businessCaseBaselinePath is supplied in context, READ that file and treat it as authoritative: report it as businessCasePath and extract its benefit ids rather than authoring a competing document. State in evidence which path you treated as the baseline.',
        `Write the business case markdown to exactly ${args.businessCaseTargetPath} when authoring, and return that path.`,
        'Every evidence entry cites the programBrief, the supplied baseline file, or a recalled kip fact from priorKnowledge — an uncited benefit target is a fabrication.',
      ],
      outputFormat: 'JSON with businessCasePath string, benefits array [{ benefitId, description, baselineValue, targetValue, measurementMethod, measurementDate }], fundingEnvelope object, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['businessCasePath', 'benefits', 'fundingEnvelope', 'evidence'],
      properties: {
        businessCasePath: { type: 'string' },
        benefits: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['benefitId', 'description', 'baselineValue', 'targetValue', 'measurementMethod'],
            properties: {
              benefitId: { type: 'string' },
              description: { type: 'string' },
              measurementMethod: { type: 'string' },
              measurementDate: { type: 'string' },
            },
          },
        },
        fundingEnvelope: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'framing'],
}));

export const programCharterTask = defineTask('pdw.program-charter', (args, taskCtx) => ({
  kind: 'agent',
  title: `Program charter for ${args.programName}`,
  agent: {
    name: 'program-manager',
    prompt: {
      role: 'Program manager chartering the authorized program',
      task: 'Author the program charter with scope statement, objectives, and governance model',
      context: args,
      instructions: [
        'Apply the method of project-charter-development.js from this specialization: purpose, measurable objectives, high-level scope, success criteria, governance, and named authority levels. For the full standalone treatment run that process — this task performs the charter slice inline.',
        'The charter MUST cite the business-case benefit ids in context — a charter whose objectives do not map to declared benefits is unaccountable.',
        'governance MUST name the decision rights this workflow routes: baseline approval (project-sponsor), change approval (change-control-board), stage gates (steering-committee), closure and cancellation (project-sponsor). State the escalation thresholds explicitly.',
        'scopeStatement MUST include an explicit out-of-scope list; silence about exclusions is how scope creep enters unchallenged.',
        `Write the charter markdown to exactly ${args.charterTargetPath} and return that path.`,
        'Evidence entries tie every objective to the brief or a business-case benefit id.',
      ],
      outputFormat: 'JSON with charterPath string, objectives array [{ objectiveId, statement, benefitIds, successCriterion }], scopeStatement object { inScope, outOfScope }, governance object, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['charterPath', 'objectives', 'scopeStatement', 'governance', 'evidence'],
      properties: {
        charterPath: { type: 'string' },
        objectives: { type: 'array', minItems: 1 },
        scopeStatement: { type: 'object' },
        governance: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'framing'],
}));

// ---------------------------------------------------------------------------
// P2 — scope baseline + WBS
// ---------------------------------------------------------------------------

export const scopeBaselineWbsTask = defineTask('pdw.scope-baseline-wbs', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scope baseline + WBS for ${args.programName}`,
  agent: {
    name: 'scope-manager',
    prompt: {
      role: 'Scope manager decomposing the chartered scope',
      task: 'Decompose the charter scope into a WBS and freeze the scope baseline',
      context: args,
      instructions: [
        'Apply the method of wbs-development.js from this specialization: decompose to work packages under the 100% rule, each with a deliverable and an owning workstream. For the full standalone treatment run that process — this task performs the decomposition slice inline.',
        'wbsPackages MUST be [{ id, name, deliverable, parentId, workstreamId, acceptanceCriterion }] with globally unique ids. This id set is the key EVERY later coverage check uses — the orchestrator deterministically verifies schedule and budget coverage against it and THROWS on any uncovered or unknown id.',
        'Every package workstreamId must be one of the workstream ids in context; an orphan package is a decomposition defect.',
        '100%-rule check: state in evidence how the children of each parent sum to the parent scope, and name any scope element you could NOT decompose rather than quietly omitting it.',
        `Write the scope baseline markdown to exactly ${args.scopeBaselineTargetPath} and the WBS artifact to ${args.wbsTargetPath}; return both paths.`,
      ],
      outputFormat: 'JSON with scopeBaselinePath string, wbsPath string, wbsPackages array [{ id, name, deliverable, parentId, workstreamId, acceptanceCriterion }], evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['scopeBaselinePath', 'wbsPath', 'wbsPackages', 'evidence'],
      properties: {
        scopeBaselinePath: { type: 'string' },
        wbsPath: { type: 'string' },
        wbsPackages: { type: 'array', minItems: 1 },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'scope'],
}));

// ---------------------------------------------------------------------------
// P3a — parallel core planning (schedule, budget, risk register, stakeholder map)
// ---------------------------------------------------------------------------

export const scheduleCpmTask = defineTask('pdw.schedule-cpm', (args, taskCtx) => ({
  kind: 'agent',
  title: `CPM schedule for ${args.programName}`,
  agent: {
    name: 'scheduler',
    prompt: {
      role: 'Scheduler building the critical-path schedule',
      task: 'Build the activity network and critical path over the WBS',
      context: args,
      instructions: [
        'Apply the method of schedule-development-cpm.js from this specialization: activity definition, sequencing, duration estimation, forward/backward pass, critical path and float. For the full standalone treatment run that process — this task performs the network slice inline.',
        'activities MUST be [{ activityId, name, wbsIds, durationDays, predecessors, earlyStart, earlyFinish, lateStart, lateFinish, totalFloat }]. EVERY WBS package id in context must appear in at least one activity wbsIds — the orchestrator verifies this deterministically and throws on a gap. An unscheduled work package is a baseline defect.',
        'Duration estimates MUST carry a basis: name the estimating technique and the source (analogous data from priorKnowledge, parametric rate, or three-point). An unexplained duration is not an estimate.',
        'criticalPath is the ordered activityId list with zero total float; state the schedule contingency (buffer) separately with its rationale — contingency folded invisibly into task durations is padding, and the realism critic will treat it as such.',
        `Write the schedule artifact to exactly ${args.scheduleTargetPath} and return that path.`,
      ],
      outputFormat: 'JSON with schedulePath string, activities array, criticalPath array of activityIds, scheduleContingencyDays number, contingencyBasis string, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['schedulePath', 'activities', 'criticalPath', 'scheduleContingencyDays', 'contingencyBasis', 'evidence'],
      properties: {
        schedulePath: { type: 'string' },
        activities: { type: 'array', minItems: 1 },
        criticalPath: { type: 'array', minItems: 1 },
        scheduleContingencyDays: { type: 'number' },
        contingencyBasis: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'planning'],
}));

export const budgetTask = defineTask('pdw.budget', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cost baseline for ${args.programName}`,
  agent: {
    name: 'cost-manager',
    prompt: {
      role: 'Cost manager building the time-phased cost baseline',
      task: 'Build cost accounts over the WBS and the time-phased budget',
      context: args,
      instructions: [
        'Apply the method of budget-development.js from this specialization: bottom-up cost accounts, time-phasing, contingency and management reserve. For the full standalone treatment run that process — this task performs the cost-baseline slice inline.',
        'costAccounts MUST be [{ accountId, wbsIds, amount, basis, timePhasing }]. EVERY WBS package id in context must appear in at least one account wbsIds — the orchestrator verifies this deterministically and throws on a gap. An unfunded work package is a baseline defect.',
        'contingencyReserve and managementReserve are SEPARATE named line items with an explicit basis tied to the risk register quantified exposure — reserve buried inside work-package estimates is padding, not contingency.',
        'The time-phased plannedValue curve is REQUIRED: the earned-value checkpoints read PV from it, so a budget without time phasing makes EV meaningless.',
        `Write the budget artifact to exactly ${args.budgetTargetPath} and return that path.`,
      ],
      outputFormat: 'JSON with budgetPath string, costAccounts array, plannedValueCurve array [{ period, cumulativePV }], contingencyReserve number, managementReserve number, reserveBasis string, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['budgetPath', 'costAccounts', 'plannedValueCurve', 'contingencyReserve', 'managementReserve', 'reserveBasis', 'evidence'],
      properties: {
        budgetPath: { type: 'string' },
        costAccounts: { type: 'array', minItems: 1 },
        plannedValueCurve: { type: 'array', minItems: 1 },
        contingencyReserve: { type: 'number' },
        managementReserve: { type: 'number' },
        reserveBasis: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'planning'],
}));

export const riskRegisterTask = defineTask('pdw.risk-register', (args, taskCtx) => ({
  kind: 'agent',
  title: `Risk register for ${args.programName}`,
  agent: {
    name: 'risk-manager',
    prompt: {
      role: 'Risk manager building the quantified risk register',
      task: 'Identify, assess and quantify program risks and the response plan',
      context: args,
      instructions: [
        'Apply the method of risk-planning-assessment.js from this specialization: identification, qualitative screening, quantitative exposure, and response strategy per risk. For the full standalone treatment run that process — this task performs the register slice inline.',
        'risks MUST be [{ riskId, description, category, probability, impactCost, impactDays, exposure, response, owner, trigger }] where response is one of avoid|transfer|mitigate|accept. exposure = probability * impact, computed and shown — an unquantified risk cannot justify contingency.',
        'quantifiedExposure (the summed cost and schedule exposure) is REQUIRED because the estimate-realism critic checks the budget contingency reserve and the schedule buffer AGAINST it. A register whose exposure does not reconcile with the reserves is exactly what that gate exists to catch.',
        'Every risk names an owner and a trigger condition; an ownerless risk is not managed, and the monitoring stage cannot fire on it.',
        `Write the risk register artifact to exactly ${args.riskRegisterTargetPath} and return that path.`,
      ],
      outputFormat: 'JSON with riskRegisterPath string, risks array, quantifiedExposure object { costExposure, scheduleExposureDays }, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['riskRegisterPath', 'risks', 'quantifiedExposure', 'evidence'],
      properties: {
        riskRegisterPath: { type: 'string' },
        risks: { type: 'array', minItems: 1 },
        quantifiedExposure: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'planning'],
}));

export const stakeholderMapTask = defineTask('pdw.stakeholder-map', (args, taskCtx) => ({
  kind: 'agent',
  title: `Stakeholder map for ${args.programName}`,
  agent: {
    name: 'stakeholder-manager',
    prompt: {
      role: 'Stakeholder manager mapping influence and engagement',
      task: 'Map program stakeholders and the engagement/communication plan',
      context: args,
      instructions: [
        'Apply the method of stakeholder-analysis-engagement.js from this specialization: identification, power/interest classification, current-vs-desired engagement, and the engagement plan. For the full standalone treatment run that process — this task performs the mapping slice inline.',
        'stakeholders MUST be [{ stakeholderId, name, role, power, interest, currentEngagement, desiredEngagement, escalationPath }]. The escalationPath is load-bearing: the issue-and-dependency escalation stage routes through it.',
        'The map MUST place the four governance bodies this workflow routes to — project-sponsor, change-control-board, steering-committee, and the program-manager — with their decision rights, because the routed breakpoints assume they exist.',
        'communicationPlan states cadence, audience, and channel per stakeholder group; the per-stage status rollup composes status-reporting-communication.js against this plan.',
        `Write the stakeholder map artifact to exactly ${args.stakeholderMapTargetPath} and return that path.`,
      ],
      outputFormat: 'JSON with stakeholderMapPath string, stakeholders array, communicationPlan array, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['stakeholderMapPath', 'stakeholders', 'communicationPlan', 'evidence'],
      properties: {
        stakeholderMapPath: { type: 'string' },
        stakeholders: { type: 'array', minItems: 1 },
        communicationPlan: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'planning'],
}));

// ---------------------------------------------------------------------------
// P3b — parallel supporting planning (resource, procurement, quality, dependency)
// ---------------------------------------------------------------------------

export const resourcePlanTask = defineTask('pdw.resource-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Resource plan for ${args.programName}`,
  agent: {
    name: 'resource-manager',
    prompt: {
      role: 'Resource manager allocating capacity against the schedule',
      task: 'Allocate named resources to schedule activities and surface over-allocation',
      context: args,
      instructions: [
        'Apply the method of resource-planning-allocation.js from this specialization: requirement estimation, allocation, leveling and smoothing. For the full standalone treatment run that process — this task performs the allocation slice inline.',
        'allocations MUST be [{ activityId, resourceId, role, allocationPct, period }] referencing activity ids from the schedule in context; an allocation to an unknown activity is a defect.',
        'overAllocations is REQUIRED and must honestly list every resource exceeding 100% in any period WITH the periods — a plan that shows no over-allocation because it was smoothed away silently is exactly the optimism the realism critic hunts. If leveling resolved a conflict, say which activity moved and by how many days.',
        `Write the resource plan artifact to exactly ${args.resourcePlanTargetPath} and return that path.`,
      ],
      outputFormat: 'JSON with resourcePlanPath string, allocations array, overAllocations array, levelingActions array, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['resourcePlanPath', 'allocations', 'overAllocations', 'levelingActions', 'evidence'],
      properties: {
        resourcePlanPath: { type: 'string' },
        allocations: { type: 'array' },
        overAllocations: { type: 'array' },
        levelingActions: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'planning'],
}));

export const procurementPlanTask = defineTask('pdw.procurement-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Procurement plan for ${args.programName}`,
  agent: {
    name: 'procurement-manager',
    prompt: {
      role: 'Procurement manager planning externally-sourced scope',
      task: 'Identify externally-sourced work packages and the procurement approach',
      context: args,
      instructions: [
        'Apply the method of vendor-procurement-management.js from this specialization: make-or-buy, contract type selection, vendor selection criteria, and SLA/acceptance terms. For the full standalone treatment run that process — this task performs the planning slice inline.',
        'procurements MUST be [{ procurementId, wbsIds, contractType, selectionCriteria, leadTimeDays, budgetAccountIds }] tied to WBS ids and budget cost accounts in context — an untied procurement is unfunded scope.',
        'leadTimeDays MUST be reflected as a schedule dependency: name the schedule activities that cannot start before the procurement lands. Procurement lead time omitted from the schedule is the single most common source of the optimistic baselines this workflow realism gate exists to catch.',
        'Where no external sourcing is needed, return an empty procurements array and say so in evidence — an honest empty is correct, invention is not.',
        `Write the procurement plan artifact to exactly ${args.procurementPlanTargetPath} and return that path.`,
      ],
      outputFormat: 'JSON with procurementPlanPath string, procurements array, scheduleImpacts array [{ activityId, procurementId, leadTimeDays }], evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['procurementPlanPath', 'procurements', 'scheduleImpacts', 'evidence'],
      properties: {
        procurementPlanPath: { type: 'string' },
        procurements: { type: 'array' },
        scheduleImpacts: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'planning'],
}));

export const qualityPlanTask = defineTask('pdw.quality-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `Quality plan for ${args.programName}`,
  agent: {
    name: 'quality-manager',
    prompt: {
      role: 'Quality manager defining deliverable acceptance',
      task: 'Define quality standards, assurance activities and deliverable acceptance checks',
      context: args,
      instructions: [
        'Apply the method of quality-assurance-implementation.js from this specialization: quality standards, assurance vs control activities, audit cadence, and acceptance criteria. For the full standalone treatment run that process — this task performs the planning slice inline.',
        'acceptanceChecks MUST be [{ checkId, wbsIds, standard, measurableCheck, verifier }] — a deliverable acceptance criterion without a measurable check is exactly what lets a stage be reported green with nothing verifiable behind it. The status-integrity gate EXECUTES these checks against the actual artifacts.',
        'Every WBS package with a customer-facing deliverable must have at least one acceptance check; name any package you deliberately left uncovered and why.',
        `Write the quality plan artifact to exactly ${args.qualityPlanTargetPath} and return that path.`,
      ],
      outputFormat: 'JSON with qualityPlanPath string, acceptanceChecks array, auditCadence string, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['qualityPlanPath', 'acceptanceChecks', 'auditCadence', 'evidence'],
      properties: {
        qualityPlanPath: { type: 'string' },
        acceptanceChecks: { type: 'array', minItems: 1 },
        auditCadence: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'planning'],
}));

export const dependencyMapTask = defineTask('pdw.dependency-map', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cross-workstream dependency map for ${args.programName}`,
  agent: {
    name: 'dependency-manager',
    prompt: {
      role: 'Dependency manager mapping cross-workstream commitments',
      task: 'Map inter-workstream and external dependencies with owners and need-by dates',
      context: args,
      instructions: [
        'Apply the method of program-dependency-management.js from this specialization: dependency identification, provider/consumer commitment, need-by dates, and the escalation path for a slipping dependency. For the full standalone treatment run that process — this task performs the mapping slice inline.',
        'dependencies MUST be [{ dependencyId, providerWorkstreamId, consumerWorkstreamId, description, needByDate, committedDate, status, escalationOwner }]. providerWorkstreamId and consumerWorkstreamId must be workstream ids from context (external dependencies use a providerWorkstreamId of the form external:<name>).',
        'A dependency whose committedDate is later than its needByDate is ALREADY a red dependency at plan time — report it as status at-risk with the gap in days rather than smoothing the dates to agree.',
        'criticalPathDependencies names the subset that touches the schedule critical path; the per-stage escalation stage reads this list first.',
        `Write the dependency map artifact to exactly ${args.dependencyMapTargetPath} and return that path.`,
      ],
      outputFormat: 'JSON with dependencyMapPath string, dependencies array, criticalPathDependencies array of dependencyIds, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['dependencyMapPath', 'dependencies', 'criticalPathDependencies', 'evidence'],
      properties: {
        dependencyMapPath: { type: 'string' },
        dependencies: { type: 'array' },
        criticalPathDependencies: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'planning'],
}));

// ---------------------------------------------------------------------------
// P5 — baseline revision (rejection path only)
// ---------------------------------------------------------------------------

export const baselineRevisionTask = defineTask('pdw.baseline-revision', (args, taskCtx) => ({
  kind: 'agent',
  title: `Revise baseline for ${args.programName} (sponsor feedback, round ${args.attempt})`,
  agent: {
    name: 'program-manager',
    prompt: {
      role: 'Program manager revising the baseline under sponsor feedback',
      task: 'Apply the sponsor baseline-approval feedback to the named plans',
      context: args,
      instructions: [
        'Apply ONLY the sponsor feedback in args.feedback to the specific plans it names — re-opening unrelated plans is scope drift inside a governance loop.',
        'Report revisedPlans [{ plan, path, whatChanged }] and the updated wbsPackages/activities/costAccounts arrays for the plans you touched, so the orchestrator can re-run the deterministic coverage verification and re-write the baseline index at the next version.',
        'If the feedback cannot be satisfied without breaking WBS-to-schedule-to-budget coverage, say so explicitly with the conflict — do NOT silently drop a work package to make the numbers agree.',
        'Evidence entries cite the feedback point addressed and the file:line where the change landed.',
      ],
      outputFormat: 'JSON with revisedPlans array [{ plan, path, whatChanged }], wbsPackages array, activities array, costAccounts array, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['revisedPlans', 'wbsPackages', 'activities', 'costAccounts', 'evidence'],
      properties: {
        revisedPlans: { type: 'array' },
        wbsPackages: { type: 'array', minItems: 1 },
        activities: { type: 'array', minItems: 1 },
        costAccounts: { type: 'array', minItems: 1 },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'baseline'],
}));

// ---------------------------------------------------------------------------
// P6 — stage-gated execution
// ---------------------------------------------------------------------------

export const stageExecutionTask = defineTask('pdw.stage-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute stage ${args.stage.name} of ${args.programName}`,
  agent: {
    name: 'program-manager',
    prompt: {
      role: 'Program manager executing an approved stage against the baseline',
      task: 'Execute exactly the baselined scope for this stage and report honest completion',
      context: args,
      instructions: [
        `The sponsor approved the baseline at ${args.baselineIndexPath}: execute EXACTLY the work packages this stage owns — no scope additions (those are change requests), no silent deferrals (those are variances).`,
        'Apply the method of risk-monitoring-response.js from this specialization for the stage risk posture: which registered risks triggered, which responses fired, and which new risks emerged. For the full standalone treatment run that process — this task performs the monitoring slice inline.',
        'deliverables MUST be [{ wbsId, status, percentComplete, artifactPath, acceptanceCheckIds }] where status is one of complete|in-progress|not-started|blocked — every claim of completion names the artifact that evidences it. The status-integrity gate reads exactly this array and OPENS those artifacts; a completion claim with no artifactPath will be reported as a discrepancy.',
        'raisedChangeRequests [{ id, title, description, type, estimatedImpact { costPct, scheduleDays } }] carries anything that would alter the approved baseline, with type one of scope|schedule|budget|rebaseline. Doing baseline-altering work without raising a CR is the failure mode this whole workflow governs against.',
        'raisedIssues [{ issueId, description, severity, workstreamId, blockedDependencyIds }] carries what is blocked. Report blocked work as blocked; a blocked package reported in-progress is the defect the integrity gate exists to catch.',
        `Write the stage execution record to exactly ${args.stageRecordTargetPath} and return that path.`,
      ],
      outputFormat: 'JSON with stageRecordPath string, deliverables array, raisedChangeRequests array, raisedIssues array, riskUpdates array, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['stageRecordPath', 'deliverables', 'raisedChangeRequests', 'raisedIssues', 'riskUpdates', 'evidence'],
      properties: {
        stageRecordPath: { type: 'string' },
        deliverables: { type: 'array', minItems: 1 },
        raisedChangeRequests: { type: 'array' },
        raisedIssues: { type: 'array' },
        riskUpdates: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'execution'],
}));

export const workstreamStatusTask = defineTask('pdw.workstream-status', (args, taskCtx) => ({
  kind: 'agent',
  title: `Status report: ${args.workstream.name} (stage ${args.stage.id})`,
  agent: {
    name: 'workstream-lead',
    prompt: {
      role: 'Workstream lead reporting this stage workstream status',
      task: 'Report honest workstream status against the baselined scope for this stage',
      context: args,
      instructions: [
        'Apply the method of status-reporting-communication.js from this specialization against the communication plan in context: RAG status, progress, variance narrative, and the asks. For the full standalone treatment run that process — this task performs the per-workstream slice inline.',
        `Report ONLY workstream ${args.workstream.id}. workstreamId in your output MUST equal ${args.workstream.id} — the orchestrator verifies one report per workstream id and throws on a missing or duplicated id.`,
        'ragStatus is strictly green|amber|red and MUST be justified against the baseline: green requires every owned WBS package on or ahead of its baselined finish with its acceptance checks satisfiable. A green with an unsatisfiable acceptance check or a slipped package is a watermelon, and an independent critic will open the cited artifacts to test it.',
        'supportingEvidence MUST be [{ claim, artifactPath, howToVerify }] — every status claim names a file a reviewer can open and the check they can run against it. A claim with no verifiable artifact is reported as unevidenced rather than dressed up.',
        'blockers and asks are first-class: an amber or red with no named blocker is not a status, it is a mood.',
      ],
      outputFormat: 'JSON with workstreamId string, ragStatus string (green|amber|red), progressSummary string, variances array [{ wbsId, baselineFinish, forecastFinish, varianceDays, reason }], supportingEvidence array [{ claim, artifactPath, howToVerify }] (min 1), blockers array, asks array, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['workstreamId', 'ragStatus', 'progressSummary', 'variances', 'supportingEvidence', 'blockers', 'asks', 'evidence'],
      properties: {
        workstreamId: { type: 'string' },
        ragStatus: { type: 'string', enum: ['green', 'amber', 'red'] },
        progressSummary: { type: 'string' },
        variances: { type: 'array' },
        supportingEvidence: { type: 'array', minItems: 1 },
        blockers: { type: 'array' },
        asks: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'status'],
}));

export const evCheckpointTask = defineTask('pdw.ev-checkpoint', (args, taskCtx) => ({
  kind: 'agent',
  title: `Earned-value checkpoint: stage ${args.stage.id}`,
  agent: {
    name: 'cost-manager',
    prompt: {
      role: 'Cost manager computing earned value against the approved baseline',
      task: 'Compute the stage earned-value checkpoint and forecast',
      context: args,
      instructions: [
        'Apply the method of earned-value-management.js from this specialization: PV from the baselined plannedValueCurve, EV from claimed percentComplete against baselined cost accounts, AC from actuals; then CV, SV, CPI, SPI, EAC, ETC, VAC. For the full standalone treatment run that process — this task performs the checkpoint slice inline.',
        'SHOW the arithmetic per metric: an EV number with no derivation cannot be audited, and the status-integrity critic will re-run it.',
        'EV MUST be derived from the deliverables percentComplete in context — the SAME numbers the workstream status reports claim. If the two disagree, report the disagreement in reconciliation rather than picking the flattering one; a reconciliation gap is a finding, not a rounding issue.',
        'Where actual cost data is unavailable, report AC as null with the reason and mark the derived metrics not-computable — NEVER substitute planned for actual to make a ratio appear.',
        'Compare CPI and SPI against args.evThresholds and set thresholdBreached true when either falls below its floor; the orchestrator forces an escalation on a breach.',
      ],
      outputFormat: 'JSON with pv number, ev number, ac number|null, cv number|null, sv number|null, cpi number|null, spi number|null, eac number|null, vac number|null, derivations array [{ metric, formula, inputs, result }], reconciliation array [{ source, claim, evDerived, agrees }], thresholdBreached boolean, notComputable array, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['pv', 'ev', 'derivations', 'reconciliation', 'thresholdBreached', 'evidence'],
      properties: {
        pv: { type: 'number' },
        ev: { type: 'number' },
        derivations: { type: 'array', minItems: 1 },
        reconciliation: { type: 'array' },
        thresholdBreached: { type: 'boolean' },
        notComputable: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'earned-value'],
}));

export const issueDependencyEscalationTask = defineTask('pdw.issue-dependency-escalation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Issue + dependency escalation: stage ${args.stage.id}`,
  agent: {
    name: 'program-manager',
    prompt: {
      role: 'Program manager routing issues and slipping dependencies',
      task: 'Classify open issues and slipping dependencies and route each to its escalation owner',
      context: args,
      instructions: [
        'Apply the method of issue-management-escalation.js from this specialization for the issue slice (severity classification, ownership, escalation tier and SLA) and the method of program-dependency-management.js for the dependency slice (slipping commitments and their consumers). For the full standalone treatment run those processes — this task performs the routing slice inline.',
        'escalations MUST be [{ escalationId, kind, sourceId, severity, escalationOwner, decisionRequired, byDate }] where kind is issue|dependency — every escalation names the DECISION required, not just the problem. An escalation with no decision request is a status update wearing an escalation clothes.',
        'Route through the escalationPath recorded in the stakeholder map in context; an escalation routed to nobody is unrouted.',
        'Context includes the EV checkpoint: when thresholdBreached is true you MUST produce at least one escalation naming the CPI/SPI breach and the recovery decision required. A breached threshold with no escalation is the exact failure this stage exists to prevent.',
        'recommendCancellationReview is a boolean you set true ONLY when the evidence supports it (for example VAC exceeds the management reserve, or the critical path has slipped past the program committed end date) — state the grounds. The orchestrator raises the sponsor cancellation breakpoint on true.',
        'cancellationGrounds is REQUIRED (a non-empty string) whenever recommendCancellationReview is true — the sponsor is never asked to stop a program under unstated grounds, and the orchestrator THROWS rather than substituting placeholder text. Return null only when recommendCancellationReview is false.',
      ],
      outputFormat: 'JSON with escalations array, recommendCancellationReview boolean, cancellationGrounds string|null, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['escalations', 'recommendCancellationReview', 'evidence'],
      properties: {
        escalations: { type: 'array' },
        recommendCancellationReview: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'escalation'],
}));

// ---------------------------------------------------------------------------
// EXPORTED REUSABLE STAGE 1 — change-control board loop
// (agent unit + orchestration helper; other flagships compose these by import)
// ---------------------------------------------------------------------------

export const changeControlStageTask = defineTask('pdw.change-control-stage', (args, taskCtx) => ({
  kind: 'agent',
  title: `Change request ${args.crId} analysis (round ${args.round})`,
  agent: {
    name: 'change-control-analyst',
    prompt: {
      role: 'Change-control analyst assessing a change request against the approved baseline',
      task: 'Assess the change request true impact on the approved scope, schedule and cost baseline',
      context: args,
      instructions: [
        'Apply the method of change-control-management.js from this specialization: impact analysis across scope/schedule/cost/risk/quality, disposition options, and the board recommendation. For the full standalone treatment run that process — this task performs the per-CR analysis slice inline.',
        'impact MUST be { costDelta, costPct, scheduleDays, affectedWbsIds, affectedActivityIds, riskDelta, qualityImpact } computed against the APPROVED baseline index in context — an impact assessed against the current forecast rather than the baseline hides prior overrun.',
        'underThreshold is computed by YOU against args.changeThreshold and MUST be stated with the arithmetic in thresholdArithmetic: underThreshold is true only when costPct AND scheduleDays are both strictly below their declared thresholds. This flag decides whether the routed approval is eligible for auto-approval, so an unjustified true is a governance failure — when in doubt, false.',
        'requiresRebaseline is true when the change resets the measurement baseline (a budget or schedule re-baseline). Say so plainly: re-baselining resets earned-value variance and erases the record of prior overrun, so it routes to the sponsor separately, never as an ordinary scope change.',
        'priorRounds in context holds this CR earlier rounds and the board directives. On round > 1 address ONLY the board directive from the previous round and report whatChanged; do not re-argue settled points.',
        'Set settled true with disposition withdrawn when the requester withdrew or the analysis shows the change is already inside the baseline — an honest no-op, not a fallback.',
        `Write the CR analysis artifact to exactly ${args.crAnalysisTargetPath} and return that path.`,
      ],
      outputFormat: 'JSON with crAnalysisPath string, impact object, underThreshold boolean, thresholdArithmetic string, requiresRebaseline boolean, recommendation string (approve|reject|defer), settled boolean, disposition string|null, whatChanged string|null, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['crAnalysisPath', 'impact', 'underThreshold', 'thresholdArithmetic', 'requiresRebaseline', 'recommendation', 'settled', 'evidence'],
      properties: {
        crAnalysisPath: { type: 'string' },
        impact: { type: 'object' },
        underThreshold: { type: 'boolean' },
        thresholdArithmetic: { type: 'string' },
        requiresRebaseline: { type: 'boolean' },
        recommendation: { type: 'string', enum: ['approve', 'reject', 'defer'] },
        settled: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'change-control'],
}));

/**
 * Reusable change-control board stage: a bounded negotiation loop per change
 * request with a PER-CR-PER-ROUND-UNIQUE routed approval, a separate sponsor
 * re-baseline gate when the change resets the measurement datum, and an explicit
 * exhaustion disposition. Lifted from legal/contract-lifecycle-workflow.js so a
 * contested change cannot spin indefinitely.
 *
 * The caller owns the audit trail and the threshold: recordPolicyDecision and
 * changeThreshold are REQUIRED and throw when absent. There is no default
 * threshold — a defaulted threshold would silently auto-approve changes nobody
 * sized.
 *
 * @param {object} ctx - The process context
 * @param {object} options - Stage options
 * @param {string} options.programName - Program under delivery
 * @param {string} options.stageId - Stage this loop runs inside
 * @param {Array<object>} options.changeRequests - Change requests to adjudicate
 * @param {object} options.baseline - The approved baseline (index path + version)
 * @param {{costPct: number, scheduleDays: number}} options.changeThreshold - REQUIRED declared minor-change threshold
 * @param {number} [options.maxChangeRounds=3] - Bounded negotiation rounds per CR
 * @param {object} options.priorKnowledge - Recalled kip knowledge
 * @param {string} options.artifactsDir - Artifacts directory
 * @param {Function} options.recordPolicyDecision - REQUIRED (actionId, breakpointId, result) audit recorder
 * @param {string[]} options.breakpointsHit - Mutable breakpoint id log
 * @returns {Promise<{records: Array<object>, rebaselineOccurred: boolean, newBaselineVersion: number|null}>}
 */
export async function runChangeControlStage(ctx, {
  programName,
  stageId,
  changeRequests,
  baseline,
  changeThreshold,
  maxChangeRounds = 3,
  priorKnowledge,
  artifactsDir,
  recordPolicyDecision,
  breakpointsHit,
}) {
  if (typeof recordPolicyDecision !== 'function') {
    throw new Error(`runChangeControlStage: recordPolicyDecision must be a function — the caller owns the policy audit trail (got ${typeof recordPolicyDecision})`);
  }
  if (!Array.isArray(breakpointsHit)) {
    throw new Error(`runChangeControlStage: breakpointsHit must be an array (got ${JSON.stringify(breakpointsHit)})`);
  }
  if (!Array.isArray(changeRequests)) {
    throw new Error(`runChangeControlStage: changeRequests must be an array (got ${JSON.stringify(changeRequests)})`);
  }
  if (changeRequests.length > 0 && (!changeThreshold || typeof changeThreshold.costPct !== 'number' || typeof changeThreshold.scheduleDays !== 'number')) {
    throw new Error(`runChangeControlStage: changeThreshold { costPct, scheduleDays } is required to adjudicate change requests — there is no default threshold (got ${JSON.stringify(changeThreshold)})`);
  }

  const records = [];
  let rebaselineOccurred = false;
  let newBaselineVersion = null;

  for (const cr of changeRequests) {
    const crId = String(cr.id);
    const rounds = [];
    const priorRounds = [];
    let disposition = null;
    let rebaselined = false;
    let lastAnalysis = null;

    for (let round = 1; round <= maxChangeRounds; round++) {
      const crAnalysisTargetPath = join(artifactsDir, 'change-control', `${kebab(crId)}-round-${round}.md`);
      const analysis = await ctx.task(changeControlStageTask, {
        programName,
        stageId,
        crId,
        round,
        changeRequest: cr,
        priorRounds,
        baseline,
        changeThreshold,
        priorKnowledge,
        artifactsDir,
        crAnalysisTargetPath,
      });
      lastAnalysis = analysis;

      // An honest no-op: the requester withdrew, or the change is already inside
      // the approved baseline. Settled without a board decision, never a silent
      // fall-through.
      if (analysis.settled === true && analysis.disposition === 'withdrawn') {
        disposition = 'withdrawn';
        break;
      }

      const breakpointId = `program-delivery.scope-change-approval.cr-${crId}.round-${round}`;
      // The ONLY autoApproveAfterN in this file. Eligibility is computed in
      // process code from the analysis: strictly under the declared threshold on
      // BOTH dimensions and needing no re-baseline. Otherwise the option is
      // omitted entirely — never set to a large number, never set to 0.
      const autoApproveEligible = analysis.underThreshold === true && analysis.requiresRebaseline === false;
      const approval = await routedBreakpoint(ctx, {
        question: `Change request ${crId} (${cr.title}) on ${programName}: approve? Impact is ${analysis.impact.costPct}% of baselined cost and ${analysis.impact.scheduleDays} schedule days against a declared minor-change threshold of ${changeThreshold.costPct}% / ${changeThreshold.scheduleDays} days. Threshold arithmetic: ${analysis.thresholdArithmetic}. Rejecting REQUIRES a directive for the next round.`,
        context: {
          runId: ctx.runId,
          crId,
          round,
          priorRounds,
          files: [{ path: analysis.crAnalysisPath, label: `Change request ${crId} impact analysis (round ${round})` }],
          impact: analysis.impact,
          underThreshold: analysis.underThreshold,
          requiresRebaseline: analysis.requiresRebaseline,
          recommendation: analysis.recommendation,
        },
      }, {
        breakpointId,
        expert: 'change-control-board',
        tags: ['policy-gated', 'project-management', 'change-control'],
        strategy: 'single',
        ...(autoApproveEligible && { autoApproveAfterN: 1 }),
      });
      breakpointsHit.push(breakpointId);
      recordPolicyDecision('program-delivery.scope-change-approval', breakpointId, approval);
      const approved = requireRecordedDecision(approval, breakpointId);
      rounds.push({
        round,
        breakpointId,
        expert: 'change-control-board',
        approved,
        response: approval.response || approval.feedback || null,
        autoApproved: approval.autoApproved === true,
      });

      if (approved) {
        disposition = 'approved';
        // Re-baselining resets earned-value variance and erases the record of
        // prior overrun, so it is raised SEPARATELY from and IN ADDITION TO the
        // board decision — never folded into it, and never auto-approved.
        if (analysis.requiresRebaseline === true) {
          const rebaselineBreakpointId = `program-delivery.budget-rebaseline.cr-${crId}`;
          const rebaselineApproval = await routedBreakpoint(ctx, {
            question: `Change request ${crId} re-baselines the budget/schedule for ${programName}. Approving RESETS earned-value variance and erases the record of prior overrun. Current CPI ${baseline.currentEv.cpi}, SPI ${baseline.currentEv.spi}, VAC ${baseline.currentEv.vac}. Approve the re-baseline?`,
            context: {
              runId: ctx.runId,
              crId,
              currentEv: baseline.currentEv,
              priorOverrun: baseline.priorOverrun,
              newBaselineProposal: analysis.impact,
              files: [{ path: analysis.crAnalysisPath, label: `Change request ${crId} impact analysis` }],
            },
          }, {
            breakpointId: rebaselineBreakpointId,
            expert: 'project-sponsor',
            tags: ['policy-gated', 'project-management', 'rebaseline'],
            strategy: 'single',
          });
          breakpointsHit.push(rebaselineBreakpointId);
          recordPolicyDecision('program-delivery.budget-rebaseline', rebaselineBreakpointId, rebaselineApproval);
          const rebaselineApproved = requireRecordedDecision(rebaselineApproval, rebaselineBreakpointId);
          rounds.push({
            round,
            breakpointId: rebaselineBreakpointId,
            expert: 'project-sponsor',
            approved: rebaselineApproved,
            response: rebaselineApproval.response || rebaselineApproval.feedback || null,
            autoApproved: rebaselineApproval.autoApproved === true,
          });
          // Guarded executor: the baseline index is re-written at the next
          // version ONLY on an approved re-baseline. On rejection the CR is
          // recorded approved-but-not-rebaselined and the ORIGINAL baseline
          // remains the measurement datum.
          if (rebaselineApproved) {
            rebaselined = true;
            rebaselineOccurred = true;
            newBaselineVersion = (newBaselineVersion ?? baseline.version) + 1;
          }
        }
        break;
      }

      // Rejection: the board MUST supply a directive — an undirected rejection
      // leaves the next round nothing to apply (the contract-lifecycle precedent).
      const directive = approval.response || approval.feedback;
      if (!directive) {
        throw new Error(`${breakpointId} rejected without a directive — the next change-control round has nothing to re-scope against (fallbacks forbidden).`);
      }
      priorRounds.push({ round, breakpointId, directive, recommendation: analysis.recommendation, impact: analysis.impact });
    }

    // Loop exhaustion without settlement raises a distinct exhaustion decision —
    // never silently proceed with a contested CR.
    if (disposition === null) {
      const exhaustedBreakpointId = `program-delivery.scope-change-approval.cr-${crId}.exhausted`;
      const exhaustion = await routedBreakpoint(ctx, {
        question: `Change request ${crId} on ${programName} was not settled after ${maxChangeRounds} board rounds. Record an explicit disposition: approve to accept the last analysed scope, reject to close it as rejected.`,
        context: {
          runId: ctx.runId,
          crId,
          rounds,
          lastRecommendation: lastAnalysis ? lastAnalysis.recommendation : null,
          files: lastAnalysis ? [{ path: lastAnalysis.crAnalysisPath, label: `Change request ${crId} final analysis` }] : [],
        },
      }, {
        breakpointId: exhaustedBreakpointId,
        expert: 'change-control-board',
        tags: ['policy-gated', 'project-management', 'change-control'],
        strategy: 'single',
      });
      breakpointsHit.push(exhaustedBreakpointId);
      recordPolicyDecision('program-delivery.scope-change-approval', exhaustedBreakpointId, exhaustion);
      const exhaustionApproved = requireRecordedDecision(exhaustion, exhaustedBreakpointId);
      rounds.push({
        round: maxChangeRounds + 1,
        breakpointId: exhaustedBreakpointId,
        expert: 'change-control-board',
        approved: exhaustionApproved,
        response: exhaustion.response || exhaustion.feedback || null,
        autoApproved: exhaustion.autoApproved === true,
      });
      disposition = exhaustionApproved ? 'approved' : 'exhausted';
    }

    records.push({ crId, type: cr.type, rounds, disposition, rebaselined });
  }

  return { records, rebaselineOccurred, newBaselineVersion };
}

// ---------------------------------------------------------------------------
// EXPORTED REUSABLE STAGE 2 — stage-gate review + steering-committee decision
// ---------------------------------------------------------------------------

export const stageGateReviewTask = defineTask('pdw.stage-gate-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Stage gate review: ${args.stage.name}`,
  agent: {
    name: 'gate-reviewer',
    prompt: {
      role: 'Independent gate reviewer assessing stage exit criteria',
      task: 'Assess this stage exit criteria against delivered evidence and recommend a gate decision',
      context: args,
      instructions: [
        'Evaluate EVERY exit criterion in args.stage.exitCriteria (and, when that list is empty, the acceptance checks from the quality plan covering this stage WBS packages) and return exitCriteriaVerdicts [{ criterion, verdict, evidenceRef }] with verdict one of met|not-met|partially-met. An unevaluated criterion is a gate failure, not an omission.',
        'You are INDEPENDENT of the stage executor and of the workstream leads whose reports you read: do not accept a status claim because it was asserted. Open the cited artifacts.',
        'Your inputs include the status-integrity gate verdict for this stage. Any discrepancy it found MUST be reflected in your recommendation — recommending go over an unresolved integrity discrepancy is itself a finding.',
        'recommendation is strictly go|no-go|conditional-go|cancel. conditional-go REQUIRES a non-empty conditions array with an owner and a by-date per condition; a conditional-go with no conditions is a go pretending to be cautious.',
        'cancel is recommended only on named grounds (VAC beyond the management reserve, a benefit case invalidated, a critical dependency permanently unavailable) — state them in cancellationGrounds, which is REQUIRED (a non-empty string) whenever recommendation is cancel. The orchestrator THROWS rather than substituting placeholder text into the sponsor decision.',
        `You RECOMMEND; the steering committee DECIDES at the routed breakpoint. Write the gate review artifact to exactly ${args.gateReviewTargetPath} and return that path.`,
      ],
      outputFormat: 'JSON with reviewPath string, exitCriteriaVerdicts array [{ criterion, verdict, evidenceRef }] (min 1), recommendation string (go|no-go|conditional-go|cancel), conditions array [{ condition, owner, byDate }], cancellationGrounds string|null, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['reviewPath', 'exitCriteriaVerdicts', 'recommendation', 'conditions', 'evidence'],
      properties: {
        reviewPath: { type: 'string' },
        exitCriteriaVerdicts: { type: 'array', minItems: 1 },
        recommendation: { type: 'string', enum: ['go', 'no-go', 'conditional-go', 'cancel'] },
        conditions: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'stage-gate'],
}));

/**
 * Reusable stage-gate review: an independent reviewer produces the exit-criteria
 * verdicts and a recommendation, and the ROUTED BREAKPOINT decides. The
 * breakpointId is per-stage unique so replay never collapses two stage gates.
 *
 * A gate without a recorded decision FAILS the phase: if the breakpoint result
 * carries neither approved===true nor approved===false, this throws. An absent
 * decision is never read as a pass.
 *
 * @param {object} ctx - The process context
 * @param {object} options - Review options
 * @param {string} options.programName - Program under delivery
 * @param {{id: string, name: string, exitCriteria?: string[]}} options.stage - The stage being gated
 * @param {object} options.evCheckpoint - The stage earned-value checkpoint
 * @param {object} options.statusRollup - The stage workstream status rollup
 * @param {object} options.statusIntegrity - The status-integrity gate verdict for this stage
 * @param {Array<object>} options.changeRecords - Change-control records from this stage
 * @param {Array<object>} options.exitCriteria - Exit criteria (quality-plan acceptance checks when the stage declares none)
 * @param {object} options.baseline - The approved baseline
 * @param {string} options.artifactsDir - Artifacts directory
 * @param {Function} options.recordPolicyDecision - REQUIRED (actionId, breakpointId, result) audit recorder
 * @param {string[]} options.breakpointsHit - Mutable breakpoint id log
 * @returns {Promise<{decision: string, breakpointId: string, reviewPath: string, exitCriteriaVerdicts: Array<object>, conditions: Array<object>, cancellationRecommended: boolean, response: *}>}
 */
export async function runStageGateReview(ctx, {
  programName,
  stage,
  evCheckpoint,
  statusRollup,
  statusIntegrity,
  changeRecords,
  exitCriteria,
  baseline,
  artifactsDir,
  recordPolicyDecision,
  breakpointsHit,
}) {
  if (typeof recordPolicyDecision !== 'function') {
    throw new Error(`runStageGateReview: recordPolicyDecision must be a function — the caller owns the policy audit trail (got ${typeof recordPolicyDecision})`);
  }
  if (!Array.isArray(breakpointsHit)) {
    throw new Error(`runStageGateReview: breakpointsHit must be an array (got ${JSON.stringify(breakpointsHit)})`);
  }
  if (!stage || !stage.id) {
    throw new Error(`runStageGateReview: stage with an id is required (got ${JSON.stringify(stage)})`);
  }

  const gateReviewTargetPath = join(artifactsDir, 'stages', kebab(stage.id), 'gate-review.md');
  const review = await ctx.task(stageGateReviewTask, {
    programName,
    stage,
    exitCriteria,
    evCheckpoint,
    statusRollup,
    statusIntegrity,
    changeRecords,
    baseline,
    artifactsDir,
    gateReviewTargetPath,
  });

  const breakpointId = `program-delivery.phase-gate-go-no-go.stage-${stage.id}`;
  const decisionResult = await routedBreakpoint(ctx, {
    question: `Stage gate for ${stage.name} of ${programName}: authorize passage into the next stage and its committed spend? The independent review recommends ${review.recommendation}. Rollup RAG is ${statusRollup.rollupRag}; status-integrity gate passed=${statusIntegrity.passed} with ${statusIntegrity.discrepancies.length} unresolved discrepancy(ies).`,
    context: {
      runId: ctx.runId,
      stageId: stage.id,
      files: [
        { path: review.reviewPath, label: `Stage ${stage.id} gate review` },
        { path: statusRollup.stageRecordPath, label: `Stage ${stage.id} execution record` },
      ],
      exitCriteriaVerdicts: review.exitCriteriaVerdicts,
      evCheckpoint: { cpi: evCheckpoint.cpi, spi: evCheckpoint.spi, vac: evCheckpoint.vac },
      rollupRag: statusRollup.rollupRag,
      statusIntegrity: { passed: statusIntegrity.passed, discrepancies: statusIntegrity.discrepancies },
      changeRecords,
      recommendation: review.recommendation,
      conditions: review.conditions,
    },
  }, {
    breakpointId,
    expert: 'steering-committee',
    tags: ['policy-gated', 'project-management', 'stage-gate'],
    strategy: 'single',
  });
  breakpointsHit.push(breakpointId);
  recordPolicyDecision('program-delivery.phase-gate-go-no-go', breakpointId, decisionResult);

  // A gate without a recorded decision FAILS the phase — absence is never a pass.
  const approved = requireRecordedDecision(decisionResult, breakpointId);
  const response = decisionResult.response || decisionResult.feedback || null;
  let decision;
  if (approved) {
    decision = responseReferencesConditions(response, review.conditions) ? 'conditional-go' : 'go';
  } else {
    decision = 'no-go';
  }

  return {
    decision,
    breakpointId,
    reviewPath: review.reviewPath,
    exitCriteriaVerdicts: review.exitCriteriaVerdicts,
    conditions: review.conditions,
    cancellationRecommended: review.recommendation === 'cancel',
    cancellationGrounds: review.cancellationGrounds ?? null,
    response,
  };
}

// ---------------------------------------------------------------------------
// P8 — benefits realization + portfolio feedback
// ---------------------------------------------------------------------------

export const benefitsRealizationTask = defineTask('pdw.benefits-realization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Benefits realization for ${args.programName}`,
  agent: {
    name: 'benefits-analyst',
    prompt: {
      role: 'Benefits analyst measuring realized benefits against the business case',
      task: 'Measure every business-case benefit against its baseline and target',
      context: args,
      instructions: [
        'Apply the method of benefits-realization.js from this specialization: measure each benefit with its declared measurementMethod, compare to baselineValue and targetValue, and classify realization. For the full standalone treatment run that process — this task performs the measurement slice inline.',
        'Adjudicate EVERY benefitId from the business case in context: benefitVerdicts [{ benefitId, claimed, baseline, measured, verdict, evidenceRef }] — the orchestrator verifies completeness against the business-case benefit id set and THROWS on any missing id.',
        'verdict is strictly realized|partially-realized|not-realized|not-measurable. not-measurable is a legitimate honest outcome when the measurement date has not arrived or the measurement method data source does not exist — NEVER force a realized the data does not support, and never restate the target as the measurement.',
        'measured MUST come from a named source you actually read; evidenceRef cites it as file:line or a named system/query. A benefit realized on the strength of the closure narrative alone is exactly what the benefits critic re-executes and fails.',
        'Where a benefit was re-baselined mid-program, report BOTH the original business-case target and the re-baselined one, and measure against the ORIGINAL — measuring against a lowered target is how a missed benefit is made to look met.',
        `Write the benefits realization report to exactly ${args.benefitsReportTargetPath} and return that path.`,
      ],
      outputFormat: 'JSON with benefitsReportPath string, benefitVerdicts array [{ benefitId, claimed, baseline, measured, verdict, evidenceRef }] (min 1), evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['benefitsReportPath', 'benefitVerdicts', 'evidence'],
      properties: {
        benefitsReportPath: { type: 'string' },
        benefitVerdicts: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['benefitId', 'measured', 'verdict', 'evidenceRef'],
            properties: {
              benefitId: { type: 'string' },
              verdict: { type: 'string', enum: ['realized', 'partially-realized', 'not-realized', 'not-measurable'] },
              evidenceRef: { type: 'string' },
            },
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
  labels: ['agent', 'pdw', 'project-management', 'benefits'],
}));

export const portfolioFeedbackTask = defineTask('pdw.portfolio-feedback', (args, taskCtx) => ({
  kind: 'agent',
  title: `Portfolio feedback from ${args.programName}`,
  agent: {
    name: 'portfolio-manager',
    prompt: {
      role: 'Portfolio manager folding program outcomes back into portfolio ranking',
      task: 'State what the measured outcomes mean for the portfolio ranking of successor work',
      context: args,
      instructions: [
        'Apply the method of portfolio-prioritization.js from this specialization: scoring criteria, ranking, and capacity implications. For the full standalone treatment run that process — this task performs the feedback slice inline.',
        'portfolioImplications MUST be [{ implication, affectedInitiative, basis }] where basis cites a measured benefit verdict, an EV variance, or a change-control disposition from this run — an implication with no run data behind it is opinion.',
        'estimateAccuracy is REQUIRED: state the realized cost and schedule against the approved baseline as ratios, so future programs in this portfolio can calibrate their estimates. This is asserted into kip and recalled by the next program planning phase.',
        'Where the program was cancelled or benefits were not measurable, say what the portfolio should conclude from THAT — a cancelled program is a portfolio signal, not a blank.',
      ],
      outputFormat: 'JSON with portfolioImplications array (min 1), estimateAccuracy object { costRatio, scheduleRatio, basis }, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['portfolioImplications', 'estimateAccuracy', 'evidence'],
      properties: {
        portfolioImplications: { type: 'array', minItems: 1 },
        estimateAccuracy: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'portfolio'],
}));

// ---------------------------------------------------------------------------
// P7 — lessons learned + closure report
// ---------------------------------------------------------------------------

export const lessonsLearnedTask = defineTask('pdw.lessons-learned', (args, taskCtx) => ({
  kind: 'agent',
  title: `Lessons learned for ${args.programName} (run ${args.runId})`,
  agent: {
    name: 'program-ops',
    prompt: {
      role: 'Program ops capturing durable lessons',
      task: 'Capture the durable lessons from this program run data',
      context: args,
      instructions: [
        'Apply the method of lessons-learned-knowledge.js from this specialization: capture, categorize, and make each lesson actionable for a named future audience. For the full standalone treatment run that process — this task performs the capture slice inline.',
        'lessons MUST be [{ lessonId, category, lesson, runEvidence, recommendation }] where runEvidence cites specific run data: a gate finding, a status-integrity discrepancy, an EV variance, a change-control disposition, or a benefit verdict. A lesson with no run evidence is a platitude.',
        'The status-integrity discrepancies in context are the highest-value input: a program that reported green while artifacts said otherwise has a reporting-culture lesson, and it must be written plainly rather than diplomatically.',
        `Write the lessons artifact to exactly ${args.lessonsTargetPath} and return that path.`,
      ],
      outputFormat: 'JSON with lessonsPath string, lessons array (min 1), evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['lessonsPath', 'lessons', 'evidence'],
      properties: {
        lessonsPath: { type: 'string' },
        lessons: { type: 'array', minItems: 1 },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'lessons'],
}));

export const closureReportTask = defineTask('pdw.closure-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Program closure report for ${args.programName} (run ${args.runId})`,
  agent: {
    name: 'program-ops',
    prompt: {
      role: 'Program ops writing the program closure report',
      task: 'Write the program closure report the sponsor closes against',
      context: args,
      instructions: [
        `Write the closure report to exactly ${args.closureReportTargetPath} and return that path as closureReportPath.`,
        'Sections, in this order: Program summary; Baseline and final variance (with the EV history); Stage gate decisions (every stage, its decision, its breakpointId); Change control register (every CR, rounds, disposition, and whether it re-baselined); Status-integrity findings (every stage gate verdict and discrepancies); Policy decisions; Benefits realization; Lessons; Portfolio implications.',
        'The Policy decisions section is MANDATORY and must list EVERY entry from policyDecisions in context with its provenance: actionId, breakpointId, approved, response, and whether it was autoApproved by the harness (non-interactive run) versus decided by a human.',
        'A cancelled or partially-delivered program is reported as such in the summary first paragraph — a closure report that opens with what went well and buries the cancellation is the reporting failure this workflow integrity gate spent the whole run fighting.',
        'Every stage gate decision line names its breakpointId so the decision is auditable back to the journal.',
        'Evidence entries cite the run data behind each section.',
      ],
      outputFormat: 'JSON with closureReportPath string, summary string, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['closureReportPath', 'summary', 'evidence'],
      properties: {
        closureReportPath: { type: 'string' },
        summary: { type: 'string' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pdw', 'project-management', 'closure'],
}));

// ---------------------------------------------------------------------------
// Adversarial gate IRON LAWs — reproduced verbatim from the approved design
// ---------------------------------------------------------------------------

const ESTIMATE_REALISM_IRON_LAW = [
  'Read the baseline index and every plan artifact it references yourself; every issue and evidence entry MUST cite <file>:<line>.',
  'EXECUTED EVIDENCE — traceability matrix: for EVERY WBS package id in the index, execute the trace wbsId -> schedule activity ids -> budget cost account ids and record the result (covered yes/no, by which ids) in evidence. A verdict without a per-package executed trace is a protocol failure.',
  'EXECUTED EVIDENCE — reserve reconciliation: compute the register summed cost exposure and schedule exposure yourself from the risks array and compare them numerically to the budget contingencyReserve and the schedule scheduleContingencyDays. Record BOTH computed numbers and the comparison in evidence. Contingency materially below quantified exposure is a finding; contingency with no stated basis is a finding.',
  'EXECUTED EVIDENCE — critical path: recompute total float for the activities the plan calls critical and confirm they are actually zero-float. Record the recomputation.',
  'Every duration and cost lacking a named estimating basis is a finding — cite the artifact line and the missing basis.',
  'Procurement lead times that do not appear as schedule constraints are a finding; report the specific activity that can start before its procurement lands.',
  'Return your verdict as JSON with EXACTLY these keys and nothing else, as the LAST thing you output: {"passed": boolean, "issues": [{"severity": string, "description": string, "location": string}], "evidence": [string]}. passed:true with an empty evidence array is rejected by the orchestrator.',
];

// The watermelon detector. A status claim is FALSE until an artifact proves it:
// the critic must OPEN the cited artifacts and RUN the stated checks, then
// compare what it found against what was reported.
const STATUS_INTEGRITY_IRON_LAW = [
  'IRON LAW OF THIS GATE: a status claim is FALSE until an artifact proves it. Your default verdict is FAIL.',
  'EXECUTED EVIDENCE — artifact verification: for EVERY entry in supportingEvidence and EVERY deliverable claiming complete or in-progress, OPEN the cited artifactPath and run the stated howToVerify / acceptance check. Record per claim: claim -> artifactPath -> opened yes/no -> check executed -> result. A claim whose artifact does not exist, is empty, or does not contain what the claim asserts is a DISCREPANCY, and it must be reported with the path and the line you looked at.',
  'EXECUTED EVIDENCE — RAG re-derivation: independently derive each workstream RAG from its variances and blockers and compare it to the reported ragStatus. Record both. A reported status greener than your derivation is a watermelon and is reported as such, in those words, with the underlying variance cited.',
  'EXECUTED EVIDENCE — EV recomputation: recompute EV from the deliverables percentComplete against the baselined cost accounts and compare with the reported EV. Record your arithmetic. A gap you cannot reconcile is a finding, not a rounding difference.',
  'EXECUTED EVIDENCE — rollup check: confirm the aggregate rollup status equals the WORST reported workstream status. An aggregate greener than its worst constituent is a finding.',
  'Do not soften findings for tone. "The team is confident the artifact will exist next week" is not evidence; a promise of a future artifact is a discrepancy today.',
  'Report every discrepancy in issues AND summarize them in evidence; an empty issues array with unopened artifacts is a protocol failure.',
  'Return your verdict as JSON with EXACTLY these keys and nothing else, as the LAST thing you output: {"passed": boolean, "issues": [{"severity": string, "description": string, "location": string}], "evidence": [string]}. passed:true with an empty evidence array is rejected by the orchestrator.',
];

const BENEFITS_REALIZATION_IRON_LAW = [
  'Read the business case at the path in context AND the benefits report yourself; every issue and evidence entry MUST cite <file>:<line> in one of them.',
  'EXECUTED EVIDENCE — benefit-by-benefit comparison: for EVERY benefitId declared in the business case, EXECUTE the comparison yourself — locate its baselineValue and targetValue in the business case (cite businessCasePath:line), locate the claimed measured value in the benefits report (cite benefitsReportPath:line), apply the declared measurementMethod, and record the executed comparison (benefitId -> baseline -> target -> measured -> your verdict -> the report verdict -> agree yes/no). A verdict without this per-benefit executed comparison table is a protocol failure.',
  'Any benefit present in the business case and absent from the report is a finding — name the id.',
  'Any realized verdict whose measured value was not read from a named source is a finding; quote the unsupported claim.',
  'Where the program re-baselined a benefit target, verify the report measured against the ORIGINAL business-case target; measuring against a lowered target is a finding, and you must state both numbers.',
  'A not-measurable verdict is an acceptable honest outcome; a realized verdict you cannot reproduce from the cited sources is not.',
  'Return your verdict as JSON with EXACTLY these keys and nothing else, as the LAST thing you output: {"passed": boolean, "issues": [{"severity": string, "description": string, "location": string}], "evidence": [string]}. passed:true with an empty evidence array is rejected by the orchestrator.',
];

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    programName,
    programBrief,
    businessCaseBaselinePath,
    sponsor,
    stages,
    workstreams,
    changeRequests = [],
    changeThreshold,
    evThresholds = { cpiFloor: 0.9, spiFloor: 0.9 },
    maxChangeRounds = 3,
    maxFixAttempts = 2,
    maxParallel = 4,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs || {};

  // ---- Input validation: no fallbacks, every throw names the field ----------
  if (!programName) {
    throw new Error(`program-delivery-workflow: programName is required (got ${JSON.stringify(programName)})`);
  }
  if (!programBrief) {
    throw new Error(`program-delivery-workflow: programBrief is required (got ${JSON.stringify(programBrief)})`);
  }
  if (!Array.isArray(workstreams) || workstreams.length === 0) {
    throw new Error(`program-delivery-workflow: workstreams must be a non-empty array (got ${JSON.stringify(workstreams)})`);
  }
  if (!Array.isArray(stages) || stages.length === 0) {
    throw new Error(`program-delivery-workflow: stages must be a non-empty array (got ${JSON.stringify(stages)})`);
  }
  if (!Array.isArray(changeRequests)) {
    throw new Error(`program-delivery-workflow: changeRequests must be an array (got ${JSON.stringify(changeRequests)})`);
  }
  if (changeRequests.length > 0 && (!changeThreshold || typeof changeThreshold.costPct !== 'number' || typeof changeThreshold.scheduleDays !== 'number')) {
    throw new Error(`program-delivery-workflow: changeThreshold { costPct, scheduleDays } is required when changeRequests is non-empty — there is no default threshold, because a defaulted threshold silently auto-approves changes nobody sized (got ${JSON.stringify(changeThreshold)})`);
  }
  const workstreamIds = workstreams.map((w) => String(w.id));
  const duplicateWorkstreamIds = workstreamIds.filter((id, i) => workstreamIds.indexOf(id) !== i).sort();
  if (duplicateWorkstreamIds.length > 0) {
    throw new Error(`program-delivery-workflow: workstream ids must be unique (duplicates: ${JSON.stringify([...new Set(duplicateWorkstreamIds)])})`);
  }
  const stageIds = stages.map((s) => String(s.id));
  const duplicateStageIds = stageIds.filter((id, i) => stageIds.indexOf(id) !== i).sort();
  if (duplicateStageIds.length > 0) {
    throw new Error(`program-delivery-workflow: stage ids must be unique — a duplicate stage id would collapse two stage-gate breakpointIds on replay (duplicates: ${JSON.stringify([...new Set(duplicateStageIds)])})`);
  }

  // ---- Shared state (orchestrator-accumulated only) -------------------------
  const startTime = ctx.now();
  const timings = {};
  const breakpointsHit = [];
  const policyDecisions = [];
  const artifacts = [];
  const artifactsDir = ctx.artifactsDir;
  const programSlug = kebab(programName);
  const sharedArgs = { programName, programBrief, sponsor, artifactsDir };

  const recordPolicyDecision = (actionId, breakpointId, result) => {
    policyDecisions.push({
      actionId,
      breakpointId,
      approved: result.approved === true,
      response: result.response || result.feedback || null,
      autoApproved: result.autoApproved === true,
    });
  };

  const failureResult = (reason, partial) => ({
    success: false,
    businessCasePath: null,
    charterPath: null,
    baseline: null,
    stages: [],
    changeControl: [],
    benefits: [],
    closure: { decision: 'not-reached', closureReportPath: null, lessonsPath: null },
    gateResults: { estimateRealism: null, statusIntegrity: [], benefitsRealization: null },
    ...partial,
    policyDecisions,
    kipFactsAsserted: 0,
    artifacts,
    metadata: {
      processId: PROCESS_ID,
      runId: ctx.runId,
      breakpointsHit,
      timings,
      reason,
    },
  });

  // ---- P0 — kip recall -----------------------------------------------------
  ctx.log?.('info', 'P0: kip recall of prior program-delivery memory');
  let priorKnowledge = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  if (kipEnabled) {
    priorKnowledge = await kipRecall(ctx, {
      kipDir,
      kipModel,
      kind: 'program-delivery',
      topic: `prior program baselines, estimate accuracy, change-control outcomes, EV variance history, and benefits-realization results for ${programName}`,
    });
  }
  timings.kipRecall = ctx.now() - startTime;

  // ---- P1 — business case then charter (sequential by design) --------------
  ctx.log?.('info', 'P1: business case + program charter');
  const businessCase = await ctx.task(businessCaseTask, {
    ...sharedArgs,
    businessCaseBaselinePath: businessCaseBaselinePath ?? null,
    businessCaseTargetPath: join(artifactsDir, `business-case-${programSlug}.md`),
    priorKnowledge,
  });
  artifacts.push(businessCase.businessCasePath);

  const charter = await ctx.task(programCharterTask, {
    ...sharedArgs,
    charterTargetPath: join(artifactsDir, `program-charter-${programSlug}.md`),
    businessCasePath: businessCase.businessCasePath,
    benefits: businessCase.benefits,
    fundingEnvelope: businessCase.fundingEnvelope,
    workstreams,
    stages,
    priorKnowledge,
  });
  artifacts.push(charter.charterPath);
  timings.framing = ctx.now() - startTime;

  // ---- P2 — scope baseline + WBS ------------------------------------------
  ctx.log?.('info', 'P2: scope baseline + WBS');
  const scope = await ctx.task(scopeBaselineWbsTask, {
    ...sharedArgs,
    scopeBaselineTargetPath: join(artifactsDir, `scope-baseline-${programSlug}.md`),
    wbsTargetPath: join(artifactsDir, `wbs-${programSlug}.md`),
    charterPath: charter.charterPath,
    scopeStatement: charter.scopeStatement,
    objectives: charter.objectives,
    workstreams,
    priorKnowledge,
  });
  artifacts.push(scope.scopeBaselinePath, scope.wbsPath);
  timings.scope = ctx.now() - startTime;

  // ---- P3a — parallel core planning ---------------------------------------
  ctx.log?.('info', 'P3a: parallel core planning (schedule, budget, risk register, stakeholder map)');
  const corePlanBranches = ['schedule', 'budget', 'risk-register', 'stakeholder-map'];
  const corePlanResults = await ctx.parallel.all(
    corePlanBranches.map((branch) => async () => {
      switch (branch) {
        case 'schedule':
          return {
            branch,
            result: await ctx.task(scheduleCpmTask, {
              ...sharedArgs,
              scheduleTargetPath: join(artifactsDir, `schedule-${programSlug}.md`),
              wbsPackages: scope.wbsPackages,
              priorKnowledge,
            }),
          };
        case 'budget':
          return {
            branch,
            result: await ctx.task(budgetTask, {
              ...sharedArgs,
              budgetTargetPath: join(artifactsDir, `budget-${programSlug}.md`),
              wbsPackages: scope.wbsPackages,
              fundingEnvelope: businessCase.fundingEnvelope,
              priorKnowledge,
            }),
          };
        case 'risk-register':
          return {
            branch,
            result: await ctx.task(riskRegisterTask, {
              ...sharedArgs,
              riskRegisterTargetPath: join(artifactsDir, `risk-register-${programSlug}.md`),
              wbsPackages: scope.wbsPackages,
              charterPath: charter.charterPath,
              priorKnowledge,
            }),
          };
        case 'stakeholder-map':
          return {
            branch,
            result: await ctx.task(stakeholderMapTask, {
              ...sharedArgs,
              stakeholderMapTargetPath: join(artifactsDir, `stakeholder-map-${programSlug}.md`),
              governance: charter.governance,
              workstreams,
              priorKnowledge,
            }),
          };
        default:
          throw new Error(`program-delivery-workflow: unknown core planning branch ${JSON.stringify(branch)}`);
      }
    }),
    { maxConcurrency: maxParallel },
  );
  const coreByBranch = new Map(corePlanResults.map((entry) => [entry.branch, entry.result]));
  const schedule = coreByBranch.get('schedule');
  const budget = coreByBranch.get('budget');
  const riskRegister = coreByBranch.get('risk-register');
  const stakeholderMap = coreByBranch.get('stakeholder-map');
  if (!schedule || !budget || !riskRegister || !stakeholderMap) {
    throw new Error(`program-delivery-workflow: core planning fan-out returned incomplete branches (got ${JSON.stringify([...coreByBranch.keys()])})`);
  }
  artifacts.push(schedule.schedulePath, budget.budgetPath, riskRegister.riskRegisterPath, stakeholderMap.stakeholderMapPath);
  timings.corePlanning = ctx.now() - startTime;

  // ---- P3b — parallel supporting planning ---------------------------------
  ctx.log?.('info', 'P3b: parallel supporting planning (resource, procurement, quality, dependency)');
  const supportPlanBranches = ['resource-plan', 'procurement-plan', 'quality-plan', 'dependency-map'];
  const supportPlanResults = await ctx.parallel.all(
    supportPlanBranches.map((branch) => async () => {
      switch (branch) {
        case 'resource-plan':
          return {
            branch,
            result: await ctx.task(resourcePlanTask, {
              ...sharedArgs,
              resourcePlanTargetPath: join(artifactsDir, `resource-plan-${programSlug}.md`),
              activities: schedule.activities,
              wbsPackages: scope.wbsPackages,
              priorKnowledge,
            }),
          };
        case 'procurement-plan':
          return {
            branch,
            result: await ctx.task(procurementPlanTask, {
              ...sharedArgs,
              procurementPlanTargetPath: join(artifactsDir, `procurement-plan-${programSlug}.md`),
              costAccounts: budget.costAccounts,
              wbsPackages: scope.wbsPackages,
              activities: schedule.activities,
              priorKnowledge,
            }),
          };
        case 'quality-plan':
          return {
            branch,
            result: await ctx.task(qualityPlanTask, {
              ...sharedArgs,
              qualityPlanTargetPath: join(artifactsDir, `quality-plan-${programSlug}.md`),
              wbsPackages: scope.wbsPackages,
              objectives: charter.objectives,
              charterPath: charter.charterPath,
              priorKnowledge,
            }),
          };
        case 'dependency-map':
          return {
            branch,
            result: await ctx.task(dependencyMapTask, {
              ...sharedArgs,
              dependencyMapTargetPath: join(artifactsDir, `dependency-map-${programSlug}.md`),
              activities: schedule.activities,
              criticalPath: schedule.criticalPath,
              workstreams,
              priorKnowledge,
            }),
          };
        default:
          throw new Error(`program-delivery-workflow: unknown supporting planning branch ${JSON.stringify(branch)}`);
      }
    }),
    { maxConcurrency: maxParallel },
  );
  const supportByBranch = new Map(supportPlanResults.map((entry) => [entry.branch, entry.result]));
  const resourcePlan = supportByBranch.get('resource-plan');
  const procurementPlan = supportByBranch.get('procurement-plan');
  const qualityPlan = supportByBranch.get('quality-plan');
  const dependencyMap = supportByBranch.get('dependency-map');
  if (!resourcePlan || !procurementPlan || !qualityPlan || !dependencyMap) {
    throw new Error(`program-delivery-workflow: supporting planning fan-out returned incomplete branches (got ${JSON.stringify([...supportByBranch.keys()])})`);
  }
  artifacts.push(resourcePlan.resourcePlanPath, procurementPlan.procurementPlanPath, qualityPlan.qualityPlanPath, dependencyMap.dependencyMapPath);
  timings.supportingPlanning = ctx.now() - startTime;

  // ---- P4 — integrated baseline assembly + estimate-realism gate -----------
  ctx.log?.('info', 'P4: integrated baseline assembly + estimate-and-risk-realism gate');
  let wbsPackages = scope.wbsPackages;
  let activities = schedule.activities;
  let costAccounts = budget.costAccounts;

  // Deterministic verification BEFORE anything is presented for approval: an
  // unscheduled or unfunded work package is a baseline defect, and it throws.
  verifyBaselineCoverage(wbsPackages, activities, costAccounts);

  const baselineIndexPath = join(artifactsDir, 'baseline', 'index.json');
  const buildBaselineIndex = (version) => ({
    generatedBy: 'process-code',
    runId: ctx.runId,
    program: programSlug,
    version,
    wbsIds: wbsPackages.map((p) => String(p.id)).sort(),
    activityIds: activities.map((a) => String(a.activityId)).sort(),
    costAccountIds: costAccounts.map((a) => String(a.accountId)).sort(),
    plans: {
      scopeBaselinePath: scope.scopeBaselinePath,
      wbsPath: scope.wbsPath,
      schedulePath: schedule.schedulePath,
      budgetPath: budget.budgetPath,
      riskRegisterPath: riskRegister.riskRegisterPath,
      stakeholderMapPath: stakeholderMap.stakeholderMapPath,
      resourcePlanPath: resourcePlan.resourcePlanPath,
      procurementPlanPath: procurementPlan.procurementPlanPath,
      qualityPlanPath: qualityPlan.qualityPlanPath,
      dependencyMapPath: dependencyMap.dependencyMapPath,
    },
  });
  writeIndexArtifact(baselineIndexPath, buildBaselineIndex(1));
  artifacts.push(baselineIndexPath);

  const estimateRealism = await adversarialGate(ctx, {
    gateId: 'pdw.estimate-realism',
    artifact: { path: baselineIndexPath, description: 'Integrated baseline index (WBS + schedule + budget + risk register)' },
    critics: [
      {
        name: 'estimate-realism-critic',
        role: 'Estimating and schedule-realism reviewer',
        focus: 'durations and costs that are not defensible against the WBS: missing estimating basis, zero-float chains with no buffer, procurement lead times absent from the network, resource over-allocation smoothed away, and work packages with no schedule activity or no cost account',
      },
      {
        name: 'risk-contingency-critic',
        role: 'Risk-and-contingency adequacy reviewer',
        focus: 'contingency and management reserve that do not reconcile with the register quantified exposure, unowned or untriggered risks, high-exposure risks with an accept response and no rationale, and optimism bias (a plan whose every estimate is the best case)',
      },
    ],
    ironLaw: ESTIMATE_REALISM_IRON_LAW,
    maxFixAttempts,
    fixer: {},
    context: {
      wbsPackages,
      activities,
      costAccounts,
      risks: riskRegister.risks,
      quantifiedExposure: riskRegister.quantifiedExposure,
      allocations: resourcePlan.allocations,
      overAllocations: resourcePlan.overAllocations,
      procurements: procurementPlan.procurements,
      scheduleImpacts: procurementPlan.scheduleImpacts,
      priorKnowledge,
    },
  });
  if (estimateRealism.escalated) {
    breakpointsHit.push('pdw.estimate-realism.gate-escalation');
  }
  timings.estimateRealismGate = ctx.now() - startTime;

  if (!estimateRealism.passed) {
    // The baseline-approval breakpoint is NEVER raised over a baseline the
    // realism gate rejected.
    return failureResult(
      'estimate-and-risk-realism gate failed and the owner rejected the escalation — baseline approval was never raised and no stage executed',
      {
        businessCasePath: businessCase.businessCasePath,
        charterPath: charter.charterPath,
        gateResults: { estimateRealism, statusIntegrity: [], benefitsRealization: null },
      },
    );
  }

  // ---- P5 — baseline approval (policy-gated, project-sponsor) --------------
  ctx.log?.('info', 'P5: baseline approval (policy-gated, project-sponsor)');
  const baselineApprovalBreakpointId = 'program-delivery.baseline-approval';
  let baselineApproved = false;
  let baselineApprovalResponse = null;
  let baselineFeedback = null;
  let baselineVersion = 1;

  for (let round = 0; round < 2; round++) {
    if (round > 0) {
      // Guarded executor: the revision task runs ONLY on the rejection path,
      // and only with the sponsor directive that drives it.
      const revision = await ctx.task(baselineRevisionTask, {
        ...sharedArgs,
        attempt: round + 1,
        feedback: baselineFeedback,
        baselineIndexPath,
        wbsPackages,
        activities,
        costAccounts,
        plans: buildBaselineIndex(baselineVersion).plans,
        priorKnowledge,
      });
      wbsPackages = revision.wbsPackages;
      activities = revision.activities;
      costAccounts = revision.costAccounts;
      verifyBaselineCoverage(wbsPackages, activities, costAccounts);
      baselineVersion = 2;
      writeIndexArtifact(baselineIndexPath, buildBaselineIndex(baselineVersion));
    }

    const totals = {
      totalCost: totalBaselineCost(costAccounts, budget.contingencyReserve, budget.managementReserve),
      contingencyReserve: budget.contingencyReserve,
      managementReserve: budget.managementReserve,
      plannedFinish: plannedFinishFromSchedule(activities, schedule.criticalPath),
      criticalPathLength: schedule.criticalPath.length,
    };
    const approval = await routedBreakpoint(ctx, {
      question: `Approve the integrated scope/schedule/cost baseline for ${programName} as the measurement datum for all later variance? Rejecting REQUIRES feedback and buys exactly one revision; a second rejection ends the run and no stage executes.`,
      context: {
        runId: ctx.runId,
        files: [
          { path: baselineIndexPath, label: 'Integrated baseline index' },
          { path: schedule.schedulePath, label: 'CPM schedule' },
          { path: budget.budgetPath, label: 'Cost baseline' },
          { path: riskRegister.riskRegisterPath, label: 'Risk register' },
          { path: scope.scopeBaselinePath, label: 'Scope baseline' },
        ],
        totals,
        gateVerdict: {
          passed: estimateRealism.passed,
          attempts: estimateRealism.attempts,
          escalated: estimateRealism.escalated,
          issues: estimateRealism.issues,
        },
        round,
      },
    }, {
      breakpointId: baselineApprovalBreakpointId,
      expert: 'project-sponsor',
      tags: ['policy-gated', 'project-management', 'baseline'],
      strategy: 'single',
    });
    breakpointsHit.push(baselineApprovalBreakpointId);
    recordPolicyDecision('program-delivery.baseline-approval', baselineApprovalBreakpointId, approval);
    baselineApprovalResponse = approval.response || approval.feedback || null;

    if (requireRecordedDecision(approval, baselineApprovalBreakpointId)) {
      baselineApproved = true;
      break;
    }
    baselineFeedback = baselineApprovalResponse;
    if (!baselineFeedback) {
      throw new Error(`${baselineApprovalBreakpointId} rejected without feedback — the baseline revision round has nothing to apply (fallbacks forbidden).`);
    }
  }
  timings.baselineApproval = ctx.now() - startTime;

  const baseline = {
    scopeBaselinePath: scope.scopeBaselinePath,
    wbsPath: scope.wbsPath,
    schedulePath: schedule.schedulePath,
    budgetPath: budget.budgetPath,
    riskRegisterPath: riskRegister.riskRegisterPath,
    baselineIndexPath,
    approved: baselineApproved,
    approvedAt: baselineApproved ? ctx.now() : null,
    version: baselineVersion,
  };

  // Hard guard: execution NEVER starts on an unapproved baseline.
  if (baselineApproved !== true) {
    return failureResult(
      'baseline-approval rejected twice by the project-sponsor — execution never started and no stage gate was raised',
      {
        businessCasePath: businessCase.businessCasePath,
        charterPath: charter.charterPath,
        baseline,
        gateResults: { estimateRealism, statusIntegrity: [], benefitsRealization: null },
      },
    );
  }

  // ---- P6 — stage-gated execution loop (sequential over stages) ------------
  ctx.log?.('info', `P6: stage-gated execution loop over ${stages.length} stage(s)`);
  const stageRecords = [];
  const statusIntegrityGates = [];
  const changeControlRecords = [];
  let cancelled = false;
  let cancellationReason = null;
  let carriedConditions = [];
  let currentBaselineVersion = baselineVersion;

  for (const stage of stages) {
    ctx.log?.('info', `P6: stage ${stage.id} — execution, status rollup, EV checkpoint, integrity gate, change control, phase gate`);
    const stageSlug = kebab(stage.id);

    // 6.1 — stage execution against the approved baseline.
    const execution = await ctx.task(stageExecutionTask, {
      ...sharedArgs,
      stage,
      baselineIndexPath,
      baselineVersion: currentBaselineVersion,
      wbsPackages,
      acceptanceChecks: qualityPlan.acceptanceChecks,
      risks: riskRegister.risks,
      dependencies: dependencyMap.dependencies,
      carriedConditions,
      workstreams,
      stageRecordTargetPath: join(artifactsDir, 'stages', stageSlug, 'execution-record.md'),
      priorKnowledge,
    });
    artifacts.push(execution.stageRecordPath);

    // 6.2 — ctx.parallel.map workstream status rollup, then deterministic
    // completeness verification and a WORST-of aggregate computed here.
    const statusReports = await ctx.parallel.map(
      workstreams,
      (workstream) => ctx.task(workstreamStatusTask, {
        ...sharedArgs,
        stage,
        workstream,
        deliverables: execution.deliverables,
        raisedIssues: execution.raisedIssues,
        communicationPlan: stakeholderMap.communicationPlan,
        acceptanceChecks: qualityPlan.acceptanceChecks,
        wbsPackages,
        baselineIndexPath,
      }),
      { maxConcurrency: maxParallel },
    );
    verifyStatusCoverage(workstreams, statusReports);
    const rollupRag = worstRag(statusReports.map((r) => r.ragStatus));

    // 6.3 — earned-value checkpoint against the approved baseline.
    const evCheckpoint = await ctx.task(evCheckpointTask, {
      ...sharedArgs,
      stage,
      evThresholds,
      deliverables: execution.deliverables,
      statusReports,
      costAccounts,
      plannedValueCurve: budget.plannedValueCurve,
      baselineIndexPath,
    });

    // Deterministic, byte-stable rollup index — the critic reviews an artifact,
    // not an agent prose summary.
    const statusRollupIndexPath = join(artifactsDir, 'stages', stageSlug, 'status-rollup.json');
    writeIndexArtifact(statusRollupIndexPath, {
      generatedBy: 'process-code',
      runId: ctx.runId,
      program: programSlug,
      stageId: stage.id,
      rollupRag,
      stageRecordPath: execution.stageRecordPath,
      baselineIndexPath,
      workstreams: [...statusReports]
        .sort((a, b) => String(a.workstreamId).localeCompare(String(b.workstreamId)))
        .map((r) => ({
          workstreamId: r.workstreamId,
          ragStatus: r.ragStatus,
          variances: r.variances,
          supportingEvidence: r.supportingEvidence,
          blockers: r.blockers,
          asks: r.asks,
        })),
      deliverables: [...execution.deliverables].sort((a, b) => String(a.wbsId).localeCompare(String(b.wbsId))),
      ev: {
        pv: evCheckpoint.pv,
        ev: evCheckpoint.ev,
        ac: evCheckpoint.ac ?? null,
        cpi: evCheckpoint.cpi ?? null,
        spi: evCheckpoint.spi ?? null,
        eac: evCheckpoint.eac ?? null,
        vac: evCheckpoint.vac ?? null,
        derivations: evCheckpoint.derivations,
        reconciliation: evCheckpoint.reconciliation,
        thresholdBreached: evCheckpoint.thresholdBreached,
      },
    });
    artifacts.push(statusRollupIndexPath);

    // 6.4 — ADVERSARIAL STATUS-INTEGRITY GATE (the watermelon detector).
    const integrityGateId = `pdw.status-integrity.stage-${stage.id}`;
    const statusIntegrityGate = await adversarialGate(ctx, {
      gateId: integrityGateId,
      artifact: { path: statusRollupIndexPath, description: `Stage ${stage.id} status rollup + EV checkpoint under integrity review` },
      critics: [
        {
          name: 'status-integrity-critic',
          role: 'Adversarial status-integrity reviewer (watermelon detector)',
          focus: 'reported status that is greener than the artifacts support: green/amber RAG over unopenable or absent artifacts, completion claims with no artifactPath, percentComplete that the artifact contradicts, blocked work reported in-progress, unsatisfied acceptance checks under a complete deliverable, and workstreams whose red rolled up as green',
        },
        {
          name: 'ev-arithmetic-critic',
          role: 'Earned-value arithmetic and reconciliation reviewer',
          focus: 'EV/PV/AC derivations that do not recompute, EV derived from percentComplete that disagrees with the deliverables array, planned cost substituted for actual, CPI/SPI presented despite a null AC, and reconciliation gaps reported as agreeing',
        },
      ],
      ironLaw: STATUS_INTEGRITY_IRON_LAW,
      maxFixAttempts,
      fixer: {
        args: {
          context: {
            rule: 'Correct the STATUS to match the artifacts. NEVER manufacture artifacts to match the status.',
          },
        },
      },
      context: {
        stageId: stage.id,
        rollupRag,
        deliverables: execution.deliverables,
        statusReports,
        acceptanceChecks: qualityPlan.acceptanceChecks,
        costAccounts,
        evCheckpoint,
        baselineIndexPath,
        stageRecordPath: execution.stageRecordPath,
        priorKnowledge,
      },
    });
    if (statusIntegrityGate.escalated) {
      breakpointsHit.push(`${integrityGateId}.gate-escalation`);
    }
    // The discrepancies are threaded into the gate review, the escalation task,
    // the lessons task and the closure report. A discrepancy that never reached
    // the gate decision would defeat the entire gate.
    const discrepancies = statusIntegrityGate.issues;
    statusIntegrityGates.push({ stageId: stage.id, ...statusIntegrityGate });

    // 6.5 — issue + dependency escalation on a breach, a discrepancy, or a
    // critical open issue.
    const hasCriticalIssue = execution.raisedIssues.some((issue) => String(issue.severity).toLowerCase() === 'critical');
    let escalation = { escalations: [], recommendCancellationReview: false, cancellationGrounds: null };
    if (evCheckpoint.thresholdBreached === true || discrepancies.length > 0 || hasCriticalIssue) {
      escalation = await ctx.task(issueDependencyEscalationTask, {
        ...sharedArgs,
        stage,
        evCheckpoint,
        evThresholds,
        discrepancies,
        raisedIssues: execution.raisedIssues,
        dependencies: dependencyMap.dependencies,
        criticalPathDependencies: dependencyMap.criticalPathDependencies,
        stakeholders: stakeholderMap.stakeholders,
        managementReserve: budget.managementReserve,
      });
    }

    // 6.6 — bounded change-control board loop (exported reusable stage).
    const stageChangeRequests = [
      ...(stageRecords.length === 0 ? changeRequests : []),
      ...execution.raisedChangeRequests,
    ];
    const changeControl = await runChangeControlStage(ctx, {
      programName,
      stageId: stage.id,
      changeRequests: stageChangeRequests,
      baseline: {
        ...baseline,
        version: currentBaselineVersion,
        currentEv: { cpi: evCheckpoint.cpi ?? null, spi: evCheckpoint.spi ?? null, vac: evCheckpoint.vac ?? null },
        priorOverrun: evCheckpoint.notComputable ?? [],
      },
      changeThreshold,
      maxChangeRounds,
      priorKnowledge,
      artifactsDir,
      recordPolicyDecision,
      breakpointsHit,
    });
    changeControlRecords.push(...changeControl.records);
    if (changeControl.rebaselineOccurred && changeControl.newBaselineVersion !== null) {
      currentBaselineVersion = changeControl.newBaselineVersion;
      writeIndexArtifact(baselineIndexPath, buildBaselineIndex(currentBaselineVersion));
    }

    // 6.7 — stage-gate review + steering-committee phase gate (exported stage).
    const gate = await runStageGateReview(ctx, {
      programName,
      stage,
      evCheckpoint,
      statusRollup: { rollupRag, statusReports, statusRollupIndexPath, stageRecordPath: execution.stageRecordPath },
      statusIntegrity: { passed: statusIntegrityGate.passed, escalated: statusIntegrityGate.escalated, discrepancies },
      changeRecords: changeControl.records,
      exitCriteria: (stage.exitCriteria && stage.exitCriteria.length > 0) ? stage.exitCriteria : qualityPlan.acceptanceChecks,
      baseline: { ...baseline, version: currentBaselineVersion },
      artifactsDir,
      recordPolicyDecision,
      breakpointsHit,
    });
    artifacts.push(gate.reviewPath);
    let gateDecision = gate.decision;

    // 6.8 — cancellation review, raised only on named grounds.
    if (escalation.recommendCancellationReview === true || gate.cancellationRecommended === true) {
      const cancellationBreakpointId = `program-delivery.project-cancellation.stage-${stage.id}`;
      // Grounds are mandatory on this path: a cancellation decision is never put to the
      // sponsor under substituted text. Nothing is invented for a missing value.
      const cancellationGrounds = escalation.cancellationGrounds ?? gate.cancellationGrounds;
      if (!cancellationGrounds) {
        throw new Error(
          `program-delivery-workflow: project-cancellation raised at stage ${stage.id} with no cancellationGrounds — a cancellation decision without stated grounds is never raised (fallbacks forbidden).`,
        );
      }
      const cancellation = await routedBreakpoint(ctx, {
        question: `Cancel or indefinitely suspend ${programName} at stage ${stage.name}? Grounds: ${cancellationGrounds}. Approving stops delivery; the closure record, benefits measurement and lessons are still produced.`,
        context: {
          runId: ctx.runId,
          stageId: stage.id,
          cancellationGrounds,
          evCheckpoint: { cpi: evCheckpoint.cpi ?? null, spi: evCheckpoint.spi ?? null, vac: evCheckpoint.vac ?? null },
          benefitsAtRisk: businessCase.benefits,
          files: [{ path: gate.reviewPath, label: `Stage ${stage.id} gate review` }],
        },
      }, {
        breakpointId: cancellationBreakpointId,
        expert: 'project-sponsor',
        tags: ['policy-gated', 'project-management', 'cancellation'],
        strategy: 'single',
      });
      breakpointsHit.push(cancellationBreakpointId);
      recordPolicyDecision('program-delivery.project-cancellation', cancellationBreakpointId, cancellation);
      if (requireRecordedDecision(cancellation, cancellationBreakpointId)) {
        cancelled = true;
        cancellationReason = cancellation.response ?? cancellation.feedback ?? cancellationGrounds;
        gateDecision = 'cancelled';
      }
    }

    stageRecords.push({
      stageId: stage.id,
      name: stage.name,
      evCheckpoint: {
        pv: evCheckpoint.pv,
        ev: evCheckpoint.ev,
        ac: evCheckpoint.ac ?? null,
        cpi: evCheckpoint.cpi ?? null,
        spi: evCheckpoint.spi ?? null,
        eac: evCheckpoint.eac ?? null,
        vac: evCheckpoint.vac ?? null,
      },
      statusRollup: { rollupRag, statusRollupIndexPath, statusReports },
      statusIntegrity: { passed: statusIntegrityGate.passed, escalated: statusIntegrityGate.escalated, discrepancies },
      escalations: escalation.escalations,
      changeRequests: changeControl.records.map((r) => r.crId),
      gateDecision,
      breakpointId: gate.breakpointId,
    });

    // Conditions from a conditional-go are carried into the next stage and
    // re-checked at its gate.
    carriedConditions = gateDecision === 'conditional-go' ? gate.conditions : [];

    if (cancelled) break;
    if (gateDecision === 'no-go') break;
  }
  timings.execution = ctx.now() - startTime;

  // ---- P8 — benefits realization (BEFORE the closure report and breakpoint) -
  ctx.log?.('info', 'P8: benefits realization + adversarial benefits gate + portfolio feedback');
  const benefitsReportTargetPath = join(artifactsDir, `benefits-realization-${programSlug}.md`);
  const benefitsRealization = await ctx.task(benefitsRealizationTask, {
    ...sharedArgs,
    businessCasePath: businessCase.businessCasePath,
    businessCaseBenefits: businessCase.benefits,
    benefitsReportTargetPath,
    stages: stageRecords,
    changeControl: changeControlRecords,
    cancelled,
    priorKnowledge,
  });
  verifyBenefitsCoverage(businessCase.benefits, benefitsRealization.benefitVerdicts);
  artifacts.push(benefitsRealization.benefitsReportPath);

  const rebaselineEvents = changeControlRecords.filter((r) => r.rebaselined === true);
  const benefitsGate = await adversarialGate(ctx, {
    gateId: 'pdw.benefits-realization',
    artifact: { path: benefitsRealization.benefitsReportPath, description: 'Benefits realization report under adversarial review' },
    critics: [
      {
        name: 'benefits-realization-critic',
        role: 'Adversarial benefits-realization reviewer',
        focus: 'claimed benefits that the business-case baseline does not support: measurements taken against a re-baselined (lowered) target, targets restated as measurements, realized verdicts with no named data source, benefits quietly dropped, and measurement dates that have not arrived being reported as achieved',
      },
      {
        name: 'measurement-method-critic',
        role: 'Measurement-method fidelity reviewer',
        focus: 'measurements not taken by the method the business case declared, changed measurement definitions between baseline and outcome, and cherry-picked measurement windows',
      },
    ],
    ironLaw: BENEFITS_REALIZATION_IRON_LAW,
    maxFixAttempts,
    fixer: {},
    context: {
      businessCasePath: businessCase.businessCasePath,
      businessCaseBenefits: businessCase.benefits,
      benefitVerdicts: benefitsRealization.benefitVerdicts,
      rebaselineEvents,
      priorKnowledge,
    },
  });
  if (benefitsGate.escalated) {
    breakpointsHit.push('pdw.benefits-realization.gate-escalation');
  }

  const portfolioFeedback = await ctx.task(portfolioFeedbackTask, {
    ...sharedArgs,
    benefitVerdicts: benefitsRealization.benefitVerdicts,
    stages: stageRecords,
    changeControl: changeControlRecords,
    baseline: { ...baseline, version: currentBaselineVersion },
    cancelled,
    priorKnowledge,
  });
  timings.benefits = ctx.now() - startTime;

  // ---- P7 — lessons learned, closure report, program-closure breakpoint -----
  ctx.log?.('info', 'P7: lessons learned + closure report + program-closure (policy-gated)');
  const allDiscrepancies = statusIntegrityGates.flatMap((g) => g.issues.map((issue) => ({ stageId: g.stageId, ...issue })));
  const lessons = await ctx.task(lessonsLearnedTask, {
    ...sharedArgs,
    runId: ctx.runId,
    lessonsTargetPath: join(artifactsDir, `lessons-learned-${programSlug}.md`),
    gateResults: { estimateRealism, statusIntegrity: statusIntegrityGates, benefitsRealization: benefitsGate },
    statusIntegrityDiscrepancies: allDiscrepancies,
    stages: stageRecords,
    changeControl: changeControlRecords,
    benefitVerdicts: benefitsRealization.benefitVerdicts,
    cancelled,
  });
  artifacts.push(lessons.lessonsPath);

  const closureReport = await ctx.task(closureReportTask, {
    ...sharedArgs,
    runId: ctx.runId,
    closureReportTargetPath: join(artifactsDir, `program-closure-${programSlug}.md`),
    baseline: { ...baseline, version: currentBaselineVersion },
    stages: stageRecords,
    changeControl: changeControlRecords,
    statusIntegrityDiscrepancies: allDiscrepancies,
    policyDecisions,
    benefitVerdicts: benefitsRealization.benefitVerdicts,
    benefitsGate,
    lessons: lessons.lessons,
    lessonsPath: lessons.lessonsPath,
    portfolioImplications: portfolioFeedback.portfolioImplications,
    estimateAccuracy: portfolioFeedback.estimateAccuracy,
    cancelled,
    cancellationReason,
  });
  artifacts.push(closureReport.closureReportPath);

  const closureBreakpointId = 'program-delivery.program-closure';
  const closureApproval = await routedBreakpoint(ctx, {
    question: `Close ${programName}? Closure discharges the program accountability for its benefits. ${benefitsRealization.benefitVerdicts.length} benefit(s) were adjudicated against the business-case baseline and the benefits gate passed=${benefitsGate.passed}.`,
    context: {
      runId: ctx.runId,
      files: [
        { path: closureReport.closureReportPath, label: 'Program closure report' },
        { path: benefitsRealization.benefitsReportPath, label: 'Benefits realization report' },
        { path: lessons.lessonsPath, label: 'Lessons learned' },
      ],
      benefitVerdicts: benefitsRealization.benefitVerdicts,
      finalVariance: stageRecords.length > 0 ? stageRecords[stageRecords.length - 1].evCheckpoint : null,
      openItems: allDiscrepancies,
      stageDecisions: stageRecords.map((s) => ({ stageId: s.stageId, gateDecision: s.gateDecision, breakpointId: s.breakpointId })),
    },
  }, {
    breakpointId: closureBreakpointId,
    expert: 'project-sponsor',
    tags: ['policy-gated', 'project-management', 'closure'],
    strategy: 'single',
  });
  breakpointsHit.push(closureBreakpointId);
  recordPolicyDecision('program-delivery.program-closure', closureBreakpointId, closureApproval);
  const closureApproved = requireRecordedDecision(closureApproval, closureBreakpointId);

  const closure = {
    decision: cancelled ? 'cancelled' : (closureApproved ? 'closed' : 'not-reached'),
    closureReportPath: closureReport.closureReportPath,
    lessonsPath: lessons.lessonsPath,
    response: closureApproval.response || closureApproval.feedback || null,
    cancellationReason,
  };
  timings.closure = ctx.now() - startTime;

  // ---- P9 — kip assert -----------------------------------------------------
  ctx.log?.('info', 'P9: kip assert of program-delivery facts');
  let kipFactsAsserted = 0;
  if (kipEnabled) {
    const programSubject = `program:${programSlug}`;
    const facts = [];
    // Unconditional on EVERY path — the facts array is never empty and never padded.
    facts.push({
      subject: programSubject,
      predicate: 'closure-outcome',
      object: closure.decision,
      props: {
        reason: cancelled
          ? `cancelled by the project-sponsor: ${cancellationReason}`
          : (closureApproved ? 'program-closure approved by the project-sponsor' : 'program-closure rejected by the project-sponsor'),
        closureReportPath: closure.closureReportPath,
        runId: ctx.runId,
      },
    });
    facts.push({
      subject: programSubject,
      predicate: 'baseline-approved',
      object: baseline.approved ? 'approved' : 'rejected',
      props: {
        version: currentBaselineVersion,
        totalCost: totalBaselineCost(costAccounts, budget.contingencyReserve, budget.managementReserve),
        plannedFinish: plannedFinishFromSchedule(activities, schedule.criticalPath),
        runId: ctx.runId,
      },
    });
    for (const stageRecord of stageRecords) {
      facts.push({
        subject: programSubject,
        predicate: 'stage-gate-decision',
        object: stageRecord.gateDecision,
        props: {
          stageId: stageRecord.stageId,
          breakpointId: stageRecord.breakpointId,
          cpi: stageRecord.evCheckpoint.cpi,
          spi: stageRecord.evCheckpoint.spi,
          vac: stageRecord.evCheckpoint.vac,
          rollupRag: stageRecord.statusRollup.rollupRag,
          integrityPassed: stageRecord.statusIntegrity.passed,
          runId: ctx.runId,
        },
      });
    }
    for (const verdict of benefitsRealization.benefitVerdicts) {
      facts.push({
        subject: programSubject,
        predicate: 'benefit-outcome',
        object: verdict.verdict,
        props: {
          benefitId: verdict.benefitId,
          baseline: verdict.baseline,
          target: verdict.claimed,
          measured: verdict.measured,
          evidenceRef: verdict.evidenceRef,
          runId: ctx.runId,
        },
      });
    }
    for (const record of changeControlRecords) {
      const lastRound = record.rounds[record.rounds.length - 1];
      facts.push({
        subject: programSubject,
        predicate: 'change-disposition',
        object: record.disposition,
        props: {
          crId: record.crId,
          type: record.type,
          rebaselined: record.rebaselined,
          autoApproved: lastRound ? lastRound.autoApproved : false,
          runId: ctx.runId,
        },
      });
    }
    for (const gateRecord of statusIntegrityGates) {
      for (let i = 0; i < gateRecord.issues.length; i++) {
        const issue = gateRecord.issues[i];
        facts.push({
          subject: programSubject,
          predicate: 'status-integrity-finding',
          object: `stage-${gateRecord.stageId}-finding-${i + 1}`,
          props: {
            critic: issue.critic,
            severity: issue.severity,
            description: issue.description,
            runId: ctx.runId,
          },
        });
      }
    }
    facts.push({
      subject: programSubject,
      predicate: 'estimate-accuracy',
      object: `cost-ratio-${portfolioFeedback.estimateAccuracy.costRatio}`,
      props: {
        costRatio: portfolioFeedback.estimateAccuracy.costRatio,
        scheduleRatio: portfolioFeedback.estimateAccuracy.scheduleRatio,
        basis: portfolioFeedback.estimateAccuracy.basis,
        runId: ctx.runId,
      },
    });

    const capture = await kipAssert(ctx, { kipDir, kipModel, kind: 'program-delivery', facts });
    kipFactsAsserted = capture.asserted;
  }
  timings.total = ctx.now() - startTime;

  const allStagesDecided = stageRecords.length === stages.length
    && stageRecords.every((s) => typeof s.gateDecision === 'string' && s.gateDecision.length > 0);
  const integrityGatesPassed = statusIntegrityGates.every((g) => g.passed === true);
  const success = baseline.approved === true
    && allStagesDecided
    && integrityGatesPassed
    && benefitsGate.passed === true
    && (closure.decision === 'closed' || closure.decision === 'cancelled');

  return {
    success,
    businessCasePath: businessCase.businessCasePath,
    charterPath: charter.charterPath,
    baseline: { ...baseline, version: currentBaselineVersion },
    stages: stageRecords,
    changeControl: changeControlRecords,
    benefits: benefitsRealization.benefitVerdicts,
    closure,
    gateResults: {
      estimateRealism,
      statusIntegrity: statusIntegrityGates,
      benefitsRealization: benefitsGate,
    },
    policyDecisions,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: PROCESS_ID,
      runId: ctx.runId,
      breakpointsHit,
      timings,
    },
  };
}
