import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..', '..', '..', '..', '..');
const scriptPath = resolve(repoRoot, 'scripts', 'live-stack-coverage-report.cjs');

describe('scripts/live-stack-coverage-report.cjs', () => {
  it('fails non-passing scenarios when live evidence is required', () => {
    const { result, cleanup } = runCoverageReport({
      execution: {
        status: 'failed',
        failure: 'agent output did not produce required evidence',
        evidence: {
          artifacts: {},
        },
      },
    });

    try {
      expect(result.status).toBe(1);
      expect(JSON.parse(result.stdout)).toMatchObject({
        status: 'failed',
        missingArtifacts: [
          'adapters-events',
          'transport-adapter-trace',
          'provider-trace-redacted',
        ],
      });
      expect(result.stderr).toContain('live scenario did not pass: agent output did not produce required evidence');
    } finally {
      cleanup();
    }
  });

  it('still fails passed scenarios that are missing required artifacts', () => {
    const { result, cleanup } = runCoverageReport({
      execution: {
        status: 'passed',
        missingTraceIds: [],
        evidence: {
          artifacts: {},
        },
      },
    });

    try {
      expect(result.status).toBe(1);
      expect(result.stderr).toContain('missing live evidence artifacts');
    } finally {
      cleanup();
    }
  });
});

function runCoverageReport({
  execution,
}: {
  execution: Record<string, unknown>;
}) {
  const tempDir = mkdtempSync(join(tmpdir(), 'live-stack-coverage-report-'));
  const artifactsDir = join(tempDir, 'artifacts');
  const scenarioId = 'live.adapters.test.provider.model';
  const scenarioPath = join(artifactsDir, `${scenarioId}.json`);

  mkdirSync(artifactsDir, { recursive: true });
  writeFileSync(scenarioPath, JSON.stringify(execution, null, 2), 'utf8');

  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      LIVE_STACK_SCENARIO_ID: scenarioId,
      LIVE_STACK_INSTALL_MODE: 'vanilla',
      LIVE_STACK_ARTIFACTS_DIR: artifactsDir,
      LIVE_STACK_EXPECTED_ARTIFACTS: 'adapters-events,transport-adapter-trace,provider-trace-redacted',
      LIVE_STACK_REQUIRE_EVIDENCE: '1',
    },
  });

  return {
    result,
    cleanup: () => rmSync(tempDir, { recursive: true, force: true }),
  };
}
