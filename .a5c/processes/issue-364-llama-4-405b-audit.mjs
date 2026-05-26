/**
 * @process repo/issue-364-llama-4-405b-audit
 * @description Audit and correct Atlas Llama 4 405B graph records against official Llama 4 releases.
 * @inputs { issueNumber: number, qualityCommands: string[] }
 * @outputs { success, issueSpec, officialAudit, repoAudit, implementation, verification, changedFiles, diff }
 * @process methodologies/rpikit/rpikit-research
 * @process methodologies/rpikit/rpikit-implement
 * @process methodologies/superpowers/verification-before-completion
 * @process specializations/collaboration/github/branch-policies
 * @process specializations/collaboration/github/issue-linking
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function taskStdout(result) {
  return result?.stdout ?? result?.value?.stdout ?? '';
}

const readIssueSpecTask = defineTask('issue-364.read-issue-spec', ({ issueNumber }) => ({
  kind: 'shell',
  title: 'Read issue spec from GitHub',
  command: `gh issue view ${issueNumber} --json title,body,labels,comments`,
  expectedExitCode: 0,
  labels: ['github', 'spec', 'issue'],
}));

const auditOfficialSourcesTask = defineTask('issue-364.audit-official-sources', () => ({
  kind: 'shell',
  title: 'Audit official Llama 4 release surfaces',
  command: [
    'set -euo pipefail',
    'tmp="$(mktemp -d)"',
    'trap \'rm -rf "$tmp"\' EXIT',
    'curl -fsSL https://raw.githubusercontent.com/meta-llama/llama-models/main/models/llama4/MODEL_CARD.md -o "$tmp/meta-model-card.md"',
    'curl -fsSL https://huggingface.co/api/collections/meta-llama/llama-4 -o "$tmp/hf-collection.json"',
    'echo "## Meta llama4 MODEL_CARD identifiers"',
    'rg -n "Llama 4 (Scout|Maverick|Behemoth)|405B|405 B|model_id|Llama-4" "$tmp/meta-model-card.md" || true',
    'echo',
    'echo "## Hugging Face Llama 4 collection model IDs"',
    'node -e "const fs=require(\'fs\'); const data=JSON.parse(fs.readFileSync(process.argv[1],\'utf8\')); const items=data.items||data.collectionItems||[]; for (const item of items) { const id=item.item?.id||item.id||item.modelId; if (id) console.log(id); }" "$tmp/hf-collection.json"',
    'echo',
    'echo "## Llama 4 405B search in official source snapshots"',
    'if rg -n "Llama[- ]4[^\\n]*(405B|405 B|405b)|(405B|405 B|405b)[^\\n]*Llama[- ]4|Llama-4-405" "$tmp"; then exit 1; else echo "No Llama 4 405B identifier found in official Meta model card or HF Llama 4 collection."; fi',
  ].join('\n'),
  expectedExitCode: 0,
  labels: ['research', 'official-sources', 'model-version'],
}));

const auditRepoSurfaceTask = defineTask('issue-364.audit-repo-surface', () => ({
  kind: 'shell',
  title: 'Audit Atlas Llama 4 graph surface',
  command: [
    'set -euo pipefail',
    'rg -n "llama-4-405b-instruct|evidence:hf-model-card-llama-4-405b-instruct|Llama 4 405B|llama-4-405b|llama-4.*405b|llama-4.*405B" packages/atlas/graph',
    'echo',
    'sed -n "1,120p" packages/atlas/graph/compute/model-families/llama-4.yaml',
    'echo',
    'sed -n "1,120p" packages/atlas/graph/compute/models/llama-4-405b-instruct.yaml',
  ].join('\n'),
  expectedExitCode: 0,
  labels: ['repo', 'graph', 'audit'],
}));

const implementGraphCorrectionTask = defineTask('issue-364.implement-graph-correction', ({ issueSpec, officialAudit, repoAudit }) => ({
  kind: 'agent',
  title: 'Implement Llama 4 graph correction',
  labels: ['implementation', 'atlas', 'graph', 'model-version'],
  agent: {
    name: 'atlas-model-version-update-engineer',
    prompt: {
      role: 'senior Atlas graph maintainer',
      task: 'Correct the Atlas Llama 4 graph so it does not publish unsupported Llama 4 405B Instruct facts.',
      instructions: [
        'Compare SPEC, OFFICIAL_AUDIT, and REPO_AUDIT directly.',
        'Remove the unsupported model:llama-4-405b-instruct@current record and its claim/evidence/eval/provider/family references, unless a concrete official source in OFFICIAL_AUDIT proves the exact public model exists.',
        'Keep existing public Llama 4 Scout and Maverick records. Ensure model-family:llama-4 has_version points at Scout and Maverick.',
        'Retarget provider serves edges away from the unsupported 405B record only to already-present official Llama 4 records that the provider file already supports or the graph has existing evidence for.',
        'Do not invent hosted-provider availability beyond the existing graph surface.',
        'Keep edits scoped to packages/atlas/graph and this issue process artifact files.',
        'Return JSON: { changedFiles: string[], summary: string, unsupported405bRemoved: boolean, scoutMaverickFamilyLinked: boolean, notes: string }.',
        '',
        'SPEC (verbatim):',
        '---',
        issueSpec,
        '---',
        '',
        'OFFICIAL_AUDIT (verbatim):',
        '---',
        officialAudit,
        '---',
        '',
        'REPO_AUDIT (verbatim):',
        '---',
        repoAudit,
        '---',
      ],
    },
  },
}));

const verifyNoUnsupported405bTask = defineTask('issue-364.verify-no-unsupported-405b', () => ({
  kind: 'shell',
  title: 'Verify unsupported Llama 4 405B graph references are gone',
  command: 'if rg -n "llama-4-405b-instruct|evidence:hf-model-card-llama-4-405b-instruct|Llama 4 405B" packages/atlas/graph; then exit 1; fi',
  expectedExitCode: 0,
  labels: ['verification', 'grep', 'graph'],
}));

const verifyScoutMaverickFamilyTask = defineTask('issue-364.verify-scout-maverick-family', () => ({
  kind: 'shell',
  title: 'Verify Llama 4 family points at public releases',
  command: [
    'set -euo pipefail',
    'rg -n "model:llama-4-scout@current|model:llama-4-maverick@current" packages/atlas/graph/compute/model-families/llama-4.yaml',
    'test "$(rg -c "model:llama-4-scout@current" packages/atlas/graph/compute/model-families/llama-4.yaml)" -ge 1',
    'test "$(rg -c "model:llama-4-maverick@current" packages/atlas/graph/compute/model-families/llama-4.yaml)" -ge 1',
  ].join('\n'),
  expectedExitCode: 0,
  labels: ['verification', 'graph'],
}));

const runQualityCommandTask = defineTask('issue-364.run-quality-command', ({ command, index }) => ({
  kind: 'shell',
  title: `Run quality command ${index}`,
  command,
  expectedExitCode: 0,
  labels: ['verification', 'quality-gate'],
}));

const summarizeDiffTask = defineTask('issue-364.summarize-diff', () => ({
  kind: 'shell',
  title: 'Summarize final diff',
  command: 'git diff -- .a5c/processes/issue-364-llama-4-405b-audit.mjs .a5c/processes/issue-364-llama-4-405b-audit.inputs.json .a5c/processes/issue-364-llama-4-405b-audit.process.md .a5c/processes/issue-364-llama-4-405b-audit.mermaid.md packages/atlas/graph',
  expectedExitCode: 0,
  labels: ['git', 'review'],
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 364;
  const qualityCommands = inputs?.qualityCommands ?? [
    'npm run verify:metadata',
    'npm run build --workspace=@a5c-ai/atlas',
  ];

  const issueSpec = await ctx.task(readIssueSpecTask, { issueNumber }, { key: 'issue-364.issue-spec' });
  const officialAudit = await ctx.task(auditOfficialSourcesTask, {}, { key: 'issue-364.official-audit' });
  const repoAudit = await ctx.task(auditRepoSurfaceTask, {}, { key: 'issue-364.repo-audit' });

  const implementation = await ctx.task(implementGraphCorrectionTask, {
    issueSpec: taskStdout(issueSpec),
    officialAudit: taskStdout(officialAudit),
    repoAudit: taskStdout(repoAudit),
  }, { key: 'issue-364.implementation' });

  const no405bVerification = await ctx.task(verifyNoUnsupported405bTask, {}, { key: 'issue-364.verify-no-unsupported-405b' });
  const familyVerification = await ctx.task(verifyScoutMaverickFamilyTask, {}, { key: 'issue-364.verify-scout-maverick-family' });

  const qualityResults = [];
  for (let index = 0; index < qualityCommands.length; index += 1) {
    qualityResults.push(await ctx.task(runQualityCommandTask, {
      command: qualityCommands[index],
      index: index + 1,
    }, { key: `issue-364.quality.${index + 1}` }));
  }

  const diff = await ctx.task(summarizeDiffTask, {}, { key: 'issue-364.diff' });

  return {
    success: true,
    issueSpec: taskStdout(issueSpec),
    officialAudit: taskStdout(officialAudit),
    repoAudit: taskStdout(repoAudit),
    implementation,
    verification: {
      no405bVerification,
      familyVerification,
      qualityResults,
    },
    changedFiles: implementation?.changedFiles ?? [],
    diff: taskStdout(diff),
  };
}
