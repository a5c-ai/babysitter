/**
 * Ambient module declaration for the 'ink' package.
 *
 * Ink 4.x is ESM-only and declares its exports via the `exports` field in
 * package.json.  The SDK uses `moduleResolution: "node"` which does not
 * understand package export maps, so TypeScript cannot resolve Ink's types
 * automatically.  This file re-declares the minimum surface needed by the TUI
 * render entry point so that `import('ink')` inside an async function
 * type-checks correctly without requiring a tsconfig change.
 *
 * If the SDK's tsconfig is ever upgraded to `"moduleResolution": "bundler"` or
 * `"node16"`, this file can be removed.
 */

import type { ComponentType, ReactElement, ReactNode } from "react";
import type { Styles } from "yoga-layout";

declare module "ink" {
  export interface RenderOptions {
    stdout?: NodeJS.WriteStream;
    stdin?: NodeJS.ReadStream;
    debug?: boolean;
    exitOnCtrlC?: boolean;
    patchConsole?: boolean;
  }

  export interface Instance {
    rerender: (tree: ReactElement) => void;
    unmount: () => void;
    cleanup: () => void;
    clear: () => void;
    waitUntilExit: () => Promise<void>;
  }

  export function render(
    tree: ReactElement,
    options?: RenderOptions,
  ): Instance;

  // Box component
  export interface BoxProps {
    flexDirection?: "row" | "column" | "row-reverse" | "column-reverse";
    flexGrow?: number;
    flexShrink?: number;
    flexBasis?: number | string;
    flexWrap?: "wrap" | "nowrap" | "wrap-reverse";
    alignItems?: "flex-start" | "center" | "flex-end" | "stretch";
    alignSelf?: "flex-start" | "center" | "flex-end" | "auto" | "stretch";
    justifyContent?:
      | "flex-start"
      | "center"
      | "flex-end"
      | "space-between"
      | "space-around";
    width?: number | string;
    height?: number | string;
    minWidth?: number | string;
    minHeight?: number | string;
    maxWidth?: number | string;
    maxHeight?: number | string;
    padding?: number;
    paddingX?: number;
    paddingY?: number;
    paddingTop?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    paddingRight?: number;
    margin?: number;
    marginX?: number;
    marginY?: number;
    marginTop?: number;
    marginBottom?: number;
    marginLeft?: number;
    marginRight?: number;
    borderStyle?:
      | "single"
      | "double"
      | "round"
      | "bold"
      | "singleDouble"
      | "doubleSingle"
      | "classic";
    borderColor?: string;
    borderTopColor?: string;
    borderBottomColor?: string;
    borderLeftColor?: string;
    borderRightColor?: string;
    borderTop?: boolean;
    borderBottom?: boolean;
    borderLeft?: boolean;
    borderRight?: boolean;
    gap?: number;
    columnGap?: number;
    rowGap?: number;
    overflow?: "visible" | "hidden";
    overflowX?: "visible" | "hidden";
    overflowY?: "visible" | "hidden";
    children?: ReactNode;
  }

  export const Box: ComponentType<BoxProps>;

  // Text component
  export interface TextProps {
    color?: string;
    backgroundColor?: string;
    dimColor?: boolean;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strikethrough?: boolean;
    inverse?: boolean;
    wrap?: "wrap" | "truncate" | "truncate-start" | "truncate-middle" | "truncate-end";
    children?: ReactNode;
  }

  export const Text: ComponentType<TextProps>;

  // Static component
  export interface StaticProps<T> {
    items: T[];
    children: (item: T, index: number) => ReactElement;
    style?: Partial<Styles>;
  }

  export const Static: <T>(props: StaticProps<T>) => ReactElement;

  // Newline component
  export interface NewlineProps {
    count?: number;
  }

  export const Newline: ComponentType<NewlineProps>;

  // Spacer component
  export const Spacer: ComponentType<Record<string, never>>;

  // useInput hook
  export interface Key {
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
  }

  export type InputHandler = (input: string, key: Key) => void;

  export interface UseInputOptions {
    isActive?: boolean;
  }

  export function useInput(inputHandler: InputHandler, options?: UseInputOptions): void;

  // useApp hook
  export interface AppProps {
    exit: (error?: Error) => void;
  }

  export function useApp(): AppProps;

  // useStdout hook
  export interface StdoutProps {
    stdout: NodeJS.WriteStream;
    write: (data: string) => void;
  }

  export function useStdout(): StdoutProps;

  // useStderr hook
  export interface StderrProps {
    stderr: NodeJS.WriteStream;
    write: (data: string) => void;
  }

  export function useStderr(): StderrProps;
}
