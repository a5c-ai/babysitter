/**
 * @process project/issue-362-amazon-nova-2-tracking
 * @description Track Amazon Nova 2 Lite and Nova 2 Sonic in the Atlas graph.
 * @inputs { issueNumber: number, baseBranch: string, workBranch: string }
 *
 * References:
 * - project/copilot-cli-1-0-54-assimilation for issue-to-PR graph update flow.
 * - methodologies/gsd/quick.js and methodologies/gsd/verify-work.js for
 *   plan, implementation, verification, and review shape.
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

export async function process(inputs, ctx) {
  const issueNumber = inputs.issueNumber || 362;
  const baseBranch = inputs.baseBranch || 'staging';
  const workBranch = inputs.workBranch || 'agent/issue-362';

  ctx.log('info', `Tracking Amazon Nova 2 Lite and Nova 2 Sonic from issue #${issueNumber}`);

  const issueSpec = await ctx.task(readIssueSpecTask, { issueNumber });
  const processRefs = await ctx.task(discoverProcessReferencesTask, {});
  const graphTrace = await ctx.task(traceNovaGraphTask, {});

  const plan = await ctx.task(planGraphUpdateTask, {
    issueStdout: issueSpec.stdout,
    processRefsStdout: processRefs.stdout,
    graphTraceStdout: graphTrace.stdout,
  });

  const implementation = await ctx.task(implementGraphUpdateTask, {
    issueStdout: issueSpec.stdout,
    graphTraceStdout: graphTrace.stdout,
    plan,
  });

  const diff = await ctx.task(captureDiffTask, {});

  await ctx.task(diffCheckTask, {});
  const metadataCheck = await ctx.task(metadataCheckTask, {});

  const review = await ctx.task(reviewGraphUpdateTask, {
    issueStdout: issueSpec.stdout,
    diffStdout: diff.stdout,
    metadataStdout: metadataCheck.stdout,
  });

  const summary = await ctx.task(writeIssueSummaryTask, {
    issueNumber,
    implementation,
    review,
    workBranch,
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
  expectedExitCode: 0,
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
      'rg -n "feature implementation|verify|graph|catalog|ontology|model-version|version update|assimilat" /home/runner/.a5c/process-library/babysitter-repo/library/cradle /home/runner/.a5c/process-library/babysitter-repo/library/methodologies /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared -g "*.js" -g "*.md" | head -200',
    ].join(' && '),
  },
  expectedExitCode: 0,
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['process-library', 'discovery'],
}));

export const traceNovaGraphTask = defineTask('trace-nova-graph', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Trace Amazon Nova graph surface',
  shell: {
    command: [
      'printf "%s\\n" "# Amazon Nova and Bedrock graph references"',
      'rg -n "amazon-nova|Amazon Nova|nova-2|nova|bedrock|InvokeModelWithBidirectionalStream|bidirectional|speech|audio" packages/atlas/graph packages/transport-mux docs -g "*.yaml" -g "*.md" -g "*.ts" -g "*.js" | head -500',
    ].join(' && '),
  },
  expectedExitCode: 0,
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['atlas-graph', 'runtime-path'],
}));

export const planGraphUpdateTask = defineTask('plan-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Amazon Nova 2 graph update',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Plan the minimal intent-faithful graph update for Amazon Nova 2 Lite and Amazon Nova 2 Sonic.',
      instructions: [
        'Use the issue spec verbatim as the source of acceptance criteria.',
        'Use the traced Atlas graph references to identify live graph files that should change.',
        'Prefer existing compute/models, compute/providers, model-families, model-transport-protocols, evidence-source, and claim patterns over new schema.',
        'Output JSON with planSummary, targetFiles, runtimeCallPaths, acceptanceCriteria, verificationCommands, and risks.',
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
        'GRAPH TRACE (verbatim):',
        '---',
        args.graphTraceStdout,
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'planning', 'atlas-graph'],
}));

export const implementGraphUpdateTask = defineTask('implement-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Amazon Nova 2 graph update',
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'senior Atlas graph engineer',
      task: 'Implement the planned Amazon Nova 2 Lite and Sonic tracking update in the current repository.',
      instructions: [
        'Read files before editing them.',
        'Keep changes tightly scoped to issue #362 and the live Atlas graph metadata surface.',
        'Do not revert unrelated local changes.',
        'Represent Nova 2 Lite as Bedrock-native text/image/video reasoning through Converse/Invoke where existing graph patterns support it.',
        'Represent Nova 2 Sonic as Bedrock-native low-latency speech-to-speech / bidirectional streaming without pretending it has a normal text context window if the issue spec does not confirm one.',
        'Update evidence sources and claim files when model attributes are added or corrected.',
        'Update provider/family/protocol edges so graph traversal reaches both models from Bedrock and their transports.',
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
        'GRAPH TRACE (verbatim):',
        '---',
        args.graphTraceStdout,
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/result.json`,
  },
  labels: ['agent', 'implementation', 'atlas-graph'],
}));

export const captureDiffTask = defineTask('capture-diff', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Capture implementation diff',
  shell: {
    command: 'git diff -- . ":(exclude).a5c/runs" && git status --short',
  },
  expectedExitCode: 0,
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

export const reviewGraphUpdateTask = defineTask('review-graph-update', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review graph update against issue spec',
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
      task: 'Write a concise Markdown summary comment to .a5c/processes/issue-362-summary.md.',
      instructions: [
        'Include what changed, verification run, PR branch, and any residual risk.',
        'Keep the comment direct and suitable for posting to the GitHub issue.',
        'Return JSON with summaryFile set to ".a5c/processes/issue-362-summary.md".',
      ],
      context: {
        issueNumber: args.issueNumber,
        implementation: args.implementation,
        review: args.review,
        workBranch: args.workBranch,
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
    '.a5c/processes/issue-362-amazon-nova-2-tracking.mjs',
    '.a5c/processes/issue-362-amazon-nova-2-tracking.inputs.json',
    args.summaryFile,
    ...(args.filesChanged || []),
  ].filter(Boolean).join(' ');

  return {
    kind: 'shell',
    title: 'Commit issue #362 changes',
    shell: {
      command: `git add -f ${files} && git commit -m "Track Amazon Nova 2 models"`,
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
      `gh pr create --base ${args.baseBranch} --head ${args.workBranch} --title "Track Amazon Nova 2 Lite and Sonic" --body "Closes #${args.issueNumber}\\n\\nTracks Amazon Nova 2 Lite and Amazon Nova 2 Sonic in the Atlas graph with Bedrock provider, transport, and evidence metadata."`,
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
