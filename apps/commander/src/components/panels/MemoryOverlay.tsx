/**
 * The Archive overlay (SPEC-V2 §V2-3, AC17/AC18): full-screen parchment plate
 * over the board. Silo cards along the left edge, a deterministic radial SVG
 * graph of the unified memory graph (nodes colored by nodeKind, edges drawn
 * as `<path>` curves — NEVER <line>/<polyline>), nodeKind filter chips, a
 * node attributes card on click, live transfer pulses on memory events, and
 * held-piece highlighting for a selected agent. Opened via M / topbar-memory;
 * Esc closes (top of the cascade alongside the Foundry).
 *
 * Testids: memory-overlay, memory-silo-<name>, memory-node-<id> (':' → '-'),
 * memory-filter-<kind>.
 */

import { useMemo, useState } from 'react';
import { useStore } from 'zustand';
import clsx from 'clsx';

import {
  computeMemoryLayout,
  MEMORY_VIEW,
  sanitizeNodeId,
} from '../../game/memoryLayout';
import type { CommanderStore } from '../../game/store';
import type { GraphRecord } from '../../contracts/kradle-memory';

export interface MemoryOverlayProps {
  store: CommanderStore;
}

/**
 * nodeKind → stable hue (deterministic), quantized to the four faction
 * stained-glass tints (§V2-1): verdigris teal · garnet · amber · peridot.
 * Nodes read as brass-ringed wax seals in jewel glass, not generic d3 dots.
 */
const GLASS_HUES: readonly number[] = [168, 352, 42, 75];

function kindHue(kind: string): number {
  let h = 0;
  for (let i = 0; i < kind.length; i += 1) {
    h = (h * 31 + kind.charCodeAt(i)) >>> 0;
  }
  return GLASS_HUES[h % GLASS_HUES.length] ?? 42;
}

export function MemoryOverlay({ store }: MemoryOverlayProps): React.JSX.Element | null {
  const open = useStore(store, (s) => s.meta.archiveOpen);
  const memory = useStore(store, (s) => s.board.memory);
  const agents = useStore(store, (s) => s.board.agents);
  const selectionIds = useStore(store, (s) => s.selection.ids);
  const pulses = useStore(store, (s) => s.meta.memoryPulses);
  const heldByCard = useStore(store, (s) => s.board.heldByCard);
  const [filter, setFilter] = useState<string | null>(null);
  const [focusId, setFocusId] = useState<string | null>(null);

  const layout = useMemo(() => computeMemoryLayout(memory.records), [memory.records]);

  if (!open) return null;

  const recordById = new Map<string, GraphRecord>(memory.records.map((r) => [r.id, r]));
  const focus = focusId !== null ? recordById.get(focusId) : undefined;

  // Held-piece highlighting (§V2-3): selected agents' live held pieces plus
  // the accumulated held set of selected cards (survives worker despawn).
  const heldSet = new Set<string>();
  let hasFocusEntity = false;
  for (const id of selectionIds) {
    const agent = agents[id];
    if (agent !== undefined) {
      hasFocusEntity = true;
      for (const piece of agent.heldPieces) heldSet.add(piece);
    }
    const cardHeld = heldByCard[id];
    if (cardHeld !== undefined) {
      hasFocusEntity = true;
      for (const piece of cardHeld) heldSet.add(piece);
    }
  }

  // Live pulse targets: records named by recent memory_query events.
  const pulsedRecords = new Set(pulses.flatMap((p) => p.recordIds));
  const pulsedSilos = new Set(pulses.map((p) => p.silo));

  return (
    <div className="wr-overlay-backdrop" data-testid="memory-overlay">
      <div className="wr-memory" role="dialog" aria-label="The Archive — Company Brain">
        <header className="wr-memory-head">
          <span className="wr-panel-title">THE ARCHIVE — COMPANY BRAIN</span>
          <span className="wr-memory-filters">
            <button
              type="button"
              className={clsx('wr-mem-chip', filter === null && 'is-active')}
              onClick={() => setFilter(null)}
            >
              all
            </button>
            {layout.kinds.map((kind) => (
              <button
                key={kind}
                type="button"
                data-testid={`memory-filter-${kind}`}
                className={clsx('wr-mem-chip', filter === kind && 'is-active')}
                style={{ ['--mem-hue' as string]: String(kindHue(kind)) }}
                onClick={() => setFilter(filter === kind ? null : kind)}
              >
                {kind}
              </button>
            ))}
          </span>
          <button type="button" className="wr-inspector-close" onClick={() => store.getState().closeArchive()}>
            CLOSE
          </button>
        </header>

        <div className="wr-memory-body">
          <aside className="wr-memory-silos">
            {memory.silos.map((silo) => (
              <div
                key={silo.name}
                data-testid={`memory-silo-${silo.name}`}
                className={clsx('wr-mem-silo', pulsedSilos.has(silo.name) && 'is-pulsing')}
              >
                <div className="wr-mem-silo-name">{silo.name}</div>
                <div className="wr-mem-silo-meta">
                  <span className="wr-mem-silo-phase">{silo.phase}</span>
                  <span className="wr-mem-silo-sha">{silo.currentCommit.slice(0, 7)}</span>
                </div>
                <div className="wr-mem-silo-meta">
                  <span>{silo.recordCount} records</span>
                  <span>{silo.owner}</span>
                </div>
                {pulsedSilos.has(silo.name) && <span className="wr-mem-pulse memory-pulse" aria-hidden />}
              </div>
            ))}
          </aside>

          <div className="wr-memory-plate">
            <svg
              className="wr-memory-graph"
              viewBox={`0 0 ${MEMORY_VIEW.width} ${MEMORY_VIEW.height}`}
              role="img"
              aria-label="Unified memory graph"
            >
              <g className="wr-mem-edges">
                {layout.edges.map((edge) => (
                  <path key={edge.key} className="wr-mem-edge" d={edge.d} fill="none" />
                ))}
              </g>
              <g className="wr-mem-nodes">
                {layout.nodes.map((node) => {
                  const hidden = filter !== null && node.nodeKind !== filter;
                  if (hidden) return null;
                  const held = heldSet.has(node.id);
                  const pulsed = pulsedRecords.has(node.id);
                  return (
                    <g
                      key={node.id}
                      data-testid={`memory-node-${sanitizeNodeId(node.id)}`}
                      className={clsx(
                        'wr-mem-node',
                        held && 'is-held',
                        hasFocusEntity && heldSet.size > 0 && !held && 'is-dimmed',
                        pulsed && 'is-pulsing',
                        focusId === node.id && 'is-focused',
                      )}
                      transform={`translate(${node.x} ${node.y})`}
                      style={{ ['--mem-hue' as string]: String(kindHue(node.nodeKind)) }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setFocusId(node.id === focusId ? null : node.id);
                      }}
                    >
                      <circle className="wr-mem-node-ring" r="11.5" />
                      <circle className="wr-mem-node-dot" r="9" />
                      <circle className="wr-mem-node-gloss" cx="-2.5" cy="-3" r="3" />
                      {pulsed && <circle className="wr-mem-node-pulse memory-pulse" r="9" />}
                      <text className="wr-mem-node-label" y="22" textAnchor="middle">
                        {node.id.split(':').pop()}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>

            {focus !== undefined && (
              <div className="wr-mem-card" data-testid="memory-node-card">
                <div className="wr-mem-card-title">{focus.attributes.title}</div>
                <div className="wr-mem-card-row">
                  <span className="wr-mem-card-kind">{focus.nodeKind}</span>
                  <span className={`wr-mem-card-status wr-mem-card-status--${focus.attributes.status}`}>
                    {focus.attributes.status}
                  </span>
                </div>
                <div className="wr-mem-card-row">
                  owners: {focus.attributes.owners.join(', ') || '—'}
                </div>
                {focus.attributes.tags !== undefined && focus.attributes.tags.length > 0 && (
                  <div className="wr-mem-card-row">tags: {focus.attributes.tags.join(', ')}</div>
                )}
                {focus.attributes.summary !== undefined && (
                  <div className="wr-mem-card-summary">{focus.attributes.summary}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
