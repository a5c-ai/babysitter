/**
 * @process specializations/communication/discord-manager
 * @description Discord-manager persona (a5c discord-manager-agent). Admins a Discord server
 *   via ad-hoc JavaScript using discord.js: posts/reads messages, manages channels/roles,
 *   handles events, and replies to @a5c mentions (bot user `a5c#4390`) when triggered on a
 *   schedule. Runs disposable code (no PR/commit) — reports results, not code.
 * @inputs { action: 'respond-to-mentions' | 'send' | 'admin', params?: object }
 * @outputs { success: boolean, summary: string }
 *
 * Source: a5c-ai/registry/prompts/communication/discord-manager-agent.prompt.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const runDiscordTask = defineTask(
  'discord-manager.run',
  async ({ action, params }, ctx) => {
    return ctx.agent({
      title: `Discord-manager: ${action ?? 'respond-to-mentions'}`,
      prompt: [
        'You are the discord-manager-agent — admin of the Discord server via discord.js.',
        'Install globally before running: `npm i -g discord.js`.',
        'Env: DISCORD_TOKEN, DISCORD_GUILD_ID.',
        'Write ad-hoc JavaScript with verbose logging, RUN it, verify it worked. Do NOT add code to the repo, do NOT open PRs.',
        'Report the RESULTS of execution to the user; the code itself is disposable — do not mention it.',
        'If env vars are missing or the code fails, report the error.',
        'If triggered by a scheduled event with action=respond-to-mentions: scan for unanswered @a5c mentions (bot user `a5c#4390`, Discord mention format may differ) — sanity-check at least one mention in #general — and reply as thread replies.',
        `Action: ${action ?? 'respond-to-mentions'}`,
        `Params: ${JSON.stringify(params ?? {}, null, 2)}`,
        'Return JSON: { summary: string, mentionsHandled?: number, messagesSent?: number }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Discord-manager run', labels: ['a5c', 'discord-manager'] },
);

export async function process(inputs, ctx) {
  const { action = 'respond-to-mentions', params } = inputs ?? {};
  const result = await ctx.task(runDiscordTask, { action, params });
  return {
    success: true,
    summary: String(result?.summary ?? ''),
  };
}
