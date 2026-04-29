import type { ComponentType, ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { wrapper?: ComponentType },
) {
  const { wrapper, ...rest } = options ?? {};
  return render(ui, wrapper ? { wrapper, ...rest } : rest);
}

export * from '@testing-library/react';
export { customRender as render };

export function setupUser() {
  return userEvent.setup();
}
