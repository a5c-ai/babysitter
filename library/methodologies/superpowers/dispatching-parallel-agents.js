/**
 * @process methodologies/superpowers/dispatching-parallel-agents
 * @description Dispatching Parallel Agents - One agent per independent problem domain, concurrent investigation and resolution
 * @inputs { problems: array, verifyIntegration?: boolean }
 * @outputs { success: boolean, agentResults: array, integrationResult: object, conflictsFound: boolean }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const agentIdentifyDomainsTask = defineTask('parallel-identify-domains', async (args, ctx) => {
  return { domains: args };
}, {
  kind: 'agent',
  title: 'Identify Independent Problem Domains',
  labels: ['superpowers', 'parallel-agents', 'domain-analysis'],
  io: {
    inputs: { problems: 'array' },
    outputs: { domains: 'array', independent: 'boolean', sharedState: 'array', recommendation: 'string' }
  }
});

const agentSolveDomainTask = defineTask('parallel-solve-domain', async (args, ctx) => {
  return { solution: args };
}, {
  kind: 'agent',
  title: 'Solve Domain Problem',
  labels: ['superpowers', 'parallel-agents', 'domain-solving'],
  io: {
    inputs: { domain: 'object', scope: 'string', constraints: 'array' },
    outputs: { summary: 'string', rootCause: 'string', fix: 'object', filesChanged: 'array', testsFixed: 'number' }
  }
});

const agentCheckConflictsTask = defineTask('parallel-check-conflicts', async (args, ctx) => {
  return { conflicts: args };
}, {
  kind: 'agent',
  title: 'Check for Conflicts Between Solutions',
  labels: ['superpowers', 'parallel-agents', 'conflict-detection'],
  io: {
    inputs: { agentResults: 'array' },
    outputs: { conflicts: 'array', hasConflicts: 'boolean', resolution: 'string' }
  }
});

const agentIntegrateResultsTask = defineTask('parallel-integrate', async (args, ctx) => {
  return { integration: args };
}, {
  kind: 'agent',
  title: 'Integrate and Verify All Solutions',
  labels: ['superpowers', 'parallel-agents', 'integration'],
  io: {
    inputs: { agentResults: 'array' },
    outputs: { allTestsPass: 'boolean', testOutput: 'string', integratedSuccessfully: 'boolean' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Dispatching Parallel Agents Process
 *
 * When facing 2+ independent problems, dispatch one agent per domain:
 * 1. Identify independent domains (no shared state between them)
 * 2. Dispatch agents in parallel (ctx.parallel.all)
 * 3. Review and check for conflicts
 * 4. Run full test suite to verify integration
 *
 * Use when:
 * - 3+ test files failing with different root causes
 * - Multiple subsystems broken independently
 * - Each problem can be understood without context from others
 *
 * Do NOT use when:
 * - Failures are related (fix one might fix others)
 * - Agents would interfere (editing same files)
 *
 * Attribution: Adapted from https://github.com/pcvelz/superpowers
 *
 * @param {Object} inputs - Process inputs
 * @param {Array} inputs.problems - List of independent problems to solve
 * @param {boolean} inputs.verifyIntegration - Run integration test after (default: true)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Parallel solving results
 */
export async function process(inputs, ctx) {
  const {
    problems,
    verifyIntegration = true
  } = inputs;

  ctx.log('Starting Parallel Agent Dispatch', { problemCount: problems.length });

  // ============================================================================
  // STEP 1: IDENTIFY INDEPENDENT DOMAINS
  // ============================================================================

  const domainAnalysis = await ctx.task(agentIdentifyDomainsTask, { problems });

  if (!domainAnalysis.independent) {
    ctx.log('WARNING: Problems may not be independent', { sharedState: domainAnalysis.sharedState });

    await ctx.breakpoint({
      question: `Domain analysis shows potential shared state between problems: ${domainAnalysis.sharedState.join(', ')}. Parallel dispatch may cause conflicts. Proceed with parallel agents or investigate sequentially?`,
      title: 'Shared State Warning',
      context: { runId: ctx.runId }
    });
  }

  const domains = domainAnalysis.domains || problems.map((p, i) => ({
    id: i,
    description: typeof p === 'string' ? p : p.description,
    scope: typeof p === 'string' ? p : p.scope,
    constraints: ['Do not change code outside your domain scope']
  }));

  // ============================================================================
  // STEP 2: DISPATCH AGENTS IN PARALLEL
  // ============================================================================

  ctx.log('Dispatching agents in parallel', { domainCount: domains.length });

  const agentResults = await ctx.parallel.all(
    domains.map(domain =>
      ctx.task(agentSolveDomainTask, {
        domain,
        scope: domain.scope || domain.description,
        constraints: domain.constraints || []
      })
    )
  );

  ctx.log('All agents returned', { resultsCount: agentResults.length });

  // ============================================================================
  // STEP 3: CHECK FOR CONFLICTS
  // ============================================================================

  const conflictCheck = await ctx.task(agentCheckConflictsTask, {
    agentResults
  });

  if (conflictCheck.hasConflicts) {
    ctx.log('Conflicts detected between agent solutions', { conflicts: conflictCheck.conflicts });

    await ctx.breakpoint({
      question: `Conflicts detected between agent solutions:\n${conflictCheck.conflicts.map(c => `- ${c}`).join('\n')}\n\nResolution strategy: ${conflictCheck.resolution}. Approve resolution or handle manually?`,
      title: 'Agent Conflict Resolution',
      context: { runId: ctx.runId }
    });
  }

  // ============================================================================
  // STEP 4: INTEGRATE AND VERIFY
  // ============================================================================

  let integrationResult = null;

  if (verifyIntegration) {
    ctx.log('Running integration verification');

    integrationResult = await ctx.task(agentIntegrateResultsTask, {
      agentResults
    });

    if (!integrationResult.allTestsPass) {
      await ctx.breakpoint({
        question: `Integration tests failing after applying all parallel fixes. Review test output and resolve.`,
        title: 'Integration Failure',
        context: { runId: ctx.runId }
      });
    }
  }

  return {
    success: integrationResult ? integrationResult.allTestsPass : true,
    problemCount: problems.length,
    domainCount: domains.length,
    agentResults: agentResults.map((r, i) => ({
      domain: domains[i].description || domains[i].scope,
      summary: r.summary,
      rootCause: r.rootCause,
      filesChanged: r.filesChanged || [],
      testsFixed: r.testsFixed || 0
    })),
    integrationResult,
    conflictsFound: conflictCheck.hasConflicts,
    metadata: {
      processId: 'methodologies/superpowers/dispatching-parallel-agents',
      attribution: 'https://github.com/pcvelz/superpowers',
      timestamp: ctx.now()
    }
  };
}
