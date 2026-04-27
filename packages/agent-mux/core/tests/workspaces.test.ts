import * as path from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { WorkspaceService, resolveWorkspaceDefaultCwd, type WorkspaceServiceDeps, type WorkspaceSessionBinding } from '../src/workspaces.js';

function repoPath(...segments: string[]): string {
  return path.resolve(path.sep, ...segments);
}

function createDeps(): WorkspaceServiceDeps {
  const rootDir = repoPath('home', 'user', '.a5c', 'workspaces');
  const state = {
    files: new Map<string, string>(),
    dirs: new Set<string>([rootDir, repoPath('repo', 'main')]),
    symlinks: new Set<string>(),
    gitCalls: [] as Array<{ args: string[]; cwd: string }>,
  };

  return {
    readFile: vi.fn(async (targetPath: string) => {
      const value = state.files.get(targetPath);
      if (value == null) {
        throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
      }
      return value;
    }) as unknown as typeof import('node:fs/promises').readFile,
    writeFile: vi.fn(async (targetPath: string, contents: string | Buffer) => {
      state.files.set(targetPath, String(contents));
      state.dirs.add(path.dirname(targetPath));
    }) as unknown as typeof import('node:fs/promises').writeFile,
    mkdir: vi.fn(async (targetPath: string) => {
      state.dirs.add(targetPath);
    }) as unknown as typeof import('node:fs/promises').mkdir,
    rm: vi.fn(async (targetPath: string) => {
      state.dirs.delete(targetPath);
      state.symlinks.delete(targetPath);
    }) as unknown as typeof import('node:fs/promises').rm,
    symlink: vi.fn(async (_sourcePath: string, targetPath: string) => {
      state.symlinks.add(targetPath);
    }) as unknown as typeof import('node:fs/promises').symlink,
    unlink: vi.fn(async (targetPath: string) => {
      state.symlinks.delete(targetPath);
    }) as unknown as typeof import('node:fs/promises').unlink,
    stat: vi.fn(async (targetPath: string) => {
      if (state.dirs.has(targetPath) || state.symlinks.has(targetPath)) {
        return {} as never;
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    }) as unknown as typeof import('node:fs/promises').stat,
    lstat: vi.fn(async (targetPath: string) => {
      if (state.dirs.has(targetPath) || state.symlinks.has(targetPath)) {
        return {} as never;
      }
      throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    }) as unknown as typeof import('node:fs/promises').lstat,
    readdir: vi.fn(async () => []) as unknown as typeof import('node:fs/promises').readdir,
    execGit: vi.fn(async (args: string[], cwd: string) => {
      state.gitCalls.push({ args, cwd });
      const key = `${cwd}::${args.join(' ')}`;
      const responses: Record<string, { stdout: string; stderr: string }> = {
        [`${repoPath('repo', 'main')}::rev-parse --show-toplevel`]: { stdout: `${repoPath('repo', 'main')}\n`, stderr: '' },
        [`${repoPath('repo', 'main')}::branch --show-current`]: { stdout: 'main\n', stderr: '' },
        [`${repoPath('repo', 'main')}::rev-parse HEAD`]: { stdout: 'abc123\n', stderr: '' },
        [`${repoPath('repo', 'main')}::worktree add --detach ${path.join(rootDir, 'product-space', 'main')} abc123`]: { stdout: 'prepared\n', stderr: '' },
        [`${repoPath('repo', 'main')}::worktree add -b vk/product-space ${path.join(rootDir, 'product-space', 'main')}`]: { stdout: 'prepared\n', stderr: '' },
        [`${repoPath('repo', 'main')}::worktree remove --force ${path.join(rootDir, 'product-space', 'main')}`]: { stdout: 'removed\n', stderr: '' },
        [`${repoPath('repo', 'main')}::worktree add ${path.join(rootDir, 'product-space', 'main')} vk/product-space`]: { stdout: 'recovered\n', stderr: '' },
        [`${repoPath('repo', 'main')}::worktree prune`]: { stdout: 'pruned\n', stderr: '' },
      };
      const response = responses[key];
      if (!response) {
        throw new Error(`Unexpected git call: ${key}`);
      }
      if (args[0] === 'worktree' && args[1] === 'add') {
        state.dirs.add(args[2] === '--detach' ? args[3]! : args[4]!);
      }
      if (args[0] === 'worktree' && args[1] === 'remove') {
        state.dirs.delete(args[3]!);
      }
      return response;
    }),
    now: () => '2026-04-26T00:00:00.000Z',
    homedir: () => repoPath('home', 'user'),
  };
}

describe('WorkspaceService', () => {
  it('creates a worktree-backed workspace under ~/.a5c/workspaces', async () => {
    const service = new WorkspaceService(createDeps());

    const workspace = await service.createWorkspace({
      name: 'Product Space',
      repos: [{ path: repoPath('repo', 'main') }],
    });

    expect(workspace.id).toBe('product-space');
    expect(workspace.rootPath).toBe(repoPath('home', 'user', '.a5c', 'workspaces', 'product-space'));
    expect(workspace.repos[0]).toMatchObject({
      alias: 'main',
      mode: 'worktree',
      sourcePath: repoPath('repo', 'main'),
    });
    expect(resolveWorkspaceDefaultCwd(workspace)).toBe(repoPath('home', 'user', '.a5c', 'workspaces', 'product-space', 'main'));
  });

  it('uses the requested branch name directly for single-repo workspaces and preserves it for recovery', async () => {
    const deps = createDeps();
    const service = new WorkspaceService(deps);

    const workspace = await service.createWorkspace({
      name: 'Product Space',
      branchName: 'vk/product-space',
      repos: [{ path: repoPath('repo', 'main') }],
    });

    expect(workspace.repos[0]?.branch).toBe('vk/product-space');

    await service.archiveWorkspace(workspace.id);
    await service.cleanupWorkspace(workspace.id);
    await service.recoverWorkspace(workspace.id);

    expect(deps.execGit).toHaveBeenCalledWith(
      ['worktree', 'add', path.join(workspace.rootPath, 'main'), 'vk/product-space'],
      repoPath('repo', 'main'),
    );
  });

  it('reconciles live sessions onto matching workspace paths', async () => {
    const service = new WorkspaceService(createDeps());
    await service.createWorkspace({
      name: 'Product Space',
      repos: [{ path: repoPath('repo', 'main') }],
    });

    const sessions: WorkspaceSessionBinding[] = [
      {
        agent: 'codex',
        sessionId: 'session-1',
        status: 'running',
        cwd: repoPath('home', 'user', '.a5c', 'workspaces', 'product-space', 'main'),
        updatedAt: '2026-04-26T00:10:00.000Z',
      },
    ];
    const result = await service.listWorkspaces({ liveSessions: sessions });

    expect(result.workspaces[0]?.status).toBe('active');
    expect(result.workspaces[0]?.sessions[0]?.sessionId).toBe('session-1');
  });

  it('resolves worktree session context from a cwd inside the workspace', async () => {
    const service = new WorkspaceService(createDeps());
    const workspace = await service.createWorkspace({
      name: 'Product Space',
      branchName: 'vk/product-space',
      repos: [{ path: repoPath('repo', 'main') }],
    });

    const context = await service.resolveSessionContext({
      cwd: path.join(workspace.rootPath, 'main', 'src'),
    });

    expect(context).toMatchObject({
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      workspaceRootPath: workspace.rootPath,
      workspaceDefaultCwd: path.join(workspace.rootPath, 'main'),
      workspaceMode: 'worktree',
      currentPath: path.join(workspace.rootPath, 'main', 'src'),
      repo: {
        alias: 'main',
        targetPath: path.join(workspace.rootPath, 'main'),
        mode: 'worktree',
        branch: 'vk/product-space',
      },
    });
  });
});
