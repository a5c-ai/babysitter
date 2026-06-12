/**
 * v3-board.spec.ts — SPEC-V3 §V3-6: AC25 (board boot), AC26 (drag to DO), AC27 (auto-move),
 * plus the surviving creation check folded in from V2 AC21 (Commission Task only — SPEC-V3
 * retires the Forge Agent tab: "the Foundry keeps ONLY this tab", §V3-7).
 *
 * FROZEN input for implementation. Determinism: /?seed=42, pause-on-boot, sim.tick(n) only.
 */
import { expect, test } from '@playwright/test';
import { tick, tickUntil } from './helpers';
import {
  ADAPTER_BY_KIND,
  agentAdapter,
  agentsOnCard,
  bootBoard,
  cardsInColumn,
  column,
  COLUMNS,
  commissionTask,
  dragCard,
  movedCardIds,
  SEL3,
  singleCardsIn,
  tickerTexts,
  tickUntilCardInColumn,
  watchIsMoving,
} from './helpers-v3';

test('AC25 (as amended by SPEC-V4): board boot — 7 columns, backlog holds ≥5 cards incl. ≥1 stack with ≥2 mini-children, zero agents, units counter 0', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // AC25 AMENDED per the SPEC-V4 header + §V4-1 (sanctioned product change): the five-column
  // assertion becomes SEVEN columns — §V3-1 ids plus the release rail `merged` and
  // `in-production` (testids kanban-col-merged, kanban-col-in-production).
  expect(COLUMNS.length, 'seven lanes total (SPEC-V4 §V4-1)').toBe(7);
  for (const id of COLUMNS) {
    await expect(
      column(page, id),
      `kanban-col-${id} must exist (SPEC-V3 §V3-1 as amended by SPEC-V4 §V4-1)`,
    ).toBeVisible();
  }

  // AC25: "backlog holds ≥5 cards".
  await expect
    .poll(() => cardsInColumn(page, 'backlog').count(), {
      message: 'backlog must hold ≥5 cards at boot (AC25)',
    })
    .toBeGreaterThanOrEqual(5);

  // AC25: "including ≥1 stack with ≥2 mini-children" — §V3-1: subtasks render as a stack,
  // parent card on top, children as attached mini-cards beneath (children are cards too).
  const stackChildCounts = await page.evaluate(() => {
    const lane = document.querySelector('[data-testid="kanban-col-backlog"]');
    if (!lane) return [] as number[];
    const isCard = (el: Element) => {
      const t = el.getAttribute('data-testid') ?? '';
      return t.startsWith('card-') && !t.startsWith('card-agent-') && !t.startsWith('card-yolo-');
    };
    return Array.from(lane.querySelectorAll('[data-testid^="card-"]'))
      .filter(isCard)
      .map((card) => Array.from(card.querySelectorAll('[data-testid^="card-"]')).filter(isCard).length)
      .filter((n) => n > 0);
  });
  expect(
    stackChildCounts.some((n) => n >= 2),
    `at least one backlog stack must fan ≥2 mini-children beneath its parent (AC25); child counts seen: ${JSON.stringify(stackChildCounts)}`,
  ).toBe(true);

  // AC25: "ZERO agent avatars anywhere" (§V3-2: no idle agents, no pre-spawned fleet).
  await expect(page.locator(SEL3.cardAgent)).toHaveCount(0);

  // AC25: "topbar units counter reads 0" (§V3-2: units counter now means "active agents").
  const unitsCounter = await page.evaluate(() => {
    for (const el of Array.from(document.querySelectorAll('[data-testid^="topbar-"]'))) {
      const id = (el.getAttribute('data-testid') ?? '').toLowerCase();
      const text = (el.textContent ?? '').toLowerCase();
      if (/unit|agent/.test(id) || /unit|agent/.test(text)) {
        return { id, text: (el.textContent ?? '').trim() };
      }
    }
    return null;
  });
  expect(unitsCounter, 'a topbar-* units/agents counter must exist (SPEC §9, §V3-2)').not.toBeNull();
  const firstNumber = unitsCounter?.text.match(/\d+/)?.[0];
  expect(firstNumber, `topbar units counter must read 0 at boot (AC25); saw "${unitsCounter?.text}"`).toBe(
    '0',
  );
});

test('AC26 + AC27: pointer-drag a backlog card to DO spawns a mapped worker; work auto-moves the card to AI REVIEW with a reviewer', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });
  await watchIsMoving(page);

  // Pick a single (non-stack) backlog card whose kind we can read off its kind chip.
  const singles = await singleCardsIn(page, 'backlog');
  const target = singles.find((c) => c.kind !== null);
  expect(
    target,
    'expected at least one single backlog card with a readable kind chip (SPEC-V3 §V3-1: cards carry a kind chip)',
  ).toBeTruthy();
  const { taskId, kind } = target!;
  const tickerBefore = (await tickerTexts(page)).length;

  // AC26: "pointer-dragging a backlog card to DO lands it there" (§V3-1 user drag → moveCard verb).
  await dragCard(page, taskId, 'do');
  await expect
    .poll(() => cardsInColumn(page, 'do').locator(`[data-testid="card-${taskId}"]`).count(), {
      message: `card-${taskId} must land in DO after the pointer drag (AC26)`,
    })
    .toBe(1);

  // AC26: "an agent avatar spawns in its slot with adapter per the V3-2 mapping".
  // (tickUntil budgets in this file doubled per SPEC-V4 §V4-4 pacing — sanctioned, non-semantic)
  const spawned = await tickUntil(page, async () => (await agentsOnCard(page, taskId).count()) > 0, {
    chunk: 5,
    maxChunks: 80,
  });
  expect(spawned, `a worker agent must spawn on card-${taskId} after it enters DO (§V3-2)`).toBe(true);
  const workerAvatar = agentsOnCard(page, taskId).first();
  const workerAdapter = await agentAdapter(workerAvatar);
  expect(
    workerAdapter,
    'agent avatar must expose its adapter via data-adapter attr or class (AC26)',
  ).not.toBeNull();
  expect(workerAdapter, `kind "${kind}" must map to adapter per §V3-2`).toBe(
    ADAPTER_BY_KIND[kind!],
  );

  // AC26: "work events for that task start appearing in the ticker".
  const eventsStarted = await tickUntil(
    page,
    async () => (await tickerTexts(page)).length > tickerBefore,
    { chunk: 10, maxChunks: 80 },
  );
  expect(eventsStarted, 'ticker must stream work events after the card enters DO (AC26)').toBe(true);

  // AC27: "when the work completes, the card moves to AI REVIEW without user action".
  await tickUntilCardInColumn(page, taskId, 'ai-review');

  // AC27: "during the move it carries the is-moving class" (§V3-3 e2e hook, observed via mutation watcher).
  const moved = await movedCardIds(page);
  expect(
    moved,
    `card-${taskId} must carry the is-moving class during its automatic transition (AC27/§V3-3); cards seen moving: ${JSON.stringify(moved)}`,
  ).toContain(`card-${taskId}`);

  // AC27: "the worker avatar is gone and a reviewer avatar (different adapter) appears" (§V3-2).
  const reviewerSeen = await tickUntil(
    page,
    async () => {
      const n = await agentsOnCard(page, taskId).count();
      if (n === 0) return false;
      const adapter = await agentAdapter(agentsOnCard(page, taskId).first());
      return adapter !== null && adapter !== workerAdapter;
    },
    { chunk: 5, maxChunks: 80 },
  );
  expect(
    reviewerSeen,
    `a reviewer avatar with an adapter different from the worker (${workerAdapter}) must attend card-${taskId} in AI REVIEW (AC27)`,
  ).toBe(true);
});

test('AC21 (V3 fold-in): Foundry has ONLY Commission Task; commissioning a fix task adds a backlog card, logs to ticker, survives tick(10) and is selectable', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // §V3-7: "the Foundry keeps ONLY this tab" — no Forge Agent surface remains.
  await page.keyboard.press('n');
  const foundry = page.locator(SEL3.foundry);
  await expect(foundry).toBeVisible();
  await expect(
    foundry.getByText(/forge agent/i),
    'Forge Agent tab is RETIRED by V3 (§V3-7: Foundry keeps ONLY Commission Task)',
  ).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(foundry).toBeHidden();

  const before = (await singleCardsIn(page, 'backlog')).map((c) => c.taskId);
  const tickerBefore = (await tickerTexts(page)).length;

  // V2 AC21 (surviving half): commission a task of kind `fix` with the default title.
  await commissionTask(page, 'fix');

  const after = (await singleCardsIn(page, 'backlog')).map((c) => c.taskId);
  const created = after.find((id) => !before.includes(id));
  expect(created, 'a new queued task card must appear in BACKLOG after commissioning (V2 §V2-6)').toBeTruthy();
  // §V2-6: deterministic id `adr-cXX-…` from a creation counter.
  expect(created!, 'created task ids follow the deterministic adr-cXX-… scheme (V2 §V2-6)').toMatch(
    /^adr-c\d+/,
  );

  // "ticker logs it".
  await expect
    .poll(async () => (await tickerTexts(page)).length, {
      message: 'commissioning must log a ticker entry (V2 AC21)',
    })
    .toBeGreaterThan(tickerBefore);

  // "survive tick(10) and are selectable".
  await tick(page, 10);
  const card = page.locator(`[data-testid="card-${created!}"]`).first();
  await expect(card).toBeVisible();
  await card.click();
  await expect(
    page.locator(SEL3.selectionPanel),
    'clicking the commissioned card must select it (SelectionPanel opens, §V3-1)',
  ).toBeVisible();
});
