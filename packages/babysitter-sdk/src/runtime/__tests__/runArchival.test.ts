import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { archiveRun, restoreRun, listArchives } from '../runArchival';

describe('runArchival', () => {
  let tmpDir: string;
  let runDir: string;
  let archiveDir: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'runArchival-'));
    runDir = path.join(tmpDir, 'run-test-001');
    archiveDir = path.join(tmpDir, 'archives');

    // Create a mock run directory
    await fs.mkdir(runDir, { recursive: true });
    await fs.mkdir(path.join(runDir, 'journal'), { recursive: true });
    await fs.writeFile(
      path.join(runDir, 'run.json'),
      JSON.stringify({ runId: 'run-test-001', request: 'test', processId: 'p1' }),
    );
    await fs.writeFile(
      path.join(runDir, 'journal', '001.json'),
      JSON.stringify({ seq: 1, type: 'RUN_CREATED' }),
    );
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  // -------------------------------------------------------------------------
  // archiveRun
  // -------------------------------------------------------------------------

  describe('archiveRun', () => {
    it('creates archive and manifest', async () => {
      const manifest = await archiveRun(runDir, archiveDir);
      expect(manifest.runId).toBe('run-test-001');
      expect(manifest.compressedSize).toBeGreaterThan(0);
      expect(manifest.archivePath).toContain('run-test-001.archive.json.gz');

      // Verify files exist
      const archiveExists = await fs.stat(manifest.archivePath).then(() => true).catch(() => false);
      expect(archiveExists).toBe(true);

      const manifestPath = path.join(archiveDir, 'run-test-001.manifest.json');
      const manifestExists = await fs.stat(manifestPath).then(() => true).catch(() => false);
      expect(manifestExists).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // restoreRun
  // -------------------------------------------------------------------------

  describe('restoreRun', () => {
    it('restores archived run to target directory', async () => {
      const manifest = await archiveRun(runDir, archiveDir);
      const restoreDir = path.join(tmpDir, 'restored');

      await restoreRun(manifest.archivePath, restoreDir);

      const runJson = JSON.parse(await fs.readFile(path.join(restoreDir, 'run.json'), 'utf8'));
      expect(runJson.runId).toBe('run-test-001');

      const journalEntry = JSON.parse(
        await fs.readFile(path.join(restoreDir, 'journal', '001.json'), 'utf8'),
      );
      expect(journalEntry.type).toBe('RUN_CREATED');
    });
  });

  // -------------------------------------------------------------------------
  // listArchives
  // -------------------------------------------------------------------------

  describe('listArchives', () => {
    it('returns manifests for all archives', async () => {
      await archiveRun(runDir, archiveDir);
      const archives = await listArchives(archiveDir);
      expect(archives).toHaveLength(1);
      expect(archives[0].runId).toBe('run-test-001');
    });

    it('returns empty array for nonexistent directory', async () => {
      const archives = await listArchives(path.join(tmpDir, 'nope'));
      expect(archives).toHaveLength(0);
    });
  });
});
