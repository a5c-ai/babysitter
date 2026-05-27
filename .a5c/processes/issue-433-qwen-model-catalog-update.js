/**
 * @process repo/issue-433-qwen-model-catalog-update
 * @description Track Alibaba Qwen 3.7/3.6 and Qwen3.5 Omni catalog updates in the Atlas graph with official evidence.
 * @inputs { issueNumber?: number, branchName?: string, baseBranch?: string }
 * @outputs { success, phases, summary, changedFiles, verification, publish }
 *
 * @process methodologies/gsd/map-codebase
 * @process methodologies/gsd/research-phase
 * @process methodologies/gsd/execute-phase
 * @process methodologies/superpowers/verification-before-completion
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const readContextTask = defineTask('issue-433.read-context', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read issue, source, process, and Qwen graph context',
  labels: ['issue-433', 'qwen', 'graph', 'context'],
  shell: {
    command: [
      'set -euo pipefail',
      `gh issue view ${args.issueNumber} --json title,body,labels,comments`,
      `gh pr list --state open --limit 100 --json number,title,headRefName,baseRefName,url,body --jq '.[] | select(((.body // "") | contains("#${args.issueNumber}")) or ((.body // "") | contains("${args.issueNumber}")) or (.title | contains("${args.issueNumber}")))'`,
      'printf "\\n--- official source snapshots ---\\n"',
      'for url in "https://modelstudio.alibabacloud.com/" "https://help.aliyun.com/zh/model-studio/models" "https://help.aliyun.com/zh/model-studio/qwen-api-via-dashscope" "https://help.aliyun.com/zh/model-studio/model-pricing"; do',
      '  printf "\\n### %s\\n" "$url"',
      '  curl -L --max-time 30 -A "Mozilla/5.0" "$url" 2>/dev/null | rg -i -C 5 "qwen3\\.7-max|qwen3\\.6-plus|qwen3\\.6-flash|qwen3\\.5-omni-plus|Qwen3\\.7-Max|Qwen3\\.6-Plus" || true',
      'done',
      'printf "\\n--- process references ---\\n"',
      'rg -n "graph-update|model-version|Atlas graph|catalog|evidence|claim|verify" /home/runner/.a5c/process-library/babysitter-repo/library/methodologies /home/runner/.a5c/process-library/babysitter-repo/library/processes/shared .a5c/processes -g "*.js" -g "*.md" | head -240',
      'printf "\\n--- Qwen graph surface ---\\n"',
      'rg -n "qwen3.7|max|qwen3.6|qwen3.5-omni|qwen3-coder|qwen-3|qwen-2-5|alibaba-cloud|dashscope|openai-chat|passthrough" packages/atlas/graph packages/agent-catalog packages/transport-mux -g "*.yaml" -g "*.ts" -g "*.mjs" | head -800',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 180000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const implementTrackingTask = defineTask('issue-433.implement-tracking', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Implement Qwen model catalog tracking',
  labels: ['issue-433', 'qwen', 'implementation'],
  agent: {
    name: 'qwen-model-catalog-implementer',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Track Alibaba Qwen 3.7/3.6 and Qwen3.5 Omni catalog updates in the Atlas graph.',
      instructions: [
        'SPEC AND CONTEXT (verbatim):',
        '---',
        args.contextStdout,
        '---',
        'Edit the repository directly.',
        'Read files before editing them.',
        'Keep changes tightly scoped to issue #433 and the live Atlas graph/model catalog surfaces.',
        'Preserve unrelated local worktree changes.',
        'Use existing graph/evidence/claim YAML patterns.',
        'Add model-version/evidence claims for qwen3.7-max, qwen3.6-plus, qwen3.6-flash, and qwen3.5-omni-plus only where official Alibaba Cloud Model Studio surfaces confirm current status.',
        'Record pricing/context conservatively from official source text; do not infer unconfirmed Azure/Bedrock/Vertex availability.',
        'Avoid duplicating existing Qwen3-Coder-Next claims.',
        'Return JSON: { changedFiles: string[], summary: string, verificationNotes: string[], commitMessage: string }.',
      ],
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const verifyTrackingTask = defineTask('issue-433.verify-tracking', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Verify Qwen graph tracking',
  labels: ['issue-433', 'qwen', 'verification'],
  shell: {
    command: [
      'set -euo pipefail',
      'test -f packages/atlas/graph/compute/models/qwen3-7-max.yaml',
      'test -f packages/atlas/graph/compute/models/qwen3-6-plus.yaml',
      'test -f packages/atlas/graph/compute/models/qwen3-6-flash.yaml',
      'test -f packages/atlas/graph/compute/models/qwen3-5-omni-plus.yaml',
      'rg -n "model:qwen3-7-max@current|model:qwen3-6-plus@current|model:qwen3-6-flash@current|model:qwen3-5-omni-plus@current" packages/atlas/graph/compute/model-families packages/atlas/graph/compute/providers/alibaba-cloud.yaml',
      'rg -n "alibabaModelStudio: qwen3\\.7-max|alibabaModelStudio: qwen3\\.6-plus|alibabaModelStudio: qwen3\\.6-flash|alibabaModelStudio: qwen3\\.5-omni-plus" packages/atlas/graph/compute/models',
      'rg -n "evidence:alibaba-model-studio-qwen-catalog-2026-05|qwen3\\.7-max|qwen3\\.6-plus|qwen3\\.6-flash|qwen3\\.5-omni-plus" packages/atlas/graph/catalog-meta/evidence-sources packages/atlas/graph/catalog-meta/claims',
      'npm run verify:metadata',
      'npm run build --workspace=@a5c-ai/atlas',
      'npm run validate:edges',
      'git diff --check',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 600000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const readArtifactsTask = defineTask('issue-433.read-artifacts', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Read changed Qwen artifacts for review',
  labels: ['issue-433', 'qwen', 'artifacts'],
  shell: {
    command: [
      'set -euo pipefail',
      'git status --short',
      'git diff -- packages/atlas/graph/compute/models packages/atlas/graph/compute/model-families packages/atlas/graph/compute/providers/alibaba-cloud.yaml packages/atlas/graph/catalog-meta/evidence-sources packages/atlas/graph/catalog-meta/claims .a5c/processes/issue-433-qwen-model-catalog-update.js',
    ].join('\n'),
    expectedExitCode: 0,
    timeout: 30000,
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/inputs.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
}));

const finalReviewTask = defineTask('issue-433.final-review', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Review Qwen tracking against issue spec',
  labels: ['issue-433', 'qwen', 'review'],
  agent: {
    name: 'qwen-model-catalog-reviewer',
    prompt: {
      role: 'senior Atlas graph reviewer',
      task: 'Compare issue #433 requirements to the final artifacts.',
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

const publishTask = defineTask('issue-433.publish', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Commit, push, create PR, and comment on issue',
  labels: ['issue-433', 'qwen', 'publish'],
  shell: {
    command: [
      'set -euo pipefail',
      'git add packages/atlas/graph/compute/models/qwen3-7-max.yaml packages/atlas/graph/compute/models/qwen3-6-plus.yaml packages/atlas/graph/compute/models/qwen3-6-flash.yaml packages/atlas/graph/compute/models/qwen3-5-omni-plus.yaml',
      'git add packages/atlas/graph/compute/model-families/qwen-3-7.yaml packages/atlas/graph/compute/model-families/qwen-3-6.yaml packages/atlas/graph/compute/model-families/qwen-3-5-omni.yaml packages/atlas/graph/compute/providers/alibaba-cloud.yaml',
      'git add packages/atlas/graph/catalog-meta/evidence-sources/qwen-model-studio-catalog-2026-05.yaml packages/atlas/graph/catalog-meta/claims/model-version-qwen-3-7-3-6-omni-evidence-claims-2026-05.yaml',
      'git add -f .a5c/processes/issue-433-qwen-model-catalog-update.js',
      'if ! git diff --cached --quiet; then GIT_AUTHOR_NAME="a5c automation" GIT_AUTHOR_EMAIL="actions@users.noreply.github.com" GIT_COMMITTER_NAME="a5c automation" GIT_COMMITTER_EMAIL="actions@users.noreply.github.com" git commit -m "feat(atlas): track Qwen 3.7 and 3.6 catalog updates"; fi',
      `git push -u origin ${args.branchName}`,
      `PR_URL="$(gh pr list --head ${args.branchName} --json url --jq '.[0].url // empty' 2>/dev/null || true)"`,
      `if [ -z "$PR_URL" ]; then PR_URL="$(gh pr create --base ${args.baseBranch} --head ${args.branchName} --title "Track Alibaba Qwen 3.7 and 3.6 model catalog updates" --body "Closes #${args.issueNumber}")"; fi`,
      `gh issue comment ${args.issueNumber} --body "$(printf 'Tracked Alibaba Qwen model catalog updates in the Atlas graph.\\n\\n- Added current model records for qwen3.7-max, qwen3.6-plus, qwen3.6-flash, and qwen3.5-omni-plus.\\n- Added Alibaba Cloud Model Studio evidence and model-version claims for official catalog presence, capabilities, context/pricing where confirmed, and provider availability.\\n- Kept Azure/Bedrock/Vertex availability unclaimed for these non-coder IDs.\\n- Ran metadata, Atlas build, edge validation, and diff checks.\\n\\nPR: %s' "$PR_URL")"`,
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
  const issueNumber = inputs?.issueNumber ?? 433;
  const branchName = inputs?.branchName ?? 'agent/issue-433';
  const baseBranch = inputs?.baseBranch ?? 'staging';

  const context = await ctx.task(readContextTask, { issueNumber });
  const implementation = await ctx.task(implementTrackingTask, {
    contextStdout: context?.stdout ?? '',
  });
  const verification = await ctx.task(verifyTrackingTask, {});
  const artifacts = await ctx.task(readArtifactsTask, {});
  const review = await ctx.task(finalReviewTask, {
    contextStdout: context?.stdout ?? '',
    artifactsStdout: artifacts?.stdout ?? '',
  });

  if (review?.approved === false) {
    return {
      success: false,
      phases: ['context', 'implementation', 'verification', 'review'],
      summary: review?.summary ?? 'Final review did not approve Qwen model tracking.',
      changedFiles: implementation?.changedFiles ?? [],
      verification,
      review,
    };
  }

  const publish = await ctx.task(publishTask, { issueNumber, branchName, baseBranch });

  return {
    success: true,
    phases: ['context', 'implementation', 'verification', 'review', 'publish'],
    summary: implementation?.summary ?? 'Tracked Alibaba Qwen 3.7 and 3.6 catalog updates.',
    changedFiles: implementation?.changedFiles ?? [],
    verification,
    review,
    publish,
  };
}
