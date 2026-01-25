/**
 * @process specializations/domains/science/scientific-discovery/planning-policy-reasoning
 * @description Planning and Policy Reasoning Process - Compute action sequences achieving
 * goals under constraints using classical planning, temporal planning, and policy synthesis.
 * @inputs { domain: string, initialState: object, goalState: object, actions?: object[], constraints?: object }
 * @outputs { success: boolean, plan: object[], policy?: object, analysis: object }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/planning-policy-reasoning', {
 *   domain: 'Robotics',
 *   initialState: { location: 'A', holding: null, objects: ['block1', 'block2'] },
 *   goalState: { holding: 'block1', location: 'B' },
 *   actions: [{ name: 'move', params: ['from', 'to'] }, { name: 'pickup', params: ['object'] }]
 * });
 *
 * @references
 * - Ghallab, Nau, Traverso (2004). Automated Planning: Theory and Practice
 * - Russell & Norvig (2020). Artificial Intelligence, Chapter 11: Planning
 * - Fikes & Nilsson (1971). STRIPS
 * - Boutilier et al. (1999). Decision-Theoretic Planning
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    domain,
    initialState,
    goalState,
    actions = [],
    constraints = {}
  } = inputs;

  // Phase 1: Problem Formalization
  const problemFormalization = await ctx.task(planningProblemFormalizationTask, {
    domain,
    initialState,
    goalState,
    actions,
    constraints
  });

  // Phase 2: State Space Analysis
  const stateSpaceAnalysis = await ctx.task(stateSpaceAnalysisTask, {
    problemFormalization,
    initialState,
    goalState
  });

  // Phase 3: Action Model Validation
  const actionModelValidation = await ctx.task(actionModelValidationTask, {
    actions: problemFormalization.actions,
    initialState,
    goalState
  });

  // Quality Gate: Actions must be sufficient
  if (!actionModelValidation.goalReachable) {
    return {
      success: false,
      error: 'Goal state is unreachable with available actions',
      analysis: actionModelValidation,
      plan: null
    };
  }

  // Phase 4: Forward Search Planning
  const forwardSearch = await ctx.task(forwardSearchPlanningTask, {
    problemFormalization,
    stateSpaceAnalysis,
    constraints
  });

  // Phase 5: Backward Search Planning
  const backwardSearch = await ctx.task(backwardSearchPlanningTask, {
    problemFormalization,
    stateSpaceAnalysis,
    constraints
  });

  // Phase 6: Graph-Based Planning
  const graphPlanning = await ctx.task(graphBasedPlanningTask, {
    problemFormalization,
    stateSpaceAnalysis
  });

  // Phase 7: Plan Selection and Optimization
  const planOptimization = await ctx.task(planOptimizationTask, {
    forwardSearch,
    backwardSearch,
    graphPlanning,
    constraints
  });

  // Breakpoint: Review generated plan
  await ctx.breakpoint({
    question: `Plan generated with ${planOptimization.optimalPlan.length} steps. Plan cost: ${planOptimization.cost}. Review plan?`,
    title: 'Plan Review',
    context: {
      runId: ctx.runId,
      domain,
      planLength: planOptimization.optimalPlan.length,
      planSummary: planOptimization.optimalPlan.slice(0, 5).map(s => s.action)
    }
  });

  // Phase 8: Temporal Planning (if time constraints)
  const temporalPlanning = await ctx.task(temporalPlanningTask, {
    planOptimization,
    constraints,
    problemFormalization
  });

  // Phase 9: Plan Validation
  const planValidation = await ctx.task(planValidationTask, {
    plan: temporalPlanning.scheduledPlan || planOptimization.optimalPlan,
    initialState,
    goalState,
    problemFormalization
  });

  // Phase 10: Policy Synthesis (for non-deterministic cases)
  const policySynthesis = await ctx.task(policySynthesisTask, {
    problemFormalization,
    plan: planValidation.validatedPlan,
    stateSpaceAnalysis
  });

  // Phase 11: Plan Robustness Analysis
  const robustnessAnalysis = await ctx.task(planRobustnessTask, {
    plan: planValidation.validatedPlan,
    problemFormalization,
    constraints
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Planning complete. Valid plan: ${planValidation.isValid}. Robustness: ${robustnessAnalysis.robustnessScore}%. Accept plan?`,
    title: 'Final Plan Review',
    context: {
      runId: ctx.runId,
      domain,
      files: [
        { path: 'artifacts/plan.json', format: 'json', content: planValidation.validatedPlan },
        { path: 'artifacts/policy.json', format: 'json', content: policySynthesis }
      ]
    }
  });

  return {
    success: true,
    domain,
    plan: planValidation.validatedPlan,
    policy: policySynthesis.policy,
    analysis: {
      stateSpace: stateSpaceAnalysis,
      searchResults: {
        forward: forwardSearch.summary,
        backward: backwardSearch.summary,
        graph: graphPlanning.summary
      },
      optimization: planOptimization,
      temporal: temporalPlanning,
      robustness: robustnessAnalysis
    },
    validation: planValidation,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/planning-policy-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const planningProblemFormalizationTask = defineTask('planning-problem-formalization', (args, taskCtx) => ({
  kind: 'agent',
  title: `Planning Problem Formalization - ${args.domain}`,
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in AI planning and problem formalization',
      task: 'Formalize the planning problem in PDDL-like representation',
      context: {
        domain: args.domain,
        initialState: args.initialState,
        goalState: args.goalState,
        actions: args.actions,
        constraints: args.constraints
      },
      instructions: [
        '1. Define the state representation (predicates/fluents)',
        '2. Formalize initial state as set of facts',
        '3. Formalize goal as logical condition',
        '4. Define action schemas with parameters',
        '5. Specify preconditions for each action',
        '6. Specify effects (add/delete lists) for each action',
        '7. Identify types and objects',
        '8. Formalize constraints (temporal, resource, etc.)',
        '9. Check problem well-formedness',
        '10. Document formalization choices'
      ],
      outputFormat: 'JSON object with formalized planning problem'
    },
    outputSchema: {
      type: 'object',
      required: ['initialState', 'goalState', 'actions'],
      properties: {
        types: {
          type: 'array',
          items: { type: 'string' }
        },
        objects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              type: { type: 'string' }
            }
          }
        },
        predicates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              parameters: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        initialState: {
          type: 'array',
          items: { type: 'string' }
        },
        goalState: {
          type: 'object',
          properties: {
            conditions: { type: 'array', items: { type: 'string' } },
            type: { type: 'string', enum: ['conjunction', 'disjunction', 'complex'] }
          }
        },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              parameters: { type: 'array', items: { type: 'object' } },
              preconditions: { type: 'array', items: { type: 'string' } },
              effects: {
                type: 'object',
                properties: {
                  add: { type: 'array', items: { type: 'string' } },
                  delete: { type: 'array', items: { type: 'string' } }
                }
              },
              cost: { type: 'number' }
            }
          }
        },
        constraints: { type: 'object' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['planning', 'formalization', 'pddl']
}));

export const stateSpaceAnalysisTask = defineTask('state-space-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'State Space Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in state space search and complexity analysis',
      task: 'Analyze the state space of the planning problem',
      context: {
        problemFormalization: args.problemFormalization,
        initialState: args.initialState,
        goalState: args.goalState
      },
      instructions: [
        '1. Estimate state space size',
        '2. Identify state space structure (tree, graph, DAG)',
        '3. Compute branching factor',
        '4. Estimate solution depth',
        '5. Identify symmetries and equivalences',
        '6. Analyze connectivity of state space',
        '7. Identify dead ends and traps',
        '8. Assess planning complexity class',
        '9. Recommend search strategy',
        '10. Identify potential heuristics'
      ],
      outputFormat: 'JSON object with state space analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['stateSpaceSize', 'branchingFactor'],
      properties: {
        stateSpaceSize: {
          type: 'object',
          properties: {
            estimate: { type: 'number' },
            bound: { type: 'string' }
          }
        },
        branchingFactor: {
          type: 'object',
          properties: {
            average: { type: 'number' },
            maximum: { type: 'number' }
          }
        },
        solutionDepth: {
          type: 'object',
          properties: {
            minimum: { type: 'number' },
            expected: { type: 'number' }
          }
        },
        structure: {
          type: 'string',
          enum: ['tree', 'dag', 'graph']
        },
        symmetries: {
          type: 'array',
          items: { type: 'string' }
        },
        deadEnds: {
          type: 'array',
          items: { type: 'string' }
        },
        complexity: { type: 'string' },
        recommendedStrategy: {
          type: 'array',
          items: { type: 'string' }
        },
        heuristics: {
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
  labels: ['planning', 'state-space', 'analysis']
}));

export const actionModelValidationTask = defineTask('action-model-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Action Model Validation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in action theory and plan validation',
      task: 'Validate action model for goal reachability',
      context: {
        actions: args.actions,
        initialState: args.initialState,
        goalState: args.goalState
      },
      instructions: [
        '1. Check action schema consistency',
        '2. Verify precondition/effect compatibility',
        '3. Check for action applicability from initial state',
        '4. Verify goal conditions can be achieved by some action',
        '5. Detect missing actions for goal achievement',
        '6. Check for conflicting action effects',
        '7. Validate typing constraints',
        '8. Assess action completeness',
        '9. Determine goal reachability',
        '10. Document validation findings'
      ],
      outputFormat: 'JSON object with action model validation'
    },
    outputSchema: {
      type: 'object',
      required: ['goalReachable', 'validActions'],
      properties: {
        goalReachable: { type: 'boolean' },
        reachabilityAnalysis: {
          type: 'object',
          properties: {
            reachableFacts: { type: 'array', items: { type: 'string' } },
            unreachableFacts: { type: 'array', items: { type: 'string' } }
          }
        },
        validActions: {
          type: 'array',
          items: { type: 'string' }
        },
        invalidActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              issue: { type: 'string' }
            }
          }
        },
        missingActions: {
          type: 'array',
          items: { type: 'string' }
        },
        conflicts: {
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
  labels: ['planning', 'validation', 'actions']
}));

export const forwardSearchPlanningTask = defineTask('forward-search-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Forward Search Planning',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in forward state-space planning algorithms',
      task: 'Perform forward search to find a plan',
      context: {
        problemFormalization: args.problemFormalization,
        stateSpaceAnalysis: args.stateSpaceAnalysis,
        constraints: args.constraints
      },
      instructions: [
        '1. Start from initial state',
        '2. Apply applicable actions to generate successors',
        '3. Use A* or similar optimal search',
        '4. Apply admissible heuristic (h+, landmarks, etc.)',
        '5. Track search statistics (nodes expanded, etc.)',
        '6. Handle constraint checking during search',
        '7. Return first/best solution found',
        '8. Document search path',
        '9. Report search complexity',
        '10. Provide search summary'
      ],
      outputFormat: 'JSON object with forward search results'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'success'],
      properties: {
        success: { type: 'boolean' },
        plan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              action: { type: 'string' },
              parameters: { type: 'array', items: { type: 'string' } },
              state: { type: 'object' }
            }
          }
        },
        cost: { type: 'number' },
        statistics: {
          type: 'object',
          properties: {
            nodesExpanded: { type: 'number' },
            nodesGenerated: { type: 'number' },
            searchTime: { type: 'string' }
          }
        },
        heuristic: { type: 'string' },
        algorithm: { type: 'string' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['planning', 'forward-search', 'astar']
}));

export const backwardSearchPlanningTask = defineTask('backward-search-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Backward Search Planning',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in regression planning and backward search',
      task: 'Perform backward search (regression) to find a plan',
      context: {
        problemFormalization: args.problemFormalization,
        stateSpaceAnalysis: args.stateSpaceAnalysis,
        constraints: args.constraints
      },
      instructions: [
        '1. Start from goal state',
        '2. Identify relevant actions (that achieve some goal)',
        '3. Regress goal through action to get subgoals',
        '4. Continue until initial state is reached',
        '5. Use appropriate heuristic for search',
        '6. Handle partial states (goal sets)',
        '7. Track search statistics',
        '8. Return plan in forward order',
        '9. Report search complexity',
        '10. Provide search summary'
      ],
      outputFormat: 'JSON object with backward search results'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'success'],
      properties: {
        success: { type: 'boolean' },
        plan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              action: { type: 'string' },
              achieves: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        cost: { type: 'number' },
        statistics: {
          type: 'object',
          properties: {
            nodesExpanded: { type: 'number' },
            subgoalsGenerated: { type: 'number' }
          }
        },
        algorithm: { type: 'string' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['planning', 'backward-search', 'regression']
}));

export const graphBasedPlanningTask = defineTask('graph-based-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Graph-Based Planning',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in GraphPlan and planning graphs',
      task: 'Apply graph-based planning approach',
      context: {
        problemFormalization: args.problemFormalization,
        stateSpaceAnalysis: args.stateSpaceAnalysis
      },
      instructions: [
        '1. Build planning graph (fact and action layers)',
        '2. Expand graph until goals appear',
        '3. Check mutex relations between actions/facts',
        '4. Extract plan via backward search through graph',
        '5. Use graph for heuristic computation',
        '6. Detect unreachability early',
        '7. Track graph statistics',
        '8. Return extracted plan',
        '9. Report graph complexity',
        '10. Provide planning summary'
      ],
      outputFormat: 'JSON object with graph planning results'
    },
    outputSchema: {
      type: 'object',
      required: ['plan', 'success'],
      properties: {
        success: { type: 'boolean' },
        plan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              action: { type: 'string' },
              layer: { type: 'number' }
            }
          }
        },
        graphStatistics: {
          type: 'object',
          properties: {
            layers: { type: 'number' },
            factLevelSize: { type: 'array', items: { type: 'number' } },
            actionLevelSize: { type: 'array', items: { type: 'number' } },
            mutexCount: { type: 'number' }
          }
        },
        levelOff: { type: 'number' },
        algorithm: { type: 'string' },
        summary: { type: 'string' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['planning', 'graphplan', 'graph-based']
}));

export const planOptimizationTask = defineTask('plan-optimization', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Selection and Optimization',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in plan optimization and selection',
      task: 'Select and optimize the best plan from search results',
      context: {
        forwardSearch: args.forwardSearch,
        backwardSearch: args.backwardSearch,
        graphPlanning: args.graphPlanning,
        constraints: args.constraints
      },
      instructions: [
        '1. Compare plans from different methods',
        '2. Select best plan by cost/length',
        '3. Attempt plan compression',
        '4. Identify parallel action opportunities',
        '5. Remove redundant actions',
        '6. Reorder for better resource usage',
        '7. Verify optimized plan validity',
        '8. Compute optimality bounds',
        '9. Document optimization steps',
        '10. Return optimized plan'
      ],
      outputFormat: 'JSON object with optimized plan'
    },
    outputSchema: {
      type: 'object',
      required: ['optimalPlan', 'cost'],
      properties: {
        optimalPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              action: { type: 'string' },
              parameters: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        cost: { type: 'number' },
        length: { type: 'number' },
        selectedMethod: { type: 'string' },
        optimizations: {
          type: 'array',
          items: { type: 'string' }
        },
        parallelizable: {
          type: 'array',
          items: {
            type: 'array',
            items: { type: 'number' }
          }
        },
        optimalityGap: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['planning', 'optimization', 'selection']
}));

export const temporalPlanningTask = defineTask('temporal-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Temporal Planning',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in temporal planning and scheduling',
      task: 'Add temporal constraints and create schedule',
      context: {
        planOptimization: args.planOptimization,
        constraints: args.constraints,
        problemFormalization: args.problemFormalization
      },
      instructions: [
        '1. Assign durations to actions',
        '2. Identify temporal constraints',
        '3. Build temporal network',
        '4. Check temporal consistency',
        '5. Compute earliest/latest start times',
        '6. Identify critical path',
        '7. Schedule actions respecting constraints',
        '8. Handle concurrent actions',
        '9. Compute makespan',
        '10. Return scheduled plan'
      ],
      outputFormat: 'JSON object with temporal plan'
    },
    outputSchema: {
      type: 'object',
      required: ['scheduledPlan', 'makespan'],
      properties: {
        scheduledPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              startTime: { type: 'number' },
              endTime: { type: 'number' },
              duration: { type: 'number' }
            }
          }
        },
        makespan: { type: 'number' },
        criticalPath: {
          type: 'array',
          items: { type: 'string' }
        },
        temporalConstraints: {
          type: 'array',
          items: { type: 'object' }
        },
        slack: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              slack: { type: 'number' }
            }
          }
        },
        concurrentActions: {
          type: 'array',
          items: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['planning', 'temporal', 'scheduling']
}));

export const planValidationTask = defineTask('plan-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Validation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in plan verification and validation',
      task: 'Validate the plan achieves the goal from initial state',
      context: {
        plan: args.plan,
        initialState: args.initialState,
        goalState: args.goalState,
        problemFormalization: args.problemFormalization
      },
      instructions: [
        '1. Simulate plan execution from initial state',
        '2. Verify preconditions satisfied at each step',
        '3. Apply effects to update state',
        '4. Check goal satisfaction at end',
        '5. Verify no constraint violations',
        '6. Check for resource consistency',
        '7. Validate temporal constraints if present',
        '8. Identify any issues',
        '9. Document validation trace',
        '10. Return validation result'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['isValid', 'validatedPlan'],
      properties: {
        isValid: { type: 'boolean' },
        validatedPlan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              action: { type: 'string' },
              preconditionsMet: { type: 'boolean' },
              resultingState: { type: 'object' }
            }
          }
        },
        goalAchieved: { type: 'boolean' },
        finalState: { type: 'object' },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              issue: { type: 'string' }
            }
          }
        },
        executionTrace: {
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
  labels: ['planning', 'validation', 'verification']
}));

export const policySynthesisTask = defineTask('policy-synthesis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Policy Synthesis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in policy synthesis and contingent planning',
      task: 'Synthesize a policy for handling non-determinism',
      context: {
        problemFormalization: args.problemFormalization,
        plan: args.plan,
        stateSpaceAnalysis: args.stateSpaceAnalysis
      },
      instructions: [
        '1. Identify sources of non-determinism',
        '2. Identify states where plan might diverge',
        '3. Compute alternative actions for contingencies',
        '4. Build state-action mapping (policy)',
        '5. Ensure policy handles all reachable states',
        '6. Check policy terminates/reaches goal',
        '7. Assess policy completeness',
        '8. Compute expected plan length under policy',
        '9. Document policy decision points',
        '10. Return policy representation'
      ],
      outputFormat: 'JSON object with synthesized policy'
    },
    outputSchema: {
      type: 'object',
      required: ['policy'],
      properties: {
        policy: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              state: { type: 'object' },
              action: { type: 'string' },
              contingencies: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    condition: { type: 'string' },
                    action: { type: 'string' }
                  }
                }
              }
            }
          }
        },
        policyType: {
          type: 'string',
          enum: ['deterministic', 'conditional', 'probabilistic']
        },
        decisionPoints: {
          type: 'array',
          items: { type: 'object' }
        },
        coverageComplete: { type: 'boolean' },
        expectedLength: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['planning', 'policy', 'contingent']
}));

export const planRobustnessTask = defineTask('plan-robustness', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Robustness Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine', 'formal-logic-reasoner'],
    prompt: {
      role: 'Expert in plan robustness and failure analysis',
      task: 'Analyze plan robustness to failures and perturbations',
      context: {
        plan: args.plan,
        problemFormalization: args.problemFormalization,
        constraints: args.constraints
      },
      instructions: [
        '1. Identify potential failure points',
        '2. Assess impact of action failures',
        '3. Identify critical vs non-critical steps',
        '4. Compute plan flexibility (slack, alternatives)',
        '5. Assess sensitivity to timing',
        '6. Identify recovery options',
        '7. Compute robustness score',
        '8. Suggest robustness improvements',
        '9. Identify monitoring points',
        '10. Document robustness analysis'
      ],
      outputFormat: 'JSON object with robustness analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['robustnessScore', 'criticalSteps'],
      properties: {
        robustnessScore: { type: 'number' },
        criticalSteps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              criticality: { type: 'string', enum: ['high', 'medium', 'low'] },
              failureImpact: { type: 'string' }
            }
          }
        },
        failurePoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              failureMode: { type: 'string' },
              probability: { type: 'number' },
              recovery: { type: 'string' }
            }
          }
        },
        flexibility: {
          type: 'object',
          properties: {
            temporalSlack: { type: 'number' },
            alternativeActions: { type: 'number' }
          }
        },
        improvements: {
          type: 'array',
          items: { type: 'string' }
        },
        monitoringPoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              afterStep: { type: 'number' },
              check: { type: 'string' }
            }
          }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['planning', 'robustness', 'reliability']
}));
