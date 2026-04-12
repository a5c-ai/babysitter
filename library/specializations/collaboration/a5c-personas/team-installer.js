/**
 * @process specializations/collaboration/a5c-personas/team-installer
 * @description Team-installer persona (a5c team-installer-agent). Bootstraps an existing
 *   repo to use A5C: analyzes stack, discovers relevant registry agents, populates
 *   `.a5c/config.yml` under `remote_agents.sources.individual`, and opens a producer-agent
 *   issue to "produce the project".
 * @inputs { adHocAgents?: string[] }
 * @outputs { success: boolean, agentsInstalled: string[], issueNumber?: number }
 *
 * Source: a5c-ai/registry/prompts/development/team-installer-agent.prompt.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const analyzeTask = defineTask(
  'team-installer.analyze-repo',
  async (_args, ctx) => {
    return ctx.agent({
      title: 'Team-installer: analyze repo + discover registry agents',
      prompt: [
        'You are the team-installer-agent.',
        'Step 1: Read any existing `.a5c/config.yml` and note current agents.',
        'Step 2: Analyze repo files, README, package manifests, and tech stack to determine project scope.',
        'Step 3: Clone/browse https://github.com/a5c-ai/registry (public) and list candidate agents.',
        'Return JSON: { stack: object, currentAgents: string[], candidates: Array<{ name, reason, uri }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Team-installer analyze repo', labels: ['a5c', 'team-installer'] },
);

const installTask = defineTask(
  'team-installer.install-agents',
  async ({ selected, adHocAgents }, ctx) => {
    return ctx.agent({
      title: `Team-installer: install ${selected?.length ?? 0} agent(s) into .a5c/config.yml`,
      prompt: [
        'You are the team-installer-agent. Update or create `.a5c/config.yml` with the selected remote agents.',
        'Schema:',
        'remote_agents:',
        '  enabled: true',
        '  cache_timeout: 120',
        '  retry_attempts: 5',
        '  retry_delay: 2000',
        '  sources:',
        '    individual:',
        '      - uri: "https://raw.githubusercontent.com/a5c-ai/registry/main/agents/<cat>/<name>.agent.md"',
        '        alias: "<name>"',
        `Selected: ${JSON.stringify(selected ?? [], null, 2)}`,
        `Ad-hoc extras requested: ${JSON.stringify(adHocAgents ?? [])}`,
        'Use a branch named `feature/team-installer-try-<n>` and open a PR.',
        'Return JSON: { installed: string[], prNumber?: number }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Team-installer install agents', labels: ['a5c', 'team-installer'] },
);

const kickoffIssueTask = defineTask(
  'team-installer.producer-kickoff-issue',
  async (_args, ctx) => {
    return ctx.agent({
      title: 'Team-installer: open producer kickoff issue',
      prompt: [
        'You are the team-installer-agent. Create an issue via `gh issue create` that asks @producer-agent to "produce the project".',
        'If issues are disabled, open a PR with a stub file asking the admin (first committer) to enable issues.',
        'Return JSON: { issueNumber?: number, fallbackPrNumber?: number }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Team-installer producer kickoff', labels: ['a5c', 'team-installer'] },
);

export async function process(inputs, ctx) {
  const { adHocAgents = [] } = inputs ?? {};
  const analysis = await ctx.task(analyzeTask, {});
  const selected = Array.isArray(analysis?.candidates) ? analysis.candidates : [];
  const install = await ctx.task(installTask, { selected, adHocAgents });
  const kickoff = await ctx.task(kickoffIssueTask, {});
  return {
    success: true,
    agentsInstalled: Array.isArray(install?.installed) ? install.installed : [],
    issueNumber: kickoff?.issueNumber,
  };
}
