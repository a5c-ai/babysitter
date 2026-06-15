import * as os from 'node:os';
import * as path from 'node:path';
import * as fs from 'node:fs';

export type SkillScope = 'global' | 'project';

export interface SkillPaths {
  global: string;
  project: string;
}

export function findProjectRoot(startDir = process.cwd()) {
  let current = path.resolve(startDir);
  while (true) {
    if (
      fs.existsSync(path.join(current, '.git')) ||
      fs.existsSync(path.join(current, '.a5c')) ||
      fs.existsSync(path.join(current, '.claude.json')) ||
      fs.existsSync(path.join(current, '.claude'))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) return startDir;
    current = parent;
  }
}

const HOME = os.homedir() || '.';

const REGISTRY: Record<string, SkillPaths> = {
  claude: {
    global: path.join(HOME, '.claude', 'skills'),
    project: path.join('.claude', 'skills'),
  },
  'claude-code': {
    global: path.join(HOME, '.claude', 'skills'),
    project: path.join('.claude', 'skills'),
  },
  codex: {
    global: path.join(HOME, '.codex', 'skills'),
    project: path.join('.codex', 'skills'),
  },
  cursor: {
    global: path.join(HOME, '.cursor', 'skills'),
    project: path.join('.cursor', 'skills'),
  },
  opencode: {
    global: path.join(HOME, '.opencode', 'skills'),
    project: path.join('.opencode', 'skills'),
  },
  gemini: {
    global: path.join(HOME, '.gemini', 'skills'),
    project: path.join('.gemini', 'skills'),
  },
  copilot: {
    global: path.join(HOME, '.copilot', 'skills'),
    project: path.join('.copilot', 'skills'),
  },
};

export function getSkillPaths(agent: string, projectRoot = findProjectRoot()): SkillPaths | null {
  const entry = REGISTRY[agent];
  if (!entry) return null;
  return {
    global: entry.global,
    project: path.isAbsolute(entry.project)
      ? entry.project
      : path.join(projectRoot, entry.project),
  };
}

export function getSkillDir(agent: string, scope: SkillScope, projectRoot = findProjectRoot()): string | null {
  const p = getSkillPaths(agent, projectRoot);
  if (!p) return null;
  return scope === 'global' ? p.global : p.project;
}

export function listSupportedAgents(): string[] {
  return Object.keys(REGISTRY);
}
