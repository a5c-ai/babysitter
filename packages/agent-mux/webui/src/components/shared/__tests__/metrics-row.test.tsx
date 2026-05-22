import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { MetricsRow } from '../metrics-row';
import { createMockRun, createMockTaskEffect } from '@/test/fixtures';

describe('MetricsRow', () => {
  it('renders without crashing', () => {
    const run = createMockRun();
    render(<MetricsRow run={run} />);
    expect(screen.getByText('Total Duration')).toBeInTheDocument();
  });

  it('displays task count as completed/total', () => {
    const run = createMockRun({ completedTasks: 5, totalTasks: 10 });
    render(<MetricsRow run={run} />);
    expect(screen.getByText('5/10')).toBeInTheDocument();
  });

  it('displays the "Tasks" label', () => {
    const run = createMockRun();
    render(<MetricsRow run={run} />);
    expect(screen.getByText('Tasks')).toBeInTheDocument();
  });

  it('displays the success rate percentage', () => {
    const run = createMockRun({ completedTasks: 3, totalTasks: 4 });
    render(<MetricsRow run={run} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('displays 0% success rate when there are no tasks', () => {
    const run = createMockRun({ completedTasks: 0, totalTasks: 0, tasks: [] });
    render(<MetricsRow run={run} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('displays 100% success rate when all tasks complete', () => {
    const run = createMockRun({ completedTasks: 5, totalTasks: 5 });
    render(<MetricsRow run={run} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('displays the "Success Rate" label', () => {
    const run = createMockRun();
    render(<MetricsRow run={run} />);
    expect(screen.getByText('Success Rate')).toBeInTheDocument();
  });

  it('displays the iterations count', () => {
    const run = createMockRun();
    render(<MetricsRow run={run} />);
    expect(screen.getByText('Iterations')).toBeInTheDocument();
  });

  it('counts unique invocationKeys for iterations', () => {
    const tasks = [
      createMockTaskEffect({ invocationKey: 'inv-1' }),
      createMockTaskEffect({ invocationKey: 'inv-1' }),
      createMockTaskEffect({ invocationKey: 'inv-2' }),
    ];
    const run = createMockRun({ tasks });
    render(<MetricsRow run={run} />);
    // 2 unique invocationKeys
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('displays formatted duration for completed run', () => {
    const run = createMockRun({ status: 'completed', duration: 65000 });
    render(<MetricsRow run={run} />);
    // 65000ms = 1m 5s
    expect(screen.getByText('1m 5s')).toBeInTheDocument();
  });
});
