import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { EmptyState } from '../empty-state';

describe('EmptyState', () => {
  it('renders without crashing', () => {
    render(<EmptyState />);
    expect(screen.getByText('No runs found')).toBeInTheDocument();
  });

  it('renders default title', () => {
    render(<EmptyState />);
    expect(screen.getByText('No runs found')).toBeInTheDocument();
  });

  it('renders default description', () => {
    render(<EmptyState />);
    expect(screen.getByText('Start a babysitter run to see it here.')).toBeInTheDocument();
  });

  it('renders custom title', () => {
    render(<EmptyState title="Nothing here" />);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });

  it('renders custom description', () => {
    render(<EmptyState description="Try adding some data." />);
    expect(screen.getByText('Try adding some data.')).toBeInTheDocument();
  });

  it('renders the Inbox icon', () => {
    const { container } = render(<EmptyState />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<EmptyState className="my-custom" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain('my-custom');
  });

  it('renders custom title and description together', () => {
    render(<EmptyState title="Empty" description="Custom desc" />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
    expect(screen.getByText('Custom desc')).toBeInTheDocument();
  });
});
