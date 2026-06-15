import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, parse as parsePath, resolve } from 'node:path';
import { homedir } from 'node:os';

export interface LoadedInstructions {
  agentInstructions: string[];
  systemPrompt?: string;
  systemPromptMode: 'replace' | 'append' | 'none';
  sources: string[];
}

export function loadInstructions(cwd: string): LoadedInstructions {
  const agentInstructions: string[] = [];
  const sources: string[] = [];

  // 1. Global: ~/.genty/agent/AGENTS.md
  const globalAgentsPath = join(homedir(), '.genty', 'agent', 'AGENTS.md');
  if (existsSync(globalAgentsPath)) {
    agentInstructions.push(readFileSync(globalAgentsPath, 'utf8'));
    sources.push(globalAgentsPath);
  }

  // 2. Walk parent directories from cwd to root
  const parentPaths = collectParentPaths(cwd);
  for (const dir of parentPaths) {
    const agentsPath = join(dir, 'AGENTS.md');
    if (existsSync(agentsPath)) {
      agentInstructions.push(readFileSync(agentsPath, 'utf8'));
      sources.push(agentsPath);
    }
    const gentyMdPath = join(dir, 'GENTY.md');
    if (existsSync(gentyMdPath)) {
      agentInstructions.push(readFileSync(gentyMdPath, 'utf8'));
      sources.push(gentyMdPath);
    }
  }

  // 3. CWD itself (if not already included)
  for (const name of ['AGENTS.md', 'GENTY.md']) {
    const cwdPath = join(cwd, name);
    if (existsSync(cwdPath) && !sources.includes(cwdPath)) {
      agentInstructions.push(readFileSync(cwdPath, 'utf8'));
      sources.push(cwdPath);
    }
  }

  // 4. SYSTEM.md
  let systemPrompt: string | undefined;
  let systemPromptMode: 'replace' | 'append' | 'none' = 'none';

  const systemMdPath = join(cwd, 'SYSTEM.md');
  if (existsSync(systemMdPath)) {
    const content = readFileSync(systemMdPath, 'utf8');
    const { mode, body } = parseSystemMd(content);
    systemPrompt = body;
    systemPromptMode = mode;
    sources.push(systemMdPath);
  }

  return { agentInstructions, systemPrompt, systemPromptMode, sources };
}

export interface InstructionsLoadedEvent {
  sources: string[];
  agentInstructions: string[];
  systemPrompt?: string;
  systemPromptMode: 'replace' | 'append' | 'none';
}

export async function loadInstructionsWithHook(
  cwd: string,
  emitEvent?: (event: InstructionsLoadedEvent) => Promise<void> | void,
): Promise<LoadedInstructions> {
  const result = loadInstructions(cwd);
  if (emitEvent) {
    const mutableEvent: InstructionsLoadedEvent = {
      sources: [...result.sources],
      agentInstructions: [...result.agentInstructions],
      systemPrompt: result.systemPrompt,
      systemPromptMode: result.systemPromptMode,
    };
    await emitEvent(mutableEvent);
    return {
      agentInstructions: mutableEvent.agentInstructions,
      systemPrompt: mutableEvent.systemPrompt,
      systemPromptMode: mutableEvent.systemPromptMode,
      sources: mutableEvent.sources,
    };
  }
  return result;
}

function collectParentPaths(cwd: string): string[] {
  const paths: string[] = [];
  let current = resolve(cwd);
  const root = parsePath(current).root;

  // Walk up, excluding cwd itself (added separately) and root
  current = dirname(current);
  while (current !== root && current !== dirname(current)) {
    paths.unshift(current); // Parents first, then children
    current = dirname(current);
  }
  return paths;
}

function parseSystemMd(content: string): { mode: 'replace' | 'append'; body: string } {
  const lines = content.split('\n');
  let mode: 'replace' | 'append' = 'append';

  // Check for frontmatter
  if (lines[0]?.trim() === '---') {
    const endIdx = lines.indexOf('---', 1);
    if (endIdx > 0) {
      const frontmatter = lines.slice(1, endIdx).join('\n');
      if (frontmatter.includes('mode: replace')) mode = 'replace';
      return { mode, body: lines.slice(endIdx + 1).join('\n').trim() };
    }
  }

  return { mode, body: content.trim() };
}
