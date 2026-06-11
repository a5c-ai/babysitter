/**
 * Minimap (SPEC §4/§5): fixed top-right overlay — workspace overview with
 * unit dots (faction-colored; urgent states override to the alert accent),
 * task squares (state-colored), alert/focus pings, the camera viewport rect,
 * click-to-jump (AC7) and drag-to-pan (press, then sweep — the camera
 * follows). DOM-rendered (canvas is allowed here but unnecessary at this
 * entity count).
 */

import { useStore } from 'zustand';
import clsx from 'clsx';

import { WORLD } from '../../game/layout';
import type { CommanderStore } from '../../game/store';
import { factionAccent } from '../../microagent/mock/iconGen';

const MAP_W = 200;
const MAP_H = 110;

/**
 * Camera viewport rect clamps: the rect must read at a glance even when the
 * whole world fits the view (boot zoom) — never thinner than the minimums,
 * never flush with the minimap frame (inset keeps the stroke visible).
 */
const VIEW_MIN_W = 26;
const VIEW_MIN_H = 16;
const VIEW_INSET = 2;

/** Unit states that override the faction dot color with the alert accent. */
const URGENT_DOT_STATES = new Set(['awaiting_approval', 'failed']);

export interface MinimapProps {
  store: CommanderStore;
}

export function Minimap({ store }: MinimapProps): React.JSX.Element {
  const world = useStore(store, (s) => s.world);
  const camera = useStore(store, (s) => s.camera);
  const viewport = useStore(store, (s) => s.meta.viewport);
  const pings = useStore(store, (s) => s.meta.pings);

  const sx = MAP_W / WORLD.width;
  const sy = MAP_H / WORLD.height;

  // Clamp the camera rect into an always-legible sub-rect: minimum size so a
  // zoomed-in sliver still reads, inset so a fits-everything view draws a
  // bright rect just inside the frame instead of vanishing against it.
  const viewW = Math.max(VIEW_MIN_W, Math.min(MAP_W - VIEW_INSET * 2, (viewport.width / camera.zoom) * sx));
  const viewH = Math.max(VIEW_MIN_H, Math.min(MAP_H - VIEW_INSET * 2, (viewport.height / camera.zoom) * sy));
  const viewX = Math.min(Math.max(camera.x * sx - viewW / 2, VIEW_INSET), MAP_W - VIEW_INSET - viewW);
  const viewY = Math.min(Math.max(camera.y * sy - viewH / 2, VIEW_INSET), MAP_H - VIEW_INSET - viewH);

  const jumpTo = (clientX: number, clientY: number, rect: DOMRect): void => {
    const fx = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const fy = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    store.getState().centerOnPoint({ x: fx * WORLD.width, y: fy * WORLD.height });
  };

  // Click-to-jump (AC7) + drag-to-pan: mousedown jumps immediately, then the
  // camera follows the cursor until release. The map's own window-level
  // mousemove handler is inert here (its pointer session never starts).
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    jumpTo(e.clientX, e.clientY, rect);
    const onMove = (ev: MouseEvent): void => jumpTo(ev.clientX, ev.clientY, rect);
    const onUp = (): void => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      data-testid="minimap"
      className="wr-minimap"
      style={{ width: MAP_W, height: MAP_H }}
      onMouseDown={onMouseDown}
      role="button"
      aria-label="Minimap — click to jump, drag to sweep the camera"
    >
      {world.taskIds.map((id) => {
        const pos = world.positions[id];
        if (pos === undefined) return null;
        const task = world.tasks[id];
        return (
          <span
            key={id}
            className={`wr-mini-task wr-mini-task--${task?.view.state ?? 'queued'}`}
            style={{ left: pos.x * sx - 2, top: pos.y * sy - 2 }}
          />
        );
      })}
      {world.unitIds.map((id) => {
        const pos = world.positions[id];
        const unit = world.units[id];
        if (pos === undefined || unit === undefined) return null;
        const state = unit.view.state;
        const urgent = URGENT_DOT_STATES.has(state);
        return (
          <span
            key={id}
            className={clsx(
              'wr-mini-unit',
              state === 'idle' && 'wr-mini-unit--idle',
              urgent && 'wr-mini-unit--urgent',
            )}
            style={{
              left: pos.x * sx - 1.5,
              top: pos.y * sy - 1.5,
              backgroundColor: urgent ? 'var(--color-status-alert)' : factionAccent(unit.view.agent),
            }}
          />
        );
      })}
      {pings.map((ping) => (
        <span
          key={ping.id}
          className={clsx('wr-mini-ping', ping.tone === 'info' && 'wr-mini-ping--info')}
          style={{ left: ping.x * sx - 4, top: ping.y * sy - 4 }}
        />
      ))}
      <div
        className="wr-mini-view"
        style={{ left: viewX, top: viewY, width: viewW, height: viewH }}
        aria-hidden
      />
    </div>
  );
}
