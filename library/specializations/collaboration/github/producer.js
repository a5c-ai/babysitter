/**
 * @process specializations/collaboration/github/producer
 * @description Producer persona. Detects project phase → ingests spec (docs/specs/README.md) →
 *   extracts gaps vs current implementation → dedupes against existing issues → drafts issue
 *   bodies in parallel → infers labels/assignees → batch-creates GitHub issues. Optionally
 *   runs a tech-debt scan grouping docs/validation/ findings into implementation issues.
 * @inputs { phaseHint?: string, techDebtScan?: boolean }
 * @outputs { success, phase, issuesFiled, techDebtGroups }
 *
 * Source: https://raw.githubusercontent.com/a5c-ai/registry/main/prompts/development/producer-agent.prompt.md
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:collaboration]
 *   skillAreas: [skill-area:code-review-practice, skill-area:gitops]
 *   topics: [topic:code-review-best-practices]
 *   workflows: [workflow:feature-development, workflow:pull-request-lifecycle]
 *   roles: [role:tech-lead, role:platform-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const detectPhaseTask = defineTask(
  'producer.detect-phase',
  async ({ phaseHint }, ctx) => {
    return ctx.agent({
      title: 'Producer: detect project phase',
      prompt: [
        'Detect current project phase. Phases:',
        '  Requirements | Specification | Technical Specification | Development (scaffolding | active | feature-complete) | Maintenance.',
        'Probe docs/producer/phases/current-phase.txt and docs/producer/phases/<phase>/checklist.md.',
        `Phase hint (optional): ${phaseHint ?? '(none)'}`,
        'Return JSON: { phase: string, checklistPresent: boolean }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Producer detect phase', labels: ['a5c', 'producer'] },
);

const ingestSpecTask = defineTask(
  'producer.ingest-spec',
  async (_args, ctx) => {
    return ctx.agent({
      title: 'Producer: ingest docs/specs/README.md',
      prompt: [
        'Read docs/specs/README.md if it exists. If missing, return { specMissing: true } and we will queue a spec-definition issue.',
        'Otherwise summarise the specification surface: features, constraints, acceptance criteria.',
        'Return JSON: { specMissing: boolean, specSummary?: object }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Producer ingest spec', labels: ['a5c', 'producer'] },
);

const extractGapsTask = defineTask(
  'producer.extract-gaps',
  async ({ specSummary, phase }, ctx) => {
    return ctx.agent({
      title: 'Producer: extract gaps vs implementation',
      prompt: [
        'Compare current implementation to the spec summary. Enumerate decoupled coding tasks.',
        'Look for: missing pages (404), unimplemented buttons, TODO comments, mocked data, untested aspects.',
        'Check latest merged PRs for features not yet integrated into the main flow.',
        `Phase: ${phase}`,
        `Spec summary: ${JSON.stringify(specSummary ?? {}, null, 2)}`,
        'Return JSON: { gaps: Array<{ area, title, description, acceptanceCriteria, dependencies, priority }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Producer extract gaps', labels: ['a5c', 'producer'] },
);

const dedupeAgainstIssuesTask = defineTask(
  'producer.dedupe-against-issues',
  async ({ gaps }, ctx) => {
    return ctx.agent({
      title: `Dedupe ${gaps.length} gap(s) against existing issues`,
      prompt: [
        'Search open and recently-closed issues; drop gaps already tracked; keep a map of gap→existingIssue for the rest.',
        `Gaps: ${JSON.stringify(gaps, null, 2)}`,
        'Return JSON: { unique: Array<same-shape>, duplicates: Array<{ gapTitle, existingIssue }> }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Producer dedupe', labels: ['a5c', 'producer'] },
);

const draftIssueTask = defineTask(
  'producer.draft-issue',
  async ({ gap }, ctx) => {
    return ctx.agent({
      title: `Draft issue: ${gap.title}`,
      prompt: [
        'Draft a GitHub issue body following the producer template:',
        '  Title: "[Producer] [Area] – Task title"',
        '  Body: context | requirements | acceptance criteria | dependencies (Depends on #X / Blocks #Y) | priority',
        'Labels: "producer" + category (backend|frontend|ux|tests|security|docs|…) + priority label.',
        'Mention @developer-agent in the body only (not as a comment) so it will trigger on issue creation.',
        `Gap: ${JSON.stringify(gap, null, 2)}`,
        'Return JSON: { title, body, labels: string[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Draft producer issue', labels: ['a5c', 'producer'] },
);

const batchCreateIssuesTask = defineTask(
  'producer.batch-create-issues',
  async ({ drafts }, ctx) => {
    return ctx.agent({
      title: `Create ${drafts.length} issue(s) via gh`,
      prompt: [
        'Call gh issue create for each draft. Respect dependencies — do NOT mention @developer-agent in the body',
        'for issues that depend on another issue in this same batch (avoid triggering on blocked work).',
        `Drafts: ${JSON.stringify(drafts, null, 2)}`,
        'Return JSON: { filed: number, issueNumbers: number[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Batch-create issues', labels: ['a5c', 'producer'] },
);

const techDebtScanTask = defineTask(
  'producer.tech-debt-scan',
  async (_args, ctx) => {
    return ctx.agent({
      title: 'Producer: tech-debt scan across docs/validation/',
      prompt: [
        'Enumerate docs/validation/*/*/*/*.md. For each: read, drop obsolete/contradicted.',
        'Dedup by meaning; cluster by affected files/areas (<=10 per group); take top 5 groups.',
        'Create one implementation issue per group (mention @developer-agent); open a branch+PR that',
        'git-moves covered findings from docs/validation/ to docs/debt-completed/ and deletes irrelevant ones.',
        'Return JSON: { groups: number, issueNumbers: number[], prNumber?: number }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Producer tech-debt scan', labels: ['a5c', 'producer', 'tech-debt'] },
);

export async function process(inputs, ctx) {
  const { phaseHint, techDebtScan = false } = inputs ?? {};
  const [phaseInfo, spec] = await ctx.parallel.all([
    ctx.task(detectPhaseTask, { phaseHint }),
    ctx.task(ingestSpecTask, {}),
  ]);
  const phase = String(phaseInfo?.phase ?? 'unknown');

  let issuesFiled = 0;
  if (!spec?.specMissing) {
    const { gaps = [] } = await ctx.task(extractGapsTask, {
      specSummary: spec?.specSummary ?? {},
      phase,
    });
    if (gaps.length > 0) {
      const deduped = await ctx.task(dedupeAgainstIssuesTask, { gaps });
      const unique = Array.isArray(deduped?.unique) ? deduped.unique : gaps;
      if (unique.length > 0) {
        const drafts = await ctx.parallel.map(unique, (gap) => ctx.task(draftIssueTask, { gap }));
        const created = await ctx.task(batchCreateIssuesTask, { drafts: drafts.filter(Boolean) });
        issuesFiled = Number(created?.filed ?? 0);
      }
    }
  }

  let techDebtGroups = 0;
  if (techDebtScan) {
    const scan = await ctx.task(techDebtScanTask, {});
    techDebtGroups = Number(scan?.groups ?? 0);
  }

  return { success: true, phase, issuesFiled, techDebtGroups };
}
