/**
 * @process methodologies/composition-saas-analytics-dashboard
 * @description SaaS analytics-dashboard composition (methodology backlog Example 5): a B2B SaaS
 *   analytics dashboard delivered by composing Jobs-to-be-Done (discovery jobs, forces, job
 *   stories), Impact Mapping (business-goal -> actor -> impact -> deliverable ladder), Spec-Kit
 *   (constitution + per-view specs + data contracts + measurable acceptance assertions), Kanban
 *   (flow, WIP limits) and Extreme Programming (TDD pairs, CI). JTBD interview synthesis fans out
 *   in parallel; per-impact-branch view/data-contract elaboration fans out in parallel; ready
 *   cards implement under the Kanban Dev WIP limit in parallel. Every methodology seam is guarded
 *   by an adversarial executed-evidence gate; the implementation -> release seam is the executed
 *   spec-conformance gate that renders the built dashboard and checks it against each Spec-Kit
 *   acceptance assertion before any beta invite. Beta rollout to design partners and the GA
 *   release are policy-gated actions carried through routed breakpoints; the cycle closes with a
 *   whole-composition retro and a kip assert.
 * @composes library/methodologies/jobs-to-be-done/jobs-to-be-done.js (imports forcesAnalysisTask,
 *   jobStoryGenerationTask; own csd.interview-synthesis for parallel interview synthesis),
 *   library/methodologies/impact-mapping/impact-mapping.js (imports actorIdentificationTask,
 *   impactAnalysisTask, deliverableGenerationTask, prioritizationTask),
 *   library/methodologies/spec-kit/spec-kit-specification.js and spec-kit-planning.js (export only
 *   `process` — re-expressed here as own csd.constitution, csd.view-spec, csd.data-contract,
 *   csd.spec-checklist tasks that mirror their semantics),
 *   library/methodologies/extreme-programming/xp-process.js (imports pairProgrammingTask,
 *   tddPracticeTask, continuousIntegrationTask, refactoringTask),
 *   library/methodologies/kanban/kanban.js (semantics mirrored as own csd.wip-setup,
 *   csd.pull-cards, csd.flow-metrics — kanban.js and xp-process.js both register a global task id
 *   `retrospective`, so importing both would throw a DuplicateTaskIdError at load; re-expressing
 *   the Kanban stages keeps the module loadable),
 *   library/specializations/product-management/product-lifecycle-e2e.js (pattern reference: point
 *   tasks composed as callable stages; Spec-Kit artifacts feed implementation)
 * @policyGatedActions beta-customer-invite (product-owner) — approve sending beta invitations and
 *   granting scoped dashboard access to external design-partner customers; dashboard-ga-release
 *   (head-of-product) — approve general-availability release of the dashboard to all tenants.
 *   Each raised via routedBreakpoint with breakpointId = actionId, tags
 *   ['policy-gated','csd', <phase-tag>], strategy 'single', no autoApproveAfterN; every executor
 *   branch guards on approved === true and records { approved, autoApproved:
 *   response?.autoApproved === true, breakpointId, expert, response } provenance.
 * @supersedes the '📝 Not Implemented' status of backlog Example 5 only
 *   (library/methodologies/backlog.md ~line 2062); no code module is replaced
 * @graph
 *   domains: [domain:software-engineering, domain:business]
 *   specializations: [specialization:product-management, specialization:qa-testing-automation]
 *   skillAreas: [skill-area:product-discovery, skill-area:prioritization-frameworks, skill-area:acceptance-testing]
 *   workflows: [workflow:product-discovery, workflow:feature-development, workflow:release-management]
 *   topics: [topic:jobs-to-be-done, topic:impact-mapping, topic:test-driven-development]
 *   roles: [role:product-manager, role:product-owner, role:tech-lead, role:qa-engineer]
 * @inputs { productName: string (required), dashboardBrief: string (required),
 *   businessGoal: string (required), customerSegments?: array<string> (default derived),
 *   designPartners?: array<{customerId, name, segment}> (default []),
 *   performanceBudget?: object (default { dashboardLoadMs: 3000, queryMs: 1000, dataLatencyMin: 5 }),
 *   maxFixAttempts?: number (default 2 — bounded fixer budget per adversarial gate),
 *   maxInterviews?: number (default 5 — cap on parallel JTBD interview-synthesis fan-out),
 *   kipEnabled?: boolean (default true), kipDir?: string (default '.a5c/kip'),
 *   kipModel?: string (default 'sonnet') }
 * @outputs { success: boolean, jtbd: { reportPath, jobs }, impactMap: { mapPath, goal, branches },
 *   specs: { constitutionPath, viewSpecs, checklist }, implementation: { board, storiesImplemented,
 *   flowMetrics }, conformance: { reportPath, passed, renderedEvidence, totals },
 *   beta: { approved, autoApproved, breakpointId, expert, response, invitedCustomers, accessGranted } | null,
 *   ga: { approved, autoApproved, breakpointId, expert, response, released, releaseNotes } | null,
 *   retro: { wentWell, couldImprove, actions }, kipFactsAsserted: number, artifacts: array,
 *   metadata: { processId, runId, breakpointsHit, seamGatesPassed } }
 * @example
 *   const result = await orchestrate('methodologies/composition-saas-analytics-dashboard', {
 *     productName: 'AcmeCRM',
 *     dashboardBrief: 'A customer-health analytics dashboard for CSMs: usage trends, cohort retention, churn alerts, CSV export',
 *     businessGoal: 'increase B2B retention by 10% through better health insights',
 *     customerSegments: ['enterprise CSMs', 'mid-market CSMs'],
 *     designPartners: [{ customerId: 'cust-1', name: 'Northwind', segment: 'enterprise CSMs' }],
 *   });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../../specializations/common-utilities/routed-gate-combinators.js';
import {
  forcesAnalysisTask,
  jobStoryGenerationTask,
} from '../jobs-to-be-done/jobs-to-be-done.js';
import {
  actorIdentificationTask,
  impactAnalysisTask,
  deliverableGenerationTask,
  prioritizationTask,
} from '../impact-mapping/impact-mapping.js';
import {
  pairProgrammingTask,
  tddPracticeTask,
  continuousIntegrationTask,
  refactoringTask,
} from '../extreme-programming/xp-process.js';

// NOTE on the Kanban seam: kanban/kanban.js and extreme-programming/xp-process.js
// BOTH register a global task id `retrospective`, so importing both modules into
// one process throws a DuplicateTaskIdError at load. The XP task constants are
// imported directly (above); the three Kanban stages (WIP limits, pull system,
// flow metrics) are therefore re-expressed here as own csd.* tasks that mirror
// kanban.js's semantics — the same treatment the design gives Spec-Kit. No
// kanban.js import means no id collision, and the module loads cleanly.

const PROCESS_ID = 'methodologies/composition-saas-analytics-dashboard';

// Kanban Dev-column WIP limit — the concurrency bound for the P4 card fan-out.
const DEV_WIP_LIMIT = 3;

// ---------------------------------------------------------------------------
// P1 — own JTBD interview synthesis (fanned out across customer segments)
// ---------------------------------------------------------------------------

export const interviewSynthesisTask = defineTask('csd.interview-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: `JTBD interview synthesis: segment ${args.segment}`,
  agent: {
    name: 'jtbd-interviewer',
    prompt: {
      role: 'Jobs-to-be-Done interviewer',
      task: `Synthesize the ${args.segment} customer interviews for ${args.productName} into candidate jobs`,
      context: args,
      instructions: [
        'Synthesize the raw interviews for this ONE segment into candidate jobs the analytics dashboard would be hired to do.',
        'Each candidate job is a real, solution-agnostic job (stable across solutions), not a dashboard feature in disguise.',
        'For each job capture the situation-cited forces (push/pull/anxiety/habit) with the interview quote or note they came from.',
        'Write the segment interview notes to disk and return notesPath; give every job a stable jobId.',
      ],
      outputFormat:
        'JSON with segment string, candidateJobs array [{jobId, jobStatement, forces {push, pull, anxiety, habit}}], notesPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['segment', 'candidateJobs', 'notesPath'],
      properties: {
        segment: { type: 'string' },
        candidateJobs: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['jobId', 'jobStatement', 'forces'],
            properties: {
              jobId: { type: 'string' },
              jobStatement: { type: 'string' },
              forces: { type: 'object' },
            },
          },
        },
        notesPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csd', 'jtbd', 'interview-synthesis'],
}));

// ---------------------------------------------------------------------------
// P3 — own Spec-Kit stages (Spec-Kit exports only `process`, no task constants)
// ---------------------------------------------------------------------------

export const constitutionTask = defineTask('csd.constitution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Spec-Kit constitution: ${args.productName} dashboard`,
  agent: {
    name: 'spec-kit-constitution-author',
    prompt: {
      role: 'Spec-Kit constitution author',
      task: `Author the analytics-dashboard constitution for ${args.productName}`,
      context: args,
      instructions: [
        'Author the Spec-Kit constitution: the non-negotiable principles every dashboard view must honor.',
        'Encode the performanceBudget as measured non-functional targets (dashboard load, query latency, data freshness).',
        'Add UX, role-based access-control, and WCAG AA accessibility principles suited to a B2B analytics surface.',
        'Write the constitution to disk and return constitutionPath plus the machine-checkable nonFunctionalTargets.',
      ],
      outputFormat:
        'JSON with constitutionPath string, principles array, nonFunctionalTargets {dashboardLoadMs, queryMs, dataLatencyMin}',
    },
    outputSchema: {
      type: 'object',
      required: ['constitutionPath', 'principles', 'nonFunctionalTargets'],
      properties: {
        constitutionPath: { type: 'string' },
        principles: { type: 'array', minItems: 1 },
        nonFunctionalTargets: {
          type: 'object',
          required: ['dashboardLoadMs', 'queryMs', 'dataLatencyMin'],
          properties: {
            dashboardLoadMs: { type: 'number' },
            queryMs: { type: 'number' },
            dataLatencyMin: { type: 'number' },
          },
        },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csd', 'spec-kit', 'constitution'],
}));

export const viewSpecTask = defineTask('csd.view-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dashboard view spec: branch ${args.branch.branchId}`,
  agent: {
    name: 'spec-kit-view-author',
    prompt: {
      role: 'Spec-Kit dashboard-view author',
      task: `Specify the dashboard view for impact branch ${args.branch.branchId} (${args.branch.impact.description})`,
      context: args,
      instructions: [
        "Specify ONE dashboard view serving this impact branch: layout, the metrics shown, drill-downs, and filters.",
        'Trace the view to the job stories it addresses; keep it inside the constitution principles.',
        'Emit measurable acceptanceAssertions: every assertion has an observable pass/fail predicate a RENDERED dashboard can be checked against (a value, threshold, or visible element), with a stable assertionId.',
        'Write the view spec to disk and return viewSpecPath.',
      ],
      outputFormat:
        'JSON with branchId, viewId, viewSpecPath, metrics array, acceptanceAssertions array [{assertionId, statement, measurable, jobStoryRefs}]',
    },
    outputSchema: {
      type: 'object',
      required: ['branchId', 'viewId', 'viewSpecPath', 'acceptanceAssertions'],
      properties: {
        branchId: { type: 'string' },
        viewId: { type: 'string' },
        viewSpecPath: { type: 'string' },
        metrics: { type: 'array' },
        acceptanceAssertions: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['assertionId', 'statement', 'measurable'],
            properties: {
              assertionId: { type: 'string' },
              statement: { type: 'string' },
              measurable: { type: 'boolean' },
              jobStoryRefs: { type: 'array' },
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
  labels: ['agent', 'csd', 'spec-kit', 'view-spec'],
}));

export const dataContractTask = defineTask('csd.data-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data contract: view ${args.viewId}`,
  agent: {
    name: 'data-contract-author',
    prompt: {
      role: 'Data-contract author',
      task: `Author the data model + API contract for dashboard view ${args.viewId}`,
      context: args,
      instructions: [
        'Author the data model (entities, fields, types) and the API contract (endpoints, request/response schemas) backing this view.',
        'The contract MUST cover every metric the view references — an uncovered metric is a spec defect.',
        'Write a machine-checkable contract file (JSON Schema / OpenAPI-style) to disk so the Spec-Kit contract checks can validate it; return dataContractPath.',
      ],
      outputFormat:
        'JSON with viewId, dataContractPath, entities array, apiEndpoints array',
    },
    outputSchema: {
      type: 'object',
      required: ['viewId', 'dataContractPath', 'entities', 'apiEndpoints'],
      properties: {
        viewId: { type: 'string' },
        dataContractPath: { type: 'string' },
        entities: { type: 'array' },
        apiEndpoints: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csd', 'spec-kit', 'data-contract'],
}));

export const specChecklistTask = defineTask('csd.spec-checklist', (args, taskCtx) => ({
  kind: 'agent',
  title: `Spec-Kit checklist audit: ${args.productName}`,
  agent: {
    name: 'spec-kit-checklist-auditor',
    prompt: {
      role: 'Spec-Kit quality-checklist auditor',
      task: 'Validate the per-view specs against the Spec-Kit quality checklist',
      context: args,
      instructions: [
        'Validate every view spec against the Spec-Kit quality checklist: all job stories addressed, performance targets present, security/RBAC covered, accessibility covered, edge cases named.',
        'Report the checklist as pass/fail items; passed is true ONLY when every item passes.',
        'Do not soften a fail — a missing job-story mapping or absent perf target is a FAIL item.',
      ],
      outputFormat:
        'JSON with passed boolean, items array [{item, status, note}]',
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'items'],
      properties: {
        passed: { type: 'boolean' },
        items: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csd', 'spec-kit', 'checklist'],
}));

// ---------------------------------------------------------------------------
// G4 producer — executed spec-conformance report (the release-gate artifact)
// ---------------------------------------------------------------------------

export const specConformanceRunTask = defineTask('csd.spec-conformance-run', (args, taskCtx) => ({
  kind: 'agent',
  title: `Executed spec-conformance run: ${args.productName} dashboard`,
  agent: {
    name: 'spec-conformance-executor',
    prompt: {
      role: 'Spec-conformance executor',
      task: 'EXECUTE the rendered dashboard against every Spec-Kit acceptance assertion and re-run the TDD suite',
      context: args,
      instructions: [
        'EXECUTE each dashboard view yourself: render it, capture the rendered value / screenshot-derived measurement / API response for each acceptanceAssertion.',
        'Compare every rendered proof to its assertion predicate; an assertion mapped only to a skipped or unexecuted check is a FAIL, never a pass.',
        'Measure dashboard load and query latency and compare to the constitution non-functional budgets — numbers, not claims.',
        're-run the full XP/TDD suite and paste the executed command output excerpt; a report without executed output is invalid.',
        'Write the conformance report to reportPath; passed is true ONLY when totals.failed === 0 AND totals.unrendered === 0.',
      ],
      outputFormat:
        'JSON with reportPath, passed boolean, renderedEvidence array [{viewId, assertionId, status, renderedProof}], totals {assertions, passed, failed, unrendered}, executedOutputExcerpt string',
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'passed', 'renderedEvidence', 'totals', 'executedOutputExcerpt'],
      properties: {
        reportPath: { type: 'string' },
        passed: { type: 'boolean' },
        renderedEvidence: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['viewId', 'assertionId', 'status', 'renderedProof'],
            properties: {
              viewId: { type: 'string' },
              assertionId: { type: 'string' },
              status: { type: 'string' },
              renderedProof: { type: 'string' },
            },
          },
        },
        totals: {
          type: 'object',
          required: ['assertions', 'passed', 'failed', 'unrendered'],
          properties: {
            assertions: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' },
            unrendered: { type: 'number' },
          },
        },
        executedOutputExcerpt: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csd', 'spec-kit', 'conformance'],
}));

// ---------------------------------------------------------------------------
// P4 — own Kanban stages (re-expressed to avoid the kanban.js/xp id collision)
// ---------------------------------------------------------------------------

export const wipSetupTask = defineTask('csd.wip-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Kanban board + WIP setup: ${args.productName}`,
  agent: {
    name: 'kanban-flow-manager',
    prompt: {
      role: 'Kanban flow manager',
      task: 'Set up the dashboard delivery board and enforce WIP limits',
      context: args,
      instructions: [
        'Confirm the board columns (Backlog -> Design -> Dev -> Code Review -> QA -> Done) and the Dev-column WIP limit.',
        'Report the current WIP status per column and any capacity signals or bottlenecks.',
      ],
      outputFormat: 'JSON with wipStatus object, bottlenecks array, capacitySignals array',
    },
    outputSchema: {
      type: 'object',
      required: ['wipStatus', 'bottlenecks', 'capacitySignals'],
      properties: {
        wipStatus: { type: 'object' },
        bottlenecks: { type: 'array' },
        capacitySignals: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csd', 'kanban', 'wip-limits'],
}));

export const pullCardsTask = defineTask('csd.pull-cards', (args, taskCtx) => ({
  kind: 'agent',
  title: `Pull ready cards under WIP=${args.wipLimit}: ${args.productName}`,
  agent: {
    name: 'kanban-flow-manager',
    prompt: {
      role: 'Kanban pull-system operator',
      task: 'Pull ready cards into Dev under the WIP limit (pull, not push)',
      context: args,
      instructions: [
        'Pull only as many ready cards as the Dev WIP limit allows — never exceed it.',
        'Cards are pulled by capacity, not pushed by schedule; report the pulled set and what remains queued.',
      ],
      outputFormat: 'JSON with pulled array, queued array',
    },
    outputSchema: {
      type: 'object',
      required: ['pulled', 'queued'],
      properties: {
        pulled: { type: 'array' },
        queued: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csd', 'kanban', 'pull-system'],
}));

export const flowMetricsTask = defineTask('csd.flow-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Flow metrics: ${args.productName} dashboard delivery`,
  agent: {
    name: 'flow-metrics-analyst',
    prompt: {
      role: 'Kanban flow-metrics analyst',
      task: 'Compute cycle time, lead time, and throughput; name the bottlenecks',
      context: args,
      instructions: [
        'Compute cycle time (days), lead time (days), and throughput (per week) from the implemented cards.',
        'Name the bottleneck columns with evidence (where cards aged), not impressions.',
      ],
      outputFormat: 'JSON with cycleTimeDays, leadTimeDays, throughputPerWeek, bottlenecks array',
    },
    outputSchema: {
      type: 'object',
      required: ['cycleTimeDays', 'leadTimeDays', 'throughputPerWeek', 'bottlenecks'],
      properties: {
        cycleTimeDays: { type: 'number' },
        leadTimeDays: { type: 'number' },
        throughputPerWeek: { type: 'number' },
        bottlenecks: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csd', 'kanban', 'flow-metrics'],
}));

// ---------------------------------------------------------------------------
// P5 — guarded beta-rollout executor (runs ONLY when beta approved === true)
// ---------------------------------------------------------------------------

export const betaRolloutTask = defineTask('csd.beta-rollout', (args, taskCtx) => ({
  kind: 'agent',
  title: `Beta rollout to design partners: ${args.productName}`,
  agent: {
    name: 'beta-rollout-operator',
    prompt: {
      role: 'Beta rollout operator',
      task: `Send beta invitations and grant scoped dashboard access to the approved design-partner customers for ${args.productName}`,
      context: args,
      instructions: [
        'Send beta invitations ONLY to the named design-partner customers in the approved scope; do not invite anyone outside it.',
        'Grant scoped dashboard access exactly as approved (no broader grant than the response authorizes).',
        'Record every invited customer and every access grant with its produced artifact path.',
      ],
      outputFormat:
        'JSON with invitedCustomers array, accessGranted array, artifacts array',
    },
    outputSchema: {
      type: 'object',
      required: ['invitedCustomers', 'accessGranted', 'artifacts'],
      properties: {
        invitedCustomers: { type: 'array' },
        accessGranted: { type: 'array' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csd', 'beta-rollout', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P6 — guarded GA-release executor (runs ONLY when GA approved === true)
// ---------------------------------------------------------------------------

export const gaReleaseTask = defineTask('csd.ga-release', (args, taskCtx) => ({
  kind: 'agent',
  title: `GA release: ${args.productName} dashboard`,
  agent: {
    name: 'release-engineer',
    prompt: {
      role: 'Release engineer',
      task: `Release the ${args.productName} analytics dashboard to general availability across all tenants`,
      context: args,
      instructions: [
        'Perform the GA release steps recorded in the approved plan exactly as approved; deviations require going back through the breakpoint, not improvisation.',
        'Write release notes summarizing the conformance evidence, beta outcomes, and flow metrics.',
        'Record every produced artifact path.',
      ],
      outputFormat: 'JSON with released boolean, releaseNotes string, artifacts array',
    },
    outputSchema: {
      type: 'object',
      required: ['released', 'releaseNotes', 'artifacts'],
      properties: {
        released: { type: 'boolean' },
        releaseNotes: { type: 'string' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csd', 'ga-release', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P7 — whole-composition retrospective (methodology seams as topics)
// ---------------------------------------------------------------------------

export const retroTask = defineTask('csd.retro', (args, taskCtx) => ({
  kind: 'agent',
  title: `Whole-composition retro: ${args.productName} dashboard`,
  agent: {
    name: 'composition-retrospective-facilitator',
    prompt: {
      role: 'Composition retrospective facilitator',
      task: 'Run a whole-composition retrospective treating each methodology seam as a first-class topic',
      context: args,
      instructions: [
        'Treat each seam (JTBD -> Impact Mapping -> Spec-Kit -> Kanban/XP -> release) as a first-class retro topic: where did the handoff leak?',
        'Ground findings in the conformance evidence, flow metrics, and gate attempt counts — not impressions.',
        'Actions must be concrete and owner-assigned.',
      ],
      outputFormat: 'JSON with wentWell array, couldImprove array, actions array',
    },
    outputSchema: {
      type: 'object',
      required: ['wentWell', 'couldImprove', 'actions'],
      properties: {
        wentWell: { type: 'array' },
        couldImprove: { type: 'array' },
        actions: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csd', 'retro'],
}));

// ---------------------------------------------------------------------------
// helpers (pure, no fallbacks)
// ---------------------------------------------------------------------------

/**
 * Validate inputs before any orchestration. No fallbacks: bad inputs throw.
 */
function validateInputs(inputs) {
  const { productName, dashboardBrief, businessGoal, performanceBudget, maxFixAttempts, maxInterviews } = inputs;

  for (const [name, value] of [
    ['productName', productName],
    ['dashboardBrief', dashboardBrief],
    ['businessGoal', businessGoal],
  ]) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`composition-saas-analytics-dashboard: ${name} is required (got ${JSON.stringify(value)})`);
    }
  }

  for (const [name, value] of [
    ['performanceBudget.dashboardLoadMs', performanceBudget.dashboardLoadMs],
    ['performanceBudget.queryMs', performanceBudget.queryMs],
    ['performanceBudget.dataLatencyMin', performanceBudget.dataLatencyMin],
  ]) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      throw new Error(`composition-saas-analytics-dashboard: ${name} must be a positive number (got ${JSON.stringify(value)})`);
    }
  }

  if (!Number.isInteger(maxFixAttempts) || maxFixAttempts < 0) {
    throw new Error(`composition-saas-analytics-dashboard: maxFixAttempts must be a non-negative integer (got ${JSON.stringify(maxFixAttempts)})`);
  }
  if (!Number.isInteger(maxInterviews) || maxInterviews < 1) {
    throw new Error(`composition-saas-analytics-dashboard: maxInterviews must be a positive integer (got ${JSON.stringify(maxInterviews)})`);
  }
}

/**
 * Standard policy-gate provenance record (mirrors composition-startup-mvp).
 */
function breakpointProvenance(breakpointId, expert, result) {
  return {
    approved: result.approved === true,
    autoApproved: result.response?.autoApproved === true,
    breakpointId,
    expert,
    response: result.response ?? null,
  };
}

/**
 * Guard: every in-scope acceptanceAssertion must have an executed rendered
 * check in the conformance report. A missing check is a planning bug (the
 * conformance run under-covered the specs), not a schedulable state — throw.
 */
function assertConformanceComplete(specs, conformance) {
  const checked = new Set((conformance.renderedEvidence ?? []).map((e) => e.assertionId));
  const missing = [];
  for (const view of specs.viewSpecs) {
    for (const assertion of view.acceptanceAssertions) {
      if (!checked.has(assertion.assertionId)) {
        missing.push({ viewId: view.viewId, assertionId: assertion.assertionId });
      }
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `composition-saas-analytics-dashboard: conformance run left ${missing.length} in-scope assertion(s) without an executed rendered check ` +
      `(${JSON.stringify(missing)}) — every acceptance assertion must be executed, not skipped`
    );
  }
}

// ---------------------------------------------------------------------------
// process — P0..P7
// ---------------------------------------------------------------------------

/**
 * SaaS analytics-dashboard composition: JTBD discovery (parallel interview
 * synthesis) -> Impact Mapping (goal -> deliverable ladder) -> Spec-Kit
 * (per-impact-branch parallel view/data-contract specs + measurable
 * assertions) -> Kanban-flowed XP (TDD pairs, CI; WIP-bounded parallel) ->
 * executed spec-conformance release gate -> policy-gated beta rollout ->
 * policy-gated GA. Adversarial executed-evidence gate at every methodology
 * seam; two policy-gated actions via routed breakpoints; kip recall/assert.
 *
 * @param {object} inputs - Process inputs (see @inputs)
 * @param {object} ctx - Orchestration context
 * @returns {Promise<object>} Result (see @outputs)
 */
export async function process(inputs, ctx) {
  const {
    productName,
    dashboardBrief,
    businessGoal,
    customerSegments,
    designPartners = [],
    performanceBudget = { dashboardLoadMs: 3000, queryMs: 1000, dataLatencyMin: 5 },
    maxFixAttempts = 2,
    maxInterviews = 5,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs ?? {};

  validateInputs({ productName, dashboardBrief, businessGoal, performanceBudget, maxFixAttempts, maxInterviews });

  // Segments: use the provided list, else a single derived segment. A default
  // value is not a fallback — it is an explicit documented starting point.
  const segments = Array.isArray(customerSegments) && customerSegments.length > 0
    ? customerSegments
    : [`${productName} primary users`];

  const breakpointsHit = [];
  const artifacts = [];
  const seamGatesPassed = [];

  // -------------------------------------------------------------------------
  // P0 — kip recall (methodology-composition + saas-product facts)
  // -------------------------------------------------------------------------
  let kipInsights = [];
  if (kipEnabled) {
    const recall = await kipRecall(ctx, {
      kipDir,
      topic: `saas-analytics-dashboard composition seams: JTBD->ImpactMap->Spec-Kit->Kanban/XP handoffs and dashboard conformance for ${productName} toward ${businessGoal}`,
      kipModel,
      kind: 'methodology-composition',
    });
    kipInsights = recall.insights ?? [];
  }

  // -------------------------------------------------------------------------
  // P1 — JTBD discovery: parallel interview synthesis, then forces + stories
  // -------------------------------------------------------------------------
  const interviewSegments = segments.slice(0, maxInterviews);
  const interviewResults = await ctx.parallel.all(
    interviewSegments.map((segment) => () =>
      ctx.task(interviewSynthesisTask, {
        productName,
        segment,
        dashboardBrief,
        kipInsights,
      })
    )
  );
  for (const r of interviewResults) {
    artifacts.push(r.notesPath);
  }

  // Consolidate candidate jobs across segments; imported forcesAnalysisTask and
  // jobStoryGenerationTask elaborate each job. Jobs are elaborated in order —
  // never speculatively co-scheduled with downstream phases.
  const candidateJobs = interviewResults.flatMap((r) =>
    r.candidateJobs.map((job) => ({ ...job, segment: r.segment }))
  );

  const jobs = [];
  for (const candidate of candidateJobs) {
    const jobRef = { id: candidate.jobId, name: candidate.jobStatement };
    const forcesResult = await ctx.task(forcesAnalysisTask, {
      projectName: productName,
      job: jobRef,
      context: dashboardBrief,
      researchData: { segment: candidate.segment, forces: candidate.forces },
    });
    const storyResult = await ctx.task(jobStoryGenerationTask, {
      projectName: productName,
      job: jobRef,
      forces: forcesResult,
      context: dashboardBrief,
    });
    jobs.push({
      jobId: candidate.jobId,
      jobStatement: candidate.jobStatement,
      forces: {
        push: forcesResult.pushForces,
        pull: forcesResult.pullForces,
        anxiety: forcesResult.anxietyForces,
        habit: forcesResult.habitForces,
      },
      jobStories: storyResult.stories.map((s, i) => ({
        jobStoryId: `${candidate.jobId}-story-${i + 1}`,
        situation: s.when,
        motivation: s.iWantTo,
        expectedOutcome: s.soICan,
      })),
    });
  }
  const jtbd = {
    reportPath: `artifacts/${PROCESS_ID}/jtbd-report.md`,
    jobs,
  };

  // -------------------------------------------------------------------------
  // G1 — JTBD synthesis seam gate (executed evidence: re-derive a job story)
  // -------------------------------------------------------------------------
  const g1 = await adversarialGate(ctx, {
    gateId: 'csd.jtbd-synthesis',
    artifact: {
      path: jtbd.reportPath,
      description: 'JTBD report: candidate jobs, forces, and job stories synthesized from interviews',
    },
    critics: [
      {
        name: 'job-authenticity-critic',
        role: 'JTBD authenticity auditor',
        focus: 'job statements are solution-agnostic real jobs, not feature requests in disguise',
      },
      {
        name: 'forces-evidence-critic',
        role: 'Forces evidence auditor',
        focus: 'each force is cited to interview evidence; no invented forces',
      },
      {
        name: 'job-story-trace-critic',
        role: 'Job-story traceability auditor',
        focus: 'every job story traces to a job; re-derive at least one story independently and diff against the report',
      },
    ],
    ironLaw: [
      'Re-read the interview artifacts yourself; cite file:line for every force.',
      'Independently re-derive at least one job story and diff against the report.',
    ],
    maxFixAttempts,
    fixer: {},
    context: { jobCount: jobs.length, notesPaths: interviewResults.map((r) => r.notesPath) },
  });
  if (g1.escalated === true) breakpointsHit.push('csd.jtbd-synthesis.gate-escalation');
  if (g1.passed !== true) {
    return earlyExit(ctx, {
      stage: 'jtbd-synthesis-gate',
      breakpointsHit,
      seamGatesPassed,
      artifacts,
      jtbd,
    });
  }
  seamGatesPassed.push('csd.jtbd-synthesis');

  // -------------------------------------------------------------------------
  // P2 — Impact Mapping: goal -> actor -> impact -> deliverable ladder
  // -------------------------------------------------------------------------
  const goal = { statement: businessGoal, jobs: jobs.map((j) => ({ jobId: j.jobId, jobStatement: j.jobStatement })) };

  const actorIdentification = await ctx.task(actorIdentificationTask, {
    goal,
    knownActors: [],
    context: { productName, dashboardBrief, jobs },
  });
  const actors = actorIdentification.actors;

  const impactResults = await ctx.parallel.all(
    actors.map((actor) => () =>
      ctx.task(impactAnalysisTask, { goal, actor, context: { productName, jobs } })
    )
  );
  const allImpacts = impactResults.flatMap((r) => r.impacts);

  const deliverableResults = await ctx.parallel.all(
    allImpacts.map((impact) => () => {
      const actor = actors.find((a) => a.id === impact.actorId);
      return ctx.task(deliverableGenerationTask, {
        goal,
        actor,
        impact,
        context: { productName, dashboardBrief },
        constraints: { surface: 'analytics-dashboard' },
      });
    })
  );
  const allDeliverables = deliverableResults.flatMap((r) => r.deliverables);

  const prioritization = await ctx.task(prioritizationTask, {
    goal,
    actors,
    impacts: allImpacts,
    deliverables: allDeliverables,
    constraints: { surface: 'analytics-dashboard' },
    timeframe: 'one release',
  });
  const priorityById = new Map(
    (prioritization.prioritizedDeliverables ?? []).map((d) => [
      d.deliverable.id,
      d.priorityTier ?? d.priorityScore,
    ]),
  );

  const branches = allImpacts.map((impact, i) => {
    const actor = actors.find((a) => a.id === impact.actorId);
    const deliverables = allDeliverables
      .filter((d) => d.impactId === impact.id)
      .map((d) => ({ deliverableId: d.id, name: d.title, priority: priorityById.get(d.id) }));
    return {
      branchId: `branch-${i + 1}`,
      actor,
      impact,
      deliverables,
    };
  });
  const impactMap = {
    mapPath: `artifacts/${PROCESS_ID}/impact-map.md`,
    goal: businessGoal,
    branches,
  };

  // -------------------------------------------------------------------------
  // G2 — Impact-map seam gate (executed evidence: reconstruct the ladder)
  // -------------------------------------------------------------------------
  const g2 = await adversarialGate(ctx, {
    gateId: 'csd.impact-map',
    artifact: {
      path: impactMap.mapPath,
      description: 'Impact map: goal -> actor -> impact -> deliverable branches',
    },
    critics: [
      {
        name: 'ladder-integrity-critic',
        role: 'Ladder-integrity auditor',
        focus: 'every deliverable ladders to an impact and the root goal; no orphans',
      },
      {
        name: 'goal-coverage-critic',
        role: 'Goal-coverage auditor',
        focus: 'the business goal is actually served by at least one branch; priorities are justified',
      },
    ],
    ironLaw: [
      'Reconstruct the goal->actor->impact->deliverable ladder for each branch; flag any break.',
    ],
    maxFixAttempts,
    fixer: {},
    context: { goal: businessGoal, branchCount: branches.length },
  });
  if (g2.escalated === true) breakpointsHit.push('csd.impact-map.gate-escalation');
  if (g2.passed !== true) {
    return earlyExit(ctx, {
      stage: 'impact-map-gate',
      breakpointsHit,
      seamGatesPassed,
      artifacts,
      jtbd,
      impactMap,
    });
  }
  seamGatesPassed.push('csd.impact-map');

  // -------------------------------------------------------------------------
  // P3 — Spec-Kit: constitution, then PARALLEL per-impact-branch elaboration
  // -------------------------------------------------------------------------
  const jobStories = jobs.flatMap((j) => j.jobStories);

  const constitution = await ctx.task(constitutionTask, {
    productName,
    dashboardBrief,
    businessGoal,
    performanceBudget,
  });
  artifacts.push(constitution.constitutionPath);

  // Per-impact-branch elaboration: for EACH impact branch, author the view spec
  // and its data contract concurrently across branches.
  const branchSpecs = await ctx.parallel.all(
    impactMap.branches.map((branch) => async () => {
      const viewSpec = await ctx.task(viewSpecTask, {
        productName,
        branch,
        jobStories,
        performanceBudget,
        constitutionPath: constitution.constitutionPath,
      });
      const dataContract = await ctx.task(dataContractTask, {
        productName,
        branch,
        viewId: viewSpec.viewId,
        viewSpecPath: viewSpec.viewSpecPath,
        metrics: viewSpec.metrics ?? [],
      });
      return {
        branchId: branch.branchId,
        viewId: viewSpec.viewId,
        viewSpecPath: viewSpec.viewSpecPath,
        dataContractPath: dataContract.dataContractPath,
        acceptanceAssertions: viewSpec.acceptanceAssertions,
        entities: dataContract.entities,
        apiEndpoints: dataContract.apiEndpoints,
      };
    })
  );
  for (const vs of branchSpecs) {
    artifacts.push(vs.viewSpecPath, vs.dataContractPath);
  }

  const checklist = await ctx.task(specChecklistTask, {
    productName,
    viewSpecs: branchSpecs,
    jobStories,
    performanceBudget,
  });

  const specs = {
    constitutionPath: constitution.constitutionPath,
    viewSpecs: branchSpecs,
    checklist: { passed: checklist.passed === true, items: checklist.items },
  };

  // -------------------------------------------------------------------------
  // G3 — Spec-conformance authoring gate (executed evidence: contract checks)
  // -------------------------------------------------------------------------
  const g3 = await adversarialGate(ctx, {
    gateId: 'csd.spec-authoring',
    artifact: {
      path: specs.constitutionPath,
      description: 'Spec-Kit artifacts: constitution + per-view specs + data contracts + measurable assertions',
    },
    critics: [
      {
        name: 'assertion-measurability-critic',
        role: 'Assertion-measurability auditor',
        focus: 'every acceptanceAssertion has an observable pass/fail predicate a rendered dashboard can be checked against',
      },
      {
        name: 'jobstory-coverage-critic',
        role: 'Job-story coverage auditor',
        focus: 'every job story maps to at least one view assertion',
      },
      {
        name: 'data-contract-critic',
        role: 'Data-contract validator',
        focus: 'data contracts cover every metric a view references; run the contract validator and paste output',
      },
    ],
    ironLaw: [
      'Run the Spec-Kit contract checks over the data-contract files; a spec whose assertions are unmeasurable is a FAIL.',
      'Cite validator output.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      viewSpecs: specs.viewSpecs.map((v) => ({ viewId: v.viewId, viewSpecPath: v.viewSpecPath, dataContractPath: v.dataContractPath })),
      jobStoryCount: jobStories.length,
      checklistPassed: specs.checklist.passed,
    },
  });
  if (g3.escalated === true) breakpointsHit.push('csd.spec-authoring.gate-escalation');
  if (g3.passed !== true) {
    return earlyExit(ctx, {
      stage: 'spec-authoring-gate',
      breakpointsHit,
      seamGatesPassed,
      artifacts,
      jtbd,
      impactMap,
      specs,
    });
  }
  seamGatesPassed.push('csd.spec-authoring');

  // -------------------------------------------------------------------------
  // P4 — Kanban flow + XP implementation (TDD pairs, CI; WIP-bounded parallel)
  // -------------------------------------------------------------------------
  const board = {
    columns: ['Backlog', 'Design', 'Dev', 'Code Review', 'QA', 'Done'],
    wipLimits: { Dev: DEV_WIP_LIMIT },
  };

  const wipStatus = await ctx.task(wipSetupTask, {
    productName,
    board,
    wipLimit: DEV_WIP_LIMIT,
    cardCount: specs.viewSpecs.length,
  });

  // Each view spec becomes a card; ready cards are pulled and implemented under
  // the Dev WIP limit — waves of at most DEV_WIP_LIMIT run concurrently.
  const cards = specs.viewSpecs.map((vs, i) => ({
    cardId: `card-${i + 1}`,
    viewId: vs.viewId,
    branchId: vs.branchId,
    viewSpecPath: vs.viewSpecPath,
    dataContractPath: vs.dataContractPath,
    acceptanceAssertions: vs.acceptanceAssertions,
  }));

  const storiesImplemented = [];
  for (let offset = 0; offset < cards.length; offset += DEV_WIP_LIMIT) {
    const wave = cards.slice(offset, offset + DEV_WIP_LIMIT);
    await ctx.task(pullCardsTask, {
      productName,
      wipLimit: DEV_WIP_LIMIT,
      wipStatus,
      readyCards: wave.map((c) => c.cardId),
    });
    const waveResults = await ctx.parallel.all(
      wave.map((card) => async () => {
        const pairing = await ctx.task(pairProgrammingTask, {
          projectName: productName,
          iterationNumber: 1,
          day: 1,
          pairs: [{ card: card.cardId, viewId: card.viewId }],
          tasks: [{ id: card.cardId, description: `Implement dashboard view ${card.viewId}` }],
        });
        const tdd = await ctx.task(tddPracticeTask, {
          projectName: productName,
          iterationNumber: 1,
          day: 1,
          tasks: [{ id: card.cardId, viewId: card.viewId, acceptanceAssertions: card.acceptanceAssertions }],
          existingTests: [],
        });
        const ci = await ctx.task(continuousIntegrationTask, {
          projectName: productName,
          iterationNumber: 1,
          day: 1,
          commits: [{ card: card.cardId }],
          tests: tdd.tests,
        });
        await ctx.task(refactoringTask, {
          projectName: productName,
          iterationNumber: 1,
          day: 1,
          codeSmells: tdd.codeSmells,
          recentChanges: [{ card: card.cardId }],
        });
        return {
          storyId: card.cardId,
          viewId: card.viewId,
          pairing: pairing.pairSessions,
          exampleTestMap: card.acceptanceAssertions.map((a) => ({ assertionId: a.assertionId, testRef: `${card.viewId}:${a.assertionId}` })),
          ciRunId: ci.builds[0]?.buildId,
          ciStatus: ci.buildStatus,
        };
      })
    );
    storiesImplemented.push(...waveResults);
  }

  const flow = await ctx.task(flowMetricsTask, {
    productName,
    board,
    storiesImplemented,
  });
  const flowMetrics = {
    cycleTimeDays: flow.cycleTimeDays,
    leadTimeDays: flow.leadTimeDays,
    throughputPerWeek: flow.throughputPerWeek,
    bottlenecks: flow.bottlenecks,
  };

  const implementation = { board, storiesImplemented, flowMetrics };

  // -------------------------------------------------------------------------
  // G4 — executed spec-conformance RELEASE gate (rendered dashboard vs specs).
  //      MUST pass before any beta invite is raised.
  // -------------------------------------------------------------------------
  const conformanceRun = await ctx.task(specConformanceRunTask, {
    productName,
    viewSpecs: specs.viewSpecs,
    constitutionPath: specs.constitutionPath,
    performanceBudget,
    implementation,
  });
  artifacts.push(conformanceRun.reportPath);

  const conformance = {
    reportPath: conformanceRun.reportPath,
    passed: conformanceRun.passed === true,
    renderedEvidence: conformanceRun.renderedEvidence,
    totals: conformanceRun.totals,
  };
  // Coverage is a planning invariant: every in-scope assertion must be executed.
  assertConformanceComplete(specs, conformance);

  const g4 = await adversarialGate(ctx, {
    gateId: 'csd.spec-conformance',
    artifact: {
      path: conformance.reportPath,
      description: 'Executed conformance report: rendered dashboard vs each Spec-Kit acceptance assertion + re-run TDD suite',
    },
    critics: [
      {
        name: 'rendered-conformance-critic',
        role: 'Rendered-conformance auditor',
        focus: 'execute each view; the RENDERED value/measurement satisfies its acceptanceAssertion predicate; an assertion mapped only to a skipped/unexecuted check is a FAIL',
      },
      {
        name: 'constitution-budget-critic',
        role: 'Non-functional budget auditor',
        focus: 'measured dashboard load and query latency meet the constitution budgets (numbers, not claims)',
      },
      {
        name: 'tdd-evidence-critic',
        role: 'TDD forensics reviewer',
        focus: 'the acceptanceAssertion->test map is real behavioral tests; re-run the suite and diff totals',
      },
    ],
    ironLaw: [
      'Do NOT trust the report: render/execute the dashboard yourself and compare rendered output to each spec assertion.',
      'Every in-scope acceptanceAssertion must map to an EXECUTED conformance check with rendered proof; skipped/unexecuted = FAIL.',
      'Cite executed command output and measured numbers for every claim.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      totals: conformance.totals,
      renderedEvidence: conformance.renderedEvidence,
      performanceBudget,
      constitutionPath: specs.constitutionPath,
    },
  });
  if (g4.escalated === true) breakpointsHit.push('csd.spec-conformance.gate-escalation');

  const conformancePassed = conformance.passed === true && g4.passed === true;
  if (!conformancePassed) {
    return {
      success: false,
      jtbd,
      impactMap,
      specs,
      implementation,
      conformance,
      beta: null,
      ga: null,
      retro: null,
      kipFactsAsserted: 0,
      artifacts,
      metadata: {
        processId: PROCESS_ID,
        runId: ctx.runId,
        breakpointsHit,
        seamGatesPassed,
      },
    };
  }
  seamGatesPassed.push('csd.spec-conformance');

  // -------------------------------------------------------------------------
  // P5 — beta rollout to design partners (policy-gated; guarded executor)
  // -------------------------------------------------------------------------
  const betaResult = await routedBreakpoint(ctx, {
    question: `Conformance passed for ${productName}: send beta invitations and grant scoped dashboard access to the design-partner customers?`,
    conformanceReportPath: conformance.reportPath,
    totals: conformance.totals,
    designPartners,
    accessScope: 'scoped-dashboard-read',
  }, {
    breakpointId: 'beta-customer-invite',
    expert: 'product-owner',
    tags: ['policy-gated', 'csd', 'beta-rollout'],
    strategy: 'single',
  });
  breakpointsHit.push('beta-customer-invite');
  const betaProvenance = breakpointProvenance('beta-customer-invite', 'product-owner', betaResult);

  let beta;
  if (betaProvenance.approved === true) {
    // Guarded executor: betaRolloutTask runs ONLY inside this branch.
    const rollout = await ctx.task(betaRolloutTask, {
      productName,
      designPartners,
      conformance,
      approvedResponse: betaProvenance.response,
      accessScope: 'scoped-dashboard-read',
    });
    artifacts.push(...(rollout.artifacts ?? []));
    beta = {
      ...betaProvenance,
      invitedCustomers: rollout.invitedCustomers,
      accessGranted: rollout.accessGranted,
    };
  } else {
    // Not approved: beta stays a valid non-success record; GA is never reached.
    beta = { ...betaProvenance, invitedCustomers: [], accessGranted: [] };
  }

  // -------------------------------------------------------------------------
  // P6 — general-availability decision (policy-gated; guarded executor).
  //      Only raised once the beta is approved+executed.
  // -------------------------------------------------------------------------
  let ga = null;
  if (beta.approved === true) {
    const gaResult = await routedBreakpoint(ctx, {
      question: `Beta rolled out for ${productName}: release the dashboard to general availability across all tenants?`,
      conformanceReportPath: conformance.reportPath,
      betaOutcome: { invitedCustomers: beta.invitedCustomers, accessGranted: beta.accessGranted },
      flowMetrics,
    }, {
      breakpointId: 'dashboard-ga-release',
      expert: 'head-of-product',
      tags: ['policy-gated', 'csd', 'ga-release'],
      strategy: 'single',
    });
    breakpointsHit.push('dashboard-ga-release');
    const gaProvenance = breakpointProvenance('dashboard-ga-release', 'head-of-product', gaResult);

    if (gaProvenance.approved === true) {
      // Guarded executor: gaReleaseTask runs ONLY inside this branch.
      const released = await ctx.task(gaReleaseTask, {
        productName,
        conformance,
        betaOutcome: { invitedCustomers: beta.invitedCustomers, accessGranted: beta.accessGranted },
        flowMetrics,
        approvedResponse: gaProvenance.response,
      });
      artifacts.push(...(released.artifacts ?? []));
      ga = { ...gaProvenance, released: released.released === true, releaseNotes: released.releaseNotes };
    } else {
      ga = { ...gaProvenance, released: false, releaseNotes: null };
    }
  }

  // -------------------------------------------------------------------------
  // P7 — whole-composition retro + kip assert
  // -------------------------------------------------------------------------
  const retro = await ctx.task(retroTask, {
    productName,
    seams: ['JTBD->ImpactMap', 'ImpactMap->Spec-Kit', 'Spec-Kit->Kanban/XP', 'Kanban/XP->release'],
    conformance,
    flowMetrics,
    provenance: { beta, ga },
    gateAttempts: {
      jtbd: g1.attempts,
      impactMap: g2.attempts,
      specAuthoring: g3.attempts,
      specConformance: g4.attempts,
    },
  });

  let kipFactsAsserted = 0;
  if (kipEnabled) {
    const totalAssertions = specs.viewSpecs.reduce((n, v) => n + v.acceptanceAssertions.length, 0);
    const executedChecks = conformance.renderedEvidence.length;
    const assertResult = await kipAssert(ctx, {
      kipDir,
      kipModel,
      kind: 'methodology-composition',
      facts: [
        {
          subject: 'process:composition-saas-analytics-dashboard',
          predicate: 'seam-handoffs',
          object: 'jtbd->impactMap->specKit->kanbanXp->release',
          props: { jobCount: jobs.length, branchCount: impactMap.branches.length, viewCount: specs.viewSpecs.length },
        },
        {
          subject: 'process:composition-saas-analytics-dashboard',
          predicate: 'conformance-coverage',
          object: `${totalAssertions} assertions -> ${executedChecks} executed rendered checks`,
          props: { gateAttempts: g4.attempts, escalated: g4.escalated === true, failed: conformance.totals.failed },
        },
        {
          subject: 'process:composition-saas-analytics-dashboard',
          predicate: 'flow-metrics',
          object: 'cycleTime/leadTime/throughput',
          props: { bottlenecks: flowMetrics.bottlenecks },
        },
        {
          subject: 'process:composition-saas-analytics-dashboard',
          predicate: 'provenance-summary',
          object: `beta approved:${beta.approved} auto:${beta.autoApproved}; ga approved:${ga?.approved === true} auto:${ga?.autoApproved === true}`,
          props: { released: ga?.released === true },
        },
        {
          subject: 'process:composition-saas-analytics-dashboard',
          predicate: 'observed-seam',
          object: `which methodology seam leaked for ${productName}: unmeasurable assertions, orphan deliverables, or unrendered checks`,
          props: { details: retro.couldImprove },
        },
      ],
    });
    kipFactsAsserted = assertResult.asserted;
  }

  return {
    success:
      conformancePassed &&
      beta.approved === true &&
      ga?.approved === true &&
      ga?.released === true,
    jtbd,
    impactMap,
    specs,
    implementation,
    conformance,
    beta,
    ga,
    retro: { wentWell: retro.wentWell, couldImprove: retro.couldImprove, actions: retro.actions },
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: PROCESS_ID,
      runId: ctx.runId,
      breakpointsHit,
      seamGatesPassed,
    },
  };
}

/**
 * A seam gate failed before the release gate — return an explicit non-success
 * shape. Not a fallback: a failed adversarial gate is a real, reported outcome
 * with nothing downstream ever invoked.
 */
function earlyExit(ctx, { stage, breakpointsHit, seamGatesPassed, artifacts, jtbd = null, impactMap = null, specs = null }) {
  return {
    success: false,
    failedStage: stage,
    jtbd,
    impactMap,
    specs,
    implementation: null,
    conformance: null,
    beta: null,
    ga: null,
    retro: null,
    kipFactsAsserted: 0,
    artifacts,
    metadata: {
      processId: PROCESS_ID,
      runId: ctx.runId,
      breakpointsHit,
      seamGatesPassed,
    },
  };
}
