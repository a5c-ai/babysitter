/**
 * UX-R2 §13.3 semantic status color system — AC-38 (token presence + exact
 * values + COLUMN_SPECS token discipline) and AC-39 (CI-enforced WCAG
 * contrast guard). Owner gate 2026-07-05 run 01KWRR8XAHFCDEGCRBRFHFF44W:
 * 4-column taxonomy + color map (token values are final and carry the
 * measured ratios).
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";
import { COLUMN_SPECS } from "@/components/kanban/kanban-column";
import { GROUP_ORDER } from "@/components/kanban/column-model";

const GLOBALS_CSS = readFileSync(
  path.resolve(__dirname, "../../app/globals.css"),
  "utf-8"
);

/** §13.3 token table — dark theme (labels on #0a0a0b). */
const DARK_TOKENS: Record<string, string> = {
  "--status-attention": "#FFD700",
  "--status-attention-muted": "rgba(255, 215, 0, 0.15)",
  "--status-alive": "#00F0FF",
  "--status-alive-muted": "rgba(0, 240, 255, 0.12)",
  "--status-stalled": "#C9A86A",
  "--status-stalled-muted": "rgba(201, 168, 106, 0.14)",
  "--status-failed": "#FF3366",
  "--status-failed-muted": "rgba(255, 51, 102, 0.18)",
  "--status-ok": "#00FF88",
  "--status-ok-muted": "rgba(0, 255, 136, 0.15)",
  "--status-aged": "#9A9AA3",
  "--status-aged-muted": "rgba(154, 154, 163, 0.12)",
};

/** §13.3 token table — light theme (labels on #ffffff). */
const LIGHT_TOKENS: Record<string, string> = {
  // Live-verify 2026-07-05 (banner-segment-contrast-light): darkened from
  // #8a6d00 (4.12:1 on the composited error-muted banner tint) to #7e6400
  // (4.73:1 there, 5.66:1 on white) — §13.3 requires >=4.5:1 everywhere
  // the token labels text, including muted-tint surfaces.
  "--status-attention": "#7e6400",
  "--status-attention-muted": "rgba(212, 175, 0, 0.12)",
  "--status-alive": "#006E7A",
  "--status-alive-muted": "rgba(0, 200, 214, 0.10)",
  // UX-R3 §14.4 / AC-57 (owner gate 2026-07-06 ruling, option a): nudged from
  // #7A6431 → #6B5B47 (cooler grey-taupe) so ΔE2000 vs light attention gold
  // rises 8.5 → 17.6 (parity with dark). AA on #ffffff = 6.54:1. Supersedes the
  // §13.3 light --status-stalled value and its AC-38/AC-39 rows.
  "--status-stalled": "#6B5B47",
  "--status-stalled-muted": "rgba(122, 100, 49, 0.10)",
  "--status-failed": "#B01C47",
  "--status-failed-muted": "rgba(230, 41, 90, 0.12)",
  "--status-ok": "#00784A",
  "--status-ok-muted": "rgba(0, 204, 110, 0.12)",
  "--status-aged": "#63636C",
  "--status-aged-muted": "rgba(161, 161, 170, 0.10)",
};

/** Slice globals.css into the dark (:root) and light theme blocks. */
function themeBlock(theme: "dark" | "light"): string {
  const lightStart = GLOBALS_CSS.indexOf('[data-theme="light"]');
  expect(lightStart).toBeGreaterThan(-1);
  return theme === "dark"
    ? GLOBALS_CSS.slice(0, lightStart)
    : GLOBALS_CSS.slice(lightStart, GLOBALS_CSS.indexOf("@theme inline"));
}

/** Extract a custom property's declared value from a CSS block. */
function tokenValue(block: string, token: string): string | null {
  // Word-boundary guard: --status-attention must not match ...-muted.
  const match = block.match(
    new RegExp(`${token.replace(/[-]/g, "\\-")}\\s*:\\s*([^;]+);`)
  );
  return match ? match[1].trim() : null;
}

/** WCAG 2.x relative luminance of a #rrggbb color. */
function luminance(hex: string): number {
  const clean = hex.replace("#", "");
  const channels = [0, 2, 4]
    .map((i) => parseInt(clean.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/** WCAG contrast ratio between two #rrggbb colors. */
function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const LABEL_TOKENS = Object.keys(DARK_TOKENS).filter(
  (token) => !token.endsWith("-muted")
);

describe("UX-R2 §13.3 status tokens (AC-38)", () => {
  it("AC-38: the dark theme defines all 12 --status-* tokens with exactly the §13.3 values", () => {
    const block = themeBlock("dark");
    for (const [token, value] of Object.entries(DARK_TOKENS)) {
      expect(tokenValue(block, token), `dark ${token}`).toBe(value);
    }
  });

  it("AC-38: the light theme defines all 12 --status-* tokens with exactly the §13.3 values", () => {
    const block = themeBlock("light");
    for (const [token, value] of Object.entries(LIGHT_TOKENS)) {
      expect(tokenValue(block, token), `light ${token}`).toBe(value);
    }
  });

  it("AC-38: every --status-* token is exposed to Tailwind via @theme inline --color-status-*", () => {
    for (const token of Object.keys(DARK_TOKENS)) {
      const themed = `--color${token.slice(1)}: var(${token});`;
      expect(GLOBALS_CSS.includes(themed), themed).toBe(true);
    }
  });

  it("AC-38: COLUMN_SPECS header classes reference status tokens — no zinc hardcodes, no brand --primary, no alpha-diluted status text", () => {
    for (const key of GROUP_ORDER) {
      const headerClass = COLUMN_SPECS[key].headerClass;
      expect(headerClass, `${key} uses a status token`).toMatch(
        /^text-status-(attention|alive|stalled|failed|ok|aged)$/
      );
    }
    // Sweep every class string on the specs (headerClass, emptyClass, ...).
    const allClasses = GROUP_ORDER.flatMap((key) => {
      const spec = COLUMN_SPECS[key] as unknown as Record<string, unknown>;
      return Object.values(spec).filter((v): v is string => typeof v === "string");
    }).join(" ");
    expect(allClasses).not.toMatch(/text-zinc-/);
    expect(allClasses).not.toMatch(/text-primary/);
    expect(allClasses).not.toMatch(/text-(error|warning|success|info|status-[a-z]+)\/\d+/);
  });

  it("§13.3 red-is-terminal (static guard): no Stalled/Working/Needs-you spec class references error/failed red", () => {
    for (const key of ["needsyou", "waiting", "stalled"] as const) {
      const spec = COLUMN_SPECS[key] as unknown as Record<string, unknown>;
      const classes = Object.values(spec)
        .filter((v): v is string => typeof v === "string")
        .join(" ");
      expect(classes, `${key} never red`).not.toMatch(/text-(error|status-failed)/);
    }
  });
});

describe("UX-R2 §13.3 contrast guard (AC-39)", () => {
  it("AC-39: every dark label token clears 4.5:1 on the #0a0a0b background", () => {
    const block = themeBlock("dark");
    for (const token of LABEL_TOKENS) {
      const value = tokenValue(block, token);
      expect(value, `dark ${token} present`).toBeTruthy();
      const ratio = contrastRatio(value as string, "#0a0a0b");
      expect(ratio, `dark ${token} = ${value} → ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("AC-39: every light label token clears 4.5:1 on the #ffffff background", () => {
    const block = themeBlock("light");
    for (const token of LABEL_TOKENS) {
      const value = tokenValue(block, token);
      expect(value, `light ${token} present`).toBeTruthy();
      const ratio = contrastRatio(value as string, "#ffffff");
      expect(ratio, `light ${token} = ${value} → ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });

  // Live-verify 2026-07-05 (banner-segment-contrast-light): white-only checks
  // missed that --status-attention also labels text on composited muted tints.
  // Guard every light-theme surface the token actually sits on:
  //   #fce5eb = error-muted rgba(230,41,90,.12) over #fff (banner red segment)
  //   #faf5e0 = warning-muted rgba(212,175,0,.12) over #fff (NEEDS YOU panel,
  //             amber banner, run-list "Answer in terminal" badge)
  //   #f5edc5 = attention-muted over the warning-muted panel (option chips)
  //   #fbfbfb = background-secondary/40 over #fff (board column header)
  it("§13.3 live-verify guard: light --status-attention clears 4.5:1 on every composited surface it labels", () => {
    const block = themeBlock("light");
    const attention = tokenValue(block, "--status-attention");
    expect(attention, "light --status-attention present").toBeTruthy();
    const surfaces: Record<string, string> = {
      "error-muted banner segment": "#fce5eb",
      "warning-muted panel/badge": "#faf5e0",
      "attention-muted option chip on panel": "#f5edc5",
      "board column header": "#fbfbfb",
    };
    for (const [surface, bg] of Object.entries(surfaces)) {
      const ratio = contrastRatio(attention as string, bg);
      expect(
        ratio,
        `light --status-attention = ${attention} on ${surface} (${bg}) → ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });
});

// ---------------------------------------------------------------------------
// UX-R3 §14.2/§14.4 — ACTION hue guard + stalled-nudge proximity guard.
// Owner gate 2026-07-06 ruling (option a): magenta = brand only, a new
// indigo-violet --action hue carries the primary CTA, and light --status-stalled
// is nudged for a wider ΔE from attention gold. AC-50/51/54/57.
// ---------------------------------------------------------------------------

/** Expected --action token values (final, per §14.2 option a). */
const ACTION_DARK: Record<string, string> = {
  "--action": "#6355F0",
  "--action-hover": "#5544E8",
  "--action-foreground": "#ffffff",
  "--action-muted": "rgba(99, 85, 240, 0.16)",
  "--action-border": "rgba(99, 85, 240, 0.35)",
};
const ACTION_LIGHT: Record<string, string> = {
  "--action": "#4B3FD6",
  "--action-hover": "#3B30B8",
  "--action-foreground": "#ffffff",
  "--action-muted": "rgba(75, 63, 214, 0.10)",
  "--action-border": "rgba(75, 63, 214, 0.30)",
};

/** sRGB #rrggbb → CIE L*a*b* (D65), for CIEDE2000. */
function hexToLab(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => {
    const v = parseInt(clean.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  // Linear sRGB → XYZ (D65).
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const [fx, fy, fz] = [f(x), f(y), f(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** CIEDE2000 color difference between two #rrggbb colors. */
function ciede2000(hexA: string, hexB: string): number {
  const [L1, a1, b1] = hexToLab(hexA);
  const [L2, a2, b2] = hexToLab(hexB);
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Math.pow(Cbar, 7) / (Math.pow(Cbar, 7) + Math.pow(25, 7))));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const h1p = (Math.atan2(b1, a1p) * deg + 360) % 360;
  const h2p = (Math.atan2(b2, a2p) * deg + 360) % 360;
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    const diff = h2p - h1p;
    if (Math.abs(diff) <= 180) dhp = diff;
    else dhp = diff > 180 ? diff - 360 : diff + 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * rad) / 2);
  const Lbar = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;
  let hbarp = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) > 180) hbarp = (hbarp + (hbarp < 360 ? 360 : -360)) / 2;
    else hbarp = hbarp / 2;
  } else {
    hbarp = hbarp;
  }
  const T =
    1 -
    0.17 * Math.cos((hbarp - 30) * rad) +
    0.24 * Math.cos(2 * hbarp * rad) +
    0.32 * Math.cos((3 * hbarp + 6) * rad) -
    0.2 * Math.cos((4 * hbarp - 63) * rad);
  const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));
  const Rc = 2 * Math.sqrt(Math.pow(Cbarp, 7) / (Math.pow(Cbarp, 7) + Math.pow(25, 7)));
  const Sl = 1 + (0.015 * Math.pow(Lbar - 50, 2)) / Math.sqrt(20 + Math.pow(Lbar - 50, 2));
  const Sc = 1 + 0.045 * Cbarp;
  const Sh = 1 + 0.015 * Cbarp * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt(
    Math.pow(dLp / Sl, 2) +
      Math.pow(dCp / Sc, 2) +
      Math.pow(dHp / Sh, 2) +
      Rt * (dCp / Sc) * (dHp / Sh)
  );
}

const STATUS_LABELS = LABEL_TOKENS; // the six --status-* label tokens

describe("UX-R3 §14.2 action hue (AC-50/51/54)", () => {
  it("AC-50: both themes define the four+border --action tokens with exactly the §14.2 values", () => {
    for (const [theme, expected] of [
      ["dark", ACTION_DARK],
      ["light", ACTION_LIGHT],
    ] as const) {
      const block = themeBlock(theme);
      for (const [token, value] of Object.entries(expected)) {
        expect(tokenValue(block, token), `${theme} ${token}`).toBe(value);
      }
    }
  });

  it("AC-50: --action tokens are exposed to Tailwind via @theme inline --color-action*", () => {
    for (const token of Object.keys(ACTION_DARK)) {
      const themed = `--color${token.slice(1)}: var(${token});`;
      expect(GLOBALS_CSS.includes(themed), themed).toBe(true);
    }
  });

  it("AC-51: the action label (--action-foreground on --action) clears 4.5:1 in both themes", () => {
    for (const [theme, expected] of [
      ["dark", ACTION_DARK],
      ["light", ACTION_LIGHT],
    ] as const) {
      const ratio = contrastRatio(expected["--action"], "#ffffff");
      expect(
        ratio,
        `${theme} white-on-${expected["--action"]} → ${ratio.toFixed(2)}:1`
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("AC-54: --action is ≥20 ΔE2000 from every --status-* label in both themes (no status collision)", () => {
    for (const [theme, action, tokens] of [
      ["dark", ACTION_DARK["--action"], DARK_TOKENS],
      ["light", ACTION_LIGHT["--action"], LIGHT_TOKENS],
    ] as const) {
      for (const token of STATUS_LABELS) {
        const de = ciede2000(action, tokens[token]);
        expect(
          de,
          `${theme} ΔE(--action ${action}, ${token} ${tokens[token]}) = ${de.toFixed(1)}`
        ).toBeGreaterThanOrEqual(20);
      }
    }
  });
});

describe("UX-R3 §14.4 stalled-nudge proximity guard (AC-57)", () => {
  it("AC-57: ΔE2000(attention, stalled) ≥ 15 in BOTH themes", () => {
    for (const [theme, tokens] of [
      ["dark", DARK_TOKENS],
      ["light", LIGHT_TOKENS],
    ] as const) {
      const de = ciede2000(tokens["--status-attention"], tokens["--status-stalled"]);
      expect(
        de,
        `${theme} ΔE(attention ${tokens["--status-attention"]}, stalled ${tokens["--status-stalled"]}) = ${de.toFixed(1)}`
      ).toBeGreaterThanOrEqual(15);
    }
  });

  it("AC-57: light --status-stalled === #6B5B47 and clears 4.5:1 on #ffffff", () => {
    const block = themeBlock("light");
    const stalled = tokenValue(block, "--status-stalled");
    expect(stalled).toBe("#6B5B47");
    const ratio = contrastRatio(stalled as string, "#ffffff");
    expect(ratio, `light stalled on white → ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
  });
});
