#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { createClient } from '@a5c-ai/agent-mux-core';
import { registerBuiltInAdapters } from '@a5c-ai/agent-mux-cli/bootstrap';
import { reconfigureLogger } from '@a5c-ai/agent-mux-observability';
import { App, builtinPlugins, defaultExternalPluginsDir, loadExternalPlugins } from '../index.js';
import { runWithArgs } from './runtime.js';

function builtInAdaptersDisabled(): boolean {
  const value = process.env.AMUX_TUI_NO_BUILTIN_ADAPTERS;
  return value === '1' || value === 'true';
}

function chatAutoPromptDisabled(): boolean {
  const value = process.env.AMUX_TUI_NO_AUTO_PROMPT;
  return value === '1' || value === 'true';
}

function initialViewId(): string | undefined {
  const value = process.env.AMUX_TUI_INITIAL_VIEW;
  return value && value.trim() ? value.trim() : undefined;
}

function configureLoggingFromEnv(): void {
  const logLevel = process.env.AMUX_LOG_LEVEL?.trim();
  const logFile = process.env.AMUX_LOG_FILE?.trim();
  if (!logFile) {
    return;
  }
  if (!process.env.AMUX_OBSERVABILITY_MODE) {
    process.env.AMUX_OBSERVABILITY_MODE = 'full';
  }
  reconfigureLogger({
    level: logLevel,
    logFile,
  });
}

const invokedAsScript = (() => {
  try {
    const argv1 = process.argv[1];
    if (!argv1) return false;
    return /amux-tui(\.js|\.tsx?)?$/.test(argv1);
  } catch {
    return false;
  }
})();

if (invokedAsScript) {
  configureLoggingFromEnv();
  void runWithArgs(process.argv.slice(2), {
    builtinPlugins,
    createClient,
    defaultExternalPluginsDir,
    loadExternalPlugins,
    registerBuiltInAdapters: (client) => {
      if (!builtInAdaptersDisabled()) {
        registerBuiltInAdapters(client);
      }
    },
    renderApp: ({ client, plugins }) => {
      // Type assertion bridges Ink 5.x (React 18 types) with React 19's stricter ReactNode
      render(
        React.createElement(App, {
          client,
          plugins,
          initialViewId: initialViewId(),
          disableChatAutoPrompt: chatAutoPromptDisabled(),
        }) as any,
      );
    },
  }).catch((error: unknown) => {
    process.stderr.write(`amux-tui: ${(error as Error).message}\n`);
    process.exitCode = 1;
  });
}
