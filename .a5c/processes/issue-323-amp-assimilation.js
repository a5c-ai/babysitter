/**
 * @process repo/issue-323-amp-assimilation
 * @description Assimilate Amp CLI package version metadata and verify adapter/catalog consistency for issue #323.
 * @inputs { issueNumber?: number, targetVersion?: string, branchName?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * @process methodologies/superpowers/systematic-debugging
 * @process methodologies/superpowers/verification-before-completion
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readIssueContextTask = defineTask('issue-323.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue and Amp assimilation context',
  labels: ['issue-323', 'amp', 'research', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,body`,
      'printf "\\n--- stale refs ---\\n"',
      'rg -n "@sourcegraph/amp-cli|@ampcode/cli|npm install -g .*amp" docs/adapters/reference/agents/amp.md packages/adapters/adapters/src/amp-adapter.ts packages/adapters/adapters/tests/amp-adapter.test.ts packages/atlas/graph/agent-stack/versions/amp-current.yaml packages/atlas/graph/extensions/plugin-artifacts/plugin-target-amp.yaml || true',
      'printf "\\n--- npm target package ---\\n"',
      `npm view @ampcode/cli@${args.targetVersion} version`,
      'printf "\\n--- stale npm package probe ---\\n"',
      'npm view @sourcegraph/amp-cli version || true',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementAmpAssimilationTask = defineTask('issue-323.implement-assimilation', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Assimilate Amp package metadata',
  labels: ['issue-323', 'amp', 'implementation'],
  agent: {
    name: 'amp-assimilation-implementer',
    prompt: {
      role: 'senior TypeScript maintainer',
      task: 'Update Amp adapter/package metadata for the requested Amp CLI version assimilation.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.issueContextStdout,
        '---',
        'Edit the repository directly.',
        'Keep graph install metadata on @ampcode/cli.',
        'Remove stale @sourcegraph/amp-cli install hints from Amp adapter metadata, auth guidance, tests, and directly related docs.',
        'Keep the change focused on issue #323.',
        'Return JSON: { changedFiles: string[], summary: string, smokeNotes: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyAmpAssimilationTask = defineTask('issue-323.verify-assimilation', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Amp assimilation metadata and adapter tests',
  labels: ['issue-323', 'amp', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      `test "$(npm view @ampcode/cli@${args.targetVersion} version)" = "${args.targetVersion}"`,
      'if npm view @sourcegraph/amp-cli version >/tmp/sourcegraph-amp-version.txt 2>/tmp/sourcegraph-amp-version.err; then cat /tmp/sourcegraph-amp-version.txt; exit 1; fi',
      'if rg -n "@sourcegraph/amp-cli" packages/adapters/adapters/src/amp-adapter.ts packages/adapters/adapters/tests/amp-adapter.test.ts docs/adapters/reference/agents/amp.md; then exit 1; fi',
      'rg -n "@ampcode/cli" packages/adapters/adapters/src/amp-adapter.ts packages/adapters/adapters/tests/amp-adapter.test.ts docs/adapters/reference/agents/amp.md packages/atlas/graph/agent-stack/versions/amp-current.yaml',
      'npm run build --workspace=@a5c-ai/agent-comm-mux',
      'npm run build --workspace=@a5c-ai/adapters-codecs',
      'npx vitest run --config vitest.config.ts packages/adapters/adapters/tests/amp-adapter.test.ts',
      'npm run verify:metadata',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-323.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Amp assimilation against issue spec',
  labels: ['issue-323', 'amp', 'review'],
  agent: {
    name: 'amp-assimilation-reviewer',
    prompt: {
      role: 'senior code reviewer',
      task: 'Compare issue #323 requirements to the final artifacts.',
      instructions: [
        'SPEC (verbatim):',
        '---',
        args.issueContextStdout,
        '---',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
        'Return JSON: { approved: boolean, issues: string[], summary: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-323.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed Amp artifacts for review',
  labels: ['issue-323', 'amp', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/adapters/adapters/src/amp-adapter.ts packages/adapters/adapters/tests/amp-adapter.test.ts docs/adapters/reference/agents/amp.md packages/atlas/graph/agent-stack/versions/amp-current.yaml',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-323.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-323', 'amp', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/adapters/adapters/src/amp-adapter.ts packages/adapters/adapters/tests/amp-adapter.test.ts docs/adapters/reference/agents/amp.md',
      'git add -f .a5c/processes/issue-323-amp-assimilation.js',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "fix(amp): update CLI package metadata"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base staging --head ${args.branchName} --title "Fix Amp CLI package metadata" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Implemented Amp %s assimilation.\\n\\n- Updated Amp adapter install/auth/docs from @sourcegraph/amp-cli to @ampcode/cli.\\n- Verified @ampcode/cli package availability and @sourcegraph/amp-cli E404 behavior.\\n- Ran adapter test and metadata verification.\\n\\nPR: %s' '${args.targetVersion}' "$PR_URL")"`,
      'printf "%s\\n" "$PR_URL"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 300000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 323;
  const targetVersion = inputs?.targetVersion ?? '0.0.1779729291-gfe2d7f';
  const branchName = inputs?.branchName ?? 'agent/issue-323';

  const issueContext = await ctx.task(readIssueContextTask, { issueNumber, targetVersion });
  const implementation = await ctx.task(implementAmpAssimilationTask, {
    issueContextStdout: issueContext?.stdout ?? '',
  });
  const verification = await ctx.task(verifyAmpAssimilationTask, { targetVersion });
  const artifacts = await ctx.task(readArtifactsTask, {
    changedFiles: implementation?.changedFiles ?? [],
  });
  const review = await ctx.task(finalReviewTask, {
    issueContextStdout: issueContext?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['context', 'implementation', 'verification', 'review'],
      summary: review?.summary ?? 'Final review did not approve the Amp assimilation.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, targetVersion, branchName });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? `Assimilated Amp ${targetVersion}.`,
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
