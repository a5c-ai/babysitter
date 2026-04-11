/**
 * @process domains/science/industrial-engineering/linear-programming
 * @description Linear Programming Model Development - Formulate and solve linear programming models for resource allocation,
 * production planning, blending problems, and capacity optimization using mathematical optimization techniques.
 * @inputs { problemDescription: string, decisionVariables?: array, constraints?: array, objectiveFunction?: string, solverPreference?: string }
 * @outputs { success: boolean, modelFormulation: object, solution: object, sensitivityAnalysis: object, artifacts: array }
 *
 * @example
 * const result = await orchestrate('domains/science/industrial-engineering/linear-programming', {
 *   problemDescription: 'Optimize production mix for 3 products with limited machine hours and raw materials',
 *   decisionVariables: ['x1', 'x2', 'x3'],
 *   objectiveFunction: 'maximize',
 *   solverPreference: 'or-tools'
 * });
 *
 * @references
 * - Hillier & Lieberman, Introduction to Operations Research
 * - Winston, Operations Research: Applications and Algorithms
 * - Google OR-Tools: https://developers.google.com/optimization
 * - CPLEX Optimization Studio: https://www.ibm.com/products/ilog-cplex-optimization-studio
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problemDescription,
    decisionVariables = [],
    constraints = [],
    objectiveFunction = 'maximize',
    solverPreference = 'or-tools',
    outputDir = 'linear-programming-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Linear Programming Model Development process');

  // Task 1: Problem Definition and Scoping
  ctx.log('info', 'Phase 1: Defining problem structure and scope');
  const problemDefinition = await ctx.task(problemDefinitionTask, {
    problemDescription,
    decisionVariables,
    constraints,
    objectiveFunction,
    outputDir
  });

  artifacts.push(...problemDefinition.artifacts);

  // Task 2: Mathematical Formulation
  ctx.log('info', 'Phase 2: Creating mathematical formulation');
  const mathematicalFormulation = await ctx.task(mathematicalFormulationTask, {
    problemDefinition,
    outputDir
  });

  artifacts.push(...mathematicalFormulation.artifacts);

  // Breakpoint: Review model formulation
  await ctx.breakpoint({
    question: `Linear programming model formulated with ${mathematicalFormulation.variableCount} decision variables and ${mathematicalFormulation.constraintCount} constraints. Review formulation before solving?`,
    title: 'LP Model Formulation Review',
    context: {
      runId: ctx.runId,
      formulation: mathematicalFormulation.formulation,
      variableCount: mathematicalFormulation.variableCount,
      constraintCount: mathematicalFormulation.constraintCount,
      files: mathematicalFormulation.artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  // Task 3: Model Implementation
  ctx.log('info', 'Phase 3: Implementing model in solver');
  const modelImplementation = await ctx.task(modelImplementationTask, {
    mathematicalFormulation,
    solverPreference,
    outputDir
  });

  artifacts.push(...modelImplementation.artifacts);

  // Task 4: Model Solving
  ctx.log('info', 'Phase 4: Solving optimization model');
  const solutionResult = await ctx.task(modelSolvingTask, {
    modelImplementation,
    solverPreference,
    outputDir
  });

  artifacts.push(...solutionResult.artifacts);

  if (!solutionResult.feasible) {
    await ctx.breakpoint({
      question: `Model is infeasible. Review constraints for conflicts or consider relaxing constraints?`,
      title: 'Infeasible Model',
      context: {
        runId: ctx.runId,
        status: solutionResult.status,
        infeasibilityAnalysis: solutionResult.infeasibilityAnalysis,
        files: solutionResult.artifacts.map(a => ({ path: a.path, format: a.format || 'json' }))
      }
    });
  }

  // Task 5: Solution Validation
  ctx.log('info', 'Phase 5: Validating solution');
  const solutionValidation = await ctx.task(solutionValidationTask, {
    solutionResult,
    mathematicalFormulation,
    outputDir
  });

  artifacts.push(...solutionValidation.artifacts);

  // Task 6: Sensitivity Analysis
  ctx.log('info', 'Phase 6: Performing sensitivity analysis');
  const sensitivityAnalysis = await ctx.task(sensitivityAnalysisTask, {
    solutionResult,
    mathematicalFormulation,
    outputDir
  });

  artifacts.push(...sensitivityAnalysis.artifacts);

  // Task 7: Report Generation
  ctx.log('info', 'Phase 7: Generating optimization report');
  const optimizationReport = await ctx.task(reportGenerationTask, {
    problemDefinition,
    mathematicalFormulation,
    solutionResult,
    solutionValidation,
    sensitivityAnalysis,
    outputDir
  });

  artifacts.push(...optimizationReport.artifacts);

  // Final Breakpoint: Review results
  await ctx.breakpoint({
    question: `Linear programming optimization complete. Optimal value: ${solutionResult.optimalValue}. Review recommendations?`,
    title: 'LP Optimization Results',
    context: {
      runId: ctx.runId,
      summary: {
        optimalValue: solutionResult.optimalValue,
        solutionStatus: solutionResult.status,
        variableValues: solutionResult.variableValues,
        bindingConstraints: sensitivityAnalysis.bindingConstraints
      },
      files: artifacts.map(a => ({ path: a.path, format: a.format || 'markdown' }))
    }
  });

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    modelFormulation: {
      decisionVariables: mathematicalFormulation.decisionVariables,
      objectiveFunction: mathematicalFormulation.objectiveFunction,
      constraints: mathematicalFormulation.constraints,
      variableCount: mathematicalFormulation.variableCount,
      constraintCount: mathematicalFormulation.constraintCount
    },
    solution: {
      status: solutionResult.status,
      feasible: solutionResult.feasible,
      optimalValue: solutionResult.optimalValue,
      variableValues: solutionResult.variableValues
    },
    sensitivityAnalysis: {
      shadowPrices: sensitivityAnalysis.shadowPrices,
      reducedCosts: sensitivityAnalysis.reducedCosts,
      bindingConstraints: sensitivityAnalysis.bindingConstraints,
      rangeAnalysis: sensitivityAnalysis.rangeAnalysis
    },
    recommendations: optimizationReport.recommendations,
    artifacts,
    duration,
    metadata: {
      processId: 'domains/science/industrial-engineering/linear-programming',
      timestamp: startTime,
      solverUsed: solverPreference,
      outputDir
    }
  };
}

// Task 1: Problem Definition
export const problemDefinitionTask = defineTask('problem-definition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define LP problem structure and scope',
  agent: {
    name: 'operations-research-analyst',
    prompt: {
      role: 'Operations Research Analyst',
      task: 'Define linear programming problem structure, decision variables, and constraints',
      context: args,
      instructions: [
        '1. Analyze problem description to identify optimization objective',
        '2. Define decision variables with clear descriptions and bounds',
        '3. Identify all constraints from problem context',
        '4. Classify constraints (resource, demand, logical, bound)',
        '5. Determine objective function type (maximize/minimize)',
        '6. Identify coefficients for objective function',
        '7. Document problem assumptions and limitations',
        '8. Create problem structure document'
      ],
      outputFormat: 'JSON with problem structure, variables, constraints, and assumptions'
    },
    outputSchema: {
      type: 'object',
      required: ['problemStructure', 'decisionVariables', 'constraints', 'objectiveType', 'artifacts'],
      properties: {
        problemStructure: { type: 'object' },
        decisionVariables: { type: 'array' },
        constraints: { type: 'array' },
        objectiveType: { type: 'string', enum: ['maximize', 'minimize'] },
        assumptions: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'linear-programming', 'problem-definition']
}));

// Task 2: Mathematical Formulation
export const mathematicalFormulationTask = defineTask('mathematical-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Create mathematical LP formulation',
  agent: {
    name: 'mathematical-modeler',
    prompt: {
      role: 'Mathematical Modeling Expert',
      task: 'Create formal mathematical formulation of the linear programming model',
      context: args,
      instructions: [
        '1. Define notation for decision variables',
        '2. Formulate objective function mathematically',
        '3. Express all constraints in standard form',
        '4. Specify variable bounds and domains',
        '5. Verify linearity of all expressions',
        '6. Create coefficient matrices (A, b, c)',
        '7. Document formulation in standard LP notation',
        '8. Generate LaTeX representation'
      ],
      outputFormat: 'JSON with mathematical formulation, coefficient matrices, and documentation'
    },
    outputSchema: {
      type: 'object',
      required: ['formulation', 'decisionVariables', 'objectiveFunction', 'constraints', 'variableCount', 'constraintCount', 'artifacts'],
      properties: {
        formulation: { type: 'object' },
        decisionVariables: { type: 'array' },
        objectiveFunction: { type: 'object' },
        constraints: { type: 'array' },
        variableCount: { type: 'number' },
        constraintCount: { type: 'number' },
        coefficientMatrices: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'linear-programming', 'mathematical-formulation']
}));

// Task 3: Model Implementation
export const modelImplementationTask = defineTask('model-implementation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement LP model in solver',
  agent: {
    name: 'optimization-engineer',
    prompt: {
      role: 'Optimization Engineer',
      task: 'Implement the linear programming model using optimization solver',
      context: args,
      instructions: [
        '1. Set up optimization solver environment',
        '2. Create decision variables in solver',
        '3. Add objective function to model',
        '4. Add all constraints to model',
        '5. Set variable bounds',
        '6. Configure solver parameters',
        '7. Generate solver code (Python/OR-Tools, CPLEX, Gurobi)',
        '8. Document implementation details'
      ],
      outputFormat: 'JSON with implementation code, solver configuration, and model file'
    },
    outputSchema: {
      type: 'object',
      required: ['implementationCode', 'solverConfig', 'modelFile', 'artifacts'],
      properties: {
        implementationCode: { type: 'string' },
        solverConfig: { type: 'object' },
        modelFile: { type: 'string' },
        solverType: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'linear-programming', 'implementation']
}));

// Task 4: Model Solving
export const modelSolvingTask = defineTask('model-solving', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Solve optimization model',
  agent: {
    name: 'optimization-solver',
    prompt: {
      role: 'Optimization Specialist',
      task: 'Execute the solver and obtain optimal solution',
      context: args,
      instructions: [
        '1. Run the optimization solver',
        '2. Check solution status (optimal, infeasible, unbounded)',
        '3. Extract optimal objective value',
        '4. Extract decision variable values',
        '5. Extract dual values (shadow prices)',
        '6. Record solver statistics (iterations, time)',
        '7. Handle infeasibility with IIS analysis if needed',
        '8. Document solution details'
      ],
      outputFormat: 'JSON with solution status, optimal values, variable values, and solver statistics'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'feasible', 'optimalValue', 'variableValues', 'artifacts'],
      properties: {
        status: { type: 'string', enum: ['optimal', 'infeasible', 'unbounded', 'error'] },
        feasible: { type: 'boolean' },
        optimalValue: { type: 'number' },
        variableValues: { type: 'object' },
        dualValues: { type: 'object' },
        solverStats: { type: 'object' },
        infeasibilityAnalysis: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'linear-programming', 'solving']
}));

// Task 5: Solution Validation
export const solutionValidationTask = defineTask('solution-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Validate LP solution',
  agent: {
    name: 'validation-analyst',
    prompt: {
      role: 'Quality Assurance Analyst',
      task: 'Validate that the solution satisfies all constraints and is reasonable',
      context: args,
      instructions: [
        '1. Verify all constraints are satisfied',
        '2. Check variable bounds are respected',
        '3. Recalculate objective value for verification',
        '4. Identify constraint slack/surplus values',
        '5. Check solution against known bounds or benchmarks',
        '6. Validate solution makes business sense',
        '7. Document any discrepancies',
        '8. Generate validation report'
      ],
      outputFormat: 'JSON with validation results, constraint satisfaction, and verification'
    },
    outputSchema: {
      type: 'object',
      required: ['validated', 'constraintsSatisfied', 'validationDetails', 'artifacts'],
      properties: {
        validated: { type: 'boolean' },
        constraintsSatisfied: { type: 'boolean' },
        slackValues: { type: 'object' },
        validationDetails: { type: 'array' },
        discrepancies: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'linear-programming', 'validation']
}));

// Task 6: Sensitivity Analysis
export const sensitivityAnalysisTask = defineTask('sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform sensitivity analysis',
  agent: {
    name: 'sensitivity-analyst',
    prompt: {
      role: 'Operations Research Analyst',
      task: 'Perform comprehensive sensitivity analysis on the optimal solution',
      context: args,
      instructions: [
        '1. Calculate shadow prices for all constraints',
        '2. Calculate reduced costs for all variables',
        '3. Identify binding and non-binding constraints',
        '4. Determine allowable ranges for objective coefficients',
        '5. Determine allowable ranges for RHS values',
        '6. Analyze impact of parameter changes',
        '7. Identify critical constraints and resources',
        '8. Generate sensitivity report'
      ],
      outputFormat: 'JSON with shadow prices, reduced costs, ranges, and sensitivity insights'
    },
    outputSchema: {
      type: 'object',
      required: ['shadowPrices', 'reducedCosts', 'bindingConstraints', 'rangeAnalysis', 'artifacts'],
      properties: {
        shadowPrices: { type: 'object' },
        reducedCosts: { type: 'object' },
        bindingConstraints: { type: 'array' },
        rangeAnalysis: { type: 'object' },
        criticalResources: { type: 'array' },
        sensitivityInsights: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'linear-programming', 'sensitivity-analysis']
}));

// Task 7: Report Generation
export const reportGenerationTask = defineTask('report-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate optimization report',
  agent: {
    name: 'technical-writer',
    prompt: {
      role: 'Technical Writer and Operations Research Analyst',
      task: 'Generate comprehensive optimization report with recommendations',
      context: args,
      instructions: [
        '1. Create executive summary of optimization results',
        '2. Document problem formulation',
        '3. Present optimal solution with interpretation',
        '4. Include sensitivity analysis findings',
        '5. Provide actionable recommendations',
        '6. Discuss limitations and assumptions',
        '7. Suggest areas for model improvement',
        '8. Format as professional report'
      ],
      outputFormat: 'JSON with report path, recommendations, and key findings'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'recommendations', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
        keyFindings: { type: 'array', items: { type: 'string' } },
        executiveSummary: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'industrial-engineering', 'linear-programming', 'reporting']
}));
