/**
 * @process repo/issue-439-claude-agent-sdk-0-3-152
 * @description Assimilate Claude Agent SDK 0.3.152 into package metadata, hook schemas, and Atlas graph surfaces.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * @process specializations/sdk-platform-development/sdk-versioning-release-management
 * @process specializations/sdk-platform-development/compatibility-testing
 * @process methodologies/gsd/map-codebase
 * @process methodologies/gsd/execute-phase
 * @process methodologies/gsd/verify-work
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-439.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, process references, and Claude Agent SDK context',
  labels: ['issue-439', 'claude-agent-sdk', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- upstream package ---\\n"',
      'npm view @anthropic-ai/claude-agent-sdk version dist-tags --json',
      'printf "\\n--- process references ---\\n"',
      'rg -n "agent-version-update|graph-update|Claude Agent SDK|versioning|compatibility|verify" /home/runner/.a5c/process-library/babysitter-repo/library/specializations/sdk-platform-development /home/runner/.a5c/process-library/babysitter-repo/library/methodologies /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared .a5c/processes -g "*.js" -g "*.md" | head -260',
      'printf "\\n--- package and graph surfaces ---\\n"',
      'rg -n "@anthropic-ai/claude-agent-sdk|claude-agent-sdk|Claude Agent SDK|0\\\\.3\\\\.15" package.json package-lock.json packages plugins docs -g "package.json" -g "package-lock.json" -g "*.yaml" -g "*.json" -g "*.md" | head -500',
      'printf "\\n--- hook surfaces ---\\n"',
      'rg -n "SessionStart|MessageDisplay|hookSpecificOutput|reloadSkills|sessionTitle|assistant message|displayed assistant" packages/hooks-mux packages/sdk packages/agent-catalog docs -g "*.ts" -g "*.tsx" -g "*.js" -g "*.md" | head -500',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const planTask = defineTask('issue-439.plan', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Plan Claude Agent SDK 0.3.152 assimilation',
  labels: ['issue-439', 'claude-agent-sdk', 'planning'],
  agent: {
    name: 'claude-agent-sdk-assimilation-planner',
    prompt: {
      role: 'senior TypeScript SDK and Atlas graph maintainer',
      task: 'Plan an intent-faithful assimilation of Claude Agent SDK 0.3.152.',
      instructions: [
        'Use the issue and discovered context below as the verbatim source of acceptance criteria.',
        'Trace runtime call paths for hook schema/bridge output handling before planning edits.',
        'Keep scope to Claude Agent SDK 0.3.152: package metadata, Atlas graph metadata, hook schema support for MessageDisplay, and SessionStart output handling for reloadSkills/sessionTitle.',
        'Prefer existing hooks-mux and graph patterns.',
        'Return JSON: { runtimeCallPaths: string[], targetFiles: string[], planSummary: string, acceptanceCriteria: string[], verificationCommands: string[], risks: string[] }.',
        '',
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('issue-439.implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Claude Agent SDK 0.3.152 assimilation',
  labels: ['issue-439', 'claude-agent-sdk', 'implementation'],
  agent: {
    name: 'claude-agent-sdk-assimilation-implementer',
    prompt: {
      role: 'senior TypeScript SDK and Atlas graph engineer',
      task: 'Implement the planned Claude Agent SDK 0.3.152 assimilation directly in the repository.',
      instructions: [
        'Read files before editing them.',
        'Keep changes tightly scoped to issue #439 and the live runtime paths identified in the plan.',
        'Do not revert unrelated local worktree changes.',
        'Update tests for any changed hook parsing/rendering/schema behavior.',
        'If package manifests are updated, keep lockfiles coherent.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
        '',
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        '',
        'PLAN (verbatim JSON/object):',
        '---',
        JSON.stringify(args.plan, null, 2),
        '---',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-439.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Claude Agent SDK 0.3.152 assimilation',
  labels: ['issue-439', 'claude-agent-sdk', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'node -e "const p=require(\'./package.json\'); if (p.devDependencies[\'@anthropic-ai/claude-agent-sdk\'] !== \'0.3.152\') throw new Error(\'root devDependency not 0.3.152\')"',
      'node -e "const p=require(\'./packages/agent-mux/adapters/package.json\'); if (p.dependencies[\'@anthropic-ai/claude-agent-sdk\'] !== \'0.3.152\') throw new Error(\'adapter dependency not 0.3.152\')"',
      'rg -n \'versionRange: ">=0\\.3\\.152"|releaseNotesUrl: "https://github.com/anthropics/claude-agent-sdk-typescript/releases/tag/v0\\.3\\.152"\' packages/atlas/graph/agent-stack/versions/claude-agent-sdk-current.yaml',
      'rg -n "MessageDisplay|reloadSkills|sessionTitle|hookSpecificOutput" packages/hooks-mux packages/sdk packages/agent-catalog docs -g "*.ts" -g "*.md"',
      'npm run verify:metadata',
      'npm run build:sdk',
      'HOME="$(mktemp -d)" npm run test:sdk',
      'npm run test --workspace=@a5c-ai/hooks-mux-core',
      'npm run test --workspace=@a5c-ai/hooks-mux-adapter-claude',
      'git diff --check',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-439.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed artifacts for final review',
  labels: ['issue-439', 'claude-agent-sdk', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- package.json package-lock.json packages/agent-mux/adapters/package.json packages/agent-mux/adapters/package-lock.json packages/atlas/graph/agent-stack/versions/claude-agent-sdk-current.yaml packages/hooks-mux packages/sdk packages/agent-catalog docs .a5c/processes/issue-439-claude-agent-sdk-0-3-152.js',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-439.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Claude Agent SDK 0.3.152 assimilation',
  labels: ['issue-439', 'claude-agent-sdk', 'review'],
  agent: {
    name: 'claude-agent-sdk-assimilation-reviewer',
    prompt: {
      role: 'senior SDK compatibility reviewer',
      task: 'Compare issue #439 requirements to the final artifacts.',
      instructions: [
        'SPEC (verbatim):',
        '---',
        args.contextStdout,
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

const publishTask = defineTask('issue-439.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-439', 'claude-agent-sdk', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add package.json package-lock.json packages/agent-mux/adapters/package.json',
      'git add packages/atlas/graph/agent-stack/versions/claude-agent-sdk-current.yaml',
      'git add packages/hooks-mux packages/sdk packages/agent-catalog docs',
      'git add -f .a5c/processes/issue-439-claude-agent-sdk-0-3-152.js',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "chore(agent-sdk): track Claude Agent SDK 0.3.152"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Claude Agent SDK 0.3.152" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Tracked Claude Agent SDK 0.3.152.\\n\\n- Updated package metadata for @anthropic-ai/claude-agent-sdk 0.3.152.\\n- Assimilated upstream hook changes for MessageDisplay plus SessionStart reloadSkills/sessionTitle where applicable.\\n- Verified metadata, SDK build/tests, and hooks-mux tests.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 439;
  const branchName = inputs?.branchName ?? 'agent/issue-439';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, { issueNumber });
  const plan = await ctx.task(planTask, { contextStdout: context?.stdout ?? '' });
  const implementation = await ctx.task(implementTask, {
    contextStdout: context?.stdout ?? '',
    plan,
  });
  const verification = await ctx.task(verifyTask, {});
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(reviewTask, {
    contextStdout: context?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['context', 'planning', 'implementation', 'verification', 'review'],
      summary: review?.summary ?? 'Final review did not approve Claude Agent SDK 0.3.152 assimilation.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'planning', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked Claude Agent SDK 0.3.152.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
