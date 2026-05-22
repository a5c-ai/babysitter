/**
 * @module library/processes/shared/scene-context-builder
 * @description Assemble a "scene context" string for a subagent working on one
 *   task inside a multi-task plan. Answers four questions the subagent needs
 *   every time: where am I in the plan, who is running concurrently, what's
 *   next that I must NOT implement, and what did prior tasks already build.
 *
 *   Extracted from the `buildSceneContext` helper in
 *   joe-habu/superbabysitter/process/subagent-tdd-loop.js (lines 69-144).
 *
 * Usage:
 *
 * ```js
 * import { buildSceneContext } from '@a5c-ai/babysitter-library/processes/shared';
 *
 * const scene = buildSceneContext({
 *   task: plan.tasks[i],
 *   taskIndex: i,
 *   allTasks: plan.tasks,
 *   buildManifest,
 *   batchContext: null, // or { peerTasks, upcomingBatches, currentBatchIndex } in parallel mode
 * });
 * ```
 *
 * @param {object} args
 * @param {{name: string, context?: string}} args.task
 * @param {number} args.taskIndex - 0-based position of this task in allTasks
 * @param {Array<{name: string}>} args.allTasks
 * @param {Array<{taskNumber: number, taskName: string, summary?: string, filesChanged?: string[], decisions?: string[]}>} [args.buildManifest]
 * @param {null|{peerTasks: Array<{taskNumber:number, task:{name:string}}>, upcomingBatches: Array<Array<{taskNumber:number, task:{name:string}}>>, currentBatchIndex: number}} [args.batchContext]
 * @returns {string} markdown scene context
 *
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:code-review-practice, skill-area:e2e-testing]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development, topic:code-review-best-practices]
 *   roles: [role:backend-engineer, role:tech-lead, role:qa-engineer]
 */
export function buildSceneContext(args) {
  const { task, taskIndex, allTasks, buildManifest = [], batchContext = null } = args;
  const taskNumber = taskIndex + 1;
  const totalTasks = allTasks.length;
  const lines = [];

  lines.push('## Position in Plan');
  lines.push(`You are implementing Task ${taskNumber} of ${totalTasks}: "${task.name}"`);
  lines.push('');

  if (batchContext) {
    const peers = batchContext.peerTasks.filter((p) => p.taskNumber !== taskNumber);
    if (peers.length > 0) {
      lines.push('## Running Concurrently (do NOT modify their files)');
      for (const peer of peers) {
        lines.push(`- Task ${peer.taskNumber}: ${peer.task.name}`);
      }
      lines.push('');
    }
    if (batchContext.upcomingBatches && batchContext.upcomingBatches.length > 0) {
      lines.push('## Upcoming Batches (do NOT implement their work)');
      for (let b = 0; b < batchContext.upcomingBatches.length; b++) {
        const batchNum = batchContext.currentBatchIndex + b + 2;
        lines.push(`Batch ${batchNum}:`);
        for (const entry of batchContext.upcomingBatches[b]) {
          lines.push(`  - Task ${entry.taskNumber}: ${entry.task.name}`);
        }
      }
      lines.push('');
    }
  } else if (taskIndex < totalTasks - 1) {
    lines.push('## Upcoming Tasks (do NOT implement their work)');
    for (let i = taskIndex + 1; i < totalTasks; i++) {
      lines.push(`- Task ${i + 1}: ${allTasks[i].name}`);
    }
    lines.push('');
  }

  if (task.context) {
    lines.push('## Task-Specific Context');
    lines.push(task.context);
    lines.push('');
  }

  if (buildManifest && buildManifest.length > 0) {
    lines.push('## What Was Built (prior tasks in this run)');
    for (const entry of buildManifest) {
      lines.push(`### Task ${entry.taskNumber}: ${entry.taskName}`);
      if (entry.summary) lines.push(entry.summary);
      if (entry.filesChanged && entry.filesChanged.length > 0) {
        lines.push('Files changed:');
        for (const f of entry.filesChanged) lines.push(`- ${f}`);
      }
      if (entry.decisions && entry.decisions.length > 0) {
        lines.push('Architectural decisions:');
        for (const d of entry.decisions) lines.push(`- ${d}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}

/**
 * Append a finished task's result to a running build manifest. Pure -- does
 * not mutate the input.
 */
export function appendToManifest(manifest, taskNumber, taskName, implResult) {
  return [
    ...manifest,
    {
      taskNumber,
      taskName,
      filesChanged: implResult.filesChanged || [],
      decisions: implResult.architecturalDecisions || [],
      summary: implResult.summary || '',
    },
  ];
}
