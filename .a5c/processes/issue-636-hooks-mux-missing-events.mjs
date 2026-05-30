/**
 * @process repo/issue-636-hooks-mux-missing-events
 * @description Implement issue #636: add the 13 missing Claude Code hook events to hooks-mux and related runtime emission surfaces.
 * @inputs { issueNumber: number, baseBranch: string, branchName: string, targetEvents: object[], targetFiles: string[], verificationCommands: string[] }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], verification: object, review: object, delivery: object }
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Matching existing infrastructure found in hooks-mux canonical lifecycle types, Claude adapter catalog-backed mappings, normalizer/renderer tests,
 *   atlas hook mappings, agent-catalog SDK descriptors, SDK runtime hook dispatch, task intrinsic/result commit paths, and agent-platform orchestration effects.
 * - `.a5c/process-library/` was not present in this checkout when this plan was refreshed; matching process-library methodology guidance was found under
 *   `library/methodologies/atdd-tdd/atdd-tdd.js`, `library/methodologies/process-hardening/process-hardening-patterns.js`, and
 *   `library/methodologies/superpowers/verification-before-completion.js`.
 * - No `.a5c/reuse-audit.json` was present; keyword scan used: hook, mux, lifecycle, canonical phase, Claude, atlas, config changed,
 *   PostToolUseFailure, PostToolBatch, StopFailure, UserPromptExpansion, TaskCreated, TaskCompleted, TeammateIdle, Setup, InstructionsLoaded.
 * - The 13 target entries are treated as the 10 Claude Code lifecycle gaps/blocking gaps named by issue #636 plus 3 lower-priority advanced Atlas gaps
 *   documented in `docs/agent-stack/hooks/missing-events.md`; contract reconciliation must separate representation support from runtime emission support.
 *
 * References used while authoring:
 * - docs/agent-stack/hooks/missing-events.md
 * - docs/agent-stack/hooks/coverage-matrix.md
 * - docs/agent-reference/process-authoring.md
 * - library/methodologies/atdd-tdd/atdd-tdd.js
 * - library/methodologies/process-hardening/process-hardening-patterns.js
 * - library/methodologies/superpowers/verification-before-completion.js
 *
 * @process methodologies/atdd-tdd/atdd-tdd
 * @process methodologies/process-hardening/process-hardening-patterns
 * @process methodologies/superpowers/verification-before-completion
 * @agent platform-architect specializations/sdk-platform-development/agents/platform-architect/AGENT.md
 * @agent test-strategy-architect specializations/qa-testing-automation/agents/test-strategy-architect/AGENT.md
 * @agent compatibility-auditor specializations/sdk-platform-development/agents/compatibility-auditor/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const MAX_IMPLEMENTATION_ATTEMPTS = 3;

function approved(result) {
  return result?.passed === true || result?.approved === true || result?.success === true;
}

const readIssueAndReuseAuditTask = defineTask('issue-636.read-issue-and-reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #636 and perform reuse audit',
  labels: ['issue-636', 'hooks-mux', 'context', 'reuse-audit'],
  agent: {
    name: 'hooks-mux-context-researcher',
    prompt: {
      role: 'senior hooks-mux and Babysitter platform maintainer',
      task: 'Read the issue, referenced docs, and existing hook infrastructure before any design or implementation work.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `If #${args.issueNumber} is a PR rather than an issue, also run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'Read docs/agent-stack/hooks/missing-events.md and docs/agent-stack/hooks/coverage-matrix.md in full.',
        'Research process-library guidance. The prompt requested .a5c/process-library/; if that directory is absent, record that fact and use the checked-in library/ methodologies that match this task.',
        'Run the repo-specific plan reuse audit from docs/agent-reference/process-authoring.md before drafting implementation work.',
        'Extract keyword nouns and verbs from the issue and scan existing migrations, APIs, SDK dependencies, imports, atlas hook mappings, canonical phase types, adapters, normalizers, renderers, runtime hook dispatch, task effect handling, and instruction discovery code.',
        'Render a section exactly titled: Reuse-audit findings (REVIEW BEFORE PROCEEDING). Include matching existing infrastructure and note explicitly if no matching infrastructure exists for a target surface.',
        'Do not edit files.',
        'Return JSON: { title, labels, issueBody, comments, referencedDocs, processLibraryFindings, reuseAudit, acceptanceCriteria, eventInventory, likelyFiles, knownAmbiguities, nonGoals }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reconcileContractTask = defineTask('issue-636.reconcile-hook-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Reconcile hook event contract and ambiguity list',
  labels: ['issue-636', 'contract', 'atlas', 'quality-gate'],
  agent: {
    name: 'hooks-mux-contract-architect',
    prompt: {
      role: 'senior event-contract architect',
      task: 'Produce the authoritative implementation contract for all 13 events before code changes.',
      instructions: [
        'Use the issue context and reuse audit below as source material:',
        JSON.stringify(args.context, null, 2),
        'Target events from process inputs:',
        JSON.stringify(args.targetEvents, null, 2),
        'Reconcile docs/agent-stack/hooks/missing-events.md with the atlas graph mappings under packages/atlas/graph/channels-hooks/ and the generated agent-catalog descriptor behavior.',
        'Pay special attention to known conflicts: PostToolUseFailure blockability, PostToolBatch blockability, and ConfigChange canonical spelling (session.config_changed vs session.config_change).',
        'For each event, define canonical phase, native name, scope, block capability, mutation/additionalContext support, payload keys, matcher fields, renderer behavior, and whether runtime emission outside hooks-mux is required.',
        'Prefer existing canonical names in docs/agent-stack/hooks/missing-events.md when atlas data conflicts, but flag any conflict that could break generated catalog consumers.',
        'If a maintainer decision is genuinely required, set needsMaintainerDecision true and provide one precise question. Otherwise set it false.',
        'Return JSON: { eventContracts, atlasUpdates, coreTypeUpdates, adapterUpdates, rendererUpdates, runtimeEmissionUpdates, testExpectations, needsMaintainerDecision, question, risks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const authorRegressionTestsTask = defineTask('issue-636.author-regression-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Author failing hook coverage regression tests',
  labels: ['issue-636', 'tests', 'atdd', 'hooks-mux'],
  agent: {
    name: 'hooks-mux-test-architect',
    prompt: {
      role: 'senior TypeScript test engineer',
      task: 'Add focused failing tests that specify the 13-event hook contract before implementation changes.',
      instructions: [
        'Edit only test files and fixture files in this task.',
        'Use the reconciled contract below:',
        JSON.stringify(args.contract, null, 2),
        'Cover canonical phase union validity, Claude mapping presence, block/mutation capabilities, payload normalization, renderer behavior for blockable/non-blockable outputs, CLI invoke inference where applicable, and compatibility fixtures.',
        'Add tests in existing co-located suites rather than creating a new harness unless current structure requires it.',
        'Tests should prove the gaps from issue #636 and should fail before implementation.',
        'Do not implement production code in this task.',
        'Return JSON: { changedFiles, testsAdded, expectedInitialFailures, coverageByEvent, commandsToRun }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementHooksMuxTask = defineTask('issue-636.implement-hooks-mux', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement hooks-mux event support',
  labels: ['issue-636', 'implementation', 'hooks-mux'],
  agent: {
    name: 'hooks-mux-implementer',
    prompt: {
      role: 'senior TypeScript hooks-mux maintainer',
      task: 'Implement the hooks-mux and atlas/agent-catalog portions of issue #636.',
      instructions: [
        'Edit the repository directly. Keep changes scoped to issue #636.',
        'Use the reconciled contract and failing tests below:',
        JSON.stringify({ contract: args.contract, regressionTests: args.regressionTests }, null, 2),
        'Update CanonicalPhase and LifecycleScope as needed for tool.after_failure, tool.after_batch, turn.stop_failure, turn.prompt_expansion, task.created, task.completed, team.idle, session.setup, session.instructions_loaded, session.config_changed blocking support, message.received formal coverage, and Gemini-only model/planner phases if not already sufficiently typed.',
        'Update atlas hook mappings and generated agent-catalog-facing data so Claude mappings expose the 13 target events with the agreed canonical phases and capabilities.',
        'Update Claude adapter payload types, buildPayload normalization, execution context fields, mapping tests, renderer support, and CLI native-event inference where safe and deterministic.',
        'Preserve existing behavior for already supported events and adapter families.',
        'Do not broaden this task to unrelated hook capabilities from docs/agent-stack/hooks/missing-capabilities.md.',
        'Return JSON: { changedFiles, summary, eventCoverage, compatibilityNotes, verificationCommands }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementRuntimeEmissionTask = defineTask('issue-636.implement-runtime-emission', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement SDK and agent-platform runtime emission wiring',
  labels: ['issue-636', 'implementation', 'sdk', 'agent-platform'],
  agent: {
    name: 'runtime-hook-emission-implementer',
    prompt: {
      role: 'senior Babysitter SDK and agent-platform runtime engineer',
      task: 'Wire runtime emission points required by the issue after hooks-mux can represent the events.',
      instructions: [
        'Edit the repository directly. Keep changes scoped to runtime hook emission needed by issue #636.',
        'Use the reconciled contract below:',
        JSON.stringify(args.contract, null, 2),
        'Trace and update existing dispatch surfaces rather than inventing a parallel event system: packages/sdk/src/runtime/hooks/runtime.ts, packages/sdk/src/runtime/intrinsics/task.ts, packages/sdk/src/runtime/orchestrateIteration.ts, packages/sdk/src/runtime/processContext.ts, packages/sdk/src/prompts/babysitterMdDiscovery or instruction-loading callers, packages/agent-platform/src hook call sites, and packages/agent-core session error paths as applicable.',
        'Implement only the emission points that are concretely required and testable in this repo. If multi-agent TeammateIdle infrastructure is not present, add the hooks-mux representation and a documented no-runtime-emitter gap instead of fabricating lifecycle behavior.',
        'Ensure blockable runtime events actually honor deny/ask/continue semantics where the contract says they can block, especially task.created, task.completed, turn.prompt_expansion, tool.after_batch, and session.config_changed.',
        'Non-blocking events must be fail-open and must not alter control flow except for additionalContext propagation where supported.',
        'Return JSON: { changedFiles, runtimeCallPaths, blockSemantics, unimplementedRuntimeGaps, summary, verificationCommands }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-636.verify', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run deterministic verification gates',
  labels: ['issue-636', 'verification', 'quality-gate'],
  agent: {
    name: 'hooks-mux-verifier',
    prompt: {
      role: 'senior CI and release verification engineer',
      task: 'Run fresh verification and report evidence without claiming success unless commands pass.',
      instructions: [
        'Run the verification commands exactly as listed unless a command is unavailable; if unavailable, record the exact blocker and choose the closest targeted command.',
        JSON.stringify(args.verificationCommands, null, 2),
        'At minimum verify hooks-mux build/test/lint, SDK build/test for runtime emission changes, metadata/catalog generation checks, and git diff --check.',
        'Read full command output, record exit codes, and count failures. Do not summarize a failing command as passed.',
        'Also verify that every target event has explicit test coverage and that coverage-matrix/missing-events docs remain accurate or are updated if implementation changes their status.',
        'Return JSON: { passed, commandResults, eventCoverage, docsStatus, evidenceGaps, changedFiles }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-636.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review implementation against issue contract',
  labels: ['issue-636', 'review', 'quality-gate'],
  agent: {
    name: 'hooks-mux-contract-reviewer',
    prompt: {
      role: 'senior hooks-mux code reviewer',
      task: 'Review the final diff against issue #636, the reconciled contract, and verification evidence.',
      instructions: [
        'Use a code-review stance. Findings first, ordered by severity, with file/line references.',
        'Compare implementation to the 13 target event contracts directly. Ignore optimistic implementation summaries if the diff or tests disagree.',
        'Check for regressions in existing Claude events, adapter-family compatibility, atlas/generated catalog consistency, blocking semantics, output rendering, and runtime fail-open behavior.',
        'Inputs:',
        JSON.stringify({ contract: args.contract, verification: args.verification }, null, 2),
        'Return JSON: { approved, findings, missingCoverage, residualRisks, summary }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const repairTask = defineTask('issue-636.repair', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Repair verification or review gaps',
  labels: ['issue-636', 'repair', 'implementation'],
  agent: {
    name: 'hooks-mux-repair-engineer',
    prompt: {
      role: 'senior TypeScript maintainer',
      task: 'Repair only the concrete gaps found by verification or review.',
      instructions: [
        'Edit the repository directly. Keep the repair narrowly scoped.',
        'Contract, verification, and review context:',
        JSON.stringify({ contract: args.contract, verification: args.verification, review: args.review, attempt: args.attempt }, null, 2),
        'Do not rewrite unrelated architecture. Add or adjust tests first when the gap is behavioral.',
        'Return JSON: { changedFiles, fixes, remainingRisks, verificationCommands }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const deliveryTask = defineTask('issue-636.delivery', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Commit, push, PR, and issue update',
  labels: ['issue-636', 'delivery', 'github'],
  agent: {
    name: 'github-delivery-engineer',
    prompt: {
      role: 'senior maintainer responsible for GitHub delivery',
      task: 'Prepare the implementation branch for review after all gates pass.',
      instructions: [
        'Only proceed if verification.passed is true and review.approved is true.',
        'Do not stage unrelated dirty worktree files.',
        `Use branch ${args.branchName} based on ${args.baseBranch}.`,
        'Commit the scoped implementation and tests with a concise issue-linked message.',
        `Push the branch and create a PR against ${args.baseBranch} with a title that starts with "Fix:". Link to #${args.issueNumber}.`,
        `Post a comment on #${args.issueNumber} summarizing implemented events, verification commands, residual gaps if any, and the PR link.`,
        'Return JSON: { delivered, commit, prUrl, issueCommentUrl, skippedReason }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 636;
  const baseBranch = inputs?.baseBranch ?? 'staging';
  const branchName = inputs?.branchName ?? 'agent/issue-636-hooks-mux-missing-events';
  const targetEvents = inputs?.targetEvents ?? [];
  const verificationCommands = inputs?.verificationCommands ?? [
    'npm run build:hooks-mux',
    'npm run test:hooks-mux',
    'npm run lint:hooks-mux',
    'npm run build:sdk',
    'npm run test:sdk',
    'npm run verify:metadata',
    'git diff --check',
  ];

  const context = await ctx.task(readIssueAndReuseAuditTask, {
    issueNumber,
    targetEvents,
  }, {
    key: 'issue-636.context-and-reuse-audit',
  });

  const contract = await ctx.task(reconcileContractTask, {
    context,
    targetEvents,
  }, {
    key: 'issue-636.contract',
  });

  if (contract?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #636 Hook Contract Decision',
      question: contract.question,
      options: ['Use documented issue contract', 'Use atlas graph contract', 'Pause for maintainer guidance'],
      expert: 'maintainer',
      tags: ['issue-636', 'contract', 'hooks-mux'],
      context: {
        issueNumber,
        branchName,
        conflicts: contract?.risks ?? [],
      },
    });
  }

  const regressionTests = await ctx.task(authorRegressionTestsTask, {
    contract,
  }, {
    key: 'issue-636.regression-tests',
  });

  const hooksMuxImplementation = await ctx.task(implementHooksMuxTask, {
    contract,
    regressionTests,
  }, {
    key: 'issue-636.hooks-mux-implementation',
  });

  const runtimeImplementation = await ctx.task(implementRuntimeEmissionTask, {
    contract,
    hooksMuxImplementation,
  }, {
    key: 'issue-636.runtime-emission',
  });

  let verification = await ctx.task(verifyTask, {
    verificationCommands,
    contract,
    implementations: [hooksMuxImplementation, runtimeImplementation],
  }, {
    key: 'issue-636.verification.1',
  });

  let review = await ctx.task(reviewTask, {
    contract,
    verification,
  }, {
    key: 'issue-636.review.1',
  });

  const repairs = [];
  for (let attempt = 2; attempt <= MAX_IMPLEMENTATION_ATTEMPTS; attempt += 1) {
    if (approved(verification) && approved(review)) {
      break;
    }

    const repair = await ctx.task(repairTask, {
      contract,
      verification,
      review,
      attempt,
    }, {
      key: `issue-636.repair.${attempt}`,
    });
    repairs.push(repair);

    verification = await ctx.task(verifyTask, {
      verificationCommands,
      contract,
      repair,
    }, {
      key: `issue-636.verification.${attempt}`,
    });

    review = await ctx.task(reviewTask, {
      contract,
      verification,
      repair,
    }, {
      key: `issue-636.review.${attempt}`,
    });
  }

  if (!approved(verification) || !approved(review)) {
    await ctx.breakpoint({
      title: 'Issue #636 Quality Gate Failed',
      question: 'Verification or review is still failing after repair attempts. Choose how to proceed.',
      options: ['Pause for maintainer guidance', 'Continue repairs manually in this run'],
      expert: 'maintainer',
      tags: ['issue-636', 'quality-gate'],
      context: {
        issueNumber,
        verification,
        review,
        repairs,
      },
    });
  }

  const delivery = approved(verification) && approved(review)
    ? await ctx.task(deliveryTask, {
      issueNumber,
      baseBranch,
      branchName,
      verification,
      review,
    }, {
      key: 'issue-636.delivery',
    })
    : { delivered: false, skippedReason: 'quality gate did not pass' };

  return {
    success: approved(verification) && approved(review) && delivery?.delivered !== false,
    phases: [
      'issue-context-and-reuse-audit',
      'contract-reconciliation',
      'regression-tests',
      'hooks-mux-implementation',
      'runtime-emission',
      'verification',
      'review',
      'delivery',
    ],
    changedFiles: [
      ...(regressionTests?.changedFiles ?? []),
      ...(hooksMuxImplementation?.changedFiles ?? []),
      ...(runtimeImplementation?.changedFiles ?? []),
      ...repairs.flatMap((repair) => repair?.changedFiles ?? []),
    ],
    context,
    contract,
    regressionTests,
    hooksMuxImplementation,
    runtimeImplementation,
    repairs,
    verification,
    review,
    delivery,
  };
}
