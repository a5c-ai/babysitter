import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { verifyAgentMuxTuiRelease } from '../scripts/verify-release.mjs';

const baseManifest = {
  name: '@a5c-ai/agent-mux-tui',
  publishConfig: {
    access: 'public',
  },
  files: ['dist', 'specs', 'README.md', 'LICENSE'],
  bin: {
    'amux-tui': './dist/bin/amux-tui.js',
  },
  exports: {
    './plugin': {
      import: {
        types: './dist/plugin.d.ts',
        default: './dist/plugin.js',
      },
    },
  },
  scripts: {
    build: 'cd ../../.. && node scripts/agent-mux-build.cjs build packages/agent-mux/tui',
    test: 'cd ../../.. && node scripts/agent-mux-build.cjs test packages/agent-mux/tui',
    'verify:release': 'node ./scripts/verify-release.mjs',
    prepublishOnly: 'npm run build && npm run verify:release',
  },
};

const basePackEntries = [
  { path: 'package.json' },
  { path: 'README.md' },
  { path: 'dist/index.js' },
  { path: 'dist/index.d.ts' },
  { path: 'dist/plugin.js' },
  { path: 'dist/plugin.d.ts' },
  { path: 'dist/bin/amux-tui.js' },
  { path: 'specs/kanban-workspaces-spec.md' },
  { path: 'specs/kanban-workspaces-subtasks.md' },
];

function withPackageRoot(run: (packageRoot: string) => void): void {
  const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-mux-tui-release-'));
  fs.mkdirSync(path.join(packageRoot, 'dist', 'bin'), { recursive: true });
  fs.writeFileSync(path.join(packageRoot, 'dist', 'index.js'), 'export {};');
  fs.writeFileSync(path.join(packageRoot, 'dist', 'index.d.ts'), 'export {};');
  fs.writeFileSync(path.join(packageRoot, 'dist', 'plugin.js'), 'export {};');
  fs.writeFileSync(path.join(packageRoot, 'dist', 'plugin.d.ts'), 'export {};');
  fs.writeFileSync(path.join(packageRoot, 'dist', 'bin', 'amux-tui.js'), 'export {};');
  fs.writeFileSync(
    path.join(packageRoot, 'README.md'),
    [
      '# @a5c-ai/agent-mux-tui',
      '',
      '- Spec: [`specs/kanban-workspaces-spec.md`](specs/kanban-workspaces-spec.md)',
      '- Backlog decomposition: [`specs/kanban-workspaces-subtasks.md`](specs/kanban-workspaces-subtasks.md)',
      '',
    ].join('\n')
  );

  try {
    run(packageRoot);
  } finally {
    fs.rmSync(packageRoot, { recursive: true, force: true });
  }
}

describe('verifyAgentMuxTuiRelease', () => {
  it('accepts the expected TUI release contract', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyAgentMuxTuiRelease({
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
        verifyAgentMuxTuiRelease({
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

  it('fails when the plugin export is removed', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyAgentMuxTuiRelease({
          packageRoot,
          manifest: {
            ...baseManifest,
            exports: {},
          },
          packEntries: basePackEntries,
        })
      ).toThrow(/\.\/plugin/);
    });
  });

  it('fails when the README-linked backlog decomposition spec falls out of the tarball', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyAgentMuxTuiRelease({
          packageRoot,
          manifest: baseManifest,
          packEntries: basePackEntries.filter(
            (entry) => entry.path !== 'specs/kanban-workspaces-subtasks.md',
          ),
        })
      ).toThrow(/kanban-workspaces-subtasks\.md/);
    });
  });

  it('fails when the README stops linking the local kanban/workspaces spec', () => {
    withPackageRoot((packageRoot) => {
      fs.writeFileSync(
        path.join(packageRoot, 'README.md'),
        '# @a5c-ai/agent-mux-tui\n\nNo local spec links.\n',
      );

      expect(() =>
        verifyAgentMuxTuiRelease({
          packageRoot,
          manifest: baseManifest,
          packEntries: basePackEntries,
        })
      ).toThrow(/kanban-workspaces-spec\.md/);
    });
  });
});
