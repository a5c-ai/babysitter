import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { ParallelGroup } from '../parallel-group';

describe('ParallelGroup', () => {
  it('renders without crashing', () => {
    render(
      <ParallelGroup count={3}>
        <div>child</div>
      </ParallelGroup>,
    );
    expect(screen.getByText('parallel')).toBeInTheDocument();
  });

  it('displays the count label with correct task count', () => {
    render(
      <ParallelGroup count={5}>
        <div>child</div>
      </ParallelGroup>,
    );
    // The label renders as "· 5 tasks" via &middot; entity
    expect(screen.getByText(/5 tasks/)).toBeInTheDocument();
  });

  it('renders children inside the group', () => {
    render(
      <ParallelGroup count={2}>
        <div data-testid="child-a">Alpha</div>
        <div data-testid="child-b">Beta</div>
      </ParallelGroup>,
    );
    expect(screen.getByTestId('child-a')).toBeInTheDocument();
    expect(screen.getByTestId('child-b')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders the GitBranch icon', () => {
    const { container } = render(
      <ParallelGroup count={2}>
        <div>child</div>
      </ParallelGroup>,
    );
    const icon = container.querySelector('[data-lucide="GitBranch"]');
    expect(icon).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ParallelGroup count={1} className="my-custom-class">
        <div>child</div>
      </ParallelGroup>,
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('my-custom-class');
  });

  it('always shows "parallel" label in uppercase styling container', () => {
    render(
      <ParallelGroup count={4}>
        <div>child</div>
      </ParallelGroup>,
    );
    const label = screen.getByText('parallel');
    expect(label).toBeInTheDocument();
  });

  it('renders with count of 1', () => {
    render(
      <ParallelGroup count={1}>
        <div>single child</div>
      </ParallelGroup>,
    );
    expect(screen.getByText(/1 tasks/)).toBeInTheDocument();
    expect(screen.getByText('single child')).toBeInTheDocument();
  });

  it('renders dashed border container with expected structure', () => {
    const { container } = render(
      <ParallelGroup count={3}>
        <div>child</div>
      </ParallelGroup>,
    );
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain('border-dashed');
  });
});
