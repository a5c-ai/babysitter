/**
 * @process scientific-discovery/imprecise-probability-reasoning
 * @description Represent uncertainty with probability ranges (intervals) when precise probabilities are unavailable
 * @inputs { propositions: array, probabilityBounds: object, constraints: array, evidenceItems: array, outputDir: string }
 * @outputs { success: boolean, intervalProbabilities: object, credalSets: array, robustnessAnalysis: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    propositions = [],
    probabilityBounds = {},
    constraints = [],
    evidenceItems = [],
    outputDir = 'imprecise-probability-output',
    sensitivityLevel = 0.1
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Imprecise Probability Reasoning Process');

  // ============================================================================
  // PHASE 1: INTERVAL SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Specifying probability intervals');
  const intervalSpec = await ctx.task(intervalSpecificationTask, {
    propositions,
    probabilityBounds,
    constraints,
    outputDir
  });

  artifacts.push(...intervalSpec.artifacts);

  // ============================================================================
  // PHASE 2: CREDAL SET CONSTRUCTION
  // ============================================================================

  ctx.log('info', 'Phase 2: Constructing credal sets');
  const credalSets = await ctx.task(credalSetConstructionTask, {
    intervals: intervalSpec.intervals,
    constraints,
    propositions,
    outputDir
  });

  artifacts.push(...credalSets.artifacts);

  // ============================================================================
  // PHASE 3: INTERVAL PROPAGATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Propagating probability intervals');
  const propagation = await ctx.task(intervalPropagationTask, {
    credalSets: credalSets.sets,
    evidenceItems,
    propositions,
    outputDir
  });

  artifacts.push(...propagation.artifacts);

  // ============================================================================
  // PHASE 4: LOWER/UPPER PROBABILITY BOUNDS
  // ============================================================================

  ctx.log('info', 'Phase 4: Computing lower and upper probability bounds');
  const boundComputation = await ctx.task(boundComputationTask, {
    propagatedIntervals: propagation.intervals,
    credalSets: credalSets.sets,
    outputDir
  });

  artifacts.push(...boundComputation.artifacts);

  // ============================================================================
  // PHASE 5: DECISION MAKING UNDER IMPRECISION
  // ============================================================================

  ctx.log('info', 'Phase 5: Analyzing decision implications');
  const decisionAnalysis = await ctx.task(impreciseDecisionTask, {
    intervalProbabilities: boundComputation.bounds,
    propositions,
    outputDir
  });

  artifacts.push(...decisionAnalysis.artifacts);

  // ============================================================================
  // PHASE 6: ROBUSTNESS ANALYSIS
  // ============================================================================

  ctx.log('info', 'Phase 6: Performing robustness analysis');
  const robustness = await ctx.task(robustnessAnalysisTask, {
    intervalProbabilities: boundComputation.bounds,
    credalSets: credalSets.sets,
    sensitivityLevel,
    outputDir
  });

  artifacts.push(...robustness.artifacts);

  // ============================================================================
  // PHASE 7: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Assessing reasoning quality');
  const qualityScore = await ctx.task(impreciseQualityTask, {
    intervalSpec,
    credalSets: credalSets.sets,
    boundComputation,
    robustness: robustness.analysis,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= 75;

  // Breakpoint: Review imprecise probability results
  await ctx.breakpoint({
    question: `Imprecise probability analysis complete. Quality score: ${qualityScore.overallScore}/100. ${qualityMet ? 'Quality meets standards!' : 'Consider refining probability bounds.'} Review results?`,
    title: 'Imprecise Probability Results Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'json',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        propositionsCount: propositions.length,
        credalSetsCount: credalSets.sets.length,
        averageIntervalWidth: boundComputation.averageWidth,
        robustConclusionsCount: robustness.robustConclusions.length,
        qualityScore: qualityScore.overallScore
      }
    }
  });

  // ============================================================================
  // PHASE 8: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 8: Generating comprehensive report');
  const report = await ctx.task(impreciseReportTask, {
    intervalSpec,
    credalSets: credalSets.sets,
    boundComputation,
    decisionAnalysis,
    robustness: robustness.analysis,
    qualityScore: qualityScore.overallScore,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    intervalProbabilities: boundComputation.bounds,
    credalSets: credalSets.sets,
    robustnessAnalysis: robustness.analysis,
    decisionRecommendations: decisionAnalysis.recommendations,
    qualityScore: qualityScore.overallScore,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/imprecise-probability-reasoning',
      timestamp: startTime,
      outputDir,
      sensitivityLevel
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Interval Specification
export const intervalSpecificationTask = defineTask('interval-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify probability intervals for propositions',
  agent: {
    name: 'interval-specification-agent',
    prompt: {
      role: 'imprecise probability specialist',
      task: 'Specify probability intervals for propositions based on available knowledge',
      context: args,
      instructions: [
        'Analyze each proposition for available probability information',
        'Convert point probabilities to intervals if uncertainty exists',
        'Specify lower and upper probability bounds [P_lower, P_upper]',
        'Ensure intervals satisfy basic probability axioms',
        'Handle complete ignorance with [0, 1] intervals',
        'Incorporate expert-elicited bounds where available',
        'Validate interval consistency (lower <= upper)',
        'Document sources of interval specifications',
        'Identify propositions with tight vs wide intervals',
        'Save interval specifications to output directory'
      ],
      outputFormat: 'JSON with intervals (object), specificationSources (object), validationResults (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['intervals', 'validationResults', 'artifacts'],
      properties: {
        intervals: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              lower: { type: 'number' },
              upper: { type: 'number' },
              width: { type: 'number' }
            }
          }
        },
        specificationSources: { type: 'object' },
        validationResults: {
          type: 'object',
          properties: {
            allValid: { type: 'boolean' },
            issues: { type: 'array' }
          }
        },
        tightIntervals: { type: 'array', items: { type: 'string' } },
        wideIntervals: { type: 'array', items: { type: 'string' } },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'imprecise-probability', 'specification']
}));

// Task 2: Credal Set Construction
export const credalSetConstructionTask = defineTask('credal-set-construction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Construct credal sets from interval specifications',
  agent: {
    name: 'credal-set-agent',
    prompt: {
      role: 'credal set theory expert',
      task: 'Construct credal sets representing sets of compatible probability distributions',
      context: args,
      instructions: [
        'Define credal set as convex set of probability distributions',
        'Construct extreme points of the credal polytope',
        'Apply linear constraints from interval specifications',
        'Ensure credal set is closed and convex',
        'Compute vertices of the credal set polytope',
        'Handle conditional credal sets if needed',
        'Verify credal set satisfies all constraints',
        'Compute credal set properties (size, shape)',
        'Identify degenerate cases (point vs interval)',
        'Save credal sets to output directory'
      ],
      outputFormat: 'JSON with sets (array), extremePoints (array), polytope (object), properties (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['sets', 'extremePoints', 'artifacts'],
      properties: {
        sets: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              proposition: { type: 'string' },
              extremeDistributions: { type: 'array' },
              constraints: { type: 'array' }
            }
          }
        },
        extremePoints: { type: 'array' },
        polytope: {
          type: 'object',
          properties: {
            vertices: { type: 'array' },
            facets: { type: 'array' },
            dimension: { type: 'number' }
          }
        },
        properties: {
          type: 'object',
          properties: {
            isConvex: { type: 'boolean' },
            isClosed: { type: 'boolean' },
            volume: { type: 'number' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'imprecise-probability', 'credal-sets']
}));

// Task 3: Interval Propagation
export const intervalPropagationTask = defineTask('interval-propagation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Propagate probability intervals through inference',
  agent: {
    name: 'interval-propagation-agent',
    prompt: {
      role: 'interval analysis expert',
      task: 'Propagate probability intervals through logical and probabilistic operations',
      context: args,
      instructions: [
        'Apply interval arithmetic for probability operations',
        'Propagate intervals through conjunction (AND)',
        'Propagate intervals through disjunction (OR)',
        'Handle interval conditioning (Bayes rule with intervals)',
        'Apply natural extension for derived quantities',
        'Minimize interval widening during propagation',
        'Track dependency to avoid interval explosion',
        'Apply Frechet bounds for dependent events',
        'Update intervals with new evidence',
        'Save propagation results to output directory'
      ],
      outputFormat: 'JSON with intervals (object), propagationSteps (array), dependencyTracking (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['intervals', 'propagationSteps', 'artifacts'],
      properties: {
        intervals: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              lower: { type: 'number' },
              upper: { type: 'number' },
              source: { type: 'string' }
            }
          }
        },
        propagationSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              operation: { type: 'string' },
              inputs: { type: 'array' },
              output: { type: 'object' },
              widening: { type: 'number' }
            }
          }
        },
        dependencyTracking: { type: 'object' },
        totalWidening: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'imprecise-probability', 'propagation']
}));

// Task 4: Bound Computation
export const boundComputationTask = defineTask('bound-computation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Compute tight lower and upper probability bounds',
  agent: {
    name: 'bound-computation-agent',
    prompt: {
      role: 'optimization and bound analysis expert',
      task: 'Compute tightest possible lower and upper probability bounds',
      context: args,
      instructions: [
        'Formulate bound computation as optimization problems',
        'Compute lower probability P_*(A) = min P(A) over credal set',
        'Compute upper probability P^*(A) = max P(A) over credal set',
        'Use linear programming for polytopic credal sets',
        'Apply vertex enumeration for small credal sets',
        'Verify bounds satisfy conjugacy: P_*(A) = 1 - P^*(not A)',
        'Compute bounds for compound events',
        'Calculate average interval width',
        'Identify events with determinate probabilities',
        'Save bound computations to output directory'
      ],
      outputFormat: 'JSON with bounds (object), averageWidth (number), determinateEvents (array), optimizationDetails (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['bounds', 'averageWidth', 'artifacts'],
      properties: {
        bounds: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              lower: { type: 'number' },
              upper: { type: 'number' },
              tight: { type: 'boolean' }
            }
          }
        },
        averageWidth: { type: 'number' },
        determinateEvents: { type: 'array', items: { type: 'string' } },
        optimizationDetails: {
          type: 'object',
          properties: {
            method: { type: 'string' },
            iterations: { type: 'number' },
            convergence: { type: 'boolean' }
          }
        },
        conjugacyVerified: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'imprecise-probability', 'bounds']
}));

// Task 5: Imprecise Decision Analysis
export const impreciseDecisionTask = defineTask('imprecise-decision', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze decision implications under imprecise probabilities',
  agent: {
    name: 'imprecise-decision-agent',
    prompt: {
      role: 'decision theory expert for imprecise probabilities',
      task: 'Analyze decision-making under imprecise probability specifications',
      context: args,
      instructions: [
        'Apply Gamma-maximin criterion (maximize minimum expected utility)',
        'Apply Gamma-maximax criterion (maximize maximum expected utility)',
        'Apply E-admissibility (dominated by no precise probability)',
        'Apply interval dominance criterion',
        'Identify robust decisions (optimal under all credal set members)',
        'Identify decisions requiring more information',
        'Compute regret bounds for decisions',
        'Analyze value of additional information',
        'Provide decision recommendations with justification',
        'Save decision analysis to output directory'
      ],
      outputFormat: 'JSON with recommendations (array), criteriaResults (object), robustDecisions (array), informationValue (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['recommendations', 'criteriaResults', 'artifacts'],
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              decision: { type: 'string' },
              criterion: { type: 'string' },
              confidence: { type: 'string' },
              justification: { type: 'string' }
            }
          }
        },
        criteriaResults: {
          type: 'object',
          properties: {
            gammamaximin: { type: 'object' },
            gammamaximax: { type: 'object' },
            eAdmissible: { type: 'array' },
            intervalDominant: { type: 'array' }
          }
        },
        robustDecisions: { type: 'array', items: { type: 'string' } },
        informationValue: {
          type: 'object',
          properties: {
            expectedValueOfInfo: { type: 'number' },
            criticalUncertainties: { type: 'array' }
          }
        },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'imprecise-probability', 'decision']
}));

// Task 6: Robustness Analysis
export const robustnessAnalysisTask = defineTask('robustness-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze robustness of conclusions to imprecision',
  agent: {
    name: 'robustness-analysis-agent',
    prompt: {
      role: 'robustness and sensitivity analysis expert',
      task: 'Analyze how robust conclusions are to probability imprecision',
      context: args,
      instructions: [
        'Identify conclusions robust to all credal set members',
        'Compute sensitivity of conclusions to interval bounds',
        'Determine which interval tightenings would change conclusions',
        'Analyze stability of rankings under imprecision',
        'Identify fragile conclusions dependent on precise values',
        'Compute contamination bounds (epsilon-contamination)',
        'Test robustness to prior specification changes',
        'Identify critical thresholds for conclusion changes',
        'Provide robustness scores for each conclusion',
        'Save robustness analysis to output directory'
      ],
      outputFormat: 'JSON with analysis (object), robustConclusions (array), fragileConclusions (array), sensitivityResults (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'robustConclusions', 'artifacts'],
      properties: {
        analysis: {
          type: 'object',
          properties: {
            overallRobustness: { type: 'number' },
            robustCount: { type: 'number' },
            fragileCount: { type: 'number' }
          }
        },
        robustConclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conclusion: { type: 'string' },
              robustnessScore: { type: 'number' },
              validUnder: { type: 'string' }
            }
          }
        },
        fragileConclusions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              conclusion: { type: 'string' },
              sensitivityTo: { type: 'array' },
              threshold: { type: 'number' }
            }
          }
        },
        sensitivityResults: { type: 'object' },
        criticalThresholds: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'imprecise-probability', 'robustness']
}));

// Task 7: Quality Assessment
export const impreciseQualityTask = defineTask('imprecise-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess quality of imprecise probability analysis',
  agent: {
    name: 'imprecise-quality-agent',
    prompt: {
      role: 'imprecise probability methodology reviewer',
      task: 'Assess quality and validity of imprecise probability analysis',
      context: args,
      instructions: [
        'Evaluate interval specification quality (weight: 25%)',
        'Assess credal set construction validity (weight: 20%)',
        'Check interval propagation correctness (weight: 20%)',
        'Evaluate bound computation tightness (weight: 20%)',
        'Assess robustness analysis completeness (weight: 15%)',
        'Verify probability axioms are satisfied',
        'Check for interval explosion or over-widening',
        'Validate optimization convergence',
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
            intervalSpecification: { type: 'number' },
            credalSetConstruction: { type: 'number' },
            intervalPropagation: { type: 'number' },
            boundTightness: { type: 'number' },
            robustnessCompleteness: { type: 'number' }
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
  labels: ['agent', 'scientific-discovery', 'imprecise-probability', 'quality']
}));

// Task 8: Report Generation
export const impreciseReportTask = defineTask('imprecise-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate imprecise probability analysis report',
  agent: {
    name: 'imprecise-report-agent',
    prompt: {
      role: 'scientific report writer',
      task: 'Generate comprehensive report on imprecise probability analysis',
      context: args,
      instructions: [
        'Create executive summary of key findings',
        'Document interval specifications and sources',
        'Describe credal set constructions',
        'Present probability bounds with visualizations',
        'Explain decision analysis results',
        'Summarize robustness findings',
        'Include interval comparison tables',
        'Provide interpretation guidance',
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
  labels: ['agent', 'scientific-discovery', 'imprecise-probability', 'reporting']
}));
