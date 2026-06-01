import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { generateInstallShared } from '../installSharedGenerator.js';
import { generateExtraFiles } from '../transformEmitters.js';
import { requireTargetProfile } from '../targets';
import type { A5cPluginManifest } from '../types';

const CODEX_PROFILE = requireTargetProfile('codex');
const GITHUB_COPILOT_PROFILE = requireTargetProfile('github-copilot');

function createManifest(overrides: Partial<A5cPluginManifest> = {}): A5cPluginManifest {
  return {
    name: 'test-plugin',
    version: '1.0.0',
    description: 'Test plugin',
    author: 'Test',
    license: 'MIT',
    ...overrides,
  };
}

describe('shared manifest sets', () => {
  it('resolves extra file sets with target template vars before inline overrides', () => {
    const sourceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mux-extra-files-'));
    fs.mkdirSync(path.join(sourceDir, 'per-harness', 'github'), { recursive: true });
    fs.writeFileSync(path.join(sourceDir, 'per-harness', 'github', 'README.md'), 'shared readme\n');
    fs.writeFileSync(path.join(sourceDir, 'per-harness', 'github', 'babysit-SKILL.md'), 'shared skill\n');

    const manifest = createManifest({
      extraFileSets: {
        readme: {
          'README.md': 'file:per-harness/{{targetDir}}/README.md',
        },
        babysit: {
          'skills/babysit/SKILL.md': 'file:per-harness/{{targetDir}}/babysit-SKILL.md',
        },
      },
      targets: {
        'github-copilot': {
          templateVars: {
            targetDir: 'github',
          },
          extraFileSets: ['readme', 'babysit'],
          extraFiles: {
            'README.md': 'inline readme override\n',
          },
        },
      },
    });

    const files = generateExtraFiles(sourceDir, manifest, GITHUB_COPILOT_PROFILE, []);
    const readme = files.filter((file) => file.path === 'README.md').at(-1);
    expect(readme?.content).toBe('inline readme override\n');
    expect(files.find((file) => file.path === 'skills/babysit/SKILL.md')?.content).toBe('shared skill\n');
  });

  it('deduplicates shared harness export sets while preserving target-local exports', () => {
    const manifest = createManifest({
      harnessInstallSurfaceExportSets: {
        bundle: ['PLUGIN_BUNDLE_ENTRIES', 'copyRecursive', 'copyPluginBundle'],
        hooks: ['mergeManagedHooksConfig', 'warnWindowsHooks'],
      },
      targets: {
        codex: {
          harnessInstallSurfaceExportSets: ['bundle', 'hooks'],
          harnessInstallSurfaceExports: ['copyRecursive', 'customExport'],
        },
      },
    });

    const generated = generateInstallShared(manifest, CODEX_PROFILE);
    const exportsBlock = generated.match(/module\.exports = \{\n([\s\S]*?)\n\};/);
    expect(exportsBlock?.[1]).toBeTruthy();
    const exportNames = exportsBlock![1]
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
    expect(exportNames.filter((name) => name === 'copyRecursive')).toHaveLength(1);
    expect(exportNames).toEqual(expect.arrayContaining([
      'PLUGIN_BUNDLE_ENTRIES',
      'copyRecursive',
      'copyPluginBundle',
      'mergeManagedHooksConfig',
      'warnWindowsHooks',
      'customExport',
    ]));

    const orderedNames = [
      'PLUGIN_BUNDLE_ENTRIES',
      'copyRecursive',
      'copyPluginBundle',
      'mergeManagedHooksConfig',
      'warnWindowsHooks',
      'customExport',
    ];
    const orderedIndexes = orderedNames.map((name) => exportNames.indexOf(name));
    expect(orderedIndexes).toEqual([...orderedIndexes].sort((a, b) => a - b));
  });
});
