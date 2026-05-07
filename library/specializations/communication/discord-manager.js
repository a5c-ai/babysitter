/**
 * @process specializations/communication/discord-manager
 * @description Discord-manager persona. Scan server/unanswered-mentions → classify each
 *   (respond | moderate | escalate | notify) → draft and execute per-mention action in
 *   parallel via discord.js → report results. Never commits code to repo.
 * @inputs { trigger?: "scheduled"|"mention"|"command", channelId?: string, limit?: number }
 * @outputs { success, mentionsFound, responded, moderated, escalated }
 *
 * Source: https://raw.githubusercontent.com/a5c-ai/registry/main/prompts/communication/discord-manager-agent.prompt.md
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:communication]
 *   skillAreas: [skill-area:api-clients-sdks, skill-area:community-management]
 *   topics: [topic:developer-experience]
 *   workflows: [workflow:post-mortem-review]
 *   roles: [role:platform-engineer, role:engineering-manager, role:tech-lead]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const serverScanTask = defineTask(
  'discord-manager.server-scan',
  async ({ trigger, channelId, limit }, ctx) => {
    return ctx.agent({
      title: 'Discord-manager: scan server for unanswered @a5c mentions',
      prompt: [
        'Using discord.js (env: DISCORD_TOKEN, DISCORD_GUILD_ID), run ad-hoc JS to find unanswered mentions of bot a5c#4390.',
        'Discord\'s mention format is <@userId> rather than @a5c literal — detect by userId.',
        'If triggered="scheduled", scan guild-wide. If channelId provided, scope to that channel.',
        'Assume at least one mention exists in #general (sanity check).',
        `Trigger: ${trigger ?? 'scheduled'}`,
        `Channel: ${channelId ?? '(all)'}`,
        `Limit: ${limit ?? 50}`,
        'Report results only — do not commit code.',
        'Return JSON: { mentions: Array<{ channelId, messageId, userId, content, threadId? }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Discord server scan', labels: ['a5c', 'discord-manager'] },
);

const classifyMentionTask = defineTask(
  'discord-manager.classify-mention',
  async ({ mention }, ctx) => {
    return ctx.agent({
      title: `Discord-manager: classify mention in ${mention.channelId}`,
      prompt: [
        'Classify this mention: respond | moderate | escalate | notify.',
        `Mention: ${JSON.stringify(mention, null, 2)}`,
        'Return JSON: { action: "respond"|"moderate"|"escalate"|"notify", rationale: string, draftReply?: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Discord classify mention', labels: ['a5c', 'discord-manager'] },
);

const executeActionTask = defineTask(
  'discord-manager.execute-action',
  async ({ mention, classification }, ctx) => {
    return ctx.agent({
      title: `Discord-manager: ${classification?.action ?? 'notify'} in ${mention.channelId}`,
      prompt: [
        'Execute via ad-hoc discord.js code. Reply as a thread/reply to the source message.',
        'For moderate: remove offending message (if role permits) + DM user. For escalate: post in #admin tagging humans.',
        'For notify: forward to relevant channel/agent.',
        `Mention: ${JSON.stringify(mention, null, 2)}`,
        `Classification: ${JSON.stringify(classification, null, 2)}`,
        'Return JSON: { success: boolean, action: string, note?: string }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Discord execute action', labels: ['a5c', 'discord-manager'] },
);

const reportTask = defineTask(
  'discord-manager.report',
  async ({ results }, ctx) => {
    return ctx.agent({
      title: 'Discord-manager: summary report',
      prompt: [
        'Summarise outcomes by action type; list failures with reasons.',
        `Results: ${JSON.stringify(results, null, 2)}`,
        'Return JSON: { responded: number, moderated: number, escalated: number, failures: string[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Discord report', labels: ['a5c', 'discord-manager'] },
);

export async function process(inputs, ctx) {
  const { trigger = 'scheduled', channelId, limit = 50 } = inputs ?? {};
  const scan = await ctx.task(serverScanTask, { trigger, channelId, limit });
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
