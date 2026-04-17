/**
 * render.ts — entry point for the Babysitter TUI.
 *
 * This is the only file that performs dynamic imports of ESM-only packages
 * (ink).  React is imported normally (react is CJS-compatible).  Ink is
 * loaded via the indirect `new Function("return import(s)")` pattern that
 * the SDK uses throughout (see cli/main.ts) to prevent TypeScript from
 * downleveling `import()` to `require()` in CommonJS builds, which would
 * fail for ESM-only packages.
 *
 * Usage:
 *   const session = await createTuiSession({ runId: '...', verbosity: 'normal' });
 *   // ...do work...
 *   session.unmount();
 *   await session.waitUntilExit();
 */

import React from "react";
import type { TuiConfig } from "./types.js";

// ---------------------------------------------------------------------------
// Inline types for the Ink module surface we use.
// These mirror the declarations in ink.d.ts but are local to avoid
// import()-resolution issues with moduleResolution:"node".
// ---------------------------------------------------------------------------

interface InkInstance {
  rerender: (tree: React.ReactElement) => void;
  unmount: () => void;
  cleanup: () => void;
  clear: () => void;
  waitUntilExit: () => Promise<void>;
}

interface InkRenderOptions {
  stdout?: NodeJS.WriteStream;
  stdin?: NodeJS.ReadStream;
  debug?: boolean;
  exitOnCtrlC?: boolean;
  patchConsole?: boolean;
}

type InkInputHandler = (input: string, key: Record<string, unknown>) => void;
interface InkUseInputOptions { isActive?: boolean; }
type InkUseInput = (handler: InkInputHandler, options?: InkUseInputOptions) => void;

interface InkModule {
  render: (
    tree: React.ReactElement,
    options?: InkRenderOptions,
  ) => InkInstance;
  Box: React.ComponentType<Record<string, unknown>>;
  Text: React.ComponentType<Record<string, unknown>>;
  useInput: InkUseInput;
}

// ---------------------------------------------------------------------------
// Indirect dynamic import (avoids TypeScript CJS downlevel to require())
// ---------------------------------------------------------------------------

type DynImport = (specifier: string) => Promise<Record<string, unknown>>;

const dynamicImport: DynImport = (() => {
  if (process.env.VITEST) {
    return (s: string) => import(s);
  }
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  return new Function("s", "return import(s);") as DynImport;
})();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface TuiSession {
  /** Resolves when the TUI exits (e.g. user presses Ctrl-C). */
  waitUntilExit: () => Promise<void>;
  /** Programmatically unmount the TUI. */
  unmount: () => void;
}

/**
 * Create and mount a TUI session.
 *
 * Dynamically imports Ink (ESM-only) and the App component, then renders to
 * stderr by default so that normal stdout output is not polluted.
 */
export async function createTuiSession(
  config: TuiConfig = {},
): Promise<TuiSession> {
  const [inkRaw, appModule] = await Promise.all([
    dynamicImport("ink"),
    // App.tsx imports only react (CJS-compatible) and our own types, so a
    // normal dynamic import is fine here — it will be require()'d at runtime.
    Promise.resolve(
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require("./App.js") as {
        default: React.ComponentType<TuiConfig>;
        InkProvider: React.ComponentType<Record<string, unknown>>;
      },
    ),
  ]);

  const ink = inkRaw as unknown as InkModule;
  const { render, Box, Text, useInput } = ink;
  const { default: App, InkProvider } = appModule as {
    default: React.ComponentType<TuiConfig>;
    InkProvider: React.ComponentType<{
      children?: React.ReactNode;
      Box: React.ComponentType<Record<string, unknown>>;
      Text: React.ComponentType<Record<string, unknown>>;
      useInput: InkUseInput;
    }>;
  };

  const useStderr = config.useStderr !== false; // default true

  const element = React.createElement(
    InkProvider,
    { Box, Text, useInput },
    React.createElement(App, {
      ...config,
      initialView: config.initialView,
      runsDir: config.runsDir,
    }),
  );

  const instance = render(element, {
    ...(useStderr ? { stdout: process.stderr } : {}),
  });

  return {
    waitUntilExit: () => instance.waitUntilExit(),
    unmount: () => {
      instance.unmount();
    },
  };
}
