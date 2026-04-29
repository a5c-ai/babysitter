/**
 * @process product-management/task-to-prd
 * @description Orchestrate conversion of a raw task (tracker ticket / file / inline text) into a fully characterized PRD via interactive clarification, automated verification, and user-gated refinement. Stack-agnostic. Self-contained — the task-to-prd skill dispatches here via /babysitter:call or /babysitter:yolo.
 * @inputs { input: string, featureBranch: string, contextDoc?: string, archiveDir?: string, trackerHint?: string, secondaryReviewer?: string, requireFinalApproval?: boolean }
 * @outputs { success: boolean, prdPath: string, decisionLog: array, followupPrompt: string, summary: string }
 *
 * Phases:
 * 1. Clarification (interactive) - load source, Five Whys, interactive Q&A, scope-lock breakpoint
 * 2. Draft (automatic) - parallel codebase scan + draft PRD inline (full instructions embedded in agent prompt)
 * 3. Verification (with user gates) - what-could-go-wrong, consistency, conventions, adversarial, quality checklist, optional secondary reviewer; every proposed change goes through a per-finding breakpoint
 * 4. Finalize - final review breakpoint, optional tracker update, emit follow-up prompt
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const {
    input,
    featureBranch,
    contextDoc = 'CLAUDE.md',
    archiveDir = '',
    trackerHint = null,
    secondaryReviewer = null,
    requireFinalApproval = true
  } = inputs;

  if (!input) {
    return { success: false, reason: 'Missing required input: input (tracker ID, file path, or inline text)' };
  }
  if (!featureBranch) {
    return { success: false, reason: 'Missing required input: featureBranch' };
  }

  ctx.log('info', `Starting task-to-prd pipeline for: ${input}`);

  // ============================================================================
  // PHASE 1: CLARIFICATION (INTERACTIVE)
  // ============================================================================

  ctx.log('info', 'Phase 1: Loading task source');

  const sourceLoad = await ctx.task(loadSourceTask, {
    input,
    contextDoc,
    archiveDir,
    trackerHint
  });

  ctx.log('info', 'Phase 1b: Five Whys analysis');

  const fiveWhys = await ctx.task(fiveWhysTask, {
    rawTask: sourceLoad.rawTask
  });

  // Interactive clarification — handed to the user via the harness Q&A mechanism
  const clarification = await ctx.breakpoint({
    question: [
      'Interactive Clarification phase begins now.',
      '',
      `**Task summary:** ${sourceLoad.summary || sourceLoad.rawTask?.slice(0, 200)}`,
      `**Five Whys gaps:** ${(fiveWhys.openQuestions || []).length} open question(s)`,
      '',
      'The clarification loop will ask one question at a time (explanation + recommendation + 2-4 options). You may answer directly or say "I will ask <stakeholder>" — paste their answer back when ready.',
      '',
      'Approve to start the clarification loop, or reject to cancel.'
    ].join('\n'),
    title: 'Begin Interactive Clarification',
    context: { runId: ctx.runId }
  });
  if (!clarification.approved) {
    return { success: false, reason: 'User cancelled at clarification gate' };
  }

  const decisionLog = await ctx.task(clarificationLoopTask, {
    rawTask: sourceLoad.rawTask,
    fiveWhys,
    contextDoc
  });

  // Scope lock — explicit gate before any drafting
  const scopeLock = await ctx.breakpoint({
    question: [
      '**Scope Lock — review and approve before PRD draft:**',
      '',
      `**Problem:** ${decisionLog.problemSummary}`,
      `**Proposed scope:** ${(decisionLog.scope || []).join(', ')}`,
      `**Constraints:** ${(decisionLog.constraints || []).join('; ') || 'none'}`,
      `**Decisions captured:** ${(decisionLog.entries || []).length}`,
      '',
      'Approve to proceed to PRD draft, or reject to revise.'
    ].join('\n'),
    title: 'Scope Lock',
    context: { runId: ctx.runId }
  });
  if (!scopeLock.approved) {
    return { success: false, reason: 'User rejected at scope-lock gate', decisionLog };
  }

  // ============================================================================
  // PHASE 2: DRAFT (AUTOMATIC)
  // ============================================================================

  ctx.log('info', 'Phase 2: Drafting PRD');

  const [scanResult, draftResult] = await ctx.parallel.all([
    () => ctx.task(codebaseScanTask, { scope: decisionLog.scope, contextDoc }),
    () => ctx.task(draftPrdTask, {
      input,
      featureBranch,
      contextDoc,
      archiveDir,
      decisionLog,
      fiveWhys
    })
  ]);

  if (!draftResult.prdPath) {
    return { success: false, reason: 'PRD draft produced no output path', decisionLog, scanResult };
  }

  // ============================================================================
  // PHASE 3: VERIFICATION (WITH USER GATES)
  // ============================================================================

  ctx.log('info', 'Phase 3: Verification (parallel checks)');

  const checks = await ctx.parallel.all([
    () => ctx.task(whatCouldGoWrongTask, { prdPath: draftResult.prdPath }),
    () => ctx.task(codebaseConsistencyTask, { prdPath: draftResult.prdPath, scanResult }),
    () => ctx.task(conventionsCheckTask, { prdPath: draftResult.prdPath, contextDoc }),
    () => ctx.task(adversarialReviewTask, { prdPath: draftResult.prdPath }),
    () => ctx.task(qualityChecklistTask, { prdPath: draftResult.prdPath })
  ]);

  let secondaryReview = null;
  if (secondaryReviewer) {
    ctx.log('info', `Phase 3b: Secondary review via ${secondaryReviewer}`);
    secondaryReview = await ctx.task(secondaryReviewerTask, {
      prdPath: draftResult.prdPath,
      reviewerHint: secondaryReviewer
    });
  }

  // Aggregate findings and present per-finding breakpoint
  const allFindings = [
    ...(checks[0].findings || []),
    ...(checks[1].findings || []),
    ...(checks[2].findings || []),
    ...(checks[3].findings || []),
    ...(checks[4].findings || []),
    ...(secondaryReview?.findings || [])
  ];

  if (allFindings.length > 0) {
    const reviewApproval = await ctx.breakpoint({
      question: [
        `**${allFindings.length} verification finding(s)** propose changes to the PRD.`,
        '',
        'Each one will be presented separately for approve / reject / modify. Apply only approved changes.',
        '',
        'Approve to enter the per-finding loop, or reject to skip the verification stage.'
      ].join('\n'),
      title: 'Verification Findings — Per-Finding Review',
      context: { runId: ctx.runId }
    });
    if (reviewApproval.approved) {
      await ctx.task(applyFindingsTask, {
        prdPath: draftResult.prdPath,
        findings: allFindings
      });
    }
  }

  // ============================================================================
  // PHASE 4: FINALIZE
  // ============================================================================

  if (requireFinalApproval) {
    const finalApproval = await ctx.breakpoint({
      question: [
        `**Final PRD review.** PRD at \`${draftResult.prdPath}\`.`,
        '',
        `Verification findings processed: ${allFindings.length}.`,
        '',
        'Approve to finalize and emit the follow-up prompt, or reject to revise.'
      ].join('\n'),
      title: 'Final PRD Approval',
      context: { runId: ctx.runId }
    });
    if (!finalApproval.approved) {
      return {
        success: false,
        reason: 'User rejected at final approval gate',
        prdPath: draftResult.prdPath,
        decisionLog
      };
    }
  }

  let trackerUpdate = null;
  if (trackerHint && sourceLoad.sourceType === 'tracker') {
    trackerUpdate = await ctx.task(updateTrackerTask, {
      input,
      prdPath: draftResult.prdPath,
      trackerHint
    });
  }

  const followup = await ctx.task(generateFollowupPromptTask, {
    prdPath: draftResult.prdPath,
    contextDoc
  });

  return {
    success: true,
    prdPath: draftResult.prdPath,
    decisionLog: decisionLog.entries || [],
    followupPrompt: followup.prompt,
    summary: `PRD generated at ${draftResult.prdPath}. Follow-up prompt emitted.`,
    artifacts: [
      { type: 'prd', path: draftResult.prdPath },
      { type: 'decision-log', entries: decisionLog.entries || [] }
    ],
    trackerUpdate,
    metadata: {
      processId: 'product-management/task-to-prd',
      timestamp: ctx.now(),
      featureBranch
    }
  };
}

// ============================================================================
// TASK DEFINITIONS
// ============================================================================

export const loadSourceTask = defineTask('load-source', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Load task source (tracker / file / inline text)',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Task-intake analyst detecting and loading the raw source',
      task: `Detect the input type and load the raw task content. Input: "${args.input}"`,
      context: { input: args.input, contextDoc: args.contextDoc, archiveDir: args.archiveDir, trackerHint: args.trackerHint },
      instructions: [
        'Detect input type: tracker ticket ID (alphanumeric prefix + dash + number), file path (contains / or \\), or inline text (everything else)',
        args.trackerHint
          ? `Tracker hint: "${args.trackerHint}". If input matches a tracker ticket pattern, fetch summary + description + comments via the matching tracker integration. Examples: Jira (/jira skill or acli), Linear (linear-cli or MCP), GitHub Issues (gh issue view). Do NOT create new tickets.`
          : 'No tracker hint configured. If input looks like a tracker ticket ID, treat it as inline text and ask the user to paste content.',
        'For file paths: read the file',
        'For inline text: use as-is',
        `Read the project context document (${args.contextDoc}) for conventions`,
        args.archiveDir
          ? `Scan ${args.archiveDir} for previous PRD examples — style inspiration only`
          : 'Skip archive inspection — none configured'
      ],
      outputFormat: 'JSON with keys: sourceType (string: tracker|file|text), rawTask (string), summary (string), projectContext (string)'
    },
    outputSchema: {
      type: 'object',
      required: ['sourceType', 'rawTask'],
      properties: {
        sourceType: { type: 'string' },
        rawTask: { type: 'string' },
        summary: { type: 'string' },
        projectContext: { type: 'string' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'phase-1', 'load-source']
}));

export const fiveWhysTask = defineTask('five-whys', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Five Whys — root-cause analysis',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Root-cause analyst running a Five Whys pass',
      task: 'Perform Five Whys on the raw task to dig past the surface request before any solution.',
      context: { rawTask: args.rawTask },
      instructions: [
        'Why is this a problem?',
        'Why does it happen?',
        'Why was it not caught earlier?',
        'Why does the current design allow it?',
        'Why is the proposed solution the right one (if one was proposed)?',
        'Identify gaps that need user clarification — these become the question queue for Phase 1 Q&A'
      ],
      outputFormat: 'JSON with keys: analysis (markdown), openQuestions (array of strings)'
    },
    outputSchema: {
      type: 'object',
      required: ['analysis', 'openQuestions'],
      properties: {
        analysis: { type: 'string' },
        openQuestions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'phase-1', 'five-whys']
}));

export const clarificationLoopTask = defineTask('clarification-loop', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Interactive clarification loop',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Clarification-loop driver running an interactive Q&A pass',
      task: 'Run the interactive clarification loop. Ask one question at a time, in English, with explanation + recommendation + 2-4 options. Track every Q&A in a Decision Log with attribution.',
      context: { rawTask: args.rawTask, fiveWhys: args.fiveWhys, contextDoc: args.contextDoc },
      instructions: [
        'Use the harness interactive Q&A mechanism (e.g., AskUserQuestion). Ask one question at a time.',
        'Each question MUST include: short explanation of what is unclear + why it matters + recommendation + 2-4 options. Language: English.',
        'Iterate over the open questions from the Five Whys analysis until all are resolved or explicitly marked out-of-scope by the user',
        'User may answer directly OR say "I will ask <stakeholder>" — wait for them to paste back the answer; tag the entry with that stakeholder in the Decision Log',
        'Detect scope as a side-effect: which layers are affected (data-pipeline, backend, frontend, infra, docs)',
        'Maintain a running Decision Log: each entry has question, answer, attribution (user / <stakeholder name>)',
        'When all questions are resolved, summarize: problem summary, scope, constraints, decision-log entries, any remaining open questions'
      ],
      outputFormat: 'JSON with keys: problemSummary (string), scope (array of strings), constraints (array of strings), entries (array of {question, answer, attribution}), openQuestions (array of strings)'
    },
    outputSchema: {
      type: 'object',
      required: ['problemSummary', 'scope', 'entries'],
      properties: {
        problemSummary: { type: 'string' },
        scope: { type: 'array', items: { type: 'string' } },
        constraints: { type: 'array', items: { type: 'string' } },
        entries: { type: 'array', items: { type: 'object' } },
        openQuestions: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'phase-1', 'clarification']
}));

export const codebaseScanTask = defineTask('codebase-scan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Parallel codebase scan over locked scope',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Codebase scanner enumerating affected files for a locked scope',
      task: 'Launch one subagent per affected layer to scan files in scope. Report exact file paths and line numbers for everything relevant.',
      context: { scope: args.scope, contextDoc: args.contextDoc },
      instructions: [
        `Layers in scope: ${(args.scope || []).join(', ')}`,
        'For each layer, scan the relevant files: data-pipeline (transforms, configs, schemas), backend (services, schemas, queues), frontend (components, types, API calls), infra (IaC, deployment configs), docs (relevant pages)',
        'Report exact file paths and line numbers',
        'Do NOT modify anything'
      ],
      outputFormat: 'JSON with keys: filesByLayer (object of layer -> array of {path, lines, summary}), integrationPoints (array)'
    },
    outputSchema: {
      type: 'object',
      required: ['filesByLayer'],
      properties: {
        filesByLayer: { type: 'object' },
        integrationPoints: { type: 'array' }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'phase-2', 'codebase-scan']
}));

export const draftPrdTask = defineTask('draft-prd', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Draft PRD file',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'PRD author writing a production-ready PRD from clarification and scope-lock results',
      task: `Generate a PRD file at <tasks-dir>/${args.featureBranch}-PRD.md using the Decision Log, Five Whys analysis, and codebase context. Return the absolute PRD path.`,
      context: {
        input: args.input,
        featureBranch: args.featureBranch,
        contextDoc: args.contextDoc,
        archiveDir: args.archiveDir,
        decisionLog: args.decisionLog,
        fiveWhys: args.fiveWhys
      },
      instructions: [
        'The PRD must contain these top-level sections in order:',
        '  1. **Background** — include the Five Whys findings verbatim',
        '  2. **Root Cause** — distilled from the Five Whys',
        '  3. **Agreed Solution** — the locked scope from the Decision Log',
        '  4. **Scope** — exhaustive file list by layer (data-pipeline / backend / frontend / infra / docs as applicable)',
        '  5. **Edge Cases** — every edge case raised during clarification or risk analysis',
        '  6. **Technical Constraints** — performance, security, compatibility, integration',
        '  7. **Data Flow** (if applicable) — diagram or step-by-step description',
        '  8. **Decision Log** — every Q&A from the clarification loop with attribution (user / <stakeholder name>)',
        '  9. **Definition of Done** — testable, exhaustive checklist',
        '  10. **Open Questions** — any clarifications that remain unresolved',
        'The PRD must be proportional to the task size — concise for a 1-line fix, detailed for a multi-layer feature',
        `Resolve the tasks-dir from project conventions (read ${args.contextDoc}); fall back to docs/active/ if unspecified`,
        args.archiveDir
          ? `Reference style from previous PRDs in ${args.archiveDir} for inspiration only — never as a rigid template`
          : 'No PRD archive configured — write fresh',
        'Do NOT create a SPEC — only a PRD. The /prd-to-spec skill is the next step.',
        'Return the absolute PRD file path; if there is a hard error, report it without silent continuation'
      ],
      outputFormat: 'JSON with keys: prdPath (string), generatedSections (array of strings)'
    },
    outputSchema: {
      type: 'object',
      required: ['prdPath'],
      properties: {
        prdPath: { type: 'string' },
        generatedSections: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'phase-2', 'draft-prd']
}));

export const whatCouldGoWrongTask = defineTask('what-could-go-wrong', (args, taskCtx) => ({
  kind: 'agent',
  title: 'What-could-go-wrong analysis',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Risk analyst identifying ways the proposed solution can fail',
      task: `Read the PRD at ${args.prdPath} and identify what could go wrong with the proposed solution.`,
      context: { prdPath: args.prdPath },
      instructions: [
        'Identify downstream consumers affected',
        'Find hidden dependencies',
        'List edge cases not covered in the PRD',
        'Assess rollback complexity',
        'For each finding: severity (critical|high|medium|low), suggested PRD change'
      ],
      outputFormat: 'JSON with keys: findings (array of {severity, message, suggestedChange})'
    },
    outputSchema: { type: 'object', required: ['findings'], properties: { findings: { type: 'array', items: { type: 'object' } } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'phase-3', 'verification', 'risk-analysis']
}));

export const codebaseConsistencyTask = defineTask('codebase-consistency', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Codebase consistency check',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Verification agent comparing PRD claims to actual code',
      task: `Verify every PRD claim against actual code (file paths, line numbers, identifiers, signatures). PRD: ${args.prdPath}.`,
      context: { prdPath: args.prdPath, scanResult: args.scanResult },
      instructions: [
        'For each file/line reference in the PRD, verify it exists in the code',
        'For each function/class/CTE/column name, verify correctness',
        'Cross-check against the codebase scan results',
        'Each discrepancy is a finding requiring user approval before applying any PRD change'
      ],
      outputFormat: 'JSON with keys: findings (array of {severity, message, suggestedChange})'
    },
    outputSchema: { type: 'object', required: ['findings'], properties: { findings: { type: 'array', items: { type: 'object' } } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'phase-3', 'verification', 'consistency']
}));

export const conventionsCheckTask = defineTask('conventions-check', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Project conventions check',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Conventions reviewer comparing the PRD against the project guide',
      task: `Verify the PRD aligns with project conventions. PRD: ${args.prdPath}, conventions doc: ${args.contextDoc}.`,
      context: { prdPath: args.prdPath, contextDoc: args.contextDoc },
      instructions: [
        `Read ${args.contextDoc} (e.g., CLAUDE.md, AGENTS.md, CONTRIBUTING.md, project style guide)`,
        'Check that the proposed solution follows the project\'s naming, structure, and style rules',
        'Flag any convention violations'
      ],
      outputFormat: 'JSON with keys: findings (array of {severity, message, suggestedChange})'
    },
    outputSchema: { type: 'object', required: ['findings'], properties: { findings: { type: 'array', items: { type: 'object' } } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'phase-3', 'verification', 'conventions']
}));

export const adversarialReviewTask = defineTask('adversarial-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Adversarial review (attacker + defender)',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Adversarial reviewer running an attacker/defender loop on the PRD',
      task: `One reviewer attacks the PRD; another defends. Iterate until no new issues.  PRD: ${args.prdPath}.`,
      context: { prdPath: args.prdPath },
      instructions: [
        'Attacker: look for flaws, missed edge cases, performance issues, security issues, data integrity issues',
        'Defender: justify or refine the PRD',
        'Iterate until the attacker has no new findings',
        'Report converged findings — each one with severity and suggested PRD change'
      ],
      outputFormat: 'JSON with keys: findings (array of {severity, message, suggestedChange})'
    },
    outputSchema: { type: 'object', required: ['findings'], properties: { findings: { type: 'array', items: { type: 'object' } } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'phase-3', 'verification', 'adversarial']
}));

export const qualityChecklistTask = defineTask('quality-checklist', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Quality checklist auto-generation + validation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Quality reviewer auto-generating and validating a PRD-specific checklist',
      task: `Auto-generate a quality checklist tailored to this PRD type and validate against it. PRD: ${args.prdPath}.`,
      context: { prdPath: args.prdPath },
      instructions: [
        'Dimensions: completeness, clarity, testability, consistency',
        'Generate checklist items specific to this PRD type and scope',
        'Validate the PRD against each item',
        'Report failures as findings with suggested fixes'
      ],
      outputFormat: 'JSON with keys: checklist (array of {item, passed}), findings (array of {severity, message, suggestedChange})'
    },
    outputSchema: { type: 'object', required: ['findings'], properties: { checklist: { type: 'array' }, findings: { type: 'array', items: { type: 'object' } } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'phase-3', 'verification', 'quality-checklist']
}));

export const secondaryReviewerTask = defineTask('secondary-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Secondary review (optional, configurable reviewer)',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Independent reviewer running a configurable secondary review of the PRD',
      task: `Run the secondary reviewer "${args.reviewerHint}" against the PRD at ${args.prdPath}.`,
      context: { prdPath: args.prdPath, reviewerHint: args.reviewerHint },
      instructions: [
        `Reviewer hint: "${args.reviewerHint}". Map this to an available reviewer in your environment.`,
        'Examples: "codex" → Codex CLI review, "gemini" → Gemini review, "deep-verify-plan" → /deep-verify-plan, "peer" → notify a teammate and wait for response',
        'If the named reviewer is not available, set unavailable: true and skip — do not silently substitute',
        'Surface CRITICAL/HIGH findings clearly'
      ],
      outputFormat: 'JSON with keys: summary (string), findings (array of {severity, message, suggestedChange}), unavailable (boolean)'
    },
    outputSchema: {
      type: 'object',
      required: ['summary'],
      properties: { summary: { type: 'string' }, findings: { type: 'array', items: { type: 'object' } }, unavailable: { type: 'boolean' } }
    }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'phase-3', 'secondary-review', 'optional']
}));

export const applyFindingsTask = defineTask('apply-findings', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Apply approved findings to the PRD (per-finding gated)',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'PRD editor applying user-approved changes from verification findings',
      task: `Walk the user through each finding for ${args.prdPath} one at a time. For each: present finding + current PRD text + proposed change + recommendation. Apply only approved changes.`,
      context: { prdPath: args.prdPath, findings: args.findings },
      instructions: [
        'For each finding: present (severity, message, currentPrdText, suggestedChange, recommendation)',
        'Decision options per finding: approve / reject / modify',
        'Apply only approved changes',
        'After every batch of changes, re-verify the PRD passes the original quality checklist'
      ],
      outputFormat: 'JSON with keys: appliedCount (number), rejectedCount (number), modifiedCount (number)'
    },
    outputSchema: { type: 'object', required: ['appliedCount'], properties: { appliedCount: { type: 'number' }, rejectedCount: { type: 'number' }, modifiedCount: { type: 'number' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'phase-3', 'apply-findings']
}));

export const updateTrackerTask = defineTask('update-tracker', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update tracker ticket with PRD reference',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Tracker integration agent updating the source ticket',
      task: `Update the source tracker ticket "${args.input}" with a reference to the PRD at ${args.prdPath}.`,
      context: { input: args.input, prdPath: args.prdPath, trackerHint: args.trackerHint },
      instructions: [
        `Tracker hint: "${args.trackerHint}". Examples: Jira (/jira skill or acli jira workitem update), Linear (linear-cli or MCP), GitHub Issues (gh issue edit).`,
        'Append a reference to the PRD path or PR link, depending on the tracker',
        'Do NOT change the ticket status unless the user explicitly approves it',
        'If the tracker integration is unavailable, report unavailable: true and skip'
      ],
      outputFormat: 'JSON with keys: updated (boolean), unavailable (boolean), summary (string)'
    },
    outputSchema: { type: 'object', required: ['updated'], properties: { updated: { type: 'boolean' }, unavailable: { type: 'boolean' }, summary: { type: 'string' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'phase-4', 'tracker-update', 'optional']
}));

export const generateFollowupPromptTask = defineTask('generate-followup-prompt', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Generate /prd-to-spec follow-up prompt',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Prompt generator emitting the next-step follow-up',
      task: 'Output a 2-line follow-up prompt suitable for direct chat output (NOT a file).',
      context: { prdPath: args.prdPath, contextDoc: args.contextDoc },
      instructions: [
        `Prompt template: "Read ${args.contextDoc} for context. Then run /prd-to-spec ${args.prdPath}"`,
        'Output as plain text — no formatting, no file write'
      ],
      outputFormat: 'JSON with keys: prompt (string)'
    },
    outputSchema: { type: 'object', required: ['prompt'], properties: { prompt: { type: 'string' } } }
  },
  io: { inputJsonPath: `tasks/${taskCtx.effectId}/input.json`, outputJsonPath: `tasks/${taskCtx.effectId}/result.json` },
  labels: ['agent', 'phase-4', 'followup-prompt']
}));
