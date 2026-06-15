import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadInstructions } from './instructions.js';

describe('context/instructions', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'genty-instructions-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('loads AGENTS.md from cwd', () => {
    writeFileSync(join(tempDir, 'AGENTS.md'), 'Project rules here');
    const result = loadInstructions(tempDir);
    expect(result.agentInstructions).toHaveLength(1);
    expect(result.agentInstructions[0]).toContain('Project rules');
    expect(result.sources).toContain(join(tempDir, 'AGENTS.md'));
  });

  it('loads GENTY.md from cwd', () => {
    writeFileSync(join(tempDir, 'GENTY.md'), 'Genty specific config');
    const result = loadInstructions(tempDir);
    expect(result.agentInstructions).toHaveLength(1);
    expect(result.agentInstructions[0]).toContain('Genty specific');
  });

  it('loads SYSTEM.md in append mode by default', () => {
    writeFileSync(join(tempDir, 'SYSTEM.md'), 'Extra system instructions');
    const result = loadInstructions(tempDir);
    expect(result.systemPrompt).toBe('Extra system instructions');
    expect(result.systemPromptMode).toBe('append');
  });

  it('loads SYSTEM.md in replace mode with frontmatter', () => {
    writeFileSync(join(tempDir, 'SYSTEM.md'), '---\nmode: replace\n---\nCustom system prompt');
    const result = loadInstructions(tempDir);
    expect(result.systemPrompt).toBe('Custom system prompt');
    expect(result.systemPromptMode).toBe('replace');
  });

  it('returns none mode when no SYSTEM.md exists', () => {
    const result = loadInstructions(tempDir);
    expect(result.systemPromptMode).toBe('none');
    expect(result.systemPrompt).toBeUndefined();
  });

  it('loads from parent directories', () => {
    const childDir = join(tempDir, 'sub', 'deep');
    mkdirSync(childDir, { recursive: true });
    writeFileSync(join(tempDir, 'AGENTS.md'), 'Parent rules');
    writeFileSync(join(childDir, 'AGENTS.md'), 'Child rules');

    const result = loadInstructions(childDir);
    expect(result.agentInstructions.length).toBeGreaterThanOrEqual(2);
    expect(result.agentInstructions.some(i => i.includes('Parent rules'))).toBe(true);
    expect(result.agentInstructions.some(i => i.includes('Child rules'))).toBe(true);
  });
});
