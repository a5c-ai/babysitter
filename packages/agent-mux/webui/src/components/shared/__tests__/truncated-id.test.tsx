import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { TruncatedId } from '../truncated-id';

describe('TruncatedId', () => {
  it('renders without crashing', () => {
    render(<TruncatedId id="abc123def456" />);
    // formatShortId("abc123def456", 4) => "...f456"
    expect(screen.getByText('...f456')).toBeInTheDocument();
  });

  it('renders truncated ID with default 4 chars', () => {
    render(<TruncatedId id="long-id-string-xyz" />);
    expect(screen.getByText('...-xyz')).toBeInTheDocument();
  });

  it('renders truncated ID with custom chars count', () => {
    render(<TruncatedId id="abcdefghij" chars={6} />);
    // formatShortId("abcdefghij", 6) => "...efghij"
    expect(screen.getByText('...efghij')).toBeInTheDocument();
  });

  it('renders full ID when shorter than chars', () => {
    render(<TruncatedId id="ab" chars={4} />);
    expect(screen.getByText('ab')).toBeInTheDocument();
  });

  it('copies full ID to clipboard on click', async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
    render(<TruncatedId id="full-id-to-copy" />);
    const el = screen.getByText('...copy');
    await user.click(el);
    expect(writeTextSpy).toHaveBeenCalledWith('full-id-to-copy');
  });

  it('applies copied class after click', async () => {
    const user = userEvent.setup();
    render(<TruncatedId id="some-test-id" />);
    const el = screen.getByText('...t-id');
    await user.click(el);
    // After copying, the element gets 'text-primary' class to indicate copied state
    expect(el.className).toContain('text-primary');
  });

  it('applies custom className', () => {
    const { container } = render(<TruncatedId id="test-id" className="custom-class" />);
    const span = container.querySelector('span');
    expect(span?.className).toContain('custom-class');
  });
});
