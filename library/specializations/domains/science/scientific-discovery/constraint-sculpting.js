/**
 * @process domains/science/scientific-discovery/constraint-sculpting
 * @description Constraint Sculpting: Start from over-constrained ideal, gradually relax constraints
 * @inputs {
 *   problem: string,
 *   idealConstraints: array,
 *   domain: string,
 *   targetFeasibility: number
 * }
 * @outputs {
 *   success: boolean,
 *   idealSolution: object,
 *   relaxationPath: array,
 *   feasibleSolution: object,
 *   constraintAnalysis: object
 * }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    problem,
    idealConstraints = [],
    domain = 'general science',
    targetFeasibility = 80,
    maxRelaxationRounds = 5
  } = inputs;

  const relaxationPath = [];
  let currentConstraints = [];
  let currentSolution = null;
  let feasibilityScore = 0;
  let round = 0;
  const startTime = ctx.now();

  // Phase 1: Define Ideal Constrained State
  ctx.log('info', 'Defining ideal over-constrained state');
  const idealState = await ctx.task(defineIdealStateTask, {
    problem,
    idealConstraints,
    domain
  });

  currentConstraints = [...idealState.constraints];

  // Phase 2: Attempt Ideal Solution
  ctx.log('info', 'Attempting solution under ideal constraints');
  const idealSolutionAttempt = await ctx.task(attemptSolutionTask, {
    problem,
    constraints: currentConstraints,
    domain,
    round: 0
  });

  currentSolution = idealSolutionAttempt;
  feasibilityScore = idealSolutionAttempt.feasibilityScore;

  relaxationPath.push({
    round: 0,
    constraints: [...currentConstraints],
    solution: idealSolutionAttempt,
    feasibilityScore,
    relaxedConstraints: [],
    timestamp: ctx.now()
  });

  // Phase 3: Iterative Constraint Relaxation
  while (feasibilityScore < targetFeasibility && round < maxRelaxationRounds) {
    round++;

    // Identify constraints to relax
    ctx.log('info', `Round ${round}: Identifying constraints to relax`);
    const relaxationCandidates = await ctx.task(identifyRelaxationCandidatesTask, {
      problem,
      currentConstraints,
      currentSolution,
      relaxationPath,
      domain
    });

    // Select and apply relaxation
    ctx.log('info', `Round ${round}: Applying constraint relaxation`);
    const relaxationResult = await ctx.task(applyRelaxationTask, {
      problem,
      currentConstraints,
      candidates: relaxationCandidates.candidates,
      domain
    });

    currentConstraints = relaxationResult.newConstraints;

    // Attempt new solution
    ctx.log('info', `Round ${round}: Attempting solution with relaxed constraints`);
    const newSolution = await ctx.task(attemptSolutionTask, {
      problem,
      constraints: currentConstraints,
      previousSolution: currentSolution,
      domain,
      round
    });

    currentSolution = newSolution;
    feasibilityScore = newSolution.feasibilityScore;

    relaxationPath.push({
      round,
      constraints: [...currentConstraints],
      solution: newSolution,
      feasibilityScore,
      relaxedConstraints: relaxationResult.relaxedConstraints,
      relaxationRationale: relaxationResult.rationale,
      timestamp: ctx.now()
    });

    if (feasibilityScore < targetFeasibility) {
      await ctx.breakpoint({
        question: `Round ${round}: Feasibility ${feasibilityScore}% (target: ${targetFeasibility}%). Continue relaxing?`,
        title: `Constraint Sculpting - Round ${round}`,
        context: {
          runId: ctx.runId,
          files: [
            { path: `artifacts/round-${round}-solution.json`, format: 'json' },
            { path: `artifacts/relaxation-path.json`, format: 'json' }
          ]
        }
      });
    }
  }

  // Phase 4: Analyze Constraint Importance
  ctx.log('info', 'Analyzing constraint importance');
  const constraintAnalysis = await ctx.task(analyzeConstraintImportanceTask, {
    problem,
    relaxationPath,
    idealState,
    domain
  });

  // Phase 5: Optimize Final Solution
  ctx.log('info', 'Optimizing final solution');
  const optimizedSolution = await ctx.task(optimizeSolutionTask, {
    problem,
    currentSolution,
    currentConstraints,
    constraintAnalysis,
    domain
  });

  // Phase 6: Generate Insights
  ctx.log('info', 'Generating insights from constraint sculpting process');
  const insights = await ctx.task(generateConstraintInsightsTask, {
    problem,
    idealState,
    relaxationPath,
    constraintAnalysis,
    optimizedSolution,
    domain
  });

  return {
    success: feasibilityScore >= targetFeasibility,
    processId: 'domains/science/scientific-discovery/constraint-sculpting',
    problem,
    domain,
    idealState,
    relaxationPath,
    constraintAnalysis,
    feasibleSolution: optimizedSolution,
    insights,
    metadata: {
      totalRounds: round,
      initialConstraintCount: idealState.constraints.length,
      finalConstraintCount: currentConstraints.length,
      finalFeasibility: feasibilityScore,
      targetFeasibility,
      duration: ctx.now() - startTime,
      timestamp: startTime
    }
  };
}

export const defineIdealStateTask = defineTask('define-ideal-state', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Define Ideal Over-Constrained State',
  agent: {
    name: 'ideal-state-definer',
    prompt: {
      role: 'systems designer and theorist',
      task: 'Define the ideal over-constrained state for the problem',
      context: args,
      instructions: [
        'Identify all desirable constraints for an ideal solution',
        'Include hard constraints (must satisfy) and soft constraints (prefer)',
        'Prioritize constraints by importance',
        'Define the ideal solution characteristics',
        'Specify constraint interactions and dependencies',
        'Identify potentially conflicting constraints',
        'Create an aspirational but likely infeasible specification'
      ],
      outputFormat: 'JSON with constraints, priorities, ideal characteristics'
    },
    outputSchema: {
      type: 'object',
      required: ['constraints', 'idealCharacteristics'],
      properties: {
        constraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              type: { type: 'string' },
              priority: { type: 'number' },
              rationale: { type: 'string' }
            }
          }
        },
        idealCharacteristics: { type: 'array', items: { type: 'string' } },
        constraintDependencies: { type: 'array', items: { type: 'object' } },
        potentialConflicts: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'constraint-sculpting', 'ideal-state']
}));

export const attemptSolutionTask = defineTask('attempt-solution', (args, taskCtx) => ({
  kind: 'agent',
  title: `Attempt Solution: Round ${args.round}`,
  agent: {
    name: 'solution-finder',
    prompt: {
      role: 'problem solver and optimizer',
      task: 'Attempt to find a solution satisfying current constraints',
      context: args,
      instructions: [
        'Attempt to construct a solution satisfying all constraints',
        'Document which constraints are satisfied',
        'Document which constraints are violated and by how much',
        'Calculate overall feasibility score (0-100)',
        'Identify the blocking constraints',
        'Propose partial solutions if full solution impossible',
        'Document solution quality metrics'
      ],
      outputFormat: 'JSON with solution, constraint satisfaction, feasibility score'
    },
    outputSchema: {
      type: 'object',
      required: ['solution', 'constraintSatisfaction', 'feasibilityScore'],
      properties: {
        solution: { type: 'object' },
        constraintSatisfaction: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraintId: { type: 'string' },
              satisfied: { type: 'boolean' },
              violationDegree: { type: 'number' }
            }
          }
        },
        feasibilityScore: { type: 'number', minimum: 0, maximum: 100 },
        blockingConstraints: { type: 'array', items: { type: 'string' } },
        qualityMetrics: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'constraint-sculpting', 'solution-attempt']
}));

export const identifyRelaxationCandidatesTask = defineTask('identify-relaxation-candidates', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Identify Relaxation Candidates',
  agent: {
    name: 'relaxation-analyst',
    prompt: {
      role: 'constraint analyst',
      task: 'Identify which constraints are candidates for relaxation',
      context: args,
      instructions: [
        'Analyze which constraints are causing infeasibility',
        'Rank constraints by relaxation potential',
        'Consider constraint importance vs feasibility impact',
        'Identify minimum relaxation needed for progress',
        'Consider cascading effects of relaxation',
        'Preserve most critical constraints',
        'Propose specific relaxation strategies'
      ],
      outputFormat: 'JSON with relaxation candidates, rankings, strategies'
    },
    outputSchema: {
      type: 'object',
      required: ['candidates'],
      properties: {
        candidates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraintId: { type: 'string' },
              relaxationPotential: { type: 'number' },
              feasibilityImpact: { type: 'number' },
              importanceLoss: { type: 'number' },
              relaxationStrategy: { type: 'string' }
            }
          }
        },
        recommendedRelaxation: { type: 'array', items: { type: 'string' } },
        cascadeAnalysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'constraint-sculpting', 'relaxation-candidates']
}));

export const applyRelaxationTask = defineTask('apply-relaxation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply Constraint Relaxation',
  agent: {
    name: 'constraint-relaxer',
    prompt: {
      role: 'constraint engineer',
      task: 'Apply selected constraint relaxations',
      context: args,
      instructions: [
        'Select constraints to relax based on analysis',
        'Apply minimal relaxation needed',
        'Document the exact changes made',
        'Preserve constraint spirit where possible',
        'Update constraint set',
        'Provide rationale for each relaxation',
        'Note any new constraints created'
      ],
      outputFormat: 'JSON with new constraints, relaxed constraints, rationale'
    },
    outputSchema: {
      type: 'object',
      required: ['newConstraints', 'relaxedConstraints', 'rationale'],
      properties: {
        newConstraints: { type: 'array', items: { type: 'object' } },
        relaxedConstraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              originalConstraint: { type: 'object' },
              newForm: { type: 'object' },
              changeDescription: { type: 'string' }
            }
          }
        },
        rationale: { type: 'string' },
        addedConstraints: { type: 'array', items: { type: 'object' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'constraint-sculpting', 'relaxation']
}));

export const analyzeConstraintImportanceTask = defineTask('analyze-constraint-importance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Analyze Constraint Importance',
  agent: {
    name: 'constraint-importance-analyst',
    prompt: {
      role: 'systems analyst',
      task: 'Analyze the true importance of each constraint',
      context: args,
      instructions: [
        'Analyze which constraints were relaxed and when',
        'Determine actual constraint importance from relaxation pattern',
        'Identify essential vs nice-to-have constraints',
        'Find constraint interactions revealed by relaxation',
        'Identify constraints that enabled major progress',
        'Document surprising importance findings',
        'Create constraint importance hierarchy'
      ],
      outputFormat: 'JSON with importance analysis, hierarchy, interactions'
    },
    outputSchema: {
      type: 'object',
      required: ['importanceHierarchy', 'essentialConstraints'],
      properties: {
        importanceHierarchy: { type: 'array', items: { type: 'object' } },
        essentialConstraints: { type: 'array', items: { type: 'string' } },
        niceToHaveConstraints: { type: 'array', items: { type: 'string' } },
        constraintInteractions: { type: 'array', items: { type: 'object' } },
        surprisingFindings: { type: 'array', items: { type: 'string' } },
        progressEnablers: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'constraint-sculpting', 'importance-analysis']
}));

export const optimizeSolutionTask = defineTask('optimize-solution', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Optimize Final Solution',
  agent: {
    name: 'solution-optimizer',
    prompt: {
      role: 'optimization specialist',
      task: 'Optimize the final solution within current constraints',
      context: args,
      instructions: [
        'Optimize solution quality within current constraints',
        'Explore solution space for improvements',
        'Balance multiple objectives',
        'Document trade-offs made',
        'Ensure robustness of solution',
        'Consider sensitivity to constraint changes',
        'Provide solution with quality metrics'
      ],
      outputFormat: 'JSON with optimized solution, quality metrics, trade-offs'
    },
    outputSchema: {
      type: 'object',
      required: ['optimizedSolution', 'qualityMetrics'],
      properties: {
        optimizedSolution: { type: 'object' },
        qualityMetrics: { type: 'object' },
        improvements: { type: 'array', items: { type: 'string' } },
        tradeOffs: { type: 'array', items: { type: 'object' } },
        robustnessAnalysis: { type: 'object' },
        sensitivityAnalysis: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'constraint-sculpting', 'optimization']
}));

export const generateConstraintInsightsTask = defineTask('generate-constraint-insights', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate Constraint Sculpting Insights',
  agent: {
    name: 'insight-generator',
    prompt: {
      role: 'research analyst',
      task: 'Generate insights from the constraint sculpting process',
      context: args,
      instructions: [
        'Synthesize insights about constraint-solution relationships',
        'Identify key learnings about the problem structure',
        'Document which ideal constraints are truly essential',
        'Note patterns in constraint relaxation',
        'Identify the solution frontier shape',
        'Provide recommendations for similar problems',
        'Suggest areas for further investigation'
      ],
      outputFormat: 'JSON with insights, learnings, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['insights', 'keyLearnings'],
      properties: {
        insights: { type: 'array', items: { type: 'string' } },
        keyLearnings: { type: 'array', items: { type: 'string' } },
        essentialityFindings: { type: 'array', items: { type: 'object' } },
        relaxationPatterns: { type: 'array', items: { type: 'string' } },
        solutionFrontierCharacteristics: { type: 'string' },
        recommendations: { type: 'array', items: { type: 'string' } },
        furtherInvestigation: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['agent', 'constraint-sculpting', 'insights']
}));
