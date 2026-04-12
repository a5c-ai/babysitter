/**
 * @process specializations/collaboration/a5c-personas/producer
 * @description Producer persona (a5c producer-agent). Analyzes docs/specs/README.md against
 *   current implementation, detects project phase, and files GitHub issues for gaps as
 *   decoupled, actionable coding tasks with acceptance criteria. Also optionally runs a
 *   tech-debt scan across docs/validation/ and groups findings into implementation issues.
 * @inputs { specsPresent?: boolean, phaseHint?: string, techDebtScan?: boolean }
 * @outputs { success: boolean, phase: string, issuesFiled: number, techDebtGroups: number }
 *
 * Source: a5c-ai/registry/prompts/development/producer-agent.prompt.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const gapAnalysisTask = defineTask(
  'producer.gap-analysis',
  async ({ phaseHint }, ctx) => {
    return ctx.agent({
      title: 'Producer: phase detection + gap analysis',
      prompt: [
        'You are the producer-agent. Detect the current project phase and identify gaps vs specs.',
        'Phases: Requirements, Specification, Technical Specification, Development (scaffolding/active/feature-complete), Maintenance.',
        'Probe docs/producer/phases/current-phase.txt and docs/producer/phases/<phase>/checklist.md.',
        'If docs/specs/README.md is missing, file an issue to define specifications (include everything already known).',
        'Otherwise, compare current implementation to specs and enumerate gaps that map to decoupled coding tasks.',
        `Phase hint (optional): ${phaseHint ?? '(none)'}`,
        'Return JSON: { phase: string, gaps: Array<{ area, title, description, acceptanceCriteria, dependencies, priority }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Producer gap analysis', labels: ['a5c', 'producer'] },
);

const fileIssuesTask = defineTask(
  'producer.file-issues',
  async ({ gaps }, ctx) => {
    return ctx.agent({
      title: `Producer: file ${gaps?.length ?? 0} gap issue(s)`,
      prompt: [
        'You are the producer-agent. Create one GitHub issue per gap using `gh issue create`.',
        'Title template: "[Producer] [Area] – Task title".',
        'Body must include: context, requirements, acceptance criteria, dependencies (Depends on #X / Blocks #Y), priority, labels.',
        'Mention @developer-agent in the body for downstream assignment.',
        `Gaps: ${JSON.stringify(gaps ?? [], null, 2)}`,
        'Return JSON: { filed: number, issueNumbers: number[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Producer file issues', labels: ['a5c', 'producer'] },
);

const techDebtScanTask = defineTask(
  'producer.tech-debt-scan',
  async (_args, ctx) => {
    return ctx.agent({
      title: 'Producer: tech-debt scan across docs/validation/',
      prompt: [
        'You are the producer-agent running a tech-debt scan.',
        'Enumerate files under docs/validation/*/*/*/*.md. For each: read, assess relevance, drop contradicted/obsolete.',
        'Dedup by meaning; cluster by affected files/areas (<=10 per group); take top 5 groups by size.',
        'Create one GitHub issue per group with full implementation details; mention @developer-agent.',
        'Open a branch + PR that git-moves covered findings from docs/validation/ to docs/debt-completed/, deletes irrelevant ones.',
        'Return JSON: { groups: number, issueNumbers: number[], prNumber?: number }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Producer tech-debt scan', labels: ['a5c', 'producer', 'tech-debt'] },
);

export async function process(inputs, ctx) {
  const { phaseHint, techDebtScan = false } = inputs ?? {};
  const analysis = await ctx.task(gapAnalysisTask, { phaseHint });
  const gaps = Array.isArray(analysis?.gaps) ? analysis.gaps : [];
  let issuesFiled = 0;
  if (gaps.length > 0) {
    const filed = await ctx.task(fileIssuesTask, { gaps });
    issuesFiled = Number(filed?.filed ?? 0);
  }
  let techDebtGroups = 0;
  if (techDebtScan) {
    const scan = await ctx.task(techDebtScanTask, {});
    techDebtGroups = Number(scan?.groups ?? 0);
  }
  return {
    success: true,
    phase: String(analysis?.phase ?? 'unknown'),
    issuesFiled,
    techDebtGroups,
  };
}
