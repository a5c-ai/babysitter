/**
 * @process specializations/domains/science/mathematics/sensitivity-analysis-optimization
 * @description Perform sensitivity analysis on optimization solutions to understand parameter impacts,
 * identify binding constraints, and assess solution robustness.
 * @inputs { optimizationProblem: object, solution?: object, parametersOfInterest?: array }
 * @outputs { success: boolean, dualVariables: object, bindingConstraints: array, parametricAnalysis: object, robustnessAssessment: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/mathematics/sensitivity-analysis-optimization', {
 *   optimizationProblem: { type: 'LP', objective: 'max 3x + 5y', constraints: ['x + y <= 4', '2x + y <= 6'] },
 *   solution: { x: 2, y: 2, optimalValue: 16 },
 *   parametersOfInterest: ['resource_limits', 'objective_coefficients']
 * });
 *
 * @references
 * - Bertsimas & Tsitsiklis, Introduction to Linear Optimization
 * - Nocedal & Wright, Numerical Optimization
 * - Gal & Greenberg, Advances in Sensitivity Analysis and Parametric Programming
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    optimizationProblem,
    solution = {},
    parametersOfInterest = []
  } = inputs;

  // Phase 1: Compute Dual Variables
  const dualAnalysis = await ctx.task(dualAnalysisTask, {
    optimizationProblem,
    solution
  });

  // Quality Gate: Dual solution must be available
  if (!dualAnalysis.dualVariables) {
    return {
      success: false,
      error: 'Unable to compute dual variables',
      phase: 'dual-analysis',
      sensitivityResults: null
    };
  }

  // Breakpoint: Review dual analysis
  await ctx.breakpoint({
    question: `Dual analysis complete. ${dualAnalysis.bindingConstraints.length} binding constraints identified. Review?`,
    title: 'Dual Analysis Review',
    context: {
      runId: ctx.runId,
      dualVariables: dualAnalysis.dualVariables,
      bindingConstraints: dualAnalysis.bindingConstraints,
      files: [{
        path: `artifacts/phase1-dual-analysis.json`,
        format: 'json',
        content: dualAnalysis
      }]
    }
  });

  // Phase 2: Analyze Binding Constraints
  const bindingAnalysis = await ctx.task(bindingAnalysisTask, {
    optimizationProblem,
    dualAnalysis,
    solution
  });

  // Phase 3: Perform Parametric Analysis
  const parametricAnalysis = await ctx.task(parametricAnalysisTask, {
    optimizationProblem,
    solution,
    dualAnalysis,
    parametersOfInterest
  });

  // Phase 4: Identify Critical Parameters
  const criticalParameters = await ctx.task(criticalParametersTask, {
    parametricAnalysis,
    dualAnalysis,
    optimizationProblem
  });

  // Phase 5: Generate Sensitivity Reports
  const sensitivityReport = await ctx.task(sensitivityReportTask, {
    dualAnalysis,
    bindingAnalysis,
    parametricAnalysis,
    criticalParameters,
    optimizationProblem,
    solution
  });

  // Final Breakpoint: Analysis Complete
  await ctx.breakpoint({
    question: `Sensitivity analysis complete. ${criticalParameters.criticalParams.length} critical parameters identified. Review report?`,
    title: 'Sensitivity Analysis Complete',
    context: {
      runId: ctx.runId,
      criticalParameters: criticalParameters.criticalParams,
      robustness: sensitivityReport.robustnessScore,
      files: [
        { path: `artifacts/sensitivity-report.json`, format: 'json', content: sensitivityReport }
      ]
    }
  });

  return {
    success: true,
    optimizationProblem: optimizationProblem.type,
    dualVariables: {
      values: dualAnalysis.dualVariables,
      interpretation: dualAnalysis.interpretation
    },
    bindingConstraints: bindingAnalysis.bindingConstraints,
    parametricAnalysis: {
      rhsRanges: parametricAnalysis.rhsRanges,
      objectiveRanges: parametricAnalysis.objectiveRanges,
      optimalityRanges: parametricAnalysis.optimalityRanges
    },
    criticalParameters: criticalParameters.criticalParams,
    robustnessAssessment: {
      score: sensitivityReport.robustnessScore,
      vulnerabilities: sensitivityReport.vulnerabilities,
      recommendations: sensitivityReport.recommendations
    },
    shadowPrices: dualAnalysis.shadowPrices,
    reducedCosts: dualAnalysis.reducedCosts,
    metadata: {
      processId: 'specializations/domains/science/mathematics/sensitivity-analysis-optimization',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const dualAnalysisTask = defineTask('dual-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 1: Compute Dual Variables`,
  agent: {
    name: 'optimization-expert',
    skills: ['cvxpy-optimization-modeling', 'sympy-computer-algebra', 'numerical-linear-algebra-toolkit'],
    prompt: {
      role: 'Optimization Duality Expert',
      task: 'Compute and interpret dual variables for the optimization solution',
      context: {
        optimizationProblem: args.optimizationProblem,
        solution: args.solution
      },
      instructions: [
        '1. Formulate the dual problem',
        '2. Compute dual variable values (shadow prices)',
        '3. Compute reduced costs for variables',
        '4. Verify complementary slackness conditions',
        '5. Interpret economic meaning of dual variables',
        '6. Identify binding constraints (where dual > 0)',
        '7. Check for degeneracy',
        '8. Verify strong duality',
        '9. Document dual problem formulation',
        '10. Explain dual variable interpretation'
      ],
      outputFormat: 'JSON object with dual analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['dualVariables', 'bindingConstraints', 'shadowPrices'],
      properties: {
        dualVariables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraint: { type: 'string' },
              value: { type: 'number' },
              interpretation: { type: 'string' }
            }
          }
        },
        shadowPrices: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              price: { type: 'number' },
              meaning: { type: 'string' }
            }
          }
        },
        reducedCosts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              cost: { type: 'number' },
              interpretation: { type: 'string' }
            }
          }
        },
        bindingConstraints: { type: 'array', items: { type: 'string' } },
        slackConstraints: { type: 'array', items: { type: 'string' } },
        complementarySlackness: { type: 'boolean' },
        degeneracy: {
          type: 'object',
          properties: {
            primalDegenerate: { type: 'boolean' },
            dualDegenerate: { type: 'boolean' }
          }
        },
        strongDuality: { type: 'boolean' },
        interpretation: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'sensitivity-analysis', 'duality']
}));

export const bindingAnalysisTask = defineTask('binding-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 2: Analyze Binding Constraints`,
  agent: {
    name: 'optimization-expert',
    skills: ['cvxpy-optimization-modeling', 'numerical-linear-algebra-toolkit', 'sympy-computer-algebra'],
    prompt: {
      role: 'Constraint Analysis Expert',
      task: 'Analyze binding constraints and their implications',
      context: {
        optimizationProblem: args.optimizationProblem,
        dualAnalysis: args.dualAnalysis,
        solution: args.solution
      },
      instructions: [
        '1. Identify all binding (active) constraints',
        '2. Compute constraint slack for non-binding constraints',
        '3. Analyze constraint gradients at solution',
        '4. Determine active set stability',
        '5. Identify nearly-binding constraints',
        '6. Assess bottleneck resources',
        '7. Analyze constraint interactions',
        '8. Compute feasibility margin',
        '9. Identify redundant constraints',
        '10. Document binding constraint analysis'
      ],
      outputFormat: 'JSON object with binding constraint analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['bindingConstraints', 'slackAnalysis'],
      properties: {
        bindingConstraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraint: { type: 'string' },
              slack: { type: 'number' },
              dualValue: { type: 'number' },
              bottleneck: { type: 'boolean' }
            }
          }
        },
        slackAnalysis: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraint: { type: 'string' },
              slack: { type: 'number' },
              percentUsed: { type: 'number' }
            }
          }
        },
        nearlyBinding: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraint: { type: 'string' },
              slack: { type: 'number' },
              threshold: { type: 'number' }
            }
          }
        },
        activeSetStability: { type: 'string' },
        redundantConstraints: { type: 'array', items: { type: 'string' } },
        bottleneckResources: { type: 'array', items: { type: 'string' } },
        feasibilityMargin: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'sensitivity-analysis', 'binding-constraints']
}));

export const parametricAnalysisTask = defineTask('parametric-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 3: Perform Parametric Analysis`,
  agent: {
    name: 'optimization-expert',
    skills: ['cvxpy-optimization-modeling', 'sympy-computer-algebra', 'monte-carlo-simulation'],
    prompt: {
      role: 'Parametric Optimization Expert',
      task: 'Perform parametric analysis on problem parameters',
      context: {
        optimizationProblem: args.optimizationProblem,
        solution: args.solution,
        dualAnalysis: args.dualAnalysis,
        parametersOfInterest: args.parametersOfInterest
      },
      instructions: [
        '1. Compute allowable ranges for RHS values',
        '2. Compute allowable ranges for objective coefficients',
        '3. Determine optimality ranges for variables',
        '4. Compute basis change points',
        '5. Analyze objective value as function of parameters',
        '6. Generate sensitivity tables',
        '7. Identify parameter interactions',
        '8. Compute partial derivatives of optimal value',
        '9. Analyze multi-parameter changes',
        '10. Document parametric analysis'
      ],
      outputFormat: 'JSON object with parametric analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['rhsRanges', 'objectiveRanges'],
      properties: {
        rhsRanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraint: { type: 'string' },
              currentValue: { type: 'number' },
              allowableIncrease: { type: 'number' },
              allowableDecrease: { type: 'number' },
              shadowPrice: { type: 'number' }
            }
          }
        },
        objectiveRanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              currentCoeff: { type: 'number' },
              allowableIncrease: { type: 'number' },
              allowableDecrease: { type: 'number' }
            }
          }
        },
        optimalityRanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              currentValue: { type: 'number' },
              stableRange: { type: 'object' }
            }
          }
        },
        basisChangePoints: { type: 'array', items: { type: 'object' } },
        optimalValueFunction: { type: 'string' },
        sensitivityTable: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'sensitivity-analysis', 'parametric']
}));

export const criticalParametersTask = defineTask('critical-parameters', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 4: Identify Critical Parameters`,
  agent: {
    name: 'optimization-expert',
    skills: ['monte-carlo-simulation', 'cvxpy-optimization-modeling', 'sympy-computer-algebra'],
    prompt: {
      role: 'Optimization Robustness Analyst',
      task: 'Identify parameters most critical to solution quality',
      context: {
        parametricAnalysis: args.parametricAnalysis,
        dualAnalysis: args.dualAnalysis,
        optimizationProblem: args.optimizationProblem
      },
      instructions: [
        '1. Rank parameters by impact on optimal value',
        '2. Identify parameters with tight allowable ranges',
        '3. Compute sensitivity indices',
        '4. Identify parameters requiring precise estimation',
        '5. Assess uncertainty propagation',
        '6. Identify robust vs fragile aspects of solution',
        '7. Compute worst-case parameter scenarios',
        '8. Assess solution stability regions',
        '9. Rank criticality of each parameter',
        '10. Provide recommendations for parameter management'
      ],
      outputFormat: 'JSON object with critical parameter analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['criticalParams', 'sensitivityRanking'],
      properties: {
        criticalParams: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              criticality: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impact: { type: 'number' },
              allowableRange: { type: 'object' },
              recommendation: { type: 'string' }
            }
          }
        },
        sensitivityRanking: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              rank: { type: 'number' },
              sensitivityIndex: { type: 'number' }
            }
          }
        },
        robustParameters: { type: 'array', items: { type: 'string' } },
        fragileParameters: { type: 'array', items: { type: 'string' } },
        worstCaseScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              impact: { type: 'number' }
            }
          }
        },
        stabilityRegion: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'sensitivity-analysis', 'critical-parameters']
}));

export const sensitivityReportTask = defineTask('sensitivity-report', (args, taskCtx) => ({
  kind: 'agent',
  title: `Phase 5: Generate Sensitivity Reports`,
  agent: {
    name: 'optimization-expert',
    skills: ['latex-math-formatter', 'cvxpy-optimization-modeling', 'monte-carlo-simulation'],
    prompt: {
      role: 'Sensitivity Analysis Reporting Specialist',
      task: 'Generate comprehensive sensitivity analysis report',
      context: {
        dualAnalysis: args.dualAnalysis,
        bindingAnalysis: args.bindingAnalysis,
        parametricAnalysis: args.parametricAnalysis,
        criticalParameters: args.criticalParameters,
        optimizationProblem: args.optimizationProblem,
        solution: args.solution
      },
      instructions: [
        '1. Summarize key sensitivity findings',
        '2. Create executive summary for decision makers',
        '3. Generate sensitivity tables',
        '4. Assess overall solution robustness',
        '5. Identify vulnerabilities',
        '6. Provide actionable recommendations',
        '7. Generate visualizations descriptions',
        '8. Document assumptions and limitations',
        '9. Suggest follow-up analyses',
        '10. Create comprehensive report'
      ],
      outputFormat: 'JSON object with sensitivity report'
    },
    outputSchema: {
      type: 'object',
      required: ['robustnessScore', 'vulnerabilities', 'recommendations'],
      properties: {
        executiveSummary: { type: 'string' },
        robustnessScore: { type: 'number', minimum: 0, maximum: 100 },
        vulnerabilities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              vulnerability: { type: 'string' },
              severity: { type: 'string', enum: ['high', 'medium', 'low'] },
              mitigation: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              priority: { type: 'string', enum: ['high', 'medium', 'low'] },
              rationale: { type: 'string' }
            }
          }
        },
        sensitivityTables: { type: 'object' },
        visualizationDescriptions: { type: 'array', items: { type: 'string' } },
        assumptions: { type: 'array', items: { type: 'string' } },
        limitations: { type: 'array', items: { type: 'string' } },
        followUpAnalyses: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['mathematics', 'sensitivity-analysis', 'reporting']
}));
