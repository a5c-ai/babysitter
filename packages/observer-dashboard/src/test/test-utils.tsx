import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Minimal test wrapper that provides the contexts needed by most components.
 * We avoid importing the real Providers tree because it depends on hooks that
 * fire network requests (polling, SSE) which would interfere with tests.
 * Individual tests that need a specific provider can compose their own wrapper.
 */
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

/**
 * Custom render that wraps the component in TestWrapper.
 * Use this instead of importing render directly from @testing-library/react.
 */
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { wrapper?: React.ComponentType },
) {
  const Wrapper = options?.wrapper ?? TestWrapper;
  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';

// Override render with our custom version
export { customRender as render };

// Export a pre-configured userEvent instance
export function setupUser() {
  return userEvent.setup();
}
