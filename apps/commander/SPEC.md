# A5C Commander — RTS Command Deck for AI Agent Fleets

**Package:** `apps/commander` (standalone Vite app; intentionally NOT in root npm workspaces — see §11)
**Status:** v1 — fully mocked backend, real contracts. The mock is swapped for `@a5c-ai/adapters-gateway` later by replacing one transport class.

---

## 1. Vision

A real-time-strategy-style web interface for commanding fleets of AI agents. Agent sessions are
**units** on a living battlefield; tasks are **objectives** they capture. The operator selects
units with click/marquee, issues orders by right-clicking objectives, reads the fleet's pulse
from a HUD (top resource bar, minimap, event ticker, selection panel, contextual command card),
and answers approval requests like incoming-attack alerts. It must feel like a polished game —
StarCraft-grade interaction grammar — while being a genuinely usable orchestration console:
every game metaphor maps 1:1 to a real orchestration concept, and every command maps to a real
gateway protocol frame.

This is an orchestration component of the orchestration layer. Usability goal: an operator can
answer "what is my fleet doing, what needs me, and how do I redirect it" in under 5 seconds.

## 2. Integration trajectory (why contracts matter)

v1 ships with an in-memory deterministic simulation. The contracts in `src/contracts/` MUST
mirror the real ones so v2 swaps the backend without touching UI code:

- **Adapter events** mirror `@a5c-ai/comm-adapter` (`packages/adapters/core/src/events.ts`, `session-types.ts` in the babysitter repo)
- **Gateway protocol** mirrors `@a5c-ai/adapters-gateway` WS protocol v1 (`packages/adapters/gateway/src/protocol/v1.ts`) and its REST surface (`gateway/src/server.ts`)
- **Resource model** mirrors kradle CRDs (`packages/kradle/core/docs/agents/crd-schema-spec.md`)

Source-of-truth copies of these files exist in the sibling checkout at
`C:\Users\tmusk\IdeaProjects\babysitter\packages\adapters\` and `...\packages\kradle\` (staging
branch). Mirror the shapes faithfully; do not invent fields that conflict. UI-only metadata
(world positions, icon specs) lives OUTSIDE the mirrored types, keyed by entity id.

## 3. RTS domain mapping

| RTS concept | Orchestration concept | Backing contract |
|---|---|---|
| Unit | Agent session (live or idle) | `SessionEntry` + `RunEntry` (gateway) |
| Unit class/faction | Agent adapter (claude-code, codex, gemini-cli, cursor, pi…) | `agent: AgentName` |
| Unit health bar | Context window usage % | `SessionMessage.tokenUsage` aggregate |
| Unit energy/mana | Token budget remaining (cost) | `cost: CostRecord` |
| Unit XP / rank chevrons | Turn count | `turnCount` |
| Objective (map node) | Task / dispatch (kradle `AgentDispatchRun`-shaped) | `CommanderTask` |
| Issuing a move/attack order | Dispatching session to task (`session.start` / `session.message`) | `ClientFrame` |
| Unit "under attack" alert | Approval / hook request pending | `hook.request` frame |
| Fog-free minimap | Workspace overview | client-side layout |
| Resources (top bar) | active units, busy units, tokens burned, tasks done/total, pending alerts | derived |
| Control groups (Ctrl+1-9) | Saved selections | UI state |
| Game clock | Sim time | sim state |

**Unit visual states** (drive sprite ring color + animation):
`idle` (soft pulse) · `dispatching` (moving toward objective) · `thinking` (animated shimmer) ·
`tool_running` (gear/spinner motif) · `awaiting_approval` (urgent pulsing ring + minimap ping) ·
`blocked` (dim, warning badge) · `completed` (brief celebratory flare, then idle) · `failed` (red flicker, persists until inspected).

**Task states:** `queued → assigned → in_progress → review → done | failed` (progress ring on node).

## 4. Screen & HUD layout

Single full-viewport screen (no routing). Dark command-deck theme.

```
┌──────────────────────────────────────────────────────────────┐
│ TopBar: logo · resources (units/busy · tokens · tasks · ⚠) · clock │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                   MAP VIEWPORT (pan/zoom world)              │
│     · task nodes (structures) with progress rings           │
│     · unit sprites w/ portraits, health/energy bars         │
│     · SVG link layer: unit↔assigned task lines              │
│     · marquee selection rectangle                           │
│   AlertBanner (top-center, when approvals pending)          │
│                                                              │
├──────────────┬───────────────────────────┬───────────────────┤
│ EventTicker  │  SelectionPanel           │  CommandCard      │
│ (bottom-left │  (single: portrait+vitals │  (3x4 grid of     │
│  stream,     │   multi: unit card grid   │   contextual      │
│  clickable)  │   task: details+assignees)│   commands)       │
└──────────────┴───────────────────────────┴───────────────────┘
  Minimap: fixed top-right overlay on map (viewport rect, pings, click-to-jump)
  Inspector: right slide-over panel (session transcript stream) — toggled via command card "Inspect" or double-click
```

All HUD chrome floats over the map (glass panels). Map fills the viewport.

## 5. Interaction grammar (must all work)

- **Left-click** unit/task: select (clears previous). **Shift+click**: add/remove from selection.
- **Drag on empty map**: marquee select units inside rect.
- **Right-click task node** with ≥1 unit selected: dispatch order — units animate toward node, become `dispatching` then `thinking`; ticker logs it; link lines appear.
- **Right-click empty ground** with units selected: rally/move (reposition idle units).
- **Double-click unit**: open Inspector for it.
- **Command card**: 3x4 grid, populated by the microagent for current selection (see §8). Keyboard hotkeys Q/W/E/R/A/S/D/F/Z/X/C/V map to grid cells (show hint letter in cell corner).
- **Ctrl+1..9**: assign control group; **1..9** recall; recalling an already-active group centers camera on it.
- **Camera**: WASD/arrow pan, mouse-wheel zoom (toward cursor), middle-drag or space-drag pan, minimap click jump. Edge-of-screen pan NOT required (browser-hostile).
- **Esc**: close inspector → clear selection (in that order).
- **Space**: jump camera to most recent alert (approval/failure).
- **F**: cycle through idle units.
- Approve/Deny on `awaiting_approval` units via command card; also inline buttons on the AlertBanner.

## 6. Entity model & state

Zustand store (single store, slices):

- `world`: `Map<entityId, UnitEntity | TaskEntity>` + positions `{x,y}` (world coords), seeded layout.
- `selection`: ordered `entityId[]`, control groups `Record<digit, entityId[]>`.
- `camera`: `{x, y, zoom}` with clamped bounds.
- `events`: ring buffer (≤500) of ticker entries `{id, ts, severity, text, entityId?}`.
- `alerts`: pending approvals `{hookRequestId, runId, unitId, kind, payload, deadlineTs}`.
- `meta`: resources snapshot, sim clock, connection status.

`UnitEntity` wraps mirrored `SessionEntry` + live run state + derived visual state + `iconSpec`.
`TaskEntity` wraps `CommanderTask` (kradle `AgentDispatchRun`-shaped: `taskKind`, `repository`,
`agentStack`, `status.phase`, `sourceRefs`) + progress 0..1 + `iconSpec`.

One store update per sim tick (batch all entity changes) — no per-event re-renders.

## 7. Backend abstraction & mock simulation

```ts
// src/backend/types.ts
export interface CommanderBackend {
  connect(): Promise<void>;
  disconnect(): void;
  send(frame: ClientFrame): void;                       // commands go in as protocol frames
  onFrame(cb: (frame: ServerFrame) => void): () => void; // events come out as protocol frames
  listAgents(): Promise<AgentSummary[]>;     // GET /api/v1/agents
  listSessions(): Promise<SessionEntry[]>;   // GET /api/v1/sessions
  listRuns(): Promise<RunEntry[]>;           // GET /api/v1/runs
  listTasks(): Promise<CommanderTask[]>;     // kradle AgentDispatchRun list (mock-local for v1)
}
```

**MockBackend** (`src/backend/mock/`): seeded (mulberry32 or similar PRNG; seed from `?seed=`
URL param, default 42), tick-driven (250ms). Spawns 10–16 units across ≥4 adapters
(claude-code, codex, gemini-cli, pi) and 6–10 tasks across 2–3 workspaces. Each tick advances
unit lifecycles probabilistically-but-deterministically: idle→dispatch→thinking→tool_running→…,
emits `ServerFrame`s: `run.event` frames whose `event` payloads are mirrored adapter events
(`session_start`, `turn_start`, `text_delta`, `tool_call_start`, `tool_result`, `turn_end`,
`session_end`, `error`…), occasional `hook.request` frames (approval scenarios: "wants to run
`git push`", "wants to edit 14 files"), task progress, completions/failures, accumulating
token usage + cost. Commands sent via `send()` MUST affect the sim (dispatch assigns unit to
task; abort stops run; `hook.decision` resolves the approval and unblocks/blocks the unit).
Sim must be pausable and single-steppable (for tests). Same seed + same command sequence ⇒
identical state (unit-tested).

## 8. Microagent (contextual commands & icons)

```ts
// src/microagent/types.ts
export interface Microagent {
  generateCommands(ctx: CommandContext): CommandSpec[];   // sync in mock; Promise-able later
  generateIcon(ctx: IconContext): IconSpec;               // deterministic per entity
}
export interface CommandContext {
  selection: SelectionSummary;        // kinds, states, adapters, count
  alerts: AlertSummary[];
  fleet: FleetSnapshot;               // idle counts etc.
}
export interface CommandSpec {
  id: string; label: string; hotkey?: string;
  icon: IconSpec; intent: CommandIntent;   // maps to ClientFrame or UI action
  enabled: boolean; tooltip: string; severity?: 'normal'|'danger'|'urgent';
}
export type IconSpec = { svg: string; palette: string[] };  // inline SVG markup
```

**Mock microagent:** rule-based `generateCommands` (selection state → command set; mixed
selections get the intersection; always ≤12). Procedural `generateIcon`: hash entity id →
friendly geometric avatar (rounded body shape + two eyes + accent crest; palette keyed by
adapter for units, by taskKind glyph badge for tasks). Friendly and cute against the dark HUD —
think "tamagotchi war room". Same id ⇒ byte-identical SVG (unit-tested). Later this interface
is implemented by a real LLM microagent generating richer commands/images; the UI must not care.

Command intents v1 (all must do something visible via sim):
unit-idle: `Dispatch…` (enters target-pick mode), `Rally`, `Clone`, `Retire`;
unit-working: `Steer…` (prompt input modal → `session.message`), `Pause`, `Inspect`, `Abort`;
unit-awaiting_approval: `Approve`, `Deny`, `Inspect`;
task: `Assign Best Idle`, `Prioritize`, `Cancel`;
global (empty selection): `Select All Idle`, `Jump to Alert`, `Pause Sim`/`Resume Sim`.

## 9. Test hooks API (required for stable e2e)

In dev/test builds expose `window.__commander = { sim: { pause(), resume(), tick(n), seed },
store, version }`. E2E tests drive determinism via `?seed=…` + `sim.pause()/tick(n)`. All
interactive elements carry `data-testid` (`unit-<id>`, `task-<id>`, `cmd-<commandId>`,
`minimap`, `ticker-item`, `selection-panel`, `alert-banner`, `topbar-*`, `inspector`).

## 10. Visual direction

Dark sci-fi command deck: near-black blue-charcoal base (#0a0e14 family), glass panels
(translucent, 1px luminous borders, backdrop-blur), one restrained accent per adapter faction
(cyan/magenta/amber/green family), subtle grid + vignette on the map floor, soft glow on
selection rings, smooth CSS transitions (no animation lib). Friendly rounded procedural
portraits pop against the dark chrome. Subtle scanline/noise overlay at ≤4% opacity. Typeface:
system stack + a single mono accent for numbers. No emoji in UI chrome. Motion: units glide
with ease-out; pings expand-and-fade; ticker items slide in. It should screenshot like a AAA
strategy game pause screen, and remain legible at a glance.

## 11. Tech stack & layout (fixed — do not add dependencies beyond this list)

Vite 7 + React 19 + TypeScript (strict) + Zustand + Tailwind CSS v4 (`@tailwindcss/vite`) +
clsx. Tests: Vitest (unit) + @playwright/test (e2e, chromium only, `webServer` auto-start on
port **5199**). DOM/SVG rendering (CSS transforms for world layer; canvas allowed ONLY for
minimap). No router, no PixiJS, no framer-motion, no icon libs (icons are procedural).

```
apps/commander/
  package.json  vite.config.ts  tsconfig.json  index.html  playwright.config.ts  SPEC.md  README.md
  src/
    contracts/{adapter-events.ts, gateway-protocol.ts, kradle-resources.ts, index.ts}
    backend/{types.ts, mock/{prng.ts, scenario.ts, simulation.ts, mockBackend.ts}}
    microagent/{types.ts, mock/{commandGen.ts, iconGen.ts}}
    game/{store.ts, selectors.ts, input.ts, camera.ts, layout.ts}
    components/
      WarRoom.tsx
      map/{MapViewport.tsx, UnitSprite.tsx, TaskNode.tsx, LinkLayer.tsx, SelectionBox.tsx, PingLayer.tsx}
      hud/{TopBar.tsx, Minimap.tsx, SelectionPanel.tsx, CommandCard.tsx, EventTicker.tsx, AlertBanner.tsx}
      panels/{Inspector.tsx, SteerModal.tsx}
    App.tsx  main.tsx  styles.css
  src/**/__tests__/*.test.ts(x)
  e2e/*.spec.ts
```

**Workspace note:** root `package.json` workspaces glob is `packages/*`; this app deliberately
lives in `apps/` with its own `package-lock.json` so root `npm ci` stays untouched. Run all npm
commands from `apps/commander/`. Never run `npm install` at the repo root.

## 12. Acceptance criteria (each must be e2e-verifiable)

AC1. `/?seed=42` boots to the war room: ≥10 unit sprites, ≥6 task nodes, top bar counters non-zero, no console errors.
AC2. Clicking a unit selects it: selection ring visible, SelectionPanel shows portrait/name/adapter/model/state/vitals, CommandCard fills with contextual commands.
AC3. Marquee drag selects multiple units; SelectionPanel shows card grid; CommandCard shows intersection commands.
AC4. With an idle unit selected, right-click a task node: dispatch — unit's state leaves `idle`, a link line renders, ticker logs the order, task gains an assignee.
AC5. `Abort` on a working unit returns it to `idle` and logs the event.
AC6. When a `hook.request` fires: AlertBanner appears, minimap shows a ping, ⚠ counter increments; clicking `Approve` resolves it (banner clears, unit resumes).
AC7. Minimap click recenters the camera (viewport rect moves; world transform changes).
AC8. Ctrl+1 stores the selection; pressing 1 after deselecting recalls it.
AC9. Wheel zoom and keyboard pan change the camera; zoom is clamped.
AC10. EventTicker streams items during sim run; clicking an item with an entity selects + centers that entity.
AC11. Inspector (double-click a working unit) shows a growing message/tool-call transcript.
AC12. Procedural icons: every unit/task renders an inline SVG portrait; reloading with the same seed renders identical icons (compare two `unit-*` icon outerHTML across reloads).
AC13. Determinism: with sim paused, `tick(20)` twice from the same seed yields identical store snapshots (unit test) and stable UI (e2e smoke).
AC14. Top bar tokens-burned counter increases over sim time; tasks done/total updates on completion.

## 13. E2E scenarios

One spec file per AC cluster: `boot.spec.ts` (AC1, AC12, AC14), `selection.spec.ts` (AC2, AC3, AC8),
`commands.spec.ts` (AC4, AC5, microagent card contents), `alerts.spec.ts` (AC6, space-jump),
`camera.spec.ts` (AC7, AC9), `stream.spec.ts` (AC10, AC11). Use `?seed=42`, pause sim on load,
advance with `tick(n)` — no timing-based waits other than UI settle.

## 14. Performance & a11y

60fps target with 50 units: transform-only animations, `will-change` on world layer, single
store commit per tick, memoized sprites (`React.memo`, equality on visual-state hash). Ticker
virtualized to last 50 visible. Keyboard-only operation must be possible for core flow
(select-all-idle → dispatch via hotkeys). Focus outlines visible; HUD contrast ≥ WCAG AA for text.

## 15. Non-goals (v1)

No real gateway/WS connection, no auth, no persistence, no multi-operator, no mobile layout
(min width 1100px; show a friendly "command deck requires a wider console" gate below that),
no sound, no routing, no i18n.
