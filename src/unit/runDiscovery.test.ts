import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { discoverRuns } from '../core/runDiscovery';

function makeTempDir(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

suite('runDiscovery', () => {
  test('returns empty when runs root does not exist', () => {
    const tempDir = makeTempDir('babysitter-runDiscovery-');
    try {
      const missingRunsRoot = path.join(tempDir, 'does-not-exist');
      assert.deepStrictEqual(discoverRuns(missingRunsRoot), []);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('discovers run ids by scanning runs root directories', () => {
    const tempDir = makeTempDir('babysitter-runDiscovery-');
    try {
      const runsRoot = path.join(tempDir, '.a5c', 'runs');
      fs.mkdirSync(runsRoot, { recursive: true });

      const runA = path.join(runsRoot, 'run-20260105-010206');
      fs.mkdirSync(runA, { recursive: true });
      writeJson(path.join(runA, 'state.json'), { runId: 'run-20260105-010206', status: 'running' });

      const runPlus = path.join(runsRoot, 'run-20260105-105111+');
      fs.mkdirSync(runPlus, { recursive: true });
      writeJson(path.join(runPlus, 'state.json'), {
        runId: 'run-20260105-105111+',
        status: 'completed',
      });

      const runWeird = path.join(runsRoot, 'anything-goes');
      fs.mkdirSync(runWeird, { recursive: true });
      writeJson(path.join(runWeird, 'state.json'), { runId: 'anything-goes', status: 'running' });

      const runs = discoverRuns(runsRoot);
      const byId = new Map(runs.map((r) => [r.id, r]));

      assert.strictEqual(byId.get('run-20260105-010206')?.status, 'running');
      assert.strictEqual(byId.get('run-20260105-105111+')?.status, 'completed');
      assert.strictEqual(byId.get('anything-goes')?.status, 'running');

      assert.ok(
        byId
          .get('run-20260105-010206')
          ?.paths.runRoot.endsWith(path.join('.a5c', 'runs', 'run-20260105-010206')),
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('skips directories missing state.json, uses unknown for invalid state.json', () => {
    const tempDir = makeTempDir('babysitter-runDiscovery-');
    try {
      const runsRoot = path.join(tempDir, 'runs');
      fs.mkdirSync(runsRoot, { recursive: true });

      const runMissingState = path.join(runsRoot, 'run-20260105-010206');
      fs.mkdirSync(runMissingState, { recursive: true });

      const runInvalidState = path.join(runsRoot, 'run-20260105-010207');
      fs.mkdirSync(runInvalidState, { recursive: true });
      fs.writeFileSync(path.join(runInvalidState, 'state.json'), '{not-json', 'utf8');

      const runs = discoverRuns(runsRoot);
      assert.strictEqual(runs.length, 1);
      assert.strictEqual(runs[0]?.id, 'run-20260105-010207');
      assert.strictEqual(runs[0]?.status, 'unknown');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('returns runs sorted by id descending (newest first)', () => {
    const tempDir = makeTempDir('babysitter-runDiscovery-');
    try {
      const runsRoot = path.join(tempDir, 'runs');
      fs.mkdirSync(runsRoot, { recursive: true });

      const older = path.join(runsRoot, 'run-20260104-235959');
      const newer = path.join(runsRoot, 'run-20260105-000001');
      fs.mkdirSync(older, { recursive: true });
      fs.mkdirSync(newer, { recursive: true });
      writeJson(path.join(older, 'state.json'), {
        runId: 'run-20260104-235959',
        status: 'running',
      });
      writeJson(path.join(newer, 'state.json'), {
        runId: 'run-20260105-000001',
        status: 'running',
      });

      const runs = discoverRuns(runsRoot);
      assert.deepStrictEqual(
        runs.map((r) => r.id),
        ['run-20260105-000001', 'run-20260104-235959'],
      );
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
