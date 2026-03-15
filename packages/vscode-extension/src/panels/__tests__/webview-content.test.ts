import { describe, it, expect } from 'vitest';
import { generateWebviewContent } from '../webview-content';
import { Run, TaskEffect } from '../../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(overrides: Partial<TaskEffect> = {}): TaskEffect {
  return {
    effectId: 'eff-001',
    kind: 'node',
    title: 'Build project',
    status: 'resolved',
    requestedAt: '2026-03-10T10:00:00Z',
    resolvedAt: '2026-03-10T10:01:00Z',
    duration: 60000,
    ...overrides,
  };
}

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

const NONCE = 'test-nonce-abc123';
const CSP = 'mock-csp-source';

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generateWebviewContent', () => {
  it('returns a valid HTML string', () => {
    const html = generateWebviewContent(makeRun(), NONCE, CSP);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
  });

  it('contains Content-Security-Policy meta tag', () => {
    const html = generateWebviewContent(makeRun(), NONCE, CSP);
    expect(html).toContain('Content-Security-Policy');
    expect(html).toContain(CSP);
  });

  it('contains the nonce in style and script tags', () => {
    const html = generateWebviewContent(makeRun(), NONCE, CSP);
    expect(html).toContain(`nonce="${NONCE}"`);
  });

  it('contains the run processId', () => {
    const html = generateWebviewContent(makeRun({ processId: 'deploy-service' }), NONCE, CSP);
    expect(html).toContain('deploy-service');
  });

  it('contains the runId (truncated)', () => {
    const html = generateWebviewContent(makeRun({ runId: 'abcdefghijklmnopqrst' }), NONCE, CSP);
    expect(html).toContain('abcdefghijkl');
  });

  it('contains progress bar with correct percentage', () => {
    const run = makeRun({ totalTasks: 10, completedTasks: 7 });
    const html = generateWebviewContent(run, NONCE, CSP);
    // 70%
    expect(html).toContain('width: 70%');
    expect(html).toContain('7/10 tasks');
  });

  it('contains pipeline section with task cards', () => {
    const tasks = [
      makeTask({ effectId: 'e1', title: 'Task Alpha' }),
      makeTask({ effectId: 'e2', title: 'Task Beta', status: 'requested' }),
    ];
    const run = makeRun({ tasks, totalTasks: 2 });
    const html = generateWebviewContent(run, NONCE, CSP);
    expect(html).toContain('Task Alpha');
    expect(html).toContain('Task Beta');
    expect(html).toContain('step-card');
  });

  it('contains event stream section', () => {
    const run = makeRun({
      events: [
        { seq: 1, id: 'ulid1', ts: '2026-03-10T10:00:00Z', type: 'RUN_CREATED', payload: {} },
      ],
    });
    const html = generateWebviewContent(run, NONCE, CSP);
    expect(html).toContain('Events (1)');
    expect(html).toContain('RUN_CREATED');
  });

  it('breakpoint banner appears when run has breakpointQuestion', () => {
    const run = makeRun({
      breakpointQuestion: 'Ready to deploy?',
      breakpointEffectId: 'bp-eff-001',
    });
    const html = generateWebviewContent(run, NONCE, CSP);
    expect(html).toContain('breakpoint-banner');
    expect(html).toContain('Ready to deploy?');
    expect(html).toContain('bp-eff-001');
  });

  it('breakpoint banner is absent when no breakpoint', () => {
    const run = makeRun({ breakpointQuestion: undefined, breakpointEffectId: undefined });
    const html = generateWebviewContent(run, NONCE, CSP);
    // The CSS class appears in styles, but the actual banner element should not be present
    expect(html).not.toContain('id="breakpoint-banner"');
  });

  it('escapes special characters in run data', () => {
    const run = makeRun({ processId: '<script>alert("xss")</script>' });
    const html = generateWebviewContent(run, NONCE, CSP);
    expect(html).not.toContain('<script>alert("xss")</script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('renders with completed status badge', () => {
    const run = makeRun({ status: 'completed' });
    const html = generateWebviewContent(run, NONCE, CSP);
    expect(html).toContain('status-badge completed');
    expect(html).toContain('COMPLETED');
  });

  it('renders with failed status badge', () => {
    const run = makeRun({ status: 'failed' });
    const html = generateWebviewContent(run, NONCE, CSP);
    expect(html).toContain('status-badge failed');
    expect(html).toContain('FAILED');
  });

  it('renders 0% progress when no tasks', () => {
    const run = makeRun({ totalTasks: 0, completedTasks: 0 });
    const html = generateWebviewContent(run, NONCE, CSP);
    expect(html).toContain('width: 0%');
    expect(html).toContain('0/0 tasks');
  });

  it('shows "No tasks yet" when task list is empty', () => {
    const run = makeRun({ tasks: [] });
    const html = generateWebviewContent(run, NONCE, CSP);
    expect(html).toContain('No tasks yet');
  });
});
