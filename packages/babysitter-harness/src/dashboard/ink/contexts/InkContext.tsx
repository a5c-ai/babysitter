/**
 * InkContext — provides Ink's Box, Text, and useInput through React context.
 *
 * This is the canonical solution to the prop-drilling problem: instead of
 * passing _Box and _Text through every component's props, we inject them once
 * at the InkProvider level (in render.ts, after dynamic import) and all
 * descendant components can call useInk() to retrieve them.
 *
 * The useInput function is also injected here so that components can register
 * keyboard handlers without statically importing the ESM-only 'ink' package.
 */

import React, { createContext, useContext, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Ink component / hook types (matches ink.d.ts declarations)
// ---------------------------------------------------------------------------

export type InkBoxComponent = React.ComponentType<Record<string, unknown> & { children?: ReactNode }>;
export type InkTextComponent = React.ComponentType<Record<string, unknown> & { children?: ReactNode }>;

export interface InkKey {
  upArrow: boolean;
  downArrow: boolean;
  leftArrow: boolean;
  rightArrow: boolean;
  pageDown: boolean;
  pageUp: boolean;
  return: boolean;
  escape: boolean;
  ctrl: boolean;
  shift: boolean;
  tab: boolean;
  backspace: boolean;
  delete: boolean;
  meta: boolean;
  [key: string]: unknown;
}

export type InkInputHandler = (input: string, key: InkKey) => void;

export interface InkUseInputOptions {
  isActive?: boolean;
}

export type InkUseInput = (
  handler: InkInputHandler,
  options?: InkUseInputOptions,
) => void;

// ---------------------------------------------------------------------------
// Context value
// ---------------------------------------------------------------------------

export interface InkContextValue {
  Box: InkBoxComponent;
  Text: InkTextComponent;
  useInput: InkUseInput;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const InkContext = createContext<InkContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface InkProviderProps {
  children: ReactNode;
  Box: InkBoxComponent;
  Text: InkTextComponent;
  useInput: InkUseInput;
}

export function InkProvider({
  children,
  Box,
  Text,
  useInput,
}: InkProviderProps): React.JSX.Element {
  // Stable reference — these never change for a given render session
  const value = React.useMemo(
    () => ({ Box, Text, useInput }),
    // Box/Text/useInput are module-level references from the dynamic import;
    // they will never actually change between renders, but we list them for
    // correctness.
    [Box, Text, useInput],
  );

  return (
    <InkContext.Provider value={value}>
      {children}
    </InkContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns the injected Ink Box, Text components and useInput hook.
 * Must be called from within an InkProvider subtree.
 */
export function useInk(): InkContextValue {
  const ctx = useContext(InkContext);
  if (ctx === null) {
    throw new Error("useInk() must be called within an <InkProvider> tree");
  }
  return ctx;
}
