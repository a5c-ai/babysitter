/**
 * App — root TUI component for the Babysitter terminal UI.
 *
 * This file is only ever loaded via dynamic import() from render.ts, so by
 * the time this module executes the Ink ESM bundle has already been imported
 * and its exports are passed in via InkProvider.  Components in the tree
 * retrieve Box/Text/useInput via the useInk() hook instead of receiving them
 * as props.  This avoids any direct static import of ESM-only modules from a
 * CommonJS compilation unit.
 *
 * Layout varies by view:
 *   dashboard → DashboardView (run list with navigation)
 *   session   → SessionView (StatusBar + MessagePane + PromptBar)
 *   run-detail → RunDetailView (metadata, events, tasks, resume)
 */

import React from "react";

import { InkProvider } from "./contexts/InkContext.js";
import { SessionProvider } from "./contexts/SessionContext.js";
import { NavigationProvider } from "./contexts/NavigationContext.js";
import { ChatProvider } from "./contexts/ChatContext.js";
import { useNavigation } from "./hooks/useNavigation.js";
import { ThemeProvider, neonDarkTheme } from "./contexts/ThemeContext.js";
import { ClockProvider } from "./contexts/ClockContext.js";
import { useInk } from "./contexts/InkContext.js";
import { useSession } from "./hooks/useSession.js";
import { StatusBar } from "./components/StatusBar.js";
import { MessagePane } from "./components/MessagePane.js";
import { PromptBar } from "./components/PromptBar.js";
import { DashboardView } from "./views/DashboardView.js";
import { SessionView } from "./views/SessionView.js";
import { RunDetailView } from "./views/RunDetailView.js";
import type { TuiConfig, Theme, VerbosityLevel, ViewName } from "./types.js";

// Re-export InkProvider so render.ts can reference it from the same require()
export { InkProvider };

// ---------------------------------------------------------------------------
// Legacy type exports — kept for backward compatibility with any existing
// imports that reference InkBox/InkText from App.js
// ---------------------------------------------------------------------------

export type InkBox = React.ComponentType<Record<string, unknown> & { children?: React.ReactNode }>;
export type InkText = React.ComponentType<Record<string, unknown> & { children?: React.ReactNode }>;

// ---------------------------------------------------------------------------
// Inner App (rendered inside all providers)
// ---------------------------------------------------------------------------

const VERBOSITY_CYCLE: VerbosityLevel[] = ["minimal", "normal", "verbose"];

interface AppInnerProps {
  readonly runsDir: string;
}

function AppInner({ runsDir }: AppInnerProps): React.JSX.Element {
  const { Text, useInput } = useInk();
  const { state: sessionState, dispatch: sessionDispatch } = useSession();
  const { state: navState } = useNavigation();

  // 'v' key cycles verbosity at the app level (only in session view, not while typing)
  const shortcutsActive = navState.currentView === "session" && !sessionState.inputActive;
  useInput(
    (input: string) => {
      if (input === "v") {
        const current = sessionState.verbosity;
        const idx = VERBOSITY_CYCLE.indexOf(current);
        const next = VERBOSITY_CYCLE[(idx + 1) % VERBOSITY_CYCLE.length];
        sessionDispatch({ type: "SET_VERBOSITY", verbosity: next as VerbosityLevel });
      }
    },
    { isActive: shortcutsActive },
  );

  switch (navState.currentView) {
    case "dashboard":
      return React.createElement(DashboardView, { runsDir });

    case "session":
      return React.createElement(SessionView, null);

    case "run-detail":
      return React.createElement(RunDetailView, { runsDir });

    default: {
      const _exhaustive: never = navState.currentView;
      return React.createElement(
        Text as React.ComponentType<Record<string, unknown>>,
        null,
        "Unknown view",
      );
    }
  }
}

// ---------------------------------------------------------------------------
// App root
// ---------------------------------------------------------------------------

export default function App({
  runId,
  verbosity = "normal",
  theme,
  initialView,
  runsDir = ".a5c/runs",
  harness = "internal",
  workspace,
  model,
}: TuiConfig): React.JSX.Element {
  const resolvedTheme: Theme = theme ?? neonDarkTheme;

  // Determine initial view: if a runId is provided and no explicit
  // initialView, default to session view for backward compatibility.
  const effectiveInitialView: ViewName =
    initialView ?? (runId ? "session" : "dashboard");

  return (
    <NavigationProvider initialView={effectiveInitialView} initialRunId={runId}>
      <SessionProvider initialRunId={runId} initialVerbosity={verbosity}>
        <ChatProvider harness={harness} workspace={workspace} model={model}>
          <ThemeProvider theme={resolvedTheme}>
            <ClockProvider intervalMs={100}>
              <AppInner runsDir={runsDir} />
            </ClockProvider>
          </ThemeProvider>
        </ChatProvider>
      </SessionProvider>
    </NavigationProvider>
  );
}
