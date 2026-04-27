import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { verifyKanbanRelease } from '../../../scripts/verify-release.mjs';

const baseManifest = {
  name: '@a5c-ai/kanban',
  private: false,
  publishConfig: {
    access: 'public',
  },
  bin: {
    kanban: './dist/cli.js',
    'kanban-mcp-server': './dist/mcp-server.js',
  },
  scripts: {
    build: 'npm run build --workspace=@a5c-ai/agent-catalog && npm run build --workspace=@a5c-ai/agent-mux-observability && npm run build --workspace=@a5c-ai/agent-mux-core && npm run build --workspace=@a5c-ai/agent-mux-ui && next build',
    'build:realtime': 'npm run build && npm run build:cli',
    'build:cli':
      "node -e \"const esbuild=require('esbuild');const v=require('./package.json').version;esbuild.buildSync({entryPoints:['src/cli.ts'],bundle:true,platform:'node',target:'node18',outfile:'dist/cli.js',external:['next'],define:{'__CLI_VERSION__':JSON.stringify(v)}});esbuild.buildSync({entryPoints:['src/mcp/cli.ts'],bundle:true,platform:'node',target:'node18',outfile:'dist/mcp-server.js',banner:{js:'#!/usr/bin/env node'},external:['@a5c-ai/agent-mux-core','@a5c-ai/agent-mux-core/kanban'],define:{'__KANBAN_MCP_VERSION__':JSON.stringify(v)}})\"",
    prepublishOnly: 'npm run build && npm run build:cli && npm run verify:release',
    'test:realtime':
      'npm run build --workspace=@a5c-ai/agent-catalog && npm run build --workspace=@a5c-ai/agent-mux-observability && npm run build --workspace=@a5c-ai/agent-mux-core && npm run build --workspace=@a5c-ai/agent-mux-ui && vitest run "src/components/sessions/__tests__/session-observability-panel.test.tsx" "src/components/runs/__tests__/run-realtime-execution-panel.test.tsx" "src/app/runs/[runId]/__tests__/page.test.tsx" "src/lib/__tests__/release-verification.test.ts"',
    'test:dispatch-context-labels':
      'npm run build --workspace=@a5c-ai/agent-catalog && npm run build --workspace=@a5c-ai/agent-mux-observability && npm run build --workspace=@a5c-ai/agent-mux-core && vitest run src/lib/services/__tests__/dispatch-context-label-service.test.ts src/lib/services/__tests__/backlog-query-service.test.ts src/hooks/__tests__/use-backlog.test.ts src/app/settings/__tests__/page.test.tsx src/lib/__tests__/release-verification.test.ts',
  },
};

const basePackEntries = [
  { path: 'package.json' },
  { path: 'README.md' },
  { path: 'LICENSE' },
  { path: 'specs/task-tags-spec.md' },
  { path: 'specs/dispatch-context-labels-spec.md' },
  { path: 'specs/dispatch-context-labels-subtasks.md' },
  { path: 'next.config.mjs' },
  { path: 'postcss.config.mjs' },
  { path: 'tsconfig.json' },
  { path: 'src/cli.ts' },
  { path: 'src/mcp/cli.ts' },
  { path: 'dist/cli.js' },
  { path: 'dist/mcp-server.js' },
  { path: '.next/BUILD_ID' },
  { path: '.next/package.json' },
  { path: '.next/server/app.js' },
  { path: '.next/static/chunks/app.js' },
];

function withPackageRoot(run: (packageRoot: string) => void): void {
  const packageRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'kanban-release-'));
  fs.mkdirSync(path.join(packageRoot, 'dist'), { recursive: true });
  fs.mkdirSync(path.join(packageRoot, '.next', 'server'), { recursive: true });
  fs.mkdirSync(path.join(packageRoot, '.next', 'static'), { recursive: true });
  fs.writeFileSync(path.join(packageRoot, 'dist', 'cli.js'), 'cli');
  fs.writeFileSync(path.join(packageRoot, 'dist', 'mcp-server.js'), 'mcp');
  fs.writeFileSync(path.join(packageRoot, '.next', 'BUILD_ID'), 'build-id');
  fs.writeFileSync(path.join(packageRoot, '.next', 'package.json'), '{"type":"commonjs"}');
  fs.writeFileSync(
    path.join(packageRoot, 'README.md'),
    [
      '# @a5c-ai/kanban',
      '',
      '[Task Tags](./specs/task-tags-spec.md)',
      '[Dispatch Context Labels](./specs/dispatch-context-labels-spec.md)',
      '[Dispatch Context Label Subtasks](./specs/dispatch-context-labels-subtasks.md)',
      '',
    ].join('\n')
  );

  try {
    run(packageRoot);
  } finally {
    fs.rmSync(packageRoot, { recursive: true, force: true });
  }
}

describe('verifyKanbanRelease', () => {
  it('accepts the expected kanban release contract', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyKanbanRelease({
          packageRoot,
          manifest: baseManifest,
          packEntries: basePackEntries,
        })
      ).not.toThrow();
    });
  });

  it('fails when prepublishOnly stops enforcing the package-local verifier', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyKanbanRelease({
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

  it('fails when build:cli stops producing the MCP server binary', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyKanbanRelease({
          packageRoot,
          manifest: {
            ...baseManifest,
            scripts: {
              ...baseManifest.scripts,
              'build:cli': "node -e \"console.log('cli only')\"",
            },
          },
          packEntries: basePackEntries,
        })
      ).toThrow(/build:cli/);
    });
  });

  it('fails when build:realtime stops pairing the app build with build:cli', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyKanbanRelease({
          packageRoot,
          manifest: {
            ...baseManifest,
            scripts: {
              ...baseManifest.scripts,
              'build:realtime': 'npm run build',
            },
          },
          packEntries: basePackEntries,
        })
      ).toThrow(/build:realtime/);
    });
  });

  it('fails when build regresses to the monorepo-wide helper', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyKanbanRelease({
          packageRoot,
          manifest: {
            ...baseManifest,
            scripts: {
              ...baseManifest.scripts,
              build: 'node ../../scripts/agent-mux-build.cjs build && next build',
            },
          },
          packEntries: basePackEntries,
        })
      ).toThrow(/build must stay scoped/);
    });
  });

  it('fails when packed next build output is missing', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyKanbanRelease({
          packageRoot,
          manifest: baseManifest,
          packEntries: basePackEntries.filter((entry) => entry.path !== '.next/BUILD_ID'),
        })
      ).toThrow(/\.next\/BUILD_ID/);
    });
  });

  it('fails when dispatch context label specs fall out of the package tarball', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyKanbanRelease({
          packageRoot,
          manifest: baseManifest,
          packEntries: basePackEntries.filter(
            (entry) => entry.path !== 'specs/dispatch-context-labels-spec.md',
          ),
        })
      ).toThrow(/dispatch-context-labels-spec\.md/);
    });
  });

  it('fails when the Task Tags spec falls out of the package tarball', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyKanbanRelease({
          packageRoot,
          manifest: baseManifest,
          packEntries: basePackEntries.filter((entry) => entry.path !== 'specs/task-tags-spec.md'),
        })
      ).toThrow(/task-tags-spec\.md/);
    });
  });

  it('fails when the README stops linking the Task Tags spec', () => {
    withPackageRoot((packageRoot) => {
      fs.writeFileSync(
        path.join(packageRoot, 'README.md'),
        [
          '# @a5c-ai/kanban',
          '',
          '[Dispatch Context Labels](./specs/dispatch-context-labels-spec.md)',
          '',
        ].join('\n')
      );

      expect(() =>
        verifyKanbanRelease({
          packageRoot,
          manifest: baseManifest,
          packEntries: basePackEntries,
        })
      ).toThrow(/README\.md must keep linking \.\/specs\/task-tags-spec\.md/);
    });
  });

  it('fails when the package-local dispatch context verification suite is removed', () => {
    withPackageRoot((packageRoot) => {
      const manifest = {
        ...baseManifest,
        scripts: { ...baseManifest.scripts },
      } as Record<string, unknown>;
      delete (manifest.scripts as Record<string, string>)['test:dispatch-context-labels'];

      expect(() =>
        verifyKanbanRelease({
          packageRoot,
          manifest,
          packEntries: basePackEntries,
        })
      ).toThrow(/test:dispatch-context-labels/);
    });
  });

  it('fails when the package-local realtime verification suite is removed', () => {
    withPackageRoot((packageRoot) => {
      const manifest = {
        ...baseManifest,
        scripts: { ...baseManifest.scripts },
      } as Record<string, unknown>;
      delete (manifest.scripts as Record<string, string>)['test:realtime'];

      expect(() =>
        verifyKanbanRelease({
          packageRoot,
          manifest,
          packEntries: basePackEntries,
        })
      ).toThrow(/test:realtime/);
    });
  });

  it('accepts npm pack entries that still include the tarball package prefix', () => {
    withPackageRoot((packageRoot) => {
      expect(() =>
        verifyKanbanRelease({
          packageRoot,
          manifest: baseManifest,
          packEntries: basePackEntries.map((entry) => ({ path: `package/${entry.path}` })),
        })
      ).not.toThrow();
    });
  });
});
