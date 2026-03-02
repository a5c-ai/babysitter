/**
 * @process methodologies/superpowers/writing-plans
 * @description Writing Plans - Create detailed implementation plans with bite-sized TDD tasks, dependency tracking, and task persistence
 * @inputs { task: string, designDocPath?: string, techStack?: object, qualityThreshold?: number }
 * @outputs { success: boolean, planPath: string, tasks: array, dependencies: object, totalTasks: number, tasksJsonPath: string }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// ============================================================================
// AGENT TASK DEFINITIONS
// ============================================================================

const agentAnalyzeDesignTask = defineTask('plan-analyze-design', async (args, ctx) => {
  return { analysis: args };
}, {
  kind: 'agent',
  title: 'Analyze Design Document',
  labels: ['superpowers', 'writing-plans', 'analysis'],
  io: {
    inputs: { designDocPath: 'string', task: 'string' },
    outputs: { components: 'array', dependencies: 'object', techStack: 'object', scope: 'object' }
  }
});

const agentWriteTaskPlanTask = defineTask('plan-write-task', async (args, ctx) => {
  return { taskPlan: args };
}, {
  kind: 'agent',
  title: 'Write Detailed Task Plan',
  labels: ['superpowers', 'writing-plans', 'task-definition'],
  io: {
    inputs: { component: 'object', taskIndex: 'number', techStack: 'object', task: 'string' },
    outputs: {
      subject: 'string',
      files: 'object',
      steps: 'array',
      acceptanceCriteria: 'array',
      estimatedMinutes: 'number',
      blockedBy: 'array'
    }
  }
});

const agentWritePlanDocTask = defineTask('plan-write-document', async (args, ctx) => {
  return { doc: args };
}, {
  kind: 'agent',
  title: 'Write Plan Document',
  labels: ['superpowers', 'writing-plans', 'documentation'],
  io: {
    inputs: { task: 'string', tasks: 'array', techStack: 'object', architecture: 'string' },
    outputs: { planPath: 'string', content: 'string', committed: 'boolean' }
  }
});

const agentWriteTaskPersistenceTask = defineTask('plan-write-persistence', async (args, ctx) => {
  return { persistence: args };
}, {
  kind: 'agent',
  title: 'Write Task Persistence File',
  labels: ['superpowers', 'writing-plans', 'persistence'],
  io: {
    inputs: { planPath: 'string', tasks: 'array' },
    outputs: { tasksJsonPath: 'string', written: 'boolean' }
  }
});

// ============================================================================
// MAIN PROCESS
// ============================================================================

/**
 * Writing Plans Process
 *
 * Creates comprehensive implementation plans with:
 * - Bite-sized tasks (2-5 minutes each)
 * - TDD steps: write failing test -> verify fail -> implement -> verify pass -> commit
 * - Exact file paths, complete code, exact commands with expected output
 * - Task dependencies and blocking relationships
 * - Persistent task tracking via .tasks.json
 *
 * Plan Header Format:
 *   # [Feature Name] Implementation Plan
 *   > **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan
 *   **Goal:** [One sentence]
 *   **Architecture:** [2-3 sentences]
 *   **Tech Stack:** [Key technologies]
 *
 * Each Task Format:
 *   ### Task N: [Component Name]
 *   **Files:** Create/Modify/Test paths
 *   **Step 1:** Write failing test (with code)
 *   **Step 2:** Run test to verify it fails (with command + expected output)
 *   **Step 3:** Write minimal implementation (with code)
 *   **Step 4:** Run test to verify it passes (with command + expected output)
 *   **Step 5:** Commit (with exact git commands)
 *
 * Attribution: Adapted from https://github.com/pcvelz/superpowers
 *
 * @param {Object} inputs - Process inputs
 * @param {string} inputs.task - Feature/task to plan
 * @param {string} inputs.designDocPath - Path to approved design document
 * @param {Object} inputs.techStack - Technology stack details
 * @param {number} inputs.qualityThreshold - Quality threshold (default: 80)
 * @param {Object} ctx - Process context
 * @returns {Promise<Object>} Plan with tasks, dependencies, and persistence
 */
export async function process(inputs, ctx) {
  const {
    task,
    designDocPath = null,
    techStack = {},
    qualityThreshold = 80
  } = inputs;

  ctx.log('Starting Writing Plans process', { task });

  // ============================================================================
  // STEP 1: ANALYZE DESIGN
  // ============================================================================

  ctx.log('Step 1: Analyzing design document and identifying components');

  const analysisResult = await ctx.task(agentAnalyzeDesignTask, {
    designDocPath,
    task
  });

  const components = analysisResult.components || [];

  // ============================================================================
  // STEP 2: WRITE DETAILED TASKS (Bite-Sized, TDD)
  // ============================================================================

  ctx.log('Step 2: Writing detailed task plans', { componentCount: components.length });

  const taskPlans = [];

  for (let i = 0; i < components.length; i++) {
    const component = components[i];

    const taskPlan = await ctx.task(agentWriteTaskPlanTask, {
      component,
      taskIndex: i,
      techStack: techStack || analysisResult.techStack,
      task
    });

    taskPlans.push({
      id: i,
      subject: taskPlan.subject,
      files: taskPlan.files,
      steps: taskPlan.steps,
      acceptanceCriteria: taskPlan.acceptanceCriteria,
      estimatedMinutes: taskPlan.estimatedMinutes,
      blockedBy: taskPlan.blockedBy || [],
      status: 'pending'
    });
  }

  // ============================================================================
  // STEP 3: WRITE PLAN DOCUMENT
  // ============================================================================

  ctx.log('Step 3: Writing plan document');

  const planDoc = await ctx.task(agentWritePlanDocTask, {
    task,
    tasks: taskPlans,
    techStack: techStack || analysisResult.techStack,
    architecture: analysisResult.scope ? analysisResult.scope.architecture : ''
  });

  // ============================================================================
  // STEP 4: WRITE TASK PERSISTENCE
  // ============================================================================

  ctx.log('Step 4: Writing task persistence file');

  const persistenceResult = await ctx.task(agentWriteTaskPersistenceTask, {
    planPath: planDoc.planPath,
    tasks: taskPlans
  });

  // ============================================================================
  // STEP 5: HUMAN REVIEW AND EXECUTION CHOICE
  // ============================================================================

  await ctx.breakpoint({
    question: `Plan complete with ${taskPlans.length} tasks saved to ${planDoc.planPath}. How would you like to execute?\n\n1. **Subagent-Driven (this session)** - Fresh subagent per task, two-stage review (spec compliance then code quality)\n2. **Batch Execution (separate session)** - Execute in batches of 3 with human checkpoints between batches`,
    title: 'Plan Review and Execution Choice',
    context: {
      runId: ctx.runId,
      files: [
        { path: planDoc.planPath, format: 'markdown', label: 'Implementation Plan' },
        { path: persistenceResult.tasksJsonPath, format: 'json', label: 'Task Persistence' }
      ]
    }
  });

  const totalEstimatedMinutes = taskPlans.reduce((sum, t) => sum + (t.estimatedMinutes || 5), 0);

  return {
    success: true,
    task,
    planPath: planDoc.planPath,
    tasks: taskPlans,
    dependencies: analysisResult.dependencies || {},
    totalTasks: taskPlans.length,
    tasksJsonPath: persistenceResult.tasksJsonPath,
    totalEstimatedMinutes,
    metadata: {
      processId: 'methodologies/superpowers/writing-plans',
      attribution: 'https://github.com/pcvelz/superpowers',
      timestamp: ctx.now()
    }
  };
}
