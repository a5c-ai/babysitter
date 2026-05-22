/**
 * @process processes/shared/communication/single-channel-communication
 * @description Enforce single-channel communication per task — no cross-posting; migrate with one pointer.
 * @inputs { taskTopic: string, availableChannels: Array<string>, activeChannel?: string }
 * @outputs { success: boolean, chosenChannel: string, rules: object }
 *
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:code-review-practice, skill-area:e2e-testing]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development, topic:code-review-best-practices]
 *   roles: [role:backend-engineer, role:tech-lead, role:qa-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const applyRuleTask = defineTask(
  'single-channel.apply',
  async ({ taskTopic, availableChannels, activeChannel }, ctx) => {
    return ctx.agent({
      title: 'Apply single-channel communication rule',
      prompt: [
        `For the task "${taskTopic}", pick one channel and stay there.`,
        `Available channels: ${availableChannels.join(', ')}.`,
        activeChannel ? `Current active channel: ${activeChannel}.` : '',
        'Rules: no cross-posting. If migration is required, leave one pointer comment in the old channel and continue in the new one.',
        'Return JSON: { chosenChannel, migration?: { from, to, pointerComment } }.',
      ].filter(Boolean).join('\n\n'),
    });
  },
  { kind: 'agent', title: 'Apply single-channel rule', labels: ['communication'] },
);

export async function process(inputs, ctx) {
  const { taskTopic, availableChannels = [], activeChannel } = inputs;
  const result = await ctx.task(applyRuleTask, { taskTopic, availableChannels, activeChannel });
  return {
    success: true,
    chosenChannel: result.chosenChannel ?? activeChannel ?? availableChannels[0],
    rules: {
      noCrossPosting: true,
      migrationPolicy: 'one-pointer-comment',
    },
    migration: result.migration,
  };
}
