/**
 * Babysitter Paperclip plugin manifest.
 *
 * Declares capabilities, event subscriptions, UI slots, and settings
 * for the Babysitter orchestration integration with Paperclip.
 */

export const manifest = {
  id: "babysitter",
  displayName: "Babysitter Orchestrator",
  description:
    "Deterministic, event-sourced orchestration for Paperclip agents via Babysitter.",
  version: "0.0.1",

  entrypoints: {
    worker: "dist/worker.js",
    ui: "dist/ui",
  },

  capabilities: [
    "events.subscribe",
    "events.emit",
    "plugin.state.read",
    "plugin.state.write",
    "agents.read",
    "agent.tools.register",
    "ui.dashboardWidget.register",
    "ui.detailTab.register",
    "ui.action.register",
    "ui.sidebar.register",
  ],

  events: {
    subscribe: [
      "agent.run.started",
      "agent.run.finished",
      "agent.run.failed",
      "agent.run.cancelled",
    ],
    emit: [
      "plugin.babysitter.run.created",
      "plugin.babysitter.breakpoint.requested",
      "plugin.babysitter.breakpoint.resolved",
    ],
  },

  settings: {
    runsDir: {
      type: "string" as const,
      default: ".a5c/runs",
      displayName: "Runs Directory",
      description: "Directory where babysitter run data is stored.",
    },
    autoIterate: {
      type: "boolean" as const,
      default: true,
      displayName: "Auto-Iterate",
      description:
        "Automatically iterate runs when effects are resolved.",
    },
    maxIterations: {
      type: "number" as const,
      default: 256,
      displayName: "Max Iterations",
      description: "Maximum orchestration iterations per run.",
    },
    breakpointTimeout: {
      type: "number" as const,
      default: 3600000,
      displayName: "Breakpoint Timeout (ms)",
      description:
        "Time to wait for breakpoint approval before timing out (default 1 hour).",
    },
  },

  ui: {
    slots: [
      {
        type: "dashboardWidget",
        id: "babysitter-dashboard",
        displayName: "Babysitter Runs",
        exportName: "BabysitterDashboard",
      },
      {
        type: "detailTab",
        id: "babysitter-run-detail",
        displayName: "Babysitter Run",
        exportName: "RunDetailTab",
        entityTypes: ["agent"],
      },
      {
        type: "sidebarPanel",
        id: "babysitter-sidebar",
        displayName: "Babysitter",
        exportName: "BabysitterSidebar",
      },
    ],
  },
} as const;

export default manifest;
