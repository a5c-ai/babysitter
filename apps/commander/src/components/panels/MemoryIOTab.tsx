/**
 * Memory I/O tab (SPEC-V4 §V4-9, `inspector-tab-memory`): two ledger
 * sections — Read (pieces obtained via memory_query: record id, kind badge,
 * silo, tick) and Written (memory_update proposals: changes, target silo,
 * phase) — each headed by a mini graph strip (wax-seal nodes + quadratic
 * `<path>` edges, reusing the Archive node visuals; NEVER <line>/<polyline>).
 * Clicking a piece deep-links into the Archive overlay focused on that node
 * (Written pieces focus their target silo's first record). Available for
 * agents AND cards: the attended card's taskId aggregates traffic, an
 * unattached agent falls back to its unitId (memoryRefFor).
 */

import { useStore } from 'zustand';

import {
  firstRecordOfSilo,
  memoryRefFor,
  totalWrittenChanges,
  uniqueReadRecordIds,
  writtenStripKeys,
} from '../../game/memoryIO';
import { kindHue } from '../../game/memoryLayout';
import type { CommanderStore } from '../../game/store';
import type { SimViews } from '../../game/views';

export interface MemoryIOTabProps {
  store: CommanderStore;
  views: SimViews;
  taskId: string | null;
  unitId: string | null;
}

interface StripBead {
  key: string;
  hue: number;
}

/** Mini graph strip: wax-seal beads chained by quadratic <path> edges. */
function MiniGraphStrip({ beads }: { beads: StripBead[] }): React.JSX.Element | null {
  if (beads.length === 0) return null;
  const step = 34;
  const cy = 17;
  const width = beads.length * step + 8;
  return (
    <svg
      className="wr-memio-strip"
      viewBox={`0 0 ${width} 34`}
      style={{ width: `${width}px` }}
      aria-hidden
    >
      <g className="wr-memio-strip-edges">
        {beads.slice(0, -1).map((bead, i) => {
          const x1 = 21 + i * step;
          const x2 = x1 + step;
          return (
            <path
              key={`edge-${bead.key}`}
              className="wr-mem-edge wr-memio-strip-edge"
              d={`M ${x1} ${cy} Q ${(x1 + x2) / 2} ${cy - 10} ${x2} ${cy}`}
              fill="none"
            />
          );
        })}
      </g>
      {beads.map((bead, i) => (
        <g
          key={bead.key}
          className="wr-mem-node wr-memio-strip-node"
          transform={`translate(${21 + i * step} ${cy})`}
          style={{ ['--mem-hue' as string]: String(bead.hue) }}
        >
          <circle className="wr-mem-node-ring" r="8" />
          <circle className="wr-mem-node-dot" r="6.2" />
          <circle className="wr-mem-node-gloss" cx="-1.8" cy="-2.1" r="2" />
        </g>
      ))}
    </svg>
  );
}

export function MemoryIOTab({ store, views, taskId, unitId }: MemoryIOTabProps): React.JSX.Element {
  const silos = useStore(store, (s) => s.board.memory.silos);
  const ref = memoryRefFor(taskId, unitId);
  if (ref === null) {
    return <div className="wr-inspector-body wr-tab-empty">no memory traffic — nothing to inspect</div>;
  }
  const io = views.getMemoryIO(ref);

  const kindByRecord = new Map<string, string>(io.read.map((entry) => [entry.recordId, entry.kind]));
  const readBeads: StripBead[] = uniqueReadRecordIds(io.read).map((id) => ({
    key: id,
    hue: kindHue(kindByRecord.get(id) ?? ''),
  }));
  const writtenBeads: StripBead[] = writtenStripKeys(io.written).map((id) => ({
    key: id,
    hue: kindHue('proposal'),
  }));

  const openArchiveAt = (recordId: string | null): void => {
    store.getState().openArchiveAt(recordId);
  };

  return (
    <div className="wr-inspector-body wr-memio">
      <section className="wr-memio-sec" aria-label="Memory read ledger">
        <h4 className="wr-memio-cap">Read</h4>
        <MiniGraphStrip beads={readBeads} />
        {io.read.length === 0 ? (
          <div className="wr-tab-empty">no pieces obtained yet — the cogitator has not queried</div>
        ) : (
          <ul className="wr-memio-list">
            {io.read.map((entry, i) => (
              <li
                key={`${entry.recordId}-${entry.tick}-${i}`}
                className="wr-memio-piece"
                role="button"
                tabIndex={0}
                title="open in the Archive"
                onClick={() => openArchiveAt(entry.recordId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') openArchiveAt(entry.recordId);
                }}
              >
                {/* literal separators keep the row's textContent tokenized —
                    the AC43 deep-link probe harvests the record id from the
                    row text and must not see the spans run together */}
                <span className="wr-memio-id">{entry.recordId}</span>{' '}
                <span
                  className="wr-memio-kind"
                  style={{ ['--mem-hue' as string]: String(kindHue(entry.kind)) }}
                >
                  {entry.kind}
                </span>{' '}
                <span className="wr-memio-silo">{entry.silo}</span>{' '}
                <span className="wr-memio-tick">t{entry.tick}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="wr-memio-sec" aria-label="Memory written ledger">
        <h4 className="wr-memio-cap">Written</h4>
        <MiniGraphStrip beads={writtenBeads} />
        {io.written.length === 0 ? (
          <div className="wr-tab-empty">no proposals inscribed yet — completion sends updates</div>
        ) : (
          <>
            <div className="wr-memio-meta">
              {totalWrittenChanges(io.written)} proposed changes
            </div>
            <ul className="wr-memio-list">
              {io.written.map((entry, i) => (
                <li
                  key={`${entry.updateId}-${i}`}
                  className="wr-memio-piece"
                  role="button"
                  tabIndex={0}
                  title="open the target silo in the Archive"
                  onClick={() => openArchiveAt(firstRecordOfSilo(silos, entry.silo))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      openArchiveAt(firstRecordOfSilo(silos, entry.silo));
                    }
                  }}
                >
                  <span className="wr-memio-id">{entry.updateId}</span>{' '}
                  <span className="wr-memio-silo">→ {entry.silo}</span>{' '}
                  <span className="wr-memio-phase">{entry.phase}</span>{' '}
                  <span className="wr-memio-changes">{entry.changes.length} changes</span>{' '}
                  <span className="wr-memio-tick">t{entry.tick}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
