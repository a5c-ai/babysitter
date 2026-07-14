import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@/test/test-utils';
import { ProgressBar } from '../progress-bar';

describe('ProgressBar', () => {
  it('renders without crashing', () => {
    const { container } = render(<ProgressBar value={50} />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders 0% width when value is 0', () => {
    const { container } = render(<ProgressBar value={0} />);
    const bar = container.querySelector('[style]') as HTMLElement;
    expect(bar.style.width).toBe('0%');
  });

  it('renders 50% width when value is 50', () => {
    const { container } = render(<ProgressBar value={50} />);
    const bar = container.querySelector('[style]') as HTMLElement;
    expect(bar.style.width).toBe('50%');
  });

  it('renders 100% width when value is 100', () => {
    const { container } = render(<ProgressBar value={100} />);
    const bar = container.querySelector('[style]') as HTMLElement;
    expect(bar.style.width).toBe('100%');
  });

  it('clamps value above 100 to 100%', () => {
    const { container } = render(<ProgressBar value={150} />);
    const bar = container.querySelector('[style]') as HTMLElement;
    expect(bar.style.width).toBe('100%');
  });

  it('clamps negative value to 0%', () => {
    const { container } = render(<ProgressBar value={-10} />);
    const bar = container.querySelector('[style]') as HTMLElement;
    expect(bar.style.width).toBe('0%');
  });

  it('applies rounded-full class when complete (100%)', () => {
    const { container } = render(<ProgressBar value={100} />);
    const bar = container.querySelector('[style]') as HTMLElement;
    expect(bar.className).toContain('rounded-full');
  });

  it('applies rounded-l-full class when not complete', () => {
    const { container } = render(<ProgressBar value={50} />);
    const bar = container.querySelector('[style]') as HTMLElement;
    expect(bar.className).toContain('rounded-l-full');
  });

  it('applies success variant styling', () => {
    const { container } = render(<ProgressBar value={50} variant="success" />);
    const bar = container.querySelector('[style]') as HTMLElement;
    expect(bar.className).toContain('bg-success');
  });

  it('applies error variant styling', () => {
    const { container } = render(<ProgressBar value={50} variant="error" />);
    const bar = container.querySelector('[style]') as HTMLElement;
    expect(bar.className).toContain('bg-error');
  });

  it('applies warning variant styling', () => {
    const { container } = render(<ProgressBar value={50} variant="warning" />);
    const bar = container.querySelector('[style]') as HTMLElement;
    expect(bar.className).toContain('bg-warning');
  });

  it('applies glow classes when glow is true', () => {
    const { container } = render(<ProgressBar value={50} glow />);
    const bar = container.querySelector('[style]') as HTMLElement;
    expect(bar.className).toContain('shadow-progress-glow-primary');
  });

  it('does not apply glow classes when glow is false', () => {
    const { container } = render(<ProgressBar value={50} glow={false} />);
    const bar = container.querySelector('[style]') as HTMLElement;
    expect(bar.className).not.toContain('shadow-progress-glow');
  });

  it('applies custom className to outer container', () => {
    const { container } = render(<ProgressBar value={50} className="my-class" />);
    const outer = container.firstChild as HTMLElement;
    expect(outer.className).toContain('my-class');
  });
});
