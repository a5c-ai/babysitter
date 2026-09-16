import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button', () => {
  it('renders without crashing', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('renders children text', () => {
    render(<Button>Submit</Button>);
    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('renders as a <button> element by default', () => {
    render(<Button>Btn</Button>);
    const btn = screen.getByRole('button');
    expect(btn.tagName).toBe('BUTTON');
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire click when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button onClick={handleClick} disabled>
        Disabled
      </Button>,
    );
    await user.click(screen.getByRole('button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies disabled attribute', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  // UX-R3 §14.2 (owner gate 2026-07-06 ruling, option a): the default variant
  // is the primary CTA and carries the ACTION hue as a filled surface (magenta
  // is brand-only now) — supersedes the old bg-primary assertion.
  it('applies default (action) variant classes', () => {
    render(<Button>Default</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-action');
    expect(btn.className).toContain('text-action-foreground');
    expect(btn.className).not.toContain('bg-primary');
  });

  // UX-R3 §14.3: the neon variant renders the neutral answer-option button —
  // foreground ink on a background-secondary fill, no brand/action/status ink
  // (supersedes the old border-primary assertion).
  it('applies neon (neutral option) variant classes', () => {
    render(<Button variant="neon">Neon</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-background-secondary');
    expect(btn.className).toContain('text-foreground');
    expect(btn.className).not.toContain('border-primary');
    expect(btn.className).not.toContain('text-primary');
  });

  it('applies outline variant classes', () => {
    render(<Button variant="outline">Outline</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-transparent');
  });

  it('applies ghost variant classes', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('hover:bg-muted');
  });

  it('applies destructive variant classes', () => {
    render(<Button variant="destructive">Delete</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('bg-destructive');
  });

  it('applies sm size classes', () => {
    render(<Button size="sm">Small</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('h-11');
  });

  it('applies lg size classes', () => {
    render(<Button size="lg">Large</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('h-10');
  });

  it('applies icon size classes', () => {
    render(<Button size="icon">I</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('w-11');
  });

  it('applies custom className', () => {
    render(<Button className="extra">Cls</Button>);
    const btn = screen.getByRole('button');
    expect(btn.className).toContain('extra');
  });

  it('renders as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>,
    );
    const link = screen.getByRole('link', { name: 'Link Button' });
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
  });
});
