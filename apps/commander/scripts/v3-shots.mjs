/* Self-check screenshots for the v3-r1 polish round (not part of the e2e suite). */
import { chromium } from '@playwright/test';

const BASE = 'http://localhost:5199';
const OUT = 'e2e/__shots__';

const tick = (page, n) => page.evaluate((k) => window.__commander.sim.tick(k), n);

async function tickUntil(page, fn, { chunk = 10, maxChunks = 80 } = {}) {
  for (let i = 0; i < maxChunks; i += 1) {
    if (await fn()) return true;
    await tick(page, chunk);
  }
  return fn();
}

const main = async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
  await page.addInitScript(() => {
    const iv = setInterval(() => {
      if (window.__commander?.sim?.pause) {
        window.__commander.sim.pause();
        clearInterval(iv);
      }
    }, 5);
  });
  await page.goto(`${BASE}/?seed=42`);
  await page.waitForFunction(() => Boolean(window.__commander));
  await page.waitForSelector('[data-testid="kanban-board"]');
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/v3-r1-after-boot-board.png` });

  // card close-up (boot backlog card)
  const card = page.locator('[data-testid="kanban-col-backlog"] [data-testid^="card-"]').first();
  const box = await card.boundingBox();
  await page.screenshot({
    path: `${OUT}/v3-r1-after-card-closeup.png`,
    clip: { x: Math.max(0, box.x - 30), y: Math.max(0, box.y - 30), width: box.width + 60, height: box.height + 80 },
  });

  // mid-flow: start all backlog singles, wait for inquiries in the dock
  const singles = await page.evaluate(() => {
    const lane = document.querySelector('[data-testid="kanban-col-backlog"]');
    const isCard = (el) => {
      const t = el.getAttribute('data-testid') ?? '';
      return t.startsWith('card-') && !t.startsWith('card-agent-') && !t.startsWith('card-yolo-');
    };
    const out = [];
    for (const c of Array.from(lane.querySelectorAll('[data-testid^="card-"]')).filter(isCard)) {
      const parent = c.parentElement?.closest('[data-testid^="card-"]');
      const hasKids = Array.from(c.querySelectorAll('[data-testid^="card-"]')).some(isCard);
      if (!parent && !hasKids) out.push(c.getAttribute('data-testid').slice(5));
    }
    return out;
  });
  for (const id of singles) {
    await page.evaluate((taskId) => window.__commander.sim.moveCard(taskId, 'do'), id);
  }
  await tick(page, 1);
  const got = await tickUntil(page, async () =>
    page.evaluate(() => {
      const dock = document.querySelector('[data-testid="chat-dock"]');
      if (!dock) return false;
      return (
        Array.from(dock.querySelectorAll('[data-testid^="inquiry-"]')).filter(
          (el) => !(el.getAttribute('data-testid') ?? '').startsWith('inquiry-opt-'),
        ).length >= 2
      );
    }),
  );
  console.log('inquiries appeared:', got);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/v3-r1-after-dock-inquiries.png` });

  // archive overlay with a node hovered
  await page.keyboard.press('m');
  await page.waitForSelector('[data-testid="memory-overlay"]');
  const node = page.locator('[data-testid^="memory-node-"]').first();
  await node.hover();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/v3-r1-after-archive-hover.png` });
  await node.click();
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/v3-r1-after-archive-selected.png` });
  await page.keyboard.press('Escape');

  // review panel with an open diff
  const ok = await tickUntil(
    page,
    async () =>
      (await page
        .locator('[data-testid="kanban-col-human-review"] [data-testid^="card-"]:not([data-testid^="card-agent-"]):not([data-testid^="card-yolo-"])')
        .count()) > 0,
    { chunk: 10, maxChunks: 120 },
  );
  console.log('human-review card present:', ok);
  if (ok) {
    await page
      .locator('[data-testid="kanban-col-human-review"] [data-testid^="card-"]:not([data-testid^="card-agent-"]):not([data-testid^="card-yolo-"])')
      .first()
      .click();
    await page.waitForSelector('[data-testid="review-panel"]');
    const file = page.locator('[data-testid^="ws-file-"]').first();
    if (await file.count()) await file.click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/v3-r1-after-review-diff.png` });
  }

  await browser.close();
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
