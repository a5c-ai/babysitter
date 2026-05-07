/**
 * @process methodologies/deep-research
 * @description Deep Research — multi-stage investigation with divergent exploration, convergent synthesis, and source verification.
 * @inputs { question: string, sources?: Array<string>, depth?: number, domains?: Array<string>, outputFormat?: string }
 * @outputs { success: boolean, question: string, findings: Array<object>, synthesis: string, sources: Array<object>, confidence: string }
   * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:stakeholder-management, skill-area:roadmap-planning, skill-area:prioritization-frameworks]
 *   workflows: [workflow:feature-development, workflow:release-management]
 *   topics: [topic:developer-experience]
 *   roles: [role:engineering-manager, role:tech-lead, role:scrum-master]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

/**
 * Deep Research methodology.
 *
 * Stages:
 *   1. Frame      — clarify the question, decompose into sub-questions.
 *   2. Diverge    — enumerate candidate sources and angles in parallel.
 *   3. Gather     — fetch and summarize evidence per sub-question.
 *   4. Verify     — cross-check claims, flag unsourced assertions.
 *   5. Converge   — synthesize findings into a coherent answer.
 *   6. Critique   — adversarial review for gaps and bias.
 *   7. Finalize   — produce report with inline citations.
 */

const frameQuestionTask = defineTask(
  'research.frame-question',
  async ({ question, domains }, ctx) => {
    return ctx.agent({
      title: 'Frame the research question',
      prompt: [
        `Decompose the following research question into 3-7 concrete sub-questions.`,
        `Question: ${question}`,
        domains && domains.length
          ? `Domain hints: ${domains.join(', ')}`
          : '',
        `Return JSON: { subQuestions: string[], assumptions: string[], scopeBoundaries: string[] }.`,
      ]
        .filter(Boolean)
        .join('\n\n'),
    });
  },
  {
    kind: 'agent',
    title: 'Frame research question',
    labels: ['research', 'framing'],
  },
);

const gatherEvidenceTask = defineTask(
  'research.gather-evidence',
  async ({ subQuestion, sources }, ctx) => {
    return ctx.agent({
      title: `Gather evidence: ${subQuestion}`,
      prompt: [
        `Investigate the following sub-question and return structured findings.`,
        `Sub-question: ${subQuestion}`,
        sources && sources.length
          ? `Seed sources: ${sources.join(', ')}`
          : 'No seed sources; discover authoritative sources yourself.',
        `Return JSON: { claims: Array<{ statement, evidence, sourceUrl, confidence }>, openQuestions: string[] }.`,
        `Prefer primary sources over summaries. Cite each claim with a sourceUrl.`,
      ].join('\n\n'),
    });
  },
  {
    kind: 'agent',
    title: 'Gather evidence for sub-question',
    labels: ['research', 'gathering'],
  },
);

const verifyClaimsTask = defineTask(
  'research.verify-claims',
  async ({ claims }, ctx) => {
    return ctx.agent({
      title: 'Verify research claims',
      prompt: [
        `Cross-check the following claims for consistency, sourcing, and recency.`,
        `Claims: ${JSON.stringify(claims, null, 2)}`,
        `Return JSON: { verified: Array<claim>, disputed: Array<{ claim, reason }>, unsourced: Array<claim> }.`,
      ].join('\n\n'),
    });
  },
  {
    kind: 'agent',
    title: 'Verify claims',
    labels: ['research', 'verification'],
  },
);

const synthesizeTask = defineTask(
  'research.synthesize',
  async ({ question, verified }, ctx) => {
    return ctx.agent({
      title: 'Synthesize research findings',
      prompt: [
        `Synthesize the verified findings into a coherent answer to the original question.`,
        `Question: ${question}`,
        `Verified findings: ${JSON.stringify(verified, null, 2)}`,
        `Return JSON: { answer: string, keyInsights: string[], remainingUncertainties: string[] }.`,
        `Use inline citations in the answer in the form [n] that map to the source list.`,
      ].join('\n\n'),
    });
  },
  {
    kind: 'agent',
    title: 'Synthesize findings',
    labels: ['research', 'synthesis'],
  },
);

const critiqueTask = defineTask(
  'research.critique',
  async ({ synthesis, question }, ctx) => {
    return ctx.agent({
      title: 'Adversarial critique of synthesis',
      prompt: [
        `Adversarially critique the following research synthesis. Look for gaps, bias, overreach, and unsupported leaps.`,
        `Original question: ${question}`,
        `Synthesis: ${JSON.stringify(synthesis, null, 2)}`,
        `Return JSON: { issues: Array<{ severity, description, remedy }>, overallConfidence: 'low'|'medium'|'high' }.`,
      ].join('\n\n'),
    });
  },
  {
    kind: 'agent',
    title: 'Critique synthesis',
    labels: ['research', 'critique'],
  },
);

export async function process(inputs, ctx) {
  const {
    question,
    sources = [],
    depth = 1,
    domains = [],
  } = inputs;

  const framing = await ctx.task(frameQuestionTask, { question, domains });
  const subQuestions = framing.subQuestions ?? [];

  const gatherResults = await ctx.parallel.map(
    subQuestions,
    (subQuestion) => ctx.task(gatherEvidenceTask, { subQuestion, sources }),
  );

  const allClaims = gatherResults.flatMap((r) => r.claims ?? []);
  const verification = await ctx.task(verifyClaimsTask, { claims: allClaims });

  const synthesis = await ctx.task(synthesizeTask, {
    question,
    verified: verification.verified ?? [],
  });

  const critique = await ctx.task(critiqueTask, { synthesis, question });

  let finalSynthesis = synthesis;
  if (depth > 1 && critique.issues?.some((i) => i.severity === 'high')) {
    finalSynthesis = await ctx.task(synthesizeTask, {
      question,
      verified: [
        ...(verification.verified ?? []),
        { remediationNotes: critique.issues },
      ],
    });
  }

  return {
    success: true,
    question,
    framing,
    findings: gatherResults,
    verification,
    synthesis: finalSynthesis,
    critique,
    confidence: critique.overallConfidence ?? 'medium',
  };
}
