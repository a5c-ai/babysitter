/**
 * @process repo/issue-833-agent-mux-binary-renames
 * @description TDD migration for agent-mux CLI binary renames with deprecated aliases.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success: boolean, changedFiles: string[], verification: object, publish: object }
 *
 * @process babysitter/tdd-quality-convergence
 * @process processes/shared/tdd-triplet
 * @process specializations/code-migration-modernization/code-refactoring
 * @process specializations/sdk-platform-development/package-distribution
 * @process specializations/collaboration/github/pr-lifecycle-router
 * @process specializations/collaboration/github/issue-linking
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-833.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #833, binary rename spec, and current CLI surfaces',
  labels: ['issue-833', 'context', 'agent-mux', 'binary-renames'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body,isDraft`,
      'printf "\\n--- binary rename spec ---\\n"',
      'cat docs/agent-mux/terminology-and-structure-gaps/binary-renames.md',
      'printf "\\n--- current published bins ---\\n"',
      'find packages -path "*/package.json" -print | sort | xargs node -e "const fs=require(\\"fs\\"); for (const f of process.argv.slice(1)) { const p=JSON.parse(fs.readFileSync(f,\\"utf8\\")); if (p.bin) console.log(f, JSON.stringify({name:p.name,bin:p.bin})); }"',
      'printf "\\n--- relevant stale command references ---\\n"',
      'rg -n "amux|amux-proxy|amux-tui|a5c-hooks-mux|extension-mux|triggers-mux|tasks-mux|mock-harness|agent-mux-transport-proxy|agent-mux-hooks|agent-mux-extensions|agent-mux-triggers|agent-mux-tasks|agent-mux-harness-mock" packages scripts docs .github package.json tsconfig.json -g "package.json" -g "*.ts" -g "*.tsx" -g "*.js" -g "*.mjs" -g "*.cjs" -g "*.md" -g "*.json" -g "*.yml" -g "*.yaml" | head -2000',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const writeFailingTestsTask = defineTask('issue-833.write-failing-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Write failing binary rename tests first',
  labels: ['issue-833', 'tdd', 'red', 'tests'],
  agent: {
    name: 'test-writer',
    prompt: {
      role: 'senior TypeScript monorepo maintainer practicing strict TDD',
      task: 'Write tests/checks that fail on the current legacy binary names before implementation.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Preserve unrelated local worktree changes.',
        'Add a deterministic test/check that validates every binary mapping from the spec.',
        'The check must require canonical agent-mux binary names and deprecated legacy aliases.',
        'The check must verify a deprecation warning path/message for aliases.',
        'Wire the check into package.json so it can be run with npm run test:binary-renames.',
        'Run npm run test:binary-renames and confirm it fails before implementation.',
        'Return JSON: { changedFiles: string[], summary: string, failingCommand: string, expectedFailure: string, commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const redTestTask = defineTask('issue-833.red-test', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Confirm binary rename tests fail before implementation',
  labels: ['issue-833', 'tdd', 'red'],
  shell: {
    command: 'set -euo pipefail\nnpm run test:binary-renames',
    expectedExitCode: 1,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const commitTestsTask = defineTask('issue-833.commit-tests', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit failing binary rename tests',
  labels: ['issue-833', 'tdd', 'commit'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git add package.json scripts/check-binary-renames.cjs',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "test(agent-mux): pin binary rename contract"; fi',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('issue-833.implement-binary-renames', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement agent-mux binary renames and deprecated aliases',
  labels: ['issue-833', 'implementation', 'agent-mux'],
  agent: {
    name: 'implementation-engineer',
    prompt: {
      role: 'senior TypeScript monorepo maintainer',
      task: 'Implement the CLI binary rename migration while keeping one-major deprecated aliases.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'RED TEST OUTPUT (verbatim):',
        '---',
        args.redTestStdout,
        args.redTestStderr,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Preserve unrelated local worktree changes.',
        'Use git mv for renamed bin entrypoint files when paths are renamed.',
        'Use find-replace for import/path references after renames.',
        'Update package bin maps, deprecated alias wrappers, docs/tests, tsconfig references, package.json workspaces, CI workflows, and architecture boundary checks where relevant.',
        'Resolve duplicate agent-mux binary ownership: keep @a5c-ai/agent-mux as canonical owner and keep @a5c-ai/agent-mux-cli on legacy amux alias only if needed to avoid publishing the same canonical bin twice.',
        'Make aliases print warnings like [agent-mux] "old-name" is deprecated, use "new-name" instead.',
        'Run npm run test:binary-renames and make it pass.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-833.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify binary rename migration',
  labels: ['issue-833', 'verification', 'agent-mux'],
  shell: {
    command: [
      'set -euo pipefail',
      'npm run test:binary-renames',
      'npm run verify:metadata',
      'npm run build:sdk',
      'node ./scripts/check-architecture-boundaries.cjs',
      'git diff --check',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 1200000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-833.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final binary rename artifacts',
  labels: ['issue-833', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff --stat',
      'git diff -- package.json scripts/check-binary-renames.cjs packages/agent-mux/cli packages/agent-mux/extensions packages/agent-mux/harness-mock packages/agent-mux/hooks/cli packages/agent-mux/sdk packages/agent-mux/tasks packages/agent-mux/transport packages/agent-mux/triggers packages/agent-mux/tui docs .github scripts tsconfig.json',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-833.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review binary rename migration against spec',
  labels: ['issue-833', 'review'],
  agent: {
    name: 'code-reviewer',
    prompt: {
      role: 'release compatibility reviewer',
      task: 'Compare SPEC to ARTIFACTS directly and report per-criterion pass/fail.',
      instructions: [
        'Return JSON: { approved: boolean, issues: string[], residualRisk: string[], summary: string }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.contextStdout,
        '---',
        '',
        'ARTIFACTS (verbatim):',
        '---',
        args.artifactsStdout,
        '---',
        '',
        'VERIFICATION OUTPUT (verbatim):',
        '---',
        args.verificationStdout,
        args.verificationStderr,
        '---',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const commitImplementationTask = defineTask('issue-833.commit-implementation', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit implementation changes',
  labels: ['issue-833', 'commit'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add package.json package-lock.json scripts/check-binary-renames.cjs',
      'git add packages/agent-mux/cli packages/agent-mux/extensions packages/agent-mux/harness-mock packages/agent-mux/hooks/cli packages/agent-mux/sdk packages/agent-mux/tasks packages/agent-mux/transport packages/agent-mux/triggers packages/agent-mux/tui',
      'git add packages/sdk/src/breakpoints/__tests__/proven-verification.test.ts',
      'git add docs .github scripts tsconfig.json || true',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(agent-mux): rename CLI binaries"; fi',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-833.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Push branch, create draft PR, and comment on issue',
  labels: ['issue-833', 'publish', 'github'],
  shell: {
    command: [
      'set -euo pipefail',
      `branch="${args.branchName}"`,
      `base="${args.baseBranch}"`,
      'git add -f .a5c/processes/issue-833-agent-mux-binary-renames.js .a5c/processes/issue-833-agent-mux-binary-renames.inputs.json',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "chore(agent-mux): record issue 833 process"; fi',
      'git push -u origin "$branch"',
      'pr_url="$(gh pr list --head "$branch" --json url --jq \'.[0].url // empty\' 2>/dev/null || true)"',
      `if [ -z "$pr_url" ]; then pr_url="$(gh pr create --draft --base "$base" --head "$branch" --title "Rename agent-mux CLI binaries" --body "Closes #${args.issueNumber}\\n\\nImplements the binary rename mapping from docs/agent-mux/terminology-and-structure-gaps/binary-renames.md while keeping deprecated legacy aliases for one major version.\\n\\nVerification:\\n- npm run test:binary-renames\\n- npm run verify:metadata\\n- npm run build:sdk\\n- node ./scripts/check-architecture-boundaries.cjs\\n- git diff --check")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Implemented the agent-mux binary rename migration and opened a draft PR.\\n\\n- Added a binary rename contract check: npm run test:binary-renames\\n- Renamed canonical package bin entries to the agent-mux-* convention.\\n- Kept legacy command aliases with deprecation warnings for one major version.\\n- Ran metadata, SDK build, architecture-boundary, and diff checks locally.\\n\\nPR: %s' "$pr_url")"`,
      'printf "%s\\n" "$pr_url"',
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
  const issueNumber = inputs?.issueNumber ?? 833;
  const branchName = inputs?.branchName ?? 'agent/issue-833';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, { issueNumber });
  const tests = await ctx.task(writeFailingTestsTask, { contextStdout: context?.stdout ?? '' });
  const redTest = await ctx.task(redTestTask, {});
  const testsCommit = await ctx.task(commitTestsTask, {});

  const implementation = await ctx.task(implementTask, {
    contextStdout: context?.stdout ?? '',
    redTestStdout: redTest?.stdout ?? '',
    redTestStderr: redTest?.stderr ?? '',
  });

  const verification = await ctx.task(verifyTask, {});
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(reviewTask, {
    contextStdout: context?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
    verificationStdout: verification?.stdout ?? '',
    verificationStderr: verification?.stderr ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      changedFiles: [
        ...(tests?.changedFiles ?? []),
        ...(implementation?.changedFiles ?? []),
      ],
      verification,
      review,
    };
  }

  const implementationCommit = await ctx.task(commitImplementationTask, {});
  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    changedFiles: [
      ...(tests?.changedFiles ?? []),
      ...(implementation?.changedFiles ?? []),
    ],
    testsCommit,
    implementationCommit,
    verification,
    review,
    publish,
  };
}
