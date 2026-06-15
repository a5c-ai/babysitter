/**
 * Shared workspace surfaces (SPEC-V2 §V2-7, re-homed by SPEC-V3 §V3-4):
 * git-status header, changed-file list (`ws-file-<index>`) and the sepia
 * parchment diff plate (verdigris additions, garnet deletions, engraved
 * line numbers). One set of components, two hosts — the Inspector
 * Workspace tab and the Human Review side panel — so the plates render
 * byte-identically everywhere.
 */

import clsx from 'clsx';

import { parseDiffRows } from '../../game/diff';
import type { SimWorkspaceFileView, SimWorkspaceView } from '../../backend/mock/simulation';

/** Short sha for header chips (V2-7 gitStatus.headSha). */
export function shortSha(sha: string): string {
  return sha.slice(0, 8);
}

// ---------------------------------------------------------------------------
// Git status header
// ---------------------------------------------------------------------------

export function GitStatusHeader({ ws }: { ws: SimWorkspaceView }): React.JSX.Element {
  const git = ws.gitStatus;
  return (
    <div className="wr-ws-head">
      <span className="wr-ws-branch" title="branch">
        {git.branch}
      </span>
      <span className="wr-ws-sha" title={git.headSha}>
        {shortSha(git.headSha)}
      </span>
      {(git.ahead !== undefined || git.behind !== undefined) && (
        <span className="wr-ws-aheadbehind" title="ahead / behind base">
          {`↑${git.ahead ?? 0} ↓${git.behind ?? 0}`}
        </span>
      )}
      <span className={clsx('wr-ws-evidence', `wr-ws-evidence--${ws.testEvidence.status}`)} title={ws.testEvidence.summary ?? 'test evidence'}>
        tests {ws.testEvidence.status}
      </span>
      {git.dirty ? (
        <span className="wr-ws-dirty" title={`${git.uncommittedCount ?? 0} uncommitted file(s)`}>
          dirty {git.uncommittedCount ?? 0}
        </span>
      ) : (
        <span className="wr-ws-clean">clean</span>
      )}
      <span className="wr-ws-phase">{ws.phase}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Diff plate (sepia parchment, §V2-7/§V3-4)
// ---------------------------------------------------------------------------

export function DiffPlate({ diff }: { diff: string }): React.JSX.Element {
  const rows = parseDiffRows(diff);
  // The scroll region is an inner wrapper so the v4-r0 mask-image fade on
  // row overflow (right edge) never erodes the plate's brass border.
  return (
    <div className="wr-diff-plate">
      <div className="wr-diff-scroll">
        {rows.map((row, index) => (
        <div
          key={index}
          className={clsx(
            'wr-diff-row',
            row.kind === 'add' && 'wr-diff-add',
            row.kind === 'del' && 'wr-diff-del',
            row.kind === 'meta' && 'wr-diff-meta',
          )}
        >
          {/* engraved gutter number lives in CSS content so the row's
              textContent stays pure diff text (terminal `cat` cross-checks
              harvest the addition rows verbatim, AC42/§V4-8) */}
            <span className="wr-diff-num" data-n={index + 1} aria-hidden />
            <span className="wr-diff-marker">{row.marker}</span>
            <span className="wr-diff-text">{row.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Changed-file list (ws-file-<index>) with inline diff plates
// ---------------------------------------------------------------------------

export function ChangedFileList({
  files,
  openIndex,
  onToggle,
}: {
  files: readonly SimWorkspaceFileView[];
  openIndex: number | null;
  onToggle: (index: number) => void;
}): React.JSX.Element {
  if (files.length === 0) {
    return <div className="wr-ws-empty">no workspace changes yet</div>;
  }
  return (
    <div className="wr-ws-files">
      {files.map((file, index) => (
        <div key={file.path} className="wr-ws-fileblock">
          <button
            type="button"
            data-testid={`ws-file-${index}`}
            className={clsx('wr-ws-file', openIndex === index && 'is-open')}
            onClick={() => onToggle(index)}
            title={`${file.path} — click to ${openIndex === index ? 'close' : 'open'} the diff plate`}
          >
            <span className={clsx('wr-ws-status', `wr-ws-status--${file.status}`)}>{file.status}</span>
            <span className="wr-ws-path">{file.path}</span>
            <span className="wr-ws-counts">
              <em className="wr-ws-adds">+{file.additions}</em>
              <em className="wr-ws-dels">-{file.deletions}</em>
            </span>
          </button>
          {openIndex === index && <DiffPlate diff={file.diff} />}
        </div>
      ))}
    </div>
  );
}
