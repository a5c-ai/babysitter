/**
 * @process methodologies/composition-smart-product-recommendations
 * @description Smart product-recommendations composition (methodology backlog Example 1): an
 *   AI-powered recommendations engine delivered by composing Domain-Driven Design (bounded
 *   contexts + ubiquitous language for the catalog/shopper domain) -> Hypothesis-Driven
 *   Development (measurable uplift hypotheses + measurement plans) -> BDD / Specification by
 *   Example (executable recommendation-behavior scenarios, authored in parallel per bounded
 *   context) -> Kanban (WIP-limited implementation flow). An adversarial executed-evidence gate
 *   sits at every methodology seam, and two policy-gated routed breakpoints guard the live
 *   experiment launch and the production rollout. kip recalls prior composition lessons at the
 *   start and asserts seam-design outcomes at the end.
 * @composes ../domain-driven-design/domain-driven-design.js (identifySubdomainsTask,
 *   defineBoundedContextsTask, createContextMapTask, buildUbiquitousLanguageTask),
 *   ../hypothesis-driven-development/hypothesis-driven-development.js (formulateHypothesisTask,
 *   createMeasurementPlanTask, analyzeResultsTask),
 *   ../bdd-specification-by-example/bdd-process.js (executeTestsTask),
 *   ../kanban/kanban.js (boardVisualizationTask, wipLimitManagementTask, pullSystemTask,
 *   flowMetricsTask, retrospectiveTask),
 *   ../../specializations/common-utilities/routed-gate-combinators.js (routedBreakpoint,
 *   adversarialGate, kipRecall, kipAssert). csr.* tasks are defined only for cross-methodology
 *   seams, recommendation-domain authoring/execution, and the two guarded policy executors.
 * @policyGatedActions experiment-launch-approval (growth-product-lead) — approve launching a
 *   live recommendation experiment to real shopper traffic; csr.launch-experiment +
 *   csr.experiment-lane run ONLY if approved === true. recommendations-production-rollout
 *   (product-owner) — approve full production rollout after hypothesis validation;
 *   csr.production-rollout runs ONLY if approved === true. Each raised via routedBreakpoint with
 *   breakpointId = actionId, tags ['policy-gated','csr', <phase-tag>], strategy 'single', no
 *   autoApproveAfterN; every executor branch guards on approved === true and records
 *   { approved, autoApproved: response?.autoApproved === true, breakpointId, expert, response }
 *   provenance in the output.
 * @supersedes the '📝 Not Implemented' status of methodologies backlog Example 1
 *   (library/methodologies/backlog.md ~line 1744) only; no code module is replaced
 * @graph
 *   domains: [domain:software-engineering, domain:business]
 *   specializations: [specialization:qa-testing-automation]
 *   skillAreas: [skill-area:domain-driven-design, skill-area:acceptance-testing, skill-area:experimentation]
 *   workflows: [workflow:feature-development, workflow:product-discovery, workflow:release-management]
 *   topics: [topic:domain-driven-design, topic:test-driven-development, topic:experimentation]
 *   roles: [role:product-manager, role:architect, role:backend-engineer, role:qa-engineer]
 * @inputs { storefrontName: string (required), catalogDescription: string (required),
 *   recommendationGoals: string (required), boundedContextHints?: string[],
 *   experimentLanes?: array [{ laneId, variant, description }] (if absent, derived from validated
 *   hypotheses), upliftTargets?: object (explicit per-metric uplift targets; else formulated in
 *   P2), requirementsClear?: boolean (default false — when false, P0 runs the interview +
 *   requirements-interview breakpoint), maxParallelContexts?: number (default 3 — parallel
 *   authoring/build chunk size), maxFixAttempts?: number (default 2 — adversarial-gate fix
 *   budget), kipEnabled?: boolean (default true), kipDir?: string (default '.a5c/kip'),
 *   kipModel?: string (default 'sonnet') }
 * @outputs { success: boolean, domainModel: { subdomains, boundedContexts, contextMapPath,
 *   ubiquitousLanguage }, hypotheses: array [{ hypothesisId, statement, contextId, primaryMetric,
 *   upliftTarget, guardrailMetrics, measurementPlanPath }], scenarios: array [{ contextId,
 *   gherkinPath, stepDefPath, scenarioIds }], flow: { boardPath, wipLimits, flowMetrics,
 *   cardsImplemented }, seamGates: { domainToHypothesis, hypothesisToScenarios, flowToExperiment }
 *   each { passed, attempts, escalated, issues, evidence }, experiment: { launch, lanes, analysis,
 *   validationGate }, rollout: { approved, breakpointId, expert, autoApproved, rolledOut, response },
 *   retro, kipFactsAsserted: number, artifacts: array,
 *   metadata: { processId, runId, breakpointsHit } }
 * @example
 *   const result = await orchestrate('methodologies/composition-smart-product-recommendations', {
 *     storefrontName: 'NovaMart',
 *     catalogDescription: 'Mid-size fashion storefront: 40k SKUs, returning + cold-start shoppers',
 *     recommendationGoals: 'Lift average order value and PDP click-through with cross-sell + personalization',
 *     requirementsClear: false,
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
  identifySubdomainsTask,
  defineBoundedContextsTask,
  createContextMapTask,
  buildUbiquitousLanguageTask,
} from '../domain-driven-design/domain-driven-design.js';
import {
  formulateHypothesisTask,
  createMeasurementPlanTask,
  analyzeResultsTask,
} from '../hypothesis-driven-development/hypothesis-driven-development.js';
import { executeTestsTask } from '../bdd-specification-by-example/bdd-process.js';
import {
  boardVisualizationTask,
  wipLimitManagementTask,
  pullSystemTask,
  flowMetricsTask,
  retrospectiveTask,
} from '../kanban/kanban.js';

const PROCESS_ID = 'methodologies/composition-smart-product-recommendations';

// ---------------------------------------------------------------------------
// P0 — conditional requirements interview
// ---------------------------------------------------------------------------

export const requirementsInterviewTask = defineTask('csr.requirements-interview', (args, taskCtx) => ({
  kind: 'agent',
  title: `Clarify recommendation requirements: ${args.storefrontName}`,
  agent: {
    name: 'recommendations-analyst',
    prompt: {
      role: 'Recommendations requirements analyst',
      task: `Clarify the catalog/shopper scope, business goal, and target KPIs for ${args.storefrontName} before any modeling`,
      context: args,
      instructions: [
        'Clarify the recommendation business goal into measurable target KPIs (name, current baseline, desired direction).',
        'Pin down the catalog scope (which product lines / SKUs) and the shopper segments in play (returning, cold-start, high-value).',
        'Surface open questions and constraints that would change the domain model or the hypotheses — do not resolve them silently.',
        'Write the clarified-requirements artifact to disk and return its path.',
      ],
      outputFormat:
        'JSON with clarifiedGoals string, targetKpis array [{name, currentBaseline, desiredDirection}], catalogScope string, shopperSegments array, openQuestions array, artifactPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['clarifiedGoals', 'targetKpis', 'catalogScope', 'shopperSegments', 'artifactPath'],
      properties: {
        clarifiedGoals: { type: 'string' },
        targetKpis: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['name', 'currentBaseline', 'desiredDirection'],
            properties: {
              name: { type: 'string' },
              currentBaseline: { type: 'string' },
              desiredDirection: { type: 'string' },
            },
          },
        },
        catalogScope: { type: 'string' },
        shopperSegments: { type: 'array' },
        openQuestions: { type: 'array' },
        artifactPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csr', 'requirements', 'interview'],
}));

// ---------------------------------------------------------------------------
// P1 -> P2 seam producer — DDD bounded contexts to uplift-lever hypotheses
// ---------------------------------------------------------------------------

export const domainToHypothesisHandoffTask = defineTask('csr.handoff.domain-to-hypothesis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Seam: domain model -> hypothesis candidates (${args.storefrontName})`,
  agent: {
    name: 'recommendations-strategist',
    prompt: {
      role: 'Recommendation strategy analyst',
      task: 'Translate the DDD bounded contexts + ubiquitous language into candidate uplift-lever hypotheses',
      context: args,
      instructions: [
        'For each bounded context, propose candidate uplift levers (e.g. cold-start personalization, cross-sell diversity, ranking re-order).',
        'Every candidate is tied to exactly ONE bounded context and names a business metric measurable in an online experiment.',
        'Use only terms from the ubiquitous language — no smuggled synonyms.',
        'Write the seam artifact (candidate list + rationale) to disk and return its path.',
      ],
      outputFormat:
        'JSON with hypothesisCandidates array [{candidateId, contextId, lever, businessMetric, rationale}], seamNotes string, artifactPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['hypothesisCandidates', 'seamNotes', 'artifactPath'],
      properties: {
        hypothesisCandidates: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['candidateId', 'contextId', 'lever', 'businessMetric', 'rationale'],
            properties: {
              candidateId: { type: 'string' },
              contextId: { type: 'string' },
              lever: { type: 'string' },
              businessMetric: { type: 'string' },
              rationale: { type: 'string' },
            },
          },
        },
        seamNotes: { type: 'string' },
        artifactPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csr', 'seam', 'domain-to-hypothesis'],
}));

// ---------------------------------------------------------------------------
// P2 -> P3 seam producer — hypotheses to per-context behavior backlog
// ---------------------------------------------------------------------------

export const hypothesisToScenariosHandoffTask = defineTask('csr.handoff.hypothesis-to-scenarios', (args, taskCtx) => ({
  kind: 'agent',
  title: `Seam: hypotheses -> behavior backlog (${args.storefrontName})`,
  agent: {
    name: 'recommendations-strategist',
    prompt: {
      role: 'Specification handoff analyst',
      task: 'Derive the recommendation behaviors that must be specified as BDD scenarios from each formulated hypothesis',
      context: args,
      instructions: [
        'For each hypothesis (with its measurement plan), derive the recommendation behaviors that prove or disprove it.',
        'Every hypothesis must map to at least one behavior — no orphan hypotheses.',
        'Group behaviors per bounded context so scenario authoring can fan out in parallel.',
        'Write the seam artifact (behavior backlog + grouping) to disk and return its path.',
      ],
      outputFormat:
        'JSON with behaviorBacklog array [{behaviorId, contextId, hypothesisId, behaviorSummary, acceptanceHint}], perContextGroups array [{contextId, behaviorIds}], artifactPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['behaviorBacklog', 'perContextGroups', 'artifactPath'],
      properties: {
        behaviorBacklog: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['behaviorId', 'contextId', 'hypothesisId', 'behaviorSummary', 'acceptanceHint'],
            properties: {
              behaviorId: { type: 'string' },
              contextId: { type: 'string' },
              hypothesisId: { type: 'string' },
              behaviorSummary: { type: 'string' },
              acceptanceHint: { type: 'string' },
            },
          },
        },
        perContextGroups: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['contextId', 'behaviorIds'],
            properties: {
              contextId: { type: 'string' },
              behaviorIds: { type: 'array' },
            },
          },
        },
        artifactPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csr', 'seam', 'hypothesis-to-scenarios'],
}));

// ---------------------------------------------------------------------------
// P3 parallel unit — recommendation-behavior scenario authoring (one context)
// ---------------------------------------------------------------------------

export const recommendationScenarioAuthoringTask = defineTask('csr.recommendation-scenario-authoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Author recommendation scenarios: context ${args.context.contextId}`,
  agent: {
    name: 'bdd-scenario-author',
    prompt: {
      role: 'BDD recommendation-scenario author',
      task: `Author Given/When/Then recommendation-behavior scenarios for bounded context ${args.context.contextId} (${args.context.name})`,
      context: args,
      instructions: [
        'Author executable Given/When/Then scenarios for this bounded context: cold-start, personalization relevance, diversity/guardrails, and NO-fallback ranking.',
        'IRON LAW: specify the missing-signal / no-recommendation case as an EXPLICIT behavior — never a silent fallback ranking path.',
        'Emit executable gherkin to a per-context gherkinPath and step-definition stubs to stepDefPath.',
        'Every scenario id embeds this contextId and its hypothesisId so scenario -> hypothesis -> metric can be joined later.',
      ],
      outputFormat:
        'JSON with contextId, gherkinPath, stepDefPath, scenarios array [{scenarioId, hypothesisId, behaviorId, title, given, when, then}]',
    },
    outputSchema: {
      type: 'object',
      required: ['contextId', 'gherkinPath', 'stepDefPath', 'scenarios'],
      properties: {
        contextId: { type: 'string' },
        gherkinPath: { type: 'string' },
        stepDefPath: { type: 'string' },
        scenarios: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['scenarioId', 'hypothesisId', 'behaviorId', 'title', 'given', 'when', 'then'],
            properties: {
              scenarioId: { type: 'string' },
              hypothesisId: { type: 'string' },
              behaviorId: { type: 'string' },
              title: { type: 'string' },
              given: { type: 'string' },
              when: { type: 'string' },
              then: { type: 'string' },
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
  labels: ['agent', 'csr', 'bdd', 'authoring'],
}));

// ---------------------------------------------------------------------------
// P3 -> P4 seam producer — scenarios to Kanban card backlog
// ---------------------------------------------------------------------------

export const scenariosToFlowHandoffTask = defineTask('csr.handoff.scenarios-to-flow', (args, taskCtx) => ({
  kind: 'agent',
  title: `Seam: scenarios -> Kanban card backlog (${args.storefrontName})`,
  agent: {
    name: 'delivery-lead',
    prompt: {
      role: 'Kanban intake analyst',
      task: 'Convert the authored recommendation scenarios into a Kanban card backlog',
      context: args,
      instructions: [
        'Emit one card per implementable recommendation behavior; each card carries its scenarioIds, contextId, and hypothesisId.',
        'Declare parallelSafe and dependsOn honestly — the orchestrator schedules from them; a dependency cycle is a planning bug, not a schedulable state.',
        'Do not invent cards for behaviors that have no authored scenario.',
      ],
      outputFormat:
        'JSON with cards array [{cardId, contextId, hypothesisId, scenarioIds, title, parallelSafe, dependsOn}]',
    },
    outputSchema: {
      type: 'object',
      required: ['cards'],
      properties: {
        cards: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['cardId', 'contextId', 'hypothesisId', 'scenarioIds', 'title', 'parallelSafe', 'dependsOn'],
            properties: {
              cardId: { type: 'string' },
              contextId: { type: 'string' },
              hypothesisId: { type: 'string' },
              scenarioIds: { type: 'array' },
              title: { type: 'string' },
              parallelSafe: { type: 'boolean' },
              dependsOn: { type: 'array' },
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
  labels: ['agent', 'csr', 'seam', 'scenarios-to-flow'],
}));

// ---------------------------------------------------------------------------
// P4 — implement one recommendation card (RUN mapped scenarios green)
// ---------------------------------------------------------------------------

export const implementRecommendationCardTask = defineTask('csr.implement-recommendation-card', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implement recommendation card ${args.card.cardId}`,
  agent: {
    name: 'recommendation-engineer',
    prompt: {
      role: 'Recommendation implementation engineer',
      task: `Implement card ${args.card.cardId} so its mapped BDD scenarios pass`,
      context: args,
      instructions: [
        'Write the test/impl for this card, then RUN the mapped scenarios and paste the executed red -> green output — do not claim green without running.',
        'Record the scenarioId -> testId mapping with the executed status for every mapped scenario.',
        'IRON LAW: report untested edges honestly and implement NO silent fallback ranking path; missing-signal handling is the explicitly specified behavior.',
      ],
      outputFormat:
        'JSON with cardId, summary, filesChanged array, scenarioTestMap array [{scenarioId, testId, testPath, status}], executedOutputExcerpt string',
    },
    outputSchema: {
      type: 'object',
      required: ['cardId', 'summary', 'filesChanged', 'scenarioTestMap', 'executedOutputExcerpt'],
      properties: {
        cardId: { type: 'string' },
        summary: { type: 'string' },
        filesChanged: { type: 'array' },
        scenarioTestMap: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['scenarioId', 'testId', 'testPath', 'status'],
            properties: {
              scenarioId: { type: 'string' },
              testId: { type: 'string' },
              testPath: { type: 'string' },
              status: { type: 'string' },
            },
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
  labels: ['agent', 'csr', 'kanban', 'implementation'],
}));

// ---------------------------------------------------------------------------
// P5 GUARDED executor — perform the approved live experiment launch
// ---------------------------------------------------------------------------

export const launchExperimentTask = defineTask('csr.launch-experiment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Launch live recommendation experiment: ${args.storefrontName}`,
  agent: {
    name: 'experiment-launcher',
    prompt: {
      role: 'Live experiment launcher',
      task: 'Perform the approved live-experiment launch steps to real shopper traffic exactly as approved',
      context: args,
      instructions: [
        'Execute the launch exactly as approved: traffic allocation, ramp, and guardrail alarms — nothing beyond the approved plan.',
        'Deviations require going back through the breakpoint, not improvisation.',
        'Record every produced artifact path.',
      ],
      outputFormat: 'JSON with launched boolean, allocation object, artifacts array',
    },
    outputSchema: {
      type: 'object',
      required: ['launched', 'allocation', 'artifacts'],
      properties: {
        launched: { type: 'boolean' },
        allocation: { type: 'object' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csr', 'experiment', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P5 parallel unit — run one experiment lane end to end (executed evidence)
// ---------------------------------------------------------------------------

export const experimentLaneTask = defineTask('csr.experiment-lane', (args, taskCtx) => ({
  kind: 'agent',
  title: `Experiment lane ${args.lane.laneId} (${args.lane.variant})`,
  agent: {
    name: 'experiment-runner',
    prompt: {
      role: 'Recommendation experiment lane runner',
      task: `Run experiment lane ${args.lane.laneId} (variant vs control) end to end`,
      context: args,
      instructions: [
        'EXECUTE the mapped BDD scenarios against the lane build and paste the executed output.',
        'Execute the hypothesis metric-computation stub over the lane raw data and emit the computed primary + guardrail metrics.',
        'Write the lane raw data to disk and return rawDataPath — this is the executed evidence the validation gate re-checks.',
        'Report honestly: a guardrail breach is a real outcome, never suppressed to protect the primary metric.',
      ],
      outputFormat:
        'JSON with laneId, computedMetrics {primaryMetric, value, upliftVsControl, guardrails array}, executedBddExcerpt string, metricComputationExcerpt string, rawDataPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['laneId', 'computedMetrics', 'executedBddExcerpt', 'metricComputationExcerpt', 'rawDataPath'],
      properties: {
        laneId: { type: 'string' },
        computedMetrics: {
          type: 'object',
          required: ['primaryMetric', 'value', 'upliftVsControl', 'guardrails'],
          properties: {
            primaryMetric: { type: 'string' },
            value: { type: 'number' },
            upliftVsControl: { type: 'number' },
            guardrails: { type: 'array' },
          },
        },
        executedBddExcerpt: { type: 'string' },
        metricComputationExcerpt: { type: 'string' },
        rawDataPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csr', 'experiment', 'lane'],
}));

// ---------------------------------------------------------------------------
// P6 GUARDED executor — roll out the validated model to production
// ---------------------------------------------------------------------------

export const productionRolloutTask = defineTask('csr.production-rollout', (args, taskCtx) => ({
  kind: 'agent',
  title: `Production rollout: ${args.storefrontName}`,
  agent: {
    name: 'release-engineer',
    prompt: {
      role: 'Production rollout engineer',
      task: 'Roll out the validated recommendation model to full production exactly as approved',
      context: args,
      instructions: [
        'Execute the rollout exactly as approved: flag flip, ramp schedule, rollback trigger — no improvisation beyond the approved plan.',
        'Record every produced artifact path.',
      ],
      outputFormat: 'JSON with rolledOut boolean, rampSchedule object, rollbackTrigger string, artifacts array',
    },
    outputSchema: {
      type: 'object',
      required: ['rolledOut', 'rampSchedule', 'rollbackTrigger', 'artifacts'],
      properties: {
        rolledOut: { type: 'boolean' },
        rampSchedule: { type: 'object' },
        rollbackTrigger: { type: 'string' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csr', 'rollout', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P7 — end-to-end seam report
// ---------------------------------------------------------------------------

export const seamReportTask = defineTask('csr.seam-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Compile seam report: ${args.storefrontName}`,
  agent: {
    name: 'composition-scribe',
    prompt: {
      role: 'Composition seam scribe',
      task: 'Compile the end-to-end seam report (domain -> hypothesis -> scenarios -> flow -> experiment -> rollout)',
      context: args,
      instructions: [
        'Record what crossed each seam and where a handoff leaked (dropped context, orphaned hypothesis, unmapped scenario).',
        'Summarize the adversarial gate attempts and the seam-design lessons worth asserting into kip.',
        'Write the seam report to disk and return its path.',
      ],
      outputFormat: 'JSON with reportPath string, seamLessons array [{seam, lesson}], leakedHandoffs array',
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'seamLessons'],
      properties: {
        reportPath: { type: 'string' },
        seamLessons: {
          type: 'array',
          items: {
            type: 'object',
            required: ['seam', 'lesson'],
            properties: {
              seam: { type: 'string' },
              lesson: { type: 'string' },
            },
          },
        },
        leakedHandoffs: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csr', 'seam', 'report'],
}));

// ---------------------------------------------------------------------------
// helpers (pure, no fallbacks)
// ---------------------------------------------------------------------------

/**
 * Order the given cards so every card appears after all of its in-set dependsOn
 * cards. Throws on dependency cycles — a cycle is a planning bug, not a
 * schedulable state.
 *
 * @param {Array<{cardId: string, dependsOn?: string[]}>} cards
 * @returns {Array} cards in dependency-safe order
 */
function orderByDependencies(cards) {
  const inSet = new Map(cards.map((c) => [c.cardId, c]));
  const ordered = [];
  const done = new Set();
  const visiting = new Set();

  const visit = (card) => {
    if (done.has(card.cardId)) return;
    if (visiting.has(card.cardId)) {
      throw new Error(`composition-smart-product-recommendations: dependency cycle detected at card ${card.cardId}`);
    }
    visiting.add(card.cardId);
    for (const depId of card.dependsOn ?? []) {
      const dep = inSet.get(depId);
      if (dep) visit(dep);
    }
    visiting.delete(card.cardId);
    done.add(card.cardId);
    ordered.push(card);
  };

  for (const card of cards) visit(card);
  return ordered;
}

/**
 * Normalize a routed-breakpoint result into provenance the output records.
 *
 * @param {string} breakpointId
 * @param {string|string[]} expert
 * @param {object} result - BreakpointResult
 * @returns {{approved: boolean, autoApproved: boolean, breakpointId: string, expert: (string|string[]), response: object}}
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
 * Chunk items into groups of at most `size` for bounded parallel scheduling.
 * A non-positive size is a caller bug, not a schedulable state.
 *
 * @param {Array} items
 * @param {number} size
 * @returns {Array<Array>}
 */
function chunk(items, size) {
  if (!Number.isInteger(size) || size < 1) {
    throw new Error(`composition-smart-product-recommendations: chunk size must be a positive integer (got ${JSON.stringify(size)})`);
  }
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

// ---------------------------------------------------------------------------
// process — P0..P7
// ---------------------------------------------------------------------------

/**
 * Smart product-recommendations composition: DDD (bounded contexts) ->
 * Hypothesis-Driven Development (measurable uplift) -> BDD (executable
 * recommendation specs) -> Kanban (implementation flow), with an adversarial
 * executed-evidence gate at every methodology seam and two policy-gated routed
 * breakpoints (experiment launch, production rollout).
 *
 * @param {object} inputs - Process inputs (see @inputs)
 * @param {object} ctx - Orchestration context
 * @returns {Promise<object>} Result (see @outputs)
 */
export async function process(inputs, ctx) {
  const {
    storefrontName,
    catalogDescription,
    recommendationGoals,
    boundedContextHints = [],
    experimentLanes,
    upliftTargets,
    requirementsClear = false,
    maxParallelContexts = 3,
    maxFixAttempts = 2,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs ?? {};

  // No fallbacks: invalid inputs throw before any orchestration happens.
  if (typeof storefrontName !== 'string' || storefrontName.trim() === '') {
    throw new Error(`composition-smart-product-recommendations: storefrontName is required (got ${JSON.stringify(storefrontName)})`);
  }
  if (typeof catalogDescription !== 'string' || catalogDescription.trim() === '') {
    throw new Error(`composition-smart-product-recommendations: catalogDescription is required (got ${JSON.stringify(catalogDescription)})`);
  }
  if (typeof recommendationGoals !== 'string' || recommendationGoals.trim() === '') {
    throw new Error(`composition-smart-product-recommendations: recommendationGoals is required (got ${JSON.stringify(recommendationGoals)})`);
  }
  if (!Number.isInteger(maxParallelContexts) || maxParallelContexts < 1) {
    throw new Error(`composition-smart-product-recommendations: maxParallelContexts must be a positive integer (got ${JSON.stringify(maxParallelContexts)})`);
  }
  if (!Number.isInteger(maxFixAttempts) || maxFixAttempts < 0) {
    throw new Error(`composition-smart-product-recommendations: maxFixAttempts must be a non-negative integer (got ${JSON.stringify(maxFixAttempts)})`);
  }
  if (experimentLanes !== undefined) {
    if (!Array.isArray(experimentLanes) || experimentLanes.length === 0) {
      throw new Error(`composition-smart-product-recommendations: experimentLanes, when provided, must be a non-empty array (got ${JSON.stringify(experimentLanes)})`);
    }
    for (const lane of experimentLanes) {
      if (!lane || typeof lane.laneId !== 'string' || typeof lane.variant !== 'string') {
        throw new Error(`composition-smart-product-recommendations: every experiment lane must have laneId + variant (got ${JSON.stringify(lane)})`);
      }
    }
  }

  const breakpointsHit = [];
  const artifacts = [];

  // -------------------------------------------------------------------------
  // P0 — kip recall + optional requirements interview
  // -------------------------------------------------------------------------
  let kipInsights = [];
  if (kipEnabled) {
    const recall = await kipRecall(ctx, {
      kipDir,
      topic: `smart-product-recommendations composition handoffs for ${storefrontName}`,
      kipModel,
      kind: 'methodology-composition',
    });
    kipInsights = recall.insights ?? [];
  }

  let clarifiedRequirements = null;
  if (requirementsClear !== true) {
    clarifiedRequirements = await ctx.task(requirementsInterviewTask, {
      storefrontName,
      catalogDescription,
      recommendationGoals,
      boundedContextHints,
      upliftTargets,
      kipInsights,
    });
    artifacts.push(clarifiedRequirements.artifactPath);

    const interviewResult = await routedBreakpoint(ctx, {
      question: `Confirm the clarified recommendation requirements for ${storefrontName} before modeling?`,
      clarifiedGoals: clarifiedRequirements.clarifiedGoals,
      targetKpis: clarifiedRequirements.targetKpis,
      catalogScope: clarifiedRequirements.catalogScope,
      shopperSegments: clarifiedRequirements.shopperSegments,
      openQuestions: clarifiedRequirements.openQuestions ?? [],
    }, {
      breakpointId: 'requirements-interview',
      expert: 'growth-product-lead',
      tags: ['interview', 'csr'],
      strategy: 'single',
    });
    breakpointsHit.push('requirements-interview');
    clarifiedRequirements = { ...clarifiedRequirements, confirmation: breakpointProvenance('requirements-interview', 'growth-product-lead', interviewResult) };
  }

  // -------------------------------------------------------------------------
  // P1 — DDD domain modeling of the catalog/shopper context
  // -------------------------------------------------------------------------
  const subdomainsResult = await ctx.task(identifySubdomainsTask, {
    projectName: storefrontName,
    domainDescription: catalogDescription,
    existingDomainModel: boundedContextHints,
    clarifiedRequirements,
    kipInsights,
  });
  const subdomains = subdomainsResult.subdomains;

  const contextsResult = await ctx.task(defineBoundedContextsTask, {
    projectName: storefrontName,
    subdomains,
    domainDescription: catalogDescription,
    kipInsights,
  });
  const boundedContexts = contextsResult.contexts;

  const contextMapResult = await ctx.task(createContextMapTask, {
    projectName: storefrontName,
    boundedContexts,
    subdomains,
    kipInsights,
  });

  const ubiquitousLanguageResult = await ctx.task(buildUbiquitousLanguageTask, {
    projectName: storefrontName,
    domainDescription: catalogDescription,
    boundedContexts,
    subdomains,
    kipInsights,
  });

  const domainModel = {
    subdomains,
    boundedContexts,
    contextMapPath: contextMapResult.contextMapPath ?? contextMapResult.artifactPath ?? null,
    contextMap: {
      relationships: contextMapResult.relationships,
      integrationPatterns: contextMapResult.integrationPatterns,
    },
    ubiquitousLanguage: ubiquitousLanguageResult.glossary,
  };

  const domainHandoff = await ctx.task(domainToHypothesisHandoffTask, {
    storefrontName,
    recommendationGoals,
    subdomains,
    boundedContexts,
    contextMapPath: domainModel.contextMapPath,
    ubiquitousLanguage: domainModel.ubiquitousLanguage,
    clarifiedRequirements,
    kipInsights,
  });
  artifacts.push(domainHandoff.artifactPath);
  const hypothesisCandidates = domainHandoff.hypothesisCandidates;

  // G1 — DDD -> Hypothesis seam (design seam; re-derive the model artifacts).
  const g1 = await adversarialGate(ctx, {
    gateId: 'csr.seam.domain-to-hypothesis',
    artifact: {
      path: domainHandoff.artifactPath,
      description: 'Domain-to-hypothesis seam artifact: bounded contexts + ubiquitous language -> uplift-lever candidates',
    },
    critics: [
      {
        name: 'bounded-context-boundary-critic',
        role: 'DDD strategic reviewer',
        focus: 'context boundaries are cohesive and non-overlapping; each candidate sits in exactly one context; re-derive boundaries from the context map',
      },
      {
        name: 'ubiquitous-language-critic',
        role: 'Language-consistency auditor',
        focus: 'candidate lever terms match the ubiquitous language; no smuggled synonyms',
      },
      {
        name: 'hypothesis-testability-critic',
        role: 'Experiment feasibility reviewer',
        focus: 'each candidate names a business metric measurable in an online experiment',
      },
    ],
    ironLaw: [
      'Do NOT trust the strategist summary: re-derive context boundaries and language from the artifacts.',
      'A candidate whose metric cannot be measured online is a FAIL.',
      'Cite file:line for every claim.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      subdomains,
      boundedContexts,
      ubiquitousLanguage: domainModel.ubiquitousLanguage,
      contextMap: domainModel.contextMap,
      hypothesisCandidates,
    },
  });
  if (g1.escalated === true) {
    breakpointsHit.push('csr.seam.domain-to-hypothesis.gate-escalation');
  }
  const domainToHypothesisGate = { passed: g1.passed === true, attempts: g1.attempts, escalated: g1.escalated, issues: g1.issues, evidence: g1.evidence };

  if (domainToHypothesisGate.passed !== true) {
    return terminalFailure({
      ctx, PROCESS_ID, breakpointsHit, artifacts, domainModel,
      hypotheses: [], scenarios: [],
      seamGates: { domainToHypothesis: domainToHypothesisGate, hypothesisToScenarios: null, flowToExperiment: null },
    });
  }

  // -------------------------------------------------------------------------
  // P2 — hypothesis formulation with measurable uplift targets
  // -------------------------------------------------------------------------
  const hypotheses = [];
  for (const candidate of hypothesisCandidates) {
    const formulated = await ctx.task(formulateHypothesisTask, {
      projectName: storefrontName,
      featureIdea: candidate.lever,
      targetAudience: `${storefrontName} shoppers (${candidate.contextId})`,
      context: { candidate, recommendationGoals, upliftTargets, kipInsights },
    });
    const measurementPlan = await ctx.task(createMeasurementPlanTask, {
      projectName: storefrontName,
      hypothesis: formulated,
      significanceLevel: 0.05,
      context: { candidate, kipInsights },
    });
    const explicitTarget = upliftTargets && typeof upliftTargets === 'object'
      ? upliftTargets[candidate.businessMetric]
      : undefined;
    hypotheses.push({
      hypothesisId: candidate.candidateId,
      statement: formulated.hypothesisStatement,
      contextId: candidate.contextId,
      primaryMetric: formulated.successMetric,
      upliftTarget: explicitTarget !== undefined ? explicitTarget : formulated.expectedOutcome,
      guardrailMetrics: measurementPlan.counterMetrics ?? measurementPlan.guardrailMetrics ?? [],
      measurementPlanPath: measurementPlan.measurementPlanPath ?? measurementPlan.artifactPath ?? null,
      measurementPlan,
    });
  }

  const scenariosHandoff = await ctx.task(hypothesisToScenariosHandoffTask, {
    storefrontName,
    hypotheses: hypotheses.map((h) => ({
      hypothesisId: h.hypothesisId,
      statement: h.statement,
      contextId: h.contextId,
      primaryMetric: h.primaryMetric,
      upliftTarget: h.upliftTarget,
      guardrailMetrics: h.guardrailMetrics,
      measurementPlanPath: h.measurementPlanPath,
    })),
    boundedContexts,
    ubiquitousLanguage: domainModel.ubiquitousLanguage,
    kipInsights,
  });
  artifacts.push(scenariosHandoff.artifactPath);
  const perContextGroups = scenariosHandoff.perContextGroups;

  // -------------------------------------------------------------------------
  // P3 — BDD scenario authoring (parallel per bounded context, chunked)
  // -------------------------------------------------------------------------
  const contextsById = new Map(boundedContexts.map((c) => [c.name, c]));
  const authoringUnits = perContextGroups.map((group) => {
    const bc = contextsById.get(group.contextId);
    if (!bc) {
      throw new Error(`composition-smart-product-recommendations: perContextGroups references unknown bounded context ${group.contextId}`);
    }
    return { group, context: { contextId: group.contextId, name: bc.name } };
  });

  const scenarioResults = [];
  for (const groupChunk of chunk(authoringUnits, maxParallelContexts)) {
    const chunkResults = await ctx.parallel.all(
      groupChunk.map((unit) => () =>
        ctx.task(recommendationScenarioAuthoringTask, {
          context: unit.context,
          behaviors: scenariosHandoff.behaviorBacklog.filter((b) => unit.group.behaviorIds.includes(b.behaviorId)),
          hypotheses: hypotheses.filter((h) => h.contextId === unit.context.contextId),
          ubiquitousLanguage: domainModel.ubiquitousLanguage,
          kipInsights,
        })
      )
    );
    scenarioResults.push(...chunkResults);
  }
  for (const result of scenarioResults) {
    artifacts.push(result.gherkinPath);
    artifacts.push(result.stepDefPath);
  }
  const allScenarios = scenarioResults.flatMap((r) =>
    r.scenarios.map((s) => ({ ...s, contextId: r.contextId, gherkinPath: r.gherkinPath, stepDefPath: r.stepDefPath }))
  );
  const scenarios = scenarioResults.map((r) => ({
    contextId: r.contextId,
    gherkinPath: r.gherkinPath,
    stepDefPath: r.stepDefPath,
    scenarioIds: r.scenarios.map((s) => s.scenarioId),
  }));

  // G2 — Hypothesis -> BDD seam (executed evidence: run authored gherkin, expect RED/pending).
  const g2Execution = await ctx.task(executeTestsTask, {
    projectName: storefrontName,
    feature: 'recommendation-behaviors (authored, pre-implementation)',
    testFramework: 'cucumber',
    scenarios: allScenarios,
    stepImplementations: scenarioResults.map((r) => ({ contextId: r.contextId, stepDefPath: r.stepDefPath })),
  });
  const g2 = await adversarialGate(ctx, {
    gateId: 'csr.seam.hypothesis-to-scenarios',
    artifact: {
      path: scenarioResults[0].gherkinPath,
      description: 'Authored recommendation gherkin across all bounded contexts',
    },
    critics: [
      {
        name: 'measurability-critic',
        role: 'Metrics auditor',
        focus: 'every hypothesis has a quantified uplift target, a primary metric, and guardrail metrics',
      },
      {
        name: 'scenario-coverage-critic',
        role: 'Coverage auditor',
        focus: 'every hypothesis maps to >= 1 scenario; no orphan hypotheses; no scenario without a hypothesisId',
      },
      {
        name: 'scenario-executability-critic',
        role: 'BDD forensics reviewer',
        focus: 'EXECUTE the authored gherkin (expect RED/pending) to prove the scenarios are real executable specs',
      },
    ],
    ironLaw: [
      'Run the authored scenarios yourself; a scenario that will not execute is a FAIL even if it reads well.',
      'Every hypothesis must trace to >= 1 scenario and every scenario to a hypothesis.',
      'Cite executed output and file:line.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      hypotheses,
      scenarios,
      allScenarios,
      executedResults: g2Execution,
      gherkinPaths: scenarioResults.map((r) => r.gherkinPath),
    },
  });
  if (g2.escalated === true) {
    breakpointsHit.push('csr.seam.hypothesis-to-scenarios.gate-escalation');
  }
  const hypothesisToScenariosGate = { passed: g2.passed === true, attempts: g2.attempts, escalated: g2.escalated, issues: g2.issues, evidence: g2.evidence };

  if (hypothesisToScenariosGate.passed !== true) {
    return terminalFailure({
      ctx, PROCESS_ID, breakpointsHit, artifacts, domainModel, hypotheses, scenarios,
      seamGates: { domainToHypothesis: domainToHypothesisGate, hypothesisToScenarios: hypothesisToScenariosGate, flowToExperiment: null },
    });
  }

  const flowHandoff = await ctx.task(scenariosToFlowHandoffTask, {
    storefrontName,
    scenarios: allScenarios,
    boardColumns: ['backlog', 'ready', 'in-progress', 'review', 'done'],
    hypotheses,
    kipInsights,
  });
  const cards = flowHandoff.cards;

  // -------------------------------------------------------------------------
  // P4 — Kanban-managed implementation flow
  // -------------------------------------------------------------------------
  const board = await ctx.task(boardVisualizationTask, {
    projectName: storefrontName,
    workflowStages: ['backlog', 'ready', 'in-progress', 'review', 'done'],
    initialBacklog: cards,
    teamCapacity: maxParallelContexts,
  });
  const wipStatus = await ctx.task(wipLimitManagementTask, {
    projectName: storefrontName,
    board: board.board,
    wipLimits: board.wipLimits,
    cycleNumber: 1,
  });
  const pull = await ctx.task(pullSystemTask, {
    projectName: storefrontName,
    board: board.board,
    wipLimits: board.wipLimits,
    wipStatus,
    cycleNumber: 1,
  });

  const scenariosByCard = (card) => allScenarios.filter((s) => (card.scenarioIds ?? []).includes(s.scenarioId));
  const gherkinPathForContext = new Map(scenarioResults.map((r) => [r.contextId, r.gherkinPath]));
  const definitionOfDone = 'Every mapped BDD scenario for the card executes green; missing-signal handling is an explicit specified behavior with NO silent fallback ranking path.';
  const cardTaskArgs = (card) => ({
    card,
    scenarios: scenariosByCard(card),
    gherkinPath: gherkinPathForContext.get(card.contextId),
    ubiquitousLanguage: domainModel.ubiquitousLanguage,
    definitionOfDone,
    pull,
    kipInsights,
  });

  // parallelSafe cards fan out (chunked); dependent cards awaited in dependsOn order.
  const parallelCards = cards.filter((c) => c.parallelSafe === true);
  const dependentCards = orderByDependencies(cards.filter((c) => c.parallelSafe !== true));
  const cardResults = [];
  for (const cardGroup of chunk(parallelCards, maxParallelContexts)) {
    const groupResults = await ctx.parallel.all(
      cardGroup.map((card) => () => ctx.task(implementRecommendationCardTask, cardTaskArgs(card)))
    );
    cardResults.push(...groupResults);
  }
  for (const card of dependentCards) {
    cardResults.push(await ctx.task(implementRecommendationCardTask, cardTaskArgs(card)));
  }
  const scenarioTestMap = cardResults.flatMap((r) => r.scenarioTestMap ?? []);

  const flowMetrics = await ctx.task(flowMetricsTask, {
    projectName: storefrontName,
    board: { ...board.board, cardHistory: cardResults },
    cycleNumber: 1,
  });
  const flow = {
    boardPath: board.boardPath ?? board.artifactPath ?? null,
    wipLimits: board.wipLimits,
    flowMetrics,
    cardsImplemented: cardResults.map((r) => r.cardId),
  };

  // G3 — BDD/Kanban -> Experiment seam (executed evidence: re-run full BDD suite green).
  const g3Execution = await ctx.task(executeTestsTask, {
    projectName: storefrontName,
    feature: 'recommendation-behaviors (implemented build)',
    testFramework: 'cucumber',
    scenarios: allScenarios,
    stepImplementations: scenarioTestMap,
  });
  const g3 = await adversarialGate(ctx, {
    gateId: 'csr.seam.flow-to-experiment',
    artifact: {
      path: scenarioResults[0].gherkinPath,
      description: 'Implemented recommendation build + full BDD suite',
    },
    critics: [
      {
        name: 'bdd-green-critic',
        role: 'Acceptance re-execution auditor',
        focus: 're-run the FULL recommendation BDD suite; every in-scope scenario must be an EXECUTED pass (skipped/todo = FAIL)',
      },
      {
        name: 'flow-honesty-critic',
        role: 'Kanban flow auditor',
        focus: 'WIP limits respected; flow metrics come from real card history, not fabricated',
      },
      {
        name: 'no-fallback-ranking-critic',
        role: 'Anti-fallback reviewer',
        focus: 'the recommendation ranking has NO silent fallback path; missing-signal cases are explicit specified behaviors',
      },
    ],
    ironLaw: [
      'Do NOT trust implementer summaries or the flow report: re-execute the suite and inspect card history.',
      'Every in-scope scenario must map to an EXECUTED passing test.',
      'Any silent fallback ranking branch is an automatic FAIL.',
      'Cite executed command output and file:line.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      scenarioTestMap,
      executedResults: g3Execution,
      flowMetrics,
      wipLimits: board.wipLimits,
      cardsImplemented: flow.cardsImplemented,
    },
  });
  if (g3.escalated === true) {
    breakpointsHit.push('csr.seam.flow-to-experiment.gate-escalation');
  }
  const flowToExperimentGate = { passed: g3.passed === true, attempts: g3.attempts, escalated: g3.escalated, issues: g3.issues, evidence: g3.evidence };

  const seamGates = {
    domainToHypothesis: domainToHypothesisGate,
    hypothesisToScenarios: hypothesisToScenariosGate,
    flowToExperiment: flowToExperimentGate,
  };

  if (flowToExperimentGate.passed !== true) {
    return terminalFailure({ ctx, PROCESS_ID, breakpointsHit, artifacts, domainModel, hypotheses, scenarios, seamGates, flow });
  }

  // -------------------------------------------------------------------------
  // P5 — experiment launch (policy gate) + hypothesis validation
  // -------------------------------------------------------------------------
  const launchResult = await routedBreakpoint(ctx, {
    question: `Launch a live recommendation experiment for ${storefrontName} to real shopper traffic?`,
    hypotheses: hypotheses.map((h) => ({ hypothesisId: h.hypothesisId, statement: h.statement, primaryMetric: h.primaryMetric, upliftTarget: h.upliftTarget, guardrailMetrics: h.guardrailMetrics })),
    seamGates,
    flowMetrics,
  }, {
    breakpointId: 'experiment-launch-approval',
    expert: 'growth-product-lead',
    tags: ['policy-gated', 'csr', 'experiment'],
    strategy: 'single',
  });
  breakpointsHit.push('experiment-launch-approval');
  const experimentLaunch = breakpointProvenance('experiment-launch-approval', 'growth-product-lead', launchResult);

  if (experimentLaunch.approved !== true) {
    // Rejected launch: explicit failure — no lanes run, no rollout raised.
    return terminalFailure({
      ctx, PROCESS_ID, breakpointsHit, artifacts, domainModel, hypotheses, scenarios, seamGates, flow,
      experiment: { launch: experimentLaunch, lanes: [], analysis: null, validationGate: null },
    });
  }

  // Guarded executor: launch runs ONLY inside this approved branch.
  const guardrailMetrics = hypotheses.flatMap((h) => h.guardrailMetrics ?? []);
  const derivedLanes = experimentLanes ?? hypotheses.map((h) => ({
    laneId: `lane-${h.hypothesisId}`,
    variant: h.hypothesisId,
    description: h.statement,
  }));
  const launched = await ctx.task(launchExperimentTask, {
    storefrontName,
    approvedResponse: experimentLaunch.response,
    lanes: derivedLanes,
    guardrailMetrics,
    allocationPlan: { lanes: derivedLanes.map((l) => l.laneId), control: 'holdout' },
  });
  artifacts.push(...(launched.artifacts ?? []));

  const measurementPlanPaths = hypotheses.map((h) => h.measurementPlanPath).filter((p) => p !== null && p !== undefined);
  const laneResults = [];
  for (const laneGroup of chunk(derivedLanes, maxParallelContexts)) {
    const groupResults = await ctx.parallel.all(
      laneGroup.map((lane) => () =>
        ctx.task(experimentLaneTask, {
          lane,
          storefrontName,
          hypotheses,
          measurementPlanPaths,
          scenarios: allScenarios,
          allocation: launched.allocation,
          kipInsights,
        })
      )
    );
    laneResults.push(...groupResults);
  }
  for (const lane of laneResults) {
    artifacts.push(lane.rawDataPath);
  }

  const analysis = await ctx.task(analyzeResultsTask, {
    projectName: storefrontName,
    hypothesis: hypotheses,
    measurementPlan: hypotheses.map((h) => h.measurementPlan),
    experimentExecution: laneResults,
    significanceLevel: 0.05,
    context: { upliftTargets, guardrailMetrics, kipInsights },
  });

  // G4 — Experiment -> Rollout seam (REQUIRED executed evidence: recompute metrics + re-run BDD).
  const g4 = await adversarialGate(ctx, {
    gateId: 'csr.experiment-validation',
    artifact: {
      path: laneResults[0].rawDataPath,
      description: 'Experiment lane raw data + computed metrics + executed BDD output',
    },
    critics: [
      {
        name: 'metric-recompute-critic',
        role: 'Metric forensics reviewer',
        focus: 'recompute primary + guardrail metrics from each lane rawDataPath and compare to claimed computedMetrics; mismatch = FAIL',
      },
      {
        name: 'bdd-live-critic',
        role: 'Live acceptance auditor',
        focus: 're-execute the mapped BDD scenarios against the experiment build; behavior must match specs',
      },
      {
        name: 'statistical-rigor-critic',
        role: 'Experiment statistician',
        focus: 'uplift target met with adequate sample/power; no p-hacking; guardrails not breached',
      },
    ],
    ironLaw: [
      'Do NOT trust the lane runner: recompute the metrics from raw data yourself AND re-run the BDD scenarios.',
      'A claimed uplift not reproducible from rawDataPath is a FAIL.',
      'A breached guardrail is a FAIL regardless of primary-metric uplift.',
      'Cite recomputed values, executed BDD output, and file:line.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      lanes: laneResults,
      analysis,
      hypotheses,
      upliftTargets,
      guardrailMetrics,
    },
  });
  if (g4.escalated === true) {
    breakpointsHit.push('csr.experiment-validation.gate-escalation');
  }
  const validationGate = { passed: g4.passed === true, attempts: g4.attempts, escalated: g4.escalated, issues: g4.issues, evidence: g4.evidence };
  const experiment = { launch: experimentLaunch, lanes: laneResults, analysis, validationGate };

  if (validationGate.passed !== true) {
    return terminalFailure({ ctx, PROCESS_ID, breakpointsHit, artifacts, domainModel, hypotheses, scenarios, seamGates, flow, experiment });
  }

  // -------------------------------------------------------------------------
  // P6 — production rollout decision (policy-gated; only if G4 passed)
  // -------------------------------------------------------------------------
  const winningLane = pickWinningLane(laneResults);
  const rolloutResult = await routedBreakpoint(ctx, {
    question: `Roll the validated recommendation model out to full production for ${storefrontName}?`,
    winningLaneId: winningLane?.laneId ?? null,
    validationEvidence: validationGate.evidence,
    analysis,
  }, {
    breakpointId: 'recommendations-production-rollout',
    expert: 'product-owner',
    tags: ['policy-gated', 'csr', 'rollout'],
    strategy: 'single',
  });
  breakpointsHit.push('recommendations-production-rollout');
  const rolloutProvenance = breakpointProvenance('recommendations-production-rollout', 'product-owner', rolloutResult);

  let rollout;
  if (rolloutProvenance.approved === true) {
    // Guarded executor: production rollout runs ONLY inside this branch.
    const rolled = await ctx.task(productionRolloutTask, {
      storefrontName,
      approvedResponse: rolloutProvenance.response,
      validationEvidence: validationGate.evidence,
      winningLaneId: winningLane?.laneId ?? null,
      rolloutPlan: { winningLaneId: winningLane?.laneId ?? null },
    });
    artifacts.push(...(rolled.artifacts ?? []));
    rollout = { ...rolloutProvenance, rolledOut: rolled.rolledOut === true, rampSchedule: rolled.rampSchedule, rollbackTrigger: rolled.rollbackTrigger };
  } else {
    rollout = { ...rolloutProvenance, rolledOut: false };
  }

  // -------------------------------------------------------------------------
  // P7 — retro + seam report + kip assert
  // -------------------------------------------------------------------------
  const retro = await ctx.task(retrospectiveTask, {
    projectName: storefrontName,
    flowCycles: [{ cycle: 1, cards: cardResults }],
    board: board.board,
    metrics: flowMetrics,
    wipLimits: board.wipLimits,
    seamContext: { seamGates, experiment: { launch: experiment.launch, validationGate }, rollout },
  });

  const seamReport = await ctx.task(seamReportTask, {
    storefrontName,
    domainModel,
    hypotheses,
    scenarios,
    seamGates,
    experiment: { launch: experiment.launch, lanes: experiment.lanes.map((l) => ({ laneId: l.laneId, computedMetrics: l.computedMetrics })), validationGate },
    rollout,
    retro,
  });
  artifacts.push(seamReport.reportPath);

  const leakedHandoffs = seamReport.leakedHandoffs ?? [];
  let kipFactsAsserted = 0;
  if (kipEnabled) {
    const assertResult = await kipAssert(ctx, {
      kipDir,
      kipModel,
      kind: 'methodology-composition',
      facts: [
        {
          subject: 'process:composition-smart-product-recommendations',
          predicate: 'mapped-contexts-to-hypotheses',
          object: `${boundedContexts.length} contexts -> ${hypotheses.length} hypotheses`,
          props: { upliftTargetsMet: validationGate.passed === true },
        },
        {
          subject: 'process:composition-smart-product-recommendations',
          predicate: 'observed-seam',
          object: `domain->hypothesis->scenario->flow->experiment seams: ${leakedHandoffs.length} leaked handoffs`,
          props: { leakedHandoffs },
        },
        {
          subject: 'process:composition-smart-product-recommendations',
          predicate: 'experiment-outcome',
          object: winningLane?.laneId ?? 'none',
          props: { validationPassed: validationGate.passed === true, guardrailsHeld: !anyGuardrailBreached(laneResults) },
        },
        {
          subject: 'process:composition-smart-product-recommendations',
          predicate: 'provenance-summary',
          object: `launch approved:${experiment.launch.approved} auto:${experiment.launch.autoApproved}; rollout approved:${rollout.approved} auto:${rollout.autoApproved}`,
          props: { rolledOut: rollout.rolledOut === true },
        },
        {
          subject: 'process:composition-smart-product-recommendations',
          predicate: 'gate-summary',
          object: 'seam gate attempts',
          props: {
            g1Attempts: domainToHypothesisGate.attempts,
            g2Attempts: hypothesisToScenariosGate.attempts,
            g3Attempts: flowToExperimentGate.attempts,
            g4Attempts: validationGate.attempts,
            escalations: breakpointsHit.filter((b) => b.endsWith('.gate-escalation')).length,
          },
        },
      ],
    });
    kipFactsAsserted = assertResult.asserted;
  }

  const success = domainToHypothesisGate.passed === true
    && hypothesisToScenariosGate.passed === true
    && flowToExperimentGate.passed === true
    && validationGate.passed === true
    && experiment.launch.approved === true
    && (rollout.approved === true ? rollout.rolledOut === true : true);

  return {
    success,
    domainModel,
    hypotheses,
    scenarios,
    flow,
    seamGates,
    experiment,
    rollout,
    retro,
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: PROCESS_ID,
      runId: ctx.runId,
      breakpointsHit,
    },
  };
}

// ---------------------------------------------------------------------------
// terminal-failure shape — explicit success:false at each guarded early exit
// ---------------------------------------------------------------------------

/**
 * Build the explicit success:false result returned when a seam gate fails, the
 * experiment launch is rejected, or experiment validation fails. No fallback
 * path resumes the pipeline — a failed gate or rejected gate stops here.
 *
 * @param {object} parts
 * @returns {object} terminal result
 */
function terminalFailure(parts) {
  const {
    ctx,
    PROCESS_ID: processId,
    breakpointsHit,
    artifacts,
    domainModel = null,
    hypotheses = [],
    scenarios = [],
    seamGates,
    flow = null,
    experiment = null,
  } = parts;
  return {
    success: false,
    domainModel,
    hypotheses,
    scenarios,
    flow,
    seamGates,
    experiment,
    rollout: null,
    retro: null,
    kipFactsAsserted: 0,
    artifacts,
    metadata: {
      processId,
      runId: ctx.runId,
      breakpointsHit,
    },
  };
}

/**
 * Pick the winning lane by highest reproducible upliftVsControl among lanes
 * whose guardrails all held. Returns null when no lane qualifies — an honest
 * "no winner", never a silent fallback to an arbitrary lane.
 *
 * @param {Array} laneResults
 * @returns {object|null}
 */
function pickWinningLane(laneResults) {
  const qualified = laneResults.filter((lane) => !laneGuardrailBreached(lane));
  if (qualified.length === 0) return null;
  let best = null;
  for (const lane of qualified) {
    const uplift = lane.computedMetrics?.upliftVsControl;
    if (typeof uplift !== 'number') continue;
    if (best === null || uplift > best.computedMetrics.upliftVsControl) {
      best = lane;
    }
  }
  return best;
}

/**
 * True when any of a lane's computed guardrails is marked breached. A missing
 * guardrails array is treated as "none breached" — absence of a signal is not
 * a breach.
 *
 * @param {object} lane
 * @returns {boolean}
 */
function laneGuardrailBreached(lane) {
  const guardrails = lane.computedMetrics?.guardrails ?? [];
  return guardrails.some((g) => g && g.breached === true);
}

/**
 * True when at least one lane in the result set has a breached guardrail. Used
 * to gate promotion — any breach across lanes blocks the pipeline.
 *
 * @param {Array} laneResults
 * @returns {boolean}
 */
function anyGuardrailBreached(laneResults) {
  return laneResults.some((lane) => laneGuardrailBreached(lane));
}
