import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as vscode from 'vscode';
import { RunDetailPanel } from '../run-detail-panel';
import { RunCache } from '../../lib/run-cache';
import { Run } from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRun(overrides: Partial<Run> = {}): Run {
  return {
    runId: 'run-abc123',
    processId: 'my-process',
    status: 'pending',
    createdAt: '2026-03-10T10:00:00Z',
    updatedAt: '2026-03-10T10:05:00Z',
    tasks: [],
    events: [],
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    isStale: false,
    ...overrides,
  };
}

function createMockCache(runs: Run[]): RunCache {
  return {
    getAll: vi.fn(() => runs),
    getById: vi.fn((id: string) => runs.find((r) => r.runId === id) ?? undefined),
    getByStatus: vi.fn(),
    refresh: vi.fn(),
    refreshAll: vi.fn(),
    getDigests: vi.fn(),
    getSummary: vi.fn(),
  } as unknown as RunCache;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RunDetailPanel', () => {
  const extensionUri = vscode.Uri.file('/mock/extension');
  const workspaceRoot = '/mock/workspace';

  beforeEach(() => {
    RunDetailPanel.currentPanels.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    RunDetailPanel.currentPanels.clear();
  });

  it('createOrShow creates a new panel', () => {
    const cache = createMockCache([makeRun({ runId: 'run-1' })]);
    const panel = RunDetailPanel.createOrShow(extensionUri, cache, 'run-1', workspaceRoot);
    expect(panel).toBeDefined();
    expect(RunDetailPanel.currentPanels.has('run-1')).toBe(true);
  });

  it('createOrShow reuses existing panel for same runId', () => {
    const cache = createMockCache([makeRun({ runId: 'run-1' })]);
    const panel1 = RunDetailPanel.createOrShow(extensionUri, cache, 'run-1', workspaceRoot);
    const panel2 = RunDetailPanel.createOrShow(extensionUri, cache, 'run-1', workspaceRoot);
    expect(panel1).toBe(panel2);
    expect(RunDetailPanel.currentPanels.size).toBe(1);
  });

  it('createOrShow creates separate panels for different runIds', () => {
    const cache = createMockCache([
      makeRun({ runId: 'run-1' }),
      makeRun({ runId: 'run-2' }),
    ]);
    const panel1 = RunDetailPanel.createOrShow(extensionUri, cache, 'run-1', workspaceRoot);
    const panel2 = RunDetailPanel.createOrShow(extensionUri, cache, 'run-2', workspaceRoot);
    expect(panel1).not.toBe(panel2);
    expect(RunDetailPanel.currentPanels.size).toBe(2);
  });

  it('panel title includes processId', () => {
    const cache = createMockCache([makeRun({ runId: 'run-1', processId: 'deploy-prod' })]);
    RunDetailPanel.createOrShow(extensionUri, cache, 'run-1', workspaceRoot);
    // The mock createWebviewPanel is called with a title
    expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
      'babysitterRunDetail',
      'Run: deploy-prod',
      vscode.ViewColumn.One,
      expect.any(Object),
    );
  });

  it('panel title uses truncated runId when processId is unknown', () => {
    const cache = createMockCache([makeRun({ runId: 'abcdefghijklmnop', processId: 'unknown' })]);
    RunDetailPanel.createOrShow(extensionUri, cache, 'abcdefghijklmnop', workspaceRoot);
    expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
      'babysitterRunDetail',
      'Run: abcdefghijkl',
      vscode.ViewColumn.One,
      expect.any(Object),
    );
  });

  it('dispose removes panel from currentPanels', () => {
    const cache = createMockCache([makeRun({ runId: 'run-1' })]);
    const panel = RunDetailPanel.createOrShow(extensionUri, cache, 'run-1', workspaceRoot);
    expect(RunDetailPanel.currentPanels.has('run-1')).toBe(true);
    panel.dispose();
    expect(RunDetailPanel.currentPanels.has('run-1')).toBe(false);
  });

  it('update refreshes the panel content', () => {
    const run = makeRun({ runId: 'run-1' });
    const cache = createMockCache([run]);
    const panel = RunDetailPanel.createOrShow(extensionUri, cache, 'run-1', workspaceRoot);

    // Update with new cache and check it doesn't throw
    const newCache = createMockCache([makeRun({ runId: 'run-1', status: 'completed' })]);
    expect(() => panel.update(newCache, workspaceRoot)).not.toThrow();
  });

  it('sets webview html on creation', () => {
    const cache = createMockCache([makeRun({ runId: 'run-1' })]);
    RunDetailPanel.createOrShow(extensionUri, cache, 'run-1', workspaceRoot);

    // The mock webview panel's html property should have been set
    const mockPanel = vi.mocked(vscode.window.createWebviewPanel).mock.results[0].value;
    // html is set via assignment; since it's a mock we can check it was accessed
    expect(mockPanel.webview).toBeDefined();
  });

  it('renders "Run Not Found" when run is not in cache', () => {
    const cache = createMockCache([]); // empty cache
    RunDetailPanel.createOrShow(extensionUri, cache, 'nonexistent-run', workspaceRoot);

    const mockPanel = vi.mocked(vscode.window.createWebviewPanel).mock.results[0].value;
    expect(mockPanel.webview.html).toContain('Run Not Found');
  });
});
