/**
 * @process methodologies/superpowers/brainstorming
 * @description Brainstorming - Socratic design refinement: explore context, ask questions, propose approaches, get approval before any code
 * @inputs { task: string, projectRoot?: string, maxQuestionRounds?: number, requireDesignDoc?: boolean }
 * @outputs { success: boolean, design: object, designDocPath: string, approaches: array, approved: boolean }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const agentExploreContextTask = defineTask('brainstorm-explore-context', async (args, ctx) => {
  return { context: args };
}, {
  kind: 'agent',
  title: 'Explore Project Context',
  labels: ['superpowers', 'brainstorming', 'context'],
  io: {
    inputs: { task: 'string', projectRoot: 'string' },
    outputs: { files: 'array', recentCommits: 'array', patterns: 'array', techStack: 'object', docs: 'array' }
  }
});

const agentAskClarifyingQuestionTask = defineTask('brainstorm-ask-question', async (args, ctx) => {
  return { question: args };
}, {
  kind: 'agent',
  title: 'Ask Clarifying Question',
  labels: ['superpowers', 'brainstorming', 'questions'],
  io: {
    inputs: { task: 'string', context: 'object', previousAnswers: 'array', questionRound: 'number' },
    outputs: { question: 'string', questionType: 'string', options: 'array', reasoning: 'string' }
  }
});

const agentProposeApproachesTask = defineTask('brainstorm-propose-approaches', async (args, ctx) => {
  return { approaches: args };
}, {
  kind: 'agent',
  title: 'Propose 2-3 Design Approaches',
  labels: ['superpowers', 'brainstorming', 'approaches'],
  io: {
    inputs: { task: 'string', context: 'object', answers: 'array', constraints: 'array' },
    outputs: { approaches: 'array', recommendation: 'object', tradeoffs: 'array' }
  }
});

const agentPresentDesignSectionTask = defineTask('brainstorm-present-section', async (args, ctx) => {
  return { section: args };
}, {
  kind: 'agent',
  title: 'Present Design Section',
  labels: ['superpowers', 'brainstorming', 'design-section'],
  io: {
    inputs: { task: 'string', sectionName: 'string', approach: 'object', context: 'object' },
    outputs: { sectionContent: 'string', keyDecisions: 'array', openQuestions: 'array' }
  }
});

const agentWriteDesignDocTask = defineTask('brainstorm-write-design-doc', async (args, ctx) => {
  return { doc: args };
}, {
  kind: 'agent',
  title: 'Write Design Document',
  labels: ['superpowers', 'brainstorming', 'documentation'],
  io: {
    inputs: { task: 'string', design: 'object', approaches: 'array', approvedSections: 'array' },
    outputs: { docPath: 'string', content: 'string', committed: 'boolean' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Brainstorming Process
 *
 * HARD GATE: No implementation until design is approved. Every project goes through
 * this process regardless of perceived simplicity.
 *
 * Workflow:
 * 1. Explore project context (files, docs, commits)
 * 2. Ask clarifying questions one at a time (prefer multiple choice)
 * 3. Propose 2-3 approaches with tradeoffs and recommendation
 * 4. Present design in sections, get approval after each
 * 5. Write design doc to docs/plans/YYYY-MM-DD-<topic>-design.md
 * 6. Transition to writing-plans
 *
 * Attribution: Adapted from https://github.com/pcvelz/superpowers
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.task - What to brainstorm/design
 * @param {string} inputs.projectRoot - Project root directory
 * @param {number} inputs.maxQuestionRounds - Max clarifying question rounds (default: 5)
 * @param {boolean} inputs.requireDesignDoc - Whether to write design doc (default: true)
 * @param {Array<string>} inputs.designSections - Sections to cover (default: architecture, components, data-flow, error-handling, testing)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Design result with approved design and documentation
 */
export async function process(inputs, ctx) {
  const {
    task,
    projectRoot = '.',
    maxQuestionRounds = 5,
    requireDesignDoc = true,
    designSections = ['architecture', 'components', 'data-flow', 'error-handling', 'testing']
  } = inputs;

  ctx.log('Starting Brainstorming process', { task });
  ctx.log('HARD GATE: No implementation until design is approved.');

  // ============================================================================
  // STEP 1: EXPLORE PROJECT CONTEXT
  // ============================================================================

  ctx.log('Step 1: Exploring project context');

  const contextResult = await ctx.task(agentExploreContextTask, {
    task,
    projectRoot
  });

  // ============================================================================
  // STEP 2: ASK CLARIFYING QUESTIONS (One at a time)
  // ============================================================================

  ctx.log('Step 2: Asking clarifying questions');

  const answers = [];
  for (let round = 0; round < maxQuestionRounds; round++) {
    const questionResult = await ctx.task(agentAskClarifyingQuestionTask, {
      task,
      context: contextResult,
      previousAnswers: answers,
      questionRound: round
    });

    // Each question requires human response
    await ctx.breakpoint({
      question: questionResult.question,
      title: `Clarifying Question ${round + 1}`,
      context: {
        runId: ctx.runId,
        options: questionResult.options || [],
        questionType: questionResult.questionType
      }
    });

    answers.push({
      round,
      question: questionResult.question,
      // Answer captured via breakpoint response
      timestamp: ctx.now()
    });
  }

  // ============================================================================
  // STEP 3: PROPOSE 2-3 APPROACHES
  // ============================================================================

  ctx.log('Step 3: Proposing design approaches');

  const approachesResult = await ctx.task(agentProposeApproachesTask, {
    task,
    context: contextResult,
    answers,
    constraints: inputs.constraints || []
  });

  // Human reviews approaches
  await ctx.breakpoint({
    question: `Review the ${approachesResult.approaches.length} proposed approaches. The recommendation is highlighted with reasoning and tradeoffs. Select your preferred approach or request modifications.`,
    title: 'Approach Selection',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/brainstorm/approaches.md', format: 'markdown', label: 'Proposed Approaches' }
      ]
    }
  });

  // ============================================================================
  // STEP 4: PRESENT DESIGN IN SECTIONS
  // ============================================================================

  ctx.log('Step 4: Presenting design sections for incremental approval');

  const approvedSections = [];

  for (const sectionName of designSections) {
    const sectionResult = await ctx.task(agentPresentDesignSectionTask, {
      task,
      sectionName,
      approach: approachesResult.recommendation,
      context: contextResult
    });

    // Incremental approval per section
    await ctx.breakpoint({
      question: `Review the "${sectionName}" section of the design. Does this look right so far? Approve to continue to next section, or request changes.`,
      title: `Design Section: ${sectionName}`,
      context: {
        runId: ctx.runId,
        files: [
          { path: `artifacts/brainstorm/section-${sectionName}.md`, format: 'markdown', label: sectionName }
        ]
      }
    });

    approvedSections.push({
      name: sectionName,
      content: sectionResult.sectionContent,
      keyDecisions: sectionResult.keyDecisions
    });
  }

  // ============================================================================
  // STEP 5: WRITE DESIGN DOCUMENT
  // ============================================================================

  let designDocResult = null;

  if (requireDesignDoc) {
    ctx.log('Step 5: Writing design document');

    designDocResult = await ctx.task(agentWriteDesignDocTask, {
      task,
      design: { approaches: approachesResult.approaches, recommendation: approachesResult.recommendation },
      approaches: approachesResult.approaches,
      approvedSections
    });

    ctx.log('Design document written', { docPath: designDocResult.docPath });
  }

  // ============================================================================
  // STEP 6: TRANSITION TO WRITING-PLANS
  // ============================================================================

  ctx.log('Step 6: Design approved. Ready to transition to writing-plans.');

  return {
    success: true,
    task,
    design: {
      approaches: approachesResult.approaches,
      recommendation: approachesResult.recommendation,
      approvedSections
    },
    designDocPath: designDocResult ? designDocResult.docPath : null,
    approaches: approachesResult.approaches,
    approved: true,
    questionRounds: answers.length,
    metadata: {
      processId: 'methodologies/superpowers/brainstorming',
      attribution: 'https://github.com/pcvelz/superpowers',
      timestamp: ctx.now()
    }
  };
}
