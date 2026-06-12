/**
 * Inquiry Dock (SPEC-V3 §V3-5, AC32): bottom-left chat-like stack of
 * inquiry bubbles, replacing the v1 AlertBanner role. Newest first, at most
 * three visible (+N more chip). Each bubble: agent portrait chip, serif
 * question, and an AskUserQuestion-style option row — every option renders
 * its microagent-generated engraved-brass icon ABOVE a short caption
 * (`inquiry-opt-<hookRequestId>-<optionId>`), garnet-tinted when
 * tone=danger, brass-glow when tone=primary. Choosing an option posts
 * `hook.decision` + optionId via `orders.answerInquiry`; the bubble resolves
 * with a brief wax-stamp animation (a ghost WITHOUT the inquiry testid)
 * then archives. Space pulses the dock (scroll into view + highlight).
 */

import { useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import clsx from 'clsx';

import { dockView } from '../../game/inquiries';
import type { CommanderStore, Orders } from '../../game/store';
import type { SimInquiryOption, SimInquiryView } from '../../backend/mock/simulation';
import { generateIcon } from '../../microagent/mock/iconGen';
import { generateOptionIcon } from '../../microagent/mock/optionIconGen';

const STAMP_MS = 650;
const PULSE_MS = 900;

export interface ChatDockProps {
  store: CommanderStore;
  orders: Orders;
}

/** Option button row — shared look for dock bubbles (icon ABOVE caption). */
export function InquiryOptionRow({
  inquiry,
  onChoose,
  withTestIds,
}: {
  inquiry: SimInquiryView;
  onChoose: (option: SimInquiryOption) => void;
  withTestIds: boolean;
}): React.JSX.Element {
  return (
    <div className="wr-inq-options" role="group" aria-label="Inquiry options">
      {inquiry.options.map((option) => {
        const icon = generateOptionIcon(option);
        return (
          <button
            key={option.id}
            type="button"
            {...(withTestIds
              ? { 'data-testid': `inquiry-opt-${inquiry.hookRequestId}-${option.id}` }
              : {})}
            className={clsx(
              'wr-inq-opt',
              option.tone === 'danger' && 'wr-inq-opt--danger',
              option.tone === 'primary' && 'wr-inq-opt--primary',
            )}
            title={option.detail ?? option.caption}
            onClick={() => onChoose(option)}
          >
            <span className="wr-inq-opt-icon" aria-hidden dangerouslySetInnerHTML={{ __html: icon.svg }} />
            <span className="wr-inq-opt-caption">{option.caption}</span>
          </button>
        );
      })}
    </div>
  );
}

interface StampGhost {
  hookRequestId: string;
  question: string;
  caption: string;
  unitId: string;
  adapter: string;
}

export function ChatDock({ store, orders }: ChatDockProps): React.JSX.Element | null {
  const inquiries = useStore(store, (s) => s.board.inquiries);
  const agents = useStore(store, (s) => s.board.agents);
  const pulse = useStore(store, (s) => s.meta.dockPulse);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [ghosts, setGhosts] = useState<StampGhost[]>([]);
  const [pulsing, setPulsing] = useState(false);

  // Space pulse: scroll the dock into view + highlight (SPEC-V3 §V3-5).
  useEffect(() => {
    if (pulse === 0) return;
    rootRef.current?.scrollIntoView({ block: 'nearest' });
    setPulsing(true);
    const timer = window.setTimeout(() => setPulsing(false), PULSE_MS);
    return () => window.clearTimeout(timer);
  }, [pulse]);

  const { visible, overflow } = dockView(inquiries);
  const isEmpty = visible.length === 0 && ghosts.length === 0;

  const choose = (inquiry: SimInquiryView, option: SimInquiryOption): void => {
    const adapter = agents[inquiry.unitId]?.agent ?? 'claude-code';
    // Keep the resolved bubble for the agent's transcript (§V3-5).
    store.getState().recordResolvedInquiry({
      hookRequestId: inquiry.hookRequestId,
      unitId: inquiry.unitId,
      taskId: inquiry.taskId,
      question: inquiry.question,
      optionId: option.id,
      caption: option.caption,
      ...(option.tone !== undefined ? { tone: option.tone } : {}),
    });
    orders.answerInquiry(inquiry.hookRequestId, option.id);
    // Brief wax-stamp ghost (visual residue only — NO inquiry testid).
    const ghost: StampGhost = {
      hookRequestId: inquiry.hookRequestId,
      question: inquiry.question,
      caption: option.caption,
      unitId: inquiry.unitId,
      adapter,
    };
    setGhosts((g) => [ghost, ...g]);
    window.setTimeout(() => {
      setGhosts((g) => g.filter((x) => x.hookRequestId !== ghost.hookRequestId));
    }, STAMP_MS);
  };

  return (
    <div
      ref={rootRef}
      className={clsx('wr-dock', pulsing && 'is-pulsing', isEmpty && 'wr-dock--empty')}
      data-testid="chat-dock"
      aria-label="Inquiry dock"
    >
      <div className="wr-dock-title">
        INQUIRIES
        {overflow > 0 && <span className="wr-dock-more">+{overflow} more</span>}
      </div>
      {isEmpty ? (
        <div className="wr-dock-empty-state" aria-label="No active inquiries">
          <svg className="wr-dock-empty-gear" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M29 4h6l1 6.2a18 18 0 0 1 4.6 1.9l5.2-3.4 4.2 4.2-3.4 5.2A18 18 0 0 1 48.8 23l6.2 1v6l-6.2 1a18 18 0 0 1-1.9 4.6l3.4 5.2-4.2 4.2-5.2-3.4A18 18 0 0 1 36 43.8L35 50h-6l-1-6.2a18 18 0 0 1-4.6-1.9l-5.2 3.4-4.2-4.2 3.4-5.2A18 18 0 0 1 15.2 31L9 30v-6l6.2-1a18 18 0 0 1 1.9-4.6l-3.4-5.2 4.2-4.2 5.2 3.4A18 18 0 0 1 28 10.2z" />
            <path d="M32 22a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12z" />
          </svg>
          <svg className="wr-dock-empty-quill" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M28 2C21 2 14 7 10 14 7.5 18 6 22 6 26l2 2c4 0 8-1.5 12-4 7-4 12-11 12-18 0-2.8-1.6-4-4-4zm-4 4c1.5 0 2 .8 2 2-1 5-5 10-11 13-2 1-4 1.8-6 2.2.4-2 1.2-4 2.2-6 3-6 8-10 13-11z" />
            <path d="M8 24 4 28M6 26l-3 4" strokeLinecap="round" strokeWidth="1.5" stroke="currentColor" fill="none" />
          </svg>
          <p className="wr-dock-empty-label">No pending inquiries</p>
          <p className="wr-dock-empty-sub">Agents will submit breakpoints &amp; decisions here</p>
        </div>
      ) : null}
      <div className="wr-dock-stack">
        {ghosts.map((ghost) => {
          const portrait = generateIcon({ entityId: ghost.unitId, kind: 'unit', adapter: ghost.adapter });
          return (
            <div key={`ghost-${ghost.hookRequestId}`} className="wr-inq wr-inq--stamped" aria-hidden>
              <span className="wr-inq-portrait" dangerouslySetInnerHTML={{ __html: portrait.svg }} />
              <div className="wr-inq-main">
                <div className="wr-inq-question">{ghost.question}</div>
                <div className="wr-inq-resolved">{ghost.caption}</div>
              </div>
              <span className="wr-inq-stamp" />
            </div>
          );
        })}
        {visible.map((inquiry) => {
          const adapter = agents[inquiry.unitId]?.agent ?? 'claude-code';
          const portrait = generateIcon({ entityId: inquiry.unitId, kind: 'unit', adapter });
          return (
            <div
              key={inquiry.hookRequestId}
              className="wr-inq"
              data-testid={`inquiry-${inquiry.hookRequestId}`}
            >
              <button
                type="button"
                className="wr-inq-focus-btn"
                title="Open card context"
                onClick={() => orders.focusInquiryCard(inquiry.taskId)}
              >
                <span
                  className={`wr-inq-portrait wr-faction-text--${adapter}`}
                  title={inquiry.unitId}
                  dangerouslySetInnerHTML={{ __html: portrait.svg }}
                />
                <div className="wr-inq-question">{inquiry.question}</div>
              </button>
              <div className="wr-inq-main">
                <InquiryOptionRow inquiry={inquiry} onChoose={(option) => choose(inquiry, option)} withTestIds />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
