import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import { ThemeProvider, useTheme } from '../theme-provider';

function ThemeConsumer() {
  const { theme, toggle } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={toggle}>Toggle</button>
    </div>
  );
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    // Reset DOM state between tests since ThemeProvider reads from the DOM
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.className = '';
    localStorage.removeItem('observer-theme');
  });

  it('renders children', () => {
    render(
      <ThemeProvider>
        <span>child content</span>
      </ThemeProvider>,
    );
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('provides default dark theme', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
  });

  it('toggles from dark to light', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('theme-value').textContent).toBe('light');
  });

  it('toggles from light back to dark', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('theme-value').textContent).toBe('light');
    fireEvent.click(screen.getByText('Toggle'));
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
  });

  it('sets data-theme attribute on document element when toggling', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText('Toggle'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('sets className on document element when toggling', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText('Toggle'));
    expect(document.documentElement.className).toBe('light');
  });

  it('stores theme in localStorage when toggling', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText('Toggle'));
    expect(localStorage.getItem('observer-theme')).toBe('light');
  });
});

describe('useTheme without provider', () => {
  it('returns default values when used outside ThemeProvider', () => {
    render(<ThemeConsumer />);
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
  });
});
