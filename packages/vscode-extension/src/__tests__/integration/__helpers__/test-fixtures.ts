import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const FIXTURES_SOURCE = path.resolve(__dirname, '../../../__fixtures__');

/**
 * Create a temporary workspace with .a5c/runs structure containing fixture runs
 *
 * Copies fixtures and renames directories to match the runId values in run.json
 */
export function createTestWorkspace(): { tmpDir: string; runsDir: string; cleanup: () => void } {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'test-workspace-'));
  const runsDir = path.join(tmpDir, '.a5c', 'runs');
  fs.mkdirSync(runsDir, { recursive: true });

  // Map of fixture directory names to their actual runId values
  const fixtureMapping: Record<string, string> = {
    'test-run-completed': 'test-run-001',
    'test-run-failed': 'test-run-002',
    'test-run-waiting': 'test-run-003',
  };

  for (const [dirName, runId] of Object.entries(fixtureMapping)) {
    const srcDir = path.join(FIXTURES_SOURCE, dirName);
    const destDir = path.join(runsDir, runId);

    if (fs.existsSync(srcDir)) {
      copyRecursive(srcDir, destDir);
    }
  }

  const cleanup = () => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  };

  return { tmpDir, runsDir, cleanup };
}

function copyRecursive(src: string, dest: string): void {
  if (!fs.existsSync(src)) {
    return;
  }

  const stat = fs.statSync(src);

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src);
    for (const entry of entries) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}
