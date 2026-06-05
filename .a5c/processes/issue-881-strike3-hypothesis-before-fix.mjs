/**
 * @process repo/issue-881-strike3-hypothesis-before-fix
 * @description Implement issue #881: enforce a Strike-3 post-instrumentation interpretation contract requiring hypotheses before fixes.
 * @inputs { issueNumber: number, baseBranch: string, implementationBranch: string, maxAttempts?: number, targetFiles: string[], verificationCommands: string[], contractTerms: object }
 * @outputs { success: boolean, phases: string[], changedFiles: string[], reuseAudit: object, design: object, verification: object, review: object, delivery: object }
 *
 * References used while authoring:
 * - docs/agent-reference/process-authoring.md
 * - library/specializations/qa-testing-automation/diagnostic-first-phase.js
 * - library/specializations/qa-testing-automation/diagnostic-first-phase.md
 * - library/processes/shared/n-strikes-escalation.js
 * - library/methodologies/shared/root-cause-diagnosis.js
 * - library/methodologies/gsd/debug.js
 * - library/methodologies/cc10x/cc10x-debug.js
 * - library/methodologies/rpikit/skills/systematic-debugging/SKILL.md
 * - methodologies/superpowers/verification-before-completion
 * - methodologies/process-hardening/process-hardening-patterns
 *
 * Reuse-audit findings (REVIEW BEFORE PROCEEDING):
 * - Existing diagnostic-first guidance lives in library/specializations/qa-testing-automation/diagnostic-first-phase.js and .md. It requires live evidence before code changes but currently reports only a top hypothesis and recommendation.
 * - Existing shared root-cause diagnosis lives in library/methodologies/shared/root-cause-diagnosis.js. It requires one precise hypothesis and 2+ evidence signals, not 3+ competing post-instrumentation hypotheses with falsifying log observations.
 * - Existing debugging methodologies in library/methodologies/gsd/debug.js, library/methodologies/cc10x/cc10x-debug.js, and library/methodologies/rpikit/skills/systematic-debugging/SKILL.md contain adjacent hypothesis/evidence discipline.
 * - Existing escalation primitive library/processes/shared/n-strikes-escalation.js handles multi-strike review/fix loops but has no Strike-3 interpretation contract.
 * - No dedicated instrumentation-deploy skill, hypothesis-before-fix contract, falsifying-log contract, seq-number citation requirement, or needs-more-data rejection rule was found in the inspected repo/library surfaces.
 * - No matching API route, migration, environment variable, or new SDK dependency is needed; this is a process-library prompt/schema/test hardening change.
 *
 * @process specializations/qa-testing-automation/diagnostic-first-phase
 * @process methodologies/shared/root-cause-diagnosis
 * @process methodologies/gsd/debug
 * @process methodologies/cc10x/cc10x-debug
 * @process processes/shared/n-strikes-escalation
 * @process methodologies/superpowers/verification-before-completion
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const DEFAULT_MAX_ATTEMPTS = 3;

function stdoutOf(result) {
  return result?.stdout ?? result?.value?.stdout ?? '';
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`;
}

function targetFileArgs(files = []) {
  return files.map(shellQuote).join(' ');
}

export async function process(inputs, ctx) {
  const maxAttempts = inputs.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  const issueSpec = await ctx.task(readIssueSpecTask, inputs, {
    key: 'issue-881.read-issue-spec',
  });

  const reuseAudit = await ctx.task(reuseAuditTask, {
    inputs,
    issueSpecStdout: stdoutOf(issueSpec),
  }, {
    key: 'issue-881.reuse-audit',
  });

  const libraryResearch = await ctx.task(libraryResearchTask, {
    inputs,
    issueSpecStdout: stdoutOf(issueSpec),
    reuseAuditStdout: stdoutOf(reuseAudit),
  }, {
    key: 'issue-881.library-research',
  });

  const design = await ctx.task(designContractTask, {
    inputs,
    issueSpecStdout: stdoutOf(issueSpec),
    reuseAuditStdout: stdoutOf(reuseAudit),
    libraryResearchStdout: stdoutOf(libraryResearch),
  }, {
    key: 'issue-881.contract-design',
  });

  let implementation = null;
  let verification = null;
  let artifacts = null;
  let review = null;
  const attempts = [];

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    implementation = await ctx.task(implementContractTask, {
      inputs,
      issueSpecStdout: stdoutOf(issueSpec),
      reuseAuditStdout: stdoutOf(reuseAudit),
      libraryResearchStdout: stdoutOf(libraryResearch),
      design,
      previousVerification: verification,
      previousReview: review,
      attempt,
    }, {
      key: `issue-881.implementation.${attempt}`,
    });

    verification = await ctx.task(verifyContractTask, {
      inputs,
      implementation,
      attempt,
    }, {
      key: `issue-881.verification.${attempt}`,
    });

    artifacts = await ctx.task(readArtifactsTask, {
      inputs,
      implementation,
      verification,
      attempt,
    }, {
      key: `issue-881.artifacts.${attempt}`,
    });

    review = await ctx.task(reviewContractTask, {
      inputs,
      issueSpecStdout: stdoutOf(issueSpec),
      reuseAuditStdout: stdoutOf(reuseAudit),
      libraryResearchStdout: stdoutOf(libraryResearch),
      design,
      implementation,
      verification,
      artifactsStdout: stdoutOf(artifacts),
      attempt,
    }, {
      key: `issue-881.review.${attempt}`,
    });

    attempts.push({ attempt, implementation, verification, review });

    if (verification?.passed === true && review?.approved === true) {
      break;
    }
  }

  const finalGate = await ctx.task(finalAcceptanceTask, {
    inputs,
    issueSpecStdout: stdoutOf(issueSpec),
    design,
    implementation,
    verification,
    review,
    artifactsStdout: stdoutOf(artifacts),
    attempts,
  }, {
    key: 'issue-881.final-acceptance',
  });

  if (finalGate?.needsMaintainerDecision === true) {
    await ctx.breakpoint({
      title: 'Issue #881 Needs Maintainer Decision',
      question: finalGate.question,
      options: ['Proceed with recommended scope', 'Pause for maintainer guidance'],
      expert: 'owner',
      tags: ['issue-881', 'strike-3', 'hypothesis-before-fix'],
      context: { runId: ctx.runId, finalGate, attempts: attempts.length },
    });
  }

  const delivery = finalGate?.passed === true
    ? await ctx.task(deliverTask, {
      inputs,
      design,
      implementation,
      verification,
      review,
      finalGate,
    }, {
      key: 'issue-881.delivery',
    })
    : null;

  return {
    success: finalGate?.passed === true,
    phases: [
      'issue-spec',
      'reuse-audit',
      'library-research',
      'contract-design',
      'implementation-loop',
      'deterministic-verification',
      'artifact-review',
      'final-acceptance',
      'delivery',
    ],
    changedFiles: finalGate?.changedFiles ?? implementation?.changedFiles ?? [],
    reuseAudit,
    libraryResearch,
    design,
    implementation,
    verification,
    review,
    attempts,
    finalGate,
    delivery,
  };
}

export const readIssueSpecTask = defineTask('issue-881.read-issue-spec', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read issue #881 and linked PR context verbatim',
  labels: ['issue-881', 'spec', 'github'],
  agent: {
    name: 'issue-spec-reader',
    prompt: {
      role: 'GitHub issue researcher',
      task: 'Read issue #881 and any PR context verbatim. Do not edit files.',
      instructions: [
        `Run: gh issue view ${args.issueNumber} --json title,body,labels,comments`,
        `Run: gh pr view ${args.issueNumber} --json files,title,body,comments`,
        'If the PR command reports that no PR exists, record that exact outcome rather than treating it as a failure.',
        'Run: git status --short --branch',
        'Return JSON: { stdout } where stdout contains the issue JSON, a pr-context-if-present section, and a git-status section.',
      ],
    },
    outputSchema: {
      type: 'object',
      required: ['stdout'],
      properties: {
        stdout: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reuseAuditTask = defineTask('issue-881.reuse-audit', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run Phase 0 reuse audit for Strike-3 contract surfaces',
  labels: ['issue-881', 'reuse-audit', 'process-library'],
  agent: {
    name: 'reuse-auditor',
    prompt: {
      role: 'brownfield reuse auditor',
      task: 'Run Phase 0 reuse audit for Strike-3 contract surfaces. Do not edit files.',
      instructions: [
        'Render the heading: ## Reuse-audit findings (REVIEW BEFORE PROCEEDING).',
        'If .a5c/reuse-audit.json exists, read it and use its scan guidance; otherwise state that it is absent.',
        'Search docs, library, packages, plugins, scripts, and .a5c/processes for: strike-3, instrumentation-deploy, post-instrumentation, hypothesis-before-fix, falsifying log, seq number, needs-more-data, diagnostic-first, root-cause-diagnosis, n-strikes.',
        'Search environment-variable usage for matching STRIKE, INSTRUMENT, HYPOTH, DIAGNOSTIC, A5C, and BABYSITTER terms.',
        'Read package.json scripts/dependencies enough to identify reusable verification commands and dependency constraints.',
        'Read each candidate target file from inputs.targetFiles if present; record missing targets explicitly.',
        'Return JSON: { stdout } where stdout is a markdown reuse-audit report with matching migrations, routes, env vars, SDKs, prompt surfaces, docs surfaces, tests, and reuse recommendations.',
      ],
      context: {
        issueSpecStdout: args.issueSpecStdout,
        targetFiles: args.inputs.targetFiles,
      },
    },
    outputSchema: {
      type: 'object',
      required: ['stdout'],
      properties: {
        stdout: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const libraryResearchTask = defineTask('issue-881.library-research', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Research active process library methodologies and skills',
  labels: ['issue-881', 'library-research', 'methodology'],
  agent: {
    name: 'process-library-researcher',
    prompt: {
      role: 'Babysitter process-library researcher',
      task: 'Research active process-library methodologies and repo-local Strike-3 surfaces. Do not edit files.',
      instructions: [
        'Run: babysitter process-library:active --json.',
        'Run: babysitter skill:discover --process-path specializations/qa-testing-automation --json.',
        'Search the active library root for Strike-3, instrumentation, hypothesis, falsifying, seq, needs-more-data, diagnostic-first, and root-cause.',
        'Read the active-library shared root-cause diagnosis file if present.',
        'Read repo-local library/specializations/qa-testing-automation/diagnostic-first-phase.js.',
        'Read repo-local library/processes/shared/n-strikes-escalation.js.',
        'Return JSON: { stdout } where stdout contains command/search findings and concise notes about which methodology patterns should be reused.',
      ],
      context: {
        issueSpecStdout: args.issueSpecStdout,
        reuseAuditStdout: args.reuseAuditStdout,
      },
    },
    outputSchema: {
      type: 'object',
      required: ['stdout'],
      properties: {
        stdout: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const designContractTask = defineTask('issue-881.design-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Design the Strike-3 interpretation contract and guardrails',
  labels: ['issue-881', 'design', 'strike-3'],
  agent: {
    name: 'strike3-contract-designer',
    prompt: {
      role: 'senior Babysitter process-library maintainer',
      task: 'Design the smallest implementation plan for issue #881. Do not edit files.',
      instructions: [
        'ISSUE SPEC (verbatim):',
        '---',
        args.issueSpecStdout,
        '---',
        'REUSE AUDIT (verbatim):',
        '---',
        args.reuseAuditStdout,
        '---',
        'PROCESS LIBRARY RESEARCH (verbatim):',
        '---',
        args.libraryResearchStdout,
        '---',
        'Design a focused contract update for Strike-3/post-instrumentation fix handoffs.',
        'The design must identify canonical target surfaces, runtime call paths, tests/guards, and explicit non-goals.',
        'The contract must require at least 3 candidate causes before any fix, a falsifying log line or observation per hypothesis, concrete log evidence citation by seq when available with timestamp/log-id fallback, and a needs-more-data rejection outcome when no fix cites a specific log line.',
        'Prefer updating existing diagnostic-first/root-cause/n-strikes guidance over inventing a separate disconnected process.',
        'Return JSON: { targetSurfaces, runtimeCallPaths, contractShape, implementationSteps, guardrailTests, verificationPlan, risks, nonGoals }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const implementContractTask = defineTask('issue-881.implement-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Strike-3 hypothesis-before-fix contract',
  labels: ['issue-881', 'implementation', 'process-library'],
  agent: {
    name: 'strike3-contract-implementer',
    responderType: 'agent',
    adapter: 'codex',
    fallbackType: 'internal',
    prompt: {
      role: 'senior Babysitter process-library maintainer',
      task: 'Implement issue #881 in the repository. Keep changes focused and do not commit.',
      instructions: [
        'ISSUE SPEC (verbatim):',
        '---',
        args.issueSpecStdout,
        '---',
        'DESIGN (verbatim JSON):',
        '---',
        JSON.stringify(args.design ?? {}, null, 2),
        '---',
        'PREVIOUS VERIFICATION (verbatim JSON):',
        '---',
        JSON.stringify(args.previousVerification ?? {}, null, 2),
        '---',
        'PREVIOUS REVIEW (verbatim JSON):',
        '---',
        JSON.stringify(args.previousReview ?? {}, null, 2),
        '---',
        `Attempt ${args.attempt}. Edit the repo directly.`,
        'Implement a reusable Strike-3/post-instrumentation interpretation contract in the canonical surfaces discovered by the design.',
        'Required contract language:',
        '- enumerate at least 3 candidate root-cause hypotheses before writing a fix;',
        '- each hypothesis includes a falsifying log line or observation;',
        '- the selected fix cites concrete log evidence, using seq number when present and timestamp/log-id/artifact path fallback when seq is absent;',
        '- any fix PR without at least one specific log citation is marked needs-more-data rather than accepted;',
        '- no source-code fix phase proceeds until the interpretation contract is satisfied.',
        'Add a focused regression/metadata guard that fails if future prompt edits remove the key contract requirements.',
        'Do not broaden the rule to ordinary first-attempt bugfixes unless the issue spec requires it.',
        'Do not edit unrelated dirty worktree files.',
        'Return JSON: { changedFiles, summary, contractAdded, guardrailsAdded, verificationCommands, residualRisks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const verifyContractTask = defineTask('issue-881.verify-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Run deterministic verification for Strike-3 contract',
  labels: ['issue-881', 'verification', 'quality-gate'],
  agent: {
    name: 'strike3-contract-verifier',
    prompt: {
      role: 'senior process-library verification engineer',
      task: 'Run verification commands and deterministic contract-term guards, then report exact evidence.',
      instructions: [
        'Run every configured verification command from the repository root and record exact exit codes plus relevant output.',
        'Configured verification commands:',
        JSON.stringify(args.inputs.verificationCommands, null, 2),
        'Then run these contract-term guards against the target files:',
        `TARGETS="${targetFileArgs(args.inputs.targetFiles)}"`,
        'rg -n -i "at least 3|3\\+|three candidate|three root-cause" $TARGETS',
        'rg -n -i "falsifying|falsified|falsify" $TARGETS',
        'rg -n -i "seq number|sequence number|seq\\b|timestamp|log-id|artifact path" $TARGETS',
        'rg -n -i "needs-more-data" $TARGETS',
        'rg -n -i "log citation|cite.*log|cites.*log|specific log line|specific log record|No fix without citation" $TARGETS',
        'Also run git diff --check.',
        'Pass only if every configured command exits 0, every guard finds matching contract language, and git diff --check exits 0.',
        'Return JSON: { passed, commandsRun, contractGuards, failedCommands, changedFilesVerified, nextFixes }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const readArtifactsTask = defineTask('issue-881.read-artifacts', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Read final artifacts for spec comparison',
  labels: ['issue-881', 'artifacts', 'review'],
  agent: {
    name: 'artifact-reader',
    prompt: {
      role: 'implementation artifact reader',
      task: 'Read current implementation artifacts for later spec comparison. Do not edit files.',
      instructions: [
        'Run: git status --short --branch.',
        'Run: git diff --stat.',
        'Run: git diff -- docs library packages scripts .a5c/processes.',
        'Return JSON: { stdout } where stdout contains those three sections verbatim enough for a reviewer to compare against the issue spec.',
      ],
      context: {
        implementation: args.implementation,
        verification: args.verification,
        attempt: args.attempt,
      },
    },
    outputSchema: {
      type: 'object',
      required: ['stdout'],
      properties: {
        stdout: { type: 'string' },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const reviewContractTask = defineTask('issue-881.review-contract', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Strike-3 contract against issue spec',
  labels: ['issue-881', 'review', 'quality-gate'],
  agent: {
    name: 'strike3-contract-reviewer',
    prompt: {
      role: 'senior process-library reviewer',
      task: 'Review the implementation against issue #881. Do not edit files.',
      instructions: [
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        'SPEC (verbatim):',
        '---',
        args.issueSpecStdout,
        '---',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Approve only if the contract requires 3+ hypotheses before fixes, falsifying log/observation per hypothesis, concrete log citation by seq when present with fallback otherwise, and needs-more-data rejection without citation.',
        'Check that the implementation is scoped to Strike-3/post-instrumentation handoffs and has a guardrail test or deterministic metadata check.',
        'Return JSON: { approved, issues, missingRequirements, scopeConcerns, changedFiles, summary, residualRisks }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const finalAcceptanceTask = defineTask('issue-881.final-acceptance', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Final acceptance gate for issue #881',
  labels: ['issue-881', 'final-acceptance'],
  agent: {
    name: 'strike3-final-acceptance',
    prompt: {
      role: 'release gatekeeper',
      task: 'Decide whether issue #881 is ready for delivery.',
      instructions: [
        'SPEC (verbatim):',
        '---',
        args.issueSpecStdout,
        '---',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        'VERIFICATION (verbatim JSON):',
        '---',
        JSON.stringify(args.verification ?? {}, null, 2),
        '---',
        'REVIEW (verbatim JSON):',
        '---',
        JSON.stringify(args.review ?? {}, null, 2),
        '---',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Return JSON: { passed, changedFiles, summary, qualityGates, needsMaintainerDecision, question }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export const deliverTask = defineTask('issue-881.deliver', (args, taskCtx) => {
  const branch = args.inputs.implementationBranch;
  const issue = args.inputs.issueNumber;
  const prTitle = 'feat: enforce Strike-3 hypothesis-before-fix contract';
  const prBody = [
    `Closes #${issue}.`,
    '',
    '## Summary',
    '- Adds a Strike-3/post-instrumentation interpretation contract before code fixes.',
    '- Requires 3+ competing hypotheses, falsifying observations, and concrete log citations.',
    '- Marks uncited fix attempts as needs-more-data and adds guardrails to preserve the contract.',
    '',
    '## Quality Gates',
    ...args.inputs.verificationCommands.map((cmd) => `- ${cmd}`),
    '- Deterministic contract-term grep guards for hypotheses, falsification, seq/timestamp citation, and needs-more-data.',
  ].join('\n');
  const issueComment = [
    'Implementation plan executed for issue #881.',
    '',
    'Phases: issue/spec capture, reuse audit, process-library research, contract design, focused implementation loop, deterministic verification, reviewer gate, and delivery.',
    '',
    'Quality gates include the configured npm checks plus prompt-contract guards for 3+ hypotheses, falsifying log observations, seq/timestamp log citation, and needs-more-data rejection.',
  ].join('\n');
  return {
    kind: 'agent',
    title: 'Commit, push, create PR, and comment on issue #881',
    labels: ['issue-881', 'delivery', 'github'],
    agent: {
      name: 'github-delivery-agent',
      responderType: 'agent',
      adapter: 'codex',
      fallbackType: 'internal',
      prompt: {
        role: 'release delivery engineer',
        task: 'Commit the implementation, push the branch, create a draft PR, and comment on issue #881.',
        instructions: [
          `Use branch: ${branch}.`,
          `Use base branch: ${args.inputs.baseBranch}.`,
          `Use PR title: ${prTitle}.`,
          'Stage only files changed for this issue. Do not stage unrelated dirty worktree files.',
          'Run git diff --cached --check before committing.',
          'Create a new commit with the PR title as the commit message.',
          'Push the branch to origin.',
          'Create a draft PR with the PR body provided in context.',
          `Comment on issue #${issue} with the issue comment provided in context plus the PR URL.`,
          'Return JSON: { branch, commit, prUrl, issueCommentUrl, changedFiles }.',
        ],
        context: {
          prBody,
          issueComment,
        },
      },
    },
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
    },
  };
});
