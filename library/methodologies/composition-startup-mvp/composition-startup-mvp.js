/**
 * @process methodologies/composition-startup-mvp
 * @description Startup MVP composition (methodology backlog Example 3): Shape Up shaping and
 *   betting decide WHAT fits the appetite; Example Mapping turns the bet into concrete
 *   rule/example cards per scope (parallel); TDD implements directly from mapped examples
 *   inside Scrum sprint cadence; appetite tracking runs the Shape Up circuit breaker with
 *   policy-gated scope cuts; an adversarial ship-readiness gate demands the TDD suite
 *   executed green with a verified example->test mapping before the policy-gated MVP ship;
 *   cool-down retro and kip assert close the cycle.
 * @composes library/methodologies/shape-up/shape-up.js (shaping, betting-table, hill chart,
 *   circuit breaker, cool-down concepts), library/methodologies/example-mapping/example-mapping.js
 *   (blue/yellow/green/red card session shape, gherkin output),
 *   library/methodologies/scrum/scrum.js (sprint planning/review/retro cadence),
 *   library/methodologies/tdd.js (red-green-refactor loop; NOTE tdd is a FILE at
 *   library/methodologies/tdd.js exporting only `process` — this composition defines its own
 *   Style-A csm.* tasks mirroring those modules' phase semantics rather than importing their
 *   task constants; atdd-tdd/ also exists on disk and is the acceptance-first sibling, not
 *   composed here)
 * @policyGatedActions bet-commitment (product-founder) — commit the betting-table decision and
 *   appetite for the cycle; scope-cut-approval (product-founder) — approve circuit-breaker
 *   scope cuts when appetite is exceeded; mvp-ship (product-founder) — ship the MVP release to
 *   users. Each raised via routedBreakpoint with breakpointId = actionId, expert
 *   'product-founder', tags ['policy-gated','csm', <phase-tag>], strategy 'single', no
 *   autoApproveAfterN; every executor branch guards on approved === true and records
 *   { approved, autoApproved: response?.autoApproved === true, breakpointId, expert, response }
 *   provenance in the output.
 * @supersedes the '📝 Not Implemented' status of backlog Example 3 only
 *   (library/methodologies/backlog.md ~line 1871-1951); no code module is replaced
 * @graph
 *   domains: [domain:software-engineering, domain:business]
 *   specializations: [specialization:qa-testing-automation]
 *   skillAreas: [skill-area:product-discovery, skill-area:prioritization-frameworks, skill-area:acceptance-testing]
 *   workflows: [workflow:product-discovery, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development]
 *   roles: [role:product-manager, role:tech-lead, role:qa-engineer]
 * @inputs { productName: string (required), mvpDescription: string (required),
 *   appetiteWeeks?: number (default 2 — startup pace, not 6), sprintLengthWeeks?: number
 *   (default 1; sprintCount = ceil(appetiteWeeks / sprintLengthWeeks), validated >= 1),
 *   teamContext?: string, maxFixAttempts?: number (default 2 — ship-gate fixer budget),
 *   maxScopeCutRounds?: number (default 1), kipEnabled?: boolean (default true),
 *   kipDir?: string (default '.a5c/kip'), kipModel?: string (default 'sonnet') }
 * @outputs { success: boolean, bet: { approved, breakpointId, expert, autoApproved, response },
 *   pitch: { pitchPath, appetiteWeeks, scopes, rabbitHoles, noGos },
 *   exampleMaps: array [{ scopeId, story, rules, examples, questions, gherkinPath }],
 *   sprints: array [{ sprint, goal, storiesCompleted, tddSummaries, hillChart, appetiteRemainingWeeks }],
 *   circuitBreaker: { tripped, scopeCut? { approved, breakpointId, cutScopes, response } },
 *   shipGate: { passed, attempts, escalated, issues, evidence },
 *   ship: { approved, shipped, breakpointId, expert, autoApproved, response },
 *   coolDown: { retroActions, coolDownNotes }, kipFactsAsserted: number, artifacts: array,
 *   metadata: { processId, runId, breakpointsHit, appetite: { budgetWeeks, consumedWeeks } } }
 * @example
 *   const result = await orchestrate('methodologies/composition-startup-mvp', {
 *     productName: 'FitTrack',
 *     mvpDescription: 'Fitness tracking mobile app MVP: workout logging and progress charts',
 *     appetiteWeeks: 2,
 *     sprintLengthWeeks: 1,
 *   });
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
} from '../../specializations/common-utilities/routed-gate-combinators.js';

const PROCESS_ID = 'methodologies/composition-startup-mvp';

// ---------------------------------------------------------------------------
// P1 — Shape Up shaping
// ---------------------------------------------------------------------------

export const shapingPitchTask = defineTask('csm.shaping-pitch', (args, taskCtx) => ({
  kind: 'agent',
  title: `Shape Up shaping: pitch for ${args.productName}`,
  agent: {
    name: 'product-shaper',
    prompt: {
      role: 'Shape Up shaper',
      task: `Shape the ${args.productName} MVP into a pitch that fits a ${args.appetiteWeeks}-week appetite`,
      context: args,
      instructions: [
        'Shape at the right abstraction: breadboard flows and fat-marker notes, no wireframes, no implementation detail.',
        'State the appetite as a constraint, not an estimate; everything in the pitch must plausibly fit appetiteWeeks.',
        'Name rabbit holes patched and explicit no-gos (out-of-scope temptations).',
        'Name 2-5 buildable scopes, each with a one-line demo criterion and a mustHave flag.',
        'Write the pitch document to disk and return its path.',
      ],
      outputFormat:
        'JSON with pitchPath string, appetiteWeeks number, scopes array [{scopeId, name, demoCriterion, mustHave}], rabbitHoles array, noGos array',
    },
    outputSchema: {
      type: 'object',
      required: ['pitchPath', 'appetiteWeeks', 'scopes', 'rabbitHoles', 'noGos'],
      properties: {
        pitchPath: { type: 'string' },
        appetiteWeeks: { type: 'number' },
        scopes: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['scopeId', 'name', 'demoCriterion', 'mustHave'],
            properties: {
              scopeId: { type: 'string' },
              name: { type: 'string' },
              demoCriterion: { type: 'string' },
              mustHave: { type: 'boolean' },
            },
          },
        },
        rabbitHoles: { type: 'array' },
        noGos: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csm', 'shape-up', 'shaping'],
}));

// ---------------------------------------------------------------------------
// P3 — story breakdown + Example Mapping elaboration
// ---------------------------------------------------------------------------

export const storyBreakdownTask = defineTask('csm.story-breakdown', (args, taskCtx) => ({
  kind: 'agent',
  title: `Story breakdown: ${args.productName}`,
  agent: {
    name: 'product-owner',
    prompt: {
      role: 'Product owner',
      task: 'Decompose the approved pitch scopes into vertical user stories',
      context: args,
      instructions: [
        'Decompose each pitch scope into vertical user stories; every story keeps its scopeId.',
        'Declare parallelSafe and dependsOn honestly — the orchestrator schedules from them.',
        'Do not add stories outside the pitch scopes or no-gos.',
      ],
      outputFormat:
        'JSON with stories array [{storyId, scopeId, asA, iWant, soThat, mustHave, parallelSafe, dependsOn}]',
    },
    outputSchema: {
      type: 'object',
      required: ['stories'],
      properties: {
        stories: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['storyId', 'scopeId', 'asA', 'iWant', 'soThat', 'mustHave', 'parallelSafe', 'dependsOn'],
            properties: {
              storyId: { type: 'string' },
              scopeId: { type: 'string' },
              asA: { type: 'string' },
              iWant: { type: 'string' },
              soThat: { type: 'string' },
              mustHave: { type: 'boolean' },
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
  labels: ['agent', 'csm', 'scrum', 'backlog'],
}));

export const exampleMappingSessionTask = defineTask('csm.example-mapping-session', (args, taskCtx) => ({
  kind: 'agent',
  title: `Example Mapping session: scope ${args.scope.scopeId}`,
  agent: {
    name: 'example-mapping-facilitator',
    prompt: {
      role: 'Example Mapping facilitator',
      task: `Run an Example Mapping session for scope ${args.scope.scopeId} (${args.scope.name})`,
      context: args,
      instructions: [
        "Run a 25-minute-session-shaped mapping for this scope's stories: blue story cards, yellow rule cards, green example cards (concrete, testable, each with a stable exampleId), red question cards.",
        "Resolve red cards from the pitch's no-gos and rabbit holes where possible; mark the rest blocking or deferred with rationale.",
        'Emit gherkin for every green card to gherkinPath; scenario names embed the exampleId.',
      ],
      outputFormat:
        'JSON with scopeId, cards {blue array, yellow array, green array [{exampleId, storyId, ruleRef, description}], red array [{question, blocking, resolution?}]}, gherkinPath string',
    },
    outputSchema: {
      type: 'object',
      required: ['scopeId', 'cards', 'gherkinPath'],
      properties: {
        scopeId: { type: 'string' },
        cards: {
          type: 'object',
          required: ['blue', 'yellow', 'green', 'red'],
          properties: {
            blue: { type: 'array', minItems: 1 },
            yellow: { type: 'array', minItems: 1 },
            green: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['exampleId', 'storyId', 'ruleRef', 'description'],
                properties: {
                  exampleId: { type: 'string' },
                  storyId: { type: 'string' },
                  ruleRef: { type: 'string' },
                  description: { type: 'string' },
                },
              },
            },
            red: {
              type: 'array',
              items: {
                type: 'object',
                required: ['question', 'blocking'],
                properties: {
                  question: { type: 'string' },
                  blocking: { type: 'boolean' },
                  resolution: { type: 'string' },
                },
              },
            },
          },
        },
        gherkinPath: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csm', 'example-mapping', 'elaboration'],
}));

// ---------------------------------------------------------------------------
// P4 — Scrum sprint setup + appetite mapping
// ---------------------------------------------------------------------------

export const sprintPlanningTask = defineTask('csm.sprint-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sprint planning: ${args.sprintCount} sprint(s) inside a ${args.budgetWeeks}-week appetite`,
  agent: {
    name: 'scrum-facilitator',
    prompt: {
      role: 'Scrum facilitator',
      task: 'Plan the sprint cadence for the MVP build inside the appetite boundary',
      context: args,
      instructions: [
        'Plan sprintCount sprints inside the appetite; sprint 1 goal must yield a demoable slice of a must-have scope.',
        'Definition of done: every green-card example of a completed story has an executed passing test.',
        'Carry unresolved blocking red cards as named sprint risks — never silently drop them.',
      ],
      outputFormat:
        'JSON with sprints array [{sprint, goal, storyIds}], definitionOfDone string, appetiteMapping {budgetWeeks, sprintCount, sprintLengthWeeks}',
    },
    outputSchema: {
      type: 'object',
      required: ['sprints', 'definitionOfDone', 'appetiteMapping'],
      properties: {
        sprints: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['sprint', 'goal', 'storyIds'],
            properties: {
              sprint: { type: 'number' },
              goal: { type: 'string' },
              storyIds: { type: 'array' },
            },
          },
        },
        definitionOfDone: { type: 'string' },
        appetiteMapping: {
          type: 'object',
          required: ['budgetWeeks', 'sprintCount', 'sprintLengthWeeks'],
          properties: {
            budgetWeeks: { type: 'number' },
            sprintCount: { type: 'number' },
            sprintLengthWeeks: { type: 'number' },
          },
        },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csm', 'scrum', 'planning'],
}));

// ---------------------------------------------------------------------------
// P5 — TDD implementation inside sprint cadence + circuit-breaker sensors
// ---------------------------------------------------------------------------

export const tddImplementStoryTask = defineTask('csm.tdd-implement-story', (args, taskCtx) => ({
  kind: 'agent',
  title: `TDD implement story ${args.story.storyId} (sprint ${args.sprint})`,
  agent: {
    name: 'tdd-implementer',
    prompt: {
      role: 'TDD implementer',
      task: `Implement story ${args.story.storyId} test-first from its mapped green-card examples`,
      context: args,
      instructions: [
        'For EACH green-card example of this story: write the failing test first (from its gherkin), make it pass minimally, refactor; record the mapping exampleId->testId.',
        'Run the tests and include the executed output excerpt — do not claim green without running.',
        'IRON LAW: report concerns and untested edges honestly; adversarial critics will re-execute.',
        "Stay inside the story's scope; no-gos are hard boundaries.",
      ],
      outputFormat:
        'JSON with storyId, summary, filesChanged array, exampleTestMap array [{exampleId, testId, testPath, cycle}]',
    },
    outputSchema: {
      type: 'object',
      required: ['storyId', 'summary', 'filesChanged', 'exampleTestMap'],
      properties: {
        storyId: { type: 'string' },
        summary: { type: 'string' },
        filesChanged: { type: 'array' },
        exampleTestMap: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['exampleId', 'testId', 'testPath', 'cycle'],
            properties: {
              exampleId: { type: 'string' },
              testId: { type: 'string' },
              testPath: { type: 'string' },
              cycle: { type: 'string', const: 'red-green-refactor' },
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
  labels: ['agent', 'csm', 'tdd', 'implementation'],
}));

export const sprintReviewTask = defineTask('csm.sprint-review', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sprint ${args.sprint} review`,
  agent: {
    name: 'scrum-facilitator',
    prompt: {
      role: 'Scrum facilitator',
      task: `Review sprint ${args.sprint} against the pitch demo criteria and place scopes on the hill chart`,
      context: args,
      instructions: [
        'Review each in-sprint scope against its pitch demoCriterion by inspecting the actual implementation and test output — not the implementer summary.',
        'Place every scope on the hill chart with a confidence note.',
      ],
      outputFormat:
        "JSON with sprint number, demoResults array (per scope vs demoCriterion), hillChart array [{scopeId, position: 'uphill'|'top'|'downhill'|'done', confidence}]",
    },
    outputSchema: {
      type: 'object',
      required: ['sprint', 'demoResults', 'hillChart'],
      properties: {
        sprint: { type: 'number' },
        demoResults: { type: 'array' },
        hillChart: {
          type: 'array',
          items: {
            type: 'object',
            required: ['scopeId', 'position', 'confidence'],
            properties: {
              scopeId: { type: 'string' },
              position: { type: 'string', enum: ['uphill', 'top', 'downhill', 'done'] },
              confidence: { type: 'string' },
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
  labels: ['agent', 'csm', 'scrum', 'review'],
}));

export const appetiteCheckTask = defineTask('csm.appetite-check', (args, taskCtx) => ({
  kind: 'agent',
  title: `Appetite check after sprint ${args.sprint}: ${args.consumedWeeks}/${args.budgetWeeks} weeks`,
  agent: {
    name: 'appetite-tracker',
    prompt: {
      role: 'Appetite tracker (Shape Up circuit breaker sensor)',
      task: 'Compute appetite consumption and forecast whether the remaining must-have work fits the remaining sprints',
      context: args,
      instructions: [
        'Compute consumed vs budget appetite and forecast whether remaining must-have scopes fit the remaining sprints from hill-chart positions.',
        'exceeded/forecastOverrun are evidence-backed booleans — cite the hill chart and backlog numbers, never gut feel.',
        'Recommend candidate scope cuts (nice-to-have first) if overrun; do not apply them.',
      ],
      outputFormat:
        'JSON with consumedWeeks, budgetWeeks, exceeded boolean, forecastOverrun boolean, evidence array (hill-chart deltas, remaining-story counts, executed test totals)',
    },
    outputSchema: {
      type: 'object',
      required: ['consumedWeeks', 'budgetWeeks', 'exceeded', 'forecastOverrun', 'evidence'],
      properties: {
        consumedWeeks: { type: 'number' },
        budgetWeeks: { type: 'number' },
        exceeded: { type: 'boolean' },
        forecastOverrun: { type: 'boolean' },
        evidence: { type: 'array', minItems: 1 },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csm', 'shape-up', 'circuit-breaker'],
}));

export const scopeCutProposalTask = defineTask('csm.scope-cut-proposal', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scope cut proposal (circuit breaker, sprint ${args.sprint})`,
  agent: {
    name: 'product-shaper',
    prompt: {
      role: 'Shape Up shaper',
      task: 'Propose the smallest scope cut that brings the remaining work back inside the appetite',
      context: args,
      instructions: [
        'Propose the smallest scope cut that brings remaining work inside the remaining appetite while keeping the MVP demoable.',
        'Must-have scopes may only be trimmed (variable scope), never dropped wholesale without flagging the MVP promise impact.',
      ],
      outputFormat:
        'JSON with proposedCuts array [{scopeId, whatIsLost, reversible}], retainedCore, rationale',
    },
    outputSchema: {
      type: 'object',
      required: ['proposedCuts', 'retainedCore', 'rationale'],
      properties: {
        proposedCuts: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['scopeId', 'whatIsLost', 'reversible'],
            properties: {
              scopeId: { type: 'string' },
              whatIsLost: { type: 'string' },
              reversible: { type: 'boolean' },
            },
          },
        },
        retainedCore: {},
        rationale: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csm', 'shape-up', 'scope-cut'],
}));

// ---------------------------------------------------------------------------
// P6 — executed-evidence ship-readiness report (gate artifact producer)
// ---------------------------------------------------------------------------

export const testSuiteExecutionTask = defineTask('csm.test-suite-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Execute full test suite + build ship-readiness report for ${args.productName}`,
  agent: {
    name: 'test-executor',
    prompt: {
      role: 'Test suite executor',
      task: 'Execute the full TDD suite and write the ship-readiness report with the example->test traceability matrix',
      context: args,
      instructions: [
        "EXECUTE the project's full test suite yourself (agent runs the test command); paste the raw output excerpt — a report without executed output is invalid.",
        "Build the example->test traceability matrix by joining every in-scope green-card exampleId to its executed test result; unmatched examples appear with status 'unmapped'.",
        'Write the ship-readiness report to reportPath; suitePassed only if failed === 0 AND no in-scope example is unmapped or skipped.',
      ],
      outputFormat:
        'JSON with reportPath, suitePassed boolean, totals {tests, passed, failed, skipped}, traceabilityMatrix array [{exampleId, scopeId, testId, status}], executedOutputExcerpt string',
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'suitePassed', 'totals', 'traceabilityMatrix', 'executedOutputExcerpt'],
      properties: {
        reportPath: { type: 'string' },
        suitePassed: { type: 'boolean' },
        totals: {
          type: 'object',
          required: ['tests', 'passed', 'failed', 'skipped'],
          properties: {
            tests: { type: 'number' },
            passed: { type: 'number' },
            failed: { type: 'number' },
            skipped: { type: 'number' },
          },
        },
        traceabilityMatrix: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            required: ['exampleId', 'scopeId', 'testId', 'status'],
            properties: {
              exampleId: { type: 'string' },
              scopeId: { type: 'string' },
              testId: { type: 'string' },
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
  labels: ['agent', 'csm', 'tdd', 'verification'],
}));

// ---------------------------------------------------------------------------
// P7 — guarded ship executor (invoked ONLY when mvp-ship approved === true)
// ---------------------------------------------------------------------------

export const shipMvpTask = defineTask('csm.ship-mvp', (args, taskCtx) => ({
  kind: 'agent',
  title: `Ship MVP: ${args.productName}`,
  agent: {
    name: 'release-engineer',
    prompt: {
      role: 'Release engineer',
      task: `Ship the approved ${args.productName} MVP release`,
      context: args,
      instructions: [
        'Perform the ship steps recorded in the approved plan (tag/package/release notes) exactly as approved; deviations require going back through the breakpoint, not improvisation.',
        'Record every produced artifact path.',
      ],
      outputFormat: 'JSON with shipped boolean, releaseNotes string, artifacts array',
    },
    outputSchema: {
      type: 'object',
      required: ['shipped', 'releaseNotes', 'artifacts'],
      properties: {
        shipped: { type: 'boolean' },
        releaseNotes: { type: 'string' },
        artifacts: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csm', 'ship', 'policy-gated'],
}));

// ---------------------------------------------------------------------------
// P8 — cool-down + retro
// ---------------------------------------------------------------------------

export const sprintRetrospectiveTask = defineTask('csm.sprint-retrospective', (args, taskCtx) => ({
  kind: 'agent',
  title: `Whole-cycle retrospective: ${args.productName}`,
  agent: {
    name: 'scrum-facilitator',
    prompt: {
      role: 'Scrum facilitator',
      task: 'Run the whole-cycle retrospective across all sprints of this MVP cycle',
      context: args,
      instructions: [
        'Whole-cycle retro across all sprints: seams between Shape Up/Example Mapping/TDD/Scrum are first-class retro topics (where did handoffs leak?).',
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
  labels: ['agent', 'csm', 'scrum', 'retro'],
}));

export const coolDownTask = defineTask('csm.cool-down', (args, taskCtx) => ({
  kind: 'agent',
  title: `Cool-down (${args.reason}): ${args.productName}`,
  agent: {
    name: 'product-shaper',
    prompt: {
      role: 'Shape Up cool-down steward',
      task: `Capture cool-down work for ${args.productName} (reason: ${args.reason})`,
      context: args,
      instructions: [
        'Capture cool-down work: bugs, refactors, next-cycle shaping candidates. Explicitly NO commitments — candidates only.',
        "When invoked with reason 'bet-passed', capture why the bet passed and what would change the next pitch.",
      ],
      outputFormat: 'JSON with bugList array, refactorCandidates array, nextShapeCandidates array',
    },
    outputSchema: {
      type: 'object',
      required: ['bugList', 'refactorCandidates', 'nextShapeCandidates'],
      properties: {
        bugList: { type: 'array' },
        refactorCandidates: { type: 'array' },
        nextShapeCandidates: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'csm', 'shape-up', 'cool-down'],
}));

// ---------------------------------------------------------------------------
// helpers (pure, no fallbacks)
// ---------------------------------------------------------------------------

/**
 * Order the given stories so every story appears after all of its in-set
 * dependsOn stories. Throws on unknown dependency targets inside the set
 * being cyclic — dependency cycles are a planning bug, not a schedulable state.
 */
function orderByDependencies(stories) {
  const inSet = new Map(stories.map((s) => [s.storyId, s]));
  const ordered = [];
  const done = new Set();
  const visiting = new Set();

  const visit = (story) => {
    if (done.has(story.storyId)) return;
    if (visiting.has(story.storyId)) {
      throw new Error(`composition-startup-mvp: dependency cycle detected at story ${story.storyId}`);
    }
    visiting.add(story.storyId);
    for (const depId of story.dependsOn ?? []) {
      const dep = inSet.get(depId);
      if (dep) visit(dep);
    }
    visiting.delete(story.storyId);
    done.add(story.storyId);
    ordered.push(story);
  };

  for (const story of stories) visit(story);
  return ordered;
}

function breakpointProvenance(breakpointId, expert, result) {
  return {
    approved: result.approved === true,
    autoApproved: result.response?.autoApproved === true,
    breakpointId,
    expert,
    response: result.response ?? null,
  };
}

// ---------------------------------------------------------------------------
// process — P0..P8
// ---------------------------------------------------------------------------

/**
 * Startup MVP composition: Shape Up (shape/bet/circuit-breaker/cool-down) +
 * Example Mapping (per-scope elaboration) + TDD (example-driven build) +
 * Scrum (sprint cadence), with policy-gated bet/scope-cut/ship and an
 * adversarial executed-evidence ship-readiness gate.
 *
 * @param {object} inputs - Process inputs (see @inputs)
 * @param {object} ctx - Orchestration context
 * @returns {Promise<object>} Result (see @outputs)
 */
export async function process(inputs, ctx) {
  const {
    productName,
    mvpDescription,
    appetiteWeeks = 2,
    sprintLengthWeeks = 1,
    teamContext = '',
    maxFixAttempts = 2,
    maxScopeCutRounds = 1,
    kipEnabled = true,
    kipDir = '.a5c/kip',
    kipModel = 'sonnet',
  } = inputs ?? {};

  // No fallbacks: invalid inputs throw before any orchestration happens.
  if (typeof productName !== 'string' || productName.trim() === '') {
    throw new Error(`composition-startup-mvp: productName is required (got ${JSON.stringify(productName)})`);
  }
  if (typeof mvpDescription !== 'string' || mvpDescription.trim() === '') {
    throw new Error(`composition-startup-mvp: mvpDescription is required (got ${JSON.stringify(mvpDescription)})`);
  }
  if (typeof appetiteWeeks !== 'number' || !Number.isFinite(appetiteWeeks) || appetiteWeeks <= 0) {
    throw new Error(`composition-startup-mvp: appetiteWeeks must be a positive number (got ${JSON.stringify(appetiteWeeks)})`);
  }
  if (typeof sprintLengthWeeks !== 'number' || !Number.isFinite(sprintLengthWeeks) || sprintLengthWeeks <= 0) {
    throw new Error(`composition-startup-mvp: sprintLengthWeeks must be a positive number (got ${JSON.stringify(sprintLengthWeeks)})`);
  }
  if (!Number.isInteger(maxFixAttempts) || maxFixAttempts < 0) {
    throw new Error(`composition-startup-mvp: maxFixAttempts must be a non-negative integer (got ${JSON.stringify(maxFixAttempts)})`);
  }
  if (!Number.isInteger(maxScopeCutRounds) || maxScopeCutRounds < 0) {
    throw new Error(`composition-startup-mvp: maxScopeCutRounds must be a non-negative integer (got ${JSON.stringify(maxScopeCutRounds)})`);
  }

  const plannedSprintCount = Math.ceil(appetiteWeeks / sprintLengthWeeks);
  if (plannedSprintCount < 1) {
    throw new Error(`composition-startup-mvp: computed sprintCount must be >= 1 (got ${plannedSprintCount})`);
  }

  const breakpointsHit = [];
  const artifacts = [];

  // -------------------------------------------------------------------------
  // P0 — kip recall (methodology-composition)
  // -------------------------------------------------------------------------
  let kipInsights = [];
  if (kipEnabled) {
    const recall = await kipRecall(ctx, {
      kipDir,
      topic: `startup-mvp composition handoffs: Shape Up appetite vs Scrum sprint mapping for ${productName}`,
      kipModel,
      kind: 'methodology-composition',
    });
    kipInsights = recall.insights ?? [];
  }

  // -------------------------------------------------------------------------
  // P1 — Shape Up shaping
  // -------------------------------------------------------------------------
  const pitchResult = await ctx.task(shapingPitchTask, {
    productName,
    mvpDescription,
    appetiteWeeks,
    teamContext,
    kipInsights,
  });
  const pitch = {
    pitchPath: pitchResult.pitchPath,
    appetiteWeeks: pitchResult.appetiteWeeks,
    scopes: pitchResult.scopes,
    rabbitHoles: pitchResult.rabbitHoles,
    noGos: pitchResult.noGos,
  };
  artifacts.push(pitch.pitchPath);

  // -------------------------------------------------------------------------
  // P2 — Betting table (policy-gated bet-commitment)
  // -------------------------------------------------------------------------
  const betResult = await routedBreakpoint(ctx, {
    question: `Betting table for ${productName}: bet the ${appetiteWeeks}-week appetite on this pitch, or pass?`,
    pitchPath: pitch.pitchPath,
    appetiteWeeks,
    scopes: pitch.scopes,
    rabbitHoles: pitch.rabbitHoles,
    noGos: pitch.noGos,
    kipInsights,
  }, {
    breakpointId: 'bet-commitment',
    expert: 'product-founder',
    tags: ['policy-gated', 'csm', 'betting-table'],
    strategy: 'single',
  });
  breakpointsHit.push('bet-commitment');
  const bet = breakpointProvenance('bet-commitment', 'product-founder', betResult);

  if (bet.approved !== true) {
    // A pass is a valid Shape Up outcome, not an error: cool-down + kip assert
    // still run, and nothing downstream is ever invoked.
    const passCoolDown = await ctx.task(coolDownTask, {
      productName,
      reason: 'bet-passed',
      pitch,
      betResponse: bet.response,
    });
    let kipFactsAsserted = 0;
    if (kipEnabled) {
      const assertResult = await kipAssert(ctx, {
        kipDir,
        kipModel,
        kind: 'methodology-composition',
        facts: [
          {
            subject: `process:composition-startup-mvp`,
            predicate: 'bet-passed',
            object: productName,
            props: { appetiteWeeks, autoApproved: bet.autoApproved },
          },
          {
            subject: `process:composition-startup-mvp`,
            predicate: 'observed-seam',
            object: `betting-table pass for ${productName}: pitch did not earn the appetite`,
            props: { pitchPath: pitch.pitchPath, scopeCount: pitch.scopes.length },
          },
        ],
      });
      kipFactsAsserted = assertResult.asserted;
    }
    return {
      success: false,
      bet,
      pitch,
      exampleMaps: [],
      sprints: [],
      circuitBreaker: { tripped: false },
      shipGate: null,
      ship: null,
      coolDown: { retroActions: [], coolDownNotes: passCoolDown },
      kipFactsAsserted,
      artifacts,
      metadata: {
        processId: PROCESS_ID,
        runId: ctx.runId,
        breakpointsHit,
        appetite: { budgetWeeks: appetiteWeeks, consumedWeeks: 0 },
      },
    };
  }

  // -------------------------------------------------------------------------
  // P3 — story breakdown + Example Mapping elaboration (parallel per scope)
  // -------------------------------------------------------------------------
  const breakdown = await ctx.task(storyBreakdownTask, {
    productName,
    mvpDescription,
    pitch,
    kipInsights,
  });
  const stories = breakdown.stories;

  const exampleMaps = await ctx.parallel.all(
    pitch.scopes.map((scope) => () =>
      ctx.task(exampleMappingSessionTask, {
        scope,
        stories: stories.filter((s) => s.scopeId === scope.scopeId),
        pitch,
      })
    )
  );
  for (const map of exampleMaps) {
    artifacts.push(map.gherkinPath);
  }
  const unresolvedBlockingRedCards = exampleMaps.flatMap((map) =>
    (map.cards.red ?? [])
      .filter((card) => card.blocking === true && !card.resolution)
      .map((card) => ({ scopeId: map.scopeId, question: card.question }))
  );

  // -------------------------------------------------------------------------
  // P4 — Scrum sprint setup + appetite mapping
  // -------------------------------------------------------------------------
  const plan = await ctx.task(sprintPlanningTask, {
    productName,
    stories,
    exampleMaps,
    sprintCount: plannedSprintCount,
    sprintLengthWeeks,
    budgetWeeks: appetiteWeeks,
    unresolvedBlockingRedCards,
    kipInsights,
  });

  const storyById = new Map(stories.map((s) => [s.storyId, s]));

  // -------------------------------------------------------------------------
  // P5 — sprint execution loop (TDD inside cadence) + circuit breaker
  // -------------------------------------------------------------------------
  const sprints = [];
  const tddResults = [];
  const implementedStoryIds = new Set();
  const cutScopeIds = new Set();
  const circuitBreaker = { tripped: false };
  let scopeCutRounds = 0;
  let extendGranted = false;
  let sprintCount = plannedSprintCount;
  let consumedWeeks = 0;
  let stoppedEarly = false;

  for (let sprint = 1; sprint <= sprintCount && !stoppedEarly; sprint++) {
    let goal;
    let sprintStoryIds;
    const planned = plan.sprints.find((sp) => sp.sprint === sprint);
    if (planned) {
      goal = planned.goal;
      sprintStoryIds = planned.storyIds;
    } else if (extendGranted && sprint === sprintCount) {
      // Founder-granted one-time extension sprint: finish what is planned but
      // not yet implemented. An explicit decision, not a fallback.
      goal = `Extension sprint (founder-granted): complete remaining planned stories for ${productName}`;
      sprintStoryIds = plan.sprints
        .flatMap((sp) => sp.storyIds)
        .filter((id) => !implementedStoryIds.has(id));
    } else {
      throw new Error(`composition-startup-mvp: sprint plan has no entry for sprint ${sprint}`);
    }

    const sprintStories = sprintStoryIds.map((id) => {
      const story = storyById.get(id);
      if (!story) {
        throw new Error(`composition-startup-mvp: sprint ${sprint} references unknown story ${id}`);
      }
      return story;
    }).filter((story) => !cutScopeIds.has(story.scopeId) && !implementedStoryIds.has(story.storyId));

    const mapsByScope = new Map(exampleMaps.map((m) => [m.scopeId, m]));
    const taskArgsFor = (story) => ({
      story,
      sprint,
      goal,
      exampleMap: mapsByScope.get(story.scopeId),
      pitch,
      definitionOfDone: plan.definitionOfDone,
    });

    // (a) parallelSafe stories fan out; dependent stories are awaited in
    // dependsOn order — never speculatively co-scheduled.
    const parallelStories = sprintStories.filter((s) => s.parallelSafe === true);
    const dependentStories = orderByDependencies(sprintStories.filter((s) => s.parallelSafe !== true));

    const sprintTddResults = [];
    if (parallelStories.length > 0) {
      const parallelResults = await ctx.parallel.all(
        parallelStories.map((story) => () => ctx.task(tddImplementStoryTask, taskArgsFor(story)))
      );
      sprintTddResults.push(...parallelResults);
    }
    for (const story of dependentStories) {
      sprintTddResults.push(await ctx.task(tddImplementStoryTask, taskArgsFor(story)));
    }
    for (const result of sprintTddResults) {
      implementedStoryIds.add(result.storyId);
      tddResults.push(result);
    }

    // (b) sprint review — demo vs pitch criteria, hill-chart positions.
    const review = await ctx.task(sprintReviewTask, {
      sprint,
      goal,
      pitch,
      tddResults: sprintTddResults,
      cutScopeIds: [...cutScopeIds],
    });

    // (c) appetite check — the Shape Up circuit-breaker sensor.
    consumedWeeks = sprint * sprintLengthWeeks;
    const appetiteCheck = await ctx.task(appetiteCheckTask, {
      sprint,
      consumedWeeks,
      budgetWeeks: appetiteWeeks,
      sprintLengthWeeks,
      remainingSprints: sprintCount - sprint,
      hillChart: review.hillChart,
      remainingStoryIds: stories
        .filter((s) => !implementedStoryIds.has(s.storyId) && !cutScopeIds.has(s.scopeId))
        .map((s) => s.storyId),
      kipInsights,
    });

    sprints.push({
      sprint,
      goal,
      storiesCompleted: sprintTddResults.map((r) => r.storyId),
      tddSummaries: sprintTddResults.map((r) => ({ storyId: r.storyId, summary: r.summary })),
      hillChart: review.hillChart,
      appetiteRemainingWeeks: appetiteWeeks - consumedWeeks,
    });

    // Circuit breaker: at most maxScopeCutRounds rounds, policy-gated cuts.
    const overrun = appetiteCheck.exceeded === true || appetiteCheck.forecastOverrun === true;
    if (overrun && scopeCutRounds < maxScopeCutRounds) {
      scopeCutRounds++;
      circuitBreaker.tripped = true;

      const proposal = await ctx.task(scopeCutProposalTask, {
        sprint,
        appetiteCheck,
        hillChart: review.hillChart,
        pitch,
        remainingStoryIds: stories
          .filter((s) => !implementedStoryIds.has(s.storyId) && !cutScopeIds.has(s.scopeId))
          .map((s) => s.storyId),
      });

      const cutResult = await routedBreakpoint(ctx, {
        question: `Appetite exceeded for ${productName}: approve the proposed scope cuts?`,
        appetiteCheck,
        hillChart: review.hillChart,
        proposedCuts: proposal.proposedCuts,
        retainedCore: proposal.retainedCore,
        rationale: proposal.rationale,
      }, {
        breakpointId: 'scope-cut-approval',
        expert: 'product-founder',
        tags: ['policy-gated', 'csm', 'circuit-breaker'],
        strategy: 'single',
      });
      breakpointsHit.push('scope-cut-approval');
      const cutProvenance = breakpointProvenance('scope-cut-approval', 'product-founder', cutResult);

      if (cutProvenance.approved === true) {
        const cutScopes = proposal.proposedCuts.map((c) => c.scopeId);
        for (const scopeId of cutScopes) cutScopeIds.add(scopeId);
        circuitBreaker.scopeCut = { ...cutProvenance, cutScopes };
        // Approved cuts: proceed to the ship-readiness gate with the reduced
        // must-have set.
        stoppedEarly = true;
      } else {
        // Honor the founder's explicit decision — no silent extension, no
        // fallback path.
        const response = cutProvenance.response;
        const decision = typeof response === 'string' ? response : response?.decision;
        circuitBreaker.scopeCut = { ...cutProvenance, cutScopes: [] };
        if (decision === 'extend-one-sprint') {
          if (extendGranted) {
            throw new Error('composition-startup-mvp: extend-one-sprint may be granted only once per cycle');
          }
          extendGranted = true;
          sprintCount += 1;
        } else if (decision === 'stop-and-ship-what-is-done') {
          stoppedEarly = true;
        } else {
          throw new Error(
            `composition-startup-mvp: scope-cut-approval rejected without a recognized decision ` +
            `(expected 'extend-one-sprint' or 'stop-and-ship-what-is-done', got ${JSON.stringify(decision)})`
          );
        }
      }
    }
  }

  // -------------------------------------------------------------------------
  // P6 — ship-readiness adversarial gate (executed evidence)
  // -------------------------------------------------------------------------
  const inScopeExampleMaps = exampleMaps.filter((m) => !cutScopeIds.has(m.scopeId));
  const suiteRun = await ctx.task(testSuiteExecutionTask, {
    productName,
    exampleMaps: inScopeExampleMaps,
    tddResults,
    cutScopeIds: [...cutScopeIds],
    definitionOfDone: plan.definitionOfDone,
    noGos: pitch.noGos,
  });
  artifacts.push(suiteRun.reportPath);

  const gate = await adversarialGate(ctx, {
    gateId: 'csm.ship-readiness',
    artifact: {
      path: suiteRun.reportPath,
      description: 'Ship-readiness report: executed suite output + example->test traceability matrix',
    },
    critics: [
      {
        name: 'example-coverage-critic',
        role: 'Acceptance coverage auditor',
        focus: "every in-scope green-card example maps to an EXECUTED passing test; re-run the suite and diff against the report's matrix and totals",
      },
      {
        name: 'tdd-evidence-critic',
        role: 'TDD forensics reviewer',
        focus: 'tests are real behavioral tests derived from the gherkin (not tautologies/snapshots-of-nothing); red-green history plausible from commits; executed output matches claims',
      },
      {
        name: 'mvp-scope-critic',
        role: 'MVP scope auditor',
        focus: 'all must-have scopes (post-approved-cuts) meet their pitch demoCriterion; no no-go scope crept in; approved cuts actually applied',
      },
    ],
    ironLaw: [
      'Do NOT trust the report or the implementers: re-execute the test suite yourself and compare output.',
      'Every in-scope green-card example must map to at least one EXECUTED passing test — a mapping to a skipped, todo, or unexecuted test is a FAIL.',
      'Cite executed command output and file:line for every claim.',
    ],
    maxFixAttempts,
    fixer: {},
    context: {
      traceabilityMatrix: suiteRun.traceabilityMatrix,
      totals: suiteRun.totals,
      pitchScopes: pitch.scopes,
      cutScopeIds: [...cutScopeIds],
      noGos: pitch.noGos,
    },
  });
  if (gate.escalated === true) {
    breakpointsHit.push('csm.ship-readiness.gate-escalation');
  }
  const shipGate = {
    passed: gate.passed === true,
    attempts: gate.attempts,
    escalated: gate.escalated,
    issues: gate.issues,
    evidence: gate.evidence,
  };

  if (shipGate.passed !== true) {
    // Failed gate: explicit failure — mvp-ship is never raised.
    return {
      success: false,
      bet,
      pitch,
      exampleMaps,
      sprints,
      circuitBreaker,
      shipGate,
      ship: null,
      coolDown: null,
      kipFactsAsserted: 0,
      artifacts,
      metadata: {
        processId: PROCESS_ID,
        runId: ctx.runId,
        breakpointsHit,
        appetite: { budgetWeeks: appetiteWeeks, consumedWeeks },
      },
    };
  }

  // -------------------------------------------------------------------------
  // P7 — MVP ship (policy-gated; only reached with shipGate.passed === true)
  // -------------------------------------------------------------------------
  const shipResult = await routedBreakpoint(ctx, {
    question: `Ship the ${productName} MVP to users?`,
    reportPath: suiteRun.reportPath,
    gateEvidence: shipGate.evidence,
    gateAttempts: shipGate.attempts,
    traceabilityMatrix: suiteRun.traceabilityMatrix,
    scopeCut: circuitBreaker.scopeCut ?? null,
    releaseNotesDraft: {
      productName,
      storiesCompleted: [...implementedStoryIds],
      sprints: sprints.map((s) => ({ sprint: s.sprint, goal: s.goal })),
    },
  }, {
    breakpointId: 'mvp-ship',
    expert: 'product-founder',
    tags: ['policy-gated', 'csm', 'ship'],
    strategy: 'single',
  });
  breakpointsHit.push('mvp-ship');
  const shipProvenance = breakpointProvenance('mvp-ship', 'product-founder', shipResult);

  let ship;
  if (shipProvenance.approved === true) {
    // Guarded executor: shipMvpTask runs ONLY inside this branch.
    const shipped = await ctx.task(shipMvpTask, {
      productName,
      reportPath: suiteRun.reportPath,
      traceabilityMatrix: suiteRun.traceabilityMatrix,
      approvedResponse: shipProvenance.response,
      cutScopeIds: [...cutScopeIds],
    });
    artifacts.push(...(shipped.artifacts ?? []));
    ship = { ...shipProvenance, shipped: shipped.shipped === true, releaseNotes: shipped.releaseNotes };
  } else {
    ship = { ...shipProvenance, shipped: false };
  }

  // -------------------------------------------------------------------------
  // P8 — cool-down + retro + kip assert
  // -------------------------------------------------------------------------
  const retro = await ctx.task(sprintRetrospectiveTask, {
    productName,
    sprints,
    circuitBreaker,
    shipGate,
    ship,
    unresolvedBlockingRedCards,
  });
  const coolDownNotes = await ctx.task(coolDownTask, {
    productName,
    reason: 'cycle-complete',
    sprints,
    ship,
    retroActions: retro.actions,
  });

  let kipFactsAsserted = 0;
  if (kipEnabled) {
    const totalExamples = inScopeExampleMaps.reduce((n, m) => n + m.cards.green.length, 0);
    const totalTests = tddResults.reduce((n, r) => n + r.exampleTestMap.length, 0);
    const assertResult = await kipAssert(ctx, {
      kipDir,
      kipModel,
      kind: 'methodology-composition',
      facts: [
        {
          subject: 'process:composition-startup-mvp',
          predicate: 'mapped-appetite-to-sprints',
          object: `${appetiteWeeks}w -> ${sprintCount}x${sprintLengthWeeks}w`,
          props: { forecastAccurate: circuitBreaker.tripped !== true, extendGranted },
        },
        {
          subject: 'process:composition-startup-mvp',
          predicate: 'circuit-breaker-outcome',
          object: circuitBreaker.tripped === true ? 'tripped' : 'not-tripped',
          props: {
            cutScopes: circuitBreaker.scopeCut?.cutScopes ?? [],
            founderDecision: circuitBreaker.scopeCut?.approved === true
              ? 'cuts-approved'
              : (circuitBreaker.tripped === true ? 'cuts-rejected' : 'not-raised'),
          },
        },
        {
          subject: 'process:composition-startup-mvp',
          predicate: 'example-coverage',
          object: `${totalExamples} examples -> ${totalTests} tests`,
          props: { gateAttempts: shipGate.attempts, escalated: shipGate.escalated },
        },
        {
          subject: 'process:composition-startup-mvp',
          predicate: 'provenance-summary',
          object: `bet approved:${bet.approved} auto:${bet.autoApproved}; ship approved:${ship.approved} auto:${ship.autoApproved}`,
          props: { shipped: ship.shipped },
        },
        {
          subject: 'process:composition-startup-mvp',
          predicate: 'observed-seam',
          object: `discovery->bet->build seams for ${productName}: ${unresolvedBlockingRedCards.length} blocking red card(s) survived elaboration into the build`,
          props: { unresolvedBlockingRedCards },
        },
      ],
    });
    kipFactsAsserted = assertResult.asserted;
  }

  return {
    success: bet.approved === true && shipGate.passed === true && ship.approved === true && ship.shipped === true,
    bet,
    pitch,
    exampleMaps,
    sprints,
    circuitBreaker,
    shipGate,
    ship,
    coolDown: { retroActions: retro.actions, coolDownNotes },
    kipFactsAsserted,
    artifacts,
    metadata: {
      processId: PROCESS_ID,
      runId: ctx.runId,
      breakpointsHit,
      appetite: { budgetWeeks: appetiteWeeks, consumedWeeks },
    },
  };
}
