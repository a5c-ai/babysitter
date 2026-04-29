"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Modal } from "@a5c-ai/compendium";
import { Kbd } from "./kbd";
import { useKeyboard } from "@/hooks/use-keyboard";

export interface ShortcutEntry {
  keys: string[];
  description: string;
  context: "global" | "dashboard" | "run-detail" | "session-workspace";
}

export const SHORTCUTS: ShortcutEntry[] = [
  // Global shortcuts (work everywhere)
  { keys: ["?"], description: "Show this help", context: "global" },
  { keys: ["n"], description: "Toggle notifications", context: "global" },
  // Dashboard shortcuts
  { keys: ["/"], description: "Focus search", context: "dashboard" },
  // Run detail shortcuts
  { keys: ["j"], description: "Next item", context: "run-detail" },
  { keys: ["k"], description: "Previous item", context: "run-detail" },
  { keys: ["Enter"], description: "Open selected", context: "run-detail" },
  { keys: ["Esc"], description: "Go back / Close", context: "run-detail" },
  { keys: ["e"], description: "Toggle event stream", context: "run-detail" },
  { keys: ["1"], description: "Agent tab", context: "run-detail" },
  { keys: ["2"], description: "Timing tab", context: "run-detail" },
  { keys: ["3"], description: "Logs tab", context: "run-detail" },
  { keys: ["4"], description: "Data tab", context: "run-detail" },
  { keys: ["5"], description: "Approval tab", context: "run-detail" },
  { keys: ["Shift", "W"], description: "Toggle workspace sidebar", context: "session-workspace" },
  { keys: ["Shift", "C"], description: "Toggle conversation panel", context: "session-workspace" },
  { keys: ["Shift", "X"], description: "Toggle context panel", context: "session-workspace" },
  { keys: ["Shift", "D"], description: "Toggle details sidebar", context: "session-workspace" },
  { keys: ["Ctrl/Cmd", "K"], description: "Open workspace command bar", context: "session-workspace" },
];

export const SHORTCUT_SECTION_LABELS: Record<string, string> = {
  "global": "Global",
  "dashboard": "Dashboard",
  "run-detail": "Run Detail",
  "session-workspace": "Session Workspace",
};

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isRunDetail = pathname?.startsWith("/runs/") ?? false;
  const isSessionWorkspace = pathname?.startsWith("/sessions/") ?? false;

  useKeyboard([
    { key: "?", action: () => setOpen(true), description: "Show shortcuts help" },
    { key: "Escape", action: () => setOpen(false), description: "Close shortcuts help" },
  ]);

  // Allow external components to open the shortcuts panel via custom event
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-shortcuts-help", handler);
    return () => window.removeEventListener("open-shortcuts-help", handler);
  }, []);

  // Filter shortcuts to show only relevant ones for current page
  const visibleShortcuts = SHORTCUTS.filter((s) => {
    if (s.context === "global") return true;
    if (s.context === "dashboard" && !isRunDetail) return true;
    if (s.context === "run-detail" && isRunDetail) return true;
    if (s.context === "session-workspace" && isSessionWorkspace) return true;
    return false;
  });

  // Group by context for display
  const sections = visibleShortcuts.reduce<Record<string, ShortcutEntry[]>>((acc, s) => {
    (acc[s.context] ??= []).push(s);
    return acc;
  }, {});

  return (
    <Modal open={open} onClose={() => setOpen(false)} title="Keyboard Shortcuts">
      <div className="space-y-4 overflow-y-auto pr-1">
        {Object.entries(sections).map(([context, items]) => (
          <div key={context}>
            <h3 className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2">
              {SHORTCUT_SECTION_LABELS[context] ?? context}
            </h3>
            <div className="space-y-2">
              {items.map(({ keys, description }) => (
                <div key={description} className="flex flex-col gap-2 py-1 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-foreground-secondary">{description}</span>
                  <div className="flex flex-wrap items-center gap-1">
                    {keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}
