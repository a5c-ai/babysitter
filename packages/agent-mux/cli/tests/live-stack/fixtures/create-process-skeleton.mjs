/**
 * @process processes/live-stack/odyssey-live-test
 * @description Write a summary of Homer's Odyssey, translate to Greek, combine into markdown.
 * @reference <FILL: list library process paths you referenced>
 * @inputs { traceId: string, outputDir: string }
 * @outputs { success: boolean, filePath: string, size: number }
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

// --- TASK DEFINITIONS ---
// Define at least 3 tasks using defineTask(). Each must return a task descriptor
// with { kind, title, ... } where kind is 'agent' or 'shell'.

// Example agent task:
// const myAgentTask = defineTask('my-task-id', (args) => ({
//   kind: 'agent',
//   title: 'Description of what this task does',
//   agent: { name: 'general-purpose', prompt: { role: '...', task: '...', outputFormat: 'JSON only' } },
// }));

// Example shell task:
// const myShellTask = defineTask('my-shell-task', (args, taskCtx) => ({
//   kind: 'shell',
//   title: 'Description',
//   shell: { command: 'node', args: ['-e', 'script here'], expectedExitCode: 0, timeout: 30000 },
// }));

// <FILL: Define your tasks here>

// --- PROCESS FUNCTION ---
// Must use ctx.task() for each step and ctx.parallel.all() for concurrent work.
// Must write the final markdown to <outputDir>/<traceId>-odyssey.md
// The document must have 12 paragraph headings and contain Greek characters.

export async function process(inputs, ctx) {
  const { traceId = 'unknown', outputDir = '.a5c-live-test' } = inputs ?? {};
  const filePath = `${outputDir}/${traceId}-odyssey.md`;

  // <FILL: Implement the process using ctx.task() and ctx.parallel.all()>
  // Requirements:
  // 1. Plan an outline (agent task)
  // 2. Write English paragraphs (agent tasks, can be parallel)
  // 3. Translate to Greek (agent tasks, can be parallel)
  // 4. Assemble into one markdown file (shell task)
  // 5. Verify the file has 12 headings and Greek characters (shell task)

  // Return the result
  return { success: true, filePath, size: 0 };
}
