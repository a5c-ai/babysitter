/**
 * @process processes/shared/local-dev/install-quality-gates
 * @description Copies selected a5c drop-in quality-gate config files from
 *   library/assets into a target repository, then commits the result.
 *   Layers: 'gitleaks' | 'commitlint' | 'eslint' | 'typos' | 'husky'.
 * @inputs { targetDir: string, layers: string[] }
 * @outputs { success: boolean, copied: string[], skipped: string[], committed: boolean }
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
import {
  mkdirSync,
  copyFileSync,
  existsSync,
  chmodSync,
} from 'node:fs';
import { execSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const ASSETS = resolve(HERE, '..', '..', '..', 'assets');

// layer -> list of { src (relative to assets), dest (relative to targetDir), mode? }
const LAYER_MAP = {
  gitleaks: [{ src: 'security/gitleaks.toml', dest: '.gitleaks.toml' }],
  commitlint: [
    { src: 'code-quality/commitlint.config.cjs', dest: 'commitlint.config.cjs' },
    { src: 'code-quality/commitlint.lenient.cjs', dest: 'commitlint.lenient.cjs' },
  ],
  eslint: [{ src: 'code-quality/eslint.config.js', dest: 'eslint.config.js' }],
  typos: [{ src: 'code-quality/typos.toml', dest: 'typos.toml' }],
  husky: [{ src: 'code-quality/husky/pre-commit', dest: '.husky/pre-commit', mode: 0o755 }],
};

const copyLayerTask = defineTask(
  'install-quality-gates-copy-layer',
  async ({ targetDir, layer }) => {
    const entries = LAYER_MAP[layer];
    if (!entries) return { layer, copied: [], skipped: [`unknown-layer:${layer}`] };
    const copied = [];
    const skipped = [];
    for (const entry of entries) {
      const absSrc = join(ASSETS, entry.src);
      const absDest = join(targetDir, entry.dest);
      if (!existsSync(absSrc)) {
        skipped.push(entry.src);
        continue;
      }
      mkdirSync(dirname(absDest), { recursive: true });
      copyFileSync(absSrc, absDest);
      if (entry.mode != null) {
        try {
          chmodSync(absDest, entry.mode);
        } catch {
          // chmod not meaningful on Windows; ignore.
        }
      }
      copied.push(entry.dest);
    }
    return { layer, copied, skipped };
  },
  { kind: 'node', title: 'Copy quality-gate layer', labels: ['a5c', 'quality-gates', 'install'] },
);

const commitTask = defineTask(
  'install-quality-gates-commit',
  async ({ targetDir, copied }) => {
    if (!copied.length) return { committed: false, reason: 'nothing-copied' };
    try {
      execSync('git add -A', { cwd: targetDir, stdio: 'pipe' });
      execSync('git commit -m "chore: install a5c quality gates"', {
        cwd: targetDir,
        stdio: 'pipe',
      });
      return { committed: true };
    } catch (err) {
      return { committed: false, reason: String(err?.message ?? err) };
    }
  },
  { kind: 'node', title: 'Commit quality-gate install', labels: ['a5c', 'quality-gates', 'git'] },
);

export async function process(inputs, ctx) {
  const { targetDir, layers = [] } = inputs ?? {};
  if (!targetDir) {
    return { success: false, copied: [], skipped: [], committed: false, reason: 'targetDir required' };
  }
  const allCopied = [];
  const allSkipped = [];
  for (const layer of layers) {
    const r = await ctx.task(copyLayerTask, { targetDir, layer });
    allCopied.push(...(r?.copied ?? []));
    allSkipped.push(...(r?.skipped ?? []));
  }
  const commitResult = await ctx.task(commitTask, { targetDir, copied: allCopied });
  return {
    success: true,
    copied: allCopied,
    skipped: allSkipped,
    committed: Boolean(commitResult?.committed),
  };
}
