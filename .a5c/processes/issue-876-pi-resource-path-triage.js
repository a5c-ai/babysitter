/**
 * @process repo/issue-876-pi-resource-path-triage
 * @description Triage PI resource-loader undefined path failure reported in issue #876.
 * @inputs { issueNumber?: number, baseBranch?: string }
 * @outputs { success, context, diagnosis, verification, publish }
 *
 * @process contrib/rogelsm/triage
 * @process methodologies/maestro/agents/hotfix-specialist
 * @process methodologies/cc10x/agents/bug-investigator
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-876.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue and PI harness context',
  labels: ['issue-876', 'pi', 'triage', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments,state,url`,
      'printf "\\n--- open prs mentioning issue ---\\n"',
      `gh pr list --state open --search "#${args.issueNumber}" --json number,title,headRefName,baseRefName,url,body`,
      'printf "\\n--- related issue 165 ---\\n"',
      'gh issue view 165 --json title,state,labels,comments,url,closedAt',
      'printf "\\n--- PI wrapper/resource loader call sites ---\\n"',
      'rg -n "resolvePiAgentDir|DEFAULT_PI_AGENT_DIR|DefaultResourceLoader|agentDir|systemPrompt|isolated|runProcessDefinitionPhase|handleHarnessCreateRun|harness:create-run|harness:yolo|harness:doctor" packages/genty packages/sdk packages/babysitter docs .a5c/processes -g "*.ts" -g "*.js" -g "*.md" | head -500',
      'printf "\\n--- git history for pi wrapper ---\\n"',
      'git log --oneline --decorate -- packages/genty/platform/src/harness/piWrapper.ts | head -20',
      'printf "\\n--- blame around PI default agent dir and loader ---\\n"',
      'git blame -L 35,60 packages/genty/platform/src/harness/piWrapper.ts',
      'git blame -L 300,380 packages/genty/platform/src/harness/piWrapper.ts',
      'printf "\\n--- relevant tests ---\\n"',
      'sed -n "110,150p" packages/genty/platform/src/harness/piWrapper.test.ts',
      'printf "\\n--- package versions ---\\n"',
      'node -e "const p=require(\\"./package.json\\"); console.log(JSON.stringify({name:p.name,version:p.version}, null, 2))"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const diagnoseTask = defineTask('issue-876.diagnose', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Diagnose issue #876 root cause',
  labels: ['issue-876', 'pi', 'triage', 'diagnosis'],
  agent: {
    name: 'pi-resource-path-triager',
    prompt: {
      role: 'senior Babysitter SDK and PI harness engineer',
      task: 'Triage issue #876 and identify the root cause and next action.',
      instructions: [
        'ISSUE AND CODE CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Analyze only from the evidence above.',
        'Determine whether #876 is a duplicate/regression of #165, whether the current branch already contains a likely source fix, and whether the npm latest package may lag the branch.',
        'Return JSON: { severity: string, rootCause: string, evidence: string[], affectedCommands: string[], affectedVersions: string[], currentBranchStatus: string, recommendedLabels: string[], recommendedNextSteps: string[], triageComment: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTask = defineTask('issue-876.verify', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify PI wrapper regression coverage',
  labels: ['issue-876', 'pi', 'triage', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'test -f packages/genty/platform/src/harness/piWrapper.ts',
      'test -f packages/genty/platform/src/harness/piWrapper.test.ts',
      'rg -n "const DEFAULT_PI_AGENT_DIR|function resolvePiAgentDir|const agentDir = resolvePiAgentDir\\(this.options.agentDir\\)|agentDir,|defaults agentDir for resource loading" packages/genty/platform/src/harness/piWrapper.ts packages/genty/platform/src/harness/piWrapper.test.ts',
      'git diff --check',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const publishTask = defineTask('issue-876.publish-comment', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Post triage comment on issue #876',
  labels: ['issue-876', 'pi', 'triage', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'COMMENT_BODY="$(mktemp)"',
      'cat > "$COMMENT_BODY" <<\'COMMENT\'',
      args.comment,
      'COMMENT',
      `gh issue comment ${args.issueNumber} --body-file "$COMMENT_BODY"`,
      'cat "$COMMENT_BODY"',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 120000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 876;
  const context = await ctx.task(readContextTask, { issueNumber });
  const diagnosis = await ctx.task(diagnoseTask, {
    contextStdout: context?.stdout ?? '',
  });
  const verification = await ctx.task(verifyTask, {});

  const fallbackComment = [
    '## Triage',
    '',
    'This reproduces the same failure class as #165: the high-level PI-backed harness initializes an isolated process-definition/session path, constructs a PI resource loader with no concrete agent directory, and PI later calls `path.join()` with `undefined` while auto-discovering resources.',
    '',
    'On the current branch, `packages/genty/platform/src/harness/piWrapper.ts` already contains the likely source fix: `resolvePiAgentDir()` defaults missing `agentDir` to `~/.pi/agent`, and both `createAgentSession` and `DefaultResourceLoader` receive that resolved value. There is also a regression test named `defaults agentDir for resource loading when none is provided` in `packages/genty/platform/src/harness/piWrapper.test.ts`.',
    '',
    'That means the report is very likely a release/publication gap for `@a5c-ai/babysitter-sdk@0.0.187` rather than an unfixed bug on the current branch, unless a Windows-specific path normalization issue remains after the default-agent-dir fix is released.',
    '',
    'Recommended labels: `bug`, `sdk`, `plugins`, `plugin-pi`, `priority:high`, `ready-for-dev`.',
    '',
    'Recommended next steps:',
    '1. Confirm which npm version first includes the `resolvePiAgentDir()` fix and publish/promote it if it is not in `latest`.',
    '2. After release, ask the reporter to rerun `babysitter harness:create-run`, `harness:yolo`, and `harness:doctor` on Windows.',
    '3. If it still reproduces after that release, add a Windows-path integration test around the high-level `harness:create-run` PI phase, not just `AgentCoreSessionHandle.initialize()`.',
  ].join('\\n');

  const comment = typeof diagnosis?.triageComment === 'string' && diagnosis.triageComment.trim()
    ? diagnosis.triageComment
    : fallbackComment;

  const publish = await ctx.task(publishTask, { issueNumber, comment });

  return {
    success: true,
    context,
    diagnosis,
    verification,
    publish,
  };
}
