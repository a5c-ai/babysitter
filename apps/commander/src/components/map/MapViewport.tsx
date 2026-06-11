/**
 * MapViewport (SPEC §4/§5): the pan/zoom world. A single CSS transform
 * (translate + scale from the §6 camera) positions the world layer; the grid
 * floor lives on the world layer (so it pans/zooms), the vignette +
 * scanline overlays live in screen space. Hosts the link layer, task nodes,
 * unit sprites, ping layer and the marquee selection box.
 *
 * All mouse interaction attaches here via `attachInput` (event delegation
 * over `data-entity-id` sprites — SPEC §5 grammar).
 */

import { useEffect, useRef } from 'react';
import { useStore } from 'zustand';

import { attachInput } from '../../game/input';
import { WORLD } from '../../game/layout';
import type { CommanderStore, Orders } from '../../game/store';
import { generateIcon } from '../../microagent/mock/iconGen';
import { LinkLayer } from './LinkLayer';
import { PingLayer } from './PingLayer';
import { SelectionBox } from './SelectionBox';
import { TaskNode } from './TaskNode';
import { UnitSprite } from './UnitSprite';

export interface MapViewportProps {
  store: CommanderStore;
  orders: Orders;
}

function UnitSlot({ store, id }: { store: CommanderStore; id: string }): React.JSX.Element | null {
  const unit = useStore(store, (s) => s.world.units[id]);
  const pos = useStore(store, (s) => s.world.positions[id]);
  const selected = useStore(store, (s) => s.selection.ids.includes(id));
  if (unit === undefined || pos === undefined) return null;
  const icon = generateIcon({ entityId: id, kind: 'unit', adapter: unit.view.agent });
  return (
    <UnitSprite
      id={id}
      title={unit.view.title}
      agent={unit.view.agent}
      state={unit.view.state}
      paused={unit.view.paused}
      x={pos.x}
      y={pos.y}
      selected={selected}
      healthPct={1 - unit.contextPct}
      energyPct={unit.energyPct}
      turnCount={unit.view.turnCount}
      iconSvg={icon.svg}
    />
  );
}

function TaskSlot({ store, id }: { store: CommanderStore; id: string }): React.JSX.Element | null {
  const task = useStore(store, (s) => s.world.tasks[id]);
  const pos = useStore(store, (s) => s.world.positions[id]);
  const selected = useStore(store, (s) => s.selection.ids.includes(id));
  if (task === undefined || pos === undefined) return null;
  const icon = generateIcon({ entityId: id, kind: 'task', taskKind: task.view.taskKind });
  return (
    <TaskNode
      id={id}
      title={task.view.title}
      taskKind={task.view.taskKind}
      state={task.view.state}
      progress={task.view.progress}
      priority={task.view.priority}
      x={pos.x}
      y={pos.y}
      selected={selected}
      assigneeCount={task.view.assigneeIds.length}
      iconSvg={icon.svg}
    />
  );
}

export function MapViewport({ store, orders }: MapViewportProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement | null>(null);
  const camera = useStore(store, (s) => s.camera);
  const viewport = useStore(store, (s) => s.meta.viewport);
  const unitIds = useStore(store, (s) => s.world.unitIds);
  const taskIds = useStore(store, (s) => s.world.taskIds);
  const targeting = useStore(store, (s) => s.meta.targeting);

  useEffect(() => {
    const element = ref.current;
    if (element === null) return;
    return attachInput({ store, orders, element });
  }, [store, orders]);

  useEffect(() => {
    const element = ref.current;
    if (element === null) return;
    const measure = (): void => {
      const rect = element.getBoundingClientRect();
      store.getState().setViewport({ width: rect.width, height: rect.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [store]);

  const tx = viewport.width / 2 - camera.x * camera.zoom;
  const ty = viewport.height / 2 - camera.y * camera.zoom;

  // Counter-scale for unit/task labels: at low zoom the world layer scale
  // would render 10px labels at ~6px on screen — divide the font size by the
  // zoom (capped) so labels stay legible without re-rendering the memoized
  // sprites (consumed via CSS var in .wr-unit-label / .wr-task-label).
  const labelScale = Math.min(1.7, Math.max(1, 1 / camera.zoom));

  return (
    <div
      ref={ref}
      data-testid="map-viewport"
      className={`wr-map${targeting !== null ? ' is-targeting' : ''}`}
    >
      <div
        className="wr-world"
        style={
          {
            width: WORLD.width,
            height: WORLD.height,
            transform: `translate3d(${tx}px, ${ty}px, 0) scale(${camera.zoom})`,
            '--wr-label-scale': labelScale,
          } as React.CSSProperties
        }
      >
        <div className="wr-floor" aria-hidden />
        <LinkLayer store={store} />
        {taskIds.map((id) => (
          <TaskSlot key={id} store={store} id={id} />
        ))}
        {unitIds.map((id) => (
          <UnitSlot key={id} store={store} id={id} />
        ))}
        <PingLayer store={store} />
      </div>
      <div className="wr-vignette" aria-hidden />
      <div className="wr-scanlines" aria-hidden />
      <SelectionBox store={store} />
    </div>
  );
}
