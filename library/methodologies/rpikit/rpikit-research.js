/**
 * @process methodologies/rpikit/rpikit-research
 * @description RPIKit Research Phase - Systematic codebase exploration following "The Iron Law": understand the problem before exploring code. Four phases: understand request, explore codebase, document findings, transition.
 * @inputs { question: string, projectRoot?: string, priorContext?: string, constraints?: object }
 * @outputs { success: boolean, researchDocument: object, findings: array, openQuestions: array, recommendations: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const clarifyRequestTask = defineTask('rpikit-clarify-request', async (args, _ctx) => {
  return { clarification: args };
}, {
  kind: 'agent',
  title: 'Clarify Research Request (Iron Law)',
  labels: ['rpikit', 'research', 'clarify'],
  io: {
    inputs: { question: 'string', priorContext: 'string' },
    outputs: { purpose: 'string', specifics: 'string', scope: 'string', constraints: 'object', context: 'string', confirmed: 'boolean' }
  }
});

const locateFilesTask = defineTask('rpikit-locate-files', async (args, _ctx) => {
  return { files: args };
}, {
  kind: 'agent',
  title: 'Locate Relevant Files via File Finder',
  labels: ['rpikit', 'research', 'file-discovery'],
  io: {
    inputs: { purpose: 'string', scope: 'string', projectRoot: 'string' },
    outputs: { relevantFiles: 'array', readingOrder: 'array', fileCategories: 'object' }
  }
});

const examineCodebaseTask = defineTask('rpikit-examine-codebase', async (args, _ctx) => {
  return { examination: args };
}, {
  kind: 'agent',
  title: 'Systematically Examine Codebase',
  labels: ['rpikit', 'research', 'examination'],
  io: {
    inputs: { relevantFiles: 'array', readingOrder: 'array', purpose: 'string', constraints: 'object' },
    outputs: { coreFindings: 'array', dataFlows: 'array', patterns: 'array', dependencies: 'array', limitations: 'array' }
  }
});

const externalResearchTask = defineTask('rpikit-external-research', async (args, _ctx) => {
  return { research: args };
}, {
  kind: 'agent',
  title: 'Gather External Context via Web Research',
  labels: ['rpikit', 'research', 'external'],
  io: {
    inputs: { questions: 'array', context: 'string' },
    outputs: { answers: 'array', references: 'array', relevantDocs: 'array' }
  }
});

const documentFindingsTask = defineTask('rpikit-document-findings', async (args, _ctx) => {
  return { document: args };
}, {
  kind: 'agent',
  title: 'Document Research Findings',
  labels: ['rpikit', 'research', 'documentation'],
  io: {
    inputs: { purpose: 'string', findings: 'array', dataFlows: 'array', dependencies: 'array', limitations: 'array', externalContext: 'object' },
    outputs: { documentPath: 'string', problemStatement: 'string', requirements: 'array', findings: 'array', openQuestions: 'array', recommendations: 'array' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * RPIKit Research Phase Process
 *
 * Implements the Research workflow from RPIKit: systematic codebase exploration
 * following "The Iron Law" - do not explore until the problem is understood.
 *
 * Workflow:
 * 1. Clarify the request (Iron Law: understand before exploring)
 * 2. Locate relevant files using file-finder agent
 * 3. Systematically examine codebase (core files, data flows, patterns)
 * 4. Gather external context if needed (web-researcher agent)
 * 5. Document findings in structured research document
 * 6. Present transition options (plan, continue research, conclude)
 *
 * Attribution: Adapted from https://github.com/bostonaholic/rpikit by Matthew Boston
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.question - The research question or goal
 * @param {string} inputs.projectRoot - Project root directory
 * @param {string} inputs.priorContext - Any prior investigation context
 * @param {Object} inputs.constraints - Performance, compatibility, or security constraints
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Research results with documented findings
 */
export async function process(inputs, ctx) {
  const {
    question,
    projectRoot = '.',
    priorContext = '',
    constraints = {}
  } = inputs;

  ctx.log('RPIKit Research: Starting systematic codebase exploration');
  ctx.log('Iron Law: Do NOT explore the codebase until the problem is understood.');

  // ============================================================================
  // PHASE 1: UNDERSTAND THE REQUEST
  // ============================================================================

  ctx.log('Phase 1: Clarifying the research request');

  const clarification = await ctx.task(clarifyRequestTask, {
    question,
    priorContext
  });

  // Human confirms understanding before proceeding
  await ctx.breakpoint({
    question: `Research scope confirmed: Purpose="${clarification.purpose}", Scope="${clarification.scope}". Approve to begin codebase exploration.`,
    title: 'Research Request Clarification',
    context: { runId: ctx.runId }
  });

  // ============================================================================
  // PHASE 2: EXPLORE THE CODEBASE
  // ============================================================================

  ctx.log('Phase 2: Exploring the codebase systematically');

  // Step 2a: Locate relevant files
  const fileDiscovery = await ctx.task(locateFilesTask, {
    purpose: clarification.purpose,
    scope: clarification.scope,
    projectRoot
  });

  // Step 2b: Examine codebase systematically
  const examination = await ctx.task(examineCodebaseTask, {
    relevantFiles: fileDiscovery.relevantFiles,
    readingOrder: fileDiscovery.readingOrder,
    purpose: clarification.purpose,
    constraints
  });

  // Step 2c: External research if needed
  let externalContext = { answers: [], references: [] };
  if (examination.limitations.length > 0) {
    ctx.log('External context needed, invoking web-researcher');

    externalContext = await ctx.task(externalResearchTask, {
      questions: examination.limitations.map(l => l.question || l),
      context: clarification.purpose
    });
  }

  // ============================================================================
  // PHASE 3: DOCUMENT FINDINGS
  // ============================================================================

  ctx.log('Phase 3: Documenting research findings');

  const documentation = await ctx.task(documentFindingsTask, {
    purpose: clarification.purpose,
    findings: examination.coreFindings,
    dataFlows: examination.dataFlows,
    dependencies: examination.dependencies,
    limitations: examination.limitations,
    externalContext
  });

  // ============================================================================
  // PHASE 4: TRANSITION
  // ============================================================================

  await ctx.breakpoint({
    question: `Research complete. Document: ${documentation.documentPath}. ${documentation.openQuestions.length} open questions remain. Choose next step: (1) Create implementation plan, (2) Continue research, (3) Conclude.`,
    title: 'Research Phase Complete - Next Steps',
    context: { runId: ctx.runId }
  });

  return {
    success: true,
    question,
    researchDocument: {
      path: documentation.documentPath,
      problemStatement: documentation.problemStatement,
      requirements: documentation.requirements
    },
    findings: documentation.findings,
    openQuestions: documentation.openQuestions,
    recommendations: documentation.recommendations,
    metadata: {
      processId: 'methodologies/rpikit/rpikit-research',
      attribution: 'https://github.com/bostonaholic/rpikit',
      author: 'Matthew Boston',
      timestamp: ctx.now()
    }
  };
}
