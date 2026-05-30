/**
 * @process repo/issue-563-live-stack-bp-gemini-flash
 * @description Investigate and fix issue #563: BP-mode gemini-flash live-stack agents produce output but miss the Odyssey artifact file.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success: boolean, diagnosis: object, changedFiles: string[], verification: object, review: object }
 *
 * @process cradle/bugfix
 * @process methodologies/pilot-shell/pilot-shell-bugfix
 * @process processes/shared/tdd-triplet
 * @process processes/shared/completeness-gate
 * @process methodologies/superpowers/systematic-debugging
 * @agent live-stack-debugger methodologies/cc10x/agents/bug-investigator/AGENT.md
 * @agent quality-auditor methodologies/spec-kit/agents/quality-auditor/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function stdoutOf(result) {
  return result?.stdout ?? result?.value?.stdout ?? '';
}

const readContextTask = defineTask('issue-563.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue #563 and live-stack BP context',
  labels: ['issue-563', 'live-stack', 'gemini-flash', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      'printf "\\n--- open prs mentioning issue ---\\n"',
      `gh pr list --state open --search "${args.issueNumber} in:body OR #${args.issueNumber} in:body OR ${args.issueNumber} in:title" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- process library matches ---\\n"',
      'rg -n "live-stack|bugfix|TDD|quality|artifact|github|ci" /home/runner/.a5c/process-library/babysitter-repo/library/cradle /home/runner/.a5c/process-library/babysitter-repo/library/methodologies /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared -g "*.js" -g "*.md" | head -250',
      'printf "\\n--- live-stack prompt/runtime surfaces ---\\n"',
      'rg -n "buildPrompt|buildPrimaryLiveStackCommands|validateAgentBehavior|file-creation|processMode|gemini-cli|pi|babysitter-plugin|odyssey-live-test|summarize-translate-test|a5c-live-test|resolveLaunchMaxTurns" packages/agent-mux/cli/tests/live-stack packages/agent-mux/adapters packages/transport-mux plugins .github -g "*.ts" -g "*.mjs" -g "*.js" -g "*.yml" -g "*.md"',
      'printf "\\n--- live-stack fixture excerpts ---\\n"',
      'sed -n "1,360p" packages/agent-mux/cli/tests/live-stack/fixtures/summarize-translate-test.mjs',
      'sed -n "1,260p" packages/agent-mux/cli/tests/live-stack/fixtures/create-process-skeleton.mjs',
      'printf "\\n--- live-stack runner excerpts ---\\n"',
      'sed -n "1,280p" packages/agent-mux/cli/tests/live-stack/primary-live-runner.ts',
      'sed -n "490,560p" packages/agent-mux/cli/tests/live-stack/primary-live-runner.ts',
      'sed -n "740,870p" packages/agent-mux/cli/tests/live-stack/primary-live-runner.ts',
      'printf "\\n--- live-stack test excerpts ---\\n"',
      'sed -n "100,290p" packages/agent-mux/cli/tests/live-stack/primary-live-runner.test.ts',
      'sed -n "720,830p" packages/agent-mux/cli/tests/live-stack/primary-live-runner.test.ts',
      'printf "\\n--- recent git context ---\\n"',
      'git log --oneline -30 -- packages/agent-mux/cli/tests/live-stack packages/agent-mux/adapters packages/transport-mux plugins .github',
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

const diagnoseTask = defineTask('issue-563.diagnose', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Diagnose BP gemini-flash artifact miss',
  labels: ['issue-563', 'live-stack', 'diagnosis'],
  agent: {
    name: 'live-stack-debugger',
    prompt: {
      role: 'senior Babysitter live-stack and agent orchestration engineer',
      task: 'Diagnose issue #563 without editing code.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Trace the runtime call path from live-stack scenario command construction to plugin-mode prompt, Babysitter process fixture setup, agent execution, and artifact validation.',
        'Identify the smallest source change that makes BP/plugin mode more deterministic for weaker instruction-following gemini-flash agents while preserving transport/proxy validation.',
        'Gather at least two independent evidence signals from issue text, code, tests, or fixtures.',
        'Return JSON: { rootCause: string, runtimeCallPaths: string[], evidenceSignals: string[], affectedFiles: string[], fixPlan: string[], testPlan: string[], risks: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTask = defineTask('issue-563.implement', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement BP gemini-flash hardening and tests',
  labels: ['issue-563', 'live-stack', 'implementation'],
  agent: {
    name: 'live-stack-implementer',
    prompt: {
      role: 'senior TypeScript maintainer for live-stack CI',
      task: 'Implement the focused issue #563 fix and regression coverage.',
      instructions: [
        'SPEC (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'DIAGNOSIS (verbatim JSON):',
        '---',
        JSON.stringify(args.diagnosis ?? {}, null, 2),
        '---',
        'Edit the repository directly.',
        'Keep changes scoped to files on the diagnosed live-stack BP/plugin execution path.',
        'Make the required output path and file-write obligation deterministic in the runtime process/prompt path for weaker instruction-following models.',
        'Add or update a focused regression fixture/test that simulates substantial model output without an artifact and proves the hardened path or validation behavior.',
        'Do not stage or modify unrelated dirty workspace files.',
        'Return JSON: { changedFiles: string[], summary: string, testsAdded: string[], verificationCommands: string[] }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-563.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run targeted issue #563 verification',
  labels: ['issue-563', 'live-stack', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'git diff --check',
      'node scripts/agent-mux-build.cjs test packages/agent-mux/cli -- packages/agent-mux/cli/tests/live-stack/primary-live-runner.test.ts packages/agent-mux/cli/tests/live-stack/scenario-contract.test.ts',
      'npm run build --workspace=@a5c-ai/atlas',
      'npm run build --workspace=@a5c-ai/agent-catalog',
      'npm run build --workspace=@a5c-ai/agent-mux-observability',
      'npm run build --workspace=@a5c-ai/agent-comm-mux',
      'npm run build --workspace=@a5c-ai/agent-mux-adapters',
      'npm run build --workspace=@a5c-ai/agent-mux-gateway',
      'npm run build --workspace=@a5c-ai/transport-mux',
      'npm run build --workspace=@a5c-ai/agent-mux-cli',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 900000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-563.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read final diff for issue #563',
  labels: ['issue-563', 'live-stack', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short --branch',
      'git diff -- packages/agent-mux/cli/tests/live-stack .a5c/processes/issue-563-live-stack-bp-gemini-flash.mjs',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 60000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const reviewTask = defineTask('issue-563.review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review issue #563 fix against spec',
  labels: ['issue-563', 'live-stack', 'review'],
  agent: {
    name: 'quality-auditor',
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

export async function process(inputs, ctx) {
  const issueNumber = inputs.issueNumber ?? 563;
  const branchName = inputs.branchName ?? 'agent/issue-563';
  const baseBranch = inputs.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, { issueNumber, branchName, baseBranch });
  const contextStdout = stdoutOf(context);
  const diagnosis = await ctx.task(diagnoseTask, { contextStdout });
  const implementation = await ctx.task(implementTask, { contextStdout, diagnosis });
  const verification = await ctx.task(verifyTask, { implementation });
  const artifacts = await ctx.task(readArtifactsTask, { issueNumber, branchName, baseBranch });
  const review = await ctx.task(reviewTask, {
    contextStdout,
    artifactsStdout: stdoutOf(artifacts),
    verificationStdout: stdoutOf(verification),
  });

  return {
    success: review?.approved !== false,
    diagnosis,
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
  };
}
