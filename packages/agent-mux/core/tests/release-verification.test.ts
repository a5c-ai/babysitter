import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { verifyAgentMuxCoreRelease } from '../scripts/verify-release.mjs';

const baseManifest = {
  name: '@a5c-ai/agent-mux-comm',
  main: './dist/index.js',
  module: './dist/index.js',
  types: './dist/index.d.ts',
  publishConfig: {
    access: 'public',
  },
  files: ['dist', 'README.md', 'LICENSE'],
  exports: {
    '.': {
      import: {
        types: './dist/index.d.ts',
        default: './dist/index.js',
      },
      require: {
        types: './dist/index.d.ts',
        default: './dist/index.js',
      },
      default: './dist/index.js',
    },
    './browser': {
      import: {
        types: './dist/browser.d.ts',
        default: './dist/browser.js',
      },
      require: {
        types: './dist/browser.d.ts',
        default: './dist/browser.js',
      },
      default: './dist/browser.js',
    },
    './kanban': {
      import: {
        types: './dist/kanban.d.ts',
        default: './dist/kanban.js',
      },
      require: {
        types: './dist/kanban.d.ts',
        default: './dist/kanban.js',
      },
      default: './dist/kanban.js',
    },
    './automation': {
      import: {
        types: './dist/automation.d.ts',
        default: './dist/automation.js',
      },
      require: {
        types: './dist/automation.d.ts',
        default: './dist/automation.js',
      },
      default: './dist/automation.js',
    },
  },
  scripts: {
    build: 'tsc --build && tsc --emitDeclarationOnly --declarationMap false -p tsconfig.json',
    test: 'vitest run --root ../../.. --config vitest.config.ts packages/agent-mux/core',
    'verify:release': 'node ./scripts/verify-release.mjs',
    prepublishOnly: 'npm run build && npm run test && npm run verify:release',
  },
};

const basePackEntries = [
  { path: 'package.json' },
  { path: 'README.md' },
  { path: 'LICENSE' },
  { path: 'dist/index.js' },
  { path: 'dist/index.d.ts' },
  { path: 'dist/browser.js' },
  { path: 'dist/browser.d.ts' },
  { path: 'dist/kanban.js' },
  { path: 'dist/kanban.d.ts' },
  { path: 'dist/automation.js' },
  { path: 'dist/automation.d.ts' },
];

function withPackageRoot(run: (packageRoot: string) => void): void {
  const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-comm-mux-release-'));
  fs.mkdirSync(path.join(packageRoot, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(packageRoot, 'dist', 'index.js'), 'export {};');
  fs.writeFileSync(path.join(packageRoot, 'dist', 'index.d.ts'), 'export {};');
  fs.writeFileSync(path.join(packageRoot, 'dist', 'browser.js'), 'export {};');
  fs.writeFileSync(path.join(packageRoot, 'dist', 'browser.d.ts'), 'export {};');
  fs.writeFileSync(path.join(packageRoot, 'dist', 'kanban.js'), 'export {};');
  fs.writeFileSync(path.join(packageRoot, 'dist', 'kanban.d.ts'), 'export {};');
  fs.writeFileSync(path.join(packageRoot, 'dist', 'automation.js'), 'export {};');
  fs.writeFileSync(path.join(packageRoot, 'dist', 'automation.d.ts'), 'export {};');
  fs.writeFileSync(
    path.join(packageRoot, 'README.md'),
    [
      '# @a5c-ai/agent-mux-comm',
      '',
      '- `@a5c-ai/agent-mux-comm`',
      '- `@a5c-ai/agent-mux-comm/browser`',
      '- `@a5c-ai/agent-mux-comm/kanban`',
      '- `@a5c-ai/agent-mux-comm/automation`',
      '',
      'npm run build --workspace=@a5c-ai/agent-mux-comm',
      'npm run test --workspace=@a5c-ai/agent-mux-comm',
      'npm run verify:release --workspace=@a5c-ai/agent-mux-comm',
      'npm pack --json --dry-run --workspace=@a5c-ai/agent-mux-comm',
      '',
    ].join('\n')
  );

  try {
    run(packageRoot);
  } finally {
    fs.rmSync(packageRoot, { recursive: true, force: true });
  }
}

describe('verifyAgentMuxCoreRelease', () => {
  it('accepts the expected public release contract', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyAgentMuxCoreRelease({
          packageRoot,
          manifest: baseManifest,
          packEntries: basePackEntries,
        })
      ).not.toThrow();
    });
  });

  it('fails when prepublishOnly stops enforcing verify:release', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyAgentMuxCoreRelease({
          packageRoot,
          manifest: {
            ...baseManifest,
            scripts: {
              ...baseManifest.scripts,
              prepublishOnly: 'npm run build',
            },
          },
          packEntries: basePackEntries,
        })
      ).toThrow(/prepublishOnly/);
    });
  });

  it('fails when the automation export is removed', () => {
    withPackageRoot((packageRoot) => {
      const manifest = {
        ...baseManifest,
        exports: { ...baseManifest.exports },
      } as typeof baseManifest;
      delete manifest.exports['./automation'];

      expect(() =>
        verifyAgentMuxCoreRelease({
          packageRoot,
          manifest,
          packEntries: basePackEntries,
        })
      ).toThrow(/automation/);
    });
  });

  it('fails when the package-local test command changes away from the stable Vitest filter', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyAgentMuxCoreRelease({
          packageRoot,
          manifest: {
            ...baseManifest,
            scripts: {
              ...baseManifest.scripts,
              test: 'vitest run tests/release-verification.test.ts',
            },
          },
          packEntries: basePackEntries,
        })
      ).toThrow(/package-local Vitest command/);
    });
  });

  it('fails when the tarball drops the automation artifact', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyAgentMuxCoreRelease({
          packageRoot,
          manifest: baseManifest,
          packEntries: basePackEntries.filter((entry) => entry.path !== 'dist/automation.js'),
        })
      ).toThrow(/dist\/automation\.js/);
    });
  });

  it('fails when the README stops documenting the automation surface', () => {
    withPackageRoot((packageRoot) => {
      fs.writeFileSync(
        path.join(packageRoot, 'README.md'),
        [
          '# @a5c-ai/agent-mux-comm',
          '',
          '- `@a5c-ai/agent-mux-comm`',
          '- `@a5c-ai/agent-mux-comm/browser`',
          '- `@a5c-ai/agent-mux-comm/kanban`',
          '',
          'npm run build --workspace=@a5c-ai/agent-mux-comm',
          'npm run test --workspace=@a5c-ai/agent-mux-comm',
          'npm run verify:release --workspace=@a5c-ai/agent-mux-comm',
          'npm pack --json --dry-run --workspace=@a5c-ai/agent-mux-comm',
          '',
        ].join('\n')
      );

      expect(() =>
        verifyAgentMuxCoreRelease({
          packageRoot,
          manifest: baseManifest,
          packEntries: basePackEntries,
        })
      ).toThrow(/agent-comm-mux\/automation/);
    });
  });
});
