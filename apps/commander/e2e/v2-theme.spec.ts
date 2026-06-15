/**
 * v2-theme.spec.ts — SPEC-V2 §V2-8 AC15 (Aegis Cogitator theme), reinterpreted under SPEC-V3:
 * the "v1 boot AC1 assertions" become their V3 equivalents (board boots, backlog populated,
 * counters present, no console errors) since the map canvas is retired.
 *
 * FROZEN input for implementation.
 */
import { expect, test } from '@playwright/test';
import { bootBoard, cardsInColumn, SEL3 } from './helpers-v3';

test('AC15: Cogitator theme boots — parchment field, brass-border custom property, serif small-caps headers; V3 boot assertions hold', async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => consoleErrors.push(String(err)));

  await bootBoard(page, { seed: 42 });

  // AC15: "body/background resolves to the parchment family" — V2-1: warm aged-paper
  // #e9dcbe family. Assert the effective page background is warm (r ≥ g ≥ b, clearly light).
  const bg = await page.evaluate(() => {
    const pick = (el: Element | null): string | null => {
      if (!el) return null;
      const c = getComputedStyle(el).backgroundColor;
      return c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent' ? c : null;
    };
    return (
      pick(document.body) ?? pick(document.documentElement) ?? pick(document.getElementById('root'))
    );
  });
  expect(bg, 'page background color must be resolvable (AC15)').toBeTruthy();
  const rgb = bg!.match(/\d+(\.\d+)?/g)?.slice(0, 3).map(Number) ?? [];
  expect(rgb.length).toBe(3);
  const [r, g, b] = rgb;
  expect(
    r >= g && g >= b && r >= 180 && r - b >= 20,
    `background ${bg} must be in the warm parchment family (#e9dcbe-ish: r ≥ g ≥ b, light, warm; AC15/V2-1)`,
  ).toBe(true);

  // AC15: "panels carry the brass-border custom property (assert via computed styles/CSS vars)".
  const brass = await page.evaluate(() => {
    // Find a custom property whose name mentions brass declared anywhere in the stylesheets,
    // then confirm it resolves to a non-empty value on a rendered panel/lane element.
    const varNames = new Set<string>();
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of Array.from(rules)) {
        const text = rule.cssText ?? '';
        for (const m of text.matchAll(/--[\w-]*brass[\w-]*/gi)) varNames.add(m[0]);
      }
    }
    // Inline style declarations too.
    for (const el of Array.from(document.querySelectorAll('[style*="--"]'))) {
      for (const m of (el.getAttribute('style') ?? '').matchAll(/--[\w-]*brass[\w-]*/gi)) {
        varNames.add(m[0]);
      }
    }
    const candidates: Element[] = [
      ...Array.from(document.querySelectorAll('[data-testid^="kanban-col-"]')),
      ...Array.from(document.querySelectorAll('[data-testid="kanban-board"]')),
      document.documentElement,
    ];
    for (const name of varNames) {
      for (const el of candidates) {
        const v = getComputedStyle(el).getPropertyValue(name).trim();
        if (v) return { name, value: v };
      }
    }
    return null;
  });
  expect(
    brass,
    'a brass-border CSS custom property (--*brass*) must be declared and resolve on the panels (AC15/V2-1)',
  ).not.toBeNull();

  // AC15: "display headers render the serif small-caps stack" — V2-1: 'Iowan Old Style',
  // 'Palatino Linotype', Georgia, serif. The lane headers are etched small-caps headers (V3-1).
  const headerStyle = await page.evaluate(() => {
    const lanes = Array.from(document.querySelectorAll('[data-testid^="kanban-col-"]'));
    for (const lane of lanes) {
      for (const el of [lane, ...Array.from(lane.querySelectorAll('*'))]) {
        const cs = getComputedStyle(el);
        const ff = cs.fontFamily.toLowerCase();
        if (/iowan|palatino|georgia|serif/.test(ff) && (el.textContent ?? '').trim() !== '') {
          return { fontFamily: cs.fontFamily, fontVariant: cs.fontVariantCaps, transform: cs.textTransform };
        }
      }
    }
    return null;
  });
  expect(
    headerStyle,
    'lane headers must render the serif display stack (Iowan/Palatino/Georgia/serif; AC15/V2-1)',
  ).not.toBeNull();
  expect(
    headerStyle!.fontVariant === 'small-caps' ||
      headerStyle!.transform === 'uppercase' ||
      /small-caps/.test(headerStyle!.fontVariant),
    `headers must read as small-caps (font-variant-caps small-caps or uppercase transform); saw ${JSON.stringify(headerStyle)}`,
  ).toBe(true);

  // "the v1 boot AC1 assertions still hold" — V3 reinterpretation: board + populated backlog +
  // topbar counters + no console errors (the unit-sprite count is retired with the map).
  await expect(page.locator(SEL3.board)).toBeVisible();
  await expect.poll(() => cardsInColumn(page, 'backlog').count()).toBeGreaterThanOrEqual(5);
  const topbarNumbers = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[data-testid^="topbar-"]')).flatMap((el) =>
      ((el.textContent ?? '').match(/\d+(?:\.\d+)?/g) ?? []).map(Number),
    ),
  );
  expect(
    topbarNumbers.some((n) => n > 0),
    'at least one topbar counter (e.g. tasks total) must be non-zero at boot (AC1 under V3 — units is legitimately 0)',
  ).toBe(true);
  const errors = consoleErrors.filter((t) => !/favicon/i.test(t));
  expect(errors).toEqual([]);
});
