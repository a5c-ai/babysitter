/**
 * Shared helpers for the kanban-sim unit suite (SPEC-V3).
 * Not a test file — vitest only collects `*.test.ts`.
 */
import type { ServerFrame } from '../../../contracts/gateway-protocol';
import type { ColumnId, SimCardView, Simulation } from '../simulation';

export function collectFrames(sim: Simulation): ServerFrame[] {
  const frames: ServerFrame[] = [];
  sim.onFrame((frame) => frames.push(frame));
  return frames;
}

/** Top-level (non-child) cards currently in a column. */
export function topCardsIn(sim: Simulation, column: ColumnId): SimCardView[] {
  return sim.listCardViews().filter((c) => c.column === column && c.parentId === null);
}

/** Single (non-stack) top-level cards in a column. */
export function singlesIn(sim: Simulation, column: ColumnId): SimCardView[] {
  return topCardsIn(sim, column).filter((c) => c.childIds.length === 0);
}

export function cardView(sim: Simulation, taskId: string): SimCardView {
  const card = sim.listCardViews().find((c) => c.taskId === taskId);
  if (!card) throw new Error(`card ${taskId} not found`);
  return card;
}

/** Tick in chunks until the predicate holds. Returns success. */
export function tickUntil(
  sim: Simulation,
  predicate: () => boolean,
  maxTicks = 2000,
  chunk = 5,
): boolean {
  for (let i = 0; i < maxTicks; i += chunk) {
    if (predicate()) return true;
    sim.tick(chunk);
  }
  return predicate();
}

/** Answer every open inquiry with its first option (keeps work flowing fast). */
export function answerAllInquiries(sim: Simulation): void {
  for (const inquiry of sim.listInquiries()) {
    sim.answerInquiry(inquiry.hookRequestId, inquiry.options[0]!.id);
  }
}

/** Drive a card from backlog to a target column, answering inquiries en route. */
export function driveCardTo(
  sim: Simulation,
  taskId: string,
  target: ColumnId | 'merged',
  maxTicks = 3000,
): boolean {
  if (cardView(sim, taskId).column === 'backlog') sim.moveCard(taskId, 'do');
  return tickUntil(
    sim,
    () => {
      answerAllInquiries(sim);
      const view = cardView(sim, taskId);
      if (target === 'merged') return view.merged;
      if (view.column === 'human-review' && target === 'approved') {
        sim.moveCard(taskId, 'approved');
      }
      return view.column === target && (target !== 'approved' || true);
    },
    maxTicks,
  );
}

/** Extract `card_moved` payloads from a frame log for one task. */
export function movesOf(frames: ServerFrame[], taskId: string): Array<{ from: string; to: string; reason: string }> {
  const moves: Array<{ from: string; to: string; reason: string }> = [];
  for (const frame of frames) {
    if (frame.type !== 'run.event') continue;
    const event = frame.event;
    if (event['type'] === 'card_moved' && event['taskId'] === taskId) {
      moves.push({
        from: String(event['from']),
        to: String(event['to']),
        reason: String(event['reason']),
      });
    }
  }
  return moves;
}
