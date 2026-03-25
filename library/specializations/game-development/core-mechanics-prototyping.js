/**
 * @process specializations/game-development/core-mechanics-prototyping
 * @description Core Mechanics Prototyping Process - Build and iterate on playable prototypes to validate core gameplay
 * mechanics through rapid iteration, internal playtesting, fun factor assessment, and data-driven refinement
 * until mechanics are validated or pivot decisions are made.
 * @inputs { prototypeName: string, mechanicsToTest?: array, engine?: string, targetPlatform?: string, playtestGoals?: array, outputDir?: string }
 * @outputs { success: boolean, mechanicsValidated: array, playtestResults: object, pivotRecommendation: string, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/game-development/core-mechanics-prototyping', {
 *   prototypeName: 'Combat System Prototype',
 *   mechanicsToTest: ['melee combat', 'dodge roll', 'stamina system'],
 *   engine: 'Unity',
 *   targetPlatform: 'PC',
 *   playtestGoals: ['Validate combat feel', 'Test difficulty curve', 'Assess player satisfaction']
 * });
 *
 * @references
 * - How to Prototype a Game in Under 7 Days (GDC)
 * - Juice it or Lose it (GDC)
 * - Game Feel by Steve Swink
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    prototypeName,
    mechanicsToTest = [],
    engine = 'Unity',
    targetPlatform = 'PC',
    playtestGoals = [],
    prototypeScope = 'minimal',
    iterationTarget = 3,
    playtestersCount = 5,
    timeboxHours = 40,
    outputDir = 'prototype-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];
  const iterations = [];

  ctx.log('info', `Starting Core Mechanics Prototyping: ${prototypeName}`);
  ctx.log('info', `Engine: ${engine}, Mechanics: ${mechanicsToTest.join(', ')}`);

  // ============================================================================
  // PHASE 1: PROTOTYPE PLANNING
  // ============================================================================

  ctx.log('info', 'Phase 1: Prototype Scope and Planning');

  const prototypePlan = await ctx.task(prototypePlanningTask, {
    prototypeName,
    mechanicsToTest,
    engine,
    targetPlatform,
    playtestGoals,
    prototypeScope,
    timeboxHours,
    outputDir
  });

  artifacts.push(...prototypePlan.artifacts);

  // ============================================================================
  // PHASE 2: INITIAL PROTOTYPE DEVELOPMENT
  // ============================================================================

  ctx.log('info', 'Phase 2: Initial Prototype Development');

  const initialPrototype = await ctx.task(prototypeImplementationTask, {
    prototypeName,
    mechanicsToTest,
    engine,
    prototypePlan,
    iteration: 1,
    outputDir
  });

  artifacts.push(...initialPrototype.artifacts);
  iterations.push({ iteration: 1, ...initialPrototype });

  // ============================================================================
  // PHASE 3: ITERATIVE PLAYTESTING AND REFINEMENT
  // ============================================================================

  let currentIteration = 1;
  let mechanicsValidated = false;
  let latestPlaytest = null;

  while (currentIteration <= iterationTarget && !mechanicsValidated) {
    ctx.log('info', `Phase 3: Iteration ${currentIteration} - Playtesting and Analysis`);

    // Conduct playtesting
    const playtestResults = await ctx.task(playtestSessionTask, {
      prototypeName,
      mechanicsToTest,
      playtestGoals,
      playtestersCount,
      iteration: currentIteration,
      previousResults: latestPlaytest,
      outputDir
    });

    artifacts.push(...playtestResults.artifacts);
    latestPlaytest = playtestResults;

    // Quality Gate: Review playtest results
    await ctx.breakpoint({
      question: `Playtest iteration ${currentIteration} complete. Fun factor: ${playtestResults.funFactorScore}/10. Player satisfaction: ${playtestResults.satisfactionScore}/10. Key issues: ${playtestResults.keyIssues.length}. Review results and determine next steps?`,
      title: `Playtest Results - Iteration ${currentIteration}`,
      context: {
        runId: ctx.runId,
        prototypeName,
        iteration: currentIteration,
        funFactorScore: playtestResults.funFactorScore,
        satisfactionScore: playtestResults.satisfactionScore,
        keyIssues: playtestResults.keyIssues,
        positiveFeedback: playtestResults.positiveFeedback,
        files: playtestResults.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });

    // Check if mechanics are validated
    if (playtestResults.funFactorScore >= 7 && playtestResults.satisfactionScore >= 7) {
      mechanicsValidated = true;
      ctx.log('info', `Mechanics validated after ${currentIteration} iterations`);
      break;
    }

    // If not validated and more iterations allowed, iterate
    if (currentIteration < iterationTarget) {
      ctx.log('info', `Iteration ${currentIteration + 1}: Implementing refinements`);

      const refinement = await ctx.task(mechanicsRefinementTask, {
        prototypeName,
        mechanicsToTest,
        playtestResults,
        engine,
        iteration: currentIteration + 1,
        outputDir
      });

      artifacts.push(...refinement.artifacts);
      iterations.push({ iteration: currentIteration + 1, ...refinement });
    }

    currentIteration++;
  }

  // ============================================================================
  // PHASE 4: FUN FACTOR ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 4: Comprehensive Fun Factor Assessment');

  const funAssessment = await ctx.task(funFactorAssessmentTask, {
    prototypeName,
    mechanicsToTest,
    iterations,
    latestPlaytest,
    outputDir
  });

  artifacts.push(...funAssessment.artifacts);

  // ============================================================================
  // PHASE 5: PIVOT OR PROCEED DECISION
  // ============================================================================

  ctx.log('info', 'Phase 5: Pivot or Proceed Decision');

  const pivotDecision = await ctx.task(pivotDecisionTask, {
    prototypeName,
    mechanicsToTest,
    mechanicsValidated,
    funAssessment,
    iterations,
    outputDir
  });

  artifacts.push(...pivotDecision.artifacts);

  // Final Breakpoint: Decision approval
  await ctx.breakpoint({
    question: `Prototyping complete for ${prototypeName}. Mechanics validated: ${mechanicsValidated}. Recommendation: ${pivotDecision.recommendation}. Approve decision and proceed?`,
    title: 'Prototyping Decision Point',
    context: {
      runId: ctx.runId,
      summary: {
        prototypeName,
        iterationsCompleted: currentIteration,
        mechanicsValidated,
        finalFunScore: funAssessment.overallFunScore,
        recommendation: pivotDecision.recommendation,
        validatedMechanics: pivotDecision.validatedMechanics,
        mechanicsNeedingWork: pivotDecision.mechanicsNeedingWork
      },
      files: [
        { path: pivotDecision.decisionDocPath, format: 'markdown', label: 'Decision Document' },
        { path: funAssessment.assessmentPath, format: 'markdown', label: 'Fun Assessment' }
      ]
    }
  });

  // ============================================================================
  // PHASE 6: DOCUMENTATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Prototype Documentation');

  const documentation = await ctx.task(prototypeDocumentationTask, {
    prototypeName,
    mechanicsToTest,
    iterations,
    funAssessment,
    pivotDecision,
    outputDir
  });

  artifacts.push(...documentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    prototypeName,
    mechanicsToTest,
    iterationsCompleted: currentIteration,
    mechanicsValidated: pivotDecision.validatedMechanics,
    mechanicsNeedingWork: pivotDecision.mechanicsNeedingWork,
    playtestResults: {
      totalPlaytesters: latestPlaytest.totalPlaytesters,
      funFactorScore: funAssessment.overallFunScore,
      satisfactionScore: latestPlaytest.satisfactionScore,
      keyFindings: funAssessment.keyFindings
    },
    pivotRecommendation: pivotDecision.recommendation,
    pivotDetails: pivotDecision.pivotOptions,
    prototypePath: initialPrototype.prototypePath,
    documentationPath: documentation.documentationPath,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/game-development/core-mechanics-prototyping',
      timestamp: startTime,
      prototypeName,
      engine,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const prototypePlanningTask = defineTask('prototype-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Prototype Planning - ${args.prototypeName}`,
  agent: {
    name: 'game-designer-agent',
    prompt: {
      role: 'Lead Game Designer',
      task: 'Plan prototype scope and testing approach',
      context: args,
      instructions: [
        '1. Define minimal viable prototype scope',
        '2. Identify core mechanics to implement first',
        '3. Define success criteria for each mechanic',
        '4. Plan placeholder assets requirements',
        '5. Define playtest scenarios and tasks',
        '6. Identify metrics to track during playtests',
        '7. Plan iteration schedule and timebox',
        '8. Define feedback collection methods',
        '9. Create prototype backlog and priorities',
        '10. Document prototype plan'
      ],
      outputFormat: 'JSON with prototype plan'
    },
    outputSchema: {
      type: 'object',
      required: ['scope', 'mechanicsPriority', 'successCriteria', 'artifacts'],
      properties: {
        scope: { type: 'string' },
        mechanicsPriority: { type: 'array', items: { type: 'object' } },
        successCriteria: { type: 'array', items: { type: 'object' } },
        playtestScenarios: { type: 'array', items: { type: 'object' } },
        metricsToTrack: { type: 'array', items: { type: 'string' } },
        timeboxAllocation: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'prototyping', 'planning']
}));

export const prototypeImplementationTask = defineTask('prototype-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Prototype Implementation - ${args.prototypeName} (Iteration ${args.iteration})`,
  agent: {
    name: 'gameplay-programmer-agent',
    prompt: {
      role: 'Gameplay Programmer',
      task: 'Implement playable prototype with core mechanics',
      context: args,
      instructions: [
        '1. Set up minimal project structure',
        '2. Implement core mechanic systems',
        '3. Create placeholder art and audio',
        '4. Add basic player controls and feedback',
        '5. Implement game feel elements (juice)',
        '6. Add debug tools for testing',
        '7. Create test levels/scenarios',
        '8. Add basic UI for playtesting',
        '9. Implement analytics/metrics tracking',
        '10. Package playable build'
      ],
      outputFormat: 'JSON with implementation details'
    },
    outputSchema: {
      type: 'object',
      required: ['prototypePath', 'mechanicsImplemented', 'buildReady', 'artifacts'],
      properties: {
        prototypePath: { type: 'string' },
        mechanicsImplemented: { type: 'array', items: { type: 'string' } },
        buildReady: { type: 'boolean' },
        placeholderAssets: { type: 'array', items: { type: 'string' } },
        knownLimitations: { type: 'array', items: { type: 'string' } },
        debugFeatures: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'prototyping', 'implementation']
}));

export const playtestSessionTask = defineTask('playtest-session', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Playtest Session - ${args.prototypeName} (Iteration ${args.iteration})`,
  agent: {
    name: 'playtest-coordinator-agent',
    prompt: {
      role: 'Game UX Researcher',
      task: 'Conduct structured playtest session and gather feedback',
      context: args,
      instructions: [
        '1. Brief playtesters on session goals',
        '2. Conduct think-aloud playtesting',
        '3. Observe player behavior and reactions',
        '4. Track completion rates and times',
        '5. Note confusion points and frustrations',
        '6. Identify moments of delight and engagement',
        '7. Conduct post-play interviews',
        '8. Gather quantitative ratings (fun, satisfaction)',
        '9. Analyze collected metrics',
        '10. Synthesize findings and create report'
      ],
      outputFormat: 'JSON with playtest results'
    },
    outputSchema: {
      type: 'object',
      required: ['funFactorScore', 'satisfactionScore', 'keyIssues', 'positiveFeedback', 'artifacts'],
      properties: {
        totalPlaytesters: { type: 'number' },
        funFactorScore: { type: 'number', minimum: 1, maximum: 10 },
        satisfactionScore: { type: 'number', minimum: 1, maximum: 10 },
        keyIssues: { type: 'array', items: { type: 'object' } },
        positiveFeedback: { type: 'array', items: { type: 'string' } },
        completionRate: { type: 'number' },
        averageSessionTime: { type: 'string' },
        confusionPoints: { type: 'array', items: { type: 'string' } },
        engagementMoments: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'prototyping', 'playtesting']
}));

export const mechanicsRefinementTask = defineTask('mechanics-refinement', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Mechanics Refinement - ${args.prototypeName} (Iteration ${args.iteration})`,
  agent: {
    name: 'game-designer-agent',
    prompt: {
      role: 'Game Designer',
      task: 'Refine mechanics based on playtest feedback',
      context: args,
      instructions: [
        '1. Analyze playtest feedback and metrics',
        '2. Prioritize issues by impact on fun',
        '3. Design solutions for key issues',
        '4. Adjust tuning parameters',
        '5. Improve game feel and feedback',
        '6. Address confusion points',
        '7. Enhance engagement moments',
        '8. Update control schemes if needed',
        '9. Refine difficulty and challenge',
        '10. Document changes made'
      ],
      outputFormat: 'JSON with refinement details'
    },
    outputSchema: {
      type: 'object',
      required: ['changesImplemented', 'issuesAddressed', 'artifacts'],
      properties: {
        changesImplemented: { type: 'array', items: { type: 'object' } },
        issuesAddressed: { type: 'array', items: { type: 'string' } },
        tuningAdjustments: { type: 'array', items: { type: 'object' } },
        gameFeelImprovements: { type: 'array', items: { type: 'string' } },
        deferredIssues: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'prototyping', 'refinement']
}));

export const funFactorAssessmentTask = defineTask('fun-factor-assessment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Fun Factor Assessment - ${args.prototypeName}`,
  agent: {
    name: 'game-designer-agent',
    prompt: {
      role: 'Senior Game Designer',
      task: 'Assess overall fun factor and engagement potential',
      context: args,
      instructions: [
        '1. Review all playtest data across iterations',
        '2. Analyze fun factor trends over iterations',
        '3. Identify what makes the game fun (or not)',
        '4. Assess engagement and flow states',
        '5. Evaluate challenge vs. frustration balance',
        '6. Assess replayability potential',
        '7. Compare to target fun benchmarks',
        '8. Identify mechanical synergies',
        '9. Rate overall fun potential',
        '10. Document comprehensive assessment'
      ],
      outputFormat: 'JSON with fun assessment'
    },
    outputSchema: {
      type: 'object',
      required: ['overallFunScore', 'keyFindings', 'assessmentPath', 'artifacts'],
      properties: {
        overallFunScore: { type: 'number', minimum: 1, maximum: 10 },
        funTrend: { type: 'string', enum: ['improving', 'stable', 'declining'] },
        keyFindings: { type: 'array', items: { type: 'string' } },
        funDrivers: { type: 'array', items: { type: 'string' } },
        funBlockers: { type: 'array', items: { type: 'string' } },
        replayabilityScore: { type: 'number' },
        engagementLevel: { type: 'string' },
        assessmentPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'prototyping', 'fun-assessment']
}));

export const pivotDecisionTask = defineTask('pivot-decision', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Pivot or Proceed Decision - ${args.prototypeName}`,
  agent: {
    name: 'game-producer-agent',
    prompt: {
      role: 'Executive Producer',
      task: 'Make pivot or proceed decision based on prototype results',
      context: args,
      instructions: [
        '1. Review all prototype data and assessments',
        '2. Evaluate which mechanics are validated',
        '3. Identify mechanics that need more work',
        '4. Assess pivot options if needed',
        '5. Consider market and business factors',
        '6. Evaluate resource investment vs potential',
        '7. Make proceed/pivot/abandon recommendation',
        '8. Define next steps for chosen path',
        '9. Identify risks of chosen path',
        '10. Document decision rationale'
      ],
      outputFormat: 'JSON with decision details'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendation', 'validatedMechanics', 'mechanicsNeedingWork', 'decisionDocPath', 'artifacts'],
      properties: {
        recommendation: { type: 'string', enum: ['proceed', 'pivot', 'abandon', 'more-iteration'] },
        validatedMechanics: { type: 'array', items: { type: 'string' } },
        mechanicsNeedingWork: { type: 'array', items: { type: 'string' } },
        pivotOptions: { type: 'array', items: { type: 'object' } },
        nextSteps: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        decisionDocPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'prototyping', 'decision']
}));

export const prototypeDocumentationTask = defineTask('prototype-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 6: Prototype Documentation - ${args.prototypeName}`,
  agent: {
    name: 'technical-documentation-agent',
    prompt: {
      role: 'Technical Writer',
      task: 'Create comprehensive prototype documentation',
      context: args,
      instructions: [
        '1. Document all tested mechanics',
        '2. Record iteration history and changes',
        '3. Summarize playtest findings',
        '4. Document validated design patterns',
        '5. Record lessons learned',
        '6. Document technical implementation notes',
        '7. Create reference for full production',
        '8. Include playtest data and metrics',
        '9. Document pivot decision rationale',
        '10. Create handoff documentation'
      ],
      outputFormat: 'JSON with documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['documentationPath', 'artifacts'],
      properties: {
        documentationPath: { type: 'string' },
        sections: { type: 'array', items: { type: 'string' } },
        lessonsLearned: { type: 'array', items: { type: 'string' } },
        designPatterns: { type: 'array', items: { type: 'object' } },
        technicalNotes: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['game-development', 'prototyping', 'documentation']
}));
