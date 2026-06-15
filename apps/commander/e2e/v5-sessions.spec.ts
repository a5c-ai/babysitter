/**
 * v5-sessions.spec.ts — SPEC-V5 §V5-5: AC46 (Sessions tab for an agent-less HUMAN REVIEW
 * card — persistent transcripts, §V5-1/§V5-2), AC47 (subsession nesting + reviewed-link
 * navigation for a stack parent, §V5-1/§V5-2).
 *
 * FROZEN input for implementation; v5 is purely additive — no existing test is amended.
 * Determinism: /?seed=42, pause-on-boot, sim.tick(n) only; setup uses the sim verb
 * `moveCard` (SPEC-V3 §V3-7 sanctions verb-driven movement) and the §V5-1 sim views
 * `listSessions(taskId?)` / `getSession(sessionId)`. tickUntil budgets are v4-pacing-sized
 * (~1600 ticks; §V4-4 — budgets are not semantic assertions).
 */
import { expect, test } from '@playwright/test';
import { tickUntil } from './helpers';
import { agentsOnCard, bootBoard, moveCardViaSim, SEL3 } from './helpers-v3';
import { isTabActive, openInspectorFor, V4_BUDGET_LONG } from './helpers-v4';
import {
  driveCardToHumanReview,
  escapeRegExp,
  findStackParent,
  getSession,
  isRenderedNestedUnder,
  listSessions,
  SEL5,
  sessionRow,
  type SessionRecord,
} from './helpers-v5';

test('AC46: agent-less HUMAN REVIEW card — Inspector opens on the Sessions tab listing ≥2 sessions (worker + reviewer) with role badges and status chips; the worker transcript survives despawn; back link returns to the list', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // Stage: drive a card to HUMAN REVIEW (non-yolo path) — worker + reviewer sessions will
  // have existed (and despawned) by then (§V3-2 lifecycle, §V5-1 persistence).
  const reviewId = await driveCardToHumanReview(page);

  // "A card in HUMAN REVIEW (agent-less)" — §V3-2: HUMAN REVIEW: no agents attend.
  await expect(
    agentsOnCard(page, reviewId),
    `card-${reviewId} in HUMAN REVIEW must be agent-less (AC46/§V3-2)`,
  ).toHaveCount(0);

  // AC46: "Inspector opens with the Sessions tab" — §V5-2: it becomes the DEFAULT tab for
  // agent-less cards in human-review, ahead of Process.
  const inspector = await openInspectorFor(page, reviewId);
  const sessionsTab = page.locator(SEL5.inspectorTabSessions);
  await expect(
    sessionsTab,
    'the Inspector must offer inspector-tab-sessions for EVERY card (AC46/§V5-2)',
  ).toBeVisible();
  expect(
    await isTabActive(sessionsTab),
    'Sessions must be the DEFAULT (active) tab for an agent-less human-review card (AC46/§V5-2)',
  ).toBe(true);

  // AC46: "it lists ≥2 sessions (a worker and a reviewer)" — cross-check against the §V5-1
  // sim view listSessions(taskId).
  const sessions = await listSessions(page, reviewId);
  expect(
    sessions.length,
    `listSessions("${reviewId}") must return ≥2 persisted sessions for a card that passed AI review (AC46/§V5-1)`,
  ).toBeGreaterThanOrEqual(2);
  const worker = sessions.find((s) => s.role === 'worker');
  const reviewer = sessions.find((s) => s.role === 'reviewer');
  expect(worker, `a persisted WORKER session must exist for card-${reviewId} (AC46/§V5-1)`).toBeTruthy();
  expect(reviewer, `a persisted REVIEWER session must exist for card-${reviewId} (AC46/§V5-1)`).toBeTruthy();

  // Rows carry role badges and status chips (§V5-2 row anatomy).
  for (const s of [worker!, reviewer!] as SessionRecord[]) {
    const row = sessionRow(page, s.sessionId);
    await expect(
      row,
      `session-row-${s.sessionId} (${s.role}) must be listed in the Sessions tab (AC46/§V5-2)`,
    ).toBeVisible();
    const text = (await row.innerText()).toLowerCase();
    expect(
      text.includes(s.role.toLowerCase()),
      `session-row-${s.sessionId} must carry its "${s.role}" role badge (AC46/§V5-2); row text: "${text}"`,
    ).toBe(true);
    expect(
      text.includes(s.status.toLowerCase()),
      `session-row-${s.sessionId} must carry its "${s.status}" status chip (AC46/§V5-2); row text: "${text}"`,
    ).toBe(true);
  }

  // AC46: "opening the worker session shows a non-empty read-only transcript (despite despawn)".
  await sessionRow(page, worker!.sessionId).click();
  const transcript = page.locator(SEL5.sessionTranscript);
  await expect(
    transcript,
    'clicking a session row must open the session-transcript view inside the tab (AC46/§V5-2)',
  ).toBeVisible();
  const transcriptText = (await transcript.innerText()).trim();
  expect(
    transcriptText.length,
    `the worker session transcript must be NON-EMPTY despite the agent having despawned (AC46/§V5-1 persistence); got: "${transcriptText.slice(0, 80)}"`,
  ).toBeGreaterThan(20);
  // "read-only" — the persisted transcript view offers no editable input of its own.
  await expect(
    transcript.locator('input:not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly])'),
    'the persisted session transcript is READ-ONLY — no editable input inside session-transcript (AC46/§V5-2)',
  ).toHaveCount(0);

  // AC46: "back link returns to the list".
  await inspector.getByText(/back/i).first().click();
  await expect(
    transcript,
    'the back link must leave the transcript view (AC46/§V5-2)',
  ).toBeHidden();
  await expect(
    sessionRow(page, worker!.sessionId),
    'the back link must return to the session list (AC46/§V5-2)',
  ).toBeVisible();
});

test('AC47: stack parent Sessions tab nests child worker sessions under the coordination session; a reviewer row’s reviewed-link chip navigates to the worker session', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // Stage: a STACK parent card (childIds in listCardViews) driven into work (§V3-2 stacks).
  const parent = await findStackParent(page);
  await moveCardViaSim(page, parent.taskId, 'do');

  // Tick until the §V5-1 link structure exists: a coordination session on the parent card,
  // ≥1 child worker session carrying parentSessionId = the coordination session, and a
  // reviewer session carrying reviewOfSessionId (it judged a worker).
  let coord: SessionRecord | undefined;
  let childWorker: SessionRecord | undefined;
  let reviewer: SessionRecord | undefined;
  const staged = await tickUntil(
    page,
    async () => {
      const all = await listSessions(page);
      coord = all.find(
        (s) => s.taskId === parent.taskId && all.some((c) => c.parentSessionId === s.sessionId),
      );
      childWorker = coord
        ? all.find(
            (s) =>
              s.role === 'worker' &&
              s.parentSessionId === coord!.sessionId &&
              parent.childIds.includes(s.taskId),
          )
        : undefined;
      reviewer = all.find(
        (s) =>
          s.role === 'reviewer' &&
          s.reviewOfSessionId !== undefined &&
          (parent.childIds.includes(s.taskId) || s.taskId === parent.taskId),
      );
      return Boolean(coord && childWorker && reviewer);
    },
    V4_BUDGET_LONG,
  );
  expect(
    staged,
    `the stack parent card-${parent.taskId} must produce a coordination session, a linked child ` +
      `worker session (parentSessionId) and a reviewer session (reviewOfSessionId) within ` +
      `${V4_BUDGET_LONG.chunk * V4_BUDGET_LONG.maxChunks} ticks (AC47/§V5-1 subsession links)`,
  ).toBe(true);

  // Open the PARENT's Sessions tab.
  await openInspectorFor(page, parent.taskId);
  const sessionsTab = page.locator(SEL5.inspectorTabSessions);
  await expect(sessionsTab, 'inspector-tab-sessions must exist for the stack parent (§V5-2)').toBeVisible();
  await sessionsTab.click();

  // AC47: "the parent's Sessions tab nests child worker sessions under the coordination
  // session (indentation/bracket present)".
  await expect(
    sessionRow(page, coord!.sessionId),
    `the coordination session row session-row-${coord!.sessionId} must be listed (AC47/§V5-1)`,
  ).toBeVisible();
  await expect(
    sessionRow(page, childWorker!.sessionId),
    `the child worker session row session-row-${childWorker!.sessionId} must be listed (AC47/§V5-2)`,
  ).toBeVisible();
  expect(
    await isRenderedNestedUnder(page, childWorker!.sessionId, coord!.sessionId),
    `the child worker session-row-${childWorker!.sessionId} must render NESTED (indented / connector ` +
      `bracket) under the coordination session-row-${coord!.sessionId} (AC47/§V5-2)`,
  ).toBe(true);

  // AC47: "a reviewer row carries a reviewed-link chip that navigates to the worker session"
  // (§V5-2: reviewer rows show a "reviewed ⟶ <session>" link chip).
  const reviewerRow = sessionRow(page, reviewer!.sessionId);
  await expect(
    reviewerRow,
    `the reviewer session row session-row-${reviewer!.sessionId} must be listed (AC47/§V5-2)`,
  ).toBeVisible();
  const reviewedChip = reviewerRow.getByText(/reviewed/i).first();
  await expect(
    reviewedChip,
    `session-row-${reviewer!.sessionId} must carry a "reviewed ⟶ <session>" link chip (AC47/§V5-2)`,
  ).toBeVisible();

  const reviewedWorker = await getSession(page, reviewer!.reviewOfSessionId!);
  await reviewedChip.click();
  const transcript = page.locator(SEL5.sessionTranscript);
  await expect(
    transcript,
    'clicking the reviewed-link chip must navigate to the reviewed worker session (AC47/§V5-2)',
  ).toBeVisible();
  await expect
    .poll(async () => (await page.locator(SEL3.inspector).innerText()).toLowerCase(), {
      message:
        `the opened transcript view must be the REVIEWED worker session ` +
        `"${reviewedWorker.record.title}" (AC47/§V5-2 reviewOf navigation)`,
    })
    .toMatch(new RegExp(escapeRegExp(reviewedWorker.record.title.toLowerCase())));
});
