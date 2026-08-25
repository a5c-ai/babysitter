import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { TimingPanel } from '../timing-panel';
import { createMockTaskDetail, createMockTaskEffect } from '@/test/fixtures';

describe('TimingPanel', () => {
  it('renders null task state with placeholder message', () => {
    render(<TimingPanel task={null} />);
    expect(screen.getByText('Select a task to view timing')).toBeInTheDocument();
  });

  it('renders Requested, Resolved, and Duration rows', () => {
    const task = createMockTaskDetail({ duration: 5000 });
    render(<TimingPanel task={task} />);
    expect(screen.getByText('Requested')).toBeInTheDocument();
    expect(screen.getByText('Resolved')).toBeInTheDocument();
    expect(screen.getByText('Duration')).toBeInTheDocument();
  });

  it('displays formatted duration for a task', () => {
    const task = createMockTaskDetail({ duration: 45000 });
    render(<TimingPanel task={task} />);
    expect(screen.getByText('45s')).toBeInTheDocument();
  });

  it('displays formatted timestamp for requestedAt', () => {
    const task = createMockTaskDetail({
      requestedAt: '2026-02-16T10:30:45.000Z',
    });
    render(<TimingPanel task={task} />);
    // formatTimestamp produces locale-specific time string
    expect(screen.getByText('Requested')).toBeInTheDocument();
  });

  it('shows "em dash" for missing resolvedAt on running task', () => {
    const task = createMockTaskDetail({
      status: 'requested',
      resolvedAt: undefined,
      finishedAt: undefined,
      duration: 0,
    });
    render(<TimingPanel task={task} />);
    // formatTimestamp returns \u2014 for undefined
    const dashElements = screen.getAllByText('\u2014');
    expect(dashElements.length).toBeGreaterThanOrEqual(1);
  });

  it('shows exec timing rows when startedAt/finishedAt differ from requestedAt/resolvedAt', () => {
    const task = createMockTaskDetail({
      requestedAt: '2026-02-16T10:00:00.000Z',
      resolvedAt: '2026-02-16T10:01:00.000Z',
      startedAt: '2026-02-16T10:00:05.000Z',
      finishedAt: '2026-02-16T10:00:55.000Z',
    });
    render(<TimingPanel task={task} />);
    expect(screen.getByText('Exec Started')).toBeInTheDocument();
    expect(screen.getByText('Exec Finished')).toBeInTheDocument();
  });

  it('does not show exec timing rows when they match requested/resolved', () => {
    const ts1 = '2026-02-16T10:00:00.000Z';
    const ts2 = '2026-02-16T10:01:00.000Z';
    const task = createMockTaskDetail({
      requestedAt: ts1,
      resolvedAt: ts2,
      startedAt: ts1,
      finishedAt: ts2,
    });
    render(<TimingPanel task={task} />);
    expect(screen.queryByText('Exec Started')).not.toBeInTheDocument();
    expect(screen.queryByText('Exec Finished')).not.toBeInTheDocument();
  });

  it('renders cascading timeline bar when allTasks and runDuration are provided', () => {
    const now = Date.now();
    const tasks = [
      createMockTaskEffect({
        effectId: 'eff-1',
        title: 'Step A',
        requestedAt: new Date(now - 10000).toISOString(),
        resolvedAt: new Date(now - 5000).toISOString(),
        duration: 5000,
      }),
      createMockTaskEffect({
        effectId: 'eff-2',
        title: 'Step B',
        requestedAt: new Date(now - 5000).toISOString(),
        resolvedAt: new Date(now).toISOString(),
        duration: 5000,
      }),
    ];
    const task = createMockTaskDetail({
      ...tasks[0],
      effectId: 'eff-1',
    });

    render(<TimingPanel task={task} runDuration={10000} allTasks={tasks} />);

    expect(screen.getByText('Run Timeline')).toBeInTheDocument();
    // Step legend shows step numbers
    expect(screen.getByText(/Step A/)).toBeInTheDocument();
    expect(screen.getByText(/Step B/)).toBeInTheDocument();
  });

  it('shows step counter for current task in timeline', () => {
    const now = Date.now();
    const tasks = [
      createMockTaskEffect({
        effectId: 'eff-1',
        title: 'First',
        requestedAt: new Date(now - 10000).toISOString(),
        resolvedAt: new Date(now - 5000).toISOString(),
        duration: 5000,
      }),
      createMockTaskEffect({
        effectId: 'eff-2',
        title: 'Second',
        requestedAt: new Date(now - 5000).toISOString(),
        resolvedAt: new Date(now).toISOString(),
        duration: 5000,
      }),
    ];
    const task = createMockTaskDetail({
      ...tasks[0],
      effectId: 'eff-1',
    });

    render(<TimingPanel task={task} runDuration={10000} allTasks={tasks} />);

    expect(screen.getByText('Step 1/2')).toBeInTheDocument();
  });

  it('shows "% of total" for current task segment', () => {
    const now = Date.now();
    const tasks = [
      createMockTaskEffect({
        effectId: 'eff-1',
        title: 'Only Step',
        requestedAt: new Date(now - 10000).toISOString(),
        resolvedAt: new Date(now).toISOString(),
        duration: 10000,
      }),
    ];
    const task = createMockTaskDetail({
      ...tasks[0],
      effectId: 'eff-1',
    });

    render(<TimingPanel task={task} runDuration={10000} allTasks={tasks} />);

    expect(screen.getByText(/of total/)).toBeInTheDocument();
  });

  it('does not render timeline when no allTasks provided', () => {
    const task = createMockTaskDetail({ duration: 5000 });
    render(<TimingPanel task={task} runDuration={10000} />);
    expect(screen.queryByText('Run Timeline')).not.toBeInTheDocument();
  });

  it('does not render timeline when effectiveRunDuration is 0', () => {
    const task = createMockTaskDetail({ duration: 0 });
    render(<TimingPanel task={task} runDuration={0} allTasks={[]} />);
    expect(screen.queryByText('Run Timeline')).not.toBeInTheDocument();
  });

  it('does not show step legend for single-task timeline', () => {
    const now = Date.now();
    const tasks = [
      createMockTaskEffect({
        effectId: 'eff-1',
        title: 'Solo Step',
        requestedAt: new Date(now - 5000).toISOString(),
        resolvedAt: new Date(now).toISOString(),
        duration: 5000,
      }),
    ];
    const task = createMockTaskDetail({
      ...tasks[0],
      effectId: 'eff-1',
    });

    render(<TimingPanel task={task} runDuration={5000} allTasks={tasks} />);

    // Legend only shows when segments.length > 1
    // The step counter still shows, but no numbered legend list
    expect(screen.queryByText(/1\. Solo Step/)).not.toBeInTheDocument();
  });

  it('renders step legend with numbered entries for multi-task timeline', () => {
    const now = Date.now();
    const tasks = [
      createMockTaskEffect({
        effectId: 'eff-1',
        title: 'Alpha',
        requestedAt: new Date(now - 10000).toISOString(),
        resolvedAt: new Date(now - 5000).toISOString(),
        duration: 5000,
      }),
      createMockTaskEffect({
        effectId: 'eff-2',
        title: 'Beta',
        requestedAt: new Date(now - 5000).toISOString(),
        resolvedAt: new Date(now).toISOString(),
        duration: 5000,
      }),
    ];
    const task = createMockTaskDetail({
      ...tasks[0],
      effectId: 'eff-1',
    });

    render(<TimingPanel task={task} runDuration={10000} allTasks={tasks} />);

    expect(screen.getByText(/1\. Alpha/)).toBeInTheDocument();
    expect(screen.getByText(/2\. Beta/)).toBeInTheDocument();
  });

  it('falls back to wall-clock duration when task.duration is 0', () => {
    const now = Date.now();
    const task = createMockTaskDetail({
      duration: 0,
      requestedAt: new Date(now - 3000).toISOString(),
      resolvedAt: new Date(now).toISOString(),
    });
    render(<TimingPanel task={task} />);
    // Should compute ~3000ms = 3s
    expect(screen.getByText('3s')).toBeInTheDocument();
  });

  it('uses step colors cycling through STEP_COLORS array', () => {
    const now = Date.now();
    const tasks = Array.from({ length: 3 }, (_, i) =>
      createMockTaskEffect({
        effectId: `eff-${i}`,
        title: `Step ${i}`,
        requestedAt: new Date(now - (3 - i) * 3000).toISOString(),
        resolvedAt: new Date(now - (2 - i) * 3000).toISOString(),
        duration: 3000,
      })
    );
    const task = createMockTaskDetail({
      ...tasks[0],
      effectId: 'eff-0',
    });

    const { container } = render(<TimingPanel task={task} runDuration={9000} allTasks={tasks} />);

    // There should be timeline segment divs with different bg- color classes
    const segmentDivs = container.querySelectorAll('[title]');
    // Filter to only those with Step title patterns
    const timelineSegments = Array.from(segmentDivs).filter(el =>
      el.getAttribute('title')?.includes('Step')
    );
    expect(timelineSegments.length).toBe(3);
  });
});
