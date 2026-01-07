import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { listRunIds, waitForNewRunId } from '../core/runPolling';

function makeTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

suite('runPolling', () => {
  test('prefers the new run closest after afterTimeMs when multiple candidates exist', async () => {
    const tempDir = makeTempDir('babysitter-runpolling-');
    try {
      const runsRootPath = path.join(tempDir, 'runs');
      fs.mkdirSync(runsRootPath, { recursive: true });
      fs.mkdirSync(path.join(runsRootPath, 'run-old'), { recursive: true });

      const baselineIds = new Set(listRunIds(runsRootPath));
      const afterTimeMs = Date.now();

      const runEarly = 'run-early';
      const runLate = 'run-late';
      const earlyPath = path.join(runsRootPath, runEarly);
      const latePath = path.join(runsRootPath, runLate);
      fs.mkdirSync(earlyPath, { recursive: true });
      fs.mkdirSync(latePath, { recursive: true });

      fs.utimesSync(earlyPath, new Date(afterTimeMs + 100), new Date(afterTimeMs + 100));
      fs.utimesSync(latePath, new Date(afterTimeMs + 1000), new Date(afterTimeMs + 1000));

      const found = await waitForNewRunId({
        runsRootPath,
        baselineIds,
        timeoutMs: 250,
        pollIntervalMs: 10,
        afterTimeMs,
        stablePolls: 1,
      });
      assert.strictEqual(found, runEarly);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

