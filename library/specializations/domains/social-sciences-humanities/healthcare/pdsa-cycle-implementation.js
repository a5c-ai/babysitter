/**
 * @process specializations/domains/social-sciences-humanities/healthcare/pdsa-cycle-implementation
 * @description PDSA Cycle Implementation - Plan-Do-Study-Act methodology for testing and implementing
 * changes in healthcare settings through rapid-cycle improvement and iterative testing.
 * @inputs { improvementAim: string, changeIdea: string, currentBaseline?: object, testScope?: string }
 * @outputs { success: boolean, cycleResults: object, learnings: array, nextSteps: object, artifacts: array }
 * @recommendedSkills SK-HC-002 (quality-metrics-measurement), SK-HC-001 (clinical-workflow-analysis)
 * @recommendedAgents AG-HC-001 (quality-improvement-orchestrator), AG-HC-007 (operations-excellence-director)
 *
 * @example
 * const result = await orchestrate('specializations/domains/social-sciences-humanities/healthcare/pdsa-cycle-implementation', {
 *   improvementAim: 'Reduce medication errors by 50% in 6 months',
 *   changeIdea: 'Implement barcode medication administration',
 *   currentBaseline: { errorRate: 2.5, errorsPer1000: 25 },
 *   testScope: 'Med-Surg Unit 3A'
 * });
 *
 * @references
 * - Langley, G.J. et al. (2009). The Improvement Guide
 * - IHI Model for Improvement
 * - Deming, W.E. (1986). Out of the Crisis
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    improvementAim,
    changeIdea,
    currentBaseline = {},
    testScope = 'pilot unit',
    teamMembers = [],
    cycleNumber = 1,
    previousLearnings = [],
    outputDir = 'pdsa-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting PDSA Cycle ${cycleNumber} for: ${improvementAim}`);

  // ============================================================================
  // PLAN PHASE
  // ============================================================================
  ctx.log('info', 'PLAN Phase: Planning the test of change');

  const planPhase = await ctx.task(planPhaseTask, {
    improvementAim,
    changeIdea,
    currentBaseline,
    testScope,
    cycleNumber,
    previousLearnings,
    outputDir
  });

  artifacts.push(...planPhase.artifacts);

  await ctx.breakpoint({
    question: `PLAN complete. Testing: "${planPhase.testDescription}". Prediction: ${planPhase.prediction}. Test duration: ${planPhase.testDuration}. Sample size: ${planPhase.sampleSize}. Approve to proceed with DO phase?`,
    title: 'PDSA PLAN Phase Review',
    context: {
      runId: ctx.runId,
      cycleNumber,
      objective: planPhase.objective,
      questions: planPhase.questionsToAnswer,
      prediction: planPhase.prediction,
      dataCollectionPlan: planPhase.dataCollectionPlan,
      files: planPhase.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // DO PHASE
  // ============================================================================
  ctx.log('info', 'DO Phase: Carrying out the test');

  const doPhase = await ctx.task(doPhaseTask, {
    planPhase,
    testScope,
    outputDir
  });

  artifacts.push(...doPhase.artifacts);

  await ctx.breakpoint({
    question: `DO phase complete. Test executed: ${doPhase.testExecuted}. ${doPhase.observations.length} observations documented. ${doPhase.unexpectedEvents.length} unexpected events. Proceed with STUDY phase?`,
    title: 'PDSA DO Phase Review',
    context: {
      runId: ctx.runId,
      cycleNumber,
      observations: doPhase.observations,
      dataCollected: doPhase.dataCollected,
      unexpectedEvents: doPhase.unexpectedEvents,
      files: doPhase.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // STUDY PHASE
  // ============================================================================
  ctx.log('info', 'STUDY Phase: Analyzing results');

  const studyPhase = await ctx.task(studyPhaseTask, {
    planPhase,
    doPhase,
    currentBaseline,
    outputDir
  });

  artifacts.push(...studyPhase.artifacts);

  await ctx.breakpoint({
    question: `STUDY complete. Prediction confirmed: ${studyPhase.predictionConfirmed}. Result: ${studyPhase.resultSummary}. Key learning: ${studyPhase.keyLearning}. Proceed with ACT phase?`,
    title: 'PDSA STUDY Phase Review',
    context: {
      runId: ctx.runId,
      cycleNumber,
      analysis: studyPhase.analysis,
      comparison: studyPhase.comparisonToPrediction,
      learnings: studyPhase.learnings,
      files: studyPhase.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
    }
  });

  // ============================================================================
  // ACT PHASE
  // ============================================================================
  ctx.log('info', 'ACT Phase: Determining next steps');

  const actPhase = await ctx.task(actPhaseTask, {
    planPhase,
    doPhase,
    studyPhase,
    improvementAim,
    cycleNumber,
    outputDir
  });

  artifacts.push(...actPhase.artifacts);

  // Final Cycle Documentation
  ctx.log('info', 'Generating PDSA Cycle Documentation');

  const cycleDocumentation = await ctx.task(cycleDocumentationTask, {
    improvementAim,
    changeIdea,
    cycleNumber,
    planPhase,
    doPhase,
    studyPhase,
    actPhase,
    outputDir
  });

  artifacts.push(...cycleDocumentation.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    cycleNumber,
    improvementAim,
    changeIdea,
    cycleResults: {
      plan: {
        objective: planPhase.objective,
        prediction: planPhase.prediction,
        testDescription: planPhase.testDescription
      },
      do: {
        testExecuted: doPhase.testExecuted,
        observations: doPhase.observations,
        dataCollected: doPhase.dataCollected
      },
      study: {
        predictionConfirmed: studyPhase.predictionConfirmed,
        resultSummary: studyPhase.resultSummary,
        analysis: studyPhase.analysis
      },
      act: {
        decision: actPhase.decision,
        nextSteps: actPhase.nextSteps,
        modifications: actPhase.modifications
      }
    },
    learnings: studyPhase.learnings,
    nextSteps: {
      decision: actPhase.decision,
      nextCycleRecommendation: actPhase.nextCycleRecommendation,
      scalingPlan: actPhase.scalingPlan
    },
    artifacts,
    documentationPath: cycleDocumentation.documentPath,
    duration,
    metadata: {
      processId: 'specializations/domains/social-sciences-humanities/healthcare/pdsa-cycle-implementation',
      timestamp: startTime,
      outputDir
    }
  };
}

// PLAN Phase Task
export const planPhaseTask = defineTask('pdsa-plan', (args, taskCtx) => ({
  kind: 'agent',
  title: `PDSA PLAN - Cycle ${args.cycleNumber}`,
  agent: {
    name: 'improvement-advisor',
    prompt: {
      role: 'Quality Improvement Advisor',
      task: 'Complete PLAN phase of PDSA cycle',
      context: args,
      instructions: [
        '1. State the objective of this test cycle',
        '2. Define questions to be answered',
        '3. Make specific prediction of results',
        '4. Define the test (who, what, when, where)',
        '5. Determine sample size for test',
        '6. Create data collection plan',
        '7. Define measures to be collected',
        '8. Identify potential barriers',
        '9. Plan for unexpected events',
        '10. Document responsibilities and timeline'
      ],
      outputFormat: 'JSON with PLAN phase deliverables'
    },
    outputSchema: {
      type: 'object',
      required: ['objective', 'questionsToAnswer', 'prediction', 'testDescription', 'dataCollectionPlan', 'artifacts'],
      properties: {
        objective: { type: 'string' },
        questionsToAnswer: { type: 'array', items: { type: 'string' } },
        prediction: { type: 'string' },
        testDescription: { type: 'string' },
        who: { type: 'string' },
        what: { type: 'string' },
        when: { type: 'string' },
        where: { type: 'string' },
        sampleSize: { type: 'number' },
        testDuration: { type: 'string' },
        dataCollectionPlan: { type: 'object' },
        measures: { type: 'array', items: { type: 'object' } },
        potentialBarriers: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pdsa', 'plan', 'healthcare']
}));

// DO Phase Task
export const doPhaseTask = defineTask('pdsa-do', (args, taskCtx) => ({
  kind: 'agent',
  title: 'PDSA DO Phase',
  agent: {
    name: 'improvement-facilitator',
    prompt: {
      role: 'Improvement Facilitator',
      task: 'Complete DO phase of PDSA cycle',
      context: args,
      instructions: [
        '1. Execute the test as planned',
        '2. Document what actually happened',
        '3. Record observations during test',
        '4. Collect planned data',
        '5. Document problems encountered',
        '6. Record unexpected observations',
        '7. Note any deviations from plan',
        '8. Document participant feedback',
        '9. Record resource utilization',
        '10. Capture qualitative observations'
      ],
      outputFormat: 'JSON with DO phase results'
    },
    outputSchema: {
      type: 'object',
      required: ['testExecuted', 'observations', 'dataCollected', 'unexpectedEvents', 'artifacts'],
      properties: {
        testExecuted: { type: 'boolean' },
        executionNotes: { type: 'string' },
        observations: { type: 'array', items: { type: 'object' } },
        dataCollected: { type: 'object' },
        problemsEncountered: { type: 'array', items: { type: 'object' } },
        unexpectedEvents: { type: 'array', items: { type: 'object' } },
        deviationsFromPlan: { type: 'array', items: { type: 'string' } },
        participantFeedback: { type: 'array', items: { type: 'object' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pdsa', 'do', 'healthcare']
}));

// STUDY Phase Task
export const studyPhaseTask = defineTask('pdsa-study', (args, taskCtx) => ({
  kind: 'agent',
  title: 'PDSA STUDY Phase',
  agent: {
    name: 'data-analyst',
    prompt: {
      role: 'Improvement Data Analyst',
      task: 'Complete STUDY phase of PDSA cycle',
      context: args,
      instructions: [
        '1. Analyze collected data',
        '2. Compare results to prediction',
        '3. Determine if prediction was confirmed',
        '4. Summarize what was learned',
        '5. Compare to baseline data',
        '6. Analyze unexpected findings',
        '7. Identify patterns and trends',
        '8. Determine statistical significance if applicable',
        '9. Document key insights',
        '10. Formulate learnings for next cycle'
      ],
      outputFormat: 'JSON with STUDY phase analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'predictionConfirmed', 'resultSummary', 'learnings', 'keyLearning', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        comparisonToPrediction: { type: 'object' },
        predictionConfirmed: { type: 'boolean' },
        resultSummary: { type: 'string' },
        baselineComparison: { type: 'object' },
        statisticalFindings: { type: 'object' },
        patterns: { type: 'array', items: { type: 'string' } },
        learnings: { type: 'array', items: { type: 'string' } },
        keyLearning: { type: 'string' },
        unexpectedFindings: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pdsa', 'study', 'healthcare']
}));

// ACT Phase Task
export const actPhaseTask = defineTask('pdsa-act', (args, taskCtx) => ({
  kind: 'agent',
  title: 'PDSA ACT Phase',
  agent: {
    name: 'improvement-advisor',
    prompt: {
      role: 'Quality Improvement Advisor',
      task: 'Complete ACT phase of PDSA cycle',
      context: args,
      instructions: [
        '1. Decide: Adopt, Adapt, or Abandon',
        '2. If Adopt: Plan for broader implementation',
        '3. If Adapt: Define modifications for next cycle',
        '4. If Abandon: Document reasons and alternatives',
        '5. Define next cycle scope',
        '6. Identify scaling considerations',
        '7. Document standardization needs',
        '8. Plan communication of results',
        '9. Identify sustainability requirements',
        '10. Plan next PDSA cycle if needed'
      ],
      outputFormat: 'JSON with ACT phase decisions'
    },
    outputSchema: {
      type: 'object',
      required: ['decision', 'nextSteps', 'nextCycleRecommendation', 'artifacts'],
      properties: {
        decision: { type: 'string', enum: ['adopt', 'adapt', 'abandon'] },
        decisionRationale: { type: 'string' },
        nextSteps: { type: 'array', items: { type: 'object' } },
        modifications: { type: 'array', items: { type: 'string' } },
        scalingPlan: { type: 'object' },
        standardizationNeeds: { type: 'array', items: { type: 'string' } },
        sustainabilityPlan: { type: 'object' },
        nextCycleRecommendation: { type: 'object' },
        communicationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pdsa', 'act', 'healthcare']
}));

// Cycle Documentation Task
export const cycleDocumentationTask = defineTask('pdsa-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `PDSA Cycle ${args.cycleNumber} Documentation`,
  agent: {
    name: 'documentation-specialist',
    prompt: {
      role: 'Improvement Documentation Specialist',
      task: 'Document complete PDSA cycle',
      context: args,
      instructions: [
        '1. Create cycle summary',
        '2. Document all four phases',
        '3. Include data visualization',
        '4. Document timeline',
        '5. Include team members and roles',
        '6. Document learnings',
        '7. Include next steps',
        '8. Create one-page summary',
        '9. Archive supporting documents',
        '10. Format for sharing'
      ],
      outputFormat: 'JSON with documentation details'
    },
    outputSchema: {
      type: 'object',
      required: ['documentPath', 'cycleSummary', 'artifacts'],
      properties: {
        documentPath: { type: 'string' },
        cycleSummary: { type: 'object' },
        onePageSummary: { type: 'string' },
        dataVisualizations: { type: 'array', items: { type: 'string' } },
        timeline: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'pdsa', 'documentation', 'healthcare']
}));
