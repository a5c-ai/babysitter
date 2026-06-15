/**
 * @process repo/issue-324-droid-0-132-1-assimilation
 * @description Assimilate Droid @factory/cli 0.132.1 into adapter, docs, and Atlas graph metadata.
 * @inputs { issueNumber: number, title: string, labels: string[], targetPackage: string, targetVersion: string, stalePackage: string, qualityCommands: string[] }
 * @outputs { success, packageAudit, implementation, verification, changedFiles }
 * @process specializations/code-migration-modernization/dependency-analysis-updates
 * @process specializations/collaboration/github/branch-policies
 * @process specializations/collaboration/github/issue-linking
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

function taskStdout(result) {
  return result?.stdout ?? result?.value?.stdout ?? '';
}

const readIssueSpecTask = defineTask('issue-324.read-issue-spec', ({ issueNumber }) => ({
  kind: 'shell',
  title: 'Read issue spec from GitHub',
  command: `gh issue view ${issueNumber} --json title,body,labels,comments`,
  expectedExitCode: 0,
  labels: ['github', 'spec', 'issue'],
}));

const auditDroidPackageTask = defineTask('issue-324.audit-droid-package', ({ targetPackage, targetVersion, stalePackage }) => ({
  kind: 'shell',
  title: 'Audit Droid package availability',
  command: [
    `npm view ${targetPackage}@${targetVersion} name version bin dist.tarball --json`,
    `if npm view ${stalePackage}@${targetVersion} version --json >/tmp/issue-324-stale-package.json 2>/tmp/issue-324-stale-package.err; then`,
    `  echo "UNEXPECTED_STALE_PACKAGE_PUBLISHED"; cat /tmp/issue-324-stale-package.json; exit 1;`,
    `else`,
    `  echo "${stalePackage}@${targetVersion} is not published, as expected";`,
    `  cat /tmp/issue-324-stale-package.err;`,
    `fi`,
  ].join('\n'),
  expectedExitCode: 0,
  labels: ['npm', 'dependency', 'audit'],
}));

const auditRepoSurfaceTask = defineTask('issue-324.audit-repo-surface', () => ({
  kind: 'shell',
  title: 'Audit Droid repo metadata surface',
  command: [
    'rg -n "@factory/droid-cli|@factory/cli|agent-version:droid@current|droid-adapter|installMethods" packages/adapters packages/atlas docs/adapters/reference/agents/droid.md',
    'sed -n "1,80p" packages/atlas/graph/agent-stack/versions/droid-current.yaml',
  ].join('\n'),
  expectedExitCode: 0,
  labels: ['repo', 'graph', 'adapter', 'docs'],
}));

const implementDroidAssimilationTask = defineTask('issue-324.implement-droid-assimilation', ({ issueSpec, packageAudit, repoAudit, targetPackage, targetVersion, stalePackage }) => ({
  kind: 'agent',
  title: 'Implement Droid 0.132.1 assimilation',
  labels: ['implementation', 'droid', 'adapter', 'graph'],
  agent: {
    name: 'agent-version-update-engineer',
    prompt: {
      role: 'senior TypeScript and Atlas graph maintainer',
      task: 'Assimilate Droid CLI 0.132.1 with minimal code, doc, and metadata changes.',
      instructions: [
        'Treat SPEC as the source of truth. Compare package audit and repo audit to the SPEC directly.',
        `Use ${targetPackage}@${targetVersion} as the canonical npm package.`,
        `Remove stale ${stalePackage} install hints from live adapter metadata, tests, and user-facing Droid docs.`,
        'Keep Atlas Droid graph metadata on the canonical package and version range. If it already matches, do not churn it.',
        'Update focused tests that assert install methods.',
        'Do not change unrelated adapters, generated dist artifacts, or marketplace files.',
        'Return JSON: { changedFiles: string[], summary: string, graphMetadataAlreadyCurrent: boolean, stalePackageRemoved: boolean, notes: string }.',
        '',
        'SPEC (verbatim):',
        '---',
        issueSpec,
        '---',
        '',
        'PACKAGE AUDIT (verbatim):',
        '---',
        packageAudit,
        '---',
        '',
        'REPO AUDIT (verbatim):',
        '---',
        repoAudit,
        '---',
      ],
    },
  },
}));

const verifyNoStalePackageTask = defineTask('issue-324.verify-no-stale-package', ({ stalePackage }) => ({
  kind: 'shell',
  title: 'Verify stale package references are gone from live Droid surfaces',
  command: `if rg -n "${stalePackage}" packages/adapters/adapters/src/droid-adapter.ts packages/adapters/adapters/tests/droid-adapter.test.ts docs/adapters/reference/agents/droid.md; then exit 1; fi`,
  expectedExitCode: 0,
  labels: ['verification', 'grep'],
}));

const verifyCanonicalPackageTask = defineTask('issue-324.verify-canonical-package', ({ targetPackage, targetVersion }) => ({
  kind: 'shell',
  title: 'Verify canonical Droid package metadata',
  command: [
    `rg -n "${targetPackage}" packages/adapters/adapters/src/droid-adapter.ts packages/adapters/adapters/tests/droid-adapter.test.ts docs/adapters/reference/agents/droid.md packages/atlas/graph/agent-stack/versions/droid-current.yaml`,
    `rg -n ">=${targetVersion}|${targetVersion}" packages/atlas/graph/agent-stack/versions/droid-current.yaml`,
  ].join('\n'),
  expectedExitCode: 0,
  labels: ['verification', 'graph', 'adapter'],
}));

const runQualityCommandTask = defineTask('issue-324.run-quality-command', ({ command, index }) => ({
  kind: 'shell',
  title: `Run quality command ${index}`,
  command,
  expectedExitCode: 0,
  labels: ['verification', 'quality-gate'],
}));

const summarizeDiffTask = defineTask('issue-324.summarize-diff', () => ({
  kind: 'shell',
  title: 'Summarize final diff',
  command: 'git diff -- packages/adapters/adapters/src/droid-adapter.ts packages/adapters/adapters/tests/droid-adapter.test.ts docs/adapters/reference/agents/droid.md packages/atlas/graph/agent-stack/versions/droid-current.yaml',
  expectedExitCode: 0,
  labels: ['git', 'review'],
}));

export async function process(inputs, ctx) {
  const issueNumber = inputs?.issueNumber ?? 324;
  const targetPackage = inputs?.targetPackage ?? '@factory/cli';
  const targetVersion = inputs?.targetVersion ?? '0.132.1';
  const stalePackage = inputs?.stalePackage ?? '@factory/droid-cli';
  const qualityCommands = inputs?.qualityCommands ?? [
    'npm exec -- vitest run --config vitest.config.ts packages/adapters/adapters/tests/droid-adapter.test.ts',
    'npm run verify:metadata',
  ];

  const issueSpec = await ctx.task(readIssueSpecTask, { issueNumber }, { key: 'issue-324.issue-spec' });
  const packageAudit = await ctx.task(auditDroidPackageTask, { targetPackage, targetVersion, stalePackage }, { key: 'issue-324.package-audit' });
  const repoAudit = await ctx.task(auditRepoSurfaceTask, {}, { key: 'issue-324.repo-audit' });

  const implementation = await ctx.task(implementDroidAssimilationTask, {
    issueSpec: taskStdout(issueSpec),
    packageAudit: taskStdout(packageAudit),
    repoAudit: taskStdout(repoAudit),
    targetPackage,
    targetVersion,
    stalePackage,
  }, { key: 'issue-324.implementation' });

  const stalePackageVerification = await ctx.task(verifyNoStalePackageTask, { stalePackage }, { key: 'issue-324.verify-no-stale-package' });
  const canonicalPackageVerification = await ctx.task(verifyCanonicalPackageTask, { targetPackage, targetVersion }, { key: 'issue-324.verify-canonical-package' });

  const qualityResults = [];
  for (let index = 0; index < qualityCommands.length; index += 1) {
    qualityResults.push(await ctx.task(runQualityCommandTask, {
      command: qualityCommands[index],
      index: index + 1,
    }, { key: `issue-324.quality.${index + 1}` }));
  }

  const diff = await ctx.task(summarizeDiffTask, {}, { key: 'issue-324.diff' });

  return {
    success: true,
    packageAudit: taskStdout(packageAudit),
    implementation,
    verification: {
      stalePackageVerification,
      canonicalPackageVerification,
      qualityResults,
    },
    changedFiles: implementation?.changedFiles ?? [],
    diff: taskStdout(diff),
  };
}
