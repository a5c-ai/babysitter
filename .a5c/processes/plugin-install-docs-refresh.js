/**
 * @process repo/plugin-install-docs-refresh
 * @description Documentation maintenance process for refreshing Babysitter plugin installation instructions.
 * @inputs { issueNumber?: number, workspace?: string }
 * @outputs { success, phases, summary }
 *
 * This process intentionally uses agent tasks for research, editing, and review
 * to follow the repository override that direct babysitter:call processes should
 * not define shell-kind subtasks unless a shell-oriented workflow is explicitly requested.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const researchInstallBehaviorTask = defineTask(
  'plugin-install-docs.research-install-behavior',
  async ({ issueNumber }, ctx) => {
    return ctx.agent({
      title: 'Research plugin installation behavior',
      prompt: [
        'Research the requested Babysitter plugin installation documentation refresh.',
        `Issue: #${issueNumber ?? 'unspecified'}`,
        'Inspect the SDK harness installer implementation and tests that assert install commands.',
        'Inspect per-harness Babysitter plugin README files for stale instructions.',
        'Return JSON: { canonicalCommands: object, staleDocs: string[], recommendations: string[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Research plugin install behavior', labels: ['docs', 'plugins', 'install'] },
);

const updateInstallDocsTask = defineTask(
  'plugin-install-docs.update-docs',
  async ({ research }, ctx) => {
    return ctx.agent({
      title: 'Update plugin installation documentation',
      prompt: [
        'Update the repository documentation so Babysitter plugin READMEs use the canonical install flows.',
        'Use the SDK helper as the primary documented path: babysitter harness:install-plugin <harness> [--workspace <dir>].',
        'Where direct package commands are documented, align them with installer behavior: npx --yes @a5c-ai/babysitter-<target> install --global or --workspace <dir>.',
        'Keep native marketplace/package-manager flows only when they are truly harness-native and label them accordingly.',
        'Research summary:',
        JSON.stringify(research ?? {}, null, 2),
        'Return JSON: { changedFiles: string[], summary: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Update plugin install docs', labels: ['docs', 'plugins', 'install'] },
);

const reviewDocsTask = defineTask(
  'plugin-install-docs.review-docs',
  async ({ changedFiles, research }, ctx) => {
    return ctx.agent({
      title: 'Review refreshed installation docs',
      prompt: [
        'Review the refreshed plugin installation docs for consistency with the SDK installer tests and implementation.',
        `Changed files: ${JSON.stringify(changedFiles ?? [])}`,
        'Check that each supported plugin target has a primary SDK helper command and workspace variant where applicable.',
        'Check that stale global SDK-only instructions are replaced or clearly marked as optional CLI setup.',
        'Research summary:',
        JSON.stringify(research ?? {}, null, 2),
        'Return JSON: { approved: boolean, issues: string[], suggestions: string[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Review plugin install docs', labels: ['docs', 'plugins', 'review'] },
);

export async function process(inputs, ctx) {
  const research = await ctx.task(researchInstallBehaviorTask, {
    issueNumber: inputs?.issueNumber,
  });

  const update = await ctx.task(updateInstallDocsTask, { research });
  const review = await ctx.task(reviewDocsTask, {
    changedFiles: update?.changedFiles ?? [],
    research,
  });

  return {
    success: review?.approved !== false,
    phases: ['research', 'update-docs', 'review'],
    summary: update?.summary ?? 'Updated Babysitter plugin installation documentation.',
    changedFiles: update?.changedFiles ?? [],
    review,
  };
}
