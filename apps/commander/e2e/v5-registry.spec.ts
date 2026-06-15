/**
 * v5-registry.spec.ts — SPEC-V5 §V5-5: AC48 (Registry overlay: stacks/agents tabs, session
 * detail, stack cross-link + breadcrumb, §V5-3), AC49 (tasks + workspaces tabs, §V5-3),
 * AC50 (board entity separation: sel-session-link / sel-stack-link, §V5-4), AC51 (same-seed
 * session determinism + line/polyline census with the v5 surfaces open, §V5-1/§V5-6).
 *
 * FROZEN input for implementation; v5 is purely additive — no existing test is amended.
 * Determinism: /?seed=42, pause-on-boot, sim.tick(n) only; verb-driven setup (moveCard,
 * SPEC-V3 §V3-7) plus the §V5-1 sim views listSessions/getSession. tickUntil budgets are
 * v4-pacing-sized (~1600 ticks; §V4-4 — budgets are not semantic assertions).
 */
import { expect, test, type Page } from '@playwright/test';
import { tick, tickUntil } from './helpers';
import {
  agentsOnCard,
  bootBoard,
  cardById,
  countLinePolyline,
  ensureBacklogCardOfKind,
  moveCardViaSim,
  SEL3,
  singleCardsIn,
} from './helpers-v3';
import { isTabActive, openInspectorFor } from './helpers-v4';
import {
  driveCardToHumanReview,
  escapeRegExp,
  listSessions,
  registryRow,
  registryTab,
  REGISTRY_KINDS,
  SEL5,
  sessionRow,
  titleFragment,
  type SessionRecord,
} from './helpers-v5';

/** Open the Registry ledger via the TopBar button (§V5-3). */
async function openRegistry(page: Page) {
  await page.locator(SEL5.topbarRegistry).click();
  const overlay = page.locator(SEL5.registryOverlay);
  await expect(
    overlay,
    'topbar-registry must open the registry-overlay full-screen ledger (AC48/§V5-3)',
  ).toBeVisible();
  return overlay;
}

test('AC48: Registry — stacks tab lists ≥4 stacks; agents tab lists active AND completed sessions; session row opens its transcript detail with link chips; the stack chip navigates to stack detail and registry-back returns', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // Stage: work the board so COMPLETED sessions exist (a card in human-review has finished
  // worker + reviewer sessions, §V5-1), then guarantee an ACTIVE session with a fresh card.
  await driveCardToHumanReview(page);
  if (!(await listSessions(page)).some((s) => s.status === 'active')) {
    const freshId = await ensureBacklogCardOfKind(page, 'implement');
    await moveCardViaSim(page, freshId, 'do');
    const spawned = await tickUntil(
      page,
      async () => (await listSessions(page)).some((s) => s.status === 'active'),
      { chunk: 5, maxChunks: 80 },
    );
    expect(spawned, 'a fresh working card must yield an ACTIVE session (AC48 setup/§V5-1)').toBe(true);
  }
  const sessions = await listSessions(page);
  const active = sessions.find((s) => s.status === 'active');
  const completed = sessions.find((s) => s.status === 'completed');
  expect(active, 'an ACTIVE session must exist before opening the Registry (AC48/§V5-1)').toBeTruthy();
  expect(completed, 'a COMPLETED session must persist after despawn (AC48/§V5-1)').toBeTruthy();

  // AC48: "topbar-registry opens registry-overlay".
  const overlay = await openRegistry(page);

  // AC48: "the stacks tab lists ≥4 stacks" (§V5-3: every stack, seeded + forged).
  await registryTab(page, 'stacks').click();
  await expect
    .poll(() => overlay.locator(SEL5.registryRow).count(), {
      message: 'the Registry stacks tab must list ≥4 stacks as registry-row-<stackRef> (AC48/§V5-3)',
    })
    .toBeGreaterThanOrEqual(4);

  // AC48: "the agents tab lists both active AND completed sessions" (§V5-3 Agents = ALL
  // sessions ever; active highlighted, completed inked).
  await registryTab(page, 'agents').click();
  await expect(
    registryRow(page, active!.sessionId),
    `the ACTIVE session ${active!.sessionId} must be listed in the agents tab (AC48/§V5-3)`,
  ).toBeVisible();
  await expect(
    registryRow(page, completed!.sessionId),
    `the COMPLETED session ${completed!.sessionId} must be listed in the agents tab (AC48/§V5-3)`,
  ).toBeVisible();

  // AC48: "clicking a session row opens its transcript detail with link chips".
  await registryRow(page, completed!.sessionId).click();
  const transcript = overlay.locator(SEL5.sessionTranscript);
  await expect(
    transcript,
    'the agents-tab session detail must reuse the session-transcript component (AC48/§V5-3)',
  ).toBeVisible();
  const stackChip = overlay
    .getByText(new RegExp(escapeRegExp(completed!.stackName), 'i'))
    .first();
  await expect(
    stackChip,
    `the session detail must carry a link chip to its stack "${completed!.stackName}" (AC48/§V5-3)`,
  ).toBeVisible();

  // AC48: "clicking its stack chip navigates to the stack detail (breadcrumb back works)" —
  // §V5-3: every cross-link navigates WITHIN the registry.
  await stackChip.click();
  await expect(
    transcript,
    'the stack chip must navigate AWAY from the session transcript to the stack detail (AC48/§V5-3)',
  ).toBeHidden();
  await expect(
    overlay.getByText(new RegExp(escapeRegExp(completed!.stackName), 'i')).first(),
    `the stack detail must show the stack "${completed!.stackName}" (AC48/§V5-3)`,
  ).toBeVisible();
  await expect(overlay).toBeVisible(); // still within the registry, not a different overlay

  const back = page.locator(SEL5.registryBack);
  await expect(back, 'the registry breadcrumb back control must exist (AC48/§V5-3)').toBeVisible();
  await back.click();
  await expect(
    transcript,
    'registry-back must return to the previous (session detail) view (AC48/§V5-3 breadcrumb back stack)',
  ).toBeVisible();
});

test('AC49: Registry tasks tab — a worked card’s detail shows its sessions and a run link; the workspaces tab lists workspaces with branch + dirty state and linked cards', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // Stage: a worked card (sessions + a run exist).
  const workedId = await driveCardToHumanReview(page);
  const cardTitle = titleFragment((await cardById(page, workedId).innerText()) ?? '');
  const sessions = await listSessions(page, workedId);
  const worker = sessions.find((s) => s.role === 'worker') as SessionRecord | undefined;
  expect(worker, `a worker session must exist for the worked card-${workedId} (AC49 setup/§V5-1)`).toBeTruthy();
  expect(
    worker!.runId,
    'the worker SessionRecord must carry its runId (AC49/§V5-1 SessionRecord shape)',
  ).toBeTruthy();

  const overlay = await openRegistry(page);

  // AC49: "a worked card's detail shows its sessions and a run link" (§V5-3 Tasks tab).
  await registryTab(page, 'tasks').click();
  const taskRowEl = registryRow(page, workedId);
  await expect(
    taskRowEl,
    `the tasks tab must list the worked card as registry-row-${workedId} (AC49/§V5-3)`,
  ).toBeVisible();
  await taskRowEl.click();
  await expect(
    sessionRow(page, worker!.sessionId),
    `the task detail must list the card's sessions (nested as in §V5-2) — session-row-${worker!.sessionId} (AC49/§V5-3)`,
  ).toBeVisible();
  await expect(
    overlay.getByText(new RegExp(escapeRegExp(worker!.runId!), 'i')).first(),
    `the task detail must show a run link referencing run "${worker!.runId}" (AC49/§V5-3: runs link into the Runs overlay detail)`,
  ).toBeVisible();

  // AC49: "the workspaces tab lists workspaces with branch + dirty state and linked cards".
  await registryTab(page, 'workspaces').click();
  await expect
    .poll(() => overlay.locator(SEL5.registryRow).count(), {
      message: 'the workspaces tab must list ≥1 workspace as registry-row-<workspaceId> (AC49/§V5-3)',
    })
    .toBeGreaterThanOrEqual(1);
  const rowsText = (
    await overlay.locator(SEL5.registryRow).allInnerTexts()
  ).join('\n').toLowerCase();
  expect(
    /dirty|clean/.test(rowsText),
    `workspace rows must show the gitStatus dirty state (AC49/§V5-3); rows: ${rowsText.slice(0, 300)}`,
  ).toBe(true);
  expect(
    /branch|\b[0-9a-f]{7,}\b|[\w.-]+\/[\w.-]+/.test(rowsText),
    `workspace rows must show the gitStatus branch/sha (AC49/§V5-3); rows: ${rowsText.slice(0, 300)}`,
  ).toBe(true);
  // "linked cards" — the worked card is referenced from the workspaces surface.
  await expect
    .poll(async () => (await overlay.innerText()).toLowerCase(), {
      message:
        `the workspaces tab must link the workspace's cards — expected the worked card ` +
        `"${cardTitle}" to be referenced (AC49/§V5-3)`,
    })
    .toMatch(new RegExp(escapeRegExp(cardTitle.toLowerCase())));
});

test('AC50: board separation — a working card’s SelectionPanel shows sel-session-link (→ Sessions tab on that card) and sel-stack-link (→ Registry stack detail)', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // Stage: a WORKING card (active agent attending).
  const singles = await singleCardsIn(page, 'backlog');
  const taskId = singles[0].taskId;
  await moveCardViaSim(page, taskId, 'do');
  const working = await tickUntil(page, async () => (await agentsOnCard(page, taskId).count()) > 0, {
    chunk: 5,
    maxChunks: 80,
  });
  expect(working, `card-${taskId} must have an attending worker (AC50 setup)`).toBe(true);
  const active = (await listSessions(page, taskId)).find((s) => s.status === 'active');
  expect(active, `an ACTIVE session must exist for the working card-${taskId} (AC50/§V5-1)`).toBeTruthy();

  // AC50: "the SelectionPanel shows both sel-session-link and sel-stack-link" (§V5-4:
  // session = instance, stack = template — two distinct affordances).
  await cardById(page, taskId).click();
  await expect(page.locator(SEL3.selectionPanel)).toBeVisible();
  const sessionLink = page.locator(SEL5.selSessionLink);
  const stackLink = page.locator(SEL5.selStackLink);
  await expect(
    sessionLink,
    'the SelectionPanel single-card view must show sel-session-link for a working card (AC50/§V5-4)',
  ).toBeVisible();
  await expect(
    stackLink,
    'the SelectionPanel single-card view must show sel-stack-link for a working card (AC50/§V5-4)',
  ).toBeVisible();

  // AC50: "the session link opens the Sessions tab on that card".
  await sessionLink.click();
  await expect(
    page.locator(SEL3.inspector),
    'sel-session-link must open the Inspector (AC50/§V5-4 "view session" → Sessions tab)',
  ).toBeVisible();
  const sessionsTab = page.locator(SEL5.inspectorTabSessions);
  await expect(sessionsTab).toBeVisible();
  expect(
    await isTabActive(sessionsTab),
    'sel-session-link must land on the SESSIONS tab (AC50/§V5-4)',
  ).toBe(true);
  await expect(
    sessionRow(page, active!.sessionId),
    `the Sessions tab must be on THAT card — its active session-row-${active!.sessionId} listed (AC50/§V5-2)`,
  ).toBeVisible();

  // AC50: "the stack link opens the Registry stack detail".
  await page.keyboard.press('Escape'); // close the inspector (Esc cascade)
  await cardById(page, taskId).click();
  await expect(stackLink).toBeVisible();
  await stackLink.click();
  const overlay = page.locator(SEL5.registryOverlay);
  await expect(
    overlay,
    'sel-stack-link must open the Registry overlay (AC50/§V5-4 "view stack" → Registry stack detail)',
  ).toBeVisible();
  await expect(
    overlay.getByText(new RegExp(escapeRegExp(active!.stackName), 'i')).first(),
    `the Registry must land on the stack detail for "${active!.stackName}" (AC50/§V5-4)`,
  ).toBeVisible();
});

test('AC51: same-seed reload yields identical session ids and names; zero <line>/<polyline> document-wide with the registry and sessions surfaces open', async ({
  page,
}) => {
  // Identical verb+tick script from the same seed, twice (§V5-1: "Same seed ⇒ identical
  // session ids, names, link structure"; same pattern as the frozen AC33 determinism test).
  const script = async (): Promise<Array<{ id: string; name: string }>> => {
    await bootBoard(page, { seed: 42 });
    const ids = (await singleCardsIn(page, 'backlog')).map((c) => c.taskId).sort();
    expect(ids.length).toBeGreaterThanOrEqual(2);
    for (const id of ids) await moveCardViaSim(page, id, 'do');
    await tick(page, 300);
    return (await listSessions(page)).map((s) => ({ id: s.sessionId, name: s.title }));
  };

  const first = await script();
  expect(
    first.length,
    'working the board for 300 ticks must produce ≥1 session (AC51/§V5-1)',
  ).toBeGreaterThan(0);
  const second = await script();
  expect(
    second,
    'same seed + identical verb/tick script must yield IDENTICAL session ids and names (AC51/§V5-1)',
  ).toEqual(first);

  // Census on the second boot: zero <line>/<polyline> document-wide with the SESSIONS
  // surface open (Sessions tab + transcript)…
  const probeTaskId = (await listSessions(page))[0].taskId;
  await openInspectorFor(page, probeTaskId);
  const sessionsTab = page.locator(SEL5.inspectorTabSessions);
  await expect(sessionsTab).toBeVisible();
  await sessionsTab.click();
  const firstRow = page.locator(SEL5.sessionRow).first();
  await expect(firstRow, 'the Sessions tab must list ≥1 session row (AC51 census setup)').toBeVisible();
  await firstRow.click();
  await expect(page.locator(SEL5.sessionTranscript)).toBeVisible();
  expect(
    await countLinePolyline(page),
    'zero <line>/<polyline> with the Sessions tab + transcript open (AC51/§V5-6, AC33 rule)',
  ).toBe(0);

  // …and with the REGISTRY open on every tab (§V5-3 surfaces).
  await page.locator(SEL5.topbarRegistry).click();
  const overlay = page.locator(SEL5.registryOverlay);
  await expect(overlay).toBeVisible();
  for (const kind of REGISTRY_KINDS) {
    await registryTab(page, kind).click();
    await expect(overlay.locator(SEL5.registryRow).first()).toBeVisible();
    expect(
      await countLinePolyline(page),
      `zero <line>/<polyline> with the registry ${kind} tab open (AC51/§V5-6, AC33 rule)`,
    ).toBe(0);
  }
});
