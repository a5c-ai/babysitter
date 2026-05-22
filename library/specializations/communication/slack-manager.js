/**
 * @process specializations/communication/slack-manager
 * @description Slack-manager persona. Scan channels/unanswered-mentions → classify each
 *   (respond | moderate | escalate | notify) → draft per-mention response in parallel →
 *   send via @slack/web-api ad-hoc code → report results. Never commits code to repo.
 * @inputs { trigger?: "scheduled"|"mention"|"command", channelId?: string, limit?: number }
 * @outputs { success, mentionsFound, responded, moderated, escalated }
 *
 * Source: https://raw.githubusercontent.com/a5c-ai/registry/main/prompts/communication/slack-manager-agent.prompt.md
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:communication]
 *   skillAreas: [skill-area:api-clients-sdks, skill-area:community-management]
 *   topics: [topic:developer-experience]
 *   workflows: [workflow:post-mortem-review]
 *   roles: [role:platform-engineer, role:engineering-manager, role:tech-lead]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const channelScanTask = defineTask(
  'slack-manager.channel-scan',
  async ({ trigger, channelId, limit }, ctx) => {
    return ctx.agent({
      title: 'Slack-manager: scan channels for unanswered @a5c mentions',
      prompt: [
        'Using @slack/web-api (env: SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, SLACK_APP_TOKEN), run ad-hoc JS to find',
        'all unanswered @a5c mentions. The bot user is a5c. If triggered="scheduled", scan workspace-wide.',
        'If channelId is provided, scope to that channel. Assume at least one mention exists in #general (sanity check).',
        `Trigger: ${trigger ?? 'scheduled'}`,
        `Channel: ${channelId ?? '(all)'}`,
        `Limit: ${limit ?? 50}`,
        'Report results only — do not commit code.',
        'Return JSON: { mentions: Array<{ channel, ts, user, text, threadTs? }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Slack channel scan', labels: ['a5c', 'slack-manager'] },
);

const classifyMentionTask = defineTask(
  'slack-manager.classify-mention',
  async ({ mention }, ctx) => {
    return ctx.agent({
      title: `Slack-manager: classify mention in ${mention.channel}`,
      prompt: [
        'Classify this mention: respond | moderate | escalate | notify.',
        '  respond: answerable from public info or workspace knowledge.',
        '  moderate: violates conduct; remove and warn.',
        '  escalate: needs a human admin.',
        '  notify: should surface to another agent/channel.',
        `Mention: ${JSON.stringify(mention, null, 2)}`,
        'Return JSON: { action: "respond"|"moderate"|"escalate"|"notify", rationale: string, draftReply?: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Slack classify mention', labels: ['a5c', 'slack-manager'] },
);

const executeActionTask = defineTask(
  'slack-manager.execute-action',
  async ({ mention, classification }, ctx) => {
    return ctx.agent({
      title: `Slack-manager: ${classification?.action ?? 'notify'} in ${mention.channel}`,
      prompt: [
        'Execute the classified action via ad-hoc @slack/web-api code. Reply as a thread reply to the original message.',
        'For "moderate": remove offending message (if policy allows) and DM the user.',
        'For "escalate": post in #admin channel tagging the humans and leave a thread holding-reply.',
        'For "notify": forward context to the relevant channel/agent.',
        'Verbose logging; report results, not the code.',
        `Mention: ${JSON.stringify(mention, null, 2)}`,
        `Classification: ${JSON.stringify(classification, null, 2)}`,
        'Return JSON: { success: boolean, action: string, note?: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Slack execute action', labels: ['a5c', 'slack-manager'] },
);

const reportTask = defineTask(
  'slack-manager.report',
  async ({ results }, ctx) => {
    return ctx.agent({
      title: 'Slack-manager: summary report',
      prompt: [
        'Summarise outcomes by action type; list any failures with reasons.',
        `Results: ${JSON.stringify(results, null, 2)}`,
        'Return JSON: { responded: number, moderated: number, escalated: number, failures: string[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Slack report', labels: ['a5c', 'slack-manager'] },
);

export async function process(inputs, ctx) {
  const { trigger = 'scheduled', channelId, limit = 50 } = inputs ?? {};
  const scan = await ctx.task(channelScanTask, { trigger, channelId, limit });
  const mentions = Array.isArray(scan?.mentions) ? scan.mentions : [];
  if (mentions.length === 0) {
    return { success: true, mentionsFound: 0, responded: 0, moderated: 0, escalated: 0 };
  }

  const classifications = await ctx.parallel.map(mentions, (mention) =>
    ctx.task(classifyMentionTask, { mention }),
  );

  const actionResults = await ctx.parallel.map(mentions, (mention, i) =>
    ctx.task(executeActionTask, { mention, classification: classifications[i] ?? { action: 'notify' } }),
  );

  const rep = await ctx.task(reportTask, { results: actionResults });
  return {
    success: true,
    mentionsFound: mentions.length,
    responded: Number(rep?.responded ?? 0),
    moderated: Number(rep?.moderated ?? 0),
    escalated: Number(rep?.escalated ?? 0),
  };
}
