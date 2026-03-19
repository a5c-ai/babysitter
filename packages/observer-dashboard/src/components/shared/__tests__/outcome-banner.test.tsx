import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { OutcomeBanner } from '../outcome-banner';
import { createMockRun, createMockTaskEffect } from '@/test/fixtures';

describe('OutcomeBanner', () => {
  it('renders nothing for pending status', () => {
    const run = createMockRun({ status: 'pending' });
    const { container } = render(<OutcomeBanner run={run} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing for waiting status', () => {
    const run = createMockRun({ status: 'waiting' });
    const { container } = render(<OutcomeBanner run={run} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders completed banner with duration', () => {
    const run = createMockRun({ status: 'completed', duration: 12000 });
    render(<OutcomeBanner run={run} />);
    expect(screen.getByText(/Completed in/)).toBeInTheDocument();
    expect(screen.getByText(/12s/)).toBeInTheDocument();
  });

  it('renders failed banner with step name from failed task', () => {
    const failedTask = createMockTaskEffect({
      status: 'error',
      label: 'run-ingest',
      error: { name: 'Error', message: 'Connection timeout' },
    });
    const run = createMockRun({ status: 'failed', tasks: [failedTask] });
    render(<OutcomeBanner run={run} />);
    expect(screen.getByText(/Failed at step/)).toBeInTheDocument();
    expect(screen.getByText(/run-ingest/)).toBeInTheDocument();
    expect(screen.getByText(/Connection timeout/)).toBeInTheDocument();
  });

  it('renders failed banner with fallback step name from failedStep', () => {
    const run = createMockRun({ status: 'failed', failedStep: 'step-x', tasks: [] });
    render(<OutcomeBanner run={run} />);
    expect(screen.getByText(/step-x/)).toBeInTheDocument();
  });

  it('renders failed banner with "unknown step" fallback', () => {
    const run = createMockRun({ status: 'failed', tasks: [] });
    render(<OutcomeBanner run={run} />);
    expect(screen.getByText(/unknown step/)).toBeInTheDocument();
  });

  it('renders failed banner with fallback error message', () => {
    const run = createMockRun({ status: 'failed', tasks: [] });
    render(<OutcomeBanner run={run} />);
    expect(screen.getByText(/An error occurred/)).toBeInTheDocument();
  });

  it('renders success icon for completed runs', () => {
    const run = createMockRun({ status: 'completed', duration: 5000 });
    const { container } = render(<OutcomeBanner run={run} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders error icon for failed runs', () => {
    const run = createMockRun({ status: 'failed', tasks: [] });
    const { container } = render(<OutcomeBanner run={run} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
