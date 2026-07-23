/**
 * @process product-management/product-lifecycle-e2e
 * @description Product lifecycle end-to-end — parallel discovery gathering (user-research
 *   synthesis, competitive analysis, metrics baseline) via ctx.parallel, discovery synthesis
 *   into testable hypotheses, PRD authoring, adversarial spec-review gate (testability +
 *   edge-case critics with EXECUTED criteria-to-check traceability evidence), product-lead
 *   spec-signoff, prioritization composing rice-prioritization + moscow-prioritization +
 *   quarterly-roadmap, head-of-product roadmap-commit, build handoff via prd-to-spec,
 *   head-of-product launch-go-no-go, launch execution, and post-launch retro that adjudicates
 *   every discovery hypothesis and asserts launch outcomes into kip. Highest internal-reuse
 *   density: composes the existing product-management point methods and agents by name.
 * @inputs {
 *   initiativeName: string,        // required — the product initiative under management
 *   problemStatement: string,      // required — raw problem statement / opportunity brief
 *   productArea?: string,          // product or product-area name
 *   researchInputs?: string[],     // paths or descriptions of raw user-research material (interviews, surveys, tickets)
 *   competitors?: string[],        // competitor names for the competitive-analysis stage
 *   metricsSources?: string[],     // analytics sources/dashboards for the metrics baseline
 *   targetQuarter?: string,        // roadmap slot target (e.g. '2026-Q4')
 *   maxParallel?: number,          // ctx.parallel.map concurrency (default 3)
 *   maxFixAttempts?: number,       // adversarial-gate fix budget (default 2)
 *   kipEnabled?: boolean,          // recall + assert product-management memory via kip (default true)
 *   kipDir?: string,               // kip store directory (default '.a5c/kip')
 *   kipModel?: string              // model for kip structured paths (default 'sonnet')
 * }
 * @outputs {
 *   success: boolean,              // true only when the PRD passed gate + signoff, the roadmap was committed, and launch was either executed or an explicit no-go was recorded
 *   prdPath: string,
 *   gateResults: object,           // { specReview: { passed, attempts, escalated, issues, evidence } }
 *   hypotheses: array,             // [{ id, statement, outcome: validated|invalidated|inconclusive, evidence }]
 *   prioritization: object,        // { riceScores, moscowBuckets, roadmapSlot }
 *   launch: object,                // { decision: go|no-go|not-reached, executed, launchPlanPath, launchReportPath }
 *   policyDecisions: array,        // [{ actionId, approved, response, autoApproved }] surfaced here AND in the retro's Policy decisions section
 *   kipFactsAsserted: number,
 *   artifacts: array,
 *   metadata: object               // { processId, runId, breakpointsHit, timings }
 * }
 * @policyGatedActions spec-signoff (product-lead), roadmap-commit (head-of-product), launch-go-no-go (head-of-product)
 * @graph
 *   domains: [domain:product-management]
 *   specializations: [specialization:product-management]
 *   workflows: [workflow:product-lifecycle]
 *   roles: [role:product-manager, role:head-of-product, role:product-lead]
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { defineTask } from '@a5c-ai/babysitter-sdk';

import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../common-utilities/routed-gate-combinators.js';

// Deterministic kebab-case for artifact filenames and kip subjects — pure
// string mechanics, no model involved.
function kebab(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Deterministic coverage verifier: the set of acceptance-criteria ids referenced
// by the build handoff (spec items + instrumentation events) must EQUAL the
// PRD's criteria id set. A mismatch throws — no fallback, no silent trim.
function verifyHandoffCoverage(acceptanceCriteria, specItems, instrumentationPlan) {
  const criteriaIds = new Set(acceptanceCriteria.map((c) => String(c.id)));
  const referencedIds = new Set();
  for (const item of specItems) {
    for (const id of item.criteriaIds || []) referencedIds.add(String(id));
  }
  for (const event of instrumentationPlan) {
    for (const id of event.criteriaIds || []) referencedIds.add(String(id));
  }
  const uncovered = [...criteriaIds].filter((id) => !referencedIds.has(id)).sort();
  const unknown = [...referencedIds].filter((id) => !criteriaIds.has(id)).sort();
  if (uncovered.length > 0 || unknown.length > 0) {
    throw new Error(
      'product-lifecycle-e2e: build handoff coverage mismatch against PRD acceptance criteria — ' +
      `uncovered criteria ids: ${JSON.stringify(uncovered)}; ` +
      `referenced ids with no PRD criterion: ${JSON.stringify(unknown)}`
    );
  }
}

// Deterministic adjudication-completeness verifier: every Phase-2 hypothesis id
// must be adjudicated. A missing id throws — an unadjudicated hypothesis is a
// process defect, never a silently-dropped learning.
function verifyAdjudicationCompleteness(hypotheses, adjudications) {
  const adjudicatedIds = new Set(adjudications.map((a) => String(a.id)));
  const missing = hypotheses
    .map((h) => String(h.id))
    .filter((id) => !adjudicatedIds.has(id))
    .sort();
  if (missing.length > 0) {
    throw new Error(
      `product-lifecycle-e2e: hypothesis adjudication is incomplete — missing outcomes for hypothesis ids: ${JSON.stringify(missing)}`
    );
  }
}

// ---------------------------------------------------------------------------
// Phase 1 — parallel discovery gathering (user research, competitive, metrics)
// ---------------------------------------------------------------------------

export const userResearchSynthesisTask = defineTask('pme.user-research-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: `User-research synthesis for ${args.initiativeName}`,
  agent: {
    name: 'user-researcher',
    prompt: {
      role: 'User researcher synthesizing raw research material',
      task: 'Synthesize the raw user-research inputs into themes and user needs for the initiative',
      context: args,
      instructions: [
        'Apply the user-research-synthesis skill from this specialization: cluster the raw material in researchInputs into themes [{ theme, frequency, impact }] and a userNeeds array.',
        'Apply the jtbd-analysis method from this specialization: frame the needs as jobs the users are hiring the product to do, not as feature requests.',
        'Every evidence entry MUST cite a researchInputs source or a recalled kip fact from priorKnowledge — an uncited theme is a fabrication, not a finding.',
        'If researchInputs is empty or the sources are too thin to support a theme, report the gap honestly in themes/userNeeds and say so in evidence — do NOT invent themes.',
      ],
      outputFormat: 'JSON with themes array [{ theme, frequency, impact }], userNeeds array, evidence array of strings (min 1, each citing a source)',
    },
    outputSchema: {
      type: 'object',
      required: ['themes', 'userNeeds', 'evidence'],
      properties: {
        themes: { type: 'array' },
        userNeeds: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pme', 'product', 'discovery'],
}));

export const competitiveAnalysisTask = defineTask('pme.competitive-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Competitive analysis for ${args.initiativeName}`,
  agent: {
    name: 'market-analyst',
    prompt: {
      role: 'Market analyst mapping the competitive landscape',
      task: 'Analyze the competitive landscape for the initiative and identify differentiation gaps',
      context: args,
      instructions: [
        `Apply the competitive-analysis method from this specialization to the named competitors (${(args.competitors || []).join(', ') || 'none named — analyze the category honestly'}): landscape per competitor with positioning, strengths, and weaknesses.`,
        'Apply the product-market-fit method from this specialization to judge where the market is served versus underserved — gaps must state WHO is underserved and WHY.',
        'Every evidence entry MUST cite the source behind the claim (competitor materials, recalled kip facts in priorKnowledge, or the problemStatement) — uncited claims are not findings.',
        'Where competitor information is genuinely unavailable, say so per competitor instead of inventing capabilities.',
      ],
      outputFormat: 'JSON with landscape array (one entry per competitor), gaps array of differentiation gaps, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['landscape', 'gaps', 'evidence'],
      properties: {
        landscape: { type: 'array' },
        gaps: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pme', 'product', 'discovery'],
}));

export const metricsBaselineTask = defineTask('pme.metrics-baseline', (args, taskCtx) => ({
  kind: 'agent',
  title: `Metrics baseline for ${args.initiativeName}`,
  agent: {
    name: 'data-pm',
    prompt: {
      role: 'Data PM establishing the pre-initiative metrics baseline',
      task: 'Establish the current metrics baseline the initiative will be measured against',
      context: args,
      instructions: [
        `Apply the metrics-dashboard method from this specialization against the provided metricsSources (${(args.metricsSources || []).join(', ') || 'none named'}): baseline [{ metric, value, source }] for the metrics the initiative could move.`,
        'Apply the retention-cohort-analysis method from this specialization for retention-shaped metrics and the conversion-funnel-analysis method for funnel-shaped metrics.',
        'A metric you cannot read from a named source is reported with value "unknown" and the reason — NEVER estimated silently.',
        'Report anomalies (suspicious values, broken instrumentation, contradictory sources) as a separate array; every evidence entry cites the source examined.',
      ],
      outputFormat: 'JSON with baseline array [{ metric, value, source }], anomalies array, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['baseline', 'anomalies', 'evidence'],
      properties: {
        baseline: { type: 'array' },
        anomalies: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pme', 'product', 'discovery'],
}));

// ---------------------------------------------------------------------------
// Phase 2 — discovery synthesis into testable hypotheses
// ---------------------------------------------------------------------------

export const discoverySynthesisTask = defineTask('pme.discovery-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Discovery synthesis for ${args.initiativeName}`,
  agent: {
    name: 'product-strategist',
    prompt: {
      role: 'Product strategist synthesizing discovery into testable hypotheses',
      task: 'Merge the three discovery outputs and prior knowledge into an opportunity framing and testable hypotheses',
      context: args,
      instructions: [
        'Merge userResearch, competitive, and metricsBaseline outputs plus priorKnowledge into a single opportunityFraming for the initiative.',
        'Apply the jtbd-analysis lens from this specialization to frame the opportunity around the jobs users are trying to get done, and the product-market-fit lens to judge how the opportunity moves the initiative toward fit.',
        'Produce hypotheses [{ id, statement, validationSignal }] (min 1). Every hypothesis MUST carry a validationSignal naming the specific metric or research check that would validate it — this exact list is what the post-launch retro adjudicates, so an unverifiable hypothesis is a defect.',
        'Every hypothesis must be traceable to a discovery input; evidence entries cite which discovery output (or recalled kip fact) supports each element of the framing.',
      ],
      outputFormat: 'JSON with opportunityFraming object, hypotheses array [{ id, statement, validationSignal }] (min 1), evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['opportunityFraming', 'hypotheses', 'evidence'],
      properties: {
        opportunityFraming: { type: 'object' },
        hypotheses: { type: 'array', minItems: 1 },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pme', 'product', 'synthesis'],
}));

// ---------------------------------------------------------------------------
// Phase 3 — PRD authoring (requirements-analyst — a different agent from the
// synthesis strategist and from the gate critics, so nobody reviews their own work)
// ---------------------------------------------------------------------------

export const prdAuthoringTask = defineTask('pme.prd-authoring', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? `Revise PRD for ${args.initiativeName} (spec-signoff feedback, round ${args.attempt})`
    : `Author PRD for ${args.initiativeName}`,
  agent: {
    name: 'requirements-analyst',
    prompt: {
      role: 'Requirements analyst authoring the PRD',
      task: `Write the PRD markdown artifact at ${args.prdTargetPath}`,
      context: args,
      instructions: [
        `Write the full PRD as markdown to exactly ${args.prdTargetPath} (create parent directories if needed) and return that path as prdPath.`,
        'Apply the feature-definition-prd method from this specialization for the PRD structure, the task-to-prd method to turn the opportunity framing into concrete requirements, and the user-story-mapping method for the user-story backbone.',
        'acceptanceCriteria MUST be [{ id, criterion, measurableCheck }] — a criterion without a named measurable check (evaluable against the metrics baseline or planned instrumentation) is a defect, not a stylistic choice.',
        'Every user story must state its failure/empty/permission behavior or an explicit non-goal; ground requirements in the synthesis hypotheses rather than silently assuming them.',
        'Evidence entries map PRD sections to the synthesis findings and discovery data they derive from.',
        args.feedback
          ? `Revision round ${args.attempt}: address ONLY this product-lead spec-signoff feedback, re-write the PRD file, and report what changed: ${JSON.stringify(args.feedback)}`
          : 'First authoring round: no revision feedback to address.',
      ],
      outputFormat: 'JSON with prdPath string, acceptanceCriteria array [{ id, criterion, measurableCheck }], evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['prdPath', 'acceptanceCriteria', 'evidence'],
      properties: {
        prdPath: { type: 'string' },
        acceptanceCriteria: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'criterion', 'measurableCheck'],
            properties: {
              id: { type: 'string' },
              criterion: { type: 'string' },
              measurableCheck: { type: 'string' },
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
  labels: ['agent', 'pme', 'product', 'prd'],
}));

// ---------------------------------------------------------------------------
// Phase 6 — prioritization (rice + moscow in parallel, then roadmap slotting)
// ---------------------------------------------------------------------------

export const prioritizationScoringTask = defineTask('pme.prioritization-scoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prioritization scoring (${args.method}) for ${args.initiativeName}`,
  agent: {
    name: 'prioritization-expert',
    prompt: {
      role: 'Prioritization expert scoring the signed-off initiative',
      task: `Score the initiative using the ${args.method} method`,
      context: args,
      instructions: [
        args.method === 'rice'
          ? 'Apply the rice-prioritization method from this specialization: score Reach, Impact, Confidence, and Effort with a per-factor rationale grounded in the discovery data and metrics baseline — an unexplained factor score is invalid.'
          : 'Apply the moscow-prioritization method from this specialization: bucket the PRD scope into Must/Should/Could/Won\'t with a per-bucket rationale grounded in the discovery data and acceptance criteria — an unexplained bucket assignment is invalid.',
        'Return method (the method you applied), scores (riceScores object for rice; moscowBuckets object for moscow), and rationale keyed per factor or bucket.',
        'Evidence entries tie each score or bucket to the specific discovery/metrics data that justifies it.',
      ],
      outputFormat: 'JSON with method string (rice|moscow), scores object, rationale object, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['method', 'scores', 'rationale', 'evidence'],
      properties: {
        method: { type: 'string', enum: ['rice', 'moscow'] },
        scores: { type: 'object' },
        rationale: { type: 'object' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pme', 'product', 'prioritization'],
}));

export const roadmapSlottingTask = defineTask('pme.roadmap-slotting', (args, taskCtx) => ({
  kind: 'agent',
  title: args.feedback
    ? `Re-slot roadmap for ${args.initiativeName} (roadmap-commit feedback)`
    : `Roadmap slotting for ${args.initiativeName}`,
  agent: {
    name: 'product-strategist',
    prompt: {
      role: 'Product strategist sequencing the initiative into the roadmap',
      task: 'Propose the roadmap slot for the signed-off, scored initiative',
      context: args,
      instructions: [
        `Apply the quarterly-roadmap method from this specialization to sequence the initiative into a roadmap slot proposal { quarter, position, rationale }${args.targetQuarter ? ` — the requested target is ${args.targetQuarter}; diverge only with an explicit rationale` : ''}.`,
        'displacedWork must honestly list what moves to make room (or state that nothing moves and why capacity exists) — a slot proposal that pretends capacity is free is a defect.',
        'Apply the stakeholder-alignment method from this specialization for the comms framing: who must hear about the slotting decision and the displaced work, and with what message.',
        'Evidence entries tie the slot and displacement decisions to the rice/moscow scores and roadmap constraints.',
        args.feedback
          ? `Re-slotting round: address ONLY this head-of-product roadmap-commit feedback and report what changed: ${JSON.stringify(args.feedback)}`
          : 'First slotting round: no rejection feedback to address.',
      ],
      outputFormat: 'JSON with roadmapSlot object { quarter, position, rationale }, displacedWork array, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['roadmapSlot', 'displacedWork', 'evidence'],
      properties: {
        roadmapSlot: { type: 'object' },
        displacedWork: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pme', 'product', 'roadmap'],
}));

// ---------------------------------------------------------------------------
// Phase 8 — build handoff (engineering spec + instrumentation plan)
// ---------------------------------------------------------------------------

export const buildHandoffTask = defineTask('pme.build-handoff', (args, taskCtx) => ({
  kind: 'agent',
  title: `Build handoff for ${args.initiativeName}`,
  agent: {
    name: 'technical-pm',
    prompt: {
      role: 'Technical PM producing the engineering handoff',
      task: 'Turn the signed-off PRD into an engineering spec and instrumentation plan',
      context: args,
      instructions: [
        `Apply the prd-to-spec method from this specialization to the signed-off PRD at ${args.prdPath}: specItems [{ id, item, criteriaIds }] covering the buildable scope.`,
        'Produce instrumentationPlan [{ event, criteriaIds }] so every measurableCheck in the acceptance criteria has the events it needs.',
        'EVERY spec item and EVERY instrumentation event MUST reference at least one acceptanceCriteria id from the context, and together they must cover ALL criteria ids — the orchestrator verifies this deterministically and throws on any mismatch.',
        'Evidence entries map spec items back to the PRD sections and criteria they implement.',
      ],
      outputFormat: 'JSON with specItems array [{ id, item, criteriaIds }], instrumentationPlan array [{ event, criteriaIds }], evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['specItems', 'instrumentationPlan', 'evidence'],
      properties: {
        specItems: { type: 'array' },
        instrumentationPlan: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pme', 'product', 'handoff'],
}));

// ---------------------------------------------------------------------------
// Phase 9 — launch readiness, go/no-go, launch execution
// ---------------------------------------------------------------------------

export const launchReadinessTask = defineTask('pme.launch-readiness', (args, taskCtx) => ({
  kind: 'agent',
  title: `Launch readiness plan for ${args.initiativeName}`,
  agent: {
    name: 'gtm-strategist',
    prompt: {
      role: 'GTM strategist preparing the launch plan',
      task: 'Write the launch plan artifact with measurable go/no-go criteria',
      context: args,
      instructions: [
        `Apply the product-launch-gtm method from this specialization: write the full launch plan as an artifact file under ${args.artifactsDir} and return its path as launchPlanPath.`,
        'Apply the beta-program method from this specialization for the pre-launch validation stage of the plan (beta cohort, feedback loop, exit criteria).',
        'goNoGoCriteria MUST be [{ criterion, measurableCheck, status }] — every go/no-go criterion maps to a measurable check with its current honest status; a vibes-only criterion is a defect.',
        'Evidence entries tie readiness statuses to the handoff spec, instrumentation plan, and metrics baseline provided in context.',
      ],
      outputFormat: 'JSON with launchPlanPath string, goNoGoCriteria array [{ criterion, measurableCheck, status }], evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['launchPlanPath', 'goNoGoCriteria', 'evidence'],
      properties: {
        launchPlanPath: { type: 'string' },
        goNoGoCriteria: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pme', 'product', 'launch'],
}));

export const launchExecutionTask = defineTask('pme.launch-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute approved launch plan for ${args.initiativeName}`,
  agent: {
    name: 'gtm-strategist',
    prompt: {
      role: 'GTM strategist executing the approved launch plan',
      task: 'Execute exactly the go-approved launch plan and report honest per-workstream status',
      context: args,
      instructions: [
        `The head-of-product approved launch-go-no-go for this plan: execute EXACTLY the approved plan at ${args.launchPlanPath} — no scope additions, no skipped workstreams, applying the product-launch-gtm method from this specialization.`,
        `Write the launch report as an artifact file under ${args.artifactsDir} and return its path as launchReportPath.`,
        'Report workstreams [{ workstream, status }] with honest per-workstream status; every failed or partial workstream ALSO appears in the failures array with its error — failures are NEVER swallowed or averaged away.',
        'Evidence entries cite the plan sections executed and the observable results per workstream.',
      ],
      outputFormat: 'JSON with launchReportPath string, workstreams array [{ workstream, status }], failures array [{ workstream, error }], evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['launchReportPath', 'workstreams', 'failures', 'evidence'],
      properties: {
        launchReportPath: { type: 'string' },
        workstreams: { type: 'array' },
        failures: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pme', 'product', 'launch'],
}));

// ---------------------------------------------------------------------------
// Phase 10 — post-launch metrics, hypothesis adjudication, lifecycle retro
// ---------------------------------------------------------------------------

export const postLaunchMetricsTask = defineTask('pme.post-launch-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Post-launch metrics vs baseline for ${args.initiativeName}`,
  agent: {
    name: 'data-pm',
    prompt: {
      role: 'Data PM measuring the initiative against its baseline',
      task: 'Compare post-decision metrics against the discovery baseline and execute the PRD measurable checks',
      context: args,
      instructions: [
        'Apply the metrics-dashboard method from this specialization to compare current metrics against the Phase-1 baseline in context: metricDeltas [{ metric, baseline, current, delta }].',
        'Apply the conversion-funnel-analysis method for funnel-shaped metrics and the retention-cohort-analysis method for retention-shaped metrics.',
        'checksExecuted [{ criterionId, measurableCheck, result }] MUST run EVERY PRD measurableCheck from acceptanceCriteria in context and record its honest result — including "not measurable" with the reason when launch did not execute or data is missing; never fabricate a pass.',
        `Launch execution status for this run: ${args.launchExecuted ? 'the launch WAS executed — measure real post-launch data.' : 'the launch was NOT executed (no-go or not reached) — report which checks are consequently not measurable rather than inventing deltas.'}`,
        'Evidence entries cite the sources read per metric and per executed check.',
      ],
      outputFormat: 'JSON with metricDeltas array [{ metric, baseline, current, delta }], checksExecuted array [{ criterionId, measurableCheck, result }], evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['metricDeltas', 'checksExecuted', 'evidence'],
      properties: {
        metricDeltas: { type: 'array' },
        checksExecuted: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pme', 'product', 'post-launch'],
}));

export const hypothesisAdjudicationTask = defineTask('pme.hypothesis-adjudication', (args, taskCtx) => ({
  kind: 'agent',
  title: `Adjudicate ${args.hypotheses.length} discovery hypotheses for ${args.initiativeName}`,
  agent: {
    name: 'data-pm',
    prompt: {
      role: 'Data PM adjudicating the discovery hypotheses',
      task: 'Classify every discovery hypothesis as validated, invalidated, or inconclusive from its validation signal',
      context: args,
      instructions: [
        'Adjudicate EVERY hypothesis in context.hypotheses: adjudications [{ id, outcome, evidenceRef }] — the orchestrator verifies completeness against the hypothesis id set and throws if any id is missing.',
        'outcome is strictly validated|invalidated|inconclusive, decided by evaluating the hypothesis validationSignal against the post-launch metric deltas and executed checks in context — apply the product-market-fit method from this specialization as the judgment lens.',
        'inconclusive is a legitimate honest outcome when the signal was not measurable (e.g. the launch was a no-go) — NEVER force a validated/invalidated verdict the data does not support.',
        'evidenceRef names the specific metric delta, executed check, or data gap behind each outcome; evidence entries cite the sources used.',
      ],
      outputFormat: 'JSON with adjudications array [{ id, outcome (validated|invalidated|inconclusive), evidenceRef }], evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['adjudications', 'evidence'],
      properties: {
        adjudications: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'outcome', 'evidenceRef'],
            properties: {
              id: { type: 'string' },
              outcome: { type: 'string', enum: ['validated', 'invalidated', 'inconclusive'] },
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
  labels: ['agent', 'pme', 'product', 'adjudication'],
}));

export const lifecycleRetroTask = defineTask('pme.lifecycle-retro', (args, taskCtx) => ({
  kind: 'agent',
  title: `Lifecycle retro report for ${args.initiativeName} (run ${args.runId})`,
  agent: {
    name: 'product-ops',
    prompt: {
      role: 'Product ops writing the lifecycle retrospective',
      task: `Write the lifecycle retro markdown report at ${args.reportTargetPath}`,
      context: args,
      instructions: [
        `Write the retro to exactly ${args.reportTargetPath} and return that path as reportPath.`,
        'Frame the retro with the product-council-review method from this specialization: decisions made, evidence weighed, and what the council should carry forward.',
        'Sections, in order: Lifecycle summary (discovery -> PRD -> prioritization -> handoff -> launch decision), Gate verdicts (spec-review with its evidence references), Policy decisions, Hypothesis outcomes, Metric deltas, Retro insights.',
        'The Policy decisions section is MANDATORY and must list EVERY entry from policyDecisions in context with its approver-or-auto provenance: actionId, approved, response, and whether it was autoApproved by the harness (non-interactive run) versus decided by a human.',
        'Record the launch decision honestly — a no-go run documents the no-go reason as a first-class outcome, not a footnote.',
        'Retro insights must trace to run data (gate findings, adjudication outcomes, metric deltas, policy decisions); evidence entries cite that data.',
      ],
      outputFormat: 'JSON with reportPath string, insights array of strings, evidence array of strings (min 1)',
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'insights', 'evidence'],
      properties: {
        reportPath: { type: 'string' },
        insights: { type: 'array' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'pme', 'product', 'retro'],
}));

// ---------------------------------------------------------------------------
// Process
// ---------------------------------------------------------------------------

export async function process(inputs, ctx) {
  const {
    initiativeName,
    problemStatement,
    productArea,
    researchInputs = [],
    competitors = [],
    metricsSources = [],
    targetQuarter,
    maxParallel = 3,
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs || {};

  // No fallbacks: the identity of the initiative is caller responsibility.
  if (!initiativeName) {
    throw new Error(`product-lifecycle-e2e: initiativeName is required (got ${JSON.stringify(initiativeName)})`);
  }
  if (!problemStatement) {
    throw new Error(`product-lifecycle-e2e: problemStatement is required (got ${JSON.stringify(problemStatement)})`);
  }

  const startTime = ctx.now();
  const timings = {};
  const breakpointsHit = [];
  const policyDecisions = [];
  const artifacts = [];
  const artifactsDir = ctx.artifactsDir;
  const sharedArgs = { initiativeName, problemStatement, productArea, artifactsDir };

  // Records one raise of a policy-gated breakpoint into the audit array. A
  // non-interactive harness resolution carries autoApproved:true on the result;
  // that provenance is surfaced here AND in the retro's Policy decisions section.
  const recordPolicyDecision = (actionId, result) => {
    policyDecisions.push({
      actionId,
      approved: result.approved === true,
      response: result.response || result.feedback || null,
      autoApproved: result.autoApproved === true,
    });
  };

  // Honest failure shape shared by every early return — success:false, launch
  // never reached, with the specific reason recorded in metadata.
  const failureResult = (reason, { prdPath = null, gateResults = { specReview: null }, hypotheses = [], prioritization = { riceScores: null, moscowBuckets: null, roadmapSlot: null } } = {}) => ({
    success: false,
    prdPath,
    gateResults,
    hypotheses,
    prioritization,
    launch: { decision: 'not-reached', executed: false, launchPlanPath: null, launchReportPath: null },
    policyDecisions,
    kipFactsAsserted: 0,
    artifacts,
    metadata: {
      processId: 'product-management/product-lifecycle-e2e',
      runId: ctx.runId,
      breakpointsHit,
      timings,
      reason,
    },
  });

  // Phase 0 — kip recall: prior launch retros, research findings, and
  // hypothesis outcomes thread into discovery, synthesis, PRD, prioritization.
  ctx.log?.('info', 'Phase 0: kip recall of prior product-management facts');
  let priorKnowledge = { factCount: 0, facts: [], insights: [], storeInitialized: false };
  if (kipEnabled) {
    priorKnowledge = await kipRecall(ctx, {
      kipDir,
      kipModel,
      kind: 'product-management',
      topic: `prior launch retros, user-research findings, and validated/invalidated hypotheses for ${initiativeName}${productArea ? ` / ${productArea}` : ''}`,
    });
  }
  timings.kipRecall = ctx.now() - startTime;

  // Phase 1 — parallel discovery gathering: three fixed stages fan out through
  // one mapper switch; an unknown stage is a bug, not a case to skip.
  ctx.log?.('info', 'Phase 1: parallel discovery gathering (user-research, competitive, metrics)');
  const discoveryStages = [{ stage: 'user-research' }, { stage: 'competitive' }, { stage: 'metrics' }];
  const discoveryResults = await ctx.parallel.map(
    discoveryStages,
    async ({ stage }) => {
      switch (stage) {
        case 'user-research':
          return {
            stage,
            result: await ctx.task(userResearchSynthesisTask, {
              ...sharedArgs, researchInputs, priorKnowledge,
            }),
          };
        case 'competitive':
          return {
            stage,
            result: await ctx.task(competitiveAnalysisTask, {
              ...sharedArgs, competitors, priorKnowledge,
            }),
          };
        case 'metrics':
          return {
            stage,
            result: await ctx.task(metricsBaselineTask, {
              ...sharedArgs, metricsSources, priorKnowledge,
            }),
          };
        default:
          throw new Error(`product-lifecycle-e2e: unknown discovery stage ${JSON.stringify(stage)}`);
      }
    },
    { maxConcurrency: maxParallel },
  );
  // Destructure by stage name — no positional guessing.
  const byStage = new Map(discoveryResults.map((entry) => [entry.stage, entry.result]));
  const userResearch = byStage.get('user-research');
  const competitive = byStage.get('competitive');
  const metricsBaseline = byStage.get('metrics');
  if (!userResearch || !competitive || !metricsBaseline) {
    throw new Error(
      `product-lifecycle-e2e: discovery fan-out returned incomplete stages (got ${JSON.stringify([...byStage.keys()])})`
    );
  }
  timings.discovery = ctx.now() - startTime;

  // Phase 2 — discovery synthesis into testable hypotheses. The hypotheses
  // list is the substrate the retro adjudicates one-for-one.
  ctx.log?.('info', 'Phase 2: discovery synthesis');
  const synthesis = await ctx.task(discoverySynthesisTask, {
    ...sharedArgs, userResearch, competitive, metricsBaseline, priorKnowledge,
  });
  timings.synthesis = ctx.now() - startTime;

  // Phase 3 — PRD authoring by requirements-analyst (a different agent from
  // the synthesis strategist and from the gate critics).
  ctx.log?.('info', 'Phase 3: PRD authoring');
  const prdTargetPath = join(artifactsDir, `prd-${kebab(initiativeName)}.md`);
  let prd = await ctx.task(prdAuthoringTask, {
    ...sharedArgs,
    prdTargetPath,
    opportunityFraming: synthesis.opportunityFraming,
    hypotheses: synthesis.hypotheses,
    userResearch,
    competitive,
    metricsBaseline,
    priorKnowledge,
  });
  artifacts.push(prd.prdPath);
  timings.prdAuthoring = ctx.now() - startTime;

  // Phase 4 — adversarial spec-review gate: testability + edge-case critics
  // with EXECUTED criteria-to-check traceability evidence. Must pass (or be
  // owner-accepted at escalation) before signoff and everything downstream.
  ctx.log?.('info', 'Phase 4: adversarial spec-review gate');
  const specReview = await adversarialGate(ctx, {
    gateId: 'pme.spec-review',
    artifact: { path: prd.prdPath, description: 'PRD under spec review' },
    critics: [
      {
        name: 'testability-critic',
        role: 'Acceptance-criteria testability reviewer',
        focus: 'untestable, unmeasurable, or check-less acceptance criteria; vague success language; criteria whose measurableCheck cannot actually be evaluated against the metrics baseline',
      },
      {
        name: 'edge-case-critic',
        role: 'Edge-case and failure-mode reviewer',
        focus: 'missing edge cases, unhandled failure/empty/permission states, unstated non-goals, hypothesis claims the PRD silently assumes',
      },
    ],
    ironLaw: [
      'Read the PRD file yourself; every issue and evidence entry MUST cite prdPath:line.',
      'EXECUTED EVIDENCE: build the criteria-to-check traceability matrix and EXECUTE it — for every acceptanceCriteria entry, evaluate whether its measurableCheck is concretely runnable against the metrics baseline / instrumentation context provided, and record the executed trace (criterionId -> check -> evaluable yes/no -> why) in evidence. A verdict without an executed per-criterion trace is a protocol failure.',
      'Testability: any criterion lacking a measurableCheck, or whose check is not evaluable, is a finding — cite the PRD line AND the missing/broken check.',
      'Edge cases: every user story must state its failure/empty/permission behavior or an explicit non-goal; silence is a finding.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      acceptanceCriteria: prd.acceptanceCriteria,
      hypotheses: synthesis.hypotheses,
      metricsBaseline,
      priorKnowledge,
    },
  });
  if (specReview.escalated) {
    breakpointsHit.push('pme.spec-review.gate-escalation');
  }
  timings.specReview = ctx.now() - startTime;

  if (!specReview.passed) {
    // Escalation rejected: the PRD is not build-ready. Signoff and everything
    // downstream never run — record and stop, never proceed silently.
    return failureResult(
      'Spec-review gate failed and the owner rejected the escalation — spec-signoff and everything downstream never ran',
      { prdPath: prd.prdPath, gateResults: { specReview } },
    );
  }

  // Phase 5 — spec-signoff (policy-gated, product-lead). A rejection with
  // feedback buys exactly ONE PRD revision + ONE re-raise at the SAME
  // breakpointId; a second rejection returns success:false honestly.
  ctx.log?.('info', 'Phase 5: spec-signoff (policy-gated)');
  let specApproved = false;
  let signoffFeedback = null;
  for (let round = 0; round < 2; round++) {
    if (round > 0) {
      prd = await ctx.task(prdAuthoringTask, {
        ...sharedArgs,
        prdTargetPath,
        opportunityFraming: synthesis.opportunityFraming,
        hypotheses: synthesis.hypotheses,
        userResearch,
        competitive,
        metricsBaseline,
        priorKnowledge,
        feedback: signoffFeedback,
        attempt: round + 1,
      });
      artifacts.push(prd.prdPath);
    }
    const signoff = await routedBreakpoint(ctx, {
      question: `Approve the PRD for ${initiativeName} as build-ready? It passed the adversarial spec-review gate. Reject with feedback for one revision; a second rejection ends the run without build or launch.`,
      context: {
        runId: ctx.runId,
        files: [{ path: prd.prdPath, label: 'PRD under signoff' }],
        acceptanceCriteria: prd.acceptanceCriteria,
        gateVerdict: {
          passed: specReview.passed,
          attempts: specReview.attempts,
          escalated: specReview.escalated,
          issues: specReview.issues,
        },
        round,
      },
    }, {
      breakpointId: 'spec-signoff',
      expert: 'product-lead',
      tags: ['policy-gated', 'product-management'],
      strategy: 'single',
    });
    breakpointsHit.push('spec-signoff');
    recordPolicyDecision('spec-signoff', signoff);
    if (signoff.approved) { specApproved = true; break; }
    signoffFeedback = signoff.response || signoff.feedback || 'Changes requested';
  }
  timings.specSignoff = ctx.now() - startTime;

  if (!specApproved) {
    return failureResult(
      'spec-signoff rejected twice by the product-lead — the PRD is not build-ready; no build, no launch',
      { prdPath: prd.prdPath, gateResults: { specReview } },
    );
  }

  // Phase 6 — prioritization: rice + moscow scored in parallel by method
  // descriptor, then roadmap slotting with displaced-work honesty.
  ctx.log?.('info', 'Phase 6: prioritization (rice + moscow in parallel) + roadmap slotting');
  const scoringResults = await ctx.parallel.map(
    [{ method: 'rice' }, { method: 'moscow' }],
    ({ method }) => ctx.task(prioritizationScoringTask, {
      ...sharedArgs,
      method,
      prdPath: prd.prdPath,
      acceptanceCriteria: prd.acceptanceCriteria,
      opportunityFraming: synthesis.opportunityFraming,
      metricsBaseline,
      priorKnowledge,
    }),
    { maxConcurrency: maxParallel },
  );
  const riceResult = scoringResults.find((r) => r.method === 'rice');
  const moscowResult = scoringResults.find((r) => r.method === 'moscow');
  if (!riceResult || !moscowResult) {
    throw new Error(
      `product-lifecycle-e2e: prioritization fan-out returned incomplete methods (got ${JSON.stringify(scoringResults.map((r) => r.method))})`
    );
  }
  const riceScores = riceResult.scores;
  const moscowBuckets = moscowResult.scores;

  let slotting = await ctx.task(roadmapSlottingTask, {
    ...sharedArgs,
    targetQuarter,
    riceScores,
    moscowBuckets,
    riceRationale: riceResult.rationale,
    moscowRationale: moscowResult.rationale,
    prdPath: prd.prdPath,
    priorKnowledge,
  });
  timings.prioritization = ctx.now() - startTime;

  // Phase 7 — roadmap-commit (policy-gated, head-of-product). One re-slotting
  // revision at the same id; a second rejection means the roadmap is NOT
  // committed and the run returns an honest partial result.
  ctx.log?.('info', 'Phase 7: roadmap-commit (policy-gated)');
  let roadmapCommitted = false;
  let commitFeedback = null;
  for (let round = 0; round < 2; round++) {
    if (round > 0) {
      slotting = await ctx.task(roadmapSlottingTask, {
        ...sharedArgs,
        targetQuarter,
        riceScores,
        moscowBuckets,
        riceRationale: riceResult.rationale,
        moscowRationale: moscowResult.rationale,
        prdPath: prd.prdPath,
        priorKnowledge,
        feedback: commitFeedback,
      });
    }
    const commit = await routedBreakpoint(ctx, {
      question: `Commit ${initiativeName} to the roadmap at the proposed slot? Reject with feedback for one re-slotting; a second rejection means the roadmap is not committed and the run ends.`,
      context: {
        runId: ctx.runId,
        roadmapSlot: slotting.roadmapSlot,
        displacedWork: slotting.displacedWork,
        riceScores,
        moscowBuckets,
        round,
      },
    }, {
      breakpointId: 'roadmap-commit',
      expert: 'head-of-product',
      tags: ['policy-gated', 'product-management'],
      strategy: 'single',
    });
    breakpointsHit.push('roadmap-commit');
    recordPolicyDecision('roadmap-commit', commit);
    if (commit.approved) { roadmapCommitted = true; break; }
    commitFeedback = commit.response || commit.feedback || 'Changes requested';
  }
  timings.roadmapCommit = ctx.now() - startTime;

  if (!roadmapCommitted) {
    return failureResult(
      'roadmap-commit rejected twice by the head-of-product — the roadmap was not committed; no build handoff, no launch',
      {
        prdPath: prd.prdPath,
        gateResults: { specReview },
        prioritization: { riceScores, moscowBuckets, roadmapSlot: slotting.roadmapSlot },
      },
    );
  }

  // Phase 8 — build handoff. Process code verifies criteria coverage
  // deterministically (throws on mismatch) and writes handoff/index.json.
  ctx.log?.('info', 'Phase 8: build handoff');
  const handoff = await ctx.task(buildHandoffTask, {
    ...sharedArgs,
    prdPath: prd.prdPath,
    acceptanceCriteria: prd.acceptanceCriteria,
    roadmapSlot: slotting.roadmapSlot,
    metricsBaseline,
  });
  verifyHandoffCoverage(prd.acceptanceCriteria, handoff.specItems, handoff.instrumentationPlan);

  const handoffIndexPath = join(artifactsDir, 'handoff', 'index.json');
  const handoffIndex = {
    generatedBy: 'process-code',
    runId: ctx.runId,
    initiative: kebab(initiativeName),
    prdPath: prd.prdPath,
    criteriaIds: prd.acceptanceCriteria.map((c) => String(c.id)).sort(),
    specItems: [...handoff.specItems].sort((a, b) => String(a.id).localeCompare(String(b.id))),
    instrumentationPlan: [...handoff.instrumentationPlan].sort((a, b) => String(a.event).localeCompare(String(b.event))),
  };
  mkdirSync(dirname(handoffIndexPath), { recursive: true });
  writeFileSync(handoffIndexPath, JSON.stringify(handoffIndex, null, 2));
  artifacts.push(handoffIndexPath);
  timings.buildHandoff = ctx.now() - startTime;

  // Phase 9 — launch readiness, then launch-go-no-go (policy-gated). A no-go
  // is FINAL for the run — no redraft loop, launch skipped — but the retro in
  // Phase 10 still runs and records the decision. Launch execution is hard-
  // guarded by approved === true.
  ctx.log?.('info', 'Phase 9: launch readiness + launch-go-no-go (policy-gated)');
  const readiness = await ctx.task(launchReadinessTask, {
    ...sharedArgs,
    prdPath: prd.prdPath,
    acceptanceCriteria: prd.acceptanceCriteria,
    handoffIndexPath,
    specItems: handoff.specItems,
    instrumentationPlan: handoff.instrumentationPlan,
    metricsBaseline,
    priorKnowledge,
  });
  artifacts.push(readiness.launchPlanPath);

  const goNoGo = await routedBreakpoint(ctx, {
    question: `Launch go/no-go for ${initiativeName}: approve the launch against this plan and readiness checklist? A no-go is FINAL for this run — the launch is skipped and the retro records the decision.`,
    context: {
      runId: ctx.runId,
      files: [{ path: readiness.launchPlanPath, label: 'Launch plan' }],
      goNoGoCriteria: readiness.goNoGoCriteria,
    },
  }, {
    breakpointId: 'launch-go-no-go',
    expert: 'head-of-product',
    tags: ['policy-gated', 'product-management'],
    strategy: 'single',
  });
  breakpointsHit.push('launch-go-no-go');
  recordPolicyDecision('launch-go-no-go', goNoGo);

  const launch = {
    decision: goNoGo.approved === true ? 'go' : 'no-go',
    executed: false,
    launchPlanPath: readiness.launchPlanPath,
    launchReportPath: null,
  };
  if (goNoGo.approved === true) {
    // Executor guard: launch execution runs ONLY on an explicit approval.
    const execution = await ctx.task(launchExecutionTask, {
      ...sharedArgs,
      launchPlanPath: readiness.launchPlanPath,
      goNoGoCriteria: readiness.goNoGoCriteria,
    });
    launch.executed = true;
    launch.launchReportPath = execution.launchReportPath;
    launch.workstreams = execution.workstreams;
    launch.failures = execution.failures;
    artifacts.push(execution.launchReportPath);
  }
  timings.launch = ctx.now() - startTime;

  // Phase 10 — post-launch metrics, hypothesis adjudication (completeness
  // verified deterministically), lifecycle retro, kip assert. The no-go path
  // reaches this phase too — the decision is recorded, never buried.
  ctx.log?.('info', 'Phase 10: post-launch retro + hypothesis adjudication + kip assert');
  const postLaunch = await ctx.task(postLaunchMetricsTask, {
    ...sharedArgs,
    launchExecuted: launch.executed,
    launchDecision: launch.decision,
    baseline: metricsBaseline.baseline,
    acceptanceCriteria: prd.acceptanceCriteria,
    launchReportPath: launch.launchReportPath,
    metricsSources,
  });

  const adjudication = await ctx.task(hypothesisAdjudicationTask, {
    ...sharedArgs,
    hypotheses: synthesis.hypotheses,
    metricDeltas: postLaunch.metricDeltas,
    checksExecuted: postLaunch.checksExecuted,
    launchExecuted: launch.executed,
    launchDecision: launch.decision,
  });
  verifyAdjudicationCompleteness(synthesis.hypotheses, adjudication.adjudications);

  const adjudicationById = new Map(
    adjudication.adjudications.map((a) => [String(a.id), a]),
  );
  const hypothesesOut = synthesis.hypotheses.map((h) => {
    const verdict = adjudicationById.get(String(h.id));
    return {
      id: h.id,
      statement: h.statement,
      outcome: verdict.outcome,
      evidence: verdict.evidenceRef,
    };
  });

  const reportTargetPath = join(artifactsDir, `lifecycle-retro-${ctx.runId}.md`);
  const retro = await ctx.task(lifecycleRetroTask, {
    ...sharedArgs,
    runId: ctx.runId,
    reportTargetPath,
    gateResults: { specReview },
    policyDecisions,
    hypotheses: hypothesesOut,
    metricDeltas: postLaunch.metricDeltas,
    checksExecuted: postLaunch.checksExecuted,
    launch,
    prioritization: { riceScores, moscowBuckets, roadmapSlot: slotting.roadmapSlot },
  });
  artifacts.push(retro.reportPath);

  // kip assert — the facts array is ALWAYS non-empty: the launch-outcome fact
  // exists even on no-go runs, satisfying kipAssert's non-empty invariant
  // without padding.
  let kipFactsAsserted = 0;
  if (kipEnabled) {
    const initiativeSubject = `initiative:${kebab(initiativeName)}`;
    const facts = [];
    facts.push({
      subject: initiativeSubject,
      predicate: 'launch-outcome',
      object: launch.executed ? 'launched' : launch.decision,
      props: {
        reason: launch.executed
          ? 'launch-go-no-go approved and the launch plan was executed'
          : `launch-go-no-go decision was ${launch.decision} — the launch was not executed`,
        launchPlanPath: launch.launchPlanPath,
        launchReportPath: launch.launchReportPath,
        runId: ctx.runId,
      },
    });
    for (const hypothesis of hypothesesOut) {
      facts.push({
        subject: initiativeSubject,
        predicate: 'hypothesis-outcome',
        object: hypothesis.outcome,
        props: {
          hypothesisId: hypothesis.id,
          statement: hypothesis.statement,
          evidenceRef: hypothesis.evidence,
          runId: ctx.runId,
        },
      });
    }
    for (let i = 0; i < specReview.issues.length; i++) {
      const issue = specReview.issues[i];
      facts.push({
        subject: initiativeSubject,
        predicate: 'gate-finding',
        object: `spec-review-finding-${i + 1}`,
        props: {
          critic: issue.critic,
          severity: issue.severity,
          description: issue.description,
          runId: ctx.runId,
        },
      });
    }
    for (const delta of postLaunch.metricDeltas) {
      facts.push({
        subject: initiativeSubject,
        predicate: 'metric-delta',
        object: `metric:${kebab(delta.metric)}`,
        props: {
          metric: delta.metric,
          baseline: delta.baseline,
          current: delta.current,
          delta: delta.delta,
          runId: ctx.runId,
        },
      });
    }
    const capture = await kipAssert(ctx, { kipDir, kipModel, kind: 'product-management', facts });
    kipFactsAsserted = capture.asserted;
  }
  timings.close = ctx.now() - startTime;

  // success: the PRD passed gate + signoff, the roadmap was committed, and
  // launch was either executed or an explicit no-go was recorded.
  return {
    success: true,
    prdPath: prd.prdPath,
    gateResults: { specReview },
    hypotheses: hypothesesOut,
    prioritization: { riceScores, moscowBuckets, roadmapSlot: slotting.roadmapSlot },
    launch,
    policyDecisions,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: 'product-management/product-lifecycle-e2e',
      runId: ctx.runId,
      breakpointsHit,
      timings,
    },
  };
}
