import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { ShortcutsHelp } from '../shortcuts-help';

// Default mock returns '/' (dashboard). Override per-test for run detail.
const mockUsePathname = vi.fn(() => '/');
vi.mock('next/navigation', async () => {
  const actual = await vi.importActual('next/navigation');
  return { ...actual, usePathname: () => mockUsePathname() };
});

describe('ShortcutsHelp', () => {
  it('renders nothing initially (modal is closed)', () => {
    render(<ShortcutsHelp />);
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('opens modal on "?" key press', () => {
    render(<ShortcutsHelp />);
    fireEvent.keyDown(window, { key: '?' });
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('on dashboard, shows only global and dashboard shortcuts', () => {
    mockUsePathname.mockReturnValue('/');
    render(<ShortcutsHelp />);
    fireEvent.keyDown(window, { key: '?' });

    // Global shortcuts
    expect(screen.getByText('Show this help')).toBeInTheDocument();
    expect(screen.getByText('Toggle notifications')).toBeInTheDocument();
    // Dashboard shortcuts
    expect(screen.getByText('Focus search')).toBeInTheDocument();
    // Run-detail shortcuts should NOT appear
    expect(screen.queryByText('Next item')).not.toBeInTheDocument();
    expect(screen.queryByText('Agent tab')).not.toBeInTheDocument();
  });

  it('on run detail page, shows global and run-detail shortcuts', () => {
    mockUsePathname.mockReturnValue('/runs/abc-123');
    render(<ShortcutsHelp />);
    fireEvent.keyDown(window, { key: '?' });

    // Global shortcuts
    expect(screen.getByText('Show this help')).toBeInTheDocument();
    expect(screen.getByText('Toggle notifications')).toBeInTheDocument();
    // Run-detail shortcuts
    expect(screen.getByText('Next item')).toBeInTheDocument();
    expect(screen.getByText('Previous item')).toBeInTheDocument();
    expect(screen.getByText('Open selected')).toBeInTheDocument();
    expect(screen.getByText('Go back / Close')).toBeInTheDocument();
    expect(screen.getByText('Toggle event stream')).toBeInTheDocument();
    expect(screen.getByText('Agent tab')).toBeInTheDocument();
    expect(screen.getByText('Timing tab')).toBeInTheDocument();
    expect(screen.getByText('Logs tab')).toBeInTheDocument();
    expect(screen.getByText('Data tab')).toBeInTheDocument();
    expect(screen.getByText('Approval tab')).toBeInTheDocument();
    // Dashboard shortcuts should NOT appear
    expect(screen.queryByText('Focus search')).not.toBeInTheDocument();
  });

  it('displays keyboard keys when open', () => {
    mockUsePathname.mockReturnValue('/runs/abc-123');
    render(<ShortcutsHelp />);
    fireEvent.keyDown(window, { key: '?' });

    expect(screen.getByText('j')).toBeInTheDocument();
    expect(screen.getByText('k')).toBeInTheDocument();
    expect(screen.getByText('Enter')).toBeInTheDocument();
    expect(screen.getByText('Esc')).toBeInTheDocument();
  });

  it('shows section headers', () => {
    mockUsePathname.mockReturnValue('/runs/abc-123');
    render(<ShortcutsHelp />);
    fireEvent.keyDown(window, { key: '?' });

    expect(screen.getByText('Global')).toBeInTheDocument();
    expect(screen.getByText('Run Detail')).toBeInTheDocument();
  });

  it('closes modal on Escape key press', () => {
    render(<ShortcutsHelp />);
    // Open
    fireEvent.keyDown(window, { key: '?' });
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    // Close
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('closes modal when clicking the close button', async () => {
    render(<ShortcutsHelp />);
    fireEvent.keyDown(window, { key: '?' });
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();

    // Click the close button (the X button) - find it via the Dialog.Close wrapping
    const closeButton = screen.getByTestId('icon-X').closest('button')!;
    fireEvent.click(closeButton);
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });
});
