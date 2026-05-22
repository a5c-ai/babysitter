"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function KeyboardShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = React.useState(false);

  React.useEffect(() => {
    let buffer = "";
    let timeout: ReturnType<typeof setTimeout> | null = null;
    const reset = () => {
      buffer = "";
      if (timeout) clearTimeout(timeout);
    };
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (t && t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "?") {
        e.preventDefault();
        setShowHelp((s) => !s);
        return;
      }
      if (e.key === "Escape") {
        setShowHelp(false);
        reset();
        return;
      }
      buffer += e.key;
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(reset, 800);
      if (buffer === "gh") { reset(); router.push("/"); }
      else if (buffer === "gg") { reset(); router.push("/graph"); }
      else if (buffer === "ge") { reset(); router.push("/edges"); }
      else if (buffer === "gs") { reset(); router.push("/search"); }
      else if (buffer.length > 2) reset();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  if (!showHelp) return null;
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={() => setShowHelp(false)}
    >
      <div
        className="rounded-lg shadow-xl p-5 max-w-md w-full text-sm"
        style={{ background: 'var(--ground-ink)', border: '1px solid var(--edge-fade)', color: 'var(--glyph-bone)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold" style={{ color: 'var(--glyph-bone)' }}>Keyboard shortcuts</h2>
          <button
            type="button"
            onClick={() => setShowHelp(false)}
            className="text-xs"
            style={{ color: 'var(--glyph-fade)' }}
          >
            close (Esc)
          </button>
        </div>
        <ul className="space-y-1.5 text-xs">
          {[
            ["/", "Focus search"],
            ["g h", "Home"],
            ["g g", "Graph"],
            ["g e", "EdgeKinds"],
            ["g s", "Search"],
            ["?", "Toggle this help"],
            ["Esc", "Close dialogs"],
          ].map(([k, v]) => (
            <li key={k} className="flex justify-between">
              <kbd className="px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--bg-2)', border: '1px solid var(--rule)' }}>{k}</kbd>
              <span style={{ color: 'var(--glyph-fade)' }}>{v}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
