/**
 * @process specializations/domains/business/decision-intelligence/prescriptive-analytics-optimization
 * @description Prescriptive Analytics and Optimization - Implementation of optimization models and prescriptive
 * analytics to recommend optimal courses of action for resource allocation and planning.
 * @inputs { projectName: string, optimizationProblem: object, constraints: array, objectives: array, dataContext?: object }
 * @outputs { success: boolean, optimizationModel: object, optimalSolution: object, sensitivityAnalysis: object, implementationPlan: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/prescriptive-analytics-optimization', {
 *   projectName: 'Supply Chain Network Optimization',
 *   optimizationProblem: { type: 'mixed-integer', domain: 'logistics' },
 *   constraints: ['budget', 'capacity', 'service level'],
 *   objectives: ['minimize cost', 'maximize service']
 * });
 *
 * @references
 * - IBM Decision Optimization: https://www.ibm.com/analytics/decision-optimization
 * - Operations Research: Hillier and Lieberman
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    optimizationProblem = {},
    constraints = [],
    objectives = [],
    dataContext = {},
    outputDir = 'prescriptive-analytics-output'
  } = inputs;

  // Phase 1: Problem Formulation
  const problemFormulation = await ctx.task(optimizationProblemFormulationTask, {
    projectName,
    optimizationProblem,
    constraints,
    objectives
  });

  // Phase 2: Data Preparation
  const dataPreparation = await ctx.task(optimizationDataPreparationTask, {
    projectName,
    problemFormulation,
    dataContext
  });

  // Phase 3: Model Development
  const modelDevelopment = await ctx.task(optimizationModelDevelopmentTask, {
    projectName,
    problemFormulation,
    dataPreparation
  });

  // Phase 4: Solution Generation
  const solutionGeneration = await ctx.task(solutionGenerationTask, {
    projectName,
    modelDevelopment
  });

  // Breakpoint: Review optimization results
  await ctx.breakpoint({
    question: `Review optimization solution for ${projectName}. Is the solution feasible and implementable?`,
    title: 'Optimization Results Review',
    context: {
      runId: ctx.runId,
      projectName,
      objectiveValue: solutionGeneration.objectiveValue || 'N/A'
    }
  });

  // Phase 5: Sensitivity Analysis
  const sensitivityAnalysis = await ctx.task(optimizationSensitivityTask, {
    projectName,
    solutionGeneration,
    modelDevelopment
  });

  // Phase 6: Scenario Analysis
  const scenarioAnalysis = await ctx.task(optimizationScenarioTask, {
    projectName,
    modelDevelopment,
    solutionGeneration
  });

  // Phase 7: Business Translation
  const businessTranslation = await ctx.task(optimizationBusinessTranslationTask, {
    projectName,
    solutionGeneration,
    sensitivityAnalysis,
    problemFormulation
  });

  // Phase 8: Implementation Planning
  const implementationPlan = await ctx.task(optimizationImplementationTask, {
    projectName,
    businessTranslation,
    solutionGeneration
  });

  return {
    success: true,
    projectName,
    problemFormulation,
    dataPreparation,
    optimizationModel: modelDevelopment,
    optimalSolution: solutionGeneration,
    sensitivityAnalysis,
    scenarioAnalysis,
    businessTranslation,
    implementationPlan,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/prescriptive-analytics-optimization',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const optimizationProblemFormulationTask = defineTask('optimization-problem-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Problem Formulation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Operations Research Analyst',
      task: 'Formulate optimization problem mathematically',
      context: args,
      instructions: [
        '1. Define decision variables',
        '2. Formulate objective function',
        '3. Define constraints mathematically',
        '4. Identify problem type (LP, MIP, NLP)',
        '5. Define variable bounds',
        '6. Handle multi-objective formulation',
        '7. Validate mathematical formulation',
        '8. Document problem specification'
      ],
      outputFormat: 'JSON object with problem formulation'
    },
    outputSchema: {
      type: 'object',
      required: ['decisionVariables', 'objective', 'constraints'],
      properties: {
        decisionVariables: { type: 'array' },
        objective: { type: 'object' },
        constraints: { type: 'array' },
        problemType: { type: 'string' },
        bounds: { type: 'object' },
        multiObjective: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'optimization', 'formulation']
}));

export const optimizationDataPreparationTask = defineTask('optimization-data-preparation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Data Preparation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Optimization Data Specialist',
      task: 'Prepare data for optimization model',
      context: args,
      instructions: [
        '1. Identify data requirements',
        '2. Collect parameter values',
        '3. Estimate uncertain parameters',
        '4. Validate data consistency',
        '5. Handle missing data',
        '6. Create data tables',
        '7. Validate against constraints',
        '8. Document data sources'
      ],
      outputFormat: 'JSON object with data preparation'
    },
    outputSchema: {
      type: 'object',
      required: ['parameters', 'dataTables', 'validation'],
      properties: {
        dataRequirements: { type: 'array' },
        parameters: { type: 'object' },
        estimates: { type: 'object' },
        dataTables: { type: 'object' },
        validation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'optimization', 'data']
}));

export const optimizationModelDevelopmentTask = defineTask('optimization-model-development', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Development - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Optimization Model Developer',
      task: 'Develop optimization model',
      context: args,
      instructions: [
        '1. Select solver technology',
        '2. Implement mathematical model',
        '3. Configure solver parameters',
        '4. Validate model implementation',
        '5. Test with simple cases',
        '6. Handle computational complexity',
        '7. Implement warm start if needed',
        '8. Document model implementation'
      ],
      outputFormat: 'JSON object with model development'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'solver', 'validation'],
      properties: {
        solver: { type: 'object' },
        model: { type: 'object' },
        configuration: { type: 'object' },
        validation: { type: 'object' },
        complexity: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'optimization', 'model']
}));

export const solutionGenerationTask = defineTask('solution-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Solution Generation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Optimization Solution Analyst',
      task: 'Generate and analyze optimal solution',
      context: args,
      instructions: [
        '1. Run optimization solver',
        '2. Verify solution feasibility',
        '3. Calculate objective value',
        '4. Extract decision variable values',
        '5. Identify binding constraints',
        '6. Calculate slack values',
        '7. Verify solution quality',
        '8. Document solution details'
      ],
      outputFormat: 'JSON object with solution generation'
    },
    outputSchema: {
      type: 'object',
      required: ['solution', 'objectiveValue', 'feasibility'],
      properties: {
        solution: { type: 'object' },
        objectiveValue: { type: 'number' },
        decisionValues: { type: 'object' },
        bindingConstraints: { type: 'array' },
        slack: { type: 'object' },
        feasibility: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'optimization', 'solution']
}));

export const optimizationSensitivityTask = defineTask('optimization-sensitivity', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sensitivity Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Optimization Sensitivity Analyst',
      task: 'Conduct sensitivity analysis on optimization',
      context: args,
      instructions: [
        '1. Calculate shadow prices',
        '2. Determine reduced costs',
        '3. Identify sensitivity ranges',
        '4. Analyze parameter sensitivities',
        '5. Identify critical parameters',
        '6. Calculate allowable changes',
        '7. Identify solution stability',
        '8. Document sensitivity findings'
      ],
      outputFormat: 'JSON object with sensitivity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['shadowPrices', 'reducedCosts', 'ranges'],
      properties: {
        shadowPrices: { type: 'object' },
        reducedCosts: { type: 'object' },
        ranges: { type: 'object' },
        criticalParameters: { type: 'array' },
        stability: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'optimization', 'sensitivity']
}));

export const optimizationScenarioTask = defineTask('optimization-scenario', (args, taskCtx) => ({
  kind: 'agent',
  title: `Scenario Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Optimization Scenario Analyst',
      task: 'Conduct scenario analysis on optimization',
      context: args,
      instructions: [
        '1. Define scenario dimensions',
        '2. Create parameter scenarios',
        '3. Solve under each scenario',
        '4. Compare optimal solutions',
        '5. Identify robust decisions',
        '6. Calculate regret measures',
        '7. Identify scenario-sensitive decisions',
        '8. Document scenario findings'
      ],
      outputFormat: 'JSON object with scenario analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['scenarios', 'solutions', 'comparison'],
      properties: {
        scenarios: { type: 'array' },
        solutions: { type: 'object' },
        comparison: { type: 'object' },
        robustDecisions: { type: 'array' },
        regret: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'optimization', 'scenarios']
}));

export const optimizationBusinessTranslationTask = defineTask('optimization-business-translation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Business Translation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Optimization Business Translator',
      task: 'Translate optimization results to business recommendations',
      context: args,
      instructions: [
        '1. Translate decision variables to actions',
        '2. Quantify business impact',
        '3. Create implementation guidance',
        '4. Identify key trade-offs',
        '5. Explain constraint implications',
        '6. Create executive summary',
        '7. Develop business case',
        '8. Document recommendations'
      ],
      outputFormat: 'JSON object with business translation'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'impact', 'recommendations'],
      properties: {
        actions: { type: 'array' },
        impact: { type: 'object' },
        tradeoffs: { type: 'array' },
        executiveSummary: { type: 'string' },
        businessCase: { type: 'object' },
        recommendations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'optimization', 'business']
}));

export const optimizationImplementationTask = defineTask('optimization-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Implementation Planning - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Optimization Implementation Planner',
      task: 'Plan implementation of optimization solution',
      context: args,
      instructions: [
        '1. Create implementation timeline',
        '2. Identify change requirements',
        '3. Define resource needs',
        '4. Plan stakeholder communication',
        '5. Define success metrics',
        '6. Plan monitoring approach',
        '7. Identify risks and mitigations',
        '8. Create action plan'
      ],
      outputFormat: 'JSON object with implementation plan'
    },
    outputSchema: {
      type: 'object',
      required: ['timeline', 'resources', 'metrics'],
      properties: {
        timeline: { type: 'object' },
        changes: { type: 'array' },
        resources: { type: 'object' },
        communication: { type: 'object' },
        metrics: { type: 'array' },
        risks: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'optimization', 'implementation']
}));
