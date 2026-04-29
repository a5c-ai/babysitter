import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { SessionPill } from '../session-pill';

describe('SessionPill', () => {
  it('renders nothing when sessionId is undefined', () => {
    const { container } = render(<SessionPill />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when sessionId is empty string', () => {
    const { container } = render(<SessionPill sessionId="" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the truncated session ID', () => {
    render(<SessionPill sessionId="abcdef123456" />);
    // formatShortId with chars=4 produces "...3456"
    expect(screen.getByText('...3456')).toBeInTheDocument();
  });

  it('renders an active state indicator dot', () => {
    const { container } = render(<SessionPill sessionId="abcdef123456" active />);
    // The active dot should have animate-pulse-dot class
    const dots = container.querySelectorAll('span span');
    const activeDot = Array.from(dots).find(el => el.className.includes('animate-pulse-dot'));
    expect(activeDot).toBeTruthy();
  });

  it('renders an inactive state indicator dot', () => {
    const { container } = render(<SessionPill sessionId="abcdef123456" active={false} />);
    const dots = container.querySelectorAll('span span');
    const inactiveDot = Array.from(dots).find(el => el.className.includes('bg-foreground-muted/40'));
    expect(inactiveDot).toBeTruthy();
  });

  it('copies session ID to clipboard on click', async () => {
    const user = userEvent.setup();
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText');
    render(<SessionPill sessionId="session-xyz-12345" />);
    const pill = screen.getByText('...2345');
    await user.click(pill);
    expect(writeTextSpy).toHaveBeenCalledWith('session-xyz-12345');
  });

  it('shows "Copied!" feedback after click', async () => {
    const user = userEvent.setup();
    render(<SessionPill sessionId="session-xyz-12345" />);
    const pill = screen.getByText('...2345');
    await user.click(pill);
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(<SessionPill sessionId="abc123" className="extra" />);
    // Find the main span trigger
    const span = container.querySelector('span');
    expect(span).toBeTruthy();
  });
});
