/**
 * @process methodologies/claudekit/claudekit-research
 * @description ClaudeKit Research - Parallel research agent orchestration dispatching 5-10 specialized agents for comprehensive multi-source research, achieving up to 90% faster results through concurrent execution
 * @inputs { query: string, projectRoot?: string, agentCount?: number, sources?: array, codebaseMap?: object, depth?: string }
 * @outputs { success: boolean, findings: array, synthesis: object, sources: array, agentResults: array, confidenceScore: number, summary: object }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

const planResearchTask = defineTask('claudekit-research-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Research Strategy',
  agent: {
    ref: 'methodologies/claudekit/agents/research-coordinator',
    prompt: {
      role: 'ClaudeKit Research Coordinator',
      task: 'Analyze the research query and plan a multi-agent research strategy. Decompose the query into parallel-executable sub-queries for 5-10 agents.',
      context: { ...args },
      instructions: [
        'Analyze the research query for key topics and subtopics',
        'Decompose into 5-10 independent sub-queries for parallel execution',
        'Assign each sub-query a research focus and source strategy',
        'Define expected output format for each agent',
        'Determine optimal agent count based on query complexity',
        'Shallow depth: 5 agents, Medium: 7 agents, Deep: 10 agents',
        'Return research plan with sub-queries and agent assignments'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'research', 'planning']
}));

const researchAgentTask = defineTask('claudekit-research-agent', (args, taskCtx) => ({
  kind: 'agent',
  title: `Research Agent: ${args.focus || 'General'}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: `ClaudeKit Research Agent - ${args.focus || 'General'}`,
      task: `Execute focused research on the assigned sub-query. Search codebase, documentation, and available sources for relevant findings.`,
      context: { ...args },
      instructions: [
        `Research focus: ${args.subQuery || args.query}`,
        'Search the codebase for relevant patterns and implementations',
        'Look for documentation, comments, and configuration related to the topic',
        'Check for existing solutions or similar implementations',
        'Evaluate relevance and reliability of each finding',
        'Assign confidence score (0-100) to each finding',
        'Document source of each finding for attribution',
        'Return structured findings with evidence and confidence scores'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'research', 'agent', args.focus || 'general']
}));

const synthesizeResultsTask = defineTask('claudekit-research-synthesize', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Synthesize Research Results',
  agent: {
    ref: 'methodologies/claudekit/agents/research-coordinator',
    prompt: {
      role: 'ClaudeKit Research Synthesizer',
      task: 'Synthesize findings from all research agents into a coherent, actionable report. Identify consensus, conflicts, and gaps.',
      context: { ...args },
      instructions: [
        'Collect and deduplicate findings from all research agents',
        'Identify areas of consensus across multiple agents',
        'Flag conflicting findings with source attribution',
        'Identify research gaps that need further investigation',
        'Rank findings by confidence and relevance',
        'Generate executive summary with key takeaways',
        'Provide actionable recommendations',
        'Compute overall confidence score as weighted average',
        'Return comprehensive synthesis report'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'research', 'synthesis']
}));

const validateFindingsTask = defineTask('claudekit-research-validate', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate Research Findings',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'ClaudeKit Research Validator',
      task: 'Validate the synthesized research findings against the codebase. Verify claims with evidence and flag unsubstantiated conclusions.',
      context: { ...args },
      instructions: [
        'Cross-reference each finding against actual codebase state',
        'Verify code examples and references exist and are current',
        'Confirm dependency information is accurate',
        'Validate architectural claims against actual structure',
        'Flag findings that cannot be independently verified',
        'Upgrade or downgrade confidence scores based on validation',
        'Return validated findings with verification status'
      ],
      outputFormat: 'JSON'
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['claudekit', 'research', 'validation']
}));

// ============================================================================
// PROCESS FUNCTION
// ============================================================================

export async function process(inputs, ctx) {
  const {
    query,
    projectRoot = '.',
    agentCount = null,
    sources = ['codebase', 'documentation', 'configuration'],
    codebaseMap = null,
    depth = 'medium'
  } = inputs;

  ctx.log('Starting ClaudeKit Parallel Research');

  // Phase 1: Plan research strategy
  ctx.log('Phase 1: Planning research strategy');
  const researchPlan = await ctx.task(planResearchTask, {
    query,
    projectRoot,
    requestedAgentCount: agentCount,
    sources,
    codebaseMap,
    depth
  });

  const subQueries = researchPlan.subQueries || [];
  const effectiveAgentCount = subQueries.length;
  ctx.log(`Research plan: ${effectiveAgentCount} parallel agents`);

  // Phase 2: Dispatch research agents in parallel
  ctx.log(`Phase 2: Dispatching ${effectiveAgentCount} research agents in parallel`);
  const researchTasks = subQueries.map((sq) =>
    ctx.task(researchAgentTask, {
      query,
      subQuery: sq.subQuery,
      focus: sq.focus,
      sources: sq.sources,
      projectRoot,
      codebaseMap
    })
  );

  const agentResults = await ctx.parallel.all(researchTasks);

  // Phase 3: Synthesize results
  ctx.log('Phase 3: Synthesizing research results');
  const synthesis = await ctx.task(synthesizeResultsTask, {
    query,
    agentResults,
    agentCount: effectiveAgentCount
  });

  // Phase 4: Validate findings
  ctx.log('Phase 4: Validating findings against codebase');
  const validated = await ctx.task(validateFindingsTask, {
    synthesis,
    projectRoot,
    codebaseMap
  });

  // Phase 5: Human review for low-confidence results
  if (validated.overallConfidence < 70) {
    ctx.log('Phase 5: Low confidence results - requesting human review');
    await ctx.breakpoint({
      title: 'Research Confidence Below Threshold',
      description: `Research confidence (${validated.overallConfidence}%) is below 70%. Review findings and provide guidance for further investigation.`,
      context: {
        query,
        confidence: validated.overallConfidence,
        gaps: validated.researchGaps,
        conflicts: validated.conflicts
      }
    });
  }

  ctx.log('ClaudeKit Research complete');

  return {
    success: true,
    findings: validated.findings,
    synthesis: {
      summary: synthesis.executiveSummary,
      keyTakeaways: synthesis.keyTakeaways,
      recommendations: synthesis.recommendations,
      consensus: synthesis.consensusAreas,
      conflicts: synthesis.conflicts,
      gaps: synthesis.researchGaps
    },
    sources: validated.verifiedSources,
    agentResults: agentResults.map((r, i) => ({
      focus: subQueries[i].focus,
      findingCount: r.findings ? r.findings.length : 0,
      confidence: r.confidence
    })),
    confidenceScore: validated.overallConfidence,
    summary: {
      query,
      agentCount: effectiveAgentCount,
      totalFindings: validated.findings.length,
      verifiedFindings: validated.verifiedCount,
      overallConfidence: validated.overallConfidence,
      depth
    }
  };
}
