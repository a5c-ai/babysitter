import type { ComponentType, PropsWithChildren, ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom-v6';

function createWrapper(OuterWrapper?: ComponentType<PropsWithChildren>) {
  return function Wrapper({ children }: PropsWithChildren) {
    const content = <MemoryRouter>{children}</MemoryRouter>;
    return OuterWrapper ? <OuterWrapper>{content}</OuterWrapper> : content;
  };
}

function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { wrapper?: ComponentType<PropsWithChildren> },
) {
  const { wrapper, ...rest } = options ?? {};
  return render(ui, { wrapper: createWrapper(wrapper), ...rest });
}

export * from '@testing-library/react';
export { customRender as render };

export function setupUser() {
  return userEvent.setup();
}
