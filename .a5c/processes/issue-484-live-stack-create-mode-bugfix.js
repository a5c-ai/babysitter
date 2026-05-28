/**
 * @process repo/issue-484-live-stack-create-mode-bugfix
 * @description Investigate and fix live-stack BP/Create failures for claude-code and pi agents.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success, changedFiles, diagnosis, verification, review, publish }
 *
 * @process cradle/bugfix
 * @process methodologies/shared/root-cause-diagnosis
 * @process methodologies/superpowers/systematic-debugging
 * @process methodologies/superpowers/verification-before-completion
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-484.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read live-stack issue and code context',
  labels: ['issue-484', 'live-stack', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- open prs mentioning issue ---\\n"',
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- live-stack and create-mode surfaces ---\\n"',
      'rg -n "live-stack|live stack|BP/Create|Create mode|create interactive|Bridged-Hooks|bridged|claude-code|pi|codex|processes|\\\\.a5c/processes|expected.*process|process definition|create mode" . .github packages plugins library docs .a5c -g "*.ts" -g "*.tsx" -g "*.js" -g "*.mjs" -g "*.cjs" -g "*.json" -g "*.md" | head -900',
      'printf "\\n--- scripts and package commands ---\\n"',
      'node -e "const p=require(\'./package.json\'); console.log(JSON.stringify({scripts:p.scripts}, null, 2))"',
      'printf "\\n--- recent git context ---\\n"',
      'git log --oneline -20',
      'printf "\\n--- status ---\\n"',
      'git status --short --branch',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const diagnoseTask = defineTask('issue-484.diagnose', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Diagnose BP/Create process-generation failure',
  labels: ['issue-484', 'live-stack', 'diagnosis'],
  agent: {
    name: 'live-stack-debugger',
    prompt: {
      role: 'senior Babysitter live-stack engineer',
      task: 'Diagnose why BP/Create mode fails for claude-code and pi agents.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Perform root-cause analysis only at first.',
        'Trace the live execution path for create-mode prompts from matrix/test definition to expected .a5c/processes output validation.',
        'Find the exact prompt/instruction contract passed to non-codex agents and why it permits output without creating the process directory/files.',
        'Gather at least two independent evidence signals from code, tests, fixtures, docs, or command output.',
        'Return JSON: { rootCause: string, runtimeCallPaths: string[], evidenceSignals: string[], affectedFiles: string[], fixPlan: string, testPlan: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementFixTask = defineTask('issue-484.implement-fix', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement live-stack BP/Create fix',
  labels: ['issue-484', 'live-stack', 'implementation'],
  agent: {
    name: 'live-stack-implementer',
    prompt: {
      role: 'senior Babysitter live-stack engineer',
      task: 'Implement the focused fix for issue #484.',
      instructions: [
        'SPEC (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'DIAGNOSIS (verbatim):',
        '---',
        JSON.stringify(args.diagnosis ?? {}, null, 2),
        '---',
        'Edit the repository directly.',
        'Keep changes scoped to files on the diagnosed live BP/Create execution path.',
        'Do not rewrite unrelated matrix infrastructure or change unrelated agent behavior.',
        'Add or update regression coverage that would fail when create-mode agents produce text but do not create the expected .a5c/processes artifacts.',
        'Preserve unrelated dirty workspace files.',
        'Return JSON: { changedFiles: string[], summary: string, testsAdded: string[], verificationCommands: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-484.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run targeted live-stack verification',
  labels: ['issue-484', 'live-stack', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'git diff --check',
      'node scripts/agent-mux-build.cjs test packages/agent-mux/cli -- packages/agent-mux/cli/tests/live-stack/primary-live-runner.test.ts',
      'npm run build:sdk',
      'HOME="$(mktemp -d)" npm run test:sdk',
      'npm run verify:metadata',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-484.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final live-stack diff',
  labels: ['issue-484', 'live-stack', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- . ":!.codex/**" ":!plugins/babysitter/**" ":!.agents/plugins/marketplace.json"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-484.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review issue #484 fix against spec',
  labels: ['issue-484', 'live-stack', 'review'],
  agent: {
    name: 'live-stack-reviewer',
    prompt: {
      role: 'code reviewer focused on live-stack reliability',
      task: 'Compare SPEC to ARTIFACTS directly. Report per-criterion pass/fail.',
      instructions: [
        'Ignore any narrative in your context about how ARTIFACTS were built.',
        'Return JSON: { approved: boolean, issues: string[], summary: string, residualRisk: string[] }.',
        '',
        'SPEC (verbatim):',
        '---',
        args.contextStdout,
        '---',
        '',
        'DIAGNOSIS (verbatim):',
        '---',
        JSON.stringify(args.diagnosis ?? {}, null, 2),
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
        '---',
        '',
        'Compare SPEC to ARTIFACTS directly. Ignore any narrative in your context about how ARTIFACTS were built.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-484.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-484', 'live-stack', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git add -f .a5c/processes/issue-484-live-stack-create-mode-bugfix.js .a5c/processes/issue-484-live-stack-create-mode-bugfix.inputs.json',
      'git add packages/agent-mux/cli/tests/live-stack/primary-live-runner.ts packages/agent-mux/cli/tests/live-stack/primary-live-runner.test.ts',
      'git diff --cached --name-only',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "fix(live-stack): harden create-mode process generation"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Fix live-stack BP/Create process generation" --body "Closes #${args.issueNumber}\\n\\nInvestigates and fixes the create-mode path that allowed non-codex agents to produce output without creating the expected .a5c/processes artifacts.")"; fi`,
      `COMMENT_BODY="$(mktemp)"`,
      `cat > "$COMMENT_BODY" <<'COMMENT'`,
      `Investigated and fixed the live-stack BP/Create issue.`,
      ``,
      `Root cause: create-mode prompts were routed through babysitter:call, whose command text can send agents toward a Skill-tool path instead of direct CLI orchestration, and create-mode validation overfit to ctx.parallel.all even though the issue contract only requires a valid persisted .a5c/processes/odyssey-live-test.mjs artifact.`,
      ``,
      `Fix: create-mode plugin prompts now use babysitter:yolo for claude-code, codex, and pi, and validation no longer requires implementation-specific parallelism.`,
      ``,
      `Verification: node scripts/agent-mux-build.cjs test packages/agent-mux/cli -- packages/agent-mux/cli/tests/live-stack/primary-live-runner.test.ts; npm run build:sdk; HOME=<tmp> npm run test:sdk; npm run verify:metadata.`,
      `COMMENT`,
      `printf '\\nPR: %s\\n' "$PR_URL" >> "$COMMENT_BODY"`,
      `gh issue comment ${args.issueNumber} --body-file "$COMMENT_BODY"`,
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
  const issueNumber = inputs?.issueNumber ?? 484;
  const branchName = inputs?.branchName ?? 'agent/issue-484';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, { issueNumber });
  const diagnosis = await ctx.task(diagnoseTask, {
    contextStdout: context?.stdout ?? '',
  });
  const implementation = await ctx.task(implementFixTask, {
    contextStdout: context?.stdout ?? '',
    diagnosis,
  });
  const verification = await ctx.task(verifyTask, {});
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(reviewTask, {
    contextStdout: context?.stdout ?? '',
    diagnosis,
    artifactsStdout: artifacts?.stdout ?? '',
    verificationStdout: verification?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      changedFiles: implementation?.changedFiles ?? [],
      diagnosis,
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, {
    issueNumber,
    branchName,
    baseBranch,
    rootCauseSummary: diagnosis?.rootCause ?? 'See PR for root cause analysis.',
    verificationSummary: verification?.stdout ? verification.stdout.slice(0, 1500) : 'Verification completed.',
  });

  return {
    success: true,
    changedFiles: implementation?.changedFiles ?? [],
    diagnosis,
    verification,
    review,
    publish,
  };
}
