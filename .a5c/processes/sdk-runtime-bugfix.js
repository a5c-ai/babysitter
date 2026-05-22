/**
 * @process repo/sdk-runtime-bugfix
 * @description Repository workflow for fixing SDK runtime bugs with research, implementation, and review phases.
 * @inputs { issueNumber?: number, title?: string, summary?: string, targetFiles?: string[] }
 * @outputs { success, phases, summary, changedFiles, review }
 *
 * This process uses agent tasks rather than shell tasks to respect the repository
 * process-authoring override for direct Babysitter workflows.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const researchRuntimeBugTask = defineTask(
  'sdk-runtime-bugfix.research-runtime-bug',
  async ({ issueNumber, title, summary, targetFiles }) => ({
    kind: 'agent',
    title: 'Research SDK runtime bug',
    labels: ['sdk', 'runtime', 'bugfix', 'research'],
    agent: {
      name: 'sdk-runtime-researcher',
      prompt: {
        role: 'senior SDK runtime engineer',
        task: 'Research the requested Babysitter SDK runtime bug fix.',
        instructions: [
        'Research the requested Babysitter SDK runtime bug fix.',
        `Issue: #${issueNumber ?? 'unspecified'}`,
        `Title: ${title ?? 'unspecified'}`,
        `Summary: ${summary ?? 'unspecified'}`,
        `Likely target files: ${JSON.stringify(targetFiles ?? [])}`,
        'Inspect the runtime code, replay behavior, existing tests, and public SDK types before proposing changes.',
        'Return JSON: { rootCause: string, affectedFiles: string[], proposedFix: string, testPlan: string[] }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Research SDK runtime bug', labels: ['sdk', 'runtime', 'bugfix', 'research'] },
);

const implementRuntimeBugfixTask = defineTask(
  'sdk-runtime-bugfix.implement-runtime-fix',
  async ({ research }) => ({
    kind: 'agent',
    title: 'Implement SDK runtime bug fix',
    labels: ['sdk', 'runtime', 'bugfix', 'implementation'],
    agent: {
      name: 'sdk-runtime-implementer',
      prompt: {
        role: 'senior SDK runtime engineer',
        task: 'Implement the SDK runtime bug fix using the research context.',
        instructions: [
        'Implement the SDK runtime bug fix using the research below.',
        'Keep the change focused, preserve existing public API behavior unless the issue requires otherwise, and add regression tests near related runtime tests.',
        'Research summary:',
        JSON.stringify(research ?? {}, null, 2),
        'Return JSON: { changedFiles: string[], summary: string, testsAdded: string[] }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Implement SDK runtime fix', labels: ['sdk', 'runtime', 'bugfix', 'implementation'] },
);

const reviewRuntimeBugfixTask = defineTask(
  'sdk-runtime-bugfix.review-runtime-fix',
  async ({ implementation, research }) => ({
    kind: 'agent',
    title: 'Review SDK runtime bug fix',
    labels: ['sdk', 'runtime', 'bugfix', 'review'],
    agent: {
      name: 'sdk-runtime-reviewer',
      prompt: {
        role: 'senior SDK runtime reviewer',
        task: 'Review the SDK runtime bug fix.',
        instructions: [
        'Review the SDK runtime bug fix for replay determinism, TypeScript correctness, compatibility, and test coverage.',
        'Implementation summary:',
        JSON.stringify(implementation ?? {}, null, 2),
        'Research summary:',
        JSON.stringify(research ?? {}, null, 2),
        'Return JSON: { approved: boolean, issues: string[], suggestions: string[] }.',
        ],
      },
    },
  }),
  { kind: 'agent', title: 'Review SDK runtime fix', labels: ['sdk', 'runtime', 'bugfix', 'review'] },
);

export async function process(inputs, ctx) {
  const research = await ctx.task(researchRuntimeBugTask, {
    issueNumber: inputs?.issueNumber,
    title: inputs?.title,
    summary: inputs?.summary,
    targetFiles: inputs?.targetFiles ?? [],
  }, { key: 'sdk-runtime-bugfix.research' });

  const implementation = await ctx.task(implementRuntimeBugfixTask, { research }, {
    key: 'sdk-runtime-bugfix.implementation',
  });
  const review = await ctx.task(reviewRuntimeBugfixTask, { implementation, research }, {
    key: 'sdk-runtime-bugfix.review',
  });

  return {
    success: review?.approved !== false,
    phases: ['research', 'implementation', 'review'],
    summary: implementation?.summary ?? 'Implemented SDK runtime bug fix.',
    changedFiles: implementation?.changedFiles ?? [],
    review,
  };
}
