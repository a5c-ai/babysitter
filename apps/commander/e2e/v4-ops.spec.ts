/**
 * v4-ops.spec.ts — SPEC-V4 operational surfaces: AC41 (runs overlay + process management,
 * §V4-6), AC42 (cogitator terminal, §V4-7/§V4-8), AC43 (memory I/O tab, §V4-9).
 *
 * FROZEN input for implementation. Determinism: /?seed=42, pause-on-boot, sim.tick(n) only.
 * Internal markup of rows/sections is unknowable from the spec — located structurally with
 * tolerant probes and clear failure messages.
 */
import { expect, test, type Page } from '@playwright/test';
import { tick, tickUntil } from './helpers';
import {
  agentsOnCard,
  bootBoard,
  cardById,
  commissionTask,
  ensureBacklogCardOfKind,
  moveCardViaSim,
  SEL3,
  singleCardsIn,
  tickUntilTickerMatches,
} from './helpers-v3';
import {
  callSimVerb,
  invokeCardCommand,
  isTabActive,
  openInspectorFor,
  SEL4,
  terminalRun,
  V4_BUDGET,
  V4_BUDGET_LONG,
} from './helpers-v4';

/** Longest text line of a card — its serif title (§V3-1 card anatomy). */
function titleFragment(cardText: string): string {
  return cardText
    .split('\n')
    .map((l) => l.trim())
    .sort((a, b) => b.length - a.length)[0]
    .slice(0, 14)
    .trim();
}

/** Count journal-event-type mentions inside run-detail (the journal lists seq + type, §V4-6). */
async function journalEventCount(page: Page): Promise<number> {
  const text = await page.locator(SEL4.runDetail).innerText();
  return (
    text.match(/EFFECT_REQUESTED|EFFECT_RESOLVED|RUN_CREATED|RUN_COMPLETED|RUN_FAILED/gi) ?? []
  ).length;
}

test('AC41: topbar-runs opens the runs ledger; run-detail shows phases + a growing journal; process-editor rename bumps the revision and affects only the NEXT run', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // ---- An old run to pin: start a fix card BEFORE the template edit ----
  const fixCard1 = await ensureBacklogCardOfKind(page, 'fix');
  const card1Title = titleFragment((await cardById(page, fixCard1).innerText()) ?? '');
  await moveCardViaSim(page, fixCard1, 'do');
  const started = await tickUntil(page, async () => (await agentsOnCard(page, fixCard1).count()) > 0, {
    chunk: 5,
    maxChunks: 80,
  });
  expect(started, `a worker (and therefore a run) must start for card-${fixCard1} (§V4-6 setup)`).toBe(true);
  await tick(page, 20);

  // ---- Runs overlay (§V4-6) ----
  await page.locator(SEL4.topbarRuns).click();
  const overlay = page.locator(SEL4.runsOverlay);
  await expect(overlay, 'topbar-runs must open the runs-overlay parchment ledger (AC41/§V4-6)').toBeVisible();

  // "listing ≥1 run with state badges" (ObservedRunState, §V2-5 vocabulary).
  await expect(
    overlay.getByText(/created|waiting|completed|halted|failed/i).first(),
    'the runs table must show ObservedRunState badges (AC41/§V4-6)',
  ).toBeVisible();

  // "row click opens run-detail with phase pipeline + growing journal".
  await overlay.getByText(card1Title).first().click();
  const detail = page.locator(SEL4.runDetail);
  await expect(detail, `clicking the run row for "${card1Title}" must open run-detail (AC41)`).toBeVisible();
  const journalBefore = await journalEventCount(page);
  expect(
    journalBefore,
    'run-detail must render the journal (seq/type rows naming the §V2-5 event types) (AC41/§V4-6)',
  ).toBeGreaterThan(0);
  await tick(page, 60);
  await expect
    .poll(() => journalEventCount(page), {
      message: 'the run-detail journal must GROW over ticks (auto-follow, AC41/§V4-6)',
    })
    .toBeGreaterThan(journalBefore);

  // Pin the old run's phase pipeline content before the template edit.
  const oldRunTextBefore = (await detail.innerText()).toLowerCase();
  expect(
    oldRunTextBefore.includes('calibrate-gears'),
    'sanity: the renamed phase label must not pre-exist in the old run',
  ).toBe(false);

  // ---- Process management (§V4-6: process-library tab + process-editor) ----
  await page.locator(SEL4.processLibrary).click();
  const libraryText = () => overlay.innerText();
  await expect
    .poll(libraryText, {
      message: 'the Processes tab must list per-taskKind templates with ids commander/<kind>@vN (AC41/§V4-6)',
    })
    .toMatch(/commander\/[a-z-]+@v\d+/i);
  const beforeMatch = (await libraryText()).match(/commander\/fix@v(\d+)/i);
  expect(beforeMatch, 'a commander/fix@vN template must be listed (AC41/§V4-6)').toBeTruthy();
  const revBefore = Number(beforeMatch![1]);

  // Open the editor for the fix template and rename a phase.
  await overlay.getByText(new RegExp(`commander/fix@v${revBefore}`, 'i')).first().click();
  const editor = page.locator(SEL4.processEditor);
  await expect(editor, 'selecting a template must open the process-editor (AC41/§V4-6)').toBeVisible();
  const phaseInput = editor.locator('input[type="text"], input:not([type])').first();
  await expect(phaseInput, 'process-editor must expose phase labels as editable inputs (§V4-6)').toBeVisible();
  await phaseInput.fill('calibrate-gears');
  await editor.locator('button', { hasText: /save|apply/i }).first().click();
  await tick(page, 1);

  // "saving bumps the template revision (process_updated event)".
  await expect
    .poll(async () => {
      const m = (await libraryText()).match(/commander\/fix@v(\d+)/i);
      return m ? Number(m[1]) : -1;
    }, { message: 'saving the renamed phase must bump the commander/fix template revision (AC41/§V4-6)' })
    .toBeGreaterThan(revBefore);

  await page.keyboard.press('Escape');
  await expect(overlay).toBeHidden();

  // ---- "affects the NEXT run created for that kind" ----
  await commissionTask(page, 'fix');
  const fixSingles = await singleCardsIn(page, 'backlog');
  const fixCard2 = fixSingles.find((c) => c.kind === 'fix' && c.taskId !== fixCard1)?.taskId;
  expect(fixCard2, 'a second fix card must exist in backlog (AC41 setup)').toBeTruthy();
  await moveCardViaSim(page, fixCard2!, 'do');
  const started2 = await tickUntil(page, async () => (await agentsOnCard(page, fixCard2!).count()) > 0, {
    chunk: 5,
    maxChunks: 80,
  });
  expect(started2, `a worker must start for the second fix card-${fixCard2} (AC41)`).toBe(true);

  // The NEW run's phase pipeline shows the renamed phase (Inspector Process tab, §V2-5 —
  // the same surface run-detail promotes/reuses, §V4-6).
  const inspector = await openInspectorFor(page, fixCard2!);
  await page.locator(SEL3.inspectorTabProcess).click();
  await expect
    .poll(async () => (await inspector.innerText()).toLowerCase(), {
      message: 'the NEXT fix run must use the renamed phase "calibrate-gears" (AC41/§V4-6)',
    })
    .toContain('calibrate-gears');

  // "existing runs unchanged — running runs keep their pinned revision".
  await page.keyboard.press('Escape'); // close inspector
  await page.locator(SEL4.topbarRuns).click();
  await expect(overlay).toBeVisible();
  await overlay.getByText(card1Title).first().click();
  await expect(detail).toBeVisible();
  const oldRunTextAfter = (await detail.innerText()).toLowerCase();
  expect(
    oldRunTextAfter.includes('calibrate-gears'),
    `the PRE-EDIT run for card-${fixCard1} must keep its pinned processRevision — no renamed phase (AC41/§V4-6)`,
  ).toBe(false);
});

test('AC42: the Terminal command opens a cogitator terminal; ls/git status/cat answer from the deterministic workspace; unknown commands answer in character', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // A working card with a workspace (§V4-7: "any card with a workspace (and agents)").
  const singles = await singleCardsIn(page, 'backlog');
  const taskId = singles[0].taskId;
  await moveCardViaSim(page, taskId, 'do');
  const working = await tickUntil(page, async () => (await agentsOnCard(page, taskId).count()) > 0, {
    chunk: 5,
    maxChunks: 80,
  });
  expect(working, `card-${taskId} must have an attending worker (AC42 setup)`).toBe(true);

  // Let workspace changes accumulate, then harvest the expected diff content from the
  // Inspector Workspace tab (V2-7 surface): first changed file path + one addition-row text.
  const inspector = await openInspectorFor(page, taskId);
  await page.locator(SEL3.inspectorTabWorkspace).click();
  const fileCount = async () => inspector.locator(SEL3.wsFile).count();
  const filesReady = await tickUntil(page, async () => (await fileCount()) >= 1, V4_BUDGET);
  expect(filesReady, `card-${taskId} must accumulate ≥1 changed file within ${V4_BUDGET.chunk * V4_BUDGET.maxChunks} ticks (V2-7)`).toBe(true);

  const fileRowText = (await inspector.locator('[data-testid="ws-file-0"]').innerText()).trim();
  const pathMatch = fileRowText.match(/(?:[\w@.-]+\/)*[\w@.-]+\.[\w]+/);
  expect(pathMatch, `ws-file-0 must show a file path (V2-7); row text: "${fileRowText}"`).toBeTruthy();
  const changedPath = pathMatch![0];

  await inspector.locator('[data-testid="ws-file-0"]').click();
  const additionSnippet = await inspector.evaluate((root: Element) => {
    const els = Array.from(root.querySelectorAll('*'));
    for (const el of els) {
      const cls = el.getAttribute('class') ?? '';
      const text = (el.textContent ?? '').trim();
      if (el.children.length > 4 || text.length < 6) continue;
      if (/\badd(ition|ed)?\b|diff-add/i.test(cls)) return text.replace(/^\+\s*/, '');
      if (text.startsWith('+') && text.length > 8) return text.replace(/^\+\s*/, '');
    }
    return '';
  });
  expect(
    additionSnippet.length,
    'the diff plate must contain an addition row to cross-check against `cat` (AC42/§V4-8)',
  ).toBeGreaterThan(5);

  // ---- The Terminal (§V4-7) ----
  await invokeCardCommand(page, taskId, /terminal/i);
  const terminalTab = page.locator(SEL4.inspectorTabTerminal);
  await expect(
    terminalTab,
    'the Terminal command must open the inspector-tab-terminal cogitator plate (AC42/§V4-7)',
  ).toBeVisible();
  expect(await isTabActive(terminalTab), 'the Terminal tab must be the active tab after the command').toBe(true);
  await expect(page.locator(SEL4.terminalInput)).toBeVisible();

  // `ls` lists tree roots (§V4-8 getWorkspaceTree).
  const tree = await callSimVerb<{ name: string; children?: Array<{ name: string }> }>(
    page,
    'getWorkspaceTree',
    [taskId],
  );
  const rootNames = (tree.children?.map((c) => c.name) ?? [tree.name]).filter(Boolean);
  expect(rootNames.length, 'getWorkspaceTree must return a non-empty tree (§V4-8)').toBeGreaterThan(0);
  const lsOut = await terminalRun(page, 'ls');
  expect(
    rootNames.some((n) => lsOut.includes(n.toLowerCase())),
    `\`ls\` must list the workspace tree roots (AC42/§V4-7); roots: ${JSON.stringify(rootNames)}; output: ${lsOut.slice(-400)}`,
  ).toBe(true);

  // `git status` lists changed files.
  const statusOut = await terminalRun(page, 'git status');
  expect(
    statusOut.includes(changedPath.toLowerCase()),
    `\`git status\` must list the changed file "${changedPath}" (AC42/§V4-7); output: ${statusOut.slice(-400)}`,
  ).toBe(true);

  // `cat <changed file>` prints content containing the diff's added text (§V4-8: changed
  // files' content reflects their diff hunks applied).
  const catOut = await terminalRun(page, `cat ${changedPath}`);
  expect(
    catOut.includes(additionSnippet.toLowerCase()),
    `\`cat ${changedPath}\` must print content containing the diff's added text "${additionSnippet}" (AC42/§V4-8); output tail: ${catOut.slice(-400)}`,
  ).toBe(true);

  // Unknown command answers in character (§V4-7: "the cogitator does not know this incantation").
  const unknownOut = await terminalRun(page, 'summon-the-omnissiah');
  expect(
    /incantation|does not know|unknown/i.test(unknownOut),
    `unknown commands must answer in character (AC42/§V4-7); output tail: ${unknownOut.slice(-300)}`,
  ).toBe(true);
});

interface MemorySections {
  read: number;
  written: number;
}

/** Count piece rows under the Read / Written section captions of the memory tab (§V4-9). */
async function memorySectionCounts(page: Page): Promise<MemorySections> {
  return page.evaluate(() => {
    const inspector = document.querySelector('[data-testid="inspector"]');
    if (!inspector) return { read: 0, written: 0 };
    const countFor = (label: RegExp): number => {
      const caption = Array.from(inspector.querySelectorAll('*')).find((el) => {
        const own = (el.textContent ?? '').trim();
        return el.children.length <= 2 && own.length <= 16 && label.test(own);
      });
      if (!caption) return 0;
      // The section is the caption's nearest container; pieces are its row-like descendants
      // (record id + kind badge + silo + tick, §V4-9) that are not the caption itself.
      let section: Element | null = caption.parentElement;
      for (let depth = 0; section && depth < 3; depth++) {
        const rows = Array.from(section.querySelectorAll('li, [class*="row"], [class*="piece"], [data-testid*="piece"]'))
          .filter((r) => (r.textContent ?? '').trim().length > 8);
        if (rows.length > 0) return rows.length;
        section = section.parentElement;
      }
      return 0;
    };
    return { read: countFor(/^read\b/i), written: countFor(/^written\b/i) };
  });
}

test('AC43: inspector-tab-memory shows Read and Written ledgers with ≥1 piece each; clicking a piece deep-links into the Archive focused on that node', async ({
  page,
}) => {
  await bootBoard(page, { seed: 42 });

  // Start every single backlog card so memory traffic flows (§V2-3: working units REQUEST
  // pieces periodically and SEND on completion).
  const singles = await singleCardsIn(page, 'backlog');
  const ids = singles.map((c) => c.taskId);
  for (const id of ids) await moveCardViaSim(page, id, 'do');

  // AC43: "tick until memory events occurred" — both directions.
  await tickUntilTickerMatches(page, /memory[\s_-]?query/i, {
    chunk: 10,
    maxChunks: 160,
    label: 'memory_query (§V2-3 request)',
  });
  await tickUntilTickerMatches(page, /memory[\s_-]?update/i, {
    chunk: 10,
    maxChunks: V4_BUDGET_LONG.maxChunks,
    label: 'memory_update (§V2-3 send-on-completion)',
  });

  // Find a card whose memory ledger has ≥1 piece in BOTH sections.
  let chosen: string | null = null;
  let counts: MemorySections = { read: 0, written: 0 };
  const found = await tickUntil(
    page,
    async () => {
      for (const id of ids) {
        if ((await cardById(page, id).count()) === 0) continue;
        await openInspectorFor(page, id);
        const memTab = page.locator(SEL4.inspectorTabMemory);
        if ((await memTab.count()) === 0) continue;
        await memTab.click();
        counts = await memorySectionCounts(page);
        if (counts.read >= 1 && counts.written >= 1) {
          chosen = id;
          return true;
        }
      }
      return false;
    },
    { chunk: 20, maxChunks: 40 },
  );
  expect(
    found && chosen !== null,
    `some card's inspector-tab-memory must show ≥1 Read piece AND ≥1 Written piece after ` +
      `memory_query + memory_update events fired (AC43/§V4-9); last counts: ${JSON.stringify(counts)}`,
  ).toBe(true);

  // Mark and click the first Read piece, capturing its row text for the deep-link check.
  const pieceText = await page.evaluate(() => {
    const inspector = document.querySelector('[data-testid="inspector"]');
    if (!inspector) return '';
    const caption = Array.from(inspector.querySelectorAll('*')).find((el) => {
      const own = (el.textContent ?? '').trim();
      return el.children.length <= 2 && own.length <= 16 && /^read\b/i.test(own);
    });
    let section: Element | null = caption?.parentElement ?? null;
    for (let depth = 0; section && depth < 3; depth++) {
      const row = Array.from(
        section.querySelectorAll('li, [class*="row"], [class*="piece"], [data-testid*="piece"]'),
      ).find((r) => (r.textContent ?? '').trim().length > 8);
      if (row) {
        row.setAttribute('data-e2e-first-piece', '1');
        return (row.textContent ?? '').trim();
      }
      section = section.parentElement;
    }
    return '';
  });
  expect(pieceText.length, 'a clickable Read piece row must exist (AC43/§V4-9)').toBeGreaterThan(8);
  await page.locator('[data-e2e-first-piece]').first().click();

  // AC43: "clicking a piece opens the Archive focused on that node" (§V4-9 deep link).
  const memOverlay = page.locator(SEL3.memoryOverlay);
  await expect(memOverlay, 'the Archive overlay must open from the piece deep-link (AC43/§V4-9)').toBeVisible();
  const idToken = (pieceText.match(/[\w]+[-:][\w-]+/) ?? pieceText.split(/\s+/).sort((a, b) => b.length - a.length))[0];
  await expect
    .poll(async () => {
      const focusNode = await page
        .locator('[data-testid^="memory-node-"]')
        .evaluateAll((nodes: Element[]) =>
          nodes.some(
            (n) =>
              /\b(focus(ed)?|selected|active)\b/i.test(n.getAttribute('class') ?? '') ||
              n.getAttribute('aria-current') !== null ||
              (n.getAttribute('data-state') ?? '').toLowerCase() === 'focused',
          ),
        );
      if (focusNode) return true;
      const overlayText = ((await memOverlay.innerText()) ?? '').toLowerCase();
      return overlayText.includes(idToken.toLowerCase().replace(/:/g, '-')) || overlayText.includes(idToken.toLowerCase());
    }, {
      message: `the Archive must focus the deep-linked node (focused/selected node state, or the piece's record "${idToken}" surfaced) (AC43/§V4-9)`,
    })
    .toBe(true);
});
