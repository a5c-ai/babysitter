/**
 * FROZEN acceptance tests — SPEC-vibekanban §10, non-functional guards
 * (AC-28, AC-29).
 *
 * Unlike the other frozen kanban tests, these do not import the (not yet
 * existing) board modules: they guard the repo surface itself, so they run —
 * and must stay green — both before and after the board implementation lands.
 *
 * - AC-28: no new runtime dependency (drag-and-drop libs explicitly absent).
 * - AC-29: src/components/kanban/** contains no non-GET fetch, no fs/journal
 *   writing imports, and the only server-action import is approveBreakpoint
 *   (reached via the existing BreakpointApproval component).
 */

import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import path from "path";

const REPO_ROOT = path.resolve(__dirname, "../../..");
const KANBAN_DIR = path.join(REPO_ROOT, "src", "components", "kanban");

/**
 * Frozen snapshot of the runtime dependency list on the base branch
 * (feat/observer-liveness-r2). AC-28: the board must not add ANY runtime
 * dependency — @tanstack/react-virtual (virtualization) is already present.
 *
 * @a5c-ai/babysitter-sdk was added later (PR #1413 review): the
 * approve-breakpoint server action must go through the SDK's supported
 * commit path (commitEffectResult) instead of hand-writing run files. It is
 * NOT a board dependency; the kanban AC-28 freeze still holds for UI deps.
 */
const FROZEN_RUNTIME_DEPENDENCIES = [
  "@a5c-ai/babysitter-sdk",
  "@radix-ui/react-accordion",
  "@radix-ui/react-dialog",
  "@radix-ui/react-scroll-area",
  "@radix-ui/react-separator",
  "@radix-ui/react-slot",
  "@radix-ui/react-tabs",
  "@radix-ui/react-tooltip",
  "@tanstack/react-virtual",
  "class-variance-authority",
  "clsx",
  "lucide-react",
  "next",
  "react",
  "react-dom",
  "tailwind-merge",
  "ulid",
].sort();

/** Recursively collect .ts/.tsx source files (skipping test files). */
function collectSourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectSourceFiles(full));
    } else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry)) {
      out.push(full);
    }
  }
  return out;
}

describe("kanban non-functional guards (SPEC-vibekanban AC-28, AC-29)", () => {
  it("AC-28: package.json runtime dependency list is unchanged (no new deps for the board)", () => {
    const pkg = JSON.parse(
      readFileSync(path.join(REPO_ROOT, "package.json"), "utf-8")
    ) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    expect(Object.keys(pkg.dependencies ?? {}).sort()).toEqual(FROZEN_RUNTIME_DEPENDENCIES);
  });

  it("AC-28: no drag-and-drop library appears anywhere in dependencies or devDependencies", () => {
    const pkg = JSON.parse(
      readFileSync(path.join(REPO_ROOT, "package.json"), "utf-8")
    ) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const allDeps = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ];
    // Known DnD ecosystems (SPEC §1 out-of-scope: "no DnD dependency").
    const dndPattern = /(^|\/)(react-)?(dnd|dnd-kit|beautiful-dnd|sortable(js)?|draggable|drag-drop|pragmatic-drag-and-drop)/i;
    const offenders = allDeps.filter((d) => dndPattern.test(d));
    expect(offenders).toEqual([]);
  });

  it("AC-29: src/components/kanban/** contains no non-GET fetch calls", () => {
    const files = collectSourceFiles(KANBAN_DIR);
    const offenders: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      // A fetch with an explicit mutating method is a new write path — forbidden.
      if (/method\s*:\s*["'`](POST|PUT|PATCH|DELETE)["'`]/i.test(content)) {
        offenders.push(path.relative(REPO_ROOT, file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("AC-29: src/components/kanban/** imports no fs / journal-writing code", () => {
    const files = collectSourceFiles(KANBAN_DIR);
    const offenders: string[] = [];
    const forbiddenImport =
      /from\s+["'](node:)?fs(\/promises)?["']|require\(\s*["'](node:)?fs(\/promises)?["']\s*\)|from\s+["'][^"']*(journal-writer|append-journal|write-journal)[^"']*["']/;
    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      if (forbiddenImport.test(content)) {
        offenders.push(path.relative(REPO_ROOT, file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it("AC-29: the only server-action import reachable from src/components/kanban/** is approveBreakpoint", () => {
    const files = collectSourceFiles(KANBAN_DIR);
    const offenders: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, "utf-8");
      // Any import from the server-actions tree other than approve-breakpoint
      // (which itself should arrive via the existing BreakpointApproval
      // component, not a new call site) is a contract violation.
      const actionImports =
        content.match(/from\s+["']@\/app\/actions\/[^"']+["']/g) ?? [];
      for (const imp of actionImports) {
        if (!imp.includes("approve-breakpoint")) {
          offenders.push(`${path.relative(REPO_ROOT, file)}: ${imp}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
