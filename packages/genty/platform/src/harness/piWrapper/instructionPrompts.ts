import { existsSync, readFileSync, statSync } from "node:fs";
import * as path from "node:path";

const CLAUDE_MD_FILENAME = "CLAUDE.md";
const AGENTS_MD_FILENAME = "AGENTS.md";

function pathExistsAsFile(filePath: string): boolean {
  try {
    return statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function findInstructionTraversalRoot(startDir: string): string {
  let current = path.resolve(startDir);

  for (;;) {
    if (existsSync(path.join(current, ".git"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(startDir);
    }
    current = parent;
  }
}

export function discoverRepoInstructionPrompts(startDir: string): string[] {
  const resolvedStart = path.resolve(startDir);
  const traversalRoot = findInstructionTraversalRoot(resolvedStart);
  const directories: string[] = [];

  let current = resolvedStart;
  for (;;) {
    directories.push(current);
    if (current === traversalRoot) {
      break;
    }
    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }

  const prompts: string[] = [];
  for (const dir of directories.reverse()) {
    const claudePath = path.join(dir, CLAUDE_MD_FILENAME);
    const agentsPath = path.join(dir, AGENTS_MD_FILENAME);
    const selectedPath = pathExistsAsFile(claudePath)
      ? claudePath
      : pathExistsAsFile(agentsPath)
        ? agentsPath
        : undefined;
    if (!selectedPath) {
      continue;
    }

    const relativeLabel = path.relative(traversalRoot, selectedPath) || path.basename(selectedPath);
    prompts.push(
      [
        `Repository instructions from ${relativeLabel}:`,
        readFileSync(selectedPath, "utf8"),
      ].join("\n"),
    );
  }

  return prompts;
}
