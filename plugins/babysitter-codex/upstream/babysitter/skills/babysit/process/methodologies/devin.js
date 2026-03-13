/**
 * @process methodologies/devin
 * @description Devin-style workflow: Plan → Code → Debug → Deploy with iterative refinement
 * @inputs { feature: string, targetQuality: number, maxDebugIterations: number }
 * @outputs { success: boolean, deployed: boolean, iterations: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Devin Process
 *
 * Inspired by Devin AI: Autonomous software engineering workflow
 * Phases: Planning → Coding → Debugging → Deployment
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.feature - Feature to implement
 * @param {number} inputs.targetQuality - Quality threshold for deployment (default: 85)
 * @param {number} inputs.maxDebugIterations - Max debug cycles (default: 3)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result
 */
export async function process(inputs, ctx) {
  const {
    feature,
    targetQuality = 85,
    maxDebugIterations = 3
  } = inputs;


  // ============================================================================
  // PHASE 1: PLAN
  // ============================================================================


  const plan = await ctx.task(agentPlanningTask, {
    feature,
    requirements: inputs.requirements || [],
    constraints: inputs.constraints || []
  });

  // Breakpoint: Review plan
  await ctx.breakpoint({
    question: `Review the implementation plan for "${feature}". Approve to proceed with coding?`,
    title: 'Devin: Plan Review',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/devin-plan.md', format: 'markdown' }
      ]
    }
  });

  // ============================================================================
  // PHASE 2: CODE
  // ============================================================================

  const code = await ctx.task(codingTask, {
    feature,
    plan
  });

  // ============================================================================
  // PHASE 3: DEBUG (Iterative)
  // ============================================================================

  let debugIteration = 0;
  let allTestsPass = false;
  let quality = 0;
  const debugResults = [];

  while (!allTestsPass && debugIteration < maxDebugIterations) {
    debugIteration++;

    // Run tests
    const testResult = await ctx.task(testTask, {
      feature,
      iteration: debugIteration
    });

    allTestsPass = testResult.passed === testResult.total;
    const failedTests = testResult.total - testResult.passed;

    if (!allTestsPass) {

      // Agent analyzes failures and suggests fixes
      const debugAnalysis = await ctx.task(agentDebugTask, {
        feature,
        testResult,
        code,
        iteration: debugIteration
      });

      // Apply fixes
      const fixResult = await ctx.task(applyFixesTask, {
        feature,
        fixes: debugAnalysis.fixes,
        iteration: debugIteration
      });

      debugResults.push({
        iteration: debugIteration,
        failedTests,
        rootCause: debugAnalysis.rootCause,
        fixesApplied: fixResult.fixesApplied
      });

    }
  }

  if (!allTestsPass) {
    await ctx.breakpoint({
      question: `Debugging incomplete after ${maxDebugIterations} iterations. Continue with deployment or abort?`,
      title: 'Devin: Debugging Incomplete',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/debug-report.md', format: 'markdown' }
        ]
      }
    });
  }

  // Quality check
  const qualityResult = await ctx.task(agentQualityScoringTask, {
    feature,
    plan,
    code,
    testsPassed: allTestsPass,
    debugIterations: debugIteration
  });

  quality = qualityResult.overallScore;

  const qualityMet = quality >= targetQuality;

  if (!qualityMet) {
    await ctx.breakpoint({
      question: `Quality ${quality}/100 is below target ${targetQuality}/100. Deploy anyway?`,
      title: 'Devin: Quality Below Target',
      context: {
        runId: ctx.runId,
        files: [
          { path: 'artifacts/quality-report.md', format: 'markdown' }
        ]
      }
    });
  }

  // ============================================================================
  // PHASE 4: DEPLOY
  // ============================================================================


  // Final approval
  await ctx.breakpoint({
    question: `Ready to deploy "${feature}". Tests: ${allTestsPass ? 'PASS' : 'FAIL'}, Quality: ${quality}/100. Approve deployment?`,
    title: 'Devin: Deployment Approval',
    context: {
      runId: ctx.runId,
      files: [
        { path: 'artifacts/deployment-summary.md', format: 'markdown' }
      ]
    }
  });

  const deployment = await ctx.task(deployTask, {
    feature,
    environment: inputs.environment || 'production'
  });


  // ============================================================================
  // RESULT
  // ============================================================================

  return {
    success: deployment.success,
    feature,
    deployed: deployment.success,
    phases: {
      plan,
      code,
      debug: {
        iterations: debugIteration,
        allTestsPass,
        debugResults
      },
      quality: qualityResult,
      deployment
    },
    summary: {
      testsPassed: allTestsPass,
      quality,
      qualityMet,
      debugIterations: debugIteration,
      deployed: deployment.success
    },
    metadata: {
      processId: 'methodologies/devin',
      timestamp: ctx.now()
    }
  };
}

// Task definitions follow the same pattern as previous processes
// (agentPlanningTask, codingTask, testTask, agentDebugTask, etc.)

export const agentPlanningTask = defineTask('agent-planner', (args, taskCtx) => ({
  kind: 'agent',
  title: `Plan: ${args.feature}`,
  agent: {
    name: 'devin-planner',
    prompt: {
      role: 'senior software engineer and architect',
      task: 'Create detailed implementation plan for feature',
      context: { feature: args.feature, requirements: args.requirements, constraints: args.constraints },
      instructions: ['Analyze requirements', 'Design architecture', 'Plan implementation steps', 'Identify risks'],
      outputFormat: 'JSON with approach, implementationSteps, testStrategy, risks'
    },
    outputSchema: {
      type: 'object',
      required: ['approach', 'implementationSteps'],
      properties: {
        approach: { type: 'string' },
        implementationSteps: { type: 'array', items: { type: 'string' } },
        testStrategy: { type: 'string' },
        risks: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'devin', 'planning']
}));

export const codingTask = defineTask('coding', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write code',
  agent: {
    name: 'coder',
    prompt: {
      role: 'senior software engineer',
      task: 'Write code for feature',
      context: { feature: args.feature, plan: args.plan },
      instructions: ['Write code for feature', 'Follow plan', 'Write tests', 'Write documentation'],
      outputFormat: 'JSON with filesCreated, filesModified'
    },
    outputSchema: {
      type: 'object',
      required: ['filesCreated', 'filesModified'],
      properties: {
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['devin', 'coding']
}));

export const testTask = defineTask('test', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run tests',
  agent: {
    name: 'tester',
    prompt: {
      role: 'senior QA engineer',
      task: 'Run tests for feature',
      context: { feature: args.feature, iteration: args.iteration },
      instructions: ['Run tests for feature', 'Follow plan', 'Write tests', 'Write documentation'],
      outputFormat: 'JSON with testResults'
    },
    outputSchema: {
      type: 'object',
      required: ['testResults'],
      properties: {
        testResults: { type: 'object', properties: {
          passed: { type: 'number' },
          total: { type: 'number' },
          coverage: { type: 'number' }
        } },
        failedTests: { type: 'number' },
        rootCause: { type: 'string' },
        fixes: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['devin', 'testing']
}));

export const agentDebugTask = defineTask('agent-debugger', (args, taskCtx) => ({
  kind: 'agent',
  title: `Debug iteration ${args.iteration}`,
  agent: {
    name: 'devin-debugger',
    prompt: {
      role: 'expert debugging engineer',
      task: 'Analyze test failures and suggest fixes',
      context: { feature: args.feature, testResult: args.testResult, code: args.code },
      instructions: ['Analyze failures', 'Identify root cause', 'Suggest specific fixes', 'Prioritize fixes'],
      outputFormat: 'JSON with rootCause, fixes array, priority'
    },
    outputSchema: {
      type: 'object',
      required: ['rootCause', 'fixes'],
      properties: {
        rootCause: { type: 'string' },
        fixes: { type: 'array', items: { type: 'object' } },
        priority: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'devin', 'debugging']
}));

export const applyFixesTask = defineTask('apply-fixes', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply fixes',
  agent: {
    name: 'fix-applier',
    prompt: {
      role: 'senior software engineer',
      task: 'Apply fixes to code',
      context: { feature: args.feature, fixes: args.fixes },
      instructions: ['Apply fixes to code', 'Follow plan', 'Write tests', 'Write documentation'],
      outputFormat: 'JSON with fixesApplied'
    },
    outputSchema: {
      type: 'object',
      required: ['fixesApplied'],
      properties: {
        fixesApplied: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['devin', 'fixing']
}));

export const agentQualityScoringTask = defineTask('agent-quality-scorer', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quality scoring',
  agent: {
    name: 'quality-scorer',
    prompt: {
      role: 'senior QA engineer',
      task: 'Score implementation quality',
      context: { feature: args.feature, testsPassed: args.testsPassed },
      instructions: ['Assess code quality', 'Review test coverage', 'Evaluate maintainability', 'Score 0-100'],
      outputFormat: 'JSON with overallScore, analysis, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        analysis: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'devin', 'quality']
}));

export const deployTask = defineTask('deploy', (args, taskCtx) => ({
  kind: 'agent',
  title: `Deploy to ${args.environment}`,
  agent: {
    name: 'deployer',
    prompt: {
      role: 'senior software engineer',
      task: 'Deploy code to environment',
      context: { feature: args.feature, environment: args.environment },
      instructions: ['Deploy code to environment', 'Follow plan', 'Write tests', 'Write documentation'],
      outputFormat: 'JSON with deploymentResult'
    },
    outputSchema: {
      type: 'object',
      required: ['deploymentResult'],
      properties: {
        deploymentResult: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['devin', 'deployment']
}));
