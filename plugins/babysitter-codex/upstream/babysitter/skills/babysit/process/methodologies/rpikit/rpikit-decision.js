/**
 * @process methodologies/rpikit/rpikit-decision
 * @description RPIKit Decision Documentation - Create Architecture Decision Records (ADRs) to document significant technical choices. Can be invoked at any point in the RPI workflow.
 * @inputs { title: string, context?: string, projectRoot?: string, status?: string }
 * @outputs { success: boolean, adrPath: string, adrNumber: number, decision: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const gatherDecisionContextTask = defineTask('rpikit-gather-decision-context', async (args, _ctx) => {
  return { context: args };
}, {
  kind: 'agent',
  title: 'Gather Context for Architecture Decision',
  labels: ['rpikit', 'decision', 'context'],
  io: {
    inputs: { title: 'string', context: 'string', projectRoot: 'string' },
    outputs: { existingAdrs: 'array', nextAdrNumber: 'number', relatedDecisions: 'array', codebaseContext: 'object' }
  }
});

const analyzeOptionsTask = defineTask('rpikit-analyze-decision-options', async (args, _ctx) => {
  return { analysis: args };
}, {
  kind: 'agent',
  title: 'Analyze Decision Options and Consequences',
  labels: ['rpikit', 'decision', 'analysis'],
  io: {
    inputs: { title: 'string', context: 'object', codebaseContext: 'object' },
    outputs: { options: 'array', prosAndCons: 'object', recommendation: 'string', consequences: 'array' }
  }
});

const writeAdrTask = defineTask('rpikit-write-adr', async (args, _ctx) => {
  return { adr: args };
}, {
  kind: 'agent',
  title: 'Write Architecture Decision Record',
  labels: ['rpikit', 'decision', 'adr'],
  io: {
    inputs: { title: 'string', adrNumber: 'number', status: 'string', options: 'array', recommendation: 'string', consequences: 'array', relatedDecisions: 'array' },
    outputs: { adrPath: 'string', content: 'string', sections: 'array' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * RPIKit Decision Documentation Process
 *
 * Creates Architecture Decision Records (ADRs) documenting significant
 * technical choices. Output to docs/decisions/ with sequential numbering.
 * Can be invoked at any point during the RPI workflow.
 *
 * ADR Format: Title, Status, Context, Options, Decision, Consequences.
 *
 * Attribution: Adapted from https://github.com/bostonaholic/rpikit by Matthew Boston
 */
export async function process(inputs, ctx) {
  const {
    title,
    context = '',
    projectRoot = '.',
    status = 'proposed'
  } = inputs;

  ctx.log('RPIKit Decision: Documenting architecture decision');

  // Step 1: Gather context
  const decisionContext = await ctx.task(gatherDecisionContextTask, {
    title,
    context,
    projectRoot
  });

  // Step 2: Analyze options
  const analysis = await ctx.task(analyzeOptionsTask, {
    title,
    context: { userContext: context, existingAdrs: decisionContext.existingAdrs },
    codebaseContext: decisionContext.codebaseContext
  });

  // Human approves decision
  await ctx.breakpoint({
    question: `ADR #${decisionContext.nextAdrNumber}: "${title}". ${analysis.options.length} options analyzed. Recommendation: "${analysis.recommendation}". Approve decision or request changes.`,
    title: 'Decision Approval',
    context: { runId: ctx.runId }
  });

  // Step 3: Write ADR
  const adr = await ctx.task(writeAdrTask, {
    title,
    adrNumber: decisionContext.nextAdrNumber,
    status,
    options: analysis.options,
    recommendation: analysis.recommendation,
    consequences: analysis.consequences,
    relatedDecisions: decisionContext.relatedDecisions
  });

  return {
    success: true,
    adrPath: adr.adrPath,
    adrNumber: decisionContext.nextAdrNumber,
    decision: {
      title,
      status,
      recommendation: analysis.recommendation,
      optionCount: analysis.options.length,
      consequenceCount: analysis.consequences.length
    },
    metadata: {
      processId: 'methodologies/rpikit/rpikit-decision',
      attribution: 'https://github.com/bostonaholic/rpikit',
      author: 'Matthew Boston',
      timestamp: ctx.now()
    }
  };
}
