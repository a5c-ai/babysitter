import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as vscode from 'vscode';
import { StatusBarController } from '../status-bar';
import { RunCache } from '../lib/run-cache';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Summary = { total: number; active: number; completed: number; failed: number; breakpoints: number };

function createMockCache(summary: Summary): RunCache {
  return {
    getAll: vi.fn(() => []),
    getById: vi.fn(),
    getByStatus: vi.fn(),
    refresh: vi.fn(),
    refreshAll: vi.fn(),
    getDigests: vi.fn(),
    getSummary: vi.fn(() => summary),
  } as unknown as RunCache;
}

function getStatusBarItem(): ReturnType<typeof vscode.window.createStatusBarItem> {
  // The last call to createStatusBarItem returns our mock object
  const calls = vi.mocked(vscode.window.createStatusBarItem).mock.results;
  return calls[calls.length - 1].value as ReturnType<typeof vscode.window.createStatusBarItem>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('StatusBarController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a status bar item on construction', () => {
    const cache = createMockCache({ total: 0, active: 0, completed: 0, failed: 0, breakpoints: 0 });
    new StatusBarController(cache);
    expect(vscode.window.createStatusBarItem).toHaveBeenCalledWith(
      vscode.StatusBarAlignment.Left,
      100,
    );
  });

  it('sets the click command to babysitter-runs.focus', () => {
    const cache = createMockCache({ total: 1, active: 1, completed: 0, failed: 0, breakpoints: 0 });
    new StatusBarController(cache);
    const item = getStatusBarItem();
    expect(item.command).toBe('babysitter-runs.focus');
  });

  it('hides status bar when no runs exist', () => {
    const cache = createMockCache({ total: 0, active: 0, completed: 0, failed: 0, breakpoints: 0 });
    new StatusBarController(cache);
    const item = getStatusBarItem();
    expect(item.hide).toHaveBeenCalled();
  });

  it('shows sync icon and active count with active runs', () => {
    const cache = createMockCache({ total: 3, active: 2, completed: 1, failed: 0, breakpoints: 0 });
    new StatusBarController(cache);
    const item = getStatusBarItem();
    expect(item.text).toContain('$(sync~spin)');
    expect(item.text).toContain('2 active');
  });

  it('shows warning icon and breakpoint count when breakpoints exist', () => {
    const cache = createMockCache({ total: 2, active: 1, completed: 0, failed: 0, breakpoints: 1 });
    new StatusBarController(cache);
    const item = getStatusBarItem();
    expect(item.text).toContain('$(warning)');
    expect(item.text).toContain('1 BP');
    expect(item.backgroundColor).toBeDefined();
  });

  it('shows failed count when there are failed runs', () => {
    const cache = createMockCache({ total: 3, active: 1, completed: 1, failed: 1, breakpoints: 0 });
    new StatusBarController(cache);
    const item = getStatusBarItem();
    expect(item.text).toContain('1 failed');
  });

  it('shows combined info with breakpoints and failures', () => {
    const cache = createMockCache({ total: 5, active: 2, completed: 1, failed: 1, breakpoints: 1 });
    new StatusBarController(cache);
    const item = getStatusBarItem();
    expect(item.text).toContain('2 active');
    expect(item.text).toContain('1 BP');
    expect(item.text).toContain('1 failed');
  });

  it('update method refreshes text from cache summary', () => {
    const cache = createMockCache({ total: 1, active: 1, completed: 0, failed: 0, breakpoints: 0 });
    const controller = new StatusBarController(cache);
    const item = getStatusBarItem();

    // Change the mock summary
    vi.mocked(cache.getSummary).mockReturnValue({ total: 2, active: 2, completed: 0, failed: 0, breakpoints: 0 });
    controller.update();

    expect(item.text).toContain('2 active');
  });

  it('dispose disposes the status bar item', () => {
    const cache = createMockCache({ total: 1, active: 1, completed: 0, failed: 0, breakpoints: 0 });
    const controller = new StatusBarController(cache);
    const item = getStatusBarItem();
    controller.dispose();
    expect(item.dispose).toHaveBeenCalled();
  });

  it('tooltip contains summary information', () => {
    const cache = createMockCache({ total: 5, active: 2, completed: 2, failed: 1, breakpoints: 0 });
    new StatusBarController(cache);
    const item = getStatusBarItem();
    expect(item.tooltip).toContain('5 total');
    expect(item.tooltip).toContain('2 active');
    expect(item.tooltip).toContain('2 done');
    expect(item.tooltip).toContain('1 failed');
  });
});
