/**
 * @process scientific-discovery/maximum-entropy-reasoning
 * @description Choose probability distributions satisfying constraints while minimizing assumptions using maximum entropy principle
 * @inputs { constraints: array, variables: array, priorDistribution: object, evidenceConstraints: array, outputDir: string }
 * @outputs { success: boolean, maxEntDistribution: object, entropyValue: number, constraintSatisfaction: object, artifacts: array }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    constraints = [],
    variables = [],
    priorDistribution = {},
    evidenceConstraints = [],
    outputDir = 'maxent-output',
    convergenceTolerance = 0.001
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', 'Starting Maximum Entropy Reasoning Process');

  // ============================================================================
  // PHASE 1: CONSTRAINT FORMALIZATION
  // ============================================================================

  ctx.log('info', 'Phase 1: Formalizing constraints');
  const constraintFormalization = await ctx.task(constraintFormalizationTask, {
    constraints,
    variables,
    evidenceConstraints,
    outputDir
  });

  artifacts.push(...constraintFormalization.artifacts);

  // ============================================================================
  // PHASE 2: PRIOR DISTRIBUTION SPECIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 2: Specifying prior distribution');
  const priorSpec = await ctx.task(priorSpecificationTask, {
    variables,
    priorDistribution,
    outputDir
  });

  artifacts.push(...priorSpec.artifacts);

  // ============================================================================
  // PHASE 3: LAGRANGIAN FORMULATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Formulating Lagrangian optimization');
  const lagrangian = await ctx.task(lagrangianFormulationTask, {
    formalizedConstraints: constraintFormalization.constraints,
    priorDistribution: priorSpec.prior,
    variables,
    outputDir
  });

  artifacts.push(...lagrangian.artifacts);

  // ============================================================================
  // PHASE 4: ENTROPY MAXIMIZATION
  // ============================================================================

  ctx.log('info', 'Phase 4: Maximizing entropy subject to constraints');
  const optimization = await ctx.task(entropyMaximizationTask, {
    lagrangianFormulation: lagrangian.formulation,
    constraints: constraintFormalization.constraints,
    convergenceTolerance,
    outputDir
  });

  artifacts.push(...optimization.artifacts);

  // ============================================================================
  // PHASE 5: DISTRIBUTION DERIVATION
  // ============================================================================

  ctx.log('info', 'Phase 5: Deriving maximum entropy distribution');
  const distribution = await ctx.task(distributionDerivationTask, {
    optimizationResult: optimization.result,
    lagrangeMultipliers: optimization.multipliers,
    variables,
    outputDir
  });

  artifacts.push(...distribution.artifacts);

  // ============================================================================
  // PHASE 6: CONSTRAINT VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 6: Verifying constraint satisfaction');
  const verification = await ctx.task(constraintVerificationTask, {
    maxEntDistribution: distribution.distribution,
    originalConstraints: constraintFormalization.constraints,
    convergenceTolerance,
    outputDir
  });

  artifacts.push(...verification.artifacts);

  // ============================================================================
  // PHASE 7: INFERENCE WITH MAXENT
  // ============================================================================

  ctx.log('info', 'Phase 7: Performing inference using MaxEnt distribution');
  const inference = await ctx.task(maxentInferenceTask, {
    maxEntDistribution: distribution.distribution,
    variables,
    outputDir
  });

  artifacts.push(...inference.artifacts);

  // ============================================================================
  // PHASE 8: QUALITY ASSESSMENT
  // ============================================================================

  ctx.log('info', 'Phase 8: Assessing reasoning quality');
  const qualityScore = await ctx.task(maxentQualityTask, {
    constraintFormalization,
    optimization,
    distribution: distribution.distribution,
    verification,
    outputDir
  });

  artifacts.push(...qualityScore.artifacts);

  const qualityMet = qualityScore.overallScore >= 75;

  // Breakpoint: Review MaxEnt results
  await ctx.breakpoint({
    question: `Maximum entropy analysis complete. Entropy: ${distribution.entropy.toFixed(4)}. Quality score: ${qualityScore.overallScore}/100. ${qualityMet ? 'Quality meets standards!' : 'Review constraint satisfaction.'} Review results?`,
    title: 'Maximum Entropy Results Review',
    context: {
      runId: ctx.runId,
      files: artifacts.map(a => ({
        path: a.path,
        format: a.format || 'json',
        language: a.language || undefined,
        label: a.label || undefined
      })),
      summary: {
        constraintsCount: constraintFormalization.constraints.length,
        variablesCount: variables.length,
        entropyValue: distribution.entropy,
        constraintsSatisfied: verification.allSatisfied,
        qualityScore: qualityScore.overallScore
      }
    }
  });

  // ============================================================================
  // PHASE 9: REPORT GENERATION
  // ============================================================================

  ctx.log('info', 'Phase 9: Generating comprehensive report');
  const report = await ctx.task(maxentReportTask, {
    constraintFormalization,
    optimization,
    distribution: distribution.distribution,
    verification,
    inference,
    qualityScore: qualityScore.overallScore,
    outputDir
  });

  artifacts.push(...report.artifacts);

  const endTime = ctx.now();
  const duration = endTime - startTime;

  return {
    success: true,
    maxEntDistribution: distribution.distribution,
    entropyValue: distribution.entropy,
    constraintSatisfaction: verification.satisfaction,
    lagrangeMultipliers: optimization.multipliers,
    inferenceResults: inference.results,
    qualityScore: qualityScore.overallScore,
    artifacts,
    duration,
    metadata: {
      processId: 'scientific-discovery/maximum-entropy-reasoning',
      timestamp: startTime,
      outputDir,
      convergenceTolerance
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

// Task 1: Constraint Formalization
export const constraintFormalizationTask = defineTask('constraint-formalization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formalize constraints for maximum entropy',
  agent: {
    name: 'constraint-formalization-agent',
    prompt: {
      role: 'mathematical optimization specialist',
      task: 'Formalize constraints in a form suitable for maximum entropy optimization',
      context: args,
      instructions: [
        'Convert natural language constraints to mathematical form',
        'Express constraints as expected value constraints: E[f_i(x)] = c_i',
        'Identify normalization constraint: sum P(x) = 1',
        'Identify non-negativity constraints: P(x) >= 0',
        'Handle moment constraints (mean, variance, etc.)',
        'Handle marginal distribution constraints',
        'Handle conditional probability constraints',
        'Check constraint consistency (feasible region exists)',
        'Identify redundant constraints',
        'Save formalized constraints to output directory'
      ],
      outputFormat: 'JSON with constraints (array), constraintTypes (object), feasibilityCheck (object), artifacts'
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
              function: { type: 'string' },
              targetValue: { type: 'number' },
              description: { type: 'string' }
            }
          }
        },
        constraintTypes: {
          type: 'object',
          properties: {
            normalization: { type: 'number' },
            momentConstraints: { type: 'number' },
            marginalConstraints: { type: 'number' },
            conditionalConstraints: { type: 'number' }
          }
        },
        feasibilityCheck: {
          type: 'object',
          properties: {
            isFeasible: { type: 'boolean' },
            redundantConstraints: { type: 'array' },
            conflictingConstraints: { type: 'array' }
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
  labels: ['agent', 'scientific-discovery', 'maximum-entropy', 'constraints']
}));

// Task 2: Prior Distribution Specification
export const priorSpecificationTask = defineTask('prior-specification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Specify prior distribution for relative entropy',
  agent: {
    name: 'prior-specification-agent',
    prompt: {
      role: 'Bayesian statistics expert',
      task: 'Specify prior distribution for maximum relative entropy (cross-entropy minimization)',
      context: args,
      instructions: [
        'If no prior specified, use uniform distribution (maximum entropy)',
        'If prior specified, prepare for relative entropy minimization',
        'Validate prior distribution properties',
        'Ensure prior has same support as target distribution',
        'Handle continuous vs discrete priors appropriately',
        'Document prior choice justification',
        'Compute prior entropy for reference',
        'Handle improper priors if necessary',
        'Save prior specification to output directory'
      ],
      outputFormat: 'JSON with prior (object), priorEntropy (number), priorType (string), justification (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['prior', 'priorType', 'artifacts'],
      properties: {
        prior: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            parameters: { type: 'object' },
            support: { type: 'array' }
          }
        },
        priorEntropy: { type: 'number' },
        priorType: { type: 'string' },
        justification: { type: 'string' },
        isProper: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'maximum-entropy', 'prior']
}));

// Task 3: Lagrangian Formulation
export const lagrangianFormulationTask = defineTask('lagrangian-formulation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Formulate Lagrangian for constrained optimization',
  agent: {
    name: 'lagrangian-agent',
    prompt: {
      role: 'optimization theory expert',
      task: 'Formulate the Lagrangian for maximum entropy optimization',
      context: args,
      instructions: [
        'Write entropy functional: H[P] = -sum P(x) log P(x)',
        'Or relative entropy: D[P||Q] = sum P(x) log(P(x)/Q(x))',
        'Add Lagrange multipliers for each constraint',
        'Formulate Lagrangian: L = H[P] - sum lambda_i (E[f_i] - c_i)',
        'Include normalization constraint multiplier',
        'Derive first-order conditions (KKT conditions)',
        'Express optimal distribution form: P*(x) proportional to exp(sum lambda_i f_i(x))',
        'Identify partition function Z(lambda)',
        'Document Lagrangian structure',
        'Save formulation to output directory'
      ],
      outputFormat: 'JSON with formulation (object), lagrangeMultiplierCount (number), optimalForm (string), partitionFunction (string), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['formulation', 'optimalForm', 'artifacts'],
      properties: {
        formulation: {
          type: 'object',
          properties: {
            objective: { type: 'string' },
            constraints: { type: 'array' },
            lagrangian: { type: 'string' }
          }
        },
        lagrangeMultiplierCount: { type: 'number' },
        optimalForm: { type: 'string' },
        partitionFunction: { type: 'string' },
        kktConditions: { type: 'array' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'maximum-entropy', 'lagrangian']
}));

// Task 4: Entropy Maximization
export const entropyMaximizationTask = defineTask('entropy-maximization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Maximize entropy subject to constraints',
  agent: {
    name: 'entropy-optimization-agent',
    prompt: {
      role: 'numerical optimization expert',
      task: 'Solve the maximum entropy optimization problem',
      context: args,
      instructions: [
        'Apply iterative scaling algorithm (for discrete distributions)',
        'Or apply gradient descent on dual problem',
        'Or apply Newton method for faster convergence',
        'Solve for Lagrange multipliers that satisfy constraints',
        'Monitor convergence using tolerance criterion',
        'Handle numerical stability issues',
        'Compute partition function at each iteration',
        'Track constraint satisfaction during optimization',
        'Report final Lagrange multiplier values',
        'Save optimization results to output directory'
      ],
      outputFormat: 'JSON with result (object), multipliers (object), convergenceHistory (array), iterations (number), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['result', 'multipliers', 'artifacts'],
      properties: {
        result: {
          type: 'object',
          properties: {
            converged: { type: 'boolean' },
            finalObjective: { type: 'number' },
            method: { type: 'string' }
          }
        },
        multipliers: {
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        convergenceHistory: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              iteration: { type: 'number' },
              objective: { type: 'number' },
              maxConstraintViolation: { type: 'number' }
            }
          }
        },
        iterations: { type: 'number' },
        partitionFunction: { type: 'number' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'maximum-entropy', 'optimization']
}));

// Task 5: Distribution Derivation
export const distributionDerivationTask = defineTask('distribution-derivation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Derive maximum entropy distribution',
  agent: {
    name: 'distribution-derivation-agent',
    prompt: {
      role: 'probability distribution expert',
      task: 'Derive the maximum entropy probability distribution from optimization results',
      context: args,
      instructions: [
        'Compute P*(x) = (1/Z) * exp(sum lambda_i f_i(x))',
        'Calculate partition function Z for normalization',
        'Compute probability for each state/value',
        'Verify distribution sums/integrates to 1',
        'Calculate entropy of derived distribution',
        'Identify distribution family (Gaussian, exponential, etc.)',
        'Compute distribution moments',
        'Generate probability mass/density function',
        'Save distribution to output directory'
      ],
      outputFormat: 'JSON with distribution (object), entropy (number), distributionFamily (string), moments (object), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['distribution', 'entropy', 'artifacts'],
      properties: {
        distribution: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            parameters: { type: 'object' },
            probabilities: { type: 'object' },
            formula: { type: 'string' }
          }
        },
        entropy: { type: 'number' },
        distributionFamily: { type: 'string' },
        moments: {
          type: 'object',
          properties: {
            mean: { type: 'number' },
            variance: { type: 'number' },
            skewness: { type: 'number' },
            kurtosis: { type: 'number' }
          }
        },
        partitionFunction: { type: 'number' },
        normalizedCorrectly: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'maximum-entropy', 'distribution']
}));

// Task 6: Constraint Verification
export const constraintVerificationTask = defineTask('constraint-verification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Verify constraint satisfaction',
  agent: {
    name: 'constraint-verification-agent',
    prompt: {
      role: 'quality assurance specialist',
      task: 'Verify that maximum entropy distribution satisfies all constraints',
      context: args,
      instructions: [
        'Compute expected value of each constraint function',
        'Compare with target constraint values',
        'Calculate constraint violation for each constraint',
        'Check if violations within tolerance',
        'Verify normalization constraint',
        'Verify non-negativity constraint',
        'Identify any unsatisfied constraints',
        'Assess overall constraint satisfaction',
        'Save verification results to output directory'
      ],
      outputFormat: 'JSON with satisfaction (object), allSatisfied (boolean), violations (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['satisfaction', 'allSatisfied', 'artifacts'],
      properties: {
        satisfaction: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              target: { type: 'number' },
              actual: { type: 'number' },
              violation: { type: 'number' },
              satisfied: { type: 'boolean' }
            }
          }
        },
        allSatisfied: { type: 'boolean' },
        violations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraint: { type: 'string' },
              violation: { type: 'number' }
            }
          }
        },
        maxViolation: { type: 'number' },
        normalizationVerified: { type: 'boolean' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'maximum-entropy', 'verification']
}));

// Task 7: MaxEnt Inference
export const maxentInferenceTask = defineTask('maxent-inference', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Perform inference using MaxEnt distribution',
  agent: {
    name: 'maxent-inference-agent',
    prompt: {
      role: 'probabilistic inference expert',
      task: 'Perform probabilistic inference using the maximum entropy distribution',
      context: args,
      instructions: [
        'Compute marginal probabilities for variables of interest',
        'Compute conditional probabilities',
        'Calculate expected values of functions',
        'Compute probability intervals for events',
        'Identify most probable states (modes)',
        'Calculate credible intervals',
        'Perform what-if analysis (adding hypothetical constraints)',
        'Assess sensitivity to constraint changes',
        'Save inference results to output directory'
      ],
      outputFormat: 'JSON with results (object), marginals (object), conditionals (object), modes (array), artifacts'
    },
    outputSchema: {
      type: 'object',
      required: ['results', 'marginals', 'artifacts'],
      properties: {
        results: {
          type: 'object',
          properties: {
            queriesAnswered: { type: 'number' },
            inferenceType: { type: 'string' }
          }
        },
        marginals: {
          type: 'object',
          additionalProperties: { type: 'object' }
        },
        conditionals: {
          type: 'object',
          additionalProperties: { type: 'object' }
        },
        modes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              state: { type: 'string' },
              probability: { type: 'number' }
            }
          }
        },
        expectedValues: { type: 'object' },
        credibleIntervals: { type: 'object' },
        artifacts: { type: 'array' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'scientific-discovery', 'maximum-entropy', 'inference']
}));

// Task 8: Quality Assessment
export const maxentQualityTask = defineTask('maxent-quality', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assess quality of maximum entropy analysis',
  agent: {
    name: 'maxent-quality-agent',
    prompt: {
      role: 'maximum entropy methodology reviewer',
      task: 'Assess quality and validity of maximum entropy analysis',
      context: args,
      instructions: [
        'Evaluate constraint formalization quality (weight: 25%)',
        'Assess optimization convergence (weight: 25%)',
        'Check distribution derivation correctness (weight: 20%)',
        'Evaluate constraint satisfaction (weight: 20%)',
        'Assess overall methodology soundness (weight: 10%)',
        'Verify entropy is indeed maximized',
        'Check for numerical stability issues',
        'Validate optimization method choice',
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
            constraintFormalization: { type: 'number' },
            optimizationConvergence: { type: 'number' },
            distributionDerivation: { type: 'number' },
            constraintSatisfaction: { type: 'number' },
            methodologySoundness: { type: 'number' }
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
  labels: ['agent', 'scientific-discovery', 'maximum-entropy', 'quality']
}));

// Task 9: Report Generation
export const maxentReportTask = defineTask('maxent-report', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate maximum entropy analysis report',
  agent: {
    name: 'maxent-report-agent',
    prompt: {
      role: 'scientific report writer',
      task: 'Generate comprehensive report on maximum entropy reasoning',
      context: args,
      instructions: [
        'Create executive summary of key findings',
        'Document constraints and their formalization',
        'Describe optimization process and convergence',
        'Present maximum entropy distribution',
        'Show constraint satisfaction verification',
        'Include inference results',
        'Visualize distribution and entropy',
        'List assumptions and limitations',
        'Provide interpretation guidance',
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
  labels: ['agent', 'scientific-discovery', 'maximum-entropy', 'reporting']
}));
