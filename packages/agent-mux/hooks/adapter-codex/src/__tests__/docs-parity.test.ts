import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { createAdapter } from '../adapter';

function readRepoFile(...segments: string[]): string {
  return fs.readFileSync(path.resolve(__dirname, '..', '..', '..', ...segments), 'utf8');
}

function extractSection(doc: string, heading: string, level = 2): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const marker = '#'.repeat(level);
  const match = doc.match(new RegExp(`^${marker} ${escaped}\\n([\\s\\S]*?)(?=^${marker} |\\Z)`, 'm'));
  expect(match, `missing section ${heading}`).not.toBeNull();
  return match![0];
}

describe('Codex docs parity', () => {
  const caps = createAdapter('codex');

  it('keeps the adapter integration guide aligned with Codex capabilities', () => {
    const guide = readRepoFile('docs', 'adapter-integration-guide.md');
    const codexSection = extractSection(guide, 'Codex');

    expect(codexSection).toContain('**Env persistence:** Wrapper only');
    expect(codexSection).toContain('| Env persistence | Wrapper only |');
    expect(codexSection).toContain('a5c-hooks-mux exec --session-id "$AGENT_SESSION_ID" -- ...');
    expect(codexSection).toContain('single `hooks-mux` registration per Codex hook event');

    for (const note of caps.notes ?? []) {
      expect(codexSection).toContain(note);
    }
  });

  it('documents Codex under wrapper execution, not runtime-hook propagation', () => {
    const propagationDoc = readRepoFile('docs', 'session-context-propagation.md');
    const runtimeHookSection = extractSection(propagationDoc, 'Mode B: Runtime Hook', 3);
    const wrapperSection = extractSection(propagationDoc, 'Mode C: Wrapper Execution', 3);

    expect(runtimeHookSection).not.toContain('Codex');
    expect(wrapperSection).toContain('**Used by:** Codex, Gemini, Copilot, Cursor');
  });

  it('keeps the spec aligned with wrapper-based Codex env propagation', () => {
    const spec = readRepoFile('specs.request.md');
    const codexSection = extractSection(spec, '17.2 Codex adapter');

    expect(codexSection).toContain('provide wrapper-based env propagation for downstream shell execution');
    expect(spec).toContain('`notes` is the machine-readable source of truth');
    expect(caps.envPersistenceMode).toBe('wrapper_only');
  });
});
