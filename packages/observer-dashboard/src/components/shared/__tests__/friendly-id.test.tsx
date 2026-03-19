import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { FriendlyId } from '../friendly-id';

describe('FriendlyId', () => {
  it('renders without crashing', () => {
    render(<FriendlyId id="abc123def456" />);
    // formatShortId("abc123def456") defaults to 4 chars => "...f456"
    expect(screen.getByText('...f456')).toBeInTheDocument();
  });

  it('renders truncated ID using formatShortId', () => {
    render(<FriendlyId id="my-long-test-id" />);
    expect(screen.getByText('...t-id')).toBeInTheDocument();
  });

  it('renders as a button element', () => {
    render(<FriendlyId id="test-id" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('copies full ID to clipboard on click', async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
    render(<FriendlyId id="full-id-for-copy" />);
    const btn = screen.getByRole('button');
    await user.click(btn);
    expect(writeTextSpy).toHaveBeenCalledWith('full-id-for-copy');
  });

  it('applies copied class after clicking', async () => {
    const user = userEvent.setup();
    render(<FriendlyId id="some-id" />);
    const btn = screen.getByRole('button');
    await user.click(btn);
    // After copying, button gets 'text-primary' class to indicate copied state
    expect(btn.className).toContain('text-primary');
  });

  it('applies custom className', () => {
    const { container } = render(<FriendlyId id="test" className="my-class" />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('my-class');
  });
});
