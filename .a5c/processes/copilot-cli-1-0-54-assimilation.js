/**
 * @process project/copilot-cli-1-0-54-assimilation
 * @description Assimilate GitHub Copilot CLI 1.0.54 into the Atlas graph and related repo metadata.
 * @inputs { issueNumber: number, baseBranch: string, workBranch: string }
 *
 * References:
 * - cradle/feature-implementation-contribute.js for issue-to-PR mechanics.
 * - methodologies/gsd/quick.js and methodologies/gsd/verify-work.js for
 *   planning, execution, and verification shape.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const issueNumber = inputs.issueNumber || 325;
  const baseBranch = inputs.baseBranch || 'staging';
  const workBranch = inputs.workBranch || 'agent/issue-325';

  ctx.log('info', `Assimilating Copilot CLI release from issue #${issueNumber}`);

  const issueSpec = await ctx.task(readIssueSpecTask, { issueNumber });
  const processRefs = await ctx.task(discoverProcessReferencesTask, {});
  const surfaceTrace = await ctx.task(traceCopilotSurfaceTask, {});

  const plan = await ctx.task(planAssimilationTask, {
    issueStdout: issueSpec.stdout,
    processRefsStdout: processRefs.stdout,
    surfaceTraceStdout: surfaceTrace.stdout,
  });

  const implementation = await ctx.task(implementAssimilationTask, {
    issueStdout: issueSpec.stdout,
    surfaceTraceStdout: surfaceTrace.stdout,
    plan,
  });

  const diff = await ctx.task(captureDiffTask, {});

  await ctx.task(diffCheckTask, {});
  const metadataCheck = await ctx.task(metadataCheckTask, {});

  const review = await ctx.task(reviewAssimilationTask, {
    issueStdout: issueSpec.stdout,
    diffStdout: diff.stdout,
    metadataStdout: metadataCheck.stdout,
  });

  const summary = await ctx.task(writeIssueSummaryTask, {
    issueNumber,
    implementation,
    review,
  });

  const commit = await ctx.task(commitChangesTask, {
    filesChanged: implementation.filesChanged || [],
    summaryFile: summary.summaryFile,
  });

  const pr = await ctx.task(pushAndCreatePrTask, {
    issueNumber,
    baseBranch,
    workBranch,
  });

  const comment = await ctx.task(postIssueCommentTask, {
    issueNumber,
    summaryFile: summary.summaryFile,
  });

  return {
    success: true,
    issueNumber,
    workBranch,
    filesChanged: implementation.filesChanged || [],
    verification: {
      metadataCheck,
      review,
    },
    commit,
    pr,
    comment,
  };
}

export const readIssueSpecTask = defineTask('read-issue-spec', (args, taskCtx) => ({
  kind: 'shell',
  title: `Read GitHub issue #${args.issueNumber}`,
  shell: {
    command: `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['github', 'issue', 'spec'],
}));

export const discoverProcessReferencesTask = defineTask('discover-process-references', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Discover relevant process-library references',
  shell: {
    command: [
      'printf "%s\\n" "# Active process references"',
      'rg -n "feature implementation|verify|graph|catalog|ontology|agent-version|version update|assimilat" /home/runner/.a5c/process-library/babysitter-repo/library/cradle /home/runner/.a5c/process-library/babysitter-repo/library/methodologies /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared -g "*.js" -g "*.md" | head -200',
    ].join(' && '),
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['process-library', 'discovery'],
}));

export const traceCopilotSurfaceTask = defineTask('trace-copilot-surface', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Trace Copilot CLI graph and adapter surface',
  shell: {
    command: [
      'printf "%s\\n" "# Copilot graph references"',
      'rg -n "copilot|Copilot|agentVersion:copilot|deferred-tool|oauthClientId|redirectPort|context window|compact|launchBehavior|stdin|resume|-C|attachment|log-dir" packages plugins library docs -g "*.ts" -g "*.js" -g "*.mjs" -g "*.cjs" -g "*.yaml" -g "*.json" -g "*.md" | head -400',
    ].join(' && '),
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['copilot-cli', 'graph', 'runtime-path'],
}));

export const planAssimilationTask = defineTask('plan-assimilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Copilot CLI 1.0.54 assimilation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior repository maintainer',
      task: 'Plan the minimal intent-faithful assimilation for GitHub Copilot CLI 1.0.54.',
      instructions: [
        'Use the issue spec verbatim as the source of acceptance criteria.',
        'Use the traced Copilot graph and adapter references to identify files that should change.',
        'Prefer existing Atlas graph patterns over new schema unless the issue requires schema work.',
        'Output JSON with planSummary, targetFiles, acceptanceCriteria, verificationCommands, and risks.',
        '',
        'ISSUE SPEC (verbatim):',
        '---',
        args.issueStdout,
        '---',
        '',
        'PROCESS REFERENCES (verbatim):',
        '---',
        args.processRefsStdout,
        '---',
        '',
        'COPILOT SURFACE TRACE (verbatim):',
        '---',
        args.surfaceTraceStdout,
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'planning', 'copilot-cli'],
}));

export const implementAssimilationTask = defineTask('implement-assimilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Copilot CLI 1.0.54 assimilation',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior TypeScript and Atlas graph engineer',
      task: 'Implement the planned Copilot CLI 1.0.54 assimilation in the current repository.',
      instructions: [
        'Read files before editing them.',
        'Keep changes tightly scoped to issue #325 and the live Copilot CLI graph/adapter surface.',
        'Do not revert unrelated local changes.',
        'Update tests or metadata checks where the touched surface has existing coverage.',
        'Return JSON with filesChanged, summary, verificationNotes, and commitMessage.',
        '',
        'ISSUE SPEC (verbatim):',
        '---',
        args.issueStdout,
        '---',
        '',
        'PLAN (verbatim JSON/object from prior task):',
        '---',
        JSON.stringify(args.plan, null, 2),
        '---',
        '',
        'COPILOT SURFACE TRACE (verbatim):',
        '---',
        args.surfaceTraceStdout,
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'implementation', 'copilot-cli'],
}));

export const captureDiffTask = defineTask('capture-diff', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Capture implementation diff',
  shell: {
    command: 'git diff -- . ":(exclude).a5c/runs" && git status --short',
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['git', 'diff'],
}));

export const diffCheckTask = defineTask('diff-check', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Check diff whitespace',
  shell: {
    command: 'git diff --check',
  },
  expectedExitCode: 0,
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['verification', 'git'],
}));

export const metadataCheckTask = defineTask('metadata-check', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run metadata verification',
  shell: {
    command: 'npm run verify:metadata',
  },
  expectedExitCode: 0,
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['verification', 'metadata'],
}));

export const reviewAssimilationTask = defineTask('review-assimilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review assimilation against issue spec',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'code reviewer focused on Atlas graph correctness',
      task: 'Compare SPEC to ARTIFACTS directly. Report per-criterion pass/fail.',
      instructions: [
        'Ignore any narrative in your context about how ARTIFACTS were built.',
        'Do not summarize either block before comparing.',
        'Return JSON with approved, findings, residualRisks, and issueCommentBullets.',
        '',
        'SPEC (verbatim):',
        '---',
        args.issueStdout,
        '---',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.diffStdout,
        '---',
        '',
        'METADATA CHECK OUTPUT (verbatim):',
        '---',
        args.metadataStdout,
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'review', 'acceptance'],
}));

export const writeIssueSummaryTask = defineTask('write-issue-summary', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write issue summary comment',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'maintainer preparing GitHub issue update',
      task: 'Write a concise Markdown summary comment to .a5c/processes/issue-325-summary.md.',
      instructions: [
        'Include what changed, verification run, PR branch, and any residual risk.',
        'Keep the comment direct and suitable for posting to the GitHub issue.',
        'Return JSON with summaryFile set to ".a5c/processes/issue-325-summary.md".',
      ],
      context: {
        issueNumber: args.issueNumber,
        implementation: args.implementation,
        review: args.review,
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'github', 'summary'],
}));

export const commitChangesTask = defineTask('commit-changes', (args, taskCtx) => {
  const files = [
    '.a5c/processes/copilot-cli-1-0-54-assimilation.js',
    '.a5c/processes/copilot-cli-1-0-54-assimilation.inputs.json',
    args.summaryFile,
    ...(args.filesChanged || []),
  ].filter(Boolean).join(' ');

  return {
    kind: 'shell',
    title: 'Commit issue #325 changes',
    shell: {
      command: `git add -f ${files} && git commit -m "Assimilate GitHub Copilot CLI 1.0.54"`,
    },
    expectedExitCode: 0,
    io: {
      inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
      outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
    },
    labels: ['git', 'commit'],
  };
});

export const pushAndCreatePrTask = defineTask('push-and-create-pr', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Push branch and create PR',
  shell: {
    command: [
      `git push -u origin ${args.workBranch}`,
      `gh pr create --base ${args.baseBranch} --head ${args.workBranch} --title "Assimilate GitHub Copilot CLI 1.0.54" --body "Closes #${args.issueNumber}\\n\\nAssimilates GitHub Copilot CLI 1.0.54 release metadata and related Atlas graph coverage."`,
    ].join(' && '),
  },
  expectedExitCode: 0,
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['git', 'github', 'pr'],
}));

export const postIssueCommentTask = defineTask('post-issue-comment', (args, taskCtx) => ({
  kind: 'shell',
  title: `Post summary comment to issue #${args.issueNumber}`,
  shell: {
    command: `gh issue comment ${args.issueNumber} --body-file ${args.summaryFile}`,
  },
  expectedExitCode: 0,
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['github', 'issue-comment'],
}));
