/**
 * @process specializations/domains/science/scientific-discovery/means-end-instrumental-reasoning
 * @description Means-End Instrumental Reasoning Process - Derive necessary actions and subgoals
 * from goals through backward chaining, hierarchical task decomposition, and action planning.
 * @inputs { domain: string, goal: object, currentState: object, availableActions?: object[], constraints?: object }
 * @outputs { success: boolean, plan: object, subgoals: object[], actionSequence: object[] }
 *
 * @example
 * const result = await orchestrate('specializations/domains/science/scientific-discovery/means-end-instrumental-reasoning', {
 *   domain: 'Research Planning',
 *   goal: { description: 'Publish peer-reviewed paper on climate model validation' },
 *   currentState: { hasData: true, hasModel: false, hasPaperDraft: false },
 *   constraints: { deadline: '6 months', budget: '$50000' }
 * });
 *
 * @references
 * - Newell & Simon (1972). Human Problem Solving
 * - Sacerdoti (1974). Planning in a Hierarchy of Abstraction Spaces
 * - Bratman (1987). Intention, Plans, and Practical Reason
 * - Pollock (2006). Thinking About Acting
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    domain,
    goal,
    currentState,
    availableActions = [],
    constraints = {}
  } = inputs;

  // Phase 1: Goal Analysis
  const goalAnalysis = await ctx.task(goalAnalysisTask, {
    domain,
    goal,
    currentState
  });

  // Phase 2: Gap Analysis
  const gapAnalysis = await ctx.task(gapAnalysisTask, {
    goalAnalysis,
    currentState,
    goal
  });

  // Quality Gate: Gap must be identifiable
  if (!gapAnalysis.gaps || gapAnalysis.gaps.length === 0) {
    return {
      success: true,
      message: 'Goal already achieved - no action needed',
      plan: null,
      subgoals: [],
      actionSequence: []
    };
  }

  // Phase 3: Subgoal Generation (Backward Chaining)
  const subgoalGeneration = await ctx.task(subgoalGenerationTask, {
    goalAnalysis,
    gapAnalysis,
    currentState,
    domain
  });

  // Phase 4: Action Identification
  const actionIdentification = await ctx.task(actionIdentificationTask, {
    subgoalGeneration,
    availableActions,
    currentState,
    domain
  });

  // Phase 5: Precondition Analysis
  const preconditionAnalysis = await ctx.task(preconditionAnalysisTask, {
    actionIdentification,
    currentState,
    subgoalGeneration
  });

  // Phase 6: Hierarchical Task Decomposition
  const taskDecomposition = await ctx.task(taskDecompositionTask, {
    subgoalGeneration,
    actionIdentification,
    preconditionAnalysis,
    domain
  });

  // Phase 7: Constraint Satisfaction
  const constraintSatisfaction = await ctx.task(constraintSatisfactionTask, {
    taskDecomposition,
    constraints,
    currentState
  });

  // Quality Gate: Check constraint feasibility
  if (!constraintSatisfaction.feasible) {
    await ctx.breakpoint({
      question: `Plan violates constraints: ${constraintSatisfaction.violations.join(', ')}. Revise constraints or accept partial plan?`,
      title: 'Constraint Violation',
      context: {
        runId: ctx.runId,
        violations: constraintSatisfaction.violations,
        recommendation: 'Consider relaxing constraints or finding alternative approaches'
      }
    });
  }

  // Phase 8: Plan Ordering and Sequencing
  const planOrdering = await ctx.task(planOrderingTask, {
    taskDecomposition,
    constraintSatisfaction,
    preconditionAnalysis
  });

  // Phase 9: Resource Allocation
  const resourceAllocation = await ctx.task(resourceAllocationTask, {
    planOrdering,
    constraints,
    domain
  });

  // Breakpoint: Review plan
  await ctx.breakpoint({
    question: `Means-end plan generated with ${planOrdering.steps.length} steps. Estimated completion: ${resourceAllocation.estimatedDuration}. Review plan?`,
    title: 'Plan Review',
    context: {
      runId: ctx.runId,
      domain,
      goal: goal.description,
      steps: planOrdering.steps.slice(0, 5).map(s => s.action)
    }
  });

  // Phase 10: Contingency Planning
  const contingencyPlanning = await ctx.task(contingencyPlanningTask, {
    planOrdering,
    constraintSatisfaction,
    domain
  });

  // Phase 11: Plan Validation
  const planValidation = await ctx.task(planValidationTask, {
    planOrdering,
    goal,
    currentState,
    contingencyPlanning
  });

  // Final Breakpoint
  await ctx.breakpoint({
    question: `Plan validation complete. Confidence: ${planValidation.confidence}. Execute plan?`,
    title: 'Final Plan Review',
    context: {
      runId: ctx.runId,
      domain,
      files: [
        { path: 'artifacts/plan.json', format: 'json', content: planOrdering },
        { path: 'artifacts/resources.json', format: 'json', content: resourceAllocation }
      ]
    }
  });

  return {
    success: true,
    domain,
    goal: goalAnalysis.formalGoal,
    plan: {
      steps: planOrdering.steps,
      ordering: planOrdering.ordering,
      dependencies: planOrdering.dependencies
    },
    subgoals: subgoalGeneration.subgoals,
    actionSequence: planOrdering.steps.map(s => s.action),
    resources: resourceAllocation,
    contingencies: contingencyPlanning.contingencies,
    validation: planValidation,
    metadata: {
      processId: 'specializations/domains/science/scientific-discovery/means-end-instrumental-reasoning',
      timestamp: ctx.now(),
      version: '1.0.0'
    }
  };
}

// Task Definitions

export const goalAnalysisTask = defineTask('goal-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: `Goal Analysis - ${args.domain}`,
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in goal specification and requirements analysis',
      task: 'Analyze and formalize the goal for means-end reasoning',
      context: {
        domain: args.domain,
        goal: args.goal,
        currentState: args.currentState
      },
      instructions: [
        '1. Parse and clarify the goal description',
        '2. Identify goal type (achievement, maintenance, optimization)',
        '3. Specify goal conditions formally (what must be true)',
        '4. Identify success criteria and metrics',
        '5. Decompose compound goals into atomic subgoals',
        '6. Identify goal priorities if multiple goals',
        '7. Assess goal clarity and completeness',
        '8. Identify implicit goals and assumptions',
        '9. Determine if goal is well-formed',
        '10. Document goal formalization'
      ],
      outputFormat: 'JSON object with goal analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['formalGoal', 'goalType', 'successCriteria'],
      properties: {
        formalGoal: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            conditions: { type: 'array', items: { type: 'string' } },
            state: { type: 'object' }
          }
        },
        goalType: {
          type: 'string',
          enum: ['achievement', 'maintenance', 'optimization', 'compound']
        },
        successCriteria: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              criterion: { type: 'string' },
              metric: { type: 'string' },
              target: { type: 'any' }
            }
          }
        },
        subgoals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subgoal: { type: 'string' },
              priority: { type: 'number' }
            }
          }
        },
        assumptions: {
          type: 'array',
          items: { type: 'string' }
        },
        wellFormed: { type: 'boolean' },
        clarifications: {
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
  labels: ['means-end', 'goal-analysis', 'planning']
}));

export const gapAnalysisTask = defineTask('gap-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Gap Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in problem space analysis and state comparison',
      task: 'Identify gaps between current state and goal state',
      context: {
        goalAnalysis: args.goalAnalysis,
        currentState: args.currentState,
        goal: args.goal
      },
      instructions: [
        '1. Compare current state to goal conditions',
        '2. Identify specific differences (gaps)',
        '3. Categorize gaps by type and domain',
        '4. Assess gap severity and priority',
        '5. Identify dependencies between gaps',
        '6. Determine which gaps are actionable',
        '7. Identify gaps that enable other gaps to be closed',
        '8. Estimate difficulty of closing each gap',
        '9. Identify any state elements already satisfied',
        '10. Create gap closure priority ordering'
      ],
      outputFormat: 'JSON object with gap analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['gaps', 'priorityOrdering'],
      properties: {
        gaps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              currentValue: { type: 'any' },
              targetValue: { type: 'any' },
              category: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              difficulty: { type: 'string', enum: ['hard', 'medium', 'easy'] },
              actionable: { type: 'boolean' }
            }
          }
        },
        satisfiedConditions: {
          type: 'array',
          items: { type: 'string' }
        },
        gapDependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              gap: { type: 'string' },
              dependsOn: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        enablingGaps: {
          type: 'array',
          items: { type: 'string' }
        },
        priorityOrdering: {
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
  labels: ['means-end', 'gap-analysis', 'state-comparison']
}));

export const subgoalGenerationTask = defineTask('subgoal-generation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Subgoal Generation (Backward Chaining)',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in goal decomposition and backward chaining',
      task: 'Generate subgoals through backward chaining from main goal',
      context: {
        goalAnalysis: args.goalAnalysis,
        gapAnalysis: args.gapAnalysis,
        currentState: args.currentState,
        domain: args.domain
      },
      instructions: [
        '1. Start from the goal and work backwards',
        '2. For each goal, identify necessary preconditions',
        '3. Convert preconditions into subgoals',
        '4. Recursively decompose subgoals',
        '5. Stop when subgoals match current state',
        '6. Identify alternative subgoal paths',
        '7. Assess subgoal achievability',
        '8. Identify critical path of subgoals',
        '9. Handle AND/OR subgoal structures',
        '10. Create subgoal hierarchy'
      ],
      outputFormat: 'JSON object with subgoals'
    },
    outputSchema: {
      type: 'object',
      required: ['subgoals', 'hierarchy'],
      properties: {
        subgoals: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              description: { type: 'string' },
              parentGoal: { type: 'string' },
              preconditions: { type: 'array', items: { type: 'string' } },
              achievable: { type: 'boolean' },
              level: { type: 'number' }
            }
          }
        },
        hierarchy: {
          type: 'object',
          properties: {
            root: { type: 'string' },
            structure: { type: 'object' }
          }
        },
        andOrStructure: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              goal: { type: 'string' },
              type: { type: 'string', enum: ['AND', 'OR'] },
              children: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        criticalPath: {
          type: 'array',
          items: { type: 'string' }
        },
        alternativePaths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              path: { type: 'array', items: { type: 'string' } },
              viability: { type: 'string' }
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
  labels: ['means-end', 'subgoals', 'backward-chaining']
}));

export const actionIdentificationTask = defineTask('action-identification', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Action Identification',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in action planning and operator selection',
      task: 'Identify actions that can achieve subgoals',
      context: {
        subgoalGeneration: args.subgoalGeneration,
        availableActions: args.availableActions,
        currentState: args.currentState,
        domain: args.domain
      },
      instructions: [
        '1. For each subgoal, identify potential actions',
        '2. Match actions by their effects to subgoal conditions',
        '3. Consider both available and potential new actions',
        '4. Assess action applicability in current context',
        '5. Identify action preconditions',
        '6. Identify action effects (add/delete lists)',
        '7. Assess action costs and durations',
        '8. Identify compound/composite actions',
        '9. Consider action alternatives',
        '10. Map actions to subgoals'
      ],
      outputFormat: 'JSON object with identified actions'
    },
    outputSchema: {
      type: 'object',
      required: ['actions', 'actionSubgoalMapping'],
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              preconditions: { type: 'array', items: { type: 'string' } },
              effects: {
                type: 'object',
                properties: {
                  add: { type: 'array', items: { type: 'string' } },
                  delete: { type: 'array', items: { type: 'string' } }
                }
              },
              cost: { type: 'any' },
              duration: { type: 'string' },
              applicable: { type: 'boolean' }
            }
          }
        },
        actionSubgoalMapping: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              subgoal: { type: 'string' },
              actions: { type: 'array', items: { type: 'string' } },
              preferredAction: { type: 'string' }
            }
          }
        },
        compositeActions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              components: { type: 'array', items: { type: 'string' } }
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
  labels: ['means-end', 'actions', 'operators']
}));

export const preconditionAnalysisTask = defineTask('precondition-analysis', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Precondition Analysis',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in planning preconditions and enablement analysis',
      task: 'Analyze action preconditions and their satisfaction',
      context: {
        actionIdentification: args.actionIdentification,
        currentState: args.currentState,
        subgoalGeneration: args.subgoalGeneration
      },
      instructions: [
        '1. List all action preconditions',
        '2. Check which preconditions are currently satisfied',
        '3. Identify unsatisfied preconditions',
        '4. Convert unsatisfied preconditions to new subgoals',
        '5. Identify precondition conflicts between actions',
        '6. Detect clobbering (action undoing preconditions)',
        '7. Identify mutex (mutually exclusive) actions',
        '8. Determine precondition achievement ordering',
        '9. Identify protected conditions',
        '10. Create precondition satisfaction plan'
      ],
      outputFormat: 'JSON object with precondition analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['preconditions', 'satisfactionStatus'],
      properties: {
        preconditions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              precondition: { type: 'string' },
              satisfied: { type: 'boolean' },
              satisfiedBy: { type: 'string' }
            }
          }
        },
        satisfactionStatus: {
          type: 'object',
          properties: {
            satisfied: { type: 'array', items: { type: 'string' } },
            unsatisfied: { type: 'array', items: { type: 'string' } },
            needsSubgoal: { type: 'array', items: { type: 'string' } }
          }
        },
        conflicts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              actions: { type: 'array', items: { type: 'string' } },
              conflict: { type: 'string' },
              resolution: { type: 'string' }
            }
          }
        },
        clobbering: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              clobbers: { type: 'string' },
              neededBy: { type: 'string' }
            }
          }
        },
        mutex: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action1: { type: 'string' },
              action2: { type: 'string' },
              reason: { type: 'string' }
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
  labels: ['means-end', 'preconditions', 'planning']
}));

export const taskDecompositionTask = defineTask('task-decomposition', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Hierarchical Task Decomposition',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in hierarchical task network planning',
      task: 'Decompose tasks into primitive actions',
      context: {
        subgoalGeneration: args.subgoalGeneration,
        actionIdentification: args.actionIdentification,
        preconditionAnalysis: args.preconditionAnalysis,
        domain: args.domain
      },
      instructions: [
        '1. Identify abstract/compound tasks',
        '2. Decompose compound tasks into subtasks',
        '3. Continue until reaching primitive actions',
        '4. Create task hierarchy (HTN)',
        '5. Identify decomposition methods/schemas',
        '6. Handle alternative decompositions',
        '7. Preserve ordering constraints',
        '8. Identify task granularity levels',
        '9. Document task-subtask relationships',
        '10. Validate decomposition completeness'
      ],
      outputFormat: 'JSON object with task decomposition'
    },
    outputSchema: {
      type: 'object',
      required: ['hierarchy', 'primitiveActions'],
      properties: {
        hierarchy: {
          type: 'object',
          properties: {
            root: { type: 'string' },
            levels: { type: 'number' },
            structure: { type: 'object' }
          }
        },
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              isPrimitive: { type: 'boolean' },
              subtasks: { type: 'array', items: { type: 'string' } },
              decompositionMethod: { type: 'string' }
            }
          }
        },
        primitiveActions: {
          type: 'array',
          items: { type: 'string' }
        },
        orderingConstraints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              before: { type: 'string' },
              after: { type: 'string' }
            }
          }
        },
        alternativeDecompositions: {
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
  labels: ['means-end', 'htn', 'decomposition']
}));

export const constraintSatisfactionTask = defineTask('constraint-satisfaction', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Constraint Satisfaction',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in constraint satisfaction and resource planning',
      task: 'Check and enforce constraints on the plan',
      context: {
        taskDecomposition: args.taskDecomposition,
        constraints: args.constraints,
        currentState: args.currentState
      },
      instructions: [
        '1. Enumerate all constraints (temporal, resource, logical)',
        '2. Check each constraint against the plan',
        '3. Identify violated constraints',
        '4. Attempt constraint propagation',
        '5. Identify constraint relaxation options',
        '6. Find alternative plans satisfying constraints',
        '7. Assess constraint criticality',
        '8. Compute slack in each constraint',
        '9. Identify binding constraints',
        '10. Determine overall feasibility'
      ],
      outputFormat: 'JSON object with constraint analysis'
    },
    outputSchema: {
      type: 'object',
      required: ['feasible', 'constraintStatus'],
      properties: {
        feasible: { type: 'boolean' },
        constraintStatus: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraint: { type: 'string' },
              type: { type: 'string', enum: ['temporal', 'resource', 'logical', 'precedence'] },
              satisfied: { type: 'boolean' },
              slack: { type: 'any' },
              binding: { type: 'boolean' }
            }
          }
        },
        violations: {
          type: 'array',
          items: { type: 'string' }
        },
        relaxationOptions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              constraint: { type: 'string' },
              relaxation: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        bindingConstraints: {
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
  labels: ['means-end', 'constraints', 'feasibility']
}));

export const planOrderingTask = defineTask('plan-ordering', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Ordering and Sequencing',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in plan linearization and scheduling',
      task: 'Order actions into executable sequence',
      context: {
        taskDecomposition: args.taskDecomposition,
        constraintSatisfaction: args.constraintSatisfaction,
        preconditionAnalysis: args.preconditionAnalysis
      },
      instructions: [
        '1. Collect all ordering constraints',
        '2. Build action dependency graph',
        '3. Perform topological sort',
        '4. Handle partial ordering flexibility',
        '5. Identify parallel execution opportunities',
        '6. Resolve ordering conflicts',
        '7. Minimize makespan if possible',
        '8. Create linear action sequence',
        '9. Document dependencies between steps',
        '10. Validate executable ordering'
      ],
      outputFormat: 'JSON object with ordered plan'
    },
    outputSchema: {
      type: 'object',
      required: ['steps', 'ordering'],
      properties: {
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              order: { type: 'number' },
              action: { type: 'string' },
              description: { type: 'string' },
              achieves: { type: 'array', items: { type: 'string' } },
              requires: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        ordering: {
          type: 'string',
          enum: ['total', 'partial']
        },
        dependencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              dependsOn: { type: 'array', items: { type: 'number' } }
            }
          }
        },
        parallelOpportunities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              steps: { type: 'array', items: { type: 'number' } },
              reason: { type: 'string' }
            }
          }
        },
        criticalPath: {
          type: 'array',
          items: { type: 'number' }
        }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['means-end', 'ordering', 'scheduling']
}));

export const resourceAllocationTask = defineTask('resource-allocation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Resource Allocation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in resource planning and allocation',
      task: 'Allocate resources to plan steps',
      context: {
        planOrdering: args.planOrdering,
        constraints: args.constraints,
        domain: args.domain
      },
      instructions: [
        '1. Identify resources needed for each step',
        '2. Check resource availability',
        '3. Allocate resources to steps',
        '4. Handle resource conflicts',
        '5. Optimize resource utilization',
        '6. Estimate step durations with resources',
        '7. Calculate total resource requirements',
        '8. Estimate total cost',
        '9. Estimate total duration',
        '10. Identify resource bottlenecks'
      ],
      outputFormat: 'JSON object with resource allocation'
    },
    outputSchema: {
      type: 'object',
      required: ['allocations', 'estimatedDuration', 'estimatedCost'],
      properties: {
        allocations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              resources: { type: 'array', items: { type: 'string' } },
              duration: { type: 'string' },
              cost: { type: 'any' }
            }
          }
        },
        totalResources: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              amount: { type: 'any' }
            }
          }
        },
        estimatedDuration: { type: 'string' },
        estimatedCost: { type: 'any' },
        bottlenecks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              resource: { type: 'string' },
              impact: { type: 'string' }
            }
          }
        },
        utilizationRate: { type: 'number' }
      }
    }
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },
  labels: ['means-end', 'resources', 'allocation']
}));

export const contingencyPlanningTask = defineTask('contingency-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Contingency Planning',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in risk management and contingency planning',
      task: 'Develop contingency plans for potential failures',
      context: {
        planOrdering: args.planOrdering,
        constraintSatisfaction: args.constraintSatisfaction,
        domain: args.domain
      },
      instructions: [
        '1. Identify potential failure points in the plan',
        '2. Assess failure likelihood for each step',
        '3. Develop alternative actions for each failure',
        '4. Create branching contingency plans',
        '5. Identify plan repair strategies',
        '6. Define monitoring checkpoints',
        '7. Establish fallback positions',
        '8. Plan for graceful degradation',
        '9. Identify early warning indicators',
        '10. Document contingency triggers'
      ],
      outputFormat: 'JSON object with contingency plans'
    },
    outputSchema: {
      type: 'object',
      required: ['contingencies', 'checkpoints'],
      properties: {
        contingencies: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              failureMode: { type: 'string' },
              likelihood: { type: 'string', enum: ['high', 'medium', 'low'] },
              contingencyAction: { type: 'string' },
              trigger: { type: 'string' }
            }
          }
        },
        checkpoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              afterStep: { type: 'number' },
              check: { type: 'string' },
              successCriteria: { type: 'string' }
            }
          }
        },
        fallbackPositions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              position: { type: 'string' },
              trigger: { type: 'string' },
              value: { type: 'string' }
            }
          }
        },
        earlyWarnings: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              indicator: { type: 'string' },
              threshold: { type: 'any' },
              response: { type: 'string' }
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
  labels: ['means-end', 'contingency', 'risk']
}));

export const planValidationTask = defineTask('plan-validation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Validation',
  skill: { name: 'hypothesis-generator' },
  agent: {
    name: 'planning-analyst',
    skills: ['hypothesis-generator', 'causal-inference-engine'],
    prompt: {
      role: 'Expert in plan verification and validation',
      task: 'Validate the plan achieves the goal',
      context: {
        planOrdering: args.planOrdering,
        goal: args.goal,
        currentState: args.currentState,
        contingencyPlanning: args.contingencyPlanning
      },
      instructions: [
        '1. Simulate plan execution from initial state',
        '2. Verify all preconditions met at each step',
        '3. Track state changes through execution',
        '4. Verify goal conditions achieved at end',
        '5. Check for unintended side effects',
        '6. Verify constraint satisfaction maintained',
        '7. Assess plan robustness',
        '8. Identify potential issues',
        '9. Calculate overall confidence',
        '10. Provide validation verdict'
      ],
      outputFormat: 'JSON object with validation results'
    },
    outputSchema: {
      type: 'object',
      required: ['valid', 'confidence'],
      properties: {
        valid: { type: 'boolean' },
        goalAchievement: {
          type: 'object',
          properties: {
            achieved: { type: 'boolean' },
            satisfiedConditions: { type: 'array', items: { type: 'string' } },
            unsatisfiedConditions: { type: 'array', items: { type: 'string' } }
          }
        },
        stateTrace: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              step: { type: 'number' },
              stateChanges: { type: 'object' }
            }
          }
        },
        sideEffects: {
          type: 'array',
          items: { type: 'string' }
        },
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              issue: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
              step: { type: 'number' }
            }
          }
        },
        confidence: {
          type: 'string',
          enum: ['high', 'moderate', 'low']
        },
        recommendations: {
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
  labels: ['means-end', 'validation', 'verification']
}));
