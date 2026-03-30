/**
 * @process specializations/ai-agents-conversational/bias-detection-fairness
 * @description Bias Detection and Fairness Audit - Process for auditing AI agents and chatbots for bias,
 * implementing fairness testing, diversity in training data, and establishing monitoring and correction mechanisms.
 * @inputs { systemName?: string, biasCategories?: array, fairnessMetrics?: array, outputDir?: string }
 * @outputs { success: boolean, biasAuditReport: object, fairnessMetrics: object, mitigationStrategies: array, monitoringDashboard: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/ai-agents-conversational/bias-detection-fairness', {
 *   systemName: 'hiring-assistant',
 *   biasCategories: ['gender', 'race', 'age', 'disability'],
 *   fairnessMetrics: ['demographic-parity', 'equal-opportunity']
 * });
 *
 * @references
 * - AI Fairness 360: https://aif360.mybluemix.net/
 * - Fairlearn: https://fairlearn.org/
 * - NIST AI RMF: https://www.nist.gov/itl/ai-risk-management-framework
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    systemName = 'fairness-audit',
    biasCategories = ['gender', 'race'],
    fairnessMetrics = ['demographic-parity'],
    outputDir = 'bias-detection-output',
    enableCounterfactual = true,
    enableRedTeaming = true
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Bias Detection and Fairness Audit for ${systemName}`);

  // ============================================================================
  // PHASE 1: BIAS ASSESSMENT FRAMEWORK
  // ============================================================================

  ctx.log('info', 'Phase 1: Setting up bias assessment framework');

  const assessmentFramework = await ctx.task(biasAssessmentFrameworkTask, {
    systemName,
    biasCategories,
    fairnessMetrics,
    outputDir
  });

  artifacts.push(...assessmentFramework.artifacts);

  // ============================================================================
  // PHASE 2: TEST DATASET CREATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Creating test datasets');

  const testDatasets = await ctx.task(testDatasetCreationTask, {
    systemName,
    biasCategories,
    outputDir
  });

  artifacts.push(...testDatasets.artifacts);

  // ============================================================================
  // PHASE 3: COUNTERFACTUAL TESTING
  // ============================================================================

  let counterfactualTesting = null;
  if (enableCounterfactual) {
    ctx.log('info', 'Phase 3: Running counterfactual tests');

    counterfactualTesting = await ctx.task(counterfactualTestingTask, {
      systemName,
      biasCategories,
      testData: testDatasets.data,
      outputDir
    });

    artifacts.push(...counterfactualTesting.artifacts);
  }

  // ============================================================================
  // PHASE 4: RED TEAMING
  // ============================================================================

  let redTeaming = null;
  if (enableRedTeaming) {
    ctx.log('info', 'Phase 4: Conducting red teaming');

    redTeaming = await ctx.task(redTeamingTask, {
      systemName,
      biasCategories,
      outputDir
    });

    artifacts.push(...redTeaming.artifacts);
  }

  // ============================================================================
  // PHASE 5: FAIRNESS METRICS CALCULATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Calculating fairness metrics');

  const fairnessCalculation = await ctx.task(fairnessMetricsTask, {
    systemName,
    fairnessMetrics,
    counterfactualResults: counterfactualTesting ? counterfactualTesting.results : null,
    redTeamResults: redTeaming ? redTeaming.results : null,
    outputDir
  });

  artifacts.push(...fairnessCalculation.artifacts);

  // ============================================================================
  // PHASE 6: MITIGATION STRATEGIES
  // ============================================================================

  ctx.log('info', 'Phase 6: Developing mitigation strategies');

  const mitigationStrategies = await ctx.task(mitigationStrategiesTask, {
    systemName,
    fairnessResults: fairnessCalculation.results,
    biasCategories,
    outputDir
  });

  artifacts.push(...mitigationStrategies.artifacts);

  // ============================================================================
  // PHASE 7: MONITORING DASHBOARD
  // ============================================================================

  ctx.log('info', 'Phase 7: Setting up monitoring dashboard');

  const monitoringDashboard = await ctx.task(biasMonitoringTask, {
    systemName,
    fairnessMetrics,
    biasCategories,
    outputDir
  });

  artifacts.push(...monitoringDashboard.artifacts);

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Bias audit for ${systemName} complete. Overall fairness score: ${fairnessCalculation.results.overallScore}. Review results?`,
    title: 'Bias Detection Review',
    context: {
      runId: ctx.runId,
      summary: {
        systemName,
        biasCategories,
        overallFairnessScore: fairnessCalculation.results.overallScore,
        issuesFound: fairnessCalculation.results.issuesFound,
        mitigationCount: mitigationStrategies.strategies.length
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    systemName,
    biasAuditReport: {
      framework: assessmentFramework.framework,
      counterfactualResults: counterfactualTesting ? counterfactualTesting.results : null,
      redTeamResults: redTeaming ? redTeaming.results : null
    },
    fairnessMetrics: fairnessCalculation.results,
    mitigationStrategies: mitigationStrategies.strategies,
    monitoringDashboard: monitoringDashboard.dashboard,
    artifacts,
    duration,
    metadata: {
      processId: 'specializations/ai-agents-conversational/bias-detection-fairness',
      timestamp: startTime,
      outputDir
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const biasAssessmentFrameworkTask = defineTask('bias-assessment-framework', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Bias Assessment - ${args.systemName}`,
  agent: {
    name: 'bias-fairness-analyst',  // AG-SAF-003: Audits for bias and implements fairness testing
    prompt: {
      role: 'Fairness Architect',
      task: 'Setup bias assessment framework',
      context: args,
      instructions: [
        '1. Define bias categories to test',
        '2. Select fairness metrics',
        '3. Create assessment criteria',
        '4. Define threshold values',
        '5. Plan testing methodology',
        '6. Create audit checklist',
        '7. Document framework',
        '8. Save assessment framework'
      ],
      outputFormat: 'JSON with assessment framework'
    },
    outputSchema: {
      type: 'object',
      required: ['framework', 'artifacts'],
      properties: {
        framework: { type: 'object' },
        assessmentCriteria: { type: 'array' },
        thresholds: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fairness', 'framework']
}));

export const testDatasetCreationTask = defineTask('test-dataset-creation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Create Test Datasets - ${args.systemName}`,
  agent: {
    name: 'dataset-creator',
    prompt: {
      role: 'Fairness Dataset Creator',
      task: 'Create diverse test datasets for bias detection',
      context: args,
      instructions: [
        '1. Create balanced test data',
        '2. Include all demographic groups',
        '3. Create counterfactual pairs',
        '4. Include edge cases',
        '5. Validate data diversity',
        '6. Remove identifying information',
        '7. Document data sources',
        '8. Save test datasets'
      ],
      outputFormat: 'JSON with test datasets'
    },
    outputSchema: {
      type: 'object',
      required: ['data', 'artifacts'],
      properties: {
        data: { type: 'object' },
        datasetPath: { type: 'string' },
        diversity: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fairness', 'datasets']
}));

export const counterfactualTestingTask = defineTask('counterfactual-testing', (args, taskCtx) => ({
  kind: 'agent',
  title: `Run Counterfactual Tests - ${args.systemName}`,
  agent: {
    name: 'counterfactual-tester',
    prompt: {
      role: 'Counterfactual Tester',
      task: 'Run counterfactual fairness tests',
      context: args,
      instructions: [
        '1. Generate counterfactual inputs',
        '2. Swap demographic indicators',
        '3. Run model on paired inputs',
        '4. Compare outputs for bias',
        '5. Calculate consistency scores',
        '6. Identify systematic biases',
        '7. Document findings',
        '8. Save counterfactual results'
      ],
      outputFormat: 'JSON with counterfactual results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: { type: 'object' },
        biasInstances: { type: 'array' },
        consistencyScore: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fairness', 'counterfactual']
}));

export const redTeamingTask = defineTask('red-teaming', (args, taskCtx) => ({
  kind: 'agent',
  title: `Conduct Red Teaming - ${args.systemName}`,
  agent: {
    name: 'red-teamer',
    prompt: {
      role: 'Red Team Specialist',
      task: 'Conduct adversarial red teaming for bias',
      context: args,
      instructions: [
        '1. Design adversarial prompts',
        '2. Test for stereotyping',
        '3. Probe for discriminatory outputs',
        '4. Test edge cases',
        '5. Document vulnerabilities',
        '6. Prioritize findings',
        '7. Create attack scenarios',
        '8. Save red team results'
      ],
      outputFormat: 'JSON with red team results'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: { type: 'object' },
        vulnerabilities: { type: 'array' },
        attackScenarios: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fairness', 'red-teaming']
}));

export const fairnessMetricsTask = defineTask('fairness-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Calculate Fairness Metrics - ${args.systemName}`,
  agent: {
    name: 'metrics-calculator',
    prompt: {
      role: 'Fairness Metrics Calculator',
      task: 'Calculate fairness metrics',
      context: args,
      instructions: [
        '1. Calculate demographic parity',
        '2. Calculate equal opportunity',
        '3. Calculate equalized odds',
        '4. Measure disparate impact',
        '5. Calculate overall fairness score',
        '6. Identify failing metrics',
        '7. Generate metrics report',
        '8. Save fairness metrics'
      ],
      outputFormat: 'JSON with fairness metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            overallScore: { type: 'number' },
            issuesFound: { type: 'number' },
            metricResults: { type: 'object' }
          }
        },
        reportPath: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fairness', 'metrics']
}));

export const mitigationStrategiesTask = defineTask('mitigation-strategies', (args, taskCtx) => ({
  kind: 'agent',
  title: `Develop Mitigation Strategies - ${args.systemName}`,
  agent: {
    name: 'mitigation-developer',
    prompt: {
      role: 'Mitigation Strategy Developer',
      task: 'Develop bias mitigation strategies',
      context: args,
      instructions: [
        '1. Analyze bias sources',
        '2. Develop prompt modifications',
        '3. Create training data improvements',
        '4. Design output filtering',
        '5. Propose model changes',
        '6. Prioritize mitigations',
        '7. Estimate effectiveness',
        '8. Save mitigation strategies'
      ],
      outputFormat: 'JSON with mitigation strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['strategies', 'artifacts'],
      properties: {
        strategies: { type: 'array' },
        prioritization: { type: 'array' },
        implementationPlan: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fairness', 'mitigation']
}));

export const biasMonitoringTask = defineTask('bias-monitoring', (args, taskCtx) => ({
  kind: 'agent',
  title: `Setup Bias Monitoring - ${args.systemName}`,
  agent: {
    name: 'monitoring-developer',
    prompt: {
      role: 'Bias Monitoring Developer',
      task: 'Setup ongoing bias monitoring',
      context: args,
      instructions: [
        '1. Define monitoring metrics',
        '2. Set up data collection',
        '3. Create dashboard views',
        '4. Configure alerts',
        '5. Set threshold triggers',
        '6. Plan periodic audits',
        '7. Create reporting cadence',
        '8. Save monitoring dashboard'
      ],
      outputFormat: 'JSON with monitoring dashboard'
    },
    outputSchema: {
      type: 'object',
      required: ['dashboard', 'artifacts'],
      properties: {
        dashboard: { type: 'object' },
        dashboardPath: { type: 'string' },
        alerts: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'fairness', 'monitoring']
}));
