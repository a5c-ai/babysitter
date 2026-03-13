/**
 * @process specializations/ai-agents-conversational/conversation-quality-testing
 * @description Conversation Quality Testing and Metrics - Process for measuring conversational AI quality including
 * intent accuracy, dialogue success rate, user satisfaction (CSAT), response appropriateness, and conversation coherence.
 * @inputs { systemName?: string, qualityMetrics?: array, testDataset?: object, outputDir?: string }
 * @outputs { success: boolean, qualityMetrics: object, testConversations: array, userFeedbackAnalysis: object, recommendations: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/conversation-quality-testing', {
 *   systemName: 'customer-chatbot',
 *   qualityMetrics: ['intent-accuracy', 'dialogue-success', 'csat', 'coherence'],
 *   testDataset: { conversations: 100 }
 * });
 *
 * @references
 * - DSTC: https://dstc.community/
 * - Conversation Quality Metrics: https://aclanthology.org/2020.nlp4convai-1.8/
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName = 'conversation-quality',
    qualityMetrics = ['intent-accuracy', 'dialogue-success'],
    testDataset = {},
    outputDir = 'conversation-quality-output',
    enableUserSurveys = true,
    enableAutomatedEval = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Conversation Quality Testing for ${systemName}`);

  // ============================================================================
  // PHASE 1: TEST DATASET PREPARATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Preparing test dataset');

  const datasetPreparation = await ctx.task(datasetPreparationTask, {
    systemName,
    testDataset,
    outputDir
  });

  artifacts.push(...datasetPreparation.artifacts);

  // ============================================================================
  // PHASE 2: INTENT ACCURACY TESTING
  // ============================================================================

  ctx.log('info', 'Phase 2: Testing intent accuracy');

  const intentAccuracy = await ctx.task(intentAccuracyTestingTask, {
    systemName,
    testData: datasetPreparation.data,
    outputDir
  });

  artifacts.push(...intentAccuracy.artifacts);

  // ============================================================================
  // PHASE 3: DIALOGUE SUCCESS TESTING
  // ============================================================================

  ctx.log('info', 'Phase 3: Testing dialogue success');

  const dialogueSuccess = await ctx.task(dialogueSuccessTestingTask, {
    systemName,
    testData: datasetPreparation.data,
    outputDir
  });

  artifacts.push(...dialogueSuccess.artifacts);

  // ============================================================================
  // PHASE 4: COHERENCE EVALUATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Evaluating conversation coherence');

  const coherenceEvaluation = await ctx.task(coherenceEvaluationTask, {
    systemName,
    testData: datasetPreparation.data,
    outputDir
  });

  artifacts.push(...coherenceEvaluation.artifacts);

  // ============================================================================
  // PHASE 5: USER FEEDBACK ANALYSIS
  // ============================================================================

  let userFeedback = null;
  if (enableUserSurveys) {
    ctx.log('info', 'Phase 5: Analyzing user feedback');

    userFeedback = await ctx.task(userFeedbackAnalysisTask, {
      systemName,
      outputDir
    });

    artifacts.push(...userFeedback.artifacts);
  }

  // ============================================================================
  // PHASE 6: QUALITY REPORT
  // ============================================================================

  ctx.log('info', 'Phase 6: Generating quality report');

  const qualityReport = await ctx.task(qualityReportTask, {
    systemName,
    intentAccuracy: intentAccuracy.results,
    dialogueSuccess: dialogueSuccess.results,
    coherence: coherenceEvaluation.results,
    userFeedback: userFeedback ? userFeedback.analysis : null,
    outputDir
  });

  artifacts.push(...qualityReport.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Conversation quality testing for ${systemName} complete. Overall quality score: ${qualityReport.overallScore}. Review results?`,
    title: 'Conversation Quality Review',
    context: {
      runId: ctx.runId,
      summary: {
        systemName,
        intentAccuracy: intentAccuracy.results.accuracy,
        dialogueSuccessRate: dialogueSuccess.results.successRate,
        coherenceScore: coherenceEvaluation.results.score,
        overallScore: qualityReport.overallScore
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemName,
    qualityMetrics: {
      intentAccuracy: intentAccuracy.results,
      dialogueSuccess: dialogueSuccess.results,
      coherence: coherenceEvaluation.results,
      overall: qualityReport.overallScore
    },
    testConversations: datasetPreparation.data,
    userFeedbackAnalysis: userFeedback ? userFeedback.analysis : null,
    recommendations: qualityReport.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/conversation-quality-testing',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const datasetPreparationTask = defineTask('dataset-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Prepare Test Dataset - ${args.systemName}`,
  agent: {
    name: 'data-preparer',
    prompt: {
      role: 'Test Data Preparer',
      task: 'Prepare test dataset for conversation quality testing',
      context: args,
      instructions: [
        '1. Load or generate test conversations',
        '2. Create diverse test scenarios',
        '3. Include multi-turn conversations',
        '4. Add edge cases',
        '5. Label expected outcomes',
        '6. Validate data quality',
        '7. Split into test sets',
        '8. Save prepared dataset'
      ],
      outputFormat: 'JSON with test dataset'
    },
    outputSchema: {
      type: 'object',
      required: ['data', 'artifacts'],
      properties: {
        data: { type: 'object' },
        datasetPath: { type: 'string' },
        statistics: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quality', 'dataset']
}));

export const intentAccuracyTestingTask = defineTask('intent-accuracy-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Intent Accuracy - ${args.systemName}`,
  agent: {
    name: 'llm-judge',  // AG-SAF-005: Implements LLM-as-judge evaluation patterns
    prompt: {
      role: 'Intent Accuracy Tester',
      task: 'Test intent classification accuracy',
      context: args,
      instructions: [
        '1. Run intent classification on test data',
        '2. Compare with ground truth',
        '3. Calculate accuracy metrics',
        '4. Identify misclassifications',
        '5. Analyze confusion matrix',
        '6. Calculate per-intent metrics',
        '7. Generate accuracy report',
        '8. Save intent accuracy results'
      ],
      outputFormat: 'JSON with intent accuracy results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            accuracy: { type: 'number' },
            precision: { type: 'number' },
            recall: { type: 'number' },
            f1: { type: 'number' }
          }
        },
        confusionMatrix: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quality', 'intent']
}));

export const dialogueSuccessTestingTask = defineTask('dialogue-success-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Test Dialogue Success - ${args.systemName}`,
  agent: {
    name: 'dialogue-tester',
    prompt: {
      role: 'Dialogue Success Tester',
      task: 'Test dialogue success rate',
      context: args,
      instructions: [
        '1. Define success criteria per flow',
        '2. Run dialogues through system',
        '3. Track task completion',
        '4. Measure turns to completion',
        '5. Calculate success rate',
        '6. Identify failure patterns',
        '7. Analyze fallback usage',
        '8. Save dialogue success results'
      ],
      outputFormat: 'JSON with dialogue success results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            successRate: { type: 'number' },
            avgTurns: { type: 'number' },
            fallbackRate: { type: 'number' }
          }
        },
        failurePatterns: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quality', 'dialogue']
}));

export const coherenceEvaluationTask = defineTask('coherence-evaluation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Evaluate Coherence - ${args.systemName}`,
  agent: {
    name: 'coherence-evaluator',
    prompt: {
      role: 'Coherence Evaluator',
      task: 'Evaluate conversation coherence',
      context: args,
      instructions: [
        '1. Evaluate response relevance',
        '2. Check context consistency',
        '3. Measure topic continuity',
        '4. Assess logical flow',
        '5. Detect non-sequiturs',
        '6. Calculate coherence score',
        '7. Use LLM-as-judge if available',
        '8. Save coherence results'
      ],
      outputFormat: 'JSON with coherence results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            relevance: { type: 'number' },
            consistency: { type: 'number' }
          }
        },
        incoherentExamples: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quality', 'coherence']
}));

export const userFeedbackAnalysisTask = defineTask('user-feedback-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analyze User Feedback - ${args.systemName}`,
  agent: {
    name: 'feedback-analyst',
    prompt: {
      role: 'User Feedback Analyst',
      task: 'Analyze user feedback and satisfaction',
      context: args,
      instructions: [
        '1. Design CSAT survey',
        '2. Collect user ratings',
        '3. Analyze feedback comments',
        '4. Calculate NPS if available',
        '5. Identify common complaints',
        '6. Correlate with quality metrics',
        '7. Generate feedback insights',
        '8. Save feedback analysis'
      ],
      outputFormat: 'JSON with feedback analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'artifacts'],
      properties: {
        analysis: { type: 'object' },
        csat: { type: 'number' },
        topComplaints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quality', 'feedback']
}));

export const qualityReportTask = defineTask('quality-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Generate Quality Report - ${args.systemName}`,
  agent: {
    name: 'report-generator',
    prompt: {
      role: 'Quality Report Generator',
      task: 'Generate comprehensive quality report',
      context: args,
      instructions: [
        '1. Aggregate all metrics',
        '2. Calculate overall score',
        '3. Create visualizations',
        '4. Identify improvement areas',
        '5. Generate recommendations',
        '6. Create executive summary',
        '7. Add trend analysis',
        '8. Save quality report'
      ],
      outputFormat: 'JSON with quality report'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'recommendations', 'artifacts'],
      properties: {
        overallScore: { type: 'number' },
        recommendations: { type: 'array' },
        reportPath: { type: 'string' },
        trends: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'quality', 'report']
}));
