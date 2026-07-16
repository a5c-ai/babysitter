"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Kbd } from "./kbd";
import { X } from "lucide-react";
import { useKeyboard } from "@/hooks/use-keyboard";

interface ShortcutEntry {
  keys: string[];
  description: string;
  context: "global" | "dashboard" | "run-detail";
}

const shortcuts: ShortcutEntry[] = [
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
];

const sectionLabels: Record<string, string> = {
  "global": "Global",
  "dashboard": "Dashboard",
  "run-detail": "Run Detail",
};

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const isRunDetail = pathname?.startsWith("/runs/") ?? false;

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
  const visibleShortcuts = shortcuts.filter((s) => {
    if (s.context === "global") return true;
    if (s.context === "dashboard" && !isRunDetail) return true;
    if (s.context === "run-detail" && isRunDetail) return true;
    return false;
  });

  // Group by context for display
  const sections = visibleShortcuts.reduce<Record<string, ShortcutEntry[]>>((acc, s) => {
    (acc[s.context] ??= []).push(s);
    return acc;
  }, {});

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-bg)] backdrop-blur-xl p-6 shadow-glass w-full max-w-md"
        >
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-sm font-medium text-foreground">Keyboard Shortcuts</Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="rounded-md p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-foreground-muted hover:text-primary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>
          <div className="space-y-4">
            {Object.entries(sections).map(([context, items]) => (
              <div key={context}>
                <h3 className="text-xs font-medium text-foreground-muted uppercase tracking-wider mb-2">
                  {sectionLabels[context] ?? context}
                </h3>
                <div className="space-y-2">
                  {items.map(({ keys, description }) => (
                    <div key={description} className="flex items-center justify-between py-1">
                      <span className="text-sm text-foreground-secondary">{description}</span>
                      <div className="flex items-center gap-1">
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
