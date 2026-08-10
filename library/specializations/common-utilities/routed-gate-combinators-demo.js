/**
 * @process specializations/common-utilities/routed-gate-combinators-demo
 * @description Exemplar process exercising the routed-gate combinators end-to-end:
 *   kip recall of prior combinator-usage insights, an agent drafting task producing a
 *   usage guide artifact, an adversarialGate with parallel IRON-LAW critics and a bounded
 *   fix loop, a routedBreakpoint owner-acceptance gate on the combinators' API ergonomics,
 *   and kip assertion of adoption facts at the end. Proves the combinators against a real
 *   artifact instead of leaving them speculative.
 * @inputs {
 *   topic?: string,                // recall/drafting topic (default 'routed-gate-combinators usage guide')
 *   kipEnabled?: boolean,          // run the kip recall/assert touchpoints (default true)
 *   kipDir?: string,               // kip store directory (default '.a5c/kip')
 *   kipModel?: string,             // model for kip structured paths (default 'sonnet')
 *   maxFixAttempts?: number        // adversarial-gate fix loop bound (default 2)
 * }
 * @outputs {
 *   success: boolean,
 *   artifactPath: string,          // generated usage guide (under ctx.artifactsDir)
 *   gate: object,                  // { passed, issues, evidence, attempts, escalated }
 *   ownerApproved: boolean,
 *   kipFactsAsserted: number,
 *   metadata: object
 * }
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:orchestration-loop, skill-area:agentic-loops]
 *   topics: [topic:developer-experience]
 *   roles: [role:platform-engineer, role:tech-lead]
 *   workflows: [workflow:feature-development]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import {
  routedBreakpoint,
  adversarialGate,
  kipRecall,
  kipAssert,
  KIP_CLI_NOTE,
} from './routed-gate-combinators.js';

// ---------------------------------------------------------------------------
// Phase 2 task — draft the combinator usage guide artifact
// ---------------------------------------------------------------------------

export const draftUsageGuideTask = defineTask('draft-usage-guide', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Draft combinator usage guide',
  agent: {
    name: 'utilities-author',
    prompt: {
      role: 'Developer-experience writer',
      task: 'Write a concise usage guide for routedBreakpoint, adversarialGate, kipRecall/kipAssert',
      context: args,
      instructions: [
        'Read library/specializations/common-utilities/routed-gate-combinators.js and document each export with a runnable snippet.',
        'Include the mandatory-evidence rule and the required routing fields.',
        'Embed the Windows-safe kip CLI note verbatim.',
        'Write the guide to args.artifactPath.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['artifactPath', 'sections'],
      properties: {
        artifactPath: { type: 'string' },
        sections: { type: 'array' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'common-utilities', 'demo', 'draft'],
}));

// ---------------------------------------------------------------------------
// Process — five phases: recall, draft, gate, owner acceptance, assert
// ---------------------------------------------------------------------------

export async function routedGateCombinatorsDemo(inputs, ctx) {
  const topic = inputs.topic ?? 'routed-gate-combinators usage guide';
  const kipEnabled = inputs.kipEnabled ?? true;
  const kipDir = inputs.kipDir ?? '.a5c/kip';
  const kipModel = inputs.kipModel ?? 'sonnet';
  const maxFixAttempts = inputs.maxFixAttempts ?? 2;

  const artifactPath = `${ctx.artifactsDir}/routed-gate-combinators-usage.md`;

  // -------------------------------------------------------------------------
  // Phase 1 — Recall: prior combinator-usage insights from kip. A fresh or
  // empty store is a valid state (factCount 0, storeInitialized true).
  // -------------------------------------------------------------------------
  let recall = null;
  if (kipEnabled) {
    recall = await kipRecall(ctx, {
      kipDir,
      topic: 'routed-gate-combinators usage',
      kipModel,
      kind: 'library-enrichment',
    });
  }

  // -------------------------------------------------------------------------
  // Phase 2 — Draft artifact: single sequential agent task writing the usage
  // guide into ctx.artifactsDir, informed by Phase 1 insights. Demo runs
  // never touch repo files — the artifact lives in the run's artifacts dir.
  // -------------------------------------------------------------------------
  const draft = await ctx.task(draftUsageGuideTask, {
    topic,
    artifactPath,
    kipCliNote: KIP_CLI_NOTE,
    priorInsights: recall ? recall.insights : [],
  });

  // -------------------------------------------------------------------------
  // Phase 3 — Adversarial gate: two independent IRON-LAW critics (accuracy vs
  // ergonomics, disjoint mandates, concurrent via ctx.parallel inside the
  // combinator), bounded fixer loop, routed escalation on exhaustion.
  // -------------------------------------------------------------------------
  const gate = await adversarialGate(ctx, {
    gateId: 'common-utilities.demo.usage-guide',
    artifact: {
      path: artifactPath,
      description: 'Usage guide for the routed-gate combinators',
    },
    critics: [
      {
        name: 'accuracy-critic',
        role: 'API accuracy reviewer',
        focus: 'every documented signature, default, and contract must match the module source exactly',
      },
      {
        name: 'ergonomics-critic',
        role: 'API ergonomics reviewer',
        focus: 'call sites must be shorter and safer than hand-rolled ctx.breakpoint/ctx.parallel equivalents; flag any awkward required argument or footgun',
      },
    ],
    ironLaw: [
      'Verify every code snippet in the guide against the actual exports in library/specializations/common-utilities/routed-gate-combinators.js — cite file and line for each verified claim.',
    ],
    maxFixAttempts,
    fixer: {},
  });

  // -------------------------------------------------------------------------
  // Phase 4 — Owner acceptance: the only planned breakpoint (sparse per repo
  // rules). Reviews both the gated artifact AND the combinators' ergonomics.
  // Disapproval returns failure with the owner's feedback — never silently
  // continues.
  // -------------------------------------------------------------------------
  const acceptance = await routedBreakpoint(ctx, {
    question: 'Usage guide passed the adversarial gate. Approve the combinators API ergonomics and accept the demo?',
    artifactPath,
    gate,
  }, {
    breakpointId: 'common-utilities.demo.owner-acceptance',
    expert: 'owner',
    tags: ['common-utilities', 'combinators', 'acceptance'],
    strategy: 'single',
  });

  if (!acceptance.approved) {
    return {
      success: false,
      artifactPath,
      gate,
      ownerApproved: false,
      kipFactsAsserted: 0,
      metadata: {
        topic,
        draftSections: draft.sections,
        ownerFeedback: acceptance.feedback ?? null,
        kipEnabled,
        kipSkipped: !kipEnabled,
      },
    };
  }

  // -------------------------------------------------------------------------
  // Phase 5 — Assert: write adoption facts back into the kip store so future
  // runs recall what was exercised and how it went. Per-fact failures are
  // reported in the outputs, never swallowed. Skipped entirely (and recorded
  // as skipped) when kipEnabled === false.
  // -------------------------------------------------------------------------
  let assertResult = null;
  if (kipEnabled) {
    assertResult = await kipAssert(ctx, {
      kipDir,
      kipModel,
      kind: 'library-enrichment',
      facts: [
        {
          subject: 'process:routed-gate-combinators-demo',
          predicate: 'exercised',
          object: 'combinator:routedBreakpoint',
          props: { breakpointId: 'common-utilities.demo.owner-acceptance' },
        },
        {
          subject: 'process:routed-gate-combinators-demo',
          predicate: 'exercised',
          object: 'combinator:adversarialGate',
          props: { gateId: 'common-utilities.demo.usage-guide' },
        },
        {
          subject: 'process:routed-gate-combinators-demo',
          predicate: 'exercised',
          object: 'combinator:kipRecall+kipAssert',
          props: { kipDir, kind: 'library-enrichment' },
        },
        {
          subject: 'artifact:routed-gate-combinators-usage.md',
          predicate: 'gate-result',
          object: gate.passed ? 'passed' : 'failed',
          props: { passed: gate.passed, attempts: gate.attempts, escalated: gate.escalated },
        },
        {
          subject: 'process:routed-gate-combinators-demo',
          predicate: 'owner-verdict',
          object: 'approved',
          props: { feedback: acceptance.feedback ?? null },
        },
      ],
    });
  }

  return {
    success: true,
    artifactPath,
    gate,
    ownerApproved: true,
    kipFactsAsserted: assertResult ? assertResult.asserted : 0,
    metadata: {
      topic,
      draftSections: draft.sections,
      recallFactCount: recall ? recall.factCount : null,
      kipAssertFailed: assertResult ? assertResult.failed ?? [] : [],
      kipEnabled,
      kipSkipped: !kipEnabled,
    },
  };
}
