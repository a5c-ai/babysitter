import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { KindBadge } from '../kind-badge';

describe('KindBadge', () => {
  it('renders without crashing', () => {
    render(<KindBadge kind="node" />);
    expect(screen.getByText('node')).toBeInTheDocument();
  });

  it('renders "agent" kind with correct text', () => {
    render(<KindBadge kind="agent" />);
    expect(screen.getByText('agent')).toBeInTheDocument();
  });

  it('renders "node" kind with correct text', () => {
    render(<KindBadge kind="node" />);
    expect(screen.getByText('node')).toBeInTheDocument();
  });

  it('renders "shell" kind with correct text', () => {
    render(<KindBadge kind="shell" />);
    expect(screen.getByText('shell')).toBeInTheDocument();
  });

  it('renders "skill" kind with correct text', () => {
    render(<KindBadge kind="skill" />);
    expect(screen.getByText('skill')).toBeInTheDocument();
  });

  it('renders "breakpoint" kind with "approval" display text', () => {
    render(<KindBadge kind="breakpoint" />);
    expect(screen.getByText('approval')).toBeInTheDocument();
  });

  it('renders "sleep" kind with correct text', () => {
    render(<KindBadge kind="sleep" />);
    expect(screen.getByText('sleep')).toBeInTheDocument();
  });

  it('renders an SVG icon alongside the kind text', () => {
    const { container } = render(<KindBadge kind="agent" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('applies agent color class for agent kind', () => {
    const { container } = render(<KindBadge kind="agent" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('text-primary');
  });

  it('applies warning color class for node kind', () => {
    const { container } = render(<KindBadge kind="node" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('text-warning');
  });

  it('applies info color class for skill kind', () => {
    const { container } = render(<KindBadge kind="skill" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('text-info');
  });

  it('applies custom className', () => {
    const { container } = render(<KindBadge kind="agent" className="extra-cls" />);
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('extra-cls');
  });
});
