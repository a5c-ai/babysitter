/**
 * Human Review side panel action routing (SPEC-V3 §V3-4): Approve All sends
 * the card to APPROVED, Request Changes (with optional feedback) bounces it
 * back to DO — both via the deterministic sim verb `orders.moveCard`
 * (§V3-7: ALL board movement flows through sim verbs), then close the
 * panel. Kept apart from React so the verb routing is unit-testable.
 */

import type { CommanderStore, Orders } from './store';

/** `Approve All` (review-approve-all): card → APPROVED, panel closes. */
export function approveAll(store: CommanderStore, orders: Orders, taskId: string): void {
  orders.moveCard(taskId, 'approved');
  store.getState().closeReview();
}

/** `Request Changes`: card → DO with the operator's feedback, panel closes. */
export function requestChanges(
  store: CommanderStore,
  orders: Orders,
  taskId: string,
  feedback: string,
): void {
  const trimmed = feedback.trim();
  if (trimmed.length > 0) {
    const title = store.getState().board.cards[taskId]?.view.title ?? taskId;
    store.getState().pushEvent(`Changes requested — ${title}: ${trimmed}`, 'warn', taskId);
  }
  orders.moveCard(taskId, 'do');
  store.getState().closeReview();
}
