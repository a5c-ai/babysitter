import { describe, it, expect } from 'vitest';
import { generateWebviewContent } from '../../panels/webview-content';
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
// Structural Tests (environment-agnostic, no snapshots)
// ---------------------------------------------------------------------------

describe('generateWebviewContent - structure', () => {
  it('generates complete HTML for a completed run', () => {
    const tasks: TaskEffect[] = [
      makeTask({
        effectId: 'e1',
        kind: 'node',
        title: 'Install dependencies',
        status: 'resolved',
        duration: 45000,
        requestedAt: '2026-03-10T10:00:00Z',
        resolvedAt: '2026-03-10T10:00:45Z',
      }),
      makeTask({
        effectId: 'e2',
        kind: 'agent',
        title: 'Run tests',
        status: 'resolved',
        duration: 120000,
        requestedAt: '2026-03-10T10:00:45Z',
        resolvedAt: '2026-03-10T10:02:45Z',
      }),
      makeTask({
        effectId: 'e3',
        kind: 'skill',
        title: 'Deploy to staging',
        status: 'resolved',
        duration: 30000,
        requestedAt: '2026-03-10T10:02:45Z',
        resolvedAt: '2026-03-10T10:03:15Z',
      }),
    ];

    const run = makeRun({
      runId: 'run-completed-001',
      processId: 'deploy-pipeline',
      status: 'completed',
      tasks,
      totalTasks: 3,
      completedTasks: 3,
      failedTasks: 0,
      duration: 195000,
      events: [
        { seq: 1, id: 'ulid-001', ts: '2026-03-10T10:00:00Z', type: 'RUN_CREATED', payload: { processId: 'deploy-pipeline' } },
        { seq: 2, id: 'ulid-002', ts: '2026-03-10T10:00:00Z', type: 'EFFECT_REQUESTED', payload: { effectId: 'e1' } },
        { seq: 3, id: 'ulid-003', ts: '2026-03-10T10:00:45Z', type: 'EFFECT_RESOLVED', payload: { effectId: 'e1' } },
        { seq: 4, id: 'ulid-004', ts: '2026-03-10T10:03:15Z', type: 'RUN_COMPLETED', payload: {} },
      ],
    });

    const html = generateWebviewContent(run, NONCE, CSP);

    // Verify critical structural elements
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Content-Security-Policy');
    expect(html).toContain('class="pipeline-panel"');
    expect(html).toContain('class="task-detail-panel"');
    expect(html).toContain('class="event-stream-panel"');
    expect(html).toContain('deploy-pipeline');
    expect(html).toContain('3/3 tasks');
    expect(html).toContain('Install dependencies');
    expect(html).toContain('Run tests');
    expect(html).toContain('Deploy to staging');
    expect(html).toContain('RUN_CREATED');
    expect(html).toContain('RUN_COMPLETED');
    expect(html).toContain(NONCE);
  });

  it('generates complete HTML for a failed run', () => {
    const tasks: TaskEffect[] = [
      makeTask({ effectId: 'e1', kind: 'node', title: 'Build application', status: 'resolved', duration: 60000 }),
      makeTask({
        effectId: 'e2', kind: 'shell', title: 'Run unit tests', status: 'error',
        duration: 15000, error: 'Test suite failed: 3 tests failed',
        requestedAt: '2026-03-10T10:01:00Z', resolvedAt: '2026-03-10T10:01:15Z',
      }),
    ];

    const run = makeRun({
      runId: 'run-failed-002',
      processId: 'ci-pipeline',
      status: 'failed',
      tasks,
      totalTasks: 2,
      completedTasks: 1,
      failedTasks: 1,
      duration: 75000,
      failureError: 'Test suite failed: 3 tests failed',
      events: [
        { seq: 1, id: 'ulid-101', ts: '2026-03-10T10:00:00Z', type: 'RUN_CREATED', payload: {} },
        { seq: 2, id: 'ulid-102', ts: '2026-03-10T10:01:15Z', type: 'RUN_FAILED', payload: { error: 'Test suite failed: 3 tests failed' } },
      ],
    });

    const html = generateWebviewContent(run, NONCE, CSP);

    expect(html).toContain('status-badge failed');
    expect(html).toContain('FAILED');
    expect(html).toContain('ci-pipeline');
    expect(html).toContain('Run unit tests');
    expect(html).toContain('Test suite failed');
  });

  it('generates complete HTML for a run waiting on breakpoint', () => {
    const tasks: TaskEffect[] = [
      makeTask({ effectId: 'e1', kind: 'node', title: 'Prepare deployment', status: 'resolved', duration: 30000 }),
      makeTask({
        effectId: 'bp-001', kind: 'breakpoint', title: 'Approval required', status: 'requested',
        breakpointQuestion: 'Deploy to production environment? This action cannot be undone.',
        requestedAt: '2026-03-10T10:00:30Z',
      }),
    ];

    const run = makeRun({
      runId: 'run-waiting-003',
      processId: 'production-deploy',
      status: 'waiting',
      waitingKind: 'breakpoint',
      tasks,
      totalTasks: 2,
      completedTasks: 1,
      failedTasks: 0,
      breakpointQuestion: 'Deploy to production environment? This action cannot be undone.',
      breakpointEffectId: 'bp-001',
      events: [
        { seq: 1, id: 'ulid-201', ts: '2026-03-10T10:00:00Z', type: 'RUN_CREATED', payload: {} },
        { seq: 2, id: 'ulid-202', ts: '2026-03-10T10:00:30Z', type: 'EFFECT_REQUESTED', payload: { effectId: 'bp-001', kind: 'breakpoint' } },
      ],
    });

    const html = generateWebviewContent(run, NONCE, CSP);

    expect(html).toContain('id="breakpoint-banner"');
    expect(html).toContain('Deploy to production environment?');
    expect(html).toContain('bp-001');
    expect(html).toContain('Approval required');
  });

  it('generates complete HTML for an empty/new run', () => {
    const run = makeRun({
      runId: 'run-empty-004',
      processId: 'new-process',
      status: 'pending',
      tasks: [],
      events: [
        { seq: 1, id: 'ulid-301', ts: '2026-03-10T10:00:00Z', type: 'RUN_CREATED', payload: { processId: 'new-process' } },
      ],
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
    });

    const html = generateWebviewContent(run, NONCE, CSP);

    expect(html).toContain('No tasks yet');
    expect(html).toContain('0/0 tasks');
    expect(html).toContain('new-process');
  });

  it('generates HTML with multiple task kinds', () => {
    const tasks: TaskEffect[] = [
      makeTask({ effectId: 'e1', kind: 'node', title: 'Node task', status: 'resolved' }),
      makeTask({ effectId: 'e2', kind: 'agent', title: 'Agent task', status: 'resolved' }),
      makeTask({ effectId: 'e3', kind: 'skill', title: 'Skill task', status: 'requested' }),
      makeTask({ effectId: 'e4', kind: 'shell', title: 'Shell task', status: 'error', error: 'Command failed' }),
      makeTask({ effectId: 'e5', kind: 'sleep', title: 'Sleep task', status: 'resolved' }),
    ];

    const run = makeRun({
      runId: 'run-mixed-005',
      processId: 'complex-workflow',
      status: 'pending',
      tasks,
      totalTasks: 5,
      completedTasks: 3,
      failedTasks: 1,
      events: [],
    });

    const html = generateWebviewContent(run, NONCE, CSP);

    expect(html).toContain('Node task');
    expect(html).toContain('Agent task');
    expect(html).toContain('Skill task');
    expect(html).toContain('Shell task');
    expect(html).toContain('Sleep task');
    expect(html).toContain('3/5 tasks');
  });

  it('generates HTML with special characters escaped', () => {
    const run = makeRun({
      runId: 'run-xss-006',
      processId: '<script>alert("xss")</script>',
      status: 'pending',
      tasks: [
        makeTask({ effectId: 'e1', title: 'Task with <tags> & "quotes"', status: 'resolved' }),
      ],
      events: [],
      totalTasks: 1,
      completedTasks: 1,
      failedTasks: 0,
      prompt: 'Prompt with <script>dangerous</script> content',
    });

    const html = generateWebviewContent(run, NONCE, CSP);

    // Verify escaping
    expect(html).not.toContain('<script>alert("xss")</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
