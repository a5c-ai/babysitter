/**
 * @process specializations/domains/business/decision-intelligence/monte-carlo-simulation
 * @description Monte Carlo Simulation for Decision Support - Application of probabilistic simulation techniques
 * to model uncertainty and risk in strategic and operational decisions.
 * @inputs { projectName: string, modelContext: object, uncertainVariables: array, iterations?: number, objectives?: array }
 * @outputs { success: boolean, simulationModel: object, results: object, riskAnalysis: object, recommendations: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/business/decision-intelligence/monte-carlo-simulation', {
 *   projectName: 'Investment Portfolio Risk Analysis',
 *   modelContext: { domain: 'finance', type: 'portfolio' },
 *   uncertainVariables: ['marketReturn', 'volatility', 'inflation'],
 *   iterations: 10000
 * });
 *
 * @references
 * - Lumina Decision Systems: https://lumina.com/
 * - Risk Analysis: A Quantitative Guide
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    modelContext = {},
    uncertainVariables = [],
    iterations = 10000,
    objectives = [],
    outputDir = 'monte-carlo-output'
  } = inputs;

  // Phase 1: Model Definition
  const modelDefinition = await ctx.task(modelDefinitionTask, {
    projectName,
    modelContext,
    uncertainVariables,
    objectives
  });

  // Phase 2: Distribution Specification
  const distributionSpecification = await ctx.task(distributionSpecificationTask, {
    projectName,
    uncertainVariables,
    modelDefinition
  });

  // Phase 3: Correlation Structure
  const correlationStructure = await ctx.task(correlationStructureTask, {
    projectName,
    uncertainVariables,
    distributionSpecification
  });

  // Phase 4: Simulation Engine Setup
  const simulationEngine = await ctx.task(simulationEngineTask, {
    projectName,
    modelDefinition,
    distributionSpecification,
    correlationStructure,
    iterations
  });

  // Phase 5: Simulation Execution
  const simulationExecution = await ctx.task(simulationExecutionTask, {
    projectName,
    simulationEngine,
    iterations
  });

  // Breakpoint: Review simulation results
  await ctx.breakpoint({
    question: `Review Monte Carlo simulation results for ${projectName}. Are the distributions reasonable?`,
    title: 'Simulation Results Review',
    context: {
      runId: ctx.runId,
      projectName,
      iterations
    }
  });

  // Phase 6: Statistical Analysis
  const statisticalAnalysis = await ctx.task(statisticalAnalysisTask, {
    projectName,
    simulationExecution
  });

  // Phase 7: Risk Metrics Calculation
  const riskMetrics = await ctx.task(riskMetricsTask, {
    projectName,
    simulationExecution,
    statisticalAnalysis,
    objectives
  });

  // Phase 8: Recommendations
  const recommendations = await ctx.task(monteCarloRecommendationsTask, {
    projectName,
    statisticalAnalysis,
    riskMetrics,
    modelContext
  });

  return {
    success: true,
    projectName,
    simulationModel: {
      definition: modelDefinition,
      distributions: distributionSpecification,
      correlations: correlationStructure
    },
    simulationEngine,
    results: simulationExecution,
    statisticalAnalysis,
    riskAnalysis: riskMetrics,
    recommendations,
    metadata: {
      processId: 'specializations/domains/business/decision-intelligence/monte-carlo-simulation',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const modelDefinitionTask = defineTask('model-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Definition - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Monte Carlo Model Designer',
      task: 'Define simulation model structure',
      context: args,
      instructions: [
        '1. Define model objectives',
        '2. Identify input variables',
        '3. Specify output metrics',
        '4. Define calculation logic',
        '5. Identify uncertain vs certain inputs',
        '6. Define time periods if dynamic',
        '7. Establish model boundaries',
        '8. Document model assumptions'
      ],
      outputFormat: 'JSON object with model definition'
    },
    outputSchema: {
      type: 'object',
      required: ['objectives', 'inputs', 'outputs', 'calculations'],
      properties: {
        objectives: { type: 'array' },
        inputs: { type: 'array' },
        outputs: { type: 'array' },
        calculations: { type: 'object' },
        assumptions: { type: 'array' },
        boundaries: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'monte-carlo', 'model']
}));

export const distributionSpecificationTask = defineTask('distribution-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: `Distribution Specification - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Probability Distribution Expert',
      task: 'Specify probability distributions for uncertain variables',
      context: args,
      instructions: [
        '1. Select appropriate distribution types',
        '2. Estimate distribution parameters',
        '3. Use expert elicitation techniques',
        '4. Validate distribution fit',
        '5. Consider bounded vs unbounded',
        '6. Handle discrete vs continuous',
        '7. Document parameter sources',
        '8. Create distribution summary'
      ],
      outputFormat: 'JSON object with distribution specifications'
    },
    outputSchema: {
      type: 'object',
      required: ['distributions', 'parameters', 'rationale'],
      properties: {
        distributions: { type: 'object' },
        parameters: { type: 'object' },
        types: { type: 'object' },
        rationale: { type: 'object' },
        sources: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'monte-carlo', 'distributions']
}));

export const correlationStructureTask = defineTask('correlation-structure', (args, taskCtx) => ({
  kind: 'agent',
  title: `Correlation Structure - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Correlation Modeling Specialist',
      task: 'Define correlation structure between variables',
      context: args,
      instructions: [
        '1. Identify correlated variables',
        '2. Estimate correlation coefficients',
        '3. Build correlation matrix',
        '4. Validate positive definiteness',
        '5. Consider copula specifications',
        '6. Handle tail dependencies',
        '7. Document correlation sources',
        '8. Create correlation summary'
      ],
      outputFormat: 'JSON object with correlation structure'
    },
    outputSchema: {
      type: 'object',
      required: ['correlationMatrix', 'pairs', 'validation'],
      properties: {
        correlationMatrix: { type: 'object' },
        pairs: { type: 'array' },
        coefficients: { type: 'object' },
        copula: { type: 'object' },
        validation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'monte-carlo', 'correlation']
}));

export const simulationEngineTask = defineTask('simulation-engine', (args, taskCtx) => ({
  kind: 'agent',
  title: `Simulation Engine Setup - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Simulation Engine Developer',
      task: 'Set up Monte Carlo simulation engine',
      context: args,
      instructions: [
        '1. Configure random number generation',
        '2. Implement sampling methods',
        '3. Set up correlation handling',
        '4. Implement calculation engine',
        '5. Configure iteration count',
        '6. Set up convergence monitoring',
        '7. Implement output collection',
        '8. Validate engine accuracy'
      ],
      outputFormat: 'JSON object with simulation engine setup'
    },
    outputSchema: {
      type: 'object',
      required: ['configuration', 'sampling', 'validation'],
      properties: {
        configuration: { type: 'object' },
        sampling: { type: 'object' },
        iterations: { type: 'number' },
        convergence: { type: 'object' },
        validation: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'monte-carlo', 'engine']
}));

export const simulationExecutionTask = defineTask('simulation-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Simulation Execution - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Simulation Execution Manager',
      task: 'Execute Monte Carlo simulation',
      context: args,
      instructions: [
        '1. Run simulation iterations',
        '2. Collect output samples',
        '3. Monitor convergence',
        '4. Store iteration data',
        '5. Handle errors gracefully',
        '6. Track execution progress',
        '7. Validate output integrity',
        '8. Create raw results summary'
      ],
      outputFormat: 'JSON object with simulation execution'
    },
    outputSchema: {
      type: 'object',
      required: ['iterations', 'outputs', 'convergence'],
      properties: {
        iterations: { type: 'number' },
        outputs: { type: 'object' },
        samples: { type: 'object' },
        convergence: { type: 'object' },
        executionTime: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'monte-carlo', 'execution']
}));

export const statisticalAnalysisTask = defineTask('statistical-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Statistical Analysis - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Statistical Analysis Expert',
      task: 'Analyze simulation results statistically',
      context: args,
      instructions: [
        '1. Calculate descriptive statistics',
        '2. Generate probability distributions',
        '3. Calculate percentiles',
        '4. Create cumulative distributions',
        '5. Identify outliers',
        '6. Calculate confidence intervals',
        '7. Generate histograms',
        '8. Create statistical summary'
      ],
      outputFormat: 'JSON object with statistical analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['statistics', 'percentiles', 'distributions'],
      properties: {
        statistics: { type: 'object' },
        percentiles: { type: 'object' },
        distributions: { type: 'object' },
        confidenceIntervals: { type: 'object' },
        outliers: { type: 'array' },
        histograms: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'monte-carlo', 'statistics']
}));

export const riskMetricsTask = defineTask('risk-metrics', (args, taskCtx) => ({
  kind: 'agent',
  title: `Risk Metrics Calculation - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk Metrics Specialist',
      task: 'Calculate risk metrics from simulation',
      context: args,
      instructions: [
        '1. Calculate Value at Risk (VaR)',
        '2. Calculate Conditional VaR (CVaR)',
        '3. Compute probability of loss',
        '4. Calculate expected shortfall',
        '5. Identify worst-case scenarios',
        '6. Calculate risk-adjusted returns',
        '7. Compute sensitivity contributions',
        '8. Create risk dashboard'
      ],
      outputFormat: 'JSON object with risk metrics'
    },
    outputSchema: {
      type: 'object',
      required: ['var', 'cvar', 'probabilities'],
      properties: {
        var: { type: 'object' },
        cvar: { type: 'object' },
        probabilities: { type: 'object' },
        expectedShortfall: { type: 'object' },
        worstCases: { type: 'array' },
        riskContributions: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'monte-carlo', 'risk']
}));

export const monteCarloRecommendationsTask = defineTask('monte-carlo-recommendations', (args, taskCtx) => ({
  kind: 'agent',
  title: `Recommendations - ${args.projectName}`,
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk-Based Decision Advisor',
      task: 'Develop recommendations from simulation results',
      context: args,
      instructions: [
        '1. Interpret key findings',
        '2. Identify risk mitigation options',
        '3. Recommend decision actions',
        '4. Suggest hedging strategies',
        '5. Define risk tolerance thresholds',
        '6. Recommend monitoring metrics',
        '7. Create decision guidance',
        '8. Document limitations'
      ],
      outputFormat: 'JSON object with recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'mitigations', 'guidance'],
      properties: {
        recommendations: { type: 'array' },
        findings: { type: 'array' },
        mitigations: { type: 'array' },
        hedging: { type: 'array' },
        monitoring: { type: 'object' },
        guidance: { type: 'object' },
        limitations: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['decision-intelligence', 'monte-carlo', 'recommendations']
}));
