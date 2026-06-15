/**
 * Human Review side panel (SPEC-V3 §V3-4, AC30): right slide-over rendered
 * while `meta.reviewTaskId` is set. Header (task title, branch, short sha,
 * test-evidence chip, ahead/behind), the V2-7 changed-file list with inline
 * sepia diff plates (shared WorkspaceView components), reviewer notes, and
 * the approval bar: `Approve All` (review-approve-all) → moveCard approved;
 * `Request Changes` (+feedback) → moveCard do. Esc closes (review slot of
 * the §V3-7 cascade — handled in the store).
 */

import { useEffect, useState } from 'react';
import { useStore } from 'zustand';

import { approveAll, requestChanges } from '../../game/review';
import type { CommanderStore, Orders } from '../../game/store';
import type { SimViews } from '../../game/views';
import { generateIcon } from '../../microagent/mock/iconGen';
import { ChangedFileList, GitStatusHeader } from './WorkspaceView';

export interface ReviewPanelProps {
  store: CommanderStore;
  orders: Orders;
  views: SimViews;
}

export function ReviewPanel({ store, orders, views }: ReviewPanelProps): React.JSX.Element | null {
  const taskId = useStore(store, (s) => s.meta.reviewTaskId);
  const card = useStore(store, (s) => (taskId !== null ? s.board.cards[taskId] : undefined));
  // Re-read sim views every committed tick (deterministic refresh source).
  useStore(store, (s) => s.meta.tickIndex);
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [asking, setAsking] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    // Fresh card under review → reset transient panel state.
    setOpenIndex(null);
    setAsking(false);
    setFeedback('');
  }, [taskId]);

  if (taskId === null || card === undefined) return null;
  const ws = views.getWorkspaceView(taskId);
  if (ws === null) return null;

  const seal = generateIcon({ entityId: taskId, kind: 'task', taskKind: card.view.taskKind });

  return (
    <aside className="wr-review" data-testid="review-panel" aria-label="Human review">
      {/* v5-r0: header = title + seal + actions ONLY — the branch/sha/tests
          status row lives once, in the body's GitStatusHeader (no duplicate).
          v5-r1 (2): the title wraps to at most TWO lines (no truncation) and
          the chip cluster is compressed — Close is icon-only (tooltip carries
          the caption) and the action chips wear tighter padding. */}
      <header className="wr-review-head">
        <span className="wr-review-seal" aria-hidden dangerouslySetInnerHTML={{ __html: seal.svg }} />
        <div className="wr-review-id">
          <div className="wr-review-title" title={card.view.title}>
            {card.view.title}
          </div>
        </div>
        <button
          type="button"
          className="wr-review-btn wr-review-btn--sessions"
          title="Open the Sessions tab for this card (§V5-2)"
          onClick={() => store.getState().openInspectorSessions(taskId)}
        >
          Sessions
        </button>
        <button
          type="button"
          data-testid="review-open-ide"
          className="wr-review-btn wr-review-btn--ide"
          aria-label="Open in IDE"
          onClick={() => store.getState().openIde(taskId)}
        >
          Open in IDE
        </button>
        <button
          type="button"
          className="wr-inspector-close wr-review-close"
          aria-label="Close review panel"
          title="Close review panel"
          onClick={() => store.getState().closeReview()}
        >
          <svg viewBox="0 0 12 12" role="presentation" aria-hidden="true">
            <path
              d="M2.5 2.5 L9.5 9.5 M9.5 2.5 L2.5 9.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </header>
      <div className="wr-review-body">
        <GitStatusHeader ws={ws} />
        {ws.reviewerNotes.length > 0 && (
          <>
            <div className="wr-review-section">REVIEWER NOTES</div>
            <ul className="wr-review-notes">
              {ws.reviewerNotes.map((note, index) => (
                <li key={index} className="wr-review-note">
                  {note}
                </li>
              ))}
            </ul>
          </>
        )}
        {/* v5-r1 (7): the changed-files list + inline diff plates render in
            the MIDDLE region — between REVIEWER NOTES and the action bar. */}
        <div className="wr-review-section">CHANGED FILES</div>
        <ChangedFileList
          files={ws.files}
          openIndex={openIndex}
          onToggle={(index) => setOpenIndex((cur) => (cur === index ? null : index))}
        />
      </div>
      <footer className="wr-review-bar">
        {asking ? (
          <div className="wr-review-feedback">
            <textarea
              className="wr-review-feedback-input"
              placeholder="what must change before approval…"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={2}
            />
            <div className="wr-review-feedback-actions">
              <button
                type="button"
                data-testid="review-request-changes"
                className="wr-review-btn wr-review-btn--reject"
                onClick={() => requestChanges(store, orders, taskId, feedback)}
              >
                Send back to DO
              </button>
              <button type="button" className="wr-review-btn" onClick={() => setAsking(false)}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              data-testid="review-approve-all"
              className="wr-review-btn wr-review-btn--approve"
              onClick={() => approveAll(store, orders, taskId)}
            >
              Approve All
            </button>
            <button
              type="button"
              className="wr-review-btn wr-review-btn--reject"
              onClick={() => setAsking(true)}
            >
              Request Changes
            </button>
          </>
        )}
      </footer>
    </aside>
  );
}
