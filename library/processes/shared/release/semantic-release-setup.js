/**
 * @process processes/shared/release/semantic-release-setup
 * @description Copies the a5c semantic-release config (.releaserc.cjs) into a target
 *   repo and scaffolds .github/workflows/release.yml to run semantic-release on push
 *   to main. Pure node tasks — no agent.
 * @inputs { targetDir: string, branches?: string[] }
 * @outputs { success: boolean, copied: string[], workflowWritten: boolean }
 *
 * @graph
 *   domains: [domain:software-engineering]
 *   skillAreas: [skill-area:code-review-practice, skill-area:e2e-testing]
 *   workflows: [workflow:code-review, workflow:feature-development, workflow:release-management]
 *   topics: [topic:test-driven-development, topic:code-review-best-practices]
 *   roles: [role:backend-engineer, role:tech-lead, role:qa-engineer]
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';
import { mkdirSync, copyFileSync, writeFileSync, existsSync } from 'node:fs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS = resolve(HERE, '..', '..', '..', 'assets');

const WORKFLOW_YAML = `name: release

on:
  push:
    branches:
      - main

permissions:
  contents: write
  issues: write
  pull-requests: write
  packages: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx semantic-release
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: \${{ secrets.NPM_TOKEN }}
`;

const copyReleasercTask = defineTask(
  'semantic-release-setup-copy-releaserc',
  async ({ targetDir }) => {
    const src = join(ASSETS, 'release', 'releaserc.cjs');
    const dest = join(targetDir, '.releaserc.cjs');
    if (!existsSync(src)) return { copied: [], skipped: ['release/releaserc.cjs'] };
    copyFileSync(src, dest);
    return { copied: ['.releaserc.cjs'], skipped: [] };
  },
  { kind: 'node', title: 'Copy .releaserc.cjs', labels: ['a5c', 'release', 'semantic-release'] },
);

const writeWorkflowTask = defineTask(
  'semantic-release-setup-write-workflow',
  async ({ targetDir }) => {
    const destDir = join(targetDir, '.github', 'workflows');
    mkdirSync(destDir, { recursive: true });
    const dest = join(destDir, 'release.yml');
    writeFileSync(dest, WORKFLOW_YAML, 'utf8');
    return { workflowWritten: true, path: '.github/workflows/release.yml' };
  },
  { kind: 'node', title: 'Scaffold release.yml workflow', labels: ['a5c', 'release', 'ci'] },
);

export async function process(inputs, ctx) {
  const { targetDir } = inputs ?? {};
  if (!targetDir) {
    return { success: false, copied: [], workflowWritten: false, reason: 'targetDir required' };
  }
  const r1 = await ctx.task(copyReleasercTask, { targetDir });
  const r2 = await ctx.task(writeWorkflowTask, { targetDir });
  return {
    success: true,
    copied: r1?.copied ?? [],
    workflowWritten: Boolean(r2?.workflowWritten),
  };
}
