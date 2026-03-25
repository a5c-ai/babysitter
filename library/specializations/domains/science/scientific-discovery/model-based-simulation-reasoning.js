/**
 * @process specializations/domains/science/scientific-discovery/model-based-simulation-reasoning
 * @description Model-Based Simulation Reasoning Process - Run internal models to predict
 * scenario consequences through mental simulation, forward projection, and what-if analysis.
 * @inputs { domain: string, model: object, scenario: object, simulationGoal: string, constraints?: object }
 * @outputs { success: boolean, predictions: object[], trajectories: object[], insights: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/model-based-simulation-reasoning', {
 *   domain: 'Climate Science',
 *   model: { type: 'system-dynamics', components: [...], equations: [...] },
 *   scenario: { intervention: 'carbon_tax', magnitude: 50, startYear: 2025 },
 *   simulationGoal: 'Predict temperature trajectory under carbon tax policy'
 * });
 *
 * @references
 * - Forbus (1984). Qualitative Process Theory
 * - Kuipers (1994). Qualitative Reasoning: Modeling and Simulation with Incomplete Knowledge
 * - Gentner & Stevens (1983). Mental Models
 * - Johnson-Laird (1983). Mental Models
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    domain,
    model,
    scenario,
    simulationGoal,
    constraints = {}
  } = inputs;

  // Phase 1: Model Analysis
  const modelAnalysis = await ctx.task(modelAnalysisTask, {
    domain,
    model,
    simulationGoal
  });

  // Phase 2: Scenario Specification
  const scenarioSpec = await ctx.task(scenarioSpecificationTask, {
    scenario,
    model,
    modelAnalysis,
    simulationGoal
  });

  // Quality Gate: Scenario must be compatible with model
  if (!scenarioSpec.isCompatible) {
    return {
      success: false,
      error: 'Scenario incompatible with model',
      issues: scenarioSpec.compatibilityIssues,
      predictions: null
    };
  }

  // Phase 3: Initial State Setup
  const initialState = await ctx.task(initialStateSetupTask, {
    model,
    scenarioSpec,
    constraints
  });

  // Phase 4: Simulation Execution
  const simulationExecution = await ctx.task(simulationExecutionTask, {
    model,
    initialState,
    scenarioSpec,
    constraints
  });

  // Phase 5: Trajectory Analysis
  const trajectoryAnalysis = await ctx.task(trajectoryAnalysisTask, {
    simulationExecution,
    modelAnalysis,
    simulationGoal
  });

  // Phase 6: Sensitivity Analysis
  const sensitivityAnalysis = await ctx.task(sensitivityAnalysisTask, {
    model,
    simulationExecution,
    scenarioSpec
  });

  // Phase 7: Uncertainty Quantification
  const uncertaintyAnalysis = await ctx.task(uncertaintyQuantificationTask, {
    simulationExecution,
    sensitivityAnalysis,
    model
  });

  // Breakpoint: Review simulation results
  await ctx.breakpoint({
    question: `Simulation complete for: "${simulationGoal}". Key prediction: ${trajectoryAnalysis.keyPrediction}. Review detailed results?`,
    title: 'Simulation Results Review',
    context: {
      runId: ctx.runId,
      domain,
      scenario: scenarioSpec.summary,
      keyFindings: trajectoryAnalysis.keyFindings
    }
  });

  // Phase 8: Scenario Comparison (alternative scenarios)
  const scenarioComparison = await ctx.task(scenarioComparisonTask, {
    primarySimulation: simulationExecution,
    model,
    scenarioSpec,
    domain
  });

  // Phase 9: Insight Extraction
  const insightExtraction = await ctx.task(insightExtractionTask, {
    trajectoryAnalysis,
    sensitivityAnalysis,
    scenarioComparison,
    simulationGoal,
    domain
  });

  // Phase 10: Validation
  const validation = await ctx.task(simulationValidationTask, {
    simulationExecution,
    modelAnalysis,
    uncertaintyAnalysis,
    domain
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Model-based simulation analysis complete. Confidence: ${validation.confidence}. Accept findings?`,
    title: 'Simulation Analysis Review',
    context: {
      runId: ctx.runId,
      domain,
      files: [
        { path: 'artifacts/trajectories.json', format: 'json', content: trajectoryAnalysis },
        { path: 'artifacts/insights.json', format: 'json', content: insightExtraction }
      ]
    }
  });

  return {
    success: true,
    domain,
    simulationGoal,
    scenario: scenarioSpec.summary,
    predictions: trajectoryAnalysis.predictions,
    trajectories: simulationExecution.trajectories,
    keyFindings: trajectoryAnalysis.keyFindings,
    insights: insightExtraction.insights,
    sensitivity: sensitivityAnalysis.results,
    uncertainty: uncertaintyAnalysis.bounds,
    alternativeScenarios: scenarioComparison.comparisons,
    validation: validation,
    recommendations: insightExtraction.recommendations,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/model-based-simulation-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const modelAnalysisTask = defineTask('model-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Model Analysis - ${args.domain}`,
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'simulation-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in computational modeling and system dynamics',
      task: 'Analyze the model structure and capabilities for simulation',
      context: {
        domain: args.domain,
        model: args.model,
        simulationGoal: args.simulationGoal
      },
      instructions: [
        '1. Identify model type (system dynamics, agent-based, qualitative, etc.)',
        '2. Catalog model components and their relationships',
        '3. Identify state variables and parameters',
        '4. Analyze model dynamics (feedback loops, delays, nonlinearities)',
        '5. Assess model scope and boundaries',
        '6. Identify model assumptions and limitations',
        '7. Determine appropriate time scales and resolution',
        '8. Assess model suitability for simulation goal',
        '9. Identify potential simulation challenges',
        '10. Document model capabilities and constraints'
      ],
      outputFormat: 'JSON object with model analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['modelType', 'components', 'suitability'],
      properties: {
        modelType: {
          type: 'string',
          enum: ['system-dynamics', 'agent-based', 'qualitative', 'discrete-event', 'hybrid', 'equation-based']
        },
        components: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' },
              role: { type: 'string' }
            }
          }
        },
        stateVariables: {
          type: 'array',
          items: { type: 'string' }
        },
        parameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'any' },
              range: { type: 'object' }
            }
          }
        },
        dynamics: {
          type: 'object',
          properties: {
            feedbackLoops: { type: 'array', items: { type: 'object' } },
            delays: { type: 'array', items: { type: 'string' } },
            nonlinearities: { type: 'array', items: { type: 'string' } }
          }
        },
        timeScale: {
          type: 'object',
          properties: {
            unit: { type: 'string' },
            resolution: { type: 'string' },
            horizon: { type: 'string' }
          }
        },
        suitability: {
          type: 'object',
          properties: {
            score: { type: 'number' },
            strengths: { type: 'array', items: { type: 'string' } },
            limitations: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['simulation', 'model-analysis', 'systems']
}));

export const scenarioSpecificationTask = defineTask('scenario-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scenario Specification',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'simulation-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in scenario planning and simulation design',
      task: 'Specify the simulation scenario in detail',
      context: {
        scenario: args.scenario,
        model: args.model,
        modelAnalysis: args.modelAnalysis,
        simulationGoal: args.simulationGoal
      },
      instructions: [
        '1. Translate scenario description into model terms',
        '2. Specify interventions and their timing',
        '3. Define scenario parameters and values',
        '4. Check compatibility with model capabilities',
        '5. Specify simulation time horizon',
        '6. Define output metrics of interest',
        '7. Identify scenario variants to explore',
        '8. Document scenario assumptions',
        '9. Define success criteria for simulation',
        '10. Create scenario summary'
      ],
      outputFormat: 'JSON object with scenario specification'
    },
    outputSchema: {
      type: 'object',
      required: ['isCompatible', 'interventions', 'timeHorizon'],
      properties: {
        isCompatible: { type: 'boolean' },
        compatibilityIssues: {
          type: 'array',
          items: { type: 'string' }
        },
        interventions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              change: { type: 'string' },
              value: { type: 'any' },
              timing: { type: 'string' }
            }
          }
        },
        parameters: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              value: { type: 'any' }
            }
          }
        },
        timeHorizon: {
          type: 'object',
          properties: {
            start: { type: 'any' },
            end: { type: 'any' },
            steps: { type: 'number' }
          }
        },
        outputMetrics: {
          type: 'array',
          items: { type: 'string' }
        },
        variants: {
          type: 'array',
          items: { type: 'object' }
        },
        assumptions: {
          type: 'array',
          items: { type: 'string' }
        },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['simulation', 'scenario', 'specification']
}));

export const initialStateSetupTask = defineTask('initial-state-setup', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Initial State Setup',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'simulation-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in simulation initialization and state specification',
      task: 'Set up initial state for simulation',
      context: {
        model: args.model,
        scenarioSpec: args.scenarioSpec,
        constraints: args.constraints
      },
      instructions: [
        '1. Define initial values for all state variables',
        '2. Set parameter values according to scenario',
        '3. Apply any boundary conditions',
        '4. Initialize any random number generators',
        '5. Set up initial agent states (if agent-based)',
        '6. Validate initial state consistency',
        '7. Document any default assumptions',
        '8. Prepare baseline for comparison',
        '9. Set up data collection structures',
        '10. Verify readiness for simulation'
      ],
      outputFormat: 'JSON object with initial state'
    },
    outputSchema: {
      type: 'object',
      required: ['stateValues', 'parameterValues', 'isValid'],
      properties: {
        stateValues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              initialValue: { type: 'any' }
            }
          }
        },
        parameterValues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              value: { type: 'any' }
            }
          }
        },
        boundaryConditions: {
          type: 'array',
          items: { type: 'object' }
        },
        isValid: { type: 'boolean' },
        validationNotes: {
          type: 'array',
          items: { type: 'string' }
        },
        baseline: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['simulation', 'initialization', 'state']
}));

export const simulationExecutionTask = defineTask('simulation-execution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Simulation Execution',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'simulation-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in simulation execution and numerical methods',
      task: 'Execute the model simulation and generate trajectories',
      context: {
        model: args.model,
        initialState: args.initialState,
        scenarioSpec: args.scenarioSpec,
        constraints: args.constraints
      },
      instructions: [
        '1. Initialize model with initial state',
        '2. Apply scenario interventions at specified times',
        '3. Step through simulation time horizon',
        '4. Apply model dynamics at each step',
        '5. Record state variables at each time point',
        '6. Handle any events or discontinuities',
        '7. Check for numerical stability',
        '8. Detect equilibria or steady states',
        '9. Record key events and transitions',
        '10. Generate complete trajectories for all variables'
      ],
      outputFormat: 'JSON object with simulation results'
    },
    outputSchema: {
      type: 'object',
      required: ['trajectories', 'completed'],
      properties: {
        completed: { type: 'boolean' },
        trajectories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              timePoints: { type: 'array', items: { type: 'number' } },
              values: { type: 'array', items: { type: 'any' } }
            }
          }
        },
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              time: { type: 'number' },
              event: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        equilibria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              time: { type: 'number' },
              state: { type: 'object' },
              stable: { type: 'boolean' }
            }
          }
        },
        numericalIssues: {
          type: 'array',
          items: { type: 'string' }
        },
        executionStats: {
          type: 'object',
          properties: {
            steps: { type: 'number' },
            duration: { type: 'string' }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['simulation', 'execution', 'trajectories']
}));

export const trajectoryAnalysisTask = defineTask('trajectory-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Trajectory Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'simulation-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in time series analysis and system behavior interpretation',
      task: 'Analyze simulation trajectories and extract key findings',
      context: {
        simulationExecution: args.simulationExecution,
        modelAnalysis: args.modelAnalysis,
        simulationGoal: args.simulationGoal
      },
      instructions: [
        '1. Identify trends in key variables',
        '2. Detect regime changes and phase transitions',
        '3. Identify oscillations and cycles',
        '4. Find turning points and inflection points',
        '5. Analyze rate of change patterns',
        '6. Compare to baseline/control trajectory',
        '7. Identify causal relationships in dynamics',
        '8. Extract key predictions relevant to goal',
        '9. Characterize overall system behavior',
        '10. Summarize key findings'
      ],
      outputFormat: 'JSON object with trajectory analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['predictions', 'keyFindings', 'keyPrediction'],
      properties: {
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              prediction: { type: 'string' },
              value: { type: 'any' },
              time: { type: 'any' },
              confidence: { type: 'number' }
            }
          }
        },
        keyPrediction: { type: 'string' },
        keyFindings: {
          type: 'array',
          items: { type: 'string' }
        },
        trends: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              trend: { type: 'string', enum: ['increasing', 'decreasing', 'stable', 'oscillating'] },
              rate: { type: 'string' }
            }
          }
        },
        regimeChanges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              time: { type: 'any' },
              from: { type: 'string' },
              to: { type: 'string' },
              trigger: { type: 'string' }
            }
          }
        },
        turningPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              time: { type: 'any' },
              type: { type: 'string' }
            }
          }
        },
        behaviorCharacterization: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['simulation', 'trajectory', 'analysis']
}));

export const sensitivityAnalysisTask = defineTask('sensitivity-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Sensitivity Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'simulation-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in sensitivity analysis and parameter uncertainty',
      task: 'Analyze sensitivity of results to parameter changes',
      context: {
        model: args.model,
        simulationExecution: args.simulationExecution,
        scenarioSpec: args.scenarioSpec
      },
      instructions: [
        '1. Identify key parameters for sensitivity analysis',
        '2. Define parameter variation ranges',
        '3. Perform one-at-a-time sensitivity analysis',
        '4. Compute sensitivity indices (local/global)',
        '5. Identify most influential parameters',
        '6. Identify robust vs sensitive results',
        '7. Assess parameter interactions (if feasible)',
        '8. Determine which uncertainties matter most',
        '9. Identify critical thresholds and tipping points',
        '10. Summarize sensitivity findings'
      ],
      outputFormat: 'JSON object with sensitivity analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'mostInfluential'],
      properties: {
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              sensitivityIndex: { type: 'number' },
              affectedVariables: { type: 'array', items: { type: 'string' } },
              direction: { type: 'string' }
            }
          }
        },
        mostInfluential: {
          type: 'array',
          items: { type: 'string' }
        },
        robustResults: {
          type: 'array',
          items: { type: 'string' }
        },
        sensitiveResults: {
          type: 'array',
          items: { type: 'string' }
        },
        tippingPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              parameter: { type: 'string' },
              threshold: { type: 'any' },
              consequence: { type: 'string' }
            }
          }
        },
        interactions: {
          type: 'array',
          items: { type: 'object' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['simulation', 'sensitivity', 'uncertainty']
}));

export const uncertaintyQuantificationTask = defineTask('uncertainty-quantification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Uncertainty Quantification',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'simulation-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in uncertainty quantification and probabilistic prediction',
      task: 'Quantify uncertainty in simulation predictions',
      context: {
        simulationExecution: args.simulationExecution,
        sensitivityAnalysis: args.sensitivityAnalysis,
        model: args.model
      },
      instructions: [
        '1. Identify sources of uncertainty (parametric, structural, initial conditions)',
        '2. Propagate parameter uncertainty through model',
        '3. Compute prediction intervals for key variables',
        '4. Assess model structural uncertainty',
        '5. Combine uncertainties appropriately',
        '6. Distinguish aleatory from epistemic uncertainty',
        '7. Assess confidence in different predictions',
        '8. Identify irreducible vs reducible uncertainties',
        '9. Characterize tail risks and extreme outcomes',
        '10. Summarize overall uncertainty assessment'
      ],
      outputFormat: 'JSON object with uncertainty quantification'
    },
    outputSchema: {
      type: 'object',
      required: ['bounds', 'confidenceLevels'],
      properties: {
        sources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              source: { type: 'string' },
              type: { type: 'string', enum: ['aleatory', 'epistemic'] },
              magnitude: { type: 'string', enum: ['high', 'medium', 'low'] }
            }
          }
        },
        bounds: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              variable: { type: 'string' },
              time: { type: 'any' },
              lower: { type: 'number' },
              upper: { type: 'number' },
              confidenceLevel: { type: 'number' }
            }
          }
        },
        confidenceLevels: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              prediction: { type: 'string' },
              confidence: { type: 'number' }
            }
          }
        },
        tailRisks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              probability: { type: 'number' },
              impact: { type: 'string' }
            }
          }
        },
        reducibleUncertainties: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['simulation', 'uncertainty', 'quantification']
}));

export const scenarioComparisonTask = defineTask('scenario-comparison', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Scenario Comparison',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'simulation-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in scenario analysis and comparative evaluation',
      task: 'Compare simulation results across alternative scenarios',
      context: {
        primarySimulation: args.primarySimulation,
        model: args.model,
        scenarioSpec: args.scenarioSpec,
        domain: args.domain
      },
      instructions: [
        '1. Define relevant alternative scenarios',
        '2. Execute simulations for alternatives (conceptually)',
        '3. Compare trajectories across scenarios',
        '4. Identify key differences in outcomes',
        '5. Assess relative performance of scenarios',
        '6. Identify robustly good/bad scenarios',
        '7. Find scenario-dependent outcomes',
        '8. Assess regret under different scenarios',
        '9. Identify no-regret actions (good across scenarios)',
        '10. Summarize comparative findings'
      ],
      outputFormat: 'JSON object with scenario comparison'
    },
    outputSchema: {
      type: 'object',
      required: ['comparisons', 'summary'],
      properties: {
        comparisons: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              description: { type: 'string' },
              keyOutcomes: { type: 'object' },
              comparedToPrimary: { type: 'string' },
              advantages: { type: 'array', items: { type: 'string' } },
              disadvantages: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        rankedScenarios: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              scenario: { type: 'string' },
              rank: { type: 'number' },
              score: { type: 'number' }
            }
          }
        },
        robustActions: {
          type: 'array',
          items: { type: 'string' }
        },
        scenarioDependentOutcomes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              outcome: { type: 'string' },
              dependence: { type: 'string' }
            }
          }
        },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['simulation', 'scenarios', 'comparison']
}));

export const insightExtractionTask = defineTask('insight-extraction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Insight Extraction',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'simulation-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in simulation interpretation and knowledge extraction',
      task: 'Extract actionable insights from simulation analysis',
      context: {
        trajectoryAnalysis: args.trajectoryAnalysis,
        sensitivityAnalysis: args.sensitivityAnalysis,
        scenarioComparison: args.scenarioComparison,
        simulationGoal: args.simulationGoal,
        domain: args.domain
      },
      instructions: [
        '1. Synthesize key findings from all analyses',
        '2. Identify actionable insights for decision makers',
        '3. Highlight surprising or counterintuitive findings',
        '4. Identify leverage points for intervention',
        '5. Extract policy implications',
        '6. Identify early warning indicators',
        '7. Formulate recommendations',
        '8. Identify knowledge gaps revealed by simulation',
        '9. Suggest follow-up analyses',
        '10. Create executive summary of insights'
      ],
      outputFormat: 'JSON object with extracted insights'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'recommendations'],
      properties: {
        insights: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              insight: { type: 'string' },
              importance: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              confidence: { type: 'number' },
              evidence: { type: 'string' }
            }
          }
        },
        surprises: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              finding: { type: 'string' },
              explanation: { type: 'string' }
            }
          }
        },
        leveragePoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              point: { type: 'string' },
              potentialImpact: { type: 'string' },
              actionability: { type: 'string' }
            }
          }
        },
        earlyWarningIndicators: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              indicator: { type: 'string' },
              threshold: { type: 'any' },
              warning: { type: 'string' }
            }
          }
        },
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              recommendation: { type: 'string' },
              rationale: { type: 'string' },
              priority: { type: 'string', enum: ['immediate', 'high', 'medium', 'low'] }
            }
          }
        },
        followUpAnalyses: {
          type: 'array',
          items: { type: 'string' }
        },
        executiveSummary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['simulation', 'insights', 'synthesis']
}));

export const simulationValidationTask = defineTask('simulation-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Simulation Validation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'simulation-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in simulation validation and verification',
      task: 'Validate simulation results and assess confidence',
      context: {
        simulationExecution: args.simulationExecution,
        modelAnalysis: args.modelAnalysis,
        uncertaintyAnalysis: args.uncertaintyAnalysis,
        domain: args.domain
      },
      instructions: [
        '1. Check internal consistency of results',
        '2. Verify conservation laws are satisfied (if applicable)',
        '3. Assess plausibility of trajectories',
        '4. Compare with historical data if available',
        '5. Check against analytical solutions (if exist)',
        '6. Assess numerical accuracy',
        '7. Evaluate model assumptions validity',
        '8. Assess external validity (generalizability)',
        '9. Document validation limitations',
        '10. Provide overall confidence assessment'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['confidence', 'validationScore'],
      properties: {
        validationScore: { type: 'number' },
        internalConsistency: { type: 'boolean' },
        conservationLaws: {
          type: 'object',
          properties: {
            checked: { type: 'boolean' },
            satisfied: { type: 'boolean' }
          }
        },
        plausibilityAssessment: {
          type: 'string',
          enum: ['highly-plausible', 'plausible', 'questionable', 'implausible']
        },
        numericalAccuracy: {
          type: 'object',
          properties: {
            assessment: { type: 'string' },
            issues: { type: 'array', items: { type: 'string' } }
          }
        },
        assumptionValidity: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              assumption: { type: 'string' },
              validity: { type: 'string', enum: ['valid', 'questionable', 'violated'] }
            }
          }
        },
        limitations: {
          type: 'array',
          items: { type: 'string' }
        },
        confidence: {
          type: 'string',
          enum: ['high', 'moderate', 'low', 'very-low']
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['simulation', 'validation', 'verification']
}));
