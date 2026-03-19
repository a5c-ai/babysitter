import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/test-utils';
import { Badge } from '../badge';

describe('Badge', () => {
  it('renders without crashing', () => {
    render(<Badge>Label</Badge>);
    expect(screen.getByText('Label')).toBeInTheDocument();
  });

  it('renders children text', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeInTheDocument();
  });

  it('renders as a <span> element', () => {
    const { container } = render(<Badge>Test</Badge>);
    const span = container.querySelector('span');
    expect(span).toBeInTheDocument();
  });

  it('applies default variant classes', () => {
    const { container } = render(<Badge>Default</Badge>);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain('bg-muted');
  });

  it('applies success variant classes', () => {
    const { container } = render(<Badge variant="success">Success</Badge>);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain('text-success');
  });

  it('applies error variant classes', () => {
    const { container } = render(<Badge variant="error">Error</Badge>);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain('text-error');
  });

  it('applies warning variant classes', () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain('text-warning');
  });

  it('applies info variant classes', () => {
    const { container } = render(<Badge variant="info">Info</Badge>);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain('text-info');
  });

  it('applies pending variant classes', () => {
    const { container } = render(<Badge variant="pending">Pending</Badge>);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain('text-pending');
  });

  it('applies custom className', () => {
    const { container } = render(<Badge className="custom-cls">C</Badge>);
    const span = container.firstChild as HTMLElement;
    expect(span.className).toContain('custom-cls');
  });

  it('passes through additional HTML attributes', () => {
    render(<Badge data-testid="my-badge">X</Badge>);
    expect(screen.getByTestId('my-badge')).toBeInTheDocument();
  });
});
