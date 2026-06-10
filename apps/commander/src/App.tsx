/**
 * A5C Commander — root application shell.
 *
 * SCAFFOLD phase: renders a minimal placeholder war-room shell only.
 * The real war room (map viewport + HUD chrome, SPEC §4) replaces this
 * in later phases via <WarRoom />.
 */
export default function App() {
  return (
    <div
      data-testid="app-shell"
      className="relative flex h-dvh w-screen items-center justify-center overflow-hidden bg-deck-900 text-hud-text"
    >
      {/* map-floor grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--color-grid-line)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-grid-line)_1px,transparent_1px)] bg-[size:48px_48px] opacity-60"
      />
      {/* vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(3,5,9,0.85)_100%)]"
      />
      {/* scanline/noise overlay (≤4% opacity per SPEC §10) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(255,255,255,0.04)_0px,rgba(255,255,255,0.04)_1px,transparent_1px,transparent_3px)] opacity-[0.04]"
      />

      {/* placeholder wordmark panel */}
      <div className="relative flex flex-col items-center gap-3 rounded-xl border border-glass-border bg-deck-800/55 px-12 py-10 backdrop-blur-md">
        <h1 className="text-3xl font-semibold tracking-[0.35em] text-hud-text">
          A5C&nbsp;COMMANDER
        </h1>
        <p className="font-mono-hud text-xs uppercase tracking-[0.25em] text-hud-dim">
          command deck initializing
        </p>
        <div className="mt-2 flex items-center gap-2" aria-hidden>
          <span className="h-1.5 w-1.5 rounded-full bg-faction-claude shadow-[0_0_6px_var(--color-faction-claude)]" />
          <span className="h-1.5 w-1.5 rounded-full bg-faction-codex shadow-[0_0_6px_var(--color-faction-codex)]" />
          <span className="h-1.5 w-1.5 rounded-full bg-faction-gemini shadow-[0_0_6px_var(--color-faction-gemini)]" />
          <span className="h-1.5 w-1.5 rounded-full bg-faction-pi shadow-[0_0_6px_var(--color-faction-pi)]" />
        </div>
      </div>
    </div>
  );
}
