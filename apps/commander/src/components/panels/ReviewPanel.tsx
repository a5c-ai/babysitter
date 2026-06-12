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
import { ChangedFileList, GitStatusHeader, shortSha } from './WorkspaceView';

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
  const git = ws.gitStatus;

  return (
    <aside className="wr-review" data-testid="review-panel" aria-label="Human review">
      <header className="wr-review-head">
        <span className="wr-review-seal" aria-hidden dangerouslySetInnerHTML={{ __html: seal.svg }} />
        <div className="wr-review-id">
          <div className="wr-review-title">{card.view.title}</div>
          <div className="wr-review-sub">
            <span className="wr-ws-branch">{git.branch}</span>
            <span className="wr-ws-sha" title={git.headSha}>
              {shortSha(git.headSha)}
            </span>
            <span className="wr-ws-aheadbehind">{`↑${git.ahead ?? 0} ↓${git.behind ?? 0}`}</span>
            <span className={`wr-ws-evidence wr-ws-evidence--${ws.testEvidence.status}`} title={ws.testEvidence.summary ?? 'test evidence'}>
              tests {ws.testEvidence.status}
            </span>
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
          className="wr-inspector-close"
          aria-label="Close review panel"
          onClick={() => store.getState().closeReview()}
        >
          CLOSE
        </button>
      </header>
      <div className="wr-review-body">
        <GitStatusHeader ws={ws} />
        <div className="wr-review-section">CHANGED FILES</div>
        <ChangedFileList
          files={ws.files}
          openIndex={openIndex}
          onToggle={(index) => setOpenIndex((cur) => (cur === index ? null : index))}
        />
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
