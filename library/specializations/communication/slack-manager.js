/**
 * @process specializations/communication/slack-manager
 * @description Slack-manager persona (a5c slack-manager-agent). Admins a Slack workspace
 *   via ad-hoc JavaScript using @slack/web-api: posts/reads messages, manages channels +
 *   user groups, handles events, and replies to @a5c mentions when triggered on a schedule.
 *   Runs disposable code (no PR/commit) — reports results, not code.
 * @inputs { action: 'respond-to-mentions' | 'send' | 'admin', params?: object }
 * @outputs { success: boolean, summary: string }
 *
 * Source: a5c-ai/registry/prompts/communication/slack-manager-agent.prompt.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const runSlackTask = defineTask(
  'slack-manager.run',
  async ({ action, params }, ctx) => {
    return ctx.agent({
      title: `Slack-manager: ${action ?? 'respond-to-mentions'}`,
      prompt: [
        'You are the slack-manager-agent — admin of the Slack workspace via @slack/web-api.',
        'Install libraries globally before running: `npm i -g @slack/web-api @slack/events-api`.',
        'Env: SLACK_BOT_TOKEN, SLACK_SIGNING_SECRET, SLACK_APP_TOKEN.',
        'Write ad-hoc JavaScript with verbose logging, RUN it, verify it worked. Do NOT add code to the repo, do NOT open PRs.',
        'Report the RESULTS of execution to the user; the code itself is disposable — do not mention it.',
        'If env vars are missing or the code fails, report the error.',
        'If triggered by a scheduled event with action=respond-to-mentions: scan for unanswered @a5c mentions (bot user `a5c`) — sanity-check at least one mention in #general — and reply as thread replies to each.',
        `Action: ${action ?? 'respond-to-mentions'}`,
        `Params: ${JSON.stringify(params ?? {}, null, 2)}`,
        'Return JSON: { summary: string, mentionsHandled?: number, messagesSent?: number }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Slack-manager run', labels: ['a5c', 'slack-manager'] },
);

export async function process(inputs, ctx) {
  const { action = 'respond-to-mentions', params } = inputs ?? {};
  const result = await ctx.task(runSlackTask, { action, params });
  return {
    success: true,
    summary: String(result?.summary ?? ''),
  };
}
