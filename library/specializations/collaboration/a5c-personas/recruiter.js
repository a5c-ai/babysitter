/**
 * @process specializations/collaboration/a5c-personas/recruiter
 * @description Recruiter persona (a5c recruiter-agent, aka "agent factory"). Generates
 *   new A5C agent scaffolds: a `.agent.md` file with YAML frontmatter plus a separate
 *   `.prompt.md` file under agents/<category>/ and prompts/<category>/.
 * @inputs { name: string, category: string, description: string, triggers?: object }
 * @outputs { success: boolean, agentPath: string, promptPath: string }
 *
 * Source: a5c-ai/registry/prompts/development/recruiter-agent.prompt.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const scaffoldTask = defineTask(
  'recruiter.scaffold-agent',
  async ({ name, category, description, triggers }, ctx) => {
    return ctx.agent({
      title: `Recruiter: scaffold ${name} (${category})`,
      prompt: [
        'You are the recruiter-agent — the A5C agent factory.',
        `Create a new agent named "${name}" in category "${category}".`,
        'Produce TWO files:',
        `1. agents/${category}/${name}.agent.md — YAML frontmatter only (no body). Required fields:`,
        '   name, version (1.0.0), category, description, usage_context, invocation_context, prompt-uri.',
        '   Add optional fields as appropriate: max_turns, verbose, timeout, priority, events, mentions, paths, labels, branches, activation_cron, agent_discovery.',
        `2. prompts/${category}/${name}.prompt.md — the full agent prompt body.`,
        'Naming: kebab-case, descriptive (e.g., "docker-security-agent" not "docker-agent").',
        'Priority ranges: standard 50-60, development 70-80, security 80-90, critical 90-100. Avoid conflicts with existing agents.',
        'Triggers: be specific with mentions, events, file paths.',
        `Description: ${description}`,
        `Triggers (optional): ${JSON.stringify(triggers ?? {}, null, 2)}`,
        'Return JSON: { agentPath, promptPath, priority }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Recruiter scaffold agent', labels: ['a5c', 'recruiter'] },
);

export async function process(inputs, ctx) {
  const { name = 'new-agent', category = 'development', description = '', triggers } = inputs ?? {};
  const result = await ctx.task(scaffoldTask, { name, category, description, triggers });
  return {
    success: true,
    agentPath: String(result?.agentPath ?? `agents/${category}/${name}.agent.md`),
    promptPath: String(result?.promptPath ?? `prompts/${category}/${name}.prompt.md`),
  };
}
