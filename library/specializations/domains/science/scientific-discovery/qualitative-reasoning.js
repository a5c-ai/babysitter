/**
 * @process scientific-discovery/qualitative-reasoning
 * @description Reason with qualitative states like "increasing/decreasing" rather than precise numeric values
 * @inputs { quantities: array, qualitativeConstraints: array, causalRelationships: array, initialStates: object, outputDir: string }
 * @outputs { success: boolean, qualitativeStates: object, behaviorPredictions: array, envisioning: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    quantities = [],
    qualitativeConstraints = [],
    causalRelationships = [],
    initialStates = {},
    outputDir = 'qualitative-reasoning-output',
    envisionHorizon = 10
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Qualitative Reasoning Process');

  // ============================================================================
  // PHASE 1: QUANTITY SPACE DEFINITION
  // ============================================================================

  ctx.log('info', 'Phase 1: Defining quantity spaces');
  const quantitySpaces = await ctx.task(quantitySpaceTask, {
    quantities,
    outputDir
  });

  artifacts.push(...quantitySpaces.artifacts);

  // ============================================================================
  // PHASE 2: QUALITATIVE STATE REPRESENTATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Representing qualitative states');
  const stateRepresentation = await ctx.task(qualitativeStateTask, {
    quantities: quantitySpaces.spaces,
    initialStates,
    outputDir
  });

  artifacts.push(...stateRepresentation.artifacts);

  // ============================================================================
  // PHASE 3: CONSTRAINT MODELING
  // ============================================================================

  ctx.log('info', 'Phase 3: Modeling qualitative constraints');
  const constraintModeling = await ctx.task(constraintModelingTask, {
    qualitativeConstraints,
    quantities: quantitySpaces.spaces,
    outputDir
  });

  artifacts.push(...constraintModeling.artifacts);

  // ============================================================================
  // PHASE 4: CAUSAL REASONING
  // ============================================================================

  ctx.log('info', 'Phase 4: Performing causal reasoning');
  const causalReasoning = await ctx.task(causalReasoningTask, {
    causalRelationships,
    currentState: stateRepresentation.state,
    constraints: constraintModeling.constraints,
    outputDir
  });

  artifacts.push(...causalReasoning.artifacts);

  // ============================================================================
  // PHASE 5: QUALITATIVE SIMULATION (ENVISIONMENT)
  // ============================================================================

  ctx.log('info', 'Phase 5: Generating qualitative envisionment');
  const envisionment = await ctx.task(envisionmentTask, {
    currentState: stateRepresentation.state,
    causalModel: causalReasoning.model,
    constraints: constraintModeling.constraints,
    envisionHorizon,
    outputDir
  });

  artifacts.push(...envisionment.artifacts);

  // ============================================================================
  // PHASE 6: BEHAVIOR PREDICTION
  // ============================================================================

  ctx.log('info', 'Phase 6: Predicting qualitative behaviors');
  const behaviorPrediction = await ctx.task(behaviorPredictionTask, {
    envisionment: envisionment.graph,
    currentState: stateRepresentation.state,
    outputDir
  });

  artifacts.push(...behaviorPrediction.artifacts);

  // ============================================================================
  // PHASE 7: LIMIT ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 7: Analyzing limit behaviors and equilibria');
  const limitAnalysis = await ctx.task(limitAnalysisTask, {
    envisionment: envisionment.graph,
    behaviors: behaviorPrediction.behaviors,
    outputDir
  });

  artifacts.push(...limitAnalysis.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing reasoning quality');
  const qualityScore = await ctx.task(qualitativeQualityTask, {
    quantitySpaces,
    stateRepresentation,
    constraintModeling,
    causalReasoning,
    envisionment,
    behaviorPrediction,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= 75;

  // Breakpoint: Review qualitative reasoning results
  await ctx.breakpoint({
    question: `Qualitative reasoning complete. Quality score: ${qualityScore.overallScore}/100. Generated ${envisionment.stateCount} qualitative states. ${qualityMet ? 'Quality meets standards!' : 'Review constraints and causal model.'} Review results?`,
    title: 'Qualitative Reasoning Results Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'json',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        quantitiesCount: quantities.length,
        constraintsCount: qualitativeConstraints.length,
        statesGenerated: envisionment.stateCount,
        behaviorsIdentified: behaviorPrediction.behaviors.length,
        equilibriaFound: limitAnalysis.equilibria.length,
        qualityScore: qualityScore.overallScore
      }
    }
  });

  // ============================================================================
  // PHASE 9: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive report');
  const report = await ctx.task(qualitativeReportTask, {
    quantitySpaces,
    stateRepresentation,
    constraintModeling,
    causalReasoning,
    envisionment,
    behaviorPrediction,
    limitAnalysis,
    qualityScore: qualityScore.overallScore,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    qualitativeStates: envisionment.states,
    behaviorPredictions: behaviorPrediction.behaviors,
    envisioning: envisionment.graph,
    equilibria: limitAnalysis.equilibria,
    qualityScore: qualityScore.overallScore,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/qualitative-reasoning',
      timestamp: startTime,
      outputDir,
      envisionHorizon
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Quantity Space Definition
export const quantitySpaceTask = defineTask('quantity-space', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define quantity spaces',
  agent: {
    name: 'quantity-space-agent',
    prompt: {
      role: 'qualitative physics expert',
      task: 'Define quantity spaces for qualitative reasoning',
      context: args,
      instructions: [
        'For each quantity, define its quantity space (possible qualitative values)',
        'Include landmark values (zero, minf, inf, domain-specific landmarks)',
        'Define qualitative magnitudes: (-, 0, +) or finer granularity',
        'Define qualitative derivatives: (dec, std, inc) for rate of change',
        'Order values on quantity space',
        'Identify bounded vs unbounded quantities',
        'Document physical meaning of landmarks',
        'Save quantity spaces to output directory'
      ],
      outputFormat: 'JSON with spaces (object), landmarks (object), ordering (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['spaces', 'landmarks', 'artifacts'],
      properties: {
        spaces: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              values: { type: 'array' },
              ordering: { type: 'array' },
              bounded: { type: 'boolean' }
            }
          }
        },
        landmarks: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        ordering: {
          type: 'object',
          additionalProperties: { type: 'array' }
        },
        derivativeSpace: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'qualitative-reasoning', 'quantity-space']
}));

// Task 2: Qualitative State Representation
export const qualitativeStateTask = defineTask('qualitative-state', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Represent qualitative states',
  agent: {
    name: 'qualitative-state-agent',
    prompt: {
      role: 'qualitative state representation specialist',
      task: 'Create qualitative state descriptions',
      context: args,
      instructions: [
        'Represent each quantity with (magnitude, derivative) pair',
        'Magnitude: qualitative value from quantity space',
        'Derivative: dec (decreasing), std (steady), inc (increasing)',
        'Create complete state: tuple of all quantity states',
        'Validate state consistency with quantity spaces',
        'Handle distinguished states (equilibria, limits)',
        'Document initial state specification',
        'Save state representation to output directory'
      ],
      outputFormat: 'JSON with state (object), quantityStates (object), stateDescription (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['state', 'quantityStates', 'artifacts'],
      properties: {
        state: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            quantities: { type: 'object' },
            isEquilibrium: { type: 'boolean' }
          }
        },
        quantityStates: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              magnitude: { type: 'string' },
              derivative: { type: 'string' }
            }
          }
        },
        stateDescription: { type: 'string' },
        stateType: { type: 'string' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'qualitative-reasoning', 'state']
}));

// Task 3: Constraint Modeling
export const constraintModelingTask = defineTask('constraint-modeling', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Model qualitative constraints',
  agent: {
    name: 'constraint-modeling-agent',
    prompt: {
      role: 'qualitative constraint specialist',
      task: 'Model qualitative constraints between quantities',
      context: args,
      instructions: [
        'Model arithmetic constraints: M+(A,B) means A,B have same sign',
        'Model derivative constraints: deriv(A) = deriv(B) for co-varying',
        'Model monotonic functional constraints: M+(A,B) means increasing function',
        'Model correspondence: if A at landmark, B at landmark',
        'Handle partial information constraints',
        'Validate constraint consistency',
        'Identify constraint propagation order',
        'Save constraint model to output directory'
      ],
      outputFormat: 'JSON with constraints (array), constraintTypes (object), propagationOrder (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['constraints', 'constraintTypes', 'artifacts'],
      properties: {
        constraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              quantities: { type: 'array' },
              relation: { type: 'string' },
              description: { type: 'string' }
            }
          }
        },
        constraintTypes: {
          type: 'object',
          properties: {
            arithmetic: { type: 'number' },
            derivative: { type: 'number' },
            functional: { type: 'number' },
            correspondence: { type: 'number' }
          }
        },
        propagationOrder: { type: 'array' },
        constraintNetwork: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'qualitative-reasoning', 'constraints']
}));

// Task 4: Causal Reasoning
export const causalReasoningTask = defineTask('causal-reasoning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform causal reasoning',
  agent: {
    name: 'causal-reasoning-agent',
    prompt: {
      role: 'causal inference specialist',
      task: 'Model and reason about causal relationships between quantities',
      context: args,
      instructions: [
        'Build causal graph from causal relationships',
        'Identify direct influences: I+(A,B) means A positively influences B',
        'Identify qualitative proportionalities: Q+(A,B) means A deriv influences B deriv',
        'Propagate influence through causal chains',
        'Handle competing influences (ambiguity)',
        'Identify feedback loops',
        'Determine dominant influences when possible',
        'Save causal model to output directory'
      ],
      outputFormat: 'JSON with model (object), causalGraph (object), influences (array), feedbackLoops (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['model', 'causalGraph', 'artifacts'],
      properties: {
        model: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            quantities: { type: 'array' },
            relationships: { type: 'array' }
          }
        },
        causalGraph: {
          type: 'object',
          properties: {
            nodes: { type: 'array' },
            edges: { type: 'array' }
          }
        },
        influences: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              sign: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        feedbackLoops: { type: 'array' },
        ambiguities: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'qualitative-reasoning', 'causal']
}));

// Task 5: Envisionment
export const envisionmentTask = defineTask('envisionment', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate qualitative envisionment',
  agent: {
    name: 'envisionment-agent',
    prompt: {
      role: 'qualitative simulation specialist',
      task: 'Generate envisionment graph showing all possible qualitative behaviors',
      context: args,
      instructions: [
        'Start from initial state',
        'Apply transition rules to generate successor states',
        'Respect quantity space ordering (values change continuously)',
        'Respect constraints during transitions',
        'Build state transition graph (envisionment)',
        'Identify attainable states from initial state',
        'Handle branching (ambiguous transitions)',
        'Limit depth to envision horizon',
        'Save envisionment to output directory'
      ],
      outputFormat: 'JSON with graph (object), states (object), stateCount (number), transitions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['graph', 'states', 'stateCount', 'artifacts'],
      properties: {
        graph: {
          type: 'object',
          properties: {
            nodes: { type: 'array' },
            edges: { type: 'array' },
            initialState: { type: 'string' }
          }
        },
        states: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              quantities: { type: 'object' },
              type: { type: 'string' }
            }
          }
        },
        stateCount: { type: 'number' },
        transitions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              from: { type: 'string' },
              to: { type: 'string' },
              trigger: { type: 'string' }
            }
          }
        },
        branchingPoints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'qualitative-reasoning', 'envisionment']
}));

// Task 6: Behavior Prediction
export const behaviorPredictionTask = defineTask('behavior-prediction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Predict qualitative behaviors',
  agent: {
    name: 'behavior-prediction-agent',
    prompt: {
      role: 'behavior analysis specialist',
      task: 'Identify and describe qualitative behavior patterns',
      context: args,
      instructions: [
        'Identify paths through envisionment graph',
        'Characterize behavior types: monotonic, oscillatory, convergent, divergent',
        'Describe behavior in qualitative terms',
        'Identify critical transitions (state changes)',
        'Predict likely behaviors from current state',
        'Identify bifurcation points',
        'Describe behavior under different scenarios',
        'Save behavior predictions to output directory'
      ],
      outputFormat: 'JSON with behaviors (array), behaviorTypes (object), predictions (array), criticalTransitions (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['behaviors', 'behaviorTypes', 'artifacts'],
      properties: {
        behaviors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string' },
              path: { type: 'array' },
              description: { type: 'string' },
              likelihood: { type: 'string' }
            }
          }
        },
        behaviorTypes: {
          type: 'object',
          properties: {
            monotonic: { type: 'number' },
            oscillatory: { type: 'number' },
            convergent: { type: 'number' },
            divergent: { type: 'number' }
          }
        },
        predictions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              quantity: { type: 'string' },
              prediction: { type: 'string' },
              confidence: { type: 'string' }
            }
          }
        },
        criticalTransitions: { type: 'array' },
        bifurcationPoints: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'qualitative-reasoning', 'prediction']
}));

// Task 7: Limit Analysis
export const limitAnalysisTask = defineTask('limit-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze limit behaviors and equilibria',
  agent: {
    name: 'limit-analysis-agent',
    prompt: {
      role: 'dynamical systems analyst',
      task: 'Analyze limit behaviors, equilibria, and attractors',
      context: args,
      instructions: [
        'Identify equilibrium states (all derivatives = std)',
        'Classify equilibria: stable, unstable, saddle',
        'Identify limit cycles (repeating state sequences)',
        'Identify attractors and basins of attraction',
        'Analyze long-term behavior tendencies',
        'Identify absorbing states (no outgoing transitions)',
        'Determine reachability of equilibria from initial state',
        'Save limit analysis to output directory'
      ],
      outputFormat: 'JSON with equilibria (array), limitCycles (array), attractors (array), longTermBehavior (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['equilibria', 'artifacts'],
      properties: {
        equilibria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              state: { type: 'string' },
              stability: { type: 'string' },
              reachable: { type: 'boolean' }
            }
          }
        },
        limitCycles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              states: { type: 'array' },
              period: { type: 'number' }
            }
          }
        },
        attractors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              states: { type: 'array' },
              basinSize: { type: 'number' }
            }
          }
        },
        longTermBehavior: {
          type: 'object',
          properties: {
            tendency: { type: 'string' },
            possibleOutcomes: { type: 'array' }
          }
        },
        absorbingStates: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'qualitative-reasoning', 'limits']
}));

// Task 8: Quality Assessment
export const qualitativeQualityTask = defineTask('qualitative-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess quality of qualitative reasoning',
  agent: {
    name: 'qualitative-quality-agent',
    prompt: {
      role: 'qualitative reasoning methodology reviewer',
      task: 'Assess quality and validity of qualitative reasoning process',
      context: args,
      instructions: [
        'Evaluate quantity space definition (weight: 15%)',
        'Assess state representation completeness (weight: 15%)',
        'Check constraint modeling validity (weight: 20%)',
        'Evaluate causal reasoning correctness (weight: 20%)',
        'Assess envisionment completeness (weight: 15%)',
        'Evaluate behavior prediction quality (weight: 15%)',
        'Verify physical plausibility',
        'Check for spurious states',
        'Calculate weighted overall quality score (0-100)',
        'Save quality assessment to output directory'
      ],
      outputFormat: 'JSON with overallScore (number), componentScores (object), issues (array), recommendations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['overallScore', 'componentScores', 'artifacts'],
      properties: {
        overallScore: { type: 'number', minimum: 0, maximum: 100 },
        componentScores: {
          type: 'object',
          properties: {
            quantitySpaces: { type: 'number' },
            stateRepresentation: { type: 'number' },
            constraintModeling: { type: 'number' },
            causalReasoning: { type: 'number' },
            envisionment: { type: 'number' },
            behaviorPrediction: { type: 'number' }
          }
        },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'qualitative-reasoning', 'quality']
}));

// Task 9: Report Generation
export const qualitativeReportTask = defineTask('qualitative-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate qualitative reasoning report',
  agent: {
    name: 'qualitative-report-agent',
    prompt: {
      role: 'scientific report writer',
      task: 'Generate comprehensive report on qualitative reasoning',
      context: args,
      instructions: [
        'Create executive summary of reasoning results',
        'Document quantity spaces and landmarks',
        'Present qualitative constraints',
        'Show causal model structure',
        'Present envisionment graph',
        'Describe predicted behaviors',
        'Analyze equilibria and limit behaviors',
        'Include state transition diagrams',
        'List assumptions and limitations',
        'Save report to output directory'
      ],
      outputFormat: 'JSON with reportPath (string), executiveSummary (string), keyFindings (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['reportPath', 'executiveSummary', 'keyFindings', 'artifacts'],
      properties: {
        reportPath: { type: 'string' },
        executiveSummary: { type: 'string' },
        keyFindings: { type: 'array', items: { type: 'string' } },
        visualizations: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'qualitative-reasoning', 'reporting']
}));
