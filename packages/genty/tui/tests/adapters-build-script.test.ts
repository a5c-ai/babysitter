import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { afterEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const {
  buildVitestCommand,
  packages,
  run,
} = require('../../../../scripts/adapters-build.cjs') as {
  buildVitestCommand: (testFiles: string[], forwardedArgs?: string[]) => string;
  packages: string[];
  run: (
    argv: string[],
    options?: {
      repoRoot?: string;
      execSyncImpl?: (command: string, options: { cwd: string; stdio: string }) => void;
      log?: (message: string) => void;
      error?: (message: string) => void;
    }
  ) => number;
};

const tempDirs: string[] = [];

function createFixtureRepo() {
  const root = mkdtempSync(path.join(tmpdir(), 'adapters-build-'));
  tempDirs.push(root);

  for (const pkg of packages) {
    const dir = path.join(root, pkg);
    mkdirSync(dir, { recursive: true });
    const isTui = pkg === 'packages/adapters/tui';
    writeFileSync(path.join(dir, 'package.json'), JSON.stringify({
      name: pkg,
      scripts: isTui ? { build: 'echo build', 'build:local': 'echo build:local' } : { build: 'echo build' },
    }));
  }

  return root;
}

function writeFile(root: string, relativePath: string, content = '') {
  const fullPath = path.join(root, relativePath);
  mkdirSync(path.dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content);
}

afterEach(() => {
  while (tempDirs.length > 0) {
    rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

describe('scripts/adapters-build.cjs', () => {
  it('builds prerequisites in package order before the targeted TUI package', () => {
    const repoRoot = createFixtureRepo();
    const commands: Array<{ command: string; cwd: string }> = [];
    const expectedPackages = packages.slice(0, packages.indexOf('packages/adapters/tui') + 1);

    const exitCode = run(['build', 'packages/adapters/tui'], {
      repoRoot,
      execSyncImpl: (command, options) => {
        commands.push({ command, cwd: options.cwd });
      },
      log: vi.fn(),
      error: vi.fn(),
    });

    expect(exitCode).toBe(0);
    expect(packages[0]).toBe('packages/atlas');
    expect(packages.indexOf('packages/atlas')).toBeLessThan(packages.indexOf('packages/adapters/core'));
    expect(packages).not.toContain(['packages', 'agent-catalog'].join('/'));
    expect(packages.indexOf('packages/adapters/sdk')).toBeLessThan(packages.indexOf('packages/adapters/tui'));
    expect(packages.indexOf('packages/adapters/webui')).toBeGreaterThan(packages.indexOf('packages/adapters/tui'));
    expect(commands).toHaveLength(expectedPackages.length);
    expect(commands.map(({ cwd }) => path.relative(repoRoot, cwd).split(path.sep).join('/'))).toEqual(expectedPackages);
    expect(commands.slice(0, -1).every(({ command }) => command === 'npm run build')).toBe(true);
    expect(commands.at(-1)).toEqual({
      command: 'npm run build:local',
      cwd: path.join(repoRoot, 'packages/adapters/tui'),
    });
  });

  it('scopes test mode to target-package files under the TUI roots', () => {
    const repoRoot = createFixtureRepo();
    const commands: Array<{ command: string; cwd: string }> = [];

    writeFile(repoRoot, 'packages/adapters/tui/tests/session-detail.test.tsx');
    writeFile(repoRoot, 'packages/adapters/tui/src/config-view.test.tsx');
    writeFile(repoRoot, 'packages/adapters/core/tests/provider-profiles.test.ts');
    writeFile(repoRoot, 'packages/adapters/tests/shared-regression.test.ts');

    const exitCode = run(['test', 'packages/adapters/tui'], {
      repoRoot,
      execSyncImpl: (command, options) => {
        commands.push({ command, cwd: options.cwd });
      },
      log: vi.fn(),
      error: vi.fn(),
    });

    expect(exitCode).toBe(0);
    expect(commands).toEqual([{
      command: buildVitestCommand([
        'packages/adapters/tui/tests/session-detail.test.tsx',
        'packages/adapters/tui/src/config-view.test.tsx',
      ]),
      cwd: repoRoot,
    }]);
  });

  it('uses an explicit single-file target after `--` and forwards remaining vitest args', () => {
    const repoRoot = createFixtureRepo();
    const commands: Array<{ command: string; cwd: string }> = [];

    writeFile(repoRoot, 'packages/adapters/tui/tests/session-detail.test.tsx');
    writeFile(repoRoot, 'packages/adapters/tui/tests/focused.test.tsx');

    const exitCode = run(['test', 'packages/adapters/tui', '--', 'packages/adapters/tui/tests/focused.test.tsx', '--reporter=dot'], {
      repoRoot,
      execSyncImpl: (command, options) => {
        commands.push({ command, cwd: options.cwd });
      },
      log: vi.fn(),
      error: vi.fn(),
    });

    expect(exitCode).toBe(0);
    expect(commands).toEqual([{
      command: buildVitestCommand(
        ['packages/adapters/tui/tests/focused.test.tsx'],
        ['--reporter=dot'],
      ),
      cwd: repoRoot,
    }]);
  });
});
