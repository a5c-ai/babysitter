import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { buildResumeDashboard, formatDashboardText, type ResumeDashboardData } from '../resumeDashboard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let tempDir: string;

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), 'resume-dash-'));
});

afterEach(() => {
  rmSync(tempDir, { recursive: true, force: true });
});

function writeMetadata(runId: string, createdAt: string): void {
  writeFileSync(
    join(tempDir, 'metadata.json'),
    JSON.stringify({ runId, createdAt }),
  );
}

function writeJournal(events: Array<{ type: string; recordedAt: string; data: Record<string, unknown> }>): void {
  const lines = events.map((e) => JSON.stringify(e)).join('\n');
  writeFileSync(join(tempDir, 'journal.jsonl'), lines);
}

// ---------------------------------------------------------------------------
// buildResumeDashboard
// ---------------------------------------------------------------------------

describe('buildResumeDashboard', () => {
  it('returns data for a run with no journal', async () => {
    writeMetadata('run-1', '2026-01-01T00:00:00Z');
    const data = await buildResumeDashboard(tempDir);
    expect(data.runId).toBe('run-1');
    expect(data.status).toBe('running');
    expect(data.completedSteps).toHaveLength(0);
    expect(data.pendingSteps).toHaveLength(0);
    expect(data.failedSteps).toHaveLength(0);
  });

  it('classifies completed effects', async () => {
    writeMetadata('run-2', '2026-01-01T00:00:00Z');
    writeJournal([
      { type: 'EFFECT_REQUESTED', recordedAt: '2026-01-01T00:00:01Z', data: { effectId: 'e1', title: 'Step 1' } },
      { type: 'EFFECT_RESOLVED', recordedAt: '2026-01-01T00:00:02Z', data: { effectId: 'e1' } },
    ]);

    const data = await buildResumeDashboard(tempDir);
    expect(data.completedSteps).toHaveLength(1);
    expect(data.completedSteps[0].title).toBe('Step 1');
  });

  it('classifies pending effects', async () => {
    writeMetadata('run-3', '2026-01-01T00:00:00Z');
    writeJournal([
      { type: 'EFFECT_REQUESTED', recordedAt: '2026-01-01T00:00:01Z', data: { effectId: 'e1', title: 'Step 1' } },
    ]);

    const data = await buildResumeDashboard(tempDir);
    expect(data.pendingSteps).toHaveLength(1);
    expect(data.status).toBe('paused');
  });

  it('classifies failed effects', async () => {
    writeMetadata('run-4', '2026-01-01T00:00:00Z');
    writeJournal([
      { type: 'EFFECT_REQUESTED', recordedAt: '2026-01-01T00:00:01Z', data: { effectId: 'e1', title: 'Step 1' } },
      { type: 'EFFECT_FAILED', recordedAt: '2026-01-01T00:00:02Z', data: { effectId: 'e1' } },
    ]);

    const data = await buildResumeDashboard(tempDir);
    expect(data.failedSteps).toHaveLength(1);
    expect(data.status).toBe('failed');
  });

  it('marks run as completed when RUN_COMPLETED present', async () => {
    writeMetadata('run-5', '2026-01-01T00:00:00Z');
    writeJournal([
      { type: 'EFFECT_REQUESTED', recordedAt: '2026-01-01T00:00:01Z', data: { effectId: 'e1', title: 'Step 1' } },
      { type: 'EFFECT_RESOLVED', recordedAt: '2026-01-01T00:00:02Z', data: { effectId: 'e1' } },
      { type: 'RUN_COMPLETED', recordedAt: '2026-01-01T00:00:03Z', data: {} },
    ]);

    const data = await buildResumeDashboard(tempDir);
    expect(data.status).toBe('completed');
  });

  it('computes totalDuration from metadata to last event', async () => {
    writeMetadata('run-6', '2026-01-01T00:00:00Z');
    writeJournal([
      { type: 'EFFECT_REQUESTED', recordedAt: '2026-01-01T00:01:00Z', data: { effectId: 'e1' } },
    ]);

    const data = await buildResumeDashboard(tempDir);
    expect(data.totalDuration).toBe(60_000);
  });
});

// ---------------------------------------------------------------------------
// formatDashboardText
// ---------------------------------------------------------------------------

describe('formatDashboardText', () => {
  it('renders a text dashboard', () => {
    const data: ResumeDashboardData = {
      runId: 'test-run',
      status: 'paused',
      completedSteps: [{ id: 'e1', title: 'Build', status: 'completed' }],
      pendingSteps: [{ id: 'e2', title: 'Deploy', status: 'pending' }],
      failedSteps: [],
      totalDuration: 125_000,
      lastActivity: '2026-01-01T00:02:05Z',
    };

    const text = formatDashboardText(data);
    expect(text).toContain('test-run');
    expect(text).toContain('PAUSED');
    expect(text).toContain('[done] Build');
    expect(text).toContain('[ .. ] Deploy');
    expect(text).toContain('Failed (0)');
    expect(text).toContain('2m 5s');
  });

  it('renders empty state', () => {
    const data: ResumeDashboardData = {
      runId: 'empty-run',
      status: 'running',
      completedSteps: [],
      pendingSteps: [],
      failedSteps: [],
      totalDuration: 0,
      lastActivity: '2026-01-01T00:00:00Z',
    };

    const text = formatDashboardText(data);
    expect(text).toContain('empty-run');
    expect(text).toContain('(none)');
  });
});
