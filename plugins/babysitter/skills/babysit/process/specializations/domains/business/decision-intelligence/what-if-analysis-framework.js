/**
 * @process specializations/domains/business/decision-intelligence/what-if-analysis-framework
 * @description What-If Analysis Framework - Implementation of structured what-if analysis capabilities
 * for testing strategic assumptions and evaluating alternative courses of action.
 * @inputs { projectName: string, analysisContext: object, baselineScenario: object, variables: array, stakeholders?: array }
 * @outputs { success: boolean, analysisFramework: object, scenarioResults: array, sensitivityInsights: object, recommendations: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/what-if-analysis-framework', {
 *   projectName: 'Pricing Strategy What-If Analysis',
 *   analysisContext: { domain: 'pricing', objective: 'optimize revenue' },
 *   baselineScenario: { price: 100, volume: 10000 },
 *   variables: ['price', 'cost', 'demand elasticity']
 * });
 *
 * @references
 * - Palisade Decision Tools: https://www.palisade.com/
 * - Spreadsheet modeling best practices
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    analysisContext = {},
    baselineScenario = {},
    variables = [],
    stakeholders = [],
    outputDir = 'what-if-output'
  } = inputs;

  // Phase 1: Analysis Setup
  const analysisSetup = await ctx.task(analysisSetupTask, {
    projectName,
    analysisContext,
    baselineScenario,
    variables
  });

  // Phase 2: Variable Definition
  const variableDefinition = await ctx.task(variableDefinitionTask, {
    projectName,
    variables,
    baselineScenario,
    analysisSetup
  });

  // Phase 3: Scenario Design
  const scenarioDesign = await ctx.task(scenarioDesignTask, {
    projectName,
    variableDefinition,
    baselineScenario
  });

  // Phase 4: Model Development
  const modelDevelopment = await ctx.task(modelDevelopmentTask, {
    projectName,
    variableDefinition,
    scenarioDesign,
    baselineScenario
  });

  // Phase 5: Scenario Execution
  const scenarioExecution = await ctx.task(scenarioExecutionTask, {
    projectName,
    modelDevelopment,
    scenarioDesign
  });

  // Breakpoint: Review scenario results
  await ctx.breakpoint({
    question: `Review what-if analysis results for ${projectName}. Are the insights actionable?`,
    title: 'What-If Analysis Review',
    context: {
      runId: ctx.runId,
      projectName,
      scenarioCount: scenarioExecution.results?.length || 0
    }
  });

  // Phase 6: Sensitivity Analysis
  const sensitivityAnalysis = await ctx.task(whatIfSensitivityTask, {
    projectName,
    scenarioExecution,
    variableDefinition
  });

  // Phase 7: Insights Synthesis
  const insightsSynthesis = await ctx.task(whatIfInsightsTask, {
    projectName,
    scenarioExecution,
    sensitivityAnalysis
  });

  // Phase 8: Recommendations
  const recommendations = await ctx.task(whatIfRecommendationsTask, {
    projectName,
    insightsSynthesis,
    scenarioExecution,
    stakeholders
  });

  return {
    success: true,
    projectName,
    analysisFramework: {
      setup: analysisSetup,
      variables: variableDefinition,
      model: modelDevelopment
    },
    scenarioDesign,
    scenarioResults: scenarioExecution.results,
    sensitivityInsights: sensitivityAnalysis,
    insights: insightsSynthesis,
    recommendations,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/what-if-analysis-framework',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const analysisSetupTask = defineTask('analysis-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: `Analysis Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'What-If Analysis Designer',
      task: 'Set up what-if analysis framework',
      context: args,
      instructions: [
        '1. Define analysis objectives',
        '2. Identify key questions to answer',
        '3. Define output metrics',
        '4. Establish analysis boundaries',
        '5. Identify data requirements',
        '6. Define analysis timeline',
        '7. Identify stakeholder needs',
        '8. Document analysis scope'
      ],
      outputFormat: 'JSON object with analysis setup'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'questions', 'metrics'],
      properties: {
        objectives: { type: 'array' },
        questions: { type: 'array' },
        metrics: { type: 'array' },
        boundaries: { type: 'object' },
        dataRequirements: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'what-if', 'setup']
}));

export const variableDefinitionTask = defineTask('variable-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Variable Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Variable Definition Specialist',
      task: 'Define input and output variables for analysis',
      context: args,
      instructions: [
        '1. Identify controllable input variables',
        '2. Identify uncertain input variables',
        '3. Define output/dependent variables',
        '4. Specify variable ranges',
        '5. Define variable relationships',
        '6. Identify constraints',
        '7. Define baseline values',
        '8. Document variable metadata'
      ],
      outputFormat: 'JSON object with variable definitions'
    },
    outputSchema: {
      type: 'object',
      required: ['inputs', 'outputs', 'ranges'],
      properties: {
        inputs: { type: 'array' },
        outputs: { type: 'array' },
        controllable: { type: 'array' },
        uncertain: { type: 'array' },
        ranges: { type: 'object' },
        relationships: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'what-if', 'variables']
}));

export const scenarioDesignTask = defineTask('scenario-design', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scenario Design - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scenario Design Expert',
      task: 'Design what-if scenarios to analyze',
      context: args,
      instructions: [
        '1. Design single-variable scenarios',
        '2. Design multi-variable combinations',
        '3. Create best/worst case scenarios',
        '4. Design incremental change scenarios',
        '5. Create extreme scenarios',
        '6. Design comparative scenarios',
        '7. Ensure scenario coverage',
        '8. Document scenario rationale'
      ],
      outputFormat: 'JSON object with scenario designs'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'combinations', 'coverage'],
      properties: {
        scenarios: { type: 'array' },
        singleVariable: { type: 'array' },
        combinations: { type: 'array' },
        extremes: { type: 'array' },
        coverage: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'what-if', 'scenarios']
}));

export const modelDevelopmentTask = defineTask('model-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Analytical Model Developer',
      task: 'Develop what-if analysis model',
      context: args,
      instructions: [
        '1. Define model structure',
        '2. Specify calculation logic',
        '3. Implement variable relationships',
        '4. Build scenario engine',
        '5. Add validation checks',
        '6. Design output calculations',
        '7. Implement data tables',
        '8. Validate model accuracy'
      ],
      outputFormat: 'JSON object with model development'
    },
    outputSchema: {
      type: 'object',
      required: ['structure', 'calculations', 'validation'],
      properties: {
        structure: { type: 'object' },
        calculations: { type: 'array' },
        relationships: { type: 'object' },
        validation: { type: 'object' },
        dataTables: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'what-if', 'model']
}));

export const scenarioExecutionTask = defineTask('scenario-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scenario Execution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Scenario Execution Analyst',
      task: 'Execute what-if scenarios and collect results',
      context: args,
      instructions: [
        '1. Execute baseline scenario',
        '2. Run single-variable scenarios',
        '3. Execute combination scenarios',
        '4. Collect output metrics',
        '5. Validate result consistency',
        '6. Identify anomalies',
        '7. Create results tables',
        '8. Generate comparative views'
      ],
      outputFormat: 'JSON object with scenario execution'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'baseline', 'comparisons'],
      properties: {
        baseline: { type: 'object' },
        results: { type: 'array' },
        metrics: { type: 'object' },
        anomalies: { type: 'array' },
        comparisons: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'what-if', 'execution']
}));

export const whatIfSensitivityTask = defineTask('what-if-sensitivity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sensitivity Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Sensitivity Analysis Expert',
      task: 'Conduct sensitivity analysis on what-if results',
      context: args,
      instructions: [
        '1. Calculate sensitivity coefficients',
        '2. Identify most sensitive variables',
        '3. Create tornado diagrams',
        '4. Analyze threshold effects',
        '5. Identify non-linear relationships',
        '6. Calculate break-even points',
        '7. Identify interaction effects',
        '8. Document sensitivity findings'
      ],
      outputFormat: 'JSON object with sensitivity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['coefficients', 'rankings', 'thresholds'],
      properties: {
        coefficients: { type: 'object' },
        rankings: { type: 'array' },
        tornadoData: { type: 'array' },
        thresholds: { type: 'object' },
        interactions: { type: 'array' },
        breakEvenPoints: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'what-if', 'sensitivity']
}));

export const whatIfInsightsTask = defineTask('what-if-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: `Insights Synthesis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'What-If Insights Analyst',
      task: 'Synthesize insights from what-if analysis',
      context: args,
      instructions: [
        '1. Identify key insights from scenarios',
        '2. Highlight unexpected findings',
        '3. Identify optimal ranges',
        '4. Document risk factors',
        '5. Identify leverage points',
        '6. Summarize trade-offs',
        '7. Create insight narratives',
        '8. Visualize key findings'
      ],
      outputFormat: 'JSON object with insights synthesis'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'findings', 'visualizations'],
      properties: {
        insights: { type: 'array' },
        unexpected: { type: 'array' },
        optimalRanges: { type: 'object' },
        riskFactors: { type: 'array' },
        findings: { type: 'array' },
        visualizations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'what-if', 'insights']
}));

export const whatIfRecommendationsTask = defineTask('what-if-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Recommendations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'What-If Recommendation Specialist',
      task: 'Develop recommendations from what-if analysis',
      context: args,
      instructions: [
        '1. Identify recommended scenarios',
        '2. Define optimal variable settings',
        '3. Recommend risk mitigations',
        '4. Suggest monitoring points',
        '5. Define contingent actions',
        '6. Prioritize recommendations',
        '7. Create action plan',
        '8. Document decision support'
      ],
      outputFormat: 'JSON object with recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'optimalSettings', 'actionPlan'],
      properties: {
        recommendations: { type: 'array' },
        optimalSettings: { type: 'object' },
        riskMitigations: { type: 'array' },
        monitoring: { type: 'object' },
        contingencies: { type: 'array' },
        actionPlan: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'what-if', 'recommendations']
}));
