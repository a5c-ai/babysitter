/**
 * @process specializations/game-development/sprint-planning-games
 * @description Sprint Planning for Game Teams - Adapt Agile/Scrum methodology for game development team structure
 * with cross-discipline coordination, playable build goals, and game-specific estimation techniques.
 * @inputs { projectName: string, sprintNumber?: number, sprintGoal?: string, teamCapacity?: object, outputDir?: string }
 * @outputs { success: boolean, sprintPlan: object, taskAssignments: array, dependencies: array, artifacts: array }
 *
 * @example
 * const result = await orchestrate('specializations/game-development/sprint-planning-games', {
 *   projectName: 'Stellar Odyssey',
 *   sprintNumber: 12,
 *   sprintGoal: 'Complete combat system iteration',
 *   teamCapacity: { design: 40, engineering: 80, art: 60, audio: 20 }
 * });
 *
 * @references
 * - Agile Game Development with Scrum by Clinton Keith
 * - Scrum: The Art of Doing Twice the Work in Half the Time
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    projectName,
    sprintNumber = 1,
    sprintGoal = '',
    sprintDuration = '2 weeks',
    teamCapacity = {},
    backlogItems = [],
    milestoneTarget = '',
    outputDir = 'sprint-planning-output'
  } = inputs;

  const startTime = ctx.now();
  const artifacts = [];

  ctx.log('info', `Starting Sprint Planning: ${projectName} Sprint ${sprintNumber}`);

  // Phase 1: Backlog Grooming
  const backlogGrooming = await ctx.task(backlogGroomingTask, {
    projectName, sprintNumber, backlogItems, milestoneTarget, outputDir
  });
  artifacts.push(...backlogGrooming.artifacts);

  // Phase 2: Sprint Goal Definition
  const goalDefinition = await ctx.task(sprintGoalTask, {
    projectName, sprintNumber, sprintGoal, backlogGrooming, milestoneTarget, outputDir
  });
  artifacts.push(...goalDefinition.artifacts);

  // Phase 3: Capacity Planning
  const capacityPlanning = await ctx.task(capacityPlanningTask, {
    projectName, teamCapacity, sprintDuration, outputDir
  });
  artifacts.push(...capacityPlanning.artifacts);

  // Phase 4: Task Breakdown
  const taskBreakdown = await ctx.task(taskBreakdownTask, {
    projectName, goalDefinition, backlogGrooming, capacityPlanning, outputDir
  });
  artifacts.push(...taskBreakdown.artifacts);

  // Phase 5: Dependency Planning
  const dependencyPlanning = await ctx.task(sprintDependencyTask, {
    projectName, taskBreakdown, outputDir
  });
  artifacts.push(...dependencyPlanning.artifacts);

  // Phase 6: Task Assignment
  const taskAssignment = await ctx.task(taskAssignmentTask, {
    projectName, taskBreakdown, capacityPlanning, dependencyPlanning, outputDir
  });
  artifacts.push(...taskAssignment.artifacts);

  await ctx.breakpoint({
    question: `Sprint ${sprintNumber} planning complete for ${projectName}. ${taskAssignment.totalTasks} tasks, ${taskAssignment.totalPoints} story points. Capacity utilization: ${capacityPlanning.utilizationPercent}%. Confirm sprint plan?`,
    title: 'Sprint Planning Review',
    context: { runId: ctx.runId, sprintGoal: goalDefinition.sprintGoal, taskAssignment }
  });

  // Phase 7: Sprint Documentation
  const sprintDoc = await ctx.task(sprintDocumentationTask, {
    projectName, sprintNumber, goalDefinition, taskAssignment, dependencyPlanning, outputDir
  });
  artifacts.push(...sprintDoc.artifacts);

  return {
    success: true,
    projectName,
    sprintNumber,
    sprintPlan: { goal: goalDefinition.sprintGoal, duration: sprintDuration, totalPoints: taskAssignment.totalPoints },
    taskAssignments: taskAssignment.assignments,
    dependencies: dependencyPlanning.dependencies,
    artifacts,
    duration: ctx.now() - startTime,
    metadata: { processId: 'specializations/game-development/sprint-planning-games', timestamp: startTime, outputDir }
  };
}

export const backlogGroomingTask = defineTask('backlog-grooming', (args, taskCtx) => ({
  kind: 'agent',
  title: `Backlog Grooming - Sprint ${args.sprintNumber}`,
  agent: {
    name: 'game-producer-agent',
    prompt: { role: 'Product Owner', task: 'Groom and prioritize backlog items', context: args, instructions: ['1. Review and update backlog items', '2. Prioritize by milestone alignment', '3. Ensure items are ready for sprint', '4. Estimate remaining items'] },
    outputSchema: { type: 'object', required: ['readyItems', 'estimatedItems', 'artifacts'], properties: { readyItems: { type: 'array' }, estimatedItems: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'sprint-planning', 'backlog']
}));

export const sprintGoalTask = defineTask('sprint-goal', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sprint Goal Definition - Sprint ${args.sprintNumber}`,
  agent: {
    name: 'game-producer-agent',
    prompt: { role: 'Scrum Master', task: 'Define clear sprint goal', context: args, instructions: ['1. Align goal with milestone', '2. Ensure goal is achievable', '3. Define playable deliverable', '4. Get team buy-in'] },
    outputSchema: { type: 'object', required: ['sprintGoal', 'deliverables', 'artifacts'], properties: { sprintGoal: { type: 'string' }, deliverables: { type: 'array' }, successCriteria: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'sprint-planning', 'goal']
}));

export const capacityPlanningTask = defineTask('capacity-planning', (args, taskCtx) => ({
  kind: 'agent',
  title: `Capacity Planning - ${args.projectName}`,
  agent: {
    name: 'scrum-master-games-agent',
    prompt: { role: 'Project Manager', task: 'Calculate team capacity', context: args, instructions: ['1. Calculate available hours by discipline', '2. Account for meetings and overhead', '3. Factor in PTO and holidays', '4. Determine story point capacity'] },
    outputSchema: { type: 'object', required: ['totalCapacity', 'utilizationPercent', 'artifacts'], properties: { totalCapacity: { type: 'object' }, utilizationPercent: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'sprint-planning', 'capacity']
}));

export const taskBreakdownTask = defineTask('task-breakdown', (args, taskCtx) => ({
  kind: 'agent',
  title: `Task Breakdown - ${args.projectName}`,
  agent: {
    name: 'game-designer-agent',
    prompt: { role: 'Team Lead', task: 'Break down stories into tasks', context: args, instructions: ['1. Break features into discipline tasks', '2. Estimate task hours/points', '3. Identify cross-discipline work', '4. Define acceptance criteria'] },
    outputSchema: { type: 'object', required: ['tasks', 'totalPoints', 'artifacts'], properties: { tasks: { type: 'array' }, totalPoints: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'sprint-planning', 'tasks']
}));

export const sprintDependencyTask = defineTask('sprint-dependency', (args, taskCtx) => ({
  kind: 'agent',
  title: `Dependency Planning - ${args.projectName}`,
  agent: {
    name: 'scrum-master-games-agent',
    prompt: { role: 'Project Manager', task: 'Map task dependencies', context: args, instructions: ['1. Identify task dependencies', '2. Plan handoff points', '3. Identify blockers', '4. Schedule integration points'] },
    outputSchema: { type: 'object', required: ['dependencies', 'blockers', 'artifacts'], properties: { dependencies: { type: 'array' }, blockers: { type: 'array' }, integrationPoints: { type: 'array' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'sprint-planning', 'dependencies']
}));

export const taskAssignmentTask = defineTask('task-assignment', (args, taskCtx) => ({
  kind: 'agent',
  title: `Task Assignment - ${args.projectName}`,
  agent: {
    name: 'scrum-master-games-agent',
    prompt: { role: 'Scrum Master', task: 'Assign tasks to team members', context: args, instructions: ['1. Match tasks to skills', '2. Balance workload', '3. Respect dependencies', '4. Verify capacity alignment'] },
    outputSchema: { type: 'object', required: ['assignments', 'totalTasks', 'totalPoints', 'artifacts'], properties: { assignments: { type: 'array' }, totalTasks: { type: 'number' }, totalPoints: { type: 'number' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'sprint-planning', 'assignment']
}));

export const sprintDocumentationTask = defineTask('sprint-documentation', (args, taskCtx) => ({
  kind: 'agent',
  title: `Sprint Documentation - Sprint ${args.sprintNumber}`,
  agent: {
    name: 'technical-documentation-agent',
    prompt: { role: 'Technical Writer', task: 'Document sprint plan', context: args, instructions: ['1. Document sprint goal', '2. List all tasks and assignments', '3. Document dependencies', '4. Create sprint board setup'] },
    outputSchema: { type: 'object', required: ['sprintDocPath', 'artifacts'], properties: { sprintDocPath: { type: 'string' }, artifacts: { type: 'array' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['game-development', 'sprint-planning', 'documentation']
}));
