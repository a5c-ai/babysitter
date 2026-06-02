import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { verifyAgentMuxUiRelease } from '../scripts/verify-release.mjs';

const baseManifest = {
  name: '@a5c-ai/agent-mux-ui',
  publishConfig: {
    access: 'public',
  },
  exports: {
    './session-flow': {
      import: {
        types: './dist/session-flow.d.ts',
        default: './dist/session-flow.js',
      },
    },
  },
  scripts: {
    'build:realtime': 'npm run build --workspace=@a5c-ai/atlas && npm run build --workspace=@a5c-ai/agent-mux-comm && npm run build',
    test: 'vitest run --root ../../.. --config vitest.config.ts packages/agent-mux/ui',
    'test:realtime':
      'vitest run --root ../../.. --config vitest.config.ts "packages/agent-mux/ui/src/session-flow*.test.ts" "packages/agent-mux/ui/src/screens/SessionDetailScreen.test.tsx" "packages/agent-mux/ui/src/release-verification.test.ts"',
    'verify:release': 'node ./scripts/verify-release.mjs',
    prepublishOnly: 'npm run build:realtime && npm run test:realtime && npm run verify:release',
  },
};

const basePackEntries = [
  { path: 'package.json' },
  { path: 'README.md' },
  { path: 'dist/index.js' },
  { path: 'dist/index.d.ts' },
  { path: 'dist/session-flow.js' },
  { path: 'dist/session-flow.d.ts' },
];

function withPackageRoot(run: (packageRoot: string) => void): void {
  const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-mux-ui-release-'));
  fs.mkdirSync(path.join(packageRoot, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(packageRoot, 'dist', 'index.js'), 'export {};');
  fs.writeFileSync(path.join(packageRoot, 'dist', 'index.d.ts'), 'export {};');
  fs.writeFileSync(path.join(packageRoot, 'dist', 'session-flow.js'), 'export {};');
  fs.writeFileSync(path.join(packageRoot, 'dist', 'session-flow.d.ts'), 'export {};');
  fs.writeFileSync(
    path.join(packageRoot, 'README.md'),
    '# @a5c-ai/agent-mux-ui\n\nUse `@a5c-ai/agent-mux-ui/session-flow` for realtime execution views.\n',
  );

  try {
    run(packageRoot);
  } finally {
    fs.rmSync(packageRoot, { recursive: true, force: true });
  }
}

describe('verifyAgentMuxUiRelease', () => {
  it('accepts the expected public session-flow release contract', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyAgentMuxUiRelease({
          packageRoot,
          manifest: baseManifest,
          packEntries: basePackEntries,
        })
      ).not.toThrow();
    });
  });

  it('fails when the public session-flow export is removed', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyAgentMuxUiRelease({
          packageRoot,
          manifest: {
            ...baseManifest,
            exports: {},
          },
          packEntries: basePackEntries,
        })
      ).toThrow(/session-flow/);
    });
  });

  it('fails when the realtime verification suite stops including release verification', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyAgentMuxUiRelease({
          packageRoot,
          manifest: {
            ...baseManifest,
            scripts: {
              ...baseManifest.scripts,
              'test:realtime': 'vitest run --root ../../.. --config vitest.config.ts "packages/agent-mux/ui/src/session-flow*.test.ts"',
            },
          },
          packEntries: basePackEntries,
        })
      ).toThrow(/test:realtime/);
    });
  });

  it('fails when the package-local test script stops targeting the ui package', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyAgentMuxUiRelease({
          packageRoot,
          manifest: {
            ...baseManifest,
            scripts: {
              ...baseManifest.scripts,
              test: 'vitest run --root ../../.. --config vitest.config.ts "packages/agent-mux/ui/src/**/*.test.ts"',
            },
          },
          packEntries: basePackEntries,
        })
      ).toThrow(/package-local Vitest filter/);
    });
  });

  it('fails when the session-flow tarball artifacts are missing', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyAgentMuxUiRelease({
          packageRoot,
          manifest: baseManifest,
          packEntries: basePackEntries.filter((entry) => entry.path !== 'dist/session-flow.js'),
        })
      ).toThrow(/dist\/session-flow\.js/);
    });
  });
});
