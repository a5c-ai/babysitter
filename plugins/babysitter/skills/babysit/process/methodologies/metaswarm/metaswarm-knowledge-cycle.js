/**
 * @process methodologies/metaswarm/metaswarm-knowledge-cycle
 * @description Metaswarm Knowledge Cycle - Context priming before work (bd prime) and self-reflection after completion to extract patterns, gotchas, decisions, and anti-patterns into the knowledge base
 * @inputs { workType?: string, issueDescription?: string, completedWorkUnits?: array, reviewResults?: array, mode: string }
 * @outputs { success: boolean, knowledgeItems: array, contextLoaded?: object, reflections?: object, summary: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const primeContextTask = defineTask('metaswarm-prime-context', async (args, _ctx) => {
  return { context: args };
}, {
  kind: 'agent',
  title: 'Prime Agent Context from Knowledge Base',
  labels: ['metaswarm', 'knowledge', 'priming'],
  io: {
    inputs: { workType: 'string', projectRoot: 'string' },
    outputs: { mustFollow: 'array', gotchas: 'array', patterns: 'array', decisions: 'array', codebaseFacts: 'array', apiBehaviors: 'array' }
  }
});

const extractPatternsTask = defineTask('metaswarm-extract-patterns', async (args, _ctx) => {
  return { patterns: args };
}, {
  kind: 'agent',
  title: 'Extract Implementation Patterns from Completed Work',
  labels: ['metaswarm', 'knowledge', 'reflection', 'patterns'],
  io: {
    inputs: { completedWorkUnits: 'array', issueDescription: 'string' },
    outputs: { patterns: 'array', reusableApproaches: 'array', effectiveStrategies: 'array' }
  }
});

const extractGotchasTask = defineTask('metaswarm-extract-gotchas', async (args, _ctx) => {
  return { gotchas: args };
}, {
  kind: 'agent',
  title: 'Extract Gotchas and Pitfalls from Review Failures',
  labels: ['metaswarm', 'knowledge', 'reflection', 'gotchas'],
  io: {
    inputs: { reviewResults: 'array', completedWorkUnits: 'array' },
    outputs: { gotchas: 'array', commonFailures: 'array', preventionStrategies: 'array' }
  }
});

const extractDecisionsTask = defineTask('metaswarm-extract-decisions', async (args, _ctx) => {
  return { decisions: args };
}, {
  kind: 'agent',
  title: 'Extract Architectural Decisions and Rationale',
  labels: ['metaswarm', 'knowledge', 'reflection', 'decisions'],
  io: {
    inputs: { completedWorkUnits: 'array', issueDescription: 'string' },
    outputs: { decisions: 'array', tradeoffs: 'array', alternativesConsidered: 'array' }
  }
});

const persistKnowledgeTask = defineTask('metaswarm-persist-knowledge', async (args, _ctx) => {
  return { persisted: args };
}, {
  kind: 'agent',
  title: 'Persist Knowledge Items to .beads/knowledge/',
  labels: ['metaswarm', 'knowledge', 'persistence'],
  io: {
    inputs: { patterns: 'array', gotchas: 'array', decisions: 'array', targetDir: 'string' },
    outputs: { filesWritten: 'array', itemCount: 'number', categories: 'object' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Metaswarm Knowledge Cycle Process
 *
 * Two modes:
 * - "prime": Load context before work starts (bd prime --work-type <type>)
 *   Loads MUST FOLLOW rules, GOTCHAS, PATTERNS, DECISIONS from knowledge base
 *
 * - "reflect": Extract learnings after work completes (/self-reflect)
 *   Captures patterns, gotchas, decisions, anti-patterns while context is fresh
 *   Must run BEFORE PR creation to preserve maximum context
 *
 * Knowledge categories (JSONL files):
 * - patterns.jsonl - Reusable codebase patterns
 * - gotchas.jsonl - Common pitfalls and how to avoid them
 * - decisions.jsonl - Architectural choices with rationale
 * - anti-patterns.jsonl - What not to do
 * - codebase-facts.jsonl - Structural facts about the codebase
 * - api-behaviors.jsonl - API quirks and undocumented behaviors
 *
 * Attribution: Adapted from https://github.com/dsifry/metaswarm by David Sifry
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.mode - "prime" or "reflect"
 * @param {string} inputs.workType - Type of work for context priming
 * @param {string} inputs.issueDescription - Issue description for reflection
 * @param {Array} inputs.completedWorkUnits - Completed work units for reflection
 * @param {Array} inputs.reviewResults - Review results for gotcha extraction
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Knowledge cycle results
 */
export async function process(inputs, ctx) {
  const {
    mode,
    workType = 'general',
    issueDescription = '',
    completedWorkUnits = [],
    reviewResults = [],
    projectRoot = '.'
  } = inputs;

  ctx.log('Knowledge Cycle:', mode === 'prime' ? 'Loading context' : 'Extracting learnings');

  if (mode === 'prime') {
    // ========================================================================
    // PRIME MODE: Load context before work
    // ========================================================================

    const contextResult = await ctx.task(primeContextTask, {
      workType,
      projectRoot
    });

    return {
      success: true,
      knowledgeItems: [
        ...contextResult.mustFollow,
        ...contextResult.gotchas,
        ...contextResult.patterns,
        ...contextResult.decisions
      ],
      contextLoaded: {
        mustFollow: contextResult.mustFollow.length,
        gotchas: contextResult.gotchas.length,
        patterns: contextResult.patterns.length,
        decisions: contextResult.decisions.length,
        codebaseFacts: contextResult.codebaseFacts.length,
        apiBehaviors: contextResult.apiBehaviors.length
      },
      summary: { mode: 'prime', workType, itemsLoaded: contextResult.mustFollow.length + contextResult.gotchas.length + contextResult.patterns.length + contextResult.decisions.length },
      metadata: {
        processId: 'methodologies/metaswarm/metaswarm-knowledge-cycle',
        attribution: 'https://github.com/dsifry/metaswarm',
        author: 'David Sifry',
        timestamp: ctx.now()
      }
    };
  }

  // ==========================================================================
  // REFLECT MODE: Extract learnings after work
  // ==========================================================================

  ctx.log('Reflect: Running self-reflection while context is fresh');
  ctx.log('NOTE: This must run BEFORE PR creation for maximum context capture');

  // Extract patterns, gotchas, and decisions in parallel
  const [patternsResult, gotchasResult, decisionsResult] = await ctx.parallel.all([
    ctx.task(extractPatternsTask, { completedWorkUnits, issueDescription }),
    ctx.task(extractGotchasTask, { reviewResults, completedWorkUnits }),
    ctx.task(extractDecisionsTask, { completedWorkUnits, issueDescription })
  ]);

  // Persist to knowledge base
  const persistResult = await ctx.task(persistKnowledgeTask, {
    patterns: patternsResult.patterns,
    gotchas: gotchasResult.gotchas,
    decisions: decisionsResult.decisions,
    targetDir: `${projectRoot}/.beads/knowledge`
  });

  return {
    success: true,
    knowledgeItems: [
      ...patternsResult.patterns,
      ...gotchasResult.gotchas,
      ...decisionsResult.decisions
    ],
    reflections: {
      patterns: patternsResult.patterns,
      gotchas: gotchasResult.gotchas,
      decisions: decisionsResult.decisions,
      reusableApproaches: patternsResult.reusableApproaches,
      commonFailures: gotchasResult.commonFailures,
      tradeoffs: decisionsResult.tradeoffs
    },
    summary: {
      mode: 'reflect',
      patternsExtracted: patternsResult.patterns.length,
      gotchasIdentified: gotchasResult.gotchas.length,
      decisionsRecorded: decisionsResult.decisions.length,
      filesWritten: persistResult.filesWritten.length
    },
    metadata: {
      processId: 'methodologies/metaswarm/metaswarm-knowledge-cycle',
      attribution: 'https://github.com/dsifry/metaswarm',
      author: 'David Sifry',
      timestamp: ctx.now()
    }
  };
}
