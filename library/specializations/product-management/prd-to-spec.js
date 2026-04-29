/**
 * @process product-management/prd-to-spec
 * @description Orchestrate conversion of an approved PRD into a phase-gated implementation SPEC. Stack-agnostic. Wraps the prd-to-spec skill with verification, self-review, and an execution-prompt output.
 * @skill prd-to-spec library/specializations/product-management/skills/prd-to-spec/SKILL.md
 * @inputs { prdPath: string, featureBranch: string, baseBranch?: string, contextDoc?: string, archiveDir?: string, failureLogPath?: string, secondaryReviewer?: string, requireApproval?: boolean }
 * @outputs { success: boolean, specPath: string, executionPrompt: string, summary: string }
 *
 * Phases:
 * 1. Discovery & Verification Ledger - read PRD + project context, scan affected layers, build ledger
 * 2. SPEC Generation - invoke the prd-to-spec skill to produce the SPEC file
 * 3. Self-Verification - internal review + optional secondary reviewer + user approval breakpoint
 * 4. Execution Prompt - emit the short prompt that drives downstream execution
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    prdPath,
    featureBranch,
    baseBranch = 'main',
    contextDoc = 'CLAUDE.md',
    archiveDir = '',
    failureLogPath = '',
    secondaryReviewer = null,
    requireApproval = true
  } = inputs;

  if (!prdPath) {
    return { success: false, reason: 'Missing required input: prdPath' };
  }
  if (!featureBranch) {
    return { success: false, reason: 'Missing required input: featureBranch' };
  }

  ctx.log('info', `Starting prd-to-spec pipeline for PRD: ${prdPath}`);

  // ============================================================================
  // PHASE 1: DISCOVERY & VERIFICATION LEDGER
  // ============================================================================

  ctx.log('info', 'Phase 1: Discovery & Verification Ledger');

  const discovery = await ctx.task(discoveryTask, {
    prdPath,
    contextDoc,
    baseBranch,
    archiveDir,
    failureLogPath
  });

  // ============================================================================
  // PHASE 2: SPEC GENERATION (delegates to prd-to-spec skill)
  // ============================================================================

  ctx.log('info', 'Phase 2: SPEC generation via prd-to-spec skill');

  const specResult = await ctx.task(generateSpecTask, {
    prdPath,
    featureBranch,
    baseBranch,
    contextDoc,
    discovery
  });

  if (!specResult.specPath) {
    return { success: false, reason: 'SPEC generation produced no output path', discovery };
  }

  // ============================================================================
  // PHASE 3: SELF-VERIFICATION
  // ============================================================================

  ctx.log('info', 'Phase 3: Self-verification');

  const selfReview = await ctx.task(selfReviewTask, {
    specPath: specResult.specPath
  });

  let secondaryReview = null;
  if (secondaryReviewer) {
    ctx.log('info', `Phase 3b: Secondary review via ${secondaryReviewer}`);
    secondaryReview = await ctx.task(secondaryReviewTask, {
      specPath: specResult.specPath,
      reviewerHint: secondaryReviewer
    });
  }

  if (requireApproval) {
    const approval = await ctx.breakpoint({
      question: [
        `SPEC ready at \`${specResult.specPath}\`.`,
        '',
        `**Self-review:** ${selfReview.issuesFound} issue(s) found, ${selfReview.issuesFixed} fixed.`,
        secondaryReview
          ? `**Secondary review (${secondaryReviewer}):** ${secondaryReview.summary}`
          : '**Secondary review:** skipped (no reviewer configured)',
        '',
        'Approve to emit the execution prompt, or reject to revise.'
      ].join('\n'),
      title: 'SPEC Approval',
      context: { runId: ctx.runId }
    });
    if (!approval.approved) {
      return {
        success: false,
        reason: 'User rejected at SPEC approval gate',
        feedback: approval.response || approval.feedback,
        specPath: specResult.specPath,
        selfReview,
        secondaryReview
      };
    }
  }

  // ============================================================================
  // PHASE 4: EXECUTION PROMPT
  // ============================================================================

  ctx.log('info', 'Phase 4: Generating execution prompt');

  const promptResult = await ctx.task(executionPromptTask, {
    specPath: specResult.specPath,
    contextDoc
  });

  return {
    success: true,
    specPath: specResult.specPath,
    executionPrompt: promptResult.prompt,
    summary: `SPEC generated at ${specResult.specPath}. Execution prompt emitted.`,
    artifacts: [
      { type: 'spec', path: specResult.specPath },
      { type: 'verification-ledger', content: discovery.verificationLedger }
    ],
    metadata: {
      processId: 'product-management/prd-to-spec',
      timestamp: ctx.now(),
      featureBranch,
      baseBranch
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const discoveryTask = defineTask('discovery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Discovery & Verification Ledger',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Technical analyst performing PRD discovery against the codebase',
      task: `Read the PRD and project context, then build a Verification Ledger that maps every PRD claim to actual code with file:line evidence.`,
      context: {
        prdPath: args.prdPath,
        contextDoc: args.contextDoc,
        baseBranch: args.baseBranch,
        archiveDir: args.archiveDir,
        failureLogPath: args.failureLogPath
      },
      instructions: [
        `Read the PRD at: ${args.prdPath}`,
        `Read the project context document at: ${args.contextDoc}`,
        'Determine which layers the PRD affects (data-pipeline, backend, frontend, infra, docs)',
        'Launch parallel subagents — one per affected layer — to verify PRD claims against the codebase',
        'Build a Verification Ledger as a markdown table: | PRD claim | Verified? | Actual finding (file:line) |',
        `Detect blocking PRs: run \`git log origin/${args.baseBranch}\` and \`gh pr list\` to find open PRs touching the same files`,
        args.archiveDir
          ? `Inspect previous SPECs in ${args.archiveDir} for style inspiration only — never as a rigid template`
          : 'No archive directory configured — skip previous-SPEC inspection',
        args.failureLogPath
          ? `Read ${args.failureLogPath} and surface every pattern as a binding constraint for downstream phases`
          : 'No failure-log path configured — note "no prior failures recorded" and continue'
      ],
      outputFormat: 'JSON with keys: scope (array of strings), verificationLedger (markdown), blockingPRs (array), priorFailures (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['scope', 'verificationLedger'],
      properties: {
        scope: { type: 'array', items: { type: 'string' } },
        verificationLedger: { type: 'string' },
        blockingPRs: { type: 'array' },
        priorFailures: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'phase-1', 'discovery']
}));

export const generateSpecTask = defineTask('generate-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate SPEC by invoking the prd-to-spec skill',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'SPEC generator wrapping the prd-to-spec Claude Code skill',
      task: 'Invoke the prd-to-spec skill (via the Skill tool) to produce a phase-gated SPEC file from the PRD and discovery results. Return the SPEC file path.',
      context: {
        prdPath: args.prdPath,
        featureBranch: args.featureBranch,
        baseBranch: args.baseBranch,
        contextDoc: args.contextDoc,
        discovery: args.discovery
      },
      instructions: [
        `Invoke the prd-to-spec skill with input: ${args.prdPath}`,
        'The skill follows its own internal phases: Pre-Check, Execute (TDD), Pipeline/UI Verification, Conventions Fix, Completeness, Code Review, Deliver',
        `Pass through: featureBranch=${args.featureBranch}, baseBranch=${args.baseBranch}, contextDoc=${args.contextDoc}`,
        'Pass through the discovery results (Verification Ledger, scope, blocking PRs, prior failures) as Phase 1 inputs',
        'After the skill produces the SPEC, return the absolute path to the SPEC file',
        'If the skill encounters a hard error, report it back; do not silently continue'
      ],
      outputFormat: 'JSON with keys: specPath (string), generatedSections (array of strings)'
    },
    outputSchema: {
      type: 'object',
      required: ['specPath'],
      properties: {
        specPath: { type: 'string' },
        generatedSections: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'phase-2', 'spec-generation', 'invokes-skill']
}));

export const selfReviewTask = defineTask('self-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Self-review the generated SPEC',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'QA reviewer auditing a freshly generated SPEC',
      task: `Read the SPEC at ${args.specPath} and audit it for internal contradictions, missing edge cases, wrong file:line references, and unfilled placeholders. Fix issues directly in the file.`,
      context: { specPath: args.specPath },
      instructions: [
        'Read the entire SPEC end-to-end',
        'Verify every file:line reference resolves in the codebase',
        'Verify edge cases are exhaustive given the PRD scope',
        'Verify each phase has a Quality Gate checklist',
        'Check that placeholders like <feature-branch>, <task-id>, <base-branch> are filled in',
        'Fix any issues found directly by editing the SPEC file',
        'Report what was found and what was fixed'
      ],
      outputFormat: 'JSON with keys: issuesFound (number), issuesFixed (number), unfixedIssues (array of strings)'
    },
    outputSchema: {
      type: 'object',
      required: ['issuesFound', 'issuesFixed'],
      properties: {
        issuesFound: { type: 'number' },
        issuesFixed: { type: 'number' },
        unfixedIssues: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'phase-3', 'self-review']
}));

export const secondaryReviewTask = defineTask('secondary-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Secondary review (optional, configurable reviewer)',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Independent reviewer running a configurable secondary review of the SPEC',
      task: `Run the secondary reviewer "${args.reviewerHint}" against the SPEC at ${args.specPath} and summarize findings.`,
      context: { specPath: args.specPath, reviewerHint: args.reviewerHint },
      instructions: [
        `Reviewer hint: "${args.reviewerHint}". Map this to an available reviewer in your environment.`,
        'Examples: "codex" → Codex CLI review skill (e.g., /codex:review), "gemini" → Gemini review skill (e.g., /gemini-review), "deep-verify-plan" → /deep-verify-plan skill, "peer" → notify a human reviewer and wait for response',
        'If the named reviewer is not available, report that as `unavailable: true` and skip — do not silently substitute',
        `Run the reviewer against ${args.specPath} and report findings`,
        'Surface CRITICAL/HIGH findings clearly; group MEDIUM/LOW findings'
      ],
      outputFormat: 'JSON with keys: summary (string), findings (array of {severity, message}), unavailable (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['summary'],
      properties: {
        summary: { type: 'string' },
        findings: { type: 'array', items: { type: 'object' } },
        unavailable: { type: 'boolean' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'phase-3', 'secondary-review', 'optional']
}));

export const executionPromptTask = defineTask('execution-prompt', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate execution prompt',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Prompt generator emitting a short execution prompt',
      task: 'Output a 3-4 line execution prompt to be returned in chat — not written as a file.',
      context: { specPath: args.specPath, contextDoc: args.contextDoc },
      instructions: [
        `The prompt MUST reference: project context document (${args.contextDoc}), the SPEC path (${args.specPath}), and an instruction to execute phase-by-phase with quality score >= 0.85 per phase`,
        'Keep it short — 3-4 lines maximum',
        'The downstream executor can be manual or an orchestrator (babysitter, claude-flow, autoclaude). Mention "manual or orchestrator" without prescribing one',
        'Output as plain text suitable for direct chat output'
      ],
      outputFormat: 'JSON with keys: prompt (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['prompt'],
      properties: { prompt: { type: 'string' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'phase-4', 'execution-prompt']
}));
