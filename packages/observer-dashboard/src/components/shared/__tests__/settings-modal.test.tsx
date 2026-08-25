import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { SettingsModal } from '../settings-modal';
import { ThemeProvider } from '../theme-provider';

const mockConfig = {
  sources: [{ path: '/tmp/runs', depth: 2, label: 'test' }],
  port: 4040,
  pollInterval: 2000,
  theme: 'dark' as const,
  retentionDays: 30,
  hiddenProjects: [],
};

const mockProjects = { projects: [{ projectName: 'test-project' }] };

/** Create a proper Response for resilientFetch from JSON data */
function jsonResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Mock fetch for SettingsModal which makes 2 parallel requests:
 *  1. GET /api/config
 *  2. GET /api/runs?mode=projects
 */
function mockSettingsFetch() {
  vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString();
    if (url.includes('/api/config')) {
      return Promise.resolve(jsonResponse(mockConfig));
    }
    if (url.includes('/api/runs')) {
      return Promise.resolve(jsonResponse(mockProjects));
    }
    return Promise.resolve(new Response('Not Found', { status: 404 }));
  });
}

function renderWithTheme(open: boolean, onClose = vi.fn()) {
  return render(
    <ThemeProvider>
      <SettingsModal open={open} onClose={onClose} />
    </ThemeProvider>,
  );
}

describe('SettingsModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when open is false', () => {
    const { container } = renderWithTheme(false);
    expect(container.querySelector('[class*="fixed"]')).toBeNull();
  });

  it('renders modal when open is true and config loads', async () => {
    mockSettingsFetch();

    renderWithTheme(true);

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });
  });

  it('shows loading indicator while fetching config', () => {
    // Never resolve fetch
    vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));

    renderWithTheme(true);

    expect(screen.getByText('Loading configuration...')).toBeInTheDocument();
  });

  it('shows fetch error when config load fails', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('/api/config')) {
        return Promise.resolve(new Response('Bad request', { status: 400 }));
      }
      if (url.includes('/api/runs')) {
        return Promise.resolve(jsonResponse(mockProjects));
      }
      return Promise.resolve(new Response('Not Found', { status: 404 }));
    });

    renderWithTheme(true);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load config/)).toBeInTheDocument();
    });
  });

  it('displays watch sources section after config loads', async () => {
    mockSettingsFetch();

    renderWithTheme(true);

    await waitFor(() => {
      expect(screen.getByText('Watch Sources')).toBeInTheDocument();
    });
  });

  it('displays poll interval section after config loads', async () => {
    mockSettingsFetch();

    renderWithTheme(true);

    await waitFor(() => {
      expect(screen.getByText('Poll Interval')).toBeInTheDocument();
    });
  });

  it('displays theme section after config loads', async () => {
    mockSettingsFetch();

    renderWithTheme(true);

    await waitFor(() => {
      expect(screen.getByText('Theme')).toBeInTheDocument();
    });
  });

  it('calls onClose when clicking the close button', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    mockSettingsFetch();

    render(
      <ThemeProvider>
        <SettingsModal open={true} onClose={onClose} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    // Click the X close button (the button adjacent to the header)
    const closeButtons = screen.getAllByRole('button');
    // First button should be the X close button
    const xButton = closeButtons[0];
    await user.click(xButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when pressing Escape', async () => {
    const onClose = vi.fn();
    mockSettingsFetch();

    render(
      <ThemeProvider>
        <SettingsModal open={true} onClose={onClose} />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument();
    });

    // Radix Dialog listens for Escape on the document
    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(event);

    expect(onClose).toHaveBeenCalled();
  });

  it('shows Add Source button and can add a new source', async () => {
    const user = userEvent.setup();
    mockSettingsFetch();

    renderWithTheme(true);

    await waitFor(() => {
      expect(screen.getByText('Add Source')).toBeInTheDocument();
    });

    await user.click(screen.getByText('Add Source'));

    // There should now be 2 source path inputs (original + new)
    const pathInputs = screen.getAllByPlaceholderText('/path/to/projects');
    expect(pathInputs.length).toBe(2);
  });

  it('shows config file path in footer', async () => {
    mockSettingsFetch();

    renderWithTheme(true);

    await waitFor(() => {
      expect(screen.getByText('~/.a5c/observer.json')).toBeInTheDocument();
    });
  });
});
