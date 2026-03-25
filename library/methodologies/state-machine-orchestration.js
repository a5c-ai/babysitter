/**
 * @process methodologies/state-machine-orchestration
 * @description State Machine Orchestration: Explicit state management with transitions, guards, and entry/exit actions
 * @inputs { task: string, maxTransitions: number, enableStateHistory: boolean }
 * @outputs { success: boolean, finalState: string, stateHistory: array, transitionCount: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * State Machine Orchestration Process
 *
 * Implements a formal state machine workflow with:
 * - Explicit states (INIT, PLANNING, EXECUTING, VALIDATING, COMPLETE, FAILED)
 * - Conditional transitions with guards
 * - Entry/exit actions for each state
 * - State history tracking
 * - Transition validation
 *
 * This methodology provides deterministic, predictable workflows with clear
 * state transitions and validation at each step.
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.task - Task to execute through state machine
 * @param {number} inputs.maxTransitions - Maximum state transitions (default: 20)
 * @param {boolean} inputs.enableStateHistory - Track full state history (default: true)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Process result
 */
export async function process(inputs, ctx) {
  const {
    task,
    maxTransitions = 20,
    enableStateHistory = true
  } = inputs;

  // State machine configuration
  const states = {
    INIT: 'INIT',
    PLANNING: 'PLANNING',
    EXECUTING: 'EXECUTING',
    VALIDATING: 'VALIDATING',
    REFINING: 'REFINING',
    COMPLETE: 'COMPLETE',
    FAILED: 'FAILED'
  };

  // Current state
  let currentState = states.INIT;
  let transitionCount = 0;
  const stateHistory = [];
  const transitionLog = [];
  let taskContext = {
    task,
    plan: null,
    executionResult: null,
    validationResult: null,
    refinementAttempts: 0,
    errors: []
  };

  /**
   * Record state entry
   */
  const enterState = async (state) => {
    const entry = {
      state,
      enteredAt: ctx.now(),
      transitionNumber: transitionCount
    };

    if (enableStateHistory) {
      stateHistory.push(entry);
    }

    // Execute entry actions
    await executeEntryAction(state);
  };

  /**
   * Record state exit
   */
  const exitState = async (state) => {
    // Execute exit actions
    await executeExitAction(state);
  };

  /**
   * Execute entry action for a state
   */
  const executeEntryAction = async (state) => {
    switch (state) {
      case states.INIT:
        // Initialize task context
        taskContext.startedAt = ctx.now();
        break;

      case states.PLANNING:
        // Prepare for planning phase
        taskContext.planningStartedAt = ctx.now();
        break;

      case states.EXECUTING:
        // Prepare for execution
        taskContext.executionStartedAt = ctx.now();
        break;

      case states.VALIDATING:
        // Prepare for validation
        taskContext.validationStartedAt = ctx.now();
        break;

      case states.REFINING:
        // Increment refinement attempts
        taskContext.refinementAttempts++;
        taskContext.refinementStartedAt = ctx.now();
        break;

      case states.COMPLETE:
        // Mark completion time
        taskContext.completedAt = ctx.now();
        break;

      case states.FAILED:
        // Mark failure time
        taskContext.failedAt = ctx.now();
        break;
    }
  };

  /**
   * Execute exit action for a state
   */
  const executeExitAction = async (state) => {
    switch (state) {
      case states.PLANNING:
        // Validate plan exists before leaving
        if (!taskContext.plan) {
          throw new Error('Cannot exit PLANNING state without a plan');
        }
        break;

      case states.EXECUTING:
        // Validate execution result exists
        if (!taskContext.executionResult) {
          throw new Error('Cannot exit EXECUTING state without execution result');
        }
        break;

      case states.VALIDATING:
        // Validate validation result exists
        if (!taskContext.validationResult) {
          throw new Error('Cannot exit VALIDATING state without validation result');
        }
        break;
    }
  };

  /**
   * Transition to new state with guard validation
   */
  const transition = async (targetState, reason) => {
    // Check if transition is allowed
    const allowed = await evaluateTransitionGuard(currentState, targetState);

    if (!allowed) {
      throw new Error(`Transition from ${currentState} to ${targetState} is not allowed`);
    }

    // Execute exit action
    await exitState(currentState);

    // Record transition
    const trans = {
      from: currentState,
      to: targetState,
      reason,
      timestamp: ctx.now(),
      transitionNumber: transitionCount
    };
    transitionLog.push(trans);

    // Update state
    const previousState = currentState;
    currentState = targetState;
    transitionCount++;

    // Execute entry action
    await enterState(currentState);

    return {
      previousState,
      currentState,
      transitionNumber: transitionCount
    };
  };

  /**
   * Guard conditions for state transitions
   */
  const evaluateTransitionGuard = async (fromState, toState) => {
    // Define valid transitions
    const validTransitions = {
      [states.INIT]: [states.PLANNING],
      [states.PLANNING]: [states.EXECUTING, states.FAILED],
      [states.EXECUTING]: [states.VALIDATING, states.FAILED],
      [states.VALIDATING]: [states.COMPLETE, states.REFINING, states.FAILED],
      [states.REFINING]: [states.EXECUTING, states.FAILED],
      [states.COMPLETE]: [],
      [states.FAILED]: []
    };

    // Check if transition is in valid list
    const allowedStates = validTransitions[fromState] || [];
    if (!allowedStates.includes(toState)) {
      return false;
    }

    // Additional guard conditions
    if (toState === states.REFINING) {
      // Only allow refinement if under max attempts
      const maxRefinementAttempts = inputs.maxRefinementAttempts || 3;
      if (taskContext.refinementAttempts >= maxRefinementAttempts) {
        return false;
      }
    }

    if (toState === states.COMPLETE) {
      // Only allow completion if validation passed
      if (!taskContext.validationResult || !taskContext.validationResult.passed) {
        return false;
      }
    }

    return true;
  };

  // ============================================================================
  // STATE MACHINE EXECUTION
  // ============================================================================

  // Enter initial state
  await enterState(states.INIT);

  // State machine loop
  while (
    currentState !== states.COMPLETE &&
    currentState !== states.FAILED &&
    transitionCount < maxTransitions
  ) {

    try {
      switch (currentState) {

        // ====================================================================
        // INIT STATE
        // ====================================================================
        case states.INIT: {
          // Initialize and transition to planning
          await transition(states.PLANNING, 'Starting task execution');
          break;
        }

        // ====================================================================
        // PLANNING STATE
        // ====================================================================
        case states.PLANNING: {
          // Execute planning task
          const planResult = await ctx.task(agentPlanningTask, {
            task: taskContext.task,
            refinementAttempts: taskContext.refinementAttempts,
            previousErrors: taskContext.errors
          });

          taskContext.plan = planResult;

          // Determine next transition based on plan quality
          if (planResult.confidence >= (inputs.minPlanConfidence || 0.7)) {
            await transition(states.EXECUTING, 'Plan approved, beginning execution');
          } else {
            await transition(states.FAILED, 'Plan confidence too low');
          }
          break;
        }

        // ====================================================================
        // EXECUTING STATE
        // ====================================================================
        case states.EXECUTING: {
          // Execute the planned tasks
          const executionResult = await ctx.task(agentExecutionTask, {
            task: taskContext.task,
            plan: taskContext.plan,
            refinementAttempts: taskContext.refinementAttempts
          });

          taskContext.executionResult = executionResult;

          // Transition to validation
          if (executionResult.status === 'SUCCESS') {
            await transition(states.VALIDATING, 'Execution complete, validating results');
          } else {
            await transition(states.FAILED, `Execution failed: ${executionResult.error}`);
          }
          break;
        }

        // ====================================================================
        // VALIDATING STATE
        // ====================================================================
        case states.VALIDATING: {
          // Validate execution results
          const validationResult = await ctx.task(agentValidationTask, {
            task: taskContext.task,
            plan: taskContext.plan,
            executionResult: taskContext.executionResult,
            qualityThreshold: inputs.qualityThreshold || 0.8
          });

          taskContext.validationResult = validationResult;

          // Determine next state based on validation
          if (validationResult.passed) {
            await transition(states.COMPLETE, 'Validation passed, task complete');
          } else if (validationResult.refinable && taskContext.refinementAttempts < (inputs.maxRefinementAttempts || 3)) {
            // Store validation errors for refinement
            taskContext.errors.push({
              phase: 'validation',
              issues: validationResult.issues,
              timestamp: ctx.now()
            });
            await transition(states.REFINING, 'Validation failed, refining approach');
          } else {
            await transition(states.FAILED, 'Validation failed, not refinable');
          }
          break;
        }

        // ====================================================================
        // REFINING STATE
        // ====================================================================
        case states.REFINING: {
          // Analyze failures and refine approach
          const refinementResult = await ctx.task(agentRefinementTask, {
            task: taskContext.task,
            plan: taskContext.plan,
            validationResult: taskContext.validationResult,
            errors: taskContext.errors,
            refinementAttempts: taskContext.refinementAttempts
          });

          // Update plan with refined approach
          taskContext.plan = refinementResult.refinedPlan;
          taskContext.refinementStrategy = refinementResult.strategy;

          // Transition back to execution with refined plan
          await transition(states.EXECUTING, `Refinement complete (attempt ${taskContext.refinementAttempts}), re-executing`);
          break;
        }

        default:
          throw new Error(`Unknown state: ${currentState}`);
      }

    } catch (error) {
      // Handle errors and transition to failed state
      taskContext.errors.push({
        state: currentState,
        error: error.message,
        timestamp: ctx.now()
      });

      if (currentState !== states.FAILED) {
        await transition(states.FAILED, `Error in ${currentState}: ${error.message}`);
      }
    }
  }

  // Check for max transitions reached
  if (transitionCount >= maxTransitions && currentState !== states.COMPLETE) {
    await transition(states.FAILED, 'Maximum transitions reached');
  }

  // ============================================================================
  // RESULT
  // ============================================================================

  return {
    success: currentState === states.COMPLETE,
    task,
    finalState: currentState,
    transitionCount,
    stateHistory: enableStateHistory ? stateHistory : undefined,
    transitionLog,
    taskContext: {
      plan: taskContext.plan,
      executionResult: taskContext.executionResult,
      validationResult: taskContext.validationResult,
      refinementAttempts: taskContext.refinementAttempts,
      errors: taskContext.errors
    },
    summary: {
      completed: currentState === states.COMPLETE,
      failed: currentState === states.FAILED,
      totalTransitions: transitionCount,
      refinementAttempts: taskContext.refinementAttempts,
      duration: taskContext.completedAt || taskContext.failedAt
        ? (taskContext.completedAt || taskContext.failedAt) - taskContext.startedAt
        : null
    },
    metadata: {
      processId: 'methodologies/state-machine-orchestration',
      timestamp: ctx.now(),
      maxTransitionsReached: transitionCount >= maxTransitions
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

/**
 * Agent planning task - Creates execution plan
 */
export const agentPlanningTask = defineTask('agent-planner', (args, taskCtx) => ({
  kind: 'agent',
  title: `Planning: ${args.task}`,
  description: 'Create detailed execution plan with state-aware context',

  agent: {
    name: 'state-machine-planner',
    prompt: {
      role: 'senior architect and planning expert',
      task: 'Create a comprehensive execution plan for the given task',
      context: {
        task: args.task,
        refinementAttempts: args.refinementAttempts,
        previousErrors: args.previousErrors
      },
      instructions: [
        'Analyze the task requirements thoroughly',
        'Break down into clear, actionable steps',
        'Identify dependencies and ordering constraints',
        'Define success criteria and validation points',
        'Consider previous errors if this is a refinement',
        'Assess plan confidence (0.0-1.0)',
        'Include risk analysis and mitigation strategies'
      ],
      outputFormat: 'JSON with steps, dependencies, successCriteria, confidence, risks, estimatedEffort'
    },
    outputSchema: {
      type: 'object',
      required: ['steps', 'confidence', 'successCriteria'],
      properties: {
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              dependencies: { type: 'array', items: { type: 'string' } },
              validationCriteria: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        successCriteria: { type: 'array', items: { type: 'string' } },
        risks: { type: 'array', items: { type: 'string' } },
        estimatedEffort: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'state-machine', 'planning']
}));

/**
 * Agent execution task - Executes the plan
 */
export const agentExecutionTask = defineTask('agent-executor', (args, taskCtx) => ({
  kind: 'agent',
  title: `Executing: ${args.task}`,
  description: `Execute plan (refinement attempt: ${args.refinementAttempts})`,

  agent: {
    name: 'state-machine-executor',
    prompt: {
      role: 'senior software engineer and implementer',
      task: 'Execute the planned steps and implement the solution',
      context: {
        task: args.task,
        plan: args.plan,
        refinementAttempts: args.refinementAttempts
      },
      instructions: [
        'Follow the execution plan step-by-step',
        'Implement each step according to specifications',
        'Track progress and any deviations from plan',
        'Document all changes and decisions made',
        'Ensure code quality and best practices',
        'Create necessary tests and documentation',
        'Report status as SUCCESS, PARTIAL, or ERROR'
      ],
      outputFormat: 'JSON with status, completedSteps, filesCreated, filesModified, issues, summary'
    },
    outputSchema: {
      type: 'object',
      required: ['status', 'completedSteps', 'summary'],
      properties: {
        status: { type: 'string', enum: ['SUCCESS', 'PARTIAL', 'ERROR'] },
        completedSteps: { type: 'array', items: { type: 'string' } },
        filesCreated: { type: 'array', items: { type: 'string' } },
        filesModified: { type: 'array', items: { type: 'string' } },
        issues: { type: 'array', items: { type: 'string' } },
        summary: { type: 'string' },
        error: { type: 'string' }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'state-machine', 'execution', `refinement-${args.refinementAttempts}`]
}));

/**
 * Agent validation task - Validates execution results
 */
export const agentValidationTask = defineTask('agent-validator', (args, taskCtx) => ({
  kind: 'agent',
  title: `Validating: ${args.task}`,
  description: 'Validate execution results against success criteria',

  agent: {
    name: 'state-machine-validator',
    prompt: {
      role: 'senior QA engineer and quality assurance expert',
      task: 'Validate the execution results against plan and success criteria',
      context: {
        task: args.task,
        plan: args.plan,
        executionResult: args.executionResult,
        qualityThreshold: args.qualityThreshold
      },
      instructions: [
        'Review all completed steps against plan',
        'Verify success criteria are met',
        'Run tests and check for failures',
        'Assess code quality and maintainability',
        'Check documentation completeness',
        'Evaluate against quality threshold',
        'Determine if issues are refinable or fatal',
        'Provide quality score (0.0-1.0)'
      ],
      outputFormat: 'JSON with passed, qualityScore, issues, refinable, recommendations'
    },
    outputSchema: {
      type: 'object',
      required: ['passed', 'qualityScore', 'refinable'],
      properties: {
        passed: { type: 'boolean' },
        qualityScore: { type: 'number', minimum: 0, maximum: 1 },
        issues: { type: 'array', items: { type: 'string' } },
        refinable: { type: 'boolean' },
        recommendations: { type: 'array', items: { type: 'string' } },
        testResults: {
          type: 'object',
          properties: {
            passed: { type: 'number' },
            failed: { type: 'number' },
            coverage: { type: 'number' }
          }
        }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'state-machine', 'validation']
}));

/**
 * Agent refinement task - Refines approach based on validation failures
 */
export const agentRefinementTask = defineTask('agent-refiner', (args, taskCtx) => ({
  kind: 'agent',
  title: `Refining: Attempt ${args.refinementAttempts}`,
  description: 'Analyze failures and create refined execution plan',

  agent: {
    name: 'state-machine-refiner',
    prompt: {
      role: 'senior technical lead and problem solver',
      task: 'Analyze validation failures and create refined execution strategy',
      context: {
        task: args.task,
        originalPlan: args.plan,
        validationResult: args.validationResult,
        errors: args.errors,
        refinementAttempts: args.refinementAttempts
      },
      instructions: [
        'Analyze all validation issues and errors',
        'Identify root causes of failures',
        'Review previous refinement attempts to avoid repetition',
        'Develop alternative approach or fixes',
        'Create refined execution plan',
        'Prioritize critical issues',
        'Document refinement strategy and rationale',
        'Assess likelihood of success with refined approach'
      ],
      outputFormat: 'JSON with refinedPlan, strategy, rootCauses, changes, successLikelihood'
    },
    outputSchema: {
      type: 'object',
      required: ['refinedPlan', 'strategy', 'rootCauses'],
      properties: {
        refinedPlan: {
          type: 'object',
          properties: {
            steps: { type: 'array' },
            confidence: { type: 'number' },
            successCriteria: { type: 'array' }
          }
        },
        strategy: { type: 'string' },
        rootCauses: { type: 'array', items: { type: 'string' } },
        changes: { type: 'array', items: { type: 'string' } },
        successLikelihood: { type: 'number', minimum: 0, maximum: 1 }
      }
    }
  },

  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`
  },

  labels: ['agent', 'state-machine', 'refinement', `attempt-${args.refinementAttempts}`]
}));
