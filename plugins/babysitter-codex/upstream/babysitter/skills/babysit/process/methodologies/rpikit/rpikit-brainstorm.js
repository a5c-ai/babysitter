/**
 * @process methodologies/rpikit/rpikit-brainstorm
 * @description RPIKit Brainstorming Phase - Clarifies vague requirements through exploratory questioning before research begins. Used when "what to build" is unclear.
 * @inputs { topic: string, constraints?: object, priorDiscussions?: array }
 * @outputs { success: boolean, clarifiedRequirements: array, exploredOptions: array, recommendation: string, readyForResearch: boolean }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const exploreProblemSpaceTask = defineTask('rpikit-explore-problem', async (args, _ctx) => {
  return { exploration: args };
}, {
  kind: 'agent',
  title: 'Explore Problem Space with Clarifying Questions',
  labels: ['rpikit', 'brainstorm', 'exploration'],
  io: {
    inputs: { topic: 'string', constraints: 'object', priorDiscussions: 'array' },
    outputs: { clarifyingQuestions: 'array', assumptions: 'array', ambiguities: 'array' }
  }
});

const generateOptionsTask = defineTask('rpikit-generate-options', async (args, _ctx) => {
  return { options: args };
}, {
  kind: 'agent',
  title: 'Generate Design Options and Trade-offs',
  labels: ['rpikit', 'brainstorm', 'options'],
  io: {
    inputs: { topic: 'string', clarifiedContext: 'object', constraints: 'object' },
    outputs: { options: 'array', tradeoffs: 'array', recommendation: 'string', rationale: 'string' }
  }
});

const synthesizeRequirementsTask = defineTask('rpikit-synthesize-reqs', async (args, _ctx) => {
  return { requirements: args };
}, {
  kind: 'agent',
  title: 'Synthesize Requirements from Brainstorm',
  labels: ['rpikit', 'brainstorm', 'synthesis'],
  io: {
    inputs: { topic: 'string', exploredOptions: 'array', selectedApproach: 'string' },
    outputs: { requirements: 'array', scope: 'string', outOfScope: 'array', readyForResearch: 'boolean' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * RPIKit Brainstorming Phase Process
 *
 * Addresses "what to build" when requirements lack clarity. Distinguishes
 * from research (which addresses "how" when the goal is defined).
 *
 * Workflow:
 * 1. Explore the problem space with clarifying questions
 * 2. Human provides answers and context
 * 3. Generate design options with trade-offs
 * 4. Human selects approach
 * 5. Synthesize clarified requirements
 *
 * Attribution: Adapted from https://github.com/bostonaholic/rpikit by Matthew Boston
 */
export async function process(inputs, ctx) {
  const {
    topic,
    constraints = {},
    priorDiscussions = []
  } = inputs;

  ctx.log('RPIKit Brainstorm: Clarifying requirements before research');
  ctx.log('Distinction: Brainstorming = "what to build"; Research = "how it works"');

  // Phase 1: Explore problem space
  ctx.log('Phase 1: Exploring problem space');

  const exploration = await ctx.task(exploreProblemSpaceTask, {
    topic,
    constraints,
    priorDiscussions
  });

  await ctx.breakpoint({
    question: `${exploration.clarifyingQuestions.length} clarifying questions identified. ${exploration.ambiguities.length} ambiguities found. Please review and provide answers to proceed.`,
    title: 'Brainstorm: Clarifying Questions',
    context: { runId: ctx.runId }
  });

  // Phase 2: Generate options
  ctx.log('Phase 2: Generating design options');

  const options = await ctx.task(generateOptionsTask, {
    topic,
    clarifiedContext: exploration,
    constraints
  });

  await ctx.breakpoint({
    question: `${options.options.length} design options generated. Recommendation: "${options.recommendation}" (${options.rationale}). Select an approach to proceed.`,
    title: 'Brainstorm: Design Options',
    context: { runId: ctx.runId }
  });

  // Phase 3: Synthesize requirements
  ctx.log('Phase 3: Synthesizing requirements');

  const synthesis = await ctx.task(synthesizeRequirementsTask, {
    topic,
    exploredOptions: options.options,
    selectedApproach: options.recommendation
  });

  return {
    success: true,
    topic,
    clarifiedRequirements: synthesis.requirements,
    exploredOptions: options.options,
    recommendation: options.recommendation,
    readyForResearch: synthesis.readyForResearch,
    scope: synthesis.scope,
    outOfScope: synthesis.outOfScope,
    metadata: {
      processId: 'methodologies/rpikit/rpikit-brainstorm',
      attribution: 'https://github.com/bostonaholic/rpikit',
      author: 'Matthew Boston',
      timestamp: ctx.now()
    }
  };
}
