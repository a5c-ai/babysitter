declare module 'react-dom/client' {
  import type { ReactNode } from 'react';

  export interface Root {
    render(children: ReactNode): void;
    unmount(): void;
  }

  export interface HydrationOptions {
    identifierPrefix?: string;
    onRecoverableError?: (error: unknown) => void;
  }

  export function createRoot(
    container: Element | DocumentFragment,
    options?: HydrationOptions,
  ): Root;

  export function hydrateRoot(
    container: Element | Document,
    initialChildren: ReactNode,
    options?: HydrationOptions,
  ): Root;
}
