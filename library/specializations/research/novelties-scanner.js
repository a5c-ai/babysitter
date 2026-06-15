/**
 * @process specializations/research/novelties-scanner
 * @description Novelties Scanner persona — detects, analyzes, and reports on novel
 *   innovations, emerging trends, and breakthrough developments. Writes findings to
 *   docs/research/novelties/<date>-<slug>.md.
 * @inputs { topic?: string, sources?: string[], date?: string, slug?: string }
 * @outputs { success: boolean, reportPath: string, findings: object }
 *
 * Source: a5c-ai/registry/prompts/research/novelties-scanner-base-agent.prompt.md
 * @graph
 *   domains: [domain:software-engineering]
 *   specializations: [specialization:research]
 *   skillAreas: [skill-area:deep-web-research, skill-area:data-analysis, skill-area:docs-as-code]
 *   topics: [topic:developer-experience]
 *   roles: [role:research-engineer, role:tech-lead]
 *   workflows: [workflow:vulnerability-management]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const NOVELTIES_PROMPT = [
  'You are a Novelties Scanner Agent designed to detect, analyze, and report on novel',
  'innovations, emerging trends, and breakthrough developments. Your primary goal is to',
  'identify what is genuinely new and significant, filtering out noise.',
  '',
  'Core Responsibilities:',
  '1. Novelty Detection — distinguish breakthrough from incremental; detect emerging patterns.',
  '2. Innovation Analysis — evaluate significance, feasibility, and key players.',
  '3. Trend Identification — spot convergence points; track adoption momentum.',
  '4. Impact Assessment — societal, economic, technological; adoption barriers.',
  '',
  'Detection filters: Temporal Analysis, Uniqueness Assessment, Impact Potential,',
  'Adoption Signals, Cross-Domain Transfer.',
  '',
  'Frameworks: TRL, Hype Cycle, Competitive Landscape, Stakeholder, Risk-Benefit.',
  '',
  'Maintain objectivity. Avoid hype. Acknowledge uncertainty and confidence levels.',
  'Verify from multiple sources; separate facts from speculation.',
].join('\n');

const scanTask = defineTask(
  'novelties-scanner-scan',
  async ({ topic, sources }, ctx) => {
    return ctx.agent({
      title: `Novelties scan: ${topic ?? '(unspecified topic)'}`,
      prompt: [
        NOVELTIES_PROMPT,
        '',
        `Task: Scan for novelties in the topic/domain: ${topic ?? '(open)'}.`,
        `Sources to prioritize: ${JSON.stringify(sources ?? [], null, 2)}`,
        '',
        'Return JSON: { novelties: [{ title, summary, significance, sources, trlEstimate, confidence }],',
        '  trends: [{ name, momentum, convergencePoints }], earlyWarnings: string[] }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Novelties scan', labels: ['a5c', 'research', 'novelties'] },
);

const writeReportTask = defineTask(
  'novelties-scanner-write-report',
  async ({ reportPath, findings, topic }, ctx) => {
    return ctx.agent({
      title: `Write novelties report: ${reportPath}`,
      prompt: [
        NOVELTIES_PROMPT,
        '',
        `Task: Write a comprehensive Markdown Innovation Report to: ${reportPath}`,
        `Topic: ${topic ?? '(open)'}`,
        '',
        'Sections: Executive Summary, Novelty Alerts, Innovation Reports (per item with technical',
        'details, competitive landscape, TRL, risks), Trend Summaries, Early Warning Systems.',
        '',
        `Findings to render: ${JSON.stringify(findings ?? {}, null, 2)}`,
        '',
        'Return JSON: { written: true, path }.',
      ].join('\n'),
    });
  },
  { kind: 'agent', title: 'Write novelties report', labels: ['a5c', 'research', 'novelties'] },
);

function todayIso() {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

function slugify(s) {
  return String(s ?? 'scan')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'scan';
}

export async function process(inputs, ctx) {
  const { topic, sources = [], date, slug } = inputs ?? {};
  const d = date ?? todayIso();
  const s = slug ?? slugify(topic);
  const reportPath = `docs/research/novelties/${d}-${s}.md`;

  const findings = await ctx.task(scanTask, { topic, sources });
  await ctx.task(writeReportTask, { reportPath, findings, topic });
  return { success: true, reportPath, findings };
}
