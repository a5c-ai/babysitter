import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import type { PtyExitEvent, PtyProcess } from '../core/ptyProcess';
import { dispatchNewRunViaO } from '../core/oDispatch';

function makeTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function createFakePtyProcess(pid = 123): PtyProcess {
  const dataHandlers = new Set<(data: string) => void>();
  const exitHandlers = new Set<(event: PtyExitEvent) => void>();
  let disposed = false;

  return {
    pid,
    write: () => undefined,
    onData: (handler) => {
      if (disposed) return () => undefined;
      dataHandlers.add(handler);
      return () => dataHandlers.delete(handler);
    },
    onExit: (handler) => {
      if (disposed) return () => undefined;
      exitHandlers.add(handler);
      return () => exitHandlers.delete(handler);
    },
    kill: () => undefined,
    detach: () => {
      disposed = true;
      dataHandlers.clear();
      exitHandlers.clear();
    },
    dispose: () => {
      disposed = true;
      dataHandlers.clear();
      exitHandlers.clear();
    },
  };
}

suite('dispatchNewRunViaO timeout fallback', () => {
  test('resolves from run directory polling without waiting for runInfoTimeoutMs', async () => {
    const tempDir = makeTempDir('babysitter-dispatch-fallback-');
    try {
      const workspaceRoot = path.join(tempDir, 'workspace');
      const runsRootPath = path.join(tempDir, 'runs');
      fs.mkdirSync(workspaceRoot, { recursive: true });
      fs.mkdirSync(runsRootPath, { recursive: true });

      fs.mkdirSync(path.join(runsRootPath, 'run-old'), { recursive: true });

      const fakePty = createFakePtyProcess(777);
      const startMs = Date.now();
      const promise = dispatchNewRunViaO({
        oBinaryPath: 'o',
        workspaceRoot,
        runsRootPath,
        prompt: 'hello',
        runInfoTimeoutMs: 5_000,
        runDirFallbackTimeoutMs: 5_000,
        runDirFallbackPollIntervalMs: 5,
        __testOnly_spawnPtyProcess: () => fakePty,
      });

      fs.mkdirSync(path.join(runsRootPath, 'run-new'), { recursive: true });

      const result = await Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('dispatch did not resolve quickly')), 500),
        ),
      ]);
      assert.ok(Date.now() - startMs < 5_000);
      assert.strictEqual(result.runId, 'run-new');
      assert.strictEqual(result.runRootPath, path.join(runsRootPath, 'run-new'));
      assert.strictEqual(result.pid, 777);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
