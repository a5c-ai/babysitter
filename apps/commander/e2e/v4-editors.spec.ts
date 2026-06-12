/**
 * v4-editors.spec.ts — SPEC-V4 §V4-5: AC39 (card editor), AC40 (Agent Stacks foundry —
 * "create agents from agents").
 *
 * FROZEN input for implementation. Determinism: /?seed=42, pause-on-boot, sim.tick(n) only;
 * `upsertStack` / `updateTask` are deterministic journaled sim verbs (§V4-13). Form-control
 * testids inside card-editor / foundry-stacks are unknowable from the spec, so controls are
 * located structurally (selects by their option sets, labelled buttons by visible text).
 */
import { expect, test, type Locator } from '@playwright/test';
import { tick, tickUntil } from './helpers';
import {
  agentsOnCard,
  bootBoard,
  cardById,
  moveCardViaSim,
  SEL3,
  singleCardsIn,
  TASK_KINDS,
  tickerTexts,
} from './helpers-v3';
import {
  forgeStackViaSim,
  openCardEditor,
  openInspectorFor,
  pickBacklogSingle,
  SEL4,
  stackSelectIn,
} from './helpers-v4';

/** The card-editor kind <select>: the one offering the §V2-2 task-kind list. */
function kindSelectIn(editor: Locator): Locator {
  return editor
    .locator('select')
    .filter({ has: editor.page().locator('option:text-matches("^\\s*(implement|migrate)\\s*$", "i")') })
    .first();
}

/** Tolerant yolo-toggle "on" probe (aria-pressed / aria-checked / data-state / class / input). */
async function yoloStateOn(toggle: Locator): Promise<boolean> {
  return toggle.evaluate((el: Element) => {
    const attr = (n: string) => (el.getAttribute(n) ?? '').toLowerCase();
    if (attr('aria-pressed') === 'true' || attr('aria-checked') === 'true') return true;
    if (/^(on|checked|active)$/.test(attr('data-state'))) return true;
    if (/\b(on|active|checked|enabled)\b/i.test(el.getAttribute('class') ?? '')) return true;
    const input = el.matches('input') ? (el as HTMLInputElement) : el.querySelector('input');
    return input instanceof HTMLInputElement ? input.checked : false;
  });
}

test('AC39: Edit Card opens card-editor; title + kind + yolo changes persist to the card; the stack select lists seeded + custom stacks', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // A custom stack must be listed alongside the 4 seeded ones (§V4-5: "New stacks appear in
  // the card editor's stack select") — forge one via the deterministic sim verb.
  const customStack = await forgeStackViaSim(page, 'Vermilion Auditor');

  const { taskId } = await pickBacklogSingle(page);
  const yoloBefore = await yoloStateOn(page.locator(`[data-testid="card-yolo-${taskId}"]`).first());

  // AC39: "`card-editor` opens from the Edit Card command".
  const editor = await openCardEditor(page, taskId);

  // Title (§V4-5 form: title, kind, description, yolo, parent, workspace, stack).
  const newTitle = 'Recalibrate The Aether Capacitor';
  const titleInput = editor.locator('input[type="text"], input:not([type])').first();
  await titleInput.fill(newTitle);

  // Kind — pick a deterministic kind different from anything resembling the new title.
  const kindSelect = kindSelectIn(editor);
  await expect(
    kindSelect,
    'card-editor must contain a kind select offering the §V2-2 task-kind list (§V4-5)',
  ).toHaveCount(1);
  await kindSelect.selectOption('migrate').catch(async () => {
    await kindSelect.selectOption({ label: 'migrate' });
  });

  // Yolo — flip it.
  const yoloControl = editor
    .locator('input[type="checkbox"], [role="switch"], [role="checkbox"], button')
    .filter({ hasText: /yolo/i })
    .first();
  const yoloCheckbox = (await yoloControl.count())
    ? yoloControl
    : editor.locator('label', { hasText: /yolo/i }).locator('input[type="checkbox"], [role="switch"]').first();
  await yoloCheckbox.click();

  // AC39: "stack select lists seeded + custom stacks" — 4 seeded (§V4-5) + our custom one.
  const stackSelect = stackSelectIn(editor, customStack);
  await expect(
    stackSelect,
    `card-editor must contain the agent-stack select listing the custom stack "${customStack}" (AC39/§V4-5)`,
  ).toHaveCount(1);
  await expect
    .poll(() => stackSelect.locator('option').count(), {
      message: 'the stack select must list the 4 seeded stacks plus the custom stack (AC39/§V4-5)',
    })
    .toBeGreaterThanOrEqual(5);

  // Save — §V4-5: "Saving applies via sim verb updateTask (deterministic, evented
  // task_updated); board re-renders."
  await editor.locator('button', { hasText: /save|apply/i }).first().click();
  await expect(editor, 'card-editor must close on save (§V4-5)').toBeHidden();
  await tick(page, 1);

  // AC39: "changing title + kind + yolo persists to the card".
  const card = cardById(page, taskId);
  await expect(card, 'the new title must render on the card (AC39)').toContainText(newTitle);
  await expect(card, 'the new kind chip must render on the card (AC39)').toContainText(/migrate/i);
  await expect
    .poll(() => yoloStateOn(page.locator(`[data-testid="card-yolo-${taskId}"]`).first()), {
      message: `the card's yolo toggle must reflect the flipped value (AC39); was ${String(yoloBefore)}`,
    })
    .toBe(!yoloBefore);
});

test('AC40: foundry-stacks lists 4 seeded stacks; Forge From + personality edit yields a stk-cNN stack usable by the card editor and the next spawn', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // Open the Foundry (N) and switch to the Stacks tab (§V4-5: data-testid="foundry-stacks").
  await page.keyboard.press('n');
  const foundry = page.locator(SEL3.foundry);
  await expect(foundry).toBeVisible();
  const stacksTab = page.locator(SEL4.foundryStacks);
  await expect(stacksTab, 'the Foundry must gain a Stacks tab (§V4-5)').toBeVisible();
  await stacksTab.click();

  // AC40: "lists 4 seeded stacks" (§V4-5: one per adapter family, with personalities) —
  // all four adapter family names must be on display.
  for (const adapter of ['claude-code', 'codex', 'gemini-cli', 'pi'] as const) {
    await expect(
      foundry.getByText(new RegExp(adapter.replace(/-/g, '[-\\s]?'), 'i')).first(),
      `the seeded stack for adapter "${adapter}" must be listed (AC40/§V4-5)`,
    ).toBeVisible();
  }

  // AC40: "Forge From clones one" ("create agents from agents").
  await foundry.locator('button', { hasText: /forge from/i }).first().click();

  // Name the clone distinctively and edit its personality (system prompt textarea, §V4-5).
  const forgedName = 'Cobalt Lamplighter';
  const nameInput = foundry.locator('input[type="text"], input:not([type])').first();
  await nameInput.fill(forgedName);
  const personality = 'Speaks only in measured couplets and refuses untested merges.';
  const systemPrompt = foundry.locator('textarea').first();
  await expect(
    systemPrompt,
    'the stack editor must expose the personality prompts as textareas (system/developer, §V4-5)',
  ).toBeVisible();
  await systemPrompt.fill(personality);

  // Save — §V4-5: sim verb upsertStack, `stack_forged` event, deterministic ids `stk-cNN`.
  const tickerBefore = (await tickerTexts(page)).length;
  await foundry.locator('button', { hasText: /save|forge(?! from)/i }).first().click();
  await tick(page, 1);

  // The new stack appears in the list with its deterministic id.
  await expect(
    foundry.getByText(forgedName).first(),
    `the forged stack "${forgedName}" must appear in the Stacks list (AC40)`,
  ).toBeVisible();
  const forgedEvidence = await page.evaluate(() => document.body.innerText);
  expect(
    /stk-c\d+/i.test(forgedEvidence) ||
      (await tickerTexts(page)).slice(tickerBefore).some((t) => /stack|forge/i.test(t)),
    'the forged stack must surface its deterministic stk-cNN id (or a stack_forged ticker event) (AC40/§V4-5)',
  ).toBe(true);

  await page.keyboard.press('Escape');
  await expect(foundry).toBeHidden();

  // AC40: the new stack "appears in the card editor and is used by the next spawn for a card
  // bound to it". Bind a backlog card to the forged stack via the card editor.
  const { taskId } = await pickBacklogSingle(page);
  const editor = await openCardEditor(page, taskId);
  const stackSelect = stackSelectIn(editor, forgedName);
  await expect(
    stackSelect,
    `the card editor's stack select must list the forged stack "${forgedName}" (AC40)`,
  ).toHaveCount(1);
  const optionValue = await stackSelect
    .locator('option')
    .filter({ hasText: new RegExp(forgedName, 'i') })
    .first()
    .getAttribute('value');
  await stackSelect.selectOption(optionValue ?? { label: forgedName });
  await editor.locator('button', { hasText: /save|apply/i }).first().click();
  await expect(editor).toBeHidden();
  await tick(page, 1);

  // Next spawn: start the card; the spawned worker derives from the bound stack.
  await moveCardViaSim(page, taskId, 'do');
  const spawned = await tickUntil(page, async () => (await agentsOnCard(page, taskId).count()) > 0, {
    chunk: 5,
    maxChunks: 80,
  });
  expect(spawned, `a worker must spawn for card-${taskId} after it enters DO (§V3-2)`).toBe(true);

  // AC40: "agent's stack visible in Inspector header".
  const inspector = await openInspectorFor(page, taskId);
  await expect
    .poll(async () => (await inspector.innerText()).toLowerCase(), {
      message: `the Inspector header must show the agent's stack "${forgedName}" (AC40/§V4-5)`,
    })
    .toContain(forgedName.toLowerCase());
});

test('AC39/AC40 guard: card-editor is offered for non-merged cards and its kind select covers the full §V2-2 kind list', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });
  const { taskId } = await pickBacklogSingle(page);
  const editor = await openCardEditor(page, taskId);
  const kindSelect = kindSelectIn(editor);
  for (const kind of TASK_KINDS) {
    await expect(
      kindSelect.locator(`option:text-matches("${kind.replace(/-/g, '[-\\s]?')}", "i")`).first(),
      `kind select must offer "${kind}" (§V4-5 kind select over the §V2-2 list)`,
    ).toHaveCount(1);
  }
  await page.keyboard.press('Escape');
  await expect(editor, 'Esc must close the card-editor dialog (Esc cascade, §V4-13)').toBeHidden();
  // Keep the board paused-deterministic: no movement should have occurred.
  const where = await singleCardsIn(page, 'backlog');
  expect(where.some((c) => c.taskId === taskId), 'the card stays in backlog (no side effects)').toBe(true);
});
