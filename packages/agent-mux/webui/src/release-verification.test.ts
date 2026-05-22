import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

import { verifyAgentMuxWebuiRelease } from '../scripts/verify-release.mjs';

const baseManifest = {
  name: '@a5c-ai/agent-mux-webui',
  publishConfig: {
    access: 'public',
  },
  scripts: {
    'build:realtime': 'npm run build --workspace=@a5c-ai/agent-catalog && npm run build --workspace=@a5c-ai/agent-mux-core && npm run build --workspace=@a5c-ai/agent-mux-ui && npm run build',
    test: 'vitest run --config vitest.config.ts',
    'test:realtime':
      'vitest run --root ../../.. --config vitest.config.ts "packages/agent-mux/webui/src/pages/SessionDetailPage.test.ts" "packages/agent-mux/webui/src/pages/SessionDetailPage.route.test.tsx" "packages/agent-mux/webui/src/release-verification.test.ts"',
    'verify:release': 'node ./scripts/verify-release.mjs',
    prepublishOnly: 'npm run build:realtime && npm run test && npm run verify:release',
  },
};

const basePackEntries = [
  { path: 'package.json' },
  { path: 'README.md' },
  { path: 'dist/index.html' },
  { path: 'dist/assets/main.js' },
  { path: 'dist-types/src/main.d.ts' },
  { path: 'public/favicon.svg' },
];

function withPackageRoot(run: (packageRoot: string) => void): void {
  const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-mux-webui-release-'));
  fs.mkdirSync(path.join(packageRoot, 'dist', 'assets'), { recursive: true });
  fs.mkdirSync(path.join(packageRoot, 'dist-types', 'src'), { recursive: true });
  fs.mkdirSync(path.join(packageRoot, 'public'), { recursive: true });
  fs.writeFileSync(path.join(packageRoot, 'dist', 'index.html'), '<html></html>');
  fs.writeFileSync(path.join(packageRoot, 'dist', 'assets', 'main.js'), 'console.log("ok");');
  fs.writeFileSync(path.join(packageRoot, 'dist-types', 'src', 'main.d.ts'), 'export {};');
  fs.writeFileSync(path.join(packageRoot, 'public', 'favicon.svg'), '<svg />');
  fs.writeFileSync(
    path.join(packageRoot, 'README.md'),
    '# @a5c-ai/agent-mux-webui\n\nBuilt on `@a5c-ai/agent-mux-ui/session-flow`.\n',
  );

  try {
    run(packageRoot);
  } finally {
    fs.rmSync(packageRoot, { recursive: true, force: true });
  }
}

describe('verifyAgentMuxWebuiRelease', () => {
  it('accepts the expected realtime webui release contract', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyAgentMuxWebuiRelease({
          packageRoot,
          manifest: baseManifest,
          packEntries: basePackEntries,
        })
      ).not.toThrow();
    });
  });

  it('fails when the package-local test script is missing', () => {
    withPackageRoot((packageRoot) => {
      const manifest = {
        ...baseManifest,
        scripts: { ...baseManifest.scripts },
      } as typeof baseManifest & { scripts: Record<string, string> };
      delete manifest.scripts.test;

      expect(() =>
        verifyAgentMuxWebuiRelease({
          packageRoot,
          manifest,
          packEntries: basePackEntries,
        })
      ).toThrow(/package-local Vitest config entrypoint/);
    });
  });

  it('fails when the package-local test script stops using the webui config entrypoint', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyAgentMuxWebuiRelease({
          packageRoot,
          manifest: {
            ...baseManifest,
            scripts: {
              ...baseManifest.scripts,
              test: 'vitest run --root ../../.. --config vitest.config.ts packages/agent-mux/webui',
            },
          },
          packEntries: basePackEntries,
        })
      ).toThrow(/package-local Vitest config entrypoint/);
    });
  });

  it('fails when the realtime verification suite drops the route coverage', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyAgentMuxWebuiRelease({
          packageRoot,
          manifest: {
            ...baseManifest,
            scripts: {
              ...baseManifest.scripts,
              'test:realtime': 'vitest run --root ../../.. --config vitest.config.ts "packages/agent-mux/webui/src/pages/SessionDetailPage.test.ts"',
            },
          },
          packEntries: basePackEntries,
        })
      ).toThrow(/test:realtime/);
    });
  });

  it('fails when the packaged app drops its built assets', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyAgentMuxWebuiRelease({
          packageRoot,
          manifest: baseManifest,
          packEntries: basePackEntries.filter((entry) => entry.path !== 'dist/assets/main.js'),
        })
      ).toThrow(/dist\/assets\//);
    });
  });
});
